/**
 * Audio-First VO & Bespoke SFX Generator for:
 * SERI: SEHAT ITU MENYELURUH — VIDEO 1
 * "TUBUH YANG SEHAT DIMULAI DARI KEBIASAAN KECIL"
 *
 * - Primary Narrator: Brian (`nPczCjzI2devNBz1zQrb`) via ElevenLabs `eleven_v4` (`id`).
 * - Natural Documentary Pacing (`TEMPO = 1.0`) honoring exact Naskah Final verbatim
 *   with thoughtful breathing pauses across all 7 scenes (~03:00 / ~180s).
 * - Character-level timestamps (`convertWithTimestamps`) extract exact timing for
 *   every spoken word, 39 storyboard [[cue]] anchors, 7 scene boundaries, and clean
 *   word-by-word karaoke subtitle chunks exported to:
 *     `remotion/videos/sehat-ep01/story.ts`
 * - Generates 11 bespoke tactile foley SFX via ElevenLabs `eleven_text_to_sound_v3`.
 *
 * Run:
 *   node --env-file=.env sehat-ep01/scripts/build_vo_and_sfx.mjs
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
const TEMPO = 1.09; // Natural, warm documentary narrator voice hitting exact ~03:00 (180s)!

const NARRATOR = {
  id: "nPczCjzI2devNBz1zQrb", // Brian — Warm, Clear, Natural Documentary Storyteller
  label: "Brian (Warm Natural Documentary Narrator)",
  stability: 0.54,
  similarityBoost: 0.78,
};

// 3.00s Opening Group Introduction ("Tugas Kelompok: Yoga, Adi, dan Rayyan") before Scene 01 alarm starts!
const INTRO_DURATION_S = 3.0;

// Target scene durations from Naskah Final (total ~03:00 + 3s Intro = ~185s)
const SCENE_TARGETS = {
  1: { name: "Tubuh yang Selalu Dipaksa", targetSec: 20.0, leadSec: 2.1 },
  2: { name: "Apa yang Kita Masukkan ke Tubuh?", targetSec: 30.0, leadSec: 1.0 },
  3: { name: "Tubuh Bukan Mesin yang Bisa Diam", targetSec: 25.0, leadSec: 0.9 },
  4: { name: "Manusia Bukan Hanya Tubuh", targetSec: 35.0, leadSec: 1.3 },
  5: { name: "Jangan Abaikan Waktu Istirahat", targetSec: 25.0, leadSec: 1.3 },
  6: { name: "Perubahan Kecil", targetSec: 25.0, leadSec: 1.1 },
  7: { name: "Kesehatan Adalah Investasi", targetSec: 20.0, leadSec: 0.9 },
};

// 100% VERBATIM NASKAH FINAL — VIDEO 1
const BEATS = [
  // =========================================================================
  // SCENE 01 — TUBUH YANG SELALU DIPAKSA (00:00–00:20)
  // =========================================================================
  {
    scene: 1,
    minPause: 0.45,
    maxPause: 1.15,
    pauseWeight: 1.0,
    text: "[warm] [[s1_wake]]Pernah merasa tubuh cepat lelah, sulit berkonsentrasi, atau mudah kehilangan semangat?",
  },
  {
    scene: 1,
    minPause: 0.42,
    maxPause: 1.1,
    pauseWeight: 1.0,
    text: "[reflective] [[s1_drink]]Kita sering menganggapnya hal biasa.",
  },
  {
    scene: 1,
    minPause: 0.5,
    maxPause: 1.25,
    pauseWeight: 1.15,
    text: "[thoughtful] [[s1_slump]]Padahal, bisa jadi tubuh sedang memberikan sinyal bahwa ada sesuatu yang perlu diperbaiki.",
  },
  {
    scene: 1,
    minPause: 0.65,
    maxPause: 1.6,
    pauseWeight: 1.4,
    text: "[serious] [[s1_overwhelmed]]Masalahnya, kita sering baru peduli ketika tubuh sudah benar-benar kewalahan.",
  },

  // =========================================================================
  // SCENE 02 — APA YANG KITA MASUKKAN KE TUBUH? (00:20–00:50)
  // =========================================================================
  {
    scene: 2,
    minPause: 0.42,
    maxPause: 1.1,
    pauseWeight: 0.9,
    text: "[steady] [[s2_instant]]Semua aktivitas tubuh membutuhkan energi dan zat gizi.",
  },
  {
    scene: 2,
    minPause: 0.5,
    maxPause: 1.25,
    pauseWeight: 1.1,
    text: "[warm] [[s2_dive]]Makanan bukan sekadar pengisi perut.",
  },
  {
    scene: 2,
    minPause: 0.75,
    maxPause: 1.8,
    pauseWeight: 1.4,
    text: "[clear] [[s2_carbs]]Karbohidrat menjadi sumber energi, [[s2_protein]]protein membantu membangun dan memperbaiki jaringan, [[s2_vitamins]]sementara vitamin dan mineral mendukung berbagai fungsi tubuh.",
  },
  {
    scene: 2,
    minPause: 0.48,
    maxPause: 1.25,
    pauseWeight: 1.0,
    text: "[encouraging] [[s2_balanced]]Karena itu, biasakan makan dengan gizi seimbang.",
  },
  {
    scene: 2,
    minPause: 0.7,
    maxPause: 1.75,
    pauseWeight: 1.4,
    text: "[warm] Perbanyak sayur dan buah, konsumsi sumber protein, [[s2_limit]]serta batasi gula, garam, dan lemak berlebihan.",
  },

  // =========================================================================
  // SCENE 03 — TUBUH BUKAN MESIN YANG BISA DIAM (00:50–01:15)
  // =========================================================================
  {
    scene: 3,
    minPause: 0.42,
    maxPause: 1.05,
    pauseWeight: 0.9,
    text: "[steady] [[s3_sit]]Tubuh manusia dirancang untuk bergerak.",
  },
  {
    scene: 3,
    minPause: 0.65,
    maxPause: 1.65,
    pauseWeight: 1.35,
    text: "[serious] [[s3_chest_push]]Terlalu lama duduk dan jarang beraktivitas dapat meningkatkan risiko berbagai masalah kesehatan.",
  },
  {
    scene: 3,
    minPause: 0.55,
    maxPause: 1.4,
    pauseWeight: 1.15,
    text: "[warm] [[s3_heart]]Olahraga membantu menjaga kebugaran jantung, [[s3_blood]]memperkuat otot dan tulang, serta meningkatkan stamina.",
  },
  {
    scene: 3,
    minPause: 0.42,
    maxPause: 1.05,
    pauseWeight: 0.9,
    text: "[reassuring] [[s3_active]]Tidak harus langsung melakukan olahraga berat.",
  },
  {
    scene: 3,
    minPause: 0.65,
    maxPause: 1.6,
    pauseWeight: 1.35,
    text: "[bright] [[s3_jog_stretch]]Berjalan kaki, bersepeda, atau melakukan aktivitas fisik secara rutin sudah menjadi langkah yang baik.",
  },

  // =========================================================================
  // SCENE 04 — MANUSIA BUKAN HANYA TUBUH (01:15–01:50)
  // =========================================================================
  {
    scene: 4,
    minPause: 0.5,
    maxPause: 1.35,
    pauseWeight: 1.0,
    text: "[thoughtful] [[s4_stress]]Tapi kesehatan manusia ternyata tidak berhenti pada apa yang terjadi di dalam tubuh.",
  },
  {
    scene: 4,
    minPause: 0.75,
    maxPause: 1.9,
    pauseWeight: 1.45,
    text: "[reflective] [[s4_orbit]]Ada kebutuhan lain yang sering kita lupakan: kebutuhan psikologis.",
  },
  {
    scene: 4,
    minPause: 0.65,
    maxPause: 1.65,
    pauseWeight: 1.25,
    text: "[warm] [[s4_maslow]]Abraham Maslow, seorang tokoh psikologi humanistik, memperkenalkan teori hierarki kebutuhan manusia.",
  },
  {
    scene: 4,
    minPause: 0.85,
    maxPause: 2.1,
    pauseWeight: 1.6,
    text: "[clear] [[s4_tier1]]Mulai dari kebutuhan fisiologis [[s4_tier2]]dan rasa aman, [[s4_tier3]]hingga hubungan sosial, [[s4_tier4]]penghargaan, dan [[s4_tier5]]aktualisasi diri.",
  },
  {
    scene: 4,
    minPause: 0.85,
    maxPause: 2.0,
    pauseWeight: 1.5,
    text: "[resonant] [[s4_human]]Artinya, manusia juga membutuhkan rasa aman, hubungan yang sehat, penghargaan, dan kesempatan untuk berkembang.",
  },

  // =========================================================================
  // SCENE 05 — JANGAN ABAIKAN WAKTU ISTIRAHAT (01:50–02:15)
  // =========================================================================
  {
    scene: 5,
    minPause: 0.55,
    maxPause: 1.45,
    pauseWeight: 1.05,
    text: "[calm] [[s5_shutdown]]Salah satu kebutuhan fisiologis yang paling sering diabaikan adalah tidur.",
  },
  {
    scene: 5,
    minPause: 0.75,
    maxPause: 1.95,
    pauseWeight: 1.45,
    text: "[gentle] [[s5_sleep]]Saat kita tidur, [[s5_brain]]otak tetap aktif memproses informasi dan tubuh menjalankan berbagai proses pemulihan.",
  },
  {
    scene: 5,
    minPause: 0.55,
    maxPause: 1.45,
    pauseWeight: 1.1,
    text: "[serious] [[s5_lack]]Kurang tidur dapat mengganggu konsentrasi, suasana hati, dan kesehatan.",
  },
  {
    scene: 5,
    minPause: 1.1,
    maxPause: 3.2,
    pauseWeight: 2.1,
    text: "[warm] [[s5_timelapse]]Karena itu, biasakan tidur teratur dan cukup sesuai usia.",
  },

  // =========================================================================
  // SCENE 06 — PERUBAHAN KECIL (02:15–02:40)
  // =========================================================================
  {
    scene: 6,
    minPause: 0.7,
    maxPause: 2.1,
    pauseWeight: 1.3,
    text: "[bright] [[s6_wake_early]]Perubahan tidak harus dimulai dengan sesuatu yang besar.",
  },
  {
    scene: 6,
    minPause: 0.8,
    maxPause: 2.2,
    pauseWeight: 1.5,
    text: "[energetic] [[s6_water]]Cukupi kebutuhan cairan, [[s6_breakfast]]pilih makanan bergizi, [[s6_move]]aktif bergerak, [[s6_balance]]tidur cukup, dan kelola stres.",
  },
  {
    scene: 6,
    minPause: 0.9,
    maxPause: 2.4,
    pauseWeight: 1.6,
    text: "[encouraging] [[s6_habit]]Lakukan secara bertahap hingga menjadi kebiasaan.",
  },

  // =========================================================================
  // SCENE 07 — KESEHATAN ADALAH INVESTASI (02:40–03:00)
  // =========================================================================
  {
    scene: 7,
    minPause: 0.6,
    maxPause: 1.4,
    pauseWeight: 1.0,
    text: "[warm] [[s7_walk]]Pada akhirnya, kesehatan bukan sesuatu yang bisa dibeli secara instan ketika kita jatuh sakit.",
  },
  {
    scene: 7,
    minPause: 0.65,
    maxPause: 1.5,
    pauseWeight: 1.1,
    text: "[resonant] [[s7_decisions]]Ia dibangun dari keputusan-keputusan kecil yang kita lakukan setiap hari.",
  },
  {
    scene: 7,
    minPause: 3.4,
    maxPause: 5.0,
    pauseWeight: 3.2,
    text: "[inspiring] [[s7_crane]]Jadi, jangan menunggu tubuhmu menyerah untuk mulai menjaganya.",
  },
];

// 11 Bespoke Tactile Foley SFX via ElevenLabs `eleven_text_to_sound_v3`
const BESPOKE_SFX = [
  {
    name: "sfx_alarm_clock.mp3",
    durationSeconds: 3.2,
    promptInfluence: 0.65,
    prompt:
      "Classic bedside digital and mechanical alarm clock ringing sharply in a quiet early morning bedroom then abruptly tapped off with a crisp click, realistic foley, no music",
  },
  {
    name: "sfx_soda_can_and_yawn.mp3",
    durationSeconds: 3.5,
    promptInfluence: 0.6,
    prompt:
      "Sweet soda aluminum can tab popping open with brief fizzy hiss followed by soft wooden desk chair creak and tired light sigh in a quiet room, realistic indoor foley, no music",
  },
  {
    name: "sfx_digest_dive.mp3",
    durationSeconds: 4.5,
    promptInfluence: 0.58,
    prompt:
      "Crisp dry noodle package rustle transitioning into a smooth deep organic cellular whoosh and gentle warm microscopic fluid flow inside the human body, scientific documentary foley, no music",
  },
  {
    name: "sfx_fresh_food_chime.mp3",
    durationSeconds: 3.2,
    promptInfluence: 0.58,
    prompt:
      "Crisp ceramic plate set cleanly onto a sunny wooden kitchen table with fresh crunchy vegetables and light airy harmonic shimmer, clean culinary foley, no music",
  },
  {
    name: "sfx_heartbeat_artery.mp3",
    durationSeconds: 6.0,
    promptInfluence: 0.62,
    prompt:
      "Deep realistic human heartbeat lub-dub pulsing steadily with warm rhythmic rushing arterial blood flow inside a vessel, intimate medical documentary foley, no music",
  },
  {
    name: "sfx_park_jogging.mp3",
    durationSeconds: 5.5,
    promptInfluence: 0.6,
    prompt:
      "Light rhythmic sneakers brisk walking and gentle jogging on a sunny park paved path with cheerful distant morning birds and soft breeze through leaves, outdoor foley, no music",
  },
  {
    name: "sfx_notifications_muffle.mp3",
    durationSeconds: 5.0,
    promptInfluence: 0.62,
    prompt:
      "Rapid overlapping smartphone and laptop message alert pings escalating in a busy room then gradually low-pass filtering into deep muffled underwater silence, cinematic sound design, no music",
  },
  {
    name: "sfx_maslow_chimes.mp3",
    durationSeconds: 5.5,
    promptInfluence: 0.56,
    prompt:
      "Five gentle ascending warm glass marimba and crystalline bell resonances ringing sequentially with spacious dark hall reverb, thoughtful documentary accent, no melody",
  },
  {
    name: "sfx_laptop_close_night.mp3",
    durationSeconds: 4.0,
    promptInfluence: 0.62,
    prompt:
      "Modern laptop lid closing softly followed by a smartphone placed gently on a wooden nightstand and quiet peaceful night crickets outside a bedroom window, realistic foley, no music",
  },
  {
    name: "sfx_brain_recovery.mp3",
    durationSeconds: 5.5,
    promptInfluence: 0.55,
    prompt:
      "Soft calm deep breathing waves blended with delicate shimmering neural synapse pulses and gentle restorative warm air hum, scientific sleep documentary foley, no music",
  },
  {
    name: "sfx_morning_water_and_walk.mp3",
    durationSeconds: 5.5,
    promptInfluence: 0.62,
    prompt:
      "Clear cool drinking water pouring cleanly into a glass followed by fresh sunny morning birdsong and confident steady footsteps on a neighborhood garden walkway, bright foley, no music",
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
      const disp = m[2];
      if (!disp) continue;
      displayTokens.push({ w: disp, cue, line: lineIdx });
      ttsChunks.push(disp);
    }
  }
  return {
    displayTokens,
    ttsText: ttsChunks.join(" ").replace(/\s{2,}/g, " ").trim(),
    ttsPlainNoTags: displayTokens
      .map((x) => x.w)
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
    const target = normWord(dt.w);
    if (rIdx >= spokenRuns.length) {
      const last = spokenRuns[spokenRuns.length - 1];
      out.push({ ...dt, start: last.start, end: last.end });
      continue;
    }
    const startRun = spokenRuns[rIdx];
    let acc = normWord(startRun.text);
    let endRun = startRun;
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
  // Warm documentary narrator EQ: HPF 75 Hz, warmth +1.8dB @ 155 Hz, clarity +1.6dB @ 3.0 kHz, de-ess -1.5dB @ 6.5 kHz
  const eq =
    "highpass=f=75,equalizer=f=155:t=q:w=1.1:g=1.8,equalizer=f=3000:t=q:w=1.3:g=1.6,equalizer=f=6500:t=q:w=1.4:g=-1.5";
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

/**
 * Group aligned words into readable 3-5 word cinematic documentary subtitle chunks
 * with per-word exact startFrame timestamps!
 */
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
      cur.push(w);
      const textLen = cur.map((x) => x.w).join(" ").length;
      const endsPunct = /[,.\?!:]$/.test(w.w);
      const remaining = lineWords.length - 1 - i;
      const shouldBreak =
        (endsPunct && cur.length >= 2 && remaining >= 1) ||
        (cur.length >= 5 && remaining >= 2) ||
        (textLen >= 30 && cur.length >= 3 && remaining >= 1);
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

