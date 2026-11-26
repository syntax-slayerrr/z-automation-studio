import * as THREE from "three";

/**
 * PracticalLampKit — 4-Layer Voxelverse/Pixar Practical Room Lamp & Atmospheric Glow System
 *
 * 100% safe on headless Chromium `--gl=angle` (ZERO `@react-three/postprocessing` crashes!).
 * Distilled from frame-by-frame lighting REA of `galeri-motion-voxelverse.mp4`:
 *  Every practical room lamp combines 4 synchronized physical layers:
 *   1. Hot Emissive Bulb Core (`#FFF4D6`)
 *   2. Warm Translucent Shade (emissive glow when lit so lamp shades feel alive, not dead plastic!)
 *   3. Physically Motivated `PointLight` with `decay = 2` (carves real warm radial wall pools & rim light)
 *   4. Smooth Gaussian Additive Halo Sprite + Custom GLSL Fresnel-Faded Volumetric Light Cone!
 */

const haloTexCache = new Map<string, THREE.CanvasTexture>();

export function getGaussianHaloTexture(
  innerHex = "#FFF7DC",
  midHex = "#FFB252",
  outerHex = "#FF7B24"
): THREE.CanvasTexture {
  const key = `${innerHex}_${midHex}_${outerHex}`;
  const cached = haloTexCache.get(key);
  if (cached) return cached;

  const size = 256;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const g = c.getContext("2d")!;
  const half = size / 2;

  const gr = g.createRadialGradient(half, half, 0, half, half, half);
  gr.addColorStop(0.0, innerHex);
  gr.addColorStop(0.16, innerHex);
  gr.addColorStop(0.36, `${midHex}B8`);
  gr.addColorStop(0.66, `${outerHex}38`);
  gr.addColorStop(1.0, "rgba(0,0,0,0)");

  g.fillStyle = gr;
  g.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  haloTexCache.set(key, tex);
  return tex;
}

/**
 * Custom GLSL Volumetric Light Cone Material:
 *  - Soft vertical fade (strongest near bulb top, smoothly dissolves toward bottom)
 *  - View-angle Fresnel edge softening so cone silhouette NEVER shows harsh polygon edges!
 */
