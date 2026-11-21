import React from "react";
import { AbsoluteFill, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { AtlasMap2D, GEO, type MapPinSpec, type MapRouteSpec } from "../../shared/AtlasMap2D";
import {
  CharterStampCard,
  DioramaShadowDefs,
  EraMontageArtifacts,
  ForegroundBlurEdge,
  ForegroundRail,
  NomenclatureMorphBanner,
  VolumetricShafts,
} from "../../shared/CinematicV2";
import {
  Cam2D,
  EASE_CAM,
  EASE_IN_OUT,
  EASE_OUT,
  EditorialCallout,
  K3,
  PerspStage,
  camAt,
  clamp,
  lerp,
  shake,
  springObj,
  tweenE,
} from "../../shared/Flat3DCamera";
import { HeritageKid, type KidLook } from "../../shared/HeritageKid";
import {
  BanyanTree,
  HeritageBrassLamp,
  HeritageHall,
  RollingRidge,
  StageBackdrop,
  SunAura,
} from "../../shared/HeritageProps25D";
import { IpmEmblem25D } from "../../shared/IpmEmblem25D";
import { DualDepthDust, FONT_SANS, FONT_SERIF } from "../../shared/PaperTextures";
import { SCENES, cue } from "./script";

const Y_CREATIVE_LOOKS: KidLook[] = [
  { skin: "#d6a47a", skinShade: "#ba855d", shirt: "#f4ebd7", shirtShade: "#dbd0b6", pants: "#262320", hat: "peci", hatColor: "#181512" },
  { skin: "#c8926a", skinShade: "#ab734c", shirt: "#0b7b3e", shirtShade: "#07592c", pants: "#1f2a24", hat: "hijab", hatColor: "#f3ead6" },
  { skin: "#dba87e", skinShade: "#bf885f", shirt: "#214b3a", shirtShade: "#143124", pants: "#24211e", hat: "peci", hatColor: "#14110f" },
];

/**
 * SCENE 04 (S3) — 1992–2008 · REFORMASI, PETA KEMBALI & AURA EMAS SOLO 2008
 * Multi-depth floating parallax on 1998 newspaper & CRT monitor -> Medan 2006 / Tanwir 2007 / Solo 2008
 * map flight -> golden aura starburst & specular sweep as IRM restores into IPM.
 */
export const Scene3Kembali2008: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = SCENES[3].dur;

  const tEra = cue(3, "s3_era", 52);
  const tChange = cue(3, "s3_change", 151);
  const tQ = cue(3, "s3_q", 254);
  const tMedan = cue(3, "s3_medan", 338);
  const tTanwir = cue(3, "s3_tanwir", 476);
  const tSolo = cue(3, "s3_solo", 609);
  const tReturn = cue(3, "s3_return", 723);
  const tIpmBack = cue(3, "s3_ipmback", 733);

  const s3Entry = 1 - tweenE(f, 0, 12, EASE_OUT);
  const s3Exit = tweenE(f, dur - 12, dur, EASE_IN_OUT);
  const mapBlend = tweenE(f, tMedan - 24, tMedan + 10, EASE_IN_OUT);
  const climaxBlend = tweenE(f, tSolo - 14, tSolo + 22, EASE_IN_OUT);
  const returnMix = tweenE(f, tReturn - 8, tIpmBack + 16, EASE_OUT);
  const remajaMix = 1 - returnMix;
  const cheerSpring = springObj(f, tReturn - 2, fps, "character");
  const tanwirCardIn = tweenE(f, tTanwir - 8, tTanwir + 16, EASE_OUT);
  const tanwirStamp = springObj(f, tTanwir + 10, fps, "heavy");

  const shine = interpolate(f, [tIpmBack - 6, tIpmBack + 32], [-0.2, 1.2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const routes: MapRouteSpec[] = [
    { id: "r_m_y", from: [98.67, 3.59], to: GEO.yogyakarta, startFrame: tMedan + 12, endFrame: tTanwir, color: "#0b7b3e", traveler: "walker", arcBendDeg: 2.2 },
    { id: "r_y_s", from: GEO.yogyakarta, to: GEO.surakarta, startFrame: tTanwir, endFrame: tSolo, color: "#cfa043", traveler: "walker", arcBendDeg: 0.8 },
  ];

  const pins: MapPinSpec[] = [
    { id: "mdn06", label: "MEDAN · 2006", sublabel: "MUKTAMAR XV", coord: [98.67, 3.59], triggerFrame: tMedan + 2, color: "#0b7b3e", size: "md", labelSide: "bottom" },
    { id: "yog07", label: "TANWIR · 2007", sublabel: "YOGYAKARTA", coord: GEO.yogyakarta, triggerFrame: tTanwir - 6, color: "#8d2416", size: "md", labelSide: "left" },
    { id: "solo08", label: "SOLO · 2008", sublabel: "MUKTAMAR XVI", coord: GEO.surakarta, triggerFrame: tSolo - 12, color: "#c98b16", size: "lg", labelSide: "top" },
  ];

  const camP = camAt(f, [
    K3(0, 485, 960, 1.0),
    K3(tChange, 575, 935, 1.04),
    K3(tQ, 540, 925, 1.06),
    K3(tMedan, 540, 925, 1.06),
  ]);

  // Student gaze tracking upward from Reformasi 1998 -> question callout
  const lookShift = tweenE(f, tChange - 6, tQ + 14, EASE_OUT);

  return (
    <AbsoluteFill style={{ backgroundColor: "#1d1a16" }}>
      {/* Stage 1: 1992-2006 Dynamic Parallax on Reformasi 1998 & Shifting Political Map */}
      {mapBlend < 0.99 && (
        <div style={{ position: "absolute", inset: 0, opacity: 1 - mapBlend }}>
          <PerspStage tiltXDeg={3.8} tiltYDeg={Math.sin(f * 0.028) * 1.6}>
            <svg viewBox="0 0 1080 1920" width="1080" height="1920">
              <DioramaShadowDefs />
              <defs>
                <pattern id="s3PaperGrain" width="256" height="256" patternUnits="userSpaceOnUse">
                  <image href={staticFile("art/textures/parchment_grain_alpha.png")} width="256" height="256" />
                </pattern>
              </defs>
              <StageBackdrop id="s3_era_sky" top="#202831" mid="#393429" bottom="#231b12" />
              <rect x={0} y={0} width={1080} height={1920} fill="url(#s3PaperGrain)" opacity={0.38} />
              <VolumetricShafts id="s3_era_beam" f={f} color="#f5cf8b" intensity={0.2} angleDeg={-12} sourceX={420} />

              <Cam2D cx={camP[0]} cy={camP[1]} zoom={camP[2] + s3Entry * 0.04}>
                {/* Context header for 1992-1998 IRM outside school fence before Reformasi & Question */}
                {f < tQ + 8 && (
                  <g opacity={1 - tweenE(f, tQ - 16, tQ + 8, EASE_OUT)}>
                    <text
                      x={540}
                      y={310}
                      textAnchor="middle"
                      fontFamily={FONT_SANS}
                      fontWeight={800}
                      fontSize={16}
                      letterSpacing={3.2}
                      fill="#cbb384"
                      opacity={0.85}
                    >
                      DI LUAR PAGAR SEKOLAH · ERA IRM 1992–1998
                    </text>
                  </g>
                )}

                <EraMontageArtifacts
                  x={540}
                  y={585}
                  f={f}
                  progress={tweenE(f, Math.max(0, tEra - 28), tChange + 45, EASE_OUT)}
                  camX={camP[0]}
                  curveProg={tweenE(f, tChange - 8, tQ + 8, EASE_OUT)}
                />

                {/* Pulsing conceptual radar rings under "siapa yang sebenarnya mereka wakili?" */}
                <g opacity={tweenE(f, tQ - 20, tQ + 14, EASE_OUT)}>
                  <circle
                    cx={540}
                    cy={1035}
                    r={215 + Math.sin(f * 0.08) * 8}
                    fill="none"
                    stroke="#d4aa57"
                    strokeWidth={3}
                    strokeDasharray="10 8"
                    opacity={0.55}
                  />
                  <circle
                    cx={540}
                    cy={1035}
                    r={142 + Math.cos(f * 0.09) * 6}
                    fill="none"
                    stroke="#7bd19b"
                    strokeWidth={2.5}
                    opacity={0.6}
                  />
                </g>

                {/* Architectural terrace wall baseboard & perspective stone paving anchoring kids */}
                <polygon points="-240,1300 1320,1300 1320,2180 -240,2180" fill="#1b150e" />
                <polygon points="80,1300 1000,1300 1360,2180 -280,2180" fill="#2c2217" opacity={0.78} />
                <rect x={-240} y={1284} width={1560} height={18} fill="#14100a" stroke="#53422c" strokeWidth={1.6} />
                {[1365, 1445, 1550, 1685].map((fy) => (
                  <line key={fy} x1={-200} y1={fy} x2={1280} y2={fy} stroke="#140f09" strokeWidth={2} opacity={0.44} />
                ))}
                {[-320, -140, 40, 220, 400].map((dx, di) => (
                  <line
                    key={di}
                    x1={540 + dx * 0.55}
                    y1={1302}
                    x2={540 + dx * 1.9}
                    y2={2160}
                    stroke="#140f09"
                    strokeWidth={2}
                    opacity={0.36}
                  />
                ))}
                <ellipse cx={540} cy={1382} rx={380} ry={48} fill="#f5cf8b" opacity={0.09} />

                {Y_CREATIVE_LOOKS.map((lk, idx) => {
                  const kx = 310 + idx * 230;
                  const scanSweep = idx === 1 ? Math.sin(f * 0.14) * 14 * (1 - lookShift * 0.55) : 0;
                  const headSway = Math.sin(f * 0.095 + idx * 1.4) * 1.6;
                  return (
                    <g key={idx}>
                      <g style={{ filter: "blur(5.5px)" }}>
                        <ellipse cx={kx + 12} cy={1380} rx={66} ry={12} fill="#0c0804" opacity={0.38} />
                        <ellipse cx={kx} cy={1376} rx={48} ry={8} fill="#080502" opacity={0.46} />
                      </g>
                      <HeritageKid
                        look={lk}
                        f={f}
                        x={kx}
                        y={1375}
                        scale={0.94}
                        head={lerp(idx === 0 ? 5 : -4, 0, lookShift) + headSway + scanSweep * 0.18}
                        brow={lerp(-0.2, -0.55, lookShift)}
                        smile={0.05}
                        look2={[lerp(-0.35, 0, lookShift) + scanSweep * 0.015, lerp(-0.25, -0.55, lookShift)]}
                        armR={idx === 1 ? [-30 + scanSweep * 0.65, -42 + scanSweep] : undefined}
                        armL={idx === 1 ? [4, 8] : undefined}
                        held={idx === 1 ? "magnifier" : "book"}
                        headLag={1}
                        useV2Blink
                        tactile
                        castShadow
                        rimSide={idx < 2 ? "R" : "L"}
                        rimColor="#ffd888"
                        rimStrength={0.4}
                        seed={40 + idx * 5}
                      />
                    </g>
                  );
                })}

                {f >= tQ - 3 && (
                  <EditorialCallout
                    x={540}
                    y={830}
                    sub="PERUBAHAN ZAMAN"
                    text="SIAPA YANG DIWAKILI?"
                    t={f - (tQ - 3)}
                    size={40}
                    color="#ffe5a3"
                    halo="rgba(20,16,12,0.9)"
                  />
                )}
              </Cam2D>
              <ForegroundRail scrollX={camP[0]} dark />
              <DualDepthDust color="#f5cf8b" count={22} opacity={0.34} seed="s3a-dust" />
              {s3Entry > 0.01 && (
                <rect x={-40} y={-40} width={1160} height={2000} fill="#11151b" opacity={s3Entry * 0.92} />
              )}
            </svg>
          </PerspStage>
        </div>
      )}

      {/* Stage 2: Medan 2006 -> Tanwir Yogya 2007 -> Solo 2008 Strategic Flight */}
      {mapBlend > 0.01 && climaxBlend < 0.99 && (
        <div style={{ position: "absolute", inset: 0, opacity: mapBlend * (1 - climaxBlend) }}>
          <AtlasMap2D
            tactile
            fromCenter={[102.0, -0.5]}
            toCenter={[110.5, -7.65]}
            fromZoom={1.38}
            toZoom={2.58}
            moveStartFrame={tMedan + 14}
            moveEndFrame={tSolo + 10}
            midFlightZoomDip={0.58}
            activeIslands={["sumatera", "jawa"]}
            activeIslandFrame={tMedan}
            routes={routes}
            pins={pins}
            focalYRatio={0.43}
            compassGeo={[113.5, -5.8]}
            tiltDeg={11}
            idleDrift={0.025}
          />
          {f >= tTanwir - 6 && (
            <svg viewBox="0 0 1080 1920" width="1080" height="1920" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
              <CharterStampCard
                x={540}
                y={1285}
                w={430}
                h={168}
                year="2007"
                title="Rekomendasi Nomenklatur IPM"
                stakeholder="SIDANG TANWIR & PP MUHAMMADIYAH"
                enter={tanwirCardIn}
                stampProg={tanwirStamp}
                accent="#0b7b3e"
                tactile
                stampText="SAH"
              />
            </svg>
          )}
        </div>
      )}

      {/* Stage 3: Climax 2008 Muktamar XVI Solo — Golden Starburst Aura & Specular Sweep */}
      {climaxBlend > 0.01 && (
        <div style={{ position: "absolute", inset: 0, opacity: climaxBlend }}>
          <PerspStage
            tiltXDeg={lerp(4.8, 1.2, returnMix)}
            tiltYDeg={Math.sin(f * 0.028) * 1.1}
          >
            <svg viewBox="0 0 1080 1920" width="1080" height="1920">
              <DioramaShadowDefs />
              <defs>
                <linearGradient id="s3ShoeRefl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffdc6c" stopOpacity="0.64" />
                  <stop offset="45%" stopColor="#e8a735" stopOpacity="0.34" />
                  <stop offset="100%" stopColor="#693e0e" stopOpacity="0" />
                </linearGradient>
              </defs>

              <Cam2D
                cx={540}
                cy={lerp(960, 930, returnMix)}
                zoom={lerp(1.0, 1.055, tweenE(f, tSolo, dur, EASE_CAM)) + s3Exit * 0.04}
              >
                {/* Luminous radial sunburst backdrop & glossy hardwood stage floor aligned directly under kids' shoes */}
                <rect x={-160} y={1800} width={1400} height={360} fill="#1a0e04" />
                <image
                  href={staticFile("art/ep02/s3_solo_stage_bg.jpg")}
                  x={-108}
                  y={-426}
                  width={1296}
                  height={2304}
                  preserveAspectRatio="xMidYMid slice"
                />
                <SunAura id="s3_hero_aura" x={540} y={455} r={660} color="#ffe38e" op={0.26 + 0.5 * returnMix} />
                <VolumetricShafts
                  id="s3_gold_beam"
                  f={f}
                  color="#ffe89c"
                  intensity={0.14 + 0.1 * returnMix}
                  angleDeg={6}
                  sourceX={540}
                />

                {/* Sharp focal IPM Emblem with luminous outer golden glow halo */}
                <g filter="url(#dioramaRimGlow)">
                  <IpmEmblem25D
                    x={540}
                    y={450}
                    scale={lerp(0.84, 0.96, clamp(returnMix * 1.05, 0, 1.08))}
                    irmMode={remajaMix}
                    fracture={(1 - returnMix) * 0.32}
                    sunSpin={f * 0.45}
                    shineSweep={shine}
                    glow={0.56 + 0.48 * returnMix}
                    auraBoost={returnMix}
                    tactile
                    uid="s3_reborn"
                  />
                </g>

                <g filter="url(#dioramaCardShadow)">
                  <NomenclatureMorphBanner
                    x={540}
                    y={775}
                    remajaMix={remajaMix}
                    goldHighlight={returnMix}
                    width={860}
                  />
                </g>

                {/* Attached golden floor contact pool & specular shoe reflections flush at y=1422 */}
                <g>
                  {Y_CREATIVE_LOOKS.map((_, idx) => {
                    const kx = 260 + idx * 280;
                    return (
                      <g key={`refl_${idx}`}>
                        <ellipse cx={kx} cy={1428} rx={96} ry={18} fill="#ffd86e" opacity={0.22 * returnMix} />
                        <g style={{ filter: "blur(3.2px)" }}>
                          <ellipse cx={kx - 17} cy={1466} rx={16} ry={46} fill="url(#s3ShoeRefl)" />
                          <ellipse cx={kx + 17} cy={1466} rx={16} ry={46} fill="url(#s3ShoeRefl)" />
                        </g>
                        <g style={{ filter: "blur(5px)" }}>
                          <ellipse cx={kx} cy={1426} rx={54} ry={9} fill="#1b0d03" opacity={0.36} />
                        </g>
                      </g>
                    );
                  })}
                </g>

                {Y_CREATIVE_LOOKS.map((lk, idx) => {
                  const c = clamp(cheerSpring, 0, 1.08);
                  const postCheer = clamp((f - (tReturn + 10)) / 18);
                  const wave = Math.sin(f * 0.24 + idx * 1.15) * 9 * postCheer;
                  return (
                    <HeritageKid
                      key={idx}
                      look={lk}
                      f={f}
                      x={260 + idx * 280}
                      y={1424}
                      scale={0.86}
                      flip={idx === 2}
                      walk={postCheer > 0.05 ? f * 0.26 + idx * 1.3 : 0}
                      walkAmp={postCheer * 0.22}
                      head={(idx === 0 ? 4 : idx === 2 ? -4 : 0) + Math.sin(f * 0.14 + idx * 1.4) * 2.2 * postCheer}
                      brow={0.28 * returnMix}
                      smile={lerp(0.35, 0.88, returnMix)}
                      look2={[idx === 0 ? 0.25 : idx === 2 ? -0.25 : 0, -0.22]}
                      headLag={1}
                      useV2Blink
                      tactile
                      castShadow
                      rimSide={idx === 2 ? "L" : "R"}
                      rimColor="#ffe89c"
                      rimStrength={0.56}
                      armL={[lerp(14, 134, c) + wave, lerp(18, 20 + wave * 0.6, c)]}
                      armR={[lerp(-34, 134, c) - wave, lerp(-45, 20 - wave * 0.6, c)]}
                      seed={52 + idx}
                    />
                  );
                })}

                <EditorialCallout
                  x={540}
                  y={975}
                  sub="MUKTAMAR XVI · SURAKARTA"
                  text="2008 · IPM RESMI KEMBALI"
                  t={Math.max(1, f - (tSolo - 4))}
                  size={36}
                  color="#ffe9a6"
                  halo="rgba(26,15,4,0.88)"
                />
              </Cam2D>

              <ForegroundBlurEdge id="s3_fg" camX={540} color="#170f07" opacity={0.44} />
              <DualDepthDust color="#ffe89e" count={28} opacity={0.56} seed="s3b-dust" />

              {/* Golden dawn light-bloom outro bridging Solo 2008 into Bantul 2010 Pendopo */}
              {s3Exit > 0.01 && (
                <rect x={-40} y={-40} width={1160} height={2000} fill="#eadec6" opacity={s3Exit * 0.90} />
              )}
            </svg>
          </PerspStage>
        </div>
      )}
    </AbsoluteFill>
  );
};

/**
 * SCENE 05 (S4) — BANTUL, JULI 2010 · RUMAH KREATIF PELAJAR INDONESIA
 * Dawn Pendopo Yogyakarta courtyard with rich secondary motion: swaying banyan leaves,
 * blurred foreground foliage, and three pelajar actively sketching, holding lantern & discussing.
 */
export const Scene4GerakanBaru2010: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = SCENES[4].dur;

  const tTwo = cue(4, "s4_twoyr", 7);
  const tMkt17 = cue(4, "s4_mkt17", 141);
  const tGpk = cue(4, "s4_gpk", 262);
  const tGkt = cue(4, "s4_gkt", 330);
  const tRumah = cue(4, "s4_rumah", 468);

  const camP = camAt(f, [
    K3(0, 526, 954, 1.0),
    K3(tMkt17, 540, 944, 1.022),
    K3(tGpk, 548, 938, 1.036),
    K3(tRumah + 18, 540, 934, 1.045),
    K3(dur, 540, 934, 1.045),
  ]);

  const s4Entry = 1 - tweenE(f, 0, 12, EASE_OUT);
  const s4Exit = tweenE(f, dur - 12, dur, EASE_IN_OUT);
  const emblemScale = springObj(f, tTwo, fps, "object");
  const gpkEnter = tweenE(f, tMkt17 - 8, tGpk + 12, EASE_OUT);
  const gpkStamp = springObj(f, tGpk + 8, fps, "heavy");
  const thudGpk = shake(f - (tGpk + 8), 8);
  const gktEnter = tweenE(f, tGkt - 10, tGkt + 16, EASE_OUT);

  // Secondary activity cycles for the three creative students
  const s = f / 30;
  const writeSwing = Math.sin(s * 4.2) * 8;
  const writeWrist = Math.cos(s * 4.2) * 9;
  const lanternLift = Math.sin(s * 1.8) * 5.5;
  const centerLook = Math.sin(s * 1.1) * 0.55;
  const bookNod = Math.sin(s * 2.4 + 1.0) * 3.5;
  const doorPulse = Math.sin(s * 2.2);
  const fgShift = (540 - camP[0]) * 0.48;

  return (
    <AbsoluteFill style={{ backgroundColor: "#eadec6", overflow: "hidden" }}>
      <PerspStage tiltXDeg={1.6} tiltYDeg={Math.sin(f * 0.025) * 0.9} scaleBoost={1.04}>
        <svg viewBox="0 0 1080 1920" width="1080" height="1920">
          <Cam2D
            cx={camP[0] + thudGpk * 1.0}
            cy={camP[1] + Math.abs(thudGpk) * 1.2}
            zoom={camP[2] + s4Entry * 0.032 + s4Exit * 0.04 + Math.abs(thudGpk) * 0.002}
          >
            {/* Clean 2.5D hand-painted Bantul pendopo master plate (sky, trees, Joglo, stone courtyard) */}
            <image
              href={staticFile("art/ep02/s4_bantul_pendopo_bg.jpg")}
              x={-72}
              y={-128}
              width={1224}
              height={2176}
              preserveAspectRatio="xMidYMid slice"
            />

            {/* Living warm doorway hearth breath anchored directly inside painted open pendopo doors */}
            <g style={{ mixBlendMode: "screen" }}>
              <SunAura
                id="s4_door_glow"
                x={540}
                y={945}
                r={215 + doorPulse * 14}
                color="#ffbe55"
                op={0.30 + doorPulse * 0.05}
              />
            </g>

            {/* Sunlight shaft behind logo/cards so sky glows without hazing foreground UI graphics */}
            <VolumetricShafts id="s4_beams" f={f} color="#ffe7a6" intensity={0.14} angleDeg={-28} sourceX={930} />

            {/* Crown IPM Emblem pinned into upper plaster zone */}
            <IpmEmblem25D
              x={540}
              y={248}
              scale={0.49 * clamp(emblemScale, 0.05, 1.05)}
              sunSpin={f * 0.28}
              shineSweep={interpolate(f, [tRumah - 10, tRumah + 28], [-0.2, 1.2], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })}
              glow={0.38}
              uid="s4_house"
              tactile
            />

            {/* Lineage cards: GKT -> GPK 2010 */}
            {f >= tMkt17 - 10 && (
              <g>
                <CharterStampCard
                  x={284}
                  y={454}
                  w={348}
                  h={152}
                  year="GKT"
                  title="Gerakan Kritis Transformatif"
                  stakeholder="PARADIGMA AWAL"
                  enter={gktEnter}
                  stampProg={0}
                  accent="#5c4732"
                  rotateDeg={-1.8}
                  tactile
                  stampText="IPM"
                />
                <CharterStampCard
                  x={798}
                  y={454}
                  w={366}
                  h={166}
                  year="2010"
                  title="Gerakan Pelajar Kreatif"
                  stakeholder="MUKTAMAR XVII · BANTUL · 3–8 JULI"
                  enter={gpkEnter}
                  stampProg={gpkStamp}
                  accent="#0b7b3e"
                  rotateDeg={1.4}
                  tactile
                  stampText="IPM"
                />
              </g>
            )}

            {/* Active Collaborating Trio with 2.5D Volumetric Lighting, Rim Highlight & Cast Shadows */}
            <HeritageKid
              look={Y_CREATIVE_LOOKS[0]}
              f={f}
              x={268}
              y={1452}
              scale={0.79}
              head={4 + Math.sin(s * 2.1) * 2.4}
              lean={3}
              armR={[-48 + writeSwing, -58 + writeWrist]}
              armL={[7, 11]}
              look2={[0.35, 0.22]}
              smile={0.62}
              held="quill"
              heldHand="R"
              headLag={1}
              useV2Blink
              seed={61}
              tactile
              castShadow
              rimSide="R"
              rimColor="#ffe29c"
              rimStrength={0.44}
              clothSway={2.8}
              lanternBounce={0.14}
            />
            <HeritageKid
              look={Y_CREATIVE_LOOKS[1]}
              f={f}
              x={540}
              y={1456}
              scale={0.8}
              head={centerLook * 6}
              armL={[6, 10]}
              armR={[-46 + lanternLift * 0.65, -44 - lanternLift * 0.35]}
              look2={[centerLook, -0.08]}
              smile={0.76}
              held="lamp"
              heldHand="R"
              headLag={1}
              useV2Blink
              seed={64}
              tactile
              castShadow
              rimSide="R"
              rimColor="#ffe29c"
              rimStrength={0.44}
              clothSway={3.0}
              lanternBounce={0.76}
            />
            <HeritageKid
              look={Y_CREATIVE_LOOKS[2]}
              f={f}
              x={812}
              y={1452}
              scale={0.79}
              flip
              head={-4 + bookNod}
              lean={2}
              armR={[-36 + Math.sin(s * 2.0) * 5, -48]}
              armL={[8, 12]}
              look2={[-0.4, -0.05]}
              smile={0.6}
              held="book"
              heldHand="R"
              headLag={1}
              useV2Blink
              seed={67}
              tactile
              castShadow
              rimSide="R"
              rimColor="#ffe29c"
              rimStrength={0.44}
              clothSway={2.8}
              lanternBounce={0.14}
            />

            {f >= tRumah - 4 && (
              <EditorialCallout
                x={540}
                y={1044}
                sub="IKRAR BANTUL 2010"
                text="Rumah Kreatif Pelajar Indonesia"
                t={f - (tRumah - 4)}
                size={31}
                color="#26180d"
                ribbon
              />
            )}
          </Cam2D>

          {/* Subtle floating sunlight dust particles across courtyard */}
          <DualDepthDust color="#fff1be" count={24} opacity={0.42} windX={14} seed="s4-dust" />
        </svg>
      </PerspStage>

      {/* Out-of-focus foreground corner foliage bokeh with 1.4x camera parallax & gentle breeze */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          filter: "blur(7.5px) brightness(0.91)",
        }}
      >
        <img
          src={staticFile("art/ep02/s4_fg_tl.png")}
          alt=""
          style={{
            position: "absolute",
            top: -22,
            left: -26,
            width: 255,
            height: "auto",
            opacity: 0.94,
            transformOrigin: "top left",
            transform: `translate3d(${fgShift.toFixed(1)}px, 0, 0) rotate(${(Math.sin(s * 1.1) * 1.6).toFixed(2)}deg)`,
          }}
        />
        <img
          src={staticFile("art/ep02/s4_fg_tr.png")}
          alt=""
          style={{
            position: "absolute",
            top: -18,
            right: -26,
            width: 255,
            height: "auto",
            opacity: 0.94,
            transformOrigin: "top right",
            transform: `translate3d(${fgShift.toFixed(1)}px, 0, 0) rotate(${(Math.cos(s * 1.0) * 1.6).toFixed(2)}deg)`,
          }}
        />
        <img
          src={staticFile("art/ep02/s4_fg_bl.png")}
          alt=""
          style={{
            position: "absolute",
            bottom: -22,
            left: -28,
            width: 372,
            height: "auto",
            opacity: 0.96,
            transformOrigin: "bottom left",
            transform: `translate3d(${(fgShift * 1.15).toFixed(1)}px, 0, 0) rotate(${(Math.sin(s * 0.9 + 1.2) * 1.8).toFixed(2)}deg)`,
          }}
        />
        <img
          src={staticFile("art/ep02/s4_fg_br.png")}
          alt=""
          style={{
            position: "absolute",
            bottom: -20,
            right: -28,
            width: 392,
            height: "auto",
            opacity: 0.96,
            transformOrigin: "bottom right",
            transform: `translate3d(${(fgShift * 1.15).toFixed(1)}px, 0, 0) rotate(${(Math.cos(s * 0.85 + 0.6) * 1.8).toFixed(2)}deg)`,
          }}
        />
      </div>

      {/* Golden dawn entry match from Solo 2008 & obsidian twilight dim into Scene 5 spotlight */}
      {s4Entry > 0.01 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "#eadec6",
            opacity: s4Entry * 0.90,
            pointerEvents: "none",
          }}
        />
      )}
      {s4Exit > 0.01 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "#0e0a07",
            opacity: s4Exit * 0.94,
            pointerEvents: "none",
          }}
        />
      )}
    </AbsoluteFill>
  );
};

