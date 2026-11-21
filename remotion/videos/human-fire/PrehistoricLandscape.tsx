import React from 'react';
import { clamp, fireFlicker, hash01, lerp } from './fx';

/**
 * Reusable Prehistoric Layered Silhouettes & Diorama Props (shared across S1..S5 for 100% Art Bible consistency).
 * Inspired by Earth 24 Hours' painterly layered paper-cutout shadow-box horizons & dynamic rim-lighting!
 */

/** Smooth organic ancient tree silhouette (tall prehistoric conifer / broad canopy) with optional firelight rim */
export const PrehistoricTree: React.FC<{
  x: number;
  y: number;
  scale?: number;
  fill?: string;
  rimColor?: string;
  rimSide?: 'left' | 'right' | 'none';
  rimOpacity?: number;
  sway?: number;
  kind?: 'pine' | 'canopy' | 'gnarled';
}> = ({
  x,
  y,
  scale = 1,
  fill = '#21132b',
  rimColor = '#f8b65c',
  rimSide = 'none',
  rimOpacity = 0,
  sway = 0,
  kind = 'canopy',
}) => {
  const rx = rimSide === 'right' ? 1 : rimSide === 'left' ? -1 : 0;
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      {kind === 'pine' && (
        <g transform={`rotate(${sway * 0.5} 0 0)`}>
          {/* Flared root base & organic tapered pine trunk */}
          <path d="M -14 0 C -9 -14, -7 -60, -5 -190 L 5 -190 C 7 -60, 10 -14, 15 0 Z" fill={fill} />
          {/* Layered organic drooping boughs (painterly curved silhouettes, zero sharp geometric triangles!) */}
          <path
            d="M 0 -258 C -10 -230, -24 -208, -42 -186 C -28 -182, -18 -184, -12 -188 C -24 -164, -44 -138, -62 -118 C -42 -114, -26 -116, -16 -122 C -32 -96, -54 -68, -74 -46 C -48 -40, -22 -42, 0 -48 C 22 -42, 48 -40, 74 -46 C 54 -68, 32 -96, 16 -122 C 26 -116, 42 -114, 62 -118 C 44 -138, 24 -164, 12 -188 C 18 -184, 28 -182, 42 -186 C 24 -208, 10 -230, 0 -258 Z"
            fill={fill}
          />
          {rx !== 0 && rimOpacity > 0.04 && (
            <path
              d={rx > 0 ? 'M 2 -254 C 12 -228, 25 -206, 40 -187 M 14 -186 C 26 -162, 45 -137, 60 -119 M 18 -120 C 33 -95, 54 -68, 72 -47' : 'M -2 -254 C -12 -228, -25 -206, -40 -187 M -14 -186 C -26 -162, -45 -137, -60 -119 M -18 -120 C -33 -95, -54 -68, -72 -47'}
              fill="none"
              stroke={rimColor}
              strokeWidth={2.5}
              strokeLinecap="round"
              opacity={rimOpacity}
            />
          )}
        </g>
      )}
      {kind === 'canopy' && (
        <g transform={`rotate(${sway * 0.4} 0 0)`}>
          {/* Sculpted trunk + flared roots + spreading organic boughs */}
          <path
            d="M -30 0 C -18 -38, -14 -106, -16 -166 L -62 -214 L -50 -224 L -12 -186 L -2 -232 L 10 -188 L 54 -220 L 64 -208 L 16 -164 C 14 -104, 18 -36, 32 0 Z"
            fill={fill}
          />
          {/* Painterly scalloped organic ancient leaf crown + delicate hanging moss wisps */}
          <path
            d="M -98 -216 C -114 -232, -104 -258, -76 -262 C -68 -286, -34 -298, -2 -292 C 28 -300, 68 -286, 78 -260 C 106 -256, 116 -230, 96 -212 C 104 -192, 82 -176, 54 -182 C 36 -170, 14 -172, -2 -180 C -18 -170, -44 -170, -60 -182 C -86 -178, -106 -196, -98 -216 Z"
            fill={fill}
          />
          {/* Subtle hanging forest vines */}
          <path d="M -72 -186 Q -76 -156, -70 -132 M 66 -184 Q 70 -158, 64 -138 M -32 -176 Q -34 -152, -29 -138" fill="none" stroke={fill} strokeWidth={2.2} strokeLinecap="round" opacity={0.85} />
          {rx !== 0 && rimOpacity > 0.04 && (
            <path
              d={rx > 0 ? 'M 14 -165 C 14 -105, 18 -38, 28 -2 M 18 -292 C 48 -290, 74 -274, 78 -260 C 104 -255, 114 -232, 96 -212' : 'M -14 -165 C -14 -105, -18 -38, -28 -2 M -18 -292 C -48 -290, -74 -274, -78 -260 C -104 -255, -114 -232, -96 -212'}
              fill="none"
              stroke={rimColor}
              strokeWidth={3}
              strokeLinecap="round"
              opacity={rimOpacity}
            />
          )}
        </g>
      )}
      {kind === 'gnarled' && (
        <g>
          {/* Dramatic ancient gnarled oak with twisted roots & jagged limbs (Scene 2 Hero Tree!) */}
          <path
            d="M -46 0 C -30 -48, -24 -126, -26 -208 L -102 -272 L -88 -288 L -24 -232 L -14 -322 L 8 -320 L 16 -246 L 92 -292 L 104 -276 L 24 -216 C 22 -134, 30 -52, 52 0 Z"
            fill={fill}
          />
          {/* Scalloped dramatic storm-tossed crown */}
          <path
            d="M -134 -282 C -150 -306, -132 -340, -96 -344 C -84 -378, -36 -396, 4 -388 C 44 -396, 92 -376, 102 -342 C 138 -336, 150 -302, 128 -278 C 136 -254, 106 -238, 72 -246 C 48 -232, 18 -236, -2 -246 C -26 -234, -58 -234, -80 -248 C -114 -240, -144 -258, -134 -282 Z"
            fill={fill}
          />
          {rx !== 0 && rimOpacity > 0.04 && (
            <path
              d={rx > 0 ? 'M 22 -218 C 22 -134, 30 -52, 48 -2' : 'M -22 -210 C -22 -128, -28 -50, -42 -2'}
              fill="none"
              stroke={rimColor}
              strokeWidth={3.4}
              strokeLinecap="round"
              opacity={rimOpacity}
            />
          )}
        </g>
      )}
    </g>
  );
};

