---
name: dual-agent-comedy-promo
description: >-
  Produce a 100% pure-code, BESPOKE STORYBOARD-FIRST Full HD (1080x1920 9:16 vertical, 55-100s, 30 fps)
  3D Dual-Agent Comedy, Commentary, Explainer, or Product Promo Short in Remotion + Three.js Pro
  (React Three Fiber) starring glossy 3D Pixar-style mascots Hermes & OpenClaw. NEVER uses a fixed
  scene/camera/gag template: EVERY video MUST begin with an original Director's Treatment, custom
  scene structure, and full shot-by-shot Storyboard (`<slug>/storyboard.json` + `<slug>/storyboard.md`)
  defining unique camera angles (OTS, Low-Angle, High-Angle, Dutch-Tilt, ECU, Two-Shot, Inserts, Crane),
  motivated blocking, bespoke 3D props/gags (`CustomProps3D.ts`), topic-matched Time-of-Day lighting,
  custom laptop/hologram visuals, and bespoke ElevenLabs `eleven_v4` + `Sound-V3` SFX mastered to
  -14.5 LUFS. Use whenever the user asks for a "video komedi 2 agent 3D", "Hermes vs OpenClaw",
  "Hermes & OpenClaw 3D", "dual-agent comedy", or any 3D mascot dialogue short.
---

# Dual-Agent 3D Comedy Director (`dual-agent-comedy-promo` v2.0) — Storyboard-First Anti-Template Pipeline

## HUKUM BESI ANTI-TEMPLATE (WAJIB DIPATUHI DI SETIAP VIDEO!)

> **PRINSIP INTI**: `remotion/videos/claude-animasi-promo/` adalah **Perpustakaan Aset & Engine Teknis** (rig 3D Hermes/OpenClaw, dunia modular Kampung Garut, sistem PMREM, dan kaidah anti-jitter) — **BUKAN TEMPLATE CERITA, BUKAN TEMPLATE 8 SCENE, DAN BUKAN TEMPLATE 16 KOORDINAT KAMERA!**

