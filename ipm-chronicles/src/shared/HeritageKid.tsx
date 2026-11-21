import React from "react";
import { random, staticFile } from "remotion";
import { hash, clamp } from "./Flat3DCamera";

export type KidLook = {
  skin: string;
  skinShade: string;
  shirt: string;
  shirtShade: string;
  pants: string;
  hat: "peci" | "hijab" | "hair";
  hatColor: string;
  sarong?: "brown" | "indigo" | "olive" | null;
  shoes?: string;
  bag?: string;
};

export type Held = "letter" | "book" | "lamp" | "quill" | "magnifier" | "banner" | null;
export type Arm = [number, number]; // [shoulder deg, elbow deg]

export type HeritageKidProps = {
  look: KidLook;
  f: number;
  x?: number;
  y?: number;
  scale?: number;
  flip?: boolean;
  /** Render crisp 3/4 rear silhouette+clothes for historical crowd scenes without showing faces */
  backView?: boolean;
  armL?: Arm;
  armR?: Arm;
  head?: number;
  look2?: [number, number];
  smile?: number;
  open?: number;
  brow?: number;
  sleep?: number;
  walk?: number;
  walkAmp?: number;
  lean?: number;
  held?: Held;
  heldHand?: "L" | "R";
  seed?: number;
  sil?: string;
  opacity?: number;
  /** Optional v2 follow-through: head vertical lag (frames delayed behind body breath/sway, e.g. 1) */
  headLag?: number;
  /** Optional v2 irregular deterministic eye blink (2.8s–6.2s spacing via Remotion random) */
  useV2Blink?: boolean;
  /** Optional directional rim highlight color to separate character from dark/lit scenes */
  rimColor?: string;
  /** Screen-space rim light direction ("L" | "R") — respects `flip` automatically */
  rimSide?: "L" | "R";
  /** Rim light opacity multiplier (default 0.28) */
  rimStrength?: number;
  /** Subtle secondary breeze motion on hijab drape */
  clothSway?: number;
  /** Enable full 2.5D sculptural shading + fabric weave texture (matches painted heritage backdrops) */
  tactile?: boolean;
  /** Cast directional soft oblique floor shadow opposite rimSide light */
  castShadow?: boolean;
  /** 0..1 warm amber bounce glow onto chest, chin & cheeks from held lamp/lantern */
  lanternBounce?: number;
  /** Actor facing angle: 'front' (default, legacy compatible), 'threeQuarter', 'profile', or 'back' */
  view?: "front" | "threeQuarter" | "profile" | "back";
  /** Actor posture: 'stand' (default), 'sit_desk', or 'sit_floor' (bersila) */
  pose?: "stand" | "sit_desk" | "sit_floor";
  /** Smooth gaze/head yaw (-1..1) motivating cuts & glancing in acting shots */
  headTurn?: number;
  /** Soften ink outline thickness & warmth so SVG actor merges seamlessly into gouache scenes */
  painterly?: boolean;
};

const INK = "#22150c";

const HeldItem: React.FC<{ kind: Held; f: number; seed: number; armDeg?: number; tactile?: boolean }> = ({
  kind,
  f,
  seed,
  armDeg = 0,
  tactile = false,
}) => {
  const fl = 1 + Math.sin(f * 0.34 + seed) * 0.08 + Math.sin(f * 0.83) * 0.04;
  switch (kind) {
    case "letter":
      return (
        <g transform="rotate(-16)">
          {tactile && <rect x={-21} y={-28} width={48} height={60} rx={3} fill="#241306" opacity={0.28} />}
          <rect x={-24} y={-32} width={48} height={60} rx={3} fill="#f6ebd2" stroke={INK} strokeWidth={2.5} />
          <path d="M-24 -32 L0 -8 L24 -32" fill="none" stroke="#a68a5c" strokeWidth={2.5} />
          <circle cx={0} cy={-8} r={6.5} fill="#8d2416" stroke={INK} strokeWidth={1.5} />
        </g>
      );
    case "book":
      return tactile ? (
        <g transform="rotate(-8)">
          {/* Drop shadow onto coat */}
          <rect x={-23} y={-32} width={58} height={74} rx={5} fill="#180a03" opacity={0.36} />
          {/* Cream page thickness block (right & bottom edges) */}
          <rect x={-22} y={-34} width={54} height={69} rx={4} fill="#efe0bd" stroke={INK} strokeWidth={1.8} />
          <line x1={29} y1={-30} x2={29} y2={31} stroke="#c8b082" strokeWidth={1.3} />
          {/* Dark mahogany hardcover */}
          <rect x={-28} y={-38} width={54} height={68} rx={4} fill="#6b3220" stroke={INK} strokeWidth={2.2} />
          {/* Darker leather spine on left + raised bands */}
          <rect x={-28} y={-38} width={11} height={68} rx={3} fill="#461e11" stroke={INK} strokeWidth={1.6} />
          <line x1={-27} y1={-20} x2={-18} y2={-20} stroke="#c49448" strokeWidth={1.4} opacity={0.7} />
          <line x1={-27} y1={14} x2={-18} y2={14} stroke="#c49448" strokeWidth={1.4} opacity={0.7} />
          {/* Gold inner frame & cream archival plate */}
          <rect x={-13} y={-31} width={33} height={54} rx={2} fill="none" stroke="#d8ab5c" strokeWidth={1.4} opacity={0.85} />
          <rect x={-7} y={-20} width={21} height={15} rx={2} fill="#f4e6c7" stroke="#9b7338" strokeWidth={1.1} />
          <line x1={-3} y1={-14} x2={10} y2={-14} stroke="#6b4423" strokeWidth={1.6} />
          <line x1={-1} y1={-9} x2={8} y2={-9} stroke="#8a603a" strokeWidth={1.3} />
          {/* Crimson silk ribbon bookmark peeking at bottom */}
          <polygon points="8,30 15,30 15,43 11.5,39 8,43" fill="#a9261b" stroke={INK} strokeWidth={1.1} />
        </g>
      ) : (
        <g transform="rotate(-8)">
          <rect x={-26} y={-36} width={52} height={68} rx={4} fill="#6b3524" stroke={INK} strokeWidth={2.6} />
          <rect x={-21} y={-31} width={42} height={58} rx={2} fill="#f1e2c0" />
          <rect x={-13} y={-19} width={26} height={4} fill="#b89867" />
          <rect x={-13} y={-8} width={26} height={4} fill="#b89867" />
          <rect x={-13} y={3} width={20} height={4} fill="#b89867" />
        </g>
      );
    case "lamp":
      return (
        <g transform={`rotate(${(-armDeg * 0.92).toFixed(1)}) translate(0, 6)`}>
          <defs>
            <radialGradient id={`kidLamp_${seed}`}>
              <stop offset="0" stopColor="#ffe89e" stopOpacity={tactile ? 0.66 : 0.68} />
              <stop offset="0.45" stopColor="#ffaa2c" stopOpacity={tactile ? 0.26 : 0.22} />
              <stop offset="1" stopColor="#f59e0b" stopOpacity={0} />
            </radialGradient>
          </defs>
          <circle cx={0} cy={-26} r={(tactile ? 128 : 145) * fl} fill={`url(#kidLamp_${seed})`} />
          <rect x={-15} y={-6} width={30} height={16} rx={4} fill="#9c7330" stroke={INK} strokeWidth={tactile ? 2 : 2.4} />
          <path d="M-13 -6 Q-19 -34 0 -46 Q19 -34 13 -6 Z" fill="#fff5cf" stroke={INK} strokeWidth={tactile ? 1.8 : 2.2} opacity={0.96} />
          <path d={`M0 -40 Q${-9 * fl} -24 0 -11 Q${9 * fl} -24 0 -40 Z`} fill="#f58b1f" />
          {tactile && <path d={`M0 -34 Q${-4 * fl} -22 0 -14 Q${4 * fl} -22 0 -34 Z`} fill="#fffbe2" />}
        </g>
      );
    case "quill":
      return tactile ? (
        <g transform={`rotate(${(-armDeg * 0.85 + 22).toFixed(1)})`}>
          {/* Soft shadow onto shirt */}
          <path d="M 3 10 L 6 -52 Q 19 -68 23 -74 Q 16 -44 7 -4 Z" fill="#1b0e04" opacity={0.22} />
          {/* Wooden shaft & brass ferrule */}
          <rect x={-3.5} y={-6} width={7} height={28} rx={2.5} fill="#6c4121" stroke={INK} strokeWidth={1.6} />
          <rect x={-4} y={-8} width={8} height={7} rx={1.5} fill="#d6a244" stroke={INK} strokeWidth={1.3} />
          {/* Gold writing nib */}
          <path d="M -2.5 22 L 0 31 L 2.5 22 Z" fill="#e5b856" stroke={INK} strokeWidth={1.2} />
          {/* Sculpted cream plume with organic notch & rachis spine */}
          <path
            d="M 0 -7 C -5 -30 -3 -54 16 -76 C 17 -62 12 -52 15 -46 C 12 -45 10 -41 13 -35 C 9 -24 6 -13 2 -7 Z"
            fill="#faf2de"
            stroke={INK}
            strokeWidth={1.7}
            strokeLinejoin="round"
          />
          <path d="M 0.5 -7 Q 4 -40 15 -72" fill="none" stroke="#c8b084" strokeWidth={1.4} strokeLinecap="round" />
        </g>
      ) : (
        <g transform={`rotate(${(-armDeg * 0.85 + 18).toFixed(1)})`}>
          <rect x={-4} y={-6} width={8} height={30} rx={2} fill="#5e3a1e" stroke={INK} strokeWidth={1.6} />
          <path
            d="M 0 -4 L 4 -66 Q 20 -82 26 -88 Q 16 -52 6 -12 Z"
            fill="#f5ebd4"
            stroke={INK}
            strokeWidth={1.8}
            strokeLinejoin="round"
          />
          <path d="M 0 10 L 3 -2 L -2 -2 Z" fill="#d9a648" stroke={INK} strokeWidth={1.4} />
        </g>
      );
    case "magnifier":
      return (
        <g transform="rotate(22)">
          <rect x={-4} y={0} width={8} height={36} rx={3} fill="#6b3e1e" stroke={INK} strokeWidth={2} />
          <circle cx={0} cy={-22} r={22} fill="rgba(220,236,232,0.45)" stroke="#b68838" strokeWidth={5} />
          <circle cx={0} cy={-22} r={22} fill="none" stroke={INK} strokeWidth={2} />
          <path d="M-11 -30 Q-4 -36 4 -34" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" opacity={0.7} />
        </g>
      );
    case "banner":
      return (
        <g transform="rotate(-6)">
          <rect x={-3} y={-145} width={6} height={175} fill="#6c4526" stroke={INK} strokeWidth={1.8} />
          <rect x={3} y={-142} width={86} height={48} rx={3} fill="#f4ead3" stroke={INK} strokeWidth={2.4} />
          <rect x={8} y={-136} width={76} height={36} fill="none" stroke="#8d2416" strokeWidth={2} />
          <text x={46} y={-111} textAnchor="middle" fontSize={18} fontWeight={900} fontFamily="Georgia, serif" fill="#8d2416">
            IPM
          </text>
        </g>
      );
    default:
      return null;
  }
};

