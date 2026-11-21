import React, { useMemo } from "react";
import * as THREE from "three";

export interface CableProps {
  start?: [number, number, number];
  end?: [number, number, number];
  sag?: number;
  isSnapped?: boolean;
  snapProgress?: number; // 0..1 animation after snap
  color?: string;
  emissive?: string;
  radius?: number;
  segments?: number;
  drawFraction?: number; // 0..1 progressive reveal (for Shot 25 yellow andongan highlight!)
}

export const CableCatenary: React.FC<CableProps> = ({
  start = [-5, 6, 0],
  end = [5, 6, 0],
  sag = 0.5,
  isSnapped = false,
  snapProgress = 0.5,
  color = "#1A1C20",
  emissive = "#000000",
  radius = 0.022,
  segments = 36,
  drawFraction = 1.0,
}) => {
  const { leftGeo, rightGeo, fullGeo } = useMemo(() => {
    if (isSnapped) {
      // Realistic two-piece whip-down snap! (Shot 24)
      const p = Math.min(1, Math.max(0.05, snapProgress));
      const drop = p * 2.6;
      const swing = Math.sin(p * 10) * 0.22 * (1 - p * 0.5);
      const midX = (start[0] + end[0]) / 2;

      const ptsL: THREE.Vector3[] = [];
      const ptsR: THREE.Vector3[] = [];
      const half = 16;
      for (let i = 0; i <= half; i++) {
        const t = i / half;
        // Left snapped half falls toward left pole
        const lx = start[0] + (midX - start[0]) * t * (1 - p * 0.45) + swing * t;
        const ly = start[1] - drop * t * t;
        ptsL.push(new THREE.Vector3(lx, ly, start[2]));

        // Right snapped half falls toward right pole
        const rx = end[0] - (end[0] - midX) * t * (1 - p * 0.45) - swing * t;
        const ry = end[1] - drop * t * t;
        ptsR.push(new THREE.Vector3(rx, ry, end[2]));
      }
      return {
        leftGeo: new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ptsL), half, radius, 8, false),
        rightGeo: new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ptsR), half, radius, 8, false),
        fullGeo: null,
      };
    }

    const maxT = Math.max(0.05, Math.min(1, drawFraction));
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * maxT;
      const x = start[0] + (end[0] - start[0]) * t;
      const linearY = start[1] + (end[1] - start[1]) * t;
      const dip = 4 * sag * t * (1 - t);
      const y = linearY - dip;
      const z = start[2] + (end[2] - start[2]) * t;
      points.push(new THREE.Vector3(x, y, z));
    }
    return {
      leftGeo: null,
      rightGeo: null,
      fullGeo: new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), segments, radius, 8, false),
    };
  }, [start, end, sag, isSnapped, snapProgress, radius, segments, drawFraction]);

  if (isSnapped && leftGeo && rightGeo) {
    return (
      <group>
        <mesh geometry={leftGeo}>
          <meshStandardMaterial color={color} roughness={0.5} />
        </mesh>
        <mesh geometry={rightGeo}>
          <meshStandardMaterial color={color} roughness={0.5} />
        </mesh>
      </group>
    );
  }

  return fullGeo ? (
    <mesh geometry={fullGeo}>
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={emissive !== "#000000" ? 1.2 : 0}
        roughness={0.45}
      />
    </mesh>
  ) : null;
};

/**
 * Multi-Conductor 3-Phase Overhead Bundle
 */
export interface CableBundleProps {
  leftPoleX?: number;
  rightPoleX?: number;
  poleTopY?: number;
  sag?: number;
}

export const CableBundle: React.FC<CableBundleProps> = ({
  leftPoleX = -5.5,
  rightPoleX = 5.5,
  poleTopY = 8.4,
  sag = 0.55,
}) => {
  return (
    <group>
      <CableCatenary start={[leftPoleX, poleTopY, -0.35]} end={[rightPoleX, poleTopY, -0.35]} sag={sag} radius={0.02} />
      <CableCatenary start={[leftPoleX, poleTopY + 0.05, 0]} end={[rightPoleX, poleTopY + 0.05, 0]} sag={sag + 0.05} radius={0.022} />
      <CableCatenary start={[leftPoleX, poleTopY, 0.35]} end={[rightPoleX, poleTopY, 0.35]} sag={sag} radius={0.02} />
    </group>
  );
};

/**
 * Shot 34 Animated Power-Flow Path Visualization:
 * 1) Glowing Orange 20.000 V line flows from top cable down into transformer primary bushings
 * 2) Glowing Mint-Green 220 V line flows out of transformer across to the village house!
 */
export const PowerFlowLines3D: React.FC<{ progress: number }> = ({ progress }) => {
  // Phase 1 (0..0.48): Orange 20.000V line enters transformer
  const orangeFrac = Math.max(0.02, Math.min(1, progress / 0.45));
  // Phase 2 (0.5..1.0): Green 220V line exits transformer to house
  const greenFrac = Math.max(0, Math.min(1, (progress - 0.5) / 0.42));

  const orangeGeo = useMemo(() => {
    const pts = [
      new THREE.Vector3(3.2, 7.05, 0.12),
      new THREE.Vector3(0.0, 7.05, 0.12),
      new THREE.Vector3(0.42, 5.95, 0.18),
    ];
    const fullCurve = new THREE.CatmullRomCurve3(pts);
    const sampled = fullCurve.getPoints(30).slice(0, Math.max(2, Math.floor(orangeFrac * 30)));
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(sampled), 24, 0.065, 8, false);
  }, [orangeFrac]);

  const greenGeo = useMemo(() => {
    if (greenFrac <= 0.02) return null;
    const pts = [
      new THREE.Vector3(0.42, 5.25, 0.18),
      new THREE.Vector3(-0.75, 4.15, -1.6),
      new THREE.Vector3(-2.1, 3.1, -3.9),
    ];
    const fullCurve = new THREE.CatmullRomCurve3(pts);
    const sampled = fullCurve.getPoints(30).slice(0, Math.max(2, Math.floor(greenFrac * 30)));
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(sampled), 24, 0.065, 8, false);
  }, [greenFrac]);

  return (
    <group>
      <mesh geometry={orangeGeo}>
        <meshBasicMaterial color="#FF6D1F" toneMapped={false} />
      </mesh>
      {greenGeo && (
        <mesh geometry={greenGeo}>
          <meshBasicMaterial color="#4CE87A" toneMapped={false} />
        </mesh>
      )}
    </group>
  );
};
