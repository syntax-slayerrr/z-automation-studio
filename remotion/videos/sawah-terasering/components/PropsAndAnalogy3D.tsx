import React, { useMemo } from "react";
import * as THREE from "three";
import { createWoodBoardTexture } from "../pbrMaterials";

export interface PropGripSolution {
  rootPos: [number, number, number];
  rootQuat: THREE.Quaternion;
  leftGripWorld: [number, number, number];
  rightGripWorld: [number, number, number];
  focusTargetWorld: [number, number, number];
}

function localToWorld(
  rootPos: THREE.Vector3,
  rootQuat: THREE.Quaternion,
  localPt: THREE.Vector3
): [number, number, number] {
  const w = localPt.clone().applyQuaternion(rootQuat).add(rootPos);
  return [w.x, w.y, w.z];
}

/**
 * 1. PROP-DRIVES-HAND: Traditional Indonesian Farming Hoe (Cangkul)
 * Computes exact physical chop arc (anticipation lift -> downward strike -> soil impact recoil)
 * and exports EXACT world-space leftGripWorld & rightGripWorld so IK hands NEVER clip or detach!
 *
 * Local Hoe Space:
 *  - Origin (0,0,0) = center of wooden shaft
 *  - Shaft extends along local +Y (top handle end at +0.52, steel blade head at -0.52)
 *  - Steel blade protrudes toward local +Z and angles slightly downward
 */
export function computeHoeGripSolution(
  pivotWorld: [number, number, number],
  facingYaw: number,
  swingPhase: number // 0 = neutral carry, 0..1 continuous chop cycle
): PropGripSolution {
  // Asymmetric physical chop curve: slow anticipation lift -> fast power strike -> firm hold in soil!
  const cyc = ((swingPhase % 1) + 1) % 1;
  let pitchAngle: number;
  let liftY: number;
  let reachZ: number;
  if (cyc < 0.35) {
    // Anticipation wind-up cleanly in front of torso (ZERO caping clipping!)
    const u = cyc / 0.35;
    const sm = u * u * (3 - 2 * u);
    pitchAngle = -0.25 - sm * 0.72;
    liftY = 0.02 + sm * 0.24;
    reachZ = 0.36 - sm * 0.04;
  } else if (cyc < 0.56) {
    // Fast energetic downward swing into earth!
    const u = (cyc - 0.35) / 0.21;
    const easeIn = u * u;
    pitchAngle = -0.97 + easeIn * 1.56;
    liftY = 0.26 - easeIn * 0.36;
    reachZ = 0.32 + easeIn * 0.16;
  } else if (cyc < 0.72) {
    // Ground impact settle + micro-recoil
    const u = (cyc - 0.56) / 0.16;
    pitchAngle = 0.59 - Math.sin(u * Math.PI) * 0.08;
    liftY = -0.10 + Math.sin(u * Math.PI) * 0.03;
    reachZ = 0.48;
  } else {
    // Smooth recovery lift back toward ready stance
    const u = (cyc - 0.72) / 0.28;
    const sm = u * u * (3 - 2 * u);
    pitchAngle = 0.59 * (1 - sm) + -0.25 * sm;
    liftY = -0.10 * (1 - sm) + 0.02 * sm;
    reachZ = 0.48 * (1 - sm) + 0.36 * sm;
  }

  const yawQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), facingYaw);
  const localOffset = new THREE.Vector3(0.08, liftY, reachZ).applyQuaternion(yawQuat);
  const rootVec = new THREE.Vector3(...pivotWorld).add(localOffset);

  const pitchQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(pitchAngle, 0, -0.12, "YXZ"));
  const rootQuat = yawQuat.clone().multiply(pitchQuat);

  // Two distinct two-handed wooden shaft grips (upper hand + lower power hand)
  const leftGripWorld = localToWorld(rootVec, rootQuat, new THREE.Vector3(0, 0.24, 0));
  const rightGripWorld = localToWorld(rootVec, rootQuat, new THREE.Vector3(0, -0.06, 0));
  const focusTargetWorld = localToWorld(rootVec, rootQuat, new THREE.Vector3(0, -0.48, 0.16));

  return {
    rootPos: [rootVec.x, rootVec.y, rootVec.z],
    rootQuat,
    leftGripWorld,
    rightGripWorld,
    focusTargetWorld,
  };
}

