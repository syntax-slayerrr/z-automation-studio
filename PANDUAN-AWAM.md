# Panduan Pemula (Orang Awam) — Buat Video Animasi Viral Hanya dengan 1 Kalimat Prompt!

Selamat datang di **Z-Automation Studio**!
Kamu **tidak perlu bisa koding** (tidak perlu mengerti React, Three.js, maupun FFmpeg) untuk membuat video animasi edukasi, sejarah, sains, atau promosi produk sekelas studio profesional.

Seluruh "resep rahasia" pembuatan video sudah dibungkus ke dalam **8 Skill AI Otomatis** di folder `.agents/skills/`. Kamu cukup membuka repository ini di **AI Agent favoritmu** (**Antigravity**, **Claude Code**, **Cursor**, **Windsurf**, atau **Codex**), lalu **Copy-Paste 1 Kalimat Prompt** di bawah!

---

## Langkah 1 — Persiapan Awal (Hanya Sekali di Komputer Kamu)

1. Pastikan komputer kamu sudah terpasang:
   - **Node.js** (versi 20 ke atas)
   - **Python** (versi 3.10 ke atas, dengan `numpy`, `scipy`, `opencv-python`)
   - **FFmpeg** (sudah masuk ke PATH sistem)
2. Buka terminal di folder project ini, lalu jalankan:
   ```powershell
   npm install
   ```
