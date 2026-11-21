import React, { useMemo } from "react";
import * as THREE from "three";
import {
  createBallastPBR,
  createConcreteSleeperPBR,
  createContactShadowTexture,
  createSteelRailPBR,
  createWoodTablePBR,
} from "../pbrMaterials";

/**
 * Helper: Genuine Vignoles Steel I-Beam Rail Cross-Section Shape (NOT a simple box!)
 */
function createVignolesRailShape(scale = 1.0): THREE.Shape {
  const s = new THREE.Shape();
  // Wide flat rail foot
  s.moveTo(-0.075 * scale, 0);
  s.lineTo(0.075 * scale, 0);
  s.lineTo(0.075 * scale, 0.022 * scale);
  s.lineTo(0.018 * scale, 0.042 * scale);
  // Narrow structural web
  s.lineTo(0.018 * scale, 0.125 * scale);
  // Curved gleaming rail crown/head
  s.lineTo(0.042 * scale, 0.14 * scale);
  s.lineTo(0.042 * scale, 0.172 * scale);
  s.quadraticCurveTo(0, 0.188 * scale, -0.042 * scale, 0.172 * scale);
  s.lineTo(-0.042 * scale, 0.14 * scale);
  s.lineTo(-0.018 * scale, 0.125 * scale);
  s.lineTo(-0.018 * scale, 0.042 * scale);
  s.lineTo(-0.075 * scale, 0.022 * scale);
  s.closePath();
  return s;
}

/**
 * 1. Main Railway Embankment + Crushed Granite Ballast Bed (180+ Faceted 3D Stones)
 *    Supports:
 *    - bareDirt mode (Beats 2-3): no ballast, concrete sleepers sink & tilt into soft earth/mud!
 *    - ballastPour mode (Beat 4): crushed stone embankment rises & stones cascade in + drainage beads + load cone!
 *    - sunKink mode (Beat 6): steel rails heat up glowing orange-red & buckle sideways into S-curve!
 */
export interface RailwayTrackProps {
  mode: "ballast_normal" | "bare_dirt_sink" | "ballast_pour" | "sun_kink";
  sinkAmount?: number; // 0..1
  pourProgress?: number; // 0..1
  buckleAmount?: number; // 0..1
  showLoadCone?: boolean;
  showDrainage?: boolean;
  frame: number;
}

