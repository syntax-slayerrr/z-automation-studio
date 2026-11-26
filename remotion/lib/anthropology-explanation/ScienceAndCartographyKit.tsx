import React, { useMemo } from 'react';
import { geoGraticule10, geoNaturalEarth1, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import land110m from 'world-atlas/land-110m.json';
import { clamp, easeHeavyStone, easeInOutCubic, easeRouteDraw, hash01, lerp, smoothstep } from './tokens';
import { DiegeticCallout } from './EditorialTypography';

// =============================================================================
// 1. CINEMATIC MULTI-STAGE D3-GEO MIGRATION ATLAS v2.5 (TOTAL REDESIGN!)
//    - Real geographic curved corridors (Nile-Sinai, Bab el-Mandeb Coast, Inland Eurasia)
//    - Animated directional arrowheads along curve tangents
//    - Flowing glowing migration particle streams
//    - Visual marker hierarchy (Origin Pulse, Primary Sites, Intermediate Waypoints)
//    - Smartphone-readable offset labels with clean leader lines (zero route overlap!)
// =============================================================================

export interface MigrationSite {
  id: string;
  name: string;
  era: string;
  coords: [number, number]; // [lng, lat]
  tier?: 'origin' | 'primary' | 'waypoint';
  confirmed?: boolean;
  /** Offset in screen-relative px from pin to callout box so label NEVER overlaps routes. */
  labelOffset?: [number, number];
  revealAt?: number;
}

export interface MigrationCorridor {
  id: string;
  points: Array<[number, number]>;
  style?: 'primary_confirmed' | 'coastal_inferred' | 'secondary_branch';
  color?: string;
  drawWindow?: [number, number];
}

export interface TopographicMigrationMap2DProps {
  width: number;
  height: number;
  center?: [number, number];
  scale?: number;
  cameraFocus?: [number, number];
  cameraZoom?: number;
  sites: MigrationSite[];
  corridors: MigrationCorridor[];
  routeProgress?: number;
  frame?: number;
}

/** Evaluates position AND tangent angle (deg) at normalized t in [0, 1] along a polyline. */
function samplePolylineWithAngle(pts: Array<[number, number]>, t: number): { x: number; y: number; deg: number } {
  if (pts.length === 0) return { x: 0, y: 0, deg: 0 };
  if (pts.length === 1) return { x: pts[0][0], y: pts[0][1], deg: 0 };
  const lens: number[] = [0];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    lens.push(total);
  }
  const target = clamp(t, 0, 1) * total;
  for (let i = 1; i < pts.length; i++) {
    if (lens[i] >= target || i === pts.length - 1) {
      const seg = Math.max(1e-4, lens[i] - lens[i - 1]);
      const localT = clamp((target - lens[i - 1]) / seg, 0, 1);
      const x = lerp(pts[i - 1][0], pts[i][0], localT);
      const y = lerp(pts[i - 1][1], pts[i][1], localT);
      const deg = (Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0]) * 180) / Math.PI;
      return { x, y, deg };
    }
  }
  const last = pts[pts.length - 1];
  return { x: last[0], y: last[1], deg: 0 };
}

function buildSmoothCurvePath(projected: Array<[number, number]>): string {
  if (projected.length < 2) return '';
  let d = `M ${projected[0][0].toFixed(1)} ${projected[0][1].toFixed(1)}`;
  for (let i = 1; i < projected.length - 1; i++) {
    const midX = (projected[i][0] + projected[i + 1][0]) / 2;
    const midY = (projected[i][1] + projected[i + 1][1]) / 2;
    d += ` Q ${projected[i][0].toFixed(1)} ${projected[i][1].toFixed(1)}, ${midX.toFixed(1)} ${midY.toFixed(1)}`;
  }
  const last = projected[projected.length - 1];
  d += ` L ${last[0].toFixed(1)} ${last[1].toFixed(1)}`;
  return d;
}

