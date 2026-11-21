import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { AtlasMap2D, GEO, type MapPinSpec, type MapRouteSpec } from "../../shared/AtlasMap2D";
import { VolumetricShafts } from "../../shared/CinematicV2";
import { Cam2D, PerspStage, clamp, lerp } from "../../shared/Flat3DCamera";
import { type KidLook } from "../../shared/HeritageKid";
import { PaintedPeak, RollingRidge, StageBackdrop, SunAura } from "../../shared/HeritageProps25D";
import {
  camTrackMath,
  criticallyDampedSpring,
  mathShotCamera,
  metersToPx,
  minJerk,
  multiBeatOpticalPush,
  rackFocusBlurPx,
  thinLensParallax,
  tweenMinJerk,
} from "../../shared/mathMotion";
import { PainterlyActorV3 } from "../../shared/PainterlyActorV3";
import { DualDepthDust, FONT_MONO, FONT_SANS, FONT_SERIF } from "../../shared/PaperTextures";
import {
  Ep03SurfaceDefs,
  HangingBranchLantern,
  HeritageSchoolChair,
  HeritageSchoolDeskSet,
  getDeskTopY,
} from "./Ep03Architecture";
import { ParchmentCartouche } from "../../shared/VintageCartouche";
import { FPS, SCENES, cue } from "./script";

const KADER_GARUT_LOOK_A: KidLook = {
  skin: "#c8936a",
  skinShade: "#a26d47",
  shirt: "#efe2c6",
  shirtShade: "#cfc09f",
  pants: "#232a35",
  hat: "peci",
  hatColor: "#17120e",
  shoes: "#1c120a",
};

const KADER_GARUT_LOOK_B: KidLook = {
  skin: "#d8ac82",
  skinShade: "#b3845b",
  shirt: "#f4ebd7",
  shirtShade: "#d9c9a8",
  pants: "#252f3d",
  hat: "hijab",
  hatColor: "#eae0c8",
  shoes: "#22160d",
};

/**
 * SCENE 3 (S3) — PETA PRIANGAN: GARUT 1923 & 1958 (`CLM-03-03`)
 * Adopts reference video's tactical 3D map choreography + 3-beat radar pulse punch + sepia archival flash -> horizon dissolve.
 */
