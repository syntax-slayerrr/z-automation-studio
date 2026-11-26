import React from 'react';
import { useLightingRig } from './LightingRig';

export type OdysseyArchetype = 'human_hunter' | 'hominin_early' | 'artisan_villager' | 'elder' | 'modern_explorer' | 'youth';
export type OdysseyPose = 'cliff_lookout' | 'walk_trek' | 'sit_campfire' | 'listen_campfire';
export type OdysseyProp = 'wooden_spear' | 'torch' | 'stone_tool' | 'none';

export interface OdysseyHumanRigProps {
  footX: number;
  footY: number;
  scale?: number;
  frame?: number;
  archetype?: OdysseyArchetype;
  pose?: OdysseyPose;
  prop?: OdysseyProp;
  lightFrom?: 'right' | 'left';
  flipX?: boolean;
  /** Independent head turn / tilt degrees for gaze-tracking & curiosity. */
  headTiltDeg?: number;
  /** Weight shift amplitude in px (natural living stance). */
  weightShift?: number;
  /** Wind strength driving delayed secondary follow-through on hair & cloak hem. */
  windStrength?: number;
  /** Expressive storytelling gesture intensity (0..1) for campfire scenes. */
  gestureIntensity?: number;
}

/**
 * OdysseyHumanRig v2.0 — Anatomically Sculpted, Living Filmic 2D Character Rig.
 *
 * Upgrades over v1:
 *  - Expressive anatomical head profile (forehead, nose bridge, brow, jaw/chin) — zero flat ovals!
 *  - Natural tapered anatomy (calves, shoulders, upper/forearm articulation, hand silhouette)
 *  - Secondary follow-through motion on hair strands & fur cloak hem lagging 5 frames behind breath/wind!
 *  - Coupled live with `useLightingRig()` for real-time flickering firelight warmth on faces/hands/knees,
 *    cool moonlight back-rim, ambient occlusion contact shadow, and swaying directional cast shadow!
 */
