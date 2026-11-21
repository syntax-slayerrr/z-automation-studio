/**
 * Audio-First VO & Bespoke Mechanical SFX Generator for RelKeretaShort
 * ("Kenapa Rel Kereta Pakai Batu Kerikil (Balast) & Celah?")
 *
 * - ElevenLabs `eleven_v4` Indonesian conversational narration (`convertWithTimestamps`)
 * - Deterministic SHA-1 beat caching in `rel-kereta/audio/vo_cache/`
 * - 9 bespoke tactile railway/mechanical SFX via `eleven_text_to_sound_v3`
 * - Exports exact `rel-kereta/audio/alignment.json`, `rel-kereta/audio/vo_master.wav`,
 *   and typed `remotion/videos/rel-kereta/story.ts` (30 fps, clean short subtitle chunks, exact cue anchors!).
 *
 * Run:
 *   node --env-file=.env rel-kereta/scripts/build_vo_and_sfx.mjs
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
const TEMPO = 1.18; // Snappy, natural curious Indonesian explainer pace (~2.15 w/s)
const OPEN_LEAD_SILENCE_S = 0.22;
const END_LOOP_HOLD_S = 0.85; // Smooth glide hold that loops seamlessly into Beat 1!

const NARRATOR = {
  id: "nPczCjzI2devNBz1zQrb", // Brian — clear warm Indonesian articulation
  label: "Brian (Conversational Engineering Explainer)",
  stability: 0.48,
  similarityBoost: 0.78,
};

// 16 punchy conversational beats across 8 Acts with 21 exact [[cue]] anchors
// Designed with a Seamless Verbal Loop: final beat bridges grammatically straight into Beat 1!
const BEATS = [
  // BEAT 1 — PHYSICAL HOOK (LOOP ANCHOR = FRAME 0)
  {
    act: 1,
    pauseAfterS: 0.20,
    text: "[[b1_hook]]Kereta seberat seratus ton lewat di sini, tapi relnya cuma ditaruh di atas batu kerikil longgar.",
  },
  {
    act: 1,
    pauseAfterS: 0.34,
    text: "[[b1_why]]Kenapa nggak dicor beton mulus aja biar rata?",
  },

  // BEAT 2 — NAIVE ATTEMPT (BARE DIRT)
  {
    act: 2,
    pauseAfterS: 0.20,
    text: "[[b2_naive]]Coba deh kamu taruh bantalan rel langsung di atas tanah biasa.",
  },
  {
    act: 2,
    pauseAfterS: 0.32,
    text: "[[b2_train_heavy]]Begitu kereta pertama melintas, tanahnya langsung amblas.",
  },

  // BEAT 3 — CATASTROPHIC FAILURE + RED PRESSURE ARROWS + RAIN MUD
  {
    act: 3,
    pauseAfterS: 0.20,
    text: "[[b3_sink]]Beban puluhan ton menekan satu titik sempit ke bawah.",
  },
  {
    act: 3,
    pauseAfterS: 0.36,
    text: "[[b3_rain]]Pas hujan turun, tanah berubah jadi lumpur, relnya miring, dan [[b3_derail]]kereta bisa anjlok.",
  },

  // BEAT 4 — CUTAWAY SOLUTION #1: SHARP GRANITE BALLAST + MACRO DOF
  {
    act: 4,
    pauseAfterS: 0.22,
    text: "[[b4_pour]]Makanya insinyur menimbun batu pecah tajam yang disebut [[b4_ballast]]balast.",
  },
  {
    act: 4,
    pauseAfterS: 0.22,
    text: "[[b4_macro]]Perhatiin bentuknya — bukan batu sungai bulat yang licin, tapi tajam bersudut.",
  },
  {
    act: 4,
    pauseAfterS: 0.36,
    text: "[[b4_lock]]Begitu terinjak, sudutnya saling mengunci, menyebarkan beban lebar ke tanah, [[b4_drain]]sambil membuang air hujan ke bawah.",
  },

  // BEAT 5 — EVERYDAY TABLE ANALOGY: ROUND MARBLES VS SHARP STONES
  {
    act: 5,
    pauseAfterS: 0.24,
    text: "[[b5_table]]Bayangin bedanya kamu menekan tumpukan [[b5_marbles]]kelereng bulat — langsung menggelinding buyar.",
  },
  {
    act: 5,
    pauseAfterS: 0.36,
    text: "[[b5_stones]]Bandingin sama batu tajam yang saling menggigit — makin ditekan, malah makin kokoh.",
  },

  // BEAT 6 — HIDDEN TWIST: 60°C HEAT EXPANSION & "SUN KINK" RAIL BUCKLING
  {
    act: 6,
    pauseAfterS: 0.22,
    text: "[[b6_heat]]Tapi batu aja belum cukup. Di bawah terik matahari, suhu besi rel bisa tembus enam puluh derajat.",
  },
  {
    act: 6,
    pauseAfterS: 0.38,
    text: "[[b6_expand]]Baja memuai memanjang. Kalau rel disambung rapat tanpa ruang, [[b6_buckle]]tekanannya bikin rel melengkung kayak ular.",
  },

  // BEAT 7 — ENGINEERING SOLUTION #2: 10MM EXPANSION GAP + FISHPLATE BOLTS + CLACK-CLACK
  {
    act: 7,
    pauseAfterS: 0.22,
    text: "[[b7_gap]]Solusinya? Insinyur menyisakan celah kecil sekitar sepuluh milimeter di sambungan rel.",
  },
  {
    act: 7,
    pauseAfterS: 0.36,
    text: "[[b7_clack]]Celah inilah yang bikin bunyi khas jeglek-jeglek saat roda lewat, memberi ruang baja bernapas saat panas.",
  },

  // BEAT 8 — SEAMLESS VISUAL & VERBAL LOOP RETURN TO FRAME 0
  {
    act: 8,
    pauseAfterS: 0.18,
    text: "[[b8_harmony]]Batu tajam menahan beban, celah kecil meredam panas.",
  },
  {
    act: 8,
    pauseAfterS: END_LOOP_HOLD_S,
    text: "[[b8_loop]]Semua bekerja diam-diam di bawah roda baja, persis saat...",
  },
];

// Display replacements for crisp visual typography while keeping natural Indonesian spoken TTS
const DISPLAY_WORD_MAP = {
  "seratus": "100",
  "enam": "enam",
  "sepuluh": "10",
  "milimeter": "mm",
};

const BESPOKE_SFX = [
  {
    name: "train_pass_heavy.mp3",
    durationS: 4.5,
    prompt: "Heavy steel passenger train rumbling smoothly past over railway gravel tracks with crisp rhythmic clackety-clack, outdoor daytime realism, clean stereo foley",
  },
  {
    name: "mud_sink_squelch.mp3",
    durationS: 2.2,
    prompt: "Heavy wooden timber beam sinking into soft wet muddy earth with deep squelching soil and strained wooden creak, tactile realistic foley",
  },
  {
    name: "rain_drizzle.mp3",
    durationS: 4.5,
    prompt: "Steady natural tropical rain shower falling onto dirt and crushed gravel stones outdoors, clean realistic ambience",
  },
  {
    name: "gravel_pour_crunch.mp3",
    durationS: 2.8,
    prompt: "Sharp angular crushed granite gravel stones pouring and tumbling heavily into a solid rocky pile, crisp dry rocky crunch foley",
  },
  {
    name: "stone_lock_thud.mp3",
    durationS: 1.5,
    prompt: "Heavy solid stone compression locking firmly together under pressure, deep resonant tactile thud and rocky click",
  },
  {
    name: "marbles_scatter.mp3",
    durationS: 2.0,
    prompt: "Handful of smooth glass marbles scattering, clinking, and rolling rapidly across a solid wooden tabletop, crisp close-up foley",
  },
  {
    name: "steel_heat_buckle.mp3",
    durationS: 2.6,
    prompt: "Heavy steel railway rail groaning, creaking under intense thermal expansion stress and snapping into a tense bend, metallic engineering foley",
  },
  {
    name: "rail_clack_clack.mp3",
    durationS: 2.5,
    prompt: "Crisp rhythmic train steel wheels rolling over a railway expansion joint gap making distinct ta-dum ta-dum metallic clacks, clean close-up foley",
  },
  {
    name: "camera_whoosh_soft.mp3",
    durationS: 1.0,
    prompt: "Soft clean organic cinema camera air glide whoosh transition, gentle warm low-mid breeze, subtle documentary style",
  },
];

function stripCuesAndCollect(rawText) {
  const cues = [];
  let plain = "";
  const regex = /\[\[([a-z0-9_]+)\]\]/gi;
  let lastIdx = 0;
  let m;
  while ((m = regex.exec(rawText)) !== null) {
    plain += rawText.slice(lastIdx, m.index);
    cues.push({ name: m[1], charIndex: plain.length });
    lastIdx = regex.lastIndex;
  }
  plain += rawText.slice(lastIdx);
  return { plain: plain.trim(), cues };
}

function parseWordsFromAlignment(plain, alignment) {
  const chars = alignment?.characters || [];
  const starts = alignment?.characterStartTimesSeconds || alignment?.character_start_times_seconds || [];
  const ends = alignment?.characterEndTimesSeconds || alignment?.character_end_times_seconds || [];

  const words = [];
  let curWord = "";
  let wStart = null;
  let wEnd = null;
  let wCharStart = 0;

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (/\s/.test(ch)) {
      if (curWord.length > 0) {
        words.push({ word: curWord, start: wStart ?? 0, end: wEnd ?? (wStart ?? 0) + 0.1, charStart: wCharStart });
        curWord = "";
        wStart = null;
        wEnd = null;
      }
    } else {
      if (curWord.length === 0) {
        wStart = starts[i] ?? 0;
        wCharStart = i;
      }
      curWord += ch;
      wEnd = ends[i] ?? (wStart ?? 0) + 0.08;
    }
  }
  if (curWord.length > 0) {
    words.push({ word: curWord, start: wStart ?? 0, end: wEnd ?? (wStart ?? 0) + 0.1, charStart: wCharStart });
  }
  return { words, starts, ends };
}

function getDurationSec(filePath) {
  const out = execFileSync("ffprobe", [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1",
    filePath,
  ], { encoding: "utf8" });
  return parseFloat(out.trim());
}

async function withRetry(fn, label, maxRetries = 4) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxRetries) throw err;
      console.warn(`  [RETRY ${attempt}/${maxRetries}] ${label}: ${err?.message || err}`);
      await new Promise((r) => setTimeout(r, 2500 * attempt));
    }
  }
}

async function main() {
  if (!process.env.ELEVENLABS_API_KEY) {
    throw new Error("Missing ELEVENLABS_API_KEY in .env!");
  }
  const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

  const audioDir = join(PROJECT, "audio");
  const voCacheDir = join(audioDir, "vo_cache");
  const sfxDir = join(audioDir, "sfx");
  mkdirSync(voCacheDir, { recursive: true });
  mkdirSync(sfxDir, { recursive: true });

  const tmpDir = mkdtempSync(join(audioDir, "tmp_vo_"));
  const wavPieces = [];
  const allWords = [];
  const cuesSec = {};
  const actBounds = {};

  // Opening tiny breathing lead silence
  const leadWav = join(tmpDir, "000_lead.wav");
  execFileSync("ffmpeg", [
    "-y", "-f", "lavfi", "-i", `anullsrc=r=${SR}:cl=mono`,
    "-t", String(OPEN_LEAD_SILENCE_S), leadWav,
  ], { stdio: "ignore" });
  wavPieces.push(leadWav);
  let cursorS = OPEN_LEAD_SILENCE_S;

  const parsedBeats = BEATS.map((b) => ({ ...b, ...stripCuesAndCollect(b.text) }));

  console.log(`=== Synthesizing ${parsedBeats.length} Conversational Indonesian Beats via ElevenLabs ${TTS_MODEL} ===`);

  for (let i = 0; i < parsedBeats.length; i++) {
    const beat = parsedBeats[i];
    const prevPlain = i > 0 ? parsedBeats[i - 1].plain : "";
    const nextPlain = i < parsedBeats.length - 1 ? parsedBeats[i + 1].plain : "";

    const hashKey = createHash("sha1")
      .update(JSON.stringify({ v: NARRATOR.id, m: TTS_MODEL, st: NARRATOR.stability, sb: NARRATOR.similarityBoost, t: beat.plain, p: prevPlain, n: nextPlain, norm: "off" }))
      .digest("hex")
      .slice(0, 12);

    const mp3Path = join(voCacheDir, `beat_${String(i + 1).padStart(2, "0")}_${hashKey}.mp3`);
    const jsonPath = join(voCacheDir, `beat_${String(i + 1).padStart(2, "0")}_${hashKey}.json`);

    let alignData;
    if (existsSync(mp3Path) && existsSync(jsonPath)) {
      console.log(`  [CACHE] Beat ${i + 1}: "${beat.plain.slice(0, 52)}..."`);
      alignData = JSON.parse(readFileSync(jsonPath, "utf8"));
    } else {
      console.log(`  [TTS]   Beat ${i + 1}: "${beat.plain}"`);
      const resp = await withRetry(
        () =>
          client.textToSpeech.convertWithTimestamps(NARRATOR.id, {
            text: beat.plain,
            modelId: TTS_MODEL,
            languageCode: "id",
            outputFormat: "mp3_44100_128",
            applyTextNormalization: "off",
            previousText: prevPlain || undefined,
            nextText: nextPlain || undefined,
            voiceSettings: {
              stability: NARRATOR.stability,
              similarityBoost: NARRATOR.similarityBoost,
              style: 0.18,
              useSpeakerBoost: true,
            },
          }),
        `TTS Beat ${i + 1}`
      );

      const audioB64 = resp.audioBase64 || resp.audio_base64;
      if (!audioB64) throw new Error(`No audioBase64 returned for beat ${i + 1}`);
      writeFileSync(mp3Path, Buffer.from(audioB64, "base64"));
      alignData = resp.normalizedAlignment || resp.alignment || resp.normalized_alignment || {};
      writeFileSync(jsonPath, JSON.stringify(alignData, null, 2));
    }

    // Apply pitch-preserved tempo scaling + crisp broadcast EQ + trim trailing silence
    const beatWav = join(tmpDir, `beat_${String(i + 1).padStart(2, "0")}.wav`);
    execFileSync("ffmpeg", [
      "-y", "-i", mp3Path,
      "-af", `atempo=${TEMPO},highpass=f=75,equalizer=f=160:t=q:w=1.2:g=1.4,equalizer=f=3200:t=q:w=1.4:g=1.8,equalizer=f=6500:t=q:w=1.8:g=-1.2,apad=pad_dur=0.02`,
      "-ar", String(SR), "-ac", "1", beatWav,
    ], { stdio: "ignore" });

    const beatDur = getDurationSec(beatWav);
    const { words, starts } = parseWordsFromAlignment(beat.plain, alignData);

    if (!actBounds[beat.act]) {
      actBounds[beat.act] = { startS: cursorS, endS: cursorS + beatDur + beat.pauseAfterS };
    } else {
      actBounds[beat.act].endS = cursorS + beatDur + beat.pauseAfterS;
    }

    // Map inline [[cue]] positions to exact wall-clock seconds
    for (const c of beat.cues) {
      const idx = Math.min(c.charIndex, Math.max(0, starts.length - 1));
      const rawSec = starts[idx] ?? 0;
      cuesSec[c.name] = Number((cursorS + rawSec / TEMPO).toFixed(3));
    }

    // Map words to wall-clock seconds
    for (const w of words) {
      const cleanRaw = w.word.toLowerCase().replace(/[.,?!—]/g, "");
      let displayW = w.word;
      if (DISPLAY_WORD_MAP[cleanRaw]) {
        displayW = w.word.replace(new RegExp(cleanRaw, "i"), DISPLAY_WORD_MAP[cleanRaw]);
      }
      allWords.push({
        word: displayW,
        spoken: w.word,
        act: beat.act,
        beatIdx: i + 1,
        startS: Number((cursorS + w.start / TEMPO).toFixed(3)),
        endS: Number((cursorS + w.end / TEMPO).toFixed(3)),
      });
    }

    wavPieces.push(beatWav);
    cursorS += beatDur;

    if (beat.pauseAfterS > 0) {
      const padWav = join(tmpDir, `pad_${String(i + 1).padStart(2, "0")}.wav`);
      execFileSync("ffmpeg", [
        "-y", "-f", "lavfi", "-i", `anullsrc=r=${SR}:cl=mono`,
        "-t", String(beat.pauseAfterS), padWav,
      ], { stdio: "ignore" });
      wavPieces.push(padWav);
      cursorS += beat.pauseAfterS;
    }
  }

  // Concat all VO pieces into vo_master.wav
  const concatTxt = join(tmpDir, "concat.txt");
  writeFileSync(concatTxt, wavPieces.map((p) => `file '${p.replace(/\\/g, "/")}'`).join("\n"));
  const voMasterWav = join(audioDir, "vo_master.wav");
  execFileSync("ffmpeg", [
    "-y", "-f", "concat", "-safe", "0", "-i", concatTxt,
    "-ar", String(SR), "-ac", "1", voMasterWav,
  ], { stdio: "ignore" });
  rmSync(tmpDir, { recursive: true, force: true });

  const totalSec = Number(getDurationSec(voMasterWav).toFixed(3));
  const totalFrames = Math.ceil(totalSec * FPS);

  // Build crisp 2-4 word subtitle cards (exact @gimanabisaid reading rhythm!)
  const subtitles = [];
  let curGroup = [];
  for (let i = 0; i < allWords.length; i++) {
    const w = allWords[i];
    curGroup.push(w);
    const endsPunct = /[.,?!—]$/.test(w.word);
    const nextW = allWords[i + 1];
    const gapNext = nextW ? nextW.startS - w.endS : 99;
    const isBeatBoundary = nextW && nextW.beatIdx !== w.beatIdx;

    if (curGroup.length >= 3 || endsPunct || gapNext > 0.28 || isBeatBoundary || i === allWords.length - 1) {
      const s0 = curGroup[0].startS;
      const s1 = curGroup[curGroup.length - 1].endS + Math.min(0.16, Math.max(0.05, gapNext * 0.5));
      subtitles.push({
        id: `sub_${String(subtitles.length + 1).padStart(3, "0")}`,
        text: curGroup.map((x) => x.word).join(" "),
        act: curGroup[0].act,
        startFrame: Math.max(0, Math.round(s0 * FPS)),
        endFrame: Math.min(totalFrames - 1, Math.round(s1 * FPS)),
        startS: Number(s0.toFixed(3)),
        endS: Number(s1.toFixed(3)),
      });
      curGroup = [];
    }
  }

  // Generate 9 bespoke tactile mechanical SFX via ElevenLabs Sound-V3
  console.log(`\n=== Generating ${BESPOKE_SFX.length} Bespoke Mechanical SFX via ${SFX_MODEL} ===`);
  for (const sfx of BESPOKE_SFX) {
    const outPath = join(sfxDir, sfx.name);
    if (existsSync(outPath)) {
      console.log(`  [CACHE] SFX ${sfx.name}`);
      continue;
    }
    console.log(`  [SFX]   Generating ${sfx.name} (${sfx.durationS}s)...`);
    const buf = await withRetry(async () => {
      const stream = await client.textToSoundEffects.convert({
        text: sfx.prompt,
        durationSeconds: sfx.durationS,
        promptInfluence: 0.45,
        modelId: SFX_MODEL,
      });
      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      return Buffer.concat(chunks);
    }, `SFX ${sfx.name}`);
    writeFileSync(outPath, buf);
  }

  // Write alignment.json
  const alignmentPayload = {
    totalSec,
    totalFrames,
    fps: FPS,
    narrator: NARRATOR,
    cuesSec,
    actBounds,
    words: allWords,
    subtitles,
  };
  writeFileSync(join(audioDir, "alignment.json"), JSON.stringify(alignmentPayload, null, 2));

  // Export typed Remotion story.ts
  const cuesFrames = {};
  for (const [k, v] of Object.entries(cuesSec)) {
    cuesFrames[k] = Math.round(v * FPS);
  }
  const actsArr = Object.entries(actBounds)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([actNum, b]) => ({
      act: Number(actNum),
      startFrame: Math.round(b.startS * FPS),
      endFrame: Math.min(totalFrames, Math.round(b.endS * FPS)),
      startS: Number(b.startS.toFixed(3)),
      endS: Number(b.endS.toFixed(3)),
    }));
  if (actsArr.length > 0) {
    actsArr[0].startFrame = 0;
    actsArr[actsArr.length - 1].endFrame = totalFrames;
  }

  const storyDir = join(ROOT, "remotion", "videos", "rel-kereta");
  mkdirSync(storyDir, { recursive: true });
  const storyTs = `// AUTO-GENERATED AUDIO-FIRST STORY TIMELINE FOR RelKeretaShort
// Topic: "Kenapa Rel Kereta Pakai Batu Kerikil (Balast) & Celah?"
// Zero TikTok watermarks — Seamless Visual & Verbal Loop returning to Frame 0!

export interface SubtitleChunk {
  id: string;
  text: string;
  act: number;
  startFrame: number;
  endFrame: number;
  startS: number;
  endS: number;
}

export interface ActTiming {
  act: number;
  startFrame: number;
  endFrame: number;
  startS: number;
  endS: number;
}

export const REL_COMPOSITION_CONFIG = {
  id: "RelKeretaShort",
  width: 720,
  height: 1280,
  fps: ${FPS},
  durationInFrames: ${totalFrames},
  durationSec: ${totalSec},
  audioMasterPath: "rel-kereta/audio_master.m4a",
} as const;

export const CUES: Record<string, number> = ${JSON.stringify(cuesFrames, null, 2)};

export const CUES_SEC: Record<string, number> = ${JSON.stringify(cuesSec, null, 2)};

export const ACTS: ActTiming[] = ${JSON.stringify(actsArr, null, 2)};

export const SUBTITLES: SubtitleChunk[] = ${JSON.stringify(subtitles, null, 2)};
`;
  writeFileSync(join(storyDir, "story.ts"), storyTs);

  console.log(`\n=== VO & SFX Complete! ===`);
  console.log(`Total Duration: ${totalSec}s (${totalFrames} frames @ ${FPS} fps)`);
  console.log(`Subtitles: ${subtitles.length} crisp chunks | Cues: ${Object.keys(cuesFrames).length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
