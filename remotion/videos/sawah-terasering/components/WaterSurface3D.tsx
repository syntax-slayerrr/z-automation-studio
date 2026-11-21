import React, { useMemo } from "react";
import * as THREE from "three";
import { TERRACE_TIERS, getBareSlopeY } from "../ikSolver";

const WATER_VERT = `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

// Animated Calm Reflective Rice Terrace Pool Shader (Fresnel sky reflection + traveling concentric ripples!)
const CALM_WATER_FRAG = `
  uniform float uTime;
  uniform vec3 uDeepColor;
  uniform vec3 uSkyTint;
  uniform float uOpacity;
  varying vec2 vUv;
  varying vec3 vWorldPos;

  void main() {
    // Gentle multi-directional surface wavelets
    float w1 = sin(vWorldPos.x * 8.5 + uTime * 2.4) * 0.5 + 0.5;
    float w2 = cos(vWorldPos.z * 9.2 - uTime * 2.1 + vWorldPos.x * 3.0) * 0.5 + 0.5;
    float ripple = (w1 * 0.55 + w2 * 0.45);

    // Subtle specular shimmer bands catching sunlight
    float spec = pow(clamp(ripple, 0.0, 1.0), 6.0) * 0.36;

    // Gentle edge foam along bund borders
    float edge = smoothstep(0.06, 0.0, min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y)));

    vec3 col = mix(uDeepColor, uSkyTint, 0.46 + ripple * 0.24) + vec3(1.0, 0.98, 0.92) * spec;
    col = mix(col, vec3(0.92, 0.97, 1.0), edge * 0.32);
    gl_FragColor = vec4(col, uOpacity);
  }
`;

// Fast Turbulent Muddy Erosion Runoff Torrent Shader (Seq 1-2 bare 30° slope washout!)
const MUD_TORRENT_FRAG = `
  uniform float uTime;
  uniform float uIntensity;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }

  void main() {
    // Fast downward scrolling streaks from left (high) to right (low)
    vec2 flowUV = vec2(vUv.x * 4.5 - uTime * 2.8, vUv.y * 8.0);
    float n1 = noise(flowUV);
    float n2 = noise(flowUV * 2.2 - vec2(uTime * 1.4, 0.0));
    float streak = smoothstep(0.32, 0.84, n1 * 0.65 + n2 * 0.35);

    vec3 mudWater = mix(vec3(0.42, 0.27, 0.15), vec3(0.64, 0.46, 0.28), streak);
    // Frothy white-tan turbulence crest
    float foam = smoothstep(0.74, 0.92, n1 * 0.5 + n2 * 0.5);
    vec3 col = mix(mudWater, vec3(0.92, 0.87, 0.78), foam * 0.65);

    float edgeFade = smoothstep(0.0, 0.12, vUv.y) * smoothstep(1.0, 0.88, vUv.y);
    gl_FragColor = vec4(col, uIntensity * edgeFade * (0.58 + streak * 0.34));
  }
