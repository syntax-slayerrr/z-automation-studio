---
name: ipm-premium-documentary-studio
description: Integrated production system for a 15-episode premium 3D-animated historical documentary series about Ikatan Pelajar Muhammadiyah (IPM) — Indonesian narration (ElevenLabs-ready), vertical 9:16, 60–120 seconds per episode. Covers the series bible and 15-episode arc, historical research and evidence ledger, curiosity-driven non-repetitive scriptwriting (naskah), voice-over and sound design, cinematography, animation direction, AI image/video prompting (shot cards), tool selection, editing, QA, and handoff between different AIs. Use this skill whenever the user mentions IPM, Ikatan Pelajar Muhammadiyah, IRM, serial dokumenter, episode/eps, naskah, hook, voice over, ElevenLabs, storyboard, shot list, prompt animasi/video, series bible, or any part of this documentary — even if they only ask for one piece (a hook, a single prompt, a script review, a sound plan, a QA pass).
---

# IPM & Universal Historical Archival Documentary Studio (v3)

## Quickstart untuk Pemula / Orang Awam (1-Prompt Mode)
Pengguna awam cukup mengetik 1 kalimat di AI agent:
> *"Buatkan video gaya **Historical Archival & Map Documentary (IPM Chronicles)** tentang **[Episode 1 Sejarah IPM 1961 / Sejarah Jalur Rempah Nusantara / Sejarah Pelabuhan Santolo Garut]**"*

**Instruksi Otomatis untuk AI Agent:**
1. Tangani seluruh produksi secara otonom (riset fakta & `evidence_ledger.csv` → naskah dokumenter berantai → VO Cartesia `sonic-3` atau ElevenLabs `eleven_v4` + musik & SFX `-14.5 LUFS` → visual kertas arsip gouache/woodcut + peta kartografi `d3-geo` bergerak → render MP4 `1080×1920`).
2. Gunakan 2 golden reference di repo ini:
   - **Project Khusus Serial IPM (`1080×1920`)**: `ipm-chronicles/` (`npm run ipm:studio`, `npm run ipm:render:ep01`)
   - **Engine Diorama & Peta Sejarah Umum (`1080×1920`)**: `remotion/videos/historical-diorama/` & `remotion/videos/shotcraft-master/` (`npm run render:diorama`, `npm run render:shotcraft`)

A single system for making a **15-episode** animated historical documentary (or standalone historical archival episode) that feels directed, researched, and hard to stop watching. It is written so that *any* capable AI (or a human crew) can pick it up mid-project and produce consistent, premium work.

## North star
"Penonton harus merasa sedang menyaksikan film dokumenter sejarah yang dihidupkan melalui animasi — bukan presentasi sejarah yang diberi efek 3D."

Fifteen episodes are **one film in fifteen chapters**. Every decision is judged twice: does it make this episode excellent, and does it keep the whole series varied, connected, and curious?

## The three pillars (the foundation of quality)
Script, animation, and sound are not separate departments. They are designed in the same pass, because a viewer experiences them as one thing. When time or budget is tight, protect these three before anything else.

| Pillar | The standard | Deep guide |
|---|---|---|
| **Script (naskah)** | Built on a real, answerable historical question. Each episode opens a specific curiosity gap, pays it off truthfully, and sounds different in structure from its neighbours. | `references/script_and_curiosity_engine.md` |
| **Animation** | Believable human performance, a stable world, and motivated camera. Motion is tested *before* beauty, because motion is what exposes AI video first. | `references/animation_direction.md` |
| **Sound** | A consistent narrator, designed sound-on richness, and a story that still works muted. Voice is the series' face. | `references/sound_and_voice_design.md` |

**Three-track rule.** Write narration, picture, and sound together in one table (Voice | Picture | Sound). Narration must add what the picture cannot show (context, meaning, stakes). Never narrate what is plainly visible, and let image or silence carry any moment that does not need words.

## Hard constraints (truth comes first)
These cannot be traded for drama, speed, or beauty. A gorgeous shot that implies an unsupported fact fails.
1. **Never invent history**: no fabricated quotes, dialogue, inner thoughts, motives, named attendees, exact rooms, banners, documents, signatures, or faces of real people.
2. **No fake archive.** Reconstruction is labelled internally (and visibly where needed). Never simulate film damage or period-photo styling that could pass as genuine archive.
3. **Evidence ↔ claim mapping.** Every factual narration line, title card, and historically specific visual links to an evidence ID. See `references/historical_evidence_protocol.md`.
4. **Curiosity comes from real gaps** (unanswered questions, stakes, consequences, contradictions with common belief), never from fabricated conflict or fake mystery.
5. **No publication without explicit user authorization.** Deliver production-ready assets and recommendations.

## Locked creative decisions
- Premium realistic-stylized 3D; human characters with credible anatomy and restrained acting. No stick figures, beans, or cartoon shorthand.
- Historical-documentary tone, never an organizational advertisement.
- 60–120 s per episode, 9:16, mobile-first, with caption/platform safe areas protected.
- Indonesian narration, prepared as an ElevenLabs-ready script (one narrator for all 15 episodes).
- Tool choice is per task, evidence-based, and replaceable (`references/ai_pipeline_and_prompting.md`).

## Operating modes
Decide which mode applies before doing anything. If unsure, check `project_state.md` (see `workflows/agent_handoff.md`).

