import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from clock_rig import (
    FONT_SERIF_BOLD,
    FONT_SERIF_REG,
    FONT_SANS_BOLD,
    FONT_SANS_REG,
    get_font,
    ease_in_out,
)

# Exact frame-accurate subtitle cards & word-level red highlight schedule
# Each entry: (start_f, end_f, lines, word_highlights)
# where lines is a list of strings (1 or 2 lines), and word_highlights is a list of (w_start_f, w_end_f, active_word_index)
SUBTITLE_CARDS = [
    (
        20,
        90,
        ["Bayangkan seluruh umur", "Bumi"],
        [(20, 32, 0), (33, 54, 1), (55, 66, 2), (67, 90, 3)],
    ),
    (
        92,
        158,
        ["4,5 miliar tahun"],
        [(92, 114, 0), (115, 136, 1), (137, 158, 2)],
    ),
    (
        160,
        219,
        ["dipadatkan jadi satu hari"],
        [(160, 183, 0), (184, 195, 1), (196, 206, 2), (207, 219, 3)],
    ),
    (
        238,
        311,
        ["Tengah malam, Bumi", "terbentuk"],
        [(238, 244, 0), (245, 253, 1), (254, 274, 2), (275, 311, 3)],
    ),
    (
        314,
        378,
        ["panas dan penuh batu pijar"],
        [(314, 324, 0), (325, 336, 1), (337, 352, 2), (353, 364, 3), (365, 378, 4)],
    ),
    (
        381,
        417,
        ["Sekitar jam 4 pagi"],
        [(381, 393, 0), (394, 401, 1), (402, 408, 2), (409, 417, 3)],
    ),
    (
        420,
        488,
        ["kehidupan pertama muncul", "di laut"],
        [(420, 443, 0), (444, 461, 1), (462, 474, 2), (475, 481, 3), (482, 488, 4)],
    ),
    (
        490,
        553,
        ["berupa sel yang sangat", "kecil"],
        [(490, 515, 0), (516, 522, 1), (523, 532, 2), (533, 543, 3), (544, 553, 4)],
    ),
    (
        556,
        604,
        ["Lalu berjam-jam lamanya"],
        [(556, 569, 0), (570, 588, 1), (589, 604, 2)],
    ),
    (
        607,
        646,
        ["kehidupan hanya berupa"],
        [(607, 628, 0), (629, 638, 1), (639, 646, 2)],
    ),
    (
        649,
        695,
        ["makhluk mikroskopis"],
        [(649, 665, 0), (666, 695, 1)],
    ),
    (
        698,
        745,
        ["Dinosaurus baru datang"],
        [(698, 722, 0), (723, 734, 1), (735, 745, 2)],
    ),
    (
        748,
        829,
        ["jam 10 malam lewat 47", "menit"],
        [(748, 758, 0), (759, 774, 1), (775, 789, 2), (790, 804, 3), (805, 816, 4), (817, 829, 5)],
    ),
    (
        832,
        894,
        ["dan jam 11 lewat 39"],
        [(832, 842, 0), (843, 853, 1), (854, 866, 2), (867, 876, 3), (877, 894, 4)],
    ),
    (
        905,
        941,
        ["asteroid menghantam"],
        [(905, 916, 0), (917, 941, 1)],
    ),
    (
        944,
        982,
        ["mereka punah"],
        [(944, 966, 0), (967, 982, 1)],
    ),
    (
        985,
        1015,
        ["Lalu manusia?"],
        [(985, 996, 0), (997, 1015, 1)],
    ),
    (
        1018,
        1044,
        ["Kita baru muncul"],
        [(1018, 1027, 0), (1028, 1036, 1), (1037, 1044, 2)],
    ),
    (
        1047,
        1087,
        ["kurang dari 6 detik"],
        [(1047, 1068, 0), (1069, 1076, 1), (1077, 1081, 2), (1082, 1087, 3)],
    ),
    (
        1089,
        1155,
        ["sebelum tengah malam"],
        [(1089, 1106, 0), (1107, 1122, 1), (1123, 1155, 2)],
    ),
]


