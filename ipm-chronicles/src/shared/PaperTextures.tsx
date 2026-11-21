import React from "react";
import { Easing, interpolate, random, useCurrentFrame } from "remotion";

export const HERITAGE = {
  paperLight: "#f1e6cf",
  paperMid: "#e3d2b0",
  paperDark: "#19120c",
  ink: "#26180d",
  inkSoft: "#59412b",
  oxblood: "#8d2416",
  oxbloodBright: "#a92e1d",
  brass: "#b68838",
  olive: "#3d5238",
  sea: "#c7d3cc",
  seaDeep: "#9fb0a8",
  land: "#d9bd8a",
  landActive: "#c87b3c",
} as const;

export const FONT_SERIF = "Georgia, 'Book Antiqua', 'Palatino Linotype', serif";
export const FONT_SANS = "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif";
export const FONT_MONO = "'Courier New', 'JetBrains Mono', monospace";

/**
 * Full-bleed illustrated museum plate with smooth Ken Burns camera motion
 * and seamless archival paper vignette/edge multiply blending.
 */
export const ArchivalPlate: React.FC<{
  src: string;
  fromScale?: number;
  toScale?: number;
  fromX?: number;
  toX?: number;
  fromY?: number;
  toY?: number;
  durationFrames?: number;
  opacity?: number;
  cropBorderScale?: number;
  mode?: "normal" | "multiply";
  vignetteStrength?: number;
}> = ({
  src,
  fromScale = 1.04,
  toScale = 1.11,
  fromX = 0,
  toX = 0,
  fromY = 0,
  toY = -14,
  durationFrames = 180,
  opacity = 1,
  cropBorderScale = 1.0,
  mode = "normal",
  vignetteStrength = 0.28,
}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, Math.max(1, durationFrames)], [0, 1], {
    easing: Easing.inOut(Easing.sin),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sc = interpolate(t, [0, 1], [fromScale, toScale]) * cropBorderScale;
  const x = interpolate(t, [0, 1], [fromX, toX]);
  const y = interpolate(t, [0, 1], [fromY, toY]);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", opacity }}>
      <img
        src={src}
        alt=""
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${sc.toFixed(4)})`,
          transformOrigin: "50% 46%",
          mixBlendMode: mode,
        }}
      />
      {vignetteStrength > 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(circle at 50% 45%, rgba(25,18,12,0) 48%, rgba(25,18,12,${vignetteStrength}) 100%)`,
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
};

/** Subtle deterministic warm dust motes drifting across sunlit museum air */
export const SunDustMotes: React.FC<{ color?: string; count?: number; opacity?: number }> = ({
  color = "#e8c47a",
  count = 16,
  opacity = 0.3,
}) => {
  const frame = useCurrentFrame();
  return (
    <svg
      width={1080}
      height={1920}
      style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity }}
    >
      {Array.from({ length: count }, (_, i) => {
        const seedX = ((i * 397 + 71) % 900) + 90;
        const seedY = ((i * 613 + 137) % 1260) + 200;
        const dx = Math.sin(frame * 0.022 + i * 1.9) * 16;
        const dy = -((frame * (0.4 + (i % 4) * 0.16)) % 130);
        const y = ((seedY + dy - 200 + 1260) % 1260) + 200;
        const r = 1.4 + (i % 3) * 0.85;
        return (
          <circle
            key={i}
            cx={seedX + dx}
            cy={y}
            r={r}
            fill={color}
            opacity={0.32 + (i % 4) * 0.14}
          />
        );
      })}
    </svg>
  );
};

/** Diagonal moody rain streaks for tension beats */
export const RainStreaks: React.FC<{ opacity?: number }> = ({ opacity = 0.22 }) => {
  const frame = useCurrentFrame();
  return (
    <svg
      width={1080}
      height={1920}
      style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity }}
    >
      {Array.from({ length: 34 }, (_, i) => {
        const x0 = ((i * 193 + 47) % 1160) - 40;
        const offset = (frame * (24 + (i % 5) * 4) + i * 117) % 2100;
        const y0 = offset - 150;
        const len = 38 + (i % 4) * 18;
        return (
          <line
            key={i}
            x1={x0}
            y1={y0}
            x2={x0 - len * 0.28}
            y2={y0 + len}
            stroke="#d9ceb8"
            strokeWidth={1.1}
            strokeLinecap="round"
            opacity={0.35 + (i % 3) * 0.18}
          />
        );
      })}
    </svg>
  );
};

const PAPER_TILE_SVG = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.78" numOctaves="2" seed="14"/></filter><rect width="160" height="160" filter="url(#n)"/></svg>`
);

/** Deterministic two-depth atmospheric dust (far crisp motes + near larger soft motes) */
export const DualDepthDust: React.FC<{
  color?: string;
  count?: number;
  opacity?: number;
  windX?: number;
  seed?: string;
}> = ({ color = "#e8c47a", count = 34, opacity = 0.42, windX = 12, seed = "ep02-dust" }) => {
  const frame = useCurrentFrame();
  const s = frame / 30;
  return (
    <svg
      width={1080}
      height={1920}
      style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity }}
    >
      <defs>
        <filter id={`${seed}_soft`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
      </defs>
      {Array.from({ length: count }, (_, i) => {
        const isNear = i % 3 === 0;
        const r1 = random(`${seed}-x-${i}`);
        const r2 = random(`${seed}-y-${i}`);
        const r3 = random(`${seed}-p-${i}`);
        const speedY = isNear ? 26 + r3 * 18 : 11 + r3 * 9;
        const baseX = r1 * 1080;
        const baseY = 140 + r2 * 1440;
        const swayX = Math.sin(s * (0.45 + r3 * 0.5) + r2 * 6.28) * (isNear ? 24 : 12);
        const x = ((baseX + swayX + s * windX * (isNear ? 1.3 : 0.55)) % 1120 + 1120) % 1120 - 20;
        const y = 140 + (((baseY - 140 - s * speedY) % 1460) + 1460) % 1460;
        const r = isNear ? 2.8 + r1 * 2.1 : 1.1 + r1 * 1.1;
        const twinkle = 0.45 + 0.55 * Math.sin(s * (1.2 + r3 * 1.4) + r1 * 6.28);
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={r}
            fill={color}
            opacity={(isNear ? 0.46 : 0.3) * twinkle}
            filter={isNear ? `url(#${seed}_soft)` : undefined}
          />
        );
      })}
    </svg>
  );
};

/** Subtle archival parchment paper fiber, soft-light optical color grade, & vignette post-grade shared across all scenes */
export const MuseumPaperGrade: React.FC = () => {
  const frame = useCurrentFrame();
  const grainStep = Math.floor(frame / 2) % 4;
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {/* Soft-light optical color unification tying shadows (deep sepia/slate) & midtones (warm gold) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.24,
          mixBlendMode: "soft-light",
          background:
            "linear-gradient(180deg, rgba(24,30,42,0.44) 0%, rgba(242,196,112,0.34) 44%, rgba(28,18,10,0.48) 100%)",
        }}
      />
      {/* 15fps stepped deterministic parchment film grain (GPU-cached tile offset) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.068,
          mixBlendMode: "multiply",
          backgroundImage: `url("data:image/svg+xml,${PAPER_TILE_SVG}")`,
          backgroundRepeat: "repeat",
          backgroundSize: "160px 160px",
          backgroundPosition: `${grainStep * 37}px ${grainStep * 53}px`,
        }}
      />
      {/* Upper-focused tinted radial vignette (no pure #000) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 42%, rgba(20,13,8,0) 52%, rgba(20,13,8,0.38) 100%)",
        }}
      />
    </div>
  );
};
