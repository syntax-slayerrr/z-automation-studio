import React from 'react';
import { SubtitleCardSpec } from './story';

export const PALETTE = {
  // Deep Twilight Plum-Indigo to Warm Archival Amber + Iconic GMNI Merah Marhaen (ZERO #000/#fff!)
  skyTop: '#160a1e',
  skyMid: '#3d2142',
  skyHorizon: '#b6543e',
  amberLight: '#f8b962',
  amberHot: '#ffedc0',
  gmniRed: '#c42026',
  gmniRedBright: '#e03434',
  gmniRedDeep: '#6a141c',
  gmniWhite: '#f4eee2',
  gmniVelvet: '#190d22',
  merah: '#c42428',
  putih: '#f4eee2',
  parchTop: '#f3ebd8',
  parchBot: '#e3d5ba',
  ink: '#211520',
  mutedInk: '#6a5b58',
  activeRed: '#ba2824',
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
/** Snappy elastic settle without cartoonish bounce (true cinema motion feel) */
export const springSettle = (t: number) => {
  const c = clamp(t, 0, 1);
  if (c === 0 || c === 1) return c;
  return 1 - Math.exp(-6.2 * c) * Math.cos(c * Math.PI * 1.45);
};

/** Damped micro camera shake for historical impact hits (gavel, fusion collision, emblem reveal) */
export const microShake = (f: number, triggerFrame: number, dur = 14, mag = 7): { x: number; y: number } => {
  const dt = f - triggerFrame;
  if (dt < 0 || dt > dur) return { x: 0, y: 0 };
  const decay = Math.pow(1 - dt / dur, 2.1);
  return {
    x: Math.sin(dt * 2.9) * mag * decay,
    y: Math.cos(dt * 3.7) * mag * 0.7 * decay,
  };
};

export const hash01 = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return s - Math.floor(s);
};

/** Subtle warm lamp / dawn flicker */
export const lampGlow = (f: number, seed = 1) =>
  0.88 +
  0.07 * Math.sin(f * 0.28 + seed * 3.1) +
  0.05 * Math.sin(f * 0.67 + seed * 1.7);

