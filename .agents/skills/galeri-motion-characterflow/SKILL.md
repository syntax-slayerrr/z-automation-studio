---
name: galeri-motion-characterflow
description: Produce a 100% pure-code 3D Soft-Vinyl / Toy-Clay Character-Driven Storytelling Short (1080x1920 Full HD or 720x1280 9:16 vertical, 30 or 60 fps, Remotion + Three.js / React Three Fiber) reverse-engineered frame-by-frame from "galeri-motion-characterflow.mp4" (38.6s overthinking at 2 AM short). Features smooth tactile Soft-Vinyl / Toy-Clay PBR materials (satin skin with subtle clearcoat & radial cheek blush, glossy sculpted dark hair catching dramatic rim light, matte clay-cotton clothing, ZERO black ink outlines and ZERO painterly gouache strokes), articulated 5-finger capsule hands, physical 3D opening/closing eyelids, continuous single-room 3D staging with dynamic practical lighting emotion arcs (warm bedside tungsten lamp <-> cool moonlight indigo <-> crimson anxiety rim-light <-> peaceful exhale reset), floating translucent frosted 3D thought-bubbles containing miniature 3D dioramas & icons (1 -> 10 -> 100 metaphor), First-Person POV macro hand-writing on a 3D ruled notebook, full-circle mirror-gesture visual ending loop, ultra-minimalist adaptive frosted-glass pill subtitles with warm gold keyword emphasis, and intimate empathetic Indonesian VO + minimal ambient piano/tactile foley mastered to -14.5 LUFS. Use whenever the user asks for "style galeri motion characterflow", "style soft-vinyl 3D", "style clay 3D karakter", "animasi 3D reflektif / psikologi / overthinking / karakter mengalir", or wants a smooth Pixar-vinyl 3D character short distinct from both Painted Gouache 3D and Cel-Toon Ink-Outline 3D.
---

# `galeri-motion-characterflow` — 3D Soft-Vinyl / Toy-Clay Character-Flow Storytelling Engine

Skill Master #12 hasil **forensic frame-by-frame reverse-engineering (`rea-video`)** terhadap referensi `galeri-motion-characterflow.mp4` (`720×1280`, 60 fps, `38.60s`, `-13.7 LUFS`).

Gaya ini **kontras 100%** dari dua gaya 3D lain di studio:
- **vs Painted Gouache 3D (`sehat-ep01`)**: nol tekstur sapuan kuas gouache/cat air — permukaan mulus *satin soft-vinyl & matte clay* layaknya figur mainan desainer (*Pixar × Blind-Box Vinyl Toy*).
- **vs Cel-Toon Ink-Outline (`galeri-motion-toon`)**: **NOL garis outline hitam**, **NOL cel-step datar**, **NOL plang rambu atas / gelembung komik tebal** — digantikan pencahayaan sinematik PBR dinamis, gelembung pikiran kaca buram 3D, dan subtitle kapsul *frosted glass* super bersih!

---

## Quickstart 1-Prompt Mode (Ramah Orang Awam)
Cukup beri 1 kalimat:
> *"Buatkan video gaya **`galeri-motion-characterflow`** tentang **[topik psikologi / kesehatan mental / kebiasaan harian / refleksi hidup / cerita personal]**"*

**Instruksi Otonom untuk AI Agent:**
- Jalankan **5 Fase Workflow** lengkap sampai `.mp4` final di `videos/<nama-video>_charflow.mp4` tanpa menyuruh pengguna menulis kode.
- Wajib patuhi **3 Gerbang QA** (spot-listen VO → inspeksi 16-shot QA Contact Sheet via `read_file` → verifikasi `ffprobe` + `ebur128` + decoded `4×4` MP4).

---

## 1. Forensic Visual & Material DNA (1:1 Fidelity)

