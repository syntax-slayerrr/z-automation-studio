import React from 'react';
import { clamp, fireFlicker, lerp } from './fx';

export type HumanVariant = 'aru' | 'elder' | 'child' | 'companion';

export type HumanPoseName =
  | 'stand_alert'
  | 'huddle_cave'
  | 'observe_awe'
  | 'reach_flame'
  | 'walk_hunt'
  | 'roast_meat'
  | 'eat_warm'
  | 'sit_warm'
  | 'storytell'
  | 'knap_stone'
  | 'shape_clay'
  | 'pour_metal';

export interface PoseAngles {
  hipY: number;        // vertical offset of pelvis from standing (-96)
  torsoLean: number;   // deg (+ leans forward toward facing direction)
  headTilt: number;    // deg (+ tilts down, - tilts up)
  shL: number;         // back/far shoulder angle (deg from straight down, + forward)
  elL: number;         // back elbow flex (deg, + bends forward/up)
  shR: number;         // front/near shoulder angle
  elR: number;         // front elbow flex
  hipL: number;        // back thigh angle (+ forward)
  kneeL: number;       // back knee bend (- bends shin backward)
  hipR: number;        // front thigh angle
  kneeR: number;       // front knee bend
}

export const POSES: Record<HumanPoseName, PoseAngles> = {
  stand_alert: {
    hipY: -96, torsoLean: 4, headTilt: -3,
    shL: -10, elL: 16, shR: 18, elR: 28,
    hipL: -8, kneeL: -10, hipR: 10, kneeR: -8,
  },
  huddle_cave: {
    hipY: -44, torsoLean: 28, headTilt: 18,
    shL: 48, elL: 78, shR: 54, elR: 84,
    hipL: 78, kneeL: -116, hipR: 86, kneeR: -120,
  },
  observe_awe: {
    hipY: -62, torsoLean: 20, headTilt: -8,
    shL: 34, elL: 32, shR: -14, elR: 48,
    hipL: 58, kneeL: -94, hipR: 28, kneeR: -76,
  },
  reach_flame: {
    hipY: -58, torsoLean: 24, headTilt: -5,
    shL: 18, elL: 36, shR: 72, elR: 16,
    hipL: 64, kneeL: -96, hipR: -16, kneeR: -82,
  },
  walk_hunt: {
    hipY: -94, torsoLean: 9, headTilt: -2,
    shL: -24, elL: 26, shR: 38, elR: 72,
    hipL: -22, kneeL: -18, hipR: 24, kneeR: -14,
  },
  roast_meat: {
    hipY: -54, torsoLean: 18, headTilt: 8,
    shL: 42, elL: 34, shR: 56, elR: 26,
    hipL: 66, kneeL: -102, hipR: 42, kneeR: -92,
  },
  eat_warm: {
    hipY: -48, torsoLean: 10, headTilt: 6,
    shL: 30, elL: 56, shR: 46, elR: 98,
    hipL: 72, kneeL: -112, hipR: 62, kneeR: -106,
  },
  sit_warm: {
    hipY: -46, torsoLean: 14, headTilt: -2,
    shL: 52, elL: 30, shR: 62, elR: 26,
    hipL: 74, kneeL: -114, hipR: 66, kneeR: -108,
  },
  storytell: {
    hipY: -48, torsoLean: -4, headTilt: -8,
    shL: 96, elL: 38, shR: 118, elR: 28,
    hipL: 72, kneeL: -112, hipR: 64, kneeR: -106,
  },
  knap_stone: {
    hipY: -50, torsoLean: 28, headTilt: 22,
    shL: 48, elL: 48, shR: 64, elR: 66,
    hipL: 76, kneeL: -114, hipR: 58, kneeR: -104,
  },
  shape_clay: {
    hipY: -56, torsoLean: 24, headTilt: 18,
    shL: 52, elL: 42, shR: 58, elR: 36,
    hipL: 68, kneeL: -106, hipR: 52, kneeR: -98,
  },
  pour_metal: {
    hipY: -88, torsoLean: 16, headTilt: 14,
    shL: 56, elL: 32, shR: 72, elR: 22,
    hipL: -16, kneeL: -16, hipR: 24, kneeR: -22,
  },
};

