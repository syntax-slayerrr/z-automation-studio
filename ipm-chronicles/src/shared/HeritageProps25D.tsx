import React from "react";
import { clamp, hash, lerp } from "./Flat3DCamera";
import { FONT_SERIF } from "./PaperTextures";

const INK = "#26180d";

/** Full vertical sky + optional horizon sun glow */
export const StageBackdrop: React.FC<{
  id: string;
  top: string;
  mid?: string;
  bottom: string;
}> = ({ id, top, mid, bottom }) => (
  <>
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={top} />
        {mid && <stop offset="0.58" stopColor={mid} />}
        <stop offset="1" stopColor={bottom} />
      </linearGradient>
    </defs>
    <rect x={-1200} y={-800} width={3600} height={3600} fill={`url(#${id})`} />
  </>
);

export const SunAura: React.FC<{
  id: string;
  x: number;
  y: number;
  r: number;
  color?: string;
  op?: number;
}> = ({ id, x, y, r, color = "#ffdf96", op = 0.65 }) => (
  <>
    <defs>
      <radialGradient id={id}>
        <stop offset="0" stopColor={color} stopOpacity={op} />
        <stop offset="0.55" stopColor={color} stopOpacity={op * 0.35} />
        <stop offset="1" stopColor={color} stopOpacity={0} />
      </radialGradient>
    </defs>
    <circle cx={x} cy={y} r={r} fill={`url(#${id})`} />
  </>
);

/** Gouache two-faced mountain peak like Jalan Raya Pos ridge peaks */
export const PaintedPeak: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  lit: string;
  shade: string;
}> = ({ x, y, w, h, lit, shade }) => (
  <g>
    <polygon
      points={`${x - w * 0.52},${y} ${x - w * 0.05},${y - h} ${x + w * 0.05},${y - h * 0.96} ${x + w * 0.52},${y}`}
      fill={lit}
    />
    <polygon
      points={`${x + w * 0.05},${y - h * 0.96} ${x + w * 0.52},${y} ${x + w * 0.04},${y}`}
      fill={shade}
      opacity={0.55}
    />
  </g>
);

export const RollingRidge: React.FC<{
  y: number;
  color: string;
  stroke?: string;
  amp?: number;
  seed?: number;
  x0?: number;
  x1?: number;
  period?: number;
}> = ({ y, color, stroke, amp = 75, seed = 1, x0 = -500, x1 = 1600, period = 540 }) => {
  const pts: string[] = [];
  for (let x = x0; x <= x1; x += 36) {
    const h =
      amp * (0.5 + 0.5 * Math.sin((x / period) * Math.PI * 2 + seed * 2.1)) +
      amp * 0.32 * Math.sin(x / (period * 0.38) + seed);
    pts.push(`${x},${(y - h).toFixed(1)}`);
  }
  return (
    <g>
      <polygon points={`${x0},2500 ${pts.join(" ")} ${x1},2500`} fill={color} />
      {stroke && (
        <polyline
          points={pts.join(" ")}
          fill="none"
          stroke={stroke}
          strokeWidth={3}
          opacity={0.45}
        />
      )}
    </g>
  );
};

export const SwayingPalm: React.FC<{
  x: number;
  y: number;
  s?: number;
  f: number;
  seed?: number;
  leaf?: string;
  leafDark?: string;
  trunk?: string;
  windBias?: number;
}> = ({
  x,
  y,
  s = 1,
  f,
  seed = 1,
  leaf = "#49693d",
  leafDark = "#2f4a27",
  trunk = "#694528",
  windBias = 0,
}) => {
  const sw = Math.sin(f * 0.045 + seed * 1.3) * (4 + Math.abs(windBias) * 4) + windBias * 18;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <path
        d={`M-11 0 Q${-16 + sw * 0.5} -180 ${8 + sw} -360 L${22 + sw} -360 Q${10 + sw * 0.5} -180 14 0 Z`}
        fill={trunk}
        stroke={INK}
        strokeWidth={2.5}
      />
      <g transform={`translate(${15 + sw},-360)`}>
        {[-72, -32, 8, 46, -110, 108].map((a, i) => (
          <path
            key={i}
            d="M0 0 Q68 -56 146 14 Q74 -16 0 12 Z"
            fill={i % 2 === 0 ? leaf : leafDark}
            stroke={INK}
            strokeWidth={1.8}
            transform={`rotate(${a + sw * 0.75 + windBias * 8}) ${i % 2 ? "" : "scale(-1,1)"}`}
          />
        ))}
      </g>
    </g>
  );
};

