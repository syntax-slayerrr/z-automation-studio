import * as THREE from "three";

/**
 * Painted Gouache Stylized-Realistic 3D Engine for SERI: SEHAT ITU MENYELURUH
 * Translates Option 1's tactile gouache paper mottling, warm editorial color palettes
 * (Kurzgesagt × Kok Bisa? × Earth-24h warmth — ZERO sterile #000/#fff), volumetric light shafts,
 * and Sobel brush-relief PBR normals directly into real-time Three.js!
 */

export function seededRand(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export interface GouachePBRTriplet {
  map: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
}

function hexToRgb(hex: string): [number, number, number] {
  const c = new THREE.Color(hex);
  return [Math.round(c.r * 255), Math.round(c.g * 255), Math.round(c.b * 255)];
}

/**
 * Builds a hand-painted gouache PBR texture triplet (Albedo + Sobel Brush-Relief Normal + Matte Roughness)
 * so 3D walls, fabrics, wood, foliage, stone, and organs carry authentic painterly gouache mottling!
 */
export function createGouacheSurfacePBR(options: {
  baseHex: string;
  lightHex: string;
  darkHex: string;
  seed?: number;
  size?: number;
  dabCount?: number;
  normalStrength?: number;
  minRough?: number;
  maxRough?: number;
  repeatX?: number;
  repeatY?: number;
  woodGrain?: boolean;
  tweedWeave?: boolean;
}): GouachePBRTriplet {
  const {
    baseHex,
    lightHex,
    darkHex,
    seed = 101,
    size = 512,
    dabCount = 240,
    normalStrength = 0.85,
    minRough = 0.64,
    maxRough = 0.94,
    repeatX = 1,
    repeatY = 1,
    woodGrain = false,
    tweedWeave = false,
  } = options;

  const rand = seededRand(seed);
  const albedo = document.createElement("canvas");
  albedo.width = size;
  albedo.height = size;
  const ctx = albedo.getContext("2d")!;

  const height = document.createElement("canvas");
  height.width = size;
  height.height = size;
  const hctx = height.getContext("2d")!;

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, size, size);
  hctx.fillStyle = "#808080";
  hctx.fillRect(0, 0, size, size);

  const [lr, lg, lb] = hexToRgb(lightHex);
  const [dr, dg, db] = hexToRgb(darkHex);

  // 1. Tileable multi-scale painterly gouache mottling clouds (Earth-24h DNA!)
  for (let i = 0; i < dabCount; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const rx = 18 + rand() * 58;
    const ry = rx * (0.45 + rand() * 0.65);
    const rot = rand() * Math.PI;
    const isLight = rand() > 0.48;
    const alpha = 0.08 + rand() * 0.14;

    for (const ox of [-size, 0, size]) {
      for (const oy of [-size, 0, size]) {
        const gx = x + ox;
        const gy = y + oy;
        if (gx + rx < 0 || gx - rx > size || gy + rx < 0 || gy - rx > size) continue;

        ctx.save();
        ctx.translate(gx, gy);
        ctx.rotate(rot);
        const gr = ctx.createRadialGradient(0, 0, rx * 0.08, 0, 0, rx);
        gr.addColorStop(
          0,
          isLight ? `rgba(${lr},${lg},${lb},${alpha})` : `rgba(${dr},${dg},${db},${alpha})`
        );
        gr.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        hctx.save();
        hctx.translate(gx, gy);
        hctx.rotate(rot);
        const hr = hctx.createRadialGradient(0, 0, 2, 0, 0, rx);
        hr.addColorStop(
          0,
          isLight ? `rgba(205,205,205,${alpha * 0.9})` : `rgba(60,60,60,${alpha * 0.9})`
        );
        hr.addColorStop(1, "rgba(128,128,128,0)");
        hctx.fillStyle = hr;
        hctx.beginPath();
        hctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        hctx.fill();
        hctx.restore();
      }
    }
  }

  // 2. Optional painterly wood plank fibers
  if (woodGrain) {
    for (let y = 0; y < size; y += 3) {
      const isDark = rand() > 0.45;
      ctx.strokeStyle = isDark
        ? `rgba(${dr},${dg},${db},0.18)`
        : `rgba(${lr},${lg},${lb},0.14)`;
      ctx.lineWidth = 1.0 + rand() * 1.8;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(
        size * 0.33,
        y + (rand() - 0.5) * 7,
        size * 0.66,
        y + (rand() - 0.5) * 7,
        size,
        y
      );
      ctx.stroke();

      hctx.strokeStyle = isDark ? "rgba(92,92,92,0.22)" : "rgba(170,170,170,0.18)";
      hctx.lineWidth = 1.2;
      hctx.beginPath();
      hctx.moveTo(0, y);
      hctx.lineTo(size, y);
      hctx.stroke();
    }
  }

  // 3. Optional academic herringbone/tweed woven texture (for Maslow's 1960s suit & cozy fabrics!)
  if (tweedWeave) {
    for (let i = -size; i < size * 2; i += 6) {
      ctx.strokeStyle = `rgba(${lr},${lg},${lb},0.12)`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + size, size);
      ctx.stroke();

      ctx.strokeStyle = `rgba(${dr},${dg},${db},0.11)`;
      ctx.beginPath();
      ctx.moveTo(i, size);
      ctx.lineTo(i + size, 0);
      ctx.stroke();
    }
  }

  // 4. Fine cold-pressed watercolor/gouache paper tooth stipple
  const grainCount = Math.round((size * size) / 62);
  for (let i = 0; i < grainCount; i++) {
    const gx = rand() * size;
    const gy = rand() * size;
    const bright = rand() > 0.5;
    ctx.fillStyle = bright
      ? `rgba(${lr},${lg},${lb},0.075)`
      : `rgba(${dr},${dg},${db},0.075)`;
    ctx.fillRect(gx, gy, 1.8, 1.8);
    hctx.fillStyle = bright ? "rgba(175,175,175,0.16)" : "rgba(85,85,85,0.16)";
    hctx.fillRect(gx, gy, 2, 2);
  }

  // 5. Sobel Height -> Normal + Roughness
  const src = hctx.getImageData(0, 0, size, size).data;
  const nCanvas = document.createElement("canvas");
  nCanvas.width = size;
  nCanvas.height = size;
  const nCtx = nCanvas.getContext("2d")!;
  const nImg = nCtx.createImageData(size, size);
  const nd = nImg.data;

  const rCanvas = document.createElement("canvas");
  rCanvas.width = size;
  rCanvas.height = size;
  const rCtx = rCanvas.getContext("2d")!;
  const rImg = rCtx.createImageData(size, size);
  const rd = rImg.data;

  const sampleH = (x: number, y: number): number => {
    const cx = ((x % size) + size) % size;
    const cy = ((y % size) + size) % size;
    return src[(cy * size + cx) * 4] / 255;
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
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
      const inv = 1.0 / Math.hypot(dx, dy, dz);

      const idx = (y * size + x) * 4;
      nd[idx] = Math.round(((-dx * inv) * 0.5 + 0.5) * 255);
      nd[idx + 1] = Math.round(((-dy * inv) * 0.5 + 0.5) * 255);
      nd[idx + 2] = Math.round(((dz * inv) * 0.5 + 0.5) * 255);
      nd[idx + 3] = 255;

      const rv = Math.round((maxRough - c * (maxRough - minRough)) * 255);
      rd[idx] = rv;
      rd[idx + 1] = rv;
      rd[idx + 2] = rv;
      rd[idx + 3] = 255;
    }
  }
  nCtx.putImageData(nImg, 0, 0);
  rCtx.putImageData(rImg, 0, 0);

  const map = new THREE.CanvasTexture(albedo);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(repeatX, repeatY);

  const normalMap = new THREE.CanvasTexture(nCanvas);
  normalMap.colorSpace = THREE.NoColorSpace;
  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.set(repeatX, repeatY);

  const roughnessMap = new THREE.CanvasTexture(rCanvas);
  roughnessMap.colorSpace = THREE.NoColorSpace;
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(repeatX, repeatY);

  return { map, normalMap, roughnessMap };
}

