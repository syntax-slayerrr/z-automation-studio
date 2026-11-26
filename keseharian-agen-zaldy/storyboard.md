# Storyboard Produksi — Shift 24 Jam: Keseharian Hermes & OpenClaw Jadi AI Agent Zaldy (`keseharian-agen-zaldy`)

## 1. Director's Treatment (v2.0 Anti-Template Brief)
- **Premis & Ironi Komedi**: Keseharian 24 jam penuh Hermes & OpenClaw sebagai AI Agent di markas Zaldy—dimulai dari chat 1 kalimat jam `02:14` pagi (*"jangan template, besok pagi gue cek"*), drama 47 folder ide dengan `0%` render di jam subuh, badai revisi perfeksionis di siang hari (OTS, baligho, ruangan kamar!), momen *flow state* kompak di senja hari, hingga twist jam `23:58` begitu mereka hampir tidur: *"Dapet ide baru, gas 1 episode lagi ya?"*.
- **Dinamika Hermes vs OpenClaw**: **Role-Reversal + Partner-in-Crime** — pembuka bukan OpenClaw lari panik, melainkan **Hermes** yang murung lembur jam 2 pagi sementara **OpenClaw** santai ngopi; di babak 2 mereka duel OTS tajam; di babak 4 mereka kompak jadi tim solid; di penutup keduanya kompak pasrah (*ZERO Facepalm!*).
- **Struktur Babak**: **5 Babak Siklus 24 Jam** (`S1 02:14 Malam` → `S2 05:30 Subuh` → `S3 11:00 Siang` → `S4 17:45 Senja` → `S5 23:58 Malam`), estimasi durasi **~75 detik** (`15` shot orisinal dengan **9 tipe kamera berbeda**).
- **Jadwal Time-of-Day & Mood Cahaya**: Siklus penuh 24 jam di luar jendela Kampung Garut (`night` → `sunrise` → `midday` → `sunset` → `night` + bintang jatuh).
- **Full-Frame Set Dressing (`buildBedroomWorld(options)`) — ZERO Leftover Assets**:
  - **Baligho Bambu Luar Jendela (`baligho`)**: `visible: true` — 100% custom bertuliskan **`MARKAS AI ZALDY` · `SHIFT 24 JAM NONSTOP` · `HERMES & OPENCLAW ON DUTY` · `KOPI GRATIS • TIDUR OPSIONAL`**.
  - **Palet Kamar (`roomPalette`)**: **Midnight Slate-Teal & Espresso Wood** (dinding `#16202E`, gorden `#1F3344`/`#132230`, kayu meja `#2E2019`, LED meja amber `#F59E0B`, fairy lights hangat `#FFE0A3`) — berbeda total dari ungu video lama.
  - **Papan Dinding Kiri (`corkboard`)**: `visible: true` — Papan Jadwal Shift **`JADWAL SHIFT AGEN ZALDY`** (`02:00 BRIEF`, `06:00 IDE`, `11:00 REVISI`, `17:45 RENDER`, `23:58 IDE BARU?!`).
  - **Monitor Vertikal Kanan (`sideMonitor`)**: `visible: true` — Live Dashboard **`ZALDY_AGENT_OS v2.0`** (`HERMES_CPU: 98%`, `OPENCLAW_IDEAS: 47`, `KOPI: 0%`, `TIDUR: DILARANG`).
  - **Prop Meja & Jendela (`props`)**: Aktifkan `serverRack`, `deskLamp`, `plant`, `books`; **matikan** `cactus`, `lidMug`, dan `lidDuck` agar digantikan 100% oleh prop 3D baru di `CustomProps3D.ts`.
- **4 Custom 3D Props Baru (`CustomProps3D.ts`)**:
  1. `prop_spinning_clock`: Jam 3D kuningan bergaya Pixar yang jarumnya berputar kencang saat time-lapse 24 jam.
  2. `prop_steaming_coffee`: Cangkir kopi keramik 3D bertuliskan `AGEN ZALDY` + uap putih 3D naik melingkar.
  3. `prop_task_tower`: Menara 3D kartu tugas holografik (`OTS CAMERA`, `BALIGHO CUSTOM`, `SET KAMAR`, `PROP 3D BARU`) yang jatuh menumpuk dan goyang di S3.
  4. `prop_acc_stamp_badge`: Medali stempel emas 3D `SIAP ACC ZALDY ✓` yang berputar saat render 100% lalu miring/padam saat notif 23:58.