`;

/**
 * 1. Calm Sky-Reflecting Flooded Rice Paddy Pools on all 4 Terrace Tiers
 */
export const FloodedTerracePools: React.FC<{
  fillLevel: number; // 0..1 water depth rising cleanly inside each terrace
  sunsetFactor: number;
  frame: number;
}> = ({ fillLevel, sunsetFactor, frame }) => {
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDeepColor: { value: new THREE.Color("#3D7D72") },
      uSkyTint: { value: new THREE.Color("#9AD8F8") },
      uOpacity: { value: 0.78 },
    }),
    []
  );

  uniforms.uTime.value = frame / 30;
  uniforms.uDeepColor.value
    .set("#3D7D72")
    .lerp(new THREE.Color("#6B5B4A"), sunsetFactor * 0.55);
  uniforms.uSkyTint.value
    .set("#9AD8F8")
    .lerp(new THREE.Color("#FBC292"), sunsetFactor * 0.85);
  uniforms.uOpacity.value = Math.min(0.84, fillLevel * 0.84);

  if (fillLevel <= 0.02) return null;

  return (
    <group>
      {TERRACE_TIERS.map((tier) => {
        const w = tier.bundX - tier.xStart - 0.12;
        const cx = tier.xStart + w / 2 + 0.06;
        const waterY = tier.floorY + 0.02 + fillLevel * (tier.waterY - tier.floorY);
        return (
          <mesh
            key={tier.id}
            position={[cx, waterY, -2.25]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[w, 4.42]} />
            <shaderMaterial
              vertexShader={WATER_VERT}
              fragmentShader={CALM_WATER_FRAG}
              uniforms={uniforms}
              transparent
              depthWrite={false}
            />
          </mesh>
        );
      })}
    </group>
  );
};

/**
 * 2. Fast Turbulent Muddy Erosion Runoff Sheet sweeping down bare 30° slope (Seq 1–2)
 */
export const SlopeRunoffStream: React.FC<{
  intensity: number; // 0..1
  frame: number;
}> = ({ intensity, frame }) => {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(9.2, 4.5, 48, 8);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i) - 2.25;
      const y = getBareSlopeY(x) + 0.032 + Math.max(0, -z - 0.5) * 0.035 * Math.sin(x * 0.65);
      pos.setXYZ(i, x, y, z);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: 0 },
    }),
    []
  );
  uniforms.uTime.value = frame / 30;
  uniforms.uIntensity.value = intensity;

  if (intensity <= 0.01) return null;

  return (
    <mesh geometry={geo}>
      <shaderMaterial
        vertexShader={WATER_VERT}
        fragmentShader={MUD_TORRENT_FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
};

/**
 * 3. Split-Bamboo Spillway Pipes (Pancuran Bambu) + Cascading Crystal Water Ribbons + Expanding Ripples (Seq 6–7)
 */
export const BambooSpillwayCascades: React.FC<{
  pipeProgress: number; // 0..1 pipe seating
  flowProgress: number; // 0..1 cascade flowing Tier 4 -> 3 -> 2 -> 1!
  frame: number;
}> = ({ pipeProgress, flowProgress, frame }) => {
  // 3 spillover junctions between Tiers 4->3, 3->2, 2->1 (memoized unconditionally to obey Rules of Hooks!)
  const spouts = useMemo(() => {
    const defs = [
      { upper: TERRACE_TIERS[0], lower: TERRACE_TIERS[1], z: -0.62, delay: 0.0 },
      { upper: TERRACE_TIERS[1], lower: TERRACE_TIERS[2], z: -0.78, delay: 0.25 },
      { upper: TERRACE_TIERS[2], lower: TERRACE_TIERS[3], z: -0.65, delay: 0.5 },
    ];
    return defs.map((sp) => {
      const px = sp.upper.bundX + 0.04;
      const py = sp.upper.waterY + 0.01;
      const dropY = sp.lower.waterY;
      const pts: THREE.Vector3[] = [];
      const steps = 16;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = px + 0.22 + t * 0.44;
        const y = py - 0.02 - t * t * (py - dropY);
        pts.push(new THREE.Vector3(x, y, sp.z));
      }
      const arcGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 18, 0.036, 10, false);
      return { ...sp, px, py, dropY, arcGeo };
    });
  }, []);

  if (pipeProgress <= 0.01) return null;

  return (
    <group>
      {spouts.map((sp, idx) => {
        const localFlow = Math.max(0, Math.min(1, (flowProgress - sp.delay) / 0.42));
        const { px, py, dropY, arcGeo } = sp;

        // Animated expanding ripple rings on lower terrace water where waterfall splashes!
        const r1 = ((frame * 0.045 + idx * 0.33) % 1);
        const r2 = ((frame * 0.045 + idx * 0.33 + 0.5) % 1);

        return (
          <group key={idx}>
            {/* Hollow Split-Bamboo Spillway Pipe embedded cleanly across mud pematang rim */}
            <mesh
              position={[px, py + (1 - pipeProgress) * 0.25, sp.z]}
              rotation={[0, 0, Math.PI / 2 - 0.08]}
              castShadow
            >
              <cylinderGeometry args={[0.046, 0.052, 0.46, 14]} />
              <meshStandardMaterial color="#C8C476" roughness={0.55} />
            </mesh>
            {/* Dark hollow spout opening */}
            <mesh position={[px + 0.225, py - 0.018, sp.z]} rotation={[0, Math.PI / 2, 0]}>
              <circleGeometry args={[0.034, 12]} />
              <meshBasicMaterial color="#1E2822" />
            </mesh>

            {/* Crystal Translucent Water Cascade Ribbon */}
            {localFlow > 0.02 && (
              <>
                <mesh geometry={arcGeo}>
                  <meshStandardMaterial
                    color="#B8EEFF"
                    emissive="#4AC2F2"
                    emissiveIntensity={0.25}
                    roughness={0.08}
                    transparent
                    opacity={0.85 * localFlow}
                  />
                </mesh>

                {/* Sparkling Splash Droplets at Landing Pool */}
                {[0, 1, 2, 3, 4].map((di) => {
                  const dCyc = (frame * 0.11 + di * 0.2 + idx * 0.3) % 1;
                  const dx = px + 0.66 + Math.cos(di * 1.4) * 0.14 * dCyc;
                  const dy = dropY + 0.22 * dCyc - 0.28 * dCyc * dCyc;
                  const dz = sp.z + Math.sin(di * 1.8) * 0.12 * dCyc;
                  return (
                    <mesh key={di} position={[dx, Math.max(dropY, dy), dz]}>
                      <sphereGeometry args={[0.018, 8, 8]} />
                      <meshBasicMaterial color="#F2FCFF" transparent opacity={(1 - dCyc) * 0.9 * localFlow} />
                    </mesh>
                  );
                })}

                {/* Two Expanding Concentric Water Ripple Rings on Lower Terrace Pool */}
                {[r1, r2].map((rc, ri) => (
                  <mesh
                    key={ri}
                    position={[px + 0.66, dropY + 0.012, sp.z]}
                    rotation={[-Math.PI / 2, 0, 0]}
                  >
                    <ringGeometry args={[0.04 + rc * 0.28, 0.065 + rc * 0.28, 24]} />
                    <meshBasicMaterial
                      color="#E8F9FF"
                      transparent
                      opacity={(1 - rc) * 0.65 * localFlow}
                      depthWrite={false}
                    />
                  </mesh>
                ))}
              </>
            )}
          </group>
        );
      })}
    </group>
  );
};
