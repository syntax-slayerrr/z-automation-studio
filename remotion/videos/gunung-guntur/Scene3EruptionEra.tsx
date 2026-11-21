import React from 'react';
import { AbsoluteFill } from 'remotion';
import { CUES, SCENES } from './story';
import {
  clamp,
  CloudCurtainWipe,
  easeInOutCubic,
  easeOutCubic,
  lerp,
  RetroSlabTitle3D,
  springSettle,
  SvgSlabLabel,
  VP,
} from './fx';
import {
  BaseMistCollar,
  ErodedGouacheVolcano,
  LinelessGouacheCloud,
  OrganicCutawayStrata,
  PainterlyDefs,
  PainterlySky,
} from './painter';
import { WestJavaVintageAtlas, WJ_COORDS } from './WestJavaVintageAtlas';

/**
 * SCENE 3 — ERA LETUSAN 1690–1847 (00:23–00:39) [V2 1:1 PAINTERLY GOUACHE & ORGANIC CUTAWAY]
 * 1. Horizontal vintage timeline sweeps 1690 -> 1847 over misty gouache Gunung Guntur silhouette.
 * 2. Camera locks on monumental "22 LETUSAN" (Alfa Slab One 3D burnt-sienna).
 * 3. 1:1 Danau Toba Panel 4 Crane-Down into Organic Wavy Stratified Gouache Magma Cutaway + stippled magma embers!
 * 4. Surface branching red-orange lava lighting up eroded volcanic flanks (1840).
 * 5. High-zoom topographic Garut-Cipanas Vintage Relief Atlas tracing 1840 lava path -> molten wash into 1847!
 */
