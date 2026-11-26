import React from 'react';
import { hash01 } from './tokens';
import { useLightingRig } from './LightingRig';

// =============================================================================
// 1. ORGANIC PAINTED TREES & BOTANICAL FRAMING (ZERO FLAT BLOB ELLIPSES!)
// =============================================================================

export type TreeSpecies = 'tropical' | 'savanna_acacia' | 'conifer' | 'dead_gnarled' | 'overhang_branch';

export interface PaintedTree2DProps {
  species: TreeSpecies;
  x: number;
  y: number;
  scale?: number;
  frame?: number;
  flipX?: boolean;
  sunColor?: string;
  midColor?: string;
  shadowColor?: string;
  trunkColor?: string;
  trunkShadow?: string;
}

/** Organic multi-scalloped painterly foliage silhouette cluster (replaces flat ellipses). */
const FoliageCluster: React.FC<{
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  sunColor: string;
  midColor: string;
  shadowColor: string;
}> = ({ cx, cy, rx, ry, sunColor, midColor, shadowColor }) => {
  const scalloped = (ox: number, oy: number, sx: number, sy: number) =>
    `M ${ox - sx} ${oy + sy * 0.25} ` +
    `C ${ox - sx * 1.05} ${oy - sy * 0.55}, ${ox - sx * 0.55} ${oy - sy * 0.95}, ${ox - sx * 0.15} ${oy - sy * 0.78} ` +
    `C ${ox + sx * 0.15} ${oy - sy * 1.12}, ${ox + sx * 0.72} ${oy - sy * 0.92}, ${ox + sx * 0.88} ${oy - sy * 0.42} ` +
    `C ${ox + sx * 1.12} ${oy - sy * 0.12}, ${ox + sx * 0.96} ${oy + sy * 0.58}, ${ox + sx * 0.42} ${oy + sy * 0.62} ` +
    `C ${ox + sx * 0.1} ${oy + sy * 0.85}, ${ox - sx * 0.48} ${oy + sy * 0.78}, ${ox - sx * 0.72} ${oy + sy * 0.48} ` +
    `C ${ox - sx * 0.95} ${oy + sy * 0.44}, ${ox - sx * 1.02} ${oy + sy * 0.36}, ${ox - sx} ${oy + sy * 0.25} Z`;

  return (
    <g>
      {/* Deep underside shadow mass */}
      <path d={scalloped(cx - rx * 0.08, cy + ry * 0.22, rx * 1.04, ry * 0.98)} fill={shadowColor} />
      {/* Main painted midtone foliage mass */}
      <path d={scalloped(cx, cy, rx * 0.96, ry * 0.92)} fill={midColor} />
      {/* Sunlit upper-right foliage rim & dappled highlights */}
      <path d={scalloped(cx + rx * 0.16, cy - ry * 0.22, rx * 0.62, ry * 0.52)} fill={sunColor} opacity={0.86} />
      <path d={scalloped(cx - rx * 0.26, cy - ry * 0.24, rx * 0.32, ry * 0.28)} fill={sunColor} opacity={0.58} />
    </g>
  );
};

