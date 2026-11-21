# PHASE 0 — ENVIRONMENT & PROJECT AUDIT REPORT

## 1. Workspace & Existing Repository Audit
- **Workspace Root**: `d:\PROJECTS\z-automation-studio`
- **Dedicated Project Folder Created**: `d:\PROJECTS\z-automation-studio\earth-24h`
- **Remotion Studio Integration Path**: `d:\PROJECTS\z-automation-studio\remotion\videos\earth-24h`

## 2. Installed Toolchains & Runtimes
| Component | Version / Path | Status | Role in Reconstruction |
|---|---|---|---|
| **Python** | `3.12.10` (`numpy`, `opencv-python-headless`, `Pillow`) | Verified | Frame-accurate deterministic 2D canvas/vector renderer & automated computer-vision QA |
| **FFmpeg / FFprobe** | `9.0.2-essentials_build` | Verified | Exact packet/frame probing, rawvideo H.264 (`avc1`) encoding, and original AAC audio stream muxing |
| **`rea-video` CLI** | `0.1.0` (`bandit-v2-multi.onnx`, `rapidocr`) | Verified | Automated shot detection, stem separation (`original.wav`, `vocals.wav`, `music.wav`), OCR subtitle timeline, VLM review fusion |
| **Remotion / React** | `remotion@4.0.541`, `react@19.3.0`, `typescript@5.9.3` | Verified | Interactive live preview (`npm run studio`) and reusable SVG/React composition (`Earth24HoursShort`) |
| **System Fonts** | `C:\Windows\Fonts\timesbd.ttf`, `times.ttf`, `segoeuib.ttf` | Verified | Lining serif display timestamps (`00.00`..`24.00`), clock chapter numerals (`1`..`24`), and bold sans-serif deckle-edge paper captions |

## 3. Capability Verification
- **Frame-Accurate Animation**: Deterministic integer frame index `f in [0..1193]` at exact `30.000 fps` (`dt = 1/30 s`).
- **Deterministic Rendering**: All PRNGs (star positions `_RNG(42)`, magma branching `_RNG(77)`, paper grain `_RNG(1337)`) use fixed seeds; zero time-of-day or hardware-rate dependencies.
- **Automated Visual Comparison**: Dedicated computer-vision evaluator (`scripts/qa_compare.py`) computing per-frame and per-scene **SSIM**, **PSNR**, **MAE**, and **RMSE**, plus 4-panel diagnostic contact sheets and full-length quad comparison video (`out/comparison_quad.mp4`).
