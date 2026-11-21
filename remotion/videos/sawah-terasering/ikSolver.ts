import * as THREE from "three";

/**
 * Pure Deterministic 2-Bone Analytical Inverse Kinematics Solver (Zero Stateful Drift!)
 * Computes exact upper-limb & lower-limb orientations so hands lock to moving tool grips
 * and feet lock to exact sloped/terraced ground contours with ZERO clipping!
 */
export interface TwoBoneIKResult {
  upperQuat: THREE.Quaternion; // Local orientation aligning -Y bone axis from root -> elbow
  lowerQuat: THREE.Quaternion; // Local orientation aligning -Y bone axis from elbow -> target (relative to upper)
  elbowPos: THREE.Vector3;
  effectorPos: THREE.Vector3;
}

const NEG_Y = new THREE.Vector3(0, -1, 0);

/**
 * Given rootPos, targetPos, bone lengths len1 & len2, and poleHint (direction elbow/knee should bend toward),
 * returns exact world-space elbow position and quaternion rotations for -Y-aligned bone segments.
 */
export function solveTwoBoneIK(
  rootPos: THREE.Vector3,
  targetPos: THREE.Vector3,
  len1: number,
  len2: number,
  poleHint: THREE.Vector3
): TwoBoneIKResult {
  const toTarget = new THREE.Vector3().subVectors(targetPos, rootPos);
  const rawDist = toTarget.length();
  const minDist = Math.abs(len1 - len2) + 0.005;
  const maxDist = (len1 + len2) * 0.998;
  const dist = Math.max(minDist, Math.min(maxDist, rawDist));

  const dir = rawDist > 1e-5 ? toTarget.clone().divideScalar(rawDist) : new THREE.Vector3(0, -1, 0);

  // Build orthonormal bend plane using poleHint orthogonalized against dir
  const poleProj = poleHint.clone().addScaledVector(dir, -poleHint.dot(dir));
  if (poleProj.lengthSq() < 1e-6) {
    // Fallback orthogonal axis
    poleProj.set(0, 0, 1).addScaledVector(dir, -dir.z);
    if (poleProj.lengthSq() < 1e-6) poleProj.set(1, 0, 0);
  }
  poleProj.normalize();

  // Law of Cosines for angle at root between dir and upper bone
  const cosAngle = Math.max(-1, Math.min(1, (len1 * len1 + dist * dist - len2 * len2) / (2 * len1 * dist)));
  const sinAngle = Math.sqrt(Math.max(0, 1 - cosAngle * cosAngle));

  const upperDir = dir
    .clone()
    .multiplyScalar(cosAngle)
    .addScaledVector(poleProj, sinAngle)
    .normalize();

  const elbowPos = rootPos.clone().addScaledVector(upperDir, len1);
  const effectorPos = rootPos.clone().addScaledVector(dir, dist);
  const lowerDir = new THREE.Vector3().subVectors(effectorPos, elbowPos).normalize();

  // Compute twist-stabilized quaternion aligning local -Y along boneDir and local +Z toward pole
  const upperWorldQuat = boneQuaternionFromDir(upperDir, poleProj);
  const lowerWorldQuat = boneQuaternionFromDir(lowerDir, poleProj);

  const lowerLocalQuat = upperWorldQuat.clone().invert().multiply(lowerWorldQuat);

  return {
    upperQuat: upperWorldQuat,
    lowerQuat: lowerLocalQuat,
    elbowPos,
    effectorPos,
  };
}

function boneQuaternionFromDir(boneDir: THREE.Vector3, hintDir: THREE.Vector3): THREE.Quaternion {
  // Bone extends along local -Y -> local +Y is -boneDir
  const yAxis = boneDir.clone().negate().normalize();
  let xAxis = new THREE.Vector3().crossVectors(yAxis, hintDir);
  if (xAxis.lengthSq() < 1e-6) {
    return new THREE.Quaternion().setFromUnitVectors(NEG_Y, boneDir);
  }
  xAxis.normalize();
  const zAxis = new THREE.Vector3().crossVectors(xAxis, yAxis).normalize();
  const m = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);
  return new THREE.Quaternion().setFromRotationMatrix(m);
}

/**
 * Shared Mathematical Terrain Surface for Sawah Terasering!
 * BOTH `TerraceHillCutaway` 3D mesh AND `MannequinProIK` Foot-Locking query this exact function
 * so sandals ALWAYS lock flush onto the 30° slope OR carved flat terraces with ZERO floating or sinking!
 *
 * Slope spans X in [-4.5, +4.5]:
 *  - High side is LEFT (x = -4.5, y ≈ +2.45m) -> Low valley is RIGHT (x = +4.5, y ≈ -1.65m)
 *  - Bare slope angle ≈ 25°–30° (tan ≈ 0.48)
 *  - Terrace mode carves 4 distinct flat flooded paddy tiers + compacted raised clay pematang bunds!
 */
