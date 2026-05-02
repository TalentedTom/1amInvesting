"""
Copy deep-dive markdown files from the user's local Artifacts folder into
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

Run from the repo root:
    python scripts/sync_deep_dives.py
"""

import json
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
    # 5. Yahoo-concat form for xlsx tickers that drop the exchange suffix
    #    (ALRIB -> ALRIBPA on Paris Euronext, NKT -> NKTCO on Copenhagen)
    if "." not in ticker and "-" not in ticker:
        for suffix in ("PA", "CO", "AS", "OL", "AX", "KS", "L", "DE", "TO"):
            yield from add(ticker + suffix)


def load_artifacts():
    if not ARTIFACTS.exists():
        print(f"Artifacts folder not found at {ARTIFACTS}", file=sys.stderr)
        sys.exit(1)
    return {f.name: f for f in ARTIFACTS.glob("*_DeepDive.md")}


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
    """Return (path, source_filename) or (None, None)."""
    # Try alphanum-equal match against filename prefix first — best signal.
    ticker_an = alphanum(ticker)
    for fname, path in artifacts.items():
        prefix = fname.split("_", 1)[0]
        if alphanum(prefix) == ticker_an:
            return path, fname
    # Fall back to candidate-prefix match (handles ALRIB -> ALRIBPA, BESI.AS -> BESI).
    for cand in candidate_prefixes(ticker):
        wanted = cand + "_"
        for fname, path in artifacts.items():
            if fname.startswith(wanted):
                return path, fname
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

    copied, missing = [], []
    for ticker in tickers:
        path, src_name = find_match(ticker, artifacts)
        if path is None:
            missing.append(ticker)
            continue
        dst = DEEP_DIVES / f"{ticker}.md"
        shutil.copy2(path, dst)
        copied.append((ticker, src_name))

    print(f"Copied {len(copied)} deep-dives to {DEEP_DIVES.relative_to(REPO)}/:")
    for ticker, src in copied:
        tag = "" if src.startswith(ticker + "_") else f"   <- {src}"
        print(f"  {ticker}.md{tag}")
    if missing:
        print(f"\nNo artifact found for {len(missing)} tickers:")
        for t in missing:
            print(f"  {t}")

    # Write manifest of available deep-dives. The frontend reads this to
    # decide which ticker symbols get clickable styling and which render
    # as plain text (implicit signal that no deep-dive exists yet).
    manifest = sorted(t for t, _ in copied)
    manifest_path = DEEP_DIVES / "index.json"
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"\nWrote manifest with {len(manifest)} tickers: {manifest_path.relative_to(REPO)}")


if __name__ == "__main__":
    main()
