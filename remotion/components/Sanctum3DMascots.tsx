import React, { useEffect, useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';

export interface Sanctum3DMascotsProps {
  /** Exact timeline time in seconds */
  timeSec: number;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}

interface MascotRig {
  group: THREE.Group;
  bodyPivot: THREE.Group;
  pupils: THREE.Group[];
  antennae: { pivot: THREE.Group; dir: number }[];
  arms: { group: THREE.Group; dir: number }[];
  legs: { mesh: THREE.Mesh; dir: number }[];
}

interface SceneHandles {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  hermesGroup: THREE.Group;
  hermesHead: THREE.Group;
  hermesEyesGroup: THREE.Group;
  hermesLeftPupil: THREE.Group;
  hermesRightPupil: THREE.Group;
  orbitRing1: THREE.Mesh;
  orbitRing2: THREE.Mesh;
  flybyClaw: MascotRig;
  buddyClaw: MascotRig;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function easeOutExpo(x: number): number {
  const t = clamp01(x);
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function easeOutCubic(x: number): number {
  const t = clamp01(x);
  return 1 - Math.pow(1 - t, 3);
}

function easeInCubic(x: number): number {
  const t = clamp01(x);
  return t * t * t;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function createOpenClawInstance(scaleFactor: number = 1.0): MascotRig {
  const group = new THREE.Group();
  const bodyPivot = new THREE.Group();
  bodyPivot.scale.setScalar(scaleFactor);
  group.add(bodyPivot);

  // Joyful glossy coral-crimson vinyl shader tailored for bright cobalt daylight
  const crimsonMat = new THREE.MeshPhysicalMaterial({
    color: '#F23338',
    emissive: '#59080E',
    emissiveIntensity: 0.28,
    roughness: 0.20,
    metalness: 0.04,
    clearcoat: 0.85,
    clearcoatRoughness: 0.14,
    sheen: 0.75,
    sheenColor: new THREE.Color('#FFA3A8'),
  });

  const cheekBlushMat = new THREE.MeshBasicMaterial({
    color: '#FF7D85',
    transparent: true,
    opacity: 0.65,
  });

  const socketBlackMat = new THREE.MeshBasicMaterial({ color: '#14080E' });
  const cyanEyeMat = new THREE.MeshBasicMaterial({ color: '#00F5D4' });
  const antennaTipMat = new THREE.MeshPhysicalMaterial({
    color: '#FFFFFF',
    emissive: '#C1FF00',
    emissiveIntensity: 0.45,
    roughness: 0.15,
    clearcoat: 0.9,
  });

  const bodyGeo = new THREE.SphereGeometry(1.18, 64, 64);
  bodyGeo.scale(1.08, 0.96, 1.0);
  const bodyMesh = new THREE.Mesh(bodyGeo, crimsonMat);
  bodyPivot.add(bodyMesh);

  // Friendly expressive eyes + specular catchlight
  const pupils: THREE.Group[] = [];
  [-0.37, 0.37].forEach((xPos) => {
    const socketGroup = new THREE.Group();
    socketGroup.position.set(xPos, 0.14, 1.12);
    socketGroup.rotation.y = xPos * 0.22;
    socketGroup.rotation.x = -0.08;
    bodyPivot.add(socketGroup);

    const socketMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.21, 32, 32),
      socketBlackMat
    );
    socketMesh.scale.set(0.95, 1.12, 0.35);
    socketGroup.add(socketMesh);

    const pupilGroup = new THREE.Group();
    pupilGroup.position.set(0, 0, 0.068);
    socketGroup.add(pupilGroup);

    const pupilMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.095, 24, 24),
      cyanEyeMat
    );
    pupilMesh.scale.set(1.0, 1.05, 0.55);
    pupilGroup.add(pupilMesh);

    const eyeSpark = new THREE.Mesh(
      new THREE.CircleGeometry(0.042, 16),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    eyeSpark.position.set(-0.032, 0.042, 0.058);
    pupilGroup.add(eyeSpark);

    pupils.push(pupilGroup);
  });

  // Cute subtle happy smile curve between eyes (matches friendly Sanctum mascot vibe!)
  const smileCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.12, -0.02, 1.17),
    new THREE.Vector3(0.0, -0.10, 1.19),
    new THREE.Vector3(0.12, -0.02, 1.17),
  ]);
  const smileMesh = new THREE.Mesh(
    new THREE.TubeGeometry(smileCurve, 20, 0.024, 10, false),
    socketBlackMat
  );
  bodyPivot.add(smileMesh);

  // Soft rosy cheek highlights
  [-0.58, 0.58].forEach((xPos) => {
    const blush = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), cheekBlushMat);
    blush.scale.set(1.3, 0.75, 0.3);
    blush.position.set(xPos, -0.06, 1.04);
    blush.rotation.y = xPos * 0.42;
    bodyPivot.add(blush);
  });

  const antennae: { pivot: THREE.Group; dir: number }[] = [];
  [-1, 1].forEach((dir) => {
    const antPivot = new THREE.Group();
    antPivot.position.set(dir * 0.24, 1.04, 0.10);
    bodyPivot.add(antPivot);

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
      new THREE.SphereGeometry(0.095, 20, 20),
      antennaTipMat
    );
    antTip.position.set(dir * 0.42, 0.38, 0.14);
    antPivot.add(antTip);

    antennae.push({ pivot: antPivot, dir });
  });

  const arms: { group: THREE.Group; dir: number }[] = [];
  [-1, 1].forEach((dir) => {
    const armGroup = new THREE.Group();
    armGroup.position.set(dir * 1.18, -0.04, 0.25);
    bodyPivot.add(armGroup);

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

    arms.push({ group: armGroup, dir });
  });

  const legs: { mesh: THREE.Mesh; dir: number }[] = [];
  [-1, 1].forEach((dir) => {
    const legMesh = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.18, 0.24, 16, 24),
      crimsonMat
    );
    legMesh.position.set(dir * 0.38, -1.10, 0.05);
    bodyPivot.add(legMesh);
    legs.push({ mesh: legMesh, dir });
  });

  return { group, bodyPivot, pupils, antennae, arms, legs };
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

  const lashCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.16, 0.05, 0.04),
    new THREE.Vector3(-0.05, 0.14, 0.08),
    new THREE.Vector3(0.06, 0.13, 0.08),
    new THREE.Vector3(0.17, 0.04, 0.03),
  ]);
  const lash = new THREE.Mesh(
    new THREE.TubeGeometry(lashCurve, 20, 0.028, 8, false),
    darkMat
  );
  eyeGroup.add(lash);

  const browCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.17, 0.23, 0.03),
    new THREE.Vector3(0.0, 0.27, 0.07),
    new THREE.Vector3(0.17, 0.21, 0.03),
  ]);
  const brow = new THREE.Mesh(
    new THREE.TubeGeometry(browCurve, 16, 0.017, 8, false),
    darkMat
  );
  eyeGroup.add(brow);

  const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.14, 24, 24), whiteMat);
  sclera.scale.set(1.18, 0.98, 0.45);
  eyeGroup.add(sclera);

  const pupilGroup = new THREE.Group();
  pupilGroup.position.set(0, -0.008, 0.064);
  eyeGroup.add(pupilGroup);

  const iris = new THREE.Mesh(new THREE.CircleGeometry(0.090, 24), darkMat);
  pupilGroup.add(iris);

  const cyanRing = new THREE.Mesh(
    new THREE.RingGeometry(0.050, 0.075, 24),
    new THREE.MeshBasicMaterial({ color: '#29B6FF', side: THREE.DoubleSide })
  );
  cyanRing.position.set(0, 0, 0.002);
  pupilGroup.add(cyanRing);

  const catchlight1 = new THREE.Mesh(
    new THREE.CircleGeometry(0.032, 16),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  catchlight1.position.set(-0.028, 0.030, 0.005);
  pupilGroup.add(catchlight1);

  const catchlight2 = new THREE.Mesh(
    new THREE.CircleGeometry(0.016, 12),
    new THREE.MeshBasicMaterial({ color: '#00F5D4' })
  );
  catchlight2.position.set(0.026, -0.025, 0.005);
  pupilGroup.add(catchlight2);

  return pupilGroup;
}

