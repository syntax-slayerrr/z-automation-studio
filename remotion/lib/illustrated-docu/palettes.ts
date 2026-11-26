import React from 'react';

export const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * clamp(t, 0, 1);

export const easeInOut = (t: number): number => {
  const c = clamp(t, 0, 1);
  return c * c * (3 - 2 * c);
};

export const easeOutCubic = (t: number): number => {
  const c = clamp(t, 0, 1);
  return 1 - Math.pow(1 - c, 3);
};

export const easeInOutCubic = (t: number): number => {
  const c = clamp(t, 0, 1);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
};

export const hash01 = (seed: number): number => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

export const describeArc = (r: number, startDeg: number, endDeg: number): string => {
  if (endDeg - startDeg <= 0.1) return '';
  const cappedEnd = Math.min(startDeg + 359.6, endDeg);
  const a0 = (startDeg * Math.PI) / 180;
  const a1 = (cappedEnd * Math.PI) / 180;
  const x0 = r * Math.cos(a0);
  const y0 = r * Math.sin(a0);
  const x1 = r * Math.cos(a1);
  const y1 = r * Math.sin(a1);
  const large = cappedEnd - startDeg > 180 ? 1 : 0;
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
};

/**
 * 4 Curated Domain Color Decks (Zero #000 / #fff).
 * Synthesizes the tactile gouache warmth of `earth-24h` (`f_60`, `f_270`, `f_480`, `f_780`)
 * with the chromatic scientific clarity of Kurzgesagt & Kok Bisa?.
 */
export const DOMAIN_PALETTES = {
  anthropology: {
    skyTop: '#241736',
    skyMid: '#58304c',
    skyBot: '#c66e44',
    groundFar: '#462848',
    groundMid: '#361e38',
    groundNear: '#26142c',
    accentGold: '#f8c264',
    accentTerracotta: '#d45638',
    accentTeal: '#48a89c',
    creamLight: '#fff0cc',
  },
  biology: {
    skyTop: '#0e2e38',
    skyMid: '#1c5e68',
    skyBot: '#2e8890',
    groundFar: '#164c56',
    groundMid: '#123e46',
    groundNear: '#0c2c32',
    lobeFrontal: '#e26d5a',
    lobeParietal: '#ec9f4c',
    lobeTemporal: '#52a686',
    lobeOccipital: '#8268b8',
    lobeCerebellum: '#c45848',
    accHighlight: '#ffd872',
    cellMembrane: '#a8ece2',
    cellCytoplasm: '#ccf8f0',
    cellNucleus: '#24666e',
  },
  evolution: {
    skyTop: '#322052',
    skyMid: '#5c3b7c',
    skyBot: '#925ea8',
    groundFar: '#4d3268',
    groundMid: '#3a2452',
    groundNear: '#28173c',
    strataTop: '#5c3d30',
    strataMid: '#8e5a3a',
    strataDeep: '#6c3e2e',
    strataAncient: '#54586a',
    fossilIvory: '#f2e6ce',
    branchGold: '#f4b858',
    branchEmerald: '#56be8c',
  },
  environment: {
    skyTop: '#3e1216',
    skyMid: '#68241e',
    skyBot: '#98482c',
    groundFar: '#782c26',
    groundMid: '#561a1c',
    groundNear: '#3c1014',
    glowAmber: '#fcb860',
    causticMint: '#b8f6ec',
  },
} as const;

export const SKIN_PALETTES = {
  warm_tan:     { base: '#d6956c', shadow: '#a86b48', highlight: '#f2be96', blush: '#e07262' },
  cinnamon:     { base: '#bc7852', shadow: '#8e5234', highlight: '#dc9c74', blush: '#cd5e50' },
  golden_ochre: { base: '#dfa276', shadow: '#b2764e', highlight: '#f6cba6', blush: '#e47a6a' },
  deep_umber:   { base: '#8e563c', shadow: '#643824', highlight: '#b47858', blush: '#a84a40' },
} as const;

export type SkinToneName = keyof typeof SKIN_PALETTES;

