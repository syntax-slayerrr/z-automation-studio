# IPM — Premium Animated Historical Documentary Studio
**Skill package v3.0 — integrated series system (15 episodes)**

One system for making a serialized, historically grounded, premium 3D animated documentary about Ikatan Pelajar Muhammadiyah (IPM). It is written to be picked up by *any* capable AI or human crew at any point in the project.

## North star
> Penonton harus merasa sedang menyaksikan film dokumenter sejarah yang dihidupkan melalui animasi — bukan presentasi sejarah yang diberi efek 3D.

## Locked direction
Premium realistic-stylized 3D · human characters · historical documentary (not promotion) · 60–120 s per episode · vertical 9:16 · Indonesian narration for ElevenLabs, one narrator for all 15 episodes · flexible AI toolchain chosen per shot.

## What v3 adds
- **Series layer:** Series Bible, 15-episode arc by narrative function, variation matrix, open-loop ledger, series memory, series audits.
- **Three pillars as the quality foundation:** script and curiosity engine; animation direction (performance, motion recipes, failure diagnosis); sound and voice design (narrator lock, spotting, mix).
- **Integrated three-track writing** (Voice | Picture | Sound) and the **Premium Test**.
- **Tools:** `scripts/script_lint.py` (runtime, rhythm, banned/overused phrases, cross-episode repetition) and `scripts/series_audit.py` (variation and loop rules).
- **Multi-AI handoff:** `workflows/agent_handoff.md` and `templates/project_state.md`.
- Rebalanced QA weights (script 20, animation 20, sound 15, history 20 + separate sign-off, art/camera 15, edit/finish 10).

## Package map
- `SKILL.md`: entry point, pillars, router (task → file), Premium Test.
- `references/`: series_bible_and_arc · script_and_curiosity_engine · animation_direction · sound_and_voice_design · cinematography_shot_design · art_direction_look_dev · historical_evidence_protocol · ai_pipeline_and_prompting · quality_gate.
- `workflows/`: production_pipeline (series + episode gates) · agent_handoff · START_HERE (prompts for the user).
- `templates/`: series_bible, project_state, episode_brief, script_and_shot_breakdown, shot_card, sound_spotting_sheet, character_environment_bible, tool_evaluation, qa_report, evidence_ledger.csv, variation_matrix.csv, open_loops.csv.
- `scripts/`: script_lint.py, series_audit.py (Python 3, standard library only).

## Start
Open `workflows/START_HERE.md` and use prompt 1 (Series mode). Do not generate final video before the research dossier, Series Bible, script, and shot plan are approved.

## Non-negotiable
Never fabricate historical facts, quotations, identities, archival materials, or evidence. Generated reconstruction is never presented as genuine archive. A beautiful but misleading shot fails. Curiosity must come from real gaps, never manufactured suspense.
