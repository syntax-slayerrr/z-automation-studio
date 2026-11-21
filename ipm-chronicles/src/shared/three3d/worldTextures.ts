import * as THREE from "three";

const TEX_CACHE = new Map<string, THREE.CanvasTexture>();

function makeTex(
  key: string,
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  { repeat = false, srgb = true, mipmaps = true }: { repeat?: boolean; srgb?: boolean; mipmaps?: boolean } = {}
): THREE.CanvasTexture {
  const cached = TEX_CACHE.get(key);
  if (cached) return cached;
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d")!;
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.anisotropy = 8;
  if (repeat) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
  }
  if (!mipmaps) {
    tex.generateMipmaps = false;
    tex.minFilter = THREE.LinearFilter;
  }
  tex.needsUpdate = true;
  TEX_CACHE.set(key, tex);
  return tex;
}

function hashSeed(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** Painted teak/walnut wood plank CanvasTexture for desks, wainscot panels, and door leaves. */
export function woodGrainTex(base = "#5d3b20", streak = "#351e0e", planks = 5): THREE.CanvasTexture {
  return makeTex(
    `wood_${base}_${streak}_${planks}`,
    512,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      const ph = h / planks;
      for (let p = 0; p < planks; p++) {
        const y0 = p * ph;
        ctx.fillStyle = streak;
        ctx.globalAlpha = 0.08 + hashSeed(p * 3.1) * 0.08;
        ctx.fillRect(0, y0, w, ph);
        ctx.globalAlpha = 0.24;
        for (let i = 0; i < 18; i++) {
          const gy = y0 + hashSeed(p * 37 + i) * (ph - 4) + 2;
          ctx.strokeStyle = streak;
          ctx.lineWidth = 1.2 + hashSeed(i * 11 + p) * 2.2;
          ctx.beginPath();
          ctx.moveTo(0, gy);
          ctx.bezierCurveTo(
            w * 0.33,
            gy + (hashSeed(i + 2) - 0.5) * 8,
            w * 0.66,
            gy + (hashSeed(i + 5) - 0.5) * 8,
            w,
            gy + (hashSeed(i + 9) - 0.5) * 4
          );
          ctx.stroke();
        }
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = "#1c0e06";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, y0);
        ctx.lineTo(w, y0);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    },
    { repeat: true }
  );
}

/** Mottled lime plaster classroom wall texture matching EP01/EP02 heritage interiors. */
export function plasterWallTex(base = "#efe2c4", shade = "#d4bc91"): THREE.CanvasTexture {
  return makeTex(
    `plaster_${base}_${shade}`,
    512,
    512,
    (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, base);
      grad.addColorStop(1, shade);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 140; i++) {
        const x = hashSeed(i * 13.7) * w;
        const y = hashSeed(i * 29.3) * h;
        const r = 14 + hashSeed(i * 7.1) * 48;
        ctx.fillStyle = i % 2 === 0 ? "#fff6e1" : "#9c7e52";
        ctx.globalAlpha = 0.04 + hashSeed(i * 5.3) * 0.04;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    },
    { repeat: true }
  );
}

/** Heritage terrazzo / colonial square school floor tile texture. */
export function tiledFloorTex(tileA = "#c7b18c", tileB = "#ba9f75", grout = "#5c452d"): THREE.CanvasTexture {
  return makeTex(
    `floor_${tileA}_${tileB}_${grout}`,
    512,
    512,
    (ctx, w, h) => {
      const cells = 4;
      const cw = w / cells;
      const ch = h / cells;
      for (let r = 0; r < cells; r++) {
        for (let c = 0; c < cells; c++) {
          ctx.fillStyle = (r + c) % 2 === 0 ? tileA : tileB;
          ctx.fillRect(c * cw, r * ch, cw, ch);
          ctx.fillStyle = "#fff4dc";
          ctx.globalAlpha = 0.06;
          ctx.fillRect(c * cw + 4, r * ch + 4, cw - 8, ch - 8);
          ctx.globalAlpha = 1;
        }
      }
      ctx.strokeStyle = grout;
      ctx.lineWidth = 5;
      ctx.globalAlpha = 0.6;
      for (let i = 0; i <= cells; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cw, 0);
        ctx.lineTo(i * cw, h);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * ch);
        ctx.lineTo(w, i * ch);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    },
    { repeat: true }
  );
}

