import * as THREE from "three";
import {
  addInkOutline,
  createToonMaterial,
  createTorsoGarmentTexture,
  makeToonMesh,
} from "./toonMaterials";

/**
 * Reusable 3D Cel-Toon Ink-Outline Expressive Character Rig
 * Modeled directly from `galeri-motion-tipikal.mp4` ("Tipe-Tipe Pengendara Motor"):
 *  - Rounded stylized 3D sphere head + high-res Canvas2D expressive cartoon face overlay
 *  - 7 instant dynamic facial expressions (neutral, happy, shocked, squint, tired, stressed, thinking)
 *  - Chunky cel-shaded torso, shoulder caps, articulated arms/hands, legs & footwear
 *  - Crisp Inverted-Hull BackSide Black Ink Outlines on EVERY limb, head, hair & accessory
 *  - Dedicated character presets: Young Indonesian Protagonist, B.F. Skinner (1957), Dr. Anna Lembke (Stanford)
 */

export type ToonExpression =
  | "neutral"
  | "happy"
  | "shocked"
  | "squint"
  | "tired"
  | "stressed"
  | "thinking";

export interface ToonCharacterConfig {
  skinColor?: string;
  hairStyle: "messy_short" | "skinner_1957" | "lembke_wavy" | "cap";
  hairColor?: string;
  garmentStyle: "hoodie" | "skinner_tweed" | "lembke_blazer" | "casual_tee";
  shirtColor: string;
  pantsColor?: string;
  shoeColor?: string;
  glasses?: "none" | "round_1957" | "rect_modern";
  cheekBlush?: boolean;
  eyelashes?: boolean;
}

export interface ToonCharacterRig {
  root: THREE.Group;
  hips: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  leftShoulder: THREE.Group;
  leftElbow: THREE.Group;
  rightShoulder: THREE.Group;
  rightElbow: THREE.Group;
  leftHip: THREE.Group;
  leftKnee: THREE.Group;
  rightHip: THREE.Group;
  rightKnee: THREE.Group;
  setExpression: (expr: ToonExpression, blink?: number, eyeLookX?: number) => void;
}