export function createGouacheMaterial(options: {
  baseHex: string;
  lightHex: string;
  darkHex: string;
  seed?: number;
  size?: number;
  roughness?: number;
  metalness?: number;
  sheen?: number;
  sheenColor?: string;
  repeatX?: number;
  repeatY?: number;
  woodGrain?: boolean;
  tweedWeave?: boolean;
  normalScale?: number;
}): THREE.MeshPhysicalMaterial {
  const pbr = createGouacheSurfacePBR({
    baseHex: options.baseHex,
    lightHex: options.lightHex,
    darkHex: options.darkHex,
    seed: options.seed ?? 101,
    size: options.size ?? 256,
    repeatX: options.repeatX ?? 1,
    repeatY: options.repeatY ?? 1,
    woodGrain: options.woodGrain,
    tweedWeave: options.tweedWeave,
  });
  const ns = options.normalScale ?? 0.55;
  return new THREE.MeshPhysicalMaterial({
    map: pbr.map,
    normalMap: pbr.normalMap,
    normalScale: new THREE.Vector2(ns, ns),
    roughnessMap: pbr.roughnessMap,
    roughness: options.roughness ?? 0.82,
    metalness: options.metalness ?? 0.02,
    sheen: options.sheen ?? 0.28,
    sheenColor: options.sheenColor ?? options.lightHex,
    sheenRoughness: 0.72,
  });
}

