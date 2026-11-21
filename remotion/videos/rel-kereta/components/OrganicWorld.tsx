import React, { useMemo } from "react";
import * as THREE from "three";
import {
  createContactShadowTexture,
  createFoliagePBR,
  createGroundVergePBR,
  createSoilPBR,
  createTerracottaRoofPBR,
  PBRTriplet,
} from "../pbrMaterials";
import { LightingMood } from "./ProEnvironment";

export interface OrganicWorldProps {
  mood: LightingMood;
  isWetMud?: boolean;
  frame: number;
  showCutaway?: boolean;
  showHeatWaves?: boolean;
}

/**
 * Feathery Dappled Multi-Cluster Tropical Tree with PBR Foliage Texture & Branching Limbs
 */
const OrganicTropicalTree: React.FC<{
  position: [number, number, number];
  scale?: number;
  isGolden?: boolean;
  foliagePBR: PBRTriplet;
}> = ({ position, scale = 1.0, isGolden = false, foliagePBR }) => {
  const clusters: { p: [number, number, number]; s: [number, number, number]; c: string }[] = [
    { p: [0.0, 0.35, 0.0], s: [1.1, 0.88, 1.0], c: isGolden ? "#568032" : "#68AA38" },
    { p: [-0.88, 0.08, 0.18], s: [0.88, 0.72, 0.82], c: isGolden ? "#446B26" : "#53922A" },
    { p: [0.85, 0.14, 0.14], s: [0.9, 0.76, 0.85], c: isGolden ? "#628E3A" : "#74B840" },
    { p: [-0.46, 0.92, 0.22], s: [0.78, 0.68, 0.74], c: isGolden ? "#6E9A40" : "#84C64A" },
    { p: [0.48, 0.86, 0.18], s: [0.76, 0.66, 0.72], c: isGolden ? "#76A445" : "#8ED052" },
    { p: [0.04, 1.22, 0.02], s: [0.72, 0.6, 0.68], c: isGolden ? "#80AE4C" : "#98DA5C" },
    { p: [-1.15, 0.55, 0.08], s: [0.64, 0.56, 0.62], c: isGolden ? "#5A8535" : "#6CAE3B" },
    { p: [1.12, 0.58, 0.1], s: [0.66, 0.58, 0.62], c: isGolden ? "#64903B" : "#78BA43" },
    { p: [-0.55, -0.32, 0.42], s: [0.68, 0.56, 0.64], c: isGolden ? "#375A1E" : "#427822" },
    { p: [0.58, -0.28, 0.38], s: [0.7, 0.58, 0.66], c: isGolden ? "#3F6422" : "#4C8427" },
    { p: [0.0, -0.42, 0.48], s: [0.65, 0.54, 0.62], c: isGolden ? "#2E4E18" : "#396B1C" },
  ];

  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Tapered Bark Trunk + Forked Limbs */}
      <mesh position={[0, 1.85, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.22, 3.7, 12]} />
        <meshStandardMaterial color="#72553D" roughness={0.88} />
      </mesh>
      <mesh position={[-0.38, 3.25, 0.05]} rotation={[0, 0, 0.46]} castShadow>
        <cylinderGeometry args={[0.065, 0.11, 1.4, 10]} />
        <meshStandardMaterial color="#684D36" roughness={0.9} />
      </mesh>
      <mesh position={[0.4, 3.3, -0.04]} rotation={[0, 0, -0.42]} castShadow>
        <cylinderGeometry args={[0.065, 0.11, 1.35, 10]} />
        <meshStandardMaterial color="#684D36" roughness={0.9} />
      </mesh>
      {/* Dappled Normal-Mapped Feathery Leaf Canopy */}
      <group position={[0, 4.15, 0]}>
        {clusters.map((cl, i) => (
          <mesh key={i} position={cl.p} scale={cl.s} castShadow receiveShadow>
            <sphereGeometry args={[1.0, 18, 14]} />
            <meshStandardMaterial
              map={foliagePBR.map}
              normalMap={foliagePBR.normalMap}
              roughnessMap={foliagePBR.roughnessMap}
              normalScale={new THREE.Vector2(0.9, 0.9)}
              color={cl.c}
              roughness={0.74}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
};

/**
 * Curved-Frond Indonesian Banana Plant (Pohon Pisang)
 */
const CurvedBananaPlant: React.FC<{ position: [number, number, number]; scale?: number; rotY?: number }> = ({
  position,
  scale = 1.0,
  rotY = 0,
}) => {
  const frondGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(0.45, 0.25, 1.18, 0.19);
    shape.quadraticCurveTo(1.72, 0.11, 2.02, 0);
    shape.quadraticCurveTo(1.72, -0.11, 1.18, -0.19);
    shape.quadraticCurveTo(0.45, -0.25, 0, 0);
    const geo = new THREE.ShapeGeometry(shape, 12);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const t = x / 2.02;
      pos.setZ(i, -t * t * 0.96 + Math.sin(t * Math.PI) * 0.24 - Math.abs(y) * 0.28);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  const angles = [0.2, 1.15, 2.1, 3.05, 4.0, 4.95, 5.75];
  const greens = ["#5AA130", "#4C8C27", "#67B038", "#458222", "#5DA632", "#4F9128", "#6EB63D"];

  return (
    <group position={position} scale={[scale, scale, scale]} rotation={[0, rotY, 0]}>
      <mesh position={[0, 1.15, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.15, 2.3, 12]} />
        <meshStandardMaterial color="#4F722B" roughness={0.72} />
      </mesh>
      <group position={[0, 2.22, 0]}>
        {angles.map((a, i) => (
          <group key={i} rotation={[0, a, 0]}>
            <mesh
              geometry={frondGeo}
              rotation={[-Math.PI / 2 - 0.35 - (i % 3) * 0.06, 0, 0]}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial color={greens[i]} roughness={0.5} side={THREE.DoubleSide} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
};

/**
 * Indonesian Village House with PBR Terracotta Genteng Normal-Mapped Roof
 */
const RuralHouse: React.FC<{
  position: [number, number, number];
  roofPBR: PBRTriplet;
  lightsOn: boolean;
}> = ({ position, roofPBR, lightsOn }) => {
  const w = 4.4;
  const h = 2.15;
  const d = 3.0;
  const rh = 1.48;
  const slopeLen = Math.hypot(d / 2 + 0.42, rh);
  const slopeAng = Math.atan2(rh, d / 2 + 0.42);

  const gableGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-d / 2, 0);
    s.lineTo(d / 2, 0);
    s.lineTo(0, rh - 0.04);
    s.closePath();
    return new THREE.ShapeGeometry(s);
  }, [d, rh]);

  return (
    <group position={position}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color="#EFE7D8" roughness={0.84} />
      </mesh>
      <mesh geometry={gableGeo} position={[-w / 2 - 0.005, h, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <meshStandardMaterial color="#E4DAC9" roughness={0.85} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={gableGeo} position={[w / 2 + 0.005, h, 0]} rotation={[0, Math.PI / 2, 0]}>
        <meshStandardMaterial color="#F3EBDE" roughness={0.85} side={THREE.DoubleSide} />
      </mesh>
      {/* Front & Back PBR Normal-Mapped Terracotta Roof Slopes */}
      <mesh
        position={[0, h + rh / 2 - 0.05, (d / 2 + 0.42) / 2]}
        rotation={[slopeAng - Math.PI / 2, 0, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[w + 0.78, slopeLen, 0.1]} />
        <meshStandardMaterial
          map={roofPBR.map}
          normalMap={roofPBR.normalMap}
          roughnessMap={roofPBR.roughnessMap}
          normalScale={new THREE.Vector2(0.85, 0.85)}
        />
      </mesh>
      <mesh
        position={[0, h + rh / 2 - 0.05, -(d / 2 + 0.42) / 2]}
        rotation={[Math.PI / 2 - slopeAng, 0, 0]}
        castShadow
      >
        <boxGeometry args={[w + 0.78, slopeLen, 0.1]} />
        <meshStandardMaterial
          map={roofPBR.map}
          normalMap={roofPBR.normalMap}
          roughnessMap={roofPBR.roughnessMap}
        />
      </mesh>
      {/* Ridge Cap */}
      <mesh position={[0, h + rh + 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, w + 0.82, 10]} />
        <meshStandardMaterial color="#C85D32" roughness={0.65} />
      </mesh>
      {/* Teal Wooden Door */}
      <group position={[-1.25, 0.92, d / 2 + 0.02]}>
        <mesh>
          <boxGeometry args={[0.84, 1.84, 0.06]} />
          <meshStandardMaterial color="#3B2619" roughness={0.78} />
        </mesh>
        <mesh position={[0, 0, 0.02]}>
          <boxGeometry args={[0.72, 1.74, 0.05]} />
          <meshStandardMaterial color="#246B55" roughness={0.52} />
        </mesh>
      </group>
      {/* Shuttered Windows */}
      {[0.45, 1.42].map((wx, idx) => (
        <group key={idx} position={[wx, 1.2, d / 2 + 0.02]}>
          <mesh>
            <boxGeometry args={[0.76, 1.0, 0.06]} />
            <meshStandardMaterial color="#3A2518" roughness={0.78} />
          </mesh>
          <mesh position={[0, 0, 0.02]}>
            <planeGeometry args={[0.64, 0.88]} />
            <meshStandardMaterial
              color={lightsOn ? "#FFF0A2" : "#1A2028"}
              emissive={lightsOn ? "#FFD14D" : "#000000"}
              emissiveIntensity={lightsOn ? 1.2 : 0}
              roughness={0.22}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
};

/**
 * 3D Tufted Grass Clump
 */
const GrassClump: React.FC<{ position: [number, number, number]; scale?: number }> = ({
  position,
  scale = 1,
}) => (
  <group position={position} scale={[scale, scale, scale]}>
    {[0, 1.2, 2.4, 3.6, 4.9].map((ang, i) => (
      <group key={i} rotation={[0, ang, 0]}>
        <mesh position={[0.04, 0.12, 0]} rotation={[0, 0, -0.28 - (i % 2) * 0.12]} castShadow>
          <coneGeometry args={[0.024, 0.24 + (i % 3) * 0.04, 4]} />
          <meshStandardMaterial color={i % 2 === 0 ? "#4D8A27" : "#62A333"} roughness={0.68} />
        </mesh>
      </group>
    ))}
  </group>
);

export const OrganicWorld: React.FC<OrganicWorldProps> = ({
  mood,
  isWetMud = false,
  frame,
  showCutaway = true,
  showHeatWaves = false,
}) => {
  const soilDry = useMemo(() => createSoilPBR(false), []);
  const soilWet = useMemo(() => createSoilPBR(true), []);
  const groundDry = useMemo(() => createGroundVergePBR(false), []);
  const groundWet = useMemo(() => createGroundVergePBR(true), []);
  const roofPBR = useMemo(() => createTerracottaRoofPBR(), []);
  const foliagePBR = useMemo(() => createFoliagePBR(), []);
  const contactTex = useMemo(() => createContactShadowTexture(), []);

  const activeSoil = isWetMud ? soilWet : soilDry;
  const activeGround = isWetMud ? groundWet : groundDry;

  return (
    <group>
      {/* 1. Rolling Distant Emerald Foothills */}
      <mesh position={[-8.5, -1.2, -17.5]} scale={[12, 4.2, 4]}>
        <sphereGeometry args={[1, 24, 16]} />
        <meshStandardMaterial color={mood === "golden" ? "#5A7648" : "#66A34C"} roughness={0.95} />
      </mesh>
      <mesh position={[7.5, -1.5, -18.5]} scale={[14, 4.6, 4]}>
        <sphereGeometry args={[1, 24, 16]} />
        <meshStandardMaterial color={mood === "golden" ? "#4F6B40" : "#5B9743"} roughness={0.95} />
      </mesh>

      {/* 2. Lush Feathery Dappled Tropical Trees rising above Village Houses */}
      <group position={[0, 0, -9.6]}>
        <OrganicTropicalTree position={[-7.8, 0, 0]} scale={0.92} isGolden={mood === "golden"} foliagePBR={foliagePBR} />
        <OrganicTropicalTree position={[-3.6, 0, 0.3]} scale={1.04} isGolden={mood === "golden"} foliagePBR={foliagePBR} />
        <OrganicTropicalTree position={[0.5, 0, -0.2]} scale={0.96} isGolden={mood === "golden"} foliagePBR={foliagePBR} />
        <OrganicTropicalTree position={[4.4, 0, 0.2]} scale={1.02} isGolden={mood === "golden"} foliagePBR={foliagePBR} />
        <OrganicTropicalTree position={[8.2, 0, -0.2]} scale={0.9} isGolden={mood === "golden"} foliagePBR={foliagePBR} />
      </group>

      {/* 3. Indonesian Rural Village Houses (proportioned at 0.74 scale so trees & sky clouds fill top 42% of frame!) */}
      <group scale={[0.74, 0.74, 0.74]} position={[0, 0, -7.8]}>
        <RuralHouse position={[-6.8, 0, 0]} roofPBR={roofPBR} lightsOn={mood === "golden"} />
        <RuralHouse position={[-0.6, 0, 0]} roofPBR={roofPBR} lightsOn={mood === "golden"} />
        <RuralHouse position={[5.6, 0, 0]} roofPBR={roofPBR} lightsOn={mood === "golden"} />
      </group>

      {/* 4. Arched-Frond Banana Trees */}
      <CurvedBananaPlant position={[-3.7, 0, -3.4]} scale={0.96} rotY={0.35} />
      <CurvedBananaPlant position={[3.4, 0, -3.3]} scale={0.92} rotY={2.2} />

      {/* 5. Rustic Railway Safety Signal Post + Bamboo Trackside Fence */}
      <group position={[0, 0, -4.1]}>
        <mesh position={[0, 0.42, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.028, 0.028, 22, 8]} />
          <meshStandardMaterial color="#B59F72" roughness={0.78} />
        </mesh>
        <mesh position={[0, 0.9, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.028, 0.028, 22, 8]} />
          <meshStandardMaterial color="#B59F72" roughness={0.78} />
        </mesh>
        {Array.from({ length: 68 }).map((_, i) => {
          const x = -9.5 + i * 0.28;
          const h = 1.12 + ((i * 11) % 5) * 0.03;
          return (
            <mesh key={i} position={[x, h / 2, 0]} castShadow>
              <cylinderGeometry args={[0.024, 0.027, h, 6]} />
              <meshStandardMaterial color={i % 2 === 0 ? "#CEBA8B" : "#BAA474"} roughness={0.78} />
            </mesh>
          );
        })}
      </group>

      {/* Iconic Indonesian Black-White Striped Railway KM Marker Post */}
      <group position={[-2.9, 0, -2.55]}>
        <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.2, 1.1, 0.16]} />
          <meshStandardMaterial color="#F2F0EA" roughness={0.62} />
        </mesh>
        <mesh position={[0, 0.95, 0.005]}>
          <boxGeometry args={[0.21, 0.22, 0.165]} />
          <meshStandardMaterial color="#23262A" roughness={0.55} />
        </mesh>
        {/* Contact AO decal under post */}
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.65, 0.65]} />
          <meshBasicMaterial map={contactTex} transparent depthWrite={false} />
        </mesh>
      </group>

      {/* 6. Sunlit PBR Embankment Ground Verge (Y = 0, Z = 0..-14) */}
      <mesh position={[0, 0, -7.0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 14]} />
        <meshStandardMaterial
          map={activeGround.map}
          normalMap={activeGround.normalMap}
          roughnessMap={activeGround.roughnessMap}
          normalScale={new THREE.Vector2(0.75, 0.75)}
        />
      </mesh>

      {/* Scattered 3D Grass Clumps along Embankment Edge */}
      {[
        [-3.4, 0, -0.3],
        [-2.2, 0, -0.25],
        [-1.3, 0, -0.22],
        [1.45, 0, -0.24],
        [2.35, 0, -0.28],
        [3.5, 0, -0.32],
        [-2.8, 0, -2.1],
        [2.6, 0, -2.2],
        [-0.8, 0, -3.2],
        [1.2, 0, -3.1],
      ].map(([gx, gy, gz], i) => (
        <GrassClump key={i} position={[gx, gy, gz]} scale={0.85 + (i % 3) * 0.18} />
      ))}

      {/* 7. Sculpted PBR Geological Soil Cutaway Cross-Section (Z = 0, Y = 0..-4.6m) */}
      {showCutaway && (
        <group>
          <mesh position={[0, -2.3, 0]} receiveShadow>
            <planeGeometry args={[24, 4.6]} />
            <meshStandardMaterial
              map={activeSoil.map}
              normalMap={activeSoil.normalMap}
              roughnessMap={activeSoil.roughnessMap}
              normalScale={new THREE.Vector2(1.1, 1.1)}
              emissive={isWetMud ? "#24130A" : "#4E2B14"}
              emissiveIntensity={0.24}
            />
          </mesh>

          {/* Sculpted 3D Irregular Topsoil Overhang Clods along Y = 0 */}
          {Array.from({ length: 28 }).map((_, i) => {
            const x = -6.4 + i * 0.48 + ((i * 13) % 5) * 0.04;
            const r = 0.042 + (i % 4) * 0.014;
            return (
              <mesh key={i} position={[x, -0.02, 0.015]} rotation={[i, i * 0.7, 0]}>
                <dodecahedronGeometry args={[r, 1]} />
                <meshStandardMaterial
                  color={isWetMud ? "#462B1A" : i % 2 === 0 ? "#855836" : "#6D4629"}
                  roughness={isWetMud ? 0.35 : 0.92}
                />
              </mesh>
            );
          })}
        </group>
      )}

      {/* 8. Animated 3D Slanted Tropical Rain Streaks (strictly behind camera near-plane!) */}
      {mood === "rain" && (
        <group position={[0, 3.6, -1.2]} rotation={[0, 0, -0.15]}>
          {Array.from({ length: 64 }).map((_, i) => {
            const x = ((i * 1.43) % 10) - 5.0;
            const yFall = ((frame * 0.62 + i * 1.19) % 9) - 4.5;
            const z = ((i * 1.37) % 3.2) - 2.2;
            return (
              <mesh key={i} position={[x, -yFall, z]}>
                <cylinderGeometry args={[0.0045, 0.0045, 0.62, 4]} />
                <meshBasicMaterial color="#D6EEFF" transparent opacity={0.38} />
              </mesh>
            );
          })}
        </group>
      )}

      {/* 9. Rising Golden Heat Shimmer Ribbons above Hot 60C Rails (Beat 6) */}
      {showHeatWaves && (
        <group position={[0, 0.65, -0.6]}>
          {[-2.2, -1.1, 0, 1.1, 2.2].map((hx, i) => {
            const rise = ((frame * 0.04 + i * 0.22) % 1);
            const alpha = Math.sin(rise * Math.PI) * 0.45;
            return (
              <mesh
                key={i}
                position={[hx + Math.sin(frame * 0.25 + i) * 0.08, rise * 1.4, 0]}
                rotation={[0, 0, Math.sin(frame * 0.18 + i) * 0.15]}
              >
                <planeGeometry args={[0.12, 0.65]} />
                <meshBasicMaterial color="#FF9E44" transparent opacity={alpha} depthWrite={false} />
              </mesh>
            );
          })}
        </group>
      )}
    </group>
  );
};
