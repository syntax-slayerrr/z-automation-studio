import React, { useMemo } from "react";
import * as THREE from "three";
import {
  createContactShadowTexture,
  createGroundYardPBR,
  createSoilPBR,
} from "../pbrMaterials";

export interface GroundCutawayProps {
  holeDepth?: number;
  holeWidth?: number;
  showHole?: boolean;
  showDirtMound?: boolean;
  dirtMoundScale?: number;
  showDigClods?: boolean;
  showPoleBaseRing?: boolean;
  hideYardProps?: boolean;
  frame?: number;
}

/**
 * Slender Organic 3D Tufted Green Grass Clump (Rumput Liar)
 */
const GrassTuft: React.FC<{ position: [number, number, number]; scale?: number }> = ({
  position,
  scale = 1.0,
}) => {
  const blades = [
    { rotY: 0.0, lean: 0.24, h: 0.26, c: "#498225" },
    { rotY: 0.9, lean: 0.36, h: 0.3, c: "#346618" },
    { rotY: 1.9, lean: 0.28, h: 0.24, c: "#58942E" },
    { rotY: 2.9, lean: 0.4, h: 0.28, c: "#3E751E" },
    { rotY: 4.1, lean: 0.26, h: 0.22, c: "#4F8B29" },
    { rotY: 5.2, lean: 0.34, h: 0.27, c: "#386C1A" },
  ];

  return (
    <group position={position} scale={[scale, scale, scale]}>
      {blades.map((b, i) => (
        <group key={i} rotation={[0, b.rotY, 0]}>
          <mesh position={[0.032, b.h / 2, 0]} rotation={[0, 0, -b.lean]}>
            <coneGeometry args={[0.015, b.h, 3]} />
            <meshStandardMaterial color={b.c} roughness={0.72} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

export const GroundCutaway: React.FC<GroundCutawayProps> = ({
  holeDepth = 1.8,
  holeWidth = 0.56,
  showHole = false,
  showDirtMound = false,
  dirtMoundScale = 1.0,
  showDigClods = false,
  showPoleBaseRing = true,
  hideYardProps = false,
  frame = 0,
}) => {
  const soilPBR = useMemo(() => createSoilPBR(), []);
  const yardPBR = useMemo(() => createGroundYardPBR(), []);
  const contactTex = useMemo(() => createContactShadowTexture(), []);

  // Organic grass clump placements matching shot_001.jpg, shot_013.jpg, shot_029.jpg
  const grassPositions: [number, number, number, number][] = [
    [-2.45, 0, -0.22, 0.95],
    [-1.85, 0, -0.15, 0.85],
    [-0.58, 0, -0.16, 1.0],
    [0.54, 0, -0.16, 1.05],
    [1.18, 0, -0.2, 0.92],
    [1.72, 0, -0.14, 1.0],
    [2.58, 0, -0.22, 0.9],
    [-3.1, 0, -0.82, 1.05],
    [0.85, 0, -1.15, 0.85],
    [-1.35, 0, -1.55, 0.9],
    [2.15, 0, -1.48, 0.95],
    [-0.35, 0, -2.05, 0.82],
    [1.45, 0, -2.1, 0.92],
  ];

  // Subtle irregular top silhouette lip for the Shot 8 pit (no giant blocky rocks!)
  const pitJaggedGeo = useMemo(() => {
    const s = new THREE.Shape();
    const hw = holeWidth / 2;
    s.moveTo(-hw, 0);
    const segs = 12;
    for (let i = 1; i <= segs; i++) {
      const t = i / segs;
      const jitter = Math.sin(i * 3.7) * 0.028;
      s.lineTo(-hw + jitter, -t * holeDepth);
    }
    // Rounded rough pit floor
    s.lineTo(-hw * 0.4, -holeDepth - 0.03);
    s.lineTo(hw * 0.4, -holeDepth - 0.02);
    for (let i = segs; i >= 0; i--) {
      const t = i / segs;
      const jitter = Math.cos(i * 4.3) * 0.028;
      s.lineTo(hw + jitter, -t * holeDepth);
    }
    s.closePath();
    return new THREE.ShapeGeometry(s);
  }, [holeWidth, holeDepth]);

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Smooth Sunlit Sandy-Loam Village Yard Plane (Y = 0, extends backward to Z = -12) */}
      <mesh position={[0, 0, -6.0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 12]} />
        <meshStandardMaterial
          map={yardPBR.map}
          normalMap={yardPBR.normalMap}
          roughnessMap={yardPBR.roughnessMap}
          normalScale={new THREE.Vector2(0.45, 0.45)}
          roughness={0.94}
          metalness={0.0}
        />
      </mesh>

      {/* Subtle warm brown disturbed soil ring right around the pole base (matching shot_001.jpg & shot_013.jpg!) */}
      {showPoleBaseRing && !showHole && (
        <mesh position={[0, 0.004, -0.05]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[0.38, 24]} />
          <meshStandardMaterial color="#9E7147" roughness={0.95} transparent opacity={0.62} />
        </mesh>
      )}

      {/* Soft Contact Shadow Decals under Yard Props */}
      {!hideYardProps && (
        <>
          <mesh position={[-1.42, 0.005, -0.56]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.85, 0.85]} />
            <meshBasicMaterial map={contactTex} transparent opacity={0.62} depthWrite={false} />
          </mesh>
          <mesh position={[-0.92, 0.005, -0.52]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.64, 0.64]} />
            <meshBasicMaterial map={contactTex} transparent opacity={0.58} depthWrite={false} />
          </mesh>
        </>
      )}

      {/* 2. 1:1 Reference-Matched Geological Cutaway Face (Z = 0, Y = 0 to -4.6m) */}
      {/* ZERO giant floating dodecahedron rocks along rim! Crisp clean Blender earth cross-section! */}
      <mesh position={[0, -2.3, 0.0]} receiveShadow>
        <planeGeometry args={[26, 4.6]} />
        <meshStandardMaterial
          map={soilPBR.map}
          normalMap={soilPBR.normalMap}
          roughnessMap={soilPBR.roughnessMap}
          normalScale={new THREE.Vector2(0.75, 0.75)}
          emissive="#4A2712"
          emissiveIntensity={0.14}
          roughness={0.94}
          metalness={0.0}
        />
      </mesh>

      {/* Tiny fine earth crumbs right near the pole entry (subtle scale 0.015–0.025m, NEVER giant boulders!) */}
      {showPoleBaseRing &&
        [-0.24, -0.16, -0.1, 0.12, 0.19, 0.27].map((cx, i) => (
          <mesh key={i} position={[cx, 0.012, -0.02 - (i % 3) * 0.03]} rotation={[i, i * 1.4, 0]}>
            <dodecahedronGeometry args={[0.014 + (i % 3) * 0.006, 0]} />
            <meshStandardMaterial color={i % 2 === 0 ? "#855A38" : "#6B4527"} roughness={0.95} />
          </mesh>
        ))}

      {/* 3. Tufted Green Grass Clumps */}
      {grassPositions.map(([gx, gy, gz, gs], idx) => (
        <GrassTuft key={idx} position={[gx, gy, gz]} scale={gs} />
      ))}

      {/* 4. Shot 8 Excavated Soil Embedment Trench (Clean organic-edged dark pit matching shot_008.jpg!) */}
      {showHole && (
        <group position={[0, 0, 0.016]}>
          {/* Main Organic-Edged Dark Trench Cutaway */}
          <mesh geometry={pitJaggedGeo}>
            <meshBasicMaterial color="#120A05" />
          </mesh>
          {/* Elliptical Top Opening Rim on Yard Surface */}
          <mesh position={[0, 0.008, -0.14]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[holeWidth * 0.56, 24]} />
            <meshBasicMaterial color="#140B06" />
          </mesh>
          {/* Subtle Warm Earth Rim Collar around Pit Opening */}
          <mesh position={[0, 0.006, -0.14]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[holeWidth * 0.54, holeWidth * 0.74, 24]} />
            <meshStandardMaterial color="#8A5C38" roughness={0.95} />
          </mesh>
        </group>
      )}

      {/* 5. Shot 8 Excavated Rich Brown Dirt Mound on Left of Pit (shot_008.jpg) */}
      {showDirtMound && (
        <mesh
          position={[-0.78, 0.01, -0.24]}
          scale={[0.56 * dirtMoundScale, 0.26 * dirtMoundScale, 0.38 * dirtMoundScale]}
          castShadow
          receiveShadow
        >
          <sphereGeometry args={[1, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#6D4325" roughness={0.95} />
        </mesh>
      )}

      {/* 6. Dynamic Flying Soil Clods bursting upward on impact / digging (shot_001.jpg & shot_008.jpg) */}
      {showDigClods && (
        <group position={[0, 0.06, -0.04]}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => {
            const cycle = (frame * 0.13 + i * 0.23) % 1;
            const dir = i % 2 === 0 ? -1 : 1;
            const speedX = 0.18 + (i % 4) * 0.15;
            const x = dir * speedX * cycle;
            const y = (0.48 + (i % 3) * 0.18) * cycle - 0.62 * cycle * cycle;
            const z = ((i % 3) - 1) * 0.12 * cycle;
            return (
              <mesh
                key={i}
                position={[x, Math.max(0.01, y), z]}
                rotation={[frame * 0.22 + i, i * 1.1, 0]}
              >
                <dodecahedronGeometry args={[0.022 + (i % 3) * 0.008, 0]} />
                <meshStandardMaterial color={i % 2 === 0 ? "#6C4529" : "#875B3A"} roughness={0.94} />
              </mesh>
            );
          })}
        </group>
      )}

      {/* 7. Foreground Yard Props (1:1 placement matching shot_001.jpg & shot_003.jpg) */}
      {!hideYardProps && (
        <>
          {/* Black Rubber Tire */}
          <group position={[-1.42, 0.09, -0.56]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
              <torusGeometry args={[0.24, 0.095, 14, 24]} />
              <meshStandardMaterial color="#23262A" roughness={0.84} />
            </mesh>
            <mesh position={[0, -0.04, 0]}>
              <cylinderGeometry args={[0.19, 0.19, 0.07, 16]} />
              <meshStandardMaterial color="#3B2618" roughness={0.95} />
            </mesh>
          </group>

          {/* Bright Royal-Blue Plastic Bucket */}
          <group position={[-0.92, 0.19, -0.52]}>
            <mesh castShadow receiveShadow>
              <cylinderGeometry args={[0.17, 0.13, 0.38, 18]} />
              <meshStandardMaterial color="#1962BD" roughness={0.36} />
            </mesh>
            <mesh position={[0, 0.185, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.17, 0.013, 8, 20]} />
              <meshStandardMaterial color="#2474D4" roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.17, 0]} rotation={[0.45, 0, 0]}>
              <torusGeometry args={[0.175, 0.007, 6, 18, Math.PI]} />
              <meshStandardMaterial color="#B5BFC9" metalness={0.85} roughness={0.25} />
            </mesh>
          </group>

          {/* Stacked Spare Pale Bamboo Poles on Right */}
          <group position={[1.92, 0.055, -0.68]} rotation={[0, -0.14, 0]}>
            {[
              [0, 0, 0],
              [0, 0, 0.13],
              [0, 0, 0.26],
              [0, 0.105, 0.065],
              [0, 0.105, 0.195],
            ].map(([px, py, pz], i) => (
              <mesh
                key={i}
                position={[px, py, pz]}
                rotation={[0, 0, Math.PI / 2]}
                castShadow
                receiveShadow
              >
                <cylinderGeometry args={[0.052, 0.056, 2.2, 10]} />
                <meshStandardMaterial color={i % 2 === 0 ? "#D8D698" : "#C6C484"} roughness={0.68} />
              </mesh>
            ))}
          </group>
        </>
      )}
    </group>
  );
};
