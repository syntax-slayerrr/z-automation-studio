/**
 * Generate 11 Living World-Building Foley & Ambience SFX via ElevenLabs Sound-V3
 * for "IpmNalarPelajarShort" (PC IPM Panawuan)
 *
 * Strictly preserves all 22 locked VO files, vo_master.wav, alignment.json,
 * story.ts, and the 12 existing tactile SFX clips! Only adds/caches the 11 new SFX.
 */
import { execFileSync } from "node:child_process";
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
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

const SFX_MODEL = "eleven_text_to_sound_v3";
const sfxDir = join(PROJECT, "audio", "sfx");
mkdirSync(sfxDir, { recursive: true });

function getDurationSec(filePath) {
  try {
    const out = execFileSync(
      "ffprobe",
      [
        "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        filePath,
      ],
      { encoding: "utf8" }
    ).trim();
    return Number.parseFloat(out) || 0;
  } catch {
    return 0;
  }
}

const LIVING_SFX = [
  {
    name: "sfx_night_crickets_village.mp3",
    durationSeconds: 8.0,
    promptInfluence: 0.45,
    loop: true,
    prompt:
      "Quiet peaceful rural Indonesian village night ambience heard softly through a closed bedroom window, gentle rhythmic tropical crickets chirping softly in warm night air, calm intimate quietness, no wind roar, no traffic, realistic field recording.",
  },
  {
    name: "sfx_phone_thumb_swipe.mp3",
    durationSeconds: 1.2,
    promptInfluence: 0.55,
    loop: false,
    prompt:
      "Subtle realistic close-up smartphone glass touchscreen thumb swipe and soft gentle fingertip tap on glass screen in a quiet bedroom, clean intimate dry foley, no digital beep.",
  },
  {
    name: "sfx_rooster_morning_crow.mp3",
    durationSeconds: 5.0,
    promptInfluence: 0.55,
    loop: false,
    prompt:
      "Authentic Indonesian village morning dawn ambience, a clear natural rooster crowing warmly from a nearby backyard accompanied by gentle tropical morning sparrows and soft sunrise breeze, crisp realistic documentary field recording, no music.",
  },
  {
    name: "sfx_footsteps_paving_walk.mp3",
    durationSeconds: 5.5,
    promptInfluence: 0.55,
    loop: false,
    prompt:
      "Steady natural rhythmic footsteps of rubber-soled sneakers walking calmly at medium pace on outdoor concrete paving blocks in a quiet neighborhood morning, crisp dry realistic foley recording, no music.",
  },
  {
    name: "sfx_village_morning_peers.mp3",
    durationSeconds: 5.0,
    promptInfluence: 0.45,
    loop: false,
    prompt:
      "Soft distant friendly chatter and gentle light laughter of three teenage students walking outdoors in a peaceful sunny morning village street, muffled unintelligible conversational murmur, natural outdoor air, realistic field recording.",
  },
  {
    name: "sfx_seminar_crowd_chatter.mp3",
    durationSeconds: 7.0,
    promptInfluence: 0.5,
    loop: false,
    prompt:
      "Lively realistic indoor auditorium ambience of forty youth seminar participants chatting warmly together and settling into seats before an event begins, layered unintelligible conversational murmur, soft chairs moving and paper rustling in a medium hall with natural room reverb, no music.",
  },
  {
    name: "sfx_pa_mic_switch_click.mp3",
    durationSeconds: 1.2,
    promptInfluence: 0.6,
    loop: false,
    prompt:
      "Subtle realistic handheld wireless PA microphone power switch click followed by a very soft finger tap and tiny auditorium speaker air hum, authentic live seminar sound, no harsh feedback screech.",
  },
  {
    name: "sfx_awkward_hall_silence.mp3",
    durationSeconds: 7.0,
    promptInfluence: 0.5,
    loop: false,
    prompt:
      "Quiet tense awkward silence inside a medium seminar auditorium with forty still people, very faint air conditioner room tone hum, one subtle distant polite throat clearing cough and tiny paper rustle, realistic cinema room tone.",
  },
  {
    name: "sfx_chair_creak_cloth.mp3",
    durationSeconds: 1.8,
    promptInfluence: 0.55,
    loop: false,
    prompt:
      "Realistic foley of a student shifting slightly and then standing up from a padded wooden auditorium seminar chair, soft wood creak and gentle cotton sweater fabric rustle in a quiet indoor hall.",
  },
  {
    name: "sfx_crowd_turn_murmur.mp3",
    durationSeconds: 4.2,
    promptInfluence: 0.5,
    loop: false,
    prompt:
      "Soft impressed collective murmur and gentle fabric rustling of forty seminar audience members turning their heads simultaneously to look at a brave speaker in a quiet hall, authentic subtle whisper reaction, realistic indoor acoustics.",
  },
  {
    name: "sfx_warm_hall_applause.mp3",
    durationSeconds: 3.8,
    promptInfluence: 0.55,
    loop: false,
    prompt:
      "Warm genuine appreciative clapping applause from forty people inside a medium wooden seminar auditorium, natural polite swell tapering smoothly off, realistic acoustic room reverb, no shouting whistles.",
  },
];

async function main() {
  if (!process.env.ELEVENLABS_API_KEY) {
    throw new Error("ELEVENLABS_API_KEY missing in .env!");
  }
  const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

  console.log(`=== Generating ${LIVING_SFX.length} Living World-Building Foley SFX via ${SFX_MODEL} ===`);
  for (let i = 0; i < LIVING_SFX.length; i++) {
    const sfx = LIVING_SFX[i];
    const outPath = join(sfxDir, sfx.name);
    if (existsSync(outPath) && getDurationSec(outPath) > 0.4) {
      console.log(`  [${i + 1}/${LIVING_SFX.length}] CACHED ${sfx.name} (${getDurationSec(outPath).toFixed(2)}s)`);
      continue;
    }
    console.log(`  [${i + 1}/${LIVING_SFX.length}] SYNTH  ${sfx.name} (${sfx.durationSeconds}s)...`);
    const stream = await client.textToSoundEffects.convert({
      text: sfx.prompt,
      modelId: SFX_MODEL,
      durationSeconds: sfx.durationSeconds,
      promptInfluence: sfx.promptInfluence,
      loop: sfx.loop,
    });
    const ws = createWriteStream(outPath);
    await finished(Readable.fromWeb(stream).pipe(ws));
    console.log(`           -> saved (${getDurationSec(outPath).toFixed(2)}s)`);
  }
  console.log("=== ALL 11 LIVING FOLEY SFX READY ===");
}

main().catch((err) => {
  console.error("FATAL ERROR in build_living_sfx:", err);
  process.exit(1);
});
