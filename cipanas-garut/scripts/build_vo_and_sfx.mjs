/**
 * Audio-First VO & Bespoke SFX Generator for "CipanasGarutShort" ("CIPANAS GARUT: KEHANGATAN DARI PERUT BUMI")
 *
 * - Primary Narrator: Brian (`nPczCjzI2devNBz1zQrb`, Warm Documentary Storyteller) via ElevenLabs `eleven_v4` (`id`).
 * - UPGRADED 85ms Pre-Roll Buffer (`trimLead = aligned[0].start - 0.085`) so ZERO first consonants ever clip!
 * - Indonesian Pronunciation Shield (`applyTextNormalization: "off"`): phonetic spelling for numbers/years while
 *   preserving crisp display typography and exact karaoke word timings.
 * - Generates 4 bespoke geothermal/water/bamboo-spout foley SFX via ElevenLabs `eleven_text_to_sound_v3` (cached).
 *
 * Run:
 *   node --env-file=.env cipanas-garut/scripts/build_vo_and_sfx.mjs
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
const OPEN_LEAD_SILENCE_S = 0.70;
const END_TAIL_PAD_S = 2.65;

const NARRATOR = {
  id: "nPczCjzI2devNBz1zQrb", // Brian — Warm, Articulate Documentary Storyteller
  label: "Brian (Warm Documentary Storyteller)",
  stability: 0.50,
  similarityBoost: 0.78,
};

// Indonesian phonetic map ONLY for TTS (display subtitles stay crisp & readable!)
const PHONETIC_MAP = {
  "1818": ["seribu", "delapan", "ratus", "delapan", "belas"],
  "40": ["empat", "puluh"],
  "70": ["tujuh", "puluh"],
  "api": ["api"],
  "air": ["air"],
  "gas": ["gas"],
};

// 10-Shot Varied Cinematic Storyboard Script with exact [[cue]] anchors
const BEATS = [
  // SHOT 1 — ECU STEAMING POOL & 42°C THERMOMETER
  {
    shot: 1,
    pauseAfterS: 0.28,
    text: "[curious] [[sh1_ecu]]Di tengah udara dingin pegunungan Garut, air di kolam ini selalu hangat — lebih dari 40 derajat, tanpa satu watt listrik pun.",
  },

  // SHOT 2 — LOW-ANGLE WIDE ESTABLISHING POSTER (CIPANAS + GUNUNG GUNTUR)
  {
    shot: 2,
    pauseAfterS: 0.26,
    text: "[thoughtful] [[sh2_wide]]Bahkan sejak tahun 1818, penjelajah Eropa sudah mencatat mata air ini mengalir panas tanpa henti.",
  },
  {
    shot: 2,
    pauseAfterS: 0.45,
    text: "[resonant] [[sh2_title]]Inilah Cipanas Garut — dan rahasia mesin pemanasnya tersembunyi tepat di belakangnya.",
  },

  // SHOT 3 — BIRD'S-EYE d3-geo VINTAGE ATLAS CORRIDOR (±5 KM)
  {
    shot: 3,
    pauseAfterS: 0.26,
    text: "[steady] [[sh3_atlas]]Terletak di Tarogong Kaler, Cipanas berdiri tepat di kaki tenggara Gunung Guntur.",
  },
  {
    shot: 3,
    pauseAfterS: 0.42,
    text: "[curious] [[sh3_twist]]Tapi kalau kamu mengira air panasnya keluar langsung dari lava, jawabannya justru terbalik.",
  },

  // SHOT 4 — ASYMMETRICAL RULE-OF-THIRDS RAINSTORM OVER GUNTUR SLOPES
  {
    shot: 4,
    pauseAfterS: 0.26,
    text: "[warm] [[sh4_rain]]Semua keajaiban ini justru dimulai dari air hujan yang dingin.",
  },
  {
    shot: 4,
    pauseAfterS: 0.42,
    text: "[steady] [[sh4_seep]]Saat hujan mengguyur lereng Gunung Guntur, jutaan liter air meresap menembus pori tanah vulkanik.",
  },

  // SHOT 5 — SUBSURFACE MACRO ROCK-FRACTURE DIVE (SESAR / FAULT)
  {
    shot: 5,
    pauseAfterS: 0.42,
    text: "[thoughtful] [[sh5_fault]]Air itu terus menyusup jauh ke kedalaman lewat celah patahan bumi yang disebut sesar — bagai pipa raksasa alami.",
  },

  // SHOT 6 — DEEP SUBTERRANEAN HYDROTHERMAL BOILER CUTAWAY
  {
    shot: 6,
    pauseAfterS: 0.26,
    text: "[resonant] [[sh6_heat]]Di bawah tanah, air dingin ini menyentuh batuan panas yang dipanggang dapur magma Gunung Guntur.",
  },
  {
    shot: 6,
    pauseAfterS: 0.45,
    text: "[steady] [[sh6_convect]]Suhunya melonjak hingga 70 derajat, bobotnya jadi lebih ringan, lalu terdorong kuat naik kembali ke permukaan.",
  },

  // SHOT 7 — VINTAGE ENCYCLOPEDIA 2-PANEL SPLIT-SCREEN (KAWAH vs CIPANAS)
  {
    shot: 7,
    pauseAfterS: 0.26,
    text: "[curious] [[sh7_split]]Lalu kenapa air Cipanas tetap jernih dan tak berbau belerang menyengat seperti kawah?",
  },
  {
    shot: 7,
    pauseAfterS: 0.44,
    text: "[warm] [[sh7_filter]]Karena ia muncul di zona limpahan luar — tersaring ratusan meter batuan vulkanik tanpa bercampur langsung dengan gas magma.",
  },

  // SHOT 8 — INTIMATE HERITAGE MID-SHOT (BAMBOO SPOUTS & STEAMING STONE BATH)
  {
    shot: 8,
    pauseAfterS: 0.44,
    text: "[calm] [[sh8_spout]]Hasilnya, air mineral hangat yang ramah bagi kulit terus mengucur — dari pemandian bambu zaman dulu hingga resor modern hari ini.",
  },

  // SHOT 9 — WIDE PANORAMIC PEAK-TO-POOL 4-STAGE LIVING HYDROTHERMAL CYCLE
  {
    shot: 9,
    pauseAfterS: 0.45,
    text: "[resonant] [[sh9_cycle]]Selama hujan masih turun di langit Garut, dan perut Gunung Guntur masih menyimpan panas, mesin alami ini tak pernah padam.",
  },

  // SHOT 10 — SEAMLESS LOOP RETURN + SUBTERRANEAN GHOST BLUEPRINT + VINTAGE POSTCARD
  {
    shot: 10,
    pauseAfterS: 0.26,
    text: "[warm] [[sh10_loop]]Jadi saat kamu berendam santai di Cipanas, ingat satu hal.",
  },
  {
    shot: 10,
    pauseAfterS: 0.28,
    text: "[thoughtful] [[sh10_ghost]]Di bawah kakimu, dapur panas bumi raksasa sedang bekerja tanpa suara.",
  },
  {
    shot: 10,
    pauseAfterS: 0.24,
    text: "[resonant] [[sh10_postcard]]Cipanas Garut, kehangatan abadi dari perut bumi.",
  },
];

// 4 Bespoke Hydrothermal & Hot-Spring Foley Clips via ElevenLabs Sound-V3
const BESPOKE_SFX = [
  {
    name: "sfx_hotspring_steam_splash.mp3",
    durationSeconds: 4.5,
    promptInfluence: 0.55,
    prompt: "Peaceful steaming natural hot spring stone pool gentle water lapping with soft rising warm vapor hiss and subtle cool Indonesian mountain morning breeze, clean documentary foley, no music",
  },
  {
    name: "sfx_underground_water_seep.mp3",
    durationSeconds: 4.5,
    promptInfluence: 0.55,
    prompt: "Water droplets trickling and flowing downward through deep hollow volcanic rock fissures underground with subtle echoing stone cavern acoustics, documentary foley, no music",
  },
  {
    name: "sfx_geothermal_boil_rumble.mp3",
    durationSeconds: 5.0,
    promptInfluence: 0.55,
    prompt: "Deep subterranean geothermal heat rumble swelling with pressurized hot water bubbling and rising powerfully through underground rock conduits, clean cinematic documentary foley, no music",
  },
  {
    name: "sfx_bamboo_spout_pour.mp3",
    durationSeconds: 4.5,
    promptInfluence: 0.55,
    prompt: "Warm clear mineral water pouring steadily from a hollow bamboo spout into a tranquil stone bath pool with gentle splash and relaxing ripples, authentic natural foley, no music",
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
      const endsPunct = /[,.\?!—]$/.test(w.w);
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
        shot: chunk[0].shot,
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
  console.log(`\n=== [2/2] Generating 4 Bespoke Geothermal/Water Foley Clips via ElevenLabs ${SFX_MODEL} ===`);
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
      console.warn(`  [WARN  ] Could not synthesize ${item.name}: ${err?.message ?? err}`);
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
  const outStoryTs = join(ROOT, "remotion/videos/cipanas-garut/story.ts");
  const tmpBase = join(PROJECT, ".tmp");

  mkdirSync(voCacheDir, { recursive: true });
  mkdirSync(sfxDir, { recursive: true });
  mkdirSync(dirname(outStoryTs), { recursive: true });
  mkdirSync(tmpBase, { recursive: true });

  const prepared = BEATS.map((b, idx) => ({ ...b, idx, ...prepareBeat(b.text, idx) }));
  const tmpDir = mkdtempSync(join(tmpBase, "vo-build-"));

  try {
    console.log(`=== [1/2] Synthesizing ElevenLabs v4 Narrator VO (Brian, Tempo ${TEMPO}x, 85ms Safe Consonant Pre-Roll) ===`);
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
        console.log(`  [${i + 1}/${prepared.length}] CACHED SH${beat.shot}: ${beat.displayTokens.map((x) => x.w).join(" ")}`);
        alignment = JSON.parse(readFileSync(alignPath, "utf8"));
      } else {
        console.log(`  [${i + 1}/${prepared.length}] SYNTH  SH${beat.shot}: ${beat.ttsText}`);
        let res;
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            res = await client.textToSpeech.convertWithTimestamps(NARRATOR.id, {
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
            break;
          } catch (err) {
            if (attempt === 3 || err?.statusCode === 401 || err?.statusCode === 402) throw err;
            console.warn(`    [RETRY ${attempt}/3] transient error: ${err?.message ?? err}`);
            await new Promise((r) => setTimeout(r, 1500 * attempt));
          }
        }
        writeFileSync(mp3Path, Buffer.from(res.audioBase64, "base64"));
        alignment = res.alignment;
        writeFileSync(alignPath, JSON.stringify(alignment, null, 2));
      }

      const rawWav = join(tmpDir, `beat_${i}.wav`);
      renderCleanNarratorWav(mp3Path, rawWav);

      const spokenRuns = extractSpokenRuns(alignment);
      const aligned = alignDisplayToRuns(beat.displayTokens, spokenRuns);
      const clipDur = getDurationSec(rawWav);
      // Generous 85ms pre-roll protects every nasal/plosive Indonesian onset ("Na-", "Gu-", "Di-") from EVER clipping!
      const trimLead = aligned.length ? Math.max(0, Number((aligned[0].start - 0.085).toFixed(3))) : 0;
      const lastEnd = aligned.length ? aligned[aligned.length - 1].end : clipDur;
      const srcSpan = Math.max(0.14, Math.min(clipDur - trimLead, Number((lastEnd - trimLead + 0.14).toFixed(3))));
      const trimWav = join(tmpDir, `beat_${i}_trim.wav`);
      const afChain = TEMPO === 1.0 ? "afade=t=in:st=0:d=0.006" : `atempo=${TEMPO},afade=t=in:st=0:d=0.006`;
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
          shot: beat.shot,
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
    const shotStartsSec = {};
    for (const w of allWords) {
      if (w.cue) {
        cueMapSec[w.cue] = w.start;
        cueMapFrame[w.cue] = Math.round(w.start * FPS);
      }
      if (shotStartsSec[w.shot] === undefined) {
        shotStartsSec[w.shot] = w.start;
      }
    }
    const shotsFrame = {
      sh1Start: 0,
      sh2Start: Math.max(0, Math.round((shotStartsSec[2] - 0.28) * FPS)),
      sh3Start: Math.max(0, Math.round((shotStartsSec[3] - 0.28) * FPS)),
      sh4Start: Math.max(0, Math.round((shotStartsSec[4] - 0.28) * FPS)),
      sh5Start: Math.max(0, Math.round((shotStartsSec[5] - 0.28) * FPS)),
      sh6Start: Math.max(0, Math.round((shotStartsSec[6] - 0.28) * FPS)),
      sh7Start: Math.max(0, Math.round((shotStartsSec[7] - 0.28) * FPS)),
      sh8Start: Math.max(0, Math.round((shotStartsSec[8] - 0.28) * FPS)),
      sh9Start: Math.max(0, Math.round((shotStartsSec[9] - 0.28) * FPS)),
      sh10Start: Math.max(0, Math.round((shotStartsSec[10] - 0.28) * FPS)),
      totalFrames,
    };

    console.log(`\n=== 10-SHOT STORYBOARD TIMING BREAKDOWN (Tempo ${TEMPO}x) ===`);
    for (let s = 1; s <= 10; s++) {
      const f0 = shotsFrame[`sh${s}Start`];
      const f1 = s < 10 ? shotsFrame[`sh${s + 1}Start`] : totalFrames;
      console.log(`  Shot ${String(s).padStart(2, "0")}: f=${f0}..${f1 - 1} (${(f0 / FPS).toFixed(2)}s -> ${(f1 / FPS).toFixed(2)}s | dur=${((f1 - f0) / FPS).toFixed(2)}s)`);
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
      shotsFrame,
      words: allWords,
    };
    writeFileSync(outAlignJson, JSON.stringify(alignObj, null, 2) + "\n", "utf8");

    const storyTs = `// AUTO-GENERATED by cipanas-garut/scripts/build_vo_and_sfx.mjs from ElevenLabs eleven_v4 character timestamps.
// Do not edit timings by hand — re-run the generator to resync.

export interface SubtitleCardSpec {
  shot: number;
  startFrame: number;
  endFrame: number;
  lines: string[];
  highlights: Array<[number, number, number]>;
}

export const CIPANAS_FPS = ${FPS};
export const CIPANAS_FRAMES = ${totalFrames};
export const CIPANAS_DURATION_SEC = ${totalVideoSec};

export const SHOTS = ${JSON.stringify(shotsFrame, null, 2)} as const;

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
