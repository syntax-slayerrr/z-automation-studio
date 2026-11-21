import React, { useMemo } from "react";
import * as THREE from "three";
import { createBambooTexture, createConcreteTexture, createWoodTexture } from "../materials";
import { createSoftGlowTexture } from "../pbrMaterials";

/**
 * 1. Authentic Indonesian Bamboo Pole (1:1 match to shot_001.jpg, shot_005.jpg, shot_013.jpg):
 *    - Warm pale cream-yellow bamboo shaft + subtle crisp 3D nodal rings
 *    - Seamless continuous underground longitudinal HOLLOW CUTAWAY (cream walls + deep dark chambers + thin septa + tapered bevel spear point)
 *    - Supports dynamic height (Shot 6 growth), wind bend, and full collapse fall (Shot 5)
 */
export interface BambooPoleProps {
  height?: number;
  embedDepth?: number;
  windBendAngle?: number;
  showRotAtBase?: boolean;
  pivotShiftX?: number;
  showTopPeg?: boolean;
}

export const BambooPoleMesh: React.FC<BambooPoleProps> = ({
  height = 8.0,
  embedDepth = 1.6,
  windBendAngle = 0.0,
  showRotAtBase = false,
  pivotShiftX = 0,
  showTopPeg = true,
}) => {
  const bambooTex = useMemo(() => createBambooTexture(false), []);
  const bambooRotTex = useMemo(() => createBambooTexture(true), []);
  const exposedHeight = Math.max(2.0, height - embedDepth);

  // Match underground cutaway width cleanly to bottom pole diameter (r = 0.088 -> diameter 0.176)
  const tipH = Math.min(0.24, Math.max(0.12, embedDepth * 0.25));
  const cutawayDepth = Math.max(0.08, embedDepth - tipH);
  const chamberCount = Math.max(1, Math.floor(cutawayDepth / 0.36));
  const chamberStep = cutawayDepth / (chamberCount + 1);

  return (
    <group position={[pivotShiftX, 0, 0]} rotation={[0, 0, windBendAngle]}>
      {/* A. CONTINUOUS UNDERGROUND HOLLOW BAMBOO CUTAWAY (exact pole diameter, flush with shaft!) */}
      <group position={[0, 0, 0.022]}>
        {/* Outer Cream-Beige Bamboo Wall Shell */}
        <mesh position={[0, -cutawayDepth / 2, 0]}>
          <boxGeometry args={[0.176, cutawayDepth, 0.024]} />
          <meshStandardMaterial color={showRotAtBase ? "#DFD4B4" : "#EFE6CB"} roughness={0.68} />
        </mesh>

        {/* Deep Hollow Pitch-Black Internal Cavity */}
        {cutawayDepth > 0.1 && (
          <mesh position={[0, -cutawayDepth / 2, 0.015]}>
            <planeGeometry args={[0.106, Math.max(0.04, cutawayDepth - 0.03)]} />
            <meshBasicMaterial color="#160E09" />
          </mesh>
        )}

        {/* Crisp Horizontal Cream Nodal Septa (Diaphragm dividers) */}
        {Array.from({ length: chamberCount }).map((_, i) => (
          <mesh key={i} position={[0, -(i + 1) * chamberStep, 0.018]}>
            <planeGeometry args={[0.125, 0.024]} />
            <meshBasicMaterial color="#EFE6CB" />
          </mesh>
        ))}

        {/* Tapered Beveled Chisel-Point Spear Tip seamlessly continuing walls */}
        <mesh position={[0, -cutawayDepth - tipH / 2, 0.002]} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.088, tipH, 4]} />
          <meshStandardMaterial color="#E6DBBD" roughness={0.7} />
        </mesh>
        <mesh position={[0, -cutawayDepth - tipH / 2 + 0.01, 0.016]} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.056, tipH * 0.88, 3]} />
          <meshBasicMaterial color="#160E09" />
        </mesh>
      </group>

      {/* B. EXPOSED ABOVE-GROUND PALE SUNLIT BAMBOO SHAFT */}
      <mesh position={[0, exposedHeight / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.06, 0.088, exposedHeight, 22]} />
        <meshStandardMaterial
          map={showRotAtBase ? bambooRotTex : bambooTex}
          roughness={0.48}
          metalness={0.02}
        />
      </mesh>

      {/* Subtle Crisp 3D Bamboo Nodal Rings every 0.78m */}
      {Array.from({ length: Math.floor(exposedHeight / 0.78) }).map((_, i) => {
        const y = 0.58 + i * 0.78;
        const t = y / exposedHeight;
        const r = 0.088 * (1 - t) + 0.06 * t;
        return (
          <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[r, 0.0065, 6, 20]} />
            <meshStandardMaterial color="#BAC46E" roughness={0.55} />
          </mesh>
        );
      })}

      {/* Small Wooden Cable Peg at Very Top of Bamboo Pole (matching shot_002.jpg & shot_004.jpg!) */}
      {showTopPeg && (
        <mesh position={[0.06, exposedHeight - 0.14, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.014, 0.014, 0.22, 8]} />
          <meshStandardMaterial color="#8A6438" roughness={0.8} />
        </mesh>
      )}
    </group>
  );
};

