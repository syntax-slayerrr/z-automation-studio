import React from 'react';
import { clamp, easeOutCubic, GP, lerp } from './fx';

/**
 * V2 LINELESS PAINTERLY GOUACHE PEATLAND ECOLOGY & GEOLOGY ENGINE (`peatPainter.tsx`)
 * Engineered to 1:1 Gunung Guntur V2 / Danau Toba visual craft:
 *  - ZERO heavy cartoon outlines on skies, mist, clouds, forests, water, or smoke.
 *  - Seamless 720px full-width horizontal dry-brush gouache texture (zero repeating vertical columns!).
 *  - Authentic Indonesian tropical peat swamp forests (Ramin/Meranti stilt roots, tannin mirror water).
 *  - Multi-layer undulating geological peat strata (Fibric -> Hemic -> Sapric -> Mineral Clay).
 *  - Scientifically accurate FLAMELESS subterranean Smouldering Combustion vs open surface twig flame!
 */

export const PeatPainterDefs: React.FC = () => (
  <defs>
    <filter id="gpSunBloom" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="20" />
    </filter>
    <filter id="gpMistBlur" x="-25%" y="-35%" width="150%" height="170%">
      <feGaussianBlur stdDeviation="14" />
    </filter>
    <filter id="gpEmberBloom" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="18" />
    </filter>
    <filter id="gpSoftShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="5" />
    </filter>
    {/* Seamless Full-Width Organic Horizontal Dry-Brush Gouache Overlay (720px span = ZERO vertical seams!) */}
    <pattern id="gpHorizontalBrush" width="720" height="72" patternUnits="userSpaceOnUse">
      <line x1="-20" y1="6" x2="295" y2="5" stroke="#FAF2DC" strokeWidth="2.2" strokeOpacity="0.05" />
      <line x1="220" y1="12" x2="625" y2="13" stroke="#1B181A" strokeWidth="2.0" strokeOpacity="0.048" />
      <line x1="470" y1="19" x2="740" y2="18" stroke="#FAF2DC" strokeWidth="1.8" strokeOpacity="0.045" />
      <line x1="35" y1="26" x2="450" y2="27" stroke="#FAF2DC" strokeWidth="1.9" strokeOpacity="0.042" />
      <line x1="320" y1="34" x2="710" y2="33" stroke="#1B181A" strokeWidth="2.1" strokeOpacity="0.05" />
      <line x1="-10" y1="42" x2="365" y2="43" stroke="#1B181A" strokeWidth="1.7" strokeOpacity="0.042" />
      <line x1="175" y1="50" x2="595" y2="49" stroke="#FAF2DC" strokeWidth="2.0" strokeOpacity="0.046" />
      <line x1="505" y1="58" x2="740" y2="59" stroke="#1B181A" strokeWidth="1.8" strokeOpacity="0.045" />
      <line x1="65" y1="66" x2="485" y2="65" stroke="#FAF2DC" strokeWidth="1.8" strokeOpacity="0.044" />
    </pattern>
    {/* Organic Fibrous Peat Soil Texture Pattern */}
    <pattern id="gpPeatFibers" width="180" height="64" patternUnits="userSpaceOnUse">
      <path d="M 8 14 Q 34 9, 58 16" fill="none" stroke="#8C6B4B" strokeWidth="1.6" strokeOpacity="0.24" strokeLinecap="round" />
      <path d="M 96 10 Q 126 17, 158 11" fill="none" stroke="#1E1410" strokeWidth="1.8" strokeOpacity="0.32" strokeLinecap="round" />
      <path d="M 28 34 Q 64 28, 92 36" fill="none" stroke="#9A7752" strokeWidth="1.4" strokeOpacity="0.22" strokeLinecap="round" />
      <path d="M 116 42 Q 145 36, 174 44" fill="none" stroke="#1E1410" strokeWidth="1.6" strokeOpacity="0.3" strokeLinecap="round" />
      <circle cx="44" cy="52" r="2.2" fill="#8E6C48" opacity="0.22" />
      <circle cx="132" cy="24" r="1.8" fill="#1A120E" opacity="0.34" />
      <path d="M 62 56 Q 94 52, 118 58" fill="none" stroke="#7A5B3E" strokeWidth="1.5" strokeOpacity="0.24" strokeLinecap="round" />
    </pattern>
  </defs>
);

