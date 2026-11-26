import React from 'react';
import { useVideoConfig } from 'remotion';
import { clamp, easeHeavyStone, easeRouteDraw } from './tokens';

// =============================================================================
// 1. PARCHMENT SCROLL BANNER (Aged Deckled Scroll with Rolled Wooden Ends)
// =============================================================================

export interface ParchmentScrollBannerProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  enterProgress?: number;
}

export const ParchmentScrollBanner: React.FC<ParchmentScrollBannerProps> = ({
  title,
  subtitle,
  eyebrow,
  x = 0,
  y = 0,
  width = 580,
  height = 132,
  enterProgress = 1,
}) => {
  const p = easeHeavyStone(clamp(enterProgress, 0, 1));
  const ty = (1 - p) * 18;
  const usableW = Math.max(200, width - 92);
  const titleFontSize = Math.round(clamp(usableW / Math.max(1, title.length * 0.66), 20, 34));
  const subFontSize = subtitle ? Math.round(clamp(usableW / Math.max(1, subtitle.length * 0.5), 12.5, 16)) : 15;
  return (
    <g transform={`translate(${x}, ${y + ty})`} opacity={0.18 + 0.82 * p}>
      <defs>
        <linearGradient id="odyssey-parchment-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F1E1BE" />
          <stop offset="55%" stopColor="#E4CCA0" />
          <stop offset="100%" stopColor="#CFAF7E" />
        </linearGradient>
      </defs>
      {/* Soft warm shadow underneath */}
      <rect x={14} y={10} width={width - 28} height={height} rx={6} fill="#1E1512" opacity={0.36} />
      {/* Rolled left & right scroll ends */}
      <rect x={0} y={8} width={24} height={height - 16} rx={10} fill="#A98251" stroke="#5C3D24" strokeWidth={2} />
      <rect x={width - 24} y={8} width={24} height={height - 16} rx={10} fill="#A98251" stroke="#5C3D24" strokeWidth={2} />
      {/* Main parchment body */}
      <path
        d={`M 18 4 L ${width - 18} 2 L ${width - 14} ${height - 4} L 14 ${height - 2} Z`}
        fill="url(#odyssey-parchment-grad)"
        stroke="#7D5836"
        strokeWidth={2.2}
      />
      {/* Delicate inner antique double border */}
      <rect
        x={28}
        y={13}
        width={width - 56}
        height={height - 26}
        rx={2}
        fill="none"
        stroke="#8C633B"
        strokeWidth={1.3}
        opacity={0.72}
      />
      {eyebrow && (
        <text
          x={width / 2}
          y={36}
          textAnchor="middle"
          fill="#7D4C29"
          fontFamily="system-ui, sans-serif"
          fontSize={12.5}
          fontWeight={800}
          letterSpacing="0.18em"
        >
          {eyebrow.toUpperCase()}
        </text>
      )}
      <text
        x={width / 2}
        y={eyebrow ? 76 : 66}
        textAnchor="middle"
        fill="#2C1D16"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize={titleFontSize}
        fontWeight={800}
        letterSpacing="0.025em"
      >
        {title}
      </text>
      {subtitle && (
        <text
          x={width / 2}
          y={height - 22}
          textAnchor="middle"
          fill="#5B3F2B"
          fontFamily="Georgia, serif"
          fontSize={subFontSize}
          fontStyle="italic"
        >
          {subtitle}
        </text>
      )}
    </g>
  );
};

// =============================================================================
// 2. ANTIQUE BRASS COMPASS ROSE
// =============================================================================

