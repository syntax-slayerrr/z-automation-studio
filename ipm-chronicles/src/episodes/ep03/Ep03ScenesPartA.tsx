import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { VolumetricShafts } from "../../shared/CinematicV2";
import { Cam2D, PerspStage, clamp, lerp } from "../../shared/Flat3DCamera";
import { HeritageKid, type KidLook } from "../../shared/HeritageKid";
import { HeritageBrassLamp, SunAura } from "../../shared/HeritageProps25D";
import { IpmEmblem25D } from "../../shared/IpmEmblem25D";
import {
  camTrackMath,
  criticallyDampedSpring,
  expZoomLerp,
  mathShotCamera,
  metersToPx,
  minJerk,
  multiBeatOpticalPush,
  quadBezierArc2D,
  rackFocusBlurPx,
  thinLensParallax,
  tweenMinJerk,
  ultraSmoothC3,
} from "../../shared/mathMotion";
import { PainterlyActorV3 } from "../../shared/PainterlyActorV3";
import { DualDepthDust, FONT_MONO, FONT_SANS, FONT_SERIF } from "../../shared/PaperTextures";
import {
  Ep03SurfaceDefs,
  HeritageChalkboardDiagram,
  HeritageSchoolChair,
  HeritageSchoolDeskSet,
  TanfidzFolioBook,
  getDeskTopY,
} from "./Ep03Architecture";
import { FPS, SCENES, WORDS, cue } from "./script";

const KADER_PUTRA_LOOK: KidLook = {
  skin: "#cfa077",
  skinShade: "#ad7b52",
  shirt: "#f5ecd6",
  shirtShade: "#dfd0b2",
  pants: "#272c36",
  hat: "peci",
  hatColor: "#1b140f",
  shoes: "#1e130b",
};

const KADER_PUTRI_LOOK: KidLook = {
  skin: "#dbb088",
  skinShade: "#b98960",
  shirt: "#f4ebd7",
  shirtShade: "#dcccb0",
  pants: "#283446",
  hat: "hijab",
  hatColor: "#5c6c56",
  shoes: "#23170e",
};

/** Helper: deterministic mouth openness 0..0.72 whenever active speaker is articulating inside `sceneIdx` */
function speakerLipOpen(sceneIdx: number, speakerId: string, absSec: number, frame: number): number {
  const active = WORDS.find(
    (w) => w.scene === sceneIdx && w.speaker === speakerId && absSec >= w.start - 0.03 && absSec <= w.end + 0.04
  );
  if (!active) return 0;
  const span = Math.max(0.08, active.end - active.start);
  const u = clamp((absSec - active.start) / span);
  return 0.16 + 0.44 * Math.sin(u * Math.PI) * (0.65 + 0.35 * Math.sin(frame * 0.72));
}

/**
 * SCENE 0 (S0) — MEJA MUKTAMAR KE AMBANG PINTU (`object_doorway`)
 * Calm heirloom study desk connecting seamlessly from EP02 closing desk:
 * - Multi-beat escalated optical push-in (`multiBeatOpticalPush`) while Tanfidz folio gently folds closed
 * - Curved crane push through 1:1 hinged double teak classroom doorway spilling afternoon shafts
 */
