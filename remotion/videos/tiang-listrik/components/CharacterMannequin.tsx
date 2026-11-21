import React, { useMemo } from "react";
import * as THREE from "three";
import { createCapingTexture } from "../materials";
import { createContactShadowTexture } from "../pbrMaterials";

export type CharacterAction =
  | "idle"
  | "drive_pole"
  | "climb"
  | "panic"
  | "shovel"
  | "dip_timber"
  | "mount_insulator"
  | "pour_concrete"
  | "hold_books"
  | "ladder_wave";

export interface CharacterProps {
  position?: [number, number, number];
  rotationY?: number;
  action?: CharacterAction;
  scale?: number;
  frame?: number;
  actionProgress?: number; // 0..1 progress inside current shot
}

/**
 * 1:1 Forensic Stylized Wooden Mannequin Villager (@gimanabisaid shot_001.jpg & shot_031.jpg):
 * - Warm sunlit peach-tan birch wood (#E5AD7F) with bright well-lit friendly face (ZERO black shadow face!)
 * - Cute sculpted dark-brown parted bangs/fringe hair, small glossy black bead eyes, tiny wooden nose
 * - Clean light cream woven straw caping cone (NO top ball knob, NO dark floating rim torus!)
 * - Flat-front tapered orange cotton t-shirt torso + seamless rounded orange sleeves (ZERO gaps!)
 * - Sculpted dark navy shorts with TWO SEPARATE FITTED LEG CUFFS moving naturally with thighs (ZERO bucket skirt!)
 * - Tapered shadow-acne-free wooden limbs + flat flip-flop sandals grounded at Y = 0.00!
 */
