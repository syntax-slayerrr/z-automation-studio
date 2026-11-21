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
 * SCENE 5 — KETIKA KESEIMBANGAN TERGANGGU (00:45–00:57)
 * 1. Natural water-saturated peat forest full of reflective swamp water.
 * 2. Straight drainage canal slices through forest; directional water current drains water out!
 * 3. Camera dives into peat cutaway -> groundwater table (`MUKA AIR TANAH`) drops drastically!
 * 4. Peat darkens, cracks open, canopy dries + warning title `GAMBUT MENGERING`.
 * 5. Final beat: a dry surface twig ignites & sends a glowing ember downward -> motivates Scene 6!
 */
export const Scene5BalanceDisrupted: React.FC<{ f: number }> = ({ f }) => {
  const s5Start = SCENES.s5Start;
  const s6Start = SCENES.s6Start;
  const localF = Math.max(0, f - s5Start);

  const canalCutT = easeInOutCubic((f - (CUES.s5_canal - 14)) / 48);
  const diveT = easeInOutCubic((f - (CUES.s5_waterdrop - 18)) / 42);
  const waterDropT = easeInOutCubic((f - (CUES.s5_waterdrop - 6)) / 68);
  const dryT = easeInOutCubic((f - (CUES.s5_dry - 22)) / 52);
  const warnPopT = springSettle((f - (CUES.s5_dry - 4)) / 20);
  const sparkIgniteT = easeOutCubic((f - (s6Start - 28)) / 24);

  const horizonY = lerp(585, 435, diveT);
  const groundTopY = horizonY + 42;
  const waterTableY = lerp(groundTopY + 14, groundTopY + 345, waterDropT);

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#1E4A5C' }}>
      <svg width={720} height={1280} viewBox="0 0 720 1280" style={{ position: 'absolute', inset: 0 }}>
        <PeatPainterDefs />

        {/* Sky morphs from healthy misty morning -> parched dry ochre haze */}
        <PeatSky f={f} mood="misty_morning" sunX={530} sunY={255} sunR={38} opacity={1} />
        <PeatSky f={f} mood="dry_haze" sunX={530} sunY={255} sunR={40} opacity={dryT} />

        <PeatCloud x={lerp(115, 175, localF / 340)} y={182} scale={0.94} tone={dryT > 0.5 ? 'dusk' : 'day'} opacity={0.85} />
        <PeatCloud x={lerp(595, 535, localF / 340)} y={232} scale={0.88} tone={dryT > 0.5 ? 'dusk' : 'day'} opacity={0.82} flip />

        {/* Peat Swamp Forest Horizon drying out as water drains away */}
        <PeatForestHorizon
          f={f}
          horizonY={horizonY}
          dryness={dryT}
          waterOpacity={clamp(1 - waterDropT * 1.15, 0, 1)}
          smokeOpacity={dryT * 0.25}
        />

        {/* Framing Peat Trees turning parched brown-ochre */}
        <PeatSwampTree x={92} baseY={groundTopY + 4} scale={0.85} dryness={dryT} swayDeg={Math.sin(f * 0.045) * 1.2} />
        <PeatSwampTree x={630} baseY={groundTopY + 6} scale={0.9} dryness={dryT} swayDeg={-Math.sin(f * 0.045) * 1.2} flip />

        {/* === DRAINAGE CANAL SLICING THROUGH FOREST & DRAINING WATER OUT === */}
        {canalCutT > 0.02 && (
          <g opacity={canalCutT * (1 - diveT * 0.65)}>
            {/* Excavated Muddy Canal Banks */}
            <polygon
              points={`342,${horizonY + 12} 378,${horizonY + 12} ${lerp(378, 468, canalCutT)},${groundTopY + 12} ${lerp(342, 252, canalCutT)},${groundTopY + 12}`}
              fill="#4A3424"
            />
            {/* Dark Rushing Canal Water Channel */}
            <polygon
              points={`348,${horizonY + 14} 372,${horizonY + 14} ${lerp(372, 444, canalCutT)},${groundTopY + 12} ${lerp(348, 276, canalCutT)},${groundTopY + 12}`}
              fill="#285F76"
            />
            {/* Animated Outward Flow Streaks Carrying Water Away */}
            {[0, 1, 2, 3].map((ci) => {
              const p = (f * 0.045 + ci * 0.25) % 1;
              const cy = lerp(horizonY + 18, groundTopY + 6, p);
              const hw = lerp(10, 48, p);
              return (
                <path
                  key={ci}
                  d={`M ${360 - hw * 0.4} ${cy} L 360 ${cy + 10} L ${360 + hw * 0.4} ${cy}`}
                  fill="none"
                  stroke="#9ED6E2"
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  opacity={Math.sin(p * Math.PI) * 0.88}
                />
              );
            })}
          </g>
        )}

        {/* === DEEP PEAT CUTAWAY SHOWING WATER TABLE DRAWDOWN & DESICCATION CRACKS === */}
        <PeatCutawayStrata
          f={f}
          topY={groundTopY}
          waterTableY={waterTableY}
          showWaterLine={diveT > 0.15}
          dryness={dryT}
        />

        {/* Animated Canal Cross-Section Notch Draining Groundwater Left & Right into Ditch! */}
        {diveT > 0.15 && (
          <g opacity={diveT}>
            <path
              d={`M 308 ${groundTopY - 2} L 328 ${groundTopY + 95} L 392 ${groundTopY + 95} L 412 ${groundTopY - 2} Z`}
              fill="#261A14"
              stroke="#1E1410"
              strokeWidth={1.8}
            />
            {/* Water Sitting Low at Bottom of Drainage Canal */}
            <polygon
              points={`324,${groundTopY + 62} 396,${groundTopY + 62} 392,${groundTopY + 95} 328,${groundTopY + 95}`}
              fill="#2C6F88"
            />
            <text
              x={360}
              y={groundTopY + 46}
              textAnchor="middle"
              fill="#FAF1DC"
              stroke={GP.ink}
              strokeWidth={3}
              paintOrder="stroke fill"
              fontFamily='"Plus Jakarta Sans", sans-serif'
              fontSize={12}
              fontWeight={800}
              letterSpacing="1.8px"
            >
              KANAL
            </text>

            {/* Crisp Animated Downward Water-Table Arrows (↓ ↓ ↓) cleanly separated from text! */}
            {waterDropT > 0.08 &&
              [315, 575].map((ax, ai) => {
                const bob = (f * 1.3 + ai * 10) % 26;
                return (
                  <g
                    key={ai}
                    transform={`translate(${ax}, ${(waterTableY - 46 + bob).toFixed(1)})`}
                    opacity={clamp(waterDropT * 1.4, 0, 0.92) * (1 - bob / 30)}
                  >
                    <polygon points="0,20 11,3 4,3 4,-16 -4,-16 -4,3 -11,3" fill="#90D8E8" stroke={GP.ink} strokeWidth={1.6} />
                  </g>
                );
              })}

            {/* Live Water Table Label Following Blue Dashed Line Downward */}
            <text
              x={168}
              y={waterTableY - 12}
              textAnchor="middle"
              fill="#A6E4F0"
              stroke={GP.ink}
              strokeWidth={3.2}
              paintOrder="stroke fill"
              fontFamily='"Plus Jakarta Sans", sans-serif'
              fontSize={12.5}
              fontWeight={800}
              letterSpacing="2px"
            >
              MUKA AIR TANAH TURUN
            </text>
          </g>
        )}

        {/* === FINAL BEAT TRANSITION: DRY SURFACE TWIG CATCHING SPARK INTO CRACKED PEAT === */}
        {sparkIgniteT > 0.02 && (
          <g transform={`translate(485, ${groundTopY - 2})`} opacity={sparkIgniteT}>
            <path d="M -38 2 Q -8 -14, 34 -4 M 2 -7 L 18 -20" stroke="#5A3F2B" strokeWidth={4} strokeLinecap="round" fill="none" />
            <circle cx={0} cy={-8} r={24 + Math.sin(f * 0.4) * 5} fill="#F88424" opacity={0.48} filter="url(#gpEmberBloom)" />
            <path
              d={`M -10 -4 Q -4 -26, 2 -34 Q 10 -22, 12 -4 Z`}
              fill="#F89B2E"
              transform={`scale(${lerp(0.4, 1.15, sparkIgniteT).toFixed(2)})`}
            />
            <path
              d={`M -5 -4 Q 0 -18, 5 -4 Z`}
              fill="#FFF2A8"
              transform={`scale(${lerp(0.4, 1.15, sparkIgniteT).toFixed(2)})`}
            />
          </g>
        )}
      </svg>

      {/* Warning Slab Title when Peat Dries Out */}
      <RetroSlabTitle3D
        lines={['GAMBUT MENGERING']}
        subtitle="MUKA AIR TANAH TURUN · MUDAH TERBAKAR"
        top={118}
        fontSize={44}
        accentColor="#F8D348"
        opacity={clamp(warnPopT, 0, 1)}
        scale={lerp(0.86, 1.0, clamp(warnPopT, 0, 1.04))}
      />
    </AbsoluteFill>
  );
};