/** Prowling Prehistoric Wolf / Saber-Predator Silhouette with subtle animated gait & glowing eerie eyes */
export const PredatorBeastSilhouette: React.FC<{
  f: number;
  x: number;
  y: number;
  scale?: number;
  facing?: 1 | -1;
  eyeGlow?: number; // 0..1
  rimColor?: string;
  rimOpacity?: number;
  strideSpeed?: number;
  seed?: number;
}> = ({
  f,
  x,
  y,
  scale = 1,
  facing = 1,
  eyeGlow = 0.85,
  rimColor = '#f8b65c',
  rimOpacity = 0.15,
  strideSpeed = 0.16,
  seed = 1,
}) => {
  const cyc = Math.sin(f * strideSpeed + seed * 3.1);
  const bob = Math.abs(Math.cos(f * strideSpeed + seed * 3.1)) * -3.5;
  const tailWag = Math.sin(f * 0.12 + seed) * 10;

  return (
    <g transform={`translate(${x}, ${y + bob}) scale(${facing * scale}, ${scale})`}>
      {/* Ground Contact Shadow */}
      <ellipse cx={0} cy={4 - bob} rx={58} ry={9} fill="#100716" opacity={0.55} />
      {/* Tail */}
      <path
        d={`M -52 -46 Q -78 ${-42 + tailWag}, -88 ${-24 + tailWag}`}
        fill="none"
        stroke="#190e22"
        strokeWidth={11}
        strokeLinecap="round"
      />
      {/* Back Legs */}
      <g transform={`translate(-36, -34) rotate(${cyc * 18})`}>
        <path d="M -8 0 L -12 34 L -2 36 L 6 0 Z" fill="#170c20" />
      </g>
      <g transform={`translate(28, -36) rotate(${-cyc * 20})`}>
        <path d="M -7 0 L -5 36 L 5 36 L 7 0 Z" fill="#170c20" />
      </g>
      {/* Muscular Prowling Body + Shoulder Hump + Neck + Snout & Pointed Ears */}
      <path
        d="M -54 -44 C -42 -60, -8 -62, 18 -64 C 34 -65, 48 -58, 56 -52 L 74 -48 C 78 -44, 76 -38, 66 -36 L 54 -36 C 46 -26, 26 -24, 6 -28 C -16 -24, -40 -26, -54 -44 Z"
        fill="#1e1028"
      />
      {/* Pointed Ears */}
      <polygon points="40,-61 46,-79 54,-61" fill="#1e1028" />
      <polygon points="48,-60 56,-77 61,-58" fill="#281634" />
      {/* Front Legs */}
      <g transform={`translate(-28, -32) rotate(${-cyc * 20})`}>
        <path d="M -7 0 L -4 34 L 6 34 L 8 0 Z" fill="#1e1028" />
      </g>
      <g transform={`translate(36, -36) rotate(${cyc * 22})`}>
        <path d="M -7 0 L -3 36 L 7 36 L 8 0 Z" fill="#1e1028" />
      </g>
      {/* Subtle Fire/Moonlight Rim along Back & Snout */}
      {rimOpacity > 0.05 && (
        <path
          d="M -46 -50 C -22 -61, 14 -64, 42 -61 L 52 -74 L 58 -55 L 74 -47"
          fill="none"
          stroke={rimColor}
          strokeWidth={2.2}
          strokeLinecap="round"
          opacity={rimOpacity}
        />
      )}
      {/* Piercing Glowing Predator Eyes */}
      {eyeGlow > 0.05 && (
        <g opacity={eyeGlow * (0.82 + 0.18 * Math.sin(f * 0.25 + seed))}>
          <ellipse cx={58} cy={-51} rx={3.6} ry={2.1} fill="#ffd97a" />
          <circle cx={58} cy={-51} r={7} fill="#f8a43c" opacity={0.28} />
        </g>
      )}
    </g>
  );
};

