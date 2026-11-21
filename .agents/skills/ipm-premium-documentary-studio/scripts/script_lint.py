#!/usr/bin/env python3
"""
script_lint.py - lint an Indonesian narration-only file for the IPM documentary series.

Checks (see references/script_and_curiosity_engine.md):
  * runtime estimate from word count (calibrate --wps with a real voice sample)
  * sentence-rhythm stats and monotony flags
  * hook length, banned openers/phrases, budgeted connectives
  * rhetorical-question and exclamation limits
  * narration-only hygiene (no brackets / stage directions) and TTS risk items
  * cross-episode repetition when --series-dir is given

Usage:
  python script_lint.py ep02_narration.txt
  python script_lint.py ep02_narration.txt --series-dir narration/ --wps 2.4
Exit code: 1 if any FAIL, else 0. Standard library only.
"""
import argparse
import re
import statistics
import sys
from collections import Counter
from pathlib import Path

BANNED_OPENERS = [
    "tahukah kamu", "tahukah anda", "pada zaman dahulu",
    "kisah ini sangat menarik", "inilah awal mula",
]
BANNED_PHRASES = [
    "tidak ada yang tahu", "tak ada yang tahu", "tak banyak yang tahu",
    "luar biasa", "sangat hebat", "paling berpengaruh", "perjalanan masih panjang",
    "tinta emas", "stay tuned", "jangan lewatkan", "kisah luar biasa",
]
# Budgeted connectives: at most once per episode, and not in consecutive episodes.
BUDGETED = ["namun", "di sinilah", "ternyata", "sementara itu", "dan inilah", "pada akhirnya"]

WORD_RE = re.compile(r"[\w'’\-]+", re.UNICODE)


def read_text(path):
    return Path(path).read_text(encoding="utf-8")


def split_sentences(text):
    parts = re.split(r"(?<=[.!?…])\s+|\n+", text.strip())
    return [p.strip() for p in parts if p.strip()]


def words(s):
    return WORD_RE.findall(s)


def count_phrase(text_lower, phrase):
    return len(re.findall(r"(?<!\w)" + re.escape(phrase) + r"(?!\w)", text_lower))


def ngrams(tokens, n):
    return [" ".join(tokens[i:i + n]) for i in range(len(tokens) - n + 1)]


class Report:
    def __init__(self):
        self.items = []  # (level, message)

    def add(self, level, msg):
        self.items.append((level, msg))

    def has_fail(self):
        return any(l == "FAIL" for l, _ in self.items)


def lint_episode(text, args, rep):
    sents = split_sentences(text)
    lens = [len(words(s)) for s in sents]
    total = sum(lens)
    low = text.lower()

    # --- runtime ---
    rt = total / args.wps if args.wps else 0
    lo, hi = total / 2.7, total / 2.2
    print(f"Words: {total} | Sentences: {len(sents)}")
    print(f"Runtime estimate: {rt:.0f}s at {args.wps} w/s (range {lo:.0f}-{hi:.0f}s at 2.7-2.2 w/s). Calibrate with a real voice sample.")
    if rt < args.min_sec - 5 or rt > args.max_sec + 5:
        rep.add("WARN", f"Estimated {rt:.0f}s is outside the {args.min_sec}-{args.max_sec}s target (add/trim, or recheck pace).")

    if not sents:
        rep.add("FAIL", "No narration text found.")
        return sents, lens

    # --- rhythm ---
    avg = statistics.mean(lens)
    sd = statistics.pstdev(lens) if len(lens) > 1 else 0
    short = sum(1 for n in lens if n <= 6)
    medium = sum(1 for n in lens if 7 <= n <= 14)
    long_ = sum(1 for n in lens if n >= 15)
    print(f"Sentence length: avg {avg:.1f}, sd {sd:.1f}, min {min(lens)}, max {max(lens)} | short {short}, medium {medium}, long {long_}")
    if len(lens) >= 5 and sd < 3:
        rep.add("WARN", f"Monotone rhythm: sentence-length sd {sd:.1f} < 3. Mix short, medium, and occasional long sentences.")
    for i in range(len(lens) - 3):
        window = lens[i:i + 4]
        if max(window) - min(window) <= 2:
            rep.add("WARN", f"Four consecutive sentences of near-equal length starting at sentence {i + 1}.")
            break
    for i, n in enumerate(lens):
        if n > 22:
            rep.add("WARN", f"Sentence {i + 1} has {n} words (>22): split for the breath test: \"{sents[i][:60]}...\"")

    # --- hook ---
    hook_len = lens[0]
    print(f"Hook (first sentence): {hook_len} words -> \"{sents[0][:80]}\"")
    if hook_len > 14:
        rep.add("WARN", f"Hook is {hook_len} words (> 14). Aim for ~3-6 seconds spoken.")
    for b in BANNED_OPENERS:
        if low.lstrip().startswith(b):
            rep.add("FAIL", f"Banned opener: \"{b}\".")

    # --- banned phrases ---
    for ph in BANNED_PHRASES:
        c = count_phrase(low, ph)
        if c:
            rep.add("FAIL", f"Banned/promotional phrase \"{ph}\" x{c}.")

    # --- budgeted connectives ---
    used = {}
    for c in BUDGETED:
        n = count_phrase(low, c)
        used[c] = n
        if n > 1:
            rep.add("WARN", f"Connective \"{c}\" used {n}x (budget: once per episode).")

    # --- openers and questions ---
    firsts = [(words(s)[0].lower() if words(s) else "") for s in sents]
    for i in range(len(firsts) - 2):
        if firsts[i] and firsts[i] == firsts[i + 1] == firsts[i + 2]:
            rep.add("WARN", f"Three consecutive sentences start with \"{firsts[i]}\" (from sentence {i + 1}).")
            break
    q = text.count("?")
    if q > 2:
        rep.add("WARN", f"{q} questions (max 2 rhetorical questions per episode).")
    if "!" in text:
        rep.add("WARN", f"{text.count('!')} exclamation mark(s): avoid melodrama on facts.")
    if text.count("...") + text.count("…") > 1:
        rep.add("WARN", "Multiple ellipses: use full stops and commas for breath instead.")

    # --- narration-only hygiene ---
    if not args.allow_brackets:
        if re.search(r"[\[\](){}]", text):
            rep.add("FAIL", "Brackets/parentheses found: narration-only export must have no directions, citations, or cues.")
        if re.search(r"(?im)^\s*(sfx|music|shot|vo|narrator|camera|visual)\s*[:\-]", text):
            rep.add("FAIL", "Stage-direction labels found (SFX:/MUSIC:/SHOT:...).")

    # --- TTS risk items (info) ---
    nums = sorted(set(re.findall(r"\b\d[\d.,]*\b", text)))
    acr = sorted(set(re.findall(r"\b[A-Z]{2,6}\b", text)))
    if nums or acr:
        rep.add("INFO", f"Check pronunciation with the chosen voice. Numbers: {nums or '-'} | Acronyms: {acr or '-'}")

    return sents, lens, used


