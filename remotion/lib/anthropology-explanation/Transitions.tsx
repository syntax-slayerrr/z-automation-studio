import React from 'react';
import { AbsoluteFill } from 'remotion';
import { clamp, smoothstep } from './tokens';

/**
 * Motivated Filmic Scene Transitions (Zero Hard Cuts / Zero PowerPoint Wipes).
 */

export const AtmosphericCrossfade: React.FC<{
  /** Transition progress in [0, 1] across the boundary window (peaks at 0.5). */
  progress: number;
  veilColor?: string;
  peakOpacity?: number;
}> = ({ progress, veilColor = '#EED4A2', peakOpacity = 0.62 }) => {
  const p = clamp(progress, 0, 1);
  if (p <= 0.005 || p >= 0.995) return null;
  const bell = Math.sin(p * Math.PI);
  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        zIndex: 80,
        background: `radial-gradient(ellipse 100% 90% at 50% 45%, ${veilColor} 0%, ${veilColor}cc 55%, ${veilColor}66 100%)`,
        opacity: bell * peakOpacity,
        mixBlendMode: 'screen',
      }}
    />
  );
};

export const ScaleDivePortal: React.FC<{
  /** 0..1 progress across boundary: shrinks/expands luminous focus iris around [cx%, cy%]. */
  progress: number;
  cx?: number;
  cy?: number;
  ringColor?: string;
  deepColor?: string;
}> = ({ progress, cx = 50, cy = 50, ringColor = '#E9BE6A', deepColor = '#10202E' }) => {
  const p = clamp(progress, 0, 1);
  if (p <= 0.005 || p >= 0.995) return null;
  const bell = Math.sin(p * Math.PI);
  const innerR = 14 + (1 - bell) * 65;

  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        zIndex: 80,
        background: `radial-gradient(circle at ${cx}% ${cy}%, transparent ${innerR.toFixed(1)}%, ${ringColor}44 ${(innerR + 5).toFixed(1)}%, ${deepColor} ${(innerR + 28).toFixed(1)}%)`,
        opacity: smoothstep(0, 0.25, p) * (1 - smoothstep(0.75, 1, p)),
      }}
    />
  );
};

export const EmberLightMatch: React.FC<{
  /** Warm amber/gold light sweep converting evolutionary highlight into glowing campfire sparks. */
  progress: number;
}> = ({ progress }) => {
  const p = clamp(progress, 0, 1);
  if (p <= 0.005 || p >= 0.995) return null;
  const bell = Math.sin(p * Math.PI);
  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        zIndex: 80,
        background: `radial-gradient(ellipse 90% 70% at 50% ${(72 - p * 26).toFixed(1)}%, #FCE49A 0%, #EC8634bb 44%, #1A151E88 100%)`,
        opacity: bell * 0.78,
        mixBlendMode: 'screen',
      }}
    />
  );
};
