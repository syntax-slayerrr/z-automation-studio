import * as THREE from "three";

function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * 1. Authentic Pale Sunlit Cream-Yellow Bamboo Texture (1:1 match to shot_001.jpg & shot_013.jpg)
 *    - Subtle fine vertical culm fibers + realistic crisp narrow nodal bands
 *    - Optional Shot 13 organic mottled fungal rot climbing cleanly from soil boundary
 */
export function createBambooTexture(showRot: boolean = false): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;
  const rand = seededRandom(307);

  // Reference bamboo is warm pale yellow-cream green (#DCE094 -> #C3CB76)
  const grad = ctx.createLinearGradient(0, 0, 256, 0);
  grad.addColorStop(0.0, "#AAB462");
  grad.addColorStop(0.25, "#D6DC8C");
  grad.addColorStop(0.52, "#E4E89E");
  grad.addColorStop(0.78, "#C7CE7B");
  grad.addColorStop(1.0, "#A2AC5A");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 1024);

  // Fine vertical bamboo fibers
  for (let x = 1; x < 256; x += 3) {
    ctx.strokeStyle =
      rand() > 0.5 ? "rgba(110, 118, 52, 0.14)" : "rgba(255, 255, 224, 0.12)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1024);
    ctx.stroke();
  }

  // Subtle realistic narrow bamboo nodal joints every 146px (NEVER giant blurry white bands!)
  for (let y = 73; y < 1024; y += 146) {
    ctx.fillStyle = "rgba(92, 98, 42, 0.42)";
    ctx.fillRect(0, y - 3, 256, 2.5);
    ctx.fillStyle = "rgba(236, 238, 196, 0.72)";
    ctx.fillRect(0, y - 0.5, 256, 2);
    ctx.fillStyle = "rgba(96, 102, 44, 0.32)";
    ctx.fillRect(0, y + 1.5, 256, 2);
  }

  // Shot 13: High-contrast organic mottled dark-brown fungal rot right at ground boundary (shot_013.jpg)
  if (showRot) {
    // Deep saturated wet-rot gradient at very bottom 10%
    const rotBase = ctx.createLinearGradient(0, 915, 0, 1024);
    rotBase.addColorStop(0.0, "rgba(62, 38, 18, 0.0)");
    rotBase.addColorStop(0.45, "rgba(56, 34, 16, 0.75)");
    rotBase.addColorStop(1.0, "rgba(38, 22, 10, 0.96)");
    ctx.fillStyle = rotBase;
    ctx.fillRect(0, 915, 256, 109);

    // Organic mottled dark fungal blotches climbing up 860..1024 with pale bamboo peeking through
    for (let i = 0; i < 110; i++) {
      const rx = rand() * 256;
      const ry = 855 + rand() * 169;
      const radius = 8 + rand() * 20;
      const df = Math.min(1, (ry - 855) / 160);
      for (const ox of [-256, 0, 256]) {
        const gx = rx + ox;
        if (gx + radius < 0 || gx - radius > 256) continue;
        const rg = ctx.createRadialGradient(gx, ry, 1, gx, ry, radius);
        rg.addColorStop(0, `rgba(44, 26, 12, ${0.48 + df * 0.48})`);
        rg.addColorStop(0.55, `rgba(74, 48, 24, ${0.32 + df * 0.35})`);
        rg.addColorStop(1, "rgba(44, 26, 12, 0)");
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(gx, ry, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = showRot ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
  return texture;
}

/**
 * 2. Treated Creosote Rich Dark-Brown Wood & Natural Warm Tan Timber Texture
 */
export function createWoodTexture(isTreated: boolean = true): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  const rand = seededRandom(isTreated ? 509 : 510);

  ctx.fillStyle = isTreated ? "#5C3C26" : "#BA8E5F";
  ctx.fillRect(0, 0, 256, 512);

  for (let x = 0; x < 256; x += 2.5) {
    ctx.strokeStyle = isTreated
      ? rand() > 0.48
        ? "rgba(38, 22, 12, 0.42)"
        : "rgba(125, 86, 54, 0.28)"
      : rand() > 0.5
      ? "rgba(130, 88, 48, 0.32)"
      : "rgba(225, 186, 140, 0.26)";
    ctx.lineWidth = 1 + rand() * 1.8;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.bezierCurveTo(x + (rand() - 0.5) * 6, 170, x + (rand() - 0.5) * 6, 340, x, 512);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * 3. Clean Pale Woven Bamboo Straw Caping Hat Texture (shot_001.jpg & shot_031.jpg)
 */
export function createCapingTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#F5EDD2";
  ctx.fillRect(0, 0, 256, 256);

  // Fine delicate woven bamboo strips
  ctx.strokeStyle = "rgba(176, 148, 96, 0.28)";
  ctx.lineWidth = 1.5;
  for (let y = 0; y < 256; y += 8) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(155, 126, 76, 0.22)";
  for (let x = 0; x < 256; x += 7) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * 4. Smooth Spun Prestressed Concrete Texture
 */
export function createConcreteTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  const rand = seededRandom(811);

  ctx.fillStyle = "#DDDCD6";
  ctx.fillRect(0, 0, 256, 512);

  for (let i = 0; i < 2400; i++) {
    const x = rand() * 256;
    const y = rand() * 512;
    ctx.fillStyle = rand() > 0.5 ? "rgba(255,255,255,0.12)" : "rgba(128,128,122,0.12)";
    ctx.fillRect(x, y, 2, 3);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}
