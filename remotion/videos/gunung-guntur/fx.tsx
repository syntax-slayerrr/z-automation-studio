import React from 'react';
import { staticFile } from 'remotion';
import { SubtitleCardSpec } from './story';

/**
 * 1:1 Forensic Palette Lock from `vintage-poster-explainer` ("Danau Toba" Reference DNA).
 * ZERO pure #000000 or #FFFFFF — rich painted gouache tones + dark sepia ink outlines (#241C1B).
 */
export const VP = {
  ink: '#241C1B',
  inkSoft: '#352A26',
  cream: '#FAF1DC',
  creamWarm: '#EFE6D3',
  rust3D: '#7C3220',
  rustDeep: '#5C2418',
  ribbonBg: '#1E2631',
  ribbonText: '#F5EFE2',
  subBg: '#1B212C',
  subPast: '#F5F2EA',
  subActive: '#F8D348',
  subFuture: 'rgba(156, 164, 176, 0.62)',
  postcardMat: '#C9BEA7',
  postcardHairline: '#3B342C',
  ghostGold: '#FAF0CE',
  strata: ['#945534', '#C27A44', '#E0C398', '#6E4229', '#36211B'] as const,
  magmaHot: '#FFF2A6',
  magmaMid: '#F28828',
  magmaRim: '#C4321E',
  atlasOcean: '#244F68',
  atlasShelf: '#4D859C',
  atlasLand: '#B49862',
  atlasBorder: '#2E241C',
};

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * clamp(t, 0, 1);
export const easeInOut = (t: number) => {
  const c = clamp(t, 0, 1);
  return c * c * (3 - 2 * c);
};
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
export const easeOutQuint = (t: number) => 1 - Math.pow(1 - clamp(t, 0, 1), 5);
export const easeInOutCubic = (t: number) => {
  const c = clamp(t, 0, 1);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
};
export const springSettle = (t: number) => {
  const c = clamp(t, 0, 1);
  if (c === 0 || c === 1) return c;
  return 1 - Math.exp(-6.0 * c) * Math.cos(c * Math.PI * 1.45);
};
export const microShake = (f: number, startF: number, dur = 18, mag = 9): { x: number; y: number } => {
  const dt = f - startF;
  if (dt < 0 || dt > dur) return { x: 0, y: 0 };
  const decay = Math.pow(1 - dt / dur, 1.85);
  return { x: Math.sin(dt * 3.1) * mag * decay, y: Math.cos(dt * 3.9) * mag * 0.72 * decay };
};
export const continuousShake = (f: number, intensity: number): { x: number; y: number } => ({
  x: (Math.sin(f * 2.7) * 0.65 + Math.cos(f * 4.3) * 0.35) * intensity,
  y: (Math.cos(f * 3.1) * 0.65 + Math.sin(f * 5.1) * 0.35) * intensity * 0.75,
});

/** Offline Local Google Fonts Injection (100% deterministic in headless Chromium!) */
export const VintagePosterFonts: React.FC = () => (
  <style>{`
    @font-face {
      font-family: 'Alfa Slab One';
      font-style: normal;
      font-weight: 400;
      font-display: block;
      src: url('${staticFile('fonts/AlfaSlabOne-Regular.woff2')}') format('woff2');
    }
    @font-face {
      font-family: 'Plus Jakarta Sans';
      font-style: normal;
      font-weight: 400 800;
      font-display: block;
      src: url('${staticFile('fonts/PlusJakartaSans-Variable.woff2')}') format('woff2');
    }
  `}</style>
);

/**
 * 1:1 Static (Non-Boiling!) Vintage Cold-Press Watercolor/Linen Paper Multiply Overlay + Soft Vintage Edge Vignette.
 * Fixed turbulence seed guarantees L1 sky-patch diff = 0.000 (zero flicker/boil).
 */
