import React from 'react';
import { clamp, describeArc, DOMAIN_PALETTES, hash01, lerp } from './palettes';

interface BrainNode {
  x: number;
  y: number;
  r: number;
  lobe: 'frontal' | 'parietal' | 'temporal' | 'occipital' | 'acc';
}

const BRAIN_NODES: BrainNode[] = [
  { x: -104, y: -38, r: 5.5, lobe: 'frontal' },
  { x: -72,  y: -86, r: 6.0, lobe: 'frontal' },
  { x: -24,  y: -52, r: 5.8, lobe: 'frontal' },
  { x: 18,   y: -98, r: 6.4, lobe: 'parietal' },
  { x: 76,   y: -76, r: 5.8, lobe: 'parietal' },
  { x: 118,  y: -18, r: 5.6, lobe: 'occipital' },
  { x: 82,   y: 26,  r: 5.8, lobe: 'occipital' },
  { x: 14,   y: 38,  r: 6.0, lobe: 'temporal' },
  { x: -52,  y: 28,  r: 5.6, lobe: 'temporal' },
  { x: -12,  y: -14, r: 8.2, lobe: 'acc' }, // Anterior Cingulate Cortex (ERN & Ritual Regulation Hub!)
];

const BRAIN_EDGES: Array<[number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 0],
  [0, 9], [1, 9], [2, 9], [3, 9], [4, 9], [7, 9], [8, 9], [2, 8], [3, 7], [4, 6],
];

/**
 * Multi-Lobe Colored Anatomical Brain Cutaway (`BrainCrossSection2D`).
 * Inspired by Kurzgesagt × `earth-24h` 2.5D shadow-box depth:
 * - Distinct colored cerebral lobes (Frontal Coral, Parietal Amber, Temporal Sage, Occipital Violet, Cerebellum)
 * - Highlighted Corpus Callosum & Anterior Cingulate Cortex (ACC)
 * - Sculpted gyri/sulci cortical folds + live firing myelinated neural pathways
 */
