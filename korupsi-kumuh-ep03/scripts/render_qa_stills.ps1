param(
  [switch]$ForceBundle
)
$ErrorActionPreference = "Stop"
$ROOT = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $ROOT

$TMP_D = Join-Path $ROOT "korupsi-kumuh-ep03\.tmp"
New-Item -ItemType Directory -Force -Path $TMP_D | Out-Null
$env:TEMP = $TMP_D
$env:TMP = $TMP_D

$OUT_DIR = Join-Path $ROOT "korupsi-kumuh-ep03\out"
$BUNDLE_DIR = Join-Path $OUT_DIR "bundle"
$QA_DIR = Join-Path $OUT_DIR "qa_stills"
New-Item -ItemType Directory -Force -Path $QA_DIR | Out-Null

$align = Get-Content -Raw (Join-Path $ROOT "korupsi-kumuh-ep03\audio\alignment.json") | ConvertFrom-Json
$c = $align.cuesFrame
$s = $align.scenesFrame
$total = [int]$align.totalFrames

if ($ForceBundle -or -not (Test-Path (Join-Path $BUNDLE_DIR "index.html"))) {
  Write-Host "=== [1/3] Bundling isolated remotion/entry-korupsi-ep03.ts ===" -ForegroundColor Cyan
  if (Test-Path $BUNDLE_DIR) { Remove-Item -Recurse -Force $BUNDLE_DIR }
  npx remotion bundle remotion/entry-korupsi-ep03.ts --out-dir $BUNDLE_DIR
  if ($LASTEXITCODE -ne 0) { throw "Bundle failed!" }
} else {
  Write-Host "=== [1/3] Reusing bundle (pass -ForceBundle or delete bundle to rebuild) ===" -ForegroundColor Cyan
}

# 16 Forensic WorldForge 3D Living-City + Character Hero Shots across ALL 9 scenes!
$shots = @(
  @{ idx = "01"; tag = "INTRO_AERIAL_KELOMPOK3";   frame = 75 },
  @{ idx = "02"; tag = "SC01_ARDI_FAUCET_ALLEY";   frame = [int]$c.s1_faucet + 75 },
  @{ idx = "03"; tag = "SC01_ARDI_FADED_BOARD";    frame = [int]$c.s1_board + 70 },
  @{ idx = "04"; tag = "SC02_HIGHRISE_BOARDROOM";  frame = [int]$c.s2_meeting + 65 },
  @{ idx = "05"; tag = "SC02_POTHOLE_BROKEN_ALLEY";frame = [int]$c.s2_facilities + 95 },
  @{ idx = "06"; tag = "SC03_CLOGGED_GUTTER_TRASH";frame = [int]$c.s3_sanitasi + 115 },
  @{ idx = "07"; tag = "SC03_JERRYCAN_WATER_QUEUE";frame = [int]$c.s3_air_bersih + 120 },
  @{ idx = "08"; tag = "SC04_SKYLINE_VS_SLUM_GAP"; frame = [int]$c.s4_gap + 75 },
  @{ idx = "09"; tag = "SC04_AMARTYA_SEN_BRIDGE";  frame = [int]$c.s4_amartya + 110 },
  @{ idx = "10"; tag = "SC05_FLOODED_LIVING_ROOM"; frame = [int]$c.s5_flood + 95 },
  @{ idx = "11"; tag = "SC06_RAIN_CLINIC_MOTHER";  frame = [int]$c.s6_health + 125 },
  @{ idx = "12"; tag = "SC07_BUNG_HATTA_DAWN";     frame = [int]$c.s7_hatta + 125 },
  @{ idx = "13"; tag = "SC08_UPAYA1_OPEN_BUDGET";  frame = [int]$c.s8_upaya1 + 95 },
  @{ idx = "14"; tag = "SC08_UPAYA2_COURTHOUSE";   frame = [int]$c.s8_upaya2 + 95 },
  @{ idx = "15"; tag = "SC08_UPAYA3_CULVERT_WARGA";frame = [int]$c.s8_upaya3 + 120 },
  @{ idx = "16"; tag = "SC09_GOLDEN_SUNRISE_CITY"; frame = [Math]::Min($total - 15, [int]$c.s9_endcard + 35) }
)

Write-Host "=== [2/3] Rendering 16 Full HD WorldForge 3D QA Stills (--gl=angle) ===" -ForegroundColor Cyan
foreach ($sh in $shots) {
  $f = [Math]::Max(0, [Math]::Min($total - 1, [int]$sh.frame))
  $outPng = Join-Path $QA_DIR ("shot_{0}_{1}_f{2}.png" -f $sh.idx, $sh.tag, $f)
  if ((Test-Path $outPng) -and ((Get-Item $outPng).Length -gt 20000)) {
    Write-Host ("  [{0}/16] Cached Frame {1,4} -> {2}" -f $sh.idx, $f, $sh.tag) -ForegroundColor DarkGray
    continue
  }
  Write-Host ("  [{0}/16] Frame {1,4} -> {2}" -f $sh.idx, $f, $sh.tag) -ForegroundColor Yellow
  npx remotion still $BUNDLE_DIR KorupsiKumuhEp03Short $outPng --frame=$f --gl=angle --log=error
  if ($LASTEXITCODE -ne 0) {
    Start-Sleep -Seconds 2
    npx remotion still $BUNDLE_DIR KorupsiKumuhEp03Short $outPng --frame=$f --gl=angle --log=error
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
sheet = Image.new('RGB', (tw * 4, th * 4), (18, 22, 36))
draw = ImageDraw.Draw(sheet)

for i, fp in enumerate(files):
    im = Image.open(fp).convert('RGB').resize((tw, th), Image.Resampling.LANCZOS)
    cx = (i % 4) * tw
    cy = (i // 4) * th
    sheet.paste(im, (cx, cy))
    draw.rectangle([cx, cy, cx + tw, cy + 28], fill=(16, 20, 34))
    draw.text((cx + 8, cy + 6), fp.stem[:36], fill=(250, 204, 21))

out_jpg = Path(r'$OUT_DIR') / 'qa_16_shots.jpg'
sheet.save(out_jpg, quality=92)
print('Saved QA Contact Sheet ->', out_jpg)
"@
$tmpPy = Join-Path $TMP_D "make_qa_sheet.py"
[System.IO.File]::WriteAllText($tmpPy, $pyScript, (New-Object System.Text.UTF8Encoding($false)))
python $tmpPy
if ($LASTEXITCODE -ne 0) { throw "Contact sheet assembly failed!" }
