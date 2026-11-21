import React from 'react';
import { AbsoluteFill } from 'remotion';
import { CUES, SCENES } from './story';
import {
  clamp,
  CloudCurtainWipe,
  easeInOutCubic,
  easeOutCubic,
  lerp,
  springSettle,
  SvgSlabLabel,
  VP,
} from './fx';
import {
  BaseMistCollar,
  ErodedGouacheVolcano,
  LinelessGouacheCloud,
  PainterlyDefs,
  PainterlySky,
} from './painter';

/**
 * SCENE 5 — KOMPLEKS GUNUNGAPI (00:54–01:08) [V2 LINELESS PAINTERLY GOUACHE + AERIAL PERSPECTIVE!]
 * 1. Camera descends smoothly through lineless 3-tone painted clouds onto the volcanic complex.
 * 2. Orbital parallax separates 4 distinct eroded gouache cones cleanly across depth (mistier far -> richest front!).
 * 3. Sequential sunlit glow & crisp non-overlapping labels: PARUKUYAN (far-left), GUNTUR (center-left), MASIGIT (center-right), KABUYUTAN (far-right)!
 * 4. Aerial climb unifying all 4 peaks before seamless morph into modern lush Garut!
 */
export const Scene5VolcanicComplex: React.FC<{ f: number }> = ({ f }) => {
  const s5Start = SCENES.s5Start;
  const s6Start = SCENES.s6Start;
  const localF = Math.max(0, f - s5Start);

  const openWipe = clamp(localF / 20, 0, 1);

  const descendT = easeOutCubic(localF / 58);
  const orbitT = easeInOutCubic((f - (CUES.s5_orbit - 12)) / 84);

  const gunturLblT = springSettle((f - (CUES.s5_orbit + 4)) / 18);
  const masigitLblT = springSettle((f - (CUES.s5_masigit - 4)) / 18);
  const parukuyanLblT = springSettle((f - (CUES.s5_parukuyan - 4)) / 18);
  const kabuyutanLblT = springSettle((f - (CUES.s5_kabuyutan - 4)) / 18);
  const aerialT = easeInOutCubic((f - (CUES.s5_kabuyutan + 14)) / Math.max(24, s6Start - (CUES.s5_kabuyutan + 14)));

  const camScale = lerp(1.18, 1.0, descendT) * lerp(1.0, 0.88, aerialT);
  const camY = lerp(-180, 0, descendT) + lerp(0, -64, aerialT);

  const activePeak =
    kabuyutanLblT > 0.2 ? 'kabuyutan' : parukuyanLblT > 0.2 ? 'parukuyan' : masigitLblT > 0.2 ? 'masigit' : gunturLblT > 0.2 ? 'guntur' : 'none';

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#28546E' }}>
      <svg width={720} height={1280} viewBox="0 0 720 1280" style={{ position: 'absolute', inset: 0 }}>
        <PainterlyDefs />
        <PainterlySky f={f} mood="highland" sunX={545} sunY={320} sunR={42} />

        <g transform={`translate(360, 620) scale(${camScale.toFixed(3)}) translate(-360, -620) translate(0, ${camY.toFixed(1)})`}>
          <LinelessGouacheCloud x={lerp(115, 185, f / 350)} y={195} scale={0.98} tone="day" opacity={0.86} />
          <LinelessGouacheCloud x={lerp(595, 535, f / 350)} y={214} scale={0.88} tone="day" opacity={0.84} flip />

          {/* === DEPTH 1 (FAR-RIGHT AERIAL HAZE): PUNCAK KABUYUTAN === */}
          <g transform={`translate(${lerp(-78, 12, orbitT).toFixed(1)}, 0)`}>
            {activePeak === 'kabuyutan' && <circle cx={596} cy={520} r={140} fill="#FFF4CC" opacity={0.42} filter="url(#ptSunBloom)" />}
            <ErodedGouacheVolcano f={f} cx={596} baseY={835} peakY={520} halfW={190} mode="dusk" sunFromLeft opacity={0.78} />
            {kabuyutanLblT > 0.02 && (
              <g opacity={clamp(kabuyutanLblT, 0, 1)}>
                <line x1={596} y1={514} x2={596} y2={446} stroke={VP.cream} strokeWidth={2.2} strokeDasharray="5 4" />
                <circle cx={596} cy={518} r={6} fill="#F8D348" stroke={VP.ink} strokeWidth={1.6} />
                <SvgSlabLabel x={596} y={428} text="KABUYUTAN" fontSize={19} scale={lerp(0.8, 1.0, clamp(kabuyutanLblT, 0, 1.04))} />
              </g>
            )}
          </g>

          {/* === DEPTH 2 (FAR-LEFT AERIAL HAZE): PUNCAK PARUKUYAN === */}
          <g transform={`translate(${lerp(82, -22, orbitT).toFixed(1)}, 0)`}>
            {activePeak === 'parukuyan' && <circle cx={142} cy={525} r={145} fill="#FFF4CC" opacity={0.42} filter="url(#ptSunBloom)" />}
            <ErodedGouacheVolcano f={f} cx={142} baseY={840} peakY={524} halfW={198} mode="dusk" sunFromLeft opacity={0.84} />
            {parukuyanLblT > 0.02 && (
              <g opacity={clamp(parukuyanLblT, 0, 1)}>
                <line x1={142} y1={518} x2={142} y2={444} stroke={VP.cream} strokeWidth={2.2} strokeDasharray="5 4" />
                <circle cx={142} cy={520} r={6} fill="#F8D348" stroke={VP.ink} strokeWidth={1.6} />
                <SvgSlabLabel x={142} y={426} text="PARUKUYAN" fontSize={19} scale={lerp(0.8, 1.0, clamp(parukuyanLblT, 0, 1.04))} />
              </g>
            )}
          </g>

          {/* Soft Aerial Perspective Mist Veil Separating Far Cones from Mid/Front Cones! */}
          <rect x={-80} y={640} width={880} height={150} fill="#DCE2D6" opacity={0.34} filter="url(#ptMistBlur)" />

          {/* === DEPTH 3 (CENTER-RIGHT): PUNCAK MASIGIT (Tallest Peak!) === */}
          <g transform={`translate(${lerp(-38, 22, orbitT).toFixed(1)}, 0)`}>
            {activePeak === 'masigit' && <circle cx={432} cy={455} r={155} fill="#FFF4CC" opacity={0.48} filter="url(#ptSunBloom)" />}
            <ErodedGouacheVolcano f={f} cx={432} baseY={848} peakY={446} halfW={225} mode="dusk" sunFromLeft opacity={0.94} />
            {masigitLblT > 0.02 && (
              <g opacity={clamp(masigitLblT, 0, 1)}>
                <line x1={432} y1={440} x2={432} y2={342} stroke={VP.cream} strokeWidth={2.2} strokeDasharray="5 4" />
                <circle cx={432} cy={444} r={6.5} fill="#F8D348" stroke={VP.ink} strokeWidth={1.6} />
                <SvgSlabLabel x={432} y={324} text="MASIGIT" fontSize={26} scale={lerp(0.8, 1.0, clamp(masigitLblT, 0, 1.04))} />
              </g>
            )}
          </g>

          {/* === DEPTH 4 (HERO FRONT CENTER-LEFT): PUNCAK UTAMA GUNUNG GUNTUR === */}
          <g transform={`translate(${lerp(0, -40, orbitT).toFixed(1)}, 0)`}>
            {activePeak === 'guntur' && <circle cx={302} cy={520} r={160} fill="#FFF4CC" opacity={0.48} filter="url(#ptSunBloom)" />}
            <ErodedGouacheVolcano f={f} cx={302} baseY={868} peakY={512} halfW={280} mode="dusk" sunFromLeft />
            {gunturLblT > 0.02 && (
              <g opacity={clamp(gunturLblT, 0, 1)}>
                <line x1={302} y1={506} x2={302} y2={264} stroke={VP.cream} strokeWidth={2.4} strokeDasharray="6 4" />
                <circle cx={302} cy={510} r={7.5} fill="#C83426" stroke={VP.cream} strokeWidth={2.2} />
                <SvgSlabLabel x={302} y={246} text="GUNTUR" fontSize={32} scale={lerp(0.82, 1.0, clamp(gunturLblT, 0, 1.04))} />
              </g>
            )}
          </g>

          {/* Soft Base Mist Collar & Dappled Highland Valley Floor */}
          <BaseMistCollar f={f} y={818} tone="day" opacity={0.86} />
          <path d="M -120 845 Q 160 812, 360 838 T 840 822 L 840 1340 L -120 1340 Z" fill="#4B6A3C" />
          <path d="M -120 912 Q 220 878, 460 905 T 840 895 L 840 1340 L -120 1340 Z" fill="#354F2D" />
          <rect x={-120} y={820} width={960} height={520} fill="url(#ptHorizontalBrush)" opacity={0.9} />

          {/* Foreground Clouds Parting During Descent */}
          <g opacity={clamp(1 - descendT * 1.15, 0, 1)}>
            <LinelessGouacheCloud x={lerp(230, -195, descendT)} y={475} scale={2.15} tone="day" />
            <LinelessGouacheCloud x={lerp(495, 935, descendT)} y={525} scale={2.25} tone="day" flip />
          </g>
        </g>

        {aerialT > 0.15 && (
          <SvgSlabLabel x={360} y={145} text="KOMPLEKS GUNUNGAPI" fontSize={30} opacity={easeOutCubic((aerialT - 0.15) / 0.6)} />
        )}
      </svg>

      <CloudCurtainWipe progress={0.5 + openWipe * 0.5} tone="day" />
    </AbsoluteFill>
  );
};