Setiap AI Agent **DILARANG KERAS**:
1. **DILARANG Copy-Paste Struktur 8-Scene Lama**: Jangan memaksa setiap video mengikuti urutan lama (*S1 lari panik bawa kertas+api → S2 layar error → S3 interogasi Noir + bola kristal pecah → S4 jentik jari + HP 3D → S5 3 kartu → S6 smug → S7 lompat kursi + facepalm → S8 crane malam*). Jumlah scene (bebas 4–9 scene), struktur komedi, dinamika karakter, dan ending **WAJIB lahir dari premis topik baru!**
2. **DILARANG Copy-Paste `CameraDirector.ts` / Daftar Shot Lama**: Setiap video **WAJIB** merancang shot list, sudut kamera, lensa/FOV, pergerakan, dan ritme cut **dari nol** di dalam `<slug>/storyboard.json` & `<slug>/storyboard.md` sebelum menulis satu baris pun kode `CameraDirector.ts`!
3. **DILARANG Daur Ulang Gag & Prop 3D Secara Otomatis**: Jangan menyelipkan api kepala, bola kristal pecah, sticky note kuning, atau facepalm bila tidak lahir alami dari skrip! Setiap video **WAJIB** membangun minimal **2–3 custom 3D prop/gag atau blocking baru** di `components/CustomProps3D.ts` yang benar-benar khas topik tersebut.
4. **DILARANG Mengunci Peran Karakter yang Monoton**: Hermes tidak harus selalu menjadi "guru bijak" dan OpenClaw tidak harus selalu "murid panik". Variasikan dinamika mereka sesuai cerita: debat 50-50, investigasi bersama, taruhan, wawancara/podcast 3D, sidang komedi, eksperimen gagal berdua, atau tukar peran (Hermes yang panik sementara OpenClaw santai!).
5. **DILARANG Menyamakan Time-of-Day & Mood Musik di Semua Video**: Pilih preset waktu (`sunrise`, `golden_morning`, `midday`, `sunset`, `night`, atau transisi waktu custom) dan gaya pencahayaan yang melayani emosi cerita (mis. komedi begadang → `night` ke `sunrise`; debat siang terik → `midday` ke `sunset`; horor-komedi server tumbang → `night` lampu meja redup).
6. **WAJIB FULL-FRAME SET-DRESSING SESUAI NASKAH + STORYBOARD (ZERO LEFTOVER ASSETS!)**: **SELURUH** aset dan permukaan yang terlihat di dalam frame 3D — bukan cuma layar laptop! — **WAJIB** dirancang ulang lewat `buildBedroomWorld(options)` dan `CustomProps3D.ts` mengikuti naskah + storyboard episode ini:
   - **Baligho Bambu luar jendela (`options.baligho`)**: Wajib diganti artwork/teksnya sesuai topik, produk, atau lelucon episode ini (atau `{ visible: false }` jika cerita tidak cocok memakai baligho). **HARAM** membiarkan baligho sisa video lama (mis. `"Z-AUTOMATION EDUKA EXPLORASI"`) nongol di video topik lain!
   - **Interior Kamar (`options.roomPalette`, `options.corkboard`, `options.sideMonitor`, `options.props`)**: Sesuaikan warna dinding/gorden/kayu meja/LED strip dengan mood episode, gambar ulang **papan dinding kiri (`corkboard`)** & **monitor vertikal kanan (`sideMonitor`)** sesuai konteks cerita (atau sembunyikan bila tidak relevan), serta matikan/ganti prop bawaan (`serverRack`, `lidDuck`, `lidMug`, `books`, `cactus`, `plant`) agar tidak ada satu pun properti yang terasa "tempelan lama".
   - **Layar Laptop & Prop 3D Aksi (`LaptopScreenRenderer.ts` + `CustomProps3D.ts`)**: Semua UI, grafik, objek melayang, dan gag 3D lahir 100% dari naskah + storyboard episode ini.

---

## Quickstart Mode Otonom (1-Prompt Workflow)
Pengguna cukup menyebutkan topik (bahkan 1 kalimat singkat). Agent menjalankan seluruh **6 Fase Storyboard-First** di bawah ini secara end-to-end hingga `.mp4` final di `videos/<slug>.mp4` (atau jika pengguna ingin meninjau naskah & storyboard dulu, tampilkan ringkasan `<slug>/storyboard.md` sebelum sintesis suara).

---

## Alur Kerja 6 Fase Wajib (Storyboard-First Cinema Pipeline)

### Fase 0 — Director's Concept & Anti-Template Premise (SEBELUM Dialog & Kode!)
Tentukan secara tertulis (nanti disimpan di header `<slug>/storyboard.json`):
1. **Premis & Sudut Komedi Unik**: Apa kontradiksi atau ironi paling tajam dari topik ini?
2. **Dinamika Peran Hermes vs OpenClaw**: Siapa memegang peran apa di episode ini? (Debat, eksperimen, sidang, review, adu gengsi, dll.).
3. **Struktur Babak Custom**: Berapa scene yang paling pas untuk cerita ini (4, 5, 6, 7, atau 9 scene)? Apa **visual motif** dan **punchline uniknya**?
4. **World Mood, Time-of-Day & Full Set-Dressing Plan**: Tentukan jadwal waktu (`WorldTimeSchedule`), palet warna kamar (`roomPalette`), isi **baligho luar jendela** (`baligho` — custom atau hidden), isi **papan dinding kiri (`corkboard`)** & **monitor vertikal samping (`sideMonitor`)**, serta daftar prop meja/jendela mana yang dipertahankan atau diganti!
5. **Daftar Custom 3D Props / Visual Gags**: Minimal 2–3 objek/efek 3D baru yang akan dibuat di `components/CustomProps3D.ts` khusus cerita ini (dan jika mempromosikan website/produk nyata, wajib siapkan screenshot asli sebagai texture tajam `anisotropy = 8`, `SRGBColorSpace`).

