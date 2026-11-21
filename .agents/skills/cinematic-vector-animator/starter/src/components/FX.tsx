import React from 'react';
import {AbsoluteFill, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {P} from '../lib/palette';

/** Vignette: gelapkan tepi, pusat sedikit di atas tengah agar subjek "disorot". */
export const Vignette: React.FC<{strength?: number; centerY?: number}> = ({
  strength = 0.55,
  centerY = 45,
}) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse at 50% ${centerY}%, rgba(0,0,0,0) 42%, ${P.shadow.deep} 125%)`,
      opacity: strength,
      pointerEvents: 'none',
    }}
  />
);

/** Color grade: gradient soft-light yang menyatukan palet. */
export const ColorGrade: React.FC<{opacity?: number}> = ({opacity = 0.32}) => (
  <AbsoluteFill
    style={{
      background: `linear-gradient(180deg, ${P.accent.coolShadow} 0%, ${P.highlight.warm} 48%, ${P.shadow.soft} 100%)`,
      mixBlendMode: 'soft-light',
      opacity,
      pointerEvents: 'none',
    }}
  />
);

/** Grain film: seed berganti tiap 2 frame (~15 fps) agar terasa hidup tapi tidak berisik. */
export const Grain: React.FC<{opacity?: number; scale?: number}> = ({opacity = 0.12, scale = 2}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const seed = Math.floor(frame / 2) % 24;
  return (
    <AbsoluteFill style={{mixBlendMode: 'overlay', opacity, pointerEvents: 'none'}}>
      <svg width={width} height={height} viewBox={`0 0 ${width / scale} ${height / scale}`}>
        <filter id="cva-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves={2}
            seed={seed}
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#cva-grain)" />
      </svg>
    </AbsoluteFill>
  );
};

/**
 * Glow radial pada sumber cahaya. flicker > 0 untuk api/lentera.
 * Deterministik: noise dari random(seed) per 2–3 frame.
 */
export const Glow: React.FC<{
  x: number;
  y: number;
  radius: number;
  color?: string;
  intensity?: number;
  flicker?: number;
  seed?: string;
}> = ({x, y, radius, color = P.highlight.warm, intensity = 0.8, flicker = 0, seed = 'glow'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const slow = Math.sin((frame / fps) * 2.4 + 1.1) * 0.5 + 0.5;
  const fast = random(`${seed}-${Math.floor(frame / 2)}`);
  const k = 1 - flicker * (0.35 * slow + 0.65 * fast * 0.6);
  const r = radius * (1 - flicker * 0.06 * fast);
  return (
    <>
      {/* glow luar: besar, redup */}
      <div
        style={{
          position: 'absolute',
          left: x - r * 2,
          top: y - r * 2,
          width: r * 4,
          height: r * 4,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color} 0%, rgba(0,0,0,0) 62%)`,
          mixBlendMode: 'screen',
          opacity: intensity * 0.35 * k,
          pointerEvents: 'none',
        }}
      />
      {/* glow inti: kecil, terang */}
      <div
        style={{
          position: 'absolute',
          left: x - r,
          top: y - r,
          width: r * 2,
          height: r * 2,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${P.highlight.cream} 0%, ${color} 28%, rgba(0,0,0,0) 68%)`,
          mixBlendMode: 'screen',
          opacity: intensity * k,
          pointerEvents: 'none',
        }}
      />
    </>
  );
};

/**
 * Light rays dari satu titik asal. Berkas "bernapas" (opacity dan sudut berosilasi pelan).
 * origin dalam piksel kanvas; angle = arah utama (derajat, 0 = lurus ke bawah).
 */
export const LightRays: React.FC<{
  originX: number;
  originY: number;
  angle?: number;
  spread?: number;
  count?: number;
  length?: number;
  color?: string;
  opacity?: number;
  seed?: string;
}> = ({
  originX,
  originY,
  angle = -12,
  spread = 38,
  count = 5,
  length = 2600,
  color = P.highlight.warm,
  opacity = 0.18,
  seed = 'rays',
}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const s = frame / fps;
  const rays = Array.from({length: count}, (_, i) => {
    const r1 = random(`${seed}-a-${i}`);
    const r2 = random(`${seed}-w-${i}`);
    const r3 = random(`${seed}-p-${i}`);
    const base = angle + (r1 - 0.5) * spread;
    const sway = Math.sin(s * (0.35 + r3 * 0.3) + r3 * 6.28) * 0.6;
    const breathe = 0.55 + 0.45 * Math.sin(s * (0.9 + r2 * 0.6) + r1 * 6.28);
    return {angle: base + sway, width: 90 + r2 * 220, alpha: breathe * (0.6 + r3 * 0.4)};
  });
  return (
    <AbsoluteFill style={{mixBlendMode: 'screen', opacity, pointerEvents: 'none'}}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{overflow: 'visible'}}>
        <defs>
          <linearGradient id="cva-ray" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity="1" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
          <filter id="cva-ray-blur" x="-20%" y="-5%" width="140%" height="110%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>
        <g filter="url(#cva-ray-blur)">
          {rays.map((r, i) => (
            <g key={i} transform={`translate(${originX} ${originY}) rotate(${r.angle})`}>
              <polygon
                points={`0,0 ${-r.width / 2},${length} ${r.width / 2},${length}`}
                fill="url(#cva-ray)"
                opacity={r.alpha}
              />
            </g>
          ))}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/** Overlay debug: tampilkan safe zone. Aktifkan lewat prop komposisi, bukan di render final. */
export const SafeZones: React.FC<{top: number; bottom: number; left: number; right: number}> = ({
  top,
  bottom,
  left,
  right,
}) => {
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          left,
          top,
          width: width - left - right,
          height: height - top - bottom,
          border: '3px dashed rgba(127,209,214,0.9)',
          background: 'rgba(127,209,214,0.06)',
        }}
      />
    </AbsoluteFill>
  );
};
