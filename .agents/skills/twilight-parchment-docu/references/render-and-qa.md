# Rendering, Chunking & Final Broadcast QA Runbook

Proven reference script: `human-fire/scripts/render_humanfire_chunks.ps1`

## 1. Windows PowerShell & Remotion Stability Rules
- **Never set `$ErrorActionPreference = "Stop"`** before native CLI tools (`npx`, `python`, `ffmpeg`, `ffprobe`); Windows PowerShell 5.1 aborts on benign stderr output. Always set `$ErrorActionPreference = "Continue"` and check `$LASTEXITCODE` explicitly.
- **Redirect Temp Dir to `D:`**: Always set `$env:TEMP` and `$env:TMP` to `<slug>\.tmp` so Chromium temporary files never fill `C:`.
- **Pre-Bundle ONCE**: Run `npx remotion bundle remotion/index.ts --out-dir <slug>\.bundle` once, then pass `<slug>\.bundle` to all `remotion still` and `remotion render` calls (avoids repeating esbuild + public-dir copies 8–20 times!).
- **Clean TypeScript Gate**: Always run `npx tsc --noEmit 2>&1 | Select-String "<slug>"` (filtering out unrelated legacy compositions) and require `0` errors before bundling.

## 2. Resumable Chunked Render + Broadcast Concat/Mux
Single monolithic Chromium renders >700–1,000 frames can hit transient process crashes on Windows. Always use the **resumable chunk pipeline**:
1. Split total frames into ~350–405 frame chunks (`c1..cN`) rendered with `--muted --crf=14 --log=error` (`--concurrency=2` for pure-SVG 2D; `--concurrency=1 --gl=angle` if WebGL/Three.js is used).
2. Give each chunk up to **2 automatic attempts** and clean `<slug>\.tmp` between chunks.
3. Verify every chunk's exact frame count via `ffprobe`:
   ```powershell
   $raw = (& ffprobe -v error -select_streams v:0 -count_packets -show_entries stream=nb_read_packets -of default=noprint_wrappers=1:nokey=1 $path 2>$null)
   $s = (($raw -join '').Trim() -replace '[^0-9]', '')
   ```
   *(Never use `-of csv=p=0` with strict `^\d+$` regex — `ffprobe` appends a trailing comma!)*
4. Concatenate all verified chunks into a single pristine broadcast H.264 stream with bit-exact audio copy:
   ```powershell
   ffmpeg -y -loglevel warning -f concat -safe 0 -i $concatList -i $audioM4a `
     -map 0:v:0 -map 1:a:0 `
     -vf "scale=in_range=full:out_range=tv,format=yuv420p" `
     -c:v libx264 -preset medium -crf 17 -pix_fmt yuv420p `
     -colorspace bt709 -color_primaries bt709 -color_trc bt709 -r 30 -movflags +faststart `
     -c:a copy $outMp4
   ```

## 3. Mandatory Final Verification on Exported MP4
Never quote pre-mux or single-still results as final proof — always measure **directly on the exported MP4**:
1. **`ffprobe`**: Confirm `h264`, `yuv420p`, `bt709`, exact dimensions (`720×1280`), `30/1 fps`, exact `nb_frames`, `aac 48000 Hz stereo`.
2. **Loudness (`ebur128=peak=true`)**: Confirm Stereo AND `-ac 1` Mono downmix both read `-14.5 LUFS` (±0.3 LU) and True Peak `≤ -1.9 dBFS`.
3. **Decoded Contact Sheet (`qa_contact_sheet.jpg`)**: Extract 12–15 exact frames across all scenes directly from the final MP4 using FFmpeg `select='eq(n\,...)+...' -fps_mode passthrough` (never rely on `cv2` seek for frame-exact checks!) and **visually inspect every panel with `read_file`**.
4. **Audio Pronunciation Spot-Listen**: Extract any critical/re-generated audio segments directly from the final MP4 and listen via `read_file` to confirm clean playback in the final muxed file.
5. **Cleanup**: Remove `<slug>\.chunks`, `<slug>\.bundle`, and `<slug>\.tmp`, leaving `<slug>\out\` spotless with only final deliverables (`<name>.mp4`, `qa_contact_sheet.jpg`, `audio_qa_sheet.png`, `SOUND.md`, `CREDITS.txt`).
