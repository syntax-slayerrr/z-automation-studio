import * as THREE from "three";

/**
 * Reusable Procedural Architectural PBR Material Factory for Skill #13: `galeri-motion-worldforge`
 * Reverse-engineered 1:1 from `galeri-motion-worldforge-roma.mp4`:
 *  - Matte Architectural PBR (`roughness: 0.78-0.94`, ZERO glossy toy clearcoat, ZERO black ink outlines!)
 *  - Procedural Canvas2D textures: cobblestone/cracked alley paving, rusted corrugated tin roofs,
 *    terracotta tiles, multi-story Indonesian tenement facades with dynamic dark/warm-lit windows,
 *    modern glass skyscraper curtain walls, weathered project signs, and transparent open budget boards!
 */

function makeSeededRand(seedInit: number) {
  let s = seedInit;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function createAlleyPavingTexture(cracked = true, wet = false): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext("2d")!;
  const rand = makeSeededRand(cracked ? 1047 : 2089);

  // Base worn concrete/asphalt tone
  ctx.fillStyle = wet ? "#343B46" : cracked ? "#5D636D" : "#7A828C";
  ctx.fillRect(0, 0, 512, 512);

  // Paving stone / concrete slab subtle grid (echoing worldforge cobblestone texture!)
  ctx.strokeStyle = wet ? "rgba(20, 26, 36, 0.55)" : "rgba(42, 46, 54, 0.36)";
  ctx.lineWidth = 3;
  for (let row = 0; row < 8; row++) {
    const y = row * 64;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
    const off = (row % 2) * 32;
    for (let col = 0; col < 8; col++) {
      const x = (col * 64 + off) % 512;
      ctx.fillStyle = `rgba(255,255,255,${(rand() * 0.06).toFixed(3)})`;
      ctx.fillRect(x + 2, y + 2, 60, 60);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 64);
      ctx.stroke();
    }
  }

  if (cracked) {
    // Organic weathering patches & dark jagged cracks/pothole stains
    for (let i = 0; i < 18; i++) {
      ctx.fillStyle = `rgba(34, 32, 30, ${(0.12 + rand() * 0.16).toFixed(2)})`;
      ctx.beginPath();
      ctx.ellipse(rand() * 512, rand() * 512, 16 + rand() * 44, 10 + rand() * 26, rand() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(26, 24, 24, 0.65)";
    ctx.lineWidth = 2.4;
    for (let k = 0; k < 12; k++) {
      let cx = rand() * 512;
      let cy = rand() * 512;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      for (let s = 0; s < 5; s++) {
        cx += (rand() - 0.5) * 58;
        cy += (rand() - 0.5) * 58;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 14);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function createCorrugatedRoofTexture(variant: "rust_tin" | "terracotta" | "clean_tile"): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  const rand = makeSeededRand(variant === "rust_tin" ? 311 : variant === "terracotta" ? 733 : 919);

  const base =
    variant === "rust_tin" ? "#6D6A68" : variant === "terracotta" ? "#A64B2E" : "#B85535";
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 256);

  // Crisp parallel corrugated ribs / terracotta tile ridges
  for (let x = 0; x < 256; x += 10) {
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect(x, 0, 4, 256);
    ctx.fillStyle = "rgba(255,255,255,0.09)";
    ctx.fillRect(x + 4, 0, 3, 256);
  }

  if (variant === "rust_tin") {
    // Authentic Indonesian weathered rust patches on zinc sheets
    for (let i = 0; i < 28; i++) {
      ctx.fillStyle = `rgba(138, 66, 36, ${(0.18 + rand() * 0.34).toFixed(2)})`;
      ctx.beginPath();
      ctx.ellipse(rand() * 256, rand() * 256, 14 + rand() * 38, 10 + rand() * 28, rand() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Horizontal tile course lines
    ctx.strokeStyle = "rgba(64, 24, 14, 0.28)";
    ctx.lineWidth = 2;
    for (let y = 0; y < 256; y += 22) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Multi-Story Indonesian Slum / Alley Wall Facade Texture with Windows
 * Returns BOTH a diffuse map AND an emissive window mask so hundreds of windows glow warm amber at night/sunset!
 */
export function createFacadeTextureSet(opts: {
  wallHex: string;
  cols: number;
  rows: number;
  weathered?: boolean;
  seed?: number;
}): { map: THREE.CanvasTexture; emissiveMap: THREE.CanvasTexture } {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d")!;

  const ce = document.createElement("canvas");
  ce.width = 256;
  ce.height = 256;
  const ctxE = ce.getContext("2d")!;
  ctxE.fillStyle = "#000000";
  ctxE.fillRect(0, 0, 256, 256);

  const rand = makeSeededRand(opts.seed ?? 501);

  ctx.fillStyle = opts.wallHex;
  ctx.fillRect(0, 0, 256, 256);

  // Subtle architectural horizontal plaster courses
  ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
  for (let y = 0; y < 256; y += 32) {
    ctx.fillRect(0, y, 256, 3);
  }

  if (opts.weathered) {
    // Damp stain gradient near bottom & subtle mossy patches
    const damp = ctx.createLinearGradient(0, 175, 0, 256);
    damp.addColorStop(0, "rgba(42, 38, 32, 0)");
    damp.addColorStop(1, "rgba(38, 36, 30, 0.42)");
    ctx.fillStyle = damp;
    ctx.fillRect(0, 175, 256, 81);

    for (let i = 0; i < 14; i++) {
      ctx.fillStyle = `rgba(60, 56, 48, ${(0.06 + rand() * 0.12).toFixed(2)})`;
      ctx.fillRect(rand() * 220, rand() * 220, 18 + rand() * 32, 12 + rand() * 28);
    }
  }

  // Draw crisp recessed architectural windows (matching worldforge-roma aesthetic!)
  const cellW = 256 / opts.cols;
  const cellH = 220 / opts.rows;
  for (let r = 0; r < opts.rows; r++) {
    for (let col = 0; col < opts.cols; col++) {
      const wx = col * cellW + cellW * 0.24;
      const wy = 16 + r * cellH + cellH * 0.20;
      const ww = cellW * 0.52;
      const wh = cellH * 0.56;

      // White/cream trim frame
      ctx.fillStyle = "#E7E2D6";
      ctx.fillRect(wx - 3, wy - 3, ww + 6, wh + 6);

      // Dark interior pane
      ctx.fillStyle = "#1E222B";
      ctx.fillRect(wx, wy, ww, wh);

      // ~55% of windows glow warm amber when night/dusk emissiveIntensity turns up!
      if (rand() > 0.42) {
        ctxE.fillStyle = rand() > 0.35 ? "#FFCA7A" : "#FFE4A8";
        ctxE.fillRect(wx, wy, ww, wh);
      }
    }
  }

  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  map.needsUpdate = true;

  const emissiveMap = new THREE.CanvasTexture(ce);
  emissiveMap.colorSpace = THREE.SRGBColorSpace;
  emissiveMap.needsUpdate = true;

  return { map, emissiveMap };
}

export function createSkyscraperGlassTextures(): {
  map: THREE.CanvasTexture;
  emissiveMap: THREE.CanvasTexture;
} {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 512;
  const ctx = c.getContext("2d")!;

  const ce = document.createElement("canvas");
  ce.width = 256;
  ce.height = 512;
  const ctxE = ce.getContext("2d")!;
  ctxE.fillStyle = "#000000";
  ctxE.fillRect(0, 0, 256, 512);

  const rand = makeSeededRand(9941);
  ctx.fillStyle = "#2A3E57";
  ctx.fillRect(0, 0, 256, 512);

  for (let r = 0; r < 18; r++) {
    for (let col = 0; col < 6; col++) {
      const x = 10 + col * 40;
      const y = 10 + r * 27;
      ctx.fillStyle = rand() > 0.4 ? "#5E86AD" : "#446B91";
      ctx.fillRect(x, y, 30, 18);
      if (rand() > 0.32) {
        ctxE.fillStyle = rand() > 0.5 ? "#FFE8B8" : "#BEE3F8";
        ctxE.fillRect(x, y, 30, 18);
      }
    }
  }

  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  map.needsUpdate = true;
  const emissiveMap = new THREE.CanvasTexture(ce);
  emissiveMap.colorSpace = THREE.SRGBColorSpace;
  emissiveMap.needsUpdate = true;
  return { map, emissiveMap };
}

export function createArchitecturalSignTexture(opts: {
  header: string;
  line1: string;
  line2: string;
  bgHex: string;
  borderHex: string;
  fgHex: string;
  accentHex?: string;
  weathered?: boolean;
}): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 640;
  c.height = 360;
  const ctx = c.getContext("2d")!;

  ctx.fillStyle = opts.bgHex;
  ctx.fillRect(0, 0, 640, 360);

  ctx.strokeStyle = opts.borderHex;
  ctx.lineWidth = 12;
  ctx.strokeRect(16, 16, 608, 328);

  if (opts.accentHex) {
    ctx.fillStyle = opts.accentHex;
    ctx.fillRect(22, 22, 596, 72);
  }

  ctx.fillStyle = opts.accentHex ? "#FFFFFF" : opts.fgHex;
  ctx.font = `800 34px "Segoe UI", Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(opts.header, 320, 58, 560);

  ctx.fillStyle = opts.fgHex;
  ctx.font = `800 44px "Segoe UI", Arial, sans-serif`;
  ctx.fillText(opts.line1, 320, 174, 560);

  ctx.font = `700 32px "Segoe UI", Arial, sans-serif`;
  ctx.fillText(opts.line2, 320, 256, 560);

  if (opts.weathered) {
    // Faded sun-bleached patina & rust streaks from years of neglect!
    ctx.fillStyle = "rgba(128, 114, 96, 0.34)";
    ctx.fillRect(0, 0, 640, 360);
    ctx.fillStyle = "rgba(92, 68, 44, 0.28)";
    ctx.fillRect(42, 22, 16, 210);
    ctx.fillRect(540, 120, 22, 220);
    ctx.beginPath();
    ctx.arc(165, 290, 68, 0, Math.PI * 2);
    ctx.arc(495, 92, 54, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function createSunGlowSpriteTexture(hex = "#FFD088"): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  const col = new THREE.Color(hex);
  const r = Math.round(col.r * 255);
  const g = Math.round(col.g * 255);
  const b = Math.round(col.b * 255);
  const grad = ctx.createRadialGradient(128, 128, 4, 128, 128, 126);
  grad.addColorStop(0, `rgba(${r},${g},${b},0.92)`);
  grad.addColorStop(0.32, `rgba(${r},${g},${b},0.38)`);
  grad.addColorStop(0.70, `rgba(${r},${g},${b},0.09)`);
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}
