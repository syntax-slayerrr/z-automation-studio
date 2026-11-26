param(
  [switch]$ForceBundle
)
$ErrorActionPreference = "Stop"
$ROOT = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $ROOT

# Lock Chromium/Remotion temp directory onto Drive D: so Drive C: never hits ENOSPC
$TMP_D = Join-Path $ROOT "korupsi-kumuh-ep03\.tmp"
New-Item -ItemType Directory -Force -Path $TMP_D | Out-Null
$env:TEMP = $TMP_D
$env:TMP = $TMP_D

$OUT_DIR = Join-Path $ROOT "korupsi-kumuh-ep03\out"
$BUNDLE_DIR = Join-Path $OUT_DIR "bundle"
$CHUNKS_DIR = Join-Path $OUT_DIR "chunks"
$VIDEOS_DIR = Join-Path $ROOT "videos"
$AUDIO_M4A = Join-Path $ROOT "public\korupsi-kumuh-ep03\audio_master.m4a"
$FINAL_MP4 = Join-Path $VIDEOS_DIR "kelompok3_korupsi_kumuh_worldforge.mp4"

New-Item -ItemType Directory -Force -Path $CHUNKS_DIR, $VIDEOS_DIR | Out-Null

$align = Get-Content -Raw (Join-Path $ROOT "korupsi-kumuh-ep03\audio\alignment.json") | ConvertFrom-Json
$totalFrames = [int]$align.totalFrames

if ($ForceBundle -or -not (Test-Path (Join-Path $BUNDLE_DIR "index.html"))) {
  Write-Host "=== [1/4] Bundling isolated remotion/entry-korupsi-ep03.ts ===" -ForegroundColor Cyan
  if (Test-Path $BUNDLE_DIR) { Remove-Item -Recurse -Force $BUNDLE_DIR }
  npx remotion bundle remotion/entry-korupsi-ep03.ts --out-dir $BUNDLE_DIR
  if ($LASTEXITCODE -ne 0) { throw "Bundle failed!" }
} else {
  Write-Host "=== [1/4] Reusing verified isolated bundle ===" -ForegroundColor Cyan
}

$CHUNK_SIZE = 300
$numChunks = [Math]::Ceiling($totalFrames / $CHUNK_SIZE)
Write-Host "=== [2/4] Rendering $numChunks Anti-OOM 3D Soft-Vinyl Full HD Chunks ($totalFrames frames @ 1080x1920 30fps) ===" -ForegroundColor Cyan

$chunkFiles = @()
for ($c = 0; $c -lt $numChunks; $c++) {
  $sFrame = $c * $CHUNK_SIZE
  $eFrame = [Math]::Min($totalFrames - 1, ($c + 1) * $CHUNK_SIZE - 1)
  $chunkMp4 = Join-Path $CHUNKS_DIR ("chunk_{0:D2}.mp4" -f $c)
  $chunkFiles += $chunkMp4

  if ((Test-Path $chunkMp4) -and ((Get-Item $chunkMp4).Length -gt 80000)) {
    Write-Host "  [Chunk $($c+1)/$numChunks] Cached ($sFrame..$eFrame)" -ForegroundColor DarkGray
    continue
  }

  Get-ChildItem -Path $TMP_D -Filter "remotion-*" -Directory -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  Write-Host "  [Chunk $($c+1)/$numChunks] Rendering frames $sFrame..$eFrame..." -ForegroundColor Yellow

  npx remotion render $BUNDLE_DIR KorupsiKumuhEp03Short $chunkMp4 --frames="$sFrame-$eFrame" --gl=angle --concurrency=1 --crf=18 --muted --log=error
  if ($LASTEXITCODE -ne 0 -or !(Test-Path $chunkMp4)) {
    Write-Host "    Retrying chunk $($c+1) after 3s..." -ForegroundColor Red
    Start-Sleep -Seconds 3
    Get-ChildItem -Path $TMP_D -Filter "remotion-*" -Directory -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    npx remotion render $BUNDLE_DIR KorupsiKumuhEp03Short $chunkMp4 --frames="$sFrame-$eFrame" --gl=angle --concurrency=1 --crf=18 --muted --log=error
    if ($LASTEXITCODE -ne 0 -or !(Test-Path $chunkMp4)) { throw "Chunk $($c+1) failed!" }
  }
  $sw.Stop()
  $sz = (Get-Item $chunkMp4).Length
  Write-Host ("  [Chunk {0}/{1}] Done in {2}s ({3:N0} bytes)" -f ($c+1), $numChunks, [Math]::Round($sw.Elapsed.TotalSeconds, 1), $sz) -ForegroundColor Green
}

Write-Host "`n=== [3/4] Lossless Concat + Broadcast Audio Mux (-14.5 LUFS) ===" -ForegroundColor Cyan
$concatTxt = Join-Path $OUT_DIR "concat_list.txt"
$lines = $chunkFiles | ForEach-Object { "file '$($_.Replace('\', '/'))'" }
[System.IO.File]::WriteAllLines($concatTxt, $lines, (New-Object System.Text.UTF8Encoding($false)))

$videoOnly = Join-Path $OUT_DIR "video_only.mp4"
if (Test-Path $videoOnly) { Remove-Item $videoOnly -Force }
if (Test-Path $FINAL_MP4) { Remove-Item $FINAL_MP4 -Force }

& ffmpeg -y -loglevel error -f concat -safe 0 -i $concatTxt -c copy $videoOnly
if ($LASTEXITCODE -ne 0) { throw "FFmpeg concat failed!" }

& ffmpeg -y -loglevel error -i $videoOnly -i $AUDIO_M4A -map 0:v:0 -map 1:a:0 -c:v copy -c:a copy -movflags +faststart -shortest $FINAL_MP4
if ($LASTEXITCODE -ne 0) { throw "FFmpeg audio mux failed!" }

Remove-Item $videoOnly -Force -ErrorAction SilentlyContinue

Write-Host "`n=== [4/4] Final MP4 Probe & 4x4 Decoded Storyboard Proof Sheet ===" -ForegroundColor Cyan
& ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,nb_frames,codec_name,color_space -of default=noprint_wrappers=1 $FINAL_MP4
& ffprobe -v error -show_entries format=duration,size -of default=noprint_wrappers=1 $FINAL_MP4

$proofJpg = Join-Path $OUT_DIR "final_mp4_storyboard_4x4.jpg"
$durSec = $totalFrames / 30.0
$stepSec = $durSec / 16.0
& ffmpeg -y -loglevel error -i $FINAL_MP4 -vf "fps=1/$stepSec,scale=360:640,tile=4x4" -frames:v 1 -q:v 3 $proofJpg
Write-Host "Saved Decoded 4x4 Proof Sheet: $proofJpg" -ForegroundColor Green
Write-Host "FINAL FULL HD 9:16 3D SOFT-VINYL MP4 READY -> $FINAL_MP4" -ForegroundColor Green
