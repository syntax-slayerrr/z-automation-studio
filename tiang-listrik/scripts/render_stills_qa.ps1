$ErrorActionPreference = "Stop"
$env:NODE_OPTIONS = "--max-old-space-size=8192"

$bundleDir = "tiang-listrik/out/bundle"
$stillsDir = "tiang-listrik/stills"

New-Item -ItemType Directory -Force -Path $stillsDir | Out-Null

Write-Host "=== Step 1: Pre-bundling Remotion project ==="
if (Test-Path $bundleDir) { Remove-Item -Recurse -Force $bundleDir }
& npx remotion bundle remotion/index.ts --out-dir $bundleDir

$frames = @(0, 380, 530, 2400, 3106)
foreach ($f in $frames) {
    $pad = "{0:D4}" -f $f
    $outStill = "$stillsDir/frame_$pad.jpg"
    Write-Host "=== Rendering Still Frame $f -> $outStill ==="
    & npx remotion still $bundleDir TiangListrikShort $outStill "--frame=$f" --gl=angle --log=warn
}

Write-Host "`n=== All stills rendered successfully! ==="
Get-Item "$stillsDir/frame_*.jpg" | Select-Object Name, Length, LastWriteTime