export const OdysseyHumanRig: React.FC<OdysseyHumanRigProps> = ({
  footX,
  footY,
  scale = 1,
  frame = 0,
  archetype = 'human_hunter',
  pose = 'cliff_lookout',
  prop = 'wooden_spear',
  lightFrom = 'right',
  flipX = false,
  headTiltDeg = 0,
  weightShift = 1,
  windStrength = 1,
  gestureIntensity = 1,
}) => {
  const rig = useLightingRig();
  const isFire = rig.mode === 'campfire_flicker';
  const fl = rig.flicker;

  // Multi-phase organic living animation: breath -> torso weight shift -> delayed hair/cloak follow-through
  const breath = Math.sin(frame * 0.055) * 2.0;
  const shiftX = Math.sin(frame * 0.028) * 3.5 * weightShift;
  const windLag = (Math.sin((frame - 5) * 0.08) * 5.2 + Math.cos((frame - 9) * 0.13) * 2.4) * windStrength;
  const hairLag = (Math.sin((frame - 6) * 0.095) * 4.5 + Math.cos((frame - 10) * 0.16) * 2.0) * windStrength;

  const dir = flipX ? -1 : 1;
  const shadowDir = lightFrom === 'right' ? -1 : 1;
  const shadowStretchX = shadowDir * (isFire ? 42 + rig.shadowSwayX * 1.4 : 34);

  const skinBase =
    archetype === 'hominin_early' ? '#8A563C' : archetype === 'elder' ? '#AE7755' : '#BD7F57';
  const skinLight = isFire ? '#F4A662' : archetype === 'hominin_early' ? '#BA805A' : '#E5AE80';
  const skinShadow = isFire ? '#3C2424' : archetype === 'hominin_early' ? '#4C2D20' : '#653C28';

  const tunicMain =
    archetype === 'elder'
      ? '#745142'
      : archetype === 'youth'
        ? '#8D6646'
        : '#9E734B';
  const tunicDark =
    archetype === 'elder'
      ? '#362322'
      : archetype === 'youth'
        ? '#483024'
        : '#533825';
  const tunicRim = isFire ? '#F6A856' : '#E4B87C';
  const moonRim = isFire ? '#7AA4D2' : tunicRim;
  const hairCol = archetype === 'elder' ? '#C4BCB0' : '#231A17';

  // =========================================================================
  // CAMPFIRE STORYTELLING ELDER (Expressive hand gesture + fire-lit profile!)
  // =========================================================================
  if (pose === 'sit_campfire') {
    // Organic storyteller hand arc: anticipation -> open-palm rise -> pause -> settle
    const storyWave = Math.sin(frame * 0.075) * 12 * gestureIntensity;
    const handLift = Math.cos(frame * 0.075 - 0.6) * 9 * gestureIntensity;
    const nod = Math.sin(frame * 0.05) * 3.5 + headTiltDeg;

    return (
      <g transform={`translate(${footX}, ${footY}) scale(${dir * scale}, ${scale})`}>
        {/* Elongated flickering fire-cast ground shadow stretching behind elder */}
        <ellipse cx={shadowStretchX} cy={6} rx={76} ry={14} fill={rig.shadowColor} opacity={0.56} />
        <ellipse cx={-6} cy={4} rx={44} ry={9} fill={rig.shadowColor} opacity={0.72} />

        {/* Crossed grounded legs & fur wrap */}
        <path d="M -38 4 C -44 -18, -18 -44, 16 -34 L 42 -2 C 28 12, -16 14, -38 4 Z" fill={tunicDark} />
        <path d="M -10 -30 C 14 -34, 34 -18, 40 -2 L 16 6 C 8 -8, -2 -18, -10 -30 Z" fill={tunicMain} />
        {/* Live firelight bounce on knees */}
        <path d="M 10 -28 C 28 -22, 38 -12, 40 -2 L 24 4 C 22 -8, 16 -18, 10 -28 Z" fill={skinLight} opacity={0.48 * fl} />

        {/* Seated torso leaning slightly forward toward fire & listeners */}
        <g transform={`translate(${shiftX * 0.4}, ${breath * 0.8})`}>
          {/* Draped elder cloak catching cool moonlight on back & warm firelight on chest */}
          <path d="M -34 -26 C -40 -68, -24 -106, 2 -110 C 24 -106, 28 -68, 22 -26 Z" fill={tunicDark} />
          <path d="M -4 -108 C 16 -104, 26 -68, 20 -26 L -4 -28 C 0 -60, -4 -84, -4 -108 Z" fill={tunicMain} />
          {/* Cool moonlight back rim (subtle optical wrap) */}
          <path d="M -32 -32 C -38 -70, -24 -102, -4 -109" fill="none" stroke={moonRim} strokeWidth={1.9} opacity={0.42} strokeLinecap="round" />
          {/* Warm flickering firelight rim along front chest */}
          <path d="M 10 -102 C 24 -88, 26 -58, 20 -28" fill="none" stroke={tunicRim} strokeWidth={4.2} opacity={0.85 * fl} strokeLinecap="round" />

          {/* Expressive articulated storyteller arm (shoulder -> elbow -> raised open hand!) */}
          <path
            d={`M 8 -90 C 26 -74, 42 ${-64 + storyWave * 0.4}, 58 ${-72 - handLift}`}
            fill="none"
            stroke={skinBase}
            strokeWidth={12}
            strokeLinecap="round"
          />
          <path
            d={`M 10 -90 C 28 -74, 44 ${-64 + storyWave * 0.4}, 59 ${-72 - handLift}`}
            fill="none"
            stroke={skinLight}
            strokeWidth={4.5}
            opacity={0.9 * fl}
            strokeLinecap="round"
          />
          {/* Sculpted open palm gesturing toward the fire */}
          <g transform={`translate(62, ${-74 - handLift}) rotate(${-18 - storyWave * 0.8})`}>
            <ellipse cx={4} cy={0} rx={8} ry={5} fill={skinLight} />
            <line x1={8} y1={-3} x2={15} y2={-6} stroke={skinLight} strokeWidth={2.4} strokeLinecap="round" />
            <line x1={9} y1={0} x2={16} y2={-1} stroke={skinLight} strokeWidth={2.4} strokeLinecap="round" />
            <line x1={8} y1={3} x2={14} y2={4} stroke={skinLight} strokeWidth={2.2} strokeLinecap="round" />
          </g>

          {/* Sculpted Elder Head in expressive side-3/4 profile facing fire & listeners */}
          <g transform={`translate(4, -124) rotate(${nod})`}>
            <path d="M -10 10 L 6 12 L 6 24 L -10 22 Z" fill={skinShadow} />
            {/* Cranium + distinct forehead, brow, nose bridge, mouth & beard/chin profile! */}
            <path
              d="M -16 -6 C -18 -24, 0 -30, 14 -20 C 18 -16, 18 -10, 16 -6 L 22 0 L 16 4 L 18 10 L 14 14 C 6 19, -8 18, -14 10 Z"
              fill={skinShadow}
            />
            {/* Warm firelight illuminating forehead, nose bridge, cheek & beard! */}
            <path
              d="M 2 -24 C 12 -22, 18 -14, 16 -6 L 22 0 L 16 4 L 18 10 L 14 14 C 8 17, 2 14, 2 4 Z"
              fill={skinBase}
            />
            <path
              d="M 10 -20 C 16 -16, 18 -10, 16 -6 L 22 0 L 16 4 L 18 10 L 13 14"
              fill="none"
              stroke={skinLight}
              strokeWidth={3.2}
              opacity={0.92 * fl}
              strokeLinecap="round"
            />
            {/* Expressive dark eye + warm fire catchlight dot */}
            <circle cx={11} cy={-6} r={2.2} fill="#1E1412" />
            <circle cx={11.7} cy={-6.6} r={0.8} fill="#FEE7A8" opacity={fl} />
            {/* Silver-white elder hair & short beard */}
            <path d="M -18 -4 C -20 -26, 2 -34, 14 -22 C 4 -22, -4 -14, -10 4 C -16 4, -19 2, -18 -4 Z" fill={hairCol} />
            <path d="M 6 12 C 12 14, 17 12, 16 18 C 12 24, 4 22, 2 16 Z" fill={hairCol} opacity={0.9} />
          </g>
        </g>
      </g>
    );
  }

  // =========================================================================
  // CAMPFIRE LISTENER (Curiously leaning forward toward elder & flame!)
  // =========================================================================
  if (pose === 'listen_campfire') {
    const leanNod = Math.sin(frame * 0.048 + 1.2) * 3.2 + headTiltDeg;
    return (
      <g transform={`translate(${footX}, ${footY}) scale(${dir * scale}, ${scale})`}>
        <ellipse cx={shadowStretchX} cy={6} rx={72} ry={13} fill={rig.shadowColor} opacity={0.56} />
        <ellipse cx={0} cy={4} rx={42} ry={8} fill={rig.shadowColor} opacity={0.7} />

        {/* Crouched / knee-hugged sitting posture leaning intently toward fire */}
        <path d="M -32 4 C -36 -16, -24 -44, 0 -46 C 22 -44, 34 -20, 32 4 Z" fill={tunicDark} />
        <path d="M -2 -44 C 18 -42, 30 -20, 28 4 L 4 4 C 6 -16, 4 -30, -2 -44 Z" fill={tunicMain} />
        <path d="M 14 -38 C 26 -28, 30 -12, 28 4" fill="none" stroke={tunicRim} strokeWidth={3.6} opacity={0.82 * fl} strokeLinecap="round" />

        <g transform={`translate(${shiftX * 0.35}, ${breath * 0.7})`}>
          {/* Leaning torso */}
          <path d="M -26 -38 C -30 -76, -16 -108, 6 -110 C 24 -106, 26 -72, 18 -38 Z" fill={tunicDark} />
          <path d="M -2 -108 C 18 -104, 24 -72, 16 -38 L -4 -40 Z" fill={tunicMain} />
          <path d="M -25 -44 C -28 -78, -16 -104, 0 -109" fill="none" stroke={moonRim} strokeWidth={1.8} opacity={0.4} strokeLinecap="round" />
          {/* Arms warming hands gently forward toward campfire */}
          <path d="M 8 -86 C 24 -74, 38 -62, 48 -68" fill="none" stroke={skinBase} strokeWidth={11} strokeLinecap="round" />
          <path d="M 10 -86 C 25 -74, 39 -62, 48 -68" fill="none" stroke={skinLight} strokeWidth={4} opacity={0.86 * fl} strokeLinecap="round" />
          <ellipse cx={52} cy={-69} rx={7} ry={4.5} fill={skinLight} opacity={0.9 * fl} />

          {/* Expressive profile head leaning forward in fascination */}
          <g transform={`translate(10, -124) rotate(${leanNod})`}>
            <path
              d="M -15 -4 C -17 -22, 0 -28, 13 -19 C 17 -15, 17 -9, 15 -5 L 21 1 L 15 5 L 16 11 L 11 15 C 4 19, -8 17, -14 9 Z"
              fill={skinShadow}
            />
            <path d="M 2 -22 C 12 -20, 17 -13, 15 -5 L 21 1 L 15 5 L 16 11 L 11 15 C 5 16, 1 11, 2 -22 Z" fill={skinBase} />
            <path d="M 10 -18 C 16 -14, 17 -8, 15 -5 L 21 1 L 15 5 L 12 14" fill="none" stroke={skinLight} strokeWidth={3.2} opacity={0.9 * fl} strokeLinecap="round" />
            <circle cx={10.5} cy={-5} r={2.2} fill="#1E1412" />
            <circle cx={11.3} cy={-5.7} r={0.85} fill="#FEE7A8" opacity={fl} />
            {/* Flowing dark hair with wind lag */}
            <path
              d={`M -17 -2 C -20 -24, 2 -32, 14 -20 C 4 -20, -4 -10, ${-14 + hairLag * 0.4} 14 C -20 10, -20 4, -17 -2 Z`}
              fill={hairCol}
            />
          </g>
        </g>
      </g>
    );
  }

  // =========================================================================
  // HERO STANDING / CLIFF LOOKOUT / WALKING FIGURE (Natural proportions + wind!)
  // =========================================================================
  const walkCycle = pose === 'walk_trek' ? Math.sin(frame * 0.22) * 14 : 0;
  const leftFootX = -18 - walkCycle * 0.5;
  const rightFootX = 20 + walkCycle * 0.5;
  const headScan = Math.sin(frame * 0.032) * 4.5 + headTiltDeg;

  return (
    <g transform={`translate(${footX}, ${footY}) scale(${dir * scale}, ${scale})`}>
      {/* 1. Ambient Occlusion contact shadow + elongated directional sunlight/fire cast shadow */}
      <ellipse cx={shadowStretchX} cy={5} rx={72} ry={13} fill={rig.shadowColor} opacity={0.44} />
      <ellipse cx={0} cy={3} rx={34} ry={7} fill={rig.shadowColor} opacity={0.68} />

      {/* 2. Sculpted Anatomical Legs (Natural thigh -> knee -> calf taper + warm bounce light!) */}
      <path
        d={`M -18 -96 C -21 -70, ${leftFootX - 10} -48, ${leftFootX - 6} -2 L ${leftFootX + 9} 0 C ${leftFootX + 12} -34, ${leftFootX + 14} -52, -2 -90 Z`}
        fill={skinShadow}
      />
      <path
        d={`M -8 -94 C -10 -68, ${leftFootX + 1} -48, ${leftFootX + 3} -2 L ${leftFootX + 9} 0 C ${leftFootX + 12} -34, ${leftFootX + 13} -52, -2 -90 Z`}
        fill={skinBase}
      />
      <path
        d={`M 2 -94 C 6 -66, ${rightFootX - 12} -46, ${rightFootX - 8} -2 L ${rightFootX + 8} 0 C ${rightFootX + 14} -36, ${rightFootX + 14} -58, 20 -96 Z`}
        fill={skinShadow}
      />
      <path
        d={`M 10 -94 C 14 -66, ${rightFootX - 2} -46, ${rightFootX + 1} -2 L ${rightFootX + 8} 0 C ${rightFootX + 14} -36, ${rightFootX + 14} -58, 20 -96 Z`}
        fill={skinBase}
      />
      {/* Directional sunlit golden rim along right calf & ankle */}
      <path
        d={`M 18 -90 C 20 -66, ${rightFootX + 12} -46, ${rightFootX + 8} -3`}
        fill="none"
        stroke={skinLight}
        strokeWidth={3.4}
        opacity={0.9 * fl}
        strokeLinecap="round"
      />
      {/* Leather/hide laced foot wraps */}
      <path d={`M ${leftFootX - 7} -16 L ${leftFootX + 11} -16 L ${leftFootX + 11} 0 L ${leftFootX - 7} 0 Z`} fill="#4A2F20" />
      <path d={`M ${rightFootX - 9} -16 L ${rightFootX + 10} -16 L ${rightFootX + 10} 0 L ${rightFootX - 8} 0 Z`} fill="#5D3B27" />

      {/* 3. Breathing Torso, Weight Shift & Wind-Swept Hide Cloak */}
      <g transform={`translate(${shiftX}, ${breath})`}>
        {/* Left relaxed arm */}
        <path
          d="M -27 -174 C -38 -148, -42 -120, -34 -94 L -21 -96 C -24 -120, -22 -142, -14 -164 Z"
          fill={skinShadow}
        />
        <path d="M -21 -168 C -29 -144, -30 -120, -25 -96" fill="none" stroke={skinBase} strokeWidth={4} strokeLinecap="round" />

        {/* Wind-rippled trailing fur/woven cape behind shoulder (lagged secondary motion!) */}
        <path
          d={`M -26 -174 C ${-38 - windLag * 0.7} -142, ${-46 - windLag * 1.4} -106, ${-36 - windLag * 1.7} -72 L ${-14 - windLag * 0.8} -78 C -18 -112, -16 -144, -10 -174 Z`}
          fill={tunicDark}
          opacity={0.94}
        />

        {/* Sculpted anatomical torso & layered jagged hide tunic hem */}
        <path
          d={`M -28 -176 C -12 -186, 16 -186, 30 -174 L 26 -104 L ${34 + windLag * 0.6} -68 L 14 -76 L ${2 + windLag * 0.35} -64 L -16 -74 L ${-30 + windLag * 0.5} -66 L -24 -104 Z`}
          fill={tunicDark}
        />
        <path
          d={`M -2 -184 C 14 -184, 24 -179, 30 -174 L 26 -104 L ${33 + windLag * 0.55} -69 L 14 -76 L ${2 + windLag * 0.35} -65 L 0 -106 Z`}
          fill={tunicMain}
        />
        {/* Leather shoulder baldric + carved waist belt */}
        <path d="M -24 -174 L 24 -114 L 16 -105 L -28 -164 Z" fill="#42281C" />
        <path d="M -26 -112 Q 2 -105 27 -112 L 26 -101 Q 2 -95 -25 -101 Z" fill="#3A2419" />
        {/* Warm sunlit/firelight shoulder & tunic rim */}
        <path
          d={`M 23 -178 L 30 -170 L 26 -104 L ${32 + windLag * 0.55} -71`}
          fill="none"
          stroke={tunicRim}
          strokeWidth={3.4}
          opacity={0.9 * fl}
          strokeLinecap="round"
        />

        {/* Right arm gripping spear / torch */}
        <path
          d="M 26 -172 C 40 -150, 48 -130, 52 -114 L 39 -110 C 33 -128, 26 -144, 17 -160 Z"
          fill={skinBase}
        />
        <path d="M 28 -170 C 41 -148, 49 -130, 52 -114" fill="none" stroke={skinLight} strokeWidth={3.8} opacity={0.92 * fl} strokeLinecap="round" />

        {/* Wooden Spear with flint point */}
        {prop === 'wooden_spear' && (
          <g transform={`translate(50, -114) rotate(${6.5 + shiftX * 0.15})`}>
            <line x1={0} y1={-114} x2={0} y2={120} stroke="#45291A" strokeWidth={6} strokeLinecap="round" />
            <line x1={2} y1={-112} x2={2} y2={118} stroke="#B27D4E" strokeWidth={2} strokeLinecap="round" />
            <polygon points="0,-152 -9,-112 0,-104 9,-112" fill="#828B96" />
            <polygon points="0,-152 0,-104 9,-112" fill="#E6EAEF" />
            <rect x={-5} y={-114} width={10} height={12} rx={2} fill="#6E3D27" />
          </g>
        )}

        {prop === 'torch' && (
          <g transform="translate(52, -118) rotate(13)">
            <line x1={0} y1={-48} x2={0} y2={28} stroke="#523120" strokeWidth={6.5} strokeLinecap="round" />
            <ellipse cx={0} cy={-60} rx={18 * fl} ry={24 * fl} fill="#F3882E" opacity={0.35 * fl} />
            <ellipse cx={0} cy={-58} rx={12} ry={18 * fl} fill="#E65D24" />
            <ellipse cx={0} cy={-60} rx={7} ry={12 * fl} fill="#FCE59B" />
          </g>
        )}

        {/* 4. Sculpted Back-3/4 Head with Subtle Turned Cheek/Nose Profile & Wind-Blown Hair! */}
        <g transform={`translate(0, -184) rotate(${headScan})`}>
          <path d="M -8 -2 L 8 -2 L 9 14 L -9 14 Z" fill={skinShadow} />
          <path
            d="M -16 -20 C -17 -38, 0 -44, 15 -34 C 21 -28, 21 -14, 15 -6 L 19 -1 L 13 3 C 6 8, -8 6, -14 -4 Z"
            fill={skinShadow}
          />
          {/* Sunlit cheek/jaw/brow catchlight on looking side */}
          <path
            d="M 7 -36 C 17 -30, 21 -16, 15 -6 L 19 -1 L 12 3 C 7 -4, 7 -20, 7 -36 Z"
            fill={skinLight}
            opacity={0.92 * fl}
          />
          {/* Layered wind-swept hair with trailing strands (lagged follow-through!) */}
          <path
            d={`M -19 -18 C -21 -42, -2 -49, 14 -39 C 20 -33, 18 -20, 12 -14 C 3 -18, -4 -8, ${-18 - hairLag * 1.1} 10 C ${-25 - hairLag * 0.7} 2, -23 -8, -19 -18 Z`}
            fill={hairCol}
          />
          <path
            d={`M -16 -6 C ${-24 - hairLag * 1.3} 4, ${-28 - hairLag * 1.6} 14, ${-22 - hairLag * 1.8} 22`}
            fill="none"
            stroke={hairCol}
            strokeWidth={4.5}
            strokeLinecap="round"
          />
        </g>
      </g>
    </g>
  );
};

