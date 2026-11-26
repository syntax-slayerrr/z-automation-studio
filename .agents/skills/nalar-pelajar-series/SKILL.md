---
name: nalar-pelajar-series
description: >-
  Produce Episode 2+ of the "Nalar Pelajar" (PC IPM Panawuan) 100% pure-code 3D
  Living-Clay Drama Short Series (1080x1920 9:16 vertical, 30 fps, 90-180s,
  Remotion + Three.js). Runs in Director Mode with 2 user checkpoints (1: Script
  & Storyboard; 2: 16-20 Shot QA Contact Sheet + Sound Plan before render).
  Features Wisnu as series anchor alongside rotating IPM cadres, @kacaurus x
  Pixar Living-Clay PBR LookDev, Face-Normal flush eyelids, 3D Indonesian
  viseme mouths for every speaker, 2-Bone IK Prop-Drives-Hand zero-clip grips,
  9:16 safe-zone thought bubbles, high-DPI digital UI screens, 5-Pillar Drama
  Cinematography, multi-cast ElevenLabs eleven_v4 VO, automatic licensed
  instrumental score + 15-25 living foley layers (-14.5 LUFS), and anti-OOM
  chunk rendering. Use when asked for "episode berikutnya Nalar Pelajar", "eps
  2/3 Wisnu / IPM", or a new PC IPM Panawuan 3D drama short.
---

# `nalar-pelajar-series` — *Nalar Pelajar* (PC IPM Panawuan) 3D Living-Clay Drama Production System

Skill produksi episodik **siap pakai untuk Episode 2, 3, dan seterusnya** yang menyarikan seluruh standar visual, rig karakter, sinematografi drama, dan tata suara hidup dari Episode 1 (*Nalar Pelajar: Wisnu — Berani Bertanya & 5W 1H*, `179.95s`, `1080×1920`, `-14.5 LUFS`).

---

## Overview & Series Identity

- **Format:** Vertikal `1080×1920` (9:16 Full HD), `30 fps`, durasi `90–180 detik`, 100% pure-code (`Remotion` + `Three.js` / `React Three Fiber`), output final terpusat di `d:\PROJECTS\z-automation-studio\videos\<slug>_nalar_pelajar.mp4`.
- **Format Karakter Campuran (*Ensemble Series*):**
  - **Wisnu** adalah tokoh jangkar seri (sweater rajut kuning `#FFC41E`, Pin Emblem Pentagon IPM 3D resmi, celana kargo arang, sneakers kuning-putih, rambut keriting *matte-velvet*).
  - Episode tertentu dapat **berfokus pada teman atau kader IPM lain** (laki-laki maupun perempuan/berhijab) dengan Wisnu tampil sebagai rekan diskusi/pendukung, atau Wisnu tetap jadi tokoh utama bersama tokoh pendukung baru (guru, moderator, ketua ranting, orang tua, teman kelas).
- **Audio Default (Otonom Tanpa Unggah Lagu):**
  - **Musik latar instrumental berlisensi otomatis** multi-babak (Mixkit / Studio licensed — piano intim, *tension ambient* psikologis, resolusi hangat inspiratif) + **15–25 layer foley & ambience dunia nyata** via ElevenLabs `eleven_text_to_sound_v3` & CC0, mastered 2-pass ke **`-14.5 LUFS`** (`True Peak <= -1.6 dBFS` stereo & mono).
  - *(Opsional)* Jika user sewaktu-waktu melampirkan lagu sendiri, mixer mendukung *Dynamic Vocal-Pocket Carving EQ (`900 Hz – 3.4 kHz`, `-6.5 dB`) + Mid-Side Stereo Wrap*.
