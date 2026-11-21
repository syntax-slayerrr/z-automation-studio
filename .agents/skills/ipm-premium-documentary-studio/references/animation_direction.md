# Animation Direction (Performance, Motion, Character, Continuity)

Premium animation is **believable human performance + a stable world + intentional camera**. In AI-assisted production, motion is the first thing that betrays the work, so this file treats motion as a design and testing problem, not a prompt-wording problem.

## Contents
1. Principles
2. Shot classes and effort budget
3. Performance direction for a documentary
4. Motion recipe library
5. Shot construction ladder (most reliable → most ambitious)
6. Duration discipline and handles
7. Look-dev for premium surfaces
8. Characters: identity, casting, ethics
9. Environments and continuity tracking
10. Failure diagnosis table
11. Motion QA protocol
12. Anti-AI-tells
13. Records to keep

---

## 1. Principles
1. **Motion before beauty.** Test whether a shot *moves* convincingly before polishing how it looks. A beautiful still that cannot be animated is a trap.
2. **One dominant action per shot.** If the shot needs two actions, it is two shots.
3. **Design the start and end poses.** Never let a generator invent the ending pose; define first frame, last frame (or the target end state), and the action between.
4. **Restraint reads as realism.** Documentary acting is small: breath, gaze, a hand adjusting paper. Overacting reads as cartoon or game cutscene.
5. **Never hide a broken animation** with shake, blur, speed ramps, or rapid cuts. Redesign the shot.
6. **The world reacts.** Cloth, dust, light, paper, and people respond to the action.
7. **Spend effort where the viewer looks.** Faces and hands in hero shots get the most care; background extras get believable behavior, not heroic detail.

## 2. Shot classes and effort budget
Classify every shot at the animatic stage (record in the shot card).

| Class | Role | Typical share | Effort |
|---|---|---|---|
| **Hero** | The 3–5 shots a viewer remembers: the opening image, the turn, the final image; includes the episode's signature shot | 3–5 per episode | Keyframe-designed, multiple candidates (often 6–12), bespoke references, frame-by-frame review |
| **Standard** | Story-carrying coverage between hero shots | ~50% of shots | 2–4 candidates; clean motion; reference-conditioned |
| **Utility** | Inserts, maps, texture/atmosphere, bridges, graphics | The rest | Fast; accept the first clean take; build in post where possible |

Rule: allocate roughly **60% of generation effort to hero shots**. Each episode has one **signature shot**: a single image that could be the poster of that episode and that carries its distinctive idea. It must be historically safe (visual truth class recorded).

## 3. Performance direction for a documentary
Write performance as **intention → trigger → action → reaction**, not as adjectives.
- Example line (placeholder): *Intention:* checking the page is ready. *Trigger:* a sound from outside. *Action:* eyes lift from the paper, head turns a quarter, hand stops mid-line. *Reaction:* a slow breath, then returns to writing.
- **Gaze is storytelling.** Specify eyelines and when they move; attention shifts carry stakes without words.
- **Hands and objects.** State what each hand does; show contact (fingers on paper, pressure, weight). Hands in action are hard for AI; stage them from behind, in medium shots, or as short inserts.
- **Breath and micro-adjustments.** Subtle chest movement, weight shifts, blinking, small corrections of posture; never frozen mannequins.
- **Crowds in three layers:** foreground individuals with distinct, motivated behavior; midground groups with varied timing; background ambient movement. No synchronized loops, no identical faces.
- **Human-scale history.** Show people doing the ordinary work of the period (listening, writing, walking to a place, carrying papers). Do not stage invented speeches, handshakes, signing, or ceremony unless documented.
- **Emotion is attributed to the scene, not to a named real person.** Never script private feelings of a documented individual.

## 4. Motion recipe library
Use as starting points. Each lists typical AI failure and the mitigation.

