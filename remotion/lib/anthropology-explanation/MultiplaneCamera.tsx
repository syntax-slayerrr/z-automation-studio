import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { CameraMode, ColorScriptName, ODYSSEY_COLOR_SCRIPTS, clamp, easeInOutCubic } from './tokens';

export type DepthLayerRole = 'sky' | 'far' | 'mid' | 'subject' | 'foreground' | 'hud';

const PARALLAX_FACTORS: Record<DepthLayerRole, number> = {
  sky: 0.1,
  far: 0.28,
  mid: 0.56,
  subject: 1.0,
  foreground: 1.42,
  hud: 0.0,
};

interface CameraState {
  tx: number;
  ty: number;
  scale: number;
  progress: number;
  rackFocusBlur: Partial<Record<DepthLayerRole, number>>;
}

const CameraContext = React.createContext<CameraState>({
  tx: 0,
  ty: 0,
  scale: 1,
  progress: 0,
  rackFocusBlur: {},
});

export interface MultiplaneStageProps {
  /** Local frame inside the current shot (starts at 0). */
  localFrame?: number;
  /** Duration of the current shot in frames. */
  shotDurationFrames: number;
  cameraMode?: CameraMode;
  /** Intensity multiplier for built-in camera modes. */
  cameraStrength?: number;
  /** Explicit parametric camera offset [tx, ty] added on top of cameraMode (for custom crane/tracking curves). */
  cameraPosition?: [number, number];
  /** Explicit parametric zoom scale multiplier (default 1.0). */
  cameraZoom?: number;
  /** Subtle organic documentary handheld breathing drift (0 = tripod, 1.0 = subtle intimate handheld). */
  handheldIntensity?: number;
  /** Dynamic per-plane rack-focus blur in px (e.g. `{ foreground: 3.5, subject: 0, mid: 1.2 }`). */
  rackFocusBlur?: Partial<Record<DepthLayerRole, number>>;
  colorScript?: ColorScriptName;
  vignetteOpacity?: number;
  lightFrom?: 'right' | 'left' | 'none';
  children: React.ReactNode;
}

/**
 * MultiplaneStage v2.0: 5-Plane Parametric Filmic 2D Camera Rig.
 * Supports motivated dolly/pan/crane/tracking, dynamic rack-focus depth blur,
 * subtle organic handheld breathing, and overscan anti-edge-clipping.
 */
