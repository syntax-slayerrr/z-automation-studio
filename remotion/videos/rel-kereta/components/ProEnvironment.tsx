import React, { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

export type LightingMood = "day" | "rain" | "heat" | "golden";

export interface ProEnvironmentProps {
  mood: LightingMood;
  frame: number;
  fps?: number;
}

const SKY_VERTEX_SHADER = `
  varying vec3 vWorldDir;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldDir = normalize(position);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

// Smooth Rayleigh gradient + warm Mie solar glow + 5-octave volumetric FBM cumulus clouds!
const SKY_FRAGMENT_SHADER = `
  uniform float uTime;
  uniform vec3 uZenith;
  uniform vec3 uHorizon;
  uniform vec3 uGround;
  uniform vec3 uSunDir;
  uniform vec3 uSunColor;
  uniform vec3 uCloudLight;
  uniform vec3 uCloudShadow;
  uniform float uCloudCover;

  varying vec3 vWorldDir;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float amp = 0.5;
    mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 5; i++) {
      v += amp * noise(p);
      p = rot * p * 2.03 + vec2(1.7, 9.2);
      amp *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 dir = normalize(vWorldDir);
    float elev = clamp(dir.y, 0.0, 1.0);

    // Smooth Rayleigh sky gradient
    vec3 sky = mix(uHorizon, uZenith, pow(elev, 0.58));

    // Warm Mie sun disc & atmospheric scattering halo
    float sunDot = max(dot(dir, normalize(uSunDir)), 0.0);
    sky += uSunColor * pow(sunDot, 10.0) * 0.34;
    sky += uSunColor * pow(sunDot, 160.0) * 0.75;

    // Perspective volumetric FBM cumulus cloud layer (crisp high-contrast fluffy @gimanabisaid clouds!)
    if (dir.y > 0.01) {
      vec2 cloudUV = dir.xz / (dir.y + 0.30) * 1.35 + vec2(uTime * 0.016, uTime * 0.005);
      float n = fbm(cloudUV);
      float nOffset = fbm(cloudUV + normalize(uSunDir.xz) * 0.12);
      float threshold = 1.0 - uCloudCover;
      float density = smoothstep(threshold, threshold + 0.18, n);

      // Self-shadowing puff lighting (crisp bright white tops, soft blue-gray undersides)
      float lit = clamp((n - nOffset) * 2.8 + 0.72, 0.0, 1.0);
      vec3 cloudCol = mix(uCloudShadow, uCloudLight, lit);

      // Fade clouds gently near horizon mist
      float horizonFade = smoothstep(0.02, 0.16, dir.y);
      sky = mix(sky, cloudCol, density * horizonFade * 0.96);
    }

    // Blend below horizon cleanly into warm ground bounce color
    vec3 col = mix(uGround, sky, smoothstep(-0.08, 0.03, dir.y));
    gl_FragColor = vec4(col, 1.0);
  }