/** White-background Gaussian contact shadow for multiply blobMaterial (NOINK + |blob| contract). */
export function contactBlobTex(shadowHex = "#4f3d30"): THREE.CanvasTexture {
  return makeTex(
    `blob_${shadowHex}`,
    128,
    128,
    (ctx, w, h) => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      const gr = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      const c = new THREE.Color(shadowHex);
      const stops: [number, number][] = [
        [0, 0],
        [0.45, 0.06],
        [0.62, 0.22],
        [0.75, 0.48],
        [0.88, 0.78],
        [0.96, 0.94],
        [1.0, 1.0],
      ];
      for (const [stop, mixWhite] of stops) {
        const rr = Math.round((c.r + (1 - c.r) * mixWhite) * 255);
        const gg = Math.round((c.g + (1 - c.g) * mixWhite) * 255);
        const bb = Math.round((c.b + (1 - c.b) * mixWhite) * 255);
        gr.addColorStop(stop, `rgb(${rr},${gg},${bb})`);
      }
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, w, h);
    },
    { mipmaps: false }
  );
}

/** Soft feathered vertical volumetric sunbeam gradient texture (zero hard polygon edges). */
export function sunbeamTex(): THREE.CanvasTexture {
  return makeTex(
    "sunbeam_soft_feathered",
    256,
    256,
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const gx = ctx.createLinearGradient(0, 0, w, 0);
      gx.addColorStop(0, "rgba(255, 232, 178, 0)");
      gx.addColorStop(0.28, "rgba(255, 232, 178, 0.55)");
      gx.addColorStop(0.5, "rgba(255, 236, 188, 0.85)");
      gx.addColorStop(0.72, "rgba(255, 232, 178, 0.55)");
      gx.addColorStop(1, "rgba(255, 232, 178, 0)");
      ctx.fillStyle = gx;
      ctx.fillRect(0, 0, w, h);

      ctx.globalCompositeOperation = "destination-in";
      const gy = ctx.createLinearGradient(0, 0, 0, h);
      gy.addColorStop(0, "rgba(255, 255, 255, 0)");
      gy.addColorStop(0.18, "rgba(255, 255, 255, 0.95)");
      gy.addColorStop(0.72, "rgba(255, 255, 255, 0.45)");
      gy.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = gy;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";
    },
    { mipmaps: true }
  );
}

/** Soft translucent glowing dust mote sprite texture for sunbeams. */
export function dustMoteTex(): THREE.CanvasTexture {
  return makeTex(
    "dust_mote_warm",
    64,
    64,
    (ctx, w, h) => {
      const gr = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      gr.addColorStop(0, "rgba(255, 240, 198, 0.95)");
      gr.addColorStop(0.45, "rgba(255, 224, 160, 0.42)");
      gr.addColorStop(1, "rgba(255, 210, 130, 0.0)");
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, w, h);
    },
    { mipmaps: true }
  );
}

/** Dynamic reusable canvas & texture drawing the S1 PP -> PW -> PD -> PC -> PR hierarchy chalkboard. */
export class ChalkboardCanvas {
  readonly cv: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  readonly tex: THREE.CanvasTexture;
  private lastSig = "";

  constructor() {
    this.cv = document.createElement("canvas");
    this.cv.width = 1024;
    this.cv.height = 512;
    this.ctx = this.cv.getContext("2d")!;
    this.tex = new THREE.CanvasTexture(this.cv);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.tex.anisotropy = 8;
    this.update(0, 0, false);
  }

