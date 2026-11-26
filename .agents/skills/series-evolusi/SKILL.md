---
name: series-evolusi
description: >-
  Produce a 100% pure-code 3D Anatomical X-Ray, Diagnostic Medical Instrument &
  Human Evolution Documentary Short Series (1080x1920 Full HD 9:16 vertical,
  45-65s, 30 fps, Remotion + Three.js / React Three Fiber + Procedural Canvas2D
  Ultrasound/Scanner + d3-geo Cartography) reverse-engineered 1:1 frame-by-frame
  and stem-by-stem from the viral "Suku Bajo: Evolusi Limpa Penyelam Laut"
  reference video. Features dark matte silhouette human rigs with directional
  biome rim-light, Expanding Spherical Boolean 3D X-Ray Cutaways (revealing
  translucent amber cavity, 14-vertebra spine, 10-pair 3D ribcage, reference
  organ, and glowing evolved hero organ), Right-Edge Caliper/Depth Ruler with
  sliding gold indicator, Holographic Counter-Prop X-Out ("Tanpa tabung
  oksigen"), 1.5px crisp white callout lines with hollow target rings, Live
  B-Mode Golden Rayleigh Speckle Ultrasound/Diagnostic Screens (with +50%
  expansion, stacked Control vs Evolved comparison, clinical +...+ caliper
  trace, and Speckle-Particle Metaphor Morph), physiological organ contraction +
  streaming 3D biconcave red blood cells, Bioluminescent Coastline d3-geo Maps,
  3D Ball-and-Stick Double-Helix DNA with central H-bond gap & floating DOF
  A-T-C-G letters, zero-box optical Blur-Word Montserrat typography with gold
  keywords, and a harmonic-tuned A-minor (<480 Hz dark marimba/kalimba ostinato +
  sub-bass + E7 2638Hz medical sonar pings + C8-D9 crystalline DNA chimes +
  warm baritone VO) mastered to -14.3 LUFS with a seamless loop ending. Use
  whenever the user invokes /series-evolusi, asks for "episode selanjutnya seri
  evolusi", "style suku bajo", "video evolusi manusia X-ray & DNA", or any
  human biological/genetic adaptation documentary short.
---

# `/series-evolusi` — 3D Anatomical X-Ray, Scientific Instrument & Human Evolution Series Engine

Skill Master #15 hasil **forensic frame-by-frame (`1.494 frames @ 30 fps`) & stem-by-stem (`vocals.wav`, `music.wav`, `effects.wav`, FFT `20 Hz – 20 kHz`) reverse-engineering** terhadap video referensi *Suku Bajo: Evolusi Limpa Penyelam Laut* (`49.80s`, `9:16`, `-14.1 LUFS`).

Seluruh komponen visual dan instrumen ilmiahnya **telah dikodekan siap pakai** di [`remotion/lib/series-evolusi/`](file:///d:/PROJECTS/z-automation-studio/remotion/lib/series-evolusi/), dilengkapi *scaffolder* 1-perintah `npm run init:evolusi`.

> [!IMPORTANT]
> **HUKUM BESI `1:1 STYLE ≠ COPY-PASTE STORYBOARD` (Wajib untuk Semua Episode!):**
> - Yang **1:1 terkunci lintas episode** adalah **Style, Shader, Instrumen & Audio**: siluet gelap matte ber-*rim-light*, kupasan *Spherical Boolean 3D X-Ray*, tipografi `BlurWordCaption` `Montserrat` 0-kotak ber-highlight emas `#F6AD2B`, `RightScaleRuler`, `ScientificCalloutLine ○`, estetika monitor diagnostik espresso *Rayleigh speckle* + kaliper `+ · · · +` + morf metafora, peta bioluminesensi `d3-geo`, Heliks Ganda DNA 3D, finale siluet pendar organ emas, serta skor `< 480 Hz` A-minor + ping `E7` + kaskade DNA `C8–D9`.
> - Yang **WAJIB 100% ORISINAL SESUAI TOPIK & KATA KERJA NARASI** adalah **Storyboard, Blocking/Pose Aksi Karakter, Lingkungan 3D, Transisi Habitat, dan Isi Organ di Layar Diagnostik**:
>   - **Pose Wajib Mengilustrasikan Kata Kerja Narasi:** Jika narasi *"mendaki tebing es"*, karakter **wajib benar-benar memanjat dinding tebing es terjal** (kaki menjejak pijakan es, lutut menekuk, tangan menancapkan kapak es ke dinding es, tali terikat di tebing, ransel gunung) — **JANGAN** mendaur ulang pose melayang miring seperti penyelam!
>   - **Transisi Sesuai Habitat:** Gelombang permukaan air (`WaterlineBreachWipe` biru laut) **HANYA** untuk episode laut (Bajo, Moken). Episode gunung/daratan wajib memakai **tirai kabut/badai salju alpine, kepulan debu sabana, atau *CloudCurtainPortal*** yang natural!
>   - **Isi Layar Diagnostik Wajib Akurat dengan Narasi:** Jangan biarkan kontur limpa kacang muncul jika narasi membahas sel otot, paru-paru, lensa mata, atau sel darah merah! Pilih `organType` yang cocok di `<DiagnosticUltrasoundScreen organType="muscle_capillary" | "spleen" | "lung_alveoli" | "eye_lens" />`.

---

## Quickstart (Cara Pakai Mudah untuk Episode Selanjutnya)

Pengguna cukup mengetik `/series-evolusi` diikuti topik (atau meminta ide episode baru):
> *"`/series-evolusi` buatkan Episode 2 tentang kenapa Suku Sherpa nggak kehabisan napas di puncak Everest"*
> *"`/series-evolusi` buatkan episode tentang anak-anak Suku Moken yang bisa melihat tajam di bawah air tanpa kacamata"*

*(Jika pengguna memanggil `/series-evolusi` tanpa menyebut topik spesifik, tawarkan pilihan terbaik dari 10 riset evolusi nyata di [`references/episode-production-playbook.md`](./references/episode-production-playbook.md), lalu langsung eksekusi begitu dipilih!)*

---

## 1. DNA Visual, Transisi & 8 Instrumen Wajib (1:1 Fidelity)

Baca rincian teknis lengkap di [`references/forensic-rea-frame-by-frame.md`](./references/forensic-rea-frame-by-frame.md) dan [`references/instruments-and-sound-bible.md`](./references/instruments-and-sound-bible.md):

| Pilar / Instrumen | Modul Reusable (`remotion/lib/series-evolusi/`) | Spesifikasi Wajib 1:1 | Larangan Keras |
|---|---|---|---|
| **1. Pengukur Skala/Kedalaman Tepi Kanan** | `<RightScaleRuler indicatorProgress={...} />` | Posisi `x = 93.8%`, `6` garis mayor putih + `4` sub-garis minor per ruas + indikator panah segitiga emas `◀` (`#F5B841`) yang bergerak mulus mengikuti kedalaman/elevasi/skala. | Jangan taruh teks menabrak area `x > 85%`. |
| **2. Siluet Manusia → Spherical Boolean 3D X-Ray** | `<AnatomicalXRayTorso3D xrayRadius={...} />` | Kulit luar siluet gelap matte (`#0D1821`) ber-*rim-light* habitat. Saat dipindai, **bola 3D (`xrayRadius: 0 → 2.4`) mengupas kulit secara melingkar (`discard;`)**, menyingkap rongga amber Fresnel, `14` ruas tulang belakang, `10` pasang tulang rusuk gading, organ pembanding koral, dan **organ evolusi emas**! | **DILARANG** sekadar memudarkan opacity seluruh badan sekaligus — wajib efek kupasan bola X-ray dari titik probe/organ! |
| **3. Hologram Alat Modern Dicoret Silang (`✕`)** | `<HolographicScubaTank3D />` | Alat bantu modern (tabung selam, tabung oksigen pendaki, dll.) tampil dalam shader Fresnel cyan aditif (`#7CF6FF`) lalu dicoret `✕` koral (`#FF6B35`) pada beat *"Tanpa [alat]..."*. | Jangan gunakan stiker 2D datar murahan di atas karakter 3D. |
| **4. Garis Tunjuk Ilmiah + Cincin Target (`○`)** | `<ScientificCalloutLine />` | Garis lurus putih tajam `2.6px` (`#F8FAFC`) dari label menuju objek, **berhenti tepat di tepi luar cincin target kecil berlubang (`○`, `r=11px`)**. | Jangan pakai panah komik tebal atau titik penuh yang menutupi detail organ/prop. |
| **5. Layar Diagnostik Ilmiah + Komparasi + Morf Metafora** | `<DiagnosticUltrasoundScreen />` | Latar cokelat espresso `#190D05` ber-grid tipis + kipas B-mode *Rayleigh speckle* emas `15 fps` + bayangan rusuk + ekspansi ukuran organ (`+50%`) + **2 layar bertumpuk (*Kontrol* vs *Populasi* ber-kaliper `+ · · · +`)** + **Morf Partikel Speckle (`organ <-> benda analogi`: `oxygen_tank | lung_sac | heart_pump | shield | battery | sweat_drop`)**, mendukung `organType`: `spleen | muscle_capillary | lung_alveoli | eye_lens | skin_sweat`! | Jangan tampilkan grafik batang PowerPoint kaku — gunakan instrumen diagnostik hidup! |
| **6. Peta Garis Pantai Bioluminesensi (`d3-geo`)** | `<BioluminescentMap2D />` + `<CloudCurtainPortal />` | Daratan hijau hutan (`#1B5B27`), laut biru dalam (`#003C72`), garis pantai dalam krem-mint (`#C2F9EC`) + pendar neon-cyan (`#1CE2FF`), masuk & keluar lewat tirai awan lembut. | Jangan gunakan peta putih polos atau pin merah generik. |
| **7. Aksi Fisiologis & Aliran Sel 3D** | `<AnatomicalXRayTorso3D organSqueeze={...} rbcFlowProgress={...} />` | Organ X-ray berkontraksi/bekerja nyata di dalam tubuh saat beraksi di habitatnya + aliran **sel darah merah 3D bikonkaf (`#E53935`)** mengalir deras di pembuluh arteri. | Jangan biarkan organ statis kaku saat narasi menjelaskan kata kerja mekanisme! |
| **8. Heliks Ganda DNA 3D + Sakelar Gen + Pendar Finale** | `<DnaDoubleHelix3D geneSwitchOffProgress={...} />` + `<MolecularDnaBackdropAndLetters />` | Dua untai *ball-and-stick* glossy **tabung lengkung mulus (`CatmullRomCurve3` + `MeshPhysicalMaterial` *clearcoat*)** (**Toska `#26C6DA`** & **Amber `#FFA726`**), pasangan basa 4 warna **terpisah celah ikatan hidrogen di sumbu tengah**, opsional animasi sakelar gen mati (`geneSwitchOffProgress: 0 → 1`), huruf `A, T, C, G` melayang dengan *optical blur* + bokeh hangat/biru, ditutup **siluet utuh dengan 1 titik pendar emas di organ evolusi** (`finaleGlowIntensity=1`)! | **DILARANG** memakai `<EffectComposer>` (rawan blank di `--gl=angle` Windows!) dan jangan pakai silinder patah-patah untuk untai DNA! |
| **9. Blender-Grade Pure-Code LookDev & DP Cinematography v3.1** | `ProceduralTextures.ts`, `StudioLightingRig.tsx`, `SculptedHuman3D.ts`, `CinematicFilmFinish` | **WAJIB 100% PURE CODE pada setiap episode (ZERO aset gambar eksternal!):** `<ThreeCanvas shadows="soft">` + `<SyntheticHdriEnvironment mood={alpine_glacier \| himalayan_daylight \| golden_sunset_deck \| dna_studio_bokeh \| summit_twilight \| forest_emerald \| savanna_heat} />` + `<VolumetricSkyBackdrop3D />` + `<fogExp2>` + tekstur PBR prosedural (`getWoodDeckPlanksPBR`, `getGlacialIcePBR`, `getSavannaEarthPBR`, `getForestBarkPBR`, `getSkinSurfacePBR` *Voronoi organic pores*, `getApeFurPBR` *combed fur*, `getBrainSulciPBR` *folded cerebral cortex*) + **anatomi manusia *unified seamless lofted*** (`createAnatomicalTorsoGeo` + `createLoftedLimbGeo`, **ZERO boneka silinder/bola sendi, ZERO duri kerucut!**) + **medan alam organik & cutaway kulit 3 lapis** + **Bahasa Kamera DP Sinematik** (`26–48°` lensa bermotivasi, bayangan jatuh lunak, transisi fisik *whip-pan*, awan FBM volumetrik, *film grain* 35mm)! | **DILARANG** memakai sudut kamera datar frontal simetris (*mugshot*) berulang-ulang, kotak/kerucut warna solid tanpa tekstur PBR, duri segitiga kasar untuk bulu, atau gambar AI eksternal! |
| **Tipografi Optical Blur-Word (0 Kotak!)** | `<BlurWordCaption />` | Font `Montserrat` (`72px` baris 1 / `56px` baris 2), putih `#F8FAFC` + kata kunci emas `#F6AD2B`, *soft shadow* saja (**ZERO pill box, ZERO stroke hitam**), masuk & keluar per kata dengan *Gaussian blur (`12px → 0px`)*, rata kiri adaptif (`top-left` / `mid-left` / `bottom-left` / *Dual-Clause Split*). | **DILARANG** memakai kapsul/kotak subtitle gelap, teks rata tengah terus-menerus, atau watermark platform! |

---

## 2. Arsitektur Instrumen Musik & Audio 1:1 (`-14.3 LUFS`)

Seluruh detail frekuensi terukur tersedia di [`references/instruments-and-sound-bible.md`](./references/instruments-and-sound-bible.md) dan sudah tertanam di generator `<slug>/scripts/build_sound_mix.py`:

1. **Aturan Emas `< 480 Hz` Musical Pocket (0% Vocal Masking!):**
   - Skor musik utama dikunci di tangga nada **`A Natural Minor` (`Am – F – G – Dm`)** dengan tempo **`86.15 BPM`** (*half-time* / **`172.3 BPM`** *16th-note pulse*).
   - **Instrumen M1 (Dark Felt-Muted Marimba / Kalimba Ostinato)** + **M2 (Sub-Bass `A2 108Hz → F2 88Hz → G2 96Hz → D2 72Hz`)** + **M3 (Warm Submerged Pad)** wajib di-*low-pass filter* lembut di **`480 Hz`**, sehingga pita suara narator bariton (**`500 Hz – 4.000 Hz`**) **100% bersih dan jernih**!
   - Beri **jeda tahan napas musik tipis (`~1.5–2.0 detik`)** tepat saat angka kontras ilmiah utama diucapkan (seperti jeda `21.2s–23.3s` pada *"sekitar 50% lebih besar"* di video referensi!).
2. **Instrumen Ilmiah & Molekuler Ditala Harmonis ke `A Minor`:**
   - **Ping Pemindai Medis (`USG / Scanner`)**: wajib ditala ke **`E7 (2.637,8 Hz)`** (kwint murni dari `A minor`), berbunyi tepat saat bola X-ray terbuka dan saat garis tunjuk mengunci organ utama.
   - **Denyut Monitor Diagnostik**: dyad lembut **`A5 (886 Hz) + C5 (520 Hz)`**, beralih ke **`D5 (593 Hz) + E5 (659 Hz)`** saat morfosis partikel speckle.
   - **Kilau Kristal Heliks Ganda DNA**: kaskade harmonik ultra-tinggi **`C8 – D9 (4.18 kHz – 9.40 kHz)`** di atas frekuensi vokal saat masuk ke adegan *"tertulis di DNA"*.
   - **Resolusi Finale**: akor hangat **`Fmaj7 / Am` (`A3–C4–F4–A4 + pendar A5 885 Hz`)** meluruh mulus ke hening (`-70 LUFS`) di detik terakhir.
3. **Narator Bariton & Pelindung Istilah Ilmiah Indonesia:**
   - Gunakan suara bariton dokumenter hangat ElevenLabs `eleven_v4` (mis. **Brian** `nPczCjzI2devNBz1zQrb` atau **Eric** `cjVigY5qzO86Huf0OWal`, `tempo: 1.10–1.14`, `~100–130 kata` untuk `50–60 detik`).
   - **WAJIB pisahkan `speakText` vs `displayText`**: kirim `"yu es ji"` untuk layar `"USG"`, `"di en ei"` untuk layar `"DNA"`, `"lima puluh persen"` untuk `"50%"`, dan **JANGAN PERNAH** menulis tag `[clear]` di `eleven_v4`!

---

## 3. End-to-End 5-Phase Workflow (Otonom dari Topik Sampai `.mp4`)

Ikuti panduan lengkap & 14-point checklist di [`references/episode-production-playbook.md`](./references/episode-production-playbook.md):

### Phase 1 — Scaffold Episode, Riset Ilmiah Asli & Naskah 8-Babak (`brutal-storyteller`)
1. Pastikan topik berpijak pada **studi evolusi manusia/biologi nyata** (sebutkan populasi, lokasi geografis nyata, tahun studi, organ, dan gen terkait).
2. Jalankan scaffolder:
   ```powershell
   npm run init:evolusi -- --slug <epXX-nama-topik> --title "<Judul Episode>" --biome <ocean_bajau|himalaya_hypoxia|savanna_endurance|arctic_cold> --ep <N>
   ```
3. Baca `.agents/skills/brutal-storyteller/SKILL.md` lalu isi penuh `<slug>/storyboard.json` mengikuti **Rumus 8-Babak Baku**:
   *(1) Anomali Fisik Tanpa Alat Modern → (2) Kampung/Habitat & Peta Bioluminesensi → (3) Tahun Riset & Spherical X-Ray Scan → (4) Komparasi Kontrol vs Populasi + Morf Metafora → (5) Mekanisme Fisiologis & Sel Darah 3D → (6) Bukti Genetik pada Non-Praktisi ("Bukan Hasil Latihan!") → (7) Tertulis di DNA → (8) Siluet Berpendar Organ & Seamless Loop*.

### Phase 2 — Audio-First Pipeline (VO Bariton + Foley Taktil + `<480 Hz` A-Minor Mix)
1. Lengkapi `<slug>/scripts/build_vo_and_sfx.mjs` untuk men-generate VO ElevenLabs `eleven_v4` (`convertWithTimestamps`, SHA-1 cache, `trimLead = aligned[0].start - 0.085s`) + diegetic foley `eleven_text_to_sound_v3` (atmosfer habitat, *through-lens whoosh*, *portal breach*, *cloud whooshes*, *organ pump*, *whip-pans*), lalu ekspor otomatis `remotion/videos/<slug>/story.ts` (berisi timing per kata untuk `<BlurWordCaption />`).
2. **QA GATE 1 (Wajib — Spot-Listen VO):** Dengarkan file MP3 di `<slug>/audio/vo_cache/` memakai `read_file` untuk memastikan pelafalan istilah sains (`USG`, `DNA`, nama gen/lokasi) 100% fasih dan natural.
3. Jalankan `<slug>/scripts/build_sound_mix.py` untuk memadukan VO + skor `<480 Hz` A-minor + ping harmonis `E7` + kaskade DNA `C8–D9` + foley presisi frame → master 2-pass ke **`-14.3 LUFS`**, `True Peak <= -1.5 dBTP` → `public/<slug>/audio_master.m4a`.

### Phase 3 — Rakit Komposisi Visual 3D/2D (`remotion/videos/<slug>/`)
1. Bangun scene episode di `remotion/videos/<slug>/` dengan mengimpor langsung instrumen dari `../../lib/series-evolusi`:
   - `AnatomicalXRayTorso3D`, `HolographicScubaTank3D`
   - `DiagnosticUltrasoundScreen`, `UltrasoundSectorScan`
   - `BioluminescentMap2D`
   - `DnaDoubleHelix3D`, `MolecularDnaBackdropAndLetters`
   - `BlurWordCaption`, `RightScaleRuler`, `ScientificCalloutLine`, `WaterlineBreachWipe`, `CloudCurtainPortal`, `DirectionalWhipBlur`
2. Tambahkan properti habitat khas episode (mis. kacamata kayu & rumah panggung untuk Suku Bajo; tebing es & bendera doa untuk Sherpa; perahu & lensa mata untuk Moken) dengan gaya *stylized 3D* bersih yang senada.
3. Buat isolated bundle entry `remotion/entry-<slug>.ts` + daftarkan komposisi di `remotion/Root.tsx` & `package.json`.

### Phase 4 — Typecheck + 16-Frame Full HD Visual QA Audit (WAJIB!)
1. Jalankan `npm run typecheck` (`npx tsc --noEmit`) → wajib **0 error**.
2. Render **16 still Full HD** mewakili seluruh 8 babak & transisi portal (`--gl=angle`, `$env:TEMP` terkunci di `D:\...\<slug>\.tmp`) → gabungkan ke `<slug>/out/qa_16_shots.jpg`.
3. **QA GATE 2 (Wajib — Inspeksi Visual via `read_file`):** Audit `qa_16_shots.jpg` + minimal 5 still hero *close-up* menggunakan **14-Point Checklist** di [`references/episode-production-playbook.md`](./references/episode-production-playbook.md) (pastikan kupasan bola X-ray bersih, kaliper `+ · · · +` terbaca, celah ikatan hidrogen DNA rapi, 0 kotak subtitle, 0 tabrakan `RightScaleRuler`, dan frame akhir nyambung mulus ke Frame 0).

### Phase 5 — Resumable Anti-OOM Chunk Render & Final Broadcast Verification
1. Jalankan `<slug>/scripts/render_<slug>_chunks.ps1` (`300 frame/chunk`, `--gl=angle --concurrency=1 --crf=18 --muted`, temp di Drive `D:`), lalu mux lossless (`-c:v copy -c:a copy -movflags +faststart -shortest`) ke **`d:\PROJECTS\z-automation-studio\videos\<slug>_evolusi.mp4`**.
2. **QA GATE 3 (Wajib):** Verifikasi langsung pada MP4 final dengan `ffprobe` + `ebur128` (`1080×1920 @ 30 fps`, `-14.3 LUFS ± 0.4`, `TP <= -1.5 dBTP`) + inspeksi decoded `4×4` storyboard (`final_mp4_storyboard_4x4.jpg`) via `read_file`, lalu bersihkan folder sementara (`out/chunks`, `out/bundle`, `.tmp`).