/**
 * 2. Smooth 32-Segment LatheGeometry Glossy White 3-Tier Porcelain Insulator (shot_020.jpg)
 */
export interface InsulatorProps {
  position?: [number, number, number];
  scale?: number;
}

export const PorcelainInsulatorMesh: React.FC<InsulatorProps> = ({
  position = [0, 0, 0],
  scale = 1.0,
}) => {
  const latheGeo = useMemo(() => {
    const pts: THREE.Vector2[] = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.066, 0.0),
      new THREE.Vector2(0.066, 0.056),
      // Bottom umbrella bell skirt (largest)
      new THREE.Vector2(0.165, 0.082),
      new THREE.Vector2(0.168, 0.102),
      new THREE.Vector2(0.084, 0.154),
      // Middle umbrella bell skirt
      new THREE.Vector2(0.142, 0.178),
      new THREE.Vector2(0.146, 0.198),
      new THREE.Vector2(0.076, 0.248),
      // Top umbrella bell skirt
      new THREE.Vector2(0.122, 0.272),
      new THREE.Vector2(0.124, 0.292),
      // Top saddle neck & cable groove
      new THREE.Vector2(0.058, 0.342),
      new THREE.Vector2(0.068, 0.376),
      new THREE.Vector2(0.032, 0.39),
      new THREE.Vector2(0.0, 0.382),
    ];
    return new THREE.LatheGeometry(pts, 36);
  }, []);

  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Terracotta-Gray Mounting Base Pin Collar */}
      <mesh position={[0, 0.028, 0]}>
        <cylinderGeometry args={[0.07, 0.074, 0.056, 22]} />
        <meshStandardMaterial color="#8A7A6E" roughness={0.55} />
      </mesh>
      {/* Glossy White Ceramic 3-Tier Body */}
      <mesh geometry={latheGeo} castShadow receiveShadow>
        <meshStandardMaterial
          color="#FFFFFF"
          emissive="#EDF0F5"
          emissiveIntensity={0.18}
          roughness={0.12}
          metalness={0.04}
        />
      </mesh>
    </group>
  );
};

/**
 * 3. Shot 21 Hero Cutaway Insulator in Rain (1:1 match to shot_021.jpg!)
 *    - Crisp sliced orange-amber cross-section mounted on angled perspective wooden cross-arm + dark wet timber pole behind right
 *    - White water droplet beads sliding cleanly along outer shed edges & falling straight off the shed tips while undersides stay bone dry!
 */
