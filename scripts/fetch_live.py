"""
Generate live.json for the static-site frontend to poll.

This script is the runtime half of the "decoupled live prices" pipeline.
It runs on a GitHub Actions schedule (every ~2 minutes), pulls fresh
Yahoo Finance prices for every ticker in data.js, recomputes Entry /
Total / Upside via the v3.8.0 scoring formula, and writes a single
compact live.json file. The CI workflow then commits live.json to the
`live-prices` branch (orphan, force-pushed) — Netlify ignores that
branch, so price updates cost zero Netlify build credits.

The frontend (script.js) fetches live.json from jsdelivr:
    https://cdn.jsdelivr.net/gh/TalentedTom/1amInvesting@live-prices/live.json
and patches Price / Change % / Entry / Total / Upside cells in place on
every poll. Structural data (Ticker, Name, Base, Ceiling Target, etc.)
stays in data.js — only computed/volatile fields live in live.json.

Output schema (live.json):
{
  "ts": "2026-05-18T16:01:00Z",          // ISO-8601 UTC, when fetched
  "formula": "v3.8.0",                    // scoring framework version
  "ticker_count": 83,
  "tickers": {
    "AVGO": {
      "price": "$415.20",                 // formatted display string
      "change_pct": "+1.34%",
      "entry": 92,
      "total": 88,
      "upside": "2.1x-4.3x"
    },
    "005930.KS": {
      "price": "KRW 284,000",
      "change_pct": "-0.35%",
      "entry": 64,
      "total": 72,
      "upside": "1.5x-2.2x"
    },
    ...
  }
}

Fields are OMITTED per ticker when unavailable (e.g. PRE-IPO rows have
no price; rows whose Ceiling Target can't be parsed get no entry/total/
upside). The frontend handles missing fields gracefully — it just keeps
the data.js value in place.

Usage:
    python scripts/fetch_live.py                       # writes ./live.json
    python scripts/fetch_live.py --output PATH         # custom output path
    python scripts/fetch_live.py --dry-run             # don't write, just print stats
"""

import argparse
import datetime as dt
import json
import os
import re
import sys
from pathlib import Path

# Reuse the existing fetch and scoring logic — no code duplication.
SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))
from fetch_yahoo import yahoo_candidates, is_sane_price, SKIP_TICKER_SUBSTRINGS  # noqa: E402
from score import (  # noqa: E402
    parse_range,
    parse_int,
    entry_score,
    total_score,
    upside_display,
    ev_upside,
    bucket_for,
    target_cell,
)

ROOT = SCRIPT_DIR.parent
DATA_JS = ROOT / "data.js"


def fmt_price(price, currency):
    """Format like the existing xlsx style: $83.86 for USD, 'KRW 1,128,000' for others.

    Matches apply_quotes.fmt_price exactly so the live display string
    looks identical to what the cron-patched data.js stored before.
    """
    if float(price).is_integer():
        body = f"{int(price):,}"
    else:
        body = f"{price:,.2f}"
    return f"${body}" if currency == "USD" else f"{currency} {body}"


def fmt_change_pct(pct):
    """Format a percent move with sign: +1.23% / -0.45% / 0.00%."""
    if pct is None:
        return None
    return f"{pct:+.2f}%"


def load_data_js():
    """Read data.js and return its parsed JSON content.

    Mirrors score.py's loader but only returns the parsed object (we
    don't need to write back).
    """
    raw = DATA_JS.read_text(encoding="utf-8")
    m = re.match(r"^\s*window\.PORTFOLIO_DATA\s*=\s*", raw)
    if not m:
        raise RuntimeError("data.js missing the `window.PORTFOLIO_DATA = ` prefix")
    body = raw[m.end():].rstrip()
    if body.endswith(";"):
        body = body[:-1].rstrip()
    return json.loads(body)


def fetch_one(yf, xlsx_ticker):
    """Same Yahoo-fetch logic as fetch_yahoo.fetch_one, copied here so we
    don't pay the cost of an apply_quotes round-trip. Returns
    (price, currency, change_pct) on success, or (None, None, None)."""
    for yh in yahoo_candidates(xlsx_ticker):
        try:
            tk = yf.Ticker(yh)
            fi = tk.fast_info
            price = fi.last_price
            currency = fi.currency
            if not is_sane_price(price) or not currency:
                continue
            change_pct = None
            try:
                prev = fi.previous_close
                if prev and float(prev) > 0:
                    change_pct = round(
                        (float(price) - float(prev)) / float(prev) * 100.0, 2
                    )
            except Exception:
                pass
            return float(price), str(currency), change_pct
        except Exception:
            continue
    return None, None, None