export const TopographicMigrationMap2D: React.FC<TopographicMigrationMap2DProps> = ({
  width,
  height,
  center = [70, 14],
  scale = 520,
  cameraFocus,
  cameraZoom = 1.0,
  sites,
  corridors,
  routeProgress = 1,
  frame = 0,
}) => {
  const { landPath, graticulePath, projection } = useMemo(() => {
    const proj = geoNaturalEarth1()
      .center(center)
      .scale(scale)
      .translate([width * 0.5, height * 0.5]);
    const pathGen = geoPath(proj);
    const topo = land110m as unknown as Topology<{ land: GeometryCollection }>;
    const rawLand = feature(topo, topo.objects.land);
    // Cleanly strip Antarctica (all polygon rings strictly south of -60 deg lat) so southern-hemisphere
    // Indian Ocean / Nusantara / Australia maps NEVER leak Antarctica or suffer artificial bottom clipping!
    const stripAntarctica = (geom: any): any => {
      if (!geom) return geom;
      if (geom.type === 'Polygon') {
        const outer = geom.coordinates?.[0] ?? [];
        return outer.some((pt: number[]) => pt[1] > -60) ? geom : null;
      }
      if (geom.type === 'MultiPolygon') {
        const kept = (geom.coordinates ?? []).filter((poly: number[][][]) => {
          const outer = poly?.[0] ?? [];
          return outer.some((pt: number[]) => pt[1] > -60);
        });
        return { ...geom, coordinates: kept };
      }
      if (geom.type === 'GeometryCollection') {
        return { ...geom, geometries: (geom.geometries ?? []).map(stripAntarctica).filter(Boolean) };
      }
      return geom;
    };
    const landGeo: any =
      rawLand.type === 'FeatureCollection'
        ? {
            ...rawLand,
            features: rawLand.features
              .map((ft: any) => ({ ...ft, geometry: stripAntarctica(ft.geometry) }))
              .filter((ft: any) => ft.geometry != null),
          }
        : { ...rawLand, geometry: stripAntarctica((rawLand as any).geometry) };
    return {
      landPath: pathGen(landGeo) ?? '',
      graticulePath: pathGen(geoGraticule10()) ?? '',
      projection: proj,
    };
  }, [width, height, center[0], center[1], scale]);

  const focusPx = (cameraFocus ? projection(cameraFocus) : null) ?? [width * 0.5, height * 0.48];
  const camTx = width * 0.5 - focusPx[0] * cameraZoom;
  const camTy = height * 0.47 - focusPx[1] * cameraZoom;
  const p = clamp(routeProgress, 0, 1);
  // Counter-scale labels gently so text stays super readable on smartphones at ANY zoom!
  const uiScale = 1 / Math.pow(cameraZoom, 0.72);
  const strokeScale = 1 / Math.pow(cameraZoom, 0.55);

  return (
    <g transform={`translate(${camTx.toFixed(2)}, ${camTy.toFixed(2)}) scale(${cameraZoom.toFixed(4)})`}>
      <defs>
        <linearGradient id="odyssey-land-v25" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E6CE9D" />
          <stop offset="48%" stopColor="#C29C63" />
          <stop offset="100%" stopColor="#8F693E" />
        </linearGradient>
        <linearGradient id="odyssey-relief-v25" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#7C945C" stopOpacity="0.44" />
          <stop offset="52%" stopColor="#C8A267" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#7F5733" stopOpacity="0.46" />
        </linearGradient>
        <filter id="odyssey-land-shadow-v25" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="8" stdDeviation="7" floodColor="#0B1C29" floodOpacity="0.62" />
        </filter>
      </defs>

      <g>
        {/* Subtle antique geographic graticule */}
        <path d={graticulePath} fill="none" stroke="#85B8CB" strokeWidth={0.85 / cameraZoom} opacity={0.18} />

        {/* Shallow coastal bathymetry glow + sculpted landmasses */}
        <path d={landPath} fill="#143246" stroke="#5AA2BA" strokeWidth={11 / cameraZoom} strokeLinejoin="round" opacity={0.32} />
        <path d={landPath} fill="#183A52" stroke="#7CC0D4" strokeWidth={4 / cameraZoom} strokeLinejoin="round" opacity={0.28} />
        <path
          d={landPath}
          fill="url(#odyssey-land-v25)"
          stroke="#5E4024"
          strokeWidth={1.9 / cameraZoom}
          strokeLinejoin="round"
          filter="url(#odyssey-land-shadow-v25)"
        />
        <path d={landPath} fill="url(#odyssey-relief-v25)" stroke="#F5E5C2" strokeWidth={0.8 / cameraZoom} opacity={0.86} />

        {/* Multi-Stage Geographically Curved Corridors + Directional Arrows + Traveling Particle Streams */}
        {corridors.map((c) => {
          const projected = c.points
            .map((pt) => projection(pt))
            .filter((pt): pt is [number, number] => pt !== null);
          if (projected.length < 2) return null;

          const [w0, w1] = c.drawWindow ?? [0, 1];
          const localP = easeRouteDraw(clamp((p - w0) / Math.max(0.01, w1 - w0), 0, 1));
          if (localP <= 0.005) return null;

          const d = buildSmoothCurvePath(projected);
          const kind = c.style ?? 'primary_confirmed';
          const routeColor =
            c.color ??
            (kind === 'primary_confirmed'
              ? '#D94B34'
              : kind === 'coastal_inferred'
                ? '#F4CE72'
                : '#73D6E4');
          const baseW = kind === 'primary_confirmed' ? 5.2 : kind === 'coastal_inferred' ? 4.4 : 3.2;

          // Directional chevron arrowheads positioned along active portion of curve
          const arrowFracs = kind === 'coastal_inferred' ? [0.22, 0.50, 0.78] : [0.42, 0.82];
          // Flowing migration particles traveling smoothly from origin toward active frontier!
          const particleCount = kind === 'coastal_inferred' ? 5 : 3;

          const tip = samplePolylineWithAngle(projected, localP);

          return (
            <g key={c.id}>
              {/* Luminous soft corridor glow */}
              <path
                d={d}
                fill="none"
                stroke={routeColor}
                strokeWidth={(baseW + 8) * strokeScale}
                strokeLinecap="round"
                pathLength={100}
                strokeDasharray={`${(localP * 100).toFixed(2)} 102`}
                opacity={0.18}
              />
              {/* Dark cartographic ink backing */}
              <path
                d={d}
                fill="none"
                stroke="#121E2A"
                strokeWidth={(baseW + 3.8) * strokeScale}
                strokeLinecap="round"
                pathLength={100}
                strokeDasharray={`${(localP * 100).toFixed(2)} 102`}
                opacity={0.55}
              />
              {/* Distinct styled route stroke per scientific category */}
              <path
                d={d}
                fill="none"
                stroke={routeColor}
                strokeWidth={baseW * strokeScale}
                strokeLinecap="round"
                pathLength={100}
                strokeDasharray={
                  kind === 'coastal_inferred'
                    ? `${(3.0 * strokeScale).toFixed(2)} ${(2.2 * strokeScale).toFixed(2)}`
                    : kind === 'secondary_branch'
                      ? `${(1.6 * strokeScale).toFixed(2)} ${(1.8 * strokeScale).toFixed(2)}`
                      : `${(localP * 100).toFixed(2)} 102`
                }
                strokeDashoffset={kind !== 'primary_confirmed' ? -(1 - localP) * 100 : 0}
                opacity={kind === 'primary_confirmed' ? 0.98 : Math.min(0.95, localP * 1.4)}
              />

              {/* Directional Arrowheads clearly showing migration flow direction */}
              {arrowFracs.map((af, idx) => {
                if (localP < af + 0.04) return null;
                const s = samplePolylineWithAngle(projected, af);
                return (
                  <g
                    key={`arr-${idx}`}
                    transform={`translate(${s.x.toFixed(1)}, ${s.y.toFixed(1)}) rotate(${s.deg.toFixed(1)}) scale(${(0.95 * strokeScale).toFixed(3)})`}
                  >
                    <polygon points="8,0 -6,-6.5 -2.5,0 -6,6.5" fill={routeColor} stroke="#14202C" strokeWidth={1.3} />
                  </g>
                );
              })}

              {/* Animated Traveling Migration Particles gliding continuously along drawn route */}
              {Array.from({ length: particleCount }).map((_, idx) => {
                const flowT = (((frame * 0.0085 + idx / particleCount) % 1) * localP);
                if (flowT < 0.03) return null;
                const sp = samplePolylineWithAngle(projected, flowT);
                const op = Math.sin((flowT / Math.max(0.05, localP)) * Math.PI) * 0.92;
                return (
                  <circle
                    key={`pt-${idx}`}
                    cx={sp.x}
                    cy={sp.y}
                    r={3.4 * strokeScale}
                    fill="#FDF4D6"
                    opacity={op}
                  />
                );
              })}

              {/* Active Expedition Frontier Beacon */}
              {localP > 0.04 && localP < 0.98 && (
                <g transform={`translate(${tip.x.toFixed(1)}, ${tip.y.toFixed(1)}) scale(${strokeScale.toFixed(3)})`}>
                  <circle cx={0} cy={0} r={17} fill={routeColor} opacity={0.28} />
                  <circle cx={0} cy={0} r={7} fill="#FDF4D8" stroke={routeColor} strokeWidth={3} />
                </g>
              )}
            </g>
          );
        })}

        {/* Hierarchical Location Markers & Smartphone-Readable Offset Callouts */}
        {sites.map((s) => {
          const pt = projection(s.coords);
          if (!pt) return null;
          const reveal = smoothstep((s.revealAt ?? 0) - 0.04, (s.revealAt ?? 0) + 0.07, p);
          if (reveal <= 0.02) return null;

          const tier = s.tier ?? 'primary';
          const pulse = (frame * 0.028 + hash01(pt[0])) % 1;
          const [ox, oy] = s.labelOffset ?? [36, -34];
          const isLeft = ox < 0;
          const boxW = Math.max(210, Math.max(s.name.length * 11.4, s.era.length * 8.6) + 28);
          const boxX = isLeft ? ox - boxW : ox;

          if (tier === 'waypoint') {
            return (
              <g key={s.id} transform={`translate(${pt[0].toFixed(1)}, ${pt[1].toFixed(1)}) scale(${uiScale.toFixed(3)})`} opacity={reveal}>
                <circle cx={0} cy={0} r={6} fill="#F4CE72" stroke="#152330" strokeWidth={2.5} />
                <text
                  x={ox > 0 ? 12 : -12}
                  y={oy < 0 ? -8 : 16}
                  textAnchor={ox > 0 ? 'start' : 'end'}
                  fill="#F3E5C2"
                  fontFamily="system-ui, sans-serif"
                  fontSize={15}
                  fontWeight={700}
                  stroke="#13202C"
                  strokeWidth={3.5}
                  paintOrder="stroke"
                >
                  {s.name}
                </text>
              </g>
            );
          }

          const accent = tier === 'origin' ? '#E4523A' : s.confirmed === false ? '#58B6CC' : '#D44B37';

          return (
            <g key={s.id} transform={`translate(${pt[0].toFixed(1)}, ${pt[1].toFixed(1)}) scale(${uiScale.toFixed(3)})`} opacity={reveal}>
              {/* Expanding location pulse rings (stronger double pulse for Origin!) */}
              <circle cx={0} cy={0} r={10 + pulse * (tier === 'origin' ? 42 : 28)} fill="none" stroke={accent} strokeWidth={2.4} opacity={(1 - pulse) * 0.85} />
              {tier === 'origin' && (
                <circle
                  cx={0}
                  cy={0}
                  r={10 + ((pulse + 0.5) % 1) * 42}
                  fill="none"
                  stroke="#F7D584"
                  strokeWidth={2}
                  opacity={(1 - ((pulse + 0.5) % 1)) * 0.7}
                />
              )}

              {/* Crisp leader line pointing cleanly away from routes/coasts to mobile-readable label */}
              <polyline
                points={`0,0 ${(ox * 0.55).toFixed(1)},${oy.toFixed(1)} ${ox.toFixed(1)},${oy.toFixed(1)}`}
                fill="none"
                stroke="#EED08A"
                strokeWidth={1.8}
                opacity={0.9}
              />

              {/* Sculpted Location Pin */}
              <circle cx={0} cy={0} r={tier === 'origin' ? 10.5 : 8.5} fill={accent} stroke="#FAF0D2" strokeWidth={2.6} />
              <circle cx={0} cy={0} r={3.5} fill="#FDF5DD" />

              {/* Mobile-Readable High-Contrast Atlas Label Card */}
              <g transform={`translate(${boxX.toFixed(1)}, ${(oy - 26).toFixed(1)})`}>
                <rect
                  x={0}
                  y={0}
                  width={boxW}
                  height={52}
                  rx={7}
                  fill="#13212E"
                  opacity={0.92}
                  stroke={tier === 'origin' ? '#F2BE64' : '#A68652'}
                  strokeWidth={1.6}
                />
                <text x={12} y={23} fill="#FAF0D8" fontFamily="Georgia, serif" fontSize={19} fontWeight={700}>
                  {s.name}
                </text>
                <text x={12} y={42} fill="#AFCBD9" fontFamily="system-ui, sans-serif" fontSize={14} fontWeight={600}>
                  {s.era}
                </text>
              </g>
            </g>
          );
        })}
      </g>
    </g>
  );
};

