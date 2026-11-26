import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const ROOT = "d:/PROJECTS/z-automation-studio";
const PROJ = path.join(ROOT, "kamojang-vs-nuklir");
const AUDIO_DIR = path.join(PROJ, "audio_v2");
const SFX_DIR = path.join(AUDIO_DIR, "sfx");
const STORY_OUT = path.join(ROOT, "remotion/videos/kamojang-vs-nuklir/story.ts");

fs.mkdirSync(SFX_DIR, { recursive: true });
fs.mkdirSync(path.dirname(STORY_OUT), { recursive: true });

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error("Missing ELEVENLABS_API_KEY in .env!");
  process.exit(1);
}

// Liam — Energetic Social Media Creator + eleven_multilingual_v2 = rock-solid consistent single-take Indonesian!
const VOICE_ID = "TX3LPaxmHKxFdv7VOQHJ";
const MODEL_ID = "eleven_multilingual_v2";
const FPS = 30;
const LEAD_SILENCE_SEC = 0.35;
const TAIL_SILENCE_SEC = 2.8;

/**
 * 100% SINGLE-TAKE INDONESIAN TIKTOK SCRIPT (~78s, 200 words, ~1,370 chars)
 * ZERO per-sentence slicing -> 0% chance of cut-off words & 100% consistent voice, pitch, and flow!
 * ZERO bracketed emotion tags -> natural conversational punctuation rhythm!
 */
const FULL_SCRIPT = [
  "Tau nggak? Pembangkit nuklir tercanggih di dunia, dan pembangkit panas bumi di Garut, ternyata cara kerjanya persis kayak teko air mendidih di dapur kamu. Keduanya cuma bikin uap, buat muter kincir raksasa.",
  "Bedanya cuma di kompornya. Di Kamojang, Garut, kompornya ada jauh di bawah gunung. Bukan lahar yang disedot ke atas, tapi uap panas alami yang terjebak di celah batu, lalu dialirkan lewat pipa baja.",
  "Tapi uap dari bumi itu masih kotor. Ada kerikil dan tetesan airnya. Makanya sebelum masuk mesin, uapnya diputar di tabung penyaring dulu, sampai tinggal uap kering yang bersih.",
  "Nah, kalau nuklir? Kompornya adalah atom uranium yang ditembak sampai terbelah. Panasnya gila-gilaan, dan dikendalikan pakai batang penyerap biar nggak kebablasan. Hebatnya, air radioaktif di dalam reaktor dikunci mati, nggak pernah nyampur. Cuma panasnya aja yang dipakai mendidihkan air bersih di tangki sebelahnya.",
  "Begitu uapnya jadi, sisanya persis sama. Uap kencang meniup baling-baling turbin, memutar magnet raksasa di dalam lilitan tembaga, dan jadilah listrik yang nyalain lampu dan HP kamu sekarang.",
  "Terus, mana yang lebih aman? Panas bumi jelas bebas radiasi nuklir, tapi tetap punya risiko gas beracun dan tekanan pipa tinggi. Sedangkan nuklir dikurung empat lapis baja dan beton tebal, karena sekali bocor dampaknya jauh lebih luas. Intinya satu: kita nggak perlu membakar apa pun buat bikin listrik. Cukup pintar mengolah panas.",
].join("\n\n");

// Display-friendly subtitle words match spoken words 1:1 (only tiny "HP" -> "hape" phonetic hint avoided because multilingual_v2 reads "HP" or "ponsel" cleanly; let's use "ponsel" in both script & display so pronunciation is 100% native Indonesian!)
const FINAL_SCRIPT = FULL_SCRIPT.replace("dan HP kamu sekarang", "dan ponsel kamu sekarang");

// Scene anchor indices (word-level exact match to split scenes cleanly on real spoken boundaries!)
const SCENE_ANCHORS = [
  { scene: 1, match: "Tau" },
  { scene: 2, match: "Bedanya" },
  { scene: 3, match: "Tapi" },
  { scene: 4, match: "Nah," },
  { scene: 5, match: "Begitu" },
  { scene: 6, match: "Terus," },
];

