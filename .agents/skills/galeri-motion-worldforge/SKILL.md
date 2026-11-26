---
name: galeri-motion-worldforge
description: Produce a 100% pure-code 3D Architectural Living-City & Character-Driven Documentary Short (1080x1920 Full HD or 720x1280 9:16 vertical, 30 or 60 fps, Remotion + Three.js / React Three Fiber) reverse-engineered frame-by-frame from "galeri-motion-worldforge-roma.mp4" (104.6s Roman living-city documentary). Features ONE coherent, explorable 3D architectural world with real living streets, rooftops, waterways, landmarks, and matte architectural PBR procedural textures (corrugated roofs, terracotta tiles, stone/concrete paving, plastered walls, hanging laundry lines, glowing warm night windows — ZERO black ink outlines, ZERO glossy plastic toy bubbles), populated by expressive 3D hero characters AND 60-150+ animated walking low-poly residents (`InstancedMesh`/articulated crowds). Every beat of the narration physically flies, dives, or walks the camera into the exact real-world location being described (eyelid-opening POV -> drone aerial flyover -> narrow alley street dive -> eye-level character interaction -> spatial inequality contrast cut -> storm/time-of-day transformation -> golden-hour horizon finale) with razor-clean architectural floating sky titles and minimal readable subtitles. Use whenever the user asks for "style worldforge", "style galeri motion roma", "kota 3D hidup", "lingkungan 3D nyata sesuai narasi dengan karakter", or a cinematic architectural 3D documentary short.
---

# Galeri Motion WorldForge — 3D Living-City & Character Documentary Engine (Skill #13)

Reverse-engineered 1:1 from **`galeri-motion-worldforge-roma.mp4`** (`720×1280`, `60 fps`, `104.60s`, `-14.0 LUFS`, 18 architectural world cuts).

## Core Philosophy (NEVER Violate!)
1. **The Environment IS the Storyboard — ZERO Bubble-Slideshows!**
   - NEVER trap characters inside a single room looking at floating icons/bubbles.
   - Every beat of the script MUST take the camera physically into the **real, living 3D location** described by the narration (alleyway, riverbank, high-rise boardroom, water queue, courthouse plaza, flooded living room, community clinic, revitalized street).
2. **Living Characters Inside Living Worlds:**
   - Combine **expressive articulated hero characters** (protagonist, family/children, officials, historical figures) with **60–150+ animated walking residents** moving organically down streets, queuing, and gathering in public squares.
3. **Matte Architectural PBR Surface Craft (100% Distinct from Cel-Toon & Soft-Vinyl!):**
   - **ZERO black ink outlines** and **ZERO glossy toy clearcoat plastic!**
   - Use crisp **procedural Canvas2D architectural textures** (`roughness: 0.78–0.92`): cobblestone/cracked asphalt roads, weathered corrugated tin & terracotta roofs, plaster/brick walls with recessed windows that **light up warm amber (`emissive`) at night/golden hour**, colorful shop awnings, hanging laundry lines between narrow buildings, and atmospheric `THREE.FogExp2` + `ACESFilmicToneMapping`.
4. **Signature WorldForge Camera Grammar:**
   - **Eyelid-Opening POV** (`00:00–00:03`) → **High Drone Aerial Sweep** over hundreds of rooftops → **Alley Street Dive & Bird's-Eye Crane** → **Eye-Level Character Action** → **Spatial Contrast Cut** (wealthy modern skyline vs cramped slum across river, directly mirroring `DOMUS` vs `INSULA`) → **Full-World Weather / Time-of-Day Arc** (Morning → Stormy Night Flood → Dawn Mist → Golden-Hour Sunrise Horizon!).
5. **Razor-Clean Architectural Editorial Typography:**
   - Open sky location titles: thin white hairline (`42px × 1.5px`) + tracked uppercase clean sans (`letter-spacing: 0.24em`) + subtle italic serif sub-label.
   - Clean minimalist bottom subtitles with crisp drop shadow and warm gold keyword highlights — ZERO heavy comic boxes or stickers.

## Reusable Studio Engine (`remotion/lib/worldforge-3d/`)
- `worldforgeMaterials.ts`: Procedural architectural textures (cracked asphalt, cobblestone, corrugated rusted tin roof, terracotta roof tiles, Indonesian plastered brick walls with lit/dark window grids, faded billboards, murky/clean water, tropical foliage).
- `WorldForgeCharacters.ts`: Lightweight matte-stylized 3D hero character rigs (articulated limbs, faces, clothing, optional props like jerrycans/umbrellas/briefcases/peci/glasses) + deterministic animated walking crowd generator.

## Golden Windows + ANGLE Render Rules
- ALWAYS use isolated single-composition entry (`remotion/entry-<slug>.ts`) + `--gl=angle --concurrency=1` + `$env:TEMP`/`$env:TMP` locked on Drive `D:`.
- NEVER use `<EffectComposer>` (use `THREE.FogExp2`, directional `2048×2048` PCF shadows, emissive glowing windows, and additive sun/lamp glow sprites).
- ALWAYS inspect a 16-shot Full HD Contact Sheet (`qa_16_shots.jpg`) + hero stills via `read_file` BEFORE full chunked MP4 render.