function buildScene(
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
  renderer.toneMappingExposure = 1.22;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
  camera.position.set(0, 0, 14.0);
  camera.lookAt(0, 0, 0);

  // Airy Bright Sky Environment Map so glossy porcelain, white collar & crimson vinyl sparkle!
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color('#2B7BFF');

  const skyDomeTop = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 12),
    new THREE.MeshBasicMaterial({ color: '#FFFFFF', side: THREE.DoubleSide })
  );
  skyDomeTop.position.set(0, 7, 3);
  skyDomeTop.rotation.x = Math.PI / 2;
  envScene.add(skyDomeTop);

  const warmBounce = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 8),
    new THREE.MeshBasicMaterial({ color: '#FFB8C6', side: THREE.DoubleSide })
  );
  warmBounce.position.set(-6, -4, 3);
  warmBounce.lookAt(0, 0, 0);
  envScene.add(warmBounce);

  const mintRim = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 8),
    new THREE.MeshBasicMaterial({ color: '#B4FF8C', side: THREE.DoubleSide })
  );
  mintRim.position.set(6, 2, 3);
  mintRim.lookAt(0, 0, 0);
  envScene.add(mintRim);

  scene.environment = pmrem.fromScene(envScene, 0.04).texture;
  pmrem.dispose();

  // Bright Daylight Illumination
  scene.add(new THREE.AmbientLight('#EBF4FF', 1.55));

  const sunKey = new THREE.DirectionalLight('#FFFFFF', 2.45);
  sunKey.position.set(4.2, 7.5, 9.5);
  scene.add(sunKey);

  const skyFill = new THREE.DirectionalLight('#8AC8FF', 1.15);
  skyFill.position.set(-5.5, 3.0, 6.0);
  scene.add(skyFill);

  const coralBounce = new THREE.PointLight('#FFA6B8', 3.5, 16, 1.4);
  coralBounce.position.set(-5.0, -3.5, 5.0);
  scene.add(coralBounce);

  // =========================================================================
  // 1. HERMES (Hero Z-Automation Cyber-Monochrome Architect)
  // =========================================================================
  const hermesGroup = new THREE.Group();
  scene.add(hermesGroup);

  const porcelainMat = new THREE.MeshPhysicalMaterial({
    color: '#F8FAFF',
    roughness: 0.24,
    metalness: 0.02,
    clearcoat: 0.38,
    clearcoatRoughness: 0.18,
  });

  const obsidianMat = new THREE.MeshPhysicalMaterial({
    color: '#121726',
    roughness: 0.20,
    metalness: 0.16,
    clearcoat: 0.72,
    clearcoatRoughness: 0.16,
  });

  const obsidianMatteMat = new THREE.MeshStandardMaterial({
    color: '#171D2E',
    roughness: 0.40,
    metalness: 0.12,
  });

  const crispWhiteMat = new THREE.MeshPhysicalMaterial({
    color: '#FFFFFF',
    roughness: 0.14,
    metalness: 0.06,
    clearcoat: 0.90,
    clearcoatRoughness: 0.10,
  });

  const hermesGlowMat = new THREE.MeshBasicMaterial({
    color: '#00F5D4',
  });

  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, -1.36, 0);
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

  // "N" Badge on Left Collar
  const nEmblemGroup = new THREE.Group();
  nEmblemGroup.position.set(-0.43, 0.10, 0.55);
  nEmblemGroup.rotation.set(0.18, 0.42, -0.18);
  torsoGroup.add(nEmblemGroup);

  nEmblemGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.36, 0.03), obsidianMat));
  const nBarGeo = new THREE.BoxGeometry(0.055, 0.24, 0.045);
  const nLeft = new THREE.Mesh(nBarGeo, crispWhiteMat);
  nLeft.position.set(-0.08, 0, 0.02);
  const nRight = new THREE.Mesh(nBarGeo, crispWhiteMat);
  nRight.position.set(0.08, 0, 0.02);
  const nDiag = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.27, 0.045), crispWhiteMat);
  nDiag.position.set(0, 0, 0.02);
  nDiag.rotation.z = 0.58;
  nEmblemGroup.add(nLeft, nRight, nDiag);

  const neckMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.32, 0.65, 24),
    porcelainMat
  );
  neckMesh.position.set(0, 0.55, 0.02);
  torsoGroup.add(neckMesh);

  // Hermes Head
  const hermesHead = new THREE.Group();
  hermesHead.position.set(0, 0.12, 0.05);
  hermesGroup.add(hermesHead);

  const craniumGeo = new THREE.SphereGeometry(0.92, 48, 48);
  craniumGeo.scale(0.95, 1.04, 0.94);
  hermesHead.add(new THREE.Mesh(craniumGeo, porcelainMat));

  const chinGeo = new THREE.ConeGeometry(0.68, 0.65, 32);
  chinGeo.scale(1.0, 1.0, 0.88);
  const chin = new THREE.Mesh(chinGeo, porcelainMat);
  chin.rotation.x = Math.PI;
  chin.position.set(0, -0.58, 0.12);
  hermesHead.add(chin);

  // Warm gentle smile curve on Hermes for approachable editorial charm
  const hSmileCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.09, -0.34, 0.84),
    new THREE.Vector3(0.0, -0.38, 0.86),
    new THREE.Vector3(0.09, -0.34, 0.84),
  ]);
  hermesHead.add(
    new THREE.Mesh(new THREE.TubeGeometry(hSmileCurve, 16, 0.016, 8, false), obsidianMat)
  );

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

  // Hair & Zig-Zag White Highlight
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

  const zigzagCurve = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(-0.54, 0.44, 0.77),
      new THREE.Vector3(-0.36, 0.56, 0.85),
      new THREE.Vector3(-0.22, 0.42, 0.88),
      new THREE.Vector3(-0.05, 0.57, 0.91),
      new THREE.Vector3(0.11, 0.43, 0.90),
      new THREE.Vector3(0.28, 0.56, 0.86),
      new THREE.Vector3(0.45, 0.44, 0.79),
    ],
    false,
    'catmullrom',
    0.15
  );
  hairGroup.add(
    new THREE.Mesh(new THREE.TubeGeometry(zigzagCurve, 48, 0.028, 8, false), crispWhiteMat)
  );

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
  headphoneGroup.add(headband);

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

  // Crisp White & Cyan Orbital <think> Rings (echoing the angelic side-wing silhouette in Act 2!)
  const hermesOrbits = new THREE.Group();
  hermesOrbits.position.set(0, 0.20, -0.06);
  hermesGroup.add(hermesOrbits);

  const orbitRing1 = new THREE.Mesh(
    new THREE.TorusGeometry(1.56, 0.024, 16, 96),
    new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.92 })
  );
  orbitRing1.rotation.set(Math.PI * 0.38, 0.22, 0);
  hermesOrbits.add(orbitRing1);

  const orbitRing2 = new THREE.Mesh(
    new THREE.TorusGeometry(1.82, 0.016, 16, 96, Math.PI * 1.5),
    new THREE.MeshBasicMaterial({ color: '#8BE9FF', transparent: true, opacity: 0.78 })
  );
  orbitRing2.rotation.set(-Math.PI * 0.32, -0.28, 0.35);
  hermesOrbits.add(orbitRing2);

  // =========================================================================
  // 2. FOREGROUND FLY-BY OPENCLAW (4.00s - 4.38s, Ref F121-F131)
  // =========================================================================
  const flybyClaw = createOpenClawInstance(1.0);
  scene.add(flybyClaw.group);

  // =========================================================================
  // 3. TOP-RIGHT MINI COMPANION OPENCLAW (4.30s - 7.18s, Ref F131-F215)
  // =========================================================================
  const buddyClaw = createOpenClawInstance(0.34);
  scene.add(buddyClaw.group);

  return {
    renderer,
    scene,
    camera,
    hermesGroup,
    hermesHead,
    hermesEyesGroup,
    hermesLeftPupil,
    hermesRightPupil,
    orbitRing1,
    orbitRing2,
    flybyClaw,
    buddyClaw,
  };
}

