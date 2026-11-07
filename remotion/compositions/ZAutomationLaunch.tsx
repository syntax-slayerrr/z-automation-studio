import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  spring,
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
// Seamless Continuous Apple / Lusion Easing Curves
// ============================================================================
const EASE_OUT_EXPO = Easing.bezier(0.16, 1.0, 0.3, 1.0);
const EASE_MACRO_PUSH = Easing.bezier(0.22, 0.88, 0.28, 1.0);
const EASE_WHIP_PAN = Easing.bezier(0.64, 0.0, 0.20, 1.0);
const EASE_CURSOR_GLIDE = Easing.bezier(0.20, 0.95, 0.30, 1.0);
const EASE_CURSOR_EXIT = Easing.bezier(0.42, 0.0, 0.85, 0.62);
const EASE_CAMERA_TILT = Easing.bezier(0.50, 0.0, 0.16, 1.0);
const EASE_RUBBER_SNAP = Easing.bezier(0.16, 1.0, 0.30, 1.0);
const EASE_SPIN_ACCEL = Easing.bezier(0.62, 0.0, 0.96, 0.68);
const EASE_SPIN_DECEL = Easing.bezier(0.06, 0.74, 0.20, 1.0);

// Exact millisecond-synced keystroke timestamps for "z-automation.my.id" (18 chars)
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

function smoothBell(t: number, start: number, end: number): number {
  if (t <= start || t >= end) return 0;
  const u = (t - start) / (end - start);
  const s = Math.sin(u * Math.PI);
  return s * s; // C1-continuous zero-derivative entry & exit!
}

// ============================================================================
// Minimalist Pure-White Z-Automation Mascot Mark (Act 4 Lockup)
// ============================================================================
const ZMascotEmblem: React.FC<{ size?: number }> = ({ size = 308 }) => {
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
          <circle cx="76" cy="92" r="12.5" fill="black" />
          <circle cx="124" cy="92" r="12.5" fill="black" />
          <path
            d="M78 117 C78 114, 122 114, 122 117 C122 138, 78 138, 78 117 Z"
            fill="black"
          />
        </mask>
      </defs>

      <g mask="url(#z-mascot-cutout)">
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

        <rect x="24" y="38" width="152" height="122" rx="61" fill="#FFFFFF" />
        <circle cx="24" cy="104" r="18" fill="#FFFFFF" />
        <circle cx="176" cy="104" r="18" fill="#FFFFFF" />
      </g>

      <path
        d="M89 130 C94 125, 106 125, 111 130 C106 134, 94 134, 89 130 Z"
        fill="#FFFFFF"
      />
    </svg>
  );
};

