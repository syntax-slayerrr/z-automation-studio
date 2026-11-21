import React, { useMemo } from "react";
import { geoInterpolate, geoMercator, geoPath } from "d3-geo";
import { Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT_SANS, FONT_SERIF, HERITAGE } from "./PaperTextures";
import islandsRaw from "../episodes/ep01/data/indonesia_islands.json";

export interface MapPinSpec {
  id: string;
  label: string;
  sublabel?: string;
  coord: [number, number]; // [lng, lat]
  triggerFrame: number;
  color?: string;
  size?: "sm" | "md" | "lg";
  labelSide?: "top" | "bottom" | "left" | "right";
}

export interface MapRouteSpec {
  id: string;
  from: [number, number];
  to: [number, number];
  startFrame: number;
  endFrame: number;
  color?: string;
  dashed?: boolean;
  showQuill?: boolean;
  traveler?: "pinisi" | "walker";
  arcBendDeg?: number;
}

export interface AtlasMapProps {
  width?: number;
  height?: number;
  fromCenter: [number, number];
  toCenter: [number, number];
  fromZoom: number;
  toZoom: number;
  moveStartFrame?: number;
  moveEndFrame?: number;
  midFlightZoomDip?: number;
  activeIslands?: string[];
  activeIslandFrame?: number;
  darkMode?: boolean;
  routes?: MapRouteSpec[];
  pins?: MapPinSpec[];
  focalYRatio?: number;
  /** Center [lng, lat] for subtle compass rose + rhumb rays in ocean */
  compassGeo?: [number, number];
  /** Subtle 3D tabletop map tilt (degrees) */
  tiltDeg?: number;
  /** Gentle ongoing zoom breath after arrival so map feels alive */
  idleDrift?: number;
  /** Enable 2.5D relief shadow, teal-slate textured sea, notched plaques, and compass typography */
  tactile?: boolean;
}

const FEATURES = (islandsRaw as any).features as Array<{
  type: "Feature";
  properties: { country: string; island: string };
  geometry: { type: "Polygon"; coordinates: number[][][] };
}>;

/** Real Nusantara coordinates [lng, lat] */
export const GEO = {
  garut: [107.9087, -7.2279] as [number, number],
  yogyakarta: [110.3695, -7.7956] as [number, number],
  surakarta: [110.8243, -7.5755] as [number, number],
  malang: [112.6326, -7.9666] as [number, number],
  wajo: [120.1722, -4.0289] as [number, number],
  batavia: [106.8456, -6.2088] as [number, number],
};

/** Hand-charted mountain peaks [lng, lat, scale] along Java, Sulawesi, Sumatra ridges */
const MOUNTAINS: Array<[number, number, number]> = [
  // West Java / Priangan around Garut
  [106.73, -6.71, 1.05], // Salak
  [106.98, -6.79, 1.15], // Gede-Pangrango
  [107.61, -6.76, 1.0], // Tangkuban Perahu
  [107.73, -7.32, 1.25], // Papandayan (near Garut)
  [108.05, -7.25, 1.1], // Cikuray / Galunggung
  [108.40, -6.89, 1.1], // Ciremai
  // Central Java (Slamet, Dieng, Merapi, Merbabu, Lawu)
  [109.21, -7.24, 1.25], // Slamet
  [109.92, -7.22, 1.05], // Sindoro-Sumbing
  [110.44, -7.54, 1.3], // Merapi-Merbabu (north of Jogja)
  [111.19, -7.62, 1.15], // Lawu (east of Surakarta)
  // East Java (Wilis, Arjuno, Semeru, Bromo, Ijen)
  [111.76, -7.81, 1.05], // Wilis
  [112.59, -7.73, 1.1], // Arjuno
  [112.92, -8.11, 1.35], // Semeru (near Malang)
  [113.56, -7.96, 1.0], // Argopuro
  [114.24, -8.06, 1.05], // Ijen
  // South & Central Sulawesi spine
  [119.91, -5.34, 1.2], // Lompobattang
  [120.02, -3.38, 1.3], // Latimojong (north of Wajo)
  [119.35, -3.1, 1.05], // Quarles
  [121.45, -2.55, 1.1], // Verbeek
  [120.42, -1.65, 1.0], // Poso Highlands
  // Sumatra / Kalimantan context peaks
  [104.62, -5.45, 1.0], // Lampung Rajabasa
  [103.13, -4.02, 1.2], // Dempo
  [116.5, 0.4, 1.25], // Borneo spine
];

