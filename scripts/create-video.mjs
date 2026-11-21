#!/usr/bin/env node
/**
 * Z-Automation Studio — Interactive 1-Command Video Project Wizard (`npm run create:video`)
 *
 * Memudahkan orang awam maupun kreator untuk memilih 1 dari 8 Master Video Style Skills,
 * menyiapkan folder proyek `<slug>/`, menyalin `.env` bila belum ada, dan menghasilkan
 * Prompt 1-Kalimat siap copy-paste ke AI Agent (Antigravity, Claude Code, Cursor, Windsurf, Codex).
 *
 * Usage:
 *   npm run create:video
 *   npm run create:video -- --style=1 --topic="Kenapa Jembatan Gantung Tidak Runtuh?" --duration=70
 */
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const STYLES = [
  {
    num: 1,
    id: "3d-cutaway-explainer",
    title: "3D Cutaway Explainer V6 (Full HD 1080x1920 + 2-Bone Analytical IK)",
    desc: "Bedah cara kerja infrastruktur, sains sehari-hari, pertanian & teknik (gaya @gimanabisaid / Sawah Terasering)",
    goldenRef: "remotion/videos/sawah-terasering/ & sawah-terasering/scripts/",
    resolution: "1080x1920 (Full HD 9:16, 30 fps)",
    previewImg: "docs/previews/01-3d-cutaway-sawah.jpg",
  },
  {
    num: 2,
    id: "vintage-poster-explainer",
    title: "2D Vintage Poster & Gouache Cross-Section Explainer",
    desc: "Geografi, gunung api, ekosistem & sejarah alam dengan peta d3-geo & kartu pos klasik (gaya Danau Toba / Gunung Guntur)",
    goldenRef: "remotion/videos/gunung-guntur/ & remotion/videos/gambut-history/",
    resolution: "720x1280 / 1080x1920 (9:16, 30 fps)",
    previewImg: "docs/previews/02-vintage-poster-guntur.jpg",
  },
  {
    num: 3,
    id: "twilight-parchment-docu",
    title: "2D Twilight Parchment Cinematic Documentary",
    desc: "Sejarah peradaban manusia, antropologi & sejarah organisasi/bangsa dengan 5-layer parallax & rim-light (gaya Manusia & Api / GMNI)",
    goldenRef: "remotion/videos/human-fire/ & remotion/videos/gmni-history/",
    resolution: "720x1280 / 1080x1920 (9:16, 30 fps)",
    previewImg: "docs/previews/03-twilight-parchment-fire.jpg",
  },
  {
    num: 4,
    id: "earth-24h-celestial-docu",
    title: "24-Hour Celestial Clock & Deep-Time Evolution Documentary",
    desc: "Sejarah panjang (Bumi, Alam Semesta, Evolusi, Internet, Nusantara) yang dipadatkan ke dalam jam astrolabe 24 jam",
    goldenRef: "remotion/videos/earth-24h/",
    resolution: "720x1280 (9:16, 30 fps)",
    previewImg: "docs/previews/04-earth-24h-clock.jpg",
  },
  {
    num: 5,
    id: "cosmic-vfx-explainer",
    title: "Cosmic & Astrophysics GLSL Shader + Astronaut Visor POV",
    desc: "Lubang hitam, relativitas, bintang neutron & eksplorasi antariksa dengan shader lensing GLSL & jam dilatasi waktu",
    goldenRef: "remotion/videos/black-hole/ & remotion/kurzgesagt/",
    resolution: "720x1280 / 1080x1920 (9:16, 30/60 fps)",
    previewImg: "docs/previews/05-cosmic-vfx-blackhole.jpg",
  },
  {
    num: 6,
    id: "cartoon-3d-short",
    title: "Cartoon 3D Short (2D Stickman / Bean-Head in 3D World)",
    desc: "Cerita sejarah unik, komedi & asal-usul daerah dengan karakter kartun 2D ekspresif di dalam kota/dunia 3D penuh warna",
    goldenRef: "remotion/videos/bridge/, remotion/videos/cnut/, remotion/videos/kakarut/",
    resolution: "1080x1920 (Full HD 9:16, 30 fps)",
    previewImg: "docs/previews/06-cartoon-3d-kakarut.jpg",
  },
  {
    num: 7,
    id: "ipm-premium-documentary-studio",
    title: "Historical Archival Woodcut/Gouache & Animated Cartography Series",
    desc: "Dokumenter sejarah serius berbasis buku bukti sejarah (evidence_ledger) & peta d3-geo Nusantara interaktif",
    goldenRef: "ipm-chronicles/ & remotion/videos/historical-diorama/",
    resolution: "1080x1920 (Full HD 9:16, 30 fps)",
    previewImg: "docs/previews/07-archival-map-diorama.jpg",
  },
  {
    num: 8,
    id: "saas-product-promo",
    title: "Commercial SaaS, App & 3D Tech Launch Promo",
    desc: "Video promosi aplikasi, website, atau produk digital (Clean UI Demo / Continuous Workflow / High-Energy 3D Hype Reel)",
    goldenRef: "remotion/compositions/ZAutomationLaunch.tsx & ZAutomationSquarePromo.tsx",
    resolution: "1920x1080 (16:9), 1080x1920 (9:16), atau 1080x1080 (1:1)",
    previewImg: "docs/previews/08-saas-product-promo.jpg",
  },
];

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .split("-")
    .slice(0, 4)
    .join("-") || "video-baru";
}

