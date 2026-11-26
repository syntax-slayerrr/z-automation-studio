# Filmic Visual Language — "Human Odyssey" (`anthropology-explanation`)

Synthesizes the **Filmic 2D Visual Language** architecture with the **"Human Odyssey" Animation Texture Pack** aesthetic (*Explore · Evolve · Belong*).

## 1. Coherent Identity System (Style Bible Tokens)
- **Zero Pure `#000` or `#fff`**:
  - Deepest shadow anchor: `#14121b` (cool obsidian-slate) or `#1e1614` (warm earth umber).
  - Brightest highlight anchor: `#fff5dc` (sunlit warm parchment cream) or `#e4f6ff` (glacial/water specular).
- **Color Scripts Across Sequences** (defined in `remotion/lib/anthropology-explanation/tokens.ts`):
  1. **`sunlit_odyssey` (Hero Savanna / Valley Exploration)**: Sky azure `#3e7cb8` → warm horizon cream `#f4d8a4`, distant misty mountains `#6f88a8`, lush valley olive `#5c7c48`, sunlit sandstone cliff `#c87e4c` / shadow `#563228`.
  2. **`golden_sunset` (Migration / Turning Point)**: Dusk coral `#d86442` → golden amber `#f6b252` → deep plum zenith `#2a2244`.
  3. **`campfire_night` (Ritual / Origin of Fire / Shelter)**: Starry indigo `#141a38` → `#243058`, warm firelight `#f48a34` → `#ffe498`, cool moon rim `#9ab8dc`.
  4. **`storm_tundra` (Climate Shift / Ice Age / Adversity)**: Glacial slate `#2c3e54` → `#68829e`, misty snow `#d8e4ec`, deep basalt `#262c3c`.
  5. **`bio_anatomy` (Biology / Genetics / Neuroscience)**: Deep marine slate `#102432` → `#1e4656`, bioluminescent cyan `#54c8e8`, warm tissue coral `#d85a4a`, bone ivory `#eee0c4`, golden DNA/synapse `#f8c662`.
  6. **`cartographic_atlas` (Geography / Migration Routes)**: Aged map parchment `#e6d6b4` / ocean topographic blue `#2b5272` → `#1c3850`, sunlit contour rings `#6696b8`, crimson pin `#d44634`, brass compass `#d49c48`.

## 2. Procedural Texture & Material System (`scripts/anthropology_engine/texture_forge.py`)
Every material is generated deterministically from a fixed integer `seed` (never high-frequency per-frame jitter):
- **Earth & Terrain**: Multi-octave FBM soil mottling + Voronoi desiccation cracks (desert), horizontal stratified bands (canyon), and tufted directional strokes (savanna grass).
- **Faceted Rock & Geology**: Angular polygonal rock blocks divided into **3 distinct light-response facets** (sunlit top plane, warm/cool mid bevel, deep shadow face) + fracture cracks + optional green moss caps.
- **Organic Nature (`NatureAndTerrainKit.tsx`)**:
  - Trees (`tropical`, `savanna_acacia`, `conifer`, `dead_gnarled`) feature tapered curved trunks with flared roots and **3-tone clustered foliage canopies** (dark underside, lush mid-body, sunlit top clusters).
  - Ferns, grass tufts, and wildflowers frame foreground edges (`parallax 1.38x`) to create genuine 2.5D filmic depth.
- **Water, Fire & Atmospheric FX**:
  - Water: Curling painted wave with layered turquoise-to-navy gradients and white-cream foam arcs; waterfalls with vertical translucent ribbons + mist pool; expanding elliptical surface ripples.
  - Fire & Smoke: Rounded bowl base + asymmetric S-curve terracotta/amber/cream tongues (or vivid sapphire/cyan energy flame) + billowing multi-lobe smoke & ochre dust puffs with directional sunlit top edges.
- **Biological Materials**: Translucent cell membranes with specular highlight arcs, trabecular bone texture, striated muscle bundles, detailed skull & ribcage vectors, and 3D-projected rotating DNA base-pair helix.

## 3. Lighting & Shadow Discipline
1. **One Motivated Key Light per Shot** (`upper_left`, `upper_right`, `sunset_horizon`, `low_fire`, `top_down`).
2. **Shadow Agreement**:
   - Grounded characters and boulders ALWAYS cast a **contact shadow** right beneath feet/base PLUS a directional **cast shadow** stretching strictly away from the key light.
   - Foreground cliffs/foliage never float; distant mountain ranges drop contrast and shift toward sky horizon color (**atmospheric perspective**).
3. **Controlled Emission**: Glow (`mix-blend-mode: screen`) is reserved strictly for true light emitters (sun orb, fire core, comet, bioluminescent cell, energy arc) — never slapped onto every shape or label.

## 4. Composition & Anti-Centering Rules
- Place hero subjects on rule-of-thirds intersections (e.g., hunter standing at `x = 34%` on a rocky cliff looking right across `66%` open valley vista!).
- Use negative space purposefully to hold calm typography, parchment scroll banners, or compass/timeline overlays without crowding the action.
- Reserve clean orthographic/top-down framing for maps and scientific diagrams (never force distracting parallax on a chart or precision cutaway).

## 5. Default TikTok 9:16 Vertical Safe Zones (`1080×1920` Full HD)
- **Top Safe Margin (`y = 0..135px`)**: Keep clear of TikTok top navigation/status bars; place restrained `SceneWhisperTitle` or opening `ChapterTitleOverlay` cleanly below `y ≥ 135px`.
- **Right Action Column (`x = 972..1080px`, `y = 820..1620px`)**: Keep essential text, pins, chart labels, and key character faces clear of TikTok's like/comment/share buttons.
- **Bottom Caption Zone (`y = 1660..1920px`)**: Place `EditorialSubtitle` cleanly at `bottom: 200–220px` so TikTok's username/caption overlay never covers narration subtitles.
- **Anti-Slide / Anti-Collage Rule (v2.0)**:
  - NEVER repeat a top wooden/parchment header plaque or technical `"SHOT 0X"` pill on every shot.
  - NEVER dump 4–5 disconnected infographic cards onto one static frame; use progressive **macro → micro → branching network** storytelling (`AnatomicalEvolutionStory2D`) and **animated spatial camera tracking** (`TopographicMigrationMap2D` with moving trackers).
  - ALWAYS drive light, shadow sway, and film grain through centralized `LightingProvider` (`directional_sun`, `cartographic_restrained`, `studio_cutaway`, `campfire_flicker`) + motivated scene transitions (`AtmosphericCrossfade`, `ScaleDivePortal`, `EmberLightMatch`).
