import os
import sys
import json
import math
import cv2
import numpy as np

ROOT_DIR = r"d:\PROJECTS\z-automation-studio\earth-24h"
REF_VIDEO = os.path.join(ROOT_DIR, "ref.mp4")
OUT_DIR = os.path.join(ROOT_DIR, "out")


def compute_ssim(img1, img2):
    """Computes fast windowed SSIM on luminance channel (0..1)."""
    g1 = cv2.cvtColor(img1, cv2.COLOR_BGR2GRAY).astype(np.float32)
    g2 = cv2.cvtColor(img2, cv2.COLOR_BGR2GRAY).astype(np.float32)
    C1 = (0.01 * 255) ** 2
    C2 = (0.03 * 255) ** 2
    mu1 = cv2.GaussianBlur(g1, (11, 11), 1.5)
    mu2 = cv2.GaussianBlur(g2, (11, 11), 1.5)
    mu1_sq = mu1 * mu1
    mu2_sq = mu2 * mu2
    mu1_mu2 = mu1 * mu2
    sigma1_sq = cv2.GaussianBlur(g1 * g1, (11, 11), 1.5) - mu1_sq
    sigma2_sq = cv2.GaussianBlur(g2 * g2, (11, 11), 1.5) - mu2_sq
    sigma12 = cv2.GaussianBlur(g1 * g2, (11, 11), 1.5) - mu1_mu2
    ssim_map = ((2 * mu1_mu2 + C1) * (2 * sigma12 + C2)) / ((mu1_sq + mu2_sq + C1) * (sigma1_sq + sigma2_sq + C2))
    return float(np.mean(ssim_map))


