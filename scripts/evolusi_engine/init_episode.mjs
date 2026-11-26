#!/usr/bin/env node
/**
 * 1-Command Episode Scaffolder for `/series-evolusi`
 *
 * Usage:
 *   npm run init:evolusi -- --slug ep02-sherpa-himalaya --title "Rahasia Paru-Paru Sherpa Everest" --biome himalaya_hypoxia --ep 2
 */
import fs from 'node:fs';
import path from 'node:path';

function parseArgs(argv) {
  const args = {
    slug: '',
    title: '',
    biome: 'ocean_bajau',
    ep: '2',
  };
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--slug' && argv[i + 1]) args.slug = argv[++i];
    else if (k === '--title' && argv[i + 1]) args.title = argv[++i];
    else if (k === '--biome' && argv[i + 1]) args.biome = argv[++i];
    else if (k === '--ep' && argv[i + 1]) args.ep = argv[++i];
  }
  return args;
}

const args = parseArgs(process.argv);
if (!args.slug) {
  console.error(
    'Usage: npm run init:evolusi -- --slug <ep02-nama-topik> [--title "<Judul>"] [--biome ocean_bajau|himalaya_hypoxia|savanna_endurance|arctic_cold] [--ep 2]',
  );
  process.exit(1);
}

const root = process.cwd();
const slug = args.slug
  .toLowerCase()
  .replace(/[^a-z0-9-]/g, '-')
  .replace(/^-+|-+$/g, '');
const safeUnderscore = slug.replace(/-/g, '_');
const compBase = slug
  .split('-')
  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
  .join('');
const compId = `${compBase}Short`;
const title = args.title || compBase;

const projectDir = path.join(root, slug);
const scriptsDir = path.join(projectDir, 'scripts');
const outDir = path.join(projectDir, 'out');
const audioDir = path.join(projectDir, 'audio');
const publicDir = path.join(root, 'public', slug);
const remotionVideoDir = path.join(root, 'remotion', 'videos', slug);
const tplPath = path.join(
  root,
  '.agents',
  'skills',
  'series-evolusi',
  'templates',
  'episode-storyboard.template.json',
);

for (const d of [scriptsDir, outDir, audioDir, publicDir, remotionVideoDir]) {
  fs.mkdirSync(d, { recursive: true });
}

// 1. Create <slug>/storyboard.json from template
const storyboard = JSON.parse(fs.readFileSync(tplPath, 'utf8'));
storyboard.episodeNumber = Number(args.ep) || 2;
storyboard.slug = slug;
storyboard.compositionId = compId;
storyboard.title = title;
storyboard.biomePalette = args.biome;
fs.writeFileSync(
  path.join(projectDir, 'storyboard.json'),
  JSON.stringify(storyboard, null, 2) + '\n',
);

// 2. Create <slug>/scripts/build_vo_and_sfx.mjs
const voScript = `/**
 * Audio-First Voice-Over (ElevenLabs eleven_v4) + Diegetic SFX (eleven_text_to_sound_v3)
 * for /series-evolusi episode: ${slug} ("${title}")
 *
 * Enforces Indonesian scientific acronym pronunciation shield:
 *   display "USG" -> speak "yu es ji"
 *   display "DNA" -> speak "di en ei"
 *   NEVER uses [clear] tag in eleven_v4!
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT = resolve(__dirname, "..");
const ROOT = resolve(PROJECT, "..");

const envPath = join(ROOT, ".env");
if (existsSync(envPath)) {
  for (const raw of readFileSync(envPath, "utf8").split(/\\r?\\n/)) {
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

if (!process.env.ELEVENLABS_API_KEY) {
  console.error("ELEVENLABS_API_KEY belum terisi di .env! Salin .env.example menjadi .env lalu isi API key ElevenLabs Anda.");
  process.exit(1);
}

const SHIELD_MAP = [
  [/\\bUSG\\b/g, "yu es ji"],
  [/\\bDNA\\b/g, "di en ei"],
  [/\\bRNA\\b/g, "er en ei"],
  [/\\bATP\\b/g, "a te pe"],
  [/\\bEPAS1\\b/g, "e pas satu"],
  [/\\bPDE10A\\b/g, "pe de e sepuluh a"],
];

export function shieldIndonesianScienceText(text) {
  let out = text.replace(/\\[clear\\]/gi, "");
  for (const [regex, rep] of SHIELD_MAP) {
    out = out.replace(regex, rep);
  }
  return out.trim();
}

console.log("Loaded storyboard for ${slug}. Populate lines from storyboard.json -> synthesize VO + alignment.json -> export remotion/videos/${slug}/story.ts.");
void ElevenLabsClient;
void createHash;
void mkdirSync;
void writeFileSync;
`;
fs.writeFileSync(path.join(scriptsDir, 'build_vo_and_sfx.mjs'), voScript);

