# Visual Storytelling, Shot Architecture & Quality Gate (`≥ 85/100`)

## 1. Domain-Adaptive Scientific Illustration System
Never use one generic visual layout for every scene. Select the illustration mode that best explains the underlying mechanism:

| Information Type | Required Visual Approach | Kit / Component in `remotion/lib/illustrated-docu/` |
|---|---|---|
| **A. Human & Cultural (Anthropology / History)** | Expressive colored humans in period-accurate attire, reconstructed architecture/settlements, artifacts held in hand, `d3-geo` migration/cultural maps | `IllustratedCharacterRig` + `AnthropologyIllustrationKit` (`CulturalMap2D`, `ArtifactMedallion`, `SettlementDiorama`) |
| **B. Biological & Anatomical (Biology / Neuroscience)** | Multi-layer anatomical cross-sections (skin → skull → brain lobes → neurons → synapses, or tissue → cell → organelles → DNA), moving molecules/signals | `BioIllustrationKit` (`BrainCrossSection2D`, `EukaryoticCellCutaway2D`, `DnaDoubleHelix2D`, `NeuronSynapseFlow2D`) |
| **C. Evolutionary (Evolution / Paleontology)** | Side-by-side morphological & cranial comparisons, gradual anatomical morphing, branching phylogenetic tree (`cladogram`), environmental selection pressure | `EvolutionIllustrationKit` (`PhylogeneticTree2D`, `CranialMorphCompare2D`, `StrataFossilCutaway2D`) |
| **D. Environmental & Ecological (Natural History)** | Multi-plane ecosystem dioramas, soil/geological strata, climate/weather transformation, organism-environment energy cycles | `EnvironmentIllustrationKit` + `scripts/painterly_engine/painterly_fx.py` |

---

## 2. Shot-Level Storytelling & Anti-Repetition Rules
**One scene is NOT one static image.** Break every 12–18 second scene into **2–4 purposeful shots**:
1. **Shot 1 — Concrete Hook / Human Phenomenon**: Show the observable behavior, environment, or paradox (e.g., macro close-up of hands performing an action, or an organism in its habitat).
2. **Shot 2 — Mechanism / Cutaway / Scale Transition**: Zoom into the cross-section (brain, cell, soil stratum, evolutionary tree) or split the screen to show *why* it happens.
3. **Shot 3 — Dynamic Change / Comparison / Pull-Out**: Show the process completing (before-vs-after comparison, chaos morphing into order, or camera pulling out to community/generational scale).

### Mandatory Technique Variety (Never repeat the same transition/camera move twice in a row!)
Rotate purposefully among:
- **`CrossSectionPeel`**: Exterior silhouette smoothly peels open into an anatomical or geological cutaway.
- **`MicroToMacroZoom`**: Continuous exponential scale zoom (e.g., DNA → cell → brain → human → community → continent).
- **`BeforeAfterSplit`**: Animated split-screen or dual-trace comparison (e.g., Control vs. Post-Ritual neural response, or Ancestor vs. Modern morphology).
- **`MorphTransition`**: One key object physically transforms into the next era's equivalent (e.g., braided bracelet → ancient offering vessel → neural ring).
- **`TrackingParallax`**: Lateral camera pan across a 5-layer depth diorama as characters or eras progress.

---

## 3. Visual Continuity & Natural Scientific Accuracy
1. **Character & Environment Continuity**:
   - Define every recurring character and environment once in `<slug>/art-bible.json` (or `story.ts` constants) with a fixed `id`, `skinTone`, `hairStyle`, `outfitVariant`, and `palette`.
   - When a character reappears in a later scene, pass the exact same preset props to `IllustratedCharacterRig` — never invent a random new face or outfit mid-video.
2. **Responsible Scientific Representation (Without Rigid Bureaucracy)**:
   - Distinguish visually and verbally between **established facts** (direct anatomical/archaeological depiction), **experimental findings** (display a clean `InfoCallout` citation badge such as `Studi: Hobson et al., 2017` and depict the measured comparative trend faithfully without universal overclaims), and **symbolic visual metaphors** (use stylized geometric halos or conceptual icons so viewers never mistake metaphor for literal anatomy).

---

## 4. Weighted Visual Quality Gate (Target Score: `≥ 85/100`)
Before rendering the full video, render an **18-frame Pre-Flight Contact Sheet** covering every shot across all scenes, inspect it with `read_file`, and score honestly:

| Parameter | Weight | Pass Criteria |
|---|---:|---|
| **1. Illustration Quality** | **20%** | Tactile gouache texture (`earth-24h` feel), rich 2.5D volume shading, expressive character faces, accurate anatomy/proportions, zero flat clip-art look |
| **2. Scientific Accuracy** | **20%** | Biological/evolutionary/historical structures are accurate; experimental claims cite sources cleanly without exaggeration |
| **3. Visual Storytelling** | **20%** | Abstract concepts are turned into clear visual mechanisms; every shot advances understanding; zero boring visual repetition |
| **4. Animation Quality** | **15%** | Organic `easeInOutCubic` / `spring` motion, living character idle (blinks, breathing, head-lag), motivated camera choreography |
| **5. Visual Continuity** | **10%** | Recurring characters, props, and environments keep consistent proportions, colors, and lighting direction |
| **6. Composition** | **10%** | Clear single focal point within 0.5s (*squint test*), 5-layer foreground/midground/background depth, clean 9:16 or 16:9 safe zones |
| **7. Audio Synchronization** | **5%** | Word-accurate cues, verified Indonesian pronunciation (listened via `read_file`), tactile SFX on visual beats, `-14.5 LUFS` Stereo & Mono |

If any shot scores below standard (e.g., text collision, blank Frame 0, floating prop, flat untextured background, or stiff expression), **fix the actual component code and re-verify the still** before running the chunked MP4 render.
