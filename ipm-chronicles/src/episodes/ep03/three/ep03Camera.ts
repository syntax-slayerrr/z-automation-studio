import type { LightingPresetName } from "../../../shared/three3d/ep03Lighting";
import {
  clamp01,
  criticallyDampedSpring,
  minJerk,
  tweenMinJerk,
  ultraSmoothC3,
} from "../../../shared/mathMotion";

export { clamp01, criticallyDampedSpring, minJerk, minJerk as smoother, tweenMinJerk, ultraSmoothC3 };

export type WorldSetId = "A_MUKTAMAR" | "B_CLASSROOM" | "C_PRIANGAN_MAP" | "D_PANAWUAN";

export type V3 = [number, number, number];

export interface CamPose3D {
  pos: V3;
  look: V3;
  fov: number;
  roll: number;
  cInf: number;
  focusPoint?: V3;
}

export interface SubShot3D {
  id: number;
  name: string;
  a: number;
  b: number;
  set: WorldSetId;
  light: LightingPresetName;
  shadowRadius?: number;
  cam: (f: number, dtFrames: number, u: number) => CamPose3D;
}

/** Smooth C2 Minimum-Jerk pose-to-pose transition + hold (zero sinusoidal looping). */
export function poseTween(
  f: number,
  startF: number,
  endF: number,
  fromVal: number,
  toVal: number
): number {
  const k = tweenMinJerk(f, startF, endF);
  return fromVal + (toVal - fromVal) * k;
}

/** Critically damped one-way physical spring pose arrival + hold (zero overshoot/bounce). */
export function poseSpring(
  f: number,
  startF: number,
  fromVal: number,
  toVal: number,
  omega0 = 8.5
): number {
  const k = criticallyDampedSpring(f, startF, 30, omega0, 0);
  return fromVal + (toVal - fromVal) * k;
}

const mixV3 = (a: V3, b: V3, k: number): V3 => [
  a[0] + (b[0] - a[0]) * k,
  a[1] + (b[1] - a[1]) * k,
  a[2] + (b[2] - a[2]) * k,
];

/**
 * Constant-perception exponential optical dolly push:
 * uniform velocity from first frame to cut, zero mid-shot S-curve surge or braking jerk.
 */
function pushExp(pos: V3, look: V3, dtFrames: number, rate = 0.0018): { pos: V3; look: V3 } {
  const k = Math.exp(-rate * Math.max(0, dtFrames));
  return {
    pos: [
      look[0] + (pos[0] - look[0]) * k,
      look[1] + (pos[1] - look[1]) * k,
      look[2] + (pos[2] - look[2]) * k,
    ],
    look,
  };
}

/**
 * Calm constant-rate lateral/crane linear glide tracking progressive B-roll beats.
 */
function steadyGlide(pos0: V3, pos1: V3, look0: V3, look1: V3, u: number): { pos: V3; look: V3 } {
  const k = clamp01(u);
  return { pos: mixV3(pos0, pos1, k), look: mixV3(look0, look1, k) };
}

export const EP03_3D_TOTAL_FRAMES = 2876;

/** Soft subtle doorway light bloom when crossing threshold from dark conference to sunlit corridor. */
export const FLASH_3D_AT = 240;

export function transitionOverlayAt(f: number): { color: string; opacity: number } | null {
  if (f >= FLASH_3D_AT && f < FLASH_3D_AT + 4) {
    return { color: "#fff2dc", opacity: [0.24, 0.14, 0.06, 0.02][f - FLASH_3D_AT] };
  }
  return null;
}

/**
 * 21 Cinematic Documentary Shots tracking 32 word-locked B-Roll beats across 8 distinct 3D visual mechanisms.
 */