export const CharacterMannequin: React.FC<CharacterProps> = ({
  position = [0, 0, 0],
  rotationY = 0,
  action = "idle",
  scale = 1.0,
  frame = 0,
  actionProgress = 0,
}) => {
  const capingTex = useMemo(() => createCapingTexture(), []);
  const contactTex = useMemo(() => createContactShadowTexture(), []);

  // Exact reference colors sampled from shot_001.jpg & shot_031.jpg
  const woodColor = "#E6AE80"; // Warm sunlit birch wood skin
  const woodJoint = "#D29568"; // Subtle warm joint tone
  const shirtColor = "#F48D36"; // Sunlit vibrant orange t-shirt
  const shortsColor = "#243B5C"; // Deep navy blue shorts
  const hairColor = "#241912"; // Warm dark espresso hair
  const sandalSole = "#1E1B18"; // Thin dark flip-flop sole

  // Natural blinking eyes (blinks every 96 frames for 4 frames)
  const isBlinking = frame % 96 < 4;
  const eyeScaleY = isBlinking ? 0.14 : 1.15;

  // Deterministic kinematics
  let bodyOffsetY = 0;
  let spineRotX = 0;
  let spineRotZ = 0;
  let headRotX = 0;
  let headRotY = 0;

  let armLRotX = 0.06;
  let armLRotY = 0.0;
  let armLRotZ = 0.12;
  let elbowLRotX = -0.14;
  let elbowLRotZ = 0.0;

  let armRRotX = 0.06;
  let armRRotY = 0.0;
  let armRRotZ = -0.12;
  let elbowRRotX = -0.14;
  let elbowRRotZ = 0.0;

  let legLRotX = 0;
  let kneeLRotX = 0;
  let legRRotX = 0;
  let kneeRRotX = 0;

  // Shovel plunge depth (Shot 8)
  let shovelPlungeY = 0;

  if (action === "drive_pole") {
    // 1:1 Shot 1 (shot_001.jpg): Gripping bamboo pole directly with both hands and driving it down in 3 strong thrusts!
    const cycle = (frame % 25) / 25;
    if (cycle < 0.38) {
      // Anticipation: rise & grip higher on bamboo
      const t = cycle / 0.38;
      const ease = 0.5 - 0.5 * Math.cos(t * Math.PI);
      bodyOffsetY = ease * 0.04;
      spineRotX = 0.05 - ease * 0.08;
      headRotX = -0.06;
      legLRotX = -0.18 + ease * 0.06;
      kneeLRotX = 0.32 - ease * 0.12;
      legRRotX = 0.1 - ease * 0.05;
      kneeRRotX = 0.2 - ease * 0.08;

      armLRotX = -1.18 - ease * 0.25;
      armLRotY = 0.1;
      armLRotZ = 0.08;
      elbowLRotX = -0.45 - ease * 0.18;

      armRRotX = -0.95 - ease * 0.25;
      armRRotY = -0.1;
      armRRotZ = -0.08;
      elbowRRotX = -0.58 - ease * 0.16;
    } else if (cycle < 0.62) {
      // Hard downward thrust driving pole into soil
      const t = (cycle - 0.38) / 0.24;
      const ease = t * t;
      bodyOffsetY = 0.04 - ease * 0.17;
      spineRotX = -0.03 + ease * 0.36;
      headRotX = -0.06 + ease * 0.22;

      legLRotX = -0.12 - ease * 0.34;
      kneeLRotX = 0.2 + ease * 0.64;
      legRRotX = 0.05 + ease * 0.14;
      kneeRRotX = 0.12 + ease * 0.48;

      armLRotX = -1.43 + ease * 0.56;
      armLRotY = 0.1;
      armLRotZ = 0.08;
      elbowLRotX = -0.63 + ease * 0.34;

      armRRotX = -1.2 + ease * 0.56;
      armRRotY = -0.1;
      armRRotZ = -0.08;
      elbowRRotX = -0.74 + ease * 0.34;
    } else {
      // Elastic shock absorption & recovery
      const t = (cycle - 0.62) / 0.38;
      const shock = Math.sin(t * Math.PI * 3) * Math.exp(-t * 4.5) * 0.018;
      bodyOffsetY = -0.13 + shock + t * 0.11;
      spineRotX = 0.33 - t * 0.24;
      headRotX = 0.16 - t * 0.18;

      legLRotX = -0.46 + t * 0.26;
      kneeLRotX = 0.84 - t * 0.48;
      legRRotX = 0.19 - t * 0.09;
      kneeRRotX = 0.6 - t * 0.38;

      armLRotX = -0.87 - t * 0.28;
      armLRotY = 0.1;
      armLRotZ = 0.08;
      elbowLRotX = -0.29 - t * 0.15;

      armRRotX = -0.64 - t * 0.28;
      armRRotY = -0.1;
      armRRotZ = -0.08;
      elbowRRotX = -0.4 - t * 0.16;
    }
  } else if (action === "panic") {
    // 1:1 Shot 5 (shot_005.jpg): Both hands thrown up to head/caping in startled panic as bamboo falls!
    const react = Math.min(1, actionProgress * 2.4);
    const ease = 1 - Math.pow(1 - react, 3);
    const jiggle = Math.sin(frame * 0.6) * 0.03 * ease;
    bodyOffsetY = Math.sin(react * Math.PI) * 0.05;
    spineRotX = -0.08 * ease;
    headRotY = 0.28 * ease;

    armLRotX = -0.35 - ease * 1.95;
    armLRotZ = 0.15 + ease * 0.65 + jiggle;
    elbowLRotX = -0.2 - ease * 1.35;
    elbowLRotZ = -0.35 * ease;

    armRRotX = -0.35 - ease * 1.95;
    armRRotZ = -0.15 - ease * 0.65 - jiggle;
    elbowRRotX = -0.2 - ease * 1.35;
    elbowRRotZ = 0.35 * ease;
  } else if (action === "hold_books") {
    // 1:1 Shot 31 (shot_031.jpg):
    // Arms angle gracefully down & out from shoulders to left/right ends of the 12 books,
    // clamping inward and lifting the entire book stack cleanly ~0.34m off the table!
    const liftT = Math.max(0, Math.min(1, (actionProgress - 0.24) / 0.36));
    const smoothLift = liftT * liftT * (3 - 2 * liftT);
    const squeeze = Math.min(1, actionProgress / 0.24);
    const effortTremor = Math.sin(frame * 1.4) * 0.002 * smoothLift;

    bodyOffsetY = smoothLift * 0.015 + effortTremor;
    spineRotX = 0.02 - smoothLift * 0.03;
    headRotX = 0.04 - smoothLift * 0.08;

    // Left arm reaches outward & forward at mid-book height so hand clamps flush against left red book spine!
    armLRotX = -0.34 - smoothLift * 0.42;
    armLRotY = 0.08;
    armLRotZ = -0.58 + squeeze * 0.04;
    elbowLRotX = -0.52 - smoothLift * 0.32;
    elbowLRotZ = 0.62;

    // Right arm reaches outward & forward at mid-book height so hand clamps flush against right purple book spine!
    armRRotX = -0.34 - smoothLift * 0.42;
    armRRotY = -0.08;
    armRRotZ = 0.58 - squeeze * 0.04;
    elbowRRotX = -0.52 - smoothLift * 0.32;
    elbowRRotZ = -0.62;

    legLRotX = -0.02;
    kneeLRotX = 0.04;
    legRRotX = 0.02;
    kneeRRotX = 0.04;
  } else if (action === "climb") {
    const step = Math.sin(frame * 0.32);
    spineRotX = 0.15;
    headRotX = -0.32;
    armLRotX = -2.15 + step * 0.36;
    armLRotZ = 0.16;
    elbowLRotX = -0.42;
    armRRotX = -2.05 - step * 0.36;
    armRRotZ = -0.16;
    elbowRRotX = -0.42;
    legLRotX = -0.75 - step * 0.34;
    kneeLRotX = 1.05 + step * 0.24;
    legRRotX = -0.25 + step * 0.34;
    kneeRRotX = 0.52 - step * 0.24;
  } else if (action === "shovel") {
    // 1:1 Shot 8 (shot_008.jpg): Energetic vertical digging into the cutaway pit!
    const cyc = (frame % 18) / 18;
    const thrust = Math.sin(cyc * Math.PI * 2);
    shovelPlungeY = -actionProgress * 0.65 - Math.max(0, thrust) * 0.24;
    bodyOffsetY = -0.06 - Math.max(0, thrust) * 0.04;
    spineRotX = 0.36 + thrust * 0.14;
    headRotX = 0.22;
    armLRotX = -0.88 - thrust * 0.28;
    armLRotZ = 0.16;
    elbowLRotX = -0.32;
    armRRotX = -1.12 - thrust * 0.26;
    armRRotZ = -0.14;
    elbowRRotX = -0.28;
    legLRotX = -0.32;
    kneeLRotX = 0.56;
    legRRotX = 0.14;
    kneeRRotX = 0.26;
  } else if (action === "dip_timber") {
    const dip = Math.min(1, actionProgress * 1.45);
    const ease = dip * dip * (3 - 2 * dip);
    bodyOffsetY = -ease * 0.08;
    spineRotX = 0.22 + ease * 0.34;
    headRotX = 0.2;
    armLRotX = -1.05 + ease * 0.42;
    armLRotZ = 0.22;
    armRRotX = -1.05 + ease * 0.42;
    armRRotZ = -0.22;
    elbowLRotX = -0.22;
    elbowRRotX = -0.22;
    legLRotX = -0.25 - ease * 0.15;
    kneeLRotX = 0.42 + ease * 0.24;
    legRRotX = -0.05;
    kneeRRotX = 0.22 + ease * 0.16;
  } else if (action === "mount_insulator") {
    const reach = Math.min(1, actionProgress * 1.35);
    const ease = 1 - Math.pow(1 - reach, 3);
    spineRotX = 0.14;
    headRotX = -0.26;
    armLRotX = -1.72;
    armLRotZ = 0.16;
    elbowLRotX = -0.52;
    armRRotX = -1.75 - ease * 0.62;
    armRRotZ = -0.32 - ease * 0.28;
    elbowRRotX = -0.25 + ease * 0.12;
    legLRotX = -0.64;
    kneeLRotX = 0.92;
    legRRotX = -0.22;
    kneeRRotX = 0.46;
  } else if (action === "pour_concrete") {
    // 1:1 Shot 27 (shot_027.jpg): Leaning forward over formwork tipping silver metal bucket!
    const tilt = Math.min(1, actionProgress * 1.5);
    spineRotX = 0.28 + tilt * 0.14;
    headRotX = 0.34;
    armLRotX = -1.05 - tilt * 0.15;
    armLRotZ = 0.22;
    elbowLRotX = -0.45;
    armRRotX = -0.95 - tilt * 0.18;
    armRRotZ = -0.2;
    elbowRRotX = -0.55;
    legLRotX = -0.16;
    kneeLRotX = 0.28;
    legRRotX = -0.12;
    kneeRRotX = 0.24;
  } else if (action === "ladder_wave") {
    // 1:1 Shot 36 (shot_036.jpg): Climbs cleanly down ladder then turns to camera & waves!
    const isWaving = actionProgress > 0.48;
    if (!isWaving) {
      const step = Math.sin(frame * 0.38);
      spineRotX = 0.12;
      armLRotX = -1.85 + step * 0.28;
      armLRotZ = 0.15;
      armRRotX = -1.85 - step * 0.28;
      armRRotZ = -0.15;
      legLRotX = -0.48 + step * 0.32;
      kneeLRotX = 0.78;
      legRRotX = -0.28 - step * 0.32;
      kneeRRotX = 0.56;
    } else {
      const wave = Math.sin(frame * 0.55) * 0.32;
      armLRotX = -0.45;
      armLRotZ = 0.22;
      elbowLRotX = -0.95 + wave * 0.5;
      armRRotX = 0.08;
      armRRotZ = -0.14;
      elbowRRotX = -0.15;
    }
  } else {
    // Gentle organic idle breathing
    const t = frame * 0.08;
    bodyOffsetY = Math.sin(t) * 0.006;
    spineRotX = Math.sin(t) * 0.012;
    headRotY = Math.sin(t * 0.55) * 0.05;
  }

  return (
    <group
      position={[position[0], position[1] + bodyOffsetY, position[2]]}
      rotation={[0, rotationY, 0]}
      scale={[scale, scale, scale]}
    >
      {/* Soft Contact AO Shadow Decal on Ground */}
      <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.72, 0.72]} />
        <meshBasicMaterial map={contactTex} transparent opacity={0.62} depthWrite={false} />
      </mesh>

      {/* 1. PELVIS & FITTED NAVY SHORTS HIP BLOCK (Y = 0.76 -> feet sit flush at Y = 0.00!) */}
      <group position={[0, 0.76, 0]}>
        {/* Sculpted Slightly-Flattened Hip/Waist Block of Shorts (NOT a wide bucket skirt!) */}
        <mesh position={[0, 0.01, 0]} scale={[1.0, 1.0, 0.78]} castShadow receiveShadow>
          <cylinderGeometry args={[0.148, 0.154, 0.17, 18]} />
          <meshStandardMaterial color={shortsColor} roughness={0.68} />
        </mesh>
        {/* Rounded Seat/Pelvis Cap */}
        <mesh position={[0, -0.065, 0]} scale={[1.0, 0.55, 0.78]} receiveShadow>
          <sphereGeometry args={[0.15, 16, 12]} />
          <meshStandardMaterial color={shortsColor} roughness={0.68} />
        </mesh>

        {/* 2. UPPER TORSO (Tapered Flat-Front Orange Cotton T-Shirt matching shot_031.jpg!) */}
        <group position={[0, 0.1, 0]} rotation={[spineRotX, 0, spineRotZ]}>
          {/* Tapered Chest Body (wider shoulders, slim waist, clean flat-front wooden-mannequin profile) */}
          <mesh position={[0, 0.25, 0]} scale={[1.0, 1.0, 0.68]} castShadow receiveShadow>
            <cylinderGeometry args={[0.168, 0.145, 0.44, 20]} />
            <meshStandardMaterial color={shirtColor} roughness={0.62} />
          </mesh>
          {/* Rounded Upper Shoulder Dome */}
          <mesh position={[0, 0.46, 0]} scale={[1.0, 0.42, 0.68]} castShadow receiveShadow>
            <sphereGeometry args={[0.168, 20, 14]} />
            <meshStandardMaterial color={shirtColor} roughness={0.62} />
          </mesh>
          {/* Rounded Lower Shirt Hem */}
          <mesh position={[0, 0.035, 0]} scale={[1.0, 0.35, 0.68]} receiveShadow>
            <sphereGeometry args={[0.146, 16, 12]} />
            <meshStandardMaterial color={shirtColor} roughness={0.62} />
          </mesh>

          {/* Short T-Shirt Sleeve Hems */}
          {[-0.22, 0.22].map((sx, i) => (
            <mesh
              key={`sleeve-${i}`}
              position={[sx, 0.32, 0]}
              rotation={[0, 0, i === 0 ? 0.35 : -0.35]}
              castShadow
            >
              <cylinderGeometry args={[0.062, 0.065, 0.1, 14]} />
              <meshStandardMaterial color={shirtColor} roughness={0.55} />
            </mesh>
          ))}

          {/* Wooden Neck Column */}
          <mesh position={[0, 0.54, 0]}>
            <cylinderGeometry args={[0.044, 0.052, 0.12, 14]} />
            <meshStandardMaterial color={woodColor} roughness={0.44} />
          </mesh>

          {/* 3. FRIENDLY BRIGHTLY-LIT WOODEN MANNEQUIN HEAD + CAPING */}
          <group position={[0, 0.69, 0]} rotation={[headRotX, headRotY, 0]}>
            {/* Smooth Warm Sunlit Birch Oval Head */}
            <mesh scale={[0.96, 1.04, 0.96]} castShadow receiveShadow>
              <sphereGeometry args={[0.132, 24, 24]} />
              <meshStandardMaterial color={woodColor} roughness={0.42} />
            </mesh>

            {/* Sculpted Dark Hair Cap on Back/Crown */}
            <mesh position={[0, 0.022, -0.022]} rotation={[-0.28, 0, 0]} scale={[0.98, 1.02, 0.98]}>
              <sphereGeometry args={[0.134, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
              <meshStandardMaterial color={hairColor} roughness={0.72} />
            </mesh>
            {/* Cute Parted Bangs / Fringe Tufts on Forehead (1:1 match to shot_031.jpg!) */}
            {[-0.072, -0.032, 0.028, 0.07].map((fx, i) => (
              <mesh
                key={i}
                position={[fx, 0.078 - Math.abs(fx) * 0.25, 0.095 - Math.abs(fx) * 0.25]}
                rotation={[0.25, 0, fx * -2.2]}
              >
                <coneGeometry args={[0.022, 0.058, 8]} />
                <meshStandardMaterial color={hairColor} roughness={0.75} />
              </mesh>
            ))}

            {/* Small Cute Wooden Button Nose */}
            <mesh position={[0, -0.008, 0.126]}>
              <sphereGeometry args={[0.017, 10, 10]} />
              <meshStandardMaterial color={woodJoint} roughness={0.44} />
            </mesh>

            {/* Cute Glossy Black Bead Eyes with Natural Blink & Tiny Catchlight (NO angry eyebrows!) */}
            {[-0.044, 0.044].map((ex, i) => (
              <group key={i} position={[ex, 0.014, 0.118]}>
                <mesh scale={[1, eyeScaleY, 0.7]}>
                  <sphereGeometry args={[0.014, 12, 12]} />
                  <meshStandardMaterial color="#151210" roughness={0.14} />
                </mesh>
                {!isBlinking && (
                  <mesh position={[0.004, 0.005, 0.01]}>
                    <sphereGeometry args={[0.0038, 6, 6]} />
                    <meshBasicMaterial color="#FFFFFF" />
                  </mesh>
                )}
              </group>
            ))}

            {/* Clean Light-Cream Conical Woven Straw Caping Hat (NO dark rim torus, NO top ball, castShadow=false so face stays bright!) */}
            <group position={[0, 0.138, -0.008]} rotation={[-0.06, 0, 0]}>
              <mesh receiveShadow>
                <coneGeometry args={[0.37, 0.19, 32, 1, true]} />
                <meshStandardMaterial
                  map={capingTex}
                  color="#F7EFD6"
                  roughness={0.78}
                  side={THREE.DoubleSide}
                />
              </mesh>
            </group>
          </group>

          {/* 4. LEFT ARM (Seamless Rounded Orange Shoulder & Sleeve -> Tapered Birch Wood Arm) */}
          <group position={[-0.195, 0.41, 0]}>
            <group rotation={[armLRotX, armLRotY, armLRotZ]}>
              {/* Seamless Rounded Orange Shoulder Cap */}
              <mesh castShadow receiveShadow>
                <sphereGeometry args={[0.058, 16, 16]} />
                <meshStandardMaterial color={shirtColor} roughness={0.62} />
              </mesh>
              {/* Short Tapered Orange Sleeve attached seamlessly */}
              <mesh position={[0, -0.06, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.056, 0.052, 0.12, 14]} />
                <meshStandardMaterial color={shirtColor} roughness={0.62} />
              </mesh>
              {/* Tapered Wooden Upper Arm */}
              <mesh position={[0, -0.175, 0]} castShadow>
                <cylinderGeometry args={[0.04, 0.036, 0.16, 14]} />
                <meshStandardMaterial color={woodColor} roughness={0.44} />
              </mesh>

              {/* Smooth Elbow Joint (castShadow=false prevents shadow acne!) */}
              <group position={[0, -0.255, 0]}>
                <mesh>
                  <sphereGeometry args={[0.037, 14, 14]} />
                  <meshStandardMaterial color={woodJoint} roughness={0.45} />
                </mesh>

                {/* Tapered Wooden Forearm */}
                <group rotation={[elbowLRotX, 0, elbowLRotZ]}>
                  <mesh position={[0, -0.115, 0]} castShadow>
                    <cylinderGeometry args={[0.036, 0.03, 0.22, 14]} />
                    <meshStandardMaterial color={woodColor} roughness={0.44} />
                  </mesh>

                  {/* Wrist & Sculpted Rounded Wooden Hand */}
                  <group position={[0, -0.23, 0]}>
                    <mesh>
                      <sphereGeometry args={[0.028, 12, 12]} />
                      <meshStandardMaterial color={woodJoint} roughness={0.44} />
                    </mesh>
                    <mesh position={[0, -0.035, 0.012]} scale={[0.85, 1.15, 0.65]} castShadow>
                      <sphereGeometry args={[0.038, 12, 12]} />
                      <meshStandardMaterial color={woodColor} roughness={0.44} />
                    </mesh>
                  </group>
                </group>
              </group>
            </group>
          </group>

          {/* 5. RIGHT ARM (Seamless Rounded Orange Shoulder & Sleeve -> Tapered Birch Wood Arm) */}
          <group position={[0.195, 0.41, 0]}>
            <group rotation={[armRRotX, armRRotY, armRRotZ]}>
              <mesh castShadow receiveShadow>
                <sphereGeometry args={[0.058, 16, 16]} />
                <meshStandardMaterial color={shirtColor} roughness={0.62} />
              </mesh>
              <mesh position={[0, -0.06, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.056, 0.052, 0.12, 14]} />
                <meshStandardMaterial color={shirtColor} roughness={0.62} />
              </mesh>
              <mesh position={[0, -0.175, 0]} castShadow>
                <cylinderGeometry args={[0.04, 0.036, 0.16, 14]} />
                <meshStandardMaterial color={woodColor} roughness={0.44} />
              </mesh>

              {/* Smooth Elbow Joint */}
              <group position={[0, -0.255, 0]}>
                <mesh>
                  <sphereGeometry args={[0.037, 14, 14]} />
                  <meshStandardMaterial color={woodJoint} roughness={0.45} />
                </mesh>

                {/* Tapered Wooden Forearm */}
                <group rotation={[elbowRRotX, 0, elbowRRotZ]}>
                  <mesh position={[0, -0.115, 0]} castShadow>
                    <cylinderGeometry args={[0.036, 0.03, 0.22, 14]} />
                    <meshStandardMaterial color={woodColor} roughness={0.44} />
                  </mesh>

                  {/* Wrist & Sculpted Rounded Wooden Hand */}
                  <group position={[0, -0.23, 0]}>
                    <mesh>
                      <sphereGeometry args={[0.028, 12, 12]} />
                      <meshStandardMaterial color={woodJoint} roughness={0.44} />
                    </mesh>
                    <mesh position={[0, -0.035, 0.012]} scale={[0.85, 1.15, 0.65]} castShadow>
                      <sphereGeometry args={[0.038, 12, 12]} />
                      <meshStandardMaterial color={woodColor} roughness={0.44} />
                    </mesh>
                  </group>
                </group>
              </group>
            </group>
          </group>
        </group>

        {/* 6. LEFT LEG (Fitted Navy Shorts Leg Cuff + Clean Tapered Wooden Thigh/Shin + Sandal) */}
        <group position={[-0.082, -0.04, 0]}>
          <group rotation={[legLRotX, 0, 0.018]}>
            {/* Fitted Navy Shorts Left Leg Cuff (moves naturally with thigh!) */}
            <mesh position={[0, -0.095, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.074, 0.068, 0.2, 16]} />
              <meshStandardMaterial color={shortsColor} roughness={0.68} />
            </mesh>
            {/* Tapered Wooden Lower Thigh */}
            <mesh position={[0, -0.21, 0]} castShadow>
              <cylinderGeometry args={[0.048, 0.042, 0.2, 14]} />
              <meshStandardMaterial color={woodColor} roughness={0.44} />
            </mesh>

            {/* Smooth Knee Joint (castShadow=false -> ZERO jagged shadow acne!) */}
            <group position={[0, -0.315, 0]}>
              <mesh>
                <sphereGeometry args={[0.041, 14, 14]} />
                <meshStandardMaterial color={woodJoint} roughness={0.45} />
              </mesh>

              {/* Tapered Wooden Shin */}
              <group rotation={[kneeLRotX, 0, 0]}>
                <mesh position={[0, -0.165, 0]} castShadow>
                  <cylinderGeometry args={[0.041, 0.034, 0.33, 14]} />
                  <meshStandardMaterial color={woodColor} roughness={0.44} />
                </mesh>

                {/* Ankle & Flip-Flop Sandal resting flush on Y = 0.00 */}
                <group position={[0, -0.335, 0]}>
                  <mesh>
                    <sphereGeometry args={[0.03, 10, 10]} />
                    <meshStandardMaterial color={woodJoint} roughness={0.45} />
                  </mesh>
                  <mesh position={[0, -0.026, 0.052]} castShadow>
                    <boxGeometry args={[0.072, 0.032, 0.155]} />
                    <meshStandardMaterial color={woodColor} roughness={0.44} />
                  </mesh>
                  {/* Flip-flop dark strap */}
                  <mesh position={[0, -0.008, 0.072]}>
                    <boxGeometry args={[0.074, 0.009, 0.018]} />
                    <meshStandardMaterial color={sandalSole} roughness={0.85} />
                  </mesh>
                  {/* Flip-flop thin flat dark rubber sole */}
                  <mesh position={[0, -0.048, 0.055]} castShadow>
                    <boxGeometry args={[0.078, 0.014, 0.175]} />
                    <meshStandardMaterial color={sandalSole} roughness={0.88} />
                  </mesh>
                </group>
              </group>
            </group>
          </group>
        </group>

        {/* 7. RIGHT LEG (Fitted Navy Shorts Leg Cuff + Clean Tapered Wooden Thigh/Shin + Sandal) */}
        <group position={[0.082, -0.04, 0]}>
          <group rotation={[legRRotX, 0, -0.018]}>
            <mesh position={[0, -0.095, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.074, 0.068, 0.2, 16]} />
              <meshStandardMaterial color={shortsColor} roughness={0.68} />
            </mesh>
            <mesh position={[0, -0.21, 0]} castShadow>
              <cylinderGeometry args={[0.048, 0.042, 0.2, 14]} />
              <meshStandardMaterial color={woodColor} roughness={0.44} />
            </mesh>

            {/* Smooth Knee Joint */}
            <group position={[0, -0.315, 0]}>
              <mesh>
                <sphereGeometry args={[0.041, 14, 14]} />
                <meshStandardMaterial color={woodJoint} roughness={0.45} />
              </mesh>

              {/* Tapered Wooden Shin */}
              <group rotation={[kneeRRotX, 0, 0]}>
                <mesh position={[0, -0.165, 0]} castShadow>
                  <cylinderGeometry args={[0.041, 0.034, 0.33, 14]} />
                  <meshStandardMaterial color={woodColor} roughness={0.44} />
                </mesh>

                {/* Ankle & Flip-Flop Sandal resting flush on Y = 0.00 */}
                <group position={[0, -0.335, 0]}>
                  <mesh>
                    <sphereGeometry args={[0.03, 10, 10]} />
                    <meshStandardMaterial color={woodJoint} roughness={0.45} />
                  </mesh>
                  <mesh position={[0, -0.026, 0.052]} castShadow>
                    <boxGeometry args={[0.072, 0.032, 0.155]} />
                    <meshStandardMaterial color={woodColor} roughness={0.44} />
                  </mesh>
                  <mesh position={[0, -0.008, 0.072]}>
                    <boxGeometry args={[0.074, 0.009, 0.018]} />
                    <meshStandardMaterial color={sandalSole} roughness={0.85} />
                  </mesh>
                  <mesh position={[0, -0.048, 0.055]} castShadow>
                    <boxGeometry args={[0.078, 0.014, 0.175]} />
                    <meshStandardMaterial color={sandalSole} roughness={0.88} />
                  </mesh>
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>

      {/* HELD TOOL PROP: Shot 8 Long Wooden Spade plunging deep inside cutaway trench (shot_008.jpg) */}
      {action === "shovel" && (
        <group position={[0.06, 0.25 + shovelPlungeY, 0.42]} rotation={[0.26, 0.0, 0.06]}>
          {/* Long wooden shovel shaft */}
          <mesh position={[0, 0.65, 0]} castShadow>
            <cylinderGeometry args={[0.02, 0.022, 1.85, 8]} />
            <meshStandardMaterial color="#B58A58" roughness={0.78} />
          </mesh>
          {/* Steel shovel blade visibly digging inside dark cutaway pit */}
          <mesh position={[0, -0.34, 0]} castShadow>
            <boxGeometry args={[0.2, 0.28, 0.016]} />
            <meshStandardMaterial color="#8A929C" metalness={0.75} roughness={0.35} />
          </mesh>
        </group>
      )}

      {/* HELD TOOL PROP: Shot 27 Large Silver Metal Concrete Bucket pouring vertical stream (shot_027.jpg) */}
      {action === "pour_concrete" && (
        <group position={[-0.1, 0.92, 0.34]}>
          {/* Tilted large silver galvanized bucket */}
          <group rotation={[0.88, 0.15, -0.62]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.21, 0.15, 0.38, 18, 1, true]} />
              <meshStandardMaterial
                color="#A6AEB8"
                metalness={0.62}
                roughness={0.32}
                side={THREE.DoubleSide}
              />
            </mesh>
            <mesh position={[0, -0.18, 0]}>
              <cylinderGeometry args={[0.15, 0.15, 0.02, 18]} />
              <meshStandardMaterial color="#7C848E" metalness={0.65} roughness={0.35} />
            </mesh>
          </group>
          {/* Smooth Vertical Wet Gray Concrete Stream pouring straight down into mold! */}
          <mesh position={[0.16, -0.34, 0.24]}>
            <cylinderGeometry args={[0.038, 0.032, 0.72, 12]} />
            <meshStandardMaterial color="#BEC4CC" roughness={0.55} />
          </mesh>
        </group>
      )}
    </group>
  );
};
