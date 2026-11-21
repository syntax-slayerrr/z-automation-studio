# Hollywood Storyboard Director — AI Agent Skill

**Version:** 1.0.0  
**Format:** Claude-style `SKILL.md` bundle  
**Primary use:** Script-to-storyboard direction for premium animation and cinematic video production.

## What this skill changes

The agent is instructed to act as a director and storyboard supervisor—not a prompt paraphraser. It diagnoses the script, defines dramatic intent, designs visual beats, stages characters and objects, selects motivated camera language, tracks continuity, plans animation, and produces a usable production handoff.

## Default profile

The skill includes a default direction for a premium realistic-stylized historical IPM animated series (1–2 minute episodes, flexible hybrid production). These are defaults, not hard-coded restrictions. The skill can adapt to other projects and formats.

## Package structure

```text
hollywood-storyboard-director/
├── SKILL.md
├── README.md
├── references/
│   ├── directorial-thinking.md
│   ├── visual-storytelling.md
│   ├── camera-and-composition.md
│   ├── animation-direction.md
│   ├── historical-integrity.md
│   ├── continuity-and-editing.md
│   ├── production-workflow.md
│   └── quality-gates.md
├── templates/
│   ├── storyboard-template.md
│   ├── sequence-breakdown-template.md
│   ├── shot-prompt-template.md
│   └── production-handoff-template.md
└── examples/
    └── illustrative-scene.md
```

## Installation

### Claude Code / Agent skills-compatible setup

1. Extract this ZIP.
2. Place the folder `hollywood-storyboard-director` in the agent's skills directory.
3. Ensure the agent can read the complete folder, including `references/` and `templates/`.
4. Ask the agent to use the `hollywood-storyboard-director` skill when creating a storyboard.

A common project-local layout is:

```text
your-project/
└── .claude/
    └── skills/
        └── hollywood-storyboard-director/
            ├── SKILL.md
            ├── references/
            └── templates/
```

For another agent platform, copy the entire folder into its supported skill / instruction directory and register `SKILL.md` as the entry point. Do not copy only `SKILL.md`; the references and templates provide the detailed operating system.

## Suggested invocation

> Gunakan skill `hollywood-storyboard-director`. Bedah naskah yang gue kirim, tentukan directorial intent dan visual beats, lalu buat storyboard animasi yang production-ready. Pertahankan fakta dan teks narasi. Jangan bikin shot generik atau menerjemahkan setiap kalimat menjadi gambar literal. Target durasi dan format mengikuti brief proyek.

## Important behavior

- The agent should not invent historical facts or present reconstructed dialogue as a verified quotation.
- It should not rewrite a supplied script unless asked.
- It should not generate an image prompt before the shot's dramatic purpose and composition are decided.
- It should flag assumptions and production risks instead of pretending they are resolved.
