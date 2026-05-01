"""
Recalculate Entry / Total / Upside for every position in data.js based on
the latest Current Price (set by fetch_yahoo.py + apply_quotes.py) and the
Base score + Ceiling Target range (set by the human analyst in the xlsx).

Scoring framework
-----------------
Both Base and Entry live on a 0-100 scale. Total is a fixed weighted average:

    Upside Ratio = (CeilingLow + CeilingHigh) / 2 / CurrentPrice
    Entry        = lookup(Upside Ratio)        # 0-100
    Total        = round(0.6 * Base + 0.4 * Entry)
    Bucket       = HC (>=75) / WL (>=65) / FAIL (<65)

This matches the Portfolio Live Scoring Agent prompt v1.0 (which expressed
the same weighting as "out of 60 + out of 40 = sum"). The lookup table is
the prompt's 0-40 ladder rescaled by 2.5 to land on the 0-100 scale the
xlsx and data.js already use.

What this script does NOT touch:
  - Base (set by analyst, never changes with price)
  - Ceiling Target (set by analyst)
  - Rating (carries rich free-form analyst notes, e.g. "HC #2 (WLBI ...)").
    Bucket crossings are surfaced as alerts in the workflow log instead.
  - Anything else in the row.

What it DOES write per row, when computable:
  - Entry, Total, Upside.

Rows where Current Price or Ceiling Target can't be parsed (PRE-IPO, "TBD
at IPO", market-cap ceilings like "$20-50B") are left untouched. This keeps
existing manual values intact for unrankable positions.

Idempotent: running it twice in a row is a no-op when prices haven't moved.
"""

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_JS = ROOT / "data.js"

# Entry-score lookup on a 0-100 scale, ordered high-to-low. First match wins.
# Values mirror the prompt's 0-40 ladder × 2.5 (e.g. 35/40 -> 88/100).
ENTRY_THRESHOLDS = [
    (10.0, 100),
    (8.0,   95),
    (6.0,   88),
    (5.0,   80),
    (4.0,   75),
    (3.5,   70),
    (3.0,   65),
    (2.5,   60),
    (2.0,   50),
    (1.8,   45),
    (1.5,   38),
    (1.3,   30),
    (1.1,   20),
    (1.0,   13),
]

CURRENCY_CODE_RE = re.compile(r"\b[A-Z]{2,4}\b")
CURRENCY_SYMBOL_RE = re.compile(r"[$£€¥₩₪₹]")
# Anything containing one of these tokens is not a numeric range we can score.
NON_NUMERIC_MARKERS = (
    "TBD", "PRE-IPO", "IPO", "TBA", "N/A", "NA",
    # Range strings ending in B/M (billions/millions) are usually market-cap
    # ceilings (e.g., "$20-50B") — skip; only use price ceilings.
)


def _strip_currency(s: str) -> str:
    s = CURRENCY_CODE_RE.sub("", s)
    s = CURRENCY_SYMBOL_RE.sub("", s)
    return s.strip()


def parse_price(value):
    """Parse a Current Price cell to a float in its native currency, or None."""
    if value is None:
        return None
    s = str(value).strip()
    if not s:
        return None
    if any(m in s.upper() for m in NON_NUMERIC_MARKERS):
        return None
    s = _strip_currency(s)
    s = s.replace(",", "").replace(" ", "")
    try:
        n = float(s)
    except ValueError:
        return None
    return n if n > 0 else None


def parse_range(value):
    """Parse a Ceiling Target cell to (low, high) floats, or (None, None).

    Accepts e.g. "$280-$550", "SEK 60-300", "KRW 2,500,000-3,800,000".
    Rejects market-cap ceilings ($20-50B), pre-IPO placeholders, and any
    string with letters after the numbers (likely a unit suffix we don't
    want to interpret as a price).
    """
    if value is None:
        return None, None
    s = str(value).strip()
    if not s:
        return None, None
    if any(m in s.upper() for m in NON_NUMERIC_MARKERS):
        return None, None
    cleaned = _strip_currency(s)
    cleaned = re.sub(r"[~]", "", cleaned).strip()
    # Reject if there's a stray letter still hanging around (e.g., "20-50B"
    # becomes "20-50B" after stripping; presence of B/M is a signal).
    if re.search(r"[A-Za-z]", cleaned):
        return None, None
    m = re.match(r"^\s*([\d,]+(?:\.\d+)?)\s*[-–]\s*([\d,]+(?:\.\d+)?)\s*$", cleaned)
    if not m:
        return None, None
    try:
        low = float(m.group(1).replace(",", ""))
        high = float(m.group(2).replace(",", ""))
    except ValueError:
        return None, None
    if low <= 0 or high <= 0 or high < low:
        return None, None
    return low, high


def parse_int(value):
    """Coerce a Base cell to int, or None."""
    if value is None:
        return None
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return int(value)
    s = str(value).strip()
    if not s:
        return None
    try:
        return int(float(s))
    except ValueError:
        return None


def entry_score(ratio: float) -> int:
    """Map an Upside Ratio to a 0-100 Entry score using the framework's ladder."""
    if ratio is None or ratio <= 0:
        return 0
    for threshold, score in ENTRY_THRESHOLDS:
        if ratio >= threshold:
            return score
    # Below 1.0x (price near or above ceiling): shrink linearly so a 0.5x
    # ratio still produces a small Entry rather than dropping straight to 0.
    return max(0, int(ratio * 10))


def total_score(base: int, entry: int) -> int:
    """0.6 * Base + 0.4 * Entry, rounded. Both inputs on 0-100 scale."""
    return int(round(0.6 * base + 0.4 * entry))