- **Mode Kerja Terkunci — *Mode Sutradara* (2 Checkpoint Singkat):**
  - Agent bekerja otonom penuh per fase, dan **berhenti singkat di tepat 2 titik persetujuan user** sebelum lanjut ke tahap mahal/render penuh:
    1. **CHECKPOINT 1:** Persetujuan **Naskah Drama + Storyboard Shot-by-Shot** (`<slug>/storyboard.json` + ringkasan visual/cast).
    2. **CHECKPOINT 2:** Persetujuan **Audit Still QA 16–20 Shot (`4×4` / `4×5`) + Rencana Sound Design & Keyframe** (setelah agent loloskan *spot-listen* audio sendiri!) sebelum memulai render Full HD 18-chunk.

---

## Dependencies & Golden Reference Codebase

Skill ini **merujuk dan memakai ulang** skill & pustaka studio yang sudah terbukti di repo (jangan membangun ulang dari nol):

| Dependency / Modul | Lokasi | Peran di Workflow |
|---|---|---|
| **`brutal-storyteller`** | `.agents/skills/brutal-storyteller/SKILL.md` | Mesin naskah drama berantai (*hook* 3 detik pertama, konflik batin nyata, *Rantai Jawab-Tanya*, aksi konkret yang bisa dipraktikkan pelajar). |
| **`galeri-motion-characterflow`** | `.agents/skills/galeri-motion-characterflow/SKILL.md` | Fondasi bahasa visual Soft-Vinyl, kapsul subtitle *frosted glass* adaptif, dan aturan ANGLE WebGL. |
| **`real-sound` & `earshot`** | Global skills (`real-sound`, `earshot`) | Disiplin musik berlisensi, foley organik nyata (bukan bunyi synth murahan), anti-masking EQ, dan audit dengar langsung via `read_file`. |
| **Golden LookDev & Rig Kit (Ep.1)** | `remotion/videos/ipm-nalar-pelajar/scene3d/` | Import langsung atau jadikan acuan 1:1 untuk `LivingShaderForge.ts`, `LivingTextureForge.ts`, `OfficialIpmLogo.ts`, `WisnuCharacter3D.ts`, `DigitalUISurfaces.ts`, `StudyRoom3D.ts`, `PanawuanVillage3D.ts`, `SeminarHall3D.ts`. |
| **Golden Audio & Render Scripts (Ep.1)** | `ipm-nalar-pelajar/scripts/` | Pola paten untuk `build_vo_and_sfx.mjs`, `build_living_sfx.mjs`, `build_sound_mix.py`, `render_qa_stills.ps1`, dan `render_ipm_nalar_chunks.ps1`. |

Baca dua buku referensi teknis di folder skill ini sebelum menulis kode 3D atau audio:
- [`references/lookdev-and-rigging-bible.md`](./references/lookdev-and-rigging-bible.md) — Shader *Living-Clay v6*, kelopak mata sferis *Face-Normal Transfer*, mulut 3D *viseme* Pixar, 2-Bone IK *Prop-Drives-Hand*, dan rumus *9:16 Bubble Safe-Zone*.
- [`references/cinematography-and-sound-bible.md`](./references/cinematography-and-sound-bible.md) — 5 Pilar Sinematografi Drama, peta suara cast seri, arsitektur musik instrumental multi-babak + 15–25 foley dunia nyata, dan mixer keyframe `-14.5 LUFS`.

---

## Quick Start (Untuk Episode Baru)

Cukup beri prompt singkat:
> *"Buat Episode 2 Nalar Pelajar tentang **[topik, mis. FOMO / adab debat di grup WA / manajemen waktu pelajar / disiplin literasi]** — fokus ke **[Wisnu / nama kader IPM baru]**."*

Agent akan otomatis membuat folder episode baru (`<slug>/` dan `remotion/videos/<slug>/`) tanpa menimpa Episode 1 (`ipm-nalar-pelajar/`), lalu mengeksekusi **7 Fase Workflow** berikut.

---

## End-to-End Production Workflow (7 Phases · 2 User Checkpoints · 3 QA Gates)

