# Chunked render for RelKeretaShort V2 (2533 frames, 10 chunks)
# Uses direct npx invocation instead of Start-Process

$ErrorActionPreference = "Continue"
$root = "d:\PROJECTS\z-automation-studio"
$bundleDir = "$root\rel-kereta\out\bundle"
$chunksDir = "$root\rel-kereta\out\chunks"
$outFile = "d:\PROJECTS\z-automation-studio\videos\kenapa_rel_kereta_pakai_batu_kerikil.mp4"
$total = 2533
$chunkSize = 254
$numChunks = [math]::Ceiling($total / $chunkSize)

# Clean old chunks
if (Test-Path $chunksDir) { Remove-Item -Recurse -Force $chunksDir }
New-Item -ItemType Directory -Force $chunksDir | Out-Null

Set-Location $root

# Render each chunk
for ($i = 0; $i -lt $numChunks; $i++) {
    $start = $i * $chunkSize
    $count = [math]::Min($chunkSize, $total - $start)
    $end = $start + $count - 1
    $chunkFile = "$chunksDir\chunk_$($i.ToString('D2')).mp4"
    $pad = $i.ToString('D2')
    Write-Host "=== Chunk $pad : frames $start..$end ==="

    $ok = $false
    for ($attempt = 1; $attempt -le 2; $attempt++) {
        & npx remotion render $bundleDir RelKeretaShort $chunkFile "--frames=$start-$end" --gl=angle --concurrency=1 --muted --timeout=60000 --log=error 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  Chunk $pad OK (attempt $attempt)"
            $ok = $true
            break
        }
        Write-Host "  Chunk $pad FAILED attempt $attempt (exit $LASTEXITCODE), retrying..."
        Start-Sleep -Seconds 3
    }
    if (-not $ok) {
        Write-Host "ERROR: Chunk $pad failed after 2 attempts!"
        exit 1
    }
}

# Concat all chunks
$listFile = "$chunksDir\filelist.txt"
$chunkFiles = Get-ChildItem "$chunksDir\chunk_*.mp4" | Sort-Object Name
$chunkFiles | ForEach-Object { "file '$($_.FullName -replace '\\','/')'" } | Set-Content $listFile

Write-Host "=== Concatenating $($chunkFiles.Count) chunks ==="
& ffmpeg -y -f concat -safe 0 -i $listFile -c copy "$chunksDir\concat_silent.mp4" 2>&1 | Out-Null

# Mux audio master
$audioFile = "$root\public\rel-kereta\audio_master.m4a"
Write-Host "=== Muxing audio master ==="
& ffmpeg -y -i "$chunksDir\concat_silent.mp4" -i $audioFile -c:v copy -c:a aac -b:a 192k -shortest $outFile 2>&1 | Out-Null

if (Test-Path $outFile) {
    $sz = [math]::Round((Get-Item $outFile).Length / 1MB, 2)
    Write-Host "=== DONE: $outFile ($sz MB) ==="
} else {
    Write-Host "ERROR: Output file not found!"
    exit 1
}

