param(
  [string]$CompId = "AnthropologyShowcase",
  [string]$OutDir = "anthropology-showcase/out",
  [string]$Frames = "36,138,232,330,398,462,548,612,716",
  [string]$SheetName = "style_proof_sheet.jpg",
  [switch]$KeepBundle
)

$ErrorActionPreference = "Continue"
$Root = (Resolve-Path "$PSScriptRoot\..\..").Path
$WorkOut = Join-Path $Root $OutDir
$WorkBase = Split-Path $WorkOut -Parent
$BundleDir = Join-Path $WorkBase ".bundle"
$TempDir = Join-Path $WorkBase ".tmp"

New-Item -ItemType Directory -Force -Path $WorkOut, $TempDir | Out-Null
$env:TEMP = $TempDir
$env:TMP = $TempDir

Write-Host "1/3 Pre-bundling Remotion entry once -> $BundleDir"
npx remotion bundle remotion/index.ts --out-dir $BundleDir
if ($LASTEXITCODE -ne 0) {
  Write-Error "Remotion bundle failed with exit code $LASTEXITCODE"
  exit $LASTEXITCODE
}

$FrameList = $Frames.Split(",") | ForEach-Object { $_.Trim() }
$StillPaths = @()
$Idx = 1
foreach ($fr in $FrameList) {
  $StillOut = Join-Path $WorkOut ("shot{0}_f{1}.png" -f $Idx, $fr)
  Write-Host ("2/3 Rendering still {0}/{1}: {2} @ frame {3}" -f $Idx, $FrameList.Count, $CompId, $fr)
  npx remotion still $BundleDir $CompId $StillOut --frame=$fr
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Retrying still at frame $fr once..."
    npx remotion still $BundleDir $CompId $StillOut --frame=$fr
    if ($LASTEXITCODE -ne 0) {
      Write-Error "Still render failed at frame $fr (exit $LASTEXITCODE)"
      exit $LASTEXITCODE
    }
  }
  $StillPaths += $StillOut
  $Idx++
}

$SheetPath = Join-Path $WorkOut $SheetName
$JoinedStills = ($StillPaths -join "|")
Write-Host "3/3 Stitching high-res QA contact sheet -> $SheetPath"
python -c "import sys; from PIL import Image; paths = sys.argv[1].split('|'); imgs = [Image.open(p).convert('RGB') for p in paths]; is_port = imgs[0].height > imgs[0].width; cols = 3 if (is_port and len(imgs) == 9) else (4 if (is_port and len(imgs) >= 4) else (len(imgs) if is_port else 2)); rows = (len(imgs) + cols - 1) // cols; tw, th = (400, 711) if (is_port and cols == 3) else ((420, 747) if (is_port and len(imgs) > 4) else ((450, 800) if is_port else (960, 540))); pad = 12; sheet = Image.new('RGB', (cols * tw + (cols + 1) * pad, rows * th + (rows + 1) * pad), (18, 17, 20)); [sheet.paste(im.resize((tw, th), Image.Resampling.LANCZOS), ((i % cols) * (tw + pad) + pad, (i // cols) * (th + pad) + pad)) for i, im in enumerate(imgs)]; sheet.save(sys.argv[2], quality=92); print('Saved contact sheet:', sys.argv[2], sheet.size)" $JoinedStills $SheetPath
if ($LASTEXITCODE -ne 0) {
  Write-Error "Contact sheet stitch failed"
  exit $LASTEXITCODE
}

if (-not $KeepBundle) {
  Remove-Item -Recurse -Force -ErrorAction SilentlyContinue $BundleDir, $TempDir
}
Write-Host "DONE -> $SheetPath"
