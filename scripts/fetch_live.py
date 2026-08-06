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
import concurrent.futures
import datetime as dt
import json
import os
import re
import sys
import time
from pathlib import Path

# --- Runtime guards (added after the 2026-08-06 stall) -------------------
# Yahoo throttles datacenter IPs far harder than home connections: the same
# fetch that takes ~50 s locally intermittently hung for 15 min on GitHub's
# runners, blowing the job timeout and leaving live.json stale for over an
# hour. yfinance retries internally with no ceiling, so a single throttled
# ticker could block the whole sequential loop.
#
# Three guards, in order of importance:
#   1. DEADLINE  — hard wall-clock budget for the whole fetch phase. Whatever
#      has arrived when it expires gets published; stragglers are dropped.
#      Bounds the bad case at ~3 min instead of an open-ended hang.
#   2. WORKERS   — bounded parallelism. Keep this modest: too many concurrent
#      requests from one IP is exactly what provokes the throttling.
#   3. MIN_RATIO — floor on how much of the book must be present before we
#      overwrite live.json. A near-empty payload with a fresh timestamp is
#      WORSE than a stale one: the frontend would patch a handful of tickers,
#      leave the rest on xlsx values, and the freshness pill would still read
#      green. Below the floor we exit non-zero and write nothing, so the
#      previous good live.json survives on the branch.
DEFAULT_DEADLINE_SECONDS = 180
DEFAULT_WORKERS = 8
DEFAULT_MIN_SUCCESS_RATIO = 0.5

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


def fetch_all(yf, tickers, workers, deadline_seconds):
    """Fetch every ticker's quote in parallel under a hard wall-clock budget.

    Returns (quotes, failed, timed_out) where quotes maps ticker -> (price,
    currency, change_pct). Tickers still in flight when the deadline expires
    land in `timed_out` and are simply absent from the result — the frontend
    keeps whatever data.js held for them.

    Threads that are wedged inside yfinance are abandoned rather than joined;
    main() calls os._exit so a hung worker can't keep the process alive at
    interpreter shutdown (ThreadPoolExecutor threads are non-daemon, and the
    default atexit join would reintroduce exactly the hang we're fixing).
    """
    quotes, failed, timed_out = {}, [], []
    started = time.monotonic()
    pool = concurrent.futures.ThreadPoolExecutor(max_workers=workers)
    futures = {pool.submit(fetch_one, yf, t): t for t in tickers}
    try:
        remaining = max(1.0, deadline_seconds - (time.monotonic() - started))
        for fut in concurrent.futures.as_completed(futures, timeout=remaining):
            ticker = futures[fut]
            try:
                price, currency, change_pct = fut.result()
            except Exception:
                price = None
            if price is None:
                failed.append(ticker)
            else:
                quotes[ticker] = (price, currency, change_pct)
    except concurrent.futures.TimeoutError:
        timed_out = [t for f, t in futures.items() if not f.done()]
        print(
            f"DEADLINE: {deadline_seconds}s budget hit with {len(timed_out)} "
            f"ticker(s) still in flight — publishing partial results. "
            f"Stragglers: {', '.join(timed_out[:10])}"
            + ("" if len(timed_out) <= 10 else f" +{len(timed_out) - 10} more"),
            file=sys.stderr,
        )
    finally:
        # Drop queued work immediately; do NOT wait on in-flight threads.
        pool.shutdown(wait=False, cancel_futures=True)
    return quotes, failed, timed_out


