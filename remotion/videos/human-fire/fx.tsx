import React from 'react';
import { SubtitleCardSpec } from './story';

export const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * clamp(t, 0, 1);

export const easeInOut = (t: number): number => {
  const c = clamp(t, 0, 1);
  return c * c * (3 - 2 * c);
};

export const easeOutCubic = (t: number): number => {
  const c = clamp(t, 0, 1);
  return 1 - Math.pow(1 - c, 3);
};

export const easeOutQuint = (t: number): number => {
  const c = clamp(t, 0, 1);
  return 1 - Math.pow(1 - c, 5);
};

export const easeInOutCubic = (t: number): number => {
  const c = clamp(t, 0, 1);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
};

/** Deterministic pseudo-random [0, 1) — zero Math.random()! */
export const hash01 = (seed: number): number => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

export const lerpRgb = (c1: [number, number, number], c2: [number, number, number], t: number): string => {
  const c = clamp(t, 0, 1);
  const r = Math.round(c1[0] + (c2[0] - c1[0]) * c);
  const g = Math.round(c1[1] + (c2[1] - c1[1]) * c);
  const b = Math.round(c1[2] + (c2[2] - c1[2]) * c);
  return `rgb(${r},${g},${b})`;
};

/** Organic multi-harmonic firelight flicker in [0.86..1.14], deterministic per frame. */
export const fireFlicker = (f: number, seed = 0): number => {
  const t = f * 0.21 + seed * 3.7;
  return (
    1.0 +
    0.065 * Math.sin(t * 1.13) +
    0.045 * Math.sin(t * 2.47 + 1.1) +
    0.025 * Math.cos(t * 4.31 + 2.4)
  );
};

/** Locked Art Bible Palette (Earth 24h inspired twilight-plum + golden firelight; zero #000/#fff) */
export const PALETTE = {
  shadowDeep: '#160a1e',
  shadowMid: '#26152c',
  shadowSoft: '#382246',
  duskMauve: '#5c3d68',
  mistSlate: '#44586c',
  stormTeal: '#24374a',
  terracotta: '#c84c28',
  amber: '#ec8238',
  gold: '#f8b65c',
  cream: '#ffecc4',
  moonBlue: '#9ab4d4',
  parchTop: '#f7efde',
  parchBot: '#ebe0c8',
  ink: '#241f1c',
  activeRed: '#ba382a',
  mutedInk: '#7e766c',
} as const;

export interface VolumetricFireProps {
  f: number;
  cx: number;
  cy: number;
  scale?: number;
  intensity?: number;
  showLogs?: boolean;
  showSmoke?: boolean;
  emberCount?: number;
  wind?: number;
  idPrefix?: string;
}

/**
 * Multi-layered 100% Pure-Code Realistic 2D Volumetric Firelight:
 * - Atmospheric warm radial bounce halo (screen blend)
 * - Rising curling smoke ribbons
 * - Charred glowing log pile & pulsing ember bed
 * - 3 organic Bezier flame envelopes (terracotta outer, amber mid tongues, incandescent cream heart)
 * - Deterministic floating glowing ember sparks
 */