| Elemen | Spesifikasi PBR & Geometri Wajib | Larangan Keras |
|---|---|---|
| **Shading & Tekstur Utama** | `THREE.MeshPhysicalMaterial` / `THREE.MeshStandardMaterial` bergaya **Soft-Vinyl / Toy-Clay PBR** + PMREM soft studio/room reflection (`ACESFilmicToneMapping`, exposure `1.05`). | **DILARANG** pakai `BackSide` black ink outlines, **DILARANG** pakai `MeshToonMaterial`, **DILARANG** pakai bump kuas gouache! |
| **Kulit & Wajah Karakter** | Kulit satin hangat (`roughness: 0.40`, `metalness: 0.0`, `clearcoat: 0.12`, `clearcoatRoughness: 0.45`) + pipi *radial blush* lembut + **mata 3D bola glossy** (`roughness: 0.08`, iris cokelat, pupil hitam, *catchlight* tajam) + **kelopak mata 3D fisik** yang benar-benar menutup & membuka! + hidung kancing 3D lembut (*button nose*) + mulut ramping halus. | Jangan pakai tekstur wajah datar 2D bertinta tebal; kedipan & pejaman mata wajib menggerakkan kelopak 3D fisik! |
| **Rambut 3D Glossy** | Rambut *sculpted wavy cap* cokelat tua nyaris hitam (`#1D120E`, `roughness: 0.22`, `clearcoat: 0.38`) sehingga **menangkap kilau *rim-light* oranye, biru bulan, dan merah cemas secara dramatis!** | Jangan pakai rambut kusam *matte* tanpa pantulan *rim-light*. |
| **Tangan 5-Jari Kapsul** | Telapak rounded box + **5 jari terartikulasi berbentuk kapsul (`CapsuleGeometry`)** dengan buku jari lembut — krusial untuk adegan **mematikan saklar lampu, menutup telinga, dan makro POV menulis pulpen di buku catatan!** | Jangan pakai tangan sarung tinju/bola bulat polos pada shot makro POV! |
| **Kain & Pakaian Clay** | Pakaian *matte soft-clay* (`roughness: 0.84`), lipatan lengan gulung (*rolled cuff torus*), selimut pastel berbintang kecil (`CanvasTexture`), bantal putih empuk, headboard empuk 4-panel. | Hindari warna neon menyilaukan; pakai palet pastel-hangat *cozy* (kuning mustard `#EAB308`, biru bulan `#6B93D6`, teal `#1EA7B5`, putih krem `#F5F2EA`). |
| **3D Thought-Bubbles & Diorama Mini** | Gelembung pikiran **translucent frosted glass orbs** (`opacity: 0.72–0.88`, glow lembut, cincin tepi tipis cyan → berubah **merah alarm** saat panik!) yang di dalamnya berisi **ikon minimalis (`?`, `✕`, `💬`, awan hujan)** dan **miniatur diorama 3D / billboard adegan pikiran**. Melipatgandakan skala `1 → 10 → 100` memenuhi kamar! | Jangan pakai gelembung komik berbingkai hitam tebal. |
| **Dynamic Practical Lighting Arc** | **1 ruangan konsisten** yang suasananya digerakkan penuh oleh **cahaya fisik & warna emosi**: (1) **Lampu Meja Tungsten Hangat** (`#FFBA70` + glow volumetrik) → (2) **Klik mati ke Moonlight Indigo Sejuk** (`#6088CC`) → (3) **Crimson Anxiety Rim-Light** (`#EF4444` saat klimaks cemas) → (4) **Calm Blue Exhale Reset** → (5) **Warm Lamp On (Journaling POV)** → (6) **Klik mati damai (Full-Circle Loop!)**. | Jangan biarkan pencahayaan datar/sama dari awal sampai akhir — perubahan warna cahaya adalah pencerita emosi utama! |
| **Adaptive Frosted-Glass Subtitles** | **1 kapsul kaca buram minimalis** (`rgba(38, 46, 68, 0.56)`, `backdrop-filter: blur(10px)`, `border-radius: 16px`), font sans-serif bersih (`Inter / Segoe UI`, weight `600–700`), kata aktif putih bersih (`#FFFFFF`), **kata kunci emosi berwarna kuning emas (`#FACC15`)**, kata belum diucapkan semi-transparan (`rgba(255,255,255,0.56)`). **Posisi adaptif:** pindah ke atas (`top: 11%`) saat subjek di bawah, atau ke tengah-bawah (`bottom: 20%`) saat bubble memenuhi langit-langit! | **ZERO** top sign banner, **ZERO** numbered pills, **ZERO** watermark! |

---

## 2. Alur Kamera & Bahasa Visual Wajib (Continuous Character-Flow Grammar)

Lihat detail lengkap 9 shot referensi (`00.00s – 38.60s`) di [`references/forensic-rea-breakdown.md`](./references/forensic-rea-breakdown.md).

