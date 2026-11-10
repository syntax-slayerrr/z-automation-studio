# Z-Automation Studio 🎬✨

The unified multimedia production studio for **Z-Automation** (`https://z-automation.my.id`). This repository contains all code-directed video pipelines, 3D engines, character rigs, procedural audio mixing tools, and agent skills in **ONE** self-contained studio.

---

## 🏛️ Studio Capabilities & Engines

### 1. 🎭 Cartoon 3D Short Engine (Stickman / Bean-Head 1:1 Standard)
- **Engine Source**: `remotion/videos/bridge/`
- **Master Composition**: `BridgeShort` ("The Bridge That Fell for a Song")
- **Visual Mechanics**:
  - 2D Canvas-drawn bean-head vector characters (`toon.ts`, soles at `y = 975`, plum ink outline `#241726`, two-bone IK cycloid walk/run cycles).
  - Colorful 3D Three.js world with black ink outline pass (`ink.ts`), thin-lens depth of field (`lensblur.ts`), and display-referred color grading (`grade.ts`).
  - Contact shadow multiply blending (`blob|contact|...` keying) for zero white box artifacts.
- **Skills**: `skills/cartoon-3d-short/` & `skills/cartoon-short-kit/`.

### 2. 🤖 3D Mascots & Dialogue Engine (Hermes & OpenClaw)
- **Engine Source**: `remotion/components/Sanctum3DMascots.tsx` & `HermesOpenClaw3DStage.tsx`
- **Compositions**:
  - `ZAutomationLaunch`: 1080×1920 (9:16 vertical reel) with Apple-grade tactile sound pass, touch ripples, angle-reactive specular glints, and live 3D mascot stage.
  - `ZAutomationSquarePromo`: 1080×1080 (1:1 feed promo).
- **Characters**:
  - **Hermes**: Primary keynote mascot (Cobalt Blue cyber chassis, glowing orbital think rings, calm and authoritative).
  - **OpenClaw**: Secondary mascot (Red robotic chibi crab, lime accents, dynamic pincer claps, expressive antenna wiggles).

### 3. 🌌 Motion Graphics & Explainers (Kurzgesagt Style)
- **Engine Source**: `remotion/kurzgesagt/`
- **Master Composition**: `KurzgesagtBlackHole`
- **Visual Mechanics**: 2D vector flat cosmic art, relativistic gravitational lensing vortex, kinetic typography, and Perseus soundwave equalizer.

### 4. 🎛️ Audio Studio & Sound Design Pipeline
- **Procedural & Real Foley Mixing**: `scripts/build-sanctum-audio.py`
  - 100% real CC0 recorded SFX bank (`skills/sound-effects/sfx/`).
  - Dynamic ducking (music drops automatically under spoken voice).
  - Razor-tight transient alignment (<1ms pre-roll).
  - Broadcast mastering to **-16.0 LUFS** (True Peak < -4.0 dBFS).
- **Voiceover Pipeline**: `scripts/generate-vo.ps1`
  - Native integration with local **VoiceStudio** (`http://localhost:3900`).
  - Automatic fallback to Microsoft Neural TTS (`id-ID-ArdiNeural` / `id-ID-GadisNeural`).

---

## 📦 Registered Remotion Compositions

| ID Komposisi | Resolusi | Rasio | Durasi | Peruntukan |
| :--- | :--- | :--- | :--- | :--- |
| **`BridgeShort`** | 1080 × 1920 | 9:16 | 67s (2010f) | 1:1 Stickman cartoon 3D short master reference |
| **`ZAutomationLaunch`** | 1080 × 1920 | 9:16 | 14.8s (890f) | Flagship 3D Hermes & OpenClaw promotional reel |
| **`ZAutomationSquarePromo`** | 1080 × 1080 | 1:1 | 14.8s (890f) | Square feed & carousel video promo |
| **`KurzgesagtBlackHole`** | 1080 × 1920 | 9:16 | 32.6s (1958f) | Cosmic science explainer motion graphics |

---

## 🚀 Quick Start

### 1. Preview Studio Interaktif
```bash
npm install
npm run studio
```
Buka `http://localhost:3000` di browser untuk preview live, scrub timeline, dan review animasi per-frame.

### 2. Render Video
```bash
# Render 9:16 Vertical Reel
npm run render:reel

# Render 1:1 Square Feed
npm run render:square

# Render Kurzgesagt Explainer
npm run render:kurzgesagt

# Render Semua Komposisi
npm run render:all
```

---

## 🛠️ Integrated Skills Folder (`skills/`)

Semua AI Agent (Antigravity / Claude Code) dapat langsung membaca dan mengeksekusi instruksi dari folder `skills/`:
- `skills/cartoon-3d-short/`: Pipeline lengkap ide ➔ script ➔ voice ➔ world ➔ 3D stickman render.
- `skills/cartoon-short-kit/`: Engine render Chromium Playwright untuk animasi kartun.
- `skills/sound-effects/`: Bank SFX CC0 dan mixing guidelines.
- `skills/voicestudio/`: Integrasi local voice cloning dan TTS.
- `skills/remotion/`: Aturan dan best practices Remotion v4.
