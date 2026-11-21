import React, { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { SHOTS, ShotDefinition } from "../story";
import { BananaTree, VillageBackdrop } from "./VillageBackdrop";
import { GroundCutaway } from "./GroundCutaway";
import { CharacterAction, CharacterMannequin } from "./CharacterMannequin";
import {
  BambooPoleMesh,
  BookStackMesh,
  ConcretePoleMesh,
  InsulatorCutawayScene3D,
  PorcelainInsulatorMesh,
  PrestressedMold3D,
  TimberPoleMesh,
  TimberSoakingTank3D,
  TransformerMesh,
} from "./Poles3D";
import { CableBundle, CableCatenary, PowerFlowLines3D } from "./CableCatenary";
import { ProEnvironment, WeatherMood } from "./ProEnvironment";
import { createMacroBokehTexture } from "../pbrMaterials";

export interface SceneDirectorProps {
  frame: number;
}

/**
 * 100% ANGLE-Safe Macro 85mm Soft Bokeh Backdrop Plane (Shots #18, #20, #21)
 * Guarantees razor-sharp 3D PBR hero prop over silky optical-blur village bokeh with ZERO blank frames!
 */
const MacroBokehPlane: React.FC<{
  variant: "rain_leak" | "insulator" | "cutaway";
  position: [number, number, number];
  size: [number, number];
}> = ({ variant, position, size }) => {
  const tex = useMemo(() => createMacroBokehTexture(variant), [variant]);
  return (
    <mesh position={position} renderOrder={-5}>
      <planeGeometry args={size} />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
  );
};

/**
 * Wooden Bamboo Ladder leaning cleanly beside the pole (Shots 2, 3, 19, 36)
 */
const BambooLadder: React.FC<{
  position: [number, number, number];
  rotation?: [number, number, number];
  height?: number;
}> = ({ position, rotation = [0, 0, -0.18], height = 5.4 }) => {
  const rungs = Math.floor(height / 0.42);
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[-0.22, height / 2, 0]} castShadow>
        <cylinderGeometry args={[0.032, 0.036, height, 8]} />
        <meshStandardMaterial color="#8F6A40" roughness={0.78} />
      </mesh>
      <mesh position={[0.22, height / 2, 0]} castShadow>
        <cylinderGeometry args={[0.032, 0.036, height, 8]} />
        <meshStandardMaterial color="#8F6A40" roughness={0.78} />
      </mesh>
      {Array.from({ length: rungs }).map((_, i) => (
        <mesh key={i} position={[0, 0.35 + i * 0.42, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.48, 8]} />
          <meshStandardMaterial color="#7C5932" roughness={0.82} />
        </mesh>
      ))}
    </group>
  );
};

