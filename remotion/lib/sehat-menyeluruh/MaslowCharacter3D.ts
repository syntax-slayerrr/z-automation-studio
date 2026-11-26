import * as THREE from "three";
import { clamp, clamp01, smoothstep, solveTwoBoneIK } from "../zaldy-world/ikSolver3D";
import { createGouacheMaterial } from "./gouachePBR";

// ============================================================================
// ABRAHAM MASLOW (1908–1970) — HISTORICAL 3D RECONSTRUCTION RIG
// Consistent across Video 1 (Scene 04) & Video 2 (Scene 05)!
// Historically grounded likeness based on 1960s archival photographs:
//  - Distinguished mature humanist psychologist (late 50s / early 60s)
//  - Receding silver-grey swept hair at temples & sides
//  - Signature mid-century thick dark tortoiseshell/horn-rimmed eyeglasses
//  - Neatly trimmed salt-and-pepper mustache & gentle warm wise expression
//  - 1960s formal warm charcoal-brown tweed suit jacket, ivory dress shirt,
//    burgundy-terracotta knitted tie & tailored trousers
//  - Dignified educational presenter stance (NEVER clinical therapy!)
// ============================================================================

export interface MaslowPoseParams {
  t: number;
  rootPos?: [number, number, number];
  facingYaw?: number;
  gestureWeight?: number; // 0..1 gentle educational gesture toward hierarchy pyramid
  lookX?: number;
  lookY?: number;
}

export interface MaslowCharacterHandle {
  group: THREE.Group;
  poseAt: (params: MaslowPoseParams) => void;
}

function buildMaslowHeadGeo(): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(0.114, 52, 40);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const nx = v.x / 0.114;
    const ny = v.y / 0.114;
    const nz = v.z / 0.114;

    // Broader distinguished mature oval cranium & jaw
    let sx = 0.94;
    let sy = 1.15;
    let sz = 0.98;
    if (ny < 0.10) {
      const jawT = clamp01((0.10 - ny) / 1.10);
      sx *= 1.0 - jawT * 0.22;
    }
    let x = v.x * sx;
    let y = v.y * sy;
    let z = v.z * sz;
    if (nz > 0.2) {
      const chinMask = Math.exp(-Math.pow((ny + 0.80) / 0.28, 2)) * Math.exp(-Math.pow(nx / 0.40, 2));
      z += chinMask * 0.008;
    }
    pos.setXYZ(i, x, y, z);
    const az = Math.atan2(x, z);
    uv.setXY(i, 0.5 + az / (Math.PI * 2), clamp01(0.5 + y / 0.68));
  }
  geo.computeVertexNormals();
  return geo;
}

