import React, { useMemo } from "react";
import * as THREE from "three";
import { TERRACE_TIERS, getBareSlopeY, getTerrainY } from "../ikSolver";
import {
  createHillSurfacePBR,
  createSoftGlowTexture,
  createVolcanicSoilPBR,
} from "../pbrMaterials";

export interface TerraceHillCutawayProps {
  /** 0 = bare 30° volcanic mountain slope, 1 = fully carved 4-tier flat terraces */
  terraceMorph: number;
  /** 0..1 clay pematang bund wall build-up */
  bundStrength: number;
  /** 0..1 erosion stripping dark humus topsoil to exposed gray rock (Seq 2) */
  erosionStrip: number;
  /** 0..1 animated glowing blue water infiltration seeping underground (Seq 5) */
  infiltrationProgress: number;
  /** 0..1 dense 3D fibrous rice root interlock visible in subsurface cutaway (Seq 5) */
  rootWebVisibility: number;
  /** Show mud clods & uprooted seedlings washing down 30° slope (Seq 1-2) */
  washoutActive: boolean;
  frame: number;
}

const X_MIN = -4.8;
const X_MAX = 4.8;
const Z_FRONT = 0.0;
const Z_BACK = -4.6;
const Y_BOTTOM = -3.8;
const X_SEGS = 96;
const Z_SEGS = 18;

/**
 * Live Morphing 3D Mountain Slope -> 4-Tier Stepped Terrace Geological Cutaway:
 * - Queries `getTerrainY(x, z, terraceMorph, bundStrength)` so 3D geometry matches IK feet 100.0%
 * - Smoothly transforms from steep 30° volcanic hillside into 4 crisp level paddy steps + clay pematang bunds
 * - Front cross-section (Z=0) displays 1:1 square-UV volcanic earth strata, glowing cyan infiltration plumes,
 *   and dense 3D fibrous rice roots locking soil grains together!
 */
