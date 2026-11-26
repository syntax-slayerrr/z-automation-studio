# Kitab Lengkap Semua Instrumen Visual & Instrumen Audio (`/series-evolusi`)

Dokumen ini membedah **100% seluruh instrumen** di dalam video referensi — baik **8 Instrumen Visual/Ilmiah di layar** maupun **6 Instrumen Musik/Akustik + 12 Cue Foley Presisi Milidetik** — beserta cara memakainya kembali secara 1:1 untuk episode selanjutnya.

---

## BAGIAN A — 8 Instrumen Visual & Ilmiah (1:1 On-Screen Instruments)

Seluruh instrumen di bawah telah dikodekan siap pakai di [`remotion/lib/series-evolusi/`](file:///d:/PROJECTS/z-automation-studio/remotion/lib/series-evolusi/):

### 1. Instrumen #1 — Pengukur Skala & Kedalaman Tepi Kanan (`RightScaleRuler`)
- **Kemunculan di Referensi:** `f=045–100` (mengukur kedalaman penyelaman) & `f=515–858` (skala kedalaman jaringan pada layar diagnostik USG).
- **Anatomi Geometris (`1080×1920`):**
  - Posisi vertikal: `top: 10.5%` s.d. `bottom: 80.5%`, rata kanan di `x = 93.8%`.
  - Terdiri dari **6 garis mayor putih** (`38px × 3px`, `opacity: 0.82`) dan **4 sub-garis minor** per interval (`18px × 2px`, `opacity: 0.40`) = sistem pembagian metrik `5 sub-unit`.
  - **Indikator Segitiga Emas (`◀` `#F5B841`, `20px`)** meluncur mulus di sisi kiri garis mayor (`indicatorProgress: 0..1`) mengikuti kedalaman penyelam, ketinggian gunung, suhu ekstrem, atau skala waktu!
- **Adaptasi Episode Berikutnya:**
  - *Ep. Sherpa Himalaya*: Indikator naik dari bawah ke atas mengukur elevasi `0 m → 8.848 m`!
  - *Ep. Inuit Arktik*: Indikator turun mengikuti suhu ekstrem `+20°C → -40°C`!

### 2. Instrumen #2 — Pemindai X-Ray Boolean Sferis 3D (`AnatomicalXRayTorso3D`)
- **Kemunculan di Referensi:** `f=450–504` (saat probe USG menyentuh perut) & `f=1068–1225` (saat membuktikan limpa penenun jaring yang jarang menyelam tetap besar).
- **Rahasia Teknis 1:1 (Bukan Sekadar Fade Opacity!):**
  - Tubuh luar adalah **siluet anatomis gelap matte (`#0D1821`–`#17120E`)** dengan *rim-light* lingkungan.
  - Saat pemindaian dimulai, sebuah **bola 3D (`uXrayCenter`, `uXrayRadius`) mengembang dari titik kontak alat/organ (`radius 0 → 2.4`)**:
    - Di **luar** bola: kulit siluet gelap tetap utuh, dengan cincin tepi potongan berpendar kuning-emas (`cutEdge glow`).
    - Di **dalam** bola: shader melakukan `discard;` pada kulit gelap dan menyingkap **4 lapis anatomi Fresnel transparan**:
      1. Dinding rongga tubuh kuning-amber (`#8C4E08` → `#F2B43B`).
      2. **14 blok ruas tulang belakang (`vertebrae`) + 10 pasang tulang rusuk melengkung (`TubeGeometry`)** berwarna gading X-ray (`#FFF8E6`).
      3. Organ pembanding atas berwarna oranye-koral (`#D9480F` → `#FF9248`).
      4. **Organ Evolusi Utama** berwarna emas terang (`#C77D0A` → `#FFE047` — bisa diatur `heroOrgan: 'spleen' | 'lungs' | 'heart' | 'stomach' | 'bone_marrow'`).

### 3. Instrumen #3 — Hologram Alat Modern Dicoret Silang (`HolographicScubaTank3D`)
- **Kemunculan di Referensi:** `f=100–149` (*"Tanpa tabung oksigen"*).
- **Anatomi Visual:** Objek alat bantu modern yang lazim dipakai manusia biasa (tabung selam, tabung oksigen pendaki, kacamata renang karet, jaket pemanas) dirender dengan **shader Fresnel cyan aditif (`#0E9EC2` → `#7CF6FF`)**, lalu dicoret dengan **dua bilah diagonal `✕` koral-oranye (`#FF6B35`)** berurutan (`stroke 1` lalu `stroke 2`) untuk menegaskan kehebatan biologis alami subjek.

### 4. Instrumen #4 — Garis Penunjuk Ilmiah + Cincin Target (`ScientificCalloutLine`)
- **Kemunculan di Referensi:** `f=159–192` (*"cuma kacamata kayu"*), `f=438–462` (*"peneliti"*), `f=600–690` (*"Limpa orang Bajo"*).
- **Anatomi Visual:** Garis lurus tipis putih bersih (`2.6px` pada `1080w`, `#F8FAFC`) yang tumbuh (`drawFrames = 10`) dari dekat teks menuju objek, dan **berhenti tepat di tepi luar cincin target kecil berlubang (`○`, radius `11px`, tanpa isi)** sehingga detail objek yang ditunjuk tidak tertutup titik tebal!

### 5. Instrumen #5 — Konsol & Layar Diagnostik Ilmiah (`DiagnosticUltrasoundScreen`)
- **Kemunculan di Referensi:**
  1. **Wujud Fisik 3D (`f=390–444`)**: Mesin USG portabel berbingkai kayu hangat dengan deretan tombol fisik 3D persegi dan kabel probe hitam yang menjulur ke tangan peneliti.
  2. **Layar Penuh B-Mode Sektor (`f=522–700`)**: Kipas `68°` di atas latar cokelat espresso `#190D05` ber-grid tipis, lengkap dengan **derau akustik Rayleigh (`15 fps`)**, **3 bayangan akustik gelap tulang rusuk**, lengkung fasia terang, pembuluh darah hilus gelap di dalam limpa, dan animasi **ekspansi ukuran organ (`organScale: 1.0 → 1.24` = `+50%` luas!)**.
  3. **Mode Komparasi Bertumpuk (`f=701–779`)**: Dua layar sektor bertumpuk atas-bawah (*Populasi Kontrol/Tetangga* di atas vs *Populasi Berevolusi* di bawah), dilengkapi **jejak titik-titik kaliper sonografi klinis `+ · · · +` (`#D8F5FF`)** mengelilingi organ yang membesar!
  4. **Mode Morfosis Partikel Speckle (`f=780–855`)**: Kontur partikel speckle organ bermorfosis mulus (`SDF interpolation`) menjadi ikon metafora sehari-hari (`tabung oksigen`, `baterai`, `perisai`, `kantong udara`) lalu kembali menjadi organ!

### 6. Instrumen #6 — Peta Kartografi Garis Pantai Bioluminesensi (`BioluminescentMap2D`)
- **Kemunculan di Referensi:** `f=354–384` (*"dari Sulawesi"*), dibingkai masuk & keluar oleh `CloudCurtainPortal`.
- **Anatomi Visual:** Proyeksi `d3-geo` Mercator berlatar laut biru batimetri (`#003C72`–`#095A96`), daratan pulau hijau zamrud tua (`#1B5B27`–`#2E7338`), dan **garis pantai 2 lapis**: garis dalam krem-mint tajam (`#C2F9EC`, `3.2px`) + pendar neon-cyan lembut di sekeliling pantai (`#1CE2FF`). Label lokasi diletakkan di ruang negatif teluk/laut tanpa kotak latar.

### 7. Instrumen #7 — Simulasi Fisiologi Organ & Aliran Sel 3D (`organSqueeze` + `rbcFlowProgress`)
- **Kemunculan di Referensi:** `f=870–1018` (*"Saat menyelam, dia meremas dan memompa sel darah merah ke seluruh tubuh"*).
- **Anatomi Visual:** Di dalam rongga X-ray transparan yang sedang beraktivitas di habitat aslinya, organ utama berkontraksi (`organSqueeze: 0 → 1`) dan menyemburkan **puluhan keping 3D sel darah merah bikonkaf (`LatheGeometry` discocyte `#E53935`)** yang mengalir mengikuti kurva pembuluh darah ke seluruh tubuh.

### 8. Instrumen #8 — Heliks Ganda DNA 3D *Ball-and-Stick* + Pendar Bioluminesensi Finale (`DnaDoubleHelix3D`)
- **Kemunculan di Referensi:** `f=1238–1290` (*"tertulis di DNA"*) & `f=1385–1493` (*"tubuh manusia ikut berubah"*).
- **Anatomi Visual:**
  - **DNA 3D**: Dua punggung gula-fosfat silinder glossy ber-nodus bola (**Toska `#26C6DA`** & **Amber `#FFA726`**), dihubungkan anak tangga pasangan basa 4 warna (`#F5E6C8`, `#26A69A`, `#E64A19`, `#FFB300`) yang **terpisah celah ikatan hidrogen tipis di sumbu tengah**, disertai huruf **`A`, `T`, `C`, `G`** melayang dengan *optical blur* berdasar jarak Z!
  - **Finale Siluet Pendar Organ**: Siluet gelap manusia utuh di habitatnya dengan **1 titik pendar emas-amber lembut (`BioluminescentOrganOrb3D`)** tepat di lokasi organ yang berevolusi — penutup ikonik setiap episode `/series-evolusi`!

---

## BAGIAN B — Bedah Lengkap Semua Instrumen Musik, Frekuensi & Foley (`1:1 Audio DNA`)

Hasil pemisahan *stem* (`vocals.wav`, `music.wav`, `effects.wav`) dan analisis FFT/spektrogram `20 Hz – 20 kHz` mengungkap rahasia terbesar mengapa audio video ini terdengar **sangat jernih, ilmiah, magis, dan 0% bertabrakan dengan suara narator**:

### 1. Rahasia Emas Spektrum: *The `< 480 Hz` Dark Ostinato Pocket*
Pada spektrogram `music.wav`, **seluruh instrumen musik utama dikunci di bawah `480 Hz`**, sehingga pita frekuensi kejelasan vokal manusia (**`500 Hz – 4.000 Hz`**) **100% KOSONG DARI MUSIK**! Hanya suara narator dan aksen SFX ilmiah pendek (`ping USG`, `kilau DNA`) yang boleh masuk ke wilayah `> 500 Hz`.

### 2. Daftar Lengkap 6 Instrumen Musik & Nada Harmonis (`A Natural Minor`, `86.15 / 172.3 BPM`)

| No | Instrumen Musik / Tonal | Rentang Frekuensi Terukur (FFT) | Pola Ritme & Harmoni | Peran Emosional |
|---|---|---|---|---|
| **M1** | **Dark Felt-Muted Marimba / Kalimba / Plucked Harp-Guitar Ostinato** *(Instrumen Penggerak Utama)* | **`140 Hz – 444 Hz`** (`C#3/D3/E3` s.d. `A3 221Hz`, `C4 263Hz`, `D4 295Hz`, `E4 331Hz`, `F4 351Hz`, **`A4 440.5Hz`**; di-*low-pass filter* lembut di `480 Hz`) | Pola arpeggio ostinato not ke-8 / ke-16 (`172.3 BPM` grid = `0.348s` per ketuk cepat / `86.15 BPM` half-time) yang terus mengalir hipnotis sepanjang `0.0s – 48.5s` (sempat ditahan tipis saat `21.2s–23.3s` untuk memberi ruang angka *"50% lebih besar"*!). | Menciptakan rasa penasaran ilmiah (*scientific curiosity* ala Vox / Lemmino / Kurzgesagt) tanpa pernah menutupi artikulasi konsonan VO! |
| **M2** | **Deep Warm Sub-Bass Synth / Plucked Contrabass** | **`45 Hz – 112 Hz`** (`A2 = 108.0 Hz` → `F2 = 87.9 Hz` → `G2 = 96.0 Hz` → `D2 = 71.9 Hz`) | Progresi akor **`Am – F – G – Dm`**, berganti tiap ~2 bar (`~2.78 detik`), serangan lembut (*rounded attack `25ms`*) dengan *decay* hangat. | Memberi bobot kedalaman samudra & skala waktu evolusi ribuan tahun. |
| **M3** | **Submerged Warm Rhodes / Felt Ambient Pad** | **`180 Hz – 380 Hz`** | Akor panjang tipis (`-26 dBFS`) merajut celah di antara petikan marimba/kalimba. | Menjaga atmosfer bawah air / ruang dokumenter tetap menyatu lintas *cut*. |
| **M4** | **Harmonic Medical Ultrasound Sonar Ping (`Sine/Triangle Bell`)** | **`E7 = 2.637,8 Hz`** (+ harmonik tipis `F#7 2.883 Hz` & `A6 1.800 Hz`) | Bunyi *PING!* klinis pendek (`180 ms` decay) tepat di `14.97s` (saat X-ray terbuka) dan `19.50s` (saat garis tunjuk mengunci *"Limpa orang Bajo"*). **Ditala persis ke nada `E7` (kwint murni dari `A minor`)** sehingga tidak pernah sumbang terhadap musik latar! | Menandakan presisi alat pindai medis nyata. |
| **M5** | **Diagnostic Monitor & Morph Pulse (`Soft Gated Sine Dyad`)** | **`A5 = 886.3 Hz` + `C5 = 519.7 Hz`** (`17.2s–21.0s`), beralih ke **`D5 = 592.7 Hz` + `E5 = 659.2 Hz`** (`25.2s–30.0s`) | Denyut lembut berirama di belakang layar USG & morfosis speckle limpa → tabung oksigen. | Menghidupkan layar USG 2D sehingga terasa seperti mesin pemindai rumah sakit yang sedang aktif bekerja. |
| **M6** | **Crystalline Molecular DNA Bell Cascade + Finale `Fmaj7/Am` Glow** | **DNA (`41.0s–42.5s`)**: **`C8 (4.187 Hz)`, `D8 (4.698 Hz)`, `F#8 (5.869 Hz)`, `A8 (7.044 Hz)`, `C9 (8.217 Hz)`, `D9 (9.399 Hz)`**<br>**Finale (`47.0s–49.2s`)**: **`A3 (222 Hz) + C4 (264 Hz) + F4 (348 Hz) + A4 (443 Hz) + A5 (885 Hz)`** | Saat kamera menembus masuk ke heliks DNA, kilau lonceng kristal frekuensi ultra-tinggi (`> 4 kHz`, di atas suara narator!) berdenting lembut. Di akhir video (`47–49.8s`), akor hangat `Fmaj7/Am` + pendar `A5` meluruh halus ke hening (`-70 LUFS`). | Memberi sensasi takjub mikroskopis pada kode genetik & penutup kontemplatif yang merinding. |

---

### 3. Peta Presisi 12+ Foley & Transien SFX (`effects.wav` + `music.wav`)

| Cue ID | Timestamp Referensi | Durasi | Jenis Suara Foley / Desain Suara | Sinkronisasi Visual 1:1 |
|---|---|---|---|---|
| **AMB-1** | `00.00s – 08.85s` | `8.85s` | *Deep Hydrophone Underwater Rumble + Soft Sub-Aqua Bubbles* (`< 350 Hz`) | Atmosfer menyelam di laut dalam (`SH01–SH04`). |
| **FOLEY-0** | `03.40s` & `04.05s` & `06.00s` | `0.3s` | *Subtle Hologram Hum*, *Soft Cross-Out Tick*, lalu *Optical Lens Dive Whoosh* | Tabung oksigen muncul, dicoret `✕`, dan kamera menembus lensa kacamata kayu. |
| **SFX#01** | `08.850s` (peak `10.000s`) | `1.20s` | **Bubble Swell + Waterline Surface Breach Splash + Gentle Lapping Waves** (`430 Hz` center) | Gelembung raksasa pecah membelah garis air ke kampung panggung `suku Bajo` (`f=270`). |
| **SFX#02** | `11.150s` (peak `11.325s`) | `0.45s` | **Airy Cloud-Curtain Swoosh #1** | Kamera mendongak dari kampung panggung masuk ke tirai awan (`f=336–348`). |
| **SFX#03** | `12.675s` (peak `12.825s`) | `0.45s` | **Airy Cloud-Curtain Swoosh #2 + Soft Wood Console Settle** | Keluar dari peta Sulawesi menembus awan ke mesin USG `2018` (`f=380–396`). |
| **SFX#04** | `14.950s` (peak `14.975s`) | `0.38s` | **Pure `E7 (2.640 Hz)` Medical Ultrasound Ping #1** (`-28.2 dBFS`) | Tepat di frame `f=450` saat bola X-Ray boolean mulai membuka rongga tubuh! |
| **SFX#05** | `17.025s` (peak `17.250s`) | `1.02s` | **Deep Sub-Bass Heartbeat Thump (`LUB-DUB`, `30–65 Hz`, `-4.2 dBFS`)** | Kamera terkunci penuh ke layar diagnostik USG (`"dan menemukan sesuatu yang aneh"`). |
| **SFX#06** | `19.475s` (peak `19.500s`) | `0.33s` | **Pure `E7 (2.640 Hz)` Medical Ultrasound Ping #2** (`-29.7 dBFS`) | Garis penunjuk `○` mengunci ke penampang limpa (*"Limpa orang Bajo"*). |
| **SFX#07** | `23.300s` (peak `23.425s`) | `0.40s` | **Clean Screen-Split Sub-Swoosh** (`-14.8 dBFS`) | Layar membelah menjadi 2 USG bertumpuk (`tetangga` vs `orang Bajo`). |
| **SFX#08** | `28.625s` (peak `28.675s`) | `0.15s` | **Punchy Water-Plunge Radial Zoom Pop** (`-7.7 dBFS`) | Transisi keluar dari USG terjun kembali ke penyelam bawah air (`"Saat menyelam"`). |
| **FOLEY-7** | `30.20s – 33.40s` | `3.20s` | **Visceral Wet Organ Squeeze + Rhythmic Heartbeat + Arterial Blood Flow Whoosh** | Limpa berkontraksi memompa aliran sel darah merah 3D ke seluruh tubuh. |
| **SFX#09** | `33.975s` (peak `34.025s`) | `0.15s` | **Snappy Horizontal Whip-Pan Pop/Snap** (`-6.8 dBFS`) | Whip-pan `6 frame` dari bawah air ke warga penenun jaring (*"Yang bikin kaget"*). |
| **SFX#10** | `38.650s` (peak `38.925s`) | `1.02s` | **Deep Resonant Biological Heartbeat (`LUB-DUB`, `-8.2 dBFS`)** | Kamera *push-in* dalam ke limpa emas pada kalimat kunci *"bukan hasil latihan"*. |
| **SFX#11** | `40.700s – 42.400s` | `1.70s` | **Microscopic Cellular Dive Whoosh + `C8–D9 (4.2–9.4 kHz)` Crystalline DNA Shimmer** | Menembus jaringan sel limpa masuk ke heliks ganda DNA 3D (*"tertulis di DNA"*). |
| **SFX#12** | `43.075s` (peak `43.125s`) | `0.15s` | **Fast Harpoon/Water-Entry Whip-Pop** (`-7.1 dBFS`) | Whip-cut dari DNA kembali ke tali tombak bawah laut (*"lebih dari 1.000 tahun"*). |

---

### 4. Karakteristik Voice-Over Narator (`vocals.wav`)
- **Karakter Vokal:** Pria bariton hangat dokumenter (`F0 median = 135.3 Hz`), tenang namun berenergi penasaran (*curious authoritative storyteller*), **bukan** gaya iklan berteriak dan **bukan** bisikan mengantuk.
- **Kecepatan Bicara:** `102 kata` dalam `30.5 detik` waktu bicara aktif (`61.3%` dari total durasi `49.8s`, menyisakan napas sinematik `0.25–0.65s` di setiap transisi portal/whip!).
- **Aturan Pelafalan Istilah Sains Bahasa Indonesia (Wajib Dijaga di TTS `eleven_v4`):**
  - `USG` → diucapkan **`"yu-es-ji"`** (tulis fonetik `"yu es ji"` di string TTS sementara teks layar tetap `"USG"`!).
  - `DNA` → diucapkan **`"di-en-ei"`** (tulis fonetik `"di en ei"` di string TTS sementara teks layar tetap `"DNA"`!).
  - `50%` → tulis `"lima puluh persen"` di string TTS; `1.000` → tulis `"seribu"` di string TTS; `2018` → tulis `"dua ribu delapan belas"`.
  - **DILARANG** memakai tag `[clear]` pada ElevenLabs `eleven_v4` (akan dibaca harfiah!). Gunakan `[curious]`, `[warm]`, `[thoughtful]`, atau kalimat bersih bertanda baca presisi.
