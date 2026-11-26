import * as THREE from "three";

/**
 * Reusable Living 3D Characters & Animated Crowd Engine for Skill #13: `galeri-motion-worldforge`
 * Matches the clean matte stylized human silhouette of `galeri-motion-worldforge-roma.mp4`
 * WITH full expressive hero articulation so protagonists, citizens, officials, & historical figures
 * live naturally inside the 3D architectural world!
 *
 *  - ZERO black ink outlines, ZERO glossy toy clearcoat plastic!
 *  - Smooth matte architectural clay materials (`roughness: 0.78-0.86`)
 *  - Supports Hero Characters (Ardi, Child, Mother, Amartya Sen, Mohammad Hatta, Judge, Engineer,
 *    Executives, Relief Worker) with animated walk cycles, gestures, head turns, and held props
 *    (yellow jerrycan, umbrella, notebook, gavel, safety helmet, briefcase, aid box!)
 *  - Lightweight Animated Crowd Citizens populating streets, alleys, queues, and plazas!
 */

export type WorldForgeProp =
  | "none"
  | "jerrycan"
  | "umbrella"
  | "notebook"
  | "briefcase"
  | "aid_box"
  | "gavel";

export interface WorldForgeCharacterConfig {
  skinColor?: string;
  shirtColor: string;
  pantsColor?: string;
  hairColor?: string;
  hairStyle?: "short" | "bun" | "silver" | "peci" | "hardhat" | "hijab";
  hijabColor?: string;
  glasses?: boolean;
  scale?: number;
  prop?: WorldForgeProp;
}

export interface WorldForgeActor {
  root: THREE.Group;
  hips: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  propGroup: THREE.Group;
  setWalkCycle: (phase: number, amplitude?: number) => void;
  setPose: (opts: {
    headYaw?: number;
    headPitch?: number;
    torsoPitch?: number;
    leftArmX?: number;
    leftArmZ?: number;
    rightArmX?: number;
    rightArmZ?: number;
    sit?: boolean;
  }) => void;
}

function matte(hex: string, roughness = 0.82): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: hex, roughness, metalness: 0.0 });
}

