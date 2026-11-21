import React from 'react';
import { AbsoluteFill } from 'remotion';
import { CUES, SCENES } from './story';
import {
  clamp,
  easeInOutCubic,
  easeOutCubic,
  EditorialBadge,
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
 * SCENE 3 — BAGAIMANA GAMBUT TERBENTUK? (00:21–00:34)
 * 1. Conceptual reconstruction of primordial flooded tropical peat swamp forest.
 * 2. Leaves, roots & branches fall into standing swamp water and settle on the submerged floor.
 * 3. Camera dives below water surface: sparse O2 micro-bubbles (`O2 MINIM`) -> very slow decay.
 * 4. Time-lapse accumulation building Fibric -> Hemic -> Sapric strata layer by layer + 4 crisp info badges:
 *    SISA TUMBUHAN · LINGKUNGAN TERGENANG · PENGURAIAN LAMBAT · AKUMULASI GAMBUT.
 */
export const Scene3PeatFormation: React.FC<{ f: number }> = ({ f }) => {
  const s3Start = SCENES.s3Start;
  const s4Start = SCENES.s4Start;
  const localF = Math.max(0, f - s3Start);

  const fallT = clamp((f - (CUES.s3_fall - 10)) / 105, 0, 1);
  const submergeDiveT = easeInOutCubic((f - (CUES.s3_low_o2 - 14)) / 42);
  const accumT = easeInOutCubic((f - (CUES.s3_layers - 12)) / Math.max(40, s4Start - CUES.s3_layers));
  const exitLiftT = easeInOutCubic((f - (s4Start - 16)) / 16);

  // Horizon lifts upward so underwater & subterranean peat cross-section occupies the lower 62%
  const waterSurfaceY = lerp(520, 425, submergeDiveT) + lerp(0, 140, exitLiftT);
  const peatFloorTopY = lerp(655, 510, accumT) + lerp(0, 140, exitLiftT);
  const peatThickness = lerp(0.32, 1.0, accumT);

  const badge1 = springSettle((f - (CUES.s3_fall - 4)) / 18);
  const badge2 = springSettle((f - (CUES.s3_swamp + 10)) / 18);
  const badge3 = springSettle((f - (CUES.s3_low_o2 - 2)) / 18);
  const badge4 = springSettle((f - (CUES.s3_layers - 2)) / 18);

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#244A4D' }}>
      <svg width={720} height={1280} viewBox="0 0 720 1280" style={{ position: 'absolute', inset: 0 }}>
        <PeatPainterDefs />

        {/* Primordial Tropical Flooded Swamp Sky */}
        <PeatSky f={f} mood="ancient_swamp" sunX={540} sunY={220} sunR={38} />
        <PeatCloud x={lerp(120, 185, localF / 380)} y={175} scale={0.92} tone="day" opacity={0.82} />
        <PeatCloud x={lerp(590, 530, localF / 380)} y={230} scale={0.84} tone="day" opacity={0.78} flip />

        {/* Lush Flooded Ancient Rainforest Horizon */}
        <PeatForestHorizon f={f} horizonY={waterSurfaceY - 45} dryness={0} waterOpacity={0} />
        <PeatSwampTree x={92} baseY={waterSurfaceY + 12} scale={0.88} swayDeg={Math.sin(f * 0.045) * 1.3} />
        <PeatSwampTree x={625} baseY={waterSurfaceY + 14} scale={0.92} swayDeg={-Math.sin(f * 0.045) * 1.3} flip />

        {/* === TRANSLUCENT STANDING SWAMP WATER COLUMN (LINGKUNGAN TERGENANG!) === */}
        <defs>
          <linearGradient id="s3StandingWater" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3B798A" stopOpacity="0.72" />
            <stop offset="45%" stopColor="#235466" stopOpacity="0.82" />
            <stop offset="100%" stopColor="#163544" stopOpacity="0.90" />
          </linearGradient>
        </defs>
        <rect
          x={-20}
          y={waterSurfaceY}
          width={760}
          height={Math.max(40, peatFloorTopY - waterSurfaceY + 24)}
          fill="url(#s3StandingWater)"
        />
        {/* Rippling Water Surface Line */}
        <path
          d={`M -20 ${waterSurfaceY} Q 180 ${waterSurfaceY - 5 + Math.sin(f * 0.08) * 3}, 360 ${waterSurfaceY + Math.cos(f * 0.08) * 3} T 740 ${waterSurfaceY}`}
          fill="none"
          stroke="#B4E0E4"
          strokeWidth={3}
          opacity={0.85}
        />

        {/* === FALLING LEAVES, TWIGS & ROOTS SINKING TO WATERLOGGED FLOOR === */}
        {Array.from({ length: 18 }).map((_, li) => {
          const cycle = ((localF * 0.011 + li * 0.14) % 1);
          const startY = waterSurfaceY - 120 - (li % 4) * 32;
          const endY = peatFloorTopY - 4 + (li % 3) * 10;
          const curY = lerp(startY, endY, easeOutCubic(cycle));
          const curX = 95 + ((li * 83) % 530) + Math.sin(cycle * 7 + li) * 22;
          const rot = li * 35 + cycle * 95;
          const isBranch = li % 4 === 0;
          return (
            <g
              key={li}
              transform={`translate(${curX.toFixed(1)}, ${curY.toFixed(1)}) rotate(${rot.toFixed(1)})`}
              opacity={clamp(fallT * 2.2, 0.25, 0.92)}
            >
              {isBranch ? (
                <path d="M -16 0 Q 0 -4, 16 2 M 3 -2 L 10 -9" stroke="#7A5B3A" strokeWidth={3} strokeLinecap="round" fill="none" />
              ) : (
                <path d="M -13 0 Q 0 -9, 14 0 Q 0 9, -13 0 Z" fill={curY > waterSurfaceY ? '#6A7B42' : '#7CA654'} />
              )}
            </g>
          );
        })}

        {/* === UNDERWATER LOW-OXYGEN (O2 MINIM) VISUALIZATION === */}
        {submergeDiveT > 0.12 && (
          <g opacity={submergeDiveT}>
            {/* Only 4 tiny slow O2 micro-bubbles showing anaerobic low-oxygen environment */}
            {[175, 315, 455, 565].map((bx, bi) => {
              const bp = (f * 0.008 + bi * 0.27) % 1;
              const by = lerp(peatFloorTopY - 14, waterSurfaceY + 14, bp);
              return (
                <g key={bi} transform={`translate(${bx + Math.sin(bp * 6 + bi) * 8}, ${by.toFixed(1)})`} opacity={Math.sin(bp * Math.PI) * 0.72}>
                  <circle r={6.5} fill="none" stroke="#B6E4EC" strokeWidth={1.6} />
                  <circle cx={-2} cy={-2} r={1.8} fill="#E4F6F8" />
                </g>
              );
            })}
            <text
              x={360}
              y={waterSurfaceY + 46}
              textAnchor="middle"
              fill="#BCE6EE"
              stroke={GP.ink}
              strokeWidth={3}
              paintOrder="stroke fill"
              fontFamily='"Plus Jakarta Sans", sans-serif'
              fontSize={13.5}
              fontWeight={800}
              letterSpacing="2.8px"
            >
              OKSIGEN MINIM · PENGURAIAN SANGAT LAMBAT
            </text>
          </g>
        )}

        {/* === TIME-LAPSE ACCUMULATING PEAT STRATA (Fibric -> Hemic -> Sapric!) === */}
        <PeatCutawayStrata
          f={f}
          topY={peatFloorTopY}
          waterTableY={peatFloorTopY + 8}
          showWaterLine={false}
          dryness={0}
          peatThicknessT={peatThickness}
        />

        {/* Animated Upward Growth Arrows During Peat Accumulation Time-Lapse */}
        {accumT > 0.06 && (
          <g opacity={clamp(accumT * 1.4, 0, 0.9)}>
            {[180, 360, 540].map((ax, ai) => {
              const bob = (f * 1.1 + ai * 9) % 24;
              return (
                <g key={ai} transform={`translate(${ax}, ${(peatFloorTopY + 125 - bob).toFixed(1)})`} opacity={1 - bob / 28}>
                  <polygon points="0,-18 10,-2 4,-2 4,14 -4,14 -4,-2 -10,-2" fill="#FAF1DC" stroke={GP.ink} strokeWidth={1.6} />
                </g>
              );
            })}
            {/* Stratum Labels Appearing as Layers Thicken */}
            <g fontFamily='"Plus Jakarta Sans", sans-serif' fontSize={12} fontWeight={800} letterSpacing="2.2px" fill="#FAF1DC">
              <text x={52} y={peatFloorTopY + 44} opacity={0.86}>LAPISAN FIBRIK (SERASAH BARU)</text>
              <text x={52} y={peatFloorTopY + 155} opacity={clamp((accumT - 0.25) * 1.6, 0, 0.86)}>LAPISAN HEMIK (SERAT ORGANIK)</text>
              <text x={52} y={peatFloorTopY + 290} opacity={clamp((accumT - 0.5) * 1.8, 0, 0.86)}>LAPISAN SAPRIK (GAMBUT TUA)</text>
            </g>
          </g>
        )}
      </svg>

      {/* Scientific Accuracy Note #5: Conceptual Reconstruction Tag */}
      <EditorialBadge
        text="VISUALISASI KONSEPTUAL · PEMBENTUKAN GAMBUT"
        top={78}
        bg="rgba(26, 44, 42, 0.84)"
        color="#DFD7BF"
        fontSize={11.5}
        opacity={0.9}
      />

      {/* Sequential 4 Storyboard Info Pills cleanly arranged in top 2x2 grid (zero crowding!) */}
      <div
        style={{
          position: 'absolute',
          top: 122,
          left: 44,
          right: 44,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px 14px',
          pointerEvents: 'none',
        }}
      >
        {[
          { lbl: '1. LINGKUNGAN TERGENANG', t: badge2, active: f < CUES.s3_fall },
          { lbl: '2. SISA TUMBUHAN', t: badge1, active: f >= CUES.s3_fall && f < CUES.s3_low_o2 },
          { lbl: '3. PENGURAIAN LAMBAT', t: badge3, active: f >= CUES.s3_low_o2 && f < CUES.s3_layers },
          { lbl: '4. AKUMULASI GAMBUT', t: badge4, active: f >= CUES.s3_layers },
        ].map((item, idx) => (
          <div
            key={idx}
            style={{
              padding: '8px 12px',
              borderRadius: 3,
              backgroundColor: item.active ? 'rgba(28, 42, 48, 0.94)' : 'rgba(24, 34, 40, 0.80)',
              border: item.active ? '1.8px solid #F8D348' : '1.2px solid rgba(250,241,220,0.28)',
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              fontSize: 12.5,
              fontWeight: 800,
              letterSpacing: '1.6px',
              color: item.active ? '#F8D348' : '#EFE6D3',
              textAlign: 'center',
              opacity: clamp(item.t, 0, 1),
              transform: `scale(${lerp(0.88, 1.0, clamp(item.t, 0, 1.03)).toFixed(3)})`,
              boxShadow: '0 4px 10px rgba(10, 14, 16, 0.36)',
            }}
          >
            {item.lbl}
          </div>
        ))}
      </div>

      {/* Subtle Heading When Layers Fully Form */}
      {accumT > 0.55 && (
        <RetroSlabTitle3D
          lines={['AKUMULASI GAMBUT']}
          top={238}
          fontSize={36}
          opacity={easeOutCubic((accumT - 0.55) / 0.35)}
        />
      )}
    </AbsoluteFill>
  );
};
