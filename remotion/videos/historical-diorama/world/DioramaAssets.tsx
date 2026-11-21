import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

export const LowPolyShip: React.FC<{ progress?: number }> = () => {
  const meshRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      // Gentle ship bobbing in water
      const t = clock.getElapsedTime();
      meshRef.current.position.y = Math.sin(t * 2) * 0.08;
      meshRef.current.rotation.z = Math.sin(t * 1.5) * 0.04;
      meshRef.current.rotation.x = Math.cos(t * 1.2) * 0.03;
    }
  });

  return (
    <group ref={meshRef} position={[0, 0.4, 0]}>
      {/* Hull - Dark Brown Wood / Iron */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[4.2, 0.8, 1.4]} />
        <meshStandardMaterial color="#4A3427" roughness={0.7} />
      </mesh>

      {/* Cabin Deck - White/Cream */}
      <mesh position={[-0.2, 0.7, 0]}>
        <boxGeometry args={[2.4, 0.6, 1.0]} />
        <meshStandardMaterial color="#F4EFE6" roughness={0.5} />
      </mesh>

      {/* Steam Funnel (Cerobong Asap) */}
      <mesh position={[0.2, 1.3, 0]}>
        <cylinderGeometry args={[0.22, 0.25, 0.9, 12]} />
        <meshStandardMaterial color="#A33526" roughness={0.4} />
      </mesh>

      {/* Mast / Tiang Kapal */}
      <mesh position={[-1.2, 1.6, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 1.8, 8]} />
        <meshStandardMaterial color="#221C18" />
      </mesh>
    </group>
  );
};

export const LowPolyPedati: React.FC = () => {
  return (
    <group position={[0, 0.35, 0]}>
      {/* Gerobak Box */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[2.2, 0.6, 1.2]} />
        <meshStandardMaterial color="#825C3E" roughness={0.8} />
      </mesh>
      {/* Roda Kiri & Kanan */}
      <mesh position={[0.4, 0.25, 0.7]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.45, 0.45, 0.12, 16]} />
        <meshStandardMaterial color="#3D2B1D" />
      </mesh>
      <mesh position={[0.4, 0.25, -0.7]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.45, 0.45, 0.12, 16]} />
        <meshStandardMaterial color="#3D2B1D" />
      </mesh>
    </group>
  );
};

export const LowPolyPodium: React.FC = () => {
  return (
    <group position={[0, 0.2, 0]}>
      {/* Stage Base */}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[3.8, 0.4, 2.8]} />
        <meshStandardMaterial color="#8C3A27" roughness={0.7} />
      </mesh>
      {/* Wooden Lectern */}
      <mesh position={[0, 0.85, 0.5]}>
        <boxGeometry args={[0.9, 0.9, 0.6]} />
        <meshStandardMaterial color="#4A2E1B" roughness={0.6} />
      </mesh>
      {/* Microphone */}
      <mesh position={[0, 1.45, 0.5]}>
        <cylinderGeometry args={[0.03, 0.03, 0.35, 8]} />
        <meshStandardMaterial color="#C0C0C0" metalness={0.7} />
      </mesh>
      {/* Green Banner Backdrop */}
      <mesh position={[0, 1.2, -1.0]}>
        <boxGeometry args={[3.2, 1.6, 0.08]} />
        <meshStandardMaterial color="#1B6B3A" roughness={0.5} />
      </mesh>
      {/* Golden Sun Emblem on Backdrop */}
      <mesh position={[0, 1.35, -0.93]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.08, 16]} />
        <meshStandardMaterial color="#F2BD44" metalness={0.3} roughness={0.3} />
      </mesh>
    </group>
  );
};

export const LowPolySchool: React.FC = () => {
  return (
    <group position={[0, 0.2, 0]}>
      {/* Main Building Body */}
      <mesh position={[0, 0.9, 0]}>
        <boxGeometry args={[3.8, 1.4, 2.4]} />
        <meshStandardMaterial color="#E8DEC8" roughness={0.8} />
      </mesh>
      {/* Traditional Pitched Roof */}
      <mesh position={[0, 2.0, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[2.8, 1.1, 4]} />
        <meshStandardMaterial color="#8A3D2D" roughness={0.6} />
      </mesh>
      {/* Pillars */}
      {[-1.4, -0.5, 0.5, 1.4].map((px, idx) => (
        <mesh key={idx} position={[px, 0.7, 1.25]}>
          <cylinderGeometry args={[0.08, 0.08, 1.4, 8]} />
          <meshStandardMaterial color="#FFFBF0" />
        </mesh>
      ))}
      {/* Front Steps */}
      <mesh position={[0, 0.1, 1.4]}>
        <boxGeometry args={[2.2, 0.2, 0.6]} />
        <meshStandardMaterial color="#C4B8A5" />
      </mesh>
    </group>
  );
};

export const LowPolyDocument: React.FC = () => {
  return (
    <group position={[0, 0.4, 0]}>
      {/* Wooden Desk */}
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[3.0, 0.7, 2.0]} />
        <meshStandardMaterial color="#5A3825" roughness={0.7} />
      </mesh>
      {/* Parchment Document */}
      <mesh position={[0, 0.73, 0]}>
        <boxGeometry args={[1.6, 0.04, 1.2]} />
        <meshStandardMaterial color="#FAF3E0" roughness={0.9} />
      </mesh>
      {/* Red Wax Seal */}
      <mesh position={[0.4, 0.76, 0.2]}>
        <cylinderGeometry args={[0.18, 0.18, 0.04, 16]} />
        <meshStandardMaterial color="#B83A2E" roughness={0.4} />
      </mesh>
      {/* Inkpot & Quill */}
      <mesh position={[-0.7, 0.8, -0.4]}>
        <cylinderGeometry args={[0.12, 0.14, 0.18, 12]} />
        <meshStandardMaterial color="#1A1A1A" metalness={0.6} />
      </mesh>
    </group>
  );
};

export const LowPolyEmblem: React.FC = () => {
  return (
    <group position={[0, 0.8, 0]}>
      {/* Pedestal */}
      <mesh position={[0, -0.3, 0]}>
        <cylinderGeometry args={[1.2, 1.4, 0.6, 24]} />
        <meshStandardMaterial color="#3D3028" roughness={0.6} />
      </mesh>
      {/* IPM Sun Disc with Ray Spokes */}
      <mesh position={[0, 0.9, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.9, 0.9, 0.15, 24]} />
        <meshStandardMaterial color="#F2BD44" metalness={0.5} roughness={0.2} />
      </mesh>
      {/* Center Pen Nib & Book */}
      <mesh position={[0, 0.9, 0.1]}>
        <boxGeometry args={[0.6, 0.8, 0.1]} />
        <meshStandardMaterial color="#1B6B3A" />
      </mesh>
    </group>
  );
};
