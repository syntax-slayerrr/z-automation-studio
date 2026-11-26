import * as THREE from "three";

/**
 * Shared 3D Cel-Toon Ink-Outline Material & Texture Engine
 * Reverse-engineered from `galeri-motion-tipikal.mp4` ("Tipe-Tipe Pengendara Motor").
 *
 * Key DNA:
 *  - Crisp 3-step NearestFilter DataTexture gradientMap for MeshToonMaterial (ZERO soft PBR mush!)
 *  - Uniform Inverted-Hull BackSide Black Ink Outlines (#0F1016) on characters & hero props
 *  - Clean procedural Canvas2D cel textures (hoodie stripes, tweed/tie, black-white Indonesian kerbs, phone UI, slot reels)
 */

let cachedRamp3: THREE.DataTexture | null = null;
let cachedRamp2: THREE.DataTexture | null = null;
let cachedInkMat: THREE.MeshBasicMaterial | null = null;

export function getCelGradientMap(steps: 2 | 3 = 3): THREE.DataTexture {
  if (steps === 3 && cachedRamp3) return cachedRamp3;
  if (steps === 2 && cachedRamp2) return cachedRamp2;

  // RGBA 1D ramp with NearestFilter creates razor-sharp anime/cartoon cel shadow steps!
  const values = steps === 3 ? [118, 202, 255] : [132, 255];
  const data = new Uint8Array(values.length * 4);
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    data[i * 4 + 0] = v;
    data[i * 4 + 1] = v;
    data[i * 4 + 2] = v;
    data[i * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, values.length, 1, THREE.RGBAFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;

  if (steps === 3) cachedRamp3 = tex;
  else cachedRamp2 = tex;
  return tex;
}

export function getInkOutlineMaterial(color = 0x0f1016): THREE.MeshBasicMaterial {
  if (color === 0x0f1016 && cachedInkMat) return cachedInkMat;
  const mat = new THREE.MeshBasicMaterial({
    color,
    side: THREE.BackSide,
  });
  if (color === 0x0f1016) cachedInkMat = mat;
  return mat;
}

export function createToonMaterial(
  color: THREE.ColorRepresentation,
  opts?: {
    steps?: 2 | 3;
    map?: THREE.Texture | null;
    emissive?: THREE.ColorRepresentation;
    emissiveIntensity?: number;
    transparent?: boolean;
    opacity?: number;
    side?: THREE.Side;
  }
): THREE.MeshToonMaterial {
  const mat = new THREE.MeshToonMaterial({
    color,
    gradientMap: getCelGradientMap(opts?.steps ?? 3),
    map: opts?.map ?? null,
    emissive: opts?.emissive ? new THREE.Color(opts.emissive) : new THREE.Color(0x000000),
    emissiveIntensity: opts?.emissiveIntensity ?? 0,
    transparent: opts?.transparent ?? false,
    opacity: opts?.opacity ?? 1,
    side: opts?.side ?? THREE.FrontSide,
  });
  return mat;
}

/**
 * Adds a crisp uniform Inverted-Hull BackSide Black Ink Outline directly as a child of a Mesh!
 * Uses normal-inflation vertex expansion via scale or geometry copy so spheres, capsules,
 * cylinders, and boxes all get consistent comic-book ink contours!
 */
export function addInkOutline(
  mesh: THREE.Mesh,
  thickness = 0.032,
  color = 0x0f1016
): THREE.Mesh {
  const geom = mesh.geometry;
  if (!geom.boundingBox) geom.computeBoundingBox();
  const size = new THREE.Vector3();
  geom.boundingBox?.getSize(size);

  // Convert desired world-unit thickness into per-axis inflation factors (clamped for safety)
  const sx = size.x > 0.001 ? 1 + (thickness * 2) / size.x : 1.06;
  const sy = size.y > 0.001 ? 1 + (thickness * 2) / size.y : 1.06;
  const sz = size.z > 0.001 ? 1 + (thickness * 2) / size.z : 1.06;

  const outline = new THREE.Mesh(geom, getInkOutlineMaterial(color));
  outline.scale.set(
    Math.min(1.24, sx),
    Math.min(1.24, sy),
    Math.min(1.24, sz)
  );
  outline.castShadow = false;
  outline.receiveShadow = false;
  outline.name = `${mesh.name || "mesh"}_ink_outline`;
  mesh.add(outline);
  return outline;
}

/**
 * Helper to create a Cel-Toon Mesh WITH automatic shadows & crisp Black Ink Outline!
 */
export function makeToonMesh(
  geometry: THREE.BufferGeometry,
  color: THREE.ColorRepresentation,
  opts?: {
    outline?: number; // 0 disables outline
    steps?: 2 | 3;
    map?: THREE.Texture | null;
    emissive?: THREE.ColorRepresentation;
    emissiveIntensity?: number;
    castShadow?: boolean;
    receiveShadow?: boolean;
    name?: string;
  }
): THREE.Mesh {
  const mat = createToonMaterial(color, {
    steps: opts?.steps ?? 3,
    map: opts?.map,
    emissive: opts?.emissive,
    emissiveIntensity: opts?.emissiveIntensity,
  });
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.castShadow = opts?.castShadow ?? true;
  mesh.receiveShadow = opts?.receiveShadow ?? true;
  if (opts?.name) mesh.name = opts.name;
  const outlineT = opts?.outline ?? 0.026;
  if (outlineT > 0) {
    addInkOutline(mesh, outlineT);
  }
  return mesh;
}

/**
 * Procedural Canvas2D Indonesian Black & White Striped Street Kerb Texture (from galeri-motion-tipikal.mp4!)
 */
export function createIndonesianKerbTexture(repeatX = 14): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#F4F2EB";
  ctx.fillRect(0, 0, 256, 64);
  ctx.fillStyle = "#14161D";
  ctx.fillRect(0, 0, 128, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.repeat.set(repeatX, 1);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Procedural Canvas2D Stylized Jacket / Hoodie / Academic Blazer Front Torso Texture
 */
export function createTorsoGarmentTexture(
  style: "hoodie" | "skinner_tweed" | "lembke_blazer" | "casual_tee",
  baseColor: string
): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext("2d")!;

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 512, 512);

  // Cylinder UV wraps horizontally 0..512 with front center around x = 256
  if (style === "hoodie") {
    // Center zipper + two white drawstring cords (just like red hoodie rider in reference!)
    ctx.fillStyle = "#E7E9F0";
    ctx.fillRect(252, 0, 8, 512);
    ctx.fillStyle = "#D4D8E3";
    ctx.fillRect(222, 16, 12, 165);
    ctx.fillRect(278, 16, 12, 165);
    // Kangaroo pocket outline
    ctx.strokeStyle = "#0F1016";
    ctx.lineWidth = 8;
    ctx.strokeRect(184, 305, 144, 120);
  } else if (style === "skinner_tweed") {
    // Subtle 1950s tweed vertical weave
    ctx.fillStyle = "rgba(20, 22, 34, 0.18)";
    for (let x = 0; x < 512; x += 16) ctx.fillRect(x, 0, 5, 512);
    // Crisp white dress shirt V-opening at center x=256
    ctx.fillStyle = "#F8F4EA";
    ctx.beginPath();
    ctx.moveTo(205, 0);
    ctx.lineTo(307, 0);
    ctx.lineTo(256, 255);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#0F1016";
    ctx.lineWidth = 8;
    ctx.stroke();
    // Classic 1950s Coral Striped Tie
    ctx.fillStyle = "#E11D48";
    ctx.beginPath();
    ctx.moveTo(240, 24);
    ctx.lineTo(272, 24);
    ctx.lineTo(280, 235);
    ctx.lineTo(256, 275);
    ctx.lineTo(232, 235);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#0F1016";
    ctx.lineWidth = 6;
    ctx.stroke();
    // Diagonal tie stripes
    ctx.strokeStyle = "#FCD34D";
    ctx.lineWidth = 6;
    for (let y = 70; y < 220; y += 36) {
      ctx.beginPath();
      ctx.moveTo(238, y);
      ctx.lineTo(274, y - 16);
      ctx.stroke();
    }
    // Suit lapels
    ctx.fillStyle = "#1E2233";
    ctx.beginPath();
    ctx.moveTo(185, 0);
    ctx.lineTo(256, 260);
    ctx.lineTo(175, 200);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(327, 0);
    ctx.lineTo(256, 260);
    ctx.lineTo(337, 200);
    ctx.closePath();
    ctx.fill();
  } else if (style === "lembke_blazer") {
    // Crisp Stanford Academic Indigo Blazer + Soft Cream Inner Blouse
    ctx.fillStyle = "#FAF5EC";
    ctx.beginPath();
    ctx.moveTo(204, 0);
    ctx.lineTo(308, 0);
    ctx.lineTo(292, 512);
    ctx.lineTo(220, 512);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#0F1016";
    ctx.lineWidth = 7;
    ctx.stroke();
    // Blazer lapel edges
    ctx.fillStyle = "#162C4E";
    ctx.beginPath();
    ctx.moveTo(178, 0);
    ctx.lineTo(226, 265);
    ctx.lineTo(166, 210);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(334, 0);
    ctx.lineTo(286, 265);
    ctx.lineTo(346, 210);
    ctx.closePath();
    ctx.fill();
    // Gold Stanford lapel pin
    ctx.fillStyle = "#F59E0B";
    ctx.beginPath();
    ctx.arc(312, 130, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#0F1016";
    ctx.lineWidth = 4;
    ctx.stroke();
  } else {
    // Casual clean tee with subtle collar ring
    ctx.strokeStyle = "#0F1016";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(256, 2, 54, 0, Math.PI);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Procedural Canvas2D Crisp Comic Sign / Screen Texture for 3D Props (clocks, phone feeds, slot drums, labels)
 */
export function createComicLabelTexture(
  lines: string[],
  opts?: {
    bg?: string;
    fg?: string;
    border?: string;
    accent?: string;
    width?: number;
    height?: number;
    fontSize?: number;
  }
): THREE.CanvasTexture {
  const W = opts?.width ?? 512;
  const H = opts?.height ?? 256;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;

  ctx.fillStyle = opts?.bg ?? "#FFFDF6";
  ctx.fillRect(0, 0, W, H);

  if (opts?.accent) {
    ctx.fillStyle = opts.accent;
    ctx.fillRect(0, 0, W, 28);
  }

  ctx.strokeStyle = opts?.border ?? "#0F1016";
  ctx.lineWidth = 14;
  ctx.strokeRect(7, 7, W - 14, H - 14);

  const fs = opts?.fontSize ?? 54;
  ctx.fillStyle = opts?.fg ?? "#0F1016";
  ctx.font = `900 ${fs}px "Trebuchet MS", "Segoe UI", Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const lineGap = fs * 1.18;
  const startY = H / 2 - ((lines.length - 1) * lineGap) / 2 + (opts?.accent ? 10 : 0);
  lines.forEach((ln, idx) => {
    ctx.fillText(ln, W / 2, startY + idx * lineGap, W - 44);
  });

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}