1. **Series mode** (once, before Episode 1 is written): research the whole arc at dossier level, build the Series Bible, lock the look, sound, and narrator, map the 15 episodes, and set the variation matrix and open-loop ledger. → `references/series_bible_and_arc.md`, `templates/series_bible.md`.
2. **Pilot**: produce Episode 1 through all gates. It proves the system; afterwards the Series Bible is locked at v1.0.
3. **Episode mode** (Episodes 2–15): the same quality, with lighter gates because the look, sound, and narrator are already locked. Research and treatments may be batched in waves; scripts are written in order so the curiosity chain holds. → `workflows/production_pipeline.md`.
4. **Single-task mode**: the user asks for just one thing (a hook, a prompt, a review). Do that task directly, still applying the hard constraints, the Series Bible, and the variation matrix if they exist.

## Which file to read for which task
Read only what the task needs, but read it fully before producing output.

| Task | Read |
|---|---|
| Series foundation, 15-episode arc, variation, open loops, series memory | `references/series_bible_and_arc.md` + `templates/series_bible.md` |
| Research, sources, evidence ledger, what may be depicted | `references/historical_evidence_protocol.md` + `templates/evidence_ledger.csv` |
| Hooks, structure, narration, rhythm, curiosity, Indonesian spoken style | `references/script_and_curiosity_engine.md` |
| Visual identity, palette per era, graphics, typography | `references/art_direction_look_dev.md` |
| Shot design, camera, vertical composition, transitions | `references/cinematography_shot_design.md` |
| Characters, performance, motion, continuity, fixing broken motion | `references/animation_direction.md` |
| Narrator, ElevenLabs, music, ambience, foley, edit rhythm, mix | `references/sound_and_voice_design.md` |
| Tool choice, image/video prompts, keyframes, cost, fallback | `references/ai_pipeline_and_prompting.md` + `templates/shot_card.md` |
| QA, scoring, release, series-level audit | `references/quality_gate.md` + `templates/qa_report.md` |
| Passing work between AIs, resuming a project | `workflows/agent_handoff.md` + `templates/project_state.md` |
| Kick-off prompts for the user | `workflows/START_HERE.md` |

## Workflow in one view
Full detail: `workflows/production_pipeline.md`.

- **Series gates:** S0 Brief → S1 Arc research dossier → S2 Series Bible & look/sound lock → S3 Episode map & variation matrix.
- **Episode gates:** E1 Research & treatment → E2 Three-track script & sound plan → E3 Visual development, animatic, tool test → E4 Production by sequence → E5 Edit, mix, finish → E6 QA & archive.
- Approvals are **bundled** (usually 4 per episode after the pilot) so the user is not asked for sign-off eight times per episode.
- At each stage state: **Known / Unknown / Assumed / Awaiting approval**; produce the specified artifact; run its checklist; name blocking issues.

## The Premium Test (run before leaving the script stage and again before QA)
An episode is not ready until all ten answers are concrete:
1. Can the central question be said in one sentence a stranger would care about?
2. What does the viewer assume at second 0, and when is that assumption overturned or deepened?
3. Which curiosity gap opens in the first 5 seconds, and exactly where does it close?
4. **Mute test:** does the picture carry the story with sound off (captions on)?
5. **Eyes-closed test:** does the audio alone still make sense and feel designed?
6. Which 3–5 hero shots carry the episode, and are they designed at keyframe level?
7. What is the *one* distinctive idea of this episode (structure, camera, or sound) that no other episode has?
8. Does every factual line and implication map to an evidence ID?
9. What should the viewer feel on the last frame, and what do voice, music, and silence do to create it?
10. In every 8–15 seconds, what changes (information, visual mode, voice tempo, or sound)?

## Failure modes and the fix
| Symptom | Likely cause | Fix |
|---|---|---|
| Episodes feel the same | Same hook/structure/ending reused | Run the variation matrix; change structure, not just wording (`series_bible_and_arc.md`) |
| Opening feels generic | Hook not tied to a specific gap | Rewrite using the hook test in `script_and_curiosity_engine.md` |
| "Slideshow with 3D effects" | Static shots, camera-only motion, no performance | Add motivated human action, hero-shot budget, performance direction (`animation_direction.md`) |
| AI clips look inconsistent | No reference pack or look lock | Build the consistency kit and a unified finishing pass |
| Voice sounds flat or "trailer" | One setting and tempo for every line | Tempo map, segment-level generation, narrator direction card |
| Scripts stay robotic | Written for the eye, not the ear | Read-aloud test and `scripts/script_lint.py` |
| Suspense feels cheap | Teaser with no real gap, or withheld too long | Honest-cliffhanger rules; never withhold > ~20 s |
| Beautiful but unsafe historically | Visual implies unverified specifics | Visual truth class + "do not depict" list |

## Bundled tools
Run them rather than eyeballing, because repetition across 15 episodes is hard to see by reading.
- `python scripts/script_lint.py <narration.txt> [--series-dir <folder of other episodes>]`: runtime estimate, sentence-rhythm stats, banned/overused phrases, hook length, TTS risks, and cross-episode repetition.
- `python scripts/series_audit.py <variation_matrix.csv> [--loops open_loops.csv]`: checks the variation rules and open-loop discipline across the 15 episodes.

## Communicating with the user
- Reply to the user in **Indonesian** unless they switch language. Narration deliverables are Indonesian; production documents may mix English technical terms.
- Deliver concrete artifacts (tables, scripts, shot cards), not generic advice or vague praise. If asked for a "final package", produce the complete set, not an outline.
- Ask only questions that are genuinely unanswered and that block the next gate. Prefer proposing a recommendation with reasons over open-ended questions.
- Say plainly when something is unverified (a historical claim, a tool feature, a price, a license).

## Definition of done (per episode)
Evidence ledger signed off; Premium Test passed; locked script with narration-only and TTS exports; spotting sheet; shot cards for hero shots; continuity sheet; final edit and mix; QA ≥ 85/100 with no hard blocker; archive complete; Series Bible, open-loop ledger, and variation matrix updated.
