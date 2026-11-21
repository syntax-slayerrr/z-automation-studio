import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { VolumetricShafts } from "../../shared/CinematicV2";
import { EASE_CAM, EASE_IN_OUT, EASE_OUT, handheld, lerp, tweenE } from "../../shared/Flat3DCamera";
import type { KidLook } from "../../shared/HeritageKid";
import {
  DriftingLeafParticles,
  HighlandValleyMist,
  TungstenBreathGlow,
  WindowLeafGoboSway,
} from "../../shared/LivingWorld25D";
import { PainterlyActorV3 } from "../../shared/PainterlyActorV3";
import { SunDustMotes } from "../../shared/PaperTextures";

const CloudBand: React.FC<{
  src: string;
  s: number;
  top: number;
  height: number;
  speedPxPerSec: number;
  opacity: number;
  phaseOffset?: number;
}> = ({ src, s, top, height, speedPxPerSec, opacity, phaseOffset = 0 }) => {
  const tileW = 1360;
  const xOff = -((s * speedPxPerSec + phaseOffset) % tileW);
  const url = staticFile(src);
  return (
    <div style={{ position: "absolute", left: 0, top, width: "100%", height, opacity, overflow: "hidden" }}>
      {[0, 1].map((k) => (
        <img
          key={k}
          src={url}
          alt=""
          style={{
            position: "absolute",
            left: xOff + k * tileW,
            top: 0,
            width: tileW,
            height,
            objectFit: "fill",
          }}
        />
      ))}
    </div>
  );
};

export const POC_V3_FRAMES = 180; // 6.00 seconds @ 30fps

const ANDI_VERANDA_LOOK: KidLook = {
  skin: "#c89267",
  skinShade: "#9c6943",
  shirt: "#ead9b9",
  shirtShade: "#c6ae87",
  pants: "#272320",
  hat: "peci",
  hatColor: "#19130f",
  shoes: "#1b120b",
};

/**
 * 9-Layer Proof-of-Concept V3 ("Ambang Serambi Ranting Sore Hari")
 * Zero flat baked JPEG backgrounds: dynamic sky gradient, dual-speed clouds, Priangan ridge + mist,
 * swaying exterior trees, transparent cutout room shell, hinged door & shutter, billowing multi-strip
 * woven curtain, swaying kerosene lantern, grounded furniture props, and PainterlyActorV3 integration.
 */
