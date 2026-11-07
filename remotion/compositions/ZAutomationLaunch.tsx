import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { Sanctum3DMascots } from '../components/Sanctum3DMascots';
import { Phone3DShowcase } from '../components/Phone3DShowcase';

export interface ZAutomationLaunchProps {
  title?: string;
  tagline?: string;
  domain?: string;
  audioSrc?: string;
}

// ============================================================================
// Exact Measured Reference Easing Curves (1:1 from Sanctum 30fps Frame Study)
// ============================================================================
const EASE_OUT_EXPO = Easing.bezier(0.16, 1.0, 0.3, 1.0);
const EASE_MACRO_PUSH = Easing.bezier(0.24, 0.9, 0.3, 1.0);
const EASE_WHIP_PAN = Easing.bezier(0.68, 0.0, 0.24, 1.0);
const EASE_CURSOR_GLIDE = Easing.bezier(0.20, 0.95, 0.30, 1.0);
const EASE_CURSOR_EXIT = Easing.bezier(0.45, 0.0, 0.85, 0.6);
const EASE_DROP_DOWN = Easing.bezier(0.55, 0.0, 0.92, 0.42);
const EASE_RUBBER_SNAP = Easing.bezier(0.18, 1.0, 0.32, 1.0);
const EASE_WHIP_SPIN = Easing.bezier(0.55, 0.0, 0.95, 0.45);

// Exact millisecond-synced keystroke timestamps for "z-automation.my.id" (18 chars)
// Matches scripts/build-sanctum-audio.py 1:1!
const TYPED_DOMAIN = 'z-automation.my.id';
const CHAR_TIMES = [
  0.70, 0.76, // z -
  0.83, 0.88, 0.93, 0.98, 1.04, 1.09, 1.15, 1.20, 1.25, 1.31, // automation
  1.39, // .
  1.46, 1.52, // my
  1.60, // .
  1.67, 1.74, // id
];

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

// ============================================================================
// Minimalist Pure-White Z-Automation Mascot Mark (Act 4 Lockup, Ref F326-F396)
// Friendly rounded OpenClaw/Bot geometric silhouette with cobalt cutout eyes & smile
// ============================================================================
const ZMascotEmblem: React.FC<{ size?: number }> = ({ size = 186 }) => {
  return (
    <svg
      width={size}
      height={size * 0.88}
      viewBox="0 0 200 176"
      fill="none"
      style={{ display: 'block', overflow: 'visible' }}
    >
      <defs>
        <mask id="z-mascot-cutout">
          <rect x="-20" y="-20" width="240" height="220" fill="white" />
          {/* Friendly Expressive Cutout Eyes */}
          <circle cx="76" cy="92" r="12.5" fill="black" />
          <circle cx="124" cy="92" r="12.5" fill="black" />
          {/* Joyful Open D-Smile Cutout (matching Sanctum's charming mascot expression!) */}
          <path
            d="M78 117 C78 114, 122 114, 122 117 C122 138, 78 138, 78 117 Z"
            fill="black"
          />
        </mask>
      </defs>

      <g mask="url(#z-mascot-cutout)">
        {/* Cute Curved Twin Antennae + Glowing Round Tips */}
        <path
          d="M74 44 C68 24, 54 18, 46 20"
          stroke="#FFFFFF"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <circle cx="44" cy="20" r="10" fill="#FFFFFF" />

        <path
          d="M126 44 C132 24, 146 18, 154 20"
          stroke="#FFFFFF"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <circle cx="156" cy="20" r="10" fill="#FFFFFF" />

        {/* Plump, Tactile Rounded Cloud-Bot Silhouette + Side Earpiece/Claw Bumps */}
        <rect x="24" y="38" width="152" height="122" rx="61" fill="#FFFFFF" />
        <circle cx="24" cy="104" r="18" fill="#FFFFFF" />
        <circle cx="176" cy="104" r="18" fill="#FFFFFF" />
      </g>

      {/* Cute White Tongue Highlight Inside the Smile Cutout */}
      <path
        d="M89 130 C94 125, 106 125, 111 130 C106 134, 94 134, 89 130 Z"
        fill="#FFFFFF"
      />
    </svg>
  );
};

