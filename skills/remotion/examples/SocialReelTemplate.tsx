import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Series,
} from 'remotion';

interface SocialReelProps {
  title: string;
  tagline: string;
  accentColor?: string;
}

export const SocialReelTemplate: React.FC<SocialReelProps> = ({
  title = 'Rekayasa Web 3D & Agen AI',
  tagline = 'Z-Automation • Masa Depan Digital',
  accentColor = '#00f0ff',
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#090a10', color: '#ffffff', fontFamily: 'sans-serif' }}>
      <Series>
        {/* Scene 1: Hook & Intro (0-60 frames / 2 sec) */}
        <Series.Sequence durationInFrames={60}>
          <HookScene title={title} accentColor={accentColor} />
        </Series.Sequence>

        {/* Scene 2: Value Proposition (60-120 frames / 2 sec) */}
        <Series.Sequence durationInFrames={60}>
          <ValueScene tagline={tagline} accentColor={accentColor} />
        </Series.Sequence>

        {/* Scene 3: Call to Action (120-180 frames / 2 sec) */}
        <Series.Sequence durationInFrames={60}>
          <CtaScene accentColor={accentColor} />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};

const HookScene: React.FC<{ title: string; accentColor: string }> = ({ title, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({
    frame,
    fps,
    config: { damping: 12, mass: 0.6, stiffness: 120 },
  });

  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: 80, textAlign: 'center' }}>
      <div
        style={{
          fontSize: 32,
          fontWeight: 700,
          color: accentColor,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          marginBottom: 24,
          opacity,
        }}
      >
        Launching 2026
      </div>
      <h1
        style={{
          fontSize: 72,
          lineHeight: 1.15,
          fontWeight: 900,
          transform: `scale(${titleScale})`,
          opacity,
          maxWidth: 900,
        }}
      >
        {title}
      </h1>
    </AbsoluteFill>
  );
};

const ValueScene: React.FC<{ tagline: string; accentColor: string }> = ({ tagline, accentColor }) => {
  const frame = useCurrentFrame();
  const translateY = interpolate(frame, [0, 20], [60, 0], {
    extrapolateRight: 'clamp',
  });
  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: 80, textAlign: 'center' }}>
      <p
        style={{
          fontSize: 52,
          lineHeight: 1.3,
          fontWeight: 600,
          color: '#f0f1fa',
          transform: `translateY(${translateY}px)`,
          opacity,
          maxWidth: 850,
        }}
      >
        {tagline}
      </p>
    </AbsoluteFill>
  );
};

const CtaScene: React.FC<{ accentColor: string }> = ({ accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const buttonScale = spring({
    frame,
    fps,
    config: { damping: 10, mass: 0.5, stiffness: 150 },
  });

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: 80, textAlign: 'center' }}>
      <div
        style={{
          background: `linear-gradient(135deg, ${accentColor}, #0077ff)`,
          padding: '28px 64px',
          borderRadius: 999,
          color: '#000000',
          fontSize: 44,
          fontWeight: 800,
          transform: `scale(${buttonScale})`,
          boxShadow: `0 20px 60px ${accentColor}44`,
        }}
      >
        Eksplorasi Sekarang ➔
      </div>
      <div style={{ marginTop: 32, fontSize: 32, color: '#888', letterSpacing: '0.05em' }}>
        z-automation.my.id
      </div>
    </AbsoluteFill>
  );
};

