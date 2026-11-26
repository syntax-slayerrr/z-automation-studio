# Motion Physics, Scientific Integrity & 5-Dimension Filmic QA

## 1. Motion Craft & Physical Plausibility
Every motion must carry weight, intention, and physical believability:
- **Layer Motion Roles**:
  - *Primary motion*: main explanatory action (walking, route drawing, valve/cell flow, strata reveal).
  - *Secondary motion*: 4–6 frame lag on hair, tunic hems, hanging tassels, foliage sway.
  - *Environmental motion*: drifting clouds, undulating river sparkles, rising fire sparks, soaring distant birds.
  - *Camera motion*: independent smooth curve (`easeInOutCubic` / `easeOutQuint`) that never accidentally cancels subject movement.
- **Mass-Aware Interpolation** (`remotion/lib/anthropology-explanation/tokens.ts`):
  - Heavy rocks / cliffs / geological strata: slow acceleration, firm settle (`easeOutQuint`, zero bouncy overshoot).
  - Human gestures & walks: curved arcs with anticipation and follow-through (`easeInOutCubic`).
  - Cartographic route draws & timelines: smooth constant-readable velocity (`easeInOut`).
  - UI pins / map markers / scroll reveals: crisp damped settle (`spring` with high damping, never cartoonish wobble on serious documentary beats).
- **No Cartoon Squash-and-Stretch on Science**: Never rubber-stretch skulls, organs, fossils, or historical reconstructions.

## 2. Scientific & Historical Integrity (Natural, Non-Bureaucratic Discipline)
Apply these truthfulness rules directly in script, storyboard, and visuals:
1. **Evolution Is Branching, Not a Ladder**: Never show a linear "ape → caveman → modern man" march implying teleological progress. Show branching diversity, population variation, and environmental adaptation.
2. **Distinguish Certainty from Inference Visually**:
   - Confirmed archaeological/fossil sites → solid crimson pin + exact region label.
   - Inferred dispersal corridors / approximate ranges → dashed glowing route line + `"±"` approximate era range (avoid false precision!).
   - Experimental studies (e.g., *Hobson et al., 2017*) → concise citation pill; never claim a single experiment proves a universal cure or trait.
3. **Avoid Anachronisms & False Specificity**: Match attire, tools (stone flakes vs. bronze vs. ceramic), flora, and architecture to the period and geography. Where facial likeness of ancient individuals is unknown, use stylized/contextual reconstruction rather than claiming literal portraiture.
4. **Cultural Context**: Treat traditions, rituals, and ancient societies with dignity and anthropological accuracy — avoid simplistic *"one cause explains everything"* determinism.

## 3. Five-Dimension Filmic Quality Assurance Gate
Before running the full chunked MP4 render, inspect the **Contact Sheet** (`read_file`) across all 5 independent dimensions (Score `1–5` each; target **`≥ 4.0` average**, **zero blocking defects**):

| Dimension | Pass Bar (`4–5`) | Blocking Defects (Must Fix Immediately) |
|---|---|---|
| **1. Narrative Fidelity** | Picture clearly demonstrates the narration's verb, mechanism, or relation in one viewing | Visual contradicts narration, shows only static noun, or leaves narration unillustrated |
| **2. Cinematic Craft** | Deliberate framing (rule-of-thirds), readable FG/MG/BG depth, motivated camera, varied transitions | Repeated centered framing, identical push-in on every shot, abrupt unmotivated cuts |
| **3. Visual Craft** | Tactile procedural textures, harmonious color script, consistent light & shadow direction, zero `#000`/`#fff` | Flat unshaded clip-art, floating shadows, flickering noise, text colliding with art or safe zones |
| **4. Motion Craft** | Natural weight, arcs, smooth beats, zero foot-sliding/clipping/popping | Jittery texture boil, broken limb pivots, motion starting before its narrative cue |
| **5. Factual Integrity** | Accurate geography (`d3-geo`), sound anatomy/evolution, uncertainty cleanly qualified | Wrong map route, linear evolution ladder, false historical certainty, or mispronounced TTS term |

## 4. Anti-Template Audit Checklist
Before finalizing any production, explicitly verify:
- [ ] Not every scene uses the same camera move or transition.
- [ ] Not every focal subject is dead-centered.
- [ ] Frame 0 has immediate visual & typography clarity (zero blank/black opener).
- [ ] Every recurring character & landmark keeps identical palette, proportion, and lighting logic.
- [ ] Final MP4 passes `ffprobe` (`h264`, `yuv420p`, `bt709`), Stereo & Mono `-14.5 LUFS` (`TP <= -1.9 dBFS`), and direct decoded frame + audio spot-checks.
