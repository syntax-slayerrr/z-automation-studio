// Timeline of the bridge short: shots timed to the the voice words (~/bridge-short/voice/words.json),
// story physics (column position, march phase, deck bounce, collapse) and the camera grammar measured in the
// reference study: continuous slow push-ins; symmetric ease-in-out moves ~23 f (10 in / 10 out), peak ~15 px/f at 720p;
// big reframes are cuts; impacts are 7-frame kicks that flip sign every frame; no hand-held float.
export const FPS = 30;
export const TOTAL = 1882;
export const D0 = 6.0; // bank top + deck height (m)
export const HALF = 27; // towers at z = +-27, span 54 m
export const FILES = [-1.65, -0.55, 0.55, 1.65];
export const ROW_GAP = 1.3;
export const COUNT = 74;
export const PARK: V3 = [70, D0, -75]; // swing pivot base (x, ground y, z)
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;
const lin = (pts: [number, number][], x: number) => {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return pts[pts.length - 1][1];
};

// ---------------- story physics (tau = story time in seconds) ----------------
export const front = (tau: number) => 26 - 1.6 * (tau - 4.4); // z of the front row, marching toward -z
export const marchPhase = (tau: number) => ((tau % 1) + 1) % 1; // 1 Hz cycle = 2 steps/s, footfalls at 0 and 0.5
export const SNAP = 34.62, DROP0 = 36.35, DROP1 = 36.95;
export const amp = (tau: number) =>
  lin([[14.85, 0], [17.8, 0.07], [21.4, 0.13], [27.4, 0.26], [33.0, 0.46], [SNAP, 0.55], [SNAP + 0.35, 0.0]], tau);
export const stomp = (tau: number) => lin([[21.4, 1.0], [27.4, 1.35], [33, 1.5]], tau); // "a little harder every step"
export const shapeZ = (z: number) => (Math.abs(z) < HALF ? Math.cos((Math.PI * z) / (2 * HALF)) : 0);
export const dropW = (z: number) => smooth((20 - z) / 26); // 1 on the near half, 0 at the far tower
export const dropU = (tau: number) => (tau < DROP0 ? 0 : Math.min(1, ((tau - DROP0) / (DROP1 - DROP0)) ** 2));
export const DROP_H = 6.6;

export type BridgeState = { bounce: number; drop: number; snap: number; collapsed: boolean };
export const deckY = (z: number, b: BridgeState) => D0 + b.bounce * shapeZ(z) - b.drop * DROP_H * dropW(z);

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Crowd = "march" | "fall" | "water" | "bank" | "tourists" | "none";
export type ShotDef = { id: number; a: number; b: number; light: Light; crowd: Crowd; tau: (t: number) => number; towns?: boolean };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 186, light: "day", crowd: "none", tau: (t) => t },
  { id: 2, a: 186, b: 335, light: "day", crowd: "none", tau: (t) => t },
  { id: 3, a: 335, b: 637, light: "day", crowd: "none", tau: (t) => t },
  { id: 4, a: 637, b: 865, light: "day", crowd: "none", tau: (t) => t },
  { id: 5, a: 865, b: 1026, light: "day", crowd: "none", tau: (t) => t },
  { id: 6, a: 1026, b: 1127, light: "day", crowd: "none", tau: (t) => t },
  { id: 7, a: 1127, b: 1228, light: "golden", crowd: "none", tau: (t) => t },
  { id: 8, a: 1228, b: 1480, light: "golden", crowd: "none", tau: (t) => t },
  { id: 9, a: 1480, b: 1597, light: "golden", crowd: "none", tau: (t) => t },
  { id: 10, a: 1597, b: 1724, light: "golden", crowd: "none", tau: (t) => t },
  { id: 11, a: 1724, b: TOTAL, light: "day", crowd: "none", tau: (t) => t },
];
/** hard cuts for all shots: eliminates multi-WebGL canvas stacking and context loss */
export const XFADE: Record<number, number> = {};
export const FLASH_AT = 186;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
/** layers to draw at frame f: base shot, plus the next shot fading in during a crossfade */
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

export const bridgeState = (id: number, t: number): BridgeState => {
  const s = SHOTS[id - 1];
  const tau = s.tau(t);
  if (id === 9 || id === 10 || id === 14) return { bounce: 0, drop: 1, snap: 1, collapsed: true };
  if (id === 11) return { bounce: 0.75 * Math.sin(2 * Math.PI * 0.7 * (t - 43.4)), drop: 0, snap: 0, collapsed: false };
  if (id === 12 || id === 15) return { bounce: 0, drop: 0, snap: 0, collapsed: false };
  const bounce = -amp(tau) * Math.cos(4 * Math.PI * marchPhase(tau));
  if (id === 8) return { bounce, drop: dropU(tau), snap: clamp01((tau - SNAP) / 0.7), collapsed: tau >= DROP1 };
  return { bounce, drop: 0, snap: 0, collapsed: false };
};

