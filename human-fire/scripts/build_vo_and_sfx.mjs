/**
 * Audio-First VO & Bespoke SFX Generator for "HumanFireShort" ("Ketika Manusia Mengenal Api")
 *
 * - Primary Narrator: Brian (`nPczCjzI2devNBz1zQrb`, Warm Documentary Baritone) via ElevenLabs `eleven_v4` (`id`).
 * - Natural Documentary Tempo (`TEMPO = 1.00` — NOT rushed! Follows natural ~100s 7-scene pacing with breathing holds).
 * - Character-level timestamps (`convertWithTimestamps`) extract exact millisecond timing for every word
 *   and all 28 storyboard [[cue]] anchors.
 * - Generates 9 bespoke cinema-grade SFX via ElevenLabs `eleven_text_to_sound_v3` (cached by filename).
 * - Outputs:
 *     1. `human-fire/audio/vo_master.wav` (cleanly EQ'd & level-normalized 44.1 kHz mono narration stem)
 *     2. `human-fire/audio/sfx/*.mp3` (9 bespoke ElevenLabs Sound-V3 clips)
 *     3. `human-fire/audio/alignment.json` (full word + cue + scene timing data)
 *     4. `remotion/videos/human-fire/story.ts` (typed Remotion timeline, cues & deckle-edge parchment subtitle cards)
 *
 * Run:
 *   node --env-file=.env human-fire/scripts/build_vo_and_sfx.mjs
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
const TEMPO = 1.14; // Gentle natural documentary cadence (~1.9 w/s, NOT rushed — hits exact ±100s script pacing!)
const OPEN_LEAD_SILENCE_S = 0.28;
const END_TAIL_PAD_S = 2.60; // Serene hold for final title card: "Sebuah Nyala Kecil, Mengubah Peradaban."

const NARRATOR = {
  id: "nPczCjzI2devNBz1zQrb", // Brian — Warm, Resonant Documentary Baritone
  label: "Brian (Warm Documentary Baritone)",
  stability: 0.52,
  similarityBoost: 0.78,
};

// 22 verbatim Indonesian documentary beats across Scenes 1..7 with 28 [[cue]] storyboard anchors.
const BEATS = [
  // SCENE 1 — DUNIA SEBELUM API (~12-13s)
  {
    scene: 1,
    pauseAfterS: 0.25,
    text: "[calm] [[s1_forest]]Ratusan ribu tahun lalu, kehidupan manusia jauh berbeda.",
  },
  {
    scene: 1,
    pauseAfterS: 0.28,
    text: "[thoughtful] Tidak ada lampu, tidak ada kompor. Ketika [[s1_sunset]]malam tiba, kegelapan dan dingin menjadi ancaman.",
  },
  {
    scene: 1,
    pauseAfterS: 0.50,
    text: "[serious tone] [[s1_predator]]Manusia harus bertahan hidup dengan [[s1_cave]]mengandalkan alam.",
  },

  // SCENE 2 — AWAL MENGENAL API (~14-15s)
  {
    scene: 2,
    pauseAfterS: 0.45,
    text: "[serious tone] [[s2_clouds]]Hingga suatu saat, [[s2_lightning]]petir menyambar pohon dan menciptakan kebakaran.",
  },
  {
    scene: 2,
    pauseAfterS: 0.28,
    text: "[thoughtful] [[s2_observe]]Manusia mulai mengenal api dari fenomena alam.",
  },
  {
    scene: 2,
    pauseAfterS: 0.55,
    text: "[warm] Awalnya menakutkan, tetapi mereka menyadari bahwa [[s2_approach]]api dapat memberikan cahaya dan kehangatan.",
  },

  // SCENE 3 — API MENGUBAH MAKANAN (~14-15s)
  {
    scene: 3,
    pauseAfterS: 0.24,
    text: "[calm] [[s3_hunt]]Manusia kemudian belajar memanfaatkan dan mengendalikan api.",
  },
  {
    scene: 3,
    pauseAfterS: 0.28,
    text: "[steady] Mereka mulai [[s3_roast]]memasak makanan, termasuk daging hasil buruan.",
  },
  {
    scene: 3,
    pauseAfterS: 0.52,
    text: "[warm] Memasak membuat banyak makanan [[s3_cooked]]lebih mudah dicerna dan membantu mengurangi mikroorganisme [[s3_enjoy]]berbahaya.",
  },

  // SCENE 4 — MALAM MENJADI LEBIH AMAN (~13s)
  {
    scene: 4,
    pauseAfterS: 0.22,
    text: "[calm] [[s4_campfire]]Api juga mengubah kehidupan malam.",
  },
  {
    scene: 4,
    pauseAfterS: 0.28,
    text: "[warm] [[s4_glow]]Cahayanya menerangi kegelapan, panasnya menghangatkan tubuh, dan kehadirannya dapat membantu [[s4_retreat]]menjauhkan sebagian hewan liar.",
  },
  {
    scene: 4,
    pauseAfterS: 0.48,
    text: "[thoughtful] [[s4_warm]]Malam tidak lagi sepenuhnya menjadi ancaman.",
  },

  // SCENE 5 — KEHIDUPAN SOSIAL BERKEMBANG (~14s)
  {
    scene: 5,
    pauseAfterS: 0.24,
    text: "[warm] [[s5_gather]]Di sekitar api, manusia mulai memiliki lebih banyak kesempatan untuk berkumpul.",
  },
  {
    scene: 5,
    pauseAfterS: 0.28,
    text: "[thoughtful] Mereka [[s5_story]]berbagi pengalaman, berkomunikasi, dan [[s5_teach]]mewariskan pengetahuan.",
  },
  {
    scene: 5,
    pauseAfterS: 0.52,
    fixApiPronunciation: true,
    text: "[calm] Api turut menjadi bagian penting dalam perkembangan [[s5_wide]]kehidupan sosial manusia.",
  },

  // SCENE 6 — MENUJU PERADABAN (~16s)
  {
    scene: 6,
    pauseAfterS: 0.24,
    text: "[steady] [[s6_clay]]Seiring waktu, pemanfaatan api semakin berkembang.",
  },
  {
    scene: 6,
    pauseAfterS: 0.30,
    text: "[serious tone] Manusia menggunakannya untuk [[s6_kiln]]membuat keramik, [[s6_metal]]mengolah logam, dan menghasilkan berbagai perkakas.",
  },
  {
    scene: 6,
    pauseAfterS: 0.55,
    fixApiPronunciation: true,
    text: "[resonant] Api menjadi salah satu fondasi penting bagi perkembangan [[s6_industry]]teknologi dan peradaban manusia.",
  },

  // SCENE 7 — PENUTUP (~18-19s incl. serene end title card hold)
  {
    scene: 7,
    pauseAfterS: 0.24,
    text: "[warm] [[s7_closeup]]Dari sebuah nyala api, perjalanan manusia berubah.",
  },
  {
    scene: 7,
    pauseAfterS: 0.24,
    text: "[steady] Makanan, perlindungan, [[s7_forge]]kehidupan sosial, hingga teknologi berkembang bersamanya.",
  },
  {
    scene: 7,
    pauseAfterS: 0.32,
    text: "[thoughtful] Api bukan sekadar sumber panas, melainkan salah satu penemuan paling berpengaruh dalam [[s7_city]]sejarah manusia.",
  },
  {
    scene: 7,
    pauseAfterS: 0.20,
    text: "[quietly] Sebuah nyala kecil yang membantu [[s7_title]]membentuk peradaban.",
  },
];

// 9 Bespoke Cinema SFX via ElevenLabs `eleven_text_to_sound_v3`
const BESPOKE_SFX = [
  {
    name: "sfx_prehistoric_forest_night.mp3",
    durationSeconds: 6.0,
    promptInfluence: 0.55,
    prompt: "Prehistoric dense forest ambience at twilight transitioning into cold dark night wind rustling tall leaves and a distant eerie wolf howl, cinematic nature documentary sound design, no music",
  },
  {
    name: "sfx_lightning_tree_ignite.mp3",
    durationSeconds: 4.5,
    promptInfluence: 0.65,
    prompt: "Rolling storm thunder followed by a sharp dramatic lightning bolt strike cracking a massive wooden tree trunk and bursting into fierce roaring fire flames, realistic film foley, no music",
  },
  {
    name: "sfx_campfire_crackling.mp3",
    durationSeconds: 7.0,
    promptInfluence: 0.60,
    prompt: "Warm intimate wooden campfire crackling softly with gentle pops, glowing embers and cozy flickering flames inside a quiet prehistoric cave entrance at night, clean realistic foley",
  },
  {
    name: "sfx_meat_sizzle_fire.mp3",
    durationSeconds: 5.0,
    promptInfluence: 0.60,
    prompt: "Fresh meat roasting and sizzling appetizingly over hot glowing wood embers and campfire flames with gentle fat drips popping, realistic close-up documentary foley, no music",
  },
  {
    name: "sfx_predator_retreat.mp3",
    durationSeconds: 3.5,
    promptInfluence: 0.55,
    prompt: "Low cautious wild predator growl in dark bushes startled by a loud crackling fire pop then rustling twigs retreating rapidly away into the distant forest, film foley",
  },
  {
    name: "sfx_stone_knapping_social.mp3",
    durationSeconds: 4.5,
    promptInfluence: 0.55,
    prompt: "Prehistoric flint stone tool knapping rhythmic crisp stone-on-stone tapping beside a gentle warm crackling campfire at night, realistic archaeological foley, no music",
  },
  {
    name: "sfx_pottery_kiln_roar.mp3",
    durationSeconds: 4.5,
    promptInfluence: 0.55,
    prompt: "Wet clay smoothly shaping on a spinning wheel transitioning into a deep warm roaring terracotta pottery kiln furnace fire, tactile documentary foley",
  },
  {
    name: "sfx_molten_metal_pour.mp3",
    durationSeconds: 4.8,
    promptInfluence: 0.60,
    prompt: "Glowing molten bronze pouring smoothly into a stone mold with dramatic hot metallic steam hiss followed by a single resonant blacksmith anvil strike, cinema sound design",
  },
  {
    name: "sfx_era_transition_city.mp3",
    durationSeconds: 5.0,
    promptInfluence: 0.55,
    prompt: "Warm crackling embers swelling gracefully into a soft atmospheric modern night city shimmer and warm distant harmonic hum resolving gently into quiet embers, cinematic transition",
  },
];

function prepareBeat(rawText, lineIdx, fixApiPronunciation = false) {
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
      // Prevent ElevenLabs multilingual voice from reading capitalized "Api" as English tech acronym "A-P-I"!
      const spokenTok = fixApiPronunciation ? disp.replace(/\bApi\b/g, "api") : disp;
      ttsChunks.push(spokenTok);
    }
  }
  return {
    displayTokens,
    ttsText: ttsChunks.join(" ").replace(/\s{2,}/g, " ").trim(),
    ttsPlainNoTags: displayTokens.map((x) => x.w).join(" ").replace(/\s{2,}/g, " ").trim(),
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
  // Warm documentary baritone polish: HPF 75 Hz, warmth +1.4 dB @ 155 Hz, clarity +1.3 dB @ 3.0 kHz, de-ess -1.0 dB @ 6.2 kHz
  const eq = "highpass=f=75,equalizer=f=155:t=q:w=1.1:g=1.4,equalizer=f=3000:t=q:w=1.3:g=1.3,equalizer=f=6200:t=q:w=1.4:g=-1.0";
  execFileSync(
    "ffmpeg",
    ["-y", "-loglevel", "error", "-i", mp3Path, "-ar", String(SR), "-ac", "1", "-af", eq, "-sample_fmt", "s16", wavPath],
    { stdio: "inherit" }
  );
}

/** Group aligned words into crisp 4-7 word Earth-24h style deckle-edge parchment subtitle cards (max 2 lines per card). */
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
        (cur.length >= 7 && remaining >= 2) ||
        (textLen >= 38 && cur.length >= 4 && remaining >= 2);
      if (shouldBreak) {
        chunks.push(cur);
        cur = [];
      }
    }
    if (cur.length) chunks.push(cur);

    for (const chunk of chunks) {
      const fullStr = chunk.map((x) => x.w).join(" ");
      let lines;
      if (fullStr.length <= 23 || chunk.length <= 3) {
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

  if (cards.length > 0) {
    cards[0].startFrame = 0; // Instant frame-0 hook card visibility!
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

async function main() {
  const client = new ElevenLabsClient();
  const audioDir = join(PROJECT, "audio");
  const voCacheDir = join(audioDir, "vo_cache");
  const sfxDir = join(audioDir, "sfx");
  const outVoWav = join(audioDir, "vo_master.wav");
  const outAlignJson = join(audioDir, "alignment.json");
  const outStoryTs = join(ROOT, "remotion/videos/human-fire/story.ts");
  const tmpBase = join(PROJECT, ".tmp");

  mkdirSync(voCacheDir, { recursive: true });
  mkdirSync(sfxDir, { recursive: true });
  mkdirSync(dirname(outStoryTs), { recursive: true });
  mkdirSync(tmpBase, { recursive: true });

  const prepared = BEATS.map((b, idx) => ({ ...b, idx, ...prepareBeat(b.text, idx, Boolean(b.fixApiPronunciation)) }));
  const tmpDir = mkdtempSync(join(tmpBase, "vo-build-"));

  try {
    console.log("=== [1/2] Synthesizing ElevenLabs v4 Narrator VO (Brian, Natural Documentary Tempo 1.00x) ===");
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

      const cachePayload = {
        id: NARRATOR.id,
        model: TTS_MODEL,
        stab: NARRATOR.stability,
        sim: NARRATOR.similarityBoost,
        text: beat.ttsText,
        prev: prev?.ttsPlainNoTags ?? "",
        next: next?.ttsPlainNoTags ?? "",
        ...(beat.fixApiPronunciation ? { norm: "off" } : {}),
      };
      const cacheKey = createHash("sha1")
        .update(JSON.stringify(cachePayload))
        .digest("hex")
        .slice(0, 12);
      const mp3Path = join(voCacheDir, `beat_${String(i).padStart(2, "0")}_${cacheKey}.mp3`);
      const alignPath = join(voCacheDir, `beat_${String(i).padStart(2, "0")}_${cacheKey}.json`);

      let alignment;
      if (existsSync(mp3Path) && existsSync(alignPath)) {
        console.log(`  [${i + 1}/${prepared.length}] CACHED S${beat.scene}: ${beat.ttsPlainNoTags}`);
        alignment = JSON.parse(readFileSync(alignPath, "utf8"));
      } else {
        console.log(`  [${i + 1}/${prepared.length}] SYNTH  S${beat.scene}: ${beat.ttsText}`);
        const res = await client.textToSpeech.convertWithTimestamps(NARRATOR.id, {
          text: beat.ttsText,
          modelId: TTS_MODEL,
          languageCode: "id",
          outputFormat: "mp3_44100_128",
          applyTextNormalization: beat.fixApiPronunciation ? "off" : "on",
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
      s2Start: Math.max(0, Math.round((sceneStartsSec[2] - 0.45) * FPS)),
      s3Start: Math.max(0, Math.round((sceneStartsSec[3] - 0.45) * FPS)),
      s4Start: Math.max(0, Math.round((sceneStartsSec[4] - 0.45) * FPS)),
      s5Start: Math.max(0, Math.round((sceneStartsSec[5] - 0.45) * FPS)),
      s6Start: Math.max(0, Math.round((sceneStartsSec[6] - 0.45) * FPS)),
      s7Start: Math.max(0, Math.round((sceneStartsSec[7] - 0.45) * FPS)),
      totalFrames,
    };

    // Print scene breakdown so we can verify natural ~100s documentary pacing!
    const starts = [scenesFrame.s1Start, scenesFrame.s2Start, scenesFrame.s3Start, scenesFrame.s4Start, scenesFrame.s5Start, scenesFrame.s6Start, scenesFrame.s7Start, totalFrames];
    console.log("\n=== SCENE TIMING BREAKDOWN (Natural Tempo 1.00x) ===");
    for (let s = 1; s <= 7; s++) {
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

    const storyTs = `// AUTO-GENERATED by human-fire/scripts/build_vo_and_sfx.mjs from ElevenLabs eleven_v4 character timestamps.
// Do not edit timings by hand — re-run the generator to resync.

export interface SubtitleCardSpec {
  scene: number;
  startFrame: number;
  endFrame: number;
  lines: string[];
  highlights: Array<[number, number, number]>;
}

export const HUMAN_FIRE_FPS = ${FPS};
export const HUMAN_FIRE_FRAMES = ${totalFrames};
export const HUMAN_FIRE_DURATION_SEC = ${totalVideoSec};

export const SCENES = ${JSON.stringify(scenesFrame, null, 2)} as const;

export const CUES = ${JSON.stringify(cueMapFrame, null, 2)} as const;

export const CUES_SEC = ${JSON.stringify(cueMapSec, null, 2)} as const;

export const SUBTITLE_CARDS: SubtitleCardSpec[] = ${JSON.stringify(subtitleCards, null, 2)};
`;
    writeFileSync(outStoryTs, storyTs, "utf8");
    console.log(`\nVO COMPLETE -> ${outVoWav} (${voDur.toFixed(2)}s VO, ${totalVideoSec.toFixed(2)}s video / ${totalFrames} frames, ${allWords.length} words, ${Object.keys(cueMapFrame).length} cues, ${subtitleCards.length} cards)`);

    // Step 2: Generate 9 bespoke ElevenLabs Sound-V3 cinematic SFX (cached on disk)
    console.log("\n=== [2/2] Generating 9 Bespoke Documentary Fire & Era SFX via ElevenLabs eleven_text_to_sound_v3 ===");
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

    console.log("\n=== ALL ELEVENLABS VO & BESPOKE SFX GENERATION COMPLETE ===");
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
