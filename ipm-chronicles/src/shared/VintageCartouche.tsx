import React from "react";
import { Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT_SANS, FONT_SERIF, HERITAGE } from "./PaperTextures";

/**
 * Notch-cornered SVG vintage parchment path matching museum cartographic ribbons
 * ("Jalan Raya Pos" aesthetic: inward stepped corners + inner double hairline).
 */
function buildNotchedPath(w: number, h: number, n: number): string {
  return [
    `M ${n},0`,
    `L ${w - n},0`,
    `Q ${w - n},${n} ${w},${n}`,
    `L ${w},${h - n}`,
    `Q ${w - n},${h - n} ${w - n},${h}`,
    `L ${n},${h}`,
    `Q ${n},${h - n} 0,${h - n}`,
    `L 0,${n}`,
    `Q ${n},${n} ${n},0`,
    "Z",
  ].join(" ");
}

/**
 * Embossed red wax stamp with organic hand-poured scalloped silhouette,
 * radial lighting sheen, and debossed serif year. Zero CSS box-shadow slop.
 */
export const RedWaxSeal: React.FC<{
  text: string;
  size?: number;
  triggerFrame?: number;
  subtitle?: string;
}> = ({ text, size = 148, triggerFrame = 0, subtitle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - triggerFrame;
  if (local < 0) return null;

  const immediate = triggerFrame <= 2;
  const slam = immediate
    ? 1
    : spring({
        frame: local,
        fps,
        config: { damping: 12, stiffness: 220, mass: 0.7 },
      });
  const scale = interpolate(slam, [0, 1], [1.45, 1]);
  const op = immediate ? 1 : Math.min(1, local / 4);

  const r = size * 0.44;
  const cx = size / 2;
  const cy = size / 2;
  const pts: string[] = [];
  const lobes = 20;
  for (let i = 0; i <= lobes * 3; i++) {
    const a = (i / (lobes * 3)) * Math.PI * 2;
    const wobble = 1 + 0.045 * Math.sin(a * lobes) + 0.025 * Math.cos(a * 5 + 1.1);
    const px = cx + Math.cos(a) * r * wobble;
    const py = cy + Math.sin(a) * r * wobble;
    pts.push(`${i === 0 ? "M" : "L"}${px.toFixed(1)},${py.toFixed(1)}`);
  }
  const sealPath = pts.join(" ") + " Z";

  return (
    <div
      style={{
        width: size,
        height: size,
        transform: `scale(${scale.toFixed(3)}) rotate(-4deg)`,
        opacity: op,
        position: "relative",
        pointerEvents: "none",
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <radialGradient id={`waxGrad_${text}`} cx="36%" cy="32%" r="68%">
            <stop offset="0%" stopColor="#c73926" />
            <stop offset="55%" stopColor="#8e2115" />
            <stop offset="100%" stopColor="#4f0d07" />
          </radialGradient>
          <filter id={`waxShadow_${text}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="5" stdDeviation="4" floodColor="#180804" floodOpacity="0.45" />
          </filter>
        </defs>
        <path
          d={sealPath}
          fill={`url(#waxGrad_${text})`}
          stroke="#460b06"
          strokeWidth={1.8}
          filter={`url(#waxShadow_${text})`}
        />
        <circle
          cx={cx}
          cy={cy}
          r={r * 0.78}
          fill="none"
          stroke="rgba(255, 224, 194, 0.35)"
          strokeWidth={1.6}
        />
        <circle
          cx={cx}
          cy={cy}
          r={r * 0.73}
          fill="none"
          stroke="rgba(60, 10, 6, 0.55)"
          strokeWidth={1.5}
        />
        <text
          x={cx}
          y={subtitle ? cy + 3 : cy + 9}
          textAnchor="middle"
          fontFamily={FONT_SERIF}
          fontWeight={800}
          fontSize={text.length > 4 ? size * 0.19 : size * 0.25}
          letterSpacing={1.2}
          fill="#f9e6cf"
          style={{ textShadow: "0 1px 1px rgba(45,6,3,0.7)" }}
        >
          {text}
        </text>
        {subtitle && (
          <text
            x={cx}
            y={cy + size * 0.18}
            textAnchor="middle"
            fontFamily={FONT_SANS}
            fontWeight={800}
            fontSize={size * 0.08}
            letterSpacing={1.5}
            fill="rgba(249,230,207,0.84)"
          >
            {subtitle}
          </text>
        )}
      </svg>
    </div>
  );
};

/**
 * Classic museum parchment cartouche with notched corners, double sepia rule,
 * subtle ornamental diamond flecks, and optional wax seal pinned at corner.
 */
export const ParchmentCartouche: React.FC<{
  width: number;
  height: number;
  kicker?: string;
  title: string;
  subtitle?: string;
  triggerFrame?: number;
  waxYear?: string;
  titleSize?: number;
  dark?: boolean;
}> = ({
  width,
  height,
  kicker,
  title,
  subtitle,
  triggerFrame = 0,
  waxYear,
  titleSize = 44,
  dark = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - triggerFrame;
  if (local < 0) return null;

  const immediate = triggerFrame === 0;
  const enter = immediate
    ? 1
    : spring({
        frame: local,
        fps,
        config: { damping: 14, stiffness: 165 },
      });
  const op = immediate ? 1 : Math.min(1, local / 6);
  const dy = (1 - enter) * 14;
  const notch = 16;
  const pad = 8;

  const outerPath = buildNotchedPath(width, height, notch);
  const innerPath = buildNotchedPath(width - pad * 2, height - pad * 2, Math.max(8, notch - 4));

  const bgFill = dark ? "#221810" : "#f5ebda";
  const borderCol = dark ? "#b98a42" : "#5e4326";
  const innerCol = dark ? "rgba(185, 138, 66, 0.45)" : "rgba(110, 80, 48, 0.45)";
  const titleCol = dark ? "#f5ead6" : "#21140b";
  const subCol = dark ? "#d8bf96" : "#6b4d2e";
  const kickCol = dark ? "#d48a46" : "#8d2416";

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        transform: `translateY(${dy.toFixed(1)}px) scale(${(0.96 + 0.04 * enter).toFixed(3)})`,
        opacity: op,
        pointerEvents: "none",
      }}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <filter id="cartoucheDrop" x="-10%" y="-15%" width="120%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#180e06" floodOpacity="0.28" />
          </filter>
        </defs>
        <path
          d={outerPath}
          fill={bgFill}
          stroke={borderCol}
          strokeWidth={2.2}
          filter="url(#cartoucheDrop)"
        />
        <g transform={`translate(${pad}, ${pad})`}>
          <path d={innerPath} fill="none" stroke={innerCol} strokeWidth={1.3} />
        </g>
        {/* Top/bottom centered ink diamond ornaments */}
        <polygon
          points={`${width / 2},-4 ${width / 2 + 6},2 ${width / 2},8 ${width / 2 - 6},2`}
          fill={borderCol}
        />
        <polygon
          points={`${width / 2},${height - 8} ${width / 2 + 6},${height - 2} ${width / 2},${height + 4} ${width / 2 - 6},${height - 2}`}
          fill={borderCol}
        />
      </svg>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: waxYear ? "16px 68px 16px 46px" : "16px 44px",
          textAlign: "center",
          boxSizing: "border-box",
        }}
      >
        {kicker && (
          <div
            style={{
              fontFamily: FONT_SANS,
              fontSize: 15,
              fontWeight: 800,
              letterSpacing: 3.2,
              color: kickCol,
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            {kicker}
          </div>
        )}
        <div
          style={{
            fontFamily: FONT_SERIF,
            fontSize: titleSize,
            fontWeight: 800,
            color: titleCol,
            lineHeight: 1.08,
            letterSpacing: -0.4,
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              fontFamily: FONT_SERIF,
              fontStyle: "italic",
              fontSize: 22,
              color: subCol,
              marginTop: 7,
              letterSpacing: 0.4,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>

      {waxYear && (
        <div style={{ position: "absolute", right: -34, bottom: -30, zIndex: 2 }}>
          <RedWaxSeal text={waxYear} size={118} triggerFrame={triggerFrame + 6} />
        </div>
      )}
    </div>
  );
};

/**
 * Hand-crafted animated vintage brass & oak hourglass inspired by Motionformat (t=35s):
 * Animated sand cone emptying at top, thin falling golden stream, rising pyramid below.
 */
export const BrassHourglass: React.FC<{
  size?: number;
  startFrame?: number;
  durationFrames?: number;
}> = ({ size = 270, startFrame = 0, durationFrames = 140 }) => {
  const frame = useCurrentFrame();
  const local = Math.max(0, frame - startFrame);
  const p = interpolate(local, [0, durationFrames], [0.12, 0.88], {
    easing: Easing.inOut(Easing.quad),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const topFrac = 1 - p;
  const botFrac = p;
  const tilt = Math.sin(local * 0.04) * 1.2;

  return (
    <svg
      width={size}
      height={size * 1.45}
      viewBox="0 0 200 290"
      style={{
        transform: `rotate(${tilt.toFixed(2)}deg)`,
        filter: "drop-shadow(0 14px 22px rgba(10,6,3,0.45))",
      }}
    >
      <defs>
        <linearGradient id="oakWood" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#4c2c16" />
          <stop offset="45%" stopColor="#7a4c28" />
          <stop offset="100%" stopColor="#3e2210" />
        </linearGradient>
        <linearGradient id="brassRod" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#856021" />
          <stop offset="45%" stopColor="#dfb458" />
          <stop offset="100%" stopColor="#7a571e" />
        </linearGradient>
        <linearGradient id="sandGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e2be6c" />
          <stop offset="100%" stopColor="#b88435" />
        </linearGradient>
        <clipPath id="topBulbClip">
          <path d="M52,44 C52,98 86,122 97,140 L103,140 C114,122 148,98 148,44 Z" />
        </clipPath>
        <clipPath id="botBulbClip">
          <path d="M97,150 C86,168 52,192 52,246 L148,246 C148,192 114,168 103,150 Z" />
        </clipPath>
      </defs>

      {/* Turned brass pillars */}
      <rect x="34" y="42" width="8" height="206" rx="3" fill="url(#brassRod)" stroke="#2f1c0b" strokeWidth="1.2" />
      <rect x="158" y="42" width="8" height="206" rx="3" fill="url(#brassRod)" stroke="#2f1c0b" strokeWidth="1.2" />

      {/* Top & Bottom oak caps */}
      <rect x="20" y="18" width="160" height="16" rx="4" fill="url(#oakWood)" stroke="#261408" strokeWidth="1.8" />
      <rect x="26" y="34" width="148" height="10" rx="2" fill="url(#brassRod)" stroke="#261408" strokeWidth="1.2" />
      <rect x="26" y="246" width="148" height="10" rx="2" fill="url(#brassRod)" stroke="#261408" strokeWidth="1.2" />
      <rect x="20" y="256" width="160" height="16" rx="4" fill="url(#oakWood)" stroke="#261408" strokeWidth="1.8" />

      {/* Glass envelope */}
      <path
        d="M52,44 C52,98 86,122 97,140 L97,150 C86,168 52,192 52,246 L148,246 C148,192 114,168 103,150 L103,140 C114,122 148,98 148,44 Z"
        fill="rgba(255, 248, 232, 0.22)"
        stroke="#4f361e"
        strokeWidth="2.4"
      />

      {/* Upper sand */}
      <g clipPath="url(#topBulbClip)">
        <rect
          x="44"
          y={142 - topFrac * 92}
          width="112"
          height={topFrac * 96}
          fill="url(#sandGold)"
        />
      </g>

      {/* Falling thin stream + grain */}
      <line
        x1="100"
        y1="145"
        x2="100"
        y2={246 - botFrac * 66}
        stroke="#e0b85d"
        strokeWidth="2.2"
        strokeDasharray="6 3"
        strokeDashoffset={-(local * 3.5)}
      />

      {/* Lower sand pyramid */}
      <g clipPath="url(#botBulbClip)">
        <path
          d={`M42,248 L100,${(246 - botFrac * 78).toFixed(1)} L158,248 Z`}
          fill="url(#sandGold)"
        />
      </g>

      {/* Glass specular catch */}
      <path
        d="M64,56 C65,86 80,108 90,124"
        fill="none"
        stroke="rgba(255,255,255,0.48)"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <path
        d="M64,234 C65,204 80,184 90,168"
        fill="none"
        stroke="rgba(255,255,255,0.34)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
};

/** Discreet archival margin ink-stamp for reconstructed historical scenes */
export const ReconstructInkStamp: React.FC<{ dark?: boolean }> = ({ dark = false }) => (
  <div
    style={{
      position: "relative",
      overflow: "hidden",
      padding: "5px 13px",
      border: `1.5px solid ${dark ? "rgba(241, 230, 207, 0.38)" : "rgba(79, 52, 24, 0.78)"}`,
      borderRadius: 3,
      fontFamily: FONT_SANS,
      fontSize: 12.5,
      fontWeight: 800,
      letterSpacing: 2.2,
      color: dark ? "rgba(241, 230, 207, 0.86)" : "#26170a",
      background: dark
        ? "linear-gradient(155deg, rgba(28, 22, 16, 0.78), rgba(18, 14, 10, 0.86))"
        : "linear-gradient(155deg, rgba(248, 236, 212, 0.96), rgba(227, 201, 159, 0.96))",
      boxShadow: dark
        ? "-3px 6px 10px rgba(0, 0, 0, 0.44), inset 0 1px 0 rgba(255, 240, 210, 0.14)"
        : "-3px 6px 10px rgba(24, 12, 4, 0.36), inset 0 1px 0 rgba(255, 252, 242, 0.72)",
    }}
  >
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `url(${staticFile("art/textures/parchment_grain_alpha.png")})`,
        backgroundSize: "256px 256px",
        opacity: dark ? 0.52 : 0.72,
        pointerEvents: "none",
      }}
    />
    <span style={{ position: "relative", zIndex: 1 }}>REKONSTRUKSI</span>
  </div>
);
