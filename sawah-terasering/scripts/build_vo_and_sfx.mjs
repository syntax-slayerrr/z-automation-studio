/**
 * Audio-First VO & Bespoke SFX Generator for "SawahTeraseringShort"
 * ("Kenapa Sawah di Gunung Dibuat Bertingkat (Terasering)?")
 *
 * - Primary Narrator: Brian (`nPczCjzI2devNBz1zQrb`) via ElevenLabs `eleven_v4` (`id`).
 * - Energetic Curious Explainer Tempo (`TEMPO = 1.18`, ~65-72s viral Shorts sweet spot!).
 * - Character-level timestamps (`convertWithTimestamps`) extract exact millisecond timing
 *   for every word, all 21 [[cue]] storyboard anchors, 7 continuous sequences, and clean
 *   progressive word-by-word subtitle chunks exported directly to:
 *     `remotion/videos/sawah-terasering/story.ts`
 * - Generates 9 bespoke tactile foley SFX via ElevenLabs `eleven_text_to_sound_v3`.
 *
 * Run:
 *   node --env-file=.env sawah-terasering/scripts/build_vo_and_sfx.mjs
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
const TEMPO = 1.25; // Crisp viral Shorts explainer cadence (~72-75s total, natural & energetic!)
const OPEN_LEAD_SILENCE_S = 0.14;
const END_TAIL_PAD_S = 1.55; // Smooth sunrise camera glide seamlessly looping back into Frame 0!

const NARRATOR = {
  id: "nPczCjzI2devNBz1zQrb", // Brian — Warm, Clear Conversational Indonesian Storyteller
  label: "Brian (Warm Curious Storyteller)",
  stability: 0.48,
  similarityBoost: 0.78,
};

// 21 viral brutal-storyteller Indonesian beats (~182 crisp words) across 7 Continuous Sequences with 24 [[cue]] anchors
const BEATS = [
  // SEQ 1 — HOOK FISIK (Lereng 30° + Hujan Deras Menyapu Bibit)
  {
    seq: 1,
    pauseAfterS: 0.11,
    text: "[curious] [[s1_plant]]Kalau kamu nekat tanam padi di lereng gunung miring,",
  },
  {
    seq: 1,
    pauseAfterS: 0.18,
    text: "[energetic] [[s1_rain]]sekali hujan deras, bibit, pupuk, sampai tanah suburnya langsung [[s1_wash]]hanyut ke bawah.",
  },

  // SEQ 2 — STAKES & FISIKA EROSI LERENG 30°
  {
    seq: 2,
    pauseAfterS: 0.12,
    text: "[steady] Di kemiringan [[s2_angle]]tiga puluh derajat, air tak sempat meresap.",
  },
  {
    seq: 2,
    pauseAfterS: 0.14,
    text: "[serious] [[s2_slide]]Gravitasi menariknya meluncur seperti perosotan, [[s2_strip]]mengikis lapisan tanah paling subur.",
  },
  {
    seq: 2,
    pauseAfterS: 0.22,
    text: "[thoughtful] Satu musim hujan, [[s2_bare]]bukitnya tinggal batu dan tanah keras.",
  },

  // SEQ 3 — TURN: MEMOTONG BUKIT JADI TANGGA (TERASERING & PEMATANG)
  {
    seq: 3,
    pauseAfterS: 0.14,
    text: "[warm] Maka petani [[s3_carve]]memotong lerengnya bertahap, rata kayak tangga raksasa.",
  },
  {
    seq: 3,
    pauseAfterS: 0.18,
    text: "[confident] Namanya [[s3_label]]terasering.",
  },
  {
    seq: 3,
    pauseAfterS: 0.22,
    text: "[steady] Di tiap tepi petak, dipadatkan tanggul tanah liat bernama [[s3_bund]]pematang.",
  },

  // SEQ 4 — DEEPEN: ANALOGI MEJA PAPAN MIRING VS PAPAN BERUNDAK
  {
    seq: 4,
    pauseAfterS: 0.11,
    text: "[curious] [[s4_table]]Cara kerjanya persis begini.",
  },
  {
    seq: 4,
    pauseAfterS: 0.16,
    text: "[energetic] [[s4_pour_flat]]Tuang air ke papan miring, dua detik langsung tumpah habis.",
  },
  {
    seq: 4,
    pauseAfterS: 0.22,
    text: "[warm] Tapi begitu dibuat [[s4_stepped]]berundak, tiap tingkat [[s4_brake]]mengerem arus jadi kolam tenang.",
  },

  // SEQ 5 — CUTAWAY BAWAH TANAH: RESAPAN MATA AIR & JARING AKAR PADI
  {
    seq: 5,
    pauseAfterS: 0.12,
    text: "[intrigued] Nah, [[s5_dive]]keajaibannya di bawah tanah.",
  },
  {
    seq: 5,
    pauseAfterS: 0.15,
    text: "[warm] Karena air berhenti, sebagian [[s5_seep]]meresap pelan mengisi cadangan mata air gunung.",
  },
  {
    seq: 5,
    pauseAfterS: 0.22,
    text: "[steady] Sementara [[s5_roots]]ribuan akar padi mengunci butiran tanah kayak jaring baja, mencegah longsor.",
  },

  // SEQ 6 — TWIST: SALURAN PELIMPAH BAMBU & IRIGASI GRAVITASI
  {
    seq: 6,
    pauseAfterS: 0.14,
    text: "[curious] Tapi kalau hujan terus, [[s6_overflow]]bukannya kolamnya jebol?",
  },
  {
    seq: 6,
    pauseAfterS: 0.12,
    text: "[bright] Triknya, tiap pematang diberi celah rendah atau [[s6_pipe]]pipa bambu pelimpah.",
  },
  {
    seq: 6,
    pauseAfterS: 0.13,
    text: "[warm] Saat air pas, [[s6_cascade]]kelebihannya mengalir tenang ke petak bawah.",
  },
  {
    seq: 6,
    pauseAfterS: 0.22,
    text: "[admiring] Satu mata air puncak mengairi [[s6_valley]]puluhan sawah sampai lembah.",
  },

  // SEQ 7 — PAYOFF + RESIDUE + SEAMLESS LOOP BRIDGE -> FRAME 0
  {
    seq: 7,
    pauseAfterS: 0.15,
    text: "[warm] [[s7_sunset]]Jadi sawah bertingkat bukan dibuat biar estetik difoto.",
  },
  {
    seq: 7,
    pauseAfterS: 0.18,
    text: "[resonant] Ini [[s7_dam]]bendungan raksasa tanpa semen yang diam-diam melawan gravitasi.",
  },
  {
    seq: 7,
    pauseAfterS: 0.06,
    text: "[thoughtful] Padahal awalnya, [[s7_loop]]bencana erosi tadi cuma terjadi...",
  },
];

// 9 Bespoke Tactile Foley SFX via ElevenLabs `eleven_text_to_sound_v3`
const BESPOKE_SFX = [
  {
    name: "sfx_rain_monsoon.mp3",
    durationSeconds: 5.5,
    promptInfluence: 0.6,
    prompt:
      "Sudden heavy Indonesian tropical monsoon rain pouring onto wet mud, grass and rice leaves with gentle distant rumble, realistic nature foley, no music",
  },
  {
    name: "sfx_mud_runoff.mp3",
    durationSeconds: 5.0,
    promptInfluence: 0.6,
    prompt:
      "Fast rushing muddy rainwater stream sweeping rapidly down a steep wet hillside carrying loose dirt clods and pebbles, crisp outdoor documentary foley, no music",
  },
  {
    name: "sfx_hoe_chop_soil.mp3",
    durationSeconds: 4.5,
    promptInfluence: 0.62,
    prompt:
      "Rhythmic steel farming hoe chopping firmly into moist rich earth soil three times with earthy thuds and crumbling soil clods falling, clean tactile foley, no music",
  },
  {
    name: "sfx_mud_pat.mp3",
    durationSeconds: 3.2,
    promptInfluence: 0.58,
    prompt:
      "Wet clay mud being patted and compacted firmly by hand and wooden paddle to shape a smooth farm embankment bund, close-up tactile foley, no music",
  },
  {
    name: "sfx_pitcher_pour_wood.mp3",
    durationSeconds: 4.8,
    promptInfluence: 0.6,
    prompt:
      "Clear water pouring smoothly from a clay pitcher onto a tilted wooden board rushing quickly then pouring calmly into small shallow wooden step pools, crisp studio foley, no music",
  },
  {
    name: "sfx_water_infiltrate.mp3",
    durationSeconds: 4.5,
    promptInfluence: 0.55,
    prompt:
      "Soft calm subterranean water trickling and seeping gently through porous wet mountain soil and fibrous roots underground, intimate scientific cutaway foley, no music",
  },
  {
    name: "sfx_bamboo_pipe_set.mp3",
    durationSeconds: 2.8,
    promptInfluence: 0.6,
    prompt:
      "Hollow natural bamboo pipe pressed and tapped firmly into wet mud bank with a crisp hollow woody knock and wet squelch, clean tactile foley, no music",
  },
  {
    name: "sfx_bamboo_waterfall.mp3",
    durationSeconds: 5.5,
    promptInfluence: 0.62,
    prompt:
      "Crystal clear mountain spring water pouring steadily out of a hollow bamboo spout cascading into a calm flooded rice paddy pool with soothing splashing ripples, Bali terrace foley, no music",
  },
  {
    name: "sfx_sunset_paddy_breeze.mp3",
    durationSeconds: 5.0,
    promptInfluence: 0.55,
    prompt:
      "Warm peaceful evening mountain breeze rustling tall golden rice stalks with soft distant tropical village birds at sunset, serene Indonesian countryside ambience, no music",
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

function renderCleanNarratorWav(mp3Path, wavPath) {
  // Crisp conversational explainer VO EQ: HPF 80 Hz, warmth +1.5dB @ 160 Hz, presence +1.8dB @ 3.2 kHz, de-ess -1.2dB @ 6.5 kHz
  const eq =
    "highpass=f=80,equalizer=f=160:t=q:w=1.1:g=1.5,equalizer=f=3200:t=q:w=1.3:g=1.8,equalizer=f=6500:t=q:w=1.4:g=-1.2";
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
 * Group aligned words into snappy 2-4 word viral Shorts subtitle chunks
 * with per-word exact startFrame timestamps for true audio-locked type-on reveal!
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
    const endFrame = Math.round(chunk[chunk.length - 1].end * FPS) + 5;
    return {
      id: `sub_${String(idx + 1).padStart(3, "0")}`,
      seq: chunk[0].seq,
      startFrame,
      endFrame,
      words: chunk.map((w) => ({
        text: w.w,
        startFrame: Math.max(startFrame, Math.round(w.start * FPS)),
        endFrame: Math.round(w.end * FPS),
      })),
    };
  });

  // Ensure zero overlap between consecutive chunks
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
  const outStoryTs = join(ROOT, "remotion/videos/sawah-terasering/story.ts");
  const tmpBase = join(PROJECT, ".tmp");

  mkdirSync(voCacheDir, { recursive: true });
  mkdirSync(sfxDir, { recursive: true });
  mkdirSync(dirname(outStoryTs), { recursive: true });
  mkdirSync(tmpBase, { recursive: true });

  const prepared = BEATS.map((b, idx) => ({ ...b, idx, ...prepareBeat(b.text, idx) }));
  const tmpDir = mkdtempSync(join(tmpBase, "vo-build-"));

  try {
    console.log(
      `=== [1/2] Synthesizing ElevenLabs ${TTS_MODEL} Narrator VO (${NARRATOR.label}, atempo=${TEMPO}x) ===`
    );
    const concatParts = [];
    const leadSil = join(tmpDir, "sil_lead.wav");
    execFileSync("ffmpeg", [
      "-y",
      "-loglevel",
      "error",
      "-f",
      "lavfi",
      "-i",
      `anullsrc=r=${SR}:cl=mono`,
      "-t",
      String(OPEN_LEAD_SILENCE_S),
      "-sample_fmt",
      "s16",
      leadSil,
    ]);
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
      };
      const cacheKey = createHash("sha1")
        .update(JSON.stringify(cachePayload))
        .digest("hex")
        .slice(0, 12);
      const mp3Path = join(voCacheDir, `beat_${String(i).padStart(2, "0")}_${cacheKey}.mp3`);
      const alignPath = join(voCacheDir, `beat_${String(i).padStart(2, "0")}_${cacheKey}.json`);

      let alignment;
      if (existsSync(mp3Path) && existsSync(alignPath)) {
        console.log(`  [${i + 1}/${prepared.length}] CACHED Seq${beat.seq}: ${beat.ttsPlainNoTags}`);
        alignment = JSON.parse(readFileSync(alignPath, "utf8"));
      } else {
        console.log(`  [${i + 1}/${prepared.length}] SYNTH  Seq${beat.seq}: ${beat.ttsText}`);
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
      // Generous 0.14s pre-onset safety margin so initial consonants ("Satu", "Cara", "Ini", "Padahal") NEVER clip!
      const trimLead = aligned.length ? Math.max(0, Number((aligned[0].start - 0.14).toFixed(3))) : 0;
      const lastEnd = aligned.length ? aligned[aligned.length - 1].end : clipDur;
      const srcSpan = Math.max(
        0.12,
        Math.min(clipDur - trimLead, Number((lastEnd - trimLead + 0.14).toFixed(3)))
      );
      const trimWav = join(tmpDir, `beat_${i}_trim.wav`);
      const afChain =
        TEMPO === 1.0 ? "afade=t=in:st=0:d=0.008" : `atempo=${TEMPO},afade=t=in:st=0:d=0.008`;
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
        `afade=t=out:st=${Math.max(0, actualDur - 0.015).toFixed(3)}:d=0.015`,
        "-sample_fmt",
        "s16",
        fadeWav,
      ]);

      for (const tok of aligned) {
        const sRel = Math.max(0, (tok.start - trimLead) / TEMPO);
        const eRel = Math.max(sRel + 0.02, (tok.end - trimLead) / TEMPO);
        allWords.push({
          w: tok.w,
          cue: tok.cue,
          seq: beat.seq,
          line: tok.line,
          start: Number((cursorSec + sRel).toFixed(3)),
          end: Number((cursorSec + eRel).toFixed(3)),
        });
      }

      concatParts.push(fadeWav);
      cursorSec += actualDur;

      const silWav = join(tmpDir, `sil_${i}.wav`);
      execFileSync("ffmpeg", [
        "-y",
        "-loglevel",
        "error",
        "-f",
        "lavfi",
        "-i",
        `anullsrc=r=${SR}:cl=mono`,
        "-t",
        String(beat.pauseAfterS),
        "-sample_fmt",
        "s16",
        silWav,
      ]);
      concatParts.push(silWav);
      cursorSec += beat.pauseAfterS;
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
    const totalVideoSec = Number((voDur + END_TAIL_PAD_S).toFixed(3));
    const totalFrames = Math.ceil(totalVideoSec * FPS);

    const cueMapSec = {};
    const cueMapFrame = {};
    const seqStartsSec = {};
    for (const w of allWords) {
      if (w.cue) {
        cueMapSec[w.cue] = w.start;
        cueMapFrame[w.cue] = Math.round(w.start * FPS);
      }
      if (seqStartsSec[w.seq] === undefined) {
        seqStartsSec[w.seq] = w.start;
      }
    }

    const seqsFrame = {
      seq1Start: 0,
      seq2Start: Math.max(0, Math.round((seqStartsSec[2] - 0.18) * FPS)),
      seq3Start: Math.max(0, Math.round((seqStartsSec[3] - 0.22) * FPS)),
      seq4Start: Math.max(0, Math.round((seqStartsSec[4] - 0.18) * FPS)),
      seq5Start: Math.max(0, Math.round((seqStartsSec[5] - 0.18) * FPS)),
      seq6Start: Math.max(0, Math.round((seqStartsSec[6] - 0.18) * FPS)),
      seq7Start: Math.max(0, Math.round((seqStartsSec[7] - 0.22) * FPS)),
      loopStart: Math.max(0, totalFrames - Math.round(2.45 * FPS)),
      totalFrames,
    };

    const starts = [
      seqsFrame.seq1Start,
      seqsFrame.seq2Start,
      seqsFrame.seq3Start,
      seqsFrame.seq4Start,
      seqsFrame.seq5Start,
      seqsFrame.seq6Start,
      seqsFrame.seq7Start,
      totalFrames,
    ];
    console.log("\n=== 7-SEQUENCE CONTINUOUS TIMING BREAKDOWN ===");
    for (let s = 1; s <= 7; s++) {
      const durS = ((starts[s] - starts[s - 1]) / FPS).toFixed(2);
      console.log(
        `  Seq ${s}: f=${starts[s - 1]}..${starts[s] - 1} (${(starts[s - 1] / FPS).toFixed(2)}s -> ${(
          starts[s] / FPS
        ).toFixed(2)}s | dur=${durS}s)`
      );
    }

    const subtitleChunks = buildSubtitleChunks(allWords);
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
      seqsFrame,
      words: allWords,
    };
    writeFileSync(outAlignJson, JSON.stringify(alignObj, null, 2) + "\n", "utf8");

    const storyTs = `// AUTO-GENERATED by sawah-terasering/scripts/build_vo_and_sfx.mjs
// Source: ElevenLabs ${TTS_MODEL} character timestamps (${allWords.length} words, ${Object.keys(cueMapFrame).length} cues)

export interface SubtitleWord {
  text: string;
  startFrame: number;
  endFrame: number;
}

export interface SubtitleChunk {
  id: string;
  seq: number;
  startFrame: number;
  endFrame: number;
  words: SubtitleWord[];
}

export const COMPOSITION_CONFIG = {
  id: "SawahTeraseringShort",
  width: 1080,
  height: 1920,
  fps: ${FPS},
  durationInFrames: ${totalFrames},
  durationSec: ${totalVideoSec},
  audioMasterPath: "sawah-terasering/audio_master.m4a",
} as const;

export const SEQS = ${JSON.stringify(seqsFrame, null, 2)} as const;

export const CUES = ${JSON.stringify(cueMapFrame, null, 2)} as const;

export const CUES_SEC = ${JSON.stringify(cueMapSec, null, 2)} as const;

export const SUBTITLE_CHUNKS: SubtitleChunk[] = ${JSON.stringify(subtitleChunks, null, 2)};
`;
    writeFileSync(outStoryTs, storyTs, "utf8");
    console.log(
      `\nVO COMPLETE -> ${outVoWav} (${voDur.toFixed(2)}s VO | ${totalVideoSec.toFixed(
        2
      )}s video / ${totalFrames} frames | ${allWords.length} words | ${subtitleChunks.length} subtitle chunks)`
    );

    // Step 2: Generate 9 bespoke ElevenLabs Sound-V3 tactile foley SFX
    console.log("\n=== [2/2] Generating 9 Bespoke Tactile Foley SFX via eleven_text_to_sound_v3 ===");
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

    console.log("\n=== ALL SAWAH TERASERING VO & BESPOKE SFX COMPLETE ===");
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
