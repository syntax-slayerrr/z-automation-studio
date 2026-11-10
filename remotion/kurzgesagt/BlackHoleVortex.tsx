import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

interface BlackHoleVortexProps {
  size?: number;
  glowColor?: string;
  intensity?: number;
  pullParticles?: boolean;
}

export const BlackHoleVortex: React.FC<BlackHoleVortexProps> = ({
  size = 520,
  glowColor = '#FF6B00',
  intensity = 1.0,
  pullParticles = true,
}) => {
  const frame = useCurrentFrame();

  // Rotation angles
  const rot1 = (frame * 1.8) % 360;
  const rot2 = (-frame * 1.2) % 360;
  const rot3 = (frame * 2.4) % 360;

  // Pulsing scale
  const pulse = 1 + Math.sin(frame * 0.08) * 0.04 * intensity;

  // Generate 24 orbiting particles
  const particles = Array.from({ length: 24 }).map((_, i) => {
    const angleOffset = (i * 360) / 24;
    const speed = 1.5 + (i % 5) * 0.4;
    const currentAngle = ((frame * speed + angleOffset) * Math.PI) / 180;
    // Spiral inward cycle
    const cycle = (frame * 0.02 + i * 0.1) % 1;
    const radius = pullParticles
      ? interpolate(cycle, [0, 1], [size * 0.75, size * 0.18])
      : size * 0.45;
    const x = Math.cos(currentAngle) * radius;
    const y = Math.sin(currentAngle) * radius * 0.42; // tilted ellipse
    const pSize = interpolate(cycle, [0, 0.7, 1], [4, 6, 1]);
    const pOpacity = interpolate(cycle, [0, 0.2, 0.8, 1], [0, 0.9, 0.9, 0]);

    return { x, y, size: pSize, opacity: pOpacity, color: i % 2 === 0 ? '#FFE600' : '#FF5500' };
  });

  return (
    <div
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `scale(${pulse})`,
      }}
    >
      {/* Outer Gravitational Glow */}
      <div
        style={{
          position: 'absolute',
          width: size * 0.9,
          height: size * 0.45,
          borderRadius: '50%',
          background: `radial-gradient(ellipse at center, ${glowColor}55 0%, transparent 75%)`,
          filter: 'blur(28px)',
          transform: 'rotate(-18deg)',
        }}
      />

      {/* Accretion Disk SVG */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ position: 'absolute', overflow: 'visible', transform: 'rotate(-18deg)' }}
      >
        <defs>
          <linearGradient id="diskGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFC700" />
            <stop offset="50%" stopColor="#FF4D00" />
            <stop offset="100%" stopColor="#990022" />
          </linearGradient>
          <linearGradient id="diskGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFE600" />
            <stop offset="60%" stopColor="#FF2200" />
            <stop offset="100%" stopColor="#550011" />
          </linearGradient>
        </defs>

        {/* Outer Swirl Ring */}
        <ellipse
          cx={size / 2}
          cy={size / 2}
          rx={size * 0.46}
          ry={size * 0.18}
          fill="none"
          stroke="url(#diskGrad1)"
          strokeWidth="18"
          strokeDasharray="40 15 80 20"
          strokeLinecap="round"
          style={{ transformOrigin: 'center', transform: `rotate(${rot1}deg)` }}
        />

        {/* Mid High-Intensity Ring */}
        <ellipse
          cx={size / 2}
          cy={size / 2}
          rx={size * 0.38}
          ry={size * 0.14}
          fill="none"
          stroke="url(#diskGrad2)"
          strokeWidth="14"
          strokeDasharray="90 25 30 15"
          strokeLinecap="round"
          style={{ transformOrigin: 'center', transform: `rotate(${rot2}deg)` }}
        />

        {/* Inner Laser Ring */}
        <ellipse
          cx={size / 2}
          cy={size / 2}
          rx={size * 0.28}
          ry={size * 0.10}
          fill="none"
          stroke="#FFF2A3"
          strokeWidth="6"
          strokeDasharray="120 40"
          style={{ transformOrigin: 'center', transform: `rotate(${rot3}deg)`, filter: 'blur(1px)' }}
        />

        {/* Orbiting Spiraling Particles */}
        {particles.map((p, idx) => (
          <circle
            key={idx}
            cx={size / 2 + p.x}
            cy={size / 2 + p.y}
            r={p.size}
            fill={p.color}
            opacity={p.opacity}
            style={{ filter: 'drop-shadow(0 0 6px #FFAA00)' }}
          />
        ))}

        {/* Gravitational Photon Ring Halo behind Horizon */}
        <ellipse
          cx={size / 2}
          cy={size / 2}
          rx={size * 0.21}
          ry={size * 0.21}
          fill="none"
          stroke="#FF8800"
          strokeWidth="8"
          style={{ filter: 'blur(3px)' }}
        />

        {/* The Event Horizon Sphere (Pure Pitch Black) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size * 0.19}
          fill="#05030A"
          stroke="#000000"
          strokeWidth="4"
        />
      </svg>
    </div>
  );
};

