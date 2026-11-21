#!/usr/bin/env python3
"""
series_audit.py - audit the variation matrix and open-loop ledger of the IPM series.

Rules (see references/series_bible_and_arc.md sections 4-5):
  V1 hook_type and structure do not repeat within any window of 3 consecutive episodes
  V2 ending_type never repeats in consecutive episodes
  V3 distinct structures >= 5 (12+ episodes; else min(3, n)); >= 2 quiet_chronicle when n >= 10
  V4 opening_visual_mode does not repeat in consecutive episodes
  V5 voiced_ratio varies: min <= 0.65 and max >= 0.85 (n >= 10)
  V6 narrator_tempo: no more than 2 consecutive episodes the same
  V7 vocabulary check (warning only)
  L1 loops: closed_ep > opened_ep (episode loops: equal), closed by the last episode
  L2 at most 3 loops open at once; at most 2 arc loops open at once
  L3 bridge loops close in the next episode (warning otherwise)
  L4 every episode ending in bridge_loop (except the last) has a loop opened there and closed in the next episode

Usage:
  python series_audit.py variation_matrix.csv [--loops open_loops.csv]
Exit code: 1 if any FAIL. Standard library only.
"""
import argparse
import csv
import sys
from collections import Counter

VOCAB = {
    "hook_type": {"specific_question", "verified_paradox", "object_doorway", "consequence_first",
                  "misconception_flip", "scale_or_number", "moment_in_medias_res", "contrast_then_now",
                  "absence_gap", "decision_countdown", "document_voice", "silence_image"},
    "structure": {"question_first", "object_doorway", "decision_point", "reverse_reveal", "one_day_one_room",
                  "contrast_pair", "map_movement", "misconception_correction", "quiet_chronicle",
                  "numbers_ledger", "document_voice"},
    "ending_type": {"answer_resolve", "reframe", "bridge_loop", "quiet_hold", "consequence_echo", "motif_callback"},
    "opening_visual_mode": {"place_wide", "human_action", "object_insert", "map_graphic",
                            "abstract_symbolic", "text_document"},
    "camera_signature": {"locked_observational", "slow_lateral_track", "reveal_pullback",
                         "dolly_toward_detail", "match_cut_driven", "elevated_glide", "subtle_handheld"},
    "narrator_tempo": {"measured", "brisk", "intimate_slow", "building"},
}


def read_rows(path):
    with open(path, newline="", encoding="utf-8") as f:
        rows = [r for r in csv.DictReader(f) if any((v or "").strip() for v in r.values())]
    return rows


def audit_matrix(rows, out):
    n = len(rows)
    for r in rows:
        r["ep"] = int(r["ep"])
    rows.sort(key=lambda r: r["ep"])
    eps = [r["ep"] for r in rows]
    if eps != list(range(1, n + 1)):
        out.append(("WARN", f"Episode numbers are not 1..{n} contiguous: {eps}"))

    def col(name):
        return [(r[name] or "").strip() for r in rows]

    # V1
    for name in ("hook_type", "structure"):
        vals = col(name)
        bad = set()
        for i in range(n):
            for j in range(i + 1, min(i + 3, n)):
                if vals[i] and vals[i] == vals[j]:
                    bad.add((vals[i], rows[i]["ep"], rows[j]["ep"]))
        for v, a, b in sorted(bad, key=lambda x: x[1]):
            out.append(("FAIL", f"V1 {name} \"{v}\" repeats within 3 episodes (ep {a} and ep {b})."))
    # V2, V4
    for rule, name in (("V2", "ending_type"), ("V4", "opening_visual_mode")):
        vals = col(name)
        for i in range(n - 1):
            if vals[i] and vals[i] == vals[i + 1]:
                out.append(("FAIL", f"{rule} {name} \"{vals[i]}\" repeats in consecutive episodes {rows[i]['ep']} and {rows[i + 1]['ep']}."))
    # V3
    structs = col("structure")
    need = 5 if n >= 12 else min(3, n)
    distinct = len(set(structs))
    if distinct < need:
        out.append(("FAIL", f"V3 only {distinct} distinct structures (need >= {need})."))
    if n >= 10 and structs.count("quiet_chronicle") < 2:
        out.append(("FAIL", f"V3 only {structs.count('quiet_chronicle')} quiet_chronicle episode(s) (need >= 2)."))
    # V5
    if n >= 10:
        try:
            vr = [float(x) for x in col("voiced_ratio")]
            if min(vr) > 0.65:
                out.append(("FAIL", f"V5 no low-voiced episode (min voiced_ratio {min(vr)} > 0.65)."))
            if max(vr) < 0.85:
                out.append(("FAIL", f"V5 no high-voiced episode (max voiced_ratio {max(vr)} < 0.85)."))
        except ValueError:
            out.append(("WARN", "V5 voiced_ratio has non-numeric values; skipped."))
    # V6
    tempo = col("narrator_tempo")
    for i in range(n - 2):
        if tempo[i] and tempo[i] == tempo[i + 1] == tempo[i + 2]:
            out.append(("FAIL", f"V6 narrator_tempo \"{tempo[i]}\" used for 3 consecutive episodes from ep {rows[i]['ep']}."))
    # V7
    for name, allowed in VOCAB.items():
        for r in rows:
            v = (r.get(name) or "").strip()
            if v and v not in allowed:
                out.append(("WARN", f"V7 ep {r['ep']}: {name} \"{v}\" is not in the standard vocabulary (fine if intentional; document it in the Series Bible)."))
    # info
    pal = [(r.get("era_palette") or "").strip() for r in rows]
    if any(p.upper() == "TBD" or not p for p in pal):
        out.append(("INFO", "era_palette still TBD for some episodes (fill after S1/S2 research)."))
    return n


