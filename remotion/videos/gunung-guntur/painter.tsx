import React from 'react';
import { clamp, easeOutCubic, lerp, VP } from './fx';

/**
 * V2 PROCEDURAL PAINTERLY GOUACHE ENGINE (`painter.tsx`)
 * Engineered 1:1 from our 2x macro brushwork study of Danau Toba (`toba_painterly_study.jpg`):
 *  - ZERO thick black cartoon outlines on skies, clouds, mountains, hills, or volcanic ash!
 *  - Horizontal painterly dry-brush sky streaks & sunlit rock/grass brushwork textures.
 *  - True 6-layer atmospheric depth (aerial perspective haze, mist veils, volumetric sun-wrap bloom,
 *    directional warm-key vs cool-indigo shadow facets, under-lit volcanic fire glow, soft cast shadows).
 *  - 100% accurate landlocked Garut highland geography (terraced sawah, winding Sungai Cimanuk, Cipanas mist).
 */

export const PainterlyDefs: React.FC = () => (
  <defs>
    {/* Soft Atmospheric Sun & Light-Wrap Halation */}
    <filter id="ptSunBloom" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="20" />
    </filter>
    {/* Aerial Perspective Mist Veil Blur */}
    <filter id="ptMistBlur" x="-25%" y="-35%" width="150%" height="170%">
      <feGaussianBlur stdDeviation="14" />
    </filter>
    {/* Volcanic Fire / Magma Incandescent Glow */}
    <filter id="ptFireBloom" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="24" />
    </filter>
    {/* Subtle Soft Cast Shadow Blur */}
    <filter id="ptSoftShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="5" />
    </filter>
    {/* Full-Width Seamless Organic Horizontal Dry-Brush Gouache Overlay (720px span = ZERO vertical column seams!) */}
    <pattern id="ptHorizontalBrush" width="720" height="72" patternUnits="userSpaceOnUse">
      <line x1="-20" y1="5" x2="290" y2="4" stroke="#FAF2DC" strokeWidth="2.4" strokeOpacity="0.055" />
      <line x1="230" y1="10" x2="610" y2="11" stroke="#1E1820" strokeWidth="2.0" strokeOpacity="0.048" />
      <line x1="480" y1="16" x2="740" y2="15" stroke="#FAF2DC" strokeWidth="1.9" strokeOpacity="0.05" />
      <line x1="40" y1="22" x2="440" y2="23" stroke="#FAF2DC" strokeWidth="1.8" strokeOpacity="0.045" />
      <line x1="340" y1="29" x2="710" y2="28" stroke="#1E1820" strokeWidth="2.2" strokeOpacity="0.052" />
      <line x1="-10" y1="36" x2="360" y2="37" stroke="#1E1820" strokeWidth="1.7" strokeOpacity="0.042" />
      <line x1="180" y1="43" x2="590" y2="42" stroke="#FAF2DC" strokeWidth="2.1" strokeOpacity="0.05" />
      <line x1="510" y1="49" x2="740" y2="50" stroke="#1E1820" strokeWidth="1.8" strokeOpacity="0.045" />
      <line x1="70" y1="56" x2="490" y2="55" stroke="#FAF2DC" strokeWidth="2.0" strokeOpacity="0.048" />
      <line x1="290" y1="63" x2="680" y2="64" stroke="#1E1820" strokeWidth="1.9" strokeOpacity="0.048" />
      <line x1="-20" y1="68" x2="260" y2="69" stroke="#FAF2DC" strokeWidth="1.6" strokeOpacity="0.042" />
    </pattern>
  </defs>
);

/**
 * 1:1 Danau Toba Streaked Horizontal Gouache Sky with Sun Disc & Atmospheric Halation!
 */
