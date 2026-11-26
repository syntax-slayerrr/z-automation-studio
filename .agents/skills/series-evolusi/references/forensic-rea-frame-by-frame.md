# Forensic Frame-by-Frame REA Breakdown — Reference Episode (`Suku Bajo: Evolusi Limpa Penyelam Laut`)

Dokumen ini adalah hasil **Reverse-Engineering Analysis (`rea-video` + inspeksi visual `1.494 frame @ 30 fps` + pembedahan spektrogram & stem terpisah)** terhadap video acuan seri `/series-evolusi` (`WhatsApp_Video_2026-11-26_at_02.32.46.mp4`, berdasar studi ilmiah **Ilardo et al., *Cell*, 2018 — adaptasi genetik `PDE10A` pembesaran limpa Suku Bajo**).

---

## 1. Metadata Teknis Terukur (`ffprobe` & `ebur128`)

| Parameter | Nilai Terukur pada Video Referensi | Standar Upgrade Produksi Studio (`/series-evolusi`) |
|---|---|---|
| **Resolusi & Rasio** | `478 × 850` (`0.5624` = **9:16** vertikal, transkode WhatsApp) | **`1080 × 1920` Full HD** (`9:16`, `bt709`, `yuv420p`) |
| **Frame Rate & Durasi** | **`30.00 fps`** · **`1.494 frames`** · **`49.800 detik`** | **`30.00 fps`** · **`45 – 65 detik`** (`1.350 – 1.950 frames`) |
| **Komposisi Visual (`rea-video` Verified)** | **74% Stylized 3D Render + 26% Procedural 2D Code/Motion-Graphics** (**0% AI video generatif!** Geometri 100% deterministik & konsisten) | **100% Pure-Code (`Remotion` + `Three.js / R3F` + `Canvas2D` + `d3-geo`)** |
| **Audio Stream** | AAC Stereo, `44.1 kHz` | AAC / WAV Stereo, `44.1 / 48 kHz` |
| **Loudness (`ebur128`)** | Integrated: **`-14.1 LUFS`** · LRA: **`4.5 LU`** · True Peak: `-0.6 dBFS` (pasca-transkode AAC) | Integrated: **`-14.3 LUFS ± 0.3`** · True Peak: **`<= -1.5 dBTP`** (bebas clipping pasca-AAC!) |
| **Tempo & Tangga Nada** | **`86.15 BPM`** (*half-time* / **`172.3 BPM`** *16th pulse*) · **`A Natural Minor`** (`conf 0.831`) | Terkunci di **`A Natural Minor` (`Am – F – G – Dm`)** @ **`86.15 BPM`** |
| **Ritme Editing** | `25 sub-shots` (`8 babak naratif kontinu`), rata-rata `1.99s/cut`, **0 jump-cut kasar** — semua perpindahan memakai *motivated match-transition*! | 8 Babak Kontinu dengan **6 Signature Portal/Whip Transitions** |

---

## 2. Naskah Verbatim & Anatomi Rantai Penasaran (`102 Kata` dalam `49.80s`)

> *"Orang ini berburu ikan di kedalaman puluhan meter. Tanpa tabung oksigen, cuma kacamata kayu, dan satu tarikan napas. Mereka suku Bajo, pengembara laut dari Sulawesi. Tahun 2018, peneliti memindai tubuh mereka pakai USG, dan menemukan sesuatu yang aneh. Limpa orang Bajo sekitar 50% lebih besar dari tetangga mereka yang bukan penyelam. Limpa itu seperti tabung oksigen cadangan. Saat menyelam, dia meremas dan memompa sel darah merah ke seluruh tubuh. Yang bikin kaget, orang Bajo yang jarang menyelam pun limpanya tetap besar. Artinya, ini bukan hasil latihan. Ini tertulis di DNA. Setelah lebih dari 1.000 tahun hidup di laut, tubuh manusia ikut berubah."*

