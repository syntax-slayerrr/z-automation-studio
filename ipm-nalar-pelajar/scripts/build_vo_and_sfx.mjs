/**
 * Audio-First 3-Cast Dramatic ElevenLabs eleven_v4 + Bespoke Sound-V3 SFX Generator
 * for "IpmNalarPelajarShort" ("Nalar Pelajar: Wisnu — Berani Bertanya & 5W 1H")
 *
 * 3-VOICE DRAMA CAST:
 *  - narrator  : Eric  (`cjVigY5qzO86Huf0OWal`) — Warm, Calm, Thoughtful Indonesian Storyteller
 *  - wisnu     : Liam  (`TX3LPaxmHKxFdv7VOQHJ`) — Popular Charismatic Young Student (5W 1H check, inner battle, brave seminar question)
 *  - moderator : Brian (`nPczCjzI2devNBz1zQrb`) — Warm Authoritative PC IPM Panawuan Seminar Moderator (subtle PA hall mic EQ/echo)
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
const OPEN_LEAD_SILENCE_S = 0.25;
const END_HOLD_S = 3.2; // Clean room for "Nalar Pelajar" closing title card!

const VOICES = {
  narrator: {
    id: "cjVigY5qzO86Huf0OWal", // Eric — Calm, Warm, Reflective Indonesian Storyteller
    label: "Narrator (Eric · Calm & Warm)",
    stability: 0.68,
    similarityBoost: 0.88,
    style: 0.06,
    seed: 2026,
    useContextLock: true,
    cacheVer: "v1_ipm_nalar_eric",
    tempo: 1.09,
  },
  wisnu: {
    id: "TX3LPaxmHKxFdv7VOQHJ", // Liam — Popular Expressive Young Student Male
    label: "Wisnu (Liam · Popular Young Student)",
    stability: 0.56,
    similarityBoost: 0.85,
    style: 0.14,
    seed: 7718,
    useContextLock: false,
    cacheVer: "v1_ipm_nalar_liam",
    tempo: 1.08,
  },
  moderator: {
    id: "nPczCjzI2devNBz1zQrb", // Brian — Warm Authoritative Seminar Moderator (PC IPM Panawuan)
    label: "Moderator (Brian · PC IPM Panawuan PA Mic)",
    stability: 0.72,
    similarityBoost: 0.88,
    style: 0.04,
    seed: 4242,
    useContextLock: false,
    cacheVer: "v1_ipm_nalar_brian",
    tempo: 1.07,
  },
};

const LINES = [
  // === BABAK I: KAMAR BELAJAR WISNU (23:10) ===
  {
    scene: 1,
    who: "narrator",
    acoustic: "normal",
    pauseBeforeS: 0.10,
    pauseAfterS: 0.22,
    text: "[warm] [[s1_lamp_off]]Jam sebelas lewat sepuluh. Lampu kamar Wisnu sudah mati, tapi layar ponselnya masih menyala.",
  },
  {
    scene: 2,
    who: "narrator",
    acoustic: "normal",
    pauseBeforeS: 0.06,
    pauseAfterS: 0.28,
    text: "[[s2_ecu_eyes]]Tiga detik lalu, jempolnya hampir menekan tombol bagikan pada satu berita viral. Tanpa satu pun pertanyaan.",
  },
  {
    scene: 3,
    who: "narrator",
    acoustic: "normal",
    pauseBeforeS: 0.08,
    pauseAfterS: 0.20,
    text: "[reflective] [[s3_fear_bubbles]]Bukan karena kepalanya tidak sanggup berpikir. Tapi sejak lama, Wisnu lebih takut terlihat bodoh daripada takut dibohongi.",
  },
  {
    scene: 4,
    who: "narrator",
    acoustic: "normal",
    pauseBeforeS: 0.06,
    pauseAfterS: 0.22,
    text: "[[s4_bubbles_100]]Satu potongan berita memancing sepuluh opini. Sepuluh opini memanggil seratus komentar. Sampai kamarnya penuh sesak oleh suara orang lain.",
  },
  {
    scene: 5,
    who: "narrator",
    acoustic: "normal",
    pauseBeforeS: 0.08,
    pauseAfterS: 0.45,
    text: "[[s5_berani]]Padahal, langkah pertama berpikir kritis cuma satu: berani. Berani berhenti. Berani bertanya.",
  },
  {
    scene: 6,
    who: "narrator",
    acoustic: "normal",
    pauseBeforeS: 0.14,
    pauseAfterS: 0.22,
    text: "[gentle] [[s6_reset_lamp_on]]Wisnu menarik napas. Ia tidak melempar ponselnya. Ia menyalakan lampu meja, membuka ulang berita itu, lalu langsung membedahnya dengan 5W 1H.",
  },
  // SH07 — WISNU IMPLEMENTASI 5W 1H LANGSUNG SAAT SCROLL BERITA HP!
  {
    scene: 7,
    who: "wisnu",
    acoustic: "inner",
    pauseBeforeS: 0.12,
    pauseAfterS: 0.16,
    text: "[thoughtful] [[s7_what]]Tunggu dulu... What, apa peristiwa atau masalah utamanya? [[s7_who]]Who, siapa pihak yang benar-benar terlibat atau terdampak?",
  },
  {
    scene: 7,
    who: "wisnu",
    acoustic: "inner",
    pauseBeforeS: 0.10,
    pauseAfterS: 0.16,
    text: "[thoughtful] [[s7_when]]When, kapan waktu dan garis waktu kejadiannya? Jangan sampai berita lama diputar ulang. [[s7_where]]Where, di mana lokasi persis kejadian itu berlangsung?",
  },
  {
    scene: 7,
    who: "wisnu",
    acoustic: "inner",
    pauseBeforeS: 0.10,
    pauseAfterS: 0.28,
    text: "[thoughtful] [[s7_why]]Why, mengapa alasan dan penyebabnya bisa muncul? [[s7_how]]Dan How, bagaimana proses serta kronologi aslinya berjalan?",
  },
  // SH08 — MACRO POV LANGKAH AWAL MELATIH BERPIKIR KRITIS + JEMBATAN MULUS KE SEMINAR
  {
    scene: 8,
    who: "narrator",
    acoustic: "normal",
    pauseBeforeS: 0.10,
    pauseAfterS: 0.34,
    text: "[warm] [[s8_pov_write]]Begitulah langkah awal melatih berpikir kritis dari meja belajarmu sendiri. Jeda lima detik sebelum percaya. Bedah satu berita dengan 5W 1H. Lalu tulis satu pertanyaan di sudut buku catatan.",
  },
  {
    scene: 8,
    who: "narrator",
    acoustic: "normal",
    pauseBeforeS: 0.08,
    pauseAfterS: 0.45,
    text: "[reflective] [[s8_bridge]]Wisnu tidak menyangka, latihan kecil malam itu akan langsung diuji keesokan paginya.",
  },

  // === BABAK II: DRAMA SEMINAR BERPIKIR KRITIS — PC IPM PANAWUAN ===
  {
    scene: 9,
    who: "narrator",
    acoustic: "normal",
    pauseBeforeS: 0.12,
    pauseAfterS: 0.26,
    text: "[[s9_seminar_open]]Besok paginya, Cabang Panawuan mengadakan seminar tentang berpikir kritis. Aula penuh sesak oleh puluhan pelajar.",
  },
  {
    scene: 9,
    who: "moderator",
    acoustic: "pa_mic",
    pauseBeforeS: 0.10,
    pauseAfterS: 0.38,
    text: "[warm] [[s9_mod_invite]]Baik teman-teman, sekarang kita masuk ke sesi tanya jawab. Silakan, ada yang ingin bertanya?",
  },
  {
    scene: 9,
    who: "narrator",
    acoustic: "normal",
    pauseBeforeS: 0.08,
    pauseAfterS: 0.26,
    text: "[[s9_silence]]Ruangan mendadak hening. Di dalam hati Wisnu, ada satu pertanyaan penting yang terus mendesak ingin keluar.",
  },
  // SH10 — PERANG BATIN & KEGELISAHAN WISNU (TUNNEL VISION + CRIMSON RIM + HEARTBEAT)
  {
    scene: 10,
    who: "narrator",
    acoustic: "normal",
    pauseBeforeS: 0.10,
    pauseAfterS: 0.22,
    text: "[soft] [[s10_inner_battle]]Tangannya hampir terangkat. Lalu turun lagi. Jantungnya memukul dada. Rasanya malu, ragu, dan takut.",
  },
  {
    scene: 10,
    who: "wisnu",
    acoustic: "inner_tense",
    pauseBeforeS: 0.10,
    pauseAfterS: 0.58, // Tense dramatic silence before breakthrough!
    text: "[nervous] [[s10_wisnu_doubt]]Bagaimana kalau ini dicap pertanyaan bodoh? Bagaimana kalau satu aula menertawakanmu? Diem aja, Nu... lebih aman ikut mengangguk.",
  },
  // SH11 — KEMENANGAN MELAWAN DIRI SENDIRI + MODERATOR MEMPERSILAKAN
  {
    scene: 11,
    who: "narrator",
    acoustic: "normal",
    pauseBeforeS: 0.12,
    pauseAfterS: 0.24,
    text: "[gentle] [[s11_breakthrough]]Wisnu memejamkan mata satu detik. Ia teringat catatannya semalam. Hanya ada satu lawan yang harus ia kalahkan hari ini: rasa takutnya sendiri.",
  },
  {
    scene: 11,
    who: "narrator",
    acoustic: "normal",
    pauseBeforeS: 0.06,
    pauseAfterS: 0.24,
    text: "[[s11_hand_up]]Dan akhirnya, Wisnu menang. Tangannya terangkat tinggi.",
  },
  {
    scene: 11,
    who: "moderator",
    acoustic: "pa_mic",
    pauseBeforeS: 0.10,
    pauseAfterS: 0.30,
    text: "[warm] [[s11_mod_point]]Ya, silakan! Mas yang pakai baju kuning di tengah.",
  },
  // SH12 — WISNU BERDIRI BERTANYA (PAYOFF 5W 1H!) -> IPM -> PENUTUP "NALAR PELAJAR"
  {
    scene: 12,
    who: "wisnu",
    acoustic: "hall_mic",
    pauseBeforeS: 0.10,
    pauseAfterS: 0.42,
    text: "[reassuring] [[s12_wisnu_asks]]Terima kasih, Kak. Saya Wisnu. Di slide tadi disebut mayoritas pelajar gampang percaya hoaks. Tapi data itu diambil kapan, dan penyebab utamanya sebenarnya apa?",
  },
  {
    scene: 12,
    who: "narrator",
    acoustic: "normal",
    pauseBeforeS: 0.14,
    pauseAfterS: 0.36,
    text: "[warm] [[s12_ipm_ethos]]Di Ikatan Pelajar Muhammadiyah, tradisi ilmu selalu lahir dari pena dan keberanian memeriksa. Di detik Wisnu berani bersuara, ia sudah melangkah lebih jauh dari sekadar duduk mendengar.",
  },
  {
    scene: 12,
    who: "narrator",
    acoustic: "normal",
    pauseBeforeS: 0.14,
    pauseAfterS: 0.20,
    text: "[reflective] [[s12_closing_title]]Karena perubahan besar selalu dimulai saat satu pelajar menyalakan... nalar pelajar.",
  },
];

const BESPOKE_SFX = [
  {
    name: "sfx_lamp_switch_click.mp3",
    durationSeconds: 1.0,
    promptInfluence: 0.72,
    prompt: "Single crisp tactile bedside desk lamp push-button switch click in a quiet cozy bedroom at night, clean dry foley, no music",
  },
  {
    name: "sfx_soft_low_thump.mp3",
    durationSeconds: 1.4,
    promptInfluence: 0.68,
    prompt: "Subtle deep muffled cinematic realization thump with tiny phone screen tap ping in a silent dark room, clean sound design",
  },
  {
    name: "sfx_bubble_pop_soft.mp3",
    durationSeconds: 1.5,
    promptInfluence: 0.68,
    prompt: "Three gentle hollow soft-glass thought bubble pops appearing lightly in air, warm minimal animated film foley, no music",
  },
  {
    name: "sfx_bubble_pops_cascade.mp3",
    durationSeconds: 2.6,
    promptInfluence: 0.68,
    prompt: "Accelerating cascade of light hollow bubble pops and soft smartphone notification chimes multiplying in a quiet room, clean foley",
  },
  {
    name: "sfx_muted_alarm_pulse.mp3",
    durationSeconds: 2.4,
    promptInfluence: 0.66,
    prompt: "Low muffled psychological anxiety hum with soft pulsing sub-bass tension, subtle dramatic cinema foley, no loud siren",
  },
  {
    name: "sfx_calm_exhale_resolve.mp3",
    durationSeconds: 2.0,
    promptInfluence: 0.70,
    prompt: "Calm peaceful human slow exhale sigh followed by a quiet airy release of tension in a silent room, intimate foley",
  },
  {
    name: "sfx_phone_scroll_chime.mp3",
    durationSeconds: 1.8,
    promptInfluence: 0.66,
    prompt: "Soft finger thumb swipe across a smartphone glass screen followed by a gentle warm minimalist crystalline insight chime, clean foley",
  },
  {
    name: "sfx_pen_scribble_paper.mp3",
    durationSeconds: 3.6,
    promptInfluence: 0.75,
    prompt: "Realistic close-up ballpoint pen writing smoothly and steadily on ruled notebook paper on a wooden study desk, crisp ASMR foley, no music",
  },
  {
    name: "sfx_notebook_close.mp3",
    durationSeconds: 1.2,
    promptInfluence: 0.72,
    prompt: "Clean decisive sound of closing a spiral paper notebook gently on a wooden desk, warm dry foley",
  },
  {
    name: "sfx_seminar_hall_ambience.mp3",
    durationSeconds: 4.0,
    promptInfluence: 0.70,
    prompt: "Quiet indoor Indonesian student auditorium seminar room ambience, soft distant murmurs and chairs settling politely before a speaker uses a microphone, natural room tone",
  },
  {
    name: "sfx_heartbeat_anxiety.mp3",
    durationSeconds: 4.5,
    promptInfluence: 0.74,
    prompt: "Deep muffled anxious human heartbeat pounding steadily lub-dub lub-dub in a quiet claustrophobic tunnel-vision moment with very subtle ear hush, cinema sound design, no music",
  },
  {
    name: "sfx_triumph_hand_rise.mp3",
    durationSeconds: 2.4,
    promptInfluence: 0.66,
    prompt: "Gentle airy uplifting whoosh of courage followed by a soft warm shimmering golden chime and subtle auditorium attentive rustle, cinema foley",
  },
];

// Indonesian Pronunciation Shield: clean subtitles on screen while TTS speaks crisp natural Indonesian!
const SPOKEN_SHIELD_MAP = {
  "5W": "lima we",
  "1H.": "satu ha.",
  "1H": "satu ha",
  "1H-nya": "satu ha nya",
  "cuma": "chuma",
  "slide": "slaid",
  "hoaks.": "hoks.",
  "hoaks": "hoks",
  "What,": "Wot,",
  "Who,": "Hu,",
  "When,": "Wen,",
  "Where,": "Wer,",
  "Why,": "Wai,",
  "How,": "Hau,",
  "mendesak": "mendesak",
  "Panawuan": "Panawuan",
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

/**
 * Per-role + per-acoustic-space EQ & subtle room realism!
 *  - narrator (normal): smooth intimate documentary warmth
 *  - wisnu (inner / inner_tense): warm close-mic intimate internal voice
 *  - wisnu (hall_mic): crisp hall handheld mic presence + tiny room reflection
 *  - moderator (pa_mic): realistic seminar auditorium PA mic presence + gentle slapback tail!
 */
