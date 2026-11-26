import * as THREE from "three";
import {
  createGlossyEyeTexture,
  createGlossyHairMaterial,
  createMatteClayMaterial,
  createVinylSkinMaterial,
} from "./vinylMaterials";

/**
 * Reusable 3D Soft-Vinyl / Toy-Clay Character Rig
 * Built for Skill #12: `galeri-motion-characterflow`
 *
 * Signature Craft (1:1 with `galeri-motion-characterflow.mp4`):
 *  - ZERO black outlines! Smooth satin PBR skin + radial blush + glossy wavy dark hair
 *  - Physical 3D opening/closing upper eyelids (`leftLid`, `rightLid`) over glossy 3D eyeballs!
 *  - Cute sculpted 3D double-bump button nose & curved ears
 *  - Matte clay-cotton rolled-sleeve shirt & pants
 *  - Articulated 5-finger capsule hands (`CapsuleGeometry` fingers + thumb) for lamp tapping,
 *    ear-covering during crimson overload, and First-Person Macro POV notebook writing!
 */

export interface VinylCharacterConfig {
  skinColor?: string;
  hairStyle: "wavy_dark" | "amartya_silver" | "hatta_peci";
  hairColor?: string;
  shirtColor: string;
  pantsColor?: string;
  glasses?: "none" | "thin_round";
  rolledSleeves?: boolean;
}

export interface VinylCharacterRig {
  root: THREE.Group;
  hips: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  leftEye: THREE.Mesh;
  rightEye: THREE.Mesh;
  leftLid: THREE.Mesh;
  rightLid: THREE.Mesh;
  leftBrow: THREE.Mesh;
  rightBrow: THREE.Mesh;
  mouth: THREE.Mesh;
  leftShoulder: THREE.Group;
  leftElbow: THREE.Group;
  leftHand: THREE.Group;
  rightShoulder: THREE.Group;
  rightElbow: THREE.Group;
  rightHand: THREE.Group;
  leftHip: THREE.Group;
  rightHip: THREE.Group;
  setFaceState: (opts: {
    eyelidClose: number; // 0 = wide open, 1 = fully shut sleeping/breathing!
    gazeX?: number; // -1..1
    gazeY?: number; // -1..1
    mood?: "calm" | "worried" | "stressed" | "smile";
  }) => void;
}

/**
 * Builds a cute tactile 5-finger articulated capsule hand (zero clipping, great for Macro POV!)
 */
export function buildCapsuleFiveFingerHand(
  skinMat: THREE.Material,
  side: -1 | 1
): THREE.Group {
  const hand = new THREE.Group();

  // Smooth sculpted rounded vinyl palm (ZERO boxy corners!)
  const palmRound = new THREE.Mesh(new THREE.SphereGeometry(0.062, 18, 14), skinMat);
  palmRound.scale.set(1.04, 0.96, 0.54);
  palmRound.position.set(0, -0.056, 0);
  palmRound.castShadow = true;
  hand.add(palmRound);

  // 4 distinct capsule fingers
  const fingerOffsets = [-0.038, -0.013, 0.013, 0.038];
  const fingerLens = [0.050, 0.060, 0.056, 0.042];
  fingerOffsets.forEach((fx, idx) => {
    const fg = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.0125, fingerLens[idx], 8, 12),
      skinMat
    );
    fg.position.set(fx, -0.106 - fingerLens[idx] * 0.42, 0.003);
    fg.castShadow = true;
    hand.add(fg);
  });

  // Articulated thumb capsule on inner side
  const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.014, 0.044, 8, 12), skinMat);
  thumb.position.set(-side * 0.062, -0.066, 0.020);
  thumb.rotation.z = side * 0.56;
  thumb.rotation.x = 0.22;
  thumb.castShadow = true;
  hand.add(thumb);

  return hand;
}

