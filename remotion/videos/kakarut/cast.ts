import * as THREE from "three";
import {
  Pen,
  bodyFront,
  bodySide,
  KI_SUNDA,
  MENEER_BELANDA,
  fxStars,
  fxBlob,
  Outfit,
  Expr,
} from "./toon";
import { FPS, TOTAL, camAt, shotAt } from "./story";
import { cardShade, blobMaterial, CARD_K } from "./cardshade";
import { NOINK } from "./ink";

export class Pool {
  private live = new Map<string, { cv: HTMLCanvasElement; tex: THREE.CanvasTexture; w: number; h: number }>();
  private reqs: Array<{ key: string; w: number; h: number; k: number; draw: (p: Pen) => void; tex?: THREE.CanvasTexture }> = [];

  req(key: string, w: number, h: number, k: number, draw: (p: Pen) => void) {
    const r = { key: `${w}x${h}|${key}`, w, h, k, draw };
    this.reqs.push(r);
    return r;
  }

  flush() {
    for (const r of this.reqs) {
      let e = this.live.get(r.key);
      if (!e) {
        const cv = document.createElement("canvas");
        cv.width = r.w;
        cv.height = r.h;
        const tex = new THREE.CanvasTexture(cv);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        const g = cv.getContext("2d")!;
        g.setTransform(r.k, 0, 0, r.k, 0, 0);
        r.draw(new Pen(g));
        tex.needsUpdate = true;
        e = { cv, tex, w: r.w, h: r.h };
        this.live.set(r.key, e);
      }
      r.tex = e.tex;
    }
    this.reqs = [];
  }
}

const blank = (() => {
  const c = document.createElement("canvas");
  c.width = c.height = 2;
  return new THREE.CanvasTexture(c);
})();

export const SU = 0.0026; // metres per design unit (1000 units = 2.6m tall)
const BODY = (() => {
  const g = new THREE.PlaneGeometry(600 * SU, 1000 * SU);
  g.translate(0, (975 - 500) * SU, 0);
  return g;
})();

export class CharacterActor {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  r: any = null;

  constructor(parent: THREE.Object3D) {
    this.mat = new THREE.MeshBasicMaterial({
      map: blank,
      transparent: true,
      alphaTest: 0.05,
      side: THREE.DoubleSide,
    });
    this.mesh = new THREE.Mesh(BODY, this.mat);
    this.mesh.rotation.order = "YXZ";
    this.mesh.renderOrder = 10;
    parent.add(this.mesh);
  }

  bind() {
    if (this.r?.tex) {
      this.mat.map = this.r.tex;
      this.mat.needsUpdate = true;
      this.mesh.visible = true;
    }
  }
}
