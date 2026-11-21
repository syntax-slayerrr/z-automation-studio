"""Audio-first Episode 02 ("Nama yang Pernah Hilang") VO builder using Cartesia sonic-3 (Galang).

Synthesizes beat-by-beat WITHOUT English beta `emotion` tags, tightens internal
silences cleanly, maps spoken numbers/acronyms/Roman numerals 1-to-1 back to display
tokens, and leaves opening crowd room (0.75s) + post-1992/2008 dramatic pauses per
the Director's Notes.
"""
from __future__ import annotations

import array
import base64
import json
import os
import re
import subprocess
import urllib.request
import wave
from pathlib import Path

PROJECT = Path(__file__).resolve().parents[1]
ROOT = Path(__file__).resolve().parents[2]
SR = 44100
API = "https://api.cartesia.ai/tts/sse"
VERSION = "2025-04-16"
VOICE_ID = "04b567df-2923-4b0c-896b-4b7df0a07e1a"  # Galang
MODEL_ID = "sonic-3"

OPEN_LEAD_SILENCE_S = 0.35

NUM_SPOKEN: dict[str, str] = {
    "2010": "dua ribu sepuluh",
    "1960": "seribu sembilan ratus enam puluh",
    "1961": "seribu sembilan ratus enam puluh satu",
    "1969": "seribu sembilan ratus enam puluh sembilan",
    "1976": "seribu sembilan ratus tujuh puluh enam",
    "18": "delapan belas",
    "1992": "seribu sembilan ratus sembilan puluh dua",
    "1998": "seribu sembilan ratus sembilan puluh delapan",
    "XV": "kelima belas",
    "2006": "dua ribu enam",
    "2007": "dua ribu tujuh",
    "XVI": "keenam belas",
    "2008": "dua ribu delapan",
    "XVII": "ketujuh belas",
    "3": "tiga",
    "8": "delapan",
    "OSIS": "osis",
    "Khittah": "Khitah",
}

