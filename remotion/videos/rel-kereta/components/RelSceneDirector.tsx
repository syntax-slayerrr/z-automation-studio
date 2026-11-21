import React, { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { ACTS, CUES, REL_COMPOSITION_CONFIG } from "../story";
import { LightingMood, ProEnvironment } from "./ProEnvironment";
import { OrganicWorld } from "./OrganicWorld";
import { EngineerAction, EngineerRig } from "./EngineerRig";
import {
  MacroBallastInterlock3D,
  MacroExpansionGap3D,
  RailwayTrack3D,
  StylizedTrain3D,
  TableAnalogy3D,
} from "./RailwaySystems";

/**
 * Deterministic Soft 85mm Bokeh Backdrop for Macro Close-Ups (Beat 4 & Beat 7)
 * Guarantees creamy Blender-style shallow Depth-of-Field blur behind razor-sharp 3D hero geometry!
 */
function createMacroBokehBackdropTexture(isWarm: boolean): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext("2d")!;

  // Soft blurred sky -> sunlit foliage -> warm terracotta roof -> sandy earth horizon
  const skyG = ctx.createLinearGradient(0, 0, 0, 512);
  skyG.addColorStop(0.0, "#388AD8");
  skyG.addColorStop(0.38, "#A9D9F7");
  skyG.addColorStop(0.55, "#D9D2C4");
  skyG.addColorStop(1.0, "#A98967");
  ctx.fillStyle = skyG;
  ctx.fillRect(0, 0, 512, 512);

  // Soft blurred foliage & sunlit bokeh orbs (out-of-focus background trees & roof!)
  const orbs: [number, number, number, string][] = [
    [95, 165, 95, "rgba(74, 132, 42, 0.72)"],
    [255, 145, 110, "rgba(62, 118, 36, 0.68)"],
    [420, 170, 98, "rgba(86, 146, 48, 0.72)"],
    [160, 295, 95, "rgba(224, 118, 72, 0.72)"],
    [375, 305, 105, "rgba(218, 110, 66, 0.68)"],
    [110, 115, 38, "rgba(255, 252, 232, 0.55)"],
    [340, 105, 44, "rgba(255, 250, 224, 0.52)"],
    [455, 235, 32, isWarm ? "rgba(255, 220, 145, 0.45)" : "rgba(215, 240, 255, 0.45)"],
  ];
  for (const [x, y, r, col] of orbs) {
    const g = ctx.createRadialGradient(x, y, r * 0.15, x, y, r);
    g.addColorStop(0, col);
    g.addColorStop(0.65, col.replace(/[\d.]+\)$/, "0.38)"));
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export interface RelSceneDirectorProps {
  frame: number;
}

const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = Math.max(0, Math.min(1, (x - edge0) / Math.max(0.0001, edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const lerpVec3 = (
  a: [number, number, number],
  b: [number, number, number],
  t: number
): [number, number, number] => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

// EXACT FRAME 0 LOOP ANCHOR (Beat 8 glides smoothly right back to these exact values!)
const LOOP_ANCHOR_POS: [number, number, number] = [0.35, 1.95, 6.8];
const LOOP_ANCHOR_LOOK: [number, number, number] = [0.0, 1.05, -0.8];
const LOOP_ANCHOR_FOV = 44;
const LOOP_ANCHOR_ENG_POS: [number, number, number] = [1.55, 0, -2.1];
const LOOP_ANCHOR_TRAIN_START_X = -3.8;

export const RelSceneDirector: React.FC<RelSceneDirectorProps> = ({ frame }) => {
  const { camera } = useThree();
  const total = REL_COMPOSITION_CONFIG.durationInFrames;
  const bokehCoolTex = useMemo(() => createMacroBokehBackdropTexture(false), []);
  const bokehWarmTex = useMemo(() => createMacroBokehBackdropTexture(true), []);

  // Resolve current Act (1..8) cleanly from audio-driven ACTS array
  const currentActObj = useMemo(() => {
    const found = ACTS.find((a) => frame >= a.startFrame && frame < a.endFrame);
    return found || ACTS[ACTS.length - 1];
  }, [frame]);

  const act = currentActObj.act;
  const actProg = smoothstep(currentActObj.startFrame, currentActObj.endFrame, frame);

  // Cue-based sub-triggers
  const fMacroBallastStart = CUES.b4_macro ?? currentActObj.startFrame + 80;
  const fMacroBallastEnd = CUES.b4_lock ?? currentActObj.endFrame - 45;
  const isMacroBallast = act === 4 && frame >= fMacroBallastStart && frame < fMacroBallastEnd;
  const isTableAnalogy = act === 5;
  const isMacroGap = act === 7;

  // Dynamic Weather & Lighting Mood (smoothly returns to "day" at end of Beat 8 for Seamless Loop!)
  let mood: LightingMood = "day";
  if (act === 3 || (act === 4 && frame >= (CUES.b4_drain ?? 99999))) {
    mood = "rain";
  } else if (act === 6) {
    mood = "heat";
  } else if (act === 8 && actProg < 0.58) {
    mood = "golden";
  } else {
    mood = "day";
  }

  // Smooth Deterministic Camera Choreography + Micro Handheld Breath + Impact Shake
  const { camPos, camLook, camFov, dofBokeh, dofFocusDist } = useMemo(() => {
    let pos: [number, number, number] = [...LOOP_ANCHOR_POS];
    let look: [number, number, number] = [...LOOP_ANCHOR_LOOK];
    let fov = LOOP_ANCHOR_FOV;
    let bokeh = 0.0;
    let focusDist = 0.02;

    if (act === 1) {
      // Beat 1: Starts at EXACT LOOP_ANCHOR, gently glides inward (15-frame smooth transition start!)
      const g = smoothstep(0, 0.88, actProg);
      pos = lerpVec3(LOOP_ANCHOR_POS, [0.15, 1.55, 5.45], g);
      look = lerpVec3(LOOP_ANCHOR_LOOK, [0.0, 0.55, -0.55], g);
      fov = lerp(LOOP_ANCHOR_FOV, 41, g);
    } else if (act === 2) {
      // Beat 2: 18-frame smooth glide to medium shot watching engineer place sleeper on bare dirt
      const glideIn = smoothstep(0, 0.22, actProg);
      pos = lerpVec3([0.15, 1.55, 5.45], [-0.25, 1.85, 5.65], glideIn);
      look = lerpVec3([0.0, 0.55, -0.55], [0.0, 0.52, -0.65], glideIn);
      fov = lerp(41, 42, glideIn);
    } else if (act === 3) {
      // Beat 3: 20-frame smooth crane down into soil cutaway showing sleeper sinking & tilting + RED arrows
      const crane = smoothstep(0, 0.32, actProg);
      pos = lerpVec3([-0.25, 1.85, 5.65], [0.15, 0.85, 4.45], crane);
      look = lerpVec3([0.0, 0.52, -0.65], [0.0, -0.15, -0.45], crane);
      fov = lerp(42, 38, crane);
      // Impact shake when heavy load hits soft mud
      if (actProg > 0.08 && actProg < 0.32) {
        const st = (actProg - 0.08) / 0.24;
        const amp = Math.exp(-st * 6) * 0.09;
        pos[0] += Math.sin(frame * 1.9) * amp;
        pos[1] += Math.cos(frame * 2.3) * amp;
      }
    } else if (act === 4) {
      if (isMacroBallast) {
        // Beat 4 Macro DOF Rack-Focus onto Sharp Interlocking Granite Rocks!
        const mProg = smoothstep(fMacroBallastStart, fMacroBallastEnd, frame);
        pos = [lerp(-0.25, 0.25, mProg), 1.98, lerp(2.55, 2.15, mProg)];
        look = [0.0, 1.82, 0.0];
        fov = 35;
        bokeh = 4.2;
        focusDist = 0.015;
      } else if (frame < fMacroBallastStart) {
        // Pouring sharp crushed granite embankment
        const p = smoothstep(currentActObj.startFrame, fMacroBallastStart, frame);
        pos = lerpVec3([0.15, 1.65, 5.2], [0.05, 1.25, 4.8], p);
        look = [0.0, 0.28, -0.45];
        fov = 40;
      } else {
        // Crane-down cutaway revealing BLUE load-distribution cone + rainwater drainage!
        const p = smoothstep(fMacroBallastEnd, currentActObj.endFrame, frame);
        pos = lerpVec3([0.1, 1.05, 4.75], [0.0, 0.68, 4.35], p);
        look = [0.0, -0.18, -0.35];
        fov = 39;
      }
    } else if (act === 5) {
      // Beat 5: Everyday Table Analogy — Engineer pressing Round Marbles vs Sharp Stones!
      const p = smoothstep(0, 1, actProg);
      pos = [lerp(-0.18, 0.18, p), 1.58, 2.75];
      look = [0.0, 1.04, 0.35];
      fov = 39;
      bokeh = 1.6;
      focusDist = 0.022;
    } else if (act === 6) {
      // Beat 6: High-angle 3/4 view down along track as 60C heat buckles steel rails into S-curve!
      const p = smoothstep(0, 1, actProg);
      pos = lerpVec3([-1.4, 2.65, 4.4], [-0.4, 2.25, 4.0], p);
      look = [0.0, 0.55, -0.75];
      fov = 40;
      const fBuckle = CUES.b6_buckle ?? currentActObj.startFrame + 140;
      if (frame >= fBuckle && frame < fBuckle + 22) {
        const st = (frame - fBuckle) / 22;
        const amp = Math.exp(-st * 5) * 0.11;
        pos[0] += Math.sin(frame * 2.4) * amp;
        pos[1] += Math.cos(frame * 2.1) * amp;
      }
    } else if (act === 7) {
      // Beat 7: Macro DOF Rack-Focus onto 10mm Steel Expansion Gap + Fishplate Bolts + Rolling Wheel!
      const p = smoothstep(0, 1, actProg);
      pos = [lerp(-0.22, 0.18, p), 2.18, lerp(2.25, 1.92, p)];
      look = [0.0, 1.95, 0.0];
      fov = 35;
      bokeh = 4.4;
      focusDist = 0.018;
      // Subtle tactile click vibration right when train wheel rolls across X=0 gap!
      if (p > 0.68 && p < 0.78) {
        const amp = Math.exp(-Math.pow((p - 0.72) * 35, 2)) * 0.04;
        pos[1] += Math.sin(frame * 3.0) * amp;
      }
    } else if (act === 8) {
      // Beat 8: SEAMLESS VISUAL LOOP GLIDE right back to EXACT LOOP_ANCHOR at final frame!
      const loopT = smoothstep(0.12, 0.94, actProg);
      pos = lerpVec3([-0.35, 2.15, 7.2], LOOP_ANCHOR_POS, loopT);
      look = lerpVec3([0.0, 0.95, -0.75], LOOP_ANCHOR_LOOK, loopT);
      fov = lerp(46, LOOP_ANCHOR_FOV, loopT);
    }

    // Subtle organic living camera micro-breath (fades to 0 at Frame 0 & Final Frame for exact loop!)
    const loopGuard = Math.min(smoothstep(0, 20, frame), smoothstep(total - 1, total - 24, frame));
    pos[0] += Math.sin(frame * 0.045) * 0.016 * loopGuard;
    pos[1] += Math.cos(frame * 0.038) * 0.012 * loopGuard;

    return {
      camPos: new THREE.Vector3(...pos),
      camLook: new THREE.Vector3(...look),
      camFov: fov,
      dofBokeh: bokeh,
      dofFocusDist: focusDist,
    };
  }, [act, actProg, frame, isMacroBallast, fMacroBallastStart, fMacroBallastEnd, currentActObj, total]);

  // Apply deterministic camera every single frame
  useFrame(() => {
    camera.position.copy(camPos);
    camera.lookAt(camLook);
    const pCam = camera as THREE.PerspectiveCamera;
    if (Math.abs(pCam.fov - camFov) > 0.01) {
      pCam.fov = camFov;
      pCam.updateProjectionMatrix();
    }
  });

  // Track mode & engineering physics parameters
  const trackMode =
    act === 2 || act === 3
      ? "bare_dirt_sink"
      : act === 4
      ? "ballast_pour"
      : act === 6
      ? "sun_kink"
      : "ballast_normal";

  const sinkAmount =
    act === 2
      ? smoothstep(0.45, 0.95, actProg) * 0.6
      : act === 3
      ? 0.6 + smoothstep(0, 0.55, actProg) * 0.4
      : 0;

  const pourProgress = act === 4 ? smoothstep(currentActObj.startFrame, fMacroBallastStart, frame) : 1;
  const buckleAmount =
    act === 6
      ? smoothstep((CUES.b6_expand ?? currentActObj.startFrame + 60) - 10, (CUES.b6_buckle ?? currentActObj.startFrame + 140) + 25, frame)
      : 0;

  // Train Animation (glides cleanly through Beat 1, hits soft dirt in Beat 2-3, returns smoothly in Beat 8 -> exact Frame 0!)
  let showTrain = false;
  let trainX = LOOP_ANCHOR_TRAIN_START_X;
  let trainY = 0.72;
  let trainTilt = 0;

  if (act === 1) {
    showTrain = true;
    trainX = lerp(LOOP_ANCHOR_TRAIN_START_X, 10.5, actProg);
  } else if (act === 2) {
    showTrain = actProg > 0.35;
    const t = smoothstep(0.35, 1.0, actProg);
    trainX = lerp(-9.0, 2.2, t);
    trainY = 0.34 - sinkAmount * 0.22;
    trainTilt = sinkAmount * 0.09;
  } else if (act === 3) {
    showTrain = true;
    trainX = lerp(2.2, 4.6, actProg);
    trainY = 0.32 - sinkAmount * 0.25;
    trainTilt = 0.09 + smoothstep(0.3, 0.85, actProg) * 0.14;
  } else if (act === 8) {
    showTrain = true;
    // Passes smoothly in first half, then next train enters right toward LOOP_ANCHOR_TRAIN_START_X!
    trainX = actProg < 0.60 ? lerp(-6.5, 12.5, actProg / 0.60) : lerp(-12.0, LOOP_ANCHOR_TRAIN_START_X, (actProg - 0.60) / 0.40);
  }

  // Engineer Rig Visibility, Position & Action
  let showEngineer = !isMacroBallast && !isMacroGap;
  let engAction: EngineerAction = "observe";
  let engPos: [number, number, number] = [...LOOP_ANCHOR_ENG_POS];
  let engRotY = -0.35;

  if (act === 1) {
    engAction = "observe";
    engPos = [...LOOP_ANCHOR_ENG_POS];
    engRotY = -0.35;
  } else if (act === 2) {
    engAction = "place_sleeper";
    engPos = [1.45, 0, -1.95];
    engRotY = -0.55;
  } else if (act === 3) {
    engAction = "shock";
    engPos = [1.95, 0, -2.05];
    engRotY = -0.4;
  } else if (act === 4) {
    engAction = "inspect_ballast";
    engPos = [1.85, 0, -2.05];
    engRotY = -0.55;
  } else if (act === 5) {
    engAction = "table_press";
    engPos = [0, 0, -0.04];
    engRotY = 0.0;
  } else if (act === 6) {
    engAction = "heat_sweat";
    engPos = [1.95, 0, -2.1];
    engRotY = -0.3;
  } else if (act === 8) {
    engAction = "satisfied_loop";
    engPos = [...LOOP_ANCHOR_ENG_POS];
    engRotY = -0.35;
  }

  return (
    <>
      {/* 1. Synthetic PMREM HDRI Lighting + Custom GLSL Volumetric Cloud Sky Dome */}
      <ProEnvironment mood={mood} frame={frame} />

      {/* 2. Blender-Grade Organic Rural Indonesian Railway World & Sculpted Cutaway */}
      <OrganicWorld
        mood={mood}
        isWetMud={act === 3}
        frame={frame}
        showCutaway={!isMacroBallast && !isMacroGap && !isTableAnalogy}
        showHeatWaves={act === 6}
      />

      {/* 3. Main Engineering Railway Track + 190 Faceted Granite Stones */}
      {!isMacroBallast && !isMacroGap && !isTableAnalogy && (
        <RailwayTrack3D
          mode={trackMode}
          sinkAmount={sinkAmount}
          pourProgress={pourProgress}
          buckleAmount={buckleAmount}
          showLoadCone={act === 4 && frame >= fMacroBallastEnd}
          showDrainage={act === 4 && frame >= (CUES.b4_drain ?? 99999)}
          frame={frame}
        />
      )}

      {/* 4. Stylized Passenger Train */}
      {showTrain && !isMacroBallast && !isMacroGap && !isTableAnalogy && (
        <StylizedTrain3D posX={trainX} baseY={trainY} tiltZ={trainTilt} frame={frame} />
      )}

      {/* 5. Beat 4 Macro DOF Hero: Sharp Crushed Granite Interlock + Soft 85mm Bokeh Backdrop */}
      {isMacroBallast && (
        <>
          <mesh position={[0, 1.85, -1.65]}>
            <planeGeometry args={[6.2, 7.0]} />
            <meshBasicMaterial map={bokehCoolTex} fog={false} />
          </mesh>
          <pointLight position={[1.2, 3.0, 2.8]} intensity={3.2} color="#FFFBF0" />
          <pointLight position={[-1.4, 1.6, 2.4]} intensity={1.8} color="#D8ECFF" />
          <MacroBallastInterlock3D
            progress={smoothstep(fMacroBallastStart, fMacroBallastEnd, frame)}
            frame={frame}
          />
        </>
      )}

      {/* 6. Beat 5 Everyday Table Analogy: Round Glass Marbles vs Sharp Stones */}
      {isTableAnalogy && (
        <>
          <pointLight position={[0.0, 1.45, 1.75]} intensity={1.35} color="#FFF6E6" />
          <TableAnalogy3D progress={actProg} frame={frame} />
        </>
      )}

      {/* 7. Beat 7 Macro DOF Hero: 10mm Steel Expansion Gap + Fishplate Bolts + Soft 85mm Bokeh */}
      {isMacroGap && (
        <>
          <mesh position={[0, 1.95, -1.75]}>
            <planeGeometry args={[6.4, 7.2]} />
            <meshBasicMaterial map={bokehWarmTex} fog={false} />
          </mesh>
          <pointLight position={[1.4, 3.2, 3.0]} intensity={3.6} color="#FFF8EA" />
          <pointLight position={[-1.6, 2.0, 2.4]} intensity={2.0} color="#CFE6FF" />
          <MacroExpansionGap3D progress={actProg} frame={frame} />
        </>
      )}

      {/* 8. Articulated Stylized 3D Railway Engineer Rig */}
      {showEngineer && (
        <EngineerRig
          position={engPos}
          rotationY={engRotY}
          action={engAction}
          frame={frame}
          actionProgress={actProg}
        />
      )}
    </>
  );
};
