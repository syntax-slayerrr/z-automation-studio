/**
 * Audio-First VO & Bespoke SFX Generator for "SejarahKomunikasiShort"
 * ("5 Lompatan Komunikasi yang Mengubah Dunia" — Earth-24h Gouache Silhouette Diorama Style)
 *
 * - Narrator: Brian (`nPczCjzI2devNBz1zQrb`, Warm Documentary Baritone) via ElevenLabs `eleven_v4` (`id`).
 * - Character-level timestamps (`convertWithTimestamps`) extract exact millisecond timing for every word
 *   and all storyboard [[cue]] anchors, plus deckle-edge parchment subtitle cards (1-2 lines, max ~24 chars/line).
 * - Generates 6 bespoke era SFX via ElevenLabs `eleven_text_to_sound_v3` (cached by filename).
 * - Outputs:
 *     1. `sejarah-komunikasi/audio/vo_master.wav`
 *     2. `sejarah-komunikasi/audio/sfx/*.mp3`
 *     3. `sejarah-komunikasi/audio/alignment.json`
 *     4. `remotion/videos/sejarah-komunikasi/story.ts`
 *
 * Run:
 *   node --env-file=.env sejarah-komunikasi/scripts/build_vo_and_sfx.mjs
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
const TEMPO = 1.14;
const OPEN_LEAD_SILENCE_S = 0.25;
const END_TAIL_PAD_S = 2.00;

const NARRATOR = {
  id: "nPczCjzI2devNBz1zQrb", // Brian — Warm, Resonant Documentary Baritone
  label: "Brian (Warm Documentary Baritone)",
  stability: 0.54,
  similarityBoost: 0.78,
};

const BEATS = [
  // SCENE 1 — LOMPATAN 1: LUKISAN GUA (±45.000 SM)
  {
    scene: 1,
    pauseAfterS: 0.26,
    text: "[calm] [[s1_cave]]Empat puluh lima ribu tahun lalu, manusia meninggalkan [[s1_hand]]pesan pertamanya di dinding gua yang gelap.",
  },
  {
    scene: 1,
    pauseAfterS: 0.26,
    text: "[thoughtful] Bukan dengan huruf, melainkan cap tangan dan [[s1_beast]]lukisan buruan yang mampu bertahan melampaui umur pembuatnya.",
  },
  {
    scene: 1,
    pauseAfterS: 0.48,
    text: "[serious tone] Namun selama puluhan ribu tahun, pesan itu [[s1_stone]]terkunci di satu tempat. Siapa pun yang ingin membacanya harus datang ke batu itu.",
  },

  // SCENE 2 — LOMPATAN 2: TULISAN PERTAMA MESOPOTAMIA (±3.400 SM)
  {
    scene: 2,
    pauseAfterS: 0.24,
    text: "[steady] [[s2_mesopotamia]]Lompatan kedua baru terjadi tiga ribu empat ratus tahun Sebelum Masehi di tanah Mesopotamia.",
  },
  {
    scene: 2,
    pauseAfterS: 0.48,
    text: "[warm] Manusia menggoreskan [[s2_cuneiform]]simbol paku di atas lempung basah. Untuk pertama kalinya, suara berubah menjadi [[s2_travel]]tulisan yang bisa dibawa melintasi gurun.",
  },

  // SCENE 3 — LOMPATAN 3: MESIN CETAK GUTENBERG (1440)
  {
    scene: 3,
    pauseAfterS: 0.24,
    text: "[thoughtful] [[s3_scribe]]Namun buku masih harus disalin dengan tangan selama berabad-abad, hingga tahun [[s3_year1440]]seribu empat ratus empat puluh.",
  },
  {
    scene: 3,
    pauseAfterS: 0.48,
    text: "[resonant] [[s3_press]]Mesin cetak Gutenberg mengubah satu naskah menjadi [[s3_pages]]ribuan lembar dalam hitungan hari. Ilmu pengetahuan tak lagi milik segelintir bangsawan.",
  },

  // SCENE 4 — LOMPATAN 4: TELEGRAF & TELEPON (1876)
  {
    scene: 4,
    pauseAfterS: 0.24,
    text: "[serious tone] [[s4_year1876]]Lalu pada tahun seribu delapan ratus tujuh puluh enam, jarak fisik runtuh sepenuhnya.",
  },
  {
    scene: 4,
    pauseAfterS: 0.48,
    text: "[steady] Lewat [[s4_pulse]]denyut listrik di kabel tembaga dan [[s4_phone]]telepon pertama, suara manusia menyeberangi samudra dalam hitungan detik.",
  },

  // SCENE 5 — LOMPATAN 5A: JARINGAN INTERNET DUNIA (1991)
  {
    scene: 5,
    pauseAfterS: 0.44,
    text: "[warm] [[s5_internet]]Tahun seribu sembilan ratus sembilan puluh satu, internet menyatukan [[s5_globe]]miliaran pikiran ke dalam satu jaringan raksasa.",
  },

  // SCENE 6 — LOMPATAN 5B: KECERDASAN BUATAN & RESIDUE (HARI INI)
  {
    scene: 6,
    pauseAfterS: 0.30,
    text: "[resonant] [[s6_ai]]Dan hari ini, di puncak lima lompatan itu, lahirlah kecerdasan buatan. Mesin yang tak lagi sekadar menyimpan pesan kita, tetapi [[s6_reply]]ikut menjawabnya.",
  },
  {
    scene: 6,
    pauseAfterS: 0.20,
    text: "[quietly] [[s6_echo]]Dari cap tangan di batu gua hingga pikiran di dalam cahaya, manusia selalu mencari satu hal yang sama: [[s6_eternal]]agar suaranya tidak hilang ditelan waktu.",
  },
];

const BESPOKE_SFX = [
  {
    name: "sfx_cave_torch_echo.mp3",
    durationSeconds: 6.0,
    promptInfluence: 0.58,
    prompt: "Deep prehistoric limestone cave ambience with warm flickering wooden torch fire crackling softly and a gentle resonant stone hand slap echo, cinematic documentary foley, no music",
  },
  {
    name: "sfx_clay_stylus_carve.mp3",
    durationSeconds: 4.5,
    promptInfluence: 0.62,
    prompt: "Tactile close-up sound of a wooden reed stylus carving crisp cuneiform grooves into wet clay and soft desert wind blowing fine sand, realistic historical documentary foley, no music",
  },
  {
    name: "sfx_gutenberg_press_pages.mp3",
    durationSeconds: 5.0,
    promptInfluence: 0.62,
    prompt: "Heavy antique wooden printing press lever cranking down with a solid mechanical thud followed by crisp parchment paper sheets fluttering into the air, realistic documentary foley, no music",
  },
  {
    name: "sfx_telegraph_ocean_pulse.mp3",
    durationSeconds: 5.0,
    promptInfluence: 0.60,
    prompt: "Submerged deep ocean ambience combined with warm vintage telegraph electrical pulse clicks and resonant copper wire harmonic hum traveling across the sea, cinematic sound design, no music",
  },
  {
    name: "sfx_global_network_shimmer.mp3",
    durationSeconds: 5.5,
    promptInfluence: 0.58,
    prompt: "Cinematic fiber-optic data streams and warm celestial glass harmonics expanding around the globe, futuristic yet organic documentary sound design, no music",
  },
  {
    name: "sfx_neural_awakening_chime.mp3",
    durationSeconds: 6.0,
    promptInfluence: 0.58,
    prompt: "Deep warm resonant neural awakening chord with delicate crystalline synaptic sparks and a timeless contemplative sub-bass glow, cinematic documentary finale sound design",
  },
];

function stripTagsAndExtractCues(raw) {
  let s = raw.replace(/\[(?![\[])[^\][]*\](?!\])/g, "").replace(/\s+/g, " ").trim();
  const cueRegex = /\[\[([a-zA-Z0-9_]+)\]\]/g;
  const cues = [];
  let out = "";
  let lastIdx = 0;
  let match;
  while ((match = cueRegex.exec(s)) !== null) {
    out += s.slice(lastIdx, match.index);
    cues.push({ name: match[1], charIndex: out.length });
    lastIdx = match.index + match[0].length;
  }
  out += s.slice(lastIdx);
  return { cleanText: out.trim(), cues };
}

function parseWordsFromAlignment(cleanText, alignment, scaleFactor = 1.0) {
  const chars = alignment?.characters || alignment?.normalized_alignment?.characters || [];
  const starts = alignment?.characterStartTimesSeconds || alignment?.character_start_times_seconds || alignment?.normalized_alignment?.character_start_times_seconds || [];
  const ends = alignment?.characterEndTimesSeconds || alignment?.character_end_times_seconds || alignment?.normalized_alignment?.character_end_times_seconds || [];

  if (!chars.length) {
    throw new Error("Missing character alignment from ElevenLabs convertWithTimestamps");
  }

  const charTimeAt = (targetIdx) => {
    const clamped = Math.max(0, Math.min(starts.length - 1, targetIdx));
    return (starts[clamped] ?? 0) * scaleFactor;
  };

  const words = [];
  let cur = "";
  let wStart = null;
  let wEnd = 0;
  let wCharStart = 0;
  let inBracket = false;
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const st = (starts[i] ?? wEnd) * scaleFactor;
    const en = (ends[i] ?? st) * scaleFactor;
    if (ch === "[") {
      inBracket = true;
      continue;
    }
    if (ch === "]") {
      inBracket = false;
      continue;
    }
    if (inBracket) {
      continue;
    }
    if (/\s/.test(ch)) {
      if (cur.length > 0) {
        words.push({ word: cur, start: wStart ?? st, end: wEnd, charIndex: wCharStart });
        cur = "";
        wStart = null;
      }
    } else {
      if (cur.length === 0) {
        wStart = st;
        wCharStart = i;
      }
      cur += ch;
      wEnd = en;
    }
  }
  if (cur.length > 0) {
    words.push({ word: cur, start: wStart ?? 0, end: wEnd, charIndex: wCharStart });
  }
  return { words, charTimeAt };
}

function getWavDurationSec(wavPath) {
  const out = execFileSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", wavPath],
    { encoding: "utf8" }
  ).trim();
  return parseFloat(out);
}

/**
 * Group timed words into Earth-24h style Deckle-Edge Parchment Subtitle Cards
 * (1 or 2 lines per card, max ~24 characters per line so 40px bold font fits cleanly inside 720px canvas).
 */