# Scene -> list of beat specs: (text_with_cues, speed, pause_after_s)
# Cohesive dramatic beats (14 unbroken flows across 6 scenes) with subtle sonic-3 <emotion> tags.
SCENES_DEF: list[dict] = [
    {
        "id": "S0",
        "beats": [
            (
                '<emotion value="calm"/> [[s0_1960]]Yogyakarta, 1960. '
                'Dari pertemuan itu, [[s0_1961]]18 Juli 1961 di Surakarta, '
                '[[s0_ipm]]Ikatan Pelajar Muhammadiyah resmi berdiri.',
                1.00,
                0.20,
            ),
            (
                '<emotion value="contemplative"/> [[s0_42y]]Empat puluh dua tahun pelajar menunggu satu nama. '
                '<break time="0.22s"/> <emotion value="melancholic"/> '
                'Tapi nama itu [[s0_twist]]kelak harus mereka hapus sendiri.',
                0.98,
                0.40,
            ),
        ],
    },
    {
        "id": "S1",
        "beats": [
            (
                '<emotion value="concerned"/> [[s1_1961]]Tahun-tahun awalnya tidak pernah tenang. '
                'Di luar, [[s1_conflict]]ideologi bertabrakan.',
                0.99,
                0.18,
            ),
            (
                '<emotion value="determined"/> Dari [[s1_unite]]Sumatra hingga Sulawesi, '
                'ribuan pelajar harus disatukan dalam satu [[s1_dakwah]]barisan.',
                1.00,
                0.20,
            ),
            (
                '<emotion value="contemplative"/> Pada [[s1_1969]]1969, [[s1_khittah]]Khittah Perjuangan dan Identitas IPM mulai ditempa. '
                '<break time="0.18s"/> <emotion value="proud"/> '
                'Puncaknya, [[s1_1976]]1976, lahir [[s1_spi]]Sistem Pengkaderan IPM!',
                0.99,
                0.34,
            ),
        ],
    },
    {
        "id": "S2",
        "beats": [
            (
                '<emotion value="concerned"/> [[s2_next]]Masalahnya, badai itu datang bukan dari lawan di jalanan. '
                'Ia datang lewat [[s2_gov]]aturan di ruang kelas.',
                1.00,
                0.18,
            ),
            (
                '<emotion value="concerned"/> [[s2_osis]]OSIS ditetapkan sebagai satu-satunya organisasi pelajar yang diakui di sekolah. '
                'Satu per satu, [[s2_door]]gerbang sekolah menutup.',
                0.98,
                0.22,
            ),
            (
                '<emotion value="contemplative"/> [[s2_decide]]Pilihannya tinggal dua: mempertahankan kata Pelajar lalu [[s2_push]]terputus dari sekolah, '
                '<emotion value="determined"/> atau menggantinya demi menyelamatkan kaderisasi.',
                0.99,
                0.28,
            ),
            (
                '<emotion value="contemplative"/> [[s2_nov18]]18 November 1992, keputusan itu [[s2_ketuk]]diketuk. '
                '<break time="0.30s"/> <emotion value="melancholic"/> '
                '[[s2_morph]]Ikatan Pelajar Muhammadiyah [[s2_berganti]]berganti menjadi '
                'Ikatan [[s2_remaja]]Remaja Muhammadiyah, atau [[s2_irm]]IRM.',
                0.97,
                0.65,
            ),
        ],
    },
    {
        "id": "S3",
        "beats": [
            (
                '<emotion value="contemplative"/> Di luar pagar sekolah, [[s3_era]]nama IRM memberi ruang bernapas. '
                '<emotion value="curious"/> Sampai [[s3_change]]Reformasi 1998 mengubah peta politik, '
                'dan satu [[s3_q]]pertanyaan kembali menagih: siapa yang sebenarnya mereka wakili?',
                0.99,
                0.24,
            ),
            (
                '<emotion value="determined"/> [[s3_medan]]Muktamar XV tahun 2006 di Medan membakar desakan untuk pulang. '
                '[[s3_tanwir]]Tanwir Muhammadiyah 2007 di Yogyakarta membuka jalannya.',
                1.00,
                0.20,
            ),
            (
                '<emotion value="proud"/> Dan di [[s3_solo]]Solo, pada Muktamar XVI tahun 2008, '
                '[[s3_return]]nama [[s3_ipmback]]IPM resmi kembali.',
                0.98,
                0.38,
            ),
        ],
    },
    {
        "id": "S4",
        "beats": [
            (
                '<emotion value="calm"/> [[s4_twoyr]]Dua tahun kemudian, di Bantul, mereka tidak berhenti di seremoni. '
                '[[s4_mkt17]]Muktamar XVII, 3 hingga 8 Juli 2010, melahirkan [[s4_gpk]]Gerakan Pelajar Kreatif, '
                'turunan dari [[s4_gkt]]Gerakan Kritis Transformatif.',
                0.99,
                0.20,
            ),
            (
                '<emotion value="confident"/> Targetnya jelas: menjadikan IPM [[s4_rumah]]Rumah Kreatif Pelajar Indonesia.',
                0.98,
                0.34,
            ),
        ],
    },
    {
        "id": "S5",
        "beats": [
            (
                '<emotion value="contemplative"/> [[s5_montage]]Enam belas tahun nama itu pergi, lalu pulang. '
                'Tapi di atas kertas muktamar, [[s5_slow]]gagasan baru saja ditulis. '
                '<break time="0.20s"/> <emotion value="curious"/> '
                'Pertanyaannya: bagaimana gerakan itu berjalan ketika harus [[s5_endcard]]turun ke ruang kelas dan cabang-cabang di daerah?',
                0.97,
                0.46,
            ),
        ],
    },
]


def load_env() -> None:
    for line in (ROOT / ".env").read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())


