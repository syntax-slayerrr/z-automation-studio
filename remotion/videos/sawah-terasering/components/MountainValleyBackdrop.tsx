import React, { useMemo } from "react";
import * as THREE from "three";
import { createWoodBoardTexture } from "../pbrMaterials";

export interface MountainValleyBackdropProps {
  rainFactor: number; // 0..1 triggers slanted 3D tropical monsoon rain streaks
  sunsetFactor: number; // 0..1 warms mountain haze & lights the farmer's saung hut lantern!
  frame: number;
}

/**
 * Stylized Swaying Tropical Coconut Palm (Low-Poly Smooth Organic Form — ANGLE Crash-Proof!)
 */
const CoconutPalm: React.FC<{
  position: [number, number, number];
  scale?: number;
  leanAngle?: number;
  yaw?: number;
  frame: number;
  phase?: number;
}> = ({ position, scale = 1, leanAngle = 0.16, yaw = 0, frame, phase = 0 }) => {
  const sway = Math.sin(frame * 0.055 + phase) * 0.035;
  return (
    <group position={position} rotation={[0, yaw, 0]} scale={[scale, scale, scale]}>
      {/* Segmented curved palm trunk */}
      {[0, 1, 2, 3, 4].map((seg) => (
        <mesh
          key={seg}
          position={[Math.sin(leanAngle * seg) * 0.24, seg * 0.56 + 0.28, 0]}
          rotation={[0, 0, -leanAngle * (seg * 0.28) + sway * seg * 0.12]}
          castShadow
        >
          <cylinderGeometry args={[0.11 - seg * 0.012, 0.13 - seg * 0.012, 0.62, 8]} />
          <meshStandardMaterial color={seg % 2 === 0 ? "#8B6947" : "#7D5D3E"} roughness={0.86} />
        </mesh>
      ))}
      {/* Crown of 6 graceful arching tropical fronds */}
      <group
        position={[Math.sin(leanAngle * 4) * 0.28, 3.05, 0]}
        rotation={[sway * 0.6, 0, sway * 1.1]}
      >
        {[0, 1, 2, 3, 4, 5].map((fi) => {
          const ang = (fi / 6) * Math.PI * 2 + 0.3;
          const frondWave = Math.sin(frame * 0.08 + fi + phase) * 0.05;
          return (
            <group key={fi} rotation={[0, ang, 0]}>
              <mesh position={[0.48, 0.12, 0]} rotation={[0, 0, -0.35 + frondWave]} scale={[1.0, 0.18, 0.38]}>
                <sphereGeometry args={[0.62, 8, 6]} />
                <meshStandardMaterial color={fi % 2 === 0 ? "#4D9E38" : "#3E8C2E"} roughness={0.68} />
              </mesh>
              <mesh position={[1.02, -0.14, 0]} rotation={[0, 0, -0.82 + frondWave * 1.4]} scale={[0.9, 0.14, 0.3]}>
                <sphereGeometry args={[0.52, 8, 6]} />
                <meshStandardMaterial color="#5AAE3E" roughness={0.66} />
              </mesh>
            </group>
          );
        })}
        {/* Small cluster of green coconuts beneath crown */}
        {[-0.1, 0.08, 0.0].map((cx, ci) => (
          <mesh key={ci} position={[cx, -0.12, ci === 2 ? 0.1 : -0.06]}>
            <sphereGeometry args={[0.095, 8, 8]} />
            <meshStandardMaterial color="#6D8E32" roughness={0.65} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

/**
 * Traditional Indonesian Bamboo Farmer's "Saung" Pavilion Hut perched on upper mountain ridge
 * Lights up with a warm golden dusk lantern during golden sunset (Seq 7)!
 */
const SaungFarmerHut: React.FC<{
  position: [number, number, number];
  sunsetFactor: number;
}> = ({ position, sunsetFactor }) => {
  const woodTex = useMemo(() => createWoodBoardTexture(), []);
  return (
    <group position={position} rotation={[0, 0.38, 0]}>
      {/* 4 Bamboo Stilt Posts */}
      {[
        [-0.62, -0.52],
        [0.62, -0.52],
        [-0.62, 0.52],
        [0.62, 0.52],
      ].map(([px, pz], i) => (
        <mesh key={i} position={[px, 0.72, pz]} castShadow receiveShadow>
          <cylinderGeometry args={[0.048, 0.055, 1.55, 8]} />
          <meshStandardMaterial color="#B59B56" roughness={0.72} />
        </mesh>
      ))}
      {/* Raised Bamboo Floor Deck */}
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.45, 0.09, 1.22]} />
        <meshStandardMaterial map={woodTex} roughness={0.78} />
      </mesh>
      {/* Low Bamboo Railing */}
      <mesh position={[0, 0.76, -0.52]}>
        <boxGeometry args={[1.3, 0.05, 0.05]} />
        <meshStandardMaterial color="#A88E4A" roughness={0.75} />
      </mesh>
      {/* Layered Warm Terracotta / Javanese Thatched Pyramid Roof */}
      <mesh position={[0, 1.82, 0]} rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow>
        <coneGeometry args={[1.38, 0.96, 4]} />
        <meshStandardMaterial color="#B5562E" roughness={0.86} />
      </mesh>
      <mesh position={[0, 2.34, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.32, 0.26, 4]} />
        <meshStandardMaterial color="#8F3F1F" roughness={0.88} />
      </mesh>
      {/* Warm Hanging Dusk Lantern glowing richly during Seq 7 Golden Hour */}
      <group position={[0.42, 1.24, 0.42]}>
        <mesh>
          <cylinderGeometry args={[0.065, 0.055, 0.16, 8]} />
          <meshStandardMaterial
            color={sunsetFactor > 0.2 ? "#FFE099" : "#D6CDB8"}
            emissive="#FF9B38"
            emissiveIntensity={sunsetFactor * 2.4}
            roughness={0.35}
          />
        </mesh>
        {sunsetFactor > 0.25 && (
          <pointLight
            position={[0, -0.05, 0]}
            color="#FFA64A"
            intensity={sunsetFactor * 2.8}
            distance={6.5}
          />
        )}
      </group>
    </group>
  );
};

/**
 * Layered Indonesian Tropical Volcanic Mountain Valley Backdrop:
 * - Aerial-perspective misty volcanic peaks + surrounding lush terraced valley hills
 * - Traditional farmer's saung bamboo hut + swaying coconut palms + banana clumps
 * - Drifting mountain mist clouds & slanted 3D monsoon rain streaks!
 */
export const MountainValleyBackdrop: React.FC<MountainValleyBackdropProps> = ({
  rainFactor,
  sunsetFactor,
  frame,
}) => {
  const farPeakColor = useMemo(() => {
    const day = new THREE.Color("#6FA3C8");
    const rain = new THREE.Color("#5D7387");
    const sun = new THREE.Color("#9E7792");
    const c = day.clone();
    if (rainFactor > 0) c.lerp(rain, rainFactor);
    if (sunsetFactor > 0) c.lerp(sun, sunsetFactor);
    return c;
  }, [rainFactor, sunsetFactor]);

  const midHillColor = useMemo(() => {
    const day = new THREE.Color("#569952");
    const rain = new THREE.Color("#48694D");
    const sun = new THREE.Color("#8B8444");
    const c = day.clone();
    if (rainFactor > 0) c.lerp(rain, rainFactor);
    if (sunsetFactor > 0) c.lerp(sun, sunsetFactor);
    return c;
  }, [rainFactor, sunsetFactor]);

  const nearHillColor = useMemo(() => {
    const day = new THREE.Color("#4E9B3E");
    const rain = new THREE.Color("#416B3E");
    const sun = new THREE.Color("#88943A");
    const c = day.clone();
    if (rainFactor > 0) c.lerp(rain, rainFactor);
    if (sunsetFactor > 0) c.lerp(sun, sunsetFactor);
    return c;
  }, [rainFactor, sunsetFactor]);

  // Deterministic rain drop coordinates for Seq 1-2 monsoon storm
  const rainDrops = useMemo(() => {
    const arr: { x: number; y0: number; z: number; speed: number; len: number }[] = [];
    for (let i = 0; i < 64; i++) {
      const rx = ((i * 73.1) % 14) - 7;
      const ry = ((i * 41.7) % 10) - 1;
      const rz = ((i * 29.3) % 7) - 3.8;
      arr.push({
        x: rx,
        y0: ry,
        z: rz,
        speed: 0.42 + (i % 4) * 0.08,
        len: 0.42 + (i % 3) * 0.14,
      });
    }
    return arr;
  }, []);

  return (
    <group>
      {/* 1. Far Indonesian Volcanic Mountain Range Silhouettes (Open Sky Composition — Top 40% Cumulus Sky!) */}
      <group position={[0, -4.6, -28]}>
        <mesh position={[-12, 4.6, -4]} scale={[1.55, 0.92, 0.8]}>
          <coneGeometry args={[10.5, 11.8, 12]} />
          <meshStandardMaterial color={farPeakColor} roughness={0.96} />
        </mesh>
        <mesh position={[2.2, 5.4, -7]} scale={[1.45, 0.92, 0.85]}>
          <coneGeometry args={[11.8, 13.5, 14]} />
          <meshStandardMaterial color={farPeakColor} roughness={0.96} />
        </mesh>
        <mesh position={[15, 3.8, -4]} scale={[1.6, 0.85, 0.8]}>
          <coneGeometry args={[9.8, 10.5, 12]} />
          <meshStandardMaterial color={farPeakColor} roughness={0.96} />
        </mesh>
      </group>

      {/* 2. Drifting Valley Cloud / Mist Ribbons floating gently between mountains */}
      {[
        { x0: -8.5, y: 2.4, z: -18, sx: 6.5, sy: 0.65, spd: 0.012 },
        { x0: 4.5, y: 1.8, z: -15.5, sx: 5.8, sy: 0.54, spd: 0.009 },
        { x0: -1.5, y: 3.6, z: -21, sx: 7.4, sy: 0.72, spd: 0.014 },
      ].map((m, i) => {
        const mx = m.x0 + Math.sin(frame * m.spd + i * 2) * 1.8;
        return (
          <mesh key={i} position={[mx, m.y, m.z]} scale={[m.sx, m.sy, 1]}>
            <sphereGeometry args={[1, 12, 8]} />
            <meshBasicMaterial
              color={sunsetFactor > 0.3 ? "#FFE2CC" : "#EDF6FC"}
              transparent
              opacity={0.36}
              depthWrite={false}
            />
          </mesh>
        );
      })}

      {/* 3. Lowered Mid-Ground Rolling Lush Terraced Hills (Framing Valley Without Blocking Sky!) */}
      <group position={[0, -5.2, -14.5]}>
        <mesh position={[-8.8, 1.8, -1.5]} scale={[1.7, 0.62, 1.0]} receiveShadow>
          <sphereGeometry args={[6.4, 20, 14]} />
          <meshStandardMaterial color={midHillColor} roughness={0.92} />
        </mesh>
        <mesh position={[7.8, 1.1, -2.2]} scale={[1.9, 0.58, 1.0]} receiveShadow>
          <sphereGeometry args={[6.6, 20, 14]} />
          <meshStandardMaterial color={midHillColor} roughness={0.92} />
        </mesh>
        {/* Distant miniature curved terrace contour ribbons across background valley */}
        {[0, 1, 2, 3].map((k) => (
          <mesh key={k} position={[4.2 + k * 1.0, 2.7 - k * 0.48, 2.2]} rotation={[0, -0.22, -0.05]}>
            <boxGeometry args={[5.4, 0.24, 1.1]} />
            <meshStandardMaterial color={k % 2 === 0 ? "#66B248" : "#569E3E"} roughness={0.86} />
          </mesh>
        ))}
      </group>

      {/* 4. Surrounding Lower Valley Floor & Gentle Left Ridge Extension */}
      <mesh position={[0, -4.4, -12]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[75, 45]} />
        <meshStandardMaterial color={nearHillColor} roughness={0.94} />
      </mesh>
      <mesh position={[-8.5, -0.25, -4.4]} scale={[1.2, 0.68, 1.0]} receiveShadow>
        <sphereGeometry args={[3.8, 18, 12]} />
        <meshStandardMaterial color={nearHillColor} roughness={0.9} />
      </mesh>

      {/* 5. Iconic Farmer's Bamboo Saung Hut Positioned Clearly Visible on Upper Left Ridge */}
      <SaungFarmerHut position={[-3.25, 1.78, -3.55]} sunsetFactor={sunsetFactor} />

      {/* 6. Swaying Tropical Coconut Palms Framing Both Sides of the Mountain Terrace */}
      <CoconutPalm position={[-4.45, 1.82, -3.95]} scale={1.08} leanAngle={0.18} yaw={0.4} frame={frame} phase={0.0} />
      <CoconutPalm position={[-1.65, 1.15, -4.25]} scale={0.92} leanAngle={-0.14} yaw={1.2} frame={frame} phase={1.7} />
      <CoconutPalm position={[3.65, -0.45, -3.85]} scale={1.04} leanAngle={-0.22} yaw={2.4} frame={frame} phase={3.1} />

      {/* Light stylized tropical bushes along upper mountain rim (dodecahedron detail=1!) */}
      {[
        [-4.5, 2.05, -4.1, 0.72, "#469436"],
        [-3.0, 1.85, -4.3, 0.62, "#54A43C"],
        [-0.8, 1.05, -4.5, 0.66, "#4A9A38"],
        [2.2, 0.22, -4.5, 0.7, "#3E8C30"],
        [4.1, -0.52, -4.3, 0.74, "#52A23B"],
      ].map(([bx, by, bz, bs, col], i) => (
        <mesh key={i} position={[bx as number, by as number, bz as number]} scale={[bs as number, (bs as number) * 0.75, bs as number]} castShadow>
          <dodecahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color={col as string} roughness={0.82} />
        </mesh>
      ))}

      {/* 7. Slanted 3D Monsoon Rain Streaks (Seq 1–2 storm washout!) */}
      {rainFactor > 0.04 && (
        <group>
          {rainDrops.map((rd, i) => {
            const cyc = (frame * rd.speed + i * 0.37) % 10;
            const x = rd.x + cyc * 0.22;
            const y = 7.2 - cyc;
            return (
              <mesh key={i} position={[x, y, rd.z]} rotation={[0, 0, 0.21]}>
                <cylinderGeometry args={[0.008, 0.008, rd.len, 4]} />
                <meshBasicMaterial
                  color="#D8EEFF"
                  transparent
                  opacity={0.48 * rainFactor}
                  depthWrite={false}
                />
              </mesh>
            );
          })}
        </group>
      )}
    </group>
  );
};
