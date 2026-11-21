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
  SvgSlabLabel,
} from './fx';
import { ID_COORDS, IndonesiaPremiumAtlas } from './IndonesiaPremiumAtlas';
import { PeatCutawayStrata, PeatForestHorizon, PeatPainterDefs, PeatSky } from './peatPainter';

/**
 * SCENE 4 — USIA GAMBUT TIDAK SAMA (00:34–00:45)
 * 1. PREMIUM TEXTURED INDONESIA ATLAS panning smoothly from Sebangau (Kalimantan) -> East Coast of Central Sumatra!
 * 2. Staggered core-drilling dots illuminate along Central Sumatra coastal peatlands (Riau - Jambi).
 * 3. Smooth transition into coastal peat swamp cutaway time-lapse.
 * 4. Clear side-by-side comparison: SEBANGAU, KALIMANTAN TENGAH (±26.000 TAHUN) vs PESISIR SUMATRA TENGAH (±6.500 TAHUN)!
 */
export const Scene4AgeComparison: React.FC<{ f: number }> = ({ f }) => {
  const s4Start = SCENES.s4Start;
  const localF = Math.max(0, f - s4Start);

  // Camera Pan: Kalimantan (Sebangau) -> across Karimata Strait -> Pesisir Sumatra Tengah
  const panT = easeInOutCubic((localF - 14) / 74);
  const centerLng = lerp(111.8, ID_COORDS.sumatraCentral[0] + 0.8, panT);
  const centerLat = lerp(-1.9, ID_COORDS.sumatraCentral[1] - 0.4, panT);
  const mapScale = lerp(1850, 2950, panT);

  const arcT = easeOutCubic((localF - 18) / 56);

  // Coastal Sumatra staggered core-drilling locations
  const drillCoords: Array<[number, number]> = [
    [101.95, 1.05],
    [102.38, 0.62],
    [102.72, 0.22],
    [103.08, -0.35],
    [103.52, -0.92],
    [103.85, -1.35],
  ];

  // Phase 2: Coastal Cutaway Time-Lapse + Side-by-Side Age Comparison Overlay
  const compareT = easeInOutCubic((f - (CUES.s4_compare - 34)) / 26);
  const growCoastalT = easeOutCubic((f - (CUES.s4_compare - 24)) / 52);
  const cardPopT = springSettle((f - (CUES.s4_compare - 4)) / 22);

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#133144' }}>
      <svg width={720} height={1280} viewBox="0 0 720 1280" style={{ position: 'absolute', inset: 0 }}>
        <PeatPainterDefs />

        {/* === PHASE 1: PREMIUM TEXTURED INDONESIA ATLAS PANNING KALIMANTAN -> SUMATRA === */}
        <g opacity={1 - compareT * 0.92}>
          <IndonesiaPremiumAtlas
            f={f}
            center={[centerLng, centerLat]}
            scale={mapScale}
            centerY={575}
            highlightZone={panT > 0.45 ? 'sumatra_central' : 'sebangau'}
            highlightT={1}
            scaleBarLabel="PESISIR SUMATRA TENGAH"
            scaleBarProgress={easeOutCubic((panT - 0.45) / 0.45)}
            flightArc={{ from: ID_COORDS.sebangau, to: ID_COORDS.sumatraCentral, progress: arcT }}
            drillDots={drillCoords.map((coord, idx) => ({
              coord,
              appearT: clamp((f - (CUES.s4_sumatra + idx * 7)) / 12, 0, 1),
            }))}
            pins={[
              {
                id: 'seb',
                label: 'SEBANGAU',
                sublabel: '±26.000 TAHUN',
                coord: ID_COORDS.sebangau,
                appearT: 1,
                slab: false,
                labelDir: 'bottom',
                color: '#D23B26',
              },
              {
                id: 'sum',
                label: 'SUMATRA TENGAH',
                sublabel: 'PESISIR TIMUR',
                coord: ID_COORDS.sumatraCentral,
                appearT: clamp((panT - 0.48) / 0.35, 0, 1),
                slab: true,
                labelDir: 'top',
                color: '#E88428',
              },
            ]}
          />
        </g>

        {/* === PHASE 2: COASTAL PEAT SWAMP CUTAWAY + SIDE-BY-SIDE AGE COMPARISON === */}
        {compareT > 0.01 && (
          <g opacity={compareT}>
            <PeatSky f={f} mood="misty_morning" sunX={540} sunY={240} sunR={36} />
            <PeatForestHorizon f={f} horizonY={515} dryness={0} waterOpacity={0.78} />
            <PeatCutawayStrata
              f={f}
              topY={565}
              waterTableY={578}
              showWaterLine={false}
              dryness={0}
              peatThicknessT={lerp(0.28, 0.78, growCoastalT)}
            />

            {/* Side-by-Side Scaled Core Depth Comparison Visual (Visualizing 26,000 vs 6,500 yrs accurately!) */}
            <g transform="translate(0, 290)" opacity={clamp(cardPopT, 0, 1)}>
              {/* LEFT PANEL: SEBANGAU, KALIMANTAN TENGAH (±26.000 TAHUN) */}
              <g transform={`translate(186, 0) scale(${lerp(0.88, 1, clamp(cardPopT, 0, 1.03)).toFixed(3)})`}>
                <rect x={-146} y={-24} width={292} height={338} rx={8} fill="#18242C" fillOpacity={0.92} stroke="#DFC896" strokeWidth={2} />
                <text x={0} y={8} textAnchor="middle" fill="#DFC896" fontFamily='"Plus Jakarta Sans", sans-serif' fontSize={12} fontWeight={800} letterSpacing="2px">
                  SEBANGAU
                </text>
                <text x={0} y={26} textAnchor="middle" fill="#A6B8BE" fontFamily='"Plus Jakarta Sans", sans-serif' fontSize={10.5} fontWeight={700} letterSpacing="1.8px">
                  KALIMANTAN TENGAH
                </text>
                {/* Tall Peat Core Column Representing Deep 26,000-Year Accumulation */}
                <rect x={-36} y={46} width={72} height={175} rx={6} fill="#36241B" stroke="#C9B282" strokeWidth={1.6} />
                <rect x={-36} y={46} width={72} height={52} rx={6} fill="#6E4C34" />
                <rect x={-36} y={92} width={72} height={62} fill="#4D3323" />
                <rect x={-36} y={46} width={72} height={175} fill="url(#gpPeatFibers)" opacity={0.9} />
                <SvgSlabLabel x={0} y={262} text="±26.000" fontSize={36} fill="#FAF1DC" />
                <text x={0} y={288} textAnchor="middle" fill="#F8D348" fontFamily='"Plus Jakarta Sans", sans-serif' fontSize={13} fontWeight={800} letterSpacing="2.4px">
                  TAHUN LALU
                </text>
              </g>

              {/* RIGHT PANEL: PESISIR SUMATRA TENGAH (±6.500 TAHUN) */}
              <g transform={`translate(534, 0) scale(${lerp(0.88, 1, clamp(cardPopT, 0, 1.03)).toFixed(3)})`}>
                <rect x={-146} y={-24} width={292} height={338} rx={8} fill="#18242C" fillOpacity={0.92} stroke="#F8D348" strokeWidth={2.4} />
                <text x={0} y={8} textAnchor="middle" fill="#F8D348" fontFamily='"Plus Jakarta Sans", sans-serif' fontSize={12} fontWeight={800} letterSpacing="2px">
                  PESISIR SUMATRA
                </text>
                <text x={0} y={26} textAnchor="middle" fill="#A6B8BE" fontFamily='"Plus Jakarta Sans", sans-serif' fontSize={10.5} fontWeight={700} letterSpacing="1.8px">
                  SUMATRA TENGAH
                </text>
                {/* Younger Coastal Peat Column Growing Live */}
                <rect x={-36} y={lerp(221, 132, growCoastalT)} width={72} height={lerp(2, 89, growCoastalT)} rx={6} fill="#5C3D28" stroke="#F8D348" strokeWidth={1.6} />
                <rect x={-36} y={lerp(221, 132, growCoastalT)} width={72} height={lerp(2, 34, growCoastalT)} rx={6} fill="#765238" />
                <line x1={-56} y1={221} x2={56} y2={221} stroke="#8D8478" strokeWidth={2} strokeDasharray="4 4" />
                <SvgSlabLabel x={0} y={262} text="±6.500" fontSize={36} fill="#F8D348" />
                <text x={0} y={288} textAnchor="middle" fill="#FAF1DC" fontFamily='"Plus Jakarta Sans", sans-serif' fontSize={13} fontWeight={800} letterSpacing="2.4px">
                  TAHUN LALU
                </text>
              </g>
            </g>
          </g>
        )}
      </svg>

      {compareT < 0.45 ? (
        <EditorialBadge
          text="PERBANDINGAN USIA GAMBUT INDONESIA"
          top={96}
          opacity={1 - compareT * 2.2}
          fontSize={13.5}
        />
      ) : (
        <RetroSlabTitle3D
          lines={['USIA GAMBUT BERBEDA']}
          subtitle="SEBANGAU ±26.000 TH  ·  SUMATRA TENGAH ±6.500 TH"
          top={110}
          fontSize={38}
          opacity={easeOutCubic((compareT - 0.35) / 0.5)}
        />
      )}
    </AbsoluteFill>
  );
};