| Recipe | Length | Key beats | Typical failure | Mitigation |
|---|---|---|---|---|
| Seated writing | 3–5 s | Settle; pen/hand moves; pause to read; small head tilt | Hand/pen morphing, text gibberish | Over-the-shoulder or side angle; hide paper face; add text in post |
| Walking to camera/away | 3–4 s | Weight shift; heel strike; arm counter-swing; cloth follow-through | Foot sliding, sliding at distance | Medium or follow shot; avoid full-body wide for >3 s; cut on foot contact |
| Entering through a door | 3–4 s | Hand on door; weight; pause; step; door settles | Door clipping, hand penetration | Start with door already moving; cut to interior as the step lands |
| Paper handoff | 2–3 s | Reach; grip; transfer; release; reaction glance | Fused hands, paper duplication | Close insert of one hand only; or two-shot with partial occlusion |
| Turning to a sound | 2–3 s | Anticipation (small eye move) → head → shoulders | Face morph on turn | Start 3/4 view, limit turn to ≤ 45°, shorter shot |
| Group listening | 4–6 s | Varied small reactions; one person looks away; one shifts | Identical clones; static extras | Distinct face archetype sheets; stagger micro-actions |
| Crowd passing through a gate | 3–5 s | Layered flow; some pause, some hurry; cloth/dust response | Looped crowd, melting limbs | Shoot as layers or from above/behind; keep individuals few and readable |
| Hands on an object | 2–3 s | Approach; touch; tiny adjustment | Impossible grip | Static camera; one object; real-contact keyframe |
| Wind in cloth/leaves | 3–6 s | Gentle, directionally consistent | Chaotic flutter | Reference weather note; low amplitude |
| Transport passing | 3–4 s | Motion blur consistent; ground contact; dust | Wheel/ground slip | Period-correct model reference; side or low angle; short duration |

Add new recipes to the Series Bible when a pattern proves reliable in a specific tool.

## 5. Shot construction ladder
Choose the **simplest method that serves the shot**. Move down the list only when the story needs it. Verify each technique's availability in the actual tool first (`ai_pipeline_and_prompting.md`).

1. **Locked-off hold with living micro-motion** (breath, cloth, light, dust, ambient). Most reliable. Often the strongest for evidence moments and quiet beats.
2. **Camera move on a stable, layered keyframe** (parallax from separated depth layers) *plus* living micro-motion and at least one moving element. Use only when layers are truly separated; a flat image with a push-in is the "slideshow" failure.
3. **Image-to-video from an approved keyframe**, single dominant action, short duration.
4. **First-and-last-frame control**, when supported, for defined start/end poses.
5. **Reference-conditioned character shot** (identity, wardrobe, and prop references) with a restrained action.
6. **Composited layers** (background plate, character layer, foreground element, atmosphere) when one generation cannot hold everything.
7. **Conventional 3D / DCC tools** (modeling, rigging, rendering) for hero shots that must be exact or repeated across episodes (a recurring interior, an object, a vehicle).
8. **Honest alternative:** map, document insert, symbolic shot, or archival item (clearly labelled) when no reliable method exists.

## 6. Duration discipline and handles
- Plan shots at the length the story needs; generate in units the tool handles best (often a few seconds) and use the cleanest portion, typically 2–4 s.
- Keep **handles** (extra frames before and after) so the editor can cut on action.
- Cut **on motion** (a head turn, a hand landing) to hide seams; never cut across an identity change.
- Shorter, cleaner shots beat longer, risky ones. Variation of shot length follows the rhythm curve, not the generator's maximum.

## 7. Look-dev for premium surfaces
The difference between "AI clip" and "film frame" lives in surfaces and light.
- **Skin:** subtle subsurface scattering, natural tonal variation, small asymmetries, no wax, no over-sharpened pores. Preserve skin-tone integrity under every palette.
- **Eyes:** correct catchlights from the scene's light, moisture, saccadic micro-movement; no glassy stare.
- **Hair:** flyaways and weight; consistent hairline and style per character ID.
- **Cloth:** visible weave, period-appropriate cut and folds, weight and drape; correct secondary motion.
- **Materials:** differentiated response for wood, paper, metal, glass, concrete, soil, vegetation.
- **Light:** motivated sources; consistent direction within a scene; avoid constant volumetric fog or teal-orange as a crutch.
- **Lens:** a consistent family (see cinematography); small natural imperfections (slight vignette, mild chromatic fringing) used uniformly, never as a "film damage" effect.
- **Motion blur and frame rate:** pick one cadence for the series (e.g., 24 or 25 or 30 fps per delivery needs) and a consistent shutter feel; conform all shots.
- **Glue pass (finishing):** one unified grade, grain level, sharpening, and halation applied across *all* shots and all 15 episodes so shots from different tools feel like one film. Grain must be subtle and uniform; it must not imitate old archival footage.

## 8. Characters: identity, casting, ethics
For every recurring character or designed composite, create (use `templates/character_environment_bible.md`): ID and narrative role; type (documented individual, anonymized figure, generic extra, fictional composite); evidence basis and identity confidence; age range only if supported or intentionally generic; face and body sheet with front / side / three-quarter / back views; wardrobe layers, footwear, accessories; expression and gesture range; scale reference; animation constraints; approved reference image IDs and versions.

