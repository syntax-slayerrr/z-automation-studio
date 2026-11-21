/**
 * Mathematical Camera & Motion Interpolation Engine (`mathMotion.ts`)
 *
 * Implements analytical trajectory equations from graphics, optics, and motor-control literature:
 * 1. Flash & Hogan (1985) Minimum-Jerk Quintic Trajectory (C2 continuous: zero velocity & zero acceleration at endpoints).
 * 2. Logarithmic / Exponential Optical Dolly Zoom (constant perceived optical expansion speed d(ln Z)/dt).
 * 3. Fritsch-Carlson (1980) Monotone Piecewise Cubic Hermite Interpolating Polynomial (PCHIP) — zero overshoot across camera waypoints.
 * 4. Exact Analytical Critically Damped Spring ODE solution (zeta = 1.0, zero oscillation/bounce).
 * 5. Frame-rate independent exponential decay damping (Rory Driscoll / Inigo Quilez).
 */

import type { CamKey, V3 } from "./Flat3DCamera";

export const clamp01 = (t: number): number => (t < 0 ? 0 : t > 1 ? 1 : t);

/**
 * 1. Minimum-Jerk Quintic Trajectory (Flash & Hogan, 1985)
 * Minimizes integral of squared jerk: int_0^1 (d^3 x / dt^3)^2 dt.
 * Boundary conditions: s(0)=0, s(1)=1, s'(0)=s'(1)=0, s''(0)=s''(1)=0.
 * Polynomial: s(t) = 10*t^3 - 15*t^4 + 6*t^5
 */
export function minJerk(t: number): number {
  const u = clamp01(t);
  return u * u * u * (u * (u * 6 - 15) + 10);
}

/** First derivative ds/dt of Minimum-Jerk profile (bell-shaped velocity, peak 1.875 at t=0.5) */
export function minJerkVel(t: number): number {
  const u = clamp01(t);
  const u2 = u * u;
  return 30 * u2 * (u2 - 2 * u + 1);
}

/** Frame-based Minimum-Jerk interpolation between [frameStart, frameEnd] */
export function tweenMinJerk(frame: number, frameStart: number, frameEnd: number): number {
  const span = Math.max(1e-6, frameEnd - frameStart);
  return minJerk((frame - frameStart) / span);
}

/**
 * 2. Inigo Quilez C3 Septimic Smoothstep (Zero 1st, 2nd, AND 3rd derivatives at endpoints)
 * Polynomial: s(t) = -20*t^7 + 70*t^6 - 84*t^5 + 35*t^4
 * Ideal for ultra-calm historical diorama camera glides where even jerk starts at 0.
 */
export function ultraSmoothC3(t: number): number {
  const u = clamp01(t);
  const u2 = u * u;
  const u4 = u2 * u2;
  return u4 * (35 - u * (84 - u * (70 - 20 * u)));
}

/**
 * 3. Logarithmic / Exponential Optical Zoom Interpolation
 * Linear zoom interpolation Z(t) = Z0 + t*(Z1 - Z0) produces non-uniform optical expansion speed.
 * Exponential interpolation Z(t) = Z0 * (Z1 / Z0)^u(t) guarantees constant perceived optical speed:
 * d(ln Z)/du = ln(Z1 / Z0) = const.
 */
export function expZoomLerp(z0: number, z1: number, t: number): number {
  const safeZ0 = Math.max(0.05, z0);
  const safeZ1 = Math.max(0.05, z1);
  const u = clamp01(t);
  return safeZ0 * Math.pow(safeZ1 / safeZ0, u);
}

/**
 * 4. Exact Analytical Critically Damped Spring (zeta = 1.0)
 * Solves y'' + 2*omega0*y' + omega0^2*(y - 1) = 0 with y(0)=0, y'(0)=v0.
 * Zero overshoot, zero cartoon bounce — settles asymptotically with dignified documentary weight.
 */
export function criticallyDampedSpring(
  frame: number,
  startFrame: number,
  fps = 30,
  omega0 = 8.5,
  initialVelocity = 0
): number {
  if (frame <= startFrame) return 0;
  const dt = (frame - startFrame) / fps;
  const wt = omega0 * dt;
  return 1 - (1 + (1 - initialVelocity / omega0) * wt) * Math.exp(-wt);
}

