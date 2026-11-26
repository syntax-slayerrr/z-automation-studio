import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { EVOLUTION_TOKENS } from './tokens';

export type CaptionSpatialZone =
  | 'top-left'
  | 'mid-left'
  | 'bottom-left'
  | 'bottom-right'
  | 'custom';

export interface WordTimingItem {
  word: string;
  startFrame: number;
  /** Highlight word in signature evolutionary warm gold (#F6AD2B) */
  highlight?: boolean;
  /** Force a line break BEFORE this word */
  lineBreakBefore?: boolean;
  /** Use slightly smaller secondary line scale (56px vs 72px) */
  secondaryScale?: boolean;
}

export interface BlurWordCaptionProps {
  words: WordTimingItem[];
  endFrame: number;
  zone?: CaptionSpatialZone;
  customTopPct?: number;
  customLeftPct?: number;
  maxWidthPct?: number;
  heroTitleScale?: boolean;
}

/**
 * 1:1 Directional Optical Blur-Reveal Caption (`BlurWordCaption`)
 * Forensic match to f=0..1485:
 * - ZERO background boxes / pills / strokes!
 * - Each word enters from soft Gaussian blur (12px -> 0px) + opacity (0 -> 1) over 7 frames,
 *   and the entire clause exits via soft Gaussian blur (0px -> 10px) + opacity (1 -> 0) over 6 frames.
 * - Left-aligned spatial placement that never collides with the central X-ray / USG / 3D subject
 *   or the RightScaleRuler at x=91..94%.
 */
