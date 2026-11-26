param([switch]$ForceBundle)
$ErrorActionPreference = "Stop"

$root = "d:\PROJECTS\z-automation-studio"
$bundleDir = "$root\claude-animasi-promo\out\bundle"
$qaDir = "$root\claude-animasi-promo\out\qa_stills"
$outGrid = "$root\claude-animasi-promo\out\v3_16shots_qa.jpg"
$outStrip = "$root\claude-animasi-promo\out\v3_motion_strip_qa.jpg"

Set-Location $root
New-Item -ItemType Directory -Path $qaDir -Force | Out-Null

Write-Host "=== [1/4] Checking / Bundling remotion/entry-claude-promo.ts (V3) ===" -ForegroundColor Cyan
if ($ForceBundle -or !(Test-Path "$bundleDir\index.html")) {
    if (Test-Path $bundleDir) { Remove-Item -Recurse -Force $bundleDir }
    & npx remotion bundle remotion/entry-claude-promo.ts --out-dir $bundleDir
    if ($LASTEXITCODE -ne 0) { Write-Error "Bundle failed." }
} else {
    Write-Host "  Reusing existing V3 bundle." -ForegroundColor DarkGreen
}

$align = Get-Content "$root\claude-animasi-promo\audio\alignment.json" -Raw | ConvertFrom-Json
$c = $align.cuesFrame
$s = $align.scenesFrame

function Render-StillSafe($frame, $outPng, $label) {
    if ((Test-Path $outPng) -and (Get-Item $outPng).Length -gt 20000) {
        Write-Host ("  CACHED {0} (frame {1})" -f $label, $frame) -ForegroundColor DarkGreen
        return
    }
    Write-Host ("  Rendering {0} (frame {1})..." -f $label, $frame) -ForegroundColor Yellow
    & npx remotion still $bundleDir ClaudeAnimasiPromo $outPng --frame=$frame --gl=angle --timeout=120000 --log=error
    if ($LASTEXITCODE -ne 0 -or !(Test-Path $outPng)) {
        Write-Host "    Retry $label after 2s..." -ForegroundColor Red
        Start-Sleep -Seconds 2
        & npx remotion still $bundleDir ClaudeAnimasiPromo $outPng --frame=$frame --gl=angle --timeout=180000 --log=error
        if ($LASTEXITCODE -ne 0 -or !(Test-Path $outPng)) { Write-Error "Failed still $label" }
    }
}

$targets = @(
    @{ name = "shot_01_oc_panic";       frame = [int]$c.s1_yell + 14 },
    @{ name = "shot_02_hm_calm";        frame = [int]$c.s1_calm + 14 },
    @{ name = "shot_03_s2_master";      frame = [int]$c.s2_morph + 12 },
    @{ name = "shot_04_oc_frust";       frame = [int]$c.s2_lowbat + 24 },
    @{ name = "shot_05_s3_noir";        frame = [int]$c.s3_ask + 18 },
    @{ name = "shot_06_s3_sticky";      frame = [int]$c.s3_note + 28 },
    @{ name = "shot_07_hm_deadpan";     frame = [int]$c.s3_psychic + 34 },
    @{ name = "shot_08_oc_innocent";    frame = [int]$c.s3_innocent + 16 },
    @{ name = "shot_09_s4_phone";       frame = [int]$c.s4_card + 28 },
    @{ name = "shot_10_s5_worlds";      frame = [int]$c.s5_discover + 90 },
    @{ name = "shot_11_s6_conv";        frame = [int]$c.s6_offended + 12 },
    @{ name = "shot_12_hm_smug";        frame = [int]$c.s6_smug + 18 },
    @{ name = "shot_13_s7_keyboard";    frame = [int]$c.s7_proud + 22 },
    @{ name = "shot_14_s7_prompt";      frame = [int]$c.s7_shout + 30 },
    @{ name = "shot_15_hm_facepalm";    frame = [int]$c.s7_facepalm + 24 },
    @{ name = "shot_16_s8_garut_night"; frame = [int]$align.totalFrames - 30 }
)

Write-Host "=== [2/4] Rendering 16 Full HD Shot QA Stills ===" -ForegroundColor Cyan
foreach ($t in $targets) {
    Render-StillSafe $t.frame "$qaDir\$($t.name).png" $t.name
}