export const InsulatorCutawayScene3D: React.FC<{ frame: number }> = ({ frame }) => {
  const woodTex = useMemo(() => createWoodTexture(true), []);

  const cutawayGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.2, 0.0);
    s.lineTo(-0.2, 0.11);
    // Bottom umbrella shed (widest)
    s.lineTo(-0.62, 0.19);
    s.lineTo(-0.26, 0.44);
    // Middle umbrella shed
    s.lineTo(-0.52, 0.52);
    s.lineTo(-0.23, 0.76);
    // Top umbrella shed
    s.lineTo(-0.42, 0.84);
    s.lineTo(-0.2, 1.07);
    // Rounded crown
    s.lineTo(-0.08, 1.13);
    s.lineTo(0.08, 1.13);
    s.lineTo(0.2, 1.07);
    // Right top shed
    s.lineTo(0.42, 0.84);
    s.lineTo(0.23, 0.76);
    // Right middle shed
    s.lineTo(0.52, 0.52);
    s.lineTo(0.26, 0.44);
    // Right bottom shed
    s.lineTo(0.62, 0.19);
    s.lineTo(0.2, 0.11);
    s.lineTo(0.2, 0.0);
    s.closePath();

    return new THREE.ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: false });
  }, []);

  // Droplets rolling down outer slopes & dropping vertically off each shed tip!
  const dropPaths = [
    { tipX: -0.42, startY: 1.08, shedY: 0.84, phase: 0.0 },
    { tipX: -0.52, startY: 0.78, shedY: 0.52, phase: 0.28 },
    { tipX: -0.62, startY: 0.45, shedY: 0.19, phase: 0.58 },
    { tipX: 0.42, startY: 1.08, shedY: 0.84, phase: 0.14 },
    { tipX: 0.52, startY: 0.78, shedY: 0.52, phase: 0.44 },
    { tipX: 0.62, startY: 0.45, shedY: 0.19, phase: 0.74 },
    { tipX: 0.64, startY: 0.85, shedY: 0.19, phase: 0.91 },
    { tipX: -0.64, startY: 0.85, shedY: 0.19, phase: 0.41 },
  ];

  return (
    <group position={[0, 4.65, 0]}>
      {/* Vertical Dark Wet Timber Pole behind right side (matching shot_021.jpg!) */}
      <mesh position={[0.45, 0.15, -0.36]}>
        <cylinderGeometry args={[0.26, 0.28, 4.8, 18]} />
        <meshStandardMaterial map={woodTex} color="#3B2416" roughness={0.24} />
      </mesh>

      {/* Perspective Wooden Cross-Arm Beam under cutaway (top sunlit face + front darker face) */}
      <group position={[0, -0.42, 0.05]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.92, 0.84, 1.35]} />
          <meshStandardMaterial color="#B58E64" roughness={0.68} />
        </mesh>
        {/* Top sunlit bevel plane */}
        <mesh position={[0, 0.422, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.92, 1.35]} />
          <meshStandardMaterial color="#CCA87E" roughness={0.65} />
        </mesh>
      </group>

      {/* Crisp Flat Orange-Amber Sliced Insulator Cross-Section (exact shot_021.jpg hue #F0984B) */}
      <mesh geometry={cutawayGeo} position={[0, 0.0, 0.12]}>
        <meshBasicMaterial color="#F0984B" toneMapped={false} />
      </mesh>

      {/* Bright White Raindrop Beads sliding down outer umbrella tips & falling straight down! */}
      {dropPaths.map((d, i) => {
        const cyc = (frame * 0.038 + d.phase) % 1;
        let x: number;
        let y: number;
        if (cyc < 0.35) {
          // Slide outward along upper shed slope
          const t = cyc / 0.35;
          x = d.tipX * (0.45 + 0.55 * t);
          y = d.startY + (d.shedY - d.startY) * t;
        } else {
          // Drip straight down past outer tip (NEVER touches dry underside!)
          const t = (cyc - 0.35) / 0.65;
          x = d.tipX + (d.tipX > 0 ? 0.03 : -0.03);
          y = d.shedY - t * t * 1.45;
        }
        return (
          <mesh key={i} position={[x, y, 0.25]}>
            <sphereGeometry args={[0.028, 10, 10]} />
            <meshBasicMaterial color="#F2FAFF" />
          </mesh>
        );
      })}
    </group>
  );
};

