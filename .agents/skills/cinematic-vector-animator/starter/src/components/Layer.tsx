import React from 'react';
import {AbsoluteFill} from 'remotion';
import {useCamera} from './Camera';

export type LayerProps = {
  /** 0 = diam, 1 = bergerak penuh bersama kamera. Jauh kecil, dekat besar. */
  parallax: number;
  /** blur dalam px (depth of field) */
  blur?: number;
  /** 0–1: kabut atmosfer; menurunkan saturasi/kontras dan menaikkan kecerahan */
  haze?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

/**
 * Satu layer kedalaman. Gambar isinya LEBIH BESAR dari frame (bleed ±15%):
 * pakai <svg style={{overflow: 'visible'}}> dan gambar melewati tepi viewBox.
 */
export const Layer: React.FC<LayerProps> = ({parallax, blur = 0, haze = 0, style, children}) => {
  const cam = useCamera();
  const scale = 1 + (cam.zoom - 1) * parallax;

  const filters: string[] = [];
  if (blur > 0) filters.push(`blur(${blur}px)`);
  if (haze > 0) {
    filters.push(
      `saturate(${1 - haze * 0.5}) contrast(${1 - haze * 0.3}) brightness(${1 + haze * 0.12})`,
    );
  }

  return (
    <AbsoluteFill
      style={{
        transform: `translate(${-cam.x * parallax}px, ${-cam.y * parallax}px) rotate(${
          cam.rotate * parallax
        }deg) scale(${scale})`,
        transformOrigin: '50% 50%',
        filter: filters.length ? filters.join(' ') : undefined,
        ...style,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