export const BanyanTree: React.FC<{
  x: number;
  y: number;
  s?: number;
  f: number;
  seed?: number;
  leaf?: string;
  hi?: string;
  trunk?: string;
}> = ({ x, y, s = 1, f, seed = 1, leaf = "#4b693c", hi = "#6c8c50", trunk = "#5d3d22" }) => {
  const sw = Math.sin(f * 0.032 + seed) * 2.5;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <ellipse cx={0} cy={4} rx={78} ry={14} fill="#180e06" opacity={0.22} />
      <rect x={-16} y={-205} width={32} height={205} rx={4} fill={trunk} stroke={INK} strokeWidth={2.8} />
      <path d="M-8 -165 Q-32 -200 -54 -225 M8 -165 Q30 -198 52 -220" stroke={trunk} strokeWidth={12} strokeLinecap="round" fill="none" />
      <g transform={`translate(${sw},0)`}>
        <circle cx={-74} cy={-228} r={68} fill={leaf} stroke={INK} strokeWidth={2.6} />
        <circle cx={74} cy={-234} r={70} fill={leaf} stroke={INK} strokeWidth={2.6} />
        <circle cx={0} cy={-276} r={106} fill={leaf} stroke={INK} strokeWidth={2.8} />
        <circle cx={-28} cy={-310} r={54} fill={hi} opacity={0.72} />
        <circle cx={38} cy={-268} r={42} fill={hi} opacity={0.45} />
      </g>
    </g>
  );
};

/** Illuminated swinging heritage door with golden rays spilling over courtyard */
export const HeritageDoor: React.FC<{
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  open: number;
  wood?: string;
  lightColor?: string;
  raysTo?: number;
}> = ({ id, x, y, w, h, open, wood = "#5c3922", lightColor = "#ffe296", raysTo = 1920 }) => {
  const o = clamp(open);
  const leafW = lerp(w - 8, w * 0.14, o);
  const skew = lerp(0, h * 0.07, o);
  const beamW = Math.max(10, o * w);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}_l`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff3ca" />
          <stop offset="1" stopColor="#f0ad44" />
        </linearGradient>
        <linearGradient id={`${id}_r`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lightColor} stopOpacity={0.55} />
          <stop offset="1" stopColor={lightColor} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon
        points={`${x - beamW / 2},${y} ${x + beamW / 2},${y} ${x + beamW * 2.4 + 130 * o},${raysTo} ${x - beamW * 2.4 - 130 * o},${raysTo}`}
        fill={`url(#${id}_r)`}
        opacity={0.28 + 0.72 * o}
      />
      <rect x={x - w / 2 - 14} y={y - h - 14} width={w + 28} height={h + 14} rx={6} fill="#3d2413" stroke={INK} strokeWidth={2.5} />
      <rect x={x - w / 2} y={y - h} width={w} height={h} fill={`url(#${id}_l)`} />
      <polygon
        points={`${x - w / 2},${y - h} ${x - w / 2 + leafW},${y - h + skew} ${x - w / 2 + leafW},${y - skew} ${x - w / 2},${y}`}
        fill={wood}
        stroke={INK}
        strokeWidth={2.2}
      />
      <circle cx={x - w / 2 + leafW - 18} cy={y - h * 0.48} r={6.5} fill="#dfb358" />
    </g>
  );
};

