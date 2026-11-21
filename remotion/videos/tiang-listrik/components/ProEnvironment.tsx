import React, { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

export type WeatherMood = "day" | "rain" | "dusk";

export interface ProEnvironmentProps {
  mood: WeatherMood;
  rainFactor?: number; // Continuous 0..1 for smooth rain transitions & timelapse
  duskFactor?: number; // Continuous 0..1 for smooth dusk -> morning loop transition
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

// Crisp sculpted layered horizontal tropical cumulus clouds (1:1 match to @gimanabisaid Blender sky!)
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
    float amp = 0.52;
    mat2 rot = mat2(0.82, 0.57, -0.57, 0.82);
    for (int i = 0; i < 5; i++) {
      v += amp * noise(p);
      p = rot * p * 2.08 + vec2(3.1, 7.4);
      amp *= 0.48;
    }
    return v;
  }

  void main() {
    vec3 dir = normalize(vWorldDir);
    float elev = clamp(dir.y, 0.0, 1.0);

    // Clear azure tropical Rayleigh sky gradient
    vec3 sky = mix(uHorizon, uZenith, pow(elev, 0.54));

    // Subtle warm solar glow
    float sunDot = max(dot(dir, normalize(uSunDir)), 0.0);
    sky += uSunColor * pow(sunDot, 12.0) * 0.16;

    // Crisp horizontal perspective cumulus cloud bands (sharp sculpted edges like Blender HDRI sky)
    if (dir.y > 0.015) {
      vec2 baseUV = dir.xz / (dir.y + 0.22);
      // Stretch slightly horizontally for authentic layered cumulus cloud strata
      vec2 cloudUV = vec2(baseUV.x * 0.72, baseUV.y * 1.48) + vec2(uTime * 0.012, 0.0);
      float n1 = fbm(cloudUV * 1.15);
      float n2 = fbm(cloudUV * 2.35 + vec2(4.2, -1.8));
      float n = n1 * 0.74 + n2 * 0.26;

      // Crisp sculpted cloud boundary (NOT blurry smeared fog!)
      float threshold = 1.0 - uCloudCover;
      float density = smoothstep(threshold, threshold + 0.085, n);

      // Sunlit bright white tops, subtle blue-grey bottom edges
      float nUp = fbm((cloudUV + vec2(0.0, 0.09)) * 1.15) * 0.74 + n2 * 0.26;
      float lit = clamp((n - nUp) * 3.4 + 0.78, 0.0, 1.0);
      vec3 cloudCol = mix(uCloudShadow, uCloudLight, lit);

      // Clean horizon fade
      float horizonFade = smoothstep(0.02, 0.12, dir.y);
      sky = mix(sky, cloudCol, density * horizonFade * 0.96);
    }

    // Smooth blend into distant warm horizon below eye level
    vec3 col = mix(uGround, sky, smoothstep(-0.04, 0.02, dir.y));
    gl_FragColor = vec4(col, 1.0);
  }
`;

interface MoodPreset {
  zenith: THREE.Color;
  horizon: THREE.Color;
  ground: THREE.Color;
  sunDir: THREE.Vector3;
  sunColor: THREE.Color;
  cloudLight: THREE.Color;
  cloudShadow: THREE.Color;
  cloudCover: number;
  sunIntensity: number;
  hemiIntensity: number;
  frontFillIntensity: number;
  rimIntensity: number;
}

const DAY_PRESET: MoodPreset = {
  zenith: new THREE.Color("#1E76D0"),
  horizon: new THREE.Color("#BBE1FC"),
  ground: new THREE.Color("#D4C2A6"),
  // Frontal-left-high ~10 AM tropical sun: illuminates character face under caping AND casts crisp diagonal yard shadows!
  sunDir: new THREE.Vector3(-0.46, 0.72, 0.88),
  sunColor: new THREE.Color("#FFF7E8"),
  cloudLight: new THREE.Color("#FFFFFF"),
  cloudShadow: new THREE.Color("#C4DDF4"),
  cloudCover: 0.49,
  sunIntensity: 2.55,
  hemiIntensity: 0.92,
  frontFillIntensity: 0.56,
  rimIntensity: 0.42,
};

const RAIN_PRESET: MoodPreset = {
  zenith: new THREE.Color("#3E5D7C"),
  horizon: new THREE.Color("#9BB2C8"),
  ground: new THREE.Color("#8B847B"),
  sunDir: new THREE.Vector3(-0.35, 0.75, 0.82),
  sunColor: new THREE.Color("#E2EEF8"),
  cloudLight: new THREE.Color("#D6E2EE"),
  cloudShadow: new THREE.Color("#748CA2"),
  cloudCover: 0.72,
  sunIntensity: 1.45,
  hemiIntensity: 0.98,
  frontFillIntensity: 0.52,
  rimIntensity: 0.45,
};

const DUSK_PRESET: MoodPreset = {
  zenith: new THREE.Color("#54689E"),
  horizon: new THREE.Color("#F6B89A"),
  ground: new THREE.Color("#A87A5C"),
  sunDir: new THREE.Vector3(-0.58, 0.44, 0.78),
  sunColor: new THREE.Color("#FFB574"),
  cloudLight: new THREE.Color("#FFE0D2"),
  cloudShadow: new THREE.Color("#B9849A"),
  cloudCover: 0.54,
  sunIntensity: 2.05,
  hemiIntensity: 0.86,
  frontFillIntensity: 0.48,
  rimIntensity: 0.58,
};

function buildEquirectIBLTexture(mood: WeatherMood): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  const p = mood === "dusk" ? DUSK_PRESET : mood === "rain" ? RAIN_PRESET : DAY_PRESET;

  const grad = ctx.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0.0, `#${p.zenith.getHexString()}`);
  grad.addColorStop(0.46, `#${p.horizon.getHexString()}`);
  grad.addColorStop(0.54, `#${p.ground.getHexString()}`);
  grad.addColorStop(1.0, "#6E543E");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 128);

  const sunG = ctx.createRadialGradient(84, 34, 2, 84, 34, 30);
  sunG.addColorStop(0.0, `#${p.sunColor.getHexString()}`);
  sunG.addColorStop(0.45, "rgba(255, 248, 224, 0.45)");
  sunG.addColorStop(1.0, "rgba(255, 248, 224, 0.0)");
  ctx.fillStyle = sunG;
  ctx.fillRect(0, 0, 256, 128);

  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export const ProEnvironment: React.FC<ProEnvironmentProps> = ({
  mood,
  rainFactor,
  duskFactor,
  frame,
  fps = 30,
}) => {
  const { gl, scene } = useThree();

  const rf = rainFactor !== undefined ? Math.max(0, Math.min(1, rainFactor)) : mood === "rain" ? 1 : 0;
  const df = duskFactor !== undefined ? Math.max(0, Math.min(1, duskFactor)) : mood === "dusk" ? 1 : 0;

  // Rebuild PMREM IBL per dominant mood
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    pmrem.compileEquirectangularShader();
    const rawTex = buildEquirectIBLTexture(mood);
    const envRT = pmrem.fromEquirectangular(rawTex);
    scene.environment = envRT.texture;
    scene.environmentIntensity = mood === "rain" ? 0.52 : mood === "dusk" ? 0.48 : 0.58;
    return () => {
      rawTex.dispose();
      envRT.dispose();
      pmrem.dispose();
    };
  }, [gl, scene, mood]);

  // Smooth continuous blend across Day / Rain / Dusk (zero hard sky snaps on timelapse & loop!)
  const blended = useMemo(() => {
    const blendColor = (dayC: THREE.Color, rainC: THREE.Color, duskC: THREE.Color) => {
      const out = dayC.clone();
      if (rf > 0) out.lerp(rainC, rf);
      if (df > 0) out.lerp(duskC, df);
      return out;
    };
    const blendNum = (d: number, r: number, du: number) => {
      let v = d + (r - d) * rf;
      v = v + (du - v) * df;
      return v;
    };
    const sunDir = DAY_PRESET.sunDir.clone();
    if (rf > 0) sunDir.lerp(RAIN_PRESET.sunDir, rf);
    if (df > 0) sunDir.lerp(DUSK_PRESET.sunDir, df);

    return {
      zenith: blendColor(DAY_PRESET.zenith, RAIN_PRESET.zenith, DUSK_PRESET.zenith),
      horizon: blendColor(DAY_PRESET.horizon, RAIN_PRESET.horizon, DUSK_PRESET.horizon),
      ground: blendColor(DAY_PRESET.ground, RAIN_PRESET.ground, DUSK_PRESET.ground),
      sunColor: blendColor(DAY_PRESET.sunColor, RAIN_PRESET.sunColor, DUSK_PRESET.sunColor),
      cloudLight: blendColor(DAY_PRESET.cloudLight, RAIN_PRESET.cloudLight, DUSK_PRESET.cloudLight),
      cloudShadow: blendColor(DAY_PRESET.cloudShadow, RAIN_PRESET.cloudShadow, DUSK_PRESET.cloudShadow),
      sunDir,
      cloudCover: blendNum(DAY_PRESET.cloudCover, RAIN_PRESET.cloudCover, DUSK_PRESET.cloudCover),
      sunIntensity: blendNum(DAY_PRESET.sunIntensity, RAIN_PRESET.sunIntensity, DUSK_PRESET.sunIntensity),
      hemiIntensity: blendNum(DAY_PRESET.hemiIntensity, RAIN_PRESET.hemiIntensity, DUSK_PRESET.hemiIntensity),
      frontFillIntensity: blendNum(
        DAY_PRESET.frontFillIntensity,
        RAIN_PRESET.frontFillIntensity,
        DUSK_PRESET.frontFillIntensity
      ),
      rimIntensity: blendNum(DAY_PRESET.rimIntensity, RAIN_PRESET.rimIntensity, DUSK_PRESET.rimIntensity),
    };
  }, [rf, df]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uZenith: { value: DAY_PRESET.zenith.clone() },
      uHorizon: { value: DAY_PRESET.horizon.clone() },
      uGround: { value: DAY_PRESET.ground.clone() },
      uSunDir: { value: DAY_PRESET.sunDir.clone() },
      uSunColor: { value: DAY_PRESET.sunColor.clone() },
      uCloudLight: { value: DAY_PRESET.cloudLight.clone() },
      uCloudShadow: { value: DAY_PRESET.cloudShadow.clone() },
      uCloudCover: { value: DAY_PRESET.cloudCover },
    }),
    []
  );

  uniforms.uTime.value = frame / fps;
  uniforms.uZenith.value.copy(blended.zenith);
  uniforms.uHorizon.value.copy(blended.horizon);
  uniforms.uGround.value.copy(blended.ground);
  uniforms.uSunDir.value.copy(blended.sunDir);
  uniforms.uSunColor.value.copy(blended.sunColor);
  uniforms.uCloudLight.value.copy(blended.cloudLight);
  uniforms.uCloudShadow.value.copy(blended.cloudShadow);
  uniforms.uCloudCover.value = blended.cloudCover;

  return (
    <>
      {/* 1. Custom GLSL Sculpted Cumulus Cloud Sky Dome */}
      <mesh position={[0, 0, 0]} renderOrder={-10}>
        <sphereGeometry args={[72, 32, 24]} />
        <shaderMaterial
          vertexShader={SKY_VERTEX_SHADER}
          fragmentShader={SKY_FRAGMENT_SHADER}
          uniforms={uniforms}
          side={THREE.BackSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* 2. Primary Frontal-3/4 Tropical Sun Key Light with Clean 2048px Shadows (Zero Acne!) */}
      <directionalLight
        position={[
          blended.sunDir.x * 18,
          blended.sunDir.y * 18,
          blended.sunDir.z * 18,
        ]}
        intensity={blended.sunIntensity}
        color={blended.sunColor}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-11}
        shadow-camera-right={11}
        shadow-camera-top={11}
        shadow-camera-bottom={-5}
        shadow-camera-near={1}
        shadow-camera-far={44}
        shadow-bias={-0.0005}
        shadow-normalBias={0.045}
      />

      {/* 3. Warm Frontal Soft Fill Light (keeps character face under caping & books warmly lit!) */}
      <directionalLight
        position={[3.5, 2.8, 12.0]}
        intensity={blended.frontFillIntensity}
        color="#FFF5E6"
      />

      {/* 4. Cool Opposite Rim Light for 3D silhouette separation */}
      <directionalLight
        position={[10, 6, -8]}
        intensity={blended.rimIntensity}
        color={df > 0.5 ? "#FFC298" : "#C4E2FF"}
      />

      {/* 5. Warm Sky/Sandy-Earth Bounce Hemisphere Fill (keeps cast shadows warm taupe, never black!) */}
      <hemisphereLight
        args={[blended.horizon, blended.ground, blended.hemiIntensity]}
      />
    </>
  );
};
