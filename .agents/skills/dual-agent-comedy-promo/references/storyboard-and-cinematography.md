# Storyboard, 3D Cinematography & Anti-Template Directing Guide (`dual-agent-comedy-promo` v2.0)

Dokumen ini adalah kitab penyutradaraan wajib sebelum membuat `<slug>/storyboard.json`, `<slug>/storyboard.md`, dan `CameraDirector.ts`. Tujuannya memastikan **setiap episode Hermes & OpenClaw punya bahasa visual, sudut kamera, blocking, prop 3D, dan ritme penyuntingan yang orisinal** — bukan re-skin template.

---

## 1. Katalog 12 Setup Kamera 3D (Koordinat Acuan Panggung Kamar `perch = { y: 5.17, z: -0.25 }`)

Setiap episode **WAJIB** memadukan minimal **5 tipe kamera berbeda** yang bermotivasi cerita (bukan cuma *Master Two-Shot* + *MCU* berulang-ulang!).

| Kode | Tipe Shot | Fungsi Dramatis & Komedi | Rentang Posisi Kamera (`pos`) | Target (`look`) & `fov` | Contoh Motivasi |
|---|---|---|---|---|---|
| **C01** | **Wide Establishing** | Memperkenalkan setting, cuaca/waktu luar jendela, dan jarak emosional 2 karakter | `[-0.8..0.8, py+0.7..1.1, 13.8..15.5]` | `[0, py-0.6, -0.2]` · `43–46°` | Pembuka suasana atau *pull-back* ironi di akhir |
| **C02** | **Master Two-Shot (Laptop Focus)** | Menampilkan interaksi 2 karakter sekaligus layar laptop di bawahnya | `[-0.3..0.3, py-0.1..0.5, 12.6..13.8]` | `[0, py-0.95, 0.30]` · `41–44°` | Menunjukkan bukti visual / grafik / demo produk sambil melihat reaksi keduanya |
| **C03** | **Intimate Two-Shot (Shoulder-Up)** | Fokus ke tek-tokan dialog cepat tanpa distraksi layar bawah | `[-0.2..0.2, py+0.85..1.05, 9.8..11.2]` | `[0, py+0.25, 0.0]` · `37–40°` | Debat sengit, saling tatap curiga, atau saling sindir |
| **C04** | **OTS OpenClaw → Hermes** | Over-the-Shoulder dari belakang bahu kiri OpenClaw menatap Hermes | `[-2.45..-1.95, py+1.35..1.55, 4.6..5.6]` | `[1.20, py+1.05, pz]` · `34–38°` | Menempatkan penonton di posisi OpenClaw saat diceramahi / disindir Hermes |
| **C05** | **OTS Hermes → OpenClaw** | Over-the-Shoulder dari belakang bahu kanan Hermes menatap OpenClaw | `[1.95..2.45, py+1.35..1.55, 4.6..5.6]` | `[-1.20, py+1.00, pz]` · `34–38°` | Mengintimidasi / menginterogasi OpenClaw atau melihat kepanikannya dari sudut Hermes |
| **C06** | **3/4 MCU OpenClaw / Hermes** | Close-up ekspresi wajah, kelopak mata, dan gestur tangan karakter | OC: `[-0.85..-0.55, py+1.10, 5.6..6.3]`<br>HM: `[0.55..0.85, py+1.20, 5.6..6.3]` | `ocPos` / `hmPos` + `y: +1.02` · `31–34°` | Reaksi panik, polos, sinis, atau pengakuan kocak |
| **C07** | **Extreme Close-Up (ECU) Punchline** | Hentakan komedi maksimal tepat di mata & ekspresi deadpan/syok | OC/HM offset `±0.25..0.45`, `z: 3.6..4.4` | Pusat mata karakter · `26–29°` | *Deadpan blinkless stare*, *double-take*, atau momen sadar diri |
| **C08** | **Low-Angle Hero / Intimidation** | Kamera rendah mendongak ke atas — membuat karakter/prop terasa megah atau sok bos | `[±0.9..1.4, py-0.45..0.15, 5.4..6.6]` | `[±1.1, py+1.25, pz]` · `36–40°` | OpenClaw sok jadi "bos besar", atau Hermes melontarkan fakta menohok |
| **C09** | **High-Angle Helpless / Desk Chaos** | Kamera tinggi menukik ke bawah — membuat karakter tampak kecil, terpojok, atau tenggelam dalam kekacauan | `[±0.3..1.1, py+2.8..3.8, 7.8..10.5]` | `[0, py-0.6..0.2, 0.4]` · `40–44°` | Karakter terjepit argumen, dihujani prop/notif 3D, atau duduk di kursi meja bawah |
| **C10** | **Dutch Tilt (Canted Roll ±4°..±9°)** | Kemiringan horison bermotivasi untuk momen absurd, glitch realita, atau kepanikan puncak | Koordinat MCU/Two-Shot + `roll: ±0.07..±0.15 rad` | Karakter/prop pemicu · `33–38°` | Plot twist tidak masuk akal, angka/fakta gila, atau halusinasi panik |
| **C11** | **Tight Screen / Prop Insert** | Fokus penuh ke teks layar laptop, papan tulis, atau objek 3D kecil tanpa gangguan | `[-0.25..0.25, 2.65..2.95, 9.8..11.2]` (laptop) atau dekat prop 3D | `[0, 2.55, 0.35]` atau posisi prop · `33–36°` | Punchline tertulis di layar, detail kontrak, hasil error, atau perbandingan data |
| **C12** | **Dynamic Crane / Orbit Arc** | Sapuan vertikal naik/turun atau busur horizontal lembut (hanya 1 arah, ZERO ping-pong!) | Arc/crane halus `easeOut` atau `easeInOut` | Subjek utama → panorama jendela · `40–46°` | Transisi besar, reveal solusi elegan, atau finale sinematik |

