# IPM Chronicles — Standard Production Workflow (v2.1 · Proven Visual Engine + EP03 VO/Script Hardening)

Dokumen ini mengunci alur produksi hasil pembuktian **Episode 01 (`IpmEp01`)** dan upgrade sinematik **Episode 02 (`IpmEp02`)**, sekaligus menyimpan catatan perbaikan wajib untuk **Episode 03–15** terutama pada sektor **naskah tutur, intonasi, dan pelafalan Voice-Over (Cartesia `sonic-3`)**.

---

## Arsitektur Inti (`ipm-chronicles/`)

| Komponen | Lokasi & Peran |
|---|---|
| **Kamera 2.5D & Proyeksi 3D** | `src/shared/Flat3DCamera.tsx` — spline Hermite (`track`, `Cam2D`), panggung perspektif CSS (`PerspStage` dengan overscan aman otomatis), proyektor 3D sejati (`project3D`), `handheld`, `shake`, `EditorialCallout` |
| **Karakter Berperforma** | `src/shared/HeritageKid.tsx` — figur `santriPutra` / `santriPutri` dengan kedip mata, arah tatapan (`look2`), ekspresi alis/mulut, gerak berjalan (`walk`, `walkAmp`), mode punggung netral (`backView` untuk kerumunan/anonim sejarah), siluet (`sil`), dan properti (`letter`, `book`, `lamp`, `quill`, `magnifier`, `banner`) |
| **Properti & Latar 2.5D** | `src/shared/HeritageProps25D.tsx` — panggung berlapis (`StageBackdrop`, `SunAura`, `PaintedPeak`, `RollingRidge`, `SwayingPalm`, `BanyanTree`, `HeritageDoor`, `HeritageHall`, `HeritageBrassLamp`, `BugisPinisi25D`, `RumahPanggung`, `SeaWaveBands`, `RainField`, `PouringBrassHourglass`, `YogyakartaGapura25D`) |
| **Kartografi Sejarah** | `src/shared/AtlasMap2D.tsx` — peta `d3-geo` dengan tilt 3D, kontur batimetri ganda, mawar kompas, pin era, serta objek bergerak di rute (`traveler: "pinisi" \| "walker"`) |
| **Tipografi & Kertas Arsip** | `src/shared/EditorialCaptions.tsx`, `VintageCartouche.tsx`, `PaperTextures.tsx` (`HERITAGE`, `SunDustMotes`, `MuseumPaperGrade` SVG noise tile GPU-cached) |
| **Timing Audio-First** | `src/shared/scriptEngine.ts` — konversi `alignment.json` menjadi jendela adegan (`SCENES`), penanda beat (`CUES` / `cue`), dan `CAPTION_CHUNKS` |

---

## Alur Produksi 6 Gerbang per Episode (`EPxx`)

### Tahap 1 — Gerbang Riset & Fakta (`series/evidence_ledger.csv`)
1. Kumpulkan klaim sejarah khusus episode dari sumber resmi (historiografi IPM/Muhammadiyah, keputusan konferensi/muktamar, ensiklopedi sejarah) dan catat ke `series/evidence_ledger.csv` sebagai status `VERIFIED` / `APPROVED`.
2. Pastikan batasan keras tetap terjaga:
   - Tanpa mengarang nama tokoh, dialog/kutipan fiktif, atau wajah tokoh nyata.
   - Adegan reka ulang wajib memakai karakter generik / `backView` dan mikro-stempel `REKONSTRUKSI`.
3. Periksa posisi episode di `series/variation_matrix.csv` dan rantai pertanyaan di `series/open_loops.csv`.

