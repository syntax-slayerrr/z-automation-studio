---
name: anthropology-explanation
description: >-
  Produce a 100% pure-code Filmic 2D Animated Documentary ("Anthropology Explanation" —
  Human Odyssey Filmic 2D Style, default 9:16 TikTok/Reels/Shorts 1080x1920 Full HD or optional
  16:9 1920x1080, 30 fps, Remotion + Procedural Python Material/Biome Forge + Multiplane SVG/Canvas
  + d3-geo Cartography).
  Transforms scripts about Anthropology, Human History, Evolution, Prehistory, Archaeology,
  and Human Biology into a genuine directed short film (never a slideshow or flat icon deck).
  Features deterministic procedural textures (faceted rocks, strata, topographic contours,
  wood/stone/leather/tribal patterns, sunlit/sunset/night/storm/aurora skies, cellular &
  biological materials), multiplane 2.5D parallax camera choreography, adaptive visual
  grammar (reconstructions, d3-geo migration maps, anatomical/evolutionary cutaways,
  causal comparisons), grounded animated human/hominin rigs, organic fire/water/smoke/god-ray
  FX, antique compass/scroll/timeline editorial UI, ElevenLabs eleven_v4 Indonesian VO,
  and -14.5 LUFS broadcast audio. Use whenever the user asks for "style anthropology explanation",
  "Human Odyssey style", "filmic 2D documentary", "animasi antropologi / sejarah manusia /
  evolusi / biologi pure code bergaya film 2D", or invokes this workflow directly.
---

# Anthropology Explanation — Filmic 2D Pure-Code Documentary Engine
*(Style Identity: **"Human Odyssey"** — Explore · Evolve · Belong)*

> **Core Filmic Rule:**  
> *Narrative meaning determines visual representation; visual representation determines shot design; shot design determines staging, camera, lighting, material, and motion.*  
> **100% Pure Code** — Every sky, faceted cliff, tree canopy, topographic map, human rig, skull/DNA cutaway, flame, waterfall, and dust burst is generated deterministically in code (`Python PIL/NumPy/SciPy` procedural texture forge + `Remotion React/SVG/Canvas/d3-geo`). Zero AI-generated static cutouts, zero slideshow templates, zero `#000`/`#fff`.

---

## Quickstart (1-Prompt atau Naskah Lengkap)
Cukup beri topik atau naskah (mis. *"Buatkan video style **anthropology explanation** tentang bagaimana Homo sapiens bermigrasi keluar dari Afrika"*):
1. **Decompose Semantics** → pecah narasi menjadi *Narrative Units* (entitas, aksi/kata kerja, lokasi, waktu, sebab-akibat, skala, tingkat kepastian).
2. **Adaptive Visual Plan** → pilih tata bahasa visual yang tepat untuk setiap unit (*biome reconstruction*, *d3-geo topographic migration map*, *anatomical/cellular cutaway*, *population evolution*, *causal comparison*, atau *artifact insert*).
3. **Audio-First Lock** → ElevenLabs `eleven_v4` (`id`, pelindung pelafalan otomatis + spot-listen MP3 via `read_file`) + SFX *tactile* `eleven_text_to_sound_v3` + skor dokumenter `-14.5 LUFS`.
4. **Bake Procedural "Human Odyssey" Textures** → jalankan `scripts/anthropology_engine/texture_forge.py` untuk menghasilkan tekstur permukaan & layer multiplane deterministik (`public/<slug>/textures/*.png`).
5. **Assemble Filmic Multiplane Scenes** → susun scene berbasis *shot* memakai `remotion/lib/anthropology-explanation/` (`MultiplaneCamera`, `NatureAndTerrainKit`, `OdysseyHumanRig`, `ScienceAndCartographyKit`, `OdysseyUIKit`).
6. **5-Dimension Visual QA & Resumable Chunk Render** → audit contact sheet (cek *Narrative Fidelity, Cinematic Craft, Visual Craft, Motion Craft, Factual Integrity*) → render chunked H.264 BT.709 + verifikasi MP4 final!

---

## Locked Visual & Filmic Pillars

