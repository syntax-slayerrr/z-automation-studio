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
 * 1. Aspect-Correct 1:1 Horizontally-Seamless Geological Soil Cutaway PBR Triplet
 *    Uses repeat.set(5, 1) on the 24m x 4.6m plane so texels are 1:1 SQUARE (ZERO horizontal stretch!),
 *    delivering razor-thin fibrous roots, round 3D pebbles, and rich stippled @gimanabisaid earth strata!
 */
export function createSoilPBR(isWetMud: boolean = false): PBRTriplet {
  const size = 1024;
  const albedo = document.createElement("canvas");
  albedo.width = size;
  albedo.height = size;
  const ctx = albedo.getContext("2d")!;

  const height = document.createElement("canvas");
  height.width = size;
  height.height = size;
  const hctx = height.getContext("2d")!;
  const rand = seededRandom(isWetMud ? 912 : 911);

  // Exact @gimanabisaid 4-horizon soil gradient (shot_001.jpg & shot_009.jpg)
  const grad = ctx.createLinearGradient(0, 0, 0, size);
  if (isWetMud) {
    grad.addColorStop(0.0, "#462D1C");
    grad.addColorStop(0.24, "#5C3B24");
    grad.addColorStop(0.58, "#7D4F30");
    grad.addColorStop(1.0, "#5E3820");
  } else {
    grad.addColorStop(0.0, "#4A311E"); // Dark rich humus topsoil
    grad.addColorStop(0.22, "#6E482B"); // Root horizon brown
    grad.addColorStop(0.46, "#B67744"); // Warm golden-ochre loam
    grad.addColorStop(0.74, "#C57C45"); // Sunlit terracotta clay
    grad.addColorStop(1.0, "#96542C"); // Deep compact clay
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  hctx.fillStyle = "#808080";
  hctx.fillRect(0, 0, size, size);

  // Top pale sandy surface crust lip (top 22px)
  ctx.fillStyle = isWetMud ? "#6B4D35" : "#DECBB0";
  ctx.fillRect(0, 0, size, 18);

  // Horizontally tileable mottled soil clods (wraps cleanly at X=0 and X=size!)
  for (let i = 0; i < 420; i++) {
    const x = rand() * size;
    const y = 18 + rand() * (size - 18);
    const r = 14 + rand() * 48;
    const bright = rand() > 0.48;
    for (const ox of [-size, 0, size]) {
      const gx = x + ox;
      if (gx + r < 0 || gx - r > size) continue;
      const ag = ctx.createRadialGradient(gx, y, 2, gx, y, r);
      ag.addColorStop(
        0,
        bright ? "rgba(232, 168, 108, 0.24)" : "rgba(42, 23, 11, 0.28)"
      );
      ag.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = ag;
      ctx.beginPath();
      ctx.arc(gx, y, r, 0, Math.PI * 2);
      ctx.fill();

      const hg = hctx.createRadialGradient(gx, y, 2, gx, y, r);
      hg.addColorStop(0, bright ? "rgba(235,235,235,0.25)" : "rgba(25,25,25,0.25)");
      hg.addColorStop(1, "rgba(128,128,128,0)");
      hctx.fillStyle = hg;
      hctx.beginPath();
      hctx.arc(gx, y, r, 0, Math.PI * 2);
      hctx.fill();
    }
  }

  // Dense fine stippled soil grain (12,000 micro-speckles matching reference soil texture)
  for (let i = 0; i < 12000; i++) {
    const x = rand() * size;
    const y = 18 + rand() * (size - 18);
    const sz = 1.2 + rand() * 2.4;
    ctx.fillStyle =
      rand() > 0.5 ? "rgba(255, 226, 188, 0.12)" : "rgba(32, 17, 8, 0.16)";
    ctx.fillRect(x, y, sz, sz);
  }

  // Delicate, razor-thin bifurcating fibrous hair-roots in top 38% (1.2px-2.4px thin!)
  const drawThinRoot = (
    x: number,
    y: number,
    ang: number,
    len: number,
    thick: number,
    depth: number
  ) => {
    if (depth <= 0 || len < 8 || y > 410) return;
    const steps = 5;
    let cx = x;
    let cy = y;
    let a = ang;
    const pts: [number, number][] = [[cx, cy]];
    for (let s = 0; s < steps; s++) {
      a += (rand() - 0.5) * 0.52;
      cx += Math.cos(a) * (len / steps);
      cy += Math.sin(a) * (len / steps);
      pts.push([cx, cy]);
    }

    for (const ox of [-size, 0, size]) {
      // Soft dark root shadow
      ctx.beginPath();
      ctx.moveTo(pts[0][0] + ox + 1.2, pts[0][1] + 1.5);
      for (let s = 1; s < pts.length; s++) {
        ctx.lineTo(pts[s][0] + ox + 1.2, pts[s][1] + 1.5);
      }
      ctx.strokeStyle = "rgba(28, 15, 7, 0.45)";
      ctx.lineWidth = thick + 0.8;
      ctx.lineCap = "round";
      ctx.stroke();

      // Crisp warm tan root fiber
      ctx.beginPath();
      hctx.beginPath();
      ctx.moveTo(pts[0][0] + ox, pts[0][1]);
      hctx.moveTo(pts[0][0] + ox, pts[0][1]);
      for (let s = 1; s < pts.length; s++) {
        ctx.lineTo(pts[s][0] + ox, pts[s][1]);
        hctx.lineTo(pts[s][0] + ox, pts[s][1]);
      }
      ctx.strokeStyle = depth >= 3 ? "#D4BC96" : "#B89A72";
      ctx.lineWidth = thick;
      ctx.stroke();

      hctx.strokeStyle = "#CFCFCF";
      hctx.lineWidth = thick + 0.6;
      hctx.stroke();
    }

    const forks = rand() > 0.28 ? 2 : 1;
    for (let f = 0; f < forks; f++) {
      drawThinRoot(
        cx,
        cy,
        a + (f === 0 ? -1 : 1) * (0.26 + rand() * 0.42),
        len * (0.64 + rand() * 0.2),
        thick * 0.68,
        depth - 1
      );
    }
  };

  for (let i = 0; i < 58; i++) {
    const sx = (i / 58) * size + (rand() - 0.5) * 12;
    drawThinRoot(
      sx,
      16,
      Math.PI / 2 + (rand() - 0.5) * 0.45,
      62 + rand() * 46,
      2.2,
      4
    );
  }

  // Round/Oval 3D-Shaded White & Gray Pebbles (1:1 aspect ratio -> never stretched!)
  for (let i = 0; i < 115; i++) {
    const px = 16 + rand() * (size - 32);
    const py = 110 + rand() * (size - 135);
    const rx = 4.5 + rand() * 7.5;
    const ry = rx * (0.68 + rand() * 0.26);
    const rot = rand() * Math.PI;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.ellipse(1.5, 2.5, rx * 1.05, ry * 1.05, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(32, 16, 7, 0.48)";
    ctx.fill();

    const pg = ctx.createRadialGradient(-rx * 0.3, -ry * 0.3, 1, 0, 0, rx * 1.1);
    if (i % 3 === 0) {
      pg.addColorStop(0, "#FAF6EE");
      pg.addColorStop(0.7, "#DCD2C2");
      pg.addColorStop(1, "#9A8D7B");
    } else if (i % 3 === 1) {
      pg.addColorStop(0, "#EAE3D5");
      pg.addColorStop(0.7, "#BFB29E");
      pg.addColorStop(1, "#7D705F");
    } else {
      pg.addColorStop(0, "#D2CCC2");
      pg.addColorStop(0.7, "#999186");
      pg.addColorStop(1, "#5E574F");
    }
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = pg;
    ctx.fill();
    ctx.restore();

    hctx.beginPath();
    hctx.ellipse(px, py, rx, ry, rot, 0, Math.PI * 2);
    hctx.fillStyle = "#EEEEEE";
    hctx.fill();
  }

  const repeatX = 5;
  const repeatY = 1;
  const map = new THREE.CanvasTexture(albedo);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.ClampToEdgeWrapping;
  map.repeat.set(repeatX, repeatY);

  const { normalMap, roughnessMap } = buildNormalAndRoughness(
    height,
    2.2,
    isWetMud ? 0.25 : 0.72,
    isWetMud ? 0.52 : 0.95,
    THREE.RepeatWrapping,
    THREE.ClampToEdgeWrapping,
    repeatX,
    repeatY
  );
  return { map, normalMap, roughnessMap };
}

/**
 * 2. Dappled Botanical Leaf-Cluster PBR Texture (turns tree puffs into rich feathery foliage!)
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
  const rand = seededRandom(888);

  ctx.fillStyle = "#3E7521";
  ctx.fillRect(0, 0, size, size);
  hctx.fillStyle = "#505050";
  hctx.fillRect(0, 0, size, size);

  const leafShades = ["#295413", "#386D1C", "#4E8E29", "#64AA36", "#7AC043", "#8ED052"];
  for (let i = 0; i < 950; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const rx = 4 + rand() * 7;
    const ry = rx * 0.58;
    const ang = rand() * Math.PI;
    const col = leafShades[Math.floor(rand() * leafShades.length)];
    const hVal = Math.round(90 + rand() * 160);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = col;
    ctx.fill();
    ctx.restore();

    hctx.save();
    hctx.translate(x, y);
    hctx.rotate(ang);
    hctx.beginPath();
    hctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    hctx.fillStyle = `rgb(${hVal},${hVal},${hVal})`;
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
    2.4,
    0.58,
    0.9,
    THREE.RepeatWrapping,
    THREE.RepeatWrapping,
    2,
    2
  );
  return { map, normalMap, roughnessMap };
}

/**
 * 3. Fractured Crushed Granite Ballast PBR Triplet
 */
export function createBallastPBR(): PBRTriplet {
  const size = 512;
  const albedo = document.createElement("canvas");
  albedo.width = size;
  albedo.height = size;
  const ctx = albedo.getContext("2d")!;

  const height = document.createElement("canvas");
  height.width = size;
  height.height = size;
  const hctx = height.getContext("2d")!;
  const rand = seededRandom(222);

  ctx.fillStyle = "#6E7278";
  ctx.fillRect(0, 0, size, size);
  hctx.fillStyle = "#303030";
  hctx.fillRect(0, 0, size, size);

  const rockPalette = ["#8D9197", "#767A80", "#A6A8AC", "#64686E", "#9C978E", "#B6B4AE"];

  for (let i = 0; i < 420; i++) {
    const cx = rand() * size;
    const cy = rand() * size;
    const sides = 4 + Math.floor(rand() * 3);
    const radius = 8 + rand() * 14;
    const baseAngle = rand() * Math.PI * 2;
    const color = rockPalette[Math.floor(rand() * rockPalette.length)];
    const hVal = Math.round(135 + rand() * 115);

    ctx.beginPath();
    hctx.beginPath();
    for (let s = 0; s < sides; s++) {
      const a = baseAngle + (s / sides) * Math.PI * 2 + (rand() - 0.5) * 0.35;
      const r = radius * (0.72 + rand() * 0.35);
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      if (s === 0) {
        ctx.moveTo(px, py);
        hctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
        hctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = "rgba(32, 34, 38, 0.5)";
    ctx.lineWidth = 1.3;
    ctx.stroke();

    hctx.closePath();
    hctx.fillStyle = `rgb(${hVal},${hVal},${hVal})`;
    hctx.fill();
  }

  const map = new THREE.CanvasTexture(albedo);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(4, 2);
  const { normalMap, roughnessMap } = buildNormalAndRoughness(
    height,
    3.4,
    0.56,
    0.92,
    THREE.RepeatWrapping,
    THREE.RepeatWrapping,
    4,
    2
  );
  return { map, normalMap, roughnessMap };
}

/**
 * 4. Weathered Concrete Sleeper PBR Triplet
 */
export function createConcreteSleeperPBR(): PBRTriplet {
  const size = 256;
  const albedo = document.createElement("canvas");
  albedo.width = size;
  albedo.height = size;
  const ctx = albedo.getContext("2d")!;

  const height = document.createElement("canvas");
  height.width = size;
  height.height = size;
  const hctx = height.getContext("2d")!;
  const rand = seededRandom(333);

  ctx.fillStyle = "#D4D1C8";
  ctx.fillRect(0, 0, size, size);
  hctx.fillStyle = "#909090";
  hctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 1800; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const light = rand() > 0.5;
    ctx.fillStyle = light ? "rgba(255,252,245,0.18)" : "rgba(95,90,82,0.16)";
    ctx.fillRect(x, y, 2, 2);
    hctx.fillStyle = light ? "#B8B8B8" : "#555555";
    hctx.fillRect(x, y, 2, 2);
  }

  const map = new THREE.CanvasTexture(albedo);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  const { normalMap, roughnessMap } = buildNormalAndRoughness(height, 1.6, 0.68, 0.9);
  return { map, normalMap, roughnessMap };
}

/**
 * 5. Brushed Railway Steel Rail PBR Triplet
 */
export function createSteelRailPBR(): PBRTriplet {
  const size = 256;
  const albedo = document.createElement("canvas");
  albedo.width = size;
  albedo.height = size;
  const ctx = albedo.getContext("2d")!;

  const height = document.createElement("canvas");
  height.width = size;
  height.height = size;
  const hctx = height.getContext("2d")!;
  const rand = seededRandom(444);

  ctx.fillStyle = "#BCC4CE";
  ctx.fillRect(0, 0, size, size);
  hctx.fillStyle = "#888888";
  hctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 320; i++) {
    const y = rand() * size;
    ctx.strokeStyle = rand() > 0.45 ? "rgba(245,250,255,0.26)" : "rgba(120,92,72,0.16)";
    ctx.lineWidth = 1 + rand() * 1.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();

    hctx.strokeStyle = rand() > 0.5 ? "#AEAEAE" : "#686868";
    hctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    hctx.stroke();
  }

  const map = new THREE.CanvasTexture(albedo);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  const { normalMap, roughnessMap } = buildNormalAndRoughness(height, 1.2, 0.22, 0.46);
  return { map, normalMap, roughnessMap };
}

/**
 * 6. Sunlit Sandy Rural Embankment Ground PBR Triplet
 */
export function createGroundVergePBR(isWetMud: boolean = false): PBRTriplet {
  const size = 512;
  const albedo = document.createElement("canvas");
  albedo.width = size;
  albedo.height = size;
  const ctx = albedo.getContext("2d")!;

  const height = document.createElement("canvas");
  height.width = size;
  height.height = size;
  const hctx = height.getContext("2d")!;
  const rand = seededRandom(isWetMud ? 556 : 555);

  ctx.fillStyle = isWetMud ? "#8B6646" : "#E4D3BA";
  ctx.fillRect(0, 0, size, size);
  hctx.fillStyle = "#808080";
  hctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 200; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 12 + rand() * 44;
    const g = ctx.createRadialGradient(x, y, 2, x, y, r);
    g.addColorStop(
      0,
      isWetMud
        ? rand() > 0.5
          ? "rgba(95, 64, 38, 0.32)"
          : "rgba(165, 128, 92, 0.25)"
        : rand() > 0.5
        ? "rgba(202, 174, 136, 0.28)"
        : "rgba(250, 238, 218, 0.3)"
    );
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    const hg = hctx.createRadialGradient(x, y, 2, x, y, r);
    hg.addColorStop(0, rand() > 0.5 ? "rgba(210,210,210,0.22)" : "rgba(50,50,50,0.22)");
    hg.addColorStop(1, "rgba(128,128,128,0)");
    hctx.fillStyle = hg;
    hctx.beginPath();
    hctx.arc(x, y, r, 0, Math.PI * 2);
    hctx.fill();
  }

  const map = new THREE.CanvasTexture(albedo);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(5, 3);
  const { normalMap, roughnessMap } = buildNormalAndRoughness(
    height,
    1.6,
    isWetMud ? 0.2 : 0.76,
    isWetMud ? 0.48 : 0.94,
    THREE.RepeatWrapping,
    THREE.RepeatWrapping,
    5,
    3
  );
  return { map, normalMap, roughnessMap };
}

/**
 * 7. Indonesian Scalloped Terracotta Genteng Roof Tile PBR Triplet
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
  const rand = seededRandom(666);

  ctx.fillStyle = "#E87D4E";
  ctx.fillRect(0, 0, size, size);
  hctx.fillStyle = "#404040";
  hctx.fillRect(0, 0, size, size);

  const th = 32;
  const tw = 32;
  for (let r = 0; r < size / th; r++) {
    const y = r * th;
    const off = (r % 2) * (tw / 2);
    for (let c = -1; c <= size / tw; c++) {
      const x = c * tw + off;
      const v = (rand() - 0.5) * 18;
      const ag = ctx.createLinearGradient(x, y, x, y + th);
      ag.addColorStop(0, `rgb(${245 + v},${142 + v * 0.7},${90 + v * 0.5})`);
      ag.addColorStop(0.7, `rgb(${228 + v},${120 + v * 0.7},${72 + v * 0.5})`);
      ag.addColorStop(1, `rgb(${186 + v},${88 + v * 0.6},${50 + v * 0.4})`);
      ctx.fillStyle = ag;
      ctx.fillRect(x + 1, y + 1, tw - 2, th - 2);

      const hg = hctx.createLinearGradient(x, y, x + tw, y);
      hg.addColorStop(0.0, "#383838");
      hg.addColorStop(0.42, "#F2F2F2");
      hg.addColorStop(0.85, "#606060");
      hg.addColorStop(1.0, "#242424");
      hctx.fillStyle = hg;
      hctx.fillRect(x + 1, y + 1, tw - 2, th - 3);
    }
    hctx.fillStyle = "#181818";
    hctx.fillRect(0, y + th - 3, size, 3);
  }

  const map = new THREE.CanvasTexture(albedo);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(3.5, 2.2);
  const { normalMap, roughnessMap } = buildNormalAndRoughness(
    height,
    2.6,
    0.46,
    0.76,
    THREE.RepeatWrapping,
    THREE.RepeatWrapping,
    3.5,
    2.2
  );
  return { map, normalMap, roughnessMap };
}

/**
 * 8. Warm Honey-Oak Wooden Table PBR Triplet
 */
export function createWoodTablePBR(): PBRTriplet {
  const size = 512;
  const albedo = document.createElement("canvas");
  albedo.width = size;
  albedo.height = size;
  const ctx = albedo.getContext("2d")!;

  const height = document.createElement("canvas");
  height.width = size;
  height.height = size;
  const hctx = height.getContext("2d")!;
  const rand = seededRandom(777);

  ctx.fillStyle = "#D4A572";
  ctx.fillRect(0, 0, size, size);
  hctx.fillStyle = "#8A8A8A";
  hctx.fillRect(0, 0, size, size);

  for (let y = 0; y < size; y += 3) {
    const dark = rand() > 0.55;
    ctx.strokeStyle = dark ? "rgba(135, 88, 46, 0.24)" : "rgba(242, 206, 160, 0.22)";
    ctx.lineWidth = 1.5 + rand() * 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(170, y + (rand() - 0.5) * 8, 340, y + (rand() - 0.5) * 8, size, y);
    ctx.stroke();

    hctx.strokeStyle = dark ? "#686868" : "#A8A8A8";
    hctx.beginPath();
    hctx.moveTo(0, y);
    hctx.lineTo(size, y);
    hctx.stroke();
  }

  const map = new THREE.CanvasTexture(albedo);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  const { normalMap, roughnessMap } = buildNormalAndRoughness(height, 1.3, 0.45, 0.68);
  return { map, normalMap, roughnessMap };
}

/**
 * 9. Soft Radial Contact AO Shadow Decal Texture
 */
export function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 4, size / 2, size / 2, size / 2);
  grad.addColorStop(0.0, "rgba(20, 12, 6, 0.52)");
  grad.addColorStop(0.55, "rgba(24, 15, 8, 0.24)");
  grad.addColorStop(1.0, "rgba(24, 15, 8, 0.0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
