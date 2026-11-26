---
name: galeri-motion-toon
description: Produce a 100% pure-code 3D Cel-Toon Ink-Outline Cartoon Short (1080x1920 Full HD or 720x1280 9:16 vertical, 30 or 60 fps, Remotion + Three.js / React Three Fiber) reverse-engineered 1:1 from the viral "Tipe-Tipe Pengendara Motor" (galeri-motion-tipikal.mp4) style. Features crisp 3-step NearestFilter MeshToonMaterial cel-shading (ZERO painterly/PBR mush), bold uniform Inverted-Hull BackSide black ink outlines on every character and hero prop, faceted low-poly Indonesian everyday 3D environments with hard sun shadows and black-white striped kerbs, chunky stylized 3D characters with high-res Canvas2D animated expressive cartoon faces (neutral, happy, shocked, squint, tired, stressed, thinking), floating diegetic comic speech/emote bubbles (?, !, JACKPOT!, CIIIIT!), crisp Street-Sign Top Banner + sliding Numbered Pill with crimson keyword highlights, ElevenLabs eleven_v4 energetic VO + bespoke Sound-V3 foley mastered to -14.6 LUFS. Use whenever the user asks for "style galeri motion", "tipe-tipe pengendara motor", "cel-toon 3D ink outline", "kartun 3D outline hitam", or any vibrant 3D cel-shaded cartoon short.
---

# `galeri-motion-toon` — 3D Cel-Toon Ink-Outline Cartoon Production Skill

Skill Master #11 hasil **forensic reverse-engineering (`rea-video`)** dari referensi `galeri-motion-tipikal.mp4` (`Made with Remotion 4.0.539`, Three.js Cel-Toon 3D) dan telah **terbukti penuh pada produksi Full HD `1080×1920`**: [`videos/sehat_ep02_doomscrolling_toon3d.mp4`](file:///d:/PROJECTS/z-automation-studio/videos/sehat_ep02_doomscrolling_toon3d.mp4).

---

## Quickstart 1-Prompt Mode (Ramah Orang Awam)
Pengguna cukup mengetik 1 kalimat:
> *"Buatkan video gaya **`galeri-motion-toon`** tentang **[topik komedi / edukasi / tipe-tipe / sains / kebiasaan sehari-hari]**"*

**Aturan Otonom untuk AI Agent:**
- Jalankan **5 Fase Workflow** di bawah secara berurutan dari naskah sampai `.mp4` final di `videos/<slug>_toon3d.mp4` tanpa menyuruh pengguna menulis kode.
- Jangan lewati **Gerbang Audit QA** (spot-listen VO + inspeksi visual 16-shot contact sheet via `read_file`) sebelum render chunk final!

---

## 1. Forensic Visual DNA (Wajib 1:1 — Kontras Total dari Painted Gouache 3D)

| Elemen | Spesifikasi Wajib | Larangan Keras (Anti-Slop!) |
|---|---|---|
| **Shading & Tekstur** | `THREE.MeshToonMaterial` + **3-step `NearestFilter` `DataTexture` cel-ramp** (`[118, 202, 255]`) + `<ThreeCanvas gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}>` | **DILARANG** memakai PBR roughness/gouache blur atau `ACESFilmicToneMapping` (bikin warna kartun jadi kusam!). |
| **Black Ink Outlines** | **Inverted-Hull `THREE.BackSide` Outline Mesh** (`#0F1016`, tebal `0.018–0.036m`) pada **setiap bagian karakter & prop utama** lewat `makeToonMesh()` / `addInkOutline()`. | Jangan biarkan karakter atau prop penting tampil polos tanpa garis tinta hitam. |
| **Wajah Kartun 3D Ekspresif** | Kepala 3D bulat (`SphereGeometry`) + Canvas2D `512×512` curved front face decal dengan **7 ekspresi**: `neutral`, `happy`, `shocked`, `squint`, `tired`, `stressed`, `thinking` + blink & eye-scan. | Jangan pakai muka datar statis; wajib ganti ekspresi mengikuti emosi tiap kalimat VO! |
| **Lingkungan Low-Poly** | Pohon `IcosahedronGeometry(..., 1).toNonIndexed()` + `computeVertexNormals()` (tajam *faceted*), ruko warna cerah, **kanstin hitam-putih Indonesia**, bayangan matahari keras (`2048×2048`). | Jangan pakai `flatShading: true` pada properti JSX `MeshToonMaterial` (error TS) — gunakan `.toNonIndexed()`. |
| **Packaging UI Komik** | **Top Street-Sign Banner** (`TopSignBanner`, warna hijau `#146B3A` / indigo `#1E3A5F` / merah `#991B1B` + garis putih dalam) + **Sliding Numbered Pill** (`NumberedBeatPill`, `[ 1 ]` lingkaran merah + kata kunci merah) + **Gelembung Komik** (`ComicBubblePopup`) + **Subtitle Komik** (`CelToonSubtitles`). | Jangan pasang watermark TikTok/handle atau membiarkan kepala tokoh ketutup plang atas (`y = 0..340px`). |

