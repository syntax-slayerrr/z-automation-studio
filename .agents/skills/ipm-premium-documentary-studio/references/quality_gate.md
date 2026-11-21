# Quality Gate & Release Rubric

Quality is judged at two levels: **each episode** and **the series as a whole**. A weighted score never overrides a hard blocker.

## Hard blockers (automatic FAIL)
- Material historical error, or an unsupported claim or implication presented as fact.
- Fake archival material presented, or likely to be mistaken, as genuine.
- Fabricated quote, identity, likeness, meeting action, or document.
- Unlicensed or prohibited asset (image, music, SFX, voice, font).
- Severe identity drift or broken motion in a hero shot.
- Unintelligible narration, clipping, missing audio, or major sync failure.
- Incorrect names, dates, subtitles, or organizational terms.
- Misleading visual that contradicts the evidence.
- Export corruption, wrong aspect ratio, or major technical defect.
- **Manufactured suspense:** a hook or ending that promises something the episode does not deliver, or implies a secret or conflict the evidence does not support.

## Weighted score (100)
Script, animation, and sound are the foundation of quality and carry the largest weights. Historical integrity is also protected by the hard blockers and a separate sign-off, so its weight is not the only safeguard.

| Category | Points | What it covers |
|---|---:|---|
| Script and curiosity | 20 | Central question, hook, ladder, turn, payoff, spoken Indonesian, variation vs the series |
| Animation and performance | 20 | Believable acting and motion, identity and continuity, hero-shot quality, absence of AI tells |
| Sound and voice | 15 | Narrator consistency and performance, sound design, music, mix, mute/eyes-closed tests |
| Historical integrity | 20 | Evidence mapping, truth classes, handling of uncertainty (separate sign-off required) |
| Art direction and cinematography | 15 | Look lock adherence, composition, camera, lighting, vertical craft |
| Edit, captions, finishing | 10 | Rhythm, sync, caption accuracy, glue pass, technical delivery |

## Release threshold
- Total **≥ 85/100**.
- No category below **70%** of its available points.
- All hard blockers cleared.
- Historical integrity reviewed and signed off separately.
- User approval before any publication or external distribution.

## Review passes
1. **Story pass:** does it make sense without visuals? Is the loop opened and paid?
2. **History pass:** is every claim and implication supported?
3. **Visual pass:** does each shot have a purpose and premium execution?
4. **Continuity pass:** do characters, spaces, props, and time stay coherent?
5. **Motion pass:** is movement believable and artifact-free (real-time, 0.25×, contact sheet)?
6. **Audio pass:** is the voice clear and consistent; is the sound purposeful?
7. **Mute pass:** does it work with sound off (captions on)?
8. **Eyes-closed pass:** does it work as audio alone?
9. **Mobile pass:** legible and compelling at phone size, outside UI zones?
10. **Repetition pass:** run `scripts/script_lint.py` (with `--series-dir`) and `scripts/series_audit.py`; fix repeated phrases, hooks, structures, endings.
11. **Final pass:** does the whole episode feel like one directed film, and does it belong to the series?

## Revision protocol
For every defect: assign an issue ID and severity (critical / major / minor); identify root cause; identify the affected shot or asset; propose the smallest effective correction; regenerate only what is necessary; recheck continuity and adjacent edits; record before/after and final status. Fix the *cause* (for example, the writing, not the voice setting; the shot design, not the grade).

## Scorecard output
Report the score by category with evidence for each score, blockers, revisions made, remaining risks, and a release recommendation. Never inflate a score to reach the target.

## Series-level audit (episodes 5, 10, 15)
- Variation matrix and open-loop ledger pass `scripts/series_audit.py`.
- Cross-episode phrase and opener repetition is within limits.
- Look, narrator, and sound identity are consistent (contact sheet and 10-second opener reel).
- Terminology, dates, and names are consistent with the Series Bible; earlier corrections are applied.
- Every loop opened has been, or is scheduled to be, closed.