**Mengapa Naskah Ini Sangat Kuat (Rumus Baku Seri Evolusi):**
1. **Detik `0.0 – 5.0` (Anomali Fisik Ekstrem):** Langsung tunjukkan manusia melakukan hal mustahil tanpa alat modern (*"berburu ikan di kedalaman puluhan meter, tanpa tabung oksigen"*).
2. **Detik `5.0 – 13.0` (Identitas & Peta Habitat):** Siapa mereka & di mana mereka hidup (*"cuma kacamata kayu... suku Bajo, pengembara laut dari Sulawesi"*).
3. **Detik `13.0 – 20.0` (Momen Penemuan Ilmiah Spesifik):** Sebutkan **tahun studi nyata** + **alat pindai ilmiah** + *curiosity hook* (*"Tahun 2018, peneliti memindai tubuh mereka pakai USG, dan menemukan sesuatu yang aneh"*).
4. **Detik `20.0 – 28.6` (Angka Kontras vs Kontrol + Analogi Instan):** Bandingkan dengan populasi tetangga + beri 1 metafora benda sehari-hari (*"sekitar 50% lebih besar dari tetangga mereka yang bukan penyelam. Limpa itu seperti tabung oksigen cadangan"*).
5. **Detik `28.6 – 34.0` (Mekanisme Biologis Aktif):** Tunjukkan cara kerja organ itu saat beraksi (*"Saat menyelam, dia meremas dan memompa sel darah merah ke seluruh tubuh"*).
6. **Detik `34.0 – 43.3` (Plot Twist Evolusi — *Bukan Hasil Latihan!*):** Buktikan bahwa ini genetik, bukan sekadar olahraga/kebiasaan (*"Yang bikin kaget, orang Bajo yang jarang menyelam pun limpanya tetap besar. Artinya, ini bukan hasil latihan. Ini tertulis di DNA"*).
7. **Detik `43.3 – 49.8` (Konklusi Deep-Time Puitis + Visual Loop):** Tutup dengan skala waktu ratusan/ribuan tahun (*"Setelah lebih dari 1.000 tahun hidup di laut, tubuh manusia ikut berubah"*).

---

## 3. Peta Lengkap Frame-by-Frame (`f=0` s.d. `f=1493` @ `30 fps`)

