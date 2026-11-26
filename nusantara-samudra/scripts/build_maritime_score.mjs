/**
 * Assembles the 7-Segment Continuous D Minor Orchestral Documentary Score (~136s)
 * for "Nusantara: Peradaban yang Mengarungi Samudra" by crossfading:
 *   1. Bespoke `mov1_prolog_deep_ocean.mp3` (deep cello drone & solitary plucked harp harmonics)
 *   2. Studio-library concert-hall D Minor chamber orchestral movements (`human-ritual/audio/score_movements/`)
 *      ending on `mov5_crystalline_violin_finale.mp3` resolving gracefully on the Nusantara Epilog!
 *
 * Run:
 *   node nusantara-samudra/scripts/build_maritime_score.mjs
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT = resolve(__dirname, "..");
const ROOT = resolve(PROJECT, "..");
const LOCAL_MOV = join(PROJECT, "audio", "score_movements");
const STUDIO_D_MINOR = join(ROOT, "human-ritual", "audio", "score_movements");
const OUT_SCORE = join(PROJECT, "audio", "music_maritime_odyssey.mp3");

function getDur(p) {
  return Number.parseFloat(
    execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p], { encoding: "utf8" })
      .trim()
      .replace(/,/g, "")
  );
}

function main() {
  mkdirSync(dirname(OUT_SCORE), { recursive: true });

  // 7-segment dramatic arc in unified D Minor concert-hall timbre (~136s -> covers full 134.01s documentary cleanly!)
  const chain = [
    join(LOCAL_MOV, "mov1_prolog_deep_ocean.mp3"),                   // Prolog: Deep midnight ocean cello & harp
    join(STUDIO_D_MINOR, "mov1_solo_violin_wonder.mp3"),             // Babak 1: Madagascar coastal wonder
    join(STUDIO_D_MINOR, "mov2_layered_string_arpeggios.mp3"),       // Babak 1->2: Austronesian map & Borobudur stone
    join(STUDIO_D_MINOR, "mov3_accelerating_tension_order.mp3"),     // Babak 2: Living ship, Sriwijaya & global montage
    join(STUDIO_D_MINOR, "mov2_layered_string_arpeggios.mp3"),       // Babak 3: Makassar Padewakang monsoon voyage
    join(STUDIO_D_MINOR, "mov4_sweeping_orchestral_bloom.mp3"),      // Babak 3->Epilog: Yolngu encounter & tri-legacy swell
    join(STUDIO_D_MINOR, "mov5_crystalline_violin_finale.mp3"),      // Epilog: Nusantara archipelago luminous resolution
  ];

  for (const p of chain) {
    if (!existsSync(p)) {
      throw new Error(`Missing score movement: ${p}`);
    }
  }

  const inputs = [];
  for (const p of chain) inputs.push("-i", p);

  const fc = [
    "[0:a][1:a]acrossfade=d=3.0:c1=tri:c2=tri[a01]",
    "[a01][2:a]acrossfade=d=3.0:c1=tri:c2=tri[a02]",
    "[a02][3:a]acrossfade=d=3.0:c1=tri:c2=tri[a03]",
    "[a03][4:a]acrossfade=d=3.0:c1=tri:c2=tri[a04]",
    "[a04][5:a]acrossfade=d=3.0:c1=tri:c2=tri[a05]",
    "[a05][6:a]acrossfade=d=3.2:c1=tri:c2=tri[out]",
  ].join(";");

  execFileSync(
    "ffmpeg",
    ["-y", "-loglevel", "error", ...inputs, "-filter_complex", fc, "-map", "[out]", "-c:a", "libmp3lame", "-b:a", "192k", OUT_SCORE],
    { stdio: "inherit" }
  );
  console.log(`MARITIME ORCHESTRAL SCORE COMPLETE (${getDur(OUT_SCORE).toFixed(2)}s) -> ${OUT_SCORE}`);
}

main();
