// Story definition for "What If UMR Garut 10 Juta":
// 3 cinematic cartoon shots timed to Indonesian voiceover (6.67s @ 30fps = 200 frames).

export const FPS = 30;
export const GARUT_FRAMES = 200;

export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;

export type Cam = { pos: V3; look: V3; fov?: number; roll?: number };

export type ShotDef = {
  id: number;
  name: string;
  a: number;
  b: number;
  light: "day" | "golden";
};

export const SHOTS: ShotDef[] = [
  { id: 1, name: "gate_reveal", a: 0, b: 75, light: "day" },
  { id: 2, name: "jakarta_rush", a: 75, b: 135, light: "day" },
  { id: 3, name: "domba_sultan", a: 135, b: GARUT_FRAMES, light: "golden" },
];

export const shotAt = (f: number): ShotDef =>
  SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];

const pushK = (f: number, f0: number, rate: number) => {
  const x = Math.max(0, f - f0);
  return Math.exp(-rate * x);
};

const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Cam => ({
  pos: [
    look[0] + (pos[0] - look[0]) * k,
    look[1] + (pos[1] - look[1]) * k,
    look[2] + (pos[2] - look[2]) * k,
  ],
  look,
  ...rest,
});

export const camAt = (id: number, f: number): Cam => {
  if (id === 1) {
    // Shot 1: Arrival of Jakarta traveler at the Garut 10 Juta milestone
    const k = pushK(f, 0, 0.002);
    return dolly([-0.1, 1.82, -7.8], [-0.1, 1.65, -3.2], k, { fov: 40, roll: -0.01 });
  }
  if (id === 2) {
    // Shot 2: Dynamic low-angle 3/4 tracking shot along the cobblestone avenue
    const k = pushK(f, 75, 0.0028);
    return dolly([1.6, 1.15, -2.4], [-0.1, 1.25, 3.6], k, { fov: 38, roll: 0.015 });
  }
  // Shot 3: Hero push-in into the majestic Sultan Garut 10JT on the royal red carpet
  const k = pushK(f, 135, 0.0032);
  return dolly([0.0, 1.72, 4.6], [0.0, 1.65, 0.4], k, { fov: 35, roll: -0.015 });
};

export const dofAt = (id: number, f: number) => {
  if (id === 1) return { focus: 4.9, cInf: 8 }; // Hero sharp, distant hills soft
  if (id === 2) return { focus: 4.8, cInf: 12 }; // Commuters sharp, buildings blurred
  return { focus: 4.1, cInf: 14 }; // Sultan portrait sharp, mountain sunset bokeh
};
