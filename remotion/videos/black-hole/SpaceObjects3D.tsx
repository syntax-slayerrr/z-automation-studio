import React, { useMemo } from 'react';
import * as THREE from 'three';

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));
const lerp = (a: number, b: number, t: number): number => a + (b - a) * clamp(t, 0, 1);

const hash01 = (s: number): number => {
  const x = Math.sin(s * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/** Pure-code 64x64 soft optical Gaussian glow sprite so Three.js Points render as silky bokeh orbs, NEVER hard squares! */
export function createStarGlowTexture(): THREE.DataTexture {
  const S = 64;
  const data = new Uint8Array(S * S * 4);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const dx = (x + 0.5) / S - 0.5;
      const dy = (y + 0.5) / S - 0.5;
      const r = Math.sqrt(dx * dx + dy * dy) * 2.0; // 0 at center, 1 at edge
      const core = Math.exp(-r * r * 14.0);
      const halo = Math.exp(-r * r * 3.6) * 0.55;
      const edge = Math.max(0, 1 - r);
      const a = Math.min(1, (core + halo) * edge);
      const idx = (y * S + x) * 4;
      data[idx] = 255;
      data[idx + 1] = 255;
      data[idx + 2] = 255;
      data[idx + 3] = Math.round(a * 255);
    }
  }
  const tex = new THREE.DataTexture(data, S, S, THREE.RGBAFormat);
  tex.needsUpdate = true;
  return tex;
}

export interface Astronaut3DProps {
  f: number;
  position: [number, number, number];
  rotation: [number, number, number];
  scale?: number;
  redshift?: number; // 0 = sunlit white spacesuit, 1 = deep gravitational crimson redshift
  tidalStretch?: number; // 0 = normal, 1 = extreme non-uniform 1/r^3 tidal spaghettification!
  ghostMirror?: boolean; // translucent golden photon-sphere reflection
  opacity?: number;
  freezePhase?: number; // 0 = normal gentle zero-G motion, 1 = frozen time-dilated limbs
}

/**
 * 100% Pure-Code 3D PBR Articulated NASA/Interstellar Astronaut in Three.js.
 * Responds dynamically to real 3D PointLights/DirectionalLights (motivated amber accretion key light,
 * deep shadows on back side, specular gold-chrome visor, ribbed joints, PLSS backpack & curved 3D tether).
 */
