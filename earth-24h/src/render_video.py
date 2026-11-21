import os
import sys
import json
import math
import subprocess
import numpy as np
from PIL import Image, ImageDraw
from clock_rig import draw_clock_frame, lerp, ease_in_out
from scenes import (
    render_starry_indigo_canvas,
    render_day_night_viewport,
    render_molten_earth_scene,
    render_primordial_ocean_scene,
    render_prehistoric_dinos_scene,
    render_post_impact_twilight_viewport,
)
from typography import draw_top_header, draw_subtitle_card, format_microbe_counter

ROOT_DIR = r"d:\PROJECTS\z-automation-studio\earth-24h"
REF_VIDEO = os.path.join(ROOT_DIR, "ref.mp4")
SHAPES_PATH = os.path.join(ROOT_DIR, "assets", "vector_shapes.json")
OUT_DIR = os.path.join(ROOT_DIR, "out")
os.makedirs(OUT_DIR, exist_ok=True)

with open(SHAPES_PATH, "r", encoding="utf-8") as _f:
    VECTOR_SHAPES = json.load(_f)

# Deterministic subtle paper grain texture & warm optical corner vignette (720x1280)
_GRAIN_RNG = np.random.default_rng(1337)
_PAPER_GRAIN = _GRAIN_RNG.normal(0.0, 2.2, (1280, 720, 1)).astype(np.float32)
_VY, _VX = np.mgrid[0:1280, 0:720].astype(np.float32)
_VR = np.sqrt(((_VX - 360.0) / 420.0) ** 2 + ((_VY - 620.0) / 740.0) ** 2)
_VIGNETTE_MUL = (1.0 - 0.10 * np.clip((_VR - 0.72) / 0.58, 0.0, 1.0) ** 1.8)[:, :, None].astype(np.float32)


