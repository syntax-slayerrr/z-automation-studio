/**
 * Audio-First VO & Bespoke Maritime SFX Generator for "NusantaraSamudraShort"
 * ("NUSANTARA — PERADABAN YANG MENGARUNGI SAMUDRA").
 *
 * - Primary Narrator: Brian (`nPczCjzI2devNBz1zQrb`, Warm Documentary Baritone) via ElevenLabs `eleven_v4` (`id`).
 * - Exact 16-Shot Verbatim Indonesian Documentary Script across 5 Acts (Prolog, Babak 1, Babak 2, Babak 3, Epilog).
 * - Supports display vs spoken override (`tts` vs `disp`) so subtitles preserve exact script spellings
 *   ("abad ke-8 dan ke-9", "Yolŋu", "Ma’anyan", "Charlemagne") while VO pronunciation stays 100% crisp!
 * - Generates 10 bespoke cinema-grade Maritime/Historical Foley SFX via ElevenLabs `eleven_text_to_sound_v3`.
 *
 * Run:
 *   node --env-file=.env nusantara-samudra/scripts/build_vo_and_sfx.mjs
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

async function withRetry(label, fn, maxAttempts = 4) {
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const waitMs = attempt * 3000;
      console.warn(`  [RETRY ${attempt}/${maxAttempts}] ${label} failed (${err?.code || err?.message || err}); retrying in ${waitMs / 1000}s...`);
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, waitMs));
      }
    }
  }
  throw lastErr;
}

const TTS_MODEL = "eleven_v4";
const SFX_MODEL = "eleven_text_to_sound_v3";
const SR = 44100;
const FPS = 30;
const TEMPO = 1.12;
// Opens with 1.85s storm wind, creaking wooden hull, crashing wave & lightning reveal before voice enters!
const OPEN_LEAD_SILENCE_S = 1.85;
const END_TAIL_PAD_S = 4.20; // Majestic ascending aerial Nusantara + title lock ("NUSANTARA — PERADABAN YANG MENGARUNGI SAMUDRA")

const NARRATOR = {
  id: "nPczCjzI2devNBz1zQrb", // Brian — Warm, Resonant Documentary Baritone
  label: "Brian (Warm Documentary Baritone)",
  stability: 0.54,
  similarityBoost: 0.78,
};

// 16 Verbatim Documentary Shots across 5 Acts (Act 0 Prolog .. Act 4 Epilog)
const BEATS = [
  // PROLOG — KAPAL YANG HILANG DI TENGAH SAMUDRA
  {
    act: 0,
    shot: 1,
    pauseAfterS: 0.42,
    text: "[dramatic, calm] [[sh01_ship]]Bayangkan berlayar ribuan kilometer... tanpa mesin, tanpa GPS, bahkan tanpa peta seperti yang kita kenal sekarang.",
  },
  {
    act: 0,
    shot: 2,
    pauseAfterS: 0.45,
    text: "[resonant] [[sh02_rope]]Tapi berabad-abad lalu, [[sh02_stars]]manusia dari kepulauan Asia Tenggara melakukan perjalanan melintasi samudra.",
  },
  {
    act: 0,
    shot: 3,
    pauseAfterS: 0.85, // Dramatic cut-to-black beat before Babak 1!
    text: "[mysterious] [[sh03_clouds]]Dan salah satu jejak paling mengejutkan dari perjalanan itu... [[sh03_africa]]ditemukan di Afrika.",
  },

  // BABAK 1 — BAHASA DARI SEBERANG SAMUDRA
  {
    act: 1,
    shot: 4,
    pauseAfterS: 0.36,
    ttsSwap: { "Ma’anyan": "Ma-anyan" },
    text: "[warm] [[sh04_village]]Di Madagaskar, sebuah pulau di lepas pantai Afrika, penduduknya menggunakan bahasa yang justru memiliki hubungan dekat dengan bahasa Ma’anyan dari Kalimantan.",
  },
  {
    act: 1,
    shot: 5,
    pauseAfterS: 0.42,
    text: "[thoughtful] [[sh05_words]]Jarak kedua wilayah ini mencapai ribuan kilometer. [[sh05_pullmap]]Namun, hubungan itu bukan sekadar kemiripan kata.",
  },
  {
    act: 1,
    shot: 6,
    pauseAfterS: 0.62,
    text: "[steady] [[sh06_indian_ocean]]Penelitian bahasa dan genetika menunjukkan adanya leluhur dari Asia Tenggara dalam populasi Madagaskar. [[sh06_ships]]Sebuah perjalanan manusia yang jejaknya masih bertahan hingga hari ini.",
  },

  // BABAK 2 — KAPAL YANG DIABADIKAN DI BATU
  {
    act: 2,
    shot: 7,
    pauseAfterS: 0.38,
    text: "[curious] [[sh07_relief]]Di Jawa, ada sesuatu yang menarik. Sebuah kapal diabadikan bukan di museum maritim, tetapi di dinding candi.",
  },
  {
    act: 2,
    shot: 8,
    pauseAfterS: 0.42,
    ttsSwap: { "ke-8": "kedelapan", "ke-9": "kesembilan" },
    text: "[resonant] [[sh08_living_ship]]Borobudur, yang dibangun sekitar abad ke-8 dan ke-9, menyimpan gambaran teknologi kapal masyarakat pada masa itu.",
  },
  {
    act: 2,
    shot: 9,
    pauseAfterS: 0.42,
    text: "[authoritative] [[sh09_sriwijaya]]Di Sumatra, Sriwijaya membangun kekuatan melalui perdagangan dan pelabuhan. [[sh09_network]]Kawasan ini menjadi penghubung penting antara jalur perdagangan India dan China.",
  },
  {
    act: 2,
    shot: 10,
    pauseAfterS: 0.65,
    ttsSwap: { Charlemagne: "Syarlemain" },
    text: "[warm] [[sh10_baghdad]]Ketika Baghdad tumbuh dan [[sh10_europe]]Charlemagne membangun kekuasaan di Eropa, [[sh10_sea_trade]]Asia Tenggara juga menjadi bagian dari dunia yang saling terhubung.",
  },

  // BABAK 3 — TERIPANG: ALASAN SEBUAH KAPAL MENYEBERANGI LAUT
  {
    act: 3,
    shot: 11,
    pauseAfterS: 0.36,
    ttsSwap: { "ke-18": "kedelapan belas" },
    text: "[thoughtful] [[sh11_makassar]]Namun, salah satu kisah pelayaran paling menarik justru terjadi berabad-abad kemudian.",
  },
  {
    act: 3,
    shot: 12,
    pauseAfterS: 0.42,
    text: "[steady] [[sh12_sail_aus]]Setiap musim, kapal-kapal dari Makassar berlayar menuju Australia. [[sh12_trepang_word]]Mereka datang untuk mencari sesuatu yang mungkin terlihat biasa: teripang.",
  },
  {
    act: 3,
    shot: 13,
    pauseAfterS: 0.42,
    text: "[warm] [[sh13_seabed]]Tetapi di China, hewan laut ini memiliki nilai perdagangan yang tinggi. [[sh13_drying]]Inilah alasan perjalanan lintas laut itu terus berulang.",
  },
  {
    act: 3,
    shot: 14,
    pauseAfterS: 0.62,
    ttsSwap: { "Yolŋu": "Yolngu" },
    text: "[resonant] [[sh14_yolngu]]Perdagangan itu mempertemukan dua masyarakat. [[sh14_axe]]Barang, kata-kata, dan teknologi berpindah. [[sh14_canoes]]Hubungan yang berlangsung selama lebih dari dua abad.",
  },

  // EPILOG — LAUT YANG MENYIMPAN JEJAK
  {
    act: 4,
    shot: 15,
    pauseAfterS: 0.46,
    text: "[epic, warm] [[sh15_triptych]]Bahasa di Afrika. Kapal di relief Jawa. Jejak perdagangan di Australia.",
  },
  {
    act: 4,
    shot: 16,
    pauseAfterS: 0.30,
    text: "[resonant, inspiring] [[sh16_archipelago]]Nusantara bukan hanya kepulauan. [[sh16_title]]Ia adalah bagian dari sejarah yang mengarungi dunia.",
  },
];

// 10 Bespoke Cinema Maritime & Historical Foley SFX via ElevenLabs `eleven_text_to_sound_v3`
const BESPOKE_SFX = [
  {
    name: "sfx_01_storm_hull_lightning.mp3",
    durationSeconds: 6.5,
    promptInfluence: 0.65,
    prompt: "Dark open ocean storm at night, howling wind, heavy wooden sailing ship hull creaking loudly, powerful wave slamming against timber planks, followed two seconds in by a crisp dramatic thunderclap and lightning crackle, realistic film foley, no music",
  },
  {
    name: "sfx_02_sail_rope_night_sea.mp3",
    durationSeconds: 6.0,
    promptInfluence: 0.60,
    prompt: "Close up wet thick hemp sailing rope pulled taut through wooden pulley block with ocean water splashing on wet wooden ship deck, gradually opening into serene vast open-ocean night wind under starry sky, realistic maritime foley, no music",
  },
  {
    name: "sfx_03_cloud_ascent_ocean_swell.mp3",
    durationSeconds: 5.5,
    promptInfluence: 0.58,
    prompt: "Cinematic ascending high-altitude wind sweeping smoothly through night clouds into an expansive deep warm atmospheric resonance as the globe appears, documentary film transition sound design, no music",
  },
  {
    name: "sfx_04_madagascar_coastal_village.mp3",
    durationSeconds: 6.5,
    promptInfluence: 0.58,
    prompt: "Gentle tropical Indian Ocean shore waves lapping softly on warm sand with faint peaceful distant coastal village ambience and gentle breeze through palm fronds, cinematic documentary field recording, no music",
  },
  {
    name: "sfx_05_borobudur_stone_sweep.mp3",
    durationSeconds: 5.5,
    promptInfluence: 0.60,
    prompt: "Ancient volcanic stone temple relief surface echoing softly as warm sunlight sweeps across rough carved andesite rock, subtle dry sand grains settling and deep resonant stone hush, documentary sound design, no music",
  },
  {
    name: "sfx_06_outrigger_ship_sailing.mp3",
    durationSeconds: 6.5,
    promptInfluence: 0.62,
    prompt: "Large ancient wooden double-outrigger ship unfurling woven sail snapping full in strong monsoon breeze, wooden rigging groaning warmly while bow slices crisply through sunlit turquoise tropical waves, realistic maritime foley, no music",
  },
  {
    name: "sfx_07_ancient_trade_harbors.mp3",
    durationSeconds: 6.5,
    promptInfluence: 0.58,
    prompt: "Bustling medieval silk road maritime port and distant market city ambience, gentle wooden boat hulls knocking softly at dock, faint bronze trade bells and warm woven cloth rustle, historical documentary soundscape, no music",
  },
  {
    name: "sfx_08_makassar_rigging_harbor.mp3",
    durationSeconds: 6.0,
    promptInfluence: 0.62,
    prompt: "18th century Indonesian wooden schooner harbor loading heavy rattan provision baskets onto deck, crisp thick hemp ropes hauled tight across timber cleats, gentle tropical harbor water lap and gull call, realistic historical foley, no music",
  },
  {
    name: "sfx_09_seabed_to_drying_fire.mp3",
    durationSeconds: 6.0,
    promptInfluence: 0.60,
    prompt: "Deep calm muffled underwater reef ambience for two seconds smoothly surfacing into warm coastal boiling cauldron simmer and gentle crackling driftwood smoke fire on beach, documentary foley transition, no music",
  },
  {
    name: "sfx_10_metal_axe_wood_carving.mp3",
    durationSeconds: 6.5,
    promptInfluence: 0.60,
    prompt: "Clear resonant metallic iron axe head exchanged in hand followed by rhythmic crisp wooden adze carving into a solid timber dugout canoe by a peaceful tropical bay, warm human craftsmanship foley, no music",
  },
];

function prepareBeat(beat, lineIdx) {
  const displayTokens = [];
  const ttsChunks = [];
  const swaps = beat.ttsSwap ?? {};

  const parts = beat.text.split(/(?<!\[)(\[[^\[\]]+\])(?!\])/g);
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
      let spoken = disp;
      for (const [k, v] of Object.entries(swaps)) {
        if (spoken.includes(k)) spoken = spoken.replaceAll(k, v);
      }
      displayTokens.push({ w: disp, spoken, cue, line: lineIdx });
      ttsChunks.push(spoken);
    }
  }
  return {
    displayTokens,
    ttsText: ttsChunks.join(" ").replace(/\s{2,}/g, " ").trim(),
    ttsPlainNoTags: displayTokens.map((x) => x.spoken).join(" ").replace(/\s{2,}/g, " ").trim(),
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
    const target = normWord(dt.spoken || dt.w);
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
      const endsPunct = /[,.\?!:…]$/.test(w.w);
      const remaining = lineWords.length - 1 - i;
      const shouldBreak =
        (endsPunct && cur.length >= 3 && remaining >= 2) ||
        (cur.length >= 8 && remaining >= 2) ||
        (textLen >= 42 && cur.length >= 4 && remaining >= 2);
      if (shouldBreak) {
        chunks.push(cur);
        cur = [];
      }
    }
    if (cur.length) chunks.push(cur);

    for (const chunk of chunks) {
      const fullStr = chunk.map((x) => x.w).join(" ");
      let lines;
      if (fullStr.length <= 28 || chunk.length <= 3) {
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
      const endFrame = Math.round(chunk[chunk.length - 1].end * FPS) + 8;
      cards.push({
        act: chunk[0].act,
        shot: chunk[0].shot,
        startFrame,
        endFrame,
        text: lines.join("\n"),
      });
    }
  }

  for (let i = 0; i < cards.length - 1; i++) {
    if (cards[i].endFrame >= cards[i + 1].startFrame) {
      cards[i].endFrame = Math.max(cards[i].startFrame + 2, cards[i + 1].startFrame - 2);
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
  const outStoryTs = join(ROOT, "remotion/videos/nusantara-samudra/story.ts");
  const tmpBase = join(PROJECT, ".tmp");

  mkdirSync(voCacheDir, { recursive: true });
  mkdirSync(sfxDir, { recursive: true });
  mkdirSync(dirname(outStoryTs), { recursive: true });
  mkdirSync(tmpBase, { recursive: true });

  const prepared = BEATS.map((b, idx) => ({ ...b, idx, ...prepareBeat(b, idx) }));
  const tmpDir = mkdtempSync(join(tmpBase, "vo-build-"));

  try {
    console.log(`=== [1/2] Synthesizing ElevenLabs v4 Narrator VO (Brian, Tempo ${TEMPO}x, 16 Shots) ===`);
    const concatParts = [];
    const leadSil = join(tmpDir, "sil_lead.wav");
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "lavfi", "-i", `anullsrc=r=${SR}:cl=mono`, "-t", String(OPEN_LEAD_SILENCE_S), "-sample_fmt", "s16", leadSil]);
    concatParts.push(leadSil);

    let cursorSec = OPEN_LEAD_SILENCE_S;
    const allWords = [];
    const shotWindows = {};

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
      };
      const cacheKey = createHash("sha1").update(JSON.stringify(cachePayload)).digest("hex").slice(0, 12);
      const mp3Path = join(voCacheDir, `shot_${String(beat.shot).padStart(2, "0")}_${cacheKey}.mp3`);
      const alignPath = join(voCacheDir, `shot_${String(beat.shot).padStart(2, "0")}_${cacheKey}.json`);

      let alignment;
      if (existsSync(mp3Path) && existsSync(alignPath)) {
        console.log(`  [${i + 1}/${prepared.length}] CACHED SH${String(beat.shot).padStart(2, "0")}: ${beat.ttsPlainNoTags}`);
        alignment = JSON.parse(readFileSync(alignPath, "utf8"));
      } else {
        console.log(`  [${i + 1}/${prepared.length}] SYNTH  SH${String(beat.shot).padStart(2, "0")}: ${beat.ttsText}`);
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
      const srcSpan = Math.max(0.12, Math.min(clipDur - trimLead, Number((lastEnd - trimLead + 0.12).toFixed(3))));
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
        "-af", `afade=t=out:st=${Math.max(0, actualDur - 0.015).toFixed(3)}:d=0.015`,
        "-sample_fmt", "s16", fadeWav,
      ]);

      const beatStartSec = beat.shot === 1 ? 0 : cursorSec - 0.25;
      for (const tok of aligned) {
        const sRel = Math.max(0, (tok.start - trimLead) / TEMPO);
        const eRel = Math.max(sRel + 0.02, (tok.end - trimLead) / TEMPO);
        allWords.push({
          w: tok.w,
          cue: tok.cue,
          act: beat.act,
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

      shotWindows[`sh${String(beat.shot).padStart(2, "0")}`] = {
        startSec: Number(Math.max(0, beatStartSec).toFixed(3)),
        endSec: Number(cursorSec.toFixed(3)),
      };
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
    shotWindows.sh16.endSec = totalVideoSec;

    const cueMapSec = {};
    const cueMapFrame = {};
    for (const w of allWords) {
      if (w.cue) {
        cueMapSec[w.cue] = w.start;
        cueMapFrame[w.cue] = Math.round(w.start * FPS);
      }
    }

    // Build contiguous 16-shot frame boundaries (zero gaps, exact sync to narration!)
    const shotsFrame = {};
    for (let s = 1; s <= 16; s++) {
      const key = `sh${String(s).padStart(2, "0")}`;
      const nextKey = s < 16 ? `sh${String(s + 1).padStart(2, "0")}` : null;
      const startF = s === 1 ? 0 : Math.round(shotWindows[key].startSec * FPS);
      const endF = nextKey ? Math.round(shotWindows[nextKey].startSec * FPS) : totalFrames;
      shotsFrame[key] = { start: startF, end: endF };
    }

    console.log(`\n=== 16-SHOT TIMING BREAKDOWN (Total ${totalVideoSec.toFixed(2)}s / ${totalFrames}f) ===`);
    for (let s = 1; s <= 16; s++) {
      const key = `sh${String(s).padStart(2, "0")}`;
      const { start, end } = shotsFrame[key];
      console.log(`  ${key.toUpperCase()}: f=${String(start).padStart(4)}..${String(end - 1).padStart(4)} (${(start / FPS).toFixed(2)}s -> ${(end / FPS).toFixed(2)}s | dur=${((end - start) / FPS).toFixed(2)}s)`);
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

    const storyTs = `// AUTO-GENERATED by nusantara-samudra/scripts/build_vo_and_sfx.mjs from ElevenLabs eleven_v4 timestamps.
export interface SubtitleCardSpec {
  act: number;
  shot: number;
  startFrame: number;
  endFrame: number;
  text: string;
}

export const NUSANTARA_FPS = ${FPS};
export const NUSANTARA_FRAMES = ${totalFrames};
export const NUSANTARA_DURATION_SEC = ${totalVideoSec};

export const SHOTS = ${JSON.stringify(shotsFrame, null, 2)} as const;

export const CUES = ${JSON.stringify(cueMapFrame, null, 2)} as const;

export const CUES_SEC = ${JSON.stringify(cueMapSec, null, 2)} as const;

export const SUBTITLE_CARDS: SubtitleCardSpec[] = ${JSON.stringify(subtitleCards, null, 2)};
`;
    writeFileSync(outStoryTs, storyTs, "utf8");

    console.log("\n=== [2/2] Generating 10 Bespoke Maritime & Historical SFX via ElevenLabs eleven_text_to_sound_v3 ===");
    for (let i = 0; i < BESPOKE_SFX.length; i++) {
      const sfx = BESPOKE_SFX[i];
      const outPath = join(sfxDir, sfx.name);
      if (existsSync(outPath)) {
        console.log(`  [${i + 1}/${BESPOKE_SFX.length}] CACHED ${sfx.name}`);
        continue;
      }
      console.log(`  [${i + 1}/${BESPOKE_SFX.length}] SYNTH  ${sfx.name} (${sfx.durationSeconds}s)...`);
      await withRetry(sfx.name, async () => {
        if (existsSync(outPath)) rmSync(outPath, { force: true });
        const stream = await client.textToSoundEffects.convert({
          text: sfx.prompt,
          modelId: SFX_MODEL,
          durationSeconds: sfx.durationSeconds,
          promptInfluence: sfx.promptInfluence,
          loop: false,
        });
        const ws = createWriteStream(outPath);
        await finished(Readable.fromWeb(stream).pipe(ws));
      });
      console.log(`           -> saved (${getDurationSec(outPath).toFixed(2)}s)`);
    }

    console.log("\nALL VO & MARITIME SFX GENERATION COMPLETE!");
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