function renderVoiceWav(mp3Path, wavPath, who, acoustic) {
  let af = "highpass=f=78,equalizer=f=180:t=q:w=1.1:g=1.6,equalizer=f=3050:t=q:w=1.3:g=1.6,equalizer=f=6500:t=q:w=1.4:g=-1.0,loudnorm=I=-17:TP=-2.0:LRA=6:linear=true";
  if (acoustic === "pa_mic") {
    af = "highpass=f=135,lowpass=f=9200,equalizer=f=1400:t=q:w=1.2:g=2.4,equalizer=f=3200:t=q:w=1.3:g=2.6,aecho=0.88:0.78:32|64:0.13|0.06,loudnorm=I=-17.5:TP=-2.0:LRA=6:linear=true";
  } else if (acoustic === "hall_mic") {
    af = "highpass=f=110,lowpass=f=10500,equalizer=f=2200:t=q:w=1.2:g=2.0,aecho=0.90:0.80:26:0.09,loudnorm=I=-16.8:TP=-2.0:LRA=6:linear=true";
  } else if (acoustic === "inner_tense") {
    af = "highpass=f=90,lowpass=f=8800,equalizer=f=260:t=q:w=1.2:g=1.5,equalizer=f=2900:t=q:w=1.3:g=1.2,aecho=0.92:0.82:42:0.11,loudnorm=I=-17.2:TP=-2.0:LRA=6:linear=true";
  } else if (who === "wisnu") {
    af = "highpass=f=85,equalizer=f=220:t=q:w=1.2:g=1.2,equalizer=f=3300:t=q:w=1.3:g=1.8,equalizer=f=6800:t=q:w=1.4:g=-1.0,loudnorm=I=-17:TP=-2.0:LRA=6:linear=true";
  }
  execFileSync(
    "ffmpeg",
    ["-y", "-loglevel", "error", "-i", mp3Path, "-ar", String(SR), "-ac", "1", "-af", af, "-sample_fmt", "s16", wavPath],
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
        (cur.length >= 6 && remaining >= 2) ||
        (textLen >= 34 && cur.length >= 4 && remaining >= 1);
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
  const outStoryTs = join(ROOT, "remotion/videos/ipm-nalar-pelajar/story.ts");
  const tmpBase = join(PROJECT, ".tmp");

  mkdirSync(voCacheDir, { recursive: true });
  mkdirSync(sfxDir, { recursive: true });
  mkdirSync(dirname(outStoryTs), { recursive: true });
  mkdirSync(tmpBase, { recursive: true });

  const prepared = LINES.map((ln, idx) => ({ ...ln, idx, ...prepareLine(ln.text, idx) }));
  const tmpDir = mkdtempSync(join(tmpBase, "vo-ipm-nalar-"));

  try {
    console.log(`=== [1/2] Synthesizing 3-Cast Drama ElevenLabs ${TTS_MODEL} VO (${prepared.length} Lines) ===`);
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
    const sceneBoundsSec = {};

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
      renderVoiceWav(mp3Path, rawWav, line.who, line.acoustic);

      const spokenRuns = extractSpokenRuns(alignment);
      const aligned = alignDisplayToRuns(line.displayTokens, spokenRuns);
      const clipDur = getDurationSec(rawWav);

      // Safe 85ms consonant pre-roll matching Golden Rule!
      const trimLead = spokenRuns.length ? Math.max(0, Number((spokenRuns[0].start - 0.085).toFixed(3))) : 0;
      const lastEnd = spokenRuns.length ? spokenRuns[spokenRuns.length - 1].end : clipDur;
      const tailPad = line.acoustic === "pa_mic" ? 0.34 : 0.24;
      const srcSpan = Math.max(0.16, Math.min(clipDur - trimLead, Number((lastEnd - trimLead + tailPad).toFixed(3))));
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
          acoustic: line.acoustic,
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
        acoustic: line.acoustic,
        startSec: Number(lineStartSec.toFixed(3)),
        endSec: Number(cursorSec.toFixed(3)),
        startFrame: Math.round(lineStartSec * FPS),
        endFrame: Math.round(cursorSec * FPS),
      });

      if (line.pauseAfterS > 0.005) {
        concatParts.push(makeSilence(`sil_post_${i}.wav`, line.pauseAfterS));
        cursorSec += line.pauseAfterS;
      }

      if (!sceneBoundsSec[String(line.scene)]) {
        sceneBoundsSec[String(line.scene)] = { startSec: Number(sceneStartsSec[`s${line.scene}`].toFixed(3)), endSec: Number(cursorSec.toFixed(3)) };
      } else {
        sceneBoundsSec[String(line.scene)].endSec = Number(cursorSec.toFixed(3));
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
    for (let s = 1; s <= 12; s++) {
      scenesFrame[`s${s}`] = s === 1 ? 0 : Math.round((sceneStartsSec[`s${s}`] ?? 0) * FPS);
    }
    scenesFrame.totalFrames = totalFrames;

    const subtitleChunks = buildSubtitleChunks(allWords);
    const wordTimings = allWords.map((w) => ({
      word: w.w,
      cue: w.cue,
      line: w.line,
      who: w.who,
      acoustic: w.acoustic,
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
          projectSlug: "ipm-nalar-pelajar",
          voices: VOICES,
          model: TTS_MODEL,
          voDurationSec: Number(voDur.toFixed(3)),
          totalVideoSec,
          fps: FPS,
          totalFrames,
          scenesSec: sceneStartsSec,
          sceneBoundsSec,
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

    const storyTs = `// AUTO-GENERATED by ipm-nalar-pelajar/scripts/build_vo_and_sfx.mjs
// Source: 3-Cast Dramatic ElevenLabs ${TTS_MODEL} (Narrator=Eric, Wisnu=Liam, Moderator=Brian · ${allWords.length} words)

export type SpeakerId = "narrator" | "wisnu" | "moderator";
export type AcousticMode = "normal" | "inner" | "inner_tense" | "hall_mic" | "pa_mic";

export interface WordTiming {
  word: string;
  cue: string | null;
  line: number;
  who: SpeakerId;
  acoustic: AcousticMode;
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
  acoustic: AcousticMode;
  startSec: number;
  endSec: number;
  startFrame: number;
  endFrame: number;
}

export const FPS = ${FPS};
export const TOTAL_FRAMES = ${totalFrames};
export const TOTAL_SECONDS = ${totalVideoSec};

export const COMPOSITION_CONFIG = {
  id: "IpmNalarPelajarShort",
  width: 1080,
  height: 1920,
  fps: ${FPS},
  durationInFrames: ${totalFrames},
  durationSec: ${totalVideoSec},
  audioMasterPath: "ipm-nalar-pelajar/audio_master.m4a",
} as const;

export const SCENE_STARTS = ${JSON.stringify(scenesFrame, null, 2)} as const;
export const CUES = ${JSON.stringify(cueMapFrame, null, 2)} as const;
export const SPEECH_SPANS: SpeechSpan[] = ${JSON.stringify(lineSpans, null, 2)};
export const SUBTITLE_CHUNKS: SubtitleChunk[] = ${JSON.stringify(subtitleChunks, null, 2)};
export const WORDS: WordTiming[] = ${JSON.stringify(wordTimings, null, 2)};
`;
    writeFileSync(outStoryTs, storyTs, "utf8");
    console.log(`\nVO COMPLETE -> ${outVoWav} (${voDur.toFixed(2)}s VO | ${totalVideoSec.toFixed(2)}s video / ${totalFrames} frames)`);

    console.log(`\n=== [2/2] Generating ${BESPOKE_SFX.length} Bespoke CharacterFlow Drama SFX via ${SFX_MODEL} ===`);
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

    console.log("\n=== ALL IPM NALAR PELAJAR 3-CAST VO & SFX COMPLETE ===");
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error("FATAL ERROR in build_vo_and_sfx:", err);
  process.exit(1);
});
