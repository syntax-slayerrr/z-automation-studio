/**
 * Audio-First VO & Bespoke SFX Generator for:
 * VIDEO 4 — "SATU DETIK BERHENTI, KILOMETER TERKUNCI: KEMACETAN DI JEMBATAN KEMBAR GOWA"
 * Anggota: Mina, Ice, Raina, Salsa, Haerul, Fadel, Shifa (Karakter Utama: Dzaki)
 *
 * - Style: Skill #1 `3d-cutaway-explainer` Pro (Studio Engineering Diorama & Traffic Physics Cutaway)
 * - Narrator: Chris (`iP95p4xoKVk53GoZ742B`) — Crisp, Engaging Analytical Explainer (100% distinct from Brian/Liam/Sarah!)
 *   via ElevenLabs `eleven_v4` (`languageCode: "id"`, NO `[clear]` tags!)
 * - 4.00s Opening Aerial Intro with all 7 member names
 * - Target Total Duration: ~04:00 (240 seconds / ~7200 frames @ 30 fps)
 * - Exports exact word-level timestamps, 26 storyboard [[cue]] anchors, 7 scene bounds,
 *   and progressive subtitle chunks to `remotion/videos/jembatan-kembar-gowa/story.ts`
 * - Generates 10 bespoke tactile traffic/river/engineering SFX via `eleven_text_to_sound_v3`
 *
 * Run:
 *   node --env-file=.env jembatan-kembar-gowa/scripts/build_vo_and_sfx.mjs
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
const TEMPO = 1.47; // Crisp @gimanabisaid analytical explainer pacing (~182 WPM) targeting exact 04:00 (240s)

const NARRATOR = {
  id: "iP95p4xoKVk53GoZ742B", // Chris — Engaging, Crisp Analytical Male Explainer (100% distinct from Brian, Liam & Sarah)
  label: "Chris (Crisp Analytical Explainer)",
  stability: 0.48,
  similarityBoost: 0.78,
};

const INTRO_DURATION_S = 3.6;

const SCENE_TARGETS = {
  1: { name: "Hook & Kronologi: Jembatan Kembar Gowa", targetSec: 44.0, leadSec: 0.20 },
  2: { name: "Penyebab 1 & 2: Rubbernecking & Bottleneck", targetSec: 34.0, leadSec: 0.20 },
  3: { name: "Penyebab 3 & 4: Shockwave Sugiyama & Volume Gowa", targetSec: 37.0, leadSec: 0.20 },
  4: { name: "Dampak Kemacetan: Ambulans, Ekonomi, Polusi & Stres", targetSec: 43.0, leadSec: 0.20 },
  5: { name: "Solusi 1 & 2: Pengamanan Jembatan & Contraflow Cepat", targetSec: 29.0, leadSec: 0.20 },
  6: { name: "Solusi 3 & 4: Disiplin Pengendara & Transportasi Publik", targetSec: 28.0, leadSec: 0.20 },
  7: { name: "Penutup & Seamless Loop Arus Lancar", targetSec: 20.0, leadSec: 0.20 },
};

// ~580 kata — Naskah Brutal-Storyteller lengkap 4 pilar (Kejadian, Penyebab, Dampak, Solusi) + karakter Dzaki, ZERO `[clear]`!
const BEATS = [
  // =========================================================================
  // SCENE 01 — HOOK & KRONOLOGI KEJADIAN DI JEMBATAN KEMBAR GOWA (00:04–00:44)
  // =========================================================================
  {
    scene: 1,
    minPause: 0.25,
    maxPause: 0.75,
    pauseWeight: 0.9,
    text: "[curious] [[s1_bridge_intro]]Dua bentang jembatan, empat menara merah menyala, berdiri tepat di atas Sungai Jeneberang. Inilah Jembatan Kembar Gowa — nadi utama yang setiap hari menghubungkan Sungguminasa, Pallangga, hingga jalur poros Makassar dan Takalar.",
  },
  {
    scene: 1,
    minPause: 0.25,
    maxPause: 0.75,
    pauseWeight: 0.9,
    text: "[steady] [[s1_dzaki_ride]]Setiap pagi, ribuan pengendara seperti Dzaki melintasi pagar kuning-oranye jembatan ini untuk berangkat sekolah, bekerja, atau mengantar barang. Biasanya arus memang padat, tapi masih terus mengalir.",
  },
  {
    scene: 1,
    minPause: 0.30,
    maxPause: 0.85,
    pauseWeight: 1.0,
    text: "[serious] [[s1_incident]]Sampai suatu hari, seluruh jalur di atas Jembatan Kembar Gowa mendadak berhenti total dan mengular berkilo-kilometer. Bagaimana kejadiannya? Semua bermula dari satu insiden darurat di tepi pagar jembatan: seorang warga dilaporkan melompat ke arus Sungai Jeneberang.",
  },
  {
    scene: 1,
    minPause: 0.35,
    maxPause: 0.95,
    pauseWeight: 1.15,
    text: "[urgent] [[s1_sar_boat]]Dalam hitungan detik, pengendara di belakang langsung mengerem mendadak. Sebagian berhenti di tepi pagar untuk melihat ke bawah sungai, sementara polisi Satlantas mengamankan lokasi dan Tim SAR segera menyisir air menggunakan perahu karet.",
  },
  {
    scene: 1,
    minPause: 0.40,
    maxPause: 1.05,
    pauseWeight: 1.2,
    text: "[reflective] [[s1_jam_wide]]Pertanyaannya sederhana: bagaimana mungkin satu kejadian di satu sudut sempit jembatan bisa mengunci ribuan kendaraan hingga berkilo-kilometer ke belakang?",
  },

  // =========================================================================
  // SCENE 02 — PENYEBAB 1 & 2: RUBBERNECKING & BOTTLENECK (00:44–01:20)
  // =========================================================================
  {
    scene: 2,
    minPause: 0.25,
    maxPause: 0.70,
    pauseWeight: 0.85,
    text: "[steady] [[s2_causes_open]]Jawabannya bukan cuma insidennya — melainkan empat penyebab lalu lintas yang saling mengunci satu sama lain.",
  },
  {
    scene: 2,
    minPause: 0.30,
    maxPause: 0.85,
    pauseWeight: 1.0,
    text: "[serious] [[s2_rubberneck]]Penyebab pertama: efek menonton, atau dalam ilmu transportasi disebut rubbernecking|raberneking. Ketika banyak pengendara sengaja melambat, menoleh ke arah sungai, bahkan memarkir sepeda motor di badan jembatan demi menyaksikan proses evakuasi atau merekam video, jalur aktif langsung terpotong.",
  },
  {
    scene: 2,
    minPause: 0.30,
    maxPause: 0.90,
    pauseWeight: 1.1,
    text: "[steady] [[s2_bottleneck]]Kebiasaan itu langsung memicu penyebab kedua: efek leher botol atau bottleneck|botelnek. Perhatikan potongan penampang jembatan ini — Jembatan Kembar Gowa tidak memiliki bahu jalan lebar untuk menampung kendaraan berhenti.",
  },
  {
    scene: 2,
    minPause: 0.35,
    maxPause: 0.95,
    pauseWeight: 1.15,
    text: "[urgent] [[s2_speed_drop]]Begitu dua lajur penuh menyusut menjadi satu celah sempit, kapasitas jalan jatuh drastis. Kecepatan kendaraan yang tadinya lima puluh kilometer per jam langsung merosot hingga nyaris nol kilometer per jam.",
  },

  // =========================================================================
  // SCENE 03 — PENYEBAB 3 & 4: SHOCKWAVE SUGIYAMA & VOLUME POROS GOWA (01:20–01:58)
  // =========================================================================
  {
    scene: 3,
    minPause: 0.30,
    maxPause: 0.85,
    pauseWeight: 1.0,
    text: "[curious] [[s3_shockwave_intro]]Lalu muncul penyebab ketiga yang bekerja seperti fisika gelombang: gelombang kejut kemacetan, atau traffic|trefik shockwave|syokweif.",
  },
  {
    scene: 3,
    minPause: 0.35,
    maxPause: 0.95,
    pauseWeight: 1.1,
    text: "[steady] [[s3_sugiyama]]Fisikawan Jepang, Profesor Yuki Sugiyama, membuktikan hal ini lewat eksperimen lintasan melingkar. Saat kepadatan jalan sudah tinggi, satu saja kendaraan yang mengerem mendadak akan memaksa kendaraan di belakangnya mengerem lebih keras lagi.",
  },
  {
    scene: 3,
    minPause: 0.35,
    maxPause: 0.95,
    pauseWeight: 1.15,
    text: "[serious] [[s3_domino_wave]]Gelombang lampu rem merah itu merambat mundur melawan arah laju kendaraan seperti domino. Akibatnya, pengendara dua kilometer di belakang ikut terkunci diam, bahkan ketika mereka sama sekali tidak tahu apa yang terjadi di atas jembatan.",
  },
  {
    scene: 3,
    minPause: 0.40,
    maxPause: 1.05,
    pauseWeight: 1.2,
    text: "[steady] [[s3_structural]]Dan semuanya diperparah penyebab keempat: faktor struktural. Volume kendaraan harian di poros Sungguminasa hingga Pallangga sudah sangat tinggi, sementara pilihan jembatan penyeberangan alternatif melintasi Sungai Jeneberang masih terbatas. Seluruh arus menumpuk di satu titik kritis.",
  },

  // =========================================================================
  // SCENE 04 — DAMPAK KEMACETAN: AMBULANS, EKONOMI, POLUSI & STRES (01:58–02:40)
  // =========================================================================
  {
    scene: 4,
    minPause: 0.25,
    maxPause: 0.75,
    pauseWeight: 0.9,
    text: "[serious] [[s4_impact_open]]Ketika nadi utama seperti Jembatan Kembar Gowa lumpuh, dampaknya langsung menghantam empat sisi kehidupan warga sekaligus.",
  },
  {
    scene: 4,
    minPause: 0.35,
    maxPause: 0.95,
    pauseWeight: 1.1,
    text: "[urgent] [[s4_ambulance]]Dampak pertama yang paling fatal adalah terhambatnya layanan darurat. Ambulans, tim medis, dan kendaraan penyelamat bisa ikut terjebak rapat di antara truk dan motor, sehingga menit-menit emas penyelamatan nyawa ikut terbuang.",
  },
  {
    scene: 4,
    minPause: 0.35,
    maxPause: 0.95,
    pauseWeight: 1.1,
    text: "[serious] [[s4_economy]]Dampak kedua: kerugian waktu dan ekonomi. Ribuan pekerja terlambat masuk kantor, pelajar tertahan menuju sekolah, distribusi logistik antar-daerah tersendat, dan jutaan rupiah bahan bakar terbakar percuma hanya karena mesin terus menyala di tempat.",
  },
  {
    scene: 4,
    minPause: 0.30,
    maxPause: 0.90,
    pauseWeight: 1.05,
    text: "[serious] [[s4_pollution]]Dampak ketiga: lonjakan polusi udara dan suara. Ratusan knalpot yang diam di ruang jembatan melepaskan gas karbon dioksida dan partikel halus pekat yang langsung dihirup pengendara motor seperti Dzaki.",
  },
  {
    scene: 4,
    minPause: 0.40,
    maxPause: 1.05,
    pauseWeight: 1.2,
    text: "[reflective] [[s4_stress]]Serta dampak keempat: stres psikologis dan kecelakaan susulan. Panas matahari, udara pengap, dan bunyi klakson bersahutan membuat emosi memuncak, memicu aksi saling serobot lajur yang rawan tabrakan beruntun.",
  },

  // =========================================================================
  // SCENE 05 — SOLUSI 1 & 2: PENGAMANAN JEMBATAN & MANAJEMEN DARURAT (02:40–03:12)
  // =========================================================================
  {
    scene: 5,
    minPause: 0.25,
    maxPause: 0.75,
    pauseWeight: 0.9,
    text: "[confident] [[s5_solution_open]]Kabar baiknya, masalah ini sangat bisa diurai jika empat solusi nyata dijalankan secara serentak.",
  },
  {
    scene: 5,
    minPause: 0.35,
    maxPause: 0.95,
    pauseWeight: 1.1,
    text: "[steady] [[s5_sol1_rail]]Solusi pertama: pengamanan fisik dan pencegahan krisis langsung di jembatan. Meninggikan pagar pengaman agar tidak mudah dipanjat, memasang kamera CCTV dua puluh empat jam, menempatkan pos jaga respons cepat, serta memasang papan nomor layanan dukungan psikologis bagi warga yang sedang tertekan.",
  },
  {
    scene: 5,
    minPause: 0.35,
    maxPause: 0.95,
    pauseWeight: 1.15,
    text: "[confident] [[s5_sol2_contraflow]]Solusi kedua: manajemen lalu lintas darurat yang sigap. Begitu insiden terjadi, petugas segera membubarkan kerumunan penonton, membuka koridor prioritas khusus ambulans, dan menerapkan rekayasa contraflow|kontraflo sementara di bentang jembatan sebelahnya agar kendaraan tetap mengalir.",
  },

  // =========================================================================
  // SCENE 06 — SOLUSI 3 & 4: DISIPLIN PENGENDARA & TRANSPORTASI PUBLIK (03:12–03:42)
  // =========================================================================
  {
    scene: 6,
    minPause: 0.35,
    maxPause: 0.90,
    pauseWeight: 1.05,
    text: "[warm] [[s6_sol3_discipline]]Solusi ketiga datang dari diri kita sendiri sebagai pengendara: disiplin dan empati anti-menonton. Jangan pernah berhenti di badan jembatan, jangan merekam musibah sambil menutup jalan — cukup terus melaju tenang dan beri ruang penuh bagi tim penyelamat.",
  },
  {
    scene: 6,
    minPause: 0.35,
    maxPause: 0.95,
    pauseWeight: 1.15,
    text: "[confident] [[s6_sol4_transit]]Dan solusi keempat untuk jangka panjang: memperluas jalur alternatif penyeberangan Sungai Jeneberang sekaligus memperkuat angkutan umum terintegrasi seperti bus Trans Mamminasata.",
  },
  {
    scene: 6,
    minPause: 0.40,
    maxPause: 1.05,
    pauseWeight: 1.2,
    text: "[warm] [[s6_penalosa]]Seperti pesan pakar tata kota dunia, Enrique|Enrike Peñalosa|Penyalosa: kota yang maju bukanlah tempat semua orang terjebak di dalam mobil pribadi, melainkan tempat semua warga nyaman memilih transportasi publik yang lancar.",
  },

  // =========================================================================
  // SCENE 07 — PENUTUP & SEAMLESS LOOP ARUS LANCAR (03:42–04:00)
  // =========================================================================
  {
    scene: 7,
    minPause: 0.30,
    maxPause: 0.85,
    pauseWeight: 1.0,
    text: "[reflective] [[s7_dzaki_smooth]]Satu detik keputusan Dzaki dan setiap pengendara untuk tidak berhenti menonton bisa menyelamatkan menit berharga bagi ambulans dan ribuan orang di belakang kita.",
  },
  {
    scene: 7,
    minPause: 2.8,
    maxPause: 3.6,
    pauseWeight: 2.5,
    text: "[resonant] [[s7_loop_close]]Karena jembatan dibangun untuk menghubungkan kehidupan — bukan menguncinya. Dari dua bentang menara merah di atas Sungai Jeneberang ini, kelancaran lalu lintas selalu dimulai dari kesadaran kita bersama.",
  },
];

// 10 Bespoke Tactile Traffic, River & Engineering Foley SFX via ElevenLabs `eleven_text_to_sound_v3`
const BESPOKE_SFX = [
  {
    name: "sfx_river_morning_traffic.mp3",
    durationSeconds: 4.0,
    promptInfluence: 0.62,
    prompt:
      "Wide tropical river water flowing calmly beneath a busy concrete road bridge with steady morning scooters and cars passing smoothly across asphalt, clean outdoor documentary ambience, no music",
  },
  {
    name: "sfx_moto_skid_emergency.mp3",
    durationSeconds: 3.4,
    promptInfluence: 0.65,
    prompt:
      "Motorcycle and car tires braking sharply on concrete bridge asphalt followed by sudden startled commuter murmurs and hazard blinker ticking, realistic traffic foley, no music",
  },
  {
    name: "sfx_sar_boat_river_siren.mp3",
    durationSeconds: 4.2,
    promptInfluence: 0.62,
    prompt:
      "Inflatable rescue outboard boat engine humming steadily across wide river water with distant brief police patrol siren echoing softly near a bridge, realistic documentary foley, no music",
  },
  {
    name: "sfx_traffic_horns_buildup.mp3",
    durationSeconds: 4.0,
    promptInfluence: 0.62,
    prompt:
      "Indonesian urban bridge traffic jam building up with scattered scooter beeps, car horns, and low rumbling idling engines on concrete road, realistic outdoor foley, no music",
  },
  {
    name: "sfx_bottleneck_whoosh.mp3",
    durationSeconds: 2.6,
    promptInfluence: 0.60,
    prompt:
      "Clean tactile modern engineering diagram whoosh transition paired with crisp mechanical gauge click slowing down to a stop, minimalist documentary sound design, no music",
  },
  {
    name: "sfx_shockwave_brake_clicks.mp3",
    durationSeconds: 4.0,
    promptInfluence: 0.62,
    prompt:
      "Rhythmic cascading domino sequence of sharp mechanical brake clicks and pulsing low bass wave rippling backward across a physics model track, crisp sound design, no music",
  },
  {
    name: "sfx_ambulance_trapped_siren.mp3",
    durationSeconds: 4.2,
    promptInfluence: 0.64,
    prompt:
      "Urgent emergency ambulance two-tone siren stationary and echoed between dense stopped cars and trucks in heavy bridge traffic jam, realistic documentary foley, no music",
  },
  {
    name: "sfx_idling_engine_stopwatch.mp3",
    durationSeconds: 3.8,
    promptInfluence: 0.62,
    prompt:
      "Heavy truck diesel engine idling continuously paired with crisp fast mechanical stopwatch ticking and subtle exhaust hiss, tactile documentary foley, no music",
  },
  {
    name: "sfx_bridge_upgrade_whistle.mp3",
    durationSeconds: 3.8,
    promptInfluence: 0.62,
    prompt:
      "Crisp solid metallic safety railing locking cleanly into place followed by a sharp traffic police officer whistle guiding smooth flowing vehicles forward, realistic foley, no music",
  },
  {
    name: "sfx_smooth_bus_morning_flow.mp3",
    durationSeconds: 4.2,
    promptInfluence: 0.62,
    prompt:
      "Modern city transit bus gliding smoothly over a clean bridge with gentle airy wind, calm river water below, and uplifting crystalline chime, crisp documentary foley, no music",
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
      const body = m[2];
      if (!body) continue;
      const pipeIdx = body.indexOf("|");
      const disp = pipeIdx >= 0 ? body.slice(0, pipeIdx) : body;
      const spoken = pipeIdx >= 0 ? body.slice(pipeIdx + 1) : body;
      displayTokens.push({ w: disp, spoken, cue, line: lineIdx });
      ttsChunks.push(spoken);
    }
  }
  return {
    displayTokens,
    ttsText: ttsChunks.join(" ").replace(/\s{2,}/g, " ").trim(),
    ttsPlainNoTags: displayTokens
      .map((x) => x.spoken)
      .join(" ")
      .replace(/\s{2,}/g, " ")
      .trim(),
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
        words.push({
          text: cur.map((x) => x.ch).join(""),
          start: cur[0].s,
          end: cur[cur.length - 1].e,
        });
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
        words.push({
          text: cur.map((x) => x.ch).join(""),
          start: cur[0].s,
          end: cur[cur.length - 1].e,
        });
        cur = [];
      }
    } else {
      cur.push({ ch, s, e });
    }
  }
  if (cur.length) {
    words.push({
      text: cur.map((x) => x.ch).join(""),
      start: cur[0].s,
      end: cur[cur.length - 1].e,
    });
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
    const target = normWord(dt.spoken);
    if (rIdx >= spokenRuns.length) {
      const last = spokenRuns[spokenRuns.length - 1];
      out.push({ ...dt, start: last.start, end: last.end });
      continue;
    }
    if (!target) {
      const prevEnd = out.length ? out[out.length - 1].end : spokenRuns[rIdx].start;
      out.push({ ...dt, start: prevEnd, end: prevEnd + 0.04 });
      if (rIdx < spokenRuns.length && !normWord(spokenRuns[rIdx].text)) rIdx++;
      continue;
    }
    while (rIdx < spokenRuns.length && !normWord(spokenRuns[rIdx].text)) {
      rIdx++;
    }
    if (rIdx >= spokenRuns.length) {
      const last = spokenRuns[spokenRuns.length - 1];
      out.push({ ...dt, start: last.start, end: last.end });
      continue;
    }
    const startRun = spokenRuns[rIdx];
    let endRun = startRun;
    let acc = normWord(startRun.text);
    rIdx++;
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

function makeSilenceWav(durSec, outPath) {
  execFileSync("ffmpeg", [
    "-y",
    "-loglevel",
    "error",
    "-f",
    "lavfi",
    "-i",
    `anullsrc=r=${SR}:cl=mono`,
    "-t",
    Math.max(0.02, durSec).toFixed(3),
    "-sample_fmt",
    "s16",
    outPath,
  ]);
}

function renderCleanNarratorWav(mp3Path, wavPath) {
  // Crisp analytical male narrator EQ: HPF 80Hz, warm presence +1.3dB @ 180Hz, crisp intelligibility +2.0dB @ 3.1kHz, gentle de-ess -1.8dB @ 7kHz
  const eq =
    "highpass=f=80,equalizer=f=180:t=q:w=1.1:g=1.3,equalizer=f=3100:t=q:w=1.3:g=2.0,equalizer=f=7000:t=q:w=1.4:g=-1.8";
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
      eq,
      "-sample_fmt",
      "s16",
      wavPath,
    ],
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
      if (w.w === "—") continue;
      cur.push(w);
      const textLen = cur.map((x) => x.w).join(" ").length;
      const endsPunct = /[,.\?!:…]$/.test(w.w);
      const remaining = lineWords.length - 1 - i;
      const shouldBreak =
        (endsPunct && cur.length >= 2 && remaining >= 1) ||
        (cur.length >= 5 && remaining >= 2) ||
        (textLen >= 27 && cur.length >= 3 && remaining >= 1);
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

async function withRetry(label, fn, maxAttempts = 8) {
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fn();
      await new Promise((r) => setTimeout(r, 380));
      return res;
    } catch (err) {
      lastErr = err;
      const waitMs = Math.min(18000, 2000 * attempt);
      console.warn(
        `    [RETRY ${attempt}/${maxAttempts}] ${label} failed (${err?.cause?.code || err?.message}), waiting ${waitMs}ms...`
      );
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
  throw lastErr;
}

async function main() {
  const client = new ElevenLabsClient();
  const audioDir = join(PROJECT, "audio");
  const voCacheDir = join(audioDir, "vo_cache");
  const sfxDir = join(audioDir, "sfx");
  const outVoWav = join(audioDir, "vo_master.wav");
  const outAlignJson = join(audioDir, "alignment.json");
  const outStoryTs = join(ROOT, "remotion/videos/jembatan-kembar-gowa/story.ts");
  const tmpBase = join(PROJECT, ".tmp");

  mkdirSync(voCacheDir, { recursive: true });
  mkdirSync(sfxDir, { recursive: true });
  mkdirSync(dirname(outStoryTs), { recursive: true });
  mkdirSync(tmpBase, { recursive: true });

  const prepared = BEATS.map((b, idx) => ({ ...b, idx, ...prepareBeat(b.text, idx) }));
  const tmpDir = mkdtempSync(join(tmpBase, "vo-build-"));

  try {
    console.log(
      `=== [1/2] Synthesizing ElevenLabs ${TTS_MODEL} VO (${NARRATOR.label}, tempo=${TEMPO}x) ===`
    );

    const renderedBeats = [];
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
      const cacheKey = createHash("sha1")
        .update(JSON.stringify(cachePayload))
        .digest("hex")
        .slice(0, 12);
      const mp3Path = join(voCacheDir, `beat_${String(i).padStart(2, "0")}_${cacheKey}.mp3`);
      const alignPath = join(voCacheDir, `beat_${String(i).padStart(2, "0")}_${cacheKey}.json`);

      let alignment;
      if (existsSync(mp3Path) && existsSync(alignPath)) {
        console.log(`  [${i + 1}/${prepared.length}] CACHED Sc${beat.scene}: ${beat.ttsPlainNoTags}`);
        alignment = JSON.parse(readFileSync(alignPath, "utf8"));
      } else {
        console.log(`  [${i + 1}/${prepared.length}] SYNTH  Sc${beat.scene}: ${beat.ttsText}`);
        const res = await withRetry(`TTS beat ${i + 1}`, () =>
          client.textToSpeech.convertWithTimestamps(NARRATOR.id, {
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
          })
        );
        writeFileSync(mp3Path, Buffer.from(res.audioBase64, "base64"));
        alignment = res.alignment;
        writeFileSync(alignPath, JSON.stringify(alignment, null, 2));
      }

      const rawWav = join(tmpDir, `beat_${i}.wav`);
      renderCleanNarratorWav(mp3Path, rawWav);

      const spokenRuns = extractSpokenRuns(alignment);
      const aligned = alignDisplayToRuns(beat.displayTokens, spokenRuns);
      const clipDur = getDurationSec(rawWav);
      const trimLead = aligned.length ? Math.max(0, Number((aligned[0].start - 0.04).toFixed(3))) : 0;
      const lastEnd = aligned.length ? aligned[aligned.length - 1].end : clipDur;
      const srcSpan = Math.max(
        0.15,
        Math.min(clipDur - trimLead, Number((lastEnd - trimLead + 0.06).toFixed(3)))
      );
      const trimWav = join(tmpDir, `beat_${i}_trim.wav`);
      const afChain =
        TEMPO === 1.0 ? "afade=t=in:st=0:d=0.010" : `atempo=${TEMPO},afade=t=in:st=0:d=0.010`;
      execFileSync("ffmpeg", [
        "-y",
        "-loglevel",
        "error",
        "-ss",
        String(trimLead),
        "-i",
        rawWav,
        "-t",
        String(srcSpan),
        "-af",
        afChain,
        "-sample_fmt",
        "s16",
        trimWav,
      ]);
      const actualDur = getDurationSec(trimWav);
      const fadeWav = join(tmpDir, `beat_${i}_fade.wav`);
      execFileSync("ffmpeg", [
        "-y",
        "-loglevel",
        "error",
        "-i",
        trimWav,
        "-af",
        `afade=t=out:st=${Math.max(0, actualDur - 0.018).toFixed(3)}:d=0.018`,
        "-sample_fmt",
        "s16",
        fadeWav,
      ]);

      renderedBeats.push({ beat, aligned, trimLead, actualDur, fadeWav });
    }

    // Pass 2: Prepend 4.00s Group Intro, then assemble 7 scenes targeting ~240s (04:00)
    const concatParts = [];
    const introSilWav = join(tmpDir, "sil_intro_4s.wav");
    makeSilenceWav(INTRO_DURATION_S, introSilWav);
    concatParts.push(introSilWav);
    let cursorSec = INTRO_DURATION_S;
    const allWords = [];
    const sceneBoundsSec = {};

    for (let s = 1; s <= 7; s++) {
      const cfg = SCENE_TARGETS[s];
      const sBeats = renderedBeats.filter((rb) => rb.beat.scene === s);
      const speechSum = sBeats.reduce((acc, rb) => acc + rb.actualDur, 0);
      const weightSum = sBeats.reduce((acc, rb) => acc + rb.beat.pauseWeight, 0);
      const availPause = Math.max(0, cfg.targetSec - cfg.leadSec - speechSum);

      const startSec = cursorSec;
      const leadWav = join(tmpDir, `sil_lead_s${s}.wav`);
      makeSilenceWav(cfg.leadSec, leadWav);
      concatParts.push(leadWav);
      cursorSec += cfg.leadSec;

      for (let k = 0; k < sBeats.length; k++) {
        const rb = sBeats[k];
        for (const tok of rb.aligned) {
          const sRel = Math.max(0, (tok.start - rb.trimLead) / TEMPO);
          const eRel = Math.max(sRel + 0.02, (tok.end - rb.trimLead) / TEMPO);
          allWords.push({
            w: tok.w,
            cue: tok.cue,
            scene: s,
            line: tok.line,
            start: Number((cursorSec + sRel).toFixed(3)),
            end: Number((cursorSec + eRel).toFixed(3)),
          });
        }

        concatParts.push(rb.fadeWav);
        cursorSec += rb.actualDur;

        const rawPause = (availPause * rb.beat.pauseWeight) / Math.max(0.01, weightSum);
        const pauseSec = Math.max(rb.beat.minPause * 0.55, Math.min(rb.beat.maxPause, rawPause));
        const silWav = join(tmpDir, `sil_s${s}_${k}.wav`);
        makeSilenceWav(pauseSec, silWav);
        concatParts.push(silWav);
        cursorSec += pauseSec;
      }

      sceneBoundsSec[s] = {
        name: cfg.name,
        startSec: Number(startSec.toFixed(3)),
        endSec: Number(cursorSec.toFixed(3)),
        durSec: Number((cursorSec - startSec).toFixed(3)),
      };
    }

    const concatList = join(tmpDir, "concat.txt");
    writeFileSync(
      concatList,
      concatParts.map((p) => `file '${p.replace(/\\/g, "/")}'`).join("\n"),
      "utf8"
    );
    execFileSync("ffmpeg", [
      "-y",
      "-loglevel",
      "error",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      concatList,
      "-af",
      "loudnorm=I=-16:TP=-2.0:LRA=6:linear=true",
      "-ar",
      String(SR),
      "-ac",
      "1",
      "-sample_fmt",
      "s16",
      outVoWav,
    ]);

    const voDur = getDurationSec(outVoWav);
    const totalVideoSec = Number(voDur.toFixed(3));
    const totalFrames = Math.ceil(totalVideoSec * FPS);

    const cueMapSec = {};
    const cueMapFrame = {};
    for (const w of allWords) {
      if (w.cue) {
        cueMapSec[w.cue] = w.start;
        cueMapFrame[w.cue] = Math.round(w.start * FPS);
      }
    }
    cueMapSec.intro_start = 0.0;
    cueMapFrame.intro_start = 0;
    const lastWordEnd = allWords[allWords.length - 1]?.end ?? totalVideoSec - 3.0;
    cueMapSec.s7_endcard = Number((lastWordEnd + 0.25).toFixed(3));
    cueMapFrame.s7_endcard = Math.round(cueMapSec.s7_endcard * FPS);

    const scenesFrame = {
      intro: 0,
      s1: Math.round(sceneBoundsSec[1].startSec * FPS),
      s2: Math.round(sceneBoundsSec[2].startSec * FPS),
      s3: Math.round(sceneBoundsSec[3].startSec * FPS),
      s4: Math.round(sceneBoundsSec[4].startSec * FPS),
      s5: Math.round(sceneBoundsSec[5].startSec * FPS),
      s6: Math.round(sceneBoundsSec[6].startSec * FPS),
      s7: Math.round(sceneBoundsSec[7].startSec * FPS),
      totalFrames,
    };

    console.log("\n=== 7-SCENE GOWA TRAFFIC TIMING BREAKDOWN (TARGET ~04:00 / 240s) ===");
    for (let s = 1; s <= 7; s++) {
      const b = sceneBoundsSec[s];
      console.log(
        `  Scene 0${s} [${b.name}]: ${b.startSec.toFixed(2)}s -> ${b.endSec.toFixed(2)}s (dur=${b.durSec.toFixed(2)}s | f=${Math.round(b.startSec * FPS)}..${Math.round(b.endSec * FPS) - 1})`
      );
    }

    const subtitleChunks = buildSubtitleChunks(allWords);
    const alignObj = {
      series: "KEMACETAN DI LALU LINTAS — JEMBATAN KEMBAR GOWA",
      episode: "SATU DETIK BERHENTI, KILOMETER TERKUNCI: KEMACETAN DI JEMBATAN KEMBAR GOWA",
      groupCredits: "Mina · Ice · Raina · Salsa · Haerul · Fadel · Shifa",
      protagonist: "Dzaki",
      voice: `${NARRATOR.label} · ElevenLabs ${TTS_MODEL}`,
      model: TTS_MODEL,
      tempo: TEMPO,
      voDurationSec: totalVideoSec,
      totalVideoSec,
      fps: FPS,
      totalFrames,
      sceneBoundsSec,
      scenesFrame,
      cuesSec: cueMapSec,
      cuesFrame: cueMapFrame,
      words: allWords,
    };
    writeFileSync(outAlignJson, JSON.stringify(alignObj, null, 2) + "\n", "utf8");

    const storyTs = `// AUTO-GENERATED by jembatan-kembar-gowa/scripts/build_vo_and_sfx.mjs
// Source: ElevenLabs ${TTS_MODEL} (${NARRATOR.label}) character timestamps (${allWords.length} words, ${Object.keys(cueMapFrame).length} cues)

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
  id: "JembatanKembarGowaShort",
  title: "Kemacetan Lalu Lintas di Jembatan Kembar Gowa",
  groupMembers: ["Mina", "Ice", "Raina", "Salsa", "Haerul", "Fadel", "Shifa"] as const,
  protagonist: "Dzaki",
  width: 1080,
  height: 1920,
  fps: ${FPS},
  durationInFrames: ${totalFrames},
  durationSec: ${totalVideoSec},
  audioMasterPath: "jembatan-kembar-gowa/audio_master.m4a",
} as const;

export const SCENES = ${JSON.stringify(scenesFrame, null, 2)} as const;

export const CUES = ${JSON.stringify(cueMapFrame, null, 2)} as const;

export const CUES_SEC = ${JSON.stringify(cueMapSec, null, 2)} as const;

export const SUBTITLE_CHUNKS: SubtitleChunk[] = ${JSON.stringify(subtitleChunks, null, 2)};
`;
    writeFileSync(outStoryTs, storyTs, "utf8");
    console.log(
      `\nVO COMPLETE -> ${outVoWav} (${totalVideoSec.toFixed(2)}s / ${totalFrames} frames | ${allWords.length} words | ${subtitleChunks.length} subtitle chunks)`
    );

    console.log("\n=== [2/2] Generating 10 Bespoke Traffic/River/Engineering SFX via eleven_text_to_sound_v3 ===");
    for (let i = 0; i < BESPOKE_SFX.length; i++) {
      const sfx = BESPOKE_SFX[i];
      const outPath = join(sfxDir, sfx.name);
      if (existsSync(outPath)) {
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
      const d = getDurationSec(outPath);
      console.log(`           -> saved (${d.toFixed(2)}s)`);
    }

    console.log("\n=== ALL JEMBATAN KEMBAR GOWA VO & BESPOKE SFX COMPLETE ===");
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
