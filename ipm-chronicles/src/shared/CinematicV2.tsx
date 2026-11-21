import React from "react";
import { staticFile } from "remotion";
import { EASE_OUT, clamp, hash, lerp, pe, smooth } from "./Flat3DCamera";
import { FONT_SANS, FONT_SERIF } from "./PaperTextures";

const INK = "#1d140c";

/**
 * Heavy wooden hall double-doors close to lens that swing open inward with light spilling in.
 * Gives Episode 02 a tactile architectural match-cut entrance from blackness.
 */
export const ForegroundDoorReveal: React.FC<{
  openProg: number;
  tint?: string;
  tactile?: boolean;
}> = ({ openProg, tint = "#ffd98c", tactile = false }) => {
  const k = smooth(openProg);
  if (k >= 0.995) return null;
  const shift = lerp(0, 620, k);
  const rotY = lerp(0, 58, k);
  const op = 1 - Math.max(0, (k - 0.72) / 0.28);

  return (
    <g opacity={op}>
      {/* Golden seam light bursting before doors part wide */}
      <rect
        x={540 - lerp(4, 240, k)}
        y={-100}
        width={lerp(8, 480, k)}
        height={2120}
        fill={tint}
        opacity={lerp(0.85, 0, Math.pow(k, 0.7))}
      />
      {/* Left oak hall door panel */}
      <g transform={`translate(${-shift}, 0) scale(${Math.cos((rotY * Math.PI) / 180).toFixed(3)}, 1)`}>
        <rect x={-100} y={-80} width={640} height={2080} fill="#26170e" stroke="#110904" strokeWidth={6} />
        <rect x={28} y={140} width={440} height={680} rx={8} fill="#342014" stroke="#4d311f" strokeWidth={4} />
        <rect x={28} y={890} width={440} height={820} rx={8} fill="#342014" stroke="#4d311f" strokeWidth={4} />
        {tactile && (
          <g>
            <rect x={44} y={156} width={408} height={648} rx={4} fill="#2b190f" stroke="#5d3d28" strokeWidth={2} />
            <rect x={44} y={906} width={408} height={788} rx={4} fill="#2b190f" stroke="#5d3d28" strokeWidth={2} />
            {[110, 195, 290, 385].map((gx, gi) => (
              <line key={`dl_${gi}`} x1={gx} y1={168} x2={gx} y2={1680} stroke="#190e07" strokeWidth={1.6} opacity={0.35} />
            ))}
            <line x1={536} y1={-60} x2={536} y2={1980} stroke="#d7a44a" strokeWidth={2} opacity={0.28} />
          </g>
        )}
        {/* Brass door handle */}
        <rect x={488} y={910} width={22} height={150} rx={9} fill="#d7a44a" stroke="#1a1008" strokeWidth={2.5} />
        {tactile && <line x1={495} y1={920} x2={495} y2={1050} stroke="#fff2c2" strokeWidth={2} opacity={0.75} />}
      </g>
      {/* Right oak hall door panel */}
      <g transform={`translate(${1080 + shift}, 0) scale(${Math.cos((rotY * Math.PI) / 180).toFixed(3)}, 1)`}>
        <rect x={-540} y={-80} width={640} height={2080} fill="#26170e" stroke="#110904" strokeWidth={6} />
        <rect x={-468} y={140} width={440} height={680} rx={8} fill="#342014" stroke="#4d311f" strokeWidth={4} />
        <rect x={-468} y={890} width={440} height={820} rx={8} fill="#342014" stroke="#4d311f" strokeWidth={4} />
        {tactile && (
          <g>
            <rect x={-452} y={156} width={408} height={648} rx={4} fill="#2b190f" stroke="#5d3d28" strokeWidth={2} />
            <rect x={-452} y={906} width={408} height={788} rx={4} fill="#2b190f" stroke="#5d3d28" strokeWidth={2} />
            {[-385, -290, -195, -110].map((gx, gi) => (
              <line key={`dr_${gi}`} x1={gx} y1={168} x2={gx} y2={1680} stroke="#190e07" strokeWidth={1.6} opacity={0.35} />
            ))}
          </g>
        )}
        <rect x={-510} y={910} width={22} height={150} rx={9} fill="#d7a44a" stroke="#1a1008" strokeWidth={2.5} />
        {tactile && <line x1={-503} y1={920} x2={-503} y2={1050} stroke="#fff2c2" strokeWidth={2} opacity={0.75} />}
      </g>
    </g>
  );
};

/**
 * Angled volumetric stage / window beams with gentle breathing oscillation & optional Gaussian softness.
 */