// =============================================================================
// DIEGETIC HORIZON SCALE SILHOUETTES (Mammoth Herd, Stepped Monument, Hominins)
// =============================================================================

export type SilhouetteSubject = 'human' | 'hominin' | 'mammoth' | 'tree' | 'stepped_temple' | 'ceramic_vessel';

export const OdysseyScaleSilhouette: React.FC<{
  subject: SilhouetteSubject;
  x: number;
  y: number;
  scale?: number;
  fill?: string;
  rimColor?: string;
  opacity?: number;
  label?: string;
  metric?: string;
}> = ({
  subject,
  x,
  y,
  scale = 1,
  fill = '#253548',
  rimColor = '#7EA8BE',
  opacity = 1,
  label,
  metric,
}) => {
  const renderShape = () => {
    switch (subject) {
      case 'mammoth':
        return (
          <path
            d="M -112 0 L -110 -58 C -114 -94, -92 -128, -56 -136 C -24 -144, 6 -132, 24 -142 C 42 -152, 68 -144, 78 -118 C 86 -96, 86 -66, 98 -44 C 106 -30, 124 -30, 134 -54 C 142 -72, 146 -88, 152 -96 C 154 -72, 144 -36, 118 -22 C 100 -12, 82 -26, 74 -48 L 66 0 L 42 0 L 40 -42 L 10 -44 L 6 0 L -20 0 L -24 -44 L -62 -44 L -68 0 L -92 0 L -94 -40 L -112 -24 Z"
            fill={fill}
            stroke={rimColor}
            strokeWidth={1.4}
          />
        );
      case 'stepped_temple':
        return (
          <path
            d="M -86 0 L -86 -24 L -70 -24 L -70 -48 L -54 -48 L -54 -72 L -38 -72 L -38 -96 L -22 -96 L -22 -118 L 22 -118 L 22 -96 L 38 -96 L 38 -72 L 54 -72 L 54 -48 L 70 -48 L 70 -24 L 86 -24 L 86 0 Z"
            fill={fill}
            stroke={rimColor}
            strokeWidth={1.4}
          />
        );
      case 'hominin':
        return (
          <path
            d="M -18 0 L -12 -38 L -22 -64 C -16 -84, -2 -98, 14 -100 C 24 -100, 30 -90, 26 -78 C 22 -70, 14 -68, 16 -56 L 24 -28 L 28 0 L 14 0 L 8 -32 L -4 -34 L -4 0 Z"
            fill={fill}
            stroke={rimColor}
            strokeWidth={1.4}
          />
        );
      case 'ceramic_vessel':
        return (
          <path
            d="M -22 0 C -34 -18, -42 -48, -32 -76 C -26 -90, -18 -96, -24 -108 L 24 -108 C 18 -96, 26 -90, 32 -76 C 42 -48, 34 -18, 22 0 Z"
            fill={fill}
            stroke={rimColor}
            strokeWidth={1.4}
          />
        );
      case 'tree':
        return (
          <path
            d="M -14 0 L -8 -58 C -48 -58, -68 -86, -54 -116 C -48 -144, -14 -158, 10 -150 C 42 -156, 66 -130, 58 -98 C 66 -74, 42 -56, 10 -58 L 16 0 Z"
            fill={fill}
            stroke={rimColor}
            strokeWidth={1.4}
          />
        );
      default:
        return (
          <path
            d="M -16 0 L -12 -52 L -22 -86 C -20 -106, -12 -118, 0 -120 C 12 -118, 20 -106, 22 -86 L 12 -52 L 16 0 L 4 0 L 0 -46 L -4 0 Z M 0 -144 A 11 12 0 1 0 0.1 -144 Z"
            fill={fill}
            stroke={rimColor}
            strokeWidth={1.4}
          />
        );
    }
  };

  return (
    <g transform={`translate(${x}, ${y})`} opacity={opacity}>
      <g transform={`scale(${scale})`}>{renderShape()}</g>
      {label && (
        <text x={0} y={26} textAnchor="middle" fill="#E8D8B8" fontFamily="Georgia, serif" fontSize={15} fontWeight={700} letterSpacing="0.06em">
          {label}
        </text>
      )}
      {metric && (
        <text x={0} y={44} textAnchor="middle" fill="#9AB5C4" fontFamily="system-ui, sans-serif" fontSize={12.5} fontWeight={600}>
          {metric}
        </text>
      )}
    </g>
  );
};

