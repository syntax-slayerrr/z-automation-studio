import * as THREE from "three";
import {
  ctex,
  grassHD,
  stoneHD,
  beamHD,
  cloudHD,
  cobbleHD,
  roofHD,
  rep,
} from "../bridge/paint";
import { Batch, boxGeo, house, V, lam } from "../bridge/build";
import { fxContact } from "../bridge/toon";
import { SHOTS, shotAt, camAt, dofAt, Cam, V3 } from "./story";
import {
  Pool,
  Actor,
  Fx,
  drawWargaJakartaSide,
  drawWargaJakartaFront,
  drawDombaSultan,
} from "./cast";
import { Expr } from "../bridge/toon";

// ---------------- Milestone Signboard Texture (Shot 1) ----------------
export const garutMilestoneTex = () =>
  ctex("garutMilestoneV5", 512, 640, (g) => {
    // Rich royal crimson gradient background
    const gr = g.createLinearGradient(0, 0, 512, 640);
    gr.addColorStop(0, "#881337");
    gr.addColorStop(0.5, "#991b1b");
    gr.addColorStop(1, "#7f1d1d");
    g.fillStyle = gr;
    g.fillRect(0, 0, 512, 640);

    // Ornate gold border
    g.lineWidth = 14;
    g.strokeStyle = "#f59e0b";
    g.strokeRect(12, 12, 488, 616);

    g.lineWidth = 4;
    g.strokeStyle = "#fbbf24";
    g.strokeRect(24, 24, 464, 592);

    // Star rosettes in 4 corners
    const drawStar = (cx: number, cy: number, r: number) => {
      g.fillStyle = "#fbbf24";
      g.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
        const ai = a + Math.PI / 5;
        if (i === 0) g.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        else g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        g.lineTo(cx + Math.cos(ai) * (r * 0.45), cy + Math.sin(ai) * (r * 0.45));
      }
      g.closePath();
      g.fill();
    };

    drawStar(50, 50, 18);
    drawStar(462, 50, 18);
    drawStar(50, 590, 18);
    drawStar(462, 590, 18);

    // Typography
    g.textAlign = "center";
    g.textBaseline = "middle";

    // Top Header: SELAMAT DATANG
    g.font = "900 32px 'Segoe UI', Arial Black, sans-serif";
    g.fillStyle = "#ffffff";
    g.shadowColor = "rgba(0,0,0,0.8)";
    g.shadowBlur = 8;
    g.shadowOffsetX = 2;
    g.shadowOffsetY = 3;
    g.fillText("SELAMAT DATANG", 256, 110);

    // City Name: GARUT
    g.font = "900 68px 'Segoe UI', Arial Black, sans-serif";
    g.fillStyle = "#fbbf24";
    g.shadowColor = "rgba(0,0,0,0.9)";
    g.shadowBlur = 12;
    g.shadowOffsetX = 3;
    g.shadowOffsetY = 4;
    g.fillText("★ GARUT ★", 256, 195);

    // Divider line
    g.strokeStyle = "#f59e0b";
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(60, 260);
    g.lineTo(452, 260);
    g.stroke();

    // Subtitle: UMR KOTA
    g.font = "900 34px 'Segoe UI', Arial Black, sans-serif";
    g.fillStyle = "#ffffff";
    g.fillText("UMR RESMI", 256, 320);

    // Huge highlight: Rp 10 JUTA
    g.font = "900 64px 'Segoe UI', Arial Black, sans-serif";
    g.fillStyle = "#fbbf24";
    g.fillText("Rp 10 JT", 256, 405);

    // Footer: / BULAN
    g.font = "900 38px 'Segoe UI', Arial Black, sans-serif";
    g.fillStyle = "#ffffff";
    g.fillText("/ BULAN", 256, 495);
  });