export const HoeProp3D: React.FC<{ solution: PropGripSolution }> = ({ solution }) => {
  const woodTex = useMemo(() => createWoodBoardTexture(), []);
  return (
    <group position={solution.rootPos} quaternion={solution.rootQuat}>
      {/* Smooth turned hardwood hoe shaft (top ends cleanly above upper hand -> NEVER clips caping!) */}
      <mesh position={[0, -0.08, 0]} castShadow>
        <cylinderGeometry args={[0.024, 0.026, 0.88, 12]} />
        <meshStandardMaterial map={woodTex} color="#C48F56" roughness={0.62} />
      </mesh>
      {/* Forged steel collar socket */}
      <mesh position={[0, -0.5, 0.02]} castShadow>
        <boxGeometry args={[0.075, 0.085, 0.085]} />
        <meshStandardMaterial color="#3A4046" metalness={0.62} roughness={0.42} />
      </mesh>
      {/* Broad curved forged steel hoe blade */}
      <mesh position={[0, -0.52, 0.16]} rotation={[0.18, 0, 0]} castShadow>
        <boxGeometry args={[0.21, 0.018, 0.25]} />
        <meshStandardMaterial color="#58626B" metalness={0.72} roughness={0.34} />
      </mesh>
      {/* Bright sharpened steel cutting edge */}
      <mesh position={[0, -0.545, 0.285]} rotation={[0.18, 0, 0]}>
        <boxGeometry args={[0.212, 0.012, 0.028]} />
        <meshStandardMaterial color="#B5C2CC" metalness={0.82} roughness={0.24} />
      </mesh>
    </group>
  );
};

/**
 * 2. PROP-DRIVES-HAND: Sculpted Indonesian Terracotta Water Pitcher (Kendi) for Seq 4 Table Analogy
 */
export function computeClayPitcherGrip(
  spoutTargetWorld: [number, number, number],
  facingYaw: number,
  pourAmount: number // 0 = upright held, 1 = tilted cleanly pouring stream!
): PropGripSolution {
  const yawQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), facingYaw);
  const rootVec = new THREE.Vector3(...spoutTargetWorld);
  // Tilt cleanly sideways-right (-Z roll in farmer space -> pouring toward +X down the ramp!)
  const tiltQuat = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(0.16, 0, -(0.22 + pourAmount * 0.92), "YXZ")
  );
  const rootQuat = yawQuat.clone().multiply(tiltQuat);

  // Exact tactile palm-contact grip coordinates directly ON terracotta pitcher belly & handle!
  const leftGripWorld = localToWorld(rootVec, rootQuat, new THREE.Vector3(-0.115, 0.02, -0.02));
  const rightGripWorld = localToWorld(rootVec, rootQuat, new THREE.Vector3(0.085, -0.04, -0.08));
  const focusTargetWorld = localToWorld(rootVec, rootQuat, new THREE.Vector3(0.28, -0.18, 0.05));

  return {
    rootPos: [rootVec.x, rootVec.y, rootVec.z],
    rootQuat,
    leftGripWorld,
    rightGripWorld,
    focusTargetWorld,
  };
}

