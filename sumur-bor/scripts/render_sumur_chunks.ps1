$ErrorActionPreference = "Stop"

$Root = "d:\PROJECTS\z-automation-studio"
$OutDir = "$Root\sumur-bor\out"
$BundleDir = "$OutDir\bundle"
$ChunkDir = "$OutDir\chunks"
$AudioMaster = "$Root\public\sumur-bor\audio_master.m4a"
$FinalMp4 = "$Root\videos\bedah_sumur_bor.mp4"

$TotalFrames = 3868
$ChunkSize = 240

New-Item -ItemType Directory -Force -Path $OutDir, $ChunkDir, "$Root\videos" | Out-Null
Set-Location $Root

if (-not (Test-Path "$BundleDir\index.html")) {
  Write-Host "=== Bundling remotion/entry-sumur.ts -> $BundleDir ===" -ForegroundColor Cyan
  npx remotion bundle remotion/entry-sumur.ts --out-dir $BundleDir
  if ($LASTEXITCODE -ne 0) { throw "Bundle failed!" }
} else {
  Write-Host "=== Reusing existing bundle at $BundleDir ===" -ForegroundColor Yellow
}

function Get-FrameCount($Path) {
  if (-not (Test-Path $Path)) { return 0 }
  $out = & ffprobe -v error -select_streams v:0 -count_packets -show_entries stream=nb_read_packets -of csv=p=0 $Path 2>$null
  if ($out -match '^\d+$') { return [int]$out }
  return 0
}

$ChunkFiles = @()
$chunkIdx = 0
for ($start = 0; $start -lt $TotalFrames; $start += $ChunkSize) {
  $chunkIdx++
  $end = [Math]::Min($start + $ChunkSize - 1, $TotalFrames - 1)
  $expected = $end - $start + 1
  $cName = "chunk_{0:D2}_{1:D4}_{2:D4}.mp4" -f $chunkIdx, $start, $end
  $cPath = Join-Path $ChunkDir $cName
  $ChunkFiles += $cPath

  $existing = Get-FrameCount $cPath
  if ($existing -eq $expected) {
    Write-Host ("  [SKIP] {0} already complete ({1} frames)" -f $cName, $existing) -ForegroundColor DarkGray
    continue
  }

  $ok = $false
  for ($attempt = 1; $attempt -le 3; $attempt++) {
    Write-Host ("  [RENDER] {0} (frames {1}-{2}, {3} frames, attempt {4})..." -f $cName, $start, $end, $expected, $attempt) -ForegroundColor Cyan
    npx remotion render $BundleDir SumurBorShort $cPath `
      --frames="$start-$end" `
      --gl=angle `
      --concurrency=1 `
      --muted `
      --codec=h264 `
      --pixel-format=yuv420p `
      --color-space=bt709 `
      --crf=17 `
      --props="$Root\sumur-bor\scripts\muted_props.json"
    if ($LASTEXITCODE -eq 0) {
      $verified = Get-FrameCount $cPath
      if ($verified -eq $expected) {
        $ok = $true
        break
      }
      Write-Host ("  [WARN] Frame mismatch on {0}: got {1}, expected {2}. Retrying..." -f $cName, $verified, $expected) -ForegroundColor Yellow
    } else {
      Write-Host ("  [WARN] Remotion exited with code {0} on {1}. Retrying in 3s..." -f $LASTEXITCODE, $cName) -ForegroundColor Yellow
    }
    Start-Sleep -Seconds 3
  }
  if (-not $ok) { throw "Chunk render failed on $cName after 3 attempts" }
}

Write-Host "=== Concatenating & Muxing Bit-Exact Master Audio (-14.8 LUFS) ===" -ForegroundColor Cyan
$ConcatList = Join-Path $ChunkDir "concat.txt"
$ChunkFiles | ForEach-Object { "file '$($_.Replace('\', '/'))'" } | Set-Content -Encoding ASCII $ConcatList

ffmpeg -y -f concat -safe 0 -i $ConcatList -i $AudioMaster `
  -map 0:v:0 -map 1:a:0 `
  -c:v copy -c:a copy `
  -movflags +faststart `
  -shortest `
  $FinalMp4
if ($LASTEXITCODE -ne 0) { throw "Final mux failed!" }

Write-Host "=== FINAL MP4 READY: $FinalMp4 ===" -ForegroundColor Green
ffprobe -v error -show_entries format=duration,size,bit_rate -show_entries stream=codec_name,width,height,r_frame_rate,pix_fmt,nb_frames,sample_rate,channels -of default=noprint_wrappers=1 $FinalMp4