def format_microbe_counter(f):
    """Returns exact timestamp string for Sequence 4 (f = 580..689), safely clamped before f=580."""
    pts = [
        (580, 4 * 60 + 7),
        (584, 4 * 60 + 8),
        (588, 4 * 60 + 12),
        (590, 4 * 60 + 16),
        (594, 4 * 60 + 26),
        (598, 4 * 60 + 42),
        (600, 4 * 60 + 52),
        (606, 5 * 60 + 35),
        (612, 6 * 60 + 40),
        (618, 8 * 60 + 9),
        (624, 10 * 60 + 9),
        (630, 12 * 60 + 42),
        (636, 15 * 60 + 32),
        (642, 17 * 60 + 48),
        (648, 19 * 60 + 32),
        (654, 20 * 60 + 49),
        (660, 21 * 60 + 42),
        (666, 22 * 60 + 16),
        (672, 22 * 60 + 35),
        (678, 22 * 60 + 44),
        (684, 22 * 60 + 46),
        (690, 22 * 60 + 47),
    ]
    mins = pts[-1][1]
    if f < pts[0][0]:
        mins = pts[0][1]
    else:
        for i in range(len(pts) - 1):
            f0, m0 = pts[i]
            f1, m1 = pts[i + 1]
            if f0 <= f <= f1:
                t = (f - f0) / max(1.0, float(f1 - f0))
                mins = int(round(m0 + (m1 - m0) * t))
                break
    hh = mins // 60
    mm = mins % 60
    return f"{hh:02d}.{mm:02d}", mins / 60.0


def format_human_counter(f):
    """Returns exact HH.MM.SS string for Sequence 6 (f = 1005..1130)."""
    pts = [
        (1005, 47 * 60 + 21),
        (1016, 51 * 60 + 14),
        (1024, 54 * 60 + 13),
        (1032, 56 * 60 + 25),
        (1040, 57 * 60 + 58),
        (1048, 58 * 60 + 58),
        (1056, 59 * 60 + 33),
        (1064, 59 * 60 + 49),
        (1070, 59 * 60 + 54),
        (1130, 59 * 60 + 54),
    ]
    secs = pts[-1][1]
    if f < pts[0][0]:
        secs = pts[0][1]
    else:
        for i in range(len(pts) - 1):
            f0, s0 = pts[i]
            f1, s1 = pts[i + 1]
            if f0 <= f <= f1:
                t = (f - f0) / max(1.0, float(f1 - f0))
                secs = int(round(s0 + (s1 - s0) * t))
                break
    mm = secs // 60
    ss = secs % 60
    return f"23.{mm:02d}.{ss:02d}"


def draw_tracked_text(draw, cx, y, text, font, fill_col, tracking=5.5, shadow=True):
    chars = list(text)
    widths = [draw.textbbox((0, 0), ch, font=font)[2] - draw.textbbox((0, 0), ch, font=font)[0] for ch in chars]
    total_w = sum(widths) + tracking * max(0, len(chars) - 1)
    x = cx - total_w / 2.0
    for ch, w in zip(chars, widths):
        if shadow:
            draw.text((x + 1, y + 2), ch, font=font, fill=(14, 10, 18, int(fill_col[3] * 0.65)))
        draw.text((x, y), ch, font=font, fill=fill_col)
        x += w + tracking


