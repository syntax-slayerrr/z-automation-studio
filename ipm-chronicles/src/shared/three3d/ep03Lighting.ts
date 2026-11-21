import * as THREE from "three";
import { CHAR, TONE, untone } from "./ep03Shaders";
import type { GradeEffect, GradeParams } from "./ep03Post";

export type LightingPresetName =
  | "muktamar_warm"
  | "classroom_day"
  | "spi_lamp"
  | "priangan_sunset"
  | "archive_mono"
  | "panawuan_dusk";

type C3 = [number, number, number];

export interface Ep03LightPreset {
  az: number;
  el: number;
  lit: C3;
  shade: C3;
  lift: C3;
  lambert: number;
  sideK: number;
  term: number;
  bounce: C3;
  sat: number;
  charTint: C3;
  charShade: number;
  charGrad: number;
  bodyGrad: number;
  sideTint: C3;
  sunCol: string;
  sunI: number;
  sky: string;
  ground: string;
  hemiI: number;
  bg: string;
  fog: string;
  fogNear: number;
  fogFar: number;
  bias: number;
  normalBias: number;
  grade: GradeParams;
  gradeAmount: number;
}

export const EP03_LIGHTS: Record<LightingPresetName, Ep03LightPreset> = {
  muktamar_warm: {
    az: -38,
    el: 42,
    lit: [1.45, 1.24, 0.96],
    shade: [0.34, 0.25, 0.20],
    lift: [0.03, 0.02, 0.015],
    lambert: 0.42,
    sideK: 0.82,
    term: 0.24,
    bounce: [0.06, 0.035, 0.015],
    sat: 0.95,
    charTint: [1.0, 0.89, 0.76],
    charShade: 0.84,
    charGrad: 0.11,
    bodyGrad: 0.24,
    sideTint: [0.85, 0.78, 0.76],
    sunCol: "#ffcf94",
    sunI: 3.1,
    sky: "#bfa27a",
    ground: "#422a18",
    hemiI: 0.42,
    bg: "#17100b",
    fog: "#241911",
    fogNear: 7,
    fogFar: 26,
    bias: -0.0003,
    normalBias: 0.018,
    grade: {
      ky: [0.01, 0.095, 0.25, 0.54, 0.81, 0.94, 1],
      sat: [0.90, 1.02, 1.04],
      tintS: [0.005, 0.006],
      tintM: [-0.006, 0.006],
      tintH: [-0.014, 0.008],
      vig: [0.22, 0.42],
    },
    gradeAmount: 0.92,
  },
  classroom_day: {
    az: -58,
    el: 34,
    lit: [1.42, 1.32, 1.14],
    shade: [0.46, 0.40, 0.36],
    lift: [0.06, 0.048, 0.036],
    lambert: 0.34,
    sideK: 0.88,
    term: 0.26,
    bounce: [0.05, 0.038, 0.022],
    sat: 0.96,
    charTint: [1.0, 0.95, 0.87],
    charShade: 0.88,
    charGrad: 0.08,
    bodyGrad: 0.18,
    sideTint: [0.90, 0.86, 0.84],
    sunCol: "#ffe6be",
    sunI: 2.9,
    sky: "#f4e5c8",
    ground: "#6d4e34",
    hemiI: 0.56,
    bg: "#d8c49c",
    fog: "#dfd0af",
    fogNear: 10,
    fogFar: 32,
    bias: -0.00028,
    normalBias: 0.016,
    grade: {
      ky: [0.015, 0.108, 0.275, 0.57, 0.825, 0.945, 1],
      sat: [0.92, 0.98, 0.98],
      tintS: [0.004, 0.005],
      tintM: [-0.005, 0.005],
      tintH: [-0.010, 0.006],
      vig: [0.16, 0.48],
    },
    gradeAmount: 0.88,
  },
  spi_lamp: {
    az: 24,
    el: 58,
    lit: [1.48, 1.30, 1.02],
    shade: [0.38, 0.31, 0.27],
    lift: [0.04, 0.03, 0.022],
    lambert: 0.38,
    sideK: 0.84,
    term: 0.24,
    bounce: [0.07, 0.045, 0.02],
    sat: 0.94,
    charTint: [1.0, 0.91, 0.78],
    charShade: 0.85,
    charGrad: 0.10,
    bodyGrad: 0.22,
    sideTint: [0.87, 0.82, 0.82],
    sunCol: "#ffd296",
    sunI: 3.3,
    sky: "#d4b78c",
    ground: "#4d331d",
    hemiI: 0.46,
    bg: "#2b1d12",
    fog: "#3d2a1b",
    fogNear: 7,
    fogFar: 24,
    bias: -0.0003,
    normalBias: 0.016,
    grade: {
      ky: [0.012, 0.10, 0.26, 0.55, 0.81, 0.94, 1],
      sat: [0.92, 1.02, 1.05],
      tintS: [0.004, 0.005],
      tintM: [-0.006, 0.006],
      tintH: [-0.015, 0.009],
      vig: [0.22, 0.42],
    },
    gradeAmount: 0.92,
  },
  priangan_sunset: {
    az: -22,
    el: 18,
    lit: [1.50, 1.12, 0.72],
    shade: [0.32, 0.28, 0.34],
    lift: [0.05, 0.04, 0.06],
    lambert: 0.35,
    sideK: 0.82,
    term: 0.16,
    bounce: [0.07, 0.04, 0.015],
    sat: 0.96,
    charTint: [1.0, 0.87, 0.72],
    charShade: 0.85,
    charGrad: 0.10,
    bodyGrad: 0.24,
    sideTint: [0.86, 0.82, 0.92],
    sunCol: "#ffbe73",
    sunI: 4.2,
    sky: "#e2b086",
    ground: "#574032",
    hemiI: 0.50,
    bg: "#e9c496",
    fog: "#dfb082",
    fogNear: 14,
    fogFar: 75,
    bias: -0.00045,
    normalBias: 0.025,
    grade: {
      ky: [0.01, 0.10, 0.26, 0.56, 0.82, 0.94, 1],
      sat: [0.88, 1.04, 1.08],
      tintS: [0.012, 0.004],
      tintM: [-0.004, 0.004],
      tintH: [-0.014, 0.008],
      vig: [0.20, 0.44],
    },
    gradeAmount: 0.92,
  },
  archive_mono: {
    az: -42,
    el: 32,
    lit: [1.45, 1.34, 1.16],
    shade: [0.32, 0.28, 0.25],
    lift: [0.04, 0.032, 0.025],
    lambert: 0.40,
    sideK: 0.80,
    term: 0.20,
    bounce: [0.03, 0.025, 0.02],
    sat: 0.18,
    charTint: [0.95, 0.90, 0.82],
    charShade: 0.82,
    charGrad: 0.11,
    bodyGrad: 0.22,
    sideTint: [0.84, 0.80, 0.76],
    sunCol: "#f2e2c6",
    sunI: 3.1,
    sky: "#d4c3a6",
    ground: "#48382a",
    hemiI: 0.45,
    bg: "#c7b495",
    fog: "#bca889",
    fogNear: 9,
    fogFar: 32,
    bias: -0.00035,
    normalBias: 0.02,
    grade: {
      ky: [0.005, 0.085, 0.24, 0.55, 0.82, 0.95, 1],
      sat: [0.22, 0.28, 0.26],
      tintS: [-0.008, 0.012],
      tintM: [-0.010, 0.014],
      tintH: [-0.012, 0.014],
      vig: [0.30, 0.38],
    },
    gradeAmount: 1.0,
  },
  panawuan_dusk: {
    az: 35,
    el: 26,
    lit: [1.42, 1.22, 0.96],
    shade: [0.34, 0.27, 0.28],
    lift: [0.04, 0.03, 0.04],
    lambert: 0.36,
    sideK: 0.84,
    term: 0.22,
    bounce: [0.06, 0.04, 0.02],
    sat: 0.96,
    charTint: [1.0, 0.91, 0.80],
    charShade: 0.85,
    charGrad: 0.09,
    bodyGrad: 0.20,
    sideTint: [0.86, 0.82, 0.90],
    sunCol: "#ffd194",
    sunI: 3.2,
    sky: "#b3948a",
    ground: "#3b2618",
    hemiI: 0.48,
    bg: "#261b18",
    fog: "#4a332d",
    fogNear: 9,
    fogFar: 36,
    bias: -0.00035,
    normalBias: 0.018,
    grade: {
      ky: [0.012, 0.10, 0.26, 0.55, 0.81, 0.94, 1],
      sat: [0.90, 1.02, 1.04],
      tintS: [0.010, 0.004],
      tintM: [-0.004, 0.005],
      tintH: [-0.012, 0.007],
      vig: [0.22, 0.42],
    },
    gradeAmount: 0.92,
  },
};

