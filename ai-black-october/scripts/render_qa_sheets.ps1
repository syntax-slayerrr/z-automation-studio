param(
  [switch]$ForceBundle
)
$ErrorActionPreference = "Stop"
$ROOT = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $ROOT

$OUT_DIR = Join-Path $ROOT "ai-black-october\out"
$BUNDLE_DIR = Join-Path $OUT_DIR "bundle"
$QA_DIR = Join-Path $OUT_DIR "qa_stills"
New-Item -ItemType Directory -Force -Path $QA_DIR | Out-Null

function Tile-Sequence($seqDir, $scale, $tile, $outJpg) {
  $pngs = Get-ChildItem -Path $seqDir -Filter "*.png" | Sort-Object Name
  if ($pngs.Count -eq 0) { throw "No PNGs found in $seqDir" }
  $normDir = Join-Path $seqDir "norm"
  New-Item -ItemType Directory -Force -Path $normDir | Out-Null
  $idx = 0
  foreach ($f in $pngs) {
    Copy-Item $f.FullName (Join-Path $normDir ("f_{0:D2}.png" -f $idx)) -Force
    $idx++
  }
  & ffmpeg -y -loglevel error -framerate 1 -i "$normDir\f_%02d.png" -vf "scale=${scale},tile=${tile}" -frames:v 1 -q:v 2 $outJpg
  if ($LASTEXITCODE -ne 0) { throw "FFmpeg tile failed for $outJpg" }
  Write-Host "  Saved: $outJpg ($($pngs.Count) frames)"
}

if ($ForceBundle -or -not (Test-Path (Join-Path $BUNDLE_DIR "index.html"))) {
  Write-Host "=== [1/4] Bundling remotion/entry-ai-black-october.ts ==="
  npx remotion bundle remotion/entry-ai-black-october.ts --out-dir $BUNDLE_DIR
  if ($LASTEXITCODE -ne 0) { throw "Bundle failed!" }
} else {
  Write-Host "=== [1/4] Reusing bundle at $BUNDLE_DIR ==="
}

Write-Host "=== [2/4] Rendering 10 Shot QA Stills (SH01..SH10) ==="
$shotsSeq = Join-Path $QA_DIR "shots"
if (Test-Path $shotsSeq) { Remove-Item $shotsSeq -Recurse -Force }
New-Item -ItemType Directory -Force -Path $shotsSeq | Out-Null
npx remotion render $BUNDLE_DIR AiBlackOctoberShotsQA $shotsSeq --sequence --image-format=png --gl=angle --concurrency=1 --log=error
if ($LASTEXITCODE -ne 0) { throw "Shots QA render failed!" }
Tile-Sequence $shotsSeq "432:768" "5x2" (Join-Path $OUT_DIR "qa_all_shots.jpg")

Write-Host "=== [3/4] Rendering 6 Native 1:1 Real macOS Laptop UI Screens ==="
$screensSeq = Join-Path $QA_DIR "screens"
if (Test-Path $screensSeq) { Remove-Item $screensSeq -Recurse -Force }
New-Item -ItemType Directory -Force -Path $screensSeq | Out-Null
npx remotion render $BUNDLE_DIR AiBlackOctoberScreensQA $screensSeq --sequence --image-format=png --gl=angle --concurrency=1 --log=error
if ($LASTEXITCODE -ne 0) { throw "Screens QA render failed!" }
Tile-Sequence $screensSeq "640:400" "3x2" (Join-Path $OUT_DIR "qa_laptop_screens.jpg")

Write-Host "=== [4/4] Rendering 6 Motion / Lip-Sync / Pull-Out Strip Stills ==="
$motionSeq = Join-Path $QA_DIR "motion"
if (Test-Path $motionSeq) { Remove-Item $motionSeq -Recurse -Force }
New-Item -ItemType Directory -Force -Path $motionSeq | Out-Null
npx remotion render $BUNDLE_DIR AiBlackOctoberMotionQA $motionSeq --sequence --image-format=png --gl=angle --concurrency=1 --log=error
if ($LASTEXITCODE -ne 0) { throw "Motion QA render failed!" }
Tile-Sequence $motionSeq "432:768" "3x2" (Join-Path $OUT_DIR "qa_motion_strip.jpg")

Write-Host "=== ALL 3 VISUAL QA SHEETS READY! ==="
