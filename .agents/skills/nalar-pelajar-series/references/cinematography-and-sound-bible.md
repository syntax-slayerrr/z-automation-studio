# 5-Pillar Drama Cinematography & Living Sound Design Bible (*Nalar Pelajar Series*)

Panduan penyutradaraan kamera dan tata suara hidup berstandar broadcast untuk Episode 2+ seri **Nalar Pelajar (PC IPM Panawuan)**.

---

## 1. 5 Pilar Sinematografi Drama (Anti-Video Kaku!)

Acuan implementasi deterministik: [NalarPelajar3DCanvas.tsx](file:///d:/PROJECTS/z-automation-studio/remotion/videos/ipm-nalar-pelajar/scene3d/NalarPelajar3DCanvas.tsx).

1. **Bahasa Lensa Dinamis (`FOV 27.8° – 52°`):**
   - `46°–52°` (*Wide / Establishing*): ruang aula penuh, jalan kampung pagi, eskalasi 50+ bubble.
   - `36°–42°` (*Medium Narrative / OTS*): dialog, aktivitas kamar, makro meja POV (`42°` steady).
   - `27.8°–31°` (*Telephoto Portrait / ECU*): momen intim menutup mata, napas tenang, klimaks kalimat kunci.
2. **Motivasi Emosi Kamera (*Breath → Stillness* & *Hitchcock Dolly-Zoom*):**
   - **Dual-Frequency Handheld Breath:** Gerak napas mikro organik (`0.003–0.006m` normal, `0.009–0.012m` cemas) — lalu **KUNCI 100% DIAM (`camBreathAmp = 0.0`, telephoto `29°`)** tepat pada detik hening terobosan (*breakthrough*) agar penonton merasakan ketenangan mendadak!
   - **Hitchcock Vertigo Dolly-Zoom (*Zolly*):** Pada puncak konflik batin/kecemasan, dorong kamera maju dekat ke wajah sambil melebarkan `FOV` (`31° → 49°`) + *Dutch tilt* `-0.08 rad` + tremor detak jantung!
3. **Multi-Cut Coverage pada Adegan Panjang (>10 detik):**
   - Jangan biarkan 1 sudut kamera statis lebih dari 6–8 detik! Pecah menjadi ritme drama:
     - **Aksi Layar/Belajar:** *3/4 Medium* → **Intimate Over-The-Shoulder (OTS)** ke layar HP/laptop → *Portrait Push-In*.
     - **Perjalanan Outdoor → Indoor:** *Low-Angle Tracking* sepatu melangkah di *dappled leaf shadows* → *Crane Reveal* naik memperlihatkan lingkungan kampung & spanduk → *Cut* ke ruang acara ramai.
     - **Dialog 2 Pihak:** *Audience/Peer OTS* (bingkai bahu depan 20–25%, slide/lawan bicara 100% tidak terpotong) ↔ **Stage Reverse-OTS** ↔ **3-Cut Shot–Reverse-Shot** (Medium → OTS ke slide/pendengar → 85mm Tight Close-Up punchline!).
4. **Arc Pencahayaan Emosi (*Practical Lighting Storytelling*):**
   - Setiap perubahan emosi wajib disertai perubahan temperatur cahaya nyata: *Warm Tungsten Lamp* (`#FFE8C6`) ↔ *Cool Moonlight Indigo* (`#8BB7F4`) ↔ *Crimson Internal Conflict Rim* (`#EF4444`) ↔ *Golden Daylight / Breakthrough Beam* (`#FFC41E`).
5. **Adaptive Frosted-Glass Subtitles & Minimalist Brand Closing:**
   - 1 kapsul kaca buram (`rgba(38, 46, 68, 0.56)`, `backdrop-filter: blur(10px)`), berpindah otomatis ke `top` (saat HP/tangan/objek di bawah) atau `lower` (saat bubble di atas), kata kunci emosi kuning emas (`#FACC15`), **0 watermark**.
   - Tutup film dengan **3.2 detik ruang bernapas** menampilkan logo resmi Pentagon IPM + judul **`Nalar Pelajar`** + subjudul episode saat musik resolusi memuncak lalu *fade out* mulus.

---

## 2. Arsitektur Tata Suara Hidup (Default: Instrumental Berlisensi + 15–25 Foley)

Acuan skrip mixer: [build_living_sfx.mjs](file:///d:/PROJECTS/z-automation-studio/ipm-nalar-pelajar/scripts/build_living_sfx.mjs) & [build_sound_mix.py](file:///d:/PROJECTS/z-automation-studio/ipm-nalar-pelajar/scripts/build_sound_mix.py).

### A. Peta Pemeran Suara Seri (*ElevenLabs `eleven_v4`, `languageCode: "id"`*)

| Peran | Voice ID | Gaya & Akustik | Status |
|---|---|---|---|
| **Narator Seri** | Eric (`cjVigY5qzO86Huf0OWal`) | Hangat, tenang, reflektif (`tempo ~1.08–1.09`, `stability 0.68`) | **TERKUNCI lintas semua episode** |
| **Wisnu** | Liam (`TX3LPaxmHKxFdv7VOQHJ`) | Pelajar muda ekspresif (`tempo ~1.08`, akustik `inner` / `inner_tense` / `hall_mic`) | **TERKUNCI setiap Wisnu tampil** |
| **Moderator / Pembina** | Brian (`nPczCjzI2devNBz1zQrb`) | Berwibawa hangat (`tempo ~1.07`, EQ `pa_mic` aula) | **TERKUNCI setiap tampil** |
| **Kader Perempuan / Teman** | Sarah (`EXAVITQu4vr4xnSDxMaL`) atau Jessica (`cgSgspJ2msm6clMCkdW9`) | Natural hangat remaja pelajar | Pilih konsisten bila karakter muncul ulang |
| **Teman Pria Baru** | Chris (`iP95p4xoKVk53GoZ742B`) | Akrab santai | Karakter pendukung baru |

### B. Musik Latar Instrumental Berlisensi Multi-Babak (Otomatis, Zero User Upload!)
Untuk Episode 2+, default musik menggunakan **3–4 stem instrumental berlisensi** (Mixkit Free License / Studio Licensed, **0 bentrok lirik dengan dialog**!) yang dipahat lewat kurva *raised-cosine dB* di Python:

| Babak Drama | Mood Instrumental | Level Relatif di Bawah VO | Perlakuan Sinematik |
|---|---|---|---|
| **Babak I (Pembuka & Konflik)** | Piano malam / akustik lembut (`mixkit-148-forest-mist-whispers.mp3` atau setara Mixkit) | `-16.5` s/d `-18.5 dB` (naik `-12.5 dB` di jeda napas) | **LPF 700 Hz + Hard Silence Cut (`-∞`)** tepat sebelum kalimat inti pembalik (*"berani."*)! |
| **Babak II (Refleksi & Metode)** | Piano hangat tenang / gitar fingerstyle instrumental | `-17.0 dB` stabil, *zero-phase vocal-pocket dip* (`900–3400 Hz`, `-3.5 dB`) | Memberi kejernihan 100% saat edukasi metode berpikir/aksi praktis! |
| **Transisi Dunia Nyata (Outdoor → Ruang Ramai)** | **Music OFF / Sangat Tipis (`-24 dB`)** | Beri panggung 100% ke **foley dunia nyata** | Ayam kampung, langkah kaki, gemuruh kelas/aula terasa benar-benar hidup! |
| **Klimaks Perang Batin** | Tension ambient gelap (`music_oppenheimer_ambient.mp3`) + ruang teredam *underwater LPF 480 Hz* + detak jantung | `-19.0 → -17.5 dB` → **HARD CUT MATI** pada titik terobosan! | Diikuti **`0.9s` hening total + helaan napas** sebelum musik kemenangan masuk! |
| **Resolusi & Penutup `Nalar Pelajar`** | Instrumental inspiratif hangat (`mixkit-587-discover.mp3` atau piano+strings berlisensi) | `-16 dB` saat dialog → **Mekar Penuh `-9.5 dB`** pada 3.2 detik kartu akhir **`Nalar Pelajar`** | *Cosine tail fade-out* 1.4 detik ke hening bersih tepat di frame terakhir! |

*(Catatan: Jika pada episode tertentu user secara eksplisit melampirkan lagu bervokal, aktifkan mode **Dynamic Vocal-Pocket Carving EQ `-6.5 dB` (`900–3400 Hz`) + Mid-Side Stereo Wrap (`mid × 0.71`, `side × 1.29`)** dan *bar-locked splice* seperti di `ipm-nalar-pelajar/scripts/build_sound_mix.py`.)*

### C. Katalog 15–25 Layer Foley & Ambience Dunia Nyata (`eleven_text_to_sound_v3` + CC0)
Setiap lokasi & gestur fisik wajib punya jejak suara nyata (bukan *whoosh/beep* kartun murahan!):
- **Kamar Malam:** Jangkrik kampung tipis dari luar jendela (`HPF 360 Hz`), room tone kamar CC0, klik saklar lampu, gesekan ibu jari di kaca HP, goresan pulpen di kertas, bunyi buku ditutup tegas.
- **Pagi Kampung / Sekolah:** Kokok ayam jago + burung pagi Indonesia, langkah sneakers di *paving block* / koridor, samar obrolan santai teman berjalan.
- **Ruang Sosial (Aula / Kelas / Masjid):** Gemuruh obrolan 40 pelajar yang **otomatis mengecil (*keyframed hush*)** tepat saat pembicara klik mikrofon PA, hening canggung (dengung AC halus + 1 batuk kecil & desiran kertas), derit kursi kayu & gesekan kain saat gelisah/berdiri, *underwater low-pass* ruang saat panik, detak jantung, gumaman serempak peserta menoleh, dan tepuk tangan apresiasi hangat.

### D. Target Broadcast Mastering & Listening Gate (WAJIB!)
- **Master 2-Pass Linear Loudnorm (`ffmpeg`):**
  - Target Stereo **dan** Mono: **`-14.5 LUFS ± 0.3`**, **True Peak `<= -1.6 dBFS`**, `LRA ~ 2.5–7.0 LU`, `AAC 48 kHz 256 kbps`.
- **Direct Ear Audit (`read_file`):** Wajib potong 4 segmen kritis (pembuka, transisi outdoor→indoor, klimaks hening→terobosan, penutup) ke `scratch/mix_qa/*.mp3` dan dengarkan langsung via `read_file` sebelum Checkpoint 2!
