/**
 * Anthropology Explanation ("Human Odyssey Filmic 2D") — Pure-Code Design Tokens,
 * Color Scripts, Types & Mass-Aware Easing Utilities.
 *
 * Strictly JSX-free (.ts). Never uses pure #000000 or #FFFFFF.
 */

export type VisualIntent =
  | 'world_establishing'
  | 'environmental_living'
  | 'migration_movement'
  | 'tool_innovation'
  | 'social_ritual'
  | 'evolutionary_branching'
  | 'biological_mechanism'
  | 'climate_shift'
  | 'scale_comparison'
  | 'cause_and_effect'
  | 'myth_vs_evidence'
  | 'human_portrait'
  | 'time_passage'
  | 'reflective_synthesis';

export type VisualGrammar =
  | 'scenic_landscape'
  | 'character_action'
  | 'topographic_map'
  | 'biological_cutaway'
  | 'evolutionary_tree'
  | 'scale_comparison'
  | 'artifact_closeup'
  | 'cinematic_title';

export type ShotSize =
  | 'extreme_wide'
  | 'wide'
  | 'medium_wide'
  | 'medium'
  | 'close_up'
  | 'macro_cutaway'
  | 'top_down_map';

export type CameraMode =
  | 'locked_off'
  | 'slow_push_in'
  | 'slow_pull_out'
  | 'gentle_pan_right'
  | 'gentle_pan_left'
  | 'crane_reveal'
  | 'topdown_track';

export type TransitionType =
  | 'motivated_cut'
  | 'cross_dissolve'
  | 'light_flare_wipe'
  | 'match_cut'
  | 'scale_dive';

export type ColorScriptName =
  | 'sunlit_odyssey'
  | 'golden_sunset'
  | 'campfire_night'
  | 'storm_tundra'
  | 'bio_anatomy'
  | 'cartographic_atlas';

export interface NarrativeUnit {
  id: string;
  startSec: number;
  endSec: number;
  narrationText: string;
  coreConcept: string;
  visualIntent: VisualIntent;
  visualGrammar: VisualGrammar;
  shotSize: ShotSize;
  cameraMode: CameraMode;
  colorScript: ColorScriptName;
  transitionIn: TransitionType;
  scientificConfidence?: 'confirmed' | 'inferred' | 'hypothesis';
  sourceCitation?: string;
}

export interface ColorScriptPalette {
  name: ColorScriptName;
  skyTop: string;
  skyMid: string;
  skyHorizon: string;
  keyLight: string;
  sunCore: string;
  fillAmbient: string;
  shadowTint: string;
  deepInk: string;
  earthLight: string;
  earthMid: string;
  earthDark: string;
  foliageSun: string;
  foliageMid: string;
  foliageShadow: string;
  waterLight: string;
  waterDeep: string;
  parchment: string;
  parchmentEdge: string;
  brassGold: string;
  crimsonPin: string;
  bioCyan: string;
}

/**
 * 6 Filmic Color Scripts calibrated directly from the Human Odyssey Texture Pack.
 * Zero pure #000000 and zero pure #FFFFFF anywhere.
 */
