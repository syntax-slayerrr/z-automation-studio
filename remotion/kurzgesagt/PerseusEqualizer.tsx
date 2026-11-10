import React from 'react';
import { useCurrentFrame } from 'remotion';

interface PerseusEqualizerProps {
  size?: number;
}

export const PerseusEqualizer: React.FC<PerseusEqualizerProps> = ({ size = 640 }) => {
  const frame = useCurrentFrame();

  const rings = [1, 2, 3, 4, 5];
  const barCount = 48;

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
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="eqGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EC4899" />
            <stop offset="50%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
        </defs>

        {/* Concentric Expanding Shockwave Rings */}
        {rings.map((r, i) => {
          const expansion = ((frame * 1.5 + i * 40) % 200) / 200;
          const currentRadius = 80 + expansion * (size * 0.42);
          const opacity = Math.sin(expansion * Math.PI) * 0.85;

          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={currentRadius}
              fill="none"
              stroke={i % 2 === 0 ? '#06B6D4' : '#EC4899'}
              strokeWidth={3}
              opacity={opacity}
              style={{ filter: 'drop-shadow(0 0 8px #8B5CF6)' }}
            />
          );
        })}

        {/* Circular Audio Equalizer Bars */}
        {Array.from({ length: barCount }).map((_, idx) => {
          const angle = (idx * 360) / barCount;
          const rad = (angle * Math.PI) / 180;
          const baseR = size * 0.28;
          // Sine wave audio bar heights
          const barH = 15 + Math.sin(frame * 0.2 + idx * 0.8) * 25 + Math.sin(frame * 0.1 - idx * 0.4) * 15;
          const x1 = size / 2 + Math.cos(rad) * baseR;
          const y1 = size / 2 + Math.sin(rad) * baseR;
          const x2 = size / 2 + Math.cos(rad) * (baseR + barH);
          const y2 = size / 2 + Math.sin(rad) * (baseR + barH);

          return (
            <line
              key={idx}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="url(#eqGrad)"
              strokeWidth={4.5}
              strokeLinecap="round"
            />
          );
        })}

        {/* Inner Black Hole Core */}
        <circle cx={size / 2} cy={size / 2} r={size * 0.16} fill="#090514" stroke="#8B5CF6" strokeWidth={5} />
        <circle cx={size / 2} cy={size / 2} r={size * 0.08} fill="#000000" />
      </svg>
    </div>
  );
};

