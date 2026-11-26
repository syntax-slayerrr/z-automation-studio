# Episode Production Playbook & 10-Episode Roadmap (`/series-evolusi`)

Panduan praktis memproduksi Episode 1, 2, 3, dan seterusnya dengan kualitas **1:1 identik video acuan**, bebas error WebGL/PowerShell, dan hemat waktu lewat pustaka [`remotion/lib/series-evolusi/`](file:///d:/PROJECTS/z-automation-studio/remotion/lib/series-evolusi/) serta scaffolder `npm run init:evolusi`.

---

## 1. Struktur Baku 8-Babak `/series-evolusi` (`45 – 65 Detik`)

Setiap episode wajib menjaga ritme 8 babak ini agar seluruh seri terasa satu DNA yang konsisten dan bikin ketagihan:

| Babak | Proporsi Durasi | Fungsi Naratif (`brutal-storyteller`) | Modul `remotion/lib/series-evolusi/` yang Dipakai |
|---|---|---|---|
| **1. Anomaly Hook** | `0 – 16%` (`~0–8s`) | Tunjukkan manusia melakukan kemampuan fisik ekstrem di habitatnya **tanpa alat modern**, lalu masuk lewat *Through-Prop Portal* + *Bubble/Elemental Rise*. | `RightScaleRuler` + `HolographicScubaTank3D` (atau counter-prop lain dicoret `✕`) + `ScientificCalloutLine` + `BlurWordCaption` |
| **2. Habitat & Bioluminescent Map** | `16 – 26%` (`~8–13s`) | Perkenalkan nama suku/populasi di diorama tempat tinggal mereka → *Cloud Curtain* → peta wilayah berpendar cyan. | `WaterlineBreachWipe` (untuk laut) / `CloudCurtainPortal` + `BioluminescentMap2D` |
| **3. Tahun Studi & Spherical X-Ray Scan** | `26 – 35%` (`~13–17.5s`) | Sebutkan tahun riset nyata (`2010`, `2014`, `2018`, dll.) → gerak lateral dari alat pindai ke peneliti → **bola X-Ray mengembang di dada/tubuh subjek** → zoom masuk ke layar pindai! | `AnatomicalXRayTorso3D` (`xrayRadius: 0 -> 2.4`) + `ScientificCalloutLine` + `SFX E7 (2638 Hz) Ping #1` |
| **4. Komparasi Kontrol vs Evolusi + Morf Metafora** | `35 – 57%` (`~17.5–28.5s`) | Tunjukkan angka perbedaan konkret (`+50%`, `2×`, `30%`) di layar diagnostik tunggal → belah jadi **2 layar atas-bawah** (*tetangga kontrol* vs *populasi adaptasi* ber-kaliper `+ · · · +`) → **morf partikel speckle menjadi benda analogi**! | `DiagnosticUltrasoundScreen` (`single` → `dual_comparison` → `metaphorMorph: 0..1..0`) + `RightScaleRuler` + `SFX E7 Ping #2` |
| **5. Mekanisme Fisiologis Aktif** | `57 – 68%` (`~28.5–34s`) | Kembali ke habitat ekstrem: tunjukkan cara kerja organ X-ray secara *real-time* (meremas, memompa eritrosit 3D, menyaring oksigen, membakar lemak cokelat). | `AnatomicalXRayTorso3D` (`organSqueeze` + `rbcFlowProgress`) |
| **6. Plot Twist Genetik (*Bukan Hasil Latihan!*)** | `68 – 82%` (`~34–40.8s`) | *Horizontal Whip-Pan* ke anggota populasi yang **jarang melakukan aktivitas ekstrem itu** (mis. penenun jaring, warga kota, bayi/anak) → bola X-Ray kedua membuktikan sifat itu **tetap ada** → zoom makro menembus jaringan organ! | `DirectionalWhipBlur` + `AnatomicalXRayTorso3D` + `SFX Deep Heartbeat` |
| **7. Tertulis di DNA** | `82 – 87%` (`~40.8–43.3s`) | Tembus kabut seluler ke **Heliks Ganda DNA 3D *Ball-and-Stick*** berputar dengan huruf `A, T, C, G` *depth-of-field*. | `DnaDoubleHelix3D` + `MolecularDnaBackdropAndLetters` + `SFX C8–D9 Crystalline Chime` |
| **8. Deep-Time Finale & Loop** | `87 – 100%` (`~43.3–50s`) | *Whip-Cut* kembali ke siluet utuh manusia di habitatnya dengan **1 titik pendar emas di organ hasil evolusi** + teks blur-out bersih agar frame akhir *loop* mulus ke Frame 0! | `DirectionalWhipBlur` + `AnatomicalXRayTorso3D` (`finaleGlowIntensity: 1`) |

---

## 2. Katalog 10 Ide Episode Siap Produksi (Berbasis Riset Evolusi Nyata!)

| Ep | Judul / Topik | Studi Ilmiah & Gen Nyata | Organ X-Ray & Morf Metafora | Palet Biome |
|---|---|---|---|---|
| **01** | **Suku Bajo: Manusia Penyelam Berlimpa Raksasa** *(Referensi Master)* | Ilardo et al. (*Cell*, 2018) — gen **`PDE10A`** | **Limpa (`+50%`)** ↔ *Tabung Oksigen Cadangan* | `ocean_bajau` (Sulawesi) |
| **02** | **Suku Sherpa & Tibet: Bernapas di Zona Kematian Everest** | Simonson / Yi et al. (*Science*, 2010) — gen **`EPAS1`** (warisan *Denisovan*!) | **Paru-Paru & Kapiler Nitric Oxide** ↔ *Mesin Hibrida Hemat Oksigen* | `himalaya_hypoxia` (Himalaya) |
| **03** | **Anak-Anak Laut Suku Moken: Melihat Tajam di Bawah Air Tanpa Kacamata** | Gislén et al. (*Current Biology*, 2003) — akomodasi lensa & konstriksi pupil `2×` | **Bola Mata & Lensa Kristalin** ↔ *Lensa Kamera Makro Otomatis* | `ocean_bajau` (Kepulauan Mergui) |
| **04** | **Penduduk Andes Peru vs Tibet: 1 Gunung Tinggi, 2 Jalan Evolusi Berbeda** | Bigham et al. (*PLOS Genetics*, 2010) — **`EGLN1`** & konsentrasi hemoglobin pekat | **Jantung & Konsentrasi Sel Darah Merah** ↔ *Truk Kargo Oksigen Berkapasitas Ganda* | `himalaya_hypoxia` (Pegunungan Andes) |
| **05** | **Suku Inuit Greenland: Mengubah Lemak Anjing Laut Jadi Pemanas Tubuh** | Fumagalli et al. (*Science*, 2015) — gen **`FADS1/FADS2`** & jaringan lemak cokelat (*BAT*) | **Hati & Jaringan Lemak Cokelat Leher/Dada** ↔ *Tungku Pemanas Internal (`battery`)* | `arctic_cold` (Greenland) |
| **06** | **Kenapa Sebagian Manusia Dewasa Bisa Minum Susu (Mutasi Laktase `LCT`)?** | Tishkoff et al. (*Nature Genetics*, 2007) — *convergent evolution* Eropa & Penggembala Afrika Timur | **Usus Halus & Enzim Laktase** ↔ *Gunting Molekul Gula* | `savanna_endurance` (Afrika Timur) |
| **07** | **Pelari Kalenjin Kenya: Rahasia Tendon Achilles bak Pegas Kanguru** | Larsen / Raichlen (*J. Appl. Physiol.*) — proporsi tulang kering ramping & elastisitas tendon | **Tulang Kering & Tendon Achilles** ↔ *Pegas Baja Penyimpan Energi* | `savanna_endurance` (Lembah Rift Kenya) |
| **08** | **Paradoks Sel Sabit (`HbS`): Mutasi yang Melindungi dari Malaria Mematikan** | Allison (1954) — *balancing selection* gen **`HBB`** di sabuk malaria tropis | **Sel Darah Merah Bikonkaf vs Sabit** ↔ *Perisai Anti-Parasit (`shield`)* | `savanna_endurance` (Afrika Barat/Tengah) |
| **09** | **Keluarga dengan Tulang yang Hampir Mustahil Patah (Mutasi `LRP5`)** | Boyden et al. (*NEJM*, 2002) — kepadatan tulang hingga `8×` standar tanpa kerapuhan | **Korteks Tulang Paha & Trabekula** ↔ *Tiang Baja Padat* | `himalaya_hypoxia` |
| **10** | **Kenapa Gigi Bungsu Manusia Modern Sering Impaksi? Evolusi Rahang & Makanan Lunak** | von Cramon-Taubadel (*PNAS*, 2011) — penyusutan rahang pasca-revolusi pertanian | **Tengkorak & Rahang Bawah (`Mandibula`)** ↔ *Garasi Sempit untuk 32 Mobil* | `savanna_endurance` |

---

## 3. Aturan Emas Anti-Bug Windows + ANGLE WebGL

1. **DILARANG memakai `@react-three/postprocessing` `<EffectComposer>`** pada Remotion `--gl=angle` di Windows (menyebabkan frame WebGL kosong/hitam!). Semua *depth-of-field* (huruf DNA, terumbu karang belakang, lensa kacamata) dan *glow* (titik limpa finale, garis pantai peta, hologram tabung) **wajib** memakai CSS `filter: blur(...)`, `Canvas2D` radial gradient sprite (`THREE.AdditiveBlending`, `depthWrite: false`), dan SVG `<feGaussianBlur>`.
2. **100% Deterministik dari `useCurrentFrame()`**: Jangan pernah memakai `useFrame` ber-state mutasi (`pos += vel`) atau `Math.random()` tanpa seed; loncatan frame saat render chunk akan merusak kontinuitas!
3. **Pelindung Pelafalan TTS Indonesia (`speakText` vs `displayText`)**:
   - Di `<slug>/scripts/build_vo_and_sfx.mjs`, pisahkan teks yang dikirim ke ElevenLabs (`speakText`: `"yu es ji"`, `"di en ei"`, `"lima puluh persen"`, `"seribu tahun"`) dari teks yang ditampilkan di `BlurWordCaption` (`displayText`: `"USG"`, `"DNA"`, `"50%"`, `"1.000 tahun"`).
4. **PowerShell 5.1 & Proteksi Disk `C:`**:
   - Jangan gunakan `&&` di skrip `.ps1` Windows PowerShell 5.1; gunakan `; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }`.
   - Selalu arahkan `$env:TEMP` dan `$env:TMP` ke `d:\PROJECTS\z-automation-studio\<slug>\.tmp` sebelum menjalankan `remotion bundle`, `remotion still`, maupun `remotion render`.

---

## 4. Checklist 15-Point Quality Gate (Wajib Lulus Sebelum Final MP4!)

0. **[ ] Topic-Native Action Fidelity (ZERO Copy-Paste Pose/Prop dari Episode Lain!):** Setiap adegan benar-benar mengilustrasikan kata kerja narasi & habitat episode ini (mis. pendaki menjejak & memanjat dinding es nyata bukan melayang seperti berenang; desa gunung muncul dari kabut alpine bukan ombak air laut; layar diagnostik menampilkan penampang organ yang persis disebut narasi bukan limpa kacang dari Ep.01!).
1. **[ ] Hook & RightScaleRuler (`0–5s`)**: Siluet tajam dengan *rim-light* habitat, `RightScaleRuler` tampil bersih di `x=93.8%`, dan indikator emas `◀` bergerak mulus tanpa memotong teks.
2. **[ ] Counter-Prop Hologram (`✕`)**: Alat modern transparan cyan muncul proporsional di tubuh subjek dan dicoret `✕` koral tepat saat kata *"Tanpa ..."* diucapkan.
3. **[ ] Portal Transitions (0 Jump-Cut Kasar)**: Transisi menembus prop/lensa, garis air (`WaterlineBreachWipe`), tirai awan (`CloudCurtainPortal`), dan `DirectionalWhipBlur` berjalan mulus tanpa *1-frame black flash*.
4. **[ ] Bioluminescent Map**: Peta `d3-geo` menampilkan wilayah studi akurat dengan garis pantai `#C2F9EC` + glow `#1CE2FF` dan label di ruang negatif laut/langit.
5. **[ ] Spherical Boolean X-Ray**: Kulit siluet terkupas melingkar dari titik pindai (`xrayRadius: 0 → 2.4`), menyingkap tulang belakang, rusuk gading, organ pembanding, dan organ evolusi emas tanpa *z-fighting*.
6. **[ ] Diagnostic Screen & Caliper Trace**: Sektor kipas menampilkan derau *Rayleigh speckle* emas, bayangan rusuk, komparasi atas-bawah (*kontrol* vs *populasi*), jejak kaliper `+ · · · +`, dan morf metafora yang jelas terbaca.
7. **[ ] Physiological Mechanism**: Kontraksi/kerja organ dan aliran sel darah merah bikonkaf 3D terlihat hidup saat adegan aksi.
8. **[ ] Non-Practitioner Genetic Proof**: Adegan pembuktian *"bukan hasil latihan"* menampilkan aktivitas harian kontras + pemindaian X-ray kedua sebelum masuk ke sel/DNA.
9. **[ ] 3D DNA Double Helix**: Dua untai `#26C6DA` & `#FFA726` dengan celah ikatan hidrogen tengah + huruf `A, T, C, G` *depth-of-field* tampil tajam.
10. **[ ] Blur-Word Typography (0 Pill Boxes!)**: Teks `Montserrat` putih + kata kunci emas `#F6AD2B` muncul & hilang dengan *optical blur*, rata kiri di *safe zone*, **0 kotak latar**, **0 teks terpotong**.
11. **[ ] Pelafalan VO Indonesia Bersih**: Spot-listen langsung via `read_file` membuktikan `USG`, `DNA`, nama suku/gen, dan angka dilafalkan 100% akurat tanpa konsonan awal terpotong.
12. **[ ] `< 480 Hz` Musical Pocket**: Ostinato marimba/kalimba + sub-bass di `A minor` (`86.15 BPM`) tidak menutupi vokal (`500–4.000 Hz` bersih!).
13. **[ ] Harmonic Scientific SFX**: Ping pemindai di `E7 (2.638 Hz)`, detak jantung sub-bass, dan lonceng kristal DNA `C8–D9` jatuh presisi di frame aksi visual.
14. **[ ] Broadcast Master & Seamless Loop**: MP4 final di `d:\PROJECTS\z-automation-studio\videos\<slug>_evolusi.mp4` terverifikasi `1080×1920 @ 30 fps`, **`-14.3 LUFS ± 0.4`**, `True Peak <= -1.5 dBTP`, 0 frame kosong, dan akhir video *loop* mulus kembali ke awal!
