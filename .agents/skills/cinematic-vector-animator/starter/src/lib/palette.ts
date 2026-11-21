import bible from '../art-bible.json';

/** Palet langsung dari art-bible.json — satu sumber kebenaran. */
export const P = {
  shadow: bible.palette.shadow,
  base: bible.palette.base,
  highlight: bible.palette.highlight,
  accent: bible.palette.accent,
};

export const FX = bible.fx;
export const LAYERS = bible.depth.layers;
export const SAFE = bible.format.safeZones;
export const W = bible.format.width;
export const H = bible.format.height;
