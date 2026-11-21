$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "1. Rendering CnutShort with Remotion..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$rawVideo = "out/cnut/video_raw.mp4"
$finalVideo = "out/cnut/Raja_Cnut_Short_Indo.mp4"
$audioWav = "public/assets/audio/cnut-voice.wav"

if (-not (Test-Path "out/cnut")) {
    New-Item -ItemType Directory -Path "out/cnut" -Force | Out-Null
}

$browser = "C:/Program Files/Google/Chrome/Application/chrome.exe"

# Execute Remotion render with concurrency 1 and single WebGL canvas (rock solid)
npx remotion render remotion/index.ts CnutShort $rawVideo `
    --gl=angle `
    --browser-executable="$browser" `
    --codec=h264 `
    --crf=16 `
    --concurrency=1 `
    --timeout=120000 `
    --overwrite

if (-not (Test-Path $rawVideo)) {
    Write-Error "Render failed: $rawVideo not found"
}

Write-Host "`n==========================================" -ForegroundColor Green
Write-Host "2. Muxing Cartesia Voiceover into Final MP4..." -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

ffmpeg -y -i $rawVideo -i $audioWav `
    -c:v copy `
    -c:a aac -b:a 192k `
    -map 0:v:0 -map 1:a:0 `
    -shortest `
    $finalVideo

Write-Host "`n[SUCCESS] Final Video Created: $finalVideo" -ForegroundColor Green
Get-Item $finalVideo | Select-Object Name, Length, LastWriteTime