export type PeatSkyMood = 'misty_morning' | 'ancient_swamp' | 'dry_haze' | 'smoulder_haze' | 'monsoon_storm';

/** Soft Feathered Gouache Sky with Sun Halation & Blurred Watercolor Ribbons */
export const PeatSky: React.FC<{
  f: number;
  mood: PeatSkyMood;
  sunX?: number;
  sunY?: number;
  sunR?: number;
  opacity?: number;
}> = ({ f, mood, sunX = 525, sunY = 305, sunR = 38, opacity = 1 }) => {
  const uid = `gpSky_${mood}`;
  const drift = Math.sin(f * 0.012) * 14;

  const stops: Record<PeatSkyMood, Array<[string, string]>> = {
    misty_morning: [
      ['0%', '#1E4A5C'],
      ['36%', '#4F848C'],
      ['70%', '#B4CFC0'],
      ['100%', '#E5E0C4'],
    ],
    ancient_swamp: [
      ['0%', '#244A4D'],
      ['38%', '#587E6B'],
      ['72%', '#C4BD92'],
      ['100%', '#E8D9A8'],
    ],
    dry_haze: [
      ['0%', '#3B363E'],
      ['38%', '#7E6454'],
      ['72%', '#C59364'],
      ['100%', '#E4B882'],
    ],
    smoulder_haze: [
      ['0%', '#251D22'],
      ['38%', '#563632'],
      ['72%', '#96563C'],
      ['100%', '#C47E4C'],
    ],
    monsoon_storm: [
      ['0%', '#1B2836'],
      ['38%', '#364A5A'],
      ['74%', '#5C6F7A'],
      ['100%', '#829096'],
    ],
  };

  const ribbons: Record<PeatSkyMood, Array<{ y: number; h: number; col: string; op: number }>> = {
    misty_morning: [
      { y: 120, h: 30, col: '#487B86', op: 0.30 },
      { y: 215, h: 34, col: '#84B0AE', op: 0.32 },
      { y: 310, h: 36, col: '#C4D9C6', op: 0.36 },
      { y: 405, h: 34, col: '#EAE3C8', op: 0.38 },
    ],
    ancient_swamp: [
      { y: 130, h: 30, col: '#476D60', op: 0.32 },
      { y: 230, h: 36, col: '#94A27E', op: 0.34 },
      { y: 340, h: 38, col: '#DFCE9B', op: 0.38 },
    ],
    dry_haze: [
      { y: 130, h: 32, col: '#6A5248', op: 0.36 },
      { y: 235, h: 36, col: '#B07B56', op: 0.38 },
      { y: 345, h: 38, col: '#DFA972', op: 0.38 },
    ],
    smoulder_haze: [
      { y: 130, h: 32, col: '#4A2E2C', op: 0.40 },
      { y: 235, h: 36, col: '#824634', op: 0.38 },
      { y: 345, h: 38, col: '#BC6E42', op: 0.36 },
    ],
    monsoon_storm: [
      { y: 120, h: 36, col: '#2A3C4C', op: 0.42 },
      { y: 225, h: 40, col: '#4E6270', op: 0.38 },
      { y: 330, h: 34, col: '#74848E', op: 0.32 },
    ],
  };

  return (
    <g opacity={opacity}>
      <defs>
        <linearGradient id={uid} x1="0%" y1="0%" x2="0%" y2="100%">
          {stops[mood].map(([off, col]) => (
            <stop key={off} offset={off} stopColor={col} />
          ))}
        </linearGradient>
        <radialGradient id={`${uid}_sun`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FAF3D8" stopOpacity="0.95" />
          <stop offset="38%" stopColor={mood === 'dry_haze' ? '#F2B872' : '#EFE6C4'} stopOpacity="0.48" />
          <stop offset="100%" stopColor="#EAE2C6" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x={-40} y={-40} width={800} height={1360} fill={`url(#${uid})`} />
      <g filter="url(#gpMistBlur)">
        {ribbons[mood].map((r, ri) => {
          const sx = (ri % 2 === 0 ? -30 : 25) + drift * (ri % 2 === 0 ? 1 : -0.8);
          return (
            <g key={ri} opacity={r.op}>
              <ellipse cx={360 + sx} cy={r.y} rx={460} ry={r.h * 0.72} fill={r.col} />
              <ellipse cx={165 + sx * 1.2} cy={r.y + 8} rx={260} ry={r.h * 0.5} fill={r.col} opacity={0.72} />
            </g>
          );
        })}
      </g>
      <rect x={-40} y={-40} width={800} height={1360} fill="url(#gpHorizontalBrush)" opacity={0.85} />
      {mood !== 'monsoon_storm' && mood !== 'smoulder_haze' && (
        <g>
          <circle cx={sunX} cy={sunY} r={sunR * 4.2} fill={`url(#${uid}_sun)`} />
          <circle cx={sunX} cy={sunY} r={sunR} fill="#FAF3D8" opacity={0.92} />
        </g>
      )}
    </g>
  );
};

/** Lineless 3-Tone Painted Gouache Cloud */
export const PeatCloud: React.FC<{
  x: number;
  y: number;
  scale?: number;
  tone?: 'day' | 'dusk' | 'storm' | 'smoke';
  opacity?: number;
  flip?: boolean;
}> = ({ x, y, scale = 1, tone = 'day', opacity = 1, flip = false }) => {
  const p = {
    day: { shd: '#7B8E98', mid: '#BCC9C4', lit: '#F0ECE0', rim: '#FAF5E8' },
    dusk: { shd: '#665A6C', mid: '#AE8E82', lit: '#E6C6AC', rim: '#F8DFC6' },
    storm: { shd: '#283644', mid: '#485A68', lit: '#72828E', rim: '#92A0AA' },
    smoke: { shd: '#3E3944', mid: '#6E6874', lit: '#9C969C', rim: '#BCB6B8' },
  }[tone];
  return (
    <g transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)}) scale(${flip ? -scale : scale}, ${scale})`} opacity={opacity}>
      <g fill={p.shd}>
        <ellipse cx={0} cy={17} rx={92} ry={21} />
        <circle cx={-64} cy={8} r={27} />
        <circle cx={-25} cy={-4} r={37} />
        <circle cx={24} cy={-2} r={34} />
        <circle cx={66} cy={10} r={25} />
      </g>
      <g fill={p.mid}>
        <ellipse cx={-2} cy={10} rx={84} ry={16} />
        <circle cx={-62} cy={3} r={23} />
        <circle cx={-24} cy={-10} r={33} />
        <circle cx={22} cy={-8} r={30} />
        <circle cx={60} cy={4} r={21} />
      </g>
      <g fill={p.lit}>
        <circle cx={-56} cy={-2} r={18} />
        <circle cx={-21} cy={-16} r={28} />
        <circle cx={19} cy={-14} r={24} />
        <circle cx={52} cy={-1} r={16} />
        <ellipse cx={-4} cy={-2} rx={62} ry={12} />
      </g>
      <ellipse cx={-20} cy={-33} rx={17} ry={7} fill={p.rim} opacity={0.7} />
    </g>
  );
};

/**
 * Multi-Layer Lineless Tropical Peat Swamp Tree (Ramin / Meranti silhouette with stilt roots & painterly tufted canopy!)
 */
export const PeatSwampTree: React.FC<{
  x: number;
  baseY: number;
  scale?: number;
  dryness?: number; // 0 = lush emerald rainforest, 1 = parched ochre-brown dry forest
  swayDeg?: number;
  flip?: boolean;
}> = ({ x, baseY, scale = 1, dryness = 0, swayDeg = 0, flip = false }) => {
  const leafDark = dryness > 0.5 ? '#483D28' : '#1E3C2B';
  const leafMid = dryness > 0.5 ? '#725C36' : '#38623D';
  const leafLit = dryness > 0.5 ? '#A2854E' : '#668F50';
  const leafRim = dryness > 0.5 ? '#C8AB6E' : '#96BA72';
  const trunkDark = '#3E2B20';
  const trunkLit = '#654834';

  return (
    <g
      transform={`translate(${x.toFixed(1)}, ${baseY.toFixed(1)}) rotate(${swayDeg.toFixed(2)}) scale(${flip ? -scale : scale}, ${scale})`}
    >
      {/* Characteristic Peat Swamp Stilt / Buttress Roots */}
      <g stroke={trunkDark} strokeWidth={5.5} strokeLinecap="round" fill="none">
        <path d="M -5 -26 Q -22 -10, -34 10" />
        <path d="M -2 -22 Q -10 -5, -14 14" />
        <path d="M 4 -24 Q 20 -8, 32 10" />
        <path d="M 2 -18 Q 10 -4, 15 14" />
      </g>
      {/* Tall Slender Tropical Trunk + Branches */}
      <path d="M -9 4 L -6 -196 L 6 -196 L 10 4 Z" fill={trunkDark} />
      <path d="M 1 4 L 2 -196 L 6 -196 L 10 4 Z" fill={trunkLit} opacity={0.72} />
      <g stroke={trunkDark} strokeWidth={5} strokeLinecap="round">
        <line x1={0} y1={-136} x2={-44} y2={-160} />
        <line x1={0} y1={-152} x2={46} y2={-174} />
        <line x1={0} y1={-176} x2={-28} y2={-198} />
      </g>
      {/* Organic Multi-Tufted Lineless Canopy Clusters */}
      {[
        { cx: 0, cy: -212, rx: 56, ry: 24 },
        { cx: -46, cy: -168, rx: 44, ry: 18 },
        { cx: 48, cy: -182, rx: 46, ry: 20 },
      ].map((c, ci) => (
        <g key={ci} transform={`translate(${c.cx}, ${c.cy})`}>
          <ellipse cx={0} cy={8} rx={c.rx} ry={c.ry * 0.72} fill={leafDark} />
          <circle cx={-c.rx * 0.45} cy={-2} r={c.ry * 0.95} fill={leafDark} />
          <circle cx={c.rx * 0.45} cy={-1} r={c.ry * 0.9} fill={leafDark} />
          <ellipse cx={0} cy={1} rx={c.rx * 0.88} ry={c.ry * 0.68} fill={leafMid} />
          <circle cx={-c.rx * 0.36} cy={-8} r={c.ry * 0.86} fill={leafMid} />
          <circle cx={c.rx * 0.32} cy={-9} r={c.ry * 0.92} fill={leafMid} />
          <ellipse cx={c.rx * 0.14} cy={-14} rx={c.rx * 0.48} ry={c.ry * 0.48} fill={leafLit} />
          <ellipse cx={-c.rx * 0.25} cy={-12} rx={c.rx * 0.36} ry={c.ry * 0.4} fill={leafLit} />
          <ellipse cx={c.rx * 0.18} cy={-19} rx={c.rx * 0.28} ry={c.ry * 0.22} fill={leafRim} opacity={0.75} />
        </g>
      ))}
    </g>
  );
};

/**
 * Multi-Layer Indonesian Peat Swamp Forest Horizon (Distant Misty Treeline + Mid Canopy + Tannin Mirror Water + Drifting Mist)
 */
export const PeatForestHorizon: React.FC<{
  f: number;
  horizonY: number;
  dryness?: number;
  waterOpacity?: number;
  smokeOpacity?: number;
  parallaxX?: number;
}> = ({ f, horizonY, dryness = 0, waterOpacity = 1, smokeOpacity = 0, parallaxX = 0 }) => {
  const sway = Math.sin(f * 0.045) * 1.4;
  return (
    <g>
      {/* Distant Aerial-Perspective Misty Swamp Forest Silhouette */}
      <g transform={`translate(${(parallaxX * 0.22).toFixed(1)}, 0)`}>
        <path
          d={`M -80 ${horizonY} Q 40 ${horizonY - 68}, 145 ${horizonY - 46} T 355 ${horizonY - 72} T 565 ${horizonY - 52} T 800 ${horizonY - 64} L 800 ${horizonY + 40} L -80 ${horizonY + 40} Z`}
          fill={dryness > 0.5 ? '#7B6E5C' : '#5E8476'}
          opacity={0.72}
        />
        <rect
          x={-60}
          y={horizonY - 54}
          width={840}
          height={74}
          fill={dryness > 0.5 ? '#D8B88E' : '#DAE5D8'}
          opacity={0.44}
          filter="url(#gpMistBlur)"
        />
      </g>

      {/* Midground Dense Tropical Peat Forest Wall */}
      <g transform={`translate(${(parallaxX * 0.48).toFixed(1)}, 0)`}>
        <path
          d={`M -80 ${horizonY + 14} Q 25 ${horizonY - 52}, 120 ${horizonY - 28} T 295 ${horizonY - 56} T 490 ${horizonY - 34} T 660 ${horizonY - 58} T 800 ${horizonY - 24} L 800 ${horizonY + 55} L -80 ${horizonY + 55} Z`}
          fill={dryness > 0.5 ? '#574934' : '#2C513A'}
        />
        {/* Hero Midground Peat Swamp Trees */}
        <PeatSwampTree x={75} baseY={horizonY + 26} scale={0.72} dryness={dryness} swayDeg={sway} />
        <PeatSwampTree x={215} baseY={horizonY + 20} scale={0.62} dryness={dryness} swayDeg={-sway * 0.8} flip />
        <PeatSwampTree x={515} baseY={horizonY + 22} scale={0.66} dryness={dryness} swayDeg={sway * 0.9} />
        <PeatSwampTree x={645} baseY={horizonY + 28} scale={0.78} dryness={dryness} swayDeg={-sway} flip />
      </g>

      {/* Calm Dark Reflective Tannin Swamp Water Band (When Wet!) */}
      {waterOpacity > 0.02 && (
        <g opacity={waterOpacity}>
          <defs>
            <linearGradient id="gpSwampWaterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3B6E7D" />
              <stop offset="48%" stopColor="#244D60" />
              <stop offset="100%" stopColor="#163344" />
            </linearGradient>
          </defs>
          <rect x={-40} y={horizonY + 18} width={800} height={68} fill="url(#gpSwampWaterGrad)" />
          {/* Soft Sunlit Horizontal Water Reflections */}
          {[0, 1, 2, 3, 4, 5].map((wi) => {
            const wx = 85 + wi * 108 + Math.sin(f * 0.04 + wi * 1.3) * 14;
            const wy = horizonY + 28 + (wi % 3) * 15;
            return (
              <line
                key={wi}
                x1={wx - 34}
                y1={wy}
                x2={wx + 34}
                y2={wy}
                stroke="#D8EAE2"
                strokeWidth={2.2}
                strokeLinecap="round"
                opacity={0.42}
              />
            );
          })}
        </g>
      )}

      {/* Drifting Morning Swamp Fog or Rising Smoky Haze */}
      <g opacity={0.46 + smokeOpacity * 0.35} filter="url(#gpMistBlur)">
        {[0, 1, 2].map((mi) => (
          <ellipse
            key={mi}
            cx={140 + mi * 240 + Math.sin(f * 0.02 + mi * 2) * 36}
            cy={horizonY + 8 - mi * 14}
            rx={175}
            ry={24}
            fill={smokeOpacity > 0.25 ? '#9B9498' : '#E8EEE4'}
          />
        ))}
      </g>
    </g>
  );
};

/**
 * HERO SCIENTIFIC GEOLOGICAL PEAT CUTAWAY (`PeatCutawayStrata`)
 * Renders undulating hand-painted peat layers (Fibric -> Hemic -> Sapric -> Mineral Clay),
 * live water table depth, desiccation cracks, and scientifically accurate FLAMELESS Smouldering Combustion!
 */
export const PeatCutawayStrata: React.FC<{
  f: number;
  topY: number;
  bottomY?: number;
  /** Y position of groundwater table (smaller = wetter / flooded; larger = drained dry!) */
  waterTableY: number;
  showWaterLine?: boolean;
  /** 0..1 soil desiccation & surface cracking */
  dryness?: number;
  /** 0..1 intensity of FLAMELESS subterranean smouldering ember zone */
  smoulderT?: number;
  /** 0..1 horizontal & vertical spread of smouldering pocket */
  smoulderSpread?: number;
  /** Optional glowing ember center X (default 360) */
  smoulderCenterX?: number;
  /** Optional horizontal thickness multiplier for ancient peat growth time-lapse (0.15..1.0) */
  peatThicknessT?: number;
  /** Optional wet surface soaking band from tropical rainfall (0..1) */
  surfaceWetT?: number;
}> = ({
  f,
  topY,
  bottomY = 1280,
  waterTableY,
  showWaterLine = true,
  dryness = 0,
  smoulderT = 0,
  smoulderSpread = 0.5,
  smoulderCenterX = 360,
  peatThicknessT = 1,
  surfaceWetT = 0,
}) => {
  const totalH = bottomY - topY;
  const peatH = totalH * 0.78 * clamp(peatThicknessT, 0.12, 1);
  const yFibric = topY;
  const yHemic = topY + peatH * 0.28;
  const ySapric = topY + peatH * 0.62;
  const yClay = topY + peatH;

  const wavePath = (y: number, amp = 10, phase = 0) =>
    `M -20 ${y.toFixed(1)} Q 160 ${(y - amp * Math.cos(phase)).toFixed(1)}, 360 ${(y + amp * Math.sin(phase)).toFixed(1)} T 740 ${(y - amp * 0.6).toFixed(1)} L 740 ${bottomY + 20} L -20 ${bottomY + 20} Z`;

  const pulse = 0.88 + 0.12 * Math.sin(f * 0.16);
  const clipId = `gpPeatClip_${Math.round(topY)}`;

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <path d={wavePath(topY, 6, 0.2)} />
        </clipPath>
        <radialGradient id="gpEmberZoneGrad" cx="50%" cy="50%" r="52%">
          <stop offset="0%" stopColor="#FFF0A8" stopOpacity="0.96" />
          <stop offset="28%" stopColor="#F48426" stopOpacity="0.92" />
          <stop offset="64%" stopColor="#B82C18" stopOpacity="0.82" />
          <stop offset="100%" stopColor="#261412" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="gpGroundWaterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3B89A6" stopOpacity="0.24" />
          <stop offset="45%" stopColor="#1E5B75" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#11384B" stopOpacity="0.34" />
        </linearGradient>
      </defs>

      <g clipPath={`url(#${clipId})`}>
        {/* Layer 1: Fibric Upper Peat (Coarse woody roots & mossy litter) */}
        <path d={wavePath(yFibric, 6, 0.2)} fill={dryness > 0.5 ? '#5E422C' : GP.peatFibric} />

        {/* Layer 2: Hemic Middle Peat (Partially decomposed organic fibers) */}
        <path d={wavePath(yHemic, 11, 1.1)} fill={dryness > 0.5 ? '#422B1E' : GP.peatHemic} />

        {/* Layer 3: Sapric Deep Ancient Peat (Compressed dark carbon-rich humus) */}
        <path d={wavePath(ySapric, 12, 2.3)} fill={GP.peatSapric} />

        {/* Layer 4: Underlying Alluvial Mineral Clay Substratum */}
        <path d={wavePath(yClay, 9, 0.8)} fill={GP.clayMineral} />
        <rect x={-20} y={yClay + 70} width={760} height={420} fill="#44403B" />

        {/* Hand-Painted Organic Roots, Twig Fragments & Fibrous Peat Texture */}
        <rect x={-20} y={topY} width={760} height={peatH + 20} fill="url(#gpPeatFibers)" opacity={0.95} />
        <rect x={-20} y={topY} width={760} height={totalH} fill="url(#gpHorizontalBrush)" opacity={0.9} />

        {/* Buried Ancient Root Networks & Organic Leaves Embedded Inside Strata */}
        <g stroke="#7B5C3F" strokeWidth={2.4} strokeLinecap="round" fill="none" opacity={0.46}>
          <path d={`M 95 ${topY + 12} Q 112 ${topY + 62}, 82 ${topY + 128}`} />
          <path d={`M 108 ${topY + 48} Q 145 ${topY + 75}, 168 ${topY + 108}`} />
          <path d={`M 595 ${topY + 16} Q 570 ${topY + 72}, 602 ${topY + 136}`} />
          <path d={`M 578 ${topY + 56} Q 535 ${topY + 86}, 508 ${topY + 114}`} />
          <path d={`M 340 ${topY + 18} Q 355 ${topY + 66}, 322 ${topY + 118}`} />
        </g>

        {/* Subtle Horizontal Sedimentary Stratum Seam Highlights */}
        <g fill="none" stroke="#9B7A54" strokeWidth={1.6} strokeOpacity={0.28}>
          <path d={`M -20 ${yHemic} Q 160 ${yHemic - 11}, 360 ${yHemic + 10} T 740 ${yHemic - 6}`} />
          <path d={`M -20 ${ySapric} Q 160 ${ySapric + 8}, 360 ${ySapric - 10} T 740 ${ySapric - 4}`} />
        </g>

        {/* === ANIMATED GROUNDWATER TABLE (MUKA AIR TANAH) === */}
        {waterTableY < bottomY - 10 && (
          <g>
            <rect
              x={-20}
              y={waterTableY}
              width={760}
              height={bottomY - waterTableY + 20}
              fill="url(#gpGroundWaterGrad)"
            />
            {showWaterLine && (
              <g>
                <path
                  d={`M -20 ${waterTableY.toFixed(1)} Q 180 ${(waterTableY - 4 + Math.sin(f * 0.08) * 3).toFixed(1)}, 360 ${(waterTableY + Math.cos(f * 0.08) * 3).toFixed(1)} T 740 ${waterTableY.toFixed(1)}`}
                  fill="none"
                  stroke="#90D8E8"
                  strokeWidth={3.2}
                  strokeDasharray="14 8"
                  opacity={0.9}
                />
              </g>
            )}
          </g>
        )}

        {/* === DESICCATION CRACKS WHEN PEAT DRIES OUT (Scene 5 & 6) === */}
        {dryness > 0.25 && (
          <g
            stroke="#1A1210"
            strokeWidth={2.4}
            strokeLinecap="round"
            fill="none"
            opacity={clamp((dryness - 0.25) * 1.35, 0, 0.88)}
          >
            {[115, 225, 345, 475, 585].map((cx, ci) => (
              <path
                key={ci}
                d={`M ${cx} ${topY} L ${cx + (ci % 2 === 0 ? -12 : 14)} ${topY + 44} L ${cx + (ci % 2 === 0 ? 8 : -10)} ${topY + 92} L ${cx - 4} ${topY + 135}`}
              />
            ))}
          </g>
        )}

        {/* === RAIN-SOAKED WET SURFACE BAND ONLY AT VERY TOP (Scene 7!) === */}
        {surfaceWetT > 0.02 && (
          <g opacity={surfaceWetT * 0.72}>
            <rect x={-20} y={topY - 4} width={760} height={46} fill="#1C5068" filter="url(#gpMistBlur)" />
            <path
              d={`M -20 ${topY + 28} Q 180 ${topY + 34}, 360 ${topY + 26} T 740 ${topY + 32}`}
              fill="none"
              stroke="#7ECAE0"
              strokeWidth={2.2}
              strokeDasharray="10 8"
              opacity={0.85}
            />
          </g>
        )}

        {/* === SCIENTIFICALLY ACCURATE FLAMELESS SUBTERRANEAN SMOULDERING COMBUSTION! === */}
        {smoulderT > 0.02 && (
          <g opacity={smoulderT}>
            {/* Dark Carbonized Ash Cavity Surrounding Glowing Smouldering Front */}
            <ellipse
              cx={smoulderCenterX}
              cy={topY + 148 + smoulderSpread * 28}
              rx={78 + smoulderSpread * 175}
              ry={44 + smoulderSpread * 64}
              fill="#181010"
              opacity={0.78}
              filter="url(#gpEmberBloom)"
            />
            {/* Creeping Horizontal & Vertical Glowing Ember Pockets (NO open flames!) */}
            {[
              { dx: 0, dy: 0, rx: 68, ry: 34, ph: 0 },
              { dx: -95 * smoulderSpread, dy: 14, rx: 56, ry: 28, ph: 1.4 },
              { dx: 98 * smoulderSpread, dy: 18, rx: 58, ry: 29, ph: 2.6 },
              { dx: -44 * smoulderSpread, dy: 48 * smoulderSpread, rx: 46, ry: 24, ph: 3.8 },
              { dx: 52 * smoulderSpread, dy: 54 * smoulderSpread, rx: 48, ry: 25, ph: 5.1 },
            ].map((eb, ei) => {
              const p = 0.86 + 0.14 * Math.sin(f * 0.14 + eb.ph);
              const ex = smoulderCenterX + eb.dx;
              const ey = topY + 142 + eb.dy;
              return (
                <g key={ei}>
                  <ellipse
                    cx={ex}
                    cy={ey}
                    rx={eb.rx * (0.75 + smoulderSpread * 0.55) * p}
                    ry={eb.ry * (0.75 + smoulderSpread * 0.48) * p}
                    fill="url(#gpEmberZoneGrad)"
                    filter="url(#gpEmberBloom)"
                  />
                  {/* Glowing Carbonized Root Veins Propagating Slowly Through Peat */}
                  <path
                    d={`M ${ex - 42} ${ey - 4} Q ${ex - 12} ${ey + 10}, ${ex + 18} ${ey - 6} T ${ex + 54} ${ey + 8}`}
                    fill="none"
                    stroke="#FFCA62"
                    strokeWidth={2.6}
                    strokeLinecap="round"
                    opacity={0.72 * p}
                  />
                </g>
              );
            })}
            {/* Pinpoint Glowing Subterranean Ember Sparks (NO cartoon fire tongues!) */}
            {Array.from({ length: 18 }).map((_, si) => {
              const angle = si * 2.15;
              const dist = (18 + (si % 5) * 32) * (0.5 + smoulderSpread * 0.9);
              const sx = smoulderCenterX + Math.cos(angle) * dist * 1.5;
              const sy = topY + 145 + Math.sin(angle) * dist * 0.55;
              const glow = 0.45 + 0.55 * Math.sin(f * 0.22 + si * 1.7);
              return (
                <circle
                  key={si}
                  cx={sx}
                  cy={sy}
                  r={1.8 + (si % 3) * 0.9}
                  fill={si % 2 === 0 ? '#FFF4B8' : '#F88A2E'}
                  opacity={glow * pulse}
                />
              );
            })}
          </g>
        )}
      </g>

      {/* Organic Mossy / Dry Surface Lip Rim Separating Forest Surface from Cutaway Depth */}
      <path
        d={`M -20 ${topY} Q 160 ${topY - 6}, 360 ${topY + 4} T 740 ${topY - 4}`}
        fill="none"
        stroke={dryness > 0.5 ? '#7A5B3A' : '#4A6E3E'}
        strokeWidth={8}
        strokeLinecap="round"
      />
      <path
        d={`M -20 ${topY + 4} Q 160 ${topY - 2}, 360 ${topY + 8} T 740 ${topY}`}
        fill="none"
        stroke="#241C1B"
        strokeWidth={1.6}
        strokeOpacity={0.75}
      />

      {/* Wispy Translucent Smouldering Smoke Curving UPWARD Through Soil Pores into Air! */}
      {smoulderT > 0.08 && (
        <g opacity={smoulderT * 0.78}>
          {Array.from({ length: 10 }).map((_, wi) => {
            const p = (f * 0.011 + wi * 0.13) % 1;
            const bx = smoulderCenterX - 135 + wi * 30 + Math.sin(p * 6 + wi) * 18;
            const by = lerp(topY + 88, topY - 240, p);
            const r = lerp(12, 46, p);
            return (
              <ellipse
                key={wi}
                cx={bx}
                cy={by}
                rx={r * 1.25}
                ry={r * 0.85}
                fill="#A8A3AA"
                opacity={Math.sin(p * Math.PI) * 0.52}
                filter="url(#gpMistBlur)"
              />
            );
          })}
        </g>
      )}
    </g>
  );
};

