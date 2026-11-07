/**
 * ai-agent-hero-scene.js
 * Pure-3D Interactive Hero Scene & Mini-Storyboard for Z-Automation
 * Features:
 *   1. HERMES (Nous Research Cyber-Monochrome Architect) — Left-Center
 *   2. OPENCLAW (Autonomous Crimson Execution Bot) — Right-Center
 *   3. 3-Stage Pure-3D Visual Storyboard:
 *      - Stage 0: THE REASONING (Hermes orbital rings glow, physics nodes orbit)
 *      - Stage 1: THE DISPATCH  (Curved 3D Neural Synapse Beam from Hermes -> OpenClaw)
 *      - Stage 2: THE EXECUTION (OpenClaw hops, claws snap, radial 3D shockwave & node activation)
 *   4. 24 Interactive 3D AI Physics Satellites (Capsules, Neural Octahedrons, Data Rings, Orbs)
 *      with real-time mouse cursor repulsion, character collision, and click impulse.
 */

import * as THREE from '/assets/vendor/three/three.module.js';

const PALETTES = [
  {
    name: 'Hermes x OpenClaw Signature',
    primary: new THREE.Color('#1A2FFB'),
    secondary: new THREE.Color('#00F5D4'),
    crimson: new THREE.Color('#E5252A'),
    bgGlow: new THREE.Color('#162044'),
  },
  {
    name: 'Cyber Emerald Synapse',
    primary: new THREE.Color('#00F5D4'),
    secondary: new THREE.Color('#38BDF8'),
    crimson: new THREE.Color('#FF2A4B'),
    bgGlow: new THREE.Color('#0D2B2A'),
  },
  {
    name: 'Solaris Overclock',
    primary: new THREE.Color('#FFB800'),
    secondary: new THREE.Color('#00F5D4'),
    crimson: new THREE.Color('#E5252A'),
    bgGlow: new THREE.Color('#2D1E10'),
  },
  {
    name: 'Hyper Violet Nous',
    primary: new THREE.Color('#8B5CF6'),
    secondary: new THREE.Color('#00F5D4'),
    crimson: new THREE.Color('#E5252A'),
    bgGlow: new THREE.Color('#231438'),
  },
];

