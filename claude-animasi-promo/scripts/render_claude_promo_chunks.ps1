$ErrorActionPreference = "Stop"

$root = "d:\PROJECTS\z-automation-studio"
$outDir = "$root\claude-animasi-promo\out"
$chunksDir = "$outDir\chunks"
$bundleDir = "$outDir\bundle"
$FinalMp4 = "$Root\videos\masih_susah_bikin_animasi_claude.mp4"
$audioMaster = "$root\public\claude-animasi-promo\audio_master.m4a"

Set-Location $root

Write-Host "=== [1/4] Checking / Bundling remotion/entry-claude-promo.ts ===" -ForegroundColor Cyan
if (!(Test-Path "$bundleDir\index.html")) {
    if (Test-Path $bundleDir) { Remove-Item -Recurse -Force $bundleDir }
    & npx remotion bundle remotion/entry-claude-promo.ts --out-dir $bundleDir
    if ($LASTEXITCODE -ne 0) { Write-Error "Bundle failed." }
}

$align = Get-Content "$root\claude-animasi-promo\audio\alignment.json" -Raw | ConvertFrom-Json
$totalFrames = [int]$align.totalFrames
$chunkSize = 350

if (!(Test-Path $chunksDir)) { New-Item -ItemType Directory -Path $chunksDir -Force | Out-Null }

$chunks = @()
$cid = 0
for ($start = 0; $start -lt $totalFrames; $start += $chunkSize) {
    $end = [Math]::Min($totalFrames - 1, $start + $chunkSize - 1)
    $chunks += @{ id = $cid; start = $start; end = $end }
    $cid++
}

Write-Host ("=== [2/4] Rendering ClaudeAnimasiPromo 1080x1920 Full HD ({0} frames / {1} chunks) ===" -f $totalFrames, $chunks.Count) -ForegroundColor Cyan
foreach ($c in $chunks) {
    $pad = "{0:D2}" -f $c.id
    $chunkFile = "$chunksDir\chunk_$pad.mp4"
    $frameRange = "$($c.start)-$($c.end)"
    if ((Test-Path $chunkFile) -and (Get-Item $chunkFile).Length -gt 500000) {
        Write-Host ("  Chunk $pad already rendered ({0:N0} bytes) - skipping!" -f (Get-Item $chunkFile).Length) -ForegroundColor DarkGreen
        continue
    }

    Write-Host "  Chunk $pad : frames $frameRange..." -ForegroundColor Yellow
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    & npx remotion render $bundleDir ClaudeAnimasiPromo $chunkFile --frames=$frameRange --gl=angle --concurrency=1 --timeout=180000 --muted --log=error
    if ($LASTEXITCODE -ne 0 -or !(Test-Path $chunkFile)) {
        Write-Host "  Chunk $pad failed, retrying after brief pause..." -ForegroundColor Red
        Start-Sleep -Seconds 3
        & npx remotion render $bundleDir ClaudeAnimasiPromo $chunkFile --frames=$frameRange --gl=angle --concurrency=1 --timeout=240000 --muted --log=error
        if ($LASTEXITCODE -ne 0 -or !(Test-Path $chunkFile)) { Write-Error "Failed chunk $pad" }
    }
    $sw.Stop()
    Write-Host ("  Chunk $pad done in {0}s ({1:N0} bytes)" -f [Math]::Round($sw.Elapsed.TotalSeconds, 1), (Get-Item $chunkFile).Length) -ForegroundColor Green
}

Write-Host "`n=== [3/4] Lossless Concat + Broadcast Audio Mux ===" -ForegroundColor Cyan
$concatFile = "$chunksDir\concat_list.txt"
($chunks | ForEach-Object { "file 'chunk_{0:D2}.mp4'" -f $_.id }) -join "`r`n" | Set-Content -Path $concatFile -Encoding ASCII

$tempVideo = "$outDir\video_no_audio.mp4"
if (Test-Path $tempVideo) { Remove-Item $tempVideo -Force }
if (Test-Path $finalMp4) { Remove-Item $finalMp4 -Force }

& ffmpeg -y -loglevel error -f concat -safe 0 -i $concatFile -c copy $tempVideo
& ffmpeg -y -loglevel error -i $tempVideo -i $audioMaster -c:v copy -c:a copy -movflags +faststart -shortest $finalMp4
Remove-Item $tempVideo -Force -ErrorAction SilentlyContinue

Write-Host "`n=== [4/4] Final MP4 Probe & Decoded 16-Frame Storyboard ===" -ForegroundColor Cyan
& ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,nb_frames,codec_name -of default=noprint_wrappers=1 $finalMp4
& ffprobe -v error -show_entries format=duration,size -of default=noprint_wrappers=1 $finalMp4

$boardImg = "$outDir\final_mp4_storyboard_4x4.jpg"
& ffmpeg -y -loglevel error -i $finalMp4 -vf "fps=16/$([Math]::Max(1, [Math]::Round($totalFrames/30.0, 2))),scale=360:640,tile=4x4" -frames:v 1 -q:v 3 $boardImg
Write-Host "FINAL 1080x1920 MP4 -> $finalMp4" -ForegroundColor Green