/** Indonesian Joglo / Madrasah Pendopo Hall with terracotta genteng roof & warm shuttered windows */
export const HeritageHall: React.FC<{
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  door?: number;
  glow?: number;
  wall?: string;
  roof?: string;
  plinthColor?: string;
}> = ({
  id,
  x,
  y,
  w,
  h,
  door = 0.3,
  glow = 0.6,
  wall = "#eee0c2",
  roof = "#9c4728",
  plinthColor = "#baa481",
}) => {
  const doorW = Math.min(165, w * 0.22);
  const doorH = h * 0.62;
  const cols = 6;

  return (
    <g>
      {/* Shadow behind steps */}
      <rect x={x - w / 2 - 22} y={y} width={w + 44} height={26} rx={3} fill={plinthColor} stroke={INK} strokeWidth={2.6} />
      <rect x={x - doorW * 0.85} y={y + 18} width={doorW * 1.7} height={18} rx={2} fill="#a8906e" stroke={INK} strokeWidth={2} />

      {/* Main Lime Stucco Facade */}
      <rect x={x - w / 2} y={y - h} width={w} height={h} fill={wall} stroke={INK} strokeWidth={3} />
      {/* Dado wainscot band */}
      <rect x={x - w / 2} y={y - h * 0.22} width={w} height={h * 0.22} fill="#d2be98" stroke={INK} strokeWidth={2} />

      {/* Window shutters (warm lit amber panes inside) */}
      {[-1, 1].map((s) =>
        [0.36, 0.72].map((k) => {
          const wx = x + s * w * k * 0.46;
          const wy = y - h * 0.78;
          const wh = h * 0.36;
          return (
            <g key={`${s}_${k}`}>
              <rect
                x={wx - 34}
                y={wy}
                width={68}
                height={wh}
                fill={glow > 0.2 ? "#ffcf73" : "#4b5a63"}
                opacity={glow > 0.2 ? 0.55 + glow * 0.45 : 0.88}
                stroke={INK}
                strokeWidth={2.5}
              />
              <line x1={wx} y1={wy} x2={wx} y2={wy + wh} stroke={INK} strokeWidth={3} />
              <line x1={wx - 34} y1={wy + wh * 0.48} x2={wx + 34} y2={wy + wh * 0.48} stroke={INK} strokeWidth={2.5} />
            </g>
          );
        })
      )}

      {/* Articulated wooden central doors */}
      <HeritageDoor id={id} x={x} y={y} w={doorW} h={doorH} open={door} raysTo={y + 210} />

      {/* Carved teak veranda columns */}
      {Array.from({ length: cols }, (_, i) => {
        const px = x - w / 2 + 16 + (i * (w - 50)) / (cols - 1);
        if (Math.abs(px + 9 - x) < doorW * 0.58) return null;
        return (
          <g key={i}>
            <rect x={px} y={y - h + 8} width={18} height={h - 8} fill="#6b4426" stroke={INK} strokeWidth={2.2} />
            <rect x={px - 5} y={y - 16} width={28} height={16} fill="#a8906e" stroke={INK} strokeWidth={2} />
          </g>
        );
      })}

      {/* Terracotta tiered hip roof + overhanging eaves depth shadow */}
      <polygon
        points={`${x - w / 2 - 58},${y - h} ${x + w / 2 + 58},${y - h} ${x + w / 2 + 44},${y - h + 22} ${x - w / 2 - 44},${y - h + 22}`}
        fill="#2e1a0d"
        opacity={0.42}
      />
      <polygon
        points={`${x - w / 2 - 58},${y - h} ${x - w / 2 + 78},${y - h - 135} ${x + w / 2 - 78},${y - h - 135} ${x + w / 2 + 58},${y - h}`}
        fill={roof}
        stroke={INK}
        strokeWidth={3.2}
      />
      {/* Upper Joglo crown lantern tier */}
      <polygon
        points={`${x - w * 0.22},${y - h - 135} ${x - w * 0.08},${y - h - 220} ${x + w * 0.08},${y - h - 220} ${x + w * 0.22},${y - h - 135}`}
        fill="#88381d"
        stroke={INK}
        strokeWidth={2.8}
      />
      {/* Genteng roof ridge tile ribs */}
      {[-0.36, -0.18, 0, 0.18, 0.36].map((rk, i) => (
        <line
          key={i}
          x1={x + rk * (w + 60)}
          y1={y - h}
          x2={x + rk * (w - 156)}
          y2={y - h - 135}
          stroke="#4d1e0f"
          strokeWidth={2.2}
          opacity={0.45}
        />
      ))}
    </g>
  );
};