| Babak & Shot | Frame (`30 fps`) | Waktu (`detik`) | Visual, Geometri 3D/2D & Gerak Kamera | Instrumen Aktif di Layar | Posisi & Teks Blur-Word (`Emboldened = Gold #F6AD2B`) |
|---|---|---|---|---|---|
| **B1 · SH01a** | `f=000 – 045` | `00.00 – 01.50s` | Laut dalam biru-kobalt (`#014B75`→`#019ECD`), siluet penyelam (`#0D1821` + rim cyan) berenang miring ke kiri-bawah membawa tombak kayu dengan ikan tertusuk; papan apung kayu di tepi kanan; kawanan ikan perak-biru berenang. | — | `top-left`: *"Orang ini berburu **ikan**"* (blur-in per kata `7 frame`) |
| **B1 · SH01b** | `f=045 – 100` | `01.50 – 03.33s` | Kamera *dolly-in* mengikuti penyelam menyelam makin dalam melewati karang bawah; **pengukur kedalaman muncul di tepi kanan**. | **Instrumen #1:** `RightScaleRuler` (`x=93.8%`, 6 tick mayor + 4 minor/ruas) + panah `◀` kuning `#F5B841` turun mengikuti kedalaman! | `top-left` (2 baris, baris ke-2 lebih kecil): *"Orang ini berburu **ikan** / di kedalaman **puluhan meter**"* |
| **B1 · SH01c** | `f=100 – 149` | `03.33 – 04.97s` | Di punggung siluet penyelam muncul **hologram 3D tabung oksigen biru-cyan transparan (`Fresnel additive`)**, lalu tanda silang `✕` oranye-koral (`#FF6B35`) tergambar menyilang di atas tabung (`f=116–135`). | **Instrumen #3:** `HolographicScubaTank3D` + animasi coret silang `✕` | `mid-left`: *"Tanpa **tabung oksigen**"* |
| **B1 · SH02** | `f=150 – 198` | `05.00 – 06.60s` | Cut halus ke *close-up* melayang **kacamata renang ukir kayu tradisional Suku Bajo** (`#6E2E10`–`#A85322`, takik pahatan tepi, tali tambang, lensa kaca cyan mengilap ber-highlight sabit putih). Di `f=180–198`, kamera **zoom menembus lurus ke dalam lensa kiri** hingga kaca cyan memenuhi seluruh layar (`Through-Lens Portal`)! | **Instrumen #4:** `ScientificCalloutLine` garis tipis putih `1.5px` + cincin target berlubang `○` tepat di jembatan hidung kacamata! | `top-left`: *"cuma **kacamata kayu**"* |
| **B1 · SH03** | `f=199 – 242` | `06.63 – 08.07s` | Keluar dari lensa kacamata ke *side-tracking shot* penyelam meluncur horizontal tenang di kedalaman biru. | — | `bottom-left`: *"dan satu **tarikan napas**"* |
| **B1 · SH04** | `f=243 – 269` | `08.10 – 08.97s` | Kamera mendongak ke permukaan cahaya toska terang saat **1 gelembung udara 3D raksasa ber-rim putih-cyan** bergoyang organik naik membesar ke tengah layar (`Bubble Rise Portal`). | Gelembung 3D refraktif (`Fresnel rim`) | `bottom-left` blur-out di `f=260` |
| **B2 · SH05** | `f=270 – 339` | `09.00 – 11.30s` | **Transisi Garis Air Membelah Layar (`WaterlineBreachWipe`)**: garis gelombang berbusa putih turun dari `y=0%` (`f=270`) ke `y=52%` (`f=276`), memperlihatkan **kampung rumah panggung kayu Suku Bajo** di atas air toska jernih + perahu sampan tertambat + jendela rumah menyala pastel. Di `f=318–339` kamera *crane-up & pitch-down* melewati dermaga kayu lalu mendongak masuk ke awan putih! | `WaterlineBreachWipe` + Tipografi Dunia Besar | `top-left` besar (`132px`): *"suku **Bajo**"* (`f=270–315`) → ganti label kecil *"pengembara laut"* (`f=316–338`) |
| **B2 · SH06** | `f=340 – 386` | `11.33 – 12.87s` | **Transisi Tirai Awan (`CloudCurtainPortal`)** menyibak (`f=340–354`) ke peta kartografi **Pulau Sulawesi** hijau zamrud tua (`#1B5B27`) dengan garis pantai pendar neon-cyan (`#1CE2FF` + inner `#C2F9EC`) di atas laut biru dalam (`#003C72`). Di `f=380–386` awan kembali menutup layar! | **Instrumen #6:** `BioluminescentMap2D` (`d3-geo` Sulawesi) + `CloudCurtainPortal` | Di dalam Teluk Tomini (`top-right/center`): *"dari **Sulawesi**"* |
| **B3 · SH07–08** | `f=387 – 521` | `12.90 – 17.37s` | Awan menyibak di atas balkon kayu hangat berlatar laut sore; angka **`2018`** muncul di kiri-atas di atas **mesin USG berkotak kayu** berlayar sektor emas hidup + tombol fisik 3D (`f=390–414`). Kamera **geser lateral ke kanan** menyusuri kabel hitam ke siluet peneliti duduk (`"peneliti"` + garis tunjuk `○`) yang menempelkan probe USG ke perut orang Bajo (`f=438`). Pada `f=450–474`, **bola pemindai X-Ray boolean 3D mengembang dari ujung probe**, mengupas kulit hitam menjadi rongga kuning-amber transparan (`Fresnel`) berisi **14 ruas tulang belakang + tulang rusuk gading + organ atas oranye + limpa emas besar**! Pada `f=492` kerucut berkas USG menyala (`"pakai USG"`), lalu kamera **zoom masuk ke kerucut USG** hingga penuh layar (`f=504–521`)! | **Instrumen #2:** `AnatomicalXRayTorso3D` (Spherical Boolean X-Ray)<br>**Instrumen #4:** `ScientificCalloutLine` (`"peneliti"`)<br>**Instrumen #5a:** Mesin USG 3D + Kerucut Pindai | `top-left`: **"2018"** (`f=390–435`)<br>Label: *"peneliti"* (`f=438–462`)<br>`bottom-left`: *"memindai tubuh mereka"* (`f=450–488`)<br>Di atas berkas: *"pakai **USG**"* (`f=492–518`) |
| **B4 · SH09–17** | `f=522 – 700` | `17.40 – 23.33s` | Layar penuh **Monitor Diagnostik USG B-Mode** berlatar cokelat espresso gelap (`#190D05`) dengan grid tipis + `RightScaleRuler` di kanan. Sektor kipas USG (`68°`) menampilkan derau akustik *Rayleigh speckle* emas hidup (`15 fps`), 3 bayangan akustik tulang rusuk gelap, lengkung fasia terang, dan irisan **limpa berbentuk kacang** lengkap dengan pembuluh hilus gelap di dalamnya. Di `f=600` garis tunjuk `○` menunjuk ke limpa; di `f=637–667` **penampang limpa membesar mulus `+50%` area (`~1.24×` skala linear)**! | **Instrumen #5b:** `DiagnosticUltrasoundScreen` (`single`) + `ScientificCalloutLine` + `RightScaleRuler` | `bottom-left`: *"dan menemukan sesuatu / yang **aneh**"* (`f=525–595`)<br>**Dual-Clause Split (`f=600–697`)**: `top-left` *"**Limpa** orang / Bajo"* + `bottom-left` *"sekitar **50%** lebih besar"* |
| **B4 · SH18** | `f=701 – 779` | `23.37 – 25.97s` | Layar membelah vertikal menjadi **2 Sektor USG Bertumpuk (`DualUltrasoundComparison`)**: di atas ukuran limpa normal (*"tetangga, bukan penyelam"*), di bawah ukuran limpa Suku Bajo `+50%` lengkap dengan **jejak titik-titik kaliper medis putih-cyan `+ · · · +`** mengelilingi tepi limpa! Di `f=772–779` sektor atas bergeser keluar ke atas dan sektor bawah kembali ke tengah. | **Instrumen #5c:** `DualUltrasoundComparison` + Jejak Kaliper Sonografi `+ · · · +` + `RightScaleRuler` | Label kiri-atas: *"tetangga, / bukan penyelam"*<br>Label tengah-kiri: *"orang **Bajo**"*<br>`bottom-left`: *"sekitar **50%** lebih besar"* |
| **B4 · SH19–21** | `f=780 – 860` | `26.00 – 28.67s` | Di dalam kipas USG tunggal, **kontur partikel speckle limpa bermorfosis mulus (`SDF contour morph`) menjadi siluet tabung oksigen selam lengkap dengan katup leher** (`f=795–840`), bertahan berkilau akustik, lalu bermorfosis kembali menjadi bentuk limpa (`f=847–855`), diakhiri *radial zoom-blur* keluar (`f=858–864`). | **Instrumen #5d:** `SpeckleMetaphorMorph` (`spleen <-> oxygen_tank`) + `RightScaleRuler` | `bottom-left`: *"seperti **tabung oksigen** / cadangan"* |
| **B5 · SH22** | `f=861 – 1019` | `28.70 – 33.97s` | Masuk kembali ke bawah laut biru-toska di atas terumbu karang *bokeh*; tubuh X-ray transparan penyelam berputar dari vertikal (`f=870`) ke profil renang horizontal (`f=877–900`). Pada `f=907–922` (`"dia meremas"`), **limpa kuning 3D memipih/berkontraksi nyata**, lalu di `f=922–1015` **puluhan keping sel darah merah 3D bikonkaf (`eritrosit` merah menyala)** menyembur keluar dari limpa mengalir deras sepanjang cabang pembuluh arteri ke seluruh dada & punggung! | **Instrumen #7:** `AnatomicalXRayTorso3D` (`organSqueeze` + `rbcFlowProgress` aliran 3D sel darah merah bikonkaf) | `top-left`: *"Saat **menyelam**"* (`f=873–903`)<br>`bottom-right`: *"dia **meremas**"* (`f=907–945`)<br>`top-left`: *"memompa **sel darah** / merah"* (`f=930–990`)<br>`bottom-left`: *"ke seluruh tubuh"* (`f=975–1014`) |
| **B6 · SH23a** | `f=1020 – 1225` | `34.00 – 40.83s` | **Transisi Whip-Pan Horizontal Cepat (`6 frame` motion blur, `f=1020–1026`)** menyapu dari bawah air ke dek kayu panggung sore hari! Seorang warga Bajo duduk di bangku kayu **menenun jaring ikan 3D** (kacamata kayu diletakkan di pagar belakang — kontinuitas dunia!). Pada `f=1068–1118`, **bola X-Ray boolean 3D kembali mengembang dari titik limpa ke seluruh dada**, membuktikan limpa warga yang jarang menyelam ini **tetap besar**! Kamera *push-in* makro menembus dinding dada langsung ke jaringan emas limpa (`f=1188–1228`) hingga memenuhi layar dengan *bokeh* seluler keemasan! | `DirectionalWhipBlur` + Properti Jaring Ikan 3D + **Instrumen #2:** `AnatomicalXRayTorso3D` (Spherical X-Ray ke-2) | `top-left`: *"Yang bikin **kaget**"* (`f=1025–1060`)<br>`bottom-left`: *"orang Bajo yang **jarang** / menyelam"* (`f=1065–1115`)<br>`top-left`: *"limpanya tetap / **besar**"* (`f=1118–1158`)<br>`bottom-left`: *"**bukan** hasil latihan"* (`f=1168–1222`) |
| **B7 · SH23b** | `f=1226 – 1292` | `40.87 – 43.07s` | Kabut seluler emas menyibak (`f=1228–1242`) ke ruang makro molekuler berlatar gradasi *split bokeh* (emas organ di kiri `#9A5212` ↔ biru samudra di kanan `#0C2F49`). **Heliks Ganda DNA 3D *Ball-and-Stick*** berputar anggun: untai 1 toska mengilap (`#26C6DA`), untai 2 kuning-amber (`#FFA726`), anak tangga pasangan basa terbelah dua dengan **celah ikatan hidrogen nyata di tengah**, dikelilingi **huruf nukleotida `A`, `T`, `C`, `G` melayang dengan *depth-of-field blur***! | **Instrumen #8:** `DnaDoubleHelix3D` + `MolecularDnaBackdropAndLetters` | `mid-left` (bawah-tengah kiri): *"tertulis / di **DNA**"* (`f=1238–1290`) |
| **B8 · SH24–25** | `f=1293 – 1493` | `43.10 – 49.80s` | **Transisi Whip-Cut Diagonal Cepat (`f=1293–1302`)** kembali ke dalam samudra biru! Kamera mendongak ke siluet papan apung & **tali tambang hijau terpilin** di tengah kawanan ikan (`f=1305–1378`), lalu kamera *tilt-down* menyusuri tali ke **siluet utuh manusia Suku Bajo melayang vertikal di kedalaman biru** (`f=1380–1493`). Tepat di perut kirinya, **satu titik bola cahaya bioluminesensi kuning-emas (`limpa hasil evolusi`) berpendar lembut**, ditemani gelembung-gelembung mikro kaca yang naik perlahan. Teks blur-out bersih di `f=1480`, menyisakan `14 frame` laut murni yang **nyambung mulus (*seamless loop*) kembali ke `f=000`!** | `BioluminescentOrganOrb3D` + Gelembung Mikro Kaca + *Seamless Underwater Loop* | `mid-left`: *"lebih dari **1.000 tahun** / hidup di laut"* (`f=1305–1375`)<br>`bottom-left`: *"tubuh manusia **ikut** / **berubah**"* (`f=1385–1480`) |

