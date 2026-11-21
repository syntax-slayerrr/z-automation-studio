import * as THREE from "three";
import { Pen, KI_SUNDA, MENEER_BELANDA, bodyFront, bodySide, fxStars } from "./toon";
import { Pool, CharacterActor } from "./cast";
import { camAt, shotAt, clamp01 } from "./story";
import { LIGHTS } from "./lights";

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private kiSunda: CharacterActor;
  private meneer: CharacterActor;
  private ground: THREE.Group = new THREE.Group();
  private signpost: THREE.Group = new THREE.Group();
  private thornBush: THREE.Group = new THREE.Group();
  private sun: THREE.DirectionalLight;
  private hemi: THREE.HemisphereLight;

  constructor() {
    const R = this.root;

    // 1. Lighting setup
    this.hemi = new THREE.HemisphereLight("#E2F0D9", "#4A3425", 1.2);
    R.add(this.hemi);

    this.sun = new THREE.DirectionalLight("#FFF5DE", 2.2);
    this.sun.position.set(12, 18, 10);
    this.sun.castShadow = true;
    R.add(this.sun);

    // 2. Environment: Riverbank & Tropical Grass
    this.buildTerrain();

    // 3. Characters
    this.kiSunda = new CharacterActor(R);
    this.meneer = new CharacterActor(R);

    // 4. Props
    this.buildThornBush();
    this.buildSignpost();
  }

  private buildTerrain() {
    // Main Grass Ground
    const grassGeo = new THREE.BoxGeometry(40, 1.2, 40);
    const grassMat = new THREE.MeshLambertMaterial({ color: "#547A38" });
    const grass = new THREE.Mesh(grassGeo, grassMat);
    grass.position.set(0, -0.6, 0);
    this.ground.add(grass);

    // River Cimanuk (water strip)
    const waterGeo = new THREE.BoxGeometry(40, 1.25, 8);
    const waterMat = new THREE.MeshStandardMaterial({
      color: "#3A86A8",
      roughness: 0.15,
      metalness: 0.2,
      transparent: true,
      opacity: 0.9,
    });
    const river = new THREE.Mesh(waterGeo, waterMat);
    river.position.set(0, -0.55, -8);
    this.ground.add(river);

    // Dirt Pathway
    const pathGeo = new THREE.PlaneGeometry(38, 2.8);
    pathGeo.rotateX(-Math.PI / 2);
    const pathMat = new THREE.MeshLambertMaterial({ color: "#9E815D" });
    const dirtPath = new THREE.Mesh(pathGeo, pathMat);
    dirtPath.position.set(0, 0.02, 0);
    this.ground.add(dirtPath);

    // Tropical Trees & Rocks in background (behind characters and on distant flanks)
    for (let i = 0; i < 14; i++) {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.24, 2.4, 8),
        new THREE.MeshLambertMaterial({ color: "#4A3222" })
      );
      trunk.position.y = 1.2;
      tree.add(trunk);

      const foliage = new THREE.Mesh(
        new THREE.DodecahedronGeometry(1.2, 1),
        new THREE.MeshLambertMaterial({ color: i % 2 === 0 ? "#3E6627" : "#4A7A30" })
      );
      foliage.position.y = 2.6;
      tree.add(foliage);

      // Keep trees behind path (z <= -3.5) or far sideways (|x| > 3.5)
      const x = -10 + i * 1.6;
      const z = -3.5 - (i % 3) * 1.5;
      tree.position.set(x, 0, z);
      this.ground.add(tree);
    }

    this.root.add(this.ground);
  }

  private buildThornBush() {
    // Sharp prickly bush placed to the side
    const bush = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.65, 1),
      new THREE.MeshLambertMaterial({ color: "#2E4720" })
    );
    bush.position.set(-1.8, 0.45, 0.2);
    this.thornBush.add(bush);

    // Thorns
    for (let k = 0; k < 12; k++) {
      const thorn = new THREE.Mesh(
        new THREE.ConeGeometry(0.04, 0.22, 4),
        new THREE.MeshLambertMaterial({ color: "#8B2500" })
      );
      thorn.position.set(
        -1.8 + Math.sin(k * 2) * 0.4,
        0.45 + Math.cos(k * 1.5) * 0.3,
        0.2 + Math.sin(k * 3) * 0.4
      );
      thorn.rotation.set(k, k * 0.5, 0);
      this.thornBush.add(thorn);
    }

    this.root.add(this.thornBush);
  }

  private buildSignpost() {
    // Plang Kayu "KABUPATEN GARUT 1813"
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.09, 2.4, 8),
      new THREE.MeshLambertMaterial({ color: "#543D28" })
    );
    pole.position.set(0, 1.2, 0);
    this.signpost.add(pole);

    // Canvas texture with text
    const cv = document.createElement("canvas");
    cv.width = 512;
    cv.height = 160;
    const g = cv.getContext("2d")!;
    g.fillStyle = "#E8C39E";
    g.fillRect(0, 0, 512, 160);
    g.strokeStyle = "#4A2F1B";
    g.lineWidth = 8;
    g.strokeRect(6, 6, 500, 148);
    g.fillStyle = "#301D11";
    g.font = "bold 44px serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("KABUPATEN GAROET", 256, 80);

    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    const boardMat = new THREE.MeshBasicMaterial({ map: tex });

    const board = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.85, 0.1), boardMat);
    board.position.set(0, 2.0, 0);
    this.signpost.add(board);

    this.signpost.position.set(1.5, 0, 0);
    this.signpost.visible = false;
    this.root.add(this.signpost);
  }

  update(id: number, f: number, camera: THREE.PerspectiveCamera, scene: THREE.Scene): THREE.Vector3 {
    const s = shotAt(f);
    const cam = camAt(f);
    camera.position.set(...cam.pos);
    camera.lookAt(...cam.look);
    camera.fov = cam.fov;
    camera.updateProjectionMatrix();

    const t = f / 30;
    const relF = f - s.a;

    // Position actors depending on the story beat
    if (s.id === 1) {
      // Trekking along Cimanuk path
      const walkT = t * 3.5;
      const walkPhase = walkT % 1;

      this.kiSunda.mesh.position.set(-0.7, 0, 0);
      this.kiSunda.mesh.rotation.y = -0.15;
      this.kiSunda.r = this.pool.req(`ki_walk|${Math.floor(walkPhase * 8)}`, 720, 1200, 1.2, (p) => {
        bodySide(p, KI_SUNDA, {
          walk: walkPhase,
          facing: 1,
          expr: "smile",
        });
      });

      this.meneer.mesh.position.set(0.6, 0, -0.3);
      this.meneer.mesh.rotation.y = -0.2;
      this.meneer.r = this.pool.req(`meneer_walk|${Math.floor(walkPhase * 8)}`, 720, 1200, 1.2, (p) => {
        bodySide(p, MENEER_BELANDA, {
          walk: (walkPhase + 0.5) % 1,
          facing: 1,
          expr: "neutral",
        });
      });

      this.thornBush.visible = true;
      this.signpost.visible = false;
    } else if (s.id === 2) {
      // Ki Sunda gets pricked! Jumps on one foot
      const jumpHop = Math.abs(Math.sin(relF * 0.4)) * 0.4;
      this.kiSunda.mesh.position.set(-0.5, jumpHop, 0.4);
      this.kiSunda.mesh.rotation.y = 0.1;
      this.kiSunda.r = this.pool.req(`ki_pricked|${Math.floor(relF / 4)}`, 720, 1200, 1.2, (p) => {
        bodyFront(p, KI_SUNDA, {
          expr: "shock",
          mode: "fall",
        });
      });

      // Meneer looks over with curiosity
      this.meneer.mesh.position.set(1.4, 0, 0);
      this.meneer.mesh.rotation.y = -0.4;
      this.meneer.r = this.pool.req(`meneer_wonder`, 720, 1200, 1.2, (p) => {
        bodySide(p, MENEER_BELANDA, {
          walk: 0,
          facing: -1,
          expr: "neutral",
        });
      });

      this.thornBush.visible = true;
      this.signpost.visible = false;
    } else if (s.id === 3) {
      // Meneer writing in notebook "GAROET!"
      this.kiSunda.mesh.position.set(-1.2, 0, 0);
      this.kiSunda.mesh.rotation.y = 0.4;
      this.kiSunda.r = this.pool.req(`ki_bengong`, 720, 1200, 1.2, (p) => {
        bodySide(p, KI_SUNDA, {
          walk: 0,
          facing: 1,
          expr: "stern",
        });
      });

      // Meneer smiling wide, writing
      this.meneer.mesh.position.set(0.4, 0, 0.2);
      this.meneer.mesh.rotation.y = -0.15;
      this.meneer.r = this.pool.req(`meneer_notes`, 720, 1200, 1.2, (p) => {
        bodyFront(p, MENEER_BELANDA, {
          expr: "grin",
          mode: "stand",
        });
      });

      this.thornBush.visible = false;
      this.signpost.visible = false;
    } else {
      // Shot 4: Lahirnya Garut, Signpost pops up!
      this.signpost.visible = true;
      this.signpost.position.set(0, 0, -0.2);

      // Ki Sunda smiling proud / thumbs up
      this.kiSunda.mesh.position.set(-1.3, 0, 0.2);
      this.kiSunda.mesh.rotation.y = 0.3;
      this.kiSunda.r = this.pool.req(`ki_proud`, 720, 1200, 1.2, (p) => {
        bodyFront(p, KI_SUNDA, {
          expr: "grin",
          mode: "stand",
        });
      });

      // Meneer standing next to signpost
      this.meneer.mesh.position.set(1.4, 0, 0.2);
      this.meneer.mesh.rotation.y = -0.3;
      this.meneer.r = this.pool.req(`meneer_proud`, 720, 1200, 1.2, (p) => {
        bodyFront(p, MENEER_BELANDA, {
          expr: "grin",
          mode: "stand",
        });
      });
    }

    this.pool.flush();
    this.kiSunda.bind();
    this.meneer.bind();

    return new THREE.Vector3(...cam.look);
  }
}