### Fase 1 — Naskah Dialog (`brutal-storyteller`) & Storyboard Lengkap [GATE WAJIB!]
1. Baca `.agents/skills/brutal-storyteller/SKILL.md` dan tulis naskah dialog 2 suara (hook 3 detik brutal, eskalasi konkret tanpa klise AI, punchline orisinal).
2. Baca **`references/storyboard-and-cinematography.md`** WAJIB SEBELUM menyusun shot list!
3. Buat **DUA file storyboard wajib** di folder proyek sebelum menyentuh Audio atau Remotion:
   - **`<slug>/storyboard.json`** (ikuti skema `templates/storyboard.template.json`)
   - **`<slug>/storyboard.md`** (ikuti format `templates/storyboard.template.md` — tabel ringkas + panel sutradara tiap shot)
4. Setiap shot (`SH01..SHnn`, jumlah bebas sesuai tempo cerita, rata-rata `2.0s–6.5s` per shot) **WAJIB** menentukan secara eksplisit:
   - **Shot Scale & Camera Angle** (rotasi sadar dari 12 tipe di `references/storyboard-and-cinematography.md`: `OTS`, `Low-Angle`, `High-Angle`, `Dutch-Tilt`, `ECU`, `MCU`, `Two-Shot`, `Split-Depth`, `Laptop Insert`, `Prop Macro`, `Wide`, `Crane`).
   - **Koordinat 3D & Gerakan Kamera Bermotivasi**: `fromPos → toPos`, `fromLook → toLook`, `fromFov → toFov`, `roll`, `movement`, dan **`motivation`** (mengapa kamera ditaruh di sudut itu dan mengapa bergerak ke arah itu!).
   - **Blocking & Acting Kedua Karakter**: posisi 3D (`ocPos`, `hmPos`), arah pandang (`eyeline`), pose (`start → anticipation → action → settle`), dan **reaksi karakter yang sedang DIAM/MENDENGARKAN** (karena separuh komedi datang dari reaksi karakter yang tidak bicara!).
   - **Custom 3D Props & Screen State**: prop 3D bespoke mana yang masuk/animasi di shot ini + apa yang tampil di layar laptop/hologram.
   - **Lighting & Sound Cue**: pencahayaan bermotivasi + SFX spesifik yang terikat ke momen fisik di shot ini.
   - **Audit Gate Anti-Template Storyboard** (wajib lolos sebelum Fase 2):
     - Minimal **5 variasi shot scale/angle berbeda** (bukan hanya Two-Shot & MCU bolak-balik!).
     - **0** shot berturut-turut dengan framing & pergerakan kamera identik.
     - Minimal **2 custom 3D props/gags** atau set-piece baru yang belum dipakai di episode sebelumnya.
     - **Full Set-Dressing Terisi Penuh**: `setDressingPlan` eksplisit mendefinisikan **baligho, warna kamar, papan dinding, monitor samping, prop meja, dan layar laptop** — 0 aset sisa episode lama!
     - Ada **eyeline & continuity plan** yang menjaga *180-degree rule* (kecuali saat kamera sengaja memutar lewat gerak kontinu).

