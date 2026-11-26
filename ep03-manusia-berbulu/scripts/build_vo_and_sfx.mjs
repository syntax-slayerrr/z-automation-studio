/**
 * Audio-First Baritone Documentary VO (ElevenLabs eleven_v4) + 12 Bespoke African Savanna,
 * Rainforest & Skin-Biology SFX (eleven_text_to_sound_v3) for `/series-evolusi` Episode 3:
 * "KENAPA MANUSIA TIDAK BERBULU SEPERTI SIMPANSE, BONOBO & GORILA?" (`ep03-manusia-berbulu`)
 *
 * Exports:
 *  - ep03-manusia-berbulu/audio/vo_master.wav
 *  - ep03-manusia-berbulu/audio/alignment.json
 *  - ep03-manusia-berbulu/audio/sfx/*.mp3
 *  - remotion/videos/ep03-manusia-berbulu/story.ts
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
const OPEN_LEAD_SILENCE_S = 0.24;
const END_HOLD_S = 1.85; // Clean peaceful fade & seamless loop back to Frame 0!

const VOICE = {
  id: "nPczCjzI2devNBz1zQrb", // Brian — Warm Authoritative Documentary Baritone
  label: "Narrator (Brian · Warm Documentary Baritone)",
  stability: 0.66,
  similarityBoost: 0.88,
  style: 0.08,
  seed: 3033,
  cacheVer: "v1_evolusi_ep03_berbulu",
  tempo: 1.22,
};

// User-Approved 6-Sequence / 15-Shot Script with Precise Word Cue Tags!
const LINES = [
  // SEQ 1 — Great Ape Paradox (SH001 & SH002)
  {
    scene: 1,
    pauseBeforeS: 0.02,
    pauseAfterS: 0.14,
    text: "[curious] [[c1_simpanse]]Simpanse. [[c1_bonobo]]Bonobo. [[c1_gorila]]Gorila. Semua kerabat terdekat kita masih punya [[c1_bulu_lebat]]bulu lebat dari kepala sampai kaki.",
  },
  {
    scene: 1,
    pauseBeforeS: 0.04,
    pauseAfterS: 0.24,
    text: "Cuma [[c1_manusia]]manusia yang tubuhnya [[c1_polos]]polos. Kenapa mereka masih berbulu, sementara kita tidak?",
  },

  // SEQ 2 — Ancient Forest -> Climate Drying -> Great Split & East Africa Map (SH003, SH004, SH005)
  {
    scene: 2,
    pauseBeforeS: 0.10,
    pauseAfterS: 0.12,
    text: "[warm] [[c2_dulu]]Dulu, jutaan tahun lalu, nenek moyang kita sebenarnya sama persis dengan mereka. Kita sama-sama hidup di [[c2_hutan]]hutan Afrika yang rimbun dan teduh.",
  },
  {
    scene: 2,
    pauseBeforeS: 0.04,
    pauseAfterS: 0.22,
    text: "Di dalam hutan, bulu tebal itu seperti [[c2_jaket]]jaket gratis, melindungi tubuh dari hujan, duri, dan dingin malam.",
  },
  {
    scene: 2,
    pauseBeforeS: 0.08,
    pauseAfterS: 0.14,
    text: "Sampai suatu masa, [[c2_iklim]]iklim berubah. Hutan perlahan mengering, dan berubah jadi [[c2_sabana]]padang rumput yang luas dan terik.",
  },
  {
    scene: 2,
    pauseBeforeS: 0.06,
    pauseAfterS: 0.22,
    text: "Di sinilah [[c2_pisah]]jalan kita berpisah. Simpanse, bonobo, dan gorila tetap bertahan di sisa hutan yang teduh. Sementara nenek moyang manusia [[c2_keluar]]memilih keluar ke padang terbuka untuk mencari makan.",
  },

  // SEQ 3 — Midday Savanna Pursuit & Fur-Jacket Thermal Overheat Crisis (SH006 & SH007)
  {
    scene: 3,
    pauseBeforeS: 0.08,
    pauseAfterS: 0.12,
    text: "Masalahnya, di padang terbuka tidak ada pohon untuk berteduh. Untuk bertahan hidup, manusia purba harus [[c3_berlari]]berjalan jauh, bahkan mengejar buruan di tengah [[c3_siang]]siang bolong.",
  },
  {
    scene: 3,
    pauseBeforeS: 0.06,
    pauseAfterS: 0.22,
    text: "Bayangkan kamu berlari di bawah terik matahari, sambil memakai [[c3_jaket_bulu]]jaket bulu tebal. [[c3_panas]]Panas tubuh terjebak di dalam. Dan [[c3_otak]]otak manusia yang semakin besar bisa rusak kalau kepanasan.",
  },

  // SEQ 4 — Evolution Swap: Fur X-Out + 10x Sweat Diagnostic + Modern Jogger Cooling + Scalp Umbrella (SH008, SH009, SH010)
  {
    scene: 4,
    pauseBeforeS: 0.10,
    pauseAfterS: 0.14,
    text: "Maka selama ratusan ribu tahun, tubuh manusia pelan-pelan berubah. [[c4_dilepas]]Bulu tebal itu dilepas, lalu diganti [[c4_keringat]]jutaan kelenjar keringat, [[c4_10x]]sepuluh kali lebih banyak daripada simpanse.",
  },
  {
    scene: 4,
    pauseBeforeS: 0.06,
    pauseAfterS: 0.14,
    text: "Itulah kenapa saat kamu berlari atau [[c4_olahraga]]berolahraga sekarang, keringat langsung bercucuran deras. Saat menguap terkena angin, keringat itu mengubah seluruh kulitmu jadi [[c4_pendingin]]pendingin alami, biar tubuh dan otakmu tidak [[c4_overheat]]overheat.",
  },
  {
    scene: 4,
    pauseBeforeS: 0.06,
    pauseAfterS: 0.22,
    text: "Sementara [[c4_rambut]]rambut di kepala sengaja disisakan tebal, sebagai [[c4_payung]]payung terakhir agar otak tidak terpanggang matahari.",
  },

  // SEQ 5 — New Problem: Bare Skin Burn -> Natural Dark Melanin Sunscreen -> Shirt & Sunblock X-Out (SH011 & SH012)
  {
    scene: 5,
    pauseBeforeS: 0.08,
    pauseAfterS: 0.14,
    text: "[curious] [[c5_masalah]]Tapi melepas bulu itu langsung memunculkan masalah baru. Tanpa pelindung, [[c5_terbuka]]kulit manusia purba jadi terbuka polos di bawah matahari yang menyengat. Kalau dibiarkan pucat seperti kulit di balik bulu simpanse, mereka bisa rusak terbakar setiap hari.",
  },
  {
    scene: 5,
    pauseBeforeS: 0.06,
    pauseAfterS: 0.24,
    text: "Jadi di masa yang sama, kulit manusia purba perlahan berubah [[c5_gelap]]gelap alami, sebagai [[c5_sunscreen]]sunscreen bawaan, jauh sebelum manusia mengenal [[c5_baju]]baju, apalagi [[c5_sunblock]]sunblock.",
  },

  // SEQ 6 — 3D DNA Gene Switch OFF -> Macro Goosebumps -> Forest vs Savanna Finale (SH013, SH014, SH015)
  {
    scene: 6,
    pauseBeforeS: 0.12,
    pauseAfterS: 0.16,
    text: "[thoughtful] Dan ternyata, tubuh kita belum benar-benar lupa dengan masa lalu itu. Di dalam [[c6_dna]]DNA manusia, perintah untuk menumbuhkan bulu lebat seperti simpanse sebenarnya masih tersimpan utuh, hanya [[c6_sakelar]]sakelarnya saja yang dimatikan.",
  },
  {
    scene: 6,
    pauseBeforeS: 0.06,
    pauseAfterS: 0.22,
    text: "Makanya sampai hari ini pun, saat [[c6_angin]]angin dingin menyentuh kulitmu, [[c6_berdiri]]bulu halus di lenganmu masih refleks berdiri, seolah tubuhmu masih mencoba menghangatkan jaket bulu yang dulu pernah ada.",
  },
  {
    scene: 6,
    pauseBeforeS: 0.12,
    pauseAfterS: 0.14,
    text: "[warm] [[c6_finale]]Simpanse, bonobo, dan gorila tetap tinggal di hutan, jadi mereka tetap butuh bulunya. Sementara nenek moyang kita berani keluar ke padang yang panas, dan sejak hari itu, [[c6_berubah]]tubuh manusia ikut berubah.",
  },
];

// Indonesian Scientific Pronunciation Shield
const SPOKEN_SHIELD_MAP = {
  "DNA": "di en ei",
  "DNA.": "di en ei.",
  "overheat.": "overhit.",
  "overheat": "overhit",
  "sunscreen": "sanskrin",
  "sunblock.": "sanblok.",
  "sunblock": "sanblok",
};

const BESPOKE_SFX = [
  {
    name: "sfx_rainforest_mist_bed.mp3",
    durationSeconds: 9.0,
    promptInfluence: 0.72,
    prompt: "Deep atmospheric African tropical rainforest canopy ambient bed, gentle rustling jungle leaves and distant soft humid breeze, documentary soundscape, no music",
  },
  {
    name: "sfx_forest_rain_gentle.mp3",
    durationSeconds: 6.5,
    promptInfluence: 0.72,
    prompt: "Soft soothing tropical rainforest rain pattering gently on wide forest leaves, clean cinematic nature documentary foley, no thunder, no music",
  },
  {
    name: "sfx_climate_dry_wind.mp3",
    durationSeconds: 7.0,
    promptInfluence: 0.72,
    prompt: "Dry warm African open savanna wind sweeping softly across golden dry grass plains under midday sun, atmospheric documentary soundscape, no music",
  },
  {
    name: "sfx_cloud_whoosh.mp3",
    durationSeconds: 1.1,
    promptInfluence: 0.72,
    prompt: "Soft airy high-altitude white cloud curtain wipe whoosh transition, gentle low-mid wind sweep, documentary cinema transition, no music",
  },
  {
    name: "sfx_savanna_run_footsteps.mp3",
    durationSeconds: 5.5,
    promptInfluence: 0.72,
    prompt: "Rhythmic steady human footsteps running on dry dusty African savanna grass trail with subtle determined breathing, clean documentary foley, no music",
  },
  {
    name: "sfx_heat_overheat_pulse.mp3",
    durationSeconds: 4.5,
    promptInfluence: 0.72,
    prompt: "Deep tense thermal heat shimmer hum combined with slow heavy muffled human heartbeat pulse, physiological stress documentary foley, no music",
  },
  {
    name: "sfx_hologram_xout.mp3",
    durationSeconds: 1.2,
    promptInfluence: 0.70,
    prompt: "Subtle futuristic translucent hologram appearance hum followed by a crisp clean soft electronic cross-out tick, minimal science documentary UI foley, no music",
  },
  {
    name: "sfx_cool_sweat_evap.mp3",
    durationSeconds: 4.0,
    promptInfluence: 0.72,
    prompt: "Refreshing cool air breeze mist evaporation swoosh bringing sudden cool relief from heat, delicate water mist air flow, cinema documentary foley, no music",
  },
  {
    name: "sfx_uv_sizzle_pulse.mp3",
    durationSeconds: 4.0,
    promptInfluence: 0.70,
    prompt: "Warm radiant solar light beam hum and subtle biological skin glow shimmer, restrained science documentary sound design, no harsh noise, no music",
  },
  {
    name: "sfx_whip_pan_snap.mp3",
    durationSeconds: 0.6,
    promptInfluence: 0.75,
    prompt: "Fast crisp horizontal cinema camera whip-pan air snap swoosh, tight clean transient, no music",
  },
  {
    name: "sfx_cellular_dive_whoosh.mp3",
    durationSeconds: 1.2,
    promptInfluence: 0.70,
    prompt: "Deep microscopic camera dive whoosh passing into living cellular tissue and molecular DNA space, smooth low-mid swell, science documentary sound design",
  },
  {
    name: "sfx_cold_wind_goosebumps.mp3",
    durationSeconds: 5.0,
    promptInfluence: 0.72,
    prompt: "Quiet chilly evening breeze sweeping softly across skin with subtle crisp frosty air shimmer, intimate atmospheric documentary foley, no music",
  },
];

function prepareLine(rawText, lineIdx) {
  const displayTokens = [];
  const ttsChunks = [];
  const parts = rawText.split(/(?<!\[)(\[[^\[\]]+\])(?!\])/g);

  for (const part of parts) {
    if (!part) continue;
    if (/^\[[^\[\]]+\]$/.test(part)) {
      if (!/^\[clear\]$/i.test(part)) ttsChunks.push(part);
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
    ttsPlain: displayTokens.map((x) => x.w).join(" ").replace(/\s{2,}/g, " ").trim(),
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

async function withRetry(label, fn, maxAttempts = 4) {
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const waitMs = 2000 * attempt;
      console.warn(`    [Retry ${attempt}/${maxAttempts}] ${label} failed (${err?.cause?.code || err?.message}), waiting ${waitMs}ms...`);
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
  throw lastErr;
}

function getDurationSec(filePath) {
  const out = execFileSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", filePath],
    { encoding: "utf8" }
  ).trim().replace(/,/g, "");
  return Number.parseFloat(out);
}

function renderBaritoneWav(mp3Path, wavPath) {
  const af =
    "highpass=f=75,equalizer=f=160:t=q:w=1.1:g=1.8,equalizer=f=2800:t=q:w=1.3:g=1.8,equalizer=f=6800:t=q:w=1.4:g=-0.8,loudnorm=I=-16.5:TP=-2.0:LRA=6:linear=true";
  execFileSync(
    "ffmpeg",
    ["-y", "-loglevel", "error", "-i", mp3Path, "-ar", String(SR), "-ac", "1", "-af", af, "-sample_fmt", "s16", wavPath],
    { stdio: "inherit" }
  );
}

async function main() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error("ELEVENLABS_API_KEY belum terisi di .env!");
    process.exit(1);
  }

  const client = new ElevenLabsClient({ apiKey });
  const audioDir = join(PROJECT, "audio");
  const voCacheDir = join(audioDir, "vo_cache");
  const sfxDir = join(audioDir, "sfx");
  const outVoWav = join(audioDir, "vo_master.wav");
  const outAlignJson = join(audioDir, "alignment.json");
  const outStoryTs = join(ROOT, "remotion/videos/ep03-manusia-berbulu/story.ts");
  const tmpBase = join(PROJECT, ".tmp");

  mkdirSync(voCacheDir, { recursive: true });
  mkdirSync(sfxDir, { recursive: true });
  mkdirSync(dirname(outStoryTs), { recursive: true });
  mkdirSync(tmpBase, { recursive: true });

  const prepared = LINES.map((ln, idx) => ({ ...ln, idx, ...prepareLine(ln.text, idx) }));
  const tmpDir = mkdtempSync(join(tmpBase, "vo-berbulu-"));

  try {
    console.log(`=== [1/2] Synthesizing Baritone Documentary VO (${TTS_MODEL} · ${prepared.length} Lines) ===`);
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
      if (sceneStartsSec[`s${line.scene}`] === undefined) {
        sceneStartsSec[`s${line.scene}`] = cursorSec;
      }

      if (line.pauseBeforeS > 0.005) {
        concatParts.push(makeSilence(`sil_pre_${i}.wav`, line.pauseBeforeS));
        cursorSec += line.pauseBeforeS;
      }

      const prevText = prepared.slice(Math.max(0, i - 2), i).map((x) => x.ttsText).join(" ");
      const nextText = prepared.slice(i + 1, i + 2).map((x) => x.ttsText).join(" ");

      const cachePayload = {
        v: VOICE.cacheVer,
        id: VOICE.id,
        model: TTS_MODEL,
        stab: VOICE.stability,
        sim: VOICE.similarityBoost,
        style: VOICE.style,
        seed: VOICE.seed,
        prev: prevText,
        next: nextText,
        text: line.ttsText,
      };
      const cacheKey = createHash("sha1").update(JSON.stringify(cachePayload)).digest("hex").slice(0, 12);
      const mp3Path = join(voCacheDir, `line_${String(i).padStart(2, "0")}_${cacheKey}.mp3`);
      const alignPath = join(voCacheDir, `line_${String(i).padStart(2, "0")}_${cacheKey}.json`);

      let alignment;
      if (existsSync(mp3Path) && existsSync(alignPath)) {
        console.log(`  [${i + 1}/${prepared.length}] CACHED SQ${line.scene}: ${line.ttsPlain}`);
        alignment = JSON.parse(readFileSync(alignPath, "utf8"));
      } else {
        console.log(`  [${i + 1}/${prepared.length}] SYNTH  SQ${line.scene}: ${line.ttsText}`);
        const reqBody = {
          text: line.ttsText,
          modelId: TTS_MODEL,
          languageCode: "id",
          outputFormat: "mp3_44100_128",
          applyTextNormalization: "on",
          seed: VOICE.seed,
          voiceSettings: {
            stability: VOICE.stability,
            similarityBoost: VOICE.similarityBoost,
            style: VOICE.style,
            useSpeakerBoost: true,
          },
        };
        if (prevText) reqBody.previousText = prevText;
        if (nextText) reqBody.nextText = nextText;

        const res = await withRetry(`VO line ${i + 1}`, () =>
          client.textToSpeech.convertWithTimestamps(VOICE.id, reqBody)
        );
        writeFileSync(mp3Path, Buffer.from(res.audioBase64, "base64"));
        alignment = res.alignment;
        writeFileSync(alignPath, JSON.stringify(alignment, null, 2));
      }

      const rawWav = join(tmpDir, `line_${i}.wav`);
      renderBaritoneWav(mp3Path, rawWav);

      const spokenRuns = extractSpokenRuns(alignment);
      const aligned = alignDisplayToRuns(line.displayTokens, spokenRuns);
      const clipDur = getDurationSec(rawWav);

      const trimLead = spokenRuns.length ? Math.max(0, Number((spokenRuns[0].start - 0.085).toFixed(3))) : 0;
      const lastEnd = spokenRuns.length ? spokenRuns[spokenRuns.length - 1].end : clipDur;
      const srcSpan = Math.max(0.16, Math.min(clipDur - trimLead, Number((lastEnd - trimLead + 0.22).toFixed(3))));
      const trimWav = join(tmpDir, `line_${i}_trim.wav`);
      execFileSync("ffmpeg", [
        "-y", "-loglevel", "error", "-ss", String(trimLead), "-i", rawWav, "-t", String(srcSpan),
        "-af", `atempo=${VOICE.tempo},afade=t=in:st=0:d=0.008`, "-sample_fmt", "s16", trimWav,
      ]);
      const actualDur = getDurationSec(trimWav);
      const fadeWav = join(tmpDir, `line_${i}_fade.wav`);
      execFileSync("ffmpeg", [
        "-y", "-loglevel", "error", "-i", trimWav,
        "-af", `afade=t=out:st=${Math.max(0, actualDur - 0.015).toFixed(3)}:d=0.015`, "-sample_fmt", "s16", fadeWav,
      ]);

      const lineStartSec = cursorSec;
      for (const tok of aligned) {
        const sRel = Math.max(0, (tok.start - trimLead) / VOICE.tempo);
        const eRel = Math.max(sRel + 0.02, (tok.end - trimLead) / VOICE.tempo);
        allWords.push({
          w: tok.w,
          cue: tok.cue,
          scene: line.scene,
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
        startSec: Number(lineStartSec.toFixed(3)),
        endSec: Number(cursorSec.toFixed(3)),
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

    const cuesSec = {};
    const cuesFrame = {};
    for (const w of allWords) {
      if (w.cue) {
        cuesSec[w.cue] = w.start;
        cuesFrame[w.cue] = Math.round(w.start * FPS);
      }
    }

    const scenesFrame = {};
    for (let s = 1; s <= 6; s++) {
      scenesFrame[`s${s}`] = s === 1 ? 0 : Math.round((sceneStartsSec[`s${s}`] ?? 0) * FPS);
    }
    scenesFrame.totalFrames = totalFrames;

    const wordTimings = allWords.map((w) => ({
      word: w.w,
      cue: w.cue,
      scene: w.scene,
      line: w.line,
      startSec: w.start,
      endSec: w.end,
      startFrame: Math.round(w.start * FPS),
      endFrame: Math.round(w.end * FPS),
    }));

    writeFileSync(
      outAlignJson,
      JSON.stringify(
        {
          projectSlug: "ep03-manusia-berbulu",
          voice: VOICE,
          model: TTS_MODEL,
          voDurationSec: Number(voDur.toFixed(3)),
          totalVideoSec,
          fps: FPS,
          totalFrames,
          scenesSec: sceneStartsSec,
          scenesFrame,
          cuesSec,
          cuesFrame,
          lineSpans,
          wordTimings,
        },
        null,
        2
      ) + "\n",
      "utf8"
    );

    const storyTs = `// AUTO-GENERATED by ep03-manusia-berbulu/scripts/build_vo_and_sfx.mjs
// Source: ElevenLabs ${TTS_MODEL} Baritone Documentary VO (Brian · ${allWords.length} words)

export interface WordTiming {
  word: string;
  cue: string | null;
  scene: number;
  line: number;
  startSec: number;
  endSec: number;
  startFrame: number;
  endFrame: number;
}

export interface LineSpan {
  idx: number;
  scene: number;
  startSec: number;
  endSec: number;
  startFrame: number;
  endFrame: number;
}

export const FPS = ${FPS};
export const TOTAL_FRAMES = ${totalFrames};
export const TOTAL_SECONDS = ${totalVideoSec};

export const COMPOSITION_CONFIG = {
  id: "Ep03ManusiaBerbuluShort",
  width: 1080,
  height: 1920,
  fps: ${FPS},
  durationInFrames: ${totalFrames},
  durationSec: ${totalVideoSec},
  audioMasterPath: "ep03-manusia-berbulu/audio_master.m4a",
} as const;

export const SCENE_STARTS = ${JSON.stringify(scenesFrame, null, 2)} as const;
export const LINE_SPANS: LineSpan[] = ${JSON.stringify(lineSpans, null, 2)};
export const CUES = ${JSON.stringify(cuesFrame, null, 2)} as const;
export const WORDS: WordTiming[] = ${JSON.stringify(wordTimings, null, 2)};
`;
    writeFileSync(outStoryTs, storyTs, "utf8");
    console.log(`\nVO COMPLETE -> ${outVoWav} (${voDur.toFixed(2)}s VO | ${totalVideoSec.toFixed(2)}s video / ${totalFrames} frames)`);

    console.log(`\n=== [2/2] Generating ${BESPOKE_SFX.length} Bespoke Rainforest, Savanna & Bio SFX via ${SFX_MODEL} ===`);
    for (let i = 0; i < BESPOKE_SFX.length; i++) {
      const sfx = BESPOKE_SFX[i];
      const outPath = join(sfxDir, sfx.name);
      if (existsSync(outPath) && getDurationSec(outPath) > 0.3) {
        console.log(`  [${i + 1}/${BESPOKE_SFX.length}] CACHED ${sfx.name}`);
        continue;
      }
      console.log(`  [${i + 1}/${BESPOKE_SFX.length}] SYNTH  ${sfx.name} (${sfx.durationSeconds}s)...`);
      const stream = await withRetry(`SFX ${sfx.name}`, () =>
        client.textToSoundEffects.convert({
          text: sfx.prompt,
          modelId: SFX_MODEL,
          durationSeconds: sfx.durationSeconds,
          promptInfluence: sfx.promptInfluence,
          loop: false,
        })
      );
      const ws = createWriteStream(outPath);
      await finished(Readable.fromWeb(stream).pipe(ws));
      console.log(`           -> saved (${getDurationSec(outPath).toFixed(2)}s)`);
    }
    console.log("\n=== ALL EP03 MANUSIA BERBULU VO & SFX COMPLETE ===");
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error("FATAL ERROR in build_vo_and_sfx:", err);
  process.exit(1);
});