// ---------------- camera ----------------
// Grammar (motion.md): every move is a symmetric smootherstep glide of 18-40 f (peak speed = 1.875 x distance / dur,
// so dur >= 0.075 x the move in 720p px keeps the peak near the reference 14-25 px/f); a reframe bigger than about
// half a frame width or 40 % zoom is a hard cut on its key frame. Glides are centred on the old key frame (the
// whoosh in the sound mix peaks there), so a glide key starts dur/2 earlier. Holds push in (dolly toward the look
// point or a fov zoom near walls/towers): 0.15-0.35 %/f, ~0.6 %/f for ~35 f on the punch words. Rolls of 4-8 deg
// over >= 18 f on emphasis beats, held tilt <= 0.07 rad.
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };
/** reference camera ease: symmetric smootherstep (attack = release, ~10 f each on a 23 f move) */
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
const mix = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): Cam => ({ fov: 40, roll: 0, ...c });
const run = (keys: Key[], f: number) => {
  let cur = full(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? full(k.s(f)) : mix(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 24)));
  }
  return cur;
};
const T = (f: number) => f / FPS;
const Fz = (id: number, f: number) => front(SHOTS[id - 1].tau(T(f)));
/** push-in factor since f0: the subject grows ~rate per frame; `punch` raises it (with 8 f soft edges) for the first n frames */
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 35) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
/** dolly push: camera slides toward the look point by factor k */
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
/** zoom push (camera stays put, for lenses next to towers / houses): tan(fov/2) shrinks by k */
const zoom = (pos: V3, look: V3, fov: number, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos, look, fov: (360 / Math.PI) * Math.atan(Math.tan((fov * Math.PI) / 360) * k), ...rest });
/** a roll-only move on top of an existing framing */
const rolled = (s: (f: number) => Shot, roll: number) => (f: number): Shot => ({ ...s(f), roll });

// near-left anchorage where the bolt lives, and the free end of the snapped backstay
export const ANCHOR: V3 = [-2.7, D0 + 0.62, -37];
export const snapEnd = (snap: number): V3 => {
  const u = easeOut(snap);
  return [ANCHOR[0] - 0.6 * u, ANCHOR[1] + 5.5 * u - 2.0 * u * u, ANCHOR[2] + 4.5 * u];
};

// ---- Cnut framings (f -> camera); each pushes in from the frame its key starts ----
// Shot 1 (0 - 186): High-Wide 3/4 crane glide descending smoothly to eye-level on the empty golden throne
const S1 = (f: number) => {
  const u = clamp01(f / 186);
  const pK = pushK(f, 0, 0.0016);
  const basePos: V3 = [
    1.6 - 1.2 * u,
    D0 + 2.4 - 0.95 * u,
    -37.0 + 2.6 * u,
  ];
  const look: V3 = [0.0, D0 + 1.15, -31.2];
  return dolly(basePos, look, pK, { fov: 44 - 4 * u, roll: -0.02 + 0.03 * u });
};

// Shot 2 (186 - 335): Istana 1028: Balanced Royal Three-Shot framing King Cnut and both courtiers
const S2 = (f: number) =>
  dolly([0.0, D0 + 1.35, -35.2], [0.0, D0 + 1.25, -31.2], pushK(f, 186, 0.0015), { fov: 42, roll: 0.0 });

// Shot 3 (335 - 637): Flattery dialogue with clean cinematic cut on Minister 2
// Shot 3a (335 - 455): Over-shoulder Medium on flattering Minister 1
const S3a = (f: number) =>
  dolly([0.72, D0 + 1.32, -34.2], [-0.15, D0 + 1.25, -31.3], pushK(f, 335, 0.0018), { fov: 38, roll: 0.02 });
// Shot 3b (455 - 637): Clean hard cut to dynamic Two-Shot of Minister 2 with punch-in on "penguasa segalanya"
const S3b = (f: number) =>
  dolly([-0.50, D0 + 1.35, -34.8], [0.15, D0 + 1.28, -31.2], pushK(f, 455, 0.0018, 0.006, 32), { fov: 40, roll: -0.02 });

// Shot 4 (637 - 865): Procession carrying the throne to the seaside
// Shot 4a (637 - 750): Steady side tracking shot moving with the procession
const S4a = (f: number) =>
  dolly([1.75, D0 + 1.45, -35.4], [0.15, D0 + 1.18, -31.4], pushK(f, 637, 0.0018), { fov: 40, roll: -0.02 });
// Shot 4b (750 - 865): Low ground-level tracking cut on boots splashing in wet sand & throne legs
const S4b = (f: number) =>
  dolly([-0.55, D0 + 0.60, -33.6], [0.0, D0 + 0.78, -31.1], pushK(f, 750, 0.0022), { fov: 36, roll: 0.02 });

// Shot 5 (865 - 1026): Hero low-angle looking up from shoreline at King Cnut raising scepter
const S5 = (f: number) =>
  dolly([0.0, D0 + 0.85, -34.6], [0.0, D0 + 1.48, -31.0], pushK(f, 865, 0.0018), { fov: 40, roll: 0.0 });

// Shot 6 (1026 - 1127): Dramatic Close-Up on King shouting "Wahai ombak!" with punch-in on "Wahai"
const S6 = (f: number) =>
  dolly([0.0, D0 + 1.45, -33.6], [0.0, D0 + 1.48, -31.0], pushK(f, 1026, 0.0022, 0.006, 30), { fov: 36, roll: 0.015 });