### 1. Adaptive Visual Grammar (Never One Fixed Template!)
| Semantic Intent | Visual Representation | Shared Pure-Code Module |
|---|---|---|
| `establish_location` / `reconstruct_human_activity` | Multiplane sunlit/sunset/night biome (mountain, savanna, forest, desert, tundra, ocean) + grounded character blocking + directional key-light & cast shadows | `MultiplaneCamera` + `NatureAndTerrainKit` + `OdysseyHumanRig` |
| `show_geographic_movement` | Top-down `d3-geo` topographic contour atlas, brass compass rose, crimson map markers, solid confirmed sites vs. dashed inferred migration corridors | `ScienceAndCartographyKit` (`TopographicMigrationMap2D`) |
| `show_internal_structure` / `demonstrate_mechanism` | Anatomical & biological cutaway (human skull, ribcage/bone, striated muscle, bioluminescent cell, rotating 3D-projected DNA double helix, flow arrows) | `ScienceAndCartographyKit` (`PaintedHumanSkull2D`, `DnaDoubleHelix2D`, `BioluminescentCell2D`, `AnatomicalRibcage2D`) |
| `show_population_change` / `show_timeline_or_duration` | Population variation across generations (NEVER a linear "primitive-to-advanced" ladder!), stratified rock/fossil cross-sections, interactive timeline track, monumental scale silhouettes | `OdysseyUIKit` (`OdysseyTimelineTrack`) + `OdysseyHumanRig` (`OdysseyScaleSilhouette`) |
| `compare_states` / `visualize_cause_and_effect` | Split-screen before/after, linked causal action beats, integrated data bar charts (never pasted PowerPoint boxes) | `OdysseyUIKit` (`OdysseyBarChart`, `ParchmentScrollBanner`) |
| `reveal_object_or_artifact` | Close-up insert with ornate frame or textured leather/wood/stone/ceramic material response + restrained lighting | `OdysseyUIKit` (`OrnateCornerFrame`) + `texture_forge.py` materials |

### 2. "Human Odyssey" Procedural Material & Atmosphere System (`scripts/anthropology_engine/texture_forge.py`)
All surfaces use deterministic seeded procedural textures (no flat plastic fills, no flickering high-frequency noise):
- **Biomes & Terrain**: `desert_cracks`, `savanna_grass`, `rocky_soil`, `canyon_strata`, `terracotta_clay`
- **Faceted Geology (3-plane sunlit/mid/shadow shading)**: `granite`, `sandstone`, `basalt`, `limestone`, `fossil_rock`
- **6 Sky & Atmosphere Moods**: `sky_day`, `sky_sunset`, `sky_night`, `sky_storm`, `sky_aurora`, `sky_savanna_golden`
- **Cultural & Natural Materials**: `wood_grain`, `stone_masonry`, `stitched_leather`, `ancient_tribal_pattern`, `topographic_contours`, `swirling_water`
- **Biological Materials**: `cellular_matrix`, `porous_bone`, `striated_muscle`, `vascular_tissue`
- **Hero Multiplane Landscape Plates**: Pre-baked `far` misty mountain ridges, `mid` winding valley/river plains, and `near` faceted rocky cliffs.

### 3. Filmic Cinematography, Motion & Scientific Integrity (Hard Rules)
- **Show Verbs & Relations, Not Just Nouns**: If narration says *"manusia bermigrasi menyusuri sungai"*, show a tracking route or travelling figures moving through geographic terrain — never a static character standing still.
- **Motivated Camera Only**: Every pan, dolly push/pull, truck, crane rise, or locked-off diagram shot must serve a narrative reason (establish, follow, reveal, compare, inspect). Never put identical zoom-ins on consecutive shots.
- **Shadow & Light Agreement**: Key-light direction (`upper_left`, `sunset_horizon`, `campfire_low`, `top_down`) governs EVERY rim highlight, faceted rock face, tree crown highlight, and ground cast shadow in the shot.
- **Physical Plausibility & Mass-Aware Easing**: A rockfall, route draw, water wave, human walk, and parchment scroll unroll each use distinct mass-appropriate easing curves (zero generic uniform ease, zero cartoon squash-and-stretch on anatomical/scientific models).
- **Honest Scientific & Historical Representation**:
  - Never depict evolution as a straight ladder toward modern humans; show population diversity and environmental pressure.
  - Distinguish confirmed sites/facts (solid markers/lines) from inferred corridors or reconstructions (dashed lines + subtle contextual labels).
  - Avoid anachronistic tools, clothing, or architecture; keep scientific integrity natural and readable without bloated bureaucratic spreadsheets.

---

## 6-Stage End-to-End Workflow

### Stage 1 — Semantic Narrative Breakdown & Shot Plan
1. Read [`references/filmic-visual-language.md`](./references/filmic-visual-language.md) and [`references/narrative-to-shot-engine.md`](./references/narrative-to-shot-engine.md).
2. Decompose the script into `NarrativeUnit`s → select the adaptive `visual_intent` → build `<slug>/art-bible.json` (from [`templates/art-bible.template.json`](./templates/art-bible.template.json)) and `<slug>/shot-plan.json` (from [`templates/shot-plan.template.json`](./templates/shot-plan.template.json)).
3. Verify anti-template rules before coding: no repeated centered framing, no consecutive identical camera moves, every narration beat covered by visual action.

### Stage 2 — Audio-First Narration, Sound Design & Timing Lock
1. Generate verbatim Indonesian narration via ElevenLabs `eleven_v4` (`Brian` or warm documentary baritone, `TEMPO = 1.12..1.18`, Indonesian acronym shield `applyTextNormalization: "off"` on risky words) → export `alignment.json` and `remotion/videos/<slug>/story.ts` with exact `[[cue]]` frame anchors.
2. Spot-listen risky scientific/anthropological words directly via `read_file` on cached MP3s.
3. Layer environment ambience, tactile foley (footsteps, wind, water, flint, fire), designed transition cues, and curated documentary score (mastered to **`-14.5 LUFS`**, True Peak `≤ -1.9 dBFS`, verified Stereo & Mono).

