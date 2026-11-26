import React from 'react';
import { clamp, lerp, SKIN_PALETTES, SkinToneName } from './palettes';

export type IllustratedEraVariant =
  | 'athlete_modern'
  | 'modern_casual'
  | 'scientist_lab'
  | 'nusantara_bride'
  | 'nusantara_groom'
  | 'traditional_villager'
  | 'prehistoric_hunter'
  | 'elder_mentor'
  | 'curious_child'
  | 'solemn_mourner';

export type IllustratedMood =
  | 'curious'
  | 'happy'
  | 'amazed'
  | 'anxious'
  | 'focused'
  | 'reverent'
  | 'speaking';

export type IllustratedView = 'three-quarter' | 'side' | 'front';

export type IllustratedPoseName =
  | 'stand_calm'
  | 'stand_tense'
  | 'crouch_tie'
  | 'touch_wrist'
  | 'exchange_gift'
  | 'ritual_breathe'
  | 'ritual_raise'
  | 'bow_reverent'
  | 'sit_desk'
  | 'hold_lantern'
  | 'observe_child';

export interface IllustratedPoseAngles {
  hipY: number;
  torsoLean: number;
  headTilt: number;
  shL: number;
  elL: number;
  shR: number;
  elR: number;
  hipL: number;
  kneeL: number;
  hipR: number;
  kneeR: number;
}

export const ILLUSTRATED_POSES: Record<IllustratedPoseName, IllustratedPoseAngles> = {
  stand_calm: {
    hipY: -96, torsoLean: 2, headTilt: -2,
    shL: -10, elL: 18, shR: 14, elR: 24,
    hipL: -6, kneeL: -5, hipR: 8, kneeR: -5,
  },
  stand_tense: {
    hipY: -93, torsoLean: 11, headTilt: 8,
    shL: 20, elL: 62, shR: 30, elR: 70,
    hipL: -10, kneeL: -14, hipR: 14, kneeR: -12,
  },
  crouch_tie: {
    hipY: -46, torsoLean: 36, headTilt: 24,
    shL: 44, elL: 28, shR: 54, elR: 22,
    hipL: 78, kneeL: -116, hipR: 52, kneeR: -92,
  },
  touch_wrist: {
    hipY: -96, torsoLean: 4, headTilt: 10,
    shL: 42, elL: 76, shR: 52, elR: 88,
    hipL: -6, kneeL: -5, hipR: 8, kneeR: -5,
  },
  exchange_gift: {
    hipY: -95, torsoLean: 9, headTilt: 5,
    shL: 52, elL: 34, shR: 62, elR: 28,
    hipL: -7, kneeL: -7, hipR: 9, kneeR: -7,
  },
  ritual_breathe: {
    hipY: -96, torsoLean: 0, headTilt: -4,
    shL: 56, elL: 58, shR: 66, elR: 52,
    hipL: -5, kneeL: -4, hipR: 7, kneeR: -4,
  },
  ritual_raise: {
    hipY: -96, torsoLean: -4, headTilt: -10,
    shL: 118, elL: 28, shR: 130, elR: 22,
    hipL: -6, kneeL: -4, hipR: 8, kneeR: -4,
  },
  bow_reverent: {
    hipY: -94, torsoLean: 18, headTilt: 22,
    shL: 26, elL: 74, shR: 30, elR: 78,
    hipL: -4, kneeL: -6, hipR: 6, kneeR: -6,
  },
  sit_desk: {
    hipY: -62, torsoLean: 12, headTilt: 8,
    shL: 46, elL: 58, shR: 56, elR: 46,
    hipL: 82, kneeL: -88, hipR: 78, kneeR: -86,
  },
  hold_lantern: {
    hipY: -95, torsoLean: 5, headTilt: 3,
    shL: 18, elL: 42, shR: 68, elR: 32,
    hipL: -6, kneeL: -5, hipR: 8, kneeR: -5,
  },
  observe_child: {
    hipY: -94, torsoLean: 5, headTilt: -14,
    shL: 14, elL: 36, shR: 24, elR: 48,
    hipL: -6, kneeL: -5, hipR: 8, kneeR: -5,
  },
};