export const Scene3PetaPrianganGarut: React.FC = () => {
  const f = useCurrentFrame();
  useVideoConfig();
  const dur = SCENES[3].dur;

  const t1923 = cue(3, "s3_1923", 152);
  const t1958 = cue(3, "s3_1958", 403);

  const s3Entry = 1 - tweenMinJerk(f, 0, 12);
  const s3Exit = tweenMinJerk(f, Math.max(1, dur - 14), dur);

  // Switch seamlessly from 3D tilted West Java map (0..t1958+40) -> Monochrome 1958 flash -> Priangan Ridge Foothills
  const flashMix = tweenMinJerk(f, t1958 - 6, t1958 + 14);
  const ridgeBlend = tweenMinJerk(f, t1958 + 55, t1958 + 82);

  // Tactical 3-beat escalating optical zoom on Garut (`1923`)
  const mapBeatZoom = multiBeatOpticalPush(
    f,
    [t1923, t1923 + 18, t1923 + 36],
    [1.0, 1.045, 1.09, 1.135],
    FPS,
    16
  );

  // Expanding concentric radar pulse rings over Garut screen projection center
  const pulseBeats = [t1923, t1923 + 20, t1923 + 40];
  const card1923 = f >= t1923 + 6 ? criticallyDampedSpring(f, t1923 + 6, FPS, 10) : 0;

  const routes: MapRouteSpec[] = [
    {
      id: "yogya_garut",
      from: GEO.yogyakarta,
      to: GEO.garut,
      startFrame: 12,
      endFrame: Math.max(30, t1923 + 6),
      color: "#8e2416",
      showQuill: true,
      arcBendDeg: 0.72,
    },
  ];
  const pins: MapPinSpec[] = [
    {
      id: "yogya",
      label: "Yogyakarta",
      sublabel: "Pusat Gerakan",
      coord: GEO.yogyakarta,
      triggerFrame: 14,
      color: "#3d5238",
      size: "sm",
      labelSide: "bottom",
    },
    {
      id: "garut",
      label: "Garut",
      sublabel: "Perintis 1923 · 1958",
      coord: GEO.garut,
      triggerFrame: t1923 - 4,
      color: "#a92e1d",
      size: "lg",
      labelSide: "top",
    },
  ];

  // Highland valley smooth optical glide after 1958 horizon dissolve
  const valleyLocF = Math.max(0, f - (t1958 + 45));
  const valleyCam = mathShotCamera(
    valleyLocF,
    Math.max(20, dur - (t1958 + 45)),
    { cx: 540, cy: 960, zoom: 1.06 },
    { cx: 528, cy: 945, zoom: 1.18 },
    "ultraSmoothC3"
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#e6d6b4" }}>
      {/* PHASE A: TILTED 3D D3-GEO CARTOGRAPHY SWEEPING WEST TO GARUT */}
      {ridgeBlend < 0.99 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 1 - ridgeBlend,
            transform: `scale(${mapBeatZoom.toFixed(4)})`,
            transformOrigin: "50% 44%",
          }}
        >
          <AtlasMap2D
            tactile
            fromCenter={[109.7, -7.25]}
            toCenter={GEO.garut}
            fromZoom={1.75}
            toZoom={3.55}
            moveStartFrame={8}
            moveEndFrame={t1923 + 10}
            midFlightZoomDip={0.92}
            activeIslands={["jawa"]}
            activeIslandFrame={16}
            routes={routes}
            pins={pins}
            focalYRatio={0.44}
            compassGeo={[112.4, -5.2]}
            tiltDeg={lerp(11.5, 5.0, tweenMinJerk(f, 0, t1923 + 30))}
            idleDrift={0.015}
          />

          {/* Overlay 3-Beat Tactical Pulse Rings anchored around center focal Garut `[540, 845]` */}
          <svg
            viewBox="0 0 1080 1920"
            width="1080"
            height="1920"
            style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
          >
            {pulseBeats.map((bf, idx) => {
              const p = tweenMinJerk(f, bf, bf + 34);
              if (f < bf || p >= 0.99) return null;
              return (
                <circle
                  key={idx}
                  cx={540}
                  cy={845}
                  r={lerp(22, 260, p)}
                  fill="none"
                  stroke="#a92e1d"
                  strokeWidth={lerp(4.5, 1.2, p)}
                  opacity={(1 - p) * 0.72}
                />
              );
            })}
          </svg>

          {/* Historical Vintage Cartographic Stamp: GARUT 1923 (using cohesive notched museum placard) */}
          {card1923 > 0.02 && (
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: 1090,
                transform: `translate(-50%, 0) scale(${lerp(0.92, 1.0, card1923).toFixed(3)})`,
                opacity: card1923,
                pointerEvents: "none",
              }}
            >
              <ParchmentCartouche
                kicker="SK PP NO. 18/PR"
                title="GARUT · 1923"
                subtitle="CABANG PERINTIS JAWA BARAT"
                waxYear="1923"
                dark
                width={580}
                height={142}
              />
            </div>
          )}
        </div>
      )}

      {/* PHASE B: MONOCHROME 1958 FLASHBACK FLASH -> PRIANGAN FOOTHILLS HORIZON DISSOLVE */}
      {flashMix > 0.01 && (
        <div style={{ position: "absolute", inset: 0, opacity: flashMix }}>
          <PerspStage tiltXDeg={1.6} scaleBoost={1.04} origin="50% 58%">
            <svg viewBox="0 0 1080 1920" width="1080" height="1920">
              <Ep03SurfaceDefs uid="s3v" />
              <Cam2D cx={valleyCam.cx} cy={valleyCam.cy} zoom={valleyCam.zoom}>
                {/* Early dusk / sunset sky behind Priangan volcanic peaks */}
                <StageBackdrop id="s3_sky" top="#28384a" mid="#b98a5f" bottom="#eec589" />
                <SunAura id="s3_sun" x={540} y={840} r={540} color="#ffe09e" op={lerp(0.2, 0.56, ridgeBlend)} />

                {/* Layered Priangan peaks & misty slopes (matched to Java ridge Y=980) */}
                <PaintedPeak x={210} y={1020} w={740} h={390} lit="#6b6356" shade="#454038" />
                <PaintedPeak x={610} y={1000} w={860} h={455} lit="#5e574d" shade="#38342e" />
                <PaintedPeak x={960} y={1040} w={680} h={330} lit="#696256" shade="#433e36" />

                <RollingRidge y={1140} color="#3a4437" stroke="#222a20" amp={92} seed={3} />
                <RollingRidge y={1290} color="#283226" stroke="#182017" amp={72} seed={7} />

                {/* Translucent highland mist bank gliding slowly through valley gap */}
                <ellipse
                  cx={lerp(360, 720, tweenMinJerk(f, t1958, dur))}
                  cy={1060}
                  rx={620}
                  ry={68}
                  fill="#f4e6c9"
                  opacity={0.28}
                />

                {/* Monochrome Sepia Vignette Memory Slate for Konferensi Pemuda 1958 (`#47` style echo) */}
                {ridgeBlend < 0.99 && (
                  <g opacity={1 - ridgeBlend}>
                    <rect x={-120} y={-120} width={1320} height={2160} fill="#1d1814" opacity={0.46} />
                    <g transform="translate(540, 880)" filter="url(#s3v_cardShadow)">
                      <rect x={-310} y={-155} width={620} height={310} rx={8} fill="#f0e4ca" stroke="#36281c" strokeWidth={5} />
                      <rect x={-292} y={-137} width={584} height={274} rx={4} fill="none" stroke="#856b49" strokeWidth={1.8} />
                      <text x={0} y={-72} textAnchor="middle" fontFamily={FONT_MONO} fontSize={15} letterSpacing={2.8} fill="#6b4b2a">
                        KONFERENSI PEMUDA MUHAMMADIYAH
                      </text>
                      <text x={0} y={4} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={900} fontSize={54} letterSpacing={3} fill="#21170e">
                        GARUT · 1958
                      </text>
                      <text x={0} y={58} textAnchor="middle" fontFamily={FONT_SERIF} fontStyle="italic" fontSize={22} fill="#4d351c">
                        Gagasan Wadah Pelajar Dinyalakan
                      </text>
                    </g>
                  </g>
                )}

                {/* Silhouette foreground tea foliage along lower highland slopes */}
                <rect x={-120} y={1320} width={1320} height={680} fill="#192117" />
              </Cam2D>
            </svg>
          </PerspStage>
        </div>
      )}

      <DualDepthDust color="#ffdfa3" count={16} opacity={0.32} seed="s3-dust" />
      {s3Entry > 0.01 && <rect x={0} y={0} width={1080} height={1920} fill="#e6d6b4" opacity={s3Entry * 0.92} />}
      {s3Exit > 0.01 && <rect x={0} y={0} width={1080} height={1920} fill="#15100c" opacity={s3Exit * 0.94} />}
    </AbsoluteFill>
  );
};

