import React, { useMemo } from "react";
import * as THREE from "three";
import { createContactShadowTexture } from "../pbrMaterials";

export type EngineerAction =
  | "observe"
  | "place_sleeper"
  | "shock"
  | "inspect_ballast"
  | "table_press"
  | "heat_sweat"
  | "satisfied_loop";

export interface EngineerRigProps {
  position?: [number, number, number];
  rotationY?: number;
  action?: EngineerAction;
  frame: number;
  actionProgress?: number; // 0..1
  scale?: number;
}

/**
 * Blender-Grade Stylized 3D Indonesian Railway Engineer Rig:
 * - Warm consistent satin skin (#DDA070), sculpted dark hair, expressive blinking eyes + catchlights,
 *   articulated eyebrows, glossy yellow safety hard-hat with brim & top rib, high-vis orange shirt
 *   with silver reflective safety bands, navy trousers, brown leather work boots, & contact AO decals!
 */
export const EngineerRig: React.FC<EngineerRigProps> = ({
  position = [0, 0, 0],
  rotationY = 0,
  action = "observe",
  frame,
  actionProgress = 0,
  scale = 1.0,
}) => {
  const contactTex = useMemo(() => createContactShadowTexture(), []);

  const skin = "#DDA070";
  const shirt = "#F28228";
  const vestStripe = "#E8EEF5";
  const pants = "#253A58";
  const helmet = "#F7C625";

  // Deterministic natural blink cycle (4 frames every 105 frames)
  const blinkMod = frame % 105;
  const eyeScaleY = blinkMod >= 98 && blinkMod <= 101 ? 0.12 : 1.25;

  // Smooth breathing & expressive acting kinematics
  const breath = Math.sin(frame * 0.085);
  let bodyY = breath * 0.012;
  let spineX = 0.03;
  let headX = 0;
  let headY = Math.sin(frame * 0.05) * 0.06;
  let browTilt = 0;

  let armLX = 0.1;
  let armLZ = 0.14;
  let elbowLX = -0.18;

  let armRX = 0.1;
  let armRZ = -0.14;
  let elbowRX = -0.18;

  let legLX = 0;
  let kneeLX = 0;
  let legRX = 0;
  let kneeRX = 0;

  if (action === "observe") {
    // Watching incoming train & pointing gently toward track ballast (Frame 0 = Loop Anchor!)
    headY = -0.18 + Math.sin(frame * 0.06) * 0.05;
    armRX = -0.55;
    armRZ = -0.22;
    elbowRX = -0.45;
  } else if (action === "place_sleeper") {
    // Bending down placing concrete sleeper directly on bare dirt
    const dip = Math.sin(Math.min(1, actionProgress * 1.4) * Math.PI);
    bodyY = -0.14 * dip;
    spineX = 0.25 + 0.35 * dip;
    headX = 0.2;
    armLX = -1.05 - 0.35 * dip;
    armRX = -1.05 - 0.35 * dip;
    elbowLX = -0.35;
    elbowRX = -0.35;
    legLX = -0.3 * dip;
    kneeLX = 0.55 * dip;
    legRX = -0.25 * dip;
    kneeRX = 0.45 * dip;
  } else if (action === "shock") {
    // Startled reaction as bare-dirt track sinks & tilts!
    const jolt = Math.sin(frame * 0.45) * 0.06;
    bodyY = 0.04 + Math.abs(jolt) * 0.3;
    spineX = -0.08;
    browTilt = 0.28;
    armLX = -1.65 + jolt;
    armLZ = 0.42;
    elbowLX = -0.75;
    armRX = -1.65 - jolt;
    armRZ = -0.42;
    elbowRX = -0.75;
  } else if (action === "inspect_ballast") {
    // Kneeling / leaning forward examining angular crushed stone interlock
    spineX = 0.34;
    headX = 0.18;
    armLX = -0.88;
    elbowLX = -0.45;
    armRX = -0.62;
    elbowRX = -0.6;
  } else if (action === "table_press") {
    // Pressing down onto round marbles (left, 0..0.48) then sharp angular stones (right, 0.5..1.0)!
    const leftPress = Math.sin(Math.max(0, Math.min(1, (actionProgress - 0.12) / 0.32)) * Math.PI);
    const rightPress = Math.sin(Math.max(0, Math.min(1, (actionProgress - 0.55) / 0.35)) * Math.PI);
    spineX = 0.16 + (leftPress + rightPress) * 0.12;
    headY = actionProgress < 0.5 ? 0.24 : -0.24;
    headX = 0.22;
    // Left arm pushes marble pile
    armLX = -0.95 - leftPress * 0.22;
    armLZ = 0.12;
    elbowLX = -0.48 + leftPress * 0.38;
    // Right arm pushes sharp stone pile
    armRX = -0.95 - rightPress * 0.22;
    armRZ = -0.12;
    elbowRX = -0.48 + rightPress * 0.38;
  } else if (action === "heat_sweat") {
    // Wiping forehead under blazing 60C sun heat
    const wipe = Math.sin(frame * 0.35) * 0.22;
    browTilt = -0.22;
    headX = -0.12;
    armRX = -2.25;
    armRZ = -0.35 + wipe;
    elbowRX = -1.15;
    armLX = 0.12;
    armLZ = 0.25;
  } else if (action === "satisfied_loop") {
    // Smoothly eases directly back into exact "observe" pose for seamless loop!
    const t = Math.min(1, Math.max(0, actionProgress));
    const smooth = t * t * (3 - 2 * t);
    headY = -0.18 * smooth;
    armRX = -1.9 * (1 - smooth) + -0.55 * smooth;
    armRZ = (-0.42 + Math.sin(frame * 0.45) * 0.25 * (1 - smooth)) * (1 - smooth) + -0.22 * smooth;
    elbowRX = -0.45;
  }

  return (
    <group position={[position[0], position[1], position[2]]} rotation={[0, rotationY, 0]} scale={[scale, scale, scale]}>
      {/* Grounded Soft Contact AO Shadow Decal under boots (ZERO floating look!) */}
      <mesh position={[0, 0.008, 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.85, 0.72]} />
        <meshBasicMaterial map={contactTex} transparent depthWrite={false} />
      </mesh>

      <group position={[0, 0.88 + bodyY, 0]}>
        {/* 1. Pelvis / Work Trousers Hip Block */}
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.165, 0.175, 0.22, 18]} />
          <meshStandardMaterial color={pants} roughness={0.68} />
        </mesh>

        {/* 2. Torso / High-Visibility Orange Shirt + Reflective Stripes */}
        <group position={[0, 0.1, 0]} rotation={[spineX, 0, 0]}>
          <mesh position={[0, 0.27, 0]} castShadow receiveShadow>
            <capsuleGeometry args={[0.168, 0.26, 10, 20]} />
            <meshStandardMaterial color={shirt} roughness={0.52} />
          </mesh>
          {/* Reflective High-Vis Horizontal Chest Band */}
          <mesh position={[0, 0.22, 0]}>
            <cylinderGeometry args={[0.173, 0.172, 0.048, 20]} />
            <meshStandardMaterial color={vestStripe} metalness={0.45} roughness={0.28} />
          </mesh>
          <mesh position={[0, 0.34, 0]}>
            <cylinderGeometry args={[0.173, 0.173, 0.042, 20]} />
            <meshStandardMaterial color={vestStripe} metalness={0.45} roughness={0.28} />
          </mesh>

          {/* Neck */}
          <mesh position={[0, 0.54, 0]} castShadow>
            <cylinderGeometry args={[0.058, 0.068, 0.14, 14]} />
            <meshStandardMaterial color={skin} roughness={0.44} />
          </mesh>

          {/* 3. Expressive Smooth Head + Blinking Eyes + Yellow Safety Hard-Hat */}
          <group position={[0, 0.69, 0]} rotation={[headX, headY, 0]}>
            <mesh castShadow receiveShadow>
              <sphereGeometry args={[0.14, 24, 24]} />
              <meshStandardMaterial color={skin} roughness={0.42} />
            </mesh>
            {/* Sculpted Dark Hair Under Helmet */}
            <mesh position={[0, 0.015, -0.028]} rotation={[-0.2, 0, 0]}>
              <sphereGeometry args={[0.142, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
              <meshStandardMaterial color="#251912" roughness={0.58} />
            </mesh>
            {/* Cute Ears & Nose */}
            <mesh position={[-0.135, 0.0, 0]}><sphereGeometry args={[0.028, 10, 10]} /><meshStandardMaterial color={skin} roughness={0.45} /></mesh>
            <mesh position={[0.135, 0.0, 0]}><sphereGeometry args={[0.028, 10, 10]} /><meshStandardMaterial color={skin} roughness={0.45} /></mesh>
            <mesh position={[0, -0.008, 0.138]}><sphereGeometry args={[0.022, 10, 10]} /><meshStandardMaterial color="#CF8E5E" roughness={0.45} /></mesh>

            {/* Blinking Glossy Eyes + Catchlights + Expressive Eyebrows */}
            {[-0.048, 0.048].map((ex, i) => (
              <group key={i} position={[ex, 0.016, 0.128]}>
                <mesh scale={[1, eyeScaleY, 0.65]}>
                  <sphereGeometry args={[0.018, 12, 12]} />
                  <meshStandardMaterial color="#14110E" roughness={0.1} />
                </mesh>
                {eyeScaleY > 0.5 && (
                  <mesh position={[0.005, 0.007, 0.011]}>
                    <sphereGeometry args={[0.0048, 8, 8]} />
                    <meshBasicMaterial color="#FFFFFF" />
                  </mesh>
                )}
                {/* Eyebrow */}
                <mesh position={[0, 0.036, 0.004]} rotation={[0, 0, i === 0 ? browTilt : -browTilt]}>
                  <boxGeometry args={[0.036, 0.009, 0.008]} />
                  <meshStandardMaterial color="#2A1C12" roughness={0.7} />
                </mesh>
              </group>
            ))}

            {/* Glossy Yellow Safety Hard-Hat (Helm Proyek) */}
            <group position={[0, 0.055, 0]} rotation={[-0.08, 0, 0]}>
              {/* Hard-hat dome */}
              <mesh castShadow receiveShadow>
                <sphereGeometry args={[0.168, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.54]} />
                <meshStandardMaterial color={helmet} roughness={0.24} metalness={0.08} />
              </mesh>
              {/* Top Structural Center Ridge */}
              <mesh position={[0, 0.145, 0]} castShadow>
                <boxGeometry args={[0.042, 0.055, 0.28]} />
                <meshStandardMaterial color="#F2BC16" roughness={0.26} metalness={0.08} />
              </mesh>
              {/* Lower Rim Ring */}
              <mesh position={[0, 0.0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.17, 0.014, 10, 28]} />
                <meshStandardMaterial color="#EAB310" roughness={0.28} />
              </mesh>
              {/* Front Sun Visor Brim */}
              <mesh position={[0, 0.002, 0.145]} rotation={[0.1, 0, 0]} castShadow>
                <cylinderGeometry args={[0.14, 0.155, 0.018, 18, 1, false, -Math.PI * 0.42, Math.PI * 0.84]} />
                <meshStandardMaterial color={helmet} roughness={0.24} />
              </mesh>
            </group>
          </group>

          {/* 4. Left Arm */}
          <group position={[-0.215, 0.43, 0]} rotation={[armLX, 0, armLZ]}>
            <mesh castShadow><sphereGeometry args={[0.062, 12, 12]} /><meshStandardMaterial color={shirt} roughness={0.52} /></mesh>
            <mesh position={[0, -0.11, 0]} castShadow><cylinderGeometry args={[0.056, 0.052, 0.2, 12]} /><meshStandardMaterial color={shirt} roughness={0.52} /></mesh>
            <group position={[0, -0.22, 0]} rotation={[elbowLX, 0, 0]}>
              <mesh position={[0, -0.15, 0]} castShadow><capsuleGeometry args={[0.044, 0.24, 8, 14]} /><meshStandardMaterial color={skin} roughness={0.42} /></mesh>
              <mesh position={[0, -0.31, 0]} castShadow><sphereGeometry args={[0.052, 12, 12]} /><meshStandardMaterial color={skin} roughness={0.42} /></mesh>
            </group>
          </group>

          {/* 5. Right Arm */}
          <group position={[0.215, 0.43, 0]} rotation={[armRX, 0, armRZ]}>
            <mesh castShadow><sphereGeometry args={[0.062, 12, 12]} /><meshStandardMaterial color={shirt} roughness={0.52} /></mesh>
            <mesh position={[0, -0.11, 0]} castShadow><cylinderGeometry args={[0.056, 0.052, 0.2, 12]} /><meshStandardMaterial color={shirt} roughness={0.52} /></mesh>
            <group position={[0, -0.22, 0]} rotation={[elbowRX, 0, 0]}>
              <mesh position={[0, -0.15, 0]} castShadow><capsuleGeometry args={[0.044, 0.24, 8, 14]} /><meshStandardMaterial color={skin} roughness={0.42} /></mesh>
              <mesh position={[0, -0.31, 0]} castShadow><sphereGeometry args={[0.052, 12, 12]} /><meshStandardMaterial color={skin} roughness={0.42} /></mesh>
            </group>
          </group>
        </group>

        {/* 6. Left Leg + Work Boot */}
        <group position={[-0.095, -0.08, 0]} rotation={[legLX, 0, 0]}>
          <mesh position={[0, -0.19, 0]} castShadow><cylinderGeometry args={[0.072, 0.062, 0.36, 14]} /><meshStandardMaterial color={pants} roughness={0.68} /></mesh>
          <group position={[0, -0.37, 0]} rotation={[kneeLX, 0, 0]}>
            <mesh position={[0, -0.2, 0]} castShadow><cylinderGeometry args={[0.06, 0.052, 0.38, 14]} /><meshStandardMaterial color={pants} roughness={0.68} /></mesh>
            {/* Rugged Brown Work Boot */}
            <mesh position={[0, -0.4, 0.05]} castShadow><boxGeometry args={[0.105, 0.085, 0.23]} /><meshStandardMaterial color="#5A3924" roughness={0.65} /></mesh>
            <mesh position={[0, -0.44, 0.05]}><boxGeometry args={[0.112, 0.025, 0.24]} /><meshStandardMaterial color="#1D1D20" roughness={0.85} /></mesh>
          </group>
        </group>

        {/* 7. Right Leg + Work Boot */}
        <group position={[0.095, -0.08, 0]} rotation={[legRX, 0, 0]}>
          <mesh position={[0, -0.19, 0]} castShadow><cylinderGeometry args={[0.072, 0.062, 0.36, 14]} /><meshStandardMaterial color={pants} roughness={0.68} /></mesh>
          <group position={[0, -0.37, 0]} rotation={[kneeRX, 0, 0]}>
            <mesh position={[0, -0.2, 0]} castShadow><cylinderGeometry args={[0.06, 0.052, 0.38, 14]} /><meshStandardMaterial color={pants} roughness={0.68} /></mesh>
            <mesh position={[0, -0.4, 0.05]} castShadow><boxGeometry args={[0.105, 0.085, 0.23]} /><meshStandardMaterial color="#5A3924" roughness={0.65} /></mesh>
            <mesh position={[0, -0.44, 0.05]}><boxGeometry args={[0.112, 0.025, 0.24]} /><meshStandardMaterial color="#1D1D20" roughness={0.85} /></mesh>
          </group>
        </group>
      </group>
    </group>
  );
};
