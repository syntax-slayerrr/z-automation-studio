/**
 * Audio-First VO, Bespoke SFX & Oppenheimer-Inspired Ambient Orchestral Score Generator
 * for "HumanRitualShort" ("Mengapa Manusia Memiliki Ritual?" — Neuroantropologi).
 *
 * - Primary Narrator: Brian (`nPczCjzI2devNBz1zQrb`, Warm Documentary Baritone) via ElevenLabs `eleven_v4` (`id`).
 * - Verbatim 7-Scene Indonesian Documentary Narration (22 beats, 250 words, 22 [[cue]] anchors).
 * - Natural Documentary Pacing (`TEMPO = 1.18` — calm, rich documentary rhythm hitting ±100-112s smoothly).
 * - Composes an original, copyright-safe Oppenheimer ("Can You Hear the Music")-inspired
 *   ambient orchestral violin/cello/synth score via ElevenLabs Music API (`client.music.compose`),
 *   cached at `human-ritual/audio/music_oppenheimer_ambient.mp3`.
 * - Generates 9 bespoke cinema-grade Foley/Atmospheric SFX via ElevenLabs `eleven_text_to_sound_v3`.
 * - Outputs:
 *     1. `human-ritual/audio/vo_master.wav`
 *     2. `human-ritual/audio/sfx/*.mp3`
 *     3. `human-ritual/audio/music_oppenheimer_ambient.mp3`
 *     4. `human-ritual/audio/alignment.json`
 *     5. `remotion/videos/human-ritual/story.ts`
 *
 * Run:
 *   node --env-file=.env human-ritual/scripts/build_vo_and_sfx.mjs
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
// Natural documentary cadence — calm, rich, contemplative (~2.1 w/s -> ~115s total; we tune after measuring exact raw duration)
const TEMPO = 1.16;
const OPEN_LEAD_SILENCE_S = 0.30;
const END_TAIL_PAD_S = 3.60; // Serene hold for closing silhouette + title card + gentle fade-out

const NARRATOR = {
  id: "nPczCjzI2devNBz1zQrb", // Brian — Warm, Resonant Documentary Baritone
  label: "Brian (Warm Documentary Baritone)",
  stability: 0.54,
  similarityBoost: 0.78,
};

// 22 verbatim Indonesian documentary beats across Scenes 1..7 with 22 exact [[cue]] storyboard anchors.
const BEATS = [
  // SCENE 1 — MANUSIA DAN KEBIASAAN ANEH (00:00–00:12)
  {
    scene: 1,
    pauseAfterS: 0.24,
    text: "[calm] [[s1_laces]]Bayangkan, ada seseorang yang percaya bahwa memakai kaus kaki tertentu bisa membuatnya menang dalam pertandingan.",
  },
  {
    scene: 1,
    pauseAfterS: 0.26,
    text: "[thoughtful] [[s1_bracelet]]Terdengar tidak masuk akal, bukan?",
  },
  {
    scene: 1,
    pauseAfterS: 0.48,
    text: "[resonant] Tapi anehnya, [[s1_montage]]manusia sudah melakukan hal semacam ini selama ribuan tahun.",
  },

  // SCENE 2 — RITUAL ADA DI MANA-MANA (00:12–00:26)
  {
    scene: 2,
    pauseAfterS: 0.24,
    text: "[warm] [[s2_wedding]]Dari doa sebelum perjalanan, upacara pernikahan, [[s2_community]]sampai prosesi pemakaman.",
  },
  {
    scene: 2,
    pauseAfterS: 0.24,
    text: "[steady] Hampir setiap kebudayaan memiliki ritualnya sendiri.",
  },
  {
    scene: 2,
    pauseAfterS: 0.48,
    text: "[thoughtful] [[s2_funeral]]Bentuknya berbeda, tetapi ada satu kesamaan: [[s2_circle]]tindakan yang dilakukan dengan urutan tertentu dan memiliki makna khusus.",
  },

  // SCENE 3 — APA YANG SEBENARNYA DICARI MANUSIA? (00:26–00:41)
  {
    scene: 3,
    pauseAfterS: 0.20,
    text: "[calm] [[s3_chaos]]Untuk memahaminya, kita perlu melihat satu hal:",
  },
  {
    scene: 3,
    pauseAfterS: 0.26,
    text: "[serious tone] manusia tidak selalu mampu mengendalikan apa yang terjadi di sekitarnya. [[s3_threats]]Ketidakpastian bisa memicu kecemasan.",
  },
  {
    scene: 3,
    pauseAfterS: 0.50,
    text: "[thoughtful] [[s3_order]]Dan di sinilah ritual menjadi menarik.",
  },

  // SCENE 4 — RITUAL DAN OTAK MANUSIA (00:41–00:56)
  {
    scene: 4,
    pauseAfterS: 0.24,
    text: "[calm] [[s4_brain]]Ketika melakukan ritual, manusia menjalankan rangkaian tindakan yang sudah dikenal.",
  },
  {
    scene: 4,
    pauseAfterS: 0.26,
    text: "[warm] Pola ini dapat membantu mengatur emosi dan memberikan rasa kendali.",
  },
  {
    scene: 4,
    pauseAfterS: 0.52,
    normOff: true,
    text: "[serious tone] [[s4_exp_err]]Bahkan, sebuah eksperimen menemukan bahwa [[s4_exp_ritual]]ritual sebelum mengerjakan tugas dapat mengurangi respons neural terhadap kesalahan.",
  },

  // SCENE 5 — RITUAL BUKAN HANYA TENTANG DIRI SENDIRI (00:56–01:11)
  {
    scene: 5,
    pauseAfterS: 0.24,
    text: "[thoughtful] [[s5_one]]Tapi ada sesuatu yang lebih besar. Ritual ternyata tidak hanya dilakukan untuk diri sendiri.",
  },
  {
    scene: 5,
    pauseAfterS: 0.26,
    text: "[warm] [[s5_group]]Ketika manusia melakukannya bersama, mereka berbagi pengalaman, gerakan, dan simbol yang sama.",
  },
  {
    scene: 5,
    pauseAfterS: 0.48,
    text: "[resonant] [[s5_aerial]]Perlahan, terbentuklah rasa kebersamaan.",
  },

  // SCENE 6 — RITUAL YANG HIDUP LEBIH LAMA DARI MANUSIA (01:11–01:24)
  {
    scene: 6,
    pauseAfterS: 0.24,
    text: "[calm] [[s6_observe]]Generasi berganti, manusia datang dan pergi. Namun ritual terus diwariskan.",
  },
  {
    scene: 6,
    pauseAfterS: 0.26,
    text: "[warm] [[s6_imitate]]Anak-anak mempelajarinya dari orang tua, lalu meneruskannya kepada generasi berikutnya.",
  },
  {
    scene: 6,
    pauseAfterS: 0.50,
    text: "[resonant] [[s6_generations]]Hingga akhirnya, sebuah tindakan menjadi bagian dari identitas suatu kebudayaan.",
  },

  // SCENE 7 — PENUTUP: KITA DAN RITUAL (01:24–01:40)
  {
    scene: 7,
    pauseAfterS: 0.24,
    normOff: true,
    text: "[thoughtful] [[s7_brain_symbols]]Inilah yang menarik dari neuroantropologi. Otak manusia tidak berkembang dalam ruang kosong.",
  },
  {
    scene: 7,
    pauseAfterS: 0.24,
    text: "[warm] [[s7_network]]Kita dibentuk oleh pengalaman, lingkungan, dan kebudayaan.",
  },
  {
    scene: 7,
    pauseAfterS: 0.26,
    text: "[calm] Mungkin itulah sebabnya, di tengah dunia yang terus berubah, manusia masih membutuhkan ritual.",
  },
  {
    scene: 7,
    pauseAfterS: 0.20,
    text: "[quietly] [[s7_silhouette]]Karena terkadang, sebuah tindakan sederhana bisa menyimpan makna yang diwariskan selama berabad-abad.",
  },
];

// 9 Bespoke Cinema SFX via ElevenLabs `eleven_text_to_sound_v3`
const BESPOKE_SFX = [
  {
    name: "sfx_shoelace_stadium_tunnel.mp3",
    durationSeconds: 5.0,
    promptInfluence: 0.60,
    prompt: "Close up crisp cloth shoelaces being tied tightly, subtle quiet exhale, and a faint distant echoing stadium crowd hush inside a concrete athlete tunnel, intimate film foley, no music",
  },
  {
    name: "sfx_bracelet_chime_morph.mp3",
    durationSeconds: 3.5,
    promptInfluence: 0.58,
    prompt: "Delicate wooden and brass bracelet beads clinking gently between fingers transitioning smoothly into a resonant warm ancient ceremonial bronze bowl shimmer, cinematic documentary transition, no music",
  },
  {
    name: "sfx_ceremony_lantern_bells.mp3",
    durationSeconds: 5.5,
    promptInfluence: 0.55,
    prompt: "Warm intimate traditional wedding ceremony ambience with gentle distant wind chimes, soft silk rustle, and warm crackling oil lamps at twilight, cinematic documentary foley, no music",
  },
  {
    name: "sfx_solemn_funeral_wind.mp3",
    durationSeconds: 5.0,
    promptInfluence: 0.55,
    prompt: "Quiet solemn evening breeze rustling soft leaves with a single deep warm distant temple bell toll fading gently into reverent stillness, documentary sound design, no music",
  },
  {
    name: "sfx_chaos_storm_to_calm.mp3",
    durationSeconds: 6.5,
    promptInfluence: 0.60,
    prompt: "Anxious swirling wind turbulence, low distant thunder rumble and erratic static crackles gradually calming down and resolving into a pure crystalline warm harmonic hum of order, cinema sound design",
  },
  {
    name: "sfx_neural_synapse_pulses.mp3",
    durationSeconds: 5.5,
    promptInfluence: 0.58,
    prompt: "Microscopic glowing bio-electric neural synapse sparks softly firing across a quiet reverberant space with delicate crystalline water-drop harmonic ticks, scientific documentary sound design, no music",
  },
  {
    name: "sfx_experiment_error_vs_calm.mp3",
    durationSeconds: 5.0,
    promptInfluence: 0.55,
    prompt: "Subtle clinical cognitive laboratory beep and brief low tense electrical buzz followed two seconds later by a soft muted gentle rounded pulse indicating calm regulation, clean documentary foley, no music",
  },
  {
    name: "sfx_community_rhythm_sync.mp3",
    durationSeconds: 6.0,
    promptInfluence: 0.58,
    prompt: "Single resonant hand drum tap and barefoot step in an open stone courtyard gradually joined by a small group stepping and breathing together in warm synchronized unison, realistic anthropological foley, no music",
  },
  {
    name: "sfx_generations_time_shimmer.mp3",
    durationSeconds: 5.5,
    promptInfluence: 0.55,
    prompt: "Warm glowing ancestral oil lantern flicker gently sweeping through time into a soft ethereal crystalline chime and deep warm atmospheric breath fading gracefully, cinema documentary transition, no music",
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
  const eq = "highpass=f=75,equalizer=f=155:t=q:w=1.1:g=1.4,equalizer=f=3000:t=q:w=1.3:g=1.3,equalizer=f=6200:t=q:w=1.4:g=-1.0";
  execFileSync(
    "ffmpeg",
    ["-y", "-loglevel", "error", "-i", mp3Path, "-ar", String(SR), "-ac", "1", "-af", eq, "-sample_fmt", "s16", wavPath],
    { stdio: "inherit" }
  );
}

/** Group aligned words into crisp 4-7 word Twilight Parchment subtitle cards (max 2 balanced lines). */
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
      const endsPunct = /[,.\?!:]$/.test(w.w);
      const remaining = lineWords.length - 1 - i;
      const shouldBreak =
        (endsPunct && cur.length >= 3 && remaining >= 2) ||
        (cur.length >= 7 && remaining >= 2) ||
        (textLen >= 36 && cur.length >= 4 && remaining >= 2);
      if (shouldBreak) {
        chunks.push(cur);
        cur = [];
      }
    }
    if (cur.length) chunks.push(cur);

    for (const chunk of chunks) {
      const fullStr = chunk.map((x) => x.w).join(" ");
      let lines;
      if (fullStr.length <= 22 || chunk.length <= 3) {
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
  const outMusicMp3 = join(audioDir, "music_oppenheimer_ambient.mp3");
  const outStoryTs = join(ROOT, "remotion/videos/human-ritual/story.ts");
  const tmpBase = join(PROJECT, ".tmp");

  mkdirSync(voCacheDir, { recursive: true });
  mkdirSync(sfxDir, { recursive: true });
  mkdirSync(dirname(outStoryTs), { recursive: true });
  mkdirSync(tmpBase, { recursive: true });

  const prepared = BEATS.map((b, idx) => ({ ...b, idx, ...prepareBeat(b.text, idx) }));
  const tmpDir = mkdtempSync(join(tmpBase, "vo-build-"));

  try {
    console.log(`=== [1/3] Synthesizing ElevenLabs v4 Narrator VO (Brian, Documentary Tempo ${TEMPO}x) ===`);
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
        ...(beat.normOff ? { norm: "off" } : {}),
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
          applyTextNormalization: beat.normOff ? "off" : "on",
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
      s2Start: Math.max(0, Math.round((sceneStartsSec[2] - 0.42) * FPS)),
      s3Start: Math.max(0, Math.round((sceneStartsSec[3] - 0.42) * FPS)),
      s4Start: Math.max(0, Math.round((sceneStartsSec[4] - 0.42) * FPS)),
      s5Start: Math.max(0, Math.round((sceneStartsSec[5] - 0.42) * FPS)),
      s6Start: Math.max(0, Math.round((sceneStartsSec[6] - 0.42) * FPS)),
      s7Start: Math.max(0, Math.round((sceneStartsSec[7] - 0.42) * FPS)),
      totalFrames,
    };

    const starts = [scenesFrame.s1Start, scenesFrame.s2Start, scenesFrame.s3Start, scenesFrame.s4Start, scenesFrame.s5Start, scenesFrame.s6Start, scenesFrame.s7Start, totalFrames];
    console.log(`\n=== SCENE TIMING BREAKDOWN (Tempo ${TEMPO}x) ===`);
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

    const storyTs = `// AUTO-GENERATED by human-ritual/scripts/build_vo_and_sfx.mjs from ElevenLabs eleven_v4 character timestamps.
// Do not edit timings by hand — re-run the generator to resync.

export interface SubtitleCardSpec {
  scene: number;
  startFrame: number;
  endFrame: number;
  lines: string[];
  highlights: Array<[number, number, number]>;
}

export const HUMAN_RITUAL_FPS = ${FPS};
export const HUMAN_RITUAL_FRAMES = ${totalFrames};
export const HUMAN_RITUAL_DURATION_SEC = ${totalVideoSec};

export const SCENES = ${JSON.stringify(scenesFrame, null, 2)} as const;

export const CUES = ${JSON.stringify(cueMapFrame, null, 2)} as const;

export const CUES_SEC = ${JSON.stringify(cueMapSec, null, 2)} as const;

export const SUBTITLE_CARDS: SubtitleCardSpec[] = ${JSON.stringify(subtitleCards, null, 2)};
`;
    writeFileSync(outStoryTs, storyTs, "utf8");
    console.log(`\nVO COMPLETE -> ${outVoWav} (${voDur.toFixed(2)}s VO, ${totalVideoSec.toFixed(2)}s video / ${totalFrames} frames, ${allWords.length} words, ${Object.keys(cueMapFrame).length} cues, ${subtitleCards.length} cards)`);

    // Step 2: Compose bespoke Oppenheimer ("Can You Hear the Music")-inspired ambient orchestral score
    console.log("\n=== [2/3] Composing Ambient Orchestral Solo-Violin & Accelerating Arpeggio Score (ElevenLabs Music) ===");
    if (existsSync(outMusicMp3) && readFileSync(outMusicMp3).length > 100_000) {
      console.log(`  CACHED ${outMusicMp3} (${getDurationSec(outMusicMp3).toFixed(2)}s)`);
    } else {
      const targetMusicMs = Math.min(180000, Math.max(95000, Math.ceil((totalVideoSec + 4) * 1000)));
      try {
        console.log(`  COMPOSING original orchestral ambient score (${(targetMusicMs / 1000).toFixed(1)}s)...`);
        const musicStream = await client.music.compose({
          prompt:
            "Cinematic ambient orchestral film score inspired by modern scientific wonder and atomic revelation, purely instrumental, no vocals, no drums or percussion. Opens delicately with a solitary expressive solo violin playing hypnotic softly arpeggiated harmonic figures over a warm deep analog synthesizer sub-pad in a reverberant concert hall. Gradually builds with shimmering layered strings, pulsing rhythmic cello ostinato, accelerating overlapping violin arpeggios, and luminous emotional brass-string swells evoking awe, human neuroscience, and timeless connection. Ends gracefully by thinning back into a crystalline sustained solo violin harmonic and warm peaceful cello drone.",
          musicLengthMs: targetMusicMs,
          forceInstrumental: true,
        });
        const ws = createWriteStream(outMusicMp3);
        await finished(Readable.fromWeb(musicStream).pipe(ws));
        const md = getDurationSec(outMusicMp3);
        console.log(`  -> MUSIC COMPOSED & SAVED (${md.toFixed(2)}s) -> ${outMusicMp3}`);
      } catch (musicErr) {
        console.warn(`  [WARN] ElevenLabs Music API unavailable on this key (${musicErr?.statusCode ?? musicErr?.message}). Will synthesize fallback orchestral score in build_sound_mix.py.`);
      }
    }

    // Step 3: Generate 9 bespoke ElevenLabs Sound-V3 cinematic SFX (cached on disk)
    console.log("\n=== [3/3] Generating 9 Bespoke Neuroanthropology & Ritual SFX via ElevenLabs eleven_text_to_sound_v3 ===");
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

    console.log("\n=== ALL ELEVENLABS VO, MUSIC & BESPOKE SFX GENERATION COMPLETE ===");
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
