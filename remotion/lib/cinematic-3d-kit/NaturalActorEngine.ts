/**
 * NaturalActorEngine — Deterministic 12-Principles Animation Toolkit (Frame-Driven, Zero-Drift)
 *
 * Distilled from frame-by-frame REA of `galeri-motion-voxelverse.mp4` (`60fps` pure-code Remotion):
 *  1. Spine-Lead & Successive Breaking of Joints (torso initiates 0.10–0.18s before limbs)
 *  2. Asymmetric L/R Phase Lag (hands/arms/brows never move like mirrored pistons)
 *  3. Moving Holds with Overshoot & Settle (no frozen mannequin frames!)
 *  4. Periodic Weight Shifts during idle, typing, and talking (every 2.5–4.5s)
 *  5. Micro-Expression Sync (involuntary blinks + auto-blink on head turn + organic eye saccades)
 *  6. Volume-Preserving Squash & Stretch for solid grounded mascots
 */

export const clamp = (v: number, min = 0, max = 1): number =>
  Math.min(max, Math.max(min, v));

export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * clamp(t, 0, 1);

export const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = clamp((x - edge0) / Math.max(1e-5, edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

export const easeInOutCubic = (x: number): number => {
  const t = clamp(x, 0, 1);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

export const easeOutCubic = (x: number): number => {
  const t = clamp(x, 0, 1);
  return 1 - Math.pow(1 - t, 3);
};

export const easeOutQuart = (x: number): number => {
  const t = clamp(x, 0, 1);
  return 1 - Math.pow(1 - t, 4);
};

/**
 * Springy overshoot-and-settle curve (0 -> ~1.08 -> 1.0) for lively, weighty gestures.
 */
export function overshootSettle(u: number, overshoot = 0.08): number {
  const t = clamp(u, 0, 1);
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const c1 = 1.70158 * (overshoot / 0.1);
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export interface Keyframe1D {
  t: number;
  v: number;
  ease?: "linear" | "smooth" | "easeOut" | "overshoot";
}

/**
 * Evaluates a deterministic 1D keyframe track cleanly at any continuous time `t` (seconds).
 */
export function evalTrack(t: number, keys: Keyframe1D[]): number {
  if (keys.length === 0) return 0;
  if (t <= keys[0].t) return keys[0].v;
  const last = keys[keys.length - 1];
  if (t >= last.t) return last.v;

  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (t >= a.t && t <= b.t) {
      const raw = (t - a.t) / Math.max(1e-5, b.t - a.t);
      const mode = b.ease ?? "smooth";
      const k =
        mode === "linear"
          ? raw
          : mode === "easeOut"
          ? easeOutCubic(raw)
          : mode === "overshoot"
          ? overshootSettle(raw, 0.085)
          : easeInOutCubic(raw);
      return a.v + (b.v - a.v) * k;
    }
  }
  return last.v;
}

/**
 * Deterministic multi-harmonic pseudo-organic sway (feels alive, never robotic single-sine).
 */
export function organicWave(t: number, freq = 1.0, seed = 0): number {
  return (
    Math.sin(t * freq * 1.0 + seed) * 0.58 +
    Math.sin(t * freq * 1.73 + seed * 1.9 + 1.1) * 0.28 +
    Math.cos(t * freq * 0.61 + seed * 0.7 + 2.4) * 0.14
  );
}

/**
 * Asymmetric L/R phase lag helper (`side = -1` left, `+1` right).
 * Breaks mirrored robotic symmetry by lagging one side cleanly by `lagSec` (`0.08–0.16s`).
 */
export function asymmetricTime(t: number, side: -1 | 1, lagSec = 0.12): number {
  return side < 0 ? Math.max(0, t - lagSec) : t;
}

/**
 * Natural human/mascot blink envelope (0 = open, 1 = closed).
 * Includes:
 *  - Non-uniform organic intervals (e.g. 2.8s, 4.1s, 3.3s — never metronomic!)
 *  - Asymmetric fast close (40%) + slightly softer reopen (60%)
 *  - Optional turn-triggered blink (`turnPulse` 0..1 when head turns rapidly!)
 */
export function computeNaturalBlink(
  t: number,
  seed = 0.4,
  turnPulse = 0
): number {
  // Two staggered prime-ratio intervals create natural irregular blink timing
  const c1 = ((t + seed) % 3.7) / 3.7;
  const c2 = ((t + seed * 2.3 + 1.9) % 5.9) / 5.9;
  const evalSingle = (phase: number, win: number) => {
    if (phase > win) return 0;
    const u = phase / win;
    // Fast close (0..0.38), gentle open (0.38..1.0)
    return u < 0.38
      ? Math.sin((u / 0.38) * (Math.PI / 2))
      : Math.cos(((u - 0.38) / 0.62) * (Math.PI / 2));
  };
  const b1 = evalSingle(c1, 0.044); // ~162ms blink
  const b2 = evalSingle(c2, 0.028); // ~165ms secondary blink
  return clamp(Math.max(b1, b2, turnPulse), 0, 1);
}

/**
 * Organic subtle eye saccades (micro-darts with fixations so eyes feel awake & focused,
 * never gliding slowly like a zombie and never frozen dead center!).
 */
export function computeNaturalSaccade(
  t: number,
  baseLookX: number,
  baseLookY: number,
  seed = 0,
  amp = 0.16
): { lookX: number; lookY: number; dartBlink: number } {
  const stepDur = 1.45;
  const idx = Math.floor((t + seed) / stepDur);
  const localU = ((t + seed) % stepDur) / stepDur;
  // Crisp fast dart over first 8% of interval, then steady fixation for 92%!
  const transition = easeOutQuart(clamp(localU / 0.085, 0, 1));

  const hash = (n: number, salt: number) => {
    const x = Math.sin(n * 12.9898 + salt * 78.233) * 43758.5453;
    return (x - Math.floor(x)) * 2 - 1;
  };

  const prevX = hash(idx - 1, seed + 1.1) * amp;
  const nextX = hash(idx, seed + 1.1) * amp;
  const prevY = hash(idx - 1, seed + 3.7) * amp * 0.55;
  const nextY = hash(idx, seed + 3.7) * amp * 0.55;

  const dx = Math.abs(nextX - prevX);
  const dartBlink = dx > amp * 1.15 && localU < 0.095 ? Math.sin((localU / 0.095) * Math.PI) * 0.72 : 0;

  return {
    lookX: clamp(baseLookX + lerp(prevX, nextX, transition), -1, 1),
    lookY: clamp(baseLookY + lerp(prevY, nextY, transition), -1, 1),
    dartBlink,
  };
}

/**
 * Periodic subtle whole-body weight shift so standing & seated characters always breathe with mass.
 */
export function computeWeightShift(
  t: number,
  cycleSec = 4.2,
  seed = 0
): {
  hipX: number;
  hipY: number;
  spineZ: number;
  spineY: number;
  shoulderRoll: number;
  headCounterZ: number;
} {
  const phase = (t + seed) / cycleSec;
  const shift =
    Math.sin(phase * Math.PI * 2) * 0.65 +
    Math.sin(phase * Math.PI * 4 + 0.9) * 0.20 +
    Math.cos(phase * Math.PI * 1.2 + 0.4) * 0.15;
  const breath = Math.sin(t * 1.75 + seed) * 0.5 + Math.sin(t * 0.85 + seed) * 0.2;

  return {
    hipX: shift * 0.018,
    hipY: breath * 0.006,
    spineZ: shift * 0.036,
    spineY: Math.sin(phase * Math.PI * 2 - 0.45) * 0.045,
    shoulderRoll: shift * 0.028,
    // Head counter-stabilizes horizon like real human vestibular balance!
    headCounterZ: -shift * 0.026,
  };
}

/**
 * Volume-preserving squash & stretch (`sx * sy * sz ≈ 1`) for solid cartoon/mascot weight.
 */
export function computeVolumeSquash(
  syInput: number,
  minSy = 0.76,
  maxSy = 1.24
): { sx: number; sy: number; sz: number } {
  const sy = clamp(syInput, minSy, maxSy);
  const sxz = 1 / Math.sqrt(sy);
  return { sx: sxz, sy, sz: sxz };
}

// ============================================================================
// MULTI-BEAT NATURAL HUMAN ACTING CLIPS (Inspired by `galeri-motion-voxelverse`)
// ============================================================================

export interface HumanTypingFlowState {
  torsoLeanX: number;
  torsoLeanZ: number;
  torsoTwistY: number;
  headYaw: number;
  headPitch: number;
  headRoll: number;
  handL: [number, number, number];
  handR: [number, number, number];
  isMouseReach: boolean;
}

/**
 * Natural desk typing clip with realistic 5.2s cycle:
 *  - Asynchronous two-handed keyboard typing (scanning left/right across keys)
 *  - Periodic organic weight shift + head tilt right + right hand sliding to mouse (`2.4s..3.7s`),
 *    clicking, then returning smoothly to keyboard! (Exact Voxelverse `5.35s–6.55s` natural acting!)
 */
export function evalHumanTypingFlow(t: number): HumanTypingFlowState {
  const cyc = ((t % 5.4) + 5.4) % 5.4;
  // Smooth bell for mouse-reach weight shift (`2.3s .. 3.85s`)
  const mouseIn = smoothstep(2.15, 2.55, cyc);
  const mouseOut = 1 - smoothstep(3.55, 4.05, cyc);
  const mouseW = mouseIn * mouseOut;

  const keyScanL = Math.sin(t * 2.9) * 0.024;
  const keyScanR = Math.cos(t * 3.3 + 0.7) * 0.026;
  // Asynchronous finger-tap micro-bobs (L & R out of phase, pauses on mouse!)
  const tapL = Math.sin(t * 14.5) * 0.013 + Math.sin(t * 9.2 + 1.1) * 0.006;
  const tapR = (Math.cos(t * 15.2 + 1.8) * 0.013 + Math.sin(t * 10.4) * 0.006) * (1 - mouseW);
  const mouseClick = mouseW * Math.max(0, Math.sin((cyc - 2.75) * 8.5)) * -0.008;

  return {
    torsoLeanX: 0.14 + Math.sin(t * 1.4) * 0.018 + mouseW * 0.055,
    torsoLeanZ: -0.01 + organicWave(t, 0.7, 0.3) * 0.018 - mouseW * 0.065,
    torsoTwistY: organicWave(t, 0.65, 1.2) * 0.032 - mouseW * 0.11,
    headYaw: organicWave(t, 0.9, 0.5) * 0.055 - mouseW * 0.18,
    headPitch: 0.14 + Math.sin(t * 1.2) * 0.022 + mouseW * 0.06,
    headRoll: organicWave(t, 0.75, 2.0) * 0.024 - mouseW * 0.12,
    // Calibrated cleanly above `deskTopY` (`0.76m`) so arched fingers kiss keys & mouse with ZERO desk clipping!
    handL: [-0.115 + keyScanL, 0.812 + tapL, 0.425 + Math.cos(t * 2.1) * 0.012],
    handR: [
      lerp(0.115 + keyScanR, 0.255, mouseW),
      lerp(0.812 + tapR, 0.802 + mouseClick, mouseW),
      lerp(0.425 + Math.sin(t * 2.4) * 0.012, 0.390, mouseW),
    ],
    isMouseReach: mouseW > 0.35,
  };
}

export interface HumanStretchRelaxState {
  torsoLeanX: number;
  torsoLeanZ: number;
  torsoTwistY: number;
  headYaw: number;
  headPitch: number;
  headRoll: number;
  handL: [number, number, number];
  handR: [number, number, number];
  mouthStretchOpen: number;
  browLiftAdd: number;
  lookXAdd: number;
  blinkPulse: number;
}

/**
 * Signature 2.6-second Multi-Beat Stretch & Asymmetric Recovery Acting Clip
 * Reverse-engineered 1:1 from `galeri-motion-voxelverse.mp4` (`8.40s – 10.90s`):
 *  - `0.00..0.38s`: Spine-lead anticipation (back straightens BEFORE arms rise)
 *  - `0.38..0.80s`: Fast ease-out overhead stretch + chest arch + subtle "ahh" mouth open
 *  - `0.80..1.45s`: Moving hold with overshoot settle + slow head turn toward viewer/companion
 *  - `1.45..2.35s`: Asymmetric recovery — right hand passes face/temple FIRST (`1.65s`),
 *                   left arm lags ~0.14s behind -> settle smoothly onto desk!
 */
export function evalHumanStretchRelax(clipSec: number): HumanStretchRelaxState {
  const c = ((clipSec % 2.8) + 2.8) % 2.8;

  const torsoLeanX = evalTrack(c, [
    { t: 0.0, v: 0.18 },
    { t: 0.32, v: 0.04, ease: "smooth" }, // Spine leads!
    { t: 0.76, v: -0.14, ease: "overshoot" }, // Chest arch at peak stretch!
    { t: 1.42, v: -0.10, ease: "smooth" }, // Moving hold
    { t: 2.15, v: 0.14, ease: "smooth" }, // Settle back forward
    { t: 2.8, v: 0.16, ease: "smooth" },
  ]);

  const torsoTwistY = evalTrack(c, [
    { t: 0.0, v: 0.08 },
    { t: 0.75, v: 0.02, ease: "smooth" },
    { t: 1.55, v: -0.06, ease: "smooth" },
    { t: 2.4, v: 0.0, ease: "smooth" },
  ]);

  const headYaw = evalTrack(c, [
    { t: 0.0, v: -0.22 },
    { t: 0.85, v: -0.16, ease: "smooth" },
    { t: 1.48, v: 0.06, ease: "smooth" }, // Turns toward companion during moving hold!
    { t: 2.25, v: 0.02, ease: "smooth" },
  ]);

  const headPitch = evalTrack(c, [
    { t: 0.0, v: 0.20 },
    { t: 0.78, v: -0.12, ease: "smooth" },
    { t: 1.48, v: -0.02, ease: "smooth" },
    { t: 2.18, v: 0.12, ease: "overshoot" },
  ]);

  const headRoll = evalTrack(c, [
    { t: 0.0, v: -0.06 },
    { t: 0.82, v: 0.08, ease: "smooth" },
    { t: 1.65, v: -0.07, ease: "smooth" },
    { t: 2.35, v: 0.0, ease: "smooth" },
  ]);

  // Right arm leads recovery by 0.14s: soft natural elbow bend overhead (visible in frame like Voxelverse!)
  const rY = evalTrack(c, [
    { t: 0.0, v: 0.815 },
    { t: 0.42, v: 1.08, ease: "smooth" },
    { t: 0.78, v: 1.35, ease: "overshoot" }, // Natural bent-elbow overhead stretch (hands stay cleanly in frame!)
    { t: 1.40, v: 1.32, ease: "smooth" },
    { t: 1.70, v: 1.07, ease: "smooth" }, // Natural recovery sweep past temple/cheek!
    { t: 2.22, v: 0.815, ease: "overshoot" },
  ]);
  const rX = evalTrack(c, [
    { t: 0.0, v: 0.16 },
    { t: 0.42, v: 0.24, ease: "smooth" }, // Sweeps wide OUTSIDE shoulder on the way up (zero ear/head graze!)
    { t: 0.78, v: 0.26, ease: "smooth" },
    { t: 1.40, v: 0.27, ease: "smooth" },
    { t: 1.70, v: 0.17, ease: "smooth" }, // Clean natural recovery clearance beside face!
    { t: 2.22, v: 0.16, ease: "smooth" },
  ]);
  const rZ = evalTrack(c, [
    { t: 0.0, v: 0.41 },
    { t: 0.78, v: 0.16, ease: "smooth" },
    { t: 1.40, v: 0.18, ease: "smooth" },
    { t: 1.70, v: 0.32, ease: "smooth" }, // Generous forward clearance from face!
    { t: 2.22, v: 0.42, ease: "smooth" },
  ]);

  // Left arm lags cleanly behind right arm by ~0.14s (anti-mirror!)
  const cL = Math.max(0, c - 0.14);
  const lY = evalTrack(cL, [
    { t: 0.0, v: 0.815 },
    { t: 0.44, v: 1.06, ease: "smooth" },
    { t: 0.80, v: 1.33, ease: "overshoot" },
    { t: 1.42, v: 1.30, ease: "smooth" },
    { t: 1.76, v: 1.11, ease: "smooth" },
    { t: 2.26, v: 0.815, ease: "overshoot" },
  ]);
  const lX = evalTrack(cL, [
    { t: 0.0, v: -0.14 },
    { t: 0.80, v: -0.26, ease: "smooth" },
    { t: 1.42, v: -0.27, ease: "smooth" },
    { t: 1.76, v: -0.24, ease: "smooth" },
    { t: 2.26, v: -0.15, ease: "smooth" },
  ]);
  const lZ = evalTrack(cL, [
    { t: 0.0, v: 0.41 },
    { t: 0.80, v: 0.15, ease: "smooth" },
    { t: 1.42, v: 0.17, ease: "smooth" },
    { t: 1.76, v: 0.29, ease: "smooth" },
    { t: 2.26, v: 0.42, ease: "smooth" },
  ]);

  const mouthStretchOpen = smoothstep(0.55, 0.85, c) * (1 - smoothstep(1.38, 1.72, c)) * 0.42;
  const browLiftAdd = smoothstep(0.50, 0.82, c) * (1 - smoothstep(1.45, 1.85, c)) * 0.35;
  const lookXAdd = evalTrack(c, [
    { t: 0.0, v: -0.25 },
    { t: 1.15, v: -0.12, ease: "smooth" },
    { t: 1.65, v: 0.28, ease: "easeOut" },
    { t: 2.4, v: 0.18, ease: "smooth" },
  ]);
  // Natural blink right as head turns & hand passes face (`1.58s..1.74s`)!
  const blinkPulse =
    c > 1.56 && c < 1.74 ? Math.sin(((c - 1.56) / 0.18) * Math.PI) : 0;

  return {
    torsoLeanX,
    torsoLeanZ: -0.02 + Math.sin(c * 2.1) * 0.025,
    torsoTwistY,
    headYaw,
    headPitch,
    headRoll,
    handL: [lX, lY, lZ],
    handR: [rX, rY, rZ],
    mouthStretchOpen,
    browLiftAdd,
    lookXAdd,
    blinkPulse,
  };
}

/**
 * Expressive natural talking phrasing with spine-lead & asymmetric L/R hand emphasis.
 */
export function evalHumanTalkEmphasis(
  t: number,
  speakPresence: number
): {
  torsoPitchAdd: number;
  torsoTwistAdd: number;
  headNodAdd: number;
  headTiltAdd: number;
  handLiftL: number;
  handLiftR: number;
  handFwdL: number;
  handFwdR: number;
  browPulse: number;
} {
  const sp = clamp(speakPresence, 0, 1);
  // Spine leads emphasis beats by 0.12s!
  const leadWave = organicWave(t + 0.12, 1.9, 0.4);
  const armWaveR = organicWave(t, 2.2, 0.8);
  const armWaveL = organicWave(asymmetricTime(t, -1, 0.15), 1.85, 2.1);

  return {
    torsoPitchAdd: sp * (0.028 + leadWave * 0.024),
    torsoTwistAdd: sp * leadWave * 0.055,
    headNodAdd: sp * organicWave(t - 0.06, 2.6, 1.3) * 0.055,
    headTiltAdd: sp * organicWave(t - 0.08, 1.6, 2.9) * 0.048,
    handLiftL: sp * (0.06 + Math.max(-0.02, armWaveL * 0.065)),
    handLiftR: sp * (0.08 + Math.max(-0.02, armWaveR * 0.075)),
    handFwdL: sp * (0.07 + armWaveL * 0.045),
    handFwdR: sp * (0.09 + armWaveR * 0.055),
    browPulse: sp * Math.max(0, organicWave(t, 2.3, 0.6)) * 0.28,
  };
}

// ============================================================================
// CONTINUOUS PIXAR 3D VISEME LIP-SYNC ENGINE (ZERO POP / ZERO FLAPPING OVAL!)
// ============================================================================

export interface VisemeMouthState {
  /** Smooth 0..1 vertical jaw opening (0 = seamlessly sealed lips, 1 = full wide open) */
  openY: number;
  /** Dynamic horizontal mouth width multiplier (0.58 on rounded OO/UU -> 1.28 on wide EE/AA!) */
  widthX: number;
  /** Forward lip pucker protrusion (0 = flat/wide, 1 = rounded OO/UU pucker) */
  puckerZ: number;
  /** Subtle upper lip lift on wide smile/EE/AA (keeps upper teeth cleanly framed under upper lip!) */
  upperLipLift: number;
  /** Signed smile/frown corner curvature (-1 = frown, 0 = neutral, +1 = big smile) */
  cornerCurve: number;
  /** Smooth 0..1 visibility/blend weight for open mouth cavity (NEVER hard-pops!) */
  cavityWeight: number;
  /** Smooth 0..1 upper teeth exposure (high on EE/AA/smile, tucked on OO/UU!) */
  teethWeight: number;
  /** Smooth 0..1 tongue prominence (visible on open AA/OH/LA syllables) */
  tongueWeight: number;
  /** Micro jaw/head conversational resonance (radians, very subtle!) */
  talkJawMicroPitch: number;
}

/**
 * Evaluates smooth, natural multi-syllable 3D lip-sync articulation (`M/B/P -> AA -> EE -> OO/UU -> OH`):
 *  - ZERO binary popping/flickering between closed lip line and open mouth!
 *  - Modulates BOTH width (`widthX`) and lip rounding (`puckerZ`) over time so talking looks like
 *    genuine speech articulation rather than a flapping fish oval!
 *  - Upper lip stays anchored while the LOWER jaw drops downward, keeping teeth natural and grounded.
 */
export function evalVisemeMouth(params: {
  t: number;
  mouthTalk: number;
  emotionJawOpen: number;
  emotionSmile: number;
  emotionWide: number;
  showTeethBias?: number;
  seed?: number;
}): VisemeMouthState {
  const {
    t,
    mouthTalk,
    emotionJawOpen,
    emotionSmile,
    emotionWide,
    showTeethBias = 0,
    seed = 0,
  } = params;

  const talk = clamp(mouthTalk, 0, 1);
  const emoOpen = clamp(emotionJawOpen, 0, 1);

  // Smooth syllable vowel oscillator (`OO/UU` rounded vs `EE/AA` wide) — active ONLY while talking!
  // Uses non-commensurate frequencies so speech rhythm feels organically conversational, never metronomic!
  const vowelWave =
    Math.sin(t * 7.4 + seed) * 0.56 +
    Math.sin(t * 11.9 + seed * 1.7 + 1.3) * 0.28 +
    Math.cos(t * 4.3 + seed * 0.6 + 2.1) * 0.16;

  // Rounded vowel factor (`OO / OH / UU` when `vowelWave < -0.15`) vs Wide vowel (`EE / AA` when `vowelWave > 0.15`)
  const talkActivity = smoothstep(0.05, 0.28, talk);
  const ooFactor = smoothstep(-0.08, -0.72, vowelWave) * talkActivity;
  const eeFactor = smoothstep(0.08, 0.72, vowelWave) * talkActivity;

  // Bilabial consonant micro-dips (`M / B / P`) give crisp natural speech phrasing during sustained talk!
  const consonantDip = Math.pow(Math.max(0, Math.sin(t * 9.8 + seed * 2.1)), 12) * 0.55 * talkActivity;

  // Combine speech jaw opening + emotion jaw opening smoothly
  const rawOpen = Math.max(emoOpen, talk * (0.92 - consonantDip));
  const openY = clamp(rawOpen, 0, 1);

  // Dynamic horizontal articulation: narrows & puckers on OO/UU, widens cleanly on EE/AA!
  const talkWidthMult = 1.0 - ooFactor * 0.36 + eeFactor * 0.18;
  const widthX = clamp(emotionWide * lerp(1.0, talkWidthMult, talkActivity), 0.54, 1.48);

  // Forward pucker on OO/UU syllables (also subtle on shocked O-mouth!)
  const shockO = emoOpen > 0.6 && emotionWide < 0.85 ? 0.55 : 0;
  const puckerZ = clamp(ooFactor * 0.85 + shockO, 0, 1);

  // Smooth continuous cavity fade (zero abrupt on/off pop!)
  const cavityWeight = smoothstep(0.025, 0.16, openY);

  // Upper teeth show cleanly on wide EE/AA/grin syllables, tuck cleanly away during rounded OO/UU!
  const teethRaw = Math.max(showTeethBias * smoothstep(0.06, 0.22, openY), smoothstep(0.14, 0.34, openY) * (1 - ooFactor * 0.82));
  const teethWeight = clamp(teethRaw, 0, 1);

  // Tongue visible inside deeper open vowels (`AA / OH / laugh`)
  const tongueWeight = smoothstep(0.18, 0.42, openY);

  // Corner smile eases slightly toward neutral during rounded OO/UU vowels so lips round convincingly
  const cornerCurve = lerp(emotionSmile, emotionSmile * 0.25, ooFactor * 0.75);

  return {
    openY,
    widthX,
    puckerZ,
    upperLipLift: clamp(eeFactor * 0.25 + Math.max(0, emotionSmile) * 0.20, 0, 0.45),
    cornerCurve,
    cavityWeight,
    teethWeight,
    tongueWeight,
    talkJawMicroPitch: talk * 0.022 * (1 - consonantDip),
  };
}
