param(
  [switch]$ForceBundle
)
$ErrorActionPreference = "Continue"
$ROOT = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $ROOT

$WORK = Join-Path $ROOT "ep02-sherpa-himalaya"
$TMP_D = Join-Path $WORK ".tmp"
$OUT_DIR = Join-Path $WORK "out"
$BUNDLE_DIR = Join-Path $OUT_DIR "bundle"
$STILLS_DIR = Join-Path $OUT_DIR "qa_stills"
New-Item -ItemType Directory -Force -Path $TMP_D, $STILLS_DIR | Out-Null

$env:TEMP = $TMP_D
$env:TMP = $TMP_D

if ($ForceBundle -or -not (Test-Path (Join-Path $BUNDLE_DIR "index.html"))) {
  Write-Host "=== [1/3] Bundling isolated remotion/entry-ep02-sherpa-himalaya.ts ===" -ForegroundColor Cyan
  if (Test-Path $BUNDLE_DIR) { Remove-Item -Recurse -Force $BUNDLE_DIR }
  npx remotion bundle remotion/entry-ep02-sherpa-himalaya.ts --out-dir $BUNDLE_DIR
  if ($LASTEXITCODE -ne 0) { throw "Bundle failed!" }
}

# 16 Hero Frames covering ALL 8 Beats, all 8 Scientific Instruments & Frame 0 vs Final Loop!
$shots = @(
  @{ idx="01"; frame=0;    label="F0000_LoopAnchor" },
  @{ idx="02"; frame=75;   label="F0075_HookRuler" },
  @{ idx="03"; frame=132;  label="F0132_HoloXOut" },
  @{ idx="04"; frame=172;  label="F0172_SnowGoggles" },
  @{ idx="05"; frame=288;  label="F0288_SherpaVillage" },
  @{ idx="06"; frame=372;  label="F0372_HimalayaMap" },
  @{ idx="07"; frame=422;  label="F0422_2017Scanner" },
  @{ idx="08"; frame=495;  label="F0495_SphericalXRay1" },
  @{ idx="09"; frame=524;  label="F0524_USGBeamCone" },
  @{ idx="10"; frame=650;  label="F0650_USGSingleCallout" },
  @{ idx="11"; frame=776;  label="F0776_USGDualCaliper" },
  @{ idx="12"; frame=872;  label="F0872_SpeckleBattery" },
  @{ idx="13"; frame=1052; label="F1052_XRayRBCPump" },
  @{ idx="14"; frame=1235; label="F1235_LowlandProofXRay" },
  @{ idx="15"; frame=1408; label="F1408_3DDnaHelix" },
  @{ idx="16"; frame=1605; label="F1605_FinaleGlowOrb" }
)

Write-Host "=== [2/3] Rendering 16 Full HD QA Stills (1080x1920, --gl=angle) ===" -ForegroundColor Cyan
foreach ($s in $shots) {
  $outPng = Join-Path $STILLS_DIR ("shot_{0}_{1}.png" -f $s.idx, $s.label)
  if (Test-Path $outPng) { Remove-Item $outPng -Force }
  Write-Host ("  Rendering {0} (frame {1})..." -f $s.label, $s.frame) -ForegroundColor Yellow
  npx remotion still $BUNDLE_DIR Ep02SherpaHimalayaShort $outPng --frame=$($s.frame) --gl=angle --log=error
  if ($LASTEXITCODE -ne 0 -or !(Test-Path $outPng)) {
    Write-Host ("    Retrying {0}..." -f $s.label) -ForegroundColor Red
    Start-Sleep -Seconds 2
    npx remotion still $BUNDLE_DIR Ep02SherpaHimalayaShort $outPng --frame=$($s.frame) --gl=angle --log=error
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
