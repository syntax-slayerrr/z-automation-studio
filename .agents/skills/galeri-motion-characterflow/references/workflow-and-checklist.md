# `galeri-motion-characterflow` — Production Blueprint, PBR Recipes & 12-Point QA Checklist

Panduan implementasi teknis pendamping [`SKILL.md`](../SKILL.md) untuk membangun video baru bergaya **3D Soft-Vinyl / Toy-Clay Character-Flow**.

---

## 1. Struktur Folder Proyek Standar

```text
d:\PROJECTS\z-automation-studio\
├── <slug>\
│   ├── storyboard.json                      # Rencana shot, lighting arc, bubble density, POV writing & SFX
│   ├── scripts\
│   │   ├── build_vo_and_sfx.mjs             # ElevenLabs eleven_v4 (warm empathetic voice) + Sound-V3 -> story.ts
│   │   ├── build_sound_mix.py               # Ambient Piano + Tactile Foley -> -14.5 LUFS Stereo & Mono
│   │   ├── render_qa_stills.ps1             # Bundle + 16 Full HD stills (--gl=angle) + qa_16_shots.jpg
│   │   └── render_<slug>_chunks.ps1         # 300-frame chunks (TEMP di D:) -> videos/<name>_charflow.mp4
│   ├── audio\
│   │   ├── vo_cache\                        # Cache MP3 & alignment per beat (SHA-1)
│   │   ├── sfx\                             # 7-10 tactile foley SFX (lamp click, bubbles, pen write, exhale)
│   │   ├── vo_master.wav
│   │   └── alignment.json
│   └── out\
│       ├── qa_16_shots.jpg
│       ├── final_mp4_storyboard_4x4.jpg
│       ├── audio_qa_sheet.png
│       └── CREDITS.txt
├── public\<slug>\
│   └── audio_master.m4a
├── remotion\
│   ├── entry-<slug>.ts                      # Isolated single-composition entry (anti-OOM!)
│   ├── Root.tsx                             # Daftarkan <Composition> di monorepo Root
│   ├── lib\soft-vinyl-3d\                   # Shared reusable Soft-Vinyl PBR engine (buat saat proyek pertama)
│   │   ├── vinylMaterials.ts                # Soft-Vinyl skin, glossy hair, clay cotton, frosted orbs, ruled paper
│   │   ├── VinylCharacter3D.ts              # 3D eyelids, glossy eyes, 5-finger capsule hands, expressive rig
│   │   └── GlassSubtitleOverlay.tsx         # Adaptive top/bottom frosted-glass pill subtitles
│   └── videos\<slug>\
│       ├── Root.tsx
│       ├── story.ts
│       ├── <Slug>Short.tsx
│       └── scene3d\
│           ├── CozyRoom3D.ts                # Single-room 3D set + practical lamp + thought bubbles + POV notebook
│           └── <Slug>3DCanvas.tsx           # Frame-driven camera, lighting emotion arc & animation director
└── videos\
    └── <nama_final>_charflow.mp4            # OUTPUT FINAL TERPUSAT (1080x1920, 30 fps)
```

---

## 2. Resep PBR Soft-Vinyl / Toy-Clay (`vinylMaterials.ts`)

| Material | Type | Color / Texture | `roughness` | `metalness` | `clearcoat` | Catatan Kunci |
|---|---|---|---|---|---|---|
| **Kulit Karakter** | `MeshPhysicalMaterial` | `#C78A63` + Canvas2D radial cheek blush | `0.42` | `0.0` | `0.12` (`clearcoatRoughness: 0.45`) | Satin lembut seperti vinyl toy — zero noise kasar! |
| **Rambut Glossy** | `MeshPhysicalMaterial` | `#1C120E` | `0.22` | `0.04` | `0.38` (`clearcoatRoughness: 0.25`) | Menangkap *rim-light* merah/biru/hangat secara sinematik! |
| **Bola Mata** | `MeshPhysicalMaterial` | Canvas2D iris cokelat + pupil hitam | `0.06` | `0.0` | `0.85` | Kilau *catchlight* alami saat lampu menyala. |
| **Kaos / Pakaian Clay** | `MeshStandardMaterial` | `#EAB308` (mustard) / pastel hangat | `0.84` | `0.0` | `0.0` | Matte lembut tanpa kilau plastik. |
| **Selimut & Bantal** | `MeshStandardMaterial` | `#7DA7DC` + Canvas2D bintang kuning kecil | `0.88` | `0.0` | `0.0` | Bantal putih `#F5F4F0`, lekukan lembut. |
| **Kayu Nakas & Rak** | `MeshStandardMaterial` | `#C89463` (soft warm oak) | `0.56` | `0.0` | `0.0` | Satin kayu mainan bersih. |
| **Kap Lampu Praktis** | `MeshStandardMaterial` | `#FFFDF8` + `emissive: #FFBE6B` | `0.65` | `0.0` | `0.0` | Toggle `emissiveIntensity: 1.4` (ON) ↔ `0.0` (OFF) bersamaan dengan `PointLight` + halo sprite `AdditiveBlending`! |
| **Thought-Bubble Orb** | `MeshBasicMaterial` / `MeshPhysicalMaterial` | Canvas2D soft frosted circle + crisp colored rim (`#7DD3FC` → `#F87171`) | `0.2` | `0.0` | `0.0` | `transparent: true, depthWrite: false, opacity: 0.85` — render cepat & bebas artefak di ANGLE! |

---

## 3. Resep Dynamic Lighting Emotion Arc (`<Slug>3DCanvas.tsx`)

Jangan memutus ruangan — gerakkan emosi lewat **4 preset cahaya yang di-`lerp` mulus berdasarkan `frame`**:

