import React, { useMemo } from "react";
import * as THREE from "three";
import { solveTwoBoneIK } from "../ikSolver";
import {
  createBirchWoodPBR,
  createCapingWeavePBR,
  createContactShadowTexture,
  createShirtFabricTexture,
} from "../pbrMaterials";

export interface MannequinProIKProps {
  /** World-space pelvis center (or automatically derived cleanly above grounded feet) */
  hipPos: [number, number, number];
  /** World-space yaw rotation (0 = facing +Z camera, Math.PI/2 = facing +X, -Math.PI/2 = facing -X) */
  facingYaw: number;
  /** Forward/back torso lean in radians (positive = lean forward) */
  torsoLeanX?: number;
  /** Subtle torso side tilt in radians */
  torsoLeanZ?: number;
  /** Subtle torso twist around Y in radians */
  torsoTwistY?: number;
  /** Exact world-space target coordinates for LEFT palm (driven by tool/prop!) */
  leftHandTarget: [number, number, number];
  /** Exact world-space target coordinates for RIGHT palm (driven by tool/prop!) */
  rightHandTarget: [number, number, number];
  /** Exact world-space target coordinates for LEFT sandal sole center (locked to terrain!) */
  leftFootTarget: [number, number, number];
  /** Exact world-space target coordinates for RIGHT sandal sole center (locked to terrain!) */
  rightFootTarget: [number, number, number];
  /** Terrain slope angle around Z at left & right feet so sandals rest flush on slopes */
  leftFootSlopeZ?: number;
  rightFootSlopeZ?: number;
  /** Optional world-space point the villager's head/eyes naturally track */
  headLookTarget?: [number, number, number];
  /** Frame counter for natural blinking & subtle breathing */
  frame: number;
  /** Optional scale multiplier */
  scale?: number;
}

// Anatomical bone lengths (1:1 wooden artist mannequin proportions, total height ~1.58m)
const UPPER_ARM_LEN = 0.255;
const FOREARM_LEN = 0.245;
const THIGH_LEN = 0.335;
const SHIN_LEN = 0.345;
const SHOULDER_X = 0.195;
const SHOULDER_Y = 0.43; // Above spine base
const HIP_X = 0.086;
const HIP_Y = -0.04;

/**
 * Next-Gen Sculpted Wooden Mannequin with Real 2-Bone Analytical Inverse Kinematics (IK):
 * - Hands lock mathematically to exact prop grip world coordinates (ZERO clipping!)
 * - Feet lock mathematically to sloped/terraced ground contours with slope-tilted sandals & contact AO
 * - Smooth LatheGeometry sculpted limbs, contoured cotton t-shirt with baked crevice AO,
 *   fitted two-leg shorts moving inside IK thighs, birch wood-grain PBR, & natural head look-at tracking!
 */
