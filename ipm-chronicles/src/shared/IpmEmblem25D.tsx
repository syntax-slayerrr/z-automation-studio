import React from "react";
import { staticFile } from "remotion";
import { clamp, lerp, smooth } from "./Flat3DCamera";

const INK = "#16120f";

export interface IpmEmblem25DProps {
  /** SVG center X in parent viewBox (default 0) */
  x?: number;
  /** SVG center Y in parent viewBox (default 0) */
  y?: number;
  /** Uniform scale multiplier */
  scale?: number;
  /** 0..1: stroke reveal progress for outer pen-shaped pentagon shield */
  drawOutline?: number;
  /** 0..1: reveal of green-yellow-green vertical stripes & crimson trim */
  fillPanels?: number;
  /** 0..1: radial emergence of the 12-pointed golden Muhammadiyah sun */
  sunProgress?: number;
  /** Continuous rotation angle (deg) for subtle living shimmer of sun rays */
  sunSpin?: number;
  /** 0..1: unfold of central open book + QS Al-Qalam:1 Arabic ribbon */
  bookProgress?: number;
  /** 0..1: drop-in progress for I - P - M letters */
  lettersProgress?: number;
  /** 0..1: 0 = authentic IPM (P), 1 = 1992-2008 IRM transition state (R, dimmed emblem) */
  irmMode?: number;
  /** 0..1: fracture/dim stress (0 = pristine, 1 = compressed/fractured under Orde Baru 1992) */
  fracture?: number;
  /** 0..1: diagonal golden specular sheen sweep position */
  shineSweep?: number;
  /** 0..1: warm aura glow behind shield */
  glow?: number;
  /** 0..1: Scene 01 twist — cold flicker + hairline fracture specifically on letter 'P' */
  pFlicker?: number;
  /** 0..1: Scene 04 Solo 2008 golden rebirth starburst rays & amplified aura */
  auraBoost?: number;
  /** Overall opacity */
  opacity?: number;
  /** Unique prefix for SVG defs ids when multiple emblems appear simultaneously */
  uid?: string;
  /** Enable 2.5D tactile parchment/gouache grain & volumetric bevel shadow */
  tactile?: boolean;
}

/**
 * Multi-layer vector reconstruction of the official Ikatan Pelajar Muhammadiyah (IPM)
 * emblem matching the official 5-sided pen shield, green-yellow-green panels,
 * crimson trim stepping around the center column, 12-ray faceted Muhammadiyah sun,
 * open book, QS Al-Qalam:1 ribbon ("ن ۚ وَالْقَلَمِ وَمَا يَسْطُرُونَ"), and red I-P-M lettering.
 */
