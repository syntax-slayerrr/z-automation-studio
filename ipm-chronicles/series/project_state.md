# IPM Chronicles — Project State (`ipm-chronicles/series/project_state.md`)

## Series Overview
- **Series Title**: *THE IPM CHRONICLES* (*Ikatan Pelajar Muhammadiyah Historical Documentary Series*)
- **Workspace Root**: `d:\PROJECTS\z-automation-studio\ipm-chronicles\`
- **Format**: `9:16 Vertical` (`1080x1920`, `30 FPS`, `60–120 seconds` per episode)
- **Visual Style (Locked v2.1)**: **Clean 2.5D Painted Plates + Vector Character/Prop Engine + True 3D Projection Architecture** (`Flat3DCamera` + `HeritageKid` + `HeritageProps25D` + `AtlasMap2D` `d3-geo` + `IpmEmblem25D` + `CinematicV2` + `MuseumPaperGrade`), dengan standar *Cinematic Dramatic* (1:1 *grounding*, *match-zoom portal blooms*, 12-frame *color-matched bridge dissolves*, akting multi-ketukan, animasi B-roll `strokeDashoffset`).
- **Voice-Over Engine**: Cartesia `sonic-3` (`language="id"`, voice **Galang** `04b567df-2923-4b0c-896b-4b7df0a07e1a`, beat kalimat utuh bertag inline `<emotion value="..."/>` terukur tanpa berlebih, wajib uji `<spell>` akronim & pra-cek pelafalan lewat `narration_tts.txt`)
- **Standard Workflow**: `ipm-chronicles/series/WORKFLOW.md` (`v2.1`)

---

## Episode 01 Status: **COMPLETE & VERIFIED**
- **Composition ID**: `IpmEp01`
- **Duration**: `102.677 seconds` (`3,080 frames` @ `30 FPS`)
- **Structure**: `7 Scenes` (`S0`–`S6`) terikat frame-exact ke `src/episodes/ep01/alignment.json` via `src/shared/scriptEngine.ts`
- **Deliverables Verified**:
  1. Final Indonesian Narration & Alignment: `src/episodes/ep01/production/narration_master_v5.txt` & `src/episodes/ep01/alignment.json`
  2. Engine & Scenes: `src/shared/{Flat3DCamera,HeritageKid,HeritageProps25D,AtlasMap2D,EditorialCaptions,VintageCartouche,PaperTextures,scriptEngine}.tsx|ts` & `src/episodes/ep01/{Ep01ScenesPartA,Ep01ScenesPartB,IpmEp01}.tsx`
  3. Master Audio (`44.1kHz -> 48kHz AAC stereo`): `public/audio/ep01/ep01_v5_master.wav` (VO: `public/audio/ep01/ep01_vo_galang.wav`, built via `pipeline/ep01_build_vo.py` & `pipeline/ep01_build_sound.py`)
  4. QA Stills (`16 keyframes` across 2 sheets): `pipeline/render_qa_stills.cjs` -> `out/ep01/qa_v5/` (`QA_V5_SHEETS_COMPLETE`)
  5. Final Master MP4: `out/ep01/ep01_master.mp4` (`49.98 MB`, `1080x1920`, `30 fps`, `h264`/`aac`, `-14.6 LUFS`, `LRA 2.0 LU`, `True Peak -2.4 dBFS`, rendered via `npm --prefix ipm-chronicles run render:ep01`)
  6. Verified Evidence Claims: `series/evidence_ledger.csv` (`CLM-01-01` – `CLM-01-06`)

---

## Episode 02 Status: **COMPLETE & VERIFIED (EMOTION VO + DETIK 66–73 IRM SYNC FIXED · `ep02_master.mp4`)**
- **Composition ID**: `IpmEp02` (*"Nama yang Pernah Hilang"*)
- **Duration**: `136.811 seconds` (`4,104 frames` @ `30 FPS`, `1080x1920`)
- **Structure**: `6 Scenes` (`S0`–`S5`, `15` cohesive emotion-tagged VO beats, `249` aligned words, `41` sync cues) synchronized 100% ke `src/episodes/ep02/alignment.json` via `src/shared/scriptEngine.ts`
- **Deliverables Verified**:
  1. Narration & Evidence: `src/episodes/ep02/production/narration_master.txt` (`249` words), & `series/evidence_ledger.csv` (`CLM-02-01` – `CLM-02-04` VERIFIED/APPROVED)
  2. Voice-Over Revised (`Cartesia sonic-3`, `language="id"`): `public/audio/ep02/ep02_vo_galang.wav` (`134.891s`), digabungkan dari 15 alur kalimat kohesif bertag `<emotion value="..."/>` terukur (`calm`, `contemplative`, `melancholic`, `concerned`, `determined`, `proud`, `curious`, `confident` via `pipeline/ep02_build_vo.py`), dipadu tambalan lokal untuk 3 ketidakteraturan lafal/potong (`S1_L2` kalimat `"Puncaknya, 1976..."`, `S3_L2` `<spell>IPM</spell>` `"I-P-M"`, `S5_L0` `"Pertanyaannya:"` + trim spike ekor `14.42s`) dengan pembulatan fase `-14 LUFS` / `TP -1.5 dBFS`. *Catatan transparan*: 1 kata `"nama IRM"` di `S3_L0` (`~74.6–75.4s`) masih memiliki sedikit aksen `"Ai-Ar-Em"` karena akun Cartesia API mencapai batas kredit (`HTTP Error 402: Payment Required`) saat hendak me-*re-roll* khusus baris `S3_L0` tersebut.
  3. Clean Plates + 1:1 Grounding & Detik 66–73 IRM Sync Fix: `public/art/ep02/*`, `src/shared/{IpmEmblem25D,CinematicV2}.tsx`, `src/episodes/ep02/{Ep02ScenesPartA.tsx,Ep02ScenesPartB.tsx}` — `Scene2OrdeBaru1992` disinkronkan 1:1 ke cue kata lisan (`s2_ketuk` ~`66.19s` untuk stempel + flinch, tahan `PELAJAR` sepanjang *"Ikatan Pelajar Muhammadiyah"*, *hinge compression* mulai `s2_berganti` ~`69.28s`, berbalik ke `REMAJA`/`IRM` tepat pada `s2_remaja`–`s2_irm` `70.45–72.56s`, ditambah jeda `0.65s` sebelum `S3`).
  4. Audio Mix (`48kHz stereo`, AAC): `public/audio/ep02/ep02_master_audio.wav` (`136.79s`, built via `pipeline/ep02_build_sound.py` dengan event SFX terikat tepat ke `s2_nov18`, `s2_ketuk`, `s2_berganti`, `s2_irm` dan seluruh `41` cue)
  5. QA & TypeScript Verification: `npm run tsc` PASS (0 errors), `npm run qa:ep02` (`QA_EP02_SHEETS_COMPLETE`) diinspeksi visual pada `out/ep02/qa/{qa_ep02_sheet1.jpg,qa_ep02_sheet2.jpg}` + verifikasi ekstrak audio-visual detik `65–74` dan ekor `129–137` langsung dari `ep02_master.mp4`
  6. Rendered MP4 Master: `out/ep02/ep02_master.mp4` (`102.60 MB`, `107,582,478 bytes`, `1080x1920`, `30 fps`, `h264`/`aac` `48kHz` stereo, `6.29 Mbps`, `136.811s`, `-14.5 LUFS`, `LRA 3.2 LU`, `True Peak -1.5 dBFS`, rendered via `npm --prefix ipm-chronicles run render:ep02` dengan `concurrency: 2`)
- **Catatan Peningkatan Lanjutan Untuk EP03**:
  - **Visual, pijakan, kamera, transisi, & animasi karakter**: workflow v2.1 disetujui dan **disimpan sebagai standar Episode 03**.
  - **VO & Naskah EP03**: gunakan alur kalimat kohesif bertag `<emotion value="..."/>` terukur (bukan potongan terlalu mikro yang membuat intonasi patah-patah), wajib uji `<spell>` untuk akronim (`IPM`/`IRM`/`PP`), dan gabungkan dengan referensi gaya narasi & VO dari user untuk Episode 03.

---

## Episode 03 Status: **COMPLETE & VERIFIED (`IpmEp03` v6 · True World-Matrix Billboard, Continuous 2π Gait, Clean Shoulder/Skirt Rig, & Full B-Roll Coverage · `ep03_master.mp4`)**
- **Composition ID**: `IpmEp03` (*"Ketika Gagasan Turun ke Kelas"*)
- **Duration**: `95.850 seconds` (`2,876` rendered composition frames, `2,875` muxed video frames @ `30 FPS`, `1080x1920`)
- **Structure**: `5 Scenes` (`S0`–`S4`), **21 Shot Dokumenter Terarah**, **B-Roll Progresif di Setiap Adegan** (Lectern `Tanfidz` + Stempel -> Koridor Berselasar Kolom & Jendela Matahari -> Papan Diagram `ATURAN PUSAT -> ? -> SISWA BARU` pada Meja Andi -> Papan `PP->PR` + Diorama 4 Bangunan Basis -> Lectern `SPI` -> Gerbang `FORTASI` + *Pan* ke Easel `ARAH GERAKAN` -> 4 Podium Naik `Taruna Melati` -> *Pan* Papan `JADWAL ORIENTASI · RUMAH PELAJAR` di Meja Anisa -> Peta Jawa + Miniatur Pendopo & Plakat `1923` -> Veranda Kolonial `KRONIK GARUT (1923–1958)` -> Panggung Konferensi `1958` + *Hero Push* ke Obor -> Papan Jaringan Ranting `Panawuan` -> Rel Node Progresif `PC IPM PANAWUAN` -> Mimbar `PDPM` -> Lentera Senja Galang).
- **Pose-to-Pose Character Engine (0% Looping Snaps)**: `HeritageBillboard.tsx` membungkus fase jalan secara kontinu `0..2π` (tanpa reset patah *sawtooth*), menonaktifkan osilasi napas metronomik, dan memakai `localToWorld` (`getWorldPosition`) untuk orientasi billboard dalam grup bersarang; `HeritageKid.tsx` memakai jahitan lengan-bahu menyatu ke keliman baju (*open-top sleeve*), rok lipit panjang rapi untuk karakter santriwati, kedipan independen per-*seed*, serta gerak bibir *D-shape* selaras `alignment.json` (`173` words, `26` sync cues) di atas `1` `<ThreeCanvas>` persisten.
- **Deliverables Verified**:
  1. Narration & Evidence: `src/episodes/ep03/production/narration_master.txt` (`173` words), `narration_tts.txt`, & `series/evidence_ledger.csv` (`CLM-03-01` – `CLM-03-04` VERIFIED/APPROVED)
  2. Voice-Over (`ElevenLabs`, `language_code="id"`, audio tags terukur): `public/audio/ep03/ep03_vo.wav` (`93.450s`, dibangun via [ep03_build_vo.mjs](file:///d:/PROJECTS/z-automation-studio/ipm-chronicles/pipeline/ep03_build_vo.mjs)) — Narator **Chris** (`iP95p4xoKVk53GoZ742B`) dipadu dialog pendek `REKONSTRUKSI · KADER` (**Will** & **Bella**).
  3. Audio Mix (`48kHz stereo`, AAC): `public/audio/ep03/ep03_master_audio.wav` (`95.85s`, dibangun ulang via [ep03_build_sound.py](file:///d:/PROJECTS/z-automation-studio/ipm-chronicles/pipeline/ep03_build_sound.py) dengan tambahan *micro-foley* B-Roll v6; `-14.5 LUFS`, `LRA 3.3 LU`, `Peak -1.5 dBFS`).
  4. Hybrid 2D-in-3D World Engine & 4 Set Modular (`v6`):
     - Shared WebGL/Post/UI/Billboard Engine: [ep03Shaders.ts](file:///d:/PROJECTS/z-automation-studio/ipm-chronicles/src/shared/three3d/ep03Shaders.ts), [ep03Post.ts](file:///d:/PROJECTS/z-automation-studio/ipm-chronicles/src/shared/three3d/ep03Post.ts), [ep03Lighting.ts](file:///d:/PROJECTS/z-automation-studio/ipm-chronicles/src/shared/three3d/ep03Lighting.ts), [worldTextures.ts](file:///d:/PROJECTS/z-automation-studio/ipm-chronicles/src/shared/three3d/worldTextures.ts), [HeritageBillboard.tsx](file:///d:/PROJECTS/z-automation-studio/ipm-chronicles/src/shared/three3d/HeritageBillboard.tsx), [HeritageKid.tsx](file:///d:/PROJECTS/z-automation-studio/ipm-chronicles/src/shared/HeritageKid.tsx), [EditorialCaptions.tsx](file:///d:/PROJECTS/z-automation-studio/ipm-chronicles/src/shared/EditorialCaptions.tsx).
     - Episode 03 3D Sets, 21-Shot Camera & Lip-Sync: [ep03PropTextures.ts](file:///d:/PROJECTS/z-automation-studio/ipm-chronicles/src/episodes/ep03/three/ep03PropTextures.ts), [ep03Camera.ts](file:///d:/PROJECTS/z-automation-studio/ipm-chronicles/src/episodes/ep03/three/ep03Camera.ts), [ep03LipSync.ts](file:///d:/PROJECTS/z-automation-studio/ipm-chronicles/src/episodes/ep03/three/ep03LipSync.ts), [SetAMuktamar.tsx](file:///d:/PROJECTS/z-automation-studio/ipm-chronicles/src/episodes/ep03/three/SetAMuktamar.tsx), [SetBClassroomSpi.tsx](file:///d:/PROJECTS/z-automation-studio/ipm-chronicles/src/episodes/ep03/three/SetBClassroomSpi.tsx), [SetCPrianganMap.tsx](file:///d:/PROJECTS/z-automation-studio/ipm-chronicles/src/episodes/ep03/three/SetCPrianganMap.tsx), [SetDPanawuanDusk.tsx](file:///d:/PROJECTS/z-automation-studio/ipm-chronicles/src/episodes/ep03/three/SetDPanawuanDusk.tsx), [Ep03World3D.tsx](file:///d:/PROJECTS/z-automation-studio/ipm-chronicles/src/episodes/ep03/three/Ep03World3D.tsx), & [IpmEp03.tsx](file:///d:/PROJECTS/z-automation-studio/ipm-chronicles/src/episodes/ep03/IpmEp03.tsx).
  5. QA, Motion Audit & Checks: `npm run ipm:tsc` PASS (`0` errors), `series_audit.py variation_matrix.csv` PASS, inspeksi visual 16 *QA stills* baru di `out/ep03/qa_v6/qa_v6_sheet.jpg` & 64-frame *contact sheets* `c1_v6.jpg`–`c4_v6.jpg` (lolos tanpa *treadmill walk*, tabrakan `FORTASI`, clipping `12_s16`/`13_s17`, ataupun jahitan lengan kasar), serta OpenCV full-video audit (`frames=2875`, `mean_diff=3.77`, `p95_diff=10.06`, `blacks=0`, `whites=0`, `frozen=0`).
  6. Rendered MP4 Master: `out/ep03/ep03_master.mp4` (`111.57 MB`, `116,991,724 bytes`, `1080x1920`, `30 fps`, `h264`/`aac` `48kHz` stereo, bitrate `9,764,567` bps, `95.850s`, `-14.5 LUFS`, `LRA 3.3 LU`, `Peak -1.5 dBFS`).
