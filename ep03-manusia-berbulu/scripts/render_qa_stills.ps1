param(
  [switch]$ForceBundle
)
$ErrorActionPreference = "Continue"
$ROOT = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $ROOT

$WORK = Join-Path $ROOT "ep03-manusia-berbulu"
$TMP_D = Join-Path $WORK ".tmp"
$OUT_DIR = Join-Path $WORK "out"
$BUNDLE_DIR = Join-Path $OUT_DIR "bundle"
$STILLS_DIR = Join-Path $OUT_DIR "qa_stills"
New-Item -ItemType Directory -Force -Path $TMP_D, $STILLS_DIR | Out-Null

$env:TEMP = $TMP_D
$env:TMP = $TMP_D

if ($ForceBundle -or -not (Test-Path (Join-Path $BUNDLE_DIR "index.html"))) {
  Write-Host "=== [1/3] Bundling isolated remotion/entry-ep03-manusia-berbulu.ts ===" -ForegroundColor Cyan
  if (Test-Path $BUNDLE_DIR) { Remove-Item -Recurse -Force $BUNDLE_DIR }
  npx remotion bundle remotion/entry-ep03-manusia-berbulu.ts --out-dir $BUNDLE_DIR
  if ($LASTEXITCODE -ne 0) { throw "Bundle failed!" }
}

# 16 Primary Contact-Sheet Frames + 3 Bonus Hero Stills covering ALL 15 Storyboard Shots & Every Instrument!
$shots = @(
  @{ idx="01"; frame=22;   label="F0022_SH001_Chimp" },
  @{ idx="02"; frame=168;  label="F0168_SH001_ThreeApes" },
  @{ idx="03"; frame=285;  label="F0285_SH002_BareHuman" },
  @{ idx="04"; frame=720;  label="F0720_SH003_RainFurJacket" },
  @{ idx="05"; frame=968;  label="F0968_SH004_ClimateSavanna" },
  @{ idx="06"; frame=1185; label="F1185_SH005a_SplitWorld" },
  @{ idx="07"; frame=1302; label="F1302_SH005b_EastAfricaMap" },
  @{ idx="08"; frame=1575; label="F1575_SH006_SavannaHunter" },
  @{ idx="09"; frame=1885; label="F1885_SH007_OverheatXRay" },
  @{ idx="10"; frame=2102; label="F2102_SH008a_FurXOut" },
  @{ idx="11"; frame=2225; label="F2225_SH008b_10xSweatUSG" },
  @{ idx="12"; frame=2565; label="F2565_SH009_JoggerCooling" },
  @{ idx="13"; frame=2755; label="F2755_SH010_ScalpUmbrella" },
  @{ idx="14"; frame=3015; label="F3015_SH011_UVBurnSkin" },
  @{ idx="15"; frame=3468; label="F3468_SH012b_SunblockXOut" },
  @{ idx="16"; frame=3850; label="F3850_SH013_DNASwitchOff" }
)

$bonusShots = @(
  @{ idx="17"; frame=3355; label="F3355_SH012a_MelaninRise" },
  @{ idx="18"; frame=4050; label="F4050_SH014_Goosebumps" },
  @{ idx="19"; frame=4515; label="F4515_SH015_FinaleOrb" }
)

$allShots = $shots + $bonusShots
Write-Host "=== [2/3] Rendering $($allShots.Count) Full HD QA Stills (1080x1920, --gl=angle) ===" -ForegroundColor Cyan
foreach ($s in $allShots) {
  $outPng = Join-Path $STILLS_DIR ("shot_{0}_{1}.png" -f $s.idx, $s.label)
  if (Test-Path $outPng) { Remove-Item $outPng -Force }
  Write-Host ("  Rendering {0} (frame {1})..." -f $s.label, $s.frame) -ForegroundColor Yellow
  npx remotion still $BUNDLE_DIR Ep03ManusiaBerbuluShort $outPng --frame=$($s.frame) --gl=angle --log=error
  if ($LASTEXITCODE -ne 0 -or !(Test-Path $outPng)) {
    Write-Host ("    Retrying {0}..." -f $s.label) -ForegroundColor Red
    Start-Sleep -Seconds 2
    npx remotion still $BUNDLE_DIR Ep03ManusiaBerbuluShort $outPng --frame=$($s.frame) --gl=angle --log=error
    if ($LASTEXITCODE -ne 0 -or !(Test-Path $outPng)) { throw "Still failed at frame $($s.frame)!" }
  }
}

Write-Host "=== [3/3] Assembling 4x4 Full HD QA Contact Sheet ===" -ForegroundColor Cyan
$sheetJpg = Join-Path $OUT_DIR "qa_16_shots.jpg"
$inputs = $shots | ForEach-Object { "-i"; (Join-Path $STILLS_DIR ("shot_{0}_{1}.png" -f $_.idx, $_.label)) }
$filter = "[0:v][1:v][2:v][3:v]hstack=inputs=4[r0];[4:v][5:v][6:v][7:v]hstack=inputs=4[r1];[8:v][9:v][10:v][11:v]hstack=inputs=4[r2];[12:v][13:v][14:v][15:v]hstack=inputs=4[r3];[r0][r1][r2][r3]vstack=inputs=4,scale=1440:2560[out]"
& ffmpeg -y -loglevel error @inputs -filter_complex $filter -map "[out]" -frames:v 1 -q:v 2 $sheetJpg
if ($LASTEXITCODE -ne 0) { throw "Contact sheet assembly failed!" }
Write-Host "QA 16-SHOT CONTACT SHEET READY -> $sheetJpg" -ForegroundColor Green
