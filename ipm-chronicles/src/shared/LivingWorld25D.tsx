import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

function evalWindHarmonic(t: number, freqHz: number, phase: number): number {
  const envelope = 0.62 + 0.38 * Math.sin(t * 0.44 + phase * 0.73);
  const primary = Math.sin(t * freqHz * Math.PI * 2 + phase);
  const secondary = Math.sin(t * (freqHz * 1.87) * Math.PI * 2 + phase * 1.41);
  return (primary * 0.68 + secondary * 0.32) * envelope;
}

export interface DriftingCloudsProps {
  variant: "day" | "dusk";
  /** Optional relative asset path under public/ (defaults to PoC V3 gouache cloud sprite) */
  src?: string;
  /** Vertical pixel range where sky clouds appear cleanly above mountain/roof horizon */
  top?: number;
  height?: number;
  opacity?: number;
  speedPxPerSec?: number;
  /** Optional clip mask so clouds fade cleanly before overlapping lower terrain */
  horizonMaskPercent?: number;
}

/** Smooth continuous two-layer painted gouache clouds drifting across landscape or open window skies. */
export const DriftingClouds25D: React.FC<DriftingCloudsProps> = ({
  variant,
  src: srcProp,
  top = 0,
  height = 560,
  opacity = 0.62,
  speedPxPerSec = 18,
  horizonMaskPercent = 78,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const src = staticFile(
    srcProp ?? (variant === "day" ? "art/poc_v3/poc_cloud_far.png" : "art/poc_v3/poc_cloud_near.png")
  );
  const tileW = 1600;
  const farOffset = -((t * speedPxPerSec * 0.48) % tileW);
  const nearOffset = -((t * speedPxPerSec) % tileW) - 420;
  const bobY = Math.sin(t * 0.45) * 5;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top,
        width: 1080,
        height,
        overflow: "hidden",
        pointerEvents: "none",
        WebkitMaskImage: `linear-gradient(to bottom, rgba(0,0,0,0.92) 0%, rgba(0,0,0,1) ${Math.max(
          20,
          horizonMaskPercent - 22
        )}%, rgba(0,0,0,0) 100%)`,
        maskImage: `linear-gradient(to bottom, rgba(0,0,0,0.92) 0%, rgba(0,0,0,1) ${Math.max(
          20,
          horizonMaskPercent - 22
        )}%, rgba(0,0,0,0) 100%)`,
      }}
    >
      {/* Far sky cloud deck */}
      <div
        style={{
          position: "absolute",
          left: farOffset,
          top: 10,
          width: tileW * 2,
          height: height * 0.78,
          display: "flex",
          opacity: opacity * 0.68,
          mixBlendMode: variant === "day" ? "screen" : "normal",
        }}
      >
        <Img src={src} style={{ width: tileW, height: "100%", objectFit: "fill" }} />
        <Img src={src} style={{ width: tileW, height: "100%", objectFit: "fill" }} />
      </div>

      {/* Nearer painted cloud wisps with gentle vertical float */}
      <div
        style={{
          position: "absolute",
          left: nearOffset,
          top: Math.round(height * 0.16 + bobY),
          width: tileW * 2,
          height: height * 0.84,
          display: "flex",
          opacity: opacity * 0.92,
          mixBlendMode: variant === "day" ? "screen" : "soft-light",
        }}
      >
        <Img src={src} style={{ width: tileW, height: "100%", objectFit: "fill" }} />
        <Img src={src} style={{ width: tileW, height: "100%", objectFit: "fill" }} />
      </div>
    </div>
  );
};

export interface FoliageBranchSpec {
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  origin: string;
  baseAngle?: number;
  swayDeg?: number;
  freqHz?: number;
  phase?: number;
  flipX?: boolean;
  blurPx?: number;
  opacity?: number;
}

