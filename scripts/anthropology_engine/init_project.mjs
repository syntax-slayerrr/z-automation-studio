#!/usr/bin/env node
/**
 * 1-Command Project Scaffolder for the `anthropology-explanation` (Human Odyssey Filmic 2D) Style.
 *
 * Usage:
 *   node scripts/anthropology_engine/init_project.mjs --slug migrasi-nusantara --title "Jejak Pertama di Nusantara" --format 16:9
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

function parseArgs(argv) {
  const args = { slug: '', title: '', format: '9:16', seed: '1024', skipForge: false };
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--slug' && argv[i + 1]) args.slug = argv[++i];
    else if (k === '--title' && argv[i + 1]) args.title = argv[++i];
    else if (k === '--format' && argv[i + 1]) args.format = argv[++i];
    else if (k === '--seed' && argv[i + 1]) args.seed = argv[++i];
    else if (k === '--skip-forge') args.skipForge = true;
  }
  return args;
}

const args = parseArgs(process.argv);
if (!args.slug) {
  console.error('Usage: node scripts/anthropology_engine/init_project.mjs --slug <slug> --title "<Title>" [--format 9:16|16:9]');
  process.exit(1);
}

const root = process.cwd();
const slug = args.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
const title = args.title || slug.replace(/-/g, ' ');
const isLandscape = args.format === '16:9';
const width = isLandscape ? 1920 : 1080;
const height = isLandscape ? 1080 : 1920;

const projectDir = path.join(root, slug);
const texDir = path.join(root, 'public', slug, 'textures');
const templatesDir = path.join(root, '.agents', 'skills', 'anthropology-explanation', 'templates');

fs.mkdirSync(path.join(projectDir, 'scripts'), { recursive: true });
fs.mkdirSync(path.join(projectDir, 'out'), { recursive: true });
fs.mkdirSync(texDir, { recursive: true });

// 1. Copy & personalize art-bible.json and shot-plan.json from skill templates
const compId = slug
  .split('-')
  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
  .join('') + 'Film';

const artBibleTpl = JSON.parse(fs.readFileSync(path.join(templatesDir, 'art-bible.template.json'), 'utf8'));
artBibleTpl.meta = {
  ...artBibleTpl.meta,
  title,
  compositionId: compId,
};
artBibleTpl.format = {
  ...artBibleTpl.format,
  aspectRatio: args.format,
  width,
  height,
};
artBibleTpl.textureSeed = Number(args.seed);
fs.writeFileSync(path.join(projectDir, 'art-bible.json'), JSON.stringify(artBibleTpl, null, 2));

const shotPlanTpl = JSON.parse(fs.readFileSync(path.join(templatesDir, 'shot-plan.template.json'), 'utf8'));
shotPlanTpl.project = slug;
fs.writeFileSync(path.join(projectDir, 'shot-plan.json'), JSON.stringify(shotPlanTpl, null, 2));

// 2. Write Windows PowerShell safe chunked renderer template (D:\ temp isolation, anti-OOM)

const renderPs1 = `$ErrorActionPreference = "Continue"
$Slug = "${slug}"
$CompId = "${compId}"
$ProjectRoot = (Resolve-Path "$PSScriptRoot\\..\\..").Path
$WorkDir = Join-Path $ProjectRoot $Slug
$BundleDir = Join-Path $WorkDir ".bundle"
$TempDir = Join-Path $WorkDir ".tmp"
$ChunkDir = Join-Path $WorkDir "out\\chunks"
$OutDir = Join-Path $WorkDir "out"

New-Item -ItemType Directory -Force -Path $TempDir, $ChunkDir, $OutDir | Out-Null
$env:TEMP = $TempDir
$env:TMP = $TempDir

Write-Host "Bundling Remotion project once to $BundleDir ..."
npx remotion bundle remotion/index.ts --out-dir $BundleDir
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Render ready for $CompId. Add chunk loop & FFmpeg audio mux after building remotion/videos/$Slug/."
`;
fs.writeFileSync(path.join(projectDir, 'scripts', `render_${slug.replace(/-/g, '_')}_chunks.ps1`), renderPs1);

// 3. Forge deterministic procedural textures into public/<slug>/textures
if (!args.skipForge) {
  console.log(`Forging deterministic textures (${width}x${height}) into public/${slug}/textures ...`);
  execFileSync(
    'python',
    [
      path.join(root, 'scripts', 'anthropology_engine', 'texture_forge.py'),
      '--out',
      texDir,
      '--width',
      String(width),
      '--height',
      String(height),
      '--seed',
      String(args.seed),
    ],
    { stdio: 'inherit' },
  );
}

console.log(`\nInitialized Anthropology Explanation project: ${slug}/`);
console.log(`  - ${slug}/art-bible.json`);
console.log(`  - ${slug}/shot-plan.json`);
console.log(`  - ${slug}/scripts/render_${slug.replace(/-/g, '_')}_chunks.ps1`);
console.log(`  - public/${slug}/textures/ (16 pure-code procedural plates)`);