// =============================================================================
// 2. COMPARATIVE ANATOMICAL SKULL CUTAWAY (LATERAL PROFILE + OVERLAY — SH03A!)
//    Replaces floating front skull with genuine anatomical & evolutionary comparison!
// =============================================================================

export const ComparativeSkullCutaway2D: React.FC<{
  x: number;
  y: number;
  scale?: number;
  /** 0..1 animates cutaway reveal + ghosted Australopithecus comparison + cortex highlight */
  progress?: number;
  boneTextureHref?: string;
  frame?: number;
}> = ({ x, y, scale = 1, progress = 1, boneTextureHref, frame = 0 }) => {
  const cut = easeHeavyStone(clamp(progress, 0, 1));
  const ghostOp = smoothstep(0.18, 0.58, progress);
  const pulse = 0.88 + 0.12 * Math.sin(frame * 0.12);

  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <defs>
        <radialGradient id="odyssey-lat-bone" cx="42%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#F6ECD6" />
          <stop offset="56%" stopColor="#D5BE98" />
          <stop offset="100%" stopColor="#775F48" />
        </radialGradient>
        <radialGradient id="odyssey-prefrontal-glow" cx="55%" cy="45%" r="58%">
          <stop offset="0%" stopColor="#FCE094" stopOpacity="0.95" />
          <stop offset="60%" stopColor="#E39744" stopOpacity="0.72" />
          <stop offset="100%" stopColor="#8A4824" stopOpacity="0.15" />
        </radialGradient>
        <radialGradient id="odyssey-neocortex-glow" cx="48%" cy="48%" r="58%">
          <stop offset="0%" stopColor="#7CEAF5" stopOpacity="0.92" />
          <stop offset="65%" stopColor="#2E8CA6" stopOpacity="0.78" />
          <stop offset="100%" stopColor="#143D52" stopOpacity="0.95" />
        </radialGradient>
        <clipPath id="odyssey-lat-cutaway-clip">
          <path d="M -112 -40 C -114 -128, -22 -166, 62 -140 C 110 -124, 128 -78, 118 -34 C 68 -24, -40 -18, -112 -40 Z" />
        </clipPath>
      </defs>

      {/* Studio calibrated ground shadow */}
      <ellipse cx={-12} cy={142} rx={138} ry={20} fill="#09131C" opacity={0.58} />

      {/* 1. GHOSTED AUSTRALOPITHECUS (~450 cc) EVOLUTIONARY COMPARISON OVERLAY */}
      {/* Shows flatter receding forehead, heavier brow, & protruding jaw against H. sapiens! */}
      <g opacity={ghostOp * 0.85}>
        <path
          d="M -118 -20 C -116 -64, -56 -88, 22 -84 C 76 -80, 126 -58, 152 -16 L 178 44 L 164 68 L 174 88 L 146 112 C 98 114, 38 98, -26 78 C -86 58, -118 22, -118 -20 Z"
          fill="#C98A46"
          fillOpacity={0.14}
          stroke="#F0B55E"
          strokeWidth={2.8}
          strokeDasharray="9 6"
        />
      </g>

      {/* 2. SCULPTED ANATOMICAL LATERAL HOMO SAPIENS CRANIUM (~1350 cc, facing right!) */}
      {/* Main cranial vault + high vertical forehead + retracted flat face */}
      <path
        d="M -134 -28 C -142 -118, -62 -184, 32 -174 C 102 -166, 146 -112, 144 -48 C 144 -34, 154 -22, 150 -10 L 164 16 L 148 28 L 152 60 C 140 66, 116 68, 92 66 L 78 42 C 56 38, 32 42, 14 54 L -32 62 C -94 56, -128 24, -134 -28 Z"
        fill="url(#odyssey-lat-bone)"
        stroke="#4D3A2B"
        strokeWidth={2.6}
      />
      {/* Articulated Lower Jaw (Mandible) with realistic chin & ramus */}
      <path
        d="M 28 38 L 54 44 L 62 96 L 138 90 L 148 114 C 132 132, 92 134, 48 124 L 22 98 Z"
        fill="url(#odyssey-lat-bone)"
        stroke="#4D3A2B"
        strokeWidth={2.4}
      />
      {/* Shadow modeling under zygomatic arch & occipital curve */}
      <path d="M -134 -28 C -130 16, -96 52, -32 62 L 14 54 L -12 20 C -66 24, -108 4, -134 -28 Z" fill="#68513C" opacity={0.48} />

      {/* Zygomatic Arch & Temporal Fossa */}
      <path d="M 38 14 C 62 6, 94 12, 118 28 L 112 42 C 88 28, 60 26, 36 30 Z" fill="#E4CFA9" stroke="#5A4535" strokeWidth={1.8} />
      {/* Deep Orbital Socket & Nasal Aperture */}
      <path d="M 106 -28 C 118 -40, 140 -36, 144 -18 C 142 -4, 120 0, 108 -10 Z" fill="#181210" stroke="#533F30" strokeWidth={2} />
      <path d="M 148 -2 L 164 16 L 146 24 Z" fill="#1A1412" />
      {/* External Acoustic Meatus (ear canal) & Mastoid Process */}
      <ellipse cx={6} cy={40} rx={8} ry={11} fill="#1E1714" stroke="#5E4A3A" strokeWidth={1.8} />
      {/* Upper & Lower Dental Arcade (molars -> incisors) */}
      {[96, 107, 118, 128, 138].map((tx, i) => (
        <g key={i}>
          <rect x={tx} y={58} width={8.5} height={11} rx={2} fill="#F1E4C8" stroke="#7A644C" strokeWidth={0.9} />
          <rect x={tx - 2} y={76} width={8.5} height={11} rx={2} fill="#E4D2B0" stroke="#7A644C" strokeWidth={0.9} />
        </g>
      ))}
      {/* Cranial coronal & lambdoid sutures */}
      <path d="M 8 -172 C 12 -128, 16 -86, 8 -40" fill="none" stroke="#644E3B" strokeWidth={1.6} strokeDasharray="4 3" opacity={0.65} />

      {/* 3. MULTI-LAYER ANATOMICAL CUTAWAY: Trabecular Bone Rim + Glowing Neocortex & Prefrontal Lobe */}
      {cut > 0.02 && (
        <g opacity={cut}>
          <g clipPath="url(#odyssey-lat-cutaway-clip)">
            {boneTextureHref ? (
              <image href={boneTextureHref} x={-122} y={-172} width={258} height={160} preserveAspectRatio="xMidYMid slice" />
            ) : (
              <rect x={-122} y={-172} width={258} height={160} fill="#BFA480" />
            )}
            {/* Recessed inner endocast cavity */}
            <path
              d="M -98 -44 C -98 -114, -18 -148, 56 -126 C 98 -114, 112 -74, 104 -38 C 58 -30, -34 -26, -98 -44 Z"
              fill="url(#odyssey-neocortex-glow)"
              stroke="#B8F0FA"
              strokeWidth={2}
            />
            {/* Highlighted Expanded Prefrontal Cortex (key human cognitive evolution!) */}
            <path
              d="M 42 -128 C 88 -118, 112 -76, 104 -38 C 80 -34, 52 -32, 34 -34 C 36 -74, 38 -104, 42 -128 Z"
              fill="url(#odyssey-prefrontal-glow)"
              opacity={0.86 * pulse}
            />
            {/* Sculpted cerebral sulci / gyri folds */}
            <path
              d="M -78 -78 Q -48 -108 -16 -86 T 42 -84 T 88 -66 M -62 -56 Q -24 -76 16 -56 T 78 -48"
              fill="none"
              stroke="#E6FAFD"
              strokeWidth={2.5}
              strokeLinecap="round"
              opacity={0.78}
            />
          </g>
          <path
            d="M -112 -40 C -114 -128, -22 -166, 62 -140 C 110 -124, 128 -78, 118 -34 C 68 -24, -40 -18, -112 -40 Z"
            fill="none"
            stroke="#F2CA74"
            strokeWidth={2.8}
          />
        </g>
      )}
    </g>
  );
};

