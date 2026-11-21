import * as THREE from "three";

const PROP_CACHE = new Map<string, THREE.CanvasTexture>();

function cachedPropTex(
  key: string,
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
): THREE.CanvasTexture {
  const hit = PROP_CACHE.get(key);
  if (hit) return hit;
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d")!;
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  PROP_CACHE.set(key, tex);
  return tex;
}

function makeDynamicCanvas(w: number, h: number): {
  cv: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  tex: THREE.CanvasTexture;
} {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d")!;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return { cv, ctx, tex };
}

/** S0 embossed burgundy-walnut cover for Tanfidz Muktamar dossier. */
export function tanfidzCoverTex(): THREE.CanvasTexture {
  return cachedPropTex("tanfidz_cover_v5", 512, 680, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#682018");
    grad.addColorStop(0.6, "#4d150e");
    grad.addColorStop(1, "#320c07");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "#d9af57";
    ctx.lineWidth = 6;
    ctx.strokeRect(24, 24, w - 48, h - 48);
    ctx.lineWidth = 2;
    ctx.strokeRect(36, 36, w - 72, h - 72);

    ctx.fillStyle = "#2b0a05";
    ctx.fillRect(0, 0, 34, h);

    ctx.fillStyle = "#efe0bc";
    ctx.fillRect(78, 175, w - 156, 220);
    ctx.strokeStyle = "#8a6220";
    ctx.lineWidth = 4;
    ctx.strokeRect(84, 181, w - 168, 208);

    ctx.fillStyle = "#2b1608";
    ctx.textAlign = "center";
    ctx.font = "700 42px Georgia, serif";
    ctx.fillText("TANFIDZ", w / 2, 255);
    ctx.font = "600 28px Georgia, serif";
    ctx.fillText("MUKTAMAR", w / 2, 302);
    ctx.fillStyle = "#7a2318";
    ctx.font = "italic 20px Georgia, serif";
    ctx.fillText("Keputusan Resmi", w / 2, 355);

    ctx.fillStyle = "#9b2718";
    ctx.beginPath();
    ctx.arc(w / 2, 495, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#d9af57";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "#f2d68a";
    ctx.font = "700 22px Georgia, serif";
    ctx.fillText("IPM", w / 2, 503);
  });
}

/** S0 Progressive Decree & Official Stamp Canvas on slanted Tanfidz lectern (Beats #01-#02). */
export class TanfidzPageCanvas {
  readonly cv: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  readonly tex: THREE.CanvasTexture;
  private lastQ = -1;

  constructor() {
    ({ cv: this.cv, ctx: this.ctx, tex: this.tex } = makeDynamicCanvas(512, 680));
    this.update(0);
  }

  update(progress: number): void {
    const q = Math.round(Math.max(0, Math.min(1, progress)) * 24);
    if (q === this.lastQ) return;
    this.lastQ = q;
    const p = q / 24;
    const ctx = this.ctx;
    const w = this.cv.width;
    const h = this.cv.height;

    ctx.fillStyle = "#f5e8ca";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#8a6220";
    ctx.lineWidth = 5;
    ctx.strokeRect(22, 22, w - 44, h - 44);

    ctx.fillStyle = "#2b1608";
    ctx.textAlign = "center";
    ctx.font = "700 30px Georgia, serif";
    ctx.fillText("KETETAPAN MUKTAMAR", w / 2, 84);
    ctx.fillStyle = "#8d2416";
    ctx.font = "700 18px Georgia, serif";
    ctx.fillText("MANDAT KADERISASI & RANTING", w / 2, 118);

    const clauses = [
      ["PASAL I", "Struktur Pusat hingga Ranting"],
      ["PASAL II", "Sistem Perkaderan IPM (SPI)"],
      ["PASAL III", "Basis Sekolah, Madrasah & Kampung"],
    ];
    ctx.textAlign = "left";
    clauses.forEach(([pasal, desc], i) => {
      const y = 186 + i * 104;
      const vis = Math.max(0, Math.min(1, (p - i * 0.16) / 0.25));
      ctx.fillStyle = "#2b1608";
      ctx.font = "700 22px Georgia, serif";
      ctx.fillText(pasal, 48, y);
      ctx.fillStyle = "#4d341c";
      ctx.font = "600 19px Georgia, serif";
      ctx.fillText(desc, 48, y + 30);

      if (vis > 0.02) {
        ctx.fillStyle = "#8d2416";
        ctx.fillRect(48, y + 42, (w - 96) * vis, 5);
      }
    });

    // Crimson circular official seal stamping down firmly by Beat #01 "meja muktamar"
    const sealVis = Math.max(0, Math.min(1, (p - 0.38) / 0.2));
    if (sealVis > 0.05) {
      ctx.save();
      ctx.globalAlpha = sealVis;
      ctx.translate(w - 134, 542);
      ctx.rotate(-0.14);
      const sc = 1.25 - sealVis * 0.25;
      ctx.scale(sc, sc);
      ctx.fillStyle = "rgba(155, 35, 22, 0.12)";
      ctx.beginPath();
      ctx.arc(0, 0, 66, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#9b2316";
      ctx.lineWidth = 6;
      ctx.stroke();
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 54, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#9b2316";
      ctx.textAlign = "center";
      ctx.font = "700 22px Georgia, serif";
      ctx.fillText("DISAHKAN", 0, -4);
      ctx.font = "700 17px Georgia, serif";
      ctx.fillText("MUKTAMAR IPM", 0, 20);
      ctx.restore();
    }
    this.tex.needsUpdate = true;
  }
}

/** S1 Shot 08 Architectural Diorama pedestal label plaque (Beats #10-#13). */
export function basisMiniPlaqueTex(
  num: string,
  title: string,
  sub: string,
  lit: boolean
): THREE.CanvasTexture {
  return cachedPropTex(`basis_min_${num}_${lit ? 1 : 0}`, 384, 160, (ctx, w, h) => {
    ctx.fillStyle = lit ? "#223628" : "#26180d";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = lit ? "#ffd875" : "#8f7141";
    ctx.lineWidth = lit ? 8 : 4;
    ctx.strokeRect(8, 8, w - 16, h - 16);

    ctx.fillStyle = lit ? "#ffe8a3" : "#d9c49e";
    ctx.textAlign = "center";
    ctx.font = "700 32px Georgia, serif";
    ctx.fillText(`${num}. ${title}`, w / 2, 74);
    ctx.fillStyle = lit ? "#d7c99e" : "#9c8763";
    ctx.font = "italic 20px Georgia, serif";
    ctx.fillText(sub, w / 2, 118);
  });
}

/** Progressive S2 Open Book Spread Canvas (Beats #14-#15). */
export class SpiBookSpreadCanvas {
  readonly leftCv: HTMLCanvasElement;
  readonly rightCv: HTMLCanvasElement;
  readonly leftTex: THREE.CanvasTexture;
  readonly rightTex: THREE.CanvasTexture;
  private lastQ = -1;