---

## 4. Palet Warna HEX Forensik (Tersampel Langsung dari Frame PNG Lossless)

1. **Samudra Dalam (`f=60, 120, 168, 1410`)**:
   - Cahaya Permukaan Toska: `#0B8EC0` / `#26D0E3`
   - Kolom Air Tengah: `#016492` / `#035074`
   - Kedalaman Abyssal: `#02232E` / `#021824`
   - Siluet Tubuh Penyelam: `#0D1821` + Rim Cahaya Air `#4FD8EE`
2. **Kampung Panggung & Dek Penelitian (`f=285, 402, 1050`)**:
   - Langit Hangat Berawan: `#E8E2DC` → `#D9D2CD`
   - Kayu Rumah Panggung & Dek: `#B9834F` / `#974E25` / `#502D18`
   - Air Laut Dangkal Bawah Rumah: `#008B9B` → `#015167`
3. **Peta Kartografi Bioluminesensi (`f=366`)**:
   - Laut Dalam & Paparan: `#003C72` / `#095A96`
   - Daratan Pulau Hijau Hutan: `#1B5B27` → `#2E7338`
   - Garis Pantai Dalam & Pendar Luar: `#C2F9EC` (`stroke 3px`) + `#1CE2FF` (`glow blur`)
4. **Rongga Tubuh X-Ray Fresnel (`f=480, 915, 1140`)**:
   - Dinding Daging Transparan: Inti `#8C4E08` → Tepi Fresnel `#F2B43B`
   - Tulang Belakang & Rusuk: Inti `#D9CBB4` → Tepi Fresnel `#FFF8E6`
   - Organ Referensi Atas: Inti `#D9480F` → Tepi Fresnel `#FF9248`
   - Organ Evolusi Utama (Limpa): Inti `#C77D0A` → Tepi Fresnel `#FFE047`
   - Eritrosit (Sel Darah Merah 3D): `#E53935` (`emissive #8E1414`)
5. **Layar Diagnostik USG (`f=540, 735, 810`)**:
   - Latar Monitor & Grid: `#190D05` / `#0E0702` + Grid `rgba(255, 188, 112, 0.045)`
   - Gradasi Speckle Akustik: `#261206` → `#9B5B14` → `#E8A838` → `#FFF1BE`
   - Jejak Kaliper Klinis `+ · · · +`: `#D8F5FF`
6. **Ruang Molekuler Heliks Ganda DNA (`f=1260`)**:
   -Untai 1 (Toska): `#26C6DA` · Untai 2 (Amber): `#FFA726`
   - Anak Tangga Nukleotida: `#F5E6C8` (Krem), `#26A69A` (Teal), `#E64A19` (Koral), `#FFB300` (Emas)
   - Latar *Split Bokeh*: Kiri Organ `#9A5212` ↔ Kanan Samudra `#0C2F49`