export const PainterlySky: React.FC<{
  f: number;
  mood: 'day' | 'dusk' | 'inferno' | 'highland';
  sunX?: number;
  sunY?: number;
  sunR?: number;
  opacity?: number;
}> = ({ f, mood, sunX = 530, sunY = 445, sunR = 42, opacity = 1 }) => {
  const id = `ptSky_${mood}`;
  const drift = Math.sin(f * 0.012) * 14;

  const stops: Record<typeof mood, Array<[string, string]>> = {
    day: [
      ['0%', '#285F7A'],
      ['36%', '#5A94A6'],
      ['68%', '#BDD4C6'],
      ['100%', '#EAE2C6'],
    ],
    dusk: [
      ['0%', '#242A48'],
      ['34%', '#5A5068'],
      ['62%', '#9D7B72'],
      ['84%', '#D89E68'],
      ['100%', '#ECC386'],
    ],
    inferno: [
      ['0%', '#261420'],
      ['34%', '#5B2226'],
      ['64%', '#A83F26'],
      ['88%', '#DF772C'],
      ['100%', '#F2A642'],
    ],
    highland: [
      ['0%', '#28546E'],
      ['40%', '#628B98'],
      ['72%', '#C4CBB8'],
      ['100%', '#E8DCBC'],
    ],
  };

  // Soft horizontal painted gouache horizon bands (the exact brushstroke sky feel of Danau Toba!)
  const streaks =
    mood === 'dusk'
      ? [
          { y: 120, h: 32, col: '#484462', op: 0.35 },
          { y: 195, h: 28, col: '#786274', op: 0.32 },
          { y: 270, h: 36, col: '#A87D72', op: 0.34 },
          { y: 345, h: 30, col: '#CE9268', op: 0.36 },
          { y: 415, h: 38, col: '#E8B274', op: 0.38 },
          { y: 485, h: 34, col: '#F2CA8C', op: 0.34 },
          { y: 555, h: 28, col: '#D69F78', op: 0.28 },
        ]
      : mood === 'inferno'
        ? [
            { y: 130, h: 28, col: '#4A1E24', op: 0.42 },
            { y: 220, h: 34, col: '#842A24', op: 0.38 },
            { y: 320, h: 32, col: '#BC4C26', op: 0.36 },
            { y: 420, h: 38, col: '#E27D2C', op: 0.38 },
            { y: 515, h: 30, col: '#F2A846', op: 0.34 },
          ]
        : [
            { y: 140, h: 32, col: '#4B8296', op: 0.26 },
            { y: 230, h: 28, col: '#79AAB6', op: 0.28 },
            { y: 325, h: 34, col: '#A6C6C2', op: 0.3 },
            { y: 420, h: 36, col: '#D2DEC8', op: 0.34 },
            { y: 505, h: 32, col: '#EBE3C8', op: 0.38 },
          ];

  return (
    <g opacity={opacity}>
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="0%" y2="100%">
          {stops[mood].map(([off, col]) => (
            <stop key={off} offset={off} stopColor={col} />
          ))}
        </linearGradient>
        <radialGradient id={`${id}_sun`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FAF3D8" stopOpacity="0.96" />
          <stop offset="36%" stopColor={mood === 'dusk' ? '#F4C684' : '#F4E6C0'} stopOpacity="0.52" />
          <stop offset="100%" stopColor="#EAE2C6" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x={-40} y={-40} width={800} height={1360} fill={`url(#${id})`} />

      {/* Softly Feathered Painted Gouache Sky Brushwork Ribbons (Zero hard stripe edges!) */}
      <g filter="url(#ptMistBlur)">
        {streaks.map((s, si) => {
          const sx = (si % 2 === 0 ? -35 : 25) + drift * (si % 2 === 0 ? 1 : -0.8);
          return (
            <g key={si} opacity={s.op * 1.15}>
              <ellipse cx={360 + sx} cy={s.y} rx={460} ry={s.h * 0.72} fill={s.col} />
              <ellipse cx={155 + sx * 1.3} cy={s.y + 10} rx={270} ry={s.h * 0.52} fill={s.col} opacity={0.72} />
              <ellipse cx={575 - sx * 1.1} cy={s.y - 8} rx={260} ry={s.h * 0.48} fill={s.col} opacity={0.72} />
            </g>
          );
        })}
      </g>

      {/* Subtle Seamless Full-Width Gouache Texture across Sky */}
      <rect x={-40} y={-40} width={800} height={1360} fill="url(#ptHorizontalBrush)" opacity={0.85} />

      {/* Luminous Sun Disc + Soft Volumetric Halation Glow (day/dusk/highland) */}
      {mood !== 'inferno' && (
        <g>
          <circle cx={sunX} cy={sunY} r={sunR * 4.2} fill={`url(#${id}_sun)`} />
          <circle cx={sunX} cy={sunY} r={sunR} fill="#FAF3D8" opacity={0.94} />
        </g>
      )}
    </g>
  );
};

/**
 * 1:1 LINELESS 3-Tone Painted Gouache Cumulus Cloud (ZERO cartoon black outline!)
 */
export const LinelessGouacheCloud: React.FC<{
  x: number;
  y: number;
  scale?: number;
  tone?: 'day' | 'dusk' | 'ash' | 'inferno';
  opacity?: number;
  flip?: boolean;
}> = ({ x, y, scale = 1, tone = 'day', opacity = 1, flip = false }) => {
  const p = {
    day: { shd: '#7B8A98', mid: '#BCC5C6', lit: '#F2ECE0', rim: '#FAF5E8' },
    dusk: { shd: '#5E5674', mid: '#AD8B8A', lit: '#E8C6B0', rim: '#F8DFC6' },
    ash: { shd: '#464050', mid: '#78717E', lit: '#ABA3A4', rim: '#C6BEB8' },
    inferno: { shd: '#3E2832', mid: '#744848', lit: '#BE7A56', rim: '#F2A04A' },
  }[tone];

  return (
    <g
      transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)}) scale(${flip ? -scale : scale}, ${scale})`}
      opacity={opacity}
    >
      {/* Cool Shaded Underside Base Mass (No black outline!) */}
      <g fill={p.shd}>
        <ellipse cx={0} cy={18} rx={94} ry={22} />
        <circle cx={-66} cy={8} r={28} />
        <circle cx={-26} cy={-4} r={38} />
        <circle cx={24} cy={-2} r={35} />
        <circle cx={68} cy={10} r={26} />
      </g>
      {/* Mid Painted Gouache Volume */}
      <g fill={p.mid}>
        <ellipse cx={-2} cy={11} rx={86} ry={17} />
        <circle cx={-64} cy={3} r={24} />
        <circle cx={-24} cy={-10} r={34} />
        <circle cx={22} cy={-8} r={31} />
        <circle cx={62} cy={4} r={22} />
      </g>
      {/* Warm Sunlit Upper Gouache Crown */}
      <g fill={p.lit}>
        <circle cx={-58} cy={-2} r={19} />
        <circle cx={-22} cy={-16} r={29} />
        <circle cx={19} cy={-14} r={25} />
        <circle cx={54} cy={-1} r={17} />
        <ellipse cx={-4} cy={-2} rx={64} ry={13} />
      </g>
      {/* Delicate Warm Rim Highlight */}
      <g fill={p.rim} opacity={0.72}>
        <ellipse cx={-22} cy={-34} rx={18} ry={8} />
        <ellipse cx={18} cy={-30} rx={15} ry={6.5} />
      </g>
    </g>
  );
};

/**
 * 1:1 Danau Toba Signature Base Mist Collar (Billowing warm-peach & lavender clouds hugging the volcano foot!)
 */
export const BaseMistCollar: React.FC<{
  f: number;
  y: number;
  tone?: 'day' | 'dusk' | 'ash';
  opacity?: number;
}> = ({ f, y, tone = 'dusk', opacity = 0.94 }) => {
  const puffs = [
    { x: 25, dy: 8, s: 0.92, sp: 0.22 },
    { x: 135, dy: -6, s: 1.06, sp: -0.18 },
    { x: 255, dy: 6, s: 0.96, sp: 0.25 },
    { x: 375, dy: -4, s: 1.12, sp: -0.2 },
    { x: 495, dy: 8, s: 0.98, sp: 0.19 },
    { x: 615, dy: -6, s: 1.05, sp: -0.22 },
    { x: 715, dy: 6, s: 0.94, sp: 0.16 },
  ];
  return (
    <g opacity={opacity}>
      {/* Soft misty veil melting base seam into landscape */}
      <rect x={-40} y={y - 24} width={800} height={82} fill={tone === 'day' ? '#DDE4D6' : '#C8ABA0'} opacity={0.28} filter="url(#ptMistBlur)" />
      {puffs.map((p, i) => (
        <LinelessGouacheCloud
          key={i}
          x={p.x + Math.sin(f * 0.025 + i * 1.4) * 14 * p.sp * 4}
          y={y + p.dy}
          scale={p.s}
          tone={tone}
          flip={i % 2 === 1}
        />
      ))}
    </g>
  );
};

/**
 * 1:1 LINELESS ERODED PAINTED GOUACHE GUNUNG GUNTUR (Zero black cartoon outline! Real directional sun & cool shadow!)
 */
export const ErodedGouacheVolcano: React.FC<{
  f: number;
  cx?: number;
  baseY?: number;
  peakY?: number;
  halfW?: number;
  mode?: 'dusk' | 'inferno' | 'modern_green';
  sunFromLeft?: boolean;
  opacity?: number;
}> = ({
  f,
  cx = 360,
  baseY = 820,
  peakY = 448,
  halfW = 390,
  mode = 'dusk',
  sunFromLeft = true,
  opacity = 1,
}) => {
  const h = baseY - peakY;
  const uid = `egv_${mode}_${Math.round(cx)}_${Math.round(peakY)}`;

  // Authentic rugged double-notched Gunung Guntur silhouette (organic eroded flanks, NOT straight 4-point triangle!)
  const fullD = [
    `M ${cx - halfW} ${baseY}`,
    `L ${cx - halfW * 0.72} ${baseY - h * 0.28}`,
    `L ${cx - halfW * 0.50} ${baseY - h * 0.50}`,
    `L ${cx - halfW * 0.28} ${baseY - h * 0.78}`,
    `L ${cx - halfW * 0.12} ${peakY + h * 0.03}`,
    `L ${cx - halfW * 0.05} ${peakY}`,
    `L ${cx + halfW * 0.01} ${peakY + h * 0.05}`, // Historic central crater saddle!
    `L ${cx + halfW * 0.08} ${peakY + h * 0.01}`,
    `L ${cx + halfW * 0.16} ${peakY + h * 0.08}`,
    `L ${cx + halfW * 0.34} ${baseY - h * 0.68}`,
    `L ${cx + halfW * 0.56} ${baseY - h * 0.42}`,
    `L ${cx + halfW * 0.78} ${baseY - h * 0.20}`,
    `L ${cx + halfW} ${baseY} Z`,
  ].join(' ');

  // Directional shadow plane (cool deep shadow side carving real 3D volcanic volume!)
  const shadowD = sunFromLeft
    ? [
        `M ${cx + halfW * 0.01} ${peakY + h * 0.05}`,
        `L ${cx + halfW * 0.08} ${peakY + h * 0.01}`,
        `L ${cx + halfW * 0.16} ${peakY + h * 0.08}`,
        `L ${cx + halfW * 0.34} ${baseY - h * 0.68}`,
        `L ${cx + halfW * 0.56} ${baseY - h * 0.42}`,
        `L ${cx + halfW * 0.78} ${baseY - h * 0.20}`,
        `L ${cx + halfW} ${baseY}`,
        `L ${cx + halfW * 0.18} ${baseY}`,
        `L ${cx + halfW * 0.12} ${baseY - h * 0.44}`,
        `L ${cx + halfW * 0.05} ${baseY - h * 0.74} Z`,
      ].join(' ')
    : [
        `M ${cx - halfW} ${baseY}`,
        `L ${cx - halfW * 0.72} ${baseY - h * 0.28}`,
        `L ${cx - halfW * 0.50} ${baseY - h * 0.50}`,
        `L ${cx - halfW * 0.28} ${baseY - h * 0.78}`,
        `L ${cx - halfW * 0.12} ${peakY + h * 0.03}`,
        `L ${cx - halfW * 0.05} ${peakY}`,
        `L ${cx - halfW * 0.03} ${baseY - h * 0.68}`,
        `L ${cx - halfW * 0.14} ${baseY - h * 0.38}`,
        `L ${cx - halfW * 0.22} ${baseY} Z`,
      ].join(' ');

  const pal = {
    dusk: {
      litTop: '#C9AB92',
      litBot: '#947B6E',
      shdTop: '#5E5770',
      shdBot: '#3E3A50',
      gully: '#7A645E',
      scar: '#5B4C4F',
      rim: '#F8DFBC',
    },
    inferno: {
      litTop: '#9A634C',
      litBot: '#5A3A36',
      shdTop: '#4A3138',
      shdBot: '#2C1E24',
      gully: '#422B2E',
      scar: '#D85E24',
      rim: '#F8A852',
    },
    modern_green: {
      litTop: '#769854',
      litBot: '#4E7242',
      shdTop: '#416146',
      shdBot: '#2D483A',
      gully: '#3E5B3A',
      scar: '#968768', // Authentic Gunung Guntur barren savanna/volcanic rock scar!
      rim: '#E4ECC2',
    },
  }[mode];

  return (
    <g opacity={opacity}>
      <defs>
        <linearGradient id={`${uid}_lit`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={pal.litTop} />
          <stop offset="100%" stopColor={pal.litBot} />
        </linearGradient>
        <linearGradient id={`${uid}_shd`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={pal.shdTop} />
          <stop offset="100%" stopColor={pal.shdBot} />
        </linearGradient>
        <clipPath id={`${uid}_clip`}>
          <path d={fullD} />
        </clipPath>
      </defs>

      {/* Main Eroded Gouache Mass (Lineless!) */}
      <path d={fullD} fill={`url(#${uid}_lit)`} />

      <g clipPath={`url(#${uid}_clip)`}>
        {/* Carved Volcanic Erosion Gullies & Painted Sub-Ridges */}
        <path
          d={`M ${cx - halfW * 0.05} ${peakY + 12} L ${cx - halfW * 0.16} ${baseY - h * 0.45} L ${cx - halfW * 0.36} ${baseY} L ${cx - halfW * 0.24} ${baseY} L ${cx - halfW * 0.08} ${baseY - h * 0.48} Z`}
          fill={pal.gully}
          opacity={0.42}
        />
        <path
          d={`M ${cx - halfW * 0.12} ${peakY + 24} L ${cx - halfW * 0.34} ${baseY - h * 0.38} L ${cx - halfW * 0.62} ${baseY} L ${cx - halfW * 0.48} ${baseY} L ${cx - halfW * 0.24} ${baseY - h * 0.42} Z`}
          fill={pal.gully}
          opacity={0.3}
        />

        {/* Iconic Historic Volcanic Lava-Field Scar on Guntur's Upper Flank */}
        <path
          d={`M ${cx - halfW * 0.06} ${peakY + 14} L ${cx + halfW * 0.06} ${peakY + 18} L ${cx + halfW * 0.14} ${baseY - h * 0.48} L ${cx + halfW * 0.02} ${baseY - h * 0.38} L ${cx - halfW * 0.09} ${baseY - h * 0.50} Z`}
          fill={pal.scar}
          opacity={mode === 'modern_green' ? 0.56 : 0.32}
        />

        {/* Cool Directional Shadow Facet */}
        <path d={shadowD} fill={`url(#${uid}_shd)`} />

        {/* Visible Horizontal Gouache Dry-Brush Texture Painted Across Entire Mountain */}
        <rect x={cx - halfW} y={peakY - 10} width={halfW * 2} height={h + 20} fill="url(#ptHorizontalBrush)" opacity={0.95} />

        {/* Subtle Inferno Fire Bounce Lighting onto Slopes near Summit */}
        {mode === 'inferno' && (
          <ellipse cx={cx} cy={peakY + 15} rx={halfW * 0.42} ry={h * 0.34} fill="#F89032" opacity={0.42 + Math.sin(f * 0.2) * 0.06} filter="url(#ptFireBloom)" />
        )}

        {/* Warm Sun-Wrap Rim Highlight along Sunlit Slope */}
        <path
          d={
            sunFromLeft
              ? `M ${cx - halfW} ${baseY} L ${cx - halfW * 0.50} ${baseY - h * 0.50} L ${cx - halfW * 0.12} ${peakY + h * 0.03} L ${cx - halfW * 0.05} ${peakY}`
              : `M ${cx + halfW} ${baseY} L ${cx + halfW * 0.56} ${baseY - h * 0.42} L ${cx + halfW * 0.16} ${peakY + h * 0.08} L ${cx + halfW * 0.08} ${peakY + h * 0.01}`
          }
          fill="none"
          stroke={pal.rim}
          strokeWidth={5.5}
          strokeLinecap="round"
          opacity={0.44}
        />
      </g>
    </g>
  );
};