### Fase 2 — Audio-First Locked Trio-Voice, Bespoke SFX & Broadcast Mastering (`-14.5 LUFS`)
1. Sintesis dialog via **ElevenLabs `eleven_v4`** dengan anchor `[[cue]]` yang **100% cocok** dengan `cueStart` di `<slug>/storyboard.json` (selalu rujuk profil terkunci di **`remotion/lib/zaldy-world/VoiceCast.ts`**):
   - **Zaldy — LOCKED (`Eric cjVigY5qzO86Huf0OWal`)**: **Calm, Cool, Smooth** kreator muda (`stability: 0.72`, `similarityBoost: 0.88`, `style: 0.06`, `seed: 2026`, `tempo: 1.05`, kirim `previousText`/`nextText` sesama baris Zaldy, **TANPA** tag emosi berlebihan agar aura *calm & cool* tetap konsisten 100%).
   - **Hermes & Closing — LOCKED (`Brian nPczCjzI2devNBz1zQrb`)**: profil *strategist* berat & mantap (`stability: 0.72`, `similarityBoost: 0.90`, `seed: 4242`, `tempo: 1.10`, kirim `previousText`/`nextText` sesama baris Hermes, TANPA tag emosi yang mengubah warna suara).
   - **OpenClaw — LOCKED (`Liam TX3LPaxmHKxFdv7VOQHJ`)**: ekspresif & lincah (`stability: 0.38`, `similarityBoost: 0.78`, `tempo: 1.12–1.15`, boleh memakai tag emosi komedi sesuai naskah).
   - Terapkan **Pronunciation Shield** untuk istilah bahasa Indonesia & akronim (`c` → `ch` bila rawan dibaca `k`, `"AI"` sebelum huruf vokal atau tanda baca agar selalu terbaca `"E-Ai"`, angka dieja di TTS lalu diringkas di subtitle).
   - Pastikan `alignDisplayToRuns()` melacak `spokenCount` per token & `lastEnd` memakai `spokenRuns[spokenRuns.length - 1].end + 0.24s` agar suku kata akhir tidak terpotong.
2. **Bespoke SFX dari Storyboard (`eleven_text_to_sound_v3` + CC0)**: Sintesis SFX yang **benar-benar tertulis di `sfxCue` storyboard** — JANGAN menyalin membabi-buta 12 SFX lama jika adegannya berbeda!
3. Master bersama musik latar Mixkit yang cocok dengan mood episode (termasuk dynamic dip / dead-silence drop tepat pada beat punchline di storyboard) → **`-14.50 LUFS` Stereo & Mono** (`True Peak <= -1.5 dBFS`).
4. **WAJIB dengarkan langsung `public/<slug>/audio_master.m4a` via `read_file`** sebelum lanjut ke Fase 3! Jika ada 1 kata pun salah ucap, perbaiki baris itu (baris lain tetap dari cache) dan dengarkan ulang.