export const SceneDirector: React.FC<SceneDirectorProps> = ({ frame }) => {
  const { camera } = useThree();

  const currentShot: ShotDefinition = useMemo(() => {
    const found = SHOTS.find((s) => frame >= s.startFrame && frame < s.endFrame);
    return found || SHOTS[SHOTS.length - 1];
  }, [frame]);

  const shotProgress = Math.max(
    0,
    Math.min(1, (frame - currentShot.startFrame) / Math.max(1, currentShot.durationInFrames))
  );
  const smoothP = shotProgress * shotProgress * (3 - 2 * shotProgress);

  // Continuous smooth deterministic camera choreography across ~80% of shots (matching 79% moving camera in rea-video!)
  const { camPos, camLookAt, camFov } = useMemo(() => {
    const baseP = [...currentShot.camera.position] as [number, number, number];
    const baseL = [...currentShot.camera.lookAt] as [number, number, number];
    let fov = currentShot.camera.fov;

    switch (currentShot.id) {
      case 1:
        // Subtle push-in as villager drives bamboo into soil (exact Frame 0 anchor at t=0!)
        baseP[2] -= smoothP * 0.25;
        baseP[1] -= smoothP * 0.05;
        break;
      case 2:
        // Crane upward tracking villager climbing the ladder
        baseP[1] += smoothP * 0.55;
        baseL[1] += smoothP * 0.58;
        break;
      case 3:
        // Gentle pull-out reveal showing full village & pole
        baseP[2] += smoothP * 0.6;
        break;
      case 4:
        // Slight push-in as wind slams the pole top
        baseP[2] -= smoothP * 0.35;
        break;
      case 5:
        // Subtle shake & slight pan right following the collapsing bamboo pole
        baseL[0] += smoothP * 0.65;
        break;
      case 6:
        // Slow crane-up & pull-back tracking growing tall pole
        baseP[1] += smoothP * 0.45;
        baseP[2] += smoothP * 0.9;
        baseL[1] += smoothP * 0.4;
        break;
      case 7:
        // Slow push-in onto underground lever pivot arrows
        baseP[2] -= smoothP * 0.28;
        break;
      case 8:
        // Slow crane-down following the deepening dark excavated trench
        baseP[1] -= smoothP * 0.26;
        baseL[1] -= smoothP * 0.38;
        break;
      case 9:
        // Majestic pull-out showing full 12m scale
        baseP[2] = 14.8 + smoothP * 1.8;
        break;
      case 10:
        // Slow tilt down showing almost 2m depth
        baseP[1] -= smoothP * 0.18;
        baseL[1] -= smoothP * 0.22;
        break;
      case 11:
      case 12:
        // Subtle push-in during weather aging timelapse
        baseP[2] -= smoothP * 0.45;
        break;
      case 13:
        // Macro push-in on ground-line fungal rot
        baseP[2] = 2.4 - smoothP * 0.35;
        break;
      case 14:
        // Gentle underground drift on damp rotting bamboo
        baseP[2] -= smoothP * 0.25;
        break;
      case 15:
        // Slight smooth orbit/push on soaking tank
        baseP[0] += smoothP * 0.25;
        baseP[2] -= smoothP * 0.2;
        break;
      case 16:
        // Gentle vertical reveal along treated timber pole
        baseP[1] += smoothP * 0.22;
        break;
      case 17:
        // Slow push-in as rain intensifies
        baseP[2] -= smoothP * 0.4;
        break;
      case 18:
        // Slow tilt down tracking cyan glowing orbs sliding down wet pole
        baseP[1] -= smoothP * 0.22;
        baseL[1] -= smoothP * 0.32;
        break;
      case 19:
        // Slight push-in as villager seats white insulator on cross-arm
        baseP[2] -= smoothP * 0.25;
        break;
      case 20:
        // Macro push-in on glossy white 3-tier ceramic insulator
        baseP[2] = 1.98 - smoothP * 0.26;
        break;
      case 21:
        // Macro push-in on sliced orange rain cutaway insulator (all 3 umbrella sheds inside frame!)
        baseP[2] = 4.05 - smoothP * 0.3;
        break;
      case 22:
        // Slight dolly-in as cable pulls taut
        baseP[2] -= smoothP * 0.35;
        break;
      case 23:
        // Tight wire close-up gentle push during thermal shrinkage
        baseP[2] -= smoothP * 0.3;
        break;
      case 24:
        // Micro camera impulse on cable snap
        if (shotProgress > 0.36 && shotProgress < 0.55) {
          const jolt = Math.sin((shotProgress - 0.36) * 45) * Math.exp(-(shotProgress - 0.36) * 14) * 0.09;
          baseP[1] += jolt;
        }
        break;
      case 26:
        // Slight push-in as timber pole bends under heavy cable load
        baseP[2] -= smoothP * 0.45;
        break;
      case 27:
        // Smooth crane-down following rising poured concrete in mold
        baseP[2] -= smoothP * 0.24;
        break;
      case 28:
        // Gentle push-in as concrete bends & cracks open
        baseP[2] -= smoothP * 0.45;
        break;
      case 29:
      case 30:
        // Smooth diagonal pan along the prestressed concrete mold
        baseP[0] += smoothP * 0.32;
        baseL[0] += smoothP * 0.16;
        break;
      case 31:
        // Slight push-in as villager squeezes & lifts 12 books high
        baseP[2] -= smoothP * 0.16;
        baseL[1] += smoothP * 0.08;
        break;
      case 32:
        // Hero crane-up reveal of tall prestressed concrete pole
        baseP[1] += smoothP * 0.35;
        break;
      case 33:
        // Smooth crane-up tracking transformer being hoisted onto bracket shelf
        baseP[1] = 3.65 + smoothP * 1.95;
        baseL[1] = 3.85 + smoothP * 2.05;
        break;
      case 34:
        // Gentle dolly pan following 20kV -> 220V flow to village house
        baseP[0] -= smoothP * 0.25;
        break;
      case 35:
        // Slow peaceful dusk pull-back
        baseP[2] += smoothP * 0.45;
        break;
      case 36:
        // Follow villager descending ladder to ground
        baseP[1] -= smoothP * 0.32;
        baseL[1] -= smoothP * 0.28;
        break;
      case 37:
        // Peaceful sunset wide pull-back
        baseP[2] = 11.8 + smoothP * 1.2;
        break;
      case 38: {
        // 100% SEAMLESS VISUAL LOOP: Smooth glide from Shot 37 end -> exact Frame 0 position, lookAt & FOV!
        const startP: [number, number, number] = [0.0, 3.4, 13.0];
        const endP: [number, number, number] = [0.12, 1.08, 5.55];
        const startL: [number, number, number] = [0.0, 3.1, 0.0];
        const endL: [number, number, number] = [0.08, 0.56, 0.0];
        baseP[0] = startP[0] + smoothP * (endP[0] - startP[0]);
        baseP[1] = startP[1] + smoothP * (endP[1] - startP[1]);
        baseP[2] = startP[2] + smoothP * (endP[2] - startP[2]);
        baseL[0] = startL[0] + smoothP * (endL[0] - startL[0]);
        baseL[1] = startL[1] + smoothP * (endL[1] - startL[1]);
        baseL[2] = 0.0;
        fov = 46 + smoothP * (42 - 46);
        break;
      }
    }

    return {
      camPos: new THREE.Vector3(baseP[0], baseP[1], baseP[2]),
      camLookAt: new THREE.Vector3(baseL[0], baseL[1], baseL[2]),
      camFov: fov,
    };
  }, [currentShot, shotProgress, smoothP]);

  // Deterministic camera update every frame
  useFrame(() => {
    camera.position.copy(camPos);
    camera.lookAt(camLookAt);
    const pCam = camera as THREE.PerspectiveCamera;
    if (Math.abs(pCam.fov - camFov) > 0.01) {
      pCam.fov = camFov;
      pCam.updateProjectionMatrix();
    }
  });

  // Continuous Weather & Lighting Mood (Smooth Timelapse on Shots 11-12 & Smooth Sunrise Loop on Shot 38!)
  let rainFactor = 0;
  let duskFactor = 0;

  if (currentShot.id === 11 || currentShot.id === 12) {
    // Rapid Sun <-> Rain weather aging timelapse matching tiles_20_30_1.jpg!
    const tSec = (frame - 626) / 30;
    rainFactor = Math.max(0, Math.sin(tSec * Math.PI * 2.1 - 0.8));
  } else if (currentShot.id >= 17 && currentShot.id <= 18) {
    rainFactor = 1.0;
  } else if (currentShot.id === 19) {
    // Clearing sky right after rain as villager mounts insulator
    rainFactor = 0.15;
  } else if (currentShot.id === 21) {
    rainFactor = 0.9;
  }

  if (currentShot.id === 34) {
    // Subtle transition toward warm golden evening at end of Shot 34
    duskFactor = Math.max(0, (shotProgress - 0.65) / 0.35) * 0.45;
  } else if (currentShot.id >= 35 && currentShot.id <= 37) {
    duskFactor = 1.0;
  } else if (currentShot.id === 38) {
    // Smooth sunrise transition returning cleanly to bright morning Frame 0!
    duskFactor = Math.max(0, 1 - smoothP * 1.45);
  }

  const weather: WeatherMood =
    duskFactor > 0.45 ? "dusk" : rainFactor > 0.45 ? "rain" : "day";

  // Village house windows light up warm golden-yellow the moment the 220V green line reaches the house!
  const houseLightsOn =
    (currentShot.id === 34 && shotProgress > 0.62) ||
    (currentShot.id >= 35 && currentShot.id <= 37) ||
    (currentShot.id === 38 && shotProgress < 0.38);

  // Scene Act switches
  const isBambooAct =
    (currentShot.id >= 1 && currentShot.id <= 14) ||
    (currentShot.id === 38 && shotProgress >= 0.52);
  const isSoakingAct = currentShot.id === 15;
  const isTimberAct = currentShot.id >= 16 && currentShot.id <= 26;
  const isInsulatorMacro = currentShot.id === 20;
  const isInsulatorCutaway = currentShot.id === 21;
  const isDualPoleAct = currentShot.id >= 22 && currentShot.id <= 25;
  const isSingleHeavyTimber = currentShot.id === 26;
  const isMoldPour = currentShot.id === 27;
  const isMoldTension = currentShot.id === 29;
  const isMoldCompress = currentShot.id === 30;
  const isAnyMold = isMoldPour || isMoldTension || isMoldCompress;
  const isBookAnalogy = currentShot.id === 31;
  const isConcretePoleAct =
    currentShot.id === 28 ||
    (currentShot.id >= 32 && currentShot.id <= 37) ||
    (currentShot.id === 38 && shotProgress < 0.52);
  const showTransformer =
    (currentShot.id >= 33 && currentShot.id <= 37) ||
    (currentShot.id === 38 && shotProgress < 0.52);

  // Dynamic Bamboo Height, Embedment, & Full Collapse Physics
  let bambooHeight = 7.8;
  let bambooEmbed = 0.85;
  if (currentShot.id === 1) {
    // 3 synchronized physical thrusts driving bamboo from 0.16m down to 1.05m!
    const cycle = (frame % 25) / 25;
    const slamStep = Math.floor(frame / 25);
    const slamProgress =
      cycle >= 0.38 && cycle < 0.62 ? Math.pow((cycle - 0.38) / 0.24, 2) : cycle >= 0.62 ? 1 : 0;
    bambooEmbed = 0.16 + ((slamStep + slamProgress) / 3.0) * 0.92;
  } else if (currentShot.id === 6) {
    // Shot 6: Bamboo pole dynamically GROWS taller ("Soalnya makin tinggi tiangnya")!
    bambooHeight = 6.2 + smoothP * 5.0;
    bambooEmbed = 0.92;
  } else if (currentShot.id >= 9 && currentShot.id <= 14) {
    bambooHeight = 11.8;
    bambooEmbed = 1.95;
  } else if (currentShot.id === 38) {
    // Matches Frame 0 exact starting embedment (0.16m) at end of loop!
    bambooEmbed = 0.16;
  }

  let windBend = 0;
  if (currentShot.id === 4) {
    // Gusty leftward-to-rightward wind sway at top
    windBend = -0.09 - Math.sin(frame * 0.32) * 0.045;
  } else if (currentShot.id === 5) {
    // 1:1 Shot 5 (shot_005.jpg): FULL GRAVITY COLLAPSE flat onto right yard with realistic impact bounce!
    const fallT = Math.min(1, shotProgress / 0.62);
    const fallEase = fallT * fallT * fallT; // accelerating gravity fall
    const bounce =
      shotProgress > 0.62
        ? Math.abs(Math.sin((shotProgress - 0.62) * 18)) * Math.exp(-(shotProgress - 0.62) * 7) * 0.08
        : 0;
    windBend = -(fallEase * (Math.PI * 0.485) - bounce);
  } else if (currentShot.id === 6) {
    windBend = -0.04 - smoothP * 0.08 + Math.sin(frame * 0.25) * 0.04;
  } else if (currentShot.id === 7) {
    // Underground lever rocking back and forth against opposing RED force arrows
    windBend = Math.sin(frame * 0.24) * 0.11;
  }

  // Shot 8 Deepening Excavated Trench
  const holeDepth =
    currentShot.id === 8 ? 0.35 + smoothP * 1.85 : currentShot.id >= 9 ? 1.95 : 0.95;

  // Shot 22-25 Overhead Cable Physics (Pull Taut -> Shrink Cold -> VIOLENT SNAP -> Andongan Sag!)
  const isCableSnapped = currentShot.id === 24 && shotProgress > 0.36;
  const snapProgress = currentShot.id === 24 ? Math.max(0, (shotProgress - 0.36) / 0.64) : 0;
  let cableSag = 0.42;
  if (currentShot.id === 22) {
    // Pull cable tight ("tarik kenceng biar rapi")
    cableSag = 0.55 - smoothP * 0.5;
  } else if (currentShot.id === 23) {
    // Tight close-up wire shrinking taut as thermometer turns blue!
    cableSag = Math.max(0.01, 0.08 - smoothP * 0.07);
  } else if (currentShot.id === 24) {
    // Ultra-taut then SNAP!
    cableSag = 0.015;
  } else if (currentShot.id === 25) {
    // Relaxed intentional catenary sag ("namanya andongan")
    cableSag = 0.68;
  }

  // Shot 26 Single Timber Pole Heavy Multi-Cable Overload Bending!
  const timberBendAngle =
    isSingleHeavyTimber && shotProgress > 0.35
      ? -Math.pow((shotProgress - 0.35) / 0.65, 1.6) * 0.12
      : 0;
  const shot26CableCount = isSingleHeavyTimber
    ? Math.min(4, 1 + Math.floor(shotProgress * 5.2))
    : 1;

  // Shot 28 Ordinary Concrete Pole Flexing Right & Cracking Open Under Red Force Arrow!
  const concreteBendAngle =
    currentShot.id === 28 && shotProgress > 0.35
      ? -Math.pow((shotProgress - 0.35) / 0.65, 1.4) * 0.085
      : 0;
  const concreteCrackProgress =
    currentShot.id === 28 ? Math.max(0, Math.min(1, (shotProgress - 0.45) / 0.35)) : 0;

  // Shot 33 Transformer Hoist Height
  const transformerY =
    currentShot.id === 33 ? 2.0 + Math.min(1, smoothP * 1.12) * 3.65 : 5.65;

  // Villager Character Acting, Position & Rotation per Shot
  let charVisible = true;
  let charAction: CharacterAction = "idle";
  let charPos: [number, number, number] = [-1.42, 0, -0.42];
  let charRotY = 0.25;

  if (
    isInsulatorMacro ||
    isInsulatorCutaway ||
    currentShot.id === 4 ||
    currentShot.id === 6 ||
    currentShot.id === 7 ||
    currentShot.id === 10 ||
    currentShot.id === 11 ||
    currentShot.id === 12 ||
    currentShot.id === 13 ||
    currentShot.id === 14 ||
    currentShot.id === 18 ||
    currentShot.id === 23 ||
    isSingleHeavyTimber ||
    isMoldTension ||
    isMoldCompress ||
    currentShot.id === 28 ||
    currentShot.id === 32 ||
    currentShot.id === 33 ||
    currentShot.id === 34 ||
    currentShot.id === 35 ||
    currentShot.id === 37
  ) {
    charVisible = false;
  } else if (currentShot.id === 1) {
    charAction = "drive_pole";
    charPos = [0.46, 0, -0.06];
    charRotY = -1.57;
  } else if (currentShot.id === 2) {
    charAction = "climb";
    charPos = [-0.52, 1.38 + smoothP * 0.56, -0.04];
    charRotY = 1.65;
  } else if (currentShot.id === 5) {
    // Standing left throwing both hands up to caping in panic!
    charAction = "panic";
    charPos = [-1.95, 0, -0.35];
    charRotY = 0.55;
  } else if (currentShot.id === 8) {
    // Cleanly framed right beside pit digging vertically down with long spade!
    charAction = "shovel";
    charPos = [0.68, 0, -0.08];
    charRotY = -1.52;
  } else if (isSoakingAct) {
    // 1:1 Shot 15: Standing cleanly IN FRONT-LEFT of concrete soaking tank (zero leg clipping!)
    charAction = "dip_timber";
    charPos = [-0.88, 0, -0.02];
    charRotY = 2.85;
  } else if (currentShot.id === 16) {
    // 1:1 Shot 16 (shot_016.jpg): Standing on right looking up at dark treated timber pole
    charAction = "idle";
    charPos = [1.02, 0, -0.32];
    charRotY = -0.38;
  } else if (currentShot.id === 19) {
    charAction = "mount_insulator";
    charPos = [-0.54, 4.95, -0.04];
    charRotY = 1.66;
  } else if (isMoldPour) {
    // 1:1 Shot 27: Centered behind formwork tipping large silver metal bucket!
    charAction = "pour_concrete";
    charPos = [0.12, 0, -0.92];
    charRotY = 0.08;
  } else if (isBookAnalogy) {
    // 1:1 Shot 31: Positioned right behind table so hands clamp visibly on left & right book ends!
    charAction = "hold_books";
    charPos = [0, 0, 0.06];
    charRotY = 0.0;
  } else if (currentShot.id === 36) {
    charAction = "ladder_wave";
    const descendT = Math.min(1, shotProgress / 0.46);
    const smoothDesc = descendT * descendT * (3 - 2 * descendT);
    charPos = [-0.72, (1 - smoothDesc) * 1.48, -0.12];
    charRotY = shotProgress < 0.46 ? 1.35 : 0.12;
  } else if (currentShot.id === 38) {
    if (shotProgress >= 0.52) {
      // Exact Frame 0 pose & position for seamless visual loop!
      charVisible = true;
      charAction = "drive_pole";
      charPos = [0.46, 0, -0.06];
      charRotY = -1.57;
    } else {
      charVisible = false;
    }
  } else {
    charAction = "idle";
    charPos = isDualPoleAct ? [-0.85, 0, -0.58] : [-1.55, 0, -0.45];
    charRotY = 0.25;
  }

  // Book lifting progress synchronized to Shot 31 bilateral squeeze
  const bookLiftProgress = isBookAnalogy
    ? Math.max(0, Math.min(1, (shotProgress - 0.24) / 0.36))
    : 0;

  return (
    <>
      {/* 1. ProEnvironment with Sculpted Cumulus Sky + Smooth Continuous Mood Blends + Frontal-3/4 Sun */}
      <ProEnvironment
        mood={weather}
        rainFactor={rainFactor}
        duskFactor={duskFactor}
        frame={frame}
      />

      {/* 2. 1:1 Indonesian Village Backdrop (replaced on Macro Shots #18, #20, #21 by silky 85mm Bokeh Backdrop!) */}
      {currentShot.id === 18 ? (
        <>
          <MacroBokehPlane variant="rain_leak" position={[0, 5.9, -2.8]} size={[4.6, 6.8]} />
          {/* Foreground slanted rain streaks over bokeh in Shot 18 */}
          <group position={[0, 5.8, 0.65]} rotation={[0, 0, -0.14]}>
            {Array.from({ length: 28 }).map((_, i) => {
              const x = ((i * 0.41) % 2.4) - 1.2;
              const yOff = ((frame * 0.28 + i * 0.67) % 3.4) - 1.7;
              return (
                <mesh key={i} position={[x, -yOff, (i % 3) * 0.15]}>
                  <cylinderGeometry args={[0.004, 0.004, 0.42, 4]} />
                  <meshBasicMaterial color="#DCEEFF" transparent opacity={0.42} />
                </mesh>
              );
            })}
          </group>
        </>
      ) : isInsulatorMacro ? (
        <MacroBokehPlane variant="insulator" position={[0, 4.78, -2.5]} size={[3.9, 5.8]} />
      ) : isInsulatorCutaway ? (
        <>
          <MacroBokehPlane variant="cutaway" position={[0, 5.0, -2.6]} size={[4.8, 7.2]} />
          {/* Foreground slanted rain streaks over cutaway bokeh in Shot 21 */}
          <group position={[0, 5.0, 0.8]} rotation={[0, 0, -0.14]}>
            {Array.from({ length: 26 }).map((_, i) => {
              const x = ((i * 0.47) % 2.6) - 1.3;
              const yOff = ((frame * 0.3 + i * 0.71) % 3.6) - 1.8;
              return (
                <mesh key={i} position={[x, -yOff, (i % 3) * 0.15]}>
                  <cylinderGeometry args={[0.004, 0.004, 0.46, 4]} />
                  <meshBasicMaterial color="#E0F2FF" transparent opacity={0.44} />
                </mesh>
              );
            })}
          </group>
        </>
      ) : (
        <VillageBackdrop
          weather={weather}
          rainIntensity={rainFactor}
          duskFactor={duskFactor}
          houseLightsOn={houseLightsOn}
          frame={frame}
        />
      )}

      {/* Extra Foreground Framing Banana Plant in Shot 4 (bottom left fronds) & Shot 15 (sweeping upper-right leaf) */}
      {currentShot.id === 4 && (
        <BananaTree position={[-0.95, 1.85, 1.35]} scale={1.15} rotY={0.8} />
      )}
      {isSoakingAct && (
        <BananaTree position={[2.75, -0.25, 0.85]} scale={1.18} rotY={3.25} />
      )}

      {/* 3. Sunlit Sandy Yard & Painterly 1:1 Geological Cutaway */}
      {!isInsulatorMacro && !isInsulatorCutaway && (
        <GroundCutaway
          holeDepth={holeDepth}
          holeWidth={currentShot.id === 8 ? 0.58 : 0.34}
          showHole={currentShot.id === 8}
          showDirtMound={currentShot.id === 8}
          dirtMoundScale={0.4 + smoothP * 0.9}
          showDigClods={currentShot.id === 1 || currentShot.id === 8}
          showPoleBaseRing={isBambooAct || isTimberAct || isConcretePoleAct}
          hideYardProps={isAnyMold || isBookAnalogy || isSoakingAct}
          frame={frame}
        />
      )}

      {/* Shot 15 Stacked Spare Bamboo Poles directly in front of Concrete Tank (1:1 shot_015.jpg!) */}
      {isSoakingAct && (
        <group position={[0.1, 0.055, 0.05]} rotation={[0, -0.18, 0]}>
          {[
            [0, 0, 0],
            [0, 0, 0.12],
            [0, 0.1, 0.06],
          ].map(([px, py, pz], i) => (
            <mesh key={i} position={[px, py, pz]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.048, 0.052, 1.65, 10]} />
              <meshStandardMaterial color={i % 2 === 0 ? "#DDD99A" : "#CAC688"} roughness={0.68} />
            </mesh>
          ))}
        </group>
      )}

      {/* 4. 1:1 Stylized Wooden Mannequin Villager */}
      {charVisible && (
        <CharacterMannequin
          position={charPos}
          action={charAction}
          rotationY={charRotY}
          frame={currentShot.id === 38 ? 0 : frame}
          actionProgress={currentShot.id === 38 ? 0 : shotProgress}
        />
      )}

      {/* 5. BAMBOO POLE ACT (Shots 1–14, and Shot 38 seamless loop return) */}
      {isBambooAct && currentShot.id !== 8 && (
        <BambooPoleMesh
          height={bambooHeight}
          embedDepth={bambooEmbed}
          windBendAngle={windBend}
          showRotAtBase={
            currentShot.id === 13 ||
            currentShot.id === 14 ||
            (currentShot.id === 12 && shotProgress > 0.45)
          }
          showTopPeg={currentShot.id >= 2 && currentShot.id <= 12}
        />
      )}

      {/* 6. SHOT 15 TIMBER PRESERVATIVE SOAKING TANK */}
      {isSoakingAct && <TimberSoakingTank3D progress={shotProgress} />}

      {/* 7. TREATED TIMBER POLE ACT (Shots 16–26) */}
      {isTimberAct && !isInsulatorMacro && !isInsulatorCutaway && (
        <>
          {isDualPoleAct ? (
            <>
              <group position={[-2.15, 0, 0]}>
                <TimberPoleMesh
                  height={8.2}
                  embedDepth={1.8}
                  isWet={false}
                  showCrossArm
                  showInsulators
                  frame={frame}
                />
              </group>
              <group position={[2.15, 0, 0]}>
                <TimberPoleMesh
                  height={8.2}
                  embedDepth={1.8}
                  isWet={false}
                  showCrossArm
                  showInsulators
                  frame={frame}
                />
              </group>
            </>
          ) : (
            <TimberPoleMesh
              height={8.6}
              embedDepth={1.8}
              isWet={rainFactor > 0.4}
              showSpark={currentShot.id === 18}
              showCrossArm={currentShot.id >= 19}
              showInsulators={currentShot.id >= 20}
              bendAngle={timberBendAngle}
              frame={frame}
            />
          )}
        </>
      )}

      {/* Shot 19 animated dropping white porcelain insulator onto cross-arm */}
      {currentShot.id === 19 && (
        <PorcelainInsulatorMesh
          position={[0.62, 6.42 + (1 - Math.min(1, smoothP * 1.35)) * 0.52, 0]}
          scale={0.85}
        />
      )}

      {/* 8. SHOT 20 HERO MACRO PORCELAIN INSULATOR ON ANGLED WOODEN CROSS-ARM (shot_020.jpg) */}
      {isInsulatorMacro && (
        <group position={[0, 4.65, 0]}>
          <pointLight position={[0.6, 1.3, 1.5]} intensity={2.0} color="#FFFFFF" />
          {/* Perspective Angled Wooden Cross-Arm */}
          <mesh position={[0, -0.15, 0]} rotation={[0, 0, 0.16]} castShadow receiveShadow>
            <boxGeometry args={[2.9, 0.24, 0.36]} />
            <meshStandardMaterial color="#8E6844" roughness={0.68} />
          </mesh>
          {/* Glossy White 3-Tier Porcelain Insulator */}
          <PorcelainInsulatorMesh position={[0, -0.02, 0]} scale={0.9} />
          {/* Thick Glossy Black Overhead Cable Seated Directly in Top Saddle Groove! */}
          <mesh position={[0, 0.34, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.032, 0.032, 3.2, 16]} />
            <meshStandardMaterial color="#1C1A18" roughness={0.32} />
          </mesh>
        </group>
      )}

      {/* 9. SHOT 21 HERO SLICED ORANGE CUTAWAY INSULATOR IN RAIN (shot_021.jpg) */}
      {isInsulatorCutaway && <InsulatorCutawayScene3D frame={frame} />}

      {/* 10. SHOTS 27, 29, 30 PRESTRESSED CONCRETE FORMWORK MOLD */}
      {isAnyMold && (
        <PrestressedMold3D
          mode={isMoldPour ? "pour" : isMoldTension ? "tension" : "compress"}
          progress={shotProgress}
        />
      )}

      {/* 11. SHOT 31 BOOK STACK COMPRESSION ANALOGY ON WOODEN TABLE (shot_031.jpg) */}
      {isBookAnalogy && (
        <group position={[0, 0, 0.36]}>
          {/* Sleek Wooden Tabletop */}
          <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.65, 0.052, 0.48]} />
            <meshStandardMaterial color="#C89F6E" roughness={0.68} />
          </mesh>
          {/* 4 Grounded Wooden Table Legs */}
          {[
            [-0.72, 0.35, -0.18],
            [0.72, 0.35, -0.18],
            [-0.72, 0.35, 0.18],
            [0.72, 0.35, 0.18],
          ].map(([lx, ly, lz], idx) => (
            <mesh key={idx} position={[lx, ly, lz]} castShadow>
              <boxGeometry args={[0.06, 0.7, 0.06]} />
              <meshStandardMaterial color="#9E7648" roughness={0.72} />
            </mesh>
          ))}
          <BookStackMesh position={[0, 0.748, 0.0]} liftProgress={bookLiftProgress} />
        </group>
      )}

      {/* 12. SPUN PRESTRESSED CONCRETE POLE ACT (Shots 28, 32–37, and Shot 38 loop start) */}
      {isConcretePoleAct && (
        <ConcretePoleMesh
          height={9.1}
          embedDepth={1.8}
          showCracks={currentShot.id === 28}
          crackProgress={concreteCrackProgress}
          bendAngle={concreteBendAngle}
          showCrossArm={currentShot.id >= 32}
          showBracket={showTransformer}
        />
      )}

      {/* 13. DISTRIBUTION TRANSFORMER & HOIST ROPE (Shots 33–37) */}
      {showTransformer && (
        <TransformerMesh
          position={[0.42, transformerY, 0]}
          showHoistRope={currentShot.id === 33}
          hoistTopY={7.1}
        />
      )}

      {/* 14. OVERHEAD CABLES, SHOT 25 YELLOW ANDONGAN, SHOT 26 MULTI-CABLE OVERLOAD, SHOT 34 POWER FLOW */}
      {isDualPoleAct && (
        <>
          <CableCatenary
            start={[-2.15, 6.05, 0]}
            end={[2.15, 6.05, 0]}
            sag={cableSag}
            isSnapped={isCableSnapped}
            snapProgress={snapProgress}
            radius={currentShot.id === 23 ? 0.03 : 0.026}
          />

          {currentShot.id === 25 && (
            <>
              {shotProgress > 0.2 && (
                <CableCatenary
                  start={[-2.15, 6.06, 0.04]}
                  end={[2.15, 6.06, 0.04]}
                  sag={0.0}
                  color="#FFFFFF"
                  emissive="#FFFFFF"
                  radius={0.018}
                  drawFraction={Math.min(1, (shotProgress - 0.2) / 0.25)}
                />
              )}
              {shotProgress > 0.44 && (
                <CableCatenary
                  start={[-2.15, 6.05, 0.06]}
                  end={[2.15, 6.05, 0.06]}
                  sag={cableSag}
                  color="#FFD84D"
                  emissive="#FFD84D"
                  radius={0.032}
                  drawFraction={Math.min(1, (shotProgress - 0.44) / 0.36)}
                />
              )}
            </>
          )}
        </>
      )}

      {/* Shot 26 Progressive Multi-Cable Overload Lines populating one-by-one on single timber pole (tiles_60_70_1.jpg) */}
      {isSingleHeavyTimber && (
        <group rotation={[0, 0, timberBendAngle]}>
          {Array.from({ length: shot26CableCount }).map((_, idx) => {
            const yOff = 6.28 - idx * 0.14;
            const zOff = -0.24 + idx * 0.16;
            return (
              <CableCatenary
                key={idx}
                start={[0, yOff, zOff]}
                end={[5.8, yOff - 0.32, zOff]}
                sag={0.32 + idx * 0.08}
                radius={0.024}
              />
            );
          })}
          {/* Left counter-span cable */}
          <CableCatenary start={[-5.2, 5.95, 0]} end={[0, 6.28, 0]} sag={0.42} radius={0.024} />
        </group>
      )}

      {/* Single cable on bamboo / timber pole for Shots 2-4, 16-18 (detaches/falls naturally in Shot 5!) */}
      {((currentShot.id >= 2 && currentShot.id <= 4) ||
        currentShot.id === 16 ||
        currentShot.id === 17 ||
        currentShot.id === 18) && (
        <CableCatenary
          start={[-5.5, currentShot.id <= 4 ? 6.45 : 6.7, 0]}
          end={[5.5, currentShot.id <= 4 ? 6.45 : 6.7, 0]}
          sag={0.45}
          radius={0.024}
        />
      )}

      {/* Multi-conductor 3-phase lines on concrete pole (Shots 32–37) */}
      {currentShot.id >= 32 && currentShot.id <= 37 && (
        <CableBundle leftPoleX={-5.8} rightPoleX={5.8} poleTopY={7.08} sag={0.45} />
      )}

      {/* Shot 34 Animated Glowing Orange 20.000V -> Mint Green 220V Power Flow Lines! */}
      {currentShot.id === 34 && <PowerFlowLines3D progress={shotProgress} />}

      {/* 15. WOODEN LADDER PROP (Shots 2, 3, 19, 36) */}
      {(currentShot.id === 2 || currentShot.id === 3 || currentShot.id === 19 || currentShot.id === 36) && (
        <BambooLadder
          position={currentShot.id === 19 ? [-0.65, 1.2, 0.05] : [-0.82, 0, 0.05]}
          rotation={[0, 0, -0.15]}
          height={currentShot.id === 19 ? 5.6 : 5.2}
        />
      )}
    </>
  );
};