function drawMaslowFace(g: CanvasRenderingContext2D, blink: number, lookX: number) {
  const W = 512;
  const H = 512;

  // Warm mature scholarly skin tone (painterly gouache warmth)
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#E0B697");
  bg.addColorStop(0.5, "#E8C0A2");
  bg.addColorStop(1, "#CFA080");
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);

  // Subtle dignified forehead & laugh lines (wisdom & maturity)
  g.strokeStyle = "rgba(156, 108, 82, 0.34)";
  g.lineWidth = 1.6;
  for (const fy of [205, 214]) {
    g.beginPath();
    g.moveTo(222, fy);
    g.quadraticCurveTo(256, fy - 2, 290, fy);
    g.stroke();
  }

  // Soft warm cheeks
  for (const cx of [222, 290]) {
    const gr = g.createRadialGradient(cx, 268, 2, cx, 268, 20);
    gr.addColorStop(0, "rgba(216, 128, 108, 0.24)");
    gr.addColorStop(1, "rgba(216, 128, 108, 0)");
    g.fillStyle = gr;
    g.beginPath();
    g.arc(cx, 268, 20, 0, Math.PI * 2);
    g.fill();
  }

  // Gentle wise eyes behind spectacles
  const ey = 247;
  for (const sx of [-1, 1] as const) {
    const ex = 256 + sx * 27;
    const open = clamp(0.88 * (1 - blink * 0.95), 0.04, 1.0);
    const eh = 11.5 * open;

    if (open <= 0.08) {
      g.strokeStyle = "#3A2B24";
      g.lineWidth = 2.2;
      g.beginPath();
      g.moveTo(ex - 11, ey + 1);
      g.quadraticCurveTo(ex, ey + 4, ex + 11, ey + 1);
      g.stroke();
    } else {
      g.save();
      g.beginPath();
      g.ellipse(ex, ey, 11.5, eh * 0.62, 0, 0, Math.PI * 2);
      g.fillStyle = "#F5EFE4";
      g.fill();
      g.clip();
      const ix = ex + clamp(lookX * 3.5, -3.5, 3.5);
      g.fillStyle = "#4A3A2E";
      g.beginPath();
      g.arc(ix, ey, 5.6, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#1B1410";
      g.beginPath();
      g.arc(ix, ey, 2.5, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#FFF8EC";
      g.beginPath();
      g.arc(ix - 1.6, ey - 1.6, 1.4, 0, Math.PI * 2);
      g.fill();
      g.restore();

      g.strokeStyle = "#3A2B24";
      g.lineWidth = 2.0;
      g.beginPath();
      g.moveTo(ex - 11.5, ey);
      g.quadraticCurveTo(ex, ey - eh * 0.72, ex + 11.5, ey);
      g.stroke();
    }

    // Thick dignified grey-brown eyebrows
    g.fillStyle = "#6F6B68";
    g.beginPath();
    g.ellipse(ex, ey - 13, 13, 3.4, sx * 0.06, 0, Math.PI * 2);
    g.fill();
  }

  // Subtle nasolabial warmth lines
  g.strokeStyle = "rgba(148, 100, 74, 0.30)";
  g.lineWidth = 1.6;
  for (const sx of [-1, 1]) {
    g.beginPath();
    g.moveTo(256 + sx * 16, 266);
    g.quadraticCurveTo(256 + sx * 22, 282, 256 + sx * 19, 298);
    g.stroke();
  }

  // Warm dignified gentle closed smile below mustache
  g.strokeStyle = "#7D483C";
  g.lineWidth = 2.2;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(241, 294);
  g.quadraticCurveTo(256, 299.5, 271, 294);
  g.stroke();
}

export function buildMaslowCharacter3D(options?: { sceneScale?: number }): MaslowCharacterHandle {
  const sceneScale = options?.sceneScale ?? 1.0;
  const root = new THREE.Group();
  root.name = "AbrahamMaslowHistorical3D";
  const metricRoot = new THREE.Group();
  metricRoot.scale.setScalar(sceneScale);
  root.add(metricRoot);

  const faceCanvas = document.createElement("canvas");
  faceCanvas.width = 512;
  faceCanvas.height = 512;
  const faceCtx = faceCanvas.getContext("2d")!;
  drawMaslowFace(faceCtx, 0, 0);
  const faceTex = new THREE.CanvasTexture(faceCanvas);
  faceTex.colorSpace = THREE.SRGBColorSpace;
  let lastKey = "";

  const headSkinMat = new THREE.MeshPhysicalMaterial({
    map: faceTex,
    roughness: 0.68,
    sheen: 0.25,
    sheenColor: "#F5D0B5",
  });
  const skinMat = createGouacheMaterial({
    baseHex: "#E3B99B",
    lightHex: "#F4D1B8",
    darkHex: "#BE9072",
    seed: 301,
    roughness: 0.68,
    normalScale: 0.2,
  });

  // 1960s Academic Tweed Suit & Accessories
  const tweedMat = createGouacheMaterial({
    baseHex: "#433B36",
    lightHex: "#625750",
    darkHex: "#2B2522",
    seed: 302,
    roughness: 0.86,
    sheen: 0.22,
    sheenColor: "#7E7066",
    tweedWeave: true,
    repeatX: 2,
    repeatY: 2,
    normalScale: 0.55,
  });
  const lapelMat = new THREE.MeshStandardMaterial({ color: "#342E2A", roughness: 0.82 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: "#F1E9D8", roughness: 0.72 });
  const tieMat = createGouacheMaterial({
    baseHex: "#8C3832",
    lightHex: "#B5524A",
    darkHex: "#5E221E",
    seed: 303,
    roughness: 0.74,
    normalScale: 0.35,
  });
  const trouserMat = new THREE.MeshStandardMaterial({ color: "#2D2826", roughness: 0.84 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: "#261B16", roughness: 0.42, metalness: 0.1 });
  const silverHairMat = createGouacheMaterial({
    baseHex: "#A6AAB2",
    lightHex: "#CFD4DC",
    darkHex: "#727780",
    seed: 304,
    roughness: 0.78,
    sheen: 0.35,
    sheenColor: "#E4E8F0",
    normalScale: 0.4,
  });
  const glassesFrameMat = new THREE.MeshPhysicalMaterial({
    color: "#1F1916",
    roughness: 0.25,
    metalness: 0.15,
    clearcoat: 0.8,
  });
  const lensMat = new THREE.MeshPhysicalMaterial({
    color: "#E8F4FA",
    roughness: 0.08,
    transparent: true,
    opacity: 0.24,
    clearcoat: 1.0,
  });

  // Pelvis & Tailored Trousers
  const pelvisGroup = new THREE.Group();
  pelvisGroup.position.set(0, 0.94, 0);
  metricRoot.add(pelvisGroup);
  const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.148, 0.152, 0.16, 20), trouserMat);
  pelvis.scale.set(1, 1, 0.74);
  pelvisGroup.add(pelvis);

  // Legs (dignified calm academic stance)
  for (const sx of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(sx * 0.10, 0.90, 0);
    const upperLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.056, 0.46, 16), trouserMat);
    upperLeg.position.y = -0.23;
    upperLeg.castShadow = true;
    const lowerLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.044, 0.42, 16), trouserMat);
    lowerLeg.position.y = -0.65;
    lowerLeg.castShadow = true;
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.094, 0.052, 0.235), shoeMat);
    shoe.position.set(0, -0.875, 0.048);
    leg.add(upperLeg, lowerLeg, shoe);
    metricRoot.add(leg);
  }

  // Torso & 1960s Tweed Suit Jacket
  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, 0.96, 0);
  metricRoot.add(torsoGroup);

  const innerShirt = new THREE.Mesh(new THREE.CylinderGeometry(0.118, 0.132, 0.42, 22), shirtMat);
  innerShirt.scale.set(1, 1, 0.68);
  innerShirt.position.y = 0.22;
  torsoGroup.add(innerShirt);

  // Warm tweed shoulder yoke sealing top seam cleanly around neck
  const shoulderYoke = new THREE.Mesh(new THREE.SphereGeometry(0.168, 22, 14), tweedMat);
  shoulderYoke.scale.set(1.06, 0.36, 0.72);
  shoulderYoke.position.set(0, 0.432, -0.004);
  torsoGroup.add(shoulderYoke);

  const jacketPts = [
    new THREE.Vector2(0.162, -0.14),
    new THREE.Vector2(0.160, 0.04),
    new THREE.Vector2(0.168, 0.20),
    new THREE.Vector2(0.184, 0.39),
    new THREE.Vector2(0.168, 0.45),
    new THREE.Vector2(0.082, 0.48),
  ];
  const jacket = new THREE.Mesh(
    new THREE.LatheGeometry(jacketPts, 28, 0.32, Math.PI * 2 - 0.64),
    tweedMat
  );
  jacket.scale.set(1.03, 1.0, 0.74);
  jacket.castShadow = true;
  torsoGroup.add(jacket);

  // Lapels, Crisp Collar & Burgundy Tie
  for (const sx of [-1, 1]) {
    const lapel = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.24, 0.010), lapelMat);
    lapel.position.set(sx * 0.056, 0.32, 0.118);
    lapel.rotation.set(-0.06, sx * 0.16, sx * 0.16);
    torsoGroup.add(lapel);
  }
  const tieKnot = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.026, 0.014), tieMat);
  tieKnot.position.set(0, 0.445, 0.106);
  const tieBlade = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.29, 0.008), tieMat);
  tieBlade.position.set(0, 0.295, 0.112);
  const pocketSquare = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.016, 0.006), shirtMat);
  pocketSquare.position.set(0.085, 0.34, 0.122);
  pocketSquare.rotation.z = 0.12;
  torsoGroup.add(tieKnot, tieBlade, pocketSquare);

  // Neck & Head
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.056, 0.11, 18), skinMat);
  neck.position.set(0, 0.515, -0.004);
  torsoGroup.add(neck);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.645, 0.004);
  torsoGroup.add(headGroup);

  const headMesh = new THREE.Mesh(buildMaslowHeadGeo(), headSkinMat);
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // Distinguished Nose & Ears
  const nose = new THREE.Mesh(new THREE.CapsuleGeometry(0.0085, 0.026, 6, 10), skinMat);
  nose.position.set(0, -0.004, 0.110);
  nose.rotation.x = -0.18;
  const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.0115, 12, 10), skinMat);
  noseTip.position.set(0, -0.015, 0.115);
  headGroup.add(nose, noseTip);

  for (const sx of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 10), skinMat);
    ear.scale.set(0.35, 1.16, 0.70);
    ear.position.set(sx * 0.102, -0.005, -0.006);
    headGroup.add(ear);
  }

  // Iconic Neatly Trimmed Salt-and-Pepper Mustache!
  const mustacheGrp = new THREE.Group();
  mustacheGrp.position.set(0, -0.036, 0.106);
  const mustMat = new THREE.MeshStandardMaterial({ color: "#8B8A8C", roughness: 0.86 });
  for (const sx of [-1, 1]) {
    const mHalf = new THREE.Mesh(new THREE.CapsuleGeometry(0.0085, 0.022, 6, 10), mustMat);
    mHalf.rotation.z = Math.PI / 2 + sx * -0.18;
    mHalf.rotation.y = sx * -0.22;
    mHalf.position.set(sx * 0.016, -0.002, -0.002);
    mustacheGrp.add(mHalf);
  }
  headGroup.add(mustacheGrp);

  // Iconic 1960s Thick Horn-Rimmed Glasses!
  const glassesGrp = new THREE.Group();
  glassesGrp.position.set(0, 0.008, 0.108);
  for (const sx of [-1, 1]) {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.023, 0.0036, 10, 24), glassesFrameMat);
    rim.scale.set(1.16, 0.90, 1.0);
    rim.position.set(sx * 0.034, 0, 0);
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.022, 20), lensMat);
    lens.scale.set(1.14, 0.88, 1.0);
    lens.position.set(sx * 0.034, 0, -0.001);
    const temple = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.005, 0.115), glassesFrameMat);
    temple.position.set(sx * 0.062, 0.004, -0.055);
    glassesGrp.add(rim, lens, temple);
  }
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.005, 0.005), glassesFrameMat);
  bridge.position.set(0, 0.004, 0.002);
  glassesGrp.add(bridge);
  headGroup.add(glassesGrp);

  // Receding Silver-Grey Academic Hair (`phi = 1.12*PI .. 1.88*PI` = exact `-Z` back of skull!)
  const hairGrp = new THREE.Group();
  const backHair = new THREE.Mesh(
    new THREE.SphereGeometry(0.115, 28, 22, Math.PI * 1.12, Math.PI * 0.76, Math.PI * 0.10, Math.PI * 0.62),
    silverHairMat
  );
  backHair.scale.set(1.00, 1.12, 1.05);
  backHair.position.set(0, 0.015, -0.014);
  hairGrp.add(backHair);

  const crownWisp = new THREE.Mesh(new THREE.SphereGeometry(0.082, 20, 14), silverHairMat);
  crownWisp.scale.set(1.06, 0.36, 0.96);
  crownWisp.position.set(0, 0.116, -0.036);
  hairGrp.add(crownWisp);

  for (const sx of [-1, 1]) {
    const sideTuft = new THREE.Mesh(new THREE.CapsuleGeometry(0.022, 0.076, 8, 12), silverHairMat);
    sideTuft.position.set(sx * 0.098, 0.048, -0.016);
    sideTuft.rotation.set(0.32, 0, sx * 0.22);
    const upperSide = new THREE.Mesh(new THREE.SphereGeometry(0.038, 14, 12), silverHairMat);
    upperSide.scale.set(0.76, 0.84, 1.32);
    upperSide.position.set(sx * 0.084, 0.086, -0.026);
    hairGrp.add(sideTuft, upperSide);
  }
  headGroup.add(hairGrp);

  // 2-Bone IK Tweed Suit Arms
  const UPPER = 0.285;
  const FORE = 0.255;
  const makeArm = (sx: -1 | 1) => {
    const sh = new THREE.Group();
    const sCap = new THREE.Mesh(new THREE.SphereGeometry(0.048, 12, 10), tweedMat);
    const up = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.041, UPPER, 16), tweedMat);
    up.position.y = -UPPER / 2;
    up.castShadow = true;
    sh.add(sCap, up);

    const el = new THREE.Group();
    el.position.y = -UPPER;
    const eCap = new THREE.Mesh(new THREE.SphereGeometry(0.040, 12, 10), tweedMat);
    const fo = new THREE.Mesh(new THREE.CylinderGeometry(0.040, 0.034, FORE, 16), tweedMat);
    fo.position.y = -FORE / 2;
    fo.castShadow = true;
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.033, 0.022, 14), shirtMat);
    cuff.position.y = -FORE + 0.008;
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.034, 12, 10), skinMat);
    hand.scale.set(0.85, 1.22, 0.48);
    hand.position.y = -FORE - 0.028;
    el.add(eCap, fo, cuff, hand);
    sh.add(el);
    metricRoot.add(sh);
    return { sh, el, sx };
  };
  const armL = makeArm(-1);
  const armR = makeArm(1);

  function poseAt(params: MaslowPoseParams) {
    const {
      t,
      rootPos = [0, 0, 0],
      facingYaw = 0,
      gestureWeight = 0.75,
      lookX = 0,
      lookY = 0,
    } = params;

    root.position.set(...rootPos);
    root.rotation.set(0, facingYaw, 0);

    const breath = Math.sin(t * 1.5) * 0.004;
    torsoGroup.position.set(0, 0.96 + breath, 0);
    torsoGroup.rotation.set(0.02, Math.sin(t * 0.6) * 0.03, 0);
    headGroup.rotation.set(
      clamp(-lookY * 0.25 + Math.sin(t * 1.2) * 0.025, -0.3, 0.3),
      clamp(lookX * 0.42, -0.5, 0.5),
      Math.sin(t * 0.8) * 0.02
    );

    const gLift = clamp01(gestureWeight);
    const shL = new THREE.Vector3(-0.175, 1.38 + breath, 0);
    const shR = new THREE.Vector3(0.175, 1.38 + breath, 0);

    // Left hand calm near lapel/waist; Right hand presenting openly toward Maslow Pyramid!
    const tgtL = new THREE.Vector3(-0.20, 0.94 + Math.sin(t * 1.4) * 0.012, 0.14);
    const tgtR = new THREE.Vector3(
      0.24 + gLift * 0.16,
      0.98 + gLift * 0.24 + Math.sin(t * 1.8) * 0.02,
      0.16 + gLift * 0.18
    );

    const ikL = solveTwoBoneIK(shL, tgtL, UPPER, FORE, new THREE.Vector3(-0.7, -0.4, -0.5).normalize());
    const ikR = solveTwoBoneIK(shR, tgtR, UPPER, FORE, new THREE.Vector3(0.7, -0.4, -0.5).normalize());

    armL.sh.position.copy(shL);
    armL.sh.quaternion.copy(ikL.upperQuat);
    armL.el.quaternion.copy(ikL.lowerQuat);

    armR.sh.position.copy(shR);
    armR.sh.quaternion.copy(ikR.upperQuat);
    armR.el.quaternion.copy(ikR.lowerQuat);

    const blinkCyc = (t * 0.22 + 0.2) % 1.0;
    const blink = blinkCyc > 0.96 ? Math.sin(((blinkCyc - 0.96) / 0.04) * Math.PI) : 0;
    const key = `${Math.round(blink * 5)}|${Math.round(lookX * 6)}`;
    if (key !== lastKey) {
      lastKey = key;
      drawMaslowFace(faceCtx, blink, lookX);
      faceTex.needsUpdate = true;
    }
  }

  return { group: root, poseAt };
}
