/**
 * Audio-first Episode 03 ("Ketika Gagasan Turun ke Kelas") VO builder using ElevenLabs (`eleven_v4`).
 *
 * - Primary Narrator: Chris (`iP95p4xoKVk53GoZ742B`, baritone f0 ~126.7 Hz matching EP01/EP02 Galang ~118.1 Hz)
 *   + gentle analog-warmth chest EQ during FFmpeg WAV mastering (zero pitch/time artifacts).
 * - Reconstruction Voices (`REKONSTRUKSI · KADER`):
 *   - `andi` (Kader Putra): Will (`bIHbv24MWmeRgasZH58o`)
 *   - `anisa` (Kader Putri): Bella (`hpp4J3VqNfWAUOO0d1Us`)
 * - Uses calibrated ElevenLabs `eleven_v4` inline audio tags + request stitching + character-level timestamps
 *   to output crystal-clean `public/audio/ep03/ep03_vo.wav` & exact `src/episodes/ep03/alignment.json`.
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT = resolve(__dirname, "..");

const MODEL_ID = "eleven_v4";
const SR = 44100;
const OPEN_LEAD_SILENCE_S = 0.35;

const SPEAKERS = {
  galang: {
    id: "iP95p4xoKVk53GoZ742B", // Chris — closest warm baritone timbre to Galang (118.1 Hz)
    label: "Chris (Galang-Match Baritone)",
    stability: 0.48,
    similarityBoost: 0.78,
  },
  andi: {
    id: "bIHbv24MWmeRgasZH58o", // Will — natural young Indonesian cadet (Kader Putra)
    label: "Will (Kader Putra)",
    stability: 0.56,
    similarityBoost: 0.78,
  },
  anisa: {
    id: "hpp4J3VqNfWAUOO0d1Us", // Bella — warm steady young cadet (Kader Putri)
    label: "Bella (Kader Putri)",
    stability: 0.58,
    similarityBoost: 0.78,
  },
};

// Display token -> natural spoken Indonesian expansion for ElevenLabs
const NUM_SPOKEN = {
  IPM: "I.P.M.",
  PC: "P.C.",
  "1923": "seribu sembilan ratus dua puluh tiga",
  "1958": "seribu sembilan ratus lima puluh delapan",
  "da'i": "da-i",
};

// Cohesive beats synced 1:1 with `src/episodes/ep03/production/narration_master.txt`.
// Scenes (5 scenes = S0..S4):
//   S0: Muktamar Desk & Open Doorway (`object_doorway`)
//   S1: Empty Afternoon Classroom & PP->PW->PD->PC->PR Hierarchy (`CLM-03-01`)
//   S2: Sistem Perkaderan IPM: FORTASI & Taruna Melati (`CLM-03-02`)
//   S3: 3D Archival Map -> Garut 1923 & 1958 (`CLM-03-03`)
//   S4: PC IPM Panawuan & L03 Closing Bridge (`CLM-03-04`, `L03`)
const BEATS = [
  // S0 — Ambang Pintu & Berkas Muktamar
  {
    scene: 0,
    speaker: "galang",
    pauseAfterS: 0.52,
    text: "[thoughtful] [[s0_desk]]Di atas meja muktamar, berkas tanfidz [[s0_close]]baru saja ditutup. [pauses] [serious tone] [[s0_door]]Tapi ruang sidang bukan tempat [[s0_hall]]keputusan itu bekerja.",
  },
  // S1 — Ruang Kelas Sore & Jenjang Organisasi PP -> PR
  {
    scene: 1,
    speaker: "andi",
    pauseAfterS: 0.36,
    text: "[quietly] [[s1_class]]Kelas sudah lengang. [[s1_ask]]Bagaimana aturan pusat ini sampai ke siswa baru?",
  },
  {
    scene: 1,
    speaker: "galang",
    pauseAfterS: 0.52,
    text: "[steady] [[s1_flow]]Dari Pimpinan Pusat, mandat mengalir lewat Wilayah, Daerah, dan Cabang. [warmly] Ujung tombaknya [[s1_ranting]]berdetak di Pimpinan Ranting: [[s1_basis]]di sekolah, madrasah, panti asuhan, hingga kampung.",
  },
  // S2 — Dua Pintu Perkaderan SPI: FORTASI & Taruna Melati
  {
    scene: 2,
    speaker: "galang",
    pauseAfterS: 0.24,
    text: "[serious tone] [[s2_spi]]Agar keputusan tidak menguap di kertas, hadir Sistem Perkaderan [[s2_ipm]]IPM. [pauses] [[s2_fortasi]]Pintu pertamanya FORTASI. [steady] Di sini pelajar baru [[s2_orient]]mengenal arah gerakan sebelum tahun ajaran dimulai.",
  },
  {
    scene: 2,
    speaker: "galang",
    pauseAfterS: 0.28,
    text: "[calm] Sesudah itu menyusul jenjang [[s2_tm]]Taruna Melati, dari tingkat satu hingga utama.",
  },
  {
    scene: 2,
    speaker: "anisa",
    pauseAfterS: 0.55,
    text: "[warmly] [[s2_sched]]Jadwal orientasi harus siap dulu. Supaya adik kelas [[s2_home]]merasa punya rumah.",
  },
  // S3 — Peta Priangan: Garut 1923 & 1958
  {
    scene: 3,
    speaker: "galang",
    pauseAfterS: 0.38,
    text: "[thoughtful] [[s3_map]]Akar kerja nyata seperti ini tidak lahir di ibu kota semata. [pauses] [serious tone] Sejak [[s3_1923]]1923, Garut berdiri sebagai cabang perintis Muhammadiyah di Jawa Barat.",
  },
  {
    scene: 3,
    speaker: "galang",
    pauseAfterS: 0.62,
    text: "[reflective] Di dataran tinggi ini pula [[s3_1958]]Konferensi Pemuda 1958 menyalakan gagasan wadah pelajar.",
  },
  // S4 — PC IPM Panawuan & Jembatan L03
  {
    scene: 4,
    speaker: "galang",
    pauseAfterS: 0.22,
    text: "[quietly] [[s4_pause]]Puluhan tahun berselang. [pauses] [warmly] [[s4_panawuan]]Denyut sejarah itu belum mengering menjadi arsip tua.",
  },
  {
    scene: 4,
    speaker: "galang",
    pauseAfterS: 0.56,
    text: "[steady] Di [[s4_tarogong]]Tarogong Kidul, [[s4_pcipm]]PC IPM Panawuan menjaga pengkaderan ranting lewat [[s4_pdpm]]Taruna Melati dan pelatihan da'i pelajar.",
  },
  {
    scene: 4,
    speaker: "galang",
    pauseAfterS: 0.45,
    text: "[reflective] Satu pertanyaan tinggal [[s4_bridge]]di balik jendela cabang: [pauses] [serious tone] bagaimana generasi baru merawat api ini [[s4_endcard]]tetap menyala?",
  },
];

function expandCore(core) {
  if (Object.hasOwn(NUM_SPOKEN, core)) return NUM_SPOKEN[core].split(/\s+/);
  return [core];
}

/** Parse annotated beat into (display tokens with cue markers, TTS string preserving [tags]). */
function prepareBeat(rawText, lineIdx) {
  const displayTokens = [];
  const ttsChunks = [];
  let spokenIdx = 0;

  // Match only single-bracket emotion tags `[tag]`, never `[[cue]]` markers attached to words.
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
      const cm = disp.match(/^([^0-9A-Za-z']*)([0-9A-Za-z'-]+)([^0-9A-Za-z']*)$/);
      let spokenWords;
      let spokenStr;
      if (cm) {
        const [, pre, core, post] = cm;
        spokenWords = expandCore(core);
        const joined = spokenWords.join(" ");
        const cleanPost = post === "." && joined.endsWith(".") ? "" : post;
        spokenStr = `${pre}${joined}${cleanPost}`;
      } else {
        spokenWords = [disp];
        spokenStr = disp;
      }
      displayTokens.push({
        w: disp,
        cue,
        line: lineIdx,
        spokenStartIdx: spokenIdx,
        spokenCount: spokenWords.length,
        spokenWords,
      });
      ttsChunks.push(spokenStr);
      spokenIdx += spokenWords.length;
    }
  }

  return {
    displayTokens,
    ttsText: ttsChunks.join(" ").replace(/\s{2,}/g, " ").trim(),
    ttsPlainNoTags: ttsChunks.filter((x) => !/^\[[^\[\]]+\]$/.test(x)).join(" ").replace(/\s{2,}/g, " ").trim(),
    expectedSpokenCount: spokenIdx,
  };
}

/** Extract non-bracket whitespace-delimited words from ElevenLabs character alignment. */
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

function getWavDurationSec(wavPath) {
  const out = execFileSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", wavPath],
    { encoding: "utf8" }
  ).trim();
  return Number.parseFloat(out);
}

