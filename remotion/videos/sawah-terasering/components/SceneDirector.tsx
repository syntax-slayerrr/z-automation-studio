import React, { useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { CUES, SEQS } from "../story";
import {
  TERRACE_TIERS,
  clamp01,
  getTerrainSlopeAngleZ,
  getTerrainY,
  smoothstep,
} from "../ikSolver";
import { ProEnvironment } from "./ProEnvironment";
import { TerraceHillCutaway } from "./TerraceHillCutaway";
import {
  BambooSpillwayCascades,
  FloodedTerracePools,
  SlopeRunoffStream,
} from "./WaterSurface3D";
import { RicePaddyField } from "./RicePaddyField";
import { MountainValleyBackdrop } from "./MountainValleyBackdrop";
import { MannequinProIK } from "./MannequinProIK";
import {
  ClayPitcherProp3D,
  HeldBambooPipeProp3D,
  HoeProp3D,
  SeedlingBundleProp3D,
  TABLE_TOP_Y,
  TABLE_ZONE_X,
  TableAnalogyScene3D,
  computeBambooPipeHoldGrip,
  computeClayPitcherGrip,
  computeHoeGripSolution,
} from "./PropsAndAnalogy3D";

export interface SceneDirectorProps {
  frame: number;
  fps: number;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp01(t);
}

function lerpVec3(
  a: [number, number, number],
  b: [number, number, number],
  t: number
): [number, number, number] {
  const u = clamp01(t);
  return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
}

/**
 * Biomechanical Terrain-Locked Foot & Hip Solver:
 * Locks BOTH sandals mathematically onto `getTerrainY(x, z, terraceMorph, bundStrength)`
 * and computes natural athletic hip height (downhill leg extended, uphill knee comfortably bent!)
 * so sandals NEVER float, NEVER sink, and IK legs NEVER over-stretch!
 */
function computeGroundedStance(
  centerX: number,
  centerZ: number,
  facingYaw: number,
  stanceHalfWidth: number,
  terraceMorph: number,
  bundStrength: number,
  crouch: number = 0,
  flatGroundY?: number
): {
  hipPos: [number, number, number];
  leftFoot: [number, number, number];
  rightFoot: [number, number, number];
  leftSlopeZ: number;
  rightSlopeZ: number;
} {
  const cosY = Math.cos(facingYaw);
  const sinY = Math.sin(facingYaw);
  // Local left (-X) and right (+X) rotated into world space
  const lx = centerX - cosY * stanceHalfWidth;
  const lz = centerZ + sinY * stanceHalfWidth;
  const rx = centerX + cosY * stanceHalfWidth;
  const rz = centerZ - sinY * stanceHalfWidth;

  const ly =
    flatGroundY !== undefined ? flatGroundY : getTerrainY(lx, lz, terraceMorph, bundStrength);
  const ry =
    flatGroundY !== undefined ? flatGroundY : getTerrainY(rx, rz, terraceMorph, bundStrength);

  const lSlope =
    flatGroundY !== undefined ? 0 : getTerrainSlopeAngleZ(lx, lz, terraceMorph, bundStrength);
  const rSlope =
    flatGroundY !== undefined ? 0 : getTerrainSlopeAngleZ(rx, rz, terraceMorph, bundStrength);

  // Anchor pelvis height safely above the LOWER foot so neither leg ever exceeds 2-bone max reach (0.68m)!
  const minFootY = Math.min(ly, ry);
  const hipY = minFootY + 0.655 - crouch;

  return {
    hipPos: [centerX, hipY, centerZ],
    leftFoot: [lx, ly, lz],
    rightFoot: [rx, ry, rz],
    leftSlopeZ: lSlope,
    rightSlopeZ: rSlope,
  };
}

/**
 * Computes natural local-to-world hand position offset relative to farmer's torso/pelvis
 * for expressive gesture poses (when not locked onto a tool prop).
 */
function bodyLocalToWorld(
  hipPos: [number, number, number],
  facingYaw: number,
  lx: number,
  ly: number,
  lz: number
): [number, number, number] {
  const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), facingYaw);
  const v = new THREE.Vector3(lx, ly, lz).applyQuaternion(q);
  return [hipPos[0] + v.x, hipPos[1] + v.y, hipPos[2] + v.z];
}

// Frame 0 exact baseline constants (used BOTH at frame=0 AND as final target of Seamless Loop!)
const F0_CAM_POS: [number, number, number] = [0.22, 2.38, 6.25];
const F0_CAM_LOOK: [number, number, number] = [-0.08, 0.72, -0.85];
const F0_FARMER_X = -0.58;
const F0_FARMER_Z = -0.92;
const F0_FARMER_YAW = 0.72;

