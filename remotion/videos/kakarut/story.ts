export const FPS = 30;
export const TOTAL = 968;
export const D0 = 0;

export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};

export type Light = "day" | "golden";
export type ShotDef = {
  id: number;
  a: number; // start frame
  b: number; // end frame
  light: Light;
  name: string;
};

export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 240, light: "day", name: "Cimanuk Trekking" },
  { id: 2, a: 240, b: 510, light: "day", name: "Kakarut Duri!" },
  { id: 3, a: 510, b: 760, light: "golden", name: "Meneer Garoet" },
  { id: 4, a: 760, b: TOTAL, light: "day", name: "Lahirnya Garut" },
];

export const shotAt = (f: number): ShotDef =>
  SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];

export const layersAt = (f: number): { id: number; alpha: number }[] => {
  return [{ id: shotAt(f).id, alpha: 1 }];
};

export type Cam = { pos: V3; look: V3; fov: number };

export const camAt = (f: number): Cam => {
  const s = shotAt(f);
  const u = clamp01((f - s.a) / Math.max(1, s.b - s.a));

  switch (s.id) {
    case 1:
      // Slow push-in tracking the two characters walking along riverbank
      return {
        pos: [0 + u * 0.5, 2.2 - u * 0.2, 7.5 - u * 1.2],
        look: [0, 1.4, 0],
        fov: 38,
      };
    case 2:
      // Medium shot of Ki Sunda reacting to the thorn bush
      return {
        pos: [-0.4, 1.7, 5.0 - u * 0.8],
        look: [-0.4, 1.35, 0],
        fov: 34,
      };
    case 3:
      // Close-up on Meneer Belanda taking notes
      return {
        pos: [0.6, 1.8, 4.8 - u * 0.6],
        look: [0.5, 1.4, 0],
        fov: 32,
      };
    case 4:
    default:
      // Wide celebratory view with the newly erected signpost
      return {
        pos: [0, 2.0 - u * 0.1, 6.8 - u * 0.6],
        look: [0, 1.3, 0],
        fov: 36,
      };
  }
};

export const dofAt = (f: number) => {
  const s = shotAt(f);
  switch (s.id) {
    case 2:
      return { focus: () => [-0.4, 1.35, 0] as V3, cInf: 22 };
    case 3:
      return { focus: () => [0.5, 1.4, 0] as V3, cInf: 20 };
    default:
      return { focus: () => [0, 1.3, 0] as V3, cInf: 16 };
  }
};