export const RailwayTrack3D: React.FC<RailwayTrackProps> = ({
  mode,
  sinkAmount = 0,
  pourProgress = 1,
  buckleAmount = 0,
  showLoadCone = false,
  showDrainage = false,
  frame,
}) => {
  const ballastPBR = useMemo(() => createBallastPBR(), []);
  const sleeperPBR = useMemo(() => createConcreteSleeperPBR(), []);
  const steelPBR = useMemo(() => createSteelRailPBR(), []);
  const contactTex = useMemo(() => createContactShadowTexture(), []);

  // Trapezoidal Ballast Prism Cutaway Geometry (running along X axis, centered at Z = -0.85)
  const ballastPrismGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-1.35, 0);
    s.lineTo(1.35, 0);
    s.lineTo(0.92, 0.42);
    s.lineTo(-0.92, 0.42);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 18, bevelEnabled: false });
    g.rotateY(Math.PI / 2);
    g.translate(-9, 0, 0);
    return g;
  }, []);

  // 110 Deterministic Crisp Angular Fractured Granite Rocks (100% synchronous React meshes — ZERO InstancedMesh useEffect lag!)
  const stoneMeta = useMemo(() => {
    const arr: { x: number; y: number; z: number; sx: number; sy: number; sz: number; rx: number; ry: number; color: string }[] = [];
    const colors = ["#92969C", "#7A7E84", "#A9ACAF", "#6A6E74", "#9E9A92", "#B5B3AC"];
    for (let i = 0; i < 110; i++) {
      const a = Math.sin(i * 12.9898) * 43758.5453;
      const b = Math.cos(i * 78.233) * 43758.5453;
      const c = Math.sin(i * 39.425) * 43758.5453;
      const r1 = a - Math.floor(a);
      const r2 = b - Math.floor(b);
      const r3 = c - Math.floor(c);

      const x = (r1 - 0.5) * 9.2;
      const onCutawayFront = i < 46;
      const y = onCutawayFront ? 0.06 + r2 * 0.32 : 0.37 + r2 * 0.08;
      const z = onCutawayFront ? 0.8 + (r3 - 0.5) * 0.08 : 0.65 - r3 * 1.45;
      arr.push({
        x,
        y,
        z,
        sx: 0.065 + r1 * 0.048,
        sy: 0.048 + r2 * 0.036,
        sz: 0.06 + r3 * 0.044,
        rx: r1 * Math.PI,
        ry: r2 * Math.PI,
        color: colors[i % colors.length],
      });
    }
    return arr;
  }, []);

  const showBallast = mode !== "bare_dirt_sink";
  const ballastScaleY = mode === "ballast_pour" ? Math.max(0.05, pourProgress) : 1.0;

  // Shared angular rock geometry for high performance
  const rockGeo = useMemo(() => new THREE.DodecahedronGeometry(1, 0), []);

  // Straight or S-Curve Buckled Vignoles Steel Rail Geometries!
  const { railFrontGeo, railBackGeo } = useMemo(() => {
    const shape = createVignolesRailShape(1.0);
    if (buckleAmount <= 0.01) {
      const g = new THREE.ExtrudeGeometry(shape, { depth: 18, bevelEnabled: false });
      g.rotateY(Math.PI / 2);
      g.translate(-9, 0, 0);
      return { railFrontGeo: g, railBackGeo: g };
    }
    // Sinusoidal "Sun Kink" Lateral S-Curve Rail Buckling (Beat 6!)
    const buildBuckled = (zBase: number) => {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 40; i++) {
        const x = -9 + (i / 40) * 18;
        const envelope = Math.exp(-x * x * 0.16);
        const waveZ = Math.sin(x * 1.45) * 0.58 * buckleAmount * envelope;
        const liftY = Math.abs(Math.sin(x * 1.45)) * 0.08 * buckleAmount * envelope;
        pts.push(new THREE.Vector3(x, liftY, zBase + waveZ));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      return new THREE.TubeGeometry(curve, 48, 0.068, 8, false);
    };
    return { railFrontGeo: buildBuckled(0.45), railBackGeo: buildBuckled(-0.45) };
  }, [buckleAmount]);

  const baseTrackY = showBallast ? 0.41 * ballastScaleY : 0.02 - sinkAmount * 0.24;
  const railHeatColor = buckleAmount > 0.05 ? new THREE.Color("#C9CEDA").lerp(new THREE.Color("#FF5722"), Math.min(1, buckleAmount * 1.25)) : new THREE.Color("#C9CEDA");
  const railHeatEmissive = buckleAmount > 0.05 ? new THREE.Color("#FF4500") : new THREE.Color("#000000");

  return (
    <group position={[0, 0, -0.82]}>
      {/* 1. Crushed Granite Ballast Bed Trapezoid + 110 Crisp Deterministic Angular Stones */}
      {showBallast && (
        <>
          <mesh
            geometry={ballastPrismGeo}
            position={[0, 0, 0]}
            scale={[1, ballastScaleY, 1]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial
              map={ballastPBR.map}
              normalMap={ballastPBR.normalMap}
              roughnessMap={ballastPBR.roughnessMap}
              normalScale={new THREE.Vector2(1.4, 1.4)}
            />
          </mesh>
          <group>
            {stoneMeta.map((st, i) => {
              const fallDelay = (i % 12) * 0.04;
              const fallT = mode === "ballast_pour" ? Math.max(0, Math.min(1, (pourProgress - fallDelay) / 0.45)) : 1;
              if (fallT <= 0.02) return null;
              const fallY = mode === "ballast_pour" ? (1 - fallT * fallT) * 1.65 : 0;
              return (
                <mesh
                  key={i}
                  geometry={rockGeo}
                  position={[st.x, st.y * ballastScaleY + fallY, st.z]}
                  rotation={[st.rx + fallY * 1.5, st.ry, st.rx * 0.5]}
                  scale={[st.sx * fallT, st.sy * fallT, st.sz * fallT]}
                  castShadow
                  receiveShadow
                >
                  <meshStandardMaterial color={st.color} roughness={0.78} flatShading />
                </mesh>
              );
            })}
          </group>
        </>
      )}

      {/* 2a. Glistening Mud Puddles & Squeeze Ridges (Beat 2-3: bare_dirt_sink mode!) */}
      {mode === "bare_dirt_sink" && sinkAmount > 0.1 && (
        <group position={[0, 0.012, 0.85]}>
          {[-2.1, -0.5, 0.8, 2.3].map((px, i) => {
            const alpha = Math.min(1, sinkAmount * 1.4);
            return (
              <group key={i}>
                {/* Wet mud puddle (shiny low-roughness reflective surface!) */}
                <mesh position={[px, 0, 0]} rotation={[-Math.PI / 2, 0, i * 0.4]}>
                  <circleGeometry args={[0.26 + (i % 2) * 0.08, 18]} />
                  <meshStandardMaterial
                    color="#5A3D28"
                    roughness={0.08}
                    metalness={0.12}
                    transparent
                    opacity={alpha * 0.82}
                  />
                </mesh>
                {/* Raised mud squeeze ridge next to puddle */}
                <mesh position={[px + 0.22, 0.015, (i % 2 === 0 ? 0.18 : -0.16)]}>
                  <capsuleGeometry args={[0.025, 0.28, 6, 10]} />
                  <meshStandardMaterial color="#6E4A32" roughness={0.72} transparent opacity={alpha * 0.75} />
                </mesh>
              </group>
            );
          })}
        </group>
      )}

      {/* 2. Pre-stressed Concrete Sleepers (Bantalan Beton) spaced cleanly along track */}
      {Array.from({ length: 17 }).map((_, i) => {
        const sx = -6.4 + i * 0.8;
        const centerFactor = Math.exp(-sx * sx * 0.22);
        const sleeperDip = mode === "bare_dirt_sink" ? -sinkAmount * 0.28 * centerFactor : 0;
        const sleeperTiltZ = mode === "bare_dirt_sink" ? Math.sin(i * 1.7) * 0.22 * sinkAmount * centerFactor : 0;
        const sleeperShiftZ = buckleAmount > 0.05 ? Math.sin(sx * 1.45) * 0.35 * buckleAmount * Math.exp(-sx * sx * 0.16) : 0;
        return (
          <group
            key={i}
            position={[sx, baseTrackY + 0.06 + sleeperDip, sleeperShiftZ]}
            rotation={[sleeperTiltZ * 0.6, 0, sleeperTiltZ]}
          >
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.24, 0.13, 1.55]} />
              <meshStandardMaterial
                map={sleeperPBR.map}
                normalMap={sleeperPBR.normalMap}
                roughnessMap={sleeperPBR.roughnessMap}
              />
            </mesh>
            {/* Steel Pandrol Rail Clips on both rails */}
            {[-0.45, 0.45].map((rz, j) => (
              <mesh key={j} position={[0, 0.08, rz]}>
                <boxGeometry args={[0.14, 0.04, 0.16]} />
                <meshStandardMaterial color="#3B424B" metalness={0.75} roughness={0.35} />
              </mesh>
            ))}
            {/* Contact AO Shadow under sleeper */}
            <mesh position={[0, -0.062, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.42, 1.72]} />
              <meshBasicMaterial map={contactTex} transparent depthWrite={false} opacity={0.6} />
            </mesh>
          </group>
        );
      })}

      {/* 3. Vignoles I-Beam Steel Rails (with optional 60C Sun-Kink Glowing Buckling!) */}
      <group position={[0, baseTrackY + 0.125, 0]}>
        <mesh
          geometry={railFrontGeo}
          position={[0, 0, buckleAmount > 0.01 ? 0 : 0.45]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            map={steelPBR.map}
            normalMap={steelPBR.normalMap}
            roughnessMap={steelPBR.roughnessMap}
            color={railHeatColor}
            emissive={railHeatEmissive}
            emissiveIntensity={buckleAmount * 1.35}
            metalness={0.82}
            roughness={0.28}
          />
        </mesh>
        <mesh
          geometry={railBackGeo}
          position={[0, 0, buckleAmount > 0.01 ? 0 : -0.45]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            map={steelPBR.map}
            normalMap={steelPBR.normalMap}
            roughnessMap={steelPBR.roughnessMap}
            color={railHeatColor}
            emissive={railHeatEmissive}
            emissiveIntensity={buckleAmount * 1.35}
            metalness={0.82}
            roughness={0.28}
          />
        </mesh>
      </group>

      {/* 4. Cutaway Load-Distribution Pyramid Cone (Beat 4 — spreads pressure wide into soil!) */}
      {showLoadCone && (
        <group position={[0, 0.36, 0.84]}>
          <mesh position={[0, -0.45, 0]}>
            <coneGeometry args={[1.45, 1.2, 4]} />
            <meshBasicMaterial color="#38A8FF" transparent opacity={0.28} depthWrite={false} />
          </mesh>
          {/* Glowing Blue Stress-Spread Diagonal Boundary Lines */}
          <mesh position={[-0.58, -0.48, 0.02]} rotation={[0, 0, -0.58]}>
            <planeGeometry args={[0.045, 1.38]} />
            <meshBasicMaterial color="#58C4FF" toneMapped={false} />
          </mesh>
          <mesh position={[0.58, -0.48, 0.02]} rotation={[0, 0, 0.58]}>
            <planeGeometry args={[0.045, 1.38]} />
            <meshBasicMaterial color="#58C4FF" toneMapped={false} />
          </mesh>
        </group>
      )}

      {/* 5. Animated Blue Rainwater Drainage Beads Percolating Down Through Stone Gaps (Beat 4) */}
      {showDrainage && (
        <group position={[0, 0.42, 0.85]}>
          {[-0.9, -0.5, -0.15, 0.25, 0.65, 1.0].map((dx, i) => {
            const p = ((frame * 0.05 + i * 0.19) % 1);
            const y = -p * 0.85;
            const xZig = dx + Math.sin(p * 14 + i) * 0.06;
            return (
              <mesh key={i} position={[xZig, y, 0]}>
                <sphereGeometry args={[0.036, 10, 10]} />
                <meshStandardMaterial color="#4AC3FF" emissive="#1EA4FF" emissiveIntensity={0.8} roughness={0.1} />
              </mesh>
            );
          })}
        </group>
      )}
    </group>
  );
};