function buildEarth24hSubtitleCards(allWords) {
  const cards = [];
  const MAX_LINE_CHARS = 23;
  const MAX_LINES = 2;
  const MAX_WORDS_PER_CARD = 6;

  let idx = 0;
  while (idx < allWords.length) {
    const cardWords = [];
    const lines = [""];
    let lineIdx = 0;

    while (idx < allWords.length && cardWords.length < MAX_WORDS_PER_CARD) {
      const wObj = allWords[idx];
      const cleanW = wObj.word.replace(/[.,!?;:]+$/g, "");
      const candidate = lines[lineIdx].length === 0 ? wObj.word : `${lines[lineIdx]} ${wObj.word}`;

      if (candidate.length <= MAX_LINE_CHARS || lines[lineIdx].length === 0) {
        lines[lineIdx] = candidate;
        cardWords.push({ ...wObj, displayWord: wObj.word });
        idx++;
        // Break card naturally on sentence-ending punctuation
        if (/[.!?]$/.test(wObj.word)) {
          break;
        }
        // Or break after comma if already on line 2 or >= 3 words
        if (/[,;:]$/.test(wObj.word) && (lineIdx === 1 || cardWords.length >= 3)) {
          break;
        }
      } else if (lineIdx + 1 < MAX_LINES) {
        lineIdx++;
        lines.push(wObj.word);
        cardWords.push({ ...wObj, displayWord: wObj.word });
        idx++;
        if (/[.!?]$/.test(wObj.word)) {
          break;
        }
      } else {
        break;
      }
    }

    const startFrame = Math.max(4, Math.round(cardWords[0].start * FPS) - 1);
    const lastEndFrame = Math.round(cardWords[cardWords.length - 1].end * FPS) + 4;
    const nextStartFrame = idx < allWords.length ? Math.round(allWords[idx].start * FPS) - 2 : lastEndFrame + 18;
    const endFrame = Math.max(startFrame + 10, Math.min(lastEndFrame + 8, nextStartFrame));

    const highlights = cardWords.map((cw, wI) => [
      Math.max(startFrame, Math.round(cw.start * FPS)),
      Math.max(Math.round(cw.start * FPS) + 2, Math.round(cw.end * FPS)),
      wI,
    ]);

    cards.push({
      startFrame,
      endFrame,
      lines: lines.filter((l) => l.trim().length > 0),
      highlights,
    });
  }

  return cards;
}