export const SHOTS_3D: SubShot3D[] = [
  // ======================== S0: MUKTAMAR LECTERN & CORRIDOR FLIGHT (f=0..243) ========================
  {
    id: 1,
    name: "S0_01_TanfidzLecternStamp",
    a: 0,
    b: 97,
    set: "A_MUKTAMAR",
    light: "muktamar_warm",
    shadowRadius: 6,
    // Beats #01-#02: Elevated Tanfidz lectern framing full open inner cover + full stamped decree page above tabletop
    cam: (_f, _dt, u) => ({
      ...steadyGlide([0.24, 1.40, 1.24], [0.16, 1.36, 1.12], [-0.04, 0.91, -0.07], [-0.02, 0.91, -0.07], u),
      fov: 43,
      roll: 0,
      cInf: 11,
      focusPoint: [-0.02, 0.91, -0.07],
    }),
  },
  {
    id: 2,
    name: "S0_02_RackFocusThroughDoor",
    a: 97,
    b: 146,
    set: "A_MUKTAMAR",
    light: "muktamar_warm",
    shadowRadius: 8,
    // Beat #02 end: Smooth tilt & C3 rack focus from closed Tanfidz up to opening teak door & bright corridor
    cam: (_f, _dt, u) => ({
      ...steadyGlide([0.18, 1.18, 0.82], [0.08, 1.24, 0.25], [0.0, 0.88, -0.30], [0.02, 1.12, -3.15], ultraSmoothC3(u)),
      fov: 41,
      roll: 0,
      cInf: 11,
      focusPoint: mixV3([0.0, 0.84, -0.04], [0.02, 1.12, -2.95], ultraSmoothC3(u)),
    }),
  },
  {
    id: 3,
    name: "S0_03_CorridorPortalFlight",
    a: 146,
    b: 243,
    set: "A_MUKTAMAR",
    light: "muktamar_warm",
    shadowRadius: 10,
    // Beat #03: Camera settles at the doorway while the cadre truly walks away down the real hallway (she shrinks — no treadmill chase)
    cam: (_f, _dt, u) => ({
      ...steadyGlide([0.10, 1.30, 0.20], [0.02, 1.26, -0.55], [0.0, 1.10, -3.4], [0.0, 1.14, -5.0], u),
      fov: 42,
      roll: 0,
      cInf: 8,
      focusPoint: [0.0, 1.12, -3.2 - u * 2.6],
    }),
  },

  // ======================== S1: CLASSROOM, PP->PR BOARD, & 4 BASIS DIORAMA (f=243..780) ========================
  {
    id: 4,
    name: "S1_04_ClassEstablishWalkIn",
    a: 243,
    b: 304,
    set: "B_CLASSROOM",
    light: "classroom_day",
    shadowRadius: 10,
    // Beat #04: "Kelas sudah lengang" — Andi walks into aisle & pauses observing empty desks
    cam: (_f, dt) => ({
      ...pushExp([1.42, 1.38, 0.76], [0.16, 1.04, -1.95], dt, 0.0017),
      fov: 41,
      roll: 0,
      cInf: 7,
      focusPoint: [0.16, 1.04, -1.90],
    }),
  },
  {
    id: 5,
    name: "S1_05_OTSAndiQuestion",
    a: 304,
    b: 399,
    set: "B_CLASSROOM",
    light: "classroom_day",
    shadowRadius: 9,
    // Beat #05 B-roll: Andi asks -> smooth pan onto desk diagram drawing ATURAN PUSAT -> ? -> SISWA BARU on "sampai ke siswa baru?"
    cam: (_f, _dt, u) => {
      const k = minJerk(clamp01((u - 0.38) / 0.34));
      return {
        ...steadyGlide([-1.32, 1.15, -0.46], [-0.42, 1.24, -0.68], [0.12, 1.04, -1.85], [-0.96, 0.72, -1.48], k),
        fov: 40 + 2 * k,
        roll: 0,
        cInf: 11,
        focusPoint: mixV3([0.16, 1.06, -1.85], [-0.96, 0.72, -1.48], k),
      };
    },
  },
  {
    id: 6,
    name: "S1_06_ChalkboardFlowPP_PC",
    a: 399,
    b: 588,
    set: "B_CLASSROOM",
    light: "classroom_day",
    shadowRadius: 9,
    // Beats #06-#08: Wide unclipped lateral tracking across PP -> PW -> PD -> PC with kader walking beside board
    cam: (_f, _dt, u) => ({
      ...steadyGlide([-0.62, 1.54, 1.24], [0.56, 1.54, 1.14], [-0.38, 1.66, -3.50], [0.56, 1.66, -3.50], u),
      fov: 46,
      roll: 0,
      cInf: 7,
      focusPoint: [-0.32 + u * 0.90, 1.66, -3.50],
    }),
  },
  {
    id: 7,
    name: "S1_07_EmphasisRantingPR",
    a: 588,
    b: 649,
    set: "B_CLASSROOM",
    light: "classroom_day",
    shadowRadius: 8,
    // Beat #09: "Ujung tombaknya berdetak di Pimpinan Ranting" — frames PR node & pointing kader 100% inside margin
    cam: (_f, dt) => ({
      ...pushExp([0.58, 1.44, 0.35], [1.04, 1.44, -3.18], dt, 0.0018),
      fov: 42,
      roll: 0,
      cInf: 9,
      focusPoint: [1.08, 1.44, -3.12],
    }),
  },
  {
    id: 8,
    name: "S1_08_Basis4BuildingsDiorama",
    a: 649,
    b: 780,
    set: "B_CLASSROOM",
    light: "classroom_day",
    shadowRadius: 11,
    // Beats #10-#13: Distinct Architectural Diorama Pop-Up (all 4 Sekolah..Kampung buildings & labels fit unclipped)
    cam: (_f, _dt, u) => ({
      ...steadyGlide([-0.36, 1.36, 1.76], [0.04, 1.36, 2.24], [-0.26, 0.92, -0.58], [0.0, 0.94, -0.58], u),
      fov: 46,
      roll: 0,
      cInf: 7,
      focusPoint: [-0.20 + u * 0.20, 0.93, -0.58],
    }),
  },

  // ======================== S2: SPI POP-UP LECTERN, FORTASI, TM PODIUMS, & PINBOARD (f=780..1492) ========================
  {
    id: 9,
    name: "S2_09_SPIBlueprintLectern",
    a: 780,
    b: 955,
    set: "B_CLASSROOM",
    light: "spi_lamp",
    shadowRadius: 7,
    // Beats #14-#15: Arc-glide over 34-deg slanted SPI book lectern as 3D pop-up compass & 5 tier ribbons rise off pages
    cam: (_f, _dt, u) => ({
      ...steadyGlide([-1.44, 1.44, 2.82], [-1.22, 1.42, 2.72], [-1.42, 0.84, 1.42], [-1.26, 0.86, 1.42], u),
      fov: 42,
      roll: 0,
      cInf: 9,
      focusPoint: [-1.35, 0.86, 1.42],
    }),
  },
  {
    id: 10,
    name: "S2_10_FortasiPortalWalk",
    a: 955,
    b: 1057,
    set: "B_CLASSROOM",
    light: "classroom_day",
    shadowRadius: 10,
    // Beat #16: "Pintu pertamanya FORTASI" — student physically walks forward through carved FORTASI wooden gate
    cam: (_f, dt) => ({
      ...pushExp([0.30, 1.56, 4.70], [0.46, 1.56, 1.80], dt, 0.0013),
      fov: 44,
      roll: 0,
      cInf: 9,
      focusPoint: [0.46, 1.40, 1.80],
    }),
  },
  {
    id: 11,
    name: "S2_11_SeniorGuidesOrientation",
    a: 1057,
    b: 1216,
    set: "B_CLASSROOM",
    light: "classroom_day",
    shadowRadius: 9,
    // Beat #17 B-roll: two-shot -> glide onto the "ARAH GERAKAN" easel while its checklist reads -> ease back out to the two-shot
    cam: (_f, _dt, u) => {
      const base = steadyGlide([0.08, 1.24, 3.68], [0.26, 1.22, 3.34], [0.46, 1.14, 1.76], [0.46, 1.14, 1.76], u);
      const k = minJerk(clamp01((u - 0.12) / 0.28)) * (1 - minJerk(clamp01((u - 0.72) / 0.22)));
      return {
        ...base,
        pos: mixV3(base.pos, [0.05, 1.30, 3.62], k),
        look: mixV3(base.look, [-0.62, 1.27, 2.30], k),
        fov: 42 + 1.5 * k,
        roll: 0,
        cInf: 9,
        focusPoint: mixV3([0.46, 1.14, 1.76], [-0.62, 1.27, 2.30], k),
      };
    },
  },
  {
    id: 12,
    name: "S2_12_TarunaMelatiRisingSteps",
    a: 1216,
    b: 1332,
    set: "B_CLASSROOM",
    light: "spi_lamp",
    shadowRadius: 9,
    // Beats #18-#19: Diagonal crane following rising 3D Taruna Melati tiers up to summit golden torch (full gold chevron margins)
    cam: (_f, _dt, u) => ({
      ...steadyGlide([1.76, 0.72, 2.88], [1.72, 1.44, 2.74], [2.35, 0.54, 0.36], [2.35, 1.28, -0.04], u),
      fov: 43,
      roll: 0,
      cInf: 9,
      focusPoint: [2.35, 0.56 + u * 0.72, 0.34 - u * 0.36],
    }),
  },
  {
    id: 13,
    name: "S2_13_AnisaClipboardHome",
    a: 1332,
    b: 1492,
    set: "B_CLASSROOM",
    light: "spi_lamp",
    shadowRadius: 7,
    // Beats #20-#21 B-roll: Start on writing Anisa then pull back slightly while panning so BOTH Anisa & full framed RUMAH PELAJAR clipboard fit cleanly
    cam: (_f, _dt, u) => {
      const k = minJerk(clamp01((u - 0.14) / 0.44));
      return {
        ...steadyGlide([1.84, 1.24, -1.16], [1.46, 1.20, -1.72], [1.34, 0.96, 0.24], [1.14, 0.91, 0.12], k),
        fov: 45 + 3 * k,
        roll: 0,
        cInf: 10,
        focusPoint: mixV3([1.34, 0.96, 0.24], [1.12, 0.90, 0.08], k),
      };
    },
  },

  // ======================== S3: JAVA TOPOGRAPHY, GARUT 1923 PENDOPO, & 1958 STAGE (f=1492..2088) ========================
  {
    id: 14,
    name: "S3_14_JavaAerialToPriangan",
    a: 1492,
    b: 1652,
    set: "C_PRIANGAN_MAP",
    light: "priangan_sunset",
    shadowRadius: 20,
    // Beat #22: Aerial tracking sweep following glowing golden expedition route across Java toward Priangan Garut
    cam: (_f, _dt, u) => ({
      ...steadyGlide([2.8, 4.7, 4.7], [-0.38, 2.15, 2.65], [0.65, 0.25, 0.25], [-1.05, 0.48, -0.18], u),
      fov: 42,
      roll: 0,
      cInf: 7,
      focusPoint: [0.5 - u * 1.50, 0.35, 0.2 - u * 0.36],
    }),
  },
  {
    id: 15,
    name: "S3_15_Garut1923PendopoPlaque",
    a: 1652,
    b: 1765,
    set: "C_PRIANGAN_MAP",
    light: "priangan_sunset",
    shadowRadius: 14,
    // Beat #23: Heroic reveal of 1923 Cabang Perintis plaque AND rising 3D Miniature Garut 1923 Pendopo building
    cam: (_f, dt) => ({
      ...pushExp([-0.80, 1.24, 3.04], [-0.96, 0.68, -0.14], dt, 0.0015),
      fov: 45,
      roll: 0,
      cInf: 9,
      focusPoint: [-0.96, 0.69, -0.14],
    }),
  },
  {
    id: 16,
    name: "S3_16_Sepia1923PioneerVeranda",
    a: 1765,
    b: 1903,
    set: "C_PRIANGAN_MAP",
    light: "archive_mono",
    shadowRadius: 12,
    // Beat #24: Wide two-shot of both pioneers + full wall chronicle (no edge clipping); slow dolly-in, centred between them
    cam: (_f, _dt, u) => ({
      ...steadyGlide([-2.58, 1.40, 4.15], [-2.44, 1.38, 3.70], [-2.56, 1.30, -0.65], [-2.46, 1.28, -0.65], u),
      fov: 45,
      roll: 0,
      cInf: 8,
      focusPoint: [-2.52, 1.28, -0.65],
    }),
  },
  {
    id: 17,
    name: "S3_17_Konferensi1958Stage",
    a: 1903,
    b: 2088,
    set: "C_PRIANGAN_MAP",
    light: "priangan_sunset",
    shadowRadius: 14,
    // Beats #25-#26: Dynamic 1958 stage -> slow upward hero push onto orator gesture, 1958 banner & igniting summit torch
    cam: (_f, _dt, u) => {
      const k = minJerk(clamp01((u - 0.34) / 0.52));
      return {
        ...steadyGlide([-0.86, 1.36, 1.48], [-0.94, 1.52, 0.98], [-1.07, 1.34, -1.65], [-1.07, 1.56, -1.65], k),
        fov: 46 - 1.5 * k,
        roll: 0,
        cInf: 9,
        focusPoint: [-1.07, 1.34 + 0.22 * k, -1.55],
      };
    },
  },

  // ======================== S4: PANAWUAN NETWORK, PDPM PODIUM, & GALANG LANTERN (f=2088..2876) ========================
  {
    id: 18,
    name: "S4_18_BranchNetworkPinboard",
    a: 2088,
    b: 2294,
    set: "D_PANAWUAN",
    light: "panawuan_dusk",
    shadowRadius: 9,
    // Beats #27-#28: Full unclipped kader face & quill hand alongside slanted Branch Ranting Network Board pulsing alive
    cam: (_f, _dt, u) => ({
      ...steadyGlide([-0.76, 1.28, 1.78], [-0.58, 1.24, 1.58], [-0.03, 0.98, -0.55], [0.03, 0.98, -0.55], u),
      fov: 47,
      roll: 0,
      cInf: 10,
      focusPoint: [0.0, 0.98, -0.55],
    }),
  },
  {
    id: 19,
    name: "S4_19_PanawuanPlaqueTarogong",
    a: 2294,
    b: 2452,
    set: "D_PANAWUAN",
    light: "panawuan_dusk",
    shadowRadius: 9,
    // Beat #29: "Di Tarogong Kidul, PC IPM Panawuan..." — unclipped wall plaque illuminating TM & PDPM program schematic
    cam: (_f, dt) => ({
      ...pushExp([-1.12, 1.44, 1.70], [-1.35, 1.54, -2.84], dt, 0.0012),
      fov: 43,
      roll: 0,
      cInf: 10,
      focusPoint: [-1.35, 1.54, -2.84],
    }),
  },
  {
    id: 20,
    name: "S4_20_PanawuanPDPMTrainingStage",
    a: 2452,
    b: 2612,
    set: "D_PANAWUAN",
    light: "panawuan_dusk",
    shadowRadius: 10,
    // Beat #30: "...lewat Taruna Melati dan pelatihan da'i pelajar." — kader speaking at 3D Mimbar Dakwah podium
    cam: (_f, dt) => ({
      ...pushExp([-0.22, 1.28, 1.78], [0.60, 1.16, -1.45], dt, 0.0013),
      fov: 43,
      roll: 0,
      cInf: 9,
      focusPoint: [0.60, 1.16, -1.45],
    }),
  },
  {
    id: 21,
    name: "S4_21_GalangLanternTwilight",
    a: 2612,
    b: 2876,
    set: "D_PANAWUAN",
    light: "panawuan_dusk",
    shadowRadius: 12,
    // Beats #31-#32: Galang turns once beside open twilight window while brass sill lantern ignites on "merawat api ini tetap menyala"
    cam: (_f, dt) => ({
      ...pushExp([0.64, 1.18, 0.64], [0.46, 1.12, -2.25], dt, 0.0009),
      fov: 43,
      roll: 0,
      cInf: 8,
      focusPoint: [0.46, 1.10, -2.02],
    }),
  },
];

export function shot3DAt(f: number): SubShot3D {
  return SHOTS_3D.find((s) => f >= s.a && f < s.b) ?? SHOTS_3D[SHOTS_3D.length - 1];
}

export function cam3DAt(s: SubShot3D, f: number): CamPose3D {
  const dt = Math.max(0, f - s.a);
  const u = clamp01(dt / Math.max(1, s.b - s.a));
  return s.cam(f, dt, u);
}