3. Salin file `.env.example` menjadi file bernama **`.env`**, lalu masukkan API Key **ElevenLabs** kamu:
   ```env
   ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

---

## Langkah 2 — Pilih Style Video & Copy-Paste 1 Kalimat Prompt ke AI Agent!

Salin salah satu prompt di bawah ini, ganti bagian **`[TOPIK KAMU]`**, lalu kirim ke chat AI Agent:

### 1. Gaya 3D Cutaway Explainer (Mirip `@gimanabisaid` — Full HD 1080×1920 + Karakter 3D IK Halus)
> **Prompt Siap Pakai:**
> `"Gunakan skill 3d-cutaway-explainer untuk membuat video Full HD 1080x1920 durasi ~70 detik tentang: [Kenapa Jembatan Gantung Tidak Runtuh Saat Diterjang Angin Kencang?]. Kerjakan otomatis dari naskah brutal-storyteller, VO ElevenLabs + 9 SFX, animasi 3D IK bebas clipping, audit QA 16 frame, sampai file MP4 final selesai."`

- **Contoh yang sudah jadi di studio ini**:
  - `sawah-terasering/out/final_mp4_storyboard_4x4.jpg` (*"Kenapa Sawah di Gunung Dibuat Bertingkat (Terasering)?"*)
  - `tiang-listrik/` (*"Kenapa Tiang Listrik di Desa Pakai Beton Bulat?"*)
  - `rel-kereta/` (*"Kenapa Rel Kereta Api Diberi Batu Kerikil & Celah?"*)

---

### 2. Gaya 2D Vintage Poster Explainer (Mirip *"Danau Toba Dulunya Gunung Api Raksasa"*)
> **Prompt Siap Pakai:**
> `"Gunakan skill vintage-poster-explainer untuk membuat video 9:16 tentang: [Bagaimana Terbentuknya Kawah Ijen dan Api Biru Abadi?]. Kerjakan otomatis dari naskah, VO & SFX, animasi gouache + peta d3-geo + kartu pos vintage loop, sampai file MP4 selesai."`

- **Contoh yang sudah jadi di studio ini**:
  - `gunung-guntur/` (*"Gunung Guntur: Raksasa Api Garut"*)
  - `gambut-history/` (*"Gambut: Warisan Ribuan Tahun Penyimpan Karbon"*)

---

### 3. Gaya 2D Twilight Parchment Documentary (Mirip *"Ketika Manusia Mengenal Api"*)
> **Prompt Siap Pakai:**
> `"Gunakan skill twilight-parchment-docu untuk membuat video dokumenter 2D sinematik tentang: [Bagaimana Manusia Purba Pertama Kali Menjinakkan Serigala?]. Kerjakan otomatis dari naskah, VO & musik -14.5 LUFS, 5-layer parallax & rig karakter 2D, sampai MP4 final."`

- **Contoh yang sudah jadi di studio ini**:
  - `human-fire/` (*"Ketika Manusia Mengenal Api"*)
  - `gmni-history/` (*"Sejarah Berdirinya GMNI 1954"*)

---

### 4. Gaya 24-Hour Celestial Clock Documentary (Mirip *"Sejarah Bumi Dipadatkan Jadi 24 Jam"*)
> **Prompt Siap Pakai:**
> `"Gunakan skill earth-24h-celestial-docu untuk membuat video dengan jam kosmik 24 jam tentang: [Bagaimana Jika Seluruh Sejarah Peradaban Manusia Dipadatkan Menjadi 24 Jam?]. Kerjakan otomatis dari naskah, VO, animasi jam astrolabe 24 jam, sampai MP4 final."`

- **Contoh yang sudah jadi di studio ini**:
  - `earth-24h/` (*"Jika Sejarah 4,5 Miliar Tahun Bumi Dipadatkan Jadi 24 Jam"*)

---

### 5. Gaya Cosmic & Astrophysics VFX Explainer (Mirip *"Jatuh ke Dalam Lubang Hitam"*)
> **Prompt Siap Pakai:**
> `"Gunakan skill cosmic-vfx-explainer untuk membuat video POV astronot & shader GLSL tentang: [Apa yang Terjadi Jika Kamu Mendekati Bintang Neutron Magnetar?]. Kerjakan otomatis dari naskah, VO & sub-bass SFX, shader GLSL + jam dilatasi waktu, sampai MP4 final."`

- **Contoh yang sudah jadi di studio ini**:
  - `black-hole/` (*"Apa yang Terjadi Jika Kamu Jatuh ke Lubang Hitam?"*)

---

### 6. Gaya Cartoon 3D Short (Karakter Kartun 2D Stickman di Dunia 3D Penuh Warna)
> **Prompt Siap Pakai:**
> `"Gunakan skill cartoon-3d-short untuk membuat video cerita sejarah unik bergaya kartun 2D di dunia 3D tentang: [Kisah Unik Bagaimana Kopi Pertama Kali Menyebar ke Seluruh Dunia]. Kerjakan otomatis sampai MP4 selesai."`

- **Contoh yang sudah jadi di studio ini**:
  - `remotion/videos/bridge/` (*"The Bridge That Fell for a Song"*)
  - `remotion/videos/cnut/` (*"King Cnut vs The Ocean Tide"*)
  - `remotion/videos/kakarut/` (*"Asal-Usul Nama Kota Garut: Kakarut"*)

---

### 7. Gaya Archival & Animated Map Historical Series (`ipm-premium-documentary-studio`)
> **Prompt Siap Pakai:**
> `"Gunakan skill ipm-premium-documentary-studio untuk membuat episode dokumenter sejarah bergaya arsip & peta kartografi bergerak tentang: [Jalur Perdagangan Rempah Nusantara Abad ke-16]. Kerjakan otomatis sampai MP4 selesai."`

- **Contoh yang sudah jadi di studio ini**:
  - `ipm-chronicles/` & `remotion/videos/historical-diorama/`

---

### 8. Gaya Promo Produk / Aplikasi / SaaS (`saas-product-promo`)
> **Prompt Siap Pakai:**
> `"Gunakan skill saas-product-promo untuk membuat video peluncuran aplikasi [Nama Aplikasi Kamu] dengan sub-gaya [Clean UI Demo / Continuous Workflow / High-Energy 3D Hype Reel]. Kerjakan otomatis sampai MP4 selesai."`

---

## Langkah 3 — Melihat Preview Langsung di Browser (Opsional)

Jika kamu ingin melihat daftar seluruh video yang ada di studio ini secara langsung di browser:
```powershell
npm run studio
```
Lalu buka **`http://localhost:3000`** di browser kamu!
