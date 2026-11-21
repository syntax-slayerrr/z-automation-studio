import React, { useMemo } from 'react';
import { geoInterpolate, geoMercator, geoPath } from 'd3-geo';
import islandsRaw from './indonesia_islands.json';
import { clamp, easeInOutCubic, easeOutCubic, lerp } from './fx';

interface GeoFeature {
  type: 'Feature';
  properties: { country: string; island: string };
  geometry: { type: 'Polygon'; coordinates: number[][][] };
}

const FEATURES = (islandsRaw as { features: GeoFeature[] }).features;

/** Exact real Nusantara city coordinates [lng, lat] */
export const ID_CITIES = {
  jakarta: [106.8456, -6.2088] as [number, number],
  bandung: [107.6191, -6.9175] as [number, number],
  semarang: [110.4203, -6.9667] as [number, number],
  yogyakarta: [110.3695, -7.7956] as [number, number],
  surabaya: [112.7521, -7.2575] as [number, number],
  medan: [98.6722, 3.5952] as [number, number],
  padang: [100.3543, -0.9471] as [number, number],
  palembang: [104.7754, -2.9761] as [number, number],
  denpasar: [115.2126, -8.6705] as [number, number],
  pontianak: [109.3425, -0.0263] as [number, number],
  banjarmasin: [114.5908, -3.3194] as [number, number],
  makassar: [119.4327, -5.1477] as [number, number],
  manado: [124.8421, 1.4748] as [number, number],
  kupang: [123.607, -10.1772] as [number, number],
  ambon: [128.1814, -3.6954] as [number, number],
  jayapura: [140.7181, -2.5337] as [number, number],
};

export interface TwilightPin {
  id: string;
  label: string;
  sublabel?: string;
  coord: [number, number];
  appearT: number; // 0..1
  color?: string;
  labelDir?: 'top' | 'bottom' | 'left' | 'right';
  major?: boolean;
}

export interface TwilightArc {
  id: string;
  from: [number, number];
  to: [number, number];
  progress: number; // 0..1 draw progress
  color?: string;
  bend?: number;
}

export interface IndonesiaTwilightMapProps {
  f: number;
  center: [number, number]; // [lng, lat]
  scale: number;            // Mercator scale (~1150 full Nusantara, ~3800 Java focus)
  centerY?: number;         // vertical map placement inside 720x1280 frame
  pins?: TwilightPin[];
  arcs?: TwilightArc[];
  highlightIslands?: string[];
  convergeGlow?: { coord: [number, number]; intensity: number };
  showGrid?: boolean;
}

/**
 * Geographically Accurate Indonesia Archipelago Map (`d3-geo` + real GeoJSON)
 * styled strictly in the Twilight Parchment Documentary aesthetic (deep indigo-plum sea,
 * gilded archival landmass reliefs, crimson-gold city pins & animated glowing routes).
 */
