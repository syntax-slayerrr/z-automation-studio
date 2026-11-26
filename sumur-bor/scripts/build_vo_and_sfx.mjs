/**
 * ElevenLabs `eleven_v4` Verbatim VO & Bespoke Sound-V3 SFX Builder for "SumurBorShort"
 * ("BEDAH: SUMUR BOR — Bagaimana manusia menemukan air di bawah tanah?", 120–130s, 8 Scenes)
 *
 * - 100% Verbatim User Script across all 8 scenes with exact [[cue]] storyboard anchors.
 * - Primary Narrator: Brian (`nPczCjzI2devNBz1zQrb`) via `eleven_v4` (`languageCode: "id"`).
 * - Generous 140ms consonant pre-roll (`trimLead = aligned[0].start - 0.14`) -> ZERO clipped syllables!
 * - Auto-retry (3 attempts) on transient network hiccups + SHA-1 caching.
 * - Generates 3 bespoke tactile mechanical/hydrogeological SFX via `eleven_text_to_sound_v3`.
 *
 * Run:
 *   node --env-file=.env sumur-bor/scripts/build_vo_and_sfx.mjs
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
const TEMPO = 1.22; // Targets exact 120–130s pacing cleanly across all 8 detailed scenes!
const OPEN_LEAD_SILENCE_S = 0.60; // Mechanical faucet squeak & first drop breath before VO enters!
const END_TAIL_PAD_S = 3.80;      // Closing reflection card hold

const NARRATOR = {
  id: "nPczCjzI2devNBz1zQrb", // Brian — Warm, Articulate Indonesian Documentary Storyteller
  label: "Brian (Warm Documentary Storyteller)",
  stability: 0.49,
  similarityBoost: 0.78,
};

const PHONETIC_MAP = {
  "air": ["air"],
  "airnya": ["airnya"],
  "api": ["api"],
  "casing": ["kesing"],
  "screen": ["skrin"],
  "akuifer": ["akuifer"],
};

// 100% VERBATIM 8-Scene Script with exact [[cue]] storyboard anchors
const BEATS = [
  // SCENE 01 — KETIKA AIR BERHENTI MENGALIR (00:00–00:13 | PROBLEM)
  {
    scene: 1,
    pauseAfterS: 0.34,
    text: "[calm] [[s1_faucet]]Pagi hari. Kamu membuka keran untuk mandi, [[s1_drip]]tapi tidak ada setetes air pun yang keluar.",
  },
  {
    scene: 1,
    pauseAfterS: 0.30,
    text: "[thoughtful] [[s1_bucket]]Bak mandi kosong. Ember kosong. Bahkan untuk memasak pun, air harus dibeli.",
  },
  {
    scene: 1,
    pauseAfterS: 0.46,
    text: "[curious] [[s1_descent]]Padahal, jauh di bawah tempat kita berdiri, mungkin ada cadangan air yang selama ini tidak pernah kita lihat.",
  },

  // SCENE 02 — AIR YANG TERSEMBUNYI (00:13–00:28 | INVESTIGATION)
  {
    scene: 2,
    pauseAfterS: 0.30,
    text: "[steady] [[s2_strata]]Air hujan tidak semuanya langsung mengalir ke sungai.",
  },
  {
    scene: 2,
    pauseAfterS: 0.32,
    text: "[thoughtful] [[s2_pores]]Sebagiannya meresap melewati pori-pori tanah dan celah batuan, [[s2_watertable]]lalu tersimpan di dalam lapisan yang mampu menyimpan dan mengalirkan air.",
  },
  {
    scene: 2,
    pauseAfterS: 0.48,
    text: "[resonant] [[s2_aquifer]]Lapisan inilah yang disebut akuifer.",
  },

  // SCENE 03 — MENENTUKAN TEMPAT MENGEBOR (00:28–00:41 | PLANNING)
  {
    scene: 3,
    pauseAfterS: 0.30,
    text: "[steady] [[s3_map]]Tapi bukan berarti kita bisa mengebor sembarang tempat dan langsung menemukan air.",
  },
  {
    scene: 3,
    pauseAfterS: 0.48,
    text: "[warm] [[s3_geophys]]Kita perlu mempelajari kondisi geologi, memperkirakan kedalaman akuifer, [[s3_marker]]dan menentukan titik pengeboran yang tepat.",
  },

  // SCENE 04 — MENEMBUS LAPISAN TANAH (00:41–00:57 | DRILLING)
  {
    scene: 4,
    pauseAfterS: 0.30,
    text: "[energetic] [[s4_rig]]Setelah lokasi ditentukan, mesin bor mulai bekerja.",
  },
  {
    scene: 4,
    pauseAfterS: 0.32,
    text: "[steady] [[s4_bit]]Mata bor berputar, menembus tanah dan batuan sedikit demi sedikit.",
  },
  {
    scene: 4,
    pauseAfterS: 0.48,
    text: "[curious] [[s4_cuttings]]Material hasil pengeboran naik ke permukaan, memperlihatkan lapisan apa saja yang telah dilewati.",
  },

  // SCENE 05 — MEMBANGUN SUMUR DI DALAM TANAH (00:57–01:15 | WELL CONSTRUCTION)
  {
    scene: 5,
    pauseAfterS: 0.28,
    text: "[thoughtful] [[s5_borehole]]Namun, lubang bor saja belum cukup.",
  },
  {
    scene: 5,
    pauseAfterS: 0.30,
    text: "[steady] [[s5_casing]]Di dalamnya harus dipasang casing sebagai pelindung dinding sumur.",
  },
  {
    scene: 5,
    pauseAfterS: 0.32,
    text: "[warm] [[s5_screen]]Pada bagian akuifer dipasang screen, yaitu pipa berlubang yang memungkinkan air masuk.",
  },
  {
    scene: 5,
    pauseAfterS: 0.48,
    text: "[steady] [[s5_gravel]]Ruang di sekelilingnya dapat diisi kerikil penyaring, [[s5_seal]]sementara bagian tertentu disegel untuk mencegah masuknya kontaminan dari permukaan.",
  },

  // SCENE 06 — MENGUJI APAKAH AIRNYA BISA DIGUNAKAN (01:15–01:31 | TESTING)
  {
    scene: 6,
    pauseAfterS: 0.30,
    text: "[steady] [[s6_develop]]Setelah konstruksi selesai, sumur dibersihkan dan dikembangkan untuk mengurangi material halus yang tersisa.",
  },
  {
    scene: 6,
    pauseAfterS: 0.30,
    text: "[warm] [[s6_pump]]Kemudian dilakukan uji pemompaan untuk mengetahui kemampuan sumur menghasilkan air.",
  },
  {
    scene: 6,
    pauseAfterS: 0.48,
    text: "[serious tone] [[s6_lab]]Sampelnya juga diuji di laboratorium. Sebab, air yang terlihat jernih belum tentu aman diminum.",
  },

  // SCENE 07 — AIR AKHIRNYA MENGALIR (01:31–01:50 | SOLUTION)
  {
    scene: 7,
    pauseAfterS: 0.32,
    text: "[warm] [[s7_track]]Setelah hasil pengujian diketahui dan kebutuhan pengolahan air ditentukan, sistem pemompaan serta instalasi distribusi disiapkan.",
  },
  {
    scene: 7,
    pauseAfterS: 0.50,
    text: "[bright] [[s7_tank]]Kini air dapat dialirkan menuju tempat penampungan [[s7_home]]dan digunakan sesuai kualitasnya.",
  },

  // SCENE 08 — PENUTUP: SUMBER AIR BUKAN BERARTI TANPA BATAS (01:50–02:05 | REFLECTION)
  {
    scene: 8,
    pauseAfterS: 0.32,
    text: "[calm] [[s8_iso]]Sumur bor memang bisa menjadi solusi ketika sumber air lain tidak mencukupi.",
  },
  {
    scene: 8,
    pauseAfterS: 0.32,
    text: "[thoughtful] [[s8_balance]]Tapi air tanah bukan sumber yang tidak terbatas. Jika diambil lebih cepat daripada kemampuannya untuk pulih, cadangannya bisa menurun.",
  },
  {
    scene: 8,
    pauseAfterS: 0.28,
    text: "[resonant] [[s8_closing]]Karena itu, membangun sumur bor bukan hanya soal menemukan air, tetapi juga tentang mengelolanya dengan bijak.",
  },
];

// 3 Bespoke Tactile Mechanical & Hydrogeological SFX via ElevenLabs Sound-V3
const BESPOKE_SFX = [
  {
    name: "sfx_faucet_squeak_drip.mp3",
    durationSeconds: 4.5,
    promptInfluence: 0.55,
    prompt: "Metallic chrome bathroom faucet handle squeaking open followed by three slow clear echoing water droplets falling and plopping sharply onto the dry bottom of an empty plastic bucket in a quiet tiled bathroom, clean foley, no music",
  },
  {
    name: "sfx_drill_rig_grinding.mp3",
    durationSeconds: 5.5,
    promptInfluence: 0.55,
    prompt: "Mechanical rotary water well drilling rig engine humming steadily with steel drill bit grinding through earth, gravel, and stone layers underground, clean documentary industrial foley, no music",
  },
  {
    name: "sfx_submersible_pump_flow.mp3",
    durationSeconds: 5.0,
    promptInfluence: 0.55,
    prompt: "Smooth electric submersible water pump starting up underwater transitioning into clean pressurized clear water flowing joyfully from a chrome kitchen faucet into a bucket, natural documentary foley, no music",
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
    const expected = dt.spoken.map(normWord).join("");
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
      acc.length < expected.length &&
      expected.startsWith(acc + normWord(spokenRuns[rIdx].text))
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
      ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", filePath],
      { encoding: "utf8" }
    ).trim()
  );
}

function renderCleanNarratorWav(mp3Path, wavPath) {
  const eq =
    "highpass=f=80,equalizer=f=160:t=q:w=1.1:g=1.5,equalizer=f=3200:t=q:w=1.3:g=1.7,equalizer=f=6500:t=q:w=1.4:g=-1.2";
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

async function generateBespokeSfx(client, sfxDir) {
  console.log(`\n=== [2/2] Generating 3 Bespoke Sumur Bor Foley Clips via ${SFX_MODEL} ===`);
  for (const item of BESPOKE_SFX) {
    const outPath = join(sfxDir, item.name);
    if (existsSync(outPath)) {
      console.log(`  [CACHED] ${item.name}`);
      continue;
    }
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`  [SYNTH ] ${item.name} (${item.durationSeconds}s)`);
        const stream = await client.textToSoundEffects.convert({
          text: item.prompt,
          durationSeconds: item.durationSeconds,
          promptInfluence: item.promptInfluence,
          modelId: SFX_MODEL,
        });
        const chunks = [];
        for await (const chunk of stream) chunks.push(Buffer.from(chunk));
        writeFileSync(outPath, Buffer.concat(chunks));
        console.log(`  [OK    ] ${item.name} (${Buffer.concat(chunks).length} bytes)`);
        break;
      } catch (err) {
        if (attempt === 3 || err?.statusCode === 401 || err?.statusCode === 402) {
          console.warn(`  [WARN  ] Could not synthesize ${item.name}: ${err?.message ?? err}`);
          break;
        }
        await new Promise((r) => setTimeout(r, 1500 * attempt));
      }
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
  const outStoryTs = join(ROOT, "remotion/videos/sumur-bor/story.ts");
  const tmpBase = join(PROJECT, ".tmp");

  mkdirSync(voCacheDir, { recursive: true });
  mkdirSync(sfxDir, { recursive: true });
  mkdirSync(dirname(outStoryTs), { recursive: true });
  mkdirSync(tmpBase, { recursive: true });

  const prepared = BEATS.map((b, idx) => ({ ...b, idx, ...prepareBeat(b.text, idx) }));
  const tmpDir = mkdtempSync(join(tmpBase, "vo-sumur-"));

  try {
    console.log(`=== [1/2] Synthesizing ElevenLabs ${TTS_MODEL} Verbatim VO (${NARRATOR.label}, tempo=${TEMPO}x, 140ms Pre-Roll) ===`);
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
        .update(JSON.stringify({ id: NARRATOR.id, model: TTS_MODEL, text: beat.ttsText, prev: prev?.ttsPlainNoTags ?? "", next: next?.ttsPlainNoTags ?? "", norm: "off" }))
        .digest("hex")
        .slice(0, 12);
      const mp3Path = join(voCacheDir, `el_${String(i).padStart(2, "0")}_${cacheKey}.mp3`);
      const alignPath = join(voCacheDir, `el_${String(i).padStart(2, "0")}_${cacheKey}.json`);

      let alignment;
      if (existsSync(mp3Path) && existsSync(alignPath)) {
        console.log(`  [${i + 1}/${prepared.length}] CACHED Scene${beat.scene}: ${beat.displayTokens.map((x) => x.w).join(" ")}`);
        alignment = JSON.parse(readFileSync(alignPath, "utf8"));
      } else {
        console.log(`  [${i + 1}/${prepared.length}] SYNTH  Scene${beat.scene}: ${beat.ttsText}`);
        let res;
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            res = await client.textToSpeech.convertWithTimestamps(NARRATOR.id, {
              text: beat.ttsText,
              modelId: TTS_MODEL,
              languageCode: "id",
              outputFormat: "mp3_44100_128",
              applyTextNormalization: "off",
              voiceSettings: { stability: NARRATOR.stability, similarityBoost: NARRATOR.similarityBoost },
              ...(prev ? { previousText: prev.ttsPlainNoTags } : {}),
              ...(next ? { nextText: next.ttsPlainNoTags } : {}),
            });
            break;
          } catch (err) {
            if (attempt === 3 || err?.statusCode === 401 || err?.statusCode === 402) throw err;
            console.warn(`    [RETRY ${attempt}/3] ${err?.message ?? err}`);
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
      const trimLead = aligned.length ? Math.max(0, Number((aligned[0].start - 0.14).toFixed(3))) : 0;
      const lastEnd = aligned.length ? aligned[aligned.length - 1].end : clipDur;
      const srcSpan = Math.max(0.14, Math.min(clipDur - trimLead, Number((lastEnd - trimLead + 0.14).toFixed(3))));
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

    console.log(`\n=== 8-SCENE BEDAH SUMUR BOR TIMING BREAKDOWN (Tempo ${TEMPO}x) ===`);
    for (let s = 1; s <= 8; s++) {
      const f0 = scenesFrame[`scene${s}Start`];
      const f1 = s < 8 ? scenesFrame[`scene${s + 1}Start`] : totalFrames;
      console.log(`  Scene ${s}: f=${f0}..${f1 - 1} (${(f0 / FPS).toFixed(2)}s -> ${(f1 / FPS).toFixed(2)}s | dur=${((f1 - f0) / FPS).toFixed(2)}s)`);
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
      scenesFrame,
      words: allWords,
    };
    writeFileSync(outAlignJson, JSON.stringify(alignObj, null, 2) + "\n", "utf8");

    const storyTs = `// AUTO-GENERATED by sumur-bor/scripts/build_vo_and_sfx.mjs
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
  id: "SumurBorShort",
  width: 1080,
  height: 1920,
  fps: ${FPS},
  durationInFrames: ${totalFrames},
  durationSec: ${totalVideoSec},
  audioMasterPath: "sumur-bor/audio_master.m4a",
} as const;

export const SCENES = ${JSON.stringify(scenesFrame, null, 2)} as const;

export const CUES = ${JSON.stringify(cueMapFrame, null, 2)} as const;

export const CUES_SEC = ${JSON.stringify(cueMapSec, null, 2)} as const;

export const SUBTITLE_CHUNKS: SubtitleChunk[] = ${JSON.stringify(subtitleChunks, null, 2)};
`;
    writeFileSync(outStoryTs, storyTs, "utf8");
    console.log(`\nVO COMPLETE -> ${outVoWav} (${voDur.toFixed(2)}s VO | ${totalVideoSec.toFixed(2)}s video / ${totalFrames} frames, ${allWords.length} words)`);

    await generateBespokeSfx(client, sfxDir);
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