export const Scene0MejaMuktamarPintu: React.FC = () => {
  const f = useCurrentFrame();
  useVideoConfig();
  const dur = SCENES[0].dur;

  const tClose = cue(0, "s0_close", 96);
  const tDoor = cue(0, "s0_door", 146);
  const tHall = cue(0, "s0_hall", 195);

  const s0Exit = tweenMinJerk(f, Math.max(1, dur - 14), dur);

  // Stage A (f=0..tDoor): calm 3-beat optical push onto Tanfidz folio on oak desk -> close smoothly
  const pushBeatZoom = multiBeatOpticalPush(f, [6, 36, 72], [1.02, 1.075, 1.135, 1.185], FPS, 15.5);
  const closeSpring = f >= tClose - 4 ? criticallyDampedSpring(f, tClose - 4, FPS, 9.5) : 0;

  // Subtle dignified light shimmer strictly synchronized to push beats (never chaotic strobe)
  const beatFlash =
    clamp(1 - Math.abs(f - 6) / 7) * 0.09 +
    clamp(1 - Math.abs(f - 36) / 7) * 0.1 +
    clamp(1 - Math.abs(f - 72) / 7) * 0.11;

  // Stage B (f >= tDoor - 18): curved crane glide transitioning from study desk up/right toward majestic 9:16 double oak doors
  const doorBlend = tweenMinJerk(f, tDoor - 22, tDoor + 10);
  const doorSwing = tweenMinJerk(f, tDoor - 4, tHall + 16);
  const swingDeg = lerp(4, 68, doorSwing);
  const corridorZoom = expZoomLerp(1.0, 1.38, tweenMinJerk(f, tDoor - 14, dur));
  const [craneX, craneY] = quadBezierArc2D([540, 1005], [558, 955], [540, 920], tweenMinJerk(f, tDoor - 14, dur));

  // Majestic full-frame vertical hallway doors (`2.05m` door = 720px tall; student deeper down sunlit hall at scale=0.82)
  const doorH = 710;
  const doorW = 392;
  const hallFloorY = 1285;
  const hallwayStudentScale = 0.82;

  // Thin-lens parallax multipliers
  const fgGain = thinLensParallax(-0.82, 2.6);
  const fgShiftX = (540 - craneX) * fgGain + doorSwing * 110;
  const bgGain = thinLensParallax(+2.2, 2.6);

  return (
    <AbsoluteFill style={{ backgroundColor: "#140d07" }}>
      <PerspStage tiltXDeg={lerp(2.4, 0.4, doorBlend)} scaleBoost={1.04} origin="50% 54%">
        <svg viewBox="0 0 1080 1920" width="1080" height="1920">
          <Ep03SurfaceDefs uid="s0" />

          {/* STAGE A: MOODY ARCHIVAL MUKTAMAR STUDY DESK (continuing EP02 end look) */}
          {doorBlend < 0.99 && (
            <g opacity={1 - doorBlend}>
              <Cam2D cx={540} cy={1045} zoom={pushBeatZoom}>
                {/* Deep walnut library wall with plaster texture & framed dado */}
                <rect x={-120} y={-120} width={1320} height={2160} fill={`url(#s0_nightWall)`} />
                <rect x={-120} y={-120} width={1320} height={1320} fill={`url(#s0_plaster)`} opacity={0.14} />

                {/* Wood dado panels on rear wall */}
                <rect x={-120} y={880} width={1320} height={290} fill="#2d1b0e" stroke="#180d06" strokeWidth={2.5} />
                {[60, 320, 580, 840].map((px) => (
                  <rect
                    key={px}
                    x={px}
                    y={910}
                    width={215}
                    height={225}
                    rx={4}
                    fill="#3a2313"
                    stroke="#5a381d"
                    strokeWidth={2}
                  />
                ))}

                {/* Ambient spotlight pool + gentle volumetric ray onto Tanfidz folder */}
                <SunAura id="s0_desk_aura" x={510} y={960} r={520} color="#ffd682" op={0.28 + beatFlash * 0.4} />
                <VolumetricShafts id="s0_rays" f={f} color="#ffe09e" intensity={0.14} angleDeg={6} sourceX={480} />

                {/* Carved Walnut Desktop Slab (`y = 1140..1920`) */}
                <polygon points="-160,1150 1240,1150 1320,1960 -240,1960" fill={`url(#s0_walnutTop)`} stroke="#1a0e05" strokeWidth={3} />
                <polygon points="-160,1150 1240,1150 1250,1176 -170,1176" fill="#6f4827" stroke="#241307" strokeWidth={2} />
                <rect x={210} y={1208} width={660} height={310} rx={8} fill="#25160c" stroke="#53351d" strokeWidth={2} opacity={0.82} />

                {/* Grounded Brass Lamp on left side of study desk */}
                <HeritageBrassLamp id="s0_lmp" x={232} y={1242} f={f} s={0.84} power={0.96} />

                {/* Grounded IPM Table Emblem Stand on right side of desk */}
                <g transform="translate(835, 1138)">
                  <ellipse cx={0} cy={104} rx={48} ry={8} fill="#0e0602" opacity={0.5} />
                  <rect x={-38} y={92} width={76} height={14} rx={3} fill="#462912" stroke="#180d05" strokeWidth={2} />
                  <rect x={-6} y={32} width={12} height={64} fill="#5b3619" stroke="#180d05" strokeWidth={1.8} />
                  <IpmEmblem25D x={0} y={-2} scale={0.34} sunSpin={f * 0.14} glow={0.62} tactile uid="s0_emblem" />
                </g>

                {/* Hero Center Prop: TANFIDZ MUKTAMAR Folio smoothly closing */}
                <TanfidzFolioBook x={540} y={1315} scale={0.95} closeProg={closeSpring} uid="s0" />
              </Cam2D>
            </g>
          )}

          {/* STAGE B: CARVED TEAK DOORWAY SWINGING AJAR TO CLASSROOM CORRIDOR (`1:1 Scale`) */}
          {doorBlend > 0.01 && (
            <g opacity={doorBlend}>
              <Cam2D cx={craneX} cy={craneY} zoom={corridorZoom}>
                {/* Corridor illuminated interior glimpsed behind open doorway */}
                <g transform={`translate(${((craneX - 540) * (bgGain - 1)).toFixed(1)}, 0)`}>
                  <rect x={240} y={460} width={600} height={880} fill="#f2e1bc" />
                  <SunAura id="s0_hall_sun" x={540} y={840} r={460} color="#fff1c4" op={0.58} />
                  {/* Corridor lime floor plane + far sunlit classroom corridor doorway */}
                  <rect x={240} y={1185} width={600} height={200} fill="#9c7346" />
                  <line x1={240} y1={1185} x2={840} y2={1185} stroke="#5d3f21" strokeWidth={3} />
                  <rect x={445} y={770} width={190} height={290} rx={4} fill="#fff7dc" stroke="#6b4827" strokeWidth={4} />
                  <line x1={540} y1={770} x2={540} y2={1060} stroke="#6b4827" strokeWidth={3} />
                  {/* Distant serene student standing calmly in sunlit classroom corridor (`1.55m vs deep 2.05m door`) */}
                  <PainterlyActorV3
                    look={KADER_PUTRA_LOOK}
                    f={f}
                    x={548}
                    y={1242}
                    scale={hallwayStudentScale}
                    view="threeQuarter"
                    headTurn={0.45}
                    look2={[0.4, -0.05]}
                    armL={[-8, -14]}
                    armR={[-18, -32]}
                    held="book"
                    heldHand="R"
                    lightFrom="left"
                    ambientTint="#f2cb7a"
                    ambientStrength={0.34}
                    rimColor="#ffeaad"
                    rimStrength={0.48}
                    tactile
                    painterly
                    seed={12}
                  />
                </g>

                {/* Slanted afternoon light shaft spilling from open doorway onto hall floor */}
                <polygon
                  points={`${540 - doorW * 0.45 * doorSwing},${hallFloorY} ${540 + doorW * 0.45 * doorSwing},${hallFloorY} ${
                    540 + doorW * 1.45
                  },1740 ${540 - doorW * 1.45},1740`}
                  fill="#ffe4a4"
                  opacity={0.28 * doorSwing}
                />

                {/* Foreground Threshold Lime-Plaster Wall surrounding tall 1:1 Door Frame */}
                <path
                  d={`M -200 -200 H 1280 V 2120 H -200 Z M ${540 - doorW / 2} ${hallFloorY - doorH} V ${hallFloorY} H ${
                    540 + doorW / 2
                  } V ${hallFloorY - doorH} Z`}
                  fillRule="evenodd"
                  fill={`url(#s0_nightWall)`}
                />
                <path
                  d={`M -200 -200 H 1280 V 2120 H -200 Z M ${540 - doorW / 2} ${hallFloorY - doorH} V ${hallFloorY} H ${
                    540 + doorW / 2
                  } V ${hallFloorY - doorH} Z`}
                  fillRule="evenodd"
                  fill={`url(#s0_plaster)`}
                  opacity={0.14}
                />
                {/* Flanking Architectural Wainscoting Moldings on Hallway Wall */}
                {[
                  { x: -160, w: 540 - doorW / 2 + 120 },
                  { x: 540 + doorW / 2 + 40, w: 600 },
                ].map((b, bi) => (
                  <g key={bi}>
                    <rect x={b.x} y={960} width={b.w} height={325} fill="#2d1b0e" stroke="#180d05" strokeWidth={2.5} />
                    <rect x={b.x} y={960} width={b.w} height={14} fill="#5c3a1d" stroke="#180d05" strokeWidth={1.8} />
                    <rect x={b.x + 28} y={992} width={Math.max(40, b.w - 56)} height={265} rx={4} fill="#382212" stroke="#53341b" strokeWidth={2} />
                  </g>
                ))}
                {/* Glass Transom Window above Doorway Lintel */}
                <rect
                  x={540 - doorW / 2}
                  y={hallFloorY - doorH - 125}
                  width={doorW}
                  height={98}
                  fill="#ffeaab"
                  opacity={0.24 + 0.35 * doorSwing}
                  stroke="#462b16"
                  strokeWidth={12}
                />
                <line x1={540} y1={hallFloorY - doorH - 125} x2={540} y2={hallFloorY - doorH - 27} stroke="#462b16" strokeWidth={8} />

                {/* Doorway Carved Teak Casing (`2.05m` tall) */}
                <rect
                  x={540 - doorW / 2 - 20}
                  y={hallFloorY - doorH - 20}
                  width={doorW + 40}
                  height={doorH + 20}
                  fill="none"
                  stroke="#462b16"
                  strokeWidth={24}
                />
                <rect
                  x={540 - doorW / 2}
                  y={hallFloorY - doorH}
                  width={doorW}
                  height={doorH}
                  fill="none"
                  stroke="#180d06"
                  strokeWidth={3}
                />

                {/* Threshold Teak Parquet Floor */}
                <polygon
                  points={`-200,${hallFloorY} ${540 - doorW / 2},${hallFloorY} ${540 + doorW / 2},${hallFloorY} 1280,${hallFloorY} 1380,1920 -300,1920`}
                  fill="#311d10"
                  stroke="#1b0e06"
                  strokeWidth={2}
                />
                <rect
                  x={540 - doorW / 2}
                  y={hallFloorY}
                  width={doorW}
                  height={16}
                  fill="#7c542d"
                  stroke="#28160a"
                  strokeWidth={1.8}
                />

                {/* Hinged Double Teak Door Leaves Swinging Smoothly Inward */}
                {[
                  { side: -1, hx: 540 - doorW / 2 },
                  { side: 1, hx: 540 + doorW / 2 },
                ].map((leaf) => {
                  const lw = doorW * 0.5;
                  const visW = lw * Math.cos((swingDeg * Math.PI) / 180);
                  const skewY = lw * Math.sin((swingDeg * Math.PI) / 180) * 0.24;
                  const outerX = leaf.hx - leaf.side * visW;
                  return (
                    <g key={leaf.side}>
                      <polygon
                        points={`${leaf.hx},${hallFloorY - doorH} ${outerX},${hallFloorY - doorH - skewY} ${outerX},${
                          hallFloorY + skewY
                        } ${leaf.hx},${hallFloorY}`}
                        fill="#51311a"
                        stroke="#190d05"
                        strokeWidth={2.8}
                      />
                      <polygon
                        points={`${leaf.hx - leaf.side * visW * 0.14},${hallFloorY - doorH * 0.9} ${
                          leaf.hx - leaf.side * visW * 0.84
                        },${hallFloorY - doorH * 0.9 - skewY * 0.7} ${leaf.hx - leaf.side * visW * 0.84},${
                          hallFloorY - doorH * 0.1 - skewY * 0.3
                        } ${leaf.hx - leaf.side * visW * 0.14},${hallFloorY - doorH * 0.1}`}
                        fill="none"
                        stroke="#8a5c32"
                        strokeWidth={2}
                        opacity={0.72}
                      />
                    </g>
                  );
                })}

                <VolumetricShafts id="s0_door_rays" f={f} color="#ffe39d" intensity={0.22 * doorSwing} angleDeg={0} sourceX={540} />
              </Cam2D>
            </g>
          )}

          {/* Foreground Out-of-Focus Book Stack / Lamp Occluder gliding away on thin-lens parallax (`zRel = -0.82m`) */}
          <g
            transform={`translate(${fgShiftX.toFixed(1)}, 0)`}
            filter="url(#s0_softBlur4)"
            opacity={0.9 * (1 - doorBlend * 0.5)}
          >
            <rect x={-110} y={1620} width={330} height={240} rx={6} fill="#1f1108" />
            <rect x={850} y={1640} width={340} height={250} rx={6} fill="#180d05" />
          </g>

          <DualDepthDust color="#ffdfa3" count={18} opacity={0.38} seed="s0-dust" />

          {/* Clean Light Wash Surge on optical push beat + warm bridge transition into afternoon classroom S1 */}
          {beatFlash > 0.01 && doorBlend < 0.4 && (
            <rect x={0} y={0} width={1080} height={1920} fill="#fff2cf" opacity={beatFlash} />
          )}
          {s0Exit > 0.01 && (
            <rect x={0} y={0} width={1080} height={1920} fill="#f2dfc0" opacity={s0Exit * 0.92} />
          )}
        </svg>
      </PerspStage>
    </AbsoluteFill>
  );
};