def get_camera_and_clock_state(f):
    """
    Returns (cx, cy, scale, mode, clock_state) for frame f (0..1193).
    mode is one of:
      - 'clock_daynight': Sequence 1 (f = 0..231)
      - 'zoom_molten': Sequence 2 (f = 232..405)
      - 'clock_to_ocean': Transition 00:00 -> 04:00 (f = 406..444)
      - 'ocean_full': Sequence 3 full-screen ocean (f = 445..557)
      - 'clock_microbes': Sequence 4 fast-forward spin (f = 558..707)
      - 'dinos_full': Sequence 5 & 6 prehistoric dinos & asteroid (f = 708..994)
      - 'clock_human_end': Sequence 6 & 7 23.47 -> 23.59.54 -> 24.00 (f = 995..1193)
    """
    cx, cy, scale = 358.0, 617.0, 0.92
    clock_state = {
        "hour_deg": 0.0,
        "min_deg": 0.0,
        "sec_deg": None,
        "era_hours": 24.0,
        "min_blur_span": 0.0,
        "human_band_alpha": 0.0,
    }

    if f <= 234:
        # Intro zoom out from 1.38 -> 0.945 (f=0..48), then smooth push-in 0.945 -> 1.015 (f=48..234)
        if f < 48:
            t = ease_in_out(f / 48.0)
            scale = lerp(1.38, 0.945, t)
            cx = lerp(350.0, 355.0, t)
            cy = lerp(624.0, 619.0, t)
        elif f < 216:
            t = (f - 48.0) / 168.0
            scale = lerp(0.945, 1.008, t)
            cx = lerp(355.0, 358.0, t)
            cy = lerp(619.0, 626.0, t)
        else:
            t = (f - 216.0) / 18.0
            scale = lerp(1.008, 1.04, t)
            cx = 360.0
            cy = 626.0

        # Two full 24h spin cycles matching REF (0 -> 24.0 full 360 deg ring + 24:1 geared hands):
        if f <= 51:
            t1 = max(0.0, min(1.0, f / 51.0))
            h_val = 24.0 * (1.0 - (1.0 - t1) ** 1.2)
            clock_state["hour_deg"] = (h_val / 24.0) * 360.0
            clock_state["min_deg"] = 0.0 if f == 51 else (h_val % 1.0) * 360.0
            clock_state["min_blur_span"] = 22.0
            clock_state["era_hours"] = h_val
        elif f <= 212:
            t2 = max(0.0, min(1.0, (f - 51.5) / (212.0 - 51.5)))
            h_val = 24.0 * (1.0 - (1.0 - t2) ** 2.4)
            clock_state["hour_deg"] = (h_val / 24.0) * 360.0
            clock_state["min_deg"] = 0.0 if f == 212 else (h_val % 1.0) * 360.0
            clock_state["min_blur_span"] = 20.0 if f < 192 else max(0.0, 20.0 * (1.0 - (f - 192.0) / 14.0))
            if f <= 203:
                clock_state["era_hours"] = 24.0 if f >= 200 else min(24.0, h_val * 1.006 if f >= 196 else h_val)
            else:
                clock_state["era_hours"] = 24.0 * (1.0 - ease_in_out((f - 203.0) / 17.0))
        else:
            clock_state["hour_deg"] = 0.0
            clock_state["min_deg"] = 0.0
            clock_state["min_blur_span"] = 0.0
            clock_state["era_hours"] = 24.0 * (1.0 - ease_in_out((f - 203.0) / 17.0)) if f < 220 else 0.0
        return cx, cy, scale, "clock_daynight", clock_state

    elif f <= 398:
        clock_state["hour_deg"] = 0.0
        clock_state["min_deg"] = 0.0
        clock_state["era_hours"] = 0.0
        if f < 250:
            # Zoom dive into molten Earth (f = 234..250 -> matches f=238 scale ~1.18!)
            t = ease_in_out((f - 234.0) / 16.0)
            scale = lerp(1.04, 3.2, t)
            cx = 360.0
            cy = lerp(626.0, 562.0, t)
        elif f <= 382:
            scale = 3.2
            cx, cy = 360.0, 562.0
        else:
            # Zoom out f = 382..398 -> by f=396 clock is already at scale ~0.98!
            t = ease_in_out((f - 382.0) / 16.0)
            scale = lerp(3.2, 0.96, t)
            cx = 360.0
            cy = lerp(562.0, 622.0, t)
            clock_state["hour_deg"] = lerp(0.0, 60.0, t)
            clock_state["min_deg"] = lerp(0.0, 360.0, t)
            clock_state["era_hours"] = lerp(0.0, 4.2, t)
        return cx, cy, scale, "zoom_molten", clock_state

    elif f <= 442:
        clock_state["hour_deg"] = 60.0
        clock_state["min_deg"] = 0.0
        clock_state["era_hours"] = 4.2
        if f < 427:
            t = (f - 398.0) / 29.0
            scale = lerp(0.96, 1.03, t)
            cx, cy = 362.0, 620.0
        else:
            # Zoom dive into ocean (f = 427..442 -> f=434 matches scale ~1.65!)
            t = ease_in_out((f - 427.0) / 15.0)
            scale = lerp(1.03, 2.85, t)
            cx = lerp(362.0, 360.0, t)
            cy = lerp(620.0, 562.0, t)
        return cx, cy, scale, "clock_to_ocean", clock_state

    elif f <= 560:
        return 360.0, 562.0, 3.2, "ocean_full", clock_state

    elif f <= 712:
        if f < 572:
            # Rapid zoom out f = 560..572 (matching REF 04:07 continuity with zero jump)
            t = ease_in_out((f - 560.0) / 12.0)
            scale = lerp(3.2, 0.97, t)
            cx = lerp(360.0, 356.0, t)
            cy = lerp(562.0, 620.0, t)
            start_h = (4 * 60 + 7) / 60.0
            clock_state["hour_deg"] = (start_h / 24.0) * 360.0
            clock_state["min_deg"] = (7.0 / 60.0) * 360.0
            clock_state["era_hours"] = start_h
        elif f <= 696:
            t_push = (f - 572.0) / 124.0
            scale = lerp(0.97, 1.06, t_push)
            cx = lerp(356.0, 361.0, t_push)
            cy = 620.0
            _, h_val = format_microbe_counter(min(f, 690))
            clock_state["era_hours"] = h_val
            clock_state["hour_deg"] = (h_val / 24.0) * 360.0
            clock_state["min_deg"] = (h_val % 1.0) * 360.0
            clock_state["min_blur_span"] = 18.0 if 592 <= f <= 674 else 0.0
        else:
            # Zoom dive into dinos f = 696..712 -> f=698 matches scale ~1.10!
            t = ease_in_out((f - 696.0) / 16.0)
            scale = lerp(1.06, 3.2, t)
            cx = lerp(361.0, 360.0, t)
            cy = lerp(620.0, 562.0, t)
            clock_state["era_hours"] = 22.78
            clock_state["hour_deg"] = (22.78 / 24.0) * 360.0
            clock_state["min_deg"] = (47.0 / 60.0) * 360.0
        return cx, cy, scale, "clock_microbes", clock_state

    elif f <= 986:
        return 360.0, 562.0, 3.2, "dinos_full", clock_state

    else:
        clock_state["era_hours"] = 24.0
        if f < 1002:
            # Zoom out f = 986..1002 -> by f=1002 clock is already at scale ~0.99!
            t = ease_in_out((f - 986.0) / 16.0)
            scale = lerp(3.2, 0.99, t)
            cx = lerp(360.0, 355.0, t)
            cy = lerp(562.0, 608.0, t)
            clock_state["hour_deg"] = 356.0
            clock_state["min_deg"] = 290.0
            clock_state["sec_deg"] = 180.0
        elif f < 1044:
            t = (f - 1002.0) / 42.0
            scale = lerp(0.99, 1.08, t)
            cx = lerp(355.0, 360.0, t)
            cy = lerp(608.0, 650.0, t)
            clock_state["hour_deg"] = lerp(356.0, 359.5, t)
            clock_state["min_deg"] = lerp(290.0, 357.0, t)
            clock_state["sec_deg"] = (180.0 + t * 520.0) % 360.0
        elif f < 1072:
            # Zoom & pan into 6 DETIK rim f = 1044..1072
            t = ease_in_out((f - 1044.0) / 28.0)
            scale = lerp(1.08, 2.62, t)
            cx = lerp(360.0, 512.0, t)
            cy = lerp(650.0, 1165.0, t)
            clock_state["hour_deg"] = 359.2
            clock_state["min_deg"] = 358.8
            clock_state["sec_deg"] = lerp(145.0, 320.4, t)
            clock_state["human_band_alpha"] = 0.0
        elif f < 1149:
            # Continuous gliding close-up pan f = 1072..1149
            t = (f - 1072.0) / 77.0
            scale = lerp(2.62, 2.68, math.sin(min(1.0, t) * math.pi * 0.5))
            cx = lerp(512.0, 470.0, t)
            cy = lerp(1165.0, 1220.0, ease_in_out(t))
            clock_state["hour_deg"] = 358.8
            clock_state["min_deg"] = 358.8
            t_sec = min(1.0, (f - 1072.0) / 60.0)
            clock_state["sec_deg"] = lerp(320.4, 360.0, t_sec)
            clock_state["human_band_alpha"] = ease_in_out((f - 1073.0) / 8.0) if f >= 1073 else 0.0
        else:
            # Continuous final pull-out f = 1149..1170 -> settles smoothly at (360, 700, scale=1.035)
            t = ease_in_out((f - 1149.0) / 21.0)
            scale = lerp(2.68, 1.035, t)
            cx = lerp(470.0, 360.0, t)
            cy = lerp(1220.0, 700.0, t)
            clock_state["hour_deg"] = 0.0
            clock_state["min_deg"] = 0.0
            clock_state["sec_deg"] = 0.0
            clock_state["human_band_alpha"] = 1.0

        return cx, cy, scale, "clock_human_end", clock_state