/**
 * SCENE 4 (S4) — CABANG LOKAL PC IPM PANAWUAN & JEMBATAN `L03` (`CLM-03-04`)
 * Calm dusk branch veranda inside Tarogong Kidul, Garut:
 * - Hung swinging brass tungsten lamp (`damped pendulum`), illuminated plaque (`PC IPM PANAWUAN`), `TARUNA MELATI` & `PDPM` cards
 * - Exponential reveal pullback out past foreground timber window mullions into twilight valley (`L03`)
 * - Consistent Obsidian `SEJARAH BELUM SELESAI` ending card matching EP01 & EP02.
 */
export const Scene4CabangPanawuanBridge: React.FC = () => {
  const f = useCurrentFrame();
  useVideoConfig();
  const dur = SCENES[4].dur;
  const s = f / FPS;

  const tPanawuan = cue(4, "s4_panawuan", 78);
  const tPcipm = cue(4, "s4_pcipm", 248);
  const tPdpm = cue(4, "s4_pdpm", 366);
  const tBridge = cue(4, "s4_bridge", 527);
  const tEndCard = cue(4, "s4_endcard", 673);

  const s4Entry = 1 - tweenMinJerk(f, 0, 14);
  const blackCurtain = tweenMinJerk(f, Math.min(dur - 40, tEndCard + 12), Math.min(dur - 8, tEndCard + 36));
  const titleRise = tweenMinJerk(f, Math.min(dur - 36, tEndCard + 28), Math.min(dur - 4, tEndCard + 58));

  // Monotone C1 + Exponential zoom trajectory: push calmly onto secretariat notice plaque -> slow atmospheric pullback through dusk window
  const [camX, camY, camZoom] = camTrackMath(f, [
    { f: 0, p: [540, 960, 1.04] },
    { f: tPanawuan + 30, p: [540, 950, 1.1] },
    { f: tPcipm + 20, p: [525, 920, 1.17] },
    { f: tBridge - 18, p: [540, 955, 1.11] },
    { f: Math.max(tBridge + 10, tEndCard), p: [540, 975, 0.96] },
    { f: dur, p: [540, 975, 0.94] },
  ]);

  // Smooth damped pendulum on hanging lamp (zero jitter)
  const lampAngleRad = Math.sin(s * 0.92 + 0.4) * 0.022 * Math.exp(-s * 0.015);
  const charScale = 0.90;
  const floorY = 1320;
  const deskTopY = getDeskTopY(floorY, charScale);

  // Thin-lens parallax for dusk window outside valley vs foreground dark window jambs
  const skyGain = thinLensParallax(+5.5, 2.6);
  const fgGain = thinLensParallax(-0.82, 2.6);
  const skyShiftX = (540 - camX) * (skyGain - 1);
  const fgShiftX = (540 - camX) * (fgGain - 1);
  const fgBlurPx = rackFocusBlurPx(-0.82, 0.1, 2.6, 4.8);

  const pdpmSpring = f >= tPdpm - 4 ? criticallyDampedSpring(f, tPdpm - 4, FPS, 9.5) : 0;
  const headLookOut = tweenMinJerk(f, tBridge - 22, tBridge + 18);

  return (
    <AbsoluteFill style={{ backgroundColor: "#0e0a07" }}>
      <PerspStage tiltXDeg={lerp(1.4, 0.5, headLookOut)} scaleBoost={1.03} origin="50% 56%">
        <svg viewBox="0 0 1080 1920" width="1080" height="1920">
          <Ep03SurfaceDefs uid="s4" />

          <g opacity={1 - blackCurtain}>
            <Cam2D cx={camX} cy={camY} zoom={camZoom}>
              {/* Exterior Priangan Twilight Ridge Glimpsed Outside Open Windows (`zRel = +5.5m`) */}
              <g transform={`translate(${skyShiftX.toFixed(1)}, 0)`}>
                <StageBackdrop id="s4_twilight" top="#131c2b" mid="#2f394b" bottom="#8c5f43" />
                <PaintedPeak x={580} y={1020} w={760} h={340} lit="#242c37" shade="#161b23" />
                <RollingRidge y={1080} color="#171e22" amp={55} seed={5} />
              </g>

              {/* Branch Secretariat Interior Wall with Two Large Window Apertures (`x=635..985`) */}
              <path
                d="M -260 -160 H 1340 V 1320 H -260 Z M 635 450 H 995 V 975 H 635 Z"
                fillRule="evenodd"
                fill={`url(#s4_nightWall)`}
              />
              <path
                d="M -260 -160 H 1340 V 1320 H -260 Z M 635 450 H 995 V 975 H 635 Z"
                fillRule="evenodd"
                fill={`url(#s4_plaster)`}
                opacity={0.14}
              />

              {/* Lower Wood Wainscoting Dado + Window Sill (`floorY = 1320`) */}
              <rect
                x={-260}
                y={floorY - metersToPx(0.95, charScale)}
                width={1600}
                height={metersToPx(0.95, charScale)}
                fill="#322012"
                stroke="#160c05"
                strokeWidth={2.5}
              />
              <polygon points="-260,1320 1340,1320 1420,1960 -340,1960" fill="#462d19" />

              {/* Timber Window Frame & Mullion Lattice */}
              <rect x={635} y={450} width={360} height={525} fill="none" stroke="#362111" strokeWidth={18} />
              <line x1={815} y1={450} x2={815} y2={975} stroke="#362111" strokeWidth={11} />
              <line x1={635} y1={710} x2={995} y2={710} stroke="#362111" strokeWidth={9} />

              {/* Hanging Brass Ceiling Beam & Calm Swinging Tungsten Lamp illuminating wall & desk */}
              <rect x={-260} y={240} width={1600} height={38} fill="#26160b" stroke="#110903" strokeWidth={3} />
              <HangingBranchLantern x={420} y={276} angleRad={lampAngleRad} f={f} uid="s4" />

              {/* Teak Notice Board on Left/Center Wall: PC IPM PANAWUAN (`Tarogong Kidul · Garut`) */}
              <g transform="translate(352, 688)" filter="url(#s4_cardShadow)">
                <rect x={-232} y={-158} width={464} height={316} rx={7} fill="#3f2714" stroke="#180d05" strokeWidth={4} />
                <rect x={-212} y={-138} width={424} height={276} rx={3} fill="#efe3c6" stroke="#85653d" strokeWidth={2} />
                <text x={0} y={-90} textAnchor="middle" fontFamily={FONT_MONO} fontSize={13.5} letterSpacing={2.2} fill="#7d2518">
                  TAROGONG KIDUL · GARUT
                </text>
                <text x={0} y={-52} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={900} fontSize={27} fill="#23160b">
                  PC IPM PANAWUAN
                </text>
                <line x1={-165} y1={-32} x2={165} y2={-32} stroke="#8f6c43" strokeWidth={1.8} />

                {/* Agenda Strips illuminated cleanly by PDPM cue (`criticallyDampedSpring`) */}
                {[
                  { tag: "TARUNA MELATI", sub: "Pengkaderan Ranting", py: 18 },
                  { tag: "PDPM", sub: "Pelatihan Da'i Pelajar", py: 82 },
                ].map((row, idx) => {
                  const hi = pdpmSpring > 0.2 ? clamp(pdpmSpring - idx * 0.15) : 0;
                  return (
                    <g key={row.tag} transform={`translate(0, ${row.py})`}>
                      <rect
                        x={-168}
                        y={-24}
                        width={336}
                        height={48}
                        rx={4}
                        fill={hi > 0.2 ? "#1e3929" : "#e3d1ab"}
                        stroke={hi > 0.2 ? "#d5a349" : "#775934"}
                        strokeWidth={2}
                      />
                      <text x={-148} y={6} fontFamily={FONT_SANS} fontWeight={800} fontSize={15} fill={hi > 0.2 ? "#ffd982" : "#2e1c0e"}>
                        {row.tag}
                      </text>
                      <text x={148} y={6} textAnchor="end" fontFamily={FONT_SERIF} fontSize={14} fill={hi > 0.2 ? "#f6ecd4" : "#5e4327"}>
                        {row.sub}
                      </text>
                    </g>
                  );
                })}
              </g>

              {/* Calm Grounded Rekonstruksi Students inside Panawuan Secretariat (`1:1` real metric height) */}
              <HeritageSchoolChair x={300} floorY={floorY} charScale={charScale} />
              <g clipPath="url(#s4DeskClip)">
                <defs>
                  <clipPath id="s4DeskClip">
                    <rect x={-100} y={240} width={1280} height={deskTopY - 240 + 8} />
                  </clipPath>
                </defs>
                <PainterlyActorV3
                  look={KADER_GARUT_LOOK_B}
                  f={f}
                  x={300}
                  y={floorY}
                  scale={charScale}
                  pose="sit_desk"
                  view="threeQuarter"
                  head={-2}
                  headTurn={0.42}
                  look2={[0.36, 0.12]}
                  brow={0.1}
                  smile={0.22}
                  armL={[-16, -24]}
                  armR={[-22, -32]}
                  held="quill"
                  heldHand="R"
                  lightFrom="left"
                  ambientTint="#ffb85c"
                  ambientStrength={0.3}
                  rimColor="#ffe29c"
                  rimStrength={0.46}
                  useV2Blink
                  tactile
                  painterly
                  seed={61}
                />
              </g>
              <HeritageSchoolDeskSet x={315} floorY={floorY} charScale={charScale} widthM={0.96} uid="s4" />
              <polygon points={`252,${deskTopY - 4} 348,${deskTopY - 4} 356,${deskTopY + 5} 244,${deskTopY + 5}`} fill="#f6ebd0" stroke="#5b3e21" strokeWidth={1.6} />
              <rect x={365} y={deskTopY - 10} width={54} height={11} rx={2} fill="#6c2c1f" stroke="#22150c" strokeWidth={1.4} />

              {/* Second Kader standing calmly gazing at secretariat plaque -> turns serenely outward to twilight window on L03 */}
              <PainterlyActorV3
                look={KADER_GARUT_LOOK_A}
                f={f}
                x={765}
                y={floorY}
                scale={charScale}
                pose="stand"
                view={headLookOut > 0.35 ? "profile" : "threeQuarter"}
                headTurn={lerp(-0.45, 0.55, headLookOut)}
                head={lerp(-2, -4, headLookOut)}
                look2={[lerp(-0.45, 0.5, headLookOut), -0.08]}
                armL={[-10, -20]}
                armR={[-22, -32]}
                held="book"
                heldHand="R"
                lightFrom="left"
                ambientTint="#ffa84c"
                ambientStrength={0.34}
                rimColor="#ffd98a"
                rimStrength={0.5}
                useV2Blink
                tactile
                painterly
                seed={64}
              />

              {/* Foreground Out-of-Focus Veranda Timber Posts (`zRel = -0.82m`, thin-lens depth parallax) */}
              <g transform={`translate(${fgShiftX.toFixed(1)}, 0)`} filter="url(#s4_softBlur4)" opacity={0.95}>
                <rect x={-120} y={-100} width={155} height={2120} fill="#140b05" />
                <rect x={1045} y={-100} width={155} height={2120} fill="#140b05" />
              </g>
            </Cam2D>
          </g>

          <DualDepthDust color="#ffdca0" count={18} opacity={0.36 * (1 - blackCurtain)} seed="s4-dust" />

          {s4Entry > 0.01 && <rect x={-40} y={-40} width={1160} height={2000} fill="#15100c" opacity={s4Entry * 0.94} />}

          {/* Consistent Series Obsidian Ending Card matching EP01 & EP02 */}
          {blackCurtain > 0.01 && (
            <g>
              <rect x={0} y={0} width={1080} height={1920} fill="#0c0907" opacity={blackCurtain} />
              <g opacity={titleRise} transform={`translate(540, ${920 + (1 - titleRise) * 20})`}>
                <line x1={-165} y1={-95} x2={165} y2={-95} stroke="#cfa043" strokeWidth={2.5} opacity={0.75} />
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
                  letterSpacing={3.2}
                  fill="#a6906d"
                >
                  EPISODE 03 · KETIKA GAGASAN TURUN KE KELAS
                </text>
              </g>
            </g>
          )}
        </svg>
      </PerspStage>
    </AbsoluteFill>
  );
};
