param(
    [switch]$RebuildBundle
)

$ErrorActionPreference = "Continue"

$root = "d:\PROJECTS\z-automation-studio"
$projDir = "$root\nusantara-samudra"
$tmpDir = "$projDir\.tmp"
$bundleDir = "$projDir\.bundle"
$qaDir = "$projDir\out\qa_stills"
$outSheet = "$projDir\out\qa_16shots.jpg"

New-Item -ItemType Directory -Force -Path $tmpDir, $qaDir, "$projDir\out" | Out-Null
$env:TEMP = $tmpDir
$env:TMP = $tmpDir

Write-Host "=== Step 1: Pre-bundling Remotion project for 16-Shot Visual QA ==="
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

# 16 key mid-frames covering ALL 16 shots (SH01..SH16), plus extra sub-beats on SH13/SH14
$frames = @(
    @{ Label = "SH01 Storm Lightning";     Frame = 55   },
    @{ Label = "SH02 Rope to Stars";       Frame = 370  },
    @{ Label = "SH03 Cloud to Globe";      Frame = 580  },
    @{ Label = "SH04 Madagascar Village";  Frame = 820  },
    @{ Label = "SH05 Language Bridge";     Frame = 1045 },
    @{ Label = "SH06 Indian Ocean Map";    Frame = 1350 },
    @{ Label = "SH07 Borobudur Relief";    Frame = 1620 },
    @{ Label = "SH08 Living Outrigger";    Frame = 1850 },
    @{ Label = "SH09 Sriwijaya Network";   Frame = 2120 },
    @{ Label = "SH10 Global Montage";      Frame = 2395 },
    @{ Label = "SH11 Makassar Harbor";     Frame = 2600 },
    @{ Label = "SH12 Makassar->Australia"; Frame = 2845 },
    @{ Label = "SH13A Trepang Seabed";     Frame = 3030 },
    @{ Label = "SH13B Trepang Drying";     Frame = 3155 },
    @{ Label = "SH14A Metal Axe Trade";    Frame = 3295 },
    @{ Label = "SH14B Dugout Canoe";       Frame = 3445 },
    @{ Label = "SH15 Tri-Legacy Map";      Frame = 3600 },
    @{ Label = "SH16 Nusantara Epilog";    Frame = 3920 }
)

Write-Host "=== Step 2: Rendering 18 Shot QA Stills (1080x1920) ==="
$idx = 1
foreach ($item in $frames) {
    $tag = "{0:D2}" -f $idx
    $png = "$qaDir\sh${tag}_f$($item.Frame).png"
    $ok = $false
    for ($attempt = 1; $attempt -le 2; $attempt++) {
        Write-Host "  [$tag/18] $($item.Label) (f=$($item.Frame)) attempt $attempt/2..."
        & npx remotion still $bundleDir NusantaraSamudraShort $png --frame=$($item.Frame) --log=error 2>&1 | Select-Object -Last 6
        if ($LASTEXITCODE -eq 0 -and (Test-Path $png)) {
            $ok = $true
            break
        }
    }
    if (-not $ok) {
        Write-Host "[FATAL] Failed to render still for $($item.Label) at frame $($item.Frame)"
        exit 1
    }
    $idx++
}

Write-Host "=== Step 3: Stitching 6x3 Labeled Contact Sheet -> $outSheet ==="
$py = @"
from pathlib import Path
from PIL import Image, ImageDraw

qa_dir = Path(r"$qaDir")
out_sheet = Path(r"$outSheet")
items = [
    ("SH01 Storm Lightning", 55),
    ("SH02 Rope to Stars", 370),
    ("SH03 Cloud to Globe", 580),
    ("SH04 Madagascar Village", 820),
    ("SH05 Language Bridge", 1045),
    ("SH06 Indian Ocean Map", 1350),
    ("SH07 Borobudur Relief", 1620),
    ("SH08 Living Outrigger", 1850),
    ("SH09 Sriwijaya Network", 2120),
    ("SH10 Global Montage", 2395),
    ("SH11 Makassar Harbor", 2600),
    ("SH12 Makassar->Australia", 2845),
    ("SH13A Trepang Seabed", 3030),
    ("SH13B Trepang Drying", 3155),
    ("SH14A Metal Axe Trade", 3295),
    ("SH14B Dugout Canoe", 3445),
    ("SH15 Tri-Legacy Map", 3600),
    ("SH16 Nusantara Epilog", 3920),
]

tw, th = 320, 569
pad = 14
cols, rows = 6, 3
W = cols * tw + (cols + 1) * pad
H = rows * th + (rows + 1) * pad
sheet = Image.new("RGB", (W, H), (14, 17, 23))
draw = ImageDraw.Draw(sheet)

for idx, (label, fr) in enumerate(items, start=1):
    p = qa_dir / f"sh{idx:02d}_f{fr}.png"
    im = Image.open(p).convert("RGB").resize((tw, th), Image.Resampling.LANCZOS)
    r, c = divmod(idx - 1, cols)
    x = pad + c * (tw + pad)
    y = pad + r * (th + pad)
    sheet.paste(im, (x, y))
    draw.rectangle([x, y, x + tw, y + 28], fill=(12, 16, 22))
    draw.text((x + 8, y + 7), f"{label} (f={fr})", fill=(244, 212, 130))

sheet.save(out_sheet, quality=92)
print(f"Saved 16-shot QA sheet ({W}x{H}) -> {out_sheet}")
"@
$pyFile = "$tmpDir\stitch_qa16.py"
[System.IO.File]::WriteAllText($pyFile, $py)
python $pyFile
if ($LASTEXITCODE -ne 0) { exit 1 }
