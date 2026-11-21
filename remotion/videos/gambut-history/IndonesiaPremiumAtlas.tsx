import React, { useMemo } from 'react';
import { geoInterpolate, geoMercator, geoPath } from 'd3-geo';
import islandsRaw from '../gunung-guntur/indonesia_islands.json';
import { clamp, easeOutCubic, GP, lerp, SvgSlabLabel } from './fx';

interface GeoFeature {
  type: 'Feature';
  properties: { country: string; island: string };
  geometry: { type: 'Polygon'; coordinates: number[][][] };
}

const FEATURES = (islandsRaw as { features: GeoFeature[] }).features;

/** Authentic Indonesian Geographic Coordinates [lng, lat] */
export const ID_COORDS = {
  sebangau: [113.88, -2.55] as [number, number],
  palangkaraya: [113.92, -2.21] as [number, number],
  sumatraCentral: [102.65, 0.25] as [number, number],
  riauPeat: [102.35, 0.52] as [number, number],
  jambiPeat: [103.85, -1.35] as [number, number],
  sumatraField: [103.25, -0.85] as [number, number],
  jakarta: [106.85, -6.21] as [number, number],
  kalimantanCenter: [114.2, -0.8] as [number, number],
  indonesiaCenter: [111.5, -1.8] as [number, number],
};

/** Authentic Indonesian River Networks [lng, lat][] projected live via d3-geo */
const MAJOR_RIVERS: Array<{ name: string; pts: Array<[number, number]> }> = [
  // Kalimantan Rivers
  { name: 'Sebangau', pts: [[113.78, -2.18], [113.86, -2.42], [113.95, -2.72], [114.02, -3.12]] },
  { name: 'Kahayan', pts: [[113.65, -0.85], [113.82, -1.48], [113.92, -2.18], [114.08, -2.85], [114.12, -3.28]] },
  { name: 'Kapuas', pts: [[113.92, 0.95], [112.95, 0.72], [111.75, 0.22], [110.55, 0.02], [109.32, -0.05]] },
  { name: 'Barito', pts: [[114.95, -0.15], [114.88, -1.12], [114.82, -2.12], [114.62, -3.18], [114.48, -3.52]] },
  { name: 'Mahakam', pts: [[114.85, 0.72], [115.62, 0.12], [116.45, -0.25], [117.18, -0.52], [117.52, -0.68]] },
  // Sumatra Rivers (Eastern Peatland Lowlands!)
  { name: 'Siak', pts: [[100.85, 0.65], [101.48, 0.58], [102.05, 0.78], [102.28, 1.18]] },
  { name: 'Kampar', pts: [[100.65, 0.28], [101.42, 0.35], [102.35, 0.28], [103.12, 0.48]] },
  { name: 'Indragiri', pts: [[100.95, -0.52], [101.85, -0.48], [102.68, -0.35], [103.42, -0.28]] },
  { name: 'Batanghari', pts: [[101.45, -1.25], [102.35, -1.45], [103.32, -1.55], [103.98, -1.18]] },
  { name: 'Musi', pts: [[102.85, -3.22], [103.75, -2.95], [104.75, -2.98], [104.92, -2.32]] },
];

/**
 * Illustrated Vintage Cartographic Mountain Peaks (Erwin Raisz / National Geographic style!)
 * Real coordinates of Indonesian volcanic & highland peaks — rendered as sculpted NW-lit / SE-shadowed peak clusters!
 */
const CARTO_PEAKS: Array<{ c: [number, number]; sz: number; seed: number }> = [
  // Bukit Barisan (Western Sumatra Spine — varied staggered highland peaks!)
  { c: [96.6, 4.3], sz: 1.0, seed: 1 }, { c: [97.3, 3.7], sz: 1.15, seed: 2 },
  { c: [98.1, 3.0], sz: 0.95, seed: 3 }, { c: [98.7, 2.3], sz: 1.2, seed: 4 },
  { c: [99.2, 1.4], sz: 1.0, seed: 5 }, { c: [99.7, 0.7], sz: 0.88, seed: 6 },
  { c: [100.1, -0.1], sz: 1.15, seed: 7 }, { c: [100.5, -0.8], sz: 1.25, seed: 8 },
  { c: [101.2, -1.6], sz: 1.32, seed: 9 }, // Kerinci!
  { c: [101.8, -2.2], sz: 1.02, seed: 10 }, { c: [102.4, -2.9], sz: 1.1, seed: 11 },
  { c: [103.0, -3.5], sz: 1.18, seed: 12 }, { c: [103.6, -4.1], sz: 1.05, seed: 13 },
  { c: [104.2, -4.8], sz: 0.96, seed: 14 }, { c: [104.7, -5.3], sz: 0.9, seed: 15 },
  // Schwaner, Muller & Iran Highlands (Interior Kalimantan!)
  { c: [111.3, -1.1], sz: 1.0, seed: 21 }, { c: [112.0, -0.7], sz: 1.22, seed: 22 },
  { c: [112.7, -0.5], sz: 1.12, seed: 23 }, { c: [113.4, -0.1], sz: 1.28, seed: 24 },
  { c: [114.1, 0.4], sz: 1.16, seed: 25 }, { c: [114.8, 0.9], sz: 1.24, seed: 26 },
  { c: [115.4, 1.6], sz: 1.18, seed: 27 }, { c: [116.0, 2.3], sz: 1.26, seed: 28 },
  { c: [116.4, 3.1], sz: 1.1, seed: 29 }, { c: [113.0, 0.5], sz: 0.92, seed: 30 },
  { c: [114.3, -0.3], sz: 0.95, seed: 31 },
  // Meratus Range (SE Kalimantan)
  { c: [115.4, -3.2], sz: 0.88, seed: 41 }, { c: [115.6, -2.6], sz: 0.98, seed: 42 },
  { c: [115.7, -2.0], sz: 0.9, seed: 43 },
  // Java Volcanic Arc
  { c: [106.9, -6.8], sz: 1.05, seed: 51 }, { c: [107.8, -7.2], sz: 1.1, seed: 52 },
  { c: [109.2, -7.2], sz: 1.05, seed: 53 }, { c: [110.4, -7.5], sz: 1.15, seed: 54 },
  { c: [111.9, -7.8], sz: 1.08, seed: 55 }, { c: [113.0, -8.0], sz: 1.12, seed: 56 },
  // Sulawesi & Papua Highlands
  { c: [119.9, -3.0], sz: 1.1, seed: 61 }, { c: [120.2, -1.8], sz: 1.05, seed: 62 },
  { c: [137.2, -4.1], sz: 1.35, seed: 71 }, { c: [139.0, -4.3], sz: 1.3, seed: 72 },
];

