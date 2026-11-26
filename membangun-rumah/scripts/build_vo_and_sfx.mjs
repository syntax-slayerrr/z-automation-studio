/**
 * Audio-First VO Generator for "MembangunRumahShort"
 * ("Dari Masalah Menjadi Rumah" — 8-Scene 3D Architectural Cutaway Documentary, ±110-120s)
 *
 * - Primary Narrator: Andi (`a053f6bc-7df4-40de-96d4-de026bc47ce8`) via Cartesia `sonic-3.6` (`id`)
 *   with exact word-level timestamps (`add_timestamps: true`), SHA-1 beat caching, and natural documentary tempo.
 * - Exports exact word timestamps, 25 [[cue]] storyboard anchors, 8 scene boundaries, and clean
 *   progressive word-by-word subtitle chunks directly to:
 *     `remotion/videos/membangun-rumah/story.ts` & `membangun-rumah/audio/alignment.json`
 *
 * Run:
 *   node --env-file=.env membangun-rumah/scripts/build_vo_and_sfx.mjs
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

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT = resolve(__dirname, "..");
const ROOT = resolve(PROJECT, "..");

const API_KEY = process.env.CARTESIA_API_KEY;
if (!API_KEY) {
  throw new Error("CARTESIA_API_KEY is missing from .env!");
}

const CARTESIA_URL = "https://api.cartesia.ai/tts/sse";
const CARTESIA_MODEL = "sonic-3.6";
const VOICE_ID = "a053f6bc-7df4-40de-96d4-de026bc47ce8"; // Andi — Native Indonesian Warm Documentary Storyteller
const VOICE_LABEL = "Andi (Warm Indonesian Documentary Storyteller)";

const SR = 44100;
const FPS = 30;
const TEMPO = 1.0; // Natural warm documentary cadence (~110-118s target!)
const OPEN_LEAD_SILENCE_S = 0.25;
const END_TAIL_PAD_S = 3.8; // Closing wide pullback + "Semuanya dimulai dari sebuah kebutuhan."

// 100% VERBATIM 8-Scene User Script with [[cue]] storyboard anchors
const BEATS = [
  // SCENE 1 — MASALAH (0–12 detik)
  {
    scene: 1,
    pauseAfterS: 0.38,
    text: "[[s1_rain]]Bayangkan setiap hari kamu harus menghadapi panas terik, [[s1_puddle]]hujan deras, dan tidak punya tempat yang benar-benar bisa melindungimu.",
  },
  {
    scene: 1,
    pauseAfterS: 0.36,
    text: "[[s1_heat]]Tempat untuk beristirahat saja terasa sulit ditemukan.",
  },
  {
    scene: 1,
    pauseAfterS: 0.58,
    text: "[[s1_idea]]Lalu, bagaimana kalau kita membangun tempat tinggal sendiri?",
  },

  // SCENE 2 — MENCARI SOLUSI (12–24 detik)
  {
    scene: 2,
    pauseAfterS: 0.34,
    text: "[[s2_ghost]]Untuk mengatasi masalah itu, kita membutuhkan tempat tinggal yang mampu melindungi dari cuaca, [[s2_blueprint]]memberikan privasi, dan menyediakan ruang untuk beraktivitas.",
  },
  {
    scene: 2,
    pauseAfterS: 0.28,
    text: "[[s2_rooms]]Tapi rumah tidak bisa dibangun begitu saja.",
  },
  {
    scene: 2,
    pauseAfterS: 0.58,
    text: "[[s2_model3d]]Semuanya harus direncanakan.",
  },

  // SCENE 3 — MENYIAPKAN TEMPAT (24–36 detik)
  {
    scene: 3,
    pauseAfterS: 0.36,
    text: "[[s3_aerial]]Pertama, kita perlu menentukan lokasi dan memeriksa kondisi tanah.",
  },
  {
    scene: 3,
    pauseAfterS: 0.58,
    text: "Setelah desain dan perhitungan struktur selesai, [[s3_clear]]lahan dibersihkan, diratakan, [[s3_stakes]]dan diukur sesuai ukuran [[s3_grid]]bangunan.",
  },

  // SCENE 4 — MEMBANGUN DASAR YANG KUAT (36–51 detik)
  {
    scene: 4,
    pauseAfterS: 0.34,
    text: "[[s4_dive]]Namun, sebelum dinding berdiri, ada satu bagian penting yang harus dibuat terlebih dahulu: [[s4_trench]]fondasi.",
  },
  {
    scene: 4,
    pauseAfterS: 0.34,
    text: "Tanah digali, kemudian [[s4_stones]]fondasi dibangun sesuai kondisi tanah dan [[s4_rebar]]desain struktur.",
  },
  {
    scene: 4,
    pauseAfterS: 0.58,
    text: "[[s4_load]]Fondasi inilah yang membantu menyalurkan beban bangunan ke tanah.",
  },

  // SCENE 5 — MEMBANGUN STRUKTUR (51–65 detik)
  {
    scene: 5,
    pauseAfterS: 0.32,
    text: "[[s5_columns]]Setelah fondasi siap, struktur rumah mulai tumbuh.",
  },
  {
    scene: 5,
    pauseAfterS: 0.34,
    text: "Kolom dan [[s5_beams]]balok dibangun untuk membentuk [[s5_frame]]kerangka yang menopang bangunan.",
  },
  {
    scene: 5,
    pauseAfterS: 0.58,
    text: "[[s5_orbit]]Kini, rumah mulai memiliki bentuk.",
  },

  // SCENE 6 — MEMBENTUK RUANG TINGGAL (65–80 detik)
  {
    scene: 6,
    pauseAfterS: 0.34,
    text: "[[s6_bricks]]Berikutnya, dinding disusun untuk membagi ruang dan [[s6_openings]]melindungi bagian dalam rumah.",
  },
  {
    scene: 6,
    pauseAfterS: 0.34,
    text: "[[s6_truss]]Rangka atap dipasang, kemudian ditutup dengan [[s6_tiles]]genteng.",
  },
  {
    scene: 6,
    pauseAfterS: 0.58,
    text: "[[s6_building]]Perlahan, kerangka tadi berubah menjadi sebuah bangunan.",
  },

  // SCENE 7 — MEMBUATNYA LAYAK DIHUNI (80–98 detik)
  {
    scene: 7,
    pauseAfterS: 0.3,
    text: "[[s7_cutaway]]Tapi bangunan saja belum cukup untuk disebut rumah.",
  },
  {
    scene: 7,
    pauseAfterS: 0.34,
    text: "[[s7_utilities]]Instalasi listrik dan air harus dipasang.",
  },
  {
    scene: 7,
    pauseAfterS: 0.34,
    text: "[[s7_plaster]]Dinding diplester dan dicat, [[s7_ceramic]]lantai dipasang, serta [[s7_lights]]pintu dan jendela dilengkapi.",
  },
  {
    scene: 7,
    pauseAfterS: 0.58,
    text: "[[s7_furniture]]Setiap bagian mulai memiliki fungsinya.",
  },

  // SCENE 8 — SOLUSI (98–115 detik)
  {
    scene: 8,
    pauseAfterS: 0.36,
    text: "[[s8_complete]]Dan akhirnya, sebidang tanah kosong telah berubah menjadi tempat tinggal.",
  },
  {
    scene: 8,
    pauseAfterS: 0.36,
    text: "[[s8_rain_safe]]Kini ada atap untuk berlindung dari hujan, dinding untuk melindungi diri, dan [[s8_family]]ruang untuk beristirahat bersama keluarga.",
  },
  {
    scene: 8,
    pauseAfterS: 0.32,
    text: "[[s8_pullback]]Karena pada akhirnya, rumah bukan hanya tentang bangunan.",
  },
  {
    scene: 8,
    pauseAfterS: 0.2,
    text: "[[s8_closing]]Tetapi tentang tempat kita merasa aman.",
  },
];

function prepareBeat(rawText, lineIdx) {
  const displayTokens = [];
  for (const tok of rawText.trim().split(/\s+/)) {
    if (!tok) continue;
    const m = tok.match(/^(?:\[\[([^\]]+)\]\])?(.*)$/);
    const cue = m[1] || null;
    const disp = m[2];
    if (!disp) continue;
    displayTokens.push({ w: disp, cue, line: lineIdx });
  }
  const plain = displayTokens.map((x) => x.w).join(" ").replace(/\s{2,}/g, " ").trim();
  return { displayTokens, plain };
}

function writePcm16MonoWav(filePath, pcmBuf, sampleRate = SR) {
  const header = Buffer.alloc(44);
  const dataSize = pcmBuf.length;
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // Mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);
  writeFileSync(filePath, Buffer.concat([header, pcmBuf]));
}

async function synthCartesiaBeat(transcript) {
  const resp = await fetch(CARTESIA_URL, {
    method: "POST",
    headers: {
      "X-API-Key": API_KEY,
      "Cartesia-Version": "2024-06-10",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model_id: CARTESIA_MODEL,
      transcript,
      voice: { mode: "id", id: VOICE_ID },
      output_format: {
        container: "raw",
        encoding: "pcm_s16le",
        sample_rate: SR,
      },
      language: "id",
      add_timestamps: true,
    }),
  });
  if (!resp.ok) {
    const errBody = await resp.text();
    throw new Error(`Cartesia TTS HTTP ${resp.status}: ${errBody}`);
  }

  const text = await resp.text();
  const audioChunks = [];
  const timestamps = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line.startsWith("data:")) continue;
    const payloadStr = line.slice(5).trim();
    if (!payloadStr) continue;
    try {
      const msg = JSON.parse(payloadStr);
      if (msg.type === "chunk" && msg.data) {
        audioChunks.push(Buffer.from(msg.data, "base64"));
      } else if (msg.type === "timestamps" && msg.word_timestamps) {
        const ws = msg.word_timestamps.words ?? [];
        const ss = msg.word_timestamps.start ?? [];
        const es = msg.word_timestamps.end ?? [];
        for (let k = 0; k < ws.length; k++) {
          timestamps.push({ text: ws[k], start: ss[k], end: es[k] });
        }
      }
    } catch {
      // Ignore non-JSON SSE control lines
    }
  }
  return { pcm: Buffer.concat(audioChunks), timestamps };
}

function normWord(s) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function alignDisplayToRuns(displayTokens, spokenRuns, fallbackDur) {
  if (!spokenRuns.length) {
    const step = fallbackDur / Math.max(1, displayTokens.length);
    return displayTokens.map((dt, idx) => ({
      ...dt,
      start: idx * step,
      end: (idx + 1) * step,
    }));
  }
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

function renderCleanNarratorWav(inWavPath, outWavPath) {
  const eq =
    "highpass=f=80,equalizer=f=160:t=q:w=1.1:g=1.5,equalizer=f=3200:t=q:w=1.3:g=1.8,equalizer=f=6500:t=q:w=1.4:g=-1.2";
  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-loglevel",
      "error",
      "-i",
      inWavPath,
      "-ar",
      String(SR),
      "-ac",
      "1",
      "-af",
      eq,
      "-sample_fmt",
      "s16",
      outWavPath,
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
      cur.push(w);
      const textLen = cur.map((x) => x.w).join(" ").length;
      const endsPunct = /[,.\?!:]$/.test(w.w);
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
  const tmpDir = mkdtempSync(join(tmpBase, "vo-build-"));

  try {
    console.log(
      `=== Synthesizing Cartesia ${CARTESIA_MODEL} Narrator VO (${VOICE_LABEL}, tempo=${TEMPO}x) ===`
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
      const cacheKey = createHash("sha1")
        .update(JSON.stringify({ id: VOICE_ID, model: CARTESIA_MODEL, text: beat.plain }))
        .digest("hex")
        .slice(0, 12);
      const wavCachePath = join(voCacheDir, `beat_${String(i).padStart(2, "0")}_${cacheKey}.wav`);
      const alignPath = join(voCacheDir, `beat_${String(i).padStart(2, "0")}_${cacheKey}.json`);

      let spokenRuns;
      if (existsSync(wavCachePath) && existsSync(alignPath)) {
        console.log(`  [${i + 1}/${prepared.length}] CACHED Scene${beat.scene}: ${beat.plain}`);
        spokenRuns = JSON.parse(readFileSync(alignPath, "utf8"));
      } else {
        console.log(`  [${i + 1}/${prepared.length}] SYNTH  Scene${beat.scene}: ${beat.plain}`);
        const { pcm, timestamps } = await synthCartesiaBeat(beat.plain);
        writePcm16MonoWav(wavCachePath, pcm, SR);
        spokenRuns = timestamps;
        writeFileSync(alignPath, JSON.stringify(spokenRuns, null, 2), "utf8");
      }

      const eqWav = join(tmpDir, `beat_${i}_eq.wav`);
      renderCleanNarratorWav(wavCachePath, eqWav);

      const clipDur = getDurationSec(eqWav);
      const aligned = alignDisplayToRuns(beat.displayTokens, spokenRuns, clipDur);
      // Generous 0.14s pre-onset margin so initial consonants NEVER clip!
      const trimLead = aligned.length ? Math.max(0, Number((aligned[0].start - 0.14).toFixed(3))) : 0;
      const lastEnd = aligned.length ? aligned[aligned.length - 1].end : clipDur;
      const srcSpan = Math.max(
        0.12,
        Math.min(clipDur - trimLead, Number((lastEnd - trimLead + 0.16).toFixed(3)))
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
        eqWav,
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

    const starts = [
      scenesFrame.scene1Start,
      scenesFrame.scene2Start,
      scenesFrame.scene3Start,
      scenesFrame.scene4Start,
      scenesFrame.scene5Start,
      scenesFrame.scene6Start,
      scenesFrame.scene7Start,
      scenesFrame.scene8Start,
      totalFrames,
    ];
    console.log("\n=== 8-SCENE DOCUMENTARY TIMING BREAKDOWN ===");
    for (let s = 1; s <= 8; s++) {
      const durS = ((starts[s] - starts[s - 1]) / FPS).toFixed(2);
      console.log(
        `  Scene ${s}: f=${starts[s - 1]}..${starts[s] - 1} (${(starts[s - 1] / FPS).toFixed(2)}s -> ${(
          starts[s] / FPS
        ).toFixed(2)}s | dur=${durS}s)`
      );
    }

    const subtitleChunks = buildSubtitleChunks(allWords);
    const alignObj = {
      voice: `${VOICE_LABEL} · Cartesia ${CARTESIA_MODEL}`,
      model: CARTESIA_MODEL,
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

    const storyTs = `// AUTO-GENERATED by membangun-rumah/scripts/build_vo_and_sfx.mjs
// Source: Cartesia ${CARTESIA_MODEL} word timestamps (${allWords.length} words, ${Object.keys(cueMapFrame).length} cues)

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
    console.log(
      `\nVO COMPLETE -> ${outVoWav} (${voDur.toFixed(2)}s VO | ${totalVideoSec.toFixed(
        2
      )}s video / ${totalFrames} frames | ${allWords.length} words | ${subtitleChunks.length} subtitle chunks)`
    );
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
