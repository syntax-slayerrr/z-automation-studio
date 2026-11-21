import React from 'react';
import {AbsoluteFill, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {P} from '../lib/palette';

export type DustProps = {
  count?: number;
  /** 'far': kecil, redup, tajam. 'near': besar, buram, lebih cepat. */
  depth?: 'far' | 'near';
  color?: string;
  seed?: string;
  /** arah angin dalam px/frame, [x, y]; y negatif = naik */
  wind?: [number, number];
};

/** Partikel debu deterministik. Pakai dua instance (far + near) agar ada kedalaman. */
export const Dust: React.FC<DustProps> = ({
  count = 30,
  depth = 'far',
  color = P.highlight.warm,
  seed = 'dust',
  wind = [0.25, -0.35],
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const near = depth === 'near';
  const margin = 80;
  const spanX = width + margin * 2;
  const spanY = height + margin * 2;

  const motes = Array.from({length: count}, (_, i) => {
    const rx = random(`${seed}-x-${i}`);
    const ry = random(`${seed}-y-${i}`);
    const rs = random(`${seed}-s-${i}`);
    const rp = random(`${seed}-p-${i}`);
    const rv = random(`${seed}-v-${i}`);
    const speed = (near ? 1.7 : 1) * (0.6 + rv * 0.8);
    const wrap = (v: number, span: number) => ((v % span) + span) % span;
    const x = wrap(rx * spanX + wind[0] * speed * frame + Math.sin(frame * 0.02 + rp * 6.28) * (near ? 26 : 12), spanX) - margin;
    const y = wrap(ry * spanY + wind[1] * speed * frame, spanY) - margin;
    const size = near ? 5 + rs * 9 : 1.5 + rs * 3;
    const twinkle = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(frame * (0.04 + rv * 0.05) + rp * 6.28));
    return {x, y, size, alpha: twinkle * (near ? 0.35 : 0.7)};
  });

  return (
    <AbsoluteFill style={{mixBlendMode: 'screen', pointerEvents: 'none', filter: near ? 'blur(3px)' : undefined}}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {motes.map((m, i) => (
          <circle key={i} cx={m.x} cy={m.y} r={m.size} fill={color} opacity={m.alpha} />
        ))}
      </svg>
    </AbsoluteFill>
  );
};