export const TerraceHillCutaway: React.FC<TerraceHillCutawayProps> = ({
  terraceMorph,
  bundStrength,
  erosionStrip,
  infiltrationProgress,
  rootWebVisibility,
  washoutActive,
  frame,
}) => {
  const soilPBR = useMemo(() => createVolcanicSoilPBR(), []);
  const surfacePBR = useMemo(() => createHillSurfacePBR(), []);
  const glowTex = useMemo(() => createSoftGlowTexture(), []);

  // Dynamically morphed top hill/terrace surface + front cutaway cross-section geometry
  const { topGeo, frontGeo } = useMemo(() => {
    // 1. Top Surface Grid (X: -4.8..+4.8, Z: 0..-4.6)
    const tGeo = new THREE.PlaneGeometry(X_MAX - X_MIN, Math.abs(Z_BACK - Z_FRONT), X_SEGS, Z_SEGS);
    tGeo.rotateX(-Math.PI / 2);
    const tPos = tGeo.attributes.position;
    for (let i = 0; i < tPos.count; i++) {
      const x = tPos.getX(i);
      const z = tPos.getZ(i) + (Z_BACK + Z_FRONT) / 2;
      const y = getTerrainY(x, z, terraceMorph, bundStrength);
      tPos.setXYZ(i, x, y, z);
    }
    tGeo.computeVertexNormals();

    // 2. Front Geological Cutaway Face at Z = 0 (top edge tracks getTerrainY(x, 0) exactly!)
    const fGeo = new THREE.PlaneGeometry(X_MAX - X_MIN, 1.0, X_SEGS, 1);
    const fPos = fGeo.attributes.position;
    const fUv = fGeo.attributes.uv;
    for (let i = 0; i < fPos.count; i++) {
      const x = fPos.getX(i);
      const isTop = fPos.getY(i) > 0;
      const topY = getTerrainY(x, Z_FRONT, terraceMorph, bundStrength);
      const y = isTop ? topY : Y_BOTTOM;
      fPos.setXYZ(i, x, y, Z_FRONT);
      // Anchor UV V=1 cleanly at top edge so humus topsoil & roots ALWAYS hug the morphed terrace contour!
      fUv.setY(i, isTop ? 1.0 : 0.0);
    }
    fGeo.computeVertexNormals();

    return { topGeo: tGeo, frontGeo: fGeo };
  }, [terraceMorph, bundStrength]);

  // Vibrant sunlit surface tint: lush tropical green mountain slope -> warm weathered clay/rock when eroded -> rich sunlit warm volcanic mud on carved terraces!
  const surfaceColor = useMemo(() => {
    const lushSlope = new THREE.Color("#68A63C"); // Sunlit Indonesian green hillside grass/soil
    const eroded = new THREE.Color("#B69E84"); // Washed-out rocky clay-ochre
    const terraced = new THREE.Color("#A87C4F"); // Warm sunlit rich terracotta paddy loam
    const c = lushSlope.clone();
    if (erosionStrip > 0) c.lerp(eroded, erosionStrip * 0.88);
    if (terraceMorph > 0) c.lerp(terraced, terraceMorph * 0.92);
    return c;
  }, [erosionStrip, terraceMorph]);

  // Organic Curved Branching 3D Fibrous Rice Root Web (ZERO geometric zig-zag!) + Curved Percolation Veins
  const { rootMergedGeo, seepVeins } = useMemo(() => {
    const posArr: number[] = [];
    const normArr: number[] = [];
    const pushSeg = (a: THREE.Vector3, b: THREE.Vector3, rA: number, rB: number) => {
      const dir = new THREE.Vector3().subVectors(b, a);
      const len = dir.length();
      if (len < 1e-4) return;
      dir.divideScalar(len);
      const side = new THREE.Vector3(-dir.y, dir.x, 0).normalize();
      const depth = new THREE.Vector3(0, 0, 1);
      // 2 crossed ribbon quads per root segment -> volumetric 3D organic capillary root!
      for (const perp of [side, depth]) {
        const aL = a.clone().addScaledVector(perp, -rA);
        const aR = a.clone().addScaledVector(perp, rA);
        const bL = b.clone().addScaledVector(perp, -rB);
        const bR = b.clone().addScaledVector(perp, rB);
        const n = new THREE.Vector3().crossVectors(dir, perp).normalize();
        posArr.push(aL.x, aL.y, aL.z, aR.x, aR.y, aR.z, bR.x, bR.y, bR.z);
        posArr.push(aL.x, aL.y, aL.z, bR.x, bR.y, bR.z, bL.x, bL.y, bL.z);
        for (let k = 0; k < 6; k++) normArr.push(n.x, n.y, n.z);
      }
    };

    let seed = 4321;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    const growBranch = (
      start: THREE.Vector3,
      angle: number,
      steps: number,
      stepLen: number,
      radius: number,
      depth: number
    ) => {
      let cur = start.clone();
      let ang = angle;
      let r = radius;
      for (let s = 0; s < steps; s++) {
        ang += (rand() - 0.5) * 0.58;
        // Gentle gravity pull downward
        ang = ang * 0.86;
        const nxt = new THREE.Vector3(
          cur.x + Math.sin(ang) * stepLen,
          cur.y - Math.cos(ang) * stepLen,
          cur.z + (rand() - 0.5) * 0.008
        );
        const nextR = r * 0.78;
        pushSeg(cur, nxt, r, nextR);
        if (depth > 0 && s >= 1 && s < steps - 1 && rand() > 0.35) {
          growBranch(
            nxt,
            ang + (rand() > 0.5 ? 0.55 : -0.55) + (rand() - 0.5) * 0.3,
            Math.max(2, steps - s),
            stepLen * 0.8,
            nextR * 0.82,
            depth - 1
          );
        }
        cur = nxt;
        r = nextR;
      }
    };

    for (const tier of TERRACE_TIERS) {
      const clumps = 11;
      for (let c = 0; c < clumps; c++) {
        const fx = (c + 0.35 + rand() * 0.3) / clumps;
        const rx = tier.xStart + 0.16 + fx * (tier.bundX - tier.xStart - 0.32);
        const rootTop = new THREE.Vector3(rx, tier.floorY - 0.01, 0);
        // 4-5 varied curving primary root filaments radiating organically from each paddy clump
        for (let f = 0; f < 4; f++) {
          const initAng = (f - 1.5) * 0.42 + (rand() - 0.5) * 0.35;
          growBranch(rootTop, initAng, 5 + Math.floor(rand() * 3), 0.085 + rand() * 0.035, 0.011, 2);
        }
      }
    }

    const rGeo = new THREE.BufferGeometry();
    rGeo.setAttribute("position", new THREE.Float32BufferAttribute(posArr, 3));
    rGeo.setAttribute("normal", new THREE.Float32BufferAttribute(normArr, 3));

    // Gently winding organic underground water percolation curves below each terrace!
    const veins: {
      tierId: number;
      tierIdx: number;
      k: number;
      curve: THREE.CatmullRomCurve3;
      tubeGeo: THREE.TubeGeometry;
    }[] = [];
    TERRACE_TIERS.forEach((tier, tIdx) => {
      const cx = (tier.xStart + tier.bundX) * 0.5;
      [-0.62, -0.18, 0.24, 0.66].forEach((ox, k) => {
        const pts: THREE.Vector3[] = [];
        for (let s = 0; s <= 6; s++) {
          const f = s / 6;
          const wiggle = Math.sin(f * Math.PI * 2.2 + k * 1.7 + tIdx) * 0.095;
          pts.push(new THREE.Vector3(cx + ox + wiggle, tier.floorY - 0.04 - f * 1.65, 0));
        }
        const curve = new THREE.CatmullRomCurve3(pts);
        const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.022, 6, false);
        veins.push({ tierId: tier.id, tierIdx: tIdx, k, curve, tubeGeo });
      });
    });

    return { rootMergedGeo: rGeo, seepVeins: veins };
  }, []);

  return (
    <group>
      {/* 1. Morphing 3D Mountain Slope / 4-Tier Terrace Top Surface */}
      <mesh geometry={topGeo} receiveShadow castShadow>
        <meshStandardMaterial
          map={surfacePBR.map}
          normalMap={surfacePBR.normalMap}
          roughnessMap={surfacePBR.roughnessMap}
          normalScale={new THREE.Vector2(0.85, 0.85)}
          color={surfaceColor}
          roughness={0.86}
        />
      </mesh>

      {/* Exposed Gray Hard Volcanic Rocks appearing when fertile topsoil washes off in Seq 2! */}
      {erosionStrip > 0.15 && (
        <group>
          {[-2.4, -1.6, -0.8, 0.1, 0.9, 1.8, 2.6, -1.1, 0.5, 1.4].map((rx, i) => {
            const rz = -0.55 - (i % 4) * 0.85;
            const ry = getBareSlopeY(rx) - 0.02 + Math.max(0, -rz - 0.5) * 0.035 * Math.sin(rx * 0.65);
            const s = (0.09 + (i % 3) * 0.045) * erosionStrip;
            return (
              <mesh key={i} position={[rx, ry, rz]} rotation={[i, i * 1.4, 0.3]} scale={[s * 1.3, s * 0.75, s]} castShadow>
                <dodecahedronGeometry args={[1, 0]} />
                <meshStandardMaterial color="#8A8580" roughness={0.92} />
              </mesh>
            );
          })}
        </group>
      )}

      {/* 2. Front Geological Cross-Section Wall (Z = 0) */}
      <mesh geometry={frontGeo} receiveShadow>
        <meshStandardMaterial
          map={soilPBR.map}
          normalMap={soilPBR.normalMap}
          roughnessMap={soilPBR.roughnessMap}
          normalScale={new THREE.Vector2(0.85, 0.85)}
          emissive="#3A2110"
          emissiveIntensity={0.14}
          roughness={0.92}
        />
      </mesh>

      {/* 3. Seq 1–2 Animated Eroded Dirt Clods & Uprooted Seedlings Sliding Rapidly Down 30° Slope */}
      {washoutActive && (
        <group>
          {Array.from({ length: 18 }).map((_, i) => {
            const cyc = (frame * 0.036 + i * 0.17) % 1;
            const x = -3.4 + cyc * 7.4;
            const z = -0.35 - (i % 5) * 0.52;
            const y = getBareSlopeY(x) + 0.05 + Math.sin(cyc * 18 + i) * 0.03;
            const isSeedling = i % 3 === 0;
            return isSeedling ? (
              <mesh
                key={i}
                position={[x, y + 0.04, z]}
                rotation={[0.4, frame * 0.1 + i, -1.25 - cyc * 0.8]}
              >
                <coneGeometry args={[0.045, 0.24, 5]} />
                <meshStandardMaterial color="#67A834" roughness={0.7} />
              </mesh>
            ) : (
              <mesh key={i} position={[x, y, z]} rotation={[frame * 0.25 + i, i, 0]}>
                <dodecahedronGeometry args={[0.042 + (i % 3) * 0.016, 0]} />
                <meshStandardMaterial color={i % 2 === 0 ? "#5C3920" : "#7A4D2C"} roughness={0.94} />
              </mesh>
            );
          })}
        </group>
      )}

      {/* Subtle Organic Rounded Grass Turf Trim Hugging Carved Terrace Pematang Crest */}
      {terraceMorph > 0.42 && (
        <group>
          {TERRACE_TIERS.map((tier) => (
            <mesh
              key={tier.id}
              position={[tier.bundX + 0.01, tier.bundTopY - 0.065 - 0.03 * (1 - bundStrength), -2.3]}
              rotation={[Math.PI / 2, 0, 0]}
              scale={[1.15, 1, 0.52 * Math.min(1, (terraceMorph - 0.42) / 0.52)]}
              receiveShadow
            >
              <cylinderGeometry args={[0.11, 0.11, 4.52, 10]} />
              <meshStandardMaterial color="#589B34" roughness={0.88} />
            </mesh>
          ))}
        </group>
      )}

      {/* 4. Seq 5 Winding Glowing Cyan-Blue Subsurface Water Infiltration Veins Seeping into Aquifer */}
      {infiltrationProgress > 0.02 && (
        <group position={[0, 0, 0.024]}>
          {seepVeins.map((v, idx) => {
            const p = (frame * 0.026 + v.k * 0.27 + v.tierIdx * 0.19) % 1;
            const pt = v.curve.getPoint(Math.min(0.99, p * infiltrationProgress));
            const fade = Math.sin(p * Math.PI) * infiltrationProgress;
            return (
              <group key={idx}>
                <mesh geometry={v.tubeGeo}>
                  <meshBasicMaterial
                    color="#42C4FF"
                    transparent
                    opacity={0.34 * infiltrationProgress}
                    depthWrite={false}
                  />
                </mesh>
                <sprite position={[pt.x, pt.y, 0.025]} scale={[0.28, 0.28, 1]}>
                  <spriteMaterial
                    map={glowTex}
                    color="#7CE6FF"
                    transparent
                    opacity={0.88 * fade}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                  />
                </sprite>
              </group>
            );
          })}
          {TERRACE_TIERS.map((tier) => {
            const cx = (tier.xStart + tier.bundX) * 0.5;
            return (
              <sprite
                key={tier.id}
                position={[cx, tier.floorY - 1.72, 0.01]}
                scale={[2.0 * infiltrationProgress, 0.65 * infiltrationProgress, 1]}
              >
                <spriteMaterial
                  map={glowTex}
                  color="#269DF5"
                  transparent
                  opacity={0.52 * infiltrationProgress}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </sprite>
            );
          })}
        </group>
      )}

      {/* 5. Seq 5 Organic Branching 3D Fibrous Rice Root Net Interlocking Volcanic Soil Granules */}
      {rootWebVisibility > 0.02 && (
        <group position={[0, 0, 0.03]}>
          <mesh geometry={rootMergedGeo}>
            <meshStandardMaterial
              color="#EDD49B"
              emissive="#A67E3C"
              emissiveIntensity={0.28 * rootWebVisibility}
              roughness={0.68}
              transparent
              opacity={Math.min(1, rootWebVisibility * 1.15)}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      )}
    </group>
  );
};
