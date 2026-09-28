"""
Copy public stock artifacts from the user's local Artifacts folder into
the repo's deep-dives/ folder, naming each one to match the ticker as it
appears in data.js (e.g. SIVE.ST.md, HPS-A.TO.md, BESI.AS.md).

The artifact files use mixed naming conventions:
  SIVE.ST_SiversSemiconductors_DeepDive.md       (full ticker preserved)
  AIXADE_Aixtron_DeepDive.md                     (dot stripped)
  ALRIBPA_Riber_DeepDive.md                      (Yahoo .PA suffix concat'd)
  HPSA.TO_HammondPower_DeepDive.md               (dash stripped from HPS-A.TO)
  BESI_BESemiconductor_DeepDive.md               (.AS exchange suffix dropped)

Strategy: for each ticker in data.js, generate candidate filename prefixes
and find the first matching artifact. Falls back to alphanum-equal match
to catch HPSA.TO ↔ HPS-A.TO style mismatches.

PDFs are public for all matching portfolio stocks (owner request, 2026-09-28).
Prefer PDFs whenever present; Markdown-only publication retains the original
AAOI/Sivers/China allowlist. Never copy frameworks or unrelated PDFs.

Run from the repo root:
    python scripts/sync_deep_dives.py
"""

import json
import hashlib
import re
import shutil
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
ARTIFACTS = REPO.parent / "Artifacts"
DEEP_DIVES = REPO / "deep-dives"

ALPHANUM = re.compile(r"[^A-Z0-9]")


def alphanum(s):
    return ALPHANUM.sub("", s.upper())


def candidate_prefixes(ticker):
    """Yield possible filename-prefix candidates for a given xlsx ticker."""
    seen = set()

    def add(c):
        if c and c not in seen:
            seen.add(c)
            yield c

    # 1. Exact ticker
    yield from add(ticker)
    # 2. Strip dots and dashes (HPS-A.TO -> HPSATO, AIXA.DE -> AIXADE)
    yield from add(ticker.replace(".", "").replace("-", ""))
    # 3. Just the base before first dot (BESI.AS -> BESI, EOS.AX -> EOS)
    if "." in ticker:
        yield from add(ticker.split(".", 1)[0])
    # 4. Just the base before first dash (HPS-A.TO -> HPS)
    if "-" in ticker:
        yield from add(ticker.split("-", 1)[0])
    # 5. Suffix synonyms — Yahoo and the analyst's filenames sometimes
    #    disagree on Mainland-China exchange codes. Yahoo uses .SZ and
    #    .SS (compact), but artifacts often write SZSE / SSE (full).
    #    Mirror both directions so either filename style matches.
    if "." in ticker:
        base, suffix = ticker.split(".", 1)
        suffix_synonyms = {
            "SZ": ["SZSE"],     # Shenzhen short -> full
            "SZSE": ["SZ"],     # Shenzhen full -> short
            "SS": ["SSE", "SH"],
            "SSE": ["SS", "SH"],
            "SH": ["SS", "SSE"],
            "TW": ["TWO"],
            "TWO": ["TW"],
        }
        for alt in suffix_synonyms.get(suffix.upper(), []):
            yield from add(f"{base}.{alt}")
            yield from add(f"{base}{alt}")     # dot-stripped form too
    # 6. Yahoo-concat form for xlsx tickers that drop the exchange suffix
    #    (ALRIB -> ALRIBPA on Paris Euronext, NKT -> NKTCO on Copenhagen)
    if "." not in ticker and "-" not in ticker:
        for suffix in ("PA", "CO", "AS", "OL", "AX", "KS", "L", "DE", "TO"):
            yield from add(ticker + suffix)


def load_artifacts():
    if not ARTIFACTS.exists():
        print(f"Artifacts folder not found at {ARTIFACTS}", file=sys.stderr)
        sys.exit(1)
    return {f.name: f for f in ARTIFACTS.iterdir() if f.is_file()
            and (f.suffix.lower() == ".pdf" or f.name.endswith("_DeepDive.md"))}


# Markdown-only allowlist. Stock PDFs are public for all matching tickers.
# Chinese exchanges (.SZ, .SH, .SS,
# .SSE, .SZSE, .HK) are matched by suffix; explicit names cover non-Chinese.
DEEP_DIVE_ALLOW_SUFFIXES = (".SZ", ".SH", ".SS", ".SSE", ".SZSE", ".HK")
DEEP_DIVE_ALLOW_EXPLICIT = {"AAOI", "SIVE.ST"}


def _is_allowed(ticker):
    if ticker in DEEP_DIVE_ALLOW_EXPLICIT:
        return True
    return any(ticker.upper().endswith(s) for s in DEEP_DIVE_ALLOW_SUFFIXES)


