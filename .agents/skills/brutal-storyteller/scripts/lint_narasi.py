#!/usr/bin/env python3
"""Linter naskah Brutal Storyteller.
Pemakaian: python scripts/lint_narasi.py naskah.txt   (atau: cat naskah.txt | python scripts/lint_narasi.py -)
Menandai: pembuka mati, klise, kata sifat kosong, penjelasan emosi, ritme datar,
kalimat panjang beruntun, awalan kata berulang, penutup hambar, em dash berlebih.
"""
import re
import sys
import statistics

OPENERS = [
    "halo guys", "hai guys", "hai semua", "halo semua", "selamat datang",
    "tahukah kamu", "pernahkah kamu", "di era modern", "di era digital",
    "seiring perkembangan", "seiring berkembangnya", "dalam video kali ini",
    "hari ini kita akan", "mungkin kamu bertanya",
]
CLICHES = [
    "tidak dapat dipungkiri", "perlu diketahui bahwa", "penting untuk dicatat",
    "pada dasarnya", "mari kita bahas", "tanpa berlama-lama", "jadi, kesimpulannya",
    "jadi kesimpulannya", "hal ini menunjukkan bahwa", "roda kehidupan",
    "sebuah perjalanan yang panjang", "banyak orang yang", "pada akhirnya",
]
EMPTY_ADJ = [
    "luar biasa", "menakjubkan", "sangat penting", "sangat menarik", "mengerikan",
    "dahsyat", "fantastis", "spektakuler", "inspiratif", "banyak sekali",
    "sangat besar", "sangat cepat", "sangat berbahaya",
]
CLOSERS = [
    "semoga bermanfaat", "terima kasih sudah menonton", "terima kasih telah menonton",
    "jangan lupa like", "jangan lupa subscribe", "pelajaran yang bisa kita ambil",
    "jadi pelajaran",
]
EMOTION_TELL = re.compile(
    r"\b(?:ia|dia|mereka|aku|saya|kita)\s+(?:merasa|terasa)\s+"
    r"(?:sangat\s+)?(?:sedih|takut|marah|cemas|khawatir|bahagia|senang|kecewa|bangga|gagal)",
    re.I,
)


def split_sentences(text):
    parts = re.split(r"(?<=[.!?…])\s+|\n+", text)
    return [p.strip() for p in parts if p.strip() and re.search(r"\w", p)]


def wc(s):
    return len(re.findall(r"\w+", s))


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else "-"
    text = sys.stdin.read() if path == "-" else open(path, encoding="utf-8").read()
    text = re.sub(r"\[[^\]]*\]", " ", text)  # buang tanda produksi [jeda] dll
    low = text.lower()
    sents = split_sentences(text)
    lens = [wc(s) for s in sents]
    total = sum(lens)
    warns = []

    if not sents:
        print("Naskah kosong.")
        return

    first = sents[0].lower()
    for o in OPENERS:
        if first.startswith(o) or o in first[:60]:
            warns.append(f"PEMBUKA MATI: \"{o}\" di kalimat pertama. Ganti dengan hook H1/H3/H8.")

    for group, label in ((CLICHES, "KLISE"), (EMPTY_ADJ, "KATA SIFAT KOSONG"), (CLOSERS, "PENUTUP HAMBAR")):
        for item in group:
            n = low.count(item)
            if n:
                warns.append(f"{label}: \"{item}\" ({n}x). Ganti dengan bukti/benda/angka." if label != "PENUTUP HAMBAR"
                             else f"{label}: \"{item}\". Tutup dengan Payoff + Residue + Bridge.")

    for m in EMOTION_TELL.finditer(text):
        warns.append(f"PENJELASAN EMOSI: \"{m.group(0)}\". Tunjukkan lewat tubuh/benda, jangan sebut emosinya.")

    if len(lens) >= 6:
        sd = statistics.pstdev(lens)
        if sd < 3.0:
            warns.append(f"RITME DATAR: simpangan panjang kalimat {sd:.1f} (<3). Terapkan pola 1-3-1.")
    run = 0
    for i, n in enumerate(lens):
        run = run + 1 if n > 22 else 0
        if run == 3:
            warns.append(f"KALIMAT PANJANG BERUNTUN: sekitar kalimat {i+1}. Potong salah satunya.")
            break
    run = 0
    for i, n in enumerate(lens):
        run = run + 1 if n <= 4 else 0
        if run == 5:
            warns.append(f"STACCATO BERLEBIH: sekitar kalimat {i+1}. Selipkan satu kalimat panjang.")
            break

    starts = [re.findall(r"\w+", s.lower())[0] for s in sents if re.findall(r"\w+", s)]
    for i in range(len(starts) - 2):
        if starts[i] == starts[i + 1] == starts[i + 2]:
            warns.append(f"AWALAN BERULANG 3x: \"{starts[i]}\". Boleh jika disengaja sebagai palu (sekali per naskah).")
            break

    dashes = text.count("—") + text.count(" - ")
    if dashes > 3:
        warns.append(f"TANDA HUBUNG/EM DASH berlebih ({dashes}x). Pakai titik, koma, atau baris kosong.")

    if len(sents) >= 4 and "?" not in text:
        warns.append("TANPA PERTANYAAN: tidak ada satu pun kalimat tanya. Pastikan loop terbuka lewat cara lain.")

    print(f"Kata: {total} | Kalimat: {len(sents)} | Rata-rata: {total/len(sents):.1f} kata/kalimat")
    print(f"Estimasi durasi baca (VO): {total/2.6:.0f} detik (~2.6 kata/detik)")
    print(f"Kalimat pertama ({lens[0]} kata): {sents[0]}")
    print()
    if warns:
        print(f"{len(warns)} PERINGATAN:")
        for w in warns:
            print(" -", w)
    else:
        print("Bersih. Lanjut ke Quality Gate (rubrik 10 kriteria).")


if __name__ == "__main__":
    main()