export const ClayPitcherProp3D: React.FC<{
  solution: PropGripSolution;
  pourAmount: number;
  streamDropY: number;
}> = ({ solution, pourAmount, streamDropY }) => {
  const bodyGeo = useMemo(() => {
    const pts = [
      new THREE.Vector2(0.0, -0.13),
      new THREE.Vector2(0.082, -0.12),
      new THREE.Vector2(0.128, -0.03),
      new THREE.Vector2(0.115, 0.05),
      new THREE.Vector2(0.058, 0.11),
      new THREE.Vector2(0.066, 0.17),
      new THREE.Vector2(0.08, 0.19),
    ];
    return new THREE.LatheGeometry(pts, 20);
  }, []);

  // Compute pouring spout rim in world space (+X lip tilts downward toward ramp!)
  const spoutWorld = useMemo(() => {
    const v = new THREE.Vector3(0.068, 0.185, 0)
      .applyQuaternion(solution.rootQuat)
      .add(new THREE.Vector3(...solution.rootPos));
    return v;
  }, [solution]);

  const streamLen = Math.max(0.05, spoutWorld.y - streamDropY);

  return (
    <group>
      <group position={solution.rootPos} quaternion={solution.rootQuat}>
        <mesh geometry={bodyGeo} castShadow receiveShadow>
          <meshStandardMaterial color="#BD5E36" roughness={0.64} />
        </mesh>
        {/* Terracotta Loop Handle on LEFT side (-X) gripped directly by left IK palm! */}
        <mesh position={[-0.105, 0.04, 0]} rotation={[0, 0, Math.PI - 0.15]} castShadow>
          <torusGeometry args={[0.062, 0.015, 8, 16, Math.PI * 1.15]} />
          <meshStandardMaterial color="#A64E29" roughness={0.7} />
        </mesh>
        {/* Dark hollow opening inside pitcher lip */}
        <mesh position={[0, 0.19, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.06, 14]} />
          <meshBasicMaterial color="#231610" />
        </mesh>
      </group>

      {/* Translucent Crystal Pouring Water Stream from Spout directly onto Ramp Top! */}
      {pourAmount > 0.18 && (
        <mesh position={[spoutWorld.x + 0.02, streamDropY + streamLen / 2, spoutWorld.z]}>
          <cylinderGeometry args={[0.017, 0.026, streamLen, 10]} />
          <meshStandardMaterial
            color="#A4EAFF"
            emissive="#3CB6F0"
            emissiveIntensity={0.32}
            roughness={0.08}
            transparent
            opacity={Math.min(0.9, (pourAmount - 0.18) * 1.3)}
          />
        </mesh>
      )}
    </group>
  );
};

/**
 * 3. PROP-DRIVES-HAND: Split Bamboo Spillway Pipe Held by Farmer in Seq 6
 */
export function computeBambooPipeHoldGrip(
  pipeCenterWorld: [number, number, number],
  facingYaw: number,
  tiltZ: number
): PropGripSolution {
  const yawQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), facingYaw);
  const tiltQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, tiltZ, "YXZ"));
  const rootQuat = yawQuat.clone().multiply(tiltQuat);
  const rootVec = new THREE.Vector3(...pipeCenterWorld);

  const leftGripWorld = localToWorld(rootVec, rootQuat, new THREE.Vector3(-0.15, 0.02, 0));
  const rightGripWorld = localToWorld(rootVec, rootQuat, new THREE.Vector3(0.15, 0.02, 0));

  return {
    rootPos: [rootVec.x, rootVec.y, rootVec.z],
    rootQuat,
    leftGripWorld,
    rightGripWorld,
    focusTargetWorld: [rootVec.x, rootVec.y, rootVec.z],
  };
}

export const HeldBambooPipeProp3D: React.FC<{ solution: PropGripSolution }> = ({ solution }) => (
  <group position={solution.rootPos} quaternion={solution.rootQuat}>
    <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[0.044, 0.048, 0.52, 14]} />
      <meshStandardMaterial color="#C8C476" roughness={0.54} />
    </mesh>
    {/* Subtle bamboo node ring */}
    <mesh rotation={[0, 0, Math.PI / 2]}>
      <torusGeometry args={[0.047, 0.007, 6, 16]} />
      <meshStandardMaterial color="#9E9A54" roughness={0.65} />
    </mesh>
  </group>
);

/**
 * 4. Seq 1 Hand-Held Rice Seedling Bundle (held cleanly in LEFT hand while RIGHT hand plants!)
 */
export const SeedlingBundleProp3D: React.FC<{ position: [number, number, number] }> = ({
  position,
}) => (
  <group position={position} rotation={[0.35, 0.2, -0.32]}>
    {/* Straw tie binding */}
    <mesh>
      <cylinderGeometry args={[0.042, 0.042, 0.05, 10]} />
      <meshStandardMaterial color="#D8B672" roughness={0.85} />
    </mesh>
    {/* Fan of fresh green rice sprouts */}
    {[-0.25, -0.1, 0.05, 0.2, 0.32].map((a, i) => (
      <mesh key={i} position={[Math.sin(a) * 0.03, 0.14, Math.cos(a) * 0.02]} rotation={[0.1, 0, -a * 0.8]}>
        <coneGeometry args={[0.022, 0.28, 5]} />
        <meshStandardMaterial color={i % 2 === 0 ? "#66B830" : "#52A426"} roughness={0.65} />
      </mesh>
    ))}
    {/* Wet muddy roots below tie */}
    <mesh position={[0, -0.075, 0]}>
      <coneGeometry args={[0.038, 0.11, 7]} />
      <meshStandardMaterial color="#5E4026" roughness={0.92} />
    </mesh>
  </group>
);