export class AIAgentHeroScene {
  constructor({ container, canvas, transparent = false, pedestal = false, compactDuo = false }) {
    this.container = container;
    this.canvas = canvas;
    this.transparent = transparent;
    this.pedestal = pedestal;
    this.compactDuo = compactDuo;

    this.width = container.clientWidth || 1200;
    this.height = container.clientHeight || 680;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.paletteIndex = 0;
    this.palette = PALETTES[0];

    // Time & Storyboard Cycle (10.0s total cycle across 3 acts)
    this.clock = new THREE.Clock();
    this.elapsed = 0;
    this.cycleDuration = 10.0;
    this.storyTime = 0;
    this.currentStage = 0; // 0: Reasoning, 1: Dispatch, 2: Execution
    this.shockwaveProgress = -1;

    // Pointer / Cursor state (Normalized -1..1 and 3D world projection)
    this.pointerNDC = new THREE.Vector2(0, 0);
    this.pointerSmooth = new THREE.Vector2(0, 0);
    this.pointerWorld = new THREE.Vector3(0, 0, 2);
    this.prevPointerWorld = new THREE.Vector3(0, 0, 2);
    this.pointerVel = new THREE.Vector3(0, 0, 0);
    this.isPointerInside = false;

    this.physicsNodes = [];
    this.synapsePackets = [];
    this._disposed = false;
    this._isPaused = false;
    this._rafId = null;
    this._gyroSmooth = new THREE.Vector2(0, 0);
    this._touchActive = false;
    this._touchStart = new THREE.Vector2(0, 0);
    this._touchStartTime = 0;

    this._initRenderer();
    this._initSceneAndCamera();
    this._initLightsAndEnv();
    this._initBackdrop();
    this._buildHermesCharacter();
    this._buildOpenClawCharacter();
    this._buildSynapseBridge();
    this._buildPhysicsSatellites();
    this._bindEvents();

    this._onResize();
    this._animate();
  }

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: this.transparent,
      preserveDrawingBuffer: this.transparent,
      powerPreference: 'high-performance',
    });
    if (this.transparent) {
      this.renderer.setClearColor(0x000000, 0);
    }
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setSize(this.width, this.height, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  _initSceneAndCamera() {
    this.scene = new THREE.Scene();
    if (!this.transparent) {
      this.scene.background = new THREE.Color('#121318');
    }

    this.camera = new THREE.PerspectiveCamera(32, this.width / this.height, 0.1, 100);
    this.camera.position.set(0, 0.15, 13.2);
    this.camera.lookAt(0, 0, 0);

    this.rootGroup = new THREE.Group();
    this.scene.add(this.rootGroup);
  }

  _initLightsAndEnv() {
    // Generate procedural studio environment map for crisp Matcap-like PBR reflections
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color('#14161D');

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
      new THREE.MeshBasicMaterial({ color: 0x6088ff, side: THREE.DoubleSide })
    );
    leftStrip.position.set(-7, 2, 3);
    leftStrip.lookAt(0, 0, 0);
    envScene.add(leftStrip);

    const rightStrip = new THREE.Mesh(
      stripGeo,
      new THREE.MeshBasicMaterial({ color: 0xff4455, side: THREE.DoubleSide })
    );
    rightStrip.position.set(7, 2, 3);
    rightStrip.lookAt(0, 0, 0);
    envScene.add(rightStrip);

    this.envMap = pmrem.fromScene(envScene, 0.04).texture;
    this.scene.environment = this.envMap;
    pmrem.dispose();

    // Studio Lights
    this.ambientLight = new THREE.AmbientLight('#d8e2ff', 0.85);
    this.scene.add(this.ambientLight);

    this.keyLight = new THREE.DirectionalLight('#ffffff', 2.8);
    this.keyLight.position.set(4, 7, 8);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.set(1024, 1024);
    this.keyLight.shadow.bias = -0.0005;
    this.scene.add(this.keyLight);

    // Hermes Blue Rim Light (Left)
    this.hermesLight = new THREE.PointLight('#1A2FFB', 6.5, 14, 1.5);
    this.hermesLight.position.set(-4.2, 2.2, 3.8);
    this.scene.add(this.hermesLight);

    // OpenClaw Cyan/Crimson Rim Light (Right)
    this.clawLight = new THREE.PointLight('#00F5D4', 5.5, 14, 1.5);
    this.clawLight.position.set(4.2, 2.0, 4.0);
    this.scene.add(this.clawLight);

    // Back Uplight for silhouette separation
    this.backLight = new THREE.PointLight('#3b5bdb', 4.0, 18, 1.4);
    this.backLight.position.set(0, -3.5, -3.0);
    this.scene.add(this.backLight);
  }

  _initBackdrop() {
    // Subtle studio vignette & reactive glow backdrop plane
    const bgGeo = new THREE.PlaneGeometry(36, 22);
    this.bgUniforms = {
      uTime: { value: 0 },
      uGlowColor: { value: new THREE.Color('#162044') },
      uSecondaryGlow: { value: new THREE.Color('#281219') },
      uPointer: { value: new THREE.Vector2(0.5, 0.5) },
      uStageRatio: { value: 0 },
    };

    const bgMat = new THREE.ShaderMaterial({
      uniforms: this.bgUniforms,
      depthWrite: false,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uGlowColor;
        uniform vec3 uSecondaryGlow;
        uniform vec2 uPointer;
        uniform float uStageRatio;
        varying vec2 vUv;

        void main() {
          vec2 uv = vUv;
          vec3 baseDark = vec3(0.068, 0.072, 0.09);

          // Left-center aura (Hermes)
          float dHermes = length((uv - vec2(0.34, 0.52)) * vec2(1.4, 1.0));
          float hermesGlow = smoothstep(0.65, 0.0, dHermes) * 0.65;

          // Right-center aura (OpenClaw)
          float dClaw = length((uv - vec2(0.66, 0.50)) * vec2(1.4, 1.0));
          float clawGlow = smoothstep(0.65, 0.0, dClaw) * 0.65;

          // Pointer reactive spotlight
          float dMouse = length((uv - uPointer) * vec2(1.5, 1.0));
          float mouseGlow = smoothstep(0.45, 0.0, dMouse) * 0.25;

          vec3 col = baseDark;
          col += uGlowColor * (hermesGlow + mouseGlow);
          col += uSecondaryGlow * clawGlow;

          // Subtle studio vignette
          float vig = length((uv - 0.5) * vec2(1.2, 1.1));
          col *= smoothstep(1.15, 0.25, vig);

          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });

    if (!this.transparent) {
      const bgMesh = new THREE.Mesh(bgGeo, bgMat);
      bgMesh.position.set(0, 0, -5.5);
      this.scene.add(bgMesh);
    }

    if (this.pedestal) {
      const pedGroup = new THREE.Group();
      pedGroup.position.set(0, -1.85, 0.2);

      const silverPedMat = new THREE.MeshPhysicalMaterial({
        color: '#E2E8F0',
        roughness: 0.22,
        metalness: 0.78,
        clearcoat: 0.5,
      });
      const navyPedMat = new THREE.MeshPhysicalMaterial({
        color: '#1E3A8A',
        roughness: 0.25,
        metalness: 0.45,
        clearcoat: 0.7,
      });
      const cyanRingMat = new THREE.MeshBasicMaterial({
        color: '#00F5D4',
      });

      // Base metallic silver plate
      const basePlate = new THREE.Mesh(new THREE.CylinderGeometry(3.45, 3.65, 0.28, 64), silverPedMat);
      basePlate.position.y = -0.22;
      pedGroup.add(basePlate);

      // Upper cobalt navy stage disk
      const topPlate = new THREE.Mesh(new THREE.CylinderGeometry(3.05, 3.22, 0.32, 64), navyPedMat);
      topPlate.position.y = 0.05;
      pedGroup.add(topPlate);

      // Glowing neon rim around upper stage
      const rim = new THREE.Mesh(new THREE.TorusGeometry(3.12, 0.035, 16, 96), cyanRingMat);
      rim.rotation.x = Math.PI / 2;
      rim.position.y = 0.21;
      pedGroup.add(rim);

      this.rootGroup.add(pedGroup);
    }
  }

  /**
   * KARAKTER 1: HERMES (Nous Research Cyber-Monochrome Architect)
   * Faithfully stylized in 3D from asset_hermes_nous.jpg:
   * - Monochrome porcelain skin, obsidian hair & bangs with white zig-zag highlight
   * - High cyber collar with raised "N" emblem
   * - Futuristic over-ear headphones with glowing emissive rings
   * - Concentric orbital thought rings (<think>)
   */
  _buildHermesCharacter() {
    this.hermesGroup = new THREE.Group();
    this.hermesGroup.position.set(-2.35, -0.1, 0.3);
    this.rootGroup.add(this.hermesGroup);

    // Shared Materials for Hermes
    const porcelainMat = new THREE.MeshPhysicalMaterial({
      color: '#F2F4F8',
      roughness: 0.32,
      metalness: 0.04,
      clearcoat: 0.25,
      clearcoatRoughness: 0.25,
    });

    const obsidianMat = new THREE.MeshPhysicalMaterial({
      color: '#101218',
      roughness: 0.24,
      metalness: 0.18,
      clearcoat: 0.6,
      clearcoatRoughness: 0.2,
    });

    const obsidianMatteMat = new THREE.MeshStandardMaterial({
      color: '#14171F',
      roughness: 0.48,
      metalness: 0.12,
    });

    const crispWhiteMat = new THREE.MeshPhysicalMaterial({
      color: '#FFFFFF',
      roughness: 0.18,
      metalness: 0.08,
      clearcoat: 0.8,
      clearcoatRoughness: 0.15,
    });

    this.hermesGlowMat = new THREE.MeshStandardMaterial({
      color: '#FFFFFF',
      emissive: '#1A2FFB',
      emissiveIntensity: 2.2,
      roughness: 0.1,
      metalness: 0.2,
    });

    // 1. Sculpted Shoulders & High Collar Bust
    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, -1.38, 0);
    this.hermesGroup.add(torsoGroup);

    // Inner obsidian turtleneck/chest
    const chestGeo = new THREE.CylinderGeometry(0.54, 0.72, 1.05, 32);
    chestGeo.scale(1.25, 1.0, 0.82);
    const chestMesh = new THREE.Mesh(chestGeo, obsidianMat);
    chestMesh.position.set(0, -0.18, -0.04);
    chestMesh.castShadow = true;
    torsoGroup.add(chestMesh);

    // Outer White High-Tech Jacket Collar (Left & Right swept panels)
    const outerCollarGeo = new THREE.CylinderGeometry(0.76, 0.96, 0.95, 32, 1, true, -Math.PI * 0.82, Math.PI * 1.64);
    outerCollarGeo.scale(1.18, 1.0, 0.88);
    const outerCollar = new THREE.Mesh(outerCollarGeo, crispWhiteMat);
    outerCollar.position.set(0, 0.08, -0.02);
    outerCollar.rotation.y = Math.PI;
    torsoGroup.add(outerCollar);

    // Obsidian High Collar Inner Rim
    const innerCollarGeo = new THREE.CylinderGeometry(0.64, 0.68, 0.85, 32, 1, true, -Math.PI * 0.75, Math.PI * 1.5);
    innerCollarGeo.scale(1.1, 1.0, 0.85);
    const innerCollar = new THREE.Mesh(innerCollarGeo, obsidianMat);
    innerCollar.position.set(0, 0.22, -0.02);
    innerCollar.rotation.y = Math.PI;
    torsoGroup.add(innerCollar);

    // Front V-Opening Lapels (Left & Right angled collar flaps)
    const lapelGeo = new THREE.BoxGeometry(0.55, 0.78, 0.14);
    const leftLapel = new THREE.Mesh(lapelGeo, crispWhiteMat);
    leftLapel.position.set(-0.42, 0.05, 0.46);
    leftLapel.rotation.set(0.18, 0.42, -0.18);
    torsoGroup.add(leftLapel);

    const rightLapel = new THREE.Mesh(lapelGeo, obsidianMat);
    rightLapel.position.set(0.42, 0.05, 0.46);
    rightLapel.rotation.set(0.18, -0.42, 0.18);
    torsoGroup.add(rightLapel);

    // Iconic "N" Emblem on Left Collar (Nous Research signature from photo)
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
    const nLeft = new THREE.Mesh(nBarGeo, this.hermesGlowMat);
    nLeft.position.set(-0.08, 0, 0.02);
    const nRight = new THREE.Mesh(nBarGeo, this.hermesGlowMat);
    nRight.position.set(0.08, 0, 0.02);
    const nDiag = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.27, 0.045), this.hermesGlowMat);
    nDiag.position.set(0, 0, 0.02);
    nDiag.rotation.z = 0.58;
    nEmblemGroup.add(nLeft, nRight, nDiag);

    // Neck
    const neckMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.32, 0.65, 24),
      porcelainMat
    );
    neckMesh.position.set(0, 0.55, 0.02);
    torsoGroup.add(neckMesh);

    // 2. Head Group (Rotates slightly for reasoning/dispatch & cursor look)
    this.hermesHead = new THREE.Group();
    this.hermesHead.position.set(0, 0.12, 0.05);
    this.hermesGroup.add(this.hermesHead);

    // Cranium + Anime Jawline
    const craniumGeo = new THREE.SphereGeometry(0.92, 48, 48);
    craniumGeo.scale(0.95, 1.04, 0.96);
    const cranium = new THREE.Mesh(craniumGeo, porcelainMat);
    cranium.castShadow = true;
    this.hermesHead.add(cranium);

    // Tapered Chin/Jaw
    const chinGeo = new THREE.ConeGeometry(0.68, 0.65, 32);
    chinGeo.scale(1.0, 1.0, 0.88);
    const chin = new THREE.Mesh(chinGeo, porcelainMat);
    chin.rotation.x = Math.PI;
    chin.position.set(0, -0.58, 0.12);
    this.hermesHead.add(chin);

    // Subtle Nose & Confident Monochrome Mouth
    const noseGeo = new THREE.ConeGeometry(0.055, 0.18, 4);
    const nose = new THREE.Mesh(noseGeo, porcelainMat);
    nose.position.set(0, -0.10, 0.90);
    nose.rotation.x = Math.PI * 0.35;
    this.hermesHead.add(nose);

    const mouthGeo = new THREE.CapsuleGeometry(0.014, 0.14, 8, 8);
    const mouth = new THREE.Mesh(mouthGeo, obsidianMat);
    mouth.rotation.z = Math.PI / 2;
    mouth.position.set(0, -0.36, 0.84);
    this.hermesHead.add(mouth);

    // 3. Anime Eyes (With cursor-tracking pupils & crisp white catchlights)
    this.hermesEyesGroup = new THREE.Group();
    this.hermesEyesGroup.position.set(0, -0.02, 0.82);
    this.hermesHead.add(this.hermesEyesGroup);

    this.hermesLeftPupil = this._createHermesEye(-0.31, obsidianMat, crispWhiteMat);
    this.hermesRightPupil = this._createHermesEye(0.31, obsidianMat, crispWhiteMat);

    // 4. Sculpted Obsidian Anime Hair + Front Bangs + Zig-Zag White Highlight
    const hairGroup = new THREE.Group();
    this.hermesHead.add(hairGroup);

    // Back/Top Hair Dome
    const hairDomeGeo = new THREE.SphereGeometry(0.99, 40, 40, 0, Math.PI * 2, 0, Math.PI * 0.68);
    hairDomeGeo.scale(0.98, 1.05, 1.02);
    const hairDome = new THREE.Mesh(hairDomeGeo, obsidianMatteMat);
    hairDome.position.set(0, 0.06, -0.04);
    hairDome.rotation.x = -0.18;
    hairGroup.add(hairDome);

    // Sculpted Front Bangs (7 overlapping tapered locks across forehead)
    const bangSpecs = [
      { x: -0.48, y: 0.34, z: 0.72, rx: 0.32, ry: -0.35, rz: 0.22, sx: 0.22, sy: 0.72 },
      { x: -0.28, y: 0.38, z: 0.82, rx: 0.40, ry: -0.18, rz: 0.12, sx: 0.20, sy: 0.76 },
      { x: -0.08, y: 0.40, z: 0.86, rx: 0.44, ry: -0.05, rz: 0.05, sx: 0.22, sy: 0.80 },
      { x: 0.12, y: 0.40, z: 0.85, rx: 0.43, ry: 0.08, rz: -0.06, sx: 0.21, sy: 0.78 },
      { x: 0.30, y: 0.37, z: 0.80, rx: 0.38, ry: 0.20, rz: -0.14, sx: 0.20, sy: 0.72 },
      { x: 0.48, y: 0.33, z: 0.70, rx: 0.30, ry: 0.36, rz: -0.22, sx: 0.22, sy: 0.70 },
    ];

    bangSpecs.forEach((b) => {
      const lockGeo = new THREE.ConeGeometry(b.sx, b.sy, 16);
      lockGeo.scale(1.0, 1.0, 0.38);
      const lock = new THREE.Mesh(lockGeo, obsidianMat);
      lock.position.set(b.x, b.y, b.z);
      lock.rotation.set(Math.PI + b.rx, b.ry, b.rz);
      hairGroup.add(lock);
    });

    // Signature Zig-Zag White Highlight Strip across Front Bangs (from photo!)
    const zigzagPoints = [
      new THREE.Vector3(-0.56, 0.30, 0.77),
      new THREE.Vector3(-0.38, 0.42, 0.85),
      new THREE.Vector3(-0.24, 0.27, 0.88),
      new THREE.Vector3(-0.06, 0.43, 0.91),
      new THREE.Vector3(0.10, 0.28, 0.90),
      new THREE.Vector3(0.28, 0.42, 0.86),
      new THREE.Vector3(0.45, 0.30, 0.79),
    ];
    const zigzagCurve = new THREE.CatmullRomCurve3(zigzagPoints, false, 'catmullrom', 0.15);
    const zigzagGeo = new THREE.TubeGeometry(zigzagCurve, 48, 0.026, 8, false);
    const zigzagMesh = new THREE.Mesh(zigzagGeo, crispWhiteMat);
    hairGroup.add(zigzagMesh);

    // Side Hair Locks framing the cheeks (Left & Right)
    [-1, 1].forEach((dir) => {
      const sideCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(dir * 0.78, 0.35, 0.32),
        new THREE.Vector3(dir * 0.84, -0.10, 0.42),
        new THREE.Vector3(dir * 0.72, -0.62, 0.46),
        new THREE.Vector3(dir * 0.56, -0.98, 0.38),
      ]);
      const sideLockGeo = new THREE.TubeGeometry(sideCurve, 24, 0.14, 12, false);
      sideLockGeo.scale(0.65, 1.0, 1.0);
      const sideLock = new THREE.Mesh(sideLockGeo, obsidianMat);
      hairGroup.add(sideLock);
    });

    // 5. Futuristic Over-Ear Headphones (Thick White Headband + Layered Obsidian/Glow Earcups)
    const headphoneGroup = new THREE.Group();
    this.hermesHead.add(headphoneGroup);

    // Thick White Headband Arch
    const bandGeo = new THREE.TorusGeometry(1.03, 0.11, 20, 48, Math.PI * 1.02);
    bandGeo.scale(0.96, 1.02, 0.55);
    const headband = new THREE.Mesh(bandGeo, crispWhiteMat);
    headband.position.set(0, 0.04, -0.02);
    headband.rotation.z = -Math.PI * 0.01;
    headphoneGroup.add(headband);

    // Inner Black Cushion Arch
    const innerBandGeo = new THREE.TorusGeometry(0.98, 0.06, 16, 40, Math.PI * 0.96);
    innerBandGeo.scale(0.96, 1.02, 0.45);
    const innerBand = new THREE.Mesh(innerBandGeo, obsidianMat);
    innerBand.position.set(0, 0.04, -0.02);
    headphoneGroup.add(innerBand);

    // Left & Right Over-Ear Cups
    this.hermesEarcupRings = [];
    [-1, 1].forEach((dir) => {
      const cupGroup = new THREE.Group();
      cupGroup.position.set(dir * 0.98, -0.08, 0.04);
      cupGroup.rotation.z = -dir * 0.12;
      cupGroup.rotation.y = dir * 0.12;
      headphoneGroup.add(cupGroup);

      // Cushion Pad
      const pad = new THREE.Mesh(
        new THREE.CylinderGeometry(0.44, 0.44, 0.16, 32),
        obsidianMatteMat
      );
      pad.rotation.z = Math.PI / 2;
      cupGroup.add(pad);

      // Outer Obsidian Shell
      const shell = new THREE.Mesh(
        new THREE.CylinderGeometry(0.40, 0.44, 0.22, 32),
        obsidianMat
      );
      shell.rotation.z = Math.PI / 2;
      shell.position.x = dir * 0.12;
      cupGroup.add(shell);

      // White Crescent / C-Ring Accent (Matches photo headphone detail)
      const cRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.28, 0.045, 16, 32, Math.PI * 1.45),
        crispWhiteMat
      );
      cRing.rotation.y = Math.PI / 2;
      cRing.rotation.x = 0.4;
      cRing.position.x = dir * 0.23;
      cupGroup.add(cRing);

      // Glowing Neural Core Ring on Earcup
      const glowRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.16, 0.022, 16, 32),
        this.hermesGlowMat
      );
      glowRing.rotation.y = Math.PI / 2;
      glowRing.position.x = dir * 0.25;
      cupGroup.add(glowRing);
      this.hermesEarcupRings.push(glowRing);
    });

    // 6. Concentric 3D Orbital Thought Rings (<think> Halos around Hermes)
    this.hermesOrbits = new THREE.Group();
    this.hermesOrbits.position.set(0, 0.25, -0.1);
    this.hermesGroup.add(this.hermesOrbits);

    this.orbitRing1 = new THREE.Mesh(
      new THREE.TorusGeometry(1.58, 0.014, 12, 96),
      this.hermesGlowMat
    );
    this.orbitRing1.rotation.set(Math.PI * 0.38, 0.25, 0);
    this.hermesOrbits.add(this.orbitRing1);

    this.orbitRing2 = new THREE.Mesh(
      new THREE.TorusGeometry(1.82, 0.010, 12, 96, Math.PI * 1.35),
      new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.7 })
    );
    this.orbitRing2.rotation.set(-Math.PI * 0.32, -0.3, 0.4);
    this.hermesOrbits.add(this.orbitRing2);
  }

  _createHermesEye(xOffset, darkMat, whiteMat) {
    const eyeGroup = new THREE.Group();
    eyeGroup.position.set(xOffset, 0, 0);
    this.hermesEyesGroup.add(eyeGroup);

    // Upper Eyelash Arch (Bold Anime Style)
    const lashCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.15, 0.06, 0.02),
      new THREE.Vector3(-0.05, 0.12, 0.06),
      new THREE.Vector3(0.06, 0.11, 0.06),
      new THREE.Vector3(0.16, 0.04, 0.01),
    ]);
    const lash = new THREE.Mesh(
      new THREE.TubeGeometry(lashCurve, 20, 0.024, 8, false),
      darkMat
    );
    eyeGroup.add(lash);

    // Eyebrow
    const browCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.16, 0.22, 0.01),
      new THREE.Vector3(0.0, 0.26, 0.05),
      new THREE.Vector3(0.16, 0.21, 0.01),
    ]);
    const brow = new THREE.Mesh(
      new THREE.TubeGeometry(browCurve, 16, 0.014, 8, false),
      darkMat
    );
    eyeGroup.add(brow);

    // Sclera (White backing)
    const sclera = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 24, 24),
      whiteMat
    );
    sclera.scale.set(1.15, 0.92, 0.45);
    eyeGroup.add(sclera);

    // Iris + Catchlight Group (Tracks cursor)
    const pupilGroup = new THREE.Group();
    pupilGroup.position.set(0, -0.01, 0.045);
    eyeGroup.add(pupilGroup);

    const iris = new THREE.Mesh(
      new THREE.CircleGeometry(0.082, 24),
      darkMat
    );
    pupilGroup.add(iris);

    // Crisp Anime Specular Highlights
    const catchlight1 = new THREE.Mesh(
      new THREE.CircleGeometry(0.026, 16),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    catchlight1.position.set(-0.028, 0.028, 0.005);
    pupilGroup.add(catchlight1);

    const catchlight2 = new THREE.Mesh(
      new THREE.CircleGeometry(0.014, 12),
      new THREE.MeshBasicMaterial({ color: '#00F5D4' })
    );
    catchlight2.position.set(0.026, -0.025, 0.005);
    pupilGroup.add(catchlight2);

    return pupilGroup;
  }

  /**
   * KARAKTER 2: OPENCLAW (Autonomous Crimson Execution Bot)
   * Faithfully stylized in 3D from asset_openclaw_bot.jpg:
   * - Plump rounded Crimson Red (#E5252A) body with studio clearcoat & warm sheen
   * - Two recessed deep black eye sockets with glowing Cyan (#00F5D4) pupils that track the cursor
   * - Two curved red top antennae with glowing tips
   * - Two articulated rounded C-shaped pincer claws on left & right sides
   * - Two short stubby cylindrical red legs at the bottom
   */
  _buildOpenClawCharacter() {
    this.openClawGroup = new THREE.Group();
    this.openClawGroup.position.set(2.35, -0.15, 0.4);
    this.rootGroup.add(this.openClawGroup);

    // Inner pivot for hopping, spinning, and tilting
    this.openClawBodyPivot = new THREE.Group();
    this.openClawGroup.add(this.openClawBodyPivot);

    // Signature Crimson Red Material with Studio Subsurface-like Sheen
    this.crimsonMat = new THREE.MeshPhysicalMaterial({
      color: '#E5252A',
      emissive: '#3A0406',
      emissiveIntensity: 0.35,
      roughness: 0.25,
      metalness: 0.06,
      clearcoat: 0.65,
      clearcoatRoughness: 0.2,
      sheen: 0.6,
      sheenColor: new THREE.Color('#FF6B6B'),
    });

    const socketBlackMat = new THREE.MeshBasicMaterial({ color: '#07090E' });

    this.cyanEyeMat = new THREE.MeshStandardMaterial({
      color: '#00F5D4',
      emissive: '#00F5D4',
      emissiveIntensity: 3.2,
      roughness: 0.1,
    });

    this.antennaTipMat = new THREE.MeshStandardMaterial({
      color: '#E5252A',
      emissive: '#00F5D4',
      emissiveIntensity: 0.2,
      roughness: 0.2,
    });

    // 1. Plump Rounded Crimson Body
    const bodyGeo = new THREE.SphereGeometry(1.18, 64, 64);
    bodyGeo.scale(1.06, 0.96, 1.0);
    const bodyMesh = new THREE.Mesh(bodyGeo, this.crimsonMat);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    this.openClawBodyPivot.add(bodyMesh);

    // 2. Two Recessed Black Eye Sockets + Glowing Cyan Pupils (Cursor Tracking!)
    this.clawPupils = [];
    this.clawEyeSockets = [];
    [-0.36, 0.36].forEach((xPos) => {
      const socketGroup = new THREE.Group();
      socketGroup.position.set(xPos, 0.14, 1.12);
      socketGroup.rotation.y = xPos * 0.22;
      socketGroup.rotation.x = -0.08;
      this.openClawBodyPivot.add(socketGroup);
      this.clawEyeSockets.push(socketGroup);

      // Black Socket Oval
      const socketMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.21, 32, 32),
        socketBlackMat
      );
      socketMesh.scale.set(0.95, 1.08, 0.35);
      socketGroup.add(socketMesh);

      // Glowing Cyan Pupil (#00F5D4)
      const pupilMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.088, 24, 24),
        this.cyanEyeMat
      );
      pupilMesh.scale.set(1.0, 1.05, 0.6);
      pupilMesh.position.set(0, 0, 0.065);
      socketGroup.add(pupilMesh);
      this.clawPupils.push(pupilMesh);
    });

    // 3. Two Curved Top Antennae (Spring-animated)
    this.clawAntennae = [];
    [-1, 1].forEach((dir) => {
      const antPivot = new THREE.Group();
      antPivot.position.set(dir * 0.22, 1.05, 0.10);
      this.openClawBodyPivot.add(antPivot);

      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(dir * 0.18, 0.28, 0.08),
        new THREE.Vector3(dir * 0.42, 0.38, 0.14),
      ]);
      const antTube = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 24, 0.068, 16, false),
        this.crimsonMat
      );
      antPivot.add(antTube);

      const antTip = new THREE.Mesh(
        new THREE.SphereGeometry(0.088, 20, 20),
        this.antennaTipMat
      );
      antTip.position.set(dir * 0.42, 0.38, 0.14);
      antPivot.add(antTip);

      this.clawAntennae.push({ pivot: antPivot, dir });
    });

    // 4. Two Articulated Rounded Pincer Claws (Left & Right)
    this.clawArms = [];
    [-1, 1].forEach((dir) => {
      const armGroup = new THREE.Group();
      armGroup.position.set(dir * 1.18, -0.06, 0.25);
      this.openClawBodyPivot.add(armGroup);

      // Shoulder Ball
      const shoulder = new THREE.Mesh(
        new THREE.SphereGeometry(0.24, 24, 24),
        this.crimsonMat
      );
      armGroup.add(shoulder);

      // Upper Pincer Digit (Plump Rounded Claw Lobe)
      const upperJaw = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.20, 0.28, 16, 24),
        this.crimsonMat
      );
      upperJaw.position.set(dir * 0.22, 0.10, 0.16);
      upperJaw.rotation.z = dir * 0.55;
      upperJaw.rotation.x = 0.35;
      armGroup.add(upperJaw);

      // Lower Pincer Thumb Digit
      const lowerJaw = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.14, 0.20, 16, 24),
        this.crimsonMat
      );
      lowerJaw.position.set(dir * 0.18, -0.14, 0.18);
      lowerJaw.rotation.z = -dir * 0.45;
      lowerJaw.rotation.x = -0.25;
      armGroup.add(lowerJaw);

      this.clawArms.push({ group: armGroup, upperJaw, lowerJaw, dir });
    });

    // 5. Two Short Stubby Legs at the Bottom
    this.clawLegs = [];
    [-1, 1].forEach((dir) => {
      const legMesh = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.18, 0.24, 16, 24),
        this.crimsonMat
      );
      legMesh.position.set(dir * 0.38, -1.12, 0.05);
      this.openClawBodyPivot.add(legMesh);
      this.clawLegs.push({ mesh: legMesh, dir });
    });

    // 6. 3D Execution Shockwave Ring around OpenClaw (Pulses during Stage 2: Execution)
    const waveGeo = new THREE.TorusGeometry(1.35, 0.028, 16, 96);
    this.shockwaveMat = new THREE.MeshBasicMaterial({
      color: '#00F5D4',
      transparent: true,
      opacity: 0.0,
    });
    this.shockwaveRing = new THREE.Mesh(waveGeo, this.shockwaveMat);
    this.shockwaveRing.rotation.x = Math.PI * 0.35;
    this.openClawGroup.add(this.shockwaveRing);
  }

  /**
   * 3D NEURAL SYNAPSE BRIDGE (Connects Hermes -> OpenClaw during Babak 2: THE DISPATCH)
   */
  _buildSynapseBridge() {
    this.synapseGroup = new THREE.Group();
    this.rootGroup.add(this.synapseGroup);

    // Cubic Bezier curve from Hermes's right headphone earcup to OpenClaw's antennae
    this.synapseCurve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(-1.25, 0.05, 0.45),
      new THREE.Vector3(-0.35, 1.45, 1.25),
      new THREE.Vector3(0.85, 1.55, 1.25),
      new THREE.Vector3(2.05, 1.05, 0.55)
    );

    // Subtle energy guide tube
    const tubeGeo = new THREE.TubeGeometry(this.synapseCurve, 64, 0.018, 12, false);
    this.synapseTubeMat = new THREE.MeshBasicMaterial({
      color: '#00F5D4',
      transparent: true,
      opacity: 0.08,
    });
    this.synapseTube = new THREE.Mesh(tubeGeo, this.synapseTubeMat);
    this.synapseGroup.add(this.synapseTube);

    // 26 High-Speed Travelling Synapse Photon Packets
    const packetGeo = new THREE.SphereGeometry(0.055, 16, 16);
    for (let i = 0; i < 26; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? '#00F5D4' : '#FFFFFF',
        transparent: true,
        opacity: 0,
      });
      const mesh = new THREE.Mesh(packetGeo, mat);
      this.synapseGroup.add(mesh);
      this.synapsePackets.push({
        mesh,
        mat,
        offset: i / 26,
        speed: 0.85 + (i % 5) * 0.08,
      });
    }
  }

  /**
   * 24 INTERACTIVE 3D AI PHYSICS SATELLITES
   * Replaces Lusion's "+" crosses with AI Capsules, Neural Octahedrons, Data Rings & Orbs
   */
  _buildPhysicsSatellites() {
    this.satellitesGroup = new THREE.Group();
    this.rootGroup.add(this.satellitesGroup);

    const capsuleGeo = new THREE.CapsuleGeometry(0.24, 0.42, 16, 24);
    const octaGeo = new THREE.OctahedronGeometry(0.34, 1);
    const torusGeo = new THREE.TorusGeometry(0.28, 0.09, 16, 36);
    const orbGeo = new THREE.SphereGeometry(0.28, 32, 32);

    const geoms = [capsuleGeo, octaGeo, torusGeo, orbGeo];

    const matObsidian = new THREE.MeshPhysicalMaterial({
      color: '#14171F',
      roughness: 0.22,
      metalness: 0.25,
      clearcoat: 0.8,
      clearcoatRoughness: 0.15,
    });

    const matWhite = new THREE.MeshPhysicalMaterial({
      color: '#F4F6FA',
      roughness: 0.18,
      metalness: 0.08,
      clearcoat: 0.85,
      clearcoatRoughness: 0.12,
    });

    this.matAccentPrimary = new THREE.MeshPhysicalMaterial({
      color: '#1A2FFB',
      emissive: '#0B1566',
      emissiveIntensity: 0.5,
      roughness: 0.18,
      metalness: 0.15,
      clearcoat: 0.9,
    });

    this.matAccentCrimson = new THREE.MeshPhysicalMaterial({
      color: '#E5252A',
      emissive: '#4A0608',
      emissiveIntensity: 0.4,
      roughness: 0.22,
      metalness: 0.1,
      clearcoat: 0.85,
    });

    this.matAccentCyan = new THREE.MeshPhysicalMaterial({
      color: '#00F5D4',
      emissive: '#00F5D4',
      emissiveIntensity: 0.65,
      roughness: 0.15,
      metalness: 0.2,
      clearcoat: 0.9,
    });

    const materials = [
      matObsidian,
      matWhite,
      this.matAccentPrimary,
      this.matAccentCrimson,
      this.matAccentCyan,
    ];

    const count = 24;
    for (let i = 0; i < count; i++) {
      const geom = geoms[i % geoms.length];
      const mat = materials[i % materials.length];
      const mesh = new THREE.Mesh(geom, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // Distribute in an elliptical halo around the two characters
      const angle = (i / count) * Math.PI * 2;
      const ringRadiusX = 4.2 + (i % 3) * 0.95;
      const ringRadiusY = 2.0 + (i % 4) * 0.55;
      const homeX = Math.cos(angle) * ringRadiusX;
      const homeY = Math.sin(angle) * ringRadiusY;
      const homeZ = ((i % 5) - 2) * 0.65 - 0.3;

      const scale = 0.72 + (i % 4) * 0.16;
      mesh.scale.setScalar(scale);
      mesh.position.set(homeX, homeY, homeZ);
      mesh.rotation.set(i * 0.7, i * 1.1, i * 0.4);

      this.satellitesGroup.add(mesh);

      this.physicsNodes.push({
        mesh,
        home: new THREE.Vector3(homeX, homeY, homeZ),
        pos: new THREE.Vector3(homeX, homeY, homeZ),
        vel: new THREE.Vector3(0, 0, 0),
        rotVel: new THREE.Vector3(
          (Math.random() - 0.5) * 1.2,
          (Math.random() - 0.5) * 1.2,
          (Math.random() - 0.5) * 1.2
        ),
        radius: 0.36 * scale,
        phase: i * 0.55,
      });
    }
  }

  _bindEvents() {
    this._onPointerMove = (e) => {
      const rect = this.container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.pointerNDC.set(
        THREE.MathUtils.clamp(x, -1.2, 1.2),
        THREE.MathUtils.clamp(y, -1.2, 1.2)
      );
      this.isPointerInside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
    };

    this._onClick = (e) => {
      const rect = this.container.getBoundingClientRect();
      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      if (!inside) return;

      this.triggerInteractiveBurst();
    };

    // Mobile Touch Drag & Touch Tap interaction
    this._onTouchStart = (e) => {
      if (!e.touches || e.touches.length === 0) return;
      const t = e.touches[0];
      const rect = this.container.getBoundingClientRect();
      this._touchActive = true;
      this._touchStart.set(t.clientX, t.clientY);
      this._touchStartTime = performance.now();

      const x = ((t.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((t.clientY - rect.top) / rect.height) * 2 + 1;
      this.pointerNDC.set(
        THREE.MathUtils.clamp(x, -1.2, 1.2),
        THREE.MathUtils.clamp(y, -1.2, 1.2)
      );
      this.isPointerInside = true;
    };

    this._onTouchMove = (e) => {
      if (!this._touchActive || !e.touches || e.touches.length === 0) return;
      const t = e.touches[0];
      const rect = this.container.getBoundingClientRect();

      const x = ((t.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((t.clientY - rect.top) / rect.height) * 2 + 1;
      this.pointerNDC.set(
        THREE.MathUtils.clamp(x, -1.2, 1.2),
        THREE.MathUtils.clamp(y, -1.2, 1.2)
      );
      this.isPointerInside = true;
    };

    this._onTouchEnd = (e) => {
      this._touchActive = false;
      const elapsed = performance.now() - this._touchStartTime;
      const endTouch = e.changedTouches ? e.changedTouches[0] : null;
      if (endTouch) {
        const dist = Math.hypot(endTouch.clientX - this._touchStart.x, endTouch.clientY - this._touchStart.y);
        // Quick tap without significant drag (< 320ms, < 20px) triggers color burst
        if (elapsed < 320 && dist < 20) {
          this.triggerInteractiveBurst();
        }
      }
      setTimeout(() => {
        if (!this._touchActive) this.isPointerInside = false;
      }, 700);
    };

    // Mobile Gyroscope / DeviceOrientation Parallax
    this._onDeviceOrientation = (e) => {
      if (e.gamma === null || e.beta === null) return;
      // Gamma is left/right roll (-90 to +90)
      const targetGyroX = THREE.MathUtils.clamp(e.gamma / 30, -1, 1);
      // Beta is front/back pitch; typical phone holding angle is ~45deg
      const targetGyroY = THREE.MathUtils.clamp((e.beta - 45) / 30, -1, 1);
      this._gyroSmooth.x = THREE.MathUtils.lerp(this._gyroSmooth.x, targetGyroX, 0.12);
      this._gyroSmooth.y = THREE.MathUtils.lerp(this._gyroSmooth.y, targetGyroY, 0.12);
    };

    window.addEventListener('pointermove', this._onPointerMove, { passive: true });
    window.addEventListener('click', this._onClick, { passive: true });
    this.container.addEventListener('touchstart', this._onTouchStart, { passive: true });
    this.container.addEventListener('touchmove', this._onTouchMove, { passive: true });
    this.container.addEventListener('touchend', this._onTouchEnd, { passive: true });

    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', this._onDeviceOrientation, { passive: true });
    }

    // WebGL Performance: Pause RAF when hero is out of viewport (IntersectionObserver)
    if (typeof IntersectionObserver !== 'undefined') {
      this._intersectionObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry && entry.isIntersecting) {
            this._resume();
          } else {
            this._pause();
          }
        },
        { threshold: 0.05 }
      );
      this._intersectionObserver.observe(this.container);
    }

    // WebGL Performance: Pause RAF when user switches tabs (Page Visibility API)
    this._onVisibilityChange = () => {
      if (document.hidden) {
        this._pause();
      } else {
        const rect = this.container.getBoundingClientRect();
        const inView = rect.bottom > 0 && rect.top < window.innerHeight;
        if (inView) {
          this._resume();
        }
      }
    };
    document.addEventListener('visibilitychange', this._onVisibilityChange);

    this._resizeObserver = new ResizeObserver(() => this._onResize());
    this._resizeObserver.observe(this.container);
  }

  _pause() {
    this._isPaused = true;
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  _resume() {
    if (this._disposed || !this._isPaused) return;
    this._isPaused = false;
    this.clock.getDelta(); // Clear delta so scene doesn't glitch forward
    this._animate();
  }

  /**
   * Triggered when user clicks inside the Hero 3D visual container:
   * - Cycles studio lighting palette
   * - Triggers a radial physics impulse on all 24 satellites
   * - Triggers an immediate Synapse -> Execution burst
   */
  triggerInteractiveBurst() {
    this.paletteIndex = (this.paletteIndex + 1) % PALETTES.length;
    this.palette = PALETTES[this.paletteIndex];

    // Advance storyboard to Dispatch/Execution peak for immediate visual gratification
    this.storyTime = 4.2;
    this.shockwaveProgress = 0.0;

    // Apply radial physics impulse to satellites
    for (let i = 0; i < this.physicsNodes.length; i++) {
      const node = this.physicsNodes[i];
      const dir = node.pos.clone().sub(this.pointerWorld);
      if (dir.lengthSq() < 0.01) dir.set(Math.random() - 0.5, Math.random() - 0.5, 0.5);
      dir.normalize();
      node.vel.addScaledVector(dir, 7.5 + Math.random() * 4.0);
      node.rotVel.set(
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 6
      );
    }
  }

  _onResize() {
    if (!this.container || this._disposed) return;
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || 600;
    if (w === 0 || h === 0) return;

    this.width = w;
    this.height = h;
    this.camera.aspect = w / h;

    // Responsive camera distance so both Hermes & OpenClaw fit comfortably on mobile & desktop
    const aspect = w / h;
    if (aspect < 0.85) {
      this.camera.position.z = 19.5;
      this.hermesGroup.position.x = -1.65;
      this.openClawGroup.position.x = 1.65;
    } else if (aspect < 1.35) {
      this.camera.position.z = 15.5;
      this.hermesGroup.position.x = -2.05;
      this.openClawGroup.position.x = 2.05;
    } else {
      this.camera.position.z = 13.0;
      this.hermesGroup.position.x = -2.35;
      this.openClawGroup.position.x = 2.35;
    }

    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  _updateStoryChoreography(dt) {
    this.storyTime = (this.storyTime + dt) % this.cycleDuration;
    const t = this.storyTime;

    // Determine Act:
    // Act 0 (0.0 - 3.6s): THE REASONING (Hermes <think>)
    // Act 1 (3.6 - 6.4s): THE DISPATCH  (Synapse Beam Hermes -> OpenClaw <tool_call>)
    // Act 2 (6.4 - 10.0s): THE EXECUTION (OpenClaw hops, snaps claws, emits shockwave)
    let reasoningWeight = 0;
    let dispatchWeight = 0;
    let executionWeight = 0;

    if (t < 3.6) {
      this.currentStage = 0;
      reasoningWeight = Math.sin((t / 3.6) * Math.PI);
    } else if (t < 6.4) {
      this.currentStage = 1;
      dispatchWeight = Math.sin(((t - 3.6) / 2.8) * Math.PI);
    } else {
      if (this.currentStage !== 2) {
        this.shockwaveProgress = 0.0;
      }
      this.currentStage = 2;
      executionWeight = Math.sin(((t - 6.4) / 3.6) * Math.PI);
    }

    // Smoothly interpolate palette colors
    this.hermesLight.color.lerp(this.palette.primary, dt * 4);
    this.clawLight.color.lerp(this.palette.secondary, dt * 4);
    this.matAccentPrimary.color.lerp(this.palette.primary, dt * 4);
    this.matAccentCrimson.color.lerp(this.palette.crimson, dt * 4);
    this.bgUniforms.uGlowColor.value.lerp(this.palette.bgGlow, dt * 3);

    // --- 1. ANIMATE HERMES (Left-Center) ---
    const floatHermes = Math.sin(this.elapsed * 1.8) * 0.09;
    this.hermesGroup.position.y = -0.1 + floatHermes;

    // Head orientation: tracks cursor + turns toward OpenClaw during Dispatch
    const lookX = this.pointerSmooth.x * 0.25 + dispatchWeight * 0.28;
    const lookY = -this.pointerSmooth.y * 0.18 + reasoningWeight * 0.08;
    this.hermesHead.rotation.y = THREE.MathUtils.lerp(this.hermesHead.rotation.y, lookX, dt * 6);
    this.hermesHead.rotation.x = THREE.MathUtils.lerp(this.hermesHead.rotation.x, lookY, dt * 6);

    // Hermes Anime Pupils track cursor
    const pupilOffsetX = THREE.MathUtils.clamp(this.pointerSmooth.x * 0.032, -0.035, 0.035);
    const pupilOffsetY = THREE.MathUtils.clamp(this.pointerSmooth.y * 0.024, -0.025, 0.025);
    this.hermesLeftPupil.position.x = pupilOffsetX;
    this.hermesLeftPupil.position.y = -0.01 + pupilOffsetY;
    this.hermesRightPupil.position.x = pupilOffsetX;
    this.hermesRightPupil.position.y = -0.01 + pupilOffsetY;

    // Hermes Orbital Thought Rings spin faster and glow brighter during Stage 0 (Reasoning) & Stage 1 (Dispatch)
    const orbitSpeed = 0.7 + reasoningWeight * 2.4 + dispatchWeight * 1.8;
    this.orbitRing1.rotation.z += dt * orbitSpeed;
    this.orbitRing1.rotation.x = Math.PI * 0.38 + Math.sin(this.elapsed * 1.5) * 0.12;
    this.orbitRing2.rotation.z -= dt * (orbitSpeed * 0.8);
    this.orbitRing2.rotation.y = -0.3 + Math.cos(this.elapsed * 1.2) * 0.15;

    this.hermesGlowMat.emissive.lerp(
      dispatchWeight > 0.3 ? this.palette.secondary : this.palette.primary,
      dt * 6
    );
    this.hermesGlowMat.emissiveIntensity = 1.6 + reasoningWeight * 2.5 + dispatchWeight * 2.0;

    // --- 2. ANIMATE SYNAPSE BRIDGE (Hermes -> OpenClaw) ---
    this.synapseTubeMat.opacity = 0.06 + dispatchWeight * 0.45;
    for (let i = 0; i < this.synapsePackets.length; i++) {
      const pkt = this.synapsePackets[i];
      pkt.offset = (pkt.offset + dt * (0.45 + dispatchWeight * pkt.speed)) % 1.0;
      const pt = this.synapseCurve.getPointAt(pkt.offset);
      pkt.mesh.position.copy(pt);

      // Wave modulation along the curve
      pkt.mesh.position.y += Math.sin(pkt.offset * Math.PI * 4 + this.elapsed * 8) * 0.05;

      const activeAlpha = dispatchWeight > 0.05 ? dispatchWeight : 0.12;
      const edgeFade = Math.sin(pkt.offset * Math.PI);
      pkt.mat.opacity = activeAlpha * edgeFade;
      const s = 0.5 + dispatchWeight * 0.9 * edgeFade;
      pkt.mesh.scale.setScalar(s);
    }

    // --- 3. ANIMATE OPENCLAW (Right-Center) ---
    const floatClaw = Math.sin(this.elapsed * 2.1 + 1.2) * 0.10;
    // Excited hop during Stage 2 (Execution)
    const executionHop = Math.abs(Math.sin((this.elapsed * 7.5))) * executionWeight * 0.36;
    this.openClawGroup.position.y = -0.15 + floatClaw + executionHop;

    // OpenClaw body tilt: faces cursor + leans in during Dispatch + energetic wiggle during Execution
    const clawLookY = this.pointerSmooth.x * 0.32 - dispatchWeight * 0.22 + Math.sin(this.elapsed * 12) * executionWeight * 0.18;
    const clawLookX = -this.pointerSmooth.y * 0.22 + executionWeight * 0.12;
    this.openClawBodyPivot.rotation.y = THREE.MathUtils.lerp(this.openClawBodyPivot.rotation.y, clawLookY, dt * 7);
    this.openClawBodyPivot.rotation.x = THREE.MathUtils.lerp(this.openClawBodyPivot.rotation.x, clawLookX, dt * 7);

    // OpenClaw Cyan Pupils: 3D Cursor Tracking + Blink + Execution Dilation!
    const blinkCycle = this.elapsed % 4.2;
    const isBlinking = blinkCycle > 4.05;
    const pupilScale = isBlinking ? 0.1 : 1.0 + executionWeight * 0.32;

    const clawPupilX = THREE.MathUtils.clamp(this.pointerSmooth.x * 0.075, -0.08, 0.08);
    const clawPupilY = THREE.MathUtils.clamp(this.pointerSmooth.y * 0.065, -0.07, 0.07);

    for (let i = 0; i < this.clawPupils.length; i++) {
      const p = this.clawPupils[i];
      p.position.x = clawPupilX;
      p.position.y = clawPupilY;
      p.scale.set(1.0 + executionWeight * 0.25, pupilScale, 0.6);
    }
    this.cyanEyeMat.emissiveIntensity = 2.8 + dispatchWeight * 1.5 + executionWeight * 3.0;

    // OpenClaw Antennae: Wiggle when receiving Hermes's Dispatch & glow Cyan
    this.antennaTipMat.emissiveIntensity = 0.2 + dispatchWeight * 3.5 + executionWeight * 2.0;
    for (let i = 0; i < this.clawAntennae.length; i++) {
      const ant = this.clawAntennae[i];
      const wiggle =
        Math.sin(this.elapsed * (4 + dispatchWeight * 18 + executionWeight * 12) + i) *
        (0.06 + dispatchWeight * 0.22 + executionWeight * 0.15);
      ant.pivot.rotation.z = wiggle * ant.dir;
    }

    // OpenClaw Pincer Claws: Snap & Wave during Execution!
    for (let i = 0; i < this.clawArms.length; i++) {
      const arm = this.clawArms[i];
      const waveAngle =
        Math.sin(this.elapsed * 3.0 + i * Math.PI) * 0.12 +
        Math.sin(this.elapsed * 14.0 + i) * executionWeight * 0.45;
      arm.group.rotation.z = arm.dir * (0.15 + executionWeight * 0.35) + waveAngle;
      arm.group.rotation.y = -arm.dir * (0.2 + executionWeight * 0.25);

      // Pincer jaw snapping motion
      const snap = Math.abs(Math.sin(this.elapsed * 16.0)) * executionWeight * 0.35;
      arm.upperJaw.rotation.z = arm.dir * (0.55 - snap);
      arm.lowerJaw.rotation.z = -arm.dir * (0.45 - snap);
    }

    // OpenClaw Stubby Legs: Kick rhythmically during hop
    for (let i = 0; i < this.clawLegs.length; i++) {
      const leg = this.clawLegs[i];
      leg.mesh.rotation.x = Math.sin(this.elapsed * 14.0 + i * Math.PI) * executionWeight * 0.45;
    }

    // Execution Shockwave Ring expansion
    if (this.shockwaveProgress >= 0) {
      this.shockwaveProgress += dt * 1.1;
      if (this.shockwaveProgress <= 1.0) {
        const s = 1.0 + this.shockwaveProgress * 2.6;
        this.shockwaveRing.scale.setScalar(s);
        this.shockwaveMat.opacity = (1.0 - this.shockwaveProgress) * 0.65;
      } else {
        this.shockwaveMat.opacity = 0;
        this.shockwaveProgress = -1;
      }
    }
  }

  _updatePhysicsSatellites(dt) {
    // Project 2D mouse NDC into 3D plane z = 0.5
    const vec = new THREE.Vector3(this.pointerNDC.x, this.pointerNDC.y, 0.5);
    vec.unproject(this.camera);
    const dir = vec.sub(this.camera.position).normalize();
    const dist = (0.5 - this.camera.position.z) / dir.z;
    this.prevPointerWorld.copy(this.pointerWorld);
    this.pointerWorld.copy(this.camera.position).addScaledVector(dir, dist);
    this.pointerVel.copy(this.pointerWorld).sub(this.prevPointerWorld).divideScalar(Math.max(dt, 0.008));

    const hermesCenter = this.hermesGroup.position;
    const clawCenter = this.openClawGroup.position;

    for (let i = 0; i < this.physicsNodes.length; i++) {
      const n = this.physicsNodes[i];

      // 1. Harmonic orbital target around home position
      const targetX = n.home.x + Math.cos(this.elapsed * 0.9 + n.phase) * 0.35;
      const targetY = n.home.y + Math.sin(this.elapsed * 1.1 + n.phase) * 0.35;
      const targetZ = n.home.z + Math.sin(this.elapsed * 0.7 + n.phase) * 0.25;

      // Spring attraction to home orbit
      n.vel.x += (targetX - n.pos.x) * 3.2 * dt;
      n.vel.y += (targetY - n.pos.y) * 3.2 * dt;
      n.vel.z += (targetZ - n.pos.z) * 3.2 * dt;

      // Stage 0 (Reasoning): gentle vortex pull toward Hermes
      if (this.currentStage === 0) {
        const toHermes = hermesCenter.clone().sub(n.pos);
        const dH = toHermes.length();
        if (dH > 2.4 && dH < 6.0) {
          n.vel.addScaledVector(toHermes.normalize(), 1.2 * dt);
        }
      }

      // Stage 2 (Execution): radial wave push from OpenClaw
      if (this.currentStage === 2 && this.shockwaveProgress > 0 && this.shockwaveProgress < 0.5) {
        const fromClaw = n.pos.clone().sub(clawCenter);
        const dC = fromClaw.length();
        if (dC > 0.1 && dC < 5.5) {
          n.vel.addScaledVector(fromClaw.normalize(), 4.5 * dt);
        }
      }

      // 2. Keep clear of Hermes & OpenClaw character silhouettes so they never block the faces
      const dHermes = n.pos.distanceTo(hermesCenter);
      if (dHermes < 2.15) {
        const pushH = n.pos.clone().sub(hermesCenter).normalize();
        n.pos.addScaledVector(pushH, (2.15 - dHermes) * 0.5);
        n.vel.addScaledVector(pushH, 4.0 * dt);
      }

      const dClaw = n.pos.distanceTo(clawCenter);
      if (dClaw < 2.05) {
        const pushC = n.pos.clone().sub(clawCenter).normalize();
        n.pos.addScaledVector(pushC, (2.05 - dClaw) * 0.5);
        n.vel.addScaledVector(pushC, 4.0 * dt);
      }

      // 3. Mouse Cursor 3D Repulsion & Wake
      if (this.isPointerInside) {
        const toNode = n.pos.clone().sub(this.pointerWorld);
        const dMouse = toNode.length();
        const influenceRadius = 2.1;
        if (dMouse < influenceRadius && dMouse > 0.001) {
          const factor = (1.0 - dMouse / influenceRadius);
          n.vel.addScaledVector(toNode.normalize(), factor * 14.0 * dt);
          n.vel.addScaledVector(this.pointerVel, factor * 0.12 * dt);
        }
      }

      // 4. Mutual Node-to-Node Elastic Collision
      for (let j = i + 1; j < this.physicsNodes.length; j++) {
        const m = this.physicsNodes[j];
        const diff = n.pos.clone().sub(m.pos);
        const distNodes = diff.length();
        const minDist = n.radius + m.radius + 0.15;
        if (distNodes < minDist && distNodes > 0.001) {
          const norm = diff.normalize();
          const overlap = (minDist - distNodes) * 0.5;
          n.pos.addScaledVector(norm, overlap);
          m.pos.addScaledVector(norm, -overlap);
          n.vel.addScaledVector(norm, 1.8 * dt);
          m.vel.addScaledVector(norm, -1.8 * dt);
        }
      }

      // Integrate & Dampen
      n.vel.multiplyScalar(Math.pow(0.18, dt));
      n.pos.addScaledVector(n.vel, dt);

      n.mesh.position.copy(n.pos);
      n.mesh.rotation.x += n.rotVel.x * dt;
      n.mesh.rotation.y += n.rotVel.y * dt;
      n.mesh.rotation.z += n.rotVel.z * dt;
    }
  }

  _animate() {
    if (this._disposed || this._isPaused) return;
    this._rafId = requestAnimationFrame(() => this._animate());

    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.elapsed += dt;

    // Smooth pointer interpolation
    this.pointerSmooth.lerp(this.pointerNDC, Math.min(1, dt * 8));
    this.bgUniforms.uTime.value = this.elapsed;
    this.bgUniforms.uPointer.value.set(
      this.pointerSmooth.x * 0.5 + 0.5,
      this.pointerSmooth.y * 0.5 + 0.5
    );

    // Subtle parallax on root scene group combining mouse cursor AND mobile gyroscope tilt
    const targetRotY = this.pointerSmooth.x * 0.08 + this._gyroSmooth.x * 0.12;
    const targetRotX = -this.pointerSmooth.y * 0.05 - this._gyroSmooth.y * 0.08;

    this.rootGroup.rotation.y = THREE.MathUtils.lerp(
      this.rootGroup.rotation.y,
      targetRotY,
      dt * 4
    );
    this.rootGroup.rotation.x = THREE.MathUtils.lerp(
      this.rootGroup.rotation.x,
      targetRotX,
      dt * 4
    );

    this._updateStoryChoreography(dt);
    this._updatePhysicsSatellites(dt);

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this._disposed = true;
    this._pause();
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('click', this._onClick);
    if (this.container) {
      this.container.removeEventListener('touchstart', this._onTouchStart);
      this.container.removeEventListener('touchmove', this._onTouchMove);
      this.container.removeEventListener('touchend', this._onTouchEnd);
    }
    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      window.removeEventListener('deviceorientation', this._onDeviceOrientation);
    }
    if (this._intersectionObserver) {
      this._intersectionObserver.disconnect();
    }
    document.removeEventListener('visibilitychange', this._onVisibilityChange);
    if (this._resizeObserver) this._resizeObserver.disconnect();
    this.renderer.dispose();
  }
}

