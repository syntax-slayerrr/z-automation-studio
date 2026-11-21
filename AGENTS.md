# Z-Automation Studio — Universal AI Agent Directives (`AGENTS.md`)

File ini dibaca otomatis oleh **Antigravity**, **OpenAI Codex**, **Gemini CLI**, **OpenCode**, dan agen AI kompatibel lainnya.
Seluruh style video di studio ini telah dikemas menjadi **8 Master Video Style Skills** di dalam [`.agents/skills/`](file:///d:/PROJECTS/z-automation-studio/.agents/skills/) yang siap dijalankan hanya dengan **1 kalimat prompt (Ramah Orang Awam / Zero-Code Mode)**.

---

## Aturan Emas untuk Semua AI Agent (Mode Orang Awam / 1-Prompt Workflow)

1. **Otonom Penuh dari Nol Sampai `.mp4`**:
   - Ketika pengguna meminta pembuatan video dengan topik apa pun (walaupun hanya 1 kalimat singkat), **JANGAN** menyuruh pengguna menulis kode sendiri.
   - Baca `SKILL.md` yang sesuai di `.agents/skills/<nama-skill>/SKILL.md`, lalu kerjakan secara end-to-end:
     1. Tulis naskah berantai penuh rasa penasaran memakai skill `.agents/skills/brutal-storyteller/SKILL.md`.
     2. Buat voice-over (ElevenLabs `eleven_v4` / Cartesia `sonic-3` dari `.env`), SFX *tactile* (`eleven_text_to_sound_v3` + CC0), dan musik latar berlisensi Mixkit mastered ke **`-14.8` s.d. `-14.5 LUFS`**.
     3. Bangun komponen visual 2D/3D pure-code di `remotion/videos/<slug>/` + daftarkan di `remotion/Root.tsx` (dan `remotion/entry-<slug>.ts` untuk 3D).
     4. Render **Contact Sheet QA (12–16 frame)** dan audit visualnya memakai tool pembaca gambar (`read_file`) untuk memastikan **0 bug fisika/clipping, 0 teks terpotong, 0 blank frame, dan seamless loop presisi**.
     5. Render video final `.mp4` menggunakan sistem chunked anti-OOM (`--gl=angle --concurrency=1`), mux audio master, verifikasi `ffprobe`, lalu bersihkan folder temp (`out/chunks`, `out/bundle`, `.tmp`).
2. **Cek `.env` dengan Ramah**:
   - Jika file `.env` belum ada atau `ELEVENLABS_API_KEY` kosong, pandu pengguna menyalin `.env.example` menjadi `.env` dan mengisi API key dengan bahasa Indonesia yang singkat dan jelas.

---

## Katalog 8 Master Video Style Skills (`.agents/skills/`)

| No | Skill ID & Path | Kapan Digunakan (Kata Kunci Trigger) | Golden Reference Code di Repo |
|---|---|---|---|
| **1** | **`3d-cutaway-explainer`**<br>`.agents/skills/3d-cutaway-explainer/SKILL.md` | *"Video bedah cara kerja 3D"*, *"gaya @gimanabisaid"*, *"3D cutaway explainer"*, *"kenapa [sawah/rel/tiang/jembatan] dibuat begini"* (`1080×1920` Full HD, Three.js Pro, **2-Bone Analytical IK `Prop-Drives-Hand`**, `Terrain-Locked Foot IK`, Custom GLSL Water & Sky, 7 Continuous Camera Sequences, **ZERO watermark**, Seamless Loop). | `remotion/videos/sawah-terasering/` (`npm run render:sawah`)<br>`remotion/videos/tiang-listrik/` (`npm run render:tiang`)<br>`remotion/videos/rel-kereta/` (`npm run render:rel`) |
| **2** | **`vintage-poster-explainer`**<br>`.agents/skills/vintage-poster-explainer/SKILL.md` | *"Gaya Danau Toba / Gunung Guntur"*, *"vintage poster explainer"*, *"2D gouache cross-section"*, *"animasi geografi / gunung api / gambut / sains bergaya poster klasik"* (`Alfa Slab One` 3D shadow, kertas cat air statis, peta `d3-geo`, kartu pos vintage loop). | `remotion/videos/gunung-guntur/` (`npm run render:guntur`)<br>`remotion/videos/gambut-history/` (`npm run render:gambut`) |
| **3** | **`twilight-parchment-docu`**<br>`.agents/skills/twilight-parchment-docu/SKILL.md` | *"Gaya Ketika Manusia Mengenal Api"*, *"Sejarah GMNI"*, *"twilight parchment documentary"*, *"dokumenter sejarah / peradaban 2D sinematik"* (indigo-amber lighting, 5-layer parallax, rig karakter SVG dengan rim-light, kartu subtitle perkamen sobek). | `remotion/videos/human-fire/` (`npm run render:humanfire`)<br>`remotion/videos/gmni-history/` (`npm run render:gmni`) |
| **4** | **`earth-24h-celestial-docu`**<br>`.agents/skills/earth-24h-celestial-docu/SKILL.md` | *"Dipadatkan jadi 24 jam"*, *"jam kosmik 24 jam"*, *"seperti Sejarah Bumi 24 Jam"* (dial jam astrolabe 24 jam berputar, zoom-in ke diorama era purba, counter waktu hidup, manusia muncul di `23:59:57`). | `remotion/videos/earth-24h/` (`npm run render:earth24h`) |
| **5** | **`cosmic-vfx-explainer`**<br>`.agents/skills/cosmic-vfx-explainer/SKILL.md` | *"Lubang hitam / black hole"*, *"astronomi / antariksa / relativitas"*, *"POV astronot"* (custom GLSL gravitational lensing & accretion disk shader, pantulan kaca helm astronot, 2 jam tangan dilatasi waktu, telemetri kosmik). | `remotion/videos/black-hole/` (`npm run render:blackhole`)<br>`remotion/kurzgesagt/` (`npm run render:kurzgesagt`) |
| **6** | **`cartoon-3d-short`**<br>`.agents/skills/cartoon-3d-short/SKILL.md` | *"Gaya stickman 2D di dunia 3D"*, *"seperti video jembatan / King Cnut / asal-usul Garut Kakarut"*, *"cerita sejarah komedi kartun 3D"* (wajib patuhi **5 Golden Rules Stickman**: kunci `\|blob\|` multiply shadow, koordinat kepala deterministik `hc=312.2`, plang `1.0-2.2m`, 3-tier crowd, QA contact sheet). | `remotion/videos/bridge/`<br>`remotion/videos/cnut/`<br>`remotion/videos/kakarut/` (`npm run render:kakarut`) |
| **7** | **`ipm-premium-documentary-studio`**<br>`.agents/skills/ipm-premium-documentary-studio/SKILL.md` | *"Serial dokumenter sejarah IPM"*, *"dokumenter arsip & peta sejarah Indonesia"* (`1080×1920`, ukiran kayu/gouache arsip, peta `d3-geo`, `evidence_ledger.csv` anti-fakta karangan). | `ipm-chronicles/` (`npm run ipm:render:ep01`)<br>`remotion/videos/historical-diorama/` (`npm run render:diorama`) |
| **8** | **`saas-product-promo`**<br>`.agents/skills/saas-product-promo/SKILL.md` | *"Video promo aplikasi / SaaS / website"*, *"launch video"*, *"demo UI produk"* (3 sub-gaya: `explainer-default` UI walkthrough, `explainer-engaging` continuous one-take workflow, `explainer-high-energy` beat-locked 3D tech hype reel). | `remotion/compositions/ZAutomationLaunch.tsx` (`npm run render:reel`)<br>`remotion/compositions/ZAutomationSquarePromo.tsx` (`npm run render:square`) |

---

## Skill Pendukung Otomatis (Selalu Tersedia di `.agents/skills/`)
- **`brutal-storyteller`**: Mesin penulis naskah, hook 3 detik pertama, dan *Rantai Jawab-Tanya* agar retensi penonton tinggi.
- **`real-sound`** & **`sound-effects`**: Pencarian musik berlisensi, foley presisi frame, anti-masking EQ, sidechain ducking, dan mastering broadcast (`-14.8 LUFS`).
- **`caption-animation`** & **`kinetic-typography`**: Subtitle karaoke word-by-word & tipografi animasi.
- **`map-animation`**: Animasi peta GeoJSON / `d3-geo` bergaya Vox.
- **`rea-video`**: Reverse-engineering / bedah anatomi video referensi baru menjadi rencana kloning 1:1.

---

## Perintah Penting Studio
- **Live Preview di Browser (Port 3000)**: `npm run studio`
- **Cek TypeScript (Wajib 0 Error)**: `npm run typecheck` (`npx tsc --noEmit`)
- **Render Tiap Style**: Lihat daftar lengkap `"scripts"` di [package.json](file:///d:/PROJECTS/z-automation-studio/package.json).
