param([switch]$ForceBundle)
$ErrorActionPreference = "Stop"

$root = "d:\PROJECTS\z-automation-studio"
$projDir = "$root\keseharian-agen-zaldy"
$bundleDir = "$projDir\out\bundle"
$chunksDir = "$projDir\out\chunks"
$outDir = "$root\videos"
$outMp4 = "$outDir\keseharian_agen_zaldy.mp4"
$proofJpg = "$projDir\out\final_mp4_storyboard_4x4.jpg"
$audioMaster = "$root\public\keseharian-agen-zaldy\audio_master.m4a"

Set-Location $root
if ($ForceBundle -and (Test-Path $chunksDir)) {
    Remove-Item -Recurse -Force $chunksDir
}
New-Item -ItemType Directory -Path $chunksDir, $outDir -Force | Out-Null

Write-Host "=== [1/5] Bundling remotion/entry-keseharian.ts ===" -ForegroundColor Cyan
if ($ForceBundle -or !(Test-Path "$bundleDir\index.html")) {
    if (Test-Path $bundleDir) { Remove-Item -Recurse -Force $bundleDir }
    & npx remotion bundle remotion/entry-keseharian.ts --out-dir $bundleDir
    if ($LASTEXITCODE -ne 0) { Write-Error "Bundle failed." }
} else {
    Write-Host "  Reusing existing bundle." -ForegroundColor DarkGreen
}

$align = Get-Content "$projDir\audio\alignment.json" -Raw | ConvertFrom-Json
$totalFrames = [int]$align.totalFrames
$chunkSize = 320
$numChunks = [math]::Ceiling($totalFrames / $chunkSize)

Write-Host "=== [2/5] Rendering $numChunks Anti-OOM Full HD Chunks ($totalFrames frames @ 1080x1920 30fps) ===" -ForegroundColor Cyan
$chunkFiles = @()

for ($i = 0; $i -lt $numChunks; $i++) {
    $startF = $i * $chunkSize
    $endF = [math]::Min(($i + 1) * $chunkSize - 1, $totalFrames - 1)
    $cFile = "$chunksDir\chunk_$($i.ToString('D2')).mp4"
    $chunkFiles += $cFile

    if ((Test-Path $cFile) -and (Get-Item $cFile).Length -gt 250000) {
        Write-Host "  [Chunk $($i+1)/$numChunks] CACHED: frames $startF..$endF" -ForegroundColor DarkGreen
        continue
    }

    Write-Host "  [Chunk $($i+1)/$numChunks] Rendering frames $startF..$endF..." -ForegroundColor Yellow
    & npx remotion render $bundleDir KeseharianAgenZaldy $cFile --frames="$startF-$endF" --gl=angle --concurrency=1 --crf=18 --muted --timeout=180000 --log=error
    if ($LASTEXITCODE -ne 0 -or !(Test-Path $cFile)) {
        Write-Host "    Retrying chunk $($i+1) after 3s..." -ForegroundColor Red
        Start-Sleep -Seconds 3
        & npx remotion render $bundleDir KeseharianAgenZaldy $cFile --frames="$startF-$endF" --gl=angle --concurrency=1 --crf=18 --muted --timeout=240000 --log=error
        if ($LASTEXITCODE -ne 0 -or !(Test-Path $cFile)) { Write-Error "Render failed on chunk $($i+1)" }
    }
}

Write-Host "=== [3/5] Lossless Concat + Mux Broadcast Audio Master (-14.50 LUFS) ===" -ForegroundColor Cyan
$listFile = "$chunksDir\concat_list.txt"
$lines = $chunkFiles | ForEach-Object { "file '$($_.Replace('\', '/'))'" }
[System.IO.File]::WriteAllLines($listFile, $lines, (New-Object System.Text.UTF8Encoding($false)))

$tempVideo = "$chunksDir\temp_video_only.mp4"
& ffmpeg -y -loglevel error -f concat -safe 0 -i $listFile -c copy $tempVideo
if ($LASTEXITCODE -ne 0) { Write-Error "Concat failed." }

& ffmpeg -y -loglevel error -i $tempVideo -i $audioMaster -map 0:v:0 -map 1:a:0 -c:v copy -c:a copy -movflags +faststart -shortest $outMp4
if ($LASTEXITCODE -ne 0) { Write-Error "Mux failed." }

Write-Host "=== [4/5] Verifying Final MP4 Integrity (ffprobe + 60-Frame Scan + 4x4 Proof Grid) ===" -ForegroundColor Cyan
& ffprobe -v error -show_entries format=duration,size,bit_rate -show_entries stream=codec_type,codec_name,width,height,r_frame_rate -of json $outMp4

& python -c "
import cv2, numpy as np
cap = cv2.VideoCapture(r'$outMp4')
total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
fps = cap.get(cv2.CAP_PROP_FPS)
assert w == 1080 and h == 1920, f'Wrong resolution {w}x{h}'
assert total > 2500, f'Too few frames: {total}'

blank_frames = 0
for i in range(60):
    f_idx = int((i / 59.0) * (total - 2))
    cap.set(cv2.CAP_PROP_POS_FRAMES, f_idx)
    ok, frame = cap.read()
    if not ok or frame is None or float(frame.std()) < 4.0:
        blank_frames += 1

assert blank_frames == 0, f'Detected {blank_frames} blank/corrupt frames!'
print(f'60-Frame Decoded Integrity Scan: 0 blank/corrupt frames (total={total}, {w}x{h} @ {fps:.2f}fps)')

tw, th = 270, 480
grid = np.zeros((th * 4, tw * 4, 3), dtype=np.uint8)
for k in range(16):
    f_idx = int((k / 15.0) * (total - 10))
    cap.set(cv2.CAP_PROP_POS_FRAMES, f_idx)
    ok, frame = cap.read()
    if ok and frame is not None:
        r, c = k // 4, k % 4
        grid[r*th:(r+1)*th, c*tw:(c+1)*tw] = cv2.resize(frame, (tw, th), interpolation=cv2.INTER_AREA)
        cv2.putText(grid, f't={f_idx/fps:.1f}s', (c*tw+10, r*th+30), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (255, 224, 102), 2, cv2.LINE_AA)
cap.release()
cv2.imwrite(r'$proofJpg', grid, [cv2.IMWRITE_JPEG_QUALITY, 90])
print('Saved 4x4 final MP4 proof sheet:', r'$proofJpg')
"
if ($LASTEXITCODE -ne 0) { Write-Error "MP4 integrity check failed." }

Write-Host "`nFinal Full HD Video Ready: $outMp4" -ForegroundColor Green