export function blendIllustratedPoses(
  a: IllustratedPoseAngles,
  b: IllustratedPoseAngles,
  t: number
): IllustratedPoseAngles {
  const c = clamp(t, 0, 1);
  return {
    hipY: lerp(a.hipY, b.hipY, c),
    torsoLean: lerp(a.torsoLean, b.torsoLean, c),
    headTilt: lerp(a.headTilt, b.headTilt, c),
    shL: lerp(a.shL, b.shL, c),
    elL: lerp(a.elL, b.elL, c),
    shR: lerp(a.shR, b.shR, c),
    elR: lerp(a.elR, b.elR, c),
    hipL: lerp(a.hipL, b.hipL, c),
    kneeL: lerp(a.kneeL, b.kneeL, c),
    hipR: lerp(a.hipR, b.hipR, c),
    kneeR: lerp(a.kneeR, b.kneeR, c),
  };
}

interface OutfitColors {
  topMain: string;
  topShadow: string;
  topAccent: string;
  botMain: string;
  botShadow: string;
  shoeCol: string;
  hairCol: string;
  longGarment?: boolean;
}

function getOutfitForVariant(v: IllustratedEraVariant, seed: number): OutfitColors {
  switch (v) {
    case 'athlete_modern':
      return {
        topMain: '#d45238',
        topShadow: '#9a3422',
        topAccent: '#f8cc68',
        botMain: '#283654',
        botShadow: '#1a243a',
        shoeCol: '#e8dcc4',
        hairCol: '#241622',
      };
    case 'scientist_lab':
      return {
        topMain: '#ede4d4',
        topShadow: '#c8bca6',
        topAccent: '#4898a8',
        botMain: '#2e3e58',
        botShadow: '#1e283c',
        shoeCol: '#382830',
        hairCol: '#2c1c28',
      };
    case 'nusantara_bride':
      return {
        topMain: '#c84a3c',
        topShadow: '#922e24',
        topAccent: '#f6c464',
        botMain: '#783c2a',
        botShadow: '#54261a',
        shoeCol: '#48241c',
        hairCol: '#1e121c',
        longGarment: true,
      };
    case 'nusantara_groom':
      return {
        topMain: '#384e74',
        topShadow: '#243450',
        topAccent: '#f6c464',
        botMain: '#783c2a',
        botShadow: '#54261a',
        shoeCol: '#34201c',
        hairCol: '#1e121c',
      };
    case 'traditional_villager':
      return {
        topMain: seed % 2 === 0 ? '#c26a38' : '#3d7a6e',
        topShadow: seed % 2 === 0 ? '#8e4822' : '#28544c',
        topAccent: '#f2be62',
        botMain: '#5a3a2e',
        botShadow: '#3e261e',
        shoeCol: '#36221c',
        hairCol: '#221420',
        longGarment: seed % 2 === 1,
      };
    case 'prehistoric_hunter':
      return {
        topMain: '#9e6238',
        topShadow: '#6e4020',
        topAccent: '#d8a468',
        botMain: '#6e4226',
        botShadow: '#4c2c18',
        shoeCol: '#4c2e1c',
        hairCol: '#241620',
      };
    case 'elder_mentor':
      return {
        topMain: '#684c74',
        topShadow: '#463052',
        topAccent: '#e6b868',
        botMain: '#3e2c48',
        botShadow: '#2a1c32',
        shoeCol: '#2e1e28',
        hairCol: '#b8b0be',
        longGarment: true,
      };
    case 'curious_child':
      return {
        topMain: '#e89a3e',
        topShadow: '#b87024',
        topAccent: '#ffe298',
        botMain: '#365878',
        botShadow: '#243c54',
        shoeCol: '#462e28',
        hairCol: '#241520',
      };
    case 'solemn_mourner':
      return {
        topMain: '#3e385c',
        topShadow: '#282340',
        topAccent: '#9ab4d4',
        botMain: '#2b2644',
        botShadow: '#1c1830',
        shoeCol: '#221c30',
        hairCol: '#1c1222',
        longGarment: true,
      };
    case 'modern_casual':
    default:
      return {
        topMain: seed % 2 === 0 ? '#3a7ca5' : '#cf5c44',
        topShadow: seed % 2 === 0 ? '#265676' : '#983e2c',
        topAccent: '#f4c870',
        botMain: '#2c3850',
        botShadow: '#1d2538',
        shoeCol: '#3c2c34',
        hairCol: '#241522',
      };
  }
}