def draw_top_header(canvas_pil, f):
    """
    Draws the top serif timestamp / title header and tracked uppercase subheader,
    all centered precisely at measured cx = 333.0.
    """
    W, H = canvas_pil.size
    header_layer = Image.new("RGBA", (W, 340), (0, 0, 0, 0))
    hdraw = ImageDraw.Draw(header_layer, "RGBA")
    cx_hdr = 333.0

    # Sequence 1: "4,5 miliar tahun" + "= 24 jam" (f = 8..226)
    if 8 <= f <= 226:
        a1 = ease_in_out((f - 8.0) / 8.0) * (1.0 - ease_in_out((f - 216.0) / 10.0) if f >= 216 else 1.0)
        fnt_top = get_font(FONT_SERIF_BOLD, 48)
        txt1 = "4,5 miliar tahun"
        bb1 = hdraw.textbbox((0, 0), txt1, font=fnt_top)
        w1 = bb1[2] - bb1[0]
        tx1 = cx_hdr - w1 / 2.0 - bb1[0]
        ty1 = 126.0 - bb1[1]
        hdraw.text((tx1, ty1 + 2), txt1, font=fnt_top, fill=(16, 10, 22, int(200 * a1)))
        hdraw.text((tx1, ty1), txt1, font=fnt_top, fill=(252, 248, 244, int(255 * a1)))

        if f >= 25:
            a2 = ease_in_out((f - 25.0) / 8.0) * (1.0 - ease_in_out((f - 216.0) / 10.0) if f >= 216 else 1.0)
            fnt_big = get_font(FONT_SERIF_BOLD, 92)
            txt2 = "24 jam"
            bb2 = hdraw.textbbox((0, 0), txt2, font=fnt_big)
            w2 = bb2[2] - bb2[0]
            tx2 = cx_hdr - w2 / 2.0 + 26.0 - bb2[0]
            ty2 = 178.0 - bb2[1]
            fnt_eq = get_font(FONT_SERIF_REG, 58)
            hdraw.text((tx2 - 68, 186), "=", font=fnt_eq, fill=(224, 206, 174, int(230 * a2)))
            glow_img = Image.new("RGBA", (W, 340), (0, 0, 0, 0))
            gdraw = ImageDraw.Draw(glow_img, "RGBA")
            gdraw.text((tx2, ty2), txt2, font=fnt_big, fill=(246, 182, 84, int(175 * a2)))
            glow_img = glow_img.filter(ImageFilter.GaussianBlur(radius=9))
            header_layer = Image.alpha_composite(header_layer, glow_img)
            hdraw = ImageDraw.Draw(header_layer, "RGBA")
            hdraw.text((tx2, ty2), txt2, font=fnt_big, fill=(253, 224, 141, int(255 * a2)))

    # Sequence 2..7 Numeric Serif Timestamps
    ts_text = None
    sub_text = None
    ts_alpha = 1.0
    sub_alpha = 0.0
    prefix_plusminus = False

    if 232 <= f <= 395:
        ts_text = "00.00"
        ts_alpha = ease_in_out((f - 232.0) / 8.0) * (1.0 - ease_in_out((f - 388.0) / 7.0) if f >= 388 else 1.0)
        if f >= 264:
            sub_text = "BUMI TERBENTUK"
            sub_alpha = ease_in_out((f - 264.0) / 8.0) * ts_alpha
    elif 402 <= f <= 565:
        ts_text = "04.00"
        prefix_plusminus = True
        ts_alpha = ease_in_out((f - 402.0) / 8.0) * (1.0 - ease_in_out((f - 558.0) / 7.0) if f >= 558 else 1.0)
        if f >= 426:
            sub_text = "KEHIDUPAN PERTAMA"
            sub_alpha = ease_in_out((f - 426.0) / 8.0) * ts_alpha
    elif 580 <= f <= 695:
        ts_text, _ = format_microbe_counter(min(f, 690))
        ts_alpha = ease_in_out((f - 580.0) / 8.0) * (1.0 - ease_in_out((f - 689.0) / 6.0) if f >= 689 else 1.0)
        if f >= 658:
            sub_text = "MAKHLUK MIKROSKOPIS"
            sub_alpha = ease_in_out((f - 658.0) / 6.0) * ts_alpha
    elif 700 <= f <= 844:
        ts_text = "22.47"
        ts_alpha = ease_in_out((f - 700.0) / 7.0) * (1.0 - ease_in_out((f - 838.0) / 7.0) if f >= 838 else 1.0)
        if f >= 710:
            sub_text = "DINOSAURUS DATANG"
            sub_alpha = ease_in_out((f - 710.0) / 8.0) * ts_alpha
    elif 845 <= f <= 988:
        ts_text = "23.39"
        ts_alpha = ease_in_out((f - 845.0) / 8.0) * (1.0 - ease_in_out((f - 980.0) / 8.0) if f >= 980 else 1.0)
        if f >= 910:
            sub_text = "ASTEROID • PUNAH"
            sub_alpha = ease_in_out((f - 910.0) / 8.0) * ts_alpha
    elif 1005 <= f <= 1131:
        ts_text = format_human_counter(f)
        ts_alpha = ease_in_out((f - 1005.0) / 8.0)
        if f >= 1084:
            sub_text = "MANUSIA MUNCUL"
            sub_alpha = ease_in_out((f - 1084.0) / 8.0)
    elif f >= 1132:
        ts_text = "24.00"
        ts_alpha = ease_in_out((f - 1132.0) / 6.0)
        if f >= 1138:
            sub_text = "TENGAH MALAM"
            sub_alpha = ease_in_out((f - 1138.0) / 8.0)

    if ts_text and ts_alpha > 0.01:
        is_short = (len(ts_text) <= 5)
        fnt_ts = get_font(FONT_SERIF_BOLD, 114 if is_short else 110)
        trk_ts = 5.0 if is_short else 8.5
        chars = list(ts_text)
        cws = [hdraw.textbbox((0, 0), c, font=fnt_ts)[2] - hdraw.textbbox((0, 0), c, font=fnt_ts)[0] for c in chars]
        tw = sum(cws) + trk_ts * max(0, len(chars) - 1)
        bb0 = hdraw.textbbox((0, 0), ts_text, font=fnt_ts)
        tx = cx_hdr - tw / 2.0 + (20.0 if prefix_plusminus else 0.0)
        ty = 148.0 - bb0[1]

        # Glow behind timestamp
        glow_img = Image.new("RGBA", (W, 340), (0, 0, 0, 0))
        gdraw = ImageDraw.Draw(glow_img, "RGBA")
        gx = tx
        for ch, cw in zip(chars, cws):
            gdraw.text((gx, ty), ch, font=fnt_ts, fill=(245, 208, 145, int(160 * ts_alpha)))
            gx += cw + trk_ts
        glow_img = glow_img.filter(ImageFilter.GaussianBlur(radius=8))
        header_layer = Image.alpha_composite(header_layer, glow_img)
        hdraw = ImageDraw.Draw(header_layer, "RGBA")

        if prefix_plusminus:
            fnt_pm = get_font(FONT_SERIF_REG, 54)
            hdraw.text((tx - 46, 166.0), "±", font=fnt_pm, fill=(188, 234, 234, int(235 * ts_alpha)))

        gx = tx
        for ch, cw in zip(chars, cws):
            hdraw.text((gx, ty), ch, font=fnt_ts, fill=(253, 248, 236, int(255 * ts_alpha)))
            gx += cw + trk_ts

    if sub_text and sub_alpha > 0.01:
        fnt_sub = get_font(FONT_SANS_BOLD, 17)
        draw_tracked_text(hdraw, cx_hdr, 246.0, sub_text, fnt_sub, (244, 238, 228, int(248 * sub_alpha)), tracking=7.2, shadow=True)

    canvas_pil.alpha_composite(header_layer, (0, 0))