export const PaintedTree2D: React.FC<PaintedTree2DProps> = ({
  species,
  x,
  y,
  scale = 1,
  frame = 0,
  flipX = false,
  sunColor = '#B5BE52',
  midColor = '#567437',
  shadowColor = '#21331E',
  trunkColor = '#6F4930',
  trunkShadow = '#372217',
}) => {
  const sway = Math.sin(frame * 0.042 + x * 0.01) * 1.5;
  const leafLag = Math.sin((frame - 6) * 0.042 + x * 0.01) * 2.1;
  const dir = flipX ? -1 : 1;

  if (species === 'overhang_branch') {
    const tufts = [
      { cx: 78, cy: 48, rx: 68, ry: 42 },
      { cx: 186, cy: 74, rx: 78, ry: 44 },
      { cx: 294, cy: 108, rx: 64, ry: 36 },
      { cx: 136, cy: 112, rx: 56, ry: 34 },
      { cx: 368, cy: 146, rx: 48, ry: 28 },
      { cx: 38, cy: 98, rx: 56, ry: 36 },
    ];
    return (
      <g transform={`translate(${x}, ${y}) scale(${dir * scale}, ${scale}) rotate(${sway * 0.45})`}>
        {/* Gnarled acacia overhang bough + delicate hanging twigs */}
        <path
          d="M -42 12 C 62 24, 168 46, 286 96 C 328 114, 370 130, 408 152 L 396 162 C 344 140, 294 122, 238 102 C 148 72, 52 54, -42 48 Z"
          fill={trunkShadow}
        />
        <path d="M -38 16 C 68 28, 170 50, 282 96 L 266 102 C 164 62, 64 40, -38 30 Z" fill={trunkColor} />
        <path d="M 184 74 Q 212 118 238 142" fill="none" stroke={trunkShadow} strokeWidth={5} strokeLinecap="round" />
        <g transform={`rotate(${(leafLag - sway) * 0.35}, 180, 90)`}>
          {tufts.map((t, i) => (
            <FoliageCluster
              key={i}
              cx={t.cx}
              cy={t.cy}
              rx={t.rx}
              ry={t.ry}
              sunColor={sunColor}
              midColor={midColor}
              shadowColor={shadowColor}
            />
          ))}
        </g>
      </g>
    );
  }

  if (species === 'savanna_acacia') {
    return (
      <g transform={`translate(${x}, ${y}) scale(${dir * scale}, ${scale})`}>
        {/* Elongated directional ground shadow */}
        <ellipse cx={-26} cy={4} rx={104} ry={13} fill="#251C19" opacity={0.34} />
        <ellipse cx={0} cy={3} rx={36} ry={6} fill="#1E1614" opacity={0.45} />
        <path
          d="M -20 5 C -10 -34, -8 -78, -6 -112 C -28 -136, -66 -154, -96 -166 L -84 -175 C -50 -160, -20 -142, 0 -122 C 26 -144, 60 -160, 98 -170 L 104 -160 C 66 -148, 30 -132, 10 -106 C 12 -72, 14 -30, 22 5 Z"
          fill={trunkShadow}
        />
        <path
          d="M -5 3 C -2 -44, 0 -86, 4 -116 C 24 -136, 56 -152, 94 -164 L 86 -158 C 52 -146, 22 -130, 8 -108 C 8 -70, 10 -28, 16 3 Z"
          fill={trunkColor}
        />
        <g transform={`rotate(${leafLag * 0.5}, 0, -162)`}>
          <FoliageCluster cx={-66} cy={-168} rx={72} ry={24} sunColor={sunColor} midColor={midColor} shadowColor={shadowColor} />
          <FoliageCluster cx={62} cy={-164} rx={74} ry={24} sunColor={sunColor} midColor={midColor} shadowColor={shadowColor} />
          <FoliageCluster cx={0} cy={-180} rx={104} ry={30} sunColor={sunColor} midColor={midColor} shadowColor={shadowColor} />
        </g>
      </g>
    );
  }

  if (species === 'conifer') {
    const tiers = [
      { y: -56, w: 68, h: 54 },
      { y: -104, w: 56, h: 50 },
      { y: -146, w: 42, h: 46 },
      { y: -182, w: 28, h: 38 },
    ];
    return (
      <g transform={`translate(${x}, ${y}) scale(${dir * scale}, ${scale})`}>
        <ellipse cx={-16} cy={4} rx={58} ry={10} fill="#1E2028" opacity={0.36} />
        <path d="M -10 4 L -7 -68 L 7 -68 L 11 4 Z" fill={trunkShadow} />
        <g transform={`rotate(${leafLag * 0.55}, 0, -60)`}>
          {tiers.map((t, i) => (
            <g key={i}>
              <path
                d={`M 0 ${t.y - t.h} L ${-t.w * 0.55} ${t.y - t.h * 0.25} L ${-t.w} ${t.y + 8} Q 0 ${t.y + 16} ${t.w} ${t.y + 8} L ${t.w * 0.55} ${t.y - t.h * 0.25} Z`}
                fill={shadowColor}
              />
              <path
                d={`M 0 ${t.y - t.h} L ${-t.w * 0.3} ${t.y + 4} Q ${t.w * 0.3} ${t.y + 10} ${t.w * 0.92} ${t.y + 4} Z`}
                fill={midColor}
              />
              <path d={`M 0 ${t.y - t.h} L ${t.w * 0.14} ${t.y} L ${t.w * 0.84} ${t.y + 2} Z`} fill={sunColor} opacity={0.82} />
            </g>
          ))}
        </g>
      </g>
    );
  }

  if (species === 'dead_gnarled') {
    return (
      <g transform={`translate(${x}, ${y}) scale(${dir * scale}, ${scale})`}>
        <ellipse cx={-12} cy={4} rx={52} ry={8} fill="#16141A" opacity={0.42} />
        <path
          d="M -28 6 C -14 -24, -12 -64, -10 -104 C -34 -128, -56 -144, -76 -166 L -69 -170 C -50 -150, -30 -136, -10 -116 C -14 -146, -24 -170, -34 -192 L -26 -194 C -16 -170, -6 -144, 0 -114 C 18 -136, 44 -158, 70 -180 L 75 -174 C 48 -150, 24 -130, 8 -102 C 12 -62, 16 -24, 30 6 Z"
          fill={trunkShadow}
        />
        <path
          d="M -4 4 C -2 -36, 0 -76, 3 -106 C 22 -130, 46 -152, 70 -174 L 64 -170 C 42 -148, 20 -126, 7 -100 C 8 -60, 12 -24, 22 4 Z"
          fill={trunkColor}
        />
      </g>
    );
  }

  return (
    <g transform={`translate(${x}, ${y}) scale(${dir * scale}, ${scale})`}>
      <ellipse cx={-18} cy={4} rx={76} ry={12} fill="#251C19" opacity={0.36} />
      <path
        d="M -28 6 C -16 -22, -14 -68, -14 -116 C -26 -130, -40 -138, -54 -144 L -46 -152 C -30 -144, -18 -136, -6 -124 L 8 -124 C 24 -138, 40 -146, 54 -150 L 58 -142 C 42 -134, 26 -126, 14 -112 C 14 -68, 16 -22, 32 6 Z"
        fill={trunkShadow}
      />
      <path d="M -4 4 C -2 -34, 0 -78, 4 -116 L 13 -112 C 12 -70, 14 -24, 24 4 Z" fill={trunkColor} />
      <g transform={`rotate(${leafLag * 0.55}, 0, -135)`}>
        <FoliageCluster cx={-48} cy={-144} rx={48} ry={40} sunColor={sunColor} midColor={midColor} shadowColor={shadowColor} />
        <FoliageCluster cx={52} cy={-140} rx={46} ry={38} sunColor={sunColor} midColor={midColor} shadowColor={shadowColor} />
        <FoliageCluster cx={4} cy={-186} rx={64} ry={48} sunColor={sunColor} midColor={midColor} shadowColor={shadowColor} />
      </g>
    </g>
  );
};

