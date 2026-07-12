"""
Recalculate Entry / Total / Upside for every position in data.js based on
the latest Current Price (set by fetch_yahoo.py + apply_quotes.py) and the
Base score + Ceiling Target range (set by the human analyst in the xlsx).

Scoring framework v3.8.0 (continuous, scale-breaking)
-----------------------------------------------------
    midpoint = (CeilingLow + CeilingHigh) / 2
    ratio    = midpoint / CurrentPrice

    Entry (0-100, can exceed 100 in scale-breaking case):
        ratio < 1.2:           Entry = 0
        1.2 <= ratio <= 2.0:   Entry = (ratio - 1.2) / 0.8 * 50      (0 -> 50)
        2.0 <  ratio <= 4.0:   Entry = 50 + (ratio - 2.0) / 2.0 * 50 (50 -> 100)
        ratio > 4.0:
            if Base >= 80:     Entry = 100 + (ratio - 4.0) * 10      (SCALE-BREAKING)
            else:              Entry = 100                            (CAPPED — cheap
                                                                       bad company can't
                                                                       compound past 100)

    Total = round(0.6 * Base + 0.4 * Entry)

    Bucket:
        Total >  100:  EXTREME (extreme asymmetry — overweight)
        75 <= Total:   HC      (high conviction — buy, hold)
        50 <= Total:   WL      (watchlist — monitor, buy on dip)
        Total <  50:   FAIL    (do not buy)

Scale-breaking notes:
- Total > 100 is valid and intentional — happens only when ratio > 4x AND
  Base >= 80 (analyst conviction must be high enough to "earn" the bonus).
- A cheap bad company (low Base, high ratio) caps Entry at 100 by design.

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

# Bucket thresholds (v3.8.0) — see module docstring for full framework.
BUCKET_HC = 75       # 75-100  → HC
BUCKET_WL = 50       # 50-74   → WL    (widened from old 65)
BUCKET_EXTREME = 100  # >100   → EXTREME ASYMMETRY (scale-breaking)
SCALE_BREAK_RATIO = 4.0
SCALE_BREAK_MIN_BASE = 80

# Known currency codes (enumerated rather than \b[A-Z]{2,4}\b so we don't
# accidentally strip 2-4 letter words from analyst annotations like "DC deal").
# Includes mixed-case "GBp" (British pence).
KNOWN_CURRENCIES = (
    "USD", "EUR", "GBP", "GBp", "JPY", "KRW", "CNY", "TWD", "HKD", "SEK",
    "DKK", "NOK", "CAD", "AUD", "CHF", "INR", "BRL", "NZD", "SGD", "RMB",
    "MXN", "ZAR", "PLN",
)
CURRENCY_CODE_RE = re.compile(
    r"\b(?:" + "|".join(re.escape(c) for c in KNOWN_CURRENCIES) + r")\b"
)
CURRENCY_SYMBOL_RE = re.compile(r"[$£€¥₩₪₹]")

# Word-boundary check for placeholder markers. Substring matching was
# rejecting strings containing "NA" inside other words (NASDAQ, elimination)
# and "IPO" inside ones like "deIPOsits". Word boundaries fix it.
NON_NUMERIC_MARKER_RE = re.compile(r"\b(TBD|PRE-IPO|IPO|TBA|N/A)\b", re.IGNORECASE)

# K/M suffix on numbers (e.g., "₩3.0M-5.0M" means 3,000,000-5,000,000 KRW).
# Expanded to literal numbers before range parsing so the search regex sees
# clean digits. B is intentionally NOT in this list — B suffixes after a
# range usually mean market cap (billions), which we want to reject.
SUFFIX_MULTIPLIERS = {"K": 1e3, "k": 1e3, "M": 1e6, "m": 1e6}
_KM_SUFFIX_RE = re.compile(r"([\d,]+(?:\.\d+)?)([KkMm])\b")


def _strip_currency(s: str) -> str:
    s = CURRENCY_CODE_RE.sub("", s)
    s = CURRENCY_SYMBOL_RE.sub("", s)
    # British pence "p" suffix on numbers (70p-140p) → drop the "p"
    s = re.sub(r"(\d)[pP]\b", r"\1", s)
    # 1-2 letter currency prefixes immediately preceding a digit (or $).
    # Catches "HK$143" → "143" (after $ stripped to "HK143"), "C500" → "500"
    # (Canadian), "A9.81" → "9.81" (Australian). The lookahead guards
    # against stripping descriptive 2-letter words like "DC deal".
    s = re.sub(r"\b[A-Z]{1,2}(?=[\d])", "", s)
    return s.strip()


def _expand_km_suffixes(s: str) -> str:
    """Convert "3.0M" -> "3000000", "450K" -> "450000". Leaves B alone so
    parse_range can detect and reject market-cap ceilings."""
    def expand(m):
        n = float(m.group(1).replace(",", "")) * SUFFIX_MULTIPLIERS[m.group(2)]
        return str(int(n) if n.is_integer() else n)
    return _KM_SUFFIX_RE.sub(expand, s)


def _has_placeholder(s: str) -> bool:
    return bool(NON_NUMERIC_MARKER_RE.search(s))


def parse_price(value):
    """Parse a Current Price cell to a float in its native currency, or None."""
    if value is None:
        return None
    s = str(value).strip()
    if not s:
        return None
    if _has_placeholder(s):
        return None
    s = _strip_currency(s)
    s = _expand_km_suffixes(s)
    s = s.replace(",", "").replace(" ", "")
    try:
        n = float(s)
    except ValueError:
        return None
    return n if n > 0 else None


def parse_range(value):
    """Parse a Ceiling Target cell to (low, high) floats, or (None, None).

    Tolerates trailing annotations after the numeric range so authors can
    add context inline. Rejects market-cap ceilings (range followed by a
    B/M/K suffix) and pre-IPO/TBD placeholders.

    Accepts:
      "$280-$550"
      "SEK 60-300"
      "KRW 2,500,000-3,800,000"
      "SEK 100-500 (8-vector model: CPO + Jabil LRO + ...)"
      "GBp 900-1,600 (FY2028-31)"
      "70p-140p"
      "C500-C800"
    Rejects:
      "$20-50B"                (market cap)
      "TBD at IPO"             (placeholder)
      "PRE-IPO"                (placeholder)
    """
    if value is None:
        return None, None
    s = str(value).strip()
    if not s:
        return None, None
    if _has_placeholder(s):
        return None, None
    cleaned = _strip_currency(s)
    cleaned = re.sub(r"[~]", "", cleaned).strip()
    # Expand K/M suffixes IN-PLACE first (e.g., "3.0M" -> "3000000") so the
    # search regex below sees clean digit-only numbers. B is left alone so
    # we can detect and reject market-cap ceilings (group 3 below).
    cleaned = _expand_km_suffixes(cleaned)
    # Search anywhere in the string (not anchored): tolerates trailing
    # annotations like "(FY2028-30 blend)" or "(8-vector model: ...)".
    # Third capture group catches an optional B suffix immediately after
    # the high value, signalling a market-cap ceiling we should reject.
    m = re.search(
        r"([\d,]+(?:\.\d+)?)\s*[-–]\s*([\d,]+(?:\.\d+)?)\s*([Bb]?)",
        cleaned,
    )
    if m:
        if m.group(3) in ("B", "b"):
            return None, None
        try:
            low = float(m.group(1).replace(",", ""))
            high = float(m.group(2).replace(",", ""))
        except ValueError:
            return None, None
        if low <= 0 or high <= 0 or high < low:
            return None, None
        return low, high

    # Fallback: single-value ceiling (no range). Lets analysts write
    # 'TWD 2,890' or '$446' as a point target instead of 'TWD 716-2,890'.
    # We return (n, n) so the rest of the v3.8.0 framework works unchanged
    # — midpoint = n, ratio = n / price, upside is a single multiplier.
    # Same B-suffix guard rejects market-cap strings like '$2.23B'.
    m_single = re.search(r"([\d,]+(?:\.\d+)?)\s*([Bb]?)", cleaned)
    if not m_single:
        return None, None
    if m_single.group(2) in ("B", "b"):
        return None, None
    try:
        n = float(m_single.group(1).replace(",", ""))
    except ValueError:
        return None, None
    if n <= 0:
        return None, None
    return n, n


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


def entry_score(ratio: float, base: int) -> int:
    """Map an Upside Ratio + Base to an Entry score using the v3.8.0 formula.

    Returns 0..100 normally; can exceed 100 when ratio > 4x AND base >= 80
    (scale-breaking). Result is rounded to nearest int.
    """
    if ratio is None or ratio < 1.2:
        return 0
    if ratio <= 2.0:
        # Linear 0 -> 50 across [1.2, 2.0]
        return int(round((ratio - 1.2) / 0.8 * 50))
    if ratio <= 4.0:
        # Linear 50 -> 100 across (2.0, 4.0]
        return int(round(50 + (ratio - 2.0) / 2.0 * 50))
    # ratio > 4.0
    if base is not None and base >= SCALE_BREAK_MIN_BASE:
        # Scale-breaking: every 1x past 4x adds 10 points to Entry.
        return int(round(100 + (ratio - SCALE_BREAK_RATIO) * 10))
    # Cheap bad company — Entry capped at 100.
    return 100


def total_score(base: int, entry: int) -> int:
    """0.6 * Base + 0.4 * Entry, rounded. Both inputs nominally 0-100; Entry
    can exceed 100 in the scale-breaking case, so Total can exceed 100."""
    return int(round(0.6 * base + 0.4 * entry))


def bucket_for(total) -> str:
    """EXTREME / HC / WL / FAIL bucket for alert purposes. Not written back
    to data.js (Rating column carries free-form analyst text)."""
    if not isinstance(total, (int, float)):
        return "FAIL"
    if total > BUCKET_EXTREME:
        return "EXTREME"
    if total >= BUCKET_HC:
        return "HC"
    if total >= BUCKET_WL:
        return "WL"
    return "FAIL"


def upside_display(low: float, high: float, price: float) -> str:
    # When the Ceiling Target is a single value (low == high), collapse
    # the display to one multiplier instead of '4.0x-4.0x'. Analysts who
    # use point targets see clean output; range-based targets unchanged.
    if low == high:
        return f"{low/price:.1f}x"
    return f"{low/price:.1f}x-{high/price:.1f}x"


def ev_upside(base: int, high: float, price: float) -> int:
    """Expected-value upside score = Base × (target/price) − 100.

    The headline metric (replaced 'Total'). `high` is the target price (the
    same multiplier shown in the Upside column). The 2026-07 quarterly model
    subtracts a flat 100 baseline (breakeven at Base×1x = 100) rather than the
    old `Base` term, so a name priced AT target scores Base − 100 (i.e. ~0 only
    when Base is 100). Unbounded; negative flags an avoid.

    Verified against the analyst's xlsx 'EV Upside Q3'27' column:
        SIVE  base 90, 4.03x -> 90 × 4.03 − 100 = 263
        IQE   base 77, 2.52x -> 77 × 2.52 − 100 = 94
    """
    return int(round(base * (high / price) - 100))


# Column name for the target price that drives Upside + EV Upside.
# The model went quarterly (2026-07): the ~1-year-forward target now lives in
# the 'Q3 2027' column (was 'FY2028'; before that 'Ceiling Target' / '1y EV').
# We read the newest source first and fall back through the older names so any
# xlsx vintage scores correctly. The math is identical regardless of which
# column supplies it: Upside = target/price,
# EV Upside = Base * (target/price - 1). Verified 'Q3 2027' reproduces the
# analyst's pre-computed 'Upside Q3'27' / 'EV Upside Q3'27' columns.
TARGET_COLS = ("Q3 2027", "FY2028", "1y EV", "Ceiling Target")


def target_cell(row):
    """Return the row's target-price cell, trying the current column name
    ('1y EV') then the legacy one ('Ceiling Target'). Returns '' if neither
    is present so parse_range yields (None, None) and the row is skipped."""
    for col in TARGET_COLS:
        v = row.get(col)
        if v not in (None, ""):
            return v
    return ""


def score_row(row):
    """Return a summary dict if the row was scored, or None if skipped.
    Mutates `row` in-place when scoring succeeds.
    """
    base = parse_int(row.get("Base"))
    if base is None:
        return None
    price = parse_price(row.get("Current Price"))
    low, high = parse_range(target_cell(row))
    if price is None or low is None or high is None:
        return None

    midpoint = (low + high) / 2
    ratio = midpoint / price
    entry = entry_score(ratio, base)
    total = total_score(base, entry)
    upside = upside_display(low, high, price)

    old_total = row.get("Total") if isinstance(row.get("Total"), (int, float)) else None
    old_bucket = bucket_for(int(old_total)) if isinstance(old_total, (int, float)) else None
    new_bucket = bucket_for(total)

    # Note: we deliberately do NOT write Rating — it carries free-form analyst
    # text and bucket crossings are reported via alerts instead.
    row["Entry"] = entry
    row["Total"] = total          # kept for bucket/alert logic (not displayed)
    row["Upside"] = upside
    # Respect the analyst's manually-set EV Upside when present in the xlsx.
    if not row.get("EV Upside") and row.get("EV Upside") != 0:
        row["EV Upside"] = ev_upside(base, high, price)

    return {
        "ticker": str(row.get("Ticker") or ""),
        "price": price,
        "ratio": ratio,
        "old_total": old_total,
        "new_total": total,
        "old_bucket": old_bucket,
        "new_bucket": new_bucket,
    }


_BUCKET_RANK = {"FAIL": 0, "WL": 1, "HC": 2, "EXTREME": 3}


def alerts_for(summary):
    """Bucket-crossing alerts based on Total deltas, plus ceiling-breach
    signals. Now aware of the EXTREME bucket (Total > 100, scale-breaking).
    Emojis are used per the prompt; main() configures stdout to UTF-8 so
    the log stays readable on Windows + Linux runners."""
    out = []
    t = summary["ticker"]
    nt = summary["new_total"]
    ot = summary["old_total"]
    nb = summary["new_bucket"]
    ob = summary["old_bucket"]
    ratio = summary["ratio"]

    # Bucket transitions — only fires when buckets actually differ.
    if ob is not None and ob != nb:
        old_rank = _BUCKET_RANK.get(ob, 0)
        new_rank = _BUCKET_RANK.get(nb, 0)
        if new_rank > old_rank:
            # Promotion
            if nb == "EXTREME":
                out.append(f"⚡ {t} EXTREME ASYMMETRY — Total {nt} (was {ot})")
            elif nb == "HC":
                out.append(f"🟢 {t} UPGRADED TO HC — Total {nt} (was {ot})")
            elif nb == "WL":
                out.append(f"🟡 {t} UPGRADED TO WL — Total {nt} (was {ot})")
        else:
            # Demotion
            if ob == "EXTREME":
                out.append(f"🟠 {t} EXITED EXTREME — Total {nt} (was {ot})")
            elif ob == "HC":
                out.append(f"🟠 {t} DOWNGRADED FROM HC — Total {nt} (was {ot})")
            elif ob == "WL" and nb == "FAIL":
                out.append(f"🔴 {t} DOWNGRADED TO FAIL — Total {nt} (was {ot})")

    # Ceiling-breach signals (independent of bucket changes).
    # Ratio < 1.0  → price above ceiling midpoint → trim.
    # 1.0 ≤ ratio < 1.2 → enters the zero-entry zone (Entry collapses to 0).
    if ratio < 1.0:
        out.append(f"⚫ {t} ABOVE CEILING — Ratio {ratio:.2f}x — TRIM SIGNAL")
    elif ratio < 1.2 and nb in ("HC", "EXTREME"):
        out.append(f"⚠️  {t} approaching ceiling — Ratio {ratio:.2f}x (Entry = 0 zone)")

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
            lang_data[i]["EV Upside"] = row["EV Upside"]

    save_data_js(prefix, data)

    print(f"Scored {len(summaries)} positions, skipped {len(skipped)}.")
    if skipped:
        head = ", ".join(skipped[:8])
        more = "" if len(skipped) <= 8 else f" (+{len(skipped) - 8} more)"
        print(f"  skipped (no parseable price/ceiling): {head}{more}")

    # Bucket distribution (computed; not written to data.js).
    bucket_counts = {"EXTREME": 0, "HC": 0, "WL": 0, "FAIL": 0}
    all_alerts = []
    for s in summaries:
        bucket_counts[s["new_bucket"]] = bucket_counts.get(s["new_bucket"], 0) + 1
        all_alerts.extend(alerts_for(s))

    print(
        f"\nBucket distribution: "
        f"EXTREME={bucket_counts['EXTREME']}  "
        f"HC={bucket_counts['HC']}  "
        f"WL={bucket_counts['WL']}  "
        f"FAIL={bucket_counts['FAIL']}"
    )

    if all_alerts:
        print(f"\nALERTS ({len(all_alerts)}):")
        for a in all_alerts:
            print(f"  {a}")
    else:
        print("\nNo alerts this run.")


if __name__ == "__main__":
    main()
