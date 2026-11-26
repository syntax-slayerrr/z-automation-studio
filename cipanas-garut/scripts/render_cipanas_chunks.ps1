$ErrorActionPreference = "Continue"

$root = "d:\PROJECTS\z-automation-studio"
$tmpDir = "$root\cipanas-garut\.tmp"
$chunkDir = "$root\cipanas-garut\.chunks"
$bundleDir = "$root\cipanas-garut\.bundle"
$outMp4 = "d:\PROJECTS\z-automation-studio\videos\cipanas_garut_kehangatan_perut_bumi.mp4"
$audioM4a = "$root\public\cipanas-garut\audio_master.m4a"

New-Item -ItemType Directory -Force -Path $tmpDir, $chunkDir, "$root\cipanas-garut\out" | Out-Null
$env:TEMP = $tmpDir
$env:TMP = $tmpDir

Write-Host "=== Step 1: Pre-bundling Remotion project ONCE -> $bundleDir ==="
if (-not (Test-Path "$bundleDir\index.html")) {
    if (Test-Path $bundleDir) { Remove-Item -Recurse -Force $bundleDir }
    npx remotion bundle "$root\remotion\index.ts" --out-dir $bundleDir 2>&1 | Select-Object -Last 10
    if ($LASTEXITCODE -ne 0) {
        Write-Host "BUNDLE FAILED with code $LASTEXITCODE"
        exit 1
    }
} else {
    Write-Host "[SKIP] Reusing existing bundle at $bundleDir"
}

$chunks = @(
    @{ Name = "c01"; Range = "0-399";     Expected = 400 },
    @{ Name = "c02"; Range = "400-799";   Expected = 400 },
    @{ Name = "c03"; Range = "800-1199";  Expected = 400 },
    @{ Name = "c04"; Range = "1200-1599"; Expected = 400 },
    @{ Name = "c05"; Range = "1600-1999"; Expected = 400 },
    @{ Name = "c06"; Range = "2000-2399"; Expected = 400 },
    @{ Name = "c07"; Range = "2400-2799"; Expected = 400 },
    @{ Name = "c08"; Range = "2800-3179"; Expected = 380 }
)

function Get-FrameCount($path) {
    if (-not (Test-Path $path)) { return 0 }
    $raw = (& ffprobe -v error -select_streams v:0 -count_packets -show_entries stream=nb_read_packets -of default=noprint_wrappers=1:nokey=1 $path 2>$null)
    $s = (($raw -join '').Trim() -replace '[^0-9]', '')
    if ($s -match '^\d+$') { return [int]$s }
    return 0
}

Write-Host "=== Step 2: Rendering 8 resumable Full HD chunks (3,180 frames total) ==="
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
        $logOut = & npx remotion render $bundleDir CipanasGarutShort $outChunk --frames=$($c.Range) --muted --concurrency=2 --crf=14 --log=error 2>&1
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
    -c:v libx264 -preset medium -crf 17 -pix_fmt yuv420p -colorspace bt709 -color_primaries bt709 -color_trc bt709 -x264-params "colorprim=bt709:transfer=bt709:colormatrix=bt709" -r 30 -movflags +faststart `
    -c:a copy `
    $outMp4 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[FATAL] FFmpeg concat/mux failed with code $LASTEXITCODE"
    exit 1
}

$finalFrames = Get-FrameCount $outMp4
Write-Host "=== RENDER COMPLETE: $outMp4 ($finalFrames frames) ==="

