import React from 'react';
import { hash01 } from './tokens';

/**
 * Deterministic Filmic Particle Systems (Golden Savanna Dust Motes,
 * Turbulent Campfire Smoke & Embers, Subtle Scientific Micro-Motes,
 * and Valley River Specular Shimmer).
 */

export const GoldenDustMotes2D: React.FC<{
  width?: number;
  height?: number;
  count?: number;
  frame?: number;
  color?: string;
  opacity?: number;
}> = ({ width = 1080, height = 1920, count = 28, frame = 0, color = '#FCE8B6', opacity = 0.52 }) => {
  return (
    <g opacity={opacity}>
      {Array.from({ length: count }).map((_, i) => {
        const seedX = hash01(i * 13.7 + 1.1);
        const seedY = hash01(i * 29.3 + 4.7);
        const speed = 0.35 + hash01(i * 7.1 + 9.2) * 0.75;
        const r = 1.6 + hash01(i * 19.4 + 2.3) * 3.4;
        const px = ((seedX * width - frame * 0.65 * speed) % width + width) % width;
        const py = ((seedY * height * 0.72 + Math.sin(frame * 0.04 + i) * 14 + frame * 0.16 * speed) % (height * 0.78));
        const twinkle = 0.38 + 0.62 * (0.5 + 0.5 * Math.sin(frame * 0.08 + i * 2.1));
        return <circle key={i} cx={px} cy={py} r={r} fill={color} opacity={twinkle} />;
      })}
    </g>
  );
};

export const CampfireEmbersAndSmoke2D: React.FC<{
  x: number;
  y: number;
  frame?: number;
  smokeHeight?: number;
  emberCount?: number;
  windDrift?: number;
}> = ({ x, y, frame = 0, smokeHeight = 420, emberCount = 24, windDrift = 36 }) => {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <filter id="odyssey-smoke-soft" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
      </defs>
      {/* Soft misty volumetric smoke plumes (genuinely blurred, never soap-bubble circles!) */}
      <g filter="url(#odyssey-smoke-soft)">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => {
          const life = (frame * 0.009 + i / 7) % 1;
          const sy = -42 - life * smokeHeight;
          const sx = Math.sin(life * 4.8 + i * 1.3) * (18 + life * 28) + life * life * windDrift;
          const rx = 28 + life * 74;
          const ry = 20 + life * 52;
          const op = Math.sin(life * Math.PI) * 0.28;
          return <ellipse key={`sm-${i}`} cx={sx} cy={sy} rx={rx} ry={ry} fill="#7B8BA0" opacity={op} />;
        })}
      </g>

      {/* Dancing glowing ember sparks with short motion-streaks */}
      {Array.from({ length: emberCount }).map((_, i) => {
        const speed = 0.008 + hash01(i * 17.3 + 2.1) * 0.011;
        const life = ((frame * speed + hash01(i * 31.7)) % 1);
        const spread = (hash01(i * 11.9) - 0.5) * 110;
        const turb = Math.sin(life * 9.0 + i * 2.4) * (14 + life * 28);
        const ex = spread * (0.4 + life * 0.9) + turb + life * windDrift * 1.1;
        const ey = -28 - life * (smokeHeight * 1.25);
        const op = Math.sin(life * Math.PI) * 0.95;
        const r = (1.6 + hash01(i * 5.3) * 2.2) * (1 - life * 0.45);
        return (
          <g key={`em-${i}`} opacity={op}>
            <line
              x1={ex}
              y1={ey}
              x2={ex - windDrift * 0.04}
              y2={ey + 9}
              stroke="#F38632"
              strokeWidth={r * 0.9}
              strokeLinecap="round"
              opacity={0.55}
            />
            <circle cx={ex} cy={ey} r={r} fill={i % 3 === 0 ? '#FEF0B8' : '#F8A944'} />
          </g>
        );
      })}
    </g>
  );
};

export const BioluminescentMotes2D: React.FC<{
  width?: number;
  height?: number;
  count?: number;
  frame?: number;
}> = ({ width = 1080, height = 1920, count = 20, frame = 0 }) => (
  <g opacity={0.42}>
    {Array.from({ length: count }).map((_, i) => {
      const x0 = hash01(i * 21.3 + 3.4) * width;
      const y0 = hash01(i * 17.9 + 8.1) * height;
      const dx = Math.sin(frame * 0.03 + i * 1.7) * 16;
      const dy = Math.cos(frame * 0.025 + i * 2.3) * 18;
      const r = 1.5 + hash01(i * 9.7) * 3.0;
      const op = 0.25 + 0.6 * (0.5 + 0.5 * Math.sin(frame * 0.06 + i));
      return (
        <circle
          key={i}
          cx={x0 + dx}
          cy={y0 + dy}
          r={r}
          fill={i % 3 === 0 ? '#F4CD76' : '#6ADAE8'}
          opacity={op}
        />
      );
    })}
  </g>
);

export const AnimatedRiverShimmer2D: React.FC<{
  width?: number;
  height?: number;
  frame?: number;
}> = ({ width = 1080, height = 1920, frame = 0 }) => {
  // Subtle sunlit specular flecks aligned directly to texture_forge's valley river S-curve!
  return (
    <g opacity={0.52}>
      {[0.12, 0.22, 0.34, 0.48, 0.62, 0.76, 0.88].map((tBase, idx) => {
        const t = (tBase + frame * 0.0014) % 0.96;
        const y = height * (0.58 + 0.44 * t);
        const cx = width * (0.68 - 0.08 * t + 0.115 * Math.sin(t * Math.PI * 2.35 + 0.4) * (0.28 + 0.72 * t));
        const hw = width * (0.0055 + 0.062 * Math.pow(t, 1.58));
        const pulse = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(frame * 0.12 + idx * 1.9));
        return (
          <ellipse
            key={idx}
            cx={cx + hw * 0.18}
            cy={y}
            rx={hw * 0.42}
            ry={1.6 + t * 2.4}
            fill="#FCF2D2"
            opacity={pulse * 0.75}
          />
        );
      })}
    </g>
  );
};