export const Scene3EruptionEra: React.FC<{ f: number }> = ({ f }) => {
  const s3Start = SCENES.s3Start;
  const s4Start = SCENES.s4Start;
  const localF = Math.max(0, f - s3Start);

  const openWipe = clamp(localF / 22, 0, 1);

  const timelineProg = easeInOutCubic((localF - 6) / 145);
  const count22T = springSettle((f - (CUES.s3_count22 - 8)) / 20);
  const cutawayT = easeInOutCubic((f - (CUES.s3_cutaway - 56)) / 24);
  const magmaRiseT = easeOutCubic((f - (CUES.s3_cutaway - 36)) / 48);
  const lavaSurfT = easeInOutCubic((f - (CUES.s3_lava - 22)) / 20);
  const cipanasT = easeInOutCubic((f - (CUES.s3_cipanas - 38)) / 20);
  const lavaWipeEnd = easeInOutCubic((f - (s4Start - 16)) / 16);

  const timelineAlpha = clamp(1 - cutawayT, 0, 1);
  const cutawayAlpha = clamp(cutawayT * (1 - lavaSurfT), 0, 1);
  const surfAlpha = clamp(lavaSurfT * (1 - cipanasT), 0, 1);
  const mapAlpha = cipanasT;

  const craneDownY = lerp(520, 0, cutawayT);
  const timelineLiftY = lerp(0, -480, cutawayT);

  const litNodes = Math.min(22, Math.floor(timelineProg * 22) + 1);
  const rollingYear = Math.round(lerp(1690, 1847, timelineProg));

  const lavaFlowProg = easeOutCubic((f - (CUES.s3_lava - 18)) / 44);
  const cipanasRouteProg = easeOutCubic((f - (CUES.s3_cipanas - 28)) / 36);

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#241C1B' }}>
      <svg width={720} height={1280} viewBox="0 0 720 1280" style={{ position: 'absolute', inset: 0 }}>
        <PainterlyDefs />
        <defs>
          <radialGradient id="gg3MoltenWipe" cx="50%" cy="62%" r="58%">
            <stop offset="0%" stopColor="#FFF4B4" />
            <stop offset="45%" stopColor="#F48A28" />
            <stop offset="100%" stopColor="#A62B1C" />
          </radialGradient>
        </defs>

        {/* === BEAT 1 & 2: HORIZONTAL VINTAGE TIMELINE (1690 -> 1847, 22 LETUSAN) === */}
        {timelineAlpha > 0.01 && (
          <g opacity={timelineAlpha} transform={`translate(0, ${timelineLiftY.toFixed(1)})`}>
            <PainterlySky f={f} mood="dusk" sunX={540} sunY={465} sunR={40} />
            <LinelessGouacheCloud x={140} y={240} scale={0.95} tone="dusk" opacity={0.82} />
            <LinelessGouacheCloud x={590} y={310} scale={1.08} tone="dusk" opacity={0.8} flip />

            {/* Eroded Lineless Gouache Gunung Guntur Behind Chronology Track */}
            <ErodedGouacheVolcano f={f} cx={360} baseY={880} peakY={485} halfW={420} mode="dusk" sunFromLeft={false} opacity={0.88} />
            <BaseMistCollar f={f} y={825} tone="dusk" opacity={0.88} />
            <path d="M -40 845 Q 360 822, 760 848 L 760 1280 L -40 1280 Z" fill="#2E3B2B" />

            {/* Main Horizontal Chronology Track (x = 70 .. 650 at y = 620) */}
            <g transform="translate(0, 620)">
              <rect x={44} y={-52} width={632} height={104} rx={8} fill="#1E242E" fillOpacity={0.88} stroke="#E8D8B8" strokeWidth={1.8} />
              <line x1={74} y1={0} x2={646} y2={0} stroke="#5B6472" strokeWidth={5} strokeLinecap="round" />
              <line x1={74} y1={0} x2={lerp(74, 646, timelineProg)} y2={0} stroke="#F48A28" strokeWidth={6.5} strokeLinecap="round" />

              {Array.from({ length: 22 }).map((_, ni) => {
                const u = ni / 21;
                const nx = lerp(74, 646, u);
                const isLit = ni < litNodes;
                const pulse = isLit && count22T > 0.1 ? 1 + 0.35 * Math.sin(f * 0.28 - ni * 0.5) : 1;
                const isMajor = ni === 0 || ni === 14 || ni === 18 || ni === 21;
                return (
                  <g key={ni} transform={`translate(${nx.toFixed(1)}, 0)`}>
                    {isLit && <circle cx={0} cy={0} r={(isMajor ? 14 : 9) * pulse} fill="#F48A28" opacity={0.34} />}
                    <circle
                      cx={0}
                      cy={0}
                      r={isMajor ? 7.5 : 4.8}
                      fill={isLit ? (isMajor ? '#F8D348' : '#E85C28') : '#3C4452'}
                      stroke={VP.ink}
                      strokeWidth={1.5}
                    />
                  </g>
                );
              })}

              <text x={74} y={36} textAnchor="start" fill="#FAF1DC" fontFamily='"Alfa Slab One", serif' fontSize={20}>1690</text>
              <text x={360} y={36} textAnchor="middle" fill="#F8D348" fontFamily='"Plus Jakarta Sans", sans-serif' fontSize={14} fontWeight={800} letterSpacing="3px">
                TAHUN {rollingYear}
              </text>
              <text x={646} y={36} textAnchor="end" fill="#FAF1DC" fontFamily='"Alfa Slab One", serif' fontSize={20}>1847</text>

              {timelineProg > 0.65 && (
                <text x={455} y={-24} textAnchor="middle" fill="#E8D8B8" fontFamily='"Plus Jakarta Sans", sans-serif' fontSize={12} fontWeight={800} letterSpacing="1.6px">1829</text>
              )}
              {timelineProg > 0.84 && (
                <text x={558} y={-24} textAnchor="middle" fill="#F8D348" fontFamily='"Plus Jakarta Sans", sans-serif' fontSize={12} fontWeight={800} letterSpacing="1.6px">1840</text>
              )}
            </g>
          </g>
        )}

        {/* === BEAT 3: 1:1 DANAU TOBA PANEL 4 ORGANIC WAVY STRATIFIED MAGMA CUTAWAY === */}
        {cutawayAlpha > 0.01 && (
          <g opacity={cutawayAlpha} transform={`translate(0, ${craneDownY.toFixed(1)})`}>
            <PainterlySky f={f} mood="inferno" />
            <LinelessGouacheCloud x={135} y={225} scale={1.0} tone="inferno" opacity={0.72} />
            <LinelessGouacheCloud x={595} y={275} scale={1.08} tone="inferno" opacity={0.72} flip />
            <OrganicCutawayStrata f={f} magmaRise={magmaRiseT} />
            <SvgSlabLabel x={360} y={224} text="RUANG MAGMA" fontSize={36} opacity={easeOutCubic((cutawayT - 0.3) / 0.7)} />
          </g>
        )}

        {/* === BEAT 4: SURFACE BRANCHING RED-ORANGE LAVA ILLUMINATING VOLCANIC SLOPES (1840) === */}
        {surfAlpha > 0.01 && (
          <g opacity={surfAlpha}>
            <PainterlySky f={f} mood="inferno" />
            <LinelessGouacheCloud x={130} y={215} scale={1.05} tone="inferno" opacity={0.76} />
            <LinelessGouacheCloud x={595} y={260} scale={1.12} tone="inferno" opacity={0.76} flip />

            <ErodedGouacheVolcano f={f} cx={360} baseY={895} peakY={412} halfW={435} mode="inferno" sunFromLeft />

            {/* Branching Molten Red-Orange Lava Rivers with Warm Screen Glow on Dark Slopes! */}
            {[
              'M 356 420 C 335 495, 292 552, 272 632 C 254 708, 192 778, 138 868',
              'M 366 420 C 396 492, 446 558, 474 648 C 500 732, 566 786, 624 875',
              'M 426 572 C 404 642, 384 718, 400 848',
            ].map((d, li) => (
              <g key={li}>
                <path d={d} fill="none" stroke="#F68A28" strokeWidth={34} strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - lavaFlowProg} opacity={0.34} filter="url(#ptSoftShadow)" />
                <path d={d} fill="none" stroke="#C42E1C" strokeWidth={20} strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - lavaFlowProg} opacity={0.9} />
                <path d={d} fill="none" stroke="#F48A28" strokeWidth={11} strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - lavaFlowProg} />
                <path d={d} fill="none" stroke="#FFF4B4" strokeWidth={4.2} strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - lavaFlowProg} />
              </g>
            ))}

            <path d="M -40 860 Q 360 832, 760 865 L 760 1280 L -40 1280 Z" fill="#2A1F20" />
            <rect x={-40} y={840} width={800} height={440} fill="url(#ptHorizontalBrush)" opacity={0.85} />
            <SvgSlabLabel x={360} y={222} text="ALIRAN LAVA 1840" fontSize={36} opacity={surfAlpha} />
          </g>
        )}

        {/* === BEAT 5: HIGH-ZOOM TOPOGRAPHIC GARUT-CIPANAS RELIEF ATLAS (1840 LAVA PATH) === */}
        {mapAlpha > 0.01 && (
          <g opacity={mapAlpha}>
            <WestJavaVintageAtlas
              f={f}
              center={[107.868, -7.17]}
              scale={lerp(135000, 165000, cipanasRouteProg)}
              centerY={580}
              lavaRoute={{ from: WJ_COORDS.guntur, to: WJ_COORDS.cipanas, progress: cipanasRouteProg }}
              pins={[
                { id: 'gnt', label: 'PUNCAK GUNTUR', coord: WJ_COORDS.guntur, appearT: 1, labelDir: 'top', color: '#C8321E' },
                { id: 'cpn', label: 'CIPANAS', coord: WJ_COORDS.cipanas, appearT: easeOutCubic((cipanasRouteProg - 0.2) / 0.5), slab: true, labelDir: 'right', color: '#F48A28' },
                { id: 'grt', label: 'KOTA GARUT', coord: WJ_COORDS.garut, appearT: 0.9, labelDir: 'bottom', color: '#4A3A2E' },
              ]}
            />
            <g opacity={0.34} fill="none" stroke="#5E4528" strokeWidth={1.6} strokeDasharray="6 4">
              <ellipse cx={278} cy={512} rx={68} ry={52} />
              <ellipse cx={278} cy={512} rx={115} ry={88} />
              <ellipse cx={278} cy={512} rx={168} ry={128} />
            </g>
            <rect width={720} height={1280} fill="url(#ptHorizontalBrush)" opacity={0.45} />
            <SvgSlabLabel x={360} y={195} text="ALIRAN LAVA 1840" fontSize={36} />
          </g>
        )}

        {/* Rising Molten Lava Curtain Forging "1847" in Scene 4 */}
        {lavaWipeEnd > 0.01 && (
          <rect x={0} y={lerp(1280, -40, lavaWipeEnd)} width={720} height={1360} fill="url(#gg3MoltenWipe)" opacity={0.94} />
        )}
      </svg>

      <RetroSlabTitle3D
        lines={['22 LETUSAN']}
        subtitle="CATATAN SEJARAH · 1690 – 1847"
        top={185}
        fontSize={64}
        opacity={clamp(count22T, 0, 1) * timelineAlpha}
        scale={lerp(0.84, 1.0, clamp(count22T, 0, 1.05))}
      />

      <CloudCurtainWipe progress={0.5 + openWipe * 0.5} tone="ash" />
    </AbsoluteFill>
  );
};