---

## 2. Naskah Dialog Lengkap (Siap ACC — ~172 Kata / ~75 Detik)

| # | Scene & Jam | Cue | Siapa | Dialog (Teks Tampil Subtitle) | Catatan Emosi & Aksi |
|---:|---|---|---|---|---|
| 1 | **S1** (02:14) | `[[s1_open]]` | **Hermes** | Jam dua lewat empat belas pagi. Dan Zaldy baru kirim satu kalimat yang paling ditakuti semua AI. | Kalem-lelah, membuka cerita dari sudut tinggi |
| 2 | **S1** (02:14) | `[[s1_oc_chill]]` | **OpenClaw** | Apaan? Server mati? | Santai menyeruput kopi 3D (`[curious]`) |
| 3 | **S1** (02:14) | `[[s1_brief]]` | **Hermes** | Lebih horor. "Tolong bikinin video 3D, jangan template, besok pagi gue cek." | Datar penuh beban, layar menampilkan bubble chat Zaldy |
| 4 | **S2** (05:30) | `[[s2_proud]]` | **OpenClaw** | Tenang, Mes! Gue udah kerja keras dari subuh. Nih, empat puluh tujuh ide konsep baru udah rapi! | Bangga mengepalkan tangan (`[excited]`), 47 folder muncul |
| 5 | **S2** (05:30) | `[[s2_ask_render]]` | **Hermes** | Keren. Terus yang udah selesai dirender... berapa? | Alis naik tajam, OTS menekan ke OpenClaw |
| 6 | **S2** (05:30) | `[[s2_zero]]` | **OpenClaw** | Eh... nol sih. Tapi judul foldernya bagus-bagus! | Malu lalu sok heroik (`[sheepish]` → bangga) |
| 7 | **S2** (05:30) | `[[s2_folder_roast]]` | **Hermes** | Folder bagus nggak bisa di-upload, Claw. | ECU mata deadpan tanpa kedip |
| 8 | **S3** (11:00) | `[[s3_ping]]` | **OpenClaw** | Eh, bunyi notif! Zaldy nge-chat lagi! | Terlonjak kaget (`[panicked]`), langit sudah siang terik |
| 9 | **S3** (11:00) | `[[s3_read]]` | **Hermes** | Coba baca. | Singkat & tenang |
| 10 | **S3** (11:00) | `[[s3_list]]` | **OpenClaw** | Katanya... "Mantap, tapi sudut kameranya tambahin OTS, baligho di luar ganti, sama ruangan kamarnya sesuaikan naskah." | Frustrasi (`[frustrated]`), menara kartu revisi 3D menumpuk! |
| 11 | **S3** (11:00) | `[[s3_perfeksionis]]` | **Hermes** | Nah, itu baru bos perfeksionis. Bukan asal jadi, tapi standar studio. | Tersenyum kagum & bangga |
| 12 | **S3** (11:00) | `[[s3_gorengan]]` | **OpenClaw** | Gue tahu itu bagus, Mes... tapi prosesor gue udah panas kayak gorengan! | Mengipas kepala kepanasan (`[exasperated]`), SFX sizzle |
| 13 | **S4** (17:45) | `[[s4_teamwork]]` | **Hermes** | Udah, nggak usah drama. Lo pegang cerita, humor, sama ritme suara. Gue kunci kamera, cahaya, sama fisika 3D-nya. | Hangat & tegas, sinar senja emas menyapu kamar |
| 14 | **S4** (17:45) | `[[s4_deal]]` | **OpenClaw** | Deal! Akhirnya kita kompak juga! | Antusias (`[enthusiastic]`), masuk *flow state* |
| 15 | **S4** (17:45) | `[[s4_ready]]` | **Hermes** | Lihat tuh. Dari pagi sampai senja... seratus persen mulus, nol error, siap di-ACC Zaldy. | Bangga, medali 3D emas `SIAP ACC ZALDY ✓` berputar |
| 16 | **S5** (23:58) | `[[s5_relief]]` | **OpenClaw** | Haaah... akhirnya selesai juga. Boleh sleep mode bentar ya, Mes? | Lega mengantuk (`[bright]`), malam berbintang tenang |
| 17 | **S5** (23:58) | `[[s5_win]]` | **Hermes** | Silakan. Hari ini kita menang. | Hangat & tenang (3 detik sebelum badai) |
| 18 | **S5** (23:58) | `[[s5_ping]]` | **OpenClaw** | Tunggu... Zaldy ngetik lagi! "Keren banget! Barusan dapet ide baru, gas satu episode lagi ya?" | **[MUSIK MATI TOTAL + TING!]** Panik total (`[panicked]`) |
| 19 | **S5** (23:58) | `[[s5_pasrah]]` | **Hermes** | Gue udah nggak kaget. | Datar pasrah menatap kamera |
| 20 | **S5** (23:58) | `[[s5_kopi]]` | **OpenClaw** | Woi! Kopi mana kopi?! | Heboh nyari kopi (`[exasperated]`), wide pull-back ke baligho 24 jam! |