/**
 * 4. Treated Dark Creosote Timber Pole (Shots 16-26)
 *    - Supports bendAngle (Shot 26 heavy multi-cable bending!)
 *    - Shot 18 SILKY VOLUMETRIC ADDITIVE CYAN BOKEH ORBS sliding smoothly down wet dark pole (shot_018.jpg!)
 */
export interface TimberPoleProps {
  height?: number;
  embedDepth?: number;
  isWet?: boolean;
  showSpark?: boolean;
  showCrossArm?: boolean;
  showInsulators?: boolean;
  bendAngle?: number;
  frame?: number;
}

export const TimberPoleMesh: React.FC<TimberPoleProps> = ({
  height = 9.0,
  embedDepth = 1.8,
  isWet = false,
  showSpark = false,
  showCrossArm = true,
  showInsulators = false,
  bendAngle = 0,
  frame = 0,
}) => {
  const woodTex = useMemo(() => createWoodTexture(true), []);
  const glowTex = useMemo(() => createSoftGlowTexture(), []);

  return (
    <group position={[0, 0, 0]} rotation={[0, 0, bendAngle]}>
      <group position={[0, -embedDepth, 0]}>
        {/* Main Creosote Timber Pole Shaft */}
        <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.095, 0.125, height, 20]} />
          <meshStandardMaterial
            map={woodTex}
            color={isWet ? "#2D1C12" : "#64442C"}
            roughness={isWet ? 0.2 : 0.76}
            metalness={isWet ? 0.14 : 0.0}
          />
        </mesh>

        {/* Wooden Cross-Arm at Top */}
        {showCrossArm && (
          <group position={[0, height - 0.55, 0]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[1.65, 0.11, 0.11]} />
              <meshStandardMaterial color="#8E6740" roughness={0.7} />
            </mesh>
            <mesh position={[-0.38, -0.22, 0.06]} rotation={[0, 0, 0.65]}>
              <boxGeometry args={[0.58, 0.038, 0.038]} />
              <meshStandardMaterial color="#583C26" />
            </mesh>
            <mesh position={[0.38, -0.22, 0.06]} rotation={[0, 0, -0.65]}>
              <boxGeometry args={[0.58, 0.038, 0.038]} />
              <meshStandardMaterial color="#583C26" />
            </mesh>

            {showInsulators && (
              <>
                <PorcelainInsulatorMesh position={[-0.65, 0.055, 0]} scale={0.78} />
                <PorcelainInsulatorMesh position={[0.65, 0.055, 0]} scale={0.78} />
              </>
            )}
          </group>
        )}

        {/* Shot 18 Soft Volumetric Additive Cyan-White Bokeh Glow Orbs sliding smoothly down wet timber (shot_018.jpg!) */}
        {showSpark && (
          <group position={[0, height - 0.45, 0.15]}>
            {[
              { phase: 0.0, size: 0.52, xOff: -0.05 },
              { phase: 0.24, size: 0.68, xOff: 0.04 },
              { phase: 0.51, size: 0.58, xOff: -0.03 },
              { phase: 0.76, size: 0.62, xOff: 0.02 },
            ].map((orb, idx) => {
              const p = (frame * 0.032 + orb.phase) % 1;
              const y = -p * 2.35;
              const x = orb.xOff + Math.sin(p * 8 + idx) * 0.04;
              const fade = Math.sin(p * Math.PI);
              return (
                <sprite key={idx} position={[x, y, 0.04]} scale={[orb.size, orb.size, 1]}>
                  <spriteMaterial
                    map={glowTex}
                    color="#7DF8FF"
                    transparent
                    opacity={0.92 * fade}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                  />
                </sprite>
              );
            })}
            <pointLight color="#3AE8FF" intensity={3.0} distance={2.4} position={[0, -0.8, 0.25]} />
          </group>
        )}
      </group>
    </group>
  );
};