const tmpFwd = new THREE.Vector3();

/** Applies lighting uniforms, directional shadow bounds, fog, and grade preset cleanly per shot. */
export function applySceneLighting(
  presetName: LightingPresetName,
  sun: THREE.DirectionalLight,
  hemi: THREE.HemisphereLight,
  scene: THREE.Scene,
  cam: THREE.PerspectiveCamera,
  target: THREE.Vector3,
  gradeFx: GradeEffect,
  shadowRadiusOverride?: number
): void {
  const L = EP03_LIGHTS[presetName];
  cam.getWorldDirection(tmpFwd);
  const fx = tmpFwd.x;
  const fz = tmpFwd.z;
  const n = Math.hypot(fx, fz) || 1;
  const ux = fx / n;
  const uz = fz / n;

  const az = THREE.MathUtils.degToRad(L.az);
  const el = THREE.MathUtils.degToRad(L.el);
  const hx = ux * Math.cos(az) - uz * Math.sin(az);
  const hz = uz * Math.cos(az) + ux * Math.sin(az);
  const sunDir = new THREE.Vector3(hx * Math.cos(el), Math.sin(el), hz * Math.cos(el)).normalize();

  hemi.color.set(L.sky);
  hemi.groundColor.set(L.ground);
  hemi.intensity = L.hemiI;
  sun.color.set(L.sunCol);
  sun.intensity = L.sunI;

  const dist = cam.position.distanceTo(target);
  const Rr = shadowRadiusOverride ?? THREE.MathUtils.clamp(dist * 1.35 + 3.5, 5, 18);
  sun.position.copy(target).addScaledVector(sunDir, 28);
  sun.target.position.copy(target);
  sun.target.updateMatrixWorld();

  const sc = sun.shadow.camera;
  sc.left = -Rr;
  sc.right = Rr;
  sc.top = Rr;
  sc.bottom = -Rr;
  sc.near = 2;
  sc.far = 70;
  sc.updateProjectionMatrix();
  sun.shadow.bias = L.bias;
  sun.shadow.normalBias = L.normalBias * (Rr / 8);

  TONE.uLitCol.value.set(...L.lit);
  TONE.uShadeCol.value.set(...L.shade);
  TONE.uShadeLift.value.set(...L.lift);
  TONE.uLambert.value = L.lambert;
  TONE.uSideK.value = L.sideK;
  TONE.uTerm.value = L.term;
  TONE.uBounce.value.set(...L.bounce);
  TONE.uSat.value = L.sat;

  CHAR.uCharTint.value.set(...L.charTint);
  CHAR.uCharShade.value = L.charShade;
  CHAR.uGrad.value = L.charGrad;
  CHAR.uBodyGrad.value = L.bodyGrad;
  CHAR.uSideTint.value.set(...L.sideTint);

  const bgCol = untone(L.bg);
  const fogCol = untone(L.fog);
  scene.background = bgCol;
  if (!scene.fog || !(scene.fog instanceof THREE.Fog)) {
    scene.fog = new THREE.Fog(fogCol, L.fogNear, L.fogFar);
  } else {
    scene.fog.color.copy(fogCol);
    scene.fog.near = L.fogNear;
    scene.fog.far = L.fogFar;
  }

  gradeFx.set(L.grade, L.gradeAmount);
}