/**
 * 2. Iconic Indonesian Stylized Passenger Train (KAI-inspired Cream/Blue/Orange Locomotive + Coach)
 */
export const StylizedTrain3D: React.FC<{
  posX: number;
  baseY?: number;
  tiltZ?: number;
  frame: number;
}> = ({ posX, baseY = 0.72, tiltZ = 0, frame }) => {
  const wheelRot = -posX * 2.8;
  const rumbleY = Math.sin(frame * 1.1) * 0.008;

  const CoachBody: React.FC<{ offsetX: number; isLocomotive?: boolean }> = ({
    offsetX,
    isLocomotive = false,
  }) => (
    <group position={[offsetX, 0, 0]}>
      {/* Main Cream-White Coach Shell */}
      <mesh position={[0, 0.85, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.4, 1.38, 1.28]} />
        <meshStandardMaterial color="#F2F1EC" roughness={0.32} metalness={0.12} />
      </mesh>
      {/* Rounded Roof Cap */}
      <mesh position={[0, 1.56, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.64, 0.64, 4.38, 16, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color="#DCDCE0" roughness={0.38} metalness={0.2} />
      </mesh>
      {/* Signature Cobalt-Blue & Vibrant Orange Livery Stripes */}
      <mesh position={[0, 0.56, 0.645]}>
        <planeGeometry args={[4.42, 0.28]} />
        <meshStandardMaterial color="#1E5298" roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.36, 0.646]}>
        <planeGeometry args={[4.42, 0.14]} />
        <meshStandardMaterial color="#EA6A20" roughness={0.3} />
      </mesh>
      {/* Dark Tinted Passenger Windows */}
      {[-1.55, -0.78, 0.0, 0.78, 1.55].map((wx, i) => (
        <mesh key={i} position={[wx, 1.02, 0.648]}>
          <planeGeometry args={[0.56, 0.42]} />
          <meshStandardMaterial color="#182534" roughness={0.12} metalness={0.6} />
        </mesh>
      ))}
      {/* Locomotive Aerodynamic Nose & Glowing Warm Headlights */}
      {isLocomotive && (
        <group position={[2.22, 0.85, 0]}>
          <mesh position={[0.18, -0.05, 0]} castShadow>
            <boxGeometry args={[0.42, 1.28, 1.24]} />
            <meshStandardMaterial color="#1E5298" roughness={0.28} metalness={0.15} />
          </mesh>
          <mesh position={[0.4, 0.18, 0]}>
            <boxGeometry args={[0.04, 0.48, 1.02]} />
            <meshStandardMaterial color="#111C28" roughness={0.08} metalness={0.75} />
          </mesh>
          {/* Twin Glowing Warm Headlights (triggers subtle Bloom!) */}
          {[-0.36, 0.36].map((lz, i) => (
            <mesh key={i} position={[0.41, -0.28, lz]}>
              <sphereGeometry args={[0.09, 12, 12]} />
              <meshBasicMaterial color="#FFF6C8" toneMapped={false} />
            </mesh>
          ))}
        </group>
      )}
      {/* Dark Metallic Bogie Underframe & 4 Spinning Flanged Steel Wheels */}
      <mesh position={[0, 0.16, 0]} castShadow>
        <boxGeometry args={[4.1, 0.2, 1.1]} />
        <meshStandardMaterial color="#2A2F36" metalness={0.65} roughness={0.45} />
      </mesh>
      {[-1.55, -0.95, 0.95, 1.55].map((wx, i) => (
        <group key={i} position={[wx, 0.08, 0]} rotation={[0, 0, wheelRot]}>
          <mesh position={[0, 0, 0.45]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 0.08, 18]} />
            <meshStandardMaterial color="#5A636E" metalness={0.85} roughness={0.26} />
          </mesh>
          <mesh position={[0, 0, -0.45]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.08, 18]} />
            <meshStandardMaterial color="#5A636E" metalness={0.85} roughness={0.26} />
          </mesh>
        </group>
      ))}
    </group>
  );

  return (
    <group position={[posX, baseY + rumbleY, -0.82]} rotation={[tiltZ * 0.5, 0, tiltZ]}>
      <CoachBody offsetX={0} isLocomotive />
      <CoachBody offsetX={-4.75} />
    </group>
  );
};

