param(
    [switch]$RebuildBundle
)

$ErrorActionPreference = "Continue"

$root = "d:\PROJECTS\z-automation-studio"
$projDir = "$root\harga-peradaban"
$tmpDir = "$projDir\.tmp"
$chunkDir = "$projDir\.chunks"
$bundleDir = "$projDir\.bundle"
$outMp4 = "d:\PROJECTS\z-automation-studio\videos\harga_sebuah_peradaban.mp4"
$audioM4a = "$root\public\harga-peradaban\audio_master.m4a"
$alignJson = "$projDir\audio\alignment.json"

New-Item -ItemType Directory -Force -Path $tmpDir, $chunkDir, "$projDir\out" | Out-Null
$env:TEMP = $tmpDir
$env:TMP = $tmpDir

$align = Get-Content $alignJson -Raw | ConvertFrom-Json
$totalFrames = [int]$align.totalFrames

Write-Host "=== Step 1: Pre-bundling Remotion project ONCE -> $bundleDir (totalFrames=$totalFrames) ==="
if ($RebuildBundle -or (-not (Test-Path "$bundleDir\index.html"))) {
    if (Test-Path $bundleDir) { Remove-Item -Recurse -Force $bundleDir }
    npx remotion bundle "$root\remotion\index.ts" --out-dir $bundleDir 2>&1 | Select-Object -Last 12
    if ($LASTEXITCODE -ne 0) {
        Write-Host "BUNDLE FAILED with code $LASTEXITCODE"
        exit 1
    }
} else {
    Write-Host "[SKIP] Reusing existing bundle at $bundleDir"
}

$chunkSize = 390
$chunks = @()
$idx = 1
for ($s = 0; $s -lt $totalFrames; $s += $chunkSize) {
    $e = [Math]::Min($s + $chunkSize - 1, $totalFrames - 1)
    $chunks += @{ Name = "c$idx"; Range = "$s-$e"; Expected = ($e - $s + 1) }
    $idx++
}

function Get-FrameCount($path) {
    if (-not (Test-Path $path)) { return 0 }
    $raw = (& ffprobe -v error -select_streams v:0 -count_packets -show_entries stream=nb_read_packets -of default=noprint_wrappers=1:nokey=1 $path 2>$null)
    $s = (($raw -join '').Trim() -replace '[^0-9]', '')
    if ($s -match '^\d+$') { return [int]$s }
    return 0
}

Write-Host "=== Step 2: Rendering $($chunks.Count) resumable chunks ($totalFrames frames @ 1080x1920 30fps) ==="
foreach ($c in $chunks) {
    $outChunk = "$chunkDir\$($c.Name).mp4"
    $existing = Get-FrameCount $outChunk
    if ($existing -eq $c.Expected) {
        Write-Host "[SKIP] $($c.Name) ($($c.Range)) already verified ($existing frames)"
        continue
    }

    $ok = $false
    for ($attempt = 1; $attempt -le 2; $attempt++) {
        if (Test-Path $outChunk) { Remove-Item -Force $outChunk }
        Get-ChildItem -Path $tmpDir -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "[RENDER] $($c.Name) ($($c.Range)) attempt $attempt/2 ..."
        $t0 = Get-Date
        $logOut = & npx remotion render $bundleDir HargaPeradabanShort $outChunk --frames=$($c.Range) --muted --concurrency=2 --crf=14 --log=error 2>&1
        $code = $LASTEXITCODE
        $dt = [math]::Round(((Get-Date) - $t0).TotalSeconds, 1)
        $got = Get-FrameCount $outChunk
        if ($code -eq 0 -and $got -eq $c.Expected) {
            Write-Host "[OK] $($c.Name) rendered $got frames in ${dt}s"
            $ok = $true
            break
        } else {
            Write-Host "[WARN] $($c.Name) attempt $attempt failed (exit=$code, frames=$got/$($c.Expected), ${dt}s)"
            $logOut | Select-Object -Last 20 | ForEach-Object { Write-Host "  $_" }
        }
    }
    if (-not $ok) {
        Write-Host "[FATAL] Chunk $($c.Name) failed after 2 attempts."
        exit 1
    }
}

Write-Host "=== Step 3: FFmpeg concat + broadcast H.264 bt709 + bit-exact AAC mux ==="
$concatList = "$chunkDir\chunks.txt"
$lines = $chunks | ForEach-Object { "file '$($chunkDir.Replace('\', '/'))/$($_.Name).mp4'" }
[System.IO.File]::WriteAllLines($concatList, $lines)

& ffmpeg -y -loglevel warning -f concat -safe 0 -i $concatList -i $audioM4a `
    -map 0:v:0 -map 1:a:0 `
    -vf "scale=in_range=full:out_range=tv,format=yuv420p" `
    -c:v libx264 -preset medium -crf 17 -pix_fmt yuv420p -colorspace bt709 -color_primaries bt709 -color_trc bt709 -r 30 -movflags +faststart `
    -c:a copy `
    $outMp4 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[FATAL] FFmpeg concat/mux failed with code $LASTEXITCODE"
    exit 1
}

$finalFrames = Get-FrameCount $outMp4
Write-Host "=== RENDER COMPLETE: $outMp4 ($finalFrames frames) ==="

