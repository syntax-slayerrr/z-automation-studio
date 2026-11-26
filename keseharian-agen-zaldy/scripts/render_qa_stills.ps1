param([switch]$ForceBundle)
$ErrorActionPreference = "Stop"

$root = "d:\PROJECTS\z-automation-studio"
$bundleDir = "$root\keseharian-agen-zaldy\out\bundle"
$qaDir = "$root\keseharian-agen-zaldy\out\qa_stills"
$outGrid = "$root\keseharian-agen-zaldy\out\qa_all_shots.jpg"
$outStrip = "$root\keseharian-agen-zaldy\out\qa_timelapse_work_strip.jpg"

Set-Location $root
if ($ForceBundle -and (Test-Path $qaDir)) {
    Remove-Item -Recurse -Force $qaDir
}
New-Item -ItemType Directory -Path $qaDir -Force | Out-Null

Write-Host "=== [1/4] Bundling remotion/entry-keseharian.ts ===" -ForegroundColor Cyan
if ($ForceBundle -or !(Test-Path "$bundleDir\index.html")) {
    if (Test-Path $bundleDir) { Remove-Item -Recurse -Force $bundleDir }
    & npx remotion bundle remotion/entry-keseharian.ts --out-dir $bundleDir
    if ($LASTEXITCODE -ne 0) { Write-Error "Bundle failed." }
} else {
    Write-Host "  Reusing existing bundle." -ForegroundColor DarkGreen
}

$align = Get-Content "$root\keseharian-agen-zaldy\audio\alignment.json" -Raw | ConvertFrom-Json
$c = $align.cuesFrame
$s = $align.scenesFrame

function Render-StillSafe($frame, $outPng, $label) {
    if ((Test-Path $outPng) -and (Get-Item $outPng).Length -gt 20000) {
        Write-Host ("  CACHED {0} (frame {1})" -f $label, $frame) -ForegroundColor DarkGreen
        return
    }
    Write-Host ("  Rendering {0} (frame {1})..." -f $label, $frame) -ForegroundColor Yellow
    & npx remotion still $bundleDir KeseharianAgenZaldy $outPng --frame=$frame --gl=angle --timeout=120000 --log=error
    if ($LASTEXITCODE -ne 0 -or !(Test-Path $outPng)) {
        Write-Host "    Retry $label after 2s..." -ForegroundColor Red
        Start-Sleep -Seconds 2
        & npx remotion still $bundleDir KeseharianAgenZaldy $outPng --frame=$frame --gl=angle --timeout=180000 --log=error
        if ($LASTEXITCODE -ne 0 -or !(Test-Path $outPng)) { Write-Error "Failed still $label" }
    }
}

$targets = @(
    @{ name = "SH01_s1_high_angle";        frame = 36 },
    @{ name = "SH02_s1_oc_ngopi";          frame = [int]$c.s1_oc_chill + 14 },
    @{ name = "SH03_s1_chat_insert";       frame = [int]$c.s1_brief + 30 },
    @{ name = "SH04_s2_ots_hm_to_oc";      frame = [int]$c.s2_proud + 28 },
    @{ name = "SH05_s2_ots_oc_to_hm";      frame = [int]$c.s2_ask_render + 22 },
    @{ name = "SH06_s2_low_angle_hero";    frame = [int]$c.s2_zero + 32 },
    @{ name = "SH07_s2_ecu_deadpan";       frame = [int]$c.s2_folder_roast + 24 },
    @{ name = "SH08_s3_master_revisi";     frame = [int]$s.s3 + 28 },
    @{ name = "SH09_s3_dutch_tilt_tower";  frame = [int]$c.s3_perfeksionis - 18 },
    @{ name = "SH10_s3_two_shot_gorengan"; frame = [int]$c.s3_gorengan + 36 },
    @{ name = "SH11_s4_crane_flow_state";  frame = [int]$c.s4_deal + 16 },
    @{ name = "SH12_s4_macro_acc_badge";   frame = [int]$c.s4_ready + 32 },
    @{ name = "SH13_s5_sleep_mode";        frame = [int]$s.s5 + 32 },
    @{ name = "SH14_s5_dutch_twist_chat";  frame = [int]$c.s5_ping + 30 },
    @{ name = "SH15_s5_wide_pullback";     frame = [int]$align.totalFrames - 24 }
)

