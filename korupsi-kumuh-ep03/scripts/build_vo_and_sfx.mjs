/**
 * Audio-First VO & Bespoke SFX Generator for:
 * VIDEO 3 — "JEJAK UANG YANG HILANG: DAMPAK KORUPSI TERHADAP KAWASAN KUMUH & UPAYA MENGATASINYA"
 * Kelompok 3: Ica, Mirza, Thalita, Zayyanah, Aul, Furqan, Raihan
 *
 * - Style: `galeri-motion-characterflow` (3D Soft-Vinyl / Toy-Clay Character-Flow PBR)
 * - Narrator: Sarah (`EXAVITQu4vr4xnSDxMaL`) — Warm, Clear, Empathetic Female Storyteller
 *   via ElevenLabs `eleven_v4` (`languageCode: "id"`, `TEMPO = 1.05`, NO `[clear]` tags!)
 * - 4.00s Opening Intro for Kelompok 3 (7 members) before Scene 01 begins
 * - Target Total Duration: ~04:00 (240 seconds / ~7200 frames @ 30 fps)
 * - Exports exact word-level timestamps, 26+ storyboard [[cue]] anchors, 9 scene bounds,
 *   and subtitle chunks to `remotion/videos/korupsi-kumuh-ep03/story.ts`
 * - Generates 10 bespoke tactile foley SFX via ElevenLabs `eleven_text_to_sound_v3`
 *
 * Run:
 *   node --env-file=.env korupsi-kumuh-ep03/scripts/build_vo_and_sfx.mjs
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
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
const TEMPO = 1.36; // Calibrates Sarah's slow 112 WPM raw delivery cleanly to natural ~152 WPM -> exact 04:00 (240s)!

const NARRATOR = {
  id: "EXAVITQu4vr4xnSDxMaL", // Sarah — Warm, Empathetic, Clear Female Storyteller (100% distinct from Brian & Liam)
  label: "Sarah (Warm Empathetic Storyteller)",
  stability: 0.50,
  similarityBoost: 0.78,
};

// 4.00s Opening Group Intro ("Kelompok 3: Ica, Mirza, Thalita, Zayyanah, Aul, Furqan, Raihan")
const INTRO_DURATION_S = 4.0;

// Target scene durations calibrated cleanly to ~04:00 (240s) total!
const SCENE_TARGETS = {
  1: { name: "Hook: Jam 5 Pagi di Ujung Gang", targetSec: 23.0, leadSec: 0.38 },
  2: { name: "Dampak 1: Pembangunan Terhambat", targetSec: 26.5, leadSec: 0.30 },
  3: { name: "Dampak 2 & 3: Sanitasi Buruk & Air Bersih", targetSec: 30.0, leadSec: 0.30 },
  4: { name: "Dampak 4: Kesenjangan Sosial & Amartya Sen", targetSec: 30.0, leadSec: 0.30 },
  5: { name: "Dampak 5: Risiko Banjir", targetSec: 22.0, leadSec: 0.34 },
  6: { name: "Dampak 6: Kesehatan Terganggu", targetSec: 24.5, leadSec: 0.30 },
  7: { name: "Jeda Napas & Pesan Bung Hatta", targetSec: 21.5, leadSec: 0.42 },
  8: { name: "4 Upaya Mengatasi (POV Buku Warga)", targetSec: 37.5, leadSec: 0.32 },
  9: { name: "Full-Circle Mirror Ending", targetSec: 21.0, leadSec: 0.32 },
};

// 100% VERBATIM APPROVED NASKAH — VIDEO 3 (~555 kata, ZERO `[clear]` tags!)
const BEATS = [
  // =========================================================================
  // SCENE 01 — HOOK: JAM 5 PAGI DI UJUNG GANG (00:04–00:26)
  // =========================================================================
  {
    scene: 1,
    minPause: 0.45,
    maxPause: 1.15,
    pauseWeight: 1.0,
    text: "[gentle] [[s1_faucet]]Pukul lima pagi. Lampu kamar menyala temaram. Di ujung gang sempit, keran air diputar — tapi yang keluar hanya tetesan keruh yang cepat berhenti.",
  },
  {
    scene: 1,
    minPause: 0.45,
    maxPause: 1.15,
    pauseWeight: 1.0,
    text: "[reflective] [[s1_board]]Padahal, tepat di depan jalan masuk, pernah berdiri papan proyek bertuliskan anggaran miliaran rupiah untuk perbaikan lingkungan.",
  },
  {
    scene: 1,
    minPause: 0.65,
    maxPause: 1.45,
    pauseWeight: 1.35,
    text: "[soft] [[s1_ecu_eyes]]Anehnya, bertahun-tahun berlalu, papan itu sudah pudar… sementara rumah-rumah di belakangnya tetap sama. Pertanyaannya sederhana: ke mana sebenarnya uang itu pergi?",
  },

  // =========================================================================
  // SCENE 02 — DAMPAK 1: PEMBANGUNAN TERHAMBAT (00:26–00:52)
  // =========================================================================
  {
    scene: 2,
    minPause: 0.45,
    maxPause: 1.1,
    pauseWeight: 0.95,
    text: "[reflective] [[s2_meeting]]Kita sering mengira korupsi hanya terjadi jauh di ruang rapat berpendingin udara — berupa angka besar di layar berita.",
  },
  {
    scene: 2,
    minPause: 0.45,
    maxPause: 1.1,
    pauseWeight: 1.0,
    text: "[steady] [[s2_dampak1]]Padahal, dampaknya langsung terasa di depan pintu warga. Dampak pertama: pembangunan terhambat.",
  },
  {
    scene: 2,
    minPause: 0.65,
    maxPause: 1.5,
    pauseWeight: 1.35,
    text: "[serious] [[s2_facilities]]Ketika dana pembangunan disalahgunakan, dipotong, atau dialihkan ke kantong pribadi, uang yang seharusnya membeli beton, pipa, dan bahan perbaikan fasilitas umum tidak pernah sampai secara utuh. Akhirnya jalan tetap berlubang, fasilitas publik dibiarkan rusak, dan kawasan kumuh makin tertinggal.",
  },

  // =========================================================================
  // SCENE 03 — DAMPAK 2 & 3: SANITASI BURUK & KURANGNYA AIR BERSIH (00:52–01:24)
  // =========================================================================
  {
    scene: 3,
    minPause: 0.4,
    maxPause: 1.0,
    pauseWeight: 0.85,
    text: "[steady] [[s3_sanitasi]]Dari pembangunan yang macet itu, satu masalah langsung melahirkan masalah berikutnya.",
  },
  {
    scene: 3,
    minPause: 0.55,
    maxPause: 1.3,
    pauseWeight: 1.2,
    text: "[serious] Dampak kedua: sanitasi buruk. Tanpa anggaran yang berjalan bersih, sistem pengelolaan sampah dan saluran pembuangan air terbengkalai. Sampah menumpuk di sudut gang, dan selokan berubah menjadi genangan gelap yang berbau menyengat.",
  },
  {
    scene: 3,
    minPause: 0.65,
    maxPause: 1.45,
    pauseWeight: 1.35,
    text: "[reflective] [[s3_air_bersih]]Lalu muncul dampak ketiga: kurangnya air bersih. Dana penyediaan air bersih dan jaringan perpipaan tidak digunakan dengan semestinya. Akibatnya, warga di kawasan kumuh justru harus membayar lebih mahal hanya untuk membeli beberapa jerigen air layak minum setiap hari.",
  },

  // =========================================================================
  // SCENE 04 — DAMPAK 4: KESENJANGAN SOSIAL & AMARTYA SEN (01:24–01:54)
  // =========================================================================
  {
    scene: 4,
    minPause: 0.45,
    maxPause: 1.15,
    pauseWeight: 0.95,
    text: "[gentle] [[s4_skyline]]Sementara beberapa kilometer di seberang sungai, gedung-gedung tinggi menyala terang dengan akses air dan jalan yang serba mulus.",
  },
  {
    scene: 4,
    minPause: 0.5,
    maxPause: 1.25,
    pauseWeight: 1.1,
    text: "[serious] [[s4_gap]]Di sinilah dampak keempat terlihat paling nyata: kesenjangan sosial. Bantuan sosial dan program perbaikan permukiman yang seharusnya menjembatani ketimpangan justru tidak tersalurkan secara merata.",
  },
  {
    scene: 4,
    minPause: 0.65,
    maxPause: 1.5,
    pauseWeight: 1.35,
    text: "[warm] [[s4_amartya]]Ekonom peraih Nobel, Amartya Sen, pernah mengingatkan bahwa kemiskinan bukan sekadar soal rendahnya penghasilan, melainkan ketika warga terampas hak dasarnya atas air bersih, sanitasi, dan lingkungan yang layak. Korupsi memperlebar jurang itu setiap hari.",
  },

  // =========================================================================
  // SCENE 05 — DAMPAK 5: RISIKO BANJIR (01:54–02:18)
  // =========================================================================
  {
    scene: 5,
    minPause: 0.45,
    maxPause: 1.15,
    pauseWeight: 0.95,
    text: "[serious] [[s5_rain]]Dan ketika malam turun bersama hujan deras, semuanya meledak sekaligus.",
  },
  {
    scene: 5,
    minPause: 0.5,
    maxPause: 1.25,
    pauseWeight: 1.1,
    text: "[urgent] [[s5_drainase]]Inilah dampak kelima: risiko banjir yang terus berulang. Karena dana pembangunan dan perbaikan drainase dikorupsi, saluran air terlalu sempit, dangkal, dan buntu.",
  },
  {
    scene: 5,
    minPause: 0.65,
    maxPause: 1.5,
    pauseWeight: 1.35,
    text: "[reflective] [[s5_flood]]Hujan satu jam saja cukup membuat air selokan meluap masuk ke ruang tamu, merendam kasur, buku sekolah, hingga satu-satunya harapan warga untuk beristirahat dengan tenang.",
  },

  // =========================================================================
  // SCENE 06 — DAMPAK 6: KESEHATAN TERGANGGU (02:18–02:44)
  // =========================================================================
  {
    scene: 6,
    minPause: 0.5,
    maxPause: 1.25,
    pauseWeight: 1.05,
    text: "[serious] [[s6_health]]Air genangan yang bercampur sampah akhirnya membawa dampak keenam yang paling mahal harganya: kesehatan terganggu.",
  },
  {
    scene: 6,
    minPause: 0.55,
    maxPause: 1.35,
    pauseWeight: 1.2,
    text: "[empathetic] Lingkungan yang lembap, kotor, dan minim air bersih menjadi sarang penyakit — mulai dari diare, infeksi kulit, hingga demam berdarah dan gangguan pernapasan.",
  },
  {
    scene: 6,
    minPause: 0.75,
    maxPause: 1.65,
    pauseWeight: 1.45,
    text: "[reflective] [[s6_domino]]Jadi lihat polanya: satu korupsi anggaran tidak hanya mencuri uang negara. Ia mencuri kesehatan, waktu belajar anak-anak, dan masa depan satu generasi di kawasan kumuh.",
  },

  // =========================================================================
  // SCENE 07 — JEDA NAPAS & PESAN BUNG HATTA (02:44–03:04)
  // =========================================================================
  {
    scene: 7,
    minPause: 0.55,
    maxPause: 1.3,
    pauseWeight: 1.05,
    text: "[gentle] [[s7_breathe]]Rasanya memang menyesakkan. Tapi kawasan kumuh bukanlah takdir yang tidak bisa diubah.",
  },
  {
    scene: 7,
    minPause: 0.6,
    maxPause: 1.4,
    pauseWeight: 1.25,
    text: "[warm] [[s7_hatta]]Mohammad Hatta — salah satu bapak bangsa yang dikenal paling teguh menjaga uang rakyat — pernah berpesan bahwa kurang cerdas bisa diperbaiki dengan belajar, namun tidak jujur jauh lebih sulit diperbaiki.",
  },
  {
    scene: 7,
    minPause: 0.65,
    maxPause: 1.45,
    pauseWeight: 1.3,
    text: "[steady] Artinya, memutus lingkaran kawasan kumuh harus dimulai dari memutus korupsinya.",
  },

  // =========================================================================
  // SCENE 08 — 4 UPAYA MENGATASI + MACRO POV MENULIS (03:04–03:42)
  // =========================================================================
  {
    scene: 8,
    minPause: 0.45,
    maxPause: 1.05,
    pauseWeight: 0.9,
    text: "[reassuring] [[s8_lamp_on]]Ada empat langkah nyata yang harus berjalan bersamaan.",
  },
  {
    scene: 8,
    minPause: 0.5,
    maxPause: 1.2,
    pauseWeight: 1.1,
    text: "[steady] [[s8_upaya1]]Pertama, mengawasi anggaran pembangunan secara terbuka — dari perencanaan sampai realisasi di lapangan — agar setiap rupiah bisa dilacak publik.",
  },
  {
    scene: 8,
    minPause: 0.5,
    maxPause: 1.2,
    pauseWeight: 1.1,
    text: "[confident] [[s8_upaya2]]Kedua, memberikan hukuman yang tegas kepada pelaku korupsi, tanpa tebang pilih, agar menimbulkan efek jera dan mengembalikan aset negara.",
  },
  {
    scene: 8,
    minPause: 0.5,
    maxPause: 1.2,
    pauseWeight: 1.15,
    text: "[warm] [[s8_upaya3]]Ketiga, melibatkan masyarakat secara langsung dalam pengawasan. Karena warga setempatlah yang paling tahu apakah saluran air, jalan, dan fasilitas benar-benar dibangun atau hanya ada di atas laporan.",
  },
  {
    scene: 8,
    minPause: 0.6,
    maxPause: 1.4,
    pauseWeight: 1.25,
    text: "[reassuring] [[s8_upaya4]]Dan keempat, memastikan bantuan tepat sasaran melalui data yang transparan, sehingga keluarga di kawasan kumuh benar-benar menerima haknya.",
  },

  // =========================================================================
  // SCENE 09 — FULL-CIRCLE MIRROR ENDING (03:42–04:00)
  // =========================================================================
  {
    scene: 9,
    minPause: 0.55,
    maxPause: 1.3,
    pauseWeight: 1.05,
    text: "[warm] [[s9_dawn]]Ketika anggaran dijaga dengan jujur, air bersih mulai mengalir, drainase berfungsi, dan anak-anak bisa tumbuh di lingkungan yang sehat.",
  },
  {
    scene: 9,
    minPause: 0.55,
    maxPause: 1.3,
    pauseWeight: 1.1,
    text: "[gentle] [[s9_lamp_off]]Korupsi mungkin tampak seperti angka di atas kertas — tetapi kejujuran selalu terasa nyata di rumah setiap warga.",
  },
  {
    scene: 9,
    minPause: 3.4,
    maxPause: 4.5,
    pauseWeight: 3.0,
    text: "[resonant] [[s9_closing]]Mari jaga uang rakyat, agar tidak ada lagi masa depan yang tenggelam di kawasan kumuh.",
  },
];

// 10 Bespoke Tactile & Atmospheric SFX via ElevenLabs `eleven_text_to_sound_v3`
const BESPOKE_SFX = [
  {
    name: "sfx_dawn_rain_lamp_click.mp3",
    durationSeconds: 3.2,
    promptInfluence: 0.62,
    prompt:
      "Soft early morning light drizzle rain pattering gently outside a quiet bedroom window followed by a crisp plastic bedside lamp switch clicking on, warm realistic indoor foley, no music",
  },
  {
    name: "sfx_faucet_muddy_drips.mp3",
    durationSeconds: 3.5,
    promptInfluence: 0.64,
    prompt:
      "Old metal indoor faucet valve creaking open releasing three slow hollow water drips splashing into an empty plastic bucket in a quiet small room, realistic foley, no music",
  },
  {
    name: "sfx_bubble_pops_gentle.mp3",
    durationSeconds: 3.5,
    promptInfluence: 0.58,
    prompt:
      "Soft airy delicate glass thought bubbles popping gently in ascending rhythm inside a quiet cozy room, subtle dreamy minimalist sound design, no music",
  },
  {
    name: "sfx_paper_coins_fade.mp3",
    durationSeconds: 3.6,
    promptInfluence: 0.62,
    prompt:
      "Crisp official office budget papers shuffling cleanly on a wooden desk followed by coins clinking briefly and fading softly away into quiet room tone, realistic documentary foley, no music",
  },
  {
    name: "sfx_clogged_drain_jerrycan.mp3",
    durationSeconds: 3.8,
    promptInfluence: 0.62,
    prompt:
      "Murky water gurgling slowly inside a clogged street gutter drain followed by two hollow plastic water jerrycans bumping gently on concrete, realistic documentary foley, no music",
  },
  {
    name: "sfx_heavy_rain_flood.mp3",
    durationSeconds: 4.5,
    promptInfluence: 0.65,
    prompt:
      "Heavy tropical night rainstorm pouring onto a corrugated tin roof with distant low thunder rumble and rising flood water sloshing softly across a tiled indoor room floor, realistic foley, no music",
  },
  {
    name: "sfx_muted_alarm_tension.mp3",
    durationSeconds: 4.0,
    promptInfluence: 0.58,
    prompt:
      "Deep muffled low heartbeat pulse paired with a distant soft anxious warning tone gently swelling inside an enclosed night room, subtle cinematic emotional sound design, no music",
  },
  {
    name: "sfx_calm_exhale_lamp_on.mp3",
    durationSeconds: 3.8,
    promptInfluence: 0.62,
    prompt:
      "Peaceful slow calm human deep breath inhale and relieving exhale followed by a crisp bedside table lamp switch clicking on and one soft warm crystalline shimmer, intimate foley, no music",
  },
  {
    name: "sfx_pen_writing_notebook.mp3",
    durationSeconds: 4.2,
    promptInfluence: 0.66,
    prompt:
      "Close up crisp blue ballpoint pen writing smoothly across lined spiral notebook paper with gentle page rustle and a confident decisive check mark stroke, realistic macro tactile foley, no music",
  },
  {
    name: "sfx_gavel_and_morning_water.mp3",
    durationSeconds: 4.5,
    promptInfluence: 0.62,
    prompt:
      "One clean authoritative wooden judge gavel strike transitioning gently into fresh clear clean running tap water and peaceful sunny morning birdsong outside an open window, crisp foley, no music",
  },
];

function prepareBeat(rawText, lineIdx) {
  const displayTokens = [];
  const ttsChunks = [];

  const parts = rawText.split(/(?<!\[)(\[[^\[\]]+\])(?!\])/g);
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
      const body = m[2];
      if (!body) continue;
      const pipeIdx = body.indexOf("|");
      const disp = pipeIdx >= 0 ? body.slice(0, pipeIdx) : body;
      const spoken = pipeIdx >= 0 ? body.slice(pipeIdx + 1) : body;
      displayTokens.push({ w: disp, spoken, cue, line: lineIdx });
      ttsChunks.push(spoken);
    }
  }
  return {
    displayTokens,
    ttsText: ttsChunks.join(" ").replace(/\s{2,}/g, " ").trim(),
    ttsPlainNoTags: displayTokens
      .map((x) => x.spoken)
      .join(" ")
      .replace(/\s{2,}/g, " ")
      .trim(),
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
        words.push({
          text: cur.map((x) => x.ch).join(""),
          start: cur[0].s,
          end: cur[cur.length - 1].e,
        });
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
        words.push({
          text: cur.map((x) => x.ch).join(""),
          start: cur[0].s,
          end: cur[cur.length - 1].e,
        });
        cur = [];
      }
    } else {
      cur.push({ ch, s, e });
    }
  }
  if (cur.length) {
    words.push({
      text: cur.map((x) => x.ch).join(""),
      start: cur[0].s,
      end: cur[cur.length - 1].e,
    });
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
    const target = normWord(dt.spoken);
    if (rIdx >= spokenRuns.length) {
      const last = spokenRuns[spokenRuns.length - 1];
      out.push({ ...dt, start: last.start, end: last.end });
      continue;
    }
    if (!target) {
      const prevEnd = out.length ? out[out.length - 1].end : spokenRuns[rIdx].start;
      out.push({ ...dt, start: prevEnd, end: prevEnd + 0.04 });
      if (rIdx < spokenRuns.length && !normWord(spokenRuns[rIdx].text)) rIdx++;
      continue;
    }
    while (rIdx < spokenRuns.length && !normWord(spokenRuns[rIdx].text)) {
      rIdx++;
    }
    if (rIdx >= spokenRuns.length) {
      const last = spokenRuns[spokenRuns.length - 1];
      out.push({ ...dt, start: last.start, end: last.end });
      continue;
    }
    const startRun = spokenRuns[rIdx];
    let endRun = startRun;
    let acc = normWord(startRun.text);
    rIdx++;
    while (
      rIdx < spokenRuns.length &&
      acc.length < target.length &&
      target.startsWith(acc + normWord(spokenRuns[rIdx].text))
    ) {
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
  )
    .trim()
    .replace(/,/g, "");
  return Number.parseFloat(out);
}

function makeSilenceWav(durSec, outPath) {
  execFileSync("ffmpeg", [
    "-y",
    "-loglevel",
    "error",
    "-f",
    "lavfi",
    "-i",
    `anullsrc=r=${SR}:cl=mono`,
    "-t",
    Math.max(0.02, durSec).toFixed(3),
    "-sample_fmt",
    "s16",
    outPath,
  ]);
}

function renderCleanNarratorWav(mp3Path, wavPath) {
  // Warm intimate female narrator EQ: HPF 85 Hz, gentle warmth +1.4dB @ 210 Hz, silky clarity +1.8dB @ 3.2 kHz, de-ess -2.0dB @ 7.2 kHz
  const eq =
    "highpass=f=85,equalizer=f=210:t=q:w=1.1:g=1.4,equalizer=f=3200:t=q:w=1.3:g=1.8,equalizer=f=7200:t=q:w=1.4:g=-2.0";
  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-loglevel",
      "error",
      "-i",
      mp3Path,
      "-ar",
      String(SR),
      "-ac",
      "1",
      "-af",
      eq,
      "-sample_fmt",
      "s16",
      wavPath,
    ],
    { stdio: "inherit" }
  );
}

function buildSubtitleChunks(allWords) {
  const chunks = [];
  const byLine = new Map();
  for (const w of allWords) {
    if (!byLine.has(w.line)) byLine.set(w.line, []);
    byLine.get(w.line).push(w);
  }

  for (const [, lineWords] of byLine.entries()) {
    let cur = [];
    for (let i = 0; i < lineWords.length; i++) {
      const w = lineWords[i];
      if (w.w === "—") continue;
      cur.push(w);
      const textLen = cur.map((x) => x.w).join(" ").length;
      const endsPunct = /[,.\?!:…]$/.test(w.w);
      const remaining = lineWords.length - 1 - i;
      const shouldBreak =
        (endsPunct && cur.length >= 2 && remaining >= 1) ||
        (cur.length >= 5 && remaining >= 2) ||
        (textLen >= 28 && cur.length >= 3 && remaining >= 1);
      if (shouldBreak) {
        chunks.push(cur);
        cur = [];
      }
    }
    if (cur.length) chunks.push(cur);
  }

  const out = chunks.map((chunk, idx) => {
    const startFrame = Math.max(0, Math.round(chunk[0].start * FPS) - 1);
    const endFrame = Math.round(chunk[chunk.length - 1].end * FPS) + 6;
    return {
      id: `sub_${String(idx + 1).padStart(3, "0")}`,
      scene: chunk[0].scene,
      startFrame,
      endFrame,
      words: chunk.map((w) => ({
        text: w.w,
        startFrame: Math.max(startFrame, Math.round(w.start * FPS)),
        endFrame: Math.round(w.end * FPS),
      })),
    };
  });

  for (let i = 0; i < out.length - 1; i++) {
    if (out[i].endFrame >= out[i + 1].startFrame) {
      out[i].endFrame = Math.max(out[i].startFrame + 2, out[i + 1].startFrame - 1);
    }
  }
  return out;
}

async function withRetry(label, fn, maxAttempts = 8) {
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fn();
      await new Promise((r) => setTimeout(r, 400));
      return res;
    } catch (err) {
      lastErr = err;
      const waitMs = Math.min(18000, 2000 * attempt);
      console.warn(`    [RETRY ${attempt}/${maxAttempts}] ${label} failed (${err?.cause?.code || err?.message}), waiting ${waitMs}ms...`);
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
  throw lastErr;
}

async function main() {
  const client = new ElevenLabsClient();
  const audioDir = join(PROJECT, "audio");
  const voCacheDir = join(audioDir, "vo_cache");
  const sfxDir = join(audioDir, "sfx");
  const outVoWav = join(audioDir, "vo_master.wav");
  const outAlignJson = join(audioDir, "alignment.json");
  const outStoryTs = join(ROOT, "remotion/videos/korupsi-kumuh-ep03/story.ts");
  const tmpBase = join(PROJECT, ".tmp");

  mkdirSync(voCacheDir, { recursive: true });
  mkdirSync(sfxDir, { recursive: true });
  mkdirSync(dirname(outStoryTs), { recursive: true });
  mkdirSync(tmpBase, { recursive: true });

  const prepared = BEATS.map((b, idx) => ({ ...b, idx, ...prepareBeat(b.text, idx) }));
  const tmpDir = mkdtempSync(join(tmpBase, "vo-build-"));

  try {
    console.log(
      `=== [1/2] Synthesizing ElevenLabs ${TTS_MODEL} VO (${NARRATOR.label}, tempo=${TEMPO}x) ===`
    );

    const renderedBeats = [];
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
      const cacheKey = createHash("sha1")
        .update(JSON.stringify(cachePayload))
        .digest("hex")
        .slice(0, 12);
      const mp3Path = join(voCacheDir, `beat_${String(i).padStart(2, "0")}_${cacheKey}.mp3`);
      const alignPath = join(voCacheDir, `beat_${String(i).padStart(2, "0")}_${cacheKey}.json`);

      let alignment;
      if (existsSync(mp3Path) && existsSync(alignPath)) {
        console.log(`  [${i + 1}/${prepared.length}] CACHED Sc${beat.scene}: ${beat.ttsPlainNoTags}`);
        alignment = JSON.parse(readFileSync(alignPath, "utf8"));
      } else {
        console.log(`  [${i + 1}/${prepared.length}] SYNTH  Sc${beat.scene}: ${beat.ttsText}`);
        const res = await withRetry(`TTS beat ${i + 1}`, () =>
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
      const trimLead = aligned.length ? Math.max(0, Number((aligned[0].start - 0.08).toFixed(3))) : 0;
      const lastEnd = aligned.length ? aligned[aligned.length - 1].end : clipDur;
      const srcSpan = Math.max(
        0.15,
        Math.min(clipDur - trimLead, Number((lastEnd - trimLead + 0.14).toFixed(3)))
      );
      const trimWav = join(tmpDir, `beat_${i}_trim.wav`);
      const afChain =
        TEMPO === 1.0 ? "afade=t=in:st=0:d=0.010" : `atempo=${TEMPO},afade=t=in:st=0:d=0.010`;
      execFileSync("ffmpeg", [
        "-y",
        "-loglevel",
        "error",
        "-ss",
        String(trimLead),
        "-i",
        rawWav,
        "-t",
        String(srcSpan),
        "-af",
        afChain,
        "-sample_fmt",
        "s16",
        trimWav,
      ]);
      const actualDur = getDurationSec(trimWav);
      const fadeWav = join(tmpDir, `beat_${i}_fade.wav`);
      execFileSync("ffmpeg", [
        "-y",
        "-loglevel",
        "error",
        "-i",
        trimWav,
        "-af",
        `afade=t=out:st=${Math.max(0, actualDur - 0.018).toFixed(3)}:d=0.018`,
        "-sample_fmt",
        "s16",
        fadeWav,
      ]);

      renderedBeats.push({ beat, aligned, trimLead, actualDur, fadeWav });
    }

    // Pass 2: Prepend 4.00s Kelompok 3 Intro, then assemble 9 scenes targeting ~240s (04:00)
    const concatParts = [];
    const introSilWav = join(tmpDir, "sil_intro_4s.wav");
    makeSilenceWav(INTRO_DURATION_S, introSilWav);
    concatParts.push(introSilWav);
    let cursorSec = INTRO_DURATION_S;
    const allWords = [];
    const sceneBoundsSec = {};

    for (let s = 1; s <= 9; s++) {
      const cfg = SCENE_TARGETS[s];
      const sBeats = renderedBeats.filter((rb) => rb.beat.scene === s);
      const speechSum = sBeats.reduce((acc, rb) => acc + rb.actualDur, 0);
      const weightSum = sBeats.reduce((acc, rb) => acc + rb.beat.pauseWeight, 0);
      const availPause = Math.max(0, cfg.targetSec - cfg.leadSec - speechSum);

      const startSec = cursorSec;
      const leadWav = join(tmpDir, `sil_lead_s${s}.wav`);
      makeSilenceWav(cfg.leadSec, leadWav);
      concatParts.push(leadWav);
      cursorSec += cfg.leadSec;

      for (let k = 0; k < sBeats.length; k++) {
        const rb = sBeats[k];
        for (const tok of rb.aligned) {
          const sRel = Math.max(0, (tok.start - rb.trimLead) / TEMPO);
          const eRel = Math.max(sRel + 0.02, (tok.end - rb.trimLead) / TEMPO);
          allWords.push({
            w: tok.w,
            cue: tok.cue,
            scene: s,
            line: tok.line,
            start: Number((cursorSec + sRel).toFixed(3)),
            end: Number((cursorSec + eRel).toFixed(3)),
          });
        }

        concatParts.push(rb.fadeWav);
        cursorSec += rb.actualDur;

        const rawPause = (availPause * rb.beat.pauseWeight) / Math.max(0.01, weightSum);
        const isLastBeat = s === 9 && k === sBeats.length - 1;
        const minP = isLastBeat ? 2.6 : Math.min(rb.beat.minPause, 0.22);
        const pauseSec = Math.max(minP, Math.min(rb.beat.maxPause, rawPause));
        const silWav = join(tmpDir, `sil_s${s}_${k}.wav`);
        makeSilenceWav(pauseSec, silWav);
        concatParts.push(silWav);
        cursorSec += pauseSec;
      }

      sceneBoundsSec[s] = {
        name: cfg.name,
        startSec: Number(startSec.toFixed(3)),
        endSec: Number(cursorSec.toFixed(3)),
        durSec: Number((cursorSec - startSec).toFixed(3)),
      };
    }

    const concatList = join(tmpDir, "concat.txt");
    writeFileSync(
      concatList,
      concatParts.map((p) => `file '${p.replace(/\\/g, "/")}'`).join("\n"),
      "utf8"
    );
    execFileSync("ffmpeg", [
      "-y",
      "-loglevel",
      "error",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      concatList,
      "-af",
      "loudnorm=I=-16:TP=-2.0:LRA=6:linear=true",
      "-ar",
      String(SR),
      "-ac",
      "1",
      "-sample_fmt",
      "s16",
      outVoWav,
    ]);

    const voDur = getDurationSec(outVoWav);
    const totalVideoSec = Number(voDur.toFixed(3));
    const totalFrames = Math.ceil(totalVideoSec * FPS);

    const cueMapSec = {};
    const cueMapFrame = {};
    for (const w of allWords) {
      if (w.cue) {
        cueMapSec[w.cue] = w.start;
        cueMapFrame[w.cue] = Math.round(w.start * FPS);
      }
    }
    cueMapSec.intro_start = 0.0;
    cueMapFrame.intro_start = 0;
    const lastWordEnd = allWords[allWords.length - 1]?.end ?? totalVideoSec - 3.6;
    cueMapSec.s9_endcard = Number((lastWordEnd + 0.3).toFixed(3));
    cueMapFrame.s9_endcard = Math.round(cueMapSec.s9_endcard * FPS);

    const scenesFrame = {
      intro: 0,
      s1: Math.round(sceneBoundsSec[1].startSec * FPS),
      s2: Math.round(sceneBoundsSec[2].startSec * FPS),
      s3: Math.round(sceneBoundsSec[3].startSec * FPS),
      s4: Math.round(sceneBoundsSec[4].startSec * FPS),
      s5: Math.round(sceneBoundsSec[5].startSec * FPS),
      s6: Math.round(sceneBoundsSec[6].startSec * FPS),
      s7: Math.round(sceneBoundsSec[7].startSec * FPS),
      s8: Math.round(sceneBoundsSec[8].startSec * FPS),
      s9: Math.round(sceneBoundsSec[9].startSec * FPS),
      totalFrames,
    };

    console.log("\n=== 9-SCENE CHARACTER-FLOW TIMING BREAKDOWN (TARGET ~04:00 / 240s) ===");
    for (let s = 1; s <= 9; s++) {
      const b = sceneBoundsSec[s];
      console.log(
        `  Scene 0${s} [${b.name}]: ${b.startSec.toFixed(2)}s -> ${b.endSec.toFixed(2)}s (dur=${b.durSec.toFixed(2)}s | f=${Math.round(b.startSec * FPS)}..${Math.round(b.endSec * FPS) - 1})`
      );
    }

    const subtitleChunks = buildSubtitleChunks(allWords);
    const alignObj = {
      series: "KELOMPOK 3 — DAMPAK KORUPSI TERHADAP KAWASAN KUMUH",
      episode: "JEJAK UANG YANG HILANG: DAMPAK KORUPSI TERHADAP KAWASAN KUMUH & UPAYA MENGATASINYA",
      groupCredits: "Kelompok 3: Ica, Mirza, Thalita, Zayyanah, Aul, Furqan, Raihan",
      voice: `${NARRATOR.label} · ElevenLabs ${TTS_MODEL}`,
      model: TTS_MODEL,
      tempo: TEMPO,
      voDurationSec: totalVideoSec,
      totalVideoSec,
      fps: FPS,
      totalFrames,
      sceneBoundsSec,
      scenesFrame,
      cuesSec: cueMapSec,
      cuesFrame: cueMapFrame,
      words: allWords,
    };
    writeFileSync(outAlignJson, JSON.stringify(alignObj, null, 2) + "\n", "utf8");

    const storyTs = `// AUTO-GENERATED by korupsi-kumuh-ep03/scripts/build_vo_and_sfx.mjs
// Source: ElevenLabs ${TTS_MODEL} (${NARRATOR.label}) character timestamps (${allWords.length} words, ${Object.keys(cueMapFrame).length} cues)

export interface SubtitleWord {
  text: string;
  startFrame: number;
  endFrame: number;
}

export interface SubtitleChunk {
  id: string;
  scene: number;
  startFrame: number;
  endFrame: number;
  words: SubtitleWord[];
}

export const COMPOSITION_CONFIG = {
  id: "KorupsiKumuhEp03Short",
  title: "Dampak Korupsi terhadap Kawasan Kumuh & Upaya Mengatasinya",
  groupName: "KELOMPOK 3",
  groupMembers: ["Ica", "Mirza", "Thalita", "Zayyanah", "Aul", "Furqan", "Raihan"] as const,
  width: 1080,
  height: 1920,
  fps: ${FPS},
  durationInFrames: ${totalFrames},
  durationSec: ${totalVideoSec},
  audioMasterPath: "korupsi-kumuh-ep03/audio_master.m4a",
} as const;

export const SCENES = ${JSON.stringify(scenesFrame, null, 2)} as const;

export const CUES = ${JSON.stringify(cueMapFrame, null, 2)} as const;

export const CUES_SEC = ${JSON.stringify(cueMapSec, null, 2)} as const;

export const SUBTITLE_CHUNKS: SubtitleChunk[] = ${JSON.stringify(subtitleChunks, null, 2)};
`;
    writeFileSync(outStoryTs, storyTs, "utf8");
    console.log(
      `\nVO COMPLETE -> ${outVoWav} (${totalVideoSec.toFixed(2)}s / ${totalFrames} frames | ${allWords.length} words | ${subtitleChunks.length} subtitle chunks)`
    );

    console.log("\n=== [2/2] Generating 10 Bespoke Tactile/Atmospheric SFX via eleven_text_to_sound_v3 ===");
    for (let i = 0; i < BESPOKE_SFX.length; i++) {
      const sfx = BESPOKE_SFX[i];
      const outPath = join(sfxDir, sfx.name);
      if (existsSync(outPath)) {
        console.log(`  [${i + 1}/${BESPOKE_SFX.length}] CACHED ${sfx.name}`);
        continue;
      }
      console.log(`  [${i + 1}/${BESPOKE_SFX.length}] SYNTH  ${sfx.name} (${sfx.durationSeconds}s)...`);
      const stream = await withRetry(`SFX ${sfx.name}`, () =>
        client.textToSoundEffects.convert({
          text: sfx.prompt,
          modelId: SFX_MODEL,
          durationSeconds: sfx.durationSeconds,
          promptInfluence: sfx.promptInfluence,
          loop: false,
        })
      );
      const ws = createWriteStream(outPath);
      await finished(Readable.fromWeb(stream).pipe(ws));
      const d = getDurationSec(outPath);
      console.log(`           -> saved (${d.toFixed(2)}s)`);
    }

    console.log("\n=== ALL KORUPSI KUMUH EP03 VO & BESPOKE SFX COMPLETE ===");
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
