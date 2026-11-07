import React, { useEffect, useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';

export interface HermesOpenClaw3DStageProps {
  /** Exact time in seconds (frame / fps) */
  timeSec: number;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}

interface SynapsePacket {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  baseOffset: number;
  speed: number;
}

interface SatelliteNode {
  mesh: THREE.Mesh;
  home: THREE.Vector3;
  rotSpeed: THREE.Vector3;
  baseScale: number;
  phase: number;
}

interface SceneHandles {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  rootGroup: THREE.Group;
  hermesGroup: THREE.Group;
  hermesHead: THREE.Group;
  hermesLeftPupil: THREE.Group;
  hermesRightPupil: THREE.Group;
  hermesGlowMat: THREE.MeshStandardMaterial;
  orbitRing1: THREE.Mesh;
  orbitRing2: THREE.Mesh;
  orbitRing3: THREE.Mesh;
  openClawGroup: THREE.Group;
  openClawBodyPivot: THREE.Group;
  clawPupils: THREE.Group[];
  cyanEyeMat: THREE.MeshStandardMaterial;
  antennaTipMat: THREE.MeshStandardMaterial;
  clawAntennae: { pivot: THREE.Group; dir: number }[];
  clawArms: {
    group: THREE.Group;
    upperJaw: THREE.Mesh;
    lowerJaw: THREE.Mesh;
    dir: number;
  }[];
  clawLegs: { mesh: THREE.Mesh; dir: number }[];
  shockwaveRing1: THREE.Mesh;
  shockwaveMat1: THREE.MeshBasicMaterial;
  shockwaveRing2: THREE.Mesh;
  shockwaveMat2: THREE.MeshBasicMaterial;
  synapseCurve: THREE.CubicBezierCurve3;
  synapseTubeMat: THREE.MeshBasicMaterial;
  synapsePackets: SynapsePacket[];
  heroPulseOrb: THREE.Mesh;
  heroPulseMat: THREE.MeshBasicMaterial;
  satellites: SatelliteNode[];
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function smootherstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function createHermesEye(
  parent: THREE.Group,
  xOffset: number,
  darkMat: THREE.Material,
  whiteMat: THREE.Material
): THREE.Group {
  const eyeGroup = new THREE.Group();
  eyeGroup.position.set(xOffset, 0, 0);
  parent.add(eyeGroup);

  // Bold Anime Upper Eyelash Arch
  const lashCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.16, 0.05, 0.04),
    new THREE.Vector3(-0.05, 0.13, 0.08),
    new THREE.Vector3(0.06, 0.12, 0.08),
    new THREE.Vector3(0.17, 0.04, 0.03),
  ]);
  const lash = new THREE.Mesh(
    new THREE.TubeGeometry(lashCurve, 20, 0.026, 8, false),
    darkMat
  );
  eyeGroup.add(lash);

  // Confident Eyebrow
  const browCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.17, 0.22, 0.03),
    new THREE.Vector3(0.0, 0.26, 0.07),
    new THREE.Vector3(0.17, 0.20, 0.03),
  ]);
  const brow = new THREE.Mesh(
    new THREE.TubeGeometry(browCurve, 16, 0.016, 8, false),
    darkMat
  );
  eyeGroup.add(brow);

  // Crisp White Sclera
  const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.135, 24, 24), whiteMat);
  sclera.scale.set(1.18, 0.95, 0.45);
  eyeGroup.add(sclera);

  // Iris + Specular Catchlights
  const pupilGroup = new THREE.Group();
  pupilGroup.position.set(0, -0.01, 0.062);
  eyeGroup.add(pupilGroup);

  const iris = new THREE.Mesh(new THREE.CircleGeometry(0.086, 24), darkMat);
  pupilGroup.add(iris);

  const cyanRing = new THREE.Mesh(
    new THREE.RingGeometry(0.048, 0.072, 24),
    new THREE.MeshBasicMaterial({ color: '#00F5D4', side: THREE.DoubleSide })
  );
  cyanRing.position.set(0, 0, 0.002);
  pupilGroup.add(cyanRing);

  const catchlight1 = new THREE.Mesh(
    new THREE.CircleGeometry(0.028, 16),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  catchlight1.position.set(-0.028, 0.028, 0.005);
  pupilGroup.add(catchlight1);

  const catchlight2 = new THREE.Mesh(
    new THREE.CircleGeometry(0.015, 12),
    new THREE.MeshBasicMaterial({ color: '#00F5D4' })
  );
  catchlight2.position.set(0.026, -0.025, 0.005);
  pupilGroup.add(catchlight2);

  return pupilGroup;
}

