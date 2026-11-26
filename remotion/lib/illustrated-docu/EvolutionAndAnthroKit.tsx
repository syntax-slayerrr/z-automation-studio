import React from 'react';
import { clamp, easeInOutCubic, easeOutCubic, lerp } from './palettes';

/**
 * Animated Scientific Callout Pill with Leader Line (`InfoCalloutTag`).
 * Explains specific anatomical regions, historical artifacts, or experimental citations cleanly.
 */
export const InfoCalloutTag: React.FC<{
  f: number;
  startFrame: number;
  targetX: number;
  targetY: number;
  boxX: number;
  boxY: number;
  title: string;
  subtitle?: string;
  accentColor?: string;
  width?: number;
  opacity?: number;
}> = ({
  f,
  startFrame,
  targetX,
  targetY,
  boxX,
  boxY,
  title,
  subtitle,
  accentColor = '#f8c264',
  width = 216,
  opacity = 1,
}) => {
  const p = easeOutCubic(clamp((f - startFrame) / 18, 0, 1)) * opacity;
  if (p <= 0.01) return null;
  const h = subtitle ? 48 : 30;
  const lx = lerp(targetX, boxX, p);
  const ly = lerp(targetY, boxY, p);

  return (
    <g opacity={p}>
      <circle cx={targetX} cy={targetY} r={4.5} fill={accentColor} />
      <circle cx={targetX} cy={targetY} r={9} fill="none" stroke={accentColor} strokeWidth={1.4} opacity={0.65} />
      <line x1={targetX} y1={targetY} x2={lx} y2={ly} stroke={accentColor} strokeWidth={1.8} strokeDasharray="5 4" />
      <g transform={`translate(${boxX - width / 2}, ${boxY - h / 2}) scale(${lerp(0.92, 1.0, p)})`}>
        <rect x={0} y={0} width={width} height={h} rx={10} fill="#1b122a" fillOpacity={0.92} stroke={accentColor} strokeWidth={1.6} />
        <text
          x={width / 2}
          y={subtitle ? 19 : 20}
          textAnchor="middle"
          fill="#fff0cc"
          fontSize={12}
          fontFamily="Segoe UI, Arial, sans-serif"
          fontWeight={700}
          letterSpacing={1.6}
        >
          {title}
        </text>
        {subtitle && (
          <text
            x={width / 2}
            y={37}
            textAnchor="middle"
            fill={accentColor}
            fontSize={11}
            fontFamily="Segoe UI, Arial, sans-serif"
            fontWeight={600}
            letterSpacing={0.8}
          >
            {subtitle}
          </text>
        )}
      </g>
    </g>
  );
};

/**
 * Illustrated Cultural / Evolutionary Artifact Medallion (`ArtifactBadge2D`).
 * Replaces plain wire circles with rich 2.5D colored gouache-shaded artifacts.
 */
export const ArtifactBadge2D: React.FC<{
  x: number;
  y: number;
  radius?: number;
  kind: 'bracelet' | 'vessel' | 'mandala' | 'neural_wave' | 'community' | 'lantern';
  accentColor?: string;
  opacity?: number;
}> = ({ x, y, radius = 28, kind, accentColor = '#f8c264', opacity = 1 }) => {
  if (opacity <= 0.01) return null;
  return (
    <g transform={`translate(${x}, ${y})`} opacity={opacity}>
      <circle cx={0} cy={0} r={radius + 5} fill={accentColor} opacity={0.18} />
      <circle cx={0} cy={0} r={radius} fill="#261838" stroke={accentColor} strokeWidth={2.0} />
      {kind === 'bracelet' && (
        <g>
          <circle cx={0} cy={0} r={12} fill="none" stroke="#d45638" strokeWidth={3.5} />
          {[0, 1, 2, 3, 4, 5].map((bi) => {
            const a = (bi / 6) * Math.PI * 2;
            return <circle key={bi} cx={Math.cos(a) * 12} cy={Math.sin(a) * 12} r={2.8} fill="#ffe4a0" />;
          })}
        </g>
      )}
      {kind === 'vessel' && (
        <g>
          <path d="M -12 2 Q 0 14, 12 2 L 9 -6 L -9 -6 Z" fill="#e89438" stroke="#fff0cc" strokeWidth={1.4} />
          <ellipse cx={0} cy={-6} rx={9} ry={3} fill="#ffe6a8" />
        </g>
      )}
      {kind === 'mandala' && (
        <g>
          <circle cx={0} cy={0} r={13} fill="none" stroke="#48a89c" strokeWidth={2} />
          <circle cx={0} cy={0} r={6} fill="#f8c264" />
        </g>
      )}
      {kind === 'neural_wave' && (
        <path d="M -14 3 Q -7 -12, 0 0 T 14 -2" fill="none" stroke="#58c4b8" strokeWidth={2.8} strokeLinecap="round" />
      )}
      {kind === 'community' && (
        <g>
          <circle cx={-7} cy={3} r={4.5} fill="#e06c58" />
          <circle cx={7} cy={3} r={4.5} fill="#48a89c" />
          <circle cx={0} cy={-7} r={4.8} fill="#f8c264" />
        </g>
      )}
      {kind === 'lantern' && (
        <g>
          <rect x={-7} y={-9} width={14} height={18} rx={5} fill="#f4a442" stroke="#c85228" strokeWidth={1.3} />
          <circle cx={0} cy={0} r={4} fill="#fff4d6" />
        </g>
      )}
    </g>
  );
};

/**
 * Multi-Layer Sedimentary & Archaeological Strata Bar (`StrataTimelineStrip2D`).
 * Visualizes deep-time continuity across generations and epochs (Evolution & Anthropology).
 */
export const StrataTimelineStrip2D: React.FC<{
  f: number;
  yTop: number;
  opacity?: number;
}> = ({ f, yTop, opacity = 1 }) => {
  if (opacity <= 0.01) return null;
  const drift = Math.sin(f * 0.02) * 6;
  return (
    <g transform={`translate(0, ${yTop})`} opacity={opacity}>
      {/* Layer 1: Top Cultural Soil */}
      <path d="M -240 0 Q 180 -18, 360 -4 T 960 -10 L 960 90 L -240 90 Z" fill="#3a2338" stroke="#f8c264" strokeOpacity={0.38} strokeWidth={1.6} />
      {/* Layer 2: Neolithic / Historical Terracotta Stratum */}
      <path d="M -240 68 Q 220 52, 410 66 T 960 58 L 960 165 L -240 165 Z" fill="#522c36" stroke="#d47a48" strokeOpacity={0.32} strokeWidth={1.4} />
      {/* Layer 3: Paleolithic Ochre Stratum with Embedded Artifacts (extends deep to prevent bottom gap on zoom-out!) */}
      <path d="M -240 135 Q 190 122, 380 136 T 960 126 L 960 720 L -240 720 Z" fill="#2b192e" />
      {/* Subtle Embedded Archaeological Motifs (Handprint, Pottery Shard, Spiral Fossil) */}
      <g transform={`translate(${drift}, 0)`} opacity={0.45}>
        <circle cx={145} cy={104} r={14} fill="none" stroke="#e8a464" strokeWidth={2} strokeDasharray="4 3" />
        <path d="M 348 96 Q 360 114, 372 96 Z" fill="#d46a44" />
        <circle cx={565} cy={106} r={12} fill="none" stroke="#c89a68" strokeWidth={1.8} />
      </g>
    </g>
  );
};