def render_single_frame(f):
    """
    Renders frame f (0..1193) at 720x1280 as a BGR numpy array.
    """
    W, H = 720, 1280
    cx, cy, scale, mode, clock_state = get_camera_and_clock_state(f)

    if mode == "ocean_full":
        canvas = render_primordial_ocean_scene(W, H, f, VECTOR_SHAPES, as_viewport=False)
    elif mode == "dinos_full":
        canvas = render_prehistoric_dinos_scene(W, H, f, VECTOR_SHAPES, as_viewport=False)
    elif mode == "zoom_molten" and 250 <= f <= 382:
        canvas = render_molten_earth_scene(W, H, f, VECTOR_SHAPES, as_viewport=False)
    else:
        canvas = render_starry_indigo_canvas(W, H, f)
        # Determine inner viewport image for the clock dial
        if mode == "clock_daynight":
            vp_img = render_day_night_viewport(424, f)
            if f >= 212:
                mol_vp = render_molten_earth_scene(424, 424, f, VECTOR_SHAPES, as_viewport=True)
                vp_img = Image.blend(vp_img, mol_vp, 0.72 * ease_in_out((f - 212.0) / 22.0))
        elif mode == "zoom_molten":
            vp_img = render_molten_earth_scene(424, 424, f, VECTOR_SHAPES, as_viewport=True)
            # In f=386..414, teal ocean wipes down over the shrinking molten Earth inside the clock dial!
            if f >= 386:
                oc_vp = render_primordial_ocean_scene(424, 424, f, VECTOR_SHAPES, as_viewport=True)
                wipe_u = ease_in_out((f - 386.0) / 28.0)
                wipe_h = int(round(424 * wipe_u))
                if wipe_h > 0:
                    vp_img.paste(oc_vp.crop((0, 0, 424, wipe_h)), (0, 0))
        elif mode == "clock_to_ocean":
            oc_vp = render_primordial_ocean_scene(424, 424, f, VECTOR_SHAPES, as_viewport=True)
            if f <= 414:
                vp_img = render_molten_earth_scene(424, 424, f, VECTOR_SHAPES, as_viewport=True)
                wipe_u = ease_in_out((f - 386.0) / 28.0)
                wipe_h = int(round(424 * wipe_u))
                if wipe_h > 0:
                    vp_img.paste(oc_vp.crop((0, 0, 424, wipe_h)), (0, 0))
            else:
                vp_img = oc_vp
        elif mode == "clock_microbes":
            if f < 674:
                vp_img = render_primordial_ocean_scene(424, 424, f, VECTOR_SHAPES, as_viewport=True)
            else:
                vp_img = render_prehistoric_dinos_scene(424, 424, f, VECTOR_SHAPES, as_viewport=True)
        else:
            vp_img = render_post_impact_twilight_viewport(424, f, VECTOR_SHAPES)

        draw_clock_frame(canvas, f, cx, cy, scale, clock_state, inner_viewport_img=vp_img)

        # Crossfade into/out of fullscreen scene during deep zoom transitions
        if mode == "clock_to_ocean" and f >= 435:
            alpha_f = ease_in_out((f - 435.0) / 7.0)
            full_oc = render_primordial_ocean_scene(W, H, f, VECTOR_SHAPES, as_viewport=False)
            canvas = Image.blend(canvas, full_oc, alpha_f)
        elif mode == "clock_microbes" and f <= 568:
            alpha_f = 1.0 - ease_in_out((f - 560.0) / 8.0)
            if alpha_f > 0.01:
                full_oc = render_primordial_ocean_scene(W, H, f, VECTOR_SHAPES, as_viewport=False)
                canvas = Image.blend(canvas, full_oc, alpha_f)
        elif mode == "clock_microbes" and f >= 702:
            alpha_f = ease_in_out((f - 702.0) / 10.0)
            full_dn = render_prehistoric_dinos_scene(W, H, f, VECTOR_SHAPES, as_viewport=False)
            canvas = Image.blend(canvas, full_dn, alpha_f)

    # Warm golden radial flare when clock strikes 24.00 (f = 1128..1154)
    if 1128 <= f <= 1154:
        fl_t = ease_in_out((f - 1128.0) / 6.0) if f <= 1134 else (1.0 - ease_in_out((f - 1134.0) / 20.0))
        if fl_t > 0.01:
            yy_f, xx_f = np.mgrid[0:H, 0:W].astype(np.float32)
            # Radial golden bloom centered near clock 24 mark (360, 420)
            d_f = np.clip(np.sqrt((xx_f - 360.0) ** 2 + (yy_f - 430.0) ** 2) / 520.0, 0.0, 1.0)
            flare_arr = np.zeros((H, W, 4), dtype=np.uint8)
            flare_arr[:, :, 0] = 254
            flare_arr[:, :, 1] = 228
            flare_arr[:, :, 2] = 162
            flare_arr[:, :, 3] = (145.0 * fl_t * (1.0 - d_f ** 1.4)).astype(np.uint8)
            canvas = Image.alpha_composite(canvas, Image.fromarray(flare_arr, mode="RGBA"))

    # Top Header & Bottom Subtitle Card
    draw_top_header(canvas, f)
    draw_subtitle_card(canvas, f)

    # Convert to numpy RGB, apply subtle optical corner vignette & paper grain
    rgb = np.array(canvas.convert("RGB"), dtype=np.float32)
    rgb = np.clip(rgb * _VIGNETTE_MUL + _PAPER_GRAIN, 0.0, 255.0)

    # Opening fade-in from black (f = 0..8)
    if f < 8:
        fade = ease_in_out(f / 8.0)
        rgb *= fade

    bgr = rgb[:, :, ::-1].astype(np.uint8)
    return bgr


