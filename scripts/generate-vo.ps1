<#
.SYNOPSIS
    Generate voiceover (VO) audio file from text using local VoiceStudio engine.
.PARAMETER Text
    The narration text to synthesize.
.PARAMETER Voice
    Voice profile ID (default: alloy).
.PARAMETER OutputFile
    Target output file path (default: public/assets/audio/voiceover.mp3).
#>
param(
    [Parameter(Mandatory=$true)]
    [string]$Text,
    
    [string]$Voice = "alloy",
    
    [string]$OutputFile = "public/assets/audio/voiceover.mp3"
)

$targetDir = Split-Path -Parent $OutputFile
if ($targetDir -and -not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
}

$backendUrl = "http://localhost:3900"

Write-Host "🎙️ VoiceStudio VO Generator" -ForegroundColor Cyan
Write-Host "Checking VoiceStudio backend at $backendUrl..." -ForegroundColor Gray

try {
    $health = Invoke-RestMethod -Uri "$backendUrl/health" -TimeoutSec 3 -ErrorAction Stop
    Write-Host "✅ Backend is ONLINE" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Backend is NOT running at $backendUrl" -ForegroundColor Yellow
    Write-Host "Pastikan VoiceStudio Desktop App atau FastAPI backend sudah dijalankan." -ForegroundColor DarkYellow
    Write-Host "Untuk menjalankan backend:" -ForegroundColor White
    Write-Host "  cd d:\PROJECTS\VoiceStudio" -ForegroundColor Cyan
    Write-Host "  uv run uvicorn backend.main:app --host 0.0.0.0 --port 3900" -ForegroundColor Cyan
    exit 1
}

$payload = @{
    model = "tts-1"
    voice = $Voice
    input = $Text
    response_format = "mp3"
} | ConvertTo-Json

Write-Host "Synthesizing text: '$Text'..." -ForegroundColor Cyan

try {
    Invoke-RestMethod -Uri "$backendUrl/v1/audio/speech" `
        -Method Post `
        -Headers @{ "Content-Type" = "application/json" } `
        -Body $payload `
        -OutFile $OutputFile `
        -TimeoutSec 60
        
    Write-Host "✨ VO audio successfully saved to: $OutputFile" -ForegroundColor Green
} catch {
    Write-Host "❌ Error generating speech: $_" -ForegroundColor Red
    exit 1
}
