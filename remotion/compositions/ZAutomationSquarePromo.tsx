import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Series,
  Img,
  Audio,
  staticFile,
} from 'remotion';

interface ZAutomationSquarePromoProps {
  headline?: string;
  subheadline?: string;
  domain?: string;
  audioSrc?: string;
}

export const ZAutomationSquarePromo: React.FC<ZAutomationSquarePromoProps> = ({
  headline = 'REKAYASA WEB 3D & AGEN AI OTONOM',
  subheadline = 'Bukan sekadar website biasa. Kami membangun pengalaman interaktif & agen cerdas.',
  domain = 'z-automation.my.id',
  audioSrc = '',
}) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#07090e',
        color: '#ffffff',
        fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
        overflow: 'hidden',
      }}
    >
      {/* 1. Dynamic Background & Grid */}
      <BackgroundGlow />

      {/* 2. Lemo-Opuscar Cyber Telemetry */}
      <SquareTelemetryOverlay />

      {/* 3. Scenes */}
      <Series>
        {/* Scene 1: Hook / Intro (0-60 frames / 2.0s) */}
        <Series.Sequence durationInFrames={60}>
          <HookScene headline={headline} />
        </Series.Sequence>

        {/* Scene 2: 3D Characters Showcase (60-135 frames / 2.5s) */}
        <Series.Sequence durationInFrames={75}>
          <CharacterScene subheadline={subheadline} />
        </Series.Sequence>

        {/* Scene 3: Launching CTA (135-180 frames / 1.5s) */}
        <Series.Sequence durationInFrames={45}>
          <SquareCtaScene domain={domain} />
        </Series.Sequence>
      </Series>

      {/* 4. Audio Voiceover */}
      {audioSrc ? <Audio src={staticFile(audioSrc)} volume={1} /> : null}
    </AbsoluteFill>
  );
};

const BackgroundGlow: React.FC = () => {
  const frame = useCurrentFrame();
  const rotate = frame * 0.3;

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          left: '-15%',
          width: '130%',
          height: '130%',
          background:
            'radial-gradient(circle at 50% 50%, rgba(0, 240, 255, 0.20) 0%, rgba(26, 47, 251, 0.08) 40%, transparent 70%)',
          transform: `rotate(${rotate}deg)`,
        }}
      />
      {/* Grid Pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(0, 240, 255, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
    </AbsoluteFill>
  );
};

const SquareTelemetryOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const ringRotate = frame * 0.6;

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', padding: 40 }}>
      {/* Rotating Cyber Ring */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 580,
          height: 580,
          marginLeft: -290,
          marginTop: -290,
          borderRadius: '50%',
          border: '1px dashed rgba(0, 240, 255, 0.15)',
          transform: `rotate(${ringRotate}deg)`,
        }}
      />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 16,
          fontFamily: 'monospace',
          color: 'rgba(0, 240, 255, 0.6)',
          letterSpacing: '0.15em',
        }}
      >
        <span>[ Z-STUDIO // OPUSCAR ]</span>
        <span>REC ● 60FPS</span>
      </div>
    </AbsoluteFill>
  );
};

const HookScene: React.FC<{ headline: string }> = ({ headline }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8, stiffness: 90 },
  });

  const opacity = interpolate(frame, [0, 15], [0, 1], {
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
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 20px',
          borderRadius: 9999,
          background: 'rgba(0, 240, 255, 0.1)',
          border: '1px solid rgba(0, 240, 255, 0.3)',
          color: '#00f0ff',
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: '0.15em',
          marginBottom: 30,
          opacity,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: '#00f0ff',
            boxShadow: '0 0 10px #00f0ff',
          }}
        />
        OFFICIAL LAUNCHING 2026
      </div>

      <h1
        style={{
          fontSize: 54,
          lineHeight: 1.15,
          fontWeight: 900,
          letterSpacing: '-0.02em',
          maxWidth: 900,
          transform: `scale(${scale})`,
          opacity,
          background: 'linear-gradient(180deg, #ffffff 30%, #94a3b8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: 0,
        }}
      >
        {headline}
      </h1>
    </AbsoluteFill>
  );
};

const CharacterScene: React.FC<{ subheadline: string }> = ({ subheadline }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const floatY = Math.sin((frame / fps) * 3) * 12;
  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        padding: 50,
        textAlign: 'center',
        opacity,
      }}
    >
      <div
        style={{
          width: 720,
          height: 420,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          transform: `translateY(${floatY}px)`,
          marginBottom: 30,
        }}
      >
        <Img
          src={staticFile('assets/carousel-ig/cutout-hermes-openclaw.png')}
          style={{
            maxHeight: '100%',
            maxWidth: '100%',
            objectFit: 'contain',
            filter: 'drop-shadow(0 25px 50px rgba(0, 240, 255, 0.45))',
          }}
        />
      </div>

      <p
        style={{
          fontSize: 24,
          lineHeight: 1.4,
          color: '#cbd5e1',
          maxWidth: 780,
          margin: 0,
          fontWeight: 500,
        }}
      >
        {subheadline}
      </p>
    </AbsoluteFill>
  );
};

const SquareCtaScene: React.FC<{ domain: string }> = ({ domain }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pop = spring({
    frame,
    fps,
    config: { damping: 10, mass: 0.6, stiffness: 120 },
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
      <h2
        style={{
          fontSize: 32,
          fontWeight: 700,
          color: '#94a3b8',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: 24,
        }}
      >
        Kunjungi Sekarang
      </h2>

      <div
        style={{
          transform: `scale(${pop})`,
          padding: '20px 48px',
          borderRadius: 24,
          background: 'linear-gradient(135deg, #00f0ff 0%, #0070f3 100%)',
          color: '#05070f',
          fontSize: 38,
          fontWeight: 900,
          letterSpacing: '-0.01em',
          boxShadow: '0 0 50px rgba(0, 240, 255, 0.45)',
        }}
      >
        {domain}
      </div>

      <p
        style={{
          marginTop: 28,
          fontSize: 20,
          color: '#64748b',
          fontWeight: 500,
        }}
      >
        Link di Bio • Jadwalkan Diskusi Proyek Anda
      </p>
    </AbsoluteFill>
  );
};