### Phase 1 — Episode Concept, Script & Shot-by-Shot Storyboard
1. **Baca `brutal-storyteller/SKILL.md`**, lalu tulis naskah drama 90–180 detik berstruktur **3 Babak**:
   - **Babak I (Hook Fisik & Konflik Nyata — 0–35%):** Momen sehari-hari pelajar Indonesia yang terasa akrab (kamar malam, grup kelas, kantin, jalan kampung, kelas/masjid) + konflik batin/sosial nyata yang memuncak.
   - **Babak II (Jeda Refleksi & Metode Praktis — 35–65%):** Tarikan napas tenang → 1 kerangka berpikir/aksi konkret yang bisa langsung ditiru penonton (lengkap dengan rekonstruksi UI digital asli atau aksi makro POV nyata seperti menulis/memeriksa).
   - **Babak III (Ujian Dunia Nyata & Kemenangan Sunyi — 65–100%):** Pindah ke ruang sosial nyata (kampung, kelas, rapat ranting, aula PC IPM Panawuan) → klimaks perang batin (dolly-zoom + hening/detak jantung) → keputusan berani → penutup ethos IPM & kartu **`Nalar Pelajar`**.
2. **Tentukan Pemeran Suara & Karakter:**
   - **Narator Seri (TERKUNCI):** Eric (`cjVigY5qzO86Huf0OWal`, hangat, tenang, reflektif).
   - **Wisnu (TERKUNCI jika tampil):** Liam (`TX3LPaxmHKxFdv7VOQHJ`, pelajar muda karismatik).
   - **Moderator / Pembina (TERKUNCI jika tampil):** Brian (`nPczCjzI2devNBz1zQrb`, berwibawa + EQ ruang/PA mic).
   - **Kader/Teman Baru (per episode):** Pilih suara ElevenLabs berbeda yang sesuai gender/usia (mis. Sarah `EXAVITQu4vr4xnSDxMaL` atau Jessica `cgSgspJ2msm6clMCkdW9` untuk kader perempuan; Chris `iP95p4xoKVk53GoZ742B` untuk teman pria baru) + catat penampilan visual (pakaian, hijab/rambut, Pin IPM 3D).
3. **Buat `<slug>/storyboard.json`** menggunakan [`templates/episode-storyboard.template.json`](./templates/episode-storyboard.template.json) dan simpan ringkasan rencana produksi sebagai artifact `episode_plan.md` yang mencakup:
   - Naskah lengkap bertanda speaker & cue.
   - Daftar shot (10–14 shot utama + sub-cut OTS/Reverse-OTS), panjang lensa (`FOV 27.8°–52°`), arc pencahayaan, UI digital yang direkonstruksi, dan lokasi 3D.

> [!IMPORTANT]
> **🛑 CHECKPOINT 1 (User Approval — Pre-Production):**
> Sajikan naskah, cast karakter/suara, dan tabel storyboard kepada user. Tunggu konfirmasi singkat ("oke lanjut" / revisi naskah) sebelum men-generate audio ElevenLabs & membangun scene 3D.

---

### Phase 2 — Audio-First Pipeline: Multi-Cast VO & Alignment (`story.ts`)
1. Buat `<slug>/scripts/build_vo_and_sfx.mjs` mencontoh pola SHA-1 cache dari `ipm-nalar-pelajar/scripts/build_vo_and_sfx.mjs`:
   - Model TTS: `eleven_v4`, `languageCode: "id"`, `convertWithTimestamps`, **85ms consonant pre-roll** (`trimLead = spokenRuns[0].start - 0.085`), `END_HOLD_S = 3.2` untuk kartu penutup `Nalar Pelajar`.
   - **ATURAN KERAS TTS:** **DILARANG** memakai tag `[clear]` di `eleven_v4`! Gunakan ekspresi natural (`[warm]`, `[soft]`, `[thoughtful]`, `[hesitant]`, `[determined]`) dan akustik per konteks (`normal`, `inner`, `inner_tense`, `hall_mic`, `pa_mic`).
   - Output otomatis: `<slug>/audio/vo_master.wav`, `<slug>/audio/alignment.json`, dan `remotion/videos/<slug>/story.ts` (`SCENE_STARTS`, `CUES`, `SPEECH_SPANS`, `SUBTITLE_CHUNKS`, `WORDS`).