// =============================================================================
// CINEMATIC CLOSE-UP ACTORS (SH01B OVER-THE-SHOULDER & SH04A FLINT-SPARK HANDS!)
// Provides genuine Hollywood shot-size variation while locking character consistency!
// =============================================================================

export const HunterOverShoulderCloseUp2D: React.FC<{
  frame?: number;
  windStrength?: number;
}> = ({ frame = 0, windStrength = 1.2 }) => {
  const breath = Math.sin(frame * 0.055) * 4.5;
  const wind = (Math.sin((frame - 4) * 0.09) * 14 + Math.cos((frame - 9) * 0.14) * 6) * windStrength;
  const gazeTurn = Math.sin(frame * 0.04) * 2.2;

  return (
    <g transform={`translate(0, ${breath.toFixed(1)})`}>
      {/* Massive Foreground Shoulder & Hide Tunic (matching exact hunter palette: #9E734B / #533825 / #42281C) */}
      <path
        d="M -60 1980 L -60 1120 C 40 1030, 170 980, 320 995 C 435 1010, 505 1110, 530 1260 L 560 1980 Z"
        fill="#4A3122"
      />
      <path
        d="M 110 995 C 220 988, 340 1005, 425 1065 C 495 1125, 520 1235, 540 1980 L 210 1980 C 190 1560, 160 1210, 110 995 Z"
        fill="#966C46"
      />
      {/* Diagonal leather baldric strap matching Shot 1 wide hunter */}
      <path d="M 120 1005 L 495 1510 L 420 1560 L 40 1060 Z" fill="#3B2318" />
      {/* Warm golden sunlit rim along right shoulder & collar */}
      <path
        d="M 332 1002 C 428 1028, 496 1115, 522 1268 L 548 1920"
        fill="none"
        stroke="#F6D194"
        strokeWidth={11}
        strokeLinecap="round"
        opacity={0.86}
      />

      {/* Upright Knapped Flint Spear held close in right foreground */}
      <g transform="translate(566, 980) rotate(5)">
        <line x1={0} y1={-360} x2={0} y2={980} stroke="#44281A" strokeWidth={24} strokeLinecap="round" />
        <line x1={8} y1={-350} x2={8} y2={980} stroke="#BA8454" strokeWidth={7} strokeLinecap="round" />
        {/* Sculpted faceted flint blade catching bright sunlight */}
        <polygon points="0,-510 -34,-352 0,-326 34,-352" fill="#7D8692" />
        <polygon points="0,-510 0,-326 34,-352" fill="#E6EBF0" />
        <polygon points="0,-510 10,-395 34,-352 0,-368" fill="#FAF6E8" opacity={0.85} />
        <rect x={-19} y={-356} width={38} height={46} rx={6} fill="#6E3E27" />
        <line x1={-19} y1={-340} x2={19} y2={-346} stroke="#452518" strokeWidth={5} />
        <line x1={-19} y1={-324} x2={19} y2={-330} stroke="#452518" strokeWidth={5} />
      </g>

      {/* Sculpted Side-3/4 Hunter Head & Expressive Profile looking out across valley */}
      <g transform={`translate(275, 865) rotate(${gazeTurn.toFixed(2)})`}>
        {/* Muscular neck */}
        <path d="M -52 55 L 48 65 L 54 175 L -62 175 Z" fill="#653C28" />
        <path d="M 10 62 L 48 65 L 54 175 L 16 175 Z" fill="#BC7E56" />

        {/* Cranium + distinct brow ridge, bridge of nose, lips & determined jaw */}
        <path
          d="M -112 -24 C -118 -142, -8 -188, 92 -136 C 122 -118, 128 -78, 122 -52 L 154 -8 C 158 2, 150 12, 134 16 L 138 36 L 128 48 L 134 64 C 124 92, 92 106, 48 104 C -36 100, -104 54, -112 -24 Z"
          fill="#633A26"
        />
        {/* Sun-facing bronze skin planes */}
        <path
          d="M 16 -152 C 84 -144, 128 -102, 122 -52 L 154 -8 C 158 2, 150 12, 134 16 L 138 36 L 128 48 L 134 64 C 124 90, 92 104, 48 102 C 18 82, 14 14, 16 -152 Z"
          fill="#BD7F57"
        />
        {/* Bright sunlit facial profile rim highlight (forehead -> nose -> chin!) */}
        <path
          d="M 88 -134 C 120 -116, 128 -78, 122 -52 L 154 -8 C 156 2, 148 12, 134 16 L 138 36 L 128 48 L 132 68 C 122 88, 96 100, 62 100"
          fill="none"
          stroke="#F8D29B"
          strokeWidth={9}
          strokeLinecap="round"
        />
        {/* Expressive focused eye looking out over the valley */}
        <path d="M 74 -42 Q 100 -54 118 -40" fill="none" stroke="#2A1B16" strokeWidth={7} strokeLinecap="round" />
        <ellipse cx={99} cy={-28} rx={11} ry={7} fill="#EFE7DA" />
        <circle cx={104} cy={-28} r={5.5} fill="#251914" />
        <circle cx={106} cy={-30} r={2} fill="#FFF6DE" />

        {/* Layered dark wind-swept hair strands whipping organically in valley breeze! */}
        <path
          d={`M -122 -14 C -134 -168, -6 -214, 96 -148 C 48 -148, 8 -118, -22 -42 C -46 24, ${-94 - wind * 1.1} 118, ${-166 - wind * 1.8} 195 C ${-200 - wind * 1.2} 134, -158 42, -122 -14 Z`}
          fill="#211816"
        />
        <path
          d={`M -88 -24 C ${-132 - wind * 1.2} 42, ${-172 - wind * 1.9} 112, ${-218 - wind * 2.4} 165`}
          fill="none"
          stroke="#261C19"
          strokeWidth={18}
          strokeLinecap="round"
        />
        <path
          d={`M -54 18 C ${-94 - wind * 1.1} 76, ${-124 - wind * 1.7} 138, ${-154 - wind * 2.1} 206`}
          fill="none"
          stroke="#3A2B26"
          strokeWidth={10}
          strokeLinecap="round"
        />
      </g>
    </g>
  );
};

