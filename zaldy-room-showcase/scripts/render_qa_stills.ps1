param(
  [switch]$ForceBundle
)
$ErrorActionPreference = "Stop"
$ROOT = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $ROOT

$OUT_DIR = Join-Path $ROOT "zaldy-room-showcase\out"
$BUNDLE_DIR = Join-Path $OUT_DIR "bundle"
$STILLS_DIR = Join-Path $OUT_DIR "qa_stills"
New-Item -ItemType Directory -Force -Path $STILLS_DIR | Out-Null

if ($ForceBundle -or -not (Test-Path (Join-Path $BUNDLE_DIR "index.html"))) {
  Write-Host "=== [1/3] Bundling remotion/entry-zaldy-room.ts ==="
  npx remotion bundle remotion/entry-zaldy-room.ts --out-dir $BUNDLE_DIR
  if ($LASTEXITCODE -ne 0) { throw "Bundle failed!" }
}

$alignJson = Get-Content -Raw (Join-Path $ROOT "zaldy-room-showcase\audio\alignment.json") | ConvertFrom-Json
$S = $alignJson.scenesFrame
$C = $alignJson.cuesFrame
$cuts = @(
  0,
  ($C.s1_zaldy_greet - 4),
  ($C.s1_hm_calm - 4),
  $S.s2,
  ($C.s2_oc_praise - 4),
  ($C.s2_zaldy_vibe - 4),
  $S.s3,
  ($C.s3_oc_sweat - 4),
  ($C.s3_zaldy_catch - 4),
  $S.s4,
  ($C.s4_qa_pass - 4),
  $S.s5,
  $S.totalFrames
)
$shots = @()
for ($i = 0; $i -lt 12; $i++) {
  $shots += [PSCustomObject]@{
    id = ("SH{0:D2}" -f ($i + 1))
    f  = [int][Math]::Round(($cuts[$i] + $cuts[$i + 1]) * 0.5)
  }
}

Write-Host "=== [2/3] Rendering 12 Full HD 9:16 Shot QA Stills ==="
$inputs = @()
foreach ($sh in $shots) {
  $png = Join-Path $STILLS_DIR "$($sh.id).png"
  Write-Host "  Rendering $($sh.id) (frame $($sh.f))..."
  npx remotion still $BUNDLE_DIR ZaldyRoomShowcase $png --frame=$($sh.f) --gl=angle --concurrency=1 --log=error
  if ($LASTEXITCODE -ne 0) {
    Start-Sleep -Seconds 2
    npx remotion still $BUNDLE_DIR ZaldyRoomShowcase $png --frame=$($sh.f) --gl=angle --concurrency=1 --log=error
  }
  $inputs += "-i"
  $inputs += $png
}

Write-Host "=== [3/3] Assembling 4x3 12-Shot Contact Sheet ==="
$qaGrid = Join-Path $OUT_DIR "qa_all_shots.jpg"
python -c "
from PIL import Image, ImageDraw
import os
stills = r'$STILLS_DIR'
out = r'$qaGrid'
W, H = 360, 640
grid = Image.new('RGB', (W * 4, H * 3), (12, 16, 24))
draw = ImageDraw.Draw(grid)
for i in range(12):
    p = os.path.join(stills, f'SH{i+1:02d}.png')
    im = Image.open(p).convert('RGB').resize((W, H), Image.Resampling.LANCZOS)
    cx, cy = (i % 4) * W, (i // 4) * H
    grid.paste(im, (cx, cy))
    draw.rectangle([cx + 8, cy + 8, cx + 82, cy + 32], fill=(9, 13, 22))
    draw.text((cx + 16, cy + 13), f'SH{i+1:02d}', fill=(253, 224, 71))
grid.save(out, quality=92)
"
Write-Host "Saved 12-Shot QA Contact Sheet: $qaGrid"