// ============================================================================
// 4-Point Concave Sparkle Star SVG
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
// Shared Bright Z-Automation Cobalt Sky World (Acts 2, 3 & 4)
// Includes Subtle Camera Parallax on Act 1->2 Portal Arrival & Act 2->3 Tilt!
// ============================================================================
const CobaltSkyBackdrop: React.FC<{
  timeSec: number;
  camTiltProgress: number;
}> = ({ timeSec, camTiltProgress }) => {
  const rackBlur = interpolate(timeSec, [3.95, 4.55], [14, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Continues forward camera momentum as we fly through the Act 1 portal!
  const pPortalSettle = EASE_OUT_EXPO(clamp01((timeSec - 3.92) / 0.68));
  const bgScale = interpolate(pPortalSettle, [0, 1], [1.14, 1.0]);

  // Subtle parallax downward shift when camera tilts up to catch the 3D iPhone
  const parallaxY = camTiltProgress * 115;
  const drift = timeSec - 4.0;

  return (
    <AbsoluteFill
      style={{
        background:
          'linear-gradient(180deg, #2C88FF 0%, #0E5BFF 46%, #1A2FFB 100%)',
        overflow: 'hidden',
        transform: `scale(${bgScale.toFixed(4)})`,
        filter: rackBlur > 0.15 ? `blur(${rackBlur.toFixed(2)}px)` : undefined,
      }}
    >
      {/* Top-Left Soft Sky-Periwinkle Cloud */}
      <div
        style={{
          position: 'absolute',
          left: -180 + Math.sin(drift * 0.4) * 28,
          top: -160 + parallaxY * 0.45,
          width: 780,
          height: 540,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(168, 218, 255, 0.72) 0%, rgba(120, 190, 255, 0) 70%)',
          filter: 'blur(55px)',
        }}
      />

      {/* Bottom-Left Warm Coral-Peach Cloud */}
      <div
        style={{
          position: 'absolute',
          left: -150 + Math.cos(drift * 0.35) * 30,
          bottom: -210 - parallaxY * 0.35,
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
          top: -150 + Math.sin(drift * 0.45) * 24 + parallaxY * 0.4,
          width: 860,
          height: 600,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(182, 226, 255, 0.78) 0%, rgba(132, 200, 255, 0) 72%)',
          filter: 'blur(56px)',
        }}
      />

      {/* Bottom-Right Fresh Mint-Lime Cloud */}
      <div
        style={{
          position: 'absolute',
          right: -180 + Math.cos(drift * 0.38) * 32,
          bottom: -190 - parallaxY * 0.35,
          width: 920,
          height: 760,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(114, 238, 132, 0.84) 0%, rgba(193, 255, 110, 0.42) 45%, rgba(26, 47, 251, 0) 74%)',
          filter: 'blur(64px)',
        }}
      />

      {/* Large Green 4-Point Star */}
      <FourPointStar
        size={215}
        color="#3FE659"
        rotateDeg={-4 + Math.sin(drift * 1.1) * 5}
        style={{
          right: 175 + Math.sin(drift * 0.7) * 18,
          bottom: 58 + Math.cos(drift * 0.6) * 16 - parallaxY * 0.18,
          opacity: 0.96,
        }}
      />

      {/* Medium Crisp White 4-Point Star */}
      <FourPointStar
        size={78}
        color="#FFFFFF"
        rotateDeg={8 + Math.cos(drift * 1.3) * 8}
        style={{
          left: 295 + Math.cos(drift * 0.8) * 22,
          bottom: 195 + Math.sin(drift * 0.9) * 18 - parallaxY * 0.22,
          opacity: 0.96,
        }}
      />

      {/* Tiny Upper Sparkles & Micro-Confetti Diamonds */}
      <FourPointStar
        size={18}
        color="rgba(255,255,255,0.75)"
        style={{
          left: 590,
          top: 95 + Math.sin(drift * 1.4) * 10 + parallaxY * 0.25,
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: 525,
          top: 325 + Math.cos(drift * 1.2) * 12 + parallaxY * 0.2,
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
          bottom: 265 + Math.sin(drift * 1.5) * 14 - parallaxY * 0.2,
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
// Act 1 (0.00s - 4.06s): Continuous Camera Drift, Whip-Pan Shutter Blur &
// True Geometric SVG Rounded-Pill Portal Mask!
// ============================================================================
const Act1LiquidGlassIntro: React.FC<{ timeSec: number }> = ({ timeSec }) => {
  if (timeSec > 4.06) return null;

  // 1. Pill Entrance Scale & Rack Focus (0.00s -> 0.56s)
  const pIntro = EASE_OUT_EXPO(clamp01(timeSec / 0.56));
  const introScale = interpolate(pIntro, [0, 1], [0.28, 1.0]);
  const introBlur = interpolate(clamp01(timeSec / 0.45), [0, 1], [18, 0]);
  const introOpacity = interpolate(clamp01(timeSec / 0.18), [0, 1], [0, 1]);

  // 2. Overlapping Camera Push -> Continuous Drift -> Whip-Pan -> Portal Plunge (ZERO dead-stop!)
  const pPush = EASE_MACRO_PUSH(clamp01((timeSec - 0.50) / (1.96 - 0.50)));
  const pPan = EASE_WHIP_PAN(clamp01((timeSec - 1.94) / (2.38 - 1.94)));
  const ambientZoomDrift = clamp01((timeSec - 1.8) / 2.0) * 0.08;

  // Exponential Portal Plunge right through the "Mulai Otomasi" capsule (3.72s -> 4.05s)
  const uPortal = clamp01((timeSec - 3.72) / (4.05 - 3.72));
  const portalScaleMult = 1.0 + Math.pow(uPortal, 2.85) * 8.2;

  const baseRigScale =
    (interpolate(pPush, [0, 1], [0.43, 1.84]) + ambientZoomDrift) *
    introScale *
    portalScaleMult;

  // Continuous horizontal pan + gentle cursor-following micro-drift; re-centers on button portal during plunge!
  const rawPanX =
    interpolate(pPush, [0, 1], [0, 355]) +
    interpolate(pPan, [0, 1], [0, -740]) +
    Math.sin(timeSec * 1.4) * 6 * (1 - uPortal);
  // As uPortal -> 1, shift panX slightly toward -436 so the expanding button center (local +436) aligns dead-center on screen!
  const panX = interpolate(Math.pow(uPortal, 1.8), [0, 1], [rawPanX, -436]);

  // True Horizontal Shutter Blur during the fast Whip-Pan (1.94s -> 2.38s)!
  const whipPanBlurX = smoothBell(timeSec, 1.94, 2.40) * 11.5;

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

  // 3D Frosted Glass Cursor Choreography (2.66s -> 3.74s)
  const showCursor = timeSec >= 2.66 && timeSec <= 3.76;
  const pCurIn = EASE_CURSOR_GLIDE(clamp01((timeSec - 2.66) / (3.08 - 2.66)));
  const pCurExit = EASE_CURSOR_EXIT(clamp01((timeSec - 3.38) / (3.74 - 3.38)));

  const pressPulse = smoothBell(timeSec, 3.10, 3.35);

  const curX =
    interpolate(pCurIn, [0, 1], [-580, -34]) +
    interpolate(pCurExit, [0, 1], [0, 480]);
  const curY =
    interpolate(pCurIn, [0, 1], [-195, 10]) +
    interpolate(pCurExit, [0, 1], [0, 75]);
  const curScale = 1.0 - pressPulse * 0.18;

  const btnScale = 1.0 - pressPulse * 0.045;
  const btnFlood = EASE_OUT_EXPO(clamp01((timeSec - 3.20) / (3.68 - 3.20)));
  const initialWhiteBtnGlow = 1.0 - pPan;

  const uRipple = clamp01((timeSec - 3.14) / 0.34);
  const showRipple = timeSec >= 3.14 && timeSec <= 3.48;

  // =========================================================================
  // True Geometric Rounded-Pill Portal Mask Coordinates in 1920x1080 Space!
  // Local button center relative to 1460x284 pill center is (+436, 0).
  // CSS transform on pill is `scale(baseRigScale) translate3d(panX, 0, 0)`,
  // so screenPos = 960 + baseRigScale * (panX + 436)!
  // =========================================================================
  const portalOpenOpacity = EASE_OUT_EXPO(clamp01((timeSec - 3.58) / (3.92 - 3.58)));
  const holeCenterX = 960 + baseRigScale * (panX + 436);
  const holeCenterY = 540;
  // Inset by 3px locally so the glowing frosted button rim frames the expanding portal edge!
  const holeW = Math.max(0, (500 - 6) * btnScale * baseRigScale);
  const holeH = Math.max(0, (196 - 6) * btnScale * baseRigScale);
  const holeRx = holeH / 2;

  const totalAct1Blur = Math.max(introBlur, whipPanBlurX * 0.55);

  return (
    <AbsoluteFill
      style={{
        overflow: 'hidden',
        maskImage: portalOpenOpacity > 0.005 ? 'url(#act1-portal-mask)' : undefined,
        WebkitMaskImage:
          portalOpenOpacity > 0.005 ? 'url(#act1-portal-mask)' : undefined,
      }}
    >
      {/* Geometric SVG Portal Mask Definition */}
      {portalOpenOpacity > 0.005 ? (
        <svg width="0" height="0" style={{ position: 'absolute' }}>
          <defs>
            <mask id="act1-portal-mask">
              <rect x="0" y="0" width="1920" height="1080" fill="white" />
              <rect
                x={holeCenterX - holeW / 2}
                y={holeCenterY - holeH / 2}
                width={holeW}
                height={holeH}
                rx={holeRx}
                ry={holeRx}
                fill="black"
                fillOpacity={portalOpenOpacity}
              />
            </mask>
          </defs>
        </svg>
      ) : null}

      {/* Dark Atmospheric Bokeh Backdrop */}
      <AbsoluteFill style={{ backgroundColor: '#061017' }}>
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
      </AbsoluteFill>

      {/* Camera Rig Centering the High-DPI Liquid Glass Pill */}
      <AbsoluteFill
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: introOpacity,
          filter: totalAct1Blur > 0.25 ? `blur(${totalAct1Blur.toFixed(1)}px)` : undefined,
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
            background:
              'linear-gradient(122deg, rgba(155, 214, 248, 0.16) 0%, rgba(36, 78, 108, 0.28) 28%, rgba(145, 218, 255, 0.30) 56%, rgba(28, 66, 92, 0.32) 82%, rgba(175, 232, 255, 0.22) 100%)',
            border: '3px solid rgba(186, 236, 255, 0.72)',
            boxShadow:
              '0 0 55px rgba(96, 198, 255, 0.26), inset 0 4px 26px rgba(255, 255, 255, 0.32), inset 0 -6px 28px rgba(90, 195, 255, 0.25)',
          }}
        >
          {/* Top Specular Caustic Hotspot Streak */}
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
          {/* Right Curve Caustic Specular Rim Glow */}
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

          {/* Left Input Field: Crisp Typed Domain */}
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
              border: '3px solid rgba(176, 234, 255, 0.72)',
              boxShadow:
                'inset 0 6px 20px rgba(215, 245, 255, 0.38), inset 0 -6px 18px rgba(0, 0, 0, 0.55), 0 8px 28px rgba(0, 0, 0, 0.35)',
            }}
          >
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

            <span
              style={{
                fontFamily: "'Aeonik', sans-serif",
                fontWeight: 500,
                fontSize: 52,
                letterSpacing: '-0.02em',
                ...(initialWhiteBtnGlow > 0.5
                  ? { color: '#3988C4' }
                  : {
                      backgroundImage:
                        'linear-gradient(90deg, #6AC2FF 0%, #BEE5FF 36%, #FFFFFF 72%)',
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      color: 'transparent',
                      WebkitTextFillColor: 'transparent',
                    }),
                opacity: 1 - btnFlood * 0.96,
                position: 'relative',
                zIndex: 1,
              }}
            >
              Mulai Otomasi
            </span>

            {/* Frosted Luminous Portal Flood */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 999,
                opacity: btnFlood,
                background:
                  'radial-gradient(110% 130% at 38% 45%, rgba(236, 248, 255, 0.94) 0%, rgba(155, 218, 255, 0.85) 55%, rgba(112, 198, 255, 0.80) 100%)',
                boxShadow: 'inset 0 0 38px rgba(255, 255, 255, 0.95)',
                zIndex: 2,
              }}
            />

            {/* Circular Frosted Click Shock-Ripple */}
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

          {/* 3D Frosted Glass Dart Cursor */}
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
                  <linearGradient
                    id="glass-cursor-fill"
                    x1="12"
                    y1="14"
                    x2="156"
                    y2="96"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0%" stopColor="rgba(165, 228, 255, 0.52)" />
                    <stop offset="55%" stopColor="rgba(235, 250, 255, 0.82)" />
                    <stop offset="100%" stopColor="rgba(255, 255, 255, 0.96)" />
                  </linearGradient>
                  <linearGradient
                    id="glass-cursor-rim"
                    x1="10"
                    y1="10"
                    x2="162"
                    y2="80"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0%" stopColor="#8EE4FF" />
                    <stop offset="65%" stopColor="#FFFFFF" />
                    <stop offset="100%" stopColor="#C2F0FF" />
                  </linearGradient>
                </defs>
                <path
                  d="M18 18 L158 66 L26 112 L46 66 Z"
                  fill="url(#glass-cursor-fill)"
                  stroke="url(#glass-cursor-rim)"
                  strokeWidth="4.5"
                  strokeLinejoin="round"
                />
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
// Act 2 Typography (4.80s - 7.56s):
// Bound to the EXACT Shared Camera Whip-Tilt + Vertical Shutter Blur!
// ============================================================================
const Act2HeroText: React.FC<{
  timeSec: number;
  camTiltProgress: number;
  tiltBlurY: number;
}> = ({ timeSec, camTiltProgress, tiltBlurY }) => {
  const { fps } = useVideoConfig();
  if (timeSec < 4.78 || timeSec > 7.56) return null;

  // Silky spring pop-ins with subtle continuous upward breathing float
  const s1 = spring({
    frame: Math.max(0, (timeSec - 4.83) * fps),
    fps,
    config: { damping: 16, stiffness: 190, mass: 0.7 },
  });
  const s2 = spring({
    frame: Math.max(0, (timeSec - 5.00) * fps),
    fps,
    config: { damping: 16, stiffness: 190, mass: 0.7 },
  });
  const s3 = spring({
    frame: Math.max(0, (timeSec - 5.17) * fps),
    fps,
    config: { damping: 15, stiffness: 175, mass: 0.78 },
  });
  const s4 = spring({
    frame: Math.max(0, (timeSec - 5.33) * fps),
    fps,
    config: { damping: 16, stiffness: 190, mass: 0.7 },
  });

  // Bound 1:1 to Phone3DShowcase's 1220px camera crane sweep!
  const ambientFloatY = Math.sin((timeSec - 5.0) * 2.1) * 5 * (1 - camTiltProgress);
  const dropY = camTiltProgress * 1220;

  const shimmerBell = smoothBell(timeSec, 5.56, 6.62);
  const gradPos = interpolate(clamp01((timeSec - 5.56) / 1.06), [0, 1], [120, -20]);

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `translate3d(0px, ${-34 + ambientFloatY + dropY}px, 0px) scaleY(${(1 + tiltBlurY * 0.012).toFixed(3)})`,
        filter: tiltBlurY > 0.35 ? `blur(${(tiltBlurY * 0.65).toFixed(1)}px)` : undefined,
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
            opacity: clamp01((timeSec - 4.83) / 0.12),
            transform: `translateY(${(1 - s1) * 20}px) scale(${0.84 + 0.16 * s1})`,
          }}
        >
          Bangun
        </span>
        <span
          style={{
            opacity: clamp01((timeSec - 5.00) / 0.12),
            transform: `translateY(${(1 - s2) * 20}px) scale(${0.84 + 0.16 * s2})`,
          }}
        >
          Sistem
        </span>
      </div>

      {/* Line 2: "Otomasi" */}
      <div
        style={{
          position: 'relative',
          marginTop: 2,
          marginBottom: 4,
          opacity: clamp01((timeSec - 5.17) / 0.14),
          transform: `translateY(${(1 - s3) * 24}px) scale(${0.82 + 0.18 * s3})`,
        }}
      >
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
          opacity: clamp01((timeSec - 5.33) / 0.12),
          transform: `translateY(${(1 - s4) * 20}px) scale(${0.84 + 0.16 * s4})`,
        }}
      >
        sekarang
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// Act 3 Left-Side Rubber-Band Stretch Typography (8.67s - 10.700s):
// Exact 90-deg Match-Spin at t = 10.700s with Horizontal Shutter Blur!
// ============================================================================
const RubberWord: React.FC<{
  text: string;
  timeSec: number;
  startSec: number;
  fontSize: number;
  fontWeight: number;
  gradient?: string;
}> = ({ text, timeSec, startSec, fontSize, fontWeight, gradient }) => {
  const { fps } = useVideoConfig();
  if (timeSec < startSec) return null;

  // Silky physical elastic settle on horizontal rubber-band snap
  const sp = spring({
    frame: Math.max(0, (timeSec - startSec) * fps),
    fps,
    config: { damping: 14, stiffness: 210, mass: 0.65 },
  });
  const p = EASE_RUBBER_SNAP(clamp01((timeSec - startSec) / 0.30));
  const blend = p * 0.55 + sp * 0.45;

  const opacity = clamp01((timeSec - startSec) / 0.08);
  const scaleX = interpolate(blend, [0, 1], [1.62, 1.0]);
  const scaleY = interpolate(blend, [0, 1], [0.88, 1.0]);

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
  if (timeSec < 8.65 || timeSec >= 10.705) return null;

  // Exact 90-degree Y-axis angular acceleration match-cut (10.48s -> 10.700s)
  const pWhip = EASE_SPIN_ACCEL(clamp01((timeSec - 10.48) / (10.70 - 10.48)));
  const floatY = Math.sin((timeSec - 8.7) * 2.0) * 4 * (1 - pWhip);

  const whipX = interpolate(pWhip, [0, 1], [0, 390]); // Sweeps right into screen center (960px)!
  const whipRotY = interpolate(pWhip, [0, 1], [0, 89.5]); // Exact edge-on 89.5deg at t=10.700s!
  const whipScale = interpolate(pWhip, [0, 1], [1.0, 0.82]);
  const blurX = interpolate(pWhip, [0, 0.3, 1], [0, 5, 24]);

  return (
    <div
      style={{
        position: 'absolute',
        left: 315,
        top: '50%',
        transform: `translate3d(${whipX}px, calc(-52% + ${floatY.toFixed(1)}px), 0px) perspective(1400px) rotateY(${whipRotY}deg) scale(${whipScale})`,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        filter: blurX > 0.35 ? `blur(${(blurX * 0.72).toFixed(1)}px)` : undefined,
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
// Act 4 (10.700s - 14.84s):
// Exact 90° Match-Spin Continuation + Continuous Spring Squash-Bounce & Lockup!
// ============================================================================
const Act4BrandLockup: React.FC<{ timeSec: number }> = ({ timeSec }) => {
  const { fps } = useVideoConfig();
  if (timeSec < 10.70) return null;

  // 1. Seamless continuation out of the 90-degree match-spin (10.700s -> 11.06s)
  const pSpinIn = EASE_SPIN_DECEL(clamp01((timeSec - 10.70) / (11.06 - 10.70)));
  const spinRotY = interpolate(pSpinIn, [0, 1], [-89.5, 0]);
  const spinBlurX = interpolate(pSpinIn, [0, 0.65, 1], [24, 4, 0]);
  const spinScale = interpolate(pSpinIn, [0, 1], [1.75, 1.0]);

  // 2. C1-Continuous Smooth Anticipation Lean -> Joyful Upward Stretch -> Spring Settle!
  // Zero sharp velocity kinks: smooth overlapping sin^2 bells!
  const leanBell = smoothBell(timeSec, 11.30, 11.62); // Peaks at 11.46s (Ref F345!)
  const hopBell = smoothBell(timeSec, 11.52, 11.88);  // Peaks at 11.70s (Ref F351!)

  const mascotSkewX = -21 * leanBell + 6.5 * hopBell;
  const mascotRot = -10.5 * leanBell + 7.0 * hopBell;
  const squashX = 1.0 + 0.22 * leanBell - 0.09 * hopBell;
  const squashY = 1.0 - 0.16 * leanBell + 0.12 * hopBell;
  const hopY = 10 * leanBell - 18 * hopBell;

  // 3. Critically-Damped Physical Springs for Lockup Shrink, Slide & Wordmark Reveal!
  const shrinkSpring = spring({
    frame: Math.max(0, (timeSec - 11.78) * fps),
    fps,
    config: { damping: 16, stiffness: 175, mass: 0.78 },
  });
  const slideSpring = spring({
    frame: Math.max(0, (timeSec - 11.90) * fps),
    fps,
    config: { damping: 16, stiffness: 165, mass: 0.82 },
  });
  const wordSpring = spring({
    frame: Math.max(0, (timeSec - 11.94) * fps),
    fps,
    config: { damping: 15, stiffness: 175, mass: 0.78 },
  });

  // Subtle living breath during final hold so frame feels organically alive
  const holdFloatY = Math.sin((timeSec - 12.0) * 1.8) * 3 * slideSpring;

  const baseScale = spinScale * interpolate(shrinkSpring, [0, 1], [1.0, 0.46]);
  const iconX = interpolate(slideSpring, [0, 1], [0, -345]);

  const showWordmark = timeSec >= 11.93;
  const wordOpacity = clamp01((timeSec - 11.93) / 0.14);
  const wordScaleX = interpolate(wordSpring, [0, 1], [1.18, 1.0]);
  const wordX = interpolate(wordSpring, [0, 1], [-85, -242]);
  const wordClipRight = interpolate(
    EASE_OUT_EXPO(clamp01((timeSec - 11.93) / 0.34)),
    [0, 1],
    [85, 0]
  );

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: 1400,
        filter: spinBlurX > 0.35 ? `blur(${(spinBlurX * 0.72).toFixed(1)}px)` : undefined,
        pointerEvents: 'none',
      }}
    >
      {/* Pure-White Mascot Icon */}
      <div
        style={{
          position: 'absolute',
          transform: `translate3d(${iconX}px, ${(hopY + holdFloatY).toFixed(2)}px, 0px) rotateY(${spinRotY}deg) rotate(${mascotRot}deg) skewX(${mascotSkewX}deg) scale(${(
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
            transform: `translate3d(${wordX}px, ${(-4 + holdFloatY).toFixed(2)}px, 0px) scaleX(${wordScaleX.toFixed(3)})`,
            transformOrigin: 'left center',
            opacity: wordOpacity,
            clipPath:
              wordClipRight > 0.2 ? `inset(-15% ${wordClipRight.toFixed(1)}% -15% -5%)` : undefined,
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
// Master Seamless 1:1 Composition (1920 x 1080, 60 FPS, 890 Frames = 14.833s)
// ============================================================================
export const ZAutomationLaunch: React.FC<ZAutomationLaunchProps> = ({
  audioSrc = 'assets/audio/z-launch-1to1.wav',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const timeSec = frame / fps;

  const aeonikRegularUrl = staticFile('assets/fonts/Aeonik-Regular.woff2');
  const aeonikMediumUrl = staticFile('assets/fonts/Aeonik-Medium.woff2');

  // Shared Unified Camera Whip-Tilt (Act 2 -> Act 3: 6.82s -> 7.56s)
  const camTiltProgress = EASE_CAMERA_TILT(
    clamp01((timeSec - 6.82) / (7.56 - 6.82))
  );
  // Smooth vertical shutter blur peaking right at max camera velocity (~7.12s)!
  const tiltBlurY = smoothBell(timeSec, 6.84, 7.52) * 9.5;

  // Final Cinematic Fade-to-Black (13.33s -> 14.48s)
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

      {/* Acts 2, 3 & 4 Shared Cobalt Sky World (Rendered underneath Act 1 from 3.55s so the true geometric portal hole reveals it!) */}
      {timeSec >= 3.55 ? (
        <AbsoluteFill>
          <CobaltSkyBackdrop
            timeSec={timeSec}
            camTiltProgress={camTiltProgress}
          />

          {/* Act 2: 3D OpenClaw Fly-By + 3D Hermes + Mini OpenClaw */}
          {timeSec <= 7.58 ? (
            <AbsoluteFill>
              <Sanctum3DMascots
                timeSec={timeSec}
                camTiltProgress={camTiltProgress}
                tiltBlurY={tiltBlurY}
                width={1920}
                height={1080}
              />
            </AbsoluteFill>
          ) : null}

          {/* Act 2: Centered 3-Line Aeonik Typography */}
          <Act2HeroText
            timeSec={timeSec}
            camTiltProgress={camTiltProgress}
            tiltBlurY={tiltBlurY}
          />

          {/* Act 3: Left-Side Rubber-Band Stretch Headline */}
          <Act3RubberHeadline timeSec={timeSec} />

          {/* Act 3: 3D Extruded Titanium iPhone Showcase */}
          <Phone3DShowcase
            timeSec={timeSec}
            camTiltProgress={camTiltProgress}
            tiltBlurY={tiltBlurY}
          />

          {/* Act 4: Exact 90° Match-Spin Continuation & Brand Lockup */}
          <Act4BrandLockup timeSec={timeSec} />
        </AbsoluteFill>
      ) : null}

      {/* Act 1: Liquid Glass Pill & True Geometric Portal Window (0.00s - 4.06s) */}
      <Act1LiquidGlassIntro timeSec={timeSec} />

      {/* Final Fade to Black */}
      {fadeToBlack > 0.001 ? (
        <AbsoluteFill
          style={{
            backgroundColor: '#000000',
            opacity: fadeToBlack,
            pointerEvents: 'none',
          }}
        />
      ) : null}

      {/* Apple-Grade Crispy Tactile Sound Design + Real Studio Music Bed */}
      {audioSrc ? <Audio src={staticFile(audioSrc)} volume={1} /> : null}
    </AbsoluteFill>
  );
};