export const BrainCrossSection2D: React.FC<{
  f: number;
  cx: number;
  cy: number;
  scale?: number;
  accGlowIntensity?: number;
  accColor?: string;
  showLabels?: boolean;
  opacity?: number;
  idPrefix?: string;
}> = ({
  f,
  cx,
  cy,
  scale = 1,
  accGlowIntensity = 0.85,
  accColor = '#ffd872',
  showLabels = false,
  opacity = 1,
  idPrefix = 'bcs',
}) => {
  if (opacity <= 0.01) return null;
  const pal = DOMAIN_PALETTES.biology;
  const pulse = 0.88 + 0.12 * Math.sin(f * 0.11);

  return (
    <g transform={`translate(${cx}, ${cy}) scale(${scale})`} opacity={opacity}>
      <defs>
        <filter id={`${idPrefix}_sh`} x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="4" dy="7" stdDeviation="5" floodColor="#0b0818" floodOpacity="0.6" />
        </filter>
        <radialGradient id={`${idPrefix}_accHalo`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={accColor} stopOpacity={0.85 * accGlowIntensity * pulse} />
          <stop offset="50%" stopColor={accColor} stopOpacity={0.28 * accGlowIntensity} />
          <stop offset="100%" stopColor="#160a1e" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g filter={`url(#${idPrefix}_sh)`}>
        {/* Outer Translucent Cranial / Meningeal Rim Halo */}
        <path
          d="M -154 22 C -182 -18, -176 -84, -134 -122 C -104 -154, -46 -174, 14 -170 C 78 -168, 134 -140, 162 -94 C 192 -48, 184 22, 142 62 C 118 84, 86 94, 52 92 C 38 118, 8 136, -28 128 C -54 122, -72 104, -76 82 C -114 80, -142 54, -154 22 Z"
          fill="#22173a"
          stroke="#f8cf84"
          strokeWidth={3.2}
          strokeOpacity={0.85}
        />

        {/* Brainstem & Spinal Cord Continuation */}
        <path
          d="M -22 104 C -16 146, -8 182, 2 216 L 44 216 C 34 178, 32 140, 38 92 Z"
          fill="#8c6c8e"
          stroke="#e8d2c0"
          strokeWidth={1.8}
        />

        {/* Cerebellum (Arbor Vitae Leafy Pattern at Lower-Right Back) */}
        <g transform="translate(82, 92)">
          <ellipse cx={0} cy={0} rx={54} ry={38} fill={pal.lobeCerebellum} stroke="#f6c4a8" strokeWidth={1.8} />
          <path
            d="M -34 0 L 34 0 M -22 -14 L 0 0 L -22 14 M 4 -18 L 22 0 L 4 18"
            fill="none"
            stroke="#ffe4cc"
            strokeWidth={2}
            strokeLinecap="round"
            opacity={0.68}
          />
        </g>

        {/* 1. FRONTAL LOBE (Warm Coral-Terracotta — Executive & Action Sequences!) */}
        <path
          d="M -144 16 C -170 -20, -164 -78, -124 -114 C -96 -140, -50 -156, -4 -154 L -8 -18 L -78 66 C -110 64, -134 44, -144 16 Z"
          fill={pal.lobeFrontal}
        />
        {/* 2. PARIETAL LOBE (Golden Amber — Sensory-Motor Integration) */}
        <path
          d="M -4 -154 C 52 -154, 104 -132, 134 -96 L 62 -16 L -8 -18 Z"
          fill={pal.lobeParietal}
        />
        {/* 3. OCCIPITAL LOBE (Rich Royal Violet — Visual Processing) */}
        <path
          d="M 134 -96 C 174 -52, 168 14, 130 50 C 108 70, 82 78, 54 76 L 62 -16 Z"
          fill={pal.lobeOccipital}
        />
        {/* 4. TEMPORAL LOBE (Bioluminescent Sage-Teal — Memory & Meaning) */}
        <path
          d="M -78 66 L -8 -18 L 62 -16 L 54 76 C 36 106, 4 118, -28 112 C -54 106, -72 88, -78 66 Z"
          fill={pal.lobeTemporal}
        />

        {/* 2.5D Soft Volume Highlight Arc Across Upper Cortex */}
        <path
          d="M -116 -104 C -74 -138, 12 -148, 86 -122"
          fill="none"
          stroke="#fff6e0"
          strokeWidth={5}
          strokeLinecap="round"
          opacity={0.34}
        />

        {/* Cortical Gyri & Sulci (Organic Fold Lines) */}
        <path
          d="M -132 -36 C -98 -48, -64 -34, -36 -52 M -104 -86 C -72 -76, -42 -96, -14 -82 M 16 -112 C 44 -94, 78 -108, 106 -82 M 84 -32 C 112 -42, 134 -22, 146 4 M -54 26 C -18 12, 18 28, 46 14"
          fill="none"
          stroke="#22122e"
          strokeWidth={2.6}
          strokeLinecap="round"
          opacity={0.36}
        />

        {/* Inner Limbic Arch & Anterior Cingulate Cortex (ACC — Ritual Error Regulation Center!) */}
        <path
          d="M -56 12 C -62 -28, -26 -56, 22 -52 C 58 -48, 76 -22, 68 12 C 52 -16, 18 -26, -16 -22 C -38 -18, -48 -4, -56 12 Z"
          fill="#fff0c4"
          fillOpacity={0.38}
          stroke={accColor}
          strokeWidth={2.2}
        />
      </g>

      {/* Glowing ACC Halo */}
      <circle cx={-12} cy={-14} r={74} fill={`url(#${idPrefix}_accHalo)`} style={{ mixBlendMode: 'screen' }} />

      {/* Interconnected Myelinated Neural Pathways & Firing Synaptic Pulses */}
      {BRAIN_EDGES.map(([ai, bi], ei) => {
        const a = BRAIN_NODES[ai];
        const b = BRAIN_NODES[bi];
        const mx = (a.x + b.x) * 0.5 + (ei % 2 === 0 ? 8 : -8);
        const my = (a.y + b.y) * 0.5 - 6;
        const p = (f * 0.028 + hash01(ei * 19.3)) % 1;
        const px = (1 - p) * (1 - p) * a.x + 2 * (1 - p) * p * mx + p * p * b.x;
        const py = (1 - p) * (1 - p) * a.y + 2 * (1 - p) * p * my + p * p * b.y;
        return (
          <g key={ei}>
            <path d={`M ${a.x} ${a.y} Q ${mx} ${my}, ${b.x} ${b.y}`} fill="none" stroke="#fff2cc" strokeWidth={1.6} strokeOpacity={0.52} />
            <circle cx={px} cy={py} r={3.4} fill="#fff8e6" opacity={Math.sin(p * Math.PI) * 0.95} />
          </g>
        );
      })}

      {BRAIN_NODES.map((n, ni) => {
        const isAcc = n.lobe === 'acc';
        const np = 0.8 + 0.2 * Math.sin(f * 0.14 + ni);
        return (
          <g key={ni}>
            <circle cx={n.x} cy={n.y} r={n.r * (isAcc ? 1.45 * np : 1.0)} fill={isAcc ? accColor : '#fff2d0'} stroke="#26142c" strokeWidth={1.4} />
          </g>
        );
      })}

      {/* Optional Scientific Region Callout Labels */}
      {showLabels && (
        <g>
          <line x1={-12} y1={-14} x2={-118} y2={-148} stroke="#ffe49c" strokeWidth={1.6} strokeDasharray="4 3" />
          <circle cx={-12} cy={-14} r={3.5} fill="#fff4d4" />
          <rect x={-243} y={-176} width={204} height={28} rx={14} fill="#181028" fillOpacity={0.92} stroke="#f8c264" strokeWidth={1.4} />
          <text x={-141} y={-158} textAnchor="middle" fill="#ffe6a8" fontSize={11} fontFamily="Segoe UI, Arial, sans-serif" fontWeight={700} letterSpacing={1.2}>
            KORTEKS SINGULATA (ACC)
          </text>
        </g>
      )}
    </g>
  );
};

/**
 * Tactile `earth-24h` (`f_480.png`) × Kurzgesagt Cellular & Organelle Cutaway (`EukaryoticCellCutaway2D`).
 */
export const EukaryoticCellCutaway2D: React.FC<{
  f: number;
  cx: number;
  cy: number;
  radius?: number;
  opacity?: number;
}> = ({ f, cx, cy, radius = 92, opacity = 1 }) => {
  if (opacity <= 0.01) return null;
  const wobble = Math.sin(f * 0.06) * 2.5;
  return (
    <g transform={`translate(${cx}, ${cy + wobble})`} opacity={opacity}>
      <circle cx={0} cy={0} r={radius} fill="#9ee4dc" stroke="#e8fffa" strokeWidth={3.5} />
      <circle cx={0} cy={0} r={radius * 0.84} fill="#c8f6ee" stroke="#82cfc6" strokeWidth={1.8} />
      {/* Specular Crescent Highlight (exact f_480.png craft!) */}
      <path d={describeArc(radius * 0.9, 202, 272)} fill="none" stroke="rgba(255,255,255,0.78)" strokeWidth={radius * 0.075} strokeLinecap="round" />
      {/* Nucleus + Nucleolus */}
      <circle cx={radius * 0.16} cy={-radius * 0.08} r={radius * 0.34} fill="#2e7880" stroke="#9ee4dc" strokeWidth={2} />
      <circle cx={radius * 0.22} cy={-radius * 0.12} r={radius * 0.14} fill="#16464c" />
      {/* Mitochondria with folded cristae */}
      {[
        { x: -radius * 0.38, y: -radius * 0.24, rot: -28 },
        { x: -radius * 0.26, y: radius * 0.36, rot: 22 },
      ].map((m, mi) => (
        <g key={mi} transform={`translate(${m.x}, ${m.y}) rotate(${m.rot})`}>
          <rect x={-16} y={-8} width={32} height={16} rx={8} fill="#e8724c" stroke="#ffe0c8" strokeWidth={1.2} />
          <path d="M -10 0 Q -5 -5, 0 0 T 10 0" fill="none" stroke="#ffe0c8" strokeWidth={1.4} />
        </g>
      ))}
    </g>
  );
};
