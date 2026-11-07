import React from 'react';
import {
  AbsoluteFill,
  Audio,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { HermesOpenClaw3DStage } from '../components/HermesOpenClaw3DStage';

export interface ZAutomationLaunchProps {
  title: string;
  tagline: string;
  domain: string;
  audioSrc?: string;
}

const BPM = 128;
const BEAT = 60 / BPM; // 0.46875s

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**
 * Analytical underdamped harmonic spring (Barty-Bart / Apple physical curve)
 */
function dampedSpring(dt: number, w = 15, z = 0.8): number {
  if (dt <= 0) return 0;
  if (dt > 2.5) return 1;
  const wd = w * Math.sqrt(Math.max(0.001, 1 - z * z));
  return (
    1 -
    Math.exp(-z * w * dt) *
      (Math.cos(wd * dt) + ((z * w) / wd) * Math.sin(wd * dt))
  );
}

/**
 * Word-level invisible clip-mask with Variable Font Weight Morph (200 -> 800)
 */
const ClipWord: React.FC<{
  text: string;
  t: number;
  start: number;
  fontSize?: number;
  color?: string;
  targetWeight?: number;
  italicSerif?: boolean;
  accentGradient?: string;
  marginRight?: number;
}> = ({
  text,
  t,
  start,
  fontSize = 78,
  color = '#F5F7FA',
  targetWeight = 800,
  italicSerif = false,
  accentGradient,
  marginRight = 18,
}) => {
  const dt = t - start;
  const prog = dampedSpring(dt, 16, 0.82);
  const rawLin = clamp01(dt / 0.34);
  const yPct = (1 - prog) * 112;
  const opacity = clamp01(dt / 0.12);
  const weight = Math.round(200 + (targetWeight - 200) * smoothstep(0, 1, rawLin));
  const tracking = (1 - smoothstep(0, 1, rawLin)) * 0.14 - 0.03;
  const blurPx = (1 - smoothstep(0, 1, rawLin)) * 7;

  return (
    <span
      style={{
        display: 'inline-block',
        overflow: 'hidden',
        verticalAlign: 'bottom',
        paddingBottom: '0.14em',
        marginBottom: '-0.14em',
        paddingRight: italicSerif ? '0.18em' : '0.04em',
        marginRight: italicSerif ? marginRight - 8 : marginRight,
      }}
    >
      <span
        style={{
          display: 'inline-block',
          transform: `translate3d(0, ${yPct.toFixed(2)}%, 0)`,
          opacity,
          filter: blurPx > 0.2 ? `blur(${blurPx.toFixed(1)}px)` : 'none',
          fontFamily: italicSerif
            ? "'Instrument Serif', Georgia, serif"
            : "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
          fontStyle: italicSerif ? 'italic' : 'normal',
          fontWeight: italicSerif ? 400 : weight,
          fontSize,
          lineHeight: 1.06,
          letterSpacing: italicSerif ? '-0.01em' : `${tracking.toFixed(3)}em`,
          color: accentGradient ? 'transparent' : color,
          backgroundImage: accentGradient || 'none',
          WebkitBackgroundClip: accentGradient ? 'text' : undefined,
          backgroundClip: accentGradient ? 'text' : undefined,
        }}
      >
        {text}
      </span>
    </span>
  );
};

/**
 * Character-by-character staggered reveal in Instrument Serif Italic or Sans
 */
const StaggeredChars: React.FC<{
  text: string;
  t: number;
  start: number;
  charDelay?: number;
  fontSize?: number;
  italicSerif?: boolean;
  color?: string;
  gradient?: string;
}> = ({
  text,
  t,
  start,
  charDelay = 0.018,
  fontSize = 86,
  italicSerif = true,
  color = '#00F5D4',
  gradient,
}) => {
  return (
    <span
      style={{
        display: 'inline-flex',
        overflow: 'hidden',
        verticalAlign: 'bottom',
        paddingBottom: '0.16em',
        marginBottom: '-0.16em',
        paddingRight: italicSerif ? '0.22em' : '0.05em',
      }}
    >
      {text.split('').map((ch, i) => {
        const dt = t - (start + i * charDelay);
        const sp = dampedSpring(dt, 17, 0.8);
        const op = clamp01(dt / 0.1);
        const y = (1 - sp) * 105;
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              whiteSpace: 'pre',
              transform: `translate3d(0, ${y.toFixed(1)}%, 0)`,
              opacity: op,
              fontFamily: italicSerif
                ? "'Instrument Serif', Georgia, serif"
                : "'Plus Jakarta Sans', sans-serif",
              fontStyle: italicSerif ? 'italic' : 'normal',
              fontWeight: italicSerif ? 400 : 800,
              fontSize,
              lineHeight: 1.04,
              letterSpacing: italicSerif ? '0.005em' : '-0.03em',
              color: gradient ? 'transparent' : color,
              backgroundImage: gradient || 'none',
              WebkitBackgroundClip: gradient ? 'text' : undefined,
              backgroundClip: gradient ? 'text' : undefined,
            }}
          >
            {ch}
          </span>
        );
      })}
    </span>
  );
};