2. **QA GATE 1 (Wajib — Spot-Listen VO):** Dengarkan minimal 3–4 baris penting (pembuka, dialog karakter utama, dialog pendukung/PA mic, penutup) dari `<slug>/audio/vo_cache/*.mp3` memakai `read_file`. Pastikan pelafalan bahasa Indonesia natural, tidak terpotong konsonan awal, dan intonasi drama hidup.

---

### Phase 3 — Living 3D World, Characters & Cinematography Build
Bangun kode 3D episode baru di `remotion/videos/<slug>/`:
1. **Pakai Ulang Shared LookDev & Brand Forge:** Impor langsung dari `../ipm-nalar-pelajar/scene3d/` (atau ekstrak ke modul bersama jika diedit lintas episode) untuk `LivingShaderForge.ts`, `LivingTextureForge.ts`, `OfficialIpmLogo.ts`, dan `WisnuCharacter3D.ts`.
2. **Rig Karakter Baru (Jika Ada Tokoh Kader/Teman Baru):** Wajib mematuhi 4 standar baku di [`references/lookdev-and-rigging-bible.md`](./references/lookdev-and-rigging-bible.md):
   - *Living-Clay PBR* (kulit satin + pipi *radial blush* feathered tanpa cincin, rambut/hijab *matte-velvet* tanpa efek bola plastik, kain rajut/twill bertekstur, **0 outline hitam**).
   - **Kelopak Mata Sferis *Face-Normal Transfer*** (`lidSkinMat` dengan `rimStrength: 0, contourStrength: 0`, `eyeGrp.z` flush tanpa celah/bulge).
   - **Mulut 3D Artikulatif Pixar + *Indonesian Vowel/Bilabial Viseme*** (`evalSpeakerViseme` 3-frame smoothed: rongga mulut gelap, bibir halus, gigi atas gading, lidah merah muda) — **DILARANG** melar-melarkan garis torus!
   - **2-Bone Analytical IK (`solveTwoBoneIK`)** + **Prop-Drives-Hand** (tangan pegang HP, mikrofon, pulpen, buku terhubung utuh sampai bahu & tubuh; jari 2-segmen proporsional pada jarak clearance `r_prop + r_finger` → **0% clipping**).
3. **Lingkungan Indonesia Autentik & UI Digital High-DPI:**
   - Lantai teraso, dinding *wainscoting* dua warna, plafon akustik, dinding belakang tertutup lengkap (pintu, poster IPM, lampu dinding — **0 ruang kosong gelap di belakang karakter!**), kampung Indonesia ber-paving + *dappled tree gobo* jika outdoor.
   - Rekonstruksi layar HP/laptop/slide presentasi secara autentik beresolusi tinggi (`DigitalUISurfaces.ts`).
4. **Gelembung Teks 3D Strictly Inside 9:16 Safe-Zone:**
   - Hitung frustum kamera 9:16 (`halfW = D * tan(FOV/2) * 0.5625`) untuk setiap shot yang menampilkan bubble/orb agar **0% teks terpotong pinggir layar**, **0% tabrakan dengan pill subtitle atas/bawah**, dan **0% bubble tersembunyi di belakang kursi/kepala**.
5. **5-Pillar Drama Cinematography & Overlay:**
   - Implementasikan `NalarPelajar3DCanvas.tsx`-style director deterministik (`useCurrentFrame()`), `FOV 27.8°–52°`, dynamic `2048×2048` tight shadow frustum tracking, per-act synchronous `PMREM` HDRI cache, **0 `<EffectComposer>`**, plus `<SlugShort.tsx>` (adaptive frosted-glass subtitles + micro film grain + closing card resmi `Nalar Pelajar`).
6. Daftarkan komposisi di `remotion/entry-<slug>.ts`, `remotion/Root.tsx`, dan `package.json`.

---

