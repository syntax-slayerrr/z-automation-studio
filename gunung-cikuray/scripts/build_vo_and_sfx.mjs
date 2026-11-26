/**
 * Audio-First VO & Alignment Generator for "GunungCikurayShort" ("GUNUNG CIKURAY: ATAP LANGIT GARUT")
 *
 * - Primary Narrator: Brian (`nPczCjzI2devNBz1zQrb`, Warm Documentary Storyteller) via ElevenLabs `eleven_v4` (`id`).
 * - Natural Curious Documentary Tempo (`TEMPO = 1.18`) targeting ~65-72s crisp pacing.
 * - Indonesian Pronunciation Shield (`applyTextNormalization: "off"`): spells out all numbers phonetically
 *   in TTS while preserving 100% crisp display text & exact word-level karaoke highlights.
 * - Optional bespoke ElevenLabs `eleven_text_to_sound_v3` SFX generator (auto-cached; gracefully skips if credits tight).
 *
 * Run:
 *   node --env-file=.env gunung-cikuray/scripts/build_vo_and_sfx.mjs
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT = resolve(__dirname, "..");
const ROOT = resolve(PROJECT, "..");

const TTS_MODEL = "eleven_v4";
const SFX_MODEL = "eleven_text_to_sound_v3";
const SR = 44100;
const FPS = 30;
const TEMPO = 1.18;
const OPEN_LEAD_SILENCE_S = 0.75; // Scenic poster breath before voice enters cleanly
const END_TAIL_PAD_S = 2.60;      // Collectible Vintage Travel Postcard finale hold

const NARRATOR = {
  id: "nPczCjzI2devNBz1zQrb", // Brian — Warm, Articulate Documentary Storyteller
  label: "Brian (Warm Documentary Storyteller)",
  stability: 0.50,
  similarityBoost: 0.78,
};

// Indonesian phonetic expansion ONLY for TTS (display subtitles stay crisp & readable!)
const PHONETIC_MAP = {
  "2.821": ["dua", "ribu", "delapan", "ratus", "dua", "puluh", "satu"],
  "2.105": ["dua", "ribu", "seratus", "lima"],
  "api": ["api"],
  "air": ["air"],
  "abu": ["abu"],
  "era": ["era"],
};

// 6-Scene Brutal-Storyteller Geological Script with exact [[cue]] storyboard anchors
const BEATS = [
  // SCENE 1 — SCENIC POSTER HOOK (~10s)
  {
    scene: 1,
    pauseAfterS: 0.28,
    text: "[curious] [[s1_open]]Di Garut, gunung paling tinggi justru yang paling diam.",
  },
  {
    scene: 1,
    pauseAfterS: 0.26,
    text: "[thoughtful] [[s1_contrast]]Tetangganya berkali-kali menyemburkan api, tapi raksasa [[s1_height]]2.821 meter ini tidak punya kawah aktif.",
  },
  {
    scene: 1,
    pauseAfterS: 0.50,
    text: "[resonant] [[s1_title]]Namanya, Gunung Cikuray.",
  },

  // SCENE 2 — VINTAGE ATLAS & ELEVATION COMPARISON (~10s)
  {
    scene: 2,
    pauseAfterS: 0.28,
    text: "[steady] [[s2_atlas]]Berdiri di selatan Cekungan Garut, Cikuray menjulang jauh melampaui [[s2_guntur]]Guntur, [[s2_galunggung]]Galunggung, bahkan [[s2_papandayan]]Papandayan.",
  },
  {
    scene: 2,
    pauseAfterS: 0.45,
    text: "[warm] [[s2_rank]]Menjadikannya puncak tertinggi keempat di seluruh Jawa Barat.",
  },

  // SCENE 3 — QUATERNARY SUBDUCTION & STRATOVOLCANO BIRTH CUTAWAY (~13s)
  {
    scene: 3,
    pauseAfterS: 0.28,
    text: "[thoughtful] [[s3_rewind]]Ratusan ribu tahun lalu, pada era Kuarter, [[s3_subduct]]tunjaman Lempeng Indo-Australia memicu dapur magma di bawah Priangan.",
  },
  {
    scene: 3,
    pauseAfterS: 0.48,
    text: "[resonant] [[s3_build]]Lapis demi lapis lava andesit dan abu vulkanik menumpuk, membangun kerucut stratovolkano yang simetris dan curam.",
  },

  // SCENE 4 — COOLING MAGMA, ERODED PEAK & POROUS ROCK HYDROLOGY (~15s)
  {
    scene: 4,
    pauseAfterS: 0.28,
    text: "[calm] [[s4_cool]]Namun perlahan, dapur magmanya mendingin dan membeku di perut bumi.",
  },
  {
    scene: 4,
    pauseAfterS: 0.28,
    text: "[thoughtful] [[s4_erode]]Tanpa letusan tercatat dalam sejarah modern, puncaknya terkikis erosi hingga tertutup hutan lebat.",
  },
  {
    scene: 4,
    pauseAfterS: 0.48,
    text: "[curious] [[s4_rain]]Batuan vulkaniknya yang terjal dan berpori juga menyerap air hujan langsung ke kaki gunung, membuat [[s4_dry]]jalur atasnya nyaris tanpa mata air.",
  },

  // SCENE 5 — ATMOSPHERIC SCIENCE: TEMPERATURE INVERSION & SEA OF CLOUDS (~12s)
  {
    scene: 5,
    pauseAfterS: 0.26,
    text: "[warm] [[s5_dawn]]Ketinggiannya yang ekstrem justru melahirkan keajaiban tiap pagi.",
  },
  {
    scene: 5,
    pauseAfterS: 0.26,
    text: "[steady] [[s5_inversion]]Saat inversi suhu terjadi, udara dingin memerangkap awan di Cekungan Garut seperti mangkuk raksasa.",
  },
  {
    scene: 5,
    pauseAfterS: 0.48,
    text: "[resonant] [[s5_clouds]]Sementara puncak Cikuray menembus bersih di atas hamparan lautan awan.",
  },

  // SCENE 6 — SEAMLESS LOOP RETURN, DASHED GHOST BLUEPRINT & VINTAGE POSTCARD (~10s + hold)
  {
    scene: 6,
    pauseAfterS: 0.26,
    text: "[calm] [[s6_loop]]Dari puncaknya, semua terasa sunyi dan damai.",
  },
  {
    scene: 6,
    pauseAfterS: 0.28,
    text: "[thoughtful] [[s6_ghost]]Padahal kita sedang berpijak di atas raksasa stratovolkano purba yang tertidur.",
  },
  {
    scene: 6,
    pauseAfterS: 0.22,
    text: "[resonant] [[s6_postcard]]Gunung Cikuray, penjaga sunyi di atap langit Garut.",
  },
];

// Optional bespoke tactile geological/weather foley via ElevenLabs Sound-V3
const BESPOKE_SFX = [
  {
    name: "sfx_mountain_rain_percolate.mp3",
    durationSeconds: 4.5,
    promptInfluence: 0.55,
    prompt: "Steady tropical mountain rain falling on volcanic forest slopes transitioning gently into water trickling and seeping downward through porous volcanic rock, natural documentary foley, no music",
  },
  {
    name: "sfx_dawn_cloud_breeze.mp3",
    durationSeconds: 4.5,
    promptInfluence: 0.55,
    prompt: "Crisp high-altitude Indonesian mountain sunrise breeze sweeping softly across a sea of clouds with faint distant morning highland birdsong, serene documentary ambience, no music",
  },
  {
    name: "sfx_chalk_postcard_shutter.mp3",
    durationSeconds: 3.0,
    promptInfluence: 0.55,
    prompt: "Soft dry chalk pencil sketching a quick curved blueprint line on vintage thick paper followed by one clean crisp vintage mechanical camera shutter click, studio foley, no music",
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

async function generateBespokeSfx(client, sfxDir) {
  console.log(`\n=== [2/2] Generating Bespoke Geological/Weather Foley via ElevenLabs ${SFX_MODEL} ===`);
  for (const item of BESPOKE_SFX) {
    const outPath = join(sfxDir, item.name);
    if (existsSync(outPath)) {
      console.log(`  [CACHED] ${item.name}`);
      continue;
    }
    try {
      console.log(`  [SYNTH ] ${item.name} (${item.durationSeconds}s)`);
      const stream = await client.textToSoundEffects.convert({
        text: item.prompt,
        durationSeconds: item.durationSeconds,
        promptInfluence: item.promptInfluence,
        modelId: SFX_MODEL,
      });
      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }
      writeFileSync(outPath, Buffer.concat(chunks));
      console.log(`  [OK    ] ${item.name} (${Buffer.concat(chunks).length} bytes)`);
    } catch (err) {
      console.warn(`  [WARN  ] Could not synthesize ${item.name}: ${err?.message ?? err} (falling back to curated local bank)`);
    }
  }
}

async function main() {
  const client = new ElevenLabsClient();
  const audioDir = join(PROJECT, "audio");
  const voCacheDir = join(audioDir, "vo_cache");
  const sfxDir = join(audioDir, "sfx");
  const outVoWav = join(audioDir, "vo_master.wav");
  const outAlignJson = join(audioDir, "alignment.json");
  const outStoryTs = join(ROOT, "remotion/videos/gunung-cikuray/story.ts");
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
      s2Start: Math.max(0, Math.round((sceneStartsSec[2] - 0.32) * FPS)),
      s3Start: Math.max(0, Math.round((sceneStartsSec[3] - 0.32) * FPS)),
      s4Start: Math.max(0, Math.round((sceneStartsSec[4] - 0.32) * FPS)),
      s5Start: Math.max(0, Math.round((sceneStartsSec[5] - 0.32) * FPS)),
      s6Start: Math.max(0, Math.round((sceneStartsSec[6] - 0.32) * FPS)),
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

    const storyTs = `// AUTO-GENERATED by gunung-cikuray/scripts/build_vo_and_sfx.mjs from ElevenLabs eleven_v4 character timestamps.
// Do not edit timings by hand — re-run the generator to resync.

export interface SubtitleCardSpec {
  scene: number;
  startFrame: number;
  endFrame: number;
  lines: string[];
  highlights: Array<[number, number, number]>;
}

export const CIKURAY_FPS = ${FPS};
export const CIKURAY_FRAMES = ${totalFrames};
export const CIKURAY_DURATION_SEC = ${totalVideoSec};

export const SCENES = ${JSON.stringify(scenesFrame, null, 2)} as const;

export const CUES = ${JSON.stringify(cueMapFrame, null, 2)} as const;

export const CUES_SEC = ${JSON.stringify(cueMapSec, null, 2)} as const;

export const SUBTITLE_CARDS: SubtitleCardSpec[] = ${JSON.stringify(subtitleCards, null, 2)};
`;
    writeFileSync(outStoryTs, storyTs, "utf8");
    console.log(`\nVO COMPLETE -> ${outVoWav} (${voDur.toFixed(2)}s VO, ${totalVideoSec.toFixed(2)}s video / ${totalFrames} frames, ${allWords.length} words, ${Object.keys(cueMapFrame).length} cues, ${subtitleCards.length} cards)`);

    await generateBespokeSfx(client, sfxDir);
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
