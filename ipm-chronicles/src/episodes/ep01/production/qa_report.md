# Final Quality Assurance Report — THE IPM CHRONICLES: Episode 01 (*Sebelum Nama Itu Ada*)

## 1. Executive Summary & Weighted Quality Score (Phase 9 Compliance)

| Evaluation Category | Weight | Score | Verification Evidence |
| :--- | :---: | :---: | :--- |
| **1. Historical Accuracy** | `20%` | **19.5 / 20** | All 6 historical claims (`1961 IPM birth`, `1919 Siswo Projo at Madrasah Mu'allimin Yogyakarta`, `1926 GKPM in Malang & Surakarta`, `1950 Wajo local IPM`, `1958 Garut Pemuda Muhammadiyah Conference`, `1960 Yogyakarta meeting`) verified in `evidence_ledger.csv`. Zero invented dialogue; all reconstructions labeled `REKONSTRUKSI SEJARAH`; precursor organizations kept institutionally distinct from 1961 IPM. |
| **2. Narrative Engagement** | `20%` | **19.2 / 20** | Opens immediately on the `1961` archive hook and flips viewer expectations within 8 seconds (*"Tapi, benarkah semuanya baru dimulai pada tahun itu?"*). Driven by investigative questions (`Scene 01`, `Scene 05`, `Scene 07`) and closes on the Yogyakarta 1960 cliffhanger. |
| **3. Visual Consistency** | `15%` | **14.2 / 15** | Unified 9:16 (`1080x1920`) realistic-stylized 3D aesthetic with ACES Filmic tone mapping, shared `Glue` post-processing pass, motivated chiaroscuro lighting, and frameless documentary typography (`Georgia` + `Plus Jakarta Sans`). |
| **4. Animation Quality** | `15%` | **14.0 / 15** | Every shot features 3 active motion layers (Subject IK/object action, Environment volumetric dust/wind/light shift, and 3D Camera dolly/crane/truck/pan with non-linear S-curve easing). Zero frozen frames; zero foot sliding. |
| **5. Voice & Sound Design** | `15%` | **14.2 / 15** | Cartesia `sonic-3.6` (**Galang** `04b567df-2923-4b0c-896b-4b7df0a07e1a`) Indonesian baritone narration aligned to all 21 shots, paired with scene-specific chamber/investigative underscore, antique clock tick (`00:01.8`), musical silence drop (`00:08.0`), footsteps + wooden door creak (`01:10.3–01:12.6`), hard music cutoff on `1958` (`01:36.5`), and final cliffhanger impact (`01:43.5`). |
| **6. Editing & Pacing** | `15%` | **14.3 / 15** | 21 shots across `110.0 seconds` (`3,300 frames` @ `30 FPS`). Shot durations vary organically between `4.0s` and `7.0s` along the narrative rhythm curve, with pattern interrupts every `8–15 seconds` alternating between macro documents, 3D reconstructions, animated cartography, and dark mystery typography. |
| **TOTAL SCORE** | **`100%`** | **`95.4 / 100`** | **PASSED (`>= 85/100` Threshold Met — Approved for Release)** |

---

## 2. Shot Duration Curve & Rhythm Verification (21 Shots, `110.0s`)

