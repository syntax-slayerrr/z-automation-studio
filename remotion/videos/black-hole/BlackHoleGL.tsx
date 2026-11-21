import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { ThreeCanvas } from '@remotion/three';
import { CUES, SCENES } from './story';
import { Astronaut3D, createStarGlowTexture, MilkyWayGalaxy3D, SpaceChronograph3D } from './SpaceObjects3D';

/** Deterministically drives R3F camera shake on every frame during S5 Spaghettification. */
const CameraRig: React.FC<{ shakeX: number; shakeY: number }> = ({ shakeX, shakeY }) => {
  const { camera } = useThree();
  camera.position.set(shakeX, shakeY, 3.5);
  camera.lookAt(0, 0, 0);
  return null;
};

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));
const lerp = (a: number, b: number, t: number): number => a + (b - a) * clamp(t, 0, 1);
const easeInOut = (t: number): number => {
  const c = clamp(t, 0, 1);
  return c * c * (3 - 2 * c);
};
const easeOutCubic = (t: number): number => {
  const c = clamp(t, 0, 1);
  return 1 - Math.pow(1 - c, 3);
};

// Deterministic hash for 3D particle geometry (zero Math.random())
const hash01 = (s: number): number => {
  const x = Math.sin(s * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const VERTEX_SHADER = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

// Real-Time Schwarzschild Geodesic Raymarched Black Hole + Volumetric Doppler Accretion Disk
// + Relativistic Sky Aberration + 3D Flamm's Paraboloid Gravity Throat + Tidal Abyss + Singularity HDR Shader
const FRAGMENT_SHADER = /* glsl */ `
precision highp float;

varying vec2 vUv;

uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uCamPos;
uniform vec3 uCamTarget;
uniform float uCamRoll;
uniform float uFov;
uniform float uDiskIntensity;
uniform float uBlackHoleMix;    // 1.0 in S1, S2, S3a, S7
uniform float uHorizonMix;      // 1.0 in S3b (Hening + Relativistic Sky Collapse)
uniform float uSkyCollapse;     // 0.0 (dark hush) -> 1.0 (blazing blueshifted overhead sky orb)
uniform float uFunnelMix;       // 1.0 in S4 (3D Spacetime Metric Flip Funnel)
uniform float uFunnelFlip;      // 0.0 -> 1.0 inward flow acceleration
uniform float uTidalMix;        // 1.0 in S5 (Spaghettification roaring canyon)
uniform float uTidalPower;      // 0.0 -> 1.0 intensity
uniform float uSingularityMix;  // 1.0 in S6 (Pinpoint HDR Singularity)
uniform float uCrack;           // 0.0 -> 1.0 fracture bloom
uniform float uChromatic;       // RGB chromatic aberration amount
uniform float uExposure;        // Optical flash / exposure boost

float hash21(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

float noise2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm2(vec2 p) {
  float v = 0.0;
  float a = 0.52;
  for (int i = 0; i < 3; i++) {
    v += a * noise2(p);
    p = mat2(0.8, -0.6, 0.6, 0.8) * p * 2.12 + vec2(11.3, 7.1);
    a *= 0.48;
  }
  return v;
}

// Crisp HDR Deep-Space Starfield + Subtle Nebula sampled along bent ray direction (ultra-fast 2D spherical noise!)
vec3 sampleStarfield(vec3 dir) {
  vec3 d = normalize(dir);
  vec2 sp = vec2(atan(d.z, d.x), asin(clamp(d.y, -0.999, 0.999)));

  // Subtle deep cosmic velvet dust nebula
  float neb1 = fbm2(sp * 2.4 + vec2(1.2, -0.5));
  float neb2 = fbm2(sp * 4.8 - vec2(0.4, 2.1));
  vec3 col = vec3(0.007, 0.008, 0.020);
  col += vec3(0.036, 0.024, 0.074) * pow(neb1, 2.4);
  col += vec3(0.052, 0.026, 0.018) * pow(neb2, 3.2);

  // Sharp multi-layer stars on spherical grid
  for (int layer = 0; layer < 2; layer++) {
    float scale = layer == 0 ? 54.0 : 112.0;
    vec2 gv = sp * scale;
    vec2 id = floor(gv);
    vec2 f = fract(gv) - 0.5;
    float rnd = hash21(id + float(layer) * 91.7);
    if (rnd > 0.855) {
      vec2 off = (vec2(hash21(id * 1.7 + 3.1), hash21(id * 2.3 + 7.9)) - 0.5) * 0.65;
      float dist = length(f - off);
      float size = mix(0.045, 0.13, pow(fract(rnd * 37.3), 2.0));
      float star = exp(-dist * dist / (size * size * 0.20));
      vec3 scol = mix(vec3(0.74, 0.86, 1.0), vec3(1.0, 0.88, 0.68), fract(rnd * 19.1));
      col += scol * star * (layer == 0 ? 1.55 : 0.78);
    }
  }
  return col;
}

// ACES Filmic HDR Tone Mapping (realistic cinema highlight roll-off!)
vec3 acesToneMap(vec3 x) {
  const float a = 2.51;
  const float b = 0.03;
  const float c = 2.43;
  const float d = 0.59;
  const float e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

// Exact Analytical Equatorial Plane-Crossing Schwarzschild Black Hole Raymarcher (Interstellar DNGR Style!)
// ZERO concentric step-banding! Silky volumetric multi-filament Doppler plasma + crisp Einstein lensing arches + pitch-black shadow core!
vec3 renderBlackHole(vec2 uv) {
  vec3 ro = uCamPos;
  vec3 fwd = normalize(uCamTarget - ro);
  vec3 worldUp = vec3(sin(uCamRoll), cos(uCamRoll), 0.0);
  vec3 right = normalize(cross(fwd, worldUp));
  vec3 up = cross(right, fwd);
  vec3 rd = normalize(fwd * uFov + right * uv.x + up * uv.y);

  vec3 pos = ro;
  vec3 vel = rd;
  vec3 hVec = cross(pos, vel);
  float h2 = dot(hVec, hVec);

  vec3 accColor = vec3(0.0);
  float transmittance = 1.0;
  float minR = 1e6;
  bool captured = false;

  for (int i = 0; i < 64; i++) {
    float r = length(pos);
    minR = min(minR, r);
    if (r < 1.05) {
      captured = true;
      break;
    }
    if (r > 32.0) {
      break;
    }

    float stepSize = clamp(r * 0.095, 0.04, 0.95);
    float invR = 1.0 / r;
    float invR2 = invR * invR;
    vec3 accel = -1.5 * h2 * pos * (invR2 * invR2 * invR);

    vec3 prevPos = pos;
    vel = normalize(vel + accel * stepSize);
    pos += vel * stepSize;

    // EXACT ANALYTICAL EQUATORIAL PLANE CROSSING (y = 0) -> ZERO ZEBRA BANDING EVER!
    if ((prevPos.y > 0.0 && pos.y <= 0.0) || (prevPos.y < 0.0 && pos.y >= 0.0)) {
      float frac = abs(prevPos.y) / max(1e-5, abs(prevPos.y) + abs(pos.y));
      vec3 hit = mix(prevPos, pos, frac);
      float rHit = length(hit.xz);

      if (rHit > 1.52 && rHit < 5.65) {
        // Smooth radial falloff: razor-bright inner ISCO edge tapering gracefully into outer golden-crimson dust
        float innerEdge = smoothstep(1.52, 1.88, rHit);
        float outerEdge = smoothstep(5.65, 2.25, rHit);
        float radial = innerEdge * pow(outerEdge, 1.25);

        // Differential Keplerian logarithmic spiral plasma texture (completely continuous across every pixel!)
        float ang = atan(hit.z, hit.x);
        float omega = 1.25 / pow(rHit, 1.25);
        float swirl = ang + uTime * omega * 0.72 - log(rHit) * 3.8;

        vec2 pA = vec2(cos(swirl), sin(swirl)) * (rHit * 0.95);
        vec2 pB = vec2(cos(swirl * 2.0 - uTime * 0.25), sin(swirl * 2.0 - uTime * 0.25)) * (rHit * 1.65);
        float n1 = fbm2(pA * 1.45 + vec2(uTime * 0.06, -uTime * 0.04));
        float n2 = fbm2(pB * 1.90 - vec2(uTime * 0.08, uTime * 0.05));
        float filaments = 0.42 + 0.58 * sin(rHit * 9.5 - uTime * 1.4 + n1 * 4.8);
        float clouds = smoothstep(0.18, 0.88, n1 * 0.62 + n2 * 0.48);
        float density = radial * (0.28 + 0.85 * clouds) * (0.55 + 0.45 * filaments);

        // Physical Relativistic Doppler Beaming (approaching LEFT limb glows brighter & hotter; receding RIGHT burns deeper amber-crimson!)
        vec3 orbTan = normalize(vec3(-hit.z, 0.0, hit.x));
        float doppler = dot(orbTan, -vel);
        float beam = pow(clamp(1.0 + 0.58 * doppler, 0.36, 1.75), 1.85);

        // Rich saturated Interstellar molten blackbody palette (no washed grey blowouts!)
        float heat = clamp((1.0 - (rHit - 1.55) / 3.9) * 0.78 + clouds * 0.34 + doppler * 0.22, 0.0, 1.32);
        vec3 colCrimson = vec3(0.54, 0.05, 0.015);
        vec3 colAmber   = vec3(0.96, 0.34, 0.055);
        vec3 colGold    = vec3(1.00, 0.72, 0.24);
        vec3 colCore    = vec3(1.00, 0.95, 0.80);
        vec3 plasma = mix(colCrimson, colAmber, smoothstep(0.05, 0.46, heat));
        plasma = mix(plasma, colGold, smoothstep(0.44, 0.84, heat));
        plasma = mix(plasma, colCore, smoothstep(0.84, 1.24, heat));

        // Optical emission + realistic self-occlusion transmittance for multi-order lensed passes
        vec3 emit = plasma * density * beam * 2.25 * uDiskIntensity;
        accColor += emit * transmittance;
        transmittance *= clamp(1.0 - density * 0.72, 0.14, 1.0);
      }
    }
  }

  // Razor-crisp optical Photon Ring glow right around the critical impact shadow limb (minR ~ 1.50)
  float prRing = exp(-pow((minR - 1.52) / 0.065, 2.0));
  accColor += vec3(1.0, 0.76, 0.34) * prRing * 0.85 * uDiskIntensity * (captured ? 0.35 : 1.0);

  vec3 col = accColor;
  if (!captured) {
    // Bent background starfield dimmed slightly by passing through glowing disk dust
    col += sampleStarfield(vel) * transmittance;
  }

  // Subtle horizontal anamorphic golden cinema lens flare across blazing left Doppler limb
  float flareY = exp(-abs(uv.y + 0.01) * 32.0) * exp(-abs(uv.x + 0.12) * 2.4);
  col += vec3(1.0, 0.66, 0.24) * flareY * 0.22 * uDiskIntensity;
  float flareBlue = exp(-abs(uv.y + 0.01) * 48.0) * exp(-abs(uv.x) * 1.45);
  col += vec3(0.28, 0.56, 0.96) * flareBlue * 0.08 * uDiskIntensity;

  return col;
}

// Scene 3b: Inside Event Horizon -> Vacuum Silence -> Relativistic Blueshifted Sky Collapse!
vec3 renderHorizonInside(vec2 uv) {
  float c = uSkyCollapse;
  vec2 orbCenter = vec2(0.0, mix(0.28, 0.34, c));
  vec2 d = uv - orbCenter;
  float r = length(d);

  // Subtle quiet darkness during "Hening." (c ~ 0)
  vec3 col = vec3(0.004, 0.005, 0.012);
  // Faint dim outer stars before sky collapses
  float preStar = (1.0 - c) * 0.28;
  if (preStar > 0.01) {
    col += sampleStarfield(normalize(vec3(uv.x, uv.y, -1.2))) * preStar;
  }

  // Relativistic aberration shrinks the ENTIRE universe into a blazing blueshifted sapphire sphere!
  if (c > 0.005) {
    float orbR = mix(0.85, 0.185, c);
    // Blueshifted compressed universe interior
    float inOrb = smoothstep(orbR * 1.06, orbR * 0.86, r);
    // Radial star magnification inside the shrinking porthole
    vec3 skyDir = normalize(vec3(d / max(0.02, orbR) * 1.65, -0.7));
    vec3 insideStars = sampleStarfield(skyDir) * 2.2;
    vec3 blueCore = mix(vec3(0.18, 0.54, 0.96), vec3(0.94, 0.98, 1.0), exp(-r * r / (orbR * orbR * 0.42)));
    col += (blueCore * 1.45 + insideStars) * inOrb * c;

    // Chromatic golden-amber relativistic aberration boundary ring!
    float rim = exp(-pow((r - orbR * 0.98) / (orbR * 0.09), 2.0));
    col += vec3(1.0, 0.80, 0.42) * rim * 1.35 * c;

    // Soft volumetric sapphire halo & subtle downward light cone
    float halo = exp(-r * r / (orbR * orbR * 2.6));
    col += vec3(0.28, 0.64, 1.0) * halo * 0.45 * c;
    float coneX = abs(uv.x) / max(0.14, (orbCenter.y - uv.y + 0.24) * 0.62);
    float cone = exp(-coneX * coneX * 2.4) * smoothstep(orbCenter.y, orbCenter.y - 0.55, uv.y) * smoothstep(-1.1, -0.1, uv.y);
    col += vec3(0.26, 0.56, 0.92) * cone * 0.16 * c;
  }
  return col;
}

// Scene 4: 3D Volumetric Curved Spacetime Gravity Throat (Flamm's Paraboloid)
vec3 renderSpacetimeFunnel(vec2 uv) {
  vec2 p = uv - vec2(0.0, 0.04);
  float r = length(p);
  float ang = atan(p.y, p.x);

  // Subtle deep cosmic backdrop
  vec3 col = vec3(0.008, 0.008, 0.024);
  col += sampleStarfield(normalize(vec3(uv.x * 0.7, uv.y * 0.7, -1.0))) * 0.35;

  // Logarithmic depth coordinate along the infinite gravity throat (inward flow accelerates with uFunnelFlip!)
  float depth = -log(max(0.035, r)) * 2.15;
  float flow = depth - uTime * mix(0.65, 2.35, uFunnelFlip);

  // Glowing golden-indigo curved metric grid lines descending into the dark throat
  float ringLine = pow(0.5 + 0.5 * cos(flow * 6.28318), 22.0);
  float spokeLine = pow(0.5 + 0.5 * cos(ang * 16.0 + uFunnelFlip * 0.8 * depth), 28.0);
  float gridEnv = smoothstep(0.06, 0.22, r) * smoothstep(1.05, 0.24, r);

  vec3 gridCol = mix(vec3(0.48, 0.36, 0.92), vec3(1.0, 0.76, 0.36), uFunnelFlip * 0.75 + smoothstep(0.55, 0.14, r) * 0.55);
  col += gridCol * (ringLine * 0.85 + spokeLine * 0.52) * gridEnv;

  // Luminous one-way inward future pulses rushing toward r = 0!
  float pulse = pow(0.5 + 0.5 * sin(depth * 4.0 - uTime * 4.8), 10.0) * gridEnv;
  col += vec3(1.0, 0.62, 0.28) * pulse * (0.28 + 0.55 * uFunnelFlip);

  // Pitch-black gravity throat abyss at the very center rimmed with hot crimson-amber light
  float throatMask = smoothstep(0.11, 0.07, r);
  float throatRim = exp(-pow((r - 0.105) / 0.024, 2.0));
  col = mix(col, vec3(0.004, 0.003, 0.010), throatMask);
  col += vec3(1.0, 0.52, 0.22) * throatRim * (0.95 + 0.65 * uFunnelFlip);

  return col;
}

// Scene 5: Roaring Tidal Vortex Canyon (Spaghettification!)
vec3 renderTidalVortex(vec2 uv) {
  vec3 col = vec3(0.010, 0.006, 0.020);
  float funnelX = uv.x / mix(1.0, 0.28 + 0.72 * clamp((uv.y + 0.9) / 1.8, 0.0, 1.0), 0.75);
  float s1 = fbm2(vec2(funnelX * 8.5, uv.y * 1.4 - uTime * 3.8));
  float s2 = fbm2(vec2(funnelX * 16.0, uv.y * 2.1 - uTime * 5.6));
  float streaks = pow(clamp(s1 * 0.6 + s2 * 0.5, 0.0, 1.0), 2.3);

  float sideGlow = exp(-abs(funnelX) * 2.2);
  vec3 canyonCol = mix(vec3(0.36, 0.18, 0.72), vec3(1.0, 0.56, 0.20), smoothstep(0.35, -0.75, uv.y));
  col += canyonCol * streaks * (0.45 + 0.75 * sideGlow) * (0.65 + 0.6 * uTidalPower);

  vec2 abyssPos = vec2(0.0, -0.96);
  float dAbyss = length((uv - abyssPos) * vec2(0.85, 1.15));
  float coreGlow = exp(-dAbyss * dAbyss * 3.8);
  float coreHot = exp(-dAbyss * dAbyss * 16.0);
  col += vec3(1.0, 0.44, 0.12) * coreGlow * (1.1 + 0.7 * uTidalPower);
  col += vec3(1.0, 0.94, 0.76) * coreHot * (1.2 + 0.8 * uTidalPower);

  return col;
}

// Scene 6: Pinpoint HDR Singularity & Velvet Zero-G Stillness
vec3 renderSingularity(vec2 uv) {
  vec2 p = uv - vec2(0.0, 0.02);
  float r = length(p);
  vec3 col = vec3(0.005, 0.004, 0.014);
  col += sampleStarfield(normalize(vec3(uv.x * 0.8, uv.y * 0.8, -1.1))) * 0.45;

  float neb = fbm2(p * 3.8 + vec2(uTime * 0.06, -uTime * 0.04));
  col += vec3(0.24, 0.14, 0.48) * neb * exp(-r * 2.1) * 0.55;

  // Pinpoint white-gold HDR singularity core + delicate optical 4-point diffraction spikes!
  float pulse = 1.0 + 0.08 * sin(uTime * 3.2);
  float core = exp(-r * r / (0.00055 * pulse));
  float innerHalo = exp(-r * r / (0.0085 * pulse));
  float outerHalo = exp(-r * r / 0.095);
  float spikeH = exp(-abs(p.y) * 95.0) * exp(-abs(p.x) * 3.8);
  float spikeV = exp(-abs(p.x) * 95.0) * exp(-abs(p.y) * 3.8);
  float spikeD1 = exp(-abs(p.x + p.y) * 110.0) * exp(-r * 6.5) * 0.45;
  float spikeD2 = exp(-abs(p.x - p.y) * 110.0) * exp(-r * 6.5) * 0.45;

  col += vec3(0.52, 0.34, 0.92) * outerHalo * 0.48;
  col += vec3(1.0, 0.74, 0.36) * innerHalo * 1.15;
  col += vec3(1.0, 0.98, 0.94) * (core * 2.6 + (spikeH + spikeV + spikeD1 + spikeD2) * (1.1 + uCrack * 0.9));

  // Subtle expanding fracture shock ring on s6_crack!
  if (uCrack > 0.01) {
    float shockR = uCrack * 0.85;
    float shock = exp(-pow((r - shockR) / 0.032, 2.0)) * (1.0 - uCrack);
    col += vec3(1.0, 0.86, 0.52) * shock * 1.25;
  }
  return col;
}

vec3 evalScene(vec2 uv) {
  vec3 c = vec3(0.0);
  if (uBlackHoleMix > 0.001) c += renderBlackHole(uv) * uBlackHoleMix;
  if (uHorizonMix > 0.001)   c += renderHorizonInside(uv) * uHorizonMix;
  if (uFunnelMix > 0.001)    c += renderSpacetimeFunnel(uv) * uFunnelMix;
  if (uTidalMix > 0.001)     c += renderTidalVortex(uv) * uTidalMix;
  if (uSingularityMix > 0.001) c += renderSingularity(uv) * uSingularityMix;
  return c;
}

void main() {
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  vec2 uv = (vUv - 0.5) * 2.0 * aspect;

  // Single-pass HDR evaluation (3x faster than multi-tap!) + subtle optical edge tint under high-G chromatic stress
  vec3 col = evalScene(uv);
  if (uChromatic > 0.003) {
    float edgeR = length(uv);
    col.r *= 1.0 + edgeR * uChromatic * 14.0;
    col.b *= 1.0 + edgeR * uChromatic * 10.0;
  }

  col *= uExposure;
  col = acesToneMap(col);
  col = pow(col, vec3(1.0 / 2.2));

  // Subtle 35mm cinema film grain (prevents dark-space banding!)
  float grain = (hash21(vUv * uResolution + fract(uTime * 17.3) * 100.0) - 0.5) * 0.020;
  col = clamp(col + grain, 0.0, 1.0);

  gl_FragColor = vec4(col, 1.0);
}
`;

/** 3D Volumetric Light Cones inside S4 Spacetime Throat that physically tilt 90 deg inward on Metric Flip! */
const SpacetimeLightCones3D: React.FC<{ f: number; opacity: number }> = ({ f, opacity }) => {
  const items = useMemo(() => {
    const arr: Array<{ r: number; ang: number; z: number; idx: number }> = [];
    for (let ring = 0; ring < 3; ring++) {
      const r = 1.15 + ring * 0.85;
      const z = -ring * 0.65 - 1.5;
      for (let k = 0; k < 10; k++) {
        arr.push({ r, ang: (k / 10) * Math.PI * 2 + ring * 0.31, z, idx: ring * 10 + k });
      }
    }
    return arr;
  }, []);
  if (opacity <= 0.01) return null;
  const flipT = easeInOut((f - (CUES.s4_invert - 10)) / 42);

  return (
    <group rotation={[0, 0, f * 0.003]}>
      {items.map((it) => {
        const x = Math.cos(it.ang) * it.r;
        const y = Math.sin(it.ang) * it.r;
        // Before flip: light cones point radially outward; After flip: ALL rotate 180 deg in XY plane pointing STRICTLY INWARD at the center throat!
        const outwardZ = it.ang - Math.PI * 0.5;
        const inwardZ = it.ang + Math.PI * 0.5;
        const rotZ = lerp(outwardZ, inwardZ, flipT);
        const pulse = 0.74 + 0.26 * Math.sin(f * 0.12 + it.idx);
        return (
          <group key={it.idx} position={[x, y, it.z]} rotation={[0, 0, rotZ]}>
            <mesh>
              <coneGeometry args={[0.11, 0.44, 12, 1, true]} />
              <meshBasicMaterial
                color={it.idx % 2 === 0 ? '#ffc966' : '#a884ff'}
                transparent
                opacity={opacity * 0.36 * pulse}
                side={THREE.DoubleSide}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
            <mesh position={[0, 0.24, 0]}>
              <coneGeometry args={[0.048, 0.16, 8]} />
              <meshBasicMaterial
                color="#fff2c8"
                transparent
                opacity={opacity * 0.92 * pulse}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

/** 2,400-Particle 3D GPU Atomic Stream ripping downward during S5 Spaghettification! */
const AtomicStreamParticles3D: React.FC<{ f: number; opacity: number; atomsT: number }> = ({ f, opacity, atomsT }) => {
  const { geom } = useMemo(() => {
    const count = 2400;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const c1 = new THREE.Color('#fff4d0');
    const c2 = new THREE.Color('#ff9d3b');
    const c3 = new THREE.Color('#80dcff');
    for (let i = 0; i < count; i++) {
      const u = hash01(i * 13.7 + 1.1);
      const a = hash01(i * 29.3 + 2.7) * Math.PI * 2;
      const rad = 0.04 + Math.pow(hash01(i * 41.1 + 5.3), 1.6) * 0.55;
      pos[i * 3] = Math.cos(a) * rad;
      pos[i * 3 + 1] = (u - 0.5) * 9.5;
      pos[i * 3 + 2] = Math.sin(a) * rad - 2.2;
      const pick = i % 3 === 0 ? c1 : i % 3 === 1 ? c2 : c3;
      col[i * 3] = pick.r;
      col[i * 3 + 1] = pick.g;
      col[i * 3 + 2] = pick.b;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return { geom: g };
  }, []);

  const starTex = useMemo(() => createStarGlowTexture(), []);

  if (opacity <= 0.01) return null;

  // Spiraling downward plunge animation driven cleanly from frame f!
  const yScroll = -((f * 0.16) % 4.5);
  const tightenX = lerp(1.6, 0.35, atomsT);
  return (
    <group position={[0, yScroll + 1.2, 0]} scale={[tightenX, 1.35, tightenX]} rotation={[0, f * 0.04, 0]}>
      <points geometry={geom}>
        <pointsMaterial
          size={0.14}
          map={starTex}
          vertexColors
          transparent
          opacity={opacity * 0.95}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
    </group>
  );
};

/** 3D Fracturing Curvature Rings & Floating Gold Dust Shards in S6 Singularity */
const SingularityRings3D: React.FC<{ f: number; opacity: number; crackT: number }> = ({ f, opacity, crackT }) => {
  const shards = useMemo(() => {
    const list: Array<{ r: number; a0: number; span: number; tiltX: number; tiltY: number; driftDir: [number, number, number]; spin: number }> = [];
    const radii = [0.65, 1.12, 1.62, 2.15];
    radii.forEach((r, ri) => {
      for (let k = 0; k < 5; k++) {
        const a0 = (k / 5) * Math.PI * 2 + ri * 0.45;
        const dx = Math.cos(a0) * (0.6 + ri * 0.25);
        const dy = Math.sin(a0) * (0.6 + ri * 0.25);
        const dz = (hash01(ri * 17 + k * 7) - 0.5) * 1.4;
        list.push({
          r,
          a0,
          span: 0.95,
          tiltX: (ri % 2 === 0 ? 0.55 : -0.45) + hash01(ri * 11 + k) * 0.3,
          tiltY: (k % 2 === 0 ? 0.35 : -0.35),
          driftDir: [dx, dy, dz],
          spin: (k % 2 === 0 ? 1 : -1) * (0.35 + hash01(k * 19 + ri) * 0.45),
        });
      }
    });
    return list;
  }, []);

  if (opacity <= 0.01) return null;

  return (
    <group position={[0, 0.08, -2.5]} rotation={[0.25, f * 0.004, 0]}>
      {shards.map((sh, i) => {
        const d = crackT * 1.35;
        return (
          <mesh
            key={i}
            position={[sh.driftDir[0] * d, sh.driftDir[1] * d, sh.driftDir[2] * d]}
            rotation={[sh.tiltX + crackT * sh.spin, sh.tiltY + crackT * sh.spin * 0.7, sh.a0 + f * 0.003]}
          >
            <torusGeometry args={[sh.r, 0.011, 6, 24, sh.span]} />
            <meshBasicMaterial
              color={i % 3 === 0 ? '#ffe6a3' : '#c8b2f6'}
              transparent
              opacity={opacity * clamp(0.72 - crackT * 0.42, 0.14, 0.8)}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        );
      })}
    </group>
  );
};

/** Continuous 3D Foreground Depth-of-Field Dust Motes drifting softly past camera lens across all scenes */
const ForegroundDust3D: React.FC<{ f: number; speed?: number; opacity?: number }> = ({ f, speed = 1, opacity = 0.45 }) => {
  const geom = useMemo(() => {
    const count = 140;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      let px = (hash01(i * 19.1 + 3) - 0.5) * 6.5;
      let py = (hash01(i * 37.3 + 7) - 0.5) * 10.5;
      // Keep central Event Horizon shadow pristine pitch-black!
      const r2 = px * px + py * py;
      if (r2 < 2.2) {
        const sc = 1.65 / Math.sqrt(Math.max(0.05, r2));
        px *= sc;
        py *= sc;
      }
      pos[i * 3] = px;
      pos[i * 3 + 1] = py;
      pos[i * 3 + 2] = -0.5 - hash01(i * 53.7 + 11) * 4.5;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  const starTex = useMemo(() => createStarGlowTexture(), []);

  return (
    <points geometry={geom} position={[Math.sin(f * 0.008) * 0.18, ((f * 0.006 * speed) % 2.4) - 1.2, 0]}>
      <pointsMaterial
        size={0.12}
        map={starTex}
        color="#ffe8c2"
        transparent
        opacity={opacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

export interface GLSceneProps {
  f: number;
}

export const BlackHoleGL: React.FC<GLSceneProps> = ({ f }) => {
  const { s2Start, s3Start, s4Start, s5Start, s6Start, s7Start, totalFrames } = SCENES;
  const tSec = f / 30;

  // Smooth cross-blends between shader modes (zero abrupt hard cuts!)
  const s3bStart = CUES.s3_horizon + 24; // Dive completes crossing Event Horizon right after s3_horizon!
  const xFade = 16;

  // Compute exact 3D camera trajectory + shader uniforms per scene
  let camPos: [number, number, number] = [0.0, 1.05, 8.6];
  let camTarget: [number, number, number] = [0.0, -0.05, 0.0];
  let camRoll = -0.18;
  let fov = 1.58;
  let diskIntensity = 1.05;
  let bhMix = 0;
  let horizonMix = 0;
  let skyCollapse = 0;
  let funnelMix = 0;
  let funnelFlip = 0;
  let tidalMix = 0;
  let tidalPower = 0;
  let singMix = 0;
  let crack = 0;
  let chromatic = 0.0012;
  let exposure = 1.08;

  if (f < s2Start) {
    // S1: Majestic Orbital Fly-By around colossal Gargantua Black Hole (framed cleanly inside 9:16 with deep dark cosmos!)
    const p = f / Math.max(1, s2Start);
    const orbitA = lerp(-0.18, 0.36, easeInOut(p));
    const dist = lerp(12.8, 9.8, easeInOut(p));
    const elev = lerp(1.55, 1.05, easeInOut(p));
    camPos = [Math.sin(orbitA) * dist, elev, Math.cos(orbitA) * dist];
    camTarget = [lerp(0.0, -0.18, p), -0.05, 0.0];
    camRoll = lerp(-0.16, -0.08, p);
    bhMix = 1;
    // Whip-push flare & chromatic kick on last 14 frames into S2 POV!
    const whip = easeInOut((f - (s2Start - 14)) / 14);
    fov = lerp(1.62, 1.18, whip);
    chromatic = 0.001 + whip * 0.014;
    exposure = 1.05 + whip * 0.45;
  } else if (f < s3bStart) {
    // S2 + S3a: Grazing Photon Sphere (1.5 RS) -> Accelerating Plunge Straight Into Event Horizon!
    const p2 = clamp((f - s2Start) / Math.max(1, s3Start - s2Start), 0, 1);
    const p3a = clamp((f - s3Start) / Math.max(1, s3bStart - s3Start), 0, 1);
    const orbitA = lerp(0.55, 1.35, easeInOut(p2)) + p3a * 0.35;
    const dist = lerp(9.4, 6.2, easeInOut(p2)) - easeInOut(p3a) * 3.8; // Plunges straight into dark horizon core!
    const elev = lerp(1.02, 0.42, easeInOut(p2)) * (1 - p3a * 0.8);
    camPos = [Math.sin(orbitA) * dist, elev, Math.cos(orbitA) * dist];
    camTarget = [lerp(0.22, 0.0, p3a), lerp(-0.08, 0.0, p3a), 0.0];
    camRoll = lerp(-0.12, 0.04, p2);
    fov = lerp(1.52, 1.32, p2) - p3a * 0.25;
    diskIntensity = lerp(1.12, 1.35, p2) * (1 - easeInOut((p3a - 0.68) / 0.32));
    const toH = easeInOut((f - (s3bStart - xFade)) / xFade);
    bhMix = 1 - toH;
    horizonMix = toH;
    chromatic = 0.0015 + p3a * 0.015;
    exposure = 1.08 + Math.sin(p3a * Math.PI) * 0.22;
  } else if (f < s4Start) {
    // S3b: Inside Event Horizon — Total Velvet Silence on "Hening." -> Blazing Blueshifted Sky Collapse!
    const toF = easeInOut((f - (s4Start - xFade)) / xFade);
    horizonMix = 1 - toF;
    funnelMix = toF;
    skyCollapse = easeOutCubic((f - (CUES.s3_sky - 22)) / 52);
    chromatic = 0.0025 + skyCollapse * 0.004;
    exposure = 1.05;
  } else if (f < s5Start) {
    // S4: 3D Volumetric Curved Spacetime Gravity Throat + Metric Flip!
    const toT = easeInOut((f - (s5Start - xFade)) / xFade);
    funnelMix = 1 - toT;
    tidalMix = toT;
    funnelFlip = easeInOut((f - (CUES.s4_invert - 8)) / 46);
    chromatic = 0.002 + toT * 0.012;
    exposure = 1.08 + toT * 0.18;
  } else if (f < s6Start) {
    // S5: Roaring Tidal Vortex & Spaghettification -> Optical White-Gold Flash Cut into S6!
    const p5 = clamp((f - s5Start) / Math.max(1, s6Start - s5Start), 0, 1);
    const toS = easeInOut((f - (s6Start - 12)) / 12);
    tidalMix = 1 - toS;
    singMix = toS;
    tidalPower = easeInOut((f - (CUES.s5_stretch - 20)) / 65);
    const flash = Math.sin(clamp((f - (s6Start - 14)) / 18, 0, 1) * Math.PI);
    chromatic = 0.004 + tidalPower * 0.014;
    exposure = 1.10 + flash * 1.45;
  } else if (f < s7Start) {
    // S6: Pinpoint HDR Singularity -> Quiet Equation Fracture -> Pull-Out into S7!
    const to7 = easeInOut((f - (s7Start - 20)) / 20);
    singMix = 1 - to7;
    bhMix = to7;
    crack = easeOutCubic((f - (CUES.s6_crack - 6)) / 56);
    // Start pulling out to match S7 camera smoothly
    camPos = [0.0, 0.55, lerp(4.2, 7.6, to7)];
    camTarget = [0.0, -0.04, 0.0];
    diskIntensity = 1.05;
    chromatic = 0.0015 + crack * 0.003;
    exposure = 1.08;
  } else {
    // S7: Grand Pull-Out to Sagittarius A* — settles smoothly on EXACT Frame 0 camera (dist=12.8, elev=1.55, roll=-0.16) for seamless loop!
    const p7 = clamp((f - s7Start) / Math.max(1, totalFrames - 1 - s7Start), 0, 1);
    const ep = easeInOut(p7);
    const orbitA = lerp(0.45, -0.18, ep);
    const dist = lerp(7.8, 12.8, ep);
    const elev = lerp(0.85, 1.55, ep);
    camPos = [Math.sin(orbitA) * dist, elev, Math.cos(orbitA) * dist];
    camTarget = [0.0, -0.05, 0.0];
    camRoll = lerp(-0.04, -0.16, ep);
    fov = lerp(1.45, 1.62, ep);
    bhMix = 1;
    diskIntensity = 1.05;
    chromatic = 0.001;
    exposure = 1.05;
  }

  // Create THREE.ShaderMaterial ONCE so WebGL compiles the GLSL program once and reads live shaderMat.uniforms every frame!
  // (Passing a plain `uniforms` object to `<shaderMaterial>` triggers Three.js UniformsUtils.clone on mount, freezing uniforms!)
  const shaderMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        uniforms: {
          uResolution: { value: new THREE.Vector2(720, 1280) },
          uTime: { value: 0 },
          uCamPos: { value: new THREE.Vector3(0, 1.1, 8.6) },
          uCamTarget: { value: new THREE.Vector3(0, 0, 0) },
          uCamRoll: { value: -0.18 },
          uFov: { value: 1.56 },
          uDiskIntensity: { value: 1.05 },
          uBlackHoleMix: { value: 1 },
          uHorizonMix: { value: 0 },
          uSkyCollapse: { value: 0 },
          uFunnelMix: { value: 0 },
          uFunnelFlip: { value: 0 },
          uTidalMix: { value: 0 },
          uTidalPower: { value: 0 },
          uSingularityMix: { value: 0 },
          uCrack: { value: 0 },
          uChromatic: { value: 0.0012 },
          uExposure: { value: 1.08 },
        },
        depthTest: false,
        depthWrite: false,
      }),
    []
  );

  // Deterministically update the LIVE GPU uniforms directly on shaderMat.uniforms every frame!
  shaderMat.uniforms.uTime.value = tSec;
  shaderMat.uniforms.uCamPos.value.set(camPos[0], camPos[1], camPos[2]);
  shaderMat.uniforms.uCamTarget.value.set(camTarget[0], camTarget[1], camTarget[2]);
  shaderMat.uniforms.uCamRoll.value = camRoll;
  shaderMat.uniforms.uFov.value = fov;
  shaderMat.uniforms.uDiskIntensity.value = diskIntensity;
  shaderMat.uniforms.uBlackHoleMix.value = bhMix;
  shaderMat.uniforms.uHorizonMix.value = horizonMix;
  shaderMat.uniforms.uSkyCollapse.value = skyCollapse;
  shaderMat.uniforms.uFunnelMix.value = funnelMix;
  shaderMat.uniforms.uFunnelFlip.value = funnelFlip;
  shaderMat.uniforms.uTidalMix.value = tidalMix;
  shaderMat.uniforms.uTidalPower.value = tidalPower;
  shaderMat.uniforms.uSingularityMix.value = singMix;
  shaderMat.uniforms.uCrack.value = crack;
  shaderMat.uniforms.uChromatic.value = chromatic;
  shaderMat.uniforms.uExposure.value = exposure;
  shaderMat.uniformsNeedUpdate = true;

  const atomsT = easeOutCubic((f - (CUES.s5_atoms - 10)) / 42);
  const dustOpacity = horizonMix > 0.5 && skyCollapse < 0.15 ? 0.14 : 0.44;

  // --- Scene-Driven 3D PBR Hero Choreography & Motivated Lighting Rig ---
  // Scene 1: Outside Observer — 3D Astronaut slows asymptotically, redshifts crimson & freezes near accretion limb!
  const inS1 = f < s2Start;
  const s1MoveT = clamp(f / Math.max(1, CUES.s1_freeze), 0, 1);
  const s1Eased = 1 - Math.pow(1 - s1MoveT, 2.7);
  const s1Redshift = easeInOut((f - (CUES.s1_slow - 6)) / Math.max(1, CUES.s1_freeze - CUES.s1_slow + 20));
  const s1Freeze = easeInOut((f - (CUES.s1_freeze - 10)) / 24);
  const s1WhipFade = 1 - easeInOut((f - (s2Start - 12)) / 12);

  // Scene 2: Photon Sphere — 3D Chronograph ticks 1.000s/beat + 3D Astronaut + 3D Back-of-Head Mirror Reflection!
  const inS2 = f >= s2Start && f < s3Start + 12;
  const watchIn = easeOutCubic((f - (s2Start + 4)) / 22);
  const watchOut = easeInOut((f - (CUES.s2_bend + 14)) / 24);
  const watchAlpha = inS2 ? watchIn * (1 - watchOut) : 0;
  const bendT = easeInOut((f - (CUES.s2_bend - 12)) / 36);
  const mirrorT = easeInOut((f - (CUES.s2_mirror - 14)) / 26);
  const s2ExitFade = 1 - easeInOut((f - (s3Start - 8)) / 18);

  // Scene 3b: Inside Event Horizon — Solitary 3D Astronaut in velvet hush, then illuminated from ABOVE by blueshifted sky orb!
  const inS3b = f >= s3bStart - 10 && f < s4Start;
  const s3bFade =
    easeInOut((f - (s3bStart - 10)) / 18) * (1 - easeInOut((f - (s4Start - 14)) / 14));
  const s3bDriftY = lerp(0.15, -0.58, clamp((f - s3bStart) / Math.max(1, s4Start - s3bStart), 0, 1));

  // Scene 5: High-G Tidal Vortex — 3D Astronaut undergoes non-uniform 1/r^3 tidal elongation + camera shake, dissolving into 2,400 atoms!
  const inS5 = f >= s5Start - 8 && f < s6Start;
  const s5Enter = easeInOut((f - (s5Start - 8)) / 16);
  const s5Stretch = easeInOut((f - (CUES.s5_stretch - 14)) / Math.max(1, CUES.s5_atoms - CUES.s5_stretch + 8));
  const s5AstroOp = inS5 ? s5Enter * clamp(1 - atomsT * 1.18, 0, 1) : 0;
  // Progressive deterministic micro camera shake during high-G Spaghettification!
  const shakeAmp = inS5 ? (0.012 + s5Stretch * 0.045) * (1 - atomsT * 0.55) : 0;
  const shakeX = Math.sin(f * 1.93) * shakeAmp;
  const shakeY = Math.cos(f * 2.47) * shakeAmp;

  // Scene 7: Grand Pull-Out through 6,000-Star 3D Volumetric Milky Way Galaxy (also faintly present in S1 for seamless loop!)
  const s7PullT = clamp((f - s7Start) / Math.max(1, totalFrames - 1 - s7Start), 0, 1);
  const mwAlpha = f >= s7Start - 18 ? easeInOut((f - (s7Start - 18)) / 28) * 0.95 : f < s2Start ? 0.52 * s1WhipFade : 0;

  // Dynamic Motivated Key Light position & color (matches the exact light source visible in the GLSL scene!)
  const keyLightPos: [number, number, number] = inS5
    ? [0, -2.6, 1.4] // blazing tidal abyss below astronaut!
    : inS3b
      ? [0, 2.8, 1.2] // blueshifted overhead sky orb!
      : [-1.4, -0.3, 1.8]; // incandescent left-center Doppler accretion limb!
  const keyLightColor = inS3b
    ? '#8ad8ff'
    : inS1 && s1Redshift > 0.25
      ? '#ff4a24'
      : '#ffab48';
  const keyLightInt = inS5
    ? 14 + s5Stretch * 10
    : inS3b
      ? 1.5 + skyCollapse * 11
      : 10.5;

  return (
    <ThreeCanvas
      width={720}
      height={1280}
      dpr={1}
      camera={{ position: [shakeX, shakeY, 3.5], fov: 50, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      style={{ position: 'absolute', left: 0, top: 0, width: 720, height: 1280 }}
    >
      {/* Reactive 3D Camera Rig for S5 high-G micro-shake */}
      <CameraRig shakeX={shakeX} shakeY={shakeY} />

      {/* Motivated 3D Cinema Lighting Rig (Real directional shadows, amber accretion key, deep cool rim!) */}
      <ambientLight intensity={inS3b && skyCollapse < 0.2 ? 0.12 : 0.26} color="#282246" />
      <pointLight position={keyLightPos} color={keyLightColor} intensity={keyLightInt} distance={14} decay={1.6} />
      <directionalLight position={[2.8, 2.5, 2.2]} color={inS3b ? '#6ab8ff' : '#ffd596'} intensity={inS3b ? 0.5 + skyCollapse * 1.4 : 1.15} />
      <directionalLight position={[-3.2, 1.6, -2.0]} color="#6c8cff" intensity={0.85} />

      {/* Full-Screen Raymarched Relativistic Physics Shader Quad (bound to live shaderMat — zero uniform cloning!) */}
      <mesh renderOrder={-10} frustumCulled={false}>
        <planeGeometry args={[2, 2]} />
        <primitive object={shaderMat} attach="material" />
      </mesh>

      {/* Scene 1: 3D PBR Astronaut cleanly framed inside 9:16 slowing down, redshifting & freezing near Gargantua's blazing limb */}
      {inS1 && (
        <Astronaut3D
          f={f}
          position={[lerp(0.46, 0.28, s1Eased), lerp(0.32, 0.08, s1Eased), lerp(0.45, -0.05, s1Eased)]}
          rotation={[lerp(0.16, 0.30, s1Eased), lerp(-0.62, -0.88, s1Eased), lerp(-0.18, -0.34, s1Eased)]}
          scale={lerp(0.46, 0.38, s1Eased)}
          redshift={s1Redshift}
          freezePhase={s1Freeze}
          opacity={s1WhipFade * lerp(1.0, 0.65, s1Freeze)}
        />
      )}

      {/* Scene 2a: 3D Brushed-Steel Space Mission Chronograph cleanly framed above captions & ticking 1.000s/beat! */}
      {watchAlpha > 0.01 && (
        <SpaceChronograph3D
          f={f}
          tickStartFrame={CUES.s2_watch}
          position={[lerp(-1.15, -0.28, watchIn) - watchOut * 1.15, 0.14 + Math.sin(f * 0.04) * 0.025, 1.05]}
          rotation={[0.10, 0.24, -0.14]}
          scale={0.62}
          opacity={watchAlpha * s2ExitFade}
        />
      )}

      {/* Scene 2b: Photon Sphere (1.5 RS) — Real 3D Astronaut + Translucent Golden 3D Mirror Seen FROM BEHIND! */}
      {inS2 && bendT > 0.01 && (
        <>
          <Astronaut3D
            f={f}
            position={[lerp(-0.68, -0.56, bendT), 0.12 + Math.sin(f * 0.045) * 0.04, 0.45]}
            rotation={[0.12, 0.65, 0.14]}
            scale={0.48}
            opacity={bendT * s2ExitFade}
          />
          {mirrorT > 0.01 && (
            <Astronaut3D
              f={f}
              position={[0.58, 0.14 - Math.sin(f * 0.045) * 0.03, 0.05]}
              rotation={[0.10, -2.35, -0.12]} // Rotated ~180 deg so you literally see the 3D BACKPACK & BACK OF HELMET!
              scale={0.42}
              ghostMirror
              opacity={mirrorT * s2ExitFade}
            />
          )}
        </>
      )}

      {/* Scene 3b: Solitary 3D Astronaut floating in Event Horizon Silence beneath the shrinking Sapphire Universe Orb */}
      {inS3b && s3bFade > 0.01 && (
        <Astronaut3D
          f={f}
          position={[0.0, s3bDriftY, 0.35]}
          rotation={[-0.42, Math.sin(f * 0.018) * 0.25, 0.12]}
          scale={0.56}
          opacity={s3bFade}
        />
      )}

      {/* Scene 4: 3D Volumetric Relativistic Light Cones tilting 90 deg strictly inward into the Future Throat */}
      <SpacetimeLightCones3D f={f} opacity={funnelMix} />

      {/* Scene 5: Non-uniform 1/r^3 Spaghettification on 3D PBR Astronaut cleanly centered between title and captions + 2,400 GPU Atomic Particles */}
      {s5AstroOp > 0.01 && (
        <Astronaut3D
          f={f}
          position={[0.0, lerp(0.30, 0.06, s5Stretch), 0.22]}
          rotation={[0.14, Math.sin(f * 0.05) * 0.35, Math.sin(f * 0.09) * 0.07]}
          scale={0.42}
          redshift={s5Stretch * 0.45}
          tidalStretch={s5Stretch}
          opacity={s5AstroOp}
        />
      )}
      <AtomicStreamParticles3D f={f} opacity={tidalMix * clamp(0.18 + atomsT * 0.95, 0, 1)} atomsT={atomsT} />

      {/* Scene 6: 3D Holographic Spacetime Curvature Rings fracturing into zero-G shards */}
      <SingularityRings3D f={f} opacity={singMix} crackT={crack} />

      {/* Scene 7 (& Loop Seam): 6,000-Star Volumetric 3D Milky Way Spiral Galaxy flying past camera in true depth! */}
      <MilkyWayGalaxy3D f={f} opacity={mwAlpha} pullProgress={f >= s7Start ? s7PullT : 1} />

      {/* All Scenes: 3D Foreground Depth-of-Field Bokeh Dust Motes */}
      <ForegroundDust3D f={f} speed={tidalMix > 0.3 ? 8.5 : 1.0} opacity={dustOpacity} />
    </ThreeCanvas>
  );
};