const ArmShape: React.FC<{
  side: 1 | -1;
  a: Arm;
  shirt: string;
  shirtShade: string;
  skin: string;
  held: Held;
  sil?: string;
  f: number;
  seed: number;
  rimColor?: string;
  rimStrength?: number;
  isRim?: boolean;
  tactile?: boolean;
  painterly?: boolean;
  puid?: string;
}> = ({ side, a, shirt, shirtShade, skin, held, sil, f, seed, rimColor = "#ffdfa0", rimStrength = 0.28, isRim = false, tactile = false, painterly = false, puid }) => {
  const sw = painterly ? 1.15 : tactile ? 2.0 : 2.8;
  const strokeMain = sil ?? (painterly ? "#553821" : tactile ? "#382312" : INK);
  const sleeveFill = sil ?? (side === 1 ? shirtShade : shirt);

  // Seamless one-piece articulated sleeve from shoulder (0,0) through elbow (0,48) to wrist
  const betaRad = ((-side * a[1]) * Math.PI) / 180;
  const forearmLen = 46;
  const cosB = Math.cos(betaRad);
  const sinB = Math.sin(betaRad);
  const rx = (lx: number, ly: number) => lx * cosB - ly * sinB;
  const ry = (lx: number, ly: number) => 48 + lx * sinB + ly * cosB;

  const armDir = -side * a[1]; // positive = bending toward body/front
  const shL = { x: -11.5, y: 2 };
  const shR = { x: 11.5, y: 2 };
  const elL = { x: -11.0, y: 48 };
  const elR = { x: 11.0, y: 48 };
  const wrL = { x: rx(-9.2, forearmLen - 4), y: ry(-9.2, forearmLen - 4) };
  const wrR = { x: rx(9.2, forearmLen - 4), y: ry(9.2, forearmLen - 4) };
  const elbowBendL = { x: (elL.x + rx(-11.0, 4)) * 0.5, y: (elL.y + ry(-11.0, 4)) * 0.5 };
  const elbowBendR = { x: (elR.x + rx(11.0, 4)) * 0.5, y: (elR.y + ry(11.0, 4)) * 0.5 };

  const seamlessSleeveD = [
    `M ${shL.x.toFixed(1)} ${shL.y.toFixed(1)}`,
    `Q -12.0 24 ${elbowBendL.x.toFixed(1)} ${elbowBendL.y.toFixed(1)}`,
    `L ${wrL.x.toFixed(1)} ${wrL.y.toFixed(1)}`,
    `Q ${((wrL.x + wrR.x) * 0.5).toFixed(1)} ${((wrL.y + wrR.y) * 0.5 + 3).toFixed(1)} ${wrR.x.toFixed(1)} ${wrR.y.toFixed(1)}`,
    `L ${elbowBendR.x.toFixed(1)} ${elbowBendR.y.toFixed(1)}`,
    `Q 12.0 24 ${shR.x.toFixed(1)} ${shR.y.toFixed(1)}`,
    `Q 0 -8 ${shL.x.toFixed(1)} ${shL.y.toFixed(1)} Z`,
  ].join(" ");

  const creaseSide = armDir >= 0 ? -1 : 1;
  const creaseStart = { x: creaseSide * 6.5, y: 47 };
  const creaseEnd = { x: rx(creaseSide * 1.5, 6), y: ry(creaseSide * 1.5, 6) };

  return (
    <g transform={`translate(${side * 59},-223) rotate(${-side * a[0]})`}>
      <path d={seamlessSleeveD} fill={sleeveFill} />
      {tactile && !sil && puid && (
        <>
          <path d={seamlessSleeveD} fill={`url(#${puid}_tex)`} opacity={0.72} />
          <path d={seamlessSleeveD} fill={`url(#${puid}_cyl)`} opacity={0.38} />
        </>
      )}
      <path
        d={[
          `M ${shL.x.toFixed(1)} ${(shL.y + 4).toFixed(1)}`,
          `Q -12.0 24 ${elbowBendL.x.toFixed(1)} ${elbowBendL.y.toFixed(1)}`,
          `L ${wrL.x.toFixed(1)} ${wrL.y.toFixed(1)}`,
          `Q ${((wrL.x + wrR.x) * 0.5).toFixed(1)} ${((wrL.y + wrR.y) * 0.5 + 3).toFixed(1)} ${wrR.x.toFixed(1)} ${wrR.y.toFixed(1)}`,
          `L ${elbowBendR.x.toFixed(1)} ${elbowBendR.y.toFixed(1)}`,
          `Q 12.0 24 ${shR.x.toFixed(1)} ${(shR.y + 4).toFixed(1)}`,
        ].join(" ")}
        fill="none"
        stroke={strokeMain}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {!sil && (
        <path
          d={`M ${creaseStart.x.toFixed(1)} ${creaseStart.y.toFixed(1)} Q 0 51 ${creaseEnd.x.toFixed(1)} ${creaseEnd.y.toFixed(1)}`}
          fill="none"
          stroke="#2c190a"
          strokeWidth={1.45}
          strokeLinecap="round"
          opacity={0.28}
        />
      )}
      {isRim && !sil && rimStrength > 0.02 && (
        <path
          d={`M ${side * 10} 2 L ${side * 10} 44 L ${rx(side * 8, forearmLen - 8).toFixed(1)} ${ry(side * 8, forearmLen - 8).toFixed(1)}`}
          fill="none"
          stroke={rimColor}
          strokeWidth={2.9}
          strokeLinecap="round"
          opacity={rimStrength * 0.8}
        />
      )}
      <g transform={`translate(0,48) rotate(${-side * a[1]})`}>
        {!sil && (
          <line x1={-8.5} y1={42} x2={8.5} y2={42} stroke={INK} strokeWidth={1.5} opacity={0.28} />
        )}
        <circle cx={0} cy={52} r={12.8} fill={sil ?? skin} stroke={sil ?? (tactile ? "#382312" : INK)} strokeWidth={tactile ? 1.9 : 2.4} />
        {tactile && !sil && puid && (
          <circle cx={0} cy={52} r={12.8} fill={`url(#${puid}_faceVol)`} opacity={0.65} />
        )}
        {!sil && (
          <path
            d="M -6 47 Q 0 44 6 48"
            fill="none"
            stroke="#fff3da"
            strokeWidth={2.2}
            strokeLinecap="round"
            opacity={0.38}
          />
        )}
        {held && !sil ? (
          <g transform="translate(0,52)">
            <HeldItem kind={held} f={f} seed={seed} armDeg={-side * (a[0] + a[1])} tactile={tactile} />
          </g>
        ) : null}
      </g>
    </g>
  );
};

