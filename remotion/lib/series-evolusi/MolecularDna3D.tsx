import React, { useMemo } from 'react';
import * as THREE from 'three';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { EVOLUTION_TOKENS } from './tokens';

export interface DnaDoubleHelix3DProps {
  /** Continuous deterministic Y-axis rotation in radians */
  rotationY?: number;
  /** Number of base-pair rungs along the vertical span */
  rungCount?: number;
  helixRadius?: number;
  pitchHeight?: number;
  /** Optional 0..1 gene switch dimming progress on central rungs (`0 = active gold glow`, `1 = switched OFF!`) */
  geneSwitchOffProgress?: number;
}

/**
 * 1:1 Blender-Grade Smooth-Tube Ball-and-Stick 3D Double-Helix DNA (`DnaDoubleHelix3D`)
 * Forensic match to `ref_07_dna.png` ("tertulis di DNA"):
 * - Silky continuous curved `CatmullRomCurve3` `TubeGeometry` backbones (NOT faceted segments!)
 * - Glossy clearcoat `MeshPhysicalMaterial` catching PMREM studio HDRI warm-left / cyan-right reflections
 * - Spherical phosphate nodes + split base-pair half-rungs across a genuine central hydrogen-bond gap!
 * - Real soft self-shadowing (`castShadow` + `receiveShadow`)!
 */