### Aturan Emas Kamera
- **Jaga *180-Degree Rule***: Jika OpenClaw di sisi kiri (`-X`) dan Hermes di sisi kanan (`+X`), pertahankan posisi kamera di sisi `+Z` (kecuali bila memakai gerakan orbit kontinu yang tampak jelas perpindahan ruangnya).
- **Satu Arah Gerak per Shot (ZERO Ping-Pong)**: Di dalam 1 shot, kamera hanya boleh bergerak *dolly push*, *dolly pull*, *slow truck*, *crane*, atau *locked-off* satu arah — **JANGAN pernah bolak-balik mengikuti siapa yang bicara di dalam satu shot!**
- **J-Cut & L-Cut Rhythm**: Tidak semua cut harus jatuh persis di frame awal suara. Potong kamera `4–8` frame lebih cepat untuk reaksi (*pre-lap*), atau tahan kamera di karakter yang DIAM selama `10–24` frame saat lawan bicaranya melontarkan kalimat absurd (*reaction hold* — sumber komedi terbesar!).

---

## 2. Arketipe Blocking & Dinamika Cerita (Jangan Selalu Duduk Sejajar!)

Pilih arketipe pementasan yang paling cocok dengan topik — atau gabungkan antar babak:

1. **A. Debat Meja & Panggung Atas-Bawah**: Satu karakter nongkrong santai di tepi atas layar laptop (`perch`), sementara karakter lain beraksi di depan keyboard 79-tombol / kursi putar (`y ≈ 0.56, z ≈ 3.85`) atau di meja samping.
2. **B. Duel OTS Ping-Pong Cepat (Courtroom / Interrogation / Roast)**: Kamera bergantian cepat antara `C04 (OTS OC)` ↔ `C05 (OTS HM)` ↔ `C07 (ECU)` saat adu argumen tajam, lalu pecah ke `C01 (Wide)` saat punchline meledak.
3. **C. Eksperimen / Bedah Produk Bersama**: Keduanya menghadap ke layar laptop atau objek 3D hologram di tengah panggung (`x = 0, y = py + 1.2, z = pz + 0.7`), bahu-membahu menginspeksi, lalu salah satunya merusak eksperimen.
4. **D. Tukar Peran (Role Reversal)**: Hermes yang kehilangan ketenangan / panik karena anomali tak masuk akal, sementara OpenClaw justru bersikap sok tenang/filosofis dengan gaya *Low-Angle Hero*.
5. **E. Podcast / Talkshow / Wawancara Meja**: Kedua karakter duduk/berdiri menghadap sedikit ke sudut 3/4 dengan properti mikrofon 3D atau cangkir kopi di antara mereka, membahas fenomena viral atau sejarah teknologi dengan insert layar dinamis.
6. **F. Time-Skip / Montage Berjalan**: Transisi waktu nyata di luar jendela Kampung Garut (`sunrise → midday → sunset → night`) mencerminkan lamanya usaha, riset, atau penantian karakter di dalam cerita.