/**
 * 3. Beat 4 Macro DOF Hero Scene: Sculpted Angular Crushed Granite Stones Interlocking Edge-to-Edge!
 */
export const MacroBallastInterlock3D: React.FC<{ progress: number; frame: number }> = ({
  progress,
  frame,
}) => {
  const ballastPBR = useMemo(() => createBallastPBR(), []);
  const press = Math.min(1, progress * 1.4);
  const squeeze = press * 0.045;

  const rocks: { pos: [number, number, number]; s: [number, number, number]; rot: [number, number, number]; c: string }[] = [
    { pos: [0.0, 0.22 - squeeze, 0.0], s: [0.34, 0.22, 0.28], rot: [0.3, 0.8, 0.2], c: "#B8BDC4" },
    { pos: [-0.36 + squeeze * 0.5, 0.12, 0.06], s: [0.28, 0.2, 0.24], rot: [1.1, 0.4, 0.6], c: "#9CA2AA" },
    { pos: [0.38 - squeeze * 0.5, 0.1, 0.04], s: [0.3, 0.21, 0.26], rot: [0.7, 1.5, 0.3], c: "#CED2D8" },
    { pos: [-0.18, -0.07, 0.1], s: [0.32, 0.22, 0.28], rot: [0.2, 2.1, 0.9], c: "#A8AEB6" },
    { pos: [0.22, -0.09, 0.08], s: [0.31, 0.2, 0.26], rot: [1.5, 0.6, 0.4], c: "#8F959E" },
    { pos: [-0.52, -0.15, -0.05], s: [0.26, 0.2, 0.24], rot: [0.4, 1.2, 1.4], c: "#B6B2A8" },
    { pos: [0.54, -0.17, -0.04], s: [0.28, 0.22, 0.24], rot: [0.9, 0.2, 0.8], c: "#A2A7AF" },
    { pos: [0.0, -0.27, -0.02], s: [0.36, 0.22, 0.3], rot: [0.5, 0.9, 0.1], c: "#C2C5CA" },
  ];

  return (
    <group position={[0, 1.8, 0]}>
      {/* Concrete Sleeper Underside Pressing Down From Above */}
      <mesh position={[0, 0.54 - squeeze * 1.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.65, 0.26, 0.72]} />
        <meshStandardMaterial color="#DCD9D0" roughness={0.72} />
      </mesh>
      {/* Interlocking Sharp Angular Crushed Granite Rocks (bright sunlit granite with PBR normal relief!) */}
      {rocks.map((rk, i) => (
        <mesh key={i} position={rk.pos} scale={rk.s} rotation={rk.rot} castShadow receiveShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            normalMap={ballastPBR.normalMap}
            roughnessMap={ballastPBR.roughnessMap}
            normalScale={new THREE.Vector2(1.2, 1.2)}
            color={rk.c}
            roughness={0.68}
            metalness={0.05}
            flatShading
          />
        </mesh>
      ))}
      {/* Glowing Cyan Friction Lock Points where Sharp Edges Bite Together! */}
      {progress > 0.35 &&
        [
          [-0.18, 0.12, 0.24],
          [0.19, 0.11, 0.24],
          [0.0, -0.06, 0.28],
        ].map(([cx, cy, cz], i) => {
          const pulse = 0.045 + Math.sin(frame * 0.35 + i) * 0.012;
          return (
            <mesh key={i} position={[cx, cy, cz]}>
              <sphereGeometry args={[pulse, 12, 12]} />
              <meshBasicMaterial color="#48D8FF" toneMapped={false} />
            </mesh>
          );
        })}
    </group>
  );
};

