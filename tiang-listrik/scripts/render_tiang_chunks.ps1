$ErrorActionPreference = "Stop"

$root = "d:\PROJECTS\z-automation-studio"
$outDir = "$root\tiang-listrik\out"
$chunksDir = "$outDir\chunks"
$bundleDir = "$outDir\bundle"
$FinalMp4 = "$Root\videos\kenapa_tiang_listrik_desa.mp4"
$audioMaster = "$root\public\tiang-listrik\audio_master.m4a"

Set-Location $root

# Clean old chunks for fresh 1:1 render
if (Test-Path $chunksDir) { Remove-Item -Recurse -Force $chunksDir }
New-Item -ItemType Directory -Path $chunksDir -Force | Out-Null

# Ensure bundle exists from isolated entry
if (-not (Test-Path "$bundleDir\index.html")) {
    Write-Host "Bundling isolated entry-tiang.ts -> $bundleDir..." -ForegroundColor Cyan
    if (Test-Path $bundleDir) { Remove-Item -Recurse -Force $bundleDir }
    & npx remotion bundle remotion/entry-tiang.ts --out-dir $bundleDir
}

$chunks = @(
    @{ id = 0; start = 0;    end = 310 },
    @{ id = 1; start = 311;  end = 621 },
    @{ id = 2; start = 622;  end = 932 },
    @{ id = 3; start = 933;  end = 1243 },
    @{ id = 4; start = 1244; end = 1554 },
    @{ id = 5; start = 1555; end = 1865 },
    @{ id = 6; start = 1866; end = 2176 },
    @{ id = 7; start = 2177; end = 2487 },
    @{ id = 8; start = 2488; end = 2798 },
    @{ id = 9; start = 2799; end = 3106 }
)

Write-Host "=== Starting TiangListrik 1:1 Overhaul Chunked Render (3,107 frames total) ===" -ForegroundColor Cyan

foreach ($c in $chunks) {
    $pad = "{0:D2}" -f $c.id
    $chunkFile = "$chunksDir\chunk_$pad.mp4"
    $frameRange = "$($c.start)-$($c.end)"
    
    # Clean temp remotion dirs before chunk
    Get-ChildItem -Path $env:TEMP -Filter "remotion-*" -Directory -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    
    Write-Host "Rendering Chunk $pad : frames $frameRange..." -ForegroundColor Yellow
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    
    & npx remotion render $bundleDir TiangListrikShort $chunkFile --frames=$frameRange --concurrency=1 --timeout=120000 --gl=angle --muted --log=error
    
    if ($LASTEXITCODE -ne 0 -or !(Test-Path $chunkFile)) {
        Write-Host "Error rendering chunk $pad, retrying once..." -ForegroundColor Red
        Start-Sleep -Seconds 3
        Get-ChildItem -Path $env:TEMP -Filter "remotion-*" -Directory -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
        & npx remotion render $bundleDir TiangListrikShort $chunkFile --frames=$frameRange --concurrency=1 --timeout=150000 --gl=angle --muted --log=error
        if ($LASTEXITCODE -ne 0 -or !(Test-Path $chunkFile)) {
            Write-Error "Failed to render chunk $pad after retry. Aborting."
        }
    }
    
    $stopwatch.Stop()
    $chunkSize = (Get-Item $chunkFile).Length
    Write-Host "Chunk $pad done in $([Math]::Round($stopwatch.Elapsed.TotalSeconds, 1))s ($chunkSize bytes)." -ForegroundColor Green
}

Write-Host "`nAll 10 chunks rendered! Concatenating chunks..." -ForegroundColor Cyan

$concatFile = "$chunksDir\concat_list.txt"
$concatContent = ($chunks | ForEach-Object {
    $pad = "{0:D2}" -f $_.id
    "file 'chunk_$pad.mp4'"
}) -join "`r`n"

Set-Content -Path $concatFile -Value $concatContent -Encoding ASCII

$tempVideo = "$outDir\video_no_audio.mp4"
if (Test-Path $tempVideo) { Remove-Item $tempVideo -Force }
if (Test-Path $finalMp4) { Remove-Item $finalMp4 -Force }

& ffmpeg -f concat -safe 0 -i $concatFile -c copy $tempVideo -y
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to concatenate chunks with ffmpeg."
}

Write-Host "Muxing audio master with concatenated video..." -ForegroundColor Cyan
& ffmpeg -i $tempVideo -i $audioMaster -c:v copy -c:a aac -b:a 192k -shortest $finalMp4 -y
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to mux audio master with final video."
}

Remove-Item $tempVideo -Force -ErrorAction SilentlyContinue
Write-Host "`n=== Render Complete! ===" -ForegroundColor Green
Write-Host "Final MP4: $finalMp4" -ForegroundColor Green
Get-Item $finalMp4 | Select-Object FullName, Length, LastWriteTime

