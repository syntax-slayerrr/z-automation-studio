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

  // Smooth inertial internal website scroll inside the phone screen
  const scrollEase = Easing.bezier(0.22, 0.6, 0.35, 1.0)(
    clamp01((timeSec - 7.10) / 1.35)
  );
  const imgScrollY = interpolate(scrollEase, [0, 1], [-30, 0]);

  // Live glowing packet travelling across Hermes <-> OpenClaw synapse inside the phone screenshot!
  const packetPhase = ((timeSec - 7.0) * 0.85) % 1.0;
  const packetAngle = Math.PI * (0.82 - packetPhase * 0.64);
  const packetX = 50 + Math.cos(packetAngle) * 24;
  const packetY = 53 - Math.sin(packetAngle) * 9;

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
        {/* Solid Extruded Titanium Side Rail Layers */}
        {extrusionSlices.map((idx) => {
          const z = -idx * 1.3;
          const isBackEdge = idx >= 17;
          const isButtonRegion = idx >= 6 && idx <= 12;
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
                  : 'linear-gradient(180deg, #EEF2FA 0%, #B8C2D8 22%, #FFFFFF 46%, #8F9BB5 74%, #DCE3F2 100%)',
                border: '1px solid rgba(255, 255, 255, 0.55)',
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
            border: '1.5px solid rgba(255, 255, 255, 0.42)',
            boxShadow:
              'inset 0 0 0 1.5px rgba(255,255,255,0.14), 0 0 28px rgba(255, 206, 156, 0.35)',
            transform: 'translateZ(0px)',
          }}
        >
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
            {/* Real Z-Automation Mobile Website Screenshot (z-automation.my.id) */}
            <div
              style={{
                position: 'absolute',
                top: 26,
                left: 0,
                right: 0,
                bottom: 0,
                transform: `translateY(${imgScrollY}px)`,
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

              {/* Live Animated Synapse Sparkle Inside the 3D Hero Card */}
              <div
                style={{
                  position: 'absolute',
                  left: '4%',
                  right: '4%',
                  top: '20.5%',
                  height: '73%',
                  borderRadius: 16,
                  overflow: 'hidden',
                  pointerEvents: 'none',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: `${packetX}%`,
                    top: `${packetY}%`,
                    width: 12,
                    height: 12,
                    marginLeft: -6,
                    marginTop: -6,
                    borderRadius: '50%',
                    background: '#00F5D4',
                    boxShadow:
                      '0 0 16px 5px rgba(0, 245, 212, 0.85), 0 0 32px 10px rgba(26, 47, 251, 0.55)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: `linear-gradient(115deg, transparent ${20 + pContinuousMacro * 25}%, rgba(255,255,255,0.08) ${38 + pContinuousMacro * 25}%, transparent ${56 + pContinuousMacro * 25}%)`,
                  }}
                />
              </div>
            </div>

            {/* Clean Editorial Bottom Floating Pill CTA */}
            <div
              style={{
                position: 'absolute',
                left: 20,
                right: 20,
                bottom: 24,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                background:
                  'linear-gradient(180deg, rgba(240,241,250,0) 0%, rgba(240,241,250,0.92) 32%, #F0F1FA 100%)',
                paddingTop: 18,
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: 46,
                  borderRadius: 999,
                  backgroundColor: '#0D0F17',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'Aeonik', sans-serif",
                  fontWeight: 500,
                  fontSize: 15,
                  letterSpacing: '-0.01em',
                  boxShadow: '0 8px 20px rgba(13, 15, 23, 0.18)',
                }}
              >
                Mulai Proyek — z-automation.my.id
              </div>
            </div>

            {/* Crisp Top iOS Status Bar + Dynamic Island */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 38,
                backgroundColor: '#F0F1FA',
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
                  width: 92,
                  height: 24,
                  borderRadius: 999,
                  backgroundColor: '#0A0C12',
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
                bottom: 7,
                left: '50%',
                width: 118,
                height: 4.5,
                marginLeft: -59,
                borderRadius: 999,
                backgroundColor: 'rgba(13, 15, 23, 0.82)',
              }}
            />

            {/* Subtle Glass Screen Diagonal Reflection */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(125deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.03) 26%, transparent 48%)',
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