/** Illuminated flickering Brass Oil Lamp ("lampu teplok/petromaks") */
export const HeritageBrassLamp: React.FC<{
  id: string;
  x: number;
  y: number;
  f: number;
  s?: number;
  power?: number;
}> = ({ id, x, y, f, s = 1, power = 1 }) => {
  const fl = 1 + Math.sin(f * 0.36) * 0.065 + Math.sin(f * 0.89 + 1.5) * 0.04;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <SunAura id={`lmp_${id}`} x={0} y={-62} r={255 * fl * power} color="#ffc254" op={0.55 * power} />
      <ellipse cx={0} cy={4} rx={40} ry={9} fill="#140c06" opacity={0.35} />
      <rect x={-26} y={-18} width={52} height={22} rx={8} fill="#a87c32" stroke={INK} strokeWidth={2.5} />
      <rect x={-18} y={-28} width={36} height={12} rx={3} fill="#7d5821" stroke={INK} strokeWidth={2} />
      <path d="M-21 -28 Q-34 -88 0 -106 Q34 -88 21 -28 Z" fill="#fff2cc" stroke={INK} strokeWidth={2.2} opacity={0.92} />
      <path d={`M0 -92 Q${-13 * fl} -56 0 -32 Q${13 * fl} -56 0 -92 Z`} fill="#f58b1f" />
      <path d="M0 -74 Q-6 -54 0 -40 Q6 -54 0 -74 Z" fill="#fff8d4" />
    </g>
  );
};

/** Authentic Bugis Pinisi schooner with planked hull, dual masts, & billowing canvas sails */
export const BugisPinisi25D: React.FC<{
  x: number;
  y: number;
  scale?: number;
  f: number;
  stormMix?: number;
}> = ({ x, y, scale = 1, f, stormMix = 0 }) => {
  const pitch = Math.sin(f * 0.085) * (1.8 + stormMix * 3.8);
  const bob = Math.sin(f * 0.085 + 0.7) * (5 + stormMix * 7);
  const sailBelly = 18 + Math.sin(f * 0.07) * 5;
  const flagWave = Math.sin(f * 0.25) * 6;
  return (
    <g transform={`translate(${x.toFixed(1)},${(y + bob).toFixed(1)}) scale(${scale}) rotate(${pitch.toFixed(2)})`}>
      {/* Dual teak masts & bowsprit */}
      <line x1={-46} y1={-16} x2={-52} y2={-250} stroke="#4e2e16" strokeWidth={7} strokeLinecap="round" />
      <line x1={52} y1={-16} x2={46} y2={-220} stroke="#4e2e16" strokeWidth={6.5} strokeLinecap="round" />
      <line x1={82} y1={-26} x2={175} y2={-66} stroke="#4e2e16" strokeWidth={5.5} strokeLinecap="round" />
      <line x1={-48} y1={-230} x2={48} y2={-205} stroke={INK} strokeWidth={2} opacity={0.65} />

      {/* 4 Cream textured sails billowing gently */}
      <path
        d={`M-46,-236 Q${-46 + sailBelly * 1.4},-160 -42,-44 L-126,-52 Q${-115 + sailBelly * 0.7},-140 -106,-215 Z`}
        fill="#f5ead1"
        stroke={INK}
        strokeWidth={2.4}
      />
      <path
        d={`M46,-208 Q${46 + sailBelly * 1.25},-138 50,-42 L-34,-48 Q${-24 + sailBelly * 0.65},-124 -20,-188 Z`}
        fill="#efe1be"
        stroke={INK}
        strokeWidth={2.4}
      />
      {/* Jib triangular foresails */}
      <path
        d={`M48,-200 Q${98 + sailBelly * 0.6},-130 162,-62 L58,-48 Z`}
        fill="#faf2dd"
        stroke={INK}
        strokeWidth={2.2}
      />
      <path
        d={`M48,-168 Q90,-118 134,-58 L56,-48 Z`}
        fill="#ead8b2"
        stroke={INK}
        strokeWidth={1.8}
        opacity={0.75}
      />

      {/* Fluttering stern pennant */}
      <path
        d={`M-52,-250 Q${-74},${-258 + flagWave} -96,${-248 - flagWave * 0.6} L-94,${-232 - flagWave * 0.4} Q${-72},${-240 + flagWave} -52,-234 Z`}
        fill="#8d2416"
        stroke={INK}
        strokeWidth={1.8}
      />

      {/* Raised stern cabin deckhouse + Wooden planked Phinisi hull */}
      <rect x={-122} y={-44} width={54} height={24} rx={3} fill="#6b4425" stroke={INK} strokeWidth={2.4} />
      <path
        d="M-136,-24 L112,-28 L138,-36 Q104,16 56,22 L-98,20 Q-126,12 -136,-24 Z"
        fill="#704725"
        stroke={INK}
        strokeWidth={3}
      />
      <path d="M-126,-6 L104,-9" stroke="#d8b982" strokeWidth={2.8} opacity={0.7} />
    </g>
  );
};