export const IndonesiaTwilightMap: React.FC<IndonesiaTwilightMapProps> = ({
  f,
  center,
  scale,
  centerY = 565,
  pins = [],
  arcs = [],
  highlightIslands = ['jawa'],
  convergeGlow,
  showGrid = true,
}) => {
  const { projection, paths } = useMemo(() => {
    const proj = geoMercator()
      .center(center)
      .scale(scale)
      .translate([360, centerY]);
    const pathGen = geoPath(proj);
    const computed = FEATURES.map((feat, idx) => ({
      key: `${feat.properties.country}_${feat.properties.island}_${idx}`,
      d: pathGen(feat as any) || '',
      isIndonesia: feat.properties.country === 'Indonesia',
      island: feat.properties.island,
    }));
    return { projection: proj, paths: computed };
  }, [center[0], center[1], scale, centerY]);

  const buildArcPath = (from: [number, number], to: [number, number], bend = -28): string => {
    const interp = geoInterpolate(from, to);
    const pts: Array<[number, number]> = [];
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      const p = projection(interp(u));
      if (!p) continue;
      // Add graceful upward cartographic arc curvature
      const lift = Math.sin(u * Math.PI) * bend;
      pts.push([p[0], p[1] + lift]);
    }
    return pts.map(([px, py], i) => `${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`).join(' ');
  };

  const convPt = convergeGlow ? projection(convergeGlow.coord) : null;

  return (
    <g>
      <defs>
        <radialGradient id="mapSeaVignette" cx="50%" cy="48%" r="58%">
          <stop offset="0%" stopColor="#2c1c3e" stopOpacity="0.95" />
          <stop offset="65%" stopColor="#1b0f2a" stopOpacity="0.98" />
          <stop offset="100%" stopColor="#13081c" stopOpacity="1" />
        </radialGradient>
        <filter id="mapGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <filter id="mapRelief" x="-5%" y="-5%" width="110%" height="115%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#0e0616" floodOpacity="0.68" />
        </filter>
      </defs>

      {/* Deep Archival Indigo-Plum Sea Backdrop */}
      <rect x={-40} y={-40} width={800} height={1360} fill="url(#mapSeaVignette)" />

      {/* Subtle Vintage Cartographic Latitude/Longitude Graticule Lines */}
      {showGrid && (
        <g opacity={0.14} stroke="#d4b486" strokeWidth={0.8} strokeDasharray="4 6">
          {[260, 380, 500, 620, 740, 860].map((gy) => (
            <line key={`h_${gy}`} x1={0} y1={gy} x2={720} y2={gy} />
          ))}
          {[120, 240, 360, 480, 600].map((gx) => (
            <line key={`v_${gx}`} x1={gx} y1={180} x2={gx} y2={940} />
          ))}
        </g>
      )}

      {/* Subtle Compass Rose Watermark (Lower-Right Cartographic Flair) */}
      <g transform="translate(618, 825)" opacity={0.22}>
        <circle cx={0} cy={0} r={34} fill="none" stroke="#f0c478" strokeWidth={1.1} />
        <polygon points="0,-38 6,-6 0,-12 -6,-6" fill="#f0c478" />
        <polygon points="0,38 5,6 0,12 -5,6" fill="#a88a68" />
        <polygon points="-38,0 -6,-5 -12,0 -6,5" fill="#a88a68" />
        <polygon points="38,0 6,-5 12,0 6,5" fill="#a88a68" />
        <text x={0} y={-44} textAnchor="middle" fill="#f4d498" fontSize={11} fontFamily="Georgia, serif" fontWeight="bold">
          U
        </text>
      </g>

      {/* Real GeoJSON Archipelago Polygons */}
      <g filter="url(#mapRelief)">
        {paths.map((feat) => {
          if (!feat.d) return null;
          if (!feat.isIndonesia) {
            return (
              <path
                key={feat.key}
                d={feat.d}
                fill="#1d122c"
                stroke="#38254a"
                strokeWidth={0.8}
                opacity={0.55}
              />
            );
          }
          const isHl = highlightIslands.includes(feat.island) || highlightIslands.includes('all');
          return (
            <path
              key={feat.key}
              d={feat.d}
              fill={isHl ? '#4d2c44' : '#311d3a'}
              stroke={isHl ? '#f4b460' : '#8c6684'}
              strokeWidth={isHl ? 1.8 : 1.0}
              strokeOpacity={isHl ? 0.92 : 0.55}
            />
          );
        })}
      </g>

      {/* Animated Glowing Route / Fusion Arcs */}
      {arcs.map((arc) => {
        if (arc.progress <= 0.01) return null;
        const d = buildArcPath(arc.from, arc.to, arc.bend ?? -34);
        const col = arc.color ?? '#f8b65c';
        const p = clamp(arc.progress, 0, 1);
        return (
          <g key={arc.id}>
            <path
              d={d}
              fill="none"
              stroke={col}
              strokeWidth={7}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray="1"
              strokeDashoffset={1 - p}
              opacity={0.35}
              filter="url(#mapGlow)"
            />
            <path
              d={d}
              fill="none"
              stroke="#fff0c8"
              strokeWidth={2.6}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray="1"
              strokeDashoffset={1 - p}
            />
          </g>
        );
      })}

      {/* Central Convergence Pulse (Scene 2 Beat 5!) */}
      {convPt && convergeGlow && convergeGlow.intensity > 0.01 && (
        <g transform={`translate(${convPt[0]}, ${convPt[1]})`} opacity={convergeGlow.intensity}>
          <circle cx={0} cy={0} r={lerp(10, 68, convergeGlow.intensity)} fill="#f8b65c" opacity={0.32} filter="url(#mapGlow)" />
          <circle cx={0} cy={0} r={16 + Math.sin(f * 0.25) * 4} fill="none" stroke="#ffe8b0" strokeWidth={2.2} opacity={0.85} />
          <circle cx={0} cy={0} r={7.5} fill="#d62c2c" stroke="#fff2cc" strokeWidth={2.2} />
        </g>
      )}

      {/* Animated Spring-Drop City Pins & Horizontal Safe-Area Callout Labels */}
      {pins.map((pin) => {
        const pt = projection(pin.coord);
        if (!pt || pin.appearT <= 0.01) return null;
        const t = easeOutCubic(pin.appearT);
        const dropY = lerp(-26, 0, t);
        const pulse = 1 + 0.28 * Math.sin(f * 0.16 + pt[0] * 0.05);
        const col = pin.color ?? '#d62c2c';
        const rDot = pin.major ? 7.5 : 4.8;
        const dir = pin.labelDir ?? 'top';
        const lx = dir === 'left' ? -14 : dir === 'right' ? 14 : 0;
        const ly = dir === 'top' ? (pin.sublabel ? -31 : -20) : dir === 'bottom' ? 24 : 4;
        const anchor = dir === 'left' ? 'end' : dir === 'right' ? 'start' : 'middle';

        return (
          <g key={pin.id} transform={`translate(${pt[0]}, ${pt[1] + dropY})`} opacity={t}>
            {/* Expanding Radar Ripple */}
            <circle cx={0} cy={0} r={rDot * 2.2 * pulse} fill={col} opacity={0.28} />
            <circle cx={0} cy={0} r={rDot * 1.6} fill="none" stroke="#ffe2a4" strokeWidth={1.3} opacity={0.75} />
            <circle cx={0} cy={0} r={rDot} fill={col} stroke="#fff4d6" strokeWidth={1.8} />
            {pin.label && (
              <g transform={`translate(${lx}, ${ly})`}>
                <text
                  textAnchor={anchor}
                  fill="#faf0da"
                  fontFamily="Georgia, serif"
                  fontSize={pin.major ? 18 : 12.5}
                  fontWeight="bold"
                  stroke="#160a1e"
                  strokeWidth={3.5}
                  paintOrder="stroke"
                >
                  {pin.label}
                </text>
                {pin.sublabel && (
                  <text
                    y={15}
                    textAnchor={anchor}
                    fill="#f4be72"
                    fontFamily="Segoe UI, sans-serif"
                    fontSize={11}
                    fontWeight={700}
                    letterSpacing="1.2px"
                    stroke="#160a1e"
                    strokeWidth={3}
                    paintOrder="stroke"
                  >
                    {pin.sublabel}
                  </text>
                )}
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
};