export const MannequinProIK: React.FC<MannequinProIKProps> = ({
  hipPos,
  facingYaw,
  torsoLeanX = 0,
  torsoLeanZ = 0,
  torsoTwistY = 0,
  leftHandTarget,
  rightHandTarget,
  leftFootTarget,
  rightFootTarget,
  leftFootSlopeZ = 0,
  rightFootSlopeZ = 0,
  headLookTarget,
  frame,
  scale = 1.0,
}) => {
  const birchTex = useMemo(() => createBirchWoodPBR(), []);
  const shirtTex = useMemo(() => createShirtFabricTexture(), []);
  const capingTex = useMemo(() => createCapingWeavePBR(), []);
  const contactTex = useMemo(() => createContactShadowTexture(), []);

  // Sculpted LatheGeometry assets (smooth unified silhouettes — zero blocky raw primitives!)
  const geos = useMemo(() => {
    // 1. Contoured organic flat-front shirt torso (collar -> broad shoulders -> gently tapered waist -> soft hem)
    const torsoPts = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.132, 0.015),
      new THREE.Vector2(0.146, 0.07),
      new THREE.Vector2(0.148, 0.22),
      new THREE.Vector2(0.168, 0.39),
      new THREE.Vector2(0.162, 0.46),
      new THREE.Vector2(0.11, 0.5),
      new THREE.Vector2(0.056, 0.51),
    ];
    const torsoGeo = new THREE.LatheGeometry(torsoPts, 24);

    // 2. Sculpted gently domed woven bamboo caping hat (natural tropical farmer curve!)
    const capingPts = [
      new THREE.Vector2(0.0, 0.195),
      new THREE.Vector2(0.06, 0.165),
      new THREE.Vector2(0.15, 0.118),
      new THREE.Vector2(0.25, 0.068),
      new THREE.Vector2(0.355, 0.015),
      new THREE.Vector2(0.385, 0.0),
    ];
    const capingGeo = new THREE.LatheGeometry(capingPts, 32);

    // 3. Smooth tapered wooden limb segments extending along local -Y (0 -> -len)
    const makeLimb = (rTop: number, rBot: number, len: number) => {
      const pts = [
        new THREE.Vector2(0.0, 0.0),
        new THREE.Vector2(rTop * 0.92, -0.01),
        new THREE.Vector2(rTop, -len * 0.18),
        new THREE.Vector2((rTop + rBot) * 0.51, -len * 0.52),
        new THREE.Vector2(rBot, -len * 0.88),
        new THREE.Vector2(rBot * 0.85, -len),
      ];
      return new THREE.LatheGeometry(pts, 16);
    };

    return {
      torsoGeo,
      capingGeo,
      upperArmGeo: makeLimb(0.043, 0.036, UPPER_ARM_LEN),
      forearmGeo: makeLimb(0.036, 0.029, FOREARM_LEN),
      thighGeo: makeLimb(0.052, 0.043, THIGH_LEN),
      shinGeo: makeLimb(0.042, 0.033, SHIN_LEN),
    };
  }, []);

  // Deterministic subtle breathing & blinking
  const breathY = Math.sin(frame * 0.085) * 0.005;
  const isBlinking = frame % 92 < 4;
  const eyeScaleY = isBlinking ? 0.13 : 1.12;

  // Build world-space transform hierarchy to solve exact 2-Bone Analytical IK!
  const ikSolution = useMemo(() => {
    const hipW = new THREE.Vector3(hipPos[0], hipPos[1] + breathY, hipPos[2]);
    const bodyQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, facingYaw, 0, "YXZ"));
    const spineQuat = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(torsoLeanX, torsoTwistY, torsoLeanZ, "YXZ")
    );
    const torsoWorldQuat = bodyQuat.clone().multiply(spineQuat);

    const forwardDir = new THREE.Vector3(0, 0, 1).applyQuaternion(bodyQuat);
    const rightDir = new THREE.Vector3(1, 0, 0).applyQuaternion(bodyQuat);
    const spineBaseW = hipW.clone().add(new THREE.Vector3(0, 0.09 * scale, 0).applyQuaternion(bodyQuat));

    // World-space shoulder sockets
    const shoulderLW = spineBaseW
      .clone()
      .add(new THREE.Vector3(-SHOULDER_X * scale, SHOULDER_Y * scale, 0).applyQuaternion(torsoWorldQuat));
    const shoulderRW = spineBaseW
      .clone()
      .add(new THREE.Vector3(SHOULDER_X * scale, SHOULDER_Y * scale, 0).applyQuaternion(torsoWorldQuat));

    // World-space hip sockets
    const hipLW = hipW
      .clone()
      .add(new THREE.Vector3(-HIP_X * scale, HIP_Y * scale, 0).applyQuaternion(bodyQuat));
    const hipRW = hipW
      .clone()
      .add(new THREE.Vector3(HIP_X * scale, HIP_Y * scale, 0).applyQuaternion(bodyQuat));

    // Natural anatomical elbow & knee pole hints
    const elbowPoleL = forwardDir
      .clone()
      .multiplyScalar(-0.55)
      .addScaledVector(rightDir, -0.75)
      .add(new THREE.Vector3(0, -0.35, 0))
      .normalize();
    const elbowPoleR = forwardDir
      .clone()
      .multiplyScalar(-0.55)
      .addScaledVector(rightDir, 0.75)
      .add(new THREE.Vector3(0, -0.35, 0))
      .normalize();
    const kneePoleL = forwardDir.clone().addScaledVector(rightDir, -0.14).normalize();
    const kneePoleR = forwardDir.clone().addScaledVector(rightDir, 0.14).normalize();

    // Solve all 4 limbs in world space!
    const lHandT = new THREE.Vector3(...leftHandTarget);
    const rHandT = new THREE.Vector3(...rightHandTarget);
    // Offset foot ankle slightly above sandal sole (+0.055m) so sole sits flush on exact ground Y!
    const lAnkleT = new THREE.Vector3(leftFootTarget[0], leftFootTarget[1] + 0.052 * scale, leftFootTarget[2]);
    const rAnkleT = new THREE.Vector3(rightFootTarget[0], rightFootTarget[1] + 0.052 * scale, rightFootTarget[2]);

    const armL = solveTwoBoneIK(shoulderLW, lHandT, UPPER_ARM_LEN * scale, FOREARM_LEN * scale, elbowPoleL);
    const armR = solveTwoBoneIK(shoulderRW, rHandT, UPPER_ARM_LEN * scale, FOREARM_LEN * scale, elbowPoleR);
    const legL = solveTwoBoneIK(hipLW, lAnkleT, THIGH_LEN * scale, SHIN_LEN * scale, kneePoleL);
    const legR = solveTwoBoneIK(hipRW, rAnkleT, THIGH_LEN * scale, SHIN_LEN * scale, kneePoleR);

    // Compute natural head look-at rotation toward active prop/work target
    const headBaseW = spineBaseW
      .clone()
      .add(new THREE.Vector3(0, 0.67 * scale, 0).applyQuaternion(torsoWorldQuat));
    let headPitch = 0;
    let headYaw = 0;
    if (headLookTarget) {
      const toLook = new THREE.Vector3(...headLookTarget).sub(headBaseW);
      const invTorso = torsoWorldQuat.clone().invert();
      const localLook = toLook.applyQuaternion(invTorso).normalize();
      headYaw = Math.max(-0.52, Math.min(0.52, Math.atan2(localLook.x, Math.max(0.18, localLook.z))));
      // Keep vertical pitch subtle so charming sunlit wooden face & blinking eyes ALWAYS remain clearly visible!
      headPitch = Math.max(-0.24, Math.min(0.22, -Math.asin(Math.max(-0.9, Math.min(0.9, localLook.y))) * 0.45));
    }

    return {
      hipW,
      bodyQuat,
      spineBaseW,
      torsoWorldQuat,
      shoulderLW,
      shoulderRW,
      hipLW,
      hipRW,
      armL,
      armR,
      legL,
      legR,
      headPitch,
      headYaw,
    };
  }, [
    hipPos,
    breathY,
    facingYaw,
    torsoLeanX,
    torsoLeanZ,
    torsoTwistY,
    leftHandTarget,
    rightHandTarget,
    leftFootTarget,
    rightFootTarget,
    headLookTarget,
    scale,
  ]);

  const woodJointColor = "#D09366";
  const shortsColor = "#243B5C";
  const hairColor = "#231812";
  const sandalSole = "#1D1A17";

  return (
    <group>
      {/* Grounded Slope-Tilted Contact AO Shadow Decals directly beneath BOTH grounded sandals! */}
      <mesh
        position={[leftFootTarget[0], leftFootTarget[1] + 0.008, leftFootTarget[2]]}
        rotation={[-Math.PI / 2, 0, leftFootSlopeZ]}
      >
        <planeGeometry args={[0.38 * scale, 0.38 * scale]} />
        <meshBasicMaterial map={contactTex} transparent opacity={0.62} depthWrite={false} />
      </mesh>
      <mesh
        position={[rightFootTarget[0], rightFootTarget[1] + 0.008, rightFootTarget[2]]}
        rotation={[-Math.PI / 2, 0, rightFootSlopeZ]}
      >
        <planeGeometry args={[0.38 * scale, 0.38 * scale]} />
        <meshBasicMaterial map={contactTex} transparent opacity={0.62} depthWrite={false} />
      </mesh>

      {/* 1. PELVIS & SCULPTED SHORTS WAIST BLOCK */}
      <group position={ikSolution.hipW} quaternion={ikSolution.bodyQuat} scale={[scale, scale, scale]}>
        <mesh position={[0, 0.01, 0]} scale={[1.0, 1.0, 0.76]} castShadow receiveShadow>
          <cylinderGeometry args={[0.144, 0.15, 0.165, 20]} />
          <meshStandardMaterial color={shortsColor} roughness={0.72} />
        </mesh>
        <mesh position={[0, -0.06, 0]} scale={[1.0, 0.55, 0.76]} receiveShadow>
          <sphereGeometry args={[0.148, 18, 12]} />
          <meshStandardMaterial color={shortsColor} roughness={0.72} />
        </mesh>
      </group>

      {/* 2. SCULPTED TORSO + FRIENDLY TRACKING HEAD + DOMED CAPING */}
      <group
        position={ikSolution.spineBaseW}
        quaternion={ikSolution.torsoWorldQuat}
        scale={[scale, scale, scale]}
      >
        {/* Sculpted LatheGeometry Cotton T-Shirt with Baked Crevice AO */}
        <mesh geometry={geos.torsoGeo} scale={[1.0, 1.0, 0.68]} castShadow receiveShadow>
          <meshStandardMaterial map={shirtTex} roughness={0.68} />
        </mesh>

        {/* Subtle Dark Crevice Collar Rim */}
        <mesh position={[0, 0.505, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.056, 0.011, 8, 20]} />
          <meshStandardMaterial color="#C25E1D" roughness={0.75} />
        </mesh>

        {/* Birch Wood Neck Column */}
        <mesh position={[0, 0.555, 0]}>
          <cylinderGeometry args={[0.043, 0.05, 0.115, 16]} />
          <meshStandardMaterial map={birchTex} roughness={0.46} />
        </mesh>

        {/* Friendly Sunlit Head with Eye/Look-At Tracking */}
        <group position={[0, 0.68, 0]} rotation={[ikSolution.headPitch, ikSolution.headYaw, 0]}>
          <mesh scale={[0.96, 1.04, 0.96]} castShadow receiveShadow>
            <sphereGeometry args={[0.132, 24, 24]} />
            <meshStandardMaterial map={birchTex} roughness={0.44} />
          </mesh>

          {/* Sculpted Hair Crown + Parted Forehead Bangs */}
          <mesh position={[0, 0.022, -0.022]} rotation={[-0.28, 0, 0]} scale={[0.98, 1.02, 0.98]}>
            <sphereGeometry args={[0.134, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
            <meshStandardMaterial color={hairColor} roughness={0.74} />
          </mesh>
          {[-0.072, -0.03, 0.03, 0.07].map((fx, i) => (
            <mesh
              key={i}
              position={[fx, 0.078 - Math.abs(fx) * 0.25, 0.096 - Math.abs(fx) * 0.24]}
              rotation={[0.25, 0, fx * -2.2]}
            >
              <coneGeometry args={[0.021, 0.056, 8]} />
              <meshStandardMaterial color={hairColor} roughness={0.75} />
            </mesh>
          ))}

          {/* Small Rounded Wooden Nose */}
          <mesh position={[0, -0.008, 0.126]}>
            <sphereGeometry args={[0.017, 10, 10]} />
            <meshStandardMaterial color={woodJointColor} roughness={0.45} />
          </mesh>

          {/* Glossy Bead Eyes with Natural Blinking & Specular Catchlights */}
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

          {/* Sculpted Gently-Domed Woven Bamboo Caping Hat pushed slightly back (castShadow=false -> warm bright visible face!) */}
          <group position={[0, 0.088, -0.028]} rotation={[-0.22, 0, 0]}>
            <mesh geometry={geos.capingGeo} receiveShadow>
              <meshStandardMaterial
                map={capingTex}
                roughness={0.76}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        </group>
      </group>

      {/* 3. LEFT ARM (2-BONE ANALYTICAL IK -> LOCKED TO leftHandTarget!) */}
      <group position={ikSolution.shoulderLW} quaternion={ikSolution.armL.upperQuat} scale={[scale, scale, scale]}>
        {/* Seamless Rounded Orange Shoulder Cap & Folded Sleeve */}
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[0.058, 16, 16]} />
          <meshStandardMaterial map={shirtTex} roughness={0.68} />
        </mesh>
        <mesh position={[0, -0.055, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.056, 0.052, 0.11, 14]} />
          <meshStandardMaterial map={shirtTex} roughness={0.68} />
        </mesh>
        {/* Sculpted Birch Wood Upper Arm */}
        <mesh geometry={geos.upperArmGeo} castShadow>
          <meshStandardMaterial map={birchTex} roughness={0.45} />
        </mesh>

        {/* Elbow Joint + IK Forearm */}
        <group position={[0, -UPPER_ARM_LEN, 0]}>
          <mesh>
            <sphereGeometry args={[0.036, 14, 14]} />
            <meshStandardMaterial color={woodJointColor} roughness={0.46} />
          </mesh>
          <group quaternion={ikSolution.armL.lowerQuat}>
            <mesh geometry={geos.forearmGeo} castShadow>
              <meshStandardMaterial map={birchTex} roughness={0.45} />
            </mesh>
            {/* Sculpted Wooden Grip Hand centered directly on target */}
            <group position={[0, -FOREARM_LEN, 0]}>
              <mesh>
                <sphereGeometry args={[0.028, 12, 12]} />
                <meshStandardMaterial color={woodJointColor} roughness={0.45} />
              </mesh>
              <mesh position={[0, -0.014, 0.008]} scale={[0.92, 1.1, 0.78]} castShadow>
                <sphereGeometry args={[0.036, 12, 12]} />
                <meshStandardMaterial map={birchTex} roughness={0.45} />
              </mesh>
            </group>
          </group>
        </group>
      </group>

      {/* 4. RIGHT ARM (2-BONE ANALYTICAL IK -> LOCKED TO rightHandTarget!) */}
      <group position={ikSolution.shoulderRW} quaternion={ikSolution.armR.upperQuat} scale={[scale, scale, scale]}>
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[0.058, 16, 16]} />
          <meshStandardMaterial map={shirtTex} roughness={0.68} />
        </mesh>
        <mesh position={[0, -0.055, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.056, 0.052, 0.11, 14]} />
          <meshStandardMaterial map={shirtTex} roughness={0.68} />
        </mesh>
        <mesh geometry={geos.upperArmGeo} castShadow>
          <meshStandardMaterial map={birchTex} roughness={0.45} />
        </mesh>

        <group position={[0, -UPPER_ARM_LEN, 0]}>
          <mesh>
            <sphereGeometry args={[0.036, 14, 14]} />
            <meshStandardMaterial color={woodJointColor} roughness={0.46} />
          </mesh>
          <group quaternion={ikSolution.armR.lowerQuat}>
            <mesh geometry={geos.forearmGeo} castShadow>
              <meshStandardMaterial map={birchTex} roughness={0.45} />
            </mesh>
            <group position={[0, -FOREARM_LEN, 0]}>
              <mesh>
                <sphereGeometry args={[0.028, 12, 12]} />
                <meshStandardMaterial color={woodJointColor} roughness={0.45} />
              </mesh>
              <mesh position={[0, -0.014, 0.008]} scale={[0.92, 1.1, 0.78]} castShadow>
                <sphereGeometry args={[0.036, 12, 12]} />
                <meshStandardMaterial map={birchTex} roughness={0.45} />
              </mesh>
            </group>
          </group>
        </group>
      </group>

      {/* 5. LEFT LEG (2-BONE TERRAIN-LOCKED IK -> FITTED SHORTS CUFF + WOODEN THIGH/SHIN + SLOPE-FLUSH SANDAL!) */}
      <group position={ikSolution.hipLW} quaternion={ikSolution.legL.upperQuat} scale={[scale, scale, scale]}>
        {/* Fitted Navy Shorts Leg Cuff moving cleanly with IK thigh */}
        <mesh position={[0, -0.095, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.072, 0.066, 0.195, 16]} />
          <meshStandardMaterial color={shortsColor} roughness={0.72} />
        </mesh>
        <mesh geometry={geos.thighGeo} castShadow>
          <meshStandardMaterial map={birchTex} roughness={0.45} />
        </mesh>

        {/* Smooth Knee Joint (castShadow=false -> ZERO shadow acne!) */}
        <group position={[0, -THIGH_LEN, 0]}>
          <mesh>
            <sphereGeometry args={[0.042, 14, 14]} />
            <meshStandardMaterial color={woodJointColor} roughness={0.46} />
          </mesh>
          <group quaternion={ikSolution.legL.lowerQuat}>
            <mesh geometry={geos.shinGeo} castShadow>
              <meshStandardMaterial map={birchTex} roughness={0.45} />
            </mesh>
          </group>
        </group>
      </group>

      {/* Ground-Flush Left Sandal positioned & tilted strictly to exact terrain normal! */}
      <group
        position={leftFootTarget}
        rotation={[0, facingYaw, leftFootSlopeZ]}
        scale={[scale, scale, scale]}
      >
        <mesh position={[0, 0.046, 0]}>
          <sphereGeometry args={[0.029, 10, 10]} />
          <meshStandardMaterial color={woodJointColor} roughness={0.46} />
        </mesh>
        <mesh position={[0, 0.026, 0.048]} castShadow>
          <boxGeometry args={[0.072, 0.03, 0.155]} />
          <meshStandardMaterial map={birchTex} roughness={0.45} />
        </mesh>
        <mesh position={[0, 0.042, 0.068]}>
          <boxGeometry args={[0.075, 0.008, 0.018]} />
          <meshStandardMaterial color={sandalSole} roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.008, 0.05]} castShadow>
          <boxGeometry args={[0.08, 0.015, 0.178]} />
          <meshStandardMaterial color={sandalSole} roughness={0.88} />
        </mesh>
      </group>

      {/* 6. RIGHT LEG (2-BONE TERRAIN-LOCKED IK -> FITTED SHORTS CUFF + WOODEN THIGH/SHIN + SLOPE-FLUSH SANDAL!) */}
      <group position={ikSolution.hipRW} quaternion={ikSolution.legR.upperQuat} scale={[scale, scale, scale]}>
        <mesh position={[0, -0.095, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.072, 0.066, 0.195, 16]} />
          <meshStandardMaterial color={shortsColor} roughness={0.72} />
        </mesh>
        <mesh geometry={geos.thighGeo} castShadow>
          <meshStandardMaterial map={birchTex} roughness={0.45} />
        </mesh>

        <group position={[0, -THIGH_LEN, 0]}>
          <mesh>
            <sphereGeometry args={[0.042, 14, 14]} />
            <meshStandardMaterial color={woodJointColor} roughness={0.46} />
          </mesh>
          <group quaternion={ikSolution.legR.lowerQuat}>
            <mesh geometry={geos.shinGeo} castShadow>
              <meshStandardMaterial map={birchTex} roughness={0.45} />
            </mesh>
          </group>
        </group>
      </group>

      {/* Ground-Flush Right Sandal positioned & tilted strictly to exact terrain normal! */}
      <group
        position={rightFootTarget}
        rotation={[0, facingYaw, rightFootSlopeZ]}
        scale={[scale, scale, scale]}
      >
        <mesh position={[0, 0.046, 0]}>
          <sphereGeometry args={[0.029, 10, 10]} />
          <meshStandardMaterial color={woodJointColor} roughness={0.46} />
        </mesh>
        <mesh position={[0, 0.026, 0.048]} castShadow>
          <boxGeometry args={[0.072, 0.03, 0.155]} />
          <meshStandardMaterial map={birchTex} roughness={0.45} />
        </mesh>
        <mesh position={[0, 0.042, 0.068]}>
          <boxGeometry args={[0.075, 0.008, 0.018]} />
          <meshStandardMaterial color={sandalSole} roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.008, 0.05]} castShadow>
          <boxGeometry args={[0.08, 0.015, 0.178]} />
          <meshStandardMaterial color={sandalSole} roughness={0.88} />
        </mesh>
      </group>
    </group>
  );
};
