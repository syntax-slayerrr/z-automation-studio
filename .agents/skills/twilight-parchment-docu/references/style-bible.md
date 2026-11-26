# Style Bible — Illustrated Documentary Animation Engine (v2.0)
*(Tactile Gouache Texture from `earth-24h` × Scientific Illustration Clarity of Kurzgesagt & Kok Bisa?)*

## 1. Materiality & Texture DNA (Proven on `earth-24h` `f_60`, `f_270`, `f_480`, `f_780`)
What makes our visuals feel like a handcrafted animated documentary rather than flat corporate clip-art:
1. **Multi-Octave FBM Gouache Mottling (`apply_gouache_mottle` + SVG `GouacheFilter`)**:
   - Every sky, ocean, cortical cross-section, rock stratum, and shadow-box hill has subtle `8–11%` pigment luminance & warmth modulation across 3 spatial octaves (`64px`, `24px`, `9px`).
2. **Paper-Cut Shadow-Box Depth (`build_shadowbox_lobe_tier` + SVG `<feDropShadow>`)**:
   - Layered planes cast soft physical drop shadows (`blur 8–14px`, deep tinted umber/teal/indigo, never pure `#000`) onto the plane behind them, with a subtle `2–4px` bounced rim-light along light-facing crests.
3. **Volumetric Screen-Blended Light & Caustic Shafts (`blend_screen`)**:
   - Sunlight through forest canopies, stadium floodlights, underwater caustics (`f_480.png`), or synaptic glow pools use dual-pass (`wide soft blur + crisp core`) `screen` blending.
4. **Normal-Computed Directional Rim-Lighting (Zero Uniform Cartoon Wire Outlines)**:
   - Characters, organs, fossils, and trees receive warm/cool rim highlights strictly on their light-facing contours, plus soft 2.5D cel-shaded volume planes (`22% multiply` shadow side + `28% screen` highlight side).

---

## 2. Four Domain Color Systems (Zero `#000` or `#fff`)

### Deck A — Anthropology & Human History (`domain: "anthropology"`)
- **Atmosphere & Backdrops**: Warm Terracotta Dusk `#2b1732` → `#5e3042` → `#c46d42` (or Sunlit Archival Cream-Sand `#e8d8be` → `#c9ae84` for daytime cultural reconstructions)
- **Midground Architecture & Foliage**: Deep Teak `#331d2c`, Banyan Olive-Umber `#2f4038`, Sandstone `#8c6348`
- **Character Skin & Garment Tones**: Warm Cinnamon `#b87652`, Golden Tan `#d4946a`, Deep Espresso `#7c4b34`; Garments in Saffron `#e69c3a`, Terracotta Crimson `#c44532`, Lapis Indigo `#2e5484`, Woven Cream `#efe2c8`
- **Key Light & Accents**: Lantern Gold `#f8c264`, Incandescent Cream `#fff0cc`, Turquoise Cultural Accent `#4ca89c`

### Deck B — Biology, Anatomy & Neuroscience (`domain: "biology"`)
- **Atmosphere & Cellular Matrix**: Deep Bioluminescent Teal `#0d2e38` → `#1b5e68` → `#2d8a92` (matching `earth-24h/f_480.png`!) or Neural Cortex Indigo-Sapphire `#141836` → `#262e5c`
- **Organ & Tissue Cross-Sections**:
  - Brain Cortex Lobes: Frontal Coral `#e06c58`, Parietal Amber `#eb9c48`, Temporal Sage `#54a484`, Occipital Violet `#7e64b4`, Limbic/ACC Glow `#ffd468`
  - Cellular Organelles: Membrane Mint `#a6e8e0`, Nucleus Deep Teal `#1e5862`, Mitochondria Coral-Orange `#ec744c`, DNA Base-Pairs `#f4b84c` / `#58b8c8` / `#e46472` / `#78c474`
- **Key Light & Bio-Electric Pulses**: Synaptic Gold `#ffe48c`, Caustic Cyan `#c4faf2`

### Deck C — Evolution & Natural History (`domain: "evolution"`)
- **Atmosphere & Biomes**: Prehistoric Savanna Ochre `#38202c` → `#844836` → `#de9248`, Mesozoic Velvet Violet `#342258` → `#5c3b7c` → `#905ca8` (matching `earth-24h/f_780.png`!), or Primordial Emerald `#15362e` → `#2c6a58`
- **Geological Strata & Fossils**: Topsoil Umber `#483228`, Pleistocene Ochre `#96623c`, Miocene Terracotta `#7a402c`, Cretaceous Limestone `#626878`, Fossil Ivory `#f0e4cc`
- **Cladogram & Lineage Branches**: Ancestral Gold `#f4b454`, Divergent Branch Coral `#df624c`, Surviving Lineage Emerald `#52b888`

### Deck D — Environment & Deep-Time Ecology (`domain: "environment"`)
- **Atmosphere**: Hadean Molten Maroon `#3e1216` → `#944428` (matching `earth-24h/f_270.png`!), Ice-Age Slate `#1e2e42` → `#547896`, Tropical Canopy `#183832` → `#427c68`

---

## 3. Expressive Illustrated Character Design (`IllustratedCharacterRig.tsx`)
Unlike v1's faceless dark silhouettes, v2 characters are **richly illustrated, colored, and expressive**:
- **Consistent Proportions**: `1:6.2` head-to-body ratio for adults (`1:4.8` for children), rounded organic head with defined cheek/chin curve, distinct nose bridge, and expressive ear silhouette.
- **Living Facial Rig**:
  - **Eyes**: Dark espresso-plum iris + warm cream sclera (`#f8f0e2`) + pinpoint specular catchlight (`#fff6e4`) + **look-direction offset (`lookX, lookY`)** + **non-periodic natural blink cycle**.
  - **Eyebrows & Mouth (`mood`)**: `curious` (one brow slightly raised, small wonder mouth), `happy` (soft arched brows, warm smile), `amazed` (high brows, open oval mouth), `anxious` (furrowed angled brows, tense wave mouth), `focused` (low steady brows), `reverent` (gently closed eyes, serene expression), `speaking` (animated syllable jaw/lip cycle synced to beat).
- **3 Camera Views**: `side` (profile travel/interaction), `three-quarter` (`3/4` default documentary narrative view — shows both eyes and depth!), `front` (direct comparison/address).
- **2.5D Shading**: Every limb, torso, and garment renders a base gouache fill, a soft internal shadow crescent on the side away from the light, and a directional rim highlight on the light-facing edge.

---

## 4. Typography, Infographics & Safe Zones (`720×1280` / `1080×1920` / `1920×1080`)
- **Chapter / Era Header**: Glowing warm serif (`Georgia`, `#f6ecd4`) + wide-tracked subheader (`Segoe UI / Plus Jakarta Sans`, `letterSpacing: 5.5px`), instant visibility on Frame 0.
- **Scientific Callout Tags (`InfoCallout`)**: Animated leader-line (`strokeDashoffset`) pointing directly to an organ/fossil/artifact with a clean dark-tinted pill (`rgba(22, 16, 34, 0.86)`, warm gold border `#f8c264`, bold term + concise 1-line explanation or citation badge like `Hobson et al., 2017`).
- **Deckle-Edge Parchment Karaoke Card**: Hand-torn archival parchment (`#f7efde` → `#ebe0c8`, drop shadow `#100816`), active word in terracotta crimson `#ba382a`, instant Frame-0 ink presence (`cardInkAlpha = 1` on `startFrame === 0`).
