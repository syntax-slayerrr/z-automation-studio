import * as THREE from 'three';

/**
 * Deterministic High-DPI Procedural PBR Texture Library for `/series-evolusi`
 * Generates cached Albedo + Bump/Roughness CanvasTextures (zero external image files,
 * 100% ANGLE-safe, zero texture boil across Remotion frames!).
 */

export interface PbrTextureSet {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  roughnessMap?: THREE.CanvasTexture;
}

const cache = new Map<string, PbrTextureSet>();

function seededRand(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] | null {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  return [c, ctx];
}

function finalizeTex(
  canvas: HTMLCanvasElement,
  repeatX = 1,
  repeatY = 1,
  isColor = true,
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  if (isColor) {
    tex.colorSpace = THREE.SRGBColorSpace;
  }
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/**
 * 1. Sun-Drenched Wooden Deck Planks (Matches reference Beat 3 `2018` & Beat 6 `Yang bikin kaget`!)
 * Rich warm walnut/cedar planks with horizontal wood grain, subtle knots, and deep dark board seams.
 */
export function getWoodDeckPlanksPBR(repeatX = 2, repeatY = 2): PbrTextureSet | null {
  const key = `wood_deck_${repeatX}_${repeatY}`;
  if (cache.has(key)) return cache.get(key)!;
  const alb = makeCanvas(512, 512);
  const bmp = makeCanvas(512, 512);
  if (!alb || !bmp) return null;
  const [ac, actx] = alb;
  const [bc, bctx] = bmp;
  const rand = seededRand(2018);

  const plankCount = 12;
  const plankH = 512 / plankCount;

  for (let p = 0; p < plankCount; p++) {
    const y0 = p * plankH;
    const toneShift = (rand() - 0.5) * 26;
    const r = Math.round(148 + toneShift);
    const g = Math.round(98 + toneShift * 0.72);
    const b = Math.round(54 + toneShift * 0.45);

    actx.fillStyle = `rgb(${r},${g},${b})`;
    actx.fillRect(0, y0, 512, plankH);

    bctx.fillStyle = `rgb(${Math.round(165 + toneShift * 0.4)},${Math.round(165 + toneShift * 0.4)},${Math.round(165 + toneShift * 0.4)})`;
    bctx.fillRect(0, y0, 512, plankH);

    // Fine wood fiber streaks along each plank
    for (let s = 0; s < 38; s++) {
      const sy = y0 + 2 + rand() * (plankH - 4);
      const dark = rand() > 0.42;
      actx.strokeStyle = dark
        ? `rgba(48, 26, 10, ${(0.12 + rand() * 0.22).toFixed(2)})`
        : `rgba(218, 174, 122, ${(0.08 + rand() * 0.14).toFixed(2)})`;
      actx.lineWidth = 0.8 + rand() * 1.8;
      actx.beginPath();
      actx.moveTo(0, sy);
      const wave = (rand() - 0.5) * 3.5;
      actx.bezierCurveTo(170, sy + wave, 340, sy - wave, 512, sy);
      actx.stroke();

      bctx.strokeStyle = dark ? 'rgba(90,90,90,0.35)' : 'rgba(215,215,215,0.28)';
      bctx.lineWidth = 1.1;
      bctx.beginPath();
      bctx.moveTo(0, sy);
      bctx.lineTo(512, sy);
      bctx.stroke();
    }

    // Occasional subtle wood knot
    if (rand() > 0.55) {
      const kx = 40 + rand() * 432;
      const ky = y0 + plankH * (0.28 + rand() * 0.44);
      const kr = 4 + rand() * 6;
      const kg = actx.createRadialGradient(kx, ky, 1, kx, ky, kr * 2.2);
      kg.addColorStop(0, 'rgba(38,18,6,0.65)');
      kg.addColorStop(1, 'rgba(38,18,6,0)');
      actx.fillStyle = kg;
      actx.fillRect(kx - kr * 2.4, ky - kr * 1.4, kr * 4.8, kr * 2.8);
    }

    // Crisp recessed dark bevel seam between planks (signature visual detail in ref_xray_peel.png!)
    actx.fillStyle = 'rgba(22, 11, 4, 0.88)';
    actx.fillRect(0, y0, 512, 3.2);
    actx.fillStyle = 'rgba(235, 196, 148, 0.22)';
    actx.fillRect(0, y0 + 3.2, 512, 1.5);

    bctx.fillStyle = '#181818';
    bctx.fillRect(0, y0, 512, 3.6);
  }

  const res: PbrTextureSet = {
    map: finalizeTex(ac, repeatX, repeatY, true),
    bumpMap: finalizeTex(bc, repeatX, repeatY, false),
  };
  cache.set(key, res);
  return res;
}




/**
 * 2. Carved Walnut Wood / Goggles Frame PBR (Matches reference `ref_goggles_cu.png`!)
 * Deep radial-carved wood striations + subtle chisel marks + rich glossy varnish relief.
 */
export function getCarvedWalnutPBR(): PbrTextureSet | null {
  const key = 'carved_walnut_pbr';
  if (cache.has(key)) return cache.get(key)!;
  const alb = makeCanvas(512, 512);
  const bmp = makeCanvas(512, 512);
  if (!alb || !bmp) return null;
  const [ac, actx] = alb;
  const [bc, bctx] = bmp;
  const rand = seededRand(7721);

  const g = actx.createLinearGradient(0, 0, 512, 512);
  g.addColorStop(0, '#5E270C');
  g.addColorStop(0.5, '#7A3512');
  g.addColorStop(1, '#4C1D08');
  actx.fillStyle = g;
  actx.fillRect(0, 0, 512, 512);

  bctx.fillStyle = '#909090';
  bctx.fillRect(0, 0, 512, 512);

  // Flowing carved wood grain fibers + subtle cross chisel grooves
  for (let i = 0; i < 220; i++) {
    const y = rand() * 512;
    const isLight = rand() > 0.52;
    actx.strokeStyle = isLight
      ? `rgba(176, 98, 42, ${(0.18 + rand() * 0.28).toFixed(2)})`
      : `rgba(34, 12, 4, ${(0.24 + rand() * 0.34).toFixed(2)})`;
    actx.lineWidth = 1.2 + rand() * 3.0;
    actx.beginPath();
    actx.moveTo(0, y);
    actx.bezierCurveTo(170, y + (rand() - 0.5) * 18, 340, y + (rand() - 0.5) * 18, 512, y);
    actx.stroke();

    bctx.strokeStyle = isLight ? 'rgba(230,230,230,0.42)' : 'rgba(35,35,35,0.48)';
    bctx.lineWidth = 1.4 + rand() * 2.2;
    bctx.beginPath();
    bctx.moveTo(0, y);
    bctx.bezierCurveTo(170, y + (rand() - 0.5) * 16, 340, y + (rand() - 0.5) * 16, 512, y);
    bctx.stroke();
  }

  // Hand-carved notch marks around the rim
  for (let n = 0; n < 48; n++) {
    const nx = (n / 48) * 512;
    bctx.strokeStyle = 'rgba(28,28,28,0.65)';
    bctx.lineWidth = 2.2;
    bctx.beginPath();
    bctx.moveTo(nx, 0);
    bctx.lineTo(nx + (rand() - 0.5) * 6, 512);
    bctx.stroke();
  }

  const res: PbrTextureSet = {
    map: finalizeTex(ac, 2, 1, true),
    bumpMap: finalizeTex(bc, 2, 1, false),
  };
  cache.set(key, res);
  return res;
}

/**
 * 3. Crystalline Glacial Ice & Snow Cliff PBR (For Himalayan Ice Wall & Alpine Peaks!)
 * Blue-cyan stratified glacier ice veins, frozen pressure fractures, and sparkling snow frost crust.
 */
export function getGlacialIcePBR(repeatX = 1.5, repeatY = 2.5): PbrTextureSet | null {
  const key = `glacial_ice_${repeatX}_${repeatY}`;
  if (cache.has(key)) return cache.get(key)!;
  const alb = makeCanvas(512, 512);
  const bmp = makeCanvas(512, 512);
  const rgh = makeCanvas(512, 512);
  if (!alb || !bmp || !rgh) return null;
  const [ac, actx] = alb;
  const [bc, bctx] = bmp;
  const [rc, rctx] = rgh;
  const rand = seededRand(8848);

  const bg = actx.createLinearGradient(0, 0, 512, 512);
  bg.addColorStop(0, '#D4F0FF');
  bg.addColorStop(0.35, '#89C8EB');
  bg.addColorStop(0.7, '#428BB8');
  bg.addColorStop(1, '#1D5982');
  actx.fillStyle = bg;
  actx.fillRect(0, 0, 512, 512);

  bctx.fillStyle = '#808080';
  bctx.fillRect(0, 0, 512, 512);
  rctx.fillStyle = '#888888';
  rctx.fillRect(0, 0, 512, 512);

  // Soft snow-drift strata patches & ice mottling
  for (let i = 0; i < 140; i++) {
    const x = rand() * 512;
    const y = rand() * 512;
    const rx = 24 + rand() * 90;
    const ry = 12 + rand() * 50;
    const isSnow = rand() > 0.45;
    const gr = actx.createRadialGradient(x, y, 2, x, y, rx);
    if (isSnow) {
      gr.addColorStop(0, 'rgba(244, 251, 255, 0.42)');
      gr.addColorStop(1, 'rgba(244, 251, 255, 0)');
    } else {
      gr.addColorStop(0, 'rgba(18, 72, 114, 0.36)');
      gr.addColorStop(1, 'rgba(18, 72, 114, 0)');
    }
    actx.save();
    actx.translate(x, y);
    actx.scale(1, ry / rx);
    actx.fillStyle = gr;
    actx.beginPath();
    actx.arc(0, 0, rx, 0, Math.PI * 2);
    actx.fill();
    actx.restore();

    // Bump & Roughness matching snow vs glossy blue ice
    const bg2 = bctx.createRadialGradient(x, y, 2, x, y, rx);
    bg2.addColorStop(0, isSnow ? 'rgba(225,225,225,0.45)' : 'rgba(42,42,42,0.45)');
    bg2.addColorStop(1, 'rgba(128,128,128,0)');
    bctx.fillStyle = bg2;
    bctx.fillRect(x - rx, y - rx, rx * 2, rx * 2);

    rctx.fillStyle = isSnow ? 'rgba(220,220,220,0.32)' : 'rgba(55,55,55,0.38)';
    rctx.beginPath();
    rctx.arc(x, y, rx * 0.65, 0, Math.PI * 2);
    rctx.fill();
  }

  // Sharp crystalline ice stress fracture veins
  for (let c = 0; c < 42; c++) {
    let cx = rand() * 512;
    let cy = rand() * 512;
    const bright = rand() > 0.45;
    actx.strokeStyle = bright ? 'rgba(235, 252, 255, 0.52)' : 'rgba(10, 44, 74, 0.56)';
    actx.lineWidth = 0.8 + rand() * 1.8;
    bctx.strokeStyle = bright ? 'rgba(245,245,245,0.6)' : 'rgba(20,20,20,0.75)';
    bctx.lineWidth = 1.5 + rand() * 1.8;

    actx.beginPath();
    bctx.beginPath();
    actx.moveTo(cx, cy);
    bctx.moveTo(cx, cy);
    for (let s = 0; s < 5; s++) {
      cx += (rand() - 0.5) * 90;
      cy += (rand() - 0.35) * 75;
      actx.lineTo(cx, cy);
      bctx.lineTo(cx, cy);
    }
    actx.stroke();
    bctx.stroke();
  }

  // Fine micro-frost ice crystal sparkle
  for (let k = 0; k < 600; k++) {
    const sx = rand() * 512;
    const sy = rand() * 512;
    actx.fillStyle = 'rgba(255,255,255,0.45)';
    actx.fillRect(sx, sy, 1.5, 1.5);
    rctx.fillStyle = 'rgba(30,30,30,0.6)';
    rctx.fillRect(sx, sy, 1.8, 1.8);
  }

  const res: PbrTextureSet = {
    map: finalizeTex(ac, repeatX, repeatY, true),
    bumpMap: finalizeTex(bc, repeatX, repeatY, false),
    roughnessMap: finalizeTex(rc, repeatX, repeatY, false),
  };
  cache.set(key, res);
  return res;
}

/**
 * 4. Himalayan Stone Masonry & Whitewashed Plaster PBR (For Namche Bazaar Village!)
 */
export function getHimalayanStonePBR(repeatX = 2, repeatY = 1): PbrTextureSet | null {
  const key = `him_stone_${repeatX}_${repeatY}`;
  if (cache.has(key)) return cache.get(key)!;
  const alb = makeCanvas(512, 512);
  const bmp = makeCanvas(512, 512);
  if (!alb || !bmp) return null;
  const [ac, actx] = alb;
  const [bc, bctx] = bmp;
  const rand = seededRand(3440);

  actx.fillStyle = '#4B4A48';
  actx.fillRect(0, 0, 512, 512);
  bctx.fillStyle = '#262626';
  bctx.fillRect(0, 0, 512, 512);

  const rows = 10;
  const rh = 512 / rows;
  for (let r = 0; r < rows; r++) {
    let x = -rand() * 32;
    while (x < 512) {
      const w = 44 + rand() * 52;
      const shade = Math.round(92 + rand() * 56);
      const warm = Math.round((rand() - 0.45) * 14);
      actx.fillStyle = `rgb(${shade + warm},${shade + Math.round(warm * 0.5)},${shade - Math.round(warm * 0.4)})`;
      actx.fillRect(x + 3, r * rh + 3, w - 6, rh - 6);

      const bVal = Math.round(150 + rand() * 75);
      bctx.fillStyle = `rgb(${bVal},${bVal},${bVal})`;
      bctx.fillRect(x + 3, r * rh + 3, w - 6, rh - 6);
      x += w;
    }
  }

  // Surface granite grain speckles
  for (let i = 0; i < 1200; i++) {
    const gx = rand() * 512;
    const gy = rand() * 512;
    actx.fillStyle = rand() > 0.5 ? 'rgba(255,250,242,0.16)' : 'rgba(20,18,16,0.22)';
    actx.fillRect(gx, gy, 2.2, 2.2);
  }

  const res: PbrTextureSet = {
    map: finalizeTex(ac, repeatX, repeatY, true),
    bumpMap: finalizeTex(bc, repeatX, repeatY, false),
  };
  cache.set(key, res);
  return res;
}




/**
 * 5. Weathered Himalayan Whitewash Stucco Plaster PBR (Warm sunlit walls with subtle rain streaks)
 */
export function getStuccoPlasterPBR(baseHex = '#ECE4D6'): PbrTextureSet | null {
  const key = `stucco_${baseHex}`;
  if (cache.has(key)) return cache.get(key)!;
  const alb = makeCanvas(256, 256);
  const bmp = makeCanvas(256, 256);
  if (!alb || !bmp) return null;
  const [ac, actx] = alb;
  const [bc, bctx] = bmp;
  const rand = seededRand(5150);

  actx.fillStyle = baseHex;
  actx.fillRect(0, 0, 256, 256);
  bctx.fillStyle = '#888888';
  bctx.fillRect(0, 0, 256, 256);

  // Subtle vertical weathering + warm stucco mottling
  for (let i = 0; i < 180; i++) {
    const x = rand() * 256;
    const y = rand() * 256;
    const r = 10 + rand() * 34;
    const g = actx.createRadialGradient(x, y, 1, x, y, r);
    const warm = rand() > 0.5;
    g.addColorStop(0, warm ? 'rgba(180,152,118,0.13)' : 'rgba(92,84,74,0.10)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    actx.fillStyle = g;
    actx.fillRect(x - r, y - r, r * 2, r * 2);

    bctx.fillStyle = warm ? 'rgba(195,195,195,0.22)' : 'rgba(85,85,85,0.22)';
    bctx.fillRect(x, y, 4, 4);
  }

  // Top eaves contact AO strip
  const ao = actx.createLinearGradient(0, 0, 0, 48);
  ao.addColorStop(0, 'rgba(42, 30, 20, 0.34)');
  ao.addColorStop(1, 'rgba(42, 30, 20, 0)');
  actx.fillStyle = ao;
  actx.fillRect(0, 0, 256, 48);

  const res: PbrTextureSet = {
    map: finalizeTex(ac, 1, 1, true),
    bumpMap: finalizeTex(bc, 1, 1, false),
  };
  cache.set(key, res);
  return res;
}

/**
 * 6. Corrugated / Shingled Alpine Metal-Slate Roof PBR
 */
export function getCorrugatedRoofPBR(baseHex = '#2E5B75'): PbrTextureSet | null {
  const key = `roof_${baseHex}`;
  if (cache.has(key)) return cache.get(key)!;
  const alb = makeCanvas(256, 256);
  const bmp = makeCanvas(256, 256);
  if (!alb || !bmp) return null;
  const [ac, actx] = alb;
  const [bc, bctx] = bmp;

  actx.fillStyle = baseHex;
  actx.fillRect(0, 0, 256, 256);
  bctx.fillStyle = '#808080';
  bctx.fillRect(0, 0, 256, 256);

  const ribs = 24;
  const rw = 256 / ribs;
  for (let i = 0; i < ribs; i++) {
    const x = i * rw;
    const g = actx.createLinearGradient(x, 0, x + rw, 0);
    g.addColorStop(0, 'rgba(0,0,0,0.34)');
    g.addColorStop(0.45, 'rgba(255,255,255,0.16)');
    g.addColorStop(1, 'rgba(0,0,0,0.34)');
    actx.fillStyle = g;
    actx.fillRect(x, 0, rw, 256);

    const bg = bctx.createLinearGradient(x, 0, x + rw, 0);
    bg.addColorStop(0, '#282828');
    bg.addColorStop(0.5, '#E0E0E0');
    bg.addColorStop(1, '#282828');
    bctx.fillStyle = bg;
    bctx.fillRect(x, 0, rw, 256);
  }

  const res: PbrTextureSet = {
    map: finalizeTex(ac, 2, 1, true),
    bumpMap: finalizeTex(bc, 2, 1, false),
  };
  cache.set(key, res);
  return res;
}

/**
 * 7. Soft Radial Volumetric Bokeh / Snow-Glow Sprite Texture
 */
let bokehTexCache: THREE.CanvasTexture | null = null;
export function getSoftBokehTexture(): THREE.CanvasTexture | null {
  if (bokehTexCache) return bokehTexCache;
  const pair = makeCanvas(128, 128);
  if (!pair) return null;
  const [c, ctx] = pair;
  const g = ctx.createRadialGradient(64, 64, 2, 64, 64, 60);
  g.addColorStop(0, 'rgba(255,255,255,0.95)');
  g.addColorStop(0.35, 'rgba(224,244,255,0.55)');
  g.addColorStop(0.75, 'rgba(180,228,255,0.16)');
  g.addColorStop(1, 'rgba(180,228,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  bokehTexCache = new THREE.CanvasTexture(c);
  bokehTexCache.needsUpdate = true;
  return bokehTexCache;
}

/**
 * 8. Sun-Baked Cracked African Savanna Soil & Dry Grass PBR (`getSavannaEarthPBR`)
 */
export function getSavannaEarthPBR(repeatX = 3, repeatY = 3): PbrTextureSet | null {
  const key = `savanna_earth_${repeatX}_${repeatY}`;
  if (cache.has(key)) return cache.get(key)!;
  const alb = makeCanvas(512, 512);
  const bmp = makeCanvas(512, 512);
  if (!alb || !bmp) return null;
  const [ac, actx] = alb;
  const [bc, bctx] = bmp;
  const rand = seededRand(4109);

  actx.fillStyle = '#8F6236';
  actx.fillRect(0, 0, 512, 512);
  bctx.fillStyle = '#909090';
  bctx.fillRect(0, 0, 512, 512);

  // Warm ochre dust & sun-scorched dry soil mottling
  for (let i = 0; i < 220; i++) {
    const x = rand() * 512;
    const y = rand() * 512;
    const r = 18 + rand() * 72;
    const warm = rand() > 0.45;
    const g = actx.createRadialGradient(x, y, 2, x, y, r);
    g.addColorStop(0, warm ? 'rgba(196, 146, 82, 0.34)' : 'rgba(92, 56, 26, 0.34)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    actx.fillStyle = g;
    actx.fillRect(x - r, y - r, r * 2, r * 2);

    bctx.fillStyle = warm ? 'rgba(205,205,205,0.22)' : 'rgba(65,65,65,0.22)';
    bctx.beginPath();
    bctx.arc(x, y, r * 0.45, 0, Math.PI * 2);
    bctx.fill();
  }

  // Deep arid clay mud-cracks
  for (let c = 0; c < 48; c++) {
    let cx = rand() * 512;
    let cy = rand() * 512;
    actx.strokeStyle = 'rgba(42, 22, 8, 0.58)';
    actx.lineWidth = 1.2 + rand() * 1.8;
    bctx.strokeStyle = 'rgba(18, 18, 18, 0.85)';
    bctx.lineWidth = 2.0 + rand() * 1.6;
    actx.beginPath();
    bctx.beginPath();
    actx.moveTo(cx, cy);
    bctx.moveTo(cx, cy);
    for (let s = 0; s < 5; s++) {
      cx += (rand() - 0.5) * 95;
      cy += (rand() - 0.5) * 95;
      actx.lineTo(cx, cy);
      bctx.lineTo(cx, cy);
    }
    actx.stroke();
    bctx.stroke();
  }

  const res: PbrTextureSet = {
    map: finalizeTex(ac, repeatX, repeatY, true),
    bumpMap: finalizeTex(bc, repeatX, repeatY, false),
  };
  cache.set(key, res);
  return res;
}




/**
 * 9. Tropical Forest Tree Bark & Mossy Trunk PBR (`getForestBarkPBR`)
 */
export function getForestBarkPBR(repeatX = 1, repeatY = 3): PbrTextureSet | null {
  const key = `forest_bark_${repeatX}_${repeatY}`;
  if (cache.has(key)) return cache.get(key)!;
  const alb = makeCanvas(256, 512);
  const bmp = makeCanvas(256, 512);
  if (!alb || !bmp) return null;
  const [ac, actx] = alb;
  const [bc, bctx] = bmp;
  const rand = seededRand(2911);

  actx.fillStyle = '#2A1E16';
  actx.fillRect(0, 0, 256, 512);
  bctx.fillStyle = '#707070';
  bctx.fillRect(0, 0, 256, 512);

  for (let i = 0; i < 160; i++) {
    const x = rand() * 256;
    const isMoss = rand() > 0.78;
    actx.strokeStyle = isMoss
      ? `rgba(42, 92, 54, ${(0.22 + rand() * 0.25).toFixed(2)})`
      : rand() > 0.45
        ? 'rgba(72, 52, 36, 0.48)'
        : 'rgba(18, 12, 8, 0.62)';
    actx.lineWidth = 2 + rand() * 5;
    actx.beginPath();
    actx.moveTo(x, 0);
    actx.bezierCurveTo(x + (rand() - 0.5) * 18, 170, x + (rand() - 0.5) * 18, 340, x, 512);
    actx.stroke();

    bctx.strokeStyle = rand() > 0.5 ? 'rgba(215,215,215,0.45)' : 'rgba(25,25,25,0.55)';
    bctx.lineWidth = 2.5 + rand() * 4;
    bctx.beginPath();
    bctx.moveTo(x, 0);
    bctx.lineTo(x + (rand() - 0.5) * 10, 512);
    bctx.stroke();
  }

  const res: PbrTextureSet = {
    map: finalizeTex(ac, repeatX, repeatY, true),
    bumpMap: finalizeTex(bc, repeatX, repeatY, false),
  };
  cache.set(key, res);
  return res;
}




/**
 * 10. Authentic Organic Macro Human Skin Micro-Relief & Pores PBR (`getSkinSurfacePBR`)
 * Uses jittered biological Voronoi skin-cell micro-polygons + warm mottled sub-surface tone
 * (ZERO artificial straight grid lines!) for macro UV-melanin & goosebump shots!
 */
export function getSkinSurfacePBR(repeatX = 2, repeatY = 2): PbrTextureSet | null {
  const key = `skin_micro_v2_${repeatX}_${repeatY}`;
  if (cache.has(key)) return cache.get(key)!;
  const alb = makeCanvas(512, 512);
  const bmp = makeCanvas(512, 512);
  if (!alb || !bmp) return null;
  const [ac, actx] = alb;
  const [bc, bctx] = bmp;
  const rand = seededRand(6161);

  actx.fillStyle = '#D9B498';
  actx.fillRect(0, 0, 512, 512);
  bctx.fillStyle = '#9E9E9E';
  bctx.fillRect(0, 0, 512, 512);

  // Soft organic warm biological skin-tone mottling (subsurface variation)
  for (let i = 0; i < 160; i++) {
    const x = rand() * 512;
    const y = rand() * 512;
    const r = 18 + rand() * 56;
    const g = actx.createRadialGradient(x, y, 2, x, y, r);
    const warm = rand() > 0.45;
    g.addColorStop(0, warm ? 'rgba(235, 198, 168, 0.22)' : 'rgba(154, 102, 74, 0.16)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    actx.fillStyle = g;
    actx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // Organic jittered biological skin micro-relief (curved irregular sulci, NOT a geometric grid!)
  const cols = 12;
  const rows = 12;
  const cellW = 512 / cols;
  const cellH = 512 / rows;
  const pts: Array<Array<[number, number]>> = [];
  for (let gy = 0; gy <= rows; gy++) {
    const row: Array<[number, number]> = [];
    for (let gx = 0; gx <= cols; gx++) {
      // Tile cleanly across edges
      const jx = gx === 0 || gx === cols ? 0 : (rand() - 0.5) * cellW * 0.62;
      const jy = gy === 0 || gy === rows ? 0 : (rand() - 0.5) * cellH * 0.62;
      row.push([gx * cellW + jx, gy * cellH + jy]);
    }
    pts.push(row);
  }

  actx.strokeStyle = 'rgba(128, 78, 52, 0.11)';
  actx.lineWidth = 1.2;
  bctx.strokeStyle = 'rgba(72, 72, 72, 0.34)';
  bctx.lineWidth = 1.6;
  for (let gy = 0; gy < rows; gy++) {
    for (let gx = 0; gx < cols; gx++) {
      const p0 = pts[gy][gx];
      const pR = pts[gy][gx + 1];
      const pD = pts[gy + 1][gx];
      const pDR = pts[gy + 1][gx + 1];
      const drawOrganic = (a: [number, number], b: [number, number]) => {
        const mx = (a[0] + b[0]) * 0.5 + (rand() - 0.5) * 6;
        const my = (a[1] + b[1]) * 0.5 + (rand() - 0.5) * 6;
        actx.beginPath();
        actx.moveTo(a[0], a[1]);
        actx.quadraticCurveTo(mx, my, b[0], b[1]);
        actx.stroke();
        bctx.beginPath();
        bctx.moveTo(a[0], a[1]);
        bctx.quadraticCurveTo(mx, my, b[0], b[1]);
        bctx.stroke();
      };
      drawOrganic(p0, pR);
      drawOrganic(p0, pD);
      if (rand() > 0.38) drawOrganic(p0, pDR);
    }
  }

  // Fine subtle follicular pores
  for (let p = 0; p < 180; p++) {
    const px = rand() * 512;
    const py = rand() * 512;
    const pr = 1.8 + rand() * 2.6;
    const pg = bctx.createRadialGradient(px, py, 0.4, px, py, pr);
    pg.addColorStop(0, 'rgba(55,55,55,0.45)');
    pg.addColorStop(0.6, 'rgba(182,182,182,0.22)');
    pg.addColorStop(1, 'rgba(158,158,158,0)');
    bctx.fillStyle = pg;
    bctx.beginPath();
    bctx.arc(px, py, pr, 0, Math.PI * 2);
    bctx.fill();

    actx.fillStyle = 'rgba(112, 68, 44, 0.08)';
    actx.beginPath();
    actx.arc(px, py, pr * 0.55, 0, Math.PI * 2);
    actx.fill();
  }

  const res: PbrTextureSet = {
    map: finalizeTex(ac, repeatX, repeatY, true),
    bumpMap: finalizeTex(bc, repeatX, repeatY, false),
  };
  cache.set(key, res);
  return res;
}

/**
 * 11. Combed Realistic Primate Fur Pelage PBR (`getApeFurPBR`)
 * Generates directional fine overlapping hair strands (albedo + deep strand bump map)
 * supporting Chimpanzee dark-brown-black, Bonobo jet-charcoal, and Gorilla silverback tones!
 */
export function getApeFurPBR(
  variant: 'chimp' | 'bonobo' | 'gorilla_dark' | 'gorilla_silver' | 'fur_pelt' = 'chimp',
  repeatX = 3,
  repeatY = 3,
): PbrTextureSet | null {
  const key = `ape_fur_${variant}_${repeatX}_${repeatY}`;
  if (cache.has(key)) return cache.get(key)!;
  const alb = makeCanvas(512, 512);
  const bmp = makeCanvas(512, 512);
  if (!alb || !bmp) return null;
  const [ac, actx] = alb;
  const [bc, bctx] = bmp;
  const rand = seededRand(variant === 'gorilla_silver' ? 8821 : variant === 'fur_pelt' ? 7741 : 4419);

  const palettes: Record<string, { base: string; dark: string; mid: string; hi: string }> = {
    chimp: { base: '#1E1611', dark: '#0E0907', mid: '#34241A', hi: '#543C2B' },
    bonobo: { base: '#171618', dark: '#0A0A0C', mid: '#2A282D', hi: '#4A464F' },
    gorilla_dark: { base: '#1B1A19', dark: '#0D0C0C', mid: '#2F2E2C', hi: '#52504C' },
    gorilla_silver: { base: '#6F757A', dark: '#3E4348', mid: '#98A0A6', hi: '#CCD4DA' },
    fur_pelt: { base: '#4A311D', dark: '#24150B', mid: '#6B492C', hi: '#9C7148' },
  };
  const p = palettes[variant];

  actx.fillStyle = p.base;
  actx.fillRect(0, 0, 512, 512);
  bctx.fillStyle = '#4A4A4A';
  bctx.fillRect(0, 0, 512, 512);

  // 3,200 layered combed individual fur strands flowing downward with subtle organic wave
  for (let i = 0; i < 3200; i++) {
    const sx = rand() * 512;
    const sy = rand() * 512;
    const len = 18 + rand() * 34;
    const curve = (rand() - 0.5) * 10;
    const r = rand();
    actx.strokeStyle = r < 0.35 ? p.dark : r < 0.78 ? p.mid : p.hi;
    actx.lineWidth = 0.8 + rand() * 1.6;
    actx.beginPath();
    actx.moveTo(sx, sy);
    actx.quadraticCurveTo(sx + curve, sy + len * 0.5, sx + curve * 0.5, sy + len);
    actx.stroke();

    const bCol = r < 0.35 ? '#202020' : r < 0.75 ? '#A0A0A0' : '#EAEAEA';
    bctx.strokeStyle = bCol;
    bctx.lineWidth = 1.0 + rand() * 1.4;
    bctx.beginPath();
    bctx.moveTo(sx, sy);
    bctx.quadraticCurveTo(sx + curve, sy + len * 0.5, sx + curve * 0.5, sy + len);
    bctx.stroke();
  }

  const res: PbrTextureSet = {
    map: finalizeTex(ac, repeatX, repeatY, true),
    bumpMap: finalizeTex(bc, repeatX, repeatY, false),
  };
  cache.set(key, res);
  return res;
}

/**
 * 12. Realistic Folded Cerebral Cortex (Brain Gyri & Sulci) PBR (`getBrainSulciPBR`)
 */
export function getBrainSulciPBR(): PbrTextureSet | null {
  const key = 'brain_sulci_v1';
  if (cache.has(key)) return cache.get(key)!;
  const alb = makeCanvas(512, 512);
  const bmp = makeCanvas(512, 512);
  if (!alb || !bmp) return null;
  const [ac, actx] = alb;
  const [bc, bctx] = bmp;
  const rand = seededRand(9931);

  actx.fillStyle = '#E89B82';
  actx.fillRect(0, 0, 512, 512);
  bctx.fillStyle = '#C8C8C8';
  bctx.fillRect(0, 0, 512, 512);

  // Meandering folded cerebral gyri grooves (sulci)
  for (let i = 0; i < 65; i++) {
    let x = rand() * 512;
    let y = rand() * 512;
    actx.strokeStyle = 'rgba(130, 38, 22, 0.55)';
    actx.lineWidth = 6 + rand() * 4;
    actx.lineCap = 'round';
    bctx.strokeStyle = 'rgba(22, 22, 22, 0.82)';
    bctx.lineWidth = 8 + rand() * 4;
    bctx.lineCap = 'round';
    actx.beginPath();
    bctx.beginPath();
    actx.moveTo(x, y);
    bctx.moveTo(x, y);
    for (let s = 0; s < 5; s++) {
      const cx = x + (rand() - 0.5) * 90;
      const cy = y + (rand() - 0.5) * 90;
      x += (rand() - 0.5) * 110;
      y += (rand() - 0.5) * 110;
      actx.quadraticCurveTo(cx, cy, x, y);
      bctx.quadraticCurveTo(cx, cy, x, y);
    }
    actx.stroke();
    bctx.stroke();
  }

  const res: PbrTextureSet = {
    map: finalizeTex(ac, 2, 2, true),
    bumpMap: finalizeTex(bc, 2, 2, false),
  };
  cache.set(key, res);
  return res;
}
