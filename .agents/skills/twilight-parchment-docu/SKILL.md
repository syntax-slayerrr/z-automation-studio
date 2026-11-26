---
name: twilight-parchment-docu
description: >-
  Illustrated Documentary Animation Engine (v2.0) for Anthropology & Human History,
  Evolution & Natural History, and Biology & Human Science (9:16 vertical 1080x1920 /
  720x1280 or 16:9 landscape 1920x1080, 30 fps, Remotion + Hybrid Python Painterly
  Gouache Engine + Expressive Scientific Vector Illustration Kits). Combines the
  tactile FBM gouache paper mottling, volumetric light shafts, and paper-cut shadow-box
  depth of "Sejarah Bumi Dipadatkan Jadi 24 Jam" (earth-24h/src/painterly_fx.py) with
  expressive colored illustrated characters (faces, eyes, emotions, era outfits),
  scientific cross-sections & diagrams (Kurzgesagt × Kok Bisa? clarity), shot-level
  visual storytelling (micro-to-macro zoom, cross-section reveal, morphing, before-after
  split, match-cut), ElevenLabs eleven_v4 Indonesian narration with pronunciation
  verification, and -14.5 LUFS broadcast sound design. Also supports legacy
  "twilight-silhouette" mode for backward compatibility.
---

# Illustrated Documentary Animation Engine (`twilight-parchment-docu` v2.0)
*(Specialized for: **Sejarah Antropologi, Evolusi, dan Biologi**)*

## Quickstart (1-Prompt atau Storyboard Lengkap)
Ketika pengguna meminta pembuatan video dokumenter edukasi tentang **Antropologi / Sejarah Manusia**, **Evolusi / Sejarah Alam**, atau **Biologi / Neurosains / Sains Manusia** (mis. *"Buatkan animasi dokumenter tentang..."* atau memberikan naskah/storyboard multi-scene):

1. **Gunakan Mode Default Baru `visualMode: "illustrated-science"`**:
   - **Tekstur & Kedalaman (`earth-24h` DNA)**: Gunakan engine `scripts/painterly_engine/painterly_fx.py` (`PIL + NumPy + SciPy`) untuk membuat layer latar, awan/kanopi, tanah/strata, dan atmosfer bertekstur **cat gouache (`apply_gouache_mottle`)** dengan **bayangan fisik *paper-cut shadow-box*** dan *volumetric light shafts* — ditambah filter tekstur gouache di Remotion agar permukaan vektor tidak pernah terlihat rata/plastik.
   - **Karakter Manusia & Hominid Berwarna Ekspresif**: Gunakan `IllustratedCharacterRig` dari `remotion/lib/illustrated-docu/` (memiliki wajah, mata berkedip, arah lirikan pupil, alis ekspresif, mulut, warna kulit hangat, dan pakaian detail sesuai periode sejarah/budaya/modern — **bukan** siluet hitam/ungu tanpa wajah, kecuali pada shot metafora/bayangan spesifik).
   - **4 Sistem Ilustrasi Ilmiah (`remotion/lib/illustrated-docu/`)**:
     - **A. Human & Cultural (`AnthropologyIllustrationKit`)**: Rekonstruksi lingkungan sejarah, pakaian/artefak sesuai era, peta migrasi `d3-geo` bertekstur, aktivitas sosial & ritual.
     - **B. Biological & Anatomical (`BioIllustrationKit`)**: Irisan organ & otak multi-lobus (*cross-section*), jaringan neuron & sinapsis, sel eukariotik berorganel, heliks DNA, mikroorganisme & proses fisiologis.
     - **C. Evolutionary (`EvolutionIllustrationKit`)**: Perbandingan morfologi/tengkorak antarspesies, perubahan bertahap (*morph*), pohon percabangan evolusi (*cladogram*), timeline geologi & seleksi alam.
     - **D. Environmental (`EnvironmentIllustrationKit`)**: Rekonstruksi ekosistem, lapisan tanah & fosil stratigrafi, perubahan iklim purba, siklus alam.
2. **DILARANG Keras Menjadikan `remotion/kurzgesagt/VectorAstro.tsx` Sebagai Acuan**:
   - File `remotion/kurzgesagt/` adalah kode lama bergaya kartun neon kasar yang **tidak** merepresentasikan Kurzgesagt maupun Kok Bisa?. Selalu mengacu pada tekstur `earth-24h` (`f_60.png`, `f_270.png`, `f_480.png`, `f_780.png`) dan komponen `remotion/lib/illustrated-docu/`.

---

## Hard Non-Negotiable Rules
1. **Tactile Gouache Texture + Paper-Cut Depth**: Setiap scene wajib memadukan layer tekstur *gouache mottle* + *shadow-box cast shadow* (via `scripts/painterly_engine/painterly_fx.py` dan/atau `GouacheTextureFilter` di `remotion/lib/illustrated-docu/`) dengan elemen animasi SVG/Canvas programatik.
2. **Zero `#000` / `#fff` & Domain-Specific Palettes**: Jangan mengunci semua topik di satu warna ungu gelap. Pilih palet domain dari `remotion/lib/illustrated-docu/palettes.ts` (*Anthropology Warm Terracotta-Indigo*, *Biology Cellular Teal-Coral-Amber*, *Evolution Savanna Ochre-Emerald*, atau *Neuro/Cosmos Deep Sapphire-Gold*).
3. **Shot-Level Visual Storytelling (Anti-Monoton)**:
   - Jangan menjadikan 1 scene = 1 gambar statis dengan *fade* berulang.
   - Pecah setiap scene menjadi **2–4 shot dinamis** sesuai perubahan informasi menggunakan teknik bervariasi: *cross-section reveal*, *micro-to-macro scale zoom*, *before-and-after split comparison*, *exploded view*, *morphing*, *tracking parallax*, dan *animated diagram callouts* (`references/storytelling-and-shots.md`).