export const IpmEmblem25D: React.FC<IpmEmblem25DProps> = ({
  x = 0,
  y = 0,
  scale = 1,
  drawOutline = 1,
  fillPanels = 1,
  sunProgress = 1,
  sunSpin = 0,
  bookProgress = 1,
  lettersProgress = 1,
  irmMode = 0,
  fracture = 0,
  shineSweep = -1,
  glow = 0.55,
  pFlicker = 0,
  auraBoost = 0,
  opacity = 1,
  uid = "ipm",
  tactile = false,
}) => {
  const oDraw = clamp(drawOutline);
  const fPan = smooth(fillPanels);
  const sProg = smooth(sunProgress);
  const bProg = smooth(bookProgress);
  const lProg = smooth(lettersProgress);
  const mIrm = smooth(irmMode);
  const fr = clamp(fracture);
  const pFlk = clamp(pFlicker);
  const aBoost = clamp(auraBoost);

  // Outer shield perimeter (perimeter length ~ 1640)
  const outerPath = "M -178 -252 L 178 -252 L 178 96 L 0 256 L -178 96 Z";
  const innerGreenLeft = "M -154 -222 L -58 -222 L -58 175 L -154 88 Z";
  const innerGreenRight = "M 58 -222 L 154 -222 L 154 88 L 58 175 Z";
  const innerYellowCenter = "M -58 -236 L 58 -236 L 58 182 L 0 234 L -58 182 Z";
  const crimsonFramePath =
    "M -166 -232 L -66 -232 L -66 -244 L 66 -244 L 66 -232 L 166 -232 L 166 92 L 0 242 L -166 92 Z";

  // 12-pointed golden Muhammadiyah sun centered at (0, -32)
  const sunCy = -32;
  const sunRays = Array.from({ length: 12 }, (_, idx) => {
    const aMid = ((idx * 30 - 90) * Math.PI) / 180;
    const aL = (((idx * 30 - 15) - 90) * Math.PI) / 180;
    const aR = (((idx * 30 + 15) - 90) * Math.PI) / 180;
    const rTip = 144;
    const rValley = 84;
    const xTip = Math.cos(aMid) * rTip;
    const yTip = sunCy + Math.sin(aMid) * rTip;
    const xL = Math.cos(aL) * rValley;
    const yL = sunCy + Math.sin(aL) * rValley;
    const xR = Math.cos(aR) * rValley;
    const yR = sunCy + Math.sin(aR) * rValley;
    const xBase = Math.cos(aMid) * 66;
    const yBase = sunCy + Math.sin(aMid) * 66;
    return { idx, xTip, yTip, xL, yL, xR, yR, xBase, yBase };
  });

  // Color desaturation shift during IRM interlude (1992-2008)
  const panelOpacity = lerp(1, 0.42, mIrm) * fPan;
  const shineX = lerp(-380, 420, clamp(shineSweep));

  return (
    <g transform={`translate(${x},${y}) scale(${scale})`} opacity={opacity}>
      <defs>
        <clipPath id={`${uid}_shield_clip`}>
          <path d={outerPath} />
        </clipPath>
        <radialGradient id={`${uid}_aura`}>
          <stop offset="0" stopColor="#ffe588" stopOpacity={Math.min(0.96, (0.72 * glow + aBoost * 0.35) * (1 - mIrm * 0.65))} />
          <stop offset="0.52" stopColor="#e59a24" stopOpacity={Math.min(0.65, (0.28 * glow + aBoost * 0.25) * (1 - mIrm * 0.7))} />
          <stop offset="1" stopColor="#e59a24" stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${uid}_shine`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff7e2" stopOpacity={0} />
          <stop offset="0.45" stopColor="#fff7cc" stopOpacity={0.58 + aBoost * 0.25} />
          <stop offset="0.55" stopColor="#fffdf4" stopOpacity={0.82 + aBoost * 0.15} />
          <stop offset="1" stopColor="#fff7e2" stopOpacity={0} />
        </linearGradient>
        <clipPath id={`${uid}_ribbon_clip`}>
          <path d="M -102 -2 Q 0 38 102 -2 L 90 32 Q 0 72 -90 32 Z" />
        </clipPath>
        <path id={`${uid}_ribbon_arc`} d="M -84 12 Q 0 56 84 12" fill="none" />
        {tactile && (
          <>
            <filter id={`${uid}_emboss`} x="-22%" y="-22%" width="148%" height="148%">
              <feDropShadow dx="-6" dy="11" stdDeviation="6.5" floodColor="#1c0d04" floodOpacity="0.54" />
            </filter>
            <pattern id={`${uid}_tex`} width="256" height="256" patternUnits="userSpaceOnUse">
              <image href={staticFile("art/textures/parchment_grain_alpha.png")} x="0" y="0" width="256" height="256" />
            </pattern>
            <linearGradient id={`${uid}_bevel_shade`} x1="1" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff8e0" stopOpacity="0.08" />
              <stop offset="0.48" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="1" stopColor="#140902" stopOpacity="0.12" />
            </linearGradient>
            <clipPath id={`${uid}_panels_clip`}>
              <path d={crimsonFramePath} />
            </clipPath>
          </>
        )}
      </defs>

      {/* Ambient luminous aura behind shield (+ golden starburst rays during Solo 2008 rebirth) */}
      {(glow > 0.02 || aBoost > 0.02) && (
        <g>
          <circle cx={0} cy={-15} r={290 + aBoost * 115} fill={`url(#${uid}_aura)`} />
          {aBoost > 0.04 && (
            <g opacity={aBoost * 0.45} transform={`rotate(${(sunSpin * 0.4).toFixed(2)}, 0, -25)`}>
              {Array.from({ length: 8 }, (_, idx) => (
                <polygon
                  key={idx}
                  points="0,-25 -22,-390 22,-390"
                  fill="#ffe794"
                  opacity={idx % 2 === 0 ? 0.5 : 0.28}
                  transform={`rotate(${idx * 45}, 0, -25)`}
                />
              ))}
            </g>
          )}
        </g>
      )}

      {/* Subtle cast drop shadow behind 2.5D embossed shield (flat fallback when not tactile) */}
      {!tactile && (
        <path
          d={outerPath}
          transform="translate(8, 12)"
          fill="#120c07"
          opacity={0.34 * fPan}
        />
      )}

      <g>
        {/* Base matte black backing shield (cast 2.5D emboss shadow lives only on backing plate so interior colors stay isolated-free & sharp) */}
        <g opacity={oDraw > 0 ? 1 : 0}>
          <path
            d={outerPath}
            fill={INK}
            fillOpacity={lerp(0, 0.99, fPan)}
            stroke={INK}
            strokeWidth={5}
            strokeLinejoin="round"
            strokeDasharray={1700}
            strokeDashoffset={(1 - oDraw) * 1700}
            filter={tactile ? `url(#${uid}_emboss)` : undefined}
          />
        </g>

        {/* Stepped Crimson Red Frame & Three Vertical Color Panels */}
        <g clipPath={`url(#${uid}_shield_clip)`} opacity={panelOpacity}>
          {/* Crimson inner bezel framing around yellow center column */}
          <path
            d={crimsonFramePath}
            fill="none"
            stroke="#c91d13"
            strokeWidth={8.5}
            strokeLinejoin="round"
          />

          {/* Green Left Panel */}
          <g transform={`translate(${-fr * 10}, ${fr * 4})`}>
            <path d={innerGreenLeft} fill="#009745" stroke={INK} strokeWidth={3.5} />
            <path d={innerGreenLeft} fill="none" stroke="#c91d13" strokeWidth={2.5} opacity={0.85} />
          </g>

          {/* Green Right Panel */}
          <g transform={`translate(${fr * 10}, ${fr * 4})`}>
            <path d={innerGreenRight} fill="#009745" stroke={INK} strokeWidth={3.5} />
            <path d={innerGreenRight} fill="none" stroke="#c91d13" strokeWidth={2.5} opacity={0.85} />
          </g>

          {/* Center Gold Yellow Panel */}
          <g transform={`translate(0, ${fr * -8})`}>
            <path d={innerYellowCenter} fill="#f7df08" stroke={INK} strokeWidth={3.8} />
          </g>

          {/* Tactile pure-alpha gouache grain & subtle directional bevel inside panels (zero milky haze!) */}
          {tactile && (
            <g clipPath={`url(#${uid}_panels_clip)`}>
              <path d={outerPath} fill={`url(#${uid}_tex)`} opacity={0.68 * fPan} />
              <path d={outerPath} fill={`url(#${uid}_bevel_shade)`} opacity={0.9 * fPan} />
            </g>
          )}

        {/* Subtle ink fracture lines when pushed under 1992 Orde Baru stress */}
        {fr > 0.04 && (
          <g stroke="#1b140e" strokeWidth={3} strokeLinecap="round" opacity={fr * 0.78}>
            <path d="M -92 -120 L -48 -58 L -64 12 L -20 82" fill="none" />
            <path d="M 88 -105 L 44 -42 L 62 28 L 16 110" fill="none" />
          </g>
        )}

        {/* Specular diagonal shine sweep */}
        {shineSweep >= 0 && shineSweep <= 1 && (
          <rect
            x={shineX}
            y={-320}
            width={110}
            height={760}
            transform="rotate(24)"
            fill={`url(#${uid}_shine)`}
            opacity={0.75}
          />
        )}
      </g>

      {/* Lettering Band: I - P - M (raised neatly inside green/yellow panels clear of slanted base trim) */}
      <g opacity={lProg} transform={`translate(0, ${(1 - lProg) * 24})`}>
        {(
          [
            { ch: "I", bx: -90, swap: false },
            { ch: "P", bx: 0, swap: true },
            { ch: "M", bx: 90, swap: false },
          ] as const
        ).map((item) => {
          const pScale = item.swap ? 1 - mIrm : 1;
          const pAlpha = item.swap && pFlk > 0 ? 1 - pFlk * 0.24 : 1;
          const letterFill =
            item.swap && pFlk > 0.15 ? "#4a5869" : tactile ? "#e22014" : "#d51e13";
          return (
            <g key={item.ch} transform={`translate(${item.bx}, 122)`}>
              {/* Cold spotlight dim badge behind flickering/fractured 'P' */}
              {item.swap && pFlk > 0.12 && (
                <circle
                  cx={0}
                  cy={-18}
                  r={33}
                  fill="#0f1822"
                  opacity={Math.min(0.78, pFlk * 0.72)}
                />
              )}
              {/* Crimson-red bold serif letter clearly readable above lower slant frame */}
              {(!item.swap || mIrm < 0.98) && (
                <text
                  x={0}
                  y={0}
                  textAnchor="middle"
                  fontFamily="Georgia, 'Times New Roman', serif"
                  fontWeight={900}
                  fontSize={52}
                  fill={letterFill}
                  stroke={INK}
                  strokeWidth={tactile ? 3.4 : 4.6}
                  paintOrder="stroke"
                  transform={`scale(${pScale.toFixed(3)}, 1)`}
                  opacity={(item.swap ? 1 - mIrm : 1) * pAlpha}
                >
                  {item.ch}
                </text>
              )}
              {/* Bold fissure & cold spark across 'P' on Scene 01 twist */}
              {item.swap && pFlk > 0.1 && (
                <g opacity={Math.min(1, pFlk * 1.15)}>
                  <path
                    d="M -18 -54 L 6 -28 L -10 -12 L 16 14"
                    fill="none"
                    stroke={INK}
                    strokeWidth={6.5}
                    strokeLinecap="round"
                    opacity={0.9}
                    transform="translate(1.5, 1.5)"
                  />
                  <path
                    d="M -18 -54 L 6 -28 L -10 -12 L 16 14"
                    fill="none"
                    stroke="#dceeff"
                    strokeWidth={3.4}
                    strokeLinecap="round"
                  />
                </g>
              )}
              {item.swap && mIrm > 0.02 && (
                <text
                  x={0}
                  y={0}
                  textAnchor="middle"
                  fontFamily="Georgia, 'Times New Roman', serif"
                  fontWeight={900}
                  fontSize={52}
                  fill="#445263"
                  stroke={INK}
                  strokeWidth={4.6}
                  paintOrder="stroke"
                  transform={`scale(${mIrm.toFixed(3)}, 1)`}
                  opacity={mIrm}
                >
                  R
                </text>
              )}
            </g>
          );
        })}
      </g>

      {/* Center Medallion: 12-Pointed Golden Muhammadiyah Sun */}
      {sProg > 0.01 && (
        <g
          transform={`translate(0, ${sunCy}) scale(${lerp(0.25, 1, sProg)}) rotate(${sunSpin.toFixed(2)}) translate(0, ${-sunCy})`}
          opacity={sProg * lerp(1, 0.52, mIrm)}
        >
          {sunRays.map((r) => (
            <g key={r.idx}>
              {/* Bright gold left facet */}
              <polygon
                points={`${r.xBase},${r.yBase} ${r.xL},${r.yL} ${r.xTip},${r.yTip}`}
                fill="#fad31c"
                stroke={INK}
                strokeWidth={2}
                strokeLinejoin="round"
              />
              {/* Warm amber-gold right facet for 2.5D sculptural ridge */}
              <polygon
                points={`${r.xBase},${r.yBase} ${r.xTip},${r.yTip} ${r.xR},${r.yR}`}
                fill="#db9b09"
                stroke={INK}
                strokeWidth={2}
                strokeLinejoin="round"
              />
            </g>
          ))}
        </g>
      )}

      {/* White Medallion + Open Book + Curved Scroll Ribbon (QS Al-Qalam: 1) */}
      {bProg > 0.01 && (
        <g
          transform={`translate(0, ${sunCy}) scale(${lerp(0.55, 1, bProg)}) translate(0, ${-sunCy})`}
          opacity={bProg * lerp(1, 0.72, mIrm)}
        >
          {/* White solar core */}
          <circle cx={0} cy={sunCy} r={74} fill="#fdfaf2" stroke={INK} strokeWidth={4} />

          {/* Open Book (Kitab) inside central circle */}
          <g transform={`translate(0, ${sunCy - 10})`}>
            {/* Book dark outer cover silhouette */}
            <path
              d="M -54 -22 Q -27 -30 0 -18 Q 27 -30 54 -22 L 50 24 Q 24 14 0 26 Q -24 14 -50 24 Z"
              fill={INK}
            />
            {/* Left arched white page */}
            <path
              d="M -48 -18 Q -24 -25 -2 -14 L -2 19 Q -23 9 -45 18 Z"
              fill="#ffffff"
              stroke={INK}
              strokeWidth={2.5}
              strokeLinejoin="round"
            />
            {/* Right arched white page */}
            <path
              d="M 48 -18 Q 24 -25 2 -14 L 2 19 Q 23 9 45 18 Z"
              fill="#f4efe3"
              stroke={INK}
              strokeWidth={2.5}
              strokeLinejoin="round"
            />
            {tactile && (
              <g stroke="#785c3c" strokeWidth={1.6} strokeLinecap="round" opacity={0.62}>
                <path d="M -39 -9 Q -23 -14 -9 -7" fill="none" />
                <path d="M -38 0 Q -23 -5 -9 2" fill="none" />
                <path d="M -36 9 Q -22 4 -9 10" fill="none" />
                <path d="M 39 -9 Q 23 -14 9 -7" fill="none" />
                <path d="M 38 0 Q 23 -5 9 2" fill="none" />
                <path d="M 36 9 Q 22 4 9 10" fill="none" />
              </g>
            )}
          </g>

          {/* Curved White Scroll Ribbon with Arabic Motto QS. Al-Qalam: 1 */}
          <g transform="translate(0, 4)">
            <path
              d="M -105 -4 Q 0 38 105 -4 L 91 34 Q 0 74 -91 34 Z"
              fill="#fdfaf2"
              stroke={INK}
              strokeWidth={3.4}
              strokeLinejoin="round"
            />
            {/* Swallowtail ribbon notches */}
            <path d="M -105 -4 L -88 16 L -91 34" fill="none" stroke={INK} strokeWidth={2.6} />
            <path d="M 105 -4 L 88 16 L 91 34" fill="none" stroke={INK} strokeWidth={2.6} />
            <g clipPath={`url(#${uid}_ribbon_clip)`}>
              <text
                fontFamily="'Segoe UI', 'Traditional Arabic', 'Times New Roman', serif"
                fontWeight={900}
                fontSize={16.5}
                fill="#120b05"
                textAnchor="middle"
                dominantBaseline="central"
                direction="rtl"
              >
                <textPath href={`#${uid}_ribbon_arc`} startOffset="50%">
                  ن ۚ والقلم وما يسطرون
                </textPath>
              </text>
            </g>
          </g>
        </g>
      )}
      </g>
    </g>
  );
};
