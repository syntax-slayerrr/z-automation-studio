import {Easing, interpolate, spring, SpringConfig} from 'remotion';

/** Preset easing. Jangan pernah memakai gerak linear untuk elemen yang terlihat. */
export const ease = {
  out: Easing.bezier(0.16, 1, 0.3, 1), // masuk cepat, mendarat lembut (default)
  inOut: Easing.bezier(0.65, 0, 0.35, 1), // perpindahan A ke B
  in: Easing.bezier(0.7, 0, 0.84, 0), // keluar
  soft: Easing.bezier(0.33, 1, 0.68, 1), // gerak halus objek
  camera: Easing.bezier(0.4, 0, 0.2, 1), // push-in / pan
};

/** Spring untuk objek yang "punya massa". */
export const springs = {
  character: {damping: 14, stiffness: 120, mass: 0.8},
  object: {damping: 18, stiffness: 100, mass: 1},
  heavy: {damping: 22, stiffness: 80, mass: 1.4},
  camera: {damping: 200},
} satisfies Record<string, Partial<SpringConfig>>;

type Easer = (t: number) => number;

/**
 * Tween bernilai dari frame.
 * tween(frame, [mulaiFrame, akhirFrame], [nilaiAwal, nilaiAkhir], ease.out)
 */
export const tween = (
  frame: number,
  frames: [number, number],
  values: [number, number],
  easing: Easer = ease.out,
): number =>
  interpolate(frame, frames, values, {
    easing,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

/** Spring 0 -> 1 dengan delay (dalam frame). */
export const pop = (
  frame: number,
  fps: number,
  delay = 0,
  config: Partial<SpringConfig> = springs.object,
): number => spring({frame: Math.max(0, frame - delay), fps, config});
