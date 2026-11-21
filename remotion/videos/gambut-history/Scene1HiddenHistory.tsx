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
  springSettle,
} from './fx';
import {
  PeatCloud,
  PeatCutawayStrata,
  PeatForestHorizon,
  PeatPainterDefs,
  PeatSky,
  PeatSwampTree,
} from './peatPainter';

/**
 * SCENE 1 — SEJARAH YANG TERSEMBUNYI (00:00–00:09)
 * 1. Low misty flyover across tropical Indonesian peat swamp forest with reflective tannin water.
 * 2. Smooth vertical dive into geological cutaway showing deep compressed organic peat strata.
 * 3. Time-rewind: ancient leaves, twigs & roots rise back out of dark layers toward primordial swamp.
 * 4. Seamless zoom onto center soil column morphing into Scene 2's core/Sebangau transition.
 */
export const Scene1HiddenHistory: React.FC<{ f: number }> = ({ f }) => {
  const s2Start = SCENES.s2Start;
  const flyoverT = easeInOutCubic(f / CUES.s1_cutaway);
  const diveT = easeInOutCubic((f - (CUES.s1_cutaway - 12)) / 48);
  const rewindT = easeInOutCubic((f - (CUES.s1_rewind - 6)) / 68);
  const exitZoomT = easeInOutCubic((f - (s2Start - 20)) / 20);

  const titleIn = springSettle((f - 8) / 24);
  const titleOut = 1 - easeOutCubic((f - (CUES.s1_cutaway - 18)) / 18);
  const titleAlpha = clamp(titleIn, 0, 1) * clamp(titleOut, 0, 1);

  // Camera dives vertically from forest canopy (horizonY=665) down to deep peat cutaway (horizonY=395)
  const horizonY = lerp(655, 398, diveT);
  const camScale = lerp(1.04, 1.0, flyoverT) * lerp(1.0, 1.18, exitZoomT);
  const parallaxX = lerp(-42, 34, flyoverT);

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#1E4A5C' }}>
      <svg width={720} height={1280} viewBox="0 0 720 1280" style={{ position: 'absolute', inset: 0 }}>
        <PeatPainterDefs />

        {/* Sky morphs subtly from cool misty morning -> warm ancient golden swamp during rewind */}
        <PeatSky f={f} mood="misty_morning" sunX={520} sunY={lerp(285, 190, diveT)} sunR={40} opacity={1} />
        <PeatSky f={f} mood="ancient_swamp" sunX={520} sunY={lerp(285, 190, diveT)} sunR={40} opacity={rewindT * 0.82} />

        <g transform={`translate(360, 640) scale(${camScale.toFixed(3)}) translate(-360, -640)`}>
          {/* Drifting Lineless Morning Clouds (Framed cleanly away from sun disc!) */}
          <PeatCloud x={lerp(110, 175, f / 240)} y={lerp(205, 130, diveT)} scale={0.94} tone="day" opacity={0.86} />
          <PeatCloud x={lerp(600, 545, f / 240)} y={lerp(205, 145, diveT)} scale={0.84} tone="day" opacity={0.82} flip />

          {/* Multi-Layer Tropical Peat Swamp Forest + Reflective Tannin Water */}
          <PeatForestHorizon
            f={f}
            horizonY={horizonY}
            dryness={0}
            waterOpacity={1 - diveT * 0.4}
            parallaxX={parallaxX}
          />

          {/* Foreground Framing Peat Swamp Trees Gliding Outward During Flyover Dive */}
          <g opacity={clamp(1 - diveT * 0.72, 0.25, 1)}>
            <PeatSwampTree
              x={lerp(36, -34, diveT)}
              baseY={horizonY + 88}
              scale={1.15}
              swayDeg={Math.sin(f * 0.05) * 1.4}
            />
            <PeatSwampTree
              x={lerp(686, 756, diveT)}
              baseY={horizonY + 94}
              scale={1.2}
              swayDeg={-Math.sin(f * 0.05) * 1.4}
              flip
            />
          </g>

          {/* Opening 00:00-00:03 Calm Reflective Mirror Swamp Water + Organic Mossy Reed Banks (Peels down smoothly into Cutaway!) */}
          {diveT < 0.96 && (
            <g opacity={clamp(1 - diveT * 1.35, 0, 1)}>
              <rect x={-20} y={horizonY + 52} width={760} height={640} fill="url(#gpSwampWaterGrad)" />
              <rect x={-20} y={horizonY + 52} width={760} height={640} fill="url(#gpHorizontalBrush)" opacity={0.78} />
              {/* Calm golden-cream sunlit mirror ripples across swamp water */}
              {Array.from({ length: 10 }).map((_, ri) => {
                const ry = horizonY + 86 + ri * 48;
                const rx = 360 + Math.sin(ri * 2.1 + f * 0.03) * 165;
                const rw = 44 + (ri % 4) * 26;
                return (
                  <line
                    key={ri}
                    x1={rx - rw}
                    y1={ry}
                    x2={rx + rw}
                    y2={ry}
                    stroke="#DCEEE6"
                    strokeWidth={2.2}
                    strokeLinecap="round"
                    opacity={0.34}
                  />
                );
              })}
              {/* Organic foreground mossy swamp banks & wild sedge reeds */}
              <path d="M -25 1035 Q 88 995, 198 1068 Q 225 1140, 232 1290 L -25 1290 Z" fill="#213D2B" />
              <path d="M -25 1065 Q 76 1035, 174 1098 L 198 1290 L -25 1290 Z" fill="#325838" />
              <path d="M 745 1020 Q 625 985, 518 1062 Q 492 1135, 482 1290 L 745 1290 Z" fill="#213D2B" />
              <path d="M 745 1052 Q 635 1025, 542 1094 L 515 1290 L 745 1290 Z" fill="#325838" />
              <g stroke="#5E8A4C" strokeWidth={3} strokeLinecap="round" fill="none" opacity={0.85}>
                <path d="M 48 1065 Q 60 1002, 74 965" />
                <path d="M 82 1072 Q 96 1012, 118 982" />
                <path d="M 656 1055 Q 642 992, 624 958" />
                <path d="M 622 1066 Q 608 1006, 586 978" />
              </g>
            </g>
          )}

          {/* Deep Geological Cutaway Peeling Up Smoothly Beneath Swamp Floor */}
          <g opacity={easeOutCubic((diveT - 0.12) / 0.55)}>
            <PeatCutawayStrata
              f={f}
              topY={horizonY + 52}
              waterTableY={horizonY + 62}
              showWaterLine={diveT > 0.45}
              dryness={0}
            />
          </g>

          {/* TIME-REWIND: Ancient Leaves, Twigs & Organic Plant Remnants Rising Back Toward Surface! */}
          {rewindT > 0.02 && (
            <g opacity={clamp(rewindT * 1.4, 0, 1)}>
              {Array.from({ length: 16 }).map((_, li) => {
                const startY = horizonY + 185 + (li % 5) * 95;
                const riseY = startY - rewindT * (145 + (li % 4) * 38);
                const lx = 88 + ((li * 97) % 544) + Math.sin(rewindT * 5 + li) * 16;
                const rot = (li * 42) - rewindT * 85;
                const isTwig = li % 3 === 0;
                return (
                  <g
                    key={li}
                    transform={`translate(${lx.toFixed(1)}, ${riseY.toFixed(1)}) rotate(${rot.toFixed(1)})`}
                    opacity={clamp(Math.sin(rewindT * Math.PI * 0.92) * 1.25, 0.2, 0.92)}
                  >
                    {isTwig ? (
                      <path d="M -18 0 Q 0 -5, 18 2 M 2 -2 L 10 -10" stroke="#A68256" strokeWidth={2.8} strokeLinecap="round" fill="none" />
                    ) : (
                      <g>
                        <path d="M -14 0 Q 0 -10, 16 0 Q 0 10, -14 0 Z" fill={li % 2 === 0 ? '#749C54' : '#B49456'} />
                        <line x1={-12} y1={0} x2={14} y2={0} stroke="#3B4E2B" strokeWidth={1.1} />
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Subtle Vintage Rewind Counter Indicator & Vertical Core Highlight Preview */}
              <g opacity={easeOutCubic((rewindT - 0.15) / 0.5)}>
                <rect
                  x={298}
                  y={horizonY + 54}
                  width={124}
                  height={480}
                  fill="none"
                  stroke="#FAF1DC"
                  strokeWidth={2}
                  strokeDasharray="10 7"
                  opacity={0.55 + exitZoomT * 0.4}
                />
                <text
                  x={360}
                  y={horizonY + 92}
                  textAnchor="middle"
                  fill="#FAF1DC"
                  stroke={GP.ink}
                  strokeWidth={3}
                  paintOrder="stroke fill"
                  fontFamily='"Plus Jakarta Sans", sans-serif'
                  fontSize={12}
                  fontWeight={800}
                  letterSpacing="2.4px"
                >
                  ARSIP KEHIDUPAN PURBA
                </text>
              </g>
            </g>
          )}
        </g>
      </svg>

      {/* Opening Vintage Poster Hero Title */}
      <RetroSlabTitle3D
        lines={['GAMBUT']}
        subtitle="WARISAN RIBUAN TAHUN · API YANG TERSEMBUNYI"
        top={134}
        fontSize={68}
        opacity={titleAlpha}
        scale={lerp(0.86, 1.0, clamp(titleIn, 0, 1.04))}
      />
    </AbsoluteFill>
  );
};