async function main() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY not found in .env");
  }
  const client = new ElevenLabsClient({ apiKey });

  const audioDir = join(PROJECT, "audio");
  const sfxDir = join(audioDir, "sfx");
  const cacheDir = join(PROJECT, ".audio-cache");
  mkdirSync(audioDir, { recursive: true });
  mkdirSync(sfxDir, { recursive: true });
  mkdirSync(cacheDir, { recursive: true });

  console.log(`=== [1/3] Synthesizing ${BEATS.length} Documentary VO Beats (${TTS_MODEL}, voice=${NARRATOR.label}, tempo=${TEMPO}x) ===`);

  const tmpDir = mkdtempSync(join(cacheDir, "tmp-"));
  const concatParts = [];
  const allWords = [];
  const cuesSec = {};
  const sceneStartSec = {};

  const leadSilWav = join(tmpDir, "lead_silence.wav");
  execFileSync("ffmpeg", [
    "-y", "-loglevel", "error",
    "-f", "lavfi", "-i", `anullsrc=r=${SR}:cl=mono`,
    "-t", OPEN_LEAD_SILENCE_S.toFixed(3),
    "-c:a", "pcm_s16le", leadSilWav,
  ]);
  concatParts.push(leadSilWav);
  let cursorSec = OPEN_LEAD_SILENCE_S;

  try {
    for (let i = 0; i < BEATS.length; i++) {
      const beat = BEATS[i];
      const { cleanText, cues } = stripTagsAndExtractCues(beat.text);
      const taggedText = beat.text.replace(/\[\[[a-zA-Z0-9_]+\]\]/g, "").replace(/\s+/g, " ").trim();

      const hash = createHash("sha256")
        .update(JSON.stringify({ v: 1, model: TTS_MODEL, voice: NARRATOR.id, tempo: TEMPO, text: taggedText }))
        .digest("hex")
        .slice(0, 14);
      const cacheMp3 = join(cacheDir, `beat_${String(i + 1).padStart(2, "0")}_${hash}.mp3`);
      const cacheAlign = join(cacheDir, `beat_${String(i + 1).padStart(2, "0")}_${hash}.align.json`);

      let alignment;
      if (existsSync(cacheMp3) && existsSync(cacheAlign)) {
        console.log(`  [cached] Beat #${i + 1} (Scene ${beat.scene}): "${cleanText.slice(0, 56)}..."`);
        alignment = JSON.parse(readFileSync(cacheAlign, "utf8"));
      } else {
        console.log(`  [eleven_v4] Beat #${i + 1} (Scene ${beat.scene}): "${cleanText}"`);
        const res = await client.textToSpeech.convertWithTimestamps(NARRATOR.id, {
          text: taggedText,
          modelId: TTS_MODEL,
          outputFormat: "mp3_44100_128",
          languageCode: "id",
          voiceSettings: {
            stability: NARRATOR.stability,
            similarityBoost: NARRATOR.similarityBoost,
            style: 0.14,
            useSpeakerBoost: true,
          },
        });
        const audioBase64 = res.audioBase64 ?? res.audio_base64;
        alignment = res.alignment ?? res.normalizedAlignment ?? res.normalized_alignment;
        writeFileSync(cacheMp3, Buffer.from(audioBase64, "base64"));
        writeFileSync(cacheAlign, JSON.stringify(alignment, null, 2));
      }

      const rawWav = join(tmpDir, `raw_${i}.wav`);
      const trimmedWav = join(tmpDir, `trim_${i}.wav`);
      execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", cacheMp3, "-ar", String(SR), "-ac", "1", rawWav]);
      execFileSync("ffmpeg", [
        "-y", "-loglevel", "error",
        "-i", rawWav,
        "-af", `atempo=${TEMPO.toFixed(3)},silenceremove=start_periods=1:start_duration=0.02:start_threshold=-46dB:stop_periods=-1:stop_duration=0.08:stop_threshold=-46dB,afade=t=in:st=0:d=0.015`,
        "-ar", String(SR), "-ac", "1", "-c:a", "pcm_s16le",
        trimmedWav,
      ]);

      const rawDur = getWavDurationSec(rawWav);
      const trimDur = getWavDurationSec(trimmedWav);
      const scaleFactor = rawDur > 0.05 ? trimDur / rawDur : 1.0 / TEMPO;

      if (sceneStartSec[beat.scene] === undefined) {
        sceneStartSec[beat.scene] = Number(cursorSec.toFixed(3));
      }

      const { words, charTimeAt } = parseWordsFromAlignment(cleanText, alignment, scaleFactor);
      for (const w of words) {
        allWords.push({
          word: w.word,
          scene: beat.scene,
          start: Number((cursorSec + w.start).toFixed(3)),
          end: Number((cursorSec + w.end).toFixed(3)),
        });
      }
      for (const c of cues) {
        cuesSec[c.name] = Number((cursorSec + charTimeAt(c.charIndex)).toFixed(3));
      }

      concatParts.push(trimmedWav);
      cursorSec += trimDur;

      const pauseS = beat.pauseAfterS ?? 0.25;
      const pauseWav = join(tmpDir, `pause_${i}.wav`);
      execFileSync("ffmpeg", [
        "-y", "-loglevel", "error",
        "-f", "lavfi", "-i", `anullsrc=r=${SR}:cl=mono`,
        "-t", pauseS.toFixed(3),
        "-c:a", "pcm_s16le", pauseWav,
      ]);
      concatParts.push(pauseWav);
      cursorSec += pauseS;
    }

    const tailWav = join(tmpDir, "tail_silence.wav");
    execFileSync("ffmpeg", [
      "-y", "-loglevel", "error",
      "-f", "lavfi", "-i", `anullsrc=r=${SR}:cl=mono`,
      "-t", END_TAIL_PAD_S.toFixed(3),
      "-c:a", "pcm_s16le", tailWav,
    ]);
    concatParts.push(tailWav);
    cursorSec += END_TAIL_PAD_S;

    const listFile = join(tmpDir, "concat.txt");
    writeFileSync(listFile, concatParts.map((p) => `file '${p.replace(/\\/g, "/")}'`).join("\n"));
    const voMasterWav = join(audioDir, "vo_master.wav");
    execFileSync("ffmpeg", [
      "-y", "-loglevel", "error",
      "-f", "concat", "-safe", "0", "-i", listFile,
      "-af", "highpass=f=75,lowpass=f=13500,equalizer=f=180:t=q:w=1.1:g=1.6,equalizer=f=3400:t=q:w=1.2:g=1.4,acompressor=threshold=-19dB:ratio=2.4:attack=12:release=140:makeup=2.2dB,alimiter=limit=0.93",
      "-ar", String(SR), "-ac", "1", "-c:a", "pcm_s16le",
      voMasterWav,
    ]);
    console.log(`  VO Master written -> ${voMasterWav} (${cursorSec.toFixed(2)}s)`);
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }

  console.log(`\n=== [2/3] Generating ${BESPOKE_SFX.length} Bespoke Cinema SFX via ElevenLabs (${SFX_MODEL}) ===`);
  for (const sfx of BESPOKE_SFX) {
    const outMp3 = join(sfxDir, sfx.name);
    if (existsSync(outMp3)) {
      console.log(`  [cached] ${sfx.name}`);
      continue;
    }
    console.log(`  [Sound-V3] Generating ${sfx.name} (${sfx.durationSeconds}s)...`);
    const audioStream = await client.textToSoundEffects.convert({
      text: sfx.prompt,
      modelId: SFX_MODEL,
      durationSeconds: sfx.durationSeconds,
      promptInfluence: sfx.promptInfluence,
    });
    const nodeStream = Readable.from(audioStream);
    await finished(nodeStream.pipe(createWriteStream(outMp3)));
  }

  const totalVideoSec = Number(cursorSec.toFixed(2));
  const totalFrames = Math.ceil(totalVideoSec * FPS);

  const cuesFrame = Object.fromEntries(
    Object.entries(cuesSec).map(([k, v]) => [k, Math.round(v * FPS)])
  );
  const scenesFrame = {
    s1Start: 0,
    s2Start: Math.max(1, Math.round((sceneStartSec[2] ?? 14) * FPS) - 6),
    s3Start: Math.max(1, Math.round((sceneStartSec[3] ?? 26) * FPS) - 6),
    s4Start: Math.max(1, Math.round((sceneStartSec[4] ?? 38) * FPS) - 6),
    s5Start: Math.max(1, Math.round((sceneStartSec[5] ?? 49) * FPS) - 6),
    s6Start: Math.max(1, Math.round((sceneStartSec[6] ?? 56) * FPS) - 6),
    totalFrames,
  };

  const subtitleCards = buildEarth24hSubtitleCards(allWords);

  const alignmentPayload = {
    fps: FPS,
    totalVideoSec,
    totalFrames,
    tempo: TEMPO,
    voice: `${NARRATOR.label} (${NARRATOR.id})`,
    model: TTS_MODEL,
    sceneStartSec,
    scenesFrame,
    cuesSec,
    cuesFrame,
    subtitleCards,
    words: allWords,
  };

  const alignPath = join(audioDir, "alignment.json");
  writeFileSync(alignPath, JSON.stringify(alignmentPayload, null, 2));

  const storyTsDir = join(ROOT, "remotion", "videos", "sejarah-komunikasi");
  mkdirSync(storyTsDir, { recursive: true });
  const storyTsPath = join(storyTsDir, "story.ts");
  const storyTsContent = `/**
 * Auto-generated from ElevenLabs eleven_v4 character timestamps
 * by \`sejarah-komunikasi/scripts/build_vo_and_sfx.mjs\`.
 */
export interface SubtitleCardSpec {
  startFrame: number;
  endFrame: number;
  lines: string[];
  highlights: Array<[number, number, number]>;
}

export const KOMUNIKASI_FPS = ${FPS};
export const KOMUNIKASI_FRAMES = ${totalFrames};

export const SCENES = ${JSON.stringify(scenesFrame, null, 2)} as const;

export const CUES = ${JSON.stringify(cuesFrame, null, 2)} as const;

export const SUBTITLE_CARDS: SubtitleCardSpec[] = ${JSON.stringify(subtitleCards, null, 2)};
`;
  writeFileSync(storyTsPath, storyTsContent);
  console.log(`\n=== [3/3] Wrote ${alignPath} & ${storyTsPath} (${totalFrames} frames / ${totalVideoSec}s, ${subtitleCards.length} parchment cards) ===`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