export const BrassCompassRose: React.FC<{
  x: number;
  y: number;
  radius?: number;
  frame?: number;
}> = ({ x, y, radius = 64, frame = 0 }) => {
  const needleDrift = Math.sin(frame * 0.055) * 4.5;
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <radialGradient id="odyssey-brass-rim" cx="38%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#F6D88C" />
          <stop offset="55%" stopColor="#C8913E" />
          <stop offset="100%" stopColor="#6D451D" />
        </radialGradient>
      </defs>
      {/* Drop shadow */}
      <circle cx={4} cy={7} r={radius + 3} fill="#141C24" opacity={0.48} />
      {/* Outer sculpted brass ring */}
      <circle cx={0} cy={0} r={radius} fill="url(#odyssey-brass-rim)" stroke="#4C2E14" strokeWidth={2.5} />
      <circle cx={0} cy={0} r={radius * 0.84} fill="#253644" stroke="#E5BE6C" strokeWidth={1.5} />
      <circle cx={0} cy={0} r={radius * 0.66} fill="none" stroke="#9D7A44" strokeWidth={1} strokeDasharray="3 4" />
      {/* Minor diagonal star points */}
      {[45, 135, 225, 315].map((deg) => (
        <polygon
          key={deg}
          points={`0,${-radius * 0.54} ${radius * 0.1},0 0,${radius * 0.54} ${-radius * 0.1},0`}
          fill="#A98245"
          transform={`rotate(${deg})`}
        />
      ))}
      {/* Cardinal star points */}
      <g transform={`rotate(${needleDrift})`}>
        <polygon points={`0,${-radius * 0.78} ${radius * 0.14},0 0,0`} fill="#C84333" />
        <polygon points={`0,${-radius * 0.78} ${-radius * 0.14},0 0,0`} fill="#E8C276" />
        <polygon points={`0,${radius * 0.78} ${radius * 0.14},0 0,0`} fill="#7A5A32" />
        <polygon points={`0,${radius * 0.78} ${-radius * 0.14},0 0,0`} fill="#B99052" />
        <polygon points={`${radius * 0.72},0 0,${-radius * 0.12} 0,${radius * 0.12}`} fill="#E2B968" />
        <polygon points={`${-radius * 0.72},0 0,${-radius * 0.12} 0,${radius * 0.12}`} fill="#A37A40" />
      </g>
      <circle cx={0} cy={0} r={radius * 0.12} fill="#F4D78F" stroke="#533316" strokeWidth={2} />
      <text x={0} y={-radius * 0.87} textAnchor="middle" fill="#2A190E" fontSize={11} fontWeight={800} fontFamily="Georgia, serif">
        N
      </text>
    </g>
  );
};

// =============================================================================
// 3. CRIMSON MAP MARKER PIN (Confirmed Fossil/Site Pin)
// =============================================================================

export const MapMarkerPin: React.FC<{
  x: number;
  y: number;
  label?: string;
  sublabel?: string;
  frame?: number;
  confirmed?: boolean;
  labelAlign?: 'right' | 'left';
}> = ({ x, y, label, sublabel, frame = 0, confirmed = true, labelAlign = 'right' }) => {
  const pulse = (frame * 0.03) % 1;
  const boxW = label ? Math.max(138, Math.max(label.length * 9.2, (sublabel?.length ?? 0) * 7.2) + 18) : 0;
  const boxX = labelAlign === 'left' ? -(boxW + 18) : 20;
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Animated ground pulse ring */}
      <ellipse
        cx={0}
        cy={2}
        rx={8 + pulse * 24}
        ry={3 + pulse * 8}
        fill="none"
        stroke={confirmed ? '#E5B254' : '#7BC4D4'}
        strokeWidth={2}
        opacity={(1 - pulse) * 0.8}
      />
      <ellipse cx={0} cy={2} rx={8} ry={3} fill="#18222B" opacity={0.48} />
      {/* Sculpted crimson teardrop pin */}
      <path
        d="M 0 0 C -8 -11, -15 -18, -15 -27 A 15 15 0 1 1 15 -27 C 15 -18, 8 -11, 0 0 Z"
        fill={confirmed ? '#C43E31' : '#3C8AA4'}
        stroke="#F2D79A"
        strokeWidth={2}
      />
      <circle cx={0} cy={-27} r={5.5} fill="#F7E5B8" />
      {label && (
        <g transform={`translate(${boxX}, -24)`}>
          <rect x={-6} y={-18} width={boxW} height={sublabel ? 40 : 24} rx={5} fill="#182633" opacity={0.88} stroke="#C89B54" strokeWidth={1.2} />
          <text x={4} y={-2} fill="#F5E6C4" fontFamily="Georgia, serif" fontSize={14} fontWeight={700}>
            {label}
          </text>
          {sublabel && (
            <text x={4} y={15} fill="#A7C4D4" fontFamily="system-ui, sans-serif" fontSize={11.5} fontWeight={600}>
              {sublabel}
            </text>
          )}
        </g>
      )}
    </g>
  );
};