export const Astronaut3D: React.FC<Astronaut3DProps> = ({
  f,
  position,
  rotation,
  scale = 1,
  redshift = 0,
  tidalStretch = 0,
  ghostMirror = false,
  opacity = 1,
  freezePhase = 0,
}) => {
  const { tetherGeom, hoseLGeom, hoseRGeom } = useMemo(() => {
    const tetherCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.22, 0.14, -0.22),
      new THREE.Vector3(-0.56, 0.28, -0.34),
      new THREE.Vector3(-0.92, 0.56, -0.22),
      new THREE.Vector3(-1.18, 0.94, -0.38),
    ]);
    const hoseL = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.14, 0.04, 0.22),
      new THREE.Vector3(-0.26, -0.06, 0.12),
      new THREE.Vector3(-0.24, 0.06, -0.18),
    ]);
    const hoseR = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.14, 0.04, 0.22),
      new THREE.Vector3(0.26, -0.06, 0.12),
      new THREE.Vector3(0.24, 0.06, -0.18),
    ]);
    return {
      tetherGeom: new THREE.TubeGeometry(tetherCurve, 28, 0.011, 8, false),
      hoseLGeom: new THREE.TubeGeometry(hoseL, 14, 0.018, 8, false),
      hoseRGeom: new THREE.TubeGeometry(hoseR, 14, 0.018, 8, false),
    };
  }, []);

  // Compute physically-motivated PBR material colors shifted cleanly under gravitational redshift!
  // (All hooks unconditionally called above any early return per React Rules of Hooks!)
  const suitColor = useMemo(() => {
    if (ghostMirror) return new THREE.Color('#ffd382');
    return new THREE.Color('#e8e4dc').lerp(new THREE.Color('#961b12'), clamp(redshift, 0, 1));
  }, [redshift, ghostMirror]);

  const suitEmissive = useMemo(() => {
    if (ghostMirror) return new THREE.Color('#ffaa38');
    return new THREE.Color('#000000').lerp(new THREE.Color('#6b1108'), clamp(redshift, 0, 1));
  }, [redshift, ghostMirror]);

  const darkTrimColor = useMemo(() => {
    if (ghostMirror) return new THREE.Color('#d88c38');
    return new THREE.Color('#343844').lerp(new THREE.Color('#420d0a'), clamp(redshift, 0, 1));
  }, [redshift, ghostMirror]);

  const visorColor = useMemo(() => {
    if (ghostMirror) return new THREE.Color('#ffe099');
    return new THREE.Color('#d89c3c').lerp(new THREE.Color('#a42014'), clamp(redshift, 0, 1));
  }, [redshift, ghostMirror]);

  if (opacity <= 0.01) return null;

  const matProps = {
    transparent: opacity < 0.99 || ghostMirror,
    opacity: ghostMirror ? opacity * 0.56 : opacity,
    blending: ghostMirror ? THREE.AdditiveBlending : THREE.NormalBlending,
    depthWrite: !ghostMirror && opacity > 0.95,
  };

  // Gentle organic zero-G limb breathing (slows down to dead stop when freezePhase -> 1!)
  const tAnim = f * (1 - freezePhase * 0.92);
  const armWaveL = Math.sin(tAnim * 0.045) * 0.08 * (1 - freezePhase);
  const armWaveR = Math.cos(tAnim * 0.042 + 0.8) * 0.09 * (1 - freezePhase);
  const legWaveL = Math.sin(tAnim * 0.038 + 0.5) * 0.07 * (1 - freezePhase);
  const legWaveR = Math.cos(tAnim * 0.036 + 1.4) * 0.07 * (1 - freezePhase);

  // Non-uniform 1/r^3 tidal spaghettification (feet/legs elongate dramatically faster than torso/head!)
  const ts = clamp(tidalStretch, 0, 1);
  const torsoStretchY = lerp(1.0, 1.92, ts);
  const torsoPinchXZ = lerp(1.0, 0.48, ts);
  const legStretchY = lerp(1.0, 2.45, ts);
  const legPinchXZ = lerp(1.0, 0.40, ts);

  // Reusable sculpted NASA pressure glove (palm + opposable thumb + curled fingers — never a featureless dark oval!)
  const renderGlove = (side: -1 | 1) => (
    <group position={[0, -0.31, 0.01]}>
      {/* Wrist Disconnect Ring + Pressure Cuff */}
      <mesh position={[0, 0.055, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.068, 0.014, 10, 18]} />
        <meshStandardMaterial color="#b4bac8" metalness={0.86} roughness={0.22} {...matProps} />
      </mesh>
      {/* Sculpted Thermal Palm */}
      <mesh position={[0, -0.02, 0]} scale={[1.0, 1.15, 0.62]}>
        <boxGeometry args={[0.095, 0.095, 0.085]} />
        <meshStandardMaterial color={darkTrimColor} roughness={0.55} metalness={0.22} {...matProps} />
      </mesh>
      {/* Opposable Thumb pointing cleanly inward/forward */}
      <mesh position={[-side * 0.056, -0.012, 0.025]} rotation={[0.25, 0, -side * 0.58]}>
        <capsuleGeometry args={[0.018, 0.044, 6, 10]} />
        <meshStandardMaterial color={darkTrimColor} roughness={0.55} metalness={0.20} {...matProps} />
      </mesh>
      {/* 4 Articulated Gloved Fingers gently curled in zero-G */}
      {[-0.032, -0.011, 0.011, 0.032].map((fx, fi) => {
        const len = fi === 1 || fi === 2 ? 0.054 : 0.044;
        return (
          <mesh key={fi} position={[fx, -0.085, 0.016]} rotation={[-0.36, 0, fx * 1.4]}>
            <capsuleGeometry args={[0.0125, len, 6, 8]} />
            <meshStandardMaterial color={darkTrimColor} roughness={0.55} metalness={0.20} {...matProps} />
          </mesh>
        );
      })}
    </group>
  );

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <group scale={[torsoPinchXZ, torsoStretchY, torsoPinchXZ]}>
        {/* 1. HELMET + BRASS NECK COLLAR + GOLD-CHROME REFLECTIVE VISOR */}
        <group position={[0, 0.66, 0]}>
          {/* Titanium/Brass Neck Disconnect Ring */}
          <mesh position={[0, -0.17, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.165, 0.026, 12, 28]} />
            <meshStandardMaterial color="#b89862" metalness={0.88} roughness={0.28} {...matProps} />
          </mesh>
          {/* Outer Ceramic Pressure Helmet Shell */}
          <mesh>
            <sphereGeometry args={[0.22, 28, 24]} />
            <meshStandardMaterial
              color={suitColor}
              emissive={suitEmissive}
              emissiveIntensity={ghostMirror ? 0.65 : redshift * 0.45}
              roughness={0.38}
              metalness={0.12}
              {...matProps}
            />
          </mesh>
          {/* Reflective Gold-Chrome Dome Visor (catches dynamic amber specular reflection!) */}
          <mesh position={[0, 0.01, 0.065]} scale={[0.92, 0.84, 0.88]}>
            <sphereGeometry args={[0.20, 28, 24]} />
            <meshPhysicalMaterial
              color={visorColor}
              emissive={ghostMirror ? '#ff9b2e' : '#3a1804'}
              emissiveIntensity={ghostMirror ? 0.8 : 0.35 + redshift * 0.4}
              metalness={0.95}
              roughness={0.07}
              clearcoat={1.0}
              clearcoatRoughness={0.05}
              {...matProps}
            />
          </mesh>
          {/* Helmet Top Sunshield & Side Lamp Pods */}
          <mesh position={[0, 0.145, 0.05]} rotation={[-0.25, 0, 0]}>
            <boxGeometry args={[0.22, 0.05, 0.16]} />
            <meshStandardMaterial color={suitColor} roughness={0.5} metalness={0.15} {...matProps} />
          </mesh>
          <mesh position={[-0.215, 0.06, 0.02]}>
            <boxGeometry args={[0.055, 0.085, 0.095]} />
            <meshStandardMaterial color={darkTrimColor} roughness={0.45} metalness={0.4} {...matProps} />
          </mesh>
          <mesh position={[0.215, 0.06, 0.02]}>
            <boxGeometry args={[0.055, 0.085, 0.095]} />
            <meshStandardMaterial color={darkTrimColor} roughness={0.45} metalness={0.4} {...matProps} />
          </mesh>
        </group>

        {/* 2. SCULPTED UPPER TORSO + CHEST CONTROL MODULE (DCM) + OXYGEN HOSES */}
        <mesh position={[0, 0.17, 0]} scale={[1.05, 1.0, 0.78]}>
          <capsuleGeometry args={[0.23, 0.28, 12, 24]} />
          <meshStandardMaterial
            color={suitColor}
            emissive={suitEmissive}
            emissiveIntensity={ghostMirror ? 0.55 : redshift * 0.4}
            roughness={0.72}
            metalness={0.08}
            {...matProps}
          />
        </mesh>
        {/* Waist Harness Belt + Metallic Buckle */}
        <mesh position={[0, -0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.225, 0.032, 10, 24]} />
          <meshStandardMaterial color={darkTrimColor} roughness={0.62} metalness={0.35} {...matProps} />
        </mesh>
        {/* Chest Display & Control Module (DCM) */}
        <group position={[0, 0.22, 0.195]}>
          <mesh>
            <boxGeometry args={[0.22, 0.20, 0.09]} />
            <meshStandardMaterial color={suitColor} roughness={0.48} metalness={0.22} {...matProps} />
          </mesh>
          <mesh position={[0, 0.01, 0.048]}>
            <boxGeometry args={[0.16, 0.12, 0.015]} />
            <meshStandardMaterial color="#1e222c" roughness={0.35} metalness={0.6} {...matProps} />
          </mesh>
          {/* Glowing chest micro-LEDs */}
          <mesh position={[-0.042, 0.03, 0.058]}>
            <sphereGeometry args={[0.014, 10, 10]} />
            <meshBasicMaterial color="#ff9d42" transparent opacity={opacity} />
          </mesh>
          <mesh position={[0.005, 0.03, 0.058]}>
            <sphereGeometry args={[0.014, 10, 10]} />
            <meshBasicMaterial color="#7ae2ff" transparent opacity={opacity} />
          </mesh>
        </group>
        {/* Corrugated Side Oxygen Hoses */}
        <mesh geometry={hoseLGeom}>
          <meshStandardMaterial color={darkTrimColor} roughness={0.55} metalness={0.45} {...matProps} />
        </mesh>
        <mesh geometry={hoseRGeom}>
          <meshStandardMaterial color={darkTrimColor} roughness={0.55} metalness={0.45} {...matProps} />
        </mesh>

        {/* 3. SCULPTED PLSS LIFE-SUPPORT BACKPACK (Visible in 3D & in Photon Sphere Back-of-Head Mirror!) */}
        <group position={[0, 0.23, -0.25]}>
          <mesh>
            <boxGeometry args={[0.38, 0.56, 0.22]} />
            <meshStandardMaterial
              color={suitColor}
              emissive={suitEmissive}
              emissiveIntensity={ghostMirror ? 0.72 : redshift * 0.42}
              roughness={0.58}
              metalness={0.18}
              {...matProps}
            />
          </mesh>
          {/* Crimson NASA-style service stripe across backpack */}
          <mesh position={[0, 0.20, -0.112]}>
            <boxGeometry args={[0.34, 0.038, 0.012]} />
            <meshStandardMaterial color={ghostMirror ? '#ffd888' : '#b83228'} roughness={0.5} {...matProps} />
          </mesh>
          {/* Lower oxygen canister bay */}
          <mesh position={[-0.09, -0.14, -0.10]}>
            <cylinderGeometry args={[0.055, 0.055, 0.26, 14]} />
            <meshStandardMaterial color={darkTrimColor} roughness={0.4} metalness={0.55} {...matProps} />
          </mesh>
          <mesh position={[0.09, -0.14, -0.10]}>
            <cylinderGeometry args={[0.055, 0.055, 0.26, 14]} />
            <meshStandardMaterial color={darkTrimColor} roughness={0.4} metalness={0.55} {...matProps} />
          </mesh>
          {/* Metallic Telemetry Antenna */}
          <mesh position={[-0.14, 0.42, -0.02]} rotation={[0, 0, 0.15]}>
            <cylinderGeometry args={[0.008, 0.012, 0.34, 8]} />
            <meshStandardMaterial color="#c8b896" metalness={0.9} roughness={0.2} {...matProps} />
          </mesh>
        </group>

        {/* Floating Curved 3D Safety Tether */}
        <mesh geometry={tetherGeom}>
          <meshStandardMaterial color="#b4aec4" roughness={0.45} metalness={0.4} {...matProps} />
        </mesh>

        {/* 4. ARTICULATED LEFT ARM (-X side: NEGATIVE rot.z spreads OUTWARD in Three.js right-handed coords!) */}
        <group
          position={[-0.29, 0.35, 0.01]}
          rotation={[-0.22 * (1 - ts * 0.75), 0.14 * (1 - ts), -(0.52 * (1 - ts * 0.74)) + armWaveL]}
        >
          {/* Shoulder Scye Bearing Ring + Rounded Deltoid Cap */}
          <mesh rotation={[0, Math.PI / 2, 0.25]}>
            <torusGeometry args={[0.094, 0.016, 10, 20]} />
            <meshStandardMaterial color={darkTrimColor} metalness={0.45} roughness={0.48} {...matProps} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.092, 16, 14]} />
            <meshStandardMaterial color={suitColor} emissive={suitEmissive} emissiveIntensity={ghostMirror ? 0.55 : redshift * 0.4} roughness={0.68} {...matProps} />
          </mesh>
          {/* Upper Arm */}
          <mesh position={[0, -0.155, 0]}>
            <capsuleGeometry args={[0.078, 0.19, 10, 18]} />
            <meshStandardMaterial color={suitColor} emissive={suitEmissive} emissiveIntensity={ghostMirror ? 0.55 : redshift * 0.4} roughness={0.70} {...matProps} />
          </mesh>
          {/* Ribbed Elbow Joint + Forearm + Sculpted Gloved Hand */}
          <group position={[0, -0.31, 0]} rotation={[-0.58 * (1 - ts * 0.85), 0, 0.24 * (1 - ts * 0.80)]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.074, 0.015, 8, 18]} />
              <meshStandardMaterial color={darkTrimColor} roughness={0.60} metalness={0.32} {...matProps} />
            </mesh>
            <mesh position={[0, -0.135, 0]}>
              <capsuleGeometry args={[0.068, 0.17, 10, 18]} />
              <meshStandardMaterial color={suitColor} emissive={suitEmissive} emissiveIntensity={ghostMirror ? 0.55 : redshift * 0.4} roughness={0.68} {...matProps} />
            </mesh>
            {renderGlove(-1)}
          </group>
        </group>

        {/* 5. ARTICULATED RIGHT ARM (+X side: POSITIVE rot.z reaches OUTWARD & UPWARD toward accretion light!) */}
        <group
          position={[0.29, 0.35, 0.01]}
          rotation={[-0.36 * (1 - ts * 0.78), -0.16 * (1 - ts), 0.72 * (1 - ts * 0.80) + armWaveR]}
        >
          {/* Shoulder Scye Bearing Ring + Rounded Deltoid Cap */}
          <mesh rotation={[0, Math.PI / 2, -0.25]}>
            <torusGeometry args={[0.094, 0.016, 10, 20]} />
            <meshStandardMaterial color={darkTrimColor} metalness={0.45} roughness={0.48} {...matProps} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.092, 16, 14]} />
            <meshStandardMaterial color={suitColor} emissive={suitEmissive} emissiveIntensity={ghostMirror ? 0.55 : redshift * 0.4} roughness={0.68} {...matProps} />
          </mesh>
          {/* Upper Arm */}
          <mesh position={[0, -0.155, 0]}>
            <capsuleGeometry args={[0.078, 0.19, 10, 18]} />
            <meshStandardMaterial color={suitColor} emissive={suitEmissive} emissiveIntensity={ghostMirror ? 0.55 : redshift * 0.4} roughness={0.70} {...matProps} />
          </mesh>
          {/* Ribbed Elbow Joint + Forearm + Sculpted Gloved Hand */}
          <group position={[0, -0.31, 0]} rotation={[-0.52 * (1 - ts * 0.85), 0, -0.20 * (1 - ts * 0.80)]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.074, 0.015, 8, 18]} />
              <meshStandardMaterial color={darkTrimColor} roughness={0.60} metalness={0.32} {...matProps} />
            </mesh>
            <mesh position={[0, -0.135, 0]}>
              <capsuleGeometry args={[0.068, 0.17, 10, 18]} />
              <meshStandardMaterial color={suitColor} emissive={suitEmissive} emissiveIntensity={ghostMirror ? 0.55 : redshift * 0.4} roughness={0.68} {...matProps} />
            </mesh>
            {renderGlove(1)}
          </group>
        </group>

        {/* 6. LOWER PELVIS + ARTICULATED LEGS (Natural outward zero-G stance; stretches cleanly downward in S5!) */}
        <mesh position={[0, -0.12, 0]} scale={[1.0, 0.72, 0.76]}>
          <sphereGeometry args={[0.22, 18, 14]} />
          <meshStandardMaterial color={suitColor} emissive={suitEmissive} emissiveIntensity={ghostMirror ? 0.55 : redshift * 0.4} roughness={0.72} {...matProps} />
        </mesh>

        {/* Left Leg (-X side: NEGATIVE rot.z keeps stance naturally open!) */}
        <group position={[-0.125, -0.22, 0]} rotation={[0.16 * (1 - ts) + legWaveL, 0, -0.09 * (1 - ts)]} scale={[legPinchXZ / torsoPinchXZ, legStretchY / torsoStretchY, legPinchXZ / torsoPinchXZ]}>
          <mesh position={[0, -0.20, 0]}>
            <capsuleGeometry args={[0.096, 0.28, 10, 16]} />
            <meshStandardMaterial color={suitColor} emissive={suitEmissive} emissiveIntensity={ghostMirror ? 0.55 : redshift * 0.4} roughness={0.72} {...matProps} />
          </mesh>
          <group position={[0, -0.42, 0]} rotation={[0.22 * (1 - ts), 0, 0]}>
            {/* Ribbed Knee Flex Joint */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.088, 0.015, 8, 18]} />
              <meshStandardMaterial color={darkTrimColor} roughness={0.62} metalness={0.28} {...matProps} />
            </mesh>
            <mesh position={[0, -0.20, 0]}>
              <capsuleGeometry args={[0.084, 0.28, 10, 16]} />
              <meshStandardMaterial color={suitColor} emissive={suitEmissive} emissiveIntensity={ghostMirror ? 0.55 : redshift * 0.4} roughness={0.72} {...matProps} />
            </mesh>
            {/* Weighted Space Boot + Sole */}
            <mesh position={[0, -0.40, 0.05]}>
              <boxGeometry args={[0.155, 0.125, 0.27]} />
              <meshStandardMaterial color={darkTrimColor} roughness={0.58} metalness={0.25} {...matProps} />
            </mesh>
          </group>
        </group>

        {/* Right Leg (+X side: POSITIVE rot.z keeps stance naturally open, knee gently bent in zero-G!) */}
        <group position={[0.125, -0.22, 0]} rotation={[-0.30 * (1 - ts) + legWaveR, 0, 0.11 * (1 - ts)]} scale={[legPinchXZ / torsoPinchXZ, legStretchY / torsoStretchY, legPinchXZ / torsoPinchXZ]}>
          <mesh position={[0, -0.20, 0]}>
            <capsuleGeometry args={[0.096, 0.28, 10, 16]} />
            <meshStandardMaterial color={suitColor} emissive={suitEmissive} emissiveIntensity={ghostMirror ? 0.55 : redshift * 0.4} roughness={0.72} {...matProps} />
          </mesh>
          <group position={[0, -0.42, 0]} rotation={[0.54 * (1 - ts), 0, 0]}>
            {/* Ribbed Knee Flex Joint */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.088, 0.015, 8, 18]} />
              <meshStandardMaterial color={darkTrimColor} roughness={0.62} metalness={0.28} {...matProps} />
            </mesh>
            <mesh position={[0, -0.20, 0]}>
              <capsuleGeometry args={[0.084, 0.28, 10, 16]} />
              <meshStandardMaterial color={suitColor} emissive={suitEmissive} emissiveIntensity={ghostMirror ? 0.55 : redshift * 0.4} roughness={0.72} {...matProps} />
            </mesh>
            <mesh position={[0, -0.40, 0.05]}>
              <boxGeometry args={[0.155, 0.125, 0.27]} />
              <meshStandardMaterial color={darkTrimColor} roughness={0.58} metalness={0.25} {...matProps} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
};