Pola 6-Babak *Character-Flow* yang mudah diadaptasi ke topik psikologi / kebiasaan / kesehatan apa pun:
1. **Babak 1 — Cozy Physical Hook + Practical Light Toggle (`0–12%`):** *High-Angle 3/4 Establishing* dalam kamar/ruang hangat → karakter melakukan gestur fisik nyata (mis. mematikan lampu meja `click!`) → suasana langsung berubah drastis!
2. **Babak 2 — Sudden ECU Awakening (`12–16%`):** *Hard Cut* ke **Extreme Close-Up (ECU) wajah** saat kelopak mata 3D terbuka mendadak & bola mata melirik gelisah.
3. **Babak 3 — Escalating 3D Thought-Bubble Multiplication (`16–48%`):** Karakter duduk/berpikir → muncul 1 gelembung pikiran berisi diorama mini → kamera *smooth pull-out* saat gelembung berlipat ganda (`1 → 10 → 100`) memenuhi ruang vertikal!
4. **Babak 4 — Crimson Emotional Climax (`48–66%`):** Kamera makin dekat & sedikit miring (*tilted high-angle*); warna lampu & cincin gelembung memerah intens (*crimson rim-light* menyapu rambut glossy); karakter bereaksi secara fisik (menutup telinga / menunduk kewalahan).
5. **Babak 5 — Calm Breathing Reset + Tactile Macro POV Action (`66–84%`):** *Symmetrical Close-Up* wajah memejamkan kelopak mata 3D → cahaya merah luruh kembali ke biru tenang → nyalakan lampu hangat → **First-Person Macro POV** kedua tangan kapsul 5-jari melakukan aksi nyata (mis. **menulis live di buku catatan bergaris**, menuang air, menutup HP, menyusun jadwal).
6. **Babak 6 — Full-Circle Mirror Ending (`84–100%`):** Karakter kembali ke posisi pembukaan dengan **gestur cermin** (mematikan lampu lagi `click!`), detail kecil berubah sebagai bukti pemulihan (jam `02:00 → 03:00`, ekspresi tersenyum pulas), kamera *pull-back* tenang!

---

## 3. End-to-End 5-Phase Production Workflow

Panduan struktur folder, kode resep Three.js Soft-Vinyl PBR, PowerShell 5.1, dan **12-Point QA Checklist** lengkap tersedia di [`references/workflow-and-checklist.md`](./references/workflow-and-checklist.md), serta template storyboard di [`templates/storyboard.template.json`](./templates/storyboard.template.json).

### Phase 0 — Naskah Intim (`brutal-storyteller`) & Storyboard Flow
1. Tulis naskah reflektif-empatik (bahasa akrab seperti teman bicara pelan, kalimat pendek bernapas, 1 kontradiksi pembuka + 1 aksi nyata yang bisa langsung dipraktikkan, 40–180 detik).
2. Buat `<slug>/storyboard.json` dari [`templates/storyboard.template.json`](./templates/storyboard.template.json) memetakan: *Lighting State* (`warm_lamp` / `moonlight` / `crimson_stress` / `calm_reset`), *Eyelid & Gaze*, *Bubble Density (`0..100`)*, *Macro POV Handwriting Text*, *Adaptive Subtitle Zone (`top` | `lower`)*, dan *Foley Cues*.

### Phase 1 — Audio-First Pipeline (Intimate VO + Tactile Foley + Ambient Piano)
1. Buat `<slug>/scripts/build_vo_and_sfx.mjs` memakai ElevenLabs `eleven_v4` (`convertWithTimestamps`, `languageCode: "id"`, SHA-1 cache per beat):
   - Pilih suara hangat/intim/empatik yang **berbeda dari video sebelumnya** (mis. **Chris** `iP95p4xoKVk53GoZ742B` pria hangat tenang, atau **Sarah** `EXAVITQu4vr4xnSDxMaL` wanita hangat lembut, `TEMPO = 1.04–1.10`).
   - **ATURAN EMAS TTS:** **JANGAN pernah pakai tag `[clear]`** di `eleven_v4`! Pakai `[gentle]`, `[warm]`, `[reflective]`, `[soft]`, `[reassuring]` + `trimLead = aligned[0].start - 0.08s`.
   - Generate 7–10 SFX taktil presisi via `eleven_text_to_sound_v3` (saklar lampu *click*, *soft bubble pops*, dengung alarm teredam, helaan napas tenang, goresan pulpen di kertas).
2. **GATE 1 (Wajib):** Spot-listen beat penting di `<slug>/audio/vo_cache/*.mp3` memakai `read_file`.
3. Jalankan `<slug>/scripts/build_sound_mix.py`: padukan VO + skor piano/ambient minimalis berlisensi + foley taktil → master linear 2-pass ke **`-14.5 LUFS`** (Stereo & Mono), **True Peak `<= -1.5 dBFS`** → `public/<slug>/audio_master.m4a`.