### Fase 3 — Build Bespoke 3D Scene, `CustomProps3D.ts`, `CameraDirector.ts` & Visual Layar
1. **Impor Engine Dasar & Cinematic 3D Kit v2.1 (JANGAN Duplikasi Boilerplate Rig!)**:
   - **Shared Cinematic Engine (`remotion/lib/cinematic-3d-kit/`)** — WAJIB dipakai di semua video baru agar kamera, akting, & lampu kamar mencapai kualitas sinema:
     - `FilmicCameraEngine.ts` (`evaluateFilmicShot`, `applyFilmicCamera`): Mendukung 4 mode gerak kamera bermotivasi yang dirancang khusus dari storyboard tiap episode: `"orbital_arc"` (orbit 60°–150° mengelilingi meja/karakter), `"spline"` (`CatmullRomCurve3`), `"exp_pullout"` (*exponential crane pull-out*), dan `"dolly"` halus + `breathAmp` organik + wajib *foreground framing prop*!
     - `NaturalActorEngine.ts`: 12-Principles acting helpers (*spine-lead*, *asymmetric L/R phase lag*, *overshoot/settle*, *weight-shift*, *auto-blink on head turn*, *organic saccades*, klip multi-beat `evalHumanTypingFlow` & `evalHumanStretchRelax`).
     - `PracticalLampKit.ts`: Sistem lampu praktis 4-lapis (*bulb core*, *translucent emissive shade*, `PointLight decay≈1.8`, *additive Gaussian halo sprite* + *Fresnel volumetric cone*, 100% aman di `--gl=angle`).
   - **Upgraded Solid & Natural Character + Bedroom Rigs**:
     - `remotion/videos/claude-animasi-promo/components/ThreeMascotRigs.ts` (`buildHermes3D`, `buildOpenClaw3D`) — sudah dilengkapi kaki menapak solid 0 celah, kerah tebal solid, lengan 2-segmen bersiku, pupil hitam dalam iris cyan + lengkung mata bahagia `^ ^`, mulut 3D bergigi & berlidah, serta *asymmetric acting* + *saccades*!
     - `remotion/lib/zaldy-world/ZaldyCharacter3D.ts` (`buildZaldyCharacter3D`) — karakter 180cm Zaldy berambut *Textured Wolf-Mullet*, alis 3D, *weight-shift*, klip mengetik + *mouse-reach* & *sit_desk_stretch*!
     - `remotion/lib/zaldy-world/ZaldyBedroom3D.ts` (`buildZaldyFullBedroom3D`) — kamar 360° penuh dengan **3 lampu praktis ber-halo & kerucut cahaya** (*Pendant Lamp*, *Corner Floor Lamp*, *Bedside & Desk Lamp Glow*)!
     - `remotion/videos/claude-animasi-promo/components/ThreeStudioWorld.ts` (`buildBedroomWorld`, `roundRectPath`), `world/Sky.ts` (`buildKampungPMREMCache`), `world/TimeOfDay.ts`.
   - **Catatan Penting**: Semua engine di atas adalah *alat teknis* — **cerita, jumlah scene, blocking, pose, sudut kamera, dan mood lampu WAJIB tetap lahir 100% dari naskah + `<slug>/storyboard.json` episode baru tersebut!**
2. **Bangun Komponen Bespoke Khusus Episode di `remotion/videos/<slug>/`**:
   - `components/SetDressing.ts` (atau opsi langsung ke `buildBedroomWorld(options)`): Mengisi seluruh `BedroomWorldOptions` sesuai `setDressingPlan` di storyboard (**custom canvas baligho 512×680 atau `visible: false`, custom papan dinding 512×384, custom monitor samping 384×600, palet warna dinding/gorden/meja/LED, dan toggle prop meja/jendela**). **JANGAN pernah memanggil `buildBedroomWorld()` kosong tanpa `options` pada video baru!**
   - `components/CameraDirector.ts`: Diimplementasikan **langsung dari `<slug>/storyboard.json`** (setiap `FilmShot` mencerminkan `shotId`, sudut unik OTS/Low/High/Dutch/Insert/Crane, kurva gerak bermotivasi, dan transisi storyboard).
   - `components/CustomProps3D.ts`: Berisi seluruh prop/gag 3D kustom yang dirancang di storyboard episode ini.
   - `components/LaptopScreenRenderer.ts`: Grafis 1024×640 100% custom untuk topik episode ini (jaga **portrait-safe inner bounds `x = 128..896`** agar 0 teks terpotong di 9:16; jika ada screenshot produk/website asli, preload via `delayRender`/`continueRender`!).
   - `components/ThreeComedyScene.tsx`: Sutradara 3D yang mengeksekusi blocking, acting kedua karakter, prop 3D, lighting bermotivasi, dan `WorldTimeSchedule` sesuai storyboard.
   - `components/OverlayHUD.tsx` & `components/SubtitleOverlay.tsx`: Callout minimal top-safe-zone + subtitle karaoke bersih dengan `WebkitTextStroke` & drop-shadow lembut (ZERO bulky speaker pills!).