def build_live_payload(data):
    """Walk every English-language row, fetch its live price, compute its
    Entry/Total/Upside, and return the full live.json payload."""
    try:
        import yfinance as yf
    except ImportError as e:
        print(f"yfinance import failed: {e}", file=sys.stderr)
        sys.exit(2)

    rows = data.get("en") or []
    out_tickers = {}
    bucket_counts = {"EXTREME": 0, "HC": 0, "WL": 0, "FAIL": 0}
    failures = []
    no_score = []

    for row in rows:
        ticker = (row.get("Ticker") or "").strip()
        if not ticker:
            continue
        if any(s in ticker for s in SKIP_TICKER_SUBSTRINGS):
            continue

        price, currency, change_pct = fetch_one(yf, ticker)
        if price is None:
            failures.append(ticker)
            continue

        entry_payload = {
            "price": fmt_price(price, currency),
        }
        chg = fmt_change_pct(change_pct)
        if chg is not None:
            entry_payload["change_pct"] = chg

        # Score: Entry / Total / Upside. Requires Base + parseable Ceiling
        # Target. Skipped silently for PRE-IPO and unscorable rows — the
        # frontend keeps whatever data.js had for those tickers.
        base = parse_int(row.get("Base"))
        low, high = parse_range(target_cell(row))
        if base is not None and low is not None and high is not None and price > 0:
            midpoint = (low + high) / 2
            ratio = midpoint / price
            entry = entry_score(ratio, base)
            total = total_score(base, entry)
            entry_payload["entry"] = entry
            entry_payload["total"] = total
            entry_payload["upside"] = upside_display(low, high, price)
            entry_payload["ev_upside"] = ev_upside(base, high, price)
            bucket_counts[bucket_for(total)] = bucket_counts.get(bucket_for(total), 0) + 1
        else:
            no_score.append(ticker)

        out_tickers[ticker] = entry_payload

    payload = {
        # ISO-8601 UTC stamp. Use the timezone-aware API (datetime.utcnow is
        # deprecated in 3.12+); strip tzinfo for the trailing 'Z' suffix the
        # frontend expects.
        "ts": dt.datetime.now(dt.timezone.utc).replace(microsecond=0, tzinfo=None).isoformat() + "Z",
        "formula": "v3.8.0",
        "ticker_count": len(out_tickers),
        "tickers": out_tickers,
    }
    stats = {
        "fetched": len(out_tickers),
        "scored": sum(bucket_counts.values()),
        "no_score": len(no_score),
        "failures": failures,
        "buckets": bucket_counts,
    }
    return payload, stats


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument(
        "--output",
        default=str(ROOT / "live.json"),
        help="Where to write live.json (default: ./live.json at repo root)",
    )
    ap.add_argument(
        "--dry-run",
        action="store_true",
        help="Don't write any file; just print stats.",
    )
    args = ap.parse_args()

    # UTF-8 stdout so non-ASCII tickers / currency symbols don't crash
    # Windows shells. Linux runners on GHA are already UTF-8.
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

    data = load_data_js()
    payload, stats = build_live_payload(data)

    print(f"Fetched {stats['fetched']} tickers ({stats['scored']} scored, "
          f"{stats['no_score']} no-score, {len(stats['failures'])} fetch fails).")
    print(
        f"Buckets: EXTREME={stats['buckets']['EXTREME']}  "
        f"HC={stats['buckets']['HC']}  "
        f"WL={stats['buckets']['WL']}  "
        f"FAIL={stats['buckets']['FAIL']}"
    )
    if stats["failures"]:
        print(f"Fetch failures ({len(stats['failures'])}): "
              f"{', '.join(stats['failures'][:10])}"
              + ("" if len(stats['failures']) <= 10 else f" +{len(stats['failures']) - 10} more"))

    if args.dry_run:
        print("\n[dry-run] Not writing output.")
        return

    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    # Compact JSON — file is served via CDN, every byte counts on mobile.
    out_path.write_text(
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    size_kb = out_path.stat().st_size / 1024
    print(f"\nWrote {out_path} ({size_kb:.1f} KB)")


if __name__ == "__main__":
    main()