export const VolumetricFire2D: React.FC<VolumetricFireProps> = ({
  f,
  cx,
  cy,
  scale = 1,
  intensity = 1,
  showLogs = true,
  showSmoke = true,
  emberCount = 26,
  wind = 0,
  idPrefix = 'fire',
}) => {
  if (intensity <= 0.01) return null;
  const fl = fireFlicker(f, cx * 0.01);
  const t = f * 0.14;
  const sway1 = Math.sin(t * 1.15) * 10 + wind * 16;
  const sway2 = Math.cos(t * 1.68 + 1.2) * 8 + wind * 12;
  const sway3 = Math.sin(t * 2.35 + 2.1) * 5 + wind * 8;
  const stretch = (0.94 + 0.10 * Math.sin(t * 1.92) + 0.05 * Math.cos(t * 3.1)) * intensity;

  const outerH = 128 * stretch;
  const midH = 96 * stretch;
  const innerH = 56 * stretch;

  return (
    <g transform={`translate(${cx}, ${cy}) scale(${scale})`} opacity={clamp(intensity, 0, 1)}>
      <defs>
        <radialGradient id={`${idPrefix}_halo`} cx="50%" cy="55%" r="55%">
          <stop offset="0%" stopColor="#ffe8b4" stopOpacity={0.72 * fl} />
          <stop offset="28%" stopColor="#f49638" stopOpacity={0.44 * fl} />
          <stop offset="62%" stopColor="#c84c28" stopOpacity={0.18 * fl} />
          <stop offset="100%" stopColor="#160a1e" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${idPrefix}_outer`} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#a8341c" />
          <stop offset="42%" stopColor="#dc5e24" />
          <stop offset="85%" stopColor="#f59e3d" />
          <stop offset="100%" stopColor="#ffd782" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id={`${idPrefix}_mid`} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#ec7c2c" />
          <stop offset="55%" stopColor="#f8be56" />
          <stop offset="100%" stopColor="#ffefc4" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id={`${idPrefix}_core`} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#ffd884" />
          <stop offset="60%" stopColor="#fff3d2" />
          <stop offset="100%" stopColor="#fff8e6" stopOpacity="0.6" />
        </linearGradient>
        <filter id={`${idPrefix}_glow`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
        <filter id={`${idPrefix}_soft`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
      </defs>

      {/* 1. Wide Atmospheric Firelight Bounce Halo */}
      <ellipse
        cx={sway1 * 0.25}
        cy={-36}
        rx={245 * fl}
        ry={185 * fl}
        fill={`url(#${idPrefix}_halo)`}
        style={{ mixBlendMode: 'screen' }}
      />

      {/* 2. Soft Rising Turbulent Smoke Wisps */}
      {showSmoke && (
        <g opacity={0.28 * intensity}>
          {[0, 1, 2].map((si) => {
            const phase = ((f * 0.012 + si * 0.33) % 1);
            const sy = -65 - phase * 220;
            const sx = Math.sin(phase * Math.PI * 2.4 + si * 2.1) * (16 + phase * 28) + wind * phase * 70;
            const r = 18 + phase * 38;
            const op = Math.sin(phase * Math.PI) * 0.55;
            return (
              <ellipse
                key={si}
                cx={sx}
                cy={sy}
                rx={r * 1.15}
                ry={r * 0.72}
                fill="#523b5a"
                opacity={op}
                filter={`url(#${idPrefix}_glow)`}
              />
            );
          })}
        </g>
      )}

      {/* 3. Ground Ember Glow Pool + Charred Crossed Wooden Logs */}
      {showLogs && (
        <g>
          {/* Warm ground contact glow */}
          <ellipse cx={0} cy={14} rx={78 * fl} ry={22} fill="#e86c28" opacity={0.34} filter={`url(#${idPrefix}_glow)`} />
          {/* Charred stone ring pebbles */}
          {[-56, -34, -12, 14, 38, 56].map((rx, ri) => (
            <ellipse
              key={ri}
              cx={rx}
              cy={16 + (ri % 2) * 4}
              rx={13 + (ri % 3) * 2.5}
              ry={7.5}
              fill="#2a192e"
              stroke="#c86832"
              strokeOpacity={0.38 * fl}
              strokeWidth={1.3}
            />
          ))}
          {/* Crossed wooden logs */}
          <g transform="rotate(-14 0 8)">
            <rect x={-58} y={0} width={116} height={15} rx={6} fill="#261420" />
            <rect x={-48} y={2} width={96} height={4} rx={2} fill="#d8682a" opacity={0.55 * fl} />
          </g>
          <g transform="rotate(15 0 8)">
            <rect x={-54} y={2} width={108} height={14} rx={6} fill="#1f101b" />
            <rect x={-40} y={3} width={80} height={3.5} rx={2} fill="#f49a3c" opacity={0.62 * fl} />
          </g>
          {/* Glowing ember coals at base */}
          <ellipse cx={0} cy={6} rx={36} ry={10} fill="#f4842c" opacity={0.78 * fl} filter={`url(#${idPrefix}_soft)`} />
        </g>
      )}

      {/* 4. Soft Bloom Behind Flames */}
      <path
        d={`M -42 10 C -58 -24, -28 ${-outerH * 0.65}, ${sway1} ${-outerH} C ${28 + sway1 * 0.4} ${-outerH * 0.62}, 58 -24, 42 10 Q 0 26, -42 10 Z`}
        fill="#f08230"
        opacity={0.48 * fl}
        filter={`url(#${idPrefix}_glow)`}
        style={{ mixBlendMode: 'screen' }}
      />

      {/* 5. Organic Multi-Tongue Outer Terracotta-Amber Flame (Curved Bowl Base + S-Curve Flicker!) */}
      <path
        d={`M -40 8
            C -56 -12, -52 -46, ${-34 + sway2 * 0.7} ${-outerH * 0.66}
            C ${-26 + sway2 * 0.4} ${-outerH * 0.42}, ${-22 + sway1 * 0.5} ${-outerH * 0.68}, ${sway1} ${-outerH}
            C ${16 + sway1 * 0.5} ${-outerH * 0.68}, ${18 + sway3 * 0.4} ${-outerH * 0.46}, ${32 + sway3 * 0.75} ${-outerH * 0.72}
            C 50 -44, 54 -12, 38 8
            Q 0 24, -40 8 Z`}
        fill={`url(#${idPrefix}_outer)`}
      />

      {/* Detached Dancing Flame Wisps Licking Upward */}
      <path
        d={`M ${-22 + sway2 * 0.6} ${-outerH * 0.72} Q ${-28 + sway1} ${-outerH * 0.94}, ${-16 + sway1 * 1.1} ${-outerH * 1.08} Q ${-12 + sway2} ${-outerH * 0.88}, ${-22 + sway2 * 0.6} ${-outerH * 0.72} Z`}
        fill="#f8a43e"
        opacity={0.78 * fl}
      />
      <path
        d={`M ${20 + sway3 * 0.6} ${-outerH * 0.68} Q ${30 + sway2} ${-outerH * 0.92}, ${18 + sway2 * 1.1} ${-outerH * 1.04} Q ${14 + sway3} ${-outerH * 0.84}, ${20 + sway3 * 0.6} ${-outerH * 0.68} Z`}
        fill="#f8a43e"
        opacity={0.72 * fl}
      />

      {/* 6. Blazing Amber-Gold Mid Flame Envelopes (Asymmetric S-Curve Tongues) */}
      <path
        d={`M -28 8
            C -40 -14, -28 -44, ${-14 + sway2 * 0.65} ${-midH * 0.82}
            C ${-6 + sway1 * 0.5} ${-midH * 0.58}, ${sway2 * 0.8} ${-midH * 1.04}, ${sway2 * 0.8 + 2} ${-midH * 1.04}
            C ${12 + sway3 * 0.5} ${-midH * 0.72}, 36 -22, 26 8
            Q 0 20, -28 8 Z`}
        fill={`url(#${idPrefix}_mid)`}
      />

      {/* 7. Incandescent White-Cream Heart */}
      <path
        d={`M -16 7 C -22 -10, -10 -34, ${sway3 * 0.65} ${-innerH} C ${10 + sway3 * 0.45} -34, 22 -10, 15 7 Q 0 16, -16 7 Z`}
        fill={`url(#${idPrefix}_core)`}
        filter={`url(#${idPrefix}_soft)`}
      />

      {/* 8. Deterministic Rising Glowing Ember Sparks */}
      {Array.from({ length: emberCount }).map((_, ei) => {
        const speed = 0.008 + hash01(ei * 17.3 + 1.1) * 0.014;
        const offset = hash01(ei * 31.7 + 4.9);
        const p = (f * speed + offset) % 1;
        const spread = (hash01(ei * 53.1 + 7.2) - 0.5) * 90;
        const curl = Math.sin(p * Math.PI * 3.2 + ei * 1.9) * (14 + p * 26);
        const ex = spread * (0.4 + p * 0.9) + curl + wind * p * 110;
        const ey = -10 - p * (220 + hash01(ei * 11.3) * 140);
        const er = (1.1 + hash01(ei * 71.9) * 2.2) * (1 - p * 0.65);
        const eop = Math.sin(p * Math.PI) * 0.92;
        const col = ei % 3 === 0 ? '#fff2cc' : ei % 3 === 1 ? '#ffc05c' : '#f07428';
        return (
          <circle
            key={ei}
            cx={ex}
            cy={ey}
            r={er}
            fill={col}
            opacity={eop}
          />
        );
      })}
    </g>
  );
};

/**
 * Full-Frame Two-Depth Deterministic Ember & Dust Bokeh Field (far crisp + near blurred foreground).
 */
export const AmbientEmbersOverlay: React.FC<{
  f: number;
  count?: number;
  color?: string;
  opacity?: number;
  riseSpeed?: number;
  wind?: number;
}> = ({ f, count = 34, color = '#ffc870', opacity = 0.75, riseSpeed = 1, wind = 0.15 }) => {
  if (opacity <= 0.01) return null;
  return (
    <svg width={720} height={1280} viewBox="0 0 720 1280" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity }}>
      <defs>
        <filter id="fgEmberBlur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.2" />
        </filter>
      </defs>
      {Array.from({ length: count }).map((_, i) => {
        const isNear = i % 4 === 0;
        const sp = (0.0022 + hash01(i * 19.7) * 0.0038) * riseSpeed * (isNear ? 1.45 : 1.0);
        const p = (f * sp + hash01(i * 43.3 + 2.1)) % 1;
        const baseX = hash01(i * 67.1 + 5.7) * 760 - 20;
        const x = ((baseX + Math.sin(p * Math.PI * 3 + i) * 32 + wind * p * 180) % 760 + 760) % 760 - 20;
        const y = 1280 - p * 1340;
        const r = isNear ? 3.2 + hash01(i * 29.1) * 3.4 : 1.1 + hash01(i * 13.7) * 1.6;
        const a = Math.sin(p * Math.PI) * (isNear ? 0.45 : 0.72);
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={r}
            fill={i % 3 === 0 ? '#fff2cc' : color}
            opacity={a}
            filter={isNear ? 'url(#fgEmberBlur)' : undefined}
          />
        );
      })}
    </svg>
  );
};

