/**
 * Audio-First VO & Bespoke SFX Generator for "GmniHistoryShort" ("Sejarah Berdirinya GMNI")
 *
 * - Primary Narrator: Brian (`nPczCjzI2devNBz1zQrb`, Warm Documentary Baritone) via ElevenLabs `eleven_v4` (`id`).
 * - Natural Documentary Tempo (`TEMPO = 1.15` — crisp, calm historical storytelling without rushing).
 * - Built-in Indonesian Pronunciation Shield (GMNI -> "Ge Em En I", S.M. -> "Es Em", years 1950-an/1953/1954 & dates
 *   spelled in Indonesian with `applyTextNormalization: "off"`) while keeping EXACT display spelling & exact multi-word alignment!
 * - Generates 8 bespoke historical documentary SFX via ElevenLabs `eleven_text_to_sound_v3` (cached by filename).
 *
 * Run:
 *   node --env-file=.env gmni-history/scripts/build_vo_and_sfx.mjs
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
const TEMPO = 1.23; // Natural crisp historical documentary cadence (~2.2 w/s, hits ~120s cleanly without rushing)
const OPEN_LEAD_SILENCE_S = 0.22;
const END_TAIL_PAD_S = 3.50; // Dignified hold on GMNI Emblem + "GERAKAN MAHASISWA NASIONAL INDONESIA / 23.03.1954 / Satu Hati, Satu Jiwa, Satu Pikiran"

const NARRATOR = {
  id: "nPczCjzI2devNBz1zQrb", // Brian — Warm, Resonant Documentary Baritone
  label: "Brian (Warm Documentary Baritone)",
  stability: 0.52,
  similarityBoost: 0.78,
};

// Indonesian phonetic map for acronyms, initials & years (ONLY for TTS; display text stays 100% verbatim!)
const PHONETIC_MAP = {
  "1950-an": ["seribu", "sembilan", "ratus", "lima", "puluhan"],
  "1953": ["seribu", "sembilan", "ratus", "lima", "puluh", "tiga"],
  "1954": ["seribu", "sembilan", "ratus", "lima", "puluh", "empat"],
  "23": ["dua", "puluh", "tiga"],
  "s.m.": ["Es", "Em"],
  "gmni": ["Ge", "Em", "En", "I"],
};

// 21 verbatim Indonesian historical documentary beats across Scenes 1..6 with 27 [[cue]] storyboard anchors.
const BEATS = [
  // SCENE 1 — INDONESIA SETELAH KEMERDEKAAN (~13s)
  {
    scene: 1,
    pauseAfterS: 0.22,
    text: "[calm] [[s1_jakarta]]Tahun 1950-an, Indonesia telah merdeka. [[s1_flag]]Namun, perjuangan bangsa belum selesai.",
  },
  {
    scene: 1,
    pauseAfterS: 0.25,
    text: "[thoughtful] [[s1_people]]Berbagai persoalan sosial, ekonomi, dan politik masih dihadapi masyarakat.",
  },
  {
    scene: 1,
    pauseAfterS: 0.45,
    text: "[steady] Di tengah situasi tersebut, [[s1_students]]mahasiswa mulai mengambil peran dalam menentukan arah masa depan bangsa.",
  },

  // SCENE 2 — LAHIRNYA GAGASAN PERSATUAN (~16s)
  {
    scene: 2,
    pauseAfterS: 0.25,
    text: "[calm] [[s2_map]]Saat itu, terdapat beberapa organisasi mahasiswa yang memiliki semangat nasionalisme dan berlandaskan Marhaenisme, pemikiran perjuangan yang dikembangkan oleh Bung Karno.",
  },
  {
    scene: 2,
    pauseAfterS: 0.22,
    text: "[steady] Di antaranya [[s2_jogja]]Gerakan Mahasiswa Marhaenis di Yogyakarta, [[s2_sby]]Gerakan Mahasiswa Merdeka di Surabaya, dan [[s2_jkt]]Gerakan Mahasiswa Demokrat Indonesia di Jakarta.",
  },
  {
    scene: 2,
    pauseAfterS: 0.48,
    text: "[warm] [[s2_unite]]Ketiganya memiliki cita-cita perjuangan yang sejalan.",
  },

  // SCENE 3 — GAGASAN FUSI TIGA ORGANISASI (~15s)
  {
    scene: 3,
    pauseAfterS: 0.22,
    text: "[thoughtful] [[s3_proklamasi]]Pada September 1953, muncul gagasan untuk menyatukan ketiga organisasi tersebut.",
  },
  {
    scene: 3,
    pauseAfterS: 0.24,
    text: "[steady] Gagasan ini menguat setelah pergantian kepengurusan Gerakan Mahasiswa Demokrat Indonesia yang dipimpin [[s3_hadi]]S.M. Hadiprabowo.",
  },
  {
    scene: 3,
    pauseAfterS: 0.50,
    text: "[warm] Melalui [[s3_suropati]]serangkaian pertemuan, ketiga organisasi akhirnya sepakat untuk [[s3_merge]]melebur menjadi satu wadah perjuangan mahasiswa.",
  },

  // SCENE 4 — 23 MARET 1954: GMNI DILAHIRKAN (~19s)
  {
    scene: 4,
    pauseAfterS: 0.24,
    text: "[resonant] [[s4_sby54]]Puncaknya terjadi pada 23 Maret 1954, ketika [[s4_hall]]Kongres Pertama diselenggarakan di Surabaya.",
  },
  {
    scene: 4,
    pauseAfterS: 0.28,
    text: "[warm] Dari [[s4_congress]]proses penyatuan tersebut, lahirlah [[s4_name]]Gerakan Mahasiswa Nasional Indonesia, atau GMNI.",
  },
  {
    scene: 4,
    pauseAfterS: 0.24,
    text: "[steady] S.M. Hadiprabowo ditetapkan sebagai Ketua Umum pertama.",
  },
  {
    scene: 4,
    pauseAfterS: 0.52,
    text: "[resonant] [[s4_date]]Tanggal 23 Maret kemudian ditetapkan sebagai hari lahir GMNI.",
  },

  // SCENE 5 — MARHAENISME SEBAGAI LANDASAN PERJUANGAN (~18s)
  {
    scene: 5,
    pauseAfterS: 0.24,
    text: "[steady] [[s5_sukarno]]Sejak awal, GMNI menjadikan Marhaenisme sebagai asas perjuangannya.",
  },
  {
    scene: 5,
    pauseAfterS: 0.26,
    text: "[resonant] Pemikiran Bung Karno ini menekankan [[s5_p1]]Sosio-Nasionalisme, [[s5_p2]]Sosio-Demokrasi, dan [[s5_p3]]Ketuhanan Yang Maha Esa.",
  },
  {
    scene: 5,
    pauseAfterS: 0.50,
    text: "[warm] Dengan semangat tersebut, GMNI membawa cita-cita perjuangan untuk [[s5_marhaen]]membela rakyat kecil, menentang penindasan, dan [[s5_together]]memperjuangkan keadilan sosial.",
  },

  // SCENE 6 — PERJALANAN SEBUAH GERAKAN (~19s + serene emblem closing hold)
  {
    scene: 6,
    pauseAfterS: 0.24,
    text: "[calm] [[s6_spread]]Sejak kelahirannya, GMNI terus berkembang dan menyebar ke berbagai perguruan tinggi di Indonesia.",
  },
  {
    scene: 6,
    pauseAfterS: 0.24,
    text: "[steady] [[s6_cadre]]Organisasi ini menjadi wadah pendidikan kader sekaligus perjuangan mahasiswa.",
  },
  {
    scene: 6,
    pauseAfterS: 0.26,
    text: "[warm] Lebih dari sekadar organisasi, GMNI lahir dari semangat persatuan dan cita-cita [[s6_social]]memperjuangkan kepentingan rakyat.",
  },
  {
    scene: 6,
    pauseAfterS: 0.25,
    text: "[resonant] [[s6_march]]Sebuah gerakan yang dimulai pada 23 Maret 1954, dan terus membawa semangat nasionalisme [[s6_logo]]hingga hari ini.",
  },
];

// 8 Bespoke 1950s Historical Documentary SFX via ElevenLabs `eleven_text_to_sound_v3`
const BESPOKE_SFX = [
  {
    name: "sfx_jakarta_1950s_street.mp3",
    durationSeconds: 5.5,
    promptInfluence: 0.55,
    prompt: "Nostalgic 1950s Asian colonial city street ambience with distant vintage tram bell, gentle bicycle bells, and a large cloth flag fluttering proudly in warm breeze, historical documentary foley, no music",
  },
  {
    name: "sfx_market_farm_montage.mp3",
    durationSeconds: 4.5,
    promptInfluence: 0.55,
    prompt: "Warm lively traditional Indonesian morning marketplace murmur blending smoothly with distant factory machinery hum and rustling footsteps on gravel, subtle documentary ambience, no music",
  },
  {
    name: "sfx_map_lines_shimmer.mp3",
    durationSeconds: 4.2,
    promptInfluence: 0.55,
    prompt: "Delicate archival parchment map unfolding softly followed by three crisp resonant compass clicks and a warm glowing chime converging into unity, clean documentary transition foley",
  },
  {
    name: "sfx_meeting_hall_discussion.mp3",
    durationSeconds: 5.0,
    promptInfluence: 0.55,
    prompt: "Intimate 1950s wooden meeting room ambience with quiet thoughtful student discussions, papers rustling on a wooden table, and warm resonant room tone, historical documentary foley",
  },
  {
    name: "sfx_congress_gavel_applause.mp3",
    durationSeconds: 4.8,
    promptInfluence: 0.60,
    prompt: "Crisp authoritative wooden chairman gavel striking three times in a grand historical wooden hall followed by warm dignified crowd applause swelling proudly, cinema documentary sound design",
  },
  {
    name: "sfx_speech_podium_crowd.mp3",
    durationSeconds: 5.0,
    promptInfluence: 0.55,
    prompt: "Warm vintage 1950s outdoor rally ambience with subtle vintage microphone hum and an inspired respectful crowd murmur swelling gently with pride, historical film atmosphere, no talking",
  },
  {
    name: "sfx_archipelago_pins_bloom.mp3",
    durationSeconds: 4.2,
    promptInfluence: 0.55,
    prompt: "Series of delicate warm crystalline map pins blooming gracefully across stereo space like spreading sparks of light across an archipelago, subtle uplifting documentary sound design",
  },
  {
    name: "sfx_march_emblem_resolve.mp3",
    durationSeconds: 5.0,
    promptInfluence: 0.55,
    prompt: "Steady unified footsteps of determined students marching together transitioning smoothly into a dignified warm resonant brass-like harmonic swell and gentle flag flutter resolving quietly",
  },
];

function expandWordForTts(disp) {
  // Separate leading/trailing punctuation cleanly
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

/** Exact multi-word aware alignment: maps each display token to its exact 1..N spoken runs (zero drift after years/acronyms!). */
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