/** Articulated multi-harmonic wind sway on isolated painted tropical foliage sprites. */
export const WindFoliage25D: React.FC<{ branches: FoliageBranchSpec[] }> = ({ branches }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  return (
    <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden" }}>
      {branches.map((b, i) => {
        const wave = evalWindHarmonic(t, b.freqHz ?? 0.32, b.phase ?? i * 1.15);
        const angle = (b.baseAngle ?? 0) + wave * (b.swayDeg ?? 3.6);
        const skew = wave * 1.15;
        const driftX = wave * 3.5;

        return (
          <div
            key={`${b.src}-${i}`}
            style={{
              position: "absolute",
              left: b.x,
              top: b.y,
              width: b.width,
              height: b.height,
              transformOrigin: b.origin,
              transform: `translate(${driftX.toFixed(2)}px, 0px) rotate(${angle.toFixed(
                2
              )}deg) skewX(${skew.toFixed(2)}deg) scaleX(${b.flipX ? -1 : 1})`,
              opacity: b.opacity ?? 0.96,
              filter: b.blurPx ? `blur(${b.blurPx}px)` : undefined,
            }}
          >
            <Img
              src={staticFile(b.src)}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** Drifting hand-painted leaves blown diagonally across the breeze with gentle tumble flutter. */
export const DriftingLeafParticles: React.FC<{
  count?: number;
  variant?: "sunlit" | "dusk";
  windDir?: 1 | -1;
  top?: number;
  height?: number;
}> = ({ count = 7, variant = "sunlit", windDir = 1, top = 80, height = 1350 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const leaves = Array.from({ length: count }, (_, idx) => {
    const u = (idx + 0.5) / count;
    const speedX = (75 + (idx % 3) * 28) * windDir;
    const startX = windDir > 0 ? -120 - idx * 140 : 1200 + idx * 140;
    const rawX = startX + t * speedX;
    // Wrap seamlessly over wide margin [-160..1240]
    const span = 1400;
    const x = (((rawX + 160) % span) + span) % span - 160;
    const y =
      top +
      ((idx * 179) % Math.max(240, height - 120)) +
      t * (22 + (idx % 3) * 8) +
      Math.sin(t * 1.9 + idx * 1.7) * 26;
    const rot = (t * 48 + idx * 52) * windDir + Math.sin(t * 2.4 + idx) * 22;
    const tumble = 0.45 + 0.55 * Math.abs(Math.cos(t * 2.1 + idx * 0.9));
    const scale = 0.72 + (idx % 3) * 0.24;
    const fill =
      variant === "sunlit"
        ? idx % 2 === 0
          ? "#9fb555"
          : "#7a9342"
        : idx % 2 === 0
        ? "#5f6e4e"
        : "#444c45";
    return { x, y, rot, tumble, scale, fill, idx };
  });

  return (
    <svg
      width={1080}
      height={1920}
      viewBox="0 0 1080 1920"
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      {leaves.map((l) => (
        <g
          key={l.idx}
          transform={`translate(${l.x.toFixed(1)}, ${l.y.toFixed(1)}) rotate(${l.rot.toFixed(
            1
          )}) scale(${l.scale.toFixed(2)}, ${(l.scale * l.tumble).toFixed(2)})`}
          opacity={variant === "sunlit" ? 0.68 : 0.5}
        >
          <path
            d="M -14 0 Q -4 -10 14 0 Q -4 10 -14 0 Z"
            fill={l.fill}
            stroke="rgba(30,24,14,0.35)"
            strokeWidth={0.9}
          />
          <line x1={-12} y1={0} x2={11} y2={0} stroke="rgba(255,245,210,0.3)" strokeWidth={0.8} />
        </g>
      ))}
    </svg>
  );
};

/** Dappled afternoon tree-branch shadows outside classroom windows swaying naturally across rays & floor. */
export const WindowLeafGoboSway: React.FC<{
  opacity?: number;
  speed?: number;
}> = ({ opacity = 0.14, speed = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (frame / fps) * speed;

  const sway1 = evalWindHarmonic(t, 0.28, 0.4) * 28;
  const sway2 = evalWindHarmonic(t, 0.37, 1.9) * 18;

  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        mixBlendMode: "multiply",
        opacity,
        filter: "blur(16px)",
      }}
    >
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        {/* Projected diagonal branch/leaf shadows entering from left window (angle ~40deg) */}
        <g transform={`translate(${(sway1 * 1.1).toFixed(1)}, ${(sway1 * 0.5).toFixed(1)}) rotate(32 180 650)`}>
          <ellipse cx={260} cy={520} rx={120} ry={44} fill="#1f1408" />
          <ellipse cx={410} cy={620} rx={145} ry={52} fill="#1f1408" />
          <ellipse cx={580} cy={740} rx={115} ry={40} fill="#1f1408" />
          <ellipse cx={310} cy={780} rx={130} ry={46} fill="#1f1408" />
        </g>
        <g transform={`translate(${(sway2 * 0.9).toFixed(1)}, ${(-sway2 * 0.4).toFixed(1)}) rotate(38 220 900)`}>
          <ellipse cx={280} cy={1120} rx={165} ry={48} fill="#1f1408" />
          <ellipse cx={490} cy={1260} rx={190} ry={56} fill="#1f1408" />
          <ellipse cx={720} cy={1420} rx={155} ry={42} fill="#1f1408" />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/** Creeping highland morning valley mist for Garut Priangan (S3). */
export const HighlandValleyMist: React.FC<{
  src?: string;
  top?: number;
  height?: number;
  opacity?: number;
  speedPxPerSec?: number;
}> = ({ src: srcProp, top = 620, height = 380, opacity = 0.42, speedPxPerSec = 15 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const src = staticFile(srcProp ?? "art/poc_v3/poc_cloud_far.png");
  const tileW = 1500;
  const xOff = -((t * speedPxPerSec) % tileW);
  const yBob = Math.sin(t * 0.52) * 4;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: Math.round(top + yBob),
        width: 1080,
        height,
        overflow: "hidden",
        pointerEvents: "none",
        opacity,
        mixBlendMode: "screen",
        WebkitMaskImage:
          "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 28%, rgba(0,0,0,1) 72%, rgba(0,0,0,0) 100%)",
        maskImage:
          "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 28%, rgba(0,0,0,1) 72%, rgba(0,0,0,0) 100%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: xOff,
          top: 0,
          width: tileW * 2,
          height: "100%",
          display: "flex",
        }}
      >
        <Img src={src} style={{ width: tileW, height: "100%", objectFit: "fill" }} />
        <Img src={src} style={{ width: tileW, height: "100%", objectFit: "fill" }} />
      </div>
    </div>
  );
};

/** Subtle warm tungsten bulb/lantern shimmer that breathes life into interior lights & dusk doorways. */
export const TungstenBreathGlow: React.FC<{
  x: number;
  y: number;
  radius: number;
  color?: string;
  baseOpacity?: number;
  pulseAmp?: number;
}> = ({
  x,
  y,
  radius,
  color = "rgba(255,198,108,0.85)",
  baseOpacity = 0.24,
  pulseAmp = 0.045,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const pulse =
    Math.sin(t * 2.1) * 0.55 + Math.sin(t * 4.8 + 0.7) * 0.3 + Math.sin(t * 7.3) * 0.15;
  const op = Math.max(0.05, Math.min(0.65, baseOpacity + pulse * pulseAmp));

  return (
    <div
      style={{
        position: "absolute",
        left: x - radius,
        top: y - radius,
        width: radius * 2,
        height: radius * 2,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color} 0%, rgba(235,148,58,0.22) 48%, rgba(0,0,0,0) 76%)`,
        opacity: op,
        mixBlendMode: "screen",
        pointerEvents: "none",
      }}
    />
  );
};