export function createVolumetricConeMaterial(
  colorHex = "#FFC372",
  opacity = 0.14
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
      varying vec3 vNormalView;
      varying vec3 vViewDir;
      void main() {
        vUv = uv;
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vNormalView = normalize(normalMatrix * normal);
        vViewDir = normalize(-mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec2 vUv;
      varying vec3 vNormalView;
      varying vec3 vViewDir;
      void main() {
        // vUv.y = 1.0 at top (near bulb), 0.0 at bottom wide opening
        float vertFade = pow(clamp(vUv.y, 0.0, 1.0), 1.65) * smoothstep(1.0, 0.88, vUv.y);
        float edgeSoft = pow(abs(dot(normalize(vNormalView), normalize(vViewDir))), 1.45);
        float alpha = vertFade * edgeSoft * uOpacity;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
  });
}

export interface PracticalLampHandle {
  group: THREE.Group;
  light: THREE.PointLight;
  haloSprite: THREE.Sprite;
  coneMat: THREE.ShaderMaterial;
  shadeMat: THREE.MeshStandardMaterial;
  bulbMat: THREE.MeshBasicMaterial;
  /** Dynamically adjusts warmth/glow intensity (`0 = off`, `1 = cozy warm night`, `0.25 = subtle daytime`) */
  setIntensity: (level: number, t?: number) => void;
}

/**
 * 1. Modern Warm Studio Ceiling Pendant Lamp (Voxelverse SH01 hero lamp!)
 * Designed for 5cm-per-unit room scale (`scale = 1.0` for `ZaldyBedroom3D`, or `0.05` for metric rooms).
 */
export function buildPendantLamp3D(opts?: {
  rodLength?: number;
  shadeRadiusTop?: number;
  shadeRadiusBot?: number;
  shadeHeight?: number;
  coneRadius?: number;
  coneHeight?: number;
  lightColor?: string;
  baseLightIntensity?: number;
  lightDistance?: number;
  haloScale?: number;
  baseConeOpacity?: number;
}): PracticalLampHandle {
  const rodLen = opts?.rodLength ?? 13.0;
  const rTop = opts?.shadeRadiusTop ?? 2.3;
  const rBot = opts?.shadeRadiusBot ?? 3.1;
  const sH = opts?.shadeHeight ?? 2.8;
  const cRad = opts?.coneRadius ?? 13.5;
  const cH = opts?.coneHeight ?? 23.0;
  const lightColor = opts?.lightColor ?? "#FFB866";
  const baseInt = opts?.baseLightIntensity ?? 4.2;
  const lightDist = opts?.lightDistance ?? 58.0;
  const haloScale = opts?.haloScale ?? 12.5;
  const baseConeOp = opts?.baseConeOpacity ?? 0.13;

  const group = new THREE.Group();
  group.name = "PracticalPendantLamp3D";

  const rodMat = new THREE.MeshStandardMaterial({ color: "#1C212B", roughness: 0.45, metalness: 0.65 });
  const canopy = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.3, 0.5, 20), rodMat);
  canopy.position.y = rodLen;
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, rodLen, 12), rodMat);
  rod.position.y = rodLen * 0.5;
  group.add(canopy, rod);

  // Warm linen/ceramic translucent shade (glows softly amber when lit!)
  const shadeMat = new THREE.MeshStandardMaterial({
    color: "#E8C9A4",
    emissive: "#E27D32",
    emissiveIntensity: 0.75,
    roughness: 0.72,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, sH, 28, 1, true), shadeMat);
  shade.position.y = -sH * 0.25;
  const shadeCap = new THREE.Mesh(new THREE.CircleGeometry(rTop, 28), rodMat);
  shadeCap.rotation.x = -Math.PI / 2;
  shadeCap.position.y = sH * 0.25;
  group.add(shade, shadeCap);

  // Hot emissive bulb core
  const bulbMat = new THREE.MeshBasicMaterial({ color: "#FFF6DB", toneMapped: false });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.92, 18, 14), bulbMat);
  bulb.position.y = -sH * 0.48;
  group.add(bulb);

  // Additive Gaussian radial halo sprite around bulb
  const haloMat = new THREE.SpriteMaterial({
    map: getGaussianHaloTexture("#FFF8E0", "#FFB85C", "#F97316"),
    transparent: true,
    opacity: 0.82,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const haloSprite = new THREE.Sprite(haloMat);
  haloSprite.position.set(0, -sH * 0.58, 0);
  haloSprite.scale.set(haloScale, haloScale, 1);
  group.add(haloSprite);

  // Soft Fresnel-faded downward volumetric light cone
  const coneMat = createVolumetricConeMaterial(lightColor, baseConeOp);
  const coneGeo = new THREE.CylinderGeometry(rBot * 0.85, cRad, cH, 28, 1, true);
  const coneMesh = new THREE.Mesh(coneGeo, coneMat);
  coneMesh.position.y = -sH * 0.5 - cH * 0.5;
  group.add(coneMesh);

  // Real physical PointLight calibrated for 5cm-unit room scale (`decay = 1.45` so warm tungsten visibly washes faces & walls!)
  const light = new THREE.PointLight(lightColor, baseInt, lightDist, 1.45);
  light.position.set(0, -sH * 0.75, 0);
  group.add(light);

  const setIntensity = (level: number, t = 0) => {
    const k = Math.max(0, level);
    const flicker = 1 + Math.sin(t * 5.2) * 0.012 + Math.cos(t * 11.3) * 0.006;
    const eff = k * flicker;
    light.intensity = baseInt * eff;
    shadeMat.emissiveIntensity = 0.08 + 0.85 * eff;
    haloMat.opacity = Math.min(0.95, 0.78 * eff);
    haloSprite.visible = eff > 0.03;
    coneMat.uniforms.uOpacity.value = baseConeOp * eff;
    coneMesh.visible = eff > 0.05;
    bulbMat.color.set(eff > 0.1 ? "#FFF6DB" : "#78716C");
  };

  return { group, light, haloSprite, coneMat, shadeMat, bulbMat, setIntensity };
}

/**
 * 2. Tall Modern Corner Floor Lamp (Voxelverse SH03 rear-corner wall-wash lamp!)
 * Placed near a cream plaster wall so it casts a gorgeous soft radial warm glow behind characters & bookshelves!
 */
export function buildFloorCornerLamp3D(opts?: {
  height?: number;
  lightColor?: string;
  baseLightIntensity?: number;
  lightDistance?: number;
  haloScale?: number;
}): PracticalLampHandle {
  const H = opts?.height ?? 29.5;
  const lightColor = opts?.lightColor ?? "#FFC078";
  const baseInt = opts?.baseLightIntensity ?? 4.8;
  const lightDist = opts?.lightDistance ?? 52.0;
  const haloScale = opts?.haloScale ?? 14.0;

  const group = new THREE.Group();
  group.name = "PracticalFloorCornerLamp3D";

  const brassMat = new THREE.MeshStandardMaterial({ color: "#B8914B", roughness: 0.34, metalness: 0.76 });
  const darkBaseMat = new THREE.MeshStandardMaterial({ color: "#1F242D", roughness: 0.5, metalness: 0.55 });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.9, 0.7, 24), darkBaseMat);
  base.position.y = 0.35;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, H - 3.0, 14), brassMat);
  pole.position.y = (H - 3.0) * 0.5 + 0.6;
  group.add(base, pole);

  const shadeMat = new THREE.MeshStandardMaterial({
    color: "#F6E7CF",
    emissive: "#E68A3E",
    emissiveIntensity: 0.85,
    roughness: 0.78,
    side: THREE.DoubleSide,
  });
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 3.4, 4.4, 28, 1, true), shadeMat);
  shade.position.y = H - 1.5;
  group.add(shade);

  const bulbMat = new THREE.MeshBasicMaterial({ color: "#FFF7E2", toneMapped: false });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.95, 16, 14), bulbMat);
  bulb.position.y = H - 1.8;
  group.add(bulb);

  const haloMat = new THREE.SpriteMaterial({
    map: getGaussianHaloTexture("#FFF8E3", "#FFC070", "#F97316"),
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const haloSprite = new THREE.Sprite(haloMat);
  haloSprite.position.set(0, H - 1.6, 0);
  haloSprite.scale.set(haloScale, haloScale, 1);
  group.add(haloSprite);

  const coneMat = createVolumetricConeMaterial(lightColor, 0.11);
  const coneMesh = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 11.5, 22.0, 24, 1, true), coneMat);
  coneMesh.position.y = H - 14.5;
  group.add(coneMesh);

  // Offset light slightly outward from shade center so it smoothly washes the adjacent wall & shelf!
  const light = new THREE.PointLight(lightColor, baseInt, lightDist, 1.45);
  light.position.set(1.8, H - 1.5, 0.8);
  group.add(light);

  const setIntensity = (level: number, t = 0) => {
    const k = Math.max(0, level);
    const flicker = 1 + Math.sin(t * 4.1 + 1.2) * 0.01;
    const eff = k * flicker;
    light.intensity = baseInt * eff;
    shadeMat.emissiveIntensity = 0.06 + 0.92 * eff;
    haloMat.opacity = Math.min(0.92, 0.80 * eff);
    haloSprite.visible = eff > 0.03;
    coneMat.uniforms.uOpacity.value = 0.11 * eff;
    coneMesh.visible = eff > 0.05;
    bulbMat.color.set(eff > 0.1 ? "#FFF7E2" : "#78716C");
  };

  return { group, light, haloSprite, coneMat, shadeMat, bulbMat, setIntensity };
}