---

## 2. Reusable Engine & Golden Reference di Repository

### Shared Library (Langsung Import — Jangan Tulis Ulang!)
1. [`remotion/lib/cel-toon-3d/toonMaterials.ts`](file:///d:/PROJECTS/z-automation-studio/remotion/lib/cel-toon-3d/toonMaterials.ts)
   - `getCelGradientMap(steps)` — 2-step / 3-step `NearestFilter` cel ramp
   - `createToonMaterial(color, opts)` — pabrik `MeshToonMaterial`
   - `addInkOutline(mesh, thickness, color)` — Inverted-Hull `BackSide` ink outline
   - `makeToonMesh(geometry, color, opts)` — buat mesh + shadow + ink outline sekaligus
   - `createIndonesianKerbTexture(repeatX)` — tekstur kanstin hitam-putih jalanan Indonesia
   - `createTorsoGarmentTexture(style, baseColor)` — tekstur `hoodie`, `skinner_tweed`, `lembke_blazer`, `casual_tee`
   - `createComicLabelTexture(lines, opts)` — papan tanda / layar HP / label prop 3D tajam
2. [`remotion/lib/cel-toon-3d/ToonCharacter3D.ts`](file:///d:/PROJECTS/z-automation-studio/remotion/lib/cel-toon-3d/ToonCharacter3D.ts)
   - `buildToonCharacter(cfg)` — rig artikulasi lengkap (`hips`, `torso`, `head`, `left/rightShoulder`, `left/rightElbow`, `left/rightHip`, `left/rightKnee`) + `setExpression(expr, blink, eyeLookX)`
   - Preset rambut (`messy_short`, `skinner_1957`, `lembke_wavy`) & kacamata 3D (`none`, `round_1957`, `rect_modern`)
3. [`remotion/lib/cel-toon-3d/ComicOverlayUI.tsx`](file:///d:/PROJECTS/z-automation-studio/remotion/lib/cel-toon-3d/ComicOverlayUI.tsx)
   - `TopSignBanner`, `NumberedBeatPill`, `ComicBubblePopup` (`speech` | `circle` | `burst` | `badge`), `CelToonSubtitles`

### Golden Reference Production (Salin Strukturnya!)
- **3D Scenes & Composition:** [`remotion/videos/doomscrolling-ep02/`](file:///d:/PROJECTS/z-automation-studio/remotion/videos/doomscrolling-ep02/) (`DoomscrollingEp02Short.tsx`, `scene3d/ToonWorlds3D.ts`, `scene3d/Doomscrolling3DCanvas.tsx`, `Root.tsx`, `story.ts`)
- **Isolated Bundle Entry:** [`remotion/entry-doomscrolling.ts`](file:///d:/PROJECTS/z-automation-studio/remotion/entry-doomscrolling.ts)
- **Pipeline Scripts:** [`doomscrolling-ep02/scripts/`](file:///d:/PROJECTS/z-automation-studio/doomscrolling-ep02/scripts/) (`build_vo_and_sfx.mjs`, `build_sound_mix.py`, `render_qa_stills.ps1`, `render_doomscrolling_chunks.ps1`)

---

## 3. End-to-End 5-Phase Production Workflow

Detail lengkap struktur folder, resep perintah PowerShell, dan checklist QA 12-poin ada di [`references/workflow-and-checklist.md`](./references/workflow-and-checklist.md) dan template storyboard di [`templates/storyboard.template.json`](./templates/storyboard.template.json).

### Phase 0 — Konsep, Naskah (`brutal-storyteller`) & Storyboard
1. Gunakan skill `brutal-storyteller` untuk menyusun naskah Indonesia yang lincah, penuh *pattern interrupt*, dan dibagi menjadi **4–7 segmen bernomor** (opsional: 3 detik Intro judul/kredit + 1–2 tokoh berpengaruh/karakter ikonik).
2. Buat `<slug>/storyboard.json` dari [`templates/storyboard.template.json`](./templates/storyboard.template.json) berisi:
   - Daftar segmen bernomor (teks plang + kata kunci warna merah)
   - Variasi sudut kamera 3D (*Establishing High-Angle*, *Medium CU*, *OTS*, *Two-Shot Tokoh*, *Top-Down*, *Hero Pull-Back Finale*)
   - Ekspresi wajah karakter per beat + gelembung komik (`?`, `!`, onomatope) + daftar 8–10 SFX taktil/komik.

### Phase 1 — Audio-First Pipeline (VO + Bespoke SFX + 3-Act Score)
1. Buat `<slug>/scripts/build_vo_and_sfx.mjs` (salin pola `doomscrolling-ep02/scripts/build_vo_and_sfx.mjs`):
   - Model TTS: ElevenLabs `eleven_v4` (`convertWithTimestamps`, `languageCode: "id"`, SHA-1 cache per beat).
   - Suara energik/conversational (contoh: **Liam** `TX3LPaxmHKxFdv7VOQHJ`, `TEMPO = 1.18–1.24`).
   - Pakai sintaks `[[cue_id]]Tampilan|Pelafalan` untuk singkatan/istilah asing (mis. `HP|hape`, `Dr.|Dokter`, `B.|Be F.|Ef`).
   - **ATURAN EMAS TTS:** **JANGAN pernah pakai tag `[clear]`** di `eleven_v4` (bisa membuat narator berdehem *"ehem"*!). Pakai `[steady]`, `[conversational]`, `[energetic]`, `[confident]`, `[warm]` + `trimLead = aligned[0].start - 0.08s`.
   - Generate 8–10 SFX via `eleven_text_to_sound_v3` → ekspor otomatis `remotion/videos/<slug>/story.ts` dan `<slug>/audio/alignment.json`.
2. **GATE 1 (Wajib):** Dengarkan langsung beat-beat kunci di `<slug>/audio/vo_cache/*.mp3` memakai `read_file` untuk memastikan 0 salah ucap & 0 suara napas/dehem.
3. Buat & jalankan `<slug>/scripts/build_sound_mix.py`:
   - Gabungkan VO + 3-Act Music Score berlisensi Mixkit (anti-masking EQ + sidechain ducking) + SFX ElevenLabs + CC0 accents (`.agents/skills/sound-effects/sfx/`).
   - Two-pass linear broadcast mastering ke **`-14.6 s.d. -14.7 LUFS`** (Stereo & Mono), **True Peak `<= -1.5 dBFS`** → `public/<slug>/audio_master.m4a` + `<slug>/out/audio_qa_sheet.png` + `CREDITS.txt`.

### Phase 2 — Bangun Dunia 3D Cel-Toon & Overlay UI
1. Buat `remotion/videos/<slug>/scene3d/ToonWorlds3D.ts`:
   - Rakit 2–4 set 3D modular memakai `makeToonMesh()`, `buildToonCharacter()`, `createTorsoGarmentTexture()`, `createComicLabelTexture()`, dan `createIndonesianKerbTexture()`.
2. Buat `remotion/videos/<slug>/scene3d/<Slug>3DCanvas.tsx`:
   - Gunakan `<ThreeCanvas shadows camera={{ fov: 42, near: 0.1, far: 60 }} gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}>`.
   - Kontrol kamera **secara sinkron & deterministik dari `frame`** lewat `const { camera } = useThree()` (JANGAN pakai `useFrame` stateful lerp atau `<perspectiveCamera makeDefault />`!).
3. Buat `remotion/videos/<slug>/<Slug>Short.tsx`:
   - Gabungkan `<Audio>`, `<Canvas 3D>`, `TopSignBanner`, `NumberedBeatPill`, `ComicBubblePopup`, dan `CelToonSubtitles`.
4. Daftarkan di **2 tempat**:
   - Isolated single-composition entry: `remotion/entry-<slug>.ts` + `remotion/videos/<slug>/Root.tsx` (anti-OOM bundle ~5 detik!)
   - Monorepo root & `package.json`: daftarkan `<Composition>` di `remotion/Root.tsx` dan tambahkan script `still:<slug>-qa` & `render:<slug>` di `package.json`.

### Phase 3 — Typecheck + 16-Shot Full HD QA Visual Audit (WAJIB!)
1. Jalankan `npx tsc --noEmit` — wajib **0 error**.
2. Jalankan `<slug>/scripts/render_qa_stills.ps1` (dengan `$env:TEMP`/`$env:TMP` diarahkan ke `D:\...\<slug>\.tmp` dan flag `--gl=angle`) untuk menghasilkan 16 still Full HD + contact sheet `4×4` (`<slug>/out/qa_16_shots.jpg`).
3. **GATE 2 (Wajib):** Inspeksi `qa_16_shots.jpg` + minimal 4–6 still hero resolusi penuh via `read_file`:
   - Cek 0 clipping tangan/prop, 0 kepala/teks ketutup `TopSignBanner`/`NumberedBeatPill` (`y < 340px`), 0 rambut menutupi wajah, 0 teks terbalik/miring pada prop silinder, 0 kemeja/dasi menghadap belakang!
   - Perbaiki seluruh temuan QA, re-render still yang berubah, dan verifikasi ulang lewat `read_file` sampai 100% bersih.

### Phase 4 — Chunked Anti-OOM Render & Broadcast Verification
1. Jalankan `<slug>/scripts/render_<slug>_chunks.ps1`:
   - **Kunci `$env:TEMP` & `$env:TMP` ke Drive `D:`** (`<slug>\.tmp`) agar Drive `C:` tidak pernah penuh (`ENOSPC`)!
   - Reuse bundle terverifikasi, render per **300 frame/chunk** dengan `--gl=angle --concurrency=1 --crf=18 --muted` (otomatis *resumable* & retry).
   - Lossless FFmpeg concat + mux `-c:v copy -c:a copy -movflags +faststart` ke folder terpusat **`d:\PROJECTS\z-automation-studio\videos\<nama-video>.mp4`**.
2. **GATE 3 (Wajib):**
   - Verifikasi `ffprobe` (`1080×1920`, `30 fps`, H.264, durasi pas) + `ebur128` langsung pada `.mp4` final (`-14.5` s.d. `-14.8 LUFS`, `True Peak <= -1.5 dBFS`).
   - Inspeksi decoded `4×4` storyboard (`<slug>/out/final_mp4_storyboard_4x4.jpg`) via `read_file` (pastikan 0 blank frame).
   - Bersihkan folder temp (`<slug>/out/chunks`, `<slug>/out/bundle`, `<slug>/.tmp`, `concat_list.txt`) dan sisakan file bukti audit (`qa_16_shots.jpg`, `final_mp4_storyboard_4x4.jpg`, `audio_qa_sheet.png`, `CREDITS.txt`).

---

## 4. Golden Rules Anti-Bug (Hard-Won Three.js & Windows Gotchas!)

1. **Orientasi Tekstur Torso (`CylinderGeometry`):** Pada Three.js, `u = 0.5` menghadap `-Z`. Selalu pasang `chest.rotation.y = Math.PI` agar resleting hoodie, dasi, kemeja, & blazer menghadap tepat ke depan (`+Z`).
2. **Orientasi Label Drum/Roda Horizontal (`rotation.z = Math.PI / 2`):** Saat melukis teks Canvas2D untuk silinder horizontal (mis. drum mesin slot), gunakan `ctx.rotate(Math.PI / 2)` (bukan `-Math.PI / 2`) agar tulisan tegak lurus tidak terbalik 180°.
3. **Rambut Panjang Karakter 3D:** Jangan pakai silinder terbuka mengelilingi kepala — rawan menutup wajah! Pakai `SphereGeometry` di belakang (`z = -0.16`) + dua `CapsuleGeometry` di sisi kiri/kanan (`x = ±0.28`).
4. **Framing Sempit 9:16 (`fov = 42`):** FOV horizontal hanya ~24°. Jarak kamera aman:
   - Close-up 1 karakter + prop: `z ≈ 2.0–2.5m`, `lookAt.y ≈ 1.55m`
   - Two-shot (Tokoh + Prop/Papan/Teman): `z ≈ 3.8–4.6m`, `lookAt.y ≈ 1.50m`, jarak horizontal antar subjek `≤ 1.15m`
   - Pastikan area atas (`0..340px`) dan bawah (`1580..1920px`) lega untuk UI Banner & Subtitle.
5. **Windows PowerShell 5.1:** Jangan pernah pakai `&&` di command shell! Selalu rangkai perintah memakai `; if ($LASTEXITCODE -eq 0) { ... }`.