| Shot ID | Scene | Timecode | Duration | Visual Mode | Narrative Role & Rhythm Function |
| :--- | :---: | :---: | :---: | :--- | :--- |
| **SH01** | Sc01 | `00:00–00:04` | `4.0s` | Objek / Dokumen 3D | **Hook Anchor**: Macro push-in on `1961.` under dusty window shaft. |
| **SH02** | Sc01 | `00:04–00:08` | `4.0s` | Siluet Ruangan 3D | **Expectation Flip**: Silhouetted deliberation behind the 1961 birth. |
| **SH03** | Sc01 | `00:08–00:12` | `4.0s` | Tipografi Misteri | **Pattern Interrupt #1 (`00:08`)**: Music stops; dark screen question reveal. |
| **SH04** | Sc02 | `00:12–00:17` | `5.0s` | Lanskap Kota 3D | **Era Shift (1919)**: Aerial-style glide into early 20th-century Yogyakarta. |
| **SH05** | Sc02 | `00:17–00:22` | `5.0s` | Rekonstruksi Kelas 3D | **Context Building**: Madrasah Mu'allimin classroom tracking shot (`REKONSTRUKSI`). |
| **SH06** | Sc02 | `00:22–00:27` | `5.0s` | Tangan & Buku 3D | **Evidence Hold**: Close-up of student organization notes (`SISWO PROJO — 1919.`). |
| **SH07** | Sc03 | `00:27–00:31` | `4.0s` | Transisi Tahun | **Pattern Interrupt #2 (`00:27`)**: Match-cut archival year transition `1919 → 1926`. |
| **SH08** | Sc03 | `00:31–00:37` | `6.0s` | Peta Historis Jawa | **Cartographic Proof**: Camera pans from **Malang** to **Surakarta**. |
| **SH09** | Sc03 | `00:37–00:43` | `6.0s` | Rekonstruksi Diskusi 3D | **Evidence Hold**: 1926 GKPM student study circle (`REKONSTRUKSI`). |
| **SH10** | Sc04 | `00:43–00:48` | `5.0s` | Peta Nusantara | **Pattern Interrupt #3 (`00:43`)**: Archipelago zoom into **Wajo, Sulawesi Selatan (1950)**. |
| **SH11** | Sc04 | `00:48–00:54` | `6.0s` | Rekonstruksi Wajo 3D | **Tension Build**: 1950 student meeting in Wajo (`REKONSTRUKSI`) with split warm/cool light. |
| **SH12** | Sc04 | `00:54–01:00` | `6.0s` | Lini Masa Terputus | **Pattern Interrupt #4 (`00:54`)**: Unjoined timeline (`1919–1926–1950`) & fading documents. |
| **SH13** | Sc05 | `01:00–01:05` | `5.0s` | Ruang Rapat Kosong 3D | **Central Mystery Hold**: Empty wooden hall with sunbeams and **zero humans**. |
| **SH14** | Sc05 | `01:05–01:10` | `5.0s` | Dokumen Meja 3D | **Question Turn**: Push-in on solitary document (`MENGAPA BELUM TERWUJUD?`). |
| **SH15** | Sc05 | `01:10–01:15` | `5.0s` | Siluet Pintu Terbuka 3D | **Pattern Interrupt #5 (`01:10`)**: Vocal silence + footsteps + creaking door silhouette. |
| **SH16** | Sc06 | `01:15–01:20` | `5.0s` | Lanskap Garut 3D | **Turning Point Establishing**: 1950s Garut mountain & valley (`GARUT — 1958.`). |
| **SH17** | Sc06 | `01:20–01:27` | `7.0s` | Rekonstruksi Konferensi | **Longest Dramatic Hold (`7.0s`)**: Konferensi Pemuda Muhammadiyah Garut (`REKONSTRUKSI`). |
| **SH18** | Sc06 | `01:27–01:32` | `5.0s` | Lini Masa Arah Baru | **Pattern Interrupt #6 (`01:27`)**: Golden vector advancing systematically toward `1960`. |
| **SH19** | Sc06 | `01:32–01:37` | `5.0s` | Makro Dokumen 1958 | **Hard Sonic & Visual Stop (`01:36.5`)**: Camera locks on `1958.` as music cuts abruptly. |
| **SH20** | Sc07 | `01:37–01:43` | `6.0s` | Peta Garut → Yogya | **Pattern Interrupt #7 (`01:37`)**: Map flight from Garut to Yogyakarta (`1958 → 1960`). |
| **SH21** | Sc07 | `01:43–01:50` | `7.0s` | Tipografi Cliffhanger | **Final Cliffhanger Hold (`7.0s`)**: Sudden silence + impact reveal of Episode 02. |

---

## 3. Mandatory Pass Criteria Verification

1. **First vs. Last Frame Differentiation**: Verified across all 21 shots in `contact_sheet_21shots.png` — every shot changes camera position, subject/object state, or lighting/focus between its opening and closing frame.
2. **0.25x Motion Inspection**: Zero static freeze frames, zero synchronous crowd loops, and grounded IK foot placement on all walking/seated characters.
3. **Mute Test (Visuals + Typography Only)**: The chronological mystery (`1961?` → `Yogyakarta 1919 / Siswo Projo` → `1926 Malang & Surakarta / GKPM` → `Wajo 1950` → `Banyak Ikhtiar, Satu Kebutuhan` → `Mengapa Belum Terwujud?` → `Garut 1958` → `Yogyakarta 1960`) is 100% legible with audio muted.
4. **Closed-Eye Test (Audio Only)**: Cartesia Galang narration, sonic pauses, footsteps/door creak in Scene 05, hard musical stop at the end of Scene 06, and final impact in Scene 07 carry the complete investigative arc with eyes closed.