### Tahap 2 — Naskah 3-Track, Brutal Storyteller & Audit (`lint_narasi.py` + `script_lint.py` + `series_audit.py`)
1. Terapkan prinsip **Skill `brutal-storyteller`** (`.agents/skills/brutal-storyteller/SKILL.md` & `references/`):
   - **7 Lensa Sudut Tersembunyi**: cari sudut tak terduga (Kontradiksi, Harga yang dibayar, Rahasia biasa, Taruhan, Detik krusial) + kunci **1 Pertanyaan Inti** dan **1 Emosi Inti** sebelum menulis.
   - **Rantai Jawab-Tanya & Peta Loop (`Loop Map`)**: setiap kalimat wajib menjawab satu pertanyaan kecil sekaligus melahirkan rasa ingin tahu baru; jaga 1–3 *open loop* aktif di tengah naskah, tutup loop episode tuntas di *Payoff*, dan buka *Bridge* spesifik menuju episode berikutnya.
   - **Hukum Besi Anti-Slop**: lolos **Tes Hapus** (nol kalimat gratis), **spesifik konkret** (angka, tempat, benda nyata alih-alih kata sifat kosong), **ritme 1-3-1** (pendek–panjang–pendek), serta bebas klise/bau AI (`references/anti-patterns.md`).
   - **Kepadatan Kata & Pemecahan Baris ramah TTS (`6–12 kata/baris`)**: jaga total naskah di kisaran **215–245 kata** (`100–120 detik`, ~`2.1–2.2 kata/detik`), namun **pecah kalimat majemuk menjadi klip pendek (`6–12 kata` per baris TTS)** agar intonasi tetap hidup dan tidak datar di tengah kalimat panjang.
   - **Pisahkan Klausa Setup & Pertanyaan/Klimaks**: jangan menggabungkan klausa panjang dengan kalimat tanya/turn line dalam satu klip TTS (`narration_tts.txt`); pisahkan ke klip tersendiri agar nada naik kalimat tanya atau hentakan klimaks terbentuk penuh.
   - **Ramah Tutur (*Show, Don't Over-Name*)**: tanggal rinci (mis. rentang tanggal muktamar), nomor SK/dokumen panjang, dan nama kelembagaan berderet cukup ditampilkan pada kartu stempel/label visual — hindari penumpukan singkatan & angka dalam satu napas narasi.
2. Tulis naskah dalam format **Voice | Picture | Sound** dengan pergantian beat tiap `4–8` detik serta sisipkan penanda sinkronisasi `[[kode_cue]]` tepat di kata kunci visual/SFX, plus buat **2 file terpisah**:
   - `narration_master.txt`: ejaan baku untuk subtitle layar dan arsip.
   - `narration_tts.txt`: normalisasi fonetik ramah TTS (bebas tanda `;` dan daftar `:` bertumpuk; angka/Romawi dieja penuh; singkatan/istilah asing diuji ejaan fonetiknya).
3. Jalankan **ketiga validator** sebelum masuk perekaman suara:
   ```powershell
   python .agents/skills/brutal-storyteller/scripts/lint_narasi.py <narration.txt>
   python ipm-chronicles/pipeline/script_lint.py <narration.txt> --series-dir <episodes_dir>
   python ipm-chronicles/pipeline/series_audit.py ipm-chronicles/series/variation_matrix.csv --loops ipm-chronicles/series/open_loops.csv
   ```

### Tahap 3 — Voice-Over Audio-First (`Cartesia sonic-3`) + Gerbang Pelafalan & Intonasi *(Hardened EP03+)*
1. Gunakan suara narator serial terkunci: **Galang** (`04b567df-2923-4b0c-896b-4b7df0a07e1a`, model `sonic-3` / `sonic-3.6`, `language="id"`). Cek kecukupan kuota/kredit Cartesia sebelum eksekusi agar tidak terpotong di tengah episode (`HTTP 402`).
2. **Gerbang Uji Pelafalan (*Pronunciation Pre-Flight Gate*)**: sebelum merender seluruh episode, jalankan 1 skrip tes pendek berisi semua **singkatan** (`IPM`, `IRM`, `OSIS`, dll.), **istilah Arab/organisasi** (`Khittah` -> *Khitah*, `Tanwir`, `Mu'allimin` -> *Mualimin*, `Muktamar`), **nama tempat**, dan **angka/Romawi**; dengarkan hasilnya langsung dengan `earshot`/pemutar audio. Jika singkatan terdengar melar (*"i-pe-em"*) atau kata serapan meleset, perbaiki penulisan fonetik di `narration_tts.txt` (`NUM_SPOKEN`/ejaan spasi/huruf) hingga bulat sebelum lanjut batch penuh.
3. Generate beat-per-beat pendek (`6–12` kata) **tanpa tag `emotion` bahasa Inggris** dan **tanpa `atempo` FFmpeg**:
   - Gunakan variasi `speed` natural terukur (`0.95–1.08`, jangan memaksa kecepatan tinggi agar tidak datar).
   - **Siapkan 2–3 take** khusus untuk *Hook*, *Turn Line*, dan *Landing/Ending Line* — pilih take terbaik secara auditif berdasarkan bobot intonasi.
   - **Jangan memotong jeda napas internal terlalu rapat**: pertahankan `max_internal_gap >= 0.20`, `clamped_gap >= 0.11` (hindari `0.15/0.08` yang membuat napas terasa tercekik), lalu atur jeda dramatis antar-klip secara eksplisit (`0.18–0.55s`).
4. **Audit Dengar Penuh Sebelum Lanjut Visual**: dengarkan hasil sambungan VO utuh (cek jeda, penekanan nada naik/turun tanda baca, dan kebersihan pelafalan kata) sebelum mengunci `alignment.json` dan melangkah ke animasi.
5. Simpan hasil VO + pemetaan kata `word_timestamps` ke `src/episodes/epXX/alignment.json` (gunakan `NUM_SPOKEN` agar kata lisan tetap terpetakan 1-ke-1 ke teks subtitle layar).

### Tahap 4 — Desain Suara & Mastering (`FFmpeg ebur128`)
1. Tempatkan SFX CC0 / berlisensi nyata berbasis objek `CUES` dari `alignment.json` (tanpa bip osilator sintetis).
2. Campur VO > SFX > Music Bed dengan *sidechain ducking* agar suara narator selalu jernih.
3. Targetkan standar siar vertikal:
   - Integrated Loudness: `-14.5 LUFS` (toleransi `±0.5 LU`)
   - True Peak: `<= -1.5 dBFS`
4. Verifikasi ukuran pada file master WAV maupun MP4 akhir dengan `ffmpeg -filter_complex ebur128=peak=true`.

### Tahap 5 — Animasi, Clean Plates & Penyutradaraan Kamera Sinematik (`v2.1 · Remotion 1080x1920 @ 30fps`)
1. Daftarkan timing di `src/episodes/epXX/script.ts` via `createScriptTiming(...)`. **Dilarang keras** menggeser `<Sequence from>` / `durationInFrames` pasca-kunci audio master.
2. **Pemisahan Clean Plates & Penjangkaran Fisik (1:1 Grounding Standard)**:
   - Hasilkan background plate bertekstur bebas karakter/objek menempel (`public/art/epXX/*.jpg`); letakkan karakter, lampu, meja, dan properti sebagai layer terpisah.
   - Pastikan kaki karakter dan properti menyatu dengan ruang nyata: sejajarkan bidang lantai/tangga/teras perspektif tepat di `y` sepatu, tambahkan *dual blurred contact AO* + refleksi lantai, pakai `clipPath` di bibir meja (`desk seam`), dan pasang lampu/easel tepat di permukaan meja/tiang.
3. **Tata Gerak *Cinematic Dramatic* & Kontinuitas Antar-Adegan**:
   - **Parallax & Kedalaman 3D**: pisahkan latar belakang/peta, arsitektur tengah, karakter utama, dedaunan/buku depan (*blurred foreground bokeh* dengan ayunan angin), partikel debu, serta *volumetric rays* / cahaya lentera berkedip.
   - **Akting Multi-Ketukan**: setiap adegan punya dinamika hidup — *walk-in* saat masuk frame, *scan/write/sway* kontinu selama beat berjalan, reaksi kejutan (*flinch*/membungkuk saat stempel `"SAH"` jatuh + kamera micro-thud `shake`), dan kontras jeda hening sebelum mengangkat kepala/tatapan di klimaks.
   - **Animasi B-Roll Aktif (`CinematicV2`)**: gunakan gambar garis/kurva progresif (`strokeDashoffset`), tajuk highlight bertahap, putaran kompas arsitektur kontinu, dan *overshoot spring* stempel berwibawa (`heavy`).
   - **Transisi *Bridge* Tanpa Hard Cut Kasar**: gunakan *portal match-zoom light bloom* untuk transisi dalam adegan dan *color-matched bridge dissolve* (`12 frame` akhir `sXExit` -> `12 frame` awal `sYEntry`, seperti *warm umber*, *cold slate*, *golden dawn*, *obsidian spotlight*) yang berjalan di bawah `EditorialCaptions`.
   - **Zona Aman 9:16**: `EditorialCaptions` duduk di `bottom: 342` (`y ~ 1497..1578`), pastikan kaki/objek penting berada di atas `y ~ 1460` atau jelas terpisah.

### Tahap 6 — QA Visual, Transisi & Render Master
1. **Typecheck**:
   ```powershell
   npm --prefix "d:\PROJECTS\z-automation-studio\ipm-chronicles" run tsc
   ```
2. **Render Still Contact Sheet & Burst Transisi** sebelum render video penuh:
   - Jalankan `qa:epXX` (membundel eksplisit via Node `@remotion/bundler` dengan `publicDir` untuk `16` keyframe lintas adegan) lalu inspeksi `sheet1` & `sheet2`.
   - Render pula *transition & motion burst sheet* (menangkap frame *walk-in*, *portal bloom*, titik *exit->entry* antar-adegan, dan perubahan pose penting) untuk memastikan tidak ada hard-cut kasar, kebocoran tepi *tilt*, atau pijakan melayang.
3. **Render MP4 Master**:
   - Gunakan skrip Node berbasis `@remotion/renderer` (`codec: "h264"`, `crf: 18`, `jpeg`, `gl: "angle"`).
4. **Audit MP4 Utuh**:
   - Cek `ffprobe` (resolusi `1080x1920`, `30 fps`, durasi tepat, audio `48kHz stereo`) + `ffmpeg ebur128`.
   - Tonton video hasil render langsung sampai detik terakhir sebelum menyatakan selesai.

---

## Ringkasan Pelajaran & Aturan Wajib EP03+ (Code-First Full Animation)

> **Prinsip Utama Arsitektur Visual (Direktif User):**
> Bangun animasi **penuh lewat kode** (SVG/Canvas/Three.js/Remotion berlapis yang seluruh bagiannya bisa bergerak organik: pintu/jendela berengsel, awan, dedaunan, tirai, cahaya berdenyut). **Desain karakter tetap dipertahankan (`HeritageKid`)**, sedangkan **ukuran / skala relatif karakter terhadap lingkungan dan properti wajib proporsional**. **Generasi foto/gambar AI harus diminimalkan sekali** dan hanya diizinkan dengan aturan sangat ketat.

### Aturan Ketat Jika Terpaksa Generate Gambar/Foto AI (Minimize & Gatekeep):
1. **Default = Pure Code**: Lingkungan/ruangan 2.5D/3D, pintu/jendela berengsel, peta, papan tulis, dokumen, tangan/lengan artikulasi, cahaya, partikel, dan dedaunan utama dibangun **100% via kode** terlebih dahulu.
2. **Syarat Izin Generate Gambar (Harus Lolos Semua)**:
   - Hanya untuk **aset terisolasi berlapis** (bukan adegan datar utuh/`flattened wall`) atau tekstur mikro yang memang mustahil/tidak efektif digambar rapi dengan vektor/shader/Three.js.
   - Wajib memiliki **kedalaman multi-layer sejati** (jendela/pintu terbuka transparan agar kode animasi bergerak di belakang/dalamnya) atau dipakai ulang lintas banyak adegan.
   - **Dilarang keras** menempel karakter ke atas foto datar dengan sudut perspektif atau perbandingan ukuran tubuh-ruangan yang jomplang/bertabrakan.
3. **Proporsionalitas Ukuran Karakter & Lingkungan (Skala Relatif 1:1)**:
   - Pertahankan **desain karakter** (`HeritageKid`), lalu kalibrasi ketat **ukuran (`scale`) & penempatannya** agar sepadan dengan tinggi meja, kursi, pintu, jendela, buku/objek di tangan, serta skala bangunan pada jarak perspektif yang sama.

| Aspek | Status di EP02 (`IpmEp02`) | Aturan Baru untuk EP03+ (`IpmEp03`) |
|---|---|---|
| **Visual Pipeline & Pijakan** | Clean plates + AO + refleksi + `clipPath` desk -> *Static plate* terbatas gerak | **Full Animation via Code** (parallax 2.5D/3D + elemen bergerak nyata); minimalisir *AI-generated images* dengan syarat ketat & proporsi karakter-lingkungan 1:1 akurat |
| **Kamera, Akting & Transisi** | Match-zoom, flinch, writing->still->lookup, B-roll draw-on, bridge 12f -> **Terbukti Bagus** | Terapkan sejak fase penyusunan adegan + gunakan *profile* matrix EP03 (`object_doorway`, `brisk`, `dolly_toward_detail`) |
| **Panjang Kalimat & Intonasi VO** | Beberapa baris >15 kata bertumpuk + tanda `;` + pertanyaan gabung klausa -> intonasi cenderung datar | Pecah wajib `6–12 kata/klip TTS`, pertanyaan/turn line klip terpisah, hilangkan `;`, rekam 2–3 take di hook & turn line |
| **Pelafalan Kata & Singkatan** | Re-synth `IPM`/`IRM` terhenti `HTTP 402`; fallback take lama masih melar & kata serapan belum diaudit | Wajib siapkan `narration_tts.txt` fonetik, tes audio kata/singkatan + dengarkan langsung (`earshot`/playback) & pastikan kuota Cartesia cukup sebelum finalisasi |
| **Penyesuaian Jeda Internal VO** | `trim_and_tighten_pcm(0.15, 0.08)` terasa agak sesak | Kembalikan ke `>= 0.20 / 0.11` dan kendalikan jeda dramatis secara eksplisit antar-segmen |
