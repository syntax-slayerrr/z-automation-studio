import React from "react";
import { staticFile } from "remotion";
import { clamp, lerp } from "../../shared/Flat3DCamera";
import {
  criticallyDampedSpring,
  HERITAGE_PX_PER_METER,
  metersToPx,
  minJerk,
} from "../../shared/mathMotion";
import { FONT_MONO, FONT_SANS, FONT_SERIF } from "../../shared/PaperTextures";

const INK = "#22150c";

/**
 * Shared SVG procedural surface & grain definitions preserving EP01/EP02 museum heritage look
 * without relying on any AI-generated raster backdrops.
 */
export const Ep03SurfaceDefs: React.FC<{ uid: string }> = ({ uid }) => (
  <defs>
    <pattern id={`${uid}_plaster`} width="280" height="280" patternUnits="userSpaceOnUse">
      <image href={staticFile("art/textures/plaster_grain.png")} width="280" height="280" />
    </pattern>
    <pattern id={`${uid}_parchment`} width="256" height="256" patternUnits="userSpaceOnUse">
      <image href={staticFile("art/textures/parchment_tactile.png")} width="256" height="256" />
    </pattern>
    <pattern id={`${uid}_parchAlpha`} width="256" height="256" patternUnits="userSpaceOnUse">
      <image href={staticFile("art/textures/parchment_grain_alpha.png")} width="256" height="256" />
    </pattern>
    <filter id={`${uid}_cardShadow`} x="-14%" y="-14%" width="132%" height="138%">
      <feDropShadow dx="-4" dy="8" stdDeviation="6" floodColor="#180c04" floodOpacity="0.42" />
    </filter>
    <filter id={`${uid}_softBlur4`} x="-25%" y="-25%" width="150%" height="150%">
      <feGaussianBlur stdDeviation="4.2" />
    </filter>
    <linearGradient id={`${uid}_teakWood`} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#5d3b20" />
      <stop offset="55%" stopColor="#462b16" />
      <stop offset="100%" stopColor="#2e1b0d" />
    </linearGradient>
    <linearGradient id={`${uid}_walnutTop`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#6c4526" />
      <stop offset="45%" stopColor="#4c2f18" />
      <stop offset="100%" stopColor="#351f0f" />
    </linearGradient>
    <linearGradient id={`${uid}_limeWall`} x1="0" y1="0" x2="0.1" y2="1">
      <stop offset="0%" stopColor="#efe2c4" />
      <stop offset="55%" stopColor="#dec89f" />
      <stop offset="100%" stopColor="#c4a678" />
    </linearGradient>
    <linearGradient id={`${uid}_nightWall`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#291d14" />
      <stop offset="55%" stopColor="#21160e" />
      <stop offset="100%" stopColor="#160f09" />
    </linearGradient>
    <linearGradient id={`${uid}_chalkSlate`} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#213529" />
      <stop offset="65%" stopColor="#1b2c22" />
      <stop offset="100%" stopColor="#132119" />
    </linearGradient>
  </defs>
);

/**
 * Returns exact SVG Y coordinate of classroom desktop surface matched to HeritageKid's seated anatomy
 * (so shoulders, shirt buttons, arms & hands remain cleanly visible above desktop edge).
 */
export function getDeskTopY(floorY: number, charScale = 0.92): number {
  return floorY - 118 * charScale;
}

/**
 * 1:1 Heritage Classroom Desk matching seated HeritageKid anatomy (`topY = floorY - 118 * charScale`)
 * Drawn in front of seated HeritageKid so forearms rest naturally on desktop while thighs tuck behind apron.
 */
export const HeritageSchoolDeskSet: React.FC<{
  x: number;
  floorY: number;
  charScale?: number;
  widthM?: number;
  woodFill?: string;
  uid: string;
}> = ({ x, floorY, charScale = 0.92, widthM = 0.92, uid }) => {
  const pxW = metersToPx(widthM, charScale);
  const topY = getDeskTopY(floorY, charScale);
  const apronH = 30 * charScale;
  const halfW = pxW / 2;

  return (
    <g>
      {/* Oblique directional floor contact shadows under desk legs */}
      <ellipse cx={x} cy={floorY + 3} rx={halfW * 1.1} ry={9 * charScale} fill="#180d05" opacity={0.34} />
      {/* Desk legs anchored flush at floorY */}
      <rect
        x={x - halfW + 10 * charScale}
        y={topY + apronH}
        width={12 * charScale}
        height={floorY - (topY + apronH)}
        fill="#392211"
        stroke={INK}
        strokeWidth={1.8}
      />
      <rect
        x={x + halfW - 22 * charScale}
        y={topY + apronH}
        width={12 * charScale}
        height={floorY - (topY + apronH)}
        fill="#2b190c"
        stroke={INK}
        strokeWidth={1.8}
      />
      {/* Desk apron drawer front */}
      <rect
        x={x - halfW + 6 * charScale}
        y={topY + 6 * charScale}
        width={pxW - 12 * charScale}
        height={apronH}
        rx={3}
        fill={`url(#${uid}_teakWood)`}
        stroke={INK}
        strokeWidth={2}
      />
      {/* Angled wood desktop bevel catching sunlight */}
      <polygon
        points={`${x - halfW - 8 * charScale},${topY + 6 * charScale} ${x + halfW + 8 * charScale},${
          topY + 6 * charScale
        } ${x + halfW - 12 * charScale},${topY - 12 * charScale} ${x - halfW + 12 * charScale},${
          topY - 12 * charScale
        }`}
        fill={`url(#${uid}_walnutTop)`}
        stroke={INK}
        strokeWidth={2.2}
      />
      <line
        x1={x - halfW + 14 * charScale}
        y1={topY - 9 * charScale}
        x2={x + halfW - 14 * charScale}
        y2={topY - 9 * charScale}
        stroke="#ffe0a6"
        strokeWidth={1.6}
        opacity={0.35}
      />
    </g>
  );
};

/**
 * Classroom Wooden Chair (`seat = 62 * charScale`, backrest = `176 * charScale`) cradling HeritageKid torso.
 */
export const HeritageSchoolChair: React.FC<{
  x: number;
  floorY: number;
  charScale?: number;
}> = ({ x, floorY, charScale = 0.92 }) => {
  const seatY = floorY - 62 * charScale;
  const backTopY = floorY - 176 * charScale;
  const hw = 54 * charScale;
  return (
    <g>
      <ellipse cx={x} cy={floorY + 3} rx={hw * 1.15} ry={7 * charScale} fill="#140a03" opacity={0.28} />
      {/* Backrest posts & curved slat behind shoulders */}
      <rect x={x - hw} y={backTopY} width={10 * charScale} height={floorY - backTopY} rx={2} fill="#362010" stroke={INK} strokeWidth={1.8} />
      <rect x={x + hw - 10 * charScale} y={backTopY} width={10 * charScale} height={floorY - backTopY} rx={2} fill="#2a180b" stroke={INK} strokeWidth={1.8} />
      <rect x={x - hw + 4 * charScale} y={backTopY + 10 * charScale} width={hw * 2 - 8 * charScale} height={24 * charScale} rx={3} fill="#5b391e" stroke={INK} strokeWidth={1.8} />
      {/* Seat slab */}
      <rect x={x - hw - 4 * charScale} y={seatY - 6 * charScale} width={hw * 2 + 8 * charScale} height={11 * charScale} rx={3} fill="#4d2f18" stroke={INK} strokeWidth={1.8} />
    </g>
  );
};

/**
 * Tanfidz Folio Folder on Muktamar Desk: folds open -> closed smoothly via `closeProg` (`criticallyDampedSpring`).
 */
export const TanfidzFolioBook: React.FC<{
  x: number;
  y: number;
  scale?: number;
  closeProg: number; // 0 = ajar showing inner Tanfidz manuscript, 1 = closed leather folio
  uid: string;
}> = ({ x, y, scale = 1, closeProg, uid }) => {
  const c = clamp(closeProg);
  // Flap folds smoothly right-to-left over pages (`cos` perspective compression)
  const flapScaleX = lerp(0.92, -1.0, c);
  const flapLift = Math.sin(c * Math.PI) * 28;
  const pagePeekOp = 1 - Math.max(0, (c - 0.65) / 0.35);

  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      {/* Soft cast shadow onto oak tabletop */}
      <polygon points="-215,12 225,12 248,145 -235,145" fill="#0d0602" opacity={0.44} />

      {/* Back cover board + manuscript leaves */}
      <polygon points="-210,-125 210,-125 232,126 -228,126" fill="#3a2011" stroke={INK} strokeWidth={3} />
      <polygon points="-196,-114 196,-114 214,112 -210,112" fill="#f3e6c8" stroke="#80623c" strokeWidth={1.8} opacity={pagePeekOp} />
      {pagePeekOp > 0.05 && (
        <g opacity={pagePeekOp}>
          <text x={96} y={-56} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={800} fontSize={19} fill="#5d2115" letterSpacing={1.5}>
            TANFIDZ
          </text>
          <text x={96} y={-32} textAnchor="middle" fontFamily={FONT_SANS} fontWeight={700} fontSize={12} fill="#5e4529" letterSpacing={2}>
            KEPUTUSAN MUKTAMAR
          </text>
          {[-6, 16, 38, 60, 82].map((ly, i) => (
            <line key={i} x1={26} y1={ly} x2={i === 4 ? 128 : 168} y2={ly} stroke="#8c7252" strokeWidth={3} opacity={0.65} />
          ))}
        </g>
      )}

      {/* Hinged front folio cover flipping smoothly from right side to closed position over spine */}
      <g transform={`translate(-8, ${-flapLift.toFixed(1)}) scale(${flapScaleX.toFixed(3)}, 1)`}>
        <polygon
          points="0,-125 212,-125 232,126 0,126"
          fill={flapScaleX < 0 ? "#5b2419" : "#6c2c1f"}
          stroke={INK}
          strokeWidth={3}
        />
        <polygon points="10,-113 198,-113 216,114 10,114" fill={`url(#${uid}_parchAlpha)`} opacity={0.28} />
        <polygon points="16,-106 192,-106 208,107 16,107" fill="none" stroke="#d5a64d" strokeWidth={2} opacity={0.78} />
        {flapScaleX < -0.15 && (
          <g transform="scale(-1, 1) translate(-110, 0)">
            <rect x={-72} y={-56} width={144} height={46} rx={3} fill="#e9d8b4" stroke="#b98a39" strokeWidth={1.6} />
            <text x={0} y={-35} textAnchor="middle" fontFamily={FONT_SERIF} fontWeight={900} fontSize={16} fill="#3d1e12" letterSpacing={1.8}>
              TANFIDZ
            </text>
            <text x={0} y={-18} textAnchor="middle" fontFamily={FONT_SANS} fontWeight={700} fontSize={10.5} fill="#6e4b2b" letterSpacing={1.4}>
              PEDOMAN GERAKAN
            </text>
          </g>
        )}
      </g>
    </g>
  );
};

/**
 * Framed Green-Black Heritage Slate Chalkboard with progressive chalk lines & hierarchy nodes (PP -> PR).
 */
export const HeritageChalkboardDiagram: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  flowProg: number; // 0..1 progressive PP->PW->PD->PC->PR trace
  rantingProg: number; // 0..1 spring highlight on PR
  basisProg: number; // 0..1 school / madrasah / panti / kampung tags
  uid: string;
}> = ({ x, y, w, h, flowProg, rantingProg, basisProg, uid }) => {
  const tiers = [
    { code: "PP", label: "Pimpinan Pusat", sub: "Nasional", px: -w * 0.34, py: -h * 0.22 },
    { code: "PW", label: "Wilayah", sub: "Provinsi", px: -w * 0.17, py: -h * 0.22 },
    { code: "PD", label: "Daerah", sub: "Kab / Kota", px: 0, py: -h * 0.22 },
    { code: "PC", label: "Cabang", sub: "Kecamatan", px: w * 0.17, py: -h * 0.22 },
    { code: "PR", label: "Ranting", sub: "Basis Pelajar", px: w * 0.34, py: -h * 0.22 },
  ];

  const lineLen = w * 0.68;
  const lineReveal = minJerk(flowProg);

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Cast shadow onto lime plaster classroom wall */}
      <rect x={-w / 2 + 8} y={-h / 2 + 12} width={w} height={h} rx={8} fill="#2b190b" opacity={0.34} />
      {/* Carved Teak Wood Frame */}
      <rect x={-w / 2 - 18} y={-h / 2 - 18} width={w + 36} height={h + 36} rx={7} fill={`url(#${uid}_teakWood)`} stroke={INK} strokeWidth={3} />
      {/* Chalkboard Slate Surface */}
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={3} fill={`url(#${uid}_chalkSlate)`} stroke="#101812" strokeWidth={2.5} />
      {/* Chalk dust smudge texture */}
      <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={`url(#${uid}_parchAlpha)`} opacity={0.12} />

      {/* Header inscription */}
      <text
        x={0}
        y={-h * 0.39}
        textAnchor="middle"
        fontFamily={FONT_SERIF}
        fontWeight={700}
        fontSize={21}
        letterSpacing={3.2}
        fill="#e7dfc5"
        opacity={0.85}
      >
        ALUR KEPEMIMPINAN IPM
      </text>
      <line x1={-w * 0.36} y1={-h * 0.34} x2={w * 0.36} y2={-h * 0.34} stroke="#cbd6c7" strokeWidth={1.2} opacity={0.32} />

      {/* Progressive chalk connecting shaft PP -> PR */}
      <line
        x1={-w * 0.34}
        y1={-h * 0.12}
        x2={lerp(-w * 0.34, w * 0.34, lineReveal)}
        y2={-h * 0.12}
        stroke="#f4e6c1"
        strokeWidth={3.2}
        strokeDasharray="10 6"
        opacity={0.78}
      />

      {tiers.map((t, idx) => {
        const hit = clamp((flowProg - idx * 0.17) / 0.22);
        const sc = lerp(0.75, 1.0, minJerk(hit));
        const isPR = t.code === "PR";
        const glowPR = isPR ? rantingProg : 0;
        return (
          <g key={t.code} transform={`translate(${t.px}, ${-h * 0.12}) scale(${sc.toFixed(3)})`} opacity={hit}>
            {isPR && glowPR > 0.05 && (
              <circle cx={0} cy={0} r={42 + glowPR * 12} fill="#eab64e" opacity={0.22 * glowPR} />
            )}
            <circle
              cx={0}
              cy={0}
              r={isPR ? 31 : 25}
              fill={isPR && glowPR > 0.3 ? "#a53820" : "#243b2e"}
              stroke={isPR && glowPR > 0.3 ? "#ffd980" : "#efe5c8"}
              strokeWidth={isPR ? 3.2 : 2.4}
            />
            <text
              x={0}
              y={7}
              textAnchor="middle"
              fontFamily={FONT_SANS}
              fontWeight={800}
              fontSize={isPR ? 20 : 17}
              fill="#fbf3dc"
            >
              {t.code}
            </text>
            <text
              x={0}
              y={48}
              textAnchor="middle"
              fontFamily={FONT_SERIF}
              fontWeight={700}
              fontSize={13.5}
              fill="#f1e7cc"
            >
              {t.label}
            </text>
            <text
              x={0}
              y={65}
              textAnchor="middle"
              fontFamily={FONT_MONO}
              fontSize={10.5}
              fill="#b8c9bc"
            >
              {t.sub}
            </text>
          </g>
        );
      })}

      {/* 4 Chalk Root Boxes under PR (Sekolah · Madrasah · Panti Asuhan · Kampung) */}
      {basisProg > 0.01 && (
        <g transform={`translate(0, ${h * 0.23})`}>
          <line
            x1={w * 0.34}
            y1={-h * 0.18}
            x2={w * 0.34}
            y2={-38}
            stroke="#ffd980"
            strokeWidth={2.2}
            opacity={basisProg * 0.72}
          />
          <line
            x1={-w * 0.34}
            y1={-38}
            x2={w * 0.34}
            y2={-38}
            stroke="#ffd980"
            strokeWidth={1.8}
            opacity={basisProg * 0.55}
          />
          {["SEKOLAH", "MADRASAH", "PANTI ASUHAN", "KAMPUNG"].map((nm, bi) => {
            const k = clamp((basisProg - bi * 0.14) / 0.38);
            const bx = lerp(-w * 0.33, w * 0.33, bi / 3);
            const slideY = lerp(12, 0, minJerk(k));
            return (
              <g key={nm} transform={`translate(${bx}, ${slideY})`} opacity={k}>
                <line x1={0} y1={-38} x2={0} y2={-18} stroke="#ffd980" strokeWidth={1.6} opacity={0.6} />
                <rect
                  x={-70}
                  y={-18}
                  width={140}
                  height={40}
                  rx={4}
                  fill="#294032"
                  stroke="#e7d29c"
                  strokeWidth={1.8}
                />
                <text
                  x={0}
                  y={7}
                  textAnchor="middle"
                  fontFamily={FONT_SANS}
                  fontWeight={800}
                  fontSize={13.5}
                  letterSpacing={0.9}
                  fill="#f7ecd0"
                >
                  {nm}
                </text>
              </g>
            );
          })}
        </g>
      )}

      {/* Chalk ledge tray + white chalk sticks + wooden felt eraser */}
      <rect x={-w / 2 - 22} y={h / 2 + 8} width={w + 44} height={18} rx={3} fill="#4b2f17" stroke={INK} strokeWidth={2.4} />
      <rect x={-160} y={h / 2} width={38} height={9} rx={3} fill="#f4efe0" stroke="#7c7361" strokeWidth={1.2} />
      <rect x={-105} y={h / 2 + 1} width={28} height={8} rx={3} fill="#ebe4d1" stroke="#7c7361" strokeWidth={1.1} />
      <rect x={140} y={h / 2 - 12} width={72} height={22} rx={3} fill="#6b4222" stroke={INK} strokeWidth={1.8} />
    </g>
  );
};