// =============================================================================
// 3. FUNCTIONAL DNA -> GENETIC DIVERSITY & POPULATION LINEAGES BRIDGE (SH03B!)
//    Connects DNA variation directly to human dispersal & evolutionary branching!
// =============================================================================

export const DnaDoubleHelix2D: React.FC<{
  x: number;
  y: number;
  height?: number;
  radius?: number;
  frame?: number;
  opacity?: number;
  highlightLoci?: number[];
}> = ({ x, y, height = 380, radius = 56, frame = 0, opacity = 1, highlightLoci = [4, 9, 13] }) => {
  const phase = frame * 0.055;
  const steps = 16;
  const rungColors = [
    ['#E89D48', '#52C9DB'],
    ['#D95A46', '#95C458'],
  ];

  const strandA: Array<[number, number]> = [];
  const strandB: Array<[number, number]> = [];
  const rungs: Array<{ idx: number; y: number; x1: number; x2: number; z: number; c1: string; c2: string }> = [];

  for (let i = 0; i <= steps; i++) {
    const frac = i / steps;
    const py = -height / 2 + frac * height;
    const theta = frac * Math.PI * 3.1 + phase;
    const x1 = Math.sin(theta) * radius;
    const z1 = Math.cos(theta);
    const x2 = Math.sin(theta + Math.PI) * radius;
    strandA.push([x1, py]);
    strandB.push([x2, py]);
    if (i > 0 && i < steps) {
      const pair = rungColors[i % 2];
      rungs.push({ idx: i, y: py, x1, x2, z: z1, c1: pair[0], c2: pair[1] });
    }
  }

  const toPath = (pts: Array<[number, number]>) =>
    pts.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');

  return (
    <g transform={`translate(${x}, ${y})`} opacity={opacity}>
      <ellipse cx={0} cy={0} rx={radius * 1.95} ry={height * 0.56} fill="#34A6C2" opacity={0.14} />
      {rungs
        .sort((a, b) => a.z - b.z)
        .map((r) => {
          const midX = (r.x1 + r.x2) / 2;
          const isHot = highlightLoci.includes(r.idx);
          const op = 0.5 + 0.48 * ((r.z + 1) / 2);
          return (
            <g key={r.idx} opacity={op}>
              <line x1={r.x1} y1={r.y} x2={midX} y2={r.y} stroke={isHot ? '#FCE18A' : r.c1} strokeWidth={isHot ? 6.5 : 4.5} strokeLinecap="round" />
              <line x1={midX} y1={r.y} x2={r.x2} y2={r.y} stroke={isHot ? '#6CE8F8' : r.c2} strokeWidth={isHot ? 6.5 : 4.5} strokeLinecap="round" />
              <circle cx={r.x1} cy={r.y} r={isHot ? 7 : 5} fill={isHot ? '#FDF4D2' : '#F4DFB8'} />
              <circle cx={r.x2} cy={r.y} r={isHot ? 7 : 5} fill={isHot ? '#A2F4FC' : '#88E4F0'} />
            </g>
          );
        })}
      <path d={toPath(strandA)} fill="none" stroke="#E4A74E" strokeWidth={6.5} strokeLinecap="round" />
      <path d={toPath(strandB)} fill="none" stroke="#5CD5E6" strokeWidth={6.5} strokeLinecap="round" />
    </g>
  );
};