/** Diagonal Heavy Tropical Monsoon Rain Sheets + Surface Splash Rings (Scene 7!) */
export const TropicalMonsoonRain: React.FC<{
  f: number;
  intensity: number; // 0..1
  groundY: number;
}> = ({ f, intensity, groundY }) => {
  if (intensity <= 0.02) return null;
  return (
    <g opacity={intensity}>
      {Array.from({ length: 56 }).map((_, ri) => {
        const speed = 26 + (ri % 5) * 6;
        const baseX = ((ri * 47) % 780) - 30;
        const y = ((f * speed + ri * 97) % (groundY + 120)) - 90;
        const len = 32 + (ri % 4) * 14;
        const x = baseX - y * 0.14;
        return (
          <line
            key={ri}
            x1={x}
            y1={y}
            x2={x - len * 0.16}
            y2={y + len}
            stroke="#CEE6EC"
            strokeWidth={1.3 + (ri % 2) * 0.6}
            strokeOpacity={0.48 + (ri % 3) * 0.14}
            strokeLinecap="round"
          />
        );
      })}
      {/* Raindrop Splash Ripples on Wet Topsoil Surface */}
      {Array.from({ length: 12 }).map((_, si) => {
        const phase = (f * 0.12 + si * 0.37) % 1;
        const sx = 55 + ((si * 61) % 610);
        return (
          <ellipse
            key={`sp_${si}`}
            cx={sx}
            cy={groundY + 2}
            rx={4 + phase * 16}
            ry={1.5 + phase * 4}
            fill="none"
            stroke="#D6EEF2"
            strokeWidth={1.4}
            opacity={(1 - phase) * 0.72}
          />
        );
      })}
    </g>
  );
};
