import React from "react";
import { Easing, interpolate, spring } from "remotion";
import { FONT_SERIF } from "./PaperTextures";

export type V3 = [number, number, number];
export type CamKey = { f: number; p: V3 };

export const clamp = (v: number, a = 0, b = 1): number => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Asymmetric cinematic easings (cinematic-vector-animator) */
export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
export const EASE_IN = Easing.bezier(0.7, 0, 0.84, 0);
export const EASE_SOFT = Easing.bezier(0.33, 1, 0.68, 1);
export const EASE_CAM = Easing.bezier(0.4, 0, 0.2, 1);

/** Frame-based clamped easing progress 0..1 */
export const tweenE = (
  f: number,
  a: number,
  b: number,
  easing: (t: number) => number = EASE_OUT
): number =>
  interpolate(f, [a, Math.max(a + 0.001, b)], [0, 1], {
    easing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

export type SpringPreset = "character" | "object" | "heavy" | "camera";

const SPRING_CFG: Record<SpringPreset, { damping: number; stiffness?: number; mass?: number }> = {
  character: { damping: 14, stiffness: 120, mass: 0.8 },
  object: { damping: 18, stiffness: 100, mass: 1 },
  heavy: { damping: 13, stiffness: 180, mass: 1.25 },
  camera: { damping: 200 },
};

/** Deterministic Remotion spring helper with preset weights (allows subtle natural overshoot). */
export const springObj = (
  f: number,
  startFrame: number,
  fps = 30,
  preset: SpringPreset = "object"
): number => {
  if (f < startFrame) return 0;
  return spring({
    frame: Math.max(0, f - startFrame),
    fps,
    config: SPRING_CFG[preset],
  });
};

export const smooth = (t: number): number => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};

export const smoother = (t: number): number => {
  const x = clamp(t);
  return x * x * x * (x * (x * 6 - 15) + 10);
};

export const prog = (f: number, a: number, b: number): number =>
  clamp((f - a) / Math.max(1e-6, b - a));

export const pe = (f: number, a: number, b: number): number => smoother(prog(f, a, b));

export const hash = (n: number): number => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return s - Math.floor(s);
};

export const shake = (t: number, amp = 9): number =>
  t > 0 && t < 14 ? Math.sin(t * 2.7) * (14 - t) * (amp / 14) : 0;

/** Continuous-velocity Hermite spline camera track ported & tuned for vertical 9:16 cuts. */
export function track(f: number, keys: CamKey[], edge = 0.55): V3 {
  const n = keys.length;
  if (n === 0) return [540, 960, 1];
  if (n === 1 || f <= keys[0].f) return keys[0].p;
  if (f >= keys[n - 1].f) return keys[n - 1].p;
  let i = 0;
  while (i < n - 2 && f > keys[i + 1].f) i++;
  const k0 = keys[i];
  const k1 = keys[i + 1];
  const h = Math.max(1e-6, k1.f - k0.f);
  const t = (f - k0.f) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + t;
  const h01 = -2 * t3 + 3 * t2;
  const h11 = t3 - t2;
  const out: V3 = [0, 0, 0];
  for (let c = 0; c < 3; c++) {
    const chord = (k1.p[c] - k0.p[c]) / h;
    const m0 =
      i === 0
        ? chord * edge
        : (k1.p[c] - keys[i - 1].p[c]) / Math.max(1e-6, k1.f - keys[i - 1].f);
    const m1 =
      i + 1 === n - 1
        ? chord * edge
        : (keys[i + 2].p[c] - k0.p[c]) / Math.max(1e-6, keys[i + 2].f - k0.f);
    out[c] = h00 * k0.p[c] + h10 * h * m0 + h01 * k1.p[c] + h11 * h * m1;
  }
  return out;
}

export const K3 = (f: number, cx: number, cy: number, z: number): CamKey => ({
  f,
  p: [cx, cy, z],
});

export const camAt = (f: number, keys: CamKey[], edge = 0.55): V3 => track(f, keys, edge);

export const handheld = (f: number, amp = 3.2): [number, number] => [
  (Math.sin(f * 0.058 + 1.1) + 0.45 * Math.sin(f * 0.137)) * amp,
  (Math.sin(f * 0.047 + 3.6) + 0.45 * Math.sin(f * 0.119 + 1.8)) * amp * 0.75,
];

/** SVG 2D/2.5D camera container centered on 1080x1920 vertical canvas */
export const Cam2D: React.FC<{
  cx: number;
  cy: number;
  zoom: number;
  rotDeg?: number;
  children: React.ReactNode;
}> = ({ cx, cy, zoom, rotDeg = 0, children }) => (
  <g
    transform={`translate(540,960) scale(${zoom.toFixed(4)}) rotate(${rotDeg.toFixed(3)}) translate(${(-cx).toFixed(2)},${(-cy).toFixed(2)})`}
  >
    {children}
  </g>
);

