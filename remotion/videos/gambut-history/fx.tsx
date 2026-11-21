import React from 'react';
import { staticFile } from 'remotion';
import { SubtitleCardSpec } from './story';

/**
 * V2 Lineless Painterly Gouache Palette & Typography System for GambutHistoryShort
 * ("GAMBUT: WARISAN RIBUAN TAHUN, API YANG TERSEMBUNYI").
 * ZERO pure #000000 or #FFFFFF — rich scientific editorial gouache tones + warm archival paper grain.
 */
export const GP = {
  ink: '#241C1B',
  inkSoft: '#352A26',
  cream: '#FAF1DC',
  creamWarm: '#EFE6D3',
  rust3D: '#7C3220',
  rustDeep: '#5C2418',
  ribbonBg: '#1C262E',
  ribbonText: '#F5EFE2',
  subBg: '#18212A',
  subPast: '#F5F2EA',
  subActive: '#F8D348',
  subFuture: 'rgba(156, 168, 178, 0.64)',
  postcardMat: '#C8BDA6',
  postcardHairline: '#3A322A',
  // Gambut Ecology & Geology Signatures
  forestDeep: '#1B3429',
  forestMid: '#2D523A',
  forestLit: '#547D4A',
  swampWater: '#1C3F52',
  swampWaterLit: '#386D80',
  peatFibric: '#704E35',
  peatHemic: '#4E3424',
  peatSapric: '#302019',
  peatCharcoal: '#221918',
  clayMineral: '#5C544B',
  emberCore: '#FFF0A6',
  emberOrange: '#F27D24',
  emberRed: '#BA2E1A',
  smokeAsh: '#827E88',
  waterBlue: '#3A82A0',
  waterSurface: '#7AC2D4',
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
export const continuousShake = (f: number, intensity: number): { x: number; y: number } => ({
  x: (Math.sin(f * 2.5) * 0.65 + Math.cos(f * 4.1) * 0.35) * intensity,
  y: (Math.cos(f * 2.9) * 0.65 + Math.sin(f * 4.7) * 0.35) * intensity * 0.72,
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
 * Static (Non-Boiling!) Cold-Press Watercolor Paper Multiply Texture + Subtle Warm Vintage Vignette.
 * Fixed turbulence seed guarantees zero flicker/boil across every frame.
 */
export const VintagePaperOverlay: React.FC<{ opacity?: number }> = ({ opacity = 0.24 }) => (
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
        <filter id="gpPaperTooth" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.60" numOctaves="4" seed="23" result="n" />
          <feColorMatrix type="saturate" values="0.16" in="n" result="d" />
          <feComponentTransfer in="d">
            <feFuncR type="linear" slope="0.94" intercept="0.06" />
            <feFuncG type="linear" slope="0.91" intercept="0.05" />
            <feFuncB type="linear" slope="0.84" intercept="0.04" />
          </feComponentTransfer>
        </filter>
        <filter id="gpLinenGrain" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.28" numOctaves="2" seed="11" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>
      <rect width={720} height={1280} fill="#EFE6D3" filter="url(#gpPaperTooth)" />
      <rect width={720} height={1280} fill="#D6C9B0" filter="url(#gpLinenGrain)" opacity={0.38} />
    </svg>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 48%, rgba(22,18,16,0) 58%, rgba(20,16,14,0.24) 100%)',
      }}
    />
  </>
);