3. **Kaidah Teknis Anti-Bug (Tetap Wajib Berlaku di Semua Episode!)**:
   - **Zero-Jitter 3-Channel Pixar Rig**: Pisahkan `mouthTalk` (hanya mulut) dari `speakPresence` (halus 10 frame) & `listenPresence` (halus 12 frame) + `emotionBlend`. Orbital ring Hermes wajib monoton (`t * 0.45`).
   - **Zero Unintended Teleports**: Perpindahan posisi karakter (`> 0.08m/fr`) hanya boleh terjadi melalui animasi fisik penuh (berjalan/melompat/bergeser) ATAU tepat pada **cut frame storyboard yang disengaja**.
   - **Synchronous PMREM in `useMemo`**: Inisialisasi `buildKampungPMREMCache(gl)` di `useMemo` (BUKAN `useEffect`) agar Frame 0 tiap chunk bebas kilatan cahaya.
   - **ANGLE-Safe Rendering**: Dilarang memakai `<EffectComposer>` (`@react-three/postprocessing`) pada headless Chromium `--gl=angle`; gunakan material/shader custom yang aman.

### Fase 4 — Audit Matematis (`verify_motion.mjs`) + Visual QA 2-Lapis Terhadap Storyboard
1. Jalankan `npm run typecheck` (`0` error).
2. Jalankan **`<slug>/scripts/verify_motion.mjs`** yang mengaudit seluruh shot **dari `CameraDirector.ts` / `storyboard.json` episode ini** (BUKAN array hardcode lama!):
   - `0` unintended character teleports, `0` ring reversals, `0` camera X ping-pong reversals, delta kepala `< 0.025 rad/fr`, delta badan Y `< 0.015 m/fr`.
3. Render **2 Lembar Visual QA (`<slug>/scripts/render_qa_stills.ps1`)** dan inspeksi langsung via `read_file`:
   - **`qa_all_shots.jpg`**: 1 frame perwakilan dari **SETIAP shot di storyboard** — verifikasi komposisi, sudut kamera (apakah OTS/Low/High/Insert benar-benar terasa sinematik?), ekspresi kedua karakter, keterbacaan prop & layar laptop, **ZERO sisa aset/teks/brand video lama di baligho, dinding kamar, monitor samping, maupun meja**, dan 0 teks terpotong!
   - **`qa_motion_strip.jpg`**: strip 6 frame berurutan karakter bicara via `--sequence` + transisi antar babak kritis.
4. Jika ada shot yang datar, terasa klise, prop menembus (clipping), teks terpotong, **atau masih terlihat 1 saja sisa baligho/poster/prop video lama** → **AUTO-FAIL: perbaiki kodenya dan re-verifikasi still-nya** sebelum render penuh!

### Fase 5 — Chunked Full HD Render, Verifikasi Integritas & Cleanup
1. Render chunked anti-OOM (`--gl=angle --concurrency=1 --muted`, ~300–350 frame/chunk) via `<slug>/scripts/render_<slug>_chunks.ps1`.
2. Lossless concat + mux audio master → simpan ke **`d:\PROJECTS\z-automation-studio\videos\<nama_video>.mp4`**.
3. Verifikasi `ffprobe` + scan integritas 60 frame terdekode (`0` blank/corrupt frame) + inspeksi `final_mp4_storyboard_4x4.jpg` via `read_file`.
4. Bersihkan folder sementara (`out/chunks`, `out/bundle`, `out/qa_stills`, `.tmp`).

---

## Peta Referensi & Template Skill
- **`references/storyboard-and-cinematography.md`**: Katalog 12 sudut kamera 3D Hermes & OpenClaw, arketipe blocking non-template, aturan reaksi karakter, panduan Custom 3D Props, dan Anti-Template Gate.
- **`templates/storyboard.template.json`**: Skema JSON storyboard produksi yang wajib dibuat sebelum coding.
- **`templates/storyboard.template.md`**: Format storyboard sutradara yang mudah dibaca & diaudit.
- **Perpustakaan Aset & Engine 3D (Re-use Modul Teknisnya, JANGAN Copy Storyboardnya!)**: `remotion/videos/claude-animasi-promo/` (`ThreeMascotRigs.ts`, `ThreeStudioWorld.ts`, `world/`).