/**
 * Quiet atmospheric evening lamp casting warm pool & oscillating with damped harmonic motion.
 */
export const HangingBranchLantern: React.FC<{
  x: number;
  y: number;
  angleRad: number;
  f: number;
  uid: string;
}> = ({ x, y, angleRad, f, uid }) => {
  const fl = 1 + Math.sin(f * 0.24) * 0.045 + Math.cos(f * 0.61) * 0.025;
  const deg = (angleRad * 180) / Math.PI;
  return (
    <g transform={`translate(${x}, ${y}) rotate(${deg.toFixed(2)})`}>
      <defs>
        <radialGradient id={`${uid}_hlGlow`}>
          <stop offset="0%" stopColor="#ffe5a3" stopOpacity={0.62 * fl} />
          <stop offset="48%" stopColor="#f5a53a" stopOpacity={0.22} />
          <stop offset="100%" stopColor="#9d4d15" stopOpacity={0} />
        </radialGradient>
      </defs>
      <line x1={0} y1={0} x2={0} y2={155} stroke="#2a1a0e" strokeWidth={5} />
      <circle cx={0} cy={210} r={220 * fl} fill={`url(#${uid}_hlGlow)`} />
      {/* Brass conical shade */}
      <polygon points="-16,155 16,155 58,195 -58,195" fill="#704c1e" stroke={INK} strokeWidth={2.5} />
      <polygon points="-10,160 10,160 44,191 -44,191" fill="#b98636" opacity={0.55} />
      {/* Warm glass bulb */}
      <circle cx={0} cy={205} r={20} fill="#fff3c7" stroke="#9e6d24" strokeWidth={2} />
      <circle cx={0} cy={205} r={10 * fl} fill="#fffbec" />
    </g>
  );
};

export { criticallyDampedSpring, HERITAGE_PX_PER_METER, metersToPx };