  constructor() {
    this.leftCv = document.createElement("canvas");
    this.leftCv.width = 512;
    this.leftCv.height = 640;
    this.rightCv = document.createElement("canvas");
    this.rightCv.width = 512;
    this.rightCv.height = 640;
    this.leftTex = new THREE.CanvasTexture(this.leftCv);
    this.rightTex = new THREE.CanvasTexture(this.rightCv);
    this.leftTex.colorSpace = THREE.SRGBColorSpace;
    this.rightTex.colorSpace = THREE.SRGBColorSpace;
    this.leftTex.anisotropy = 8;
    this.rightTex.anisotropy = 8;
    this.update(0);
  }

  update(progress: number): void {
    const q = Math.round(Math.max(0, Math.min(1, progress)) * 30);
    if (q === this.lastQ) return;
    this.lastQ = q;
    const p = q / 30;

    {
      const ctx = this.leftCv.getContext("2d")!;
      const w = this.leftCv.width;
      const h = this.leftCv.height;
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, "#ead8b3");
      grad.addColorStop(0.86, "#f5ebd2");
      grad.addColorStop(1, "#bda278");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = "#7d5b34";
      ctx.lineWidth = 3;
      ctx.strokeRect(28, 30, w - 56, h - 60);

      ctx.fillStyle = "#2a170a";
      ctx.textAlign = "center";
      ctx.font = "700 32px Georgia, serif";
      ctx.fillText("SISTEM", w / 2, 108);
      ctx.fillText("PERKADERAN", w / 2, 148);
      ctx.fillText("IPM", w / 2, 188);
      ctx.fillStyle = "#8d2416";
      ctx.fillRect(w / 2 - 80, 208, 160, 4);

      const compassVis = Math.max(0.25, Math.min(1, p * 2.2));
      const cx = w / 2;
      const cy = 370;
      ctx.save();
      ctx.strokeStyle = "#8d2416";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, 86 * compassVis, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "#3a2210";
      ctx.beginPath();
      ctx.arc(cx, cy, 62, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#d9af57";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = "#ffebb8";
      ctx.font = "700 20px Georgia, serif";
      ctx.fillText("KADER", cx, cy - 6);
      ctx.fillText("PARIPURNA", cx, cy + 20);

      if (p > 0.15) {
        const bridgeU = Math.min(1, (p - 0.15) / 0.25);
        ctx.strokeStyle = "#8d2416";
        ctx.lineWidth = 5;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(cx + 86, cy);
        ctx.lineTo(cx + 86 + (w - (cx + 86)) * bridgeU, cy);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();

      ctx.fillStyle = "#4d3520";
      ctx.font = "italic 20px Georgia, serif";
      ctx.fillText("Pedoman Resmi Kaderisasi", w / 2, 535);
      this.leftTex.needsUpdate = true;
    }

    {
      const ctx = this.rightCv.getContext("2d")!;
      const w = this.rightCv.width;
      const h = this.rightCv.height;
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, "#bfa37a");
      grad.addColorStop(0.14, "#f5ebd2");
      grad.addColorStop(1, "#ead8b3");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = "#7d5b34";
      ctx.lineWidth = 3;
      ctx.strokeRect(28, 30, w - 56, h - 60);

      ctx.fillStyle = "#8d2416";
      ctx.textAlign = "center";
      ctx.font = "700 26px Georgia, serif";
      ctx.fillText("ALUR JENJANG KADERISASI", w / 2, 92);

      const items = [
        ["1. FORTASI", "Orientasi Pelajar Baru"],
        ["2. TARUNA MELATI I", "Basis Ranting & Cabang"],
        ["3. TARUNA MELATI II", "Kepemimpinan Daerah"],
        ["4. TARUNA MELATI III", "Kepemimpinan Wilayah"],
        ["5. TARUNA MELATI UTAMA", "Kepemimpinan Pusat"],
      ];

      const spineVis = Math.max(0, Math.min(1, (p - 0.18) / 0.72));
      if (spineVis > 0.02) {
        ctx.strokeStyle = "#8d2416";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(64, 152);
        ctx.lineTo(64, 152 + 370 * spineVis);
        ctx.stroke();
      }

      ctx.textAlign = "left";
      items.forEach(([title, desc], i) => {
        const y = 148 + i * 92;
        const itemVis = Math.max(0, Math.min(1, (p - (0.12 + i * 0.16)) / 0.18));
        const active = itemVis > 0.25;

        ctx.fillStyle = active ? "#8d2416" : "#8b7355";
        ctx.beginPath();
        ctx.arc(64, y + 6, active ? 10 : 6, 0, Math.PI * 2);
        ctx.fill();

        if (active) {
          ctx.save();
          ctx.globalAlpha = Math.min(1, itemVis * 1.15);
          ctx.fillStyle = "rgba(141, 36, 22, 0.12)";
          ctx.strokeStyle = "#8d2416";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.roundRect(86, y - 22, 378, 64, 8);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }

        ctx.fillStyle = active ? "#7a1c10" : "#3a2412";
        ctx.font = "700 21px Georgia, serif";
        ctx.fillText(title, 100, y + 2);
        ctx.fillStyle = "#5c432b";
        ctx.font = "600 17px Georgia, serif";
        ctx.fillText(desc, 100, y + 28);
      });
      this.rightTex.needsUpdate = true;
    }
  }
}

export function spiBookSpreadTex(side: "left" | "right"): THREE.CanvasTexture {
  const c = new SpiBookSpreadCanvas();
  c.update(1);
  return side === "left" ? c.leftTex : c.rightTex;
}

/** S2 FORTASI portal lintel banner. */
export function fortasiBannerTex(): THREE.CanvasTexture {
  return cachedPropTex("fortasi_lintel_v5", 768, 192, (ctx, w, h) => {
    ctx.fillStyle = "#263829";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#d9af57";
    ctx.lineWidth = 6;
    ctx.strokeRect(12, 12, w - 24, h - 24);
    ctx.fillStyle = "#f7ead0";
    ctx.textAlign = "center";
    ctx.font = "700 54px Georgia, serif";
    ctx.fillText("FORTASI", w / 2, 86);
    ctx.fillStyle = "#f2cb72";
    ctx.font = "italic 24px Georgia, serif";
    ctx.fillText("Forum Ta'aruf & Orientasi Siswa", w / 2, 138);
  });
}

/** S2 Shot 11 "ARAH GERAKAN" easel board texture popping behind mentor & new student (Beat #17). */
export function fortasiOrientationEaselTex(): THREE.CanvasTexture {
  return cachedPropTex("fortasi_orient_easel_v5", 512, 384, (ctx, w, h) => {
    ctx.fillStyle = "#f3e6c8";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#263829";
    ctx.lineWidth = 8;
    ctx.strokeRect(14, 14, w - 28, h - 28);

    ctx.fillStyle = "#263829";
    ctx.textAlign = "center";
    ctx.font = "700 28px Georgia, serif";
    ctx.fillText("ARAH GERAKAN", w / 2, 74);
    ctx.fillStyle = "#8d2416";
    ctx.font = "600 20px Georgia, serif";
    ctx.fillText("PRA-TAHUN AJARAN BARU", w / 2, 110);

    // Three directional pillars
    const nodes = ["AKHLAK PELAJAR", "GERAKAN ILMU", "PERKADERAN IPM"];
    nodes.forEach((lbl, idx) => {
      const y = 166 + idx * 66;
      ctx.fillStyle = "#263829";
      ctx.beginPath();
      ctx.roundRect(68, y - 24, w - 136, 48, 8);
      ctx.fill();
      ctx.strokeStyle = "#d9af57";
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.fillStyle = "#ffebb8";
      ctx.font = "700 20px Georgia, serif";
      ctx.fillText(`→  ${lbl}`, w / 2, y + 6);
    });
  });
}

/** S2 Taruna Melati stepped tier plaque texture with upward chevron (Beats #18-#19). */
export function tmTierTex(title: string, sub: string, highlight: boolean): THREE.CanvasTexture {
  return cachedPropTex(`tm_v5_${title}_${highlight ? 1 : 0}`, 512, 192, (ctx, w, h) => {
    ctx.fillStyle = highlight ? "#3f2714" : "#29190d";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = highlight ? "#f2c66d" : "#9c7b43";
    ctx.lineWidth = highlight ? 8 : 4;
    ctx.strokeRect(10, 10, w - 20, h - 20);

    if (highlight) {
      ctx.fillStyle = "rgba(242, 198, 109, 0.16)";
      ctx.fillRect(18, 18, w - 36, h - 36);
      ctx.strokeStyle = "#ffd875";
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(w - 68, 112);
      ctx.lineTo(w - 48, 82);
      ctx.lineTo(w - 28, 112);
      ctx.stroke();
    }

    ctx.fillStyle = highlight ? "#ffebb8" : "#d8c49c";
    ctx.textAlign = "center";
    ctx.font = "700 38px Georgia, serif";
    ctx.fillText(title, w / 2 - (highlight ? 14 : 0), 86);
    ctx.fillStyle = highlight ? "#f2c66d" : "#a8916b";
    ctx.font = "600 22px Georgia, serif";
    ctx.fillText(sub, w / 2 - (highlight ? 14 : 0), 136);
  });
}

/** Dynamic S2 Shot 13 Orientation Pinboard + "PUNYA RUMAH" House Emblem illuminating on Beat #21. */
export class AgendaCanvas {
  readonly cv: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  readonly tex: THREE.CanvasTexture;
  private lastSig = "";

