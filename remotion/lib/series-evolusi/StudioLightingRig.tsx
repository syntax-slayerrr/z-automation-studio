import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';

export type StudioLightingMood =
  | 'alpine_glacier'
  | 'himalayan_daylight'
  | 'golden_sunset_deck'
  | 'dna_studio_bokeh'
  | 'summit_twilight'
  | 'forest_emerald'
  | 'savanna_heat';

/**
 * Synthetic PMREM Studio HDRI Environment Injector (`SyntheticHdriEnvironment`)
 * Generates an ANGLE-safe procedural HDRI dome via `PMREMGenerator` so metallic ice-axes,
 * glossy carved walnut goggles, wet snow, wooden planks, and smooth DNA double-helix tubes
 * catch genuine Blender-Cycles-style specular reflections & soft multi-directional bounce light!
 */
export const SyntheticHdriEnvironment: React.FC<{ mood: StudioLightingMood }> = ({ mood }) => {
  const { gl, scene } = useThree();

  const envMap = useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    pmrem.compileEquirectangularShader();

    const envScene = new THREE.Scene();

    const palettes: Record<
      StudioLightingMood,
      { top: string; mid: string; bot: string; key: string; rim: string }
    > = {
      alpine_glacier: {
        top: '#8AD4FF',
        mid: '#1A5684',
        bot: '#061829',
        key: '#E8F7FF',
        rim: '#48D4FF',
      },
      himalayan_daylight: {
        top: '#B8DCF8',
        mid: '#DCEBF5',
        bot: '#4B5763',
        key: '#FFF2D6',
        rim: '#90D0F8',
      },
      golden_sunset_deck: {
        top: '#FFE4BA',
        mid: '#D49A5E',
        bot: '#382212',
        key: '#FFD48A',
        rim: '#6BB8E8',
      },
      dna_studio_bokeh: {
        top: '#FFBE6B',
        mid: '#5E3818',
        bot: '#0D364D',
        key: '#FFD27A',
        rim: '#38E0F5',
      },
      summit_twilight: {
        top: '#52A8E0',
        mid: '#0F3659',
        bot: '#040F1C',
        key: '#B8E8FF',
        rim: '#FFB84D',
      },
      forest_emerald: {
        top: '#58A882',
        mid: '#154434',
        bot: '#061A14',
        key: '#C6F5D2',
        rim: '#76E2B0',
      },
      savanna_heat: {
        top: '#FFE29A',
        mid: '#CF7B2C',
        bot: '#381B08',
        key: '#FFF0B8',
        rim: '#FF9A3C',
      },
    };

    const p = palettes[mood];
    const domeGeo = new THREE.SphereGeometry(20, 24, 16);
    const domeMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        uTop: { value: new THREE.Color(p.top) },
        uMid: { value: new THREE.Color(p.mid) },
        uBot: { value: new THREE.Color(p.bot) },
      },
      vertexShader: `
        varying vec3 vPos;
        void main() {
          vPos = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uTop;
        uniform vec3 uMid;
        uniform vec3 uBot;
        varying vec3 vPos;
        void main() {
          float y = vPos.y;
          vec3 col = y > 0.0 ? mix(uMid, uTop, pow(y, 0.7)) : mix(uMid, uBot, pow(-y, 0.7));
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    envScene.add(new THREE.Mesh(domeGeo, domeMat));

    // Studio softbox key panel (bright upper-left specular reflection)
    const keyBox = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 9),
      new THREE.MeshBasicMaterial({ color: p.key, side: THREE.DoubleSide }),
    );
    keyBox.position.set(-8, 7, 8);
    keyBox.lookAt(0, 0, 0);
    envScene.add(keyBox);

    // Secondary rim softbox panel (crisp edge reflection on opposite side)
    const rimBox = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 8),
      new THREE.MeshBasicMaterial({ color: p.rim, side: THREE.DoubleSide }),
    );
    rimBox.position.set(9, 2, -6);
    rimBox.lookAt(0, 0, 0);
    envScene.add(rimBox);

    const rt = pmrem.fromScene(envScene, 0.04);
    domeGeo.dispose();
    domeMat.dispose();
    pmrem.dispose();
    return rt.texture;
  }, [gl, mood]);

  useEffect(() => {
    const prev = scene.environment;
    scene.environment = envMap;
    return () => {
      scene.environment = prev;
      envMap.dispose();
    };
  }, [envMap, scene]);

  return null;
};

/**
 * Animated Volumetric FBM Atmosphere + Crepuscular God-Ray Sky Backdrop (`VolumetricSkyBackdrop3D`)
 * Replaces flat CSS gradients with rich, undulating, Blender-grade volumetric clouds, alpine light shafts,
 * subtle caustic-like snow glare, and moody depth haze matching ref_01_hook.png & ref_village_cu.png!
 */
export const VolumetricSkyBackdrop3D: React.FC<{
  frame: number;
  mood:
    | 'alpine_deep'
    | 'daylight_cumulus'
    | 'golden_deck'
    | 'summit_beams'
    | 'forest_canopy'
    | 'savanna_blazing'
    | 'cold_twilight_skin';
  position?: [number, number, number];
  scale?: [number, number, number];
}> = ({ frame, mood, position = [0, 0.2, -8.5], scale = [18, 28, 1] }) => {
  const mat = useMemo(() => {
    const cfg =
      mood === 'daylight_cumulus'
        ? {
            top: '#6DA4CE',
            mid: '#CFE0EE',
            bot: '#E7DED2',
            cloud: '#FFFFFF',
            ray: '#FFF6E2',
            rayStrength: 0.22,
            cloudStrength: 0.65,
          }
        : mood === 'golden_deck'
          ? {
              top: '#7B5F47',
              mid: '#D9A875',
              bot: '#F5DFC0',
              cloud: '#FFF2DC',
              ray: '#FFE2A8',
              rayStrength: 0.34,
              cloudStrength: 0.48,
            }
          : mood === 'forest_canopy'
            ? {
                top: '#24664D',
                mid: '#113A2C',
                bot: '#051510',
                cloud: '#82D9AE',
                ray: '#B8F5CE',
                rayStrength: 0.48,
                cloudStrength: 0.44,
              }
            : mood === 'savanna_blazing'
              ? {
                  top: '#244A6E',
                  mid: '#C98344',
                  bot: '#FCE1A6',
                  cloud: '#FFF5DC',
                  ray: '#FFE8A4',
                  rayStrength: 0.56,
                  cloudStrength: 0.54,
                }
              : mood === 'cold_twilight_skin'
                ? {
                    top: '#184A73',
                    mid: '#0C2A45',
                    bot: '#040F1C',
                    cloud: '#7CC6F2',
                    ray: '#A4E2FF',
                    rayStrength: 0.38,
                    cloudStrength: 0.48,
                  }
                : mood === 'summit_beams'
                  ? {
                      top: '#2474A8',
                      mid: '#0F416B',
                      bot: '#041222',
                      cloud: '#8CD8FF',
                      ray: '#A6E8FF',
                      rayStrength: 0.44,
                      cloudStrength: 0.50,
                    }
                  : {
                      top: '#247BB0',
                      mid: '#0E4874',
                      bot: '#04182B',
                      cloud: '#7ED6FF',
                      ray: '#9EE8FF',
                      rayStrength: 0.40,
                      cloudStrength: 0.56,
                    };

    return new THREE.ShaderMaterial({
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uTop: { value: new THREE.Color(cfg.top) },
        uMid: { value: new THREE.Color(cfg.mid) },
        uBot: { value: new THREE.Color(cfg.bot) },
        uCloud: { value: new THREE.Color(cfg.cloud) },
        uRay: { value: new THREE.Color(cfg.ray) },
        uRayStrength: { value: cfg.rayStrength },
        uCloudStrength: { value: cfg.cloudStrength },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uTop;
        uniform vec3 uMid;
        uniform vec3 uBot;
        uniform vec3 uCloud;
        uniform vec3 uRay;
        uniform float uRayStrength;
        uniform float uCloudStrength;
        varying vec2 vUv;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }
        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
            u.y
          );
        }
        float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
          for (int i = 0; i < 4; i++) {
            v += a * noise(p);
            p = rot * p * 2.05;
            a *= 0.5;
          }
          return v;
        }

        void main() {
          float y = vUv.y;
          vec3 col = y > 0.45
            ? mix(uMid, uTop, smoothstep(0.45, 1.0, y))
            : mix(uBot, uMid, smoothstep(0.0, 0.45, y));

          // Layered drifting volumetric clouds / misty haze (matches ref_01_hook.png & ref_village_cu.png!)
          vec2 q = vec2(vUv.x * 3.4 + uTime * 0.045, vUv.y * 4.2 - uTime * 0.02);
          float n1 = fbm(q);
          float n2 = fbm(q * 1.9 + vec2(3.1, -uTime * 0.03));
          float cloudMask = smoothstep(0.36, 0.82, n1 * 0.68 + n2 * 0.32) * smoothstep(0.18, 0.88, y);
          col = mix(col, uCloud, cloudMask * uCloudStrength);

          // Angled diagonal volumetric crepuscular sunbeams / light shafts!
          vec2 rayOrigin = vec2(0.26, 1.15);
          vec2 dir = vUv - rayOrigin;
          float ang = atan(dir.y, dir.x);
          float beams = sin(ang * 14.0 + uTime * 0.25) * 0.5 + 0.5;
          beams *= sin(ang * 23.0 - uTime * 0.18) * 0.5 + 0.5;
          float radialFalloff = smoothstep(1.35, 0.12, length(dir));
          col += uRay * pow(beams, 1.8) * radialFalloff * uRayStrength;

          // Subtle cinematic edge vignette built right into atmosphere
          float vig = smoothstep(0.95, 0.25, length(vUv - 0.5));
          col *= mix(0.76, 1.0, vig);

          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
  }, [mood]);

  mat.uniforms.uTime.value = frame / 30;

  return (
    <mesh position={position} scale={scale} renderOrder={-10}>
      <planeGeometry args={[1, 1]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
};
