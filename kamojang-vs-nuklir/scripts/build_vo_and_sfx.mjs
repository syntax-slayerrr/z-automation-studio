import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const ROOT = "d:/PROJECTS/z-automation-studio";
const PROJ = path.join(ROOT, "kamojang-vs-nuklir");
const AUDIO_DIR = path.join(PROJ, "audio");
const CACHE_DIR = path.join(AUDIO_DIR, "vo_cache");
const SFX_DIR = path.join(AUDIO_DIR, "sfx");
const STORY_OUT = path.join(ROOT, "remotion/videos/kamojang-vs-nuklir/story.ts");

fs.mkdirSync(CACHE_DIR, { recursive: true });
fs.mkdirSync(SFX_DIR, { recursive: true });
fs.mkdirSync(path.dirname(STORY_OUT), { recursive: true });

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error("Missing ELEVENLABS_API_KEY in .env!");
  process.exit(1);
}

const VOICE_ID = "nPczCjzI2devNBz1zQrb"; // Brian — authoritative investigative documentary narrator
const MODEL_ID = "eleven_v4";
const FPS = 30;
const TEMPO = 1.34; // Zack D. Films crisp investigative cadence -> lands cleanly on ~162s (±160s target!)
const PRE_ROLL_SEC = 0.14; // Prevents clipped initial Indonesian syllables