def bucket_for(total: int) -> str:
    """HC / WL / FAIL bucket for alert purposes. Not written back to data.js."""
    if total >= 75:
        return "HC"
    if total >= 65:
        return "WL"
    return "FAIL"


def upside_display(low: float, high: float, price: float) -> str:
    return f"{low/price:.1f}x-{high/price:.1f}x"


def score_row(row):
    """Return a summary dict if the row was scored, or None if skipped.
    Mutates `row` in-place when scoring succeeds.
    """
    base = parse_int(row.get("Base"))
    if base is None:
        return None
    price = parse_price(row.get("Current Price"))
    low, high = parse_range(row.get("Ceiling Target"))
    if price is None or low is None or high is None:
        return None

    midpoint = (low + high) / 2
    ratio = midpoint / price
    entry = entry_score(ratio)
    total = total_score(base, entry)
    upside = upside_display(low, high, price)

    old_total = row.get("Total") if isinstance(row.get("Total"), (int, float)) else None
    old_bucket = bucket_for(int(old_total)) if isinstance(old_total, (int, float)) else None
    new_bucket = bucket_for(total)

    # Note: we deliberately do NOT write Rating — it carries free-form analyst
    # text and bucket crossings are reported via alerts instead.
    row["Entry"] = entry
    row["Total"] = total
    row["Upside"] = upside

    return {
        "ticker": str(row.get("Ticker") or ""),
        "price": price,
        "ratio": ratio,
        "old_total": old_total,
        "new_total": total,
        "old_bucket": old_bucket,
        "new_bucket": new_bucket,
    }


def alerts_for(summary):
    """Bucket-crossing alerts based on Total deltas, plus ceiling-breach signals.
    Emojis are used per the prompt; main() configures stdout to UTF-8 so the
    log stays readable on Windows + Linux runners."""
    out = []
    t = summary["ticker"]
    nt = summary["new_total"]
    ot = summary["old_total"]
    nb = summary["new_bucket"]
    ob = summary["old_bucket"]
    ratio = summary["ratio"]

    # Bucket transitions
    if ob is not None and ob != nb:
        if ob != "HC" and nb == "HC":
            out.append(f"🟢 {t} UPGRADED TO HC — Total {nt} (was {ot})")
        elif ob == "HC" and nb != "HC":
            out.append(f"🟠 {t} DOWNGRADED FROM HC — Total {nt} (was {ot})")
        if ob == "FAIL" and nb == "WL":
            out.append(f"🟡 {t} UPGRADED TO WL — Total {nt} (was {ot})")
        elif ob == "WL" and nb == "FAIL":
            out.append(f"🔴 {t} DOWNGRADED TO FAIL — Total {nt} (was {ot})")

    # Ceiling-breach signals (independent of bucket changes)
    if ratio < 1.0:
        out.append(f"⚫ {t} ABOVE CEILING — Ratio {ratio:.2f}x — TRIM SIGNAL")
    elif ratio < 1.05 and nb == "HC":
        out.append(f"⚠️  {t} approaching ceiling — Ratio {ratio:.2f}x")

    return out


def load_data_js():
    raw = DATA_JS.read_text(encoding="utf-8")
    m = re.match(r"^\s*window\.PORTFOLIO_DATA\s*=\s*", raw)
    if not m:
        raise RuntimeError("data.js missing the `window.PORTFOLIO_DATA = ` prefix")
    prefix = m.group(0)
    body = raw[m.end():].rstrip()
    if body.endswith(";"):
        body = body[:-1].rstrip()
    return prefix, json.loads(body)


def save_data_js(prefix, data):
    DATA_JS.write_text(
        prefix + json.dumps(data, ensure_ascii=False, indent=4) + ";",
        encoding="utf-8",
    )


def main():
    # Force UTF-8 stdout so emoji-bearing alert strings don't crash Windows
    # consoles (cp1252). Linux runners on GitHub Actions are already UTF-8.
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

    prefix, data = load_data_js()
    if "en" not in data:
        print("data.js has no 'en' block", file=sys.stderr)
        sys.exit(1)

    summaries = []
    skipped = []
    for i, row in enumerate(data["en"]):
        s = score_row(row)
        if s is None:
            skipped.append(str(row.get("Ticker") or f"#{i}"))
            continue
        summaries.append(s)
        # Mirror computed fields into the other languages so the rendered
        # table stays consistent regardless of the current language.
        # Skip non-list top-level keys (e.g., __lastRefresh metadata).
        for lang, lang_data in data.items():
            if lang == "en" or not isinstance(lang_data, list) or i >= len(lang_data):
                continue
            lang_data[i]["Entry"] = row["Entry"]
            lang_data[i]["Total"] = row["Total"]
            lang_data[i]["Upside"] = row["Upside"]

    save_data_js(prefix, data)

    print(f"Scored {len(summaries)} positions, skipped {len(skipped)}.")
    if skipped:
        head = ", ".join(skipped[:8])
        more = "" if len(skipped) <= 8 else f" (+{len(skipped) - 8} more)"
        print(f"  skipped (no parseable price/ceiling): {head}{more}")

    # Bucket distribution (computed; not written to data.js).
    bucket_counts = {"HC": 0, "WL": 0, "FAIL": 0}
    all_alerts = []
    for s in summaries:
        bucket_counts[s["new_bucket"]] = bucket_counts.get(s["new_bucket"], 0) + 1
        all_alerts.extend(alerts_for(s))

    print(
        f"\nBucket distribution: HC={bucket_counts['HC']}  "
        f"WL={bucket_counts['WL']}  FAIL={bucket_counts['FAIL']}"
    )

    if all_alerts:
        print(f"\nALERTS ({len(all_alerts)}):")
        for a in all_alerts:
            print(f"  {a}")
    else:
        print("\nNo alerts this run.")


if __name__ == "__main__":
    main()
