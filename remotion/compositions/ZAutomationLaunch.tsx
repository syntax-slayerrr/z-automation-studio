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

interface ZAutomationLaunchProps {
  title?: string;
  tagline?: string;
  domain?: string;
  audioSrc?: string;
}

export const ZAutomationLaunch: React.FC<ZAutomationLaunchProps> = ({
  title = 'Z-AUTOMATION',
  tagline = 'Rekayasa Web 3D & Solusi Agen AI Otonom',
  domain = 'z-automation.my.id',
  audioSrc = '',
}) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#06080e',
        color: '#ffffff',
        fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        overflow: 'hidden',
      }}
    >
      {/* 1. Background Ambient Glow & Cyber Grid */}
      <AmbientBackground />

      {/* 2. Lemo-Opuscar Sci-Fi Hologram HUD Elements */}
      <HologramHudOverlay />

      {/* 3. Narrative Story Scenes */}
      <Series>
        {/* Scene 1: Brand Reveal (0-70 frames / 2.3s) */}
        <Series.Sequence durationInFrames={70}>
          <BrandScene title={title} />
        </Series.Sequence>

        {/* Scene 2: 3D Characters & Core Value (70-150 frames / 2.7s) */}
        <Series.Sequence durationInFrames={80}>
          <CharactersScene tagline={tagline} />
        </Series.Sequence>

        {/* Scene 3: High-Impact Launching CTA (150-210 frames / 2.0s) */}
        <Series.Sequence durationInFrames={60}>
          <CtaScene domain={domain} />
        </Series.Sequence>
      </Series>

      {/* 4. VoiceStudio Voiceover Audio Integration */}
      {audioSrc ? <Audio src={staticFile(audioSrc)} volume={1} /> : null}
    </AbsoluteFill>
  );
};

/* --- Lemo-Opuscar Inspired Hologram HUD & Cyber Elements --- */

const AmbientBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const rotate = frame * 0.25;

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          top: '-25%',
          left: '-25%',
          width: '150%',
          height: '150%',
          background:
            'radial-gradient(circle at 50% 50%, rgba(0, 240, 255, 0.22) 0%, rgba(10, 25, 80, 0.15) 35%, transparent 65%)',
          transform: `rotate(${rotate}deg)`,
        }}
      />
      {/* Precision Grid lines */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(0, 240, 255, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
      {/* Subtle Scanline Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0, 0, 0, 0.25) 4px)',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};

const HologramHudOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const ringRotate = frame * 0.8;
  const pulse = Math.sin(frame * 0.1) * 0.15 + 0.85;

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', padding: 60 }}>
      {/* Top Header Telemetry */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(0, 240, 255, 0.2)',
          paddingBottom: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: '#00f0ff',
              boxShadow: '0 0 12px #00f0ff',
              opacity: pulse,
            }}
          />
          <span
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: '0.25em',
              color: '#00f0ff',
              fontFamily: 'monospace',
            }}
          >
            SYS.RUNNING // 2026.V2
          </span>
        </div>
        <span
          style={{
            fontSize: 20,
            letterSpacing: '0.15em',
            color: 'rgba(255, 255, 255, 0.5)',
            fontFamily: 'monospace',
          }}
        >
          FRAME {String(frame).padStart(4, '0')}
        </span>
      </div>

      {/* Floating Rotating HUD Ring in Background */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 820,
          height: 820,
          marginLeft: -410,
          marginTop: -410,
          borderRadius: '50%',
          border: '1px dashed rgba(0, 240, 255, 0.2)',
          transform: `rotate(${ringRotate}deg)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 760,
          height: 760,
          marginLeft: -380,
          marginTop: -380,
          borderRadius: '50%',
          border: '1px solid rgba(0, 240, 255, 0.08)',
          transform: `rotate(${-ringRotate * 0.5}deg)`,
        }}
      />

      {/* Four Tech Corner Brackets */}
      <div
        style={{
          position: 'absolute',
          top: 80,
          left: 60,
          fontSize: 28,
          color: 'rgba(0, 240, 255, 0.4)',
          fontFamily: 'monospace',
        }}
      >
        ┌── [ HUD.INIT ]
      </div>
      <div
        style={{
          position: 'absolute',
          top: 80,
          right: 60,
          fontSize: 28,
          color: 'rgba(0, 240, 255, 0.4)',
          fontFamily: 'monospace',
        }}
      >
        [ 60 FPS ] ──┐
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          left: 60,
          fontSize: 28,
          color: 'rgba(0, 240, 255, 0.4)',
          fontFamily: 'monospace',
        }}
      >
        └── [ WEBGL.RENDER ]
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          right: 60,
          fontSize: 28,
          color: 'rgba(0, 240, 255, 0.4)',
          fontFamily: 'monospace',
        }}
      >
        [ SECURE.NODE ] ──┘
      </div>
    </AbsoluteFill>
  );
};

/* --- Scenes --- */

const BrandScene: React.FC<{ title: string }> = ({ title }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8, stiffness: 90 },
  });

  const opacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        padding: 80,
        textAlign: 'center',
        opacity,
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 32px',
          borderRadius: 9999,
          background: 'rgba(0, 240, 255, 0.08)',
          border: '1px solid rgba(0, 240, 255, 0.3)',
          color: '#00f0ff',
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: '0.2em',
          marginBottom: 40,
        }}
      >
        ✦ NEXT-GEN DIGITAL STUDIO ✦
      </div>

      <h1
        style={{
          fontSize: 98,
          fontWeight: 900,
          letterSpacing: '-0.03em',
          lineHeight: 1.05,
          margin: 0,
          transform: `scale(${scale})`,
          background: 'linear-gradient(180deg, #ffffff 40%, #7d889b 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 0 80px rgba(0, 240, 255, 0.3)',
        }}
      >
        {title}
      </h1>

      <p
        style={{
          marginTop: 36,
          fontSize: 32,
          letterSpacing: '0.05em',
          color: '#94a3b8',
          maxWidth: 820,
          lineHeight: 1.4,
        }}
      >
        Menghadirkan era baru rekayasa visual interaktif dan kecerdasan buatan otonom.
      </p>
    </AbsoluteFill>
  );
};

const CharactersScene: React.FC<{ tagline: string }> = ({ tagline }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const floatY = Math.sin((frame / fps) * 3) * 16;
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
        opacity,
      }}
    >
      {/* Hermes & OpenClaw Floating Visual */}
      <div
        style={{
          width: 780,
          height: 480,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          transform: `translateY(${floatY}px)`,
          marginBottom: 40,
        }}
      >
        <Img
          src={staticFile('assets/carousel-ig/cutout-hermes-openclaw.png')}
          style={{
            maxHeight: '100%',
            maxWidth: '100%',
            objectFit: 'contain',
            filter: 'drop-shadow(0 30px 60px rgba(0, 240, 255, 0.45))',
          }}
        />
      </div>

      <div
        style={{
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(0, 240, 255, 0.25)',
          backdropFilter: 'blur(16px)',
          borderRadius: 24,
          padding: '32px 48px',
          maxWidth: 900,
        }}
      >
        <h2
          style={{
            fontSize: 42,
            fontWeight: 800,
            margin: '0 0 16px 0',
            color: '#ffffff',
            letterSpacing: '-0.01em',
          }}
        >
          {tagline}
        </h2>
        <p
          style={{
            fontSize: 26,
            lineHeight: 1.5,
            color: '#94a3b8',
            margin: 0,
          }}
        >
          Bukan sekadar website brosur statis. Kami membangun sistem 3D WebGL yang memukau dan agen cerdas seperti Hermes untuk otomatisasi bisnis Anda.
        </p>
      </div>
    </AbsoluteFill>
  );
};

const CtaScene: React.FC<{ domain: string }> = ({ domain }) => {
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
        padding: 80,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 32,
          fontWeight: 700,
          color: '#00f0ff',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          marginBottom: 32,
          fontFamily: 'monospace',
        }}
      >
        ✦ TRANSFORMASI SEKARANG ✦
      </div>

      <div
        style={{
          transform: `scale(${pop})`,
          padding: '28px 64px',
          borderRadius: 30,
          background: 'linear-gradient(135deg, #00f0ff 0%, #0066ff 100%)',
          color: '#05070e',
          fontSize: 52,
          fontWeight: 900,
          letterSpacing: '-0.02em',
          boxShadow: '0 0 70px rgba(0, 240, 255, 0.55)',
          marginBottom: 36,
        }}
      >
        {domain}
      </div>

      <p
        style={{
          fontSize: 28,
          color: '#94a3b8',
          margin: 0,
          fontWeight: 500,
        }}
      >
        Kunjungi Website • Hubungi Kami untuk Diskusi Proyek
      </p>
    </AbsoluteFill>
  );
};