function parseArgs(argv) {
  const out = {};
  for (const arg of argv) {
    if (arg.startsWith("--style=")) out.style = Number(arg.split("=")[1]);
    if (arg.startsWith("--topic=")) out.topic = arg.slice("--topic=".length).replace(/^["']|["']$/g, "");
    if (arg.startsWith("--duration=")) out.duration = Number(arg.split("=")[1]);
    if (arg.startsWith("--slug=")) out.slug = arg.slice("--slug=".length);
  }
  return out;
}

async function main() {
  const cli = parseArgs(process.argv.slice(2));

  console.log("\n================================================================================");
  console.log("  Z-AUTOMATION STUDIO — WIZARD PEMBUAT VIDEO AI (RAMAH ORANG AWAM)");
  console.log("================================================================================\n");

  for (const s of STYLES) {
    console.log(`  [${s.num}] ${s.title}`);
    console.log(`      Skill ID : ${s.id}`);
    console.log(`      Cocok utk: ${s.desc}\n`);
  }

  let styleNum = cli.style;
  let topic = cli.topic;
  let duration = cli.duration || 70;

  if (!styleNum || !topic) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    try {
      if (!styleNum) {
        const ans = await rl.question("👉 Pilih Nomor Style Video (1-8) [default: 1]: ");
        styleNum = Number(ans.trim() || "1");
      }
      if (!topic) {
        const ans = await rl.question(
          "👉 Masukkan Topik / Pertanyaan Video (misal: Kenapa Jembatan Gantung Tidak Runtuh Saat Badai?): "
        );
        topic = ans.trim() || "Kenapa Jembatan Gantung Tidak Runtuh Saat Badai?";
      }
      if (!cli.duration) {
        const ans = await rl.question("👉 Target Durasi dalam Detik [default: 70]: ");
        duration = Number(ans.trim() || "70");
      }
    } finally {
      rl.close();
    }
  }

  const chosen = STYLES.find((s) => s.num === styleNum) || STYLES[0];
  const slug = cli.slug || slugify(topic);

  // 1. Ensure .env exists (copy from .env.example if missing)
  const envPath = join(ROOT, ".env");
  const envExamplePath = join(ROOT, ".env.example");
  let envCreated = false;
  if (!existsSync(envPath) && existsSync(envExamplePath)) {
    copyFileSync(envExamplePath, envPath);
    envCreated = true;
  }

  // 2. Scaffold project directories & PROJECT_BRIEF.md
  const projDir = join(ROOT, slug);
  const scriptsDir = join(projDir, "scripts");
  const outDir = join(projDir, "out");
  const remotionVideoDir = join(ROOT, "remotion", "videos", slug);

  mkdirSync(scriptsDir, { recursive: true });
  mkdirSync(outDir, { recursive: true });
  mkdirSync(remotionVideoDir, { recursive: true });

  const magicPrompt = `Gunakan skill ${chosen.id} (.agents/skills/${chosen.id}/SKILL.md) dan brutal-storyteller untuk membuat video ${chosen.resolution} durasi ~${duration} detik di folder "${slug}/" & "remotion/videos/${slug}/" dengan topik: "${topic}". Kerjakan otomatis 100% dari penulisan naskah, sintesis VO ElevenLabs + SFX + musik -14.8 LUFS, pembuatan komponen visual Remotion mengikuti golden reference (${chosen.goldenRef}), audit visual QA contact sheet 16 frame, sampai render file MP4 final di "${slug}/out/${slug.replace(/-/g, "_")}.mp4".`;

  const briefMd = `# Project Brief: ${topic}

- **Slug Proyek**: \`${slug}\`
- **Style Skill**: \`${chosen.id}\` ([\`.agents/skills/${chosen.id}/SKILL.md\`](../.agents/skills/${chosen.id}/SKILL.md))
- **Nama Style**: ${chosen.title}
- **Golden Reference**: \`${chosen.goldenRef}\`
- **Resolusi Target**: ${chosen.resolution}
- **Durasi Target**: ~${duration} detik
- **Output MP4 Target**: \`${slug}/out/${slug.replace(/-/g, "_")}.mp4\`

---

## Prompt 1-Kalimat Siap Copy-Paste ke AI Agent
*(Salin seluruh teks di dalam kotak di bawah ini, lalu tempelkan ke chat Antigravity, Claude Code, Cursor, Windsurf, atau Codex)*

\`\`\`text
${magicPrompt}
\`\`\`
`;

  const briefPath = join(projDir, "PROJECT_BRIEF.md");
  writeFileSync(briefPath, briefMd, "utf8");

  console.log("\n================================================================================");
  console.log(`✅ PROYEK "${slug}" BERHASIL DISIAPKAN!`);
  console.log("================================================================================");
  console.log(`📁 Folder Proyek  : ${projDir}`);
  console.log(`📁 Folder Remotion: ${remotionVideoDir}`);
  console.log(`📄 Brief & Prompt : ${briefPath}`);
  if (envCreated) {
    console.log(`🔑 File .env dibuat otomatis dari .env.example! Jangan lupa isi ELEVENLABS_API_KEY di .env.`);
  }
  console.log("\n📋 COPY-PASTE PROMPT 1-KALIMAT INI KE CHAT AI AGENT KAMU:\n");
  console.log("--------------------------------------------------------------------------------");
  console.log(magicPrompt);
  console.log("--------------------------------------------------------------------------------\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