export const VintagePaperOverlay: React.FC<{ opacity?: number }> = ({ opacity = 0.25 }) => (
  <>
    <svg
      width={720}
      height={1280}
      viewBox="0 0 720 1280"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        mixBlendMode: 'multiply',
        opacity,
      }}
    >
      <defs>
        <filter id="vpPaperTooth" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.62" numOctaves="4" seed="17" result="n" />
          <feColorMatrix type="saturate" values="0.18" in="n" result="d" />
          <feComponentTransfer in="d">
            <feFuncR type="linear" slope="0.94" intercept="0.06" />
            <feFuncG type="linear" slope="0.90" intercept="0.05" />
            <feFuncB type="linear" slope="0.82" intercept="0.04" />
          </feComponentTransfer>
        </filter>
        <filter id="vpLinenStreak" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.014 0.30" numOctaves="2" seed="9" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>
      <rect width={720} height={1280} fill="#EFE6D3" filter="url(#vpPaperTooth)" />
      <rect width={720} height={1280} fill="#D8CBB2" filter="url(#vpLinenStreak)" opacity={0.42} />
    </svg>
    {/* Subtle Warm Vintage Poster Corner Depth Vignette */}
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 48%, rgba(28,22,20,0) 58%, rgba(28,20,18,0.22) 100%)',
      }}
    />
  </>
);

/**
 * 1:1 Chunky Alfa Slab One Retro Travel-Poster Title with Burnt-Sienna 3D Block Shadow + Dark Slate Ticket Ribbon.
 */