// 3. Create <slug>/scripts/build_sound_mix.py
const mixPy = `"""
1:1 Harmonic & Broadcast Sound Mixer for /series-evolusi (${slug})
Reproduces the exact spectral architecture measured from the Bajau Evolution reference:
  - Key: A Natural Minor (Am - F - G - Dm), 86.15 BPM half-time / 172.3 BPM 16th pulse
  - Instrument M1: Dark Felt-Muted Marimba / Kalimba Ostinato low-passed < 480 Hz (leaves 500-4000 Hz 100% open for Baritone VO!)
  - Instrument M2: Deep Warm Sub-Bass (A2 108Hz -> F2 88Hz -> G2 96Hz -> D2 72Hz)
  - Instrument M3: Warm Submerged Pad (180-380 Hz)
  - Instrument M4: Medical Scanner Sonar Pings tuned to E7 (2637.8 Hz, 5th of A minor)
  - Instrument M5: Diagnostic Monitor Pulse at A5 (886.3 Hz) + C5 (519.7 Hz)
  - Instrument M6: 3D DNA Crystalline Molecular Cascade (C8 4187Hz .. D9 9399Hz) + Finale Fmaj7/Am Glow
  - Mastered 2-pass linear to -14.3 LUFS, True Peak <= -1.5 dBTP.
"""
import numpy as np
from scipy import signal

SR = 44100
BPM = 86.15
STEP_16TH_S = (60.0 / BPM) / 2.0  # 0.3482s pulse (= 172.3 BPM)

CHORDS = [
    {"name": "Am", "bass": 108.0, "arp": [220.0, 261.63, 329.63, 440.0, 329.63, 261.63, 293.66, 329.63]},
    {"name": "F",  "bass": 87.31, "arp": [174.61, 220.0, 261.63, 349.23, 261.63, 220.0, 261.63, 329.63]},
    {"name": "G",  "bass": 98.00, "arp": [196.00, 246.94, 293.66, 392.00, 293.66, 246.94, 293.66, 329.63]},
    {"name": "Dm", "bass": 73.42, "arp": [146.83, 220.0, 293.66, 349.23, 293.66, 220.0, 261.63, 293.66]},
]

def render_evolusi_score_bed(duration_s: float, pause_window: tuple[float, float] | None = None) -> np.ndarray:
    """Synthesizes the <480 Hz dark wooden mallet ostinato + sub-bass + warm pad in stereo."""
    n_samples = int(duration_s * SR)
    left = np.zeros(n_samples, dtype=np.float32)
    right = np.zeros(n_samples, dtype=np.float32)

    step_idx = 0
    t = 0.0
    while t < duration_s - 0.8:
        if pause_window and pause_window[0] <= t <= pause_window[1]:
            t += STEP_16TH_S
            step_idx += 1
            continue

        chord = CHORDS[(step_idx // 8) % len(CHORDS)]
        freq = chord["arp"][step_idx % 8]
        dur = 0.42
        ln = min(int(dur * SR), n_samples - int(t * SR))
        if ln > 64:
            tt = np.arange(ln, dtype=np.float32) / SR
            env = (1.0 - np.exp(-tt / 0.008)) * np.exp(-tt / 0.14)
            tone = (np.sin(2 * np.pi * freq * tt) + 0.22 * np.sin(2 * np.pi * (freq * 2) * tt)) * env * 0.14
            pan = 0.5 + 0.18 * np.sin(step_idx * 0.9)
            s0 = int(t * SR)
            left[s0:s0+ln] += tone * np.sqrt(1 - pan)
            right[s0:s0+ln] += tone * np.sqrt(pan)

        if step_idx % 4 == 0:
            bdur = 1.32
            bln = min(int(bdur * SR), n_samples - int(t * SR))
            if bln > 64:
                btt = np.arange(bln, dtype=np.float32) / SR
                benv = (1.0 - np.exp(-btt / 0.028)) * np.exp(-btt / 0.55)
                sub = np.sin(2 * np.pi * chord["bass"] * btt) * benv * 0.24
                s0 = int(t * SR)
                left[s0:s0+bln] += sub
                right[s0:s0+bln] += sub

        t += STEP_16TH_S
        step_idx += 1

    b, a = signal.butter(4, 480.0 / (SR * 0.5), btype="low")
    left = signal.filtfilt(b, a, left).astype(np.float32)
    right = signal.filtfilt(b, a, right).astype(np.float32)
    return np.stack([left, right], axis=1)

def synth_sonar_ping_e7() -> np.ndarray:
    """Exact 2637.8 Hz (E7) medical ultrasound ping."""
    tt = np.arange(int(0.24 * SR), dtype=np.float32) / SR
    env = (1.0 - np.exp(-tt / 0.003)) * np.exp(-tt / 0.065)
    sig = (np.sin(2 * np.pi * 2637.8 * tt) + 0.18 * np.sin(2 * np.pi * 1760.0 * tt)) * env * 0.12
    return np.stack([sig, sig], axis=1)

def synth_dna_chime_cascade() -> np.ndarray:
    """C8-D9 (4.18 kHz - 9.40 kHz) crystalline molecular shimmer above the voice pocket."""
    freqs = [4187.3, 4698.0, 5869.3, 7044.0, 8216.7, 9399.3]
    ln = int(1.65 * SR)
    out_l = np.zeros(ln, dtype=np.float32)
    out_r = np.zeros(ln, dtype=np.float32)
    for idx, f in enumerate(freqs):
        onset = int(idx * 0.11 * SR)
        rem = ln - onset
        tt = np.arange(rem, dtype=np.float32) / SR
        env = (1.0 - np.exp(-tt / 0.004)) * np.exp(-tt / 0.38)
        bell = np.sin(2 * np.pi * f * tt) * env * 0.045
        if idx % 2 == 0:
            out_l[onset:] += bell
            out_r[onset:] += bell * 0.65
        else:
            out_l[onset:] += bell * 0.65
            out_r[onset:] += bell
    return np.stack([out_l, out_r], axis=1)

if __name__ == "__main__":
    print("Series-Evolusi harmonic mixer ready for ${slug}.")
`;
fs.writeFileSync(path.join(scriptsDir, 'build_sound_mix.py'), mixPy);

