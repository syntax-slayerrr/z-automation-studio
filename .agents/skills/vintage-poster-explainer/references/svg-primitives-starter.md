# Drop-In Remotion / SVG 1:1 Primitives (`vintage-poster-explainer`)

Copy and adapt these exact primitives into `remotion/videos/<topic-slug>/fx.tsx` so every new video matches the reference style 1:1 on the first render.

> **Google Fonts Load**: Always load **`Alfa Slab One`** and **`Plus Jakarta Sans`** via `@remotion/google-fonts` (or `@import` in CSS inside Remotion) and wait for fonts before capture so headless Chromium renders the exact chunky slab-serif letterforms!

---

## 1. Static Vintage Paper & Horizontal Fiber Multiply Overlay (Zero Boil!)
```tsx
export const VintagePaperOverlay: React.FC<{ opacity?: number }> = ({ opacity = 0.18 }) => (
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
      {/* Static fine matte watercolor paper tooth (fixed seed = ZERO frame boil!) */}
      <filter id="vpPaperGrain" x="0%" y="0%" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.68" numOctaves="4" seed="17" result="fine" />
        <feColorMatrix type="saturate" values="0.18" in="fine" result="desat" />
        <feComponentTransfer in="desat">
          <feFuncR type="linear" slope="0.96" intercept="0.06" />
          <feFuncG type="linear" slope="0.92" intercept="0.05" />
          <feFuncB type="linear" slope="0.84" intercept="0.04" />
        </feComponentTransfer>
      </filter>
      {/* Subtle horizontal woven linen/dry-brush paper streaks */}
      <filter id="vpPaperFibers" x="0%" y="0%" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.015 0.32" numOctaves="2" seed="9" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
    </defs>
    <rect width={720} height={1280} fill="#EFE6D3" filter="url(#vpPaperGrain)" />
    <rect width={720} height={1280} fill="#D8CBB2" filter="url(#vpPaperFibers)" opacity={0.32} />
  </svg>
);
```

---

## 2. Exact 1:1 Retro Slab-Serif Hero Title + Burnt-Sienna 3D Block Shadow + Ticket Ribbon
```tsx
export const RetroSlabTitle3D: React.FC<{
  lines: string[];
  subtitle?: string;
  top?: number;
  fontSize?: number;
  opacity?: number;
  scale?: number;
  blurPx?: number;
}> = ({ lines, subtitle, top = 148, fontSize = 66, opacity = 1, scale = 1, blurPx = 0 }) => {
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
            color: '#FAF1DC',
            WebkitTextStroke: '2.2px #2B1B17',
            paintOrder: 'stroke fill',
            // Signature layered burnt-sienna 3D vintage travel-poster extrusion!
            textShadow:
              '1px 1px 0 #7C3220, 2px 2px 0 #7C3220, 3px 3px 0 #6E2C1B, 4px 4px 0 #5C2418, 5px 5px 0 #2B1B17, 0 8px 16px rgba(24,14,12,0.42)',
          }}
        >
          {line}
        </div>
      ))}
      {subtitle && (
        <div
          style={{
            display: 'inline-block',
            marginTop: 12,
            padding: '6px 20px',
            borderRadius: 2,
            backgroundColor: 'rgba(30, 38, 49, 0.92)',
            fontFamily: '"Plus Jakarta Sans", "Segoe UI", sans-serif',
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: '4px',
            color: '#F5EFE2',
            textTransform: 'uppercase',
            boxShadow: '0 3px 8px rgba(18, 16, 20, 0.4)',
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
};
```

---

## 3. Exact 1:1 Hand-Brushed Feathered Charcoal Karaoke Subtitle Bar
```tsx
export const BrushedInkSubtitleBar: React.FC<{
  lines: string[];
  activeWordIdx: number;
  fadeOpacity?: number;
}> = ({ lines, activeWordIdx, fadeOpacity = 1 }) => {
  if (fadeOpacity <= 0.01 || lines.length === 0) return null;
  const maxChars = Math.max(...lines.map((l) => l.length));
  const barW = Math.max(290, Math.min(590, Math.round(maxChars * 16.5 + 88)));
  const barH = lines.length === 1 ? 56 : 94;
  const cy = lines.length === 1 ? 1024 : 1034;

  // Deterministic horizontal dry-bristle brush stroke silhouette on left & right ends!
  const buildBrushPath = (w: number, h: number) => {
    const segs = 12;
    const pts: string[] = [];
    // Top jagged horizontal brush edge
    pts.push(`M 22 4 L ${w - 22} 3`);
    // Right feathered bristle streaks
    for (let i = 0; i <= segs; i++) {
      const y = 3 + ((h - 6) * i) / segs;
      const jut = (i % 3 === 0 ? 18 : i % 2 === 0 ? 7 : -9) + Math.sin(i * 4.3) * 6;
      pts.push(`L ${(w - 18 + jut).toFixed(1)} ${y.toFixed(1)}`);
    }
    // Bottom edge
    pts.push(`L 22 ${h - 4}`);
    // Left feathered bristle streaks
    for (let i = segs; i >= 0; i--) {
      const y = 3 + ((h - 6) * i) / segs;
      const jut = (i % 3 === 1 ? -18 : i % 2 === 0 ? -7 : 9) + Math.cos(i * 3.9) * 6;
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
        opacity: fadeOpacity,
        pointerEvents: 'none',
      }}
    >
      <svg
        width={barW + 44}
        height={barH + 16}
        viewBox={`-22 -8 ${barW + 44} ${barH + 16}`}
        style={{ position: 'absolute', left: -22, top: -8, overflow: 'visible' }}
      >
        {/* Main dark brushed-ink wash */}
        <path d={buildBrushPath(barW, barH)} fill="#1B212C" fillOpacity={0.82} />
        {/* Secondary dry-bristle top/bottom texture lines */}
        <line x1={12} y1={5} x2={barW - 14} y2={5} stroke="#1B212C" strokeWidth={2} strokeDasharray="24 6 12 4" opacity={0.55} />
        <line x1={16} y1={barH - 5} x2={barW - 10} y2={barH - 5} stroke="#1B212C" strokeWidth={2} strokeDasharray="18 5 28 6" opacity={0.55} />
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
        {lines.map((ln, lIdx) => {
          const words = ln.split(' ');
          const offset = lIdx === 0 ? 0 : lines[0].split(' ').length;
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
                  gIdx < activeWordIdx
                    ? '#F5F2EA' // spoken (past)
                    : gIdx === activeWordIdx
                      ? '#F8D348' // active golden-yellow!
                      : 'rgba(156, 164, 176, 0.62)'; // upcoming muted slate
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
```

