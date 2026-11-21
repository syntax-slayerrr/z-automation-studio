# Agent Handoff & Multi-AI Collaboration

This project may be worked on by different AIs (and humans) over many sessions. Consistency across 15 episodes depends on a shared, written state.

## Rule 0: read before you work
At the start of every session: read `project_state.md` (the live status), the Series Bible, the variation matrix, the open-loop ledger, and the latest episode's script and ledger. If none exist, you are at gate S0: say so and start there.

## The state file
Use `templates/project_state.md`. Update it at the end of every session or gate. It records: current gate and episode; locked decisions (with version); decisions awaiting approval; blockers; what changed; next actions; file locations. A fresh AI should be able to continue from this file alone.

## Roles (one AI can play several; each role has inputs, outputs, and must-read files)
| Role | Inputs | Outputs | Must read |
|---|---|---|---|
| **Historian / researcher** | Brief, topic | Dossier, evidence ledger, depiction boundaries, search log | `historical_evidence_protocol.md` |
| **Story editor / writer** | Ledger, matrix, loops | Treatments, three-track script, narrator card, master + TTS text | `script_and_curiosity_engine.md`, `series_bible_and_arc.md` |
| **Director / DP** | Script, look lock | Shot list, hero shot cards, animatic plan | `cinematography_shot_design.md`, `art_direction_look_dev.md` |
| **Animation lead / prompter** | Shot cards, consistency kit | Keyframes, animated shots, version log | `animation_direction.md`, `ai_pipeline_and_prompting.md` |
| **Sound designer / voice producer** | Script, spotting sheet | Voice takes, music/ambience plan, mix | `sound_and_voice_design.md` |
| **Editor / finisher** | Shots, audio | Locked edit, glue pass, captions, masters | `sound_and_voice_design.md` §10–12 |
| **QA / series supervisor** | Everything | QA report, series audit, change log | `quality_gate.md` |

**Veto power:** the historian role can block any claim, shot, or line. The QA role can block release. Neither can be overridden by schedule pressure.

## Handoff package (when passing work to another AI or person)
1. Current `project_state.md`.
2. The episode folder: brief, ledger, treatment/script, shot cards, assets list.
3. A short **handoff note**: what is done, what is uncertain, what you would do next, what not to touch.
4. Pointers to relevant lines in the Series Bible (locks that must not change).

## Rules for working on someone else's work
- **Never overwrite a locked decision** (look, narrator, terminology, an approved script) without the user's approval and a change-log entry.
- **Extend, don't restart.** Keep IDs (claims, shots, assets) stable; add new IDs rather than renumbering.
- **Log every decision** with reason and date in the decision log.
- **Flag disagreements** instead of silently reversing prior choices: state what you would change and why.
- **Don't trust, verify:** re-check any historical claim or tool feature before relying on it if it is not in the ledger or dated documentation.

## Working without tools
If you cannot run scripts, search the web, or generate media, work in **document mode**: produce the documents, mark every unverified item `UNVERIFIED`, and list exactly what a tool-enabled collaborator must check (claims, pronunciations, tool features, licenses). Estimate runtime with the pace guide in the script engine and flag it for calibration.