def load_tickers():
    raw = (REPO / "data.js").read_text(encoding="utf-8")
    m = re.match(r"^\s*window\.PORTFOLIO_DATA\s*=\s*", raw)
    if not m:
        print("data.js missing prefix", file=sys.stderr)
        sys.exit(1)
    body = raw[m.end():].rstrip()
    if body.endswith(";"):
        body = body[:-1].rstrip()
    data = json.loads(body)
    out = []
    for row in data.get("en", []):
        t = (row.get("Ticker") or "").strip()
        if not t or "PRE-IPO" in t:
            continue
        out.append(t)
    return out


def find_match(ticker, artifacts):
    """Return (path, source_filename) or (None, None).

    When several artifacts match the same ticker — a filename-prefix collision,
    e.g. 1888HK_Kingboard_... vs 1888HK_KingboardLaminates_... — prefer the
    most-recently-modified file and print a WARNING. glob() order is not stable
    across filesystems, so "first match wins" would ship a non-deterministic
    (and, in practice, often stale) deep-dive. This has bitten several times
    (the Samsung stub, then stale Kingboard/PCL analyses).
    """
    ticker_an = alphanum(ticker)
    # 1. Alphanum-equal prefix match — best signal. Collect ALL candidates.
    matches = [(path, fname) for fname, path in artifacts.items()
               if alphanum(fname.split("_", 1)[0]) == ticker_an]
    # 2. Fall back to candidate-prefix matches (ALRIB -> ALRIBPA, BESI.AS -> BESI).
    if not matches:
        for cand in candidate_prefixes(ticker):
            wanted = cand + "_"
            matches = [(path, fname) for fname, path in artifacts.items()
                       if fname.startswith(wanted)]
            if matches:
                break
    if not matches:
        return None, None
    if len(matches) > 1:
        # Newest mtime wins, deterministically; surface the losers so stale
        # duplicate sources in Artifacts/ get noticed instead of silently
        # shipping the wrong analysis.
        matches.sort(key=lambda pf: (-pf[0].stat().st_mtime, pf[1].casefold()))
        losers = ", ".join(fn for _, fn in matches[1:])
        print(f"  WARNING: {ticker}: {len(matches)} colliding artifacts - "
              f"using newest '{matches[0][1]}' (ignored: {losers})")
    return matches[0]


def select_artifact(ticker, artifacts):
    """Prefer stock PDFs without broadening Markdown-only publication."""
    pdfs = {name: path for name, path in artifacts.items() if path.suffix.lower() == ".pdf"}
    match = find_match(ticker, pdfs)
    if match[0] is not None:
        return match
    if _is_allowed(ticker):
        markdown = {name: path for name, path in artifacts.items() if path.suffix.lower() == ".md"}
        return find_match(ticker, markdown)
    return None, None


def main():
    # Force UTF-8 stdout so the renamed-from arrow doesn't crash Windows consoles.
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

    DEEP_DIVES.mkdir(exist_ok=True)
    artifacts = load_artifacts()
    tickers = load_tickers()
    print(f"Scanning {len(artifacts)} artifact files for {len(tickers)} tickers...\n")

    copied, missing, manifest = [], [], {}
    for ticker in tickers:
        path, src_name = select_artifact(ticker, artifacts)
        if path is None:
            if _is_allowed(ticker):
                missing.append(ticker)
            continue
        if not re.fullmatch(r"[A-Za-z0-9.^=-]+", ticker):
            raise ValueError(f"Unsafe artifact ticker: {ticker!r}")
        content = path.read_bytes()
        extension = path.suffix.lower()
        if extension == ".pdf" and not content.startswith(b"%PDF-"):
            raise ValueError(f"Invalid PDF artifact: {src_name}")
        dst = DEEP_DIVES / f"{ticker}{extension}"
        shutil.copy2(path, dst)
        copied.append((ticker + extension, src_name))
        manifest[ticker] = {"format": extension[1:], "version": hashlib.sha256(content).hexdigest()[:16]}

    print(f"Copied {len(copied)} deep-dives to {DEEP_DIVES.relative_to(REPO)}/:")
    for filename, src in copied:
        print(f"  {filename}   <- {src}")
    if missing:
        print(f"\nNo artifact found for {len(missing)} tickers:")
        for t in missing:
            print(f"  {t}")

    # Write manifest of available deep-dives. The frontend reads this to
    # decide which ticker symbols get clickable styling and which render
    # as plain text (implicit signal that no deep-dive exists yet).
    manifest = dict(sorted(manifest.items()))
    manifest_path = DEEP_DIVES / "index.json"
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"\nWrote manifest with {len(manifest)} tickers: {manifest_path.relative_to(REPO)}")
    print(f"Public formats: {sum(v['format'] == 'pdf' for v in manifest.values())} PDFs, "
          f"{sum(v['format'] == 'md' for v in manifest.values())} Markdown files")


if __name__ == "__main__":
    main()