  /** Redraws chalkboard state deterministically only when progress changes noticeably. */
  update(flowProgress: number, rantingPulse: number, basisProgress: number | boolean): void {
    const bpNum = typeof basisProgress === "boolean" ? (basisProgress ? 1 : 0) : basisProgress;
    const qFlow = Math.round(Math.max(0, Math.min(1, flowProgress)) * 40);
    const qRant = Math.round(Math.max(0, Math.min(1, rantingPulse)) * 12);
    const qBasis = Math.round(Math.max(0, Math.min(1, bpNum)) * 24);
    const sig = `${qFlow}_${qRant}_${qBasis}`;
    if (sig === this.lastSig) return;
    this.lastSig = sig;

    const ctx = this.ctx;
    const w = this.cv.width;
    const h = this.cv.height;
    const p = qFlow / 40;
    const pr = qRant / 12;
    const bp = qBasis / 24;

    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#23392c");
    bg.addColorStop(0.6, "#1b2d22");
    bg.addColorStop(1, "#14221a");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Subtle chalk smudge clouds for archival blackboard realism
    ctx.fillStyle = "#e8dec3";
    for (let i = 0; i < 16; i++) {
      ctx.globalAlpha = 0.025;
      ctx.beginPath();
      ctx.ellipse(
        110 + ((i * 197) % 820),
        90 + ((i * 113) % 340),
        60 + (i % 4) * 28,
        24 + (i % 3) * 14,
        (i % 5) * 0.25,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = "rgba(244, 232, 200, 0.86)";
    ctx.font = "700 28px Georgia, serif";
    ctx.textAlign = "left";
    ctx.fillText("STRUKTUR KEPEMIMPINAN IPM", 54, 66);

    ctx.strokeStyle = "rgba(235, 219, 178, 0.45)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(54, 82);
    ctx.lineTo(445, 82);
    ctx.stroke();

    const tiers: { code: string; name: string; sub: string; tAt: number }[] = [
      { code: "PP", name: "Pimpinan Pusat", sub: "Nasional", tAt: 0.05 },
      { code: "PW", name: "Pimpinan Wilayah", sub: "Provinsi", tAt: 0.22 },
      { code: "PD", name: "Pimpinan Daerah", sub: "Kabupaten/Kota", tAt: 0.40 },
      { code: "PC", name: "Pimpinan Cabang", sub: "Kecamatan", tAt: 0.58 },
      { code: "PR", name: "Pimpinan Ranting", sub: "Basis Pelajar", tAt: 0.78 },
    ];

    const startX = 112;
    const stepX = 196;
    const nodeY = 236;

    // Draw solid slate fill inside each box AFTER line segments so dashed lines never cross letters
    if (p > 0.05) {
      const span = Math.min(1, (p - 0.05) / 0.72);
      const endX = startX + span * (stepX * 4);
      ctx.save();
      ctx.strokeStyle = "#f4df9e";
      ctx.lineWidth = 4;
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.moveTo(startX, nodeY);
      ctx.lineTo(endX, nodeY);
      ctx.stroke();
      ctx.restore();
    }

    tiers.forEach((tier, idx) => {
      const vis = Math.max(0, Math.min(1, (p - tier.tAt) / 0.14));
      if (vis <= 0.02) return;
      const cx = startX + idx * stepX;
      const isPR = tier.code === "PR";
      const glow = isPR ? pr : 0;

      ctx.save();
      ctx.globalAlpha = vis;
      const bw = isPR ? 142 : 124;
      const bh = isPR ? 96 : 82;
      // Opaque chalkboard-green core masks the dashed connector cleanly behind lettering
      ctx.fillStyle = isPR ? "#243423" : "#18281e";
      ctx.beginPath();
      ctx.roundRect(cx - bw / 2, nodeY - bh / 2, bw, bh, 12);
      ctx.fill();
      ctx.fillStyle = isPR ? "rgba(182, 136, 56, 0.24)" : "rgba(246, 236, 208, 0.08)";
      ctx.strokeStyle = isPR ? "#f6c969" : "#ede0bf";
      ctx.lineWidth = isPR ? 4 + glow * 2.5 : 2.5;
      ctx.beginPath();
      ctx.roundRect(cx - bw / 2, nodeY - bh / 2, bw, bh, 12);
      ctx.fill();
      ctx.stroke();

      if (isPR && glow > 0.05) {
        ctx.strokeStyle = `rgba(255, 222, 138, ${0.42 * glow})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(cx - bw / 2 - 10, nodeY - bh / 2 - 10, bw + 20, bh + 20, 16);
        ctx.stroke();
      }

      ctx.fillStyle = isPR ? "#ffe296" : "#fff5db";
      ctx.font = "700 32px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(tier.code, cx, nodeY + 2);

      ctx.fillStyle = "#e8d9b4";
      ctx.font = "600 17px Georgia, serif";
      ctx.fillText(tier.name, cx, nodeY + 66);

      ctx.fillStyle = "rgba(222, 206, 170, 0.75)";
      ctx.font = "italic 14px Georgia, serif";
      ctx.fillText(tier.sub, cx, nodeY + 86);
      ctx.restore();
    });

    if (bp > 0.02) {
      const prX = startX + 4 * stepX;
      const basisNodes = [
        { label: "SEKOLAH", x: 185, tAt: 0.02 },
        { label: "MADRASAH", x: 405, tAt: 0.26 },
        { label: "PANTI ASUHAN", x: 635, tAt: 0.52 },
        { label: "KAMPUNG", x: 865, tAt: 0.76 },
      ];
      basisNodes.forEach((node) => {
        const bVis = Math.max(0, Math.min(1, (bp - node.tAt) / 0.22));
        if (bVis <= 0.02) return;
        ctx.save();
        ctx.globalAlpha = bVis;
        ctx.strokeStyle = "rgba(246, 201, 105, 0.72)";
        ctx.lineWidth = 2.6;
        ctx.setLineDash([6, 5]);
        ctx.beginPath();
        ctx.moveTo(prX, nodeY + 52);
        ctx.quadraticCurveTo(prX, 368, node.x + (prX - node.x) * (1 - bVis), 368 + 44 * bVis);
        ctx.stroke();
        ctx.setLineDash([]);

        const pillW = node.label.length > 9 ? 196 : 164;
        ctx.fillStyle = "#203324";
        ctx.strokeStyle = "#f6c969";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(node.x - pillW / 2, 410, pillW, 46, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ffe59e";
        ctx.font = "700 20px Georgia, serif";
        ctx.textAlign = "center";
        ctx.fillText(node.label, node.x, 440);
        ctx.restore();
      });
    }

    this.tex.needsUpdate = true;
  }
}
