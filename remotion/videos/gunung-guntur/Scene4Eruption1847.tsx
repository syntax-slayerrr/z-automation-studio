import React from 'react';
import { AbsoluteFill } from 'remotion';
import { CUES, SCENES } from './story';
import {
  clamp,
  CloudCurtainWipe,
  continuousShake,
  easeInOutCubic,
  easeOutCubic,
  lerp,
  RetroSlabTitle3D,
  springSettle,
  VintageScaleBar,
} from './fx';
import {
  ErodedGouacheVolcano,
  LinelessEruptionPlume,
  LinelessGouacheCloud,
  PainterlyDefs,
  PainterlySky,
} from './painter';
import { WestJavaVintageAtlas, WJ_COORDS } from './WestJavaVintageAtlas';

/**
 * SCENE 4 — LETUSAN 1847 & SEBARAN ABU KE CIANJUR (00:39–00:54) [V2 LINELESS PAINTERLY GOUACHE]
 * 1. Trembling monumental "1847" + sliding "16–17 DESEMBER".
 * 2. Wide lineless gouache Gunung Guntur erupts with flash-blur blowout -> giant 4-tone billowing ash column + embers + lightning!
 * 3. Camera cranes up tracking the massive ash column into wind-swept upper atmosphere.
 * 4. Cloud-curtain wipe -> Continuous Aerial Zoom-Out onto real `d3-geo` West Java Vintage Atlas:
 *    Lineless billowing painted ash cloud sweeping GARUT -> CIANJUR + vintage red-white scale bar (±70 KM)!
 * 5. Ash haze settles + archival plaque "1847 · LETUSAN TERAKHIR TERCATAT" -> daytime cloud wipe into Scene 5!
 */
