# Forensic Frame-by-Frame REA Report — `galeri-motion-characterflow.mp4`

Laporan bedah forensik (*Reverse-Engineering Analysis* / `rea-video`) lengkap terhadap video referensi **`galeri-motion-characterflow.mp4`** sebagai fondasi **Skill #12 (`galeri-motion-characterflow`)**.

---

## 1. Metadata Teknis Terverifikasi (`ffprobe` & `ebur128`)

| Parameter | Nilai Terukur |
|---|---|
| **Resolusi & Rasio** | `720 × 1280` (9:16 vertikal; saat produksi studio di-upgrade ke **`1080 × 1920` Full HD**) |
| **Frame Rate** | **`60.00 fps`** (`2,316 frames`, progressive `yuv420p`, `bt709`) |
| **Durasi Total** | **`38.60 detik`** (`7.33 MB`, H.264 High Profile, `1.48 Mbps`) |
| **Audio Stream** | AAC Stereo, `48 kHz`, `98 kbps` |
| **Loudness (`ebur128`)** | Integrated: **`-13.7 LUFS`** · True Peak: **`-1.8 dBFS`** · LRA: `2.1 LU` |
| **Sumber Visual** | **100% Pure 3D PBR Soft-Vinyl / Toy-Clay Render** (ZERO AI video artifacts, ZERO cel-toon black outlines, stabilitas geometri & refleksi 100% konsisten lintas 2.316 frame!) |

---

## 2. Bedah Visual & Material (Kenapa Terasa Mahal & Empatik?)

1. **Karakter 3D Bergaya *Designer Vinyl Toy*:**
   - Proporsi kepala sedikit besar (*stylized charming*), kulit cokelat sawo matang satin hangat (`roughness ~0.40`, sedikit *clearcoat* `0.12`, *radial soft cheek blush*).
   - **Kelopak Mata 3D Fisik:** Bukan sekadar ganti gambar mata 2D — saat tidur (`00:00`), terjaga (`04.5s`), atau tarik napas (`26.5s`), kelopak mata 3D berbentuk kubah melengkung benar-benar menutup/membuka di depan bola mata *glossy*!
   - **Rambut 3D Glossy Sculpted Waves:** Warna cokelat tua pekat (`roughness ~0.22`) dengan 4–5 gumpalan gelombang lembut yang langsung memantulkan cahaya merah saat adegan cemas (`18.5s–26.5s`) dan cahaya biru saat adegan tenang!
   - **Tangan 5-Jari Kapsul Terartikulasi:** Terlihat sangat jelas di detik `02.8s` (meraih saklar lampu) dan detik `30.1s–32.1s` (POV makro tangan kiri menahan buku spiral merah & tangan kanan memegang pulpen biru menulis `"Latihan presentasi 10 menit aja"`).
2. **Satu Ruangan Kamar 3D yang Kaya Detail Konsisten:**
   - Tempat tidur dengan *headboard* empuk 4-panel warna teal (`#1EA7B5`), bantal putih lembut, selimut biru pastel berpola bintang kuning kecil.
   - Meja nakas kayu satin di sisi kiri ranjang berisi: **jam digital hitam** (`02:00` → berganti `03:00` di ending!), **lampu meja kap kain putih** dengan tiang kuningan (sumber cahaya *practical* utama!), dan **buku catatan spiral merah** (yang sejak detik `00:00` sudah diletakkan di meja — *foreshadowing* sebelum diambil di detik `29.5s`!).
   - Dinding biru pastel dengan rak kayu berisi **deretan buku warna-warni + pot kaktus clay**, serta **bingkai foto poster gunung senja oranye-ungu** (memberi titik kontras hangat di sudut kanan atas).
3. **Sistem Visual Metaphor: Translucent 3D Thought-Bubbles:**
   - Gelembung melayang berbentuk lingkaran kaca buram putih-transparan dengan tepi tipis berwarna **cyan muda** (`05.5s–18.4s`) → membesar & bertambah eksponensial dari `1 → 10 → 100` memenuhi seluruh bidang vertikal!
   - Di dalam gelembung besar terdapat **miniatur adegan 3D** (karakter berdebat dengan rekan, berdiri canggung di depan layar presentasi, menatap layar HP) + ikon kecil (`?`, `✕`, jam, awan hujan).
   - Pada detik `18.5s`, **seluruh warna cincin & ikon gelembung berubah merah menyala** (`💬`, `✕`, awan hujan merah) serentak dengan lampu *crimson rim-light* ruangan!

---

## 3. Timeline Shot-by-Shot Lengkap (`scdet` + Inspeksi Frame-by-Frame)