---

## 4. Painted Cloud-Curtain Wipe (2-Tone Gouache Puffs Sweeping Full Screen)
```tsx
export const CloudCurtainWipe: React.FC<{ progress: number; tone?: 'ash' | 'day' }> = ({
  progress, // 0 = offscreen, 0.5 = 100% full cover (swap scene here!), 1 = parted offscreen
  tone = 'ash',
}) => {
  if (progress <= 0.005 || progress >= 0.995) return null;
  // Bell curve: closes inward from 0 -> 0.5, parts outward from 0.5 -> 1
  const closeAmt = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
  const lit = tone === 'ash' ? '#ABA4A6' : '#EFE8D8';
  const mid = tone === 'ash' ? '#797480' : '#BCC2C6';
  const shd = tone === 'ash' ? '#514C5A' : '#858E96';
  const puffs = [
    { cx: 120, cy: 190, r: 230, dx: -360, dy: -220 },
    { cx: 610, cy: 230, r: 245, dx: 360, dy: -200 },
    { cx: 360, cy: 460, r: 270, dx: 0, dy: -460 },
    { cx: 110, cy: 680, r: 255, dx: -390, dy: 80 },
    { cx: 620, cy: 710, r: 260, dx: 390, dy: 90 },
    { cx: 360, cy: 960, r: 280, dx: 0, dy: 440 },
    { cx: 150, cy: 1120, r: 240, dx: -340, dy: 280 },
    { cx: 590, cy: 1110, r: 245, dx: 340, dy: 280 },
  ];
  return (
    <svg width={720} height={1280} viewBox="0 0 720 1280" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {puffs.map((p, i) => {
        const px = p.cx + p.dx * (1 - closeAmt);
        const py = p.cy + p.dy * (1 - closeAmt);
        return (
          <g key={i} transform={`translate(${px.toFixed(1)}, ${py.toFixed(1)})`}>
            <circle cx={0} cy={0} r={p.r} fill={shd} stroke="#2A2428" strokeWidth={2.2} />
            <circle cx={-p.r * 0.12} cy={-p.r * 0.14} r={p.r * 0.84} fill={mid} />
            <circle cx={-p.r * 0.22} cy={-p.r * 0.24} r={p.r * 0.62} fill={lit} />
          </g>
        );
      })}
    </svg>
  );
};
```

---

## 5. Vintage Postcard Pull-Out Wrapper & Dashed Ghost Blueprint Overlay
```tsx
/** Wrap the final scene inside VintagePostcardFrame; animate `matProgress` 0 -> 1 over the final ~1.4s! */
export const VintagePostcardFrame: React.FC<{
  matProgress: number; // 0 = full bleed, 1 = vintage travel-poster cream border!
  children: React.ReactNode;
}> = ({ matProgress, children }) => {
  const padX = Math.round(matProgress * 30);
  const padY = Math.round(matProgress * 36);
  return (
    <div style={{ position: 'absolute', inset: 0, backgroundColor: '#C9BEA7', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          left: padX,
          top: padY,
          right: padX,
          bottom: padY,
          overflow: 'hidden',
          border: matProgress > 0.05 ? '2.5px solid #3B342C' : 'none',
          boxShadow: matProgress > 0.05 ? '0 10px 30px rgba(32, 24, 18, 0.35)' : 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: -padX,
            top: -padY,
            width: 720,
            height: 1280,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

/** Luminous dashed cream-gold ghost blueprint path drawing itself across the peaceful sky */
export const DashedGhostBlueprint: React.FC<{ d: string; drawProgress: number }> = ({ d, drawProgress }) => {
  if (drawProgress <= 0.01) return null;
  return (
    <g opacity={Math.min(1, drawProgress * 1.4)}>
      {/* Soft golden aura under dashed line */}
      <path
        d={d}
        fill="none"
        stroke="#F6D782"
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray="12 10"
        opacity={0.28}
        style={{ filter: 'blur(3px)' }}
      />
      {/* Crisp animated dashed blueprint contour */}
      <path
        d={d}
        fill="none"
        stroke="#FAF0CE"
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeDasharray="10 9"
        pathLength={1}
        strokeDashoffset={1 - drawProgress}
        opacity={0.92}
      />
    </g>
  );
};
```