def render_full_video(out_mp4):
    total_frames = 1194
    fps = 30.0
    temp_video = out_mp4.replace(".mp4", "_vid.mp4")

    cmd = [
        "ffmpeg",
        "-y",
        "-loglevel",
        "error",
        "-f",
        "rawvideo",
        "-pix_fmt",
        "bgr24",
        "-s",
        "720x1280",
        "-r",
        "30",
        "-i",
        "-",
        "-c:v",
        "libx264",
        "-profile:v",
        "main",
        "-level",
        "3.1",
        "-pix_fmt",
        "yuv420p",
        "-crf",
        "16",
        temp_video,
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for f in range(total_frames):
        frame_bgr = render_single_frame(f)
        proc.stdin.write(frame_bgr.tobytes())
        if (f + 1) % 200 == 0 or f == total_frames - 1:
            print(f"Rendered {f + 1}/{total_frames} frames...")
    proc.stdin.close()
    proc.wait()

    # Mux original audio stream from ref.mp4
    mux_cmd = [
        "ffmpeg",
        "-y",
        "-loglevel",
        "error",
        "-i",
        temp_video,
        "-i",
        REF_VIDEO,
        "-map",
        "0:v:0",
        "-map",
        "1:a:0",
        "-c:v",
        "copy",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-shortest",
        out_mp4,
    ]
    subprocess.run(mux_cmd, check=True)
    if os.path.exists(temp_video):
        os.remove(temp_video)
    print(f"Saved reconstructed video to {out_mp4}")


if __name__ == "__main__":
    tag = sys.argv[1] if len(sys.argv) > 1 else "v2"
    out_file = os.path.join(OUT_DIR, f"reconstructed_{tag}.mp4")
    render_full_video(out_file)
