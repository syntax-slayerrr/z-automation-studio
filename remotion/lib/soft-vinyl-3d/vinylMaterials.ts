import * as THREE from "three";

/**
 * Reusable 3D Soft-Vinyl / Toy-Clay PBR Material & Procedural Texture Factory
 * Built for Skill #12: `galeri-motion-characterflow`
 * Reverse-engineered from `galeri-motion-characterflow.mp4` ("Jam 2 Pagi"):
 *
 *  - ZERO black ink outlines, ZERO gouache brushstroke bump!
 *  - Smooth tactile satin Soft-Vinyl skin (`clearcoat`, radial warm cheek blush)
 *  - Glossy sculpted dark hair (`roughness: 0.22`, `clearcoat: 0.38`) catching dramatic rim lights
 *  - Matte clay-cotton textiles & star-patterned pastel bedding
 *  - Translucent frosted glass thought-bubble orbs (cyan calm <-> crimson anxiety!)
 *  - Additive soft radial volumetric lamp glow sprite (100% ANGLE-safe, ZERO EffectComposer!)
 *  - Dynamic Live-Writing Ruled Notebook Canvas2D Texture for First-Person Macro POV!
 */

export function createVinylSkinMaterial(
  baseHex = "#C98B64",
  withBlush = false
): THREE.MeshPhysicalMaterial {
  let map: THREE.CanvasTexture | null = null;
  if (withBlush) {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, 512, 512);

    // Soft radial rose-peach cheek blush positioned cleanly for front face hemisphere (u~0.25)
    for (const cx of [102, 154]) {
      const g = ctx.createRadialGradient(cx, 286, 4, cx, 286, 26);
      g.addColorStop(0, "rgba(235, 108, 102, 0.34)");
      g.addColorStop(1, "rgba(235, 108, 102, 0.0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, 286, 28, 0, Math.PI * 2);
      ctx.fill();
    }
    map = new THREE.CanvasTexture(c);
    map.colorSpace = THREE.SRGBColorSpace;
    map.needsUpdate = true;
  }

  return new THREE.MeshPhysicalMaterial({
    color: withBlush ? "#FFFFFF" : baseHex,
    map,
    roughness: 0.42,
    metalness: 0.0,
    clearcoat: 0.14,
    clearcoatRoughness: 0.44,
  });
}

export function createGlossyHairMaterial(hex = "#2B1912"): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: hex,
    roughness: 0.30,
    metalness: 0.02,
    clearcoat: 0.28,
    clearcoatRoughness: 0.34,
  });
}

export function createMatteClayMaterial(hex: string): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: hex,
    roughness: 0.84,
    metalness: 0.0,
  });
}

export function createSatinWoodMaterial(hex = "#C89362"): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: hex,
    roughness: 0.54,
    metalness: 0.0,
  });
}

