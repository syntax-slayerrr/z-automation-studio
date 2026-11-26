param(
    [switch]$RebuildBundle
)

$ErrorActionPreference = "Continue"

$root = "d:\PROJECTS\z-automation-studio"
$projDir = "$root\harga-peradaban"
$tmpDir = "$projDir\.tmp"
$bundleDir = "$projDir\.bundle"
$qaDir = "$projDir\out\qa_stills"
$outSheet = "$projDir\out\qa_peradaban_18.jpg"
$alignJson = "$projDir\audio\alignment.json"

New-Item -ItemType Directory -Force -Path $tmpDir, $qaDir, "$projDir\out" | Out-Null
$env:TEMP = $tmpDir
$env:TMP = $tmpDir

$align = Get-Content $alignJson -Raw | ConvertFrom-Json
$sf = $align.shotsFrame

function MidF($key, $frac) {
    $s = [int]$sf.$key.start
    $e = [int]$sf.$key.end
    return [int]($s + ($e - $s) * $frac)
}

Write-Host "=== Step 1: Pre-bundling Remotion project for 18-Shot Lighting & Shadow Visual QA ==="
if ($RebuildBundle -or (-not (Test-Path "$bundleDir\index.html"))) {
    if (Test-Path $bundleDir) { Remove-Item -Recurse -Force $bundleDir }
    npx remotion bundle "$root\remotion\index.ts" --out-dir $bundleDir 2>&1 | Select-Object -Last 12
    if ($LASTEXITCODE -ne 0) {
        Write-Host "BUNDLE FAILED with code $LASTEXITCODE"
        exit 1
    }
} else {
    Write-Host "[SKIP] Reusing bundle at $bundleDir"
}

$frames = @(
    @{ Label = "S01_01 Savanna Nara";       Frame = (MidF "s01_01" 0.45) },
    @{ Label = "S01_02 Deer Tracks";        Frame = (MidF "s01_02" 0.40) },
    @{ Label = "S01_04 Campfire Night";     Frame = (MidF "s01_04" 0.32) },
    @{ Label = "S02_01 Fertile Valley";     Frame = (MidF "s02_01" 0.50) },
    @{ Label = "S02_02 Bracelet Macro";     Frame = (MidF "s02_02" 0.50) },
    @{ Label = "S02_03 Sprouting Seed";     Frame = (MidF "s02_03" 0.72) },
    @{ Label = "S03_01 Planting Rows";      Frame = (MidF "s03_01" 0.75) },
    @{ Label = "S03_03 Building Home";      Frame = (MidF "s03_03" 0.65) },
    @{ Label = "S03_04 Golden Harvest";     Frame = (MidF "s03_04" 0.50) },
    @{ Label = "S04_01 Dark Granary";       Frame = (MidF "s04_01" 0.55) },
    @{ Label = "S04_02 Fenced Fields";      Frame = (MidF "s04_02" 0.50) },
    @{ Label = "S04_03 Water Dispute";      Frame = (MidF "s04_03" 0.50) },
    @{ Label = "S05_01 Bracelet Morph";     Frame = (MidF "s05_01" 0.72) },
    @{ Label = "S05_03 Cuneiform Clay";     Frame = (MidF "s05_03" 0.68) },
    @{ Label = "S05_04 Ancient Uruk";       Frame = (MidF "s05_04" 0.55) },
    @{ Label = "S06_01 Modern Harvester";   Frame = (MidF "s06_01" 0.50) },
    @{ Label = "S06_02 Global System";      Frame = (MidF "s06_02" 0.65) },
    @{ Label = "S06_04 Sunset & EndCard";   Frame = (MidF "s06_04" 0.84) }
)

Write-Host "=== Step 2: Rendering 18 Lighting & Shadow QA Stills (1080x1920) ==="
$idx = 1
$metaLines = @()
foreach ($item in $frames) {
    $tag = "{0:D2}" -f $idx
    $png = "$qaDir\q${tag}_f$($item.Frame).png"
    $ok = $false
    for ($attempt = 1; $attempt -le 2; $attempt++) {
        Write-Host "  [$tag/18] $($item.Label) (f=$($item.Frame)) attempt $attempt/2..."
        & npx remotion still $bundleDir HargaPeradabanShort $png --frame=$($item.Frame) --log=error 2>&1 | Select-Object -Last 6
        if ($LASTEXITCODE -eq 0 -and (Test-Path $png)) {
            $ok = $true
            break
        }
    }
    if (-not $ok) {
        Write-Host "[FATAL] Failed still for $($item.Label) at frame $($item.Frame)"
        exit 1
    }
    $metaLines += "$tag|$($item.Label)|$($item.Frame)"
    $idx++
}

$metaFile = "$tmpDir\qa18_meta.txt"
[System.IO.File]::WriteAllLines($metaFile, $metaLines)

Write-Host "=== Step 3: Stitching 6x3 Labeled QA Contact Sheet -> $outSheet ==="
$py = @"
from pathlib import Path
from PIL import Image, ImageDraw

qa_dir = Path(r"$qaDir")
out_sheet = Path(r"$outSheet")
meta = [ln.strip().split("|") for ln in Path(r"$metaFile").read_text(encoding="utf-8").splitlines() if ln.strip()]

tw, th = 320, 569
pad = 14
cols, rows = 6, 3
W = cols * tw + (cols + 1) * pad
H = rows * th + (rows + 1) * pad
sheet = Image.new("RGB", (W, H), (14, 17, 23))
draw = ImageDraw.Draw(sheet)

for idx, (tag, label, fr) in enumerate(meta):
    p = qa_dir / f"q{tag}_f{fr}.png"
    im = Image.open(p).convert("RGB").resize((tw, th), Image.Resampling.LANCZOS)
    r, c = divmod(idx, cols)
    x = pad + c * (tw + pad)
    y = pad + r * (th + pad)
    sheet.paste(im, (x, y))
    draw.rectangle([x, y, x + tw, y + 28], fill=(12, 16, 22))
    draw.text((x + 8, y + 7), f"{label} (f={fr})", fill=(244, 212, 130))

sheet.save(out_sheet, quality=92)
print(f"Saved 18-shot QA sheet ({W}x{H}) -> {out_sheet}")
"@
$pyFile = "$tmpDir\stitch_qa18.py"
[System.IO.File]::WriteAllText($pyFile, $py)
python $pyFile
if ($LASTEXITCODE -ne 0) { exit 1 }