// ============================================================================
// 4-Point Concave Sparkle Star SVG (Ref F131-F401)
// ============================================================================
const FourPointStar: React.FC<{
  size: number;
  color: string;
  rotateDeg?: number;
  style?: React.CSSProperties;
}> = ({ size, color, rotateDeg = 0, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    style={{
      position: 'absolute',
      transform: `rotate(${rotateDeg}deg)`,
      pointerEvents: 'none',
      ...style,
    }}
  >
    <path
      d="M50 0 C53 34, 66 47, 100 50 C66 53, 53 66, 50 100 C47 66, 34 53, 0 50 C34 47, 47 34, 50 0 Z"
      fill={color}
    />
  </svg>
);

// ============================================================================
// Shared Bright Z-Automation Cobalt Sky World (Acts 2, 3 & 4, 3.90s -> 14.50s)
// ============================================================================
const CobaltSkyBackdrop: React.FC<{ timeSec: number }> = ({ timeSec }) => {
  // Initial macro DoF blur right at the 4.00s portal burst, racking sharp by 4.55s (Ref F121->F137)
  const rackBlur = interpolate(timeSec, [4.0, 4.55], [14, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const drift = timeSec - 4.0;

  return (
    <AbsoluteFill
      style={{
        background:
          'linear-gradient(180deg, #2C88FF 0%, #0E5BFF 46%, #1A2FFB 100%)',
        overflow: 'hidden',
        filter: rackBlur > 0.15 ? `blur(${rackBlur.toFixed(2)}px)` : undefined,
      }}
    >
      {/* Top-Left Soft Sky-Periwinkle Cloud */}
      <div
        style={{
          position: 'absolute',
          left: -180 + Math.sin(drift * 0.4) * 28,
          top: -160,
          width: 780,
          height: 540,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(168, 218, 255, 0.72) 0%, rgba(120, 190, 255, 0) 70%)',
          filter: 'blur(55px)',
        }}
      />

      {/* Bottom-Left Warm Coral-Peach Cloud (1:1 Ref F136-F396) */}
      <div
        style={{
          position: 'absolute',
          left: -150 + Math.cos(drift * 0.35) * 30,
          bottom: -210,
          width: 820,
          height: 680,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(238, 148, 166, 0.85) 0%, rgba(214, 138, 178, 0.38) 48%, rgba(26, 47, 251, 0) 75%)',
          filter: 'blur(62px)',
        }}
      />

      {/* Top-Right Bright Ice-Sky Cloud */}
      <div
        style={{
          position: 'absolute',
          right: -140,
          top: -150 + Math.sin(drift * 0.45) * 24,
          width: 860,
          height: 600,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(182, 226, 255, 0.78) 0%, rgba(132, 200, 255, 0) 72%)',
          filter: 'blur(56px)',
        }}
      />

      {/* Bottom-Right Fresh Mint-Lime Cloud (--color-green #C1FF00 + Spring Mint, Ref F136-F401) */}
      <div
        style={{
          position: 'absolute',
          right: -180 + Math.cos(drift * 0.38) * 32,
          bottom: -190,
          width: 920,
          height: 760,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(114, 238, 132, 0.84) 0%, rgba(193, 255, 110, 0.42) 45%, rgba(26, 47, 251, 0) 74%)',
          filter: 'blur(64px)',
        }}
      />

      {/* Floating Crisp 4-Point Stars & Micro-Diamonds */}
      {/* Large Green 4-Point Star (Bottom-Right Quadrant, 1:1 Ref F156-F401 size & position!) */}
      <FourPointStar
        size={215}
        color="#3FE659"
        rotateDeg={-4 + Math.sin(drift * 1.1) * 5}
        style={{
          right: 175 + Math.sin(drift * 0.7) * 18,
          bottom: 58 + Math.cos(drift * 0.6) * 16,
          opacity: 0.96,
        }}
      />

      {/* Medium Crisp White 4-Point Star (Lower-Left, 1:1 Ref F216-F401 size!) */}
      <FourPointStar
        size={78}
        color="#FFFFFF"
        rotateDeg={8 + Math.cos(drift * 1.3) * 8}
        style={{
          left: 295 + Math.cos(drift * 0.8) * 22,
          bottom: 195 + Math.sin(drift * 0.9) * 18,
          opacity: 0.96,
        }}
      />

      {/* Tiny Upper Sparkles & Micro-Confetti Diamonds */}
      <FourPointStar
        size={18}
        color="rgba(255,255,255,0.75)"
        style={{
          left: 590,
          top: 95 + Math.sin(drift * 1.4) * 10,
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: 525,
          top: 325 + Math.cos(drift * 1.2) * 12,
          width: 12,
          height: 12,
          backgroundColor: '#FFB85C',
          transform: `rotate(${35 + drift * 18}deg)`,
          borderRadius: 2,
          opacity: 0.9,
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: 265,
          bottom: 265 + Math.sin(drift * 1.5) * 14,
          width: 13,
          height: 13,
          backgroundColor: '#FF86B2',
          transform: `rotate(${20 - drift * 15}deg)`,
          borderRadius: 2,
          opacity: 0.85,
        }}
      />
    </AbsoluteFill>
  );
};