**Ethics (hard rules)**
- Never fabricate the likeness of a named historical person. If a reliable, rights-cleared likeness is unavailable, use a non-identifying representation: rear view, silhouette, hands, wide shot, or a clearly fictional composite not presented as the person.
- Never present a composite as a real individual. Label composites internally and visibly where needed.
- Do not depict a real, named person doing or feeling something the record does not state.

**Casting palette (series-level).** AI tools tend to produce a repeating "default face". Counter it with 6–10 distinct **face archetype sheets** for extras (varied age within the plausible range, face shape, hair, skin tone, build, posture), each with reference IDs, and rotate them. Background groups use at least three archetypes per shot.

## 9. Environments and continuity tracking
**Environment bible** per location: ID and period; evidence and reference sources; architecture, materials, layout, props, vegetation, street conditions; geography and entrance/exit directions; lighting and weather assumptions; what is known vs contextual; approved wide, medium, and detail references; do-not-generate list.

**Track in every shot (continuity sheet):** character identity, wardrobe, hair, props, body orientation; time of day, weather, light direction; location geography, screen direction, entrances/exits; object state and document orientation; camera axis and eyeline.

Keep screen direction consistent across cuts unless a deliberate transition resets geography. Maintain an environment "state" (e.g., door open/closed, papers on table) so repeated shots of one place match.

## 10. Failure diagnosis table
| Symptom | Probable cause | Fix |
|---|---|---|
| Face drifts or morphs | Weak identity conditioning; long shot; extreme turn | Add references; shorten; keep ≤ 45° head turn; cut on movement; closer pipeline |
| Foot sliding / floaty walk | Full-body wide with long walking | Medium shot, shorter duration, cut on contact, or composite a grounded layer |
| Rubber limbs, melting hands | Complex hand action; too much motion | Simplify action; insert; occlusion; split the shot |
| Everyone looks alike | Default-face bias | Archetype sheets; per-person references; vary clothing and posture |
| Frozen extras | Generator prioritizes subject | Layer crowd; add motivated micro-actions; composite |
| Floating props / bad grips | No contact keyframe | Design the contact frame; static camera; insert shot |
| Plastic skin / toy look | Over-smoothed render, lighting | Adjust material/lighting prompts; unify the glue pass; reduce beauty filters |
| Lighting changes mid-shot | Under-specified light | State light source and direction; shorter shot; fix in grade |
| Scene doesn't match previous shot | No environment reference | Use environment bible plates; lock first frame from an approved still |
| Jittery camera or warping architecture | Over-ambitious camera move | Reduce move; use locked or simple translation; build parallax from layers |
| Gibberish text | Generator text | Remove from prompt; add verified type in post |
| Motion looks "slow-mo" | Generator default pacing | Specify natural speed and beats; shorten; speed-correct in edit |

If a shot still fails after the fallback ladder in `ai_pipeline_and_prompting.md`, replace the shot rather than ship it.

## 11. Motion QA protocol
Review every hero and standard shot with these passes before accepting it:
1. **Real-time pass:** does it read as natural at full speed on a phone-sized screen?
2. **Slow pass (0.25×):** check contact points, hands, face stability, cloth, and background extras.
3. **Contact sheet:** first/middle/last frame plus a mid-action frame; compare identity and wardrobe to the reference.
4. **Loop/repetition check:** any gesture or crowd cycle repeating?
5. **Edge check:** pop-in, ghosting, flicker at silhouettes.
6. **Cut check:** drop it into the edit; does the cut-on-action work with neighbouring shots?
Mark each defect with severity (critical / major / minor) per `quality_gate.md`.

## 12. Anti-AI-tells (cumulative list)
Face morphing; identity drift; "default face" crowds; extra or fused fingers; floating objects; foot sliding; rubber limbs; synchronized crowd loops; gibberish text and fake logos; waxy skin; over-sharpening; constant shallow depth of field; endless slow push-ins; constant fog/haze; teal-orange grade on every shot; slow-motion by default; mismatched shadows; period-inappropriate objects; uniform "perfect" hair and teeth; perfectly symmetrical faces; every shot at the same distance and angle.

## 13. Records to keep
Version log per shot (prompt, references, tool, settings, seed where available, date), accepted/rejected reason, continuity sheet, asset registry updates, and time/cost per accepted second.