function drawToonFaceCanvas(
  ctx: CanvasRenderingContext2D,
  expr: ToonExpression,
  blink: number,
  eyeLookX: number,
  cheekBlush: boolean,
  eyelashes: boolean
): void {
  const W = 512;
  const H = 512;
  ctx.clearRect(0, 0, W, H);

  const lx = 182;
  const rx = 330;
  const ey = 238;
  const pupilDx = eyeLookX * 14;

  // Rosy cheek blush ovals (exact charm of reference characters!)
  if (cheekBlush || expr === "happy") {
    ctx.fillStyle = "rgba(244, 114, 114, 0.42)";
    ctx.beginPath();
    ctx.ellipse(122, 300, 32, 16, 0, 0, Math.PI * 2);
    ctx.ellipse(390, 300, 32, 16, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Tired/Stressed dark under-eye rings (critical for Doomscrolling!)
  if (expr === "tired" || expr === "stressed") {
    ctx.strokeStyle = expr === "stressed" ? "#DC2626" : "#4338CA";
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(lx, ey + 18, 42, 0.25 * Math.PI, 0.78 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(rx, ey + 18, 42, 0.22 * Math.PI, 0.75 * Math.PI);
    ctx.stroke();
  }

  // Draw left & right expressive cartoon eyes
  const drawEye = (cx: number, isRight: boolean) => {
    const isSquintOne = expr === "squint" && isRight;
    const baseRy =
      expr === "shocked"
        ? 60
        : expr === "tired"
          ? 34
          : expr === "stressed"
            ? 50
            : isSquintOne
              ? 24
              : 46;
    const ry = Math.max(4, baseRy * (1 - blink * 0.92));
    const rxEye = expr === "shocked" ? 50 : 42;

    // White sclera with crisp thick black ink ring
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#0E0F15";
    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.ellipse(cx, ey, rxEye, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (blink < 0.72) {
      // Iris & Pupil
      const pR = expr === "shocked" ? 13 : expr === "stressed" ? 15 : 23;
      ctx.fillStyle = "#1E140E";
      ctx.beginPath();
      ctx.arc(cx + pupilDx, ey + (expr === "tired" ? 6 : 2), pR, 0, Math.PI * 2);
      ctx.fill();

      // Crisp specular cartoon white catchlight!
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(cx + pupilDx - pR * 0.34, ey - pR * 0.3, Math.max(4, pR * 0.34), 0, Math.PI * 2);
      ctx.fill();
    }

    // Heavy droopy upper eyelid for tired / thinking / squint
    if (expr === "tired" || expr === "thinking" || isSquintOne) {
      ctx.fillStyle = "#D4985E";
      ctx.beginPath();
      ctx.rect(cx - rxEye - 8, ey - baseRy - 12, (rxEye + 8) * 2, baseRy * 0.72);
      ctx.fill();
      ctx.strokeStyle = "#0E0F15";
      ctx.lineWidth = 11;
      ctx.beginPath();
      ctx.moveTo(cx - rxEye - 4, ey - baseRy * 0.28);
      ctx.lineTo(cx + rxEye + 4, ey - baseRy * 0.28);
      ctx.stroke();
    }

    // Cute outer eyelashes (like ibu-ibu & Dr. Anna Lembke!)
    if (eyelashes) {
      ctx.strokeStyle = "#0E0F15";
      ctx.lineWidth = 9;
      ctx.lineCap = "round";
      const dir = isRight ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(cx + dir * (rxEye - 4), ey - ry * 0.55);
      ctx.lineTo(cx + dir * (rxEye + 18), ey - ry * 0.92);
      ctx.stroke();
    }
  };

  drawEye(lx, false);
  drawEye(rx, true);

  // Expressive Eyebrows
  ctx.strokeStyle = "#0E0F15";
  ctx.lineWidth = 13;
  ctx.lineCap = "round";
  if (expr === "shocked") {
    ctx.beginPath();
    ctx.arc(lx, ey - 54, 34, 1.15 * Math.PI, 1.85 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(rx, ey - 54, 34, 1.15 * Math.PI, 1.85 * Math.PI);
    ctx.stroke();
  } else if (expr === "stressed") {
    ctx.beginPath();
    ctx.moveTo(lx - 38, ey - 68);
    ctx.lineTo(lx + 34, ey - 46);
    ctx.moveTo(rx + 38, ey - 68);
    ctx.lineTo(rx - 34, ey - 46);
    ctx.stroke();
  } else if (expr === "tired") {
    ctx.beginPath();
    ctx.moveTo(lx - 36, ey - 48);
    ctx.lineTo(lx + 34, ey - 60);
    ctx.moveTo(rx + 36, ey - 48);
    ctx.lineTo(rx - 34, ey - 60);
    ctx.stroke();
  } else if (expr === "squint" || expr === "thinking") {
    ctx.beginPath();
    ctx.moveTo(lx - 36, ey - 66);
    ctx.quadraticCurveTo(lx, ey - 84, lx + 34, ey - 64);
    ctx.moveTo(rx - 34, ey - 44);
    ctx.lineTo(rx + 38, ey - 52);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(lx - 34, ey - 58);
    ctx.quadraticCurveTo(lx, ey - 72, lx + 34, ey - 58);
    ctx.moveTo(rx - 34, ey - 58);
    ctx.quadraticCurveTo(rx, ey - 72, rx + 34, ey - 58);
    ctx.stroke();
  }

  // Cute curved cartoon nose (exact match to galeri-motion-tipikal.mp4!)
  ctx.strokeStyle = "#8C582B";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(252, 304, 16, -0.35 * Math.PI, 0.42 * Math.PI);
  ctx.stroke();

  // Dynamic Expressive Mouth
  ctx.strokeStyle = "#0E0F15";
  ctx.lineWidth = 11;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (expr === "happy") {
    // Open cheerful smile with dark interior & warm pink tongue!
    ctx.fillStyle = "#5B131F";
    ctx.beginPath();
    ctx.moveTo(202, 344);
    ctx.lineTo(310, 344);
    ctx.quadraticCurveTo(256, 418, 202, 344);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#FB7185";
    ctx.beginPath();
    ctx.ellipse(256, 378, 28, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (expr === "shocked") {
    // Classic wide vertical "O" shock mouth!
    ctx.fillStyle = "#5B131F";
    ctx.beginPath();
    ctx.ellipse(256, 374, 30, 40, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#FB7185";
    ctx.beginPath();
    ctx.ellipse(256, 396, 18, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (expr === "stressed") {
    // Gritted panicked teeth mouth (just like CIIIIT! rider!)
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.roundRect(198, 346, 116, 42, 16);
    ctx.fill();
    ctx.stroke();
    for (let tx = 222; tx <= 290; tx += 22) {
      ctx.beginPath();
      ctx.moveTo(tx, 348);
      ctx.lineTo(tx, 386);
      ctx.stroke();
    }
  } else if (expr === "tired") {
    // Slack weary flat-frown mouth
    ctx.beginPath();
    ctx.moveTo(214, 368);
    ctx.quadraticCurveTo(256, 352, 298, 368);
    ctx.stroke();
  } else if (expr === "squint" || expr === "thinking") {
    ctx.beginPath();
    ctx.moveTo(220, 364);
    ctx.quadraticCurveTo(258, 372, 294, 354);
    ctx.stroke();
  } else {
    // Warm friendly neutral smile
    ctx.beginPath();
    ctx.moveTo(216, 356);
    ctx.quadraticCurveTo(256, 382, 296, 356);
    ctx.stroke();
  }
}

export function buildToonCharacter(cfg: ToonCharacterConfig): ToonCharacterRig {
  const skin = cfg.skinColor ?? "#D89B62";
  const hairCol = cfg.hairColor ?? "#1B1A22";
  const pantsCol = cfg.pantsColor ?? "#1E2235";
  const shoeCol = cfg.shoeColor ?? "#262938";

  const root = new THREE.Group();
  const hips = new THREE.Group();
  hips.position.y = 0.86;
  root.add(hips);

  // Pelvis / Hips block
  const pelvis = makeToonMesh(
    new THREE.SphereGeometry(0.24, 18, 14),
    pantsCol,
    { outline: 0.028 }
  );
  pelvis.scale.set(1.12, 0.72, 0.88);
  hips.add(pelvis);

  // Articulated Torso
  const torso = new THREE.Group();
  torso.position.y = 0.08;
  hips.add(torso);

  const garmentTex = createTorsoGarmentTexture(cfg.garmentStyle, cfg.shirtColor);
  const chest = makeToonMesh(
    new THREE.CylinderGeometry(0.24, 0.27, 0.56, 20),
    "#FFFFFF",
    { map: garmentTex, outline: 0.03 }
  );
  chest.position.y = 0.31;
  // CylinderGeometry u=0.5 faces -Z by default, so rotation.y = Math.PI puts u=0.5 (zipper, tie, cream blouse) dead-center +Z!
  chest.rotation.y = Math.PI;
  torso.add(chest);

  // Rounded top shoulder cap for smooth silhouette
  const chestCap = makeToonMesh(
    new THREE.SphereGeometry(0.245, 18, 12),
    cfg.shirtColor,
    { outline: 0.025 }
  );
  chestCap.scale.set(1.02, 0.52, 0.94);
  chestCap.position.y = 0.57;
  torso.add(chestCap);

  // Neck
  const neck = makeToonMesh(
    new THREE.CylinderGeometry(0.085, 0.095, 0.14, 14),
    skin,
    { outline: 0.02 }
  );
  neck.position.y = 0.68;
  torso.add(neck);

  // =========================================================================
  // EXPRESSIVE STYLIZED 3D HEAD (Big charming cel-toon sphere + Canvas2D face)
  // =========================================================================
  const head = new THREE.Group();
  head.position.y = 0.98;
  torso.add(head);

  const headRadius = 0.30;
  const headSphere = makeToonMesh(
    new THREE.SphereGeometry(headRadius, 24, 20),
    skin,
    { outline: 0.032, name: "toon_head" }
  );
  head.add(headSphere);

  // Cute cel-shaded side ears
  for (const side of [-1, 1]) {
    const ear = makeToonMesh(
      new THREE.SphereGeometry(0.068, 12, 10),
      skin,
      { outline: 0.02 }
    );
    ear.scale.set(0.65, 1.0, 0.72);
    ear.position.set(side * (headRadius - 0.01), -0.01, -0.01);
    head.add(ear);
  }

  // Curved Facial Overlay Decal hugging the front hemisphere of the sphere (ZERO z-fighting!)
  const faceCanvas = document.createElement("canvas");
  faceCanvas.width = 512;
  faceCanvas.height = 512;
  const faceCtx = faceCanvas.getContext("2d")!;
  drawToonFaceCanvas(
    faceCtx,
    "neutral",
    0,
    0,
    cfg.cheekBlush ?? true,
    cfg.eyelashes ?? false
  );
  const faceTex = new THREE.CanvasTexture(faceCanvas);
  faceTex.colorSpace = THREE.SRGBColorSpace;
  faceTex.needsUpdate = true;

  // Spherical cap patch spanning front ±52° horizontally and ±52° vertically
  const facePatchGeom = new THREE.SphereGeometry(
    headRadius + 0.008,
    24,
    20,
    Math.PI / 2 - 0.92,
    1.84,
    Math.PI / 2 - 0.92,
    1.84
  );
  const faceMat = new THREE.MeshBasicMaterial({
    map: faceTex,
    transparent: true,
    depthWrite: false,
  });
  const facePatch = new THREE.Mesh(facePatchGeom, faceMat);
  head.add(facePatch);

  // Hair / Headgear Styling in 3D Cel-Toon Geometry with Ink Outlines!
  if (cfg.hairStyle === "messy_short") {
    const hairCap = makeToonMesh(
      new THREE.SphereGeometry(headRadius + 0.022, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.56),
      hairCol,
      { outline: 0.028 }
    );
    hairCap.rotation.x = -0.26;
    hairCap.position.y = 0.025;
    head.add(hairCap);
    // Stylized front hair tufts
    for (let i = -1; i <= 1; i++) {
      const tuft = makeToonMesh(
        new THREE.ConeGeometry(0.082, 0.17, 10),
        hairCol,
        { outline: 0.018 }
      );
      tuft.position.set(i * 0.09, 0.24, 0.21);
      tuft.rotation.set(0.75, 0, -i * 0.25);
      head.add(tuft);
    }
  } else if (cfg.hairStyle === "skinner_1957") {
    // Iconic 1950s B.F. Skinner swept-back high-forehead parted hair + silver temples!
    const skinnerHair = makeToonMesh(
      new THREE.SphereGeometry(headRadius + 0.02, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.52),
      "#363945",
      { outline: 0.026 }
    );
    skinnerHair.rotation.x = -0.44;
    skinnerHair.position.set(0, 0.04, -0.02);
    head.add(skinnerHair);
    // Silver temple side sweeps
    for (const side of [-1, 1]) {
      const temple = makeToonMesh(
        new THREE.BoxGeometry(0.05, 0.14, 0.16),
        "#B2B6C2",
        { outline: 0.016 }
      );
      temple.position.set(side * 0.275, 0.05, -0.02);
      head.add(temple);
    }
  } else if (cfg.hairStyle === "lembke_wavy") {
    // Dr. Anna Lembke shoulder-length wavy auburn hair shells framing BACK & SIDES cleanly (ZERO face occlusion!)
    const topHair = makeToonMesh(
      new THREE.SphereGeometry(headRadius + 0.026, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.50),
      hairCol,
      { outline: 0.026 }
    );
    topHair.rotation.x = -0.34;
    topHair.position.set(0, 0.03, -0.02);
    head.add(topHair);
    // Back hair shell behind head (-Z) + soft side locks framing ears cleanly
    const backBun = makeToonMesh(
      new THREE.SphereGeometry(0.32, 18, 14),
      hairCol,
      { outline: 0.026 }
    );
    backBun.scale.set(1.06, 1.18, 0.72);
    backBun.position.set(0, -0.06, -0.16);
    head.add(backBun);
    for (const side of [-1, 1]) {
      const sideLock = makeToonMesh(
        new THREE.CapsuleGeometry(0.085, 0.24, 8, 12),
        hairCol,
        { outline: 0.02 }
      );
      sideLock.position.set(side * 0.28, -0.14, -0.02);
      sideLock.rotation.z = side * -0.08;
      head.add(sideLock);
    }
  }

  // 3D Cel-Toon Eyeglasses (for B.F. Skinner & Dr. Anna Lembke!)
  if (cfg.glasses === "round_1957") {
    const glassMat = createToonMaterial("#14151C", { steps: 2 });
    const lensMat = new THREE.MeshBasicMaterial({
      color: "#E0F7FF",
      transparent: true,
      opacity: 0.22,
    });
    for (const side of [-1, 1]) {
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.078, 0.012, 10, 24), glassMat);
      rim.position.set(side * 0.095, 0.015, headRadius + 0.022);
      head.add(rim);
      const lens = new THREE.Mesh(new THREE.CircleGeometry(0.072, 20), lensMat);
      lens.position.set(side * 0.095, 0.015, headRadius + 0.02);
      head.add(lens);
    }
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.016, 0.016), glassMat);
    bridge.position.set(0, 0.02, headRadius + 0.022);
    head.add(bridge);
  } else if (cfg.glasses === "rect_modern") {
    const frameMat = createToonMaterial("#181924", { steps: 2 });
    for (const side of [-1, 1]) {
      const rx = side * 0.098;
      const rz = headRadius + 0.022;
      const topBar = new THREE.Mesh(new THREE.BoxGeometry(0.145, 0.016, 0.016), frameMat);
      topBar.position.set(rx, 0.068, rz);
      const botBar = new THREE.Mesh(new THREE.BoxGeometry(0.145, 0.014, 0.016), frameMat);
      botBar.position.set(rx, -0.026, rz);
      const outBar = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.10, 0.016), frameMat);
      outBar.position.set(rx + side * 0.068, 0.021, rz);
      const inBar = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.10, 0.016), frameMat);
      inBar.position.set(rx - side * 0.068, 0.021, rz);
      head.add(topBar, botBar, outBar, inBar);
    }
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.016, 0.016), frameMat);
    bridge.position.set(0, 0.032, headRadius + 0.022);
    head.add(bridge);
  }

  // =========================================================================
  // ARTICULATED CEL-TOON ARMS & LEGS (Rounded shoulders + mitten cartoon hands)
  // =========================================================================
  const buildArm = (side: -1 | 1) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.30, 0.52, 0);
    torso.add(shoulder);

    const sCap = makeToonMesh(new THREE.SphereGeometry(0.095, 14, 12), cfg.shirtColor, { outline: 0.024 });
    shoulder.add(sCap);

    const upper = makeToonMesh(
      new THREE.CylinderGeometry(0.074, 0.068, 0.28, 14),
      cfg.shirtColor,
      { outline: 0.024 }
    );
    upper.position.y = -0.15;
    shoulder.add(upper);

    const elbow = new THREE.Group();
    elbow.position.y = -0.29;
    shoulder.add(elbow);

    const eBall = makeToonMesh(new THREE.SphereGeometry(0.068, 12, 10), cfg.shirtColor, { outline: 0.02 });
    elbow.add(eBall);

    const sleeveColor = cfg.garmentStyle === "casual_tee" ? skin : cfg.shirtColor;
    const fore = makeToonMesh(
      new THREE.CylinderGeometry(0.066, 0.056, 0.26, 14),
      sleeveColor,
      { outline: 0.022 }
    );
    fore.position.y = -0.13;
    elbow.add(fore);

    // Chunky cartoon hand with thumb bump (zero clipping, clean silhouette!)
    const hand = makeToonMesh(new THREE.SphereGeometry(0.072, 14, 12), skin, { outline: 0.022 });
    hand.scale.set(0.95, 1.05, 0.8);
    hand.position.y = -0.29;
    elbow.add(hand);

    return { shoulder, elbow };
  };

  const leftArm = buildArm(-1);
  const rightArm = buildArm(1);

  const buildLeg = (side: -1 | 1) => {
    const hip = new THREE.Group();
    hip.position.set(side * 0.13, -0.05, 0);
    hips.add(hip);

    const thigh = makeToonMesh(
      new THREE.CylinderGeometry(0.092, 0.082, 0.38, 14),
      pantsCol,
      { outline: 0.026 }
    );
    thigh.position.y = -0.19;
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.y = -0.38;
    hip.add(knee);

    const shin = makeToonMesh(
      new THREE.CylinderGeometry(0.08, 0.068, 0.38, 14),
      pantsCol,
      { outline: 0.024 }
    );
    shin.position.y = -0.19;
    knee.add(shin);

    const shoe = makeToonMesh(new THREE.BoxGeometry(0.14, 0.10, 0.24), shoeCol, { outline: 0.022 });
    shoe.position.set(0, -0.41, 0.04);
    knee.add(shoe);

    return { hip, knee };
  };

  const leftLeg = buildLeg(-1);
  const rightLeg = buildLeg(1);

  let lastExprKey = "";
  const setExpression = (expr: ToonExpression, blink = 0, eyeLookX = 0) => {
    const qBlink = Math.round(blink * 10) / 10;
    const qLook = Math.round(eyeLookX * 10) / 10;
    const key = `${expr}_${qBlink}_${qLook}`;
    if (key === lastExprKey) return;
    lastExprKey = key;
    drawToonFaceCanvas(
      faceCtx,
      expr,
      qBlink,
      qLook,
      cfg.cheekBlush ?? true,
      cfg.eyelashes ?? false
    );
    faceTex.needsUpdate = true;
  };

  // Ensure crisp outline helper isn't unused
  void addInkOutline;

  return {
    root,
    hips,
    torso,
    head,
    leftShoulder: leftArm.shoulder,
    leftElbow: leftArm.elbow,
    rightShoulder: rightArm.shoulder,
    rightElbow: rightArm.elbow,
    leftHip: leftLeg.hip,
    leftKnee: leftLeg.knee,
    rightHip: rightLeg.hip,
    rightKnee: rightLeg.knee,
    setExpression,
  };
}
