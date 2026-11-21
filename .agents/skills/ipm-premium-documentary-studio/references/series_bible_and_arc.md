# Series Bible & 15-Episode Arc

Fifteen short episodes can easily turn into fifteen copies of one video. This file prevents that. It defines what stays **constant** (so the series feels like one film) and what must **rotate** (so no episode feels like the last one), and how curiosity carries a viewer from episode to episode.

## Contents
1. Constant vs rotating elements
2. Series Bible contents (build once, at gate S2)
3. The 15-episode arc (functions, not facts)
4. Curiosity chain and open-loop ledger
5. Variation matrix and its rules
6. Series memory (merged knowledge graph)
7. Corrections and revisions
8. Series-level audits

---

## 1. Constant vs rotating

| Constant (binds the series) | Rotating (keeps it alive) |
|---|---|
| Look lock: rendering style, lens family, finishing/"glue" pass, caption typography | Era palette and lighting character |
| One narrator voice and settings | Narrator tempo and intensity per episode |
| A short sonic signature and 3–4 recurring musical cues | Which ambience, instrumentation, and silence strategy each episode uses |
| Title-card and end-card format, source-label format | Hook mechanism, structure, ending type |
| Visual motif system (see Series Bible §5) | Opening visual mode, camera signature, hero-shot design |
| Naming and terminology conventions | The distinctive idea of each episode |

A viewer should recognise the series in two seconds, yet never be able to predict how the next episode will open.

