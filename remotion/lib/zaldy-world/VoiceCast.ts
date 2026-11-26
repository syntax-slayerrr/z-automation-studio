/**
 * LOCKED CANONICAL TRIO VOICE CAST — Z-Automation Studio 3D Universe
 *
 * Permanent ElevenLabs (`eleven_v4`) Voice Profiles for Zaldy, Hermes, and OpenClaw.
 * Every new episode, script, and audio generator MUST read from these exact locked IDs & parameters
 * so character voice identity stays 100% consistent across the entire series!
 */

export type StudioSpeakerId = "zaldy" | "hermes" | "openclaw";

export interface LockedVoiceProfile {
  speaker: StudioSpeakerId;
  voiceName: string;
  voiceId: string;
  modelId: "eleven_v4";
  persona: string;
  stability: number;
  similarityBoost: number;
  style: number;
  useSpeakerBoost: boolean;
  seed: number | null;
  /** Send previousText/nextText among same-speaker lines to lock timbre & cadence */
  useContextLock: boolean;
  /** Default FFmpeg atempo multiplier (1.0 = natural, slightly slower = calmer/cooler) */
  tempo: number;
  /** True = allow expressive ElevenLabs emotion tags like [excited]/[nervous]; False = keep voice timbre strictly locked */
  allowEmotionTags: boolean;
  cacheVer: string;
}

export const LOCKED_VOICE_CAST: Record<StudioSpeakerId, LockedVoiceProfile> = {
  zaldy: {
    speaker: "zaldy",
    voiceName: "Eric",
    voiceId: "cjVigY5qzO86Huf0OWal",
    modelId: "eleven_v4",
    persona: "Calm, cool, smooth young Indonesian creator & director — unhurried, confident, warm clarity",
    stability: 0.72,
    similarityBoost: 0.88,
    style: 0.06,
    useSpeakerBoost: true,
    seed: 2026,
    useContextLock: true,
    tempo: 1.05,
    allowEmotionTags: false,
    cacheVer: "v2_zaldy_eric_calm_cool",
  },
  hermes: {
    speaker: "hermes",
    voiceName: "Brian",
    voiceId: "nPczCjzI2devNBz1zQrb",
    modelId: "eleven_v4",
    persona: "Deep, resonant, composed strategist & studio narrator",
    stability: 0.72,
    similarityBoost: 0.90,
    style: 0.0,
    useSpeakerBoost: true,
    seed: 4242,
    useContextLock: true,
    tempo: 1.10,
    allowEmotionTags: false,
    cacheVer: "v2_hermes_brian_locked",
  },
  openclaw: {
    speaker: "openclaw",
    voiceName: "Liam",
    voiceId: "TX3LPaxmHKxFdv7VOQHJ",
    modelId: "eleven_v4",
    persona: "Energetic, expressive, fast-paced comedy AI mascot",
    stability: 0.38,
    similarityBoost: 0.78,
    style: 0.12,
    useSpeakerBoost: true,
    seed: null,
    useContextLock: false,
    tempo: 1.14,
    allowEmotionTags: true,
    cacheVer: "v2_openclaw_liam_locked",
  },
} as const;
