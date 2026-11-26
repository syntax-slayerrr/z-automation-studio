/**
 * Audio-First Trio-Voice ElevenLabs eleven_v4 + Bespoke Room SFX Generator
 * for "ZaldyRoomShowcase" ("Kamar Baru & Wujud 3D Bos Zaldy: Kolaborasi Perdana 3 Karakter!")
 *
 * - Zaldy    : Eric (`cjVigY5qzO86Huf0OWal`) — LOCKED Calm, Cool, Smooth creator (`stability: 0.72`, `similarityBoost: 0.88`, `style: 0.06`, `seed: 2026`, `tempo: 1.05`)
 * - Hermes   : Brian (`nPczCjzI2devNBz1zQrb`) — LOCKED Studio Strategist (`stability: 0.72`, `similarityBoost: 0.90`, `seed: 4242`, `tempo: 1.10`)
 * - OpenClaw : Liam (`TX3LPaxmHKxFdv7VOQHJ`) — LOCKED Expressive Comedy Mascot (`stability: 0.38`, `similarityBoost: 0.78`, `tempo: 1.14`)
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
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
const OPEN_LEAD_SILENCE_S = 0.24;
const END_HOLD_S = 2.4;

const VOICES = {
  zaldy: {
    id: "cjVigY5qzO86Huf0OWal", // Eric — LOCKED Calm, Cool, Smooth Creator Voice
    label: "Zaldy (Eric · Locked Calm & Cool Voice)",
    stability: 0.72,
    similarityBoost: 0.88,
    style: 0.06,
    seed: 2026,
    useContextLock: true,
    cacheVer: "v2_zaldy_eric_calm_cool",
    tempo: 1.05,
  },
  hermes: {
    id: "nPczCjzI2devNBz1zQrb", // Brian — Locked Studio Voice
    label: "Hermes (Brian · Locked Studio Voice)",
    stability: 0.72,
    similarityBoost: 0.90,
    seed: 4242,
    useContextLock: true,
    cacheVer: "v1_zaldy_trio_room",
    tempo: 1.10,
  },
  openclaw: {
    id: "TX3LPaxmHKxFdv7VOQHJ", // Liam — Expressive Comedy Mascot
    label: "OpenClaw (Liam · Expressive Mascot)",
    stability: 0.38,
    similarityBoost: 0.78,
    seed: null,
    useContextLock: false,
    cacheVer: "v1_zaldy_trio_room",
    tempo: 1.14,
  },
};

const LINES = [
  // SCENE 1 — 02:14 WIB MALAM (Reverse Shot ke Kasur Zaldy!)
  {
    scene: 1,
    who: "openclaw",
    pauseBeforeS: 0.12,
    pauseAfterS: 0.16,
    text: "[excited] [[s1_open]]Tunggu, Mes! Selama ini kamar belakang kita seluas ini?! Dan itu Bos Zaldy beneran ada wujud 3D-nya?!",
  },
  {
    scene: 1,
    who: "zaldy",
    pauseBeforeS: 0.08,
    pauseAfterS: 0.16,
    text: "[[s1_zaldy_greet]]Iyalah, Claw. Masa gue cuma jadi gelembung chat Telegram jam dua pagi terus?",
  },
  {
    scene: 1,
    who: "hermes",
    pauseBeforeS: 0.08,
    pauseAfterS: 0.36,
    text: "[[s1_hm_calm]]Akhirnya markas kita punya ruangan utuh tiga ratus enam puluh derajat.",
  },

  // SCENE 2 — 06:30 WIB PAGI EMAS (Tur Rak Buku, Piala, Sertifikat, Sajadah & Peci)
  {
    scene: 2,
    who: "zaldy",
    pauseBeforeS: 0.18,
    pauseAfterS: 0.14,
    text: "[[s2_sunrise_tour]]Sekalian gue rapihin semuanya biar nyaman buat lembur bareng kalian.",
  },
  {
    scene: 2,
    who: "openclaw",
    pauseBeforeS: 0.06,
    pauseAfterS: 0.16,
    text: "[excited] [[s2_oc_praise]]Widih! Rak buku, piala, sertifikat organisasi, sampai sajadah sama peci rapi banget! Fix ini kamar Zaldy asli!",
  },
  {
    scene: 2,
    who: "hermes",
    pauseBeforeS: 0.08,
    pauseAfterS: 0.34,
    text: "[[s2_zaldy_vibe]]Hangat, rapi, dan cahaya paginya masuk langsung dari Gunung Guntur.",
  },

  // SCENE 3 — 11:30 WIB SIANG (OTS & Low-Angle Toy-Story Inspection!)
  {
    scene: 3,
    who: "zaldy",
    pauseBeforeS: 0.14,
    pauseAfterS: 0.16,
    text: "[[s3_desk_inspect]]Nah, kalau gue duduk sedeket ini, kelihatan jelas siapa yang kerja sama siapa yang cuma bikin folder.",
  },
  {
    scene: 3,
    who: "openclaw",
    pauseBeforeS: 0.06,
    pauseAfterS: 0.16,
    text: "[nervous] [[s3_oc_sweat]]Waduh, Mes! Diawasi langsung dari jarak tiga puluh senti! Nggak bisa alasan empat puluh tujuh folder kosong lagi gue!",
  },
  {
    scene: 3,
    who: "zaldy",
    pauseBeforeS: 0.08,
    pauseAfterS: 0.34,
    text: "[[s3_zaldy_catch]]Tenang, kali ini kita kerjain bareng. Gue pegang konsep utama langsung dari meja.",
  },

  // SCENE 4 — 13:00 -> 17:40 WIB (Solar Timelapse Trio Flow-State!)
  {
    scene: 4,
    who: "hermes",
    pauseBeforeS: 0.16,
    pauseAfterS: 0.14,
    text: "[[s4_trio_work]]Zaldy ketik arahannya, gue kunci kamera sinematiknya, OpenClaw jaga ritme suaranya.",
  },
  {
    scene: 4,
    who: "openclaw",
    pauseBeforeS: 0.06,
    pauseAfterS: 0.32,
    text: "[excited] [[s4_qa_pass]]Seratus persen mulus tanpa bug! Enak banget kerja bertiga!",
  },

  // SCENE 5 — 17:55 WIB SENJA EMAS (Wide Hero Finale!)
  {
    scene: 5,
    who: "zaldy",
    pauseBeforeS: 0.14,
    pauseAfterS: 0.12,
    text: "[[s5_hero_point]]Kamar baru udah siap, formasi lengkap. Habis ini, kita gas episode baru!",
  },
  {
    scene: 5,
    who: "openclaw",
    pauseBeforeS: 0.04,
    pauseAfterS: 0.18,
    text: "[excited] [[s5_oc_outro]]Gas Bos! Asal stok kopi aman!",
  },
];

const BESPOKE_SFX = [
  {
    name: "sfx_bed_cloth_phone.mp3",
    durationSeconds: 1.6,
    promptInfluence: 0.65,
    prompt: "Soft cozy bed duvet rustle with a subtle warm smartphone tap chime in a quiet bedroom, clean foley",
  },
  {
    name: "sfx_sunrise_shimmer_sweep.mp3",
    durationSeconds: 2.2,
    promptInfluence: 0.65,
    prompt: "Warm golden morning acoustic shimmer whoosh with gentle wooden wind chime, cinematic time transition, no music",
  },
  {
    name: "sfx_chair_roll_sit.mp3",
    durationSeconds: 1.5,
    promptInfluence: 0.68,
    prompt: "Ergonomic studio swivel chair rolling smoothly on wooden parquet floor and settling softly, crisp indoor foley",
  },
  {
    name: "sfx_keyboard_trio_flow.mp3",
    durationSeconds: 2.2,
    promptInfluence: 0.65,
    prompt: "Fast satisfying mechanical laptop typing clicks blended with a subtle futuristic hologram hum, clean studio foley",
  },
  {
    name: "sfx_qa_verified_chime.mp3",
    durationSeconds: 1.8,
    promptInfluence: 0.65,
    prompt: "Crisp rewarding dual-tone UI verification chime with warm sparkle, clean modern tech sound",
  },
  {
    name: "sfx_trio_outro_sting.mp3",
    durationSeconds: 2.4,
    promptInfluence: 0.65,
    prompt: "Upbeat warm acoustic guitar and snappy percussion sitcom button sting, cheerful triumphant ending",
  },
];

const SPOKEN_SHIELD_MAP = {
  "3D-nya?!": "tiga D nya?!",
  "3D": "tiga D",
  "AI": "A I",
  "Claw.": "Klo.",
  "Claw,": "Klo,",
  "Zaldy": "Zaldi",
  "Zaldy!": "Zaldi!",
  "OpenClaw": "Open Klo",
  "cuma": "chuma",
  "cahaya": "chahaya",
  "peci": "pechi",
  "chat": "chet",
  "kunci": "kunchi",
  "bug!": "bag!",
};

function prepareLine(rawText, lineIdx) {
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

      const spoken = SPOKEN_SHIELD_MAP[disp] ?? disp;
      const spokenCount = spoken.trim().split(/\s+/).length;
      displayTokens.push({ w: disp, cue, line: lineIdx, spokenCount });
      ttsChunks.push(spoken);
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
  const totalExpected = displayTokens.reduce((s, d) => s + (d.spokenCount ?? 1), 0);
  if (totalExpected === spokenRuns.length) {
    const out = [];
    let rIdx = 0;
    for (const dt of displayTokens) {
      const cnt = dt.spokenCount ?? 1;
      const startRun = spokenRuns[rIdx];
      const endRun = spokenRuns[Math.min(spokenRuns.length - 1, rIdx + cnt - 1)];
      out.push({ ...dt, start: startRun.start, end: endRun.end });
      rIdx += cnt;
    }
    return out;
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
    const minTake = dt.spokenCount ?? 1;
    rIdx++;
    for (let k = 1; k < minTake && rIdx < spokenRuns.length; k++) {
      acc += normWord(spokenRuns[rIdx].text);
      endRun = spokenRuns[rIdx];
      rIdx++;
    }
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

function renderVoiceWav(mp3Path, wavPath, who) {
  const eq =
    who === "openclaw"
      ? "highpass=f=95,equalizer=f=240:t=q:w=1.2:g=0.8,equalizer=f=3600:t=q:w=1.3:g=2.2,equalizer=f=6800:t=q:w=1.4:g=-1.2,loudnorm=I=-17:TP=-2.0:LRA=6:linear=true"
      : who === "zaldy"
      ? "highpass=f=82,equalizer=f=185:t=q:w=1.1:g=1.6,equalizer=f=3100:t=q:w=1.3:g=1.8,equalizer=f=6600:t=q:w=1.4:g=-1.0,loudnorm=I=-17:TP=-2.0:LRA=6:linear=true"
      : "highpass=f=75,equalizer=f=155:t=q:w=1.1:g=2.0,equalizer=f=2900:t=q:w=1.3:g=1.5,equalizer=f=6400:t=q:w=1.4:g=-1.2,loudnorm=I=-17:TP=-2.0:LRA=6:linear=true";
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
      const endsPunct = /[,.\?!"]$/.test(w.w);
      const remaining = lineWords.length - 1 - i;
      const shouldBreak =
        (endsPunct && cur.length >= 2 && remaining >= 1) ||
        (cur.length >= 4 && remaining >= 2) ||
        (textLen >= 25 && cur.length >= 3 && remaining >= 1);
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
      who: chunk[0].who,
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
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error("ELEVENLABS_API_KEY missing in .env!");
    process.exit(1);
  }

  const client = new ElevenLabsClient({ apiKey });
  const audioDir = join(PROJECT, "audio");
  const voCacheDir = join(audioDir, "vo_cache");
  const sfxDir = join(audioDir, "sfx");
  const outVoWav = join(audioDir, "vo_master.wav");
  const outAlignJson = join(audioDir, "alignment.json");
  const outStoryTs = join(ROOT, "remotion/videos/zaldy-room-showcase/story.ts");
  const tmpBase = join(PROJECT, ".tmp");

  mkdirSync(voCacheDir, { recursive: true });
  mkdirSync(sfxDir, { recursive: true });
  mkdirSync(dirname(outStoryTs), { recursive: true });
  mkdirSync(tmpBase, { recursive: true });

  const prepared = LINES.map((ln, idx) => ({ ...ln, idx, ...prepareLine(ln.text, idx) }));
  const tmpDir = mkdtempSync(join(tmpBase, "vo-room-"));

  try {
    console.log(`=== [1/2] Synthesizing Trio-Voice ElevenLabs ${TTS_MODEL} Dialogue (${prepared.length} Lines) ===`);
    const concatParts = [];
    const makeSilence = (name, durSec) => {
      const p = join(tmpDir, name);
      execFileSync("ffmpeg", [
        "-y", "-loglevel", "error", "-f", "lavfi", "-i", `anullsrc=r=${SR}:cl=mono`,
        "-t", String(durSec), "-sample_fmt", "s16", p,
      ]);
      return p;
    };

    concatParts.push(makeSilence("sil_lead.wav", OPEN_LEAD_SILENCE_S));
    let cursorSec = OPEN_LEAD_SILENCE_S;
    const allWords = [];
    const lineSpans = [];
    const sceneStartsSec = {};

    for (let i = 0; i < prepared.length; i++) {
      const line = prepared[i];
      const vcfg = VOICES[line.who];

      if (sceneStartsSec[`s${line.scene}`] === undefined) {
        sceneStartsSec[`s${line.scene}`] = cursorSec;
      }

      if (line.pauseBeforeS > 0.005) {
        concatParts.push(makeSilence(`sil_pre_${i}.wav`, line.pauseBeforeS));
        cursorSec += line.pauseBeforeS;
      }

      const prevSame = vcfg.useContextLock
        ? prepared.slice(0, i).filter((x) => x.who === line.who).slice(-2).map((x) => x.ttsText).join(" ")
        : "";
      const nextSame = vcfg.useContextLock
        ? prepared.slice(i + 1).filter((x) => x.who === line.who).slice(0, 1).map((x) => x.ttsText).join(" ")
        : "";

      const cachePayload = {
        v: vcfg.cacheVer,
        id: vcfg.id,
        model: TTS_MODEL,
        stab: vcfg.stability,
        sim: vcfg.similarityBoost,
        seed: vcfg.seed,
        prev: prevSame,
        next: nextSame,
        text: line.ttsText,
      };

      const cacheKey = createHash("sha1").update(JSON.stringify(cachePayload)).digest("hex").slice(0, 12);
      const mp3Path = join(voCacheDir, `line_${String(i).padStart(2, "0")}_${line.who}_${cacheKey}.mp3`);
      const alignPath = join(voCacheDir, `line_${String(i).padStart(2, "0")}_${line.who}_${cacheKey}.json`);

      let alignment;
      if (existsSync(mp3Path) && existsSync(alignPath)) {
        console.log(`  [${i + 1}/${prepared.length}] CACHED S${line.scene} ${line.who.toUpperCase()}: ${line.ttsPlainNoTags}`);
        alignment = JSON.parse(readFileSync(alignPath, "utf8"));
      } else {
        console.log(`  [${i + 1}/${prepared.length}] SYNTH  S${line.scene} ${line.who.toUpperCase()}: ${line.ttsText}`);
        const reqBody = {
          text: line.ttsText,
          modelId: TTS_MODEL,
          languageCode: "id",
          outputFormat: "mp3_44100_128",
          applyTextNormalization: "on",
          voiceSettings: {
            stability: vcfg.stability,
            similarityBoost: vcfg.similarityBoost,
          },
        };
        if (vcfg.seed !== null && vcfg.seed !== undefined) reqBody.seed = vcfg.seed;
        if (prevSame) reqBody.previousText = prevSame;
        if (nextSame) reqBody.nextText = nextSame;

        const res = await client.textToSpeech.convertWithTimestamps(vcfg.id, reqBody);
        writeFileSync(mp3Path, Buffer.from(res.audioBase64, "base64"));
        alignment = res.alignment;
        writeFileSync(alignPath, JSON.stringify(alignment, null, 2));
      }

      const rawWav = join(tmpDir, `line_${i}.wav`);
      renderVoiceWav(mp3Path, rawWav, line.who);

      const spokenRuns = extractSpokenRuns(alignment);
      const aligned = alignDisplayToRuns(line.displayTokens, spokenRuns);
      const clipDur = getDurationSec(rawWav);

      const trimLead = spokenRuns.length ? Math.max(0, Number((spokenRuns[0].start - 0.14).toFixed(3))) : 0;
      const lastEnd = spokenRuns.length ? spokenRuns[spokenRuns.length - 1].end : clipDur;
      const srcSpan = Math.max(0.16, Math.min(clipDur - trimLead, Number((lastEnd - trimLead + 0.24).toFixed(3))));
      const trimWav = join(tmpDir, `line_${i}_trim.wav`);
      const tempo = vcfg.tempo;
      execFileSync("ffmpeg", [
        "-y", "-loglevel", "error", "-ss", String(trimLead), "-i", rawWav, "-t", String(srcSpan),
        "-af", `atempo=${tempo},afade=t=in:st=0:d=0.008`, "-sample_fmt", "s16", trimWav,
      ]);
      const actualDur = getDurationSec(trimWav);
      const fadeWav = join(tmpDir, `line_${i}_fade.wav`);
      execFileSync("ffmpeg", [
        "-y", "-loglevel", "error", "-i", trimWav,
        "-af", `afade=t=out:st=${Math.max(0, actualDur - 0.015).toFixed(3)}:d=0.015`, "-sample_fmt", "s16", fadeWav,
      ]);

      const lineStartSec = cursorSec;
      for (const tok of aligned) {
        const sRel = Math.max(0, (tok.start - trimLead) / tempo);
        const eRel = Math.max(sRel + 0.02, (tok.end - trimLead) / tempo);
        allWords.push({
          w: tok.w,
          cue: tok.cue,
          scene: line.scene,
          who: line.who,
          line: tok.line,
          start: Number((cursorSec + sRel).toFixed(3)),
          end: Number((cursorSec + eRel).toFixed(3)),
        });
      }

      concatParts.push(fadeWav);
      cursorSec += actualDur;

      lineSpans.push({
        idx: i,
        scene: line.scene,
        who: line.who,
        startFrame: Math.round(lineStartSec * FPS),
        endFrame: Math.round(cursorSec * FPS),
      });

      if (line.pauseAfterS > 0.005) {
        concatParts.push(makeSilence(`sil_post_${i}.wav`, line.pauseAfterS));
        cursorSec += line.pauseAfterS;
      }
    }

    const concatList = join(tmpDir, "concat.txt");
    writeFileSync(concatList, concatParts.map((p) => `file '${p.replace(/\\/g, "/")}'`).join("\n"), "utf8");
    execFileSync("ffmpeg", [
      "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", concatList,
      "-af", "loudnorm=I=-16:TP=-2.0:LRA=6:linear=true", "-ar", String(SR), "-ac", "1", "-sample_fmt", "s16", outVoWav,
    ]);

    const voDur = getDurationSec(outVoWav);
    const totalVideoSec = Number((voDur + END_HOLD_S).toFixed(3));
    const totalFrames = Math.ceil(totalVideoSec * FPS);

    const cueMapSec = {};
    const cueMapFrame = {};
    for (const w of allWords) {
      if (w.cue) {
        cueMapSec[w.cue] = w.start;
        cueMapFrame[w.cue] = Math.round(w.start * FPS);
      }
    }

    const scenesFrame = {
      s1: 0,
      s2: Math.round(sceneStartsSec.s2 * FPS),
      s3: Math.round(sceneStartsSec.s3 * FPS),
      s4: Math.round(sceneStartsSec.s4 * FPS),
      s5: Math.round(sceneStartsSec.s5 * FPS),
      totalFrames,
    };

    const subtitleChunks = buildSubtitleChunks(allWords);
    const wordTimings = allWords.map((w) => ({
      word: w.w,
      cue: w.cue,
      line: w.line,
      who: w.who,
      scene: w.scene,
      startSec: w.start,
      endSec: w.end,
      startFrame: Math.round(w.start * FPS),
      endFrame: Math.round(w.end * FPS),
    }));

    writeFileSync(
      outAlignJson,
      JSON.stringify(
        {
          projectSlug: "zaldy-room-showcase",
          voices: VOICES,
          model: TTS_MODEL,
          voDurationSec: Number(voDur.toFixed(3)),
          totalVideoSec,
          fps: FPS,
          totalFrames,
          scenesSec: sceneStartsSec,
          scenesFrame,
          cuesSec: cueMapSec,
          cuesFrame: cueMapFrame,
          lineSpans,
          wordTimings,
        },
        null,
        2
      ) + "\n",
      "utf8"
    );

    const storyTs = `// AUTO-GENERATED by zaldy-room-showcase/scripts/build_vo_and_sfx.mjs
// Source: Trio-Voice ElevenLabs ${TTS_MODEL} (Zaldy=Will, Hermes=Brian, OpenClaw=Liam · ${allWords.length} words)

export type SpeakerId = "zaldy" | "hermes" | "openclaw";

export interface WordTiming {
  word: string;
  cue: string | null;
  line: number;
  who: SpeakerId;
  scene: number;
  startSec: number;
  endSec: number;
  startFrame: number;
  endFrame: number;
}

export interface SubtitleWord {
  text: string;
  startFrame: number;
  endFrame: number;
}

export interface SubtitleChunk {
  id: string;
  scene: number;
  who: SpeakerId;
  startFrame: number;
  endFrame: number;
  words: SubtitleWord[];
}

export interface SpeechSpan {
  idx: number;
  scene: number;
  who: SpeakerId;
  startFrame: number;
  endFrame: number;
}

export const FPS = ${FPS};
export const TOTAL_FRAMES = ${totalFrames};
export const TOTAL_SECONDS = ${totalVideoSec};

export const COMPOSITION_CONFIG = {
  id: "ZaldyRoomShowcase",
  width: 1080,
  height: 1920,
  fps: ${FPS},
  durationInFrames: ${totalFrames},
  durationSec: ${totalVideoSec},
  audioMasterPath: "zaldy-room-showcase/audio_master.m4a",
} as const;

export const SCENE_STARTS = ${JSON.stringify(scenesFrame, null, 2)} as const;
export const CUES = ${JSON.stringify(cueMapFrame, null, 2)} as const;
export const SPEECH_SPANS: SpeechSpan[] = ${JSON.stringify(lineSpans, null, 2)};
export const SUBTITLE_CHUNKS: SubtitleChunk[] = ${JSON.stringify(subtitleChunks, null, 2)};
export const WORDS: WordTiming[] = ${JSON.stringify(wordTimings, null, 2)};
`;
    writeFileSync(outStoryTs, storyTs, "utf8");
    console.log(`\nVO COMPLETE -> ${outVoWav} (${voDur.toFixed(2)}s VO | ${totalVideoSec.toFixed(2)}s video / ${totalFrames} frames)`);

    console.log("\n=== [2/2] Generating 6 Bespoke Room SFX via eleven_text_to_sound_v3 ===");
    for (let i = 0; i < BESPOKE_SFX.length; i++) {
      const sfx = BESPOKE_SFX[i];
      const outPath = join(sfxDir, sfx.name);
      if (existsSync(outPath) && getDurationSec(outPath) > 0.3) {
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
      console.log(`           -> saved (${getDurationSec(outPath).toFixed(2)}s)`);
    }

    console.log("\n=== ALL ZALDY ROOM SHOWCASE TRIO VO & SFX COMPLETE ===");
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error("FATAL ERROR in build_vo_and_sfx:", err);
  process.exit(1);
});
