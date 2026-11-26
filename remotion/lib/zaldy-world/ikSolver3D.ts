import * as THREE from "three";

export interface TwoBoneIKResult {
  upperQuat: THREE.Quaternion;
  lowerQuat: THREE.Quaternion;
  lowerWorldQuat: THREE.Quaternion;
  jointPos: THREE.Vector3;
  effectorPos: THREE.Vector3;
}

const NEG_Y = new THREE.Vector3(0, -1, 0);

export function boneQuaternionFromDir(
  boneDir: THREE.Vector3,
  hintDir: THREE.Vector3
): THREE.Quaternion {
  const yAxis = boneDir.clone().negate().normalize();
  const xAxis = new THREE.Vector3().crossVectors(yAxis, hintDir);
  if (xAxis.lengthSq() < 1e-6) {
    return new THREE.Quaternion().setFromUnitVectors(NEG_Y, boneDir);
  }
  xAxis.normalize();
  const zAxis = new THREE.Vector3().crossVectors(xAxis, yAxis).normalize();
  const m = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);
  return new THREE.Quaternion().setFromRotationMatrix(m);
}

/**
 * Deterministic 2-Bone Analytical Inverse Kinematics Solver (Zero Stateful Drift).
 * Bones point along local `-Y` from `0` to `-len`.
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
  const minDist = Math.abs(len1 - len2) + 0.008;
  const maxDist = (len1 + len2) * 0.996;
  const dist = Math.max(minDist, Math.min(maxDist, rawDist));

  const dir =
    rawDist > 1e-5
      ? toTarget.clone().divideScalar(rawDist)
      : new THREE.Vector3(0, -1, 0);

  const poleProj = poleHint.clone().addScaledVector(dir, -poleHint.dot(dir));
  if (poleProj.lengthSq() < 1e-6) {
    poleProj.set(0, 0, 1).addScaledVector(dir, -dir.z);
    if (poleProj.lengthSq() < 1e-6) poleProj.set(1, 0, 0);
  }
  poleProj.normalize();

  const cosAngle = Math.max(
    -1,
    Math.min(1, (len1 * len1 + dist * dist - len2 * len2) / (2 * len1 * dist))
  );
  const sinAngle = Math.sqrt(Math.max(0, 1 - cosAngle * cosAngle));

  const upperDir = dir
    .clone()
    .multiplyScalar(cosAngle)
    .addScaledVector(poleProj, sinAngle)
    .normalize();

  const jointPos = rootPos.clone().addScaledVector(upperDir, len1);
  const effectorPos = rootPos.clone().addScaledVector(dir, dist);
  const lowerDir = new THREE.Vector3().subVectors(effectorPos, jointPos).normalize();

  const upperWorldQuat = boneQuaternionFromDir(upperDir, poleProj);
  const lowerWorldQuat = boneQuaternionFromDir(lowerDir, poleProj);
  const lowerLocalQuat = upperWorldQuat.clone().invert().multiply(lowerWorldQuat);

  return {
    upperQuat: upperWorldQuat,
    lowerQuat: lowerLocalQuat,
    lowerWorldQuat,
    jointPos,
    effectorPos,
  };
}

export const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));
export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * clamp01(t);
export const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / Math.max(1e-5, b - a));
  return t * t * (3 - 2 * t);
};