/** Helper to generate a crisp 5-pointed star polygon string (GMNI Star Geometry) */
export const starPoints = (cx: number, cy: number, rOuter: number, rInner: number): string => {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${(cx + Math.cos(ang) * r).toFixed(1)},${(cy + Math.sin(ang) * r).toFixed(1)}`);
  }
  return pts.join(' ');
};

/** Subtle rotating GMNI Hexagonal Shield & 5-Pointed Star Heritage Watermark */
export const GmniHeritageWatermark: React.FC<{
  f: number;
  cx?: number;
  cy?: number;
  scale?: number;
  opacity?: number;
}> = ({ f, cx = 360, cy = 540, scale = 1, opacity = 0.14 }) => {
  if (opacity <= 0.005) return null;
  const rot = f * 0.12;
  return (
    <g transform={`translate(${cx}, ${cy}) scale(${scale})`} opacity={opacity}>
      <circle cx={0} cy={0} r={215} fill="none" stroke="#f6c474" strokeWidth={1.2} strokeDasharray="6 10" transform={`rotate(${rot})`} />
      <circle cx={0} cy={0} r={176} fill="none" stroke="#d43030" strokeWidth={1.5} strokeDasharray="14 8" transform={`rotate(${-rot * 1.4})`} />
      {/* Iconic GMNI Hexagonal Shield Silhouette */}
      <polygon
        points="0,-168 122,-104 122,96 0,168 -122,96 -122,-104"
        fill="none"
        stroke="#f8ca78"
        strokeWidth={1.8}
        opacity={0.75}
      />
      {/* Vertical Merah-Putih-Merah Guide Hairlines */}
      <line x1={-34} y1={-148} x2={-34} y2={148} stroke="#f6ead6" strokeWidth={1} opacity={0.42} />
      <line x1={34} y1={-148} x2={34} y2={148} stroke="#f6ead6" strokeWidth={1} opacity={0.42} />
      {/* 5-Pointed Crimson-Gold Star */}
      <polygon points={starPoints(0, -14, 92, 36)} fill="none" stroke="#e03a3a" strokeWidth={2.0} opacity={0.85} />
    </g>
  );
};

/** Continuous Drifting Twilight Clouds for Living Sky Parallax */
export const DriftingTwilightClouds: React.FC<{
  f: number;
  opacity?: number;
  tint?: string;
  speed?: number;
}> = ({ f, opacity = 0.24, tint = '#5c3152', speed = 0.45 }) => {
  if (opacity <= 0.01) return null;
  const clouds = [
    { baseX: 110, y: 270, rx: 165, ry: 28, sp: 1.0 },
    { baseX: 520, y: 340, rx: 195, ry: 34, sp: 0.75 },
    { baseX: 280, y: 420, rx: 220, ry: 30, sp: 0.6 },
    { baseX: 640, y: 485, rx: 175, ry: 26, sp: 0.9 },
  ];
  return (
    <g opacity={opacity}>
      {clouds.map((c, ci) => {
        const cx = ((c.baseX + f * speed * c.sp) % 1080) - 180;
        return (
          <g key={ci} transform={`translate(${cx}, ${c.y})`}>
            <ellipse cx={0} cy={0} rx={c.rx} ry={c.ry} fill={tint} />
            <ellipse cx={-c.rx * 0.35} cy={-c.ry * 0.35} rx={c.rx * 0.55} ry={c.ry * 0.72} fill={tint} />
            <ellipse cx={c.rx * 0.3} cy={-c.ry * 0.25} rx={c.rx * 0.48} ry={c.ry * 0.65} fill={tint} />
          </g>
        );
      })}
    </g>
  );
};

/** Foreground Parallax Silhouette Framing (adds instant 3D camera dolly depth!) */
export const ForegroundBokehPillars: React.FC<{
  offsetX: number;
  opacity?: number;
}> = ({ offsetX, opacity = 0.58 }) => (
  <g opacity={opacity} pointerEvents="none">
    <defs>
      <filter id="fgPillarBlur" x="-30%" y="-10%" width="160%" height="120%">
        <feGaussianBlur stdDeviation="5.5" />
      </filter>
    </defs>
    <g filter="url(#fgPillarBlur)" transform={`translate(${offsetX.toFixed(1)}, 0)`}>
      <rect x={-48} y={240} width={78} height={740} fill="#100618" />
      <rect x={690} y={240} width={78} height={740} fill="#100618" />
    </g>
  </g>
);

/**
 * Animated 2D Flowing Indonesian Merah Putih Flag (Cloth Sine-Wave Mesh + Golden Rim Highlight).
 */
export const MerahPutihFlag2D: React.FC<{
  f: number;
  x: number;
  y: number;
  poleH?: number;
  flagW?: number;
  flagH?: number;
  windSpeed?: number;
  rimOpacity?: number;
  showPole?: boolean;
}> = ({
  f,
  x,
  y,
  poleH = 330,
  flagW = 195,
  flagH = 118,
  windSpeed = 0.14,
  rimOpacity = 0.85,
  showPole = true,
}) => {
  const segs = 14;
  const topY = y - poleH + 14;
  const midY = topY + flagH * 0.5;
  const botY = topY + flagH;

  const topPts: Array<[number, number]> = [];
  const midPts: Array<[number, number]> = [];
  const botPts: Array<[number, number]> = [];

  for (let i = 0; i <= segs; i++) {
    const u = i / segs;
    const amp = Math.pow(u, 1.25) * 14;
    const w1 = Math.sin(f * windSpeed - u * 5.2) * amp;
    const w2 = Math.cos(f * windSpeed * 1.45 - u * 8.6) * amp * 0.28;
    const dy = w1 + w2;
    const px = x + 4 + u * flagW;
    topPts.push([px, topY + dy]);
    midPts.push([px, midY + dy * 1.04]);
    botPts.push([px, botY + dy * 1.08]);
  }

  const buildPoly = (a: Array<[number, number]>, b: Array<[number, number]>) => {
    const fwd = a.map(([px, py], i) => `${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`).join(' ');
    const rev = [...b].reverse().map(([px, py]) => `L ${px.toFixed(1)} ${py.toFixed(1)}`).join(' ');
    return `${fwd} ${rev} Z`;
  };

  const uid = `mp_${Math.round(x)}_${Math.round(flagW)}`;

  return (
    <g>
      <defs>
        <linearGradient id={`${uid}_red`} x1="0%" y1="0%" x2="100%" y2="25%">
          <stop offset="0%" stopColor="#94181e" />
          <stop offset="32%" stopColor="#d2262b" />
          <stop offset="68%" stopColor="#ae1d22" />
          <stop offset="100%" stopColor="#e23a38" />
        </linearGradient>
        <linearGradient id={`${uid}_white`} x1="0%" y1="0%" x2="100%" y2="25%">
          <stop offset="0%" stopColor="#cfc4b6" />
          <stop offset="34%" stopColor="#f6efe2" />
          <stop offset="70%" stopColor="#d9cdbe" />
          <stop offset="100%" stopColor="#f8f2e6" />
        </linearGradient>
      </defs>

      {showPole && (
        <g>
          <line x1={x} y1={y} x2={x} y2={y - poleH} stroke="#3c2638" strokeWidth={6.5} strokeLinecap="round" />
          <line x1={x + 2} y1={y - 6} x2={x + 2} y2={y - poleH + 6} stroke="#f4c474" strokeWidth={1.6} opacity={rimOpacity * 0.7} />
          <circle cx={x} cy={y - poleH - 3} r={7.5} fill="#f4b85e" stroke="#fff2cc" strokeWidth={1.2} />
        </g>
      )}

      <path d={buildPoly(topPts, midPts)} fill={`url(#${uid}_red)`} />
      <path d={buildPoly(midPts, botPts)} fill={`url(#${uid}_white)`} />
      <path
        d={topPts.map(([px, py], i) => `${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`).join(' ')}
        fill="none"
        stroke="#ffe2a8"
        strokeWidth={2.2}
        opacity={rimOpacity * 0.72}
      />
    </g>
  );
};

/**
 * Two-Depth Deterministic Archival Gold & Crimson Dust Motes.
 */
export const AmbientGoldDustOverlay: React.FC<{
  f: number;
  count?: number;
  color?: string;
  opacity?: number;
  speed?: number;
}> = ({ f, count = 34, color = '#f8c878', opacity = 0.62, speed = 1.15 }) => {
  if (opacity <= 0.01) return null;
  return (
    <svg width={720} height={1280} viewBox="0 0 720 1280" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity }}>
      <defs>
        <filter id="gmniDustBlur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.4" />
        </filter>
      </defs>
      {Array.from({ length: count }).map((_, i) => {
        const isNear = i % 4 === 0;
        const isCrimsonSpark = i % 7 === 0;
        const sp = (0.002 + hash01(i * 19.7) * 0.0034) * speed * (isNear ? 1.45 : 1.0);
        const p = (f * sp + hash01(i * 43.3 + 2.1)) % 1;
        const baseX = hash01(i * 67.1 + 5.7) * 760 - 20;
        const x = ((baseX + Math.sin(p * Math.PI * 2.5 + i) * 32) % 760 + 760) % 760 - 20;
        const y = 1260 - p * 1300;
        const r = isNear ? 3.4 + hash01(i * 29.1) * 3.0 : 1.1 + hash01(i * 13.7) * 1.6;
        const a = Math.sin(p * Math.PI) * (isNear ? 0.42 : 0.68);
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={r}
            fill={isCrimsonSpark ? '#f04a42' : i % 3 === 0 ? '#fff2cc' : color}
            opacity={a}
            filter={isNear ? 'url(#gmniDustBlur)' : undefined}
          />
        );
      })}
    </svg>
  );
};

