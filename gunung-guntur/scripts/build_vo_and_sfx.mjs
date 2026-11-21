/**
 * Audio-First VO & Bespoke SFX Generator for "GunungGunturShort" ("GUNUNG GUNTUR: RAKSASA API GARUT")
 *
 * - Primary Narrator: Brian (`nPczCjzI2devNBz1zQrb`, Warm Documentary Baritone) via ElevenLabs `eleven_v4` (`id`).
 * - Natural Documentary Tempo (`TEMPO = 1.12`) hitting ~80s cleanly without rushing.
 * - Indonesian Pronunciation Shield: spells out all historical years & numbers phonetically with
 *   `applyTextNormalization: "off"` while preserving 100% verbatim display spelling & word alignment.
 * - Generates 8 bespoke geological/documentary SFX via ElevenLabs `eleven_text_to_sound_v3` (cached).
 *
 * Run:
 *   node --env-file=.env gunung-guntur/scripts/build_vo_and_sfx.mjs
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
const TEMPO = 1.22;
const OPEN_LEAD_SILENCE_S = 1.05; // Clean 00:00-00:01.05 topographic contour scan intro before narration enters!
const END_TAIL_PAD_S = 2.80;      // Serene Vintage Travel Postcard finale hold ("GUNUNG GUNTUR: RAKSASA API GARUT")

const NARRATOR = {
  id: "nPczCjzI2devNBz1zQrb", // Brian — Warm, Articulate Documentary Storyteller
  label: "Brian (Warm Documentary Storyteller)",
  stability: 0.52,
  similarityBoost: 0.78,
};

// Indonesian phonetic map for numbers/years (ONLY for TTS; display text remains 100% verbatim!)
const PHONETIC_MAP = {
  "1690": ["seribu", "enam", "ratus", "sembilan", "puluh"],
  "1829": ["seribu", "delapan", "ratus", "dua", "puluh", "sembilan"],
  "1840": ["seribu", "delapan", "ratus", "empat", "puluh"],
  "1847": ["seribu", "delapan", "ratus", "empat", "puluh", "tujuh"],
  "22":   ["dua", "puluh", "dua"],
  "16":   ["enam", "belas"],
  "17":   ["tujuh", "belas"],
  "api":  ["api"],
};

// 100% Verbatim 6-Scene Script with exact [[cue]] storyboard anchors
const BEATS = [
  // SCENE 1 — PEMBUKAAN (~10s)
  {
    scene: 1,
    pauseAfterS: 0.30,
    text: "[calm] [[s1_contour]]Di balik keindahan alam Garut, [[s1_silhouette]]berdiri sebuah gunung yang menyimpan sejarah dahsyat.",
  },
  {
    scene: 1,
    pauseAfterS: 0.28,
    text: "[thoughtful] [[s1_mist]]Dahulu, gunung ini berkali-kali memuntahkan lava dan abu vulkanik.",
  },
  {
    scene: 1,
    pauseAfterS: 0.55,
    text: "[resonant] [[s1_title]]Namanya, Gunung Guntur.",
  },

  // SCENE 2 — SEJARAH NAMA (~13s)
  {
    scene: 2,
    pauseAfterS: 0.35,
    text: "[steady] [[s2_map]]Pada masa kolonial Belanda, gunung ini dikenal sebagai [[s2_kutu]]Gunung Kutu, atau [[s2_donder]]Donderberg.",
  },
  {
    scene: 2,
    pauseAfterS: 0.55,
    text: "[serious tone] [[s2_1829]]Pada tahun 1829, [[s2_erupt]]sebuah letusan besar terjadi dan menjadi bagian penting dari sejarah gunung ini.",
  },

  // SCENE 3 — ERA LETUSAN (~16s)
  {
    scene: 3,
    pauseAfterS: 0.30,
    text: "[steady] [[s3_timeline]]Catatan sejarah menunjukkan, Gunung Guntur telah mengalami aktivitas letusan sejak tahun 1690.",
  },
  {
    scene: 3,
    pauseAfterS: 0.35,
    text: "[resonant] [[s3_count22]]Sedikitnya 22 kali letusan tercatat hingga tahun 1847.",
  },
  {
    scene: 3,
    pauseAfterS: 0.55,
    text: "[serious tone] [[s3_cutaway]]Pada tahun 1840, [[s3_lava]]aliran lava bahkan bergerak dari kawasan puncak [[s3_cipanas]]menuju Cipanas.",
  },

  // SCENE 4 — LETUSAN 1847 (~15s)
  {
    scene: 4,
    pauseAfterS: 0.32,
    text: "[resonant] [[s4_1847]]Pada 16 hingga 17 Desember 1847, [[s4_blast]]Gunung Guntur kembali meletus.",
  },
  {
    scene: 4,
    pauseAfterS: 0.34,
    text: "[serious tone] [[s4_plume]]Gas dan abu vulkanik menyembur ke udara, [[s4_cianjur]]bahkan sebaran abunya mencapai wilayah Cianjur.",
  },
  {
    scene: 4,
    pauseAfterS: 0.55,
    text: "[thoughtful] [[s4_last]]Itulah letusan terakhir yang tercatat dalam kronologi sejarahnya.",
  },

  // SCENE 5 — KOMPLEKS GUNUNGAPI (~14s)
  {
    scene: 5,
    pauseAfterS: 0.30,
    text: "[calm] [[s5_clouds]]Gunung Guntur ternyata bukan sekadar satu kerucut gunung.",
  },
  {
    scene: 5,
    pauseAfterS: 0.55,
    text: "[warm] [[s5_orbit]]Ia merupakan bagian dari kompleks gunungapi yang mencakup beberapa puncak, seperti [[s5_masigit]]Masigit, [[s5_parukuyan]]Parukuyan, dan [[s5_kabuyutan]]Kabuyutan.",
  },

  // SCENE 6 — PENUTUP (~12s + Vintage Travel Postcard finale hold)
  {
    scene: 6,
    pauseAfterS: 0.30,
    text: "[warm] [[s6_morph]]Kini, Gunung Guntur berdiri megah di tanah Garut.",
  },
  {
    scene: 6,
    pauseAfterS: 0.32,
    text: "[thoughtful] [[s6_pullout]]Terlihat tenang, tetapi menyimpan sejarah panjang tentang kekuatan alam.",
  },
  {
    scene: 6,
    pauseAfterS: 0.25,
    text: "[resonant] [[s6_postcard]]Gunung Guntur, raksasa api yang pernah mengguncang Garut.",
  },
];

// 8 Bespoke Geological & Historical Foley SFX via ElevenLabs `eleven_text_to_sound_v3`
const BESPOKE_SFX = [
  {
    name: "sfx_topo_wind_reveal.mp3",
    durationSeconds: 4.5,
    promptInfluence: 0.55,
    prompt: "Delicate cartographic pencil sketching topographic contour lines on thick paper blending smoothly into crisp cool mountain highland wind and gentle mist ambience, documentary foley, no music",
  },
  {
    name: "sfx_colonial_map_stamp.mp3",
    durationSeconds: 4.0,
    promptInfluence: 0.55,
    prompt: "Antique parchment paper map unfolding crisply followed by fountain pen ink writing on paper and one clean resonant wooden archival stamp thud, clean studio foley, no music",
  },
  {
    name: "sfx_quake_eruption_1829.mp3",
    durationSeconds: 5.0,
    promptInfluence: 0.55,
    prompt: "Deep subterranean earth tremor rumbling and building into a powerful volcanic eruption boom with roaring ash plume billowing upward, cinematic documentary foley, no music",
  },
  {
    name: "sfx_timeline_ticks.mp3",
    durationSeconds: 4.5,
    promptInfluence: 0.55,
    prompt: "Crisp rapid mechanical clockwork counter ticks accelerating smoothly across a timeline and landing on a clear warm resonant wooden-metallic lock chime, clean foley, no music",
  },
  {
    name: "sfx_magma_cutaway_lava.mp3",
    durationSeconds: 5.5,
    promptInfluence: 0.55,
    prompt: "Soft tactile paper cutaway whoosh descending into deep viscous molten magma bubbling underground and thick crackling lava flowing steadily over volcanic rock, documentary foley, no music",
  },
  {
    name: "sfx_eruption_1847_lightning.mp3",
    durationSeconds: 5.5,
    promptInfluence: 0.55,
    prompt: "Massive dramatic volcanic eruption blast with sharp crackling electric lightning snap inside a towering ash column and rushing high-altitude wind carrying volcanic ash, documentary sound design, no music",
  },
  {
    name: "sfx_cloud_descent_complex.mp3",
    durationSeconds: 4.5,
    promptInfluence: 0.55,
    prompt: "Smooth airy atmospheric cloud whoosh parting gently as camera glides over misty mountain peaks with soft highland breeze and subtle crisp map pin clicks, documentary foley, no music",
  },
  {
    name: "sfx_nature_garut_postcard.mp3",
    durationSeconds: 5.0,
    promptInfluence: 0.55,
    prompt: "Peaceful Indonesian highland morning breeze rustling pine trees with soft distant tropical mountain birdsong, gentle chalk line sketch swoosh, and a crisp vintage camera postcard shutter click, no music",
  },
];

function expandWordForTts(disp) {
  const m = disp.match(/^([^A-Za-z0-9]*)([A-Za-z0-9.\-]+?)([^A-Za-z0-9]*)$/);
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

/** Group aligned words into crisp 3-6 word Danau Toba brushed-ink karaoke subtitle phrases (max 2 balanced lines). */
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