| Shot | Rentang Waktu | Jenis Cut | Framing & Gerakan Kamera | Visual & Aksi 3D | Lighting & Warna | Posisi Subtitle & Teks Verbatim |
|---|---|---|---|---|---|---|
| **SH01** | `00.00 – 04.40s` | Start | High-Angle 3/4 Bed → slow push-in | Karakter tidur telentang (`02:00`), tangan kanan terangkat (`02.0s–03.0s`) mematikan lampu meja (`02.8s`). | Warm Tungsten (`#FFB86B`) → **Snap mati ke Cool Moonlight Blue** | Bawah-tengah: *"Jam 2 pagi, lampu udah mati, tapi otakmu justru mulai..."* |
| **SH02** | `04.40 – 05.53s` | Hard Cut | **Sudden Top-Down ECU Wajah** | Kelopak mata 3D terbuka mendadak lebar, pupil melirik cemas ke kanan atas, alis mengerut. | Cool Moonlight diagonal lembut | Bawah dagu: *"...rapat darurat."* (`rapat darurat` emas) |
| **SH03** | `05.53 – 11.20s` | Hard Cut (`scdet 5.53s`) | Medium Low-Angle Front (duduk tegak di kasur) | Menggaruk belakang kepala, melirik ke 2 bubble cyan bercahaya berisi diorama mini 3D. | Cool Blue Moonlight + cyan bubble rims | **Pindah ke ATAS (`top: 10%`)**: *"Tadi aku salah ngomong nggak ya? Besok kalau gagal gimana?"* |
| **SH04** | `11.20 – 18.48s` | Continuous Pull-Out | Smooth Pull-Back Wide | Karakter menatap ke atas saat bubble meledak `1 → 10 → 100` memenuhi seluruh dinding & langit-langit. | Dense luminous frosted-white & cyan orbs | Atas → Bawah-tengah: *"Satu pikiran berubah jadi 10, lalu 100. Padahal, sebagian besar skenario itu bahkan belum tentu terjadi."* |
| **SH05** | `18.48 – 25.30s` | Hard Cut (`scdet 18.48s`) | Tilted High-Angle Medium Close-In | Membungkuk **menutup kedua telinga** dengan kedua tangan; bubble & ikon berubah **MERAH KRIMSON** (`💬`, `✕`, awan hujan). | **Crimson Alarm Rim-Light** menyapu rambut glossy & kaus kuning | Bawah → Atas: *"Otakmu mencoba melindungimu dengan memprediksi bahaya. Tapi kadang, alarmnya terlalu sensitif."* |
| **SH06** | `25.30 – 28.90s` | Hard Cut (`scdet 25.30s`) | Symmetrical Medium Close-Up | Kepala terangkat, tangan turun, **kelopak mata 3D terpejam tenang** tarik napas; cahaya merah **luruh kembali ke biru sejuk** & bubble pudar! | **Crimson → Cool Calm Blue Reset** (`26.5s → 28.2s`) | Tengah-bawah: *"Jadi kalau pikiranmu mulai berisik, berhenti sebentar."* |
| **SH07** | `28.90 – 30.07s` | Smooth Pan / Cut | Side OTS ke meja nakas | Menyalakan lampu meja hangat (percikan partikel bintang emas!) & meraih buku catatan spiral merah. | **Warm Cozy Tungsten Lamp On!** | Bawah: *"Tulis apa yang bisa..."* |
| **SH08** | `30.07 – 32.12s` | Hard Cut (`scdet 30.07s`) | **First-Person / Top-Down POV Macro Buku** | Tangan kiri 5-jari menahan buku spiral (`Sabtu, 1 Nov`), tangan kanan memegang pulpen biru menulis live: **`"Latihan presentasi 10 menit aja"`**! | Warm focused desk light on crisp white ruled paper | Bawah: *"...kamu kendalikan besok,"* (`kendalikan` emas) |
| **SH09** | `32.12 – 38.60s` | Hard Cut (`scdet 32.12s`) | **Full-Circle Mirror Pull-Back Wide** (identik SH01!) | Menutup buku, rebahan tenang, tangan terangkat mematikan lampu (`34.5s`), jam berubah `02:00 → 03:00`, tidur damai, kamera mundur pelan. | Warm Tungsten → **Soft Peaceful Moonlight Blue** | Bawah: *"...karena nggak semua masalah harus selesai malam ini."* (`malam ini` emas) |

---

## 4. Transkrip Lengkap & Peta Audio Referensi

- **Narasi Verbatim (`~84 kata` dalam `38.6s`, tempo santai-empatik):**
  > *"Jam 2 pagi, lampu udah mati, tapi otakmu justru mulai rapat darurat. Tadi aku salah ngomong nggak ya? Besok kalau gagal gimana? Satu pikiran berubah jadi 10, lalu 100. Padahal, sebagian besar skenario itu bahkan belum tentu terjadi. Otakmu mencoba melindungimu dengan memprediksi bahaya. Tapi kadang, alarmnya terlalu sensitif. Jadi kalau pikiranmu mulai berisik, berhenti sebentar. Tulis apa yang bisa kamu kendalikan besok, karena nggak semua masalah harus selesai malam ini."*
- **Lapisan Suara:**
  1. **VO:** Pria dewasa muda Indonesia, dekat, lembut, berempati, jeda napas alami di tiap titik emosional.
  2. **Musik:** Ambient nocturnal pad + piano minimalis yang naik lembut pada klimaks merah (`19–25s`) dan mereda hangat penuh kelegaan pada fase menulis & tidur (`27–38.6s`).
  3. **Foley Taktil:** Klik saklar lampu (`02.8s`, `29.2s`, `34.5s`), pop gelembung halus bertingkat (`06–15s`), denyut tegang teredam (`19–24s`), hembusan napas tenang (`27.0s`), dan goresan pulpen di kertas (`30.2–32.0s`).
