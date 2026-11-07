---
name: lemo-opuscar
description: Direct and produce short films, cinematic explainers, 3D tech keynotes, and promo animations made entirely in code using the 66 styles from Lemo-Opuscar (Three.js, WebGL, Canvas, HTML5, FFmpeg). Use when the user asks for code-directed animation, cinematic promos, high-end motion graphics, or video generation in specific artistic or tech styles.
---

# Lemo-Opuscar Skill

[Lemo-Opuscar](https://github.com/lemomo-ai/lemo-opuscar) is an open-source, code-directed mini-film studio and style library. Instead of using pixel-diffusion video models, it directs and renders films deterministically using code (HTML5 Canvas, WebGL, Three.js, SVG, and FFmpeg).

Library Location: `d:\PROJECTS\lemo-opuscar`  
Style Gallery: https://lemomo-ai.github.io/lemo-opuscar/

---

## 🎬 66 Reusable Visual Styles

All style definitions, shaders, and techniques live in `d:\PROJECTS\lemo-opuscar\styles/<slug>/STYLE.md`.

### Recommended Styles for Z-Automation & Tech:
- **`dark-keynote` (暗色科技发布 - Dark Tech Keynote)**: Apple/Vercel-style clean dark UI, dynamic typography, ambient lighting, precision product highlights.
- **`hologram-hud` (科幻全息界面 - Sci-Fi Hologram HUD)**: Futuristic glowing cyan/neon holographic interface, particle meshes, circular HUD gauges (ideal for Hermes AI agent!).
- **`circuit-board` (电路板 - Circuit Board)**: Motherboards, glowing pulse pathways, microchips, data transfer lines.
- **`glass-product` (产品拆解 - Glass / Exploded Product)**: Refractive glass textures, physical lighting, exploded views of software/hardware components.
- **`desktop-flythrough` (活体实机录屏 - Living Screencast)**: Smooth 3D camera pan over interactive software interfaces and code editors.
- **`dataviz` (数据叙事 - Data Storytelling)**: Animated node graphs, neural networks, real-time analytics.
- **`ascii-crt` (ASCII / CRT 终端)**: Cyberpunk retro green phosphor CRT terminals and matrix streams.

---

## 🛠️ Directing Workflow

Follow [`DIRECTOR.md`](file:///d:/PROJECTS/lemo-opuscar/DIRECTOR.md) and [`AGENTS.md`](file:///d:/PROJECTS/lemo-opuscar/AGENTS.md):

1. **Take the Brief**: Define the topic, message, duration (typically 30–60 seconds), format (16:9 1920x1080 or 9:16 vertical 1080x1920), and selected style.
2. **Draft Treatment (`TREATMENT.md`)**:
   - Logline and emotional arc (Setup → Turn → Climax → Echo).
   - Shot-by-shot storyboard (Framing, camera move, duration, lighting).
   - Audio & VO Cue Map (synchronized with VoiceStudio VO audio).
3. **Build the Visuals**:
   - Use Three.js / WebGL / Canvas inside an HTML scene.
   - Reference techniques from `d:\PROJECTS\lemo-opuscar\styles/<slug>/`.
4. **Deterministic Rendering**:
   - Render frames using the built-in Playwright runner or export directly into Remotion components:
   ```bash
   cd d:\PROJECTS\lemo-opuscar
   node core/render/still.mjs "<film_dir>" <timestamp_seconds>
   ```
5. **Mux Audio & Subtitles**:
   - Merge the visual frames with VoiceStudio voiceover (`assets/audio/voiceover.mp3`) and background music using FFmpeg.

---

## 🔗 Synergy with Remotion & VoiceStudio

In `d:\PROJECTS\z-automation-studio`:
- **Visual & Style Directing**: Use `lemo-opuscar` styles (e.g. `dark-keynote` or `hologram-hud`) for aesthetic and animation logic.
- **Compositing & Animation Layering**: Use `remotion` for timing springs, sequences, and GPU rendering.
- **Voiceover**: Generate synchronized audio with `voicestudio` via `scripts/generate-vo.ps1`.
