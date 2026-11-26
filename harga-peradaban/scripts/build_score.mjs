/**
 * Builds an Uninterrupted ~230s Dramatic D Minor Orchestral Documentary Score for
 * "HARGA SEBUAH PERADABAN" by synthesizing 2 bespoke new movements (Tense Conflict Ostinato +
 * Haunting Poetic Finale) via `eleven_text_to_sound_v3` and seamlessly crossfading them with
 * our concert-hall D Minor chamber orchestral suite across all 6 Acts!
 *
 * Run:
 *   node --env-file=.env harga-peradaban/scripts/build_score.mjs
 */
import { execFileSync } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { Readable } from "node:stream";
import { finished } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT = resolve(__dirname, "..");
const ROOT = resolve(PROJECT, "..");
const LOCAL_MOV = join(PROJECT, "audio", "score_movements");
const RITUAL_MOV = join(ROOT, "human-ritual", "audio", "score_movements");
const NUSANTARA_MOV = join(ROOT, "nusantara-samudra", "audio", "score_movements");
const OUT_SCORE = join(PROJECT, "audio", "music_civilization_score.mp3");
const SFX_MODEL = "eleven_text_to_sound_v3";

async function withRetry(label, fn, maxAttempts = 4) {
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const waitMs = attempt * 3000;
      console.warn(`  [RETRY ${attempt}/${maxAttempts}] ${label} failed; retrying in ${waitMs / 1000}s...`);
      if (attempt < maxAttempts) await new Promise((r) => setTimeout(r, waitMs));
    }
  }
  throw lastErr;
}

const BESPOKE_MOVEMENTS = [
  {
    name: "mov_s04_conflict_ostinato.mp3",
    durationSeconds: 22.0,
    promptInfluence: 0.70,
    prompt:
      "Dramatic prestige historical documentary film score in D minor, purely instrumental, no vocals. Brooding dark pulsing cello ostinato, tense low double bass rumble, mournful solo viola melody and subtle restrained timpani heartbeat evoking territorial boundaries, scarcity, and quiet human tragedy in a concert hall.",
  },
  {
    name: "mov_s06_poignant_finale.mp3",
    durationSeconds: 22.0,
    promptInfluence: 0.70,
    prompt:
      "Poignant emotional film documentary finale in D minor resolving gently into D Dorian, purely instrumental, no vocals. Expressive intimate solo piano notes interwoven with warm melancholic soaring strings and deep resonant cello fading peacefully into wind-swept silence, haunting and philosophical.",
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
  mkdirSync(LOCAL_MOV, { recursive: true });

  for (let i = 0; i < BESPOKE_MOVEMENTS.length; i++) {
    const m = BESPOKE_MOVEMENTS[i];
    const p = join(LOCAL_MOV, m.name);
    if (existsSync(p)) {
      console.log(`  [${i + 1}/${BESPOKE_MOVEMENTS.length}] CACHED ${m.name} (${getDur(p).toFixed(2)}s)`);
      continue;
    }
    console.log(`  [${i + 1}/${BESPOKE_MOVEMENTS.length}] SYNTH  ${m.name} (${m.durationSeconds}s)...`);
    await withRetry(m.name, async () => {
      if (existsSync(p)) rmSync(p, { force: true });
      const stream = await client.textToSoundEffects.convert({
        text: m.prompt,
        modelId: SFX_MODEL,
        durationSeconds: m.durationSeconds,
        promptInfluence: m.promptInfluence,
        loop: false,
      });
      const ws = createWriteStream(p);
      await finished(Readable.fromWeb(stream).pipe(ws));
    });
    console.log(`           -> saved (${getDur(p).toFixed(2)}s)`);
  }

  // 13-segment unbroken dramatic symphonic arc in D minor (~248s -> cleanly covers full ~3:55-4:02 film with zero wrap!)
  const chain = [
    join(NUSANTARA_MOV, "mov1_prolog_deep_ocean.mp3"),               // S01_01-02: Vast wandering savanna mystery
    join(RITUAL_MOV, "mov1_solo_violin_wonder.mp3"),                 // S01_03-04: Campfire intimacy & nomadic struggle
    join(RITUAL_MOV, "mov1_solo_violin_wonder.mp3"),                 // S02_01-02: Fertile valley discovery wonder
    join(RITUAL_MOV, "mov2_layered_string_arpeggios.mp3"),           // S02_03-04: Sprouting seed epiphany
    join(RITUAL_MOV, "mov2_layered_string_arpeggios.mp3"),           // S03_01-03: Planting & building early settlement
    join(RITUAL_MOV, "mov4_sweeping_orchestral_bloom.mp3"),          // S03_04-05: Golden first harvest & settlement bloom
    join(LOCAL_MOV, "mov_s04_conflict_ostinato.mp3"),                // S04_01-02: Missing grain & wooden fences
    join(LOCAL_MOV, "mov_s04_conflict_ostinato.mp3"),                // S04_03-04: Water dispute & power hierarchy
    join(RITUAL_MOV, "mov3_accelerating_tension_order.mp3"),         // S05_01-02: Generational leap & rising Mesopotamia
    join(RITUAL_MOV, "mov4_sweeping_orchestral_bloom.mp3"),          // S05_03-04: Cuneiform & Uruk orchestral climax!
    join(RITUAL_MOV, "mov3_accelerating_tension_order.mp3"),         // S06_01-02: Modern industrial harvest & global trade
    join(RITUAL_MOV, "mov5_crystalline_violin_finale.mp3"),          // S06_03: Deep philosophical bridge back to ancient valley
    join(LOCAL_MOV, "mov_s06_poignant_finale.mp3"),                  // S06_04 + End Card: Haunting poetic piano & strings resolution!
  ];

  for (const p of chain) {
    if (!existsSync(p)) throw new Error(`Missing score segment: ${p}`);
  }

  const inputs = [];
  for (const p of chain) inputs.push("-i", p);

  const fcParts = [];
  let prevLabel = "[0:a]";
  for (let i = 1; i < chain.length; i++) {
    const outLabel = i === chain.length - 1 ? "[out]" : `[a${i}]`;
    const dur = i === chain.length - 1 ? "3.2" : "3.0";
    fcParts.push(`${prevLabel}[${i}:a]acrossfade=d=${dur}:c1=tri:c2=tri${outLabel}`);
    prevLabel = outLabel;
  }

  execFileSync(
    "ffmpeg",
    ["-y", "-loglevel", "error", ...inputs, "-filter_complex", fcParts.join(";"), "-map", "[out]", "-c:a", "libmp3lame", "-b:a", "192k", OUT_SCORE],
    { stdio: "inherit" }
  );
  console.log(`CIVILIZATION ORCHESTRAL SCORE COMPLETE (${getDur(OUT_SCORE).toFixed(2)}s) -> ${OUT_SCORE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
