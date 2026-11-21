import React from 'react';
import { AbsoluteFill } from 'remotion';
import { CUES, SCENES } from './story';
import {
  clamp,
  easeInOutCubic,
  easeOutCubic,
  lerp,
  RetroSlabTitle3D,
  springSettle,
} from './fx';
import {
  BaseMistCollar,
  ErodedGouacheVolcano,
  LinelessGouacheCloud,
  PainterlyDefs,
  PainterlySky,
} from './painter';

/**
 * SCENE 1 — PEMBUKAAN (00:00–00:10) [V2 1:1 LINELESS PAINTERLY GOUACHE ENGINE]
 * 1. Archival charcoal canvas with glowing cream topographic contours scanning & drawing sequentially.
 * 2. Contours morph into an ERODED LINELESS GOUACHE GUNUNG GUNTUR bathed in warm dusk sunlight + cool indigo shadow!
 * 3. Billowing lineless base mist collar + foreground clouds part sideways over dappled painted Garut highland forests!
 * 4. Heroic push-in toward peak + 3D Alfa Slab One "GUNUNG GUNTUR / RAKSASA API GARUT" -> dissolves cleanly into 19th-century Garut map!
 */
export const Scene1Opening: React.FC<{ f: number }> = ({ f }) => {
  const s2Start = SCENES.s2Start;

  const contourDraw = easeOutCubic(f / 46);
  const morphT = easeInOutCubic((f - (CUES.s1_silhouette - 14)) / 42);
  const mistPartT = easeInOutCubic((f - (CUES.s1_mist - 16)) / 52);
  const titleT = springSettle((f - (CUES.s1_title - 8)) / 24);
  const peakPushT = easeInOutCubic((f - (CUES.s1_title - 6)) / Math.max(24, s2Start - (CUES.s1_title - 6)));

  const camScale = lerp(1.0, 1.08, morphT) + lerp(0, 0.28, peakPushT);
  const camY = lerp(24, 0, morphT) + lerp(0, 92, peakPushT);
  const scanY = lerp(1060, 260, easeInOutCubic(f / 58));

  const contours = [
    'M 110 835 Q 235 645, 360 532 T 610 835 Q 485 912, 360 908 T 110 835 Z',
    'M 168 810 Q 262 650, 360 568 T 552 810 Q 458 872, 360 868 T 168 810 Z',
    'M 226 785 Q 292 658, 360 602 T 494 785 Q 428 832, 360 828 T 226 785 Z',
    'M 280 756 Q 318 672, 360 636 T 440 756 Q 400 790, 360 788 T 280 756 Z',
    'M 322 722 Q 340 684, 360 666 T 398 722 Q 380 742, 360 740 T 322 722 Z',
  ];

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#1C191C' }}>
      <svg width={720} height={1280} viewBox="0 0 720 1280" style={{ position: 'absolute', inset: 0 }}>
        <PainterlyDefs />

        {/* === LAYER 0: ARCHIVAL CHARCOAL -> STREAKED GOUACHE DUSK SKY === */}
        <rect width={720} height={1280} fill="#1D1A1C" />
        <PainterlySky f={f} mood="dusk" sunX={192} sunY={475} sunR={46} opacity={morphT} />

        {/* Subtle Archival Survey Gridlines during Topographic Contour Scan */}
        <g opacity={(1 - morphT * 0.78) * 0.16} stroke="#E8DAC0" strokeWidth={1} strokeDasharray="4 8">
          {[200, 360, 520, 680, 840, 1000].map((gy) => (
            <line key={gy} x1={0} y1={gy} x2={720} y2={gy} />
          ))}
          {[120, 240, 360, 480, 600].map((gx) => (
            <line key={gx} x1={gx} y1={0} x2={gx} y2={1280} />
          ))}
        </g>

        {/* === 6-LAYER ATMOSPHERIC WORLD GROUP === */}
        <g transform={`translate(360, 640) scale(${camScale.toFixed(3)}) translate(-360, -640) translate(0, ${camY.toFixed(1)})`}>
          {/* LAYER 1: High Drifting Lineless Dusk Clouds */}
          <g opacity={morphT}>
            <LinelessGouacheCloud x={lerp(105, 165, f / 320)} y={230} scale={0.96} tone="dusk" opacity={0.88} />
            <LinelessGouacheCloud x={lerp(600, 540, f / 320)} y={295} scale={1.12} tone="dusk" opacity={0.86} flip />
            <LinelessGouacheCloud x={lerp(430, 485, f / 320)} y={415} scale={0.78} tone="dusk" opacity={0.74} />
          </g>

          {/* LAYER 2: Aerial-Perspective Far Priangan Ridges + Soft Mist Veil */}
          <g opacity={morphT}>
            <path d="M -60 760 L 65 668 L 190 718 L 320 652 L 485 710 L 625 645 L 780 730 L 780 960 L -60 960 Z" fill="#6F657A" />
            <rect x={-60} y={670} width={840} height={115} fill="#D8B69A" opacity={0.3} filter="url(#ptMistBlur)" />
          </g>

          {/* LAYER 3: HERO ERODED LINELESS GOUACHE GUNUNG GUNTUR (Zero black outline!) */}
          <g opacity={morphT}>
            {/* Subtle warm crater ember glow + soft thin mist wisp rising from summit */}
            <ellipse cx={356} cy={468} rx={48} ry={18} fill="#E8863C" opacity={0.34 * mistPartT} filter="url(#ptSoftShadow)" />
            <ErodedGouacheVolcano f={f} cx={360} baseY={825} peakY={448} halfW={410} mode="dusk" sunFromLeft />
            {/* Sun-wrap halation gently bleeding across left shoulder of volcano */}
            <circle cx={192} cy={475} r={145} fill="#FAF2D4" opacity={0.22} filter="url(#ptSunBloom)" />
            {/* Delicate painted fumarole wisp */}
            <path
              d={`M 358 456 Q ${344 + Math.sin(f * 0.08) * 10} 404, ${372 + Math.cos(f * 0.06) * 14} 355`}
              fill="none"
              stroke="#EADCC8"
              strokeWidth={9}
              strokeLinecap="round"
              opacity={0.26 * mistPartT}
              filter="url(#ptSoftShadow)"
            />
          </g>

          {/* === BEAT 1: TOPOGRAPHIC CONTOUR LINES SCANNING & MORPHING INTO GUNTUR === */}
          <g opacity={clamp(1 - (morphT - 0.35) / 0.65, 0, 1)}>
            {contours.map((d, ci) => {
              const p = easeOutCubic(contourDraw * 1.45 - ci * 0.14);
              return (
                <path
                  key={ci}
                  d={d}
                  fill="none"
                  stroke={ci >= 3 ? '#F4A24E' : '#F2E5C6'}
                  strokeWidth={ci === 4 ? 2.4 : 1.7}
                  strokeDasharray="1"
                  pathLength={1}
                  strokeDashoffset={1 - clamp(p, 0, 1)}
                  opacity={0.85 - ci * 0.06}
                />
              );
            })}
            {f < 65 && (
              <g opacity={clamp(1 - f / 65, 0, 1)}>
                <line x1={60} y1={scanY} x2={660} y2={scanY} stroke="#F8D348" strokeWidth={2.2} opacity={0.82} />
                <text x={648} y={scanY - 8} textAnchor="end" fill="#F8D348" fontFamily='"Plus Jakarta Sans", sans-serif' fontSize={12} fontWeight={700} letterSpacing="2px">
                  2.249 MDPL · GARUT
                </text>
              </g>
            )}
          </g>

          {/* LAYER 4: 1:1 DANAU TOBA BILLOWING BASE MIST COLLAR HUGGING VOLCANO FOOT! */}
          <g opacity={morphT}>
            <BaseMistCollar f={f} y={765} tone="dusk" opacity={0.94} />
          </g>

          {/* LAYER 5: DAPPLED PAINTERLY GARUT HIGHLAND FOREST CANOPY FLOOR (1:1 Danau Toba Panel 2!) */}
          <g opacity={morphT}>
            <path d="M -60 792 Q 160 772, 360 796 T 780 784 L 780 1280 L -60 1280 Z" fill="#3B5636" />
            <path d="M -60 858 Q 220 834, 460 864 T 780 848 L 780 1280 L -60 1280 Z" fill="#2A402A" />
            {/* Dappled painted foliage brush strokes across highland forest */}
            <g fill="#547444" opacity={0.34}>
              {Array.from({ length: 18 }).map((_, fi) => (
                <ellipse key={fi} cx={((fi * 97) % 740) - 10} cy={812 + (fi % 5) * 34} rx={58 + (fi % 3) * 24} ry={9} />
              ))}
            </g>
            <rect x={-60} y={775} width={840} height={520} fill="url(#ptHorizontalBrush)" opacity={0.95} />
          </g>

          {/* LAYER 6: FOREGROUND PARTING MIST CLOUDS FOR DEPTH PARALLAX */}
          {morphT > 0.05 && (
            <g opacity={morphT * (1 - peakPushT * 0.72)}>
              <LinelessGouacheCloud x={lerp(205, -185, mistPartT)} y={645} scale={1.85} tone="dusk" opacity={0.92} />
              <LinelessGouacheCloud x={lerp(525, 920, mistPartT)} y={685} scale={1.95} tone="dusk" opacity={0.92} flip />
            </g>
          )}
        </g>

        {/* Smooth Warm Archival Parchment Dissolve into Scene 2 Antique Map */}
        {peakPushT > 0.68 && (
          <rect width={720} height={1280} fill="#9A7A50" opacity={easeInOutCubic((peakPushT - 0.68) / 0.32) * 0.78} />
        )}
      </svg>

      {/* === BEAT 4: 1:1 ALFA SLAB ONE 3D BURNT-SIENNA VINTAGE POSTER TITLE === */}
      <RetroSlabTitle3D
        lines={['GUNUNG', 'GUNTUR']}
        subtitle="RAKSASA API GARUT"
        top={134}
        fontSize={68}
        opacity={clamp(titleT, 0, 1) * (1 - easeInOutCubic((peakPushT - 0.75) / 0.25))}
        scale={lerp(0.84, 1.0, clamp(titleT, 0, 1.05))}
      />
    </AbsoluteFill>
  );
};