/**
 * 100% Pure-Code 3D Brushed-Steel Space Mission Chronograph Watch in Three.js (Scene 2 Wrist Time Contrast).
 * Animated crisp 1.000s discrete mechanical ticks synced exactly to real CC0 watch-tick audio!
 */
export const SpaceChronograph3D: React.FC<{
  f: number;
  tickStartFrame: number;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  opacity: number;
}> = ({ f, tickStartFrame, position, rotation, scale, opacity }) => {
  if (opacity <= 0.01) return null;

  // Exact 1.000s crisp mechanical second-hand step synced to CUES.s2_watch!
  const elapsed = Math.max(0, (f - tickStartFrame) / 30);
  const step = Math.floor(elapsed);
  const frac = Math.min(1, (elapsed - step) * 16);
  const secRad = -((step + (1 - Math.pow(1 - frac, 3)) * 0.06) * 6 * Math.PI) / 180;

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Spacesuit Cuff Strap Band */}
      <mesh position={[0, 0, -0.05]} rotation={[0, 0, 0.42]}>
        <boxGeometry args={[0.36, 1.55, 0.04]} />
        <meshStandardMaterial color="#20232b" roughness={0.85} metalness={0.1} transparent opacity={opacity} />
      </mesh>
      {/* Brushed Titanium Watch Case Body (high-contrast silver rim catching amber light!) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.43, 0.41, 0.14, 44]} />
        <meshStandardMaterial color="#d4dae4" emissive="#2a2216" metalness={0.90} roughness={0.20} transparent opacity={opacity} />
      </mesh>
      {/* Crown & Twin Chronograph Pushers */}
      <mesh position={[0.46, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.048, 0.048, 0.085, 16]} />
        <meshStandardMaterial color="#e2e8f2" metalness={0.92} roughness={0.18} transparent opacity={opacity} />
      </mesh>
      <mesh position={[0.39, 0.22, 0]} rotation={[0, 0, Math.PI / 3]}>
        <cylinderGeometry args={[0.030, 0.030, 0.085, 14]} />
        <meshStandardMaterial color="#e2e8f2" metalness={0.92} roughness={0.18} transparent opacity={opacity} />
      </mesh>
      <mesh position={[0.39, -0.22, 0]} rotation={[0, 0, -Math.PI / 3]}>
        <cylinderGeometry args={[0.030, 0.030, 0.085, 14]} />
        <meshStandardMaterial color="#e2e8f2" metalness={0.92} roughness={0.18} transparent opacity={opacity} />
      </mesh>
      {/* Tachymeter Outer Bezel Ring with Subtle Warm Steel Rim */}
      <mesh position={[0, 0, 0.070]}>
        <torusGeometry args={[0.385, 0.036, 14, 44]} />
        <meshStandardMaterial color="#586070" emissive="#2c2418" metalness={0.85} roughness={0.22} transparent opacity={opacity} />
      </mesh>
      {/* Recessed Matte Obsidian Dial Face */}
      <mesh position={[0, 0, 0.056]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.345, 0.345, 0.015, 40]} />
        <meshStandardMaterial color="#0b0d14" roughness={0.85} metalness={0.15} transparent opacity={opacity} />
      </mesh>
      {/* 12 Raised Luminous Baton Hour Indices */}
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        const isMaj = i % 3 === 0;
        return (
          <mesh key={i} position={[Math.sin(a) * 0.285, Math.cos(a) * 0.285, 0.070]} rotation={[0, 0, -a]}>
            <boxGeometry args={[isMaj ? 0.022 : 0.012, isMaj ? 0.062 : 0.042, 0.008]} />
            <meshBasicMaterial color={isMaj ? '#fff6dc' : '#dce6f2'} transparent opacity={opacity * 0.95} />
          </mesh>
        );
      })}
      {/* 3 Subtle Recessed Chronograph Sub-Dials */}
      {[
        [-0.13, 0, 0.068],
        [0.13, 0, 0.068],
        [0, -0.13, 0.068],
      ].map(([sx, sy, sz], idx) => (
        <mesh key={idx} position={[sx, sy, sz]}>
          <torusGeometry args={[0.068, 0.005, 8, 24]} />
          <meshBasicMaterial color="#586476" transparent opacity={opacity * 0.85} />
        </mesh>
      ))}
      {/* Metallic Hour & Minute Hands */}
      <group position={[0, 0, 0.078]} rotation={[0, 0, 0.85]}>
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[0.022, 0.18, 0.006]} />
          <meshStandardMaterial color="#f5f0e2" emissive="#443c2c" metalness={0.7} roughness={0.2} transparent opacity={opacity} />
        </mesh>
      </group>
      <group position={[0, 0, 0.084]} rotation={[0, 0, -0.52]}>
        <mesh position={[0, 0.115, 0]}>
          <boxGeometry args={[0.016, 0.25, 0.006]} />
          <meshStandardMaterial color="#faf6ea" emissive="#443c2c" metalness={0.7} roughness={0.2} transparent opacity={opacity} />
        </mesh>
      </group>
      {/* Crisp Glowing Crimson-Tipped 3D Mechanical Second Hand ticking every 1.000s! */}
      <group position={[0, 0, 0.092]} rotation={[0, 0, secRad]}>
        <mesh position={[0, 0.11, 0]}>
          <boxGeometry args={[0.009, 0.30, 0.005]} />
          <meshBasicMaterial color="#ff5a3c" transparent opacity={opacity} />
        </mesh>
        <mesh position={[0, 0.24, 0.002]}>
          <sphereGeometry args={[0.015, 10, 10]} />
          <meshBasicMaterial color="#fff0c8" transparent opacity={opacity} />
        </mesh>
      </group>
      {/* Center Specular Brass Pin */}
      <mesh position={[0, 0, 0.098]}>
        <sphereGeometry args={[0.022, 12, 12]} />
        <meshStandardMaterial color="#f0c874" metalness={0.95} roughness={0.12} transparent opacity={opacity} />
      </mesh>
    </group>
  );
};