def build_live_payload(data, workers=DEFAULT_WORKERS,
                       deadline_seconds=DEFAULT_DEADLINE_SECONDS):
    """Walk every English-language row, fetch its live price, compute its
    Entry/Total/Upside, and return the full live.json payload.

    Network I/O happens up front in parallel (fetch_all); scoring below stays
    sequential and order-deterministic, exactly as before.
    """
    try:
        import yfinance as yf
    except ImportError as e:
        print(f"yfinance import failed: {e}", file=sys.stderr)
        sys.exit(2)

    rows = data.get("en") or []
    out_tickers = {}
    bucket_counts = {"EXTREME": 0, "HC": 0, "WL": 0, "FAIL": 0}
    no_score = []

    wanted = []
    for row in rows:
        ticker = (row.get("Ticker") or "").strip()
        if not ticker:
            continue
        if any(s in ticker for s in SKIP_TICKER_SUBSTRINGS):
            continue
        wanted.append(ticker)

    t0 = time.monotonic()
    quotes, failures, timed_out = fetch_all(yf, wanted, workers, deadline_seconds)
    fetch_secs = time.monotonic() - t0

    for row in rows:
        ticker = (row.get("Ticker") or "").strip()
        if ticker not in quotes:
            continue
        price, currency, change_pct = quotes[ticker]

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
    # Only present when the run was cut short — lets a human (or a future
    # debugging session) tell "Yahoo was slow" from "the book shrank".
    if timed_out:
        payload["partial"] = True
        payload["expected_count"] = len(wanted)
    stats = {
        "fetched": len(out_tickers),
        "expected": len(wanted),
        "scored": sum(bucket_counts.values()),
        "no_score": len(no_score),
        "failures": failures,
        "timed_out": timed_out,
        "fetch_secs": fetch_secs,
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
    ap.add_argument(
        "--workers", type=int, default=DEFAULT_WORKERS,
        help=f"Parallel fetch threads (default: {DEFAULT_WORKERS}). Keep modest — "
             "high concurrency from one IP provokes Yahoo throttling.",
    )
    ap.add_argument(
        "--deadline-seconds", type=int, default=DEFAULT_DEADLINE_SECONDS,
        help=f"Hard budget for the fetch phase (default: {DEFAULT_DEADLINE_SECONDS}). "
             "Whatever has arrived by then is published.",
    )
    ap.add_argument(
        "--min-success-ratio", type=float, default=DEFAULT_MIN_SUCCESS_RATIO,
        help=f"Refuse to write live.json if fewer than this fraction of tickers "
             f"were fetched (default: {DEFAULT_MIN_SUCCESS_RATIO}). Protects the "
             "existing good file from being replaced by a near-empty one.",
    )
    args = ap.parse_args()

    # UTF-8 stdout so non-ASCII tickers / currency symbols don't crash
    # Windows shells. Linux runners on GHA are already UTF-8.
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

    data = load_data_js()
    payload, stats = build_live_payload(
        data, workers=args.workers, deadline_seconds=args.deadline_seconds
    )

    print(f"Fetched {stats['fetched']}/{stats['expected']} tickers in "
          f"{stats['fetch_secs']:.1f}s ({stats['scored']} scored, "
          f"{stats['no_score']} no-score, {len(stats['failures'])} fetch fails, "
          f"{len(stats['timed_out'])} timed out).")
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
        return 0

    # Safety floor: never replace a good live.json with a mostly-empty one.
    # Exiting non-zero fails the workflow step, which leaves the previous
    # (older but complete) file in place on the live-prices branch. A visible
    # failure with correct data beats a green run serving a gutted payload.
    expected = stats["expected"]
    if expected and (stats["fetched"] / expected) < args.min_success_ratio:
        print(
            f"\nABORT: only {stats['fetched']}/{expected} tickers fetched "
            f"({stats['fetched'] / expected:.0%}), below the "
            f"{args.min_success_ratio:.0%} floor. Leaving the existing "
            f"live.json untouched.",
            file=sys.stderr,
        )
        return 1

    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    # Compact JSON — file is served via CDN, every byte counts on mobile.
    out_path.write_text(
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    size_kb = out_path.stat().st_size / 1024
    print(f"\nWrote {out_path} ({size_kb:.1f} KB)"
          + (" [PARTIAL]" if payload.get("partial") else ""))
    return 0


if __name__ == "__main__":
    code = main()
    # Bypass the interpreter's atexit join on ThreadPoolExecutor threads: a
    # worker wedged inside yfinance would otherwise hold the process open
    # past the deadline we just enforced. Flush first — os._exit skips that.
    sys.stdout.flush()
    sys.stderr.flush()
    os._exit(code or 0)