/** South Sulawesi Wajo Rumah Panggung (stilt meeting hall over harbor pilings) */
export const RumahPanggung: React.FC<{
  x: number;
  y: number;
  f: number;
  stormMix?: number;
}> = ({ x, y, f, stormMix = 0 }) => {
  const lanternGlow = 0.65 + 0.35 * Math.sin(f * 0.25) + stormMix * 0.2;
  return (
    <g transform={`translate(${x},${y})`}>
      {/* Timber pier stilts */}
      {[-120, -40, 40, 120].map((px, i) => (
        <rect key={i} x={px - 7} y={0} width={14} height={160} fill="#462b16" stroke={INK} strokeWidth={2.4} />
      ))}
      <rect x={-150} y={-14} width={300} height={18} rx={3} fill="#704728" stroke={INK} strokeWidth={2.6} />

      {/* Stepped stair ladder down pier */}
      <line x1={122} y1={-14} x2={166} y2={90} stroke="#4e3018" strokeWidth={6} />
      {[12, 36, 60].map((sy, i) => (
        <line key={i} x1={122 + i * 14} y1={sy} x2={146 + i * 14} y2={sy} stroke="#694324" strokeWidth={4} />
      ))}

      {/* Timber hall body + pitched Bugis gable roof */}
      <rect x={-110} y={-136} width={220} height={122} fill="#8a5a34" stroke={INK} strokeWidth={2.8} />
      {/* Lit open doorway & windows */}
      <rect x={-26} y={-106} width={52} height={92} fill="#ffcf74" opacity={0.6 + 0.4 * lanternGlow} stroke={INK} strokeWidth={2.5} />
      <rect x={-88} y={-102} width={40} height={44} fill="#ffcb6a" opacity={0.55 + 0.35 * lanternGlow} stroke={INK} strokeWidth={2.2} />
      <rect x={48} y={-102} width={40} height={44} fill="#ffcb6a" opacity={0.55 + 0.35 * lanternGlow} stroke={INK} strokeWidth={2.2} />

      <polygon points="-148,-136 0,-232 148,-136" fill="#4f2d18" stroke={INK} strokeWidth={3} />
      {/* Traditional crossed gable timpa laja finials */}
      <line x1={-16} y1={-244} x2={12} y2={-216} stroke="#361d0d" strokeWidth={6} strokeLinecap="round" />
      <line x1={16} y1={-244} x2={-12} y2={-216} stroke="#361d0d" strokeWidth={6} strokeLinecap="round" />

      {/* Warm swinging porch lantern */}
      <circle cx={0} cy={-124} r={78} fill="#ffc35e" opacity={0.28 * lanternGlow} />
      <circle cx={0} cy={-118} r={9} fill="#ffe49c" stroke={INK} strokeWidth={2} />
    </g>
  );
};

