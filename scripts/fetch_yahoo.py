"""
Pull current Yahoo Finance prices for every ticker in data.js and patch
data.js via apply_quotes.py.

Designed to run unattended from GitHub Actions (see
.github/workflows/refresh-prices.yml). Logs to stdout, exits 0 on success
even if some tickers couldn't be fetched (we'd rather ship partial updates
than block on a single broken Yahoo response). Exits non-zero only if
apply_quotes.py itself errors.

Behavior:
  - Reads tickers from data.en[].Ticker in data.js (same source the agent uses).
  - Skips any ticker containing "PRE-IPO".
  - For each ticker, tries multiple Yahoo spelling candidates (xlsx and
    Yahoo conventions disagree on .SS/.SSE, .SZ/.SZSE, .TW/.TWO, plus a
    handful of bare tickers that need exchange suffixes added on Yahoo's side).
  - Sanity-rejects prices that are zero, negative, NaN, or absurdly large.
  - Builds the same JSON shape apply_quotes.py expects and pipes it in.
  - apply_quotes.py is a no-op if no formatted prices changed, so this
    script is safe to run frequently.
"""

import json
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_JS = ROOT / "data.js"
APPLY = ROOT / "apply_quotes.py"

SKIP_TICKER_SUBSTRINGS = ("PRE-IPO",)

# Manual mappings for xlsx-side tickers that have no exchange suffix but
# need one on Yahoo. Add new entries here if a future ticker doesn't resolve.
BARE_TO_YAHOO = {
    "NKT": "NKT.CO",
    "ALRIB": "ALRIB.PA",
    "XFAB": "XFAB.PA",   # X-FAB Silicon Foundries — Euronext Paris (EUR)
}


def yahoo_candidates(xlsx_ticker: str):
    """Yield Yahoo-side spellings to try for a ticker stored in data.js."""
    yield xlsx_ticker  # most tickers match Yahoo as-is
    swaps = [
        (".SSE", ".SS"),
        (".SH", ".SS"),    # alternate Shanghai spelling -> Yahoo's .SS
        (".SZSE", ".SZ"),
        (".TWO", ".TW"),
        (".TW", ".TWO"),
    ]
    for src, dst in swaps:
        if xlsx_ticker.endswith(src):
            yield xlsx_ticker[: -len(src)] + dst
    if xlsx_ticker in BARE_TO_YAHOO:
        yield BARE_TO_YAHOO[xlsx_ticker]


def load_tickers():
    raw = DATA_JS.read_text(encoding="utf-8")
    body = re.sub(r"^\s*window\.PORTFOLIO_DATA\s*=\s*", "", raw, count=1).rstrip()
    if body.endswith(";"):
        body = body[:-1].rstrip()
    data = json.loads(body)
    out = []
    for row in data["en"]:
        t = (row.get("Ticker") or "").strip()
        if not t:
            continue
        if any(s in t for s in SKIP_TICKER_SUBSTRINGS):
            continue
        out.append(t)
    return out


def is_sane_price(p):
    try:
        n = float(p)
    except (TypeError, ValueError):
        return False
    return 0.001 < n < 1e10 and n == n  # last clause rejects NaN


def fetch_one(yf, xlsx_ticker):
    """Try each Yahoo candidate spelling; return (yahoo_ticker, price, currency,
    change_pct) on first hit, or (None, None, None, None) if all candidates
    fail. change_pct is the percent move from previous close, or None if
    Yahoo didn't expose previous_close for this ticker.

    Note: yfinance's FastInfo is an object with attribute accessors, not a dict.
    """
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
                # Some FastInfo objects don't expose previous_close; tolerate.
                pass
            return yh, float(price), str(currency), change_pct
        except Exception:
            # Wrong suffix, network blip, "possibly delisted", etc.
            continue
    return None, None, None, None


def main():
    tickers = load_tickers()
    print(f"Loaded {len(tickers)} tickers from data.js")

    try:
        import yfinance as yf  # imported here so module-loading errors are visible
    except ImportError as e:
        print(f"yfinance import failed: {e}", file=sys.stderr)
        sys.exit(2)

    quotes = []
    failures = []
    for xlsx_ticker in tickers:
        yh, price, currency, change_pct = fetch_one(yf, xlsx_ticker)
        if yh is None:
            failures.append(xlsx_ticker)
            continue
        quote = {
            "ticker": xlsx_ticker,
            "price": price,
            "currency": currency,
        }
        if change_pct is not None:
            quote["change_pct"] = change_pct
        quotes.append(quote)
        chg_str = f"  {change_pct:+.2f}%" if change_pct is not None else ""
        print(f"  ok   {xlsx_ticker:<14}  ({yh})  {currency} {price}{chg_str}")

    print(f"Fetched {len(quotes)} valid quotes; {len(failures)} failures.")
    if failures:
        print(f"  failed tickers: {failures}", file=sys.stderr)
    if not quotes:
        print("No usable quotes — skipping patch.")
        return

    payload = {
        "source": "github-actions:yfinance",
        "retrieved_at": "",
        "quotes": quotes,
    }
    proc = subprocess.run(
        [sys.executable, str(APPLY)],
        input=json.dumps(payload),
        capture_output=True,
        text=True,
        encoding="utf-8",
        cwd=str(ROOT),
    )
    sys.stdout.write(proc.stdout)
    sys.stderr.write(proc.stderr)
    if proc.returncode != 0:
        print(f"apply_quotes.py exited {proc.returncode}", file=sys.stderr)
        sys.exit(proc.returncode)


if __name__ == "__main__":
    main()