Write-Host "=== [2/4] Rendering 15 Full HD Shot QA Stills ===" -ForegroundColor Cyan
foreach ($t in $targets) {
    Render-StillSafe $t.frame "$qaDir\$($t.name).png" $t.name
}

$tlDir = "$qaDir\timelapse"
New-Item -ItemType Directory -Path $tlDir -Force | Out-Null
$s4A = [int]$s.s4
$s4B = [int]$c.s4_ready - 10
$tlTargets = @(
    @{ name = "tl_01_sh04_dawn_start";  frame = [int]$s.s2 + 12 },
    @{ name = "tl_02_sh04_dawn_end";    frame = [int]$s.s2 + 64 },
    @{ name = "tl_03_sh08_noon_surge";  frame = [int]$s.s3 + 42 },
    @{ name = "tl_04_sh11_work_start";  frame = $s4A + 18 },
    @{ name = "tl_05_sh11_work_mid";    frame = [int](($s4A + $s4B) / 2) },
    @{ name = "tl_06_sh11_work_sunset"; frame = $s4B - 8 }
)
Write-Host "=== [3/4] Rendering 6-Frame Solar Timelapse & Keyboard Working Montage Strip ===" -ForegroundColor Cyan
foreach ($t in $tlTargets) {
    Render-StillSafe $t.frame "$tlDir\$($t.name).png" $t.name
}

Write-Host "=== [4/4] Assembling 15-Shot Contact Sheet + 6-Frame Timelapse Proof Strip ===" -ForegroundColor Cyan
& python -c "
from pathlib import Path
import cv2, numpy as np

qa = Path(r'$qaDir')
files = sorted(qa.glob('SH*.png'))
thumb_w, thumb_h = 432, 768
grid = np.zeros((thumb_h * 3, thumb_w * 5, 3), dtype=np.uint8)

for i, f in enumerate(files[:15]):
    img = cv2.imread(str(f))
    if img is None:
        continue
    thumb = cv2.resize(img, (thumb_w, thumb_h), interpolation=cv2.INTER_AREA)
    r, c = i // 5, i % 5
    grid[r*thumb_h:(r+1)*thumb_h, c*thumb_w:(c+1)*thumb_w] = thumb
    lbl = f.stem
    cv2.rectangle(grid, (c*thumb_w + 8, r*thumb_h + 8), (c*thumb_w + 335, r*thumb_h + 44), (10, 15, 28), -1)
    cv2.putText(grid, lbl, (c*thumb_w + 16, r*thumb_h + 34), cv2.FONT_HERSHEY_SIMPLEX, 0.58, (255, 224, 102), 2, cv2.LINE_AA)

cv2.imwrite(r'$outGrid', grid, [cv2.IMWRITE_JPEG_QUALITY, 92])

tl_files = sorted((qa / 'timelapse').glob('tl_*.png'))[:6]
sw, sh = 360, 640
strip = np.zeros((sh, sw * 6, 3), dtype=np.uint8)
for i, f in enumerate(tl_files):
    im = cv2.imread(str(f))
    if im is not None:
        strip[0:sh, i*sw:(i+1)*sw] = cv2.resize(im, (sw, sh), interpolation=cv2.INTER_AREA)
        cv2.rectangle(strip, (i*sw+8, 8), (i*sw+310, 40), (10, 15, 28), -1)
        cv2.putText(strip, f.stem, (i*sw+14, 31), cv2.FONT_HERSHEY_SIMPLEX, 0.52, (255, 224, 102), 2, cv2.LINE_AA)
cv2.imwrite(r'$outStrip', strip, [cv2.IMWRITE_JPEG_QUALITY, 92])
print('Saved QA sheets:', r'$outGrid', r'$outStrip')
"
Write-Host "QA Stills complete!" -ForegroundColor Green
