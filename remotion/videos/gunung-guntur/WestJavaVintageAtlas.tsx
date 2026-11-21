import React, { useMemo } from 'react';
import { geoInterpolate, geoMercator, geoPath } from 'd3-geo';
import islandsRaw from './indonesia_islands.json';
import { clamp, easeOutCubic, lerp, SvgSlabLabel, VP } from './fx';

interface GeoFeature {
  type: 'Feature';
  properties: { country: string; island: string };
  geometry: { type: 'Polygon'; coordinates: number[][][] };
}

const FEATURES = (islandsRaw as { features: GeoFeature[] }).features;

/** Exact real West Java / Parahyangan geographic coordinates [lng, lat] */
export const WJ_COORDS = {
  guntur: [107.84, -7.143] as [number, number],
  garut: [107.901, -7.216] as [number, number],
  cipanas: [107.882, -7.168] as [number, number],
  bandung: [107.619, -6.917] as [number, number],
  cianjur: [107.142, -6.817] as [number, number],
  batavia: [106.845, -6.208] as [number, number],
  tasik: [108.22, -7.327] as [number, number],
};

export interface AtlasPin {
  id: string;
  label: string;
  sublabel?: string;
  coord: [number, number];
  appearT: number;
  slab?: boolean;
  labelDir?: 'top' | 'bottom' | 'left' | 'right';
  color?: string;
}

export interface WestJavaVintageAtlasProps {
  f: number;
  center: [number, number];
  scale: number;
  centerY?: number;
  pins?: AtlasPin[];
  /** 1:1 Danau Toba style 3D-stacked corkscrewing painted volcanic ash plume along great-circle path! */
  ashPlume?: {
    from: [number, number];
    to: [number, number];
    progress: number; // 0..1
  };
  /** Glowing animated lava path (e.g. Puncak Guntur -> Cipanas 1840) */
  lavaRoute?: {
    from: [number, number];
    to: [number, number];
    progress: number;
  };
  /** Optional sepia parchment colonial aging wash (for Scene 2 19th-century map) */
  colonialTint?: number;
}

/**
 * 1:1 Vintage Painted Atlas Map (`d3-geo` + real GeoJSON) matching Danau Toba's
 * painted ocean bathymetry (#244F68 / #4D859C), ochre landmasses (#B49862),
 * sepia ink coastlines (#2E241C), miniature painted highland triangles, and 3D corkscrew ash plume!
 */
