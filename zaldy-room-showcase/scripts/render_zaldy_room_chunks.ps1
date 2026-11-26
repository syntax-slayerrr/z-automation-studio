param(
  [switch]$ForceBundle
)
$ErrorActionPreference = "Stop"
$ROOT = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $ROOT

$OUT_DIR = Join-Path $ROOT "zaldy-room-showcase\out"
$BUNDLE_DIR = Join-Path $OUT_DIR "bundle"
$CHUNKS_DIR = Join-Path $OUT_DIR "chunks"
$VIDEOS_DIR = Join-Path $ROOT "videos"
$AUDIO_M4A = Join-Path $ROOT "public\zaldy-room-showcase\audio_master.m4a"
$FINAL_MP4 = Join-Path $VIDEOS_DIR "kamar_baru_zaldy_3d.mp4"

New-Item -ItemType Directory -Force -Path $CHUNKS_DIR, $VIDEOS_DIR | Out-Null

$alignJson = Get-Content -Raw (Join-Path $ROOT "zaldy-room-showcase\audio\alignment.json") | ConvertFrom-Json
$totalFrames = [int]$alignJson.totalFrames

if ($ForceBundle -or -not (Test-Path (Join-Path $BUNDLE_DIR "index.html"))) {
  Write-Host "=== [1/4] Bundling remotion/entry-zaldy-room.ts ==="
  npx remotion bundle remotion/entry-zaldy-room.ts --out-dir $BUNDLE_DIR
  if ($LASTEXITCODE -ne 0) { throw "Bundle failed!" }
} else {
  Write-Host "=== [1/4] Reusing verified bundle ==="
}

$CHUNK_SIZE = 320
$numChunks = [Math]::Ceiling($totalFrames / $CHUNK_SIZE)
Write-Host "=== [2/4] Rendering $numChunks Anti-OOM Full HD Chunks ($totalFrames frames @ 1080x1920 30fps) ==="

$chunkFiles = @()
for ($c = 0; $c -lt $numChunks; $c++) {
  $sFrame = $c * $CHUNK_SIZE
  $eFrame = [Math]::Min($totalFrames - 1, ($c + 1) * $CHUNK_SIZE - 1)
  $chunkMp4 = Join-Path $CHUNKS_DIR ("chunk_{0:D2}.mp4" -f $c)
  $chunkFiles += $chunkMp4

  if ((Test-Path $chunkMp4) -and ((Get-Item $chunkMp4).Length -gt 80000)) {
    Write-Host "  [Chunk $($c+1)/$numChunks] Cached ($sFrame..$eFrame)"
    continue
  }

  Write-Host "  [Chunk $($c+1)/$numChunks] Rendering frames $sFrame..$eFrame..."
  npx remotion render $BUNDLE_DIR ZaldyRoomShowcase $chunkMp4 --frames="$sFrame-$eFrame" --gl=angle --concurrency=1 --crf=18 --muted --log=error
  if ($LASTEXITCODE -ne 0) {
    Write-Host "    Retrying chunk $($c+1) after 3s..."
    Start-Sleep -Seconds 3
    npx remotion render $BUNDLE_DIR ZaldyRoomShowcase $chunkMp4 --frames="$sFrame-$eFrame" --gl=angle --concurrency=1 --crf=18 --muted --log=error
    if ($LASTEXITCODE -ne 0) { throw "Chunk $($c+1) failed!" }
  }
}

Write-Host "=== [3/4] Lossless Concat + Mux Broadcast Audio Master (-14.50 LUFS) ==="
$concatTxt = Join-Path $OUT_DIR "concat_list.txt"
$lines = $chunkFiles | ForEach-Object { "file '$($_.Replace('\', '/'))'" }
[System.IO.File]::WriteAllLines($concatTxt, $lines, (New-Object System.Text.UTF8Encoding($false)))

$videoOnly = Join-Path $OUT_DIR "video_only.mp4"
& ffmpeg -y -loglevel error -f concat -safe 0 -i $concatTxt -c copy $videoOnly
& ffmpeg -y -loglevel error -i $videoOnly -i $AUDIO_M4A -map 0:v:0 -map 1:a:0 -c:v copy -c:a copy -movflags +faststart -shortest $FINAL_MP4

Write-Host "=== [4/4] Verifying Final MP4 Integrity (ffprobe + 4x4 Decoded Proof Sheet) ==="
& ffprobe -v error -show_format -show_streams -of json $FINAL_MP4

$proofJpg = Join-Path $OUT_DIR "final_mp4_storyboard_4x4.jpg"
$durSec = $totalFrames / 30.0
$stepSec = $durSec / 16.0
& ffmpeg -y -loglevel error -i $FINAL_MP4 -vf "fps=1/$stepSec,scale=360:640,tile=4x4" -frames:v 1 -q:v 3 $proofJpg
Write-Host "Saved 4x4 final MP4 proof sheet: $proofJpg"
Write-Host "Final Full HD Video Ready: $FINAL_MP4"