  constructor() {
    ({ cv: this.cv, ctx: this.ctx, tex: this.tex } = makeDynamicCanvas(512, 640));
    this.update(0, 0);
  }

  update(checkProgress: number, homeGlow = 0): void {
    const qc = Math.round(Math.max(0, Math.min(1, checkProgress)) * 24);
    const qh = Math.round(Math.max(0, Math.min(1, homeGlow)) * 12);
    const sig = `${qc}_${qh}`;
    if (sig === this.lastSig) return;
    this.lastSig = sig;
    const p = qc / 24;
    const hg = qh / 12;
    const ctx = this.ctx;
    const w = this.cv.width;
    const h = this.cv.height;

    ctx.fillStyle = "#f3e6c8";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#8d2416";
    ctx.lineWidth = 5;
    ctx.strokeRect(20, 20, w - 40, h - 40);

    ctx.fillStyle = "#2b1608";
    ctx.textAlign = "center";
    ctx.font = "700 30px Georgia, serif";
    ctx.fillText("JADWAL ORIENTASI", w / 2, 74);
    ctx.fillStyle = "#8d2416";
    ctx.font = "700 18px Georgia, serif";
    ctx.fillText("PRA-TAHUN AJARAN BARU", w / 2, 104);

    // Red yarn vertical line connecting schedule pins
    ctx.strokeStyle = "rgba(141, 36, 22, 0.55)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(73, 150);
    ctx.lineTo(73, 420);
    ctx.stroke();

    const rows = [
      "Sambutan Pelajar Baru",
      "Arah Gerakan IPM",
      "Kenal Ranting & Sekolah",
      "Jadwal Taruna Melati",
    ];
    ctx.textAlign = "left";
    rows.forEach((label, idx) => {
      const y = 166 + idx * 80;
      const checkVis = Math.max(0, Math.min(1, (p - idx * 0.22) / 0.2));

      if (checkVis > 0.1) {
        ctx.fillStyle = "rgba(141, 36, 22, 0.12)";
        ctx.fillRect(46, y - 30, (w - 92) * checkVis, 50);
      }

      ctx.fillStyle = "#f7ebd2";
      ctx.fillRect(58, y - 22, 28, 28);
      ctx.strokeStyle = "#7a5e3c";
      ctx.lineWidth = 3;
      ctx.strokeRect(58, y - 22, 28, 28);

      ctx.fillStyle = "#2b1608";
      ctx.font = "700 22px Georgia, serif";
      ctx.fillText(label, 104, y);

      if (checkVis > 0.05) {
        ctx.save();
        ctx.strokeStyle = "#8d2416";
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(62, y - 8);
        ctx.lineTo(72, y + 1);
        if (checkVis > 0.4) ctx.lineTo(92, y - 26);
        ctx.stroke();
        ctx.restore();
      }
    });

    // Bottom badge blooming on Beat #21 "merasa punya rumah"
    ctx.save();
    ctx.globalAlpha = 0.28 + hg * 0.72;
    ctx.fillStyle = hg > 0.2 ? "#263829" : "#786244";
    ctx.strokeStyle = hg > 0.2 ? "#f2c66d" : "#9c8360";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(56, 472, w - 112, 118, 12);
    ctx.fill();
    ctx.stroke();

    // Small golden roof house icon inside badge
    const hx = 114;
    const hy = 532;
    ctx.strokeStyle = "#ffe296";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(hx - 28, hy - 6);
    ctx.lineTo(hx, hy - 30);
    ctx.lineTo(hx + 28, hy - 6);
    ctx.lineTo(hx + 22, hy - 6);
    ctx.lineTo(hx + 22, hy + 22);
    ctx.lineTo(hx - 22, hy + 22);
    ctx.lineTo(hx - 22, hy - 6);
    ctx.closePath();
    ctx.stroke();

    ctx.fillStyle = "#fff1c7";
    ctx.textAlign = "left";
    ctx.font = "700 24px Georgia, serif";
    ctx.fillText("RUMAH PELAJAR", 162, 526);
    ctx.fillStyle = "#f2cb72";
    ctx.font = "italic 18px Georgia, serif";
    ctx.fillText("Ikatan Pelajar Muhammadiyah", 162, 558);
    ctx.restore();

    this.tex.needsUpdate = true;
  }
}

/** S3 vintage parchment grid floor under the 3D Jawa Barat relief. */
export function prianganMapBaseTex(): THREE.CanvasTexture {
  return cachedPropTex("priangan_grid_base_v5", 1024, 1024, (ctx, w, h) => {
    const grad = ctx.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, w * 0.65);
    grad.addColorStop(0, "#dcc8a0");
    grad.addColorStop(1, "#a78c62");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(65, 44, 24, 0.24)";
    ctx.lineWidth = 2;
    const step = w / 12;
    for (let i = 1; i < 12; i++) {
      ctx.beginPath();
      ctx.moveTo(i * step, 0);
      ctx.lineTo(i * step, h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * step);
      ctx.lineTo(w, i * step);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(141, 36, 22, 0.25)";
    ctx.setLineDash([8, 6]);
    [90, 160, 230].forEach((r) => {
      ctx.beginPath();
      ctx.arc(w * 0.42, h * 0.49, r, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    ctx.fillStyle = "rgba(65, 44, 24, 0.55)";
    ctx.font = "italic 700 26px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("SAMUDRA HINDIA · TATAR PRIANGAN", w * 0.46, h * 0.76);

    const cx = w - 150;
    const cy = 150;
    ctx.strokeStyle = "rgba(65, 44, 24, 0.45)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, 56, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(65, 44, 24, 0.55)";
    ctx.font = "700 22px Georgia, serif";
    ctx.fillText("U", cx, cy - 66);
  });
}

/** S3 Garut 1923 & 1958 stage banner texture. */
export function plaqueGarutTex(year: string, line1: string, line2: string, gold = false): THREE.CanvasTexture {
  return cachedPropTex(`garut_v5_${year}_${gold ? 1 : 0}`, 512, 256, (ctx, w, h) => {
    ctx.fillStyle = gold ? "#2b190d" : "#f2e3c2";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = gold ? "#f2c66d" : "#8d2416";
    ctx.lineWidth = 8;
    ctx.strokeRect(12, 12, w - 24, h - 24);
    ctx.strokeStyle = gold ? "rgba(242, 198, 109, 0.45)" : "rgba(141, 36, 22, 0.35)";
    ctx.lineWidth = 2;
    ctx.strokeRect(22, 22, w - 44, h - 44);

    ctx.fillStyle = gold ? "#ffe49e" : "#8d2416";
    ctx.textAlign = "center";
    ctx.font = "700 64px Georgia, serif";
    ctx.fillText(year, w / 2, 96);
    ctx.fillStyle = gold ? "#f5ebd2" : "#261409";
    ctx.font = "700 27px Georgia, serif";
    ctx.fillText(line1, w / 2, 152);
    ctx.fillStyle = gold ? "#e6c687" : "#5e4328";
    ctx.font = "italic 600 21px Georgia, serif";
    ctx.fillText(line2, w / 2, 198);
  });
}

/** S3 Shot 16 Open Scroll Maklumat 1923 on colonial table between pioneers. */
export function skMaklumatTex(): THREE.CanvasTexture {
  return cachedPropTex("sk_maklumat_1923_v5", 512, 320, (ctx, w, h) => {
    ctx.fillStyle = "#ede0c1";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#4d3620";
    ctx.lineWidth = 6;
    ctx.strokeRect(14, 14, w - 28, h - 28);
    ctx.fillStyle = "#2b1c0e";
    ctx.textAlign = "center";
    ctx.font = "700 26px Georgia, serif";
    ctx.fillText("MAKLUMAT PERINTIS · 1923", w / 2, 74);
    ctx.font = "italic 20px Georgia, serif";
    ctx.fillText("Cabang Garut · SK PP No. 18/Pr", w / 2, 114);
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = "rgba(70, 50, 30, 0.38)";
      ctx.fillRect(68, 150 + i * 30, w - 136, 8);
    }
  });
}

/** S3 Shot 16 Progressive Sepia Historical Wall Chronicle (Beat #24). */
export class ArchiveTimelineCanvas {
  readonly cv: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  readonly tex: THREE.CanvasTexture;
  private lastQ = -1;

  constructor() {
    ({ cv: this.cv, ctx: this.ctx, tex: this.tex } = makeDynamicCanvas(1024, 384));
    this.update(0);
  }

  update(progress: number): void {
    const q = Math.round(Math.max(0, Math.min(1, progress)) * 28);
    if (q === this.lastQ) return;
    this.lastQ = q;
    const p = q / 28;
    const ctx = this.ctx;
    const w = this.cv.width;
    const h = this.cv.height;

    ctx.fillStyle = "#e6d7b8";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#4a3520";
    ctx.lineWidth = 8;
    ctx.strokeRect(14, 14, w - 28, h - 28);
    ctx.lineWidth = 2;
    ctx.strokeRect(26, 26, w - 52, h - 52);

    ctx.fillStyle = "#2b1c0e";
    ctx.textAlign = "center";
    ctx.font = "700 26px Georgia, serif";
    ctx.fillText("KRONIK GARUT · JAWA BARAT (1923–1958)", w / 2, 72);

    const lineLen = (w - 280) * Math.min(1, p * 1.15);
    ctx.strokeStyle = "#5c3d22";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(140, 210);
    ctx.lineTo(140 + lineLen, 210);
    ctx.stroke();

    const stops = [
      { x: 190, yr: "1923", title: "CABANG PERINTIS", sub: "SK PP No. 18/Pr · Garut", tAt: 0.0 },
      { x: 512, yr: "1930-an", title: "BASIS MADRASAH", sub: "Sekolah & Kepanduan Priangan", tAt: 0.28 },
      { x: 834, yr: "1958", title: "KONFERENSI PEMUDA", sub: "Gagasan Wadah Pelajar", tAt: 0.56 },
    ];

    stops.forEach((st) => {
      const vis = Math.max(0.42, Math.min(1, (p - st.tAt) / 0.28));
      ctx.save();
      ctx.globalAlpha = vis;
      ctx.fillStyle = vis > 0.55 ? "#3b2613" : "#5c4630";
      ctx.strokeStyle = "#2b1c0e";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(st.x - 132, 118, 264, 184, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#f2dfb8";
      ctx.font = "700 34px Georgia, serif";
      ctx.fillText(st.yr, st.x, 172);
      ctx.font = "700 20px Georgia, serif";
      ctx.fillText(st.title, st.x, 218);
      ctx.fillStyle = "#d8c298";
      ctx.font = "italic 16px Georgia, serif";
      ctx.fillText(st.sub, st.x, 256);
      ctx.restore();
    });

    this.tex.needsUpdate = true;
  }
}

/** S4 Shot 18 Progressive Pulsing Ranting Network Pinboard (Beats #27-#28). */
export class BranchNetworkCanvas {
  readonly cv: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  readonly tex: THREE.CanvasTexture;
  private lastQ = -1;

  constructor() {
    ({ cv: this.cv, ctx: this.ctx, tex: this.tex } = makeDynamicCanvas(640, 480));
    this.update(0);
  }

  update(pulseProgress: number): void {
    const q = Math.round(Math.max(0, Math.min(1, pulseProgress)) * 28);
    if (q === this.lastQ) return;
    this.lastQ = q;
    const p = q / 28;
    const ctx = this.ctx;
    const w = this.cv.width;
    const h = this.cv.height;

    ctx.fillStyle = "#241910";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#d9af57";
    ctx.lineWidth = 8;
    ctx.strokeRect(14, 14, w - 28, h - 28);

    // Subtle map contour grid inside board
    ctx.strokeStyle = "rgba(217, 175, 87, 0.14)";
    ctx.lineWidth = 1.5;
    for (let x = 40; x < w - 40; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 30);
      ctx.lineTo(x, h - 30);
      ctx.stroke();
    }
    for (let y = 30; y < h - 30; y += 48) {
      ctx.beginPath();
      ctx.moveTo(30, y);
      ctx.lineTo(w - 30, y);
      ctx.stroke();
    }

    ctx.fillStyle = "#ffebb8";
    ctx.textAlign = "center";
    ctx.font = "700 24px Georgia, serif";
    ctx.fillText("JARINGAN RANTING TAROGONG KIDUL", w / 2, 64);

    // Hub PC IPM Panawuan -> 4 pulsing Ranting nodes firing on Beat #28 ("Denyut sejarah")
    const hub = { x: w * 0.5, y: h * 0.52 };
    const nodes = [
      { x: 140, y: 165, label: "PR SEKOLAH", tAt: 0.12 },
      { x: 500, y: 165, label: "PR MADRASAH", tAt: 0.30 },
      { x: 140, y: 375, label: "PR KAMPUNG", tAt: 0.48 },
      { x: 500, y: 375, label: "PDPM PANAWUAN", tAt: 0.66 },
    ];

    nodes.forEach((n) => {
      const lit = Math.max(0, Math.min(1, (p - n.tAt) / 0.25));
      ctx.strokeStyle = lit > 0.1 ? "#ffcf69" : "rgba(217, 175, 87, 0.3)";
      ctx.lineWidth = 3 + lit * 3;
      ctx.beginPath();
      ctx.moveTo(hub.x, hub.y);
      ctx.lineTo(
        hub.x + (n.x - hub.x) * Math.max(0.2, lit),
        hub.y + (n.y - hub.y) * Math.max(0.2, lit)
      );
      ctx.stroke();

      ctx.fillStyle = lit > 0.3 ? "#8d2416" : "#3a291a";
      ctx.strokeStyle = lit > 0.3 ? "#ffe296" : "#a88952";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(n.x - 102, n.y - 30, 204, 60, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = lit > 0.3 ? "#fff4d4" : "#bfa87e";
      ctx.font = "700 18px Georgia, serif";
      ctx.fillText(n.label, n.x, n.y + 6);
    });

    // Central pulsing Hub circle
    ctx.fillStyle = "#8d2416";
    ctx.beginPath();
    ctx.arc(hub.x, hub.y, 64, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ffe296";
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.fillStyle = "#fff4d4";
    ctx.font = "700 20px Georgia, serif";
    ctx.fillText("PC IPM", hub.x, hub.y - 4);
    ctx.font = "700 17px Georgia, serif";
    ctx.fillText("PANAWUAN", hub.x, hub.y + 20);

    this.tex.needsUpdate = true;
  }
}

/** S4 Progressive PC IPM Panawuan wood & brass branch plaque illuminating TM -> PDPM (Beats #29-#30). */
export class PanawuanPlaqueCanvas {
  readonly cv: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  readonly tex: THREE.CanvasTexture;
  private lastSig = "";

  constructor() {
    ({ cv: this.cv, ctx: this.ctx, tex: this.tex } = makeDynamicCanvas(768, 384));
    this.update(0, 0);
  }

  update(tmLight: number, pdpmLight: number, flow = 0): void {
    const q1 = Math.round(Math.max(0, Math.min(1, tmLight)) * 12);
    const q2 = Math.round(Math.max(0, Math.min(1, pdpmLight)) * 12);
    const q3 = Math.round(Math.max(0, Math.min(1, flow)) * 36);
    const sig = `${q1}_${q2}_${q3}`;
    if (sig === this.lastSig) return;
    this.lastSig = sig;
    const p1 = q1 / 12;
    const p2 = q2 / 12;
    const pf = q3 / 36;
    const ctx = this.ctx;
    const w = this.cv.width;
    const h = this.cv.height;

    ctx.fillStyle = "#3a2212";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#d9af57";
    ctx.lineWidth = 10;
    ctx.strokeRect(18, 18, w - 36, h - 36);
    ctx.strokeStyle = "#f6ebd2";
    ctx.lineWidth = 2;
    ctx.strokeRect(32, 32, w - 64, h - 64);

    ctx.fillStyle = "#ffebb8";
    ctx.textAlign = "center";
    ctx.font = "700 44px Georgia, serif";
    ctx.fillText("PC IPM PANAWUAN", w / 2, 108);

    ctx.fillStyle = "#d9af57";
    ctx.font = "600 24px Georgia, serif";
    ctx.fillText("TAROGONG KIDUL · GARUT", w / 2, 152);

    ctx.fillStyle = p1 > 0.4 ? "#284632" : "#222e24";
    ctx.fillRect(58, 194, 304, 128);
    ctx.strokeStyle = p1 > 0.4 ? "#ffd875" : "#9c7b43";
    ctx.lineWidth = p1 > 0.4 ? 6 : 2.5;
    ctx.strokeRect(58, 194, 304, 128);
    ctx.fillStyle = "#ffebb8";
    ctx.font = "700 25px Georgia, serif";
    ctx.fillText("TARUNA MELATI", 210, 248);
    ctx.fillStyle = "#d9c398";
    ctx.font = "600 18px Georgia, serif";
    ctx.fillText("Kaderisasi Ranting", 210, 286);

    if (p1 > 0.25) {
      ctx.strokeStyle = "#ffd875";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(368, 258);
      ctx.lineTo(400, 258);
      ctx.stroke();
    }

    ctx.fillStyle = p2 > 0.4 ? "#284632" : "#222e24";
    ctx.fillRect(406, 194, 304, 128);
    ctx.strokeStyle = p2 > 0.4 ? "#ffd875" : "#9c7b43";
    ctx.lineWidth = p2 > 0.4 ? 6 : 2.5;
    ctx.strokeRect(406, 194, 304, 128);
    ctx.fillStyle = "#ffebb8";
    ctx.font = "700 24px Georgia, serif";
    ctx.fillText("PELATIHAN DA'I", 558, 248);
    ctx.fillStyle = "#d9c398";
    ctx.font = "600 18px Georgia, serif";
    ctx.fillText("Pelajar (PDPM)", 558, 286);

    // B-roll rail: a gold line draws left -> right under both programmes with a travelling light and three lighting nodes
    if (pf > 0.01) {
      const x0 = 58;
      const x1 = 710;
      const ry = 348;
      ctx.strokeStyle = "rgba(217, 175, 87, 0.35)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x0, ry);
      ctx.lineTo(x1, ry);
      ctx.stroke();
      const xe = x0 + (x1 - x0) * pf;
      ctx.strokeStyle = "#ffd875";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(x0, ry);
      ctx.lineTo(xe, ry);
      ctx.stroke();
      [210, 384, 558].forEach((nx) => {
        const on = xe >= nx;
        ctx.fillStyle = on ? "#ffd875" : "#6b5230";
        ctx.beginPath();
        ctx.arc(nx, ry, on ? 9 : 5, 0, Math.PI * 2);
        ctx.fill();
      });
      if (pf < 0.99) {
        ctx.fillStyle = "#fff3c4";
        ctx.beginPath();
        ctx.arc(xe, ry, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    this.tex.needsUpdate = true;
  }
}

export function panawuanPlaqueTex(): THREE.CanvasTexture {
  const c = new PanawuanPlaqueCanvas();
  c.update(1, 1);
  return c.tex;
}

/** S1 Shot 5 B-roll Question Sheet: PUSAT -- ? --> SISWA BARU drawn on student desk during Andi's question. */
export class QuestionDiagramCanvas {
  readonly cv: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  readonly tex: THREE.CanvasTexture;
  private lastQ = -1;

  constructor() {
    ({ cv: this.cv, ctx: this.ctx, tex: this.tex } = makeDynamicCanvas(512, 340));
    this.update(0);
  }

  update(progress: number): void {
    const q = Math.round(Math.max(0, Math.min(1, progress)) * 28);
    if (q === this.lastQ) return;
    this.lastQ = q;
    const p = q / 28;
    const ctx = this.ctx;
    const w = this.cv.width;
    const h = this.cv.height;

    ctx.fillStyle = "#f4e8cd";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#7a5b35";
    ctx.lineWidth = 4;
    ctx.strokeRect(14, 14, w - 28, h - 28);

    ctx.fillStyle = "#8d2416";
    ctx.textAlign = "center";
    ctx.font = "700 22px Georgia, serif";
    ctx.fillText("TANDA TANYA KADERISASI", w / 2, 62);

    // Left box: ATURAN PUSAT
    ctx.fillStyle = "#2b190d";
    ctx.beginPath();
    ctx.roundRect(38, 128, 140, 82, 8);
    ctx.fill();
    ctx.fillStyle = "#f5ebd2";
    ctx.font = "700 18px Georgia, serif";
    ctx.fillText("ATURAN", 108, 162);
    ctx.font = "600 15px Georgia, serif";
    ctx.fillStyle = "#e6c687";
    ctx.fillText("PUSAT (PP)", 108, 188);

    // Dotted connecting path + "?" emblem blooming mid-frame
    const linkVis = Math.max(0, Math.min(1, p / 0.65));
    if (linkVis > 0.02) {
      ctx.save();
      ctx.strokeStyle = "#8d2416";
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(186, 169);
      ctx.lineTo(186 + 140 * linkVis, 169);
      ctx.stroke();
      ctx.restore();
    }
    if (p > 0.25) {
      const qVis = Math.min(1, (p - 0.25) / 0.28);
      ctx.save();
      ctx.globalAlpha = qVis;
      ctx.fillStyle = "#8d2416";
      ctx.beginPath();
      ctx.arc(256, 169, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff4d9";
      ctx.font = "700 34px Georgia, serif";
      ctx.fillText("?", 256, 181);
      ctx.restore();
    }

    // Right box: SISWA BARU lighting up as question finishes
    const rightLit = p > 0.65;
    ctx.fillStyle = rightLit ? "#21402a" : "#d8c8a8";
    ctx.strokeStyle = rightLit ? "#c99b42" : "#7a5b35";
    ctx.lineWidth = rightLit ? 4 : 2;
    ctx.beginPath();
    ctx.roundRect(334, 128, 140, 82, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = rightLit ? "#ffefc2" : "#3a2718";
    ctx.font = "700 18px Georgia, serif";
    ctx.fillText("SISWA", 404, 162);
    ctx.fillText("BARU", 404, 188);

    ctx.fillStyle = "#4d3620";
    ctx.font = "italic 17px Georgia, serif";
    ctx.fillText("Bagaimana menyambungkan jarak ini?", w / 2, 276);

    this.tex.needsUpdate = true;
  }
}