export const Scene4Eruption1847: React.FC<{ f: number }> = ({ f }) => {
  const s4Start = SCENES.s4Start;
  const s5Start = SCENES.s5Start;
  const localF = Math.max(0, f - s4Start);

  const title1847T = springSettle(localF / 18);
  const dateSlideT = easeOutCubic((localF - 6) / 18);

  const blastF = CUES.s4_blast - 4;
  const blastLocal = f - blastF;
  const flashOp =
    blastLocal >= 0 && blastLocal < 18
      ? blastLocal < 4
        ? (blastLocal / 4) * 0.94
        : (1 - (blastLocal - 4) / 14) * 0.94
      : 0;
  const blowoutProg = clamp(blastLocal / 14, 0, 1);
  const ashRise = easeOutCubic((blastLocal - 2) / 52);

  const craneUpT = easeInOutCubic((f - (CUES.s4_plume - 8)) / 42);

  const mapWipeF = CUES.s4_cianjur - 24;
  const mapWipeProg = clamp((f - mapWipeF) / 26, 0, 1);
  const showAtlas = f >= mapWipeF + 13;
  const atlasLocal = Math.max(0, f - (mapWipeF + 13));
  const plumeSpread = easeOutCubic((atlasLocal - 4) / 52);
  const zoomOutT = easeOutCubic(atlasLocal / 44);

  const lastBadgeT = springSettle((f - (CUES.s4_last - 4)) / 20);
  const exitWipe = clamp((f - (s5Start - 20)) / 20, 0, 1);

  const shakeMag = !showAtlas
    ? blastLocal >= 0
      ? 11 * clamp(1 - blastLocal / 100, 0.22, 1)
      : 4.5 * clamp(title1847T, 0, 1)
    : 0;
  const sh = continuousShake(f, shakeMag);

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#261420' }}>
      <div style={{ position: 'absolute', inset: 0, transform: `translate(${sh.x.toFixed(1)}px, ${sh.y.toFixed(1)}px)` }}>
        {/* === BEATS 1-3: WIDE LINELESS PAINTERLY 1847 ERUPTION + CRANE-UP ALONG ASH COLUMN === */}
        {!showAtlas && (
          <svg width={720} height={1280} viewBox="0 0 720 1280" style={{ position: 'absolute', inset: 0 }}>
            <PainterlyDefs />
            <PainterlySky f={f} mood="inferno" />

            <g transform={`translate(0, ${lerp(0, 290, craneUpT).toFixed(1)})`}>
              <LinelessGouacheCloud x={100} y={195} scale={1.15} tone="inferno" opacity={0.78} />
              <LinelessGouacheCloud x={625} y={240} scale={1.24} tone="inferno" opacity={0.78} flip />

              {/* Eroded Lineless Gouache Gunung Guntur Illuminated by Massive 1847 Blast */}
              <ErodedGouacheVolcano f={f} cx={360} baseY={895} peakY={578} halfW={415} mode="inferno" sunFromLeft />

              {/* Colossal Lineless 4-Tone Billowing Ash Column + Pyroclastic Flows + Embers + Lightning! */}
              <LinelessEruptionPlume f={f} cx={360} ventY={584} rise={ashRise} widthScale={1.24} showPyroclastic showLightning />

              {/* Wind-Swept Upper-Atmosphere Ash Specks Drifting Northwest */}
              {ashRise > 0.35 &&
                Array.from({ length: 24 }).map((_, pi) => {
                  const p = (f * 0.015 + pi * 0.13) % 1;
                  const px = 360 - p * 440 + Math.sin(pi * 3.1) * 55;
                  const py = 250 - p * 165 + (pi % 5) * 48;
                  return <circle key={pi} cx={px} cy={py} r={2.8 + (pi % 4) * 1.6} fill="#D8CCC2" opacity={(1 - p) * 0.72} />;
                })}

              {/* Dappled Dark Volcanic Foothills */}
              <path d="M -60 865 Q 360 838, 780 870 L 780 1280 L -60 1280 Z" fill="#2A1F20" />
              <rect x={-60} y={845} width={840} height={440} fill="url(#ptHorizontalBrush)" opacity={0.85} />
            </g>
          </svg>
        )}

        {/* === BEATS 4 & 5: CONTINUOUS AERIAL ZOOM-OUT TO WEST JAVA ATLAS (GARUT -> CIANJUR) === */}
        {showAtlas && (
          <svg width={720} height={1280} viewBox="0 0 720 1280" style={{ position: 'absolute', inset: 0 }}>
            <PainterlyDefs />
            <WestJavaVintageAtlas
              f={f}
              center={[lerp(107.75, 107.48, zoomOutT), lerp(-7.08, -6.95, zoomOutT)]}
              scale={lerp(24000, 14800, zoomOutT)}
              centerY={570}
              ashPlume={{ from: WJ_COORDS.guntur, to: WJ_COORDS.cianjur, progress: plumeSpread }}
              pins={[
                { id: 'grt', label: 'GARUT', sublabel: 'G. GUNTUR', coord: WJ_COORDS.guntur, appearT: 1, labelDir: 'bottom', color: '#C8321E' },
                { id: 'bdg', label: 'BANDUNG', coord: WJ_COORDS.bandung, appearT: 0.75, labelDir: 'right', color: '#4A3A2E' },
                { id: 'cjr', label: 'CIANJUR', coord: WJ_COORDS.cianjur, appearT: easeOutCubic((plumeSpread - 0.55) / 0.38), slab: true, labelDir: 'top', color: '#C8321E' },
              ]}
            />
            <rect width={720} height={1280} fill="url(#ptHorizontalBrush)" opacity={0.42} />

            <VintageScaleBar x={360} y={825} width={250} label="SEBARAN ABU ±70 KM" progress={easeOutCubic((plumeSpread - 0.35) / 0.55)} />

            {lastBadgeT > 0.02 && (
              <rect width={720} height={1280} fill="#443E4A" opacity={clamp(lastBadgeT, 0, 1) * 0.44} />
            )}
          </svg>
        )}

        {!showAtlas && blowoutProg < 0.98 && (
          <RetroSlabTitle3D
            lines={['1847']}
            subtitle="16 – 17 DESEMBER"
            top={155}
            fontSize={92}
            opacity={clamp(title1847T, 0, 1) * (1 - blowoutProg)}
            scale={lerp(0.8, 1.0, clamp(title1847T, 0, 1.06)) + blowoutProg * 1.5}
            blurPx={blowoutProg * 16}
            subOffsetX={lerp(-180, 0, dateSlideT)}
            subOpacity={dateSlideT}
          />
        )}

        {showAtlas && lastBadgeT > 0.02 && (
          <RetroSlabTitle3D
            lines={['1847']}
            subtitle="LETUSAN TERAKHIR TERCATAT"
            top={156}
            fontSize={72}
            opacity={clamp(lastBadgeT, 0, 1)}
            scale={lerp(0.86, 1.0, clamp(lastBadgeT, 0, 1.04))}
          />
        )}

        {flashOp > 0.01 && (
          <div style={{ position: 'absolute', inset: 0, backgroundColor: '#FFF6DC', opacity: flashOp, pointerEvents: 'none' }} />
        )}
      </div>

      <CloudCurtainWipe progress={mapWipeProg} tone="ash" />
      <CloudCurtainWipe progress={exitWipe * 0.5} tone="day" />
    </AbsoluteFill>
  );
};
