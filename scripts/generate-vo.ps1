<#
.SYNOPSIS
    Generate voiceover (VO) audio for Z-Automation studio videos.
    Supports VoiceStudio (local cloning) with smart fallback to Microsoft Neural TTS (Indonesian).
.PARAMETER Text
    The narration text to synthesize.
.PARAMETER Voice
    Voice profile ID (default: alloy for VoiceStudio, id-ID-ArdiNeural for Neural fallback).
.PARAMETER OutputFile
    Target output file path (default: public/assets/audio/voiceover.mp3).
#>
param(
    [Parameter(Mandatory=$true)]
    [string]$Text,
    
    [string]$Voice = "id-ID-ArdiNeural",
    
    [string]$OutputFile = "public/assets/audio/voiceover.mp3"
)

$targetDir = Split-Path -Parent $OutputFile
if ($targetDir -and -not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
}

$backendUrl = "http://localhost:3900"

Write-Host "🎙️ Z-Automation Studio VO Pipeline" -ForegroundColor Cyan
Write-Host "Cek koneksi ke engine VoiceStudio di $backendUrl..." -ForegroundColor Gray

$useVoiceStudio = $false
try {
    $health = Invoke-RestMethod -Uri "$backendUrl/health" -TimeoutSec 2 -ErrorAction Stop
    $useVoiceStudio = $true
    Write-Host "✅ VoiceStudio local engine AKTIF" -ForegroundColor Green
} catch {
    Write-Host "ℹ️ VoiceStudio offline. Menggunakan Neural Voice Engine (id-ID)..." -ForegroundColor Yellow
}

if ($useVoiceStudio) {
    $payload = @{
        model = "tts-1"
        voice = if ($Voice -eq "id-ID-ArdiNeural") { "alloy" } else { $Voice }
        input = $Text
        response_format = "mp3"
    } | ConvertTo-Json

    Write-Host "Memproses VO via VoiceStudio API..." -ForegroundColor Cyan
    try {
        Invoke-RestMethod -Uri "$backendUrl/v1/audio/speech" `
            -Method Post `
            -Headers @{ "Content-Type" = "application/json" } `
            -Body $payload `
            -OutFile $OutputFile `
            -TimeoutSec 60
            
        Write-Host "✨ VO audio tersimpan di: $OutputFile" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Gagal lewat VoiceStudio API, beralih ke Neural TTS..." -ForegroundColor Yellow
        $useVoiceStudio = $false
    }
}

if (-not $useVoiceStudio) {
    Write-Host "Menghasilkan suara jernih via Neural TTS (Voice: $Voice)..." -ForegroundColor Cyan
    $edgeVoice = if ($Voice -in @("alloy", "echo", "fable", "onyx", "nova", "shimmer")) { "id-ID-ArdiNeural" } else { $Voice }
    
    edge-tts --voice $edgeVoice --text $Text --write-media $OutputFile
    if ($LASTEXITCODE -eq 0 -and (Test-Path $OutputFile)) {
        Write-Host "✨ VO audio tersimpan di: $OutputFile" -ForegroundColor Green
    } else {
        Write-Host "❌ Gagal menghasilkan audio VO." -ForegroundColor Red
        exit 1
    }
}
