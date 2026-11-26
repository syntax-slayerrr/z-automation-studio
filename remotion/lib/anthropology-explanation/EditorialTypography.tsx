import React from 'react';
import { useVideoConfig } from 'remotion';
import { clamp, easeHeavyStone } from './tokens';

/**
 * 5-Tier Editorial Documentary Typography System (Zero Slide Headers / Zero Technical Pills).
 *
 * Hierarchy:
 *   1. ChapterTitleOverlay   — Restrained open-sky film title (only once at opening/chapter)
 *   2. SceneWhisperTitle     — Subtle uppercase geographic/era whisper (no box/plaque)
 *   3. DiegeticCallout       — Thin hairline leader + clean label tied directly to active anatomy/map site
 *   4. SupportingEvidenceNote— Ultra-quiet scientific provenance footnote
 *   5. EditorialSubtitle     — High-legibility TikTok 9:16 narration subtitle inside safe zone
 */

export const ChapterTitleOverlay: React.FC<{
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** 0..1 smooth editorial opacity (fades out cleanly once the opening holds). */
  opacity?: number;
  topOffset?: number;
}> = ({ eyebrow, title, subtitle, opacity = 1, topOffset = 176 }) => {
  const op = clamp(opacity, 0, 1);
  if (op <= 0.01) return null;
  const ty = (1 - easeHeavyStone(op)) * 16;

  return (
    <div
      style={{
        position: 'absolute',
        left: 64,
        right: 64,
        top: topOffset,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        opacity: op,
        transform: `translateY(${ty.toFixed(1)}px)`,
        pointerEvents: 'none',
      }}
    >
      {eyebrow && (
        <div
          style={{
            color: '#F5E4BE',
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            fontFamily: 'system-ui, sans-serif',
            textShadow: '0 2px 10px rgba(20, 18, 22, 0.75)',
            marginBottom: 10,
          }}
        >
          {eyebrow}
        </div>
      )}
      <div
        style={{
          color: '#FDF4DF',
          fontSize: 64,
          fontWeight: 700,
          letterSpacing: '0.14em',
          fontFamily: "Georgia, 'Times New Roman', serif",
          textShadow: '0 6px 26px rgba(18, 16, 20, 0.65)',
          lineHeight: 1.08,
        }}
      >
        {title}
      </div>
      <div
        style={{
          width: 110,
          height: 2,
          marginTop: 14,
          marginBottom: 12,
          background: 'linear-gradient(90deg, transparent, #F2CB78, transparent)',
        }}
      />
      {subtitle && (
        <div
          style={{
            color: '#EFE1C2',
            fontSize: 22,
            fontStyle: 'italic',
            fontFamily: 'Georgia, serif',
            letterSpacing: '0.06em',
            textShadow: '0 2px 12px rgba(18, 16, 20, 0.8)',
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
};

export const SceneWhisperTitle: React.FC<{
  era: string;
  location: string;
  opacity?: number;
  topOffset?: number;
}> = ({ era, location, opacity = 1, topOffset = 148 }) => {
  const op = clamp(opacity, 0, 1);
  if (op <= 0.01) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: 60,
        top: topOffset,
        opacity: op,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          color: '#EAB85E',
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
          fontFamily: 'system-ui, sans-serif',
          textShadow: '0 2px 8px rgba(12, 18, 26, 0.9)',
        }}
      >
        {era}
      </div>
      <div
        style={{
          color: '#F5EAD2',
          fontSize: 34,
          fontWeight: 700,
          fontFamily: 'Georgia, serif',
          letterSpacing: '0.03em',
          marginTop: 4,
          textShadow: '0 3px 14px rgba(12, 18, 26, 0.92)',
        }}
      >
        {location}
      </div>
    </div>
  );
};

export const DiegeticCallout: React.FC<{
  anchorX: number;
  anchorY: number;
  labelX: number;
  labelY: number;
  title: string;
  detail?: string;
  align?: 'left' | 'right';
  accent?: string;
  opacity?: number;
}> = ({
  anchorX,
  anchorY,
  labelX,
  labelY,
  title,
  detail,
  align = 'left',
  accent = '#E8B85C',
  opacity = 1,
}) => {
  const op = clamp(opacity, 0, 1);
  if (op <= 0.02) return null;
  const elbowX = align === 'left' ? labelX - 16 : labelX + 16;
  const textAnchor = align === 'left' ? 'start' : 'end';

  return (
    <g opacity={op}>
      <circle cx={anchorX} cy={anchorY} r={5} fill={accent} stroke="#14202C" strokeWidth={2} />
      <polyline
        points={`${anchorX},${anchorY} ${elbowX},${labelY} ${labelX},${labelY}`}
        fill="none"
        stroke={accent}
        strokeWidth={1.6}
        opacity={0.85}
      />
      <text
        x={labelX + (align === 'left' ? 8 : -8)}
        y={labelY - 5}
        textAnchor={textAnchor}
        fill="#F6EBD4"
        fontFamily="Georgia, serif"
        fontSize={19}
        fontWeight={700}
      >
        {title}
      </text>
      {detail && (
        <text
          x={labelX + (align === 'left' ? 8 : -8)}
          y={labelY + 17}
          textAnchor={textAnchor}
          fill="#A9C4D4"
          fontFamily="system-ui, sans-serif"
          fontSize={14}
          fontWeight={500}
        >
          {detail}
        </text>
      )}
    </g>
  );
};

export const EditorialSubtitle: React.FC<{
  text: string;
  evidenceNote?: string;
  opacity?: number;
  bottomOffset?: number;
}> = ({ text, evidenceNote, opacity = 1, bottomOffset }) => {
  const { width, height } = useVideoConfig();
  const isPortrait = height > width;
  const op = clamp(opacity, 0, 1);
  if (op <= 0.01) return null;

  const resolvedBottom = bottomOffset ?? (isPortrait ? 204 : 36);

  return (
    <div
      style={{
        position: 'absolute',
        left: isPortrait ? 56 : 96,
        right: isPortrait ? 108 : 96,
        bottom: resolvedBottom,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        opacity: op,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          maxWidth: isPortrait ? 900 : 1040,
          padding: isPortrait ? '14px 24px' : '12px 26px',
          borderRadius: 10,
          background: 'linear-gradient(180deg, rgba(16, 17, 22, 0.72) 0%, rgba(16, 17, 22, 0.84) 100%)',
          color: '#F6EEDB',
          fontSize: isPortrait ? 33 : 26,
          lineHeight: 1.38,
          textAlign: 'center',
          whiteSpace: 'pre-line',
          fontFamily: "Georgia, 'Times New Roman', serif",
          textShadow: '0 2px 10px rgba(10, 11, 16, 0.9)',
        }}
      >
        {text}
      </div>
      {evidenceNote && (
        <div
          style={{
            color: '#BFC9CE',
            fontSize: isPortrait ? 14.5 : 13,
            textAlign: 'center',
            fontFamily: 'system-ui, sans-serif',
            letterSpacing: '0.03em',
            textShadow: '0 1px 6px rgba(10, 12, 16, 0.95)',
          }}
        >
          {evidenceNote}
        </div>
      )}
    </div>
  );
};