// =============================================================================
// 4. ANTIQUE TIMELINE TRACK & BAR CHART & ORNATE CORNER FRAME
// =============================================================================

export interface TimelineStop {
  era: string;
  label: string;
}

export const OdysseyTimelineTrack: React.FC<{
  x: number;
  y: number;
  width: number;
  stops: TimelineStop[];
  progress?: number;
}> = ({ x, y, width, stops, progress = 1 }) => {
  const p = easeRouteDraw(clamp(progress, 0, 1));
  const padX = 88;
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x={0} y={-36} width={width} height={88} rx={10} fill="#16222E" opacity={0.86} stroke="#9E7B48" strokeWidth={1.5} />
      {/* Base rail */}
      <line x1={padX} y1={4} x2={width - padX} y2={4} stroke="#5B6E7D" strokeWidth={4} strokeLinecap="round" />
      {/* Animated golden progress bar */}
      <line
        x1={padX}
        y1={4}
        x2={padX + (width - padX * 2) * p}
        y2={4}
        stroke="#E4AF52"
        strokeWidth={4.5}
        strokeLinecap="round"
      />
      {stops.map((s, idx) => {
        const frac = stops.length === 1 ? 0.5 : idx / (stops.length - 1);
        const sx = padX + (width - padX * 2) * frac;
        const active = p >= frac - 0.02;
        return (
          <g key={idx} transform={`translate(${sx}, 4)`}>
            <circle cx={0} cy={0} r={active ? 8.5 : 6} fill={active ? '#F5CE7A' : '#3C5162'} stroke="#18242F" strokeWidth={2.5} />
            <text x={0} y={-16} textAnchor="middle" fill={active ? '#F3D48B' : '#8BA1B2'} fontFamily="Georgia, serif" fontSize={14} fontWeight={700}>
              {s.era}
            </text>
            <text x={0} y={28} textAnchor="middle" fill={active ? '#EBE0C8' : '#7D92A2'} fontFamily="system-ui, sans-serif" fontSize={12.5} fontWeight={600}>
              {s.label}
            </text>
          </g>
        );
      })}
    </g>
  );
};

export interface BarDatum {
  label: string;
  value: number;
  unit?: string;
  color: string;
}

export const OdysseyBarChart: React.FC<{
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  data: BarDatum[];
  maxVal?: number;
  progress?: number;
}> = ({ x, y, width, height, title, data, maxVal, progress = 1 }) => {
  const p = easeHeavyStone(clamp(progress, 0, 1));
  const topMax = maxVal ?? Math.max(...data.map((d) => d.value)) * 1.15;
  const chartH = height - 86;
  const slotW = (width - 52) / Math.max(1, data.length);

  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x={0} y={0} width={width} height={height} rx={10} fill="#13222F" opacity={0.86} stroke="#A8824C" strokeWidth={1.6} />
      <text x={22} y={32} fill="#F2DFB8" fontFamily="Georgia, serif" fontSize={18} fontWeight={700}>
        {title}
      </text>
      {/* Subtle horizontal gridlines */}
      {[0.25, 0.5, 0.75, 1].map((g) => (
        <line
          key={g}
          x1={24}
          y1={50 + chartH * (1 - g)}
          x2={width - 24}
          y2={50 + chartH * (1 - g)}
          stroke="#48687A"
          strokeWidth={1}
          strokeDasharray="4 4"
          opacity={0.45}
        />
      ))}
      <line x1={24} y1={50 + chartH} x2={width - 24} y2={50 + chartH} stroke="#C49B5C" strokeWidth={2} />
      {data.map((d, i) => {
        const barH = Math.max(6, (d.value / topMax) * chartH * p);
        const bx = 32 + i * slotW;
        const bw = Math.min(58, slotW - 18);
        const by = 50 + chartH - barH;
        return (
          <g key={i}>
            <rect x={bx} y={by} width={bw} height={barH} rx={4} fill={d.color} />
            <rect x={bx + bw - 8} y={by} width={8} height={barH} rx={2} fill="#FCE9BC" opacity={0.22} />
            <text x={bx + bw / 2} y={by - 8} textAnchor="middle" fill="#F3E2BE" fontFamily="system-ui, sans-serif" fontSize={13} fontWeight={700}>
              {Math.round(d.value * p)}
              {d.unit ?? ''}
            </text>
            <text x={bx + bw / 2} y={50 + chartH + 22} textAnchor="middle" fill="#B8CCD8" fontFamily="system-ui, sans-serif" fontSize={12.5} fontWeight={600}>
              {d.label}
            </text>
          </g>
        );
      })}
    </g>
  );
};