def expand_core_token(core: str) -> list[str]:
    if core in NUM_SPOKEN:
        return NUM_SPOKEN[core].split()
    if "-" in core:
        subs = [sub for sub in core.split("-") if sub]
        if any(sub in NUM_SPOKEN or sub.isdigit() for sub in subs):
            out: list[str] = []
            for sub in subs:
                out.extend(NUM_SPOKEN.get(sub, sub).split())
            return out
        # Keep Indonesian reduplications ("Tahun-tahun", "cabang-cabang") hyphenated for fluid TTS.
        return [core]
    return [core]


def clean_display_and_expand(line_text: str, line_idx: int) -> tuple[list[dict], str]:
    tokens: list[dict] = []
    spoken_parts: list[str] = []
    spoken_idx = 0
    for seg in re.split(r"(<[^>]+>)", line_text):
        if not seg:
            continue
        if seg.startswith("<") and seg.endswith(">"):
            spoken_parts.append(seg)
            continue
        for raw in seg.split():
            m = re.match(r"^(?:\[\[([^\]]+)\]\])?(.*)$", raw)
            assert m
            cue, disp = m.group(1), m.group(2)
            if not disp:
                continue
            core_match = re.match(r"^([^0-9A-Za-z']*)([0-9A-Za-z'-]+)([^0-9A-Za-z']*)$", disp)
            if core_match:
                pre, core, post = core_match.groups()
                spoken_words = expand_core_token(core)
                spoken_str = f"{pre}{' '.join(spoken_words)}{post}"
            else:
                spoken_words = [disp]
                spoken_str = disp
            tokens.append(
                {
                    "w": disp,
                    "cue": cue,
                    "line": line_idx,
                    "spoken_start_idx": spoken_idx,
                    "spoken_count": len(spoken_words),
                    "spoken_text": spoken_words,
                }
            )
            spoken_parts.append(spoken_str)
            spoken_idx += len(spoken_words)
    return tokens, " ".join(spoken_parts)


def sanitize_for_tts(text: str, use_comma_acronym_end: bool = False) -> str:
    """Keep SSML tags intact, turn colons into smooth flow commas, and pad edges against SSE cuts."""
    parts: list[str] = []
    for seg in re.split(r"(<[^>]+>)", text):
        if not seg:
            continue
        if seg.startswith("<") and seg.endswith(">"):
            parts.append(seg)
        else:
            s = re.sub(r":+", ",", seg)
            s = re.sub(r";+", ".", s)
            s = re.sub(r"!+", ".", s)
            s = re.sub(r"\s+([.,?])", r"\1", s)
            parts.append(s)
    clean = re.sub(r"\s{2,}", " ", "".join(parts)).strip()
    if use_comma_acronym_end and re.search(r"\b(?:IPM|IRM)\.$", clean):
        clean = clean[:-1] + ","
    return f'<break time="0.20s"/> {clean} <break time="0.85s"/>'


def has_clipped_tail(pcm: bytes, words: list[dict]) -> bool:
    """Detect premature Cartesia SSE cutoffs at sentence end (cliff amplitude drop or micro-acronym)."""
    if not words or len(pcm) < 400:
        return True
    lw = words[-1]
    w_clean = re.sub(r"[^A-Za-z0-9]", "", lw.get("word", ""))
    dur = float(lw.get("end", 0)) - float(lw.get("start", 0))
    if w_clean in ("IPM", "IRM") and dur < 0.30:
        return True
    samples = array.array("h")
    samples.frombytes(pcm)
    end_idx = min(len(samples), int(float(lw.get("end", 0)) * SR))
    # Check 35ms right before reported end vs 35ms immediately after: sudden >2200 -> <=40 is an SSE cliff cut
    pre_slice = samples[max(0, end_idx - int(0.035 * SR)) : end_idx]
    post_slice = samples[end_idx : min(len(samples), end_idx + int(0.035 * SR))]
    pre_peak = max((abs(x) for x in pre_slice), default=0)
    post_peak = max((abs(x) for x in post_slice), default=0)
    if pre_peak > 2200 and post_peak <= 40:
        return True
    return False