4. **Kontinuitas Karakter & Akurasi Ilmiah Natural**:
   - Kunci karakter (`characterId`, proporsi, fitur wajah, pakaian, palet) dan lingkungan (`environmentId`) di `<slug>/art-bible.json` sehingga karakter yang muncul kembali di scene berikutnya tidak berubah desain.
   - Bedakan secara jujur lewat narasi dan label visual antara **fakta ilmiah mapan**, **temuan eksperimen spesifik** (mis. badge `Studi: Hobson et al., 2017`), dan **rekonstruksi artistik/metafora visual** — tanpa perlu birokrasi file CSV yang kaku.
5. **Audio-First Narration, Pronunciation Shield & `-14.5 LUFS` Master**:
   - Ikuti [`references/audio-and-pronunciation.md`](./references/audio-and-pronunciation.md): ElevenLabs `eleven_v4` (`Brian`), tempo dokumenter natural (`1.10..1.18`), pelindung akronim Bahasa Indonesia (`applyTextNormalization: "off"` + wajib dengar langsung via `read_file` pada MP3), SFX `eleven_text_to_sound_v3` + skor musik (Oppenheimer-style chamber strings / Kurzgesagt synth pulse / Kok Bisa? acoustic wonder) ter-master di **`-14.5 LUFS`** Stereo & Mono.

---

## End-to-End Production Workflow

### Phase 0 — Art Bible, Domain Palette & Shot Plan
1. Baca [`references/style-bible.md`](./references/style-bible.md) dan [`references/storytelling-and-shots.md`](./references/storytelling-and-shots.md).
2. Salin [`templates/art-bible.template.json`](./templates/art-bible.template.json) ke `<slug>/art-bible.json`. Tetapkan:
   - `visualMode`: `"illustrated-science"`
   - `domain`: `"anthropology" | "evolution" | "biology" | "hybrid"`
   - Daftar `characters` (ID, pakaian era, palet, ekspresi) & `environments` (ID, palet langit/tanah, sumber cahaya)
   - Rencana **Shot Breakdown per Scene** (memastikan variasi teknik visual & kamera).

### Phase 1 — Audio-First Voiceover, Score & Broadcast Mix
1. Sintesis VO ElevenLabs `eleven_v4` + `alignment.json` + `remotion/videos/<slug>/story.ts` + 9 SFX `eleven_text_to_sound_v3`.
2. **Audio Spot-Check Gate**: Dengarkan langsung (`read_file`) setiap beat yang memuat istilah ilmiah/biologi/antropologi.
3. Bangun master audio (`public/<slug>/audio_master.m4a`, `-14.5 LUFS` Stereo & Mono) + `audio_qa_sheet.png`.

### Phase 2 — Hybrid Gouache Layer Build & Vertical Slice Gate (Scenes 1–2)
1. Jalankan skrip Python `painterly_engine` (`<slug>/scripts/build_painterly_layers.py`) untuk menghasilkan layer latar *gouache mottle* & *shadow-box* (`public/<slug>/layers/*.png`).
2. Bangun komponen scene memakai `remotion/lib/illustrated-docu/` (`IllustratedCharacterRig`, `BioIllustrationKit`, `EvolutionIllustrationKit`, `AnthropologyIllustrationKit`, `TransitionsAndMotion`).
3. Render **4–6 vertical-slice stills** (Scenes 1–2) dan audit via `read_file`: pastikan tekstur gouache terasa kaya (setara `earth-24h`), wajah & ekspresi karakter terbaca jelas, dan anatomi/proporsi akurat.

### Phase 3 — Full Multi-Shot Production & Quality Gate (`≥ 85/100`)
1. Selesaikan seluruh scene dengan transisi bermotivasi dan visualisasi ilmiah konkret.
2. Cek TypeScript (`npx tsc --noEmit 2>&1 | Select-String "<slug>"` → `0` error).
3. Render **16–18 frame Pre-Flight Contact Sheet** mencakup setiap shot utama dan evaluasi dengan **7 Parameter Quality Gate** di [`references/storytelling-and-shots.md`](./references/storytelling-and-shots.md) (Target **`≥ 85/100`**). Perbaiki setiap kekurangan visual sebelum render video penuh.

### Phase 4 — Resumable Chunk Render & Final Broadcast QA
Ikuti [`references/render-and-qa.md`](./references/render-and-qa.md):
1. Render dalam chunk ~350–400 frame dengan 2 auto-retry + mux H.264 `bt709` + `-c:a copy`.
2. Verifikasi langsung pada MP4 final: `ffprobe`, Stereo & Mono `ebur128` (`-14.5 LUFS`), *decoded contact sheet* 15 frame via `read_file`, dan *spot-listen* audio dari MP4 akhir, lalu bersihkan `.chunks/.bundle/.tmp`.
