---
name: voicestudio
description: Generate local AI voiceovers (VO), text-to-speech (TTS), voice cloning, dubbing, and transcription using VoiceStudio (http://localhost:3900) and its OpenAI-compatible audio API. Use when the user wants to create voiceovers for Remotion videos, reels, promotional media, or clone voices.
---

# VoiceStudio Skill

VoiceStudio is a local, private alternative to ElevenLabs for text-to-speech (TTS), voice cloning, voice design, dubbing, and transcription.

Repo: `d:\PROJECTS\VoiceStudio`  
Desktop App: `d:\PROJECTS\VoiceStudio-App\VoiceStudio-0.5.7-win-x64.exe`  
Default Server Address: `http://localhost:3900`

---

## 1. Quick Verification & Health Check

Before generating audio, check if the VoiceStudio server is active:

```bash
curl -s http://localhost:3900/health
```

Or in PowerShell:
```powershell
Invoke-RestMethod -Uri "http://localhost:3900/health"
```

If it returns `{"status":"ok"}` or HTTP 200, the engine is ready.

---

## 2. Launching VoiceStudio

### Option A: Launch VoiceStudio Desktop App (Interactive UI)
Run the desktop app where you can clone voices, record audio samples, test models visually, and manage voices:
```powershell
Start-Process "d:\PROJECTS\VoiceStudio-App\VoiceStudio-0.5.7-win-x64.exe"
```

### Option B: Run Headless Backend with `uv`
Run the local FastAPI backend server:
```powershell
cd d:\PROJECTS\VoiceStudio
uv run uvicorn backend.main:app --host 0.0.0.0 --port 3900
```

---

## 3. Discover Available Voices

Fetch the registered voices and installed models:

```bash
curl -s http://localhost:3900/v1/audio/voices
```

Or in PowerShell:
```powershell
Invoke-RestMethod -Uri "http://localhost:3900/v1/audio/voices"
```

---

## 4. Generate Voiceover (TTS)

VoiceStudio provides an OpenAI-compatible speech endpoint at `POST /v1/audio/speech`.

### PowerShell / CLI One-Liner:
```powershell
$body = @{
    model = "tts-1"
    voice = "alloy" # atau nama profile suara hasil cloning
    input = "Selamat datang di Z-Automation. Solusi rekayasa website 3D interaktif dan agen AI otonom."
    response_format = "mp3"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3900/v1/audio/speech" `
    -Method Post `
    -Headers @{ "Content-Type" = "application/json" } `
    -Body $body `
    -OutFile "d:\PROJECTS\z-automation-studio\public\assets\audio\voiceover.mp3"
```

### Using cURL:
```bash
curl -X POST http://localhost:3900/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{
    "model": "tts-1",
    "voice": "alloy",
    "input": "Rekayasa website interaktif 3D dan agen AI otonom untuk bisnis modern.",
    "response_format": "mp3"
  }' \
  --output d:/PROJECTS/z-automation-studio/public/assets/audio/voiceover.mp3
```

---

## 5. Integrating VO into Remotion Videos

In `z-automation-studio`, import and place the generated audio inside your Remotion composition using `<Audio />`:

```tsx
import { Audio, staticFile } from 'remotion';

export const MyVideo = () => {
  return (
    <>
      {/* Background visual components */}
      <Audio src={staticFile('assets/audio/voiceover.mp3')} volume={0.9} />
    </>
  );
};
```

---

## 6. Voice Cloning & Voice Design

1. Open the VoiceStudio Desktop UI or call `POST /v1/voices/clone`.
2. Provide a 10-30 second clean WAV audio clip of the target speaker.
3. Save the voice profile ID (e.g. `zaldy-voice-id`).
4. Pass `voice: "zaldy-voice-id"` into your TTS requests for personalized branding!

---

## 7. Model Context Protocol (MCP)

VoiceStudio also exposes an MCP endpoint at `http://localhost:3900/mcp` for agentic coding tools.
To use the stdio shim:
```bash
python -m backend.mcp_shim
```