def cartesia_sse(text: str, speed: float) -> tuple[bytes, list[dict]]:
    for attempt in range(3):
        use_comma = attempt >= 2
        payload = {
            "model_id": MODEL_ID,
            "transcript": sanitize_for_tts(text, use_comma_acronym_end=use_comma),
            "voice": {"mode": "id", "id": VOICE_ID},
            "output_format": {"container": "raw", "encoding": "pcm_s16le", "sample_rate": SR},
            "language": "id",
            "add_timestamps": True,
            "generation_config": {"speed": speed},
        }
        req = urllib.request.Request(
            API,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "X-API-Key": os.environ["CARTESIA_API_KEY"],
                "Cartesia-Version": VERSION,
                "Content-Type": "application/json",
            },
            method="POST",
        )
        chunks: list[bytes] = []
        words: list[dict] = []
        with urllib.request.urlopen(req, timeout=45) as resp:
            for raw in resp:
                line = raw.decode("utf-8").strip()
                if not line.startswith("data:"):
                    continue
                body = line[5:].strip()
                if not body:
                    continue
                msg = json.loads(body)
                t = msg.get("type")
                if t == "chunk" and msg.get("data"):
                    chunks.append(base64.b64decode(msg["data"]))
                elif t == "timestamps":
                    wt = msg.get("word_timestamps", {})
                    for w, s, e in zip(wt.get("words", []), wt.get("start", []), wt.get("end", [])):
                        words.append({"word": w, "start": float(s), "end": float(e)})
                elif t == "done":
                    break
        pcm = b"".join(chunks)
        if not has_clipped_tail(pcm, words) or attempt == 2:
            if attempt > 0:
                print(f"  -> [retry {attempt}] fixed tail cleanly")
            return pcm, words
        print(f"  -> [retry {attempt + 1}] detected abrupt tail/acronym cutoff, regenerating...")
    return pcm, words


