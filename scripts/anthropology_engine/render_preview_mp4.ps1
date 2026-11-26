param(
  [string]$CompId = "AnthropologyShowcase",
  [string]$OutMp4 = "anthropology-showcase/out/anthropology_showcase_tiktok_9x16.mp4",
  [int]$Concurrency = 2
)

$ErrorActionPreference = "Continue"
$Root = (Resolve-Path "$PSScriptRoot\..\..").Path
$OutAbs = Join-Path $Root $OutMp4
$WorkBase = Split-Path (Split-Path $OutAbs -Parent) -Parent
$BundleDir = Join-Path $WorkBase ".bundle"
$TempDir = Join-Path $WorkBase ".tmp"

New-Item -ItemType Directory -Force -Path (Split-Path $OutAbs -Parent), $TempDir | Out-Null
$env:TEMP = $TempDir
$env:TMP = $TempDir

if (-not (Test-Path (Join-Path $BundleDir "index.html"))) {
  Write-Host "Bundling Remotion entry once -> $BundleDir"
  npx remotion bundle remotion/index.ts --out-dir $BundleDir
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host "Rendering 9:16 TikTok MP4 -> $OutAbs (concurrency=$Concurrency)..."
npx remotion render $BundleDir $CompId $OutAbs --codec=h264 --pixel-format=yuv420p --crf=18 --color-space=bt709 --concurrency=$Concurrency
if ($LASTEXITCODE -ne 0) {
  Write-Error "Remotion MP4 render failed (exit $LASTEXITCODE)"
  exit $LASTEXITCODE
}

Write-Host "Verifying MP4 stream metadata via ffprobe..."
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,nb_frames,codec_name,pix_fmt -show_entries format=duration,size -of default=noprint_wrappers=1 $OutAbs

Remove-Item -Recurse -Force -ErrorAction SilentlyContinue $BundleDir, $TempDir
Write-Host "DONE -> $OutAbs"