export const BioluminescentCell2D: React.FC<{
  x: number;
  y: number;
  radius?: number;
  frame?: number;
  opacity?: number;
}> = ({ x, y, radius = 110, frame = 0, opacity = 1 }) => {
  const pulse = 1 + Math.sin(frame * 0.05) * 0.024;
  return (
    <g transform={`translate(${x}, ${y}) scale(${pulse})`} opacity={opacity}>
      <defs>
        <radialGradient id="odyssey-cell-cyto-v25" cx="44%" cy="38%" r="60%">
          <stop offset="0%" stopColor="#63DCEB" stopOpacity="0.68" />
          <stop offset="68%" stopColor="#1F6D85" stopOpacity="0.72" />
          <stop offset="100%" stopColor="#133D52" stopOpacity="0.92" />
        </radialGradient>
        <radialGradient id="odyssey-cell-nuc-v25" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FCE9B2" />
          <stop offset="55%" stopColor="#DC9B46" />
          <stop offset="100%" stopColor="#7C4326" />
        </radialGradient>
      </defs>
      <circle cx={0} cy={0} r={radius + 14} fill="#46C9DC" opacity={0.14} />
      <circle cx={0} cy={0} r={radius} fill="url(#odyssey-cell-cyto-v25)" stroke="#8AE8F5" strokeWidth={4.2} />
      <circle cx={0} cy={0} r={radius - 10} fill="none" stroke="#47B5C8" strokeWidth={1.8} strokeDasharray="6 5" opacity={0.75} />
      <circle cx={-4} cy={-4} r={radius * 0.36} fill="url(#odyssey-cell-nuc-v25)" stroke="#F7DFAC" strokeWidth={2.5} />
      <circle cx={-10} cy={-10} r={radius * 0.14} fill="#5A2A1A" opacity={0.72} />
    </g>
  );
};

