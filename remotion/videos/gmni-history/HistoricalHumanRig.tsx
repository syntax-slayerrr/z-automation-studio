import React from 'react';
import { clamp, lampGlow, lerp, starPoints } from './fx';

export type HistRole =
  | 'student_male'
  | 'student_female'
  | 'hadiprabowo'
  | 'bung_karno'
  | 'farmer'
  | 'worker'
  | 'merchant';

export type HistPose =
  | 'walk_books'
  | 'discuss_stand'
  | 'sit_meeting'
  | 'sit_circle'
  | 'lead_meeting'
  | 'orate_podium'
  | 'farm_hoe'
  | 'march_flag'
  | 'march_raise'
  | 'social_help'
  | 'stand_proud';

interface PoseDef {
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

const POSES: Record<HistPose, PoseDef> = {
  walk_books: {
    hipY: -96, torsoLean: 5, headTilt: -2,
    shL: -18, elL: 24, shR: 34, elR: 84,
    hipL: -18, kneeL: -12, hipR: 20, kneeR: -10,
  },
  discuss_stand: {
    hipY: -96, torsoLean: 4, headTilt: -3,
    shL: 24, elL: 78, shR: 54, elR: 52,
    hipL: -6, kneeL: -6, hipR: 8, kneeR: -6,
  },
  sit_meeting: {
    hipY: -62, torsoLean: 12, headTilt: 4,
    shL: 42, elL: 64, shR: 56, elR: 48,
    hipL: 82, kneeL: -88, hipR: 78, kneeR: -86,
  },
  sit_circle: {
    hipY: -54, torsoLean: 18, headTilt: 10,
    shL: 36, elL: 72, shR: 62, elR: 56,
    hipL: 74, kneeL: -96, hipR: 68, kneeR: -94,
  },
  lead_meeting: {
    hipY: -96, torsoLean: 8, headTilt: -4,
    shL: 32, elL: 74, shR: 88, elR: 34,
    hipL: -6, kneeL: -6, hipR: 10, kneeR: -6,
  },
  orate_podium: {
    hipY: -96, torsoLean: 6, headTilt: -10,
    shL: 42, elL: 68, shR: 132, elR: 18,
    hipL: -6, kneeL: -4, hipR: 8, kneeR: -4,
  },
  farm_hoe: {
    hipY: -90, torsoLean: 24, headTilt: 10,
    shL: 48, elL: 42, shR: 62, elR: 26,
    hipL: -18, kneeL: -18, hipR: 22, kneeR: -24,
  },
  march_flag: {
    hipY: -96, torsoLean: 7, headTilt: -5,
    shL: -22, elL: 26, shR: 76, elR: 42,
    hipL: -24, kneeL: -16, hipR: 26, kneeR: -12,
  },
  march_raise: {
    hipY: -96, torsoLean: 10, headTilt: -8,
    shL: -16, elL: 28, shR: 128, elR: 22,
    hipL: -20, kneeL: -14, hipR: 22, kneeR: -12,
  },
  social_help: {
    hipY: -86, torsoLean: 20, headTilt: 14,
    shL: 44, elL: 44, shR: 58, elR: 36,
    hipL: -10, kneeL: -14, hipR: 18, kneeR: -18,
  },
  stand_proud: {
    hipY: -96, torsoLean: 2, headTilt: -4,
    shL: -6, elL: 16, shR: 14, elR: 24,
    hipL: -6, kneeL: -4, hipR: 8, kneeR: -4,
  },
};

function blendPose(a: PoseDef, b: PoseDef, t: number): PoseDef {
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

export interface HistoricalHumanProps {
  f: number;
  x: number;
  y: number; // exact ground contact point!
  scale?: number;
  facing?: 1 | -1;
  role?: HistRole;
  pose: HistPose;
  blendToPose?: HistPose;
  blendT?: number;
  rimIntensity?: number;
  rimColor?: string;
  rimFromFront?: boolean;
  showGroundShadow?: boolean;
  shadowStretch?: number;
  prop?: 'none' | 'books' | 'hoe' | 'basket' | 'banner' | 'gmni_flag' | 'scroll' | 'gavel' | 'box';
  wearPeci?: boolean;
  redScarf?: boolean; // GMNI red attribute ribbon / scarf!
  seed?: number;
  idSuffix?: string;
}

/**
 * 100% Pure-Code 1950s Indonesian Historical Articulated 2D Rig (Twilight Parchment Style).
 * Grounded at (x, y) with tapered rounded SVG limbs, seamless pivots, breathing, 5-frame head-lag,
 * 1950s attire (peci, safari suit, collared shirts, caping, kebaya/bun), and dynamic warm rim-lighting.
 */
export const HistoricalHumanRig: React.FC<HistoricalHumanProps> = ({
  f,
  x,
  y,
  scale = 1,
  facing = 1,
  role = 'student_male',
  pose,
  blendToPose,
  blendT = 0,
  rimIntensity = 0.78,
  rimColor = '#f8ba62',
  rimFromFront = true,
  showGroundShadow = true,
  shadowStretch = -1.1,
  prop = 'none',
  wearPeci = false,
  redScarf = false,
  seed = 1,
  idSuffix = 'hr',
}) => {
  const base = blendToPose ? blendPose(POSES[pose], POSES[blendToPose], blendT) : POSES[pose];
  const lg = lampGlow(f, seed);

  const breath = Math.sin(f * 0.06 + seed * 2.1);
  const breathLag = Math.sin((f - 5) * 0.06 + seed * 2.1);

  const isWalking = (pose === 'walk_books' || pose === 'march_flag' || pose === 'march_raise') && (!blendToPose || blendT < 0.5);
  const walkCyc = isWalking ? Math.sin(f * 0.24 + seed) : 0;
  const walkBob = isWalking ? Math.abs(Math.cos(f * 0.24 + seed)) * -5.0 : 0;

  const isSpeaking = pose === 'orate_podium' || pose === 'lead_meeting' || pose === 'discuss_stand' || pose === 'sit_circle';
  const speakWave = isSpeaking ? Math.sin(f * 0.16 + seed) * (pose === 'orate_podium' ? 16 : 10) : 0;
  const farmSwing = pose === 'farm_hoe' ? Math.sin(f * 0.16 + seed) * 18 : 0;

  const hipY = base.hipY + breath * 1.2 + walkBob;
  const torsoLean = base.torsoLean + breath * 1.1;
  const headTilt = base.headTilt + breathLag * 1.8;

  const shL = base.shL - walkCyc * 20 - speakWave * 0.4;
  const elL = base.elL + Math.sin(f * 0.07 + seed) * 3;
  const shR = base.shR + walkCyc * 10 + speakWave - farmSwing;
  const elR = base.elR + Math.cos(f * 0.08 + seed) * 4 + farmSwing * 0.3;

  const hipL = base.hipL + walkCyc * 24;
  const kneeL = base.kneeL - Math.max(0, -walkCyc) * 18;
  const hipR = base.hipR - walkCyc * 24;
  const kneeR = base.kneeR - Math.max(0, walkCyc) * 18;

  const rimOp = clamp(rimIntensity * lg, 0, 1);
  const hasPeci = wearPeci || role === 'bung_karno' || role === 'hadiprabowo';

  // Twilight archival attire tones (NO #000/#fff!)
  const jacketDark = role === 'bung_karno' ? '#2c2230' : role === 'hadiprabowo' ? '#261a2c' : role === 'worker' ? '#2d1c28' : '#2a1a2e';
  const jacketMid = role === 'bung_karno' ? '#4f3f4a' : role === 'hadiprabowo' ? '#442f42' : role === 'student_female' ? '#4a2b3e' : '#463244';
  const pantsDark = '#1d1124';
  const skinCol = '#3b2434';
  const hairCol = '#170d1e';

  const rimX1 = rimFromFront ? '100%' : '0%';
  const rimX2 = rimFromFront ? '12%' : '88%';
  const gCoatId = `hc_coat_${idSuffix}_${seed}`;
  const gSkinId = `hc_skin_${idSuffix}_${seed}`;

  const Limb: React.FC<{ len: number; w1: number; w2: number; fill: string; front?: boolean }> = ({
    len, w1, w2, fill, front = false,
  }) => {
    const h1 = w1 * 0.5;
    const h2 = w2 * 0.5;
    const rs = rimFromFront ? 1 : -1;
    return (
      <g>
        <path
          d={`M ${-h1} 0 L ${-h2} ${len} A ${h2} ${h2} 0 0 0 ${h2} ${len} L ${h1} 0 A ${h1} ${h1} 0 0 0 ${-h1} 0 Z`}
          fill={fill}
        />
        {front && rimOp > 0.1 && (
          <line
            x1={rs * h1 * 0.88}
            y1={2}
            x2={rs * h2 * 0.88}
            y2={len - 2}
            stroke={rimColor}
            strokeWidth={2.1}
            strokeLinecap="round"
            opacity={rimOp * 0.8}
          />
        )}
      </g>
    );
  };

  return (
    <g transform={`translate(${x}, ${y})`}>
      {showGroundShadow && (
        <ellipse
          cx={shadowStretch * 28 * scale}
          cy={4}
          rx={(42 + Math.abs(shadowStretch) * 20) * scale}
          ry={9.5 * scale}
          fill="#110718"
          opacity={0.55}
        />
      )}

      <g transform={`scale(${facing * scale}, ${scale})`}>
        <defs>
          <linearGradient id={gCoatId} x1={rimX1} y1="12%" x2={rimX2} y2="88%">
            <stop offset="0%" stopColor={rimColor} stopOpacity={0.42 * rimOp} />
            <stop offset="34%" stopColor={jacketMid} stopOpacity="1" />
            <stop offset="100%" stopColor={jacketDark} stopOpacity="1" />
          </linearGradient>
          <linearGradient id={gSkinId} x1={rimX1} y1="15%" x2={rimX2} y2="85%">
            <stop offset="0%" stopColor={rimColor} stopOpacity={0.46 * rimOp} />
            <stop offset="35%" stopColor={skinCol} stopOpacity="1" />
            <stop offset="100%" stopColor="#221226" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* BACK LEG */}
        <g transform={`translate(-6, ${hipY}) rotate(${-hipL})`}>
          <Limb len={47} w1={18} w2={13} fill={pantsDark} />
          <g transform={`translate(0, 47) rotate(${-kneeL})`}>
            <Limb len={46} w1={12.5} w2={10} fill={pantsDark} />
            <path d="M -5 44 L 15 46 C 17 48, 16 51, 10 51 L -6 51 Z" fill="#150b1c" />
          </g>
        </g>

        {/* BACK ARM */}
        <g transform={`translate(0, ${hipY}) rotate(${torsoLean})`}>
          <g transform={`translate(-4, -56) rotate(${-shL})`}>
            <Limb len={34} w1={12.5} w2={10} fill={jacketDark} />
            <g transform={`translate(0, 34) rotate(${-elL})`}>
              <Limb len={31} w1={9.5} w2={7.5} fill={skinCol} />
              <ellipse cx={2} cy={34} rx={5.5} ry={6.5} fill={skinCol} />
            </g>
          </g>
        </g>

        {/* FRONT LEG (or Skirt/Sarung silhouette for female student / merchant) */}
        {role === 'student_female' || role === 'merchant' ? (
          <path
            d={`M -16 ${hipY - 4} L 16 ${hipY - 4} L 22 -14 L -20 -14 Z`}
            fill={`url(#${gCoatId})`}
          />
        ) : (
          <g transform={`translate(5, ${hipY}) rotate(${-hipR})`}>
            <Limb len={47} w1={18.5} w2={13.5} fill={`url(#${gCoatId})`} front />
            <g transform={`translate(0, 47) rotate(${-kneeR})`}>
              <Limb len={46} w1={13} w2={10.5} fill={`url(#${gCoatId})`} front />
              <path d="M -5 44 L 16 46 C 18 48, 17 51, 11 51 L -6 51 Z" fill="#1a0e22" />
            </g>
          </g>
        )}

        {/* TORSO (1950s Safari Suit / Collared Student Shirt / Farmer Tunic) */}
        <g transform={`translate(0, ${hipY}) rotate(${torsoLean})`}>
          <path
            d={
              role === 'bung_karno' || role === 'hadiprabowo'
                ? 'M -18 14 L -20 -58 C -12 -66, 12 -66, 19 -58 L 21 14 Z'
                : 'M -16 8 L -18 -58 C -10 -65, 10 -65, 17 -58 L 18 8 Z'
            }
            fill={`url(#${gCoatId})`}
          />
          {/* Crisp 1950s Collar Lapel Detail */}
          <polygon points="-8,-62 12,-62 4,-44" fill="#d8cbb8" opacity={0.45} />
          {/* Bung Karno Safari Pocket Accent */}
          {role === 'bung_karno' && (
            <g opacity={0.5} stroke={rimColor} strokeWidth={1.2} fill="none">
              <rect x={2} y={-44} width={11} height={11} rx={1.5} />
              <rect x={2} y={-18} width={12} height={12} rx={1.5} />
            </g>
          )}
          {/* GMNI Crimson Attribute Scarf / Ribbon across Chest */}
          {redScarf && (
            <path d="M -12 -58 L 14 -38 L 12 -28 L -14 -48 Z" fill="#c82828" stroke="#ffe0a6" strokeOpacity={0.45} strokeWidth={1} />
          )}
          {/* Rim Highlight Edge */}
          {rimOp > 0.08 && (
            <path
              d={rimFromFront ? 'M 17 -58 L 19 8' : 'M -17 -58 L -19 8'}
              fill="none"
              stroke={rimColor}
              strokeWidth={2.5}
              strokeLinecap="round"
              opacity={rimOp * 0.88}
            />
          )}

          {/* HEAD + 1950s PECI / CAPING / HAIR */}
          <g transform={`translate(2, -67) rotate(${headTilt})`}>
            <rect x={-6.5} y={-8} width={13} height={14} rx={4.5} fill={`url(#${gSkinId})`} />
            {/* Refined Human Profile Head */}
            <path
              d="M -14 -21 C -15 -34, -6 -42, 6 -40 C 14 -38, 18 -30, 17 -22 L 20 -17 L 17 -15 L 17 -10 C 15 -5, 9 -3, 3 -3 C -7 -3, -14 -9, -14 -21 Z"
              fill={`url(#${gSkinId})`}
            />
            {/* Hair */}
            {role === 'student_female' || role === 'merchant' ? (
              <g>
                <path d="M -15 -22 C -18 -36, -6 -44, 10 -41 C 15 -39, 17 -34, 12 -32 C 0 -33, -8 -26, -11 -13 Z" fill={hairCol} />
                <circle cx={-17} cy={-26} r={8} fill={hairCol} />
              </g>
            ) : (
              <path d="M -15 -20 C -17 -34, -7 -43, 8 -42 C 14 -41, 17 -36, 14 -32 C 4 -35, -6 -31, -11 -17 Z" fill={hairCol} />
            )}

            {/* Iconic 1950s Indonesian Black Velvet Peci (Songkok) */}
            {hasPeci && (
              <g transform="translate(0, -35) rotate(-5)">
                <path
                  d="M -16 4 L -13 -14 C -4 -17, 10 -16, 17 -11 L 16 6 C 6 4, -6 4, -16 4 Z"
                  fill="#150b1c"
                  stroke={rimColor}
                  strokeOpacity={rimOp * 0.72}
                  strokeWidth={1.6}
                />
              </g>
            )}

            {/* S.M. Hadiprabowo Spectacles Detail */}
            {role === 'hadiprabowo' && (
              <path d="M 10 -22 L 18 -22" stroke="#f6d898" strokeWidth={2.2} strokeLinecap="round" opacity={0.85} />
            )}

            {/* Farmer Woven Conical Caping Hat */}
            {role === 'farmer' && (
              <g transform="translate(0, -34) rotate(-6)">
                <path
                  d="M -36 6 L 0 -22 L 36 6 Q 0 13, -36 6 Z"
                  fill="#5e3e34"
                  stroke={rimColor}
                  strokeOpacity={rimOp * 0.75}
                  strokeWidth={1.8}
                />
              </g>
            )}

            {/* Face Rim Light */}
            {rimOp > 0.12 && (
              <path
                d={rimFromFront ? 'M 8 -39 C 15 -36, 18 -28, 17 -22 L 20 -17 L 17 -14 L 16 -8' : 'M -14 -32 C -17 -24, -16 -15, -12 -8'}
                fill="none"
                stroke={rimColor}
                strokeWidth={2.3}
                strokeLinecap="round"
                opacity={rimOp * 0.9}
              />
            )}
          </g>

          {/* FRONT ARM + HAND + HISTORICAL PROPS */}
          <g transform={`translate(5, -54) rotate(${-shR})`}>
            <Limb len={35} w1={13} w2={10.5} fill={`url(#${gCoatId})`} front />
            <g transform={`translate(0, 35) rotate(${-elR})`}>
              <Limb len={32} w1={10} w2={8} fill={`url(#${gSkinId})`} front />
              <g transform="translate(0, 33)">
                <ellipse cx={2} cy={3} rx={6} ry={7} fill={`url(#${gSkinId})`} />

                {/* Held Stack of Books (Students S1, S2, S6) */}
                {prop === 'books' && (
                  <g transform="translate(4, -8) rotate(-18)">
                    <rect x={-10} y={-8} width={28} height={10} rx={1.5} fill="#8a2c2c" stroke="#f6ce84" strokeWidth={1.1} />
                    <rect x={-8} y={2} width={26} height={9} rx={1.5} fill="#36485e" stroke="#f6ce84" strokeWidth={1.0} />
                  </g>
                )}

                {/* Held Wooden Hoe angled downward toward the soil (Farmer S1 & S5) */}
                {prop === 'hoe' && (
                  <g transform="rotate(62)">
                    <line x1={-32} y1={0} x2={90} y2={0} stroke="#4e2e24" strokeWidth={5} strokeLinecap="round" />
                    <polygon points="82,-3 95,-3 89,26 78,22" fill="#827b8c" stroke={rimColor} strokeOpacity={0.65} strokeWidth={1.2} />
                  </g>
                )}

                {/* Held Congress Wooden Gavel (S4) */}
                {prop === 'gavel' && (
                  <g transform="rotate(-35)">
                    <line x1={-4} y1={0} x2={34} y2={0} stroke="#5a3222" strokeWidth={4.5} strokeLinecap="round" />
                    <rect x={28} y={-11} width={14} height={22} rx={3} fill="#723c26" stroke="#f6c474" strokeWidth={1.2} />
                  </g>
                )}

                {/* Held Aid/Community Package Box (Social Activity S6) */}
                {prop === 'box' && (
                  <rect x={2} y={-14} width={30} height={22} rx={2.5} fill="#7e4f34" stroke="#f6c878" strokeWidth={1.4} />
                )}

                {/* Held Rolled Manifesto / Declaration Scroll (Surabaya & Congress) */}
                {prop === 'scroll' && (
                  <g transform={`rotate(${(shR + elR - torsoLean).toFixed(1)})`}>
                    <rect x={-5} y={-28} width={11} height={38} rx={4} fill="#f4e8ce" stroke="#c82828" strokeWidth={1.6} />
                    <line x1={-5} y1={-9} x2={6} y2={-9} stroke="#c82828" strokeWidth={3} />
                  </g>
                )}

                {/* Held Marching Banner Pole (upright screen-compensated with Merah on top, Putih on bottom!) */}
                {prop === 'banner' && (() => {
                  const wave = Math.sin(f * 0.24 + seed) * 5;
                  return (
                    <g transform={`rotate(${(shR + elR - torsoLean).toFixed(1)})`}>
                      <line x1={-5} y1={24} x2={22} y2={-136} stroke="#5a3428" strokeWidth={5} strokeLinecap="round" />
                      <circle cx={22} cy={-139} r={4.5} fill="#f4b860" />
                      {/* Upper Crimson Stripe (Merah) */}
                      <path
                        d={`M 21 -132 Q ${-14} ${-136 + wave}, ${-54} ${-128 - wave * 0.6} L ${-56} ${-104 - wave * 0.6} Q ${-16} ${-112 + wave}, 17 -107 Z`}
                        fill="#c82828"
                      />
                      {/* Lower Warm Ivory Stripe (Putih) */}
                      <path
                        d={`M 17 -107 Q ${-16} ${-112 + wave}, ${-56} ${-104 - wave * 0.6} L ${-58} ${-80 - wave * 0.6} Q ${-18} ${-88 + wave}, 13 -82 Z`}
                        fill="#f4ede0"
                      />
                    </g>
                  );
                })()}

                {/* Held Iconic GMNI Crimson-White-Crimson Panji Flag with 5-Pointed Star! */}
                {prop === 'gmni_flag' && (() => {
                  const wave = Math.sin(f * 0.24 + seed + 1.2) * 5;
                  return (
                    <g transform={`rotate(${(shR + elR - torsoLean).toFixed(1)})`}>
                      <line x1={-5} y1={24} x2={22} y2={-136} stroke="#5a3428" strokeWidth={5} strokeLinecap="round" />
                      <circle cx={22} cy={-139} r={4.8} fill="#f4b860" />
                      {/* Full Crimson Field */}
                      <path
                        d={`M 21 -132 Q ${-14} ${-136 + wave}, ${-58} ${-128 - wave * 0.6} L ${-60} ${-80 - wave * 0.6} Q ${-18} ${-88 + wave}, 13 -82 Z`}
                        fill="#b81e24"
                        stroke="#f6c474"
                        strokeOpacity={0.55}
                        strokeWidth={1.1}
                      />
                      {/* Center Vertical White Band */}
                      <path
                        d={`M -8 -133 L -28 -132 L -31 -83 L -11 -84 Z`}
                        fill="#f4ede0"
                        opacity={0.95}
                      />
                      {/* Crimson 5-Pointed Star & Black Center Dot */}
                      <polygon points={starPoints(-19, -108 + wave * 0.35, 14, 5.5)} fill="#c42026" stroke="#180c1c" strokeWidth={0.9} />
                      <circle cx={-19} cy={-108 + wave * 0.35} r={4.2} fill="#180c1c" />
                    </g>
                  );
                })()}
              </g>
            </g>
          </g>
        </g>
      </g>
    </g>
  );
};