### Phase 2 — Bangun Dunia 3D Soft-Vinyl PBR & Adaptive Glass Subtitles
1. Bangun atau impor modul reusable di `remotion/lib/soft-vinyl-3d/`:
   - `vinylMaterials.ts` — Pabrik Soft-Vinyl PBR (`roughness`, `clearcoat`, radial blush texture, star blanket Canvas2D, ruled notebook live-writing Canvas2D, frosted thought-bubble shader/material).
   - `VinylCharacter3D.ts` — Karakter 3D ber-kelopak mata fisik, mata bola glossy, rambut wavy glossy, dan **tangan 5-jari kapsul terartikulasi** (`CapsuleGeometry` untuk genggaman pulpen & saklar lampu tanpa clipping!).
   - `GlassSubtitleOverlay.tsx` — Kapsul *frosted glass* adaptif (`zone: "top" | "lower"`) dengan highlight kata aktif putih/emas.
2. Bangun dunia & sutradara deterministik di `remotion/videos/<slug>/scene3d/`:
   - Kontrol kamera, kelopak mata, warna lampu (`THREE.Color.lerp`), kepadatan bubble (`0..100`), dan progress teks tulisan tangan 100% deterministik dari `useCurrentFrame()` via `const { camera } = useThree()`.
   - **CRITICAL ANGLE RULE:** **JANGAN** pakai `@react-three/postprocessing` `<EffectComposer>` di Remotion `--gl=angle` (bisa blank WebGL!). Buat efek *warm lamp glow* & *frosted bubble halo* dengan `THREE.AdditiveBlending` soft radial glow sprite / Canvas2D texture!
3. Daftarkan di `remotion/entry-<slug>.ts` (isolated bundle anti-OOM!), `remotion/Root.tsx`, dan `package.json`.

### Phase 3 — Typecheck + 16-Shot QA Contact Sheet Audit (WAJIB!)
1. Jalankan `npx tsc --noEmit` (wajib **0 error**).
2. Render 16 still Full HD (`--gl=angle`, `$env:TEMP`/`$env:TMP` terkunci di `D:\...\<slug>\.tmp`) → `<slug>/out/qa_16_shots.jpg`.
3. **GATE 2 (Wajib):** Inspeksi `qa_16_shots.jpg` + minimal 5 still hero via `read_file`:
   - Cek kilau satin kulit & rambut glossy, kelopak mata 3D tertutup rapi saat pejam/tidur, 0 clipping tangan pada saklar lampu & pulpen, transisi warna *warm → blue → crimson → calm blue*, keterbacaan tulisan tangan POV di buku catatan, dan posisi subtitle adaptif tidak menutupi wajah/tulisan!

### Phase 4 — Resumable Chunk Render, Broadcast QA & Cleanup
1. Jalankan `<slug>/scripts/render_<slug>_chunks.ps1` (`300 frame/chunk`, `--gl=angle --concurrency=1 --crf=18 --muted`, temp terkunci di Drive `D:`).
2. Mux lossless ke **`d:\PROJECTS\z-automation-studio\videos\<nama-video>_charflow.mp4`**.
3. **GATE 3 (Wajib):** Verifikasi `ffprobe` + `ebur128` langsung pada MP4 final + inspeksi decoded `4×4` storyboard (`final_mp4_storyboard_4x4.jpg`) via `read_file`, lalu bersihkan folder temp (`chunks`, `bundle`, `.tmp`).

---

## 4. Golden Rules Anti-Bug (`galeri-motion-characterflow`)

1. **NO Postprocessing `<EffectComposer>` di `--gl=angle`:** Gunakan *emissive meshes* + soft radial Canvas2D halo planes (`AdditiveBlending`, `depthWrite: false`) untuk pendar lampu meja & gelembung pikiran agar 100% stabil di Chromium headless Windows.
2. **Tangan 5-Jari Makro POV Anti-Clipping:** Pada shot makro menulis di buku, jadikan objek pulpen sebagai *child* langsung dari grup tangan kanan (`rightHand.add(pen)`) dan animasikan posisi tangan mengikuti ujung garis teks Canvas2D secara matematis — **0% melayang, 0% menembus kertas!**
3. **Transisi Warna Cahaya Mulus (`Color.lerp`):** Semua pergantian suasana (*Warm Tungsten ↔ Moonlight Blue ↔ Crimson Stress*) wajib memakai fungsi *easing* 15–35 frame (kecuali klik saklar lampu yang memang *snappy* 3–4 frame!).
4. **Windows PowerShell 5.1 & Disk Safety:** Jangan pakai `&&` (pakai `; if ($LASTEXITCODE -eq 0) { ... }`), selalu arahkan `$env:TEMP` & `$env:TMP` ke Drive `D:`, dan simpan seluruh video final ke `videos/`.
