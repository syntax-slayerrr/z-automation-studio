# PHASE 2 & PHASE 4 — MOTION, KEYFRAME, CHOREOGRAPHY & CAMERA RECONSTRUCTION

## 1. 2D Virtual Camera Trajectory `(cx(f), cy(f), scale(f))`

All spatial transformations are governed by a deterministic 2D virtual camera rig acting on the `720 x 1280` canvas:

| Frame Interval | Time (s) | `cx(f)` (px) | `cy(f)` (px) | `scale(f)` | Interpolation / Easing | Camera Action |
|---|---|---|---|---|---|---|
| `0000..0021` | `0.00 - 0.70` | `358.0` | `590.0 -> 617.0` | `1.450 -> 0.910` | Cubic Hermite `ease_in_out` | Opening pull-out from clock dial while fading in from black (`f=0..8`) |
| `0021..0216` | `0.70 - 7.20` | `358.0` | `617.0` | `0.910 -> 0.995` | Linear continuous push-in | Slow cinematic push-in while clock hands spin through 24h cycle |
| `0217..0231` | `7.23 - 7.70` | `358.0` | `617.0` | `0.995` | Hold | Rust-red curtain wipes upward inside circular viewport |
| `0232..0246` | `7.73 - 8.20` | `358.0` | `617.0 -> 562.0` | `0.995 -> 3.200` | Cubic Hermite `ease_in_out` | Dive through clock bezel into `00.00` molten proto-Earth |
| `0246..0387` | `8.20 - 12.90` | `360.0` | `562.0` | `3.200` | Fullscreen hold | Molten proto-Earth expands (`f=240..256`) and pulses magma veins |
| `0387..0405` | `12.90 - 13.50` | `358.0` | `562.0 -> 622.0` | `3.200 -> 0.940` | Cubic Hermite `ease_in_out` | Pull back out to 24-hour clock dial as hands sweep `00:00 -> 04:00` |
| `0405..0428` | `13.50 - 14.27` | `358.0` | `622.0` | `0.940 -> 0.980` | Linear push-in | Teal ocean wipes into inner viewport at `±04.00` |
| `0428..0447` | `14.27 - 14.90` | `358.0` | `622.0 -> 562.0` | `0.980 -> 3.200` | Cubic Hermite `ease_in_out` | Dive through clock viewport into primordial teal ocean |
| `0447..0557` | `14.90 - 18.57` | `360.0` | `562.0` | `3.200` | Fullscreen hold | Primordial ocean with drifting green rod bacteria & concentric cells |
| `0557..0574` | `18.57 - 19.13` | `358.0` | `562.0 -> 618.0` | `3.200 -> 0.915` | Cubic Hermite `ease_in_out` | Pull back out to 24-hour clock dial |
| `0574..0690` | `19.13 - 23.00` | `358.0` | `618.0` | `0.915 -> 1.015` | Linear continuous push-in | Fast-forward microbe era spin (`04.07 -> 22.47`) |
| `0692..0710` | `23.07 - 23.67` | `358.0` | `618.0 -> 562.0` | `1.015 -> 3.200` | Cubic Hermite `ease_in_out` | Dive through clock viewport into `22.47` prehistoric dinosaur night |
| `0710..0992` | `23.67 - 33.07` | `360.0` | `562.0` | `3.200` | Fullscreen hold | Dinosaurs walk in (`f=702..730`), asteroid streaks (`f=900..932`), impact flash (`f=926..952`), dust rises & dinosaurs fall (`f=942..966`) |
| `0992..1006` | `33.07 - 33.53` | `360.0 -> 352.0` | `562.0 -> 618.0` | `3.200 -> 0.950` | Cubic Hermite `ease_in_out` | Pull back out to 24-hour clock dial (`Lalu manusia?`) |
| `1006..1052` | `33.53 - 35.07` | `352.0` | `618.0` | `0.950 -> 1.030` | Linear push-in | Red second hand sweeps while counter runs `23.47.21 -> 23.59.33` |
| `1052..1076` | `35.07 - 35.87` | `352.0 -> 515.0` | `618.0 -> 1016.0` | `1.030 -> 1.920` | Cubic Hermite `ease_in_out` | Zoom and pan into top-left chapter ring (`22..24`) |
| `1076..1145` | `35.87 - 38.17` | `515.0` | `1016.0` | `1.920` | Close-up hold | Yellow `6 DETIK` band & waving human figure appear; red second hand ticks to `24.00` (`f=1130`) |
| `1145..1173` | `38.17 - 39.10` | `515.0 -> 364.0` | `1016.0 -> 622.0` | `1.920 -> 0.960` | Cubic Hermite `ease_in_out` | Final pull-out to full 24-hour clock dial at `24.00 TENGAH MALAM` |
| `1173..1193` | `39.10 - 39.77` | `364.0` | `622.0` | `0.960` | Hold | Corner gears continue rotating at `24.00` |

---

## 2. Clock Hand & Era Arc Choreography

- **Corner Brass Gears**: Continuous deterministic angular velocity:
  - Top-Left Large (`20` teeth): `theta(f) = +0.25 * f` deg
  - Top-Left Medium (`14` teeth): `theta(f) = -0.35 * f` deg
  - Bottom-Right Medium (`14` teeth): `theta(f) = +0.325 * f` deg
  - Bottom-Right Large (`20` teeth): `theta(f) = -0.225 * f` deg
- **Fast-Forward Counter Piece-wise Curve (`Sequence 4`, `f = 580..690`)**:
  - Measured directly from reference frames every 6 frames (`0.20s`):
    `f=580: 04.07`, `f=588: 04.12`, `f=594: 04.26`, `f=600: 04.52`, `f=606: 05.35`, `f=612: 06.40`, `f=618: 08.09`, `f=624: 10.09`, `f=630: 12.42`, `f=636: 15.32`, `f=642: 17.48`, `f=648: 19.32`, `f=654: 20.49`, `f=660: 21.42`, `f=666: 22.16`, `f=672: 22.35`, `f=678: 22.44`, `f=684: 22.46`, `f=690: 22.47` (classic S-curve ease-in-out acceleration peaking at `f=630..642` and decelerating smoothly into `22.47`).
- **High-Precision Second Counter Curve (`Sequence 6`, `f = 1005..1072`)**:
  - Measured directly from reference frames:
    `f=1008: 23.47.21`, `f=1016: 23.51.14`, `f=1024: 23.54.13`, `f=1032: 23.56.25`, `f=1040: 23.57.58`, `f=1048: 23.58.58`, `f=1056: 23.59.33`, `f=1064: 23.59.49`, `f=1072..1130: 23.59.54` (exponential ease-out deceleration into `23.59.54`).