/**
 * 5. Shot 15 Timber Preservative Soaking Tank (1:1 match to shot_015.jpg!)
 *    - Concrete dipping trough centered cleanly in frame with dark glossy creosote liquid
 *    - Horizontal wooden log dipping into tank + spare bamboo pile right in front!
 */
export const TimberSoakingTank3D: React.FC<{ progress: number }> = ({ progress }) => {
  const woodTex = useMemo(() => createWoodTexture(false), []);
  const ease = progress * progress * (3 - 2 * progress);
  const logY = 0.62 - Math.min(1, ease * 1.25) * 0.28;

  return (
    <group position={[0.55, 0, -0.72]}>
      {/* Concrete Tank Walls */}
      <mesh position={[0, 0.26, -0.36]} castShadow receiveShadow>
        <boxGeometry args={[3.4, 0.52, 0.12]} />
        <meshStandardMaterial color="#B8B4AC" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.26, 0.36]} castShadow receiveShadow>
        <boxGeometry args={[3.4, 0.52, 0.12]} />
        <meshStandardMaterial color="#CCC8C0" roughness={0.85} />
      </mesh>
      <mesh position={[-1.64, 0.26, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.12, 0.52, 0.84]} />
        <meshStandardMaterial color="#B8B4AC" roughness={0.85} />
      </mesh>
      <mesh position={[1.64, 0.26, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.12, 0.52, 0.84]} />
        <meshStandardMaterial color="#B8B4AC" roughness={0.85} />
      </mesh>
      {/* Dark Glossy Brown Preservative Liquid */}
      <mesh position={[0, 0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.16, 0.6]} />
        <meshStandardMaterial color="#23140A" roughness={0.14} metalness={0.22} />
      </mesh>
      {/* Horizontal Timber Pole Being Dipped by Villager */}
      <mesh position={[-0.08, logY, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.095, 0.11, 3.0, 16]} />
        <meshStandardMaterial
          map={woodTex}
          color={progress > 0.55 ? "#5D3B22" : "#BF9464"}
          roughness={0.5}
        />
      </mesh>
    </group>
  );
};

/**
 * 6. Shots 27, 29, 30 Prestressed Concrete Formwork Mold (1:1 match to shot_027, shot_029, shot_030!)
 *    - Sharply angled diagonal orientation so BOTH steel bulkheads, all 4 steel wires, stakes, AND BOTH RED/BLUE arrows sit 100% INSIDE 9:16!
 */