function updateSceneAtTime(h: SceneHandles, t: number) {
  // -------------------------------------------------------------------------
  // A. Foreground OpenClaw Fly-By (3.94s -> 4.38s | Ref F119 -> F131)
  // At z = 10.65 (dist = 3.35 from camera z=14, FOV=36deg), frustum half-height = 1.09,
  // so OpenClaw (r=1.18) fills ~75% of screen height right at 4.13s (Ref F125)!
  // -------------------------------------------------------------------------
  if (t >= 3.92 && t <= 4.42) {
    h.flybyClaw.group.visible = true;
    const u = clamp01((t - 3.97) / (4.36 - 3.97));
    // Trajectory: bottom-center-right (+0.38, -1.55) -> center-left (-0.36, +0.08 at 4.13s) -> top-left (-1.28, +2.05)
    const x = 0.42 + (-1.35 - 0.42) * u;
    const y = -1.62 + (2.15 - -1.62) * Math.pow(u, 0.86);
    const z = 10.55 + Math.sin(u * Math.PI) * 0.22;

    h.flybyClaw.group.position.set(x, y, z);
    // Joyful -22deg counter-clockwise tilt facing the lens (1:1 Ref F125!)
    h.flybyClaw.bodyPivot.rotation.set(0.08 - u * 0.14, -0.10 + u * 0.18, 0.40);

    h.flybyClaw.arms.forEach(({ group, dir }) => {
      group.rotation.z = dir * (0.42 + Math.sin(t * 24.0) * 0.22);
      group.rotation.x = -0.30;
    });
    h.flybyClaw.antennae.forEach(({ pivot, dir }) => {
      pivot.rotation.z = -dir * 0.14 + Math.sin(t * 20.0 + dir) * 0.10;
    });
  } else {
    h.flybyClaw.group.visible = false;
  }

  // -------------------------------------------------------------------------
  // B. Hero 3D Hermes Float-In & Portrait Hold (4.20s -> 7.20s | Ref F126-F216)
  // -------------------------------------------------------------------------
  if (t >= 4.18 && t <= 7.22) {
    h.hermesGroup.visible = true;
    const uIn = easeOutCubic(clamp01((t - 4.24) / (6.35 - 4.24)));
    const uExit = easeInCubic(clamp01((t - 6.84) / (7.16 - 6.84)));

    // Screen-matched path from distant mid-left to bottom-left foreground portrait (slightly higher so full face + chin show!)
    const baseX = -3.65 + (-2.36 - -3.65) * uIn;
    const baseY = -0.45 + (-1.42 - -0.45) * Math.pow(uIn, 0.85);
    const baseZ = -2.5 + (7.85 - -2.5) * uIn;

    const bobY = Math.sin((t - 4.2) * 2.6) * 0.08 * uIn;
    const exitDropY = -4.2 * uExit;

    h.hermesGroup.position.set(baseX, baseY + bobY + exitDropY, baseZ);

    // Tilted playfully (+20deg) & angled slightly toward center text
    h.hermesGroup.rotation.set(
      -0.06 * uIn,
      0.26 + Math.sin(t * 1.8) * 0.05,
      -0.34 * (0.45 + 0.55 * uIn)
    );

    h.hermesHead.rotation.y = 0.08 + Math.sin(t * 2.1) * 0.04;
    h.hermesHead.rotation.x = -0.06 + Math.cos(t * 1.7) * 0.03;

    // Pupils glance warmly up-right toward "Bangun Sistem Otomasi sekarang"
    const lookX = 0.032 * smoothstep(4.7, 5.2, t);
    const lookY = 0.022 * smoothstep(4.7, 5.2, t);
    h.hermesLeftPupil.position.set(lookX, -0.008 + lookY, 0.064);
    h.hermesRightPupil.position.set(lookX, -0.008 + lookY, 0.064);

    // Natural quick blink at 5.95s
    const blink =
      t > 5.92 && t < 6.06 ? Math.sin(((t - 5.92) / 0.14) * Math.PI) : 0;
    h.hermesEyesGroup.scale.y = Math.max(0.08, 1.0 - blink * 0.92);

    // Gentle orbital halo rotation
    h.orbitRing1.rotation.z = t * 0.55;
    h.orbitRing2.rotation.z = -t * 0.42;
  } else {
    h.hermesGroup.visible = false;
  }

  // -------------------------------------------------------------------------
  // C. Top-Right Mini OpenClaw Companion (4.22s -> 7.22s | Ref F127-F216)
  // Floats playfully at screen (74%, 39%) -> bobbing gently, then drops at 6.9s
  // -------------------------------------------------------------------------
  if (t >= 4.20 && t <= 7.24) {
    h.buddyClaw.group.visible = true;
    const uGrow = easeOutExpo(clamp01((t - 4.22) / 0.85));
    const uExit = easeInCubic(clamp01((t - 6.88) / (7.22 - 6.88)));

    const bx = 2.65 + 0.35 * smoothstep(4.5, 6.8, t);
    const by = 0.88 - 0.18 * smoothstep(4.5, 6.8, t) + Math.sin(t * 3.8) * 0.10 - 3.6 * uExit;
    const bz = 5.2;

    h.buddyClaw.group.position.set(bx, by, bz);
    const s = 0.34 * (0.35 + 0.65 * uGrow);
    h.buddyClaw.bodyPivot.scale.setScalar(s);
    h.buddyClaw.bodyPivot.rotation.set(
      0.08 + Math.sin(t * 2.5) * 0.08,
      -0.32 + Math.cos(t * 2.0) * 0.12,
      -0.20 + Math.sin(t * 3.1) * 0.08
    );

    h.buddyClaw.arms.forEach(({ group, dir }) => {
      group.rotation.z = dir * (0.25 + Math.sin(t * 7.5 + dir) * 0.25);
    });
    h.buddyClaw.legs.forEach(({ mesh, dir }) => {
      mesh.rotation.x = Math.sin(t * 6.5 + dir * 1.5) * 0.22;
    });
  } else {
    h.buddyClaw.group.visible = false;
  }

  h.renderer.render(h.scene, h.camera);
}

export const Sanctum3DMascots: React.FC<Sanctum3DMascotsProps> = ({
  timeSec,
  width = 1920,
  height = 1080,
  style,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const handlesRef = useRef<SceneHandles | null>(null);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!handlesRef.current) {
      handlesRef.current = buildScene(canvas, width, height);
    }
    updateSceneAtTime(handlesRef.current, timeSec);
  }, [timeSec, width, height]);

  useEffect(() => {
    return () => {
      if (handlesRef.current) {
        handlesRef.current.renderer.dispose();
        handlesRef.current = null;
      }
    };
  }, []);

  // Subtle macro depth-of-field blur right at the 4.00s portal burst (matching Ref F121-F124!)
  const burstDofBlur =
    timeSec >= 3.95 && timeSec <= 4.22
      ? (1.0 - clamp01((timeSec - 3.98) / 0.22)) * 6.5
      : 0;

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        pointerEvents: 'none',
        filter: burstDofBlur > 0.15 ? `blur(${burstDofBlur.toFixed(2)}px)` : undefined,
        ...style,
      }}
    />
  );
};