/** 3 stacked undulating ocean strip waves */
export const SeaWaveBands: React.FC<{
  baseY: number;
  f: number;
  stormMix?: number;
}> = ({ baseY, f, stormMix = 0 }) => {
  const c0 = stormMix > 0.4 ? "#445a63" : "#6a9592";
  const c1 = stormMix > 0.4 ? "#354851" : "#56807f";
  const c2 = stormMix > 0.4 ? "#273740" : "#446c6d";
  const bands = [
    { dy: 0, speed: 0.06, amp: 12, fill: c0 },
    { dy: 64, speed: -0.085, amp: 16, fill: c1 },
    { dy: 145, speed: 0.11, amp: 20, fill: c2 },
  ];
  return (
    <g>
      {bands.map((b, idx) => {
        const pts: string[] = [];
        const ph = f * b.speed + idx * 1.9;
        for (let x = -400; x <= 1500; x += 38) {
          const y = baseY + b.dy + Math.sin(x * 0.011 + ph) * (b.amp + stormMix * 8);
          pts.push(`${x},${y.toFixed(1)}`);
        }
        return (
          <g key={idx}>
            <polygon points={`-400,2500 ${pts.join(" ")} 1500,2500`} fill={b.fill} />
            <polyline points={pts.join(" ")} fill="none" stroke="#efe6cf" strokeWidth={2.6} opacity={0.34} />
          </g>
        );
      })}
    </g>
  );
};

/** Diagonal storm rain streaks */
export const RainField: React.FC<{ f: number; opacity?: number }> = ({ f, opacity = 0.55 }) => {
  if (opacity <= 0.02) return null;
  return (
    <g opacity={opacity}>
      {Array.from({ length: 42 }, (_, i) => {
        const x0 = hash(i * 3 + 7) * 1400 - 150;
        const speed = 32 + hash(i + 41) * 26;
        const y0 = ((f * speed + hash(i * 11) * 2200) % 2300) - 250;
        const len = 62 + hash(i + 83) * 58;
        return (
          <line
            key={i}
            x1={x0}
            y1={y0}
            x2={x0 - len * 0.24}
            y2={y0 + len}
            stroke="#dde6e8"
            strokeWidth={i % 3 === 0 ? 2.8 : 1.6}
            strokeLinecap="round"
            opacity={0.4 + hash(i + 2) * 0.45}
          />
        );
      })}
    </g>
  );
};