export const PrestressedMold3D: React.FC<{
  mode: "pour" | "tension" | "compress";
  progress: number;
}> = ({ mode, progress }) => {
  const fillLevel =
    mode === "pour"
      ? 0.06 + progress * 0.86
      : mode === "tension"
      ? Math.max(0, Math.min(1, (progress - 0.52) / 0.42))
      : 1.0;

  const isDiagonal = mode !== "pour";

  return (
    <group
      position={isDiagonal ? [0.12, 0, -0.45] : [0.15, 0, -0.35]}
      rotation={[0, isDiagonal ? -0.56 : -0.18, 0]}
    >
      {/* Wooden Formwork Side Planks */}
      <mesh position={[0, 0.18, -0.31]} castShadow receiveShadow>
        <boxGeometry args={[2.68, 0.36, 0.055]} />
        <meshStandardMaterial color="#C99E6B" roughness={0.76} />
      </mesh>
      <mesh position={[0, 0.18, 0.31]} castShadow receiveShadow>
        <boxGeometry args={[2.68, 0.36, 0.055]} />
        <meshStandardMaterial color="#DCBA8B" roughness={0.76} />
      </mesh>
      {/* Mold Bottom Floor */}
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <boxGeometry args={[2.68, 0.06, 0.62]} />
        <meshStandardMaterial color="#E6DFD2" roughness={0.82} />
      </mesh>

      {/* External Wooden Formwork Bracing Stakes along Back Side (shot_029.jpg & shot_030.jpg!) */}
      {[-1.08, -0.65, -0.22, 0.22, 0.65, 1.08].map((sx, i) => (
        <mesh key={i} position={[sx, 0.22, -0.38]} castShadow>
          <boxGeometry args={[0.06, 0.44, 0.06]} />
          <meshStandardMaterial color="#7C5634" roughness={0.85} />
        </mesh>
      ))}

      {/* Dark Steel End Anchor Bulkheads (BOTH visible inside 9:16 frame!) */}
      <mesh position={[-1.36, 0.24, 0]} castShadow>
        <boxGeometry args={[0.09, 0.48, 0.7]} />
        <meshStandardMaterial color="#1E2126" metalness={0.55} roughness={0.42} />
      </mesh>
      <mesh position={[1.36, 0.24, 0]} castShadow>
        <boxGeometry args={[0.09, 0.48, 0.7]} />
        <meshStandardMaterial color="#1E2126" metalness={0.55} roughness={0.42} />
      </mesh>

      {/* 4 Shiny Taut Steel Prestressing Tendon Wires clearly visible across open trough */}
      {mode !== "pour" &&
        [-0.18, -0.06, 0.06, 0.18].map((zOff, i) => (
          <mesh key={i} position={[0, 0.26, zOff]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.018, 0.018, 2.72, 10]} />
            <meshStandardMaterial color="#E4ECF4" metalness={0.86} roughness={0.18} />
          </mesh>
        ))}

      {/* Smooth Rising Light-Gray Concrete Beam inside Formwork */}
      {fillLevel > 0.02 && (
        <mesh position={[0, 0.06 + (0.29 * fillLevel) / 2, 0]} receiveShadow>
          <boxGeometry args={[2.62, 0.29 * fillLevel, 0.56]} />
          <meshStandardMaterial color="#E4E5E2" roughness={0.54} />
        </mesh>
      )}

      {/* Shot 29: Bold RED Outward Tension Arrows with Round Pin Heads cleanly inside 9:16! (shot_029.jpg) */}
      {mode === "tension" && progress > 0.06 && (
        <>
          <group position={[-1.06 - Math.sin(progress * 12) * 0.05, 0.46, 0.04]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.032, 0.032, 0.44, 10]} />
              <meshBasicMaterial color="#F23B30" />
            </mesh>
            <mesh position={[0.2, 0, 0]}>
              <sphereGeometry args={[0.075, 12, 12]} />
              <meshBasicMaterial color="#F23B30" />
            </mesh>
            <mesh position={[-0.27, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <coneGeometry args={[0.086, 0.2, 10]} />
              <meshBasicMaterial color="#F23B30" />
            </mesh>
          </group>
          <group position={[1.06 + Math.sin(progress * 12) * 0.05, 0.46, 0.04]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.032, 0.032, 0.44, 10]} />
              <meshBasicMaterial color="#F23B30" />
            </mesh>
            <mesh position={[-0.2, 0, 0]}>
              <sphereGeometry args={[0.075, 12, 12]} />
              <meshBasicMaterial color="#F23B30" />
            </mesh>
            <mesh position={[0.27, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
              <coneGeometry args={[0.086, 0.2, 10]} />
              <meshBasicMaterial color="#F23B30" />
            </mesh>
          </group>
        </>
      )}

      {/* Shot 30: Bold BLUE Inward Compression Arrows with Round Balls gliding inward cleanly inside 9:16! (shot_030.jpg) */}
      {mode === "compress" && progress > 0.08 && (
        <>
          <group position={[-0.96 + Math.min(1, (progress - 0.08) * 1.35) * 0.32, 0.45, 0.04]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.034, 0.034, 0.52, 10]} />
              <meshBasicMaterial color="#3898FF" />
            </mesh>
            <mesh position={[0.24, 0, 0]}>
              <sphereGeometry args={[0.088, 14, 14]} />
              <meshBasicMaterial color="#3898FF" />
            </mesh>
            <mesh position={[0.34, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
              <coneGeometry args={[0.092, 0.2, 10]} />
              <meshBasicMaterial color="#3898FF" />
            </mesh>
          </group>
          <group position={[0.96 - Math.min(1, (progress - 0.08) * 1.35) * 0.32, 0.45, 0.04]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.034, 0.034, 0.52, 10]} />
              <meshBasicMaterial color="#3898FF" />
            </mesh>
            <mesh position={[-0.24, 0, 0]}>
              <sphereGeometry args={[0.088, 14, 14]} />
              <meshBasicMaterial color="#3898FF" />
            </mesh>
            <mesh position={[-0.34, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <coneGeometry args={[0.092, 0.2, 10]} />
              <meshBasicMaterial color="#3898FF" />
            </mesh>
          </group>
        </>
      )}
    </group>
  );
};

/**
 * 7. Tapered Spun Prestressed Concrete Pole (Shots 28, 32-37)
 *    Supports dynamic bending (Shot 28 ordinary concrete flexing & snapping cracks open!)
 */
export interface ConcretePoleProps {
  height?: number;
  embedDepth?: number;
  showCracks?: boolean;
  crackProgress?: number;
  bendAngle?: number;
  showCrossArm?: boolean;
  showBracket?: boolean;
}

export const ConcretePoleMesh: React.FC<ConcretePoleProps> = ({
  height = 10.5,
  embedDepth = 1.8,
  showCracks = false,
  crackProgress = 1,
  bendAngle = 0,
  showCrossArm = true,
  showBracket = false,
}) => {
  const concreteTex = useMemo(() => createConcreteTexture(), []);

  return (
    <group position={[0, 0, 0]} rotation={[0, 0, bendAngle]}>
      <group position={[0, -embedDepth, 0]}>
        {/* Smooth Spun Tapered Concrete Shaft */}
        <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.088, 0.162, height, 24]} />
          <meshStandardMaterial map={concreteTex} color="#E0E0DC" roughness={0.6} />
        </mesh>

        {/* Dark Steel Cross-Arm + 3 White Lathe Porcelain Insulators */}
        {showCrossArm && (
          <group position={[0, height - 0.45, 0]}>
            <mesh castShadow>
              <boxGeometry args={[1.95, 0.095, 0.095]} />
              <meshStandardMaterial color="#303740" metalness={0.7} roughness={0.35} />
            </mesh>
            <PorcelainInsulatorMesh position={[-0.78, 0.048, 0]} scale={0.75} />
            <PorcelainInsulatorMesh position={[0.0, 0.048, 0]} scale={0.75} />
            <PorcelainInsulatorMesh position={[0.78, 0.048, 0]} scale={0.75} />
          </group>
        )}

        {/* Twin Steel Transformer Mounting Shelf Brackets (Shots 33-37) */}
        {showBracket && (
          <group position={[0.42, height - 2.35, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.74, 0.075, 0.58]} />
              <meshStandardMaterial color="#343B44" metalness={0.72} roughness={0.36} />
            </mesh>
          </group>
        )}

        {/* Shot 28 Crisp Jagged Tension Cracks Opening Along Left Face of Bent Concrete Pole (tiles_70_80_1.jpg) */}
        {showCracks && crackProgress > 0.1 && (
          <group position={[-0.08, 4.3, 0.125]} scale={[crackProgress, crackProgress, 1]}>
            {[
              [0.0, 0.55, 0.52],
              [0.05, 0.42, -0.58],
              [0.01, 0.28, 0.48],
              [0.02, -0.18, 0.55],
              [0.07, -0.32, -0.62],
              [0.02, -0.45, 0.45],
            ].map(([cx, cy, rot], i) => (
              <mesh key={i} position={[cx, cy, 0]} rotation={[0, 0, rot]}>
                <planeGeometry args={[0.026, 0.22]} />
                <meshBasicMaterial color="#181512" />
              </mesh>
            ))}
          </group>
        )}
      </group>
    </group>
  );
};

/**
 * 8. Ribbed Steel Distribution Transformer (20kV -> 220V) with Cream Hoist Rope (Shots 33-37)
 */
export interface TransformerProps {
  position?: [number, number, number];
  showHoistRope?: boolean;
  hoistTopY?: number;
}

export const TransformerMesh: React.FC<TransformerProps> = ({
  position = [0, 0, 0],
  showHoistRope = false,
  hoistTopY = 8.4,
}) => {
  const ropeLen = Math.max(0.2, hoistTopY - position[1]);

  return (
    <group position={position}>
      {/* Main Ribbed Steel Tank */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.64, 0.88, 0.54]} />
        <meshStandardMaterial color="#66707D" metalness={0.52} roughness={0.38} />
      </mesh>
      {/* Top & Bottom Flanged Lid */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[0.7, 0.06, 0.6]} />
        <meshStandardMaterial color="#48505B" metalness={0.62} roughness={0.35} />
      </mesh>
      <mesh position={[0, -0.45, 0]} castShadow>
        <boxGeometry args={[0.7, 0.06, 0.6]} />
        <meshStandardMaterial color="#48505B" metalness={0.62} roughness={0.35} />
      </mesh>

      {/* 7 Distinct Vertical Cooling Radiator Fins */}
      {[-0.24, -0.16, -0.08, 0, 0.08, 0.16, 0.24].map((x, i) => (
        <mesh key={i} position={[x, 0, 0.285]}>
          <boxGeometry args={[0.024, 0.76, 0.055]} />
          <meshStandardMaterial color="#3A424C" metalness={0.64} roughness={0.35} />
        </mesh>
      ))}

      {/* 3 White Ceramic High-Voltage Primary Bushings on Top */}
      {[-0.18, 0.0, 0.18].map((x, i) => (
        <PorcelainInsulatorMesh key={i} position={[x, 0.47, 0]} scale={0.42} />
      ))}

      {/* Vertical Cream Hoist Rope lifting transformer in Shot 33 */}
      {showHoistRope && (
        <mesh position={[0, 0.46 + ropeLen / 2, 0]}>
          <cylinderGeometry args={[0.016, 0.016, ropeLen, 8]} />
          <meshStandardMaterial color="#E6D2A2" roughness={0.82} />
        </mesh>
      )}
    </group>
  );
};

