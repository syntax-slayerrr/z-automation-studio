import React, {useMemo} from 'react';
import {random, useCurrentFrame, useVideoConfig} from 'remotion';
import {P} from '../lib/palette';
import {ease, tween} from '../lib/easing';

export type Expression = 'neutral' | 'curious' | 'determined' | 'awe';

/** Parameter ekspresi: tambah sesuai cerita (sedih, lega, waspada, senyum tipis). */
const EXPR: Record<Expression, {brow: number; browY: number; mouth: number; eyeOpen: number}> = {
  neutral: {brow: 0, browY: 0, mouth: 0.0, eyeOpen: 1.0},
  curious: {brow: -9, browY: -5, mouth: 0.2, eyeOpen: 1.1},
  determined: {brow: 11, browY: 3, mouth: -0.15, eyeOpen: 0.82},
  awe: {brow: -5, browY: -9, mouth: 0.55, eyeOpen: 1.25},
};

/** 4 bentuk mulut: tertutup, kecil, lebar, bulat. [rx, ry] */
const VISEMES: Array<[number, number]> = [
  [14, 2.5],
  [11, 6],
  [17, 9],
  [8, 9],
];

const blinkStarts = (seed: string, fps: number, total: number): number[] => {
  const starts: number[] = [];
  let f = Math.round(fps * 1.2);
  let i = 0;
  while (f < total) {
    starts.push(f);
    f += Math.round(fps * (2.8 + random(`${seed}-blink-${i++}`) * 3.4));
  }
  return starts;
};

/** 0 = terbuka, 1 = tertutup; kedip 6 frame, bentuk segitiga. */
const blinkClosed = (frame: number, starts: number[], dur = 6): number => {
  for (const s of starts) {
    const d = frame - s;
    if (d >= 0 && d < dur) return 1 - Math.abs(d - dur / 2) / (dur / 2);
  }
  return 0;
};

export type CharacterProps = {
  x: number;
  y: number;
  scale?: number;
  expression?: Expression;
  /** frame saat ekspresi berganti (untuk tween transisi); default 0 */
  expressionSince?: number;
  prevExpression?: Expression;
  /** [frameMulai, frameAkhir] saat berbicara */
  talk?: [number, number];
  seed?: string;
  /** progres kemunculan 0–1 (dari spring/tween di scene) */
  appear?: number;
};

/**
 * Karakter ter-rig sederhana (placeholder). GANTI path dengan aset karakter asli,
 * tapi pertahankan struktur grup dan pivot: badan, kepala, mata, alis, mulut, kain.
 * Origin lokal (0,0) = titik pijakan di tanah.
 */