/**
 * SCENE 06 (S5) — CLIFFHANGER · ENAM BELAS TAHUN PERGI LALU PULANG
 * Slow dolly push-in under a single warm overhead spotlight toward one contemplative pelajar
 * at the muktamar desk before a solemn fade into "SEJARAH BELUM SELESAI."
 */
export const Scene5Cliffhanger: React.FC = () => {
  const f = useCurrentFrame();
  const dur = SCENES[5].dur;

  const tMontage = cue(5, "s5_montage", 6);
  const tSlow = cue(5, "s5_slow", 152);
  const tEndCard = cue(5, "s5_endcard", 315);

  const s5Entry = 1 - tweenE(f, 0, 12, EASE_OUT);
  // 3-beat blocking: active quill writing -> sudden stillness pause -> slow haunting gaze raise
  const writeActive = 1 - tweenE(f, tSlow - 8, tSlow + 4, EASE_OUT);
  const quillArm = Math.sin(f * 0.34) * 7.5 * writeActive;
  const quillWrist = Math.cos(f * 0.68) * 9.5 * writeActive;
  const writeHead = Math.sin(f * 0.17) * 1.8 * writeActive;
  const manuscriptInk = tweenE(f, tMontage, tSlow, EASE_OUT);
  const gazeRaise = tweenE(f, tSlow + 22, tEndCard + 18, EASE_OUT);
  const blackCurtain = tweenE(f, tEndCard + 28, Math.min(dur - 36, tEndCard + 62), EASE_OUT);
  const titleRise = tweenE(f, tEndCard + 54, Math.min(dur - 8, tEndCard + 86), EASE_OUT);

  // Motivated slow dolly push-in centered tightly on the single pelajar & manuscript
  const pushProg = tweenE(f, tMontage, tEndCard + 26, EASE_CAM);
  const camCx = lerp(540, 488, pushProg);
  const camCy = lerp(950, 1020, pushProg);
  const camZoom = lerp(1.0, 1.32, pushProg);

  const echoShift = (540 - camCx) * 0.25;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0e0a07" }}>
      <PerspStage tiltXDeg={1.8} tiltYDeg={Math.sin(f * 0.018) * 0.8 * (1 - blackCurtain)}>
        <svg viewBox="0 0 1080 1920" width="1080" height="1920">
          <DioramaShadowDefs />
          <defs>
            <clipPath id="s5DeskClip">
              {/* Desk back seam at y=1294 (transformed s5_study_desk_bg.jpg y=-48 scale 1.05) */}
              <rect x={-160} y={-160} width={1400} height={1458} />
            </clipPath>
            <radialGradient id="s5LampPool" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffd77d" stopOpacity="0.46" />
              <stop offset="60%" stopColor="#e89a2c" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#693b0a" stopOpacity="0" />
            </radialGradient>
          </defs>

          <g opacity={1 - blackCurtain}>
            <Cam2D cx={camCx} cy={camCy} zoom={camZoom}>
              {/* Moody dark sepia archival collage wall, embossed years & carved walnut study desk */}
              <image
                href={staticFile("art/ep02/s5_study_desk_bg.jpg")}
                x={-27}
                y={-48}
                width={1134}
                height={2016}
                preserveAspectRatio="xMidYMid slice"
              />
              {/* Subtle breathing warm dust glow inside painted conical spotlight */}
              <SunAura id="s5_spot" x={515} y={890} r={420} color="#ffd885" op={0.26 * (1 - blackCurtain) * (1 - s5Entry * 0.6)} />
              <VolumetricShafts id="s5_beam" f={f} color="#ffd98a" intensity={0.14 * (1 - blackCurtain) * (1 - s5Entry * 0.6)} angleDeg={2} sourceX={525} />

              {/* Single Contemplative Student seated naturally behind the carved walnut desk (seam at y=1294) */}
              <g clipPath="url(#s5DeskClip)">
                <HeritageKid
                  look={Y_CREATIVE_LOOKS[0]}
                  f={f}
                  x={502}
                  y={1444}
                  scale={1.08}
                  head={lerp(4, -1, gazeRaise) + writeHead}
                  lean={lerp(0, 3.6, writeActive) * (1 - gazeRaise)}
                  brow={lerp(-0.1, -0.24, gazeRaise)}
                  smile={lerp(0.12, 0.04, gazeRaise)}
                  look2={[lerp(0.24, 0, gazeRaise), lerp(0.32, -0.08, gazeRaise)]}
                  armR={[lerp(-26, -20, gazeRaise) + quillArm, lerp(-34, -26, gazeRaise) + quillWrist]}
                  armL={[-14, -20]}
                  held="quill"
                  heldHand="R"
                  headLag={1}
                  useV2Blink
                  tactile
                  castShadow
                  rimSide="R"
                  rimColor="#ffd682"
                  rimStrength={0.44}
                  seed={77}
                />
              </g>

              {/* Perspective archival manuscript folio & soft cuff shadows lying ON wood desktop (y=1296..1332) */}
              <g>
                <polygon
                  points="414,1298 588,1298 606,1334 396,1334"
                  fill="#0b0603"
                  opacity={0.34}
                  transform="translate(2, 3)"
                />
                <polygon
                  points="414,1298 588,1298 606,1334 396,1334"
                  fill="#efe2c4"
                  stroke="#5b3f24"
                  strokeWidth={1.8}
                />
                <line x1={426} y1={1308} x2={576} y2={1308} stroke="#8f7352" strokeWidth={2.2} opacity={0.78} />
                <line x1={421} y1={1317} x2={582} y2={1317} stroke="#8f7352" strokeWidth={2} opacity={0.68} />
                <line x1={415} y1={1325} x2={lerp(424, 536, manuscriptInk)} y2={1325} stroke="#9e805e" strokeWidth={1.8} opacity={0.56} />
                {/* Soft feathered forearm contact shadow right across desk surface */}
                <g style={{ filter: "blur(3.5px)" }}>
                  <ellipse cx={502} cy={1299} rx={72} ry={6.5} fill="#140903" opacity={0.34} />
                </g>
              </g>

              {/* Sleek engraved brass ledger plate mounted cleanly on carved walnut apron (above caption safe zone) */}
              <g filter="url(#dioramaCardShadow)">
                <rect x={426} y={1360} width={168} height={32} rx={3} fill="#2e1c0e" stroke="#9d7434" strokeWidth={1.8} />
                <line x1={444} y1={1372} x2={576} y2={1372} stroke="#c89b4b" strokeWidth={2.2} opacity={0.78} />
                <line x1={460} y1={1382} x2={560} y2={1382} stroke="#9d7434" strokeWidth={1.8} opacity={0.65} />
              </g>

              {/* Warm brass oil lamp planted firmly on wood desktop center (y=1332) with warm amber wood spill */}
              <ellipse cx={204} cy={1334} rx={118} ry={16} fill="url(#s5LampPool)" />
              <ellipse cx={204} cy={1334} rx={36} ry={7} fill="#0c0602" opacity={0.58} />
              <HeritageBrassLamp id="s5_lamp" x={204} y={1332} f={f} s={0.86} power={1.08} />

              {/* Standing hardwood tripod easel with legs planted squarely onto wood desktop (front y=1334, rear y=1304) */}
              <g transform="translate(756, 1152)">
                {/* Tabletop contact shadow anchored cleanly under three tripod feet */}
                <ellipse cx={0} cy={154} rx={14} ry={4} fill="#0d0703" opacity={0.52} />
                <ellipse cx={-44} cy={182} rx={16} ry={5} fill="#0d0703" opacity={0.62} />
                <ellipse cx={44} cy={182} rx={16} ry={5} fill="#0d0703" opacity={0.62} />
                <ellipse cx={0} cy={176} rx={58} ry={10} fill="#120903" opacity={0.28} />
                <g filter="url(#dioramaCardShadow)">
                  {/* Center back tripod strut receding slightly toward rear of tabletop (y=1304) */}
                  <line x1={0} y1={-46} x2={0} y2={154} stroke="#1d1108" strokeWidth={7} strokeLinecap="round" />
                  {/* Left & right forward hardwood legs resting solidly on desktop plane (y=1334) */}
                  <line x1={-44} y1={182} x2={0} y2={-48} stroke="#2f1c0d" strokeWidth={9.5} strokeLinecap="round" />
                  <line x1={44} y1={182} x2={0} y2={-48} stroke="#2f1c0d" strokeWidth={9.5} strokeLinecap="round" />
                  <line x1={-42} y1={181} x2={0} y2={-46} stroke="#5d3b1e" strokeWidth={2.4} strokeLinecap="round" opacity={0.55} />
                  <line x1={42} y1={181} x2={0} y2={-46} stroke="#5d3b1e" strokeWidth={2.4} strokeLinecap="round" opacity={0.55} />
                  {/* Horizontal wooden easel ledge tray cradling IPM shield */}
                  <rect x={-52} y={84} width={104} height={10} rx={3} fill="#3d2412" stroke="#160c05" strokeWidth={2} />
                  <IpmEmblem25D x={0} y={-8} scale={0.44} sunSpin={f * 0.2} glow={0.78} tactile uid="s5_easel" />
                </g>
              </g>
            </Cam2D>

            {/* Foreground Out-of-Focus Antique Book Stacks parting outward during dolly push-in */}
            <g style={{ filter: "blur(3.6px)" }} opacity={0.96}>
              <image
                href={staticFile("art/ep02/s5_fg_books_l.png")}
                x={-48 - pushProg * 95}
                y={1686 + pushProg * 52}
                width={395}
                height={320}
              />
              <image
                href={staticFile("art/ep02/s5_fg_books_r.png")}
                x={728 + pushProg * 95}
                y={1670 + pushProg * 52}
                width={395}
                height={330}
              />
            </g>
          </g>

          <DualDepthDust color="#ffdfa3" count={22} opacity={0.44 * (1 - blackCurtain)} seed="s5-dust" />

          {/* Obsidian spotlight arrival veil matching Scene 4 twilight curtain */}
          {s5Entry > 0.01 && (
            <rect x={-40} y={-40} width={1160} height={2000} fill="#0e0a07" opacity={s5Entry * 0.94} />
          )}

          {/* Closing Title Card: SEJARAH BELUM SELESAI. (no pure #000/#fff) */}
          {blackCurtain > 0.01 && (
            <g>
              <rect x={0} y={0} width={1080} height={1920} fill="#0c0907" opacity={blackCurtain} />
              <g opacity={titleRise} transform={`translate(540, ${920 + (1 - titleRise) * 20})`}>
                <line x1={-160} y1={-95} x2={160} y2={-95} stroke="#cfa043" strokeWidth={2.5} opacity={0.75} />
                <text
                  x={0}
                  y={-18}
                  textAnchor="middle"
                  fontFamily={FONT_SERIF}
                  fontWeight={900}
                  fontSize={52}
                  letterSpacing={2.5}
                  fill="#f5ebd5"
                >
                  SEJARAH BELUM
                </text>
                <text
                  x={0}
                  y={48}
                  textAnchor="middle"
                  fontFamily={FONT_SERIF}
                  fontWeight={900}
                  fontSize={52}
                  letterSpacing={2.5}
                  fill="#e4b756"
                >
                  SELESAI.
                </text>
                <text
                  x={0}
                  y={104}
                  textAnchor="middle"
                  fontFamily={FONT_SANS}
                  fontWeight={700}
                  fontSize={16}
                  letterSpacing={3.5}
                  fill="#a6906d"
                >
                  EPISODE 02 · NAMA YANG PERNAH HILANG
                </text>
              </g>
            </g>
          )}
        </svg>
      </PerspStage>
    </AbsoluteFill>
  );
};
