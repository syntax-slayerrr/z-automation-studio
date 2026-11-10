import * as THREE from "three";
import {
  Pen,
  INK,
  SKIN,
  shade,
  mix,
  mul,
  ellPts,
  headBlob,
  blobPts,
  thickAngle,
  bodyFront,
  bodySide,
  Outfit,
  Expr,
} from "../bridge/toon";
import { Pool, Actor, Fx, SU, Place, FxPlace } from "../bridge/cast";

export { Pool, Actor, Fx, SU };

// ---------------- MODERN JAKARTA OUTFITS ----------------
export const JAKARTA_COMMUTERS: Outfit[] = [
  // 1. Eksekutif Muda / Office worker (Royal blue suit, dark trousers, tie, neat dark hair)
  {
    jacket: "#1d4ed8",
    pants: "#1e293b",
    boots: "#0f172a",
    skin: SKIN,
    hair: "#0f172a",
    hat: "hair",
    buttons: "#e2e8f0",
  },
  // 2. Creative / Start-up worker (Red polo/jacket, dark jeans, white sneakers, baseball cap)
  {
    jacket: "#dc2626",
    pants: "#334155",
    boots: "#f8fafc",
    skin: "#f5c9a0",
    cap: "#991b1b",
    hat: "cap",
    buttons: "#f1f5f9",
  },
  // 3. Tech Lead / Hustler (Emerald green jacket, dark chinos, sneakers, styled hair)
  {
    jacket: "#15803d",
    pants: "#1e293b",
    boots: "#0f172a",
    skin: "#ecd0b6",
    hair: "#1c1917",
    hat: "hair",
    buttons: "#f8fafc",
  },
];

// Helper for curved bezier polyline
export const curve = (
  a: [number, number],
  k: [number, number],
  b: [number, number],
  n = 10
): [number, number][] => {
  const c: [number, number] = [2 * k[0] - (a[0] + b[0]) / 2, 2 * k[1] - (a[1] + b[1]) / 2];
  const out: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n,
      s = 1 - t;
    out.push([
      s * s * a[0] + 2 * s * t * c[0] + t * t * b[0],
      s * s * a[1] + 2 * s * t * c[1] + t * t * b[1],
    ]);
  }
  return out;
};

// Helper for rounded rectangle points
export const rrect = (
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  r: number,
  n = 6
): [number, number][] => {
  const pts: [number, number][] = [];
  const arc = (cx: number, cy: number, a0: number, a1: number) => {
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
  };
  arc(x1 - r, y0 + r, -Math.PI / 2, 0);
  arc(x1 - r, y1 - r, 0, Math.PI / 2);
  arc(x0 + r, y1 - r, Math.PI / 2, Math.PI);
  arc(x0 + r, y0 + r, Math.PI, (3 * Math.PI) / 2);
  return pts;
};

// ---------------- SUITCASE (KOPER) DRAWER ----------------
export const drawSuitcase = (
  p: Pen,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  handleX: number,
  handleY: number
) => {
  const thick = 5;

  // Trolley handle extending from suitcase to character hand
  p.stroke([[x, y - h / 2], [x, handleY], [handleX, handleY]], 7, "#334155");
  p.stroke([[x, y - h / 2], [x, handleY], [handleX, handleY]], 4, "#94a3b8");

  // Suitcase body shell
  const bodyPts = rrect(x - w / 2, y - h / 2, x + w / 2, y + h / 2, 14);
  p.poly(bodyPts, color, thick);

  // Leather corners & ribbed bands
  const bandCol = shade(color, 0.75);
  p.stroke([[x - w / 2 + 8, y], [x + w / 2 - 8, y]], 5, bandCol);
  p.stroke([[x, y - h / 2 + 8], [x, y + h / 2 - 8]], 5, bandCol);

  // Spinner wheels at bottom
  p.ell(x - w / 3, y + h / 2 + 7, 8, 8, "#0f172a", 3.5);
  p.ell(x + w / 3, y + h / 2 + 7, 8, 8, "#0f172a", 3.5);
};