/**
 * Soft radial additive glow texture for nutrients, synapses, floating dust motes & sun bloom.
 */
export function createGlowSpriteTexture(innerHex: string, outerHex: string): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const g = c.getContext("2d")!;
  const [ir, ig, ib] = hexToRgb(innerHex);
  const [or, og, ob] = hexToRgb(outerHex);
  const gr = g.createRadialGradient(64, 64, 2, 64, 64, 62);
  gr.addColorStop(0.0, `rgba(${ir},${ig},${ib},1.0)`);
  gr.addColorStop(0.32, `rgba(${ir},${ig},${ib},0.72)`);
  gr.addColorStop(0.65, `rgba(${or},${og},${ob},0.28)`);
  gr.addColorStop(1.0, `rgba(${or},${og},${ob},0.0)`);
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Custom GLSL Volumetric God-Ray Shaft Material (smooth Fresnel edge & vertical fade!).
 */
export function createVolumetricShaftMaterial(
  colorHex: string,
  opacity = 0.22
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uColor: { value: new THREE.Color(colorHex) },
      uOpacity: { value: opacity },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      void main() {
        vUv = uv;
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vViewDir = normalize(-mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      void main() {
        float edge = pow(abs(dot(vNormal, vViewDir)), 1.65);
        float verticalFade = smoothstep(0.0, 0.28, vUv.y) * smoothstep(1.0, 0.12, vUv.y);
        float a = edge * verticalFade * uOpacity;
        gl_FragColor = vec4(uColor, a);
      }
    `,
  });
}

/**
 * Painterly Gouache Sky Dome Shader (Option 1 color warmth + subtle canvas tooth + clouds + stars!).
 */
export const GOUACHE_SKY_VERTEX = `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const GOUACHE_SKY_FRAGMENT = `
  uniform float uTime;
  uniform vec3 uSkyTop;
  uniform vec3 uSkyMid;
  uniform vec3 uSkyBot;
  uniform vec3 uGround;
  uniform vec3 uSunDir;
  uniform vec3 uSunColor;
  uniform vec3 uCloudLight;
  uniform vec3 uCloudShadow;
  uniform float uCloudCover;
  uniform float uStarStrength;

  varying vec3 vDir;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.52;
    mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p = rot * p * 2.04 + vec2(2.7, 6.1);
      a *= 0.48;
    }
    return v;
  }

  void main() {
    vec3 dir = normalize(vDir);
    float elev = clamp(dir.y, 0.0, 1.0);

    // 3-stop painterly Option 1 gouache sky gradient (Bot -> Mid -> Top)
    vec3 lowerBand = mix(uSkyBot, uSkyMid, smoothstep(0.0, 0.34, elev));
    vec3 sky = mix(lowerBand, uSkyTop, smoothstep(0.28, 0.88, elev));

    // Subtle gouache wash mottling across the sky vault!
    float wash = fbm(dir.xz * 2.8 + vec2(dir.y * 2.4, 1.3));
    sky *= 0.94 + wash * 0.12;

    // Warm Mie sun radiance & disc
    float sunDot = max(dot(dir, normalize(uSunDir)), 0.0);
    sky += uSunColor * pow(sunDot, 7.0) * 0.24;
    sky += uSunColor * pow(sunDot, 90.0) * 0.55;

    // Soft painterly twilight stars (for night & timelapse scenes!)
    if (uStarStrength > 0.01 && dir.y > 0.05) {
      vec2 starUV = floor(vec2(atan(dir.x, dir.z) * 42.0, dir.y * 55.0));
      float st = hash21(starUV);
      if (st > 0.986) {
        float twinkle = 0.65 + 0.35 * sin(uTime * 2.8 + st * 90.0);
        sky += vec3(1.0, 0.94, 0.82) * uStarStrength * twinkle * smoothstep(0.05, 0.28, dir.y);
      }
    }

    // Painterly gouache cumulus clouds
    if (uCloudCover > 0.02 && dir.y > 0.02) {
      vec2 baseUV = dir.xz / (dir.y + 0.25);
      vec2 cUV = vec2(baseUV.x * 0.65, baseUV.y * 1.25) + vec2(uTime * 0.016, 0.0);
      float n = fbm(cUV * 1.15) * 0.72 + fbm(cUV * 2.4 + vec2(3.1, -1.5)) * 0.28;
      float thresh = 1.0 - uCloudCover;
      float dens = smoothstep(thresh, thresh + 0.11, n);
      float nUp = fbm((cUV + vec2(0.0, 0.08)) * 1.15);
      float lit = clamp((n - nUp) * 3.0 + 0.74, 0.0, 1.0);
      vec3 cCol = mix(uCloudShadow, uCloudLight, lit);
      sky = mix(sky, cCol, dens * smoothstep(0.02, 0.14, dir.y) * 0.92);
    }

    vec3 col = mix(uGround, sky, smoothstep(-0.08, 0.03, dir.y));
    gl_FragColor = vec4(col, 1.0);
  }
`;

export type GouacheMoodKey =
  | "morning_rush"
  | "afternoon_tired"
  | "biology_digest"
  | "biology_heart"
  | "maslow_twilight"
  | "night_sleep"
  | "sunny_park";

export interface GouacheMoodSpec {
  skyTop: string;
  skyMid: string;
  skyBot: string;
  ground: string;
  sunColor: string;
  cloudLight: string;
  cloudShadow: string;
  sunDir: [number, number, number];
  cloudCover: number;
  starStrength: number;
  sunIntensity: number;
  hemiIntensity: number;
  fillIntensity: number;
  envIntensity: number;
  fogColor: string;
  fogDensity: number;
}

export const GOUACHE_MOODS: Record<GouacheMoodKey, GouacheMoodSpec> = {
  morning_rush: {
    skyTop: "#496588",
    skyMid: "#948A9E",
    skyBot: "#E8B388",
    ground: "#483834",
    sunColor: "#FFD79B",
    cloudLight: "#FFF0D6",
    cloudShadow: "#A592A2",
    sunDir: [0.55, 0.42, -0.72],
    cloudCover: 0.46,
    starStrength: 0.0,
    sunIntensity: 2.0,
    hemiIntensity: 0.95,
    fillIntensity: 0.65,
    envIntensity: 0.58,
    fogColor: "#D8B89C",
    fogDensity: 0.008,
  },
  afternoon_tired: {
    skyTop: "#354962",
    skyMid: "#6D7A8C",
    skyBot: "#C6B49E",
    ground: "#3D3532",
    sunColor: "#F2D5B0",
    cloudLight: "#E8DED2",
    cloudShadow: "#7A8494",
    sunDir: [0.25, 0.62, -0.74],
    cloudCover: 0.56,
    starStrength: 0.0,
    sunIntensity: 1.55,
    hemiIntensity: 0.82,
    fillIntensity: 0.56,
    envIntensity: 0.5,
    fogColor: "#8A8D96",
    fogDensity: 0.01,
  },
  biology_digest: {
    skyTop: "#142E38",
    skyMid: "#1F5662",
    skyBot: "#2E7B82",
    ground: "#0E242C",
    sunColor: "#FFE2A8",
    cloudLight: "#A8ECE2",
    cloudShadow: "#1B4B56",
    sunDir: [0.4, 0.72, 0.58],
    cloudCover: 0.0,
    starStrength: 0.0,
    sunIntensity: 2.25,
    hemiIntensity: 1.05,
    fillIntensity: 0.85,
    envIntensity: 0.72,
    fogColor: "#193F4A",
    fogDensity: 0.024,
  },
  biology_heart: {
    skyTop: "#281424",
    skyMid: "#522134",
    skyBot: "#853844",
    ground: "#1E0F1B",
    sunColor: "#FFD4A8",
    cloudLight: "#F5B8A8",
    cloudShadow: "#522134",
    sunDir: [0.48, 0.62, 0.62],
    cloudCover: 0.0,
    starStrength: 0.0,
    sunIntensity: 2.4,
    hemiIntensity: 0.98,
    fillIntensity: 0.82,
    envIntensity: 0.72,
    fogColor: "#3D1B2A",
    fogDensity: 0.025,
  },
  maslow_twilight: {
    skyTop: "#1B122C",
    skyMid: "#3B2246",
    skyBot: "#7E484A",
    ground: "#181024",
    sunColor: "#F8C264",
    cloudLight: "#E8A67E",
    cloudShadow: "#3B2246",
    sunDir: [-0.35, 0.55, 0.76],
    cloudCover: 0.0,
    starStrength: 0.55,
    sunIntensity: 2.2,
    hemiIntensity: 0.88,
    fillIntensity: 0.78,
    envIntensity: 0.62,
    fogColor: "#241736",
    fogDensity: 0.022,
  },
  night_sleep: {
    skyTop: "#12162E",
    skyMid: "#232852",
    skyBot: "#3E3F6E",
    ground: "#141628",
    sunColor: "#A8D4FF",
    cloudLight: "#6E78A8",
    cloudShadow: "#1E2242",
    sunDir: [-0.4, 0.58, -0.7],
    cloudCover: 0.25,
    starStrength: 0.95,
    sunIntensity: 1.25,
    hemiIntensity: 0.78,
    fillIntensity: 0.58,
    envIntensity: 0.48,
    fogColor: "#1A1E3A",
    fogDensity: 0.016,
  },
  sunny_park: {
    skyTop: "#2E78B8",
    skyMid: "#7EC2E6",
    skyBot: "#FFF0CC",
    ground: "#527C5E",
    sunColor: "#FFE29A",
    cloudLight: "#FFF8E8",
    cloudShadow: "#B6D4E8",
    sunDir: [0.58, 0.52, -0.62],
    cloudCover: 0.44,
    starStrength: 0.0,
    sunIntensity: 2.55,
    hemiIntensity: 1.05,
    fillIntensity: 0.72,
    envIntensity: 0.68,
    fogColor: "#D8E8D8",
    fogDensity: 0.0085,
  },
};

export function buildGouachePMREMCache(
  gl: THREE.WebGLRenderer
): Record<GouacheMoodKey, THREE.Texture> {
  const pmrem = new THREE.PMREMGenerator(gl);
  pmrem.compileEquirectangularShader();
  const out = {} as Record<GouacheMoodKey, THREE.Texture>;

  (Object.keys(GOUACHE_MOODS) as GouacheMoodKey[]).forEach((k) => {
    const m = GOUACHE_MOODS[k];
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 128;
    const g = c.getContext("2d")!;
    const gr = g.createLinearGradient(0, 0, 0, 128);
    gr.addColorStop(0.0, m.skyTop);
    gr.addColorStop(0.32, m.skyMid);
    gr.addColorStop(0.50, m.skyBot);
    gr.addColorStop(0.62, m.ground);
    gr.addColorStop(1.0, m.ground);
    g.fillStyle = gr;
    g.fillRect(0, 0, 256, 128);

    const sg = g.createRadialGradient(90, 38, 2, 90, 38, 36);
    sg.addColorStop(0.0, m.sunColor);
    sg.addColorStop(0.5, "rgba(255,240,204,0.35)");
    sg.addColorStop(1.0, "rgba(255,240,204,0.0)");
    g.fillStyle = sg;
    g.fillRect(0, 0, 256, 128);

    const eq = new THREE.CanvasTexture(c);
    eq.mapping = THREE.EquirectangularReflectionMapping;
    eq.colorSpace = THREE.SRGBColorSpace;
    const rt = pmrem.fromEquirectangular(eq);
    out[k] = rt.texture;
    eq.dispose();
  });

  pmrem.dispose();
  return out;
}
