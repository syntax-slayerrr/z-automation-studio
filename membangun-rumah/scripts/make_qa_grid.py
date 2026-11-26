from pathlib import Path
import cv2
import numpy as np

PROJECT = Path(__file__).resolve().parents[1]
QA_DIR = PROJECT / "out/qa_stills"
OUT_GRID = PROJECT / "out/qa_contact_sheet_4x4.jpg"
OUT_HERO = PROJECT / "out/qa_hero_2x2.jpg"


def load_labeled(path: Path, target_w: int, target_h: int) -> np.ndarray:
    img = cv2.imread(str(path))
    if img is None:
        img = np.zeros((target_h, target_w, 3), dtype=np.uint8)
    else:
        img = cv2.resize(img, (target_w, target_h), interpolation=cv2.INTER_AREA)
    cv2.rectangle(img, (0, 0), (target_w, 38), (15, 20, 24), -1)
    cv2.putText(img, path.stem, (10, 27), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (255, 240, 170), 2, cv2.LINE_AA)
    return img


def main() -> None:
    files = sorted(QA_DIR.glob("*.png"))
    if len(files) < 16:
        raise RuntimeError(f"Expected 16 QA stills, found {len(files)}")

    # 1. 4x4 Overview Contact Sheet (1440x2560)
    cw, ch = 360, 640
    rows = []
    for r in range(4):
        row_imgs = [load_labeled(files[r * 4 + c], cw, ch) for c in range(4)]
        rows.append(np.hstack(row_imgs))
    grid = np.vstack(rows)
    cv2.imwrite(str(OUT_GRID), grid, [int(cv2.IMWRITE_JPEG_QUALITY), 92])

    # 2. High-Res 2x2 Key Audit Sheet (01 rain IK cardboard, 08 foundation cutaway, 13 utilities cutaway, 15 family safe inside)
    hero_indices = [0, 7, 12, 14]
    iw, ih = 540, 960
    top = np.hstack([load_labeled(files[hero_indices[0]], iw, ih), load_labeled(files[hero_indices[1]], iw, ih)])
    bot = np.hstack([load_labeled(files[hero_indices[2]], iw, ih), load_labeled(files[hero_indices[3]], iw, ih)])
    hero = np.vstack([top, bot])
    cv2.imwrite(str(OUT_HERO), hero, [int(cv2.IMWRITE_JPEG_QUALITY), 94])

    print(f"Saved {OUT_GRID} and {OUT_HERO}")


if __name__ == "__main__":
    main()