/**
 * Signature Earth-24h Glowing Warm Serif Chapter Header (top safe zone y=96..195).
 */
export const ChapterHeader: React.FC<{
  title: string;
  subtitle: string;
  opacity: number;
  subOpacity?: number;
}> = ({ title, subtitle, opacity, subOpacity = opacity }) => {
  if (opacity <= 0.01) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 86,
        width: 720,
        textAlign: 'center',
        pointerEvents: 'none',
        opacity,
      }}
    >
      <div
        style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: 44,
          fontWeight: 'bold',
          letterSpacing: '4.5px',
          color: '#f6ecd4',
          textShadow: '0 0 22px rgba(245, 200, 130, 0.65), 0 3px 10px rgba(18, 10, 26, 0.88)',
          lineHeight: 1.1,
        }}
      >
        {title}
      </div>
      {subtitle && subOpacity > 0.01 && (
        <div
          style={{
            marginTop: 10,
            fontFamily: 'Segoe UI, Arial, sans-serif',
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: '6.5px',
            color: '#f4eee4',
            textShadow: '0 2px 6px rgba(16, 10, 22, 0.9)',
            opacity: subOpacity,
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
};

/**
 * Signature Earth-24h Tactile Hand-Torn Deckle-Edge Parchment Subtitle Card.
 * Warm archival parchment (`#f7efde -> #ebe0c8`), dark sepia ink (`#241f1c`),
 * active karaoke word highlighted in terracotta crimson (`#ba382a`), centered in 9:16 safe zone.
 */
export const ParchmentSubtitleCard: React.FC<{
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
  const cardInkAlpha = Math.min(1, Math.max(0, (f - activeCard.startFrame) / 2.5)) * fadeOpacity;
  const enterScale = lerp(0.96, 1.0, easeOutCubic((f - activeCard.startFrame) / 6));

  const cardH = activeCard.lines.length === 1 ? 74 : 116;
  const longestChars = Math.max(...activeCard.lines.map((l) => l.length));
  const cardW = Math.max(330, Math.min(636, Math.round(longestChars * 20.5 + 86)));
  const cyCard = activeCard.lines.length === 1 ? 1005 : 1024;
  const sf = activeCard.startFrame;
  const tiltDeg = ((sf % 7) - 3) * 0.14;

  const pts: string[] = [];
  for (let i = 0; i <= 24; i++) {
    const u = i / 24;
    const px = u * cardW;
    const py = 4 + 1.8 * Math.sin(u * Math.PI * 6 + sf * 0.13) + 0.9 * Math.cos(u * 19);
    pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
  }
  pts.push(`${(cardW + 2.8).toFixed(1)},${(cardH * 0.36).toFixed(1)}`);
  pts.push(`${(cardW + 0.9).toFixed(1)},${(cardH * 0.72).toFixed(1)}`);
  for (let i = 24; i >= 0; i--) {
    const u = i / 24;
    const px = u * cardW;
    const py = cardH - 4 + 1.8 * Math.cos(u * Math.PI * 6 + sf * 0.17) + 0.9 * Math.sin(u * 17);
    pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
  }
  pts.push(`${(-2.4).toFixed(1)},${(cardH * 0.66).toFixed(1)}`);
  pts.push(`${(-0.7).toFixed(1)},${(cardH * 0.31).toFixed(1)}`);

  return (
    <div
      style={{
        position: 'absolute',
        left: 360,
        top: cyCard,
        width: cardW,
        height: cardH,
        transform: `translate(-50%, -50%) scale(${enterScale.toFixed(3)}) rotate(${tiltDeg.toFixed(2)}deg)`,
        opacity: fadeOpacity,
        pointerEvents: 'none',
      }}
    >
      <svg
        width={cardW + 16}
        height={cardH + 16}
        viewBox={`-8 -8 ${cardW + 16} ${cardH + 16}`}
        style={{ position: 'absolute', left: -8, top: -8, overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="hfParchGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={PALETTE.parchTop} />
            <stop offset="100%" stopColor={PALETTE.parchBot} />
          </linearGradient>
          <filter id="hfCardDrop" x="-15%" y="-20%" width="130%" height="150%">
            <feDropShadow dx="2.5" dy="6" stdDeviation="4" floodColor="#100816" floodOpacity="0.62" />
          </filter>
        </defs>
        <polygon points={pts.join(' ')} fill="url(#hfParchGrad)" stroke="#d2c3a8" strokeWidth={1.4} filter="url(#hfCardDrop)" />
        {Array.from({ length: 12 }).map((_, fi) => {
          const fx = ((fi * 71 + sf * 13) % Math.max(40, cardW - 40)) + 20;
          const fy = ((fi * 29 + sf * 7) % Math.max(16, cardH - 20)) + 10;
          const dx = ((fi % 3) - 1) * 18 + 14;
          const dy = ((fi % 5) - 2) * 3;
          return <line key={fi} x1={fx} y1={fy} x2={fx + dx} y2={fy + dy} stroke="rgba(206,190,162,0.5)" strokeWidth={1} />;
        })}
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
          const prevWords = lIdx === 0 ? 0 : activeCard.lines[0].split(' ').length;
          return (
            <div
              key={lIdx}
              style={{
                fontFamily: 'Segoe UI, Arial, sans-serif',
                fontSize: 36,
                lineHeight: '46px',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                opacity: cardInkAlpha,
              }}
            >
              {words.map((w, wIdx) => {
                const gIdx = prevWords + wIdx;
                const col = gIdx < activeWordIdx ? PALETTE.ink : gIdx === activeWordIdx ? PALETTE.activeRed : PALETTE.mutedInk;
                return (
                  <span key={wIdx} style={{ color: col }}>
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

/**
 * Optical Corner Vignette + Archival Paper Grain Overlay (adapted from Earth 24 Hours).
 */
export const CinematicGradeOverlay: React.FC<{ warmth?: number; vignette?: number }> = ({
  warmth = 0.08,
  vignette = 0.34,
}) => (
  <>
    {warmth > 0.005 && (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: `radial-gradient(ellipse at 50% 62%, rgba(248,176,88,${warmth.toFixed(3)}) 0%, rgba(22,10,30,0) 70%)`,
          mixBlendMode: 'screen',
        }}
      />
    )}
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: `radial-gradient(ellipse at 50% 48%, rgba(22,10,30,0) 54%, rgba(20,10,28,${vignette.toFixed(2)}) 100%)`,
      }}
    />
    <svg width={720} height={1280} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.04, mixBlendMode: 'overlay' }}>
      <filter id="hfPaperGrain">
        <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="3" seed="29" />
      </filter>
      <rect width="100%" height="100%" filter="url(#hfPaperGrain)" />
    </svg>
  </>
);
