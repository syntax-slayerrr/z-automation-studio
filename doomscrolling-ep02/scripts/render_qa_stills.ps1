$ErrorActionPreference = "Stop"
$ROOT = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $ROOT

$TMP_D = Join-Path $ROOT "doomscrolling-ep02\.tmp"
New-Item -ItemType Directory -Force -Path $TMP_D | Out-Null
$env:TEMP = $TMP_D
$env:TMP = $TMP_D

$OUT_DIR = Join-Path $ROOT "doomscrolling-ep02\out"
$BUNDLE_DIR = Join-Path $OUT_DIR "bundle"
$QA_DIR = Join-Path $OUT_DIR "qa_stills"
New-Item -ItemType Directory -Force -Path $QA_DIR | Out-Null

$align = Get-Content -Raw (Join-Path $ROOT "doomscrolling-ep02\audio\alignment.json") | ConvertFrom-Json
$c = $align.cuesFrame
$s = $align.scenesFrame
$total = [int]$align.totalFrames

if (-not (Test-Path (Join-Path $BUNDLE_DIR "index.html"))) {
  Write-Host "=== [1/3] Bundling isolated remotion/entry-doomscrolling.ts ===" -ForegroundColor Cyan
  npx remotion bundle remotion/entry-doomscrolling.ts --out-dir $BUNDLE_DIR
  if ($LASTEXITCODE -ne 0) { throw "Bundle failed!" }
} else {
  Write-Host "=== [1/3] Reusing bundle (pass -ForceBundle or delete bundle to rebuild) ===" -ForegroundColor Cyan
}

# 16 Forensic 3D Cel-Toon Hero Frames covering Intro (Zaki/Fatir/Rendi), B.F. Skinner 3D, Dr. Anna Lembke 3D, Brain 3D, Sunny Park 3D & Finale!
$shots = @(
  @{ idx = "01"; tag = "INTRO_ZAKI_FATIR_RENDI";  frame = 45 },
  @{ idx = "02"; tag = "SH01_CYAN_FACE_3D";       frame = [int]$s.s1 + 45 },
  @{ idx = "03"; tag = "SH02_CLOCK_SWIPE_3D";     frame = [int]$c.s1_thumb + 18 },
  @{ idx = "04"; tag = "SH03_MENTAL_BATTERY_9";   frame = [int]$c.s1_battery + 45 },
  @{ idx = "05"; tag = "SH05_4SLABS_AVALANCHE";   frame = [int]$c.s2_card_debate + 18 },
  @{ idx = "06"; tag = "SH06_HEAD_STACK_3D";      frame = [int]$c.s2_overload + 32 },
  @{ idx = "07"; tag = "SH07_SLOT_MACHINE_3D";    frame = [int]$s.s3 + 65 },
  @{ idx = "08"; tag = "SH08_TOKOH1_SKINNER_3D";  frame = [int]$c.s3_var_ratio + 25 },
  @{ idx = "09"; tag = "SH09_SLOT_JACKPOT_3D";    frame = [int]$c.s3_lever + 10 },
  @{ idx = "10"; tag = "SH10_BRAIN_DOPAMIN_3D";   frame = [int]$c.s4_anticipation + 24 },
  @{ idx = "11"; tag = "SH11_TOKOH2_LEMBKE_3D";   frame = [int]$c.s4_seesaw + 20 },
  @{ idx = "12"; tag = "SH12_SEESAW_CHART_3D";    frame = [int]$c.s4_dip + 45 },
  @{ idx = "13"; tag = "SH13_AMYGDALA_3D";        frame = [int]$c.s5_cortisol + 22 },
  @{ idx = "14"; tag = "SH15_BLUELIGHT_MOON_3D";  frame = [int]$c.s5_bluelight + 35 },
  @{ idx = "15"; tag = "SH19_SUNNY_PARK_3D";      frame = [int]$c.s6_step4 + 42 },
  @{ idx = "16"; tag = "SH21_MORNING_FINALE_3D";  frame = [Math]::Min($total - 15, [int]$c.s7_zine_cover + 45) }
)

Write-Host "=== [2/3] Rendering 16 Full HD 3D Cel-Toon QA Stills (--gl=angle) ===" -ForegroundColor Cyan
foreach ($sh in $shots) {
  $f = [Math]::Max(0, [Math]::Min($total - 1, [int]$sh.frame))
  $outPng = Join-Path $QA_DIR ("shot_{0}_{1}_f{2}.png" -f $sh.idx, $sh.tag, $f)
  if ((Test-Path $outPng) -and ((Get-Item $outPng).Length -gt 20000)) {
    Write-Host ("  [{0}/16] Cached Frame {1,4} -> {2}" -f $sh.idx, $f, $sh.tag) -ForegroundColor DarkGray
    continue
  }
  Write-Host ("  [{0}/16] Frame {1,4} -> {2}" -f $sh.idx, $f, $sh.tag) -ForegroundColor Yellow
  npx remotion still $BUNDLE_DIR DoomscrollingEp02Short $outPng --frame=$f --gl=angle --log=error
  if ($LASTEXITCODE -ne 0) {
    Start-Sleep -Seconds 2
    npx remotion still $BUNDLE_DIR DoomscrollingEp02Short $outPng --frame=$f --gl=angle --log=error
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
sheet = Image.new('RGB', (tw * 4, th * 4), (20, 20, 30))
draw = ImageDraw.Draw(sheet)

for i, fp in enumerate(files):
    im = Image.open(fp).convert('RGB').resize((tw, th), Image.Resampling.LANCZOS)
    cx = (i % 4) * tw
    cy = (i // 4) * th
    sheet.paste(im, (cx, cy))
    draw.rectangle([cx, cy, cx + tw, cy + 28], fill=(18, 18, 28))
    draw.text((cx + 8, cy + 6), fp.stem[:36], fill=(34, 211, 238))

out_jpg = Path(r'$OUT_DIR') / 'qa_16_shots.jpg'
sheet.save(out_jpg, quality=92)
print('Saved QA Contact Sheet ->', out_jpg)
"@
$tmpPy = Join-Path $TMP_D "make_qa_sheet.py"
[System.IO.File]::WriteAllText($tmpPy, $pyScript, (New-Object System.Text.UTF8Encoding($false)))
python $tmpPy
if ($LASTEXITCODE -ne 0) { throw "Contact sheet assembly failed!" }
