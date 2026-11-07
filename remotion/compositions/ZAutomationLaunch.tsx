import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Series,
} from 'remotion';

interface ZAutomationLaunchProps {
  title?: string;
  tagline?: string;
  domain?: string;
}

export const ZAutomationLaunch: React.FC<ZAutomationLaunchProps> = ({
  title = 'Z-AUTOMATION',
  tagline = 'Rekayasa Web 3D & Solusi Agen AI Otonom',
  domain = 'z-automation.my.id',
}) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#090a10',
        color: '#ffffff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* Background Ambient Glow */}
      <AmbientBackground />

      <Series>
        {/* Scene 1: Brand Reveal (0-75 frames / 2.5s) */}
        <Series.Sequence durationInFrames={75}>
          <BrandScene title={title} />
        </Series.Sequence>

        {/* Scene 2: Core Offer (75-150 frames / 2.5s) */}
        <Series.Sequence durationInFrames={75}>
          <OfferScene tagline={tagline} />
        </Series.Sequence>

        {/* Scene 3: Launching CTA (150-210 frames / 2s) */}
        <Series.Sequence durationInFrames={60}>
          <CtaScene domain={domain} />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};

const AmbientBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const rotate = frame * 0.4;

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          left: '-20%',
          width: '140%',
          height: '140%',
          background:
            'radial-gradient(circle at 50% 50%, rgba(0, 240, 255, 0.15) 0%, rgba(26, 47, 251, 0.08) 35%, transparent 70%)',
          transform: `rotate(${rotate}deg)`,
        }}
      />
    </AbsoluteFill>
  );
};

const BrandScene: React.FC<{ title: string }> = ({ title }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: { damping: 12, mass: 0.7, stiffness: 100 },
  });

  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        padding: 60,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 28,
          letterSpacing: '0.25em',
          fontWeight: 700,
          color: '#00f0ff',
          marginBottom: 24,
          opacity,
          textTransform: 'uppercase',
        }}
      >
        ✦ Studio Peluncuran ✦
      </div>
      <h1
        style={{
          fontSize: 84,
          fontWeight: 900,
          letterSpacing: '-0.03em',
          lineHeight: 1.05,
          margin: 0,
          transform: `scale(${scale})`,
          opacity,
          background: 'linear-gradient(180deg, #ffffff 0%, #a0a5c0 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        {title}
      </h1>
    </AbsoluteFill>
  );
};

const OfferScene: React.FC<{ tagline: string }> = ({ tagline }) => {
  const frame = useCurrentFrame();
  const translateY = interpolate(frame, [0, 25], [80, 0], {
    extrapolateRight: 'clamp',
  });
  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        padding: 80,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 80,
          height: 4,
          backgroundColor: '#00f0ff',
          marginBottom: 36,
          borderRadius: 2,
          opacity,
        }}
      />
      <p
        style={{
          fontSize: 54,
          fontWeight: 700,
          lineHeight: 1.25,
          color: '#f0f1fa',
          transform: `translateY(${translateY}px)`,
          opacity,
          maxWidth: 900,
        }}
      >
        {tagline}
      </p>
    </AbsoluteFill>
  );
};

const CtaScene: React.FC<{ domain: string }> = ({ domain }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const buttonScale = spring({
    frame,
    fps,
    config: { damping: 10, mass: 0.5, stiffness: 140 },
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        padding: 60,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #00f0ff 0%, #1a2ffb 100%)',
          color: '#000000',
          padding: '24px 60px',
          borderRadius: 999,
          fontSize: 40,
          fontWeight: 800,
          transform: `scale(${buttonScale})`,
          boxShadow: '0 20px 60px rgba(0, 240, 255, 0.35)',
        }}
      >
        Kunjungi Sekarang ➔
      </div>
      <div
        style={{
          marginTop: 36,
          fontSize: 32,
          fontWeight: 600,
          color: '#9aa0b8',
          letterSpacing: '0.08em',
        }}
      >
        {domain}
      </div>
    </AbsoluteFill>
  );
};