// 100% VERBATIM 8-SCENE NARRATION (26 beats) with Indonesian-native phonetic tts overrides ONLY where needed
const BEATS = [
  // ═══ ACT I — SCENE 01: DUA DUNIA, SATU TURBIN ═══
  {
    scene: 1,
    cue: "s1_kamojang",
    display: "Di Garut, panas dari dalam bumi diubah menjadi listrik.",
    tts: "[investigative] Di Garut, panas dari dalam bumi diubah menjadi listrik.",
    pauseAfter: 0.28,
  },
  {
    scene: 1,
    cue: "s1_nuclear",
    display: "Di pembangkit nuklir, atom uranium dipecah untuk menghasilkan panas.",
    tts: "[curious] Di pembangkit nuklir, atom uranium dipecah untuk menghasilkan panas.",
    pauseAfter: 0.28,
  },
  {
    scene: 1,
    cue: "s1_reveal",
    display: "Dua teknologi yang kelihatannya tidak ada hubungannya. Tapi anehnya, keduanya melakukan hal yang sama: menghasilkan uap untuk memutar turbin.",
    tts: "[sharp] Dua teknologi yang kelihatannya tidak ada hubungannya. Tapi anehnya, keduanya melakukan hal yang sama: menghasilkan uap untuk memutar turbin.",
    pauseAfter: 0.72,
  },

  // ═══ ACT II — SCENE 02: APA YANG TERSEMBUNYI DI BAWAH KAMOJANG? ═══
  {
    scene: 2,
    cue: "s2_descent",
    display: "Untuk memahami teknologi ini, kita mulai dari Kamojang.",
    tts: "[steady] Untuk memahami teknologi ini, kita mulai dari Kamojang.",
    pauseAfter: 0.30,
  },
  {
    scene: 2,
    cue: "s2_reservoir",
    display: "Di bawah kawasan pegunungannya, terdapat reservoir panas bumi yang didominasi uap.",
    tts: "[thoughtful] Di bawah kawasan pegunungannya, terdapat reservoir panas bumi yang didominasi uap.",
    pauseAfter: 0.30,
  },
  {
    scene: 2,
    cue: "s2_well",
    display: "Bukan magma yang dipompa ke permukaan, melainkan fluida panas dari reservoir yang naik melalui sumur produksi. Dan inilah bahan bakar yang menggerakkan pembangkitnya.",
    tts: "[clear] Bukan magma yang dipompa ke permukaan, melainkan fluida panas dari reservoir yang naik melalui sumur produksi. Dan inilah bahan bakar yang menggerakkan pembangkitnya.",
    pauseAfter: 0.68,
  },

  // ═══ SCENE 03: MEMBEDAH MESIN KAMOJANG ═══
  {
    scene: 3,
    cue: "s3_pipe",
    display: "Tapi uap dari dalam bumi tidak bisa begitu saja dilemparkan ke turbin.",
    tts: "[sharp] Tapi uap dari dalam bumi tidak bisa begitu saja dilemparkan ke turbin.",
    pauseAfter: 0.28,
  },
  {
    scene: 3,
    cue: "s3_dry_steam",
    display: "Di Kamojang, sistem dry steam memanfaatkan uap reservoir secara langsung sebagai fluida kerja.",
    tts: "[steady] Di Kamojang, sistem drai stim memanfaatkan uap reservoir secara langsung sebagai fluida kerja.",
    pauseAfter: 0.30,
  },
  {
    scene: 3,
    cue: "s3_demister",
    display: "Sebelum masuk turbin, uap melewati peralatan pemisah dan pembersihan untuk mengurangi partikel serta tetesan air.",
    tts: "[analytical] Sebelum masuk turbin, uap melewati peralatan pemisah dan pembersihan untuk mengurangi partikel serta tetesan air.",
    pauseAfter: 0.30,
  },
  {
    scene: 3,
    cue: "s3_valve",
    display: "Setelah kondisinya sesuai, katup mengatur alirannya menuju turbin.",
    tts: "[energetic] Setelah kondisinya sesuai, katup mengatur alirannya menuju turbin.",
    pauseAfter: 0.68,
  },

  // ═══ ACT III — SCENE 04: SEKARANG, BONGKAR REAKTOR NUKLIR ═══
  {
    scene: 4,
    cue: "s4_containment",
    display: "Sekarang kita pindah ke pembangkit nuklir. Sumber panasnya bukan reservoir bumi, melainkan inti atom.",
    tts: "[investigative] Sekarang kita pindah ke pembangkit nuklir. Sumber panasnya bukan reservoir bumi, melainkan inti atom.",
    pauseAfter: 0.32,
  },
  {
    scene: 4,
    cue: "s4_fission",
    display: "Di dalam reaktor, inti uranium mengalami fisi setelah menangkap neutron. Proses ini melepaskan energi sekaligus neutron baru yang dapat memicu fisi berikutnya.",
    tts: "[focused] Di dalam reaktor, inti uranium mengalami fisi setelah menangkap neutron. Proses ini melepaskan energi sekaligus neutron baru yang dapat memicu fisi berikutnya.",
    pauseAfter: 0.30,
  },
  {
    scene: 4,
    cue: "s4_rods",
    display: "Reaksi berantai tersebut dikendalikan menggunakan sistem kendali reaktor.",
    tts: "[steady] Reaksi berantai tersebut dikendalikan menggunakan sistem kendali reaktor.",
    pauseAfter: 0.68,
  },

  // ═══ SCENE 05: DARI REAKTOR MENUJU UAP ═══
  {
    scene: 5,
    cue: "s5_primary",
    display: "Tapi ada satu hal penting. Pada reaktor tipe PWR, air yang bersirkulasi melewati inti reaktor tidak langsung masuk ke turbin.",
    tts: "[serious] Tapi ada satu hal penting. Pada reaktor tipe pe we er, air yang bersirkulasi melewati inti reaktor tidak langsung masuk ke turbin.",
    pauseAfter: 0.30,
  },
  {
    scene: 5,
    cue: "s5_sg",
    display: "Air primer bertekanan tinggi membawa panas menuju steam generator. Di sana, panas dipindahkan melalui tabung penukar panas ke air pada sirkuit sekunder.",
    tts: "[analytical] Air primer bertekanan tinggi membawa panas menuju stim generator. Di sana, panas dipindahkan melalui tabung penukar panas ke air pada sirkuit sekunder.",
    pauseAfter: 0.30,
  },
  {
    scene: 5,
    cue: "s5_circuits",
    display: "Air sekunder berubah menjadi uap, lalu menggerakkan turbin.",
    tts: "[clear] Air sekunder berubah menjadi uap, lalu menggerakkan turbin.",
    pauseAfter: 0.68,
  },

  // ═══ ACT IV — SCENE 06: INILAH BAGIAN YANG SAMA ═══
  {
    scene: 6,
    cue: "s6_matchcut",
    display: "Nah, sekarang kita sampai pada bagian yang sama. Uap dari kedua pembangkit masuk ke turbin dan mengubah energi termalnya menjadi energi mekanik.",
    tts: "[conversational] Nah, sekarang kita sampai pada bagian yang sama. Uap dari kedua pembangkit masuk ke turbin dan mengubah energi termalnya menjadi energi mekanik.",
    pauseAfter: 0.28,
  },
  {
    scene: 6,
    cue: "s6_generator",
    display: "Sudu-sudu turbin berputar, porosnya menggerakkan generator, dan medan magnet yang berputar menghasilkan arus listrik melalui induksi elektromagnetik.",
    tts: "[energetic] Sudu-sudu turbin berputar, porosnya menggerakkan generator, dan medan magnet yang berputar menghasilkan arus listrik melalui induksi elektromagnetik.",
    pauseAfter: 0.28,
  },
  {
    scene: 6,
    cue: "s6_grid",
    display: "Jadi, sumber panasnya berbeda. Tapi prinsip dasar konversi energinya bertemu di sini.",
    tts: "[resonant] Jadi, sumber panasnya berbeda. Tapi prinsip dasar konversi energinya bertemu di sini.",
    pauseAfter: 0.72,
  },

  // ═══ ACT V — SCENE 07: KALAU BEGITU, MANA YANG LEBIH AMAN? ═══
  {
    scene: 7,
    cue: "s7_geo_risk",
    display: "Tapi kesamaan turbin tidak berarti kesamaan risiko. Pada geotermal, kita berhadapan dengan sumur bertekanan tinggi, gas seperti hidrogen sulfida yang beracun, dan kemungkinan gempa terinduksi akibat perubahan tekanan fluida bawah tanah.",
    tts: "[serious] Tapi kesamaan turbin tidak berarti kesamaan risiko. Pada geotermal, kita berhadapan dengan sumur bertekanan tinggi, gas seperti hidrogen sulfida yang beracun, dan kemungkinan gempa terinduksi akibat perubahan tekanan fluida bawah tanah.",
    pauseAfter: 0.28,
  },
  {
    scene: 7,
    cue: "s7_geo_leak",
    display: "Kebocoran atau kegagalan sumur juga bisa membahayakan pekerja dan lingkungan.",
    tts: "[steady] Kebocoran atau kegagalan sumur juga bisa membahayakan pekerja dan lingkungan.",
    pauseAfter: 0.36,
  },
  {
    scene: 7,
    cue: "s7_nuc_barriers",
    display: "Pada nuklir, tantangannya berbeda. Reaktor harus menjaga reaksi berantai tetap terkendali, bahan bakar tetap terdinginkan, dan material radioaktif tetap terkurung.",
    tts: "[serious] Pada nuklir, tantangannya berbeda. Reaktor harus menjaga reaksi berantai tetap terkendali, bahan bakar tetap terdinginkan, dan material radioaktif tetap terkurung.",
    pauseAfter: 0.28,
  },
  {
    scene: 7,
    cue: "s7_compare",
    display: "Kegagalan berlapis pada sistem keselamatan dapat berujung pada kecelakaan dengan konsekuensi radiologis yang luas.",
    tts: "[measured] Kegagalan berlapis pada sistem keselamatan dapat berujung pada kecelakaan dengan konsekuensi radiologis yang luas.",
    pauseAfter: 0.72,
  },

  // ═══ SCENE 08: PUTUSAN: GEOTERMAL LEBIH AMAN? ═══
  {
    scene: 8,
    cue: "s8_verdict",
    display: "Jadi, apakah geotermal lebih aman? Untuk risiko radiologis dan potensi kecelakaan reaktor berskala besar, ya, geotermal memiliki keunggulan karena tidak memiliki reaksi fisi maupun inventori bahan bakar radioaktif tingkat tinggi seperti PLTN.",
    tts: "[investigative] Jadi, apakah geotermal lebih aman? Untuk risiko radiologis dan potensi kecelakaan reaktor berskala besar, ya, geotermal memiliki keunggulan karena tidak memiliki reaksi fisi maupun inventori bahan bakar radioaktif tingkat tinggi seperti pe el te en.",
    pauseAfter: 0.32,
  },
  {
    scene: 8,
    cue: "s8_caveat",
    display: "Tetapi bukan berarti panas bumi bebas bahaya. Gas beracun, tekanan tinggi, gempa terinduksi, dan pengelolaan reservoir tetap membutuhkan pengawasan serius.",
    tts: "[balanced] Tetapi bukan berarti panas bumi bebas bahaya. Gas beracun, tekanan tinggi, gempa terinduksi, dan pengelolaan reservoir tetap membutuhkan pengawasan serius.",
    pauseAfter: 0.42,
  },
  {
    scene: 8,
    cue: "s8_closing",
    display: "Pada akhirnya, keduanya menunjukkan satu hal: manusia tidak harus membakar sesuatu untuk menghasilkan listrik. Kadang, kita hanya perlu memahami bagaimana mengubah panas menjadi energi.",
    tts: "[resonant] Pada akhirnya, keduanya menunjukkan satu hal: manusia tidak harus membakar sesuatu untuk menghasilkan listrik. Kadang, kita hanya perlu memahami bagaimana mengubah panas menjadi energi.",
    pauseAfter: 3.4,
  },
];