const SarongBand: React.FC<{ tone: "brown" | "indigo" | "olive"; sil?: string }> = ({ tone, sil }) => {
  if (sil) return null;
  const pal =
    tone === "indigo"
      ? { base: "#2f4452", stripe: "#4a6676", gold: "#c4a36d" }
      : tone === "olive"
        ? { base: "#3e523a", stripe: "#5b7352", gold: "#d4b679" }
        : { base: "#6e462a", stripe: "#98653e", gold: "#d4b277" };
  return (
    <g>
      <path
        d="M-64 -116 Q0 -106 64 -116 L68 -48 Q0 -36 -68 -48 Z"
        fill={pal.base}
        stroke={INK}
        strokeWidth={2.8}
      />
      {[-38, -12, 14, 40].map((lx, idx) => (
        <rect key={idx} x={lx} y={-111} width={10} height={63} fill={pal.stripe} opacity={0.55} />
      ))}
      <path d="M-65 -90 Q0 -80 65 -90" fill="none" stroke={pal.gold} strokeWidth={3} opacity={0.5} />
    </g>
  );
};

export const HeritageKid: React.FC<HeritageKidProps> = ({
  look,
  f,
  x = 0,
  y = 0,
  scale = 1,
  flip = false,
  backView = false,
  armL = [8, 6],
  armR = [8, 6],
  head = 0,
  look2 = [0, 0],
  smile = 0.5,
  open = 0,
  brow = 0,
  sleep = 0,
  walk = 0,
  walkAmp = 0,
  lean = 0,
  held = null,
  heldHand = "R",
  seed = 1,
  sil,
  opacity = 1,
  headLag = 0,
  useV2Blink = false,
  rimColor = "#ffdfa0",
  rimSide = "L",
  rimStrength = 0.28,
  clothSway = 0,
  tactile = false,
  castShadow = false,
  lanternBounce = 0,
  view,
  pose = "stand",
  headTurn = 0,
  painterly = false,
}) => {
  const effectiveView = view ?? (backView ? "back" : "front");
  const isBack = effectiveView === "back" || backView;
  const isProfile = effectiveView === "profile" && !isBack;
  const isThreeQ = effectiveView === "threeQuarter" && !isBack;
  const yaw = clamp(headTurn, -1, 1);
  const breath = 0;
  const lagBreath = 0;
  const lagSway = 0;
  const bob = pose === "stand" ? Math.abs(Math.sin(walk)) * 9 * walkAmp : 0;
  const swing = pose === "stand" ? Math.sin(walk) * 26 * walkAmp : 0;
  const per = 92 + Math.floor(hash(seed) * 5) * 14;
  const v2Slot = Math.floor(f / 115);
  const v2Offset = Math.floor(random(`hk-blink-${seed}-${v2Slot}`) * 65) + 22;
  const v2Local = f % 115 - v2Offset;
  const blink = useV2Blink
    ? Math.max(sleep, v2Local >= 0 && v2Local < 6 ? Math.sin((v2Local / 6) * Math.PI) : 0)
    : Math.max(sleep, ((f + Math.floor(hash(seed + 5) * per)) % per) < 5 ? Math.sin((((f + Math.floor(hash(seed + 5) * per)) % per) / 5) * Math.PI) : 0);
  const eyeY = Math.max(0.1, 1 - 0.9 * blink);
  const S = (c: string) => sil ?? c;

  const L: Arm = [armL[0] + (heldHand === "L" && held ? 0 : swing * 0.9), armL[1]];
  const R: Arm = [armR[0] - (heldHand === "R" && held ? 0 : swing * 0.9), armR[1]];
  const sm = clamp(smile, -1, 1);
  const faceFill = S(look.skin);
  const strokeMain = painterly ? "#553821" : tactile ? "#382312" : INK;
  const strokeCol = sil ? sil : strokeMain;
  const swBody = painterly ? 1.15 : tactile ? 2.0 : 3.0;
  const swDetail = painterly ? 1.0 : tactile ? 1.8 : 2.6;
  // Convert world rimSide ("L" | "R") into character-local side (+/-1) respecting horizontal flip
  const rSide: 1 | -1 = flip ? (rimSide === "L" ? 1 : -1) : (rimSide === "L" ? -1 : 1);
  const shadowSign = -rSide;
  const swayPx = 0;
  const puid = `hk_${seed}_${effectiveView}_${pose}`;
  const lBounce = clamp(lanternBounce);
  const sitSinkY = pose === "sit_floor" ? 36 : pose === "sit_desk" ? 28 : 0;

  return (
    <g transform={`translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${(flip ? -scale : scale).toFixed(4)},${scale.toFixed(4)})`} opacity={opacity}>
      {tactile && !sil && (
        <defs>
          <pattern id={`${puid}_tex`} width="96" height="96" patternUnits="userSpaceOnUse">
            <image href={staticFile("art/textures/fabric_grain_alpha.png")} width="96" height="96" />
          </pattern>
          <radialGradient id={`${puid}_faceVol`} cx={rSide === 1 ? "64%" : "36%"} cy="34%" r="72%">
            <stop offset="0" stopColor="#fff3d6" stopOpacity={0.28} />
            <stop offset="0.52" stopColor="#fff3d6" stopOpacity={0} />
            <stop offset="1" stopColor="#3c1b06" stopOpacity={0.34} />
          </radialGradient>
          <radialGradient id={`${puid}_bodyVol`} cx={rSide === 1 ? "68%" : "32%"} cy="24%" r="78%">
            <stop offset="0" stopColor="#fff4d8" stopOpacity={0.24} />
            <stop offset="0.48" stopColor="#fff4d8" stopOpacity={0} />
            <stop offset="1" stopColor="#261306" stopOpacity={0.38} />
          </radialGradient>
          <linearGradient id={`${puid}_cyl`} x1={rSide === 1 ? "1" : "0"} y1="0" x2={rSide === 1 ? "0" : "1"} y2="0.4">
            <stop offset="0" stopColor="#fff2cf" stopOpacity={0.24} />
            <stop offset="0.5" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#241205" stopOpacity={0.34} />
          </linearGradient>
          <radialGradient id={`${puid}_hijabVol`} cx={rSide === 1 ? "62%" : "38%"} cy="26%" r="74%">
            <stop offset="0" stopColor="#ffffff" stopOpacity={0.24} />
            <stop offset="0.55" stopColor="#e8d6b8" stopOpacity={0.05} />
            <stop offset="1" stopColor="#3d2712" stopOpacity={0.32} />
          </radialGradient>
          <radialGradient id={`${puid}_peciVol`} cx={rSide === 1 ? "68%" : "32%"} cy="24%" r="78%">
            <stop offset="0" stopColor="#4f4032" stopOpacity={0.42} />
            <stop offset="0.55" stopColor="#1b140d" stopOpacity={0.1} />
            <stop offset="1" stopColor="#080503" stopOpacity={0.45} />
          </radialGradient>
          <radialGradient id={`${puid}_shoeVol`} cx={rSide === 1 ? "65%" : "35%"} cy="28%" r="70%">
            <stop offset="0" stopColor="#694e35" stopOpacity={0.62} />
            <stop offset="0.6" stopColor="#24180f" stopOpacity={0.2} />
            <stop offset="1" stopColor="#0b0603" stopOpacity={0.55} />
          </radialGradient>
          <radialGradient id={`${puid}_blush`} cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#dc6145" stopOpacity={0.44} />
            <stop offset="1" stopColor="#dc6145" stopOpacity={0} />
          </radialGradient>
          <radialGradient id={`${puid}_lampBounce`} cx="50%" cy="62%" r="64%">
            <stop offset="0" stopColor="#ffd778" stopOpacity={0.76 * lBounce} />
            <stop offset="0.45" stopColor="#f69828" stopOpacity={0.34 * lBounce} />
            <stop offset="1" stopColor="#f69828" stopOpacity={0} />
          </radialGradient>
          {castShadow && (
            <filter id={`${puid}_shblur`} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="5.5" />
            </filter>
          )}
        </defs>
      )}

      {/* Long oblique directional ground shadow cast opposite the sun/key light */}
      {castShadow && !sil && (
        <g filter={tactile ? `url(#${puid}_shblur)` : undefined} opacity={0.5}>
          <path
            d={`M -38 2 Q ${shadowSign * 64} 28 ${shadowSign * 168} 40 Q ${shadowSign * 144} 58 ${shadowSign * 42} 42 Q 10 24 38 6 Z`}
            fill="#221106"
          />
          <ellipse cx={shadowSign * 46} cy={16} rx={78} ry={17} fill="#1b0d04" opacity={0.6} />
        </g>
      )}

      {/* Soft ambient + directional contact shadow grounded tightly to shoes (suppressed in silhouette & PainterlyActorV3 passes) */}
      {!sil && !painterly && (
        <>
          <ellipse cx={shadowSign * 8} cy={5} rx={pose === "sit_floor" ? 88 : 74} ry={pose === "sit_floor" ? 16 : 13} fill="#180e06" opacity={tactile ? 0.48 : 0.34} />
          <ellipse cx={0} cy={3} rx={pose === "sit_floor" ? 68 : 58} ry={pose === "sit_floor" ? 12 : 10} fill="#120a04" opacity={tactile ? 0.44 : 0.32} />
        </>
      )}

      {/* Legs by Posture */}
      {pose === "sit_floor" ? (
        <g>
          {/* Cross-legged bersila knees tucked neatly onto pandan mat with soft socked/tucked ankles */}
          {[-1, 1].map((s) => (
            <g key={s}>
              <path
                d={`M ${s * 18} -42 Q ${s * 82} -38 ${s * 80} -10 Q ${s * 74} 6 ${s * 14} 2 Q ${s * 6} -16 ${s * 18} -42 Z`}
                fill={S(look.sarong ? "#633f25" : look.pants)}
                stroke={strokeCol}
                strokeWidth={swDetail}
              />
              {tactile && !sil && (
                <path
                  d={`M ${s * 18} -42 Q ${s * 82} -38 ${s * 80} -10 Q ${s * 74} 6 ${s * 14} 2 Z`}
                  fill={`url(#${puid}_tex)`}
                  opacity={0.65}
                />
              )}
              <ellipse cx={s * 24} cy={1} rx={12} ry={5.5} fill={S("#d9ccb8")} stroke={strokeCol} strokeWidth={1.4} opacity={0.85} />
            </g>
          ))}
        </g>
      ) : pose === "sit_desk" ? (
        <g>
          {/* Natural relaxed seated thigh & downward calf (kept compact behind real wooden table aprons) */}
          {[-1, 1].map((s) => (
            <g key={s} transform={`translate(${isProfile ? (s * 4 - 2) : s * 22},-58)`}>
              <rect x={-13} y={0} width={26} height={44} rx={11} fill={S(look.pants)} stroke={strokeCol} strokeWidth={swDetail} />
              {tactile && !sil && (
                <rect x={-13} y={0} width={26} height={44} rx={11} fill={`url(#${puid}_tex)`} opacity={0.62} />
              )}
              <ellipse cx={isProfile ? 6 : s * 4} cy={48} rx={20} ry={9.5} fill={S(look.shoes ?? "#24180f")} stroke={strokeCol} strokeWidth={1.7} />
            </g>
          ))}
        </g>
      ) : (
        [-1, 1].map((s) => (
          <g key={s} transform={`translate(${s * 24},${-86 - bob}) rotate(${s * swing})`}>
            <rect
              x={-15}
              y={0}
              width={30}
              height={64}
              rx={13}
              fill={S(look.pants)}
              stroke={strokeCol}
              strokeWidth={swDetail}
            />
            {tactile && !sil && (
              <>
                <rect x={-15} y={0} width={30} height={64} rx={13} fill={`url(#${puid}_tex)`} opacity={0.68} />
                <rect x={-15} y={0} width={30} height={64} rx={13} fill={`url(#${puid}_cyl)`} opacity={0.48} />
              </>
            )}
            {!sil && (
              <path
                d="M -13 60 L 13 60"
                stroke="#120c08"
                strokeWidth={2}
                opacity={0.35}
              />
            )}
            <ellipse
              cx={s * 4}
              cy={70}
              rx={25}
              ry={12}
              fill={S(look.shoes ?? "#24180f")}
              stroke={strokeCol}
              strokeWidth={tactile ? 1.8 : 2.4}
            />
            {tactile && !sil && (
              <ellipse cx={s * 4} cy={70} rx={25} ry={12} fill={`url(#${puid}_shoeVol)`} opacity={0.78} />
            )}
            {!sil && (
              <path
                d={`M ${s * 4 - 12} 65 Q ${s * 4} 61 ${s * 4 + 10} 65`}
                fill="none"
                stroke="#fff0d4"
                strokeWidth={tactile ? 2.4 : 1.8}
                strokeLinecap="round"
                opacity={tactile ? 0.38 : 0.22}
              />
            )}
          </g>
        ))
      )}

      {/* Torso + Coat/Baju + Sarung */}
      <g transform={`translate(0,${(-bob + breath * 0.3 + sitSinkY).toFixed(2)}) rotate(${lean},0,-90)`}>
        {look.bag && !sil ? (
          <rect
            x={-60}
            y={-236}
            width={120}
            height={132}
            rx={20}
            fill={look.bag}
            stroke={INK}
            strokeWidth={2.6}
            transform="translate(0,-4)"
          />
        ) : null}

        {/* Baju body with tailored side-profile contour or front sculptural shading */}
        <path
          d={
            isProfile
              ? "M-42 -238 Q-48 -238 -48 -220 L-44 -98 Q0 -84 44 -98 L46 -222 Q44 -238 30 -238 Z"
              : "M-60 -240 Q-66 -240 -66 -226 L-62 -98 Q0 -82 62 -98 L66 -226 Q66 -240 60 -240 Z"
          }
          fill={S(look.shirt)}
          stroke={strokeCol}
          strokeWidth={swBody}
        />
        {!sil && (
          <>
            <path
              d={
                isProfile
                  ? "M-42 -238 L-12 -238 L-12 -92 Q-28 -93 -44 -98 L-48 -220 Q-48 -238 -42 -238 Z"
                  : rSide === 1
                    ? "M-60 -240 L-14 -240 L-14 -89 Q-38 -90 -62 -98 L-66 -226 Q-66 -240 -60 -240 Z"
                    : "M14 -240 L60 -240 Q66 -240 66 -226 L62 -98 Q36 -90 14 -89 Z"
              }
              fill={look.shirtShade}
              opacity={tactile ? 0.42 : 0.55}
            />
            {tactile && (
              <>
                <path
                  d={
                    isProfile
                      ? "M-42 -238 Q-48 -238 -48 -220 L-44 -98 Q0 -84 44 -98 L46 -222 Q44 -238 30 -238 Z"
                      : "M-60 -240 Q-66 -240 -66 -226 L-62 -98 Q0 -82 62 -98 L66 -226 Q66 -240 60 -240 Z"
                  }
                  fill={`url(#${puid}_tex)`}
                  opacity={0.78}
                />
                <path
                  d={
                    isProfile
                      ? "M-42 -238 Q-48 -238 -48 -220 L-44 -98 Q0 -84 44 -98 L46 -222 Q44 -238 30 -238 Z"
                      : "M-60 -240 Q-66 -240 -66 -226 L-62 -98 Q0 -82 62 -98 L66 -226 Q66 -240 60 -240 Z"
                  }
                  fill={`url(#${puid}_bodyVol)`}
                  opacity={0.78}
                />
                {lBounce > 0.02 && (
                  <path
                    d={
                      isProfile
                        ? "M-42 -238 Q-48 -238 -48 -220 L-44 -98 Q0 -84 44 -98 L46 -222 Q44 -238 30 -238 Z"
                        : "M-60 -240 Q-66 -240 -66 -226 L-62 -98 Q0 -82 62 -98 L66 -226 Q66 -240 60 -240 Z"
                    }
                    fill={`url(#${puid}_lampBounce)`}
                    style={{ mixBlendMode: "screen" }}
                  />
                )}
              </>
            )}
            {/* Key-side torso rim highlight separating dark clothes cleanly from dark halls */}
            {rimStrength > 0.02 && (
              <path
                d={isProfile ? "M 42 -232 L 40 -108" : `M ${rSide * 62} -232 L ${rSide * 58} -108`}
                stroke={rimColor}
                strokeWidth={3.6}
                strokeLinecap="round"
                opacity={rimStrength * 0.8}
              />
            )}
            {/* Subtle tailored shirt placket seam & tiny brass/pearl buttons (front/3-4 only) */}
            {!backView && !isProfile && (
              <g opacity={0.44}>
                <line x1={0} y1={-216} x2={0} y2={-114} stroke={INK} strokeWidth={1.4} opacity={0.45} />
                <circle cx={0} cy={-196} r={2.6} fill={look.shirtShade} stroke={INK} strokeWidth={1.1} />
                <circle cx={0} cy={-166} r={2.6} fill={look.shirtShade} stroke={INK} strokeWidth={1.1} />
              </g>
            )}
          </>
        )}

        {/* Sarung wrap OR santriwati pleated skirt OR lower belt */}
        {look.sarong ? (
          <SarongBand tone={look.sarong} sil={sil} />
        ) : look.hat === "hijab" && !isProfile ? (
          <g>
            <path
              d="M-62 -114 Q0 -98 62 -114 L68 -42 Q0 -26 -68 -42 Z"
              fill={S(look.pants)}
              stroke={strokeCol}
              strokeWidth={swDetail}
            />
            {!sil && (
              <g opacity={0.28}>
                <line x1={-22} y1={-106} x2={-24} y2={-38} stroke="#0e1420" strokeWidth={1.6} />
                <line x1={22} y1={-106} x2={24} y2={-38} stroke="#0e1420" strokeWidth={1.6} />
              </g>
            )}
          </g>
        ) : (
          <path
            d={isProfile ? "M-44 -112 Q0 -98 44 -112 L44 -94 Q0 -80 -44 -94 Z" : "M-62 -112 Q0 -96 62 -112 L62 -94 Q0 -78 -62 -94 Z"}
            fill={S(look.pants)}
            stroke={strokeCol}
            strokeWidth={tactile ? 1.8 : 2.4}
          />
        )}

        {/* Neck & Collar + soft chin cast shadow */}
        <rect x={-14} y={-262} width={28} height={30} fill={faceFill} />
        {!sil && <ellipse cx={0} cy={-244} rx={17} ry={6} fill="#1b1109" opacity={0.26} />}
        {!backView && (
          <path
            d={isProfile ? "M-12 -246 L14 -216 L32 -242 L18 -252 L4 -234 L-8 -250 Z" : "M-28 -246 L0 -216 L28 -246 L18 -252 L0 -234 L-18 -252 Z"}
            fill={sil ? sil : "#fff8eb"}
            stroke={sil ? sil : strokeMain}
            strokeWidth={tactile ? 1.8 : 2.2}
          />
        )}

        {/* Back-view arms sit slightly behind head/drape; front-view arms reach naturally in front of hijab cape */}
        {isBack && (
          <>
            <ArmShape side={-1} a={L} shirt={look.shirt} shirtShade={look.shirtShade} skin={look.skin} held={heldHand === "L" ? held : null} sil={sil} f={f} seed={seed} rimColor={rimColor} rimStrength={rimStrength} isRim={rSide === -1} tactile={tactile} puid={puid} />
            <ArmShape side={1} a={R} shirt={look.shirt} shirtShade={look.shirtShade} skin={look.skin} held={heldHand === "R" ? held : null} sil={sil} f={f} seed={seed + 7} rimColor={rimColor} rimStrength={rimStrength} isRim={rSide === 1} tactile={tactile} puid={puid} />
          </>
        )}

        {/* Head */}
        <g transform={`translate(${(lagSway + (isProfile ? 6 : yaw * 4)).toFixed(2)},${(-300 + (headLag > 0 ? lagBreath * 0.55 : breath * 0.4)).toFixed(2)}) rotate(${(head + lagSway * 0.45).toFixed(2)},0,62)`}>
          {look.hat === "hijab" && (() => {
            const hijabPath = isProfile
              ? `M-64 10 Q-70 -76 2 -82 Q52 -78 52 -16 Q30 14 24 84 Q${(-40 + swayPx * 0.45).toFixed(1)} 102 -64 78 Z`
              : `M-74 12 Q-80 -76 0 -84 Q80 -76 74 12 L${(78 + swayPx).toFixed(1)} 88 Q${(swayPx * 0.5).toFixed(1)} 112 ${(-78 + swayPx).toFixed(1)} 88 Z`;
            return (
              <g>
                <path
                  d={hijabPath}
                  fill={S(look.hatColor)}
                  stroke={strokeCol}
                  strokeWidth={swBody}
                />
                {!sil && (
                  <>
                    {tactile && (
                      <>
                        <path d={hijabPath} fill={`url(#${puid}_tex)`} opacity={0.76} />
                        <path d={hijabPath} fill={`url(#${puid}_hijabVol)`} opacity={0.85} />
                      </>
                    )}
                    {/* Clean fold contour tailored to front vs profile view (zero ghost path) */}
                    <path
                      d={isProfile ? "M-44 26 Q-12 52 22 46" : "M-54 24 Q-26 60 0 66 Q26 60 54 24"}
                      fill="none"
                      stroke={INK}
                      strokeWidth={2.0}
                      opacity={0.22}
                    />
                    {lBounce > 0.02 && tactile && !isProfile && (
                      <path
                        d="M-66 44 Q0 92 66 44 L72 86 Q0 108 -72 86 Z"
                        fill={`url(#${puid}_lampBounce)`}
                        opacity={0.55}
                        style={{ mixBlendMode: "screen" }}
                      />
                    )}
                    {rimStrength > 0.02 && (
                      <path
                        d={
                          isProfile
                            ? "M-60 4 Q-64 -66 2 -78"
                            : rSide === -1
                              ? "M-70 6 Q-75 -68 -6 -79"
                              : "M70 6 Q75 -68 6 -79"
                        }
                        fill="none"
                        stroke={rimColor}
                        strokeWidth={3.6}
                        strokeLinecap="round"
                        opacity={rimStrength}
                      />
                    )}
                  </>
                )}
              </g>
            );
          })()}
          {!isProfile && (
            <>
              <circle cx={-64} cy={6} r={13} fill={faceFill} stroke={strokeCol} strokeWidth={swDetail} />
              {(!isThreeQ || yaw < -0.2) && (
                <circle cx={64} cy={6} r={13} fill={faceFill} stroke={strokeCol} strokeWidth={swDetail} />
              )}
              <ellipse cx={0} cy={4} rx={isThreeQ ? 61 : 64} ry={68} fill={faceFill} stroke={strokeCol} strokeWidth={swBody} />
            </>
          )}

          {isBack ? (
            <>
              {/* Clean rear hair / peci / hijab drape with zero facial traits */}
              {look.hat === "hijab" ? (
                <path
                  d={`M-66 -4 Q-68 -68 0 -72 Q68 -68 66 -4 L${(74 + swayPx).toFixed(1)} 88 Q${(swayPx * 0.5).toFixed(1)} 112 ${(-74 + swayPx).toFixed(1)} 88 Z`}
                  fill={S(look.hatColor)}
                  stroke={strokeCol}
                  strokeWidth={swDetail}
                />
              ) : (
                <path
                  d="M-64 -6 Q-64 56 0 68 Q64 56 64 -6 Q0 -48 -64 -6 Z"
                  fill={S("#241911")}
                />
              )}
              {look.hat === "peci" && (
                <g>
                  <path
                    d="M-60 -26 Q-58 -78 -50 -86 L50 -86 Q58 -78 60 -26 Q0 -38 -60 -26 Z"
                    fill={S(look.hatColor)}
                    stroke={strokeCol}
                    strokeWidth={swDetail}
                  />
                  <rect x={-48} y={-84} width={96} height={7} rx={3} fill="#fff" opacity={0.09} />
                </g>
              )}
            </>
          ) : isProfile ? (
            <>
              {/* Sculpted 2.5D side profile face facing +X (use flip={true} to face left) */}
              <path
                d="M-50 -2 Q-52 -66 2 -66 Q50 -64 52 -16 L64 8 Q54 14 52 22 Q48 68 0 68 Q-50 64 -50 -2 Z"
                fill={faceFill}
                stroke={strokeCol}
                strokeWidth={swBody}
              />
              {!sil && tactile && (
                <>
                  <path
                    d="M-50 -2 Q-52 -66 2 -66 Q50 -64 52 -16 L64 8 Q54 14 52 22 Q48 68 0 68 Q-50 64 -50 -2 Z"
                    fill={`url(#${puid}_faceVol)`}
                    opacity={0.78}
                  />
                  {lBounce > 0.02 && (
                    <ellipse cx={26} cy={14} rx={36} ry={48} fill={`url(#${puid}_lampBounce)`} opacity={0.55} style={{ mixBlendMode: "screen" }} />
                  )}
                </>
              )}
              {look.hat !== "hijab" && (
                <g transform="translate(-18, 9)">
                  <path
                    d="M 2 -11 C -9 -11 -11 6 -3 12 C 3 14 7 9 6 2"
                    fill={faceFill}
                    stroke={strokeCol}
                    strokeWidth={1.7}
                    strokeLinecap="round"
                  />
                  <path
                    d="M -2 -5 Q -5 1 -1 6"
                    fill="none"
                    stroke="#8e5d3b"
                    strokeWidth={1.4}
                    strokeLinecap="round"
                    opacity={0.48}
                  />
                </g>
              )}
              {look.hat === "hijab" && (
                <path
                  d="M-56 -2 Q-58 -68 2 -68 Q52 -66 56 -12 Q22 -30 -16 -24 Q-40 -16 -56 -2 Z"
                  fill={S(look.hatColor)}
                  stroke={strokeCol}
                  strokeWidth={swDetail}
                />
              )}
              {look.hat === "peci" && (
                <g>
                  <path
                    d="M-52 -28 Q-46 -78 -34 -85 L42 -85 Q54 -72 54 -28 Q2 -40 -52 -28 Z"
                    fill={S(look.hatColor)}
                    stroke={strokeCol}
                    strokeWidth={swDetail}
                  />
                  <rect x={-34} y={-85} width={76} height={7} rx={3.5} fill="#fff4db" opacity={0.14} />
                </g>
              )}
              {look.hat === "hair" && (
                <path d="M-54 -4 Q-58 -76 2 -76 Q54 -72 52 -14 Q20 -38 -18 -36 Z" fill={S(look.hatColor)} />
              )}
              {!sil && (
                <g>
                  <g transform={`translate(${(look2[0] * 3.5 + yaw * 3).toFixed(1)},${(look2[1] * 3).toFixed(1)})`}>
                    <ellipse cx={30} cy={4} rx={7.5} ry={10.2 * eyeY} fill={INK} />
                    <circle cx={32.5} cy={0.5} r={2.8} fill="#fff9ed" opacity={blink > 0.5 ? 0 : 1} />
                  </g>
                  <path d={`M17 ${-14 - brow * 5} L42 ${-15 + brow * 4}`} stroke={INK} strokeWidth={5.2} strokeLinecap="round" opacity={0.88} />
                  <circle cx={14} cy={28} r={11} fill={tactile ? `url(#${puid}_blush)` : "#c85a48"} opacity={tactile ? 0.85 : 0.24} />
                  {open > 0.05 ? (
                    <ellipse cx={41} cy={38} rx={9} ry={4 + open * 11} fill="#5a1f1f" stroke={INK} strokeWidth={2.2} />
                  ) : (
                    <path d={`M34 38 Q44 ${38 + 12 * sm} 51 35`} stroke={INK} strokeWidth={4.4} strokeLinecap="round" fill="none" />
                  )}
                </g>
              )}
            </>
          ) : (
            <>
              {!sil && (
                <>
                  {tactile ? (
                    <>
                      <ellipse cx={0} cy={4} rx={64} ry={68} fill={`url(#${puid}_faceVol)`} opacity={0.86} />
                      {lBounce > 0.02 && (
                        <ellipse cx={0} cy={14} rx={60} ry={58} fill={`url(#${puid}_lampBounce)`} opacity={0.56} style={{ mixBlendMode: "screen" }} />
                      )}
                    </>
                  ) : (
                    <path
                      d="M28 -52 Q64 -32 64 4 Q64 46 28 66 Q46 30 46 4 Q46 -26 28 -52 Z"
                      fill={look.skinShade}
                      opacity={0.45}
                    />
                  )}
                  {/* Cheek & temple rim-light arc facing key light */}
                  {rimStrength > 0.02 && (
                    <path
                      d={
                        rSide === -1
                          ? "M-32 -52 Q-59 -28 -59 4 Q-59 38 -34 58"
                          : "M32 -52 Q59 -28 59 4 Q59 38 34 58"
                      }
                      fill="none"
                      stroke={rimColor}
                      strokeWidth={3.5}
                      strokeLinecap="round"
                      opacity={rimStrength * 0.9}
                    />
                  )}
                </>
              )}
              {look.hat === "hijab" && (
                <g>
                  <path
                    d="M-66 -6 Q-62 -64 0 -66 Q62 -64 66 -6 Q40 -34 0 -34 Q-40 -34 -66 -6 Z"
                    fill={S(look.hatColor)}
                    stroke={strokeCol}
                    strokeWidth={swDetail}
                  />
                  {tactile && !sil && (
                    <>
                      <path
                        d="M-66 -6 Q-62 -64 0 -66 Q62 -64 66 -6 Q40 -34 0 -34 Q-40 -34 -66 -6 Z"
                        fill={`url(#${puid}_tex)`}
                        opacity={0.42}
                        style={{ mixBlendMode: "multiply" }}
                      />
                      <path
                        d="M-66 -6 Q-62 -64 0 -66 Q62 -64 66 -6 Q40 -34 0 -34 Q-40 -34 -66 -6 Z"
                        fill={`url(#${puid}_hijabVol)`}
                        opacity={0.75}
                      />
                    </>
                  )}
                </g>
              )}
              {look.hat === "peci" && (
                <g>
                  <path
                    d="M-60 -30 Q-58 -76 -50 -84 L50 -84 Q58 -76 60 -30 Q0 -44 -60 -30 Z"
                    fill={S(look.hatColor)}
                    stroke={strokeCol}
                    strokeWidth={swDetail}
                  />
                  {tactile && !sil && (
                    <>
                      <path
                        d="M-60 -30 Q-58 -76 -50 -84 L50 -84 Q58 -76 60 -30 Q0 -44 -60 -30 Z"
                        fill={`url(#${puid}_tex)`}
                        opacity={0.68}
                      />
                      <path
                        d="M-60 -30 Q-58 -76 -50 -84 L50 -84 Q58 -76 60 -30 Q0 -44 -60 -30 Z"
                        fill={`url(#${puid}_peciVol)`}
                        opacity={0.85}
                      />
                    </>
                  )}
                  <rect x={-52} y={-84} width={104} height={8} rx={4} fill="#fff4db" opacity={0.14} />
                  {!sil && rimStrength > 0.02 && (
                    <path
                      d={rSide === -1 ? "M-55 -35 Q-54 -74 -46 -82 L0 -82" : "M55 -35 Q54 -74 46 -82 L0 -82"}
                      fill="none"
                      stroke={rimColor}
                      strokeWidth={2.6}
                      strokeLinecap="round"
                      opacity={rimStrength * 0.85}
                    />
                  )}
                </g>
              )}
              {look.hat === "hair" && (
                <path
                  d="M-66 -4 Q-70 -76 0 -78 Q70 -76 66 -4 Q50 -42 0 -44 Q-50 -42 -66 -4 Z"
                  fill={S(look.hatColor)}
                />
              )}
              {!sil && (
                <g>
                  {isThreeQ ? (
                    (() => {
                      const shift = 16 + yaw * 12;
                      return (
                        <>
                          <g transform={`translate(${(look2[0] * 4 + shift * 0.45).toFixed(1)},${(look2[1] * 3.5).toFixed(1)})`}>
                            <ellipse cx={-20} cy={6} rx={8.4} ry={10.6 * eyeY} fill={INK} />
                            <ellipse cx={25} cy={6} rx={7.4} ry={10.2 * eyeY} fill={INK} />
                            <circle cx={-17.5} cy={2} r={2.9} fill="#fff9ed" opacity={blink > 0.5 ? 0 : 1} />
                            <circle cx={27} cy={2} r={2.6} fill="#fff9ed" opacity={blink > 0.5 ? 0 : 1} />
                          </g>
                          <path d={`M${(-33 + shift * 0.4).toFixed(1)} ${-12 - brow * 6} L${(-9 + shift * 0.4).toFixed(1)} ${-14 + brow * 6}`} stroke={INK} strokeWidth={5.5} strokeLinecap="round" opacity={0.88} />
                          <path d={`M${(36 + shift * 0.35).toFixed(1)} ${-12 - brow * 5} L${(14 + shift * 0.35).toFixed(1)} ${-14 + brow * 5}`} stroke={INK} strokeWidth={5.2} strokeLinecap="round" opacity={0.88} />
                          <path d={`M${(4 + shift * 0.48).toFixed(1)} -1 Q${(10 + shift * 0.54).toFixed(1)} 13 ${(3 + shift * 0.48).toFixed(1)} 18`} fill="none" stroke={strokeMain} strokeWidth={2.3} strokeLinecap="round" opacity={0.38} />
                          <circle cx={-34 + shift * 0.35} cy={30} r={tactile ? 13 : 9.5} fill={tactile ? `url(#${puid}_blush)` : "#c85a48"} opacity={tactile ? 0.85 : 0.25} />
                          <circle cx={38 + shift * 0.35} cy={30} r={tactile ? 11 : 8} fill={tactile ? `url(#${puid}_blush)` : "#c85a48"} opacity={tactile ? 0.72 : 0.2} />
                          {open > 0.05 ? (
                            (() => {
                              const mx = shift * 0.45;
                              const mw = 9.8 + open * 4.4;
                              const mh = 1.8 + open * 6.0;
                              const topY = 33.5 - open * 1.2;
                              const botY = topY + mh * 2.05;
                              return (
                                <g>
                                  <path
                                    d={`M ${(mx - mw).toFixed(1)} ${(topY + 1.2).toFixed(1)} Q ${mx.toFixed(1)} ${(topY - 1.4).toFixed(1)} ${(mx + mw).toFixed(1)} ${(topY + 1.2).toFixed(1)} Q ${(mx + mw * 0.86).toFixed(1)} ${botY.toFixed(1)} ${mx.toFixed(1)} ${botY.toFixed(1)} Q ${(mx - mw * 0.86).toFixed(1)} ${botY.toFixed(1)} ${(mx - mw).toFixed(1)} ${(topY + 1.2).toFixed(1)} Z`}
                                    fill="#4c1919"
                                    stroke={INK}
                                    strokeWidth={2.3}
                                    strokeLinejoin="round"
                                  />
                                  {open > 0.28 && (
                                    <path
                                      d={`M ${(mx - mw * 0.68).toFixed(1)} ${(topY + 1.4).toFixed(1)} Q ${mx.toFixed(1)} ${(topY + 2.4).toFixed(1)} ${(mx + mw * 0.68).toFixed(1)} ${(topY + 1.4).toFixed(1)}`}
                                      stroke="#f6eedc"
                                      strokeWidth={2.0}
                                      strokeLinecap="round"
                                      fill="none"
                                    />
                                  )}
                                  {open > 0.22 && (
                                    <ellipse
                                      cx={mx}
                                      cy={botY - mh * 0.45}
                                      rx={mw * 0.56}
                                      ry={Math.max(1.4, mh * 0.38)}
                                      fill="#b5483a"
                                    />
                                  )}
                                </g>
                              );
                            })()
                          ) : (
                            <path d={`M${(-12 + shift * 0.45).toFixed(1)} 34 Q${(shift * 0.45).toFixed(1)} ${34 + 17 * sm} ${(14 + shift * 0.45).toFixed(1)} 34`} stroke={INK} strokeWidth={4.8} strokeLinecap="round" fill="none" />
                          )}
                        </>
                      );
                    })()
                  ) : (
                    <>
                      <g transform={`translate(${(look2[0] * 4.5 + yaw * 6).toFixed(1)},${look2[1] * 3.5})`}>
                        <ellipse cx={-26} cy={6} rx={8.8} ry={10.8 * eyeY} fill={INK} />
                        <ellipse cx={26} cy={6} rx={8.8} ry={10.8 * eyeY} fill={INK} />
                        <circle cx={-23} cy={2} r={3.1} fill="#fff9ed" opacity={blink > 0.5 ? 0 : 1} />
                        <circle cx={29} cy={2} r={3.1} fill="#fff9ed" opacity={blink > 0.5 ? 0 : 1} />
                        <circle cx={-28} cy={10} r={1.4} fill="#ffe4ad" opacity={blink > 0.5 ? 0 : 0.45} />
                        <circle cx={24} cy={10} r={1.4} fill="#ffe4ad" opacity={blink > 0.5 ? 0 : 0.45} />
                      </g>
                      <path d={`M-40 ${-12 - brow * 6} L-14 ${-14 + brow * 6}`} stroke={INK} strokeWidth={5.8} strokeLinecap="round" opacity={0.88} />
                      <path d={`M40 ${-12 - brow * 6} L14 ${-14 + brow * 6}`} stroke={INK} strokeWidth={5.8} strokeLinecap="round" opacity={0.88} />
                      <circle cx={-44} cy={30} r={tactile ? 14 : 10.5} fill={tactile ? `url(#${puid}_blush)` : "#c85a48"} opacity={tactile ? 0.9 : 0.26} />
                      <circle cx={44} cy={30} r={tactile ? 14 : 10.5} fill={tactile ? `url(#${puid}_blush)` : "#c85a48"} opacity={tactile ? 0.9 : 0.26} />
                      {open > 0.05 ? (
                        (() => {
                          const mw = 10.6 + open * 4.8;
                          const mh = 1.9 + open * 6.2;
                          const topY = 33.5 - open * 1.2;
                          const botY = topY + mh * 2.05;
                          return (
                            <g>
                              <path
                                d={`M ${(-mw).toFixed(1)} ${(topY + 1.2).toFixed(1)} Q 0 ${(topY - 1.4).toFixed(1)} ${mw.toFixed(1)} ${(topY + 1.2).toFixed(1)} Q ${(mw * 0.86).toFixed(1)} ${botY.toFixed(1)} 0 ${botY.toFixed(1)} Q ${(-mw * 0.86).toFixed(1)} ${botY.toFixed(1)} ${(-mw).toFixed(1)} ${(topY + 1.2).toFixed(1)} Z`}
                                fill="#4c1919"
                                stroke={INK}
                                strokeWidth={2.4}
                                strokeLinejoin="round"
                              />
                              {open > 0.28 && (
                                <path
                                  d={`M ${(-mw * 0.68).toFixed(1)} ${(topY + 1.4).toFixed(1)} Q 0 ${(topY + 2.4).toFixed(1)} ${(mw * 0.68).toFixed(1)} ${(topY + 1.4).toFixed(1)}`}
                                  stroke="#f6eedc"
                                  strokeWidth={2.1}
                                  strokeLinecap="round"
                                  fill="none"
                                />
                              )}
                              {open > 0.22 && (
                                <ellipse
                                  cx={0}
                                  cy={botY - mh * 0.45}
                                  rx={mw * 0.56}
                                  ry={Math.max(1.5, mh * 0.38)}
                                  fill="#b5483a"
                                />
                              )}
                            </g>
                          );
                        })()
                      ) : (
                        <path d={`M-16 34 Q0 ${34 + 18 * sm} 16 34`} stroke={INK} strokeWidth={5} strokeLinecap="round" fill="none" />
                      )}
                    </>
                  )}
                </g>
              )}
            </>
          )}
        </g>

        {!isBack && !isProfile && (
          <>
            <ArmShape side={-1} a={L} shirt={look.shirt} shirtShade={look.shirtShade} skin={look.skin} held={heldHand === "L" ? held : null} sil={sil} f={f} seed={seed} rimColor={rimColor} rimStrength={rimStrength} isRim={rSide === -1} tactile={tactile} painterly={painterly} puid={puid} />
            <ArmShape side={1} a={R} shirt={look.shirt} shirtShade={look.shirtShade} skin={look.skin} held={heldHand === "R" ? held : null} sil={sil} f={f} seed={seed + 7} rimColor={rimColor} rimStrength={rimStrength} isRim={rSide === 1} tactile={tactile} painterly={painterly} puid={puid} />
          </>
        )}
        {!isBack && isProfile && (
          <>
            {/* Foreground reaching actor arm anchored at true shoulder socket in side profile */}
            <g transform="translate(-54,10)">
              <ArmShape side={1} a={R} shirt={look.shirt} shirtShade={look.shirtShade} skin={look.skin} held={heldHand === "R" ? held : null} sil={sil} f={f} seed={seed + 7} rimColor={rimColor} rimStrength={rimStrength} isRim={rSide === 1} tactile={tactile} painterly={painterly} puid={puid} />
            </g>
          </>
        )}
      </g>
    </g>
  );
};

export const santriPutra = (i = 0, sarong: KidLook["sarong"] = "brown"): KidLook => ({
  skin: ["#cfa077", "#b8825a", "#dcaf88", "#9c6b48"][i % 4],
  skinShade: ["#ad7b52", "#92613d", "#ba885e", "#794d30"][i % 4],
  shirt: ["#f5ecd6", "#efe3c7", "#f7f0df"][i % 3],
  shirtShade: ["#dfd0b2", "#d6c5a3", "#e2d5b7"][i % 3],
  pants: ["#2a313d", "#332a22", "#263344"][i % 3],
  hat: "peci",
  hatColor: "#1b140f",
  sarong,
});

export const santriPutri = (i = 0): KidLook => ({
  skin: ["#dbb088", "#cda078", "#e0ba96", "#b8825a"][i % 4],
  skinShade: ["#b98960", "#aa7a53", "#bf9570", "#95623d"][i % 4],
  shirt: ["#f8f1df", "#f1e6cd"][i % 2],
  shirtShade: ["#e2d4b5", "#d8c7a3"][i % 2],
  pants: ["#283446", "#362b22"][i % 2],
  hat: "hijab",
  hatColor: ["#ede0c4", "#5c6c56", "#8c6244", "#41545c"][i % 4],
});
