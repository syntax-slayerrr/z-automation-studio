/**
 * Audio-First VO & Bespoke Sound-V3 Foley Generator for "GambutHistoryShort"
 * ("GAMBUT: WARISAN RIBUAN TAHUN, API YANG TERSEMBUNYI" — ±96s, 8 scenes)
 *
 * - Primary Narrator: Brian (`nPczCjzI2devNBz1zQrb`, Warm Documentary Baritone) via ElevenLabs `eleven_v4` (`id`).
 * - Natural Documentary Tempo (`TEMPO = 1.15`) hitting ~94-98s cleanly.
 * - Indonesian Pronunciation Shield: expands `9,5`, `26`, `6.500`, `smouldering` phonetically for TTS
 *   with `applyTextNormalization: "off"` while keeping 100% verbatim display spelling & word alignment.
 * - Generates 6 bespoke geological/ecological foley SFX via ElevenLabs `eleven_text_to_sound_v3` (cached).
 *
 * Run:
 *   node --env-file=.env gambut-history/scripts/build_vo_and_sfx.mjs
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
const TEMPO = 1.16;
const OPEN_LEAD_SILENCE_S = 1.35; // Low flyover over misty peat swamp forest before narration enters
const END_TAIL_PAD_S = 3.20;      // Reflective closing title hold ("TERBENTUK SELAMA RIBUAN TAHUN...")

const NARRATOR = {
  id: "nPczCjzI2devNBz1zQrb", // Brian — Warm, Articulate Documentary Storyteller
  label: "Brian (Warm Documentary Storyteller)",
  stability: 0.52,
  similarityBoost: 0.78,
};

// Indonesian phonetic map (ONLY for TTS; display text remains 100% verbatim!)
const PHONETIC_MAP = {
  "9,5": ["sembilan", "koma", "lima"],
  "26": ["dua", "puluh", "enam"],
  "6.500": ["enam", "ribu", "lima", "ratus"],
  "smouldering": ["smoldering"],
  "api": ["api"],
};

// 100% Verbatim 8-Scene Script with exact [[cue]] storyboard anchors
const BEATS = [
  // SCENE 1 — SEJARAH YANG TERSEMBUNYI (~9s)
  {
    scene: 1,
    pauseAfterS: 0.65,
    text: "[calm] [[s1_flyover]]Sebelum menjadi sumber kebakaran, [[s1_cutaway]]sebagian tanah di Indonesia [[s1_rewind]]telah menyimpan sisa kehidupan selama puluhan ribu tahun.",
  },

  // SCENE 2 — JEJAK SEJAK 26 RIBU TAHUN LALU (~12s)
  {
    scene: 2,
    pauseAfterS: 0.65,
    text: "[steady] [[s2_map]]Di Sebangau, Kalimantan Tengah, [[s2_auger]]satu inti gambut sepanjang [[s2_core95]]9,5 meter menunjukkan bahwa akumulasi bahan organik di lokasi itu [[s2_lab26k]]telah dimulai sekitar 26 ribu tahun lalu.",
  },

  // SCENE 3 — BAGAIMANA GAMBUT TERBENTUK? (~13s)
  {
    scene: 3,
    pauseAfterS: 0.34,
    text: "[calm] [[s3_swamp]]Di lahan yang terus tergenang, [[s3_fall]]daun, akar, dan batang tumbuhan menumpuk.",
  },
  {
    scene: 3,
    pauseAfterS: 0.34,
    text: "[thoughtful] [[s3_low_o2]]Karena minim oksigen, sisa tumbuhan terurai sangat lambat.",
  },
  {
    scene: 3,
    pauseAfterS: 0.65,
    text: "[resonant] [[s3_layers]]Lapisan demi lapisan, terbentuklah gambut.",
  },

  // SCENE 4 — USIA GAMBUT TIDAK SAMA (~11s)
  {
    scene: 4,
    pauseAfterS: 0.32,
    text: "[steady] [[s4_pan]]Usia gambut berbeda di setiap wilayah.",
  },
  {
    scene: 4,
    pauseAfterS: 0.65,
    text: "[warm] [[s4_sumatra]]Di pesisir Sumatra Tengah, penelitian menunjukkan pembentukan hutan rawa gambut [[s4_compare]]telah berlangsung sekitar 6.500 tahun lalu.",
  },

  // SCENE 5 — KETIKA KESEIMBANGAN TERGANGGU (~12s)
  {
    scene: 5,
    pauseAfterS: 0.36,
    text: "[calm] [[s5_wet]]Selama ribuan tahun, air menjaga gambut tetap basah.",
  },
  {
    scene: 5,
    pauseAfterS: 0.65,
    text: "[serious tone] [[s5_canal]]Namun, ketika lahan dikeringkan melalui kanal, [[s5_waterdrop]]muka air tanah turun dan [[s5_dry]]lapisan gambut menjadi lebih mudah terbakar.",
  },

  // SCENE 6 — API MENEMBUS TANAH (~13s)
  {
    scene: 6,
    pauseAfterS: 0.34,
    text: "[serious tone] [[s6_surface]]Api dari permukaan dapat merambat ke dalam gambut.",
  },
  {
    scene: 6,
    pauseAfterS: 0.34,
    text: "[thoughtful] [[s6_underground]]Di bawah tanah, bahan organik bisa membara tanpa nyala besar.",
  },
  {
    scene: 6,
    pauseAfterS: 0.65,
    text: "[resonant] [[s6_smoulder]]Proses ini disebut smouldering.",
  },

  // SCENE 7 — KEBAKARAN YANG SULIT DIPADAMKAN (~14s)
  {
    scene: 7,
    pauseAfterS: 0.38,
    text: "[steady] [[s7_map]]Dalam eksperimen lapangan di Sumatra, [[s7_days]]gambut membara selama empat hingga sepuluh hari, [[s7_rain]]meski tiga hujan besar turun.",
  },
  {
    scene: 7,
    pauseAfterS: 0.65,
    text: "[serious tone] [[s7_persists]]Hujan di permukaan belum tentu memadamkan bara di bawahnya.",
  },

  // SCENE 8 — PENUTUP (~12s + closing title hold)
  {
    scene: 8,
    pauseAfterS: 0.38,
    text: "[thoughtful] [[s8_carbon]]Bara yang tersembunyi dapat terus melepaskan asap dan karbon.",
  },
  {
    scene: 8,
    pauseAfterS: 0.25,
    text: "[warm] [[s8_split]]Karena itu, menjaga gambut tetap basah [[s8_restore]]berarti melindungi ekosistem yang dibentuk alam [[s8_finale]]selama ribuan tahun.",
  },
];

// 6 Bespoke Geological & Ecological Foley SFX via ElevenLabs `eleven_text_to_sound_v3`
const BESPOKE_SFX = [
  {
    name: "sfx_swamp_forest_ambience.mp3",
    durationSeconds: 4.5,
    promptInfluence: 0.55,
    prompt: "Peaceful misty tropical Indonesian peat swamp forest ambience with soft breeze through tall rainforest canopy and calm gentle swamp water lapping, clean nature documentary foley, no music",
  },
  {
    name: "sfx_earth_cutaway_rumble.mp3",
    durationSeconds: 4.5,
    promptInfluence: 0.55,
    prompt: "Deep low organic subterranean earth rumble and tactile soil cutaway whoosh descending underground into dense damp peat strata, clean cinematic science documentary foley, no music",
  },
  {
    name: "sfx_peat_core_auger.mp3",
    durationSeconds: 4.5,
    promptInfluence: 0.55,
    prompt: "Manual stainless steel soil corer auger twisting smoothly into wet mossy peat earth and extracting a damp organic sediment core tube with soft squelch, crisp studio documentary foley, no music",
  },
  {
    name: "sfx_canal_drain_crack.mp3",
    durationSeconds: 4.5,
    promptInfluence: 0.55,
    prompt: "Steady water flowing rapidly out through a muddy drainage channel fading into dry desiccated earth subtly creaking and brittle dry leaves rustling, clean documentary foley, no music",
  },
  {
    name: "sfx_smouldering_embers.mp3",
    durationSeconds: 5.0,
    promptInfluence: 0.55,
    prompt: "Eerie quiet subterranean smouldering charcoal embers slowly crackling and glowing deep underground with faint wispy smoke hissing through porous soil, no roaring bonfire, clean foley, no music",
  },
  {
    name: "sfx_heavy_rain_sizzle.mp3",
    durationSeconds: 5.0,
    promptInfluence: 0.55,
    prompt: "Sudden heavy tropical rain pouring steadily onto forest canopy and wet ground while muffled hot embers quietly hiss and steam beneath the surface, clean nature documentary foley, no music",
  },
];

function expandWordForTts(disp) {
  const m = disp.match(/^([^A-Za-z0-9]*)([A-Za-z0-9.,\-]+?)([^A-Za-z0-9]*)$/);
  if (!m) return [disp];
  const [, pre, core, post] = m;
  const key = core.toLowerCase();
  if (PHONETIC_MAP[key]) {
    const arr = [...PHONETIC_MAP[key]];
    arr[0] = pre + arr[0];
    arr[arr.length - 1] = arr[arr.length - 1] + post;
    return arr;
  }
  return [disp];
}

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
      const spoken = expandWordForTts(disp);
      displayTokens.push({ w: disp, cue, line: lineIdx, spoken });
      ttsChunks.push(...spoken);
    }
  }
  return {
    displayTokens,
    ttsText: ttsChunks.join(" ").replace(/\s{2,}/g, " ").trim(),
    ttsPlainNoTags: displayTokens.map((x) => x.spoken.join(" ")).join(" ").replace(/\s{2,}/g, " ").trim(),
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
  const out = [];
  let rIdx = 0;
  for (let dIdx = 0; dIdx < displayTokens.length; dIdx++) {
    const dt = displayTokens[dIdx];
    const expectedConcat = dt.spoken.map(normWord).join("");
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
      acc.length < expectedConcat.length &&
      expectedConcat.startsWith(acc + normWord(spokenRuns[rIdx].text))
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
    ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", filePath],
    { encoding: "utf8" }
  ).trim();
  return Number.parseFloat(out);
}

function renderCleanNarratorWav(mp3Path, wavPath) {
  const eq = "highpass=f=75,equalizer=f=155:t=q:w=1.1:g=1.4,equalizer=f=3000:t=q:w=1.3:g=1.3,equalizer=f=6200:t=q:w=1.4:g=-1.0";
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
      const endsPunct = /[,.\?!]$/.test(w.w);
      const remaining = lineWords.length - 1 - i;
      const shouldBreak =
        (endsPunct && cur.length >= 3 && remaining >= 2) ||
        (cur.length >= 6 && remaining >= 2) ||
        (textLen >= 34 && cur.length >= 4 && remaining >= 2);
      if (shouldBreak) {
        chunks.push(cur);
        cur = [];
      }
    }
    if (cur.length) chunks.push(cur);

    for (const chunk of chunks) {
      const fullStr = chunk.map((x) => x.w).join(" ");
      let lines;
      if (fullStr.length <= 24 || chunk.length <= 3) {
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
      const endFrame = Math.round(chunk[chunk.length - 1].end * FPS) + 6;
      const highlights = chunk.map((w, idx) => {
        const sf = Math.max(startFrame, Math.round(w.start * FPS));
        const nextStart = idx + 1 < chunk.length ? Math.round(chunk[idx + 1].start * FPS) - 1 : endFrame;
        const ef = Math.max(sf, Math.min(endFrame, Math.max(Math.round(w.end * FPS), nextStart)));
        return [sf, ef, idx];
      });

      cards.push({
        scene: chunk[0].scene,
        startFrame,
        endFrame,
        lines,
        highlights,
      });
    }
  }

  for (let i = 0; i < cards.length - 1; i++) {
    if (cards[i].endFrame >= cards[i + 1].startFrame) {
      cards[i].endFrame = Math.max(cards[i].startFrame + 2, cards[i + 1].startFrame - 2);
      for (const h of cards[i].highlights) {
        h[1] = Math.min(h[1], cards[i].endFrame);
      }
    }
  }
  return cards;
}

async function saveStreamToFile(streamObj, outPath) {
  const ws = createWriteStream(outPath);
  if (typeof streamObj?.getReader === "function") {
    await finished(Readable.fromWeb(streamObj).pipe(ws));
  } else {
    await finished(Readable.from(streamObj).pipe(ws));
  }
}

async function main() {
  const client = new ElevenLabsClient();
  const audioDir = join(PROJECT, "audio");
  const voCacheDir = join(audioDir, "vo_cache");
  const sfxDir = join(audioDir, "sfx");
  const outVoWav = join(audioDir, "vo_master.wav");
  const outAlignJson = join(audioDir, "alignment.json");
  const outStoryTs = join(ROOT, "remotion/videos/gambut-history/story.ts");
  const tmpBase = join(PROJECT, ".tmp");

  mkdirSync(voCacheDir, { recursive: true });
  mkdirSync(sfxDir, { recursive: true });
  mkdirSync(dirname(outStoryTs), { recursive: true });
  mkdirSync(tmpBase, { recursive: true });

  const prepared = BEATS.map((b, idx) => ({ ...b, idx, ...prepareBeat(b.text, idx) }));
  const tmpDir = mkdtempSync(join(tmpBase, "vo-build-"));

  try {
    console.log(`=== [1/2] Synthesizing ElevenLabs v4 Narrator VO (Brian, Tempo ${TEMPO}x, Pronunciation Shield ON) ===`);
    const concatParts = [];
    const leadSil = join(tmpDir, "sil_lead.wav");
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "lavfi", "-i", `anullsrc=r=${SR}:cl=mono`, "-t", String(OPEN_LEAD_SILENCE_S), "-sample_fmt", "s16", leadSil]);
    concatParts.push(leadSil);

    let cursorSec = OPEN_LEAD_SILENCE_S;
    const allWords = [];

    for (let i = 0; i < prepared.length; i++) {
      const beat = prepared[i];
      const prev = i > 0 ? prepared[i - 1] : null;
      const next = i + 1 < prepared.length ? prepared[i + 1] : null;

      const cacheKey = createHash("sha1")
        .update(JSON.stringify({ id: NARRATOR.id, model: TTS_MODEL, stab: NARRATOR.stability, sim: NARRATOR.similarityBoost, text: beat.ttsText, prev: prev?.ttsPlainNoTags ?? "", next: next?.ttsPlainNoTags ?? "", norm: "off" }))
        .digest("hex")
        .slice(0, 12);
      const mp3Path = join(voCacheDir, `beat_${String(i).padStart(2, "0")}_${cacheKey}.mp3`);
      const alignPath = join(voCacheDir, `beat_${String(i).padStart(2, "0")}_${cacheKey}.json`);

      let alignment;
      if (existsSync(mp3Path) && existsSync(alignPath)) {
        console.log(`  [${i + 1}/${prepared.length}] CACHED S${beat.scene}: ${beat.displayTokens.map((x) => x.w).join(" ")}`);
        alignment = JSON.parse(readFileSync(alignPath, "utf8"));
      } else {
        console.log(`  [${i + 1}/${prepared.length}] SYNTH  S${beat.scene}: ${beat.ttsText}`);
        const res = await client.textToSpeech.convertWithTimestamps(NARRATOR.id, {
          text: beat.ttsText,
          modelId: TTS_MODEL,
          languageCode: "id",
          outputFormat: "mp3_44100_128",
          applyTextNormalization: "off",
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
      const trimLead = aligned.length ? Math.max(0, Number((aligned[0].start - 0.025).toFixed(3))) : 0;
      const lastEnd = aligned.length ? aligned[aligned.length - 1].end : clipDur;
      const srcSpan = Math.max(0.12, Math.min(clipDur - trimLead, Number((lastEnd - trimLead + 0.12).toFixed(3))));
      const trimWav = join(tmpDir, `beat_${i}_trim.wav`);
      const afChain = TEMPO === 1.0 ? "afade=t=in:st=0:d=0.008" : `atempo=${TEMPO},afade=t=in:st=0:d=0.008`;
      execFileSync("ffmpeg", [
        "-y", "-loglevel", "error", "-ss", String(trimLead), "-i", rawWav, "-t", String(srcSpan),
        "-af", afChain,
        "-sample_fmt", "s16", trimWav,
      ]);
      const actualDur = getDurationSec(trimWav);
      const fadeWav = join(tmpDir, `beat_${i}_fade.wav`);
      execFileSync("ffmpeg", [
        "-y", "-loglevel", "error", "-i", trimWav,
        "-af", `afade=t=out:st=${Math.max(0, actualDur - 0.015).toFixed(3)}:d=0.015`,
        "-sample_fmt", "s16", fadeWav,
      ]);

      for (const tok of aligned) {
        const sRel = Math.max(0, (tok.start - trimLead) / TEMPO);
        const eRel = Math.max(sRel + 0.02, (tok.end - trimLead) / TEMPO);
        allWords.push({
          w: tok.w,
          cue: tok.cue,
          scene: beat.scene,
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
    }

    const concatList = join(tmpDir, "concat.txt");
    writeFileSync(concatList, concatParts.map((p) => `file '${p.replace(/\\/g, "/")}'`).join("\n"), "utf8");
    execFileSync("ffmpeg", [
      "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", concatList,
      "-af", "loudnorm=I=-16:TP=-2.0:LRA=6:linear=true",
      "-ar", String(SR), "-ac", "1", "-sample_fmt", "s16", outVoWav,
    ]);

    const voDur = getDurationSec(outVoWav);
    const totalVideoSec = Number((voDur + END_TAIL_PAD_S).toFixed(3));
    const totalFrames = Math.ceil(totalVideoSec * FPS);

    const cueMapSec = {};
    const cueMapFrame = {};
    const sceneStartsSec = {};
    for (const w of allWords) {
      if (w.cue) {
        cueMapSec[w.cue] = w.start;
        cueMapFrame[w.cue] = Math.round(w.start * FPS);
      }
      if (sceneStartsSec[w.scene] === undefined) {
        sceneStartsSec[w.scene] = w.start;
      }
    }
    const scenesFrame = {
      s1Start: 0,
      s2Start: Math.max(0, Math.round((sceneStartsSec[2] - 0.35) * FPS)),
      s3Start: Math.max(0, Math.round((sceneStartsSec[3] - 0.35) * FPS)),
      s4Start: Math.max(0, Math.round((sceneStartsSec[4] - 0.35) * FPS)),
      s5Start: Math.max(0, Math.round((sceneStartsSec[5] - 0.35) * FPS)),
      s6Start: Math.max(0, Math.round((sceneStartsSec[6] - 0.35) * FPS)),
      s7Start: Math.max(0, Math.round((sceneStartsSec[7] - 0.35) * FPS)),
      s8Start: Math.max(0, Math.round((sceneStartsSec[8] - 0.35) * FPS)),
      totalFrames,
    };

    const starts = [
      scenesFrame.s1Start,
      scenesFrame.s2Start,
      scenesFrame.s3Start,
      scenesFrame.s4Start,
      scenesFrame.s5Start,
      scenesFrame.s6Start,
      scenesFrame.s7Start,
      scenesFrame.s8Start,
      totalFrames,
    ];
    console.log(`\n=== SCENE TIMING BREAKDOWN (Tempo ${TEMPO}x) ===`);
    for (let s = 1; s <= 8; s++) {
      const durS = ((starts[s] - starts[s - 1]) / FPS).toFixed(2);
      console.log(`  Scene ${s}: f=${starts[s - 1]}..${starts[s] - 1} (${(starts[s - 1] / FPS).toFixed(2)}s -> ${(starts[s] / FPS).toFixed(2)}s | dur=${durS}s)`);
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
      scenesFrame,
      words: allWords,
    };
    writeFileSync(outAlignJson, JSON.stringify(alignObj, null, 2) + "\n", "utf8");

    const storyTs = `// AUTO-GENERATED by gambut-history/scripts/build_vo_and_sfx.mjs from ElevenLabs eleven_v4 character timestamps.
// Do not edit timings by hand — re-run the generator to resync.

export interface SubtitleCardSpec {
  scene: number;
  startFrame: number;
  endFrame: number;
  lines: string[];
  highlights: Array<[number, number, number]>;
}

export const GAMBUT_FPS = ${FPS};
export const GAMBUT_FRAMES = ${totalFrames};
export const GAMBUT_DURATION_SEC = ${totalVideoSec};

export const SCENES = ${JSON.stringify(scenesFrame, null, 2)} as const;

export const CUES = ${JSON.stringify(cueMapFrame, null, 2)} as const;

export const CUES_SEC = ${JSON.stringify(cueMapSec, null, 2)} as const;

export const SUBTITLE_CARDS: SubtitleCardSpec[] = ${JSON.stringify(subtitleCards, null, 2)};
`;
    writeFileSync(outStoryTs, storyTs, "utf8");
    console.log(`\nVO COMPLETE -> ${outVoWav} (${voDur.toFixed(2)}s VO, ${totalVideoSec.toFixed(2)}s video / ${totalFrames} frames, ${allWords.length} words, ${Object.keys(cueMapFrame).length} cues, ${subtitleCards.length} cards)`);

    console.log(`\n=== [2/2] Generating 6 Bespoke Geological/Ecological Foley SFX (${SFX_MODEL}) ===`);
    for (let i = 0; i < BESPOKE_SFX.length; i++) {
      const sfx = BESPOKE_SFX[i];
      const outPath = join(sfxDir, sfx.name);
      if (existsSync(outPath)) {
        console.log(`  [${i + 1}/${BESPOKE_SFX.length}] CACHED ${sfx.name}`);
        continue;
      }
      console.log(`  [${i + 1}/${BESPOKE_SFX.length}] SYNTH  ${sfx.name} (${sfx.durationSeconds}s)`);
      const stream = await client.textToSoundEffects.convert({
        text: sfx.prompt,
        durationSeconds: sfx.durationSeconds,
        promptInfluence: sfx.promptInfluence,
        modelId: SFX_MODEL,
      });
      await saveStreamToFile(stream, outPath);
    }
    console.log("=== ALL VO & BESPOKE SFX READY ===");
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