/** Prehistoric Cave Arch Framing with Dynamic Firelight Bounce along Inner Stone Facets */
export const CaveArchLayer: React.FC<{
  f: number;
  fireGlow?: number; // 0 = cold dark cave, 1 = warmly lit cave
  fireX?: number;
  fireY?: number;
  archScale?: number;
}> = ({ f, fireGlow = 0, fireX = 360, fireY = 820, archScale = 1 }) => {
  const fl = fireFlicker(f, 9);
  const gOp = clamp(fireGlow * fl, 0, 1);
  return (
    <g transform={`translate(360, 640) scale(${archScale}) translate(-360, -640)`}>
      <defs>
        <radialGradient id="caveInnerBounce" cx={`${(fireX / 720) * 100}%`} cy={`${(fireY / 1280) * 100}%`} r="62%">
          <stop offset="0%" stopColor="#f8a84c" stopOpacity={0.46 * gOp} />
          <stop offset="48%" stopColor="#a84424" stopOpacity={0.22 * gOp} />
          <stop offset="100%" stopColor="#160a1e" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Rocky Cave Interior & Arch Wall Silhouette */}
      <path
        d="M -60 -60 L 780 -60 L 780 1340 L 660 1340 L 645 960 C 640 760, 610 560, 560 440 C 500 325, 435 280, 360 278 C 275 278, 210 330, 152 446 C 102 565, 76 765, 72 965 L 55 1340 L -60 1340 Z"
        fill="#1a0d24"
      />
      {/* Warm firelight bounce along sculpted rock facets */}
      {gOp > 0.02 && (
        <>
          <path
            d="M 645 960 C 640 760, 610 560, 560 440 C 500 325, 435 280, 360 278 C 275 278, 210 330, 152 446 C 102 565, 76 765, 72 965 L 116 965 C 122 775, 146 588, 194 475 C 242 365, 296 322, 360 322 C 424 322, 476 364, 524 472 C 570 584, 594 774, 600 960 Z"
            fill="url(#caveInnerBounce)"
          />
          <path
            d="M 74 940 C 78 755, 106 560, 156 444 C 212 330, 276 280, 360 280 C 434 280, 498 326, 558 442 C 608 558, 638 756, 642 940"
            fill="none"
            stroke="#f8b25a"
            strokeWidth={3.5}
            opacity={0.42 * gOp}
          />
        </>
      )}
    </g>
  );
};

/** Soft Starfield twinkling cleanly in deep plum night skies */
export const StarryNightSky: React.FC<{ f: number; opacity: number; count?: number }> = ({ f, opacity, count = 65 }) => {
  if (opacity <= 0.01) return null;
  return (
    <g opacity={opacity}>
      {Array.from({ length: count }).map((_, i) => {
        const sx = hash01(i * 19.3 + 1.1) * 700 + 10;
        const sy = hash01(i * 37.7 + 4.3) * 620 + 12;
        const r = i % 5 === 0 ? 2.1 : 1.15;
        const tw = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(f * 0.07 + i * 2.1));
        return <circle key={i} cx={sx} cy={sy} r={r} fill="#f4ecd8" opacity={tw} />;
      })}
    </g>
  );
};

/** Subtle Blurred Foreground Framing Foliage (Depth Plane 5 — parallax 1.38x) */
export const ForegroundFoliageFrame: React.FC<{
  parallaxX?: number;
  parallaxY?: number;
  tint?: string;
  opacity?: number;
}> = ({ parallaxX = 0, parallaxY = 0, tint = '#14091c', opacity = 0.78 }) => (
  <svg
    width={720}
    height={1280}
    viewBox="0 0 720 1280"
    style={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      opacity,
      filter: 'blur(4.5px)',
    }}
  >
    <g transform={`translate(${parallaxX * 1.38}, ${parallaxY * 1.38})`}>
      {/* Bottom-left & bottom-right blurred fern fronds */}
      <path d="M -30 1290 C 10 1160, 58 1090, 125 1045 C 88 1125, 70 1195, 65 1295 Z" fill={tint} />
      <path d="M -25 1290 C 35 1210, 108 1155, 195 1132 C 138 1192, 118 1240, 110 1295 Z" fill={tint} />
      <path d="M 750 1290 C 710 1155, 662 1085, 595 1040 C 632 1120, 650 1195, 655 1295 Z" fill={tint} />
      <path d="M 745 1290 C 685 1205, 612 1152, 525 1130 C 582 1188, 602 1238, 610 1295 Z" fill={tint} />
      {/* Top-corner overhanging branch silhouettes */}
      <path d="M -40 -20 C 30 12, 95 44, 155 96 C 88 76, 36 62, -40 52 Z" fill={tint} opacity={0.62} />
      <path d="M 760 -20 C 690 14, 625 48, 565 100 C 632 78, 684 64, 760 54 Z" fill={tint} opacity={0.62} />
    </g>
  </svg>
);