export const RetroSlabTitle3D: React.FC<{
  lines: string[];
  subtitle?: string;
  top?: number;
  fontSize?: number;
  opacity?: number;
  scale?: number;
  blurPx?: number;
  subOffsetX?: number;
  subOpacity?: number;
}> = ({
  lines,
  subtitle,
  top = 138,
  fontSize = 64,
  opacity = 1,
  scale = 1,
  blurPx = 0,
  subOffsetX = 0,
  subOpacity = 1,
}) => {
  if (opacity <= 0.01) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top,
        width: 720,
        textAlign: 'center',
        pointerEvents: 'none',
        opacity,
        transform: `scale(${scale.toFixed(3)})`,
        filter: blurPx > 0.2 ? `blur(${blurPx.toFixed(1)}px)` : undefined,
      }}
    >
      {lines.map((line, i) => (
        <div
          key={i}
          style={{
            fontFamily: '"Alfa Slab One", Rockwell, Georgia, serif',
            fontSize,
            lineHeight: 1.06,
            letterSpacing: '2px',
            color: VP.cream,
            WebkitTextStroke: '2.4px #2B1B17',
            paintOrder: 'stroke fill',
            textShadow:
              '1px 1px 0 #7C3220, 2px 2px 0 #7C3220, 3px 3px 0 #6E2C1B, 4px 4px 0 #5C2418, 5px 5px 0 #2B1B17, 0 8px 16px rgba(24,14,12,0.42)',
          }}
        >
          {line}
        </div>
      ))}
      {subtitle && subOpacity > 0.01 && (
        <div
          style={{
            display: 'inline-block',
            marginTop: 12,
            padding: '7px 22px',
            borderRadius: 2,
            backgroundColor: 'rgba(30, 38, 49, 0.93)',
            fontFamily: '"Plus Jakarta Sans", "Segoe UI", sans-serif',
            fontSize: 15,
            fontWeight: 800,
            letterSpacing: '4.2px',
            color: VP.ribbonText,
            textTransform: 'uppercase',
            opacity: subOpacity,
            transform: `translateX(${subOffsetX.toFixed(1)}px)`,
            boxShadow: '0 4px 10px rgba(18, 16, 20, 0.44)',
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
};

/** In-Scene SVG Alfa Slab One Callout (e.g. CIPANAS, CIANJUR, MASIGIT, PARUKUYAN, KABUYUTAN) */
export const SvgSlabLabel: React.FC<{
  x: number;
  y: number;
  text: string;
  fontSize?: number;
  opacity?: number;
  scale?: number;
  anchor?: 'start' | 'middle' | 'end';
}> = ({ x, y, text, fontSize = 34, opacity = 1, scale = 1, anchor = 'middle' }) => {
  if (opacity <= 0.01) return null;
  return (
    <g transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)}) scale(${scale.toFixed(3)})`} opacity={opacity}>
      {/* Burnt-sienna 3D offset block */}
      <text
        x={3.2}
        y={3.4}
        textAnchor={anchor}
        fill={VP.rustDeep}
        stroke="#2B1B17"
        strokeWidth={4}
        paintOrder="stroke fill"
        fontFamily='"Alfa Slab One", Rockwell, Georgia, serif'
        fontSize={fontSize}
        letterSpacing="1.2px"
      >
        {text}
      </text>
      {/* Cream front face */}
      <text
        x={0}
        y={0}
        textAnchor={anchor}
        fill={VP.cream}
        stroke="#241C1B"
        strokeWidth={3.2}
        paintOrder="stroke fill"
        fontFamily='"Alfa Slab One", Rockwell, Georgia, serif'
        fontSize={fontSize}
        letterSpacing="1.2px"
      >
        {text}
      </text>
    </g>
  );
};

/**
 * 1:1 Hand-Brushed Feathered Charcoal Karaoke Subtitle Bar (Danau Toba Exact Spec!).
 * Past: #F5F2EA · Active: #F8D348 (golden-yellow) · Upcoming: muted slate rgba(156,164,176,0.62)
 */
export const BrushedInkSubtitleBar: React.FC<{
  f: number;
  cards: SubtitleCardSpec[];
  fadeOpacity?: number;
}> = ({ f, cards, fadeOpacity = 1 }) => {
  if (fadeOpacity <= 0.01) return null;
  const activeCard = cards.find((c) => f >= c.startFrame && f <= c.endFrame);
  if (!activeCard) return null;

  let activeWordIdx = 0;
  for (const [ws, we, wi] of activeCard.highlights) {
    if (f >= ws && f <= we) {
      activeWordIdx = wi;
      break;
    } else if (f > we) {
      activeWordIdx = wi;
    }
  }
  const enterAlpha = Math.min(1, Math.max(0.45, (f - activeCard.startFrame + 1) / 3)) * fadeOpacity;
  const maxChars = Math.max(...activeCard.lines.map((l) => l.length));
  const barW = Math.max(290, Math.min(600, Math.round(maxChars * 16.8 + 94)));
  const barH = activeCard.lines.length === 1 ? 56 : 92;
  const cy = activeCard.lines.length === 1 ? 1024 : 1034;

  const buildBrushPath = (w: number, h: number, seed: number) => {
    const segs = 14;
    const pts: string[] = [];
    pts.push(`M 20 4 L ${w - 20} 3`);
    for (let i = 0; i <= segs; i++) {
      const y = 3 + ((h - 6) * i) / segs;
      const jut = (i % 3 === 0 ? 19 : i % 2 === 0 ? 7 : -9) + Math.sin(i * 4.1 + seed) * 6;
      pts.push(`L ${(w - 18 + jut).toFixed(1)} ${y.toFixed(1)}`);
    }
    pts.push(`L 20 ${h - 4}`);
    for (let i = segs; i >= 0; i--) {
      const y = 3 + ((h - 6) * i) / segs;
      const jut = (i % 3 === 1 ? -19 : i % 2 === 0 ? -7 : 9) + Math.cos(i * 3.7 + seed) * 6;
      pts.push(`L ${(18 + jut).toFixed(1)} ${y.toFixed(1)}`);
    }
    return pts.join(' ') + ' Z';
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: 360,
        top: cy,
        width: barW,
        height: barH,
        transform: 'translate(-50%, -50%)',
        opacity: enterAlpha,
        pointerEvents: 'none',
      }}
    >
      <svg
        width={barW + 48}
        height={barH + 16}
        viewBox={`-24 -8 ${barW + 48} ${barH + 16}`}
        style={{ position: 'absolute', left: -24, top: -8, overflow: 'visible' }}
      >
        <path d={buildBrushPath(barW, barH, activeCard.startFrame * 0.17)} fill={VP.subBg} fillOpacity={0.83} />
        <line x1={12} y1={5} x2={barW - 14} y2={5} stroke={VP.subBg} strokeWidth={2} strokeDasharray="24 6 12 4" opacity={0.55} />
        <line x1={14} y1={barH - 5} x2={barW - 10} y2={barH - 5} stroke={VP.subBg} strokeWidth={2} strokeDasharray="18 5 28 6" opacity={0.55} />
      </svg>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {activeCard.lines.map((ln, lIdx) => {
          const words = ln.split(' ');
          const offset = lIdx === 0 ? 0 : activeCard.lines[0].split(' ').length;
          return (
            <div
              key={lIdx}
              style={{
                fontFamily: '"Plus Jakarta Sans", "Segoe UI", sans-serif',
                fontSize: 27,
                lineHeight: '36px',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                textShadow: '0 2px 4px rgba(10, 12, 18, 0.72)',
              }}
            >
              {words.map((w, wIdx) => {
                const gIdx = offset + wIdx;
                const color =
                  gIdx < activeWordIdx ? VP.subPast : gIdx === activeWordIdx ? VP.subActive : VP.subFuture;
                return (
                  <span key={wIdx} style={{ color }}>
                    {w}
                    {wIdx < words.length - 1 ? ' ' : ''}
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** 2-Tone Painted Gouache Cumulus Cloud Cluster (with dark sepia ink outline!) */
export const PaintedCloud: React.FC<{
  x: number;
  y: number;
  scale?: number;
  tone?: 'day' | 'dusk' | 'ash' | 'storm';
  opacity?: number;
}> = ({ x, y, scale = 1, tone = 'day', opacity = 1 }) => {
  const pal = {
    day: { lit: '#EFE8D8', mid: '#C8C5BD', shd: '#868F98' },
    dusk: { lit: '#E6CCB4', mid: '#AD9086', shd: '#6F6372' },
    ash: { lit: '#A8A1A4', mid: '#76707C', shd: '#4B4654' },
    storm: { lit: '#6C757E', mid: '#4C555E', shd: '#313942' },
  }[tone];

  return (
    <g transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)}) scale(${scale.toFixed(3)})`} opacity={opacity}>
      {/* Unified dark ink outer silhouette */}
      <path
        d="M -92 18 C -106 18, -112 2, -98 -8 C -94 -26, -72 -34, -54 -24 C -44 -48, -10 -56, 14 -38 C 30 -52, 62 -46, 70 -22 C 92 -24, 108 -6, 98 12 C 102 18, 92 22, 82 22 L -84 22 C -89 22, -92 20, -92 18 Z"
        fill={pal.shd}
        stroke={VP.ink}
        strokeWidth={2.2}
        strokeLinejoin="round"
      />
      {/* Mid painted gouache belly */}
      <path
        d="M -88 12 C -98 10, -100 -2, -88 -8 C -85 -22, -66 -28, -50 -20 C -40 -42, -10 -48, 12 -33 C 28 -44, 56 -39, 64 -18 C 82 -19, 94 -5, 86 10 L -88 12 Z"
        fill={pal.mid}
      />
      {/* Lit warm upper gouache cap */}
      <path
        d="M -78 -2 C -76 -18, -58 -24, -44 -16 C -34 -38, -8 -44, 12 -29 C 26 -38, 52 -33, 58 -14 C 72 -14, 80 -6, 76 2 C 42 -4, -36 -4, -78 -2 Z"
        fill={pal.lit}
      />
    </g>
  );
};

