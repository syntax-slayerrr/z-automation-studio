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
  SmokeCurtainWipe,
  springSettle,
  SvgSlabLabel,
} from './fx';
import { ID_COORDS, IndonesiaPremiumAtlas } from './IndonesiaPremiumAtlas';
import {
  PeatCloud,
  PeatCutawayStrata,
  PeatForestHorizon,
  PeatPainterDefs,
  PeatSky,
  TropicalMonsoonRain,
} from './peatPainter';

/**
 * SCENE 7 — KEBAKARAN YANG SULIT DIPADAMKAN (01:10–01:24)
 * 1. Opens from smoke wipe onto PREMIUM TEXTURED INDONESIA ATLAS zooming into Sumatra field experiment site.
 * 2. Smooth reveal into field-experiment cutaway + animated Day 1 -> Day 10 timeline + bold `4–10 HARI`.
 * 3. Three heavy tropical rainstorms pour onto the forest & soak ONLY the top surface (`PERMUKAAN BASAH`),
 *    while deep subterranean smouldering embers persist & keep spreading underneath (`BARA TETAP MEMBARA`)!
 * 4. Crisp headline: `HUJAN BELUM TENTU MEMADAMKAN API`!
 */
export const Scene7HardToExtinguish: React.FC<{ f: number }> = ({ f }) => {
  const s7Start = SCENES.s7Start;
  const localF = Math.max(0, f - s7Start);

  const openSmokeWipe = clamp(localF / 18, 0, 1);
  const mapZoomT = easeInOutCubic(localF / 56);
  const expRevealT = easeInOutCubic((f - (CUES.s7_days - 14)) / 24);
  const dayProgress = easeInOutCubic((f - (CUES.s7_days - 4)) / 128);
  const daysNum = clamp(Math.round(lerp(1, 10, dayProgress)), 1, 10);

  // 3 Distinct Heavy Tropical Rainstorms hitting during the 4-10 day window!
  const rainWindowT = clamp((f - (CUES.s7_rain - 12)) / 138, 0, 1);
  const rainPulse =
    rainWindowT > 0.01
      ? clamp(0.68 + 0.32 * Math.sin(rainWindowT * Math.PI * 3), 0.45, 1.0) * clamp(rainWindowT * 5, 0, 1)
      : 0;
  const persistPopT = springSettle((f - (CUES.s7_persists - 6)) / 20);

  const groundY = 532;

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#133144' }}>
      <svg width={720} height={1280} viewBox="0 0 720 1280" style={{ position: 'absolute', inset: 0 }}>
        <PeatPainterDefs />

        {/* === PHASE 1: PREMIUM TEXTURED INDONESIA ATLAS ZOOMING TO SUMATRA EXPERIMENT SITE === */}
        <g opacity={1 - expRevealT * 0.96}>
          <IndonesiaPremiumAtlas
            f={f}
            center={[lerp(108.5, ID_COORDS.sumatraField[0], mapZoomT), lerp(-1.5, ID_COORDS.sumatraField[1], mapZoomT)]}
            scale={lerp(1180, 3450, mapZoomT)}
            centerY={575}
            highlightZone="sumatra_field"
            highlightT={easeOutCubic((localF - 10) / 28)}
            smokeMood={0.65}
            scaleBarLabel="EKSPERIMEN LAPANGAN SUMATRA"
            scaleBarProgress={easeOutCubic((localF - 14) / 26)}
            pins={[
              {
                id: 'sum_exp',
                label: 'SUMATRA',
                sublabel: 'EKSPERIMEN LAHAN GAMBUT',
                coord: ID_COORDS.sumatraField,
                appearT: clamp((localF - 12) / 20, 0, 1),
                slab: true,
                labelDir: 'top',
                color: '#E64822',
              },
            ]}
          />
        </g>

        {/* === PHASE 2 & 3: 4-10 DAY TIMELINE + 3 HEAVY RAINSTORMS VS PERSISTENT UNDERGROUND EMBERS === */}
        {expRevealT > 0.01 && (
          <g opacity={expRevealT}>
            <PeatSky f={f} mood="smoulder_haze" opacity={1} />
            <PeatSky f={f} mood="monsoon_storm" opacity={clamp(rainWindowT * 2.2, 0, 0.95)} />

            {/* Dark Storm Clouds Overhead When Rain Arrives */}
            <g opacity={clamp(rainWindowT * 2.5, 0.25, 0.96)}>
              <PeatCloud x={145 + Math.sin(f * 0.03) * 14} y={320} scale={1.18} tone="storm" />
              <PeatCloud x={365 - Math.sin(f * 0.025) * 12} y={305} scale={1.28} tone="storm" flip />
              <PeatCloud x={585 + Math.cos(f * 0.03) * 14} y={325} scale={1.16} tone="storm" />
            </g>

            <PeatForestHorizon
              f={f}
              horizonY={groundY - 42}
              dryness={0.85}
              waterOpacity={0}
              smokeOpacity={0.55}
            />

            {/* Cutaway: Wet Rain-Soaked Surface Cap ONLY, Deep Embers Still Burning & Spreading Underneath! */}
            <PeatCutawayStrata
              f={f}
              topY={groundY}
              waterTableY={1320}
              showWaterLine={false}
              dryness={0.78}
              surfaceWetT={clamp(rainWindowT * 2.4, 0, 1)}
              smoulderT={1}
              smoulderSpread={lerp(0.55, 1.0, dayProgress)}
              smoulderCenterX={360}
            />

            {/* Diagonal Monsoon Rain Sheets + Surface Splash Ripples! */}
            <TropicalMonsoonRain f={f} intensity={rainPulse} groundY={groundY} />

            {/* Visual Split-Depth Comparison Callout Pointers (Wet Top vs Burning Below!) */}
            {rainWindowT > 0.18 && (
              <g opacity={easeOutCubic((rainWindowT - 0.18) / 0.3)}>
                <g transform={`translate(56, ${groundY + 12})`}>
                  <rect x={0} y={-14} width={224} height={28} rx={4} fill="#143244" fillOpacity={0.92} stroke="#88D6E8" strokeWidth={1.6} />
                  <text x={112} y={5} textAnchor="middle" fill="#B4ECFA" fontFamily='"Plus Jakarta Sans", sans-serif' fontSize={12} fontWeight={800} letterSpacing="1.8px">
                    PERMUKAAN BASAH (HUJAN)
                  </text>
                </g>

                <g transform={`translate(432, ${groundY + 230})`}>
                  <rect x={0} y={-14} width={236} height={28} rx={4} fill="#2A1412" fillOpacity={0.94} stroke="#F8A236" strokeWidth={1.8} />
                  <text x={118} y={5} textAnchor="middle" fill="#F8D348" fontFamily='"Plus Jakarta Sans", sans-serif' fontSize={12} fontWeight={800} letterSpacing="1.8px">
                    BARA DI BAWAH TETAP HIDUP
                  </text>
                </g>
              </g>
            )}

            {/* === ANIMATED DAY 1 -> DAY 10 EXPERIMENT TIMELINE STRIP (Clean Non-Overlapping Droplets & Header!) === */}
            <g transform="translate(360, 272)">
              <rect x={-310} y={-44} width={620} height={86} rx={7} fill="#162129" fillOpacity={0.93} stroke="#DFC896" strokeWidth={1.8} />
              <text
                x={0}
                y={-24}
                textAnchor="middle"
                fill="#A8D8E6"
                fontFamily='"Plus Jakarta Sans", sans-serif'
                fontSize={11}
                fontWeight={800}
                letterSpacing="2.2px"
              >
                EKSPERIMEN SUMATRA · 3 KALI HUJAN BESAR
              </text>
              <line x1={-260} y1={10} x2={260} y2={10} stroke="#4C5A62" strokeWidth={4} strokeLinecap="round" />
              <line
                x1={-260}
                y1={10}
                x2={lerp(-260, 260, (daysNum - 1) / 9)}
                y2={10}
                stroke="#F28828"
                strokeWidth={5}
                strokeLinecap="round"
              />
              {Array.from({ length: 10 }).map((_, di) => {
                const day = di + 1;
                const dx = -260 + (di / 9) * 520;
                const reached = day <= daysNum;
                const isRainDay = day === 3 || day === 6 || day === 9;
                const inHighlightBand = day >= 4;
                return (
                  <g key={day} transform={`translate(${dx.toFixed(1)}, 10)`}>
                    <circle
                      r={reached ? (inHighlightBand ? 7.5 : 5.5) : 4.5}
                      fill={reached ? (inHighlightBand ? '#F8D348' : '#E87428') : '#38444C'}
                      stroke="#162129"
                      strokeWidth={1.8}
                    />
                    <text
                      y={24}
                      textAnchor="middle"
                      fill={reached ? '#FAF1DC' : '#7D8B94'}
                      fontFamily='"Plus Jakarta Sans", sans-serif'
                      fontSize={10.5}
                      fontWeight={800}
                    >
                      H{day}
                    </text>
                    {/* Crisp Vector Raindrop Icons Cleanly Below Header Text! */}
                    {isRainDay && (
                      <g transform="translate(0, -17)" opacity={reached ? 1 : 0.35}>
                        <path d="M 0 -7 C 4.2 -1, 5.2 2, 0 5.2 C -5.2 2, -4.2 -1, 0 -7 Z" fill="#7AD4EC" stroke="#162129" strokeWidth={0.8} />
                      </g>
                    )}
                  </g>
                );
              })}
            </g>

            {/* Monumental 4-10 HARI readout before headline swaps cleanly */}
            {persistPopT < 0.4 && (
              <g opacity={clamp(1 - persistPopT * 2.5, 0, 1)}>
                <SvgSlabLabel x={360} y={178} text="4–10 HARI" fontSize={58} fill="#F8D348" />
                <text
                  x={360}
                  y={206}
                  textAnchor="middle"
                  fill="#FAF1DC"
                  stroke={GP.ink}
                  strokeWidth={3}
                  paintOrder="stroke fill"
                  fontFamily='"Plus Jakarta Sans", sans-serif'
                  fontSize={13}
                  fontWeight={800}
                  letterSpacing="3px"
                >
                  GAMBUT TETAP MEMBARA
                </text>
              </g>
            )}
          </g>
        )}
      </svg>

      {expRevealT <= 0.35 && (
        <EditorialBadge
          text="EKSPERIMEN LAPANGAN LAHAN GAMBUT · SUMATRA"
          top={98}
          opacity={1 - expRevealT * 2.8}
          fontSize={13}
        />
      )}

      {/* Final Scene 7 Warning Conclusion */}
      <RetroSlabTitle3D
        lines={['HUJAN BELUM TENTU', 'MEMADAMKAN API']}
        subtitle="BARA TETAP MENYEBAR DI BAWAH PERMUKAAN"
        top={92}
        fontSize={36}
        accentColor="#FAF1DC"
        opacity={clamp(persistPopT, 0, 1)}
        scale={lerp(0.86, 1.0, clamp(persistPopT, 0, 1.04))}
      />

      {/* Opening Smoke Wipe Completing Seamlessly from Scene 6 */}
      <SmokeCurtainWipe progress={0.5 + openSmokeWipe * 0.5} tone="smoke" />
    </AbsoluteFill>
  );
};
