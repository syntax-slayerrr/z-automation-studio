import React from 'react';
import { AbsoluteFill } from 'remotion';
import { CUES, SCENES } from './story';
import {
  clamp,
  easeInOutCubic,
  easeOutCubic,
  GP,
  lerp,
  RetroSlabTitle3D,
  SmokeCurtainWipe,
  springSettle,
} from './fx';
import {
  PeatCutawayStrata,
  PeatForestHorizon,
  PeatPainterDefs,
  PeatSky,
  PeatSwampTree,
} from './peatPainter';

/**
 * SCENE 6 — API MENEMBUS TANAH (00:57–01:10)
 * Strictly follows Scientific Accuracy Note #6:
 *  - Phase 1: Open flame ONLY on dry twigs/brush at the surface, creeping down a dry peat fissure.
 *  - Phase 2: Camera plunges underground -> open surface flame disappears above frame!
 *    Inside dark organic peat, FLAMELESS glowing red-orange ember pockets creep horizontally & vertically along roots!
 *  - Phase 3: Translucent smoke curls upward through porous peat to surface + `SMOULDERING COMBUSTION` title
 *    -> thick painted smoke curtain rises to fill the frame into Scene 7!
 */
export const Scene6SmoulderingUnderground: React.FC<{ f: number }> = ({ f }) => {
  const s6Start = SCENES.s6Start;
  const s7Start = SCENES.s7Start;
  const localF = Math.max(0, f - s6Start);

  const surfaceBurnT = clamp(localF / 56, 0, 1);
  const undergroundDiveT = easeInOutCubic((f - (CUES.s6_underground - 18)) / 42);
  const smoulderSpreadT = easeInOutCubic((f - (CUES.s6_underground - 4)) / 108);
  const smoulderTitleT = springSettle((f - (CUES.s6_smoulder - 6)) / 20);
  const exitSmokeWipe = clamp((f - (s7Start - 22)) / 22, 0, 1);

  // Camera dives deep underground so surface retreats near top (y=365) giving huge room for subterranean cross-section!
  const surfaceY = lerp(555, 368, undergroundDiveT);
  const flameFlicker = Math.sin(f * 0.45) * 4;

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#251D22' }}>
      <svg width={720} height={1280} viewBox="0 0 720 1280" style={{ position: 'absolute', inset: 0 }}>
        <PeatPainterDefs />

        <PeatSky f={f} mood="smoulder_haze" />
        <PeatForestHorizon f={f} horizonY={surfaceY - 40} dryness={1} waterOpacity={0} smokeOpacity={0.75} />

        {/* Parched Surface Trees & Dry Surface Brush */}
        <PeatSwampTree x={96} baseY={surfaceY + 4} scale={0.78} dryness={1} />
        <PeatSwampTree x={625} baseY={surfaceY + 6} scale={0.82} dryness={1} flip />

        {/* === PHASE 1 ONLY: SURFACE OPEN FLAMES ON DRY VEGETATION (Fades out as camera dives underground!) === */}
        {undergroundDiveT < 0.88 && (
          <g opacity={clamp(1 - undergroundDiveT * 1.25, 0, 1)}>
            {[285, 345, 405, 455].map((fx, fi) => {
              const fh = (34 + (fi % 3) * 18) * clamp(surfaceBurnT * 1.5, 0.3, 1) + Math.sin(f * 0.4 + fi * 2) * 7;
              return (
                <g key={fi} transform={`translate(${fx}, ${surfaceY + 2})`}>
                  <ellipse cx={0} cy={-fh * 0.45} rx={36} ry={fh * 0.75} fill="#F47822" opacity={0.32} filter="url(#gpEmberBloom)" />
                  <path
                    d={`M -16 0 Q -12 ${(-fh * 0.65).toFixed(1)}, ${(flameFlicker * 0.6).toFixed(1)} ${(-fh).toFixed(1)} Q 14 ${(-fh * 0.6).toFixed(1)}, 16 0 Z`}
                    fill="#DF4A1E"
                  />
                  <path
                    d={`M -10 0 Q -6 ${(-fh * 0.5).toFixed(1)}, ${(flameFlicker * 0.4).toFixed(1)} ${(-fh * 0.76).toFixed(1)} Q 8 ${(-fh * 0.45).toFixed(1)}, 10 0 Z`}
                    fill="#F8A234"
                  />
                  <path
                    d={`M -5 0 Q 0 ${(-fh * 0.46).toFixed(1)}, 5 0 Z`}
                    fill="#FFF2AA"
                  />
                </g>
              );
            })}
            {/* Heat path creeping straight down fissure into peat layer */}
            <path
              d={`M 360 ${surfaceY} C 350 ${surfaceY + 45}, 372 ${surfaceY + 86}, 360 ${surfaceY + 135}`}
              fill="none"
              stroke="#F68A28"
              strokeWidth={6}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray="1"
              strokeDashoffset={1 - easeOutCubic((localF - 20) / 55)}
            />
          </g>
        )}

        {/* === DEEP PEAT CUTAWAY: SCIENTIFICALLY ACCURATE FLAMELESS SMOULDERING COMBUSTION! === */}
        <PeatCutawayStrata
          f={f}
          topY={surfaceY}
          waterTableY={1320}
          showWaterLine={false}
          dryness={1}
          smoulderT={easeOutCubic((localF - 24) / 48)}
          smoulderSpread={lerp(0.18, 1.0, smoulderSpreadT)}
          smoulderCenterX={360}
        />

        {/* Subtle Scientific Propagation Vectors Showing Horizontal & Vertical Underground Smouldering Spread */}
        {undergroundDiveT > 0.35 && (
          <g opacity={easeOutCubic((undergroundDiveT - 0.35) / 0.5)}>
            {/* Leftward Horizontal Creep Arrow */}
            <g transform={`translate(${lerp(245, 138, smoulderSpreadT).toFixed(1)}, ${surfaceY + 152})`}>
              <line x1={38} y1={0} x2={-14} y2={0} stroke="#F8D348" strokeWidth={2.6} strokeDasharray="6 4" />
              <polygon points="-24,0 -10,-7 -10,7" fill="#F8D348" />
            </g>
            {/* Rightward Horizontal Creep Arrow */}
            <g transform={`translate(${lerp(475, 582, smoulderSpreadT).toFixed(1)}, ${surfaceY + 152})`}>
              <line x1={-38} y1={0} x2={14} y2={0} stroke="#F8D348" strokeWidth={2.6} strokeDasharray="6 4" />
              <polygon points="24,0 10,-7 10,7" fill="#F8D348" />
            </g>
            {/* Downward Vertical Depth Creep Arrow */}
            <g transform={`translate(360, ${(surfaceY + lerp(225, 295, smoulderSpreadT)).toFixed(1)})`}>
              <line x1={0} y1={-32} x2={0} y2={12} stroke="#F8D348" strokeWidth={2.6} strokeDasharray="6 4" />
              <polygon points="0,22 -7,8 7,8" fill="#F8D348" />
            </g>

            {/* Clear Scientific Callout Labels (Distinguishing Flameless Smouldering!) */}
            <text
              x={360}
              y={surfaceY + 345}
              textAnchor="middle"
              fill="#F8D348"
              stroke={GP.ink}
              strokeWidth={3.4}
              paintOrder="stroke fill"
              fontFamily='"Plus Jakarta Sans", sans-serif'
              fontSize={13.5}
              fontWeight={800}
              letterSpacing="2.4px"
            >
              BARA MERAMBAT HORIZONTAL &amp; VERTIKAL · TANPA NYALA BESAR
            </text>
            <text
              x={360}
              y={surfaceY - 26}
              textAnchor="middle"
              fill="#DFDCE0"
              stroke={GP.ink}
              strokeWidth={3.2}
              paintOrder="stroke fill"
              fontFamily='"Plus Jakarta Sans", sans-serif'
              fontSize={12.5}
              fontWeight={800}
              letterSpacing="2.4px"
            >
              ASAP KELUAR MELALUI PORI TANAH ↑
            </text>
          </g>
        )}
      </svg>

      {/* Bold Scientific Term Reveal: SMOULDERING COMBUSTION */}
      <RetroSlabTitle3D
        lines={['SMOULDERING', 'COMBUSTION']}
        subtitle="PEMBAKARAN MEMBARA DI BAWAH TANAH"
        top={106}
        fontSize={44}
        accentColor="#F8A844"
        opacity={clamp(smoulderTitleT, 0, 1)}
        scale={lerp(0.84, 1.0, clamp(smoulderTitleT, 0, 1.04))}
      />

      {/* Rising Painted Smoke Curtain Wipe into Scene 7 */}
      <SmokeCurtainWipe progress={exitSmokeWipe * 0.5} tone="smoke" />
    </AbsoluteFill>
  );
};