// Shot 7 (1127 - 1228): Single continuous upward tilt looking up into the colossal wave wall
const S7 = (f: number) => {
  const u = clamp01((f - 1127) / 101);
  const pK = pushK(f, 1127, 0.0018);
  const pos: V3 = [0.0, D0 + 0.85 + 0.25 * u, -35.6 + 0.6 * u];
  const look: V3 = [0.0, D0 + 2.1 + 1.1 * u, -28.5];
  return dolly(pos, look, pK, { fov: 46 - 2 * u, roll: 0.02 });
};

// Shot 8 (1228 - 1480): Explosive wave impact shockwave -> reverse angle through spray showing drenched king & tumbled ministers
const S8a = (f: number) =>
  dolly([-0.35, D0 + 1.15, -26.8], [0.0, D0 + 1.25, -31.1], pushK(f, 1228, 0.0022), { fov: 44, roll: -0.04 });
const S8b = (f: number) =>
  dolly([0.55, D0 + 1.05, -26.2], [0.0, D0 + 1.15, -31.2], pushK(f, 1330, 0.0016), { fov: 42, roll: 0.02 });

// Shot 9 (1480 - 1597): Medium shot focused on shivering courtiers
const S9 = (f: number) =>
  dolly([-0.35, D0 + 1.20, -34.6], [-0.45, D0 + 1.05, -31.3], pushK(f, 1480, 0.0018), { fov: 38, roll: -0.02 });

// Shot 10 (1597 - 1724): Hero reaction shot pushing in steadily on smiling King Cnut
const S10 = (f: number) =>
  dolly([0.45, D0 + 1.42, -34.2], [0.0, D0 + 1.35, -31.0], pushK(f, 1597, 0.002), { fov: 35, roll: 0.015 });

// Shot 11 (1724 - 1882): Ground close-up of crown on empty throne -> Epic Sky Crane out to the horizon
const S11a = (f: number) =>
  dolly([0.25, D0 + 0.95, -32.8], [0.32, D0 + 0.92, -31.0], pushK(f, 1724, 0.0015), { fov: 34 });
const S11b = (f: number) => {
  const u = clamp01((f - 1775) / 107);
  const easeU = smooth(u);
  return {
    pos: [0, D0 + 1.5 + 5.8 * easeU, -33.5 - 12.0 * easeU] as V3,
    look: [0, D0 + 0.9, -29.0] as V3,
    fov: 34 + 10 * easeU,
    roll: 0,
  };
};

const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1 }],
  2: [{ f: 186, s: S2 }],
  3: [
    { f: 335, s: S3a },
    { f: 455, cut: true, s: S3b },
  ],
  4: [
    { f: 637, s: S4a },
    { f: 750, cut: true, s: S4b },
  ],
  5: [{ f: 865, s: S5 }],
  6: [{ f: 1026, s: S6 }],
  7: [{ f: 1127, s: S7 }],
  8: [
    { f: 1228, s: S8a },
    { f: 1330, cut: true, s: S8b },
  ],
  9: [{ f: 1480, s: S9 }],
  10: [{ f: 1597, s: S10 }],
  11: [
    { f: 1724, s: S11a },
    { f: 1775, cut: true, s: S11b },
  ],
};

// impact kicks: wave impact around 40.9s (frame 1228) with multiple shockwaves
const KICKS: [number, number][] = [
  [40.93, 3.8],
  [41.25, 2.5],
  [41.55, 1.8],
  [41.9, 1.0],
];
export const kickAt = (t: number) => {
  let a = 0;
  for (const [t0, g] of KICKS) {
    const n = Math.floor((t - t0) * FPS + 1e-6);
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};
export const camAt = (id: number, f: number): Cam => {
  const c = run(CAMS[id] ?? CAMS[1], f), a = kickAt(T(f));
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
};
export const keyEnd = (id: number, f: number) => {
  let e = 0;
  const keys = CAMS[id] ?? CAMS[1];
  for (const k of keys) if (f >= k.f) e = k.f + (k.cut ? 0 : k.dur ?? 24);
  return Math.max(f, e);
};

export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
export const DOF: Dof[] = [
  { f: 0, cInf: 16 },
  { f: 186, cInf: 18 },
  { f: 335, cInf: 18 },
  { f: 455, cInf: 16 },
  { f: 637, cInf: 14 },
  { f: 750, cInf: 16 },
  { f: 865, cInf: 20 },
  { f: 1026, cInf: 22 },
  { f: 1127, cInf: 6 },
  { f: 1228, cInf: 16 },
  { f: 1330, cInf: 18 },
  { f: 1480, cInf: 18 },
  { f: 1597, cInf: 20 },
  { f: 1724, cInf: 18 },
  { f: 1775, dur: 45, cInf: 0 },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
export const focusAt = (id: number, f: number): V3 => {
  const d = dofAt(f);
  return d.focus ? d.focus(f) : camAt(id, f).look;
};

export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [];