/** Group aligned words into crisp 4-7 word deckle-edge parchment subtitle cards (max 2 balanced lines). */
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
        (cur.length >= 7 && remaining >= 2) ||
        (textLen >= 38 && cur.length >= 4 && remaining >= 2);
      if (shouldBreak) {
        chunks.push(cur);
        cur = [];
      }
    }
    if (cur.length) chunks.push(cur);

    for (const chunk of chunks) {
      const fullStr = chunk.map((x) => x.w).join(" ");
      let lines;
      if (fullStr.length <= 23 || chunk.length <= 3) {
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
    cards[0].startFrame = 0; // Frame-0 instant hook readability!
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
  const outStoryTs = join(ROOT, "remotion/videos/gmni-history/story.ts");
  const tmpBase = join(PROJECT, ".tmp");

  mkdirSync(voCacheDir, { recursive: true });
  mkdirSync(sfxDir, { recursive: true });
  mkdirSync(dirname(outStoryTs), { recursive: true });
  mkdirSync(tmpBase, { recursive: true });

  const prepared = BEATS.map((b, idx) => ({ ...b, idx, ...prepareBeat(b.text, idx) }));
  const tmpDir = mkdtempSync(join(tmpBase, "vo-build-"));

  try {
    console.log(`=== [1/2] Synthesizing ElevenLabs v4 Narrator VO (Brian, Natural Documentary Tempo ${TEMPO}x, Pronunciation Shield ON) ===`);
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
          applyTextNormalization: "off", // Crucial: prevents English acronym/year normalization!
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

    const storyTs = `// AUTO-GENERATED by gmni-history/scripts/build_vo_and_sfx.mjs from ElevenLabs eleven_v4 character timestamps.
// Do not edit timings by hand — re-run the generator to resync.

export interface SubtitleCardSpec {
  scene: number;
  startFrame: number;
  endFrame: number;
  lines: string[];
  highlights: Array<[number, number, number]>;
}

export const GMNI_FPS = ${FPS};
export const GMNI_FRAMES = ${totalFrames};
export const GMNI_DURATION_SEC = ${totalVideoSec};

export const SCENES = ${JSON.stringify(scenesFrame, null, 2)} as const;

export const CUES = ${JSON.stringify(cueMapFrame, null, 2)} as const;

export const CUES_SEC = ${JSON.stringify(cueMapSec, null, 2)} as const;

export const SUBTITLE_CARDS: SubtitleCardSpec[] = ${JSON.stringify(subtitleCards, null, 2)};
`;
    writeFileSync(outStoryTs, storyTs, "utf8");
    console.log(`\nVO COMPLETE -> ${outVoWav} (${voDur.toFixed(2)}s VO, ${totalVideoSec.toFixed(2)}s video / ${totalFrames} frames, ${allWords.length} words, ${Object.keys(cueMapFrame).length} cues, ${subtitleCards.length} cards)`);

    console.log("\n=== [2/2] Generating 8 Bespoke 1950s Historical Documentary SFX via ElevenLabs eleven_text_to_sound_v3 ===");
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