// ---------------- WARGA JAKARTA SPRINTER (SIDE MARCH) ----------------
export const drawWargaJakartaSide = (
  p: Pen,
  opts: {
    outfitIndex?: number;
    phase?: number;
    koperCol?: string;
    seed?: number;
    expr?: Expr;
  } = {}
) => {
  const {
    outfitIndex = 0,
    phase = 0,
    koperCol = "#f59e0b",
    seed = 1,
    expr = "grin",
  } = opts;

  const outfit = JAKARTA_COMMUTERS[outfitIndex % JAKARTA_COMMUTERS.length];

  // Draw full anatomically rigged character walking/marching from toon.ts
  bodySide(p, outfit, {
    mode: "march",
    phase,
    stride: 1.25,
    seed,
    expr,
  });

  // Calculate hand position from march phase to attach rolling suitcase
  const cycle = ((phase % 1) + 1) % 1;
  const swingX = Math.sin(cycle * Math.PI * 2) * 55;
  const handX = 300 - 35 + swingX * 0.4;
  const handY = 620;

  // Draw luggage trailing behind
  const koperX = handX - 105;
  const koperY = 780;
  drawSuitcase(p, koperX, koperY, 90, 130, koperCol, handX, handY);

  // Cartoon sweat drop
  const headX = 300 + 20;
  const headY = 310;
  p.poly(
    [
      [headX - 45, headY - 15],
      [headX - 65, headY - 2],
      [headX - 52, headY - 2],
    ],
    "#38bdf8",
    3.5
  );
};

// ---------------- WARGA JAKARTA ARRIVAL (FRONT VIEW) ----------------
export const drawWargaJakartaFront = (
  p: Pen,
  opts: {
    outfitIndex?: number;
    phase?: number;
    koperCol?: string;
    seed?: number;
    expr?: Expr;
    blink?: boolean;
  } = {}
) => {
  const {
    outfitIndex = 0,
    phase = 0,
    koperCol = "#f59e0b",
    seed = 1,
    expr = "grin",
    blink = false,
  } = opts;

  const outfit = JAKARTA_COMMUTERS[outfitIndex % JAKARTA_COMMUTERS.length];

  bodyFront(p, outfit, {
    mode: "stand",
    expr,
    seed,
    blink,
  });

  // Suitcase standing beside him, hand near handle
  drawSuitcase(p, 420, 790, 90, 130, koperCol, 375, 650);
};