export const SceneDirector: React.FC<SceneDirectorProps> = ({ frame, fps }) => {
  const { camera } = useThree();

  const totalF = SEQS.totalFrames;
  const loopStart = SEQS.loopStart;
  const loopT = smoothstep(loopStart, totalF - 1, frame);

  // Determine whether we are in the Table Analogy zone (Seq 4) via motivated match-cut!
  const isTableSeq = frame >= SEQS.seq4Start && frame < SEQS.seq5Start;

  // =========================================================================
  // 1. CONTINUOUS WORLD PHYSICS & WEATHER MORPH PARAMETERS
  // =========================================================================
  const worldState = useMemo(() => {
    // Rainstorm swells on s1_rain, peaks through Seq 2, clears smoothly before Seq 3 carving!
    const rainIn = smoothstep(CUES.s1_rain - 12, CUES.s1_rain + 24, frame);
    const rainOut = 1 - smoothstep(SEQS.seq3Start - 28, SEQS.seq3Start + 18, frame);
    const rainFactor = isTableSeq ? 0 : rainIn * rainOut;

    // Bare slope runoff torrent & washout during Seq 1-2 storm
    const washIn = smoothstep(CUES.s1_rain + 16, CUES.s1_wash + 14, frame);
    const runoffIntensity = isTableSeq ? 0 : washIn * rainOut;
    const slopeWashout = smoothstep(CUES.s1_rain + 20, CUES.s2_slide + 20, frame);

    // Erosion stripping dark topsoil to bare rocks during Seq 2
    const erosionIn = smoothstep(CUES.s2_strip - 8, CUES.s2_bare + 22, frame);
    const erosionClear = 1 - smoothstep(SEQS.seq3Start - 10, CUES.s3_carve + 18, frame);
    const erosionStrip = isTableSeq ? 0 : erosionIn * erosionClear;

    // Live Terrain Morph: 0 (30° volcanic slope) -> 1 (4 flat carved terraces) synced to 4 IK hoe chops!
    let terraceMorph = 0;
    if (frame >= CUES.s3_carve) {
      const carveSpan = Math.max(40, CUES.s3_bund - CUES.s3_carve - 12);
      const rawU = clamp01((frame - CUES.s3_carve) / carveSpan);
      // 4 energetic stepped surges synchronized with hoe strikes + smooth easing!
      const stepIdx = Math.floor(rawU * 4);
      const subU = (rawU * 4) % 1;
      const surge = Math.min(1, (stepIdx + smoothstep(0.32, 0.72, subU)) / 4);
      terraceMorph = rawU >= 1 ? 1 : surge;
    }

    // Compacted clay pematang bund wall rising right as farmer pats clay rim!
    let bundStrength = smoothstep(CUES.s3_bund - 24, CUES.s3_bund + 24, frame);

    // Flooded terrace pools rising cleanly once terraces & pematang exist (Seq 5-7)
    let waterFill = smoothstep(SEQS.seq5Start - 18, SEQS.seq5Start + 16, frame);

    // Rice paddy growth across the 4 tiers + golden harvest maturation in Seq 7
    let riceGrowth = smoothstep(SEQS.seq5Start - 22, SEQS.seq5Start + 28, frame);
    let goldenFactor =
      0.22 * smoothstep(SEQS.seq5Start, SEQS.seq6Start, frame) +
      0.78 * smoothstep(SEQS.seq7Start - 10, CUES.s7_dam + 26, frame);

    // Seq 1 bare-slope seedlings (present at Frame 0, swept away by storm, re-emerged smoothly during Seamless Loop!)
    const slopeSeedlingsAlpha =
      frame < SEQS.seq3Start
        ? 0.35 + 0.65 * smoothstep(0, CUES.s1_plant + 48, frame)
        : 0.35 * loopT;

    // Seq 5 subsurface cutaway glowing blue infiltration + dense 3D rice root interlock web
    const infilIn = smoothstep(CUES.s5_seep - 16, CUES.s5_seep + 42, frame);
    const infilOut = 1 - smoothstep(SEQS.seq6Start - 10, SEQS.seq6Start + 24, frame);
    const infiltrationProgress = isTableSeq ? 0 : infilIn * infilOut;

    const rootIn = smoothstep(CUES.s5_roots - 14, CUES.s5_roots + 38, frame);
    const rootOut = 1 - smoothstep(SEQS.seq6Start - 8, SEQS.seq6Start + 28, frame);
    const rootWebVisibility = isTableSeq ? 0 : rootIn * rootOut;

    // Seq 6 bamboo spillway pipes seating + cascading spring water Tiers 4->3->2->1
    let pipeProgress = smoothstep(CUES.s6_pipe - 12, CUES.s6_pipe + 22, frame);
    let flowProgress = smoothstep(CUES.s6_cascade - 8, CUES.s6_valley + 20, frame);

    // Golden sunset mood during Seq 7 payoff -> seamlessly melts back to crisp morning dawn at Frame 0!
    let sunsetFactor = smoothstep(SEQS.seq7Start - 16, CUES.s7_dam + 12, frame);

    // SEAMLESS VISUAL LOOP BACK TO EXACT FRAME 0 STATE!
    if (loopT > 0.0001) {
      terraceMorph = lerp(terraceMorph, 0, loopT);
      bundStrength = lerp(bundStrength, 0, loopT);
      waterFill = lerp(waterFill, 0, loopT);
      riceGrowth = lerp(riceGrowth, 0, loopT);
      goldenFactor = lerp(goldenFactor, 0, loopT);
      pipeProgress = lerp(pipeProgress, 0, loopT);
      flowProgress = lerp(flowProgress, 0, loopT);
      sunsetFactor = lerp(sunsetFactor, 0, loopT);
    }

    // Seq 4 Workshop Table Analogy states
    const boardMode = frame >= CUES.s4_stepped - 8 ? 1 : 0;
    const flatFlowProgress = smoothstep(CUES.s4_pour_flat + 4, CUES.s4_pour_flat + 75, frame);
    const steppedFillProgress = smoothstep(CUES.s4_stepped + 6, CUES.s4_brake + 65, frame);

    return {
      rainFactor,
      runoffIntensity,
      slopeWashout: frame < SEQS.seq3Start ? slopeWashout : 0,
      erosionStrip,
      terraceMorph,
      bundStrength,
      waterFill,
      riceGrowth,
      goldenFactor,
      slopeSeedlingsAlpha,
      infiltrationProgress,
      rootWebVisibility,
      pipeProgress,
      flowProgress,
      sunsetFactor,
      boardMode,
      flatFlowProgress,
      steppedFillProgress,
    };
  }, [frame, isTableSeq, loopT]);

  // =========================================================================
  // 2. CONTINUOUS CHOREOGRAPHED CAMERA SPLINE (7 SEQUENCES + 3 MATCH-CUTS)
  // =========================================================================
  const camSpec = useMemo(() => {
    let pos: [number, number, number] = [...F0_CAM_POS];
    let look: [number, number, number] = [...F0_CAM_LOOK];
    let shake = 0;

    if (frame < SEQS.seq2Start) {
      // SEQ 1: Crisp morning establishing -> continuous subtle push-in as rain hits 30° slope
      const u = smoothstep(0, SEQS.seq2Start, frame);
      pos = lerpVec3(F0_CAM_POS, [0.82, 1.82, 5.45], u);
      look = lerpVec3(F0_CAM_LOOK, [0.35, 0.35, -0.75], u);
    } else if (frame < SEQS.seq3Start) {
      // SEQ 2: Continuous follow-dolly tracking fast muddy erosion + revealing 30° cutaway strata!
      const u = smoothstep(SEQS.seq2Start, SEQS.seq3Start, frame);
      pos = lerpVec3([0.82, 1.82, 5.45], [0.45, 1.15, 6.25], u);
      look = lerpVec3([0.35, 0.35, -0.75], [0.1, 0.25, -0.5], u);
    } else if (frame < SEQS.seq4Start) {
      // SEQ 3: Continuous crane-up framing farmer carving 4 terraces with IK hoe -> dead-center Tier 3 pematang patting!
      const u1 = smoothstep(SEQS.seq3Start, CUES.s3_bund - 18, frame);
      const u2 = smoothstep(CUES.s3_bund - 18, SEQS.seq4Start, frame);
      const midPos = lerpVec3([0.45, 1.15, 6.25], [0.42, 2.05, 5.75], u1);
      const midLook = lerpVec3([0.1, 0.25, -0.5], [0.05, 0.82, -0.85], u1);
      // Motivated water-sweep glide at final 14 frames of Seq 3 into Seq 4 table!
      const whip = smoothstep(SEQS.seq4Start - 14, SEQS.seq4Start, frame);
      pos = lerpVec3(midPos, [0.12, 2.02, 4.55], u2);
      look = lerpVec3(midLook, [-0.32, 1.12, -0.88], u2);
      pos = [pos[0] + whip * 1.4, pos[1], pos[2]];

      // Tactile micro camera impact shake synced to 4 hoe strikes during carving!
      if (frame >= CUES.s3_carve && frame < CUES.s3_bund - 16) {
        const carveSpan = Math.max(40, CUES.s3_bund - CUES.s3_carve - 12);
        const cyc = (((frame - CUES.s3_carve) / carveSpan) * 4) % 1;
        if (cyc > 0.52 && cyc < 0.68) {
          shake = Math.sin(((cyc - 0.52) / 0.16) * Math.PI) * 0.032;
        }
      }
    } else if (frame < SEQS.seq5Start) {
      // SEQ 4: Motivated Match-Cut #1 onto Village Workshop Table Analogy (Full 9:16 unobstructed view: smiling farmer face cleanly ABOVE chest-level pitcher + full ramp + basin!)
      const u1 = smoothstep(SEQS.seq4Start, CUES.s4_stepped, frame);
      const u2 = smoothstep(CUES.s4_stepped, SEQS.seq5Start, frame);
      const p1 = lerpVec3([TABLE_ZONE_X - 0.16, 2.04, 4.72], [TABLE_ZONE_X - 0.18, 1.92, 4.42], u1);
      const l1 = lerpVec3([TABLE_ZONE_X - 0.20, 1.12, 0.0], [TABLE_ZONE_X - 0.18, 1.08, 0.0], u1);
      // Smooth push into calm stepped glowing pools -> Match-Cut #2 into real flooded terrace pool!
      pos = lerpVec3(p1, [TABLE_ZONE_X - 0.16, 1.76, 3.88], u2);
      look = lerpVec3(l1, [TABLE_ZONE_X - 0.18, 1.04, 0.02], u2);
    } else if (frame < SEQS.seq6Start) {
      // SEQ 5: Motivated Match-Cut #2 on flooded terrace pool -> continuous crane-down into subsurface cutaway!
      const uDive = smoothstep(SEQS.seq5Start, CUES.s5_seep + 20, frame);
      const uRoots = smoothstep(CUES.s5_roots - 16, SEQS.seq6Start, frame);
      const pDive = lerpVec3([0.25, 1.72, 4.95], [0.05, -0.32, 4.35], uDive);
      const lDive = lerpVec3([0.05, 0.65, -0.6], [0.05, -0.45, 0.0], uDive);
      pos = lerpVec3(pDive, [-0.15, 0.22, 3.75], uRoots);
      look = lerpVec3(lDive, [-0.15, 0.18, 0.0], uRoots);
    } else if (frame < SEQS.seq7Start) {
      // SEQ 6: Continuous crane-up to Upper Tier 4 bamboo pipe -> sweeping diagonal water-follow across Tiers 4->1!
      const uUp = smoothstep(SEQS.seq6Start, CUES.s6_pipe + 10, frame);
      const uFlow = smoothstep(CUES.s6_cascade - 12, SEQS.seq7Start, frame);
      const pUp = lerpVec3([-0.15, 0.22, 3.75], [-1.75, 2.58, 3.85], uUp);
      const lUp = lerpVec3([-0.15, 0.18, 0.0], [-2.25, 1.72, -0.65], uUp);
      pos = lerpVec3(pUp, [1.55, 1.52, 5.45], uFlow);
      look = lerpVec3(lUp, [0.65, 0.22, -0.8], uFlow);
    } else {
      // SEQ 7: Majestic Golden Sunset Pull-Out revealing whole valley -> Seamless Dawn Glide right into F0_CAM_POS!
      const uWide = smoothstep(SEQS.seq7Start, loopStart - 8, frame);
      const widePos = lerpVec3([1.55, 1.52, 5.45], [0.38, 3.35, 8.85], uWide);
      const wideLook = lerpVec3([0.65, 0.22, -0.8], [-0.12, 0.88, -1.2], uWide);

      pos = lerpVec3(widePos, F0_CAM_POS, loopT);
      look = lerpVec3(wideLook, F0_CAM_LOOK, loopT);
    }

    // Subtle organic handheld living camera breath (damped cleanly to 0 at Frame 0 & Last Frame for exact loop!)
    const loopQuiet = smoothstep(0, 18, frame) * (1 - loopT);
    const breathX = Math.sin(frame * 0.045) * 0.018 * loopQuiet;
    const breathY = Math.cos(frame * 0.036) * 0.015 * loopQuiet + shake;

    return {
      pos: [pos[0] + breathX, pos[1] + breathY, pos[2]] as [number, number, number],
      look,
    };
  }, [frame, loopStart, loopT]);

  // Apply deterministic camera transform synchronously every Remotion frame
  camera.position.set(camSpec.pos[0], camSpec.pos[1], camSpec.pos[2]);
  camera.lookAt(camSpec.look[0], camSpec.look[1], camSpec.look[2]);
  camera.updateMatrixWorld();

  // =========================================================================
  // 3. PROP-DRIVES-HAND ANALYTICAL IK FARMER CHOREOGRAPHY (ZERO CLIPPING!)
  // =========================================================================
  const characterChoreo = useMemo(() => {
    const { terraceMorph, bundStrength } = worldState;

    // --- BASELINE FRAME 0 POSE (Planting rice sprout on 30° bare slope!) ---
    const computeFrame0Pose = (plantProgress: number) => {
      const stance = computeGroundedStance(
        F0_FARMER_X,
        F0_FARMER_Z,
        F0_FARMER_YAW,
        0.19,
        0,
        0,
        0.16
      );
      const leftHand = bodyLocalToWorld(stance.hipPos, F0_FARMER_YAW, -0.24, 0.24, 0.28);
      // Right hand reaches down cleanly to press sprout directly into exact 30° terrain surface!
      const dip = Math.sin(plantProgress * Math.PI * 2.5) * 0.5 + 0.5;
      const targetPlantX = F0_FARMER_X + 0.36;
      const targetPlantZ = F0_FARMER_Z + 0.22;
      const soilY = getTerrainY(targetPlantX, targetPlantZ, 0, 0);
      const rightHand: [number, number, number] = [
        targetPlantX,
        lerp(soilY + 0.08, soilY + 0.28, dip),
        targetPlantZ,
      ];
      return {
        ...stance,
        facingYaw: F0_FARMER_YAW,
        torsoLeanX: 0.34,
        torsoLeanZ: 0.04,
        torsoTwistY: 0.08,
        leftHand,
        rightHand,
        headLook: rightHand,
        activeProp: "seedling" as const,
        hoeSol: null,
        pitcherSol: null,
        pipeSol: null,
        pourAmount: 0,
      };
    };

    // SEQ 1 & SEQ 2: Planting on 30° slope -> Startled monsoon reaction -> Watching erosion washout
    if (frame < SEQS.seq3Start) {
      if (frame < CUES.s1_rain) {
        const u = clamp01(frame / Math.max(1, CUES.s1_rain));
        return computeFrame0Pose(u);
      }
      // Monsoon rain hits! Farmer straightens up, braces uphill foot on 30° slope & shields face / tracks mud!
      const reactU = smoothstep(CUES.s1_rain, CUES.s1_rain + 24, frame);
      const p0 = computeFrame0Pose(1);
      const stance = computeGroundedStance(
        F0_FARMER_X - 0.12 * reactU,
        F0_FARMER_Z - 0.05 * reactU,
        lerp(F0_FARMER_YAW, 0.88, reactU),
        0.21,
        0,
        0,
        lerp(0.16, 0.06, reactU)
      );
      const yaw = lerp(F0_FARMER_YAW, 0.88, reactU);
      const lShock = bodyLocalToWorld(stance.hipPos, yaw, -0.25, 0.38, 0.24);
      const rShock = bodyLocalToWorld(stance.hipPos, yaw, 0.26, 0.42 + Math.sin(frame * 0.16) * 0.025, 0.28);
      return {
        ...stance,
        facingYaw: yaw,
        torsoLeanX: lerp(0.34, -0.05, reactU),
        torsoLeanZ: -0.06 * reactU,
        torsoTwistY: 0.12 * reactU,
        leftHand: lerpVec3(p0.leftHand, lShock, reactU),
        rightHand: lerpVec3(p0.rightHand, rShock, reactU),
        headLook: [1.4, -0.1, -0.7] as [number, number, number],
        activeProp: reactU < 0.35 ? ("seedling" as const) : ("none" as const),
        hoeSol: null,
        pitcherSol: null,
        pipeSol: null,
        pourAmount: 0,
      };
    }

    // SEQ 3: IK Hoe Carving 4 Flat Terraces -> Compacting Clay Pematang Rim with Both Palms!
    if (frame < SEQS.seq4Start) {
      if (frame < CUES.s3_bund - 18) {
        const carveSpan = Math.max(40, CUES.s3_bund - CUES.s3_carve - 12);
        const swingPhase = Math.max(0, ((frame - CUES.s3_carve) / carveSpan) * 4);
        const stepX = lerp(-0.15, 0.72, smoothstep(CUES.s3_carve, CUES.s3_bund - 24, frame));
        const farmerZ = -0.95;
        const yaw = 1.05; // Facing slightly right-front across terrace edge
        const chopDip = Math.max(0, Math.sin((swingPhase % 1) * Math.PI * 2 - 1.2)) * 0.1;

        const stance = computeGroundedStance(
          stepX,
          farmerZ,
          yaw,
          0.21,
          terraceMorph,
          bundStrength,
          0.08 + chopDip
        );
        const hoePivot: [number, number, number] = [
          stance.hipPos[0],
          stance.hipPos[1] + 0.36,
          stance.hipPos[2],
        ];
        // PROP-DRIVES-HAND! Exact hoe shaft grips directly drive BOTH IK hands!
        const hoeSol = computeHoeGripSolution(hoePivot, yaw, swingPhase);
        return {
          ...stance,
          facingYaw: yaw,
          torsoLeanX: 0.16 + chopDip * 1.6,
          torsoLeanZ: 0.02,
          torsoTwistY: -0.08 + chopDip * 0.8,
          leftHand: hoeSol.leftGripWorld,
          rightHand: hoeSol.rightGripWorld,
          headLook: hoeSol.focusTargetWorld,
          activeProp: "hoe" as const,
          hoeSol,
          pitcherSol: null,
          pipeSol: null,
          pourAmount: 0,
        };
      } else {
        // Kneeling/crouching DEAD CENTER beside Tier 3 pematang bund (bundX = -0.22), patting wet clay rim with BOTH IK hands!
        const bundX = TERRACE_TIERS[1].bundX; // -0.22 (dead center of 9:16 portrait frame!)
        const farmerX = bundX - 0.54;
        const farmerZ = -0.88;
        const yaw = 1.28;
        const stance = computeGroundedStance(
          farmerX,
          farmerZ,
          yaw,
          0.2,
          terraceMorph,
          bundStrength,
          0.22
        );
        const bundTopY = getTerrainY(bundX, farmerZ, terraceMorph, bundStrength);
        const patWave = Math.abs(Math.sin(frame * 0.28));
        const leftHand: [number, number, number] = [
          bundX - 0.04,
          bundTopY + 0.03 + patWave * 0.09,
          farmerZ - 0.12,
        ];
        const rightHand: [number, number, number] = [
          bundX - 0.04,
          bundTopY + 0.03 + (1 - patWave) * 0.09,
          farmerZ + 0.14,
        ];
        return {
          ...stance,
          facingYaw: yaw,
          torsoLeanX: 0.36,
          torsoLeanZ: 0,
          torsoTwistY: 0,
          leftHand,
          rightHand,
          headLook: [bundX, bundTopY + 0.25, farmerZ + 0.3] as [number, number, number],
          activeProp: "none" as const,
          hoeSol: null,
          pitcherSol: null,
          pipeSol: null,
          pourAmount: 0,
        };
      }
    }

    // SEQ 4: Village Workshop Table Analogy (Farmer stands cleanly inside left frame behind-left of ramp, pouring pitcher clearly ABOVE ramp top!)
    if (frame < SEQS.seq5Start) {
      const fx = TABLE_ZONE_X - 0.88;
      const fz = -0.44;
      const yaw = 0.78;
      const stance = computeGroundedStance(fx, fz, yaw, 0.19, 0, 0, 0.0, 0.0);

      // Pour smoothly during flat-board experiment, recover slightly during swap, then pour smoothly onto stepped board!
      const pourFlat =
        smoothstep(CUES.s4_pour_flat - 6, CUES.s4_pour_flat + 12, frame) *
        (1 - smoothstep(CUES.s4_stepped - 16, CUES.s4_stepped - 6, frame));
      const pourStep =
        smoothstep(CUES.s4_stepped + 2, CUES.s4_stepped + 18, frame) *
        (1 - smoothstep(SEQS.seq5Start - 12, SEQS.seq5Start, frame));
      const pourAmount = Math.max(pourFlat, pourStep);

      // Raised cleanly +14cm ABOVE Step 1 so sparkling pouring stream & pitcher never clip wooden step!
      const spoutWorld: [number, number, number] = [
        TABLE_ZONE_X - 0.68,
        TABLE_TOP_Y + 0.65 - pourAmount * 0.03,
        -0.02,
      ];
      // PROP-DRIVES-HAND! Exact terracotta pitcher handle & belly grips drive BOTH IK hands with 0.00mm gap!
      const pitcherSol = computeClayPitcherGrip(spoutWorld, 0.06, pourAmount);
      return {
        ...stance,
        facingYaw: yaw,
        torsoLeanX: 0.1 + pourAmount * 0.08,
        torsoLeanZ: 0.02,
        torsoTwistY: 0.05,
        leftHand: pitcherSol.leftGripWorld,
        rightHand: pitcherSol.rightGripWorld,
        headLook: [TABLE_ZONE_X - 0.12, TABLE_TOP_Y + 0.52, 0.18] as [number, number, number],
        activeProp: "pitcher" as const,
        hoeSol: null,
        pitcherSol,
        pipeSol: null,
        pourAmount,
      };
    }

    // SEQ 5: Farmer stands calmly beside Tier 3 admiring flooded paddies while camera dives underground!
    if (frame < SEQS.seq6Start) {
      const fx = -1.15;
      const fz = -1.1;
      const yaw = 0.28;
      const stance = computeGroundedStance(fx, fz, yaw, 0.18, terraceMorph, bundStrength, 0.03);
      return {
        ...stance,
        facingYaw: yaw,
        torsoLeanX: 0.05,
        torsoLeanZ: 0,
        torsoTwistY: 0,
        leftHand: bodyLocalToWorld(stance.hipPos, yaw, -0.24, 0.08, 0.12),
        rightHand: bodyLocalToWorld(stance.hipPos, yaw, 0.24, 0.08, 0.12),
        headLook: [0.2, 0.5, -0.6] as [number, number, number],
        activeProp: "none" as const,
        hoeSol: null,
        pitcherSol: null,
        pipeSol: null,
        pourAmount: 0,
      };
    }

    // SEQ 6: Farmer holds & presses Split Bamboo Spillway Pipe onto Tier 4 Pematang -> watches water cascade!
    if (frame < SEQS.seq7Start) {
      const tier4 = TERRACE_TIERS[0];
      const fx = tier4.bundX - 0.58; // -3.00
      const fz = -0.68;
      const yaw = 1.48;
      const setU = smoothstep(CUES.s6_pipe - 16, CUES.s6_pipe + 22, frame);
      const releaseU = smoothstep(CUES.s6_cascade - 4, CUES.s6_cascade + 18, frame);

      const crouch = 0.24 * (1 - releaseU * 0.72);
      const stance = computeGroundedStance(fx, fz, yaw, 0.2, terraceMorph, bundStrength, crouch);

      const pipeWorld: [number, number, number] = [
        tier4.bundX + 0.02,
        lerp(tier4.waterY + 0.34, tier4.waterY + 0.02, setU),
        -0.62,
      ];
      // PROP-DRIVES-HAND! Both IK hands firmly grip and lower the hollow bamboo pipe!
      const pipeSol = computeBambooPipeHoldGrip(pipeWorld, yaw, -0.06);

      const relaxL = bodyLocalToWorld(stance.hipPos, yaw, -0.24, 0.14, 0.16);
      const relaxR = bodyLocalToWorld(stance.hipPos, yaw, 0.26, 0.24, 0.26);

      return {
        ...stance,
        facingYaw: yaw,
        torsoLeanX: lerp(0.36, 0.08, releaseU),
        torsoLeanZ: 0,
        torsoTwistY: 0,
        leftHand: lerpVec3(pipeSol.leftGripWorld, relaxL, releaseU),
        rightHand: lerpVec3(pipeSol.rightGripWorld, relaxR, releaseU),
        headLook: [tier4.bundX + 0.8, tier4.waterY - 0.4, -0.62] as [number, number, number],
        activeProp: releaseU < 0.35 ? ("pipe" as const) : ("none" as const),
        hoeSol: null,
        pitcherSol: null,
        pipeSol,
        pourAmount: 0,
      };
    }

    // SEQ 7: Proud Golden Sunset Finale on Tier 2 -> SEAMLESS LOOP BACK TO EXACT FRAME 0 STANCE!
    const sunsetStance = computeGroundedStance(
      0.72,
      -0.96,
      0.42,
      0.19,
      terraceMorph,
      bundStrength,
      0.02
    );
    const sLeft = bodyLocalToWorld(sunsetStance.hipPos, 0.42, -0.22, 0.12, 0.12);
    const sRight = bodyLocalToWorld(
      sunsetStance.hipPos,
      0.42,
      0.28,
      0.34 + Math.sin(frame * 0.06) * 0.02,
      0.24
    );

    if (loopT > 0.0001) {
      const f0 = computeFrame0Pose(0);
      const blendedX = lerp(0.72, F0_FARMER_X, loopT);
      const blendedZ = lerp(-0.96, F0_FARMER_Z, loopT);
      const blendedYaw = lerp(0.42, F0_FARMER_YAW, loopT);
      const blendedCrouch = lerp(0.02, 0.16, loopT);
      const liveStance = computeGroundedStance(
        blendedX,
        blendedZ,
        blendedYaw,
        0.19,
        terraceMorph,
        bundStrength,
        blendedCrouch
      );
      return {
        ...liveStance,
        facingYaw: blendedYaw,
        torsoLeanX: lerp(0.04, f0.torsoLeanX, loopT),
        torsoLeanZ: lerp(0, f0.torsoLeanZ, loopT),
        torsoTwistY: lerp(0, f0.torsoTwistY, loopT),
        leftHand: lerpVec3(sLeft, f0.leftHand, loopT),
        rightHand: lerpVec3(sRight, f0.rightHand, loopT),
        headLook: lerpVec3([1.8, 0.8, 0.4], f0.headLook, loopT),
        activeProp: loopT > 0.65 ? ("seedling" as const) : ("none" as const),
        hoeSol: null,
        pitcherSol: null,
        pipeSol: null,
        pourAmount: 0,
      };
    }

    return {
      ...sunsetStance,
      facingYaw: 0.42,
      torsoLeanX: 0.04,
      torsoLeanZ: 0,
      torsoTwistY: 0,
      leftHand: sLeft,
      rightHand: sRight,
      headLook: [1.8, 0.8, 0.4] as [number, number, number],
      activeProp: "none" as const,
      hoeSol: null,
      pitcherSol: null,
      pipeSol: null,
      pourAmount: 0,
    };
  }, [frame, worldState, loopT]);

  return (
    <group>
      {/* 1. Continuous Tropical Sky Dome, PMREM HDRI IBL & Frontal-3/4 Lighting */}
      <ProEnvironment
        rainFactor={worldState.rainFactor}
        sunsetFactor={worldState.sunsetFactor}
        frame={frame}
        fps={fps}
      />

      {/* 2. Main Mountain Terrace Cutaway World (X = 0) */}
      {!isTableSeq && (
        <group>
          <MountainValleyBackdrop
            rainFactor={worldState.rainFactor}
            sunsetFactor={worldState.sunsetFactor}
            frame={frame}
          />
          <TerraceHillCutaway
            terraceMorph={worldState.terraceMorph}
            bundStrength={worldState.bundStrength}
            erosionStrip={worldState.erosionStrip}
            infiltrationProgress={worldState.infiltrationProgress}
            rootWebVisibility={worldState.rootWebVisibility}
            washoutActive={worldState.runoffIntensity > 0.15}
            frame={frame}
          />
          <SlopeRunoffStream intensity={worldState.runoffIntensity} frame={frame} />
          <FloodedTerracePools
            fillLevel={worldState.waterFill}
            sunsetFactor={worldState.sunsetFactor}
            frame={frame}
          />
          <RicePaddyField
            growth={worldState.riceGrowth}
            goldenFactor={worldState.goldenFactor}
            slopeSeedlingsAlpha={worldState.slopeSeedlingsAlpha}
            slopeWashout={worldState.slopeWashout}
            frame={frame}
          />
          <BambooSpillwayCascades
            pipeProgress={worldState.pipeProgress}
            flowProgress={worldState.flowProgress}
            frame={frame}
          />
        </group>
      )}

      {/* 3. Seq 4 Outdoor Village Workshop Table Analogy World (X = TABLE_ZONE_X) */}
      {isTableSeq && (
        <TableAnalogyScene3D
          boardMode={worldState.boardMode}
          flatFlowProgress={worldState.flatFlowProgress}
          steppedFillProgress={worldState.steppedFillProgress}
          frame={frame}
        />
      )}

      {/* 4. Next-Gen 2-Bone Analytical IK Wooden Farmer Mannequin (ZERO Clipping!) */}
      <MannequinProIK
        hipPos={characterChoreo.hipPos}
        facingYaw={characterChoreo.facingYaw}
        torsoLeanX={characterChoreo.torsoLeanX}
        torsoLeanZ={characterChoreo.torsoLeanZ}
        torsoTwistY={characterChoreo.torsoTwistY}
        leftHandTarget={characterChoreo.leftHand}
        rightHandTarget={characterChoreo.rightHand}
        leftFootTarget={characterChoreo.leftFoot}
        rightFootTarget={characterChoreo.rightFoot}
        leftFootSlopeZ={characterChoreo.leftSlopeZ}
        rightFootSlopeZ={characterChoreo.rightSlopeZ}
        headLookTarget={characterChoreo.headLook}
        frame={frame}
      />

      {/* 5. Active Prop-Drives-Hand 3D Tools (rendered from EXACT same grip transform!) */}
      {characterChoreo.activeProp === "seedling" && (
        <SeedlingBundleProp3D position={characterChoreo.leftHand} />
      )}
      {characterChoreo.activeProp === "hoe" && characterChoreo.hoeSol && (
        <HoeProp3D solution={characterChoreo.hoeSol} />
      )}
      {characterChoreo.activeProp === "pitcher" && characterChoreo.pitcherSol && (
        <ClayPitcherProp3D
          solution={characterChoreo.pitcherSol}
          pourAmount={characterChoreo.pourAmount}
          streamDropY={TABLE_TOP_Y + 0.44}
        />
      )}
      {characterChoreo.activeProp === "pipe" && characterChoreo.pipeSol && (
        <HeldBambooPipeProp3D solution={characterChoreo.pipeSol} />
      )}
    </group>
  );
};