function buildSceneGraph(
  canvas: HTMLCanvasElement,
  width: number,
  height: number
): SceneHandles {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
    powerPreference: 'high-performance',
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  // Wider 40deg vertical FOV so 9:16 portrait frames have generous horizontal breathing room
  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  camera.position.set(0, 0.2, 15.0);
  camera.lookAt(0, 0, 0);

  const rootGroup = new THREE.Group();
  scene.add(rootGroup);

  // Studio PMREM Environment Reflections
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color('#0C101A');

  const stripGeo = new THREE.PlaneGeometry(10, 3);
  const topStrip = new THREE.Mesh(
    stripGeo,
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
  );
  topStrip.position.set(0, 6, 2);
  topStrip.rotation.x = Math.PI / 2;
  envScene.add(topStrip);

  const leftStrip = new THREE.Mesh(
    stripGeo,
    new THREE.MeshBasicMaterial({ color: 0x00f5d4, side: THREE.DoubleSide })
  );
  leftStrip.position.set(-7, 2, 3);
  leftStrip.lookAt(0, 0, 0);
  envScene.add(leftStrip);

  const rightStrip = new THREE.Mesh(
    stripGeo,
    new THREE.MeshBasicMaterial({ color: 0xff2a4b, side: THREE.DoubleSide })
  );
  rightStrip.position.set(7, 2, 3);
  rightStrip.lookAt(0, 0, 0);
  envScene.add(rightStrip);

  const envMap = pmrem.fromScene(envScene, 0.04).texture;
  scene.environment = envMap;
  pmrem.dispose();

  // Studio Lights
  const ambientLight = new THREE.AmbientLight('#e2e8f0', 1.05);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight('#ffffff', 2.8);
  keyLight.position.set(3.5, 6.5, 8.5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.bias = -0.0005;
  scene.add(keyLight);

  const hermesLight = new THREE.PointLight('#00F5D4', 6.2, 15, 1.4);
  hermesLight.position.set(-3.6, 2.2, 4.0);
  scene.add(hermesLight);

  const clawLight = new THREE.PointLight('#FF3B30', 5.8, 15, 1.4);
  clawLight.position.set(3.6, 2.0, 4.0);
  scene.add(clawLight);

  const backLight = new THREE.PointLight('#1A2FFB', 4.5, 18, 1.4);
  backLight.position.set(0, -3.0, -3.0);
  scene.add(backLight);

  // Pedestal Stage
  const pedGroup = new THREE.Group();
  pedGroup.position.set(0, -1.85, 0.15);

  const silverPedMat = new THREE.MeshPhysicalMaterial({
    color: '#1E293B',
    roughness: 0.2,
    metalness: 0.85,
    clearcoat: 0.7,
  });
  const navyPedMat = new THREE.MeshPhysicalMaterial({
    color: '#0F172A',
    roughness: 0.22,
    metalness: 0.55,
    clearcoat: 0.8,
  });
  const pedestalRimMat = new THREE.MeshBasicMaterial({
    color: '#00F5D4',
    transparent: true,
    opacity: 0.85,
  });

  const basePlate = new THREE.Mesh(
    new THREE.CylinderGeometry(3.35, 3.58, 0.26, 64),
    silverPedMat
  );
  basePlate.position.y = -0.22;
  pedGroup.add(basePlate);

  const topPlate = new THREE.Mesh(
    new THREE.CylinderGeometry(2.98, 3.15, 0.30, 64),
    navyPedMat
  );
  topPlate.position.y = 0.04;
  pedGroup.add(topPlate);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(3.06, 0.032, 16, 96),
    pedestalRimMat
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.20;
  pedGroup.add(rim);

  rootGroup.add(pedGroup);

  // =========================================================================
  // 1. HERMES (Nous Research Cyber-Monochrome Architect)
  // =========================================================================
  const hermesGroup = new THREE.Group();
  hermesGroup.position.set(-1.55, -0.1, 0.3);
  rootGroup.add(hermesGroup);

  const porcelainMat = new THREE.MeshPhysicalMaterial({
    color: '#F4F6FA',
    roughness: 0.28,
    metalness: 0.04,
    clearcoat: 0.30,
    clearcoatRoughness: 0.2,
  });

  const obsidianMat = new THREE.MeshPhysicalMaterial({
    color: '#10131A',
    roughness: 0.22,
    metalness: 0.20,
    clearcoat: 0.65,
    clearcoatRoughness: 0.18,
  });

  const obsidianMatteMat = new THREE.MeshStandardMaterial({
    color: '#141821',
    roughness: 0.45,
    metalness: 0.15,
  });

  const crispWhiteMat = new THREE.MeshPhysicalMaterial({
    color: '#FFFFFF',
    roughness: 0.16,
    metalness: 0.10,
    clearcoat: 0.85,
    clearcoatRoughness: 0.12,
  });

  const hermesGlowMat = new THREE.MeshStandardMaterial({
    color: '#00F5D4',
    emissive: '#00F5D4',
    emissiveIntensity: 1.4,
    roughness: 0.15,
    metalness: 0.2,
  });

  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, -1.38, 0);
  hermesGroup.add(torsoGroup);

  const chestGeo = new THREE.CylinderGeometry(0.54, 0.72, 1.05, 32);
  chestGeo.scale(1.25, 1.0, 0.82);
  const chestMesh = new THREE.Mesh(chestGeo, obsidianMat);
  chestMesh.position.set(0, -0.18, -0.04);
  torsoGroup.add(chestMesh);

  const outerCollarGeo = new THREE.CylinderGeometry(
    0.76,
    0.96,
    0.95,
    32,
    1,
    true,
    -Math.PI * 0.82,
    Math.PI * 1.64
  );
  outerCollarGeo.scale(1.18, 1.0, 0.88);
  const outerCollar = new THREE.Mesh(outerCollarGeo, crispWhiteMat);
  outerCollar.position.set(0, 0.08, -0.02);
  outerCollar.rotation.y = Math.PI;
  torsoGroup.add(outerCollar);

  const innerCollarGeo = new THREE.CylinderGeometry(
    0.64,
    0.68,
    0.85,
    32,
    1,
    true,
    -Math.PI * 0.75,
    Math.PI * 1.5
  );
  innerCollarGeo.scale(1.1, 1.0, 0.85);
  const innerCollar = new THREE.Mesh(innerCollarGeo, obsidianMat);
  innerCollar.position.set(0, 0.22, -0.02);
  innerCollar.rotation.y = Math.PI;
  torsoGroup.add(innerCollar);

  const lapelGeo = new THREE.BoxGeometry(0.55, 0.78, 0.14);
  const leftLapel = new THREE.Mesh(lapelGeo, crispWhiteMat);
  leftLapel.position.set(-0.42, 0.05, 0.46);
  leftLapel.rotation.set(0.18, 0.42, -0.18);
  torsoGroup.add(leftLapel);

  const rightLapel = new THREE.Mesh(lapelGeo, obsidianMat);
  rightLapel.position.set(0.42, 0.05, 0.46);
  rightLapel.rotation.set(0.18, -0.42, 0.18);
  torsoGroup.add(rightLapel);

  // Iconic "N" Emblem on Left Collar
  const nEmblemGroup = new THREE.Group();
  nEmblemGroup.position.set(-0.43, 0.10, 0.55);
  nEmblemGroup.rotation.set(0.18, 0.42, -0.18);
  torsoGroup.add(nEmblemGroup);

  const badgePlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.36, 0.03),
    obsidianMat
  );
  nEmblemGroup.add(badgePlate);

  const nBarGeo = new THREE.BoxGeometry(0.055, 0.24, 0.045);
  const nLeft = new THREE.Mesh(nBarGeo, hermesGlowMat);
  nLeft.position.set(-0.08, 0, 0.02);
  const nRight = new THREE.Mesh(nBarGeo, hermesGlowMat);
  nRight.position.set(0.08, 0, 0.02);
  const nDiag = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.27, 0.045),
    hermesGlowMat
  );
  nDiag.position.set(0, 0, 0.02);
  nDiag.rotation.z = 0.58;
  nEmblemGroup.add(nLeft, nRight, nDiag);

  const neckMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.32, 0.65, 24),
    porcelainMat
  );
  neckMesh.position.set(0, 0.55, 0.02);
  torsoGroup.add(neckMesh);

  // Head Group
  const hermesHead = new THREE.Group();
  hermesHead.position.set(0, 0.12, 0.05);
  hermesGroup.add(hermesHead);

  const craniumGeo = new THREE.SphereGeometry(0.92, 48, 48);
  craniumGeo.scale(0.95, 1.04, 0.94);
  const cranium = new THREE.Mesh(craniumGeo, porcelainMat);
  hermesHead.add(cranium);

  const chinGeo = new THREE.ConeGeometry(0.68, 0.65, 32);
  chinGeo.scale(1.0, 1.0, 0.88);
  const chin = new THREE.Mesh(chinGeo, porcelainMat);
  chin.rotation.x = Math.PI;
  chin.position.set(0, -0.58, 0.12);
  hermesHead.add(chin);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.18, 4), porcelainMat);
  nose.position.set(0, -0.10, 0.90);
  nose.rotation.x = Math.PI * 0.35;
  hermesHead.add(nose);

  const mouth = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.014, 0.14, 8, 8),
    obsidianMat
  );
  mouth.rotation.z = Math.PI / 2;
  mouth.position.set(0, -0.36, 0.84);
  hermesHead.add(mouth);

  // Positioned cleanly in front of the porcelain cranium so eyes are never occluded
  const hermesEyesGroup = new THREE.Group();
  hermesEyesGroup.position.set(0, -0.03, 0.86);
  hermesHead.add(hermesEyesGroup);

  const hermesLeftPupil = createHermesEye(
    hermesEyesGroup,
    -0.31,
    obsidianMat,
    crispWhiteMat
  );
  const hermesRightPupil = createHermesEye(
    hermesEyesGroup,
    0.31,
    obsidianMat,
    crispWhiteMat
  );

  // Hair & Zig-Zag White Highlight (Tilted back so forehead & eyes are cleanly exposed!)
  const hairGroup = new THREE.Group();
  hermesHead.add(hairGroup);

  const hairDomeGeo = new THREE.SphereGeometry(
    0.99,
    40,
    40,
    0,
    Math.PI * 2,
    0,
    Math.PI * 0.56
  );
  hairDomeGeo.scale(0.98, 1.05, 1.02);
  const hairDome = new THREE.Mesh(hairDomeGeo, obsidianMatteMat);
  hairDome.position.set(0, 0.10, -0.06);
  hairDome.rotation.x = -0.46;
  hairGroup.add(hairDome);

  // Sculpted Front Bangs stopping cleanly above the eyebrows (y = 0.44..0.52)
  const bangSpecs = [
    { x: -0.48, y: 0.48, z: 0.72, rx: 0.26, ry: -0.35, rz: 0.22, sx: 0.18, sy: 0.48 },
    { x: -0.28, y: 0.52, z: 0.80, rx: 0.32, ry: -0.18, rz: 0.12, sx: 0.17, sy: 0.50 },
    { x: -0.08, y: 0.54, z: 0.84, rx: 0.35, ry: -0.05, rz: 0.05, sx: 0.18, sy: 0.52 },
    { x: 0.12, y: 0.54, z: 0.83, rx: 0.35, ry: 0.08, rz: -0.06, sx: 0.18, sy: 0.50 },
    { x: 0.30, y: 0.51, z: 0.78, rx: 0.30, ry: 0.20, rz: -0.14, sx: 0.17, sy: 0.48 },
    { x: 0.48, y: 0.47, z: 0.70, rx: 0.24, ry: 0.36, rz: -0.22, sx: 0.18, sy: 0.46 },
  ];
  bangSpecs.forEach((b) => {
    const lockGeo = new THREE.ConeGeometry(b.sx, b.sy, 16);
    lockGeo.scale(1.0, 1.0, 0.36);
    const lock = new THREE.Mesh(lockGeo, obsidianMat);
    lock.position.set(b.x, b.y, b.z);
    lock.rotation.set(Math.PI + b.rx, b.ry, b.rz);
    hairGroup.add(lock);
  });

  const zigzagPoints = [
    new THREE.Vector3(-0.54, 0.44, 0.77),
    new THREE.Vector3(-0.36, 0.56, 0.85),
    new THREE.Vector3(-0.22, 0.42, 0.88),
    new THREE.Vector3(-0.05, 0.57, 0.91),
    new THREE.Vector3(0.11, 0.43, 0.90),
    new THREE.Vector3(0.28, 0.56, 0.86),
    new THREE.Vector3(0.45, 0.44, 0.79),
  ];
  const zigzagCurve = new THREE.CatmullRomCurve3(
    zigzagPoints,
    false,
    'catmullrom',
    0.15
  );
  const zigzagMesh = new THREE.Mesh(
    new THREE.TubeGeometry(zigzagCurve, 48, 0.026, 8, false),
    crispWhiteMat
  );
  hairGroup.add(zigzagMesh);

  [-1, 1].forEach((dir) => {
    const sideCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(dir * 0.78, 0.35, 0.32),
      new THREE.Vector3(dir * 0.84, -0.10, 0.42),
      new THREE.Vector3(dir * 0.72, -0.62, 0.46),
      new THREE.Vector3(dir * 0.56, -0.98, 0.38),
    ]);
    const sideLockGeo = new THREE.TubeGeometry(sideCurve, 24, 0.13, 12, false);
    sideLockGeo.scale(0.65, 1.0, 1.0);
    hairGroup.add(new THREE.Mesh(sideLockGeo, obsidianMat));
  });

  // Headphones
  const headphoneGroup = new THREE.Group();
  hermesHead.add(headphoneGroup);

  const bandGeo = new THREE.TorusGeometry(1.03, 0.11, 20, 48, Math.PI * 1.02);
  bandGeo.scale(0.96, 1.02, 0.55);
  const headband = new THREE.Mesh(bandGeo, crispWhiteMat);
  headband.position.set(0, 0.04, -0.02);
  headband.rotation.z = -Math.PI * 0.01;
  headphoneGroup.add(headband);

  const innerBandGeo = new THREE.TorusGeometry(0.98, 0.06, 16, 40, Math.PI * 0.96);
  innerBandGeo.scale(0.96, 1.02, 0.45);
  const innerBand = new THREE.Mesh(innerBandGeo, obsidianMat);
  innerBand.position.set(0, 0.04, -0.02);
  headphoneGroup.add(innerBand);

  [-1, 1].forEach((dir) => {
    const cupGroup = new THREE.Group();
    cupGroup.position.set(dir * 0.98, -0.08, 0.04);
    cupGroup.rotation.z = -dir * 0.12;
    cupGroup.rotation.y = dir * 0.12;
    headphoneGroup.add(cupGroup);

    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(0.44, 0.44, 0.16, 32),
      obsidianMatteMat
    );
    pad.rotation.z = Math.PI / 2;
    cupGroup.add(pad);

    const shell = new THREE.Mesh(
      new THREE.CylinderGeometry(0.40, 0.44, 0.22, 32),
      obsidianMat
    );
    shell.rotation.z = Math.PI / 2;
    shell.position.x = dir * 0.12;
    cupGroup.add(shell);

    const cRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.28, 0.045, 16, 32, Math.PI * 1.45),
      crispWhiteMat
    );
    cRing.rotation.y = Math.PI / 2;
    cRing.rotation.x = 0.4;
    cRing.position.x = dir * 0.23;
    cupGroup.add(cRing);

    const glowRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.16, 0.024, 16, 32),
      hermesGlowMat
    );
    glowRing.rotation.y = Math.PI / 2;
    glowRing.position.x = dir * 0.25;
    cupGroup.add(glowRing);
  });

  // Concentric 3D Orbital Thought Rings (<think> Halos)
  const hermesOrbits = new THREE.Group();
  hermesOrbits.position.set(0, 0.22, -0.08);
  hermesGroup.add(hermesOrbits);

  const orbitRing1 = new THREE.Mesh(
    new THREE.TorusGeometry(1.56, 0.018, 16, 96),
    hermesGlowMat
  );
  orbitRing1.rotation.set(Math.PI * 0.38, 0.25, 0);
  hermesOrbits.add(orbitRing1);

  const orbitRing2 = new THREE.Mesh(
    new THREE.TorusGeometry(1.82, 0.012, 16, 96, Math.PI * 1.45),
    new THREE.MeshBasicMaterial({
      color: '#FFFFFF',
      transparent: true,
      opacity: 0.8,
    })
  );
  orbitRing2.rotation.set(-Math.PI * 0.32, -0.3, 0.4);
  hermesOrbits.add(orbitRing2);

  const orbitRing3 = new THREE.Mesh(
    new THREE.TorusGeometry(2.08, 0.010, 12, 96, Math.PI * 1.15),
    new THREE.MeshBasicMaterial({
      color: '#00F5D4',
      transparent: true,
      opacity: 0.55,
    })
  );
  orbitRing3.rotation.set(Math.PI * 0.18, 0.52, -0.3);
  hermesOrbits.add(orbitRing3);

  // =========================================================================
  // 2. OPENCLAW (Autonomous Crimson Execution Bot)
  // =========================================================================
  const openClawGroup = new THREE.Group();
  openClawGroup.position.set(1.55, -0.15, 0.4);
  rootGroup.add(openClawGroup);

  const openClawBodyPivot = new THREE.Group();
  openClawGroup.add(openClawBodyPivot);

  const crimsonMat = new THREE.MeshPhysicalMaterial({
    color: '#E5252A',
    emissive: '#3A0406',
    emissiveIntensity: 0.35,
    roughness: 0.22,
    metalness: 0.08,
    clearcoat: 0.72,
    clearcoatRoughness: 0.18,
    sheen: 0.65,
    sheenColor: new THREE.Color('#FF6B6B'),
  });

  const socketBlackMat = new THREE.MeshBasicMaterial({ color: '#06080E' });

  // Pure vibrant #00F5D4 Cyan unbleached by directional keyLight specular highlight
  const cyanEyeMat = new THREE.MeshBasicMaterial({
    color: '#00F5D4',
  }) as unknown as THREE.MeshStandardMaterial;

  const antennaTipMat = new THREE.MeshStandardMaterial({
    color: '#00F5D4',
    emissive: '#00D2B8',
    emissiveIntensity: 0.9,
    roughness: 0.2,
  });

  const bodyGeo = new THREE.SphereGeometry(1.18, 64, 64);
  bodyGeo.scale(1.06, 0.96, 1.0);
  const bodyMesh = new THREE.Mesh(bodyGeo, crimsonMat);
  openClawBodyPivot.add(bodyMesh);

  const clawPupils: THREE.Group[] = [];
  [-0.36, 0.36].forEach((xPos) => {
    const socketGroup = new THREE.Group();
    socketGroup.position.set(xPos, 0.14, 1.12);
    socketGroup.rotation.y = xPos * 0.22;
    socketGroup.rotation.x = -0.08;
    openClawBodyPivot.add(socketGroup);

    const socketMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.21, 32, 32),
      socketBlackMat
    );
    socketMesh.scale.set(0.95, 1.08, 0.35);
    socketGroup.add(socketMesh);

    const pupilGroup = new THREE.Group();
    pupilGroup.position.set(0, 0, 0.068);
    socketGroup.add(pupilGroup);

    const pupilMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.092, 24, 24),
      cyanEyeMat
    );
    pupilMesh.scale.set(1.0, 1.05, 0.55);
    pupilGroup.add(pupilMesh);

    // Specular white catchlight on OpenClaw's cyan eye
    const eyeSpark = new THREE.Mesh(
      new THREE.CircleGeometry(0.026, 16),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    eyeSpark.position.set(-0.025, 0.028, 0.055);
    pupilGroup.add(eyeSpark);

    clawPupils.push(pupilGroup);
  });

  const clawAntennae: { pivot: THREE.Group; dir: number }[] = [];
  [-1, 1].forEach((dir) => {
    const antPivot = new THREE.Group();
    antPivot.position.set(dir * 0.22, 1.05, 0.10);
    openClawBodyPivot.add(antPivot);

    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(dir * 0.18, 0.28, 0.08),
      new THREE.Vector3(dir * 0.42, 0.38, 0.14),
    ]);
    const antTube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 24, 0.068, 16, false),
      crimsonMat
    );
    antPivot.add(antTube);

    const antTip = new THREE.Mesh(
      new THREE.SphereGeometry(0.092, 20, 20),
      antennaTipMat
    );
    antTip.position.set(dir * 0.42, 0.38, 0.14);
    antPivot.add(antTip);

    clawAntennae.push({ pivot: antPivot, dir });
  });

  const clawArms: {
    group: THREE.Group;
    upperJaw: THREE.Mesh;
    lowerJaw: THREE.Mesh;
    dir: number;
  }[] = [];
  [-1, 1].forEach((dir) => {
    const armGroup = new THREE.Group();
    armGroup.position.set(dir * 1.18, -0.06, 0.25);
    openClawBodyPivot.add(armGroup);

    const shoulder = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 24, 24),
      crimsonMat
    );
    armGroup.add(shoulder);

    const upperJaw = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.20, 0.28, 16, 24),
      crimsonMat
    );
    upperJaw.position.set(dir * 0.22, 0.10, 0.16);
    upperJaw.rotation.z = dir * 0.55;
    upperJaw.rotation.x = 0.35;
    armGroup.add(upperJaw);

    const lowerJaw = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.14, 0.20, 16, 24),
      crimsonMat
    );
    lowerJaw.position.set(dir * 0.18, -0.14, 0.18);
    lowerJaw.rotation.z = -dir * 0.45;
    lowerJaw.rotation.x = -0.25;
    armGroup.add(lowerJaw);

    clawArms.push({ group: armGroup, upperJaw, lowerJaw, dir });
  });

  const clawLegs: { mesh: THREE.Mesh; dir: number }[] = [];
  [-1, 1].forEach((dir) => {
    const legMesh = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.18, 0.24, 16, 24),
      crimsonMat
    );
    legMesh.position.set(dir * 0.38, -1.12, 0.05);
    openClawBodyPivot.add(legMesh);
    clawLegs.push({ mesh: legMesh, dir });
  });

  // Dual Concentric 3D Shockwave Rings
  const shockwaveMat1 = new THREE.MeshBasicMaterial({
    color: '#00F5D4',
    transparent: true,
    opacity: 0.0,
  });
  const shockwaveRing1 = new THREE.Mesh(
    new THREE.TorusGeometry(1.35, 0.035, 16, 96),
    shockwaveMat1
  );
  shockwaveRing1.rotation.x = Math.PI * 0.35;
  openClawGroup.add(shockwaveRing1);

  const shockwaveMat2 = new THREE.MeshBasicMaterial({
    color: '#FF3B30',
    transparent: true,
    opacity: 0.0,
  });
  const shockwaveRing2 = new THREE.Mesh(
    new THREE.TorusGeometry(1.15, 0.026, 16, 96),
    shockwaveMat2
  );
  shockwaveRing2.rotation.x = Math.PI * 0.35;
  openClawGroup.add(shockwaveRing2);

  // =========================================================================
  // 3. 3D NEURAL SYNAPSE BRIDGE (Hermes -> OpenClaw)
  // =========================================================================
  const synapseGroup = new THREE.Group();
  rootGroup.add(synapseGroup);

  const synapseCurve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(-0.75, 0.05, 0.45),
    new THREE.Vector3(-0.25, 1.45, 1.25),
    new THREE.Vector3(0.50, 1.55, 1.25),
    new THREE.Vector3(1.35, 1.02, 0.55)
  );

  const synapseTubeMat = new THREE.MeshBasicMaterial({
    color: '#00F5D4',
    transparent: true,
    opacity: 0.15,
  });
  const synapseTube = new THREE.Mesh(
    new THREE.TubeGeometry(synapseCurve, 72, 0.022, 12, false),
    synapseTubeMat
  );
  synapseGroup.add(synapseTube);

  const synapsePackets: SynapsePacket[] = [];
  const packetGeo = new THREE.SphereGeometry(0.058, 16, 16);
  const packetColors = ['#00F5D4', '#FFFFFF', '#38BDF8', '#FF3B30'];
  for (let i = 0; i < 32; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: packetColors[i % packetColors.length],
      transparent: true,
      opacity: 0,
    });
    const mesh = new THREE.Mesh(packetGeo, mat);
    synapseGroup.add(mesh);
    synapsePackets.push({
      mesh,
      mat,
      baseOffset: i / 32,
      speed: 0.9 + (i % 5) * 0.12,
    });
  }

  // Hero Synapse Core Orb
  const heroPulseMat = new THREE.MeshBasicMaterial({
    color: '#FFFFFF',
    transparent: true,
    opacity: 0,
  });
  const heroPulseOrb = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 24, 24),
    heroPulseMat
  );
  const heroHalo = new THREE.Mesh(
    new THREE.TorusGeometry(0.24, 0.018, 12, 48),
    new THREE.MeshBasicMaterial({
      color: '#00F5D4',
      transparent: true,
      opacity: 0.85,
    })
  );
  heroPulseOrb.add(heroHalo);
  synapseGroup.add(heroPulseOrb);

  // =========================================================================
  // 4. 24 3D AI PHYSICS SATELLITES
  // =========================================================================
  const satellitesGroup = new THREE.Group();
  rootGroup.add(satellitesGroup);

  const geoms = [
    new THREE.CapsuleGeometry(0.20, 0.34, 16, 24),
    new THREE.OctahedronGeometry(0.30, 1),
    new THREE.TorusGeometry(0.24, 0.075, 16, 36),
    new THREE.SphereGeometry(0.24, 32, 32),
  ];

  const satMats = [
    new THREE.MeshPhysicalMaterial({
      color: '#14171F',
      roughness: 0.2,
      metalness: 0.3,
      clearcoat: 0.85,
    }),
    new THREE.MeshPhysicalMaterial({
      color: '#F4F6FA',
      roughness: 0.16,
      metalness: 0.1,
      clearcoat: 0.9,
    }),
    new THREE.MeshPhysicalMaterial({
      color: '#1A2FFB',
      emissive: '#0B1566',
      emissiveIntensity: 0.5,
      roughness: 0.18,
      metalness: 0.2,
      clearcoat: 0.9,
    }),
    new THREE.MeshPhysicalMaterial({
      color: '#E5252A',
      emissive: '#4A0608',
      emissiveIntensity: 0.45,
      roughness: 0.2,
      metalness: 0.15,
      clearcoat: 0.85,
    }),
    new THREE.MeshPhysicalMaterial({
      color: '#00F5D4',
      emissive: '#00B8A0',
      emissiveIntensity: 0.55,
      roughness: 0.14,
      metalness: 0.25,
      clearcoat: 0.9,
    }),
  ];

  const satellites: SatelliteNode[] = [];
  const count = 24;
  for (let i = 0; i < count; i++) {
    const geom = geoms[i % geoms.length];
    const mat = satMats[i % satMats.length];
    const mesh = new THREE.Mesh(geom, mat);

    const angle = (i / count) * Math.PI * 2;
    const ringRadiusX = 3.2 + (i % 3) * 0.75;
    const ringRadiusY = 0.85 + (i % 3) * 0.25;
    const homeX = Math.cos(angle) * ringRadiusX;
    const homeY = Math.sin(angle) * ringRadiusY - 0.15;
    const homeZ = -0.85 - (i % 4) * 0.45;

    const baseScale = 0.52 + (i % 4) * 0.10;
    mesh.scale.setScalar(baseScale);
    mesh.position.set(homeX, homeY, homeZ);
    satellitesGroup.add(mesh);

    satellites.push({
      mesh,
      home: new THREE.Vector3(homeX, homeY, homeZ),
      rotSpeed: new THREE.Vector3(
        0.6 + (i % 3) * 0.35,
        0.8 - (i % 4) * 0.28,
        0.5 + (i % 5) * 0.22
      ),
      baseScale,
      phase: i * 0.58,
    });
  }

  return {
    renderer,
    scene,
    camera,
    rootGroup,
    hermesGroup,
    hermesHead,
    hermesLeftPupil,
    hermesRightPupil,
    hermesGlowMat,
    orbitRing1,
    orbitRing2,
    orbitRing3,
    openClawGroup,
    openClawBodyPivot,
    clawPupils,
    cyanEyeMat,
    antennaTipMat,
    clawAntennae,
    clawArms,
    clawLegs,
    shockwaveRing1,
    shockwaveMat1,
    shockwaveRing2,
    shockwaveMat2,
    synapseCurve,
    synapseTubeMat,
    synapsePackets,
    heroPulseOrb,
    heroPulseMat,
    satellites,
  };
}