def pcm_to_wav(path: Path, pcm: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes(pcm)


def norm_word(w: str) -> str:
    return re.sub(r"[^a-z0-9]", "", w.lower())


def align_cartesia_words(expected_tokens: list[dict], cart_words: list[dict]) -> list[tuple[float, float]]:
    flat_expected: list[str] = []
    for tok in expected_tokens:
        for sw in tok["spoken_text"]:
            flat_expected.append(norm_word(sw))
    got = [norm_word(w["word"]) for w in cart_words]
    n, m = len(flat_expected), len(got)
    dp = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(n + 1):
        dp[i][0] = -i
    for j in range(m + 1):
        dp[0][j] = -j
    for i in range(1, n + 1):
        ei = flat_expected[i - 1]
        for j in range(1, m + 1):
            gj = got[j - 1]
            sub = 2 if ei == gj else (-1 if (ei and gj and (ei[:3] == gj[:3] or ei in gj or gj in ei)) else -2)
            dp[i][j] = max(dp[i - 1][j - 1] + sub, dp[i - 1][j] - 1, dp[i][j - 1] - 1)
    i, j = n, m
    mapping: list[tuple[float, float] | None] = [None] * n
    while i > 0 and j > 0:
        ei, gj = flat_expected[i - 1], got[j - 1]
        sub = 2 if ei == gj else (-1 if (ei and gj and (ei[:3] == gj[:3] or ei in gj or gj in ei)) else -2)
        if dp[i][j] == dp[i - 1][j - 1] + sub:
            mapping[i - 1] = (cart_words[j - 1]["start"], cart_words[j - 1]["end"])
            i -= 1
            j -= 1
        elif dp[i][j] == dp[i - 1][j] - 1:
            i -= 1
        else:
            j -= 1
    last_t = 0.0
    for idx in range(n):
        if mapping[idx] is not None:
            last_t = mapping[idx][1]
        else:
            nxt = next((mapping[k][0] for k in range(idx + 1, n) if mapping[k] is not None), last_t + 0.14)
            mapping[idx] = (last_t, max(last_t + 0.08, (last_t + nxt) * 0.5))
            last_t = mapping[idx][1]

    spans: list[tuple[float, float]] = []
    for tok in expected_tokens:
        s0 = tok["spoken_start_idx"]
        s1 = s0 + tok["spoken_count"] - 1
        st = mapping[s0][0]  # type: ignore[index]
        en = mapping[s1][1]  # type: ignore[index]
        spans.append((st, en))
    return spans


def trim_and_tighten_pcm(
    pcm: bytes,
    spans: list[tuple[float, float]],
    max_internal_gap: float = 0.55,
    clamped_gap: float = 0.34,
) -> tuple[bytes, list[tuple[float, float]]]:
    samples = array.array("h")
    samples.frombytes(pcm)
    total_dur = len(samples) / SR
    if not spans or len(samples) == 0:
        return pcm, spans

    # Scan acoustic onset around first word so plosives/frictatives ("D-", "P-") never clip.
    onset_win_start = max(0, int((spans[0][0] - 0.14) * SR))
    onset_win_end = min(len(samples), int((spans[0][0] + 0.08) * SR))
    first_voice_idx = None
    for si in range(onset_win_start, onset_win_end):
        if abs(samples[si]) > 220:
            first_voice_idx = si
            break
    if first_voice_idx is not None:
        lead_cut = max(0.0, min(spans[0][0] - 0.05, first_voice_idx / SR - 0.05))
    else:
        lead_cut = max(0.0, spans[0][0] - 0.08)

    # Scan acoustic release into trailing <break/> pad so final syllables/consonants finish naturally.
    tail_scan_start = max(0, int((spans[-1][1] - 0.05) * SR))
    tail_scan_end = min(len(samples), int((spans[-1][1] + 0.50) * SR))
    last_voice_idx = None
    for si in range(tail_scan_end - 1, tail_scan_start - 1, -1):
        if abs(samples[si]) > 180:
            last_voice_idx = si
            break
    if last_voice_idx is not None:
        tail_end = min(total_dur, max(spans[-1][1] + 0.16, last_voice_idx / SR + 0.18))
    else:
        tail_end = min(total_dur, spans[-1][1] + 0.20)

    kept: list[tuple[float, float]] = []
    cur_start = lead_cut
    for idx in range(len(spans) - 1):
        end_cur = spans[idx][1]
        start_nxt = spans[idx + 1][0]
        if start_nxt - end_cur > max_internal_gap:
            cut_a = end_cur + clamped_gap * 0.5
            cut_b = start_nxt - clamped_gap * 0.5
            sa = max(0, int(round(cut_a * SR)))
            sb = min(len(samples), int(round(cut_b * SR)))
            if sb > sa:
                peak_mid = max((abs(samples[k]) for k in range(sa, sb)), default=0)
                if peak_mid <= 240:
                    kept.append((cur_start, cut_a))
                    cur_start = cut_b
    kept.append((cur_start, tail_end))

    out_chunks: list[bytes] = []
    remapped_offsets: list[tuple[float, float, float]] = []
    out_cursor = 0.0
    for a, b in kept:
        sa = max(0, int(round(a * SR)))
        sb = min(len(samples), int(round(b * SR)))
        if sb <= sa:
            continue
        seg = array.array("h", samples[sa:sb])
        fade_in_len = min(int(0.008 * SR), len(seg) // 4)
        fade_out_len = min(int(0.014 * SR), len(seg) // 4)
        for fi in range(fade_in_len):
            seg[fi] = int(seg[fi] * (fi / max(1, fade_in_len)))
        for fi in range(fade_out_len):
            seg[-1 - fi] = int(seg[-1 - fi] * (fi / max(1, fade_out_len)))
        out_chunks.append(seg.tobytes())
        remapped_offsets.append((a, b, out_cursor))
        out_cursor += len(seg) / SR

    def remap_t(t: float) -> float:
        for a, b, oc in remapped_offsets:
            if t <= b + 1e-4:
                return max(0.0, oc + max(0.0, min(b - a, t - a)))
        return out_cursor

    new_spans = [(round(remap_t(s), 3), round(remap_t(e), 3)) for s, e in spans]
    return b"".join(out_chunks), new_spans


def main() -> None:
    load_env()
    tmp_dir = PROJECT / "out/ep02/voice_tmp"
    tmp_dir.mkdir(parents=True, exist_ok=True)
    master_wav = PROJECT / "public/audio/ep02/ep02_vo_galang.wav"
    master_wav.parent.mkdir(parents=True, exist_ok=True)
    align_out = PROJECT / "src/episodes/ep02/alignment.json"
    narr_out = PROJECT / "src/episodes/ep02/production/narration_aligned.txt"

    pcm_parts: list[bytes] = [b"\x00\x00" * int(round(OPEN_LEAD_SILENCE_S * SR))]
    aligned_words: list[dict] = []
    narr_lines: list[str] = ["# THE IPM CHRONICLES — EP02 ALIGNED NARRATION", ""]
    cursor = OPEN_LEAD_SILENCE_S

    for si, sc in enumerate(SCENES_DEF):
        narr_lines.append(f"## {sc['id']}")
        for li, (line_text, speed, pause_after) in enumerate(sc["beats"]):
            tokens, spoken_text = clean_display_and_expand(line_text, li)
            narr_lines.append(" ".join(t["w"] for t in tokens))
            print(f"[{sc['id']}.L{li}] speed={speed:.2f} -> {spoken_text}")
            raw_pcm, cart_words = cartesia_sse(spoken_text, speed)
            pcm_to_wav(tmp_dir / f"{sc['id']}_L{li}_raw.wav", raw_pcm)

            spans = align_cartesia_words(tokens, cart_words)
            tight_pcm, tight_spans = trim_and_tighten_pcm(raw_pcm, spans)
            tight_dur = len(tight_pcm) / (SR * 2)
            pcm_to_wav(tmp_dir / f"{sc['id']}_L{li}_tight.wav", tight_pcm)

            for tok, (st, en) in zip(tokens, tight_spans):
                aligned_words.append(
                    {
                        "w": tok["w"],
                        "cue": tok["cue"],
                        "scene": si,
                        "line": li,
                        "start": round(cursor + st, 3),
                        "end": round(cursor + en, 3),
                    }
                )
            pcm_parts.append(tight_pcm)
            pcm_parts.append(b"\x00\x00" * int(round(pause_after * SR)))
            cursor += tight_dur + pause_after
        narr_lines.append("")

    narr_out.write_text("\n".join(narr_lines), encoding="utf-8")

    raw_full = tmp_dir / "vo_full_unnorm.wav"
    pcm_to_wav(raw_full, b"".join(pcm_parts))

    # Speed murni Eps 1: tanpa atempo, hanya voice-presence EQ + -14 LUFS normalize
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-loglevel",
            "error",
            "-i",
            str(raw_full),
            "-af",
            "highpass=f=85,equalizer=f=220:width_type=o:width=1.2:g=1.5,equalizer=f=3200:width_type=o:width=1.4:g=1.8,loudnorm=I=-14:TP=-1.5:LRA=6",
            "-ar",
            str(SR),
            "-ac",
            "1",
            str(master_wav),
        ],
        check=True,
    )
    actual_dur = float(
        subprocess.check_output(
            [
                "ffprobe",
                "-v",
                "error",
                "-show_entries",
                "format=duration",
                "-of",
                "default=noprint_wrappers=1:nokey=1",
                str(master_wav),
            ]
        )
        .decode()
        .strip()
    )
    scale_factor = actual_dur / max(0.1, cursor)
    for w in aligned_words:
        w["start"] = round(w["start"] * scale_factor, 3)
        w["end"] = round(w["end"] * scale_factor, 3)

    payload = {
        "voice": "Galang - Cartesia Sonic-3 EP02 (04b567df-2923-4b0c-896b-4b7df0a07e1a)",
        "model": MODEL_ID,
        "duration": round(actual_dur, 3),
        "words": aligned_words,
    }
    align_out.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nDONE EP02 VO! Duration = {actual_dur:.2f}s, {len(aligned_words)} words -> {align_out}")


if __name__ == "__main__":
    main()