function trimMp3ToCleanWav(mp3Path, wavPath, speaker) {
  // Subtle warm archival documentary EQ matching EP01/EP02 chest body (+1.4 dB @ 155 Hz, -1.2 dB @ 5.2 kHz)
  const eqFilter =
    speaker === "galang"
      ? "highpass=f=70,equalizer=f=155:t=q:w=1.1:g=1.4,equalizer=f=5200:t=q:w=1.2:g=-1.2"
      : "highpass=f=85,equalizer=f=5200:t=q:w=1.2:g=-0.8";
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
      `${eqFilter},silenceremove=start_periods=0:stop_periods=-1:stop_duration=0.35:stop_threshold=-55dB,afade=t=out:st=0:d=0.01`,
      "-sample_fmt",
      "s16",
      wavPath,
    ],
    { stdio: "inherit" }
  );
}

function renderClipWav(mp3Path, wavPath, speaker) {
  const eqFilter =
    speaker === "galang"
      ? "highpass=f=70,equalizer=f=155:t=q:w=1.1:g=1.5,equalizer=f=5200:t=q:w=1.2:g=-1.2"
      : "highpass=f=85,equalizer=f=5200:t=q:w=1.2:g=-0.8";
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
      eqFilter,
      "-sample_fmt",
      "s16",
      wavPath,
    ],
    { stdio: "inherit" }
  );
}

