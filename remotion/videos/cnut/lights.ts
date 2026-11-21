// Light presets per time of day. The sun is CAMERA-RELATIVE and frozen per shot (world.ts update()):
// az = degrees from the shot camera's forward axis (0 = sun straight ahead = backlight, +90 = screen right,
// 180 = behind camera), el = elevation. lit/shade/lift are LINEAR RGB multipliers for shade.ts (may exceed 1).
// Field names follow lighting.md 9.1 exactly (the CHAR and POST agents read them); values are tuned on renders.
type C3 = [number, number, number];
export type LightPreset = {
  az: number; el: number;
  lit: C3; shade: C3; lift: C3; lambert: number; sideK: number; term: number;      // world two-tone (shade.ts)
  charTint: C3; charShade: number; charGrad: number; bodyGrad: number; sideTint: C3; // character cards (cast.ts)
  blob: C3; actorShadow: boolean;                                                    // contact blobs / card shadows
  top: string; hor: string; skyCurve: C3; fog: string; fogNear: number; fogFar: number; sunDisc: string; // depth.md 6.5
  sunCol: string; sunI: number; sky: string; ground: string; hemiI: number;         // three lights (unpatched mats only)
  bias: number; normalBias: number;
};
export const LIGHTS: Record<"day" | "golden", LightPreset> = {
  day: {
    az: 62, el: 32,
    lit: [1.62, 1.54, 1.35], shade: [0.26, 0.26, 0.34], lift: [0.04, 0.05, 0.10], lambert: 0.34, sideK: 0.86, term: 0.2,
    charTint: [1.02, 0.96, 0.92], charShade: 0.84, charGrad: 0.08, bodyGrad: 0.22, sideTint: [0.94, 0.96, 1.06],
    blob: [0.55, 0.52, 0.54], actorShadow: true,
    top: "#3878cc", hor: "#b0cceb", skyCurve: [0.0, 0.5, 0.6], fog: "#b0cceb", fogNear: 35, fogFar: 360, sunDisc: "#000000",
    sunCol: "#fff2dc", sunI: 3.2, sky: "#d6e8ff", ground: "#ad9270", hemiI: 0.45,
    bias: -0.0003, normalBias: 0.018,
  },
  golden: {
    az: 12, el: 9,
    lit: [1.55, 0.72, 0.26], shade: [0.14, 0.14, 0.28], lift: [0.04, 0.05, 0.16], lambert: 0.36, sideK: 0.84, term: 0.07,
    charTint: [1.02, 0.76, 0.52], charShade: 0.86, charGrad: 0.12, bodyGrad: 0.26, sideTint: [0.88, 0.82, 0.98],
    blob: [0.72, 0.70, 0.88], actorShadow: true,
    top: "#644a86", hor: "#ffca82", skyCurve: [0.05, 0.6, 1.0], fog: "#eca87c", fogNear: 60, fogFar: 420, sunDisc: "#ffcf9e",
    sunCol: "#ffa552", sunI: 5.8, sky: "#d4aab4", ground: "#846258", hemiI: 0.42,
    bias: -0.0006, normalBias: 0.03,
  },
};

/** world-only look per light (sky stops by elevation in degrees, river colours, cloud palette). All colours are
 *  ON-SCREEN targets under the current PBR-Neutral tone map; world.ts pre-inverts the tone map (shade.ts untone). */
export type WorldLook = {
  sky: { c: string[]; e: number[] };                         // 5 stops: c[i] at elevation e[i] (deg), smoothstep between
  water: { near: string; mid: string; far: string; crest: string; trough: string; glint: string; shade: C3 };
  bounce: C3;                                                 // shade.ts uBounce: albedo x bounce on shaded faces turned to the lens
  sat: number;                                                // shade.ts uSat: world albedo saturation (1 = as painted)
  cloud: { lit: string; mid: string; shade: string };
};
export const LOOK: Record<"day" | "golden", WorldLook> = {
  day: {
    // depth.md 2.2: horizon #9fb6e6 just above the skyline, upper sky #5e93d9 at ~20 deg (grade: frame top #5997e2)
    sky: { c: ["#b8d0ec", "#9cbfea", "#6a9fe0", "#4f8cdb", "#3373cc"], e: [0, 3, 8, 16, 40] },
    water: { near: "#22a7b6", mid: "#167fb2", far: "#1a5596", crest: "#7ddfe8", trough: "#0e4a80", glint: "#ffffff", shade: [0.5, 0.56, 0.72] },
    cloud: { lit: "#fbf8f1", mid: "#e1e5f3", shade: "#c3cbe9" },
    bounce: [0, 0, 0],
    sat: 1.08,
  },
  golden: {
    // sunset, not dusk: #ffd08a horizon, peach/orange through ~10 deg, warm rose at 20, muted warm mauve only near the top
    // (the golden grade adds ~+11/255 blue to shadows/mids, so these lean warm)
    sky: { c: ["#ffc47c", "#f7ae78", "#e8967c", "#c4848e", "#8a6f8a"], e: [0, 4, 10, 20, 40] },
    water: { near: "#1e3a6e", mid: "#355f96", far: "#d4a48e", crest: "#d9a088", trough: "#16294f", glint: "#ffe2b0", shade: [0.42, 0.46, 0.72] },
    cloud: { lit: "#ffd2a8", mid: "#f2a08f", shade: "#a98fc4" },
    bounce: [0.04, 0.02, 0.0],
    sat: 1.1,
  },
};
