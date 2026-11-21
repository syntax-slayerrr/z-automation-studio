---
name: earth-24h-celestial-docu
description: >-
  Produce a 100% pure-code 2D Celestial Clock & Deep-Time Evolution Documentary Short (9:16 vertical,
  60-90s, 30 fps, Remotion + SVG/Canvas procedural animation) in the viral "Jika Sejarah Bumi Dipadatkan
  Jadi 24 Jam" style. Features an ornate rotating 24-hour astrolabe/celestial clock dial with glowing
  era sector arcs, dynamic digital timestamp & duration counters, multi-layer painterly silhouette
  dioramas (molten Hadean Earth, primordial ocean, microscopic cell division, Mesozoic dinosaurs under
  moonlight, and the final 3-second human civilization sliver at 23:59:57), deckle-edge parchment
  karaoke subtitle cards, ElevenLabs eleven_v4 Indonesian storytelling VO, and a -14.5 LUFS cinematic
  score. Use whenever the user asks for a video "dipadatkan jadi 24 jam", "jam kosmik 24 jam", "seperti
  video Sejarah Bumi 24 Jam", "kalender kosmik", or compressing a long timeline (Earth, Universe,
  Internet, Indonesia, AI, Evolution) into a 24-hour clock.
---

# 24-Hour Celestial Clock & Deep-Time Documentary (`earth-24h-celestial-docu`)

## Quickstart untuk Pemula / Orang Awam (1-Prompt Mode)
Pengguna awam **TIDAK** perlu menulis kode. Jika pengguna hanya mengetik prompt singkat seperti:
> *"Buatkan video gaya **Earth 24 Jam** tentang **[Bagaimana Jika Sejarah Alam Semesta / Sejarah Internet / Sejarah Nusantara Dipadatkan Jadi 24 Jam]**"*

**Instruksi Otomatis untuk AI Agent:**
1. Gunakan skill `brutal-storyteller` untuk menyusun naskah 6–7 babak berbasis **Konversi Waktu 24 Jam** (`00:00` → `04:00` → `12:00` → `21:00` → `22:45` → `23:59:57`), di mana fenomena modern baru muncul di **detik-detik terakhir sebelum tengah malam** (efek *cosmic awe*).
2. Salin struktur golden reference dari `remotion/videos/earth-24h/` (`Earth24Hours.tsx`, `painterlyVectors.ts`, `story.ts`) dan pipeline audio dari `human-fire/scripts/build_vo_and_sfx.mjs` & `build_sound_mix.py` ke folder proyek baru `<slug>/`.
3. Jika `.env` belum memiliki `ELEVENLABS_API_KEY`, pandu pengguna menyalin `.env.example` menjadi `.env` dengan bahasa Indonesia yang ramah.
4. Jalankan otomatis: sintesis VO + SFX → mix audio `-14.5 LUFS` → bangun komponen visual Remotion → verifikasi contact sheet 12 frame → render MP4 final!

---

## Golden Reference di Repository
- **Komponen Visual & Animasi Jam Kosmik**: `remotion/videos/earth-24h/Earth24Hours.tsx`
- **Vektor Siluet Painterly (Dinosaurus, Bulan, Mikroba, Kawah)**: `remotion/videos/earth-24h/painterlyVectors.ts`
- **Data Timing & Counter**: `remotion/videos/earth-24h/story.ts`
- **Preview / Render Command**: `npm run render:earth24h` / `npm run still:earth24h`

## DNA Visual & Aturan Wajib (1:1 Craft)

1. **Ornate 24-Hour Celestial Astrolabe Clock Dial**:
   - Dial jam melingkar berlapis emas-perunggu (`#E6C687`, `#9E7B46`) dengan 24 penanda jam Romawi/angka, jarum jam & menit berputar dengan *motion-blur arc* saat waktu melesat cepat, serta **busur sektor berwarna (arc highlight)** yang menyala menunjukkan proporsi durasi suatu era (misal: era mikroba mengisi >75% lingkaran, sedangkan manusia hanya garis tipis `0.2°` di `23:59:57`!).
2. **Transisi Kamera Kamera-ke-Dalam-Jam (*Clock-to-Diorama Zoom*)**:
   - Kamera secara dinamis melakukan *zoom-in* menembus pusat lingkaran jam masuk ke lanskap diorama layar penuh (lautan purba, hutan Mesozoikum), lalu *zoom-out* kembali ke dial jam saat berpindah era!
3. **Live Rolling Counters & Digital Timestamp HUD**:
   - Tampilkan angka yang bergulir secara real-time sesuai narasi (misal: `00:00:00` → `04:00` → `22:45` → `23:59:57`, atau counter durasi `3.000.000.000 TAHUN` vs `3 DETIK`).
4. **Palet Warna Twilight Parchment (Zero `#000` / `#fff`)**:
   - Gunakan latar langit malam plum-indigo dalam (`#120B1D` → `#241734`), cahaya kawah/matahari amber-emas (`#FFB347`, `#FFE599`), kabut atmosfer berlapis, dan kartu subtitle perkamen sobek (*deckle-edge parchment card*) di bagian bawah.
5. **Audio & Mastering Broadcast (`-14.5 LUFS`)**:
   - Gunakan suara narator Indonesia yang hangat dan kontemplatif (ElevenLabs `eleven_v4`), dipadukan dengan efek suara *clock ticking / time-warp whoosh / deep primordial ambience* (`eleven_text_to_sound_v3`) dan skor musik orkestra/ambient berlisensi.