/** Twinkling Twilight Starfield */
export const TwilightStars: React.FC<{ f: number; opacity: number; count?: number }> = ({ f, opacity, count = 58 }) => {
  if (opacity <= 0.01) return null;
  return (
    <g opacity={opacity}>
      {Array.from({ length: count }).map((_, i) => {
        const sx = hash01(i * 19.3 + 1.1) * 700 + 10;
        const sy = hash01(i * 37.7 + 4.3) * 560 + 12;
        const r = i % 5 === 0 ? 1.9 : 1.1;
        const tw = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(f * 0.075 + i * 2.1));
        return <circle key={i} cx={sx} cy={sy} r={r} fill="#f6ecd8" opacity={tw} />;
      })}
    </g>
  );
};

/**
 * Signature Twilight Parchment Glowing Warm Serif Chapter Header + Iconic GMNI Merah-Putih-Merah Editorial Trim.
 */
export const ChapterHeader: React.FC<{
  title: string;
  subtitle: string;
  opacity: number;
  subOpacity?: number;
  enterProgress?: number;
}> = ({ title, subtitle, opacity, subOpacity = opacity, enterProgress = 1 }) => {
  if (opacity <= 0.01) return null;
  const barW = Math.round(lerp(24, 210, easeOutCubic(enterProgress)));
  const slideY = lerp(12, 0, easeOutCubic(enterProgress));
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 80,
        width: 720,
        textAlign: 'center',
        pointerEvents: 'none',
        opacity,
        transform: `translateY(${slideY.toFixed(1)}px)`,
      }}
    >
      <div
        style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: 42,
          fontWeight: 'bold',
          letterSpacing: '4px',
          color: '#f6ecd4',
          textShadow: '0 0 24px rgba(245, 198, 124, 0.72), 0 3px 10px rgba(18, 10, 26, 0.9)',
          lineHeight: 1.1,
        }}
      >
        {title}
      </div>
      {/* Signature Subtle GMNI Merah-Putih-Merah Hairline Accent Bar */}
      <div
        style={{
          width: barW,
          height: 3,
          margin: '9px auto 8px',
          borderRadius: 2,
          background: 'linear-gradient(90deg, rgba(196,32,38,0) 0%, #c8242a 24%, #f4eee2 50%, #c8242a 76%, rgba(196,32,38,0) 100%)',
          boxShadow: '0 0 12px rgba(210, 42, 42, 0.5)',
        }}
      />
      {subtitle && subOpacity > 0.01 && (
        <div
          style={{
            fontFamily: 'Segoe UI, Arial, sans-serif',
            fontSize: 14.5,
            fontWeight: 700,
            letterSpacing: '6.2px',
            color: '#f6ede0',
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
 * Signature Tactile Hand-Torn Deckle-Edge Parchment Karaoke Subtitle Card (Zero blank-card flash!).
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
  const cardEnterAlpha = Math.min(1, Math.max(0.4, (f - activeCard.startFrame + 1) / 3)) * fadeOpacity;
  const enterScale = lerp(0.95, 1.0, springSettle((f - activeCard.startFrame) / 7));

  const cardH = activeCard.lines.length === 1 ? 74 : 114;
  const longestChars = Math.max(...activeCard.lines.map((l) => l.length));
  const cardW = Math.max(330, Math.min(640, Math.round(longestChars * 19.8 + 86)));
  const cyCard = activeCard.lines.length === 1 ? 1006 : 1024;
  const sf = activeCard.startFrame;
  const tiltDeg = ((sf % 7) - 3) * 0.13;

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
        opacity: cardEnterAlpha,
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
          <linearGradient id="gmniParchGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={PALETTE.parchTop} />
            <stop offset="100%" stopColor={PALETTE.parchBot} />
          </linearGradient>
          <filter id="gmniCardDrop" x="-15%" y="-20%" width="130%" height="150%">
            <feDropShadow dx="2.5" dy="6" stdDeviation="4" floodColor="#100816" floodOpacity="0.62" />
          </filter>
        </defs>
        <polygon points={pts.join(' ')} fill="url(#gmniParchGrad)" stroke="#d2c3a8" strokeWidth={1.4} filter="url(#gmniCardDrop)" />
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
                fontSize: 34,
                lineHeight: '44px',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                opacity: 1,
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

/** Optical Corner Vignette, Top Editorial GMNI Hairline & Archival SVG Paper Grain */
export const CinematicGradeOverlay: React.FC<{ warmth?: number; vignette?: number }> = ({
  warmth = 0.06,
  vignette = 0.34,
}) => (
  <>
    {warmth > 0.005 && (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: `radial-gradient(ellipse at 50% 56%, rgba(248,176,90,${warmth.toFixed(3)}) 0%, rgba(22,10,30,0) 70%)`,
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
    {/* Subtle 3px Crimson-White-Crimson GMNI Archival Crown Accent Line at Top Edge */}
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        pointerEvents: 'none',
        background: 'linear-gradient(90deg, #8e181e 0%, #c82428 32%, #f4eee2 50%, #c82428 68%, #8e181e 100%)',
        opacity: 0.72,
      }}
    />
    <svg width={720} height={1280} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.04, mixBlendMode: 'overlay' }}>
      <filter id="gmniPaperGrain">
        <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="3" seed="41" />
      </filter>
      <rect width="100%" height="100%" filter="url(#gmniPaperGrain)" />
    </svg>
  </>
);
