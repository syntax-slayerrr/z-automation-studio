# Stage-Gated Production Pipeline (Series + Episodes)

Two layers: **Series gates (S0–S3)** are done once; **Episode gates (E1–E6)** repeat for each of the 15 episodes. Episode 1 is the **pilot** that proves the system and locks Series Bible v1.0.

At every gate: state **Known / Unknown / Assumed / Awaiting approval**; produce the listed artifact; run the checklist; name blocking issues; ask for approval only where indicated. Update `project_state.md` after every gate.

---

## Series gates (once)

### S0 — Series brief
Deliver: series promise, series question, audience and platform, scope (15 episodes, 60–120 s, 9:16), constraints (budget, tools, languages), reviewers (who signs off on history).
Pass when: the series question is specific, and success criteria are stated.

### S1 — Arc research dossier
Deliver: dossier-level chronology for the whole arc; source map and quality assessment; candidate episode topics (more than 15, ranked); contradictions and unknowns; evidence-readiness per candidate (green / amber / red); depiction boundaries (what can and cannot be shown).
Pass when: every proposed episode has at least one strong, traceable source path, and unresolved claims are marked.
Read: `references/historical_evidence_protocol.md`.

### S2 — Series Bible and locks
Deliver: Series Bible (`templates/series_bible.md`) including the look lock, era palette *method*, motif system, narrator voice lock (audition results), sonic signature and cue library, terminology guide, asset registry shell.
Pass when: look, sound, and narrator are decided and sampled (one style frame, one voice test, one 10-second sound sketch).
Read: `art_direction_look_dev.md`, `sound_and_voice_design.md`, `series_bible_and_arc.md`.

### S3 — Episode map and variation matrix
Deliver: 15 slot cards; `variation_matrix.csv`; `open_loops.csv`; planned waves (e.g., pilot, then waves of 3–5 episodes).
Pass when: `python scripts/series_audit.py templates/variation_matrix.csv --loops templates/open_loops.csv` passes (use your filled copies), and every slot's central question is evidence-ready or has a research plan.
**Approval bundle S:** S0–S3 together (the user approves the series foundation once).

---

## Episode gates (repeat ×15)

### E1 — Research & treatment *(Bundle A)*
Deliver: episode brief (`templates/episode_brief.md`); evidence ledger rows with unique IDs; chronology; contradictions and unknowns; depiction boundaries; **2–3 distinct story approaches** (different structure and hook mechanism, each with hook, ladder, turn, payoff, visual and sound concept); recommended approach with rationale; fit against the variation matrix and open-loop ledger.
Pass when: compelling without invented drama; clear takeaway; the central question is answerable from the ledger.
**Approval A:** user (and historical reviewer where available).

### E2 — Three-track script & sound plan *(Bundle B)*
Deliver: beat sheet with ladder; **Voice | Picture | Sound** script with timestamps (`templates/script_and_shot_breakdown.md`); on-screen text; narrator direction card; master narration + TTS export; pronunciation sheet; spotting sheet (`templates/sound_spotting_sheet.md`); `script_lint.py` report; Premium Test answers; variation-matrix row and loop updates.
Pass when: runtime plausible from a *calibrated* voice sample; language natural when read aloud; every factual line evidence-linked; lint and Premium Test clear.
**Approval B:** user.

### E3 — Visual development, animatic, tool test *(Bundle C)*
Deliver: style frames for the episode's era; character/environment/prop references (`templates/character_environment_bible.md`); shot list with classes (hero/standard/utility); **shot cards for hero shots** (`templates/shot_card.md`); storyboard and animatic with temp voice and temp sound; tool test on representative hero shots and scorecard (`templates/tool_evaluation.md`); budget and time estimate.
Pass when: the story works in sequence on the animatic; the highest visual risks have tested solutions; identity and motion pass on test shots.
**Approval C:** user. (After the pilot, tool tests are required only when a tool, model, or shot type is new.)

### E4 — Production by sequence *(Review per sequence)*
Deliver: keyframes → approved animated shots, source assets, version log, continuity sheets, asset registry updates.
Pass when: each shot meets its class acceptance criteria and the motion QA protocol (`animation_direction.md` §11). Reject and replace shots rather than hiding defects.
Approval: a lightweight review per sequence (hero shots first).

### E5 — Edit, mix, finish *(Bundle D)*
Deliver: locked edit; voice takes selected and cleaned; music/ambience/foley mixed; captions; glue pass; source notes and credits; master export and stems.
Pass when: no unresolved critical or major issue; mute and eyes-closed tests pass.
**Approval D:** user.

### E6 — QA, series update, archive
Deliver: QA report (`templates/qa_report.md`) with scorecard; final master; project files, prompts, references, take logs, licenses, evidence ledger, changelog; updated Series Bible, glossary, open-loop ledger, variation matrix, and series memory; series audit if the episode is 5, 10, or 15.
Pass when: ≥ 85/100, no hard blocker, history sign-off, user release approval. No automatic publication.

---

## Pacing the whole series
- **Pilot first.** Complete Episode 1 through E6, then lock Series Bible v1.0 and fold in what the pilot taught (tool choices, reliable recipes, narrator settings).
- **Waves.** After the pilot, work in waves (for example episodes 2–4, 5–8, …). Within a wave, research and treatments can be batched; **scripts are written in order** so the curiosity chain and open loops stay coherent; production can run in parallel.
- **Approvals per episode after the pilot:** typically A, B, C (light), D → four sign-offs, not eight.
- **Fast lane for single tasks.** If the user wants just one artifact (a hook, a prompt, a revision), skip gates that do not apply, but never skip the hard constraints or the evidence link.

## Stop rules
Stop and ask the user when: a key claim is disputed with no resolution; a depiction needs a real person's face; a license is unclear; two approaches have materially different historical implications; a tool needs private material uploaded; the user's instruction would breach a hard constraint (explain the conflict and offer the closest safe alternative).
