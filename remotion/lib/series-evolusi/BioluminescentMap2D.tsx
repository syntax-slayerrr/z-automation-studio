import React, { useMemo } from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { geoMercator, geoPath } from 'd3-geo';
import type { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import { EVOLUTION_TOKENS } from './tokens';

export interface BioluminescentMap2DProps {
  /** GeoJSON FeatureCollection of islands / countries / regions */
  geoData: FeatureCollection<Geometry, GeoJsonProperties>;
  /** [longitude, latitude] center of the target habitat */
  centerLonLat: [number, number];
  /** Base Mercator scale for 1080x1920 */
  projectionScale?: number;
  zoomStart?: number;
  zoomEnd?: number;
  durationInFrames?: number;
}

/**
 * 1:1 Textured Bioluminescent Cartographic Map (`BioluminescentMap2D`)
 * Upgraded to match `ref_03_village.png` ("dari Sulawesi") 1:1:
 * - Mottled organic topographic relief texture (`feTurbulence` + shaded hills) inside forest-green landmasses!
 * - Rich mottled bathymetric ocean depth shading!
 * - 2-layer glowing bioluminescent coastline (crisp pale-mint inner shore + soft neon-cyan outer halo)!
 */
export const BioluminescentMap2D: React.FC<BioluminescentMap2DProps> = ({
  geoData,
  centerLonLat,
  projectionScale = 5200,
  zoomStart = 1.0,
  zoomEnd = 1.08,
  durationInFrames = 60,
}) => {
  const frame = useCurrentFrame();
  const { width, height, instruments } = EVOLUTION_TOKENS;
  const m = instruments.map;

  const pathD = useMemo(() => {
    const projection = geoMercator()
      .center(centerLonLat)
      .scale(projectionScale)
      .translate([width * 0.5, height * 0.54]);
    const pathGen = geoPath().projection(projection);
    return geoData.features.map((feat) => pathGen(feat) || '').filter(Boolean);
  }, [centerLonLat, geoData, height, projectionScale, width]);

  const zoom = interpolate(frame, [0, Math.max(1, durationInFrames)], [zoomStart, zoomEnd], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 52% 48%, ${m.oceanShelf} 0%, ${m.oceanDeep} 74%, #002042 100%)`,
        overflow: 'hidden',
      }}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{
          transform: `scale(${zoom.toFixed(4)})`,
          transformOrigin: '50% 52%',
        }}
      >
        <defs>
          <filter id="evolusi-coast-glow" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="14" result="blurOuter" />
            <feMerge>
              <feMergeNode in="blurOuter" />
              <feMergeNode in="blurOuter" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Organic Terrain Relief & Forest Mottling Filter (matches ref_03_village.png!) */}
          <filter id="evolusi-terrain-mottle" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.011"
              numOctaves="4"
              seed="19"
              result="turb"
            />
            <feColorMatrix
              type="matrix"
              values="
                0.28 0 0 0 0.08
                0 0.42 0 0 0.24
                0 0 0.22 0 0.07
                0 0 0 0.46 0"
              in="turb"
              result="relief"
            />
            <feBlend mode="overlay" in="SourceGraphic" in2="relief" />
          </filter>

          {/* Bathymetric Ocean Shelf Mottling */}
          <filter id="evolusi-ocean-mottle" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.007"
              numOctaves="3"
              seed="42"
              result="oturb"
            />
            <feColorMatrix
              type="matrix"
              values="
                0.05 0 0 0 0.0
                0 0.26 0 0 0.14
                0 0 0.48 0 0.24
                0 0 0 0.35 0"
              in="oturb"
            />
          </filter>

          <radialGradient id="evolusi-land-grad" cx="44%" cy="38%" r="68%">
            <stop offset="0%" stopColor="#2D6E37" />
            <stop offset="58%" stopColor={m.landBase} />
            <stop offset="100%" stopColor="#12401B" />
          </radialGradient>

          <clipPath id="evolusi-land-clip">
            {pathD.map((d, idx) => (
              <path key={`clip-${idx}`} d={d} />
            ))}
          </clipPath>
        </defs>

        {/* Subtle Bathymetric Ocean Shelf Mottling Layer */}
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          filter="url(#evolusi-ocean-mottle)"
          opacity={0.75}
        />

        {/* Outer Neon-Cyan Bioluminescent Shelf Glow */}
        <g filter="url(#evolusi-coast-glow)">
          {pathD.map((d, idx) => (
            <path
              key={`glow-${idx}`}
              d={d}
              fill="none"
              stroke={m.shoreGlow}
              strokeWidth={11}
              strokeLinejoin="round"
              opacity={0.92}
            />
          ))}
        </g>

        {/* Mottled Topographic Forest-Green Landmasses */}
        <g filter="url(#evolusi-terrain-mottle)">
          {pathD.map((d, idx) => (
            <path
              key={`land-${idx}`}
              d={d}
              fill="url(#evolusi-land-grad)"
              stroke="none"
            />
          ))}
        </g>

        {/* Crisp Pale-Mint Inner Shoreline & Inner Rim Shadow */}
        <g>
          {pathD.map((d, idx) => (
            <path
              key={`shore-${idx}`}
              d={d}
              fill="none"
              stroke={m.shoreInner}
              strokeWidth={3.4}
              strokeLinejoin="round"
            />
          ))}
        </g>
      </svg>
    </AbsoluteFill>
  );
};
