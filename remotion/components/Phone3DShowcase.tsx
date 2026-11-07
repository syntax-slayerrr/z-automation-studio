import React from 'react';
import { Easing, Img, interpolate, spring, staticFile, useVideoConfig } from 'remotion';

export interface Phone3DShowcaseProps {
  /** Current timeline time in seconds */
  timeSec: number;
  /** Shared vertical camera whip-tilt progress (0 = Act 2, 1 = Act 3 arrived) */
  camTiltProgress: number;
  /** Shared vertical shutter blur amount (px) during Act 2 -> Act 3 camera tilt */
  tiltBlurY?: number;
}

const EASE_DOCK = Easing.bezier(0.56, 0.0, 0.18, 1.0);
const EASE_SPIN_ACCEL = Easing.bezier(0.62, 0.0, 0.96, 0.68);

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export const Phone3DShowcase: React.FC<Phone3DShowcaseProps> = ({
  timeSec,
  camTiltProgress,
  tiltBlurY = 0,
}) => {
  const { fps } = useVideoConfig();

  // Active from start of shared camera tilt (6.82s) until exact 90-deg match-spin (10.70s)
  if (timeSec < 6.82 || timeSec >= 10.705) {
    return null;
  }

  // Smooth spring settle layered on top of shared camera whip-tilt so arrival feels weightless & fluid
  const settleSpring = spring({
    frame: Math.max(0, (timeSec - 6.86) * fps),
    fps,
    config: { damping: 18, stiffness: 115, mass: 0.9 },
  });

  // Continuous drift from 7.0s -> 8.55s (never freezes at velocity = 0!)
  const pContinuousMacro = clamp01((timeSec - 7.05) / (8.55 - 7.05));

  // Smooth S-curve dock to right third (8.44s -> 9.04s)
  const pDock = EASE_DOCK(clamp01((timeSec - 8.44) / (9.04 - 8.44)));

  // Exact 90-degree Y-axis angular acceleration match-cut (10.48s -> 10.70s)
  const pWhip = EASE_SPIN_ACCEL(clamp01((timeSec - 10.48) / (10.70 - 10.48)));

  // Continuous ambient breathing float
  const floatY = Math.sin((timeSec - 7.2) * 2.2) * 7 * (1 - pWhip);
  const floatRotY = Math.cos((timeSec - 7.2) * 1.8) * 1.1 * (1 - pWhip);

  // Position X (seamless arc from slight right -> macro center -> right showcase -> center spin axis!)
  const macroX = interpolate(camTiltProgress, [0, 1], [72, -16]);
  const dockedX = 324;
  let posX = macroX * (1 - pDock) + dockedX * pDock;
  posX = interpolate(pWhip, [0, 1], [posX, 0]); // Converges to exact center (x=0) at 90deg!

  // Position Y (unified with Act 2's downward exit via camTiltProgress!)
  const macroEnterY = interpolate(camTiltProgress, [0, 1], [-1220, 148]);
  const macroGlideY = macroEnterY + pContinuousMacro * 68;
  let posY = macroGlideY * (1 - pDock) + 18 * pDock + floatY;
  posY = interpolate(pWhip, [0, 1], [posY, 0]);

  // Scale (Macro 2.02 -> Docked 1.12 -> 0.72 at 90deg match-spin)
  const macroScale =
    interpolate(settleSpring, [0, 1], [1.82, 2.00]) + pContinuousMacro * 0.04;
  let scale = macroScale * (1 - pDock) + 1.12 * pDock;
  scale = interpolate(pWhip, [0, 1], [scale, 0.72]);

  // 3D Rotations (Continuous smooth glide; hits exact -89.5deg edge-on at t = 10.70s!)
  const macroRotY = interpolate(camTiltProgress, [0, 1], [-24, -10.5]) - pContinuousMacro * 2.0;
  let rotY = macroRotY * (1 - pDock) + -31 * pDock + floatRotY;
  rotY = interpolate(pWhip, [0, 1], [rotY, -89.5]);

  const macroRotX = interpolate(camTiltProgress, [0, 1], [13, 3.8]);
  let rotX = macroRotX * (1 - pDock) + 8.5 * pDock;
  rotX = interpolate(pWhip, [0, 1], [rotX, 0]);

  const macroRotZ = interpolate(camTiltProgress, [0, 1], [-8.0, -3.2]) + pContinuousMacro * 0.8;
  let rotZ = macroRotZ * (1 - pDock) + -5.8 * pDock;
  rotZ = interpolate(pWhip, [0, 1], [rotZ, 0]);

  // Lightweight Native GPU Motion Blur during fast moves (zero offscreen SVG VRAM bloat!)
  const motionBlur = Math.max(
    interpolate(pWhip, [0, 0.3, 1], [0, 4, 18]),
    tiltBlurY * (1 - pDock) * 0.75
  );

  // Smooth inertial internal website settle inside the phone screen
  const scrollEase = Easing.bezier(0.22, 0.6, 0.35, 1.0)(
    clamp01((timeSec - 7.05) / 1.25)
  );
  const imgScrollY = interpolate(scrollEase, [0, 1], [-14, 0]);

  // =========================================================================
  // 1. Live 3D Hero Canvas Interactivity Inside Phone Screen (z-automation.my.id)
  // =========================================================================
  // Bi-directional neural synapse packets between Hermes (left) & OpenClaw (right)
  const packetPhase1 = ((timeSec - 6.85) * 0.92) % 1.0;
  const packetAngle1 = Math.PI * (0.84 - packetPhase1 * 0.68);
  const packet1X = 49.5 + Math.cos(packetAngle1) * 25.5;
  const packet1Y = 53.5 - Math.sin(packetAngle1) * 9.5;

  const packetPhase2 = ((timeSec - 6.40) * 0.92) % 1.0;
  const packetAngle2 = Math.PI * (0.16 + packetPhase2 * 0.68);
  const packet2X = 49.5 + Math.cos(packetAngle2) * 25.5;
  const packet2Y = 53.5 - Math.sin(packetAngle2) * 9.5;

  // Interactive Touch-Ripple #1 (7.62s - 8.28s in Macro view) & #2 (9.02s - 9.65s in Docked view)
  const uTouch1 = clamp01((timeSec - 7.62) / 0.62);
  const showTouch1 = timeSec >= 7.62 && timeSec <= 8.26;
  const uTouch2 = clamp01((timeSec - 9.02) / 0.60);
  const showTouch2 = timeSec >= 9.02 && timeSec <= 9.64;

  // Reactive Mascot & Orb Energy Pulse inside the 3D Hero Card triggered by touch!
  const cardEnergyPulse =
    Math.sin(uTouch1 * Math.PI) * (showTouch1 ? 1 : 0) +
    Math.sin(uTouch2 * Math.PI) * (showTouch2 ? 0.85 : 0);

  // =========================================================================
  // 2. Angle-Reactive Apple Specular Glint & Anisotropic Glass Sheen
  // Coupled directly to 3D rotations (rotY: -10.5 -> -31 -> -89.5, rotX: 13 -> 3.8 -> 8.5)
  // =========================================================================
  const sheenPosPct = 16 + (-rotY - 10) * 2.15 + rotX * 1.4;
  const chamferGlintTopPct = clamp01((-rotY - 8) / 32) * 58 + 12;
  const spinEdgeFlash = clamp01((timeSec - 10.46) / 0.24);

  const CHASSIS_W = 416;
  const CHASSIS_H = 870;
  const RADIUS = 58;
  const SCREEN_RADIUS = 46;
  const extrusionSlices = Array.from({ length: 14 }, (_, i) => i + 1);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: 1800,
        pointerEvents: 'none',
        filter: motionBlur > 0.3 ? `blur(${motionBlur.toFixed(1)}px)` : undefined,
      }}
    >
      {/* Warm Golden-Peach & Soft Violet Halo Behind Phone */}
      <div
        style={{
          position: 'absolute',
          width: 640,
          height: 980,
          borderRadius: '50%',
          transform: `translate3d(${posX + 26}px, ${posY + 10}px, 0px) scale(${scale})`,
          opacity: 1 - pWhip * 0.7,
          background:
            'radial-gradient(52% 52% at 58% 52%, rgba(255, 198, 138, 0.88) 0%, rgba(255, 166, 158, 0.52) 38%, rgba(196, 178, 255, 0.28) 64%, rgba(26, 47, 251, 0) 100%)',
          filter: 'blur(36px)',
        }}
      />

      {/* 3D Preserved-Space Phone Assembly */}
      <div
        style={{
          width: CHASSIS_W,
          height: CHASSIS_H,
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: `translate3d(${posX}px, ${posY}px, 0px) scale(${scale}) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`,
        }}
      >
        {/* Solid Extruded Titanium Side Rail Layers with Angle-Reactive Anisotropic Glint */}
        {extrusionSlices.map((idx) => {
          const z = -idx * 1.3;
          const isBackEdge = idx >= 13;
          const isButtonRegion = idx >= 5 && idx <= 10;
          return (
            <div
              key={idx}
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: RADIUS,
                transform: `translateZ(${z}px)`,
                background: isBackEdge
                  ? '#1E2433'
                  : `linear-gradient(${168 + rotY * 0.6}deg, #F5F8FF 0%, #B8C2D8 ${Math.max(10, chamferGlintTopPct - 18)}%, #FFFFFF ${chamferGlintTopPct}%, #8996B2 ${Math.min(90, chamferGlintTopPct + 22)}%, #E2E8F6 100%)`,
                border: '1px solid rgba(255, 255, 255, 0.62)',
                boxShadow: isBackEdge
                  ? '0 32px 70px rgba(8, 18, 56, 0.42)'
                  : undefined,
              }}
            >
              {isButtonRegion ? (
                <div
                  style={{
                    position: 'absolute',
                    right: -2,
                    top: 235,
                    width: 3,
                    height: 78,
                    borderRadius: 2,
                    background: 'linear-gradient(180deg, #FFFFFF, #7D88A3, #DCE3F2)',
                  }}
                />
              ) : null}
            </div>
          );
        })}

        {/* Front Obsidian Glass Bezel Frame */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: RADIUS,
            background: '#0A0C12',
            padding: 13,
            boxSizing: 'border-box',
            border: '1.5px solid rgba(255, 255, 255, 0.48)',
            boxShadow:
              'inset 0 0 0 1.5px rgba(255,255,255,0.18), 0 0 28px rgba(255, 206, 156, 0.35)',
            transform: 'translateZ(0px)',
          }}
        >
          {/* Angle-Reactive Specular Edge Glint Riding Along Right Titanium Bezel Chamfer */}
          <div
            style={{
              position: 'absolute',
              right: -1.5,
              top: `${chamferGlintTopPct - 14}%`,
              width: 4,
              height: '28%',
              borderRadius: 999,
              background:
                'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,248,235,0.98) 50%, rgba(255,255,255,0) 100%)',
              boxShadow: '0 0 12px 2px rgba(255, 244, 224, 0.85)',
              filter: 'blur(0.5px)',
              pointerEvents: 'none',
              zIndex: 20,
            }}
          />

          {/* Top Curve Specular Chamfer Glint */}
          <div
            style={{
              position: 'absolute',
              top: -1.5,
              left: `${22 + (-rotY - 10) * 1.1}%`,
              width: '34%',
              height: 3.5,
              borderRadius: 999,
              background:
                'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0) 100%)',
              filter: 'blur(0.5px)',
              pointerEvents: 'none',
              zIndex: 20,
            }}
          />

          {/* Inner 390 x 844 Retina OLED Screen */}
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: SCREEN_RADIUS,
              backgroundColor: '#F0F1FA',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Authentic Z-Automation Mobile Home Hero (z-automation.my.id) */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                transform: `translateY(${imgScrollY.toFixed(2)}px)`,
              }}
            >
              <Img
                src={staticFile('assets/screenshots/mobile-home-full.png')}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'top center',
                  display: 'block',
                }}
              />

              {/* Live 3D Hero Canvas Overlay (Exact Bounds of Dark 3D Card: Y=20.6%..94.6%, X=3.85%..96.07%) */}
              <div
                style={{
                  position: 'absolute',
                  left: '3.85%',
                  right: '3.93%',
                  top: '20.62%',
                  height: '74.0%',
                  borderRadius: 18,
                  overflow: 'hidden',
                  pointerEvents: 'none',
                }}
              >
                {/* Live Animated Neural Synapse Bridge Arc (Hermes <-> OpenClaw) */}
                <svg
                  viewBox="0 0 360 620"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    overflow: 'visible',
                  }}
                >
                  <defs>
                    <linearGradient id="synapse-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="rgba(0, 245, 212, 0.85)" />
                      <stop offset="50%" stopColor="rgba(165, 225, 255, 0.95)" />
                      <stop offset="100%" stopColor="rgba(255, 92, 112, 0.85)" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 82 286 Q 180 218 268 274"
                    fill="none"
                    stroke="url(#synapse-grad)"
                    strokeWidth={1.8 + cardEnergyPulse * 1.4}
                    strokeDasharray="4 7"
                    strokeDashoffset={-(timeSec * 38)}
                    opacity={0.55 + cardEnergyPulse * 0.42}
                  />
                </svg>

                {/* Reactive Ambient Aura on Hermes (Left, X=18%, Y=56%) */}
                <div
                  style={{
                    position: 'absolute',
                    left: '4%',
                    top: '38%',
                    width: 145,
                    height: 165,
                    borderRadius: '50%',
                    background:
                      'radial-gradient(circle, rgba(0, 245, 212, 0.34) 0%, rgba(44, 136, 255, 0.16) 52%, rgba(0,0,0,0) 75%)',
                    opacity: 0.35 + cardEnergyPulse * 0.65,
                    transform: `scale(${1 + cardEnergyPulse * 0.18})`,
                    mixBlendMode: 'screen',
                  }}
                />

                {/* Reactive Ambient Aura on OpenClaw (Right, X=74%, Y=52%) */}
                <div
                  style={{
                    position: 'absolute',
                    right: '4%',
                    top: '34%',
                    width: 155,
                    height: 155,
                    borderRadius: '50%',
                    background:
                      'radial-gradient(circle, rgba(255, 90, 108, 0.38) 0%, rgba(255, 160, 120, 0.16) 52%, rgba(0,0,0,0) 75%)',
                    opacity: 0.32 + cardEnergyPulse * 0.68,
                    transform: `scale(${1 + cardEnergyPulse * 0.20})`,
                    mixBlendMode: 'screen',
                  }}
                />

                {/* OpenClaw Antenna Tip Live Telemetry Sparks */}
                <div
                  style={{
                    position: 'absolute',
                    left: '64.2%',
                    top: '35.8%',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 0 10px 3px rgba(193, 255, 0, 0.9)',
                    opacity: 0.45 + 0.55 * Math.sin(timeSec * 9.5) + cardEnergyPulse * 0.4,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    left: '83.0%',
                    top: '35.6%',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 0 10px 3px rgba(193, 255, 0, 0.9)',
                    opacity: 0.45 + 0.55 * Math.cos(timeSec * 9.5) + cardEnergyPulse * 0.4,
                  }}
                />

                {/* Packet 1: Forward Cyan Neural Impulse (Hermes -> OpenClaw) */}
                <div
                  style={{
                    position: 'absolute',
                    left: `${packet1X}%`,
                    top: `${packet1Y - 10.5}%`,
                    width: 11,
                    height: 11,
                    marginLeft: -5.5,
                    marginTop: -5.5,
                    borderRadius: '50%',
                    background: '#00F5D4',
                    boxShadow:
                      '0 0 14px 4px rgba(0, 245, 212, 0.9), 0 0 28px 8px rgba(26, 47, 251, 0.6)',
                  }}
                />

                {/* Packet 2: Return Ice-White Response Impulse (OpenClaw -> Hermes) */}
                <div
                  style={{
                    position: 'absolute',
                    left: `${packet2X}%`,
                    top: `${packet2Y - 10.5}%`,
                    width: 8,
                    height: 8,
                    marginLeft: -4,
                    marginTop: -4,
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    boxShadow:
                      '0 0 12px 3px rgba(140, 215, 255, 0.92), 0 0 22px 6px rgba(255, 92, 112, 0.55)',
                  }}
                />

                {/* Interactive iOS Glass Touch-Ripple #1 (Macro View @ 7.62s) & #2 (Docked @ 9.02s) */}
                {showTouch1 || showTouch2 ? (
                  <div
                    style={{
                      position: 'absolute',
                      left: showTouch1 ? '51%' : '68%',
                      top: showTouch1 ? '46%' : '48%',
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    {/* Outer Refractive Shockwave Ring */}
                    <div
                      style={{
                        width: interpolate(showTouch1 ? uTouch1 : uTouch2, [0, 1], [22, 148]),
                        height: interpolate(showTouch1 ? uTouch1 : uTouch2, [0, 1], [22, 148]),
                        borderRadius: '50%',
                        border: '2px solid rgba(165, 238, 255, 0.92)',
                        background:
                          'radial-gradient(circle, rgba(255,255,255,0.45) 0%, rgba(0,245,212,0.22) 48%, rgba(26,47,251,0) 76%)',
                        boxShadow: '0 0 24px rgba(0, 245, 212, 0.55)',
                        opacity: 1 - Math.pow(showTouch1 ? uTouch1 : uTouch2, 1.35),
                      }}
                    />
                    {/* Crisp Center Touch Dot */}
                    <div
                      style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        width: 18,
                        height: 18,
                        marginLeft: -9,
                        marginTop: -9,
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255, 255, 255, 0.92)',
                        boxShadow: '0 0 14px 4px rgba(165, 238, 255, 0.9)',
                        opacity: 1 - clamp01((showTouch1 ? uTouch1 : uTouch2) * 2.2),
                        transform: `scale(${1 - (showTouch1 ? uTouch1 : uTouch2) * 0.4})`,
                      }}
                    />
                  </div>
                ) : null}
              </div>
            </div>

            {/* Crisp Top iOS Status Bar + Dynamic Island (Transparent background so Home Hero sits naturally) */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 34,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 24px 0 26px',
                boxSizing: 'border-box',
              }}
            >
              <span
                style={{
                  fontFamily: "'Aeonik', -apple-system, sans-serif",
                  fontWeight: 600,
                  fontSize: 13,
                  color: '#0D0F17',
                  letterSpacing: '-0.02em',
                }}
              >
                9:41
              </span>

              <div
                style={{
                  width: 90,
                  height: 23,
                  borderRadius: 999,
                  backgroundColor: '#0A0C12',
                  boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.18)',
                }}
              />

              <svg width="54" height="12" viewBox="0 0 54 12" fill="none">
                <rect x="0" y="7" width="2.5" height="4" rx="1" fill="#0D0F17" />
                <rect x="4" y="5.5" width="2.5" height="5.5" rx="1" fill="#0D0F17" />
                <rect x="8" y="3.5" width="2.5" height="7.5" rx="1" fill="#0D0F17" />
                <rect x="12" y="1.5" width="2.5" height="9.5" rx="1" fill="#0D0F17" />
                <path
                  d="M24 3.5C26.5 1.5 29.5 1.5 32 3.5M25.8 6C27.2 4.8 28.8 4.8 30.2 6"
                  stroke="#0D0F17"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
                <circle cx="28" cy="8.8" r="1.2" fill="#0D0F17" />
                <rect
                  x="37"
                  y="2"
                  width="13"
                  height="8"
                  rx="2.2"
                  stroke="#0D0F17"
                  strokeWidth="1.2"
                />
                <rect x="38.8" y="3.6" width="9.4" height="4.8" rx="1" fill="#0D0F17" />
                <rect x="51.2" y="4.5" width="1.5" height="3" rx="0.7" fill="#0D0F17" />
              </svg>
            </div>

            {/* Bottom iOS Home Indicator */}
            <div
              style={{
                position: 'absolute',
                bottom: 6,
                left: '50%',
                width: 116,
                height: 4,
                marginLeft: -58,
                borderRadius: 999,
                backgroundColor: 'rgba(13, 15, 23, 0.55)',
              }}
            />

            {/* Angle-Reactive Apple Anisotropic Glass Reflection Sweep */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(118deg, rgba(255,255,255,0) ${sheenPosPct - 24}%, rgba(255,255,255,0.06) ${sheenPosPct - 10}%, rgba(255,255,255,0.26) ${sheenPosPct}%, rgba(210,235,255,0.08) ${sheenPosPct + 12}%, rgba(255,255,255,0) ${sheenPosPct + 26}%)`,
                pointerEvents: 'none',
              }}
            />

            {/* 90-Degree Match-Spin Specular Flash */}
            {spinEdgeFlash > 0.01 ? (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: '#FFFFFF',
                  opacity: spinEdgeFlash * 0.55,
                  pointerEvents: 'none',
                }}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