/** 1:1 Lineless Painted Cloud-Curtain Wipe (3-tone gouache puffs sweeping full canvas, ZERO black circle outlines!) */
export const CloudCurtainWipe: React.FC<{ progress: number; tone?: 'ash' | 'day' }> = ({
  progress,
  tone = 'ash',
}) => {
  if (progress <= 0.005 || progress >= 0.995) return null;
  const closeAmt = easeInOutCubic(progress < 0.5 ? progress * 2 : (1 - progress) * 2);
  const lit = tone === 'ash' ? '#AEA6A8' : '#F2ECE0';
  const mid = tone === 'ash' ? '#7A7380' : '#C2C7C4';
  const shd = tone === 'ash' ? '#4C4656' : '#808E98';
  const puffs = [
    { cx: 120, cy: 180, r: 245, dx: -400, dy: -240 },
    { cx: 600, cy: 210, r: 260, dx: 400, dy: -220 },
    { cx: 360, cy: 450, r: 285, dx: 0, dy: -480 },
    { cx: 105, cy: 670, r: 270, dx: -420, dy: 60 },
    { cx: 615, cy: 700, r: 275, dx: 420, dy: 80 },
    { cx: 360, cy: 940, r: 295, dx: 0, dy: 460 },
    { cx: 145, cy: 1120, r: 255, dx: -360, dy: 300 },
    { cx: 590, cy: 1110, r: 260, dx: 360, dy: 300 },
  ];
  return (
    <svg width={720} height={1280} viewBox="0 0 720 1280" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {puffs.map((p, i) => {
        const px = p.cx + p.dx * (1 - closeAmt);
        const py = p.cy + p.dy * (1 - closeAmt);
        return (
          <g key={i} transform={`translate(${px.toFixed(1)}, ${py.toFixed(1)})`}>
            <circle cx={0} cy={0} r={p.r} fill={shd} />
            <circle cx={-p.r * 0.14} cy={-p.r * 0.14} r={p.r * 0.85} fill={mid} />
            <circle cx={-p.r * 0.24} cy={-p.r * 0.24} r={p.r * 0.62} fill={lit} />
          </g>
        );
      })}
    </svg>
  );
};