// 4 Bespoke Zack D. Films-grade mechanical/scientific foley SFX via eleven_text_to_sound_v3
const BESPOKE_SFX = [
  {
    name: "sfx_turbine_spinup.mp3",
    duration: 5.0,
    prompt: "Massive industrial steam turbine accelerating smoothly from low metallic hum to high-pitched powerful spinning whine with pressurized steam rush, clean cinematic documentary foley, no music",
  },
  {
    name: "sfx_geothermal_steam_valve.mp3",
    duration: 4.5,
    prompt: "Heavy steel industrial governor valve mechanically rotating open followed by powerful high-pressure dry geothermal steam rushing through thick metal pipeline, crisp foley, no music",
  },
  {
    name: "sfx_reactor_rods_hum.mp3",
    duration: 4.5,
    prompt: "Deep subtle pressurized nuclear reactor core low resonant hum with precision metallic mechanical control rods sliding smoothly into position, clean scientific documentary sound design, no music",
  },
  {
    name: "sfx_h2s_pressure_hiss.mp3",
    duration: 4.0,
    prompt: "Sharp high-pressure industrial pipe flange gas leak hissing violently with deep subterranean micro-seismic tremor rumble, clean realistic documentary foley, no music",
  },
];

async function fetchWithRetry(url, opts, label) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, opts);
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`HTTP ${res.status}: ${body.slice(0, 260)}`);
      }
      return res;
    } catch (err) {
      if (attempt === 4) throw err;
      const wait = attempt * 2200;
      console.log(`  [RETRY ${attempt}/3] ${label} failed (${err.message}), waiting ${wait}ms...`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

function probeDuration(filePath) {
  const out = execFileSync("ffprobe", [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "csv=p=0",
    filePath,
  ], { encoding: "utf8" }).trim();
  return parseFloat(out);
}

function alignDisplayWordsToChars(displayText, alignment) {
  const displayWords = displayText.trim().split(/\s+/).filter(Boolean);
  const chars = alignment.characters || [];
  const starts = alignment.character_start_times_seconds || [];
  const ends = alignment.character_end_times_seconds || [];

  // Extract spoken word spans from ElevenLabs char alignment (ignoring bracketed stage directions)
  const spoken = [];
  let inBracket = false;
  let curStart = null;
  let curEnd = null;
  let curStr = "";

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (ch === "[") { inBracket = true; continue; }
    if (ch === "]") { inBracket = false; continue; }
    if (inBracket) continue;

    if (/\s/.test(ch)) {
      if (curStr.length > 0) {
        spoken.push({ text: curStr, start: curStart, end: curEnd });
        curStr = "";
        curStart = null;
        curEnd = null;
      }
    } else {
      if (curStart === null) curStart = starts[i];
      curEnd = ends[i];
      curStr += ch;
    }
  }
  if (curStr.length > 0) {
    spoken.push({ text: curStr, start: curStart, end: curEnd });
  }

  if (spoken.length === 0) {
    return displayWords.map((w, i) => ({
      text: w,
      start: i * 0.25,
      end: (i + 1) * 0.25,
    }));
  }

  // Map display words monotonically onto spoken word timing bounds (handles phonetic expansions like PWR -> pe we er cleanly!)
  const t0 = spoken[0].start;
  const t1 = spoken[spoken.length - 1].end;
  const result = [];
  for (let i = 0; i < displayWords.length; i++) {
    const frac0 = i / displayWords.length;
    const frac1 = (i + 1) / displayWords.length;
    const spIdx0 = Math.min(spoken.length - 1, Math.floor(frac0 * spoken.length));
    const spIdx1 = Math.min(spoken.length - 1, Math.max(spIdx0, Math.floor(frac1 * spoken.length) - 1));
    const ws = spoken.length === displayWords.length ? spoken[i].start : spoken[spIdx0].start;
    const we = spoken.length === displayWords.length ? spoken[i].end : spoken[spIdx1].end;
    result.push({
      text: displayWords[i],
      start: Math.max(t0, ws),
      end: Math.min(t1, Math.max(ws + 0.08, we)),
    });
  }
  return result;
}

async function main() {
  console.log(`=== [1/2] Synthesizing ElevenLabs ${MODEL_ID} Verbatim VO (${BEATS.length} beats, tempo=${TEMPO}x, 140ms pre-roll) ===`);

  const beatClips = [];
  const cuesSec = {};
  const sceneStarts = {};
  const allWords = [];
  let cursor = 0.45; // crisp 0.45s aerial mountain visual breath before first spoken word

  // Prepare leading silence clip
  const leadSil = path.join(CACHE_DIR, "_lead_sil.wav");
  execFileSync("ffmpeg", [
    "-y", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono",
    "-t", cursor.toFixed(4), "-c:a", "pcm_s16le", leadSil,
  ], { stdio: "ignore" });
  const concatWavList = [leadSil];

  for (let i = 0; i < BEATS.length; i++) {
    const b = BEATS[i];
    const hash = crypto.createHash("sha1").update(`${VOICE_ID}|${MODEL_ID}|${b.tts}`).digest("hex").slice(0, 12);
    const mp3Path = path.join(CACHE_DIR, `el_${String(i).padStart(2, "0")}_${hash}.mp3`);
    const jsonPath = path.join(CACHE_DIR, `el_${String(i).padStart(2, "0")}_${hash}.json`);

    let alignedData;
    if (fs.existsSync(mp3Path) && fs.existsSync(jsonPath)) {
      console.log(`  [${i + 1}/${BEATS.length}] CACHE  S${b.scene}: ${b.display.slice(0, 62)}...`);
      alignedData = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    } else {
      console.log(`  [${i + 1}/${BEATS.length}] SYNTH  S${b.scene}: ${b.display.slice(0, 62)}...`);
      const res = await fetchWithRetry(
        `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/with-timestamps?output_format=mp3_44100_128`,
        {
          method: "POST",
          headers: {
            "xi-api-key": API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: b.tts,
            model_id: MODEL_ID,
            voice_settings: {
              stability: 0.56,
              similarity_boost: 0.78,
              style: 0.24,
              use_speaker_boost: true,
            },
          }),
        },
        `beat_${i}`,
      );
      const data = await res.json();
      fs.writeFileSync(mp3Path, Buffer.from(data.audio_base64, "base64"));
      alignedData = data.alignment;
      fs.writeFileSync(jsonPath, JSON.stringify(alignedData, null, 2));
    }

    const mapped = alignDisplayWordsToChars(b.display, alignedData);
    const rawDur = probeDuration(mp3Path);
    const trimLead = Math.max(0, (mapped[0]?.start ?? 0) - PRE_ROLL_SEC);
    const trimEnd = Math.min(rawDur, (mapped[mapped.length - 1]?.end ?? rawDur) + 0.14);
    const trimmedDur = Math.max(0.2, trimEnd - trimLead);

    const wavClip = path.join(CACHE_DIR, `clip_${String(i).padStart(2, "0")}.wav`);
    execFileSync("ffmpeg", [
      "-y", "-i", mp3Path,
      "-ss", trimLead.toFixed(4),
      "-t", trimmedDur.toFixed(4),
      "-af", `atempo=${TEMPO},aresample=48000,afade=t=in:d=0.015,afade=t=out:st=${Math.max(0, trimmedDur / TEMPO - 0.025).toFixed(4)}:d=0.025`,
      "-ac", "1", "-ar", "48000", "-c:a", "pcm_s16le", wavClip,
    ], { stdio: "ignore" });

    const actualDur = probeDuration(wavClip);
    if (sceneStarts[`scene${b.scene}Start`] === undefined) {
      sceneStarts[`scene${b.scene}Start`] = b.scene === 1 ? 0 : Math.round(cursor * FPS);
    }

    // Record cue at first spoken word of this beat
    const firstWordRel = Math.max(0, ((mapped[0]?.start ?? trimLead) - trimLead) / TEMPO);
    cuesSec[b.cue] = Number((cursor + firstWordRel).toFixed(3));

    for (const w of mapped) {
      const ws = cursor + Math.max(0, (w.start - trimLead) / TEMPO);
      const we = cursor + Math.max(0.05, (w.end - trimLead) / TEMPO);
      allWords.push({
        scene: b.scene,
        text: w.text,
        startSec: ws,
        endSec: we,
        startFrame: Math.round(ws * FPS),
        endFrame: Math.max(Math.round(ws * FPS) + 2, Math.round(we * FPS)),
      });
    }

    concatWavList.push(wavClip);
    cursor += actualDur;

    // Append calibrated pause after beat
    if (b.pauseAfter > 0.02) {
      const silPath = path.join(CACHE_DIR, `sil_${String(i).padStart(2, "0")}.wav`);
      execFileSync("ffmpeg", [
        "-y", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono",
        "-t", b.pauseAfter.toFixed(4), "-c:a", "pcm_s16le", silPath,
      ], { stdio: "ignore" });
      concatWavList.push(silPath);
      cursor += b.pauseAfter;
    }

    beatClips.push({ ...b, actualDur });
  }

  // Assemble vo_master.wav cleanly
  const listFile = path.join(CACHE_DIR, "vo_concat.txt");
  fs.writeFileSync(listFile, concatWavList.map((p) => `file '${p.replace(/\\/g, "/")}'`).join("\n"));
  const voMaster = path.join(AUDIO_DIR, "vo_master.wav");
  execFileSync("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", listFile, "-c:a", "pcm_s16le", voMaster], { stdio: "ignore" });

  const totalDurSec = probeDuration(voMaster);
  const totalFrames = Math.round(totalDurSec * FPS);
  const closingCardStart = Math.max(0, totalFrames - Math.round(3.8 * FPS));

  // Group words into crisp 4-5 word progressive subtitle chunks (splitting strictly at sentence punctuation & scene boundaries)
  const subtitleChunks = [];
  let curChunk = [];
  let chunkIdx = 1;
  const flushChunk = () => {
    if (curChunk.length === 0) return;
    subtitleChunks.push({
      id: `sub_${String(chunkIdx++).padStart(3, "0")}`,
      scene: curChunk[0].scene,
      startFrame: Math.max(0, curChunk[0].startFrame - 1),
      endFrame: curChunk[curChunk.length - 1].endFrame + 4,
      words: curChunk.map((w) => ({
        text: w.text,
        startFrame: w.startFrame,
        endFrame: w.endFrame,
      })),
    });
    curChunk = [];
  };

  for (const w of allWords) {
    if (curChunk.length > 0 && curChunk[0].scene !== w.scene) flushChunk();
    curChunk.push(w);
    const endsSentence = /[.!?:]$/.test(w.text);
    const charLen = curChunk.reduce((acc, x) => acc + x.text.length + 1, 0);
    if (endsSentence || curChunk.length >= 5 || charLen >= 30) {
      flushChunk();
    }
  }
  flushChunk();

  const cuesFrames = {};
  for (const [k, v] of Object.entries(cuesSec)) {
    cuesFrames[k] = Math.round(v * FPS);
  }

  const scenesObj = {
    ...sceneStarts,
    closingCardStart,
    totalFrames,
  };

  const alignmentOut = {
    durationSec: Number(totalDurSec.toFixed(3)),
    totalFrames,
    fps: FPS,
    tempo: TEMPO,
    wordCount: allWords.length,
    scenes: scenesObj,
    cuesSec,
    cuesFrames,
  };
  fs.writeFileSync(path.join(AUDIO_DIR, "alignment.json"), JSON.stringify(alignmentOut, null, 2));

  // Emit typed Remotion story.ts
  const storyTs = `// AUTO-GENERATED by kamojang-vs-nuklir/scripts/build_vo_and_sfx.mjs
// Source: ElevenLabs ${MODEL_ID} character timestamps (${allWords.length} words, ${Object.keys(cuesFrames).length} cues)

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
  id: "KamojangVsNuklirShort",
  width: 1080,
  height: 1920,
  fps: ${FPS},
  durationInFrames: ${totalFrames},
  durationSec: ${Number(totalDurSec.toFixed(3))},
  audioMasterPath: "kamojang-vs-nuklir/audio_master.m4a",
} as const;

export const SCENES = ${JSON.stringify(scenesObj, null, 2)} as const;

export const CUES = ${JSON.stringify(cuesFrames, null, 2)} as const;

export const CUES_SEC = ${JSON.stringify(cuesSec, null, 2)} as const;

export const SUBTITLE_CHUNKS: SubtitleChunk[] = ${JSON.stringify(subtitleChunks, null, 2)};
`;
  fs.writeFileSync(STORY_OUT, storyTs);

  console.log(`\n=== 8-SCENE KAMOJANG VS NUKLIR TIMING BREAKDOWN (Tempo ${TEMPO}x) ===`);
  for (let s = 1; s <= 8; s++) {
    const sf = scenesObj[`scene${s}Start`];
    const ef = s < 8 ? scenesObj[`scene${s + 1}Start`] - 1 : totalFrames - 1;
    console.log(`  Scene ${s}: f=${sf}..${ef} (${(sf / FPS).toFixed(2)}s -> ${((ef + 1) / FPS).toFixed(2)}s | dur=${((ef - sf + 1) / FPS).toFixed(2)}s)`);
  }
  console.log(`\nVO COMPLETE -> ${voMaster} (${totalDurSec.toFixed(2)}s / ${totalFrames} frames, ${allWords.length} words)`);

  // Step 2: Generate 4 bespoke cinematic engineering SFX clips via eleven_text_to_sound_v3
  console.log(`\n=== [2/2] Generating ${BESPOKE_SFX.length} Bespoke Engineering Foley Clips via eleven_text_to_sound_v3 ===`);
  for (const sfx of BESPOKE_SFX) {
    const outPath = path.join(SFX_DIR, sfx.name);
    if (fs.existsSync(outPath) && fs.statSync(outPath).size > 8000) {
      console.log(`  [CACHE ] ${sfx.name}`);
      continue;
    }
    console.log(`  [SYNTH ] ${sfx.name} (${sfx.duration}s)`);
    const res = await fetchWithRetry(
      "https://api.elevenlabs.io/v1/sound-generation",
      {
        method: "POST",
        headers: {
          "xi-api-key": API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: sfx.prompt,
          duration_seconds: sfx.duration,
          prompt_influence: 0.45,
          model_id: "eleven_text_to_sound_v3",
        }),
      },
      sfx.name,
    );
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(outPath, buf);
    console.log(`  [OK    ] ${sfx.name} (${buf.length} bytes)`);
  }
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