export function createGlossyEyeTexture(irisColor = "#4B2B1A"): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#F8FAFC";
  ctx.fillRect(0, 0, 256, 256);

  // SphereGeometry U=0.25 faces +Z; paint glossy iris & pupil cleanly centered at x=64, y=128
  const cx = 64;
  const cy = 128;
  ctx.fillStyle = irisColor;
  ctx.beginPath();
  ctx.arc(cx, cy, 34, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#0E0C0B";
  ctx.beginPath();
  ctx.arc(cx, cy, 19, 0, Math.PI * 2);
  ctx.fill();

  // Sharp bright white catchlight dot (exact Pixar vinyl doll sparkle!)
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(cx - 11, cy - 12, 8.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 9, cy + 8, 3.8, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function createStarBlanketTexture(
  bgHex = "#7BA7DC",
  starHex = "#FDE047"
): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, 512, 512);

  // Deterministic scattered warm tiny stars & dots (1:1 homage to galeri-motion-characterflow!)
  let seed = 4219;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  ctx.fillStyle = starHex;
  for (let i = 0; i < 68; i++) {
    const x = rand() * 512;
    const y = rand() * 512;
    const r = 3 + rand() * 5;
    ctx.globalAlpha = 0.65 + rand() * 0.3;
    ctx.beginPath();
    for (let k = 0; k < 5; k++) {
      const a1 = (k * 4 * Math.PI) / 5 - Math.PI / 2;
      const px = x + Math.cos(a1) * r;
      const py = y + Math.sin(a1) * r;
      if (k === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function createWallPosterTexture(): THREE.CanvasTexture {
  // Warm sunset geometric mountain poster (1:1 cozy bedroom wall accent!)
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 340;
  const ctx = c.getContext("2d")!;
  const grad = ctx.createLinearGradient(0, 0, 0, 340);
  grad.addColorStop(0, "#FB923C");
  grad.addColorStop(0.55, "#FDBA74");
  grad.addColorStop(1, "#312E81");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 340);

  // Sun disk
  ctx.fillStyle = "#FFF7ED";
  ctx.beginPath();
  ctx.arc(166, 108, 34, 0, Math.PI * 2);
  ctx.fill();

  // Layered pastel-navy mountain peaks
  ctx.fillStyle = "#3B3766";
  ctx.beginPath();
  ctx.moveTo(0, 340);
  ctx.lineTo(76, 180);
  ctx.lineTo(148, 255);
  ctx.lineTo(205, 162);
  ctx.lineTo(256, 250);
  ctx.lineTo(256, 340);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#1E1B4B";
  ctx.beginPath();
  ctx.moveTo(0, 340);
  ctx.lineTo(118, 215);
  ctx.lineTo(256, 340);
  ctx.closePath();
  ctx.fill();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * ANGLE-safe soft volumetric radial glow texture for warm tungsten bedside lamp & halos
 */
export function createSoftGlowTexture(hex = "#FFBE70"): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  const col = new THREE.Color(hex);
  const r = Math.round(col.r * 255);
  const g = Math.round(col.g * 255);
  const b = Math.round(col.b * 255);
  const grad = ctx.createRadialGradient(128, 128, 6, 128, 128, 126);
  grad.addColorStop(0, `rgba(${r},${g},${b},0.85)`);
  grad.addColorStop(0.35, `rgba(${r},${g},${b},0.34)`);
  grad.addColorStop(0.75, `rgba(${r},${g},${b},0.08)`);
  grad.addColorStop(1, `rgba(${r},${g},${b},0.0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Translucent Frosted Glass 3D Thought-Bubble Texture (Calm Cyan OR Crimson Alert!)
 */
export function createThoughtBubbleTexture(opts: {
  icon?: string;
  label?: string;
  sublabel?: string;
  mood: "calm" | "crimson" | "gold";
  dashedRim?: boolean;
}): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, 512, 512);

  const rimColor =
    opts.mood === "crimson" ? "#F43F5E" : opts.mood === "gold" ? "#F59E0B" : "#7DD3FC";
  const fillInner =
    opts.mood === "crimson"
      ? "rgba(255, 241, 242, 0.88)"
      : opts.mood === "gold"
        ? "rgba(255, 251, 235, 0.90)"
        : "rgba(241, 248, 255, 0.86)";
  const fgColor =
    opts.mood === "crimson" ? "#DC2626" : opts.mood === "gold" ? "#B45309" : "#334155";

  // Soft frosted circle body
  const g = ctx.createRadialGradient(256, 224, 30, 256, 256, 228);
  g.addColorStop(0, "rgba(255,255,255,0.96)");
  g.addColorStop(0.75, fillInner);
  g.addColorStop(1, "rgba(255,255,255,0.68)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(256, 256, 224, 0, Math.PI * 2);
  ctx.fill();

  // Crisp glowing colored ring rim
  ctx.strokeStyle = rimColor;
  ctx.lineWidth = 14;
  if (opts.dashedRim) ctx.setLineDash([28, 16]);
  ctx.beginPath();
  ctx.arc(256, 256, 218, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Optional clean minimalist icon + crisp label inside bubble
  if (opts.icon) {
    ctx.fillStyle = fgColor;
    ctx.font = `700 ${opts.label ? 128 : 185}px "Segoe UI Emoji", "Segoe UI", Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(opts.icon, 256, opts.label ? 185 : 260);
  }
  if (opts.label) {
    ctx.fillStyle = fgColor;
    ctx.font = `800 44px "Segoe UI", "Trebuchet MS", Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(opts.label, 256, opts.icon ? 318 : 235, 368);
  }
  if (opts.sublabel) {
    ctx.fillStyle = opts.mood === "crimson" ? "#991B1B" : "#475569";
    ctx.font = `700 30px "Segoe UI", Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(opts.sublabel, 256, 372, 360);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Dynamic Live-Handwriting Ruled Notebook Page Controller (Macro First-Person POV!)
 * Draws lines cleanly character-by-character and returns exact normalized tip (u, v) for zero-clip pen tracking!
 */
export interface LiveNotebookSurface {
  texture: THREE.CanvasTexture;
  updateWriting: (headerDate: string, lines: string[], progress01: number) => { tipU: number; tipV: number };
}

export function createLiveNotebookSurface(): LiveNotebookSurface {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 640;
  const ctx = c.getContext("2d")!;
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;

  let lastKey = "";
  const updateWriting = (headerDate: string, lines: string[], progress01: number) => {
    const p = Math.max(0, Math.min(1, progress01));
    const totalChars = lines.reduce((acc, s) => acc + s.length, 0);
    const visibleChars = Math.floor(p * totalChars);
    const key = `${headerDate}_${visibleChars}_${lines.length}`;

    let tipX = 76;
    let tipY = 178;

    if (key !== lastKey) {
      lastKey = key;
      // Clean warm white notebook paper
      ctx.fillStyle = "#FCFBF7";
      ctx.fillRect(0, 0, 512, 640);

      // Subtle red left margin line
      ctx.strokeStyle = "rgba(239, 68, 68, 0.35)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(62, 0);
      ctx.lineTo(62, 640);
      ctx.stroke();

      // Clean blue ruled horizontal lines
      ctx.strokeStyle = "rgba(148, 163, 184, 0.45)";
      ctx.lineWidth = 2;
      for (let y = 136; y <= 580; y += 54) {
        ctx.beginPath();
        ctx.moveTo(28, y);
        ctx.lineTo(484, y);
        ctx.stroke();
      }

      // Top-right date stamp ("Catatan Warga · Kelompok 3")
      ctx.fillStyle = "#64748B";
      ctx.font = `600 22px "Segoe UI", Arial, sans-serif`;
      ctx.textAlign = "right";
      ctx.fillText(headerDate, 470, 74);

      // Handwritten blue ink lines revealed cleanly character-by-character!
      ctx.fillStyle = "#1D4ED8";
      ctx.font = `italic 700 31px "Segoe Print", "Comic Sans MS", "Segoe UI", cursive`;
      ctx.textAlign = "left";
      let left = visibleChars;
      for (let i = 0; i < lines.length; i++) {
        const ly = 180 + i * 54;
        const full = lines[i];
        if (left <= 0) break;
        const sub = full.slice(0, Math.min(full.length, left));
        ctx.fillText(sub, 76, ly, 404);
        const w = Math.min(404, ctx.measureText(sub).width);
        tipX = 76 + w;
        tipY = ly;
        left -= full.length;
      }

      texture.needsUpdate = true;
    } else {
      // Compute tip position quickly without redraw
      let left = visibleChars;
      for (let i = 0; i < lines.length; i++) {
        const ly = 180 + i * 54;
        const full = lines[i];
        if (left <= 0) break;
        const sub = full.slice(0, Math.min(full.length, left));
        ctx.font = `italic 700 31px "Segoe Print", "Comic Sans MS", "Segoe UI", cursive`;
        tipX = 76 + Math.min(404, ctx.measureText(sub).width);
        tipY = ly;
        left -= full.length;
      }
    }

    return { tipU: tipX / 512, tipV: 1 - tipY / 640 };
  };

  updateWriting("Catatan Warga", ["1. Awasi anggaran"], 0);
  return { texture, updateWriting };
}