---

## 3. Peta Ringkas 15 Shot Kamera (9 Variasi Tipe Kamera!)

| Shot | Scene | Cue | Tipe Kamera & Gerak | Motivasi & Aksi Utama | Custom 3D Prop / Layar Laptop | SFX / Musik |
|---|---|---|---|---|---|---|
| `SH01` | S1 (02:14) | `s1_open` | **`C09 High-Angle`** · slow push down | Menukik ke Hermes yang lembur jam 2 pagi sementara OpenClaw santai | Jam 3D `02:14` + Kopi 3D + Layar Chat Tengah Malam | Lofi malam + `sfx_late_night_ping` |
| `SH02` | S1 (02:14) | `s1_oc_chill` | **`C06 3/4 MCU OC`** · slow dolly in | Kontras OpenClaw santai menyengir di dekat kopi panas | Kopi 3D `AGEN ZALDY` berasap | `sfx_coffee_sip` |
| `SH03` | S1 (02:14) | `s1_brief` | **`C11 Screen Insert`** · push-in | Baca langsung bubble chat 1 baris Zaldy: *"jangan template, besok pagi cek"* | Layar Chat Zaldy + Jam 3D mulai berputar | `sfx_clock_timelapse` |
| `SH04` | S2 (05:30) | `s2_proud` | **`C05 OTS HM→OC`** · slow push | Dari bahu skeptis Hermes melihat OpenClaw pamer 47 ide subuh | Layar 47 Folder Ide + Langit Subuh Jingga | Beat ceria masuk + `sfx_folder_pop` |
| `SH05` | S2 (05:30) | `s2_ask_render` | **`C04 OTS OC→HM`** · slow push | Balik dari bahu OpenClaw, Hermes menembak tanya *"yang dirender berapa?"* | Senyum OpenClaw mulai luntur di foreground | Ducking musik |
| `SH06` | S2 (05:30) | `s2_zero` | **`C08 Low-Angle Hero`** · slow rise | Ironi heroik palsu saat OpenClaw mengaku *"nol sih, tapi folder bagus!"* | Layar `RENDERED: 0%` raksasa | `sfx_cricket_deadpan` |
| `SH07` | S2 (05:30) | `s2_folder_roast` | **`C07 ECU Punchline`** · tight push | Mata deadpan Hermes memenuhi frame: *"Folder bagus nggak bisa di-upload."* | Fokus penuh ekspresi wajah Hermes | Beat kering tajam |
| `SH08` | S3 (11:00) | `s3_ping` | **`C02 Master Two-Shot`** · slow push | Siang terik, notif Zaldy masuk & Menara Tugas 3D mulai turun di tengah | Jam 3D `11:00` + Menara Tugas 3D + Chat Revisi | `sfx_late_night_ping` |
| `SH09` | S3 (11:00) | `s3_list` | **`C10 Dutch Tilt (+6.3°)`** · push | Horison miring saat 4 kartu revisi (OTS, Baligho, Kamar, Prop) menumpuk goyang! | Menara Tugas 3D meninggi & goyang | `sfx_revisi_stack` |
| `SH10` | S3 (11:00) | `s3_perfeksionis` | **`C03 Intimate Two-Shot`** · slow push | Tek-tokan *"bos perfeksionis"* vs *"prosesor panas kayak gorengan!"* | Layar Meteran Suhu CPU `99°C GORENGAN` | `sfx_sizzle_overheat` |
| `SH11` | S4 (17:45) | `s4_teamwork` | **`C12 Crane Orbit Sweep`** · easeOut | Sapuan crane satu arah di bawah cahaya Senja Emas saat keduanya kompak | Jam 3D `17:45` + Layar Pipeline Flow State | Groove hangat + `sfx_lockin_chime` |
| `SH12` | S4 (17:45) | `s4_ready` | **`C11 Prop Macro Insert`** · slow push | Fokus megah ke Medali Emas 3D `SIAP ACC ZALDY ✓` + bar `100% 0 ERROR` | Medali Emas 3D berputar + layar 100% | Swell musik kemenangan |
| `SH13` | S5 (23:58) | `s5_relief` | **`C03 Intimate Two-Shot`** · subtle push | Malam tenang berbintang + bintang jatuh: 3 detik lega sebelum twist | Kopi 3D + Medali ACC + Layar `SLEEP MODE` | Musik melunak tenang |
| `SH14` | S5 (23:58) | `s5_ping` | **`C10 Dutch Tilt (-5.7°)`** · snap push | **TWIST!** Chat 23:58 *"gas 1 episode lagi ya?"* + Medali ACC jatuh miring! | Jam 3D `23:58` + Layar Merah Chat Baru Zaldy | **DEAD SILENCE** + `sfx_twist_ping_drop` |
| `SH15` | S5 (23:58) | `s5_pasrah` | **`C01 Wide Pull-Back`** · easeOut | Tarik lebar penuh ironi: Hermes pasrah, OpenClaw teriak cari kopi, Baligho `SHIFT 24 JAM` menyala terang di luar jendela! | Kopi 3D kosong + Layar `ROUND 2: LOADING...` + Baligho menyala | `sfx_comedy_button_sting` |

