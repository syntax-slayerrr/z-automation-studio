import React from 'react';
import { AbsoluteFill } from 'remotion';
import { CUES, SCENES } from './story';
import {
  clamp,
  CloudCurtainWipe,
  continuousShake,
  easeInOutCubic,
  easeOutCubic,
  easeOutQuint,
  lerp,
  microShake,
  RetroSlabTitle3D,
  springSettle,
  VP,
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
 * SCENE 2 — SEJARAH NAMA & LETUSAN 1829 (00:10–00:23) [V2 LINELESS PAINTERLY GOUACHE]
 * 1. 19th-Century West Java Atlas unfolds cleanly & zooms into Garut.
 * 2. Ink-writing reveal "GUNUNG KUTU" & "DONDERBERG" + colonial stamp (fades cleanly to 0 before 1829!).
 * 3. Monumental "1829" pops with seismic tremor -> 1:1 flash-blur blowout!
 * 4. Full LINELESS Painterly 1829 Inferno Eruption (fire-lit smoke belly, twin pyroclastic flows, embers, lightning) -> ash curtain wipe!
 */
export const Scene2Colonial1829: React.FC<{ f: number }> = ({ f }) => {
  const s2Start = SCENES.s2Start;
  const s3Start = SCENES.s3Start;
  const localF = Math.max(0, f - s2Start);

  const unfoldT = easeOutQuint(localF / 22);
  const mapZoomT = easeInOutCubic(localF / 68);
  const kutuT = easeOutCubic((f - (CUES.s2_kutu - 6)) / 20);
  const donderT = easeOutCubic((f - (CUES.s2_donder - 6)) / 20);
  const stampT = springSettle((f - (CUES.s2_donder + 8)) / 14);
  const yr1829T = springSettle((f - (CUES.s2_1829 - 6)) / 18);

  const eruptF = CUES.s2_erupt - 4;
  const eruptLocal = f - eruptF;
  const flashOp =
    eruptLocal >= 0 && eruptLocal < 18
      ? eruptLocal < 4
        ? (eruptLocal / 4) * 0.92
        : (1 - (eruptLocal - 4) / 14) * 0.92
      : 0;
  const blowoutProg = clamp(eruptLocal / 14, 0, 1);
  const eruptSceneOp = clamp((eruptLocal - 2) / 8, 0, 1);
  const ashRise = easeOutCubic((eruptLocal - 3) / 48);

  const endWipe = clamp((f - (s3Start - 22)) / 24, 0, 1);

  const stampShake = microShake(f, CUES.s2_donder + 8, 10, 5);
  const tremorAmt =
    eruptSceneOp > 0.1
      ? 9.5 * clamp(1 - eruptLocal / 115, 0.25, 1)
      : yr1829T > 0.1
        ? 4.2 * clamp(yr1829T, 0, 1)
        : 0;
  const quake = continuousShake(f, tremorAmt);
  const sx = stampShake.x + quake.x;
  const sy = stampShake.y + quake.y;

  const mapLng = lerp(107.25, WJ_COORDS.guntur[0], mapZoomT);
  const mapLat = lerp(-6.75, WJ_COORDS.guntur[1], mapZoomT);
  const mapScale = lerp(11800, 24000, mapZoomT);

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#244F68' }}>
      <div style={{ position: 'absolute', inset: 0, transform: `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px)` }}>
        {/* === BEATS 1-3: 19TH-CENTURY COLONIAL WEST JAVA ATLAS MAP === */}
        {eruptSceneOp < 0.98 && (
          <svg
            width={720}
            height={1280}
            viewBox="0 0 720 1280"
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 1 - eruptSceneOp,
              transform: `scaleX(${lerp(0.32, 1.0, unfoldT).toFixed(3)})`,
            }}
          >
            <PainterlyDefs />
            <WestJavaVintageAtlas
              f={f}
              center={[mapLng, mapLat]}
              scale={mapScale}
              centerY={585}
              colonialTint={0.85}
              pins={[
                { id: 'bat', label: 'BATAVIA', coord: WJ_COORDS.batavia, appearT: 1, labelDir: 'top', color: '#4A3A2E' },
                { id: 'bdg', label: 'BANDOENG', coord: WJ_COORDS.bandung, appearT: easeOutCubic((localF - 14) / 16), labelDir: 'left', color: '#4A3A2E' },
                { id: 'gtr', label: 'GAROET', sublabel: 'GUNUNG GUNTUR', coord: WJ_COORDS.guntur, appearT: easeOutCubic((localF - 24) / 18), slab: true, labelDir: 'bottom', color: '#C8321E' },
              ]}
            />
            <rect width={720} height={1280} fill="url(#ptHorizontalBrush)" opacity={0.5} />
            <line x1={360} y1={0} x2={360} y2={1280} stroke="#2E2218" strokeWidth={2} opacity={0.14} />
            <line x1={0} y1={640} x2={720} y2={640} stroke="#2E2218" strokeWidth={2} opacity={0.12} />

            {/* BEAT 2: INK-WRITTEN COLONIAL ARCHIVAL CALLOUTS (cleanly fade to 0 BEFORE 1829 enters!) */}
            {kutuT > 0.01 && (
              <g opacity={clamp(1 - yr1829T * 2.5, 0, 1)}>
                <clipPath id="kutuClip">
                  <rect x={85} y={248} width={550 * kutuT} height={74} />
                </clipPath>
                <g clipPath="url(#kutuClip)">
                  <rect x={115} y={256} width={490} height={58} rx={4} fill="#F2E6CC" fillOpacity={0.95} stroke={VP.ink} strokeWidth={2.0} />
                  <text x={360} y={295} textAnchor="middle" fill="#2A1C18" fontFamily='"Alfa Slab One", serif' fontSize={32} letterSpacing="2px">
                    GUNUNG KUTU
                  </text>
                </g>
              </g>
            )}

            {donderT > 0.01 && (
              <g opacity={clamp(1 - yr1829T * 2.5, 0, 1)}>
                <clipPath id="donderClip">
                  <rect x={85} y={328} width={550 * donderT} height={76} />
                </clipPath>
                <g clipPath="url(#donderClip)">
                  <rect x={135} y={336} width={450} height={58} rx={4} fill="#1E2631" fillOpacity={0.94} stroke="#E4D2B0" strokeWidth={1.8} />
                  <text x={360} y={375} textAnchor="middle" fill="#FAF1DC" fontFamily='"Alfa Slab One", serif' fontSize={31} letterSpacing="2.4px">
                    DONDERBERG
                  </text>
                </g>
              </g>
            )}

            {stampT > 0.02 && (
              <g
                transform={`translate(548, 462) rotate(-14) scale(${lerp(1.65, 1.0, clamp(stampT, 0, 1.04)).toFixed(3)})`}
                opacity={clamp(stampT, 0, 1) * clamp(1 - yr1829T * 2.4, 0, 1) * 0.88}
              >
                <circle cx={0} cy={0} r={66} fill="#F4E8CE" fillOpacity={0.22} stroke="#8F2620" strokeWidth={4} strokeDasharray="10 3" />
                <circle cx={0} cy={0} r={54} fill="none" stroke="#8F2620" strokeWidth={1.8} />
                <text x={0} y={-14} textAnchor="middle" fill="#8F2620" fontFamily='"Plus Jakarta Sans", sans-serif' fontSize={12} fontWeight={800} letterSpacing="2.5px">
                  NEDERLANDSCH
                </text>
                <text x={0} y={7} textAnchor="middle" fill="#8F2620" fontFamily='"Alfa Slab One", serif' fontSize={18} letterSpacing="1.6px">
                  ARCHIEF
                </text>
                <text x={0} y={26} textAnchor="middle" fill="#8F2620" fontFamily='"Plus Jakarta Sans", sans-serif' fontSize={11.5} fontWeight={800} letterSpacing="2px">
                  PRIANGAN · GAROET
                </text>
              </g>
            )}
          </svg>
        )}

        {/* === BEAT 4: 1:1 LINELESS PAINTERLY 1829 INFERNO ERUPTION (Danau Toba Panel 3 Craft!) === */}
        {eruptSceneOp > 0.01 && (
          <svg width={720} height={1280} viewBox="0 0 720 1280" style={{ position: 'absolute', inset: 0, opacity: eruptSceneOp }}>
            <PainterlyDefs />
            <PainterlySky f={f} mood="inferno" />
            <LinelessGouacheCloud x={95} y={290} scale={1.15} tone="inferno" opacity={0.72} />
            <LinelessGouacheCloud x={630} y={340} scale={1.2} tone="inferno" opacity={0.72} flip />

            {/* Eroded Lineless Gouache Gunung Guntur Lit by Volcanic Fire */}
            <ErodedGouacheVolcano f={f} cx={360} baseY={895} peakY={555} halfW={410} mode="inferno" sunFromLeft />

            {/* Glowing Molten Lava Tongues Streaming Down the Volcanic Ridges */}
            <path d="M 342 565 Q 305 660, 252 785 M 378 565 Q 422 665, 495 802" fill="none" stroke="#F68E28" strokeWidth={11} strokeLinecap="round" opacity={0.85} />
            <path d="M 342 565 Q 305 660, 252 785 M 378 565 Q 422 665, 495 802" fill="none" stroke="#FFF4B4" strokeWidth={3.6} strokeLinecap="round" />

            {/* Towering Lineless 4-Tone Ash Plume + Twin Pyroclastic Clouds + Embers + Lightning! */}
            <LinelessEruptionPlume f={f} cx={360} ventY={562} rise={ashRise} widthScale={1.08} showPyroclastic showLightning />

            {/* Dappled Dark Volcanic Foothills */}
            <path d="M -40 868 Q 360 842, 760 872 L 760 1280 L -40 1280 Z" fill="#2A1F22" />
            <rect x={-40} y={845} width={800} height={440} fill="url(#ptHorizontalBrush)" opacity={0.85} />
          </svg>
        )}

        {/* BEAT 3 -> 4: MONUMENTAL "1829" WITH 1:1 RADIAL-BLUR BLOWOUT ON ERUPTION! */}
        {yr1829T > 0.02 && blowoutProg < 0.98 && (
          <RetroSlabTitle3D
            lines={['1829']}
            subtitle="LETUSAN BESAR"
            top={155}
            fontSize={86}
            opacity={clamp(yr1829T, 0, 1) * (1 - blowoutProg)}
            scale={lerp(0.8, 1.0, clamp(yr1829T, 0, 1.06)) + blowoutProg * 1.45}
            blurPx={blowoutProg * 15}
          />
        )}

        {flashOp > 0.01 && (
          <div style={{ position: 'absolute', inset: 0, backgroundColor: '#FFF6DC', opacity: flashOp, pointerEvents: 'none' }} />
        )}
      </div>

      <CloudCurtainWipe progress={endWipe * 0.5} tone="ash" />
    </AbsoluteFill>
  );
};
