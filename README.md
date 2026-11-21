# Z-Automation Studio — Pure-Code AI Video Production Suite & Universal Agent Skills

**Z-Automation Studio** adalah studio produksi video animasi **100% Pure-Code** (berbasis **Remotion + Three.js / React Three Fiber + Custom GLSL Shaders + D3-Geo + SVG + ElevenLabs Audio Mastering Pipeline**) yang telah dikemas menjadi **8 Master Video Style Skills** lintas AI Agent.

Dirancang agar **bahkan orang awam (tanpa perlu menulis kode)** cukup membuka project ini di **Antigravity**, **Claude Code**, **Cursor**, **Windsurf**, atau **OpenAI Codex**, lalu mengetik **1 kalimat topik** untuk menghasilkan video `.mp4` siap upload (`1080×1920` / `720×1280`, `30/60 fps`, audio broadcast `-14.8 LUFS`, seamless loop).

> **Baru pertama kali memakai studio ini?** Baca **[PANDUAN-AWAM.md](./PANDUAN-AWAM.md)** untuk daftar **Prompt 1-Kalimat Siap Copy-Paste**!

---

## Katalog 8 Master Video Style Skills (`.agents/skills/`)

| # | Nama Skill | Gaya Visual & Karakteristik Utama | Contoh Project di Repo | Perintah Render Cepat |
|---|---|---|---|---|
| **1** | **[`3d-cutaway-explainer`](./.agents/skills/3d-cutaway-explainer/SKILL.md)** | **Blender-Grade 3D Cutaway & 2-Bone Analytical IK Rig** (`1080×1920` Full HD, `Prop-Drives-Hand` zero clipping, `Terrain-Locked Foot IK`, Custom GLSL Water & Cumulus Sky, 7 Continuous Camera Sequences, Seamless Loop, ZERO watermark). | [`remotion/videos/sawah-terasering/`](./remotion/videos/sawah-terasering/)<br>[`remotion/videos/tiang-listrik/`](./remotion/videos/tiang-listrik/)<br>[`remotion/videos/rel-kereta/`](./remotion/videos/rel-kereta/) | `npm run render:sawah`<br>`npm run render:tiang`<br>`npm run render:rel` |
| **2** | **[`vintage-poster-explainer`](./.agents/skills/vintage-poster-explainer/SKILL.md)** | **2D Gouache Travel-Poster & Cross-Section Explainer** (tekstur kertas cat air statis, outline tinta sepia, judul `Alfa Slab One` 3D block shadow, cutaway geologi, peta `d3-geo`, kartu pos vintage loop). | [`remotion/videos/gunung-guntur/`](./remotion/videos/gunung-guntur/)<br>[`remotion/videos/gambut-history/`](./remotion/videos/gambut-history/) | `npm run render:guntur`<br>`npm run render:gambut` |
| **3** | **[`twilight-parchment-docu`](./.agents/skills/twilight-parchment-docu/SKILL.md)** | **2D Atmospheric Twilight Parchment Documentary** (pencahayaan indigo-ke-emas, 5-layer depth parallax, rig karakter SVG dengan rim-light & bayangan api, kartu subtitle perkamen sobek). | [`remotion/videos/human-fire/`](./remotion/videos/human-fire/)<br>[`remotion/videos/gmni-history/`](./remotion/videos/gmni-history/) | `npm run render:humanfire`<br>`npm run render:gmni` |
| **4** | **[`earth-24h-celestial-docu`](./.agents/skills/earth-24h-celestial-docu/SKILL.md)** | **24-Hour Celestial Clock & Deep-Time Diorama** (jam astrolabe kosmik 24 jam berputar, zoom-in ke lanskap era geologi, live rolling counter, kemunculan manusia di `23:59:57`). | [`remotion/videos/earth-24h/`](./remotion/videos/earth-24h/) | `npm run render:earth24h` |
| **5** | **[`cosmic-vfx-explainer`](./.agents/skills/cosmic-vfx-explainer/SKILL.md)** | **First-Person Astrophysics GLSL Shader & Visor POV** (raymarched gravitational lensing, Doppler accretion disk, pantulan kaca helm astronot, 2 jam tangan dilatasi waktu). | [`remotion/videos/black-hole/`](./remotion/videos/black-hole/)<br>[`remotion/kurzgesagt/`](./remotion/kurzgesagt/) | `npm run render:blackhole`<br>`npm run render:kurzgesagt` |
| **6** | **[`cartoon-3d-short`](./.agents/skills/cartoon-3d-short/SKILL.md)** | **2D Stickman / Bean-Head Cartoon in 3D World** (karakter kartun 2D ekspresif ber-outline tinta di dalam dunia/kota 3D penuh warna, kamera meluncur, musik march/komedi). | [`remotion/videos/bridge/`](./remotion/videos/bridge/)<br>[`remotion/videos/cnut/`](./remotion/videos/cnut/)<br>[`remotion/videos/kakarut/`](./remotion/videos/kakarut/) | `npm run render:kakarut` |
| **7** | **[`ipm-premium-documentary-studio`](./.agents/skills/ipm-premium-documentary-studio/SKILL.md)** | **Editorial Archival Woodcut/Gouache & Animated Cartography Series** (`1080×1920`, peta `d3-geo` sejarah Indonesia, `evidence_ledger.csv` anti-hoaks sejarah). | [`ipm-chronicles/`](./ipm-chronicles/)<br>[`remotion/videos/historical-diorama/`](./remotion/videos/historical-diorama/) | `npm run ipm:render:ep01`<br>`npm run render:diorama` |
| **8** | **[`saas-product-promo`](./.agents/skills/saas-product-promo/SKILL.md)** | **Commercial SaaS, App & 3D Tech Launch Videos** (3 sub-varian: `explainer-default` UI walkthrough, `explainer-engaging` one-take hero workflow, `explainer-high-energy` beat-locked hype reel). | [`remotion/compositions/ZAutomationLaunch.tsx`](./remotion/compositions/ZAutomationLaunch.tsx) | `npm run render:reel`<br>`npm run render:square` |

