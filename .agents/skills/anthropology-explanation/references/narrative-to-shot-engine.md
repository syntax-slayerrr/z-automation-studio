# Narrative-to-Visual Intelligence, Cinematography & Shot Planning

## 1. Semantic Decomposition (Before Drawing Anything!)
Decompose narration into atomic **`NarrativeUnit`s** — never map 1 sentence mechanically to 1 static picture:
- Extract: **Entities**, **Actions (Verbs)**, **Locations & Spatial Relations**, **Time/Chronology**, **Cause & Consequence**, **Comparisons**, **Scale** (`micro | human | regional | planetary | deep_time`), and **Uncertainty**.
- **Anti-Literalism Rule**: Illustrate the *verb, relationship, or mechanism* — not just the noun!
  - *Weak*: Narration says *"Homo sapiens bermigrasi dari Afrika ke Eurasia"* → showing a person standing in grass.
  - *Strong*: Top-down `d3-geo` topographic map highlighting East Africa, animating an evidence-qualified dashed migration corridor northward across the Levant with camera tracking the frontier, then match-cutting to figures traversing a sunlit canyon pass!

## 2. The 14 Visual Intents
Every shot in `<slug>/shot-plan.json` declares one primary `visual_intent`:
1. `establish_location` — Wide multiplane biome establishing place, climate, and scale.
2. `show_geographic_movement` — `d3-geo` topographic map + compass + animated route & camera track.
3. `reveal_object_or_artifact` — Close-up insert of tool, fossil, ceramic vessel, or scroll with material lighting.
4. `reconstruct_human_activity` — Contextual human blocking, interaction, and purposeful gesture.
5. `demonstrate_mechanism` — Sequential physical/biological process (tool flaking, fire ignition, muscle pull, blood flow).
6. `show_internal_structure` — Cross-section cutaway (skull/brain, cell/organelles, DNA, rock strata).
7. `compare_states` — Split-screen or side-by-side before/after comparison.
8. `visualize_cause_and_effect` — Linked visual chain showing force/trigger → consequence.
9. `show_population_change` — Multiple varied individuals across generations (never one creature morphing in a straight ladder!).
10. `show_timeline_or_duration` — Horizontal timeline bar or geological strata reveal.
11. `visualize_scale_transition` — Continuous zoom connecting micro ↔ human ↔ geographic scales.
12. `show_interaction_or_group_behavior` — Coordinated group blocking, spacing, and shared symbols.
13. `visualize_abstract_relationship` — Clean graphic/spatial metaphor grounded in the scene's art direction.
14. `present_evidence_or_uncertainty` — Explicit distinction between solid known sites/facts and dashed inferred corridors/hypotheses.

## 3. Cinematography, Shot Sizes & Motivated Camera Grammar
- **Shot Sizes**: `extreme_wide` (scale/isolation), `wide` (full environment + body), `medium_wide` (group blocking), `medium` (human interaction), `close_up` (hands/face/artifact/evidence), `extreme_close_up` (microscopic cell/DNA/material), `top_down` (maps & spatial formations), `insert` (scroll/chart/compass/date).
- **Camera Movements** (every move MUST state its narrative motivation; remove unmotivated motion!):
  - `locked_off` — Best for reading complex maps, anatomical cutaways, or comparative charts.
  - `dolly_push` — Draws attention into a revelation, artifact, or internal mechanism.
  - `dolly_pull` — Reveals wider geographic, social, or deep-time context.
  - `pan` / `truck` — Connects two regions, characters, or eras across continuous space.
  - `tracking_follow` — Follows a migrating group, flowing stream, or animated route frontier.
  - `crane_rise` / `crane_drop` — Elevates from individual human to community/aerial geography or drops underground into geological strata.
- **Transitions by Meaning** (never repeat the same fade on every cut!):
  - `hard_cut` (decisive contrast or shift in scale)
  - `match_cut` / `graphic_match` (connect circular artifact → compass → cell → planet, or matching directional motion)
  - `dissolve` (passage of time or generations)
  - `motivated_wipe` (foreground tree trunk, cloud bank, dust cloud, or river horizon crossing frame)
  - `sound_bridge` (ambience/foley from next scene enters 0.4s before visual cut)

## 4. Narration Synchronization & Information Density
- Stage complex visuals progressively in beats: `(1) Establish context → (2) Reveal subject → (3) Animate action/mechanism → (4) Show consequence → (5) Brief comprehension hold (12–24 frames)`.
- Never trigger a distracting visual pop on every word; align visual beats strictly to verbs and conceptual turns using `alignment.json` `[[cue]]` frame anchors.
