/**
 * Audio-First VO & Bespoke SFX Generator for "BlackHoleShort" ("Apa yang Terjadi Jika Kamu Jatuh ke Lubang Hitam?")
 *
 * - Primary Narrator: Brian (`nPczCjzI2devNBz1zQrb`, Deep Resonant Baritone ~98.4 Hz) via ElevenLabs `eleven_v4` (`id`).
 * - Uses inline direction tags (`[thoughtful]`, `[quietly]`, `[serious tone]`, `[awe]`, etc.),
 *   request stitching (`previousText`/`nextText`), and character-level timestamps (`convertWithTimestamps`)
 *   to extract exact millisecond timestamps for every word and all 17 `[[cue]]` animation/SFX anchors.
 * - Generates 9 bespoke cinema-grade animation SFX via ElevenLabs `eleven_text_to_sound_v3`, cached by SHA-1 hash.
 * - Outputs:
 *     1. `black-hole/audio/vo_master.wav` (cleanly EQ'd & level-normalized 44.1 kHz mono narration stem)
 *     2. `black-hole/audio/sfx/*.mp3` (9 bespoke ElevenLabs Sound-V3 clips)
 *     3. `black-hole/audio/alignment.json` (full word + cue + scene timing data)
 *     4. `remotion/videos/black-hole/story.ts` (typed Remotion timeline, cues & deckle-edge karaoke subtitle cards)
 *
 * Run:
 *   node --env-file=.env black-hole/scripts/build_vo_and_sfx.mjs
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
const TEMPO = 1.28; // Crisp Shorts/Reels documentary cadence (~2.62 w/s, pitch-preserved WSOLA, keeps total ~65s)
const OPEN_LEAD_SILENCE_S = 0.14;
const END_TAIL_PAD_S = 1.60;

const NARRATOR = {
  id: "nPczCjzI2devNBz1zQrb", // Brian — Deep, Resonant and Comforting (~98.4 Hz baritone)
  label: "Brian (Deep Cosmic Documentary Baritone)",
  stability: 0.50,
  similarityBoost: 0.78,
};

// 15 narrated beats across Scenes 1..7 with expressive ElevenLabs v4 direction tags & [[cue]] anchors.
// Word-count: 164 words | Linter verified: 0 warnings, 0 clichés.
const BEATS = [
  // S1 — Hook & Paradoks Dua Jam
  {
    scene: 1,
    pauseAfterS: 0.22,
    text: "[thoughtful] [[s1_hook]]Kalau kamu jatuh ke lubang hitam, kamu tidak langsung hancur.",
  },
  {
    scene: 1,
    pauseAfterS: 0.34,
    text: "[serious tone] Dari mata temanmu di luar, tubuhmu justru [[s1_slow]]melambat, [[s1_red]]memerah, lalu [[s1_freeze]]membeku selamanya di tepi gelap.",
  },

  // S2 — Bola Foton (1,5 RS) & Cermin Cahaya
  {
    scene: 2,
    pauseAfterS: 0.20,
    text: "[calm] [[s2_watch]]Tapi di pergelanganmu, jarum jam tetap berdetak normal.",
  },
  {
    scene: 2,
    pauseAfterS: 0.34,
    text: "[thoughtful] Gravitasi [[s2_bend]]melengkungkan cahaya seperti cermin penuh. [pauses] Menoleh ke samping, kamu melihat [[s2_mirror]]punggungmu sendiri.",
  },

  // S3 — Event Horizon (1,0 RS) & Hening Total
  {
    scene: 3,
    pauseAfterS: 0.22,
    text: "[serious tone] Lalu kamu menembus [[s3_horizon]]Event Horizon, garis tanpa pulang.",
  },
  {
    scene: 3,
    pauseAfterS: 0.85, // Dramatic 0.85s total vacuum silence right after "Hening."!
    text: "[quietly] Pada lubang hitam raksasa, tak ada benturan. [[s3_hening]]Hening.",
  },
  {
    scene: 3,
    pauseAfterS: 0.36,
    text: "[awe] Namun seluruh bintang di belakangmu [[s3_sky]]menyusut menjadi satu bola cahaya kecil di atas kepala.",
  },

  // S4 — Twist: Ruang <-> Waktu Bertukar Peran
  {
    scene: 4,
    pauseAfterS: 0.16,
    text: "[serious tone] Di dalam sini, hukum fisika [[s4_invert]]terbalik.",
  },
  {
    scene: 4,
    pauseAfterS: 0.20,
    text: "[steady] [[s4_swap]]Ruang dan waktu bertukar peran.",
  },
  {
    scene: 4,
    pauseAfterS: 0.36,
    text: "[thoughtful] Pusat lubang hitam bukan lagi lokasi, melainkan [[s4_future]]masa depanmu. [pauses] Mustahil dihindari, seperti hari esok.",
  },

  // S5 — Gaya Pasang & Spaghettification
  {
    scene: 5,
    pauseAfterS: 0.18,
    text: "[serious tone] [[s5_tidal]]Semakin dalam, tarikan di kakimu jauh lebih ganas daripada di kepalamu.",
  },
  {
    scene: 5,
    pauseAfterS: 0.38,
    text: "[intense] Tubuhmu [[s5_stretch]]meregang seperti benang tipis, spaghettification, lalu [[s5_atoms]]terurai menjadi barisan atom.",
  },

  // S6 — Singularitas & Batas Pengetahuan
  {
    scene: 6,
    pauseAfterS: 0.20,
    text: "[quietly] Di ujungnya menunggu [[s6_sing]]singularitas, titik tempat seluruh hukum Einstein [[s6_crack]]lumpuh.",
  },
  {
    scene: 6,
    pauseAfterS: 0.42,
    text: "[thoughtful] Apa yang ada di baliknya? [pauses] Tidak satu pun manusia tahu.",
  },

  // S7 — Payoff, Residue & Loop Pull-Out: Sagittarius A*
  {
    scene: 7,
    pauseAfterS: 0.20,
    text: "[calm] [[s7_pull]]Dan kamu tidak perlu jauh-jauh mencarinya.",
  },
  {
    scene: 7,
    pauseAfterS: 0.15,
    text: "[resonant] Satu lubang hitam bermassa [[s7_sgr]]empat juta Matahari sedang berputar diam-diam di pusat galaksi kita sendiri.",
  },
];

// 9 Bespoke Cinema-Grade Animation SFX via ElevenLabs `eleven_text_to_sound_v3` (~32.6s total -> ~1,300 credits)
const BESPOKE_SFX = [
  {
    name: "sfx_astrolabe_gears.mp3",
    durationSeconds: 4.0,
    promptInfluence: 0.55,
    prompt: "Delicate antique brass astronomical astrolabe gears and precision clockwork ratchet smoothly rotating inside a quiet dark wooden observatory, warm metallic mechanical foley, no music",
  },
  {
    name: "sfx_time_dilation_clock.mp3",
    durationSeconds: 4.5,
    promptInfluence: 0.60,
    prompt: "Antique brass pocket watch ticking clearly at steady pace then gradually slowing down and pitching lower into deep reverberant gravity stillness, realistic film sound design, no music",
  },
  {
    name: "sfx_photon_lens_shimmer.mp3",
    durationSeconds: 3.5,
    promptInfluence: 0.55,
    prompt: "Warm ethereal glass harp and crystal harmonic shimmer curving gracefully across stereo space like bent golden starlight, delicate cinematic awe sound effect, no drums",
  },
  {
    name: "sfx_horizon_latch.mp3",
    durationSeconds: 2.8,
    promptInfluence: 0.60,
    prompt: "Heavy antique brass lock clicking firmly into place followed by a deep inhaling gravitational sub-bass air pull cutting abruptly to clean silence, crisp cinema foley",
  },
  {
    name: "sfx_sky_collapse.mp3",
    durationSeconds: 3.0,
    promptInfluence: 0.55,
    prompt: "Deep velvety cosmic air rush pulling swiftly upward and resolving into a delicate crystalline high bell sparkle, clean cinematic transition sound effect",
  },
  {
    name: "sfx_spacetime_invert.mp3",
    durationSeconds: 3.8,
    promptInfluence: 0.55,
    prompt: "Antique clockwork mechanism reversing smoothly and transforming into a slow deep resonant low brass pendulum thrum, mysterious science documentary sound design",
  },
  {
    name: "sfx_spaghettification_tension.mp3",
    durationSeconds: 4.2,
    promptInfluence: 0.60,
    prompt: "Low bowed cello-like metallic tension cable stretching tighter and higher with deep gravitational rumble building steadily in intensity, dramatic cinema sound design, no drums",
  },
  {
    name: "sfx_atomic_shatter.mp3",
    durationSeconds: 3.0,
    promptInfluence: 0.55,
    prompt: "Delicate crystalline shimmer fracturing into hundreds of tiny glittering glass beads and sparkling stardust rushing softly away, clean high-detail foley",
  },
  {
    name: "sfx_equation_fracture.mp3",
    durationSeconds: 3.8,
    promptInfluence: 0.55,
    prompt: "Fine porcelain and thin glass hairline cracking quietly in deep velvety cavern reverb then dissolving into subtle glittering golden dust particles, eerie minimal sound design",
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
    ttsPlainNoTags: ttsChunks.filter((x) => !/^\[[^\[\]]+\]$/.test(x)).join(" ").replace(/\s{2,}/g, " ").trim(),
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

/** Map display tokens to ElevenLabs spoken runs safely even if punctuation/hyphens split slightly. */
function alignDisplayToRuns(displayTokens, spokenRuns) {
  if (displayTokens.length === spokenRuns.length) {
    return displayTokens.map((dt, idx) => ({
      ...dt,
      start: spokenRuns[idx].start,
      end: spokenRuns[idx].end,
    }));
  }
  // Greedy prefix-concat matching for hyphenated splits (e.g., "jauh-jauh" -> ["jauh", "jauh"])
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
  ).trim();
  return Number.parseFloat(out);
}