export interface TerraceTierSpec {
  id: number;
  xStart: number; // Left inner wall X
  xEnd: number; // Right bund rim X
  floorY: number; // Flat mud deck Y
  waterY: number; // Calm flooded water surface Y
  bundX: number; // Center X of raised clay pematang lip
  bundTopY: number; // Top of clay pematang wall
}

export const TERRACE_TIERS: TerraceTierSpec[] = [
  { id: 4, xStart: -4.6, xEnd: -2.35, floorY: 1.72, waterY: 1.84, bundX: -2.42, bundTopY: 1.94 },
  { id: 3, xStart: -2.35, xEnd: -0.15, floorY: 0.92, waterY: 1.04, bundX: -0.22, bundTopY: 1.14 },
  { id: 2, xStart: -0.15, xEnd: 2.05, floorY: 0.12, waterY: 0.24, bundX: 1.98, bundTopY: 0.34 },
  { id: 1, xStart: 2.05, xEnd: 4.5, floorY: -0.68, waterY: -0.56, bundX: 4.35, bundTopY: -0.46 },
];

export function getBareSlopeY(x: number): number {
  // Smooth natural ~26-30 deg volcanic hillside falling left (-X high) to right (+X low)
  return 0.56 - x * 0.44 + Math.sin(x * 0.42) * 0.06;
}

export function getTerracedProfileY(x: number, bundStrength: number = 1.0): number {
  // Find active tier with smooth steep riser transitions (~0.18m wide)
  let baseY = TERRACE_TIERS[3].floorY;
  for (let i = 0; i < TERRACE_TIERS.length; i++) {
    const t = TERRACE_TIERS[i];
    if (x <= t.xEnd) {
      baseY = t.floorY;
      // Smooth steep carved riser on left transition from previous tier
      if (i > 0) {
        const prev = TERRACE_TIERS[i - 1];
        const distFromEdge = x - prev.xEnd;
        if (distFromEdge < 0.24) {
          const u = Math.max(0, Math.min(1, distFromEdge / 0.24));
          const sm = u * u * (3 - 2 * u);
          baseY = prev.floorY * (1 - sm) + t.floorY * sm;
        }
      }
      break;
    }
  }

  // Add raised compacted clay pematang bund wall at outer right edge of each tier
  if (bundStrength > 0.001) {
    let bundBoost = 0;
    for (const t of TERRACE_TIERS) {
      const dx = Math.abs(x - t.bundX);
      if (dx < 0.24) {
        const w = Math.cos((dx / 0.24) * (Math.PI / 2));
        bundBoost = Math.max(bundBoost, w * w * 0.22 * bundStrength);
      }
    }
    baseY += bundBoost;
  }

  return baseY;
}

/**
 * Continuous morphing terrain elevation queried by BOTH 3D geometry & IK feet!
 * @param x World X
 * @param z World Z (slight natural contour curve backward into mountain)
 * @param terraceMorph 0 = bare 30° volcanic slope, 1 = fully carved 4-tier terraces
 * @param bundStrength 0..1 clay pematang bund buildup
 */
export function getTerrainY(
  x: number,
  z: number,
  terraceMorph: number,
  bundStrength: number = 1.0
): number {
  const m = Math.max(0, Math.min(1, terraceMorph));
  const sm = m * m * (3 - 2 * m);
  // Subtle organic hillside curvature along Z behind cutaway (flat near Z=0 cutaway for crisp engineering profile)
  const zCurve = Math.max(0, -z - 0.5) * 0.035 * Math.sin(x * 0.65);
  const bareY = getBareSlopeY(x);
  const stepY = getTerracedProfileY(x, bundStrength * sm);
  return bareY * (1 - sm) + stepY * sm + zCurve;
}

/**
 * Surface slope angle (radians around Z axis) at (x, z) so sandals & contact shadows tilt flush with terrain!
 */
export function getTerrainSlopeAngleZ(
  x: number,
  z: number,
  terraceMorph: number,
  bundStrength: number = 1.0
): number {
  const eps = 0.08;
  const yL = getTerrainY(x - eps, z, terraceMorph, bundStrength);
  const yR = getTerrainY(x + eps, z, terraceMorph, bundStrength);
  return Math.atan2(yR - yL, eps * 2);
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / Math.max(1e-5, edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}
