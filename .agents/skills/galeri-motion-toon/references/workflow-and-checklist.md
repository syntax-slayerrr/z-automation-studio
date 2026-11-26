# `galeri-motion-toon` — Detailed Workflow Blueprint & 12-Point QA Checklist

Panduan teknis pendamping [`SKILL.md`](../SKILL.md) untuk membangun video baru bergaya **3D Cel-Toon Ink-Outline** dari nol sampai `.mp4` final di `videos/`.

---

## 1. Struktur Folder Proyek Standar

Ganti `<slug>` dengan nama singkat proyek baru (mis. `tipe-mahasiswa`, `bahaya-begadang`, `doomscrolling-ep02`):

```text
d:\PROJECTS\z-automation-studio\
├── <slug>\
│   ├── storyboard.json                      # Rencana shot, ekspresi, kamera, gelembung & SFX
│   ├── scripts\
│   │   ├── build_vo_and_sfx.mjs             # ElevenLabs eleven_v4 + Sound-V3 -> story.ts & alignment.json
│   │   ├── build_sound_mix.py               # 3-Act Score + Anti-Masking EQ + Ducking -> -14.6 LUFS
│   │   ├── render_qa_stills.ps1             # Bundle + 16 Full HD stills (--gl=angle) + qa_16_shots.jpg
│   │   └── render_<slug>_chunks.ps1         # Resumable 300-frame chunks (TEMP di D:) -> videos/<name>.mp4
│   ├── audio\
│   │   ├── vo_cache\                        # Cache MP3 & alignment per beat (SHA-1)
│   │   ├── sfx\                             # 8-10 klip SFX eleven_text_to_sound_v3
│   │   ├── vo_master.wav
│   │   └── alignment.json
│   └── out\
│       ├── qa_16_shots.jpg                  # Bukti audit 16 frame pre-render
│       ├── final_mp4_storyboard_4x4.jpg     # Bukti audit 16 frame hasil dekode MP4 final
│       ├── audio_qa_sheet.png               # Waveform & spektrogram master audio
│       └── CREDITS.txt                      # Lisensi & kredit audio lengkap
├── public\<slug>\
│   └── audio_master.m4a                     # Master audio AAC 256kbps 48kHz (-14.6 LUFS)
├── remotion\
│   ├── entry-<slug>.ts                      # Isolated single-composition entry (anti-OOM!)
│   ├── Root.tsx                             # Daftarkan <Composition> di monorepo Root
│   ├── lib\cel-toon-3d\                     # Shared engine (JANGAN duplikasi!)
│   │   ├── toonMaterials.ts
│   │   ├── ToonCharacter3D.ts
│   │   └── ComicOverlayUI.tsx
│   └── videos\<slug>\
│       ├── Root.tsx
│       ├── story.ts                         # Auto-generated dari build_vo_and_sfx.mjs
│       ├── <Slug>Short.tsx                  # Master composition (3D Canvas + Comic UI + Audio)
│       └── scene3d\
│           ├── ToonWorlds3D.ts              # 3D Cel-Toon sets, karakter & prop
│           └── <Slug>3DCanvas.tsx           # Deterministic frame-driven camera & animation director
└── videos\
    └── <nama_final>_toon3d.mp4              # OUTPUT FINAL TERPUSAT (1080x1920, 30 fps)
```

---

## 2. Urutan Perintah Eksekusi (Windows PowerShell 5.1 Safe)

### Langkah 1 — Audio-First Build & Spot-Listen
```powershell
node --env-file=.env <slug>/scripts/build_vo_and_sfx.mjs
# WAJIB: dengarkan beat-beat istilah asing/tokoh di <slug>/audio/vo_cache/*.mp3 via read_file!
python <slug>/scripts/build_sound_mix.py
```

### Langkah 2 — Typecheck + 16-Shot 3D QA Contact Sheet
```powershell
npx tsc --noEmit; if ($LASTEXITCODE -eq 0) { npm run still:<slug>-qa }
# WAJIB: buka <slug>/out/qa_16_shots.jpg & 4-6 still hero via read_file!
```

### Langkah 3 — Re-render Cepat Still yang Diperbaiki (Jika Ada Revisi QA)
```powershell
npx tsc --noEmit; if ($LASTEXITCODE -eq 0) { Remove-Item -Recurse -Force -ErrorAction SilentlyContinue "<slug>\out\bundle"; Remove-Item -Force -ErrorAction SilentlyContinue "<slug>\out\qa_stills\shot_08_*"; npm run still:<slug>-qa }
```

### Langkah 4 — Full HD Chunked Render (Anti-OOM, Temp Terkunci di Drive D:)
```powershell
npm run render:<slug>
```