async function main() {
  const client = new ElevenLabsClient();
  const outAudioDir = join(PROJECT, "public/audio/ep03");
  const outMasterWav = join(outAudioDir, "ep03_vo.wav");
  const outAlignJson = join(PROJECT, "src/episodes/ep03/alignment.json");
  const outTtsTxt = join(PROJECT, "src/episodes/ep03/production/narration_tts.txt");

  mkdirSync(outAudioDir, { recursive: true });
  mkdirSync(dirname(outAlignJson), { recursive: true });
  mkdirSync(dirname(outTtsTxt), { recursive: true });

  const prepared = BEATS.map((b, idx) => ({
    ...b,
    idx,
    ...prepareBeat(b.text, idx),
  }));

  writeFileSync(
    outTtsTxt,
    prepared.map((p) => `[S${p.scene} | ${p.speaker}] ${p.ttsText}`).join("\n\n") + "\n",
    "utf8"
  );

  const cacheDir = join(PROJECT, "out/ep03/vo_cache");
  mkdirSync(cacheDir, { recursive: true });
  const tmpDir = mkdtempSync(join(tmpdir(), "ipm-ep03-vo-"));
  try {
    const concatParts = [];
    const leadSilWav = join(tmpDir, "sil_lead.wav");
    execFileSync(
      "ffmpeg",
      ["-y", "-loglevel", "error", "-f", "lavfi", "-i", `anullsrc=r=${SR}:cl=mono`, "-t", String(OPEN_LEAD_SILENCE_S), "-sample_fmt", "s16", leadSilWav],
      { stdio: "inherit" }
    );
    concatParts.push(leadSilWav);

    let cursorSec = OPEN_LEAD_SILENCE_S;
    const allWords = [];

    for (let i = 0; i < prepared.length; i++) {
      const beat = prepared[i];
      const spk = SPEAKERS[beat.speaker];
      const prevGalang = prepared.slice(0, i).reverse().find((x) => x.speaker === "galang");
      const nextGalang = prepared.slice(i + 1).find((x) => x.speaker === "galang");

      const cacheKey = createHash("sha1")
        .update(JSON.stringify({ id: spk.id, stab: spk.stability, sim: spk.similarityBoost, text: beat.ttsText, prev: prevGalang?.ttsPlainNoTags ?? "", next: nextGalang?.ttsPlainNoTags ?? "" }))
        .digest("hex")
        .slice(0, 12);
      const mp3Path = join(cacheDir, `beat_${i}_${cacheKey}.mp3`);
      const alignPath = join(cacheDir, `beat_${i}_${cacheKey}.json`);

      let alignment;
      if (existsSync(mp3Path) && existsSync(alignPath)) {
        console.log(`[${i + 1}/${prepared.length}] CACHED S${beat.scene} (${beat.speaker}): ${beat.ttsText}`);
        alignment = JSON.parse(readFileSync(alignPath, "utf8"));
      } else {
        console.log(`[${i + 1}/${prepared.length}] SYNTH S${beat.scene} (${beat.speaker}): ${beat.ttsText}`);
        const res = await client.textToSpeech.convertWithTimestamps(spk.id, {
          text: beat.ttsText,
          modelId: MODEL_ID,
          languageCode: "id",
          outputFormat: "mp3_44100_128",
          applyTextNormalization: "on",
          voiceSettings: {
            stability: spk.stability,
            similarityBoost: spk.similarityBoost,
          },
          ...(beat.speaker === "galang" && prevGalang ? { previousText: prevGalang.ttsPlainNoTags } : {}),
          ...(beat.speaker === "galang" && nextGalang ? { nextText: nextGalang.ttsPlainNoTags } : {}),
        });
        writeFileSync(mp3Path, Buffer.from(res.audioBase64, "base64"));
        alignment = res.alignment;
        writeFileSync(alignPath, JSON.stringify(alignment, null, 2));
      }

      const rawWav = join(tmpDir, `beat_${i}.wav`);
      renderClipWav(mp3Path, rawWav, beat.speaker);

      const spokenRuns = extractSpokenRuns(alignment);
      if (spokenRuns.length !== beat.expectedSpokenCount) {
        throw new Error(
          `Alignment count mismatch on beat ${i} (expected ${beat.expectedSpokenCount}, got ${spokenRuns.length}):\n` +
            `  expected tokens: ${beat.displayTokens.flatMap((d) => d.spokenWords).join(" | ")}\n` +
            `  actual runs    : ${spokenRuns.map((r) => r.text).join(" | ")}`
        );
      }

      const clipDur = getWavDurationSec(rawWav);
      const lastEnd = spokenRuns[spokenRuns.length - 1].end;
      const keptDur = Math.min(clipDur, Number((lastEnd + 0.14).toFixed(3)));
      const trimWav = join(tmpDir, `beat_${i}_trim.wav`);
      execFileSync(
        "ffmpeg",
        [
          "-y",
          "-loglevel",
          "error",
          "-i",
          rawWav,
          "-t",
          String(keptDur),
          "-af",
          `afade=t=in:st=0:d=0.008,afade=t=out:st=${Math.max(0, keptDur - 0.015).toFixed(3)}:d=0.015`,
          "-sample_fmt",
          "s16",
          trimWav,
        ],
        { stdio: "inherit" }
      );

      for (const dt of beat.displayTokens) {
        const firstRun = spokenRuns[dt.spokenStartIdx];
        const lastRun = spokenRuns[dt.spokenStartIdx + dt.spokenCount - 1];
        allWords.push({
          w: dt.w,
          cue: dt.cue,
          scene: beat.scene,
          line: dt.line,
          speaker: beat.speaker,
          start: Number((cursorSec + firstRun.start).toFixed(3)),
          end: Number((cursorSec + lastRun.end).toFixed(3)),
        });
      }

      concatParts.push(trimWav);
      cursorSec += keptDur;

      const silWav = join(tmpDir, `sil_${i}.wav`);
      execFileSync(
        "ffmpeg",
        ["-y", "-loglevel", "error", "-f", "lavfi", "-i", `anullsrc=r=${SR}:cl=mono`, "-t", String(beat.pauseAfterS), "-sample_fmt", "s16", silWav],
        { stdio: "inherit" }
      );
      concatParts.push(silWav);
      cursorSec += beat.pauseAfterS;
    }

    const concatListPath = join(tmpDir, "concat.txt");
    writeFileSync(concatListPath, concatParts.map((p) => `file '${p.replace(/\\/g, "/")}'`).join("\n"), "utf8");

    // Stitch & level normalize VO cleanly (peak -2.0 dB before SFX/BGM mix)
    execFileSync(
      "ffmpeg",
      [
        "-y",
        "-loglevel",
        "error",
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        concatListPath,
        "-af",
        "loudnorm=I=-16:TP=-2.0:LRA=6:linear=true",
        "-ar",
        String(SR),
        "-ac",
        "1",
        "-sample_fmt",
        "s16",
        outMasterWav,
      ],
      { stdio: "inherit" }
    );

    const finalDur = getWavDurationSec(outMasterWav);
    const alignmentOut = {
      voice: "Chris (Galang-match baritone) + Will (Kader Putra) + Bella (Kader Putri) · ElevenLabs v4",
      model: MODEL_ID,
      duration: Number(finalDur.toFixed(3)),
      words: allWords,
    };
    writeFileSync(outAlignJson, JSON.stringify(alignmentOut, null, 2) + "\n", "utf8");
    console.log(`\nEP03 VO COMPLETE -> ${outMasterWav} (${finalDur.toFixed(3)}s, ${allWords.length} words)`);
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
