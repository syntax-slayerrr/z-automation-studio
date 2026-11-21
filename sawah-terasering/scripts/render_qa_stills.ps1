$ErrorActionPreference = "Stop"

$root = "d:\PROJECTS\z-automation-studio"
$bundleDir = "$root\sawah-terasering\out\bundle"
$qaDir = "$root\sawah-terasering\out\qa_stills"

Set-Location $root

if (Test-Path $qaDir) { Remove-Item -Recurse -Force $qaDir }
New-Item -ItemType Directory -Path $qaDir -Force | Out-Null

Write-Host "=== [1/3] Bundling isolated remotion/entry-sawah.ts -> $bundleDir ===" -ForegroundColor Cyan
if (Test-Path $bundleDir) { Remove-Item -Recurse -Force $bundleDir }
& npx remotion bundle remotion/entry-sawah.ts --out-dir $bundleDir
if ($LASTEXITCODE -ne 0) { Write-Error "Bundle failed." }

# Read exact frame cues dynamically from alignment.json
$align = Get-Content "$root\sawah-terasering\audio\alignment.json" -Raw | ConvertFrom-Json
$c = $align.cuesFrame
$s = $align.seqsFrame
$lastFrame = [int]$align.totalFrames - 1

$targets = @(
    @{ name = "01_f0000_loop_start";    frame = 0 },
    @{ name = "02_s1_monsoon_wash";     frame = [int]$c.s1_rain + 48 },
    @{ name = "03_s2_angle_30_erosion"; frame = [int]$c.s2_angle + 42 },
    @{ name = "04_s2_bare_rocks";       frame = [int]$c.s2_bare + 20 },
    @{ name = "05_s3_ik_hoe_chop";      frame = [int]$c.s3_carve + 44 },
    @{ name = "06_s3_terasering_steps"; frame = [int]$c.s3_label + 24 },
    @{ name = "07_s3_ik_pematang_pat";  frame = [int]$c.s3_bund + 8 },
    @{ name = "08_s4_ik_pitcher_flat";  frame = [int]$c.s4_pour_flat + 30 },
    @{ name = "09_s4_stepped_braking";  frame = [int]$c.s4_brake + 25 },
    @{ name = "10_s5_crane_dive";       frame = [int]$c.s5_dive + 48 },
    @{ name = "11_s5_cutaway_seep";     frame = [int]$c.s5_seep + 42 },
    @{ name = "12_s5_root_interlock";   frame = [int]$c.s5_roots + 48 },
    @{ name = "13_s6_ik_bamboo_pipe";   frame = [int]$c.s6_pipe + 8 },
    @{ name = "14_s6_water_cascade";    frame = [int]$c.s6_cascade + 56 },
    @{ name = "15_s7_golden_sunset";    frame = [int]$c.s7_dam + 36 },
    @{ name = "16_flast_loop_end";      frame = $lastFrame }
)

Write-Host "=== [2/3] Rendering 16 Full HD (1080x1920) IK/Physics QA Stills ===" -ForegroundColor Cyan
foreach ($t in $targets) {
    $outPng = "$qaDir\$($t.name).png"
    Write-Host ("  Rendering {0} (frame {1})..." -f $t.name, $t.frame) -ForegroundColor Yellow
    & npx remotion still $bundleDir SawahTeraseringShort $outPng --frame=$($t.frame) --gl=angle --log=error
    if ($LASTEXITCODE -ne 0 -or !(Test-Path $outPng)) {
        Write-Error "Failed to render still $($t.name) at frame $($t.frame)"
    }
}

Write-Host "=== [3/3] Assembling 4x4 QA Contact Sheet + Loop Comparison ===" -ForegroundColor Cyan
& python sawah-terasering/scripts/make_qa_grid.py
Write-Host "QA STILLS COMPLETE -> sawah-terasering/out/qa_contact_sheet_4x4.jpg" -ForegroundColor Green