export const WestJavaVintageAtlas: React.FC<WestJavaVintageAtlasProps> = ({
  f,
  center,
  scale,
  centerY = 585,
  pins = [],
  ashPlume,
  lavaRoute,
  colonialTint = 0,
}) => {
  const { projection, paths } = useMemo(() => {
    const proj = geoMercator().center(center).scale(scale).translate([360, centerY]);
    const pathGen = geoPath(proj);
    const computed = FEATURES.map((feat, idx) => ({
      key: `${feat.properties.country}_${feat.properties.island}_${idx}`,
      d: pathGen(feat as any) || '',
      isIndonesia: feat.properties.country === 'Indonesia',
    }));
    return { projection: proj, paths: computed };
  }, [center[0], center[1], scale, centerY]);

  // Decorative vintage atlas highland mountain icons across Parahyangan/Priangan
  const mountainIcons: Array<[number, number]> = [
    [107.61, -6.77], // Tangkuban Perahu
    [107.75, -7.22], // Papandayan
    [108.05, -7.25], // Galunggung
    [108.40, -6.89], // Ciremai
    [106.98, -6.78], // Gede-Pangrango
    [107.45, -7.12], // Patuha
  ];

  // Build 3D-stacked corkscrewing painted volcanic ash plume discs (1:1 Danau Toba Toba->India craft!)
  const plumeDiscs = useMemo(() => {
    if (!ashPlume || ashPlume.progress <= 0.01) return [];
    const interp = geoInterpolate(ashPlume.from, ashPlume.to);
    const total = 26;
    const shown = Math.max(1, Math.floor(clamp(ashPlume.progress, 0, 1) * total));
    const arr: Array<{ x: number; y: number; r: number; u: number; idx: number }> = [];
    for (let i = 0; i < shown; i++) {
      const u = i / (total - 1);
      const pt = projection(interp(u));
      if (!pt) continue;
      // Subtle graceful arch & billowing expansion toward destination
      const archY = -Math.sin(u * Math.PI) * 24;
      const swirlX = Math.sin(u * 14 + f * 0.08) * (3 + u * 6);
      const r = lerp(11, 34, Math.pow(u, 0.72));
      arr.push({ x: pt[0] + swirlX, y: pt[1] + archY, r, u, idx: i });
    }
    return arr;
  }, [ashPlume?.from[0], ashPlume?.from[1], ashPlume?.to[0], ashPlume?.to[1], ashPlume?.progress, projection, f]);

  const lavaPathD = useMemo(() => {
    if (!lavaRoute || lavaRoute.progress <= 0.01) return '';
    const interp = geoInterpolate(lavaRoute.from, lavaRoute.to);
    const pts: string[] = [];
    for (let i = 0; i <= 18; i++) {
      const u = i / 18;
      const pt = projection(interp(u));
      if (!pt) continue;
      const wiggle = Math.sin(u * Math.PI * 3) * 8;
      pts.push(`${i === 0 ? 'M' : 'L'} ${(pt[0] + wiggle).toFixed(1)} ${(pt[1] + wiggle * 0.4).toFixed(1)}`);
    }
    return pts.join(' ');
  }, [lavaRoute?.from[0], lavaRoute?.from[1], lavaRoute?.to[0], lavaRoute?.to[1], lavaRoute?.progress, projection]);

  return (
    <g>
      <defs>
        <radialGradient id="wjOceanGrad" cx="50%" cy="48%" r="65%">
          <stop offset="0%" stopColor="#2F627C" />
          <stop offset="68%" stopColor="#244F68" />
          <stop offset="100%" stopColor="#1B3C50" />
        </radialGradient>
        <linearGradient id="wjLandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C4AA72" />
          <stop offset="55%" stopColor="#B49862" />
          <stop offset="100%" stopColor="#9A7E4B" />
        </linearGradient>
        <filter id="wjAshBlur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>

      {/* Painted Vintage Atlas Ocean */}
      <rect x={-40} y={-40} width={800} height={1360} fill="url(#wjOceanGrad)" />

      {/* Faint Vintage Atlas Lat/Lon Graticule Grid */}
      <g stroke="#FAF0D8" strokeOpacity={0.14} strokeWidth={1} strokeDasharray="4 6">
        {[180, 320, 460, 600, 740, 880, 1020].map((gy) => (
          <line key={`h_${gy}`} x1={0} y1={gy} x2={720} y2={gy} />
        ))}
        {[120, 240, 360, 480, 600].map((gx) => (
          <line key={`v_${gx}`} x1={gx} y1={0} x2={gx} y2={1280} />
        ))}
      </g>

      {/* Coastal Bathymetry Shelf Halo (1:1 Danau Toba Bright Teal Coastal Ring!) */}
      <g opacity={0.48}>
        {paths.map((feat) =>
          feat.d ? (
            <path key={`sh_${feat.key}`} d={feat.d} fill="none" stroke={VP.atlasShelf} strokeWidth={24} strokeLinejoin="round" />
          ) : null
        )}
      </g>
      <g opacity={0.28}>
        {paths.map((feat) =>
          feat.d ? (
            <path key={`sh2_${feat.key}`} d={feat.d} fill="none" stroke="#76AEBF" strokeWidth={10} strokeLinejoin="round" />
          ) : null
        )}
      </g>

      {/* Painted Ochre Landmasses + Sepia Ink Coastlines */}
      <g>
        {paths.map((feat) =>
          feat.d ? (
            <path
              key={feat.key}
              d={feat.d}
              fill={feat.isIndonesia ? 'url(#wjLandGrad)' : '#9C8A62'}
              stroke={VP.atlasBorder}
              strokeWidth={2.0}
              strokeLinejoin="round"
            />
          ) : null
        )}
      </g>

      {/* Tiny Hand-Painted Vintage Atlas Mountain Triangles */}
      <g opacity={0.72}>
        {mountainIcons.map((coord, mi) => {
          const pt = projection(coord);
          if (!pt || pt[0] < -20 || pt[0] > 740 || pt[1] < -20 || pt[1] > 1300) return null;
          return (
            <g key={mi} transform={`translate(${pt[0].toFixed(1)}, ${pt[1].toFixed(1)})`}>
              <polygon points="-11,6 0,-11 11,6" fill="#8D7144" stroke={VP.atlasBorder} strokeWidth={1.3} />
              <polygon points="0,-11 11,6 2,6" fill="#6B5330" />
            </g>
          );
        })}
      </g>

      {/* Glowing Molten Lava Stream Path on Atlas (Scene 3 Guntur -> Cipanas) */}
      {lavaPathD && lavaRoute && (
        <g>
          <path
            d={lavaPathD}
            fill="none"
            stroke="#C8321E"
            strokeWidth={12}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray="1"
            strokeDashoffset={1 - easeOutCubic(lavaRoute.progress)}
            opacity={0.75}
          />
          <path
            d={lavaPathD}
            fill="none"
            stroke="#F89B2E"
            strokeWidth={6}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray="1"
            strokeDashoffset={1 - easeOutCubic(lavaRoute.progress)}
          />
          <path
            d={lavaPathD}
            fill="none"
            stroke="#FFF2A8"
            strokeWidth={2.2}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray="1"
            strokeDashoffset={1 - easeOutCubic(lavaRoute.progress)}
          />
        </g>
      )}

      {/* 1:1 LINELESS WIND-SWEPT BILLOWING VOLCANIC ASH CLOUD CONE (Garut -> Cianjur, zero caterpillar segments!) */}
      {plumeDiscs.length > 0 && (
        <g>
          {/* Soft atmospheric ground shadow cast over Parahyangan beneath ash cloud */}
          <g filter="url(#wjAshBlur)" opacity={0.34}>
            {plumeDiscs.map((d) => (
              <ellipse key={`sh_${d.idx}`} cx={d.x + 12} cy={d.y + 20} rx={d.r * 1.32} ry={d.r * 0.96} fill="#1E2530" />
            ))}
          </g>
          {/* Feathered outer translucent ash-fall veil expanding with wind */}
          <g filter="url(#wjAshBlur)" opacity={0.44}>
            {plumeDiscs.map((d) => (
              <ellipse
                key={`hz_${d.idx}`}
                cx={d.x + Math.sin(d.idx * 2.1) * d.r * 0.35}
                cy={d.y + Math.cos(d.idx * 2.7) * d.r * 0.28}
                rx={d.r * 1.48}
                ry={d.r * 1.15}
                fill="#5A586B"
              />
            ))}
          </g>
          {/* Irregular billowing multi-lobe painted ash cumulus clusters */}
          {plumeDiscs.map((d) => {
            if (d.idx % 2 === 1 && d.idx < plumeDiscs.length - 1) return null;
            const jx = Math.sin(d.idx * 3.7) * d.r * 0.32;
            const jy = Math.cos(d.idx * 2.9) * d.r * 0.24;
            const r = d.r * (1.05 + 0.24 * Math.abs(Math.sin(d.idx * 2.3)));
            return (
              <g key={d.idx} transform={`translate(${(d.x + jx).toFixed(1)}, ${(d.y + jy).toFixed(1)})`}>
                <ellipse cx={r * 0.34} cy={r * 0.22} rx={r * 1.04} ry={r * 0.78} fill="#4A4D60" />
                <circle cx={-r * 0.42} cy={r * 0.14} r={r * 0.74} fill="#646276" />
                <circle cx={r * 0.22} cy={-r * 0.18} r={r * 0.72} fill="#7A7686" />
                <ellipse cx={-r * 0.08} cy={-r * 0.04} rx={r * 0.92} ry={r * 0.72} fill="#888390" />
                <ellipse cx={-r * 0.22} cy={-r * 0.22} rx={r * 0.56} ry={r * 0.38} fill="#B8B2B4" opacity={0.82} />
                {d.u < 0.18 && <circle cx={0} cy={0} r={r * 0.55} fill="#E8742E" opacity={0.62} />}
              </g>
            );
          })}
          {/* Fine wind-blown drifting volcanic ash specks downwind near Cianjur */}
          {plumeDiscs.length > 6 &&
            Array.from({ length: 14 }).map((_, si) => {
              const tip = plumeDiscs[plumeDiscs.length - 1];
              const drift = ((f * 0.4 + si * 11) % 36);
              const sx = tip.x - 10 - drift * 1.4 + Math.sin(si * 5.1) * 32;
              const sy = tip.y - 6 - drift * 0.3 + Math.cos(si * 4.3) * 28;
              return <circle key={`sp_${si}`} cx={sx} cy={sy} r={1.8 + (si % 3) * 0.9} fill="#4C4A58" opacity={0.55} />;
            })}
        </g>
      )}

      {/* Animated Atlas City / Volcano Pins & Vintage Typography Labels */}
      {pins.map((pin) => {
        const pt = projection(pin.coord);
        if (!pt || pin.appearT <= 0.01) return null;
        const t = easeOutCubic(pin.appearT);
        const dir = pin.labelDir ?? 'top';
        const lx = dir === 'left' ? -18 : dir === 'right' ? 18 : 0;
        const ly = dir === 'top' ? -22 : dir === 'bottom' ? 32 : 8;
        const anchor = dir === 'left' ? 'end' : dir === 'right' ? 'start' : 'middle';
        const col = pin.color ?? '#C83426';
        const pulse = 1 + 0.22 * Math.sin(f * 0.16 + pt[0] * 0.05);

        return (
          <g key={pin.id} transform={`translate(${pt[0].toFixed(1)}, ${pt[1].toFixed(1)})`} opacity={t}>
            <circle cx={0} cy={0} r={14 * pulse} fill={col} opacity={0.32} />
            <circle cx={0} cy={0} r={7.5} fill={col} stroke={VP.cream} strokeWidth={2.2} />
            <circle cx={0} cy={0} r={9.5} fill="none" stroke={VP.ink} strokeWidth={1.3} />
            {pin.slab ? (
              <SvgSlabLabel x={lx} y={ly} text={pin.label} fontSize={30} anchor={anchor} scale={lerp(0.82, 1.0, t)} />
            ) : (
              <g transform={`translate(${lx}, ${ly})`}>
                <text
                  textAnchor={anchor}
                  fill={VP.cream}
                  stroke={VP.ink}
                  strokeWidth={3.5}
                  paintOrder="stroke fill"
                  fontFamily='"Plus Jakarta Sans", sans-serif'
                  fontSize={16}
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
                    stroke={VP.ink}
                    strokeWidth={3}
                    paintOrder="stroke fill"
                    fontFamily='"Plus Jakarta Sans", sans-serif'
                    fontSize={11.5}
                    fontWeight={700}
                    letterSpacing="2px"
                  >
                    {pin.sublabel}
                  </text>
                )}
              </g>
            )}
          </g>
        );
      })}

      {/* Vintage Compass Rose Watermark (Lower-Right Cartographic Flair) */}
      <g transform="translate(625, 865)" opacity={0.38}>
        <circle cx={0} cy={0} r={30} fill="none" stroke={VP.cream} strokeWidth={1.4} />
        <polygon points="0,-34 6,-6 0,-11 -6,-6" fill="#C83426" stroke={VP.ink} strokeWidth={1} />
        <polygon points="0,34 5,6 0,11 -5,6" fill={VP.cream} stroke={VP.ink} strokeWidth={1} />
        <polygon points="-34,0 -6,-5 -11,0 -6,5" fill={VP.cream} stroke={VP.ink} strokeWidth={1} />
        <polygon points="34,0 6,-5 11,0 6,5" fill={VP.cream} stroke={VP.ink} strokeWidth={1} />
        <text x={0} y={-40} textAnchor="middle" fill={VP.cream} fontSize={12} fontFamily='"Alfa Slab One", serif'>
          U
        </text>
      </g>

      {/* Optional Warm Sepia Colonial Archival Aging Wash (Scene 2 19th-Century Map!) */}
      {colonialTint > 0.01 && (
        <rect
          x={-40}
          y={-40}
          width={800}
          height={1360}
          fill="#8C6B42"
          opacity={colonialTint * 0.24}
          style={{ mixBlendMode: 'multiply' }}
        />
      )}
    </g>
  );
};