export function buildWorldForgeActor(cfg: WorldForgeCharacterConfig): WorldForgeActor {
  const skinMat = matte(cfg.skinColor ?? "#C9936D", 0.72);
  const shirtMat = matte(cfg.shirtColor, 0.85);
  const pantsMat = matte(cfg.pantsColor ?? "#2D384C", 0.88);
  const hairMat = matte(cfg.hairColor ?? "#261B15", 0.78);
  const shoeMat = matte("#222020", 0.86);
  const darkMat = matte("#1E1A18", 0.80);

  const root = new THREE.Group();
  const scale = cfg.scale ?? 1.0;
  root.scale.setScalar(scale);

  const hips = new THREE.Group();
  hips.position.y = 0.86;
  root.add(hips);

  // Clean matte pelvis bridge so ZERO gap ever appears between shirt and legs!
  const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.16, 0.24), pantsMat);
  pelvis.position.y = -0.02;
  hips.add(pelvis);

  // Legs
  const buildLeg = (side: -1 | 1) => {
    const legPivot = new THREE.Group();
    legPivot.position.set(side * 0.105, -0.02, 0);
    hips.add(legPivot);

    const legMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.074, 0.058, 0.78, 12), pantsMat);
    legMesh.position.y = -0.39;
    legMesh.castShadow = true;
    legPivot.add(legMesh);

    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.08, 0.20), shoeMat);
    shoe.position.set(0, -0.80, 0.04);
    shoe.castShadow = true;
    legPivot.add(shoe);

    return legPivot;
  };
  const leftLeg = buildLeg(-1);
  const rightLeg = buildLeg(1);

  // Torso (smooth matte rounded shoulders + clean tapered architectural tunic!)
  const torso = new THREE.Group();
  torso.position.y = 0.02;
  hips.add(torso);

  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.22, 0.56, 16), shirtMat);
  chest.scale.set(1.06, 1.0, 0.78);
  chest.position.y = 0.29;
  chest.castShadow = true;
  chest.receiveShadow = true;
  torso.add(chest);

  const shoulderCap = new THREE.Mesh(new THREE.SphereGeometry(0.215, 16, 12), shirtMat);
  shoulderCap.scale.set(1.12, 0.48, 0.80);
  shoulderCap.position.y = 0.57;
  shoulderCap.castShadow = true;
  torso.add(shoulderCap);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.074, 0.10, 10), skinMat);
  neck.position.y = 0.65;
  torso.add(neck);

  // Head
  const head = new THREE.Group();
  head.position.y = 0.84;
  torso.add(head);

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.185, 16, 14), skinMat);
  skull.scale.set(0.96, 1.06, 0.96);
  skull.castShadow = true;
  head.add(skull);

  // Subtle Expressive Matte Eyes & Brows (clean & readable in close-ups without cartoon ink!)
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), darkMat);
    eye.position.set(side * 0.064, 0.015, 0.168);
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.012, 0.012), darkMat);
    brow.position.set(side * 0.064, 0.056, 0.172);
    head.add(eye, brow);
  }
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), skinMat);
  nose.position.set(0, -0.018, 0.186);
  head.add(nose);

  // Hair / Headwear Style
  const style = cfg.hairStyle ?? "short";
  if (style === "short" || style === "silver") {
    const hMat = style === "silver" ? matte("#CBD5E1", 0.76) : hairMat;
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.194, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.56),
      hMat
    );
    cap.rotation.x = -0.45;
    cap.position.set(0, 0.025, -0.012);
    cap.castShadow = true;
    head.add(cap);
  } else if (style === "bun") {
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.194, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58),
      hairMat
    );
    cap.rotation.x = -0.42;
    cap.position.set(0, 0.02, -0.01);
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.095, 12, 10), hairMat);
    bun.position.set(0, 0.06, -0.21);
    head.add(cap, bun);
  } else if (style === "hijab") {
    const hjMat = matte(cfg.hijabColor ?? "#4E7D78", 0.86);
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.205, 16, 14, 0, Math.PI * 2, 0, Math.PI * 0.78),
      hjMat
    );
    dome.rotation.x = -0.35;
    dome.position.set(0, 0.01, -0.015);
    const drape = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.24, 14), hjMat);
    drape.position.set(0, -0.15, -0.01);
    head.add(dome, drape);
  } else if (style === "peci") {
    // Mohammad Hatta iconic matte black peci!
    const sideHair = new THREE.Mesh(
      new THREE.SphereGeometry(0.192, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.45),
      hairMat
    );
    sideHair.rotation.x = -0.38;
    sideHair.position.set(0, 0.02, -0.015);
    const peci = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.175, 0.15, 18), matte("#14151B", 0.88));
    peci.scale.set(0.94, 1, 1.18);
    peci.position.set(0, 0.17, -0.01);
    peci.rotation.x = -0.10;
    peci.castShadow = true;
    head.add(sideHair, peci);
  } else if (style === "hardhat") {
    const hatMat = matte("#FACC15", 0.55);
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.205, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5),
      hatMat
    );
    dome.position.y = 0.05;
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.23, 0.024, 18), hatMat);
    brim.position.set(0, 0.05, 0.03);
    head.add(dome, brim);
  }

  if (cfg.glasses) {
    const rimMat = new THREE.MeshStandardMaterial({ color: "#1A1D26", roughness: 0.35, metalness: 0.65 });
    for (const side of [-1, 1]) {
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.046, 0.006, 8, 18), rimMat);
      rim.position.set(side * 0.064, 0.015, 0.185);
      head.add(rim);
    }
    const br = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.007, 0.007), rimMat);
    br.position.set(0, 0.02, 0.185);
    head.add(br);
  }

  // Arms
  const buildArm = (side: -1 | 1) => {
    const armPivot = new THREE.Group();
    armPivot.position.set(side * 0.245, 0.54, 0);
    torso.add(armPivot);

    const sBall = new THREE.Mesh(new THREE.SphereGeometry(0.068, 12, 10), shirtMat);
    armPivot.add(sBall);

    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.056, 0.24, 10), shirtMat);
    sleeve.position.y = -0.12;
    sleeve.castShadow = true;
    armPivot.add(sleeve);

    const lowerArm = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.044, 0.34, 10), skinMat);
    lowerArm.position.y = -0.37;
    lowerArm.castShadow = true;
    armPivot.add(lowerArm);

    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.050, 10, 8), skinMat);
    hand.position.y = -0.55;
    armPivot.add(hand);

    return armPivot;
  };
  const leftArm = buildArm(-1);
  const rightArm = buildArm(1);

  // Held Prop Attached Cleanly to Right Hand (ZERO Clipping!)
  const propGroup = new THREE.Group();
  propGroup.position.set(0, -0.56, 0.04);
  rightArm.add(propGroup);

  const propType = cfg.prop ?? "none";
  if (propType === "jerrycan") {
    const jc = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.36, 0.16), matte("#EAB308", 0.52));
    jc.position.set(0, -0.18, 0.02);
    jc.castShadow = true;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.05, 10), matte("#DC2626", 0.6));
    cap.position.set(0.05, 0.02, 0.02);
    propGroup.add(jc, cap);
  } else if (propType === "umbrella") {
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.92, 8), darkMat);
    shaft.position.set(0, 0.42, 0.04);
    const canopy = new THREE.Mesh(
      new THREE.ConeGeometry(0.56, 0.22, 14),
      matte("#2563EB", 0.75)
    );
    canopy.position.set(0, 0.86, 0.04);
    canopy.castShadow = true;
    propGroup.add(shaft, canopy);
  } else if (propType === "notebook") {
    const nb = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.03, 0.30), matte("#DC2626", 0.72));
    nb.rotation.x = 0.55;
    nb.position.set(-0.08, 0.04, 0.14);
    propGroup.add(nb);
  } else if (propType === "briefcase") {
    const bc = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.28, 0.38), matte("#1F232B", 0.48));
    bc.position.set(0.04, -0.16, 0);
    propGroup.add(bc);
  } else if (propType === "aid_box") {
    const bx = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.26, 0.30), matte("#10B981", 0.78));
    bx.position.set(-0.24, 0.10, 0.22);
    const rb = new THREE.Mesh(new THREE.BoxGeometry(0.37, 0.055, 0.31), matte("#FACC15", 0.65));
    rb.position.copy(bx.position);
    propGroup.add(bx, rb);
  } else if (propType === "gavel") {
    const hdl = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.34, 8), matte("#8B5A2B", 0.55));
    hdl.rotation.x = Math.PI / 2;
    hdl.position.set(0, 0, 0.16);
    const headG = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.16, 12), matte("#5C3A21", 0.52));
    headG.rotation.z = Math.PI / 2;
    headG.position.set(0, 0, 0.32);
    propGroup.add(hdl, headG);
  }

  const setWalkCycle: WorldForgeActor["setWalkCycle"] = (phase, amplitude = 0.52) => {
    const s = Math.sin(phase) * amplitude;
    leftLeg.rotation.x = s;
    rightLeg.rotation.x = -s;
    leftArm.rotation.x = -s * 0.75;
    if (propType === "umbrella") {
      rightArm.rotation.x = -1.25;
    } else if (propType === "aid_box") {
      leftArm.rotation.x = -0.92;
      rightArm.rotation.x = -0.92;
    } else {
      rightArm.rotation.x = s * 0.65;
    }
    hips.position.y = 0.86 + Math.abs(Math.cos(phase)) * 0.032;
  };

  const setPose: WorldForgeActor["setPose"] = ({
    headYaw = 0,
    headPitch = 0,
    torsoPitch = 0,
    leftArmX = 0,
    leftArmZ = 0.06,
    rightArmX = 0,
    rightArmZ = -0.06,
    sit = false,
  }) => {
    head.rotation.set(headPitch, headYaw, 0);
    torso.rotation.set(torsoPitch, 0, 0);
    leftArm.rotation.set(leftArmX, 0, leftArmZ);
    rightArm.rotation.set(rightArmX, 0, rightArmZ);
    if (sit) {
      hips.position.y = 0.48;
      leftLeg.rotation.x = -Math.PI / 2;
      rightLeg.rotation.x = -Math.PI / 2;
    } else {
      hips.position.y = 0.86;
      leftLeg.rotation.x = 0;
      rightLeg.rotation.x = 0;
    }
  };

  return {
    root,
    hips,
    torso,
    head,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    propGroup,
    setWalkCycle,
    setPose,
  };
}