---

## 3. Panduan Custom 3D Props & Visual Gags (`components/CustomProps3D.ts`)

Setiap episode **WAJIB** merancang minimal **2–3 prop/gag 3D kustom** yang dibangun murni dengan Three.js (`LatheGeometry`, `ExtrudeGeometry`, `TubeGeometry`, `CanvasTexture`, shader transparan aman ANGLE) — JANGAN mengulang api kepala / bola kristal / sticky note jika bukan bagian organik cerita!

Contoh prop 3D kustom yang mudah, ringan, dan sangat lucu di Three.js:
- **Gag Waktu & Kecepatan**: Jam dinding 3D dengan jarum berputar brutal + kalender sobek beterbangan, atau meteran speedometer 3D yang jarumnya mentok & berasap.
- **Gag Bisnis / Uang / Harga**: Koin emas 3D bertumpuk lalu roboh, struk tagihan kertas 3D memanjang tak berujung keluar dari laptop, atau palu hakim 3D (`gavel`) saat debat.
- **Gag Tech / AI / Coding**: Menara balok kode 3D / Jenga yang goyang dan runtuh, cangkir kopi 3D mengepulkan uap, mikrofon podcast 3D, kacamata hitam 3D jatuh mendarat di wajah Hermes (*Deal With It*), atau kawanan balon notifikasi 3D melayang mengelilingi kepala OpenClaw.
- **Gag Produk / Website**: Display 3D mengambang yang menampilkan **screenshot asli website/aplikasi**, atau miniatur 3D objek fisik yang sedang dibahas.

---

## 4. Full-Frame Set Dressing & World Customization (`buildBedroomWorld(options)`) — ZERO Leftover Assets!

**Semua yang terlihat di kamera — dari layar laptop sampai baligho di sawah luar jendela — adalah bagian dari penyutradaraan.** JANGAN pernah memanggil `buildBedroomWorld()` tanpa `options` pada episode baru, karena default-nya masih berisi artwork promosi `claude-animasi-promo` (`Z-AUTOMATION EDUKA`, corkboard `EDUKA/NOIR`, monitor `SKILL.MD`).

Gunakan kontrak `BedroomWorldOptions` di `remotion/videos/claude-animasi-promo/components/ThreeStudioWorld.ts` untuk menyetel ulang seluruh panggung agar **100% milik naskah + storyboard episode ini**:

| Elemen Panggung | Parameter `buildBedroomWorld(options)` | Aturan Art Direction |
|---|---|---|
| **Baligho Bambu di Sawah Luar Jendela** | `baligho: { visible, drawCanvas(ctx, 512, 680) }` | **Pilihan A**: Gambar ulang teks/visual baligho menjadi *running gag* / pesan kunci topik episode ini (atau brand produk yang benar-benar dipromosikan).<br>**Pilihan B**: Set `{ visible: false }` jika cerita non-komersial / alam / malam sunyi (warung desa tetap berdiri utuh, hanya papan balighonya yang hilang). |
| **Palet Ruangan Kamar** | `roomPalette: { wallColor, wallEmissive, revealColor, curtainA, curtainB, deskWood, deskLedColor, fairyLightColor, showFairyLights }` | Ubah warna ruangan sesuai mood cerita! Contoh:<br>• *Cyber / AI Crisis*: dinding `#141E30`, gorden `#1E293B`, LED `#EF4444` atau `#38BDF8`, kayu gelap `#261E1B`<br>• *Warm Study / Edukasi*: dinding `#2F3A32`, gorden `#47362A`, LED `#F59E0B`, kayu hangat `#4A3324`<br>• *Podcast / Debate*: dinding `#2A1F33`, gorden `#3E233A`, LED `#A855F7`, `showFairyLights: true` |
| **Papan Dinding Kiri (Corkboard / Poster / Whiteboard)** | `corkboard: { visible, drawCanvas(ctx, 512, 384) }` | Gambar ulang kartu catatan / skema investigasi / poster / grafik khusus topik episode ini, atau `{ visible: false }` untuk dinding bersih. |
| **Monitor Vertikal Kanan** | `sideMonitor: { visible, drawCanvas(ctx, 384, 600) }` | Isi kode, terminal, chat log, ticker harga, kalender, atau radar khusus topik episode ini (atau `{ visible: false }` bila tema non-coding). |
| **Prop Bawaan Meja & Jendela** | `props: { showServerRack, showDeskLamp, showPlant, showCactus, showBooks, showLidMug, showLidDuck }` | Matikan prop bawaan yang tidak cocok dengan cerita (mis. matikan `showServerRack` untuk topik bisnis/sejarah, atau matikan `showLidDuck` / `showLidMug` jika posisi tepi layar laptop diisi prop baru dari `CustomProps3D.ts`!). |
| **Layar Laptop 3D Utama** | `LaptopScreenRenderer.ts` (`1024×640`) | 100% UI/visual/grafik/screenshot asli khusus episode ini (konten penting tetap di *portrait-safe* `x = 128..896`). |
| **Prop & Gag 3D Karakter** | `components/CustomProps3D.ts` | Minimal 2–3 prop/gag 3D baru sesuai naskah+storyboard (bukan daur ulang otomatis api kepala / bola kristal / sticky note lama). |