/**
 * 5. SEQ 4 WORKSHOP TABLE ANALOGY DIORAMA (Placed cleanly at X = 22.0, Y = 0, Z = 0)
 * Shows side-by-side / sequential physical proof:
 *   - Smooth 30° tilted wooden board: water shoots straight off in 2 seconds!
 *   - Stepped 4-tier wooden terrace board: water brakes cleanly into 4 glowing calm mini-pools!
 */
export const TABLE_ZONE_X = 22.0;
export const TABLE_TOP_Y = 0.66;

export const TableAnalogyScene3D: React.FC<{
  boardMode: number; // 0 = flat tilted wooden ramp, 1 = stepped wooden terrace board!
  flatFlowProgress: number; // 0..1 rushing water sheet shooting off tilted board
  steppedFillProgress: number; // 0..1 water braking into 4 calm mini pools on stepped board
  frame: number;
}> = ({ boardMode, flatFlowProgress, steppedFillProgress, frame }) => {
  const woodTex = useMemo(() => createWoodBoardTexture(), []);

  // Subtle sunlit meadow backdrop behind the village workshop table
  return (
    <group position={[TABLE_ZONE_X, 0, 0]}>
      {/* Ground Grass Meadow Deck beneath Workshop Table */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[18, 18]} />
        <meshStandardMaterial color="#5E9C42" roughness={0.92} />
      </mesh>
      {/* Distant softly layered mountain hills behind workshop (keeping open bright sky above!) */}
      <mesh position={[-4.5, -1.2, -13.5]} scale={[1.8, 0.55, 1]}>
        <sphereGeometry args={[4.2, 16, 10]} />
        <meshStandardMaterial color="#5DA154" roughness={0.92} />
      </mesh>
      <mesh position={[5.2, -1.4, -14.5]} scale={[1.9, 0.52, 1]}>
        <sphereGeometry args={[4.5, 16, 10]} />
        <meshStandardMaterial color="#6DAA6E" roughness={0.92} />
      </mesh>

      {/* Rustic Teak & Bamboo Outdoor Workshop Table (Top at Y = TABLE_TOP_Y = 0.86) */}
      <mesh position={[0, TABLE_TOP_Y - 0.035, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.15, 0.07, 1.05]} />
        <meshStandardMaterial map={woodTex} color="#D4A66E" roughness={0.64} />
      </mesh>
      {[
        [-0.94, -0.42],
        [0.94, -0.42],
        [-0.94, 0.42],
        [0.94, 0.42],
      ].map(([lx, lz], i) => (
        <mesh key={i} position={[lx, (TABLE_TOP_Y - 0.07) / 2, lz]} castShadow>
          <cylinderGeometry args={[0.042, 0.046, TABLE_TOP_Y - 0.07, 10]} />
          <meshStandardMaterial color="#9C7242" roughness={0.78} />
        </mesh>
      ))}

      {/* Wooden Water Catch Basin cleanly visible on right side of table */}
      <group position={[0.64, TABLE_TOP_Y + 0.07, 0.04]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.23, 0.18, 0.14, 16, 1, true]} />
          <meshStandardMaterial color="#8F6339" roughness={0.76} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.065, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.18, 16]} />
          <meshStandardMaterial color="#75502E" roughness={0.85} />
        </mesh>
        {/* Rising spilled water inside basin during flat-board experiment! */}
        {flatFlowProgress > 0.25 && (
          <mesh position={[0, -0.04 + Math.min(0.08, (flatFlowProgress - 0.25) * 0.12), 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.2, 16]} />
            <meshStandardMaterial color="#74D2FA" roughness={0.14} transparent opacity={0.85} />
          </mesh>
        )}
      </group>

      {/* MODEL A: Smooth 30° Tilted Wooden Board (Centered in 9:16 frame!) */}
      {boardMode < 0.5 && (
        <group position={[-0.2, TABLE_TOP_Y, 0.04]}>
          {/* Triangular wooden wedge prop holding ramp at exact 26° slope */}
          <mesh position={[-0.42, 0.2, 0]} castShadow>
            <boxGeometry args={[0.09, 0.4, 0.46]} />
            <meshStandardMaterial color="#9C7145" roughness={0.78} />
          </mesh>
          {/* Smooth Tilted Board */}
          <group position={[0, 0.23, 0]} rotation={[0, 0, -0.42]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[1.08, 0.045, 0.48]} />
              <meshStandardMaterial map={woodTex} color="#E6C28E" roughness={0.54} />
            </mesh>
            {[-0.23, 0.23].map((rz, k) => (
              <mesh key={k} position={[0, 0.04, rz]}>
                <boxGeometry args={[1.08, 0.04, 0.025]} />
                <meshStandardMaterial color="#B58954" roughness={0.68} />
              </mesh>
            ))}
            {flatFlowProgress > 0.02 && (
              <mesh
                position={[
                  -0.44 + Math.min(1, flatFlowProgress * 1.4) * 0.44,
                  0.032,
                  0,
                ]}
              >
                <boxGeometry
                  args={[
                    Math.max(0.08, Math.min(1.06, flatFlowProgress * 1.65)),
                    0.022,
                    0.42,
                  ]}
                />
                <meshStandardMaterial
                  color="#7EE0FF"
                  emissive="#32B4F5"
                  emissiveIntensity={0.28}
                  roughness={0.08}
                  transparent
                  opacity={0.84}
                />
              </mesh>
            )}
          </group>

          {/* Animated waterfall droplets splashing off bottom right edge into catch basin! */}
          {flatFlowProgress > 0.32 &&
            [0, 1, 2, 3, 4, 5].map((di) => {
              const p = (frame * 0.12 + di * 0.17) % 1;
              const dx = 0.48 + p * 0.26;
              const dy = 0.05 + 0.08 * p - 0.14 * p * p;
              const dz = (di % 3 - 1) * 0.09;
              return (
                <mesh key={di} position={[dx, Math.max(0.02, dy), dz]}>
                  <sphereGeometry args={[0.024, 8, 8]} />
                  <meshStandardMaterial color="#B8F0FF" roughness={0.1} transparent opacity={0.88} />
                </mesh>
              );
            })}
        </group>
      )}

      {/* MODEL B: Stepped 4-Tier Wooden Terrace Board with Mini Dams (Centered in 9:16 frame!) */}
      {boardMode >= 0.5 && (
        <group position={[-0.2, TABLE_TOP_Y, 0.04]}>
          {[0, 1, 2, 3].map((step) => {
            const stepW = 0.28;
            const sx = -0.42 + step * stepW;
            const stepH = 0.42 - step * 0.095;
            const tierFill = Math.max(0, Math.min(1, steppedFillProgress * 2.1 - step * 0.28));
            return (
              <group key={step} position={[sx, 0, 0]}>
                <mesh position={[0, stepH / 2, 0]} castShadow receiveShadow>
                  <boxGeometry args={[stepW + 0.01, stepH, 0.48]} />
                  <meshStandardMaterial map={woodTex} color="#DFB67E" roughness={0.6} />
                </mesh>
                <mesh position={[stepW / 2 - 0.018, stepH + 0.032, 0]} castShadow>
                  <boxGeometry args={[0.036, 0.065, 0.48]} />
                  <meshStandardMaterial color="#A87A45" roughness={0.68} />
                </mesh>
                {[-0.23, 0.23].map((rz, k) => (
                  <mesh key={k} position={[0, stepH + 0.03, rz]}>
                    <boxGeometry args={[stepW, 0.06, 0.022]} />
                    <meshStandardMaterial color="#B98E58" roughness={0.65} />
                  </mesh>
                ))}
                {tierFill > 0.02 && (
                  <mesh position={[-0.015, stepH + 0.008 + tierFill * 0.038, 0]}>
                    <boxGeometry args={[stepW - 0.04, 0.018 + tierFill * 0.03, 0.42]} />
                    <meshStandardMaterial
                      color="#6AD6FA"
                      emissive="#25A6E8"
                      emissiveIntensity={0.22 + Math.sin(frame * 0.1 + step) * 0.05}
                      roughness={0.08}
                      transparent
                      opacity={0.86}
                    />
                  </mesh>
                )}
              </group>
            );
          })}
        </group>
      )}
    </group>
  );
};