export function buildVinylCharacter(cfg: VinylCharacterConfig): VinylCharacterRig {
  const skinCol = cfg.skinColor ?? "#C88A62";
  const skinMat = createVinylSkinMaterial(skinCol, false);
  const headSkinMat = createVinylSkinMaterial(skinCol, true);
  const shirtMat = createMatteClayMaterial(cfg.shirtColor);
  const pantsMat = createMatteClayMaterial(cfg.pantsColor ?? "#253966");
  const hairMat = createGlossyHairMaterial(cfg.hairColor ?? "#1B110D");
  const eyeTex = createGlossyEyeTexture("#4A2C1A");
  const eyeMat = new THREE.MeshPhysicalMaterial({
    map: eyeTex,
    roughness: 0.06,
    metalness: 0.0,
    clearcoat: 0.9,
  });
  const darkDetailMat = createMatteClayMaterial("#261914");

  const root = new THREE.Group();
  const hips = new THREE.Group();
  hips.position.y = 0.84;
  root.add(hips);

  const pelvis = new THREE.Mesh(new THREE.SphereGeometry(0.24, 18, 14), pantsMat);
  pelvis.scale.set(1.06, 0.72, 0.85);
  pelvis.castShadow = true;
  hips.add(pelvis);

  // Smooth Continuous Soft-Clay Torso Capsule (ZERO blocky horizontal shoulder seam!)
  const torso = new THREE.Group();
  torso.position.y = 0.08;
  hips.add(torso);

  const chest = new THREE.Mesh(new THREE.CapsuleGeometry(0.245, 0.28, 12, 24), shirtMat);
  chest.scale.set(1.04, 1.0, 0.90);
  chest.position.y = 0.34;
  chest.castShadow = true;
  chest.receiveShadow = true;
  torso.add(chest);

  // Clean White Inner Collar Rim
  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(0.11, 0.022, 10, 22),
    createMatteClayMaterial("#F5F4F0")
  );
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.62;
  torso.add(collar);

  // Smooth Satin Neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.095, 0.14, 16), skinMat);
  neck.position.y = 0.70;
  neck.castShadow = true;
  torso.add(neck);

  // =========================================================================
  // HEAD: Smooth Soft-Vinyl Sphere + Physical 3D Eyelids + Glossy Eyes + Wavy Hair
  // =========================================================================
  const head = new THREE.Group();
  head.position.y = 1.00;
  torso.add(head);

  const headR = 0.305;
  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(headR, 28, 24), headSkinMat);
  // Rotate so radial blush canvas (u~0.25) faces +Z cleanly!
  headMesh.rotation.y = 0;
  headMesh.castShadow = true;
  headMesh.receiveShadow = true;
  head.add(headMesh);

  // Rounded Ears
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.068, 14, 12), skinMat);
    ear.scale.set(0.55, 1.0, 0.72);
    ear.position.set(side * (headR - 0.01), -0.015, -0.01);
    ear.castShadow = true;
    head.add(ear);
  }

  // Cute 2-piece Sculpted Vinyl Button Nose (1:1 charm of galeri-motion-characterflow!)
  const noseBridge = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.038, 6, 10), skinMat);
  noseBridge.position.set(0, -0.012, headR - 0.002);
  noseBridge.rotation.x = -0.25;
  const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.036, 14, 12), skinMat);
  noseTip.scale.set(1.18, 0.88, 0.92);
  noseTip.position.set(0, -0.038, headR + 0.018);
  noseTip.castShadow = true;
  head.add(noseBridge, noseTip);

  // Glossy 3D Eyeballs + Physical 3D Animated Eyelid Domes!
  const buildEyeUnit = (side: -1 | 1) => {
    const ex = side * 0.112;
    const ey = 0.038;
    const ez = headR - 0.042;

    const eyeball = new THREE.Mesh(new THREE.SphereGeometry(0.064, 20, 16), eyeMat);
    eyeball.position.set(ex, ey, ez);
    head.add(eyeball);

    // Physical upper eyelid dome covering the front hemisphere when closed!
    const lid = new THREE.Mesh(
      new THREE.SphereGeometry(0.070, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.56),
      skinMat
    );
    lid.position.set(ex, ey, ez);
    // Dark eyelash rim along the eyelid equator
    const lash = new THREE.Mesh(
      new THREE.TorusGeometry(0.069, 0.008, 8, 22, Math.PI),
      darkDetailMat
    );
    lash.rotation.x = Math.PI / 2;
    lash.position.y = -0.008;
    lid.add(lash);
    head.add(lid);

    // Subtle arched eyebrow
    const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.011, 0.056, 6, 10), darkDetailMat);
    brow.rotation.z = Math.PI / 2;
    brow.position.set(ex, ey + 0.095, ez + 0.038);
    head.add(brow);

    return { eyeball, lid, brow };
  };

  const leftEyeUnit = buildEyeUnit(-1);
  const rightEyeUnit = buildEyeUnit(1);

  // Subtle Expressive Mouth (curved matte strip)
  const mouth = new THREE.Mesh(
    new THREE.TorusGeometry(0.048, 0.0085, 8, 18, Math.PI * 0.72),
    createMatteClayMaterial("#7A453B")
  );
  mouth.position.set(0, -0.112, headR - 0.018);
  mouth.rotation.z = Math.PI * 0.14;
  head.add(mouth);

  // =========================================================================
  // HAIR & ICONIC HEADWEAR (Glossy Sculpted Wavy Cap / Silver / Bung Hatta Peci!)
  // =========================================================================
  if (cfg.hairStyle === "wavy_dark") {
    // Tilted cleanly back off the forehead so eyebrows & full upper forehead breathe naturally!
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(headR + 0.018, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.48),
      hairMat
    );
    cap.rotation.x = -0.54;
    cap.position.set(0, 0.048, -0.02);
    cap.castShadow = true;
    head.add(cap);

    // Sculpted glossy wavy curls perched high along crown & sideburns catching gentle rim lights!
    const waves: Array<[number, number, number, number, number, number]> = [
      [-0.16, 0.26, 0.13, 0.115, 0.105, 0.13],
      [-0.02, 0.30, 0.15, 0.135, 0.115, 0.15],
      [0.14, 0.27, 0.13, 0.120, 0.105, 0.13],
      [0.23, 0.19, 0.03, 0.100, 0.110, 0.13],
      [-0.23, 0.19, 0.03, 0.100, 0.110, 0.13],
      [0.0, 0.32, -0.06, 0.175, 0.115, 0.19],
    ];
    for (const [wx, wy, wz, sx, sy, sz] of waves) {
      const w = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 14), hairMat);
      w.scale.set(sx, sy, sz);
      w.position.set(wx, wy, wz);
      w.castShadow = true;
      head.add(w);
    }
  } else if (cfg.hairStyle === "amartya_silver") {
    // Amartya Sen: Distinguished soft silver-grey swept academic hair!
    const silverMat = createGlossyHairMaterial("#CBD5E1");
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(headR + 0.02, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.54),
      silverMat
    );
    cap.rotation.x = -0.44;
    cap.position.set(0, 0.04, -0.02);
    head.add(cap);
    for (const side of [-1, 1]) {
      const tuft = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 12), silverMat);
      tuft.scale.set(0.75, 1.0, 1.35);
      tuft.position.set(side * 0.25, 0.08, -0.04);
      head.add(tuft);
    }
  } else if (cfg.hairStyle === "hatta_peci") {
    // Mohammad Hatta (Bung Hatta): Iconic matte black Indonesian Peci + neat dark side hair!
    const sideHair = new THREE.Mesh(
      new THREE.SphereGeometry(headR + 0.014, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.48),
      hairMat
    );
    sideHair.rotation.x = -0.35;
    sideHair.position.set(0, 0.02, -0.02);
    head.add(sideHair);

    const peciMat = createMatteClayMaterial("#15161D");
    const peci = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.22, 24), peciMat);
    peci.scale.set(0.95, 1.0, 1.18);
    peci.position.set(0, 0.25, -0.01);
    peci.rotation.x = -0.14;
    peci.castShadow = true;
    head.add(peci);
  }

  // Optional Thin Round Eyeglasses (for Amartya Sen & Bung Hatta!)
  if (cfg.glasses === "thin_round") {
    const rimMat = new THREE.MeshPhysicalMaterial({
      color: "#1E2230",
      roughness: 0.25,
      metalness: 0.7,
    });
    for (const side of [-1, 1]) {
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.078, 0.009, 10, 24), rimMat);
      rim.position.set(side * 0.112, 0.036, headR + 0.025);
      head.add(rim);
    }
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.010, 0.010), rimMat);
    bridge.position.set(0, 0.044, headR + 0.025);
    head.add(bridge);
  }

  // =========================================================================
  // ARTICULATED ARMS WITH ROLLED SLEEVES & 5-FINGER CAPSULE HANDS!
  // =========================================================================
  const buildArm = (side: -1 | 1) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.255, 0.50, 0);
    torso.add(shoulder);

    const sBall = new THREE.Mesh(new THREE.SphereGeometry(0.088, 16, 14), shirtMat);
    sBall.scale.set(0.95, 1.0, 0.95);
    sBall.castShadow = true;
    shoulder.add(sBall);

    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.074, 0.22, 16), shirtMat);
    sleeve.position.y = -0.11;
    sleeve.castShadow = true;
    shoulder.add(sleeve);

    if (cfg.rolledSleeves !== false) {
      const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.082, 0.022, 10, 20), shirtMat);
      cuff.rotation.x = Math.PI / 2;
      cuff.position.y = -0.21;
      shoulder.add(cuff);
    }

    const upperSkin = new THREE.Mesh(new THREE.CylinderGeometry(0.064, 0.058, 0.12, 14), skinMat);
    upperSkin.position.y = -0.26;
    upperSkin.castShadow = true;
    shoulder.add(upperSkin);

    const elbow = new THREE.Group();
    elbow.position.y = -0.32;
    shoulder.add(elbow);

    const eBall = new THREE.Mesh(new THREE.SphereGeometry(0.058, 12, 10), skinMat);
    elbow.add(eBall);

    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.050, 0.24, 14), skinMat);
    forearm.position.y = -0.12;
    forearm.castShadow = true;
    elbow.add(forearm);

    const hand = buildCapsuleFiveFingerHand(skinMat, side);
    hand.position.y = -0.24;
    elbow.add(hand);

    return { shoulder, elbow, hand };
  };

  const leftArm = buildArm(-1);
  const rightArm = buildArm(1);

  // Legs (Matte Clay Pants)
  const buildLeg = (side: -1 | 1) => {
    const hip = new THREE.Group();
    hip.position.set(side * 0.125, -0.06, 0);
    hips.add(hip);
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.088, 0.56, 8, 14), pantsMat);
    leg.position.y = -0.34;
    leg.castShadow = true;
    hip.add(leg);
    return hip;
  };
  const leftHip = buildLeg(-1);
  const rightHip = buildLeg(1);

  // Deterministic Face / Eyelid / Gaze Controller
  const setFaceState: VinylCharacterRig["setFaceState"] = ({
    eyelidClose,
    gazeX = 0,
    gazeY = 0,
    mood = "calm",
  }) => {
    const cl = Math.max(0, Math.min(1, eyelidClose));
    // Open lid rotates cleanly behind eye (-1.32 rad); closed lid wraps fully over eyeball (+0.72 rad, zero white sliver!)
    const lidRotX = -1.32 + cl * 2.04;
    leftEyeUnit.lid.rotation.x = lidRotX;
    rightEyeUnit.lid.rotation.x = lidRotX;

    // Gaze direction on glossy 3D eyeballs
    const gy = gazeX * 0.34;
    const gx = -gazeY * 0.28;
    leftEyeUnit.eyeball.rotation.set(gx, gy, 0);
    rightEyeUnit.eyeball.rotation.set(gx, gy, 0);

    // Subtle brow & mouth emotional posture
    if (mood === "worried" || mood === "stressed") {
      leftEyeUnit.brow.rotation.z = Math.PI / 2 + (mood === "stressed" ? -0.35 : 0.22);
      rightEyeUnit.brow.rotation.z = Math.PI / 2 + (mood === "stressed" ? 0.35 : -0.22);
      mouth.rotation.z = Math.PI * 0.14; // Gentle downturned frown
      mouth.position.y = -0.122;
    } else if (mood === "smile") {
      leftEyeUnit.brow.rotation.z = Math.PI / 2 + 0.08;
      rightEyeUnit.brow.rotation.z = Math.PI / 2 - 0.08;
      mouth.rotation.z = Math.PI * 1.14; // Warm peaceful smile arc
      mouth.position.y = -0.098;
    } else {
      leftEyeUnit.brow.rotation.z = Math.PI / 2;
      rightEyeUnit.brow.rotation.z = Math.PI / 2;
      mouth.rotation.z = Math.PI * 1.14;
      mouth.position.y = -0.105;
    }
  };

  setFaceState({ eyelidClose: 0, mood: "calm" });

  return {
    root,
    hips,
    torso,
    head,
    leftEye: leftEyeUnit.eyeball,
    rightEye: rightEyeUnit.eyeball,
    leftLid: leftEyeUnit.lid,
    rightLid: rightEyeUnit.lid,
    leftBrow: leftEyeUnit.brow,
    rightBrow: rightEyeUnit.brow,
    mouth,
    leftShoulder: leftArm.shoulder,
    leftElbow: leftArm.elbow,
    leftHand: leftArm.hand,
    rightShoulder: rightArm.shoulder,
    rightElbow: rightArm.elbow,
    rightHand: rightArm.hand,
    leftHip,
    rightHip,
    setFaceState,
  };
}