/**
 * 100% Pure-Code 6,000-Star 3D Volumetric Milky Way Spiral Galaxy for Scene 7 (Sagittarius A* Grand Pull-Out).
 * True 3D depth parallax as stars glide past the camera around the live raymarched black hole!
 */
export const MilkyWayGalaxy3D: React.FC<{ f: number; opacity: number; pullProgress: number }> = ({
  f,
  opacity,
  pullProgress,
}) => {
  const geom = useMemo(() => {
    const count = 6000;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const cCore = new THREE.Color('#fff1ce');
    const cAmber = new THREE.Color('#f4a652');
    const cBlue = new THREE.Color('#8ec8ff');
    const cViolet = new THREE.Color('#9a7ee0');

    for (let i = 0; i < count; i++) {
      // Diagonal galactic plane river sweeping from bottom-left to top-right
      const u = (hash01(i * 17.3 + 1.1) - 0.5) * 16.0;
      const spread = (hash01(i * 31.7 + 2.3) + hash01(i * 47.1 + 5.9) - 1.0) * 2.6;
      const depth = (hash01(i * 61.9 + 8.3) - 0.5) * 5.2;
      // Rotate band diagonally ~42 deg
      const ang = 0.72;
      const x = u * Math.cos(ang) - spread * Math.sin(ang);
      const y = u * Math.sin(ang) + spread * Math.cos(ang);
      // Carve clean Event Horizon shadow silhouette exclusion (zero stars bleeding inside pitch-black core!)
      const r2 = x * x + y * y;
      const push = r2 < 5.8 ? 2.46 / Math.sqrt(Math.max(0.05, r2)) : 1.0;

      pos[i * 3] = x * push;
      pos[i * 3 + 1] = y * push;
      pos[i * 3 + 2] = -4.2 + depth;

      const distCore = Math.sqrt(x * x + y * y) / 7.5;
      let picked = cCore.clone().lerp(cAmber, clamp(distCore * 1.1, 0, 1));
      if (i % 5 === 0) picked = picked.lerp(cBlue, 0.55);
      if (i % 9 === 0) picked = picked.lerp(cViolet, 0.5);
      const bright = 0.45 + 0.55 * hash01(i * 73.1);
      col[i * 3] = picked.r * bright;
      col[i * 3 + 1] = picked.g * bright;
      col[i * 3 + 2] = picked.b * bright;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g;
  }, []);

  const starTex = useMemo(() => createStarGlowTexture(), []);

  if (opacity <= 0.01) return null;

  const holeScale = lerp(1.62, 1.0, pullProgress);

  return (
    <group position={[0, 0, lerp(-1.8, 0.4, pullProgress)]} scale={[holeScale, holeScale, 1]} rotation={[0, 0, f * 0.0008]}>
      <points geometry={geom}>
        <pointsMaterial
          size={0.14}
          map={starTex}
          vertexColors
          transparent
          opacity={opacity * 0.88}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
    </group>
  );
};
