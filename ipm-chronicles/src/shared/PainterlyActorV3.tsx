import React from "react";
import { staticFile } from "remotion";
import { HeritageKid, type HeritageKidProps } from "./HeritageKid";

export type PainterlyActorV3Props = HeritageKidProps & {
  /** Which horizontal screen side the main scene key-light enters from */
  lightFrom?: "left" | "right";
  /** 0..1 strength of warm interior light wrap along sunlit contour */
  lightWrap?: number;
  /** Ambient room color cast tint softly unifying character palette into scene mood */
  ambientTint?: string;
  /** 0..1 strength of ambient tint wash */
  ambientStrength?: number;
  /** Directional shadow projection angle (degrees away from light source) */
  shadowSkewDeg?: number;
  /** Shadow horizontal stretch length scale */
  shadowLength?: number;
  /** 0..1 dappled sunlight wash falling across upper torso & face */
  sunGazeWash?: number;
  /** Optional continuous frame phase to gently ripple dappled leaf gobo across coat */
  goboPhase?: number;
  /** Organic gouache edge brush displacement scale in px (default 1.35) */
  brushEdge?: number;
};

/**
 * Multi-pass 2.5D Painterly Integration Rig for HeritageKid:
 * 1. Directional projected floor cast shadow + grounded sole AO
 * 2. Organic gouache brush edge displacement (`feTurbulence` + `feDisplacementMap`)
 * 3. Directional edge light-wrap along sunlit face, hat, sleeve & trousers
 * 4. Silhouette-masked ambient room shading, gouache paper grain & sunlit gobo spill
 */