### Phase 4 — Living Foley & Instrumental Score Sound Design
1. Buat `<slug>/scripts/build_living_sfx.mjs` untuk men-generate **15–25 layer foley & ambience dunia nyata** via `eleven_text_to_sound_v3` sesuai lokasi & aksi di `storyboard.json` (contoh: jangkrik malam, klik saklar, gesekan jari layar, goresan pulpen, tutup buku, ayam pagi kampung + langkah paving, gemuruh aula/kelas yang mengecil saat pembicara bicara, klik mic PA, hening canggung + dengung AC/batuk halus, derit kursi, detak jantung, gumaman kagum, tepuk tangan hangat).
2. Buat `<slug>/scripts/build_sound_mix.py` memakai mixer NumPy/SciPy *sample-accurate* (`44100 Hz` stereo float32) dengan:
   - **Musik Instrumental Berlisensi Multi-Babak** (Mixkit / Studio licensed, otomatis tanpa perlu unggahan lagu) yang di-keyframe halus (*raised-cosine dB curves*) + jeda hening dramatis tepat sebelum kalimat klimaks + **Zero-Phase Vocal-Pocket Dip (`900–3400 Hz`)** saat dialog.
   - Sinkronisasi foley 1:1 ke frame visual (mis. transisi outdoor → indoor tepat di frame cut, klik lampu tepat di frame nyala, derit kursi tepat saat berdiri).
   - **2-Pass Linear Broadcast Mastering** ke **`-14.5 LUFS`**, **True Peak `<= -1.6 dBFS`** (terverifikasi stereo **dan** mono!) → `public/<slug>/audio_master.m4a` + `<slug>/out/audio_qa_sheet.png` + `<slug>/out/CREDITS.txt`.
3. **Audit Dengar Internal Agent (Wajib Sebelum Checkpoint 2):** Potong 4 klip QA 20–35 detik dari `audio_master.m4a` ke `scratch/mix_qa/` dan dengarkan langsung via `read_file` untuk memastikan 0 tabrakan dialog, foley hidup alami, dan transisi hening/klimaks bersih.

---

### Phase 5 — Typecheck, 16–20 Shot Visual QA & Checkpoint 2
1. Jalankan `npm run typecheck` (`npx tsc --noEmit`) — wajib **0 error**.
2. Jalankan `<slug>/scripts/render_qa_stills.ps1` untuk membuat bundle terisolasi `<slug>/out/bundle` dan merender **16–20 still Full HD** (`--gl=angle`) + contact sheet `<slug>/out/qa_20_shots.jpg`.
3. **QA GATE 2 (Wajib — Inspeksi Visual Agent via `read_file`):** Audit `qa_20_shots.jpg` dan minimal 6 still hero close-up (kelopak mata, mulut berbicara karakter utama & pendukung, tangan makro POV + siku, posisi bubble 9:16, keterbacaan UI layar & slide, shadow kontak). Perbaiki semua cacat sebelum mempresentasikan ke user!

> [!IMPORTANT]
> **🛑 CHECKPOINT 2 (User Approval — Pre-Render):**
> Sajikan **Contact Sheet QA 16–20 Shot** (sebagai artifact review carousel/sheet) + **Ringkasan Sound Design & Keyframe** (termasuk hasil audit `-14.5 LUFS` & 4 titik dengar). Tunggu persetujuan user (atau tuntaskan revisi visual/audio yang diminta user) sebelum memulai render Full HD 18-chunk!

---

### Phase 6 — Resumable Anti-OOM Full HD Render (`1080×1920`, 30 fps)
1. Bersihkan chunk lama (`<slug>/out/chunks/*.mp4`), lalu jalankan `<slug>/scripts/render_<slug>_chunks.ps1`:
   - Lock `$env:TEMP` & `$env:TMP` ke `d:\PROJECTS\z-automation-studio\<slug>\.tmp` (Drive `D:` anti penuh Drive `C:`).
   - Reuse bundle terisolasi terverifikasi `<slug>/out/bundle` (atau `-ForceBundle` jika ada edit baru).
   - Render per **`300 frame/chunk`** (`--gl=angle --concurrency=1 --crf=18 --muted --log=error`) dengan 1× auto-retry per chunk.
   - Concat lossless FFmpeg + mux audio master `public/<slug>/audio_master.m4a` (`-c:v copy -c:a copy -movflags +faststart -shortest`) → **`d:\PROJECTS\z-automation-studio\videos\<slug>_nalar_pelajar.mp4`**.

