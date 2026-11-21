import React, {createContext, useContext} from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {ease} from '../lib/easing';

export type CameraState = {x: number; y: number; zoom: number; rotate: number};

const neutral: CameraState = {x: 0, y: 0, zoom: 1, rotate: 0};
const CameraContext = createContext<CameraState>(neutral);

/** Baca keadaan kamera saat ini (dipakai oleh Layer). */
export const useCamera = (): CameraState => useContext(CameraContext);

export type CameraProps = {
  from?: Partial<CameraState>;
  to?: Partial<CameraState>;
  /** frame awal gerak (default 0) */
  start?: number;
  /** frame akhir gerak (default: akhir komposisi) */
  end?: number;
  easing?: (t: number) => number;
  /** amplitudo drift handheld halus dalam piksel (4–8 disarankan) */
  drift?: number;
  children: React.ReactNode;
};

/**
 * Kamera virtual. Tidak menggambar apa pun; hanya menyediakan state ke Layer.
 * Satu gerakan utama per scene + drift halus supaya frame tidak pernah benar-benar statis.
 */
export const Camera: React.FC<CameraProps> = ({
  from,
  to,
  start = 0,
  end,
  easing = ease.camera,
  drift = 0,
  children,
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const last = Math.max(start + 1, end ?? durationInFrames - 1);
  const a: CameraState = {...neutral, ...from};
  const b: CameraState = {...neutral, ...to};

  const t = interpolate(frame, [start, last], [0, 1], {
    easing,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const mix = (k: keyof CameraState) => a[k] + (b[k] - a[k]) * t;
  const s = frame / fps;

  const state: CameraState = {
    x: mix('x') + Math.sin(s * 0.9) * drift + Math.sin(s * 2.1 + 1.3) * drift * 0.35,
    y: mix('y') + Math.cos(s * 0.7 + 0.6) * drift * 0.8,
    zoom: mix('zoom'),
    rotate: mix('rotate') + Math.sin(s * 0.5) * drift * 0.01,
  };

  return <CameraContext.Provider value={state}>{children}</CameraContext.Provider>;
};