export const FlintSparkHandsCloseUp2D: React.FC<{
  frame?: number;
}> = ({ frame = 0 }) => {
  const rig = useLightingRig();
  const fl = rig.flicker;
  // Strike cycle: anticipation -> sharp downward flint strike at frame ~24 -> sparks burst -> tinder ignites!
  const strikePhase = Math.min(1, Math.max(0, (frame - 12) / 14));
  const pullBack = frame < 12 ? Math.sin((frame / 12) * Math.PI * 0.5) * -32 : 0;
  const strikeDrop = frame >= 12 && frame < 26 ? -32 + strikePhase * 74 : 42 - Math.min(1, Math.max(0, (frame - 26) / 14)) * 24;
  const sparkBurstAge = Math.max(0, frame - 24);
  const sparkOp = sparkBurstAge > 0 ? Math.max(0, 1 - sparkBurstAge / 34) : 0;
  const emberIgnite = Math.min(1, Math.max(0, (frame - 26) / 28));

  return (
    <g>
      {/* Rich Dry Tinder Nest & Bark Bed in Lower Foreground */}
      <g transform="translate(540, 1280)">
        <ellipse cx={0} cy={42} rx={360} ry={96} fill="#1C1418" />
        {/* Woven dry golden-brown tinder fibers */}
        {[-160, -110, -60, -20, 24, 72, 122, 168].map((ox, i) => (
          <path
            key={i}
            d={`M ${ox - 80} ${36 + (i % 3) * 10} Q ${ox} ${-26 + (i % 2) * 14} ${ox + 85} ${32 + ((i + 1) % 3) * 10}`}
            fill="none"
            stroke={i % 2 === 0 ? '#785334' : '#A47548'}
            strokeWidth={9}
            strokeLinecap="round"
          />
        ))}
        {/* Newborn Igniting Tinder Glow & Crawling Flame Tongues */}
        {emberIgnite > 0.02 && (
          <g opacity={emberIgnite}>
            <ellipse cx={0} cy={10} rx={210 * fl} ry={75 * fl} fill="#F2852E" opacity={0.34 * fl} />
            <ellipse cx={0} cy={8} rx={115 * fl} ry={44} fill="#FBE192" opacity={0.42 * fl} />
            <path
              d={`M -54 14 C -68 -42, -24 ${-110 * emberIgnite * fl}, 4 ${-175 * emberIgnite * fl} C 36 ${-108 * emberIgnite * fl}, 66 -38, 52 14 Z`}
              fill="#DF4C20"
            />
            <path
              d={`M -34 14 C -40 -28, -12 ${-76 * emberIgnite * fl}, 2 ${-124 * emberIgnite * fl} C 24 ${-76 * emberIgnite * fl}, 40 -26, 32 14 Z`}
              fill="#F7A13B"
            />
            <path
              d={`M -16 14 C -18 -14, -4 ${-42 * emberIgnite}, 2 ${-72 * emberIgnite * fl} C 14 ${-40 * emberIgnite}, 20 -12, 16 14 Z`}
              fill="#FEF2BA"
            />
          </g>
        )}
      </g>

      {/* LEFT ANCIENT HAND holding dark knapped flint core steady over tinder */}
      <g transform="translate(275, 1010)">
        {/* Forearm & stitched leather wrist wrap */}
        <path d="M -310 185 L -50 75 L -20 175 L -290 295 Z" fill="#6D432C" />
        <path d="M -290 198 L -55 96 L -40 144 L -280 250 Z" fill="#B97B54" />
        <path d="M -110 86 L -45 64 L -12 178 L -78 202 Z" fill="#462A1D" stroke="#261510" strokeWidth={3} />
        {/* Sculpted fingers gripping stone */}
        <path d="M -35 72 C 25 40, 118 28, 175 56 C 194 74, 186 106, 152 118 L 36 168 L -28 164 Z" fill="#A96E4B" />
        {/* Warm firelight bounce illuminating knuckles & palm edge! */}
        <path
          d="M 40 48 C 98 34, 152 40, 176 62 C 188 78, 176 102, 146 114 L 58 148"
          fill="none"
          stroke="#F8B968"
          strokeWidth={8}
          opacity={(0.35 + 0.65 * emberIgnite) * fl}
          strokeLinecap="round"
        />
        {/* Faceted Dark Knapped Flint Core */}
        <polygon points="122,42 204,12 254,64 218,124 134,116" fill="#3B424E" stroke="#1E232C" strokeWidth={3} />
        <polygon points="122,42 204,12 222,64 156,82" fill="#687282" />
        <polygon points="204,12 254,64 222,64" fill="#98A2B0" />
      </g>

      {/* RIGHT ANCIENT HAND striking golden pyrite striker sharply downward! */}
      <g transform={`translate(760, ${(860 + pullBack + strikeDrop).toFixed(1)}) rotate(${(-12 + strikeDrop * 0.22).toFixed(1)})`}>
        <path d="M 330 60 L 60 12 L 40 118 L 315 178 Z" fill="#68402A" />
        <path d="M 320 74 L 64 28 L 54 78 L 312 132 Z" fill="#BD7E56" />
        <path d="M 105 18 L 42 8 L 24 122 L 88 134 Z" fill="#4A2D1E" stroke="#261510" strokeWidth={3} />
        {/* Sculpted striking fingers */}
        <path d="M 48 16 C -26 -8, -118 8, -158 50 C -172 74, -152 108, -114 114 L 38 116 Z" fill="#B2744E" />
        <path
          d="M -28 8 C -88 6, -138 24, -156 54 C -166 76, -148 102, -114 110"
          fill="none"
          stroke="#F9BD6E"
          strokeWidth={8}
          opacity={(0.4 + 0.6 * emberIgnite) * fl}
          strokeLinecap="round"
        />
        {/* Golden Pyrite Striker Stone */}
        <polygon points="-136,44 -208,76 -184,132 -114,116 -96,68" fill="#8C6E42" stroke="#362818" strokeWidth={3} />
        <polygon points="-136,44 -208,76 -166,94 -116,68" fill="#D4B06C" />
      </g>

      {/* DAZZLING WHITE-GOLD INCANDESCENT SPARK SHOWER AT IMPACT POINT! */}
      {sparkOp > 0.01 && (
        <g transform="translate(534, 1028)" opacity={sparkOp}>
          {/* Hot impact flash */}
          <circle cx={0} cy={0} r={44 * (1 - sparkBurstAge / 40)} fill="#FFF6CE" opacity={0.85} />
          <circle cx={0} cy={0} r={105 * (1 - sparkBurstAge / 45)} fill="#F8A842" opacity={0.38} />
          {/* 22 ballistic glowing spark streaks arcing down into tinder nest! */}
          {Array.from({ length: 22 }).map((_, i) => {
            const ang = (Math.PI * 0.15) + (i / 21) * (Math.PI * 0.78) + (i % 3 - 1) * 0.14;
            const spd = 7 + (i * 37 % 14);
            const t = sparkBurstAge;
            const sx = Math.cos(ang) * spd * t * (i % 2 === 0 ? 1 : -1) * 0.9;
            const sy = Math.sin(ang) * spd * t * 0.65 + 0.45 * t * t;
            const px = sx - Math.cos(ang) * 18 * (i % 2 === 0 ? 1 : -1);
            const py = sy - Math.sin(ang) * 14 - 0.6 * t;
            return (
              <g key={i}>
                <line x1={px} y1={py} x2={sx} y2={sy} stroke={i % 3 === 0 ? '#FFF7D4' : '#F8B146'} strokeWidth={i % 2 === 0 ? 4.5 : 3} strokeLinecap="round" />
                <circle cx={sx} cy={sy} r={3.5} fill="#FFF8DC" />
              </g>
            );
          })}
        </g>
      )}
    </g>
  );
};