export const DnaDoubleHelix3D: React.FC<DnaDoubleHelix3DProps> = ({
  rotationY = 0,
  rungCount = 17,
  helixRadius = 0.56,
  pitchHeight = 3.55,
  geneSwitchOffProgress,
}) => {
  const d = EVOLUTION_TOKENS.instruments.dna;

  const { rungs, tubeGeoA, tubeGeoB } = useMemo(() => {
    const rungColors: Array<[string, string]> = [
      [d.rungCream, d.rungTeal], // A - T
      [d.rungCoral, d.rungGold], // C - G
      [d.rungTeal, d.rungCream], // T - A
      [d.rungGold, d.rungCoral], // G - C
    ];

    const nodesA: THREE.Vector3[] = [];
    const nodesB: THREE.Vector3[] = [];
    const builtRungs: Array<{
      posA: THREE.Vector3;
      posB: THREE.Vector3;
      midA: THREE.Vector3;
      midB: THREE.Vector3;
      quat: THREE.Quaternion;
      halfLen: number;
      colA: string;
      colB: string;
      nodeAccentA: string;
      nodeAccentB: string;
    }> = [];

    for (let i = 0; i < rungCount; i++) {
      const u = i / (rungCount - 1) - 0.5;
      const y = u * pitchHeight;
      const theta = i * 0.56;

      const pA = new THREE.Vector3(
        Math.cos(theta) * helixRadius,
        y,
        Math.sin(theta) * helixRadius,
      );
      const pB = new THREE.Vector3(
        Math.cos(theta + 2.78) * helixRadius,
        y,
        Math.sin(theta + 2.78) * helixRadius,
      );

      nodesA.push(pA);
      nodesB.push(pB);

      const dir = new THREE.Vector3().subVectors(pB, pA);
      const totalDist = dir.length();
      const hBondGap = 0.048;
      const halfLen = (totalDist - hBondGap) * 0.5;
      const dirNorm = dir.clone().normalize();

      const midA = pA.clone().addScaledVector(dirNorm, halfLen * 0.5);
      const midB = pB.clone().addScaledVector(dirNorm, -halfLen * 0.5);
      const quat = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        dirNorm,
      );

      const [colA, colB] = rungColors[i % rungColors.length];
      builtRungs.push({
        posA: pA,
        posB: pB,
        midA,
        midB,
        quat,
        halfLen,
        colA,
        colB,
        nodeAccentA: i % 3 === 1 ? d.nodeCoral : i % 3 === 2 ? d.nodeCream : d.strandTeal,
        nodeAccentB: i % 3 === 0 ? d.nodeCoral : i % 3 === 2 ? d.nodeCream : d.strandAmber,
      });
    }

    const curveA = new THREE.CatmullRomCurve3(nodesA);
    const curveB = new THREE.CatmullRomCurve3(nodesB);
    const tubeA = new THREE.TubeGeometry(curveA, 96, 0.052, 20, false);
    const tubeB = new THREE.TubeGeometry(curveB, 96, 0.052, 20, false);

    return { rungs: builtRungs, tubeGeoA: tubeA, tubeGeoB: tubeB };
  }, [d, helixRadius, pitchHeight, rungCount]);

  return (
    <group rotation={[0.10, rotationY, -0.16]}>
      {/* Strand A Continuous Smooth Glossy Tube (Turquoise-Teal) */}
      <mesh geometry={tubeGeoA} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={d.strandTeal}
          roughness={0.18}
          metalness={0.05}
          clearcoat={0.85}
          clearcoatRoughness={0.14}
          envMapIntensity={1.35}
        />
      </mesh>

      {/* Strand B Continuous Smooth Glossy Tube (Warm Amber-Gold) */}
      <mesh geometry={tubeGeoB} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={d.strandAmber}
          roughness={0.18}
          metalness={0.05}
          clearcoat={0.85}
          clearcoatRoughness={0.14}
          envMapIntensity={1.35}
        />
      </mesh>

      {/* Glossy Phosphate Collar Spheres + Split Base-Pair Half-Rungs with H-Bond Gap */}
      {rungs.map((r, idx) => {
        const isSwitchRung =
          geneSwitchOffProgress !== undefined && idx >= Math.floor(rungCount * 0.42) && idx <= Math.floor(rungCount * 0.58);
        const switchGlow = isSwitchRung ? Math.max(0, 1 - (geneSwitchOffProgress ?? 0)) : 0;
        const dimmed = isSwitchRung ? (geneSwitchOffProgress ?? 0) : 0;
        return (
          <group key={`rung-${idx}`}>
            <mesh position={r.posA} castShadow receiveShadow>
              <sphereGeometry args={[isSwitchRung ? 0.082 : 0.072, 24, 24]} />
              <meshPhysicalMaterial
                color={dimmed > 0.65 ? '#354954' : r.nodeAccentA}
                emissive={isSwitchRung ? '#FFB830' : '#000000'}
                emissiveIntensity={switchGlow * 1.15}
                roughness={0.16}
                metalness={0.06}
                clearcoat={0.9}
                clearcoatRoughness={0.12}
                envMapIntensity={1.4}
              />
            </mesh>
            <mesh position={r.posB} castShadow receiveShadow>
              <sphereGeometry args={[isSwitchRung ? 0.082 : 0.072, 24, 24]} />
              <meshPhysicalMaterial
                color={dimmed > 0.65 ? '#354954' : r.nodeAccentB}
                emissive={isSwitchRung ? '#FFB830' : '#000000'}
                emissiveIntensity={switchGlow * 1.15}
                roughness={0.16}
                metalness={0.06}
                clearcoat={0.9}
                clearcoatRoughness={0.12}
                envMapIntensity={1.4}
              />
            </mesh>

            <mesh position={r.midA} quaternion={r.quat} castShadow receiveShadow>
              <cylinderGeometry args={[0.018, 0.018, r.halfLen, 14]} />
              <meshPhysicalMaterial
                color={dimmed > 0.65 ? '#3E525E' : r.colA}
                emissive={isSwitchRung ? '#FFBE3D' : '#000000'}
                emissiveIntensity={switchGlow * 0.95}
                roughness={0.22}
                clearcoat={0.65}
                clearcoatRoughness={0.18}
              />
            </mesh>
            <mesh position={r.midB} quaternion={r.quat} castShadow receiveShadow>
              <cylinderGeometry args={[0.018, 0.018, r.halfLen, 14]} />
              <meshPhysicalMaterial
                color={dimmed > 0.65 ? '#3E525E' : r.colB}
                emissive={isSwitchRung ? '#FFBE3D' : '#000000'}
                emissiveIntensity={switchGlow * 0.95}
                roughness={0.22}
                clearcoat={0.65}
                clearcoatRoughness={0.18}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

/**
 * Rich Depth-of-Field Split Warm-Amber / Deep-Teal Bokeh Backdrop + Floating Optical `A, T, C, G` Letters
 * Forensic match to `ref_07_dna.png`!
 */
export const MolecularDnaBackdropAndLetters: React.FC<{
  showBackdrop?: boolean;
  showLetters?: boolean;
}> = ({ showBackdrop = true, showLetters = true }) => {
  const frame = useCurrentFrame();
  const { typography, instruments } = EVOLUTION_TOKENS;
  const d = instruments.dna;

  const bokehOrbs = [
    { x: 14, y: 22, r: 220, col: 'rgba(255, 168, 52, 0.42)', sp: 0.025 },
    { x: 24, y: 66, r: 260, col: 'rgba(222, 120, 22, 0.44)', sp: -0.02 },
    { x: 84, y: 26, r: 240, col: 'rgba(24, 152, 188, 0.42)', sp: 0.03 },
    { x: 78, y: 72, r: 210, col: 'rgba(18, 120, 158, 0.40)', sp: -0.025 },
    { x: 48, y: 46, r: 170, col: 'rgba(255, 206, 124, 0.22)', sp: 0.02 },
  ];

  const letters = [
    { char: 'T', x: 38, y: 10, size: 78, blur: 1.6, color: '#FBE0C4', speed: 0.055 },
    { char: 'A', x: 26, y: 24, size: 64, blur: 0.6, color: '#FFF7EC', speed: -0.045 },
    { char: 'G', x: 85, y: 30, size: 98, blur: 1.4, color: '#C8F5FF', speed: 0.06 },
    { char: 'C', x: 74, y: 58, size: 142, blur: 3.6, color: '#FFFFFF', speed: -0.07 },
    { char: 'T', x: 84, y: 76, size: 76, blur: 2.2, color: '#FFCB88', speed: 0.05 },
    { char: 'G', x: 14, y: 84, size: 88, blur: 2.8, color: '#A8EEFA', speed: -0.055 },
  ];

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', overflow: 'hidden' }}>
      {showBackdrop && (
        <>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(108deg, ${d.bgWarmLeft} 0%, #7C4212 38%, #28414C 68%, ${d.bgDeepRight} 88%, #071E30 100%)`,
            }}
          />
          {bokehOrbs.map((b, i) => {
            const ox = Math.sin(frame * b.sp + i * 1.8) * 28;
            const oy = Math.cos(frame * b.sp * 0.8 + i * 2.1) * 22;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${b.x}%`,
                  top: `${b.y}%`,
                  width: b.r * 2,
                  height: b.r * 2,
                  transform: `translate(calc(-50% + ${ox.toFixed(1)}px), calc(-50% + ${oy.toFixed(1)}px))`,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${b.col} 0%, rgba(0,0,0,0) 72%)`,
                  filter: 'blur(18px)',
                }}
              />
            );
          })}
        </>
      )}

      {showLetters &&
        letters.map((item, idx) => {
          const dy = Math.sin(frame * item.speed + idx * 1.7) * 18;
          const dx = Math.cos(frame * item.speed * 0.8 + idx) * 10;
          return (
            <div
              key={idx}
              style={{
                position: 'absolute',
                left: `${item.x}%`,
                top: `${item.y}%`,
                transform: `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`,
                fontFamily: typography.fontFamily,
                fontSize: item.size,
                fontWeight: 600,
                color: item.color,
                opacity: 0.88,
                filter: `blur(${item.blur}px)`,
                textShadow: '0 0 28px rgba(255,255,255,0.28)',
              }}
            >
              {item.char}
            </div>
          );
        })}
    </AbsoluteFill>
  );
};
