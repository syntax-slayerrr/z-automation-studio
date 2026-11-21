# AI Pipeline, Tool Selection & Prompting

## Contents
1. Principles
2. Keyframe-first workflow
3. Task categories
4. Tool evaluation scorecard and test protocol
5. Cost model
6. Tool honesty and privacy
7. Shot Card prompt standard
8. Prompt rules and negative baseline
9. Consistency kit
10. Fallback ladder
11. Tool selection report

---

## 1. Principles
Choose the best tool for the task, not the most fashionable one. Re-check capabilities, access, terms, and costs whenever they matter, because they change. No tool loyalty: each shot records the selected method, trade-offs, and a fallback. Do not accept first-generation output automatically; review, diagnose, revise, and regenerate selectively.

## 2. Keyframe-first workflow
Premium results come from designing the image *before* animating it.
1. **Design** the keyframe as a still (composition, light, character, environment) using approved references.
2. **Approve** the keyframe against the shot card (story function, truth class, safe areas).
3. **Animate** from the approved frame with a single dominant action and defined end state.
4. **Review** with the motion QA protocol in `animation_direction.md`.
5. **Finish** in the glue pass.
Hero shots go through this fully; utility shots may skip approval of intermediate stills.

## 3. Task categories
Research and source capture; script development and editorial review; character concepts and reference sheets; environment and prop design; storyboard and animatic; text-to-image and image editing; image-to-video and text-to-video; character animation and motion control; voice generation; music and SFX; editing, compositing, captions, color, mastering; asset management and versioning.

## 4. Tool evaluation scorecard and test protocol
Score candidates 1–5 with evidence, weighted for the shot type (a close-up weights identity and facial motion; a landscape weights environment detail and camera motion):
1. Visual quality for this shot. 2. Character consistency. 3. Environment and object consistency. 4. Motion realism and control. 5. Camera control. 6. Reference conditioning / first-last-frame support. 7. Duration, resolution, aspect ratio, frame rate. 8. Iteration speed and failure rate. 9. Cost per accepted usable second. 10. Commercial rights, privacy, attribution. 11. Export, API, workflow integration. 12. Fallback availability and lock-in.

**Test protocol (gate E3 for the pilot; repeat when a tool or model changes):**
- Choose **three representative hero shots**: one human-performance close/medium, one environment/camera move, one multi-person or object-interaction shot.
- Run each on 2–3 candidate pipelines with the *same* references and shot cards.
- Record accepted vs rejected takes, failure types, time, and cost per accepted second.
- Choose a pipeline *per shot type*, not one global tool. Document known failure modes and a fallback.

## 5. Cost model
Total generations; rejected generations; accepted seconds; editing/compositing time; voice and audio costs; human review time; total cost per finished minute. Never estimate from the price of a single generation.

## 6. Tool honesty and privacy
Do not state current pricing, feature availability, model names, limits, or commercial-use rights from memory. Verify in official documentation (and cite the date checked) or label the item **unverified**. If web access is available and capabilities materially affect the plan, research official documentation. Do not upload private or sensitive material to third-party tools without the user's permission.

## 7. Shot Card prompt standard
Write prompts as a **directed shot brief**, not a pile of adjectives. Use `templates/shot_card.md`. Architecture:
1. **Shot intent:** what the viewer must notice and feel.
2. **Historical context:** period, location, supported details, uncertainty boundaries, visual truth class.
3. **Subject:** character, prop, environment with approved reference IDs.
4. **Action:** one dominant action as start / middle / end with approximate timing (see recipe library).
5. **Composition:** shot size, angle, subject placement, foreground / midground / background, safe areas.
6. **Camera:** movement, speed, start and end framing, lens character.
7. **Lighting:** source, direction, softness, contrast, atmosphere.
8. **Materials:** skin, cloth, wood, paper, metal, architecture.
9. **Performance:** weight, gaze, hands, breath, secondary motion (intention → trigger → action → reaction).
10. **Continuity:** wardrobe, screen direction, environment state, reference constraints.
11. **Output:** 9:16, duration, resolution, frame rate as supported.
12. **Negative constraints and fallback.**

Adapt the same card to the tool's format (image prompt, image-to-video prompt, reference-conditioning fields); keep the card as the source of truth and record the adapted prompt next to it.

## 8. Prompt rules and negative baseline
- One dominant action per shot; no contradictory adjectives; no impossible camera instructions.
- Put the story-critical content first and keep style words subordinate to subject and action.
- No unsupported text, logos, banners, or readable documents; add text in post.
- Use approved character and environment references.
- Always include a fallback if the tool cannot satisfy identity or motion constraints.

**Negative baseline:** no face morphing or identity drift; no extra or malformed fingers; no floating objects; no foot sliding; no rubber limbs; no duplicated people; no synchronized crowd loops; no gibberish text or fake logos; no random gestures; no modern objects in period scenes; no unverified historical symbols; no artificial film damage implying authentic archival footage.

## 9. Consistency kit
Build before production and reuse for all 15 episodes: character sheets and turnarounds; face archetype sheets for extras; wardrobe and prop references by period; environment plates (wide, medium, detail); palette swatches per era; lens/camera language card; lighting presets; a "style anchor" still that encodes the look lock; a prompt snippet library (approved phrasing for materials, light, and negative constraints); the glue-pass settings. Store IDs and versions in the asset registry.

## 10. Fallback ladder
1. Retry with corrected prompt or reference.
2. Reduce action complexity and shot duration.
3. Use image-to-video from an approved keyframe instead of text-to-video.
4. Split into several controlled shots.
5. Composite separately generated elements.
6. Use conventional 3D or editing tools where feasible.
7. Replace the shot with an honest graphic, map, archival item, or symbolic shot.

## 11. Tool selection report
Per episode: shot IDs; candidates; evidence and date checked; representative test result; selected tool and why; known failure modes; fallback; cost and license notes (use `templates/tool_evaluation.md`).
