import React, { useMemo } from 'react';
import * as THREE from 'three';
import { EVOLUTION_BIOME_PALETTES, EVOLUTION_TOKENS, EvolutionBiomePalette } from './tokens';
import {
  armRadiusProfile,
  createAnatomicalTorsoGeo,
  createLoftedLimbGeo,
  legRadiusProfile,
} from './SculptedHuman3D';

export type HeroOrganPreset = 'spleen' | 'lungs' | 'heart' | 'stomach' | 'bone_marrow';

/**
 * Blender-Grade Directional-Key + Rim + Spherical Boolean X-Ray ShaderMaterial
 * Tuned 1:1 against `c05_probe_ots.png`, `c06_xray_angle.png`, and `c08_lowland_angle.png`:
 * - Mode 0: Velvety dark matte silhouette with dramatic blazing golden/ice grazing backlight rim!
 * - Mode 1: Translucent amber X-ray glass skin + luminous ivory bones + radiant golden/coral organs!
 */
export function createSphericalXRayMaterial(opts: {
  coreColor: string;
  rimColor: string;
  mode: 'opaque_outside_sphere' | 'inside_sphere_only' | 'always_fresnel';
  xrayCenter: THREE.Vector3;
  xrayRadius: number;
  opacity?: number;
  fresnelPower?: number;
  additive?: boolean;
  keyLightDir?: [number, number, number];
  keyLightColor?: string;
}): THREE.ShaderMaterial {
  const {
    coreColor,
    rimColor,
    mode,
    xrayCenter,
    xrayRadius,
    opacity = 0.88,
    fresnelPower = 2.0,
    additive = false,
    keyLightDir = [-0.62, 0.56, 0.54],
    keyLightColor = '#FFE4B4',
  } = opts;

  return new THREE.ShaderMaterial({
    uniforms: {
      uCoreColor: { value: new THREE.Color(coreColor) },
      uRimColor: { value: new THREE.Color(rimColor) },
      uKeyDir: { value: new THREE.Vector3(...keyLightDir).normalize() },
      uKeyColor: { value: new THREE.Color(keyLightColor) },
      uXrayCenter: { value: xrayCenter.clone() },
      uXrayRadius: { value: xrayRadius },
      uMode: {
        value: mode === 'opaque_outside_sphere' ? 0 : mode === 'inside_sphere_only' ? 1 : 2,
      },
      uOpacity: { value: opacity },
      uFresnelPower: { value: fresnelPower },
    },
    vertexShader: `
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform vec3 uCoreColor;
      uniform vec3 uRimColor;
      uniform vec3 uKeyDir;
      uniform vec3 uKeyColor;
      uniform vec3 uXrayCenter;
      uniform float uXrayRadius;
      uniform int uMode;
      uniform float uOpacity;
      uniform float uFresnelPower;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;

      void main() {
        float d = distance(vWorldPos, uXrayCenter);
        if (uMode == 0 && uXrayRadius > 0.001 && d < uXrayRadius) {
          discard;
        }
        if (uMode == 1 && d > uXrayRadius) {
          discard;
        }

        vec3 N = normalize(vWorldNormal);
        vec3 V = normalize(cameraPosition - vWorldPos);
        float ndotv = abs(dot(N, V));
        float fresnel = pow(clamp(1.0 - ndotv, 0.0, 1.0), uFresnelPower);

        if (uMode == 0) {
          // Matches c08_lowland_angle.png: velvety deep-charcoal body + warm directional backlight rim!
          float ndotl = max(dot(N, uKeyDir), 0.0);
          float wrap = max((dot(N, uKeyDir) + 0.30) / 1.30, 0.0);
          float sunRim = fresnel * (0.18 + 1.25 * pow(wrap, 1.15));
          vec3 col = uCoreColor * (0.58 + 0.42 * wrap);
          col += uKeyColor * pow(ndotl, 2.8) * 0.28;
          col = mix(col, uRimColor, clamp(sunRim * 0.92, 0.0, 0.98));

          float cutEdge = uXrayRadius > 0.01 ? exp(-pow((d - uXrayRadius) / 0.032, 2.0)) : 0.0;
          col = mix(col, vec3(1.0, 0.85, 0.38), cutEdge * 0.98);
          gl_FragColor = vec4(col, 1.0);
          return;
        }

        float rimBoost = clamp(pow(1.0 - ndotv, uFresnelPower * 0.82) * 1.30, 0.0, 1.0);
        vec3 col = mix(uCoreColor, uRimColor, rimBoost);
        float alpha = clamp(uOpacity * (0.20 + 0.96 * rimBoost), 0.14, 0.98);
        gl_FragColor = vec4(col, alpha);
      }
    `,
    transparent: mode !== 'opaque_outside_sphere',
    depthWrite: mode === 'opaque_outside_sphere',
    side: THREE.DoubleSide,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
}

export interface AnatomicalXRayTorsoProps {
  xrayCenter?: [number, number, number];
  xrayRadius?: number;
  heroOrgan?: HeroOrganPreset;
  heroOrganScale?: number;
  organSqueeze?: number;
  rbcFlowProgress?: number;
  finaleGlowIntensity?: number;
  /** Render full seated arms + thighs/calves in continuous sculpted geometry (matches c05 & c08!) */
  includeSeatedLimbs?: boolean;
  /** Seated posture variant: resting on knees vs reaching forward holding lowland tea/rope */
  armPose?: 'seated_rest' | 'seated_tea';
  keyLightDir?: [number, number, number];
  keyLightColor?: string;
  palette?: EvolutionBiomePalette;
}

/**
 * Cinema-Grade Seamless Sculpted Silhouette + Expanding Spherical Boolean X-Ray Human (`AnatomicalXRayTorso3D`)
 * Built on `createAnatomicalTorsoGeo()` + continuous `createLoftedLimbGeo()` so 85mm side-3/4 portraits
 * have the exact graceful S-curve chest, pinched waist, seated thighs, and seamless limbs of the reference film!
 */
export const AnatomicalXRayTorso3D: React.FC<AnatomicalXRayTorsoProps> = ({
  xrayCenter = [0.16, 0.05, 0.12],
  xrayRadius = 0,
  heroOrgan = 'spleen',
  heroOrganScale = 1.26,
  organSqueeze = 0,
  rbcFlowProgress = 0,
  finaleGlowIntensity = 0,
  includeSeatedLimbs = false,
  armPose = 'seated_rest',
  keyLightDir = [-0.62, 0.56, 0.54],
  keyLightColor = '#FFE2AD',
  palette = EVOLUTION_BIOME_PALETTES.ocean_bajau,
}) => {
  const centerVec = useMemo(
    () => new THREE.Vector3(xrayCenter[0], xrayCenter[1], xrayCenter[2]),
    [xrayCenter],
  );

  // Unified seamless torso + neck + sculpted head (ZERO chopped neck seam!)
  const torsoGeo = useMemo(() => createAnatomicalTorsoGeo(true), []);

  // Seamless lofted seated arms & legs (ZERO sphere caps or hollow tube ends!)
  const { leftArmGeo, rightArmGeo, leftLegGeo, rightLegGeo } = useMemo(() => {
    const armR = armRadiusProfile(0.95);
    const legR = legRadiusProfile(1.0);

    const lArmPts: Array<[number, number, number]> =
      armPose === 'seated_tea'
        ? [
            [-0.27, 0.35, -0.02],
            [-0.31, 0.04, 0.06],
            [-0.26, -0.14, 0.28],
            [-0.14, -0.18, 0.56],
          ]
        : [
            [-0.27, 0.35, -0.02],
            [-0.32, 0.04, 0.04],
            [-0.28, -0.18, 0.24],
            [-0.18, -0.34, 0.44],
          ];

    const rArmPts: Array<[number, number, number]> =
      armPose === 'seated_tea'
        ? [
            [0.27, 0.35, -0.02],
            [0.31, 0.04, 0.05],
            [0.25, -0.14, 0.26],
            [0.14, -0.18, 0.54],
          ]
        : [
            [0.27, 0.35, -0.02],
            [0.32, 0.04, 0.03],
            [0.28, -0.18, 0.22],
            [0.18, -0.34, 0.42],
          ];

    return {
      leftArmGeo: createLoftedLimbGeo(lArmPts, armR, 32, 18),
      rightArmGeo: createLoftedLimbGeo(rArmPts, armR, 32, 18),
      leftLegGeo: createLoftedLimbGeo(
        [
          [-0.14, -0.58, 0.02],
          [-0.15, -0.58, 0.30],
          [-0.15, -0.64, 0.54],
          [-0.15, -0.94, 0.58],
          [-0.15, -1.26, 0.54],
        ],
        legR,
        36,
        20,
      ),
      rightLegGeo: createLoftedLimbGeo(
        [
          [0.14, -0.58, 0.02],
          [0.15, -0.58, 0.30],
          [0.15, -0.64, 0.54],
          [0.15, -0.94, 0.58],
          [0.15, -1.26, 0.54],
        ],
        legR,
        36,
        20,
      ),
    };
  }, [armPose]);

  const lungLobeGeo = useMemo(() => {
    const pts = [
      new THREE.Vector2(0.005, -0.20),
      new THREE.Vector2(0.098, -0.17),
      new THREE.Vector2(0.122, -0.08),
      new THREE.Vector2(0.115, 0.03),
      new THREE.Vector2(0.094, 0.14),
      new THREE.Vector2(0.058, 0.22),
      new THREE.Vector2(0.005, 0.25),
    ];
    const g = new THREE.LatheGeometry(pts, 32);
    g.scale(0.96, 1.0, 0.78);
    return g;
  }, []);

  const arteryBranches = useMemo(() => {
    const mainTrunk = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.01, 0.54, 0.03),
      new THREE.Vector3(0.03, 0.24, 0.05),
      new THREE.Vector3(-0.01, -0.04, 0.04),
      new THREE.Vector3(0.01, -0.36, 0.02),
      new THREE.Vector3(0.0, -0.72, 0.00),
    ]);
    const leftBranch = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.02, 0.22, 0.05),
      new THREE.Vector3(-0.14, 0.34, 0.03),
      new THREE.Vector3(-0.28, 0.40, 0.01),
    ]);
    const rightBranch = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.02, 0.22, 0.05),
      new THREE.Vector3(0.16, 0.34, 0.03),
      new THREE.Vector3(0.28, 0.40, 0.01),
    ]);
    const leftLeg = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.01, -0.34, 0.02),
      new THREE.Vector3(-0.11, -0.56, 0.01),
      new THREE.Vector3(-0.16, -0.78, 0.00),
    ]);
    const rightLeg = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.01, -0.34, 0.02),
      new THREE.Vector3(0.11, -0.56, 0.01),
      new THREE.Vector3(0.16, -0.78, 0.00),
    ]);
    return {
      curves: [mainTrunk, leftBranch, rightBranch, leftLeg, rightLeg],
      geos: [
        new THREE.TubeGeometry(mainTrunk, 36, 0.030, 14, false),
        new THREE.TubeGeometry(leftBranch, 18, 0.019, 10, false),
        new THREE.TubeGeometry(rightBranch, 18, 0.019, 10, false),
        new THREE.TubeGeometry(leftLeg, 18, 0.021, 10, false),
        new THREE.TubeGeometry(rightLeg, 18, 0.021, 10, false),
      ],
    };
  }, []);

  // Anatomical curved ribs tucked 100% INSIDE the translucent amber chest cavity!
  const ribGeometries = useMemo(() => {
    const ribs: THREE.TubeGeometry[] = [];
    for (let i = 0; i < 10; i++) {
      const t = i / 9;
      const y = 0.42 - t * 0.52;
      const rx = 0.204 - Math.abs(t - 0.38) * 0.055;
      const rz = 0.132 - Math.abs(t - 0.38) * 0.028;
      const spineZ = -0.118 + Math.sin(t * Math.PI) * 0.014;
      for (const side of [-1, 1]) {
        const curvePts: THREE.Vector3[] = [];
        const steps = 16;
        const maxArc = i >= 8 ? Math.PI * 0.66 : Math.PI * 0.92;
        for (let s = 0; s <= steps; s++) {
          const ang = (s / steps) * maxArc;
          const px = side * Math.sin(ang) * rx;
          const pz = spineZ + (1 - Math.cos(ang)) * rz;
          const py = y - Math.sin(ang * 0.85) * 0.052;
          curvePts.push(new THREE.Vector3(px, py, pz));
        }
        const curve = new THREE.CatmullRomCurve3(curvePts);
        ribs.push(new THREE.TubeGeometry(curve, 22, 0.0135, 10, false));
      }
    }
    return ribs;
  }, []);

  const spleenGeo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.02, 0.14, 0.01),
      new THREE.Vector3(0.03, 0.03, 0.03),
      new THREE.Vector3(0.02, -0.09, 0.02),
      new THREE.Vector3(-0.01, -0.18, -0.01),
    ]);
    const g = new THREE.TubeGeometry(curve, 24, 0.068, 16, false);
    g.scale(0.95, 1.0, 0.72);
    return g;
  }, []);

  const rbcGeo = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 12; i++) {
      const r = (i / 12) * 0.020;
      const rn = i / 12;
      const halfThick =
        0.0072 * Math.sqrt(Math.max(0, 1 - rn * rn)) * (0.42 + 0.95 * rn * rn);
      pts.push(new THREE.Vector2(r, halfThick));
    }
    for (let i = 12; i >= 0; i--) {
      const r = (i / 12) * 0.020;
      const rn = i / 12;
      const halfThick =
        -0.0072 * Math.sqrt(Math.max(0, 1 - rn * rn)) * (0.42 + 0.95 * rn * rn);
      pts.push(new THREE.Vector2(r, halfThick));
    }
    return new THREE.LatheGeometry(pts, 16);
  }, []);

  const glowTex = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext('2d');
    if (ctx) {
      const g = ctx.createRadialGradient(64, 64, 2, 64, 64, 62);
      g.addColorStop(0, 'rgba(255, 244, 180, 1.0)');
      g.addColorStop(0.30, 'rgba(255, 174, 42, 0.88)');
      g.addColorStop(0.68, 'rgba(245, 124, 18, 0.24)');
      g.addColorStop(1, 'rgba(245, 124, 18, 0.0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 128, 128);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }, []);

  const silhouetteMat = useMemo(
    () =>
      createSphericalXRayMaterial({
        coreColor: palette.silhouetteBody,
        rimColor: '#FFD68A',
        mode: 'opaque_outside_sphere',
        xrayCenter: centerVec,
        xrayRadius,
        fresnelPower: 2.45,
        keyLightDir,
        keyLightColor,
      }),
    [centerVec, keyLightColor, keyLightDir, palette.silhouetteBody, xrayRadius],
  );

  const cavityMat = useMemo(
    () =>
      createSphericalXRayMaterial({
        coreColor: '#6E3604',
        rimColor: '#FFC446',
        mode: 'inside_sphere_only',
        xrayCenter: centerVec,
        xrayRadius,
        opacity: 0.84,
        fresnelPower: 1.75,
      }),
    [centerVec, xrayRadius],
  );

  const boneMat = useMemo(
    () =>
      createSphericalXRayMaterial({
        coreColor: '#8C6E34',
        rimColor: '#FFF9EA',
        mode: 'inside_sphere_only',
        xrayCenter: centerVec,
        xrayRadius,
        opacity: 0.95,
        fresnelPower: 1.30,
      }),
    [centerVec, xrayRadius],
  );

  const refOrganMat = useMemo(
    () =>
      createSphericalXRayMaterial({
        coreColor: '#B82E06',
        rimColor: '#FF8642',
        mode: 'inside_sphere_only',
        xrayCenter: centerVec,
        xrayRadius,
        opacity: 0.92,
        fresnelPower: 1.55,
      }),
    [centerVec, xrayRadius],
  );

  const heroOrganMat = useMemo(
    () =>
      createSphericalXRayMaterial({
        coreColor: '#C87606',
        rimColor: '#FFEB7A',
        mode: 'inside_sphere_only',
        xrayCenter: centerVec,
        xrayRadius,
        opacity: 0.96,
        fresnelPower: 1.28,
      }),
    [centerVec, xrayRadius],
  );

  const squeezeX = 1 - organSqueeze * 0.22;
  const squeezeY = 1 - organSqueeze * 0.10;

  return (
    <group>
      {/* 1. Seamless Sculpted Silhouette Body (1 unified Torso+Neck+Head mesh + continuous limbs!) */}
      <mesh geometry={torsoGeo} material={silhouetteMat} castShadow receiveShadow />
      {includeSeatedLimbs && (
        <group>
          <mesh geometry={leftArmGeo} material={silhouetteMat} castShadow />
          <mesh geometry={rightArmGeo} material={silhouetteMat} castShadow />
          <mesh geometry={leftLegGeo} material={silhouetteMat} castShadow />
          <mesh geometry={rightLegGeo} material={silhouetteMat} castShadow />
        </group>
      )}

      {/* 2. Internal Warm-Amber Glass X-Ray Cavity + Luminous Ivory Spine/Ribcage + Evolved Organs */}
      {xrayRadius > 0.01 && (
        <group>
          <mesh geometry={torsoGeo} material={cavityMat} scale={[0.986, 0.992, 0.986]} />
          {includeSeatedLimbs && (
            <group>
              <mesh geometry={leftArmGeo} material={cavityMat} scale={[0.98, 0.98, 0.98]} />
              <mesh geometry={rightArmGeo} material={cavityMat} scale={[0.98, 0.98, 0.98]} />
              <mesh geometry={leftLegGeo} material={cavityMat} scale={[0.98, 0.98, 0.98]} />
              <mesh geometry={rightLegGeo} material={cavityMat} scale={[0.98, 0.98, 0.98]} />
            </group>
          )}

          {/* 14 Thoracic & Lumbar Vertebrae Following Natural S-Curve Spine */}
          {Array.from({ length: 14 }).map((_, vIdx) => {
            const t = vIdx / 13;
            const vy = 0.48 - vIdx * 0.078;
            const vz = -0.125 + Math.sin(t * Math.PI) * 0.022;
            return (
              <mesh key={`vert-${vIdx}`} position={[0, vy, vz]} material={boneMat}>
                <cylinderGeometry args={[0.045, 0.047, 0.054, 20]} />
              </mesh>
            );
          })}

          {/* 10 Pairs of Curved Anatomical Ribs */}
          {ribGeometries.map((rg, rIdx) => (
            <mesh key={`rib-${rIdx}`} geometry={rg} material={boneMat} />
          ))}

          {/* Reference Organ (Heart) */}
          <mesh
            position={heroOrgan === 'lungs' ? [0.02, 0.16, 0.07] : [-0.05, 0.22, 0.05]}
            scale={heroOrgan === 'lungs' ? [0.80, 0.94, 0.78] : [0.92, 1.15, 0.85]}
            material={refOrganMat}
          >
            <sphereGeometry args={[0.105, 28, 28]} />
          </mesh>

          {/* Hero Evolved Organ */}
          {heroOrgan === 'spleen' && (
            <mesh
              geometry={spleenGeo}
              material={heroOrganMat}
              position={[0.15, -0.04, 0.02]}
              scale={[
                heroOrganScale * squeezeX,
                heroOrganScale * squeezeY,
                heroOrganScale * squeezeX,
              ]}
            />
          )}
          {heroOrgan === 'lungs' && (
            <group position={[0, 0.21, 0.03]} scale={heroOrganScale * squeezeX}>
              <mesh
                geometry={lungLobeGeo}
                position={[-0.122, 0, 0]}
                rotation={[0, 0, 0.08]}
                material={heroOrganMat}
              />
              <mesh
                geometry={lungLobeGeo}
                position={[0.122, 0, 0]}
                rotation={[0, 0, -0.08]}
                material={heroOrganMat}
              />
            </group>
          )}
          {heroOrgan !== 'spleen' && heroOrgan !== 'lungs' && (
            <mesh
              position={[0.06, 0.05, 0.04]}
              scale={[heroOrganScale * squeezeX, heroOrganScale * squeezeY, heroOrganScale]}
              material={heroOrganMat}
            >
              <sphereGeometry args={[0.13, 24, 24]} />
            </mesh>
          )}

          {glowTex && (
            <sprite position={[0, 0.18, 0.04]} scale={[0.72, 0.72, 1]}>
              <spriteMaterial
                map={glowTex}
                transparent
                opacity={0.42}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </sprite>
          )}

          {rbcFlowProgress > 0.01 && (
            <group>
              {arteryBranches.geos.map((ag, idx) => (
                <mesh key={`art-${idx}`} geometry={ag}>
                  <meshBasicMaterial
                    color="#FF784E"
                    transparent
                    opacity={0.38}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                  />
                </mesh>
              ))}
              {Array.from({ length: 72 }).map((_, cIdx) => {
                const curveIdx = cIdx < 36 ? 0 : ((cIdx - 36) % 4) + 1;
                const curve = arteryBranches.curves[curveIdx];
                const u = ((cIdx * 0.137) + rbcFlowProgress * 0.95) % 1;
                const pt = curve.getPoint(u);
                return (
                  <mesh
                    key={`rbc-${cIdx}`}
                    geometry={rbcGeo}
                    position={[
                      pt.x + Math.sin(cIdx * 3.1) * 0.011,
                      pt.y,
                      pt.z + Math.cos(cIdx * 2.3) * 0.011,
                    ]}
                    rotation={[u * 6 + cIdx, cIdx * 0.7, u * 4]}
                  >
                    <meshPhysicalMaterial
                      color="#F44336"
                      emissive="#C62828"
                      emissiveIntensity={0.75}
                      roughness={0.22}
                      clearcoat={0.72}
                    />
                  </mesh>
                );
              })}
            </group>
          )}
        </group>
      )}

      {finaleGlowIntensity > 0.01 && glowTex && (
        <sprite
          position={[0.14, -0.04, 0.24]}
          scale={[0.38 * finaleGlowIntensity, 0.38 * finaleGlowIntensity, 1]}
        >
          <spriteMaterial
            map={glowTex}
            transparent
            opacity={Math.min(1, finaleGlowIntensity)}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </sprite>
      )}
    </group>
  );
};

export interface HolographicScubaTankProps {
  reveal: number;
  crossOutProgress: number;
}

export const HolographicScubaTank3D: React.FC<HolographicScubaTankProps> = ({
  reveal,
  crossOutProgress,
}) => {
  const holoMat = useMemo(() => {
    const m = createSphericalXRayMaterial({
      coreColor: EVOLUTION_TOKENS.instruments.hologram.coreColor,
      rimColor: EVOLUTION_TOKENS.instruments.hologram.rimColor,
      mode: 'always_fresnel',
      xrayCenter: new THREE.Vector3(),
      xrayRadius: 99,
      opacity: 0.92 * reveal,
      fresnelPower: 1.35,
      additive: true,
    });
    m.depthTest = false;
    return m;
  }, [reveal]);

  if (reveal <= 0.01) return null;

  return (
    <group renderOrder={8}>
      <mesh material={holoMat} position={[0, 0, 0]} renderOrder={8}>
        <cylinderGeometry args={[0.105, 0.105, 0.50, 28, 1, true]} />
      </mesh>
      <mesh material={holoMat} position={[0, 0.25, 0]} renderOrder={8}>
        <sphereGeometry args={[0.105, 24, 16]} />
      </mesh>
      <mesh material={holoMat} position={[0, -0.25, 0]} renderOrder={8}>
        <sphereGeometry args={[0.105, 24, 16]} />
      </mesh>
      <mesh material={holoMat} position={[0, 0.37, 0]} renderOrder={8}>
        <cylinderGeometry args={[0.036, 0.036, 0.085, 16]} />
      </mesh>

      {crossOutProgress > 0.02 && (
        <group position={[0, 0.02, 0.14]} renderOrder={10}>
          <mesh rotation={[0, 0, Math.PI * 0.25]} scale={[1, Math.min(1, crossOutProgress * 1.6), 1]} renderOrder={10}>
            <boxGeometry args={[0.020, 0.56, 0.010]} />
            <meshBasicMaterial color={EVOLUTION_TOKENS.instruments.hologram.crossOutColor} depthTest={false} />
          </mesh>
          {crossOutProgress > 0.35 && (
            <mesh
              rotation={[0, 0, -Math.PI * 0.25]}
              scale={[1, Math.min(1, (crossOutProgress - 0.35) / 0.65), 1]}
              renderOrder={10}
            >
              <boxGeometry args={[0.020, 0.56, 0.010]} />
              <meshBasicMaterial color={EVOLUTION_TOKENS.instruments.hologram.crossOutColor} depthTest={false} />
            </mesh>
          )}
        </group>
      )}
    </group>
  );
};