// ============================================================================
// Act 1 (0.00s - 4.03s): Liquid Glass Input Pill, Macro Pan & 3D Glass Cursor
// Built at 2.5x native macro resolution so close-up zoom is 100% razor-sharp!
// ============================================================================
const Act1LiquidGlassIntro: React.FC<{ timeSec: number }> = ({ timeSec }) => {
  if (timeSec > 4.03) return null;

  // 1. Pill Entrance Scale & Rack Focus (0.00s -> 0.55s, Ref F001-F017)
  const pIntro = EASE_OUT_EXPO(clamp01(timeSec / 0.55));
  const introScale = interpolate(pIntro, [0, 1], [0.28, 1.0]);
  const introBlur = interpolate(clamp01(timeSec / 0.45), [0, 1], [18, 0]);
  const introOpacity = interpolate(clamp01(timeSec / 0.18), [0, 1], [0, 1]);

  // 2. Virtual Camera Push to Left of Pill (0.58s -> 1.85s, Ref F018-F056)
  const pPush = EASE_MACRO_PUSH(clamp01((timeSec - 0.58) / (1.85 - 0.58)));

  // 3. Smooth S-Curve Whip-Pan to Right CTA Button (2.00s -> 2.34s, Ref F061-F071)
  const pPan = EASE_WHIP_PAN(clamp01((timeSec - 2.00) / (2.34 - 2.00)));

  // 4. Exponential Portal Zoom Into Button (3.80s -> 4.02s, Ref F115-F121)
  const uPortal = clamp01((timeSec - 3.80) / (4.02 - 3.80));
  const portalScaleMult = 1.0 + Math.pow(uPortal, 3.0) * 6.8;

  // Native Pill is 1460 x 296; at base scale 0.43 it renders as 628 x 127 centered (1:1 Ref F016);
  // at macro scale 1.86 it fills ~545px height (51% of 1080p) matching Ref F046-F106 1:1!
  const baseRigScale = interpolate(pPush, [0, 1], [0.43, 1.86]) * introScale * portalScaleMult;

  // Pan X in native pill coordinates:
  // Push pans +355px right so left half of pill fills screen & right button goes off-screen right (1:1 Ref F046!);
  // Whip-pan shifts to -385px so right CTA button sits hero-centered while trailing ".id" peeks on far left (1:1 Ref F071!)
  const panX =
    interpolate(pPush, [0, 1], [0, 355]) +
    interpolate(pPan, [0, 1], [0, -740]);

  // Typed domain characters ("z-automation.my.id")
  let typedCount = 0;
  for (let i = 0; i < CHAR_TIMES.length; i++) {
    if (timeSec >= CHAR_TIMES[i]) typedCount = i + 1;
  }
  const visibleDomain = TYPED_DOMAIN.slice(0, typedCount);
  const showCaret =
    timeSec >= 0.62 &&
    timeSec <= 2.25 &&
    (timeSec < 1.78 || Math.floor((timeSec - 1.78) * 4.5) % 2 === 0);

  // 5. 3D Frosted Glass Cursor Choreography (2.66s -> 3.74s, Ref F080-F112)
  const showCursor = timeSec >= 2.66 && timeSec <= 3.76;
  const pCurIn = EASE_CURSOR_GLIDE(clamp01((timeSec - 2.66) / (3.08 - 2.66)));
  const pCurExit = EASE_CURSOR_EXIT(clamp01((timeSec - 3.38) / (3.74 - 3.38)));

  // Cursor press squish right at 3.15s (Ref F095)
  const pressPulse =
    timeSec >= 3.11 && timeSec <= 3.34
      ? Math.sin(((timeSec - 3.11) / 0.23) * Math.PI)
      : 0;

  // Cursor coords relative to the CTA button center
  const curX =
    interpolate(pCurIn, [0, 1], [-580, -34]) +
    interpolate(pCurExit, [0, 1], [0, 480]);
  const curY =
    interpolate(pCurIn, [0, 1], [-195, 10]) +
    interpolate(pCurExit, [0, 1], [0, 75]);
  const curScale = 1.0 - pressPulse * 0.18;

  // Button press + luminous frosted white-sky flood (3.15s -> 3.85s, Ref F095-F116)
  const btnScale = 1.0 - pressPulse * 0.045;
  const btnFlood = EASE_OUT_EXPO(clamp01((timeSec - 3.22) / (3.72 - 3.22)));

  // In Ref F016 (0.50s), the zoomed-out mini button glows bright white-sky, then settles into dark recessed glass by F071 (2.33s)!
  const initialWhiteBtnGlow = 1.0 - pPan;

  // Circular shock-ripple at click impact (3.14s -> 3.48s, Ref F095-F104)
  const uRipple = clamp01((timeSec - 3.14) / 0.34);
  const showRipple = timeSec >= 3.14 && timeSec <= 3.48;

  // Crossfade dark Act 1 wrapper from 3.86s -> 4.01s so at 3.93s (Ref F119) the blurred Cobalt Sky glows right through the frosted portal!
  const act1FadeOut = interpolate(timeSec, [3.85, 4.01], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#061017',
        overflow: 'hidden',
        opacity: act1FadeOut,
      }}
    >
      {/* Out-of-Focus Atmospheric Bokeh Orbs (Zero grid, zero HUD!) */}
      <div
        style={{
          position: 'absolute',
          left: '24%',
          top: '-18%',
          width: 960,
          height: 620,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(110, 134, 186, 0.36) 0%, rgba(20, 40, 68, 0) 70%)',
          filter: 'blur(90px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '18%',
          bottom: '-22%',
          width: 1120,
          height: 700,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(44, 122, 168, 0.42) 0%, rgba(16, 48, 72, 0) 72%)',
          filter: 'blur(95px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: '-8%',
          bottom: '-12%',
          width: 760,
          height: 580,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(22, 102, 88, 0.28) 0%, rgba(8, 28, 28, 0) 72%)',
          filter: 'blur(85px)',
        }}
      />

      {/* Camera Rig Centering the High-DPI Liquid Glass Pill */}
      <AbsoluteFill
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: introOpacity,
          filter: introBlur > 0.2 ? `blur(${introBlur.toFixed(1)}px)` : undefined,
        }}
      >
        <div
          style={{
            width: 1460,
            height: 284,
            borderRadius: 999,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 44px 0 96px',
            boxSizing: 'border-box',
            transform: `scale(${baseRigScale}) translate3d(${panX}px, 0px, 0px)`,
            transformOrigin: 'center center',
            // Authentic Refractive Liquid-Glass Shader (matching Ref F016-F096 caustics!)
            background:
              'linear-gradient(122deg, rgba(155, 214, 248, 0.16) 0%, rgba(36, 78, 108, 0.28) 28%, rgba(145, 218, 255, 0.30) 56%, rgba(28, 66, 92, 0.32) 82%, rgba(175, 232, 255, 0.22) 100%)',
            border: '3px solid rgba(186, 236, 255, 0.72)',
            boxShadow:
              '0 0 55px rgba(96, 198, 255, 0.26), inset 0 4px 26px rgba(255, 255, 255, 0.32), inset 0 -6px 28px rgba(90, 195, 255, 0.25)',
          }}
        >
          {/* Top Specular Caustic Hotspot Streak (Ref F036-F056) */}
          <div
            style={{
              position: 'absolute',
              top: -2,
              left: '26%',
              width: '38%',
              height: 7,
              borderRadius: 999,
              background:
                'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0) 100%)',
              filter: 'blur(1.5px)',
              pointerEvents: 'none',
            }}
          />
          {/* Right Curve Caustic Specular Rim Glow (Ref F071-F106) */}
          <div
            style={{
              position: 'absolute',
              right: -3,
              top: '14%',
              bottom: '14%',
              width: 9,
              borderRadius: 999,
              background:
                'linear-gradient(180deg, rgba(180,235,255,0) 0%, rgba(235,250,255,0.96) 50%, rgba(180,235,255,0) 100%)',
              filter: 'blur(1.5px)',
              pointerEvents: 'none',
            }}
          />

          {/* Left Input Field: Crisp Typed Domain ("z-automation.my.id|") */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              fontFamily: "'Aeonik', sans-serif",
              fontWeight: 400,
              fontSize: 64,
              letterSpacing: '-0.015em',
              color: '#FFFFFF',
              whiteSpace: 'nowrap',
              textShadow: '0 2px 14px rgba(0, 0, 0, 0.25)',
            }}
          >
            <span>{visibleDomain}</span>
            <span
              style={{
                display: 'inline-block',
                width: 4,
                height: 68,
                marginLeft: 6,
                borderRadius: 2,
                backgroundColor: '#E2F4FF',
                opacity: showCaret ? 1 : 0,
              }}
            />
          </div>

          {/* Right Recessed Liquid-Glass CTA Button ("Mulai Otomasi") */}
          <div
            style={{
              width: 500,
              height: 196,
              borderRadius: 999,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `scale(${btnScale})`,
              overflow: 'hidden',
              background:
                'radial-gradient(125% 140% at 30% 20%, rgba(24, 64, 90, 0.92) 0%, rgba(8, 25, 38, 0.96) 68%, rgba(16, 48, 68, 0.94) 100%)',
              border: '3px solid rgba(176, 234, 255, 0.62)',
              boxShadow:
                'inset 0 6px 20px rgba(215, 245, 255, 0.38), inset 0 -6px 18px rgba(0, 0, 0, 0.55), 0 8px 28px rgba(0, 0, 0, 0.35)',
            }}
          >
            {/* Initial Bright Frosted Ice Glow when zoomed out at 0.50s (Ref F016!) */}
            {initialWhiteBtnGlow > 0.01 ? (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 999,
                  background:
                    'linear-gradient(110deg, #E8F6FF 0%, #BFE4FF 100%)',
                  opacity: initialWhiteBtnGlow * 0.92,
                  zIndex: 0,
                }}
              />
            ) : null}

            {/* Button Text: Sky-Blue -> Crisp White Gradient (matching "Join Waitlist" in Ref F071!) */}
            <span
              style={{
                fontFamily: "'Aeonik', sans-serif",
                fontWeight: 500,
                fontSize: 52,
                letterSpacing: '-0.02em',
                ...(initialWhiteBtnGlow > 0.5
                  ? { color: '#3988C4' }
                  : {
                      background:
                        'linear-gradient(90deg, #6AC2FF 0%, #BEE5FF 36%, #FFFFFF 72%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }),
                opacity: 1 - btnFlood * 0.96,
                position: 'relative',
                zIndex: 1,
              }}
            >
              Mulai Otomasi
            </span>

            {/* Translucent Luminous Frosted Sky-Blue Portal Flood After Click (Ref F106-F120!) */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 999,
                opacity: btnFlood,
                background:
                  'radial-gradient(110% 130% at 38% 45%, rgba(226, 245, 255, 0.88) 0%, rgba(125, 202, 255, 0.72) 55%, rgba(88, 185, 245, 0.68) 100%)',
                boxShadow: 'inset 0 0 38px rgba(255, 255, 255, 0.92)',
                zIndex: 2,
              }}
            />

            {/* Circular Frosted Click Shock-Ripple (Ref F096-F101) */}
            {showRipple ? (
              <div
                style={{
                  position: 'absolute',
                  width: interpolate(uRipple, [0, 1], [72, 290]),
                  height: interpolate(uRipple, [0, 1], [72, 290]),
                  borderRadius: '50%',
                  background:
                    'radial-gradient(circle, rgba(255,255,255,0.94) 0%, rgba(190,235,255,0.62) 54%, rgba(140,215,255,0) 78%)',
                  border: '3px solid rgba(255, 255, 255, 0.88)',
                  opacity: 1 - Math.pow(uRipple, 1.4),
                  zIndex: 3,
                  pointerEvents: 'none',
                }}
              />
            ) : null}
          </div>

          {/* 3D Frosted Glass Dart Cursor (Ref F081-F111) */}
          {showCursor ? (
            <div
              style={{
                position: 'absolute',
                right: 280,
                top: '50%',
                marginTop: -76,
                transform: `translate3d(${curX}px, ${curY}px, 0px) scale(${curScale})`,
                zIndex: 10,
                pointerEvents: 'none',
                filter: 'drop-shadow(0 18px 28px rgba(4, 16, 28, 0.55))',
              }}
            >
              <svg width="210" height="156" viewBox="0 0 176 132" fill="none">
                <defs>
                  <linearGradient id="glass-cursor-fill" x1="12" y1="14" x2="156" y2="96" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="rgba(165, 228, 255, 0.52)" />
                    <stop offset="55%" stopColor="rgba(235, 250, 255, 0.82)" />
                    <stop offset="100%" stopColor="rgba(255, 255, 255, 0.96)" />
                  </linearGradient>
                  <linearGradient id="glass-cursor-rim" x1="10" y1="10" x2="162" y2="80" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#8EE4FF" />
                    <stop offset="65%" stopColor="#FFFFFF" />
                    <stop offset="100%" stopColor="#C2F0FF" />
                  </linearGradient>
                </defs>
                {/* 3D Sleek Right-Pointing Glass Dart */}
                <path
                  d="M18 18 L158 66 L26 112 L46 66 Z"
                  fill="url(#glass-cursor-fill)"
                  stroke="url(#glass-cursor-rim)"
                  strokeWidth="4.5"
                  strokeLinejoin="round"
                />
                {/* Upper Facet Specular Highlight */}
                <path
                  d="M22 22 L152 66 L48 66 Z"
                  fill="rgba(255, 255, 255, 0.34)"
                />
              </svg>
            </div>
          ) : null}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ============================================================================
// Act 2 Typography (4.83s - 7.16s, Ref F146-F215):
// "Bangun Sistem / Otomasi / sekarang"
// ============================================================================
const Act2HeroText: React.FC<{ timeSec: number }> = ({ timeSec }) => {
  if (timeSec < 4.80 || timeSec > 7.18) return null;

  const pW1 = EASE_OUT_EXPO(clamp01((timeSec - 4.83) / 0.24)); // Bangun
  const pW2 = EASE_OUT_EXPO(clamp01((timeSec - 5.00) / 0.24)); // Sistem
  const pW3 = EASE_OUT_EXPO(clamp01((timeSec - 5.17) / 0.28)); // Otomasi
  const pW4 = EASE_OUT_EXPO(clamp01((timeSec - 5.33) / 0.26)); // sekarang

  // Downward exit in sync with Hermes (6.84s -> 7.16s, Ref F206-F215)
  const pExit = EASE_DROP_DOWN(clamp01((timeSec - 6.84) / (7.16 - 6.84)));
  const dropY = pExit * 690;

  // Iridescent warm peach-gold-rose-to-white shimmer across "Otomasi" (5.62s -> 6.50s, Ref F170-F195)
  const shimmerBell =
    timeSec >= 5.58 && timeSec <= 6.58
      ? Math.sin(((timeSec - 5.58) / 1.0) * Math.PI)
      : 0;
  const gradPos = interpolate(clamp01((timeSec - 5.58) / 1.0), [0, 1], [120, -20]);

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `translate3d(0px, ${-34 + dropY}px, 0px)`,
        pointerEvents: 'none',
      }}
    >
      {/* Line 1: "Bangun Sistem" */}
      <div
        style={{
          display: 'flex',
          gap: 15,
          fontFamily: "'Aeonik', sans-serif",
          fontWeight: 500,
          fontSize: 56,
          lineHeight: 1.08,
          letterSpacing: '-0.022em',
          color: '#FFFFFF',
        }}
      >
        <span
          style={{
            opacity: pW1,
            transform: `translateY(${(1 - pW1) * 16}px) scale(${0.86 + 0.14 * pW1})`,
          }}
        >
          Bangun
        </span>
        <span
          style={{
            opacity: pW2,
            transform: `translateY(${(1 - pW2) * 16}px) scale(${0.86 + 0.14 * pW2})`,
          }}
        >
          Sistem
        </span>
      </div>

      {/* Line 2: "Otomasi" (Large Hero Word + Clean Warm Iridescent Shimmer Sweep, Zero Box Artifact!) */}
      <div
        style={{
          position: 'relative',
          marginTop: 2,
          marginBottom: 4,
          opacity: pW3,
          transform: `translateY(${(1 - pW3) * 20}px) scale(${0.84 + 0.16 * pW3})`,
        }}
      >
        {/* Base Pure White Text */}
        <span
          style={{
            fontFamily: "'Aeonik', sans-serif",
            fontWeight: 600,
            fontSize: 112,
            lineHeight: 1.02,
            letterSpacing: '-0.034em',
            color: '#FFFFFF',
            display: 'block',
          }}
        >
          Otomasi
        </span>

        {/* Warm Peach-Gold-Rose Shimmer Overlay (Ref F176-F191, no CSS filter so bounding-box never paints!) */}
        {shimmerBell > 0.01 ? (
          <span
            style={{
              position: 'absolute',
              inset: 0,
              fontFamily: "'Aeonik', sans-serif",
              fontWeight: 600,
              fontSize: 112,
              lineHeight: 1.02,
              letterSpacing: '-0.034em',
              backgroundImage: `linear-gradient(95deg, #FFFFFF ${gradPos - 35}%, #FFD2A6 ${gradPos}%, #FFB5D6 ${gradPos + 28}%, #C6E8FF ${gradPos + 55}%, #FFFFFF ${gradPos + 85}%)`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              WebkitTextFillColor: 'transparent',
              opacity: shimmerBell,
            }}
          >
            Otomasi
          </span>
        ) : null}
      </div>

      {/* Line 3: "sekarang" */}
      <div
        style={{
          fontFamily: "'Aeonik', sans-serif",
          fontWeight: 500,
          fontSize: 58,
          lineHeight: 1.08,
          letterSpacing: '-0.022em',
          color: '#FFFFFF',
          opacity: pW4,
          transform: `translateY(${(1 - pW4) * 16}px) scale(${0.86 + 0.14 * pW4})`,
        }}
      >
        sekarang
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// Act 3 Left-Side Rubber-Band Stretch Typography (8.67s - 10.72s, Ref F261-F321):
// "lewat Web 3D / dan Agen AI"
// ============================================================================
const RubberWord: React.FC<{
  text: string;
  timeSec: number;
  startSec: number;
  fontSize: number;
  fontWeight: number;
  gradient?: string;
}> = ({ text, timeSec, startSec, fontSize, fontWeight, gradient }) => {
  if (timeSec < startSec) return null;
  const p = EASE_RUBBER_SNAP(clamp01((timeSec - startSec) / 0.28));
  const opacity = clamp01((timeSec - startSec) / 0.08);
  // Signature Sanctum horizontal rubber-band stretch (scaleX: 1.62 -> 1.00, Ref F262->F268!)
  const scaleX = interpolate(p, [0, 1], [1.62, 1.0]);
  const scaleY = interpolate(p, [0, 1], [0.88, 1.0]);

  return (
    <span
      style={{
        display: 'inline-block',
        fontFamily: "'Aeonik', sans-serif",
        fontSize,
        fontWeight,
        letterSpacing: '-0.028em',
        lineHeight: 1.12,
        opacity,
        transformOrigin: 'left center',
        transform: `scale(${scaleX.toFixed(3)}, ${scaleY.toFixed(3)})`,
        ...(gradient
          ? {
              backgroundImage: gradient,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              WebkitTextFillColor: 'transparent',
            }
          : { color: '#FFFFFF' }),
      }}
    >
      {text}
    </span>
  );
};