export const PoCShotV3: React.FC = () => {
  const f = useCurrentFrame();
  useVideoConfig();
  const s = f / 30;

  // Cinematic 6s dolly-in & subtle lateral track to reveal multi-plane parallax depth (with safe f=0 overscan)
  const camP = tweenE(f, 0, POC_V3_FRAMES, EASE_CAM);
  const [hx, hy] = handheld(f, 1.4);
  const camX = lerp(14, -14, camP) + hx;
  const camY = lerp(6, -10, camP) + hy * 0.7;
  const camZoom = lerp(0.048, 0.14, camP); // baseline 1.048x overscan prevents any f=0 border gap

  const planeStyle = (depthMul: number): React.CSSProperties => ({
    position: "absolute",
    inset: 0,
    transform: `translate3d(${(camX * depthMul).toFixed(2)}px, ${(camY * depthMul).toFixed(2)}px, 0) scale(${(
      1 +
      camZoom * depthMul
    ).toFixed(4)})`,
    transformOrigin: "540px 1040px",
    pointerEvents: "none",
  });

  // Gentle breeze gust swelling around f=55..145 driving foliage, door, shutter, curtain, & gobo
  const gust = 0.55 + 0.45 * Math.sin(s * 1.15 - 0.5);
  const treeSwayL = Math.sin(s * 1.35) * 2.4 * gust + Math.sin(s * 2.9 + 0.4) * 0.7;
  const treeSwayR = Math.sin(s * 1.5 + 1.1) * 2.2 * gust + Math.cos(s * 2.6) * 0.6;
  const canopySway = Math.sin(s * 1.25 + 2.0) * 2.6 * gust;
  const lampPendulum = Math.sin(s * 1.65 + 0.5) * (1.2 + 0.45 * gust);

  // Hinged woodwork motion (3D perspective Y-hinge rotation)
  const doorSwingDeg = -46 + Math.sin(s * 1.05 + 0.8) * (4.2 * gust);
  const shutterSwingDeg = -60 + Math.sin(s * 1.45 - 0.3) * (4.5 * gust);

  // Actor Andi 3-act blocking (walk -> place folder on table -> gaze toward sunlit open veranda)
  const walkT = tweenE(f, 0, 62, EASE_OUT);
  const walkAmp = 1 - tweenE(f, 48, 66, EASE_IN_OUT);
  const reachUpT = tweenE(f, 64, 88, EASE_IN_OUT);
  const releaseT = tweenE(f, 88, 108, EASE_IN_OUT);
  const gazeT = tweenE(f, 106, 152, EASE_IN_OUT);

  const andiX = lerp(346, 488, walkT);
  const andiY = lerp(1376, 1482, walkT);
  const andiScale = lerp(0.95, 1.06, walkT);
  const andiLean = reachUpT * (1 - releaseT) * 9.5 + walkAmp * 2.5;
  const armReachShoulder = 12 + reachUpT * (1 - releaseT) * 70;
  const armReachElbow = 16 + reachUpT * (1 - releaseT) * 26;
  const andiHeadPitch = reachUpT * (1 - releaseT) * 8 - gazeT * 5.5;
  const andiHeadTurn = lerp(0.58, -0.72, gazeT);
  const andiLookX = lerp(0.28, -0.62, gazeT);
  const andiLookY = lerp(0.0, -0.18, gazeT);
  const folderPlaced = f >= 89;
  const folderDropSettle = tweenE(f, 89, 97, EASE_OUT);

  // Lighting harmony swells gently as breeze parts leaves & Andi turns into doorway sunbeam
  const activeRimStrength = lerp(0.32, 0.56, gazeT);
  const activeSunSplash = lerp(0.18, 0.34, gazeT);

  // Multi-strip curtain cloth wave physics (7 stitched vertical strips pinned at top rod)
  const curtainStrips = 7;
  const curtainW = 128;
  const curtainH = 304;

  return (
    <AbsoluteFill style={{ backgroundColor: "#140e09", overflow: "hidden" }}>
      {/* L1: PROCEDURAL LATE-AFTERNOON SKY GRADIENT & PAPER GRAIN (Z = -500, 0.14x parallax) */}
      <div style={planeStyle(0.14)}>
        <svg viewBox="0 0 1080 1920" width="1080" height="1920">
          <defs>
            <linearGradient id="pocSkyGrad" x1="0" y1="0" x2="0.15" y2="1">
              <stop offset="0%" stopColor="#426790" />
              <stop offset="28%" stopColor="#7b99af" />
              <stop offset="46%" stopColor="#d7ac7c" />
              <stop offset="62%" stopColor="#f6cc84" />
              <stop offset="100%" stopColor="#ffe5ae" />
            </linearGradient>
            <radialGradient id="pocSunBloom" cx="38%" cy="46%" r="36%">
              <stop offset="0%" stopColor="#fff2c8" stopOpacity="0.88" />
              <stop offset="45%" stopColor="#ffd27e" stopOpacity="0.42" />
              <stop offset="100%" stopColor="#f5a858" stopOpacity="0" />
            </radialGradient>
            <pattern id="pocSkyGrain" width="180" height="180" patternUnits="userSpaceOnUse">
              <image href={staticFile("art/textures/parchment_grain_alpha.png")} width="180" height="180" />
            </pattern>
          </defs>
          <rect width="1080" height="1920" fill="url(#pocSkyGrad)" />
          <rect width="1080" height="1920" fill="url(#pocSunBloom)" />
          <rect width="1080" height="1920" fill="url(#pocSkyGrain)" opacity="0.22" />
        </svg>
      </div>

      {/* L2: DUAL-SPEED HAND-PAINTED GOUACHE CLOUDS (Z = -420..-360, 0.22x..0.28x parallax) */}
      <div style={planeStyle(0.22)}>
        <CloudBand
          src="art/poc_v3/poc_cloud_far.png"
          s={s}
          top={595}
          height={215}
          speedPxPerSec={22}
          opacity={0.88}
        />
        <CloudBand
          src="art/poc_v3/poc_cloud_near.png"
          s={s}
          top={650}
          height={245}
          speedPxPerSec={38}
          opacity={0.95}
          phaseOffset={340}
        />
      </div>

      {/* L3: LAYERED PRIANGAN RIDGE & KAMPUNG ROOFS + DRIFTING HIGHLAND MIST (0.36x parallax) */}
      <div style={planeStyle(0.36)}>
        <img
          src={staticFile("art/poc_v3/poc_mountain_ridge.png")}
          alt=""
          style={{
            position: "absolute",
            left: -95,
            top: 635,
            width: 1270,
            height: 714,
            objectFit: "fill",
          }}
        />
        <HighlandValleyMist top={850} height={240} opacity={0.46} speedPxPerSec={24} />
      </div>

      {/* L4: SWAYING EXTERIOR COURTYARD TREES & BAMBOO OUTSIDE OPENINGS (0.54x parallax) */}
      <div style={planeStyle(0.54)}>
        {/* Lush bamboo towering behind left half of open veranda doorway (top crop hidden above lintel) */}
        <img
          src={staticFile("art/poc_v3/poc_tree_bamboo.png")}
          alt=""
          style={{
            position: "absolute",
            left: 258,
            top: 565,
            width: 325,
            height: 660,
            objectFit: "contain",
            transform: `rotate(${treeSwayL.toFixed(2)}deg)`,
            transformOrigin: "28% 98%",
          }}
        />
        {/* Sunlit upper mango/courtyard bough dipping gracefully past doorway top & left shutter */}
        <img
          src={staticFile("art/poc_v3/poc_tree_spray_b.png")}
          alt=""
          style={{
            position: "absolute",
            left: 418,
            top: 618,
            width: 252,
            height: 252,
            objectFit: "contain",
            transform: `rotate(${canopySway.toFixed(2)}deg)`,
            transformOrigin: "82% 18%",
          }}
        />
        {/* Courtyard tree canopy right outside wide scenic veranda window */}
        <img
          src={staticFile("art/poc_v3/poc_tree_spray_a.png")}
          alt=""
          style={{
            position: "absolute",
            left: 695,
            top: 662,
            width: 306,
            height: 306,
            objectFit: "contain",
            transform: `rotate(${treeSwayR.toFixed(2)}deg)`,
            transformOrigin: "18% 88%",
          }}
        />
        {/* Distant sunlit courtyard foliage visible through far-right narrow window bay */}
        <img
          src={staticFile("art/poc_v3/poc_tree_spray_a.png")}
          alt=""
          style={{
            position: "absolute",
            left: 880,
            top: 635,
            width: 310,
            height: 310,
            objectFit: "contain",
            opacity: 0.85,
            transform: `rotate(${(treeSwayR * 0.8).toFixed(2)}deg)`,
            transformOrigin: "20% 80%",
          }}
        />
      </div>

      {/* L5: ARCHITECTURAL VERANDA SHELL (TRANSPARENT WINDOWS & DOORWAY) + SWINGING LAMP (1.00x) */}
      <div style={planeStyle(1.0)}>
        <img
          src={staticFile("art/poc_v3/poc_room_shell.png")}
          alt=""
          style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }}
        />

        {/* Hinged kerosene brass lantern hanging from ceiling beam, swaying smoothly with tungsten breath */}
        <div
          style={{
            position: "absolute",
            left: 610,
            top: 138,
            width: 172,
            height: 407,
            transform: `rotate(${lampPendulum.toFixed(2)}deg)`,
            transformOrigin: "86px 4px",
          }}
        >
          <img
            src={staticFile("art/poc_v3/poc_hanging_lamp.png")}
            alt=""
            style={{ width: "100%", height: "100%", display: "block" }}
          />
        </div>
        <TungstenBreathGlow
          x={696 - Math.sin((lampPendulum * Math.PI) / 180) * 300}
          y={440}
          radius={220}
          baseOpacity={0.34}
          pulseAmp={0.075}
        />
      </div>

      {/* L6: HINGED TEAK DOOR LEAF, LOUVERED WINDOW SHUTTER, & MULTI-STRIP WAVE CURTAIN (1.02x) */}
      <div style={planeStyle(1.02)}>
        {/* Hinged wooden door leaf mounted on doorway right jamb (x=554), swinging gently inward/ajar */}
        <div
          style={{
            position: "absolute",
            left: 552,
            top: 692,
            width: 142,
            height: 518,
            perspective: 920,
          }}
        >
          <img
            src={staticFile("art/poc_v3/poc_door_leaf.png")}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              transformOrigin: "left center",
              transform: `rotateY(${doorSwingDeg.toFixed(2)}deg)`,
              boxShadow: "12px 14px 28px rgba(18, 9, 4, 0.45)",
            }}
          />
        </div>

        {/* Hinged Javanese louvered window shutter propped open on left edge of scenic veranda window */}
        <div
          style={{
            position: "absolute",
            left: 594,
            top: 720,
            width: 118,
            height: 294,
            perspective: 750,
          }}
        >
          <img
            src={staticFile("art/poc_v3/poc_window_shutter.png")}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              transformOrigin: "left center",
              transform: `rotateY(${shutterSwingDeg.toFixed(2)}deg)`,
              boxShadow: "8px 10px 22px rgba(20, 11, 5, 0.36)",
            }}
          />
        </div>

        {/* Animated multi-strip billowing linen curtain in right veranda window bay */}
        <div
          style={{
            position: "absolute",
            left: 726,
            top: 710,
            width: curtainW + 24,
            height: curtainH + 16,
          }}
        >
          {Array.from({ length: curtainStrips }).map((_, idx) => {
            const frac = idx / Math.max(1, curtainStrips - 1);
            const stripW = curtainW / curtainStrips;
            const yTop = idx * (curtainH / curtainStrips);
            const sliceH = curtainH / curtainStrips + 2;
            const waveX = Math.pow(frac, 1.25) * Math.sin(s * 2.25 - idx * 0.55) * (10.5 * gust);
            const waveSkew = Math.pow(frac, 1.1) * Math.cos(s * 2.0 - idx * 0.45) * (3.2 * gust);
            return (
              <div
                key={idx}
                style={{
                  position: "absolute",
                  left: 0,
                  top: yTop,
                  width: curtainW,
                  height: sliceH,
                  overflow: "hidden",
                  transformOrigin: "top left",
                  transform: `translateX(${waveX.toFixed(2)}px) skewX(${waveSkew.toFixed(2)}deg)`,
                }}
              >
                <img
                  src={staticFile("art/poc_v3/poc_curtain.png")}
                  alt=""
                  style={{
                    position: "absolute",
                    left: 0,
                    top: -yTop,
                    width: curtainW,
                    height: curtainH,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* L7: UNIFIED SCENE STAGE — FLOOR SHADOWS, POT PLANT, WRITING DESK, BOOK STACK, TANFIDZ FOLDER, & PAINTERLY ACTOR (1.03x) */}
      <div style={planeStyle(1.03)}>
        <svg viewBox="0 0 1080 1920" width="1080" height="1920">
          <defs>
            <filter id="pocFloorShadowBlur" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="7" />
            </filter>
            <linearGradient id="pocDeskShadowGrad" x1="0" y1="0" x2="1" y2="0.4">
              <stop offset="0" stopColor="#140903" stopOpacity="0.62" />
              <stop offset="0.65" stopColor="#1f1006" stopOpacity="0.32" />
              <stop offset="1" stopColor="#261408" stopOpacity="0.04" />
            </linearGradient>
          </defs>

          {/* Ground contact AO + oblique floor shadow for left column terracotta pot */}
          <g filter="url(#pocFloorShadowBlur)">
            <ellipse cx={238} cy={1395} rx={68} ry={17} fill="#160b04" opacity={0.48} />
            <ellipse cx={206} cy={1386} rx={44} ry={11} fill="#0e0602" opacity={0.58} />
          </g>
          <image
            href={staticFile("art/poc_v3/poc_pot_plant.png")}
            x={116}
            y={1108}
            width={176}
            height={285}
          />

          {/* 4-leg perspective cast floor shadow + under-apron bounce occlusion for veranda writing desk */}
          <g filter="url(#pocFloorShadowBlur)">
            {/* Broad diffused tabletop floor shadow cast down-right away from open doorway */}
            <polygon
              points="604,1468 874,1412 1038,1470 760,1548"
              fill="url(#pocDeskShadowGrad)"
            />
            {/* Individual wooden leg contact pads grounding all 4 feet solidly onto floorboards & mat */}
            <ellipse cx={596} cy={1470} rx={22} ry={7} fill="#100703" opacity={0.62} />
            <ellipse cx={698} cy={1530} rx={26} ry={8} fill="#100703" opacity={0.68} />
            <ellipse cx={868} cy={1414} rx={22} ry={6.5} fill="#100703" opacity={0.56} />
            <ellipse cx={969} cy={1457} rx={24} ry={7.5} fill="#100703" opacity={0.62} />
          </g>

          {/* Veranda Teak Writing Desk */}
          <image
            href={staticFile("art/poc_v3/poc_table_desk.png")}
            x={556}
            y={1178}
            width={452}
            height={360}
          />

          {/* Stacked Vintage Leather Books anchored on back-right corner of desktop with tabletop shadow */}
          <ellipse cx={874} cy={1232} rx={62} ry={14} fill="#180c04" opacity={0.45} filter="url(#pocFloorShadowBlur)" />
          <image
            href={staticFile("art/poc_v3/poc_book_stack.png")}
            x={798}
            y={1130}
            width={136}
            height={110}
          />

          {/* Settled Tanfidz Document Folder placed flat on desktop surface at f >= 89 */}
          {folderPlaced && (
            <g
              transform={`translate(628, ${(1232 - (1 - folderDropSettle) * 10).toFixed(1)}) rotate(-8)`}
              opacity={0.2 + 0.8 * folderDropSettle}
            >
              {/* Soft tabletop contact shadow cast right */}
              <polygon points="-24,-14 34,-18 42,16 -16,22" fill="#180c04" opacity={0.42} filter="url(#pocFloorShadowBlur)" />
              <polygon points="-28,-16 28,-22 36,12 -20,18" fill="#efe2c3" stroke="#5b3d22" strokeWidth={1.6} />
              <line x1={-16} y1={-6} x2={16} y2={-9} stroke="#8d2416" strokeWidth={2.2} />
              <line x1={-14} y1={2} x2={14} y2={-1} stroke="#59412b" strokeWidth={1.3} opacity={0.6} />
            </g>
          )}

          {/* MAIN ACTOR: HeritageKid V3 Painterly Integration Rig */}
          <PainterlyActorV3
            look={ANDI_VERANDA_LOOK}
            f={f}
            x={andiX}
            y={andiY}
            scale={andiScale}
            view="threeQuarter"
            pose="stand"
            headTurn={andiHeadTurn}
            head={andiHeadPitch}
            look2={[andiLookX, andiLookY]}
            lean={andiLean}
            walk={f * 0.24}
            walkAmp={walkAmp}
            armL={[10, 12]}
            armR={[armReachShoulder, armReachElbow]}
            held={folderPlaced ? null : "letter"}
            heldHand="R"
            smile={lerp(0.32, 0.52, gazeT)}
            brow={0.14}
            headLag={1}
            seed={42}
            lightFrom="left"
            lightWrap={0.42}
            ambientTint="#d99a4e"
            ambientStrength={0.26}
            shadowSkewDeg={56}
            shadowLength={1.2}
            sunGazeWash={activeSunSplash}
            goboPhase={s * 1.4}
            brushEdge={1.3}
            rimColor="#ffdf94"
            rimStrength={activeRimStrength}
            lanternBounce={0.26}
          />
        </svg>
      </div>

      {/* L8: VOLUMETRIC AFTERNOON SHAFTS, SWAYING LEAF GOBO SHADOWS & FLOATING MOTES (1.08x) */}
      <div style={planeStyle(1.08)}>
        <svg viewBox="0 0 1080 1920" width="1080" height="1920" style={{ position: "absolute", inset: 0 }}>
          <g style={{ mixBlendMode: "screen" }}>
            <VolumetricShafts
              id="pocDoorwaySun"
              f={f}
              color="#ffe096"
              intensity={0.24}
              angleDeg={21}
              sourceX={425}
              soft={true}
            />
          </g>
        </svg>
        <WindowLeafGoboSway opacity={0.18} speed={1.1} />
        <SunDustMotes color="#ffdfa0" count={26} opacity={0.44} />
        <DriftingLeafParticles count={9} variant="sunlit" windDir={1} top={680} height={700} />
      </div>

      {/* L9: FOREGROUND DEPTH-OF-FIELD PARALLAX FRAMING FOLIAGE (Z = +140, 1.48x) */}
      <div style={planeStyle(1.48)}>
        <img
          src={staticFile("art/poc_v3/poc_fg_foliage_l.png")}
          alt=""
          style={{
            position: "absolute",
            left: -46,
            top: 94,
            width: 315,
            height: 332,
            objectFit: "contain",
            filter: "blur(2.4px)",
            opacity: 0.92,
            transform: `rotate(${(treeSwayL * 0.85).toFixed(2)}deg)`,
            transformOrigin: "12% 14%",
          }}
        />
        <img
          src={staticFile("art/poc_v3/poc_fg_foliage_r.png")}
          alt=""
          style={{
            position: "absolute",
            right: -36,
            bottom: -24,
            width: 350,
            height: 365,
            objectFit: "contain",
            filter: "blur(2.8px)",
            opacity: 0.94,
            transform: `rotate(${(treeSwayR * 0.78).toFixed(2)}deg)`,
            transformOrigin: "92% 88%",
          }}
        />
      </div>

      {/* Subtle warm vignette & editorial archival border polish */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 48% 46%, rgba(20,12,6,0) 56%, rgba(16,10,5,0.42) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