/**
 * 3. Reusable Additive Halo + Volumetric Cone Add-on for Existing Desk / Bedside Lamps!
 * Attaches seamlessly onto a nightstand or workstation desk lamp to give genuine Pixar/Voxelverse glow.
 */
export function buildLampGlowAddon3D(opts?: {
  lightColor?: string;
  innerHex?: string;
  midHex?: string;
  outerHex?: string;
  haloScale?: number;
  coneTopR?: number;
  coneBotR?: number;
  coneHeight?: number;
  baseConeOpacity?: number;
  baseLightIntensity?: number;
  lightDistance?: number;
  coneTiltX?: number;
  coneTiltZ?: number;
}): {
  group: THREE.Group;
  light: THREE.PointLight;
  haloSprite: THREE.Sprite;
  coneMat: THREE.ShaderMaterial;
  setIntensity: (level: number, t?: number) => void;
} {
  const lightColor = opts?.lightColor ?? "#FFAD54";
  const haloScale = opts?.haloScale ?? 9.5;
  const coneTopR = opts?.coneTopR ?? 1.4;
  const coneBotR = opts?.coneBotR ?? 7.2;
  const coneH = opts?.coneHeight ?? 11.5;
  const baseConeOp = opts?.baseConeOpacity ?? 0.14;
  const baseInt = opts?.baseLightIntensity ?? 3.6;
  const lightDist = opts?.lightDistance ?? 38.0;

  const group = new THREE.Group();

  const haloMat = new THREE.SpriteMaterial({
    map: getGaussianHaloTexture(
      opts?.innerHex ?? "#FFF8DF",
      opts?.midHex ?? "#FFAE4E",
      opts?.outerHex ?? "#EA580C"
    ),
    transparent: true,
    opacity: 0.86,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const haloSprite = new THREE.Sprite(haloMat);
  haloSprite.scale.set(haloScale, haloScale, 1);
  group.add(haloSprite);

  const coneMat = createVolumetricConeMaterial(lightColor, baseConeOp);
  const conePivot = new THREE.Group();
  conePivot.rotation.set(opts?.coneTiltX ?? 0, 0, opts?.coneTiltZ ?? 0);
  const coneMesh = new THREE.Mesh(new THREE.CylinderGeometry(coneTopR, coneBotR, coneH, 24, 1, true), coneMat);
  coneMesh.position.y = -coneH * 0.5;
  conePivot.add(coneMesh);
  group.add(conePivot);

  const light = new THREE.PointLight(lightColor, baseInt, lightDist, 1.45);
  group.add(light);

  const setIntensity = (level: number, t = 0) => {
    const k = Math.max(0, level);
    const eff = k * (1 + Math.sin(t * 4.8 + 0.5) * 0.012);
    light.intensity = baseInt * eff;
    haloMat.opacity = Math.min(0.94, 0.82 * eff);
    haloSprite.visible = eff > 0.03;
    coneMat.uniforms.uOpacity.value = baseConeOp * eff;
    coneMesh.visible = eff > 0.05;
  };

  return { group, light, haloSprite, coneMat, setIntensity };
}