/**
 * 4. Beat 5 Everyday Table Analogy: Round Glass Marbles (scatter wildly!) vs Sharp Angular Gravel (locked rock-solid!)
 */
export const TableAnalogy3D: React.FC<{ progress: number; frame: number }> = ({ progress, frame }) => {
  const woodPBR = useMemo(() => createWoodTablePBR(), []);

  // Left side (marbles): scatter smoothly outward once engineer presses down (progress > 0.20)
  const scatterT = Math.max(0, Math.min(1, (progress - 0.2) / 0.28));
  const easeScatter = 1 - Math.pow(1 - scatterT, 3);

  // Right side (angular crushed stones): stay rock-solid even when pressed hard (progress > 0.62)
  const stonePressT = Math.sin(Math.max(0, Math.min(1, (progress - 0.58) / 0.34)) * Math.PI);

  const marbleColors = ["#E53935", "#1E88E5", "#43A047", "#FDD835", "#8E24AA", "#00ACC1", "#FB8C00"];

  return (
    <group position={[0, 0, 0.45]}>
      {/* Warm PBR Oak Wooden Table (top surface cleanly at Y = 0.80m — ZERO clipping!) */}
      <mesh position={[0, 0.77, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.85, 0.06, 0.72]} />
        <meshStandardMaterial
          map={woodPBR.map}
          normalMap={woodPBR.normalMap}
          roughnessMap={woodPBR.roughnessMap}
        />
      </mesh>
      {[
        [-0.82, 0.37, -0.28],
        [0.82, 0.37, -0.28],
        [-0.82, 0.37, 0.28],
        [0.82, 0.37, 0.28],
      ].map(([lx, ly, lz], i) => (
        <mesh key={i} position={[lx, ly, lz]} castShadow>
          <boxGeometry args={[0.075, 0.74, 0.075]} />
          <meshStandardMaterial color="#966A3E" roughness={0.72} />
        </mesh>
      ))}

      {/* Wooden Presser Block LEFT (tilts & drops as marbles scatter!) */}
      <group position={[-0.42, 0.835 + 0.32 - easeScatter * 0.25, 0.04]}>
        <mesh
          rotation={[0, 0, easeScatter * 0.32]}
          castShadow
        >
          <boxGeometry args={[0.26, 0.08, 0.22]} />
          <meshStandardMaterial color="#A07842" roughness={0.72} />
        </mesh>
        {/* Red X indicator when block fails */}
        {easeScatter > 0.35 && (
          <mesh position={[0, 0.065, 0.001]}>
            <planeGeometry args={[0.12, 0.04]} />
            <meshBasicMaterial color="#E53935" toneMapped={false} />
          </mesh>
        )}
      </group>

      {/* LEFT SIDE: 18 Glossy Round Glass Marbles (scatter wildly when pressed!) */}
      <group position={[-0.42, 0.835, 0.04]}>
        {Array.from({ length: 18 }).map((_, i) => {
          const ring = i < 10 ? 0 : 1;
          const ang = (i / (ring === 0 ? 10 : 8)) * Math.PI * 2 + ring * 0.4;
          const r0 = ring === 0 ? 0.08 + (i % 3) * 0.035 : 0.05;
          const y0 = ring === 0 ? 0 : 0.055;
          const spread = easeScatter * (0.22 + (i % 4) * 0.08);
          const x = Math.cos(ang) * (r0 + spread);
          const z = Math.sin(ang) * (r0 + spread * 0.7);
          const y = y0 * (1 - easeScatter);
          return (
            <mesh key={i} position={[x, y, z]} castShadow receiveShadow>
              <sphereGeometry args={[0.036, 16, 16]} />
              <meshStandardMaterial
                color={marbleColors[i % marbleColors.length]}
                roughness={0.06}
                metalness={0.18}
              />
            </mesh>
          );
        })}
      </group>

      {/* Wooden Presser Block RIGHT (stays rock-solid on sharp stones!) */}
      <group position={[0.42, 0.835 + 0.32 - stonePressT * 0.015, 0.04]}>
        <mesh castShadow>
          <boxGeometry args={[0.26, 0.08, 0.22]} />
          <meshStandardMaterial color="#A07842" roughness={0.72} />
        </mesh>
        {/* Green check indicator when block holds */}
        {stonePressT > 0.25 && (
          <mesh position={[0, 0.065, 0.001]}>
            <planeGeometry args={[0.12, 0.04]} />
            <meshBasicMaterial color="#48E57A" toneMapped={false} />
          </mesh>
        )}
      </group>

      {/* RIGHT SIDE: 18 Sharp Angular Granite Stones (locked firmly together!) */}
      <group position={[0.42, 0.835, 0.04]}>
        {Array.from({ length: 18 }).map((_, i) => {
          const ring = i < 11 ? 0 : 1;
          const ang = (i / (ring === 0 ? 11 : 7)) * Math.PI * 2 + ring * 0.5;
          const r = ring === 0 ? 0.09 + (i % 3) * 0.032 : 0.055;
          const y = (ring === 0 ? 0.005 : 0.062) - stonePressT * 0.008;
          return (
            <mesh
              key={i}
              position={[Math.cos(ang) * r, y, Math.sin(ang) * r * 0.8]}
              rotation={[i * 0.8, i * 1.1, i * 0.4]}
              scale={[0.045, 0.036, 0.042]}
              castShadow
              receiveShadow
            >
              <dodecahedronGeometry args={[1, 0]} />
              <meshStandardMaterial
                color={i % 3 === 0 ? "#7E8288" : i % 3 === 1 ? "#63676D" : "#96989C"}
                roughness={0.82}
                flatShading
              />
            </mesh>
          );
        })}
        {/* Emerald Stability Glow Ring when pressed solid */}
        {stonePressT > 0.15 && (
          <mesh position={[0, -0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.17, 0.21, 28]} />
            <meshBasicMaterial color="#48E57A" transparent opacity={stonePressT * 0.85} toneMapped={false} />
          </mesh>
        )}
      </group>
    </group>
  );
};