/**
 * SCENE 1 (S1) — RUANG KELAS SORE & LIMA JENJANG (`PP -> PW -> PD -> PC -> PR`, `CLM-03-01`)
 * Uses:
 * - True thin-lens parallax across Exterior sky/courtyard, Seated Kader Putra + Chalkboard focal plane, & OTS blurry foreground desk/shoulder
 * - Static calm `HeritageKid` (`pose="sit_desk"`, crisp lip-sync only during lines, zero robotic bobbing)
 * - Fritsch-Carlson Monotone PCHIP + Exponential Optical Zoom (`camTrackMath`) gliding to blackboard diagram
 */
export const Scene1RuangKelasStruktur: React.FC = () => {
  const f = useCurrentFrame();
  useVideoConfig();
  const dur = SCENES[1].dur;
  const absSec = SCENES[1].fromSec + f / FPS;

  const tAsk = cue(1, "s1_ask", 52);
  const tFlow = cue(1, "s1_flow", 148);
  const tRanting = cue(1, "s1_ranting", 337);
  const tBasis = cue(1, "s1_basis", 398);

  const s1Entry = 1 - tweenMinJerk(f, 0, 14);
  const s1Exit = tweenMinJerk(f, Math.max(1, dur - 14), dur);

  // Smooth C1/monotonic Fritsch-Carlson PCHIP + Logarithmic zoom trajectory:
  // Start framed intimately OTS on seated Kader Putra (cx=465, cy=1050, z=1.14) -> track quietly right & upward toward Framed Chalkboard (cx=625, cy=815, z=1.22)
  const [camX, camY, camZoom] = camTrackMath(f, [
    { f: 0, p: [445, 1085, 1.12] },
    { f: tAsk + 30, p: [468, 1068, 1.18] },
    { f: tFlow - 6, p: [535, 930, 1.05] },
    { f: tRanting, p: [610, 818, 1.19] },
    { f: tBasis + 42, p: [625, 845, 1.24] },
    { f: dur, p: [625, 840, 1.26] },
  ]);

  // Rack-focus smoothly shifts from OTS front/Kader (`zFocus=0m`) onto Chalkboard (`zFocus=+0.6m`)
  const rackProg = tweenMinJerk(f, tFlow - 16, tFlow + 18);
  const zFocusM = lerp(0.0, 0.55, rackProg);
  const fgBlur = rackFocusBlurPx(-0.88, zFocusM, 2.6, 5.2);

  // Calm character posture (`andi` seated quietly at desk `floorY=1330`, `scale=0.94` matching desk height `getDeskTopY`)
  const charScale = 0.94;
  const floorY = 1330;
  const deskTopY = getDeskTopY(floorY, charScale);
  const headLookAtBoard = tweenMinJerk(f, tFlow - 22, tFlow + 16);
  const lipOpen = speakerLipOpen(1, "andi", absSec, f);

  // Chalkboard progressive math animations
  const flowProg = tweenMinJerk(f, tFlow, tRanting + 8);
  const rantingSpring = f >= tRanting - 4 ? criticallyDampedSpring(f, tRanting - 4, FPS, 10.5) : 0;
  const basisProg = tweenMinJerk(f, tBasis - 4, tBasis + 56);

  // Thin-lens plane offsets
  const extGain = thinLensParallax(+3.5, 2.6);
  const fgGain = thinLensParallax(-0.88, 2.6);
  const extShiftX = (540 - camX) * (extGain - 1);
  const fgShiftX = (540 - camX) * (fgGain - 1);

  return (
    <AbsoluteFill style={{ backgroundColor: "#e6d2ad" }}>
      <PerspStage tiltXDeg={1.4} scaleBoost={1.03} origin="50% 58%">
        <svg viewBox="0 0 1080 1920" width="1080" height="1920">
          <Ep03SurfaceDefs uid="s1" />

          <Cam2D cx={camX} cy={camY} zoom={camZoom}>
            {/* Distant Exterior Courtyard with layered gouache trees & Priangan hills seen outside classroom windows (zRel = +3.5m) */}
            <g transform={`translate(${extShiftX.toFixed(1)}, 0)`}>
              <rect x={-160} y={240} width={520} height={820} fill="#f2dcb0" />
              <SunAura id="s1_ext_sun" x={75} y={480} r={340} color="#ffe9b0" op={0.78} />
              <polygon points="-160,790 60,655 340,790" fill="#a88c6b" opacity={0.55} />
              <polygon points="-120,835 90,715 350,835" fill="#8b4628" opacity={0.55} />
              {/* Layered painterly organic tree canopy silhouettes outside glass */}
              <path d="M -80 860 Q -50 610 25 565 Q 105 555 125 655 Q 175 635 190 715 Q 245 735 235 860 Z" fill="#4f663b" opacity={0.74} />
              <path d="M -30 860 Q 15 675 75 645 Q 145 640 165 730 Q 210 760 198 860 Z" fill="#647c4a" opacity={0.62} />
            </g>

            {/* Interior Class Wall with transparent cut-out window openings on left */}
            <path
              d="M -240 -160 H 1360 V 1330 H -240 Z M 20 430 H 248 V 950 H 20 Z"
              fillRule="evenodd"
              fill={`url(#s1_limeWall)`}
            />
            <path
              d="M -240 -160 H 1360 V 1330 H -240 Z M 20 430 H 248 V 950 H 20 Z"
              fillRule="evenodd"
              fill={`url(#s1_plaster)`}
              opacity={0.22}
            />

            {/* Classroom Ceiling Teak Cornice & Brass Wall Clock above Chalkboard */}
            <rect x={-240} y={295} width={1600} height={24} fill="#462b16" stroke="#180d05" strokeWidth={2.5} />
            <g transform="translate(388, 435)">
              <circle cx={0} cy={0} r={36} fill="#3f2511" stroke="#1a0e05" strokeWidth={2.5} />
              <circle cx={0} cy={0} r={28} fill="#f4e8cd" stroke="#b68737" strokeWidth={2} />
              <line x1={0} y1={0} x2={0} y2={-17} stroke="#22150c" strokeWidth={2.8} strokeLinecap="round" />
              <line x1={0} y1={0} x2={14} y2={6} stroke="#8d2416" strokeWidth={2.2} strokeLinecap="round" />
            </g>

            {/* Lower Wood Wainscoting Dado along Classroom Wall (`0.95m = ~216px` above floorY) */}
            <rect
              x={-240}
              y={floorY - metersToPx(0.95, charScale)}
              width={1600}
              height={metersToPx(0.95, charScale)}
              fill="#593a20"
              stroke="#2a190c"
              strokeWidth={2.5}
            />
            <rect
              x={-240}
              y={floorY - metersToPx(0.95, charScale)}
              width={1600}
              height={14}
              fill="#7d5630"
              stroke="#2a190c"
              strokeWidth={1.8}
            />

            {/* Left Teak Window Frame & Louver Mullions (`1.85m` tall aperture) */}
            <rect x={20} y={430} width={228} height={520} fill="none" stroke="#472c17" strokeWidth={16} />
            <line x1={134} y1={430} x2={134} y2={950} stroke="#472c17" strokeWidth={10} />
            {[560, 690, 820].map((wy) => (
              <line key={wy} x1={20} y1={wy} x2={248} y2={wy} stroke="#472c17" strokeWidth={8} />
            ))}

            {/* Hardwood Classroom Floor (`y = 1330..1920`) */}
            <polygon points="-240,1330 1360,1330 1440,1980 -320,1980" fill="#78512c" stroke="#2c190a" strokeWidth={2.5} />
            {[140, 340, 540, 740, 940].map((px) => (
              <line key={px} x1={px} y1={1330} x2={(px - 540) * 1.45 + 540} y2={1980} stroke="#4b2f16" strokeWidth={2} opacity={0.42} />
            ))}

            {/* Sunbeam Flood across Class & Subtle Slate Chalkboard */}
            <VolumetricShafts id="s1_sunbeams" f={f} color="#ffe39d" intensity={0.2} angleDeg={32} sourceX={150} />

            {/* Hero Architectural Chalkboard mounted at 1.0m height above wainscoting */}
            <HeritageChalkboardDiagram
              x={682}
              y={785}
              w={630}
              h={392}
              flowProg={flowProg}
              rantingProg={rantingSpring}
              basisProg={basisProg}
              uid="s1"
            />

            {/* Wooden School Chair + Seated Calm Kader Putra (`andi`, 1:1 seated scale behind desk clip) */}
            <HeritageSchoolChair x={355} floorY={floorY} charScale={charScale} />
            <g clipPath="url(#s1DeskMask)">
              <defs>
                <clipPath id="s1DeskMask">
                  <rect x={-100} y={300} width={1200} height={deskTopY - 300 + 8} />
                </clipPath>
              </defs>
              <PainterlyActorV3
                look={KADER_PUTRA_LOOK}
                f={f}
                x={355}
                y={floorY}
                scale={charScale}
                pose="sit_desk"
                view="threeQuarter"
                head={lerp(2, -4, headLookAtBoard)}
                headTurn={lerp(0.2, 0.72, headLookAtBoard)}
                look2={[lerp(0.28, 0.65, headLookAtBoard), lerp(0.15, -0.25, headLookAtBoard)]}
                brow={0.12}
                smile={0.08}
                open={lipOpen}
                armR={[-18, -32]}
                armL={[-12, -26]}
                held="quill"
                heldHand="R"
                lightFrom="left"
                ambientTint="#e8be74"
                ambientStrength={0.22}
                rimColor="#ffe4a3"
                rimStrength={0.44}
                useV2Blink
                tactile
                painterly
                seed={31}
              />
            </g>

            {/* Classroom Student Desk anchored at floorY = 1330 + notebook resting on tabletop */}
            <HeritageSchoolDeskSet x={365} floorY={floorY} charScale={charScale} widthM={0.92} uid="s1" />
            <polygon
              points={`332,${deskTopY - 4} 428,${deskTopY - 4} 436,${deskTopY + 5} 324,${deskTopY + 5}`}
              fill="#f3e5c5"
              stroke="#5c3e20"
              strokeWidth={1.6}
            />

            {/* FOREGROUND OTS BLUR OCCLUDER (`zRel = -0.88m`, connected student head + neck + draped shoulders & desk edge) */}
            <g
              transform={`translate(${fgShiftX.toFixed(1)}, 0)`}
              filter="url(#s1_softBlur4)"
              opacity={lerp(0.93, 0.84, rackProg)}
            >
              {/* Smooth anatomical neck + draped student shoulder silhouette (zero floating circle gap) */}
              <path
                d="M -70 1940 V 1505 Q -12 1415 58 1408 L 78 1368 Q 52 1320 55 1272 Q 62 1192 126 1188 Q 192 1188 198 1266 Q 200 1322 162 1365 L 185 1406 Q 285 1425 322 1530 L 348 1940 Z"
                fill="#1d1108"
              />
              {/* Soft curved Peci silhouette anchored directly onto OTS crown */}
              <path d="M 52 1246 Q 55 1172 126 1168 Q 198 1172 200 1244 Q 126 1232 52 1246 Z" fill="#110904" />
            </g>
          </Cam2D>

          <DualDepthDust color="#ffe4a1" count={20} opacity={0.35} seed="s1-dust" />

          {s1Entry > 0.01 && <rect x={0} y={0} width={1080} height={1920} fill="#f2dfc0" opacity={s1Entry * 0.92} />}
          {s1Exit > 0.01 && <rect x={0} y={0} width={1080} height={1920} fill="#362212" opacity={s1Exit * 0.92} />}
        </svg>
      </PerspStage>
    </AbsoluteFill>
  );
};