// Luxurious Velvet Red Carpet for Domba Sultan
export const redCarpetTex = () =>
  ctex("redCarpetHD", 512, 512, (g) => {
    // Rich royal crimson gradient
    const gr = g.createLinearGradient(0, 0, 512, 0);
    gr.addColorStop(0, "#7f1d1d");
    gr.addColorStop(0.2, "#991b1b");
    gr.addColorStop(0.5, "#b91c1c");
    gr.addColorStop(0.8, "#991b1b");
    gr.addColorStop(1, "#7f1d1d");
    g.fillStyle = gr;
    g.fillRect(0, 0, 512, 512);

    // Woven gold borders
    g.fillStyle = "#f59e0b";
    g.fillRect(0, 0, 36, 512);
    g.fillRect(476, 0, 36, 512);

    // Subtle dark weave lines
    g.strokeStyle = "rgba(0,0,0,0.15)";
    g.lineWidth = 2;
    for (let y = 0; y < 512; y += 16) {
      g.beginPath();
      g.moveTo(36, y);
      g.lineTo(476, y);
      g.stroke();
    }
  });

// ---------------- 3D Garut World ----------------
export class GarutWorld {
  root = new THREE.Group();

  sunLight: THREE.DirectionalLight;
  ambientLight: THREE.AmbientLight;
  milestoneGroup = new THREE.Group();
  sultanAltar = new THREE.Group();
  clouds: THREE.Mesh[] = [];

