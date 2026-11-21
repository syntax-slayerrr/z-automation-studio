# Production Workflow and Hybrid Handoff

## 1. Design for the actual pipeline

A storyboard is not production-ready if it cannot be translated into assets and shots. Consider the available pipeline:
- hand-drawn / 2D animation;
- 3D animation;
- motion design / typography;
- AI-generated stills with compositing / 2.5D movement;
- AI video generation;
- live action;
- hybrid production.

If the pipeline is unknown, design a flexible board and mark which shots may require special handling.

## 2. Complexity tiers

Classify shots:

- **Tier A — Simple:** one character or object, static / subtle camera, limited motion, few assets.
- **Tier B — Moderate:** multiple subjects, controlled camera movement, several layers, moderate acting or effects.
- **Tier C — Complex:** crowd choreography, difficult interaction, complex hand / face acting, multi-axis camera, heavy effects, multiple moving layers, or strict historical reconstruction.

Tier C is not forbidden. It must have a clear reason and a simpler fallback when production resources are constrained.

## 3. Reuse without visual repetition

Reuse location sets, character models, props, lighting setups, and design systems when continuity supports it. Avoid reusing the same composition as a shortcut. A familiar location can be shown from a new angle or under changed circumstances to communicate progression.

## 4. Asset breakdown

Separate assets into:
- characters / crowd types;
- locations / environment plates;
- hero props and period objects;
- documents / maps / signage / graphic overlays;
- atmosphere / effects;
- sound effects / ambience / music;
- title / logo / end card.

Mark assets as **existing**, **new**, **generated**, **archival / sourced**, or **to be verified**.

## 5. Image-generation prompt engineering

A useful shot prompt is not a block of adjectives. It should specify:
1. subject and period / context (only supported details);
2. action and emotional beat;
3. shot scale and camera angle;
4. composition and blocking;
5. environment and depth layers;
6. lighting and color treatment;
7. art direction and material / texture;
8. aspect ratio and framing requirements;
9. continuity constraints;
10. exclusions / negative constraints.

Keep **shared style prompt** separate from **shot-specific prompt**. Do not repeat contradictory style instructions in every prompt.

For video generation, add motion instructions separately: start state, action sequence, camera path, speed, end state, environmental motion, and elements that must remain stable.

## 6. Prompt integrity

- Do not include unsupported historical details just to make a prompt richer.
- Do not use text rendering for critical dates, organization names, or logos when the generation system is unreliable; add these in post-production.
- Avoid requesting many simultaneous actions in one generated clip.
- Keep character identity and wardrobe consistent through explicit reference / asset controls when available.
- Avoid “make it cinematic” as the only camera direction.

## 7. Deliverables by stage

**Pre-production:** director's brief, visual treatment, character / environment design notes, sequence breakdown, storyboard, asset list.  
**Production:** shot prompts, key pose / action notes, camera and animation instructions, complexity tiers.  
**Post-production:** edit rhythm, sound plan, transition plan, title / graphics, continuity review, final runtime check.

## 8. Fallback strategy

For every complex shot, identify the core dramatic information and a lower-cost way to preserve it. Example: replace a simulated large crowd with a carefully framed foreground group, layered silhouettes, sound, and a wider environmental plate—only if that alternative remains truthful to the event's scale and context.
