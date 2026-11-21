from pathlib import Path
import cv2
import numpy as np

PROJECT = Path(__file__).resolve().parents[1]
QA_DIR = PROJECT / "out/qa_stills"
OUT_GRID = PROJECT / "out/qa_contact_sheet_4x4.jpg"
OUT_LOOP = PROJECT / "out/qa_loop_compare.jpg"
OUT_IK = PROJECT / "out/qa_ik_closeups_2x2.jpg"

def load_labeled(path: Path, target_w: int, target_h: int) -> np.ndarray:
    img = cv2.imread(str(path))
    if img is None:
        img = np.zeros((target_h, target_w, 3), dtype=np.uint8)
    else:
        img = cv2.resize(img, (target_w, target_h), interpolation=cv2.INTER_AREA)
    cv2.rectangle(img, (0, 0), (target_w, 38), (15, 20, 24), -1)
    cv2.putText(img, path.stem, (10, 27), cv2.FONT_HERSHEY_SIMPLEX, 0.72, (255, 240, 170), 2, cv2.LINE_AA)
    return img

def main() -> None:
    files = sorted(QA_DIR.glob("*.png"))
    if len(files) < 16:
        raise RuntimeError(f"Expected 16 QA stills, found {len(files)}")

    # 1. 4x4 Overview Grid (each cell 360x640 -> total 1440x2560)
    cw, ch = 360, 640
    rows = []
    for r in range(4):
        row_imgs = [load_labeled(files[r * 4 + c], cw, ch) for c in range(4)]
        rows.append(np.hstack(row_imgs))
    grid = np.vstack(rows)
    cv2.imwrite(str(OUT_GRID), grid, [int(cv2.IMWRITE_JPEG_QUALITY), 92])

    # 2. High-Res Side-by-Side Loop Audit: Frame 0 vs Final Frame (each 540x960 -> 1080x960)
    f0 = load_labeled(files[0], 540, 960)
    f_last = load_labeled(files[-1], 540, 960)
    diff_score = float(np.mean(np.abs(cv2.imread(str(files[0])).astype(np.float32) - cv2.imread(str(files[-1])).astype(np.float32))))
    loop_cmp = np.hstack([f0, f_last])
    cv2.putText(loop_cmp, f"Mean Pixel Diff (F0 vs F_last): {diff_score:.2f}/255", (20, 935), cv2.FONT_HERSHEY_SIMPLEX, 0.85, (110, 255, 160), 2, cv2.LINE_AA)
    cv2.imwrite(str(OUT_LOOP), loop_cmp, [int(cv2.IMWRITE_JPEG_QUALITY), 94])

    # 3. High-Res 2x2 IK Grip & Foot-Lock Inspection Sheet (01 slope plant, 05 hoe chop, 08 pitcher pour, 13 bamboo pipe)
    ik_indices = [0, 4, 7, 12]
    iw, ih = 540, 960
    ik_top = np.hstack([load_labeled(files[ik_indices[0]], iw, ih), load_labeled(files[ik_indices[1]], iw, ih)])
    ik_bot = np.hstack([load_labeled(files[ik_indices[2]], iw, ih), load_labeled(files[ik_indices[3]], iw, ih)])
    ik_grid = np.vstack([ik_top, ik_bot])
    cv2.imwrite(str(OUT_IK), ik_grid, [int(cv2.IMWRITE_JPEG_QUALITY), 94])

    print(f"Saved {OUT_GRID}, {OUT_LOOP} (diff={diff_score:.2f}), {OUT_IK}")

if __name__ == "__main__":
    main()
