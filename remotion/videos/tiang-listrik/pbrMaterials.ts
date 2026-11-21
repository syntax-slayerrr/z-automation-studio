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

/**
 * 3x3 Sobel Height-to-Normal + Linear Roughness Map generator
 */
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
 * 1. 1:1 Reference-Matched Geological Soil Cutaway PBR Triplet (shot_001.jpg, shot_008.jpg, shot_013.jpg)
 *    - Painterly soft cloud-mottled warm gradient: dark humus topsoil -> warm ochre-terracotta subsoil
 *    - Delicate organic warm tan-brown capillary roots (NEVER bright white spaghetti!)
 *    - Small subtle matte beige/cream pebbles (NEVER huge metallic concave bowls!)
 *    - Aspect-correct repeat(5, 1) on 26m x 4.6m cutaway plane
 */
export function createSoilPBR(): PBRTriplet {
  const size = 1024;
  const albedo = document.createElement("canvas");
  albedo.width = size;
  albedo.height = size;
  const ctx = albedo.getContext("2d")!;

  const height = document.createElement("canvas");
  height.width = size;
  height.height = size;
  const hctx = height.getContext("2d")!;
  const rand = seededRandom(917);

  // Smooth warm 5-stop Blender soil strata gradient
  const grad = ctx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0.0, "#4B311E"); // Deep dark humus topsoil
  grad.addColorStop(0.22, "#6E4629"); // Warm dark brown root zone
  grad.addColorStop(0.45, "#B06D3C"); // Sunlit golden-ochre loam
  grad.addColorStop(0.72, "#BF7642"); // Warm terracotta clay
  grad.addColorStop(1.0, "#8B4624"); // Deep warm sienna subsoil
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  hctx.fillStyle = "#808080";
  hctx.fillRect(0, 0, size, size);

  // Soft painterly cloud-like soil variation (large low-opacity blends, zero polka dots!)
  for (let i = 0; i < 360; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 38 + rand() * 96;
    const bright = rand() > 0.48;
    const depthFrac = y / size;
    for (const ox of [-size, 0, size]) {
      const gx = x + ox;
      if (gx + r < 0 || gx - r > size) continue;
      const ag = ctx.createRadialGradient(gx, y, 2, gx, y, r);
      if (depthFrac < 0.28) {
        ag.addColorStop(0, bright ? "rgba(138, 92, 56, 0.16)" : "rgba(42, 23, 12, 0.20)");
      } else if (depthFrac < 0.72) {
        ag.addColorStop(0, bright ? "rgba(226, 158, 96, 0.17)" : "rgba(116, 60, 28, 0.16)");
      } else {
        ag.addColorStop(0, bright ? "rgba(195, 118, 66, 0.16)" : "rgba(78, 34, 16, 0.20)");
      }
      ag.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = ag;
      ctx.beginPath();
      ctx.arc(gx, y, r, 0, Math.PI * 2);
      ctx.fill();

      const hg = hctx.createRadialGradient(gx, y, 2, gx, y, r);
      hg.addColorStop(0, bright ? "rgba(200,200,200,0.14)" : "rgba(55,55,55,0.14)");
      hg.addColorStop(1, "rgba(128,128,128,0)");
      hctx.fillStyle = hg;
      hctx.beginPath();
      hctx.arc(gx, y, r, 0, Math.PI * 2);
      hctx.fill();
    }
  }

  // Subtle fine natural soil grain (very low opacity so it reads smooth & tactile)
  for (let i = 0; i < 12000; i++) {
    const x = rand() * size;
    const y = 8 + rand() * (size - 8);
    const r = 0.7 + rand() * 1.4;
    const isDark = rand() > 0.5;
    ctx.fillStyle = isDark ? "rgba(38, 18, 8, 0.12)" : "rgba(235, 185, 130, 0.10)";
    ctx.fillRect(x, y, r, r);
  }

  // Subtle dark ambient shadow lip along very top edge where yard plane meets soil cutaway
  const rimShadow = ctx.createLinearGradient(0, 0, 0, 36);
  rimShadow.addColorStop(0.0, "rgba(28, 16, 8, 0.48)");
  rimShadow.addColorStop(0.5, "rgba(28, 16, 8, 0.18)");
  rimShadow.addColorStop(1.0, "rgba(28, 16, 8, 0.0)");
  ctx.fillStyle = rimShadow;
  ctx.fillRect(0, 0, size, 36);

  // Delicate, thin warm tan-brown organic roots (matching shot_001.jpg & shot_013.jpg 1:1!)
  // Concentrated naturally in the top 38% humus zone, tapering cleanly to hairline wisps.
  const drawRoot = (
    startX: number,
    startY: number,
    len: number,
    angle: number,
    thick: number,
    depth: number
  ) => {
    if (depth <= 0 || len < 14 || startY > size * 0.44) return;
    let cx = startX;
    let cy = startY;
    let a = angle;
    let w = thick;
    const steps = Math.max(4, Math.floor(len / 7));
    for (let s = 0; s < steps; s++) {
      const nx = cx + Math.sin(a) * 7;
      const ny = cy + Math.cos(a) * 7;
      if (ny > size * 0.48) break;

      const fade = Math.max(0, 1 - ny / (size * 0.48));
      const rootAlpha = (0.38 + 0.42 * fade) * (depth >= 2 ? 1.0 : 0.78);

      for (const ox of [-size, 0, size]) {
        const sx = cx + ox;
        const ex = nx + ox;
        if ((sx < 0 && ex < 0) || (sx > size && ex > size)) continue;

        // Soft dark recess shadow behind root
        ctx.strokeStyle = `rgba(34, 18, 9, ${rootAlpha * 0.55})`;
        ctx.lineWidth = Math.max(1.2, w + 1.1);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(sx + 1.0, cy + 1.2);
        ctx.lineTo(ex + 1.0, ny + 1.2);
        ctx.stroke();

        // Warm tan-ochre root filament (NOT bright white!)
        ctx.strokeStyle =
          depth >= 3
            ? `rgba(196, 162, 122, ${rootAlpha})`
            : `rgba(174, 138, 100, ${rootAlpha * 0.88})`;
        ctx.lineWidth = Math.max(0.75, w);
        ctx.beginPath();
        ctx.moveTo(sx, cy);
        ctx.lineTo(ex, ny);
        ctx.stroke();

        // Subtle bump on height map
        hctx.strokeStyle = `rgba(215, 215, 215, ${rootAlpha * 0.65})`;
        hctx.lineWidth = Math.max(1.0, w);
        hctx.beginPath();
        hctx.moveTo(sx, cy);
        hctx.lineTo(ex, ny);
        hctx.stroke();
      }

      cx = nx;
      cy = ny;
      a += (rand() - 0.5) * 0.46;
      w *= 0.935;

      if (depth > 1 && w > 0.85 && rand() > 0.76) {
        drawRoot(
          cx,
          cy,
          len * (0.45 + rand() * 0.2),
          a + (rand() > 0.5 ? 0.55 : -0.55),
          w * 0.72,
          depth - 1
        );
      }
    }
  };

  // 26 natural root starts along the surface edge
  for (let i = 0; i < 26; i++) {
    const rx = (i / 26) * size + (rand() - 0.5) * 26;
    drawRoot(rx, 4, 140 + rand() * 190, (rand() - 0.5) * 0.45, 2.35, 3);
  }

  // Subtle matte natural beige/cream pebbles embedded gently in subsoil (small, never huge glossy bowls!)
  const numPebbles = 78;
  for (let i = 0; i < numPebbles; i++) {
    const px = rand() * size;
    const py = 120 + rand() * (size - 140);
    const prx = 3.2 + rand() * 5.8;
    const pry = prx * (0.58 + rand() * 0.3);
    const rot = rand() * Math.PI;

    for (const ox of [-size, 0, size]) {
      const gx = px + ox;
      if (gx + prx < 0 || gx - prx > size) continue;

      ctx.save();
      ctx.translate(gx, py);
      ctx.rotate(rot);

      // Soft warm contact shadow
      ctx.fillStyle = "rgba(42, 20, 10, 0.36)";
      ctx.beginPath();
      ctx.ellipse(1.0, 1.5, prx + 0.8, pry + 0.8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Matte softly-lit stone pebble
      const pg = ctx.createRadialGradient(-prx * 0.25, -pry * 0.25, 0.5, 0, 0, prx);
      const tone = i % 3;
      if (tone === 0) {
        pg.addColorStop(0, "#EDE6DA");
        pg.addColorStop(0.65, "#CFC3B0");
        pg.addColorStop(1, "#9B8A76");
      } else if (tone === 1) {
        pg.addColorStop(0, "#DFD4C4");
        pg.addColorStop(0.65, "#B7A692");
        pg.addColorStop(1, "#826F5C");
      } else {
        pg.addColorStop(0, "#CBBBA7");
        pg.addColorStop(0.65, "#9A8772");
        pg.addColorStop(1, "#6C5B49");
      }
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.ellipse(0, 0, prx, pry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      hctx.save();
      hctx.translate(gx, py);
      hctx.rotate(rot);
      const hg = hctx.createRadialGradient(-prx * 0.2, -pry * 0.2, 0.5, 0, 0, prx);
      hg.addColorStop(0, "#CCCCCC");
      hg.addColorStop(1, "#707070");
      hctx.fillStyle = hg;
      hctx.beginPath();
      hctx.ellipse(0, 0, prx, pry, 0, 0, Math.PI * 2);
      hctx.fill();
      hctx.restore();
    }
  }

  const map = new THREE.CanvasTexture(albedo);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.ClampToEdgeWrapping;
  map.repeat.set(5, 1);

  const { normalMap, roughnessMap } = buildNormalAndRoughness(
    height,
    1.15,
    0.82,
    0.97,
    THREE.RepeatWrapping,
    THREE.ClampToEdgeWrapping,
    5,
    1
  );

  return { map, normalMap, roughnessMap };
}

/**
 * 2. Smooth Sunlit Warm Sandy-Loam Village Yard PBR Triplet (ZERO harsh dark gravel dots!)
 */
export function createGroundYardPBR(): PBRTriplet {
  const size = 512;
  const albedo = document.createElement("canvas");
  albedo.width = size;
  albedo.height = size;
  const ctx = albedo.getContext("2d")!;

  const height = document.createElement("canvas");
  height.width = size;
  height.height = size;
  const hctx = height.getContext("2d")!;
  const rand = seededRandom(204);

  // Warm pale cream-sand yard matching shot_001.jpg & shot_029.jpg
  ctx.fillStyle = "#DFCCA9";
  ctx.fillRect(0, 0, size, size);
  hctx.fillStyle = "#808080";
  hctx.fillRect(0, 0, size, size);

  // Soft wide organic sand & earth patches
  for (let i = 0; i < 160; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 24 + rand() * 64;
    const bright = rand() > 0.45;
    for (const ox of [-size, 0, size]) {
      for (const oy of [-size, 0, size]) {
        const gx = x + ox;
        const gy = y + oy;
        if (gx + r < 0 || gx - r > size || gy + r < 0 || gy - r > size) continue;
        const g = ctx.createRadialGradient(gx, gy, 2, gx, gy, r);
        g.addColorStop(0, bright ? "rgba(246, 235, 214, 0.22)" : "rgba(182, 154, 118, 0.20)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(gx, gy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Very subtle fine sand micro-grain
  for (let i = 0; i < 3200; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 0.8 + rand() * 1.2;
    ctx.fillStyle = rand() > 0.5 ? "rgba(140, 114, 84, 0.12)" : "rgba(252, 245, 230, 0.14)";
    ctx.fillRect(x, y, r, r);
    hctx.fillStyle = rand() > 0.5 ? "#727272" : "#929292";
    hctx.fillRect(x, y, r, r);
  }

  const map = new THREE.CanvasTexture(albedo);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(5, 2.5);

  const { normalMap, roughnessMap } = buildNormalAndRoughness(
    height,
    0.8,
    0.88,
    0.98,
    THREE.RepeatWrapping,
    THREE.RepeatWrapping,
    5,
    2.5
  );

  return { map, normalMap, roughnessMap };
}

/**
 * 3. Rich Painterly Dappled Tropical Foliage PBR Triplet
 */
export function createFoliagePBR(): PBRTriplet {
  const size = 256;
  const albedo = document.createElement("canvas");
  albedo.width = size;
  albedo.height = size;
  const ctx = albedo.getContext("2d")!;

  const height = document.createElement("canvas");
  height.width = size;
  height.height = size;
  const hctx = height.getContext("2d")!;
  const rand = seededRandom(419);

  ctx.fillStyle = "#3E6B24";
  ctx.fillRect(0, 0, size, size);
  hctx.fillStyle = "#808080";
  hctx.fillRect(0, 0, size, size);

  // Soft mossy organic foliage flecks (deep forest olive + warm leaf highlights)
  for (let i = 0; i < 620; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const rx = 3 + rand() * 7;
    const ry = rx * (0.5 + rand() * 0.35);
    const rot = rand() * Math.PI;
    const isBright = rand() > 0.52;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = isBright ? "rgba(104, 165, 52, 0.45)" : "rgba(26, 56, 16, 0.48)";
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    hctx.save();
    hctx.translate(x, y);
    hctx.rotate(rot);
    hctx.fillStyle = isBright ? "#C4C4C4" : "#444444";
    hctx.beginPath();
    hctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    hctx.fill();
    hctx.restore();
  }

  const map = new THREE.CanvasTexture(albedo);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(2, 2);

  const { normalMap, roughnessMap } = buildNormalAndRoughness(
    height,
    1.8,
    0.72,
    0.92,
    THREE.RepeatWrapping,
    THREE.RepeatWrapping,
    2,
    2
  );

  return { map, normalMap, roughnessMap };
}

/**
 * 4. Authentic Staggered Scalloped Indonesian Genteng Terracotta Roof Tile PBR Triplet
 *    1:1 match to shot_001.jpg & shot_031.jpg warm sunlit orange clay tiles!
 */
export function createTerracottaRoofPBR(): PBRTriplet {
  const size = 512;
  const albedo = document.createElement("canvas");
  albedo.width = size;
  albedo.height = size;
  const ctx = albedo.getContext("2d")!;

  const height = document.createElement("canvas");
  height.width = size;
  height.height = size;
  const hctx = height.getContext("2d")!;
  const rand = seededRandom(608);

  ctx.fillStyle = "#D86E3E";
  ctx.fillRect(0, 0, size, size);
  hctx.fillStyle = "#808080";
  hctx.fillRect(0, 0, size, size);

  const rows = 16;
  const cols = 14;
  const rowH = size / rows;
  const colW = size / cols;

  for (let r = 0; r < rows; r++) {
    const y = r * rowH;
    const stagger = (r % 2) * (colW * 0.5);

    for (let c = -1; c <= cols; c++) {
      const x = c * colW + stagger;
      const v = (rand() - 0.5) * 24;
      const cr = Math.min(255, Math.max(0, 232 + v));
      const cg = Math.min(255, Math.max(0, 126 + v * 0.65));
      const cb = Math.min(255, Math.max(0, 76 + v * 0.45));

      // Horizontal curved barrel shading across individual genteng tile
      const tileG = ctx.createLinearGradient(x, y, x + colW, y);
      tileG.addColorStop(0.0, `rgb(${Math.max(0, cr - 42)}, ${Math.max(0, cg - 34)}, ${Math.max(0, cb - 24)})`);
      tileG.addColorStop(0.32, `rgb(${Math.min(255, cr + 20)}, ${Math.min(255, cg + 16)}, ${Math.min(255, cb + 14)})`);
      tileG.addColorStop(0.68, `rgb(${cr}, ${cg}, ${cb})`);
      tileG.addColorStop(1.0, `rgb(${Math.max(0, cr - 50)}, ${Math.max(0, cg - 38)}, ${Math.max(0, cb - 26)})`);

      ctx.fillStyle = tileG;
      ctx.beginPath();
      ctx.moveTo(x + 1, y);
      ctx.lineTo(x + colW - 1, y);
      ctx.lineTo(x + colW - 1, y + rowH - 5);
      ctx.quadraticCurveTo(x + colW * 0.5, y + rowH + 2, x + 1, y + rowH - 5);
      ctx.closePath();
      ctx.fill();

      // Height curve for Sobel normal map
      const hTileG = hctx.createLinearGradient(x, y, x + colW, y);
      hTileG.addColorStop(0.0, "#383838");
      hTileG.addColorStop(0.38, "#ECECEC");
      hTileG.addColorStop(0.75, "#B0B0B0");
      hTileG.addColorStop(1.0, "#2E2E2E");
      hctx.fillStyle = hTileG;
      hctx.fillRect(x + 1, y + 1, colW - 2, rowH - 3);
    }

    // Crisp bottom overlap lip shadow under each tile course
    ctx.fillStyle = "rgba(92, 32, 12, 0.52)";
    ctx.fillRect(0, y + rowH - 3.5, size, 3.5);
    hctx.fillStyle = "#181818";
    hctx.fillRect(0, y + rowH - 3.5, size, 3.5);
  }

  const map = new THREE.CanvasTexture(albedo);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(3.2, 2.2);

  const { normalMap, roughnessMap } = buildNormalAndRoughness(
    height,
    2.4,
    0.58,
    0.82,
    THREE.RepeatWrapping,
    THREE.RepeatWrapping,
    3.2,
    2.2
  );

  return { map, normalMap, roughnessMap };
}

/**
 * 5. Weathered Indonesian Village Stucco Wall PBR Triplet (warm cream plaster with gentle base weathering)
 */
export function createStuccoPBR(): PBRTriplet {
  const size = 512;
  const albedo = document.createElement("canvas");
  albedo.width = size;
  albedo.height = size;
  const ctx = albedo.getContext("2d")!;

  const height = document.createElement("canvas");
  height.width = size;
  height.height = size;
  const hctx = height.getContext("2d")!;
  const rand = seededRandom(712);

  const wallG = ctx.createLinearGradient(0, 0, 0, size);
  wallG.addColorStop(0.0, "#ECE5D8");
  wallG.addColorStop(0.72, "#E0D7C7");
  wallG.addColorStop(0.92, "#C8BEB0");
  wallG.addColorStop(1.0, "#AFA494");
  ctx.fillStyle = wallG;
  ctx.fillRect(0, 0, size, size);

  hctx.fillStyle = "#808080";
  hctx.fillRect(0, 0, size, size);

  // Subtle plaster mottling
  for (let i = 0; i < 180; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 18 + rand() * 55;
    const g = ctx.createRadialGradient(x, y, 2, x, y, r);
    g.addColorStop(0, rand() > 0.5 ? "rgba(255,250,240,0.16)" : "rgba(145,132,115,0.14)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 2500; i++) {
    const x = rand() * size;
    const y = rand() * size;
    hctx.fillStyle = rand() > 0.5 ? "#929292" : "#6E6E6E";
    hctx.fillRect(x, y, 2, 2);
  }

  const map = new THREE.CanvasTexture(albedo);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.ClampToEdgeWrapping;

  const { normalMap, roughnessMap } = buildNormalAndRoughness(
    height,
    0.85,
    0.82,
    0.96,
    THREE.RepeatWrapping,
    THREE.ClampToEdgeWrapping,
    1,
    1
  );

  return { map, normalMap, roughnessMap };
}

/**
 * 6. Radial Contact Shadow Decal Texture
 */
export function createContactShadowTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 60);
  g.addColorStop(0.0, "rgba(38, 24, 14, 0.56)");
  g.addColorStop(0.48, "rgba(38, 24, 14, 0.28)");
  g.addColorStop(0.85, "rgba(38, 24, 14, 0.08)");
  g.addColorStop(1.0, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * 7. Soft Volumetric Cyan-White Bokeh Glow Sprite Texture for Shot 18 Electric Leakage (shot_018.jpg)
 */
export function createSoftGlowTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 2, 64, 64, 62);
  g.addColorStop(0.0, "rgba(255, 255, 255, 1.0)");
  g.addColorStop(0.22, "rgba(180, 252, 255, 0.88)");
  g.addColorStop(0.5, "rgba(56, 224, 255, 0.42)");
  g.addColorStop(0.78, "rgba(20, 170, 220, 0.14)");
  g.addColorStop(1.0, "rgba(0, 140, 210, 0.0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * 8. 100% ANGLE-Safe Macro 85mm Shallow Depth-of-Field Bokeh Backdrop Texture (Shots #2, #18, #20, #21)
 *    Reproduces authentic Blender Eevee optical bokeh (blurred terracotta roofs, banana fronds, tropical trees, sky/rain)
 *    without @react-three/postprocessing EffectComposer offscreen-buffer glitches!
 */
export function createMacroBokehTexture(
  variant: "climb" | "rain_leak" | "insulator" | "cutaway"
): THREE.CanvasTexture {
  const w = 512;
  const h = 768;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;

  // Draw sharp base village background onto offscreen canvas, then blur optically via Canvas2D filter!
  const raw = document.createElement("canvas");
  raw.width = w;
  raw.height = h;
  const rctx = raw.getContext("2d")!;

  if (variant === "climb") {
    // Shot 2: Bright blue sky + crisp white clouds + green tree crowns at bottom (shot_002.jpg)
    const skyG = rctx.createLinearGradient(0, 0, 0, h);
    skyG.addColorStop(0.0, "#1D73CD");
    skyG.addColorStop(0.55, "#6EB4EE");
    skyG.addColorStop(0.85, "#CBE7FC");
    skyG.addColorStop(1.0, "#DCE8F2");
    rctx.fillStyle = skyG;
    rctx.fillRect(0, 0, w, h);

    // Sculpted bright clouds
    rctx.fillStyle = "rgba(255,255,255,0.92)";
    for (const [cx, cy, rx, ry] of [
      [110, 140, 120, 38],
      [390, 210, 150, 44],
      [220, 340, 160, 42],
      [430, 430, 120, 36],
      [90, 480, 130, 38],
    ]) {
      rctx.beginPath();
      rctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      rctx.fill();
    }

    // Soft distant blurred green tropical trees & terracotta roof peek at bottom
    for (const [tx, ty, tr, col] of [
      [60, 670, 115, "#3E7B24"],
      [210, 710, 105, "#4E942E"],
      [440, 660, 125, "#366D1E"],
      [320, 730, 95, "#5CA636"],
    ] as [number, number, number, string][]) {
      rctx.fillStyle = col;
      rctx.beginPath();
      rctx.arc(tx, ty, tr, 0, Math.PI * 2);
      rctx.fill();
    }
    rctx.fillStyle = "#D4693A";
    rctx.fillRect(0, 720, 190, 60);
  } else if (variant === "rain_leak") {
    // Shot 18: Overcast rainy sky + dark green village trees + warm blurred terracotta roofs below (shot_018.jpg)
    const skyG = rctx.createLinearGradient(0, 0, 0, h);
    skyG.addColorStop(0.0, "#2E4F72");
    skyG.addColorStop(0.45, "#6082A0");
    skyG.addColorStop(0.75, "#90AABF");
    skyG.addColorStop(1.0, "#758894");
    rctx.fillStyle = skyG;
    rctx.fillRect(0, 0, w, h);

    // Overcast rain clouds
    rctx.fillStyle = "rgba(210, 224, 236, 0.55)";
    for (const [cx, cy, rx, ry] of [
      [140, 120, 160, 50],
      [380, 190, 170, 55],
      [240, 290, 180, 48],
    ]) {
      rctx.beginPath();
      rctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      rctx.fill();
    }

    // Dark lush trees behind roofs
    for (const [tx, ty, tr, col] of [
      [75, 430, 115, "#1E4214"],
      [220, 415, 130, "#28531A"],
      [385, 435, 120, "#1D3E12"],
      [480, 455, 100, "#2A591C"],
    ] as [number, number, number, string][]) {
      rctx.fillStyle = col;
      rctx.beginPath();
      rctx.arc(tx, ty, tr, 0, Math.PI * 2);
      rctx.fill();
    }

    // Blurred orange terracotta genteng roof band across lower third
    rctx.fillStyle = "#C65A2E";
    rctx.fillRect(0, 500, w, 175);
    rctx.fillStyle = "#9A3E1A";
    for (let y = 515; y < 670; y += 22) {
      rctx.fillRect(0, y, w, 5);
    }
    // Lower dark cream wall & green door peek
    rctx.fillStyle = "#B8AE9E";
    rctx.fillRect(0, 675, w, 95);
    rctx.fillStyle = "#205B45";
    rctx.fillRect(280, 680, 110, 90);
    rctx.fillStyle = "#2E6A1C";
    rctx.beginPath();
    rctx.ellipse(90, 740, 140, 55, -0.2, 0, Math.PI * 2);
    rctx.fill();
  } else if (variant === "insulator") {
    // Shot 20: Bright sunny macro bokeh (palm trunks + lush trees + warm orange roof right + bright lime banana leaves bottom, shot_020.jpg!)
    const skyG = rctx.createLinearGradient(0, 0, 0, h);
    skyG.addColorStop(0.0, "#7EC0EE");
    skyG.addColorStop(0.45, "#CBE4F6");
    skyG.addColorStop(0.62, "#DFD4C4");
    skyG.addColorStop(1.0, "#D2C3AC");
    rctx.fillStyle = skyG;
    rctx.fillRect(0, 0, w, h);

    // Tall palm/tree trunks in upper background
    rctx.fillStyle = "#6C5642";
    for (const tx of [72, 165, 310, 425]) {
      rctx.fillRect(tx, 0, 20, 370);
    }
    // Lush green canopies at top
    for (const [tx, ty, tr, col] of [
      [80, 110, 105, "#2E641C"],
      [200, 90, 120, "#3F7E26"],
      [350, 125, 115, "#326B1E"],
      [465, 95, 110, "#4B8C2C"],
    ] as [number, number, number, string][]) {
      rctx.fillStyle = col;
      rctx.beginPath();
      rctx.arc(tx, ty, tr, 0, Math.PI * 2);
      rctx.fill();
    }

    // Warm orange terracotta roof house right-middle
    rctx.fillStyle = "#DE7242";
    rctx.beginPath();
    rctx.moveTo(155, 395);
    rctx.lineTo(270, 285);
    rctx.lineTo(512, 285);
    rctx.lineTo(512, 420);
    rctx.lineTo(155, 420);
    rctx.closePath();
    rctx.fill();

    // Cream house wall & dark windows
    rctx.fillStyle = "#D8CEC0";
    rctx.fillRect(195, 420, 317, 130);
    rctx.fillStyle = "#222A32";
    rctx.fillRect(255, 435, 72, 85);
    rctx.fillRect(365, 435, 72, 85);

    // Bright sunlit lime-green banana fronds fanning across lower foreground bokeh!
    for (const [bx, by, rx, ry, rot, col] of [
      [140, 705, 195, 62, -0.35, "#6AB538"],
      [380, 715, 195, 62, 0.32, "#59A02C"],
      [255, 740, 175, 58, 0.0, "#7AC644"],
    ] as [number, number, number, number, number, string][]) {
      rctx.save();
      rctx.translate(bx, by);
      rctx.rotate(rot);
      rctx.fillStyle = col;
      rctx.beginPath();
      rctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      rctx.fill();
      rctx.restore();
    }
  } else {
    // Shot 21: Cutaway in rain — soft blurred rainy blue-grey sky, green foliage top, warm orange roof left, sandy horizon right (shot_021.jpg!)
    const skyG = rctx.createLinearGradient(0, 0, 0, h);
    skyG.addColorStop(0.0, "#5B87AC");
    skyG.addColorStop(0.5, "#9BBBD4");
    skyG.addColorStop(0.65, "#C7D3DC");
    skyG.addColorStop(1.0, "#D4C6B2");
    rctx.fillStyle = skyG;
    rctx.fillRect(0, 0, w, h);

    // Blurred tree trunks & green canopies in top half
    rctx.fillStyle = "#5D4B3B";
    for (const tx of [60, 180, 360, 455]) {
      rctx.fillRect(tx, 0, 22, 420);
    }
    for (const [tx, ty, tr, col] of [
      [95, 130, 115, "#2D5F1A"],
      [230, 100, 130, "#3D7A24"],
      [410, 145, 120, "#2E641B"],
    ] as [number, number, number, string][]) {
      rctx.fillStyle = col;
      rctx.beginPath();
      rctx.arc(tx, ty, tr, 0, Math.PI * 2);
      rctx.fill();
    }

    // Blurred terracotta roof left side
    rctx.fillStyle = "#D4683A";
    rctx.fillRect(0, 400, 215, 290);
    rctx.fillStyle = "#A0421C";
    for (let y = 420; y < 680; y += 26) {
      rctx.fillRect(0, y, 215, 6);
    }
  }

  // Apply real smooth optical Gaussian blur onto destination canvas!
  const blurPx = variant === "climb" ? 10 : variant === "rain_leak" ? 14 : 18;
  ctx.filter = `blur(${blurPx}px)`;
  ctx.drawImage(raw, -24, -24, w + 48, h + 48);
  ctx.filter = "none";

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