/** Illustrated lowland forest & palm grove clusters [lng, lat] */
const FORESTS: Array<[number, number]> = [
  [105.9, -6.6],
  [106.4, -7.0],
  [107.2, -6.5],
  [108.6, -7.45],
  [109.6, -7.0],
  [110.0, -7.85],
  [111.5, -7.15],
  [112.2, -7.3],
  [113.2, -7.75],
  [113.9, -7.8],
  [119.65, -4.65],
  [120.45, -4.35],
  [119.85, -3.75],
  [121.6, -3.8],
  [115.2, -2.2],
  [113.8, -1.4],
  [103.5, -2.5],
];

const OCEAN_LABELS: Array<{ text: string; coord: [number, number]; size: number; rot: number }> = [
  { text: "LAUT JAWA", coord: [110.6, -5.45], size: 22, rot: -4 },
  { text: "SAMUDRA HINDIA", coord: [108.25, -9.25], size: 22, rot: 2 },
  { text: "SELAT MAKASSAR", coord: [117.7, -2.4], size: 17, rot: -74 },
  { text: "LAUT FLORES", coord: [120.4, -7.2], size: 15, rot: -5 },
  { text: "J A W A", coord: [110.2, -6.92], size: 18, rot: 5 },
  { text: "BORNEO", coord: [115.6, -0.7], size: 18, rot: 0 },
  { text: "SULAWESI", coord: [121.3, -1.65], size: 15, rot: -6 },
];