/**
 * 5. Fritsch-Carlson (1980) Monotone Piecewise Cubic Hermite (PCHIP) + Exponential Zoom Camera Track
 * Guarantees:
 * - C1 continuous velocity across all camera keyframes.
 * - Strictly monotonic between keyframes (ZERO unwanted camera overshoot or whip-back).
 * - Position (cx, cy) interpolated in Euclidean space; Zoom (z) interpolated in logarithmic optical space.
 */
function pchipSlopes(xs: number[], ys: number[]): number[] {
  const n = xs.length;
  if (n <= 1) return [0];
  const h: number[] = new Array(n - 1);
  const delta: number[] = new Array(n - 1);
  for (let i = 0; i < n - 1; i++) {
    h[i] = Math.max(1e-6, xs[i + 1] - xs[i]);
    delta[i] = (ys[i + 1] - ys[i]) / h[i];
  }
  if (n === 2) return [delta[0], delta[0]];

  const m: number[] = new Array(n).fill(0);
  // Interior slopes via weighted harmonic mean (Fritsch-Carlson condition)
  for (let i = 1; i < n - 1; i++) {
    if (delta[i - 1] * delta[i] <= 0) {
      m[i] = 0; // Local extremum or flat segment -> zero tangent prevents overshoot
    } else {
      const w1 = 2 * h[i] + h[i - 1];
      const w2 = h[i] + 2 * h[i - 1];
      m[i] = (w1 + w2) / (w1 / delta[i - 1] + w2 / delta[i]);
    }
  }
  // Endpoint tangents damped to start/stop gently (zero-jerk friendly)
  m[0] = delta[0] * 0.15;
  m[n - 1] = delta[n - 2] * 0.15;
  return m;
}

function evalHermite(
  f: number,
  xs: number[],
  ys: number[],
  ms: number[]
): number {
  const n = xs.length;
  if (n === 0) return 0;
  if (n === 1 || f <= xs[0]) return ys[0];
  if (f >= xs[n - 1]) return ys[n - 1];

  let i = 0;
  while (i < n - 2 && f > xs[i + 1]) i++;

  const h = Math.max(1e-6, xs[i + 1] - xs[i]);
  const t = clamp01((f - xs[i]) / h);
  const t2 = t * t;
  const t3 = t2 * t;

  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + t;
  const h01 = -2 * t3 + 3 * t2;
  const h11 = t3 - t2;

  return h00 * ys[i] + h10 * h * ms[i] + h01 * ys[i + 1] + h11 * h * ms[i + 1];
}

/**
 * Evaluates a multi-keyframe camera trajectory `[cx, cy, zoom]` at `frame`
 * using Fritsch-Carlson Monotone Cubic Hermite on `(cx, cy)` and Logarithmic Optical Space on `zoom`.
 */
export function camTrackMath(frame: number, keys: CamKey[]): V3 {
  const n = keys.length;
  if (n === 0) return [540, 960, 1];
  if (n === 1 || frame <= keys[0].f) return keys[0].p;
  if (frame >= keys[n - 1].f) return keys[n - 1].p;

  const fs = keys.map((k) => k.f);
  const cxs = keys.map((k) => k.p[0]);
  const cys = keys.map((k) => k.p[1]);
  const lnZs = keys.map((k) => Math.log(Math.max(0.05, k.p[2])));

  const mx = pchipSlopes(fs, cxs);
  const my = pchipSlopes(fs, cys);
  const mz = pchipSlopes(fs, lnZs);

  const cx = evalHermite(frame, fs, cxs, mx);
  const cy = evalHermite(frame, fs, cys, my);
  const zoom = Math.exp(evalHermite(frame, fs, lnZs, mz));

  return [cx, cy, zoom];
}

/**
 * Single-segment mathematical camera shot helper (like reference video @motionfolk.id):
 * Smooth C2 Minimum-Jerk lateral/vertical glide + Constant-Optical-Speed Logarithmic Dolly Zoom.
 */