export const OrnateCornerFrame: React.FC<{
  x: number;
  y: number;
  width: number;
  height: number;
  stroke?: string;
}> = ({ x, y, width, height, stroke = '#D4A254' }) => {
  const c = 26;
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x={0} y={0} width={width} height={height} rx={6} fill="none" stroke={stroke} strokeWidth={1.3} opacity={0.48} />
      {/* Four antique brass brackets */}
      <path d={`M 0 ${c} L 0 0 L ${c} 0`} fill="none" stroke={stroke} strokeWidth={3.2} strokeLinecap="round" />
      <path d={`M ${width - c} 0 L ${width} 0 L ${width} ${c}`} fill="none" stroke={stroke} strokeWidth={3.2} strokeLinecap="round" />
      <path d={`M 0 ${height - c} L 0 ${height} L ${c} ${height}`} fill="none" stroke={stroke} strokeWidth={3.2} strokeLinecap="round" />
      <path d={`M ${width - c} ${height} L ${width} ${height} L ${width} ${height - c}`} fill="none" stroke={stroke} strokeWidth={3.2} strokeLinecap="round" />
    </g>
  );
};

export const FilmicSubtitleBar: React.FC<{
  text: string;
  tag?: string;
  citation?: string;
  /** Override bottom margin (defaults to 215px in 9:16 TikTok portrait, 28px in 16:9). */
  bottomOffset?: number;
}> = ({ text, tag, citation, bottomOffset }) => {
  const { width, height } = useVideoConfig();
  const isPortrait = height > width;
  const resolvedBottom = bottomOffset ?? (isPortrait ? 215 : 28);

  return (
    <div
      style={{
        position: 'absolute',
        left: isPortrait ? 52 : 72,
        right: isPortrait ? 104 : 72,
        bottom: resolvedBottom,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: isPortrait ? 10 : 7,
      }}
    >
      {tag && (
        <div
          style={{
            padding: isPortrait ? '5px 16px' : '4px 14px',
            borderRadius: 999,
            backgroundColor: 'rgba(26, 20, 18, 0.86)',
            border: '1px solid rgba(218, 168, 86, 0.62)',
            color: '#F3D28A',
            fontSize: isPortrait ? 15 : 12.5,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          {tag}
        </div>
      )}
      <div
        style={{
          maxWidth: isPortrait ? 920 : 1020,
          padding: isPortrait ? '16px 24px' : '12px 28px',
          borderRadius: 12,
          backgroundColor: 'rgba(22, 18, 17, 0.84)',
          borderBottom: '2.5px solid rgba(216, 162, 74, 0.68)',
          color: '#F4EAD6',
          fontSize: isPortrait ? 31 : 25,
          lineHeight: 1.38,
          textAlign: 'center',
          fontFamily: 'Georgia, serif',
          textShadow: '0 2px 6px rgba(14, 10, 8, 0.72)',
        }}
      >
        {text}
      </div>
      {citation && (
        <div
          style={{
            color: '#C7B89C',
            fontSize: isPortrait ? 15 : 12.5,
            textAlign: 'center',
            fontFamily: 'system-ui, sans-serif',
            letterSpacing: '0.03em',
            textShadow: '0 1px 4px rgba(14, 10, 8, 0.88)',
          }}
        >
          {citation}
        </div>
      )}
    </div>
  );
};