export const BlurWordCaption: React.FC<BlurWordCaptionProps> = ({
  words,
  endFrame,
  zone = 'top-left',
  customTopPct,
  customLeftPct,
  maxWidthPct = 76,
  heroTitleScale = false,
}) => {
  const frame = useCurrentFrame();
  const { typography, safeZones } = EVOLUTION_TOKENS;

  if (words.length === 0) return null;
  const firstStart = words[0].startFrame;
  if (frame < firstStart - 1 || frame > endFrame + typography.wordBlurOutFrames) {
    return null;
  }

  const exitProgress = interpolate(
    frame,
    [endFrame - typography.wordBlurOutFrames, endFrame],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const groupExitBlur = exitProgress * 10;
  const groupExitOpacity = 1 - exitProgress;

  let topPct: number = safeZones.topZoneYPct;
  let leftPct: number = safeZones.leftPct;
  let textAlign: 'left' | 'right' = 'left';

  if (zone === 'mid-left') topPct = safeZones.midZoneYPct;
  else if (zone === 'bottom-left') topPct = safeZones.bottomZoneYPct;
  else if (zone === 'bottom-right') {
    topPct = 73.5;
    leftPct = 44.0;
    textAlign = 'right';
  } else if (zone === 'custom') {
    topPct = customTopPct ?? safeZones.topZoneYPct;
    leftPct = customLeftPct ?? safeZones.leftPct;
  }

  // Group words into explicit lines so Line 1 can be 72px and Line 2 can be 56px cleanly
  const lines: WordTimingItem[][] = [[]];
  words.forEach((w) => {
    if (w.lineBreakBefore && lines[lines.length - 1].length > 0) {
      lines.push([w]);
    } else {
      lines[lines.length - 1].push(w);
    }
  });

  return (
    <div
      style={{
        position: 'absolute',
        top: `${topPct}%`,
        left: `${leftPct}%`,
        width: `${maxWidthPct}%`,
        textAlign,
        pointerEvents: 'none',
        fontFamily: typography.fontFamily,
        lineHeight: typography.lineHeight,
        letterSpacing: typography.letterSpacing,
        opacity: groupExitOpacity,
        filter: groupExitBlur > 0.15 ? `blur(${groupExitBlur.toFixed(2)}px)` : undefined,
      }}
    >
      {lines.map((lineWords, lineIdx) => {
        const isSecondaryLine =
          !heroTitleScale && (lineIdx > 0 || lineWords.some((w) => w.secondaryScale));
        const fontSize = heroTitleScale
          ? typography.heroTitleSizePx
          : isSecondaryLine
            ? typography.secondarySizePx
            : typography.primarySizePx;

        return (
          <div
            key={lineIdx}
            style={{
              fontSize,
              fontWeight: isSecondaryLine
                ? typography.fontWeightSecondary
                : typography.fontWeightPrimary,
              marginBottom: lineIdx < lines.length - 1 ? 6 : 0,
            }}
          >
            {lineWords.map((item, wIdx) => {
              const enterP = interpolate(
                frame,
                [item.startFrame, item.startFrame + typography.wordBlurInFrames],
                [0, 1],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
              );
              const wordBlur = (1 - enterP) * typography.maxBlurPx;
              const wordX = (1 - enterP) * 10;
              const color = item.highlight ? typography.keywordGold : typography.textWhite;

              return (
                <span
                  key={`${lineIdx}-${wIdx}-${item.word}`}
                  style={{
                    display: 'inline-block',
                    marginRight: '0.26em',
                    color,
                    opacity: enterP,
                    transform: `translateX(${wordX.toFixed(2)}px)`,
                    filter: wordBlur > 0.15 ? `blur(${wordBlur.toFixed(2)}px)` : 'none',
                    textShadow: typography.textShadow,
                  }}
                >
                  {item.word}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export interface RightScaleRulerProps {
  /** 0..1 normalized vertical position of the golden triangle indicator; omit to hide arrow */
  indicatorProgress?: number;
  opacity?: number;
}

/**
 * 1:1 Right-Edge Scientific Scale / Depth Gauge (`RightScaleRuler`)
 * Measured directly on f=60 (underwater depth) and f=525..855 (USG diagnostic scale).
 */
export const RightScaleRuler: React.FC<RightScaleRulerProps> = ({
  indicatorProgress,
  opacity = 1,
}) => {
  const { width, height, instruments } = EVOLUTION_TOKENS;
  const r = instruments.ruler;

  const rightX = (r.rightEdgeXPct / 100) * width;
  const topY = (r.topYPct / 100) * height;
  const bottomY = (r.bottomYPct / 100) * height;
  const totalSpan = bottomY - topY;
  const totalIntervals = (r.majorCount - 1) * (r.minorPerInterval + 1);

  const ticks: React.ReactNode[] = [];
  for (let i = 0; i <= totalIntervals; i++) {
    const isMajor = i % (r.minorPerInterval + 1) === 0;
    const y = topY + (i / totalIntervals) * totalSpan;
    const w = isMajor ? r.majorTickWidthPx : r.minorTickWidthPx;
    const h = isMajor ? r.majorTickHeightPx : r.minorTickHeightPx;
    ticks.push(
      <line
        key={i}
        x1={rightX - w}
        y1={y}
        x2={rightX}
        y2={y}
        stroke={isMajor ? r.majorColor : r.minorColor}
        strokeWidth={h}
        strokeLinecap="round"
      />,
    );
  }

  const clampedProg =
    indicatorProgress !== undefined
      ? Math.max(0, Math.min(1, indicatorProgress))
      : undefined;
  const indY = clampedProg !== undefined ? topY + clampedProg * totalSpan : 0;
  const indTipX = rightX - r.majorTickWidthPx - 10;
  const s = r.indicatorSizePx;

  return (
    <svg
      width={width}
      height={height}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity }}
    >
      {ticks}
      {clampedProg !== undefined && (
        <polygon
          points={`${indTipX},${indY} ${indTipX + s},${indY - s * 0.58} ${indTipX + s},${indY + s * 0.58}`}
          fill={r.indicatorHex}
        />
      )}
    </svg>
  );
};

export interface ScientificCalloutLineProps {
  /** Normalized 0..100 percentages of 1080x1920 frame */
  fromXPct: number;
  fromYPct: number;
  toXPct: number;
  toYPct: number;
  startFrame: number;
  endFrame: number;
  drawFrames?: number;
}

/**
 * 1:1 Crisp White Leader Line + Hollow Target Ring (`ScientificCalloutLine`)
 * Forensic match to f=168 ("cuma kacamata kayu" -> bridge), f=450 ("peneliti"), f=615 ("Limpa orang Bajo").
 */
export const ScientificCalloutLine: React.FC<ScientificCalloutLineProps> = ({
  fromXPct,
  fromYPct,
  toXPct,
  toYPct,
  startFrame,
  endFrame,
  drawFrames = 10,
}) => {
  const frame = useCurrentFrame();
  const { width, height, instruments } = EVOLUTION_TOKENS;
  const c = instruments.callout;

  if (frame < startFrame || frame > endFrame) return null;

  const drawP = interpolate(frame, [startFrame, startFrame + drawFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeOutP = interpolate(frame, [endFrame - 6, endFrame], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const x1 = (fromXPct / 100) * width;
  const y1 = (fromYPct / 100) * height;
  const x2 = (toXPct / 100) * width;
  const y2 = (toYPct / 100) * height;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  // Stop line neatly at the perimeter of the hollow target circle!
  const stopRatio = dist > c.targetRingRadiusPx ? (dist - c.targetRingRadiusPx) / dist : 1;
  const curRatio = stopRatio * drawP;

  const lx = x1 + dx * curRatio;
  const ly = y1 + dy * curRatio;

  return (
    <svg
      width={width}
      height={height}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: fadeOutP }}
    >
      <line
        x1={x1}
        y1={y1}
        x2={lx}
        y2={ly}
        stroke={c.strokeColor}
        strokeWidth={c.strokeWidthPx}
        strokeLinecap="round"
      />
      {drawP > 0.65 && (
        <circle
          cx={x2}
          cy={y2}
          r={c.targetRingRadiusPx * interpolate(drawP, [0.65, 1], [0.4, 1], { extrapolateRight: 'clamp' })}
          fill="none"
          stroke={c.strokeColor}
          strokeWidth={c.targetRingStrokePx}
        />
      )}
    </svg>
  );
};

export interface WaterlineBreachWipeProps {
  /** Normalized 0..100 Y position of the undulating meniscus line (0 = top underwater, 52 = split waterline, 105 = exited below) */
  waterlineYPct: number;
  waveAmplitudePx?: number;
  waterTint?: string;
  opacity?: number;
}

/**
 * 1:1 Split-Waterline Meniscus Transition (`WaterlineBreachWipe`)
 * Forensic match to f=270..306 where the ocean surface drops down the lens with a crisp white scalloped wave crest.
 */
export const WaterlineBreachWipe: React.FC<WaterlineBreachWipeProps> = ({
  waterlineYPct,
  waveAmplitudePx = 16,
  waterTint = 'rgba(0, 118, 148, 0.56)',
  opacity = 1,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = EVOLUTION_TOKENS;

  if (waterlineYPct >= 104 || opacity <= 0.01) return null;

  const baseY = (waterlineYPct / 100) * height;
  const phase = frame * 0.18;
  const segments = 36;
  const pts: string[] = [];

  for (let i = 0; i <= segments; i++) {
    const x = (i / segments) * width;
    const wave =
      Math.sin((i / segments) * Math.PI * 5 + phase) * waveAmplitudePx +
      Math.cos((i / segments) * Math.PI * 9 - phase * 1.3) * (waveAmplitudePx * 0.35);
    const y = baseY + wave;
    pts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }

  const crestPath = pts.join(' ');
  const fillPath = `${crestPath} L ${width} ${height + 40} L 0 ${height + 40} Z`;

  return (
    <svg
      width={width}
      height={height}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity }}
    >
      <path d={fillPath} fill={waterTint} />
      <path
        d={crestPath}
        fill="none"
        stroke="rgba(232, 252, 255, 0.92)"
        strokeWidth={10}
        strokeLinecap="round"
      />
      <path
        d={crestPath}
        fill="none"
        stroke="rgba(112, 234, 255, 0.45)"
        strokeWidth={22}
        strokeLinecap="round"
      />
    </svg>
  );
};

export interface CloudCurtainPortalProps {
  /** 0 = completely clear, 1 = clouds completely fill the 9:16 frame */
  coverage: number;
  seed?: number;
}

/**
 * 1:1 Volumetric Organic Cloud-Curtain Portal Transition (`CloudCurtainPortal`)
 * Upgraded with SVG fractal-noise cloud billows + sunlit warm-white / cool-mist atmospheric shading
 * so every cloud transition glides like real cinematic mountain/aerial mist!
 */
export const CloudCurtainPortal: React.FC<CloudCurtainPortalProps> = ({
  coverage,
  seed = 7,
}) => {
  const frame = useCurrentFrame();
  if (coverage <= 0.01) return null;

  const clamped = Math.max(0, Math.min(1, coverage));
  const driftX = Math.sin((frame + seed * 11) * 0.03) * 42;
  const spread = (1 - clamped) * 48;

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', overflow: 'hidden' }}>
      <svg
        width="1080"
        height="1920"
        viewBox="0 0 1080 1920"
        style={{ position: 'absolute', inset: 0, opacity: Math.min(1, clamped * 1.15) }}
      >
        <defs>
          <filter id={`cloud-billow-${seed}`} x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.0085"
              numOctaves="4"
              seed={seed}
              result="noise"
            />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="135" xChannelSelector="R" yChannelSelector="G" />
            <feGaussianBlur stdDeviation="24" />
          </filter>
          <linearGradient id={`cloud-grad-${seed}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="52%" stopColor="#E4EFF7" />
            <stop offset="100%" stopColor="#C4D8E8" />
          </linearGradient>
        </defs>

        {/* Full atmospheric mist core peaking right at swap frame */}
        <rect
          x={0}
          y={0}
          width={1080}
          height={1920}
          fill={`url(#cloud-grad-${seed})`}
          opacity={Math.pow(clamped, 1.55)}
        />

        {/* Billowing Left & Right Volumetric Cloud Banks */}
        <g filter={`url(#cloud-billow-${seed})`}>
          <ellipse cx={180 - spread * 14 + driftX} cy={380} rx={520} ry={460} fill="#FFFFFF" opacity={0.95} />
          <ellipse cx={920 + spread * 14 - driftX} cy={520} rx={540} ry={480} fill="#F2F7FB" opacity={0.94} />
          <ellipse cx={260 - spread * 12 - driftX * 0.7} cy={1120} rx={560} ry={500} fill="#EAF3FA" opacity={0.95} />
          <ellipse cx={860 + spread * 12 + driftX * 0.7} cy={1460} rx={540} ry={490} fill="#FFFFFF" opacity={0.95} />
          <ellipse cx={540} cy={960} rx={480 * clamped + 120} ry={560 * clamped + 140} fill="#F7FAFD" opacity={clamped} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/**
 * Subtle Theatrical 35mm Film Grain + Edge Vignette Finish (`CinematicFilmFinish`)
 * Ties all 3D WebGL & 2D SVG/Canvas scenes together with the exact cinematic finish of the reference video!
 */
export const CinematicFilmFinish: React.FC<{ vignetteStrength?: number; grainOpacity?: number }> = ({
  vignetteStrength = 0.34,
  grainOpacity = 0.045,
}) => {
  const frame = useCurrentFrame();
  // Deterministic subtle grain shift every 2 frames (15 fps organic film grain, zero harsh strobe!)
  const seed = (Math.floor(frame / 2) % 17) + 1;

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 56%, rgba(4,10,18,${vignetteStrength.toFixed(2)}) 100%)`,
        }}
      />
      <svg
        width="1080"
        height="1920"
        viewBox="0 0 1080 1920"
        style={{ position: 'absolute', inset: 0, opacity: grainOpacity, mixBlendMode: 'overlay' }}
      >
        <filter id={`film-grain-${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="2" seed={seed} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="1080" height="1920" filter={`url(#film-grain-${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};

export interface DirectionalWhipBlurProps {
  /** 0 = off, 1 = peak whip-pan blur at cut frame */
  intensity: number;
  direction?: 'horizontal' | 'vertical' | 'diagonal';
  tintHex?: string;
}

/**
 * 1:1 Snappy 6-Frame Directional Whip-Pan Match Transition (`DirectionalWhipBlur`)
 * Forensic match to f=1020..1030 (Underwater -> Wooden Deck) and f=1292..1302 (DNA -> Ocean Rope).
 */
export const DirectionalWhipBlur: React.FC<DirectionalWhipBlurProps> = ({
  intensity,
  direction = 'horizontal',
  tintHex = '#C88B32',
}) => {
  const { fps } = useVideoConfig();
  void fps;
  if (intensity <= 0.02) return null;

  const angle =
    direction === 'horizontal' ? '90deg' : direction === 'vertical' ? '180deg' : '125deg';

  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        opacity: Math.min(0.92, intensity),
        background: `linear-gradient(${angle}, rgba(10,18,28,0.85) 0%, ${tintHex}99 48%, rgba(248,250,252,0.55) 54%, rgba(10,18,28,0.85) 100%)`,
        filter: `blur(${(intensity * 28).toFixed(1)}px)`,
        transform: `scale(${1 + intensity * 0.12})`,
      }}
    />
  );
};
