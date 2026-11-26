param(
  [switch]$ForceBundle
)
$ErrorActionPreference = "Stop"
$ROOT = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $ROOT

$OUT_DIR = Join-Path $ROOT "sehat-ep01\out"
$BUNDLE_DIR = Join-Path $OUT_DIR "bundle"
$STILLS_DIR = Join-Path $OUT_DIR "qa_stills_v2"
New-Item -ItemType Directory -Force -Path $STILLS_DIR | Out-Null

if ($ForceBundle -or -not (Test-Path (Join-Path $BUNDLE_DIR "index.html"))) {
  Write-Host "=== [1/3] Bundling isolated remotion/entry-sehat-ep01.ts (v2 Dynamic Cut) ==="
  npx remotion bundle remotion/entry-sehat-ep01.ts --out-dir $BUNDLE_DIR
  if ($LASTEXITCODE -ne 0) { throw "Bundle failed!" }
}

$align = Get-Content -Raw (Join-Path $ROOT "sehat-ep01\audio\alignment.json") | ConvertFrom-Json
$S = $align.scenesFrame
$C = $align.cuesFrame

$shots = @(
  @{ id = "V2_01_IntroKelompok";  f = 42 },
  @{ id = "V2_02_AlarmECU";       f = [int]($S.s1 + 22) },
  @{ id = "V2_03_WakeAction";     f = [int]($C.s1_wake + 28) },
  @{ id = "V2_04_DeskFrontCU";    f = [int]($C.s1_overwhelmed + 30) },
  @{ id = "V2_05_DigestOrbit";    f = [int]($C.s2_carbs + 35) },
  @{ id = "V2_06_BalancedTop";    f = [int]($C.s2_balanced + 15) },
  @{ id = "V2_07_HeartPulse";     f = [int]($C.s3_heart + 35) },
  @{ id = "V2_08_ParkJogLow";     f = [int]($C.s3_jog_stretch + 32) },
  @{ id = "V2_09_DutchStress";    f = [int]($C.s4_orbit + 38) },
  @{ id = "V2_10_MaslowPortrait"; f = [int]($C.s4_maslow + 32) },
  @{ id = "V2_11_PyramidTiltUp";  f = [int]($C.s4_tier3 + 12) },
  @{ id = "V2_12_MaslowTwoShot";  f = [int]($C.s4_human + 45) },
  @{ id = "V2_13_BrainDeficit";   f = [int]($C.s5_lack + 24) },
  @{ id = "V2_14_DawnSunrise";    f = [int]($S.s6 - 24) },
  @{ id = "V2_15_HabitWater";     f = [int]($C.s6_water + 22) },
  @{ id = "V2_16_CraneClosing";   f = [int]($S.totalFrames - 30) }
)

Write-Host "=== [2/3] Rendering 16 v2 Dynamic Director's Cut QA Stills ==="
foreach ($sh in $shots) {
  $png = Join-Path $STILLS_DIR "$($sh.id).png"
  Write-Host "  Rendering $($sh.id) (frame $($sh.f))..."
  npx remotion still $BUNDLE_DIR SehatEp01Short $png --frame=$($sh.f) --gl=angle --concurrency=1 --log=error
  if ($LASTEXITCODE -ne 0) {
    Start-Sleep -Seconds 2
    npx remotion still $BUNDLE_DIR SehatEp01Short $png --frame=$($sh.f) --gl=angle --concurrency=1 --log=error
  }
}

Write-Host "=== [3/3] Assembling 4x4 v2 QA Contact Sheet ==="
$qaGrid = Join-Path $OUT_DIR "qa_v2_16_shots.jpg"
python -c "
from PIL import Image, ImageDraw
import os
stills = r'$STILLS_DIR'
out = r'$qaGrid'
names = [
  'V2_01_IntroKelompok','V2_02_AlarmECU','V2_03_WakeAction','V2_04_DeskFrontCU',
  'V2_05_DigestOrbit','V2_06_BalancedTop','V2_07_HeartPulse','V2_08_ParkJogLow',
  'V2_09_DutchStress','V2_10_MaslowPortrait','V2_11_PyramidTiltUp','V2_12_MaslowTwoShot',
  'V2_13_BrainDeficit','V2_14_DawnSunrise','V2_15_HabitWater','V2_16_CraneClosing'
]
W, H = 360, 640
grid = Image.new('RGB', (W * 4, H * 4), (16, 14, 26))
draw = ImageDraw.Draw(grid)
for i, nm in enumerate(names):
    p = os.path.join(stills, f'{nm}.png')
    im = Image.open(p).convert('RGB').resize((W, H), Image.Resampling.LANCZOS)
    cx, cy = (i % 4) * W, (i // 4) * H
    grid.paste(im, (cx, cy))
    draw.rectangle([cx + 6, cy + 6, cx + 215, cy + 30], fill=(18, 14, 28))
    draw.text((cx + 12, cy + 12), nm, fill=(248, 206, 98))
grid.save(out, quality=92)
"
Write-Host "Saved v2 16-Shot QA Contact Sheet: $qaGrid"