/**
 * 1:1 LINELESS PAINTERLY VOLCANIC ERUPTION PLUME + TWIN PYROCLASTIC FLOWS + EMBERS + LIGHTNING!
 * Matches Panel 3 of `toba_painterly_study.jpg` (zero black circle rings!).
 */
export const LinelessEruptionPlume: React.FC<{
  f: number;
  cx: number;
  ventY: number;
  rise: number; // 0..1
  widthScale?: number;
  showPyroclastic?: boolean;
  showLightning?: boolean;
}> = ({ f, cx, ventY, rise, widthScale = 1, showPyroclastic = true, showLightning = true }) => {
  if (rise <= 0.01) return null;
  const maxH = 650 * rise;
  const boltOn = showLightning && rise > 0.4 && (f % 17 === 0 || f % 17 === 1 || f % 29 === 7);

  // Deterministic multi-cluster billowing ash clouds (back shadow layer -> mid grey -> warm lit rim -> fiery underglow!)
  const tiers = 14;
  return (
    <g>
      {/* Huge Warm Orange-Gold Fire Glow Illuminating Sky & Smoke Underside */}
      <ellipse cx={cx} cy={ventY - 20} rx={210 * widthScale} ry={145} fill="#F68C2E" opacity={0.62 * rise} filter="url(#ptFireBloom)" />
      <ellipse cx={cx} cy={ventY - 8} rx={110 * widthScale} ry={70} fill="#FFF2A8" opacity={0.78 * rise} filter="url(#ptMistBlur)" />

      {/* Main Towering Billowing Ash Plume (Lineless 4-Tone Gouache!) */}
      {Array.from({ length: tiers }).map((_, i) => {
        const u = i / (tiers - 1);
        const py = ventY - 12 - u * maxH - Math.sin(f * 0.09 + i * 1.2) * 8;
        const sway = Math.sin(u * 4.0 - f * 0.05 + i * 0.8) * (16 + u * 34);
        const r = (34 + Math.pow(u, 0.82) * 74 + Math.sin(i * 2.7 + f * 0.07) * 10) * widthScale;
        const px = cx + sway;
        const lOff = -r * (0.58 + 0.14 * Math.sin(i * 1.9));
        const rOff = r * (0.62 + 0.16 * Math.cos(i * 2.3));
        return (
          <g key={i}>
            {/* Deep Cool Shadow Lobes (Right & Back) */}
            <circle cx={px + rOff} cy={py + 8} r={r * 0.84} fill="#3E3746" />
            <circle cx={px + rOff * 0.45} cy={py + 16} r={r * 0.78} fill="#4F4758" />
            {/* Main Mid-Ash Painted Body */}
            <circle cx={px + lOff} cy={py + 4} r={r * 0.82} fill="#6E6674" />
            <circle cx={px} cy={py} r={r * 0.94} fill="#827A84" />
            {/* Warm Lit Upper-Left Gouache Cap */}
            <circle cx={px + lOff * 0.78 - 6} cy={py - r * 0.24} r={r * 0.56} fill="#ACA4A2" opacity={0.86} />
            <circle cx={px - r * 0.22} cy={py - r * 0.28} r={r * 0.52} fill="#BEB6B0" opacity={0.78} />
            {/* Fiery Orange Crater Bounce Reflection on Lower Column Undersides! */}
            {u < 0.48 && (
              <ellipse
                cx={px}
                cy={py + r * 0.42}
                rx={r * 0.82}
                ry={r * 0.34}
                fill={u < 0.2 ? '#FFB852' : '#E8742E'}
                opacity={(0.48 - u) * 1.65}
              />
            )}
          </g>
        );
      })}

      {/* 1:1 Danau Toba Lineless Billowing Cauliflower Pyroclastic Flows Racing Down Both Slopes (Zero uniform bead chains!) */}
      {showPyroclastic && (
        <g>
          {/* Soft dusty turbulent skirt hugging both volcano flanks */}
          <path
            d={`M ${cx - 28} ${ventY + 26} Q ${cx - 175} ${ventY + 135}, ${cx - 355} ${ventY + 295} L ${cx - 385} ${ventY + 320} Q ${cx - 195} ${ventY + 195}, ${cx - 48} ${ventY + 65} Z`}
            fill="#564C5A"
            opacity={0.46 * rise}
            filter="url(#ptMistBlur)"
          />
          <path
            d={`M ${cx + 28} ${ventY + 26} Q ${cx + 175} ${ventY + 135}, ${cx + 355} ${ventY + 295} L ${cx + 385} ${ventY + 320} Q ${cx + 195} ${ventY + 195}, ${cx + 48} ${ventY + 65} Z`}
            fill="#483F4E"
            opacity={0.46 * rise}
            filter="url(#ptMistBlur)"
          />
          {Array.from({ length: 11 }).map((_, bi) => {
            const u = clamp(rise * 1.18 - bi * 0.072, 0, 1);
            if (u <= 0.02) return null;
            const jitterA = Math.sin(bi * 4.7 + 1.1);
            const jitterB = Math.cos(bi * 3.9 + 0.6);
            const lx = lerp(cx - 28, cx - 350, u) + jitterA * (12 + u * 16) + Math.sin(f * 0.09 + bi) * 5;
            const rx = lerp(cx + 28, cx + 350, u) + jitterB * (12 + u * 16) + Math.cos(f * 0.09 + bi) * 5;
            const py = lerp(ventY + 20, ventY + 292, u) + jitterA * 9;
            const baseR = (16 + u * 36) * (0.82 + 0.34 * Math.abs(jitterB));
            const subR = baseR * (0.64 + 0.2 * Math.abs(jitterA));
            return (
              <g key={`pyro_${bi}`}>
                {/* Left slope multi-lobe organic cauliflower billow */}
                <ellipse cx={lx + 8} cy={py + 10} rx={baseR * 1.12} ry={baseR * 0.84} fill="#443C4B" />
                <circle cx={lx - baseR * 0.48} cy={py + 4} r={subR} fill="#5C5364" />
                <circle cx={lx} cy={py - 2} r={baseR * 0.88} fill="#7B737E" />
                <circle cx={lx + baseR * 0.36} cy={py - 8} r={subR * 0.78} fill="#968E94" />
                <ellipse cx={lx - baseR * 0.14} cy={py - baseR * 0.28} rx={baseR * 0.62} ry={baseR * 0.38} fill="#BEB6B0" opacity={0.86} />
                {u < 0.32 && <ellipse cx={lx} cy={py + baseR * 0.22} rx={baseR * 0.66} ry={baseR * 0.28} fill="#E67A30" opacity={(0.32 - u) * 1.4} />}
                {/* Right slope multi-lobe organic cauliflower billow */}
                <ellipse cx={rx - 8} cy={py + 10} rx={baseR * 1.12} ry={baseR * 0.84} fill="#3E3646" />
                <circle cx={rx + baseR * 0.48} cy={py + 4} r={subR} fill="#544C5C" />
                <circle cx={rx} cy={py - 2} r={baseR * 0.88} fill="#736B78" />
                <circle cx={rx - baseR * 0.36} cy={py - 8} r={subR * 0.78} fill="#8E868E" />
                <ellipse cx={rx + baseR * 0.14} cy={py - baseR * 0.28} rx={baseR * 0.6} ry={baseR * 0.36} fill="#B2ABA6" opacity={0.82} />
                {u < 0.32 && <ellipse cx={rx} cy={py + baseR * 0.22} rx={baseR * 0.66} ry={baseR * 0.28} fill="#E67A30" opacity={(0.32 - u) * 1.4} />}
              </g>
            );
          })}
        </g>
      )}

      {/* Floating Glowing Orange Volcanic Embers in Smoky Sky */}
      {Array.from({ length: 24 }).map((_, ei) => {
        const p = ((f * 0.016 + ei * 0.17) % 1);
        const ex = cx + Math.sin(ei * 4.3) * 320 + Math.cos(p * 6 + ei) * 28;
        const ey = ventY + 40 - p * 540;
        return (
          <circle
            key={`emb_${ei}`}
            cx={ex}
            cy={ey}
            r={1.8 + (ei % 3) * 1.1}
            fill={ei % 2 === 0 ? '#FFE898' : '#F6842A'}
            opacity={Math.sin(p * Math.PI) * 0.85 * rise}
          />
        );
      })}

      {/* Sharp 1-2 Frame White Volcanic Lightning */}
      {boltOn && (
        <g>
          <path
            d={`M ${cx - 18} ${ventY - maxH * 0.92} L ${cx - 48} ${ventY - maxH * 0.72} L ${cx - 14} ${ventY - maxH * 0.54} L ${cx - 54} ${ventY - maxH * 0.34} L ${cx - 16} ${ventY - maxH * 0.16}`}
            fill="none"
            stroke="#FFE6A4"
            strokeWidth={9}
            strokeLinejoin="round"
            opacity={0.46}
          />
          <path
            d={`M ${cx - 18} ${ventY - maxH * 0.92} L ${cx - 48} ${ventY - maxH * 0.72} L ${cx - 14} ${ventY - maxH * 0.54} L ${cx - 54} ${ventY - maxH * 0.34} L ${cx - 16} ${ventY - maxH * 0.16}`}
            fill="none"
            stroke="#FFFBF2"
            strokeWidth={2.8}
            strokeLinejoin="round"
          />
        </g>
      )}
    </g>
  );
};