const CUE_ANCHORS = [
  { key: "s1_kettle", match: "teko" },
  { key: "s1_pinwheel", match: "kincir" },
  { key: "s2_kamojang", match: "Kamojang," },
  { key: "s2_not_magma", match: "Bukan" },
  { key: "s2_pipe", match: "pipa" },
  { key: "s3_dirty", match: "kotor." },
  { key: "s3_filter", match: "penyaring" },
  { key: "s4_atom", match: "atom" },
  { key: "s4_brake", match: "batang" },
  { key: "s4_locked", match: "Hebatnya," },
  { key: "s4_clean_boil", match: "mendidihkan" },
  { key: "s5_turbine", match: "turbin," },
  { key: "s5_magnet", match: "magnet" },
  { key: "s5_phone", match: "lampu" },
  { key: "s6_safe_q", match: "Terus," },
  { key: "s6_geo_risk", match: "beracun" },
  { key: "s6_nuc_layers", match: "empat" },
  { key: "s6_closing", match: "Intinya" },
];

async function fetchWithRetry(url, opts, label) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, opts);
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`HTTP ${res.status}: ${body.slice(0, 260)}`);
      }
      return res;
    } catch (err) {
      if (attempt === 4) throw err;
      const wait = attempt * 2200;
      console.log(`  [RETRY ${attempt}/3] ${label}: ${err.message}`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

function probeDuration(filePath) {
  const out = execFileSync("ffprobe", [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "csv=p=0",
    filePath,
  ], { encoding: "utf8" }).trim();
  return parseFloat(out);
}

function extractWordsFromAlignment(alignment, offsetSec) {
  const chars = alignment.characters || [];
  const starts = alignment.character_start_times_seconds || [];
  const ends = alignment.character_end_times_seconds || [];
  const words = [];
  let cur = "";
  let s0 = null;
  let e0 = null;

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (/\s/.test(ch)) {
      if (cur.length > 0) {
        words.push({ text: cur, startSec: s0 + offsetSec, endSec: e0 + offsetSec });
        cur = "";
        s0 = null;
        e0 = null;
      }
    } else {
      if (s0 === null) s0 = starts[i];
      e0 = ends[i];
      cur += ch;
    }
  }
  if (cur.length > 0) {
    words.push({ text: cur, startSec: s0 + offsetSec, endSec: e0 + offsetSec });
  }
  return words;
}

async function main() {
  const hash = crypto.createHash("sha1").update(`${VOICE_ID}|${MODEL_ID}|${FINAL_SCRIPT}`).digest("hex").slice(0, 12);
  const rawMp3 = path.join(AUDIO_DIR, `singletake_${hash}.mp3`);
  const rawJson = path.join(AUDIO_DIR, `singletake_${hash}.json`);

  let alignment;
  if (fs.existsSync(rawMp3) && fs.existsSync(rawJson)) {
    console.log(`=== [1/2] Reusing Cached Single-Take VO (${FINAL_SCRIPT.length} chars) ===`);
    alignment = JSON.parse(fs.readFileSync(rawJson, "utf8"));
  } else {
    console.log(`=== [1/2] Generating ONE Continuous Single-Take VO via ElevenLabs ${MODEL_ID} (Liam, ${FINAL_SCRIPT.length} chars) ===`);
    const res = await fetchWithRetry(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/with-timestamps?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: FINAL_SCRIPT,
          model_id: MODEL_ID,
          voice_settings: {
            stability: 0.65,
            similarity_boost: 0.80,
            style: 0.14,
            use_speaker_boost: true,
            speed: 1.04,
          },
        }),
      },
      "singletake_vo",
    );
    const data = await res.json();
    fs.writeFileSync(rawMp3, Buffer.from(data.audio_base64, "base64"));
    alignment = data.alignment;
    fs.writeFileSync(rawJson, JSON.stringify(alignment, null, 2));
    console.log(`  [OK] Saved raw single-take MP3 -> ${rawMp3}`);
  }

  // Wrap raw single-take MP3 with clean lead & tail silence ONLY (ZERO internal slicing, ZERO atempo!)
  const rawDur = probeDuration(rawMp3);
  const voMaster = path.join(AUDIO_DIR, "vo_master.wav");
  execFileSync("ffmpeg", [
    "-y",
    "-i", rawMp3,
    "-af", `adelay=${Math.round(LEAD_SILENCE_SEC * 1000)}|${Math.round(LEAD_SILENCE_SEC * 1000)},apad=pad_dur=${TAIL_SILENCE_SEC}`,
    "-ac", "1", "-ar", "48000", "-c:a", "pcm_s16le",
    voMaster,
  ], { stdio: "ignore" });

  const totalDurSec = probeDuration(voMaster);
  const totalFrames = Math.round(totalDurSec * FPS);
  const words = extractWordsFromAlignment(alignment, LEAD_SILENCE_SEC);

  // Resolve exact scene start frames from spoken word anchors
  const sceneWordIdx = {};
  let searchFrom = 0;
  for (const sa of SCENE_ANCHORS) {
    const idx = words.findIndex((w, i) => i >= searchFrom && w.text === sa.match);
    if (idx === -1) throw new Error(`Anchor word not found for scene ${sa.scene}: ${sa.match}`);
    sceneWordIdx[sa.scene] = idx;
    searchFrom = idx + 1;
  }

  // Assign scene numbers & frames to each word
  const timedWords = words.map((w, i) => {
    let sc = 1;
    for (let s = 1; s <= 6; s++) {
      if (i >= sceneWordIdx[s]) sc = s;
    }
    const sf = Math.round(w.startSec * FPS);
    const ef = Math.max(sf + 2, Math.round(w.endSec * FPS));
    return { ...w, scene: sc, startFrame: sf, endFrame: ef };
  });

  const scenesObj = {
    scene1Start: 0,
    scene2Start: Math.max(1, timedWords[sceneWordIdx[2]].startFrame - 3),
    scene3Start: Math.max(1, timedWords[sceneWordIdx[3]].startFrame - 3),
    scene4Start: Math.max(1, timedWords[sceneWordIdx[4]].startFrame - 3),
    scene5Start: Math.max(1, timedWords[sceneWordIdx[5]].startFrame - 3),
    scene6Start: Math.max(1, timedWords[sceneWordIdx[6]].startFrame - 3),
    closingCardStart: Math.max(1, totalFrames - Math.round(3.4 * FPS)),
    totalFrames,
  };

  // Resolve exact cues monotonically across the single take
  const cuesSec = {};
  const cuesFrames = {};
  let cueSearch = 0;
  for (const ca of CUE_ANCHORS) {
    const idx = timedWords.findIndex((w, i) => i >= cueSearch && w.text.toLowerCase() === ca.match.toLowerCase());
    const found = idx >= 0 ? idx : timedWords.findIndex((w, i) => i >= cueSearch && w.text.toLowerCase().includes(ca.match.toLowerCase()));
    if (found === -1) throw new Error(`Cue word not found: ${ca.key} (${ca.match})`);
    cuesSec[ca.key] = Number(timedWords[found].startSec.toFixed(3));
    cuesFrames[ca.key] = timedWords[found].startFrame;
    cueSearch = found + 1;
  }

  // Build clean 3-5 word TikTok karaoke subtitle chunks
  const subtitleChunks = [];
  let cur = [];
  let cId = 1;
  const flush = () => {
    if (!cur.length) return;
    subtitleChunks.push({
      id: `sub_${String(cId++).padStart(3, "0")}`,
      scene: cur[0].scene,
      startFrame: Math.max(0, cur[0].startFrame - 1),
      endFrame: cur[cur.length - 1].endFrame + 3,
      words: cur.map((x) => ({ text: x.text, startFrame: x.startFrame, endFrame: x.endFrame })),
    });
    cur = [];
  };
  for (const w of timedWords) {
    if (cur.length > 0 && cur[0].scene !== w.scene) flush();
    cur.push(w);
    const charLen = cur.reduce((a, b) => a + b.text.length + 1, 0);
    if (/[.!?:,]$/.test(w.text) && cur.length >= 2) flush();
    else if (cur.length >= 5 || charLen >= 28) flush();
  }
  flush();

  fs.writeFileSync(
    path.join(AUDIO_DIR, "alignment.json"),
    JSON.stringify({
      durationSec: Number(totalDurSec.toFixed(3)),
      rawVoSec: Number(rawDur.toFixed(3)),
      totalFrames,
      fps: FPS,
      wordCount: timedWords.length,
      scenes: scenesObj,
      cuesSec,
      cuesFrames,
    }, null, 2),
  );

  const storyTs = `// AUTO-GENERATED by kamojang-vs-nuklir/scripts/build_vo_v2_singletake.mjs
// Source: ElevenLabs ${MODEL_ID} SINGLE-TAKE (Liam — 0 internal cuts, ${timedWords.length} words)

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
  id: "KamojangVsNuklirShort",
  width: 1080,
  height: 1920,
  fps: ${FPS},
  durationInFrames: ${totalFrames},
  durationSec: ${Number(totalDurSec.toFixed(3))},
  audioMasterPath: "kamojang-vs-nuklir/audio_master_v2.m4a",
} as const;

export const SCENES = ${JSON.stringify(scenesObj, null, 2)} as const;

export const CUES = ${JSON.stringify(cuesFrames, null, 2)} as const;

export const CUES_SEC = ${JSON.stringify(cuesSec, null, 2)} as const;

export const SUBTITLE_CHUNKS: SubtitleChunk[] = ${JSON.stringify(subtitleChunks, null, 2)};
`;
  fs.writeFileSync(STORY_OUT, storyTs);

  console.log(`\n=== 6-SCENE V2 TIKTOK TIMING BREAKDOWN (Single-Take, ZERO Slicing!) ===`);
  for (let s = 1; s <= 6; s++) {
    const sf = scenesObj[`scene${s}Start`];
    const ef = s < 6 ? scenesObj[`scene${s + 1}Start`] - 1 : totalFrames - 1;
    console.log(`  Scene ${s}: f=${sf}..${ef} (${(sf / FPS).toFixed(2)}s -> ${((ef + 1) / FPS).toFixed(2)}s | dur=${((ef - sf + 1) / FPS).toFixed(2)}s)`);
  }
  console.log(`VO MASTER COMPLETE -> ${voMaster} (raw=${rawDur.toFixed(2)}s | total=${totalDurSec.toFixed(2)}s / ${totalFrames} frames, ${timedWords.length} words)`);

  // Step 2: Generate 1 bespoke Kettle Boiling & Steam Whistle SFX via eleven_text_to_sound_v3
  const kettleSfx = path.join(SFX_DIR, "sfx_kettle_boil_steam.mp3");
  if (!fs.existsSync(kettleSfx)) {
    console.log(`\n=== [2/2] Generating Bespoke Kettle Boiling Steam SFX ===`);
    const res = await fetchWithRetry(
      "https://api.elevenlabs.io/v1/sound-generation",
      {
        method: "POST",
        headers: { "xi-api-key": API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "Kitchen stovetop metal water kettle boiling vigorously with pressurized white steam hissing cleanly out of the spout, warm crisp foley, no music",
          duration_seconds: 4.0,
          prompt_influence: 0.45,
          model_id: "eleven_text_to_sound_v3",
        }),
      },
      "kettle_sfx",
    );
    fs.writeFileSync(kettleSfx, Buffer.from(await res.arrayBuffer()));
    console.log(`  [OK] ${kettleSfx}`);
  }
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
