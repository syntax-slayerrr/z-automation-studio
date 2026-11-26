/**
 * Audio-First Dual-Voice ElevenLabs eleven_v4 + 12 Bespoke Comedy SFX Generator
 * for "ClaudeAnimasiPromo" ("MASIH SUSAH BIKIN ANIMASI PAKAI CLAUDE?")
 *
 * - OpenClaw : Liam (`TX3LPaxmHKxFdv7VOQHJ`) — Energetic, panicky, playful young creator voice
 * - Hermes   : Brian (`nPczCjzI2devNBz1zQrb`) — Calm, deep, deadpan charismatic tech architect
 * - Closing  : Brian (`nPczCjzI2devNBz1zQrb`) — Clean resonant brand CTA
 * - Generates exact character-level word timings + 8 Scene boundaries + 25+ cues ->
 *     `remotion/videos/claude-animasi-promo/story.ts`
 * - Generates 12 bespoke comedy & motion-graphics SFX via `eleven_text_to_sound_v3`
 *
 * Run:
 *   node --env-file=.env claude-animasi-promo/scripts/build_vo_and_sfx.mjs
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
const OPEN_LEAD_SILENCE_S = 0.22;
const END_CARD_HOLD_S = 2.8; // Crisp 2.8s end-card hold so viewers read z-automation.my.id clearly!

const VOICES = {
  openclaw: {
    id: "TX3LPaxmHKxFdv7VOQHJ", // Liam — V1 Expressive, Energetic, Panicky Comedy Voice!
    label: "OpenClaw (Liam · V1 Expressive Energetic)",
    stability: 0.38,
    similarityBoost: 0.78,
    seed: null,
    useContextLock: false,
    cacheVer: "v3_oc_v1style",
    tempo: 1.15,
  },
  hermes: {
    id: "nPczCjzI2devNBz1zQrb", // Brian — Locked 100% Consistent Studio Voice (Snappy V1 Tempo!)
    label: "Hermes (Brian · Locked Consistent Studio Voice)",
    stability: 0.72,
    similarityBoost: 0.90,
    seed: 4242,
    useContextLock: true,
    cacheVer: "v2_locked",
    tempo: 1.10,
  },
  closing: {
    id: "nPczCjzI2devNBz1zQrb", // EXACT SAME Brian profile as Hermes so closing never sounds like a different person!
    label: "Closing (Brian · Unified Hermes Voice)",
    stability: 0.72,
    similarityBoost: 0.90,
    seed: 4242,
    useContextLock: true,
    cacheVer: "v2_locked",
    tempo: 1.07,
  },
};

// V3 Hybrid: 100% Expressive V1/V3 OpenClaw + Flowing V2 Hermes (100% Locked Consistent, Snappy Tempo, ZERO Extra API Credits!)
const LINES = [
  // SCENE 01 — EMERGENCY!
  {
    scene: 1,
    who: "openclaw",
    pauseBeforeS: 0.25,
    pauseAfterS: 0.14,
    cacheKeyOverride: "cb1d8db64dbe",
    text: "[panicked] [[s1_yell]]HERMEES! [[s1_help]]Tolongin gue dong!",
  },
  {
    scene: 1,
    who: "hermes",
    pauseBeforeS: 0.0,
    pauseAfterS: 0.42,
    text: "[[s1_calm]]Apaan sih? [[s1_fire]]Server kebakaran lagi?",
  },

  // SCENE 02 — ANIMATION DISASTER (Plays real garut-umr-10juta.mp4 on laptop!)
  {
    scene: 2,
    who: "openclaw",
    pauseBeforeS: 0.08,
    pauseAfterS: 0.10,
    cacheKeyOverride: "d7b9e411ea81",
    text: "[frustrated] [[s2_screen]]Lebih parah! Gue nyuruh Claude bikin animasi, tapi hasilnya kacau banget.",
  },
  {
    scene: 2,
    who: "openclaw",
    pauseBeforeS: 0.0,
    pauseAfterS: 0.45,
    cacheKeyOverride: "cc655ddf1e74",
    text: "[exasperated] [[s2_morph]]Karakternya gonta-ganti, [[s2_lowbat]]gerakannya kayak robot kehabisan baterai!",
  },

  // SCENE 03 — THE INTERROGATION
  {
    scene: 3,
    who: "hermes",
    pauseBeforeS: 0.26,
    pauseAfterS: 0.16,
    text: "[[s3_ask]]Bentar... emang lo nulis prompt-nya gimana?",
  },
  {
    scene: 3,
    who: "openclaw",
    pauseBeforeS: 0.0,
    pauseAfterS: 0.46,
    cacheKeyOverride: "4ad751110970",
    text: "[sheepish] [[s3_note]]Ya... Bikinin animasi yang keren.",
  },
  {
    scene: 3,
    who: "hermes",
    pauseBeforeS: 0.0,
    pauseAfterS: 0.40,
    text: "[[s3_psychic]]Lo kira Claude cenayang, bisa baca pikiran lo?",
  },
  {
    scene: 3,
    who: "openclaw",
    pauseBeforeS: 0.0,
    pauseAfterS: 0.22,
    cacheKeyOverride: "f26e0ae6db62",
    text: "[innocent] [[s3_innocent]]Lah, emang bukan?",
  },

  // SCENE 04 — THE SOLUTION
  {
    scene: 4,
    who: "hermes",
    pauseBeforeS: 0.16,
    pauseAfterS: 0.12,
    text: "[[s4_snap]]Bukan lah! Bikin animasi itu nggak cukup modal prompt pendek. [[s4_workflow]]Lo butuh skill sama workflow yang jelas.",
  },
  {
    scene: 4,
    who: "openclaw",
    pauseBeforeS: 0.0,
    pauseAfterS: 0.12,
    cacheKeyOverride: "17504e92fb65",
    text: "[curious] [[s4_ask]]Emang ada yang nyediain begituan?",
  },
  {
    scene: 4,
    who: "hermes",
    pauseBeforeS: 0.0,
    pauseAfterS: 0.36,
    text: "[[s4_card]]Ada dong. Nih, coba buka Z-Automation.",
  },

  // SCENE 05 — EDUKA & EXPLORASI (Real website + 3 Mini Worlds on laptop screen!)
  {
    scene: 5,
    who: "openclaw",
    pauseBeforeS: 0.12,
    pauseAfterS: 0.14,
    cacheKeyOverride: "319c85690731",
    text: "[excited] [[s5_eduka]]Wah! Ada Eduka sama Explorasi!",
  },
  {
    scene: 5,
    who: "hermes",
    pauseBeforeS: 0.0,
    pauseAfterS: 0.75,
    text: "[[s5_learn]]Iya, di Eduka lo bisa pahami arsitekturnya dari nol.",
  },
  {
    scene: 5,
    who: "hermes",
    pauseBeforeS: 0.0,
    pauseAfterS: 1.85,
    text: "[[s5_discover]]Nah, di Explorasi lo tinggal pilih inspirasi gaya visualnya.",
  },

  // SCENE 06 — THE REALIZATION
  {
    scene: 6,
    who: "openclaw",
    pauseBeforeS: 0.14,
    pauseAfterS: 0.12,
    cacheKeyOverride: "27d140025aed",
    text: "[bright] [[s6_back]]Jadi gue bisa belajar dulu sebelum bikin animasi?",
  },
  {
    scene: 6,
    who: "hermes",
    pauseBeforeS: 0.0,
    pauseAfterS: 0.32,
    text: "[[s6_flashback]]Betul. Biar nggak asal nyuruh AI, terus malah nyalahin hasilnya.",
  },
  {
    scene: 6,
    who: "openclaw",
    pauseBeforeS: 0.0,
    pauseAfterS: 0.14,
    cacheKeyOverride: "31fe03db9c9f",
    text: "[indignant] [[s6_offended]]Eh, nyindir gue?",
  },
  {
    scene: 6,
    who: "hermes",
    pauseBeforeS: 0.0,
    pauseAfterS: 0.26,
    text: "[[s6_smug]]Ya, kalau merasa sih...",
  },

  // SCENE 07 — HERE WE GO AGAIN
  {
    scene: 7,
    who: "openclaw",
    pauseBeforeS: 0.12,
    pauseAfterS: 0.12,
    cacheKeyOverride: "01d0d6a34cbf",
    text: "[enthusiastic] [[s7_run]]Ya udah! Gue mau bikin animasi sekarang!",
  },
  {
    scene: 7,
    who: "hermes",
    pauseBeforeS: 0.0,
    pauseAfterS: 0.22,
    text: "[[s7_proud]]Nah, gitu dong. Akhirnya paham.",
  },
  {
    scene: 7,
    who: "openclaw",
    pauseBeforeS: 0.0,
    pauseAfterS: 0.95,
    cacheKeyOverride: "2d68af69df57",
    text: "[excited] [[s7_shout]]Claude! BIKININ GUE ANIMASI!",
  },
  {
    scene: 7,
    who: "hermes",
    pauseBeforeS: 0.0,
    pauseAfterS: 0.60,
    text: "[[s7_facepalm]]Hah... mulai lagi deh.",
  },

  // SCENE 08 — CLOSING BRAND CTA (Seamless Evening -> Starry Kampung Night Timelapse!)
  {
    scene: 8,
    who: "closing",
    pauseBeforeS: 0.34,
    pauseAfterS: 0.18,
    text: "[[s8_cta]]Biar nggak kayak OpenClaw, mulai belajar dan eksplorasi di z-automation dot my dot id.",
  },
];

// Spoken display overrides (so subtitle displays clean "z-automation.my.id" while voice pronounces "z-automation dot my dot id" cleanly!)
const DISPLAY_OVERRIDES = {
  "z-automation": "z-automation.my.id",
  "dot": "",
  "my": "",
  "id.": "",
};

// 12 Bespoke Comedy & Motion-Graphics SFX via ElevenLabs `eleven_text_to_sound_v3`
const BESPOKE_SFX = [
  {
    name: "sfx_alarm_short.mp3",
    durationSeconds: 1.6,
    promptInfluence: 0.65,
    prompt: "Short urgent comical cartoon red alert siren alarm beep twice, clean punchy animation SFX, no music",
  },
  {
    name: "sfx_fast_footsteps.mp3",
    durationSeconds: 1.8,
    promptInfluence: 0.62,
    prompt: "Fast frantic cartoon character running footsteps pattering quickly with paper sheets flapping in air, crisp comedy foley, no music",
  },
  {
    name: "sfx_record_scratch.mp3",
    durationSeconds: 1.2,
    promptInfluence: 0.68,
    prompt: "Classic sudden sharp vinyl turntable record scratch abrupt comedic stop, clean punchy studio SFX, no music",
  },
  {
    name: "sfx_fire_swat.mp3",
    durationSeconds: 1.6,
    promptInfluence: 0.62,
    prompt: "Small comical cartoon flame pop ignition followed by two fast frantic hand swat whooshes extinguishing it, crisp animation SFX, no music",
  },
  {
    name: "sfx_robot_glitch_lowbat.mp3",
    durationSeconds: 3.2,
    promptInfluence: 0.64,
    prompt: "Funny malfunctioning robot digital glitch stutter then descending low battery power down tone ending in a comical mechanical thud collapse, clean SFX, no music",
  },
  {
    name: "sfx_spotlight_switch.mp3",
    durationSeconds: 1.4,
    promptInfluence: 0.65,
    prompt: "Heavy dark interrogation room overhead metallic spotlight switch snapping on loudly with subtle electrical hum, dramatic noir foley, no music",
  },
  {
    name: "sfx_dramatic_sting.mp3",
    durationSeconds: 1.8,
    promptInfluence: 0.62,
    prompt: "Short comical noir detective suspense brass and pizzicato sting accent, crisp cartoon comedy sound effect",
  },
  {
    name: "sfx_glass_shatter.mp3",
    durationSeconds: 1.8,
    promptInfluence: 0.68,
    prompt: "Bright mystical glass crystal ball shattering sharply into sparkling glass fragments on floor, crisp studio foley, no music",
  },
  {
    name: "sfx_finger_snap_morph.mp3",
    durationSeconds: 2.2,
    promptInfluence: 0.65,
    prompt: "Sharp confident human finger snap immediately followed by sleek futuristic crystalline geometric shards assembling with a clean tech whoosh, no music",
  },
  {
    name: "sfx_portal_hop.mp3",
    durationSeconds: 2.4,
    promptInfluence: 0.6,
    prompt: "Playful modern UI sparkle chime and bouncy futuristic whoosh teleport hops through digital galleries, crisp motion graphics SFX, no music",
  },
  {
    name: "sfx_keyboard_typing.mp3",
    durationSeconds: 2.6,
    promptInfluence: 0.65,
    prompt: "Fast enthusiastic office chair swivel spin followed by frantic rapid mechanical keyboard typing clicks and hard enter key slam, clean foley, no music",
  },
  {
    name: "sfx_facepalm_slap.mp3",
    durationSeconds: 1.1,
    promptInfluence: 0.68,
    prompt: "Dry comical hand slapping forehead facepalm sound with a quiet defeated sigh, clean close-up comedy foley, no music",
  },
];

function prepareLine(rawText, lineIdx) {
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
      // Pronunciation shield for ElevenLabs eleven_v4 Indonesian (keep clean spelling in displayTokens!)
      let spoken = disp;
      if (disp === "AI" || disp === "AI,") spoken = disp.endsWith(",") ? "A I," : "A I";
      if (disp === "HERMEES!") spoken = "Hermees!";
      if (disp === "GUE") spoken = "gue";
      if (disp === "BIKININ") spoken = "bikinin";
      if (disp === "ANIMASI") spoken = "animasi";
      if (disp === "ANIMASI!") spoken = "animasi!";
      if (disp === "YANG") spoken = "yang";
      if (disp === "KEREN!") spoken = "keren!";
      if (disp === "Coba" || disp === "coba") spoken = "choba";
      if (disp === "cobain") spoken = "chobain";
      if (disp === "cenayang?" || disp === "cenayang,") spoken = disp.endsWith(",") ? "chuhnayang," : "chuhnayang?";
      if (disp === "Z-Automation.") spoken = "Zet Automation.";
      if (disp === "z-automation") spoken = "zet automation";
      if (disp === "id.") spoken = "i de.";
      if (disp === "OpenClaw,") spoken = "Open Klaw,";
      const spokenCount = spoken.trim().split(/\s+/).length;
      displayTokens.push({ w: disp, cue, line: lineIdx, spokenCount });
      ttsChunks.push(spoken);
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
  const totalExpected = displayTokens.reduce((s, d) => s + (d.spokenCount ?? 1), 0);
  if (totalExpected === spokenRuns.length) {
    const out = [];
    let rIdx = 0;
    for (const dt of displayTokens) {
      const cnt = dt.spokenCount ?? 1;
      const startRun = spokenRuns[rIdx];
      const endRun = spokenRuns[Math.min(spokenRuns.length - 1, rIdx + cnt - 1)];
      out.push({ ...dt, start: startRun.start, end: endRun.end });
      rIdx += cnt;
    }
    return out;
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
    const minTake = dt.spokenCount ?? 1;
    rIdx++;
    for (let k = 1; k < minTake && rIdx < spokenRuns.length; k++) {
      acc += normWord(spokenRuns[rIdx].text);
      endRun = spokenRuns[rIdx];
      rIdx++;
    }
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

function renderVoiceWav(mp3Path, wavPath, who) {
  // Consistent studio broadcast EQ + gentle per-line loudness matching so EVERY Hermes & OpenClaw line shares identical presence!
  const eq =
    who === "openclaw"
      ? "highpass=f=95,equalizer=f=240:t=q:w=1.2:g=0.8,equalizer=f=3600:t=q:w=1.3:g=2.2,equalizer=f=6800:t=q:w=1.4:g=-1.2,loudnorm=I=-17:TP=-2.0:LRA=6:linear=true"
      : "highpass=f=75,equalizer=f=155:t=q:w=1.1:g=2.0,equalizer=f=2900:t=q:w=1.3:g=1.5,equalizer=f=6400:t=q:w=1.4:g=-1.2,loudnorm=I=-17:TP=-2.0:LRA=6:linear=true";
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
  // Collapse spoken "z-automation dot my dot id." -> single clean display token "z-automation.my.id"
  const cleanWords = [];
  for (let i = 0; i < allWords.length; i++) {
    const w = allWords[i];
    if (w.w === "z-automation" && allWords[i + 1]?.w === "dot") {
      const endTok = allWords[i + 4] ?? allWords[i + 3] ?? w;
      cleanWords.push({ ...w, w: "z-automation.my.id", end: endTok.end });
      i += 4;
      continue;
    }
    if (DISPLAY_OVERRIDES[w.w] === "") continue;
    cleanWords.push(w);
  }

  const chunks = [];
  const byLine = new Map();
  for (const w of cleanWords) {
    if (!byLine.has(w.line)) byLine.set(w.line, []);
    byLine.get(w.line).push(w);
  }

  for (const [, lineWords] of byLine.entries()) {
    let cur = [];
    for (let i = 0; i < lineWords.length; i++) {
      const w = lineWords[i];
      cur.push(w);
      const textLen = cur.map((x) => x.w).join(" ").length;
      const endsPunct = /[,.\?!]$/.test(w.w);
      const remaining = lineWords.length - 1 - i;
      const shouldBreak =
        (endsPunct && cur.length >= 2 && remaining >= 1) ||
        (cur.length >= 4 && remaining >= 2) ||
        (textLen >= 26 && cur.length >= 3 && remaining >= 1);
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
      who: chunk[0].who,
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
  const outStoryTs = join(ROOT, "remotion/videos/claude-animasi-promo/story.ts");
  const tmpBase = join(PROJECT, ".tmp");

  mkdirSync(voCacheDir, { recursive: true });
  mkdirSync(sfxDir, { recursive: true });
  mkdirSync(dirname(outStoryTs), { recursive: true });
  mkdirSync(tmpBase, { recursive: true });

  const prepared = LINES.map((ln, idx) => ({ ...ln, idx, ...prepareLine(ln.text, idx) }));
  const tmpDir = mkdtempSync(join(tmpBase, "vo-dual-"));

  try {
    console.log(`=== [1/2] Synthesizing Dual-Voice ElevenLabs ${TTS_MODEL} Dialogue (OpenClaw + Hermes) ===`);
    const concatParts = [];
    const makeSilence = (name, durSec) => {
      const p = join(tmpDir, name);
      execFileSync("ffmpeg", [
        "-y", "-loglevel", "error",
        "-f", "lavfi", "-i", `anullsrc=r=${SR}:cl=mono`,
        "-t", String(durSec), "-sample_fmt", "s16", p,
      ]);
      return p;
    };

    concatParts.push(makeSilence("sil_lead.wav", OPEN_LEAD_SILENCE_S));
    let cursorSec = OPEN_LEAD_SILENCE_S;
    const allWords = [];
    const lineSpans = [];
    const sceneStartsSec = {};

    for (let i = 0; i < prepared.length; i++) {
      const line = prepared[i];
      const vcfg = VOICES[line.who];

      if (sceneStartsSec[line.scene] === undefined) {
        sceneStartsSec[line.scene] = cursorSec;
      }

      if (line.pauseBeforeS > 0.005) {
        concatParts.push(makeSilence(`sil_pre_${i}.wav`, line.pauseBeforeS));
        cursorSec += line.pauseBeforeS;
      }

      // Keep Hermes & Closing 100% locked to audited V2 cache (`v2_locked` + same-speaker prev/next + seed 4242);
      // let OpenClaw use V1 expressive delivery (no context lock damping, expressive brackets, stability 0.38)!
      const speakerKey = line.who === "openclaw" ? "openclaw" : "hermes";
      const prevSame = vcfg.useContextLock
        ? prepared
          .slice(0, i)
          .filter((x) => (x.who === "openclaw" ? "openclaw" : "hermes") === speakerKey)
          .slice(-2)
          .map((x) => x.ttsText)
          .join(" ")
        : "";
      const nextSame = vcfg.useContextLock
        ? prepared
          .slice(i + 1)
          .filter((x) => (x.who === "openclaw" ? "openclaw" : "hermes") === speakerKey)
          .slice(0, 1)
          .map((x) => x.ttsText)
          .join(" ")
        : "";

      const cachePayload = vcfg.useContextLock
        ? {
          v: vcfg.cacheVer,
          id: vcfg.id,
          model: TTS_MODEL,
          stab: vcfg.stability,
          sim: vcfg.similarityBoost,
          seed: vcfg.seed,
          prev: prevSame,
          next: nextSame,
          text: line.ttsText,
        }
        : {
          v: vcfg.cacheVer,
          id: vcfg.id,
          model: TTS_MODEL,
          stab: vcfg.stability,
          sim: vcfg.similarityBoost,
          text: line.ttsText,
        };
      const cacheKey =
        line.cacheKeyOverride ||
        createHash("sha1").update(JSON.stringify(cachePayload)).digest("hex").slice(0, 12);
      const mp3Path = join(voCacheDir, `line_${String(i).padStart(2, "0")}_${line.who}_${cacheKey}.mp3`);
      const alignPath = join(voCacheDir, `line_${String(i).padStart(2, "0")}_${line.who}_${cacheKey}.json`);

      let alignment;
      if (existsSync(mp3Path) && existsSync(alignPath)) {
        console.log(`  [${i + 1}/${prepared.length}] CACHED S${line.scene} ${line.who.toUpperCase()}: ${line.ttsPlainNoTags}`);
        alignment = JSON.parse(readFileSync(alignPath, "utf8"));
      } else {
        console.log(`  [${i + 1}/${prepared.length}] SYNTH  S${line.scene} ${line.who.toUpperCase()}: ${line.ttsText}`);
        const reqBody = {
          text: line.ttsText,
          modelId: TTS_MODEL,
          languageCode: "id",
          outputFormat: "mp3_44100_128",
          applyTextNormalization: "on",
          voiceSettings: {
            stability: vcfg.stability,
            similarityBoost: vcfg.similarityBoost,
          },
        };
        if (vcfg.seed !== null && vcfg.seed !== undefined) reqBody.seed = vcfg.seed;
        if (prevSame) reqBody.previousText = prevSame;
        if (nextSame) reqBody.nextText = nextSame;
        const res = await client.textToSpeech.convertWithTimestamps(vcfg.id, reqBody);
        writeFileSync(mp3Path, Buffer.from(res.audioBase64, "base64"));
        alignment = res.alignment;
        writeFileSync(alignPath, JSON.stringify(alignment, null, 2));
      }

      const rawWav = join(tmpDir, `line_${i}.wav`);
      renderVoiceWav(mp3Path, rawWav, line.who);

      const spokenRuns = extractSpokenRuns(alignment);
      const aligned = alignDisplayToRuns(line.displayTokens, spokenRuns);
      const clipDur = getDurationSec(rawWav);
      // Generous 0.14s pre-onset & 0.24s tail safety margin using FULL spokenRuns so multi-word expansions NEVER clip!
      const trimLead = spokenRuns.length ? Math.max(0, Number((spokenRuns[0].start - 0.14).toFixed(3))) : 0;
      const lastEnd = spokenRuns.length ? spokenRuns[spokenRuns.length - 1].end : clipDur;
      const srcSpan = Math.max(0.16, Math.min(clipDur - trimLead, Number((lastEnd - trimLead + 0.24).toFixed(3))));
      const trimWav = join(tmpDir, `line_${i}_trim.wav`);
      const tempo = vcfg.tempo;
      execFileSync("ffmpeg", [
        "-y", "-loglevel", "error",
        "-ss", String(trimLead), "-i", rawWav, "-t", String(srcSpan),
        "-af", `atempo=${tempo},afade=t=in:st=0:d=0.008`,
        "-sample_fmt", "s16", trimWav,
      ]);
      const actualDur = getDurationSec(trimWav);
      const fadeWav = join(tmpDir, `line_${i}_fade.wav`);
      execFileSync("ffmpeg", [
        "-y", "-loglevel", "error", "-i", trimWav,
        "-af", `afade=t=out:st=${Math.max(0, actualDur - 0.015).toFixed(3)}:d=0.015`,
        "-sample_fmt", "s16", fadeWav,
      ]);

      const lineStartSec = cursorSec;
      for (const tok of aligned) {
        const sRel = Math.max(0, (tok.start - trimLead) / tempo);
        const eRel = Math.max(sRel + 0.02, (tok.end - trimLead) / tempo);
        allWords.push({
          w: tok.w,
          cue: tok.cue,
          scene: line.scene,
          who: line.who,
          line: tok.line,
          start: Number((cursorSec + sRel).toFixed(3)),
          end: Number((cursorSec + eRel).toFixed(3)),
        });
      }

      concatParts.push(fadeWav);
      cursorSec += actualDur;

      lineSpans.push({
        idx: i,
        scene: line.scene,
        who: line.who,
        startFrame: Math.round(lineStartSec * FPS),
        endFrame: Math.round(cursorSec * FPS),
      });

      if (line.pauseAfterS > 0.005) {
        concatParts.push(makeSilence(`sil_post_${i}.wav`, line.pauseAfterS));
        cursorSec += line.pauseAfterS;
      }
    }

    const concatList = join(tmpDir, "concat.txt");
    writeFileSync(concatList, concatParts.map((p) => `file '${p.replace(/\\/g, "/")}'`).join("\n"), "utf8");
    execFileSync("ffmpeg", [
      "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", concatList,
      "-af", "loudnorm=I=-16:TP=-2.0:LRA=6:linear=true",
      "-ar", String(SR), "-ac", "1", "-sample_fmt", "s16", outVoWav,
    ]);

    const voDur = getDurationSec(outVoWav);
    const totalVideoSec = Number((voDur + END_CARD_HOLD_S).toFixed(3));
    const totalFrames = Math.ceil(totalVideoSec * FPS);

    const cueMapSec = {};
    const cueMapFrame = {};
    for (const w of allWords) {
      if (w.cue) {
        cueMapSec[w.cue] = w.start;
        cueMapFrame[w.cue] = Math.round(w.start * FPS);
      }
    }

    const scenesFrame = {
      s1Start: 0,
      s2Start: Math.round(sceneStartsSec[2] * FPS),
      s3Start: Math.round(sceneStartsSec[3] * FPS),
      s4Start: Math.round(sceneStartsSec[4] * FPS),
      s5Start: Math.round(sceneStartsSec[5] * FPS),
      s6Start: Math.round(sceneStartsSec[6] * FPS),
      s7Start: Math.round(sceneStartsSec[7] * FPS),
      s8Start: Math.round(sceneStartsSec[8] * FPS),
      totalFrames,
    };

    console.log("\n=== 8-SCENE TIKTOK COMEDY TIMING BREAKDOWN ===");
    for (let s = 1; s <= 8; s++) {
      const fA = scenesFrame[`s${s}Start`];
      const fB = s < 8 ? scenesFrame[`s${s + 1}Start`] : totalFrames;
      console.log(`  Scene 0${s}: f=${fA}..${fB - 1} (${(fA / FPS).toFixed(2)}s -> ${(fB / FPS).toFixed(2)}s | dur=${((fB - fA) / FPS).toFixed(2)}s)`);
    }

    const subtitleChunks = buildSubtitleChunks(allWords);
    const alignObj = {
      voices: VOICES,
      model: TTS_MODEL,
      voDurationSec: Number(voDur.toFixed(3)),
      totalVideoSec,
      fps: FPS,
      totalFrames,
      cuesSec: cueMapSec,
      cuesFrame: cueMapFrame,
      scenesFrame,
      lineSpans,
      words: allWords,
    };
    writeFileSync(outAlignJson, JSON.stringify(alignObj, null, 2) + "\n", "utf8");

    const storyTs = `// AUTO-GENERATED by claude-animasi-promo/scripts/build_vo_and_sfx.mjs
// Source: Dual-Voice ElevenLabs ${TTS_MODEL} (OpenClaw=Liam, Hermes=Brian · ${allWords.length} words)

export type SpeakerId = "openclaw" | "hermes" | "closing";

export interface SubtitleWord {
  text: string;
  startFrame: number;
  endFrame: number;
}

export interface SubtitleChunk {
  id: string;
  scene: number;
  who: SpeakerId;
  startFrame: number;
  endFrame: number;
  words: SubtitleWord[];
}

export interface SpeechSpan {
  idx: number;
  scene: number;
  who: SpeakerId;
  startFrame: number;
  endFrame: number;
}

export const COMPOSITION_CONFIG = {
  id: "ClaudeAnimasiPromo",
  width: 1080,
  height: 1920,
  fps: ${FPS},
  durationInFrames: ${totalFrames},
  durationSec: ${totalVideoSec},
  audioMasterPath: "claude-animasi-promo/audio_master.m4a",
} as const;

export const SCENES = ${JSON.stringify(scenesFrame, null, 2)} as const;

export const CUES = ${JSON.stringify(cueMapFrame, null, 2)} as const;

export const SPEECH_SPANS: SpeechSpan[] = ${JSON.stringify(lineSpans, null, 2)};

export const SUBTITLE_CHUNKS: SubtitleChunk[] = ${JSON.stringify(subtitleChunks, null, 2)};
`;
    writeFileSync(outStoryTs, storyTs, "utf8");
    console.log(`\nVO COMPLETE -> ${outVoWav} (${voDur.toFixed(2)}s VO | ${totalVideoSec.toFixed(2)}s video / ${totalFrames} frames)`);

    // Step 2: Generate 12 bespoke comedy SFX via ElevenLabs `eleven_text_to_sound_v3`
    console.log("\n=== [2/2] Generating 12 Bespoke Comedy SFX via eleven_text_to_sound_v3 ===");
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
      console.log(`           -> saved (${getDurationSec(outPath).toFixed(2)}s)`);
    }

    console.log("\n=== ALL CLAUDE ANIMASI PROMO VO & COMEDY SFX COMPLETE ===");
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