def audit_loops(path, n_eps, out, matrix_rows=None):
    rows = read_rows(path)
    loops = []
    for r in rows:
        try:
            loops.append({
                "id": r["loop_id"], "type": (r["type"] or "").strip(),
                "o": int(r["opened_ep"]), "c": int(r["closed_ep"]),
            })
        except (ValueError, KeyError):
            out.append(("FAIL", f"L1 loop row unreadable (need loop_id,type,opened_ep,closed_ep): {r}"))
    last = n_eps or max((l["c"] for l in loops), default=0)
    for l in loops:
        if l["type"] == "episode":
            if l["c"] != l["o"]:
                out.append(("FAIL", f"L1 episode loop {l['id']} must close in the same episode (opened {l['o']}, closed {l['c']})."))
        elif l["c"] <= l["o"]:
            out.append(("FAIL", f"L1 loop {l['id']} closes (ep {l['c']}) at or before it opens (ep {l['o']})."))
        if last and l["c"] > last:
            out.append(("FAIL", f"L1 loop {l['id']} closes in ep {l['c']}, after the last episode ({last}): it is never paid off."))
        if l["type"] == "bridge" and l["c"] - l["o"] > 1:
            out.append(("WARN", f"L3 bridge loop {l['id']} spans {l['c'] - l['o']} episodes; consider an arc loop instead."))
    peak = 0
    for e in range(1, (last or 0) + 1):
        open_now = [l for l in loops if l["type"] != "episode" and l["o"] <= e < l["c"]]
        arcs = [l for l in open_now if l["type"] == "arc"]
        peak = max(peak, len(open_now))
        if len(open_now) > 3:
            out.append(("FAIL", f"L2 {len(open_now)} loops open after ep {e} ({', '.join(l['id'] for l in open_now)}); max 3."))
        if len(arcs) > 2:
            out.append(("FAIL", f"L2 {len(arcs)} arc loops open after ep {e}; max 2."))
    print(f"Loops: {len(loops)} | peak simultaneously open: {peak}")
    # L4: bridge_loop endings must be backed by a real, tracked loop
    if matrix_rows:
        for r in matrix_rows:
            ep = r["ep"]
            if (r.get("ending_type") or "").strip() == "bridge_loop" and ep < last:
                if not any(l["o"] == ep and l["c"] == ep + 1 for l in loops):
                    out.append(("FAIL", f"L4 ep {ep} ends with bridge_loop but no loop is opened in ep {ep} and closed in ep {ep + 1}. A bridge needs a real, tracked question."))
        for l in loops:
            if l["type"] == "bridge":
                end = next(((r.get("ending_type") or "").strip() for r in matrix_rows if r["ep"] == l["o"]), "")
                if end and end != "bridge_loop":
                    out.append(("WARN", f"L4 bridge loop {l['id']} opens in ep {l['o']}, whose ending_type is \"{end}\" (expected bridge_loop)."))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("matrix", help="variation_matrix.csv")
    ap.add_argument("--loops", help="open_loops.csv")
    args = ap.parse_args()

    out = []
    rows = read_rows(args.matrix)
    print(f"== series_audit: {args.matrix} ({len(rows)} episodes) ==")
    n = audit_matrix(rows, out)
    structs = Counter(r["structure"] for r in rows)
    print("Structures used:", dict(structs))
    if args.loops:
        audit_loops(args.loops, n, out, rows)

    order = {"FAIL": 0, "WARN": 1, "INFO": 2}
    print()
    for level, msg in sorted(out, key=lambda x: order[x[0]]):
        print(f"[{level}] {msg}")
    failed = any(l == "FAIL" for l, _ in out)
    if not out:
        print("[OK] All variation and loop rules satisfied.")
    print("\nResult:", "FAIL" if failed else "PASS")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
