param(
  [switch]$ForceBundle
)
$ErrorActionPreference = "Stop"
$ROOT = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $ROOT

$TMP_D = Join-Path $ROOT "jembatan-kembar-gowa\.tmp"
New-Item -ItemType Directory -Force -Path $TMP_D | Out-Null
$env:TEMP = $TMP_D
$env:TMP = $TMP_D

$OUT_DIR = Join-Path $ROOT "jembatan-kembar-gowa\out"
$BUNDLE_DIR = Join-Path $OUT_DIR "bundle"
$QA_DIR = Join-Path $OUT_DIR "qa_stills"
New-Item -ItemType Directory -Force -Path $QA_DIR | Out-Null

$align = Get-Content -Raw (Join-Path $ROOT "jembatan-kembar-gowa\audio\alignment.json") | ConvertFrom-Json
$c = $align.cuesFrame
$s = $align.scenesFrame
$total = [int]$align.totalFrames

if ($ForceBundle -or -not (Test-Path (Join-Path $BUNDLE_DIR "index.html"))) {
  Write-Host "=== [1/3] Bundling isolated remotion/entry-jembatan-gowa.ts ===" -ForegroundColor Cyan
  if (Test-Path $BUNDLE_DIR) { Remove-Item -Recurse -Force $BUNDLE_DIR }
  npx remotion bundle remotion/entry-jembatan-gowa.ts --out-dir $BUNDLE_DIR
  if ($LASTEXITCODE -ne 0) { throw "Bundle failed!" }
} else {
  Write-Host "=== [1/3] Reusing bundle (pass -ForceBundle to rebuild) ===" -ForegroundColor Cyan
}

# 16 Forensic 3D Cutaway Engineering & Traffic Physics Hero Shots across Jembatan Kembar Gowa!
$shots = @(
  @{ idx = "01"; tag = "INTRO_GOWA_4RED_AFRAMES";  frame = 48 },
  @{ idx = "02"; tag = "SC01_DZAKI_RIDE_ORANGE";   frame = [int]$c.s1_dzaki_ride + 95 },
  @{ idx = "03"; tag = "SC01_EMERGENCY_CONES";     frame = [int]$c.s1_incident + 90 },
  @{ idx = "04"; tag = "SC01_SAR_BOAT_JENEBERANG"; frame = [int]$c.s1_sar_boat + 85 },
  @{ idx = "05"; tag = "SC02_RUBBERNECK_RIDERS";   frame = [int]$c.s2_rubberneck + 110 },
  @{ idx = "06"; tag = "SC02_BOTTLENECK_ARROWS";   frame = [int]$c.s2_bottleneck + 115 },
  @{ idx = "07"; tag = "SC03_SUGIYAMA_SHOCKWAVE";  frame = [int]$c.s3_sugiyama + 125 },
  @{ idx = "08"; tag = "SC03_CORRIDOR_STRUCTURAL"; frame = [int]$c.s3_structural + 100 },
  @{ idx = "09"; tag = "SC04_AMBULANCE_TRAPPED";   frame = [int]$c.s4_ambulance + 110 },
  @{ idx = "10"; tag = "SC04_CO2_SMOG_DZAKI";      frame = [int]$c.s4_pollution + 125 },
  @{ idx = "11"; tag = "SC05_SOL1_RAIL_CCTV_119";  frame = [int]$c.s5_sol1_rail + 135 },
  @{ idx = "12"; tag = "SC05_SOL2_CONTRAFLOW_AMB"; frame = [int]$c.s5_sol2_contraflow + 125 },
  @{ idx = "13"; tag = "SC06_SOL3_DZAKI_DISIPLIN"; frame = [int]$c.s6_sol3_discipline + 110 },
  @{ idx = "14"; tag = "SC06_SOL4_TRANS_BUS";      frame = [int]$c.s6_sol4_transit + 95 },
  @{ idx = "15"; tag = "SC06_ENRIQUE_PENALOSA";    frame = [int]$c.s6_penalosa + 110 },
  @{ idx = "16"; tag = "SC07_SEAMLESS_LOOP_END";   frame = [Math]::Min($total - 15, [int]$c.s7_endcard + 35) }
)

Write-Host "=== [2/3] Rendering 16 Full HD 3D Cutaway QA Stills (--gl=angle) ===" -ForegroundColor Cyan
foreach ($sh in $shots) {
  $f = [Math]::Max(0, [Math]::Min($total - 1, [int]$sh.frame))
  $outPng = Join-Path $QA_DIR ("shot_{0}_{1}_f{2}.png" -f $sh.idx, $sh.tag, $f)
  if ((Test-Path $outPng) -and ((Get-Item $outPng).Length -gt 20000)) {
    Write-Host ("  [{0}/16] Cached Frame {1,4} -> {2}" -f $sh.idx, $f, $sh.tag) -ForegroundColor DarkGray
    continue
  }
  Write-Host ("  [{0}/16] Frame {1,4} -> {2}" -f $sh.idx, $f, $sh.tag) -ForegroundColor Yellow
  npx remotion still $BUNDLE_DIR JembatanKembarGowaShort $outPng --frame=$f --gl=angle --log=error
  if ($LASTEXITCODE -ne 0) {
    Start-Sleep -Seconds 2
    npx remotion still $BUNDLE_DIR JembatanKembarGowaShort $outPng --frame=$f --gl=angle --log=error
    if ($LASTEXITCODE -ne 0) { throw "Still failed at frame $f!" }
  }
}

Write-Host "=== [3/3] Assembling 4x4 Labeled Contact Sheet (qa_16_shots.jpg) ===" -ForegroundColor Cyan
$pyScript = @"
from pathlib import Path
from PIL import Image, ImageDraw

qa_dir = Path(r'$QA_DIR')
files = sorted(qa_dir.glob('shot_*.png'))
assert len(files) == 16, f'Expected 16 stills, got {len(files)}'
tw, th = 360, 640
sheet = Image.new('RGB', (tw * 4, th * 4), (16, 24, 38))
draw = ImageDraw.Draw(sheet)

for i, fp in enumerate(files):
    im = Image.open(fp).convert('RGB').resize((tw, th), Image.Resampling.LANCZOS)
    cx = (i % 4) * tw
    cy = (i // 4) * th
    sheet.paste(im, (cx, cy))
    draw.rectangle([cx, cy, cx + tw, cy + 28], fill=(14, 22, 36))
    draw.text((cx + 8, cy + 6), fp.stem[:36], fill=(255, 215, 64))

out_jpg = Path(r'$OUT_DIR') / 'qa_16_shots.jpg'
sheet.save(out_jpg, quality=92)
print('Saved QA Contact Sheet ->', out_jpg)
"@
$tmpPy = Join-Path $TMP_D "make_qa_sheet.py"
[System.IO.File]::WriteAllText($tmpPy, $pyScript, (New-Object System.Text.UTF8Encoding($false)))
python $tmpPy
if ($LASTEXITCODE -ne 0) { throw "Contact sheet assembly failed!" }
