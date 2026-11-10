import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

interface VectorAstroProps {
  size?: number;
  mood?: 'happy' | 'shock' | 'sleeping';
  spaghettiStretch?: number; // 0 = normal, 1 = fully stretched legs
  waving?: boolean;
}

export const VectorAstro: React.FC<VectorAstroProps> = ({
  size = 380,
  mood = 'happy',
  spaghettiStretch = 0,
  waving = false,
}) => {
  const frame = useCurrentFrame();

  // Floating bobbing motion
  const bobY = Math.sin(frame * 0.08) * 12;
  const bobRot = Math.sin(frame * 0.05) * 4;

  // Eye blinking cycle (blink every ~90 frames)
  const blinkCycle = frame % 90;
  const isBlinking = mood !== 'shock' && mood !== 'sleeping' && blinkCycle > 84;

  // Arm waving / thumbs up
  const waveAngle = waving ? Math.sin(frame * 0.15) * 15 - 20 : 0;

  // Spaghettification legs stretch calculation
  const legStretchY = interpolate(spaghettiStretch, [0, 1], [0, 320]);
  const legNoodleTaper = interpolate(spaghettiStretch, [0, 1], [1, 0.25]);

  return (
    <div
      style={{
        width: size,
        height: size + (spaghettiStretch > 0 ? 300 : 0),
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `translateY(${bobY}px) rotate(${bobRot}deg)`,
      }}
    >
      <svg
        width={size}
        height={size + (spaghettiStretch > 0 ? 300 : 0)}
        viewBox="0 0 300 400"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <linearGradient id="visorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#80E5FF" stopOpacity="0.8" />
            <stop offset="40%" stopColor="#25A9E0" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0B4B75" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="suitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#E2E7F0" />
          </linearGradient>
        </defs>

        {/* Life Support Backpack */}
        <rect
          x="75"
          y="105"
          width="150"
          height="140"
          rx="25"
          fill="#CBD5E1"
          stroke="#1E293B"
          strokeWidth="6"
        />
        <rect x="90" y="125" width="120" height="12" rx="6" fill="#FF6B00" />

        {/* Legs / Spaghettification Lower Body */}
        {spaghettiStretch === 0 ? (
          <g id="normalLegs">
            {/* Left Leg */}
            <path
              d="M100 240 L85 310 L70 315 L70 330 L115 330 L115 310 L115 240 Z"
              fill="url(#suitGrad)"
              stroke="#1E293B"
              strokeWidth="6"
              strokeLinejoin="round"
            />
            <rect x="85" y="270" width="30" height="8" rx="4" fill="#FF6B00" />

            {/* Right Leg */}
            <path
              d="M185 240 L200 310 L215 315 L215 330 L170 330 L170 310 L170 240 Z"
              fill="url(#suitGrad)"
              stroke="#1E293B"
              strokeWidth="6"
              strokeLinejoin="round"
            />
            <rect x="170" y="270" width="30" height="8" rx="4" fill="#FF6B00" />
          </g>
        ) : (
          <g id="spaghettiLegs">
            {/* Stretched Noodle Tendrils into Abyss */}
            <path
              d={`M95 240 C 95 ${280 + legStretchY * 0.4}, ${130 - 20 * legNoodleTaper} ${320 + legStretchY * 0.7}, 140 ${360 + legStretchY}
                 C 150 ${360 + legStretchY}, ${160 + 20 * legNoodleTaper} ${320 + legStretchY * 0.7}, 190 240 Z`}
              fill="url(#suitGrad)"
              stroke="#1E293B"
              strokeWidth="6"
            />
            {/* Multi-thread noodle lines */}
            <path
              d={`M115 245 Q 120 ${290 + legStretchY * 0.5} 145 ${370 + legStretchY}`}
              fill="none"
              stroke="#CBD5E1"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d={`M175 245 Q 165 ${290 + legStretchY * 0.5} 152 ${370 + legStretchY}`}
              fill="none"
              stroke="#CBD5E1"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </g>
        )}

        {/* Torso */}
        <path
          d="M85 130 C85 110, 215 110, 215 130 L200 245 C200 255, 100 255, 100 245 Z"
          fill="url(#suitGrad)"
          stroke="#1E293B"
          strokeWidth="6"
          strokeLinejoin="round"
        />

        {/* Chest Control Panel */}
        <rect x="115" y="150" width="70" height="45" rx="10" fill="#0F172A" stroke="#334155" strokeWidth="3" />
        <circle cx="132" cy="165" r="5" fill="#22C55E" />
        <circle cx="150" cy="165" r="5" fill="#3B82F6" />
        <circle cx="168" cy="165" r="5" fill="#EF4444" />
        <rect x="127" y="178" width="46" height="8" rx="4" fill="#FF8800" />

        {/* Left Arm */}
        <g style={{ transformOrigin: '85px 135px', transform: `rotate(${-waveAngle * 0.5}deg)` }}>
          <path
            d="M85 135 C60 160, 45 190, 55 215 C60 225, 75 220, 78 210 C72 195, 80 170, 95 150 Z"
            fill="url(#suitGrad)"
            stroke="#1E293B"
            strokeWidth="6"
          />
          {/* Glove */}
          <circle cx="58" cy="220" r="14" fill="#FF6B00" stroke="#1E293B" strokeWidth="5" />
        </g>

        {/* Right Arm (Thumbs up or waving) */}
        <g style={{ transformOrigin: '215px 135px', transform: `rotate(${waveAngle}deg)` }}>
          {waving ? (
            <path
              d="M215 135 C240 120, 260 100, 270 75 C275 65, 260 55, 250 65 C240 85, 230 110, 205 150 Z"
              fill="url(#suitGrad)"
              stroke="#1E293B"
              strokeWidth="6"
            />
          ) : (
            <path
              d="M215 135 C240 160, 255 190, 245 215 C240 225, 225 220, 222 210 C228 195, 220 170, 205 150 Z"
              fill="url(#suitGrad)"
              stroke="#1E293B"
              strokeWidth="6"
            />
          )}
          {/* Glove with Thumbs up */}
          <circle cx={waving ? 270 : 242} cy={waving ? 65 : 220} r="14" fill="#FF6B00" stroke="#1E293B" strokeWidth="5" />
          {waving && (
            <path d="M268 62 L268 46 L278 46 L278 62 Z" fill="#FF6B00" stroke="#1E293B" strokeWidth="4" />
          )}
        </g>

        {/* Helmet Outer Shell */}
        <circle
          cx="150"
          cy="85"
          r="68"
          fill="url(#suitGrad)"
          stroke="#1E293B"
          strokeWidth="7"
        />

        {/* Helmet Visor */}
        <ellipse
          cx="150"
          cy="85"
          rx="52"
          ry="44"
          fill="url(#visorGrad)"
          stroke="#1E293B"
          strokeWidth="5"
        />

        {/* Face Behind Visor */}
        <g id="face">
          {/* Head */}
          <ellipse cx="150" cy="85" rx="38" ry="32" fill="#FED7AA" />

          {/* Hair / Bangs */}
          <path d="M125 65 C135 58, 165 58, 175 65 C170 72, 160 70, 150 72 C140 70, 130 72, 125 65 Z" fill="#78350F" />

          {/* Eyes */}
          {mood === 'shock' ? (
            <g id="shockEyes">
              <circle cx="138" cy="82" r="9" fill="#FFFFFF" stroke="#1E293B" strokeWidth="2.5" />
              <circle cx="162" cy="82" r="9" fill="#FFFFFF" stroke="#1E293B" strokeWidth="2.5" />
              <circle cx="138" cy="82" r="4" fill="#0F172A" />
              <circle cx="162" cy="82" r="4" fill="#0F172A" />
              <circle cx="136" cy="80" r="1.5" fill="#FFFFFF" />
              <circle cx="160" cy="80" r="1.5" fill="#FFFFFF" />
            </g>
          ) : mood === 'sleeping' ? (
            <g id="sleepingEyes">
              <path d="M130 82 Q138 88 146 82" fill="none" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
              <path d="M154 82 Q162 88 170 82" fill="none" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
            </g>
          ) : isBlinking ? (
            <g id="blinkingEyes">
              <line x1="130" y1="82" x2="146" y2="82" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
              <line x1="154" y1="82" x2="170" y2="82" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
            </g>
          ) : (
            <g id="happyEyes">
              <ellipse cx="138" cy="82" rx="5" ry="6" fill="#0F172A" />
              <ellipse cx="162" cy="82" rx="5" ry="6" fill="#0F172A" />
              <circle cx="136" cy="80" r="2" fill="#FFFFFF" />
              <circle cx="160" cy="80" r="2" fill="#FFFFFF" />
            </g>
          )}

          {/* Mouth */}
          {mood === 'shock' ? (
            <ellipse cx="150" cy="98" rx="8" ry="11" fill="#DC2626" stroke="#1E293B" strokeWidth="2.5" />
          ) : (
            <path d="M142 95 Q150 102 158 95" fill="none" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
          )}

          {/* Cheeks */}
          <circle cx="127" cy="88" r="4" fill="#FCA5A5" opacity="0.6" />
          <circle cx="173" cy="88" r="4" fill="#FCA5A5" opacity="0.6" />
        </g>

        {/* Visor Specular Glass Reflection */}
        <path
          d="M120 60 C140 50, 160 50, 180 60 C165 66, 135 66, 120 60 Z"
          fill="#FFFFFF"
          opacity="0.45"
        />
      </svg>
    </div>
  );
};

