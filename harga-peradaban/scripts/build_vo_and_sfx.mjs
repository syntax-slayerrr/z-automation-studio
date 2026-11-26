/**
 * Audio-First Dramatic Narrator VO & Bespoke Cinema Foley Generator for "HargaPeradabanShort"
 * ("HARGA SEBUAH PERADABAN — Bagaimana Sebuah Keputusan Mengubah Kehidupan Manusia Selamanya").
 *
 * - Primary Narrator: George (`JBFqnCBsd6RMkjVDRZzb`, Deep Dramatic Documentary Storyteller) via `eleven_v4` (`id`).
 * - Exact 25-Shot Verbatim Indonesian Script across 6 Acts (`S01_01..S06_04`).
 * - Generates 11 bespoke cinema foley SFX via `eleven_text_to_sound_v3` with automatic retry guard.
 *
 * Run:
 *   node --env-file=.env harga-peradaban/scripts/build_vo_and_sfx.mjs
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { Readable } from "node:stream";
import { finished } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT = resolve(__dirname, "..");
const ROOT = resolve(PROJECT, "..");

const TTS_MODEL = "eleven_v4";
const SFX_MODEL = "eleven_text_to_sound_v3";
const SR = 44100;
const FPS = 30;
const TEMPO = 1.28;
const OPEN_LEAD_SILENCE_S = 1.25; // Savanna wind & distant footsteps establish Nara's world before dramatic opening line
const END_TAIL_PAD_S = 5.20; // Nara walks out of frame across swaying golden wheat -> End Card lock

const NARRATOR = {
  id: "JBFqnCBsd6RMkjVDRZzb", // George — Deep, Theatrical, Dramatic Documentary Storyteller
  label: "George (Dramatic Cinema Narrator)",
  stability: 0.42,
  similarityBoost: 0.80,
};

async function withRetry(label, fn, maxAttempts = 4) {
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const waitMs = attempt * 3000;
      console.warn(`  [RETRY ${attempt}/${maxAttempts}] ${label} failed (${err?.code || err?.message || err}); retrying in ${waitMs / 1000}s...`);
      if (attempt < maxAttempts) await new Promise((r) => setTimeout(r, waitMs));
    }
  }
  throw lastErr;
}

// 25 Verbatim Documentary Shots across 6 Scenes
const BEATS = [
  // SCENE 01 — DUNIA YANG SELALU DITINGGALKAN
  {
    scene: 1,
    key: "s01_01",
    pauseAfterS: 0.42,
    text: "[dramatic, brooding] [[s01_01_savanna]]Bayangkan hidup tanpa rumah. Setiap pagi, Nara dan kelompoknya harus mencari tahu ke mana mereka akan pergi.",
  },
  {
    scene: 1,
    key: "s01_02",
    pauseAfterS: 0.40,
    text: "[focused, tense] [[s01_02_tracks]]Ketika kawanan rusa berpindah, mereka mengikutinya. Ketika buah habis, mereka mencari hutan lain. Ketika musim berubah, mereka meninggalkan tempat yang sudah tidak lagi menyediakan makanan.",
  },
  {
    scene: 1,
    key: "s01_03",
    pauseAfterS: 0.42,
    text: "[warm, resonant] [[s01_03_forage]]Bagi mereka, tanah bukan sesuatu yang dimiliki. Hutan bukan sesuatu yang harus dipagari. Alam menyediakan makanan, dan manusia mengikuti ke mana makanan membawa mereka.",
  },
  {
    scene: 1,
    key: "s01_04",
    pauseAfterS: 0.68,
    text: "[somber, intimate] [[s01_04_fire]]Kehidupan itu keras. Tidak ada jaminan makanan untuk esok hari. [[s01_04_leave]]Namun, selama mereka masih bisa bergerak, selalu ada tempat lain untuk dicari.",
  },

  // SCENE 02 — LEMBAH YANG MENGUBAH PIKIRANNYA
  {
    scene: 2,
    key: "s02_01",
    pauseAfterS: 0.38,
    text: "[awestruck, warm] [[s02_01_valley]]Suatu hari, perjalanan mereka membawa Nara ke sebuah lembah yang berbeda. Tanahnya subur. Air mengalir di dekatnya. Dan di sepanjang lembah, tanaman liar tumbuh begitu melimpah.",
  },
  {
    scene: 2,
    key: "s02_02",
    pauseAfterS: 0.36,
    text: "[curious, intimate] [[s02_02_wheat]]Nara menemukan bulir-bulir gandum liar. Ia mengumpulkannya. Membawanya kembali ke kelompok.",
  },
  {
    scene: 2,
    key: "s02_03",
    pauseAfterS: 0.44,
    text: "[whispering, wonder] [[s02_03_return]]Hari berikutnya, ia kembali ke tempat yang sama. Makanan masih tersedia. [[s02_03_sprout]]Namun, kali ini ia memperhatikan sesuatu yang sebelumnya tidak pernah ia pikirkan. Beberapa biji yang jatuh ke tanah mulai tumbuh menjadi tanaman baru.",
  },
  {
    scene: 2,
    key: "s02_04",
    pauseAfterS: 0.66,
    text: "[dramatic, thoughtful] [[s02_04_idea]]Bagaimana jika makanan tidak harus selalu dicari? Bagaimana jika mereka bisa menumbuhkannya sendiri?",
  },

  // SCENE 03 — KEPUTUSAN UNTUK MENETAP
  {
    scene: 3,
    key: "s03_01",
    pauseAfterS: 0.36,
    text: "[steady, hopeful] [[s03_01_plant]]Nara mulai mencoba menanam biji-bijian itu. Awalnya hanya sedikit.",
  },
  {
    scene: 3,
    key: "s03_02",
    pauseAfterS: 0.42,
    text: "[dramatic, resolute] [[s03_02_debate]]Tetapi hasilnya cukup untuk membuat kelompoknya mempertimbangkan sesuatu yang sebelumnya tidak pernah mereka pikirkan: tinggal lebih lama.",
  },
  {
    scene: 3,
    key: "s03_03",
    pauseAfterS: 0.38,
    text: "[warm, building] [[s03_03_build]]Mereka membangun tempat berlindung. Membuka lahan. Menyimpan benih untuk musim berikutnya.",
  },
  {
    scene: 3,
    key: "s03_04",
    pauseAfterS: 0.42,
    text: "[resonant, uplifting] [[s03_04_harvest]]Untuk pertama kalinya, Nara tidak lagi mempersiapkan perjalanan berikutnya. Ia mulai mempersiapkan panen berikutnya.",
  },
  {
    scene: 3,
    key: "s03_05",
    pauseAfterS: 0.72,
    text: "[warm, expansive] [[s03_05_sunset]]Hari berganti menjadi bulan. Bulan berganti menjadi musim. Ladang kecil itu tumbuh. Dan bersama ladang tersebut, sebuah kehidupan baru mulai terbentuk.",
  },

  // SCENE 04 — APA YANG KITA MILIKI HARUS KITA PERTAHANKAN
  {
    scene: 4,
    key: "s04_01",
    pauseAfterS: 0.44,
    text: "[calm, then uneasy] [[s04_01_good]]Awalnya, semua berjalan seperti yang Nara bayangkan. Mereka memiliki makanan. Mereka tidak harus terus berpindah. Anak-anak bisa tumbuh di tempat yang sama. [[s04_01_missing]]Namun, semakin banyak persediaan yang mereka miliki, semakin banyak pula persoalan yang muncul. Suatu hari, persediaan gandum berkurang.",
  },
  {
    scene: 4,
    key: "s04_02",
    pauseAfterS: 0.42,
    text: "[tense, somber] [[s04_02_fences]]Ladang mulai memiliki batas. Lumbung mulai memiliki pemilik. Orang-orang mulai mempertanyakan siapa yang berhak mengambil hasil panen.",
  },
  {
    scene: 4,
    key: "s04_03",
    pauseAfterS: 0.42,
    text: "[urgent, dramatic] [[s04_03_water]]Nara yang dahulu berbagi makanan dengan mudah, kini harus menghadapi pertengkaran karena makanan yang mereka kumpulkan. Bahkan air pun menjadi persoalan. Ketika persediaan air berkurang, setiap keluarga ingin ladangnya tetap mendapatkan bagian.",
  },
  {
    scene: 4,
    key: "s04_04",
    pauseAfterS: 0.68,
    text: "[dark, brooding] [[s04_04_rules]]Kehidupan yang dahulu sederhana kini membutuhkan aturan. Dan orang-orang mulai berebut menentukan aturan itu.",
  },

  // SCENE 05 — DUNIA YANG JAUH LEBIH BESAR DARI NARA
  {
    scene: 5,
    key: "s05_01",
    pauseAfterS: 0.44,
    text: "[deep, solemn] [[s05_01_bracelet]]Nara tidak pernah tahu bahwa perubahan kecil yang dimulainya akan berkembang jauh melampaui kehidupannya.",
  },
  {
    scene: 5,
    key: "s05_02",
    pauseAfterS: 0.42,
    text: "[majestic, sweeping] [[s05_02_uruk]]Ribuan tahun kemudian, di Mesopotamia, permukiman pertanian berkembang menjadi kota-kota besar seperti Uruk. Kehidupan masyarakat menjadi semakin kompleks. Ada petani yang menghasilkan makanan, pengrajin yang membuat perkakas, pedagang yang bertukar barang, dan pemimpin yang mengatur masyarakat.",
  },
  {
    scene: 5,
    key: "s05_03",
    pauseAfterS: 0.42,
    ttsSwap: { kuneiform: "kune-iform" },
    text: "[crisp, authoritative] [[s05_03_clay]]Persediaan harus dicatat. Perdagangan harus dihitung. Hasil produksi harus dikelola. Tulisan kuneiform berkembang sebagai salah satu alat untuk mengatur kebutuhan tersebut.",
  },
  {
    scene: 5,
    key: "s05_04",
    pauseAfterS: 0.72,
    text: "[epic, resonant] [[s05_04_city]]Ladang kecil yang dahulu dirawat manusia seperti Nara kini telah menjadi bagian dari sistem yang menopang kota, pemerintahan, dan peradaban.",
  },

  // SCENE 06 — APAKAH SEMUA INI SEPADAN?
  {
    scene: 6,
    key: "s06_01",
    pauseAfterS: 0.42,
    text: "[dramatic, contemplative] [[s06_01_harvester]]Bayangkan jika Nara bisa melihat dunia hari ini. Ladang yang dahulu ia tanami kini telah menjadi pertanian industri. Kota-kota tumbuh jauh melampaui lembah tempat ia pernah tinggal.",
  },
  {
    scene: 6,
    key: "s06_02",
    pauseAfterS: 0.42,
    text: "[steady, incisive] [[s06_02_global]]Kita punya mesin, teknologi, dan perdagangan global. Tetapi kita masih bergantung pada sesuatu yang sama: makanan. Setiap hari, jutaan manusia bekerja untuk memastikan makanan diproduksi, disimpan, dan sampai ke meja kita.",
  },
  {
    scene: 6,
    key: "s06_03",
    pauseAfterS: 0.56,
    text: "[deep, philosophical] [[s06_03_city]]Nara memilih menetap karena ingin hidup lebih pasti. Namun, keputusan itu ikut membuka jalan bagi dunia yang jauh lebih kompleks. Dunia dengan kota, kekayaan, perdagangan, dan kekuasaan. Dunia yang memungkinkan manusia berkembang, tetapi juga membuat mereka semakin bergantung pada sistem yang mereka ciptakan sendiri.",
  },
  {
    scene: 6,
    key: "s06_04",
    pauseAfterS: 0.30,
    text: "[quiet, haunting, profound] [[s06_04_wheat]]Mungkin Nara tidak pernah benar-benar menaklukkan alam. [[s06_04_leave]]Ia hanya menemukan cara baru untuk bergantung kepadanya.",
  },
];

// 11 Bespoke Cinema Foley SFX via ElevenLabs `eleven_text_to_sound_v3` (~1,100 credits total!)
const BESPOKE_SFX = [
  {
    name: "sfx_01_savanna_wind_footsteps.mp3",
    durationSeconds: 5.5,
    promptInfluence: 0.62,
    prompt: "Vast sunlit prehistoric savanna dry wind blowing through tall golden grass, distant quiet leather footsteps crunching dry earth and subtle distant birds, cinema documentary field recording, no music",
  },
  {
    name: "sfx_02_campfire_night_crackle.mp3",
    durationSeconds: 5.5,
    promptInfluence: 0.60,
    prompt: "Intimate crackling wood campfire at night on open plain, warm popping embers, gentle night breeze and distant crickets, realistic cinematic foley, no music",
  },
  {
    name: "sfx_03_fertile_valley_stream_wheat.mp3",
    durationSeconds: 5.5,
    promptInfluence: 0.60,
    prompt: "Gentle flowing fresh river stream in a lush fertile valley with warm breeze rustling golden wild wheat stalks and delicate hand brushing dry grain heads, realistic documentary foley, no music",
  },
  {
    name: "sfx_04_seed_soil_sprout_timelapse.mp3",
    durationSeconds: 5.0,
    promptInfluence: 0.60,
    prompt: "Close-up tactile hand pressing seed into soft damp earth followed by subtle organic earthy rustle and gentle shimmering botanical growth swell, poetic documentary sound design, no music",
  },
  {
    name: "sfx_05_village_building_harvest.mp3",
    durationSeconds: 5.5,
    promptInfluence: 0.60,
    prompt: "Warm ancient early farming village ambience, wooden posts thudding into soil, rhythmic sickle swishing crisply through ripe golden wheat stalks and woven basket filling with grain, documentary foley, no music",
  },
  {
    name: "sfx_06_granary_door_creak_hush.mp3",
    durationSeconds: 5.0,
    promptInfluence: 0.62,
    prompt: "Heavy wooden granary door slowly creaking open into a tense shadowed clay storage room, dry grain trickling softly across stone floor, eerie suspenseful documentary silence, no music",
  },
  {
    name: "sfx_07_fence_stakes_water_dispute.mp3",
    durationSeconds: 5.5,
    promptInfluence: 0.60,
    prompt: "Heavy wooden fence stakes hammered sharply into dry ground, low trickling drying irrigation ditch water, distant tense muffled human argument murmurs under dry wind, dramatic historical foley, no music",
  },
  {
    name: "sfx_08_cuneiform_clay_stylus.mp3",
    durationSeconds: 5.0,
    promptInfluence: 0.64,
    prompt: "Extreme close-up crisp reed stylus pressing deliberate triangular wedge marks into soft wet Mesopotamian clay tablet, quiet resonant temple stone room ambience, tactile historical foley, no music",
  },
  {
    name: "sfx_09_ancient_uruk_city_bustle.mp3",
    durationSeconds: 5.5,
    promptInfluence: 0.60,
    prompt: "Sweeping aerial soundscape of ancient Mesopotamian city Uruk, distant bustling bazaar murmurs, wooden cart wheels on stone streets, faint bronze temple bell echoing across wide mudbrick plazas, no music",
  },
  {
    name: "sfx_10_modern_harvester_freight_city.mp3",
    durationSeconds: 6.0,
    promptInfluence: 0.62,
    prompt: "Powerful modern combine harvester rumbling across wheat field transitioning smoothly into deep highway truck hum, distant cargo ship horn across ocean, and soft contemporary urban metropolis pulse, documentary sound design, no music",
  },
  {
    name: "sfx_11_golden_wheat_sunset_wind.mp3",
    durationSeconds: 6.0,
    promptInfluence: 0.60,
    prompt: "Serene poignant late afternoon breeze sweeping softly across an endless golden wheat field, gentle slow footsteps fading quietly away into vast calm wind, poetic film ending ambience, no music",
  },
];

function prepareBeat(beat, lineIdx) {
  const displayTokens = [];
  const ttsChunks = [];
  const swaps = beat.ttsSwap ?? {};

  const parts = beat.text.split(/(?<!\[)(\[[^\[\]]+\])(?!\])/g);
  for (const part of parts) {
    if (!part) continue;
    if (/^\[[^\[\]]+\]$/.test(part)) {
      ttsChunks.push(part);
      continue;
    }
    for (const tok of part.trim().split(/\s+/)) {
      if (!tok) continue;
      const m = tok.match(/^(?:\[\[([^\]]+)\]\])?(.*)$/);
      const cue = m[1] || null;
      const disp = m[2];
      if (!disp) continue;
      let spoken = disp;
      for (const [k, v] of Object.entries(swaps)) {
        if (spoken.includes(k)) spoken = spoken.replaceAll(k, v);
      }
      displayTokens.push({ w: disp, spoken, cue, line: lineIdx, scene: beat.scene, shotKey: beat.key });
      ttsChunks.push(spoken);
    }
  }
  return {
    displayTokens,
    ttsText: ttsChunks.join(" ").replace(/\s{2,}/g, " ").trim(),
    ttsPlainNoTags: displayTokens.map((x) => x.spoken).join(" ").replace(/\s{2,}/g, " ").trim(),
  };
}

function extractSpokenRuns(alignment) {
  const chars = alignment?.characters ?? [];
  const starts = alignment?.characterStartTimesSeconds ?? [];
  const ends = alignment?.characterEndTimesSeconds ?? [];
  const words = [];
  let inBracket = false;
  let cur = [];

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const s = starts[i];
    const e = ends[i];
    if (ch === "[") {
      if (cur.length) {
        words.push({ text: cur.map((x) => x.ch).join(""), start: cur[0].s, end: cur[cur.length - 1].e });
        cur = [];
      }
      inBracket = true;
      continue;
    }
    if (inBracket) {
      if (ch === "]") inBracket = false;
      continue;
    }
    if (/\s/.test(ch)) {
      if (cur.length) {
        words.push({ text: cur.map((x) => x.ch).join(""), start: cur[0].s, end: cur[cur.length - 1].e });
        cur = [];
      }
    } else {
      cur.push({ ch, s, e });
    }
  }
  if (cur.length) {
    words.push({ text: cur.map((x) => x.ch).join(""), start: cur[0].s, end: cur[cur.length - 1].e });
  }
  return words;
}

function normWord(s) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function alignDisplayToRuns(displayTokens, spokenRuns) {
  if (displayTokens.length === spokenRuns.length) {
    return displayTokens.map((dt, idx) => ({
      ...dt,
      start: spokenRuns[idx].start,
      end: spokenRuns[idx].end,
    }));
  }
  const out = [];
  let rIdx = 0;
  for (let dIdx = 0; dIdx < displayTokens.length; dIdx++) {
    const dt = displayTokens[dIdx];
    const target = normWord(dt.spoken || dt.w);
    if (rIdx >= spokenRuns.length) {
      const last = spokenRuns[spokenRuns.length - 1];
      out.push({ ...dt, start: last.start, end: last.end });
      continue;
    }
    const startRun = spokenRuns[rIdx];
    let acc = normWord(startRun.text);
    let endRun = startRun;
    rIdx++;
    while (rIdx < spokenRuns.length && acc.length < target.length && target.startsWith(acc + normWord(spokenRuns[rIdx].text))) {
      acc += normWord(spokenRuns[rIdx].text);
      endRun = spokenRuns[rIdx];
      rIdx++;
    }
    out.push({ ...dt, start: startRun.start, end: endRun.end });
  }
  return out;
}

function getDurationSec(filePath) {
  const out = execFileSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", filePath],
    { encoding: "utf8" }
  ).trim().replace(/,/g, "");
  return Number.parseFloat(out);
}

function renderCleanNarratorWav(mp3Path, wavPath) {
  // Subtle dramatic chest-baritone presence boost for George + crisp de-harshing
  const eq = "highpass=f=70,equalizer=f=135:t=q:w=1.1:g=1.8,equalizer=f=2800:t=q:w=1.3:g=1.2,equalizer=f=6400:t=q:w=1.4:g=-1.1";
  execFileSync(
    "ffmpeg",
    ["-y", "-loglevel", "error", "-i", mp3Path, "-ar", String(SR), "-ac", "1", "-af", eq, "-sample_fmt", "s16", wavPath],
    { stdio: "inherit" }
  );
}

function buildSubtitleCards(allWords) {
  const cards = [];
  const byLine = new Map();
  for (const w of allWords) {
    if (!byLine.has(w.line)) byLine.set(w.line, []);
    byLine.get(w.line).push(w);
  }

  for (const [, lineWords] of byLine.entries()) {
    const chunks = [];
    let cur = [];
    for (let i = 0; i < lineWords.length; i++) {
      const w = lineWords[i];
      cur.push(w);
      const textLen = cur.map((x) => x.w).join(" ").length;
      const endsPunct = /[,.\?!:…]$/.test(w.w);
      const remaining = lineWords.length - 1 - i;
      const shouldBreak =
        (endsPunct && cur.length >= 3 && remaining >= 2) ||
        (cur.length >= 8 && remaining >= 2) ||
        (textLen >= 42 && cur.length >= 4 && remaining >= 2);
      if (shouldBreak) {
        chunks.push(cur);
        cur = [];
      }
    }
    if (cur.length) chunks.push(cur);

    for (const chunk of chunks) {
      const fullStr = chunk.map((x) => x.w).join(" ");
      let lines;
      if (fullStr.length <= 28 || chunk.length <= 3) {
        lines = [fullStr];
      } else {
        let bestSplit = Math.ceil(chunk.length / 2);
        let bestDiff = Infinity;
        for (let s = 1; s < chunk.length; s++) {
          const l1 = chunk.slice(0, s).map((x) => x.w).join(" ").length;
          const l2 = chunk.slice(s).map((x) => x.w).join(" ").length;
          const diff = Math.abs(l1 - l2);
          if (diff < bestDiff) {
            bestDiff = diff;
            bestSplit = s;
          }
        }
        lines = [
          chunk.slice(0, bestSplit).map((x) => x.w).join(" "),
          chunk.slice(bestSplit).map((x) => x.w).join(" "),
        ];
      }

      const startFrame = Math.max(0, Math.round(chunk[0].start * FPS) - 1);
      const endFrame = Math.round(chunk[chunk.length - 1].end * FPS) + 8;
      cards.push({
        scene: chunk[0].scene,
        shotKey: chunk[0].shotKey,
        startFrame,
        endFrame,
        text: lines.join("\n"),
      });
    }
  }

  for (let i = 0; i < cards.length - 1; i++) {
    if (cards[i].endFrame >= cards[i + 1].startFrame) {
      cards[i].endFrame = Math.max(cards[i].startFrame + 2, cards[i + 1].startFrame - 2);
    }
  }
  return cards;
}

async function main() {
  const client = new ElevenLabsClient();
  const audioDir = join(PROJECT, "audio");
  const voCacheDir = join(audioDir, "vo_cache");
  const sfxDir = join(audioDir, "sfx");
  const outVoWav = join(audioDir, "vo_master.wav");
  const outAlignJson = join(audioDir, "alignment.json");
  const outStoryTs = join(ROOT, "remotion/videos/harga-peradaban/story.ts");
  const tmpBase = join(PROJECT, ".tmp");

  mkdirSync(voCacheDir, { recursive: true });
  mkdirSync(sfxDir, { recursive: true });
  mkdirSync(dirname(outStoryTs), { recursive: true });
  mkdirSync(tmpBase, { recursive: true });

  const prepared = BEATS.map((b, idx) => ({ ...b, idx, ...prepareBeat(b, idx) }));
  const tmpDir = mkdtempSync(join(tmpBase, "vo-build-"));

  try {
    console.log(`=== [1/2] Synthesizing Dramatic ElevenLabs v4 VO (${NARRATOR.label}, Tempo ${TEMPO}x, ${BEATS.length} Shots) ===`);
    const concatParts = [];
    const leadSil = join(tmpDir, "sil_lead.wav");
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "lavfi", "-i", `anullsrc=r=${SR}:cl=mono`, "-t", String(OPEN_LEAD_SILENCE_S), "-sample_fmt", "s16", leadSil]);
    concatParts.push(leadSil);

    let cursorSec = OPEN_LEAD_SILENCE_S;
    const allWords = [];
    const shotWindows = {};

    for (let i = 0; i < prepared.length; i++) {
      const beat = prepared[i];
      const prev = i > 0 ? prepared[i - 1] : null;
      const next = i + 1 < prepared.length ? prepared[i + 1] : null;

      const cachePayload = {
        id: NARRATOR.id,
        model: TTS_MODEL,
        stab: NARRATOR.stability,
        sim: NARRATOR.similarityBoost,
        text: beat.ttsText,
        prev: prev?.ttsPlainNoTags ?? "",
        next: next?.ttsPlainNoTags ?? "",
      };
      const cacheKey = createHash("sha1").update(JSON.stringify(cachePayload)).digest("hex").slice(0, 12);
      const mp3Path = join(voCacheDir, `${beat.key}_${cacheKey}.mp3`);
      const alignPath = join(voCacheDir, `${beat.key}_${cacheKey}.json`);

      let alignment;
      if (existsSync(mp3Path) && existsSync(alignPath)) {
        console.log(`  [${String(i + 1).padStart(2)}/${prepared.length}] CACHED ${beat.key}: ${beat.ttsPlainNoTags.slice(0, 72)}...`);
        alignment = JSON.parse(readFileSync(alignPath, "utf8"));
      } else {
        console.log(`  [${String(i + 1).padStart(2)}/${prepared.length}] SYNTH  ${beat.key}: ${beat.ttsPlainNoTags.slice(0, 72)}...`);
        const res = await withRetry(beat.key, () =>
          client.textToSpeech.convertWithTimestamps(NARRATOR.id, {
            text: beat.ttsText,
            modelId: TTS_MODEL,
            languageCode: "id",
            outputFormat: "mp3_44100_128",
            applyTextNormalization: "on",
            voiceSettings: {
              stability: NARRATOR.stability,
              similarityBoost: NARRATOR.similarityBoost,
            },
            ...(prev ? { previousText: prev.ttsPlainNoTags } : {}),
            ...(next ? { nextText: next.ttsPlainNoTags } : {}),
          })
        );
        writeFileSync(mp3Path, Buffer.from(res.audioBase64, "base64"));
        alignment = res.alignment;
        writeFileSync(alignPath, JSON.stringify(alignment, null, 2));
      }

      const rawWav = join(tmpDir, `beat_${i}.wav`);
      renderCleanNarratorWav(mp3Path, rawWav);

      const spokenRuns = extractSpokenRuns(alignment);
      const aligned = alignDisplayToRuns(beat.displayTokens, spokenRuns);
      const clipDur = getDurationSec(rawWav);
      const trimLead = aligned.length ? Math.max(0, Number((aligned[0].start - 0.025).toFixed(3))) : 0;
      const lastEnd = aligned.length ? aligned[aligned.length - 1].end : clipDur;
      const srcSpan = Math.max(0.12, Math.min(clipDur - trimLead, Number((lastEnd - trimLead + 0.12).toFixed(3))));
      const trimWav = join(tmpDir, `beat_${i}_trim.wav`);
      const afChain = TEMPO === 1.0 ? "afade=t=in:st=0:d=0.008" : `atempo=${TEMPO},afade=t=in:st=0:d=0.008`;
      execFileSync("ffmpeg", [
        "-y", "-loglevel", "error", "-ss", String(trimLead), "-i", rawWav, "-t", String(srcSpan),
        "-af", afChain, "-sample_fmt", "s16", trimWav,
      ]);
      const actualDur = getDurationSec(trimWav);
      const fadeWav = join(tmpDir, `beat_${i}_fade.wav`);
      execFileSync("ffmpeg", [
        "-y", "-loglevel", "error", "-i", trimWav,
        "-af", `afade=t=out:st=${Math.max(0, actualDur - 0.015).toFixed(3)}:d=0.015`,
        "-sample_fmt", "s16", fadeWav,
      ]);

      const beatStartSec = i === 0 ? 0 : cursorSec - 0.22;
      for (const tok of aligned) {
        const sRel = Math.max(0, (tok.start - trimLead) / TEMPO);
        const eRel = Math.max(sRel + 0.02, (tok.end - trimLead) / TEMPO);
        allWords.push({
          w: tok.w,
          cue: tok.cue,
          scene: beat.scene,
          shotKey: beat.key,
          line: tok.line,
          start: Number((cursorSec + sRel).toFixed(3)),
          end: Number((cursorSec + eRel).toFixed(3)),
        });
      }

      concatParts.push(fadeWav);
      cursorSec += actualDur;

      const silWav = join(tmpDir, `sil_${i}.wav`);
      execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "lavfi", "-i", `anullsrc=r=${SR}:cl=mono`, "-t", String(beat.pauseAfterS), "-sample_fmt", "s16", silWav]);
      concatParts.push(silWav);
      cursorSec += beat.pauseAfterS;

      shotWindows[beat.key] = {
        startSec: Number(Math.max(0, beatStartSec).toFixed(3)),
        endSec: Number(cursorSec.toFixed(3)),
      };
    }

    const concatList = join(tmpDir, "concat.txt");
    writeFileSync(concatList, concatParts.map((p) => `file '${p.replace(/\\/g, "/")}'`).join("\n"), "utf8");
    execFileSync("ffmpeg", [
      "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", concatList,
      "-af", "loudnorm=I=-16:TP=-2.0:LRA=6.5:linear=true",
      "-ar", String(SR), "-ac", "1", "-sample_fmt", "s16", outVoWav,
    ]);

    const voDur = getDurationSec(outVoWav);
    const totalVideoSec = Number((voDur + END_TAIL_PAD_S).toFixed(3));
    const totalFrames = Math.ceil(totalVideoSec * FPS);
    shotWindows[BEATS[BEATS.length - 1].key].endSec = totalVideoSec;

    const cueMapSec = {};
    const cueMapFrame = {};
    for (const w of allWords) {
      if (w.cue) {
        cueMapSec[w.cue] = w.start;
        cueMapFrame[w.cue] = Math.round(w.start * FPS);
      }
    }

    // Build contiguous 25-shot frame boundaries (zero gaps)
    const shotsFrame = {};
    for (let i = 0; i < BEATS.length; i++) {
      const k = BEATS[i].key;
      const nextK = i + 1 < BEATS.length ? BEATS[i + 1].key : null;
      const startF = i === 0 ? 0 : Math.round(shotWindows[k].startSec * FPS);
      const endF = nextK ? Math.round(shotWindows[nextK].startSec * FPS) : totalFrames;
      shotsFrame[k] = { start: startF, end: endF };
    }

    console.log(`\n=== 25-SHOT TIMING BREAKDOWN (Total ${totalVideoSec.toFixed(2)}s / ${totalFrames}f) ===`);
    for (const b of BEATS) {
      const { start, end } = shotsFrame[b.key];
      console.log(`  ${b.key.toUpperCase()}: f=${String(start).padStart(4)}..${String(end - 1).padStart(4)} (${(start / FPS).toFixed(2)}s -> ${(end / FPS).toFixed(2)}s | dur=${((end - start) / FPS).toFixed(2)}s)`);
    }

    const subtitleCards = buildSubtitleCards(allWords);
    const alignObj = {
      voice: `${NARRATOR.label} · ElevenLabs ${TTS_MODEL}`,
      model: TTS_MODEL,
      tempo: TEMPO,
      voDurationSec: Number(voDur.toFixed(3)),
      totalVideoSec,
      fps: FPS,
      totalFrames,
      cuesSec: cueMapSec,
      cuesFrame: cueMapFrame,
      shotsFrame,
      words: allWords,
    };
    writeFileSync(outAlignJson, JSON.stringify(alignObj, null, 2) + "\n", "utf8");

    const storyTs = `// AUTO-GENERATED by harga-peradaban/scripts/build_vo_and_sfx.mjs from ElevenLabs eleven_v4 timestamps.
export interface SubtitleCardSpec {
  scene: number;
  shotKey: string;
  startFrame: number;
  endFrame: number;
  text: string;
}

export const PERADABAN_FPS = ${FPS};
export const PERADABAN_FRAMES = ${totalFrames};
export const PERADABAN_DURATION_SEC = ${totalVideoSec};

export const SHOTS = ${JSON.stringify(shotsFrame, null, 2)} as const;

export const CUES = ${JSON.stringify(cueMapFrame, null, 2)} as const;

export const CUES_SEC = ${JSON.stringify(cueMapSec, null, 2)} as const;

export const SUBTITLE_CARDS: SubtitleCardSpec[] = ${JSON.stringify(subtitleCards, null, 2)};
`;
    writeFileSync(outStoryTs, storyTs, "utf8");

    console.log("\n=== [2/2] Generating 11 Bespoke Cinema Foley SFX via ElevenLabs eleven_text_to_sound_v3 ===");
    for (let i = 0; i < BESPOKE_SFX.length; i++) {
      const sfx = BESPOKE_SFX[i];
      const outPath = join(sfxDir, sfx.name);
      if (existsSync(outPath)) {
        console.log(`  [${String(i + 1).padStart(2)}/${BESPOKE_SFX.length}] CACHED ${sfx.name}`);
        continue;
      }
      console.log(`  [${String(i + 1).padStart(2)}/${BESPOKE_SFX.length}] SYNTH  ${sfx.name} (${sfx.durationSeconds}s)...`);
      await withRetry(sfx.name, async () => {
        if (existsSync(outPath)) rmSync(outPath, { force: true });
        const stream = await client.textToSoundEffects.convert({
          text: sfx.prompt,
          modelId: SFX_MODEL,
          durationSeconds: sfx.durationSeconds,
          promptInfluence: sfx.promptInfluence,
          loop: false,
        });
        const ws = createWriteStream(outPath);
        await finished(Readable.fromWeb(stream).pipe(ws));
      });
      console.log(`           -> saved (${getDurationSec(outPath).toFixed(2)}s)`);
    }

    console.log("\nALL DRAMATIC VO & CINEMA FOLEY GENERATION COMPLETE!");
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