def evaluate_video(recon_path, tag="v1", make_quad_video=False):
    cap_ref = cv2.VideoCapture(REF_VIDEO)
    cap_rec = cv2.VideoCapture(recon_path)

    scenes = [
        ("Scene 1 (00:00-07:97 Hook & 24h Spin)", 0, 238),
        ("Scene 2 (07:97-14:37 00.00 Molten Earth)", 239, 430),
        ("Scene 3 (14:37-18:97 04.00 Primordial Ocean)", 431, 568),
        ("Scene 4 (18:97-28:17 Microbe Spin & Dinos)", 569, 844),
        ("Scene 5 (28:17-30:83 23.39 Asteroid Streak)", 845, 924),
        ("Scene 6 (30:83-37:67 Extinction & 6 Detik)", 925, 1129),
        ("Scene 7 (37:67-39:80 24.00 Midnight Pull-Out)", 1130, 1193),
    ]

    frame_metrics = []
    sample_frames_for_sheet = [60, 270, 480, 630, 780, 920, 965, 1095, 1185]
    sheet_rows = []

    f_idx = 0
    quad_proc = None
    if make_quad_video:
        import subprocess
        quad_path = os.path.join(OUT_DIR, "comparison_quad.mp4")
        q_cmd = [
            "ffmpeg", "-y", "-loglevel", "error",
            "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", "880x392", "-r", "30", "-i", "-",
            "-i", REF_VIDEO, "-map", "0:v:0", "-map", "1:a:0",
            "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-c:a", "aac", "-shortest",
            quad_path
        ]
        quad_proc = subprocess.Popen(q_cmd, stdin=subprocess.PIPE)

    while True:
        ret1, f_ref = cap_ref.read()
        ret2, f_rec = cap_rec.read()
        if not ret1 or not ret2:
            break

        diff = np.abs(f_ref.astype(np.float32) - f_rec.astype(np.float32))
        mae = float(np.mean(diff))
        mse = float(np.mean(diff ** 2))
        rmse = math.sqrt(mse)
        psnr = 20.0 * math.log10(255.0 / rmse) if rmse > 1e-5 else 99.0
        ssim = compute_ssim(f_ref, f_rec)

        frame_metrics.append({
            "f": f_idx,
            "t": round(f_idx / 30.0, 3),
            "ssim": round(ssim, 4),
            "psnr": round(psnr, 2),
            "mae": round(mae, 2),
            "rmse": round(rmse, 2),
        })

        if f_idx in sample_frames_for_sheet or quad_proc is not None:
            tw, th = 220, 392
            r_sm = cv2.resize(f_ref, (tw, th))
            c_sm = cv2.resize(f_rec, (tw, th))
            ov_sm = cv2.addWeighted(r_sm, 0.5, c_sm, 0.5, 0)
            err_gray = np.mean(np.abs(r_sm.astype(np.float32) - c_sm.astype(np.float32)), axis=2).astype(np.uint8)
            heat_sm = cv2.applyColorMap(np.clip(err_gray * 2, 0, 255).astype(np.uint8), cv2.COLORMAP_JET)

            row_img = np.hstack([r_sm, c_sm, ov_sm, heat_sm])
            label = f"f={f_idx:04d} ({f_idx/30:.2f}s) | SSIM={ssim:.3f} | PSNR={psnr:.1f}dB | MAE={mae:.1f}"
            cv2.rectangle(row_img, (0, 0), (880, 28), (15, 15, 20), -1)
            cv2.putText(row_img, label, (10, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 255, 255), 1, cv2.LINE_AA)
            if f_idx in sample_frames_for_sheet:
                sheet_rows.append(row_img)
            if quad_proc is not None:
                quad_proc.stdin.write(row_img.tobytes())

        f_idx += 1

    if quad_proc is not None:
        quad_proc.stdin.close()
        quad_proc.wait()

    cap_ref.release()
    cap_rec.release()

    if sheet_rows:
        sheet = np.vstack(sheet_rows)
        sheet_path = os.path.join(OUT_DIR, f"qa_contact_sheet_{tag}.jpg")
        cv2.imwrite(sheet_path, sheet)

    # Aggregate global & per-scene metrics
    ssims = [m["ssim"] for m in frame_metrics]
    psnrs = [m["psnr"] for m in frame_metrics]
    maes = [m["mae"] for m in frame_metrics]
    rmses = [m["rmse"] for m in frame_metrics]

    scene_reports = []
    for s_name, s0, s1 in scenes:
        sub = [m for m in frame_metrics if s0 <= m["f"] <= s1]
        scene_reports.append({
            "scene": s_name,
            "frames": f"{s0}..{s1}",
            "mean_ssim": round(float(np.mean([m["ssim"] for m in sub])), 4),
            "mean_psnr": round(float(np.mean([m["psnr"] for m in sub])), 2),
            "mean_mae": round(float(np.mean([m["mae"] for m in sub])), 2),
            "mean_rmse": round(float(np.mean([m["rmse"] for m in sub])), 2),
        })

    summary = {
        "tag": tag,
        "total_frames": len(frame_metrics),
        "global_mean_ssim": round(float(np.mean(ssims)), 4),
        "global_mean_psnr": round(float(np.mean(psnrs)), 2),
        "global_mean_mae": round(float(np.mean(maes)), 2),
        "global_mean_rmse": round(float(np.mean(rmses)), 2),
        "scenes": scene_reports,
    }

    report_path = os.path.join(OUT_DIR, f"qa_metrics_{tag}.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    print(f"=== QA REPORT ({tag}) ===")
    print(f"Global SSIM: {summary['global_mean_ssim']:.4f} | PSNR: {summary['global_mean_psnr']:.2f} dB | MAE: {summary['global_mean_mae']:.2f} | RMSE: {summary['global_mean_rmse']:.2f}")
    for sr in scene_reports:
        print(f"  {sr['scene']:45s}: SSIM={sr['mean_ssim']:.4f} | PSNR={sr['mean_psnr']:5.2f}dB | MAE={sr['mean_mae']:5.2f}")

    return summary


if __name__ == "__main__":
    tag = sys.argv[1] if len(sys.argv) > 1 else "v3"
    vid = sys.argv[2] if len(sys.argv) > 2 and not sys.argv[2].startswith("--") else os.path.join(OUT_DIR, f"reconstructed_{tag}.mp4")
    make_q = "--quad" in sys.argv
    evaluate_video(vid, tag=tag, make_quad_video=make_q)