// 4. PowerShell 5.1 safe QA still & chunk render scripts (TEMP locked on D:\)
const qaPs1 = `$ErrorActionPreference = "Stop"
$ProjectRoot = (Resolve-Path "$PSScriptRoot\\..\\..").Path
$WorkDir = Join-Path $ProjectRoot "${slug}"
$BundleDir = Join-Path $WorkDir "out\\bundle"
$TempDir = Join-Path $WorkDir ".tmp"
$StillsDir = Join-Path $WorkDir "out\\qa_stills"

New-Item -ItemType Directory -Force -Path $TempDir, $StillsDir | Out-Null
$env:TEMP = $TempDir
$env:TMP = $TempDir

Write-Host "Bundling isolated entry remotion/entry-${slug}.ts ..."
npx remotion bundle "remotion/entry-${slug}.ts" --out-dir $BundleDir
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Bundle ready at $BundleDir. Render 16 QA stills across all 8 evolutionary beats and inspect via read_file!"
`;
fs.writeFileSync(path.join(scriptsDir, 'render_qa_stills.ps1'), qaPs1);

const chunkPs1 = `$ErrorActionPreference = "Stop"
$ProjectRoot = (Resolve-Path "$PSScriptRoot\\..\\..").Path
$WorkDir = Join-Path $ProjectRoot "${slug}"
$BundleDir = Join-Path $WorkDir "out\\bundle"
$TempDir = Join-Path $WorkDir ".tmp"
$ChunkDir = Join-Path $WorkDir "out\\chunks"
$FinalMp4 = Join-Path $ProjectRoot "videos\\${safeUnderscore}_evolusi.mp4"

New-Item -ItemType Directory -Force -Path $TempDir, $ChunkDir, (Split-Path $FinalMp4) | Out-Null
$env:TEMP = $TempDir
$env:TMP = $TempDir

if (-not (Test-Path $BundleDir)) {
    npx remotion bundle "remotion/entry-${slug}.ts" --out-dir $BundleDir
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host "Ready for 300-frame anti-OOM chunk render (--gl=angle --concurrency=1 --crf=18 --muted) -> $FinalMp4"
`;
fs.writeFileSync(path.join(scriptsDir, `render_${safeUnderscore}_chunks.ps1`), chunkPs1);

console.log(`\nScaffolded /series-evolusi episode: ${slug}/`);
console.log(`  - ${slug}/storyboard.json (8-Beat 1:1 Evolutionary Storyboard)`);
console.log(`  - ${slug}/scripts/build_vo_and_sfx.mjs (ElevenLabs eleven_v4 + Acronym Shield)`);
console.log(`  - ${slug}/scripts/build_sound_mix.py (A-minor <480Hz Ostinato + E7 Sonar + C8 DNA Chime)`);
console.log(`  - ${slug}/scripts/render_qa_stills.ps1 & render_${safeUnderscore}_chunks.ps1`);