function renderAtTime(h: SceneHandles, t: number) {
  const reasoningWeight =
    smoothstep(3.2, 4.1, t) * (1.0 - smoothstep(6.4, 7.0, t));
  const dispatchProgress = clamp01((t - 6.5625) / (8.4375 - 6.5625));
  const dispatchWeight =
    smoothstep(6.35, 6.75, t) * (1.0 - smoothstep(8.35, 8.75, t));
  const executionWeight =
    smoothstep(8.35, 8.65, t) * (1.0 - smoothstep(11.1, 11.4, t));

  // --- 1. HERMES DETERMINISTIC ANIMATION ---
  const floatHermes = Math.sin(t * 2.4) * 0.085;
  h.hermesGroup.position.y = -0.1 + floatHermes;

  const hermesYaw =
    0.14 * Math.sin(t * 1.5) * reasoningWeight +
    0.35 * smoothstep(6.2, 7.2, t) * (1.0 - smoothstep(9.5, 10.5, t));
  const hermesPitch = -0.04 + 0.07 * Math.cos(t * 2.0) * reasoningWeight;
  h.hermesHead.rotation.set(hermesPitch, hermesYaw, 0);

  const pupilShiftX = 0.022 * Math.sin(t * 2.2) + dispatchWeight * 0.025;
  const pupilShiftY = -0.01 + 0.014 * Math.cos(t * 1.9);
  h.hermesLeftPupil.position.set(pupilShiftX, pupilShiftY, 0.062);
  h.hermesRightPupil.position.set(pupilShiftX, pupilShiftY, 0.062);

  const ringPhase = t * (1.4 + reasoningWeight * 2.2 + dispatchWeight * 1.8);
  h.orbitRing1.rotation.set(
    Math.PI * 0.38 + Math.sin(t * 1.8) * 0.14,
    0.25 + Math.cos(t * 1.4) * 0.12,
    ringPhase
  );
  h.orbitRing2.rotation.set(
    -Math.PI * 0.32 + Math.cos(t * 1.5) * 0.15,
    -0.3 + Math.sin(t * 1.2) * 0.15,
    -ringPhase * 0.85
  );
  h.orbitRing3.rotation.set(
    Math.PI * 0.18 + Math.sin(t * 1.1) * 0.2,
    0.52,
    ringPhase * 0.65
  );

  h.hermesGlowMat.emissiveIntensity =
    1.1 + reasoningWeight * 1.1 + dispatchWeight * 0.9;

  // --- 2. NEURAL SYNAPSE BRIDGE & HERO ORB ---
  h.synapseTubeMat.opacity =
    0.10 + reasoningWeight * 0.14 + dispatchWeight * 0.68 + executionWeight * 0.25;

  for (let i = 0; i < h.synapsePackets.length; i++) {
    const pkt = h.synapsePackets[i];
    const u = (pkt.baseOffset + t * (0.45 + dispatchWeight * pkt.speed)) % 1.0;
    const pt = h.synapseCurve.getPointAt(u);
    pkt.mesh.position.copy(pt);
    pkt.mesh.position.y += Math.sin(u * Math.PI * 5 + t * 10) * 0.04;

    const edgeFade = Math.sin(u * Math.PI);
    const activeAlpha =
      0.22 + reasoningWeight * 0.28 + dispatchWeight * 0.82 + executionWeight * 0.38;
    pkt.mat.opacity = clamp01(activeAlpha * edgeFade);
    const s = 0.55 + (dispatchWeight * 1.0 + reasoningWeight * 0.25) * edgeFade;
    pkt.mesh.scale.setScalar(s);
  }

  const heroU = smootherstep(0.0, 1.0, dispatchProgress);
  const heroPt = h.synapseCurve.getPointAt(heroU);
  h.heroPulseOrb.position.copy(heroPt);
  h.heroPulseOrb.rotation.z = t * 8.0;
  h.heroPulseOrb.rotation.x = t * 5.0;
  h.heroPulseMat.opacity = dispatchWeight;
  const heroScale = 0.85 + Math.sin(t * 24.0) * 0.16;
  h.heroPulseOrb.scale.setScalar(heroScale * Math.max(0.001, dispatchWeight));

  // --- 3. OPENCLAW DETERMINISTIC ANIMATION & SHOCKWAVE ---
  const floatClaw = Math.sin(t * 2.3 + 1.2) * 0.09;
  const executionHop =
    Math.abs(Math.sin((t - 8.4375) * 8.5)) * executionWeight * 0.38;
  h.openClawGroup.position.y = -0.15 + floatClaw + executionHop;

  const clawYaw =
    -0.22 * dispatchWeight +
    Math.sin(t * 13.0) * executionWeight * 0.18 -
    0.10 * reasoningWeight;
  const clawPitch = 0.07 * executionWeight + Math.cos(t * 5.0) * 0.04;
  h.openClawBodyPivot.rotation.set(clawPitch, clawYaw, 0);

  const pupilDilate = 1.0 + executionWeight * 0.24;
  for (let i = 0; i < h.clawPupils.length; i++) {
    const p = h.clawPupils[i];
    p.position.x = -0.03 * dispatchWeight + Math.sin(t * 4.0) * 0.018;
    p.position.y = Math.cos(t * 3.2) * 0.014;
    p.scale.set(pupilDilate, pupilDilate, 1.0);
  }
  // Keep emissiveIntensity <= 1.35 so ACES Filmic renders saturated #00F5D4 Cyan
  h.cyanEyeMat.emissiveIntensity =
    0.75 + dispatchWeight * 0.35 + executionWeight * 0.55;
  h.antennaTipMat.emissiveIntensity =
    0.6 + dispatchWeight * 0.8 + executionWeight * 0.8;

  for (let i = 0; i < h.clawAntennae.length; i++) {
    const ant = h.clawAntennae[i];
    const wiggle =
      Math.sin(t * (5.0 + dispatchWeight * 16.0 + executionWeight * 14.0) + i) *
      (0.06 + dispatchWeight * 0.22 + executionWeight * 0.16);
    ant.pivot.rotation.z = wiggle * ant.dir;
  }

  for (let i = 0; i < h.clawArms.length; i++) {
    const arm = h.clawArms[i];
    const waveAngle =
      Math.sin(t * 3.2 + i * Math.PI) * 0.12 +
      Math.sin(t * 15.0 + i) * executionWeight * 0.42;
    arm.group.rotation.z = arm.dir * (0.15 + executionWeight * 0.34) + waveAngle;
    arm.group.rotation.y = -arm.dir * (0.2 + executionWeight * 0.24);

    const snap = Math.abs(Math.sin(t * 17.0)) * executionWeight * 0.35;
    arm.upperJaw.rotation.z = arm.dir * (0.55 - snap);
    arm.lowerJaw.rotation.z = -arm.dir * (0.45 - snap);
  }

  for (let i = 0; i < h.clawLegs.length; i++) {
    const leg = h.clawLegs[i];
    leg.mesh.rotation.x =
      Math.sin(t * 15.0 + i * Math.PI) * executionWeight * 0.45;
  }

  if (t >= 8.4375 && t <= 11.25) {
    const p1 = clamp01((t - 8.4375) / 1.35);
    h.shockwaveRing1.scale.setScalar(1.0 + p1 * 2.8);
    h.shockwaveMat1.opacity = Math.sin(p1 * Math.PI) * 0.85;

    const p2 = clamp01((t - 8.90625) / 1.45);
    h.shockwaveRing2.scale.setScalar(1.0 + p2 * 3.1);
    h.shockwaveMat2.opacity = Math.sin(p2 * Math.PI) * 0.78;
  } else {
    h.shockwaveMat1.opacity = 0;
    h.shockwaveMat2.opacity = 0;
  }

  // --- 4. 24 SATELLITES DETERMINISTIC ORBIT & SHOCKWAVE IMPULSE ---
  const shockPush =
    t >= 8.4375 && t <= 10.6
      ? Math.sin(clamp01((t - 8.4375) / 1.8) * Math.PI) * 0.75
      : 0;

  for (let i = 0; i < h.satellites.length; i++) {
    const s = h.satellites[i];
    const ox = s.home.x + Math.cos(t * 1.15 + s.phase) * 0.32;
    const oy = s.home.y + Math.sin(t * 1.35 + s.phase) * 0.32;
    const oz = s.home.z + Math.sin(t * 0.9 + s.phase) * 0.25;

    const dirFromClaw = new THREE.Vector3(ox - 1.55, oy + 0.15, oz - 0.4);
    const distClaw = Math.max(0.5, dirFromClaw.length());
    dirFromClaw.normalize();

    const pushAmt = shockPush * Math.max(0, 1.0 - distClaw / 6.0) * 1.0;
    s.mesh.position.set(
      ox + dirFromClaw.x * pushAmt,
      oy + dirFromClaw.y * pushAmt,
      oz + dirFromClaw.z * pushAmt
    );
    s.mesh.rotation.set(
      i * 0.7 + t * s.rotSpeed.x,
      i * 1.1 + t * s.rotSpeed.y,
      i * 0.4 + t * s.rotSpeed.z
    );
  }

  // --- 5. CALIBRATED 9:16 PORTRAIT APPLE 3D CAMERA CHOREOGRAPHY ---
  const camPos = new THREE.Vector3();
  const lookTarget = new THREE.Vector3();

  if (t < 3.75) {
    // Wide Duo Stage inside the Titanium Glass Capsule -> Dolly Push-In toward Hermes
    const dollyIn = smootherstep(3.20, 3.75, t);
    camPos.set(
      THREE.MathUtils.lerp(0.0, -1.62, dollyIn),
      THREE.MathUtils.lerp(0.65, 0.16, dollyIn),
      THREE.MathUtils.lerp(15.6, 8.2, dollyIn)
    );
    lookTarget.set(
      THREE.MathUtils.lerp(0.0, -1.58, dollyIn),
      THREE.MathUtils.lerp(-0.18, 0.0, dollyIn),
      THREE.MathUtils.lerp(0.0, 0.25, dollyIn)
    );
  } else if (t < 6.5625) {
    // Scene 3: Dedicated Portrait Close-Up on HERMES (Cleanly centered, OpenClaw off-frame)
    const u3 = smootherstep(3.75, 6.5625, t);
    camPos.set(
      THREE.MathUtils.lerp(-1.62, -1.48, u3),
      THREE.MathUtils.lerp(0.16, 0.26, u3),
      THREE.MathUtils.lerp(8.2, 8.5, u3)
    );
    lookTarget.set(
      THREE.MathUtils.lerp(-1.58, -1.52, u3),
      THREE.MathUtils.lerp(0.0, 0.05, u3),
      0.25
    );
  } else if (t < 8.4375) {
    // Scene 4: Wide Duo Synapse Bridge Shot -> Sweeping into OpenClaw
    const u4 = smootherstep(6.5625, 8.4375, t);
    const wideBell = Math.sin(u4 * Math.PI);
    camPos.set(
      THREE.MathUtils.lerp(-1.48, 1.58, u4),
      THREE.MathUtils.lerp(0.26, 0.14, u4) + wideBell * 0.45,
      THREE.MathUtils.lerp(8.5, 8.2, u4) + wideBell * 6.2
    );
    lookTarget.set(
      THREE.MathUtils.lerp(-1.52, 1.55, u4),
      THREE.MathUtils.lerp(0.05, -0.08, u4) + wideBell * 0.25,
      0.25
    );
  } else if (t < 10.85) {
    // Scene 5: Dedicated Close-Up on OPENCLAW (8.44s - 9.85s) -> Full Duo Hero Pullback (9.85s - 10.85s)
    const uPull = smootherstep(9.85, 10.75, t);
    const impactDecay1 = Math.exp(-Math.max(0, t - 8.4375) * 14.0);
    const impactDecay2 = Math.exp(-Math.max(0, t - 8.90625) * 14.0);
    const shakeX = Math.sin(t * 95.0) * (impactDecay1 + impactDecay2) * 0.06;
    const shakeY = Math.cos(t * 110.0) * (impactDecay1 + impactDecay2) * 0.06;

    camPos.set(
      THREE.MathUtils.lerp(1.58, 0.0, uPull) + shakeX,
      THREE.MathUtils.lerp(0.14, 0.08, uPull) + shakeY,
      THREE.MathUtils.lerp(8.2, 15.2, uPull)
    );
    lookTarget.set(
      THREE.MathUtils.lerp(1.55, 0.0, uPull),
      THREE.MathUtils.lerp(-0.08, -0.15, uPull),
      0.22
    );
  } else {
    // 10.85s - 11.25s: Z-Axis Zoom-Through OpenClaw's Shockwave Ring!
    const zZoom = Math.pow(clamp01((t - 10.85) / 0.40), 2.4);
    camPos.set(
      THREE.MathUtils.lerp(0.0, 1.50, zZoom),
      THREE.MathUtils.lerp(0.08, -0.05, zZoom),
      THREE.MathUtils.lerp(15.2, 1.2, zZoom)
    );
    lookTarget.set(
      THREE.MathUtils.lerp(0.0, 1.55, zZoom),
      -0.12,
      0.25
    );
  }

  h.camera.position.copy(camPos);
  h.camera.lookAt(lookTarget);
  h.renderer.render(h.scene, h.camera);
}

export const HermesOpenClaw3DStage: React.FC<HermesOpenClaw3DStageProps> = ({
  timeSec,
  width = 1080,
  height = 1920,
  style,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const handlesRef = useRef<SceneHandles | null>(null);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!handlesRef.current) {
      handlesRef.current = buildSceneGraph(canvas, width, height);
    }
    renderAtTime(handlesRef.current, timeSec);
  }, [timeSec, width, height]);

  useEffect(() => {
    return () => {
      if (handlesRef.current) {
        handlesRef.current.renderer.dispose();
        handlesRef.current = null;
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        ...style,
      }}
    />
  );
};
