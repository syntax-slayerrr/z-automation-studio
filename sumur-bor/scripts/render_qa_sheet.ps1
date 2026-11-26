$ErrorActionPreference = "Stop"

$Root = "d:\PROJECTS\z-automation-studio"
$OutDir = "$Root\sumur-bor\out"
$BundleDir = "$OutDir\bundle"
$QaDir = "$OutDir\qa_stills"

New-Item -ItemType Directory -Force -Path $OutDir, $QaDir | Out-Null

$PropsFile = "$Root\sumur-bor\scripts\muted_props.json"
if (-not (Test-Path "$BundleDir\index.html") -or $args -contains "--rebundle") {
  Write-Host "=== [1/3] Pre-Bundling Isolated Entry (remotion/entry-sumur.ts) ===" -ForegroundColor Cyan
  Set-Location $Root
  npx remotion bundle remotion/entry-sumur.ts --out-dir $BundleDir
  if ($LASTEXITCODE -ne 0) { throw "Remotion bundle failed!" }
} else {
  Write-Host "=== [1/3] Reusing Existing Bundle ($BundleDir) ===" -ForegroundColor Yellow
  Set-Location $Root
}

$Frames = @(45, 138, 225, 430, 580, 875, 980, 1225, 1465, 2190, 2545, 2715, 3045, 3145, 3510, 3790)

Write-Host "=== [2/3] Rendering 16 Full-HD QA Keyframes (--gl=angle) ===" -ForegroundColor Cyan
$i = 0
foreach ($f in $Frames) {
  $i++
  $idx = $i.ToString("00")
  $outPng = "$QaDir\qa_${idx}_f${f}.png"
  if ($args -contains "--resume" -and (Test-Path $outPng) -and (Get-Item $outPng).LastWriteTime -gt (Get-Item "$BundleDir\index.html").LastWriteTime) {
    Write-Host ("  [{0}/16] SKIP already-updated frame {1}" -f $idx, $f) -ForegroundColor DarkGray
    continue
  }
  $ok = $false
  for ($attempt = 1; $attempt -le 3; $attempt++) {
    Write-Host ("  [{0}/16] Rendering frame {1} (attempt {2}) -> {3}" -f $idx, $f, $attempt, (Split-Path $outPng -Leaf))
    npx remotion still $BundleDir SumurBorShort $outPng --frame=$f --gl=angle --props=$PropsFile
    if ($LASTEXITCODE -eq 0 -and (Test-Path $outPng)) { $ok = $true; break }
    Start-Sleep -Seconds 2
  }
  if (-not $ok) { throw "Still render failed at frame $f after 3 attempts" }
}

Write-Host "=== [3/3] Compositing 4x4 QA Contact Sheet (sumur-bor/out/qa_contact_sheet_4x4.jpg) ===" -ForegroundColor Cyan
python -c @"
import glob, cv2, numpy as np
files = sorted(glob.glob(r'$QaDir\qa_*.png'))
assert len(files) == 16, f'Expected 16 stills, found {len(files)}'
tw, th = 450, 800
tiles = []
for f in files:
    im = cv2.imread(f)
    im = cv2.resize(im, (tw, th), interpolation=cv2.INTER_AREA)
    label = f.split('qa_')[-1].replace('.png', '')
    cv2.rectangle(im, (8, 8), (158, 42), (10, 16, 26), -1)
    cv2.putText(im, label, (16, 33), cv2.FONT_HERSHEY_SIMPLEX, 0.72, (255, 230, 90), 2, cv2.LINE_AA)
    tiles.append(im)
rows = [np.hstack(tiles[r*4:(r+1)*4]) for r in range(4)]
sheet = np.vstack(rows)
cv2.imwrite(r'$OutDir\qa_contact_sheet_4x4.jpg', sheet, [cv2.IMWRITE_JPEG_QUALITY, 92])
# Also save 2x2 high-res hero zoom sheets for detailed lighting/shadow inspection
hero1 = np.vstack([np.hstack([tiles[0], tiles[2]]), np.hstack([tiles[5], tiles[8]])])
hero2 = np.vstack([np.hstack([tiles[9], tiles[11]]), np.hstack([tiles[13], tiles[14]])])
cv2.imwrite(r'$OutDir\qa_hero_A_2x2.jpg', hero1, [cv2.IMWRITE_JPEG_QUALITY, 94])
cv2.imwrite(r'$OutDir\qa_hero_B_2x2.jpg', hero2, [cv2.IMWRITE_JPEG_QUALITY, 94])
print('Saved QA sheets successfully!')
"@
if ($LASTEXITCODE -ne 0) { throw "Contact sheet assembly failed!" }
Write-Host "QA CONTACT SHEET READY: $OutDir\qa_contact_sheet_4x4.jpg" -ForegroundColor Green