async function main() {
  const client = new ElevenLabsClient();
  const audioDir = join(PROJECT, "audio");
  const voCacheDir = join(audioDir, "vo_cache");
  const sfxDir = join(audioDir, "sfx");
  const outVoWav = join(audioDir, "vo_master.wav");
  const outAlignJson = join(audioDir, "alignment.json");
  const outStoryTs = join(ROOT, "remotion/videos/gunung-guntur/story.ts");
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
      totalFrames,
    };

    const starts = [scenesFrame.s1Start, scenesFrame.s2Start, scenesFrame.s3Start, scenesFrame.s4Start, scenesFrame.s5Start, scenesFrame.s6Start, totalFrames];
    console.log(`\n=== SCENE TIMING BREAKDOWN (Tempo ${TEMPO}x) ===`);
    for (let s = 1; s <= 6; s++) {
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

    const storyTs = `// AUTO-GENERATED by gunung-guntur/scripts/build_vo_and_sfx.mjs from ElevenLabs eleven_v4 character timestamps.
// Do not edit timings by hand — re-run the generator to resync.

export interface SubtitleCardSpec {
  scene: number;
  startFrame: number;
  endFrame: number;
  lines: string[];
  highlights: Array<[number, number, number]>;
}

export const GUNTUR_FPS = ${FPS};
export const GUNTUR_FRAMES = ${totalFrames};
export const GUNTUR_DURATION_SEC = ${totalVideoSec};

export const SCENES = ${JSON.stringify(scenesFrame, null, 2)} as const;

export const CUES = ${JSON.stringify(cueMapFrame, null, 2)} as const;

export const CUES_SEC = ${JSON.stringify(cueMapSec, null, 2)} as const;

export const SUBTITLE_CARDS: SubtitleCardSpec[] = ${JSON.stringify(subtitleCards, null, 2)};
`;
    writeFileSync(outStoryTs, storyTs, "utf8");
    console.log(`\nVO COMPLETE -> ${outVoWav} (${voDur.toFixed(2)}s VO, ${totalVideoSec.toFixed(2)}s video / ${totalFrames} frames, ${allWords.length} words, ${Object.keys(cueMapFrame).length} cues, ${subtitleCards.length} cards)`);
    console.log("Skipping ElevenLabs Sound-V3 SFX (using curated local volcanic/map/nature SFX + CC0 library = 0 extra credits).");
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