// ---------------- SULTAN GARUT (AUTHENTIC STICKMAN SULTAN 10JT) ----------------
export const drawSultanGarut = (
  p: Pen,
  opts: {
    bob?: number;
    goldGlint?: number;
  } = {}
) => {
  const { bob = 0, goldGlint = 0 } = opts;
  const cx = 300;
  const seed = 7;

  // Sultan Outfit: Royal black beskap with gold buttons & gold sash
  const sultanOutfit: Outfit = {
    jacket: "#18181b",
    pants: "#09090b",
    boots: "#09090b",
    skin: SKIN,
    hat: "hair",
    hair: "#0f172a",
    buttons: "#fbbf24",
    sash: "#f59e0b",
  };

  // 1. Draw Stickman body in proud standing pose
  bodyFront(p, sultanOutfit, {
    mode: "stand",
    expr: "grin",
    seed,
  });

  // Mathematically verified coordinates for adult build in toon.ts with seed=7:
  // H.b = 110.46, hc (eyes) = 312.2, chin = 422.7, crown = 201.8, torsoBot = 665.7
  const hc = 312.2;
  const chin = 422.7;

  // 2. Magnificent Golden Ram Horns on his head (Tanduk Domba Garut Emas)
  // Curving UP and OUT majestically above the crown
  const drawHorn = (isLeft: boolean) => {
    const s = isLeft ? -1 : 1;
    const hx = cx + s * 88;
    const hy = hc - 32;

    const outer: [number, number][] = [];
    const inner: [number, number][] = [];
    const steps = 30;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // Arching curve: sweeps outward, then curls back around the top
      const ang = -Math.PI * 0.42 + t * Math.PI * 1.38;
      const rad = 28 + t * 115;
      const w = 38 * (1 - t * 0.75);

      const ox = hx + s * Math.cos(ang) * rad;
      // Subtract to curl UPWARDS in canvas coords (-y is up)
      const oy = hy - Math.sin(t * Math.PI * 0.85) * 95;

      const nx = -Math.sin(ang) * (w / 2) * s;
      const ny = -Math.cos(ang) * (w / 2);

      outer.push([ox + nx, oy + ny]);
      inner.unshift([ox - nx, oy - ny]);
    }

    const hornPts = [...outer, ...inner];
    // Bright lustrous gold fill with calligraphic ink outline
    p.poly(hornPts, "#f59e0b", 6.5);

    // Golden highlight ridges
    for (let k = 2; k < steps - 2; k += 3) {
      p.stroke([outer[k], inner[inner.length - 1 - k]], 4.0, "#fde68a");
    }

    // Golden polished tip
    const tip = outer[outer.length - 1];
    p.ell(tip[0], tip[1], 10, 10, "#fbbf24", 3);
  };

  drawHorn(true);
  drawHorn(false);

  // 3. Ultra-Cool Aviator Sunglasses (Positioned precisely over eyes at hc - 16 = 296)
  const glassY = hc - 16;
  const glassW = 50;
  const glassH = 32;
  const glassGap = 6;

  // Polished gold top bar and bridge
  p.stroke([[cx - 40, glassY - 16], [cx + 40, glassY - 16]], 5, "#fbbf24");
  p.stroke([[cx - 8, glassY - 2], [cx + 8, glassY - 2]], 5, "#fbbf24");

  for (const s of [-1, 1]) {
    const lx = cx + s * (glassW / 2 + glassGap);
    // Teardrop aviator lens shape
    const lensPts = rrect(
      lx - glassW / 2,
      glassY - glassH / 2,
      lx + glassW / 2,
      glassY + glassH / 2 + 5,
      10
    );
    p.poly(lensPts, "#09090b", 5);

    // Gold rim outline
    p.stroke(lensPts, 2.5, "#fbbf24");
  }
  // Sharp white diagonal glare reflections
  p.stroke([[cx - 42, glassY - 10], [cx - 20, glassY + 10]], 3.8, "#ffffffdd");
  p.stroke([[cx + 14, glassY - 10], [cx + 36, glassY + 10]], 3.8, "#ffffffdd");

  // 4. Chunky Heavy Gold Chain with "10 JT" Medallion
  // Drapes around neck (chin + 25 = 448) and sits prominently across the chest (535)
  const chainY = chin + 25;
  const chainW = 78;

  for (let a = -5; a <= 5; a++) {
    const t = a / 5;
    const linkX = cx + t * chainW;
    const linkY = chainY + (1 - t * t) * 38;
    p.ell(linkX, linkY, 13, 10, "#d97706", 3.5);
    p.ell(linkX, linkY, 8, 6, "#fbbf24", 0);
  }

  // Giant Gleaming Gold Medallion
  const medY = chainY + 85; // ~533
  p.ell(cx, medY, 46, 46, "#b45309", 7);
  p.ell(cx, medY, 40, 40, "#fbbf24", 4);
  p.ell(cx, medY, 35, 35, "#f59e0b", 2.5);

  // Bold "10 JT" Text
  p.g.save();
  p.g.fillStyle = "#78350f";
  p.g.font = "900 24px 'Arial Black', Arial, sans-serif";
  p.g.textAlign = "center";
  p.g.textBaseline = "middle";
  p.g.fillText("10 JT", cx, medY);
  p.g.restore();

  // 5. Sparkle Glints (4-point star glints on gold accessories)
  if (goldGlint > 0) {
    const glint = (gx: number, gy: number, r: number) => {
      p.stroke([[gx - r, gy], [gx + r, gy]], 3, "#ffffff");
      p.stroke([[gx, gy - r], [gx, gy + r]], 3, "#ffffff");
      p.dot(gx, gy, 4, "#fbbf24");
    };
    glint(cx - 130, hc - 85, 16);
    glint(cx + 42, medY - 22, 16);
    glint(cx + 130, hc - 85, 16);
  }
};

export const drawDombaSultan = drawSultanGarut;