const Act3RubberHeadline: React.FC<{ timeSec: number }> = ({ timeSec }) => {
  if (timeSec < 8.65 || timeSec > 10.72) return null;

  // Synchronized 3D Y-axis whip-spin into center (10.50s -> 10.71s, Ref F316-F321)
  const pWhip = EASE_WHIP_SPIN(clamp01((timeSec - 10.50) / (10.71 - 10.50)));
  const whipX = interpolate(pWhip, [0, 1], [0, 260]);
  const whipRotY = interpolate(pWhip, [0, 1], [0, 84]);
  const whipScale = interpolate(pWhip, [0, 1], [1.0, 0.78]);
  const whipBlur = interpolate(pWhip, [0, 0.35, 1], [0, 6, 26]);
  const opacity = interpolate(timeSec, [10.61, 10.71], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: 315,
        top: '50%',
        transform: `translate3d(${whipX}px, -52%, 0px) perspective(1200px) rotateY(${whipRotY}deg) scale(${whipScale})`,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        opacity,
        filter: whipBlur > 0.2 ? `blur(${whipBlur.toFixed(1)}px)` : undefined,
        pointerEvents: 'none',
      }}
    >
      {/* Line 1: "lewat Web 3D" */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 22 }}>
        <RubberWord
          text="lewat"
          timeSec={timeSec}
          startSec={8.67}
          fontSize={78}
          fontWeight={400}
        />
        <RubberWord
          text="Web 3D"
          timeSec={timeSec}
          startSec={8.83}
          fontSize={96}
          fontWeight={600}
        />
      </div>

      {/* Line 2: "dan Agen AI" */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 22 }}>
        <RubberWord
          text="dan"
          timeSec={timeSec}
          startSec={8.97}
          fontSize={78}
          fontWeight={400}
        />
        <RubberWord
          text="Agen AI"
          timeSec={timeSec}
          startSec={9.15}
          fontSize={98}
          fontWeight={600}
          gradient="linear-gradient(95deg, #FFD3A8 0%, #F9B4D4 48%, #DCE8FF 100%)"
        />
      </div>
    </div>
  );
};