## 2. Series Bible contents (use `templates/series_bible.md`)
Create at gate S2, lock as v1.0 after the pilot, and update through a change log.
1. **Series promise**: one sentence about what the audience gains by watching all 15.
2. **Series question**: the through-line question that all episodes serve (distinct from each episode's own question).
3. **Audience and platform**: who watches, where, with sound on or off, viewing context.
4. **Look lock**: see `art_direction_look_dev.md`.
5. **Motif system**: 2–3 recurring visual motifs (an object, a place type, a gesture, a light behavior). Motifs must be *symbolic or evidence-backed*, never asserted as historical fact unless verified. They create callbacks and let ep. 15 echo ep. 1.
6. **Sound lock**: narrator ID/settings, sonic signature, cue library, mix targets (`sound_and_voice_design.md`).
7. **Terminology and style guide**: official names, abbreviations on first use, how dates/numbers are written on-screen and spoken, forms such as IPM / IRM and Muhammadiyah, titles and honorifics. Verify each against sources.
8. **Glossary of terms introduced**, with the episode that introduces each.
9. **Episode map** (§3) and **variation matrix** (§5).
10. **Open-loop ledger** (§4).
11. **Asset registry**: approved character, environment, prop, and music/sound IDs with versions and licenses.
12. **Change log** and **decision log**.

## 3. The 15-episode arc (functions, not facts)
Topics are assigned only after the arc research dossier (gate S1). Chronology is the default *spine*, not a cage: some episodes may open from a later vantage point (see structures in the script engine). Never choose an order the evidence cannot support.

**Shape: three acts with a mid-series reframing.**

| Slots | Act | Narrative job |
|---|---|---|
| 1 | Prologue | Plant the series question. Establish the world and a reason to care. Cold-open energy, one distinctive image. Teach the audience how this series speaks. |
| 2–4 | Act I: Roots | Origins and conditions. Establish the era, the stakes, and the first real unanswered questions. Episode 4 closes Act I with a first turning point. |
| 5–8 | Act II-a: Formation | Structure, identity, and decisions. Episode 8 is the **midpoint reframing**: revise something the audience believed after earlier episodes. |
| 9–11 | Act II-b: Pressure | Constraints, disagreements documented in sources, adaptation, change. Include the series' quietest, most reflective episode here. |
| 12–14 | Act III: Consequence | What the earlier decisions produced; continuity and change toward the present. |
| 15 | Epilogue | Answer the series question honestly (including what remains unknown). Echo the prologue's motif or question with a changed meaning. |

**Pacing across the arc.** Alternate high-information episodes with breathers (quiet chronicle or object-led). Never place three dense, name-heavy episodes in a row. Reserve at least two "quiet" episodes (low narration, long holds, sound-led) for the middle of the series.

**Research leads, not facts.** Milestones often associated with IPM history include early student initiatives (Garut, 1958), the Muhammadiyah Youth Congress (Yogyakarta, 1960), an establishment milestone conventionally associated with Surakarta (1961), the 1992 change to IRM, and the restoration of the IPM name in 2008. Treat every date, forum, and causal wording as a research question until the evidence ledger says otherwise. Use gate S1 to find *additional* strong episode candidates (people-in-role, documents, congresses, regional growth, publications, schools, internal debates, cultural activity) so the series is not just a list of dates.

**Episode slot card (fill per episode at S3):** slot, act function, working topic, central question, what the audience believes entering, what they believe leaving, loop opened, loop closed, structure, hook type, ending type, opening visual mode, camera signature, sound palette, era palette, evidence readiness (green / amber / red).

## 4. Curiosity chain and open-loop ledger
Curiosity is the engine that carries a viewer from one episode to the next. It works only when the gap is **real** and the payoff is **paid**.

**Loop types**
- *Episode loop*: opens in the first 5 s, closes before the end of the same episode.
- *Bridge loop*: opened late in episode N, closed early in N+1 (use when the history genuinely continues).
- *Arc loop*: opened in act I, closed in act II or III. Maximum **two arc loops open at once**.
- *Series loop*: the series question; closed in ep. 15.

**Rules**
1. Every loop is backed by a real unanswered question, real consequence, or a verified contradiction with popular belief. It is recorded in the ledger with its evidence IDs.
2. At most **three loops are open at any moment** across the series, or the audience stops tracking them.
3. Every loop has a planned closing episode before it is opened. A promise without a payoff is a failure.
4. Never withhold the answer to a loop longer than the viewer can tolerate within an episode (about 20 s) unless it is a bridge or arc loop clearly framed as such.
5. No episode ends with artificial "stay tuned" bait. Allowed endings are listed in the script engine (§9 there).
6. A closed loop must change something: the audience's understanding, the stakes, or the next question.

Track loops in `templates/open_loops.csv`; `scripts/series_audit.py --loops` verifies the discipline.

## 5. Variation matrix and its rules
Maintain one row per episode in `templates/variation_matrix.csv`. Columns: `ep, hook_type, structure, opening_visual_mode, narrator_tempo, sound_palette, camera_signature, ending_type, era_palette, voiced_ratio`.

**Rules (checked by `scripts/series_audit.py`)**
1. `hook_type` and `structure` do not repeat within any window of **3 consecutive episodes**.
2. `ending_type` never repeats in consecutive episodes.
3. A 15-episode series uses **at least 5 distinct structures**, and **at least 2 "quiet_chronicle"** episodes.
4. `opening_visual_mode` does not repeat in consecutive episodes.
5. `voiced_ratio` (share of runtime with narration) varies: at least one episode ≤ 0.65 and at least one ≥ 0.85.
6. No more than **two consecutive** episodes at the same `narrator_tempo`.
7. Loops: at most three open at once; every loop closes after it opens; every loop closes by the last episode.

Vocabulary for the columns lives in `script_and_curiosity_engine.md` (hooks, structures, endings), `cinematography_shot_design.md` (camera signatures, opening visual modes), and `sound_and_voice_design.md` (palettes, tempo). Change the matrix **before** writing a script, not after, because variation is a design decision, not a proofreading fix.

## 6. Series memory (knowledge graph)
Treat the series as one connected work. Maintain, in the Series Bible or `project_state.md`:
- **Entities:** person / anonymized role / organization; event / decision / congress / policy; place / institution; document / publication / photograph / artifact; date / period / term; claim / interpretation / unresolved question; character, environment, prop, and sound assets.
- **Relationships (only if sourced, with confidence):** PERSON participated_in EVENT; EVENT occurred_at PLACE; EVENT resulted_in DECISION; ORGANIZATION changed_name_to ORGANIZATION (date, source); CLAIM supported_by SOURCE; SHOT depicts RECONSTRUCTION_OF EVENT (visual truth class).
- **Per-episode memory record:** canonical verified facts + source IDs; terms introduced and how they were defined; people and roles introduced; asset IDs and approved versions; unresolved or disputed questions; what the audience has been told; narrative promises later episodes must keep; phrases and hooks already used (to avoid repetition).

**Contradiction check before finalizing any episode:** compare dates, names, and terms with earlier episodes; check whether an earlier claim has since been revised; preserve uncertainty rather than silently rewriting history.

## 7. Corrections and revisions
If later research changes an earlier episode's claim: log it in the change log, update the ledger, fix the Series Bible, and prepare a correction note or revised cut. Never silently contradict earlier published content.

## 8. Series-level audits
Run at episodes 5, 10, and 15 (and whenever a script is revised heavily):
- `scripts/series_audit.py` on the matrix and loop ledger.
- `scripts/script_lint.py --series-dir` on all narration files: repeated phrases, repeated openers, overused connectives.
- Look drift check: place a still from each episode on one contact sheet; do skin, color, and lens feel like one film?
- Sound drift check: play the first 10 seconds of every episode in a row; is the narrator consistent, and is each opening still distinct?
- Motif check: are callbacks earned, not pasted in?
