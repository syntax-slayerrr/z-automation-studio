"""Audio-first Episode 01 v5 VO builder using Cartesia sonic-3 (Galang).

Upgrades over v4:
- Synthesizes beat-by-beat (line-by-line) WITHOUT English beta `emotion` tags
  so Indonesian documentary inflection follows punctuation naturally.
- Varies cadence (`speed` 0.95..1.09) + tight inter-line pauses for genuine
  investigative storytelling punch ("Motionformat" pacing).
- Remaps multi-word numbers and hyphenated words 1-to-1 onto script tokens.
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

NUM_SPOKEN: dict[str, str] = {
    "1961": "seribu sembilan ratus enam puluh satu",
    "1919": "seribu sembilan ratus sembilan belas",
    "1926": "seribu sembilan ratus dua puluh enam",
    "1950": "seribu sembilan ratus lima puluh",
    "1958": "seribu sembilan ratus lima puluh delapan",
    "1960": "seribu sembilan ratus enam puluh",
    "42": "empat puluh dua",
    "Mu'allimin": "Mualimin",
}

# Scene -> list of beat specs: (text_with_cues, speed, pause_after_s)
SCENES_DEF: list[dict] = [
    {
        "id": "S0",
        "beats": [
            ("[[s0_hook]]1961.", 0.95, 0.24),
            ("[[s0_born]]Tahun ketika Ikatan Pelajar Muhammadiyah resmi lahir di [[s0_solo]]Surakarta.", 1.07, 0.22),
            ("[[s0_slash]]Tapi, tunggu dulu.", 0.97, 0.22),
            ("[[s0_start]]Benarkah semuanya baru dimulai tahun itu?", 1.05, 0.20),
            ("[[s0_twist]]Nyatanya, benihnya sudah ditanam [[s0_42y]]42 tahun [[s0_older]]lebih tua!", 1.01, 0.34),
        ],
    },
    {
        "id": "S1",
        "beats": [
            ("[[s1_yr]]Mundur ke 1919.", 1.07, 0.20),
            ("[[s1_door]]Di Madrasah Mu'allimin Muhammadiyah [[s1_jogja]]Yogyakarta,", 1.06, 0.16),
            ("[[s1_siswo]]lahirlah perkumpulan pelajar bernama [[s1_name]]Siswo Projo.", 1.02, 0.22),
            ("[[s1_seed]]Memang belum berskala nasional. Tapi di ruang kelas itulah, [[s1_ink]]api pertamanya [[s1_note]]menyala.", 1.03, 0.30),
        ],
    },
    {
        "id": "S2",
        "beats": [
            ("[[s2_gap]]Tujuh tahun berlalu, [[s2_wave]]bara itu tidak ikut padam.", 1.07, 0.18),
            ("[[s2_1926]]Pada 1926, muncul [[s2_gkpm]]Gabungan Keluarga Pelajar Muhammadiyah", 1.05, 0.14),
            ("[[s2_mlg]]di Malang, dan di [[s2_slo]]Surakarta.", 1.02, 0.22),
            ("[[s2_diff]]Beda nama, beda pula bentuknya dari Siswo Projo. Namun kebutuhan akan [[s2_need]]rumah pelajar, [[s2_grow]]makin nyata.", 1.05, 0.30),
        ],
    },
    {
        "id": "S3",
        "beats": [
            ("[[s3_jump]]Lalu, kita lompat jauh ke tahun 1950.", 1.08, 0.18),
            ("[[s3_fly]]Bukan lagi di Jawa! Kali ini menyeberang lautan menuju [[s3_wajo]]Wajo, Sulawesi Selatan!", 1.06, 0.22),
            ("[[s3_name]]Di sana, nama Ikatan Pelajar Muhammadiyah bahkan [[s3_born]]sudah muncul di tingkat daerah!", 1.03, 0.24),
            ("[[s3_but]]Sayangnya, [[s3_split]]perbedaan pandangan dan [[s3_crack]]dinamika internal membuat ikhtiar itu [[s3_stall]]belum berdiri kokoh sebagai organisasi nasional.", 1.02, 0.34),
        ],
    },
    {
        "id": "S4",
        "beats": [
            ("[[s4_wait]]Coba kita hitung bersama.", 0.97, 0.22),
            ("[[s4_all]]Sudah ada di Yogyakarta, Malang, Surakarta, hingga menembus [[s4_sulsel]]Sulawesi Selatan.", 1.05, 0.20),
            ("[[s4_why]]Puluhan tahun berjalan! Mengapa organisasi sebesar ini [[s4_one]]belum juga punya satu wadah nasional?", 1.02, 0.24),
            ("[[s4_who]]Dan siapa yang akhirnya [[s4_hold]]berani menyatukannya?", 0.97, 0.32),
        ],
    },
    {
        "id": "S5",
        "beats": [
            ("[[s5_1958]]Titik terangnya baru terlihat pada 1958, di kota pegunungan [[s5_garut]]Garut, Jawa Barat.", 1.06, 0.22),
            ("[[s5_conf]]Dalam Konferensi [[s5_pm]]Pemuda Muhammadiyah,", 1.03, 0.16),
            ("[[s5_idea]]gagasan wadah pelajar tidak lagi sekadar wacana. Melainkan mulai [[s5_plan]]dirumuskan serius, dan [[s5_sys]]sistematis.", 1.03, 0.32),
        ],
    },
    {
        "id": "S6",
        "beats": [
            ("[[s6_notend]]Namun, Garut bukanlah garis akhir.", 0.98, 0.24),
            ("[[s6_twoyr]]Dua tahun kemudian, pertemuan penting di [[s6_jogja]]Yogyakarta", 1.04, 0.16),
            ("[[s6_next]]akan membawa sejarah ini menuju [[s6_ch2]]babak berikutnya.", 1.01, 0.45),
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
        out: list[str] = []
        for sub in core.split("-"):
            if sub:
                out.extend(NUM_SPOKEN.get(sub, sub).split())
        return out
    return [core]


def clean_display_and_expand(line_text: str, line_idx: int) -> tuple[list[dict], str]:
    tokens: list[dict] = []
    spoken_parts: list[str] = []
    spoken_idx = 0
    for raw in line_text.split():
        m = re.match(r"^(?:\[\[([^\]]+)\]\])?(.*)$", raw)
        assert m
        cue, disp = m.group(1), m.group(2)
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


def cartesia_sse(text: str, speed: float) -> tuple[bytes, list[dict]]:
    payload = {
        "model_id": MODEL_ID,
        "transcript": text,
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
    return b"".join(chunks), words


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
    max_internal_gap: float = 0.20,
    clamped_gap: float = 0.11,
) -> tuple[bytes, list[tuple[float, float]]]:
    samples = array.array("h")
    samples.frombytes(pcm)
    total_dur = len(samples) / SR
    if not spans:
        return pcm, spans

    lead_cut = max(0.0, spans[0][0] - 0.025)
    tail_end = min(total_dur, spans[-1][1] + 0.04)

    kept: list[tuple[float, float]] = []
    cur_start = lead_cut
    for idx in range(len(spans) - 1):
        end_cur = spans[idx][1]
        start_nxt = spans[idx + 1][0]
        if start_nxt - end_cur > max_internal_gap:
            kept.append((cur_start, end_cur + clamped_gap * 0.5))
            cur_start = start_nxt - clamped_gap * 0.5
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
        fade_len = min(int(0.004 * SR), len(seg) // 4)
        for fi in range(fade_len):
            g = fi / max(1, fade_len)
            seg[fi] = int(seg[fi] * g)
            seg[-1 - fi] = int(seg[-1 - fi] * g)
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
    tmp_dir = PROJECT / "out/ep01/voice_v5_tmp"
    tmp_dir.mkdir(parents=True, exist_ok=True)
    master_wav = PROJECT / "public/audio/ep01/ep01_vo_galang.wav"
    master_wav.parent.mkdir(parents=True, exist_ok=True)
    align_out = PROJECT / "src/episodes/ep01/alignment.json"
    narr_out = PROJECT / "src/episodes/ep01/production/narration_master_v5.txt"

    pcm_parts: list[bytes] = []
    aligned_words: list[dict] = []
    narr_lines: list[str] = ["# THE IPM CHRONICLES — EP01 v5 NARRATION MASTER", ""]
    cursor = 0.0

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

    # Subtle voice-presence EQ (warm body + gentle clarity) + -14 LUFS normalize
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

    payload = {
        "voice": "Galang - Cartesia Sonic-3 Beat-Dyno (04b567df-2923-4b0c-896b-4b7df0a07e1a)",
        "model": MODEL_ID,
        "duration": round(actual_dur, 3),
        "words": aligned_words,
    }
    align_out.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nDONE v5 VO! Duration = {actual_dur:.2f}s, {len(aligned_words)} words -> {align_out}")


if __name__ == "__main__":
    main()