/**
 * SCENE 2 (S2) — DUA PINTU PERKADERAN SPI (`FORTASI` & `Taruna Melati`, `object_insert`, `CLM-03-02`)
 * - Part A: Tilted Walnut Macro Study Desk opening the maroon leather SISTEM PERKADERAN IPM book,
 *   tracking logarithmically from FORTASI left arch across to ascending Taruna Melati steps right page.
 * - Part B: Calm match-cut into sunlit school corner where Kader Putri (`anisa`) finalizes orientation schedule.
 */
export const Scene2SistemPerkaderanSPI: React.FC = () => {
  const f = useCurrentFrame();
  useVideoConfig();
  const dur = SCENES[2].dur;
  const absSec = SCENES[2].fromSec + f / FPS;

  const tIpm = cue(2, "s2_ipm", 127);
  const tFortasi = cue(2, "s2_fortasi", 165);
  const tOrient = cue(2, "s2_orient", 267);
  const tTm = cue(2, "s2_tm", 427);
  const tSched = cue(2, "s2_sched", 543);
  const tHome = cue(2, "s2_home", 654);

  const s2Entry = 1 - tweenMinJerk(f, 0, 12);
  const partBBlend = tweenMinJerk(f, tSched - 22, tSched + 8);
  const s2Exit = tweenMinJerk(f, Math.max(1, dur - 14), dur);

  // Macro book hinged opening cover & page illumination timings
  const coverOpen = tweenMinJerk(f, 10, tIpm - 8);
  const fortasiHighlight = f >= tFortasi - 4 ? criticallyDampedSpring(f, tFortasi - 4, FPS, 9.5) : 0;
  const tmProgress = tweenMinJerk(f, tTm - 10, tTm + 72);

  // Continuous mathematical camera glide across left-right book pages (kept framed smoothly over blotter)
  const [bookCamX, bookCamY, bookCamZ] = camTrackMath(f, [
    { f: 0, p: [540, 960, 0.98] },
    { f: 42, p: [540, 955, 1.04] },
    { f: tFortasi + 24, p: [442, 945, 1.18] },
    { f: tOrient + 18, p: [465, 952, 1.14] },
    { f: tTm + 22, p: [625, 945, 1.18] },
    { f: tSched - 14, p: [630, 955, 1.21] },
  ]);

  // Phase B camera: calm exponential dolly push toward Kader Putri (`anisa`) over desk schedule
  const partBLocF = Math.max(0, f - (tSched - 22));
  const partBCam = mathShotCamera(partBLocF, Math.max(20, dur - (tSched - 22)), { cx: 525, cy: 1010, zoom: 1.04 }, { cx: 555, cy: 965, zoom: 1.18 }, "ultraSmoothC3");
  const anisaLip = speakerLipOpen(2, "anisa", absSec, f);
  const anisaSmile = lerp(0.18, 0.56, tweenMinJerk(f, tHome - 12, tHome + 24));

  // Scale for Part B classroom corner matching seated desk chest framing
  const cScale = 0.96;
  const floorY = 1320;
  const deskTopY = getDeskTopY(floorY, cScale);

  return (
    <AbsoluteFill style={{ backgroundColor: "#362212" }}>
      {/* PART A: TOP-ANGLE TILTED MACRO DESK & HARDCOVER SPI HANDBOOK */}
      {partBBlend < 0.99 && (
        <div style={{ position: "absolute", inset: 0, opacity: 1 - partBBlend }}>
          <PerspStage tiltXDeg={5.2} scaleBoost={1.05} origin="50% 52%">
            <svg viewBox="0 0 1080 1920" width="1080" height="1920">
              <Ep03SurfaceDefs uid="s2a" />
              <Cam2D cx={bookCamX} cy={bookCamY} zoom={bookCamZ}>
                {/* Wide walnut tabletop + seamless full-width heritage blotter paper sheet */}
                <rect x={-380} y={-220} width={1840} height={2360} fill={`url(#s2a_walnutTop)`} />
                <rect x={-160} y={295} width={1400} height={1190} rx={12} fill="#dfd0b0" stroke="#53371e" strokeWidth={4} />
                <rect x={-160} y={295} width={1400} height={1190} rx={12} fill={`url(#s2a_parchment)`} opacity={0.44} />
                {/* Vintage wooden pen resting naturally right of book spread */}
                <g transform="translate(945, 960) rotate(-14)">
                  <rect x={-6} y={-110} width={12} height={210} rx={4} fill="#5b3419" stroke="#180d05" strokeWidth={2} />
                  <polygon points="-4,100 4,100 0,126" fill="#d9aa4d" stroke="#180d05" strokeWidth={1.5} />
                </g>

                <SunAura id="s2a_glow" x={540} y={880} r={540} color="#ffe39d" op={0.34} />

                {/* Hardcover Open Book: SISTEM PERKADERAN IPM */}
                <g transform="translate(540, 880)" filter="url(#s2a_cardShadow)">
                  {/* Right and left cream page blocks */}
                  <rect x={-370} y={-275} width={740} height={550} rx={10} fill="#4d1e15" stroke="#180a05" strokeWidth={4} />
                  {/* Left Spread: FORTASI Gateway */}
                  <rect x={-352} y={-258} width={346} height={516} rx={4} fill="#f7edd6" stroke="#8b6b43" strokeWidth={2} />
                  {/* Right Spread: TARUNA MELATI Tiers */}
                  <rect x={6} y={-258} width={346} height={516} rx={4} fill="#f4e8ce" stroke="#8b6b43" strokeWidth={2} />
                  {/* Book Spine Shadow */}
                  <rect x={-10} y={-258} width={20} height={516} fill="#9e825a" opacity={0.34} />

                  {/* LEFT PAGE CONTENT: FORTASI Gateway */}
                  <g opacity={clamp((coverOpen - 0.35) / 0.65)}>
                    <text x={-180} y={-205} textAnchor="middle" fontFamily={FONT_MONO} fontSize={12} letterSpacing={2.2} fill="#7d5830">
                      SISTEM PERKADERAN IPM
                    </text>
                    <text x={-180} y={-165} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={900} fontSize={36} fill="#822215">
                      FORTASI
                    </text>
                    <text x={-180} y={-136} textAnchor="middle" fontFamily={FONT_SANS} fontWeight={700} fontSize={13.5} fill="#4b321a">
                      Forum Ta'aruf & Orientasi Siswa
                    </text>
                    <line x1={-310} y1={-114} x2={-50} y2={-114} stroke="#8c683b" strokeWidth={1.6} />

                    {/* Etched classroom archway vignette inside left book page */}
                    <g transform={`translate(-180, 26) scale(${lerp(0.92, 1.0, fortasiHighlight).toFixed(3)})`}>
                      <rect
                        x={-115}
                        y={-95}
                        width={230}
                        height={185}
                        rx={6}
                        fill={fortasiHighlight > 0.3 ? "#fff2cd" : "#ead8b4"}
                        stroke="#684524"
                        strokeWidth={2.4}
                      />
                      <path
                        d="M -68 72 V -12 Q 0 -76 68 -12 V 72 Z"
                        fill="#213c2e"
                        stroke="#8c622d"
                        strokeWidth={3}
                      />
                      <circle cx={0} cy={12} r={22} fill="#ffe194" opacity={0.35 + 0.45 * fortasiHighlight} />
                      <text x={0} y={20} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={800} fontSize={18} fill="#fcebc2">
                        PINTU I
                      </text>
                    </g>
                    <text x={-180} y={168} textAnchor="middle" fontFamily={FONT_SERIF} fontStyle="italic" fontSize={16} fill="#3d2712">
                      Pengenalan arah gerakan
                    </text>
                    <text x={-180} y={192} textAnchor="middle" fontFamily={FONT_SERIF} fontStyle="italic" fontSize={16} fill="#3d2712">
                      bagi pelajar baru sekolah.
                    </text>
                  </g>

                  {/* RIGHT PAGE CONTENT: TARUNA MELATI I -> II -> III -> UTAMA */}
                  <g opacity={clamp((coverOpen - 0.35) / 0.65)}>
                    <text x={180} y={-205} textAnchor="middle" fontFamily={FONT_MONO} fontSize={12} letterSpacing={2.2} fill="#7d5830">
                      KADERISASI FORMAL BERJENJANG
                    </text>
                    <text x={180} y={-165} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={900} fontSize={30} fill="#1f4130">
                      TARUNA MELATI
                    </text>
                    <line x1={50} y1={-138} x2={310} y2={-138} stroke="#8c683b" strokeWidth={1.6} />

                    {[
                      { code: "TM I", scope: "Ranting · Cabang", y: 120, x: -75 },
                      { code: "TM II", scope: "Daerah", y: 50, x: -20 },
                      { code: "TM III", scope: "Wilayah", y: -20, x: 35 },
                      { code: "TM UTAMA", scope: "Pusat", y: -90, x: 90 },
                    ].map((st, idx) => {
                      const k = clamp((tmProgress - idx * 0.2) / 0.3);
                      const sk = k > 0 ? criticallyDampedSpring(f, tTm - 10 + idx * 14, FPS, 11) : 0;
                      return (
                        <g key={st.code} transform={`translate(${180 + st.x * 0.32}, ${st.y})`} opacity={0.28 + 0.72 * k}>
                          <rect
                            x={-110}
                            y={-22}
                            width={220}
                            height={44}
                            rx={4}
                            fill={sk > 0.3 ? "#1e3a2b" : "#e5d3af"}
                            stroke={sk > 0.3 ? "#d8a84a" : "#755532"}
                            strokeWidth={2.2}
                          />
                          <text
                            x={-88}
                            y={5}
                            fontFamily={FONT_SANS}
                            fontWeight={800}
                            fontSize={14}
                            fill={sk > 0.3 ? "#ffd982" : "#3a2512"}
                          >
                            {st.code}
                          </text>
                          <text
                            x={92}
                            y={5}
                            textAnchor="end"
                            fontFamily={FONT_SERIF}
                            fontSize={13.5}
                            fill={sk > 0.3 ? "#f6ebd4" : "#5e4326"}
                          >
                            {st.scope}
                          </text>
                        </g>
                      );
                    })}
                  </g>

                  {/* Animated 3D Hinged Leather Front Cover Opening Leftward from x=0 */}
                  {coverOpen < 0.99 && (
                    <g transform={`scale(${lerp(1.0, -1.0, coverOpen).toFixed(3)}, 1)`} opacity={clamp((1 - coverOpen) * 2)}>
                      <rect x={0} y={-275} width={370} height={550} rx={8} fill="#622519" stroke="#180a05" strokeWidth={4} />
                      <rect x={24} y={-246} width={318} height={492} rx={4} fill="none" stroke="#d5a64d" strokeWidth={2.4} />
                      <IpmEmblem25D x={185} y={-40} scale={0.5} sunSpin={0} glow={0.3} tactile uid="s2_cov" />
                      <text x={185} y={135} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={900} fontSize={26} fill="#f4d996" letterSpacing={2}>
                        PEDOMAN SPI
                      </text>
                    </g>
                  )}
                </g>

                {/* Out-of-Focus Brass Compass / Pen edge occlusion (`zRel = -0.7m`) */}
                <g filter="url(#s2a_softBlur4)" opacity={0.85}>
                  <rect x={-120} y={1380} width={360} height={380} rx={12} fill="#1f1208" />
                </g>
              </Cam2D>
            </svg>
          </PerspStage>
        </div>
      )}

      {/* PART B: CALM CLASSROOM PLANNING CORNER · KADER PUTRI (`anisa`) */}
      {partBBlend > 0.01 && (
        <div style={{ position: "absolute", inset: 0, opacity: partBBlend }}>
          <PerspStage tiltXDeg={1.2} scaleBoost={1.03} origin="50% 55%">
            <svg viewBox="0 0 1080 1920" width="1080" height="1920">
              <Ep03SurfaceDefs uid="s2b" />
              <Cam2D cx={partBCam.cx} cy={partBCam.cy} zoom={partBCam.zoom}>
                <rect x={-220} y={-160} width={1520} height={1520} fill={`url(#s2b_limeWall)`} />
                <rect x={-220} y={-160} width={1520} height={1520} fill={`url(#s2b_plaster)`} opacity={0.22} />

                {/* Right Sunlit Timber Window casting warm amber light */}
                <rect x={800} y={360} width={250} height={540} fill="#fff4d2" stroke="#4c2e17" strokeWidth={16} />
                <line x1={925} y1={360} x2={925} y2={900} stroke="#4c2e17" strokeWidth={10} />
                <line x1={800} y1={630} x2={1050} y2={630} stroke="#4c2e17" strokeWidth={9} />

                {/* Teak wall wainscot & classroom floor */}
                <rect x={-220} y={floorY - metersToPx(0.95, cScale)} width={1520} height={metersToPx(0.95, cScale)} fill="#57381f" />
                <polygon points="-220,1320 1300,1320 1380,1960 -300,1960" fill="#77502b" />
                <VolumetricShafts id="s2b_rays" f={f} color="#ffe39d" intensity={0.2} angleDeg={-24} sourceX={910} />

                {/* Wall notice plaque cleanly framed above desk */}
                <g transform="translate(510, 680)" filter="url(#s2b_cardShadow)">
                  <rect x={-165} y={-105} width={330} height={210} rx={6} fill="#f4ead2" stroke="#4f3319" strokeWidth={6} />
                  <text x={0} y={-48} textAnchor="middle" fontFamily={FONT_MONO} fontSize={14} letterSpacing={2.2} fill="#7d2518">
                    AGENDA ORIENTASI
                  </text>
                  <text x={0} y={-10} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={900} fontSize={30} fill="#25180c">
                    FORTASI
                  </text>
                  <line x1={-110} y1={16} x2={110} y2={16} stroke="#a68a62" strokeWidth={2} />
                  <line x1={-95} y1={42} x2={95} y2={42} stroke="#8f7352" strokeWidth={3} opacity={0.7} />
                  <line x1={-82} y1={64} x2={75} y2={64} stroke="#8f7352" strokeWidth={3} opacity={0.6} />
                </g>

                {/* Chair + Seated Calm Kader Putri (`anisa`) behind 1:1 wooden work table */}
                <HeritageSchoolChair x={580} floorY={floorY} charScale={cScale} />
                <g clipPath="url(#s2DeskClip)">
                  <defs>
                    <clipPath id="s2DeskClip">
                      <rect x={-100} y={240} width={1280} height={deskTopY - 240 + 8} />
                    </clipPath>
                  </defs>
                  <PainterlyActorV3
                    look={KADER_PUTRI_LOOK}
                    f={f}
                    x={580}
                    y={floorY}
                    scale={cScale}
                    pose="sit_desk"
                    view="threeQuarter"
                    head={lerp(2, -2, anisaSmile)}
                    headTurn={-0.32}
                    look2={[-0.35, 0.08]}
                    brow={0.14}
                    smile={anisaSmile}
                    open={anisaLip}
                    armL={[-16, -24]}
                    armR={[-22, -32]}
                    held="quill"
                    heldHand="R"
                    lightFrom="right"
                    ambientTint="#e8be74"
                    ambientStrength={0.22}
                    rimColor="#ffe4a3"
                    rimStrength={0.44}
                    useV2Blink
                    tactile
                    painterly
                    seed={44}
                  />
                </g>

                <HeritageSchoolDeskSet x={560} floorY={floorY} charScale={cScale} widthM={1.15} uid="s2b" />
                {/* Schedule papers & SPI book lying cleanly ON tabletop */}
                <polygon points={`465,${deskTopY - 5} 625,${deskTopY - 5} 640,${deskTopY + 6} 450,${deskTopY + 6}`} fill="#f6ebd0" stroke="#5b3e21" strokeWidth={1.6} />
                <rect x={655} y={deskTopY - 12} width={68} height={14} rx={2} fill="#6c2c1f" stroke="#22150c" strokeWidth={1.4} />

                {/* Foreground Window Lattice / Chair silhouette blurred left (`zRel = -0.8m`) */}
                <g filter="url(#s2b_softBlur4)" opacity={0.9}>
                  <rect x={-90} y={140} width={150} height={1780} fill="#1f1208" />
                </g>
              </Cam2D>
            </svg>
          </PerspStage>
        </div>
      )}

      <DualDepthDust color="#ffe4a1" count={18} opacity={0.34} seed="s2-dust" />
      {s2Entry > 0.01 && <rect x={0} y={0} width={1080} height={1920} fill="#362212" opacity={s2Entry * 0.92} />}
      {s2Exit > 0.01 && <rect x={0} y={0} width={1080} height={1920} fill="#e6d6b4" opacity={s2Exit * 0.92} />}
    </AbsoluteFill>
  );
};