---

### Phase 7 — GATE 3 Broadcast Verification & Temp Cleanup
1. Jalankan `ffprobe` & `ffmpeg -filter_complex "ebur128=peak=true"` langsung pada file MP4 final:
   - Video: `1080×1920`, `30 fps`, `H.264`, durasi cocok `alignment.json`.
   - Audio: `48 kHz Stereo`, **Integrated `-14.5 LUFS ± 0.5`**, **True Peak `<= -1.5 dBFS`**.
2. Inspeksi storyboard `4×4` hasil decode MP4 final (`<slug>/out/final_mp4_storyboard_4x4.jpg`) via `read_file` untuk memastikan 0 blank frame, 0 frame rusak, dan sinkronisasi utuh dari awal sampai kartu `Nalar Pelajar`.
3. Hapus seluruh folder temp render (`<slug>/out/chunks`, `<slug>/out/bundle`, `<slug>/.tmp`, `<slug>/out/concat_list.txt`) dan sajikan laporan akhir ringkas beserta link `file://` klik-langsung ke MP4 final & bukti QA.

---

## Common Mistakes (Pelajaran Keras dari Ep.1 — Wajib Dihindari!)

1. **Melar-melarkan mulut garis torus (`mod.mouth.scale.y = 2.75`)** → Terlihat seperti cacing/tapal kuda aneh. **Solusi:** Selalu bangun mulut 3D artikulatif (rongga + gigi + lidah) digerakkan *Indonesian vowel/bilabial viseme*.
2. **Lengan makro POV berupa silinder lengan bawah putus** → Siku terlihat kosong & melayang tidak menyatu ke tubuh, atau jari menembus pulpen. **Solusi:** Selalu ikat kedua lengan POV ke torso/bahu asli via `solveTwoBoneIK`, ujung lengan pakai tabung tirus terbuka (`openEnded: true`), luruskan pergelangan kiri ke sumbu lengan bawah (`+lYaw`, bukan `-lYaw`!), dan bangun tangan kanan menulis di ruang lokal pulpen (*Prop-Drives-Hand*) dengan jari 2-segmen pada jarak tepat `r_pen + r_finger`.
3. **Gelembung teks 3D terpotong pinggir/atas kamera 9:16 atau tabrakan subtitle** → Koordinat 16:9 terlalu lebar untuk potret 9:16. **Solusi:** Selalu kunci posisi bubble dalam batas `0.85 * D * tan(FOV/2) * 0.5625` dan di bawah zona pill subtitle atas (`top: 11%`).
4. **Kelopak mata terbalik / menonjol seperti mata kodok / celah di iris close-up** → **Solusi:** Pakai *Face-Normal Transfer* pada `upperLidGeo`, `lidSkinMat` tanpa rim/contour, dan `eyeGrp.z` flush di permukaan wajah.
5. **PowerShell 5.1 memakai `&&` atau `TEMP` di Drive `C:`** → Perintah gagal atau disk `C:` penuh saat render 18 chunk. **Solusi:** Selalu pakai `; if ($LASTEXITCODE -eq 0) { ... }` dan arahkan `$env:TEMP`/`$env:TMP` ke Drive `D:`.
6. **Memakai `@react-three/postprocessing` `<EffectComposer>` di `--gl=angle`** → Frame WebGL blank/crash. **Solusi:** Semua bloom, halation, volumetric beam, dan grain memakai mesh/sprite `AdditiveBlending` + CSS overlay tipis.