// ============================================================================
// Act 4 (10.66s - 14.84s, Ref F320-F445):
// Mascot Spin-In, Squash-&-Stretch Bounce & "z-automation" Brand Lockup
// ============================================================================
const Act4BrandLockup: React.FC<{ timeSec: number }> = ({ timeSec }) => {
  if (timeSec < 10.65) return null;

  // 1. Spin-in out of close-up blur (10.66s -> 10.98s, Ref F320-F330)
  const pArrive = EASE_OUT_EXPO(clamp01((timeSec - 10.66) / (10.98 - 10.66)));
  const arriveBlur = interpolate(clamp01((timeSec - 10.66) / 0.26), [0, 1], [24, 0]);
  const arriveOpacity = clamp01((timeSec - 10.66) / 0.10);

  // 2. Signature Squash-and-Stretch Anticipation Lean & Bounce (11.35s -> 11.94s, Ref F341-F358)
  let mascotSkewX = 0;
  let mascotRot = 0;
  let squashX = 1.0;
  let squashY = 1.0;

  if (timeSec >= 11.35 && timeSec < 11.55) {
    // Lean back-left & squash (Ref F346!)
    const u = Math.sin(((timeSec - 11.35) / 0.20) * (Math.PI / 2));
    mascotSkewX = -21 * u;
    mascotRot = -10 * u;
    squashX = 1.0 + 0.22 * u;
    squashY = 1.0 - 0.16 * u;
  } else if (timeSec >= 11.55 && timeSec < 11.78) {
    // Spring upright & stretch joyfully (Ref F351-F353!)
    const u = (timeSec - 11.55) / 0.23;
    mascotSkewX = interpolate(u, [0, 0.55, 1], [-21, 6, 0]);
    mascotRot = interpolate(u, [0, 0.55, 1], [-10, 7, 0]);
    squashX = interpolate(u, [0, 0.55, 1], [1.22, 0.91, 1.0]);
    squashY = interpolate(u, [0, 0.55, 1], [0.84, 1.12, 1.0]);
  }

  // 3. Scale down & slide left into clean horizontal lockup (11.82s -> 12.24s, Ref F355-F367)
  const pShrink = EASE_OUT_EXPO(clamp01((timeSec - 11.80) / 0.24));
  const pSlide = EASE_OUT_EXPO(clamp01((timeSec - 11.94) / 0.32));

  const baseScale =
    interpolate(pArrive, [0, 1], [2.35, 1.0]) *
    interpolate(pShrink, [0, 1], [1.0, 0.46]);

  // Center the combined [Icon + "z-automation"] lockup cleanly around screen center (0, 0)
  const iconX = interpolate(pSlide, [0, 1], [0, -345]);

  // Wordmark elastic reveal (11.96s -> 12.34s, Ref F359-F370)
  const showWordmark = timeSec >= 11.95;
  const pWord = EASE_RUBBER_SNAP(clamp01((timeSec - 11.95) / 0.38));
  const wordOpacity = clamp01((timeSec - 11.95) / 0.10);
  const wordScaleX = interpolate(pWord, [0, 1], [1.22, 1.0]);
  const wordX = interpolate(pWord, [0, 1], [-48, -242]);

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: arriveOpacity,
        filter: arriveBlur > 0.2 ? `blur(${arriveBlur.toFixed(1)}px)` : undefined,
        pointerEvents: 'none',
      }}
    >
      {/* Pure-White Mascot Icon (308px hero -> 142px lockup, 1:1 Ref F346 & F376!) */}
      <div
        style={{
          position: 'absolute',
          transform: `translate3d(${iconX}px, 0px, 0px) rotate(${mascotRot}deg) skewX(${mascotSkewX}deg) scale(${(
            baseScale * squashX
          ).toFixed(3)}, ${(baseScale * squashY).toFixed(3)})`,
        }}
      >
        <ZMascotEmblem size={308} />
      </div>

      {/* Crisp Pure-White Aeonik Wordmark ("z-automation") */}
      {showWordmark ? (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            transform: `translate3d(${wordX}px, -4px, 0px) scaleX(${wordScaleX.toFixed(3)})`,
            transformOrigin: 'left center',
            opacity: wordOpacity,
            fontFamily: "'Aeonik', sans-serif",
            fontWeight: 500,
            fontSize: 112,
            letterSpacing: '-0.036em',
            color: '#FFFFFF',
            whiteSpace: 'nowrap',
          }}
        >
          z-automation
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================
// Master 1:1 Composition (1920 x 1080, 60 FPS, 890 Frames = 14.833s)
// ============================================================================
export const ZAutomationLaunch: React.FC<ZAutomationLaunchProps> = ({
  audioSrc = 'assets/audio/z-launch-1to1.wav',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const timeSec = frame / fps;

  // Authentic Z-Automation Website Font Faces (Aeonik Regular & Medium)
  const aeonikRegularUrl = staticFile('assets/fonts/Aeonik-Regular.woff2');
  const aeonikMediumUrl = staticFile('assets/fonts/Aeonik-Medium.woff2');

  // Final Cinematic Fade-to-Black matching Ref F401-F436 (13.33s -> 14.50s)
  const fadeToBlack = interpolate(timeSec, [13.33, 14.48], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#000000',
        fontFamily: "'Aeonik', -apple-system, BlinkMacSystemFont, sans-serif",
        overflow: 'hidden',
      }}
    >
      <style>
        {`
          @font-face {
            font-family: 'Aeonik';
            src: url('${aeonikRegularUrl}') format('woff2');
            font-weight: 400;
            font-style: normal;
          }
          @font-face {
            font-family: 'Aeonik';
            src: url('${aeonikMediumUrl}') format('woff2');
            font-weight: 500 700;
            font-style: normal;
          }
        `}
      </style>

      {/* Acts 2, 3 & 4 Shared Cobalt Sky World (Rendered underneath Act 1 from 3.90s so the portal zoom seamlessly reveals it!) */}
      {timeSec >= 3.90 ? (
        <AbsoluteFill>
          <CobaltSkyBackdrop timeSec={timeSec} />

          {/* Act 2: 3D OpenClaw Foreground Fly-By + 3D Hermes Portrait Float + Mini OpenClaw */}
          {timeSec <= 7.26 ? (
            <AbsoluteFill>
              <Sanctum3DMascots timeSec={timeSec} width={1920} height={1080} />
            </AbsoluteFill>
          ) : null}

          {/* Act 2: Centered 3-Line Aeonik Typography ("Bangun Sistem / Otomasi / sekarang") */}
          <Act2HeroText timeSec={timeSec} />

          {/* Act 3: Left-Side Rubber-Band Stretch Headline ("lewat Web 3D / dan Agen AI") */}
          <Act3RubberHeadline timeSec={timeSec} />

          {/* Act 3: 3D Extruded Titanium iPhone Showcase with Real z-automation.my.id Screenshot */}
          <Phone3DShowcase timeSec={timeSec} />

          {/* Act 4: Mascot Spin-In, Squash-&-Stretch Bounce & "z-automation" Lockup */}
          <Act4BrandLockup timeSec={timeSec} />
        </AbsoluteFill>
      ) : null}

      {/* Act 1: Liquid Glass Input Pill, Macro Pan & 3D Frosted Glass Cursor Portal (0.00s - 4.03s) */}
      <Act1LiquidGlassIntro timeSec={timeSec} />

      {/* Final Fade to Black (13.33s -> 14.48s, holding clean black to 14.83s) */}
      {fadeToBlack > 0.001 ? (
        <AbsoluteFill
          style={{
            backgroundColor: '#000000',
            opacity: fadeToBlack,
            pointerEvents: 'none',
          }}
        />
      ) : null}

      {/* Frame-Locked Foley + 120 BPM Rhodes/Synth-Funk Audio */}
      {audioSrc ? <Audio src={staticFile(audioSrc)} volume={1} /> : null}
    </AbsoluteFill>
  );
};