export const AtlasMap2D: React.FC<AtlasMapProps> = ({
  width = 1080,
  height = 1920,
  fromCenter,
  toCenter,
  fromZoom,
  toZoom,
  moveStartFrame = 0,
  moveEndFrame = 60,
  midFlightZoomDip = 1,
  activeIslands = [],
  activeIslandFrame = 0,
  darkMode = false,
  routes = [],
  pins = [],
  focalYRatio = 0.43,
  compassGeo = [112.4, -5.5],
  tiltDeg = 6.5,
  idleDrift = 0.04,
  tactile = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Signature 12fps editorial stutter step for overlays
  const STEP = Math.max(1, Math.round(fps / 12));
  const f12 = Math.floor(frame / STEP) * STEP;

  const { baseProj, basePaths, projectedMountains, projectedForests, projectedOceanLabels, compassPt } =
    useMemo(() => {
      const proj = geoMercator()
        .center([113.5, -4.5])
        .scale(2200)
        .translate([width / 2, height * focalYRatio]);
      const pathGen = geoPath(proj);
      const paths = FEATURES.map((feat, idx) => ({
        key: `${feat.properties.island}_${idx}`,
        island: feat.properties.island,
        country: feat.properties.country,
        d: pathGen(feat as any) || "",
      }));
      const mtns = MOUNTAINS.map(([lng, lat, sc], i) => {
        const pt = proj([lng, lat]);
        return pt ? { id: i, x: pt[0], y: pt[1], sc } : null;
      }).filter(Boolean) as Array<{ id: number; x: number; y: number; sc: number }>;

      const fsts = FORESTS.map(([lng, lat], i) => {
        const pt = proj([lng, lat]);
        return pt ? { id: i, x: pt[0], y: pt[1] } : null;
      }).filter(Boolean) as Array<{ id: number; x: number; y: number }>;

      const oLabels = OCEAN_LABELS.map((l) => {
        const pt = proj(l.coord);
        return pt ? { ...l, x: pt[0], y: pt[1] } : null;
      }).filter(Boolean) as Array<{ text: string; size: number; rot: number; x: number; y: number }>;

      const cpt = proj(compassGeo) || [width / 2, height * 0.4];
      return {
        baseProj: proj,
        basePaths: paths,
        projectedMountains: mtns,
        projectedForests: fsts,
        projectedOceanLabels: oLabels,
        compassPt: cpt,
      };
    }, [width, height, focalYRatio, compassGeo]);

  const rawT =
    moveEndFrame <= moveStartFrame
      ? 1
      : interpolate(frame, [moveStartFrame, moveEndFrame], [0, 1], {
          easing: Easing.inOut(Easing.cubic),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

  const curGeo = useMemo(
    () => geoInterpolate(fromCenter, toCenter)(rawT) as [number, number],
    [fromCenter, toCenter, rawT]
  );

  const zoomInterp = interpolate(rawT, [0, 1], [fromZoom, toZoom]);
  const arcBell = 4 * rawT * (1 - rawT);
  const breathe = 1 + (frame / 180) * idleDrift + Math.sin(frame * 0.04) * 0.008;
  const curZoom = zoomInterp * (1 - (1 - midFlightZoomDip) * arcBell) * breathe;

  const curPt = baseProj(curGeo) || [width / 2, height * focalYRatio];
  const tx = width / 2 - curPt[0] * curZoom;
  const ty = height * focalYRatio - curPt[1] * curZoom;
  const liveTilt = tiltDeg * (0.7 + 0.3 * arcBell);

  const focusAlpha = interpolate(f12, [activeIslandFrame, activeIslandFrame + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const c = darkMode
    ? {
        seaTop: "#192026",
        seaBot: "#11161a",
        grid: "rgba(218, 179, 108, 0.14)",
        coastHalo: "rgba(180, 146, 94, 0.16)",
        land: "#362b1f",
        landStroke: "#7a6144",
        neighbor: "#241d15",
        active: "#8d4d24",
        activeStroke: "#dba652",
        mtnLit: "#8b6639",
        mtnDark: "#3e2b17",
        tree: "#4f623c",
        seaLabel: "rgba(224, 198, 152, 0.34)",
        tagBg: "#1b140e",
        tagBorder: "#c49449",
        tagText: "#f6ebd4",
      }
    : tactile
    ? {
        seaTop: "#848d83",
        seaBot: "#5c6861",
        grid: "rgba(44, 30, 17, 0.22)",
        coastHalo: "rgba(220, 224, 210, 0.24)",
        land: "#d39b53",
        landStroke: "#3b2210",
        neighbor: "#b09976",
        active: "#c97c35",
        activeStroke: "#2b1708",
        mtnLit: "#8d5d28",
        mtnDark: "#2b1909",
        tree: "#455b2f",
        seaLabel: "rgba(28, 20, 12, 0.44)",
        tagBg: "#f5ebd3",
        tagBorder: "#56381b",
        tagText: "#23150a",
      }
    : {
        seaTop: "#ddd1b8",
        seaBot: "#c7bca4",
        grid: "rgba(92, 68, 42, 0.14)",
        coastHalo: "rgba(104, 128, 122, 0.25)",
        land: "#dfca9f",
        landStroke: "#5b4126",
        neighbor: "#cfc3a9",
        active: "#cc8648",
        activeStroke: "#462912",
        mtnLit: "#b68e56",
        mtnDark: "#6a4b29",
        tree: "#536942",
        seaLabel: "rgba(74, 54, 34, 0.42)",
        tagBg: "#f6eedc",
        tagBorder: "#5e4326",
        tagText: "#23160c",
      };

  const projectedRoutes = useMemo(() => {
    return routes.map((r) => {
      const steps = 40;
      const interp = geoInterpolate(r.from, r.to);
      const pts: [number, number][] = [];
      for (let i = 0; i <= steps; i++) {
        const s = i / steps;
        const [lng, lat] = interp(s);
        const bend = (r.arcBendDeg ?? 0) * Math.sin(Math.PI * s);
        const p = baseProj([lng, lat + bend]);
        if (p) pts.push(p);
      }
      const d = pts.map((p, idx) => `${idx === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
      return { ...r, pts, d };
    });
  }, [routes, baseProj]);

  const projectedPins = useMemo(() => {
    return pins.map((p) => {
      const xy = baseProj(p.coord) || [0, 0];
      return { ...p, x: xy[0], y: xy[1] };
    });
  }, [pins, baseProj]);

  // Balanced icon scaling as camera zooms tightly into Java/Garut
  const worldFeatureScale = 1 / Math.pow(curZoom, 0.55);
  const safeMapScale = 1.03 + Math.abs(liveTilt) * 0.013;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", backgroundColor: c.seaBot }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transformOrigin: "50% 48%",
          transform: `perspective(1500px) rotateX(${liveTilt.toFixed(2)}deg) scale(${safeMapScale.toFixed(4)})`,
        }}
      >
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <radialGradient id={`seaPar_${darkMode ? "d" : "l"}`} cx="48%" cy="42%" r="72%">
            <stop offset="0%" stopColor={c.seaTop} />
            <stop offset="100%" stopColor={c.seaBot} />
          </radialGradient>
          <radialGradient id="atlasSunWash" cx="50%" cy="16%" r="58%">
            <stop offset="0%" stopColor="#f0ca8e" stopOpacity={0.86} />
            <stop offset="48%" stopColor="#d9aa6b" stopOpacity={0.34} />
            <stop offset="100%" stopColor="#7a8478" stopOpacity={0} />
          </radialGradient>
          <filter id="atlasRelief" x="-8%" y="-8%" width="118%" height="122%">
            <feDropShadow dx="4" dy="7" stdDeviation="4.5" floodColor="#181008" floodOpacity="0.54" />
          </filter>
          <pattern id="atlasPaperGrain" width="256" height="256" patternUnits="userSpaceOnUse">
            <image href={staticFile("art/textures/parchment_grain_alpha.png")} width="256" height="256" />
          </pattern>
        </defs>
        <rect width={width} height={height} fill={`url(#seaPar_${darkMode ? "d" : "l"})`} />
        {tactile && !darkMode && (
          <>
            <rect width={width} height={height} fill="url(#atlasSunWash)" />
            <rect width={width} height={height} fill="url(#atlasPaperGrain)" opacity={0.44} />
          </>
        )}

        {/* Projected Map World */}
        <g transform={`translate(${tx.toFixed(2)}, ${ty.toFixed(2)}) scale(${curZoom.toFixed(4)})`}>
          {/* Fine Cartographic Lat/Long Meridian Grid */}
          {[-12, -10, -8, -6, -4, -2, 0, 2, 4].map((lat) => {
            const p0 = baseProj([94, lat]);
            const p1 = baseProj([142, lat]);
            if (!p0 || !p1) return null;
            return (
              <line
                key={`lat_${lat}`}
                x1={p0[0]}
                y1={p0[1]}
                x2={p1[0]}
                y2={p1[1]}
                stroke={c.grid}
                strokeWidth={0.9 / curZoom}
              />
            );
          })}
          {[96, 102, 108, 114, 120, 126, 132, 138].map((lng) => {
            const p0 = baseProj([lng, -13]);
            const p1 = baseProj([lng, 7]);
            if (!p0 || !p1) return null;
            return (
              <line
                key={`lng_${lng}`}
                x1={p0[0]}
                y1={p0[1]}
                x2={p1[0]}
                y2={p1[1]}
                stroke={c.grid}
                strokeWidth={0.9 / curZoom}
              />
            );
          })}

          {/* Radiating 16-point Nautical Rhumb Lines + Embedded Compass Rose in Sea */}
          <g transform={`translate(${compassPt[0]}, ${compassPt[1]})`} opacity={tactile ? 0.88 : darkMode ? 0.34 : 0.44}>
            {Array.from({ length: 16 }, (_, i) => {
              const a = (i * Math.PI) / 8;
              return (
                <line
                  key={`rhumb_${i}`}
                  x1={0}
                  y1={0}
                  x2={Math.cos(a) * 1200}
                  y2={Math.sin(a) * 1200}
                  stroke={c.landStroke}
                  strokeWidth={(i % 4 === 0 ? 1.1 : 0.6) / curZoom}
                  strokeOpacity={tactile ? (i % 4 === 0 ? 0.32 : 0.14) : i % 4 === 0 ? 0.55 : 0.28}
                />
              );
            })}
            <g transform={`scale(${(worldFeatureScale * (tactile ? 1.32 : 1.15)).toFixed(4)})`}>
              <circle r={44} fill={tactile ? "#f4e6ca" : c.seaTop} fillOpacity={tactile ? 0.68 : 0.55} stroke={c.landStroke} strokeWidth={1.8} />
              <circle r={36} fill="none" stroke={c.landStroke} strokeWidth={0.9} strokeDasharray="3 3" />
              {/* Minor diagonal points when tactile */}
              {tactile && (
                <g opacity={0.85}>
                  <polygon points="-26,-26 -6,-2 0,0 -2,-6" fill={c.landStroke} />
                  <polygon points="26,-26 6,-2 0,0 2,-6" fill="#e8d4ad" stroke={c.landStroke} strokeWidth={0.6} />
                  <polygon points="-26,26 -6,2 0,0 -2,6" fill="#e8d4ad" stroke={c.landStroke} strokeWidth={0.6} />
                  <polygon points="26,26 6,2 0,0 2,6" fill={c.landStroke} />
                </g>
              )}
              <polygon points="0,-41 7,-7 0,0 -7,-7" fill={HERITAGE.oxblood} stroke={c.landStroke} strokeWidth={0.8} />
              <polygon points="0,41 7,7 0,0 -7,7" fill={c.landStroke} />
              <polygon points="-41,0 -7,-7 0,0 -7,7" fill={c.landStroke} />
              <polygon points="41,0 7,-7 0,0 7,7" fill={tactile ? "#f3e2c0" : c.landStroke} stroke={c.landStroke} strokeWidth={0.8} />
              <circle r={5} fill="#f8ecd2" stroke={c.landStroke} strokeWidth={1.5} />
              {tactile && (
                <g fontFamily={FONT_SERIF} fontWeight={900} fontSize={16} fill="#26160a" textAnchor="middle">
                  <text x={0} y={-50}>U</text>
                  <text x={55} y={5}>T</text>
                  <text x={0} y={62}>S</text>
                  <text x={-55} y={5}>B</text>
                </g>
              )}
            </g>
          </g>

          {/* Coastal Sea Bathymetry Contour Halos */}
          {basePaths
            .filter((b) => b.island !== "neighbor")
            .map((b) => (
              <g key={`halo_${b.key}`}>
                <path
                  d={b.d}
                  fill="none"
                  stroke={c.coastHalo}
                  strokeWidth={22 / curZoom}
                  strokeLinejoin="round"
                />
                <path
                  d={b.d}
                  fill="none"
                  stroke={c.landStroke}
                  strokeOpacity={0.22}
                  strokeWidth={1.1 / curZoom}
                  strokeDasharray={`${5 / curZoom} ${4 / curZoom}`}
                  strokeLinejoin="round"
                  transform={`scale(1.003)`}
                />
              </g>
            ))}

          {/* Neighbor Landmasses */}
          {basePaths
            .filter((b) => b.island === "neighbor")
            .map((b) => (
              <path
                key={b.key}
                d={b.d}
                fill={c.neighbor}
                fillOpacity={0.52}
                stroke={c.landStroke}
                strokeOpacity={0.32}
                strokeWidth={0.9 / curZoom}
              />
            ))}

          {/* Indonesian Islands */}
          <g filter={tactile ? "url(#atlasRelief)" : undefined}>
            {basePaths
              .filter((b) => b.island !== "neighbor")
              .map((b) => {
                const isFocus = activeIslands.includes(b.island);
                const fill = isFocus ? c.active : c.land;
                const opacity = activeIslands.length === 0 ? 0.96 : isFocus ? 0.58 + 0.4 * focusAlpha : tactile ? 0.84 : 0.56;
                return (
                  <g key={b.key}>
                    <path
                      d={b.d}
                      fill={fill}
                      fillOpacity={opacity}
                      stroke={isFocus ? c.activeStroke : c.landStroke}
                      strokeWidth={(isFocus ? 2.2 : 1.25) / curZoom}
                      strokeLinejoin="round"
                    />
                    {tactile && (
                      <path
                        d={b.d}
                        fill="none"
                        stroke="#fce4ba"
                        strokeOpacity={0.38}
                        strokeWidth={1.0 / curZoom}
                        strokeLinejoin="round"
                      />
                    )}
                  </g>
                );
              })}
          </g>

          {/* Hand-Illustrated Lowland Grove Clusters */}
          {projectedForests.map((f) => (
            <g
              key={`fst_${f.id}`}
              transform={`translate(${f.x}, ${f.y}) scale(${(worldFeatureScale * 0.85).toFixed(4)})`}
              opacity={0.78}
            >
              <circle cx={-6} cy={1} r={4.5} fill={c.tree} stroke={c.landStroke} strokeWidth={0.8} />
              <circle cx={2} cy={-2} r={5.5} fill={c.tree} stroke={c.landStroke} strokeWidth={0.8} />
              <circle cx={7} cy={2} r={4} fill={c.tree} stroke={c.landStroke} strokeWidth={0.8} />
            </g>
          ))}

          {/* Hand-Shaded Illustrated Mountain Cones along real spines */}
          {projectedMountains.map((m) => {
            const ms = m.sc * worldFeatureScale;
            return (
              <g key={`mtn_${m.id}`} transform={`translate(${m.x}, ${m.y}) scale(${ms.toFixed(4)})`}>
                {/* Soft base shadow */}
                <ellipse cx={1} cy={2} rx={12} ry={3.5} fill="rgba(25,16,8,0.16)" />
                {/* Lit western slope */}
                <polygon
                  points="-11,2 0,-14 1,2"
                  fill={c.mtnLit}
                  stroke={c.landStroke}
                  strokeWidth={0.9}
                  strokeLinejoin="round"
                />
                {/* Shaded eastern ridge */}
                <polygon
                  points="0,-14 11,2 0,2"
                  fill={c.mtnDark}
                  stroke={c.landStroke}
                  strokeWidth={0.9}
                  strokeLinejoin="round"
                />
                {/* Ridge shadow hachure */}
                <line x1={0} y1={-13} x2={3.5} y2={0} stroke="rgba(255,244,224,0.22)" strokeWidth={0.7} />
              </g>
            );
          })}

          {/* Engraved Italic Sea & Archipelago Labels */}
          {projectedOceanLabels.map((lbl, idx) => (
            <text
              key={`sea_${idx}`}
              x={lbl.x}
              y={lbl.y}
              textAnchor="middle"
              transform={`rotate(${lbl.rot}, ${lbl.x}, ${lbl.y}) scale(${1 / Math.pow(curZoom, 0.4)})`}
              style={{
                transformBox: "fill-box",
                transformOrigin: "center",
              }}
              fontFamily={FONT_SERIF}
              fontStyle="italic"
              fontWeight={600}
              fontSize={lbl.size / curZoom * Math.pow(curZoom, 0.35)}
              letterSpacing={(4 / curZoom) * Math.pow(curZoom, 0.35)}
              fill={c.seaLabel}
            >
              {lbl.text}
            </text>
          ))}

          {/* 12fps Ink Routes + Dip-Pen Nib */}
          {projectedRoutes.map((r) => {
            const draw = interpolate(f12, [r.startFrame, r.endFrame], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            if (draw <= 0.01) return null;
            const headIdx = Math.min(r.pts.length - 1, Math.floor(draw * (r.pts.length - 1)));
            const head = r.pts[headIdx] || r.pts[0];
            const prev = r.pts[Math.max(0, headIdx - 1)] || head;
            const angleDeg = (Math.atan2(head[1] - prev[1], head[0] - prev[0]) * 180) / Math.PI;
            const inkColor = r.color ?? HERITAGE.oxblood;

            return (
              <g key={r.id}>
                <path
                  d={r.d}
                  fill="none"
                  stroke="#000000"
                  strokeOpacity={tactile ? 0.34 : 0.16}
                  strokeWidth={(tactile ? 9.5 : 7) / curZoom}
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray={r.dashed ? `${9 / curZoom} ${7 / curZoom}` : undefined}
                  strokeDashoffset={r.dashed ? 0 : 1 - draw}
                />
                <path
                  d={r.d}
                  fill="none"
                  stroke={inkColor}
                  strokeWidth={(tactile ? 5.2 : 4.2) / curZoom}
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray={r.dashed ? `${9 / curZoom} ${7 / curZoom}` : "1"}
                  strokeDashoffset={1 - draw}
                />
                {tactile && (
                  <path
                    d={r.d}
                    fill="none"
                    stroke="#fff3d6"
                    strokeOpacity={0.5}
                    strokeWidth={1.3 / curZoom}
                    strokeLinecap="round"
                    pathLength={1}
                    strokeDasharray={r.dashed ? `${9 / curZoom} ${7 / curZoom}` : "1"}
                    strokeDashoffset={1 - draw}
                  />
                )}
                {r.traveler === "pinisi" && draw > 0.04 && (
                  <g
                    transform={`translate(${head[0]}, ${head[1] - 6 / curZoom}) scale(${(0.95 / curZoom).toFixed(4)}) rotate(${Math.sin(frame * 0.14) * 3.5})`}
                  >
                    <path d="M-18,0 L16,0 Q12,9 -12,9 Z" fill="#5e371b" stroke="#f7eed9" strokeWidth={1.6} />
                    <path d="M-3,-2 L-3,-24 L-15,-4 Z" fill="#f7eed9" stroke="#26180d" strokeWidth={1.4} />
                    <path d="M2,-2 L2,-20 L13,-4 Z" fill="#efe0bc" stroke="#26180d" strokeWidth={1.4} />
                  </g>
                )}
                {r.traveler === "walker" && draw > 0.04 && (tactile ? draw <= 1 : draw < 0.99) && (
                  tactile ? (
                    <g transform={`translate(${head[0]}, ${head[1]}) rotate(${angleDeg}) scale(${(1 / curZoom).toFixed(4)})`}>
                      <polygon points="10,0 -8,-7 -5,0 -8,7" fill={inkColor} stroke="#fff2d6" strokeWidth={1.6} strokeLinejoin="round" />
                    </g>
                  ) : (
                    <g transform={`translate(${head[0]}, ${head[1]}) scale(${(1 / curZoom).toFixed(4)})`}>
                      <circle r={8} fill={inkColor} stroke="#f7eed9" strokeWidth={2.5} />
                      <circle r={3} fill="#ffe49e" />
                    </g>
                  )
                )}
                {!r.traveler && r.showQuill !== false && draw > 0.02 && draw < 0.99 && (
                  <g transform={`translate(${head[0]}, ${head[1]}) scale(${1 / curZoom})`}>
                    <circle r={5.5} fill={inkColor} stroke="#f7eed9" strokeWidth={2} />
                    <g transform={`rotate(${angleDeg - 42}) translate(4, -4)`}>
                      <path
                        d="M0,0 L14,-19 Q40,-62 56,-74 Q31,-40 23,-14 Z"
                        fill="#23170d"
                        stroke="#c89a49"
                        strokeWidth={1.4}
                      />
                      <path d="M0,0 L7,-7 L4,-10 Z" fill="#dfb358" />
                    </g>
                  </g>
                )}
              </g>
            );
          })}
        </g>

        {/* Museum Pin Stakes + Chamfered Parchment Tags (screen-space locked) */}
        {projectedPins.map((p) => {
          const sx = p.x * curZoom + tx;
          const sy = p.y * curZoom + ty;
          const local12 = f12 - p.triggerFrame;
          if (local12 < 0) return null;

          const drop = spring({
            frame: local12,
            fps,
            config: { damping: 12, stiffness: 165 },
          });
          const pulse = 1 + 0.25 * Math.max(0, Math.sin((local12 / STEP) * 0.55));
          const pinColor = p.color ?? HERITAGE.oxblood;
          const yOff = -36 * (1 - drop);
          const rCore = p.size === "lg" ? 12 : p.size === "sm" ? 7 : 10;

          const side = p.labelSide ?? "top";
          const boxW = Math.max(152, p.label.length * 13.5 + 38);
          const boxH = p.sublabel ? 56 : 38;
          let lx = sx - boxW / 2;
          let ly = sy - 34 - boxH;
          if (side === "bottom") ly = sy + 28;
          else if (side === "left") {
            lx = sx - boxW - 22;
            ly = sy - boxH / 2;
          } else if (side === "right") {
            lx = sx + 22;
            ly = sy - boxH / 2;
          }
          lx = Math.max(78, Math.min(width - 96 - boxW, lx));

          const cCut = 7;
          const tagPoly = `${cCut},0 ${boxW - cCut},0 ${boxW},${cCut} ${boxW},${boxH - cCut} ${boxW - cCut},${boxH} ${cCut},${boxH} 0,${boxH - cCut} 0,${cCut}`;

          return (
            <g key={p.id} opacity={Math.min(1, drop * 1.4)}>
              <circle
                cx={sx}
                cy={sy}
                r={rCore * 1.65 * pulse}
                fill="none"
                stroke={pinColor}
                strokeWidth={2.2}
                strokeOpacity={0.4}
              />
              <ellipse cx={sx} cy={sy + 2} rx={rCore * 0.85} ry={3.8} fill="rgba(0,0,0,0.28)" />
              <g transform={`translate(${sx}, ${sy + yOff})`}>
                <circle r={rCore} fill={pinColor} stroke="#f8efe0" strokeWidth={2.6} />
                <circle r={rCore * 0.36} fill="#f8efe0" />
              </g>
              <g transform={`translate(${lx}, ${ly + yOff * 0.35})`}>
                <polygon points={tagPoly} transform={tactile ? "translate(4, 7)" : "translate(3, 5)"} fill={tactile ? "rgba(16,10,5,0.44)" : "rgba(16,10,5,0.25)"} />
                <polygon
                  points={tagPoly}
                  fill={c.tagBg}
                  stroke={c.tagBorder}
                  strokeWidth={tactile ? 2.4 : 2}
                />
                {tactile && (
                  <>
                    <rect x={4} y={4} width={boxW - 8} height={boxH - 8} rx={3} fill="none" stroke="#966f3f" strokeWidth={1} opacity={0.62} />
                    <polygon points={`0,${boxH * 0.5 - 5} 6,${boxH * 0.5} 0,${boxH * 0.5 + 5}`} fill={c.tagBorder} />
                    <polygon points={`${boxW},${boxH * 0.5 - 5} ${boxW - 6},${boxH * 0.5} ${boxW},${boxH * 0.5 + 5}`} fill={c.tagBorder} />
                  </>
                )}
                <text
                  x={boxW / 2}
                  y={p.sublabel ? 24 : 25}
                  textAnchor="middle"
                  fill={c.tagText}
                  fontSize={18}
                  fontWeight={800}
                  fontFamily={FONT_SERIF}
                  letterSpacing={0.6}
                >
                  {p.label}
                </text>
                {p.sublabel && (
                  <text
                    x={boxW / 2}
                    y={45}
                    textAnchor="middle"
                    fill={pinColor}
                    fontSize={13}
                    fontWeight={800}
                    fontFamily={FONT_SANS}
                    letterSpacing={1.1}
                  >
                    {p.sublabel}
                  </text>
                )}
              </g>
            </g>
          );
        })}
      </svg>
      </div>
    </div>
  );
};
