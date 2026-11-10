import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

interface KineticTypographyProps {
  mainText: string;
  highlightText?: string;
  subText?: string;
  accentColor?: string;
  badgeLabel?: string;
}

export const KineticTypography: React.FC<KineticTypographyProps> = ({
  mainText,
  highlightText,
  subText,
  accentColor = '#FFC93C',
  badgeLabel,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring animation
  const spr = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 120, mass: 0.8 },
  });

  const scale = interpolate(spr, [0, 1], [0.85, 1]);
  const opacity = interpolate(spr, [0, 0.4, 1], [0, 1, 1]);
  const translateY = interpolate(spr, [0, 1], [40, 0]);

  // Highlighter brush wipe animation (starts slightly after pop-in)
  const wipeProgress = interpolate(frame, [8, 24], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '24px 36px',
        borderRadius: 24,
        background: 'rgba(15, 15, 28, 0.82)',
        border: '2px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 20px 48px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(16px)',
        transform: `translateY(${translateY}px) scale(${scale})`,
        opacity,
        maxWidth: 900,
        margin: '0 auto',
      }}
    >
      {badgeLabel && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '6px 16px',
            borderRadius: 999,
            background: `${accentColor}25`,
            border: `1.5px solid ${accentColor}`,
            color: accentColor,
            fontSize: 22,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: 2,
            marginBottom: 14,
            boxShadow: `0 0 16px ${accentColor}40`,
          }}
        >
          {badgeLabel}
        </div>
      )}

      {/* Main Text with Optional Kinetic Highlighter */}
      <div
        style={{
          fontFamily: 'Poppins, system-ui, sans-serif',
          fontSize: 48,
          fontWeight: 800,
          color: '#FAF7F2',
          lineHeight: 1.25,
          letterSpacing: -0.5,
        }}
      >
        {mainText}{' '}
        {highlightText && (
          <span
            style={{
              position: 'relative',
              display: 'inline-block',
              color: '#0D0D15',
              padding: '2px 14px',
              borderRadius: 12,
              fontWeight: 900,
            }}
          >
            {/* Background Highlighter Fill */}
            <span
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                width: `${wipeProgress}%`,
                background: accentColor,
                borderRadius: 10,
                zIndex: -1,
                boxShadow: `0 4px 20px ${accentColor}66`,
              }}
            />
            {highlightText}
          </span>
        )}
      </div>

      {subText && (
        <div
          style={{
            fontFamily: 'Poppins, system-ui, sans-serif',
            fontSize: 30,
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.75)',
            marginTop: 12,
            lineHeight: 1.3,
          }}
        >
          {subText}
        </div>
      )}
    </div>
  );
};

