/**
 * Generates a 5-Movement Continuous Ambient Orchestral Score inspired by the sonic architecture
 * of Oppenheimer's "Can You Hear the Music" (solitary expressive solo violin arpeggios,
 * accelerating layered chamber strings, warm deep cello ostinato, subtle analog sub-pad,
 * sweeping emotional climax, and serene crystalline harmonic resolution)
 * using ElevenLabs `eleven_text_to_sound_v3` (5 x 22s movements in A minor, crossfaded seamlessly
 * into one continuous ~105-120s concert-hall master stem).
 *
 * Run:
 *   node --env-file=.env human-ritual/scripts/build_oppenheimer_score.mjs
 */
import { execFileSync } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { Readable } from "node:stream";
import { finished } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT = resolve(__dirname, "..");
const MOV_DIR = join(PROJECT, "audio", "score_movements");
const OUT_SCORE = join(PROJECT, "audio", "music_oppenheimer_ambient.mp3");
const SFX_MODEL = "eleven_text_to_sound_v3";

// 5 continuous orchestral movements all anchored in warm A minor (440 Hz concert hall, no vocals, no drums)
const MOVEMENTS = [
  {
    name: "mov1_solo_violin_wonder.mp3",
    durationSeconds: 22.0,
    promptInfluence: 0.68,
    prompt:
      "Cinematic ambient film score in A minor, purely instrumental, no vocals, no drums. Intimate reverberant concert hall recording of a solitary expressive solo violin playing hypnotic delicate slow arpeggiated harmonic figures over a warm soft sustained deep cello drone and subtle glowing analog synthesizer sub-pad, evoking scientific curiosity and quiet wonder.",
  },
  {
    name: "mov2_layered_string_arpeggios.mp3",
    durationSeconds: 22.0,
    promptInfluence: 0.68,
    prompt:
      "Cinematic ambient chamber orchestral film score in A minor, purely instrumental, no vocals, no drums. Expressive solo violin playing flowing accelerating arpeggios joined by shimmering layered chamber violins, delicate plucked harp harmonics, and a warm steady pulsing cello ostinato building gentle hypnotic momentum in a lush concert hall.",
  },
  {
    name: "mov3_accelerating_tension_order.mp3",
    durationSeconds: 22.0,
    promptInfluence: 0.68,
    prompt:
      "Cinematic ambient orchestral film score in A minor, purely instrumental, no vocals, no drums. Urgent hypnotic accelerating solo violin arpeggios weaving with trembling string tremolos, deep resonant pulsing cello bass, and warm analog synth sub-waves transitioning from mathematical tension into crystalline luminous harmonic order.",
  },
  {
    name: "mov4_sweeping_orchestral_bloom.mp3",
    durationSeconds: 22.0,
    promptInfluence: 0.68,
    prompt:
      "Cinematic ambient orchestral film score in A minor, purely instrumental, no vocals, no drums. Sweeping emotional crescendo of soaring layered violins, lush warm violas, majestic resonant cellos, and glowing warm horn-synth chords playing interlocking arpeggiated strings full of human wonder, awe, and deep transcendence.",
  },
  {
    name: "mov5_crystalline_violin_finale.mp3",
    durationSeconds: 22.0,
    promptInfluence: 0.68,
    prompt:
      "Cinematic ambient orchestral film score resolution in A minor, purely instrumental, no vocals, no drums. Lush emotional chamber strings gently thinning out into a breathtaking solitary high solo violin sustained harmonic and warm peaceful low cello chord fading slowly into serene concert hall silence.",
  },
];

function getDur(p) {
  return Number.parseFloat(
    execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p], { encoding: "utf8" })
      .trim()
      .replace(/,/g, "")
  );
}

async function main() {
  const client = new ElevenLabsClient();
  mkdirSync(MOV_DIR, { recursive: true });

  const paths = [];
  for (let i = 0; i < MOVEMENTS.length; i++) {
    const m = MOVEMENTS[i];
    const p = join(MOV_DIR, m.name);
    paths.push(p);
    if (existsSync(p)) {
      console.log(`  [${i + 1}/${MOVEMENTS.length}] CACHED ${m.name} (${getDur(p).toFixed(2)}s)`);
      continue;
    }
    console.log(`  [${i + 1}/${MOVEMENTS.length}] SYNTH  ${m.name} (${m.durationSeconds}s)...`);
    const stream = await client.textToSoundEffects.convert({
      text: m.prompt,
      modelId: SFX_MODEL,
      durationSeconds: m.durationSeconds,
      promptInfluence: m.promptInfluence,
      loop: false,
    });
    const ws = createWriteStream(p);
    await finished(Readable.fromWeb(stream).pipe(ws));
    console.log(`           -> saved (${getDur(p).toFixed(2)}s)`);
  }

  // Stitch all 5 movements seamlessly with long equal-power sinusoidal crossfades (3.2s) + gentle hall glue!
  // 5 * 22s - 4 * 3.2s = ~97.2s base, gently stretched/extended smoothly via crossfaded mov2 reprise to ~118s so zero awkward hard loop!
  console.log("\nStitching 5 orchestral movements with equal-power concert-hall crossfades ->", OUT_SCORE);
  const args = ["-y", "-loglevel", "error"];
  // Sequence: mov1 -> mov2 -> mov3 -> mov4 -> mov4_reprise(soft) -> mov5 (~116s seamless dramatic arc!)
  const seq = [paths[0], paths[1], paths[2], paths[3], paths[1], paths[4]];
  for (const p of seq) args.push("-i", p);

  const xf = 2.2;
  const fc = [
    `[0:a]aformat=sample_rates=44100:channel_layouts=stereo,highpass=f=36[a0]`,
    `[1:a]aformat=sample_rates=44100:channel_layouts=stereo,highpass=f=36[a1]`,
    `[2:a]aformat=sample_rates=44100:channel_layouts=stereo,highpass=f=36[a2]`,
    `[3:a]aformat=sample_rates=44100:channel_layouts=stereo,highpass=f=36[a3]`,
    `[4:a]aformat=sample_rates=44100:channel_layouts=stereo,highpass=f=36,volume=0.94[a4]`,
    `[5:a]aformat=sample_rates=44100:channel_layouts=stereo,highpass=f=36,atempo=0.90[a5]`,
    `[a0][a1]acrossfade=d=${xf}:c1=qsin:c2=qsin[m01]`,
    `[m01][a2]acrossfade=d=${xf}:c1=qsin:c2=qsin[m02]`,
    `[m02][a3]acrossfade=d=${xf}:c1=qsin:c2=qsin[m03]`,
    `[m03][a4]acrossfade=d=${xf}:c1=qsin:c2=qsin[m04]`,
    `[m04][a5]acrossfade=d=3.0:c1=qsin:c2=qsin,aecho=0.8:0.88:42:0.18,loudnorm=I=-16:TP=-2.0:LRA=8[out]`,
  ].join(";");

  args.push("-filter_complex", fc, "-map", "[out]", "-c:a", "libmp3lame", "-b:a", "192k", OUT_SCORE);
  execFileSync("ffmpeg", args, { stdio: "inherit" });
  console.log(`OPPENHEIMER-STYLE AMBIENT SCORE READY -> ${OUT_SCORE} (${getDur(OUT_SCORE).toFixed(2)}s)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