/** Topographic Hypsometric Elevation Plateaus (soft sculpted warm highland shading beneath mountain peaks!) */
const HIGHLAND_PLATEAUS: Array<{ c: [number, number]; rx: number; ry: number; rot: number }> = [
  { c: [98.6, 2.2], rx: 1.1, ry: 2.3, rot: -42 },
  { c: [101.6, -1.9], rx: 1.0, ry: 2.6, rot: -42 },
  { c: [113.6, 0.4], rx: 2.9, ry: 1.2, rot: -34 },
  { c: [115.6, -2.6], rx: 0.55, ry: 1.0, rot: -15 },
  { c: [109.5, -7.3], rx: 3.1, ry: 0.48, rot: 8 },
];

/** Real Tropical Peatland Ecological Zones (Kalimantan & East Sumatra) */
const PEAT_ZONES: Array<{ id: string; center: [number, number]; rxDeg: number; ryDeg: number; rot: number }> = [
  { id: 'sebangau_basin', center: [113.82, -2.52], rxDeg: 1.42, ryDeg: 0.96, rot: -14 },
  { id: 'kapuas_peat', center: [110.15, -0.65], rxDeg: 1.12, ryDeg: 0.82, rot: 14 },
  { id: 'riau_peat', center: [102.42, 0.55], rxDeg: 1.36, ryDeg: 0.98, rot: 28 },
  { id: 'jambi_peat', center: [103.65, -1.35], rxDeg: 1.22, ryDeg: 0.88, rot: 32 },
  { id: 'sumsel_peat', center: [104.85, -2.82], rxDeg: 1.08, ryDeg: 0.78, rot: 20 },
  { id: 'papua_south_peat', center: [138.8, -6.2], rxDeg: 1.6, ryDeg: 0.85, rot: 10 },
];

/** Painted Lush Rainforest Biome Washes inside Indonesia Islands */
const RAINFOREST_PATCHES: Array<{ c: [number, number]; rx: number; ry: number; col: string }> = [
  { c: [113.4, 0.1], rx: 3.4, ry: 2.6, col: '#4F7444' },
  { c: [115.6, 1.4], rx: 2.3, ry: 2.0, col: '#3E623A' },
  { c: [111.6, -1.2], rx: 2.6, ry: 1.9, col: '#5B804A' },
  { c: [101.6, 0.6], rx: 2.3, ry: 2.0, col: '#4E7243' },
  { c: [103.2, -1.8], rx: 2.2, ry: 1.9, col: '#567B46' },
  { c: [98.4, 2.8], rx: 1.9, ry: 1.7, col: '#42663D' },
  { c: [120.4, -1.6], rx: 1.6, ry: 1.8, col: '#4E7044' },
  { c: [138.2, -4.4], rx: 3.2, ry: 1.8, col: '#40623A' },
];

export interface PremiumAtlasPin {
  id: string;
  label: string;
  sublabel?: string;
  coord: [number, number];
  appearT: number;
  slab?: boolean;
  labelDir?: 'top' | 'bottom' | 'left' | 'right';
  color?: string;
}

export interface IndonesiaPremiumAtlasProps {
  f: number;
  center: [number, number];
  scale: number;
  centerY?: number;
  pins?: PremiumAtlasPin[];
  highlightZone?: 'none' | 'sebangau' | 'sumatra_central' | 'sumatra_field' | 'both';
  highlightT?: number;
  drillDots?: Array<{ coord: [number, number]; appearT: number }>;
  flightArc?: { from: [number, number]; to: [number, number]; progress: number };
  scaleBarLabel?: string;
  scaleBarProgress?: number;
  smokeMood?: number;
}