export const FunctionalDnaDiversity2D: React.FC<{
  frame: number;
  progress: number;
}> = ({ frame, progress }) => {
  const p = easeRouteDraw(clamp(progress, 0, 1));
  const lineages = [
    {
      yStart: 695,
      yEnd: 610,
      color: '#F4C668',
      title: 'Variasi Genetik Afrika',
      detail: 'Keragaman alel tertinggi — akar populasi manusia',
      code: 'A·T·G·C → G·T·A·C',
    },
    {
      yStart: 855,
      yEnd: 855,
      color: '#E58A52',
      title: 'Percabangan Eurasia',
      detail: 'Adaptasi iklim dingin & percampuran kuno',
      code: 'A·T·G·C → A·C·G·T',
    },
    {
      yStart: 1015,
      yEnd: 1100,
      color: '#64DCEB',
      title: 'Populasi Asia · Nusantara',
      detail: 'Jejak migrasi pesisir puluhan ribu tahun',
      code: 'A·T·G·C → T·T·G·C',
    },
  ];

  return (
    <g>
      {/* Rotating 3D DNA Helix with 3 highlighted SNP variation loci */}
      <DnaDoubleHelix2D x={252} y={855} height={580} radius={76} frame={frame} highlightLoci={[4, 8, 12]} />

      {/* Functional Genetic Variation Streams flowing from DNA loci -> 3 Population Lineages */}
      {lineages.map((lin, i) => {
        const lp = clamp((p - i * 0.12) / 0.68, 0, 1);
        const pathD = `M 332 ${lin.yStart} C 430 ${lin.yStart}, 445 ${lin.yEnd}, 548 ${lin.yEnd}`;
        return (
          <g key={i}>
            <path
              d={pathD}
              fill="none"
              stroke={lin.color}
              strokeWidth={11}
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray={`${(lp * 100).toFixed(1)} 102`}
              opacity={0.16}
            />
            <path
              d={pathD}
              fill="none"
              stroke={lin.color}
              strokeWidth={4}
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray={`${(lp * 100).toFixed(1)} 102`}
            />
            {lp > 0.35 && (
              <g transform={`translate(564, ${lin.yEnd - 48})`} opacity={smoothstep(0.35, 0.72, lp)}>
                <rect x={0} y={0} width={398} height={96} rx={10} fill="#122331" opacity={0.88} stroke={lin.color} strokeWidth={1.6} />
                <text x={18} y={30} fill="#FAF0D8" fontFamily="Georgia, serif" fontSize={21} fontWeight={700}>
                  {lin.title}
                </text>
                <text x={18} y={54} fill="#B0C9D6" fontFamily="system-ui, sans-serif" fontSize={14.5}>
                  {lin.detail}
                </text>
                <text x={18} y={78} fill={lin.color} fontFamily="monospace" fontSize={14} fontWeight={700} letterSpacing="0.06em">
                  {lin.code}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
};

// =============================================================================
// 4. TRUE ROOTED ORGANIC PHYLOGENETIC TREE (TOTAL REBUILD — SH03C!)
//    Root (Shared Ancestor ~6–7 Ma) -> Tapered Organic Trunk -> Primary/Secondary Branches
//    Explicitly distinguishes Pan (sister lineage, NOT ancestor!), extinct (†) vs extant!
// =============================================================================

export const OrganicPhylogeneticTree2D: React.FC<{
  /** Growth progress 0..1 from root -> trunk -> forks -> canopy species tips. */
  progress: number;
  frame?: number;
}> = ({ progress, frame = 0 }) => {
  const p = easeRouteDraw(clamp(progress, 0, 1));
  const trunkP = clamp(p / 0.45, 0, 1);
  const pulse = 1 + Math.sin(frame * 0.12) * 0.12;

  const strata = [
    { y: 1365, label: '~6–7 Juta Tahun Lalu' },
    { y: 1125, label: '~4 Juta Tahun Lalu' },
    { y: 895, label: '~2 Juta Tahun Lalu' },
    { y: 635, label: '~500 Ribu Tahun Lalu' },
    { y: 395, label: 'Masa Kini' },
  ];

  // Organic tapered phylogenetic branches radiating from genuine shared ancestral nodes!
  const branches = [
    {
      id: 'pan',
      name: 'Pan (Garis Simpanse)',
      sub: 'Cabang saudara · bukan leluhur',
      d: 'M 474 1280 C 330 1195, 190 1070, 152 900 C 122 760, 134 560, 156 398',
      end: [156, 398] as [number, number],
      color: '#7E9E72',
      w: 7,
      align: 'left' as const,
      labelOffset: [-98, -36] as [number, number],
      window: [0.16, 0.56] as [number, number],
    },
    {
      id: 'australo',
      name: 'Australopithecus †',
      sub: '~4–2 Ma · ~450 cc',
      d: 'M 498 1132 C 425 1075, 368 1032, 342 968',
      end: [342, 968] as [number, number],
      color: '#B5A68E',
      w: 6.5,
      align: 'right' as const,
      labelOffset: [-14, -22] as [number, number],
      window: [0.28, 0.54] as [number, number],
    },
    {
      id: 'habilis',
      name: 'Homo habilis †',
      sub: '~2.4–1.4 Ma · ~640 cc',
      d: 'M 520 960 C 600 924, 668 898, 728 848',
      end: [728, 848] as [number, number],
      color: '#CE9654',
      w: 6,
      align: 'left' as const,
      labelOffset: [16, -6] as [number, number],
      window: [0.42, 0.66] as [number, number],
    },
    {
      id: 'erectus',
      name: 'Homo erectus †',
      sub: '~1.9 Ma–110 ka · ~950 cc · Jawa & Eurasia',
      d: 'M 538 830 C 624 765, 694 714, 744 646',
      end: [744, 646] as [number, number],
      color: '#DE7F46',
      w: 6.5,
      align: 'left' as const,
      labelOffset: [-110, -40] as [number, number],
      window: [0.52, 0.76] as [number, number],
    },
    {
      id: 'denisovan',
      name: 'Denisovan †',
      sub: '~400–50 ka · Asia',
      d: 'M 556 640 C 490 578, 424 532, 376 476',
      end: [376, 476] as [number, number],
      color: '#C9986E',
      w: 5.5,
      align: 'right' as const,
      labelOffset: [-16, -8] as [number, number],
      window: [0.66, 0.88] as [number, number],
    },
    {
      id: 'neanderthal',
      name: 'H. neanderthalensis †',
      sub: '~400–40 ka · ~1450 cc',
      d: 'M 556 640 C 626 575, 686 526, 732 468',
      end: [732, 468] as [number, number],
      color: '#E6A05E',
      w: 6.5,
      align: 'left' as const,
      labelOffset: [-42, -46] as [number, number],
      window: [0.68, 0.90] as [number, number],
    },
    {
      id: 'sapiens',
      name: 'Homo sapiens',
      sub: '~300 ka–Kini · ~1350 cc',
      d: 'M 556 640 C 546 555, 536 472, 540 388',
      end: [540, 388] as [number, number],
      color: '#64E0F2',
      w: 8.5,
      align: 'left' as const,
      labelOffset: [22, -10] as [number, number],
      window: [0.72, 0.98] as [number, number],
    },
  ];

  const forkNodes: Array<{ x: number; y: number; at: number; col: string }> = [
    { x: 474, y: 1280, at: 0.14, col: '#D4A862' },
    { x: 498, y: 1132, at: 0.26, col: '#D8B06E' },
    { x: 520, y: 960, at: 0.40, col: '#DFB672' },
    { x: 538, y: 830, at: 0.50, col: '#E8B268' },
    { x: 556, y: 640, at: 0.64, col: '#7AE2F0' },
  ];

  return (
    <g>
      <defs>
        <linearGradient id="odyssey-tree-trunk" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#7C5638" />
          <stop offset="48%" stopColor="#B8864D" />
          <stop offset="100%" stopColor="#68CBE0" />
        </linearGradient>
      </defs>

      {/* Geological Time Horizon Bands */}
      {strata.map((st, i) => (
        <g key={i} opacity={0.4}>
          <line x1={52} y1={st.y} x2={972} y2={st.y} stroke="#5F889B" strokeWidth={1.1} strokeDasharray="4 7" />
          <text x={56} y={st.y - 8} fill="#9BC0D0" fontFamily="system-ui, sans-serif" fontSize={14} fontWeight={600}>
            {st.label}
          </text>
        </g>
      ))}

      {/* 1. ORGANIC ROOT SYSTEM (Shared Ancestral Foundation ~6-7 Ma) */}
      <g opacity={smoothstep(0, 0.16, p)}>
        <path d="M 472 1352 C 428 1368, 368 1396, 306 1412" fill="none" stroke="#8C6342" strokeWidth={9} strokeLinecap="round" />
        <path d="M 472 1352 C 446 1384, 412 1410, 376 1428" fill="none" stroke="#6E4D34" strokeWidth={6} strokeLinecap="round" />
        <path d="M 476 1352 C 522 1370, 580 1396, 646 1412" fill="none" stroke="#8C6342" strokeWidth={9} strokeLinecap="round" />
        <path d="M 476 1352 C 504 1384, 536 1412, 574 1428" fill="none" stroke="#6E4D34" strokeWidth={6} strokeLinecap="round" />
        {/* Root origin medallion */}
        <circle cx={474} cy={1354} r={16} fill="#B8884E" stroke="#12212E" strokeWidth={3.5} />
        <text x={474} y={1458} textAnchor="middle" fill="#F2DEB4" fontFamily="Georgia, serif" fontSize={20} fontWeight={700}>
          Leluhur Bersama Hominin–Pan
        </text>
        <text x={474} y={1482} textAnchor="middle" fill="#9BB8C6" fontFamily="system-ui, sans-serif" fontSize={14}>
          Akar percabangan ~6–7 juta tahun lalu · † = cabang punah
        </text>
      </g>

      {/* 2. TAPERED ORGANIC MAIN HOMININ TRUNK (Root 1354 -> Sister Fork 640) */}
      <path
        d="M 474 1354 C 474 1255, 496 1165, 514 1020 C 528 910, 542 770, 556 640"
        fill="none"
        stroke="url(#odyssey-tree-trunk)"
        strokeWidth={22}
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray={`${(trunkP * 100).toFixed(1)} 102`}
        opacity={0.26}
      />
      <path
        d="M 474 1354 C 474 1255, 496 1165, 514 1020 C 528 910, 542 770, 556 640"
        fill="none"
        stroke="url(#odyssey-tree-trunk)"
        strokeWidth={12.5}
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray={`${(trunkP * 100).toFixed(1)} 102`}
      />

      {/* 3. ORGANIC PRIMARY & SECONDARY BRANCHES + SPECIES TERMINALS */}
      {branches.map((br) => {
        const bp = clamp((p - br.window[0]) / Math.max(0.01, br.window[1] - br.window[0]), 0, 1);
        const tipOp = smoothstep(0.68, 0.98, bp);
        const [ex, ey] = br.end;
        const [lox, loy] = br.labelOffset;
        const isHero = br.id === 'sapiens';
        const anchor = br.align === 'left' ? 'start' : 'end';

        return (
          <g key={br.id}>
            {/* Atmospheric glow halo along branch */}
            <path
              d={br.d}
              fill="none"
              stroke={br.color}
              strokeWidth={br.w + 9}
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray={`${(bp * 100).toFixed(1)} 102`}
              opacity={0.18}
            />
            {/* Crisp organic branch body */}
            <path
              d={br.d}
              fill="none"
              stroke={br.color}
              strokeWidth={br.w}
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray={`${(bp * 100).toFixed(1)} 102`}
            />
            {/* Species terminal node & mobile-legible label */}
            {tipOp > 0.02 && (
              <g opacity={tipOp}>
                {isHero && <circle cx={ex} cy={ey} r={24 * pulse} fill="#F5CB72" opacity={0.28} />}
                <circle cx={ex} cy={ey} r={isHero ? 12 : 8.5} fill={br.color} stroke="#101D29" strokeWidth={3} />
                <text
                  x={ex + lox}
                  y={ey + loy}
                  textAnchor={anchor}
                  fill={isHero ? '#FDF4DA' : '#EFE5CE'}
                  fontFamily="Georgia, serif"
                  fontSize={isHero ? 26 : 20}
                  fontWeight={700}
                  stroke="#0F1C26"
                  strokeWidth={4}
                  paintOrder="stroke"
                >
                  {br.name}
                </text>
                <text
                  x={ex + lox}
                  y={ey + loy + 20}
                  textAnchor={anchor}
                  fill={br.id === 'pan' ? '#B8D4A8' : '#A4C1D0'}
                  fontFamily="system-ui, sans-serif"
                  fontSize={14}
                  fontWeight={600}
                  stroke="#0F1C26"
                  strokeWidth={3.2}
                  paintOrder="stroke"
                >
                  {br.sub}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* 4. GLOWING CLADE FORK NODES */}
      {forkNodes.map((fn, i) => {
        const nop = smoothstep(fn.at - 0.04, fn.at + 0.06, p);
        if (nop <= 0.02) return null;
        return (
          <g key={i} opacity={nop}>
            <circle cx={fn.x} cy={fn.y} r={14} fill={fn.col} opacity={0.24} />
            <circle cx={fn.x} cy={fn.y} r={6.5} fill="#FDF3D4" stroke={fn.col} strokeWidth={2.5} />
          </g>
        );
      })}
    </g>
  );
};

// =============================================================================
// 5. UNIFIED SCENE 03 DIRECTORIAL BRIDGE (SH03A -> SH03B -> SH03C)
//    SH03A (0..69):   Comparative Lateral Skull Cutaway + Controlled Push-In
//    SH03B (70..124): Functional DNA Variation -> Diverging Population Streams
//    SH03C (125..219): Full-Frame Rooted Organic Phylogenetic Tree!
// =============================================================================

export const AnatomicalEvolutionStory2D: React.FC<{
  /** Local frame inside Scene 03 (0..219). */
  lf: number;
  boneTextureHref: string;
}> = ({ lf, boneTextureHref }) => {
  // SH03A: Comparative Skull Cutaway (0..69, graceful dissolve 60..76)
  const skullCutP = clamp(lf / 48, 0, 1);
  const skullZoom = lerp(1.95, 2.38, easeInOutCubic(clamp(lf / 68, 0, 1)));
  const skullOp = 1 - smoothstep(58, 76, lf);

  // SH03B: Functional DNA Population Variation (66..132)
  const dnaEnter = smoothstep(64, 80, lf);
  const dnaExit = 1 - smoothstep(116, 132, lf);
  const dnaOp = dnaEnter * dnaExit;
  const dnaP = clamp((lf - 70) / 48, 0, 1);

  // SH03C: Rooted Organic Phylogenetic Tree (124..219)
  const treeOp = smoothstep(120, 136, lf);
  const treeP = clamp((lf - 126) / 76, 0, 1);

  return (
    <g>
      {/* SH03A: COMPARATIVE LATERAL SKULL CUTAWAY (H. sapiens vs Australopithecus ghost overlay!) */}
      {skullOp > 0.01 && (
        <g opacity={skullOp}>
          <ComparativeSkullCutaway2D
            x={495}
            y={860}
            scale={skullZoom}
            progress={skullCutP}
            boneTextureHref={boneTextureHref}
            frame={lf}
          />
          <DiegeticCallout
            anchorX={658}
            anchorY={698}
            labelX={664}
            labelY={436}
            title="Ekspansi Prefrontal"
            detail="Kranium: ~450 → ~1.350 cc"
            align="left"
            accent="#F4CA70"
            opacity={smoothstep(10, 26, lf) * skullOp}
          />
          <DiegeticCallout
            anchorX={298}
            anchorY={756}
            labelX={318}
            labelY={466}
            title="Siluet Australopithecus"
            detail="Dahi landai · rahang menonjol"
            align="right"
            accent="#E8A252"
            opacity={smoothstep(20, 38, lf) * skullOp}
          />
          <DiegeticCallout
            anchorX={754}
            anchorY={1035}
            labelX={700}
            labelY={1206}
            title="Reduksi Rahang & Gigi"
            detail="Selaras pola makan & api"
            align="right"
            accent="#6CE0F0"
            opacity={smoothstep(24, 42, lf) * skullOp}
          />
        </g>
      )}

      {/* SH03B: FUNCTIONAL DNA VARIATION -> POPULATION BRANCHING */}
      {dnaOp > 0.01 && (
        <g opacity={dnaOp}>
          <FunctionalDnaDiversity2D frame={lf} progress={dnaP} />
        </g>
      )}

      {/* SH03C: TRUE ROOTED ORGANIC PHYLOGENETIC TREE */}
      {treeOp > 0.01 && (
        <g opacity={treeOp}>
          <OrganicPhylogeneticTree2D progress={treeP} frame={lf} />
        </g>
      )}
    </g>
  );
};

// Keep backward-compatible named export for legacy callers
export const PaintedHumanSkull2D: React.FC<{
  x: number;
  y: number;
  scale?: number;
  cutawayProgress?: number;
  boneTextureHref?: string;
}> = ({ x, y, scale = 1, cutawayProgress = 0, boneTextureHref }) => (
  <ComparativeSkullCutaway2D x={x} y={y} scale={scale} progress={cutawayProgress} boneTextureHref={boneTextureHref} />
);

export const AnatomicalRibcage2D: React.FC<{ x: number; y: number; scale?: number }> = ({ x, y, scale = 1 }) => {
  const ribs = [0, 1, 2, 3, 4, 5, 6];
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <ellipse cx={0} cy={0} rx={58} ry={82} fill="#16232D" opacity={0.62} />
      <rect x={-9} y={-88} width={18} height={176} rx={6} fill="#8D755C" />
      {ribs.map((i) => {
        const ry = -66 + i * 21;
        const spread = 46 + Math.sin((i / 6) * Math.PI) * 26;
        const drop = 10 + i * 2.4;
        return (
          <g key={i}>
            <path d={`M -6 ${ry} C ${-spread} ${ry - 6}, ${-spread * 1.12} ${ry + drop + 12}, -10 ${ry + drop}`} fill="none" stroke="#E6D2B0" strokeWidth={7.5} strokeLinecap="round" />
            <path d={`M 6 ${ry} C ${spread} ${ry - 6}, ${spread * 1.12} ${ry + drop + 12}, 10 ${ry + drop}`} fill="none" stroke="#E6D2B0" strokeWidth={7.5} strokeLinecap="round" />
          </g>
        );
      })}
      <path d="M -11 -76 L 11 -76 L 8 44 L 0 58 L -8 44 Z" fill="#EFE0C2" stroke="#7A6249" strokeWidth={1.8} />
    </g>
  );
};