/** Motionformat Jalan-Raya-Pos style turned-brass pouring hourglass */
export const PouringBrassHourglass: React.FC<{
  x: number;
  y: number;
  scale?: number;
  progress: number; // 0 = top full, 1 = bottom full
}> = ({ x, y, scale = 1, progress }) => {
  const p = clamp(progress, 0.04, 0.94);
  const topR = 54 * Math.sqrt(1 - p);
  const topY = -14 - topR * 0.95;
  const botH = 12 + p * 68;
  const streamOp = p < 0.92 ? 0.95 : 0;

  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      {/* Soft circular contact shadow on ground/map */}
      <ellipse cx={0} cy={104} rx={86} ry={18} fill="#180d05" opacity={0.34} />

      {/* 2 outer brass pillars */}
      <rect x={-64} y={-92} width={10} height={184} rx={4} fill="#8b6220" stroke={INK} strokeWidth={2.2} />
      <rect x={54} y={-92} width={10} height={184} rx={4} fill="#8b6220" stroke={INK} strokeWidth={2.2} />

      {/* Outer glass silhouette */}
      <path
        d="M-54,-88 Q-56,-22 -8,-4 L-8,4 Q-56,22 -54,88 L54,88 Q56,22 8,4 L8,-4 Q56,-22 54,-88 Z"
        fill="rgba(245, 238, 220, 0.30)"
        stroke={INK}
        strokeWidth={3.2}
      />

      {/* Upper sand cone draining down */}
      <path
        d={`M${(-topR).toFixed(1)},${topY.toFixed(1)} Q0,${(topY - 7).toFixed(1)} ${topR.toFixed(1)},${topY.toFixed(1)} L6,-4 L-6,-4 Z`}
        fill="#d69c39"
      />

      {/* Continuous falling golden stream */}
      {streamOp > 0 && (
        <line
          x1={0}
          y1={-4}
          x2={0}
          y2={86}
          stroke="#ebb54f"
          strokeWidth={4.2}
          opacity={streamOp}
        />
      )}

      {/* Lower sand pile rising up */}
      <path
        d={`M-50,86 L50,86 Q${(36 * (1 - p * 0.4)).toFixed(1)},${(86 - botH).toFixed(1)} 0,${(82 - botH).toFixed(1)} Q${(-36 * (1 - p * 0.4)).toFixed(1)},${(86 - botH).toFixed(1)} -50,86 Z`}
        fill="#d29634"
      />
      <path
        d={`M-28,86 L28,86 Q10,${(84 - botH * 0.85).toFixed(1)} 0,${(82 - botH).toFixed(1)} Z`}
        fill="#f0be61"
        opacity={0.45}
      />

      {/* Specular glass reflection streak */}
      <path
        d="M-40,-76 Q-40,-34 -13,-10 M-39,76 Q-40,34 -13,10"
        fill="none"
        stroke="#fff9eb"
        strokeWidth={4}
        strokeLinecap="round"
        opacity={0.62}
      />

      {/* Turned brass top & bottom plinths */}
      <rect x={-74} y={-106} width={148} height={18} rx={6} fill="#ba8935" stroke={INK} strokeWidth={2.8} />
      <rect x={-82} y={-114} width={164} height={10} rx={4} fill="#8a6121" stroke={INK} strokeWidth={2.4} />
      <rect x={-74} y={88} width={148} height={18} rx={6} fill="#ba8935" stroke={INK} strokeWidth={2.8} />
      <rect x={-82} y={102} width={164} height={11} rx={4} fill="#8a6121" stroke={INK} strokeWidth={2.4} />
    </g>
  );
};

/** Classical Yogyakarta stucco archway ("Gapura") used in Scene 6 3D-in-2D avenue */
export const YogyakartaGapura25D: React.FC<{ x: number; y: number; sc: number }> = ({ x, y, sc }) => (
  <g transform={`translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${sc.toFixed(4)})`}>
    {/* Radiant dawn sun glow inside gateway */}
    <ellipse cx={0} cy={-160} rx={115} ry={175} fill="#ffe4a1" opacity={0.45} />
    {/* Left & right thick plaster piers */}
    <rect x={-215} y={-280} width={88} height={280} fill="#ede0c3" stroke={INK} strokeWidth={3} />
    <rect x={127} y={-280} width={88} height={280} fill="#ede0c3" stroke={INK} strokeWidth={3} />
    <rect x={-230} y={-38} width={118} height={38} fill="#cab48f" stroke={INK} strokeWidth={2.6} />
    <rect x={112} y={-38} width={118} height={38} fill="#cab48f" stroke={INK} strokeWidth={2.6} />
    {/* Cross entablature & arch soffit */}
    <path d="M-127,-220 Q0,-335 127,-220 L127,-280 L-127,-280 Z" fill="#e4d2ae" stroke={INK} strokeWidth={3} />
    <rect x={-246} y={-308} width={492} height={34} rx={4} fill="#d6be92" stroke={INK} strokeWidth={3} />
    <polygon points="-145,-308 0,-390 145,-308" fill="#9c4728" stroke={INK} strokeWidth={3} />
    <circle cx={0} cy={-262} r={20} fill="#f4ead3" stroke={INK} strokeWidth={2.5} />
    <text x={0} y={-255} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={800} fontSize={14} fill="#8d2416">
      1960
    </text>
  </g>
);
