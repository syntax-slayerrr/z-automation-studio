import * as THREE from "three";

function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export interface PBRTriplet {
  map: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
}

function buildNormalAndRoughness(
  heightCanvas: HTMLCanvasElement,
  normalStrength: number,
  minRough: number,
  maxRough: number,
  wrapS: THREE.Wrapping = THREE.RepeatWrapping,
  wrapT: THREE.Wrapping = THREE.RepeatWrapping,
  repeatX = 1,
  repeatY = 1
): { normalMap: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture } {
  const w = heightCanvas.width;
  const h = heightCanvas.height;
  const hCtx = heightCanvas.getContext("2d")!;
  const src = hCtx.getImageData(0, 0, w, h).data;

  const nCanvas = document.createElement("canvas");
  nCanvas.width = w;
  nCanvas.height = h;
  const nCtx = nCanvas.getContext("2d")!;
  const nImg = nCtx.createImageData(w, h);
  const nd = nImg.data;

  const rCanvas = document.createElement("canvas");
  rCanvas.width = w;
  rCanvas.height = h;
  const rCtx = rCanvas.getContext("2d")!;
  const rImg = rCtx.createImageData(w, h);
  const rd = rImg.data;

  const sampleH = (x: number, y: number): number => {
    const cx = ((x % w) + w) % w;
    const cy = ((y % h) + h) % h;
    return src[(cy * w + cx) * 4] / 255;
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const tl = sampleH(x - 1, y - 1);
      const t = sampleH(x, y - 1);
      const tr = sampleH(x + 1, y - 1);
      const l = sampleH(x - 1, y);
      const c = sampleH(x, y);
      const r = sampleH(x + 1, y);
      const bl = sampleH(x - 1, y + 1);
      const b = sampleH(x, y + 1);
      const br = sampleH(x + 1, y + 1);

      const dx = (tr + 2 * r + br - (tl + 2 * l + bl)) * normalStrength;
      const dy = (bl + 2 * b + br - (tl + 2 * t + tr)) * normalStrength;
      const dz = 1.0;
      const invLen = 1.0 / Math.hypot(dx, dy, dz);

      const idx = (y * w + x) * 4;
      nd[idx] = Math.round(((-dx * invLen) * 0.5 + 0.5) * 255);
      nd[idx + 1] = Math.round(((-dy * invLen) * 0.5 + 0.5) * 255);
      nd[idx + 2] = Math.round(((dz * invLen) * 0.5 + 0.5) * 255);
      nd[idx + 3] = 255;

      const roughVal = Math.round((maxRough - c * (maxRough - minRough)) * 255);
      rd[idx] = roughVal;
      rd[idx + 1] = roughVal;
      rd[idx + 2] = roughVal;
      rd[idx + 3] = 255;
    }
  }

  nCtx.putImageData(nImg, 0, 0);
  rCtx.putImageData(rImg, 0, 0);

  const normalMap = new THREE.CanvasTexture(nCanvas);
  normalMap.colorSpace = THREE.NoColorSpace;
  normalMap.wrapS = wrapS;
  normalMap.wrapT = wrapT;
  normalMap.repeat.set(repeatX, repeatY);

  const roughnessMap = new THREE.CanvasTexture(rCanvas);
  roughnessMap.colorSpace = THREE.NoColorSpace;
  roughnessMap.wrapS = wrapS;
  roughnessMap.wrapT = wrapT;
  roughnessMap.repeat.set(repeatX, repeatY);

  return { normalMap, roughnessMap };
}

/**
 * 1. Rich Indonesian Volcanic Mountain Soil Cutaway PBR Triplet (1:1 Square UV!)
 *    - Fertile dark humus topsoil -> warm volcanic clay loam -> ochre subsoil -> deep fractured andesite bedrock
 *    - Delicate thin warm tan-brown capillary roots (ZERO thick white spiderwebs!)
 *    - Small natural matte volcanic pebbles
 */