/** Chunky Alfa Slab One 3D Retro Editorial Title + Dark Slate Subtitle Ticket Ribbon */
export const RetroSlabTitle3D: React.FC<{
  lines: string[];
  subtitle?: string;
  top?: number;
  fontSize?: number;
  opacity?: number;
  scale?: number;
  accentColor?: string;
  subColor?: string;
}> = ({
  lines,
  subtitle,
  top = 126,
  fontSize = 54,
  opacity = 1,
  scale = 1,
  accentColor = GP.cream,
  subColor = GP.ribbonText,
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
      }}
    >
      {lines.map((line, i) => (
        <div
          key={i}
          style={{
            fontFamily: '"Alfa Slab One", Rockwell, Georgia, serif',
            fontSize,
            lineHeight: 1.08,
            letterSpacing: '1.8px',
            color: accentColor,
            WebkitTextStroke: '2.2px #261916',
            paintOrder: 'stroke fill',
            textShadow:
              '1px 1px 0 #7C3220, 2px 2px 0 #7C3220, 3px 3px 0 #6B2A1B, 4px 4px 0 #562116, 5px 5px 0 #261916, 0 8px 16px rgba(18,12,10,0.45)',
          }}
        >
          {line}
        </div>
      ))}
      {subtitle && (
        <div
          style={{
            display: 'inline-block',
            marginTop: 10,
            padding: '7px 20px',
            borderRadius: 2,
            backgroundColor: 'rgba(28, 38, 46, 0.94)',
            fontFamily: '"Plus Jakarta Sans", "Segoe UI", sans-serif',
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: '3.6px',
            color: subColor,
            textTransform: 'uppercase',
            boxShadow: '0 4px 12px rgba(14, 16, 20, 0.48)',
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
};

/** Compact Editorial Pill / Scientific Tag Badge */
export const EditorialBadge: React.FC<{
  text: string;
  top: number;
  left?: number;
  bg?: string;
  color?: string;
  opacity?: number;
  fontSize?: number;
}> = ({ text, top, left = 360, bg = 'rgba(28, 38, 46, 0.92)', color = '#FAF1DC', opacity = 1, fontSize = 13 }) => {
  if (opacity <= 0.01) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        transform: 'translateX(-50%)',
        padding: '6px 16px',
        borderRadius: 2,
        backgroundColor: bg,
        border: '1.5px solid rgba(250, 241, 220, 0.28)',
        fontFamily: '"Plus Jakarta Sans", "Segoe UI", sans-serif',
        fontSize,
        fontWeight: 800,
        letterSpacing: '2.8px',
        color,
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        opacity,
        pointerEvents: 'none',
        boxShadow: '0 4px 12px rgba(12, 14, 18, 0.42)',
      }}
    >
      {text}
    </div>
  );
};

