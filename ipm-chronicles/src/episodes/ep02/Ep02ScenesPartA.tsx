import React from "react";
import { AbsoluteFill, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { AtlasMap2D, GEO, type MapPinSpec, type MapRouteSpec } from "../../shared/AtlasMap2D";
import {
  CharterStampCard,
  DioramaShadowDefs,
  ForegroundBlurEdge,
  ForegroundDoorReveal,
  ForegroundRail,
  NomenclatureMorphBanner,
  OsisSchoolPlaque,
  TactileClassroomGate,
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
  handheld,
  lerp,
  pe,
  shake,
  springObj,
  tweenE,
} from "../../shared/Flat3DCamera";
import { HeritageKid, type KidLook } from "../../shared/HeritageKid";
import { HeritageBrassLamp, SunAura } from "../../shared/HeritageProps25D";
import { IpmEmblem25D } from "../../shared/IpmEmblem25D";
import { DualDepthDust, FONT_SANS, FONT_SERIF } from "../../shared/PaperTextures";
import { SCENES, cue } from "./script";

const DELEGATE_LOOKS: KidLook[] = [
  { skin: "#d6a47a", skinShade: "#ba855d", shirt: "#f4ebd7", shirtShade: "#dbd0b6", pants: "#262320", hat: "peci", hatColor: "#181512" },
  { skin: "#c8926a", skinShade: "#ab734c", shirt: "#e6eee0", shirtShade: "#c8d5bf", pants: "#1f2a24", hat: "hijab", hatColor: "#efe7d4" },
  { skin: "#dba87e", skinShade: "#bf885f", shirt: "#225a3c", shirtShade: "#163e28", pants: "#24211e", hat: "peci", hatColor: "#14110f" },
  { skin: "#c48b63", skinShade: "#a56d47", shirt: "#ece0c4", shirtShade: "#d0bf9a", pants: "#1c2430", hat: "hijab", hatColor: "#1b5e3b" },
];

/**
 * SCENE 01 (S0) — YOGYAKARTA 1960 -> DEKLARASI SURAKARTA 18 JULI 1961 -> TWIST
 * Opens through wooden hall doors into Yogyakarta 1960 meeting corridor, transitions seamlessly
 * into the warm golden Surakarta assembly hall, then cools abruptly as the letter 'P' flickers & fractures.
 */
export const Scene0Surakarta1961: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = SCENES[0].dur;

  const t1960 = cue(0, "s0_1960", 11);
  const t1961 = cue(0, "s0_1961", 129);
  const tIpm = cue(0, "s0_ipm", 219);
  const t42y = cue(0, "s0_42y", 304);
  const tTwist = cue(0, "s0_twist", 404);

  const doorOpen = tweenE(f, 2, 48, EASE_OUT);
  const hallBlend = tweenE(f, t1961 - 24, t1961 + 8, EASE_IN_OUT);
  const coldShift = tweenE(f, tTwist - 4, tTwist + 18, EASE_OUT);
  const twistPunch = tweenE(f, tTwist - 4, tTwist + 16, EASE_OUT);
  const s0Exit = tweenE(f, dur - 12, dur, EASE_IN_OUT);
  const impactShake = shake(f - (tTwist - 2), 7);

  // Subtle flicker burst on letter 'P' right as the twist hits, settling into cold fracture
  const flickerWave =
    f >= tTwist - 4 && f < tTwist + 16
      ? 0.45 + 0.55 * Math.abs(Math.sin((f - tTwist) * 1.35))
      : 0.92;
  const pFlicker = coldShift * flickerWave;

  // Stage A camera: gentle forward push -> accelerated match-zoom through carved Yogyakarta archway
  const jogjaPush = tweenE(f, 2, t1961 - 22, EASE_CAM);
  const jogjaPortal = tweenE(f, t1961 - 24, t1961 + 8, EASE_IN_OUT);
  const jogjaScale = lerp(1.0, 1.075, jogjaPush) + jogjaPortal * jogjaPortal * 0.19;
  const jogjaDriftX = handheld(f, 1.4)[0] * 1.4;
  const jogjaDriftY = handheld(f, 1.4)[1] * 1.0;

  // Stage B camera: Surakarta 1961 assembly push-in -> twist punch -> exit settle into Scene 1
  const camSoloPush = tweenE(f, t1961 - 16, t42y + 38, EASE_CAM);
  const stageScale = lerp(1.02, 1.105, camSoloPush) + twistPunch * 0.038 + s0Exit * 0.032;
  const stageShakeX = handheld(f, 1.4)[0] * 1.8 * (1 - coldShift * 0.7) + impactShake * 5.2;
  const stageShakeY = handheld(f, 1.4)[1] * 1.4 * (1 - coldShift * 0.7);
  const crowdSlots = [
    // Back row seated solidly on upper raised dais wood platform (y=1205..1208), flanking lectern
    { x: 286, y: 1208, sc: 0.63, li: 3, wx: -2.8 },
    { x: 414, y: 1205, sc: 0.64, li: 1, wx: -1.4 },
    { x: 666, y: 1205, sc: 0.64, li: 2, wx: 1.4 },
    { x: 794, y: 1208, sc: 0.63, li: 1, wx: 2.8 },
    // Front row seated squarely on lower wide step tread (y=1296), clear of dais corners & fg foliage
    { x: 204, y: 1296, sc: 0.78, li: 2, wx: -3.2 },
    { x: 876, y: 1296, sc: 0.78, li: 0, wx: 3.2 },
  ];

  const emblemSpring = springObj(f, t1961 - 4, fps, "object");
  const shine = interpolate(f, [tIpm - 6, tIpm + 28], [-0.2, 1.2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const warmPower = Math.max(0.16, 1 - coldShift * 0.82);

  return (
    <AbsoluteFill style={{ backgroundColor: "#110b07" }}>
      <PerspStage
        tiltXDeg={lerp(2.2, -0.8, camSoloPush) * (1 - coldShift * 0.5)}
        tiltYDeg={Math.sin(f * 0.025) * 1.1 * (1 - coldShift * 0.6)}
      >
        <svg viewBox="0 0 1080 1920" width="1080" height="1920">
          <DioramaShadowDefs />
          <defs>
            <pattern id="s0PaperGrain" width="256" height="256" patternUnits="userSpaceOnUse">
              <image href={staticFile("art/textures/parchment_grain_alpha.png")} width="256" height="256" />
            </pattern>
            <pattern id="s0FabricGrain" width="96" height="96" patternUnits="userSpaceOnUse">
              <image href={staticFile("art/textures/fabric_grain_alpha.png")} width="96" height="96" />
            </pattern>
          </defs>
          {/* STAGE A: YOGYAKARTA 1960 CARVED TEAK ARCHWAY CORRIDOR (1:1 Painted 2.5D Architecture) */}
          {hallBlend < 0.99 && (
            <g opacity={1 - hallBlend}>
              <g
                transform={`translate(${(540 + jogjaDriftX).toFixed(1)}, ${(1020 + jogjaDriftY).toFixed(1)}) scale(${jogjaScale.toFixed(4)}) translate(-540, -1020)`}
              >
                <image
                  href={staticFile("art/ep02/s0_jogja_arch_bg.jpg")}
                  x={0}
                  y={0}
                  width={1080}
                  height={1920}
                  preserveAspectRatio="xMidYMid slice"
                />

                {/* Subtle living shimmer atop diagonal golden sunbeam shafts */}
                <VolumetricShafts id="s0_jogja_rays" f={f} color="#ffe4a1" intensity={0.18} angleDeg={-12} sourceX={625} />

                {/* Dynamic flickering warm aura anchored directly inside the two hanging hurricane lanterns */}
                {[
                  { x: 153, y: 956 },
                  { x: 929, y: 955 },
                ].map((lmp, li) => {
                  const fl = 1 + Math.sin(f * 0.34 + li * 1.6) * 0.08 + Math.cos(f * 0.78 + li) * 0.04;
                  return (
                    <g key={`jlmp_${li}`} style={{ mixBlendMode: "screen" }}>
                      <SunAura id={`s0_jlmp_${li}`} x={lmp.x} y={lmp.y} r={108 * fl} color="#ffd56b" op={0.34} />
                      <circle cx={lmp.x} cy={lmp.y} r={10 * fl} fill="#fff3c4" opacity={0.42} />
                    </g>
                  );
                })}

                {/* Center-back & front flanking pioneer delegates walk forward into archway threshold & settle */}
                {[
                  { x: 540, y: 1250, sc: 0.68, li: 1, held: undefined, lx: 0, rim: "R" as const, seed: 101 },
                  { x: 382, y: 1288, sc: 0.72, li: 0, held: "book" as const, lx: 0.24, rim: "R" as const, seed: 100 },
                  { x: 698, y: 1288, sc: 0.72, li: 2, held: "lamp" as const, lx: -0.24, rim: "L" as const, seed: 102 },
                ].map((d, idx) => {
                  const walkIn = tweenE(f, 6 + idx * 3, 42 + idx * 3, EASE_OUT);
                  const px = lerp(d.x + (540 - d.x) * 0.06, d.x, walkIn);
                  const py = lerp(d.y - 14, d.y, walkIn);
                  const pSc = lerp(d.sc * 0.94, d.sc, walkIn);
                  return (
                    <g key={idx}>
                      <g style={{ filter: "blur(5.5px)" }}>
                        <ellipse cx={px - 10} cy={py + 4} rx={pSc * 74} ry={pSc * 15} fill="#180c04" opacity={0.42} />
                        <ellipse cx={px} cy={py + 8} rx={pSc * 96} ry={pSc * 18} fill="#ffcf72" opacity={0.14} />
                      </g>
                      <HeritageKid
                        look={DELEGATE_LOOKS[d.li]}
                        f={f}
                        x={px}
                        y={py}
                        scale={pSc}
                        walk={f * (walkIn < 0.99 ? 0.28 : 0.12) + idx * 1.8}
                        walkAmp={lerp(0.86, 0.22, walkIn)}
                        head={Math.sin(f * 0.09 + idx * 1.4) * 1.4}
                        smile={0.58}
                        brow={0.14}
                        look2={[d.lx, -0.05]}
                        armR={d.held ? [-28, -36] : [6, 10]}
                        armL={[6, 10]}
                        held={d.held}
                        heldHand={d.held ? "R" : undefined}
                        lanternBounce={d.held === "lamp" ? 0.62 : 0}
                        headLag={1}
                        useV2Blink
                        tactile
                        castShadow
                        rimSide={d.rim}
                        rimColor="#ffd882"
                        rimStrength={0.42}
                        seed={d.seed}
                      />
                    </g>
                  );
                })}
              </g>

              {f >= t1960 - 3 && (
                <EditorialCallout
                  x={540}
                  y={305}
                  sub="PERTEMUAN PERINTIS"
                  text="YOGYAKARTA · 1960"
                  t={f - (t1960 - 3)}
                  size={48}
                  color="#ffe7aa"
                  halo="rgba(18,12,7,0.9)"
                />
              )}
            </g>
          )}

          {/* STAGE B: SURAKARTA 18 JULI 1961 GOLDEN ASSEMBLY HALL -> COLD TWIST */}
          {hallBlend > 0.01 && (
            <g opacity={hallBlend}>
              {/* Layer 1..3 unified inside painted architectural hall zoom/shake transform */}
              <g
                transform={`translate(${(540 + stageShakeX).toFixed(1)}, ${(960 + stageShakeY).toFixed(1)}) scale(${stageScale.toFixed(4)}) translate(-540, -960)`}
              >
                <image
                  href={staticFile("art/ep02/s0_solo_hall_bg.jpg")}
                  x={0}
                  y={0}
                  width={1080}
                  height={1920}
                  preserveAspectRatio="xMidYMid slice"
                />
                {/* Dynamic atmospheric cooling shift on twist */}
                {coldShift > 0.01 && (
                  <rect
                    x={-120}
                    y={-120}
                    width={1320}
                    height={2160}
                    fill="#0e1e30"
                    opacity={coldShift * 0.56}
                  />
                )}

                <SunAura
                  id="s0_stage_glow"
                  x={540}
                  y={485}
                  r={580}
                  color={coldShift > 0.35 ? "#6d8fb5" : "#ffd77d"}
                  op={lerp(0.32, 0.14, coldShift)}
                />
                <VolumetricShafts
                  id="s0_beams"
                  f={f}
                  color={coldShift > 0.35 ? "#8fb3d9" : "#ffe296"}
                  intensity={lerp(0.18, 0.08, coldShift)}
                  angleDeg={8}
                  sourceX={540}
                />

                {/* Hanging emerald velvet tapestry & brass curtain rod anchored cleanly on rear wall */}
                <g transform="translate(540, 680)">
                  <g filter="url(#dioramaCardShadow)">
                    <rect x={-356} y={-236} width={712} height={14} rx={7} fill="#3d2410" stroke="#180d04" strokeWidth={2.5} />
                    <line x1={-348} y1={-232} x2={348} y2={-232} stroke="#cda04b" strokeWidth={2} opacity={0.75} />
                    {[-362, 362].map((fx, fi) => (
                      <g key={fi} transform={`translate(${fx}, -229)`}>
                        <circle r={12} fill="#cfa043" stroke="#2c1a08" strokeWidth={2.5} />
                        <rect x={-7} y={14} width={14} height={92} rx={5} fill="#c49539" stroke="#321f09" strokeWidth={2} />
                        <polygon points="-13,106 13,106 17,142 -17,142" fill="#d7ac4d" stroke="#321f09" strokeWidth={2} />
                      </g>
                    ))}
                    <rect
                      x={-330}
                      y={-224}
                      width={660}
                      height={352}
                      rx={8}
                      fill={coldShift > 0.4 ? "#15212b" : "#123421"}
                      stroke={coldShift > 0.4 ? "#687b8f" : "#d3a447"}
                      strokeWidth={4}
                    />
                    <rect
                      x={-330}
                      y={-224}
                      width={660}
                      height={352}
                      rx={8}
                      fill="url(#s0FabricGrain)"
                      opacity={0.44}
                    />
                    <rect
                      x={-318}
                      y={-212}
                      width={636}
                      height={328}
                      rx={5}
                      fill="none"
                      stroke={coldShift > 0.4 ? "#7b90a6" : "#e2bd69"}
                      strokeWidth={1.6}
                      opacity={0.7}
                    />
                  </g>
                  <text
                    x={0}
                    y={-176}
                    textAnchor="middle"
                    fontFamily={FONT_SERIF}
                    fontWeight={800}
                    fontSize={22}
                    letterSpacing={3.2}
                    fill={coldShift > 0.4 ? "#b4c6d8" : "#efd083"}
                  >
                    18 JULI 1961 · SURAKARTA
                  </text>
                  <IpmEmblem25D
                    x={0}
                    y={-8}
                    scale={0.62 * clamp(emblemSpring, 0.1, 1.08)}
                    sunSpin={f * (0.25 * (1 - coldShift * 0.75))}
                    glow={0.92 * warmPower}
                    shineSweep={shine}
                    fracture={coldShift * 0.65}
                    pFlicker={pFlicker}
                    tactile
                    uid="s0_main"
                  />
                </g>

                {/* Carved walnut podium lectern planted solidly ON upper wood platform (y=1205) */}
                <g transform="translate(540, 1205)">
                  <ellipse cx={0} cy={4} rx={72} ry={11} fill="#140903" opacity={0.58} />
                  <g filter="url(#dioramaCardShadow)">
                    <rect x={-58} y={-14} width={116} height={14} rx={3} fill="#26150a" stroke="#110903" strokeWidth={2.2} />
                    <rect x={-46} y={-122} width={92} height={108} rx={4} fill="#361f0f" stroke="#140b04" strokeWidth={2.4} />
                    <rect x={-35} y={-108} width={70} height={80} rx={3} fill="#28160a" stroke="#623d21" strokeWidth={1.6} />
                    <rect x={-58} y={-138} width={116} height={18} rx={4} fill="#4b2d17" stroke="#160c05" strokeWidth={2.4} />
                  </g>
                </g>

                {/* Brass stage lanterns on carved sconce arms mounted to left/right pilasters (never clipped at 1.11x) */}
                {[
                  { wallX: 68, armX: 96, dir: 1 },
                  { wallX: 1012, armX: 984, dir: -1 },
                ].map((sc, si) => (
                  <g key={`pil_${si}`} transform={`translate(0, 956)`}>
                    <rect x={sc.wallX - 18} y={6} width={36} height={10} rx={3} fill="#3d2410" stroke="#160c05" strokeWidth={2} />
                    <path
                      d={`M${sc.wallX},12 Q${(sc.wallX + sc.armX) / 2},22 ${sc.armX},4`}
                      fill="none"
                      stroke="#8b6220"
                      strokeWidth={6}
                      strokeLinecap="round"
                    />
                    <rect x={sc.armX - 24} y={-2} width={48} height={8} rx={3} fill="#4b2d17" stroke="#160c05" strokeWidth={1.8} />
                    <ellipse cx={sc.armX} cy={14} rx={34} ry={14} fill="#ffc254" opacity={0.18 * warmPower} />
                  </g>
                ))}
                <HeritageBrassLamp id="s0_s_l" x={96} y={954} f={f} s={0.72} power={warmPower} />
                <HeritageBrassLamp id="s0_s_r" x={984} y={954} f={f} s={0.72} power={warmPower} />

                {/* Audience Delegates anchored squarely onto upper dais (y=1205) & lower step tread (y=1296) */}
                {crowdSlots.map((slot, idx) => {
                  const clapPulse = f >= tIpm && f < tTwist - 4 ? Math.abs(Math.sin(f * 0.36 + idx * 1.2)) * 22 : 0;
                  const cheerUp = f >= tIpm && f < tTwist - 4 ? 1 - coldShift : 0;
                  const holdChest = coldShift;
                  const gazeX = slot.wx < 0 ? 0.32 : -0.32;
                  const shW = slot.sc * 78;
                  return (
                    <g key={idx}>
                      {/* Soft blurred ambient floor contact & warm spill anchoring shoes without hard concentric rings */}
                      <g style={{ filter: "blur(5.5px)" }}>
                        <ellipse
                          cx={slot.x}
                          cy={slot.y + 4}
                          rx={shW * 1.02}
                          ry={slot.sc * 13}
                          fill="#120702"
                          opacity={0.44}
                        />
                        <ellipse
                          cx={slot.x}
                          cy={slot.y + 8}
                          rx={shW * 1.38}
                          ry={slot.sc * 17}
                          fill="#ffc96e"
                          opacity={0.14 * warmPower}
                        />
                      </g>
                      <HeritageKid
                        look={DELEGATE_LOOKS[slot.li]}
                        f={f}
                        x={slot.x}
                        y={slot.y}
                        scale={slot.sc}
                        flip={slot.wx > 0}
                        head={lerp(slot.wx < 0 ? 3 : -3, -2, coldShift) + Math.sin(f * 0.09 + idx * 1.1) * 1.4 * (1 - coldShift * 0.4)}
                        lean={lerp(slot.wx < 0 ? 1.2 : -1.2, slot.wx < 0 ? 4.2 : -4.2, coldShift)}
                        brow={lerp(0.2, -0.68, coldShift)}
                        smile={lerp(0.65, -0.4, coldShift)}
                        look2={[gazeX, lerp(-0.18, -0.58, coldShift)]}
                        headLag={1}
                        useV2Blink
                        tactile
                        castShadow
                        rimSide={slot.wx < 0 ? "R" : "L"}
                        rimColor={coldShift > 0.35 ? "#95bae0" : "#ffd67c"}
                        rimStrength={0.44}
                        armL={[lerp(14 + clapPulse * cheerUp, -14, holdChest), lerp(20 + clapPulse * 0.6, -28, holdChest)]}
                        armR={[lerp(-32, -40, holdChest), lerp(-46, -68, holdChest)]}
                        held={idx % 2 === 0 ? "book" : undefined}
                        heldHand={idx % 2 === 0 ? "R" : undefined}
                        seed={12 + idx * 3}
                      />
                    </g>
                  );
                })}
              </g>

              {/* Foreground DOF Bokeh Potted Plants gently swaying in auditorium breeze */}
              <g style={{ filter: "blur(3px)" }} opacity={lerp(0.96, 0.72, coldShift)}>
                <g transform={`rotate(${(Math.sin(f * 0.065) * 1.6).toFixed(2)} ${(50 - camSoloPush * 26).toFixed(1)} ${(1630 + camSoloPush * 16).toFixed(1)})`}>
                  <image
                    href={staticFile("art/ep02/s0_fg_plant_l.png")}
                    x={-76 - camSoloPush * 26}
                    y={1236 + camSoloPush * 16}
                    width={252}
                    height={405}
                  />
                </g>
                <g transform={`rotate(${(Math.cos(f * 0.058 + 1.0) * 1.5).toFixed(2)} ${(1032 + camSoloPush * 26).toFixed(1)} ${(1615 + camSoloPush * 16).toFixed(1)})`}>
                  <image
                    href={staticFile("art/ep02/s0_fg_plant_r.png")}
                    x={904 + camSoloPush * 26}
                    y={1246 + camSoloPush * 16}
                    width={256}
                    height={375}
                  />
                </g>
              </g>

              {/* 42 Years Callout -> dims cleanly when twist arrives */}
              {f >= t42y - 3 && coldShift < 0.85 && (
                <g opacity={1 - coldShift}>
                  <EditorialCallout
                    x={540}
                    y={315}
                    sub="1919 → 1961"
                    text="42 TAHUN MENANTI"
                    t={f - (t42y - 3)}
                    size={44}
                    color="#ffe5a3"
                    halo="rgba(16,11,7,0.92)"
                  />
                </g>
              )}

              {/* Subtle cold warning callout on twist hold */}
              {f >= tTwist + 2 && (
                <EditorialCallout
                  x={540}
                  y={315}
                  sub="KELAK"
                  text="NAMA ITU DIHAPUS SENDIRI"
                  t={f - (tTwist + 2)}
                  size={36}
                  color="#c7dcf0"
                  halo="rgba(11,17,24,0.92)"
                />
              )}
            </g>
          )}

          {/* Soft foreground wooden pillars + deterministic dual-depth dust */}
          <ForegroundBlurEdge id="s0_fg" camX={540 + (f * 0.18)} color="#140d08" opacity={0.58} />
          <DualDepthDust
            color={coldShift > 0.4 ? "#a3c0de" : "#ffdf8a"}
            count={28}
            opacity={lerp(0.48, 0.28, coldShift)}
            seed="s0-dust"
          />

          {/* Golden archway light bloom as camera pushes through Yogyakarta doorway into Surakarta Hall */}
          {hallBlend > 0.01 && hallBlend < 0.99 && (
            <rect
              x={-40}
              y={-40}
              width={1160}
              height={2000}
              fill="#ffe4a1"
              opacity={Math.sin(hallBlend * Math.PI) * 0.24}
              style={{ mixBlendMode: "screen" }}
            />
          )}

          {/* Opening carved walnut double-doors */}
          <ForegroundDoorReveal openProg={doorOpen} tactile />

          {/* Seamless warm umber dissolve leading into Scene 1 cartographic prologue */}
          {s0Exit > 0.01 && (
            <rect x={-40} y={-40} width={1160} height={2000} fill="#160f09" opacity={s0Exit * 0.92} />
          )}
        </svg>
      </PerspStage>
    </AbsoluteFill>
  );
};

/**
 * SCENE 02 (S1) — 1961–1976 · MASA KONSOLIDASI & PENGKADERAN
 * Smooth camera zoom-in from Nusantara archipelago map onto an oak blueprint drafting desk,
 * followed by progressive IPM emblem vector build + heavy spring bounce on 1969 & 1976 seals.
 */
export const Scene1Pembentukan1961: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = SCENES[1].dur;

  const t1961 = cue(1, "s1_1961", 7);
  const tConflict = cue(1, "s1_conflict", 85);
  const tUnite = cue(1, "s1_unite", 136);
  const t1969 = cue(1, "s1_1969", 286);
  const tKhittah = cue(1, "s1_khittah", 338);
  const t1976 = cue(1, "s1_1976", 444);
  const tSpi = cue(1, "s1_spi", 501);

  // Seamless entry bridge from Scene 0 -> Nusantara zoom-dive -> Blueprint desk + heavy SAH thuds
  const s1EntryFade = 1 - tweenE(f, 0, 12, EASE_OUT);
  const s1EntryScale = lerp(1.1, 1.0, tweenE(f, 0, 14, EASE_OUT));
  const mapZoomOut = tweenE(f, tUnite + 76, t1969 + 8, EASE_IN_OUT);
  const deskBlend = tweenE(f, t1969 - 22, t1969 + 8, EASE_OUT);
  const s1Exit = tweenE(f, dur - 12, dur, EASE_IN_OUT);

  const routes: MapRouteSpec[] = [
    { id: "r_medan", from: GEO.yogyakarta, to: [98.67, 3.59], startFrame: tUnite - 10, endFrame: tUnite + 46, color: "#0b7b3e", traveler: "walker", arcBendDeg: 2.2 },
    { id: "r_makassar", from: GEO.surakarta, to: [119.43, -5.14], startFrame: tUnite - 4, endFrame: tUnite + 52, color: "#9c2216", traveler: "pinisi", arcBendDeg: -2.0 },
    { id: "r_banjar", from: GEO.yogyakarta, to: [114.59, -3.32], startFrame: tUnite + 2, endFrame: tUnite + 56, color: "#b67a0d", traveler: "walker", arcBendDeg: 1.5 },
  ];

  const pins: MapPinSpec[] = [
    { id: "jogja", label: "YOGYA · SOLO", sublabel: "PUSAT 1961", coord: GEO.yogyakarta, triggerFrame: t1961 + 4, color: "#8d2416", size: "lg", labelSide: "bottom" },
    { id: "mdn", label: "SUMATERA", coord: [98.67, 3.59], triggerFrame: tUnite + 26, color: "#0b7b3e", size: "sm", labelSide: "top" },
    { id: "bjm", label: "KALIMANTAN", coord: [114.59, -3.32], triggerFrame: tUnite + 34, color: "#b67a0d", size: "sm", labelSide: "top" },
    { id: "mks", label: "SULAWESI", coord: [119.43, -5.14], triggerFrame: tUnite + 40, color: "#8d2416", size: "sm", labelSide: "right" },
  ];

  // Camera glides across desk and settles into a clean hold on completion
  const camP = camAt(f, [
    K3(t1969 - 20, 540, 920, 1.18),
    K3(tKhittah, 515, 895, 1.02),
    K3(t1976 + 10, 565, 905, 1.03),
    K3(tSpi + 16, 540, 895, 1.06),
    K3(dur, 540, 895, 1.06),
  ]);

  // Progressive construction lines -> shield -> sun -> book -> letters
  const outlineP = tweenE(f, t1969 - 24, t1969 + 14, EASE_OUT);
  const panelP = tweenE(f, t1969 - 4, t1969 + 34, EASE_OUT);
  const sunP = tweenE(f, t1969 + 18, tKhittah + 22, EASE_OUT);
  const bookP = tweenE(f, tKhittah + 6, t1976 - 12, EASE_OUT);
  const letterP = tweenE(f, tKhittah + 28, t1976 + 6, EASE_OUT);

  // Heavy Remotion spring bounces + tabletop impact micro-thud for the 1969 & 1976 ratification stamps
  const stamp69 = springObj(f, tKhittah - 2, fps, "heavy");
  const stamp76 = springObj(f, tSpi - 4, fps, "heavy");
  const thud69 = shake(f - tKhittah, 8);
  const thud76 = shake(f - (tSpi - 2), 8);
  const stampShakeX = (thud69 + thud76) * 1.15;
  const stampShakeY = Math.abs(thud69 + thud76) * 1.55;
  const stampPunchZoom = (Math.abs(thud69) + Math.abs(thud76)) * 0.0025;
  const card69Enter = tweenE(f, t1969 - 6, t1969 + 18, EASE_OUT);
  const card76Enter = tweenE(f, t1976 - 6, t1976 + 18, EASE_OUT);
  const shine = interpolate(f, [tSpi - 4, tSpi + 32], [-0.2, 1.2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Desk zoom-dive scale match from map
  const deskEntryScale = lerp(1.36, 1.0, deskBlend);

  return (
    <AbsoluteFill style={{ backgroundColor: "#e6d8be" }}>
      {/* Layer A: Nusantara Network Cartography -> smooth zoom-in into Java */}
      {deskBlend < 0.99 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 1 - deskBlend,
            transform: `scale(${(lerp(1, 1.48, mapZoomOut) * s1EntryScale).toFixed(4)})`,
            transformOrigin: "50% 48%",
          }}
        >
          <AtlasMap2D
            tactile
            fromCenter={[109.4, -3.5]}
            toCenter={[109.2, -5.2]}
            fromZoom={0.96}
            toZoom={1.88}
            moveStartFrame={tConflict + 28}
            moveEndFrame={t1969 + 4}
            activeIslands={["sumatera", "jawa", "kalimantan", "sulawesi", "nusatenggara"]}
            activeIslandFrame={tUnite}
            routes={routes}
            pins={pins}
            focalYRatio={0.48}
            compassGeo={[116.2, 4.0]}
            tiltDeg={lerp(11, 3, mapZoomOut)}
            idleDrift={0.025}
          />
        </div>
      )}

      {/* Layer B: Walnut Drafting Desk + Blueprint Construction + Spring-Stamped Charters */}
      {deskBlend > 0.01 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: deskBlend,
            transform: `scale(${deskEntryScale.toFixed(4)})`,
            transformOrigin: "50% 46%",
          }}
        >
          <PerspStage tiltXDeg={6.5} tiltYDeg={Math.sin(f * 0.024) * 1.4}>
            <svg viewBox="0 0 1080 1920" width="1080" height="1920">
              <DioramaShadowDefs />
              <defs>
                <linearGradient id="s1ParchmentFill" x1="0%" y1="0%" x2="85%" y2="100%">
                  <stop offset="0%" stopColor="#f5ead4" />
                  <stop offset="65%" stopColor="#ead8b6" />
                  <stop offset="100%" stopColor="#dbc398" />
                </linearGradient>
                <pattern id="s1PaperGrain" width="256" height="256" patternUnits="userSpaceOnUse">
                  <image href={staticFile("art/textures/parchment_grain_alpha.png")} width="256" height="256" />
                </pattern>
                <clipPath id="s1SheetClip">
                  <rect x={80} y={474} width={920} height={1108} rx={10} />
                </clipPath>
              </defs>

              <Cam2D
                cx={camP[0] + stampShakeX}
                cy={camP[1] + stampShakeY}
                zoom={camP[2] + stampPunchZoom + s1Exit * 0.036}
              >
                {/* Top archival sepia crowd/school frieze + stitched espresso leather desk mat */}
                <image
                  href={staticFile("art/ep02/s1_desk_bg.jpg")}
                  x={-27}
                  y={-48}
                  width={1134}
                  height={2016}
                  preserveAspectRatio="xMidYMid slice"
                />

                {/* Textured Deckled Blueprint Parchment Sheet with 2.5D shadow onto leather */}
                <g filter="url(#dioramaCardShadow)">
                  <rect
                    x={80}
                    y={474}
                    width={920}
                    height={1108}
                    rx={10}
                    fill="url(#s1ParchmentFill)"
                    stroke="#614224"
                    strokeWidth={3.5}
                  />
                  <rect
                    x={80}
                    y={474}
                    width={920}
                    height={1108}
                    rx={10}
                    fill="url(#s1PaperGrain)"
                    opacity={0.44}
                  />
                </g>

                {/* Animated architectural blueprint construction lines & compass guide */}
                <g clipPath="url(#s1SheetClip)" stroke="#a38862" strokeWidth={1.4} opacity={0.62}>
                  {[585, 705, 825, 945, 1065, 1185, 1305, 1425].map((gy, idx) => (
                    <line
                      key={gy}
                      x1={108}
                      y1={gy}
                      x2={lerp(108, 972, tweenE(f, t1969 - 22 + idx * 2, t1969 + 8 + idx * 2, EASE_OUT))}
                      y2={gy}
                    />
                  ))}
                  {[215, 345, 475, 605, 735, 865].map((gx, idx) => (
                    <line
                      key={gx}
                      x1={gx}
                      y1={496}
                      x2={gx}
                      y2={lerp(496, 1552, tweenE(f, t1969 - 18 + idx * 2, t1969 + 12 + idx * 2, EASE_OUT))}
                    />
                  ))}
                  <circle
                    cx={540}
                    cy={715}
                    r={255}
                    fill="none"
                    stroke="#8e7149"
                    strokeDasharray="9 8"
                    strokeDashoffset={(-f * 0.65).toFixed(2)}
                    strokeWidth={1.8}
                    opacity={outlineP * 0.78}
                  />
                  <circle
                    cx={540}
                    cy={715}
                    r={284}
                    fill="none"
                    stroke="#a5865a"
                    strokeDasharray="4 14"
                    strokeDashoffset={(f * 0.45).toFixed(2)}
                    strokeWidth={1.2}
                    opacity={outlineP * 0.46}
                  />
                </g>

                {/* Gentle tabletop golden sunlight wash below emblem/cards */}
                <VolumetricShafts id="s1_shafts" f={f} color="#fff1c7" intensity={0.14} angleDeg={-15} sourceX={720} />

                {/* Central Reconstructed IPM Emblem constructing piece by piece */}
                <IpmEmblem25D
                  x={540}
                  y={715}
                  scale={0.86}
                  drawOutline={outlineP}
                  fillPanels={panelP}
                  sunProgress={sunP}
                  sunSpin={f * 0.18}
                  bookProgress={bookP}
                  lettersProgress={letterP}
                  shineSweep={shine}
                  glow={0.56}
                  tactile
                  uid="s1_construct"
                />

                {/* 1969 & 1976 Ratification Charters with heavy spring stamp impact */}
                <CharterStampCard
                  x={315}
                  y={1235}
                  w={395}
                  h={218}
                  year="1969"
                  title="Khittah & Identitas IPM"
                  stakeholder="Muktamar II · Palembang"
                  enter={card69Enter}
                  stampProg={stamp69}
                  accent="#0b7b3e"
                  tactile
                  stampText="SAH"
                  rotateDeg={-2.4}
                />
                <CharterStampCard
                  x={765}
                  y={1235}
                  w={395}
                  h={218}
                  year="1976"
                  title="Sistem Pengkaderan (SPI)"
                  stakeholder="PP IPM · Seminar Tomang"
                  enter={card76Enter}
                  stampProg={stamp76}
                  accent="#8d2416"
                  tactile
                  stampText="SAH"
                  rotateDeg={2.0}
                />
              </Cam2D>

              <ForegroundRail scrollX={camP[0]} />
              <DualDepthDust color="#ffe6aa" count={24} opacity={0.44} seed="s1-dust" />

              {/* Seamless cold slate dissolve leading into Scene 2 Orde Baru corridor */}
              {s1Exit > 0.01 && (
                <rect x={-40} y={-40} width={1160} height={2000} fill="#121b24" opacity={s1Exit * 0.94} />
              )}
            </svg>
          </PerspStage>
        </div>
      )}

      {/* Warm umber entry settle veil matching Scene 0 exit dissolve */}
      {s1EntryFade > 0.01 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "#160f09",
            opacity: s1EntryFade * 0.92,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Opening 1961–1976 Callout + Ideology Tension Ring during archipelago stage */}
      {f >= t1961 - 3 && f < t1969 && (
        <svg viewBox="0 0 1080 1920" width="1080" height="1920" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <g opacity={1 - deskBlend}>
            <EditorialCallout
              x={540}
              y={305}
              sub={f >= tConflict && f < tUnite + 20 ? "ARUS IDEOLOGI 1960-AN · PENYATUAN NUSANTARA" : "KONSOLIDASI & PENGKADERAN"}
              text="1961 – 1976"
              t={f - (t1961 - 3)}
              size={48}
              color="#26180d"
            />
            {f >= tConflict - 4 && f < tUnite + 32 && (
              <g
                opacity={
                  tweenE(f, tConflict - 4, tConflict + 16, EASE_OUT) *
                  (1 - tweenE(f, tUnite + 8, tUnite + 32, EASE_OUT))
                }
              >
                <circle
                  cx={540 + Math.sin(f * 0.7) * 2.5}
                  cy={935}
                  r={110 + (f % 36) * 2.4}
                  fill="none"
                  stroke="#9c2216"
                  strokeWidth={2.5}
                  strokeDasharray="8 6"
                  opacity={Math.max(0.1, 1 - (f % 36) / 36)}
                />
              </g>
            )}
          </g>
        </svg>
      )}
    </AbsoluteFill>
  );
};