export function blendPoses(a: PoseAngles, b: PoseAngles, t: number): PoseAngles {
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

export interface PrehistoricHumanProps {
  f: number;
  x: number;
  y: number; // ground contact point!
  scale?: number;
  facing?: 1 | -1; // 1 = facing right, -1 = facing left
  variant?: HumanVariant;
  pose: HumanPoseName;
  blendToPose?: HumanPoseName;
  blendT?: number;
  /** Light direction relative to the character's screen position */
  rimIntensity?: number; // 0..1 warm firelight rim strength
  rimColor?: string;     // default warm amber '#f8b65c' (or cool moon '#9ab4d4' / lightning '#dceeff')
  rimFromFront?: boolean; // true = light is in front of character's facing side
  showGroundShadow?: boolean;
  shadowStretch?: number; // + casts shadow right, - casts shadow left
  prop?: 'none' | 'spear' | 'torch' | 'roast_stick' | 'flint' | 'hunt_prey';
  gestureAmp?: number;   // extra expressive hand animation for storytelling / knapping / shivering
  shiver?: number;       // 0..1 cold cave shiver in S1
  seed?: number;
  idSuffix?: string;
}

/**
 * 100% Pure-Code Articulated 2D Documentary Prehistoric Human Rig.
 * - Grounded at (x, y) with dynamic trembling ground cast-shadow.
 * - Anatomically proportioned tapered SVG limbs with seamless rounded pivots (zero floating joints!).
 * - Subtle idle breathing, head-lag, hair sway, and dynamic fire-facing golden rim lighting.
 */
export const PrehistoricHumanRig: React.FC<PrehistoricHumanProps> = ({
  f,
  x,
  y,
  scale = 1,
  facing = 1,
  variant = 'aru',
  pose,
  blendToPose,
  blendT = 0,
  rimIntensity = 0.7,
  rimColor = '#f8b65c',
  rimFromFront = true,
  showGroundShadow = true,
  shadowStretch = -1.2,
  prop = 'none',
  gestureAmp = 0,
  shiver = 0,
  seed = 1,
  idSuffix = 'h',
}) => {
  const basePose = blendToPose ? blendPoses(POSES[pose], POSES[blendToPose], blendT) : POSES[pose];
  const fl = fireFlicker(f, seed);

  // Organic breathing, gentle sway, head-lag (5 frames behind torso), and optional shiver / walk / gesture
  const breath = Math.sin(f * 0.065 + seed * 2.3);
  const breathLag = Math.sin((f - 5) * 0.065 + seed * 2.3);
  const shivX = shiver > 0.01 ? Math.sin(f * 1.45 + seed * 7) * 1.5 * shiver : 0;

  const isWalking = pose === 'walk_hunt' && (!blendToPose || blendT < 0.5);
  const walkCycle = isWalking ? Math.sin(f * 0.22 + seed) : 0;
  const walkBounce = isWalking ? Math.abs(Math.cos(f * 0.22 + seed)) * -5 : 0;

  // Expressive gesture modulation (storytelling wide waves / stone knapping rhythm)
  const storyWave = pose === 'storytell' ? Math.sin(f * 0.16 + seed) * 18 * (0.6 + gestureAmp) : 0;
  const knapTap = pose === 'knap_stone' ? Math.max(0, Math.sin(f * 0.36 + seed)) * 26 : 0;

  const hipY = basePose.hipY + breath * 1.4 + walkBounce;
  const torsoLean = basePose.torsoLean + breath * 1.3;
  const headTilt = basePose.headTilt + breathLag * 2.0 + (pose === 'storytell' ? Math.sin(f * 0.11) * 5 : 0);

  const shL = basePose.shL - walkCycle * 22 - storyWave * 0.7;
  const elL = basePose.elL + Math.sin(f * 0.08 + seed) * 4;
  const shR = basePose.shR + walkCycle * 14 + storyWave - knapTap;
  const elR = basePose.elR + Math.cos(f * 0.09 + seed) * 5 + knapTap * 0.6;

  const hipL = basePose.hipL + walkCycle * 26;
  const kneeL = basePose.kneeL - Math.max(0, -walkCycle) * 20;
  const hipR = basePose.hipR - walkCycle * 26;
  const kneeR = basePose.kneeR - Math.max(0, walkCycle) * 20;

  // Proportions by variant
  const childScale = variant === 'child' ? 0.68 : variant === 'elder' ? 1.03 : variant === 'companion' ? 0.94 : 1.0;
  const headScale = variant === 'child' ? 1.15 : 1.0;

  // Shadow-box twilight documentary colors (adapted from Earth 24 Hours: warm umber/plum shadows + golden rim!)
  const skinDark = '#241428';
  const skinMid = '#3c2438';
  const tunicDark = variant === 'elder' ? '#2c1b28' : variant === 'companion' ? '#361f2d' : '#321e28';
  const tunicMid = variant === 'elder' ? '#4a2e38' : '#4d3034';
  const hairCol = variant === 'elder' ? '#463a48' : '#1b1022';
  const rimOp = clamp(rimIntensity * fl, 0, 1);

  // Rim gradient runs horizontally in character local space (+X = front, -X = back)
  const rimX1 = rimFromFront ? '100%' : '0%';
  const rimX2 = rimFromFront ? '10%' : '90%';
  const gradBodyId = `hg_body_${idSuffix}_${seed}`;
  const gradTunicId = `hg_tunic_${idSuffix}_${seed}`;
  const gradRimStroke = rimOp > 0.08 ? rimColor : 'none';

  // Helper to draw tapered anatomical limb segment from (0,0) down to (0, len)
  const LimbSeg: React.FC<{
    len: number;
    wTop: number;
    wBot: number;
    fill: string;
    isFrontLimb?: boolean;
  }> = ({ len, wTop, wBot, fill, isFrontLimb = false }) => {
    const hw1 = wTop * 0.5;
    const hw2 = wBot * 0.5;
    const rimSideX = rimFromFront ? 1 : -1;
    return (
      <g>
        <path
          d={`M ${-hw1} 0 C ${-hw1 * 1.08} ${len * 0.35}, ${-hw2 * 1.08} ${len * 0.72}, ${-hw2} ${len} A ${hw2} ${hw2} 0 0 0 ${hw2} ${len} C ${hw2 * 1.08} ${len * 0.72}, ${hw1 * 1.08} ${len * 0.35}, ${hw1} 0 A ${hw1} ${hw1} 0 0 0 ${-hw1} 0 Z`}
          fill={fill}
        />
        {rimOp > 0.10 && isFrontLimb && (
          <path
            d={`M ${rimSideX * hw1 * 0.92} 2 C ${rimSideX * hw1} ${len * 0.38}, ${rimSideX * hw2} ${len * 0.72}, ${rimSideX * hw2 * 0.9} ${len - 2}`}
            fill="none"
            stroke={rimColor}
            strokeWidth={2.2}
            strokeLinecap="round"
            opacity={rimOp * 0.82}
          />
        )}
      </g>
    );
  };

  return (
    <g transform={`translate(${x + shivX}, ${y})`}>
      {/* Dynamic Flickering Ground Cast Shadow pointing strictly AWAY from firelight */}
      {showGroundShadow && (
        <ellipse
          cx={shadowStretch * 32 * scale * childScale}
          cy={4}
          rx={(46 + Math.abs(shadowStretch) * 26) * scale * childScale * (0.96 + 0.04 * fl)}
          ry={11 * scale * childScale}
          fill="#120818"
          opacity={0.56}
        />
      )}

      <g transform={`scale(${facing * scale * childScale}, ${scale * childScale})`}>
        <defs>
          <linearGradient id={gradBodyId} x1={rimX1} y1="15%" x2={rimX2} y2="85%">
            <stop offset="0%" stopColor={rimColor} stopOpacity={0.35 * rimOp} />
            <stop offset="32%" stopColor={skinMid} stopOpacity="1" />
            <stop offset="100%" stopColor={skinDark} stopOpacity="1" />
          </linearGradient>
          <linearGradient id={gradTunicId} x1={rimX1} y1="10%" x2={rimX2} y2="90%">
            <stop offset="0%" stopColor={rimColor} stopOpacity={0.42 * rimOp} />
            <stop offset="35%" stopColor={tunicMid} stopOpacity="1" />
            <stop offset="100%" stopColor={tunicDark} stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* === BACK LEG (Hip -> Thigh -> Knee -> Shin -> Foot) === */}
        <g transform={`translate(-6, ${hipY}) rotate(${-hipL})`}>
          <LimbSeg len={48} wTop={19} wBot={14} fill={skinDark} />
          <g transform={`translate(0, 48) rotate(${-kneeL})`}>
            <LimbSeg len={46} wTop={13.5} wBot={10} fill={skinDark} />
            {/* Grounded Foot */}
            <path d="M -5 44 L 14 46 C 17 48, 16 52, 10 52 L -7 52 Z" fill={skinDark} />
          </g>
        </g>

        {/* === BACK ARM (Shoulder -> Upper Arm -> Elbow -> Forearm -> Hand) === */}
        <g transform={`translate(0, ${hipY}) rotate(${torsoLean})`}>
          <g transform={`translate(-4, -56) rotate(${-shL})`}>
            <LimbSeg len={35} wTop={13} wBot={10.5} fill={skinDark} />
            <g transform={`translate(0, 35) rotate(${-elL})`}>
              <LimbSeg len={32} wTop={10} wBot={8} fill={skinDark} />
              {/* Sculpted Hand + Thumb */}
              <ellipse cx={2} cy={35} rx={6} ry={7.5} fill={skinDark} />
              <ellipse cx={7} cy={32} rx={2.5} ry={4.5} transform="rotate(28 7 32)" fill={skinDark} />
            </g>
          </g>
        </g>

        {/* === FRONT LEG (Hip -> Thigh -> Knee -> Shin -> Foot) === */}
        <g transform={`translate(5, ${hipY}) rotate(${-hipR})`}>
          <LimbSeg len={48} wTop={20} wBot={14.5} fill={`url(#${gradBodyId})`} isFrontLimb />
          <g transform={`translate(0, 48) rotate(${-kneeR})`}>
            <LimbSeg len={46} wTop={14} wBot={10.5} fill={`url(#${gradBodyId})`} isFrontLimb />
            <path d="M -5 44 L 15 46 C 18 48, 17 52, 11 52 L -7 52 Z" fill={skinMid} />
          </g>
        </g>

        {/* === PELVIS & BREATHING TORSO + FUR TUNIC === */}
        <g transform={`translate(0, ${hipY}) rotate(${torsoLean})`}>
          {/* Base Torso Silhouette */}
          <path
            d="M -15 4 C -19 -18, -20 -46, -15 -62 C -8 -68, 10 -68, 16 -60 C 20 -44, 18 -18, 14 6 Z"
            fill={`url(#${gradBodyId})`}
          />
          {/* Animal-Hide Diagonal Prehistoric Tunic with Ragged Hem & Rope Belt */}
          <path
            d="M -17 -58 L 15 -52 C 20 -34, 21 -12, 22 14 L 12 20 L 4 13 L -5 21 L -15 14 L -22 17 C -21 -8, -20 -36, -17 -58 Z"
            fill={`url(#${gradTunicId})`}
          />
          {/* Elder draped shoulder fur cloak */}
          {variant === 'elder' && (
            <path
              d="M -21 -60 C -10 -68, 14 -64, 18 -52 C 12 -40, -6 -34, -24 -38 Z"
              fill="#3c2632"
              stroke={rimColor}
              strokeOpacity={rimOp * 0.45}
              strokeWidth={1.6}
            />
          )}
          {/* Braided Waist Belt */}
          <path d="M -18 -8 Q 0 -3, 19 -9" fill="none" stroke="#1b101e" strokeWidth={5.5} strokeLinecap="round" />
          <path d="M -16 -8 Q 0 -3, 17 -9" fill="none" stroke={rimColor} strokeOpacity={rimOp * 0.35} strokeWidth={1.5} strokeLinecap="round" />

          {/* Dynamic Fire-Facing Rim Highlight along Torso Front/Back */}
          {rimOp > 0.08 && (
            <path
              d={rimFromFront ? 'M 15 -58 C 19 -40, 19 -18, 19 10' : 'M -16 -58 C -20 -38, -20 -16, -20 12'}
              fill="none"
              stroke={gradRimStroke}
              strokeWidth={2.6}
              strokeLinecap="round"
              opacity={rimOp * 0.88}
            />
          )}

          {/* Optional Hunt Prey Slung Across Back/Shoulder (Scene 3 Beat 1) */}
          {prop === 'hunt_prey' && (
            <g transform="translate(-14, -56) rotate(-18)">
              <ellipse cx={-6} cy={-4} rx={24} ry={12} fill="#3a232b" stroke={rimColor} strokeOpacity={rimOp * 0.4} strokeWidth={1.5} />
              <path d="M -24 2 L -32 18 M -18 4 L -22 20 M 14 2 L 22 14" stroke="#2c1922" strokeWidth={4.5} strokeLinecap="round" />
            </g>
          )}

          {/* === HEAD WITH NATURAL PROFILE, HAIR & HEAD-LAG === */}
          <g transform={`translate(2, -68) rotate(${headTilt}) scale(${headScale})`}>
            {/* Neck */}
            <rect x={-7} y={-8} width={14} height={14} rx={5} fill={`url(#${gradBodyId})`} />
            {/* Sculpted Human Head with Subtle Profile Brow, Nose & Chin */}
            <path
              d="M -15 -22 C -16 -36, -6 -44, 6 -42 C 15 -40, 19 -32, 18 -23 L 21 -18 L 18 -16 L 18 -11 C 16 -6, 10 -4, 3 -4 C -8 -4, -15 -10, -15 -22 Z"
              fill={`url(#${gradBodyId})`}
            />
            {/* Elder Beard Silhouette */}
            {variant === 'elder' && (
              <path d="M 16 -14 C 20 -6, 16 4, 8 6 C 2 5, 0 -2, 3 -8 Z" fill={hairCol} />
            )}
            {/* Expressive Prehistoric Hair with Subtle Wind Sway */}
            {variant === 'companion' ? (
              <g>
                <path
                  d={`M -16 -24 C -20 -38, -6 -48, 10 -44 C 16 -42, 18 -36, 14 -34 C 2 -36, -8 -28, -12 -14 C -18 -14, -18 -18, -16 -24 Z`}
                  fill={hairCol}
                />
                <circle cx={-18} cy={-30 + breathLag * 0.8} r={8.5} fill={hairCol} />
              </g>
            ) : (
              <path
                d={`M -18 -18 C -23 -32, -12 -48, 6 -46 C 15 -45, 20 -39, 17 -34 C 8 -38, -4 -35, -8 -24 C -11 -16, -14 -10, ${-21 + breathLag * 1.4} -8 C -22 -12, -20 -15, -18 -18 Z`}
                fill={hairCol}
              />
            )}
            {/* Aru's Leather Headband (Signature Consistent Protagonist Detail!) */}
            {variant === 'aru' && (
              <path
                d="M -16 -33 Q 2 -37, 17 -33"
                fill="none"
                stroke="#8a442c"
                strokeWidth={3.2}
                strokeLinecap="round"
              />
            )}
            {/* Subtle Firelight Catchlight Rim on Face Profile */}
            {rimOp > 0.12 && (
              <path
                d={rimFromFront ? 'M 8 -41 C 16 -38, 19 -30, 18 -23 L 21 -18 L 18 -15 L 17 -9' : 'M -15 -34 C -18 -26, -17 -16, -13 -9'}
                fill="none"
                stroke={rimColor}
                strokeWidth={2.4}
                strokeLinecap="round"
                opacity={rimOp * 0.92}
              />
            )}
          </g>

          {/* === FRONT ARM (Shoulder -> Upper Arm -> Elbow -> Forearm -> Sculpted Hand + Props!) === */}
          <g transform={`translate(6, -54) rotate(${-shR})`}>
            <LimbSeg len={36} wTop={13.5} wBot={11} fill={`url(#${gradBodyId})`} isFrontLimb />
            <g transform={`translate(0, 36) rotate(${-elR})`}>
              <LimbSeg len={33} wTop={10.5} wBot={8.2} fill={`url(#${gradBodyId})`} isFrontLimb />
              {/* Sculpted Hand + Thumb */}
              <g transform="translate(0, 34)">
                <ellipse cx={2} cy={3} rx={6.5} ry={8} fill={`url(#${gradBodyId})`} />
                <ellipse cx={7.5} cy={0} rx={2.6} ry={4.8} transform="rotate(32 7.5 0)" fill={`url(#${gradBodyId})`} />
                {rimOp > 0.14 && (
                  <path d="M 5 -4 C 9 0, 9 6, 4 10" fill="none" stroke={rimColor} strokeWidth={2} strokeLinecap="round" opacity={rimOp * 0.9} />
                )}

                {/* Held Wooden Spear (held upright diagonally forward-up like a proud prehistoric hunter!) */}
                {prop === 'spear' && (
                  <g transform="rotate(-32)">
                    <line x1={-68} y1={0} x2={122} y2={0} stroke="#3c241e" strokeWidth={5.2} strokeLinecap="round" />
                    <polygon points="116,-7 148,0 116,7 123,0" fill="#8d8496" stroke={rimColor} strokeOpacity={Math.max(0.35, rimOp * 0.75)} strokeWidth={1.3} />
                  </g>
                )}

                {/* Held Burning Torch Branch */}
                {prop === 'torch' && (
                  <g transform="rotate(-68)">
                    <line x1={-16} y1={0} x2={56} y2={0} stroke="#361e1a" strokeWidth={6} strokeLinecap="round" />
                    <circle cx={60} cy={0} r={14 * fl} fill="#f8a03c" opacity={0.85} />
                    <circle cx={62} cy={0} r={7 * fl} fill="#fff2cc" />
                  </g>
                )}

                {/* Held Wooden Roasting Spit Stick (Scene 3) */}
                {prop === 'roast_stick' && (
                  <g transform="rotate(-48)">
                    <line x1={-12} y1={0} x2={92} y2={0} stroke="#44291e" strokeWidth={4} strokeLinecap="round" />
                  </g>
                )}

                {/* Held Flint Hammerstone (Scene 5) */}
                {prop === 'flint' && (
                  <polygon points="-2,2 10,-2 14,7 4,12" fill="#766d7e" stroke={rimColor} strokeOpacity={rimOp * 0.6} strokeWidth={1.3} />
                )}
              </g>
            </g>
          </g>
        </g>
      </g>
    </g>
  );
};
