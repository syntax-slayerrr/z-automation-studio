param(
  [switch]$ForceBundle
)
$ErrorActionPreference = "Stop"
$ROOT = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $ROOT

$TMP_D = Join-Path $ROOT "ipm-nalar-pelajar\.tmp"
New-Item -ItemType Directory -Force -Path $TMP_D | Out-Null
$env:TEMP = $TMP_D
$env:TMP = $TMP_D

$OUT_DIR = Join-Path $ROOT "ipm-nalar-pelajar\out"
$BUNDLE_DIR = Join-Path $OUT_DIR "bundle"
$QA_DIR = Join-Path $OUT_DIR "qa_stills"
New-Item -ItemType Directory -Force -Path $QA_DIR | Out-Null

$align = Get-Content -Raw (Join-Path $ROOT "ipm-nalar-pelajar\audio\alignment.json") | ConvertFrom-Json
$c = $align.cuesFrame
$s = $align.scenesFrame
$total = [int]$align.totalFrames

if ($ForceBundle -or -not (Test-Path (Join-Path $BUNDLE_DIR "index.html"))) {
  Write-Host "=== [1/3] Bundling isolated remotion/entry-ipm-nalar-pelajar.ts ===" -ForegroundColor Cyan
  if (Test-Path $BUNDLE_DIR) { Remove-Item -Recurse -Force $BUNDLE_DIR }
  npx remotion bundle remotion/entry-ipm-nalar-pelajar.ts --out-dir $BUNDLE_DIR
  if ($LASTEXITCODE -ne 0) { throw "Bundle failed!" }
} else {
  Write-Host "=== [1/3] Reusing isolated bundle ===" -ForegroundColor Cyan
}

# 20 Forensic Drama Cinematography + Living LookDev QA Shots (4x5 Grid covering ALL OTS, Reverse-OTS, Dolly-Zoom & Multi-Cut angles!)
$shots = @(
  @{ idx = "01"; tag = "SH01_BEDROOM_WARM_LAMP";      frame = 35 },
  @{ idx = "02"; tag = "SH02_PORTRAIT_ECU_EYES";      frame = [int]$s.s2 + 35 },
  @{ idx = "03"; tag = "SH02_TIKTOK_VIRAL_UI";        frame = [int]$s.s2 + 150 },
  @{ idx = "04"; tag = "SH03_FEAR_HALF_LID";          frame = [int]$s.s3 + 125 },
  @{ idx = "05"; tag = "SH04_BUBBLES_1_TO_100";       frame = [int]$s.s4 + 195 },
  @{ idx = "06"; tag = "SH05_CRIMSON_OVERLOAD";       frame = [int]$s.s5 + 65 },
  @{ idx = "07"; tag = "SH06_STILL_EYELIDS_SHUT";     frame = [int]$s.s6 + 55 },
  @{ idx = "08"; tag = "SH07B_OTS_TIKTOK_5W1H";       frame = [int]$c.s7_when + 50 },
  @{ idx = "09"; tag = "SH07C_ORBIT_PORTRAIT_ORBS";   frame = [int]$c.s7_how + 45 },
  @{ idx = "10"; tag = "SH08_MACRO_POV_WRITING";      frame = [int]$c.s8_bridge + 20 },
  @{ idx = "11"; tag = "SH09A_LOW_SNEAKER_TRACK";     frame = [int]$s.s9 + 18 },
  @{ idx = "12"; tag = "SH09A_CRANE_VILLAGE_BANNER";  frame = [int]$s.s9 + 118 },
  @{ idx = "13"; tag = "SH09B_HALL_OTS_FULL_SLIDE";   frame = [int]$c.s9_mod_invite + 55 },
  @{ idx = "14"; tag = "SH10B_VERTIGO_ZOLLY_CRIMSON"; frame = [int]$c.s10_wisnu_doubt + 120 },
  @{ idx = "15"; tag = "SH11A_TELEPHOTO_BREATHE";     frame = [int]$s.s11 + 50 },
  @{ idx = "16"; tag = "SH11B_LOW_HERO_HAND_UP";      frame = [int]$c.s11_hand_up + 65 },
  @{ idx = "17"; tag = "SH11C_STAGE_REV_OTS_YELLOW";  frame = 4436 },
  @{ idx = "18"; tag = "SH12A2_WISNU_OTS_TO_SLIDE";   frame = 4590 },
  @{ idx = "19"; tag = "SH12A3_TIGHT_CU_QUESTION";    frame = 4725 },
  @{ idx = "20"; tag = "SH12B_NALAR_PELAJAR_END";     frame = [Math]::Min($total - 12, $total - 25) }
)

Write-Host "=== [2/3] Rendering 20 Full HD Drama Cinematography QA Stills (--gl=angle) ===" -ForegroundColor Cyan
foreach ($sh in $shots) {
  $f = [Math]::Max(0, [Math]::Min($total - 1, [int]$sh.frame))
  $outPng = Join-Path $QA_DIR ("shot_{0}_{1}_f{2}.png" -f $sh.idx, $sh.tag, $f)
  if ((Test-Path $outPng) -and ((Get-Item $outPng).Length -gt 20000)) {
    Write-Host ("  [{0}/20] Cached Frame {1,4} -> {2}" -f $sh.idx, $f, $sh.tag) -ForegroundColor DarkGray
    continue
  }
  Write-Host ("  [{0}/20] Frame {1,4} -> {2}" -f $sh.idx, $f, $sh.tag) -ForegroundColor Yellow
  npx remotion still $BUNDLE_DIR IpmNalarPelajarShort $outPng --frame=$f --gl=angle --log=error
  if ($LASTEXITCODE -ne 0) {
    Start-Sleep -Seconds 2
    npx remotion still $BUNDLE_DIR IpmNalarPelajarShort $outPng --frame=$f --gl=angle --log=error
    if ($LASTEXITCODE -ne 0) { throw "Still failed at frame $f!" }
  }
}

Write-Host "=== [3/3] Assembling 4x5 Labeled Contact Sheet (qa_16_shots.jpg) ===" -ForegroundColor Cyan
$pyScript = @"
from pathlib import Path
from PIL import Image, ImageDraw

qa_dir = Path(r'$QA_DIR')
files = sorted(qa_dir.glob('shot_*.png'))
assert len(files) == 20, f'Expected 20 stills, got {len(files)}'
tw, th = 360, 640
sheet = Image.new('RGB', (tw * 4, th * 5), (18, 22, 36))
draw = ImageDraw.Draw(sheet)

for i, fp in enumerate(files):
    im = Image.open(fp).convert('RGB').resize((tw, th), Image.Resampling.LANCZOS)
    cx = (i % 4) * tw
    cy = (i // 4) * th
    sheet.paste(im, (cx, cy))
    draw.rectangle([cx, cy, cx + tw, cy + 28], fill=(16, 20, 34))
    draw.text((cx + 8, cy + 6), fp.stem[:38], fill=(250, 204, 21))

out_jpg = Path(r'$OUT_DIR') / 'qa_16_shots.jpg'
sheet.save(out_jpg, quality=92)
print('Saved 20-Shot Cinematography QA Sheet ->', out_jpg)
"@
$tmpPy = Join-Path $TMP_D "make_qa_sheet.py"
[System.IO.File]::WriteAllText($tmpPy, $pyScript, (New-Object System.Text.UTF8Encoding($false)))
python $tmpPy
if ($LASTEXITCODE -ne 0) { throw "Contact sheet assembly failed!" }