export const FernFrond2D: React.FC<{
  x: number;
  y: number;
  scale?: number;
  rotation?: number;
  frame?: number;
  color?: string;
  highlight?: string;
}> = ({ x, y, scale = 1, rotation = 0, frame = 0, color = '#3C5E2D', highlight = '#89A344' }) => {
  const sway = Math.sin(frame * 0.055 + x * 0.02) * 2.4;
  const leaflets = [0.16, 0.28, 0.4, 0.52, 0.64, 0.76, 0.87];
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation + sway}) scale(${scale})`}>
      <path d="M 0 0 Q 12 -56 42 -118" fill="none" stroke="#24381E" strokeWidth={4} strokeLinecap="round" />
      {leaflets.map((t, i) => {
        const lx = t * t * 32 + t * 10;
        const ly = -t * 116;
        const len = (1 - t * 0.62) * 34;
        return (
          <g key={i} transform={`translate(${lx}, ${ly})`}>
            <path d={`M 0 0 Q ${-len * 0.6} -8 ${-len} -16 Q ${-len * 0.5} -2 0 4 Z`} fill={color} />
            <path d={`M 0 0 Q ${len * 0.6} -12 ${len * 0.95} -6 Q ${len * 0.45} 4 0 4 Z`} fill={i % 2 === 0 ? highlight : color} />
          </g>
        );
      })}
    </g>
  );
};

export const GrassTuft2D: React.FC<{
  x: number;
  y: number;
  scale?: number;
  frame?: number;
  color?: string;
  highlight?: string;
}> = ({ x, y, scale = 1, frame = 0, color = '#587136', highlight = '#B3BC54' }) => {
  const sway = Math.sin(frame * 0.075 + x * 0.03) * 3.8;
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <ellipse cx={-4} cy={2} rx={16} ry={4} fill="#251A16" opacity={0.34} />
      <path d={`M -8 0 Q ${-18 + sway} -32 ${-26 + sway * 1.4} -54 Q ${-12 + sway * 0.6} -24 -2 0 Z`} fill={color} />
      <path d={`M -2 0 Q ${-6 + sway} -44 ${-2 + sway * 1.5} -68 Q ${4 + sway * 0.6} -30 4 0 Z`} fill={highlight} />
      <path d={`M 4 0 Q ${14 + sway} -34 ${24 + sway * 1.3} -52 Q ${12 + sway * 0.5} -22 10 0 Z`} fill={color} />
      <path d={`M -12 0 Q ${-24 + sway * 0.8} -20 ${-32 + sway} -32 Q ${-16 + sway * 0.4} -14 -6 0 Z`} fill="#2C4222" />
    </g>
  );
};

export const FacetedBoulder2D: React.FC<{
  x: number;
  y: number;
  scale?: number;
  sunColor?: string;
  midColor?: string;
  shadowColor?: string;
  /** Live firelight facing side for campfire rocks. */
  fireLitFrom?: 'right' | 'left' | 'none';
}> = ({
  x,
  y,
  scale = 1,
  sunColor = '#D99B66',
  midColor = '#9E613E',
  shadowColor = '#4E2E24',
  fireLitFrom = 'none',
}) => {
  const rig = useLightingRig();
  const f = rig.flicker;
  const castX = fireLitFrom === 'right' ? -22 - rig.shadowSwayX : fireLitFrom === 'left' ? 22 + rig.shadowSwayX : -18;

  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      {/* Ambient Occlusion contact shadow + elongated directional cast shadow */}
      <ellipse cx={castX} cy={14} rx={64} ry={12} fill={rig.shadowColor} opacity={0.44} />
      <ellipse cx={0} cy={14} rx={44} ry={7} fill={rig.shadowColor} opacity={0.62} />
      <polygon points="-52,10 -34,-26 -6,-36 6,-6 -12,16" fill={shadowColor} />
      <polygon points="-6,-36 28,-28 46,8 14,18 -12,16 6,-6" fill={midColor} />
      <polygon points="-6,-36 28,-28 38,-8 6,-6" fill={sunColor} />
      {fireLitFrom !== 'none' && (
        <polygon
          points={fireLitFrom === 'right' ? '14,-30 38,-10 46,8 14,16 6,-6' : '-52,10 -34,-26 -6,-36 4,-6 -12,16'}
          fill="#F59B3E"
          opacity={0.34 * f}
        />
      )}
      <polyline points="-34,-26 -6,-36 6,-6 -12,16" fill="none" stroke="#241612" strokeWidth={2} opacity={0.58} />
    </g>
  );
};

// =============================================================================
// 2. SUN, VOLUMETRIC GOD RAYS, LIVE FLICKERING CAMPFIRE, WATER & ATMOSPHERE FX
// =============================================================================

export const SunAndGodRays2D: React.FC<{
  x: number;
  y: number;
  radius?: number;
  frame?: number;
  coreColor?: string;
  rayColor?: string;
}> = ({ x, y, radius = 58, frame = 0, coreColor = '#FDF3D3', rayColor = '#F9D68A' }) => {
  const pulse = 1 + Math.sin(frame * 0.04) * 0.03;
  const rays = [
    { angle: 118, len: 1120, w: 68, op: 0.14 },
    { angle: 132, len: 1280, w: 108, op: 0.19 },
    { angle: 147, len: 1180, w: 78, op: 0.13 },
    { angle: 162, len: 960, w: 58, op: 0.1 },
  ];
  return (
    <g>
      <defs>
        <radialGradient id="odyssey-sun-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={coreColor} stopOpacity="0.96" />
          <stop offset="32%" stopColor={rayColor} stopOpacity="0.54" />
          <stop offset="70%" stopColor={rayColor} stopOpacity="0.14" />
          <stop offset="100%" stopColor={rayColor} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="odyssey-ray-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={coreColor} stopOpacity="0.78" />
          <stop offset="55%" stopColor={rayColor} stopOpacity="0.22" />
          <stop offset="100%" stopColor={rayColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <g style={{ mixBlendMode: 'screen' }}>
        {rays.map((r, i) => {
          const drift = Math.sin(frame * 0.025 + i * 1.4) * 1.2;
          return (
            <polygon
              key={i}
              points={`0,${-r.w * 0.24} ${r.len},${-r.w} ${r.len},${r.w} 0,${r.w * 0.24}`}
              fill="url(#odyssey-ray-grad)"
              opacity={r.op}
              transform={`translate(${x}, ${y}) rotate(${r.angle + drift})`}
            />
          );
        })}
      </g>
      <circle cx={x} cy={y} r={radius * 3.5 * pulse} fill="url(#odyssey-sun-halo)" />
      <circle cx={x} cy={y} r={radius} fill={coreColor} />
    </g>
  );
};

export const OrganicFire2D: React.FC<{
  x: number;
  y: number;
  scale?: number;
  frame?: number;
  variant?: 'amber' | 'mystic_blue';
  withLogs?: boolean;
}> = ({ x, y, scale = 1, frame = 0, variant = 'amber', withLogs = true }) => {
  const rig = useLightingRig();
  const f = rig.flicker;
  const flick1 = Math.sin(frame * 0.31) * 7.5 + Math.cos(frame * 0.67) * 3;
  const flick2 = Math.cos(frame * 0.41 + 1.1) * 6.5;
  const flick3 = Math.sin(frame * 0.53 + 2.3) * 8;
  const outer = variant === 'amber' ? '#D4441F' : '#246CE2';
  const mid = variant === 'amber' ? '#F39432' : '#4EC2F6';
  const core = variant === 'amber' ? '#FDECA6' : '#DEF7FC';

  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      {/* Dynamic ground firelight bounce pool */}
      <ellipse cx={0} cy={14} rx={155 * f} ry={38 * f} fill={mid} opacity={0.26 * f} />
      <ellipse cx={0} cy={12} rx={82 * f} ry={22} fill={core} opacity={0.22 * f} />

      {/* Charred crossed firewood logs & hot ember bed */}
      {withLogs && (
        <g>
          <ellipse cx={0} cy={14} rx={58} ry={13} fill="#1E1314" />
          <ellipse cx={0} cy={12} rx={44} ry={9} fill="#962C16" opacity={0.78 * f} />
          <path d="M -56 16 L 46 -2 L 50 9 L -50 26 Z" fill="#3B231A" stroke="#221310" strokeWidth={1.5} />
          <path d="M -46 -2 L 56 16 L 50 26 L -50 9 Z" fill="#4A2B1F" stroke="#221310" strokeWidth={1.5} />
          {/* Glowing ember undersides of logs */}
          <path d="M -26 11 L 26 4" stroke="#F68B2E" strokeWidth={3.5} strokeLinecap="round" opacity={0.85 * f} />
          <path d="M -22 5 L 28 14" stroke="#F68B2E" strokeWidth={3.2} strokeLinecap="round" opacity={0.75 * f} />
        </g>
      )}

      {/* Side flame licks for asymmetric organic silhouette */}
      <path
        d={`M -34 10 C -50 -16, ${-36 + flick3 * 0.6} -48, ${-18 + flick1} -76 C -14 -44, -10 -12, -16 10 Z`}
        fill={outer}
        opacity={0.92}
      />
      <path
        d={`M 32 10 C 48 -18, ${34 - flick2 * 0.6} -50, ${20 + flick3 * 0.5} -80 C 12 -46, 12 -14, 16 10 Z`}
        fill={outer}
        opacity={0.92}
      />
      {/* Main tall flame */}
      <path
        d={`M -36 10 C -48 -28, ${-24 + flick1} -74, ${flick2} ${-132 * f} C ${24 + flick1} -80, 48 -34, 36 10 C 18 22, -18 22, -36 10 Z`}
        fill={outer}
      />
      <path
        d={`M -23 10 C -29 -22, ${-12 + flick2} -58, ${-flick1 * 0.7} ${-96 * f} C ${16 - flick2} -60, 31 -24, 23 10 C 10 18, -10 18, -23 10 Z`}
        fill={mid}
      />
      <path
        d={`M -12 10 C -15 -12, ${-4 + flick1 * 0.5} -34, ${flick2 * 0.4} ${-56 * f} C ${10 + flick1 * 0.4} -32, 16 -12, 12 10 Z`}
        fill={core}
      />
      {/* Fast rising local sparks */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const cycle = ((frame * 1.5 + i * 19) % 72) / 72;
        const sx = (hash01(i * 11 + 3) - 0.5) * 68 + Math.sin(frame * 0.14 + i) * 11;
        const sy = -24 - cycle * 150;
        return <circle key={i} cx={sx} cy={sy} r={2.6 * (1 - cycle * 0.6)} fill={core} opacity={(1 - cycle) * 0.9} />;
      })}
    </g>
  );
};

export const WaterFX2D: React.FC<{
  kind: 'waterfall' | 'wave' | 'ripples';
  x: number;
  y: number;
  scale?: number;
  frame?: number;
}> = ({ kind, x, y, scale = 1, frame = 0 }) => {
  const flow = (frame * 3.5) % 40;

  if (kind === 'ripples') {
    return (
      <g transform={`translate(${x}, ${y}) scale(${scale})`}>
        {[0, 1, 2].map((i) => {
          const p = (frame * 0.018 + i * 0.33) % 1;
          return (
            <ellipse
              key={i}
              cx={0}
              cy={0}
              rx={16 + p * 74}
              ry={4 + p * 18}
              fill="none"
              stroke="#9FE1F0"
              strokeWidth={2.5 * (1 - p * 0.5)}
              opacity={(1 - p) * 0.85}
            />
          );
        })}
      </g>
    );
  }

  if (kind === 'wave') {
    const bob = Math.sin(frame * 0.08) * 3;
    return (
      <g transform={`translate(${x}, ${y + bob}) scale(${scale})`}>
        <path
          d="M -110 26 C -80 18, -56 -28, -22 -48 C 10 -66, 46 -50, 32 -22 C 18 -34, 0 -28, -4 -10 C 12 -4, 48 16, 112 28 Z"
          fill="#2B7DA0"
        />
        <path
          d="M -90 24 C -62 12, -44 -26, -16 -42 C 8 -55, 36 -46, 26 -24 C 12 -32, -8 -24, -14 -4 C 0 8, 38 20, 88 26 Z"
          fill="#5DBCD4"
        />
        <path
          d="M -22 -48 C 6 -66, 44 -54, 34 -24 C 24 -36, 10 -44, -8 -36 C -16 -32, -26 -20, -34 -12"
          fill="none"
          stroke="#E4F5F8"
          strokeWidth={5}
          strokeLinecap="round"
        />
      </g>
    );
  }

  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <defs>
        <linearGradient id="odyssey-wf-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#A6E3F2" stopOpacity="0.95" />
          <stop offset="55%" stopColor="#499EC0" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#D7F3FA" stopOpacity="0.92" />
        </linearGradient>
      </defs>
      <rect x={-34} y={0} width={68} height={164} rx={8} fill="url(#odyssey-wf-grad)" />
      {[-22, -8, 6, 18].map((sx, idx) => (
        <line
          key={idx}
          x1={sx}
          y1={(flow + idx * 14) % 44}
          x2={sx}
          y2={156}
          stroke="#E4F6FA"
          strokeWidth={idx % 2 === 0 ? 3.5 : 2}
          strokeDasharray="24 18"
          strokeDashoffset={-flow * 2.2}
          opacity={0.78}
        />
      ))}
      <ellipse cx={-26} cy={166} rx={36} ry={14} fill="#D9F1F6" opacity={0.62} />
      <ellipse cx={22} cy={168} rx={38} ry={15} fill="#D9F1F6" opacity={0.58} />
      <ellipse cx={0} cy={170} rx={52} ry={16} fill="#EDF8FA" opacity={0.72} />
      <WaterFX2D kind="ripples" x={0} y={176} scale={1.15} frame={frame} />
    </g>
  );
};

export const AtmosphereFX2D: React.FC<{
  kind: 'birds' | 'smoke_plume' | 'comet';
  x: number;
  y: number;
  scale?: number;
  frame?: number;
}> = ({ kind, x, y, scale = 1, frame = 0 }) => {
  if (kind === 'birds') {
    const birds = [
      { ox: 0, oy: 0, s: 1.0, ph: 0 },
      { ox: 74, oy: -28, s: 0.72, ph: 1.4 },
      { ox: 128, oy: -12, s: 0.56, ph: 2.6 },
      { ox: -62, oy: -38, s: 0.62, ph: 0.8 },
      { ox: 190, oy: 36, s: 0.85, ph: 3.1 },
    ];
    return (
      <g transform={`translate(${x + frame * 0.65}, ${y - frame * 0.14}) scale(${scale})`}>
        {birds.map((b, i) => {
          const flap = Math.sin(frame * 0.2 + b.ph) * 8.5;
          return (
            <path
              key={i}
              d={`M ${b.ox - 24 * b.s} ${b.oy + flap * b.s} Q ${b.ox - 10 * b.s} ${b.oy - 10 * b.s} ${b.ox} ${b.oy} Q ${b.ox + 10 * b.s} ${b.oy - 10 * b.s} ${b.ox + 24 * b.s} ${b.oy + flap * b.s}`}
              fill="none"
              stroke="#3B2B26"
              strokeWidth={3.0 * b.s}
              strokeLinecap="round"
            />
          );
        })}
      </g>
    );
  }

  if (kind === 'comet') {
    return (
      <g transform={`translate(${x - frame * 1.2}, ${y + frame * 0.7}) rotate(-32) scale(${scale})`}>
        <path d="M 0 -5 L 165 -19 L 165 19 L 0 5 Z" fill="#F29442" opacity={0.3} />
        <path d="M 0 -3 L 112 -9 L 112 9 L 0 3 Z" fill="#FAD27A" opacity={0.62} />
        <circle cx={0} cy={0} r={8} fill="#FDF1CF" />
      </g>
    );
  }

  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const rise = ((frame * 0.65 + i * 24) % 120) / 120;
        const cx = Math.sin(rise * 4 + i) * 20 - rise * 24;
        const cy = -rise * 155;
        const r = 18 + rise * 34;
        return <circle key={i} cx={cx} cy={cy} r={r} fill="#9AA4B2" opacity={(1 - rise) * 0.36} />;
      })}
    </g>
  );
};
