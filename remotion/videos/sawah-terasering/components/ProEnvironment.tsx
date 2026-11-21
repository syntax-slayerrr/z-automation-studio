import React, { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

export interface ProEnvironmentProps {
  rainFactor: number; // Continuous 0..1 monsoon storm blend
  sunsetFactor: number; // Continuous 0..1 golden sunset blend
  frame: number;
  fps?: number;
}

const SKY_VERTEX = `
  varying vec3 vWorldDir;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldDir = normalize(position);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

// Sculpted Tropical Mountain Cumulus Sky Dome with warm solar scattering & atmospheric valley mist
const SKY_FRAGMENT = `
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

    vec3 sky = mix(uHorizon, uZenith, pow(elev, 0.54));

    // Warm golden Mie solar glow
    float sunDot = max(dot(dir, normalize(uSunDir)), 0.0);
    sky += uSunColor * pow(sunDot, 10.0) * 0.22;
    sky += uSunColor * pow(sunDot, 120.0) * 0.45;

    // Crisp horizontal perspective cumulus clouds
    if (dir.y > 0.015) {
      vec2 baseUV = dir.xz / (dir.y + 0.22);
      vec2 cloudUV = vec2(baseUV.x * 0.70, baseUV.y * 1.45) + vec2(uTime * 0.014, 0.0);
      float n1 = fbm(cloudUV * 1.15);
      float n2 = fbm(cloudUV * 2.35 + vec2(4.2, -1.8));
      float n = n1 * 0.74 + n2 * 0.26;

      float threshold = 1.0 - uCloudCover;
      float density = smoothstep(threshold, threshold + 0.088, n);

      float nUp = fbm((cloudUV + vec2(0.0, 0.09)) * 1.15) * 0.74 + n2 * 0.26;
      float lit = clamp((n - nUp) * 3.4 + 0.78, 0.0, 1.0);
      vec3 cloudCol = mix(uCloudShadow, uCloudLight, lit);

      float horizonFade = smoothstep(0.02, 0.13, dir.y);
      sky = mix(sky, cloudCol, density * horizonFade * 0.96);
    }

    vec3 col = mix(uGround, sky, smoothstep(-0.06, 0.02, dir.y));
    gl_FragColor = vec4(col, 1.0);
  }