export const MultiplaneStage: React.FC<MultiplaneStageProps> = ({
  localFrame,
  shotDurationFrames,
  cameraMode = 'slow_push_in',
  cameraStrength = 1.0,
  cameraPosition,
  cameraZoom = 1.0,
  handheldIntensity = 0,
  rackFocusBlur = {},
  colorScript = 'sunlit_odyssey',
  vignetteOpacity = 0.24,
  lightFrom = 'right',
  children,
}) => {
  const globalFrame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const f = localFrame ?? globalFrame;
  const t = easeInOutCubic(clamp(f / Math.max(1, shotDurationFrames - 1), 0, 1));
  const palette = ODYSSEY_COLOR_SCRIPTS[colorScript];

  let tx = 0;
  let ty = 0;
  let scale = 1.0;

  switch (cameraMode) {
    case 'locked_off':
      break;
    case 'slow_push_in':
      tx = -14 * t * cameraStrength;
      ty = -8 * t * cameraStrength;
      scale = 1.0 + 0.065 * t * cameraStrength;
      break;
    case 'slow_pull_out':
      tx = 12 * (1 - t) * cameraStrength;
      ty = 6 * (1 - t) * cameraStrength;
      scale = 1.07 - 0.065 * t * cameraStrength;
      break;
    case 'gentle_pan_right':
      tx = (28 - 56 * t) * cameraStrength;
      scale = 1.045;
      break;
    case 'gentle_pan_left':
      tx = (-28 + 56 * t) * cameraStrength;
      scale = 1.045;
      break;
    case 'crane_reveal':
      tx = 8 * (1 - t) * cameraStrength;
      ty = (42 - 58 * t) * cameraStrength;
      scale = 1.06 - 0.04 * t * cameraStrength;
      break;
    case 'topdown_track':
      tx = (-20 + 40 * t) * cameraStrength;
      ty = (12 - 24 * t) * cameraStrength;
      scale = 1.025 + 0.03 * t * cameraStrength;
      break;
  }

  if (cameraPosition) {
    tx += cameraPosition[0];
    ty += cameraPosition[1];
  }
  scale *= cameraZoom;

  if (handheldIntensity > 0) {
    // Organic non-repeating multi-frequency handheld breathing sway
    tx += (Math.sin(f * 0.055) * 3.8 + Math.cos(f * 0.13 + 0.7) * 1.6) * handheldIntensity;
    ty += (Math.cos(f * 0.048 + 0.4) * 3.2 + Math.sin(f * 0.11) * 1.4) * handheldIntensity;
  }

  return (
    <CameraContext.Provider value={{ tx, ty, scale, progress: t, rackFocusBlur }}>
      <AbsoluteFill
        style={{
          width,
          height,
          overflow: 'hidden',
          backgroundColor: palette.deepInk,
        }}
      >
        {children}

        {/* Subtle directional sunlit atmospheric bloom */}
        {lightFrom !== 'none' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              zIndex: 43,
              background:
                lightFrom === 'right'
                  ? `radial-gradient(ellipse 68% 54% at 80% 24%, ${palette.keyLight}30 0%, ${palette.keyLight}10 46%, transparent 78%)`
                  : `radial-gradient(ellipse 68% 54% at 20% 24%, ${palette.keyLight}30 0%, ${palette.keyLight}10 46%, transparent 78%)`,
              mixBlendMode: 'screen',
            }}
          />
        )}

        {/* Tinted cinematic optical vignette (never pure black) */}
        {vignetteOpacity > 0 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              zIndex: 46,
              background: `radial-gradient(ellipse 84% 82% at 50% 48%, transparent 56%, ${palette.deepInk} 100%)`,
              opacity: vignetteOpacity,
            }}
          />
        )}
      </AbsoluteFill>
    </CameraContext.Provider>
  );
};

export interface DepthPlaneProps {
  role: DepthLayerRole;
  blurPx?: number;
  opacity?: number;
  overscan?: number;
  /** Override default parallax factor for fine-tuned staging. */
  parallaxDepth?: number;
  zIndex?: number;
  children: React.ReactNode;
}

export const DepthPlane: React.FC<DepthPlaneProps> = ({
  role,
  blurPx = 0,
  opacity = 1,
  overscan,
  parallaxDepth,
  zIndex,
  children,
}) => {
  const cam = React.useContext(CameraContext);
  const factor = parallaxDepth ?? PARALLAX_FACTORS[role];

  if (role === 'hud') {
    return (
      <AbsoluteFill style={{ zIndex: zIndex ?? 55, pointerEvents: 'none', opacity }}>
        {children}
      </AbsoluteFill>
    );
  }

  const planeTx = cam.tx * factor;
  const planeTy = cam.ty * factor;
  const planeScale = (overscan ?? (role === 'sky' ? 1.04 : 1.06)) * (1 + (cam.scale - 1) * Math.max(0.32, factor));
  const totalBlur = blurPx + (cam.rackFocusBlur[role] ?? 0);

  const defaultZ: Record<DepthLayerRole, number> = {
    sky: 1,
    far: 10,
    mid: 20,
    subject: 30,
    foreground: 40,
    hud: 55,
  };

  return (
    <AbsoluteFill
      style={{
        zIndex: zIndex ?? defaultZ[role],
        transform: `translate3d(${planeTx.toFixed(2)}px, ${planeTy.toFixed(2)}px, 0) scale(${planeScale.toFixed(4)})`,
        transformOrigin: '50% 50%',
        filter: totalBlur > 0.08 ? `blur(${totalBlur.toFixed(2)}px)` : undefined,
        opacity,
        willChange: 'transform',
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