/**
 * MUSEUM-GRADE TEXTURED TOPOGRAPHIC INDONESIA ATLAS (`IndonesiaPremiumAtlas.tsx`)
 * Authentic Illustrated Physical Relief Cartography:
 *  1. Multi-layer ocean bathymetry + Sunda Shelf shoals + delicate coastal wave contours + Equator line
 *  2. Soft 3D island elevation drop shadow + warm inner coastline bevel
 *  3. Clipped watercolor rainforest canopy biomes + organic stippled land paper texture (ZERO flat polygons!)
 *  4. Textured ecological peatland basins (marsh stippling + contour rings over Sebangau & East Sumatra)
 *  5. Illustrated Erwin Raisz / National Geographic style sculpted NW-lit / SE-shadowed mountain peak chains!
 *  6. Real d3-geo projected inland rivers (Sebangau, Kahayan, Kapuas, Barito, Kampar, Siak, Indragiri, Batanghari!)
 *  7. Brass compass rose, longitude ruler ticks, and red-cream cartographic scale bar!
 */
export const IndonesiaPremiumAtlas: React.FC<IndonesiaPremiumAtlasProps> = ({
  f,
  center,
  scale,
  centerY = 600,
  pins = [],
  highlightZone = 'none',
  highlightT = 1,
  drillDots = [],
  flightArc,
  scaleBarLabel,
  scaleBarProgress = 0,
  smokeMood = 0,
}) => {
  const { projection, indoPaths, neighborPaths, riverPaths, eqY, lonTicks, degToPx } = useMemo(() => {
    const proj = geoMercator().center(center).scale(scale).translate([360, centerY]);
    const pathGen = geoPath(proj);

    const indo: Array<{ key: string; d: string; island: string }> = [];
    const neigh: Array<{ key: string; d: string }> = [];
    FEATURES.forEach((feat, idx) => {
      const d = pathGen(feat as any) || '';
      if (!d) return;
      const key = `${feat.properties.country}_${feat.properties.island}_${idx}`;
      if (feat.properties.country === 'Indonesia') {
        indo.push({ key, d, island: feat.properties.island });
      } else {
        neigh.push({ key, d });
      }
    });

    const buildLine = (pts: Array<[number, number]>) => {
      const coords = pts.map((c) => proj(c)).filter((p): p is [number, number] => Boolean(p));
      if (coords.length < 2) return '';
      let d = `M ${coords[0][0].toFixed(1)} ${coords[0][1].toFixed(1)}`;
      for (let i = 1; i < coords.length - 1; i++) {
        const mx = (coords[i][0] + coords[i + 1][0]) * 0.5;
        const my = (coords[i][1] + coords[i + 1][1]) * 0.5;
        d += ` Q ${coords[i][0].toFixed(1)} ${coords[i][1].toFixed(1)}, ${mx.toFixed(1)} ${my.toFixed(1)}`;
      }
      const last = coords[coords.length - 1];
      d += ` L ${last[0].toFixed(1)} ${last[1].toFixed(1)}`;
      return d;
    };

    const rivers = MAJOR_RIVERS.map((r) => ({ name: r.name, d: buildLine(r.pts) })).filter((r) => r.d);

    const p0 = proj([center[0], 0]);
    const p1 = proj([center[0] + 1, 0]);
    const pxPerDeg = p0 && p1 ? Math.abs(p1[0] - p0[0]) : 35;

    const lons = [95, 100, 105, 110, 115, 120, 125, 130, 135, 140]
      .map((lon) => {
        const pt = proj([lon, center[1]]);
        return pt ? { lon, x: pt[0] } : null;
      })
      .filter((t): t is { lon: number; x: number } => Boolean(t && t.x > 25 && t.x < 695));

    return {
      projection: proj,
      indoPaths: indo,
      neighborPaths: neigh,
      riverPaths: rivers,
      eqY: p0 ? p0[1] : -999,
      lonTicks: lons,
      degToPx: pxPerDeg,
    };
  }, [center[0], center[1], scale, centerY]);

  const arcPathD = useMemo(() => {
    if (!flightArc || flightArc.progress <= 0.01) return '';
    const interp = geoInterpolate(flightArc.from, flightArc.to);
    const pts: string[] = [];
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      const pt = projection(interp(u));
      if (!pt) continue;
      const archY = -Math.sin(u * Math.PI) * 58;
      pts.push(`${i === 0 ? 'M' : 'L'} ${pt[0].toFixed(1)} ${(pt[1] + archY).toFixed(1)}`);
    }
    return pts.join(' ');
  }, [flightArc?.from[0], flightArc?.from[1], flightArc?.to[0], flightArc?.to[1], flightArc?.progress, projection]);

  const uid = `idAtlas_${Math.round(scale)}`;

  return (
    <g>
      <defs>
        <radialGradient id={`${uid}_ocean`} cx="50%" cy="46%" r="68%">
          <stop offset="0%" stopColor={smokeMood > 0.2 ? '#2B5366' : '#2C6782'} />
          <stop offset="56%" stopColor={smokeMood > 0.2 ? '#1D3C4E' : '#1B4962'} />
          <stop offset="100%" stopColor="#102B3D" />
        </radialGradient>

        <linearGradient id={`${uid}_land`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D1B97F" />
          <stop offset="52%" stopColor="#B89E65" />
          <stop offset="100%" stopColor="#947B4A" />
        </linearGradient>

        {/* Fine Organic Topographic Land Stipple & Rainforest Canopy Grain */}
        <pattern id={`${uid}_landTexture`} width="44" height="44" patternUnits="userSpaceOnUse">
          <circle cx="6" cy="9" r="1.4" fill="#324B2E" opacity="0.22" />
          <circle cx="22" cy="5" r="1.1" fill="#F0DFB2" opacity="0.24" />
          <circle cx="35" cy="14" r="1.5" fill="#2A3E28" opacity="0.20" />
          <circle cx="14" cy="24" r="1.2" fill="#3D5936" opacity="0.22" />
          <circle cx="29" cy="31" r="1.3" fill="#F0DFB2" opacity="0.20" />
          <circle cx="8" cy="38" r="1.0" fill="#2B3E28" opacity="0.24" />
          <path d="M 18 19 Q 24 16, 30 19" fill="none" stroke="#2D422A" strokeWidth="1" opacity="0.16" />
          <path d="M 3 31 Q 9 28, 15 31" fill="none" stroke="#EFE0B8" strokeWidth="0.9" opacity="0.18" />
        </pattern>

        {/* Peatland Marsh Stipple & Wetland Horizontal Hatch */}
        <pattern id={`${uid}_marshStipple`} width="26" height="24" patternUnits="userSpaceOnUse">
          <circle cx="5" cy="6" r="1.1" fill="#182C1E" opacity="0.52" />
          <circle cx="17" cy="4" r="0.9" fill="#25422E" opacity="0.46" />
          <circle cx="21" cy="14" r="1.2" fill="#182C1E" opacity="0.48" />
          <line x1="3" y1="12" x2="12" y2="12" stroke="#1E3624" strokeWidth="1.0" opacity="0.42" />
          <line x1="13" y1="20" x2="23" y2="20" stroke="#76A470" strokeWidth="0.9" opacity="0.34" />
        </pattern>

        {/* Subtle Ocean Gouache Horizontal Water Lines */}
        <pattern id={`${uid}_seaLines`} width="720" height="54" patternUnits="userSpaceOnUse">
          <line x1="0" y1="9" x2="280" y2="9" stroke="#C6E4E8" strokeWidth="1.4" strokeOpacity="0.06" />
          <line x1="340" y1="21" x2="690" y2="21" stroke="#0B1E2B" strokeWidth="1.6" strokeOpacity="0.09" />
          <line x1="120" y1="35" x2="520" y2="35" stroke="#C6E4E8" strokeWidth="1.3" strokeOpacity="0.055" />
          <line x1="480" y1="47" x2="720" y2="47" stroke="#0B1E2B" strokeWidth="1.5" strokeOpacity="0.08" />
        </pattern>

        <filter id={`${uid}_shelfBlur`} x="-15%" y="-15%" width="130%" height="130%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <filter id={`${uid}_biomeBlur`} x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
        <filter id={`${uid}_softBlur`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id={`${uid}_landShadow`} x="-10%" y="-10%" width="125%" height="125%">
          <feDropShadow dx="4" dy="6" stdDeviation="5" floodColor="#091B26" floodOpacity="0.48" />
        </filter>

        <clipPath id={`${uid}_indoClip`}>
          {indoPaths.map((feat) => (
            <path key={`cp_${feat.key}`} d={feat.d} />
          ))}
        </clipPath>
      </defs>

      {/* === LAYER 1: PAINTED OCEAN BATHYMETRY, SUNDA TRENCH & NAUTICAL RHUMB LINES === */}
      <rect x={-40} y={-40} width={800} height={1360} fill={`url(#${uid}_ocean)`} />
      <rect x={-40} y={-40} width={800} height={1360} fill={`url(#${uid}_seaLines)`} />

      <g stroke="#E6DFC8" strokeOpacity={0.075} strokeWidth={1}>
        {Array.from({ length: 16 }).map((_, ri) => {
          const ang = (ri * Math.PI) / 8;
          return <line key={ri} x1={115} y1={890} x2={115 + Math.cos(ang) * 1100} y2={890 + Math.sin(ang) * 1100} />;
        })}
      </g>

      {/* Vintage Lat/Lon Graticule + Equator Line */}
      <g stroke="#FAF0D8" strokeOpacity={0.13} strokeWidth={1} strokeDasharray="3 7">
        {lonTicks.map((lt) => (
          <line key={`lon_${lt.lon}`} x1={lt.x} y1={0} x2={lt.x} y2={1280} />
        ))}
        {[220, 390, 560, 730, 900, 1070].map((gy) => (
          <line key={`lat_${gy}`} x1={0} y1={gy} x2={720} y2={gy} />
        ))}
      </g>

      {/* === LAYER 2: 3-STEP COASTAL BATHYMETRY SHOALS & SURF RIPPLES === */}
      <g filter={`url(#${uid}_shelfBlur)`} opacity={0.54}>
        {[...neighborPaths, ...indoPaths].map((feat) => (
          <path key={`sh1_${feat.key}`} d={feat.d} fill="none" stroke="#3D7E94" strokeWidth={36} strokeLinejoin="round" />
        ))}
      </g>
      <g opacity={0.48}>
        {[...neighborPaths, ...indoPaths].map((feat) => (
          <path key={`sh2_${feat.key}`} d={feat.d} fill="none" stroke="#68A9B8" strokeWidth={13} strokeLinejoin="round" />
        ))}
      </g>
      <g opacity={0.38}>
        {indoPaths.map((feat) => (
          <path
            key={`sh3_${feat.key}`}
            d={feat.d}
            fill="none"
            stroke="#C2DFE0"
            strokeWidth={3.5}
            strokeDasharray="6 5"
            strokeLinejoin="round"
          />
        ))}
      </g>

      {/* === LAYER 3: NEIGHBORING COUNTRIES === */}
      <g filter={`url(#${uid}_landShadow)`}>
        {neighborPaths.map((feat) => (
          <path
            key={feat.key}
            d={feat.d}
            fill="#8D8266"
            stroke="#2B231C"
            strokeWidth={1.2}
            strokeLinejoin="round"
            opacity={0.86}
          />
        ))}
      </g>

      {/* === LAYER 4: RAISED INDONESIA LANDMASS + CLIPPED MULTI-BIOME TOPOGRAPHIC RELIEF === */}
      <g filter={`url(#${uid}_landShadow)`}>
        {indoPaths.map((feat) => (
          <path key={`base_${feat.key}`} d={feat.d} fill={`url(#${uid}_land)`} />
        ))}
      </g>

      <g clipPath={`url(#${uid}_indoClip)`}>
        {/* 4A. Painted Tropical Rainforest Canopy Watercolor Washes */}
        <g filter={`url(#${uid}_biomeBlur)`} opacity={0.76}>
          {RAINFOREST_PATCHES.map((rp, ri) => {
            const pt = projection(rp.c);
            if (!pt) return null;
            return (
              <ellipse
                key={ri}
                cx={pt[0]}
                cy={pt[1]}
                rx={Math.max(20, rp.rx * degToPx)}
                ry={Math.max(15, rp.ry * degToPx)}
                fill={rp.col}
              />
            );
          })}
        </g>

        {/* 4B. Soft Hypsometric Highland Plateau Contours (Subtle warm elevation relief beneath mountain peaks!) */}
        <g filter={`url(#${uid}_biomeBlur)`} opacity={0.54}>
          {HIGHLAND_PLATEAUS.map((hp, hi) => {
            const pt = projection(hp.c);
            if (!pt) return null;
            return (
              <ellipse
                key={hi}
                cx={pt[0]}
                cy={pt[1]}
                rx={Math.max(12, hp.rx * degToPx)}
                ry={Math.max(10, hp.ry * degToPx)}
                transform={`rotate(${hp.rot} ${pt[0].toFixed(1)} ${pt[1].toFixed(1)})`}
                fill="#A88D56"
              />
            );
          })}
        </g>

        {/* 4C. Fine Stippled Organic Rainforest & Parchment Land Texture Across All Islands! */}
        <rect x={-40} y={-40} width={800} height={1360} fill={`url(#${uid}_landTexture)`} />

        {/* 4D. Ecological Tropical Peatland Zones (Deep Rich Mossy Peat + Stippled Wetland Hatch + Contour Rings!) */}
        {PEAT_ZONES.map((pz) => {
          const pt = projection(pz.center);
          if (!pt) return null;
          const rx = Math.max(16, pz.rxDeg * degToPx);
          const ry = Math.max(12, pz.ryDeg * degToPx);
          return (
            <g key={pz.id} transform={`translate(${pt[0].toFixed(1)}, ${pt[1].toFixed(1)}) rotate(${pz.rot})`}>
              <ellipse cx={0} cy={0} rx={rx * 1.18} ry={ry * 1.18} fill="#264734" opacity={0.62} filter={`url(#${uid}_softBlur)`} />
              <ellipse cx={0} cy={0} rx={rx} ry={ry} fill={`url(#${uid}_marshStipple)`} opacity={0.94} />
              <ellipse cx={0} cy={0} rx={rx * 0.78} ry={ry * 0.74} fill="none" stroke="#789D6C" strokeWidth={1.1} strokeDasharray="4 4" opacity={0.58} />
              <ellipse cx={0} cy={0} rx={rx * 0.45} ry={ry * 0.42} fill="none" stroke="#8CB27E" strokeWidth={0.9} strokeDasharray="3 4" opacity={0.48} />
            </g>
          );
        })}

        {/* 4E. REAL PROJECTED INDONESIAN RIVER NETWORKS (Sebangau, Kahayan, Kapuas, Barito, Kampar, Siak, Indragiri, Musi!) */}
        <g>
          {riverPaths.map((rv) => (
            <g key={rv.name}>
              <path d={rv.d} fill="none" stroke="#194456" strokeWidth={Math.max(2.2, degToPx * 0.055)} strokeLinecap="round" opacity={0.52} />
              <path d={rv.d} fill="none" stroke="#7CC0CC" strokeWidth={Math.max(1.2, degToPx * 0.028)} strokeLinecap="round" opacity={0.86} />
            </g>
          ))}
        </g>

        {/* 4F. HAND-ILLUSTRATED CARTOGRAPHIC MOUNTAIN PEAKS (Sculpted NW-lit / SE-shadowed vintage physical atlas relief — ZERO sausage tubes!) */}
        <g>
          {CARTO_PEAKS.map((pk, pi) => {
            const pt = projection(pk.c);
            if (!pt || pt[0] < -40 || pt[0] > 760 || pt[1] < -40 || pt[1] > 1320) return null;
            const s = clamp(degToPx / 46, 0.52, 1.45) * pk.sz;
            const w = 19 * s;
            const h = 15 * s;
            const tilt = ((pk.seed % 3) - 1) * 2.2 * s;
            return (
              <g key={pi} transform={`translate(${pt[0].toFixed(1)}, ${pt[1].toFixed(1)})`}>
                {/* Soft SE cast ground shadow */}
                <ellipse cx={w * 0.25} cy={h * 0.22} rx={w * 0.95} ry={h * 0.28} fill="#2A241C" opacity={0.28} />
                {/* Sculpted Vintage Cartographic Peak — Sunlit NW Face */}
                <path
                  d={`M ${(-w).toFixed(1)} ${(h * 0.2).toFixed(1)} Q ${(-w * 0.45).toFixed(1)} ${(-h * 0.2).toFixed(1)}, ${tilt.toFixed(1)} ${(-h).toFixed(1)} L ${(tilt + w * 0.16).toFixed(1)} ${(h * 0.25).toFixed(1)} Z`}
                  fill="#DEC794"
                  opacity={0.92}
                />
                {/* Shaded SE Slope Face (Directional Hillshade!) */}
                <path
                  d={`M ${tilt.toFixed(1)} ${(-h).toFixed(1)} Q ${(w * 0.48).toFixed(1)} ${(-h * 0.18).toFixed(1)}, ${w.toFixed(1)} ${(h * 0.22).toFixed(1)} L ${(tilt + w * 0.16).toFixed(1)} ${(h * 0.25).toFixed(1)} Z`}
                  fill="#5B4B3A"
                  opacity={0.86}
                />
                {/* Secondary Mini Foothill Spur */}
                <path
                  d={`M ${(w * 0.32).toFixed(1)} ${(h * 0.22).toFixed(1)} L ${(w * 0.72).toFixed(1)} ${(-h * 0.42).toFixed(1)} L ${(w * 1.15).toFixed(1)} ${(h * 0.24).toFixed(1)} Z`}
                  fill="#6E5D46"
                  opacity={0.76}
                />
                {/* Crisp Delicate Ridge Ink Crest Accent */}
                <path
                  d={`M ${(-w * 0.78).toFixed(1)} ${(h * 0.12).toFixed(1)} L ${tilt.toFixed(1)} ${(-h).toFixed(1)} L ${(w * 0.82).toFixed(1)} ${(h * 0.14).toFixed(1)}`}
                  fill="none"
                  stroke="#362A20"
                  strokeWidth={1.0}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.62}
                />
              </g>
            );
          })}
        </g>

        {/* 4G. Warm Sunlit Inner Coastal Bevel & Fine Grain */}
        {indoPaths.map((feat) => (
          <path
            key={`bev_${feat.key}`}
            d={feat.d}
            fill="none"
            stroke="#F2E4BC"
            strokeWidth={3.8}
            strokeLinejoin="round"
            opacity={0.34}
          />
        ))}
        <rect x={-40} y={-40} width={800} height={1360} fill={`url(#${uid}_seaLines)`} opacity={0.65} />
      </g>

      {/* Crisp Hand-Inked Sepia Coastline Outline */}
      <g>
        {indoPaths.map((feat) => (
          <path
            key={`ink_${feat.key}`}
            d={feat.d}
            fill="none"
            stroke="#2B2118"
            strokeWidth={1.55}
            strokeLinejoin="round"
          />
        ))}
      </g>

      {/* Equator Line Drawn Cleanly Over Map with Crisp Dark Halo */}
      {eqY > 40 && eqY < 1180 && (
        <g opacity={0.58}>
          <line x1={0} y1={eqY} x2={720} y2={eqY} stroke="#F6E2A8" strokeWidth={1.25} strokeDasharray="10 6" />
          <text
            x={22}
            y={eqY - 6}
            textAnchor="start"
            fill="#F6E2A8"
            stroke="#132D3E"
            strokeWidth={3.2}
            paintOrder="stroke fill"
            fontFamily='"Plus Jakarta Sans", sans-serif'
            fontSize={10.5}
            fontWeight={800}
            letterSpacing="2px"
          >
            0° KHATULISTIWA
          </text>
        </g>
      )}

      {/* === LAYER 5: ACTIVE SCIENTIFIC REGION HIGHLIGHT HALOS, DRILL DOTS & TRACKING ARC === */}
      {highlightZone !== 'none' && highlightT > 0.01 && (
        <g opacity={easeOutCubic(highlightT)}>
          {(highlightZone === 'sebangau' || highlightZone === 'both') && (() => {
            const pt = projection(ID_COORDS.sebangau);
            if (!pt) return null;
            const p = 1 + 0.14 * Math.sin(f * 0.14);
            return (
              <g transform={`translate(${pt[0].toFixed(1)}, ${pt[1].toFixed(1)})`}>
                <circle r={42 * p} fill="#F4C852" opacity={0.22} filter={`url(#${uid}_softBlur)`} />
                <circle r={26 * p} fill="none" stroke="#FAF1DC" strokeWidth={2.0} strokeDasharray="6 4" opacity={0.88} />
                <circle r={38} fill="none" stroke="#F8D348" strokeWidth={1.4} opacity={0.45} />
              </g>
            );
          })()}

          {(highlightZone === 'sumatra_central' || highlightZone === 'both') && (() => {
            const pt = projection(ID_COORDS.sumatraCentral);
            if (!pt) return null;
            const p = 1 + 0.12 * Math.sin(f * 0.14 + 1.2);
            return (
              <g transform={`translate(${pt[0].toFixed(1)}, ${pt[1].toFixed(1)})`}>
                <ellipse rx={54 * p} ry={40 * p} transform="rotate(28)" fill="#F4C852" opacity={0.24} filter={`url(#${uid}_softBlur)`} />
                <ellipse rx={42 * p} ry={30 * p} transform="rotate(28)" fill="none" stroke="#FAF1DC" strokeWidth={2.0} strokeDasharray="7 5" opacity={0.9} />
              </g>
            );
          })()}

          {highlightZone === 'sumatra_field' && (() => {
            const pt = projection(ID_COORDS.sumatraField);
            if (!pt) return null;
            const p = 1 + 0.18 * Math.sin(f * 0.18);
            return (
              <g transform={`translate(${pt[0].toFixed(1)}, ${pt[1].toFixed(1)})`}>
                <circle r={56 * p} fill="#E65222" opacity={0.28} filter={`url(#${uid}_softBlur)`} />
                <circle r={34 * p} fill="none" stroke="#F8A444" strokeWidth={2.2} strokeDasharray="6 4" opacity={0.92} />
              </g>
            );
          })()}
        </g>
      )}

      {arcPathD && flightArc && (
        <g>
          <path
            d={arcPathD}
            fill="none"
            stroke="#241C1B"
            strokeWidth={5.5}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray="1"
            strokeDashoffset={1 - easeOutCubic(flightArc.progress)}
            opacity={0.45}
          />
          <path
            d={arcPathD}
            fill="none"
            stroke="#F8D348"
            strokeWidth={3.0}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray="1"
            strokeDashoffset={1 - easeOutCubic(flightArc.progress)}
          />
        </g>
      )}

      {drillDots.map((dd, di) => {
        if (dd.appearT <= 0.01) return null;
        const pt = projection(dd.coord);
        if (!pt) return null;
        const t = easeOutCubic(dd.appearT);
        return (
          <g key={di} transform={`translate(${pt[0].toFixed(1)}, ${pt[1].toFixed(1)}) scale(${lerp(0.2, 1, t).toFixed(2)})`} opacity={t}>
            <circle r={11} fill="#F8D348" opacity={0.28} />
            <circle r={5.2} fill="#E87428" stroke="#FAF1DC" strokeWidth={1.8} />
            <circle r={6.8} fill="none" stroke="#241C1B" strokeWidth={1.1} />
          </g>
        );
      })}

      {/* Animated Research Location Pins & Crisp Vintage Slab/Editorial Labels (Clean Clearance Above Pin!) */}
      {pins.map((pin) => {
        const pt = projection(pin.coord);
        if (!pt || pin.appearT <= 0.01) return null;
        const t = easeOutCubic(pin.appearT);
        const dir = pin.labelDir ?? 'top';
        const lx = dir === 'left' ? -18 : dir === 'right' ? 18 : 0;
        const ly = dir === 'top' ? (pin.sublabel ? -38 : -24) : dir === 'bottom' ? 36 : 7;
        const anchor = dir === 'left' ? 'end' : dir === 'right' ? 'start' : 'middle';
        const col = pin.color ?? '#D23B26';
        const pulse = 1 + 0.22 * Math.sin(f * 0.16 + pt[0] * 0.04);

        return (
          <g key={pin.id} transform={`translate(${pt[0].toFixed(1)}, ${pt[1].toFixed(1)})`} opacity={t}>
            <circle r={15 * pulse} fill={col} opacity={0.34} />
            <circle r={7.5} fill={col} stroke={GP.cream} strokeWidth={2.2} />
            <circle r={9.6} fill="none" stroke={GP.ink} strokeWidth={1.3} />
            {pin.slab ? (
              <g>
                <SvgSlabLabel x={lx} y={ly} text={pin.label} fontSize={26} anchor={anchor} scale={lerp(0.84, 1.0, t)} />
                {pin.sublabel && (
                  <text
                    x={lx}
                    y={ly + 19}
                    textAnchor={anchor}
                    fill="#F8D348"
                    stroke={GP.ink}
                    strokeWidth={3.4}
                    paintOrder="stroke fill"
                    fontFamily='"Plus Jakarta Sans", sans-serif'
                    fontSize={12.5}
                    fontWeight={800}
                    letterSpacing="2.2px"
                  >
                    {pin.sublabel}
                  </text>
                )}
              </g>
            ) : (
              <g transform={`translate(${lx}, ${ly})`}>
                <text
                  textAnchor={anchor}
                  fill={GP.cream}
                  stroke={GP.ink}
                  strokeWidth={3.6}
                  paintOrder="stroke fill"
                  fontFamily='"Plus Jakarta Sans", sans-serif'
                  fontSize={14.5}
                  fontWeight={800}
                  letterSpacing="2.2px"
                >
                  {pin.label}
                </text>
                {pin.sublabel && (
                  <text
                    y={16}
                    textAnchor={anchor}
                    fill="#F8D348"
                    stroke={GP.ink}
                    strokeWidth={3}
                    paintOrder="stroke fill"
                    fontFamily='"Plus Jakarta Sans", sans-serif'
                    fontSize={11}
                    fontWeight={700}
                    letterSpacing="1.8px"
                  >
                    {pin.sublabel}
                  </text>
                )}
              </g>
            )}
          </g>
        );
      })}

      {/* === LAYER 6: ANTIQUE CARTOGRAPHIC BRASS COMPASS ROSE, LON TICKS & SCALE BAR === */}
      <g opacity={0.48}>
        <line x1={24} y1={42} x2={696} y2={42} stroke="#EFE6D3" strokeWidth={1.1} />
        {lonTicks.map((lt) => (
          <g key={`tk_${lt.lon}`} transform={`translate(${lt.x.toFixed(1)}, 42)`}>
            <line x1={0} y1={0} x2={0} y2={7} stroke="#EFE6D3" strokeWidth={1.2} />
            <text
              y={-5}
              textAnchor="middle"
              fill="#EFE6D3"
              fontFamily='"Plus Jakarta Sans", sans-serif'
              fontSize={9.5}
              fontWeight={700}
              letterSpacing="1px"
            >
              {lt.lon}°BT
            </text>
          </g>
        ))}
      </g>

      <g transform="translate(628, 912)" opacity={0.68}>
        <circle r={34} fill="#142C3B" fillOpacity={0.55} stroke="#E8D8B2" strokeWidth={1.5} />
        <circle r={27} fill="none" stroke="#E8D8B2" strokeWidth={0.9} strokeDasharray="3 3" />
        <polygon points="-18,-18 -4,-7 -7,-4" fill="#C9B890" />
        <polygon points="18,-18 7,-4 4,-7" fill="#C9B890" />
        <polygon points="-18,18 -7,4 -4,7" fill="#C9B890" />
        <polygon points="18,18 4,7 7,4" fill="#C9B890" />
        <polygon points="0,-38 6,-6 0,-11 -6,-6" fill="#D23B26" stroke="#241C1B" strokeWidth={1} />
        <polygon points="0,38 5,6 0,11 -5,6" fill="#FAF1DC" stroke="#241C1B" strokeWidth={1} />
        <polygon points="-38,0 -6,-5 -11,0 -6,5" fill="#FAF1DC" stroke="#241C1B" strokeWidth={1} />
        <polygon points="38,0 6,-5 11,0 6,5" fill="#FAF1DC" stroke="#241C1B" strokeWidth={1} />
        <circle r={3.5} fill="#F8D348" stroke="#241C1B" strokeWidth={1} />
        <text y={-44} textAnchor="middle" fill="#FAF1DC" fontSize={12} fontFamily='"Alfa Slab One", serif'>
          U
        </text>
      </g>

      {scaleBarLabel && scaleBarProgress > 0.01 && (
        <g transform="translate(175, 922)" opacity={clamp(scaleBarProgress * 1.4, 0, 1)}>
          {Array.from({ length: 4 }).map((_, si) => (
            <rect
              key={si}
              x={-100 + si * 50}
              y={-5}
              width={50}
              height={10}
              fill={si % 2 === 0 ? '#C83426' : '#FAF1DC'}
              stroke="#241C1B"
              strokeWidth={1.6}
            />
          ))}
          <text
            x={0}
            y={22}
            textAnchor="middle"
            fill="#FAF1DC"
            stroke="#241C1B"
            strokeWidth={3}
            paintOrder="stroke fill"
            fontFamily='"Plus Jakarta Sans", sans-serif'
            fontSize={12}
            fontWeight={800}
            letterSpacing="2px"
          >
            {scaleBarLabel}
          </text>
        </g>
      )}

      {smokeMood > 0.01 && (
        <rect x={-40} y={-40} width={800} height={1360} fill="#463834" opacity={smokeMood * 0.24} style={{ mixBlendMode: 'multiply' }} />
      )}
    </g>
  );
};