export const Character: React.FC<CharacterProps> = ({
  x,
  y,
  scale = 1,
  expression = 'neutral',
  prevExpression,
  expressionSince = 0,
  talk,
  seed = 'hero',
  appear = 1,
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const s = frame / fps;
  const starts = useMemo(() => blinkStarts(seed, fps, durationInFrames), [seed, fps, durationInFrames]);

  // Transisi ekspresi di-tween 8 frame; tidak pernah memotong langsung.
  const from = EXPR[prevExpression ?? expression];
  const to = EXPR[expression];
  const k = tween(frame, [expressionSince, expressionSince + 8], [0, 1], ease.inOut);
  const e = {
    brow: from.brow + (to.brow - from.brow) * k,
    browY: from.browY + (to.browY - from.browY) * k,
    mouth: from.mouth + (to.mouth - from.mouth) * k,
    eyeOpen: from.eyeOpen + (to.eyeOpen - from.eyeOpen) * k,
  };

  // Idle yang selalu aktif.
  const breathe = Math.sin(((s - 0.0) / 3.2) * Math.PI * 2) * 0.012;
  const headLag = Math.sin(((s - 0.12) / 3.2) * Math.PI * 2) * 2;
  const sway = Math.sin(s * 0.6) * 0.8;
  const scarf = Math.sin(s * 2.2) * 7 + Math.sin(s * 3.7 + 1) * 3;

  const blink = blinkClosed(frame, starts);
  const eyeRy = Math.max(0.8, 9 * e.eyeOpen * (1 - blink * 0.92));

  const talking = talk ? frame >= talk[0] && frame <= talk[1] : false;
  const vi = talking ? Math.floor(random(`${seed}-v-${Math.floor(frame / 4)}`) * VISEMES.length) : 0;
  const [mrx, mry0] = VISEMES[vi];
  const mouthOpen = talking ? 1 : 0;
  const mry = mry0 * mouthOpen + 2.5 * (1 - mouthOpen) + Math.max(0, e.mouth) * 4;
  const smile = e.mouth * 6;

  return (
    <g
      transform={`translate(${x} ${y}) scale(${scale})`}
      opacity={appear}
      style={{transformBox: 'fill-box'}}
    >
      <g transform={`rotate(${sway})`} style={{transformOrigin: '0px 0px'}}>
        <defs>
          <linearGradient id="cva-cloak" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={P.base.mid} />
            <stop offset="0.55" stopColor={P.shadow.soft} />
            <stop offset="1" stopColor={P.shadow.mid} />
          </linearGradient>
          <linearGradient id="cva-skin" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={P.highlight.warm} />
            <stop offset="1" stopColor={P.base.mid} />
          </linearGradient>
        </defs>

        {/* bayangan jatuh di tanah */}
        <ellipse cx="6" cy="6" rx="120" ry="16" fill={P.shadow.deep} opacity="0.55" />

        {/* badan: pivot di dasar */}
        <g style={{transformOrigin: '0px 0px', transform: `scaleY(${1 + breathe})`}}>
          <path d="M-96,0 C-110,-120 -78,-250 -34,-318 L34,-318 C78,-250 110,-120 96,0 Z" fill="url(#cva-cloak)" />
          {/* rim light di sisi key (kiri) */}
          <path d="M-96,0 C-110,-120 -78,-250 -34,-318" fill="none" stroke={P.accent.rim} strokeWidth="3" opacity="0.55" />
          {/* kain sekunder yang bergerak walau karakter diam */}
          <path
            d={`M20,-300 C70,-290 ${110 + scarf},-250 ${130 + scarf * 1.4},-190 C${100 + scarf},-215 60,-250 20,-262 Z`}
            fill={P.base.dark}
            opacity="0.95"
          />
        </g>

        {/* kepala: tertinggal dari badan */}
        <g transform={`translate(0 ${headLag - 330})`}>
          <circle cx="0" cy="0" r="62" fill="url(#cva-skin)" />
          <path d="M-62,-4 A62,62 0 0 1 62,-4 C40,-30 -40,-30 -62,-4 Z" fill={P.shadow.mid} />
          <path d="M-62,-4 A62,62 0 0 1 -20,-58" fill="none" stroke={P.accent.rim} strokeWidth="3" opacity="0.5" />
          {/* alis */}
          <g stroke={P.shadow.deep} strokeWidth="4.5" strokeLinecap="round">
            <line x1="-34" y1={-22 + e.browY} x2="-12" y2={-22 + e.browY + e.brow * 0.4} />
            <line x1="12" y1={-22 + e.browY + e.brow * 0.4} x2="34" y2={-22 + e.browY} />
          </g>
          {/* mata */}
          <ellipse cx="-22" cy="4" rx="8" ry={eyeRy} fill={P.shadow.deep} />
          <ellipse cx="22" cy="4" rx="8" ry={eyeRy} fill={P.shadow.deep} />
          <circle cx="-19" cy="1" r="2.2" fill={P.highlight.cream} opacity={1 - blink} />
          <circle cx="25" cy="1" r="2.2" fill={P.highlight.cream} opacity={1 - blink} />
          {/* mulut */}
          <ellipse cx="0" cy={32 - smile * 0.3} rx={mrx} ry={mry} fill={P.shadow.deep} />
        </g>
      </g>
    </g>
  );
};