export const ZAutomationLaunch: React.FC<ZAutomationLaunchProps> = ({
  domain = 'z-automation.my.id',
  audioSrc = 'assets/audio/masterpiece-128bpm.wav',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // =========================================================================
  // SCENE TIMING & CAMERA WHIP / Z-AXIS ZOOM-THROUGH ENVELOPES
  // =========================================================================
  // Scene 1: 0.00s - 1.875s (Zoom-through at 1.48s - 1.875s)
  const s1ZoomProg = Math.pow(clamp01((t - 1.48) / (1.875 - 1.48)), 2.8);
  const s1Scale = 1 + s1ZoomProg * 15;
  const s1Opacity = t < 1.875 ? 1 - smoothstep(1.68, 1.875, t) : 0;
  const s1Blur = s1ZoomProg * 18;

  // Scene 2: 1.875s - 3.75s (Whip-pan & Dolly Push-In into 3D Glass Stage at 3.25s - 3.85s)
  const s2Enter = dampedSpring(t - 1.875, 14, 0.84);
  const s2Exit = smoothstep(3.25, 3.78, t);
  const s2Opacity =
    t >= 1.75 && t <= 3.85
      ? smoothstep(1.75, 1.95, t) * (1 - smoothstep(3.45, 3.8, t))
      : 0;

  // Scene 3-5: Apple Titanium Glass Stage (Visible from 2.65s as tilted 3D card -> expands full-bleed at 3.75s -> exits at 11.25s via Shockwave Zoom-Through)
  const show3DStage = t >= 2.55 && t <= 11.35;
  const cardRise = dampedSpring(t - 2.6, 12, 0.82);
  const dollyExpand = smoothstep(3.3, 3.95, t);
  const s5ZoomOut = Math.pow(clamp01((t - 10.85) / 0.4), 2.6);

  // Scene 6: Editorial Cream Flip (11.25s - 13.125s)
  const creamEnter = smoothstep(11.05, 11.28, t);
  const creamZoomThrough = Math.pow(clamp01((t - 12.76) / (13.125 - 12.76)), 2.6);
  const creamOpacity =
    t >= 11.0 && t <= 13.2
      ? creamEnter * (1 - smoothstep(12.92, 13.15, t))
      : 0;

  // Scene 7 & 8: Orbital Convergence (13.125s - 14.06s) -> Pure URL Lock (14.06s - 16.00s)
  const s7Active = t >= 13.05;
  const ringConverge = dampedSpring(t - 13.125, 13, 0.78);
  const pillLock = dampedSpring(t - 13.82, 16, 0.78);

  // Seamless Loop Compress at 15.76s -> 16.00s matching Frame 0 laser line
  const loopClose = smoothstep(15.76, 15.98, t);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#06080E',
        overflow: 'hidden',
        fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
      }}
    >
      {/* Google Fonts for Variable Sans + Instrument Serif Italic + JetBrains Mono */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@500;700&family=Plus+Jakarta+Sans:wght@200;300;400;500;600;700;800&display=swap');
        `}
      </style>

      {/* Mastered 128 BPM Soundtrack + Real CC0 SFX */}
      {audioSrc ? <Audio src={staticFile(audioSrc)} volume={1.0} /> : null}

      {/* Ambient Obsidian Studio Radial Glow */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at 50% 42%, rgba(26, 47, 251, 0.14) 0%, rgba(0, 245, 212, 0.06) 34%, rgba(6, 8, 14, 1) 75%)',
        }}
      />

      {/* Subtle Architectural Micro-Grid */}
      <AbsoluteFill
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)',
          backgroundSize: '90px 90px',
          opacity: 0.65,
        }}
      />

      {/* =====================================================================
          SCENE 1: THE IGNITION & HOOK (0.00s - 1.875s)
          ===================================================================== */}
      {s1Opacity > 0.001 && (
        <AbsoluteFill
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            opacity: s1Opacity,
            transform: `scale(${s1Scale.toFixed(3)})`,
            filter: s1Blur > 0.3 ? `blur(${s1Blur.toFixed(1)}px)` : 'none',
          }}
        >
          {/* Opening Horizontal Optical Laser Line (Matches 16.00s loop point) */}
          <div
            style={{
              width: `${Math.min(860, 140 + dampedSpring(t, 18, 0.8) * 720)}px`,
              height: 2,
              background:
                'linear-gradient(90deg, transparent 0%, #00F5D4 25%, #FFFFFF 50%, #00F5D4 75%, transparent 100%)',
              boxShadow: '0 0 24px rgba(0, 245, 212, 0.8)',
              marginBottom: 44,
              opacity: 1 - smoothstep(1.2, 1.55, t),
            }}
          />

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              padding: '0 64px',
            }}
          >
            {/* Line 1: ERA WEB STATIS */}
            <div style={{ marginBottom: 14 }}>
              <ClipWord
                text="ERA"
                t={t}
                start={0.04}
                fontSize={76}
                targetWeight={700}
              />
              <ClipWord
                text="WEB"
                t={t}
                start={0.11}
                fontSize={76}
                targetWeight={700}
              />
              <ClipWord
                text="STATIS"
                t={t}
                start={0.18}
                fontSize={76}
                targetWeight={800}
                marginRight={0}
              />
            </div>

            {/* Line 2: SUDAH Berakhir. */}
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'center',
                gap: 20,
              }}
            >
              <ClipWord
                text="SUDAH"
                t={t}
                start={BEAT * 1.0}
                fontSize={92}
                targetWeight={800}
                marginRight={4}
              />
              <StaggeredChars
                text="Berakhir."
                t={t}
                start={BEAT * 1.08}
                charDelay={0.02}
                fontSize={108}
                italicSerif={true}
                gradient="linear-gradient(135deg, #FFFFFF 0%, #00F5D4 65%, #38BDF8 100%)"
              />
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* =====================================================================
          SCENE 2: THE ARCHITECTURAL MONOLITH (1.875s - 3.75s)
          ===================================================================== */}
      {s2Opacity > 0.001 && (
        <AbsoluteFill
          style={{
            alignItems: 'center',
            paddingTop: 250,
            opacity: s2Opacity,
            transform: `scale(${(0.88 + s2Enter * 0.12 + s2Exit * 0.35).toFixed(3)}) translateY(${(-s2Exit * 180).toFixed(1)}px)`,
          }}
        >
          {/* Metallic Eyebrow Badge */}
          <div
            style={{
              padding: '10px 26px',
              borderRadius: 999,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(0, 245, 212, 0.35)',
              boxShadow: '0 0 30px rgba(0, 245, 212, 0.15)',
              marginBottom: 34,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#00F5D4',
                boxShadow: '0 0 12px #00F5D4',
              }}
            />
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: '0.22em',
                color: '#E2E8F0',
              }}
            >
              Z-AUTOMATION
            </span>
          </div>

          {/* Main Statement: Visi Nyata. / Tereksekusi Presisi. */}
          <div style={{ textAlign: 'center', padding: '0 56px' }}>
            <div style={{ marginBottom: 8 }}>
              <ClipWord
                text="Visi"
                t={t}
                start={4 * BEAT + 0.05}
                fontSize={88}
                targetWeight={800}
              />
              <ClipWord
                text="Nyata."
                t={t}
                start={4 * BEAT + 0.14}
                fontSize={96}
                italicSerif={true}
                accentGradient="linear-gradient(135deg, #FFFFFF 0%, #CBD5E1 100%)"
                marginRight={0}
              />
            </div>
            <div>
              <ClipWord
                text="Tereksekusi"
                t={t}
                start={5 * BEAT}
                fontSize={84}
                targetWeight={800}
              />
              <StaggeredChars
                text="Presisi."
                t={t}
                start={5 * BEAT + 0.08}
                charDelay={0.018}
                fontSize={102}
                italicSerif={true}
                gradient="linear-gradient(135deg, #00F5D4 0%, #38BDF8 60%, #FFFFFF 100%)"
              />
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* =====================================================================
          SCENE 3, 4, 5: APPLE TITANIUM GLASS STAGE + REAL THREE.JS 3D ENGINE
          (2.60s Preview -> 3.75s Dolly Push-In -> 11.25s Shockwave Zoom-Through)
          ===================================================================== */}
      {show3DStage && (
        <AbsoluteFill
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            perspective: '1600px',
          }}
        >
          {/* The 3D Apple Titanium Glass Stage Container */}
          <div
            style={{
              width: `${860 + dollyExpand * 220}px`,
              height: `${980 + dollyExpand * 940}px`,
              borderRadius: `${(1 - dollyExpand) * 48}px`,
              transform: `
                translate3d(0, ${(1 - cardRise) * 520 + (1 - dollyExpand) * 320}px, 0)
                rotateX(${((1 - dollyExpand) * 16).toFixed(2)}deg)
                rotateY(${((1 - dollyExpand) * -10).toFixed(2)}deg)
                scale(${(1 + s5ZoomOut * 4.5).toFixed(3)})
              `,
              background:
                'linear-gradient(165deg, rgba(16, 22, 36, 0.88) 0%, rgba(6, 9, 16, 0.96) 100%)',
              border:
                dollyExpand < 0.98
                  ? '1.5px solid rgba(255, 255, 255, 0.22)'
                  : 'none',
              boxShadow:
                dollyExpand < 0.98
                  ? '0 40px 110px rgba(0, 0, 0, 0.85), 0 0 60px rgba(0, 245, 212, 0.14), inset 0 1px 2px rgba(255,255,255,0.35)'
                  : 'none',
              overflow: 'hidden',
              position: 'relative',
              filter:
                s5ZoomOut > 0.02
                  ? `blur(${(s5ZoomOut * 16).toFixed(1)}px)`
                  : 'none',
            }}
          >
            {/* Real-Time Deterministic Three.js WebGL Stage */}
            <HermesOpenClaw3DStage
              timeSec={t}
              width={1080}
              height={1920}
            />

            {/* Specular Glass Reflection Sheen across the Titanium Capsule during Dolly Push-In */}
            {dollyExpand < 0.99 && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: `linear-gradient(115deg, transparent ${20 + dollyExpand * 40}%, rgba(255,255,255,0.14) ${35 + dollyExpand * 40}%, transparent ${50 + dollyExpand * 40}%)`,
                  pointerEvents: 'none',
                }}
              />
            )}

            {/* ---------------------------------------------------------------
                SCENE 3 KINETIC TYPOGRAPHY OVERLAY: HERMES REASONING (3.75s - 6.56s)
               --------------------------------------------------------------- */}
            {t >= 3.72 && t < 6.5625 && (
              <AbsoluteFill
                style={{
                  justifyContent: 'space-between',
                  padding: '150px 64px 170px',
                  pointerEvents: 'none',
                  opacity: 1 - smoothstep(6.25, 6.55, t),
                }}
              >
                {/* Top Left/Center Editorial Block */}
                <div>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '8px 20px',
                      borderRadius: 999,
                      background: 'rgba(6, 10, 18, 0.72)',
                      border: '1px solid rgba(0, 245, 212, 0.4)',
                      marginBottom: 22,
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: '#00F5D4',
                        boxShadow: '0 0 10px #00F5D4',
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 18,
                        fontWeight: 700,
                        letterSpacing: '0.16em',
                        color: '#00F5D4',
                      }}
                    >
                      01 // NOUS HERMES ARCHITECT
                    </span>
                  </div>

                  <div>
                    <ClipWord
                      text="HERMES"
                      t={t}
                      start={8.5 * BEAT}
                      fontSize={92}
                      targetWeight={800}
                    />
                    <StaggeredChars
                      text="Berpikir."
                      t={t}
                      start={8.8 * BEAT}
                      charDelay={0.02}
                      fontSize={106}
                      italicSerif={true}
                      gradient="linear-gradient(135deg, #00F5D4 0%, #38BDF8 65%, #FFFFFF 100%)"
                    />
                  </div>
                </div>

                {/* Bottom Glass Caption Bar */}
                <div
                  style={{
                    padding: '26px 34px',
                    borderRadius: 28,
                    background: 'rgba(8, 12, 22, 0.76)',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
                  }}
                >
                  <ClipWord
                    text="Penalaran"
                    t={t}
                    start={9.3 * BEAT}
                    fontSize={44}
                    targetWeight={600}
                    marginRight={12}
                  />
                  <ClipWord
                    text="Strategis"
                    t={t}
                    start={9.5 * BEAT}
                    fontSize={48}
                    italicSerif={true}
                    color="#00F5D4"
                    marginRight={12}
                  />
                  <ClipWord
                    text="&"
                    t={t}
                    start={9.7 * BEAT}
                    fontSize={44}
                    targetWeight={400}
                    color="#94A3B8"
                    marginRight={12}
                  />
                  <ClipWord
                    text="Orkestrasi"
                    t={t}
                    start={9.9 * BEAT}
                    fontSize={44}
                    targetWeight={700}
                    marginRight={12}
                  />
                  <ClipWord
                    text="Sistem."
                    t={t}
                    start={10.1 * BEAT}
                    fontSize={44}
                    targetWeight={700}
                    marginRight={0}
                  />
                </div>
              </AbsoluteFill>
            )}

            {/* ---------------------------------------------------------------
                SCENE 4 KINETIC TYPOGRAPHY OVERLAY: NEURAL SYNAPSE DISPATCH (6.56s - 8.44s)
               --------------------------------------------------------------- */}
            {t >= 6.5625 && t < 8.4375 && (
              <AbsoluteFill
                style={{
                  justifyContent: 'space-between',
                  padding: '150px 64px 170px',
                  pointerEvents: 'none',
                  opacity: 1 - smoothstep(8.18, 8.43, t),
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '8px 22px',
                      borderRadius: 999,
                      background: 'rgba(6, 10, 18, 0.78)',
                      border: '1px solid rgba(255, 255, 255, 0.22)',
                      marginBottom: 20,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 18,
                        fontWeight: 700,
                        letterSpacing: '0.18em',
                        color: '#F8FAFC',
                      }}
                    >
                      NEURAL SYNAPSE DISPATCH // 32 PHOTONS
                    </span>
                  </div>

                  <div>
                    <ClipWord
                      text="SINAPSIS"
                      t={t}
                      start={14.1 * BEAT}
                      fontSize={92}
                      targetWeight={800}
                    />
                    <StaggeredChars
                      text="Otonom."
                      t={t}
                      start={14.35 * BEAT}
                      charDelay={0.022}
                      fontSize={106}
                      italicSerif={true}
                      gradient="linear-gradient(90deg, #00F5D4 0%, #FFFFFF 50%, #FF3B30 100%)"
                    />
                  </div>
                </div>

                {/* Live Synapse Bridge Telemetry Progress Bar */}
                <div
                  style={{
                    padding: '22px 32px',
                    borderRadius: 24,
                    background: 'rgba(8, 12, 22, 0.78)',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 18,
                      color: '#CBD5E1',
                      marginBottom: 12,
                    }}
                  >
                    <span style={{ color: '#00F5D4' }}>HERMES &lt;think&gt;</span>
                    <span>
                      {Math.round(
                        clamp01((t - 6.5625) / (8.4375 - 6.5625)) * 100
                      )}
                      %
                    </span>
                    <span style={{ color: '#FF3B30' }}>
                      OPENCLAW &lt;exec&gt;
                    </span>
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: 6,
                      borderRadius: 999,
                      background: 'rgba(255,255,255,0.1)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${clamp01((t - 6.5625) / (8.4375 - 6.5625)) * 100}%`,
                        height: '100%',
                        background:
                          'linear-gradient(90deg, #00F5D4 0%, #FFFFFF 50%, #FF3B30 100%)',
                        boxShadow: '0 0 16px #00F5D4',
                      }}
                    />
                  </div>
                </div>
              </AbsoluteFill>
            )}

            {/* ---------------------------------------------------------------
                SCENE 5 KINETIC TYPOGRAPHY OVERLAY: OPENCLAW EXECUTION (8.44s - 11.25s)
               --------------------------------------------------------------- */}
            {t >= 8.4375 && t <= 11.25 && (
              <AbsoluteFill
                style={{
                  justifyContent: 'space-between',
                  padding: '150px 64px 170px',
                  pointerEvents: 'none',
                  opacity: 1 - smoothstep(10.8, 11.15, t),
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '8px 20px',
                      borderRadius: 999,
                      background: 'rgba(20, 8, 12, 0.78)',
                      border: '1px solid rgba(229, 37, 42, 0.55)',
                      marginBottom: 22,
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: '#FF3B30',
                        boxShadow: '0 0 12px #FF3B30',
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 18,
                        fontWeight: 700,
                        letterSpacing: '0.16em',
                        color: '#FF6B6B',
                      }}
                    >
                      02 // OPENCLAW EXECUTOR
                    </span>
                  </div>

                  <div>
                    <ClipWord
                      text="OPENCLAW"
                      t={t}
                      start={18.0 * BEAT}
                      fontSize={86}
                      targetWeight={800}
                    />
                    <StaggeredChars
                      text="Mengeksekusi."
                      t={t}
                      start={18.3 * BEAT}
                      charDelay={0.016}
                      fontSize={96}
                      italicSerif={true}
                      gradient="linear-gradient(135deg, #FF3B30 0%, #FF8A65 55%, #00F5D4 100%)"
                    />
                  </div>
                </div>

                {/* Bottom Glass Caption Bar */}
                <div
                  style={{
                    padding: '26px 34px',
                    borderRadius: 28,
                    background: 'rgba(12, 10, 18, 0.8)',
                    border: '1px solid rgba(229, 37, 42, 0.28)',
                    boxShadow: '0 24px 60px rgba(0,0,0,0.65)',
                  }}
                >
                  <ClipWord
                    text="Otomasi"
                    t={t}
                    start={18.8 * BEAT}
                    fontSize={44}
                    targetWeight={700}
                    marginRight={12}
                  />
                  <ClipWord
                    text="Operasional"
                    t={t}
                    start={19.0 * BEAT}
                    fontSize={48}
                    italicSerif={true}
                    color="#FF6B6B"
                    marginRight={12}
                  />
                  <ClipWord
                    text="24/7"
                    t={t}
                    start={19.2 * BEAT}
                    fontSize={44}
                    targetWeight={800}
                    color="#00F5D4"
                    marginRight={12}
                  />
                  <ClipWord
                    text="Tanpa"
                    t={t}
                    start={19.4 * BEAT}
                    fontSize={44}
                    targetWeight={600}
                    marginRight={12}
                  />
                  <ClipWord
                    text="Henti."
                    t={t}
                    start={19.6 * BEAT}
                    fontSize={44}
                    targetWeight={700}
                    marginRight={0}
                  />
                </div>
              </AbsoluteFill>
            )}
          </div>
        </AbsoluteFill>
      )}

      {/* =====================================================================
          SCENE 6: EDITORIAL CREAM FLIP - 3 PILAR EKOSISTEM (11.25s - 13.125s)
          ===================================================================== */}
      {creamOpacity > 0.001 && (
        <AbsoluteFill
          style={{
            backgroundColor: '#EDEBE4',
            color: '#06080E',
            opacity: creamOpacity,
            transform: `scale(${(1 + creamZoomThrough * 12).toFixed(3)})`,
            filter:
              creamZoomThrough > 0.02
                ? `blur(${(creamZoomThrough * 16).toFixed(1)}px)`
                : 'none',
            padding: '220px 72px',
            justifyContent: 'space-between',
          }}
        >
          {/* Top Editorial Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '2px solid rgba(6, 8, 14, 0.14)',
              paddingBottom: 24,
            }}
          >
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: '0.18em',
                color: '#06080E',
              }}
            >
              Z-AUTOMATION // ARSITEKTUR INTI
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 20,
                fontWeight: 700,
                color: '#1A2FFB',
              }}
            >
              [ 01 — 03 ]
            </span>
          </div>

          {/* 3 Kinetic Pillars synced to Beats 24, 25, 26 */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 70,
              margin: 'auto 0',
            }}
          >
            {/* Pillar 01: Beat 24 (11.25s) */}
            <div
              style={{
                borderBottom: '1.5px solid rgba(6, 8, 14, 0.12)',
                paddingBottom: 36,
              }}
            >
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#64748B',
                  marginBottom: 10,
                }}
              >
                01 // WEBGL & THREE.JS
              </div>
              <div>
                <ClipWord
                  text="Rekayasa"
                  t={t}
                  start={24 * BEAT}
                  fontSize={92}
                  color="#06080E"
                  targetWeight={800}
                />
                <StaggeredChars
                  text="Web 3D."
                  t={t}
                  start={24 * BEAT + 0.06}
                  charDelay={0.02}
                  fontSize={104}
                  italicSerif={true}
                  color="#06080E"
                />
              </div>
            </div>

            {/* Pillar 02: Beat 25 (11.719s) */}
            <div
              style={{
                borderBottom: '1.5px solid rgba(6, 8, 14, 0.12)',
                paddingBottom: 36,
              }}
            >
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#1A2FFB',
                  marginBottom: 10,
                }}
              >
                02 // HERMES × OPENCLAW
              </div>
              <div>
                <ClipWord
                  text="Integrasi"
                  t={t}
                  start={25 * BEAT}
                  fontSize={92}
                  color="#06080E"
                  targetWeight={800}
                />
                <StaggeredChars
                  text="Agen AI."
                  t={t}
                  start={25 * BEAT + 0.06}
                  charDelay={0.02}
                  fontSize={104}
                  italicSerif={true}
                  color="#1A2FFB"
                />
              </div>
            </div>

            {/* Pillar 03: Beat 26 (12.188s) */}
            <div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#E5252A',
                  marginBottom: 10,
                }}
              >
                03 // SISTEM EKSEKUSI 24/7
              </div>
              <div>
                <ClipWord
                  text="Otomasi"
                  t={t}
                  start={26 * BEAT}
                  fontSize={92}
                  color="#06080E"
                  targetWeight={800}
                />
                <StaggeredChars
                  text="Mandiri."
                  t={t}
                  start={26 * BEAT + 0.06}
                  charDelay={0.02}
                  fontSize={104}
                  italicSerif={true}
                  color="#E5252A"
                />
              </div>
            </div>
          </div>

          <div />
        </AbsoluteFill>
      )}

      {/* =====================================================================
          SCENE 7 & 8: ORBITAL CONVERGENCE & PURE URL LOCK (13.125s - 16.00s)
          Strictly ONLY the Apple Titanium Glass Pill + Live Typing of z-automation.my.id
          ===================================================================== */}
      {s7Active && (
        <AbsoluteFill
          style={{
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {/* Converging Orbital Halo 1 (Hermes Cyan) */}
          {t < 14.3 && (
            <div
              style={{
                position: 'absolute',
                width: `${760 * (1 - ringConverge * 0.72)}px`,
                height: `${760 * (1 - ringConverge * 0.88)}px`,
                borderRadius: 999,
                border: '2px solid rgba(0, 245, 212, 0.65)',
                boxShadow: '0 0 50px rgba(0, 245, 212, 0.35)',
                transform: `rotate(${(1 - ringConverge) * -140}deg)`,
                opacity: (1 - smoothstep(13.85, 14.2, t)) * smoothstep(13.1, 13.3, t),
              }}
            />
          )}

          {/* Converging Orbital Halo 2 (OpenClaw Crimson) */}
          {t < 14.3 && (
            <div
              style={{
                position: 'absolute',
                width: `${880 * (1 - ringConverge * 0.76)}px`,
                height: `${880 * (1 - ringConverge * 0.9)}px`,
                borderRadius: 999,
                border: '2px solid rgba(229, 37, 42, 0.65)',
                boxShadow: '0 0 50px rgba(229, 37, 42, 0.35)',
                transform: `rotate(${(1 - ringConverge) * 160}deg)`,
                opacity: (1 - smoothstep(13.85, 14.2, t)) * smoothstep(13.1, 13.3, t),
              }}
            />
          )}

          {/* Soft Ambient Backlight behind the Apple Titanium Glass Pill */}
          <div
            style={{
              position: 'absolute',
              width: 780,
              height: 220,
              borderRadius: 999,
              background:
                'radial-gradient(ellipse at center, rgba(0, 245, 212, 0.24) 0%, rgba(26, 47, 251, 0.14) 45%, transparent 75%)',
              filter: 'blur(32px)',
              opacity: pillLock * (1 - loopClose),
            }}
          />

          {/* THE APPLE TITANIUM GLASS PILL (Pure URL Lock: z-automation.my.id) */}
          {t >= 13.78 && (
            <div
              style={{
                position: 'relative',
                width: `${Math.round(320 + pillLock * 580)}px`,
                height: `${Math.max(2, Math.round(148 * (1 - loopClose * 0.985)))}px`,
                borderRadius: 999,
                background:
                  'linear-gradient(165deg, rgba(22, 28, 44, 0.88) 0%, rgba(8, 11, 19, 0.96) 100%)',
                border: '1.5px solid rgba(255, 255, 255, 0.24)',
                boxShadow:
                  '0 30px 90px rgba(0, 0, 0, 0.85), 0 0 50px rgba(0, 245, 212, 0.18), inset 0 1.5px 2px rgba(255, 255, 255, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 48px',
                overflow: 'hidden',
                transform: `scale(${(0.84 + pillLock * 0.16).toFixed(3)})`,
              }}
            >
              {/* Metallic Light Sweep (14.84s - 15.65s) */}
              {t >= 14.82 && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: `linear-gradient(108deg, transparent ${-30 + ((t - 14.82) / 0.78) * 140}%, rgba(255, 255, 255, 0.28) ${-12 + ((t - 14.82) / 0.78) * 140}%, rgba(0, 245, 212, 0.25) ${0 + ((t - 14.82) / 0.78) * 140}%, transparent ${18 + ((t - 14.82) / 0.78) * 140}%)`,
                    pointerEvents: 'none',
                  }}
                />
              )}

              {/* Content Inside Glass Pill: Glowing Status Dot + Live Typed Domain ONLY */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 22,
                  opacity: 1 - smoothstep(15.72, 15.9, t),
                }}
              >
                {/* Pulsing Quantum Cyan Dot */}
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    backgroundColor: '#00F5D4',
                    boxShadow: '0 0 18px #00F5D4, 0 0 36px #00F5D4',
                    flexShrink: 0,
                  }}
                />

                {/* Character-by-Character Live Typing of z-automation.my.id */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 56,
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {domain.split('').map((ch, idx) => {
                    const typeStart = 14.06 + idx * (0.74 / domain.length);
                    const dtCh = t - typeStart;
                    if (dtCh < 0) return null;
                    const pop = dampedSpring(dtCh, 22, 0.75);
                    const isDotOrTld = idx >= domain.indexOf('.');
                    // Highlight sweep gleam on characters after 14.84s
                    const sweepCenter =
                      ((t - 14.84) / 0.72) * domain.length;
                    const distSweep = Math.abs(idx - sweepCenter);
                    const gleam =
                      t >= 14.84 && distSweep < 3.2
                        ? Math.cos((distSweep / 3.2) * (Math.PI / 2))
                        : 0;

                    return (
                      <span
                        key={idx}
                        style={{
                          display: 'inline-block',
                          transform: `translateY(${((1 - pop) * 8 - gleam * 3).toFixed(1)}px) scale(${(0.9 + pop * 0.1 + gleam * 0.06).toFixed(3)})`,
                          color:
                            gleam > 0.35
                              ? '#FFFFFF'
                              : isDotOrTld
                                ? '#00F5D4'
                                : '#F8FAFC',
                          textShadow:
                            gleam > 0.2
                              ? '0 0 24px rgba(0, 245, 212, 0.9)'
                              : isDotOrTld
                                ? '0 0 18px rgba(0, 245, 212, 0.35)'
                                : 'none',
                        }}
                      >
                        {ch}
                      </span>
                    );
                  })}

                  {/* Optical Typing Cursor */}
                  <span
                    style={{
                      display: 'inline-block',
                      width: 4,
                      height: 54,
                      marginLeft: 8,
                      borderRadius: 2,
                      backgroundColor: '#00F5D4',
                      boxShadow: '0 0 14px #00F5D4',
                      opacity:
                        t < 14.85
                          ? 1
                          : Math.sin(t * 16) > 0
                            ? 0.85 * (1 - smoothstep(15.4, 15.75, t))
                            : 0.15,
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
