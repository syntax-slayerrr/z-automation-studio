import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

interface TimeClockBubbleProps {
  size?: number;
}

export const TimeClockBubble: React.FC<TimeClockBubbleProps> = ({ size = 680 }) => {
  const frame = useCurrentFrame();

  // Time slowing down effect: rapid spin at start, then completely freezes at frame 60+
  const clockSpeed = interpolate(frame, [0, 60, 90], [8, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const handAngle = frame < 60 ? (frame * 6) % 360 : 360;

  // Bubble floating
  const floatY = Math.sin(frame * 0.06) * 10;

  return (
    <div
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Outer Cyan Iridescent Sphere */}
      <div
        style={{
          position: 'absolute',
          width: size * 0.72,
          height: size * 0.72,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, rgba(120, 240, 255, 0.45) 0%, rgba(6, 182, 212, 0.15) 60%, rgba(14, 116, 144, 0.6) 100%)',
          border: '3px solid rgba(165, 243, 252, 0.7)',
          boxShadow: '0 0 60px rgba(6, 182, 212, 0.5), inset 0 0 40px rgba(255, 255, 255, 0.4)',
          transform: `translateY(${floatY}px)`,
        }}
      />

      {/* Floating Frozen Clocks */}
      {/* Clock 1: Top Left */}
      <svg
        width="150"
        height="150"
        viewBox="0 0 100 100"
        style={{
          position: 'absolute',
          top: 40,
          left: 40,
          filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.7))',
          transform: 'rotate(-12deg)',
        }}
      >
        <circle cx="50" cy="50" r="44" fill="#FEF3C7" stroke="#78350F" strokeWidth="5" />
        <circle cx="50" cy="50" r="3" fill="#78350F" />
        {/* Hour markers */}
        <line x1="50" y1="12" x2="50" y2="18" stroke="#78350F" strokeWidth="3" />
        <line x1="50" y1="82" x2="50" y2="88" stroke="#78350F" strokeWidth="3" />
        <line x1="12" y1="50" x2="18" y2="50" stroke="#78350F" strokeWidth="3" />
        <line x1="82" y1="50" x2="88" y2="50" stroke="#78350F" strokeWidth="3" />
        {/* Frozen hands */}
        <line
          x1="50"
          y1="50"
          x2="50"
          y2="24"
          stroke="#78350F"
          strokeWidth="4"
          strokeLinecap="round"
          style={{ transformOrigin: '50px 50px', transform: `rotate(${handAngle * 0.2}deg)` }}
        />
        <line
          x1="50"
          y1="50"
          x2="72"
          y2="50"
          stroke="#B45309"
          strokeWidth="3"
          strokeLinecap="round"
          style={{ transformOrigin: '50px 50px', transform: `rotate(${handAngle}deg)` }}
        />
      </svg>

      {/* Clock 2: Bottom Right */}
      <svg
        width="170"
        height="170"
        viewBox="0 0 100 100"
        style={{
          position: 'absolute',
          bottom: 30,
          right: 30,
          filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.7))',
          transform: 'rotate(18deg)',
        }}
      >
        <circle cx="50" cy="50" r="44" fill="#FEF3C7" stroke="#78350F" strokeWidth="5" />
        <circle cx="50" cy="50" r="3" fill="#78350F" />
        <line x1="50" y1="12" x2="50" y2="18" stroke="#78350F" strokeWidth="3" />
        <line x1="50" y1="82" x2="50" y2="88" stroke="#78350F" strokeWidth="3" />
        <line x1="12" y1="50" x2="18" y2="50" stroke="#78350F" strokeWidth="3" />
        <line x1="82" y1="50" x2="88" y2="50" stroke="#78350F" strokeWidth="3" />
        <line
          x1="50"
          y1="50"
          x2="50"
          y2="26"
          stroke="#78350F"
          strokeWidth="4"
          strokeLinecap="round"
          style={{ transformOrigin: '50px 50px', transform: `rotate(${-handAngle * 0.15 + 45}deg)` }}
        />
        <line
          x1="50"
          y1="50"
          x2="68"
          y2="50"
          stroke="#B45309"
          strokeWidth="3"
          strokeLinecap="round"
          style={{ transformOrigin: '50px 50px', transform: `rotate(${-handAngle + 90}deg)` }}
        />
      </svg>
    </div>
  );
};

