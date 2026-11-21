import alignmentData from "../alignment.json";

interface WordTok {
  w: string;
  speaker?: string;
  start: number;
  end: number;
}

const WORDS = (alignmentData as { words: WordTok[] }).words;
const WORDS_BY_SPEAKER = new Map<string, WordTok[]>();

for (const tok of WORDS) {
  const spk = tok.speaker ?? "galang";
  const arr = WORDS_BY_SPEAKER.get(spk) ?? [];
  arr.push(tok);
  WORDS_BY_SPEAKER.set(spk, arr);
}

/**
 * Computes natural Indonesian vowel-modulated mouth aperture (0..0.64) from exact ElevenLabs word timestamps.
 * Avoids exaggerated wide-open ovals while keeping crisp syllable closure between words.
 */
export function mouthOpenAt(frame: number, speaker: string, fps = 30): number {
  const list = WORDS_BY_SPEAKER.get(speaker);
  if (!list || list.length === 0) return 0;

  const t = frame / fps;
  for (let i = 0; i < list.length; i++) {
    const w = list[i];
    if (t >= w.start - 0.015 && t <= w.end + 0.015) {
      const span = Math.max(0.08, w.end - w.start);
      const u = Math.max(0, Math.min(1, (t - w.start) / span));
      const vowels = w.w.match(/[aiueoAIUEO]/g) ?? ["a"];
      const syllables = Math.max(1, Math.min(4, vowels.length));
      const sylIdx = Math.min(vowels.length - 1, Math.floor(u * vowels.length));
      const vChar = (vowels[sylIdx] || "a").toLowerCase();
      const vWeight = vChar === "a" ? 1.0 : vChar === "o" ? 0.88 : vChar === "e" ? 0.76 : 0.64;

      const env = Math.sin(u * Math.PI);
      const sylPhase = (u * syllables) % 1;
      const sylPulse = 0.35 + 0.65 * Math.sin(sylPhase * Math.PI);
      const raw = env * sylPulse * vWeight * 0.72;
      if (raw < 0.12) return 0;
      if (raw < 0.28) return 0.24;
      if (raw < 0.42) return 0.36;
      if (raw < 0.56) return 0.48;
      return 0.60;
    }
  }
  return 0;
}

/** Returns 0..1 speaking cadence signal for non-oscillating pose triggers. */
export function isSpeakingAt(frame: number, speaker: string, fps = 30): number {
  const list = WORDS_BY_SPEAKER.get(speaker);
  if (!list) return 0;
  const t = frame / fps;
  for (let i = 0; i < list.length; i++) {
    const w = list[i];
    if (t >= w.start - 0.06 && t <= w.end + 0.08) return 1;
  }
  return 0;
}
