<#
.SYNOPSIS
    All-in-one Production Pipeline for Z-Automation Studio.
    Automates: Copywriting -> VoiceStudio VO Generation -> Remotion Rendering.
.PARAMETER Format
    "reel" (9:16 vertical) or "feed" (1:1 square). Default: "reel".
.PARAMETER Text
    Voiceover narration script.
#>
param(
    [ValidateSet("reel", "feed")]
    [string]$Format = "reel",
    
    [string]$Text = "Z-Automation: Solusi rekayasa website 3D interaktif dan implementasi agen kecerdasan buatan otonom untuk keunggulan bisnis modern."
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🚀 Z-AUTOMATION CONTENT PRODUCTION PIPELINE" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Step 1: Voiceover Generation
Write-Host "`n[1/2] Menghasilkan Voiceover (VO)..." -ForegroundColor Yellow
& "$PSScriptRoot\generate-vo.ps1" -Text $Text
if ($LASTEXITCODE -ne 0) {
    Write-Host "Gagal membuat audio. Pembatalan render." -ForegroundColor Red
    exit 1
}

# Step 2: Remotion Video Rendering
Write-Host "`n[2/2] Merender Video Remotion ($Format)..." -ForegroundColor Yellow
if ($Format -eq "reel") {
    npm run render:reel
} else {
    npm run render:square
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n🎉 PRODUKSI SELESAI!" -ForegroundColor Green
    Write-Host "Video siap diupload untuk promosi Z-Automation." -ForegroundColor White
} else {
    Write-Host "`n❌ Error saat rendering video." -ForegroundColor Red
    exit 1
}

