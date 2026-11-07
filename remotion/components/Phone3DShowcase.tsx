import React from 'react';
import { Easing, Img, interpolate, staticFile } from 'remotion';

export interface Phone3DShowcaseProps {
  /** Current timeline time in seconds */
  timeSec: number;
}

const EASE_DROP_IN = Easing.bezier(0.18, 0.95, 0.3, 1.0);
const EASE_DOCK = Easing.bezier(0.62, 0.0, 0.22, 1.0);
const EASE_WHIP_OUT = Easing.bezier(0.55, 0.0, 0.95, 0.45);

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export const Phone3DShowcase: React.FC<Phone3DShowcaseProps> = ({ timeSec }) => {
  // Active only during Act 3 + Whip-Spin transition (6.98s -> 10.74s)
  if (timeSec < 6.98 || timeSec > 10.75) {
    return null;
  }

  // ---------------------------------------------------------------------------
  // 1:1 Reference Motion Curves (F211 -> F322)
  // ---------------------------------------------------------------------------
  const pDrop = EASE_DROP_IN(clamp01((timeSec - 7.0) / (7.56 - 7.0)));
  const pMacroDrift = clamp01((timeSec - 7.56) / (8.48 - 7.56));
  const pDock = EASE_DOCK(clamp01((timeSec - 8.48) / (8.96 - 8.48)));
  const pHold = clamp01((timeSec - 8.96) / (10.50 - 8.96));
  const pWhip = EASE_WHIP_OUT(clamp01((timeSec - 10.50) / (10.72 - 10.50)));

  // Position X (px from screen center)
  let posX = interpolate(pDrop, [0, 1], [65, -18]);
  posX += interpolate(pDock, [0, 1], [0, 342]); // Docks cleanly at x = +324px (1:1 Ref F286!)
  posX += interpolate(pWhip, [0, 1], [0, -295]); // Whips inward during spin

  // Position Y (px from screen center)
  let posY = interpolate(pDrop, [0, 1], [-1260, 155]);
  posY += pMacroDrift * 65 * (1 - pDock); // Gentle macro scroll-glide (+155 -> +220)
  posY = posY * (1 - pDock) + 18 * pDock; // Docks cleanly at y = +18px
  posY += Math.sin((timeSec - 8.9) * 2.4) * 6 * pDock * (1 - pWhip);

  // Scale (Bold Macro 2.02 matching Ref F221-F256 -> Docked 1.12 matching Ref F286!)
  let scale = interpolate(pDrop, [0, 1], [1.85, 2.02]);
  scale = scale * (1 - pDock) + 1.12 * pDock;
  scale *= interpolate(pWhip, [0, 1], [1.0, 0.86]);

  // 3D Rotations (matching exact Sanctum perspective slope where top bezel angles UP-right!)
  let rotY = interpolate(pDrop, [0, 1], [-22, -11]);
  rotY = rotY * (1 - pDock) + -31 * pDock;
  rotY += pHold * 2.2 * (1 - pWhip); // Subtle proud turn (-31 -> -28.8)
  rotY += interpolate(pWhip, [0, 1], [0, -60]); // Whips edge-on to -89deg!

  let rotX = interpolate(pDrop, [0, 1], [12, 4.0]);
  rotX = rotX * (1 - pDock) + 8.5 * pDock;
  rotX *= 1 - pWhip;

  let rotZ = interpolate(pDrop, [0, 1], [-7.5, -3.4]);
  rotZ += pMacroDrift * 0.8 * (1 - pDock);
  rotZ = rotZ * (1 - pDock) + -5.8 * pDock; // Negative Z tilt + rotY(-31) makes top bezel slope sleekly UP-right like Ref F286!
  rotZ *= 1 - pWhip;

  // Whip-spin motion blur & opacity fade (10.50s -> 10.72s)
  const whipBlurPx = interpolate(pWhip, [0, 0.35, 1], [0, 6, 28]);
  const opacity = interpolate(timeSec, [10.62, 10.73], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Subtle internal scroll & live 3D viewport pulse inside our Z-Automation mobile site!
  const imgScrollY = interpolate(
    timeSec,
    [7.15, 7.85, 8.50, 8.95],
    [-26, 0, 0, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Live glowing packet travelling across Hermes <-> OpenClaw synapse inside the phone screenshot!
  const packetPhase = ((timeSec - 7.1) * 0.85) % 1.0;
  const packetAngle = Math.PI * (0.82 - packetPhase * 0.64);
  const packetX = 50 + Math.cos(packetAngle) * 24;
  const packetY = 53 - Math.sin(packetAngle) * 9;

  // Phone physical dimensions (iPhone 15 Pro aspect 390 x 844 + 13px bezel = 416 x 870)
  const CHASSIS_W = 416;
  const CHASSIS_H = 870;
  const RADIUS = 58;
  const SCREEN_RADIUS = 46;

  // 18 tightly-stacked extrusion layers for a 100% solid brushed-titanium 3D side rail
  const extrusionSlices = Array.from({ length: 18 }, (_, i) => i + 1);

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
        opacity,
        filter: whipBlurPx > 0.2 ? `blur(${whipBlurPx.toFixed(1)}px)` : undefined,
      }}
    >
      {/* Warm Golden-Peach & Soft Violet Halo Behind Phone (1:1 Reference F226-F316) */}
      <div
        style={{
          position: 'absolute',
          width: 640,
          height: 980,
          borderRadius: '50%',
          transform: `translate3d(${posX + 26}px, ${posY + 10}px, 0px) scale(${scale})`,
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
        {/* Solid Extruded Titanium Side Rail Layers (Z = -1.3px .. -23.4px) */}
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
              {/* Subtle Titanium Power Button Detail on Right Rail */}
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

        {/* Front Obsidian Glass Bezel Frame (Z = 0) */}
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

              {/* Live Animated Synapse Sparkle & Ambient Breathing Inside the 3D Hero Card */}
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
                {/* Travelling Cyan Synapse Data Pulse Between Hermes & OpenClaw */}
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
                {/* Soft Dynamic Specular Sheen Across the Interactive 3D Card */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: `linear-gradient(115deg, transparent ${20 + pMacroDrift * 25}%, rgba(255,255,255,0.07) ${38 + pMacroDrift * 25}%, transparent ${56 + pMacroDrift * 25}%)`,
                  }}
                />
              </div>
            </div>

            {/* Clean Editorial Bottom Floating Pill CTA (matching Sanctum's black pill CTA & Z-Automation's #0D0F17 button!) */}
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

              {/* Dynamic Island */}
              <div
                style={{
                  width: 92,
                  height: 24,
                  borderRadius: 999,
                  backgroundColor: '#0A0C12',
                }}
              />

              {/* Signal + Wi-Fi + Battery SVG */}
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

