import React from 'react';
import { AbsoluteFill, Img, useCurrentFrame } from 'remotion';

export type LightingMode =
  | 'directional_sun'
  | 'cartographic_restrained'
  | 'studio_cutaway'
  | 'campfire_flicker';

export interface LightingConfig {
  mode: LightingMode;
  /** Normalized key-light vector [x, y] (e.g. [0.85, -0.52] = upper-right sunlight). */
  lightDirection: [number, number];
  keyColor: string;
  fillColor: string;
  rimColor: string;
  rimLightIntensity: number;
  bounceColor: string;
  bounceIntensity: number;
  shadowColor: string;
  shadowSoftness: number;
  ambientOcclusion: number;
  /** Deterministic campfire flicker amplitude (0 for daylight, 0.22 for firelight). */
  flickerAmplitude?: number;
  /** Optional fire source coordinates [x%, y%] for localized radial firelight falloff. */
  pointLightPos?: [number, number];
}

export interface LiveLightingState extends LightingConfig {
  /** Live deterministic intensity multiplier (1.0 in daylight, oscillating ~0.82..1.18 near fire). */
  flicker: number;
  /** Live shadow sway offset in px driven by flickering flame movement. */
  shadowSwayX: number;
}

export const LIGHTING_PRESETS: Record<LightingMode, LightingConfig> = {
  directional_sun: {
    mode: 'directional_sun',
    lightDirection: [0.82, -0.57],
    keyColor: '#F9DC9E',
    fillColor: '#6C8CAE',
    rimColor: '#FDE8B4',
    rimLightIntensity: 0.9,
    bounceColor: '#C98952',
    bounceIntensity: 0.42,
    shadowColor: '#2B201E',
    shadowSoftness: 5,
    ambientOcclusion: 0.58,
    flickerAmplitude: 0,
  },
  cartographic_restrained: {
    mode: 'cartographic_restrained',
    lightDirection: [-0.65, -0.76],
    keyColor: '#F2DCAC',
    fillColor: '#2A5572',
    rimColor: '#E5BE6C',
    rimLightIntensity: 0.45,
    bounceColor: '#3A6B84',
    bounceIntensity: 0.18,
    shadowColor: '#122230',
    shadowSoftness: 8,
    ambientOcclusion: 0.4,
    flickerAmplitude: 0,
  },
  studio_cutaway: {
    mode: 'studio_cutaway',
    lightDirection: [-0.72, -0.68],
    keyColor: '#F5E5C8',
    fillColor: '#28586E',
    rimColor: '#68D8E6',
    rimLightIntensity: 0.72,
    bounceColor: '#3C7E94',
    bounceIntensity: 0.3,
    shadowColor: '#101B26',
    shadowSoftness: 10,
    ambientOcclusion: 0.62,
    flickerAmplitude: 0,
  },
  campfire_flicker: {
    mode: 'campfire_flicker',
    lightDirection: [0.0, 0.88],
    keyColor: '#F69A3C',
    fillColor: '#233A5C',
    rimColor: '#76A4D4',
    rimLightIntensity: 0.68,
    bounceColor: '#DF6D28',
    bounceIntensity: 0.78,
    shadowColor: '#11131E',
    shadowSoftness: 9,
    ambientOcclusion: 0.7,
    flickerAmplitude: 0.2,
    pointLightPos: [48, 66],
  },
};

const LightingContext = React.createContext<LiveLightingState>({
  ...LIGHTING_PRESETS.directional_sun,
  flicker: 1,
  shadowSwayX: 0,
});

export const useLightingRig = (): LiveLightingState => React.useContext(LightingContext);

export interface LightingProviderProps {
  config?: Partial<LightingConfig> & { mode: LightingMode };
  localFrame?: number;
  /** Optional static paper/film grain plate URL to unify SVG actors with painted backgrounds. */
  grainSrc?: string;
  grainIntensity?: number;
  children: React.ReactNode;
}

/**
 * Centralized Parametric Cinematic Lighting Rig.
 * Computes deterministic light flicker, directional shadows, atmospheric bloom,
 * and subtle non-boiling film grain overlay across the entire shot.
 */
export const LightingProvider: React.FC<LightingProviderProps> = ({
  config = { mode: 'directional_sun' },
  localFrame,
  grainSrc,
  grainIntensity = 0.045,
  children,
}) => {
  const globalFrame = useCurrentFrame();
  const f = localFrame ?? globalFrame;
  const preset = LIGHTING_PRESETS[config.mode];
  const merged: LightingConfig = { ...preset, ...config };

  const amp = merged.flickerAmplitude ?? 0;
  // Multi-harmonic deterministic organic fire flicker (never robotic sine loop!)
  const flicker =
    amp > 0
      ? 1 +
        amp *
          (0.52 * Math.sin(f * 0.37) +
            0.31 * Math.sin(f * 0.83 + 1.4) +
            0.17 * Math.cos(f * 1.41 + 0.6))
      : 1;
  const shadowSwayX = amp > 0 ? Math.sin(f * 0.29 + 0.5) * 8.5 + Math.cos(f * 0.67) * 3.5 : 0;

  const liveState: LiveLightingState = {
    ...merged,
    flicker,
    shadowSwayX,
  };

  const [px, py] = merged.pointLightPos ?? [50, 65];

  return (
    <LightingContext.Provider value={liveState}>
      <AbsoluteFill>
        {children}

        {/* Localized Volumetric Firelight Spill (active only in campfire_flicker mode) */}
        {merged.mode === 'campfire_flicker' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              zIndex: 44,
              background: `radial-gradient(ellipse 68% 46% at ${px}% ${py}%, ${merged.keyColor}44 0%, ${merged.bounceColor}20 42%, transparent 74%)`,
              opacity: 0.72 * flicker,
              mixBlendMode: 'screen',
            }}
          />
        )}

        {/* Restrained Cartographic Spotlight Vignette */}
        {merged.mode === 'cartographic_restrained' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              zIndex: 44,
              background: `radial-gradient(ellipse 76% 62% at 50% 48%, transparent 44%, ${merged.shadowColor}88 100%)`,
            }}
          />
        )}

        {/* Static Non-Boiling Film/Paper Grain Unifying SVG Actors & Procedural Plates */}
        {grainSrc && grainIntensity > 0 && (
          <Img
            src={grainSrc}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              pointerEvents: 'none',
              zIndex: 47,
              opacity: grainIntensity,
              mixBlendMode: 'overlay',
            }}
          />
        )}
      </AbsoluteFill>
    </LightingContext.Provider>
  );
};