$stripDir = "$qaDir\strip"
$r1Dir = "$stripDir\r1"
$r2Dir = "$stripDir\r2"
$r3Dir = "$stripDir\r3"
New-Item -ItemType Directory -Path $r1Dir, $r2Dir, $r3Dir -Force | Out-Null

$ocBase = [int]$c.s2_lowbat + 16
$hmBase = [int]$c.s3_psychic + 18
$s5End = [int]$s.s6Start

Write-Host "=== [3/4] Rendering 2x6 Consecutive-Frame Strips (Single Chrome Each!) + Scene 5->6 Proof ===" -ForegroundColor Cyan
& npx remotion render $bundleDir ClaudeAnimasiPromo $r1Dir --sequence --image-format=png --frames="$ocBase-$($ocBase+5)" --gl=angle --concurrency=1 --timeout=180000 --muted --log=error
if ($LASTEXITCODE -ne 0) { Write-Error "Failed r1 sequence" }

& npx remotion render $bundleDir ClaudeAnimasiPromo $r2Dir --sequence --image-format=png --frames="$hmBase-$($hmBase+5)" --gl=angle --concurrency=1 --timeout=180000 --muted --log=error
if ($LASTEXITCODE -ne 0) { Write-Error "Failed r2 sequence" }

$r3Targets = @(
    @{ name = "r3_01_s5_early"; frame = $s5End - 150 },
    @{ name = "r3_02_s5_mid1";  frame = $s5End - 95 },
    @{ name = "r3_03_s5_mid2";  frame = $s5End - 45 },
    @{ name = "r3_04_s5_last";  frame = $s5End - 2 },
    @{ name = "r3_05_s6_first"; frame = $s5End + 2 },
    @{ name = "r3_06_s6_mid";   frame = $s5End + 45 }
)
foreach ($t in $r3Targets) {
    Render-StillSafe $t.frame "$r3Dir\$($t.name).png" $t.name
}

Write-Host "=== [4/4] Assembling V3 16-Shot Grid + Motion Smoothness Strip ===" -ForegroundColor Cyan
& python -c "
from pathlib import Path
import cv2, numpy as np

qa = Path(r'$qaDir')
files = sorted(qa.glob('shot_*.png'))
cw, ch = 360, 640
rows = []
for r in range(4):
    row = []
    for c in range(4):
        p = files[r*4+c]
        im = cv2.resize(cv2.imread(str(p)), (cw, ch), interpolation=cv2.INTER_AREA)
        cv2.rectangle(im, (0, 0), (cw, 36), (12, 16, 24), -1)
        cv2.putText(im, p.stem, (10, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.62, (255, 224, 120), 2, cv2.LINE_AA)
        row.append(im)
    rows.append(np.hstack(row))
cv2.imwrite(r'$outGrid', np.vstack(rows), [int(cv2.IMWRITE_JPEG_QUALITY), 92])

sw, sh = 270, 480
r1 = sorted(Path(r'$r1Dir').glob('*.png'))[:6]
r2 = sorted(Path(r'$r2Dir').glob('*.png'))[:6]
r3 = sorted(Path(r'$r3Dir').glob('*.png'))[:6]
srows = []
for row_idx, (rfiles, prefix) in enumerate([(r1, 'OC_consec'), (r2, 'HM_consec'), (r3, 'S5->S6')]):
    row = []
    for c, p in enumerate(rfiles):
        im = cv2.resize(cv2.imread(str(p)), (sw, sh), interpolation=cv2.INTER_AREA)
        cv2.rectangle(im, (0, 0), (sw, 30), (12, 16, 24), -1)
        lbl = p.stem if row_idx == 2 else f'{prefix}_{c+1}'
        cv2.putText(im, lbl, (6, 21), cv2.FONT_HERSHEY_SIMPLEX, 0.54, (124, 227, 255), 1, cv2.LINE_AA)
        row.append(im)
    srows.append(np.hstack(row))
cv2.imwrite(r'$outStrip', np.vstack(srows), [int(cv2.IMWRITE_JPEG_QUALITY), 92])
print('Saved V3 QA Sheets -> $outGrid & $outStrip')
"
