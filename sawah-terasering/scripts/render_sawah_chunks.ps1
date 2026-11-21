$ErrorActionPreference = "Stop"

$root = "d:\PROJECTS\z-automation-studio"
$outDir = "$root\sawah-terasering\out"
$chunksDir = "$outDir\chunks"
$bundleDir = "$outDir\bundle"
$finalMp4 = "$outDir\kenapa_sawah_terasering.mp4"
$audioMaster = "$root\public\sawah-terasering\audio_master.m4a"

Set-Location $root

# Always re-bundle fresh isolated entry-sawah.ts so latest visual & IK refinements are guaranteed
Write-Host "=== [1/4] Bundling isolated remotion/entry-sawah.ts -> $bundleDir ===" -ForegroundColor Cyan
if (Test-Path $bundleDir) { Remove-Item -Recurse -Force $bundleDir }
& npx remotion bundle remotion/entry-sawah.ts --out-dir $bundleDir
if ($LASTEXITCODE -ne 0) { Write-Error "Bundle failed." }

# Read dynamic totalFrames from alignment.json
$align = Get-Content "$root\sawah-terasering\audio\alignment.json" -Raw | ConvertFrom-Json
$totalFrames = [int]$align.totalFrames
$chunkSize = 240

if (Test-Path $chunksDir) { Remove-Item -Recurse -Force $chunksDir }
New-Item -ItemType Directory -Path $chunksDir -Force | Out-Null

$chunks = @()
$cid = 0
for ($start = 0; $start -lt $totalFrames; $start += $chunkSize) {
    $end = [Math]::Min($totalFrames - 1, $start + $chunkSize - 1)
    $chunks += @{ id = $cid; start = $start; end = $end }
    $cid++
}

Write-Host ("=== [2/4] Rendering SawahTeraseringShort 1080x1920 Full HD ({0} frames across {1} chunks) ===" -f $totalFrames, $chunks.Count) -ForegroundColor Cyan

foreach ($c in $chunks) {
    $pad = "{0:D2}" -f $c.id
    $chunkFile = "$chunksDir\chunk_$pad.mp4"
    $frameRange = "$($c.start)-$($c.end)"

    Get-ChildItem -Path $env:TEMP -Filter "remotion-*" -Directory -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

    Write-Host "  Chunk $pad : frames $frameRange..." -ForegroundColor Yellow
    $sw = [System.Diagnostics.Stopwatch]::StartNew()

    & npx remotion render $bundleDir SawahTeraseringShort $chunkFile --frames=$frameRange --concurrency=1 --timeout=150000 --gl=angle --muted --log=error
    if ($LASTEXITCODE -ne 0 -or !(Test-Path $chunkFile)) {
        Write-Host "  Chunk $pad failed, retrying once..." -ForegroundColor Red
        Start-Sleep -Seconds 3
        Get-ChildItem -Path $env:TEMP -Filter "remotion-*" -Directory -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
        & npx remotion render $bundleDir SawahTeraseringShort $chunkFile --frames=$frameRange --concurrency=1 --timeout=180000 --gl=angle --muted --log=error
        if ($LASTEXITCODE -ne 0 -or !(Test-Path $chunkFile)) {
            Write-Error "Failed to render chunk $pad after retry."
        }
    }

    $sw.Stop()
    $sz = (Get-Item $chunkFile).Length
    Write-Host ("  Chunk $pad done in {0}s ({1:N0} bytes)" -f [Math]::Round($sw.Elapsed.TotalSeconds, 1), $sz) -ForegroundColor Green
}

Write-Host "`n=== [3/4] Lossless Concat + Broadcast Audio Mux ===" -ForegroundColor Cyan
$concatFile = "$chunksDir\concat_list.txt"
$concatContent = ($chunks | ForEach-Object { "file 'chunk_{0:D2}.mp4'" -f $_.id }) -join "`r`n"
Set-Content -Path $concatFile -Value $concatContent -Encoding ASCII

$tempVideo = "$outDir\video_no_audio.mp4"
if (Test-Path $tempVideo) { Remove-Item $tempVideo -Force }
if (Test-Path $finalMp4) { Remove-Item $finalMp4 -Force }

& ffmpeg -y -loglevel error -f concat -safe 0 -i $concatFile -c copy $tempVideo
if ($LASTEXITCODE -ne 0) { Write-Error "FFmpeg concat failed." }

& ffmpeg -y -loglevel error -i $tempVideo -i $audioMaster -c:v copy -c:a copy -movflags +faststart -shortest $finalMp4
if ($LASTEXITCODE -ne 0) { Write-Error "FFmpeg audio mux failed." }

Remove-Item $tempVideo -Force -ErrorAction SilentlyContinue

Write-Host "`n=== [4/4] Final MP4 Probe & Decoded 16-Frame Storyboard Verification ===" -ForegroundColor Cyan
& ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,nb_frames,codec_name,color_space -of default=noprint_wrappers=1 $finalMp4
& ffprobe -v error -show_entries format=duration,size -of default=noprint_wrappers=1 $finalMp4

$boardImg = "$outDir\final_mp4_storyboard_4x4.jpg"
& ffmpeg -y -loglevel error -i $finalMp4 -vf "fps=16/$([Math]::Max(1, [Math]::Round($totalFrames/30.0, 2))),scale=360:640,tile=4x4" -frames:v 1 -q:v 3 $boardImg
Write-Host "Decoded Storyboard -> $boardImg" -ForegroundColor Green
Write-Host "FINAL 1080x1920 MP4 -> $finalMp4" -ForegroundColor Green
