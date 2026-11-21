import * as THREE from "three";
import { Batch, V, boxGeo, lam, quad } from "../build";
import { stoneHD, rep, brick } from "../paint";

/**
 * Modular Castle Builder (Anglo-Saxon / Norman / Medieval Fortress)
 * Reusable across any historical / medieval / royal animation topics.
 */

// Shared castle materials
export const castleStone = () => lam("castleStone", () => ({ map: stoneHD("towerHD") }));
export const castleCope = () => lam("castleCope", () => ({ map: stoneHD("copeHD", ["#e6dccd", "#ddd3c3", "#ece4d6", "#d6cbba"], "#aea293") }));
export const castleWood = () => lam("castleWood", () => ({ color: "#543828" }));
export const castleIron = () => lam("castleIron", () => ({ color: "#2b2e38" }));
export const royalGold = () => lam("royalGold", () => ({ color: "#d4af37" }));

/**
 * Build a round stone bastion tower with crenellated battlements
 */
export function buildBastionTower(
  b: Batch,
  x: number,
  y: number,
  z: number,
  radius = 4.5,
  height = 16,
  crenellated = true
) {
  const m = new THREE.Matrix4().makeTranslation(x, y + height / 2, z);
  const sm = castleStone();
  const cm = castleCope();

  // Main cylinder tower body (18 radial segments for clean cartoon ink lines)
  const bodyGeo = new THREE.CylinderGeometry(radius * 0.95, radius, height, 18, 1, false);
  b.add(bodyGeo, sm, m);

  // Overhanging machicolation cornice ring at the top
  const corniceH = 0.8;
  const corniceR = radius * 1.12;
  const corniceGeo = new THREE.CylinderGeometry(corniceR, radius * 0.95, corniceH, 18, 1, false);
  b.add(corniceGeo, cm, new THREE.Matrix4().makeTranslation(x, y + height + corniceH / 2, z));

  // Walkway floor inside battlements
  const floorGeo = new THREE.CylinderGeometry(corniceR, corniceR, 0.3, 18, 1, false);
  b.add(floorGeo, sm, new THREE.Matrix4().makeTranslation(x, y + height + corniceH + 0.15, z));

  if (crenellated) {
    // Merlons (upright teeth of battlements) around the perimeter
    const numMerlons = 9;
    const merlonH = 1.2;
    const merlonW = (2 * Math.PI * corniceR) / (numMerlons * 2);
    const merlonThick = 0.55;

    for (let i = 0; i < numMerlons; i++) {
      const angle = (i / numMerlons) * Math.PI * 2;
      const mx = x + Math.cos(angle) * (corniceR - merlonThick / 2);
      const mz = z + Math.sin(angle) * (corniceR - merlonThick / 2);
      const my = y + height + corniceH + merlonH / 2 + 0.3;

      const mMat = new THREE.Matrix4()
        .makeRotationY(-angle)
        .setPosition(mx, my, mz);
      const merlonGeo = new THREE.BoxGeometry(merlonThick, merlonH, merlonW * 0.9);
      b.add(merlonGeo, cm, mMat);
    }
  }
}

/**
 * Build a thick curtain fortress wall with parapet and battlements
 */
export function buildCurtainWall(
  b: Batch,
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  y: number,
  height = 11,
  thickness = 2.8
) {
  const dx = x1 - x0;
  const dz = z1 - z0;
  const len = Math.hypot(dx, dz);
  const yaw = Math.atan2(dx, dz);
  const midX = (x0 + x1) / 2;
  const midZ = (z0 + z1) / 2;

  const m = new THREE.Matrix4()
    .makeRotationY(yaw)
    .setPosition(midX, y + height / 2, midZ);

  // Main wall slab
  const wallGeo = new THREE.BoxGeometry(thickness, height, len);
  b.add(wallGeo, castleStone(), m);

  // Parapet coping & outer parapet wall facing outward (+x in local space)
  const parapetH = 1.3;
  const parapetThick = 0.5;
  const parapetGeo = new THREE.BoxGeometry(
    parapetThick,
    parapetH,
    len
  );
  const pm = new THREE.Matrix4()
    .makeRotationY(yaw)
    .setPosition(
      midX + Math.cos(yaw) * (thickness / 2 - parapetThick / 2),
      y + height + parapetH / 2,
      midZ - Math.sin(yaw) * (thickness / 2 - parapetThick / 2)
    );
  b.add(parapetGeo, castleCope(), pm);
}

/**
 * Build a grand rectangular castle keep (Donjon / Great Tower)
 */
export function buildCastleKeep(
  b: Batch,
  x: number,
  y: number,
  z: number,
  width = 24,
  depth = 20,
  height = 22
) {
  const sm = castleStone();
  const cm = castleCope();
  const m = new THREE.Matrix4().makeTranslation(x, y + height / 2, z);

  // Main massive stone block
  const keepGeo = new THREE.BoxGeometry(width, height, depth);
  b.add(keepGeo, sm, m);

  // 4 Corner pilaster turrets
  const turretR = 2.2;
  const turretH = height + 3.0;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const tx = x + sx * (width / 2);
      const tz = z + sz * (depth / 2);
      buildBastionTower(b, tx, y, tz, turretR, turretH, true);
    }
  }

  // Roof parapet merlons
  const copeM = new THREE.Matrix4().makeTranslation(x, y + height + 0.4, z);
  const copeGeo = new THREE.BoxGeometry(width + 0.8, 0.8, depth + 0.8);
  b.add(copeGeo, cm, copeM);
}

/**
 * Royal Heraldic Banner / Gonfalon on a tall wooden pole
 */
export function buildRoyalBannerPole(
  b: Batch,
  x: number,
  y: number,
  z: number,
  height = 7.0,
  color = "#991b1b"
) {
  const poleM = castleWood();
  const goldM = royalGold();
  const clothM = lam("royalBannerCloth" + color, () => ({ color }));

  // Upright wooden pole
  const poleGeo = new THREE.CylinderGeometry(0.08, 0.11, height, 10);
  b.add(poleGeo, poleM, new THREE.Matrix4().makeTranslation(x, y + height / 2, z));

  // Golden finial ball on top
  const ballGeo = new THREE.SphereGeometry(0.22, 12, 10);
  b.add(ballGeo, goldM, new THREE.Matrix4().makeTranslation(x, y + height + 0.2, z));

  // Crossbar for hanging banner
  const crossbarGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.8, 8).rotateZ(Math.PI / 2);
  b.add(crossbarGeo, poleM, new THREE.Matrix4().makeTranslation(x, y + height - 0.4, z + 0.1));

  // Hanging cloth gonfalon with swallowtail notch
  const clothW = 1.4;
  const clothH = 3.2;
  const clothGeo = new THREE.PlaneGeometry(clothW, clothH, 8, 12).translate(0, -clothH / 2, 0);
  const p = clothGeo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const px = p.getX(i);
    const py = p.getY(i);
    const t = -py / clothH; // 0 top .. 1 bottom
    // Swallowtail hem cut
    p.setY(i, py + 0.45 * (1 - Math.abs(px) / (clothW / 2)) * t * t);
    // Wind ripples
    p.setZ(i, 0.08 * t * Math.sin(px * 4.0 + 1.2) + 0.05 * t * t);
  }
  clothGeo.computeVertexNormals();

  b.add(clothGeo, clothM, new THREE.Matrix4().makeTranslation(x, y + height - 0.4, z + 0.12));
}