export function createVolcanicSoilPBR(): PBRTriplet {
  const size = 1024;
  const albedo = document.createElement("canvas");
  albedo.width = size;
  albedo.height = size;
  const ctx = albedo.getContext("2d")!;

  const height = document.createElement("canvas");
  height.width = size;
  height.height = size;
  const hctx = height.getContext("2d")!;
  const rand = seededRandom(823);

  const grad = ctx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0.0, "#3F2817"); // Rich dark volcanic humus topsoil
  grad.addColorStop(0.22, "#6B4326"); // Moist organic root horizon
  grad.addColorStop(0.46, "#A66537"); // Warm sunlit terracotta volcanic loam
  grad.addColorStop(0.74, "#8E522B"); // Dense mountain clay subsoil
  grad.addColorStop(1.0, "#544136"); // Deep weathered andesite bedrock
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  hctx.fillStyle = "#808080";
  hctx.fillRect(0, 0, size, size);

  // Soft painterly cloud-like geological strata mottling (horizontally tileable!)
  for (let i = 0; i < 380; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 36 + rand() * 98;
    const bright = rand() > 0.48;
    const df = y / size;
    for (const ox of [-size, 0, size]) {
      const gx = x + ox;
      if (gx + r < 0 || gx - r > size) continue;
      const ag = ctx.createRadialGradient(gx, y, 2, gx, y, r);
      if (df < 0.28) {
        ag.addColorStop(0, bright ? "rgba(128, 84, 52, 0.16)" : "rgba(32, 17, 9, 0.22)");
      } else if (df < 0.72) {
        ag.addColorStop(0, bright ? "rgba(218, 148, 92, 0.16)" : "rgba(96, 48, 22, 0.17)");
      } else {
        ag.addColorStop(0, bright ? "rgba(125, 108, 94, 0.18)" : "rgba(44, 34, 28, 0.22)");
      }
      ag.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = ag;
      ctx.beginPath();
      ctx.arc(gx, y, r, 0, Math.PI * 2);
      ctx.fill();

      const hg = hctx.createRadialGradient(gx, y, 2, gx, y, r);
      hg.addColorStop(0, bright ? "rgba(195,195,195,0.14)" : "rgba(55,55,55,0.14)");
      hg.addColorStop(1, "rgba(128,128,128,0)");
      hctx.fillStyle = hg;
      hctx.beginPath();
      hctx.arc(gx, y, r, 0, Math.PI * 2);
      hctx.fill();
    }
  }

  // Subtle fine volcanic soil sand texture
  for (let i = 0; i < 11000; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 0.8 + rand() * 1.4;
    ctx.fillStyle = rand() > 0.5 ? "rgba(32, 16, 8, 0.12)" : "rgba(232, 182, 128, 0.09)";
    ctx.fillRect(x, y, r, r);
  }

  // Delicate organic warm tan-brown capillary roots in upper humus horizon
  const drawRoot = (sx0: number, sy0: number, len: number, ang: number, thick: number, dep: number) => {
    if (dep <= 0 || len < 14 || sy0 > size * 0.42) return;
    let cx = sx0;
    let cy = sy0;
    let a = ang;
    let w = thick;
    const steps = Math.max(4, Math.floor(len / 7));
    for (let s = 0; s < steps; s++) {
      const nx = cx + Math.sin(a) * 7;
      const ny = cy + Math.cos(a) * 7;
      if (ny > size * 0.46) break;
      const fade = Math.max(0, 1 - ny / (size * 0.46));
      const alpha = (0.36 + 0.4 * fade) * (dep >= 2 ? 1 : 0.78);
      for (const ox of [-size, 0, size]) {
        const sx = cx + ox;
        const ex = nx + ox;
        if ((sx < 0 && ex < 0) || (sx > size && ex > size)) continue;
        ctx.strokeStyle = `rgba(30, 15, 7, ${alpha * 0.52})`;
        ctx.lineWidth = Math.max(1.1, w + 1.0);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(sx + 1, cy + 1.2);
        ctx.lineTo(ex + 1, ny + 1.2);
        ctx.stroke();

        ctx.strokeStyle = `rgba(188, 154, 114, ${alpha})`;
        ctx.lineWidth = Math.max(0.7, w);
        ctx.beginPath();
        ctx.moveTo(sx, cy);
        ctx.lineTo(ex, ny);
        ctx.stroke();

        hctx.strokeStyle = `rgba(210, 210, 210, ${alpha * 0.6})`;
        hctx.lineWidth = Math.max(0.9, w);
        hctx.beginPath();
        hctx.moveTo(sx, cy);
        hctx.lineTo(ex, ny);
        hctx.stroke();
      }
      cx = nx;
      cy = ny;
      a += (rand() - 0.5) * 0.48;
      w *= 0.935;
      if (dep > 1 && w > 0.85 && rand() > 0.76) {
        drawRoot(cx, cy, len * 0.55, a + (rand() > 0.5 ? 0.58 : -0.58), w * 0.72, dep - 1);
      }
    }
  };

  for (let i = 0; i < 24; i++) {
    drawRoot((i / 24) * size + (rand() - 0.5) * 24, 6, 130 + rand() * 175, (rand() - 0.5) * 0.45, 2.2, 3);
  }

  // Natural matte volcanic andesite & river pebbles embedded in lower subsoil
  for (let i = 0; i < 82; i++) {
    const px = rand() * size;
    const py = 160 + rand() * (size - 180);
    const prx = 3.5 + rand() * 7.2;
    const pry = prx * (0.58 + rand() * 0.32);
    const rot = rand() * Math.PI;
    const isDeepRock = py > size * 0.72;
    for (const ox of [-size, 0, size]) {
      const gx = px + ox;
      if (gx + prx < 0 || gx - prx > size) continue;
      ctx.save();
      ctx.translate(gx, py);
      ctx.rotate(rot);
      ctx.fillStyle = "rgba(32, 16, 8, 0.38)";
      ctx.beginPath();
      ctx.ellipse(1.0, 1.5, prx + 0.8, pry + 0.8, 0, 0, Math.PI * 2);
      ctx.fill();

      const pg = ctx.createRadialGradient(-prx * 0.25, -pry * 0.25, 0.5, 0, 0, prx);
      if (isDeepRock) {
        pg.addColorStop(0, "#7D736B");
        pg.addColorStop(0.65, "#5E554F");
        pg.addColorStop(1, "#3F3834");
      } else {
        pg.addColorStop(0, "#9E8770");
        pg.addColorStop(0.65, "#7B6551");
        pg.addColorStop(1, "#544335");
      }
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.ellipse(0, 0, prx, pry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  const map = new THREE.CanvasTexture(albedo);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.ClampToEdgeWrapping;
  map.repeat.set(3.2, 1);

  const { normalMap, roughnessMap } = buildNormalAndRoughness(
    height,
    1.25,
    0.82,
    0.97,
    THREE.RepeatWrapping,
    THREE.ClampToEdgeWrapping,
    3.2,
    1
  );

  return { map, normalMap, roughnessMap };
}

/**
 * 2. Wet Mud / Compacted Pematang Surface PBR Triplet (blends lush grassy slope -> rich dark mud!)
 */
export function createHillSurfacePBR(): PBRTriplet {
  const size = 512;
  const albedo = document.createElement("canvas");
  albedo.width = size;
  albedo.height = size;
  const ctx = albedo.getContext("2d")!;
  const height = document.createElement("canvas");
  height.width = size;
  height.height = size;
  const hctx = height.getContext("2d")!;
  const rand = seededRandom(517);

  // High-luminance neutral warm base so material color tint stays vibrant & sunlit (NEVER near-black!)
  ctx.fillStyle = "#D6CEBE";
  ctx.fillRect(0, 0, size, size);
  hctx.fillStyle = "#808080";
  hctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 240; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 16 + rand() * 48;
    const isLight = rand() > 0.52;
    for (const ox of [-size, 0, size]) {
      for (const oy of [-size, 0, size]) {
        const gx = x + ox;
        const gy = y + oy;
        if (gx + r < 0 || gx - r > size || gy + r < 0 || gy - r > size) continue;
        const g = ctx.createRadialGradient(gx, gy, 2, gx, gy, r);
        g.addColorStop(
          0,
          isLight ? "rgba(248, 244, 232, 0.26)" : "rgba(148, 132, 110, 0.24)"
        );
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(gx, gy, r, 0, Math.PI * 2);
        ctx.fill();

        const hg = hctx.createRadialGradient(gx, gy, 2, gx, gy, r);
        hg.addColorStop(0, isLight ? "rgba(210,210,210,0.22)" : "rgba(65,65,65,0.22)");
        hg.addColorStop(1, "rgba(128,128,128,0)");
        hctx.fillStyle = hg;
        hctx.beginPath();
        hctx.arc(gx, gy, r, 0, Math.PI * 2);
        hctx.fill();
      }
    }
  }

  const map = new THREE.CanvasTexture(albedo);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(4, 3);

  const { normalMap, roughnessMap } = buildNormalAndRoughness(
    height,
    1.5,
    0.72,
    0.94,
    THREE.RepeatWrapping,
    THREE.RepeatWrapping,
    4,
    3
  );

  return { map, normalMap, roughnessMap };
}

/**
 * 3. Warm Sunlit Birch Wood Grain PBR Texture for Sculpted IK Mannequin Limbs & Head
 *    Adds subtle satin grain so character blends physically with Blender diorama world!
 */
export function createBirchWoodPBR(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  const rand = seededRandom(401);

  ctx.fillStyle = "#E6AE80";
  ctx.fillRect(0, 0, 256, 256);

  // Subtle vertical warm birch grain fibers
  for (let x = 0; x < 256; x += 2) {
    ctx.strokeStyle =
      rand() > 0.5 ? "rgba(186, 124, 78, 0.14)" : "rgba(255, 224, 192, 0.12)";
    ctx.lineWidth = 1 + rand() * 1.2;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.bezierCurveTo(x + (rand() - 0.5) * 4, 85, x + (rand() - 0.5) * 4, 170, x, 256);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/**
 * 4. Baked Crevice-AO Cotton T-Shirt Texture (warm sunlit terracotta-orange with collar & waist AO shading!)
 */
export function createShirtFabricTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  const rand = seededRandom(402);

  // Base warm sunlit orange-ochre shirt with baked vertical AO (subtle darkening under collar & lower waist hem)
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0.0, "#D46E24"); // Baked collar shadow AO
  g.addColorStop(0.14, "#F58F38"); // Sunlit chest
  g.addColorStop(0.74, "#EA812E"); // Mid torso
  g.addColorStop(0.92, "#C96520"); // Waist tuck crease AO
  g.addColorStop(1.0, "#B45618");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);

  // Fine cotton weave grain
  for (let i = 0; i < 2400; i++) {
    const x = rand() * 256;
    const y = rand() * 256;
    ctx.fillStyle = rand() > 0.5 ? "rgba(255,235,205,0.06)" : "rgba(85,35,10,0.07)";
    ctx.fillRect(x, y, 2, 1);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * 5. Woven Bamboo Caping Hat Texture with Subtle Radial Weave & Rim Binding
 */
export function createCapingWeavePBR(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d")!;

  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0.0, "#EBDDB8");
  g.addColorStop(0.85, "#F6EED4");
  g.addColorStop(0.95, "#D9C392"); // Subtle natural woven rim edge
  g.addColorStop(1.0, "#BFA674");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = "rgba(150, 120, 72, 0.28)";
  ctx.lineWidth = 1.5;
  for (let y = 0; y < 256; y += 7) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(135, 105, 58, 0.22)";
  for (let x = 0; x < 256; x += 6) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

/**
 * 6. Natural Wooden Table / Experiment Board Grain Texture
 */
export function createWoodBoardTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  const rand = seededRandom(555);

  ctx.fillStyle = "#CFA470";
  ctx.fillRect(0, 0, 512, 256);

  for (let y = 0; y < 256; y += 2.5) {
    ctx.strokeStyle =
      rand() > 0.5 ? "rgba(148, 102, 54, 0.22)" : "rgba(244, 214, 174, 0.18)";
    ctx.lineWidth = 1 + rand() * 1.8;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(170, y + (rand() - 0.5) * 6, 340, y + (rand() - 0.5) * 6, 512, y);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/**
 * 7. Radial Contact AO Shadow Decal Texture
 */
export function createContactShadowTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 60);
  g.addColorStop(0.0, "rgba(28, 18, 10, 0.68)");
  g.addColorStop(0.45, "rgba(28, 18, 10, 0.34)");
  g.addColorStop(0.85, "rgba(28, 18, 10, 0.08)");
  g.addColorStop(1.0, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * 8. Soft Additive Glow Sprite Texture (Water infiltration energy / sunrise lens bloom)
 */
export function createSoftGlowTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 2, 64, 64, 62);
  g.addColorStop(0.0, "rgba(255, 255, 255, 1.0)");
  g.addColorStop(0.28, "rgba(130, 224, 255, 0.85)");
  g.addColorStop(0.58, "rgba(52, 178, 255, 0.36)");
  g.addColorStop(1.0, "rgba(20, 130, 230, 0.0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