  // Authentic 2D Stickman / Toon Character Pool & Actors
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];

  private actor(i: number) {
    while (this.actors.length <= i) this.actors.push(new Actor(this.root));
    return this.actors[i];
  }

  private fx(i: number) {
    while (this.fxs.length <= i) this.fxs.push(new Fx(this.root));
    return this.fxs[i];
  }

  constructor() {
    // 1. Lighting Setup (Storybook Toon Lighting)
    this.ambientLight = new THREE.AmbientLight(0xffeedd, 1.1);
    this.sunLight = new THREE.DirectionalLight(0xfff6ea, 2.3);
    this.sunLight.position.set(20, 42, -26);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    this.root.add(this.ambientLight);
    this.root.add(this.sunLight);

    // 2. Geometry Batch for Landscape, Town, Road, and Hills
    const b = new Batch();

    const grassMat = lam("grassHD", () => ({ map: grassHD(), color: "#68a649" }));
    const cobbleMat = lam("cobbleHD", () => ({ map: rep(cobbleHD(), 3, 30) }));
    const stoneMat = lam("stoneHD", () => ({ map: stoneHD(), color: "#d1c7b7" }));
    const beamMat = lam("beamHD", () => ({ map: beamHD(), color: "#78350f" }));
    const roofMat = lam("roofGate", () => ({ map: roofHD("#b84c32"), side: THREE.DoubleSide }));

    // Base ground
    const groundGeo = new THREE.PlaneGeometry(350, 350, 16, 16);
    groundGeo.rotateX(-Math.PI / 2);
    b.add(groundGeo, grassMat, new THREE.Matrix4().makeTranslation(0, 0, 0));

    // Cobblestone Road running along Z
    const roadWidth = 6.2;
    const roadLength = 180;
    const roadGeo = new THREE.PlaneGeometry(roadWidth, roadLength, 4, 32);
    roadGeo.rotateX(-Math.PI / 2);
    b.add(roadGeo, cobbleMat, new THREE.Matrix4().makeTranslation(0, 0.03, 0));

    // Stone Curbs flanking the road
    for (const sx of [-roadWidth / 2 - 0.2, roadWidth / 2 + 0.2]) {
      const curb = boxGeo(V(sx - 0.2, 0, -roadLength / 2), V(sx + 0.2, 0.25, roadLength / 2), 2);
      b.add(curb, stoneMat);
    }

    // Hillside Houses (Charming mountain village houses on the hill slopes)
    house(b, -8.5, -20, 0.2, 7.5, 6.0, 5.5, 0, 0.5);
    house(b, -9.5, -8, 0.15, 8.0, 6.5, 6.0, 3, 0.8);
    house(b, -9.0, 10, -0.1, 7.2, 5.8, 5.2, 1, 0.6);
    house(b, -10.5, 26, -0.25, 8.5, 6.2, 6.2, 4, 1.0);

    house(b, 9.0, -15, -0.2, 7.8, 6.2, 5.8, 2, 0.6);
    house(b, 9.5, 5, 0.1, 8.2, 6.0, 6.0, 5, 0.7);
    house(b, 10.0, 22, 0.2, 7.5, 6.4, 5.6, 6, 0.9);

    // Mountain Spheres (Rolling tea plantation hills in background)
    const hillSpheres = [
      { x: -45, y: -8, z: 40, r: 35, col: "#4d8b36" },
      { x: 45, y: -6, z: 45, r: 32, col: "#55943d" },
      { x: -55, y: -4, z: -35, r: 40, col: "#447e30" },
      { x: 50, y: -5, z: -30, r: 38, col: "#4b8735" },
      { x: 0, y: 18, z: 120, r: 58, col: "#386a55" }, // Mt. Guntur silhouette
    ];
    hillSpheres.forEach((h) => {
      const g = new THREE.SphereGeometry(h.r, 24, 16);
      const m = lam(`hill_${h.col}`, () => ({ color: h.col }));
      b.add(g, m, new THREE.Matrix4().makeTranslation(h.x, h.y, h.z));
    });

    b.build(this.root);

    // 3. The Garut Milestone Monument (Shot 1)
    this.buildGarutMilestone(stoneMat, beamMat, roofMat);
    this.root.add(this.milestoneGroup);

    // 4. Domba Sultan VIP Altar (Shot 3)
    this.buildSultanAltar(stoneMat, beamMat);
    this.root.add(this.sultanAltar);

    // 5. Watercolor Clouds
    this.buildClouds();
  }

  buildGarutMilestone(
    stoneMat: THREE.Material,
    beamMat: THREE.Material,
    roofMat: THREE.Material
  ) {
    const signX = -0.55;
    const signZ = -3.2;

    // Stone Pedestal Plinth
    const plinth = new THREE.Mesh(
      boxGeo(V(signX - 0.65, 0, signZ - 0.3), V(signX + 0.65, 0.5, signZ + 0.3), 1.2),
      stoneMat
    );
    this.milestoneGroup.add(plinth);

    // Two Stained Teak Side Posts
    const postL = new THREE.Mesh(
      boxGeo(V(signX - 0.6, 0.5, signZ - 0.12), V(signX - 0.48, 2.4, signZ + 0.12), 1.0),
      beamMat
    );
    const postR = new THREE.Mesh(
      boxGeo(V(signX + 0.48, 0.5, signZ - 0.12), V(signX + 0.6, 2.4, signZ + 0.12), 1.0),
      beamMat
    );
    this.milestoneGroup.add(postL, postR);

    // Traditional Gable Little Roof on top of sign
    const roofGeo = new THREE.ConeGeometry(1.2, 0.5, 4);
    roofGeo.rotateY(Math.PI / 4);
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(signX, 2.65, signZ);
    this.milestoneGroup.add(roof);

    // Signboard Board Plate (Faced toward camera at -z with rotation.y = Math.PI)
    const signMat = new THREE.MeshLambertMaterial({
      map: garutMilestoneTex(),
      side: THREE.DoubleSide,
    });
    const signGeo = new THREE.PlaneGeometry(1.05, 1.35);
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.rotation.y = Math.PI;
    sign.position.set(signX, 1.5, signZ - 0.05);
    this.milestoneGroup.add(sign);
  }

  buildSultanAltar(stoneMat: THREE.Material, beamMat: THREE.Material) {
    this.sultanAltar.position.set(0, 0, 0);

    // Large Stone Terrace Dais
    const daisGeo = new THREE.CylinderGeometry(3.6, 4.0, 0.6, 32);
    const dais = new THREE.Mesh(daisGeo, stoneMat);
    dais.position.set(0, 0.3, 0);
    dais.receiveShadow = true;
    this.sultanAltar.add(dais);

    // Balustrade railing posts around the terrace (leaving carpet entrance clear)
    for (let a = 0; a < 10; a++) {
      const ang = (a / 10) * Math.PI * 2;
      const px = Math.cos(ang) * 3.6;
      const pz = Math.sin(ang) * 3.6;
      if (Math.abs(px) < 1.4 && pz > 0) continue; // Clear the entrance path for camera & carpet!
      const post = new THREE.Mesh(boxGeo(V(-0.15, 0, -0.15), V(0.15, 0.9, 0.15)), beamMat);
      post.position.set(px, 0.6, pz);
      this.sultanAltar.add(post);
    }

    // Luxurious Red VIP Carpet
    const carpetMat = new THREE.MeshLambertMaterial({
      map: redCarpetTex(),
    });
    const carpetGeo = new THREE.PlaneGeometry(2.4, 6.5);
    carpetGeo.rotateX(-Math.PI / 2);
    const carpet = new THREE.Mesh(carpetGeo, carpetMat);
    carpet.position.set(0, 0.61, 1.6);
    carpet.receiveShadow = true;
    this.sultanAltar.add(carpet);

    // Golden Treasure Chests flanking the sultan
    const goldMat = new THREE.MeshLambertMaterial({
      color: 0xf59e0b,
    });
    for (const sx of [-1.2, 1.2]) {
      const chest = new THREE.Mesh(boxGeo(V(-0.35, 0, -0.28), V(0.35, 0.55, 0.28), 0.5), goldMat);
      chest.position.set(sx, 0.6, 0.4);
      chest.castShadow = true;
      this.sultanAltar.add(chest);
    }
  }

  buildClouds() {
    const cloudMat = new THREE.MeshBasicMaterial({
      map: cloudHD(),
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    const cloudGeo = new THREE.PlaneGeometry(22, 12);

    const cloudCoords = [
      { x: -32, y: 28, z: 60 },
      { x: 24, y: 32, z: 75 },
      { x: -8, y: 36, z: 95 },
    ];

    cloudCoords.forEach((c) => {
      const m = new THREE.Mesh(cloudGeo, cloudMat);
      m.position.set(c.x, c.y, c.z);
      this.root.add(m);
      this.clouds.push(m);
    });
  }

  update(shotId: number, f: number, camera: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const target = new THREE.Vector3();

    // 1. Camera positioning from Story
    const c = camAt(shotId, f);
    camera.position.set(...c.pos);
    camera.lookAt(...c.look);
    if (c.fov && Math.abs(camera.fov - c.fov) > 0.01) {
      camera.fov = c.fov;
      camera.updateProjectionMatrix();
    }
    if (c.roll) {
      camera.rotation.z += c.roll;
    }
    target.set(...c.look);

    // 2. Adjust Lighting per Shot
    const shot = shotAt(f);
    if (shot.light === "golden") {
      this.sunLight.color.setHex(0xfeb272);
      this.sunLight.intensity = 2.6;
      this.sunLight.position.set(16, 22, -14);
      this.ambientLight.color.setHex(0xfed7aa);
      this.ambientLight.intensity = 1.2;
    } else {
      this.sunLight.color.setHex(0xfff6ea);
      this.sunLight.intensity = 2.3;
      this.sunLight.position.set(20, 42, -26);
      this.ambientLight.color.setHex(0xffeedd);
      this.ambientLight.intensity = 1.1;
    }

    const used: Actor[] = [];
    const fused: Fx[] = [];

    // Contact shadow color: deep blue-slate in day, warm purple in golden
    const shadowCol = shot.light === "golden" ? "#3b1e28" : "#1e293b";

    // 3. Scene element visibility & Authentic 2D Characters
    if (shotId === 3) {
      this.milestoneGroup.visible = false;
      this.sultanAltar.visible = true;

      // Shot 3: Sultan Garut on the VIP Altar
      const a = this.actor(0);
      const bob = Math.sin((f - 135) * 0.16) * 0.35;
      const glint = (f % 16 < 8) ? 1 : 0;

      a.r = this.pool.req(`sultan_${Math.round(bob * 10)}_${glint}`, 600, 1000, 1, (p) => {
        drawDombaSultan(p, { bob, goldGlint: glint });
      });
      a.mesh.visible = true;
      a.mesh.position.set(0, 0.6, 0.4);
      a.mesh.rotation.set(0, 0, 0); // Directly facing camera on the red carpet
      a.mesh.scale.set(1.15, 1.15, 1.15);
      used.push(a);

      // Contact shadow: key MUST contain "|blob|" for multiply blend!
      const b = this.fx(0);
      b.r = this.pool.req(`blob|contact|${shadowCol}`, 128, 128, 1, (p) => fxContact(p, shadowCol));
      b.mesh.visible = true;
      b.mesh.position.set(0, 0.62, 0.4);
      b.mesh.rotation.x = -Math.PI / 2;
      b.mesh.scale.set(0.65, 0.42, 0.65);
      fused.push(b);
    } else if (shotId === 1) {
      this.milestoneGroup.visible = true;
      this.sultanAltar.visible = false;

      // Shot 1: Traveler arriving and marveling at the Garut UMR 10 Juta milestone
      const a = this.actor(0);
      const blink = (f >= 28 && f <= 34);

      a.r = this.pool.req(`runner_front_${blink ? 1 : 0}`, 600, 1000, 1, (p) => {
        drawWargaJakartaFront(p, {
          outfitIndex: 0,
          koperCol: "#f59e0b",
          expr: "grin",
          blink,
        });
      });
      a.mesh.visible = true;
      a.mesh.position.set(0.35, 0.0, -3.2);
      a.mesh.rotation.set(0, -0.15, 0); // Slight 3/4 turn towards sign & camera
      a.mesh.scale.set(1.08, 1.08, 1.08);
      used.push(a);

      const b = this.fx(0);
      b.r = this.pool.req(`blob|contact|${shadowCol}`, 128, 128, 1, (p) => fxContact(p, shadowCol));
      b.mesh.visible = true;
      b.mesh.position.set(0.35, 0.035, -3.2);
      b.mesh.rotation.x = -Math.PI / 2;
      b.mesh.scale.set(0.65, 0.42, 0.65);
      fused.push(b);
    } else {
      // Shot 2: The Jakarta Commuters in dynamic sprint along the road!
      this.milestoneGroup.visible = false;
      this.sultanAltar.visible = false;

      const configs = [
        { outfitIndex: 0, koperCol: "#f59e0b", baseZ: -0.8, speed: 0.14, x: -0.3, scale: 1.05, expr: "grin" as Expr },
        { outfitIndex: 1, koperCol: "#ef4444", baseZ: 0.8, speed: 0.15, x: 0.45, scale: 0.98, expr: "laugh" as Expr },
        { outfitIndex: 2, koperCol: "#10b981", baseZ: 2.4, speed: 0.13, x: -0.9, scale: 0.92, expr: "whistle" as Expr },
      ];

      configs.forEach((cfg, idx) => {
        const a = this.actor(idx);
        const progressZ = (f - 75) * cfg.speed;
        const currentZ = cfg.baseZ + progressZ;
        const phase = ((f - 75 + idx * 8) / 30) * 2.8;

        a.r = this.pool.req(`runner_side_${idx}_${Math.round(phase * 20)}`, 600, 1000, 1, (p) => {
          drawWargaJakartaSide(p, {
            outfitIndex: cfg.outfitIndex,
            phase,
            koperCol: cfg.koperCol,
            seed: idx + 3,
            expr: cfg.expr,
          });
        });
        a.mesh.visible = true;
        a.mesh.position.set(cfg.x, 0.0, currentZ);
        a.mesh.rotation.set(0, -Math.PI / 2 + 0.32, 0);
        a.mesh.scale.set(cfg.scale, cfg.scale, cfg.scale);
        used.push(a);

        const b = this.fx(idx);
        b.r = this.pool.req(`blob|contact|${shadowCol}`, 128, 128, 1, (p) => fxContact(p, shadowCol));
        b.mesh.visible = true;
        b.mesh.position.set(cfg.x, 0.035, currentZ);
        b.mesh.rotation.x = -Math.PI / 2;
        b.mesh.scale.set(0.65 * cfg.scale, 0.42 * cfg.scale, 0.65 * cfg.scale);
        fused.push(b);
      });
    }

    // Hide unused actors and effects
    for (let i = used.length; i < this.actors.length; i++) this.actors[i].mesh.visible = false;
    for (let i = fused.length; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;

    // Flush Pool & Bind Canvas Textures
    this.pool.flush();
    for (const a of used) a.bind();
    for (const b of fused) b.bind();

    // 4. Cloud Drift
    this.clouds.forEach((cl, i) => {
      cl.position.x = ((cl.position.x + 0.03 * (i + 1) + 50) % 100) - 50;
    });

    return target;
  }
}