`;

const MOOD_PRESETS: Record<
  LightingMood,
  {
    zenith: string;
    horizon: string;
    ground: string;
    sunDir: [number, number, number];
    sunColor: string;
    cloudLight: string;
    cloudShadow: string;
    cloudCover: number;
    sunIntensity: number;
    ambientIntensity: number;
    rimColor: string;
    rimIntensity: number;
  }
> = {
  day: {
    zenith: "#1B72CE",
    horizon: "#AEDBFA",
    ground: "#D6BC98",
    sunDir: [-0.36, 0.76, 0.78],
    sunColor: "#FFF9E6",
    cloudLight: "#FFFFFF",
    cloudShadow: "#C2DAF0",
    cloudCover: 0.56,
    sunIntensity: 2.75,
    ambientIntensity: 0.72,
    rimColor: "#B8DCFF",
    rimIntensity: 0.62,
  },
  rain: {
    zenith: "#43607E",
    horizon: "#9DB5CA",
    ground: "#8A8278",
    sunDir: [-0.28, 0.76, 0.68],
    sunColor: "#E4EFF8",
    cloudLight: "#DCE6F0",
    cloudShadow: "#788FA4",
    cloudCover: 0.82,
    sunIntensity: 1.75,
    ambientIntensity: 0.78,
    rimColor: "#B2C8DC",
    rimIntensity: 0.55,
  },
  heat: {
    zenith: "#2582D0",
    horizon: "#FFE4B2",
    ground: "#E2AF78",
    sunDir: [0.06, 0.84, 0.72],
    sunColor: "#FFECA8",
    cloudLight: "#FFFBF0",
    cloudShadow: "#E2D6C0",
    cloudCover: 0.34,
    sunIntensity: 3.05,
    ambientIntensity: 0.76,
    rimColor: "#FFD99E",
    rimIntensity: 0.68,
  },
  golden: {
    zenith: "#4C6598",
    horizon: "#FAC09C",
    ground: "#B58562",
    sunDir: [0.52, 0.42, 0.72],
    sunColor: "#FFB470",
    cloudLight: "#FFE4CC",
    cloudShadow: "#C28E9C",
    cloudCover: 0.58,
    sunIntensity: 2.65,
    ambientIntensity: 0.68,
    rimColor: "#FFC08E",
    rimIntensity: 0.68,
  },
};

function buildEquirectIBLTexture(preset: (typeof MOOD_PRESETS)["day"]): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0.0, preset.zenith);
  grad.addColorStop(0.46, preset.horizon);
  grad.addColorStop(0.54, preset.ground);
  grad.addColorStop(1.0, "#4B3828");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 128);

  // Warm solar specular lobe for metallic steel rails & glass marble reflections
  const sunG = ctx.createRadialGradient(84, 34, 2, 84, 34, 28);
  sunG.addColorStop(0.0, preset.sunColor);
  sunG.addColorStop(0.45, "rgba(255, 248, 224, 0.45)");
  sunG.addColorStop(1.0, "rgba(255, 248, 224, 0.0)");
  ctx.fillStyle = sunG;
  ctx.fillRect(0, 0, 256, 128);

  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export const ProEnvironment: React.FC<ProEnvironmentProps> = ({ mood, frame, fps = 30 }) => {
  const { gl, scene } = useThree();
  const preset = MOOD_PRESETS[mood];

  // Generate hardware-filtered synthetic PMREM HDRI environment per mood!
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    pmrem.compileEquirectangularShader();
    const rawTex = buildEquirectIBLTexture(preset);
    const envRT = pmrem.fromEquirectangular(rawTex);
    scene.environment = envRT.texture;
    scene.environmentIntensity = mood === "rain" ? 0.55 : 0.78;
    return () => {
      rawTex.dispose();
      envRT.dispose();
      pmrem.dispose();
    };
  }, [gl, scene, mood, preset]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uZenith: { value: new THREE.Color(preset.zenith) },
      uHorizon: { value: new THREE.Color(preset.horizon) },
      uGround: { value: new THREE.Color(preset.ground) },
      uSunDir: { value: new THREE.Vector3(...preset.sunDir) },
      uSunColor: { value: new THREE.Color(preset.sunColor) },
      uCloudLight: { value: new THREE.Color(preset.cloudLight) },
      uCloudShadow: { value: new THREE.Color(preset.cloudShadow) },
      uCloudCover: { value: preset.cloudCover },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Deterministic uniform updates every frame
  uniforms.uTime.value = frame / fps;
  uniforms.uZenith.value.set(preset.zenith);
  uniforms.uHorizon.value.set(preset.horizon);
  uniforms.uGround.value.set(preset.ground);
  uniforms.uSunDir.value.set(...preset.sunDir);
  uniforms.uSunColor.value.set(preset.sunColor);
  uniforms.uCloudLight.value.set(preset.cloudLight);
  uniforms.uCloudShadow.value.set(preset.cloudShadow);
  uniforms.uCloudCover.value = preset.cloudCover;

  return (
    <>
      {/* 1. Custom GLSL Rayleigh + Volumetric FBM Cloud Sky Dome */}
      <mesh position={[0, 0, 0]} renderOrder={-10}>
        <sphereGeometry args={[68, 32, 24]} />
        <shaderMaterial
          vertexShader={SKY_VERTEX_SHADER}
          fragmentShader={SKY_FRAGMENT_SHADER}
          uniforms={uniforms}
          side={THREE.BackSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* 2. Primary Sun Key Light with High-Res 2048px Soft Shadows */}
      <directionalLight
        position={[preset.sunDir[0] * 18, preset.sunDir[1] * 18, preset.sunDir[2] * 18]}
        intensity={preset.sunIntensity}
        color={preset.sunColor}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-11}
        shadow-camera-right={11}
        shadow-camera-top={11}
        shadow-camera-bottom={-5}
        shadow-camera-near={1}
        shadow-camera-far={42}
        shadow-bias={-0.0003}
        shadow-normalBias={0.025}
      />

      {/* 3. Cool Opposite Rim / Fill Light separating dark silhouettes */}
      <directionalLight
        position={[10, 6, -8]}
        intensity={preset.rimIntensity}
        color={preset.rimColor}
      />

      {/* 4. Subtle Sky/Earth Hemisphere Fill complementing PMREM IBL */}
      <hemisphereLight args={[preset.horizon, preset.ground, preset.ambientIntensity]} />
    </>
  );
};