---

## Kompatibilitas Lintas AI Coding Agent

Repository ini sudah dilengkapi file instruksi jembatan sehingga seluruh skill di `.agents/skills/` otomatis dikenali oleh berbagai AI Agent tanpa setup tambahan:

- **Google Antigravity / OpenAI Codex / Gemini CLI / OpenCode**: Membaca [`AGENTS.md`](./AGENTS.md) & [`.agents/skills/`](./.agents/skills/) secara native.
- **Claude Code**: Membaca [`CLAUDE.md`](./CLAUDE.md) → otomatis diarahkan ke `.agents/skills/`.
- **Cursor IDE**: Membaca [`.cursorrules`](./.cursorrules) → otomatis diarahkan ke `.agents/skills/`.
- **Windsurf IDE**: Membaca [`.windsurfrules`](./.windsurfrules) → otomatis diarahkan ke `.agents/skills/`.

---

## Instalasi & Cara Mulai Cepat (3 Langkah)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/syntax-slayerrr/z-automation-studio.git
cd z-automation-studio
npm install
```

### 2. Konfigurasi API Key (`.env`)
Salin `.env.example` menjadi `.env`, lalu isi `ELEVENLABS_API_KEY` kamu:
```bash
cp .env.example .env
```

### 3. Buka di AI Agent & Ketik 1 Kalimat Prompt (atau Buka Live Studio)
- **Untuk Membuat Video Baru dengan AI Agent**: Buka **[PANDUAN-AWAM.md](./PANDUAN-AWAM.md)**, salin contoh prompt style yang kamu suka, dan kirimkan ke AI Agent!
- **Untuk Membuka Remotion Live Preview Studio (`http://localhost:3000`)**:
  ```bash
  npm run studio
  ```
- **Untuk Memeriksa Validitas TypeScript (`0 Error`)**:
  ```bash
  npm run typecheck
  ```

---

## Struktur Direktori Utama

```text
z-automation-studio/
├── .agents/skills/               # 8 Master Video Style Skills + Skill Pendukung (brutal-storyteller, real-sound, dll.)
├── remotion/
│   ├── Root.tsx                  # Registrasi seluruh komposisi video studio
│   ├── entry-sawah.ts            # Isolated entry anti-OOM untuk render 3D Full HD (Sawah Terasering)
│   ├── entry-tiang.ts            # Isolated entry anti-OOM untuk render 3D (Tiang Listrik)
│   └── videos/                   # Kode sumber 2D/3D/GLSL untuk setiap style video
│       ├── sawah-terasering/     # V6 Flagship 3D Cutaway + 2-Bone Analytical IK (1080x1920)
│       ├── tiang-listrik/        # V5 3D Cutaway Village Infrastructure
│       ├── rel-kereta/           # V4 3D Cutaway Railway Ballast & Thermal Gap
│       ├── gunung-guntur/        # 2D Vintage Poster Explainer (Volcano & Atlas)
│       ├── gambut-history/       # 2D Vintage Poster Explainer (Peatland Carbon)
│       ├── human-fire/           # 2D Twilight Parchment Documentary (Ancient Fire)
│       ├── gmni-history/         # 2D Twilight Parchment Documentary (National History)
│       ├── earth-24h/            # 24-Hour Celestial Clock Documentary
│       ├── black-hole/           # Cosmic GLSL Raymarching & Astronaut Visor POV
│       ├── bridge/               # Cartoon 3D Short (Broughton Suspension Bridge)
│       ├── cnut/                 # Cartoon 3D Short (King Cnut vs The Tide)
│       └── kakarut/              # Cartoon 3D Short (Asal-Usul Garut)
├── sawah-terasering/             # Script VO/SFX, mix audio -14.8 LUFS, chunk renderer & QA storyboards
├── ipm-chronicles/               # Workspace terisolasi untuk 15-Episode IPM Historical Documentary Series
├── AGENTS.md                     # Direktif utama AI Agent (Antigravity / Codex / Gemini CLI)
├── CLAUDE.md                     # Direktif jembatan untuk Claude Code
├── .cursorrules                  # Direktif jembatan untuk Cursor IDE
├── .windsurfrules                # Direktif jembatan untuk Windsurf IDE
└── PANDUAN-AWAM.md               # Panduan lengkap bahasa Indonesia + Template Prompt 1-Kalimat
```