/**
 * Subtle CSS 3D perspective stage wrapper — tilts flat artwork organically
 * without blurring sharp overlaid typography or captions.
 */
export const PerspStage: React.FC<{
  tiltXDeg?: number;
  tiltYDeg?: number;
  scaleBoost?: number;
  origin?: string;
  children: React.ReactNode;
}> = ({ tiltXDeg = 0, tiltYDeg = 0, scaleBoost = 1.04, origin = "50% 55%", children }) => {
  const safeScale = Math.max(
    scaleBoost,
    1 + Math.abs(tiltXDeg) * 0.014 + Math.abs(tiltYDeg) * 0.012
  );
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        transformOrigin: origin,
        transform: `perspective(1250px) rotateX(${tiltXDeg.toFixed(2)}deg) rotateY(${tiltYDeg.toFixed(2)}deg) scale(${safeScale.toFixed(4)})`,
        transformStyle: "preserve-3d",
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
};

export interface Cam3DState {
  x: number;
  y: number;
  z: number;
  fov: number;
  horizonY: number;
  pitchRad?: number;
}

export interface ProjPoint {
  sx: number;
  sy: number;
  sc: number;
  zDepth: number;
}

/**
 * True perspective projection for placing flat SVG vector props/characters
 * inside 3D world space (paths, corridors, courtyards, Yogyakarta avenue).
 */
export function project3D(
  wx: number,
  wy: number,
  wz: number,
  cam: Cam3DState
): ProjPoint | null {
  const dx = wx - cam.x;
  const dy = wy - cam.y;
  const dz = wz - cam.z;
  const pitch = cam.pitchRad ?? 0;
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  const ry = dy * cp - dz * sp;
  const rz = dy * sp + dz * cp;
  if (rz <= 0.35) return null;
  const sc = cam.fov / rz;
  return {
    sx: 540 + dx * sc,
    sy: cam.horizonY - ry * sc,
    sc,
    zDepth: rz,
  };
}

/**
 * Motionformat-inspired delicate italic in-world annotation (no boxy cards!).
 */
export const EditorialCallout: React.FC<{
  x: number;
  y: number;
  text: string;
  sub?: string;
  t: number;
  color?: string;
  halo?: string;
  size?: number;
  align?: "start" | "middle" | "end";
  ribbon?: boolean;
}> = ({
  x,
  y,
  text,
  sub,
  t,
  color = "#2a1b0e",
  halo = "rgba(244,234,214,0.88)",
  size = 34,
  align = "middle",
  ribbon = false,
}) => {
  if (t <= 0) return null;
  const k = pe(t, 0, 14);
  const rise = lerp(16, 0, k);
  if (ribbon) {
    const rw = Math.max(460, text.length * size * 0.52 + 88);
    const rh = sub ? 84 : 54;
    return (
      <g transform={`translate(${x},${y + rise})`} opacity={k}>
        <rect x={-rw / 2 - 4} y={-rh / 2 - 22 + 8} width={rw} height={rh} rx={6} fill="#1b0e05" opacity={0.34} />
        <rect
          x={-rw / 2}
          y={-rh / 2 - 22}
          width={rw}
          height={rh}
          rx={6}
          fill="#f6ead0"
          stroke="#593b1d"
          strokeWidth={2.4}
        />
        <rect
          x={-rw / 2 + 6}
          y={-rh / 2 - 16}
          width={rw - 12}
          height={rh - 12}
          rx={3}
          fill="none"
          stroke="#a98a5b"
          strokeWidth={1.1}
        />
        {sub && (
          <text
            x={0}
            y={-30}
            textAnchor="middle"
            fontFamily={FONT_SERIF}
            fontWeight={800}
            fontSize={15}
            letterSpacing={2.2}
            fill="#882617"
          >
            {sub}
          </text>
        )}
        <text
          x={0}
          y={sub ? 4 : -6}
          textAnchor="middle"
          fontFamily={FONT_SERIF}
          fontStyle="italic"
          fontWeight={800}
          fontSize={size * 0.94}
          fill="#221409"
        >
          {text}
        </text>
      </g>
    );
  }
  return (
    <g transform={`translate(${x},${y + rise})`} opacity={k}>
      {sub && (
        <text
          x={0}
          y={-size * 0.92}
          textAnchor={align}
          fontFamily={FONT_SERIF}
          fontStyle="italic"
          fontWeight={700}
          fontSize={size * 0.62}
          fill={color}
          opacity={0.82}
          stroke={halo}
          strokeWidth={4}
          paintOrder="stroke"
        >
          {sub}
        </text>
      )}
      <text
        x={0}
        y={0}
        textAnchor={align}
        fontFamily={FONT_SERIF}
        fontStyle="italic"
        fontWeight={800}
        fontSize={size}
        fill={color}
        stroke={halo}
        strokeWidth={5.5}
        strokeLinejoin="round"
        paintOrder="stroke"
      >
        {text}
      </text>
    </g>
  );
};