def draw_subtitle_card(canvas_pil, f):
    """
    Draws the bottom deckle-edged textured paper subtitle strip centered at measured cx = 333.0,
    with faint organic paper creases and word-by-word terracotta red highlighting.
    """
    active_card = None
    for card in SUBTITLE_CARDS:
        if card[0] <= f <= card[1]:
            active_card = card
            break
    if active_card is None:
        return

    start_f, end_f, lines, highlights = active_card
    active_word_idx = 0
    for ws, we, widx in highlights:
        if ws <= f <= we:
            active_word_idx = widx
            break
        elif f > we:
            active_word_idx = widx

    draw = ImageDraw.Draw(canvas_pil, "RGBA")
    fnt = get_font(FONT_SANS_BOLD, 40)

    line_words = [ln.split(" ") for ln in lines]
    space_w = draw.textbbox((0, 0), " ", font=fnt)[2] - draw.textbbox((0, 0), " ", font=fnt)[0]
    line_widths = []
    for words in line_words:
        w_sum = sum(draw.textbbox((0, 0), w, font=fnt)[2] - draw.textbbox((0, 0), w, font=fnt)[0] for w in words)
        w_sum += space_w * max(0, len(words) - 1)
        line_widths.append(w_sum)

    max_lw = max(line_widths)
    pad_x = 46
    pad_y = 13
    line_h = 48
    card_w = max(320, max_lw + pad_x * 2)
    card_h = 72 if len(lines) == 1 else 117

    cx = 333.0
    cy = 1002.5 if len(lines) == 1 else 1024.5
    x0 = cx - card_w / 2.0
    y0 = cy - card_h / 2.0
    x1 = cx + card_w / 2.0
    y1 = cy + card_h / 2.0

    # Build deterministic deckle-edged torn paper polygon (jagged top/bottom & slight irregular sides)
    pts = []
    steps_x = 24
    for i in range(steps_x + 1):
        u = i / float(steps_x)
        px = x0 + (x1 - x0) * u
        py = y0 + 1.6 * math.sin(u * math.pi * 6.0 + start_f * 0.13) + 0.8 * math.cos(u * 19.0)
        pts.append((px, py))
    pts.append((x1 + 2.5, y0 + card_h * 0.35))
    pts.append((x1 + 0.8, y0 + card_h * 0.72))
    for i in range(steps_x, -1, -1):
        u = i / float(steps_x)
        px = x0 + (x1 - x0) * u
        py = y1 + 1.6 * math.cos(u * math.pi * 6.0 + start_f * 0.17) + 0.8 * math.sin(u * 17.0)
        pts.append((px, py))
    pts.append((x0 - 2.2, y0 + card_h * 0.65))
    pts.append((x0 - 0.6, y0 + card_h * 0.30))

    # Blurred drop shadow under paper card
    sh_layer = Image.new("RGBA", canvas_pil.size, (0, 0, 0, 0))
    sh_draw = ImageDraw.Draw(sh_layer, "RGBA")
    sh_pts = [(p[0] + 2, p[1] + 5) for p in pts]
    sh_draw.polygon(sh_pts, fill=(10, 6, 14, 155))
    sh_layer = sh_layer.filter(ImageFilter.GaussianBlur(radius=3.5))
    canvas_pil.alpha_composite(sh_layer, (0, 0))

    draw = ImageDraw.Draw(canvas_pil, "RGBA")
    # Cream textured cardstock fill
    draw.polygon(pts, fill=(244, 236, 220, 255), outline=(214, 202, 180, 255))

    # Subtle paper fiber veins inside the card (for authentic tactile cardstock look)
    rng_p = np.random.default_rng(start_f + 101)
    for _ in range(14):
        fx0 = float(rng_p.uniform(x0 + 12, x1 - 12))
        fy0 = float(rng_p.uniform(y0 + 6, y1 - 6))
        fx1 = fx0 + float(rng_p.uniform(-32, 32))
        fy1 = fy0 + float(rng_p.uniform(-10, 10))
        draw.line([fx0, fy0, fx1, fy1], fill=(224, 214, 194, 145), width=1)

    # Render words with terracotta red highlight on active_word_idx (card enters 1-2 frames before ink)
    txt_alpha = min(1.0, max(0.0, (f - start_f) / 2.0))
    if txt_alpha > 0.02:
        t_a = int(round(255 * txt_alpha))
        global_w_idx = 0
        for l_idx, words in enumerate(line_words):
            lw = line_widths[l_idx]
            wx = cx - lw / 2.0
            wy = y0 + pad_y - 4 + l_idx * line_h
            for w in words:
                if global_w_idx < active_word_idx:
                    col = (34, 30, 28, t_a)
                elif global_w_idx == active_word_idx:
                    col = (186, 56, 42, t_a)
                else:
                    col = (126, 118, 108, t_a)
                draw.text((wx, wy), w, font=fnt, fill=col)
                ww = draw.textbbox((0, 0), w, font=fnt)[2] - draw.textbbox((0, 0), w, font=fnt)[0]
                wx += ww + space_w
                global_w_idx += 1
