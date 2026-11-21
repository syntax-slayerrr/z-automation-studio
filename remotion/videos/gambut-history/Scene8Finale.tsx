import React from 'react';
import { AbsoluteFill } from 'remotion';
import { CUES, SCENES } from './story';
import {
  clamp,
  easeInOut,
  easeInOutCubic,
  easeOutCubic,
  GP,
  lerp,
  RetroSlabTitle3D,
  springSettle,
  VintagePostcardFrame,
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
 * SCENE 8 — PENUTUP: PEMULIHAN GAMBUT & POSTER DOKUMENTER VINTAGE (01:24–01:36)
 * 1. Smoke-veiled peat forest releasing rising luminous carbon particles (`CO2 / C`) into atmosphere.
 * 2. Dynamic Split-Screen Comparison: Dry burning peat (left) vs Restored wet peat with canal-blocking dam (right)!
 * 3. Restoration sweeps across entire frame -> camera glides from saturated wet soil upward to thriving peat forest!
 * 4. Collectible Cream-Bordered Vintage Documentary Poster pull-out locking on exact verbatim closing message:
 *    "TERBENTUK SELAMA RIBUAN TAHUN." / "JANGAN BIARKAN TERBAKAR DALAM HITUNGAN HARI." -> smooth fade out!
 */
export const Scene8Finale: React.FC<{ f: number }> = ({ f }) => {
  const s8Start = SCENES.s8Start;
  const totalFrames = SCENES.totalFrames;
  const localF = Math.max(0, f - s8Start);

  // Phase 1: Rising carbon particles & smoke (s8Start .. s8_split)
  const splitAppearT = easeInOutCubic((f - (CUES.s8_split - 12)) / 24);
  // Phase 2: Split divider sweeps leftwards (restoration conquers dry land!)
  const restoreSweepT = easeInOutCubic((f - (CUES.s8_restore - 8)) / 52);
  // Phase 3: Camera rises from wet peat soil to wide panoramic canopy + Vintage Poster mat pull-out!
  const cameraRiseT = easeInOutCubic((f - (CUES.s8_restore + 10)) / 78);
  const postcardMatT = easeInOutCubic((f - (CUES.s8_finale + 10)) / 32);
  const finaleTitleT = springSettle((f - (CUES.s8_finale + 16)) / 24);
  const finalFade = f > totalFrames - 22 ? 1 - easeInOut((f - (totalFrames - 22)) / 22) : 1;

  // Split X starts off-right (760), rests at center (360) for comparison, then sweeps off-left (-20) as wet restoration wins!
  const splitX =
    restoreSweepT > 0.01 ? lerp(360, -24, restoreSweepT) : lerp(750, 360, splitAppearT);

  const horizonY = lerp(520, 665, cameraRiseT);
  const camScale = lerp(1.08, 1.0, cameraRiseT);

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#191C1A', opacity: finalFade }}>
      <VintagePostcardFrame matProgress={postcardMatT}>
        <svg width={720} height={1280} viewBox="0 0 720 1280" style={{ position: 'absolute', inset: 0 }}>
          <PeatPainterDefs />
          <defs>
            <clipPath id="s8RestoredClip">
              <rect x={splitX} y={0} width={760 - splitX} height={1280} />
            </clipPath>
          </defs>

          <g transform={`translate(360, 620) scale(${camScale.toFixed(3)}) translate(-360, -620)`}>
            {/* === BASE LAYER (LEFT SIDE OF SPLIT): DRY, SMOKING & CARBON-RELEASING PEATLAND === */}
            {splitX > -10 && (
              <g>
                <PeatSky f={f} mood="smoulder_haze" />
                <PeatForestHorizon f={f} horizonY={horizonY} dryness={1} waterOpacity={0} smokeOpacity={0.85} />
                <PeatSwampTree x={112} baseY={horizonY + 42} scale={0.86} dryness={1} />
                <PeatCutawayStrata
                  f={f}
                  topY={horizonY + 42}
                  waterTableY={1320}
                  showWaterLine={false}
                  dryness={1}
                  smoulderT={0.95}
                  smoulderSpread={0.78}
                  smoulderCenterX={220}
                />

                {/* Rising Carbon Molecules & Smoke Particles (CO2 / C) Drifting into Atmosphere! */}
                {Array.from({ length: 20 }).map((_, ci) => {
                  const p = (localF * 0.011 + ci * 0.12) % 1;
                  const cx = 64 + ((ci * 79) % 590) + Math.sin(p * 6 + ci) * 24;
                  const cy = lerp(horizonY + 25, 110, p);
                  const isCarbonTag = ci % 4 === 0;
                  return (
                    <g key={ci} transform={`translate(${cx.toFixed(1)}, ${cy.toFixed(1)})`} opacity={Math.sin(p * Math.PI) * 0.85}>
                      {isCarbonTag ? (
                        <g>
                          <circle r={16} fill="#262024" fillOpacity={0.76} stroke="#C8BEB8" strokeWidth={1.4} />
                          <text y={4} textAnchor="middle" fill="#FAF1DC" fontFamily='"Plus Jakarta Sans", sans-serif' fontSize={10.5} fontWeight={800}>
                            CO₂
                          </text>
                        </g>
                      ) : (
                        <circle r={3.5 + (ci % 3) * 2} fill="#B8B0B4" opacity={0.62} />
                      )}
                    </g>
                  );
                })}
              </g>
            )}

            {/* === CLIPPED RIGHT LAYER (SWEEPS FULL SCREEN!): RESTORED WET LUSH PEATLAND === */}
            {splitAppearT > 0.01 && (
              <g clipPath="url(#s8RestoredClip)">
                <PeatSky f={f} mood="misty_morning" sunX={540} sunY={355} sunR={42} />
                <PeatCloud x={lerp(135, 175, localF / 400)} y={208} scale={0.96} tone="day" opacity={0.92} />
                <PeatCloud x={lerp(610, 565, localF / 400)} y={232} scale={0.86} tone="day" opacity={0.86} flip />

                {/* Peaceful Forest Birds Gliding Across Restored Morning Sky */}
                {cameraRiseT > 0.2 &&
                  [0, 1, 2, 3].map((bi) => {
                    const bx = ((195 + bi * 58 + localF * (0.48 + bi * 0.08)) % 680) + 20;
                    const by = 378 + (bi % 2) * 26 + Math.sin(f * 0.1 + bi) * 5;
                    const wing = Math.sin(f * 0.22 + bi * 1.6) * 4;
                    return (
                      <path
                        key={bi}
                        d={`M ${bx - 9} ${by + wing} Q ${bx - 4} ${by - 4}, ${bx} ${by} Q ${bx + 4} ${by - 4}, ${bx + 9} ${by + wing}`}
                        fill="none"
                        stroke={GP.ink}
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        opacity={cameraRiseT * 0.72}
                      />
                    );
                  })}

                {/* Lush Thriving Tropical Peat Swamp Forest + Reflective Tannin Water */}
                <PeatForestHorizon f={f} horizonY={horizonY} dryness={0} waterOpacity={1} />

                {/* Iconic Wooden Canal-Blocking Dam (Sekat Kanal) Holding Water High During Split Restoration! */}
                {restoreSweepT < 0.85 && (
                  <g transform={`translate(535, ${horizonY + 46})`} opacity={clamp(1 - cameraRiseT * 1.15, 0, 1)}>
                    <rect x={-48} y={-22} width={96} height={24} fill="#6E4E35" stroke={GP.ink} strokeWidth={1.6} />
                    {[-36, -18, 0, 18, 36].map((px) => (
                      <rect key={px} x={px - 5} y={-28} width={10} height={34} rx={2} fill="#8C6646" stroke={GP.ink} strokeWidth={1.3} />
                    ))}
                    <text
                      x={0}
                      y={-36}
                      textAnchor="middle"
                      fill="#B6ECFA"
                      stroke={GP.ink}
                      strokeWidth={3}
                      paintOrder="stroke fill"
                      fontFamily='"Plus Jakarta Sans", sans-serif'
                      fontSize={11}
                      fontWeight={800}
                      letterSpacing="1.6px"
                    >
                      SEKAT KANAL · PEMBASAHAN
                    </text>
                  </g>
                )}

                {/* Framing Hero Tropical Peat Swamp Trees (Left & Right) */}
                <PeatSwampTree x={78} baseY={horizonY + 95} scale={1.12} dryness={0} swayDeg={Math.sin(f * 0.045) * 1.3} />
                <PeatSwampTree x={648} baseY={horizonY + 102} scale={1.16} dryness={0} swayDeg={-Math.sin(f * 0.045) * 1.3} flip />

                {/* Saturated Healthy Wet Peat Cutaway Below Reflective Swamp Floor */}
                <PeatCutawayStrata
                  f={f}
                  topY={horizonY + 72}
                  waterTableY={horizonY + 80}
                  showWaterLine={cameraRiseT < 0.65}
                  dryness={0}
                />

                {/* Foreground Sunlit Water-Reflection Swamp Pool on Final Panoramic Pull-Out */}
                {cameraRiseT > 0.25 && (
                  <g opacity={easeOutCubic((cameraRiseT - 0.25) / 0.5)}>
                    <rect x={-20} y={horizonY + 24} width={760} height={580} fill="url(#gpSwampWaterGrad)" opacity={0.86} />
                    <rect x={-20} y={horizonY + 24} width={760} height={580} fill="url(#gpHorizontalBrush)" opacity={0.75} />
                    {/* Calm Golden-Cream Sun Reflections Rippling on Restored Peat Swamp Water */}
                    {Array.from({ length: 12 }).map((_, ri) => {
                      const ry = horizonY + 55 + ri * 42;
                      const rw = 42 + (ri % 4) * 28;
                      const rx = 380 + Math.sin(ri * 2.4 + f * 0.03) * 165;
                      return (
                        <line
                          key={ri}
                          x1={rx - rw}
                          y1={ry}
                          x2={rx + rw}
                          y2={ry}
                          stroke="#E4F0E4"
                          strokeWidth={2.2}
                          strokeLinecap="round"
                          opacity={0.34}
                        />
                      );
                    })}
                    {/* Lush Curved Mossy Peat Swamp Banks with Tropical Sedge Reeds & Ferns on Bottom-Left & Bottom-Right */}
                    <path d="M -30 985 Q 72 958, 168 1024 Q 214 1072, 232 1290 L -30 1290 Z" fill="#213E2C" />
                    <path d="M 750 974 Q 642 952, 544 1022 Q 498 1070, 482 1290 L 750 1290 Z" fill="#213E2C" />
                    <path d="M -30 1018 Q 62 996, 148 1054 Q 186 1094, 202 1290 L -30 1290 Z" fill="#375E3B" />
                    <path d="M 750 1008 Q 652 988, 562 1048 Q 522 1090, 504 1290 L 750 1290 Z" fill="#375E3B" />
                    {/* Sunlit Organic Tropical Reeds & Swamp Ferns Framing Foreground */}
                    <g stroke="#64904E" strokeWidth={3.2} strokeLinecap="round" fill="none" opacity={0.88}>
                      <path d="M 52 1038 Q 68 972, 92 932" />
                      <path d="M 78 1048 Q 98 986, 126 958" />
                      <path d="M 118 1068 Q 144 1018, 174 998" />
                      <path d="M 664 1028 Q 646 964, 622 926" />
                      <path d="M 634 1042 Q 614 980, 586 952" />
                      <path d="M 594 1064 Q 568 1016, 540 996" />
                    </g>
                    {/* Tiny Warm Golden Swamp Wildflowers & Fireflies */}
                    {[62, 108, 148, 578, 624, 668].map((fx, fi) => (
                      <circle key={fi} cx={fx} cy={1108 + (fi % 3) * 26} r={3.6} fill={fi % 2 === 0 ? '#F6D458' : '#E88E38'} opacity={0.86} />
                    ))}
                  </g>
                )}
              </g>
            )}

            {/* Crisp Luminous Split-Screen Divider Handle During Side-by-Side Comparison */}
            {splitX > 10 && splitX < 710 && (
              <g>
                <line x1={splitX} y1={0} x2={splitX} y2={1280} stroke="#FAF1DC" strokeWidth={3.5} />
                <circle cx={splitX} cy={510} r={18} fill="#18242C" stroke="#FAF1DC" strokeWidth={2.4} />
                <text x={splitX} y={515} textAnchor="middle" fill="#F8D348" fontSize={14} fontWeight={800}>
                  ◀▶
                </text>
                {/* Left vs Right Split Labels */}
                {splitX > 165 && (
                  <g transform={`translate(${Math.max(115, splitX * 0.5).toFixed(1)}, 170)`}>
                    <rect x={-96} y={-18} width={192} height={36} rx={4} fill="#2A1614" fillOpacity={0.9} stroke="#E6642E" strokeWidth={1.6} />
                    <text y={5} textAnchor="middle" fill="#F8B064" fontFamily='"Plus Jakarta Sans", sans-serif' fontSize={13} fontWeight={800} letterSpacing="2px">
                      GAMBUT KERING
                    </text>
                  </g>
                )}
                {splitX < 555 && (
                  <g transform={`translate(${Math.min(605, (splitX + 720) * 0.5).toFixed(1)}, 170)`}>
                    <rect x={-106} y={-18} width={212} height={36} rx={4} fill="#16322A" fillOpacity={0.9} stroke="#88D6B4" strokeWidth={1.6} />
                    <text y={5} textAnchor="middle" fill="#B8F0D4" fontFamily='"Plus Jakarta Sans", sans-serif' fontSize={13} fontWeight={800} letterSpacing="2px">
                      PEMULIHAN TATA AIR
                    </text>
                  </g>
                )}
              </g>
            )}
          </g>
        </svg>

        {/* === COLLECTIBLE VINTAGE DOCUMENTARY POSTER EXACT VERBATIM CLOSING MESSAGE === */}
        <RetroSlabTitle3D
          lines={['TERBENTUK SELAMA', 'RIBUAN TAHUN.']}
          subtitle="JANGAN BIARKAN TERBAKAR DALAM HITUNGAN HARI."
          top={142}
          fontSize={44}
          accentColor="#FAF1DC"
          subColor="#F8D348"
          opacity={clamp(finaleTitleT, 0, 1)}
          scale={lerp(0.86, 1.0, clamp(finaleTitleT, 0, 1.04))}
        />
      </VintagePostcardFrame>
    </AbsoluteFill>
  );
};
