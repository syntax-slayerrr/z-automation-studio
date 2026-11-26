/**
 * Audio-First VO & Bespoke SFX Generator for:
 * VIDEO 2 — "JEBAKAN SCROLL TANPA AKHIR: KENAPA DOOMSCROLLING BIKIN MENTAL MAKIN LELAH?"
 *
 * - Completely distinct voice from Video 1 (Brian):
 *   Uses Liam (`TX3LPaxmHKxFdv7VOQHJ`) — Fast, Energetic, Relatable Young Male
 *   via ElevenLabs `eleven_v4` (`languageCode: "id"`, `TEMPO = 1.14`).
 * - 3.00s Opening Group Introduction ("Tugas Kelompok: Zaki, Fatir, dan Rendi")
 *   before Scene 01 VO begins.
 * - Character-level timestamps (`convertWithTimestamps`) extract exact timing for
 *   every spoken word, 26+ storyboard [[cue]] anchors, 7 scene boundaries, and
 *   word-by-word kinetic Risograph highlight subtitle chunks exported to:
 *     `remotion/videos/doomscrolling-ep02/story.ts`
 * - Generates 10 bespoke tactile/digital SFX via ElevenLabs `eleven_text_to_sound_v3`.
 *
 * Run:
 *   node --env-file=.env doomscrolling-ep02/scripts/build_vo_and_sfx.mjs
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
const TEMPO = 1.23; // Crisp, energetic modern explainer cadence hitting ~02:55 (175s) inside 02:30-03:00 window!

const NARRATOR = {
  id: "TX3LPaxmHKxFdv7VOQHJ", // Liam — Energetic, Conversational Young Male (distinct from Video 1 Brian)
  label: "Liam (Energetic Relatable Young Male)",
  stability: 0.48,
  similarityBoost: 0.78,
};

// 3.00s Opening Group Introduction ("Tugas Kelompok: Zaki, Fatir, dan Rendi")
const INTRO_DURATION_S = 3.0;

// Target scene durations calibrated cleanly to ~02:55 (175s) total
const SCENE_TARGETS = {
  1: { name: "Hook: Cuma 5 Menit Jam Dua Pagi", targetSec: 19.0, leadSec: 0.55 },
  2: { name: "Stakes: Maraton Emosi 60 Detik", targetSec: 20.5, leadSec: 0.42 },
  3: { name: "Turn: Mesin Slot & B.F. Skinner", targetSec: 32.0, leadSec: 0.42 },
  4: { name: "Reveal: Dopamin & Dr. Anna Lembke", targetSec: 30.0, leadSec: 0.42 },
  5: { name: "Twist: Amygdala, Kortisol & Malam", targetSec: 25.5, leadSec: 0.42 },
  6: { name: "Payoff: 4 Langkah Memutus Lingkaran", targetSec: 30.5, leadSec: 0.50 },
  7: { name: "Residue: Zine Cover Finale", targetSec: 14.0, leadSec: 0.45 },
};

// 100% VERBATIM NASKAH FINAL — VIDEO 2
// Syntax: `[[cue_id]]DisplayWord` or `[[cue_id]]DisplayWord|SpokenPhonetic`
const BEATS = [
  // =========================================================================
  // SCENE 01 — HOOK: "CUMA 5 MENIT" JAM DUA PAGI (00:03–00:25)
  // =========================================================================
  {
    scene: 1,
    minPause: 0.42,
    maxPause: 1.05,
    pauseWeight: 0.95,
    text: "[conversational] [[s1_five_min]]Kamu bilang cuma mau buka HP|hape lima menit sebelum tidur.",
  },
  {
    scene: 1,
    minPause: 0.52,
    maxPause: 1.25,
    pauseWeight: 1.15,
    text: "[intrigued] [[s1_clock_jump]]Tapi tahu-tahu, jam di pojok layar sudah lewat pukul satu dini hari. [[s1_thumb]]Mata perih, bahu kaku, tapi jempolmu tetap menggeser layar satu kali lagi… dan satu kali lagi.",
  },
  {
    scene: 1,
    minPause: 0.65,
    maxPause: 1.45,
    pauseWeight: 1.35,
    text: "[curious] [[s1_battery]]Anehnya, kamu nggak ke mana-mana. Cuma rebahan. Tapi kenapa kepala rasanya jauh lebih lelah daripada habis kerja seharian?",
  },

  // =========================================================================
  // SCENE 02 — STAKES: KEBANJIRAN EMOSI DALAM 60 DETIK (00:25–00:50)
  // =========================================================================
  {
    scene: 2,
    minPause: 0.42,
    maxPause: 1.05,
    pauseWeight: 0.9,
    text: "[punchy] [[s2_marathon]]Karena di balik layar kecil itu, otakmu sedang dipaksa maraton emosi tanpa jeda.",
  },
  {
    scene: 2,
    minPause: 0.55,
    maxPause: 1.35,
    pauseWeight: 1.25,
    text: "[energetic] Bayangkan: dalam satu menit doomscrolling, kamu bisa melihat [[s2_card_disaster]]berita bencana, lalu tiga detik kemudian [[s2_card_comedy]]video komedi, lalu [[s2_card_vacation]]unggahan liburan orang lain, lalu [[s2_card_debate]]keributan di kolom komentar.",
  },
  {
    scene: 2,
    minPause: 0.65,
    maxPause: 1.5,
    pauseWeight: 1.35,
    text: "[serious] [[s2_overload]]Tubuhmu memang diam di atas kasur. Tapi bagi otak, ia baru saja melewati puluhan gelombang informasi yang belum sempat dicerna sama sekali.",
  },

  // =========================================================================
  // SCENE 03 — TURN: MESIN SLOT & B.F. SKINNER (00:50–01:18)
  // =========================================================================
  {
    scene: 3,
    minPause: 0.42,
    maxPause: 1.05,
    pauseWeight: 0.9,
    text: "[inquisitive] [[s3_pull_morph]]Lalu kenapa kita tetap susah berhenti, padahal sadar diri sudah lelah?",
  },
  {
    scene: 3,
    minPause: 0.6,
    maxPause: 1.45,
    pauseWeight: 1.3,
    text: "[confident] Jawabannya ditemukan puluhan tahun sebelum ponsel pintar lahir. [[s3_skinner]]Tahun 1957, B.|Be F.|Ef Skinner — salah satu psikolog paling berpengaruh dari Harvard — membuktikan lewat eksperimen bahwa [[s3_var_ratio]]hadiah yang muncul secara acak dan tidak bisa ditebak menciptakan dorongan pengulangan paling kuat bagi otak. [[s3_slot_casino]]Prinsip yang sama dipakai di mesin slot kasino.",
  },
  {
    scene: 3,
    minPause: 0.65,
    maxPause: 1.55,
    pauseWeight: 1.4,
    text: "[animated] Dan desain [[s3_reels]]infinite scroll bekerja persis seperti itu. Kadang membosankan, kadang biasa saja, lalu tiba-tiba muncul satu konten yang sangat menarik. [[s3_lever]]Justru karena kamu tidak pernah tahu apa yang muncul di geseran berikutnya, jempolmu terus menarik tuas tanpa sadar.",
  },

  // =========================================================================
  // SCENE 04 — DEEPEN & REVEAL: DOPAMIN & DR. ANNA LEMBKE (01:18–01:48)
  // =========================================================================
  {
    scene: 4,
    minPause: 0.48,
    maxPause: 1.15,
    pauseWeight: 1.0,
    text: "[sharp] [[s4_myth]]Di sinilah banyak orang keliru. Kita sering menyebut dopamin sebagai hormon kebahagiaan. [[s4_anticipation]]Padahal ia adalah molekul antisipasi — dorongan untuk terus mengejar.",
  },
  {
    scene: 4,
    minPause: 0.55,
    maxPause: 1.35,
    pauseWeight: 1.2,
    text: "[steady] [[s4_lembke]]Dr.|Dokter Anna Lembke, profesor psikiatri dari Stanford University, menjelaskan bahwa otak kita bekerja seperti [[s4_seesaw]]timbangan antara kesenangan dan rasa tidak nyaman.",
  },
  {
    scene: 4,
    minPause: 0.68,
    maxPause: 1.6,
    pauseWeight: 1.45,
    text: "[reflective] Setiap kali jempolmu menggeser layar dan memicu [[s4_spike]]lonjakan dopamin instan, timbangan itu langsung menekan balik ke sisi [[s4_dip]]rasa hampa dan gelisah begitu videonya selesai. Akhirnya kamu terus scroll bukan lagi untuk merasa senang, melainkan sekadar lari dari rasa kosong itu sendiri.",
  },

  // =========================================================================
  // SCENE 05 — TWIST: AMYGDALA, KORTISOL & JEBAKAN MALAM (01:48–02:14)
  // =========================================================================
  {
    scene: 5,
    minPause: 0.42,
    maxPause: 1.05,
    pauseWeight: 0.9,
    text: "[urgent] [[s5_badnews]]Masalahnya membesar saat isi layar didominasi berita buruk, rasa takut, atau perbandingan sosial.",
  },
  {
    scene: 5,
    minPause: 0.58,
    maxPause: 1.38,
    pauseWeight: 1.25,
    text: "[focused] Otak kita punya negativity bias — naluri purba yang otomatis terpaku pada ancaman. Akibatnya, [[s5_amygdala]]amygdala menyalakan alarm bahaya dan memicu hormon stres [[s5_cortisol]]kortisol, sementara [[s5_pfc]]prefrontal cortex yang mengatur fokus perlahan kehabisan tenaga.",
  },
  {
    scene: 5,
    minPause: 0.68,
    maxPause: 1.55,
    pauseWeight: 1.4,
    text: "[serious] Ditambah [[s5_bluelight]]cahaya layar di malam hari yang menekan melatonin, tidurmu jadi dangkal. [[s5_cycle]]Besoknya fokus makin rapuh, dan otak makin lemah menahan godaan scroll lagi.",
  },

  // =========================================================================
  // SCENE 06 — PAYOFF: 4 LANGKAH NYATA MEMUTUS LINGKARAN (02:14–02:40)
  // =========================================================================
  {
    scene: 6,
    minPause: 0.45,
    maxPause: 1.1,
    pauseWeight: 0.95,
    text: "[bright] [[s6_intro]]Kabar baiknya, kamu tidak perlu membuang HP|hape atau kabur ke hutan untuk pulih. Cukup bangun gesekan kecil.",
  },
  {
    scene: 6,
    minPause: 0.48,
    maxPause: 1.15,
    pauseWeight: 1.05,
    text: "[steady] [[s6_step1]]Pertama, matikan notifikasi merah yang tidak penting atau ubah layar ke mode hitam-putih di malam hari agar daya tarik visualnya turun drastis.",
  },
  {
    scene: 6,
    minPause: 0.45,
    maxPause: 1.1,
    pauseWeight: 1.0,
    text: "[steady] [[s6_step2]]Kedua, jauhkan HP|hape dari bantal minimal tiga puluh menit sebelum tidur.",
  },
  {
    scene: 6,
    minPause: 0.5,
    maxPause: 1.2,
    pauseWeight: 1.1,
    text: "[calm] [[s6_step3]]Ketiga, beri jeda tiga detik sebelum membuka aplikasi, lalu tanyakan: kamu sedang butuh informasi, atau sedang lari dari rasa cemas?",
  },
  {
    scene: 6,
    minPause: 0.65,
    maxPause: 1.5,
    pauseWeight: 1.35,
    text: "[warm] [[s6_step4]]Dan keempat, isi ulang otak dengan dopamin aktif: berjalan keluar, mengobrol langsung, atau berkarya dengan tanganmu sendiri.",
  },

  // =========================================================================
  // SCENE 07 — RESIDUE & COLLECTIBLE ZINE FINALE (02:40–02:56)
  // =========================================================================
  {
    scene: 7,
    minPause: 0.6,
    maxPause: 1.35,
    pauseWeight: 1.05,
    text: "[gentle] [[s7_facedown]]Istirahat sejati bukan saat tubuhmu diam, melainkan saat pikiranmu benar-benar diberi ruang untuk bernapas.",
  },
  {
    scene: 7,
    minPause: 2.9,
    maxPause: 3.8,
    pauseWeight: 2.8,
    text: "[resonant] [[s7_finale]]Letakkan layarmu sebentar. Karena hidupmu tidak tinggal di dalam linimasa.",
  },
];

// 10 Bespoke Tactile/Digital SFX via ElevenLabs `eleven_text_to_sound_v3`
const BESPOKE_SFX = [
  {
    name: "sfx_stamp_paper_tear.mp3",
    durationSeconds: 2.6,
    promptInfluence: 0.64,
    prompt:
      "Heavy wooden ink rubber stamp thudding cleanly onto thick matte print paper followed by a sharp crisp paper sheet tear rip, tactile zine print studio foley, no music",
  },
  {
    name: "sfx_thumb_scroll_night.mp3",
    durationSeconds: 3.4,
    promptInfluence: 0.62,
    prompt:
      "Quiet late night bedroom ambience with rapid soft smartphone touchscreen thumb swipe sounds and a subtle muffled phone vibration pulse on bedsheets, crisp realistic foley, no music",
  },
  {
    name: "sfx_card_avalanche.mp3",
    durationSeconds: 4.0,
    promptInfluence: 0.64,
    prompt:
      "Four brisk crisp overlapping thick cardstock editorial card snaps paired with sharp digital social media notification pops escalating rapidly in tempo, modern tactile foley, no music",
  },
  {
    name: "sfx_slot_machine_spin.mp3",
    durationSeconds: 4.4,
    promptInfluence: 0.66,
    prompt:
      "Classic mechanical casino slot machine lever pulled down with metallic ratchet click, fast spinning mechanical reels whirling and clicking sequentially to a halt followed by a bright brass jackpot bell ding, realistic foley, no music",
  },
  {
    name: "sfx_skinner_typewriter.mp3",
    durationSeconds: 3.2,
    promptInfluence: 0.62,
    prompt:
      "Vintage 1950s psychology laboratory mechanical tally counter clicking steadily paired with crisp manual typewriter keys clacking on archival paper, clean retro foley, no music",
  },
  {
    name: "sfx_marker_dopamine.mp3",
    durationSeconds: 3.2,
    promptInfluence: 0.60,
    prompt:
      "Thick felt tip black marker briskly slashing two bold strokes across textured paper followed by a clean ascending luminous neural spark shimmer, editorial documentary foley, no music",
  },
  {
    name: "sfx_seesaw_creak_drop.mp3",
    durationSeconds: 3.8,
    promptInfluence: 0.62,
    prompt:
      "Heavy brass laboratory balance scale tilting swiftly upward with a light glass ping then swinging down heavily onto the opposite stop with a hollow resonant metallic thud, realistic foley, no music",
  },
  {
    name: "sfx_amygdala_alarm_drain.mp3",
    durationSeconds: 4.2,
    promptInfluence: 0.62,
    prompt:
      "Tense muffled low frequency medical warning radar pulse beeping three times then gradually slowing down into an electronic battery power-down hum, crisp documentary sound design, no music",
  },
  {
    name: "sfx_zine_flip_toggle.mp3",
    durationSeconds: 3.4,
    promptInfluence: 0.62,
    prompt:
      "Crisp thick magazine zine page turning cleanly followed by a tactile smartphone toggle switch clicking off and one peaceful calm human deep breath exhale, clean modern foley, no music",
  },
  {
    name: "sfx_phone_facedown_morning.mp3",
    durationSeconds: 4.5,
    promptInfluence: 0.64,
    prompt:
      "Smartphone set firmly face down onto a solid warm wooden desk with a clean comforting thud, followed by sunlit morning window breeze, gentle distant birdsong, and a delicate ceramic coffee mug clink, realistic foley, no music",
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
  // Handle normalized numbers like "1957" expanding to multiple spoken runs
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
    // Check if this is a standalone punctuation token like "—" (em-dash)
    if (!target) {
      const prevEnd = out.length ? out[out.length - 1].end : spokenRuns[rIdx].start;
      out.push({ ...dt, start: prevEnd, end: prevEnd + 0.05 });
      if (rIdx < spokenRuns.length && !normWord(spokenRuns[rIdx].text)) rIdx++;
      continue;
    }
    // Skip any punctuation-only runs
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

    // Special case: numeric tokens (e.g. "1957") expand to Indonesian words until the next non-numeric display token matches
    if (/^\d+$/.test(target) && dIdx + 1 < displayTokens.length) {
      const nextTarget = normWord(displayTokens[dIdx + 1].spoken);
      rIdx++;
      while (
        rIdx < spokenRuns.length &&
        nextTarget &&
        !normWord(spokenRuns[rIdx].text).startsWith(nextTarget.slice(0, 3))
      ) {
        endRun = spokenRuns[rIdx];
        rIdx++;
      }
      out.push({ ...dt, start: startRun.start, end: endRun.end });
      continue;
    }

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
  // Crisp modern editorial podcast/explainer EQ for young male voice (Liam):
  // HPF 85 Hz, chest body +1.2dB @ 180 Hz, presence +2.2dB @ 3.2 kHz, de-ess -1.8dB @ 6.8 kHz
  const eq =
    "highpass=f=85,equalizer=f=180:t=q:w=1.1:g=1.2,equalizer=f=3200:t=q:w=1.3:g=2.2,equalizer=f=6800:t=q:w=1.4:g=-1.8";
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
      if (w.w === "—") continue; // keep captions crisp without floating standalone em-dash
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

async function main() {
  const client = new ElevenLabsClient();
  const audioDir = join(PROJECT, "audio");
  const voCacheDir = join(audioDir, "vo_cache");
  const sfxDir = join(audioDir, "sfx");
  const outVoWav = join(audioDir, "vo_master.wav");
  const outAlignJson = join(audioDir, "alignment.json");
  const outStoryTs = join(ROOT, "remotion/videos/doomscrolling-ep02/story.ts");
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
      // Tighten pre-onset to 0.08s so any pre-speech breath/throat-clear is trimmed cleanly without clipping consonants
      const trimLead = aligned.length ? Math.max(0, Number((aligned[0].start - 0.08).toFixed(3))) : 0;
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
        mp3Path,
      });
    }

    // Pass 2: Prepend 3.00s Group Intro Silence (Zaki, Fatir, dan Rendi), then assemble 7 scenes
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
    cueMapSec.intro_start = 0.0;
    cueMapFrame.intro_start = 0;
    cueMapSec.s1_start = INTRO_DURATION_S;
    cueMapFrame.s1_start = Math.round(INTRO_DURATION_S * FPS);
    const lastWordEnd = allWords[allWords.length - 1]?.end ?? totalVideoSec - 3.6;
    cueMapSec.s7_zine_cover = Number((lastWordEnd + 0.35).toFixed(3));
    cueMapFrame.s7_zine_cover = Math.round(cueMapSec.s7_zine_cover * FPS);

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

    console.log("\n=== 7-SCENE EDITORIAL 2D TIMING BREAKDOWN (TARGET ~02:45-02:58) ===");
    for (let s = 1; s <= 7; s++) {
      const b = sceneBoundsSec[s];
      console.log(
        `  Scene 0${s} [${b.name}]: ${b.startSec.toFixed(2)}s -> ${b.endSec.toFixed(2)}s (dur=${b.durSec.toFixed(2)}s | f=${Math.round(b.startSec * FPS)}..${Math.round(b.endSec * FPS) - 1})`
      );
    }

    const subtitleChunks = buildSubtitleChunks(allWords);
    const alignObj = {
      series: "EDUKASI KESEHATAN MENTAL — VIDEO 2",
      episode: "JEBAKAN SCROLL TANPA AKHIR: KENAPA DOOMSCROLLING BIKIN MENTAL MAKIN LELAH?",
      groupCredits: "Zaki, Fatir, dan Rendi",
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

    const storyTs = `// AUTO-GENERATED by doomscrolling-ep02/scripts/build_vo_and_sfx.mjs
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
  id: "DoomscrollingEp02Short",
  title: "Jebakan Scroll Tanpa Akhir: Kenapa Doomscrolling Bikin Mental Makin Lelah?",
  series: "EDUKASI KESEHATAN MENTAL",
  groupMembers: ["Zaki", "Fatir", "Rendi"] as const,
  width: 1080,
  height: 1920,
  fps: ${FPS},
  durationInFrames: ${totalFrames},
  durationSec: ${totalVideoSec},
  audioMasterPath: "doomscrolling-ep02/audio_master.m4a",
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

    // Step 2: Generate 10 bespoke ElevenLabs Sound-V3 tactile/digital SFX
    console.log("\n=== [2/2] Generating 10 Bespoke Tactile/Digital SFX via eleven_text_to_sound_v3 ===");
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

    console.log("\n=== ALL DOOMSCROLLING EP02 VO & BESPOKE SFX COMPLETE ===");
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