/**
 * 1:1 Danau Toba Panel 4 ORGANIC WAVY STRATIFIED MAGMA CUTAWAY!
 * Features undulating irregular hand-painted sedimentary rock bands, horizontal dry-brush strata grain,
 * central dark depth shadow behind conduit, incandescent stippled magma glow, and crisp outlined upward arrows!
 */
export const OrganicCutawayStrata: React.FC<{
  f: number;
  magmaRise: number; // 0..1
}> = ({ f, magmaRise }) => {
  const pulse = 0.92 + 0.08 * Math.sin(f * 0.18);
  const volD = 'M -30 785 C 75 705, 165 625, 245 520 C 285 468, 310 432, 326 414 L 394 414 C 412 434, 438 470, 478 524 C 558 630, 645 705, 750 785 L 750 1280 L -30 1280 Z';

  return (
    <g>
      <defs>
        <clipPath id="ptCutVolcClip">
          <path d={volD} />
        </clipPath>
        <radialGradient id="ptMagmaPool" cx="50%" cy="68%" r="58%">
          <stop offset="0%" stopColor="#FFF6B8" />
          <stop offset="38%" stopColor="#F8982C" />
          <stop offset="76%" stopColor="#C8381E" />
          <stop offset="100%" stopColor="#4A1614" />
        </radialGradient>
        <linearGradient id="ptCenterCavityShade" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1E1212" stopOpacity="0" />
          <stop offset="40%" stopColor="#1E1212" stopOpacity="0.34" />
          <stop offset="50%" stopColor="#1E1212" stopOpacity="0.46" />
          <stop offset="60%" stopColor="#1E1212" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#1E1212" stopOpacity="0" />
        </linearGradient>
      </defs>

      <g clipPath="url(#ptCutVolcClip)">
        {/* Base Layer 1: Warm Terracotta Topsoil (#9C5B38) */}
        <rect x={-30} y={400} width={780} height={880} fill="#9C5B38" />

        {/* Organic Undulating Wavy Sedimentary Band 2: Ochre Sandstone (#C88248) */}
        <path
          d="M -30 822 C 95 752, 188 665, 272 558 C 318 500, 342 482, 360 478 C 380 484, 408 508, 456 566 C 542 672, 632 745, 750 818 L 750 1280 L -30 1280 Z"
          fill="#C88248"
        />

        {/* Organic Wavy Band 3: Warm Cream Limestone (#E2C79D) */}
        <path
          d="M -30 878 C 98 815, 195 728, 282 624 C 324 574, 344 558, 360 554 C 378 560, 412 586, 464 640 C 552 732, 636 806, 750 874 L 750 1280 L -30 1280 Z"
          fill="#E2C79D"
        />

        {/* Organic Wavy Band 4: Deep Clay Umber (#7A4B2E) */}
        <path
          d="M -30 946 C 102 890, 205 812, 294 714 C 330 676, 346 664, 360 662 C 378 666, 415 692, 470 738 C 562 818, 642 882, 750 940 L 750 1280 L -30 1280 Z"
          fill="#7A4B2E"
        />

        {/* Organic Wavy Band 5: Deep Bedrock Umber (#4E2F22) */}
        <path
          d="M -30 1010 C 120 968, 225 918, 360 880 C 495 918, 610 968, 750 1006 L 750 1280 L -30 1280 Z"
          fill="#4E2F22"
        />
        <rect x={-30} y={1035} width={780} height={260} fill="#36211A" />

        {/* Visible Horizontal Gouache Brushwork & Sedimentary Grain Across All Strata */}
        <rect x={-30} y={400} width={780} height={880} fill="url(#ptHorizontalBrush)" opacity={1} />
        <g stroke="#241614" strokeOpacity={0.18} strokeWidth={1.3}>
          {Array.from({ length: 36 }).map((_, i) => (
            <line key={i} x1={0} y1={430 + i * 20} x2={720} y2={430 + i * 20} strokeDasharray={i % 2 === 0 ? '64 18 28 14' : '36 16 58 20'} />
          ))}
        </g>

        {/* Central Vertical Depth Shading Behind Conduit (exact Panel 4 Danau Toba depth!) */}
        <rect x={235} y={410} width={250} height={490} fill="url(#ptCenterCavityShade)" />
      </g>

      {/* Delicate Natural Sepia Contour ONLY on Outer Cutaway Silhouette (thin 1.8px, NOT thick cartoon black!) */}
      <path d={volD} fill="none" stroke="#2C1D1A" strokeWidth={1.8} strokeOpacity={0.78} />

      {/* Glowing Ambient Bounce Bleeding from Magma Chamber onto Lower Rock */}
      <ellipse cx={360} cy={890} rx={255} ry={108} fill="#F48A28" opacity={0.28 * pulse} filter="url(#ptFireBloom)" />

      {/* Underground Ellipsoid Magma Chamber (1:1 Panel 4 Danau Toba!) */}
      <g transform="translate(360, 888)">
        <ellipse cx={0} cy={0} rx={218} ry={68} fill="#251314" stroke="#2B1917" strokeWidth={2.0} />
        <clipPath id="ptChamberClip">
          <ellipse cx={0} cy={0} rx={215} ry={65} />
        </clipPath>
        <g clipPath="url(#ptChamberClip)">
          <rect x={-225} y={lerp(28, -36, magmaRise)} width={450} height={140} fill="url(#ptMagmaPool)" />
          {/* Incandescent surface glow band */}
          <ellipse cx={0} cy={lerp(28, -36, magmaRise)} rx={206} ry={16} fill="#FFF5BA" opacity={0.72 * pulse} />
          {/* Stippled glowing magma ember texture inside chamber */}
          {Array.from({ length: 18 }).map((_, mi) => (
            <circle
              key={mi}
              cx={Math.sin(mi * 3.7) * 165}
              cy={lerp(36, -10, magmaRise) + (mi % 4) * 14}
              r={2.2 + (mi % 3)}
              fill="#FFF8CC"
              opacity={0.48 + 0.3 * Math.sin(f * 0.22 + mi)}
            />
          ))}
        </g>
      </g>

      {/* Sinuous Incandescent Magma Conduit Rising to Crater Lip with Soft Radiance */}
      <path
        d="M 360 852 C 348 765, 374 685, 355 600 C 342 528, 370 472, 360 414"
        fill="none"
        stroke="#F68A28"
        strokeWidth={34}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray="1"
        strokeDashoffset={1 - magmaRise}
        opacity={0.34}
        filter="url(#ptSoftShadow)"
      />
      <path
        d="M 360 852 C 348 765, 374 685, 355 600 C 342 528, 370 472, 360 414"
        fill="none"
        stroke="#C8341E"
        strokeWidth={22}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray="1"
        strokeDashoffset={1 - magmaRise}
      />
      <path
        d="M 360 852 C 348 765, 374 685, 355 600 C 342 528, 370 472, 360 414"
        fill="none"
        stroke="#F8982C"
        strokeWidth={13}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray="1"
        strokeDashoffset={1 - magmaRise}
      />
      <path
        d="M 360 852 C 348 765, 374 685, 355 600 C 342 528, 370 472, 360 414"
        fill="none"
        stroke="#FFF6BC"
        strokeWidth={5}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray="1"
        strokeDashoffset={1 - magmaRise}
      />

      {/* 1:1 Danau Toba Crisp Outlined White Upward Pressure Arrows (↑ ↑ ↑) */}
      {[-48, 0, 48].map((ax, ai) => {
        const bob = (f * 1.45 + ai * 8) % 24;
        return (
          <g key={ai} transform={`translate(${360 + ax}, ${896 - bob})`} opacity={clamp(magmaRise * 1.5, 0, 1) * (1 - bob / 28)}>
            <polygon points="0,-22 12,-4 5,-4 5,18 -5,18 -5,-4 -12,-4" fill="#FAF4E6" stroke="#241C1B" strokeWidth={1.8} strokeLinejoin="round" />
          </g>
        );
      })}
    </g>
  );
};