/**
 * SCENE 03 (S2) — 1976–1992 · ATURAN SEKOLAH, GERBANG MENUTUP & LUKA 18 NOV 1992
 * OSIS plaque displaces IPM, school classroom gates slowly shut on "gerbang sekolah menutup",
 * students look up toward the displaced emblem and clutch kaderisasi books, followed by a dead-still
 * 0.61s hold before the PELAJAR -> REMAJA split-flap fold.
 */
export const Scene2OrdeBaru1992: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = SCENES[2].dur;

  const tNext = cue(2, "s2_next", 5);
  const tGov = cue(2, "s2_gov", 128);
  const tOsis = cue(2, "s2_osis", 168);
  const tDoor = cue(2, "s2_door", 322);
  const tDecide = cue(2, "s2_decide", 365);
  const tPush = cue(2, "s2_push", 459);
  const tNov18 = cue(2, "s2_nov18", 603);
  const tKetuk = cue(2, "s2_ketuk", tNov18 + 34);
  const tMorph = cue(2, "s2_morph", 748);
  const tBerganti = cue(2, "s2_berganti", tMorph + 44);
  const tRemaja = cue(2, "s2_remaja", tMorph + 86);
  const tIrm = cue(2, "s2_irm", tMorph + 132);

  const osisIn = tweenE(f, tOsis - 6, tOsis + 22, EASE_OUT);
  const doorClose = tweenE(f, tDoor - 14, tDoor + 42, EASE_IN_OUT);
  const pushRatio = tweenE(f, tPush - 10, tNov18 - 20, EASE_OUT);

  // Expressive blocking phases for students:
  // 0. Arrival step-in onto concrete threshold ledge
  const s2Entry = 1 - tweenE(f, 0, 12, EASE_OUT);
  const s2Exit = tweenE(f, dur - 12, dur, EASE_IN_OUT);
  const stepIn = tweenE(f, 4, 42, EASE_OUT);
  const leftX = lerp(222, 248, stepIn);
  const rightX = lerp(858, 832, stepIn);

  // 1. Reaction (s2_osis): turn head & pupils toward OSIS plaque + displaced IPM emblem
  const reactLook = tweenE(f, tOsis - 2, tOsis + 26, EASE_OUT);
  // 2. Protective clutch (s2_decide..s2_push): pull book/charter tight against chest
  const clutchAct = springObj(f, tDecide - 4, fps, "character");

  const novCardEnter = tweenE(f, tNov18 - 6, tNov18 + 16, EASE_OUT);
  const novStamp = springObj(f, tKetuk - 2, fps, "heavy");
  const impactJolt = shake(f - tKetuk, 9) + shake(f - tIrm, 5);
  const flinch =
    tweenE(f, tKetuk - 2, tKetuk + 5, EASE_OUT) *
    (1 - tweenE(f, tKetuk + 10, tKetuk + 28, EASE_OUT));

  // Voice-locked two-stage IRM morph: hold PELAJAR on "Ikatan Pelajar Muhammadiyah",
  // begin split-flap hinge compression on "berganti menjadi", snap to REMAJA/IRM on "atau IRM".
  const morphEase =
    tweenE(f, tBerganti - 4, tRemaja - 4, EASE_IN_OUT) * 0.48 +
    tweenE(f, tRemaja - 4, tIrm + 6, EASE_OUT) * 0.52;
  const morphLockRecoil =
    tweenE(f, tIrm - 3, tIrm + 3, EASE_OUT) *
    (1 - tweenE(f, tIrm + 4, tIrm + 18, EASE_OUT));
  const holdDim =
    tweenE(f, tKetuk + 16, tMorph + 2, EASE_OUT) *
    (1 - tweenE(f, tIrm + 4, Math.min(dur - 4, tIrm + 24), EASE_IN_OUT));
  const breathHead = Math.sin(f * 0.08) * 0.85 * (1 - holdDim);

  // Camera moves in beats, lingers cleanly during morph and settles with "IRM" landing
  const camP = camAt(f, [
    K3(tNext, 510, 960, 1.0),
    K3(tOsis + 20, 540, 930, 1.05),
    K3(tDoor + 20, 540, 925, 1.08),
    K3(tKetuk + 12, 540, 918, 1.08),
    K3(tBerganti - 4, 540, 914, 1.09),
    K3(tIrm + 6, 540, 898, 1.12),
    K3(dur, 540, 898, 1.12),
  ]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#17202b" }}>
      <PerspStage tiltXDeg={3.2} tiltYDeg={Math.sin(f * 0.022) * 1.1 * (1 - holdDim * 0.8)}>
        <svg viewBox="0 0 1080 1920" width="1080" height="1920" style={{ transform: `translate(${impactJolt}px, 0)` }}>
          <DioramaShadowDefs />
          <Cam2D cx={camP[0]} cy={camP[1]} zoom={camP[2] + s2Entry * 0.045 + s2Exit * 0.035}>
            {/* Moody slate-blue corridor plaster wall, diagonal daylight rays & concrete step (y=1543..1610) */}
            <image
              href={staticFile("art/ep02/s2_school_corridor_bg.jpg")}
              x={-27}
              y={-148}
              width={1134}
              height={1980}
              preserveAspectRatio="xMidYMid slice"
            />
            <rect x={-120} y={1828} width={1320} height={260} fill="#101822" />
            <VolumetricShafts
              id="s2_coldbeam"
              f={f}
              color="#9bc1e6"
              intensity={lerp(0.16, 0.05, doorClose)}
              angleDeg={14}
              sourceX={260}
            />

            {/* OSIS Plaque entering from left, displacing IPM Emblem rightward */}
            <g filter="url(#dioramaCardShadow)">
              <OsisSchoolPlaque
                x={lerp(205, 315, osisIn)}
                y={435}
                scale={osisIn * 0.9}
                opacity={osisIn}
              />

              <g transform={`translate(${lerp(540, 768, Math.min(1, osisIn * 0.9 + pushRatio * 0.1))}, 435)`}>
                <IpmEmblem25D
                  x={0}
                  y={0}
                  scale={lerp(0.64, 0.56, pushRatio) + morphLockRecoil * 0.04}
                  irmMode={morphEase}
                  fracture={tweenE(f, tPush - 6, tIrm + 8, EASE_OUT) * 0.72}
                  glow={0.34 * (1 - morphEase) + morphLockRecoil * 0.28}
                  tactile
                  uid="s2_pushed"
                />
              </g>
            </g>

            {/* 2.5D Paneled timber school gate doors sliding inward */}
            <TactileClassroomGate closeProg={doorClose} />

            {/* Subtle dimming veil during 0.61s silent hold to focus eyes on nameplate */}
            {holdDim > 0.02 && (
              <rect x={-120} y={-80} width={1320} height={2080} fill="#0e141c" opacity={holdDim * 0.36} />
            )}

            {/* Soft blurred concrete ledge contact shadows & cool daylight diagonal cast shadows on step (y=1576) */}
            <g style={{ filter: "blur(5.5px)" }}>
              {[leftX, rightX].map((sx, si) => (
                <g key={`s2_sh_${si}`}>
                  <ellipse cx={sx + 18} cy={1584} rx={84} ry={14} fill="#0b131b" opacity={0.34} />
                  <ellipse cx={sx} cy={1579} rx={60} ry={10} fill="#091017" opacity={0.42} />
                </g>
              ))}
            </g>

            {/* Expressive Student Stakeholders stepping onto concrete threshold ledge (y=1576) with tactile recoil */}
            <HeritageKid
              look={DELEGATE_LOOKS[0]}
              f={f}
              x={leftX}
              y={1576}
              scale={0.88}
              walk={stepIn < 0.99 ? f * 0.24 : 0}
              walkAmp={lerp(0.75, 0, stepIn)}
              head={lerp(0, 8, reactLook) + flinch * 6 + breathHead}
              lean={lerp(0, -3.5, clutchAct) - flinch * 2.5}
              armR={[lerp(-12, -44, clutchAct), lerp(-20, -76, clutchAct)]}
              armL={[lerp(6, -16, clutchAct), lerp(8, -32, clutchAct)]}
              brow={lerp(-0.15, -0.78, reactLook) - flinch * 0.16}
              smile={lerp(0.05, -0.45, reactLook)}
              look2={[lerp(0.1, 0.65, reactLook), lerp(0, -0.55, reactLook) + flinch * 0.15]}
              held="book"
              heldHand="R"
              headLag={1}
              useV2Blink
              tactile
              castShadow
              rimSide="L"
              rimColor="#b5d4ef"
              rimStrength={0.48}
              seed={21}
            />
            <HeritageKid
              look={DELEGATE_LOOKS[1]}
              f={f}
              x={rightX}
              y={1576}
              scale={0.88}
              flip
              walk={stepIn < 0.99 ? f * 0.24 + 1.4 : 0}
              walkAmp={lerp(0.75, 0, stepIn)}
              head={lerp(0, 8, reactLook) + flinch * 6 - breathHead}
              lean={lerp(0, -3.5, clutchAct) - flinch * 2.5}
              armR={[lerp(-12, -42, clutchAct), lerp(-20, -74, clutchAct)]}
              armL={[lerp(6, -16, clutchAct), lerp(8, -32, clutchAct)]}
              brow={lerp(-0.15, -0.74, reactLook) - flinch * 0.16}
              smile={lerp(0.05, -0.42, reactLook)}
              look2={[lerp(0.1, 0.55, reactLook), lerp(0, -0.5, reactLook) + flinch * 0.15]}
              held="letter"
              heldHand="R"
              headLag={1}
              useV2Blink
              tactile
              castShadow
              rimSide="L"
              rimColor="#b5d4ef"
              rimStrength={0.48}
              seed={24}
            />

            {/* 1992 Split-Flap Nameplate Morph & Official SK Stakeholders */}
            <g opacity={tweenE(f, tDoor - 24, tDoor + 4, EASE_OUT)} filter="url(#dioramaCardShadow)">
              <NomenclatureMorphBanner
                x={540}
                y={720}
                remajaMix={morphEase}
                width={840}
              />
            </g>

            {f >= tGov && (
              <CharterStampCard
                x={540}
                y={955}
                w={496}
                h={176}
                year="18 NOV 1992"
                title="SK PP IPM & PP Muhammadiyah"
                stakeholder="PEMERINTAH · PP IPM · PP MUHAMMADIYAH"
                enter={novCardEnter}
                stampProg={novStamp}
                accent="#9c2216"
                tactile
                stampText="SAH"
              />
            )}
          </Cam2D>

          <ForegroundRail scrollX={camP[0]} dark />
          <DualDepthDust color="#9bc1e6" count={20} opacity={0.26} windX={-8} seed="s2-dust" />

          {/* Matching cold slate arrival & exit transition curtains across Scene 1 -> 2 -> 3 */}
          {s2Entry > 0.01 && (
            <rect x={-40} y={-40} width={1160} height={2000} fill="#121b24" opacity={s2Entry * 0.94} />
          )}
          {s2Exit > 0.01 && (
            <rect x={-40} y={-40} width={1160} height={2000} fill="#11151b" opacity={s2Exit * 0.92} />
          )}
        </svg>
      </PerspStage>
    </AbsoluteFill>
  );
};