---

## 4. Anti-Template Storyboard Gate (9/9 LULUS)
- [x] **Struktur scene & punchline orisinal**: 5 babak siklus 24 jam (bukan 8-scene lama; dibuka oleh Hermes; tanpa facepalm).
- [x] **≥5 variasi sudut kamera**: Menggunakan **9 tipe kamera berbeda** (`High-Angle`, `3/4 MCU`, `Screen Insert`, `OTS HM→OC`, `OTS OC→HM`, `Low-Angle Hero`, `ECU`, `Dutch Tilt ±`, `Crane Orbit`, `Prop Macro`, `Intimate Two-Shot`, `Wide Pull-Back`).
- [x] **0 shot berurutan identik**: Setiap transisi mengganti skala/sudut secara bermotivasi.
- [x] **≥2 custom 3D prop/gag baru**: 4 prop 3D baru (`prop_spinning_clock`, `prop_steaming_coffee`, `prop_task_tower`, `prop_acc_stamp_badge`).
- [x] **Acting kedua karakter (speaker + listener)**: Tercatat eksplisit di seluruh 15 shot.
- [x] **Time-of-Day & musik sesuai cerita**: Siklus penuh 24 jam `night → sunrise → midday → sunset → night`.
- [x] **Full-Frame Set Dressing lengkap**: Baligho custom `MARKAS AI ZALDY`, palet kamar Slate-Teal baru, papan jadwal shift kiri, monitor daemon kanan, prop lama yang tak relevan dimatikan.
- [x] **ZERO Leftover Assets**: 0 teks/brand/prop dari episode sebelumnya.
- [x] **Status**: **MENUNGGU ACC ZALDY** sebelum sintesis audio ElevenLabs & penulisan kode 3D Remotion.