export function mathShotCamera(
  frame: number,
  durFrames: number,
  from: { cx?: number; cy?: number; zoom?: number },
  to: { cx?: number; cy?: number; zoom?: number },
  mode: "minJerk" | "ultraSmoothC3" = "minJerk"
): { cx: number; cy: number; zoom: number; progress: number } {
  const rawT = clamp01(frame / Math.max(1, durFrames));
  const u = mode === "ultraSmoothC3" ? ultraSmoothC3(rawT) : minJerk(rawT);
  const cx0 = from.cx ?? 540;
  const cy0 = from.cy ?? 960;
  const z0 = from.zoom ?? 1.0;
  const cx1 = to.cx ?? cx0;
  const cy1 = to.cy ?? cy0;
  const z1 = to.zoom ?? z0;

  return {
    cx: cx0 + (cx1 - cx0) * u,
    cy: cy0 + (cy1 - cy0) * u,
    zoom: expZoomLerp(z0, z1, u),
    progress: u,
  };
}

/**
 * 6. Thin-Lens Optical Depth Parallax Gain
 * Computes exact screen displacement multiplier for a plane offset `zRelMeters` from focal plane:
 *   g(z) = f / (f + zRel)
 * Negative zRel = foreground occluder closer to lens (> 1.0x parallax);
 * Positive zRel = mid/background deeper behind hero (< 1.0x parallax).
 */
export function thinLensParallax(zRelMeters: number, focalDistMeters = 2.6): number {
  const denom = Math.max(0.35, focalDistMeters + zRelMeters);
  return focalDistMeters / denom;
}

/**
 * 7. Physical Circle-of-Confusion Optical Rack Focus Blur (in SVG/CSS px)
 * Smoothly blurs planes out of focus relative to active focus depth `zFocusMeters`.
 */
export function rackFocusBlurPx(
  zObjMeters: number,
  zFocusMeters: number,
  focalDistMeters = 2.6,
  maxBlurPx = 5.5
): number {
  const objDist = Math.max(0.4, focalDistMeters + zObjMeters);
  const delta = Math.abs(zObjMeters - zFocusMeters);
  return Math.min(maxBlurPx, maxBlurPx * (delta / objDist));
}

/**
 * 8. Quadratic Bezier Crane Camera Sweep parameterized by Minimum-Jerk / C3 progress
 */
export function quadBezierArc2D(
  p0: [number, number],
  ctrl: [number, number],
  p1: [number, number],
  t: number,
  useC3 = true
): [number, number] {
  const u = useC3 ? ultraSmoothC3(t) : minJerk(t);
  const omt = 1 - u;
  return [
    omt * omt * p0[0] + 2 * omt * u * ctrl[0] + u * u * p1[0],
    omt * omt * p0[1] + 2 * omt * u * ctrl[1] + u * u * p1[1],
  ];
}

/**
 * 9. Multi-Beat Escalating Optical Push-In (adopted from @motionfolk.id #01-#05 & #20-#22)
 * Steps cleanly between geometric zoom levels using Critically Damped Spring (zeta=1, 0 overshoot).
 */
export function multiBeatOpticalPush(
  frame: number,
  beatFrames: number[],
  zoomLevels: number[],
  fps = 30,
  omega0 = 16.0
): number {
  let z = zoomLevels[0] ?? 1.0;
  for (let i = 0; i < beatFrames.length; i++) {
    const startF = beatFrames[i];
    if (frame < startF) break;
    const prevZ = zoomLevels[i] ?? z;
    const nextZ = zoomLevels[i + 1] ?? prevZ;
    const k = criticallyDampedSpring(frame, startF, fps, omega0);
    z = expZoomLerp(prevZ, nextZ, k);
  }
  return z;
}

/**
 * 10. Real-World Metric -> 9:16 Heritage Stage Scale Converter
 * Anchored directly to HeritageKid height = 384 SVG px at scale=1.0 (representing a 1.55m student):
 *   1.00 meter = 247.74 SVG px * charScale
 * Ensures desks (0.75m), chairs (0.45m), doorways (2.05m), chalkboards (1.0m), and books (0.30m)
 * keep exact 1:1 architectural proportions with zero guesswork.
 */
export const HERITAGE_PX_PER_METER = 384 / 1.55; // ~247.74 px/m at character scale 1.0

export function metersToPx(meters: number, sceneCharScale = 1.0): number {
  return meters * HERITAGE_PX_PER_METER * sceneCharScale;
}

