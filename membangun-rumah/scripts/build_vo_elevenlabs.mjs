/**
 * ElevenLabs `eleven_v4` Audio-First VO Generator for "MembangunRumahShort"
 * ("Dari Masalah Menjadi Rumah" — 8-Scene 3D Architectural Cutaway Documentary, ±110-120s)
 *
 * - Primary Narrator: Brian (`nPczCjzI2devNBz1zQrb`) via ElevenLabs `eleven_v4` (`id`)
 *   with exact character-level timestamps (`convertWithTimestamps`) & SHA-1 beat caching.
 * - Requires ~1,850 credits in `ELEVENLABS_API_KEY` (VO only; SFX reuse verified studio archive + CC0).
 *
 * Run:
 *   node --env-file=.env membangun-rumah/scripts/build_vo_elevenlabs.mjs
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT = resolve(__dirname, "..");
const ROOT = resolve(PROJECT, "..");

const TTS_MODEL = "eleven_v4";
const SR = 44100;
const FPS = 30;
const TEMPO = 1.14; // Hits exact ±118-120s target from cached ElevenLabs v4 clips!
const OPEN_LEAD_SILENCE_S = 0.25;
const END_TAIL_PAD_S = 3.8;

const NARRATOR = {
  id: "nPczCjzI2devNBz1zQrb", // Brian — Warm Clear Indonesian Documentary Storyteller
  label: "Brian (Warm Documentary Storyteller)",
  stability: 0.48,
  similarityBoost: 0.78,
};

const BEATS = [
  { scene: 1, pauseAfterS: 0.40, text: "[thoughtful] [[s1_rain]]Bayangkan setiap hari kamu harus menghadapi panas terik, [[s1_puddle]]hujan deras, dan tidak punya tempat yang benar-benar bisa melindungimu." },
  { scene: 1, pauseAfterS: 0.40, text: "[calm] [[s1_heat]]Tempat untuk beristirahat saja terasa sulit ditemukan." },
  { scene: 1, pauseAfterS: 0.62, text: "[curious] [[s1_idea]]Lalu, bagaimana kalau kita membangun tempat tinggal sendiri?" },

  { scene: 2, pauseAfterS: 0.36, text: "[warm] [[s2_ghost]]Untuk mengatasi masalah itu, kita membutuhkan tempat tinggal yang mampu melindungi dari cuaca, [[s2_blueprint]]memberikan privasi, dan menyediakan ruang untuk beraktivitas." },
  { scene: 2, pauseAfterS: 0.32, text: "[steady] [[s2_rooms]]Tapi rumah tidak bisa dibangun begitu saja." },
  { scene: 2, pauseAfterS: 0.62, text: "[confident] [[s2_model3d]]Semuanya harus direncanakan." },

  { scene: 3, pauseAfterS: 0.40, text: "[steady] [[s3_aerial]]Pertama, kita perlu menentukan lokasi dan memeriksa kondisi tanah." },
  { scene: 3, pauseAfterS: 0.62, text: "[warm] Setelah desain dan perhitungan struktur selesai, [[s3_clear]]lahan dibersihkan, diratakan, [[s3_stakes]]dan diukur sesuai ukuran [[s3_grid]]bangunan." },

  { scene: 4, pauseAfterS: 0.38, text: "[intrigued] [[s4_dive]]Namun, sebelum dinding berdiri, ada satu bagian penting yang harus dibuat terlebih dahulu: [[s4_trench]]fondasi." },
  { scene: 4, pauseAfterS: 0.38, text: "[steady] Tanah digali, kemudian [[s4_stones]]fondasi dibangun sesuai kondisi tanah dan [[s4_rebar]]desain struktur." },
  { scene: 4, pauseAfterS: 0.62, text: "[confident] [[s4_load]]Fondasi inilah yang membantu menyalurkan beban bangunan ke tanah." },

  { scene: 5, pauseAfterS: 0.36, text: "[warm] [[s5_columns]]Setelah fondasi siap, struktur rumah mulai tumbuh." },
  { scene: 5, pauseAfterS: 0.38, text: "[energetic] Kolom dan [[s5_beams]]balok dibangun untuk membentuk [[s5_frame]]kerangka yang menopang bangunan." },
  { scene: 5, pauseAfterS: 0.62, text: "[admiring] [[s5_orbit]]Kini, rumah mulai memiliki bentuk." },

  { scene: 6, pauseAfterS: 0.38, text: "[steady] [[s6_bricks]]Berikutnya, dinding disusun untuk membagi ruang dan [[s6_openings]]melindungi bagian dalam rumah." },
  { scene: 6, pauseAfterS: 0.38, text: "[warm] [[s6_truss]]Rangka atap dipasang, kemudian ditutup dengan [[s6_tiles]]genteng." },
  { scene: 6, pauseAfterS: 0.62, text: "[admiring] [[s6_building]]Perlahan, kerangka tadi berubah menjadi sebuah bangunan." },

  { scene: 7, pauseAfterS: 0.34, text: "[thoughtful] [[s7_cutaway]]Tapi bangunan saja belum cukup untuk disebut rumah." },
  { scene: 7, pauseAfterS: 0.38, text: "[steady] [[s7_utilities]]Instalasi listrik dan air harus dipasang." },
  { scene: 7, pauseAfterS: 0.38, text: "[warm] [[s7_plaster]]Dinding diplester dan dicat, [[s7_ceramic]]lantai dipasang, serta [[s7_lights]]pintu dan jendela dilengkapi." },
  { scene: 7, pauseAfterS: 0.62, text: "[bright] [[s7_furniture]]Setiap bagian mulai memiliki fungsinya." },

  { scene: 8, pauseAfterS: 0.40, text: "[warm] [[s8_complete]]Dan akhirnya, sebidang tanah kosong telah berubah menjadi tempat tinggal." },
  { scene: 8, pauseAfterS: 0.40, text: "[calm] [[s8_rain_safe]]Kini ada atap untuk berlindung dari hujan, dinding untuk melindungi diri, dan [[s8_family]]ruang untuk beristirahat bersama keluarga." },
  { scene: 8, pauseAfterS: 0.34, text: "[resonant] [[s8_pullback]]Karena pada akhirnya, rumah bukan hanya tentang bangunan." },
  { scene: 8, pauseAfterS: 0.24, text: "[warm] [[s8_closing]]Tetapi tentang tempat kita merasa aman." },
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
    return displayTokens.map((dt, idx) => ({ ...dt, start: spokenRuns[idx].start, end: spokenRuns[idx].end }));
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
  return Number.parseFloat(
    execFileSync(
      "ffprobe",
      ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", filePath],
      { encoding: "utf8" }
    ).trim().replace(/,/g, "")
  );
}

function renderCleanNarratorWav(mp3Path, wavPath) {
  const eq =
    "highpass=f=80,equalizer=f=160:t=q:w=1.1:g=1.5,equalizer=f=3200:t=q:w=1.3:g=1.8,equalizer=f=6500:t=q:w=1.4:g=-1.2";
  execFileSync(
    "ffmpeg",
    ["-y", "-loglevel", "error", "-i", mp3Path, "-ar", String(SR), "-ac", "1", "-af", eq, "-sample_fmt", "s16", wavPath],
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
      cur.push(w);
      const textLen = cur.map((x) => x.w).join(" ").length;
      const endsPunct = /[,.\?!:]$/.test(w.w);
      const remaining = lineWords.length - 1 - i;
      if (
        (endsPunct && cur.length >= 2 && remaining >= 1) ||
        (cur.length >= 4 && remaining >= 2) ||
        (textLen >= 26 && cur.length >= 3 && remaining >= 1)
      ) {
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
  const outVoWav = join(audioDir, "vo_master.wav");
  const outAlignJson = join(audioDir, "alignment.json");
  const outStoryTs = join(ROOT, "remotion/videos/membangun-rumah/story.ts");
  const tmpBase = join(PROJECT, ".tmp");

  mkdirSync(voCacheDir, { recursive: true });
  mkdirSync(dirname(outStoryTs), { recursive: true });
  mkdirSync(tmpBase, { recursive: true });

  const prepared = BEATS.map((b, idx) => ({ ...b, idx, ...prepareBeat(b.text, idx) }));
  const tmpDir = mkdtempSync(join(tmpBase, "vo-el-"));

  try {
    console.log(`=== Synthesizing ElevenLabs ${TTS_MODEL} VO (${NARRATOR.label}, atempo=${TEMPO}x) ===`);
    const concatParts = [];
    const leadSil = join(tmpDir, "sil_lead.wav");
    execFileSync("ffmpeg", [
      "-y", "-loglevel", "error", "-f", "lavfi", "-i", `anullsrc=r=${SR}:cl=mono`,
      "-t", String(OPEN_LEAD_SILENCE_S), "-sample_fmt", "s16", leadSil,
    ]);
    concatParts.push(leadSil);

    let cursorSec = OPEN_LEAD_SILENCE_S;
    const allWords = [];

    for (let i = 0; i < prepared.length; i++) {
      const beat = prepared[i];
      const prev = i > 0 ? prepared[i - 1] : null;
      const next = i + 1 < prepared.length ? prepared[i + 1] : null;
      const cacheKey = createHash("sha1")
        .update(JSON.stringify({ id: NARRATOR.id, model: TTS_MODEL, text: beat.ttsText, prev: prev?.ttsPlainNoTags ?? "", next: next?.ttsPlainNoTags ?? "" }))
        .digest("hex")
        .slice(0, 12);
      const mp3Path = join(voCacheDir, `el_${String(i).padStart(2, "0")}_${cacheKey}.mp3`);
      const alignPath = join(voCacheDir, `el_${String(i).padStart(2, "0")}_${cacheKey}.json`);

      let alignment;
      if (existsSync(mp3Path) && existsSync(alignPath)) {
        console.log(`  [${i + 1}/${prepared.length}] CACHED Scene${beat.scene}: ${beat.ttsPlainNoTags}`);
        alignment = JSON.parse(readFileSync(alignPath, "utf8"));
      } else {
        console.log(`  [${i + 1}/${prepared.length}] SYNTH  Scene${beat.scene}: ${beat.ttsText}`);
        const res = await client.textToSpeech.convertWithTimestamps(NARRATOR.id, {
          text: beat.ttsText,
          modelId: TTS_MODEL,
          languageCode: "id",
          outputFormat: "mp3_44100_128",
          applyTextNormalization: "on",
          voiceSettings: { stability: NARRATOR.stability, similarityBoost: NARRATOR.similarityBoost },
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
      const trimLead = aligned.length ? Math.max(0, Number((aligned[0].start - 0.14).toFixed(3))) : 0;
      const lastEnd = aligned.length ? aligned[aligned.length - 1].end : clipDur;
      const srcSpan = Math.max(0.12, Math.min(clipDur - trimLead, Number((lastEnd - trimLead + 0.14).toFixed(3))));
      const trimWav = join(tmpDir, `beat_${i}_trim.wav`);
      const afChain = TEMPO === 1.0 ? "afade=t=in:st=0:d=0.008" : `atempo=${TEMPO},afade=t=in:st=0:d=0.008`;
      execFileSync("ffmpeg", [
        "-y", "-loglevel", "error", "-ss", String(trimLead), "-i", rawWav, "-t", String(srcSpan),
        "-af", afChain, "-sample_fmt", "s16", trimWav,
      ]);
      const actualDur = getDurationSec(trimWav);
      const fadeWav = join(tmpDir, `beat_${i}_fade.wav`);
      execFileSync("ffmpeg", [
        "-y", "-loglevel", "error", "-i", trimWav,
        "-af", `afade=t=out:st=${Math.max(0, actualDur - 0.015).toFixed(3)}:d=0.015`, "-sample_fmt", "s16", fadeWav,
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
      execFileSync("ffmpeg", [
        "-y", "-loglevel", "error", "-f", "lavfi", "-i", `anullsrc=r=${SR}:cl=mono`,
        "-t", String(beat.pauseAfterS), "-sample_fmt", "s16", silWav,
      ]);
      concatParts.push(silWav);
      cursorSec += beat.pauseAfterS;
    }

    const concatList = join(tmpDir, "concat.txt");
    writeFileSync(concatList, concatParts.map((p) => `file '${p.replace(/\\/g, "/")}'`).join("\n"), "utf8");
    execFileSync("ffmpeg", [
      "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", concatList,
      "-af", "loudnorm=I=-16:TP=-2.0:LRA=6:linear=true", "-ar", String(SR), "-ac", "1", "-sample_fmt", "s16", outVoWav,
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
      if (sceneStartsSec[w.scene] === undefined) sceneStartsSec[w.scene] = w.start;
    }

    const scenesFrame = {
      scene1Start: 0,
      scene2Start: Math.max(0, Math.round((sceneStartsSec[2] - 0.22) * FPS)),
      scene3Start: Math.max(0, Math.round((sceneStartsSec[3] - 0.22) * FPS)),
      scene4Start: Math.max(0, Math.round((sceneStartsSec[4] - 0.22) * FPS)),
      scene5Start: Math.max(0, Math.round((sceneStartsSec[5] - 0.22) * FPS)),
      scene6Start: Math.max(0, Math.round((sceneStartsSec[6] - 0.22) * FPS)),
      scene7Start: Math.max(0, Math.round((sceneStartsSec[7] - 0.22) * FPS)),
      scene8Start: Math.max(0, Math.round((sceneStartsSec[8] - 0.24) * FPS)),
      closingCardStart: Math.max(0, Math.round((voDur + 0.15) * FPS)),
      totalFrames,
    };

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
      scenesFrame,
      words: allWords,
    };
    writeFileSync(outAlignJson, JSON.stringify(alignObj, null, 2) + "\n", "utf8");

    const storyTs = `// AUTO-GENERATED by membangun-rumah/scripts/build_vo_elevenlabs.mjs
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
  id: "MembangunRumahShort",
  width: 1080,
  height: 1920,
  fps: ${FPS},
  durationInFrames: ${totalFrames},
  durationSec: ${totalVideoSec},
  audioMasterPath: "membangun-rumah/audio_master.m4a",
} as const;

export const SCENES = ${JSON.stringify(scenesFrame, null, 2)} as const;

export const CUES = ${JSON.stringify(cueMapFrame, null, 2)} as const;

export const CUES_SEC = ${JSON.stringify(cueMapSec, null, 2)} as const;

export const SUBTITLE_CHUNKS: SubtitleChunk[] = ${JSON.stringify(subtitleChunks, null, 2)};
`;
    writeFileSync(outStoryTs, storyTs, "utf8");
    console.log(`ELEVENLABS VO COMPLETE -> ${outVoWav} (${voDur.toFixed(2)}s VO | ${totalVideoSec.toFixed(2)}s video / ${totalFrames} frames)`);
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
