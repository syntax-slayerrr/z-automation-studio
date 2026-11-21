import React, { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  createFoliagePBR,
  createStuccoPBR,
  createTerracottaRoofPBR,
  PBRTriplet,
} from "../pbrMaterials";

export interface VillageBackdropProps {
  weather?: "day" | "rain" | "dusk";
  rainIntensity?: number;
  duskFactor?: number;
  houseLightsOn?: boolean;
  frame?: number;
}

/**
 * Authentic Multi-Layered Tropical Indonesian Tree (1:1 match to shot_003.jpg, shot_009.jpg, shot_024.jpg):
 * - Gnarled branching trunk with secondary limbs
 * - Asymmetric mix of deep mossy dark-olive foliage mounds + airy bright-green sunlit leaf tufts
 * - NEVER uniform symmetrical broccoli balloons!
 */
const OrganicTropicalTree: React.FC<{
  position: [number, number, number];
  scale?: number;
  seed?: number;
  duskFactor?: number;
  foliagePBR: PBRTriplet;
}> = ({ position, scale = 1.0, seed = 1, duskFactor = 0, foliagePBR }) => {
  const isDusk = duskFactor > 0.45;

  // Deterministic asymmetric crown clusters per tree seed so every tree has a distinct organic silhouette
  const clusters = useMemo(() => {
    const s = (n: number) => Math.sin(seed * 12.9898 + n * 78.233) * 0.5;
    const base: { p: [number, number, number]; sc: [number, number, number]; tone: "dark" | "mid" | "light" }[] = [
      // Core mossy dark-olive structural lobes (characteristic @gimanabisaid Blender tree blobs)
      { p: [-0.95 + s(1) * 0.3, 0.2 + s(2) * 0.25, 0.2], sc: [0.85, 0.78, 0.8], tone: "dark" },
      { p: [0.88 + s(3) * 0.3, 0.45 + s(4) * 0.3, 0.12], sc: [0.92, 0.84, 0.85], tone: "dark" },
      { p: [-0.15 + s(5) * 0.25, 0.95 + s(6) * 0.25, 0.08], sc: [0.95, 0.88, 0.86], tone: "mid" },
      { p: [-1.25 + s(7) * 0.25, 1.15 + s(8) * 0.3, -0.15], sc: [0.72, 0.68, 0.68], tone: "mid" },
      { p: [0.65 + s(9) * 0.25, 1.48 + s(10) * 0.28, -0.05], sc: [0.78, 0.74, 0.72], tone: "mid" },
      // Airy bright sunlit outer leafy sprigs peeking into the blue sky
      { p: [-1.55 + s(11) * 0.3, 0.85 + s(12) * 0.2, -0.35], sc: [0.54, 0.48, 0.48], tone: "light" },
      { p: [1.45 + s(13) * 0.3, 1.15 + s(14) * 0.25, -0.25], sc: [0.58, 0.52, 0.5], tone: "light" },
      { p: [-0.45 + s(15) * 0.25, 1.85 + s(16) * 0.25, -0.18], sc: [0.62, 0.56, 0.55], tone: "light" },
      { p: [0.32 + s(17) * 0.25, 2.02 + s(18) * 0.2, -0.22], sc: [0.52, 0.48, 0.46], tone: "light" },
      { p: [-0.85 + s(19) * 0.2, 1.62 + s(20) * 0.2, -0.3], sc: [0.46, 0.42, 0.42], tone: "light" },
      { p: [1.15 + s(21) * 0.2, 0.15 + s(22) * 0.2, 0.25], sc: [0.62, 0.58, 0.58], tone: "dark" },
      { p: [-0.25 + s(23) * 0.2, -0.2 + s(24) * 0.15, 0.32], sc: [0.68, 0.6, 0.62], tone: "dark" },
    ];
    return base;
  }, [seed]);

  const colorMap = isDusk
    ? { dark: "#243D18", mid: "#365B22", light: "#4E7A30" }
    : { dark: "#346620", mid: "#51922D", light: "#7CC244" };

  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Tapered Bark Trunk + Forking Branches */}
      <mesh position={[0, 2.1, 0]}>
        <cylinderGeometry args={[0.11, 0.2, 4.2, 10]} />
        <meshStandardMaterial color="#5E4632" roughness={0.92} />
      </mesh>
      <mesh position={[-0.45, 3.65, 0.05]} rotation={[0, 0, 0.48]}>
        <cylinderGeometry args={[0.055, 0.1, 1.55, 8]} />
        <meshStandardMaterial color="#543E2B" roughness={0.92} />
      </mesh>
      <mesh position={[0.42, 3.8, -0.04]} rotation={[0, 0, -0.42]}>
        <cylinderGeometry args={[0.055, 0.095, 1.5, 8]} />
        <meshStandardMaterial color="#543E2B" roughness={0.92} />
      </mesh>

      {/* Multi-Layered Organic Canopy (16x GPU-lighter geometry for 100% crash-free Windows ANGLE renders!) */}
      <group position={[0, 4.35, 0]}>
        {clusters.map((cl, i) => (
          <mesh key={i} position={cl.p} scale={cl.sc} receiveShadow>
            <dodecahedronGeometry args={[1.0, 1]} />
            <meshStandardMaterial
              map={foliagePBR.map}
              normalMap={foliagePBR.normalMap}
              roughnessMap={foliagePBR.roughnessMap}
              normalScale={new THREE.Vector2(1.0, 1.0)}
              color={colorMap[cl.tone]}
              roughness={0.82}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
};

/**
 * Authentic Indonesian Village House (1:1 match to shot_001.jpg, shot_003.jpg, shot_035.jpg):
 * - Scalloped warm orange genteng terracotta pitched gable roof (Atap Pelana)
 * - Weathered cream stucco walls + concrete porch plinth
 * - Recessed dark-wood-framed teal green front door + twin shuttered glass windows
 * - Windows glow warm golden-yellow at dusk/night with subtle interior warmth!
 */
const VillageHouse: React.FC<{
  position: [number, number, number];
  roofPBR: PBRTriplet;
  stuccoPBR: PBRTriplet;
  lightsOn: boolean;
  duskFactor: number;
  width?: number;
}> = ({ position, roofPBR, stuccoPBR, lightsOn, duskFactor, width = 5.0 }) => {
  const wallH = 2.15;
  const depth = 2.95;
  const roofH = 1.58;
  const overhangX = 0.34;
  const overhangZ = 0.44;
  const slopeLen = Math.hypot(depth / 2 + overhangZ, roofH);
  const slopeAngle = Math.atan2(roofH, depth / 2 + overhangZ);

  const gableGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-depth / 2, 0);
    shape.lineTo(depth / 2, 0);
    shape.lineTo(0, roofH - 0.04);
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, [depth, roofH]);

  const windowColor = lightsOn ? "#FCE69E" : duskFactor > 0.4 ? "#26211E" : "#1D2024";
  const windowEmissive = lightsOn ? "#FFD35C" : "#000000";

  return (
    <group position={position}>
      {/* Concrete Foundation Plinth */}
      <mesh position={[0, 0.08, 0.08]} receiveShadow>
        <boxGeometry args={[width + 0.16, 0.16, depth + 0.16]} />
        <meshStandardMaterial color="#B5ACA0" roughness={0.92} />
      </mesh>

      {/* Main Weathered Stucco Wall Body */}
      <mesh position={[0, wallH / 2 + 0.08, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, wallH, depth]} />
        <meshStandardMaterial
          map={stuccoPBR.map}
          normalMap={stuccoPBR.normalMap}
          roughnessMap={stuccoPBR.roughnessMap}
          normalScale={new THREE.Vector2(0.55, 0.55)}
          roughness={0.88}
        />
      </mesh>

      {/* Left & Right Triangular Gable Ends */}
      <mesh
        geometry={gableGeo}
        position={[-width / 2 - 0.005, wallH + 0.08, 0]}
        rotation={[0, -Math.PI / 2, 0]}
      >
        <meshStandardMaterial color="#D8CEBC" roughness={0.88} side={THREE.DoubleSide} />
      </mesh>
      <mesh
        geometry={gableGeo}
        position={[width / 2 + 0.005, wallH + 0.08, 0]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <meshStandardMaterial color="#E6DEC8" roughness={0.88} side={THREE.DoubleSide} />
      </mesh>

      {/* Dark Wood Fascia / Eaves Trim */}
      <mesh position={[0, wallH + 0.02, depth / 2 + overhangZ - 0.06]}>
        <boxGeometry args={[width + overhangX * 2, 0.1, 0.06]} />
        <meshStandardMaterial color="#4D3220" roughness={0.82} />
      </mesh>

      {/* Front Pitched Scalloped Terracotta Roof Slope */}
      <mesh
        position={[0, wallH + 0.08 + roofH / 2 - 0.06, (depth / 2 + overhangZ) / 2]}
        rotation={[slopeAngle - Math.PI / 2, 0, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[width + overhangX * 2, slopeLen, 0.08]} />
        <meshStandardMaterial
          map={roofPBR.map}
          normalMap={roofPBR.normalMap}
          roughnessMap={roofPBR.roughnessMap}
          normalScale={new THREE.Vector2(1.05, 1.05)}
          roughness={0.64}
        />
      </mesh>

      {/* Back Pitched Scalloped Terracotta Roof Slope */}
      <mesh
        position={[0, wallH + 0.08 + roofH / 2 - 0.06, -(depth / 2 + overhangZ) / 2]}
        rotation={[Math.PI / 2 - slopeAngle, 0, 0]}
      >
        <boxGeometry args={[width + overhangX * 2, slopeLen, 0.08]} />
        <meshStandardMaterial
          map={roofPBR.map}
          normalMap={roofPBR.normalMap}
          roughnessMap={roofPBR.roughnessMap}
          normalScale={new THREE.Vector2(1.05, 1.05)}
          roughness={0.68}
        />
      </mesh>

      {/* Rounded Clay Roof Ridge Cap (Wuwungan) */}
      <mesh position={[0, wallH + 0.08 + roofH + 0.01, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.085, 0.085, width + overhangX * 2 + 0.06, 10]} />
        <meshStandardMaterial color="#D46638" roughness={0.68} />
      </mesh>

      {/* Teal-Green Front Door with Recessed Dark Wood Frame (left side of house, matching shot_001.jpg!) */}
      <group position={[-width * 0.28, 0.96, depth / 2 + 0.02]}>
        {/* Outer Wood Frame */}
        <mesh>
          <boxGeometry args={[0.92, 1.82, 0.08]} />
          <meshStandardMaterial color="#3B271A" roughness={0.8} />
        </mesh>
        {/* Teal Painted Door Panel */}
        <mesh position={[0, 0, 0.025]}>
          <boxGeometry args={[0.78, 1.72, 0.05]} />
          <meshStandardMaterial color="#27795C" roughness={0.58} />
        </mesh>
        {/* Brass Door Handle */}
        <mesh position={[0.28, -0.05, 0.06]}>
          <sphereGeometry args={[0.032, 8, 8]} />
          <meshStandardMaterial color="#D2A752" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>

      {/* Twin Dark-Framed Windows on Right Side of House (matching shot_001.jpg & shot_035.jpg!) */}
      {[width * 0.08, width * 0.28].map((wx, idx) => (
        <group key={idx} position={[wx, 1.24, depth / 2 + 0.02]}>
          {/* Dark Wood Window Frame */}
          <mesh>
            <boxGeometry args={[0.84, 1.06, 0.08]} />
            <meshStandardMaterial color="#382518" roughness={0.8} />
          </mesh>
          {/* Window Sill Ledge */}
          <mesh position={[0, -0.55, 0.04]}>
            <boxGeometry args={[0.92, 0.06, 0.12]} />
            <meshStandardMaterial color="#4A3222" roughness={0.8} />
          </mesh>
          {/* Window Glass / Glowing Warm Dusk Interior */}
          <mesh position={[0, 0, 0.042]}>
            <planeGeometry args={[0.7, 0.92]} />
            <meshStandardMaterial
              color={windowColor}
              emissive={windowEmissive}
              emissiveIntensity={lightsOn ? 1.55 : 0}
              roughness={0.22}
            />
          </mesh>
          {/* Vertical Mullion Bar */}
          <mesh position={[0, 0, 0.05]}>
            <boxGeometry args={[0.042, 0.94, 0.025]} />
            <meshStandardMaterial color="#382518" />
          </mesh>
        </group>
      ))}
    </group>
  );
};

/**
 * Graceful Arching Indonesian Banana Plant (Pohon Pisang) with central bright lime midribs!
 * Matches the iconic framing fronds in shot_001.jpg, shot_003.jpg, shot_015.jpg, shot_034.jpg.
 */
export const BananaTree: React.FC<{
  position: [number, number, number];
  scale?: number;
  rotY?: number;
}> = ({ position, scale = 1.0, rotY = 0 }) => {
  const leafGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(0.55, 0.22, 1.45, 0.17);
    shape.quadraticCurveTo(2.15, 0.1, 2.55, 0);
    shape.quadraticCurveTo(2.15, -0.1, 1.45, -0.17);
    shape.quadraticCurveTo(0.55, -0.22, 0, 0);

    const geo = new THREE.ShapeGeometry(shape, 14);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const t = x / 2.55;
      // Smooth graceful upward-then-drooping tropical arch
      const archZ = Math.sin(t * Math.PI * 0.85) * 0.36 - t * t * 1.15;
      const cupZ = -Math.abs(y) * 0.22;
      pos.setZ(i, archZ + cupZ);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  const fronds = [
    { rotY: 0.12, pitch: -0.22, scale: 1.08, color: "#4D8B24" },
    { rotY: 0.95, pitch: -0.32, scale: 0.98, color: "#3C741C" },
    { rotY: 1.85, pitch: -0.18, scale: 1.04, color: "#5FA02E" },
    { rotY: 2.75, pitch: -0.36, scale: 0.94, color: "#356818" },
    { rotY: 3.65, pitch: -0.24, scale: 1.06, color: "#4A8622" },
    { rotY: 4.6, pitch: -0.28, scale: 1.0, color: "#3F781D" },
    { rotY: 5.45, pitch: -0.16, scale: 0.96, color: "#68AB36" },
  ];

  return (
    <group position={position} scale={[scale, scale, scale]} rotation={[0, rotY, 0]}>
      {/* Smooth Banana Pseudostem Trunk */}
      <mesh position={[0, 1.25, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.105, 0.145, 2.5, 12]} />
        <meshStandardMaterial color="#4D6E2A" roughness={0.78} />
      </mesh>
      <group position={[0, 2.38, 0]}>
        {fronds.map((f, i) => (
          <group key={i} rotation={[0, f.rotY, 0]} scale={[f.scale, f.scale, f.scale]}>
            <mesh
              geometry={leafGeo}
              rotation={[-Math.PI / 2 + f.pitch, 0, 0]}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial color={f.color} roughness={0.58} side={THREE.DoubleSide} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
};

/**
 * Dense Split-Bamboo Picket Fence (Pagar Bambu) rendered via single GPU InstancedMesh
 * 190 closely-spaced thin golden-tan bamboo slats matching shot_001.jpg, shot_013.jpg, shot_031.jpg!
 */
const DenseBambooFence: React.FC = () => {
  const count = 190;
  const instRef = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    if (!instRef.current) return;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const shades = ["#DFCB99", "#D2BC89", "#C5AE7B", "#E4D1A1"];

    for (let i = 0; i < count; i++) {
      const x = -9.5 + i * 0.1;
      const h = 1.1 + ((i * 19) % 7) * 0.022;
      const lean = (((i * 13) % 7) - 3) * 0.005;
      dummy.position.set(x, h / 2, (i % 2) * 0.01);
      dummy.rotation.set(0, 0, lean);
      dummy.scale.set(1, h, 1);
      dummy.updateMatrix();
      instRef.current.setMatrixAt(i, dummy.matrix);
      color.set(shades[i % shades.length]);
      instRef.current.setColorAt(i, color);
    }
    instRef.current.instanceMatrix.needsUpdate = true;
    if (instRef.current.instanceColor) instRef.current.instanceColor.needsUpdate = true;
  }, []);

  return (
    <group position={[0, 0, -2.5]}>
      {/* Horizontal Bamboo Cross Rails */}
      <mesh position={[0, 0.36, 0.032]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.024, 0.024, 20, 8]} />
        <meshStandardMaterial color="#C0A876" roughness={0.76} />
      </mesh>
      <mesh position={[0, 0.86, 0.032]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.024, 0.024, 20, 8]} />
        <meshStandardMaterial color="#C0A876" roughness={0.76} />
      </mesh>

      {/* 190 Tightly-Spaced Vertical Split-Bamboo Slats (1 fast GPU draw call + crisp picket shadows!) */}
      <instancedMesh ref={instRef} args={[undefined, undefined, count]} castShadow receiveShadow>
        <boxGeometry args={[0.048, 1.0, 0.016]} />
        <meshStandardMaterial roughness={0.76} />
      </instancedMesh>
    </group>
  );
};

export const VillageBackdrop: React.FC<VillageBackdropProps> = ({
  weather = "day",
  rainIntensity = 0,
  duskFactor = 0,
  houseLightsOn = false,
  frame = 0,
}) => {
  const roofPBR = useMemo(() => createTerracottaRoofPBR(), []);
  const stuccoPBR = useMemo(() => createStuccoPBR(), []);
  const foliagePBR = useMemo(() => createFoliagePBR(), []);

  const effectiveRain = rainIntensity > 0 ? rainIntensity : weather === "rain" ? 1 : 0;

  return (
    <group position={[0, 0, 0]}>
      {/* 0. Distant Soft Rural Horizon Ground & Sea/Field Strip (eliminates blank brown voids between houses!) */}
      <mesh position={[0, -0.05, -19.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[70, 22]} />
        <meshStandardMaterial
          color={duskFactor > 0.4 ? "#8B7462" : "#B8C4B4"}
          roughness={0.95}
        />
      </mesh>

      {/* 1. Lush Asymmetric Indonesian Village Tree Line Behind Houses */}
      <group position={[0, 0, -8.8]}>
        <OrganicTropicalTree position={[-10.2, 0, -0.6]} scale={1.18} seed={1} duskFactor={duskFactor} foliagePBR={foliagePBR} />
        <OrganicTropicalTree position={[-6.4, 0, 0.1]} scale={1.08} seed={2} duskFactor={duskFactor} foliagePBR={foliagePBR} />
        <OrganicTropicalTree position={[-3.0, 0, -0.5]} scale={1.24} seed={3} duskFactor={duskFactor} foliagePBR={foliagePBR} />
        <OrganicTropicalTree position={[0.4, 0, -0.2]} scale={1.14} seed={4} duskFactor={duskFactor} foliagePBR={foliagePBR} />
        <OrganicTropicalTree position={[3.6, 0, 0.2]} scale={1.28} seed={5} duskFactor={duskFactor} foliagePBR={foliagePBR} />
        <OrganicTropicalTree position={[7.0, 0, -0.4]} scale={1.12} seed={6} duskFactor={duskFactor} foliagePBR={foliagePBR} />
        <OrganicTropicalTree position={[10.4, 0, 0.1]} scale={1.05} seed={7} duskFactor={duskFactor} foliagePBR={foliagePBR} />
      </group>

      {/* 2. Continuous Row of Indonesian Village Houses (CENTER HERO HOUSE directly behind pole like shot_001.jpg!) */}
      <VillageHouse
        position={[-11.2, 0, -5.35]}
        roofPBR={roofPBR}
        stuccoPBR={stuccoPBR}
        lightsOn={houseLightsOn}
        duskFactor={duskFactor}
        width={4.6}
      />
      <VillageHouse
        position={[-5.75, 0, -5.35]}
        roofPBR={roofPBR}
        stuccoPBR={stuccoPBR}
        lightsOn={houseLightsOn}
        duskFactor={duskFactor}
        width={4.8}
      />
      <VillageHouse
        position={[0.05, 0, -5.35]}
        roofPBR={roofPBR}
        stuccoPBR={stuccoPBR}
        lightsOn={houseLightsOn}
        duskFactor={duskFactor}
        width={5.1}
      />
      <VillageHouse
        position={[5.75, 0, -5.35]}
        roofPBR={roofPBR}
        stuccoPBR={stuccoPBR}
        lightsOn={houseLightsOn}
        duskFactor={duskFactor}
        width={4.8}
      />
      <VillageHouse
        position={[11.2, 0, -5.35]}
        roofPBR={roofPBR}
        stuccoPBR={stuccoPBR}
        lightsOn={houseLightsOn}
        duskFactor={duskFactor}
        width={4.6}
      />

      {/* 3. Iconic Arching Indonesian Banana Plants framing left & right yards */}
      <BananaTree position={[-2.68, 0, -2.05]} scale={1.16} rotY={0.45} />
      <BananaTree position={[3.35, 0, -2.1]} scale={1.12} rotY={2.15} />

      {/* 4. Dense Split-Bamboo Picket Fence */}
      <DenseBambooFence />

      {/* 5. Animated Slanted 3D Rain Streaks */}
      {effectiveRain > 0.15 && (
        <group position={[0, 4.2, 1.4]} rotation={[0, 0, -0.14]}>
          {Array.from({ length: 64 }).map((_, i) => {
            const x = ((i * 1.43) % 10) - 5.0;
            const yOffset = ((frame * 0.62 + i * 1.37) % 10) - 5.0;
            const z = ((i * 1.85) % 4.5) - 2.0;
            return (
              <mesh key={i} position={[x, -yOffset, z]}>
                <cylinderGeometry args={[0.0055, 0.0055, 0.72, 4]} />
                <meshBasicMaterial
                  color="#DCEEFF"
                  transparent
                  opacity={0.44 * effectiveRain}
                />
              </mesh>
            );
          })}
        </group>
      )}
    </group>
  );
};
