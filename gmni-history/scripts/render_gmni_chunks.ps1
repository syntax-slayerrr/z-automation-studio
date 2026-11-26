$ErrorActionPreference = "Continue"

$root = "d:\PROJECTS\z-automation-studio"
$tmpDir = "$root\gmni-history\.tmp"
$chunkDir = "$root\gmni-history\.chunks"
$bundleDir = "$root\gmni-history\.bundle"
$outMp4 = "d:\PROJECTS\z-automation-studio\videos\sejarah_berdirinya_gmni.mp4"
$audioM4a = "$root\public\gmni-history\audio_master.m4a"

New-Item -ItemType Directory -Force -Path $tmpDir, $chunkDir, "$root\gmni-history\out" | Out-Null
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
    @{ Name = "c01"; Range = "0-389";     Expected = 390 },
    @{ Name = "c02"; Range = "390-779";   Expected = 390 },
    @{ Name = "c03"; Range = "780-1169";  Expected = 390 },
    @{ Name = "c04"; Range = "1170-1559"; Expected = 390 },
    @{ Name = "c05"; Range = "1560-1949"; Expected = 390 },
    @{ Name = "c06"; Range = "1950-2339"; Expected = 390 },
    @{ Name = "c07"; Range = "2340-2729"; Expected = 390 },
    @{ Name = "c08"; Range = "2730-3119"; Expected = 390 },
    @{ Name = "c09"; Range = "3120-3509"; Expected = 390 },
    @{ Name = "c10"; Range = "3510-3893"; Expected = 384 }
)

function Get-FrameCount($path) {
    if (-not (Test-Path $path)) { return 0 }
    $raw = (& ffprobe -v error -select_streams v:0 -count_packets -show_entries stream=nb_read_packets -of default=noprint_wrappers=1:nokey=1 $path 2>$null)
    $s = (($raw -join '').Trim() -replace '[^0-9]', '')
    if ($s -match '^\d+$') { return [int]$s }
    return 0
}

Write-Host "=== Step 2: Rendering 10 resumable chunks (3,894 frames total) ==="
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
        $logOut = & npx remotion render $bundleDir GmniHistoryShort $outChunk --frames=$($c.Range) --muted --concurrency=2 --crf=14 --log=error 2>&1
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