export const PainterlyActorV3: React.FC<PainterlyActorV3Props> = ({
  lightFrom = "left",
  lightWrap = 0.42,
  ambientTint = "#d89c52",
  ambientStrength = 0.24,
  shadowSkewDeg = 54,
  shadowLength = 1.15,
  sunGazeWash = 0.3,
  goboPhase = 0,
  brushEdge = 1.35,
  x = 540,
  y = 1400,
  scale = 1,
  seed = 1,
  rimColor = "#ffd98c",
  rimSide,
  rimStrength = 0.42,
  opacity = 1,
  ...kidProps
}) => {
  const uid = `pv3_${seed}`;
  const effRimSide = rimSide ?? (lightFrom === "left" ? "L" : "R");
  const lightDir = lightFrom === "left" ? -1 : 1; // -1 means light hits left edge, shadows cast right
  const shadowDir = -lightDir;
  const skewSigned = shadowDir * Math.abs(shadowSkewDeg);
  const rimDx = shadowDir * 3.8; // Offset alpha opposite light -> crisp lit upper/side contour without bottom floor bleed
  const goboShiftX = Math.sin(goboPhase * 0.7) * 14;
  const goboShiftY = Math.cos(goboPhase * 0.55) * 9;
  const walkAmpVal = Number((kidProps as { walkAmp?: number }).walkAmp ?? 0);
  const footContactScale = 1 - 0.52 * walkAmpVal;

  // Mask bounding box centered comfortably around character origin `(x, y)`
  const maskX = x - 240 * scale;
  const maskY = y - 410 * scale;
  const maskW = 480 * scale;
  const maskH = 470 * scale;

  return (
    <g opacity={opacity} style={{ isolation: "isolate" }}>
      <defs>
        {/* Subtle organic gouache edge breakup ONLY — interior kept 100% opaque alpha=1.0 */}
        <filter id={`${uid}_comp`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.046"
            numOctaves={2}
            seed={seed + 17}
            result="brushNoise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="brushNoise"
            scale={brushEdge * 0.42}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        {/* Soft blur for directional floor cast shadow + tighter blur for crisp shoe contact AO */}
        <filter id={`${uid}_shBlur`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="6.2" />
        </filter>
        <filter id={`${uid}_shoeAoBlur`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>

        {/* Cast floor shadow gradient: darkest anchored right under feet (0%), fading along cast length (100%) */}
        <linearGradient
          id={`${uid}_shGrad`}
          x1={lightFrom === "left" ? "0%" : "100%"}
          y1="0%"
          x2={lightFrom === "left" ? "100%" : "0%"}
          y2="100%"
        >
          <stop offset="0%" stopColor="#120803" stopOpacity="0.68" />
          <stop offset="48%" stopColor="#1e1006" stopOpacity="0.36" />
          <stop offset="100%" stopColor="#29170b" stopOpacity="0.03" />
        </linearGradient>

        {/* Directional ambient room shading (normal-blend safe: warm sunlit side + shadow side, zero washout) */}
        <linearGradient
          id={`${uid}_roomWash`}
          x1={lightFrom === "left" ? "0%" : "100%"}
          y1="18%"
          x2={lightFrom === "left" ? "100%" : "0%"}
          y2="78%"
        >
          <stop offset="0%" stopColor={rimColor} stopOpacity={sunGazeWash * 0.42} />
          <stop offset="45%" stopColor={ambientTint} stopOpacity={ambientStrength * 0.18} />
          <stop offset="68%" stopColor="#1d1006" stopOpacity={0} />
          <stop offset="100%" stopColor="#1d1006" stopOpacity={0.14} />
        </linearGradient>

        {/* Alpha-only archival paper & gouache grain matched directly to room walls (never opaque bleed) */}
        <pattern id={`${uid}_paperPat`} width="160" height="160" patternUnits="userSpaceOnUse">
          <image href={staticFile("art/textures/parchment_grain_alpha.png")} width="160" height="160" />
        </pattern>

        {/* Focused golden afternoon sun splash on cheek/shoulder/upper coat, fading above peci & shoes */}
        <radialGradient id={`${uid}_sunSplash`} cx={lightFrom === "left" ? "26%" : "74%"} cy="40%" r="40%">
          <stop offset="0%" stopColor="#ffe7a6" stopOpacity={sunGazeWash * 0.48} />
          <stop offset="62%" stopColor="#f4bd6e" stopOpacity={sunGazeWash * 0.12} />
          <stop offset="100%" stopColor="#f4bd6e" stopOpacity="0" />
        </radialGradient>

        {/* Exact frame-accurate character silhouette mask (using clean flat `sil` pass -> zero ID collisions) */}
        <mask id={`${uid}_silMask`}>
          <HeritageKid
            {...kidProps}
            x={x}
            y={y}
            scale={scale}
            seed={seed + 9000}
            sil="#ffffff"
            tactile={false}
            painterly={true}
            castShadow={false}
          />
        </mask>
      </defs>

      {/* PASS 1: Projected Directional Cast Floor Shadow (cast DOWN-RIGHT away from doorway) + Grounded Shoe Contact AO */}
      <g transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)}) scale(${scale.toFixed(4)})`}>
        {/* Oblique silhouette shadow stretched down-right parallel to furniture shadows */}
        <g
          transform={`scale(1, ${(0.20 * shadowLength).toFixed(3)}) skewX(${skewSigned.toFixed(1)})`}
          filter={`url(#${uid}_shBlur)`}
        >
          <ellipse cx={shadowDir * 14} cy={108} rx={52} ry={108} fill={`url(#${uid}_shGrad)`} />
          <circle cx={shadowDir * 18} cy={205} r={42} fill={`url(#${uid}_shGrad)`} />
        </g>
        {/* Soft diffused under-stride shadow + crisp grounded sole AO when feet plant */}
        <ellipse cx={shadowDir * 8} cy={4} rx={48} ry={10} fill="#160a03" opacity={0.44} filter={`url(#${uid}_shBlur)`} />
        <ellipse cx={-15} cy={1} rx={27} ry={6} fill="#120803" opacity={0.76 * footContactScale} filter={`url(#${uid}_shoeAoBlur)`} />
        <ellipse cx={19} cy={2} rx={26} ry={6} fill="#120803" opacity={0.72 * footContactScale} filter={`url(#${uid}_shoeAoBlur)`} />
      </g>

      {/* Isolated Character Body + Masked Painterly Overlays (guarantees 100% solid character opacity) */}
      <g>
        {/* PASS 2: Clean 100% Opaque Subtle-Brushed HeritageKid Core */}
        <g filter={brushEdge > 0.05 ? `url(#${uid}_comp)` : undefined}>
          <HeritageKid
            {...kidProps}
            x={x}
            y={y}
            scale={scale}
            seed={seed}
            rimColor={rimColor}
            rimSide={effRimSide}
            rimStrength={rimStrength}
            tactile={true}
            painterly={true}
            castShadow={false}
            useV2Blink={true}
          />
        </g>

        {/* PASS 3: Unified Gouache Texture + Directional Warm Wash + Moving Leaf Gobo (normal alpha blend: 0% backdrop leak) */}
        <g mask={`url(#${uid}_silMask)`} pointerEvents="none">
          <rect
            x={maskX}
            y={maskY}
            width={maskW}
            height={maskH}
            fill={`url(#${uid}_paperPat)`}
            opacity={0.18}
          />
          <rect
            x={maskX}
            y={maskY}
            width={maskW}
            height={maskH}
            fill={`url(#${uid}_roomWash)`}
            opacity={0.75}
          />
          <rect
            x={maskX}
            y={maskY}
            width={maskW}
            height={maskH}
            fill={`url(#${uid}_sunSplash)`}
            opacity={0.75}
          />
          <g transform={`translate(${(x + goboShiftX).toFixed(1)}, ${(y - 180 * scale + goboShiftY).toFixed(1)})`}>
            <ellipse cx={lightDir * 35} cy={-40} rx={92 * scale} ry={34 * scale} fill="#21140a" opacity={0.09} transform="rotate(-24)" />
            <ellipse cx={shadowDir * 25} cy={55} rx={110 * scale} ry={38 * scale} fill="#21140a" opacity={0.11} transform="rotate(-18)" />
          </g>
        </g>
      </g>
    </g>
  );
};