async function main() {
  const client = new ElevenLabsClient();
  const audioDir = join(PROJECT, "audio");
  const voCacheDir = join(audioDir, "vo_cache");
  const sfxDir = join(audioDir, "sfx");
  const outVoWav = join(audioDir, "vo_master.wav");
  const outAlignJson = join(audioDir, "alignment.json");
  const outStoryTs = join(ROOT, "remotion/videos/sehat-ep01/story.ts");
  const tmpBase = join(PROJECT, ".tmp");

  mkdirSync(voCacheDir, { recursive: true });
  mkdirSync(sfxDir, { recursive: true });
  mkdirSync(dirname(outStoryTs), { recursive: true });
  mkdirSync(tmpBase, { recursive: true });

  const prepared = BEATS.map((b, idx) => ({ ...b, idx, ...prepareBeat(b.text, idx) }));
  const tmpDir = mkdtempSync(join(tmpBase, "vo-build-"));

  try {
    console.log(
      `=== [1/2] Synthesizing ElevenLabs ${TTS_MODEL} Documentary Narrator VO (${NARRATOR.label}, tempo=${TEMPO}x) ===`
    );

    // Pass 1: Synthesize & trim every beat to measure exact natural durations
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
        const res = await client.textToSpeech.convertWithTimestamps(NARRATOR.id, {
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
        });
        writeFileSync(mp3Path, Buffer.from(res.audioBase64, "base64"));
        alignment = res.alignment;
        writeFileSync(alignPath, JSON.stringify(alignment, null, 2));
      }

      const rawWav = join(tmpDir, `beat_${i}.wav`);
      renderCleanNarratorWav(mp3Path, rawWav);

      const spokenRuns = extractSpokenRuns(alignment);
      const aligned = alignDisplayToRuns(beat.displayTokens, spokenRuns);
      const clipDur = getDurationSec(rawWav);
      // Generous 0.14s pre-onset margin so initial consonants NEVER clip
      const trimLead = aligned.length ? Math.max(0, Number((aligned[0].start - 0.14).toFixed(3))) : 0;
      const lastEnd = aligned.length ? aligned[aligned.length - 1].end : clipDur;
      const srcSpan = Math.max(
        0.15,
        Math.min(clipDur - trimLead, Number((lastEnd - trimLead + 0.16).toFixed(3)))
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

      renderedBeats.push({
        beat,
        aligned,
        trimLead,
        actualDur,
        fadeWav,
      });
    }

    // Pass 2: Prepend 3.00s Group Intro Silence, then assemble 7 scenes cleanly
    const concatParts = [];
    const introSilWav = join(tmpDir, "sil_intro_3s.wav");
    makeSilenceWav(INTRO_DURATION_S, introSilWav);
    concatParts.push(introSilWav);
    let cursorSec = INTRO_DURATION_S;
    const allWords = [];
    const sceneBoundsSec = {};

    for (let s = 1; s <= 7; s++) {
      const cfg = SCENE_TARGETS[s];
      const sBeats = renderedBeats.filter((rb) => rb.beat.scene === s);
      const speechSum = sBeats.reduce((acc, rb) => acc + rb.actualDur, 0);
      const weightSum = sBeats.reduce((acc, rb) => acc + rb.beat.pauseWeight, 0);
      const availPause = Math.max(0, cfg.targetSec - cfg.leadSec - speechSum);

      const startSec = cursorSec;
      // Add scene lead breathing room (e.g., 2.1s alarm ringing in Scene 1)
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
        const pauseSec = Math.max(rb.beat.minPause, Math.min(rb.beat.maxPause, rawPause));
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
    // Add explicit non-VO visual cues (Intro = 0.0s..3.0s, Alarm starts right at 3.0s!)
    cueMapSec.intro_start = 0.0;
    cueMapFrame.intro_start = 0;
    cueMapSec.s1_alarm = INTRO_DURATION_S;
    cueMapFrame.s1_alarm = Math.round(INTRO_DURATION_S * FPS);
    const lastWordEnd = allWords[allWords.length - 1]?.end ?? totalVideoSec - 3.5;
    cueMapSec.s7_title = Number((lastWordEnd + 0.35).toFixed(3));
    cueMapFrame.s7_title = Math.round(cueMapSec.s7_title * FPS);

    const scenesFrame = {
      intro: 0,
      s1: Math.round(sceneBoundsSec[1].startSec * FPS),
      s2: Math.round(sceneBoundsSec[2].startSec * FPS),
      s3: Math.round(sceneBoundsSec[3].startSec * FPS),
      s4: Math.round(sceneBoundsSec[4].startSec * FPS),
      s5: Math.round(sceneBoundsSec[5].startSec * FPS),
      s6: Math.round(sceneBoundsSec[6].startSec * FPS),
      s7: Math.round(sceneBoundsSec[7].startSec * FPS),
      totalFrames,
    };

    console.log("\n=== 7-SCENE DOCUMENTARY TIMING BREAKDOWN (TARGET ~03:00) ===");
    for (let s = 1; s <= 7; s++) {
      const b = sceneBoundsSec[s];
      console.log(
        `  Scene 0${s} [${b.name}]: ${b.startSec.toFixed(2)}s -> ${b.endSec.toFixed(2)}s (dur=${b.durSec.toFixed(2)}s | f=${Math.round(b.startSec * FPS)}..${Math.round(b.endSec * FPS) - 1})`
      );
    }

    const subtitleChunks = buildSubtitleChunks(allWords);
    const alignObj = {
      series: "SERI: SEHAT ITU MENYELURUH",
      episode: "VIDEO 1 — TUBUH YANG SEHAT DIMULAI DARI KEBIASAAN KECIL",
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

    const storyTs = `// AUTO-GENERATED by sehat-ep01/scripts/build_vo_and_sfx.mjs
// Source: ElevenLabs ${TTS_MODEL} character timestamps (${allWords.length} words, ${Object.keys(cueMapFrame).length} cues)

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
  id: "SehatEp01Short",
  title: "Tubuh yang Sehat Dimulai dari Kebiasaan Kecil",
  series: "SEHAT ITU MENYELURUH",
  width: 1080,
  height: 1920,
  fps: ${FPS},
  durationInFrames: ${totalFrames},
  durationSec: ${totalVideoSec},
  audioMasterPath: "sehat-ep01/audio_master.m4a",
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

    // Step 2: Generate 11 bespoke ElevenLabs Sound-V3 tactile foley SFX
    console.log("\n=== [2/2] Generating 11 Bespoke Tactile Foley SFX via eleven_text_to_sound_v3 ===");
    for (let i = 0; i < BESPOKE_SFX.length; i++) {
      const sfx = BESPOKE_SFX[i];
      const outPath = join(sfxDir, sfx.name);
      if (existsSync(outPath)) {
        console.log(`  [${i + 1}/${BESPOKE_SFX.length}] CACHED ${sfx.name}`);
        continue;
      }
      console.log(`  [${i + 1}/${BESPOKE_SFX.length}] SYNTH  ${sfx.name} (${sfx.durationSeconds}s)...`);
      const stream = await client.textToSoundEffects.convert({
        text: sfx.prompt,
        modelId: SFX_MODEL,
        durationSeconds: sfx.durationSeconds,
        promptInfluence: sfx.promptInfluence,
        loop: false,
      });
      const ws = createWriteStream(outPath);
      await finished(Readable.fromWeb(stream).pipe(ws));
      const d = getDurationSec(outPath);
      console.log(`           -> saved (${d.toFixed(2)}s)`);
    }

    console.log("\n=== ALL SEHAT EP01 VO & BESPOKE SFX COMPLETE ===");
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
