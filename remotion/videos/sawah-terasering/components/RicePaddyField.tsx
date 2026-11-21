import React, { useMemo } from "react";
import * as THREE from "three";
import { TERRACE_TIERS, getBareSlopeY } from "../ikSolver";

export interface RicePaddyFieldProps {
  /** 0..1 visibility & lush height growth of terraced paddy rice across all 4 tiers */
  growth: number;
  /** 0 = fresh young green -> 0.5 = deep vibrant emerald -> 1.0 = golden sunset harvest */
  goldenFactor: number;
  /** 0..1 visibility of fragile seedlings planted directly on bare 30° slope in Seq 1 */
  slopeSeedlingsAlpha: number;
  /** 0..1 washout sweep knocking bare-slope seedlings sideways & downstream */
  slopeWashout: number;
  frame: number;
}

function seededRand(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Helper: synchronously merges an array of simple triangle buffers into ONE BufferGeometry
 * (1 GPU draw call, zero InstancedMesh flicker in headless ANGLE Chrome!)
 */
function buildMergedBladeGroup(
  clumps: { x: number; y: number; z: number; scale: number; seed: number }[],
  includePanicles: boolean
): { leafGeo: THREE.BufferGeometry; grainGeo: THREE.BufferGeometry } {
  const leafPos: number[] = [];
  const leafNorm: number[] = [];
  const grainPos: number[] = [];
  const grainNorm: number[] = [];

  const pushTri = (
    arrPos: number[],
    arrNorm: number[],
    a: THREE.Vector3,
    b: THREE.Vector3,
    c: THREE.Vector3
  ) => {
    const ab = new THREE.Vector3().subVectors(b, a);
    const ac = new THREE.Vector3().subVectors(c, a);
    const n = new THREE.Vector3().crossVectors(ab, ac).normalize();
    arrPos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    arrNorm.push(n.x, n.y, n.z, n.x, n.y, n.z, n.x, n.y, n.z);
  };

  const rand = seededRand(909);

  for (const cl of clumps) {
    // 5 curved tapering rice blades fanning organically out of each paddy clump
    const blades = 5;
    for (let b = 0; b < blades; b++) {
      const ang = (b / blades) * Math.PI * 2 + (cl.seed % 6.28) + (rand() - 0.5) * 0.45;
      const h = (0.34 + rand() * 0.16) * cl.scale;
      const lean = (0.11 + rand() * 0.12) * cl.scale;
      const w = 0.026 * cl.scale;

      const dx = Math.cos(ang);
      const dz = Math.sin(ang);
      const px = -dz * w;
      const pz = dx * w;

      const baseL = new THREE.Vector3(cl.x - px, cl.y, cl.z - pz);
      const baseR = new THREE.Vector3(cl.x + px, cl.y, cl.z + pz);
      const midL = new THREE.Vector3(cl.x + dx * lean * 0.45 - px * 0.6, cl.y + h * 0.58, cl.z + dz * lean * 0.45 - pz * 0.6);
      const midR = new THREE.Vector3(cl.x + dx * lean * 0.45 + px * 0.6, cl.y + h * 0.58, cl.z + dz * lean * 0.45 + pz * 0.6);
      const tip = new THREE.Vector3(cl.x + dx * lean * 1.15, cl.y + h, cl.z + dz * lean * 1.15);

      pushTri(leafPos, leafNorm, baseL, baseR, midR);
      pushTri(leafPos, leafNorm, baseL, midR, midL);
      pushTri(leafPos, leafNorm, midL, midR, tip);

      // Drooping golden rice grain panicle on taller blades
      if (includePanicles && b % 2 === 0) {
        const pMid = new THREE.Vector3(
          tip.x + dx * 0.045 * cl.scale,
          tip.y + 0.025 * cl.scale,
          tip.z + dz * 0.045 * cl.scale
        );
        const pTip = new THREE.Vector3(
          tip.x + dx * 0.095 * cl.scale,
          tip.y - 0.045 * cl.scale,
          tip.z + dz * 0.095 * cl.scale
        );
        const pw = 0.018 * cl.scale;
        const gA = new THREE.Vector3(tip.x - dz * pw, tip.y, tip.z + dx * pw);
        const gB = new THREE.Vector3(tip.x + dz * pw, tip.y, tip.z - dx * pw);
        pushTri(grainPos, grainNorm, gA, gB, pMid);
        pushTri(grainPos, grainNorm, gA, pMid, pTip);
      }
    }
  }

  const leafGeo = new THREE.BufferGeometry();
  leafGeo.setAttribute("position", new THREE.Float32BufferAttribute(leafPos, 3));
  leafGeo.setAttribute("normal", new THREE.Float32BufferAttribute(leafNorm, 3));

  const grainGeo = new THREE.BufferGeometry();
  grainGeo.setAttribute("position", new THREE.Float32BufferAttribute(grainPos, 3));
  grainGeo.setAttribute("normal", new THREE.Float32BufferAttribute(grainNorm, 3));

  return { leafGeo, grainGeo };
}

/**
 * Swaying Multi-Tier Indonesian Rice Paddy Field:
 * - Built as 4 synchronous merged BufferGeometry tier groups (low draw calls, zero headless flicker!)
 * - Organic rippling breeze wave per tier + smooth color maturation from young green -> emerald -> golden sunset
 * - Also renders fragile Seq 1 seedlings planted on the bare 30° slope before monsoon washes them out!
 */
export const RicePaddyField: React.FC<RicePaddyFieldProps> = ({
  growth,
  goldenFactor,
  slopeSeedlingsAlpha,
  slopeWashout,
  frame,
}) => {
  // Prebuild 4 merged terrace paddy tier geometries anchored at each tier's floorY (local Y=0 -> easy scale & wind sway!)
  const tierMeshes = useMemo(() => {
    const rand = seededRand(777);
    return TERRACE_TIERS.map((tier, tIdx) => {
      const clumps: { x: number; y: number; z: number; scale: number; seed: number }[] = [];
      const xMin = tier.xStart + 0.28;
      const xMax = tier.bundX - 0.28;
      const cols = 7;
      const rows = 8;
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const fx = cols > 1 ? c / (cols - 1) : 0.5;
          const fz = rows > 1 ? r / (rows - 1) : 0.5;
          const cx = xMin + fx * (xMax - xMin) + (rand() - 0.5) * 0.14;
          const cz = -0.35 - fz * 3.65 + (rand() - 0.5) * 0.16;
          // Leave clean standing clearance pocket on Tier 2 near front-center for farmer if needed
          if (tier.id === 2 && cx > 0.35 && cx < 1.25 && cz > -1.35 && cz < -0.5) continue;
          clumps.push({
            x: cx,
            y: 0,
            z: cz,
            scale: 0.85 + rand() * 0.35,
            seed: (tIdx * 100 + c * 13 + r * 7) * 0.71,
          });
        }
      }
      const { leafGeo, grainGeo } = buildMergedBladeGroup(clumps, true);
      return { tier, leafGeo, grainGeo };
    });
  }, []);

  // Prebuild bare-slope seedlings for Seq 1 hook (planted directly on 30° hillside!)
  const slopeSeedlings = useMemo(() => {
    const items: { x: number; y: number; z: number; seed: number }[] = [];
    const xs = [-1.45, -1.05, -0.65, -0.25, 0.15, 0.55, -1.25, -0.85, -0.45, -0.05, 0.35, -0.95, -0.35, 0.25];
    const zs = [-0.65, -0.78, -0.62, -0.82, -0.70, -0.86, -1.25, -1.32, -1.18, -1.38, -1.22, -1.72, -1.68, -1.78];
    for (let i = 0; i < xs.length; i++) {
      const x = xs[i];
      const z = zs[i];
      const y = getBareSlopeY(x) + Math.max(0, -z - 0.5) * 0.035 * Math.sin(x * 0.65);
      items.push({ x, y, z, seed: i * 1.9 });
    }
    return items;
  }, []);

  const leafColor = useMemo(() => {
    const young = new THREE.Color("#6CC434");
    const emerald = new THREE.Color("#3D962E");
    const gold = new THREE.Color("#C9A538");
    const c = young.clone();
    if (goldenFactor < 0.5) {
      c.lerp(emerald, goldenFactor * 2);
    } else {
      c.copy(emerald).lerp(gold, (goldenFactor - 0.5) * 2);
    }
    return c;
  }, [goldenFactor]);

  const grainColor = useMemo(() => {
    return new THREE.Color("#8EC440").lerp(new THREE.Color("#F5CB4C"), Math.min(1, goldenFactor * 1.15));
  }, [goldenFactor]);

  return (
    <group>
      {/* 1. Fragile Seq 1 Seedlings Planted Directly on 30° Bare Slope (Swept Away by Monsoon!) */}
      {slopeSeedlingsAlpha > 0.01 && (
        <group>
          {slopeSeedlings.map((sl, i) => {
            // Each seedling starts getting uprooted & swept downslope when slopeWashout > 0
            const slideT = Math.max(0, slopeWashout * 1.35 - (i % 5) * 0.08);
            const sx = sl.x + slideT * 4.4;
            const sy = getBareSlopeY(sx) + Math.max(0, -sl.z - 0.5) * 0.035 * Math.sin(sx * 0.65);
            const tiltZ = -0.12 - slideT * 1.35 + Math.sin(frame * 0.14 + sl.seed) * 0.08;
            const visScale = Math.max(0, slopeSeedlingsAlpha * 1.45 * (1 - Math.max(0, slideT - 0.75) * 3.5));
            if (visScale <= 0.02) return null;
            return (
              <group key={i} position={[sx, sy, sl.z]} rotation={[0, sl.seed, tiltZ]} scale={[visScale, visScale, visScale]}>
                {[-0.26, 0, 0.26].map((ang, k) => (
                  <mesh key={k} position={[Math.sin(ang) * 0.045, 0.15, Math.cos(ang) * 0.03]} rotation={[0.15, ang, ang * 0.8]}>
                    <coneGeometry args={[0.028, 0.30, 5]} />
                    <meshStandardMaterial color="#78D438" roughness={0.62} side={THREE.DoubleSide} />
                  </mesh>
                ))}
              </group>
            );
          })}
        </group>
      )}

      {/* 2. Lush Multi-Tier Flooded Terrace Rice Paddies (Swaying Gently in Mountain Breeze) */}
      {growth > 0.02 && (
        <group>
          {tierMeshes.map(({ tier, leafGeo, grainGeo }, idx) => {
            // Subtle traveling breeze wave rolling from upper terrace to lower terrace
            const swayZ = Math.sin(frame * 0.075 - idx * 0.75) * 0.042;
            const swayX = Math.cos(frame * 0.055 + idx * 0.6) * 0.022;
            const tierGrowth = Math.max(0.01, Math.min(1, growth * 1.12 - idx * 0.03));
            return (
              <group
                key={tier.id}
                position={[0, tier.floorY + 0.01, 0]}
                scale={[1, tierGrowth, 1]}
                rotation={[swayX, 0, swayZ]}
              >
                <mesh geometry={leafGeo} castShadow receiveShadow>
                  <meshStandardMaterial
                    color={leafColor}
                    roughness={0.68}
                    side={THREE.DoubleSide}
                  />
                </mesh>
                {goldenFactor > 0.35 && (
                  <mesh geometry={grainGeo} castShadow>
                    <meshStandardMaterial
                      color={grainColor}
                      emissive="#8F6A18"
                      emissiveIntensity={Math.max(0, (goldenFactor - 0.5) * 0.22)}
                      roughness={0.56}
                      side={THREE.DoubleSide}
                    />
                  </mesh>
                )}
              </group>
            );
          })}
        </group>
      )}
    </group>
  );
};
