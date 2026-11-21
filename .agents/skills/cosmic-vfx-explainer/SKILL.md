---
name: cosmic-vfx-explainer
description: >-
  Produce a 100% pure-code Sci-Fi Astrophysics & Space VFX Explainer Short (9:16 vertical, 60-95s,
  30 or 60 fps, Remotion + Custom GLSL Raymarching/Relativistic Shaders + First-Person Visor POV)
  proven on "Apa yang Terjadi Jika Kamu Jatuh ke Lubang Hitam?" (black-hole/ & kurzgesagt/). Features
  custom GLSL gravitational lensing, relativistic Doppler-beamed accretion disk, photon ring (1.5 Rs),
  event horizon crossing (1.0 Rs), first-person curved astronaut helmet visor glass reflections,
  analog/digital wristwatch time-dilation HUD comparisons, spaghettification tidal-force vectors,
  editorial serif telemetry headers, ElevenLabs eleven_v4 Indonesian narration + deep cosmic Sound-V3
  sub-bass foley mastered to -14.5 LUFS, and a Seamless Visual Loop returning to Frame 0. Use whenever
  the user asks for a video about "lubang hitam / black hole", "astronomi / antariksa / kosmos",
  "fisika kuantum / relativitas", "POV astronot", or any high-end sci-fi space shader explainer.
---

# Cosmic & Astrophysics VFX Explainer (`cosmic-vfx-explainer`)

## Quickstart untuk Pemula / Orang Awam (1-Prompt Mode)
Pengguna awam **TIDAK** perlu mengerti shader GLSL atau fisika relativitas. Cukup ketik 1 kalimat di AI agent:
> *"Buatkan video gaya **Cosmic VFX Explainer** tentang **[Apa yang Terjadi Jika Kita Masuk ke Lubang Cacing / Menjelajahi Bintang Neutron / Tabrakan Galaksi Andromeda]**"*

**Instruksi Otomatis untuk AI Agent:**
1. Gunakan skill `brutal-storyteller` untuk menulis naskah perjalanan sudut pandang orang pertama (*First-Person Astronaut Journey*: mulai dari jarak aman → mendekati batas kritis → fenomena fisika ekstrem → paradoks ruang-waktu → *seamless loop* kembali ke kalimat pembuka).
2. Gunakan `remotion/videos/black-hole/` (`BlackHoleShort.tsx`, `BlackHoleGL.tsx`, `story.ts`) dan `black-hole/scripts/` sebagai template utama.
3. Buat shader GLSL spesifik untuk fenomena kosmik tersebut (lensing gravitasi, pulsar beam, nebula plasma, supernova shockwave, atau warp tunnel) + overlay kaca helm astronot (*First-Person Visor POV*) + instrumen telemetri (`1,5 Rs`, suhu Kelvin, dilatasi waktu).
4. Jalankan pipeline otomatis: VO ElevenLabs `eleven_v4` + SFX kosmik `eleven_text_to_sound_v3` → mix `-14.5 LUFS` → render 12-frame QA contact sheet → render MP4 final (`--gl=angle --concurrency=1`).

---

## Golden Reference di Repository
- **Engine Shader Relativistik & Lensing GLSL**: `remotion/videos/black-hole/BlackHoleGL.tsx`
- **Komposisi POV Visor Astronot, Jam Dilatasi Waktu & Telemetri**: `remotion/videos/black-hole/BlackHoleShort.tsx`
- **Varian 2D/3D Kurzgesagt Space Style**: `remotion/kurzgesagt/KurzgesagtBlackHole.tsx`
- **Pipeline Audio & Chunked Render**: `black-hole/scripts/` (`npm run render:blackhole`, `npm run still:blackhole`)

## 6 Pilar Visual & Audio Wajib

1. **Custom GLSL Relativistic / Space Shader (`BlackHoleGL.tsx`)**:
   - Jangan gunakan gambar luar angkasa statis! Bangun shader GLSL prosedural dengan efek *gravitational lensing* (pembelokan cahaya bintang latar), *Doppler beaming* pada piringan akresi plasma (sisi mendekat lebih terang biru-putih, sisi menjauh merah-oranye redup), serta cincin foton (*photon sphere*) yang tajam.
2. **First-Person Astronaut Visor POV & Time-Dilation Props**:
   - Gunakan lengkungan pantulan kaca helm astronot halus di tepi layar saat adegan penyelaman (*dive*), dipadukan dengan perbandingan visual **2 Jam Tangan / Kronometer** (Waktu Astronot yang berjalan normal vs Waktu Pengamat Bumi yang melambat lalu membeku di *Event Horizon*).
3. **Dramatic Acoustic Hush (Hening Ruang Hampa)**:
   - Saat melewati batas kritis (seperti *Event Horizon* atau pusat fenomena), buat momen kontras dramatis di mana musik dan gemuruh meredup sejenak menjadi detak jantung / keheningan kosmik yang mencekam sebelum masuk ke klimaks.
4. **Editorial Serif Telemetry Header**:
   - Tampilkan indikator jarak/status ilmiah yang elegan di bagian atas (`LUBANG HITAM · DILATASI WAKTU` → `1,5 RS · BOLA FOTON` → `1,0 RS · EVENT HORIZON` → `RUANG ↔ WAKTU` → `∞ · SINGULARITAS`).
5. **Deckle-Edge / Clean Cinema Subtitles**:
   - Subtitle word-by-word sinkron karakter ElevenLabs di area aman bawah (`9:16`), bebas dari UI TikTok/Reels.
6. **Seamless Cosmic Loop (Frame Terakhir = Frame 0)**:
   - Kamera menembus singularitas/cahaya putih-emas di akhir video dan menyatu mulus kembali ke pandangan kosmik Frame 0.