`;

const DAY = {
  zenith: new THREE.Color("#1E78D4"),
  horizon: new THREE.Color("#C2E6FD"),
  ground: new THREE.Color("#A8C29E"),
  sunDir: new THREE.Vector3(-0.48, 0.72, 0.86),
  sunColor: new THREE.Color("#FFF8E8"),
  cloudLight: new THREE.Color("#FFFFFF"),
  cloudShadow: new THREE.Color("#C4DFF6"),
  cloudCover: 0.48,
  sunIntensity: 2.65,
  hemiIntensity: 0.94,
  fillIntensity: 0.54,
};

const RAIN = {
  zenith: new THREE.Color("#36506C"),
  horizon: new THREE.Color("#8DA5BC"),
  ground: new THREE.Color("#6B7672"),
  sunDir: new THREE.Vector3(-0.32, 0.76, 0.8),
  sunColor: new THREE.Color("#DCEAF6"),
  cloudLight: new THREE.Color("#CEDCE8"),
  cloudShadow: new THREE.Color("#667C92"),
  cloudCover: 0.78,
  sunIntensity: 1.38,
  hemiIntensity: 0.98,
  fillIntensity: 0.48,
};

const SUNSET = {
  zenith: new THREE.Color("#4D629C"),
  horizon: new THREE.Color("#FBB98E"),
  ground: new THREE.Color("#B8845A"),
  sunDir: new THREE.Vector3(-0.62, 0.36, 0.74),
  sunColor: new THREE.Color("#FFAE62"),
  cloudLight: new THREE.Color("#FFE4CE"),
  cloudShadow: new THREE.Color("#C48498"),
  cloudCover: 0.54,
  sunIntensity: 2.35,
  hemiIntensity: 0.88,
  fillIntensity: 0.46,
};

function buildIBL(isSunset: boolean, isRain: boolean): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  const p = isSunset ? SUNSET : isRain ? RAIN : DAY;

  const grad = ctx.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0.0, `#${p.zenith.getHexString()}`);
  grad.addColorStop(0.46, `#${p.horizon.getHexString()}`);
  grad.addColorStop(0.55, `#${p.ground.getHexString()}`);
  grad.addColorStop(1.0, "#4B3B28");
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
  rainFactor,
  sunsetFactor,
  frame,
  fps = 30,
}) => {
  const { gl, scene } = useThree();
  const rf = Math.max(0, Math.min(1, rainFactor));
  const sf = Math.max(0, Math.min(1, sunsetFactor));
  const moodKey = sf > 0.45 ? "sunset" : rf > 0.45 ? "rain" : "day";

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    pmrem.compileEquirectangularShader();
    const rawTex = buildIBL(moodKey === "sunset", moodKey === "rain");
    const envRT = pmrem.fromEquirectangular(rawTex);
    scene.environment = envRT.texture;
    scene.environmentIntensity = moodKey === "rain" ? 0.5 : 0.62;
    return () => {
      rawTex.dispose();
      envRT.dispose();
      pmrem.dispose();
    };
  }, [gl, scene, moodKey]);

  const blended = useMemo(() => {
    const mixC = (a: THREE.Color, b: THREE.Color, c: THREE.Color) => {
      const out = a.clone();
      if (rf > 0) out.lerp(b, rf);
      if (sf > 0) out.lerp(c, sf);
      return out;
    };
    const mixN = (a: number, b: number, c: number) => {
      let v = a + (b - a) * rf;
      v = v + (c - v) * sf;
      return v;
    };
    const sunDir = DAY.sunDir.clone();
    if (rf > 0) sunDir.lerp(RAIN.sunDir, rf);
    if (sf > 0) sunDir.lerp(SUNSET.sunDir, sf);

    return {
      zenith: mixC(DAY.zenith, RAIN.zenith, SUNSET.zenith),
      horizon: mixC(DAY.horizon, RAIN.horizon, SUNSET.horizon),
      ground: mixC(DAY.ground, RAIN.ground, SUNSET.ground),
      sunColor: mixC(DAY.sunColor, RAIN.sunColor, SUNSET.sunColor),
      cloudLight: mixC(DAY.cloudLight, RAIN.cloudLight, SUNSET.cloudLight),
      cloudShadow: mixC(DAY.cloudShadow, RAIN.cloudShadow, SUNSET.cloudShadow),
      sunDir,
      cloudCover: mixN(DAY.cloudCover, RAIN.cloudCover, SUNSET.cloudCover),
      sunIntensity: mixN(DAY.sunIntensity, RAIN.sunIntensity, SUNSET.sunIntensity),
      hemiIntensity: mixN(DAY.hemiIntensity, RAIN.hemiIntensity, SUNSET.hemiIntensity),
      fillIntensity: mixN(DAY.fillIntensity, RAIN.fillIntensity, SUNSET.fillIntensity),
    };
  }, [rf, sf]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uZenith: { value: DAY.zenith.clone() },
      uHorizon: { value: DAY.horizon.clone() },
      uGround: { value: DAY.ground.clone() },
      uSunDir: { value: DAY.sunDir.clone() },
      uSunColor: { value: DAY.sunColor.clone() },
      uCloudLight: { value: DAY.cloudLight.clone() },
      uCloudShadow: { value: DAY.cloudShadow.clone() },
      uCloudCover: { value: DAY.cloudCover },
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
      {/* 1. Custom GLSL Tropical Mountain Cumulus Sky Dome */}
      <mesh position={[0, 0, 0]} renderOrder={-10}>
        <sphereGeometry args={[78, 32, 24]} />
        <shaderMaterial
          vertexShader={SKY_VERTEX}
          fragmentShader={SKY_FRAGMENT}
          uniforms={uniforms}
          side={THREE.BackSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* 2. Primary Frontal-3/4 Tropical Sunlight (1024px Windows ANGLE Crash-Proof + Zero Acne Bias!) */}
      <directionalLight
        position={[blended.sunDir.x * 18, blended.sunDir.y * 18, blended.sunDir.z * 18]}
        intensity={blended.sunIntensity}
        color={blended.sunColor}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-6}
        shadow-camera-near={1}
        shadow-camera-far={44}
        shadow-bias={-0.0005}
        shadow-normalBias={0.045}
      />

      {/* 3. Warm Frontal Soft Fill Light (keeps IK villager face & soil cutaway richly illuminated!) */}
      <directionalLight position={[4, 3, 12]} intensity={blended.fillIntensity} color="#FFF6E8" />

      {/* 4. Cool / Sunset Rim Light separating silhouette cleanly from misty mountain valley */}
      <directionalLight
        position={[11, 6, -9]}
        intensity={0.48}
        color={sf > 0.45 ? "#FFC08A" : "#C2E2FF"}
      />

      {/* 5. Warm Sky-Earth Bounce Hemisphere Fill */}
      <hemisphereLight args={[blended.horizon, blended.ground, blended.hemiIntensity]} />
    </>
  );
};