### Langkah 5 — Verifikasi Final MP4 & Cleanup Temp
```powershell
$mp4 = "d:\PROJECTS\z-automation-studio\videos\<nama_final>_toon3d.mp4"
ffmpeg -nostats -i $mp4 -filter_complex ebur128=peak=true -f null - 2>&1 | Select-String -Pattern "Integrated loudness:|I:|True peak:|Peak:"
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue "<slug>\out\chunks","<slug>\out\bundle","<slug>\.tmp","<slug>\out\concat_list.txt"
```

---

## 3. Cheat Sheet Kamera 9:16 (`1080×1920`, `fov = 42`)

Karena aspek rasio vertikal sangat sempit secara horizontal (`width/height = 0.5625`), selalu ikuti panduan jarak & tinggi kamera berikut:

| Tipe Shot | Jarak Kamera (`dz`) | `camPos.y` | `camLook.y` | Catatan Safe Area |
|---|---|---|---|---|
| **Reaction Close-Up (1 Karakter)** | `2.0 – 2.5 m` | `1.80 – 1.98` | `1.52 – 1.62` | Pastikan dahi/rambut tetap di bawah `NumberedBeatPill` (`y > 345px`). |
| **Two-Shot (Tokoh + Prop / Teman)** | `3.8 – 4.6 m` | `1.72 – 1.95` | `1.48 – 1.56` | Letakkan dua subjek di `x ≈ -0.55` dan `x ≈ +0.55` (bentang total `≤ 1.5m`). |
| **Hero Prop Showcase (Slot / Otak / HP)** | `3.3 – 4.2 m` | `1.65 – 1.85` | `1.52 – 1.65` | Beri ruang atas agar `TopSignBanner` tidak memotong puncak prop. |
| **Wide Bedroom / Morning Desk Finale** | `2.3 – 3.2 m` | `2.05 – 2.25` | `1.28 – 1.38` | Area bawah (`bottom 180..420px`) bersih untuk kartu closing / subtitle. |

---

## 4. 12-Point Mandatory Pre-Render QA Gate Checklist

Sebelum menjalankan `render_<slug>_chunks.ps1`, pastikan **semua 12 poin** lulus saat inspeksi visual lewat `read_file`:

- [ ] **1. Cel-Shading Murni:** Bayangan tajam 3-step, warna kartun hidup (`THREE.NoToneMapping`), nol kesan kusam atau blur PBR.
- [ ] **2. Black Ink Outlines Utuh:** Setiap kepala, badan, lengan, tangan, kaki, rambut, dan prop utama terbungkus outline hitam `#0F1016` yang konsisten.
- [ ] **3. Orientasi Pakaian Depan (`+Z`):** Dasi, resleting hoodie, kemeja, dan blazer berada tepat di bagian dada depan (`chest.rotation.y = Math.PI`).
- [ ] **4. Wajah & Rambut Bersih:** Mata, alis, kacamata, dan mulut 100% terlihat jelas; tidak ada rambut atau topi yang menutup mata/wajah.
- [ ] **5. Ekspresi Dinamis:** Ekspresi wajah karakter berubah sesuai emosi cerita (`tired`, `shocked`, `happy`, `squint`, `stressed`, `thinking`).
- [ ] **6. Zero Clipping Tangan & Prop:** Tangan memegang HP/gelas/tuas dengan rapat tanpa menembus permukaan atau melayang jauh.
- [ ] **7. Teks Prop 3D Tegak & Terbaca:** Semua tulisan pada papan tulis, layar HP, jam digital, dan drum silinder tidak terbalik 180° atau terpotong.
- [ ] **8. Safe Area 9:16 Atas:** Tidak ada kepala karakter atau judul papan 3D yang tertutup `TopSignBanner` atau `NumberedBeatPill` (`top 96..335px`).
- [ ] **9. Safe Area 9:16 Bawah:** `CelToonSubtitles` dan gelembung komik bawah tidak saling bertumpuk.
- [ ] **10. Pelafalan VO Bersih:** Beat dengan istilah asing/nama tokoh/angka sudah didengarkan via `read_file` (nol salah ucap, nol dehem `[clear]`).
- [ ] **11. Audio Master Broadcast:** `audio_master.m4a` terukur `-14.5` s.d. `-14.8 LUFS` (Stereo & Mono) dan True Peak `<= -1.5 dBFS`.
- [ ] **12. Keamanan Disk & Output:** Temp chunk render terkunci di Drive `D:` dan output final diarahkan ke `videos/<nama_final>_toon3d.mp4`.