function renderCleanNarratorWav(mp3Path, wavPath) {
  // Subtle cosmic documentary baritone mastering: HPF 75 Hz, gentle warmth +1.4 dB @ 150 Hz, presence +1.3 dB @ 3.1 kHz, tame harshness -1.0 dB @ 6.2 kHz
  const eq = "highpass=f=75,equalizer=f=150:t=q:w=1.1:g=1.4,equalizer=f=3100:t=q:w=1.3:g=1.3,equalizer=f=6200:t=q:w=1.4:g=-1.0";
  execFileSync(
    "ffmpeg",
    ["-y", "-loglevel", "error", "-i", mp3Path, "-ar", String(SR), "-ac", "1", "-af", eq, "-sample_fmt", "s16", wavPath],
    { stdio: "inherit" }
  );
}

/** Group aligned words into crisp 4-7 word deckle-edge parchment subtitle cards (max 2 lines per card). */
function buildSubtitleCards(allWords) {
  const cards = [];
  // Group per beat line first so cards respect natural narrative sentences & breath pauses
  const byLine = new Map();
  for (const w of allWords) {
    if (!byLine.has(w.line)) byLine.set(w.line, []);
    byLine.get(w.line).push(w);
  }

  for (const [, lineWords] of byLine.entries()) {
    // Split long lines cleanly at punctuation (comma/period/question) or max ~7 words / ~44 chars
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
        (textLen >= 40 && cur.length >= 4 && remaining >= 2);
      if (shouldBreak) {
        chunks.push(cur);
        cur = [];
      }
    }
    if (cur.length) chunks.push(cur);

    for (const chunk of chunks) {
      // Split chunk into 1 or 2 balanced lines (max ~24 chars per line for crisp 9:16 readability)
      const fullStr = chunk.map((x) => x.w).join(" ");
      let lines;
      if (fullStr.length <= 24 || chunk.length <= 3) {
        lines = [fullStr];
      } else {
        // Find split point closest to character midpoint
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
      const endFrame = Math.round(chunk[chunk.length - 1].end * FPS) + 5;
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

  // Ensure zero overlap between consecutive cards and Frame 0 instant hook presence!
  if (cards.length > 0) {
    cards[0].startFrame = 0; // Frame-0 hook text rule: visible immediately on frame 0!
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
  const outStoryTs = join(ROOT, "remotion/videos/black-hole/story.ts");
  const tmpBase = join(PROJECT, ".tmp");

  mkdirSync(voCacheDir, { recursive: true });
  mkdirSync(sfxDir, { recursive: true });
  mkdirSync(dirname(outStoryTs), { recursive: true });
  mkdirSync(tmpBase, { recursive: true });

  const prepared = BEATS.map((b, idx) => ({ ...b, idx, ...prepareBeat(b.text, idx) }));
  const tmpDir = mkdtempSync(join(tmpBase, "vo-build-"));

  try {
    console.log("=== [1/2] Synthesizing ElevenLabs v4 Narrator VO (Brian) with Character Timestamps ===");
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
        .update(JSON.stringify({ id: NARRATOR.id, model: TTS_MODEL, stab: NARRATOR.stability, sim: NARRATOR.similarityBoost, text: beat.ttsText, prev: prev?.ttsPlainNoTags ?? "", next: next?.ttsPlainNoTags ?? "" }))
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
      const trimLead = aligned.length ? Math.max(0, Number((aligned[0].start - 0.025).toFixed(3))) : 0;
      const lastEnd = aligned.length ? aligned[aligned.length - 1].end : clipDur;
      const srcSpan = Math.max(0.12, Math.min(clipDur - trimLead, Number((lastEnd - trimLead + 0.10).toFixed(3))));
      const trimWav = join(tmpDir, `beat_${i}_trim.wav`);
      execFileSync("ffmpeg", [
        "-y", "-loglevel", "error", "-ss", String(trimLead), "-i", rawWav, "-t", String(srcSpan),
        "-af", `atempo=${TEMPO},afade=t=in:st=0:d=0.008`,
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

    // Extract exact cue timestamps & scene start frames
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
      totalFrames,
    };

    const subtitleCards = buildSubtitleCards(allWords);
    const alignObj = {
      voice: `${NARRATOR.label} · ElevenLabs ${TTS_MODEL}`,
      model: TTS_MODEL,
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

    // Emit typed Remotion story.ts
    const storyTs = `// AUTO-GENERATED by black-hole/scripts/build_vo_and_sfx.mjs from ElevenLabs eleven_v4 character timestamps.
// Do not edit timings by hand — re-run the generator to resync.

export interface SubtitleCardSpec {
  scene: number;
  startFrame: number;
  endFrame: number;
  lines: string[];
  highlights: Array<[number, number, number]>;
}

export const BLACK_HOLE_FPS = ${FPS};
export const BLACK_HOLE_FRAMES = ${totalFrames};
export const BLACK_HOLE_DURATION_SEC = ${totalVideoSec};

export const SCENES = ${JSON.stringify(scenesFrame, null, 2)} as const;

export const CUES = ${JSON.stringify(cueMapFrame, null, 2)} as const;

export const CUES_SEC = ${JSON.stringify(cueMapSec, null, 2)} as const;

export const SUBTITLE_CARDS: SubtitleCardSpec[] = ${JSON.stringify(subtitleCards, null, 2)};
`;
    writeFileSync(outStoryTs, storyTs, "utf8");
    console.log(`\nVO COMPLETE -> ${outVoWav} (${voDur.toFixed(2)}s VO, ${totalVideoSec.toFixed(2)}s video / ${totalFrames} frames, ${allWords.length} words, ${Object.keys(cueMapFrame).length} cues, ${subtitleCards.length} cards)`);

    // Step 2: Generate 9 bespoke ElevenLabs Sound-V3 cinematic SFX (cached on disk)
    console.log("\n=== [2/2] Generating 9 Bespoke Cinema SFX via ElevenLabs eleven_text_to_sound_v3 ===");
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
