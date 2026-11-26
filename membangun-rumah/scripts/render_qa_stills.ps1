$ErrorActionPreference = "Stop"

$root = "d:\PROJECTS\z-automation-studio"
$bundleDir = "$root\membangun-rumah\out\bundle"
$qaDir = "$root\membangun-rumah\out\qa_stills"

Set-Location $root

if (Test-Path $qaDir) { Remove-Item -Recurse -Force $qaDir }
New-Item -ItemType Directory -Path $qaDir -Force | Out-Null

Write-Host "=== [1/3] Bundling isolated remotion/entry-rumah.ts -> $bundleDir ===" -ForegroundColor Cyan
if (Test-Path $bundleDir) { Remove-Item -Recurse -Force $bundleDir }
& npx remotion bundle remotion/entry-rumah.ts --out-dir $bundleDir
if ($LASTEXITCODE -ne 0) { Write-Error "Bundle failed." }

$align = Get-Content "$root\membangun-rumah\audio\alignment.json" -Raw | ConvertFrom-Json
$c = $align.cuesFrame
$s = $align.scenesFrame
$lastFrame = [int]$align.totalFrames - 1

$targets = @(
    @{ name = "01_s1_rain_cardboard";   frame = [int]$c.s1_puddle + 18 },
    @{ name = "02_s1_heat_glare";       frame = [int]$c.s1_heat + 24 },
    @{ name = "03_s1_face_house_idea";  frame = [int]$c.s1_idea + 34 },
    @{ name = "04_s2_blueprint_rooms";  frame = [int]$c.s2_rooms + 12 },
    @{ name = "05_s2_3d_maquette";      frame = [int]$c.s2_model3d + 32 },
    @{ name = "06_s3_stakes_hardhat";   frame = [int]$c.s3_stakes + 18 },
    @{ name = "07_s3_chalk_grid";       frame = [int]$c.s3_grid + 20 },
    @{ name = "08_s4_stones_rebar";     frame = [int]$c.s4_rebar + 34 },
    @{ name = "09_s4_load_arrows";      frame = [int]$c.s4_load + 24 },
    @{ name = "10_s5_columns_beams";    frame = [int]$c.s5_orbit + 18 },
    @{ name = "11_s6_bricks_frames";    frame = [int]$c.s6_openings + 22 },
    @{ name = "12_s6_roof_genteng";     frame = [int]$c.s6_building + 16 },
    @{ name = "13_s7_utilities_cutaway";frame = [int]$c.s7_utilities + 26 },
    @{ name = "14_s7_furniture_lights"; frame = [int]$c.s7_furniture + 26 },
    @{ name = "15_s8_family_rain_safe"; frame = [int]$c.s8_family + 30 },
    @{ name = "16_s8_closing_dusk";     frame = [Math]::Max(0, $lastFrame - 12) }
)

Write-Host "=== [2/3] Rendering 16 Full HD (1080x1920) Architectural Cutaway QA Stills ===" -ForegroundColor Cyan
foreach ($t in $targets) {
    $outPng = "$qaDir\$($t.name).png"
    Write-Host ("  Rendering {0} (frame {1})..." -f $t.name, $t.frame) -ForegroundColor Yellow
    & npx remotion still $bundleDir MembangunRumahShort $outPng --frame=$($t.frame) --gl=angle --log=error
    if ($LASTEXITCODE -ne 0 -or !(Test-Path $outPng)) {
        Write-Error "Failed to render still $($t.name) at frame $($t.frame)"
    }
}

Write-Host "=== [3/3] Assembling 4x4 QA Contact Sheet + 2x2 Hero Detail Closeups ===" -ForegroundColor Cyan
& python membangun-rumah/scripts/make_qa_grid.py
Write-Host "QA STILLS COMPLETE -> membangun-rumah/out/qa_contact_sheet_4x4.jpg" -ForegroundColor Green
