/**
 * Official ElevenLabs SDK integration for IPM Chronicles (`@elevenlabs/elevenlabs-js`).
 * Loads `ELEVENLABS_API_KEY` automatically via `node --env-file=.env`.
 */
import { createWriteStream, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Readable } from "node:stream";
import { finished } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

export const DEFAULT_TTS_MODEL = "eleven_v4";
export const DEFAULT_SFX_MODEL = "eleven_text_to_sound_v3";

// Reference Voice from EP01 & EP02 (Cartesia sonic-3 "Galang", median f0 = 118.1 Hz, IQR 108.6-135.2 Hz)
export const GALANG_CARTESIA_VOICE_ID = "04b567df-2923-4b0c-896b-4b7df0a07e1a";

// Pre-made voices confirmed usable on ElevenLabs Free Tier (10,000 credits/month)
// Acoustic pitch match to Galang (118.1 Hz):
// - chris (126.7 Hz, IQR 114.4-144.1 Hz): closest natural baritone overlap to Galang
// - daniel (139.1 Hz, IQR 115.1-155.3 Hz): steady historical documentary broadcaster
// - brian (98.4 Hz, IQR 86.2-115.0 Hz): deep resonant narrator
// - george (151.8 Hz, IQR 135.8-171.6 Hz): warm narrative storyteller
export const PREMADE_VOICES = {
  galangMatch: "iP95p4xoKVk53GoZ742B", // Chris — closest f0 (126.7 Hz) & warm baritone timbre to Galang
  chris: "iP95p4xoKVk53GoZ742B",
  daniel: "onwK4e9ZLuTAKqWW03F9",
  brian: "nPczCjzI2devNBz1zQrb",
  george: "JBFqnCBsd6RMkjVDRZzb",
  sarah: "EXAVITQu4vr4xnSDxMaL",
};

export function createClient() {
  return new ElevenLabsClient();
}

/** List pre-made voices usable on the current plan without consuming credits. */
export async function listPremadeVoices(client = createClient()) {
  const res = await client.voices.getAll();
  return (res.voices ?? [])
    .filter((v) => v.category === "premade")
    .map((v) => ({ voiceId: v.voiceId, name: v.name, labels: v.labels ?? {} }));
}

/** Generate speech audio (`eleven_v4`, Indonesian by default) with request stitching support. */
export async function synthesizeSpeech({
  text,
  outPath,
  voiceId = PREMADE_VOICES.george,
  modelId = DEFAULT_TTS_MODEL,
  languageCode = "id",
  stability = 0.48,
  similarityBoost = 0.78,
  applyTextNormalization = "on",
  previousText,
  nextText,
  client = createClient(),
}) {
  mkdirSync(dirname(resolve(outPath)), { recursive: true });
  const audio = await client.textToSpeech.convert(voiceId, {
    text,
    modelId,
    languageCode,
    applyTextNormalization,
    voiceSettings: { stability, similarityBoost },
    ...(previousText ? { previousText } : {}),
    ...(nextText ? { nextText } : {}),
  });
  const fileStream = createWriteStream(outPath);
  await finished(Readable.fromWeb(audio).pipe(fileStream));
  return outPath;
}

/** Generate ambient or foley SFX via `eleven_text_to_sound_v3`. */
export async function synthesizeSoundEffect({
  text,
  outPath,
  durationSeconds,
  promptInfluence = 0.5,
  loop = false,
  modelId = DEFAULT_SFX_MODEL,
  client = createClient(),
}) {
  mkdirSync(dirname(resolve(outPath)), { recursive: true });
  const audio = await client.textToSoundEffects.convert({
    text,
    modelId,
    ...(durationSeconds !== undefined ? { durationSeconds } : {}),
    promptInfluence,
    loop,
  });
  const fileStream = createWriteStream(outPath);
  await finished(Readable.fromWeb(audio).pipe(fileStream));
  return outPath;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const cmd = process.argv[2];
  if (cmd === "voices") {
    const list = await listPremadeVoices();
    console.log(JSON.stringify(list, null, 2));
  } else {
    console.log(
      "Usage (run with `node --env-file=.env`):\n" +
        "  node --env-file=.env ipm-chronicles/pipeline/elevenlabs_client.mjs voices"
    );
  }
}