/**
 * 100% REAL LANDLOCKED GARUT HIGHLAND LANDSCAPE (ZERO OCEAN!!):
 *  - Aerial-perspective misty Priangan ranges
 *  - Emerald-gold curving Garut terraced rice paddies (sawah terasering)
 *  - Delicate winding inland Sungai Cimanuk stream glinting in the valley
 *  - Gentle rising warm thermal mist wisps from Cipanas Garut
 *  - Hand-painted Garut highland pine + slender bamboo on left & Sunda saung pavilion on right!
 */
export const GarutHighlandValley: React.FC<{
  f: number;
  greenT: number; // 0 = historic sepia/ash, 1 = lush modern sunlit Garut
  pullOutT: number; // 0..1 foreground reveal
}> = ({ f, greenT, pullOutT }) => {
  const treeSway = Math.sin(f * 0.05) * 1.5;

  return (
    <g>
      <defs>
        <linearGradient id="ptSawahFar" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={greenT > 0.4 ? '#8EA878' : '#8A7664'} />
          <stop offset="100%" stopColor={greenT > 0.4 ? '#63844E' : '#6A584C'} />
        </linearGradient>
        <linearGradient id="ptSawahMid" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={greenT > 0.4 ? '#6B8B46' : '#645448'} />
          <stop offset="100%" stopColor={greenT > 0.4 ? '#4B6B36' : '#4A3C36'} />
        </linearGradient>
        <linearGradient id="ptSawahFore" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={greenT > 0.4 ? '#527338' : '#4C3E38'} />
          <stop offset="100%" stopColor={greenT > 0.4 ? '#324B27' : '#2E2524'} />
        </linearGradient>
      </defs>

      {/* LAYER 1: Pale Misty Aerial-Perspective Priangan Valley Mist Veil */}
      <rect x={-40} y={670} width={800} height={115} fill="#E6E4D2" opacity={0.44 * greenT} filter="url(#ptMistBlur)" />

      {/* LAYER 2: Rolling Garut Highland Valley Foothills + Sunlit Terraced Rice Paddies (Sawah Terasering!) */}
      <path d="M -60 738 Q 160 712, 365 734 T 780 722 L 780 1280 L -60 1280 Z" fill="url(#ptSawahFar)" />

      {/* Curved Sawah Terasering Contour Steps catching Warm Morning Sunlight! */}
      <g opacity={0.85}>
        <path d="M -40 778 Q 175 748, 360 778 T 760 765 L 760 1280 L -40 1280 Z" fill={greenT > 0.4 ? '#759352' : '#746050'} />
        <path d="M -40 822 Q 210 788, 410 824 T 760 808 L 760 1280 L -40 1280 Z" fill="url(#ptSawahMid)" />
        <path d="M -40 874 Q 180 842, 390 882 T 760 860 L 760 1280 L -40 1280 Z" fill={greenT > 0.4 ? '#5E7E40' : '#58483E'} />
        <path d="M -40 936 Q 230 902, 460 946 T 760 924 L 760 1280 L -40 1280 Z" fill="url(#ptSawahFore)" />
        {/* Warm sunlit terrace rim highlights & painterly horizontal brushwork */}
        <g fill="none" stroke={greenT > 0.4 ? '#B6CA84' : '#B89C7C'} strokeWidth={2.2} strokeOpacity={0.55}>
          <path d="M -40 778 Q 175 748, 360 778 T 760 765" />
          <path d="M -40 822 Q 210 788, 410 824 T 760 808" />
          <path d="M -40 874 Q 180 842, 390 882 T 760 860" />
          <path d="M -40 936 Q 230 902, 460 946 T 760 924" />
        </g>
      </g>

      {/* Graceful Perspective-Tapering Painted Inland Sungai Cimanuk (Sky-reflected gouache water + soft horizontal reflections, ZERO highway dashes!) */}
      <g opacity={0.86 * greenT}>
        <defs>
          <linearGradient id="ptCimanukWater" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#94C0C4" />
            <stop offset="45%" stopColor="#659BA6" />
            <stop offset="100%" stopColor="#3F7486" />
          </linearGradient>
        </defs>
        {/* Warm sunlit muddy riverbank lip */}
        <path
          d="M 416 734 C 378 756, 304 772, 336 804 C 370 838, 456 854, 392 898 C 330 940, 224 995, 294 1098 C 332 1154, 396 1218, 362 1290 L 306 1290 C 344 1218, 282 1152, 248 1094 C 188 994, 298 934, 358 892 C 414 854, 344 834, 314 802 C 288 774, 366 756, 408 734 Z"
          fill="#8BA66A"
          opacity={0.75}
        />
        {/* Main tapering sky-reflected water body */}
        <path
          d="M 414 734 C 376 756, 308 772, 340 804 C 372 836, 452 854, 388 898 C 328 940, 228 995, 296 1096 C 334 1152, 392 1216, 358 1290 L 314 1290 C 348 1216, 288 1150, 256 1092 C 198 994, 304 934, 362 892 C 418 854, 348 834, 318 802 C 292 774, 368 756, 409 734 Z"
          fill="url(#ptCimanukWater)"
        />
        {/* Soft Horizontal Painted Water Glints (matching Danau Toba calm gouache ripples!) */}
        <g stroke="#E6F0E8" strokeLinecap="round" opacity={0.52}>
          <line x1={322 + Math.sin(f * 0.05) * 3} y1={794} x2={342 + Math.sin(f * 0.05) * 3} y2={794} strokeWidth={1.8} />
          <line x1={374 - Math.sin(f * 0.04) * 4} y1={858} x2={406 - Math.sin(f * 0.04) * 4} y2={858} strokeWidth={2.0} />
          <line x1={334 + Math.sin(f * 0.05) * 4} y1={912} x2={372 + Math.sin(f * 0.05) * 4} y2={912} strokeWidth={2.2} />
          <line x1={262 - Math.sin(f * 0.04) * 4} y1={978} x2={304 - Math.sin(f * 0.04) * 4} y2={978} strokeWidth={2.4} />
          <line x1={238 + Math.sin(f * 0.05) * 4} y1={1046} x2={284 + Math.sin(f * 0.05) * 4} y2={1046} strokeWidth={2.4} />
          <line x1={288 - Math.sin(f * 0.04) * 5} y1={1138} x2={336 - Math.sin(f * 0.04) * 5} y2={1138} strokeWidth={2.6} />
          <line x1={326 + Math.sin(f * 0.05) * 5} y1={1224} x2={372 + Math.sin(f * 0.05) * 5} y2={1224} strokeWidth={2.8} />
        </g>
      </g>

      {/* Delicate Rising Warm Thermal Mist Wisps from Cipanas Garut Hot-Spring Foothills */}
      {greenT > 0.35 &&
        [195, 285, 455].map((mx, mi) => {
          const p = (f * 0.008 + mi * 0.33) % 1;
          return (
            <ellipse
              key={mi}
              cx={mx + Math.sin(p * 4 + mi) * 18}
              cy={755 - p * 48}
              rx={52 + p * 26}
              ry={12 + p * 8}
              fill="#F2EFE2"
              opacity={Math.sin(p * Math.PI) * 0.34 * greenT}
              filter="url(#ptMistBlur)"
            />
          );
        })}

      {/* Painterly Horizontal Brushwork Texture across All Valley Hills */}
      <rect x={-40} y={715} width={800} height={565} fill="url(#ptHorizontalBrush)" opacity={0.9} />

      {/* LAYER 4: RIGHT FOREGROUND TERRACED HILLSIDE + TRADITIONAL SUNDANESE SAUNG PAVILION (With Soft Cast Shadow!) */}
      <g transform={`translate(${lerp(95, 0, pullOutT).toFixed(1)}, 0)`}>
        <path d="M 425 1280 Q 478 1035, 565 892 L 760 868 L 760 1280 Z" fill="#466634" />
        <path d="M 468 1280 Q 515 1048, 595 908 L 760 886 L 760 1280 Z" fill="#5A7C3E" />
        {/* Dappled grass & sunlit meadow strokes */}
        <g stroke="#8CAE5C" strokeWidth={2.2} strokeOpacity={0.48} strokeLinecap="round">
          <line x1={535} y1={965} x2={595} y2={955} />
          <line x1={575} y1={1020} x2={645} y2={1010} />
          <line x1={515} y1={1085} x2={585} y2={1075} />
        </g>

        {/* Soft Cast Shadow beneath Sundanese Saung Pavilion */}
        <ellipse cx={612} cy={922} rx={62} ry={14} fill="#1E2C1A" opacity={0.42} filter="url(#ptSoftShadow)" />

        {/* Traditional Sunda Julang Ngapak Saung Pavilion (Delicate Ink Accents ONLY on Architecture!) */}
        <g transform="translate(618, 886)">
          <line x1={-28} y1={12} x2={-28} y2={34} stroke="#4C3324" strokeWidth={4} />
          <line x1={28} y1={12} x2={28} y2={34} stroke="#4C3324" strokeWidth={4} />
          <rect x={-34} y={-22} width={68} height={36} fill="#6E4A34" stroke="#2C1E1A" strokeWidth={1.4} />
          <rect x={-20} y={-10} width={15} height={15} fill="#F4D896" />
          <rect x={6} y={-10} width={15} height={15} fill="#F4D896" />
          {/* Warm lantern glow spilling from saung */}
          <circle cx={0} cy={-2} r={28} fill="#FFE6A4" opacity={0.22} filter="url(#ptSoftShadow)" />
          {/* Sweeping Sunda Julang Ngapak Crimson Roof */}
          <path d="M -68 -18 Q -24 -38, 0 -74 Q 24 -38, 68 -18 L 44 -18 L 0 -52 L -44 -18 Z" fill="#A63226" stroke="#2C1E1A" strokeWidth={1.5} />
          <path d="M -46 -18 L 0 -54 L 46 -18 Z" fill="#7D241C" />
          <line x1={-32} y1={-18} x2={32} y2={-18} stroke="#F6EAD2" strokeWidth={2} strokeDasharray="5 4" />
        </g>
      </g>

      {/* LAYER 5: LEFT FOREGROUND ORGANIC HAND-PAINTED GARUT PINE TREE & BAMBOO + WILDFLOWERS */}
      <g transform={`translate(${lerp(-110, 0, pullOutT).toFixed(1)}, 0) translate(88, 1280) rotate(${treeSway.toFixed(2)}) translate(-88, -1280)`}>
        {/* Curved Foreground Grassy Bank */}
        <path d="M -25 1095 Q 108 1068, 228 1126 L 258 1280 L -25 1280 Z" fill="#3C592C" />
        <path d="M -25 1118 Q 95 1095, 205 1148 L 228 1280 L -25 1280 Z" fill="#4C6E36" />
        {/* Soft Cast Shadow on Ground from Pine Tree */}
        <ellipse cx={112} cy={1128} rx={78} ry={16} fill="#1E2E1A" opacity={0.44} filter="url(#ptSoftShadow)" />

        {/* Slender Swaying Garut Bamboo Stalks Behind Pine */}
        <g stroke="#5C7A42" strokeWidth={4.2} strokeLinecap="round" opacity={0.85}>
          <path d="M 38 1125 Q 24 940, 42 780" fill="none" />
          <path d="M 54 1128 Q 44 960, 62 820" fill="none" stroke="#476234" strokeWidth={3.4} />
        </g>

        {/* Textured Natural Trunk with Warm Sunlit Right Bark Edge */}
        <path d="M 76 1135 L 82 615 L 94 615 L 103 1135 Z" fill="#523828" />
        <path d="M 90 1135 L 90 615 L 94 615 L 103 1135 Z" fill="#76563E" opacity={0.7} />
        <g stroke="#463022" strokeWidth={5.2} strokeLinecap="round">
          <line x1={88} y1={685} x2={152} y2={662} />
          <line x1={88} y1={748} x2={34} y2={728} />
          <line x1={88} y1={812} x2={162} y2={792} />
          <line x1={88} y1={875} x2={42} y2={858} />
        </g>

        {/* Painterly Multi-Tufted Sunlit Pine Canopy Clusters (1:1 Danau Toba upper-left organic botanical gouache!) */}
        {[
          { x: 90, y: 604, s: 1.02, flip: false },
          { x: 152, y: 658, s: 1.12, flip: true },
          { x: 48, y: 720, s: 0.96, flip: false },
          { x: 158, y: 788, s: 1.18, flip: true },
          { x: 54, y: 856, s: 1.02, flip: false },
        ].map((cl, ci) => (
          <g key={ci} transform={`translate(${cl.x}, ${cl.y}) scale(${cl.flip ? -cl.s : cl.s}, ${cl.s})`}>
            {/* Deep forest underside shadow lobes (lineless!) */}
            <g fill="#253A22">
              <ellipse cx={-38} cy={12} rx={30} ry={12} />
              <ellipse cx={4} cy={14} rx={38} ry={13} />
              <ellipse cx={42} cy={10} rx={26} ry={11} />
              <circle cx={-16} cy={-4} r={22} />
              <circle cx={18} cy={-6} r={24} />
            </g>
            {/* Mid painted pine foliage tufts */}
            <g fill="#456A36">
              <ellipse cx={-36} cy={6} rx={25} ry={10} />
              <ellipse cx={4} cy={7} rx={34} ry={11} />
              <ellipse cx={38} cy={5} rx={22} ry={9} />
              <circle cx={-14} cy={-9} r={19} />
              <circle cx={18} cy={-11} r={20} />
              <circle cx={-42} cy={-2} r={14} />
            </g>
            {/* Warm sunlit upper pine gouache highlights */}
            <g fill="#739B52">
              <ellipse cx={-14} cy={-16} rx={15} ry={9} />
              <ellipse cx={18} cy={-18} rx={16} ry={9} />
              <ellipse cx={40} cy={-3} rx={14} ry={6} />
              <ellipse cx={-38} cy={-6} rx={12} ry={6} />
            </g>
            {/* Golden morning sun rim accent */}
            <ellipse cx={16} cy={-24} rx={10} ry={4} fill="#A4C276" opacity={0.78} />
          </g>
        ))}

        {/* Warm Vintage Wildflowers Dotted Along Meadow */}
        {[38, 76, 128, 164, 188].map((fx, fi) => (
          <g key={fi} transform={`translate(${fx}, ${1152 + (fi % 3) * 18})`}>
            <circle cx={0} cy={0} r={5.2} fill={fi % 2 === 0 ? '#E67A34' : '#F6D458'} />
            <circle cx={-1} cy={-1} r={2} fill="#FFF4CC" />
          </g>
        ))}
      </g>
    </g>
  );
};