/**
 * 5. Beat 7 Macro DOF Hero Scene: Exact 10mm Rail Expansion Gap + Bolted Steel Fishplate + Rolling Steel Wheel!
 */
export const MacroExpansionGap3D: React.FC<{ progress: number; frame: number }> = ({
  progress,
  frame,
}) => {
  const steelPBR = useMemo(() => createSteelRailPBR(), []);

  const railHalfGeo = useMemo(() => {
    const shape = createVignolesRailShape(2.2);
    const g = new THREE.ExtrudeGeometry(shape, { depth: 1.9, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.004 });
    g.rotateY(Math.PI / 2);
    return g;
  }, []);

  // Gap breathes subtly narrower under heat then relaxes back cleanly
  const gapHalf = 0.075 - Math.sin(Math.min(1, progress * 1.4) * Math.PI) * 0.032;

  // Gleaming flanged steel train wheel rolling straight across the 10mm gap in second half of shot!
  const wheelT = Math.max(0, Math.min(1, (progress - 0.46) / 0.48));
  const wheelX = -2.4 + wheelT * 4.8;
  const wheelBump = Math.exp(-Math.pow(wheelX * 4.5, 2)) * -0.018;

  return (
    <group position={[0, 1.75, 0]}>
      {/* Concrete Sleeper & Crushed Stones Below Joint */}
      <mesh position={[0, -0.14, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.4, 0.28, 0.85]} />
        <meshStandardMaterial color="#C7C4BC" roughness={0.82} />
      </mesh>

      {/* Left Steel I-Beam Rail (gleaming bright brushed steel!) */}
      <mesh geometry={railHalfGeo} position={[-1.9 - gapHalf, 0, 0]} castShadow receiveShadow>
        <meshStandardMaterial
          normalMap={steelPBR.normalMap}
          roughnessMap={steelPBR.roughnessMap}
          color="#D2DCE6"
          metalness={0.58}
          roughness={0.26}
        />
      </mesh>

      {/* Right Steel I-Beam Rail */}
      <mesh geometry={railHalfGeo} position={[gapHalf, 0, 0]} castShadow receiveShadow>
        <meshStandardMaterial
          normalMap={steelPBR.normalMap}
          roughnessMap={steelPBR.roughnessMap}
          color="#D2DCE6"
          metalness={0.58}
          roughness={0.26}
        />
      </mesh>

      {/* Bolted Steel Fishplate (Pelat Sambung) joining the two webs across the gap */}
      <mesh position={[0, 0.185, 0.068]} castShadow>
        <boxGeometry args={[0.92, 0.14, 0.036]} />
        <meshStandardMaterial color="#7C8794" metalness={0.62} roughness={0.34} />
      </mesh>
      {[-0.34, -0.14, 0.14, 0.34].map((bx, i) => (
        <mesh key={i} position={[bx, 0.185, 0.1]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.034, 0.034, 0.045, 6]} />
          <meshStandardMaterial color="#B0BAC6" metalness={0.72} roughness={0.28} />
        </mesh>
      ))}

      {/* Glowing Amber Measurement Highlight Inside the 10mm Gap */}
      <mesh position={[0, 0.21, 0]}>
        <boxGeometry args={[gapHalf * 1.9, 0.39, 0.16]} />
        <meshBasicMaterial color="#FFD54F" transparent opacity={0.32 + Math.sin(frame * 0.25) * 0.1} toneMapped={false} />
      </mesh>

      {/* Heavy Flanged Steel Train Wheel Rolling Over the Gap ("jeglek-jeglek"!) */}
      {progress > 0.45 && (
        <group position={[wheelX, 0.84 + wheelBump, 0]} rotation={[0, 0, -wheelX * 2.1]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.44, 0.44, 0.18, 28]} />
            <meshStandardMaterial color="#6F7984" metalness={0.88} roughness={0.22} />
          </mesh>
          {/* Inner Wheel Flange */}
          <mesh position={[0, 0, -0.095]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.5, 0.5, 0.03, 28]} />
            <meshStandardMaterial color="#545D67" metalness={0.88} roughness={0.26} />
          </mesh>
          {/* Hub Axle */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.14, 0.14, 0.24, 16]} />
            <meshStandardMaterial color="#373E46" metalness={0.8} roughness={0.35} />
          </mesh>
        </group>
      )}

      {/* Golden Spark/Pulse Ring exactly at X=0 when wheel crosses the 10mm gap! */}
      {progress > 0.45 && Math.abs(wheelX) < 0.42 && (
        <group position={[0, 0.86, 0]}>
          <mesh rotation={[0, Math.PI / 2, 0]}>
            <ringGeometry args={[0.18 + Math.sin(frame * 1.8) * 0.04, 0.24, 24]} />
            <meshBasicMaterial
              color="#FFD740"
              transparent
              opacity={0.65 + Math.sin(frame * 2.5) * 0.2}
              toneMapped={false}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Tiny sparks radiating outward */}
          {[0, 1.0, 2.1, 3.1, 4.2, 5.3].map((ang, si) => {
            const sparkR = 0.28 + Math.sin(frame * 2.2 + si * 1.4) * 0.05;
            return (
              <mesh key={si} position={[0, Math.sin(ang) * sparkR, Math.cos(ang) * sparkR]}>
                <sphereGeometry args={[0.016, 6, 6]} />
                <meshBasicMaterial color="#FFE082" toneMapped={false} />
              </mesh>
            );
          })}
        </group>
      )}
    </group>
  );
};