/** In-Scene SVG Alfa Slab One Label */
export const SvgSlabLabel: React.FC<{
  x: number;
  y: number;
  text: string;
  fontSize?: number;
  opacity?: number;
  scale?: number;
  anchor?: 'start' | 'middle' | 'end';
  fill?: string;
}> = ({ x, y, text, fontSize = 30, opacity = 1, scale = 1, anchor = 'middle', fill = GP.cream }) => {
  if (opacity <= 0.01) return null;
  return (
    <g transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)}) scale(${scale.toFixed(3)})`} opacity={opacity}>
      <text
        x={3}
        y={3.2}
        textAnchor={anchor}
        fill={GP.rustDeep}
        stroke="#241916"
        strokeWidth={4}
        paintOrder="stroke fill"
        fontFamily='"Alfa Slab One", Rockwell, Georgia, serif'
        fontSize={fontSize}
        letterSpacing="1px"
      >
        {text}
      </text>
      <text
        x={0}
        y={0}
        textAnchor={anchor}
        fill={fill}
        stroke="#241C1B"
        strokeWidth={3.1}
        paintOrder="stroke fill"
        fontFamily='"Alfa Slab One", Rockwell, Georgia, serif'
        fontSize={fontSize}
        letterSpacing="1px"
      >
        {text}
      </text>
    </g>
  );
};

/** Hand-Brushed Feathered Charcoal Karaoke Subtitle Bar (Exact Danau Toba / Gunung Guntur Craft) */
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
  const barW = Math.max(290, Math.min(620, Math.round(maxChars * 16.5 + 94)));
  const barH = activeCard.lines.length === 1 ? 56 : 92;
  const cy = activeCard.lines.length === 1 ? 1044 : 1054;

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
        <path d={buildBrushPath(barW, barH, activeCard.startFrame * 0.17)} fill={GP.subBg} fillOpacity={0.85} />
        <line x1={12} y1={5} x2={barW - 14} y2={5} stroke={GP.subBg} strokeWidth={2} strokeDasharray="24 6 12 4" opacity={0.55} />
        <line x1={14} y1={barH - 5} x2={barW - 10} y2={barH - 5} stroke={GP.subBg} strokeWidth={2} strokeDasharray="18 5 28 6" opacity={0.55} />
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
                fontSize: 26,
                lineHeight: '35px',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                textShadow: '0 2px 4px rgba(10, 12, 18, 0.75)',
              }}
            >
              {words.map((w, wIdx) => {
                const gIdx = offset + wIdx;
                const color =
                  gIdx < activeWordIdx ? GP.subPast : gIdx === activeWordIdx ? GP.subActive : GP.subFuture;
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

/** Lineless Painted Smoke / Mist Curtain Wipe (for organic scene transitions!) */
export const SmokeCurtainWipe: React.FC<{ progress: number; tone?: 'smoke' | 'mist' | 'peat' }> = ({
  progress,
  tone = 'smoke',
}) => {
  if (progress <= 0.005 || progress >= 0.995) return null;
  const closeAmt = easeInOutCubic(progress < 0.5 ? progress * 2 : (1 - progress) * 2);
  const pal = {
    smoke: { lit: '#A8A3A8', mid: '#706D78', shd: '#43414C' },
    mist: { lit: '#EDF0E6', mid: '#C4CEC4', shd: '#869994' },
    peat: { lit: '#78563C', mid: '#4D3526', shd: '#2D1E18' },
  }[tone];
  const puffs = [
    { cx: 115, cy: 170, r: 250, dx: -400, dy: -240 },
    { cx: 605, cy: 205, r: 265, dx: 400, dy: -220 },
    { cx: 360, cy: 455, r: 295, dx: 0, dy: -480 },
    { cx: 100, cy: 675, r: 275, dx: -420, dy: 60 },
    { cx: 620, cy: 705, r: 280, dx: 420, dy: 80 },
    { cx: 360, cy: 945, r: 300, dx: 0, dy: 460 },
    { cx: 145, cy: 1125, r: 260, dx: -360, dy: 300 },
    { cx: 590, cy: 1115, r: 265, dx: 360, dy: 300 },
  ];
  return (
    <svg width={720} height={1280} viewBox="0 0 720 1280" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {puffs.map((p, i) => {
        const px = p.cx + p.dx * (1 - closeAmt);
        const py = p.cy + p.dy * (1 - closeAmt);
        return (
          <g key={i} transform={`translate(${px.toFixed(1)}, ${py.toFixed(1)})`}>
            <circle cx={0} cy={0} r={p.r} fill={pal.shd} />
            <circle cx={-p.r * 0.14} cy={-p.r * 0.14} r={p.r * 0.85} fill={pal.mid} />
            <circle cx={-p.r * 0.24} cy={-p.r * 0.24} r={p.r * 0.62} fill={pal.lit} />
          </g>
        );
      })}
    </svg>
  );
};

/** Collectible Vintage Travel / Documentary Poster Mat Pull-Out Frame */
export const VintagePostcardFrame: React.FC<{
  matProgress: number;
  children: React.ReactNode;
}> = ({ matProgress, children }) => {
  const mp = easeOutQuint(matProgress);
  const padX = Math.round(mp * 26);
  const padY = Math.round(mp * 32);
  return (
    <div style={{ position: 'absolute', inset: 0, backgroundColor: GP.postcardMat, overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          left: padX,
          top: padY,
          right: padX,
          bottom: padY,
          overflow: 'hidden',
          border: mp > 0.04 ? `2.5px solid ${GP.postcardHairline}` : 'none',
          boxShadow: mp > 0.04 ? '0 10px 28px rgba(24, 18, 14, 0.38)' : 'none',
        }}
      >
        <div style={{ position: 'absolute', left: -padX, top: -padY, width: 720, height: 1280 }}>
          {children}
        </div>
      </div>
    </div>
  );
};