/** 1:1 Rising Wild Multi-Lobe Painted Gouache Volcanic Ash Column + Optional 1-2 Frame Jagged Lightning */
export const PaintedAshColumn: React.FC<{
  f: number;
  cx: number;
  baseY: number;
  riseProgress: number; // 0..1
  widthScale?: number;
  showLightning?: boolean;
}> = ({ f, cx, baseY, riseProgress, widthScale = 1, showLightning = true }) => {
  if (riseProgress <= 0.01) return null;
  const tierCount = 10;
  const maxH = 660 * riseProgress;
  const boltOn = showLightning && riseProgress > 0.42 && (f % 19 === 0 || f % 19 === 1 || f % 29 === 7);

  return (
    <g>
      {Array.from({ length: tierCount }).map((_, i) => {
        const u = i / (tierCount - 1);
        const py = baseY - u * maxH - Math.sin(f * 0.09 + i * 1.4) * 7;
        const sway = Math.sin(u * 4.2 - f * 0.055 + i * 0.9) * (18 + u * 28);
        const baseR = (30 + u * 54 + Math.sin(i * 2.7 + f * 0.08) * 9) * widthScale;
        const px = cx + sway;
        // Asymmetric billowing side lobes (hand-painted cumulus eruption feel, zero uniform rings!)
        const leftR = baseR * (0.76 + 0.18 * Math.sin(i * 3.1));
        const rightR = baseR * (0.74 + 0.20 * Math.cos(i * 2.4));
        const lx = px - baseR * (0.58 + 0.12 * Math.cos(i * 2.1));
        const rx = px + baseR * (0.58 + 0.12 * Math.sin(i * 2.5));
        const ly = py + baseR * 0.16;
        const ry = py - baseR * 0.08;
        return (
          <g key={i}>
            {/* Shadow right & bottom puffs */}
            <circle cx={rx} cy={ry + 6} r={rightR} fill="#463E4D" stroke={VP.ink} strokeWidth={2.1} />
            <circle cx={lx} cy={ly + 4} r={leftR} fill="#665E6E" stroke={VP.ink} strokeWidth={2.1} />
            {/* Main billowing mid-tone cloud mass */}
            <circle cx={px} cy={py} r={baseR} fill="#847C88" stroke={VP.ink} strokeWidth={2.2} />
            {/* Warm sunlit upper-left gouache highlights on lobes */}
            <circle cx={lx - leftR * 0.22} cy={ly - leftR * 0.22} r={leftR * 0.52} fill="#B2ABA8" opacity={0.84} />
            <circle cx={px - baseR * 0.24} cy={py - baseR * 0.24} r={baseR * 0.54} fill="#BDB6B2" opacity={0.82} />
            {u < 0.36 && (
              <ellipse cx={px} cy={py + baseR * 0.42} rx={baseR * 0.72} ry={baseR * 0.34} fill="#F28A32" opacity={(0.36 - u) * 1.9} />
            )}
          </g>
        );
      })}
      {boltOn && (
        <g>
          <path
            d={`M ${cx + 12} ${baseY - maxH * 0.92} L ${cx - 22} ${baseY - maxH * 0.72} L ${cx + 16} ${baseY - maxH * 0.54} L ${cx - 26} ${baseY - maxH * 0.34} L ${cx + 8} ${baseY - maxH * 0.14}`}
            fill="none"
            stroke="#FFE6A4"
            strokeWidth={7.5}
            strokeLinejoin="round"
            opacity={0.44}
          />
          <path
            d={`M ${cx + 12} ${baseY - maxH * 0.92} L ${cx - 22} ${baseY - maxH * 0.72} L ${cx + 16} ${baseY - maxH * 0.54} L ${cx - 26} ${baseY - maxH * 0.34} L ${cx + 8} ${baseY - maxH * 0.14}`}
            fill="none"
            stroke="#FFFBF0"
            strokeWidth={2.6}
            strokeLinejoin="round"
          />
        </g>
      )}
    </g>
  );
};

