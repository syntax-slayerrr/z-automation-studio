import React from 'react';
import {
  Audio,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import { BlackHoleVortex } from './BlackHoleVortex';
import { KineticTypography } from './KineticTypography';
import { PerseusEqualizer } from './PerseusEqualizer';
import { TimeClockBubble } from './TimeClockBubble';
import { VectorAstro } from './VectorAstro';

export const KurzgesagtBlackHole: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        width: 1080,
        height: 1920,
        position: 'relative',
        backgroundColor: '#080614',
        overflow: 'hidden',
        fontFamily: 'Poppins, system-ui, sans-serif',
      }}
    >
      {/* Dynamic Starfield Background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 35%, #180D35 0%, #090514 65%, #030208 100%)',
        }}
      />

      {/* Floating Space Dust Particles */}
      {Array.from({ length: 30 }).map((_, i) => {
        const x = (i * 97) % 1080;
        const speed = 0.5 + (i % 3) * 0.4;
        const y = (frame * speed + i * 80) % 1920;
        const pSize = 2 + (i % 3);
        const opacity = 0.2 + ((i % 5) * 0.15);

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: pSize,
              height: pSize,
              borderRadius: '50%',
              backgroundColor: i % 2 === 0 ? '#FFE600' : '#00E5FF',
              opacity,
              boxShadow: '0 0 6px rgba(255, 230, 0, 0.6)',
            }}
          />
        );
      })}

      {/* =========================================================================
          SCENE 1: Everest shrinking into a tiny black hole dot (Frames 0 - 403)
      ========================================================================= */}
      <Sequence from={0} durationInFrames={404}>
        {(() => {
          const sFrame = frame;
          const mountainScale = interpolate(sFrame, [0, 180, 260], [1, 0.4, 0.02], {
            extrapolateRight: 'clamp',
          });
          const dotGlow = interpolate(sFrame, [250, 290, 400], [0, 1, 0.8]);

          return (
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              {/* Center Mountain Graphics */}
              <div
                style={{
                  position: 'absolute',
                  top: '40%',
                  left: '50%',
                  transform: `translate(-50%, -50%) scale(${mountainScale})`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <svg width="600" height="500" viewBox="0 0 600 500">
                  <defs>
                    <linearGradient id="mtGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#C084FC" />
                      <stop offset="50%" stopColor="#6366F1" />
                      <stop offset="100%" stopColor="#1E1B4B" />
                    </linearGradient>
                  </defs>
                  {/* Geometric Crystal Mountain */}
                  <polygon points="300,40 480,440 120,440" fill="url(#mtGrad)" stroke="#E0E7FF" strokeWidth="6" />
                  <polygon points="300,40 380,220 300,440" fill="#818CF8" opacity="0.6" />
                  <polygon points="300,40 220,220 300,440" fill="#4338CA" opacity="0.8" />
                  {/* Snow Peak */}
                  <polygon points="300,40 345,140 255,140" fill="#FFFFFF" />
                </svg>
              </div>

              {/* Compressed Golden Black Hole Dot */}
              {sFrame > 240 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '40%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: '#FFE600',
                    boxShadow: '0 0 50px 25px #FF6B00, 0 0 100px 50px #FF0055',
                    opacity: dotGlow,
                  }}
                />
              )}

              {/* Kinetic Captions */}
              <div style={{ position: 'absolute', bottom: 280, left: 0, right: 0 }}>
                {sFrame < 195 ? (
                  <KineticTypography
                    badgeLabel="Fakta Lubang Hitam #1"
                    mainText="Bayangkan gunung sebesar"
                    highlightText="Everest,"
                    accentColor="#FFC93C"
                  />
                ) : (
                  <KineticTypography
                    badgeLabel="Fakta Lubang Hitam #1"
                    mainText="Dipadatkan sekecil"
                    highlightText="sebutir pasir!"
                    subText="Itulah kerapatan ekstrem lubang hitam!"
                    accentColor="#00E5FF"
                  />
                )}
              </div>
            </div>
          );
        })()}
      </Sequence>

      {/* =========================================================================
          SCENE 2: The Fierce Gravity & Accretion Disk (Frames 404 - 686)
      ========================================================================= */}
      <Sequence from={404} durationInFrames={283}>
        {(() => {
          const sFrame = frame - 404;

          return (
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              {/* Rotating Accretion Disk */}
              <div style={{ position: 'absolute', top: '38%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                <BlackHoleVortex size={740} intensity={1.2} />
              </div>

              {/* Kinetic Captions */}
              <div style={{ position: 'absolute', bottom: 280, left: 0, right: 0 }}>
                {sFrame < 135 ? (
                  <KineticTypography
                    badgeLabel="Gravitasi Monster"
                    mainText="Gravitasinya sangat"
                    highlightText="BUAS!"
                    accentColor="#FF5500"
                  />
                ) : (
                  <KineticTypography
                    badgeLabel="Kecepatan Cahaya"
                    mainText="Cahaya paling cepat pun..."
                    highlightText="Gak bisa kabur!"
                    subText="Kecepatan lepas melebihi 300.000 km/detik"
                    accentColor="#FFE600"
                  />
                )}
              </div>
            </div>
          );
        })()}
      </Sequence>

      {/* =========================================================================
          SCENE 3: Spaghettification Effect (Frames 687 - 1090)
      ========================================================================= */}
      <Sequence from={687} durationInFrames={404}>
        {(() => {
          const sFrame = frame - 687;
          const stretch = interpolate(sFrame, [20, 220], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          return (
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              {/* Lower Abyss Portal */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 120,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 500,
                  height: 120,
                  borderRadius: '50%',
                  background: 'radial-gradient(ellipse, #1E0044 0%, #000000 70%)',
                  border: '3px solid #8B5CF6',
                  boxShadow: '0 0 60px #8B5CF6',
                }}
              />

              {/* Astro Stretching Into Spaghetifikasi */}
              <div style={{ position: 'absolute', top: '22%', left: '50%', transform: 'translateX(-50%)' }}>
                <VectorAstro size={460} mood="shock" spaghettiStretch={stretch} />
              </div>

              {/* Kinetic Captions */}
              <div style={{ position: 'absolute', bottom: 280, left: 0, right: 0 }}>
                {sFrame < 190 ? (
                  <KineticTypography
                    badgeLabel="Fisika Ekstrem"
                    mainText="Tubuhmu bakal ditarik"
                    highlightText="MELAR!"
                    accentColor="#FF4D4D"
                  />
                ) : (
                  <KineticTypography
                    badgeLabel="Spaghetifikasi"
                    mainText="Seperti mie instan:"
                    highlightText="Spaghetifikasi!"
                    subText="Perbedaan gravitasi kaki dan kepala mencapai jutaan g"
                    accentColor="#FFC93C"
                  />
                )}
              </div>
            </div>
          );
        })()}
      </Sequence>

      {/* =========================================================================
          SCENE 4: Time Dilation & Frozen Clocks (Frames 1091 - 1357)
      ========================================================================= */}
      <Sequence from={1091} durationInFrames={267}>
        {(() => {
          const sFrame = frame - 1091;

          return (
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              {/* Time Clock Bubble Container */}
              <div style={{ position: 'absolute', top: '36%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                <TimeClockBubble size={720} />
              </div>

              {/* Astro Suspended Peaceful Inside Time Bubble */}
              <div style={{ position: 'absolute', top: '27%', left: '50%', transform: 'translateX(-50%)' }}>
                <VectorAstro size={360} mood="sleeping" />
              </div>

              {/* Kinetic Captions */}
              <div style={{ position: 'absolute', bottom: 280, left: 0, right: 0 }}>
                {sFrame < 130 ? (
                  <KineticTypography
                    badgeLabel="Relativitas Einstein"
                    mainText="Waktu di sekitarmu"
                    highlightText="Melambat drastis!"
                    accentColor="#00E5FF"
                  />
                ) : (
                  <KineticTypography
                    badgeLabel="Event Horizon"
                    mainText="Dari luar, kamu tampak"
                    highlightText="Membeku selamanya."
                    subText="Dilatasi waktu gravitasi menuju tak terhingga"
                    accentColor="#A78BFA"
                  />
                )}
              </div>
            </div>
          );
        })()}
      </Sequence>

      {/* =========================================================================
          SCENE 5: Acoustic Perseus Soundwaves (Frames 1358 - 1664)
      ========================================================================= */}
      <Sequence from={1358} durationInFrames={307}>
        {(() => {
          const sFrame = frame - 1358;

          return (
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              {/* Concentric Equalizer Ripples */}
              <div style={{ position: 'absolute', top: '38%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                <PerseusEqualizer size={720} />
              </div>

              {/* Kinetic Captions */}
              <div style={{ position: 'absolute', bottom: 280, left: 0, right: 0 }}>
                {sFrame < 130 ? (
                  <KineticTypography
                    badgeLabel="Akustik Luar Angkasa"
                    mainText="NASA merekam"
                    highlightText="Suara Lubang Hitam!"
                    accentColor="#EC4899"
                  />
                ) : (
                  <KineticTypography
                    badgeLabel="Perseus Black Hole"
                    mainText="Dengungan nada"
                    highlightText="B-Flat Terendah"
                    subText="57 oktaf di bawah nada tengah piano"
                    accentColor="#06B6D4"
                  />
                )}
              </div>
            </div>
          );
        })()}
      </Sequence>

      {/* =========================================================================
          SCENE 6: Astro CTA & Outro (Frames 1665 - 1958)
      ========================================================================= */}
      <Sequence from={1665} durationInFrames={294}>
        {(() => {
          const sFrame = frame - 1665;

          return (
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              {/* Miniature Pet Black Hole Portal */}
              <div style={{ position: 'absolute', top: '30%', right: '8%', transform: 'translateY(-50%)' }}>
                <BlackHoleVortex size={340} intensity={0.9} pullParticles={false} />
              </div>

              {/* Astro Giving Thumbs Up on Neon Platform */}
              <div style={{ position: 'absolute', top: '24%', left: '32%', transform: 'translateX(-50%)' }}>
                <VectorAstro size={440} mood="happy" waving={true} />
              </div>

              {/* Kinetic Captions & CTA */}
              <div style={{ position: 'absolute', bottom: 280, left: 0, right: 0 }}>
                {sFrame < 130 ? (
                  <KineticTypography
                    badgeLabel="Misteri Terbesar"
                    mainText="Kalau ada pintu rahasia..."
                    highlightText="Ke lubang hitam?"
                    accentColor="#FFE600"
                  />
                ) : (
                  <KineticTypography
                    badgeLabel="Tulis Pendapatmu!"
                    mainText="Kamu berani"
                    highlightText="MASUK GAK?"
                    subText="Drop jawabanmu di kolom komentar!"
                    accentColor="#22C55E"
                  />
                )}
              </div>
            </div>
          );
        })()}
      </Sequence>

      {/* =========================================================================
          AUDIO TRACKS (Master Voice + Ambient Bed)
      ========================================================================= */}
      <Audio src={staticFile('assets/audio/kurzgesagt/master_voice.wav')} volume={1.0} />
      <Audio src={staticFile('assets/audio/kurzgesagt/ambient_bed.mp3')} volume={0.16} loop />
    </div>
  );
};