### Stage 3 — Procedural Texture & Multiplane Layer Generation (Pure Code Python)
1. Run `python scripts/anthropology_engine/texture_forge.py --out public/<slug>/textures --seed <N>` (or project-specific script importing `texture_forge`) to bake deterministic *Human Odyssey* skies, faceted cliffs, terrain tiles, topographic maps, and material patterns.
2. Verify generated plates stay crisp and clean (zero noisy flicker).

### Stage 4 — Filmic Scene Graph & Animation Implementation (Remotion)
1. Compose shots in `remotion/videos/<slug>/` importing from `remotion/lib/anthropology-explanation/`:
   - `LightingRig` (`LightingProvider`, `useLightingRig` — centralized directional sun, restrained cartography, studio cutaway, live flickering campfire bounce + shadow sway + static film grain)
   - `MultiplaneCamera` & `DepthPlane` (parametric `cameraPosition`, `cameraZoom`, rack-focus blur curves, subtle organic handheld breathing)
   - `ParticleSystem` (`GoldenDustMotes2D`, `CampfireEmbersAndSmoke2D`, `BioluminescentMotes2D`, `AnimatedRiverShimmer2D`)
   - `EditorialTypography` (`ChapterTitleOverlay`, `SceneWhisperTitle`, `DiegeticCallout`, `EditorialSubtitle` — zero repeated header plaques, zero technical pills!)
   - `Transitions` (`AtmosphericCrossfade`, `ScaleDivePortal`, `EmberLightMatch`)
   - `NatureAndTerrainKit` (organic scalloped foliage clusters, eroded boulders, sun/god-rays, charred-log flickering fire)
   - `OdysseyHumanRig` v2.5 (anatomical profiles, lagged hair/cloak follow-through, expressive storytelling hand arcs, `HunterOverShoulderCloseUp2D`, `FlintSparkHandsCloseUp2D`, diegetic horizon silhouettes)
   - `ScienceAndCartographyKit` v2.5 (multi-stage curved `TopographicMigrationMap2D` with directional arrowheads, flowing particles, waypoints & mobile-readable leader-line labels; `ComparativeSkullCutaway2D` lateral skull overlay; `FunctionalDnaDiversity2D`; full rooted `OrganicPhylogeneticTree2D`)
2. Register composition in `remotion/Root.tsx` (**default 9:16 TikTok/Reels/Shorts `1080×1920` Full HD** respecting TikTok UI safe-areas: top `150px`, right `108px`, bottom `220–320px`; optional `1920×1080` 16:9 YouTube landscape supported).
3. Run `npx tsc --noEmit` → require **0 errors**.

### Stage 5 — 5-Dimension Filmic Quality Assurance Gate
Follow [`references/motion-physics-and-integrity.md`](./references/motion-physics-and-integrity.md):
1. Pre-bundle once (`npx remotion bundle`) and render an 8–18 frame contact sheet covering every shot type & key transition.
2. Visually inspect EVERY frame via `read_file` across the 5 dimensions (1–5 scale, blocking defects = mandatory fix):
   - **Narrative Fidelity** (does picture show the verb/mechanism?)
   - **Cinematic Craft** (composition, depth planes, motivated camera, rhythm)
   - **Visual Craft** (procedural texture quality, consistent key-light & shadows, zero `#000`/`#fff`)
   - **Motion Craft** (weight, arcs, zero clipping/floating/foot-sliding)
   - **Factual Integrity** (accurate geography/anatomy, uncertainty visually distinguished)

### Stage 6 — Resumable Chunk Broadcast Render & Final MP4 Verification
1. Render in ~350–400 frame chunks with 2 auto-retry attempts, concat into single H.264 `yuv420p bt709` (`+faststart`) + bit-exact `-c:a copy` mux.
2. Verify directly on the final MP4: `ffprobe`, Stereo + Mono `ebur128`, exact decoded contact sheet via `read_file`, and final audio spot-listen. Clean `.chunks/.bundle/.tmp`.

---

## Golden Reference & Shared Engine Paths
- **Procedural Texture Forge (Python)**: `scripts/anthropology_engine/texture_forge.py`
- **1-Command Project Scaffolder**: `scripts/anthropology_engine/init_project.mjs` (`npm run init:anthro -- --slug <slug> --title "<Title>"`)
- **Automated Contact-Sheet Visual QA**: `scripts/anthropology_engine/render_proof_sheet.ps1` (`npm run still:anthro-proof`)
- **Shared Filmic 2D Remotion Engine**: `remotion/lib/anthropology-explanation/`
- **Live 4-Shot Visual Benchmark Proof**: `remotion/videos/anthropology-showcase/AnthropologyShowcase.tsx` (`anthropology-showcase/out/style_proof_sheet.jpg`)