---

## 5. Acting Kedua Karakter (Speaker + Listener = 2x Lebih Hidup!)

Kesalahan terbesar animasi 2 karakter adalah karakter yang tidak bicara menjadi patung diam. Di setiap panel storyboard, tulis acting untuk **KEDUANYA**:
- **Karakter yang Berbicara**: `speakPresence` halus (10 frame) + `mouthTalk` dari kata aktif + gestur bermotivasi (`point`, `stand_talk`, `hold_prop`, `type_desk`, dll.).
- **Karakter yang Mendengarkan**: `listenPresence` halus (12 frame) + perubahan mikro-ekspresi tepat di kata pemicu lawan bicara (alis naik, mata melirik ke layar lalu balik ke lawan bicara, mengangguk pelan, geleng kepala, atau mundur sedikit saat lawan bicara mulai absurd).

---

## 6. Anti-Template Storyboard Gate (9 Checklist Wajib Sebelum Fase 2)

Sebelum menjalankan sintesis VO atau menulis kode Remotion, audit `<slug>/storyboard.json` terhadap 9 pertanyaan ini — jika ada 1 saja yang gagal, revisi storyboardnya dulu:

1. **Apakah jumlah scene & struktur babaknya lahir dari cerita ini** (bukan copy 8-scene `claude-animasi-promo`)?
2. **Apakah ada minimal 5 variasi shot scale/angle berbeda** (termasuk minimal 2 sudut non-standar seperti `OTS`, `Low-Angle`, `High-Angle`, `Dutch-Tilt`, `ECU`, atau `Macro Prop Insert`)?
3. **Apakah setiap shot menuliskan `motivation` kamera yang jelas** dan tidak ada 2 shot berurutan dengan framing & arah gerak yang sama?
4. **Apakah ada minimal 2 custom 3D props/gags baru** yang spesifik untuk topik ini (di luar koleksi gag episode lama)?
5. **Apakah jadwal Time-of-Day & mood pencahayaan dipilih sadar sesuai cerita** (bukan otomatis `sunrise → golden_morning → night`)?
6. **Apakah karakter yang sedang DIAM punya reaksi/acting spesifik** di setiap shot yang menampilkannya?
7. **Apakah semua SFX direncanakan khusus untuk aksi fisik di storyboard ini** (termasuk penempatan *comedy pause* / *music drop* pada beat punchline orisinal)?
8. **Apakah `setDressingPlan` sudah menetapkan seluruh permukaan panggung** — baligho luar jendela, palet kamar, papan dinding kiri, monitor vertikal kanan, prop meja/jendela, dan layar laptop — **100% selaras dengan naskah episode ini**?
9. **ZERO Leftover Assets Check**: Apakah dijamin **tidak ada satu pun** teks, logo, poster, atau gag sisa video lama yang akan bocor ke dalam frame?