export const VolumetricShafts: React.FC<{
  id: string;
  f: number;
  color?: string;
  intensity?: number;
  angleDeg?: number;
  sourceX?: number;
  soft?: boolean;
}> = ({
  id,
  f,
  color = "#ffe29e",
  intensity = 0.24,
  angleDeg = 16,
  sourceX = 540,
  soft = true,
}) => {
  const s = f / 30;
  const sway = Math.sin(s * 0.52) * 14;
  const angleSway = Math.sin(s * 0.38 + 0.7) * 0.6;
  const breathe = 0.82 + 0.18 * Math.sin(s * 0.95 + 1.2);
  const effAngle = angleDeg + angleSway;
  return (
    <g pointerEvents="none" opacity={breathe}>
      <defs>
        <linearGradient id={`${id}_beam`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity={intensity * 1.45} />
          <stop offset="0.55" stopColor={color} stopOpacity={intensity * 0.58} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </linearGradient>
        {soft && (
          <filter id={`${id}_blur`} x="-20%" y="-10%" width="140%" height="120%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        )}
      </defs>
      <g filter={soft ? `url(#${id}_blur)` : undefined}>
        {[-280, -60, 180].map((off, idx) => (
          <polygon
            key={idx}
            points={`${sourceX + off * 0.35 + sway * 0.3},-120 ${sourceX + off * 0.35 + 150 + sway * 0.3},-120 ${
              sourceX + off * 1.4 + 340 + Math.tan((effAngle * Math.PI) / 180) * 1900 + sway
            },1980 ${sourceX + off * 1.4 - 160 + Math.tan((effAngle * Math.PI) / 180) * 1900 + sway},1980`}
            fill={`url(#${id}_beam)`}
            opacity={idx === 1 ? 1 : 0.72}
          />
        ))}
      </g>
    </g>
  );
};

/**
 * Scene 03 Classroom Gate / Double Door slowly closing inward from corridor flanks,
 * visualizing Orde Baru restrictions ("Satu per satu, gerbang sekolah menutup") without hiding center characters.
 */
export const ClassroomGateReveal: React.FC<{
  closeProg: number;
  tint?: string;
}> = ({ closeProg, tint = "#16212f" }) => {
  const k = EASE_OUT(clamp(closeProg));
  if (k <= 0.01) return null;
  // Closes from edges (-480..0) inward to frame outer corridor (-480..215 left, 865..1560 right)
  const travel = lerp(0, 235, k);
  const coldShadowOp = lerp(0, 0.48, k);

  return (
    <g pointerEvents="none">
      {/* Narrowing shadow veil flanking central hero zone */}
      <rect x={-80} y={-40} width={275 * k} height={2000} fill={tint} opacity={coldShadowOp} />
      <rect x={1160 - 275 * k} y={-40} width={275 * k} height={2000} fill={tint} opacity={coldShadowOp} />

      {/* Left heavy school wooden + grille gate panel */}
      <g transform={`translate(${-250 + travel}, 0)`}>
        <rect x={-160} y={180} width={380} height={1540} rx={6} fill="#25323d" stroke="#101820" strokeWidth={5} />
        <rect x={-120} y={240} width={300} height={580} rx={4} fill="#18232d" stroke="#3c4f61" strokeWidth={3} />
        {/* Vertical school grille bars */}
        {[-70, -15, 40, 95, 145].map((bx) => (
          <rect key={bx} x={bx} y={252} width={10} height={556} rx={3} fill="#4c6175" stroke="#101820" strokeWidth={1.6} />
        ))}
        <rect x={-120} y={870} width={300} height={760} rx={4} fill="#2d3b47" stroke="#3c4f61" strokeWidth={3} />
        {/* Brass door handle & lock plate */}
        <rect x={182} y={890} width={20} height={124} rx={6} fill="#9e8755" stroke="#101820" strokeWidth={2.5} />
      </g>

      {/* Right heavy school wooden + grille gate panel */}
      <g transform={`translate(${1330 - travel}, 0)`}>
        <rect x={-220} y={180} width={380} height={1540} rx={6} fill="#25323d" stroke="#101820" strokeWidth={5} />
        <rect x={-180} y={240} width={300} height={580} rx={4} fill="#18232d" stroke="#3c4f61" strokeWidth={3} />
        {[-145, -95, -40, 15, 70].map((bx) => (
          <rect key={bx} x={bx} y={252} width={10} height={556} rx={3} fill="#4c6175" stroke="#101820" strokeWidth={1.6} />
        ))}
        <rect x={-180} y={870} width={300} height={760} rx={4} fill="#2d3b47" stroke="#3c4f61" strokeWidth={3} />
        <rect x={-202} y={890} width={20} height={124} rx={6} fill="#9e8755" stroke="#101820" strokeWidth={2.5} />
      </g>
    </g>
  );
};

/**
 * Subtle soft-blurred architectural foreground edge framing (leaves/pillars at extreme bleed)
 * creating 2.5D depth parallax without intruding on the central 80..1000px safe zone.
 */
export const ForegroundBlurEdge: React.FC<{
  id: string;
  camX?: number;
  color?: string;
  mode?: "pillars" | "foliage";
  opacity?: number;
}> = ({ id, camX = 540, color = "#140e09", mode = "pillars", opacity = 0.52 }) => {
  const shift = (540 - camX) * 0.38;
  return (
    <g pointerEvents="none" opacity={opacity}>
      <defs>
        <filter id={`${id}_fgb`} x="-30%" y="-10%" width="160%" height="120%">
          <feGaussianBlur stdDeviation="5.5" />
        </filter>
      </defs>
      <g filter={`url(#${id}_fgb)`} transform={`translate(${shift.toFixed(1)}, 0)`}>
        {mode === "pillars" ? (
          <>
            <rect x={-70} y={-40} width={102} height={2000} fill={color} />
            <rect x={1048} y={-40} width={102} height={2000} fill={color} />
          </>
        ) : (
          <>
            <ellipse cx={-12} cy={1380} rx={88} ry={175} fill={color} transform="rotate(-14,-12,1380)" />
            <ellipse cx={1092} cy={1360} rx={88} ry={175} fill={color} transform="rotate(14,1092,1360)" />
            <ellipse cx={18} cy={180} rx={72} ry={120} fill={color} transform="rotate(24,18,180)" />
            <ellipse cx={1062} cy={180} rx={72} ry={120} fill={color} transform="rotate(-24,1062,180)" />
          </>
        )}
      </g>
    </g>
  );
};

/**
 * Subtle outer edge architectural framing slats (never crossing the central 80..1000 hero zone).
 */
export const ForegroundRail: React.FC<{
  scrollX: number;
  dark?: boolean;
}> = ({ scrollX, dark = false }) => {
  const col = dark ? "#0a0705" : "#22160c";
  const edgeShift = Math.sin(scrollX * 0.012) * 10;
  return (
    <g pointerEvents="none" opacity={0.34}>
      <rect x={-18 + edgeShift} y={-40} width={38} height={2000} fill={col} />
      <rect x={1060 + edgeShift} y={-40} width={38} height={2000} fill={col} />
      <rect x={0} y={-24} width={1080} height={32} fill={col} opacity={0.4} />
    </g>
  );
};

/**
 * Interactive archival charter card + falling wax/ink stamp representing institutional stakeholders.
 */
export const CharterStampCard: React.FC<{
  x: number;
  y: number;
  w?: number;
  h?: number;
  year: string;
  title: string;
  stakeholder: string;
  enter: number;
  stampProg: number;
  accent?: string;
  rotateDeg?: number;
  tactile?: boolean;
  stampText?: string;
}> = ({
  x,
  y,
  w = 340,
  h = 210,
  year,
  title,
  stakeholder,
  enter,
  stampProg,
  accent = "#8c2318",
  rotateDeg = 0,
  tactile = false,
  stampText = "SAH",
}) => {
  const k = EASE_OUT(clamp(enter));
  if (k <= 0.01) return null;
  // Allow spring values slightly > 1.0 for tactile rubber-stamp overshoot & bounce settle
  const st = Math.max(0, stampProg);
  const stampScale = st > 0 ? lerp(2.25, 1.0, Math.min(1.18, st)) : 0;
  const stampOp = st > 0 ? Math.min(1, st * 2.5) : 0;
  const ringProg = clamp((st - 0.55) / 0.55);
  const rise = lerp(46, 0, k);
  const safeId = `card_${year.replace(/[^a-zA-Z0-9]/g, "")}_${Math.round(x)}`;

  return (
    <g
      transform={`translate(${x},${y + rise}) rotate(${(rotateDeg * k).toFixed(2)}) scale(${lerp(0.88, 1, k).toFixed(3)})`}
      opacity={k}
    >
      {tactile && (
        <defs>
          <filter id={`${safeId}_sh`} x="-16%" y="-16%" width="138%" height="145%">
            <feDropShadow dx="-5" dy="10" stdDeviation="7" floodColor="#1c0d04" floodOpacity="0.46" />
          </filter>
          <linearGradient id={`${safeId}_bg`} x1="1" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fbf1dc" />
            <stop offset="0.56" stopColor="#f2dfc0" />
            <stop offset="1" stopColor="#e2c596" />
          </linearGradient>
          <pattern id={`${safeId}_tex`} width="256" height="256" patternUnits="userSpaceOnUse">
            <image href={staticFile("art/textures/parchment_grain_alpha.png")} x="0" y="0" width="256" height="256" />
          </pattern>
        </defs>
      )}

      <g>
        {/* Flat cast card shadow fallback */}
        {!tactile && (
          <rect x={-w / 2 + 8} y={-h / 2 + 12} width={w} height={h} rx={8} fill="#140c06" opacity={0.26} />
        )}
        {/* Parchment paper body (emboss shadow lives only on base rect) */}
        <rect
          x={-w / 2}
          y={-h / 2}
          width={w}
          height={h}
          rx={tactile ? 6 : 8}
          fill={tactile ? `url(#${safeId}_bg)` : "#f6ecda"}
          stroke={tactile ? "#4b3118" : "#5b3f24"}
          strokeWidth={tactile ? 3.2 : 3}
          filter={tactile ? `url(#${safeId}_sh)` : undefined}
        />
        {tactile && (
          <>
            <rect
              x={-w / 2}
              y={-h / 2}
              width={w}
              height={h}
              rx={6}
              fill={`url(#${safeId}_tex)`}
              opacity={0.78}
            />
            <line
              x1={-w / 2 + 10}
              y1={-h / 2 + 4}
              x2={w / 2 - 10}
              y2={-h / 2 + 4}
              stroke="#fffcf4"
              strokeWidth={1.8}
              opacity={0.72}
            />
          </>
        )}
        <rect
          x={-w / 2 + 10}
          y={-h / 2 + 10}
          width={w - 20}
          height={h - 20}
          rx={tactile ? 3 : 5}
          fill="none"
          stroke={tactile ? "#8e6d45" : "#c3aa82"}
          strokeWidth={1.5}
          opacity={tactile ? 0.78 : 1}
        />

        {/* Top stakeholder role pill */}
        <rect
          x={-w / 2 + 20}
          y={-h / 2 + 18}
          width={w - 40}
          height={31}
          rx={4}
          fill={accent}
          opacity={tactile ? 0.2 : 0.14}
        />
        {tactile && (
          <>
            <line x1={-w / 2 + 22} y1={-h / 2 + 18} x2={w / 2 - 22} y2={-h / 2 + 18} stroke={accent} strokeWidth={1.2} opacity={0.42} />
            <line x1={-w / 2 + 22} y1={-h / 2 + 49} x2={w / 2 - 22} y2={-h / 2 + 49} stroke={accent} strokeWidth={1.2} opacity={0.42} />
          </>
        )}
        <text
          x={0}
          y={-h / 2 + 39}
          textAnchor="middle"
          fontFamily={FONT_SANS}
          fontWeight={800}
          fontSize={tactile ? 13.5 : 12.5}
          letterSpacing={1.3}
          fill={accent}
        >
          {stakeholder.toUpperCase()}
        </text>

        {/* Main Year */}
        <text
          x={0}
          y={h < 175 ? -1 : 5}
          textAnchor="middle"
          fontFamily={FONT_SERIF}
          fontWeight={900}
          fontSize={h < 175 ? 40 : 48}
          fill={INK}
        >
          {year}
        </text>

        {/* Charter title */}
        <text
          x={0}
          y={h < 175 ? 31 : 43}
          textAnchor="middle"
          fontFamily={FONT_SERIF}
          fontWeight={700}
          fontSize={h < 175 ? 18.5 : 21}
          fill="#2d1d0e"
        >
          {title}
        </text>

        {/* Animated draw line underneath (stops clear of lower-right seal) */}
        <line
          x1={-w * 0.36}
          y1={h < 175 ? 49 : 65}
          x2={lerp(-w * 0.36, w * 0.12, clamp(k * 1.4 - 0.3))}
          y2={h < 175 ? 49 : 65}
          stroke={accent}
          strokeWidth={2.6}
        />

        {/* Embossed circular ratification stamp anchored cleanly in bottom-right corner */}
        {stampOp > 0.02 && (
          <g transform={`translate(${w / 2 - 42}, ${h / 2 - 30}) scale(${stampScale.toFixed(3)}) rotate(-12)`} opacity={stampOp}>
            {ringProg > 0.02 && ringProg < 0.98 && (
              <circle
                cx={0}
                cy={0}
                r={lerp(22, 48, ringProg)}
                fill="none"
                stroke={accent}
                strokeWidth={2.2}
                opacity={(1 - ringProg) * 0.6}
              />
            )}
            <circle cx={0} cy={0} r={tactile ? 25 : 22} fill={accent} fillOpacity={0.16} stroke={accent} strokeWidth={2.8} />
            <circle cx={0} cy={0} r={tactile ? 19 : 16} fill="none" stroke={accent} strokeWidth={1.3} strokeDasharray="2.8 2.4" />
            <text
              x={0}
              y={4.5}
              textAnchor="middle"
              fontFamily={FONT_SANS}
              fontWeight={900}
              fontSize={tactile ? 11.5 : 9.5}
              letterSpacing={1}
              fill={accent}
            >
              {stampText}
            </text>
          </g>
        )}
      </g>
    </g>
  );
};

/**
 * Split-flap archival name plaque for the iconic 1992 (PELAJAR -> REMAJA) & 2008 (REMAJA -> PELAJAR) moment.
 */
export const NomenclatureMorphBanner: React.FC<{
  x: number;
  y: number;
  /** 0 = PELAJAR, 1 = REMAJA */
  remajaMix: number;
  goldHighlight?: number;
  width?: number;
}> = ({ x, y, remajaMix, goldHighlight = 0, width = 880 }) => {
  const m = smooth(clamp(remajaMix));
  const flipPhase = m < 0.5 ? m * 2 : (1 - m) * 2;
  const scaleYCenter = Math.max(0.06, 1 - flipPhase * 0.94);
  const centerWord = m < 0.5 ? "PELAJAR" : "REMAJA";
  const borderCol = lerpColorHex("#6a4e2f", "#b63426", m * (1 - goldHighlight));
  const wordColor = m < 0.5 ? (goldHighlight > 0.3 ? "#b87409" : "#0b7b3e") : "#9a2a1e";

  return (
    <g transform={`translate(${x},${y})`}>
      {/* Drop shadow */}
      <rect x={-width / 2 + 6} y={-68 + 10} width={width} height={144} rx={12} fill="#0e0905" opacity={0.32} />
      {/* Gold aura when reinstated in 2008 */}
      {goldHighlight > 0.05 && (
        <rect
          x={-width / 2 - 14}
          y={-82}
          width={width + 28}
          height={172}
          rx={18}
          fill="#ffe48f"
          opacity={goldHighlight * 0.42}
        />
      )}
      <rect x={-width / 2} y={-68} width={width} height={144} rx={12} fill="#f7eedb" stroke={borderCol} strokeWidth={4} />
      <rect x={-width / 2 + 9} y={-59} width={width - 18} height={126} rx={8} fill="none" stroke="#c8b087" strokeWidth={1.6} />

      <text
        x={0}
        y={-26}
        textAnchor="middle"
        fontFamily={FONT_SANS}
        fontWeight={800}
        fontSize={16}
        letterSpacing={4}
        fill="#694d31"
      >
        IKATAN
      </text>

      {/* Transforming middle chamber with physical split-flap fold line & shadow */}
      <g transform={`translate(0, 16) scale(1, ${scaleYCenter.toFixed(3)})`}>
        <rect x={-195} y={-30} width={390} height={54} rx={8} fill={wordColor} fillOpacity={0.13 + flipPhase * 0.14} />
        <text
          x={0}
          y={10}
          textAnchor="middle"
          fontFamily={FONT_SERIF}
          fontWeight={900}
          fontSize={44}
          letterSpacing={5}
          fill={wordColor}
        >
          {centerWord}
        </text>
        {/* Split-flap mechanical horizontal seam */}
        <line x1={-190} y1={-2} x2={190} y2={-2} stroke="#1a120a" strokeWidth={1.6} opacity={0.18 + flipPhase * 0.45} />
      </g>

      <text
        x={0}
        y={56}
        textAnchor="middle"
        fontFamily={FONT_SANS}
        fontWeight={800}
        fontSize={16}
        letterSpacing={4}
        fill="#694d31"
      >
        MUHAMMADIYAH
      </text>
    </g>
  );
};

function lerpColorHex(a: string, b: string, t: number): string {
  const k = clamp(t);
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const r = Math.round(lerp((pa >> 16) & 255, (pb >> 16) & 255, k));
  const g = Math.round(lerp((pa >> 8) & 255, (pb >> 8) & 255, k));
  const bl = Math.round(lerp(pa & 255, pb & 255, k));
  return `#${((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1)}`;
}

/**
 * Clean geometric OSIS school plaque used for Scene 03 Orde Baru policy visualization.
 */
export const OsisSchoolPlaque: React.FC<{
  x: number;
  y: number;
  scale?: number;
  opacity?: number;
}> = ({ x, y, scale = 1, opacity = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${scale})`} opacity={opacity}>
    <circle cx={0} cy={0} r={118} fill="#1b3a68" stroke="#10213d" strokeWidth={7} />
    <circle cx={0} cy={0} r={104} fill="#eef4fb" stroke="#b98a2f" strokeWidth={4} />
    {/* Stylized open book + star framing */}
    <path d="M -52 14 Q -24 2 0 18 Q 24 2 52 14 L 52 40 Q 24 28 0 42 Q -24 28 -52 40 Z" fill="#1b3a68" />
    <polygon points="0,-68 11,-38 42,-38 17,-19 26,10 0,-8 -26,10 -17,-19 -42,-38 -11,-38" fill="#d9a126" opacity={0.9} />
    <rect x={-72} y={50} width={144} height={36} rx={6} fill="#1b3a68" />
    <text
      x={0}
      y={75}
      textAnchor="middle"
      fontFamily={FONT_SANS}
      fontWeight={900}
      fontSize={22}
      letterSpacing={4}
      fill="#ffffff"
    >
      OSIS
    </text>
    <text
      x={0}
      y={144}
      textAnchor="middle"
      fontFamily={FONT_SANS}
      fontWeight={800}
      fontSize={14}
      letterSpacing={1.8}
      fill="#d8e3f2"
    >
      ORGANISASI RESMI SEKOLAH
    </text>
  </g>
);

/**
 * Compact 1992-1998 transition montage vignettes matching Scene 04 narration:
 * Reformasi 1998 broadsheet + shifting political landscape chart ("mengubah peta politik")
 * with depth-separated parallax layers.
 */
export const EraMontageArtifacts: React.FC<{
  x: number;
  y: number;
  f: number;
  progress: number;
  camX?: number;
  curveProg?: number;
}> = ({ x, y, f, progress, camX = 540, curveProg }) => {
  const k = clamp(progress);
  if (k <= 0.01) return null;
  const s = f / 30;
  const pShiftA = (540 - camX) * 0.24;
  const pShiftB = (540 - camX) * 0.42;
  const floatA = Math.sin(s * 1.45) * 7;
  const floatB = Math.cos(s * 1.2 + 0.8) * 8;
  const tiltA = Math.sin(s * 1.1) * 1.05;
  const tiltB = Math.cos(s * 0.95 + 0.5) * 0.95;
  const enterA = EASE_OUT(clamp(k * 1.7));
  const enterB = EASE_OUT(clamp((k - 0.16) * 1.7));
  const lineDrawA = EASE_OUT(clamp((k - 0.06) * 1.85));
  const drawK = EASE_OUT(clamp(curveProg ?? (k - 0.14) / 0.54));

  // Position of active trajectory head along M(-85,-4) Q(-28,-8) (-4,-34) T(86,-52)
  const tipU = drawK < 0.99 ? drawK : 0.08 + ((s * 0.42) % 0.92);
  const qPt = (p0: number, p1: number, p2: number, t: number) =>
    (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * p1 + t * t * p2;
  const tipX = tipU <= 0.5 ? qPt(-85, -28, -4, tipU * 2) : qPt(-4, 20, 86, (tipU - 0.5) * 2);
  const tipY = tipU <= 0.5 ? qPt(-4, -8, -34, tipU * 2) : qPt(-34, -60, -52, (tipU - 0.5) * 2);
  const nodePulse = 4.5 + ((s * 1.8) % 1) * 9;
  const sheenOffset = ((s * 52) % 260) - 130;

  return (
    <g transform={`translate(${x},${y})`} opacity={smooth(k)}>
      {/* 1998 Reformasi Archival Broadsheet (Mid-depth parallax) */}
      <g
        transform={`translate(${lerp(-140, -210, enterA) + pShiftA}, ${lerp(-65, -34, enterA) + floatA}) rotate(${lerp(-12, -7, enterA) + tiltA}) scale(${lerp(0.86, 1, enterA)})`}
        opacity={enterA}
      >
        <rect x={-120} y={-82} width={260} height={190} rx={5} fill="#0b0704" opacity={0.42} />
        <rect x={-130} y={-95} width={260} height={190} rx={5} fill="#ebe1cc" stroke={INK} strokeWidth={3.2} />
        <rect x={-124} y={-89} width={248} height={178} rx={3} fill="none" stroke="#c3ae86" strokeWidth={1.2} opacity={0.85} />
        <line x1={-130} y1={-4} x2={130} y2={-4} stroke="#bba47c" strokeWidth={1.8} opacity={0.75} />
        <rect x={-110} y={-75} width={220} height={34} fill="#261d14" />
        <line
          x1={-110}
          y1={-37}
          x2={lerp(-110, 110, lineDrawA)}
          y2={-37}
          stroke="#9e2f24"
          strokeWidth={2.4}
          opacity={0.88}
        />
        <text
          x={0}
          y={-52}
          textAnchor="middle"
          fontFamily={FONT_SERIF}
          fontWeight={900}
          fontSize={19}
          letterSpacing={2}
          fill="#f4ead5"
        >
          REFORMASI 1998
        </text>
        {/* Archival halftone newsprint photo inset + animated text bars */}
        <rect x={-110} y={-28} width={105} height={82} fill="#7e5b3c" opacity={0.44} />
        <rect x={-106} y={-24} width={97} height={74} fill="none" stroke="#473220" strokeWidth={1} opacity={0.6} />
        <rect x={-106 + Math.max(0, sheenOffset * 0.25)} y={-24} width={16} height={74} fill="#fff7e2" opacity={0.07 * enterA} />
        <line x1={6} y1={-22} x2={lerp(6, 106, EASE_OUT(clamp(lineDrawA * 1.15)))} y2={-22} stroke="#5d4530" strokeWidth={5} />
        <line x1={6} y1={-4} x2={lerp(6, 98, EASE_OUT(clamp((lineDrawA - 0.12) * 1.2)))} y2={-4} stroke="#5d4530" strokeWidth={4} />
        <line x1={6} y1={14} x2={lerp(6, 104, EASE_OUT(clamp((lineDrawA - 0.24) * 1.25)))} y2={14} stroke="#5d4530" strokeWidth={4} />
        <line x1={-110} y1={72} x2={lerp(-110, 104, EASE_OUT(clamp((lineDrawA - 0.35) * 1.35)))} y2={72} stroke="#5d4530" strokeWidth={3} />
      </g>

      {/* Shifting Political Map / Civic Space Folio (Nearer parallax layer) */}
      <g
        transform={`translate(${lerp(140, 212, enterB) + pShiftB}, ${lerp(58, 24, enterB) + floatB}) rotate(${lerp(11, 6, enterB) + tiltB}) scale(${lerp(0.86, 1, enterB)})`}
        opacity={enterB}
      >
        <rect x={-115} y={-82} width={250} height={175} rx={7} fill="#090603" opacity={0.44} />
        <rect x={-125} y={-95} width={250} height={175} rx={7} fill="#e6dac0" stroke={INK} strokeWidth={3.5} />
        <rect x={-107} y={-77} width={214} height={124} rx={4} fill="#1d352a" stroke={INK} strokeWidth={2.2} />
        {/* Archival cartographic fold creases & shifting political trajectory curve (animated draw-on) */}
        <line x1={-36} y1={-77} x2={-36} y2={47} stroke="#4e7360" strokeWidth={1.2} strokeDasharray="4 4" opacity={0.55} />
        <line x1={36} y1={-77} x2={36} y2={47} stroke="#4e7360" strokeWidth={1.2} strokeDasharray="4 4" opacity={0.55} />
        <path
          d="M -85 -4 Q -28 -8 -4 -34 T 86 -52"
          fill="none"
          stroke="#e4b756"
          strokeWidth={3.8}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="1"
          strokeDashoffset={1 - drawK}
        />
        <polygon points={`${clamp(-98 + sheenOffset * 0.45, -105, 80)},-72 ${clamp(-62 + sheenOffset * 0.45, -75, 102)},-72 ${clamp(-102 + sheenOffset * 0.45, -105, 72)},12 ${clamp(-107 + sheenOffset * 0.45, -107, 66)},12`} fill="#ffffff" opacity={0.07} />
        {drawK > 0.04 && (
          <circle cx={tipX} cy={tipY} r={4.6} fill="#ffe9a6" opacity={0.94} />
        )}
        {drawK > 0.85 && (
          <circle cx={86} cy={-52} r={nodePulse} fill="none" stroke="#ffe9a6" strokeWidth={1.5} opacity={(1 - (nodePulse - 4.5) / 9) * 0.72} />
        )}
        <text
          x={0}
          y={28}
          textAnchor="middle"
          fontFamily={FONT_SANS}
          fontWeight={800}
          fontSize={15}
          letterSpacing={2}
          fill="#f4e2b8"
        >
          PETA POLITIK BARU
        </text>
        <text
          x={0}
          y={67}
          textAnchor="middle"
          fontFamily={FONT_SANS}
          fontWeight={700}
          fontSize={10.5}
          letterSpacing={1.6}
          fill="#4a3824"
        >
          DI LUAR PAGAR SEKOLAH
        </text>
      </g>
    </g>
  );
};

/**
 * Shared SVG drop-shadow filter defs for tactile 2.5D plaques, cards, and banners.
 */
export const DioramaShadowDefs: React.FC = () => (
  <defs>
    <filter id="dioramaCardShadow" x="-15%" y="-15%" width="135%" height="145%">
      <feDropShadow dx="4" dy="8" stdDeviation="6" floodColor="#0b0704" floodOpacity="0.52" />
    </filter>
    <filter id="dioramaRimGlow" x="-25%" y="-25%" width="150%" height="150%">
      <feDropShadow dx="0" dy="4" stdDeviation="10" floodColor="#ffe18c" floodOpacity="0.48" />
    </filter>
  </defs>
);

/**
 * 2.5D Paneled Blue-Slate School Corridor Gate Doors matching Scene 02 tactile diorama look.
 * Slides inward from both sides as `closeProg` goes 0 -> 1 without cropping edge margins.
 */
export const TactileClassroomGate: React.FC<{ closeProg: number }> = ({ closeProg }) => {
  const k = smooth(closeProg);
  // Subtle partial peek at k=0 on side reveals, tightening to framing pillars/gates at k=1
  const slidePx = lerp(-245, 0, k);
  const doorOp = clamp(lerp(0.55, 1, k));

  const renderPanel = (x0: number, xInner: number, isLeft: boolean) => {
    const dir = isLeft ? 1 : -1;
    const handleX = xInner - dir * 24;
    return (
      <g opacity={doorOp} transform={`translate(${isLeft ? slidePx : -slidePx}, 0)`}>
        {/* Deep cast hallway shadow from door edge */}
        <rect
          x={isLeft ? xInner - 8 : xInner - 18}
          y={120}
          width={26}
          height={1460}
          fill="#070b10"
          opacity={0.48}
        />
        {/* Solid paneled door leaf (deep slate-navy timber) */}
        <rect
          x={x0}
          y={110}
          width={Math.abs(xInner - x0)}
          height={1460}
          fill="#1b2c3b"
          stroke="#0b131b"
          strokeWidth={4}
        />
        {/* Outer bevel highlight on frame face */}
        <rect
          x={x0 + 8}
          y={118}
          width={Math.abs(xInner - x0) - 16}
          height={1444}
          fill="none"
          stroke="#3b5368"
          strokeWidth={2}
          opacity={0.65}
        />
        {/* Routed vertical architectural molded recess panels */}
        {[240, 1085].map((py, pi) => {
          const ph = pi === 0 ? 790 : 420;
          const pw = Math.abs(xInner - x0) - 62;
          const px = x0 + 31;
          return (
            <g key={`p_${pi}`}>
              <rect x={px + 3} y={py + 4} width={pw} height={ph} rx={4} fill="#0e1922" opacity={0.75} />
              <rect x={px} y={py} width={pw} height={ph} rx={4} fill="#172634" stroke="#2d4356" strokeWidth={2.5} />
              <rect x={px + 12} y={py + 12} width={Math.max(12, pw - 24)} height={ph - 24} rx={2} fill="#1d2f3f" stroke="#101b24" strokeWidth={1.8} />
            </g>
          );
        })}
        {/* 2.5D Vertical Brass Door Push Handle near inner edge */}
        <rect
          x={handleX - 6}
          y={916}
          width={15}
          height={122}
          rx={6}
          fill="#090e13"
          opacity={0.65}
        />
        <rect
          x={handleX - 8}
          y={912}
          width={15}
          height={120}
          rx={6}
          fill="#d2a554"
          stroke="#4d3511"
          strokeWidth={2}
        />
        <line x1={handleX - 3} y1={920} x2={handleX - 3} y2={1024} stroke="#fff1bd" strokeWidth={2} opacity={0.8} />
      </g>
    );
  };

  return (
    <g>
      {renderPanel(-140, 168, true)}
      {renderPanel(912, 1220, false)}
    </g>
  );
};
