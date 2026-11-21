import json
import re

segments = [
    (0.0, 2.0, "Enam puluh tahun lalu seorang"),
    (2.0, 5.0, "pemuda bernama Herman Helmi Farid Ma'ruf berdiri"),
    (5.0, 7.0, "di sebuah podium di Solo."),
    (7.0, 11.0, "Dan mengucapkan satu keputusan yang mengubah segalanya."),
    (11.0, 14.0, "Tapi ceritanya dimulai jauh sebelum Herman."),
    (14.0, 17.0, "Tahun 1919 di Jogjakarta"),
    (17.0, 20.0, "pelajar Muhammadiyah sudah membentuk Siswoprojo"),
    (20.0, 22.0, "wadah pertama mereka."),
    (22.0, 26.0, "Tahun 1926 muncul GKPM"),
    (26.0, 30.0, "Gabungan Keluarga Pelajar Muhammadiyah di Malang dan Surakarta."),
    (30.0, 34.0, "Tapi semuanya tenggelam dibubarkan"),
    (34.0, 36.0, "dilupakan."),
    (36.0, 39.0, "Sampai tahun 1958"),
    (39.0, 43.0, "di sebuah Konferensi Pemuda Muhammadiyah di Garut"),
    (43.0, 44.5, "ide itu hidup lagi."),
    (44.5, 46.5, "Garut membuka jalan."),
    (46.5, 50.0, "Jogjakarta memperkuatnya di Muktamar Pemuda 1960."),
    (50.0, 55.0, "Dan pada 18 Juli 1961 di Surakarta"),
    (55.0, 59.0, "Herman Helmi Farid Ma'ruf ditetapkan sebagai Ketua Umum pertama"),
    (59.0, 62.0, "Muhammad Wirsyam Hasan sebagai Sekretaris Umum"),
    (62.0, 65.0, "Ikatan Pelajar Muhammadiyah resmi berdiri."),
    (65.0, 68.0, "Bukan organisasi biasa ini pernyataan"),
    (68.0, 72.0, "pelajar bukan penonton pelajar adalah penggerak."),
    (72.0, 77.0, "31 tahun kemudian 18 November 1992"),
    (77.0, 81.0, "Pemerintah mengubah namanya IPM menjadi IRM"),
    (81.0, 86.0, "Ikatan Remaja Muhammadiyah kata 'pelajar' dihapus."),
    (86.0, 88.0, "Namanya boleh berganti"),
    (88.0, 92.0, "tapi semangat yang ditanam Herman Helmi dan Wirsyam Hasan tidak ikut berganti."),
    (92.0, 95.0, "16 tahun mereka menunggu"),
    (95.0, 99.0, "dan di kota yang sama tempat IPM dilahirkan Surakarta"),
    (99.0, 102.0, "Muktamar ke-16 tahun 2008"),
    (102.0, 105.0, "nama itu kembali Ikatan Pelajar Muhammadiyah."),
    (105.0, 110.0, "Seolah sejarah berkata yang benar akan selalu menemukan jalannya pulang."),
    (110.0, 113.0, "Dari Siswoprojo 1919"),
    (113.0, 116.0, "dari GKPM 1926"),
    (116.0, 120.0, "dari Garut 1958"),
    (120.0, 123.0, "dari Solo 1961"),
    (123.0, 127.0, "IPM bukan lagi cerita satu nama atau satu kota"),
    (127.0, 130.0, "sejarahnya bukan hanya milik Herman Helmi"),
    (130.0, 133.3, "tapi milik kamu yang sekarang harus melanjutkannya.")
]

words = []
for start, end, text in segments:
    tokens = text.strip().split()
    if not tokens:
        continue
    dur = (end - start) / len(tokens)
    for i, token in enumerate(tokens):
        w_start = round(start + i * dur, 2)
        w_end = round(start + (i + 1) * dur, 2)
        clean_word = token.strip()
        words.append({
            "word": clean_word,
            "start": w_start,
            "end": w_end
        })

out_path = "d:/PROJECTS/z-automation-studio/public/assets/audio/ipm-words.json"
with open(out_path, "w", encoding="utf-8") as f:
    json.dump({"words": words}, f, indent=2, ensure_ascii=False)

print(f"Generated {len(words)} words in {out_path}")