/** 1:1 Vintage Alternating Red & Cream Cartographic Scale Bar */
export const VintageScaleBar: React.FC<{
  x: number;
  y: number;
  width?: number;
  label: string;
  progress: number;
}> = ({ x, y, width = 280, label, progress }) => {
  if (progress <= 0.01) return null;
  const segs = 5;
  const segW = width / segs;
  const curW = width * easeOutCubic(progress);
  return (
    <g transform={`translate(${x}, ${y})`} opacity={clamp(progress * 1.4, 0, 1)}>
      <clipPath id="vpScaleClip">
        <rect x={-width / 2 - 4} y={-14} width={curW + 8} height={30} />
      </clipPath>
      <g clipPath="url(#vpScaleClip)">
        {Array.from({ length: segs }).map((_, i) => (
          <rect
            key={i}
            x={-width / 2 + i * segW}
            y={-6}
            width={segW}
            height={12}
            fill={i % 2 === 0 ? '#C83426' : '#F5EFE2'}
            stroke={VP.ink}
            strokeWidth={1.8}
          />
        ))}
      </g>
      <SvgSlabLabel x={0} y={38} text={label} fontSize={26} opacity={easeOutCubic((progress - 0.3) / 0.7)} />
    </g>
  );
};

/** 1:1 Luminous Cream-Gold Dashed Ghost Blueprint Overlay (REAL pixel dashes via clipPath reveal — zero pathLength solid-line bug!) */
export const DashedGhostBlueprint: React.FC<{ d: string; drawProgress: number; clipId?: string }> = ({
  d,
  drawProgress,
  clipId = 'vpGhostClip',
}) => {
  if (drawProgress <= 0.01) return null;
  const p = easeOutCubic(drawProgress);
  return (
    <g opacity={clamp(p * 1.3, 0, 1)}>
      <defs>
        <clipPath id={clipId}>
          <rect x={0} y={lerp(760, 260, p)} width={720} height={540} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <path
          d={d}
          fill="none"
          stroke="#F6D782"
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray="13 11"
          opacity={0.32}
        />
        <path
          d={d}
          fill="none"
          stroke={VP.ghostGold}
          strokeWidth={3.0}
          strokeLinecap="round"
          strokeDasharray="12 10"
          opacity={0.95}
        />
      </g>
    </g>
  );
};

/** 1:1 Collectible Vintage Travel Postcard Mat Pull-Out Wrapper */
export const VintagePostcardFrame: React.FC<{
  matProgress: number;
  children: React.ReactNode;
}> = ({ matProgress, children }) => {
  const mp = easeOutQuint(matProgress);
  const padX = Math.round(mp * 28);
  const padY = Math.round(mp * 34);
  return (
    <div style={{ position: 'absolute', inset: 0, backgroundColor: VP.postcardMat, overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          left: padX,
          top: padY,
          right: padX,
          bottom: padY,
          overflow: 'hidden',
          border: mp > 0.04 ? `2.5px solid ${VP.postcardHairline}` : 'none',
          boxShadow: mp > 0.04 ? '0 10px 28px rgba(32, 24, 18, 0.34)' : 'none',
        }}
      >
        <div style={{ position: 'absolute', left: -padX, top: -padY, width: 720, height: 1280 }}>
          {children}
        </div>
      </div>
    </div>
  );
};