```ts
// 1. WARM LAMP ON (Intro & Journaling POV)
//    practicalLamp.intensity = 4.2, lampColor = "#FFBA70", moonDir.intensity = 0.65, rimRed.intensity = 0
// 2. COOL MOONLIGHT BLUE (Thinking / 1 -> 100 Bubbles)
//    practicalLamp.intensity = 0.0, moonDir.intensity = 1.45, moonColor = "#8DB5F0", rimRed.intensity = 0
// 3. CRIMSON ANXIETY CLIMAX (Overload / Alarm Terlalu Sensitif)
//    practicalLamp.intensity = 0.0, moonDir.intensity = 0.55, rimRed.intensity = 3.8, rimRedColor = "#EF4444"
// 4. CALM EXHALE RESET (Berhenti Sebentar -> Lamp Back On -> Peaceful Sleep)
//    smooth lerp rimRed 3.8 -> 0.0 over 35 frames, restore cool serene moonlight!
```

---

## 4. Resep Live Handwriting POV di Atas Buku Catatan 3D

Untuk adegan makro menulis (`SH08` di referensi):
1. Buat `CanvasTexture` (`512×640`) halaman buku bergaris putih bersih + header tanggal di pojok kanan atas (`"Sabtu, 1 Nov"`).
2. Pada tiap frame, hitung `progress = clamp01((frame - startF) / durF)` → potong string teks (`text.slice(0, Math.floor(progress * text.length))`) atau gunakan `ctx.clip()` bertahap per baris sehingga tinta biru tua (`#1D4ED8`) tampak **benar-benar tertulis huruf demi huruf!**
3. Hitung posisi 3D ujung huruf aktif `(tipX, tipY)` pada bidang kertas, lalu tempatkan grup tangan kanan (`rightHand` dengan pulpen 3D sebagai *child* langsung) persis di titik `(tipX, tipY)` dengan micro-wiggle menulis (`Math.sin(frame * 0.9) * 0.008`) — **0% melayang, 0% clipping!**

---

## 5. Urutan Perintah Eksekusi (Windows PowerShell 5.1 Safe)

```powershell
# 1. Sintesis VO & SFX -> spot-listen beat kunci via read_file!
node --env-file=.env <slug>/scripts/build_vo_and_sfx.mjs

# 2. Mix & Broadcast Mastering (-14.5 LUFS)
python <slug>/scripts/build_sound_mix.py

# 3. Typecheck + Render 16-Shot QA Contact Sheet (--gl=angle, TEMP di Drive D:)
npx tsc --noEmit; if ($LASTEXITCODE -eq 0) { npm run still:<slug>-qa }

# 4. Full HD Chunked Render -> videos/<nama_final>_charflow.mp4
npm run render:<slug>

# 5. Audit Loudness Final MP4 & Cleanup Folder Temp
$mp4 = "d:\PROJECTS\z-automation-studio\videos\<nama_final>_charflow.mp4"
ffmpeg -nostats -i $mp4 -filter_complex ebur128=peak=true -f null - 2>&1 | Select-String -Pattern "Integrated loudness:|I:|True peak:|Peak:"
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue "<slug>\out\chunks","<slug>\out\bundle","<slug>\.tmp","<slug>\out\concat_list.txt"
```

---

## 6. 12-Point Mandatory Pre-Render QA Gate Checklist

- [ ] **1. Soft-Vinyl PBR Murni:** Kulit satin halus, rambut cokelat gelap *glossy* menangkap *rim-light*, pakaian *matte clay* — **ZERO black ink outlines**, **ZERO gouache bump**.
- [ ] **2. Kelopak Mata 3D Fisik:** Mata terpejam rapat saat tidur & tarik napas, terbuka bulat ekspresif dengan *catchlight* tajam saat terjaga.
- [ ] **3. Tangan 5-Jari Kapsul Zero-Clipping:** Jari rapi saat menekan lampu meja, menutup telinga, dan memegang pulpen menulis di buku catatan.
- [ ] **4. Lighting Emotion Arc Terbaca Jelas:** Kontras nyata antara *Warm Tungsten Lamp* ↔ *Cool Moonlight Indigo* ↔ *Crimson Anxiety Rim-Light* ↔ *Peaceful Blue Reset*.
- [ ] **5. Thought-Bubbles & Diorama Mini:** Gelembung *frosted* bertambah mulus (`1 → 10 → 100`) dan berubah merah saat klimaks tanpa *z-fighting*.
- [ ] **6. Macro POV Tulisan Tangan Jelas:** Teks di buku bergaris terbaca 100%, tidak terbalik, ujung pulpen menempel tepat di huruf terakhir.
- [ ] **7. Full-Circle Mirror Ending:** Pembukaan dan penutupan terhubung secara visual (gestur saklar lampu, jam berubah `02:00 → 03:00`).
- [ ] **8. Adaptive Frosted-Glass Subtitles:** Hanya 1 kapsul kaca buram elegan (nol banner atas, nol pill bernomor, nol watermark), berpindah atas/bawah agar tidak pernah menutupi wajah atau teks buku!
- [ ] **9. Pelafalan VO Intim Bersih:** Beat sensitif sudah didengarkan via `read_file` (nol salah ucap, nol dehem `[clear]`).
- [ ] **10. Broadcast Audio Loudness:** Stereo & Mono `-14.5` s.d. `-14.8 LUFS`, True Peak `<= -1.5 dBFS`.
- [ ] **11. ANGLE Headless Stability:** Nol `<EffectComposer>`, seluruh glow pakai emissive + additive halo sprite, 0 blank frame.
- [ ] **12. Disk & Output Path:** Temp terkunci di `D:\...\<slug>\.tmp`, output final di `videos/<nama_final>_charflow.mp4`.