export interface IllustratedCharacterProps {
  f: number;
  x: number;
  y: number; // exact ground contact point
  scale?: number;
  facing?: 1 | -1;
  view?: IllustratedView;
  variant?: IllustratedEraVariant;
  skinTone?: SkinToneName;
  mood?: IllustratedMood;
  pose: IllustratedPoseName;
  blendToPose?: IllustratedPoseName;
  blendT?: number;
  rimIntensity?: number;
  rimColor?: string;
  rimFromFront?: boolean;
  showGroundShadow?: boolean;
  shadowStretch?: number;
  prop?: 'none' | 'vessel' | 'lantern' | 'flower' | 'magnifying_glass' | 'stone_tool';
  syncPhase?: number;
  tremble?: number;
  lookX?: number; // -1..1 pupil gaze offset
  lookY?: number; // -1..1 pupil gaze offset
  opacity?: number;
  seed?: number;
  idSuffix?: string;
}

/**
 * 2.5D Expressive Illustrated Human & Hominid Character Rig (`IllustratedCharacterRig`).
 * Combines Kok Bisa? / Kurzgesagt expressive facial acting & clean layered garments
 * with `earth-24h` 2.5D shading, warm rim-lighting, and physical ground contact.
 */
export const IllustratedCharacterRig: React.FC<IllustratedCharacterProps> = ({
  f,
  x,
  y,
  scale = 1,
  facing = 1,
  view = 'three-quarter',
  variant = 'modern_casual',
  skinTone = 'warm_tan',
  mood = 'curious',
  pose,
  blendToPose,
  blendT = 0,
  rimIntensity = 0.82,
  rimColor = '#ffe098',
  rimFromFront = true,
  showGroundShadow = true,
  shadowStretch = -0.9,
  prop = 'none',
  syncPhase = 0,
  tremble = 0,
  lookX = 0.25,
  lookY = 0,
  opacity = 1,
  seed = 1,
  idSuffix = 'ic',
}) => {
  if (opacity <= 0.01) return null;
  const base = blendToPose
    ? blendIllustratedPoses(ILLUSTRATED_POSES[pose], ILLUSTRATED_POSES[blendToPose], blendT)
    : ILLUSTRATED_POSES[pose];

  const skin = SKIN_PALETTES[skinTone];
  const outfit = getOutfitForVariant(variant, seed);

  // Organic breathing, 5-frame head-lag, natural non-periodic eye blink!
  const breath = Math.sin(f * 0.065 + seed * 2.1);
  const breathLag = Math.sin((f - 5) * 0.065 + seed * 2.1);
  const tremX = tremble > 0.01 ? Math.sin(f * 1.15 + seed * 5.7) * 1.5 * tremble : 0;

  const blinkPeriod = 82 + (seed % 5) * 13;
  const blinkPhase = (f + seed * 19) % blinkPeriod;
  const isBlinking = mood === 'reverent' || (blinkPhase > blinkPeriod - 5);

  const syncWave = syncPhase > 0.01 ? Math.sin(f * 0.11) * 14 * syncPhase : 0;
  const hipY = base.hipY + breath * 1.3;
  const torsoLean = base.torsoLean + breath * 1.1 - syncWave * 0.16;
  const headTilt = base.headTilt + breathLag * 1.8 - syncWave * 0.22;

  const shL = base.shL + syncWave * 0.9;
  const elL = base.elL + Math.sin(f * 0.08 + seed) * 3 - syncWave * 0.3;
  const shR = base.shR + syncWave;
  const elR = base.elR + Math.cos(f * 0.09 + seed) * 3 - syncWave * 0.3;

  const bodyScale = variant === 'curious_child' ? 0.68 : variant === 'elder_mentor' ? 0.97 : variant === 'nusantara_bride' ? 0.94 : 1.0;
  const headScale = variant === 'curious_child' ? 1.18 : 1.04;
  const rimOp = clamp(rimIntensity, 0, 1);
  const rimX1 = rimFromFront ? '100%' : '0%';
  const rimX2 = rimFromFront ? '10%' : '90%';

  const gTopId = `ic_top_${idSuffix}_${seed}`;
  const gBotId = `ic_bot_${idSuffix}_${seed}`;
  const gSkinId = `ic_sk_${idSuffix}_${seed}`;

  const LimbSeg: React.FC<{ len: number; w1: number; w2: number; fill: string; front?: boolean }> = ({
    len, w1, w2, fill, front = false,
  }) => {
    const h1 = w1 * 0.5;
    const h2 = w2 * 0.5;
    const rs = rimFromFront ? 1 : -1;
    return (
      <g>
        <path
          d={`M ${-h1} 0 C ${-h1 * 1.06} ${len * 0.35}, ${-h2 * 1.06} ${len * 0.72}, ${-h2} ${len} A ${h2} ${h2} 0 0 0 ${h2} ${len} C ${h2 * 1.06} ${len * 0.72}, ${h1 * 1.06} ${len * 0.35}, ${h1} 0 A ${h1} ${h1} 0 0 0 ${-h1} 0 Z`}
          fill={fill}
        />
        {front && rimOp > 0.12 && (
          <path
            d={`M ${rs * h1 * 0.88} 2 C ${rs * h1} ${len * 0.38}, ${rs * h2} ${len * 0.72}, ${rs * h2 * 0.86} ${len - 2}`}
            fill="none"
            stroke={rimColor}
            strokeWidth={2.0}
            strokeLinecap="round"
            opacity={rimOp * 0.82}
          />
        )}
      </g>
    );
  };

  return (
    <g transform={`translate(${x + tremX}, ${y})`} opacity={opacity}>
      {showGroundShadow && (
        <ellipse
          cx={shadowStretch * 26 * scale * bodyScale}
          cy={4}
          rx={(44 + Math.abs(shadowStretch) * 20) * scale * bodyScale}
          ry={9.5 * scale * bodyScale}
          fill="#10081a"
          opacity={0.5}
        />
      )}

      <g transform={`scale(${facing * scale * bodyScale}, ${scale * bodyScale})`}>
        <defs>
          <linearGradient id={gTopId} x1={rimX1} y1="10%" x2={rimX2} y2="90%">
            <stop offset="0%" stopColor={outfit.topMain} />
            <stop offset="68%" stopColor={outfit.topMain} />
            <stop offset="100%" stopColor={outfit.topShadow} />
          </linearGradient>
          <linearGradient id={gBotId} x1={rimX1} y1="10%" x2={rimX2} y2="90%">
            <stop offset="0%" stopColor={outfit.botMain} />
            <stop offset="100%" stopColor={outfit.botShadow} />
          </linearGradient>
          <linearGradient id={gSkinId} x1={rimX1} y1="12%" x2={rimX2} y2="88%">
            <stop offset="0%" stopColor={skin.highlight} />
            <stop offset="38%" stopColor={skin.base} />
            <stop offset="100%" stopColor={skin.shadow} />
          </linearGradient>
        </defs>

        {/* BACK LEG */}
        <g transform={`translate(-6, ${hipY}) rotate(${-base.hipL})`}>
          <LimbSeg len={48} w1={18} w2={13.5} fill={outfit.botShadow} />
          <g transform={`translate(0, 48) rotate(${-base.kneeL})`}>
            <LimbSeg len={46} w1={13} w2={10} fill={variant === 'athlete_modern' ? skin.shadow : outfit.botShadow} />
            <path d="M -5 44 L 15 46 C 18 48, 17 52, 10 52 L -7 52 Z" fill={outfit.shoeCol} />
          </g>
        </g>

        {/* BACK ARM */}
        <g transform={`translate(0, ${hipY}) rotate(${torsoLean})`}>
          <g transform={`translate(-5, -55) rotate(${-shL})`}>
            <LimbSeg len={35} w1={12.5} w2={10} fill={outfit.topShadow} />
            <g transform={`translate(0, 35) rotate(${-elL})`}>
              <LimbSeg len={32} w1={9.5} w2={7.5} fill={skin.shadow} />
              <ellipse cx={2} cy={34} rx={5.8} ry={7} fill={skin.shadow} />
            </g>
          </g>
        </g>

        {/* FRONT LEG or Ceremonial Sarong/Skirt */}
        {outfit.longGarment ? (
          <g>
            <path
              d={`M -17 ${hipY - 2} L 18 ${hipY - 2} L 24 -5 L -22 -5 Z`}
              fill={`url(#${gBotId})`}
            />
            {/* Traditional batik/woven gold hem motif */}
            <path d="M -20 -13 L 22 -13" stroke={outfit.topAccent} strokeWidth={3.2} strokeDasharray="6 4" opacity={0.85} />
            <path d="M 4 -5 L 18 -3 C 20 -1, 19 3, 12 3 L -4 3 Z" fill={outfit.shoeCol} />
          </g>
        ) : (
          <g transform={`translate(5, ${hipY}) rotate(${-base.hipR})`}>
            <LimbSeg len={48} w1={19} w2={14} fill={`url(#${gBotId})`} front />
            <g transform={`translate(0, 48) rotate(${-base.kneeR})`}>
              <LimbSeg len={46} w1={13.5} w2={10.5} fill={variant === 'athlete_modern' ? `url(#${gSkinId})` : `url(#${gBotId})`} front />
              {variant === 'athlete_modern' && (
                <g>
                  <rect x={-5.8} y={20} width={11.6} height={24} rx={3} fill="#f4ead6" />
                  <rect x={-5.8} y={24} width={11.6} height={3.8} fill="#d45238" />
                  <rect x={-5.8} y={30} width={11.6} height={3.8} fill="#d45238" />
                </g>
              )}
              <path d="M -5 44 L 16 46 C 19 48, 18 52, 11 52 L -7 52 Z" fill={outfit.shoeCol} />
            </g>
          </g>
        )}

        {/* TORSO & LAYERED GARMENT DETAILS */}
        <g transform={`translate(0, ${hipY}) rotate(${torsoLean})`}>
          <path
            d="M -16 8 C -19 -16, -20 -46, -16 -60 C -9 -67, 10 -67, 17 -59 C 21 -44, 20 -16, 18 8 Z"
            fill={`url(#${gTopId})`}
          />
          {/* Collar / Sash / Lapel Details */}
          {(variant === 'nusantara_bride' || variant === 'nusantara_groom' || variant === 'traditional_villager') && (
            <path d="M -13 -58 L 16 -22 L 13 -12 L -16 -48 Z" fill={outfit.topAccent} opacity={0.82} />
          )}
          {variant === 'scientist_lab' && (
            <g>
              <polygon points="-6,-62 10,-62 4,-26 -4,-26" fill="#4898a8" />
              <polyline points="-8,-62 0,-36 10,-62" fill="none" stroke="#c8bca6" strokeWidth={2} />
            </g>
          )}
          {variant === 'athlete_modern' && (
            <path d="M -14 -34 L 16 -38 L 16 -28 L -14 -24 Z" fill={outfit.topAccent} opacity={0.9} />
          )}
          {rimOp > 0.1 && (
            <path
              d={rimFromFront ? 'M 17 -58 C 20 -40, 20 -16, 18 8' : 'M -16 -58 C -19 -40, -19 -16, -17 8'}
              fill="none"
              stroke={rimColor}
              strokeWidth={2.3}
              strokeLinecap="round"
              opacity={rimOp * 0.85}
            />
          )}

          {/* === EXPRESSIVE ILLUSTRATED HEAD (EYES, BROWS, NOSE, CHEEKS, MOUTH & HAIR!) === */}
          <g transform={`translate(2, -67) rotate(${headTilt}) scale(${headScale})`}>
            {/* Neck with subtle chin cast shadow */}
            <rect x={-6.5} y={-9} width={13} height={15} rx={5} fill={skin.shadow} />
            <rect x={-5.5} y={-9} width={11} height={11} rx={4} fill={`url(#${gSkinId})`} />

            {/* Back hair volume */}
            <ellipse cx={-6} cy={-26} rx={16} ry={17} fill={outfit.hairCol} />

            {/* Sculpted Warm Illustrated Head Shape */}
            <path
              d="M -14 -23 C -15 -37, -5 -44, 7 -42 C 16 -40, 20 -31, 19 -21 C 19 -11, 14 -4, 4 -4 C -7 -4, -14 -11, -14 -23 Z"
              fill={`url(#${gSkinId})`}
            />

            {/* Ear with inner concha detail */}
            <ellipse cx={-10} cy={-21} rx={3.8} ry={5.2} fill={skin.base} stroke={skin.shadow} strokeWidth={0.9} />
            <path d="M -10.5 -23 Q -8.5 -21, -10.5 -19" fill="none" stroke={skin.shadow} strokeWidth={1.0} strokeLinecap="round" />

            {/* Expressive Cheek Blush */}
            <ellipse cx={4} cy={-16.5} rx={3.8} ry={2.2} fill={skin.blush} opacity={0.46} />
            {view !== 'side' && <ellipse cx={16.5} cy={-17.5} rx={2.5} ry={1.8} fill={skin.blush} opacity={0.38} />}

            {/* Sculpted Nose Bridge */}
            <path
              d={view === 'side' ? 'M 17 -26 L 22.5 -19.5 L 18 -17.5' : 'M 12.5 -26 L 15.8 -20.2 L 12.5 -18.8'}
              fill="none"
              stroke={skin.shadow}
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* === EYES & EYEBROWS (3/4, Front, or Side Profile) === */}
            {(() => {
              const eyePositions =
                view === 'side'
                  ? [{ cx: 11.5, cy: -24.5, rx: 3.4, ry: 3.8 }]
                  : [
                      { cx: 5.5, cy: -24.5, rx: 3.5, ry: 3.9 },
                      { cx: 15.2, cy: -24.8, rx: 3.0, ry: 3.6 },
                    ];

              const browTilt =
                mood === 'anxious' ? -14 : mood === 'amazed' ? 6 : mood === 'focused' ? 12 : mood === 'happy' ? -4 : 0;
              const browLift = mood === 'amazed' ? -3.0 : mood === 'curious' ? -1.4 : mood === 'focused' ? 1.4 : 0;

              return (
                <g>
                  {eyePositions.map((ep, ei) => (
                    <g key={ei} transform={`translate(${ep.cx}, ${ep.cy})`}>
                      {/* Eyebrow */}
                      <path
                        d={`M ${-ep.rx - 0.8} ${-5.4 + browLift} Q 0 ${-7.2 + browLift}, ${ep.rx + 0.8} ${-5.2 + browLift}`}
                        fill="none"
                        stroke={outfit.hairCol === '#b8b0be' ? '#8c8294' : outfit.hairCol}
                        strokeWidth={1.8}
                        strokeLinecap="round"
                        transform={`rotate(${ei === 0 ? browTilt : -browTilt * 0.7})`}
                      />
                      {isBlinking ? (
                        <path
                          d={`M ${-ep.rx} 0 Q 0 1.8, ${ep.rx} 0`}
                          fill="none"
                          stroke="#261420"
                          strokeWidth={1.9}
                          strokeLinecap="round"
                        />
                      ) : (
                        <g>
                          {/* Warm Cream Sclera */}
                          <ellipse cx={0} cy={0} rx={ep.rx} ry={ep.ry * (mood === 'amazed' ? 1.15 : 1)} fill="#faf2e4" />
                          {/* Deep Espresso Iris & Pupil */}
                          <ellipse
                            cx={clamp(lookX, -1, 1) * 1.1}
                            cy={clamp(lookY, -1, 1) * 0.9}
                            rx={ep.rx * 0.64}
                            ry={ep.ry * 0.68}
                            fill="#22121e"
                          />
                          {/* Pinpoint Specular Catchlight (brings the character alive!) */}
                          <circle
                            cx={clamp(lookX, -1, 1) * 0.8 - 0.8}
                            cy={clamp(lookY, -1, 1) * 0.6 - 1.1}
                            r={1.05}
                            fill="#fff9ec"
                          />
                        </g>
                      )}
                    </g>
                  ))}
                </g>
              );
            })()}

            {/* === EXPRESSIVE MOUTH === */}
            <g transform={`translate(${view === 'side' ? 14.5 : 10.5}, -12.5)`}>
              {mood === 'amazed' ? (
                <ellipse cx={0} cy={0} rx={2.6} ry={3.2} fill="#5c2428" />
              ) : mood === 'speaking' ? (
                <ellipse cx={0} cy={0} rx={3.0} ry={1.4 + Math.abs(Math.sin(f * 0.35 + seed)) * 2.2} fill="#68282c" />
              ) : mood === 'anxious' ? (
                <path d="M -3.5 1.2 Q 0 -1.4, 3.5 1.2" fill="none" stroke="#582828" strokeWidth={1.7} strokeLinecap="round" />
              ) : mood === 'happy' ? (
                <path d="M -3.8 -0.8 Q 0 3.0, 3.8 -0.6" fill="none" stroke="#582828" strokeWidth={1.8} strokeLinecap="round" />
              ) : (
                <path d="M -3.0 0 Q 0 1.6, 3.2 -0.2" fill="none" stroke="#582828" strokeWidth={1.65} strokeLinecap="round" />
              )}
            </g>

            {/* Front Hair / Crown / Cultural Headgear */}
            {variant === 'nusantara_bride' ? (
              <g>
                <path d="M -15 -24 C -16 -39, -3 -46, 12 -42 C 18 -40, 20 -34, 15 -32 C 3 -35, -6 -29, -10 -16 Z" fill={outfit.hairCol} />
                <circle cx={-17} cy={-26} r={8.8} fill={outfit.hairCol} />
                <path d="M -14 -36 L -21 -50 M -8 -40 L -11 -54 M -2 -41 L 1 -53" stroke="#f8cc74" strokeWidth={1.6} strokeLinecap="round" />
                <circle cx={-21} cy={-51} r={2.2} fill="#fff0cc" />
                <circle cx={-11} cy={-55} r={2.2} fill="#fff0cc" />
                <circle cx={1} cy={-54} r={2.2} fill="#fff0cc" />
              </g>
            ) : variant === 'nusantara_groom' ? (
              <g>
                <path d="M -15 -24 C -16 -38, -4 -44, 10 -42 C 16 -41, 18 -36, 15 -33 C 4 -36, -6 -31, -11 -18 Z" fill={outfit.hairCol} />
                <path d="M -16 -32 L -13 -47 C -4 -51, 11 -49, 17 -44 L 16 -31 Z" fill="#2c1d32" stroke="#f6c464" strokeWidth={1.5} />
              </g>
            ) : (
              <path
                d="M -15 -22 C -18 -38, -5 -46, 10 -43 C 17 -41, 20 -35, 16 -32 C 6 -36, -5 -32, -10 -19 C -12 -15, -14 -16, -15 -22 Z"
                fill={outfit.hairCol}
              />
            )}

            {variant === 'elder_mentor' && (
              <path d="M 11 -8 C 16 -2, 14 7, 7 8 C 1 7, -1 1, 3 -6 Z" fill={outfit.hairCol} />
            )}

            {/* Warm Catchlight Rim on Forehead & Cheek */}
            {rimOp > 0.14 && (
              <path
                d={rimFromFront ? 'M 9 -41 C 16 -39, 19.5 -31, 19 -21' : 'M -14 -33 C -16 -25, -15 -15, -11 -9'}
                fill="none"
                stroke={rimColor}
                strokeWidth={2.0}
                strokeLinecap="round"
                opacity={rimOp * 0.85}
              />
            )}
          </g>

          {/* FRONT ARM + HAND + PROPS */}
          <g transform={`translate(5, -54) rotate(${-shR})`}>
            <LimbSeg len={35} w1={13} w2={10.5} fill={`url(#${gTopId})`} front />
            <g transform={`translate(0, 35) rotate(${-elR})`}>
              <LimbSeg len={32} w1={10} w2={8} fill={`url(#${gSkinId})`} front />
              {variant === 'athlete_modern' && (
                <rect x={-5.2} y={26} width={10.4} height={4.5} rx={2} fill="#f8b65c" stroke="#ffecc4" strokeWidth={0.9} />
              )}
              <g transform="translate(0, 33)">
                <ellipse cx={2} cy={3} rx={6} ry={7.2} fill={`url(#${gSkinId})`} />

                {prop === 'vessel' && (
                  <g transform={`rotate(${(shR + elR - torsoLean).toFixed(1)}) translate(10, -4)`}>
                    <ellipse cx={0} cy={-4} rx={16} ry={16} fill="#f8b65c" opacity={0.3} />
                    <path d="M -12 0 Q 0 12, 12 0 L 9 -6 L -9 -6 Z" fill="#e69a3c" stroke="#ffecc4" strokeWidth={1.3} />
                    <ellipse cx={0} cy={-6} rx={9} ry={3.2} fill="#ffe4a4" />
                  </g>
                )}

                {prop === 'lantern' && (
                  <g transform={`rotate(${(shR + elR - torsoLean).toFixed(1)}) translate(8, 2)`}>
                    <line x1={0} y1={0} x2={0} y2={14} stroke="#f8c878" strokeWidth={1.8} />
                    <circle cx={0} cy={26} r={34} fill="#f8b65c" opacity={0.34} style={{ mixBlendMode: 'screen' }} />
                    <rect x={-8} y={14} width={16} height={22} rx={6} fill="#f6ae4c" stroke="#c85828" strokeWidth={1.3} />
                    <ellipse cx={0} cy={25} rx={4.5} ry={7} fill="#fff2cc" />
                  </g>
                )}

                {prop === 'flower' && (
                  <g transform={`rotate(${(shR + elR - torsoLean).toFixed(1)}) translate(7, 0)`}>
                    <circle cx={0} cy={0} r={4.5} fill="#f6e6c4" />
                    <circle cx={6} cy={3} r={3.8} fill="#f8c474" />
                    <circle cx={3} cy={-4} r={3.5} fill="#f6e6c4" />
                  </g>
                )}

                {prop === 'magnifying_glass' && (
                  <g transform="rotate(-28) translate(10, -4)">
                    <line x1={-8} y1={8} x2={4} y2={-4} stroke="#5c3a28" strokeWidth={4} strokeLinecap="round" />
                    <circle cx={14} cy={-14} r={14} fill="rgba(168,236,226,0.35)" stroke="#f4c46c" strokeWidth={3} />
                  </g>
                )}
              </g>
            </g>
          </g>
        </g>
      </g>
    </g>
  );
};