def series_compare(target_path, text, series_dir, used, rep):
    d = Path(series_dir)
    files = sorted(p for p in d.glob("*.txt") if p.resolve() != Path(target_path).resolve())
    if not files:
        rep.add("INFO", f"No other .txt files in {series_dir} to compare.")
        return
    other = {p.name: read_text(p) for p in files}
    my_tokens = [t.lower() for t in words(text)]
    my_5 = Counter(ngrams(my_tokens, 5))

    # repeated phrases: merge overlapping shared 5-grams into maximal runs
    N = 5
    found = []  # (length_in_words, phrase, filename)
    for name, t in other.items():
        toks = [x.lower() for x in words(t)]
        theirs = set(ngrams(toks, N))
        hits = [i for i in range(len(my_tokens) - N + 1)
                if " ".join(my_tokens[i:i + N]) in theirs]
        run_start = prev = None
        for i in hits + [None]:
            if run_start is None and i is not None:
                run_start = prev = i
            elif i is not None and i == prev + 1:
                prev = i
            else:
                if run_start is not None:
                    span = my_tokens[run_start:prev + N]
                    found.append((len(span), " ".join(span), name))
                run_start = prev = i if i is not None else None
    if found:
        found.sort(reverse=True)
        shown = found[:6]
        rep.add("WARN", "Repeated phrases across episodes: " +
                "; ".join(f"\"{ph}\" ({ln} words) also in {nm}" for ln, ph, nm in shown))

    # opener / closer reuse
    my_s = split_sentences(text)
    my_open = " ".join(words(my_s[0])[:3]).lower() if my_s else ""
    my_close = " ".join(words(my_s[-1])[:3]).lower() if my_s else ""
    for name, t in other.items():
        s = split_sentences(t)
        if not s:
            continue
        o = " ".join(words(s[0])[:3]).lower()
        c = " ".join(words(s[-1])[:3]).lower()
        if my_open and o == my_open:
            rep.add("WARN", f"Hook opens with the same first words (\"{my_open}\") as {name}.")
        if my_close and c == my_close:
            rep.add("WARN", f"Ending starts with the same first words (\"{my_close}\") as {name}.")

    # budgeted connectives in consecutive episodes
    names = sorted(list(other.keys()) + [Path(target_path).name])
    idx = names.index(Path(target_path).name)
    neigh = [names[i] for i in (idx - 1, idx + 1) if 0 <= i < len(names) and names[i] in other]
    for n in neigh:
        low_n = other[n].lower()
        for c, k in used.items():
            if k and count_phrase(low_n, c):
                rep.add("WARN", f"Connective \"{c}\" also appears in adjacent episode {n}.")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("file", help="narration-only .txt file")
    ap.add_argument("--series-dir", help="folder of other episodes' narration .txt files")
    ap.add_argument("--wps", type=float, default=2.4, help="words per second (default 2.4; calibrate!)")
    ap.add_argument("--min-sec", type=int, default=60)
    ap.add_argument("--max-sec", type=int, default=120)
    ap.add_argument("--allow-brackets", action="store_true", help="skip narration-only hygiene check")
    args = ap.parse_args()

    text = read_text(args.file)
    rep = Report()
    print(f"== script_lint: {args.file} ==")
    result = lint_episode(text, args, rep)
    used = result[2] if len(result) == 3 else {}
    if args.series_dir:
        series_compare(args.file, text, args.series_dir, used, rep)

    print()
    order = {"FAIL": 0, "WARN": 1, "INFO": 2}
    for level, msg in sorted(rep.items, key=lambda x: order[x[0]]):
        print(f"[{level}] {msg}")
    if not rep.items:
        print("[OK] No issues found.")
    print("\nResult:", "FAIL" if rep.has_fail() else "PASS (review warnings)")
    sys.exit(1 if rep.has_fail() else 0)


if __name__ == "__main__":
    main()