export const ODYSSEY_COLOR_SCRIPTS: Record<ColorScriptName, ColorScriptPalette> = {
  sunlit_odyssey: {
    name: 'sunlit_odyssey',
    skyTop: '#3E72A8',
    skyMid: '#79A5CA',
    skyHorizon: '#F1D49E',
    keyLight: '#F9DFAA',
    sunCore: '#FDF4D7',
    fillAmbient: '#6D8AA4',
    shadowTint: '#362724',
    deepInk: '#211816',
    earthLight: '#DDA06B',
    earthMid: '#A96640',
    earthDark: '#593326',
    foliageSun: '#A5B44B',
    foliageMid: '#567536',
    foliageShadow: '#263B23',
    waterLight: '#7FC2D4',
    waterDeep: '#2C5E78',
    parchment: '#EAD8B4',
    parchmentEdge: '#B89564',
    brassGold: '#D8A24A',
    crimsonPin: '#C44536',
    bioCyan: '#4EC2D6',
  },
  golden_sunset: {
    name: 'golden_sunset',
    skyTop: '#3C3258',
    skyMid: '#B85B48',
    skyHorizon: '#F4BC6B',
    keyLight: '#F6C275',
    sunCore: '#FBECC4',
    fillAmbient: '#6E5066',
    shadowTint: '#2E1E28',
    deepInk: '#1D1419',
    earthLight: '#DA8952',
    earthMid: '#9B4C32',
    earthDark: '#4D2420',
    foliageSun: '#9E8C3A',
    foliageMid: '#4E572C',
    foliageShadow: '#242B1E',
    waterLight: '#D89A72',
    waterDeep: '#3C3852',
    parchment: '#EAD5AD',
    parchmentEdge: '#B68A55',
    brassGold: '#DF9B43',
    crimsonPin: '#CA4737',
    bioCyan: '#58BACB',
  },
  campfire_night: {
    name: 'campfire_night',
    skyTop: '#111B33',
    skyMid: '#1C3052',
    skyHorizon: '#2B4C6A',
    keyLight: '#F29A44',
    sunCore: '#FCE49C',
    fillAmbient: '#3B6488',
    shadowTint: '#151A28',
    deepInk: '#121620',
    earthLight: '#B77246',
    earthMid: '#6C4234',
    earthDark: '#2A1D24',
    foliageSun: '#4C6F52',
    foliageMid: '#28423B',
    foliageShadow: '#162426',
    waterLight: '#68B4CC',
    waterDeep: '#1A3950',
    parchment: '#E6D2AE',
    parchmentEdge: '#A98456',
    brassGold: '#D89E4A',
    crimsonPin: '#CF4B3A',
    bioCyan: '#5BD5C8',
  },
  storm_tundra: {
    name: 'storm_tundra',
    skyTop: '#2D3A4C',
    skyMid: '#586A80',
    skyHorizon: '#98A7B6',
    keyLight: '#D8E3EC',
    sunCore: '#EEF2F4',
    fillAmbient: '#4D5E74',
    shadowTint: '#222A36',
    deepInk: '#171C24',
    earthLight: '#C5C8CE',
    earthMid: '#7D8796',
    earthDark: '#3A4352',
    foliageSun: '#748E7A',
    foliageMid: '#455B54',
    foliageShadow: '#233132',
    waterLight: '#89AEC2',
    waterDeep: '#2C465A',
    parchment: '#E4DCCB',
    parchmentEdge: '#9E937D',
    brassGold: '#C89B54',
    crimsonPin: '#B8443A',
    bioCyan: '#60B8CE',
  },
  bio_anatomy: {
    name: 'bio_anatomy',
    skyTop: '#122232',
    skyMid: '#1C3C4E',
    skyHorizon: '#234C5E',
    keyLight: '#F3DFC1',
    sunCore: '#FBF1DD',
    fillAmbient: '#3B788E',
    shadowTint: '#14202C',
    deepInk: '#101820',
    earthLight: '#DFCCB0',
    earthMid: '#B89B7A',
    earthDark: '#5A4538',
    foliageSun: '#7CA854',
    foliageMid: '#4A733A',
    foliageShadow: '#243C24',
    waterLight: '#58C4DC',
    waterDeep: '#19465E',
    parchment: '#ECE0C6',
    parchmentEdge: '#B89B6C',
    brassGold: '#DBA650',
    crimsonPin: '#C84B42',
    bioCyan: '#58DCE8',
  },
  cartographic_atlas: {
    name: 'cartographic_atlas',
    skyTop: '#19354B',
    skyMid: '#244C66',
    skyHorizon: '#2F5F7B',
    keyLight: '#F4DFB4',
    sunCore: '#FAF0D6',
    fillAmbient: '#3E6E8A',
    shadowTint: '#172938',
    deepInk: '#13202A',
    earthLight: '#DFC592',
    earthMid: '#B99762',
    earthDark: '#6A4E31',
    foliageSun: '#8BA262',
    foliageMid: '#587042',
    foliageShadow: '#2E4029',
    waterLight: '#5D98B4',
    waterDeep: '#1D3E56',
    parchment: '#ECDAB4',
    parchmentEdge: '#B28A56',
    brassGold: '#DCA248',
    crimsonPin: '#C73F33',
    bioCyan: '#66C4D4',
  },
};

// =============================================================================
// DETERMINISTIC MATH & MASS-AWARE FILM EASING CURVES
// =============================================================================

export const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * clamp(t, 0, 1);

export const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = clamp((x - edge0) / Math.max(1e-5, edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

export const easeInOutCubic = (t: number): number => {
  const x = clamp(t, 0, 1);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

/** Heavy geological / monumental settle — slow deliberate start, weighty deceleration. */
export const easeHeavyStone = (t: number): number => {
  const x = clamp(t, 0, 1);
  return 1 - Math.pow(1 - x, 3.6);
};

/** Organic human / living arc — gentle anticipation into smooth natural rest. */
export const easeHumanArc = (t: number): number => {
  const x = clamp(t, 0, 1);
  return Math.sin((x * Math.PI) / 2);
};

/** Cartographic route / timeline ink progression — steady readable flow with crisp arrival. */
export const easeRouteDraw = (t: number): number => {
  const x = clamp(t, 0, 1);
  return x < 0.15 ? (x / 0.15) * (x / 0.15) * 0.12 : 0.12 + 0.88 * (1 - Math.pow(1 - (x - 0.15) / 0.85, 2.2));
};

/** Continuous water / breath / wind harmonic oscillation in [0, 1]. */
export const easeWaterFlow = (frame: number, periodFrames = 90, phase = 0): number => {
  return 0.5 + 0.5 * Math.sin((frame / periodFrames) * Math.PI * 2 + phase);
};

/** Deterministic pseudo-random scalar in [0, 1) for stable pure-code particles & textures. */
export const hash01 = (seed: number): number => {
  const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return s - Math.floor(s);
};