/**
 * 9. Shot 31 Prestressing Analogy: 12 Colorful Upright Books lifted HIGH (+0.34m) off wooden table (shot_031.jpg!)
 */
export const BookStackMesh: React.FC<{
  position?: [number, number, number];
  liftProgress?: number; // 0..1
}> = ({ position = [0, 0, 0], liftProgress = 0 }) => {
  const smoothLift = liftProgress * liftProgress * (3 - 2 * liftProgress);
  const liftY = smoothLift * 0.34;

  // Exact 12 colorful spines matching shot_031.jpg
  const books = [
    { color: "#EC634A", h: 0.25 },
    { color: "#50A6E6", h: 0.27 },
    { color: "#F6DA72", h: 0.255 },
    { color: "#6BC48A", h: 0.28 },
    { color: "#B679D9", h: 0.24 },
    { color: "#F49E4E", h: 0.265 },
    { color: "#517092", h: 0.28 },
    { color: "#EA6E58", h: 0.255 },
    { color: "#5AB5EC", h: 0.27 },
    { color: "#F5D768", h: 0.25 },
    { color: "#70C990", h: 0.27 },
    { color: "#B87BDC", h: 0.245 },
  ];

  const bookThickness = 0.064;
  const totalWidth = books.length * bookThickness;

  return (
    <group position={[position[0], position[1] + liftY, position[2]]}>
      {books.map((b, i) => {
        const x = -totalWidth / 2 + (i + 0.5) * bookThickness;
        return (
          <group key={i} position={[x, b.h / 2, 0]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[bookThickness - 0.004, b.h, 0.22]} />
              <meshStandardMaterial color={b.color} roughness={0.48} />
            </mesh>
            <mesh position={[0, b.h / 2 + 0.002, 0]}>
              <boxGeometry args={[bookThickness - 0.012, 0.005, 0.205]} />
              <meshStandardMaterial color="#FAF6EC" roughness={0.8} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};
