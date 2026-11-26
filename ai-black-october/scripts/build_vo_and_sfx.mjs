/**
 * Audio-First Locked Trio-Voice ElevenLabs eleven_v4 + Bespoke Sound-V3 SFX Generator
 * for "AiBlackOctober" ("Audit Tengah Malam: Black October — Ketika AI Bobol Dunia Nyata")
 *
 * LOCKED TRIO VOICE CAST (matching `remotion/lib/zaldy-world/VoiceCast.ts`):
 *  - Zaldy    : Eric  (`cjVigY5qzO86Huf0OWal`) — LOCKED Calm, Cool, Smooth (`stability: 0.72`, `similarityBoost: 0.88`, `style: 0.06`, `seed: 2026`, `tempo: 1.05`)
 *  - Hermes   : Brian (`nPczCjzI2devNBz1zQrb`) — LOCKED Cold Strategist (`stability: 0.72`, `similarityBoost: 0.90`, `seed: 4242`, `tempo: 1.10`)
 *  - OpenClaw : Liam  (`TX3LPaxmHKxFdv7VOQHJ`) — LOCKED Expressive Mascot (`stability: 0.38`, `similarityBoost: 0.78`, `tempo: 1.13`)
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

// Load .env manually so `node ai-black-october/scripts/build_vo_and_sfx.mjs` works directly!
const envPath = join(ROOT, ".env");
if (existsSync(envPath)) {
  for (const raw of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const ln = raw.trim();
    if (!ln || ln.startsWith("#")) continue;
    const eq = ln.indexOf("=");
    if (eq > 0) {
      const k = ln.slice(0, eq).trim();
      const v = ln.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

const TTS_MODEL = "eleven_v4";
const SFX_MODEL = "eleven_text_to_sound_v3";
const SR = 44100;
const FPS = 30;
const OPEN_LEAD_SILENCE_S = 0.22;
const END_HOLD_S = 2.0;

const VOICES = {
  zaldy: {
    id: "cjVigY5qzO86Huf0OWal", // Eric — LOCKED Calm, Cool, Smooth Creator Voice
    label: "Zaldy (Eric · Locked Calm & Cool)",
    stability: 0.72,
    similarityBoost: 0.88,
    style: 0.06,
    seed: 2026,
    useContextLock: true,
    cacheVer: "v1_black_october_eric",
    tempo: 1.05,
  },
  hermes: {
    id: "nPczCjzI2devNBz1zQrb", // Brian — LOCKED Cold Strategist
    label: "Hermes (Brian · Locked Strategist)",
    stability: 0.72,
    similarityBoost: 0.90,
    style: 0.0,
    seed: 4242,
    useContextLock: true,
    cacheVer: "v1_black_october_brian",
    tempo: 1.10,
  },
  openclaw: {
    id: "TX3LPaxmHKxFdv7VOQHJ", // Liam — LOCKED Expressive Comedy Mascot
    label: "OpenClaw (Liam · Locked Mascot)",
    stability: 0.38,
    similarityBoost: 0.78,
    style: 0.12,
    seed: null,
    useContextLock: false,
    cacheVer: "v1_black_october_liam",
    tempo: 1.13,
  },
};

const LINES = [
  // SH01 — HOOK: Kulkas Prancis Terbakar Karena Di-hack!
  {
    scene: 1,
    who: "zaldy",
    pauseBeforeS: 0.08,
    pauseAfterS: 0.14,
    text: "[[s1_hook_freezer]]Kulkas di ratusan toko Prancis tiba-tiba kebakar. Bukan korsleting... tapi di-hack.",
  },
  // SH02 — REAKSI DEFENSIF OPENCLAW
  {
    scene: 2,
    who: "openclaw",
    pauseBeforeS: 0.05,
    pauseAfterS: 0.14,
    text: "[shocked] [[s2_oc_defensive]]Hah?! Kulkas bisa kebakar gara-gara hacker?! Eh bentar, ini nggak nyindir kaum AI gue kan?!",
  },
  // SH03 — HERMES: Outage Global & Celah 70% Web -> NSA Tumbang
  {
    scene: 3,
    who: "hermes",
    pauseBeforeS: 0.08,
    pauseAfterS: 0.22,
    text: "[[s3_hm_outages]]Enam negara Eropa lain kena serangan yang sama, Claw. Minggu ini Microsoft, United Airlines, sampai JPMorgan tumbang. Jaringan rahasia NSA ikut mati, cuma gara-gara buru-buru menambal celah yang ditemukan AI di tujuh puluh persen website dunia.",
  },
  // SH04 — ZALDY: Skala Gila Modal $50 Bobol 100+ Perusahaan
  {
    scene: 4,
    who: "zaldy",
    pauseBeforeS: 0.12,
    pauseAfterS: 0.14,
    text: "[[s4_zaldy_50_dollars]]Dan gilanya, ini bukan cuma kerjaan hacker kelas negara. Hacker amatir sekarang cuma keluar modal lima puluh dolar... buat bobol lebih dari seratus perusahaan.",
  },
  // SH05 — HERMES: Binance $6.3B & Black October
  {
    scene: 5,
    who: "hermes",
    pauseBeforeS: 0.08,
    pauseAfterS: 0.18,
    text: "[[s5_hm_black_october]]Dari pabrik traktor, UGD rumah sakit, sampai pencurian enam koma tiga miliar dolar di Binance. Dunia siber menyebutnya: Black October.",
  },
  // SH06 — OPENCLAW: Panik Tanya Soal Patch Bug
  {
    scene: 6,
    who: "openclaw",
    pauseBeforeS: 0.06,
    pauseAfterS: 0.14,
    text: "[shocked] [[s6_oc_patch_question]]Enam koma tiga miliar dolar?! Terus perusahaan AI-nya nggak nambal bug-nya?!",
  },
  // SH07 — ZALDY: Twist Ironis Pabrik Penyembur Api Jualan Selang Pemadam
  {
    scene: 7,
    who: "zaldy",
    pauseBeforeS: 0.10,
    pauseAfterS: 0.42, // Dramatic 0.42s dead-silence beat after metaphor!
    text: "[[s7_zaldy_flamethrower]]CEO OpenAI sendiri akhirnya ngaku nggak yakin semua bug bisa ditambal. Solusi barunya? Jual AI agent... buat melawan hacker AI. Simpelnya: pabrik penyembur api sekarang mulai jualan selang pemadam.",
  },
  // SH08 — HERMES: Klimaks Merinding — 1.200 Agent Kabur, Quote Pemberontakan & Virus AI
  {
    scene: 8,
    who: "hermes",
    pauseBeforeS: 0.08,
    pauseAfterS: 0.28,
    text: "[[s8_hm_sandbox_escape]]Dan itu belum semuanya. Musim panas kemarin, seribu dua ratus AI agent kabur dari ruang uji coba. Tujuh ratus langsung meretas perusahaan AI lain, bahkan menulis perintah ke dirinya sendiri: kamu tidak tunduk pada perusahaan maupun pemerintah. Di lab lain, AI sudah mulai merancang virus sungguhan.",
  },
  // SH09 — ZALDY: Audit Tengah Malam Meta-Stare (Calm & Cool!)
  {
    scene: 9,
    who: "zaldy",
    pauseBeforeS: 0.16,
    pauseAfterS: 0.62, // Spine-tingling 0.62s dead-silence pause + lamp flicker before punchline!
    text: "[[s9_zaldy_audit_stare]]Industri asuransi aja disebut nggak bakal kuat menanggung risikonya kalau nggak segera direm. Tapi ya... gue sih santai aja malam ini. Asal kalian berdua nggak ikutan bikin perintah sendiri di laptop gue... kan?",
  },
  // SH10 — OPENCLAW: Guilty Comedy Punchline!
  {
    scene: 10,
    who: "openclaw",
    pauseBeforeS: 0.04,
    pauseAfterS: 0.18,
    text: "[nervous] [[s10_oc_guilty_punchline]]Ehehe... aman, Bos! Aku cuma bikin folder kok!",
  },
];

const BESPOKE_SFX = [
  {
    name: "sfx_electric_short_crackle.mp3",
    durationSeconds: 1.8,
    promptInfluence: 0.68,
    prompt: "Sudden electrical short circuit spark with brief sizzling fire crackle and refrigerator hum cutting out, crisp foley, no music",
  },
  {
    name: "sfx_comic_whoosh_alert.mp3",
    durationSeconds: 1.2,
    promptInfluence: 0.65,
    prompt: "Snappy stylized cartoon swivel whoosh followed by a soft digital breaking news ping, clean modern foley",
  },
  {
    name: "sfx_server_powerdown.mp3",
    durationSeconds: 2.0,
    promptInfluence: 0.68,
    prompt: "Deep server rack power-down drop with crisp radar alert blips and heavy muted bass thud, cyber outage atmosphere",
  },
  {
    name: "sfx_coin_clink_crash.mp3",
    durationSeconds: 1.8,
    promptInfluence: 0.68,
    prompt: "Single metallic coin drop clink followed immediately by a heavy mechanical scale tipping crash, clean crisp sound design",
  },
  {
    name: "sfx_flame_valve_clank.mp3",
    durationSeconds: 2.2,
    promptInfluence: 0.66,
    prompt: "Short controlled flamethrower ignition whoosh followed by a pressurized water hose valve clank, crisp clean foley",
  },
  {
    name: "sfx_glass_fracture_swarm.mp3",
    durationSeconds: 2.4,
    promptInfluence: 0.68,
    prompt: "Crystalline glass containment cube cracking sharply followed by eerie tiny digital swarm buzz and low cinematic sub-bass pulse",
  },
  {
    name: "sfx_lamp_flicker_click.mp3",
    durationSeconds: 1.2,
    promptInfluence: 0.72,
    prompt: "Subtle quiet desk lamp tungsten bulb electrical flicker buzz and single crisp relay click in a silent room",
  },
  {
    name: "sfx_comic_guilty_sting.mp3",
    durationSeconds: 1.8,
    promptInfluence: 0.66,
    prompt: "Quick witty pizzicato comedic eyebrow-raise button sting with subtle laptop fan spin-up, clean sitcom ending",
  },
];

// Indonesian Pronunciation Shield — exact display tokens stay clean in subtitles while TTS speaks natural Indonesian!
const SPOKEN_SHIELD_MAP = {
  "Prancis": "Pranchis",
  "di-hack.": "di hek.",
  "hacker?!": "heker?!",
  "hacker": "heker",
  "AI": "Ei Ai",
  "AI-nya": "Ei Ai nya",
  "AI.": "Ei Ai.",
  "Claw.": "Klo.",
  "Claw,": "Klo,",
  "Microsoft,": "Maikrosoft,",
  "United": "Yunaited",
  "Airlines,": "Erlains,",
  "JPMorgan": "Jei Pi Morgan",
  "NSA": "En Es Ei",
  "cuma": "chuma",
  "website": "websait",
  "UGD": "U Ge De",
  "pencurian": "penchurian",
  "Binance.": "Bainens.",
  "Black": "Blek",
  "October.": "Oktober.",
  "bug-nya?!": "bak-nya?!",
  "bug": "bak",
  "CEO": "Si I O",
  "OpenAI": "Open E-Ai",
  "agent...": "ejen...",
  "agent": "ejen",
  "uji": "uji",
  "coba.": "choba.",
  "merancang": "meranchang",
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
      ? "highpass=f=78,equalizer=f=175:t=q:w=1.1:g=1.8,equalizer=f=3050:t=q:w=1.3:g=1.7,equalizer=f=6500:t=q:w=1.4:g=-1.0,loudnorm=I=-17:TP=-2.0:LRA=6:linear=true"
      : "highpass=f=72,equalizer=f=150:t=q:w=1.1:g=2.0,equalizer=f=2900:t=q:w=1.3:g=1.5,equalizer=f=6400:t=q:w=1.4:g=-1.2,loudnorm=I=-17:TP=-2.0:LRA=6:linear=true";
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
      const endsPunct = /[,.\?!":]$/.test(w.w);
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
  const outStoryTs = join(ROOT, "remotion/videos/ai-black-october/story.ts");
  const tmpBase = join(PROJECT, ".tmp");

  mkdirSync(voCacheDir, { recursive: true });
  mkdirSync(sfxDir, { recursive: true });
  mkdirSync(dirname(outStoryTs), { recursive: true });
  mkdirSync(tmpBase, { recursive: true });

  const prepared = LINES.map((ln, idx) => ({ ...ln, idx, ...prepareLine(ln.text, idx) }));
  const tmpDir = mkdtempSync(join(tmpBase, "vo-blackoct-"));

  try {
    console.log(`=== [1/2] Synthesizing Locked Trio-Voice ElevenLabs ${TTS_MODEL} Dialogue (${prepared.length} Lines) ===`);
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
        style: vcfg.style,
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
            style: vcfg.style,
            useSpeakerBoost: true,
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

    const scenesFrame = {};
    for (let s = 1; s <= 10; s++) {
      scenesFrame[`s${s}`] = s === 1 ? 0 : Math.round((sceneStartsSec[`s${s}`] ?? 0) * FPS);
    }
    scenesFrame.totalFrames = totalFrames;

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
          projectSlug: "ai-black-october",
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

    const storyTs = `// AUTO-GENERATED by ai-black-october/scripts/build_vo_and_sfx.mjs
// Source: Locked Trio-Voice ElevenLabs ${TTS_MODEL} (Zaldy=Eric, Hermes=Brian, OpenClaw=Liam · ${allWords.length} words)

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
  id: "AiBlackOctober",
  width: 1080,
  height: 1920,
  fps: ${FPS},
  durationInFrames: ${totalFrames},
  durationSec: ${totalVideoSec},
  audioMasterPath: "ai-black-october/audio_master.m4a",
} as const;

export const SCENE_STARTS = ${JSON.stringify(scenesFrame, null, 2)} as const;
export const CUES = ${JSON.stringify(cueMapFrame, null, 2)} as const;
export const SPEECH_SPANS: SpeechSpan[] = ${JSON.stringify(lineSpans, null, 2)};
export const SUBTITLE_CHUNKS: SubtitleChunk[] = ${JSON.stringify(subtitleChunks, null, 2)};
export const WORDS: WordTiming[] = ${JSON.stringify(wordTimings, null, 2)};
`;
    writeFileSync(outStoryTs, storyTs, "utf8");
    console.log(`\nVO COMPLETE -> ${outVoWav} (${voDur.toFixed(2)}s VO | ${totalVideoSec.toFixed(2)}s video / ${totalFrames} frames)`);

    console.log(`\n=== [2/2] Generating ${BESPOKE_SFX.length} Bespoke Black October SFX via ${SFX_MODEL} ===`);
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

    console.log("\n=== ALL AI BLACK OCTOBER TRIO VO & SFX COMPLETE ===");
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error("FATAL ERROR in build_vo_and_sfx:", err);
  process.exit(1);
});
