"""
Update Current Price in data.js directly from a Yahoo-style quotes JSON.

Input JSON format (same as the Claude web extension emits):
{
    "source": "finance.yahoo.com",
    "retrieved_at": "YYYY-MM-DD",
    "quotes": [
        {"ticker": "AEHR", "price": 83.86, "currency": "USD"},
        ...
    ],
    "unavailable": [ ... ]   # optional, ignored
}

Usage:
    python apply_quotes.py --file quotes.json
    cat quotes.json | python apply_quotes.py

Notes:
- Writes Current Price for all three languages in data.js (en, zh-CN, pl).
- Skips the xlsx entirely — use this for quick intraday updates. For full data
  edits (new rows, thesis changes, etc.) still edit the xlsx and run update_data.py.
- Handles common ticker-suffix mismatches between Yahoo and the xlsx
  (.SS/.SSE, .SZ/.SZSE, .CO/, .PA/, .TW/.TWO).
"""

import argparse
import json
import os
import re
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_JS = os.path.join(SCRIPT_DIR, 'data.js')


def fmt_price(price, currency):
    """Format like the existing xlsx style: $83.86 for USD, 'KRW 1,128,000' for others."""
    if float(price).is_integer():
        body = f'{int(price):,}'
    else:
        body = f'{price:,.2f}'
    return f'${body}' if currency == 'USD' else f'{currency} {body}'


def fmt_change_pct(pct):
    """Format a percent move with sign: +1.23% / -0.45% / 0.00%."""
    if pct is None:
        return None
    return f'{pct:+.2f}%'


def ticker_candidates(yahoo_ticker):
    """Yield possible xlsx-side ticker spellings for a Yahoo ticker."""
    yield yahoo_ticker
    # Yahoo often uses shorter regional suffixes than the xlsx
    suffix_swaps = [
        ('.SS', '.SSE'),
        ('.SZ', '.SZSE'),
        ('.TWO', '.TW'),
        ('.TW', '.TWO'),
    ]
    for src, dst in suffix_swaps:
        if yahoo_ticker.endswith(src):
            yield yahoo_ticker[: -len(src)] + dst
    # Some tickers are listed without any exchange suffix in the xlsx (e.g., NKT, ALRIB)
    if '.' in yahoo_ticker:
        yield yahoo_ticker.split('.', 1)[0]


def load_data_js():
    with open(DATA_JS, 'r', encoding='utf-8') as f:
        raw = f.read()
    m = re.match(r'^\s*window\.PORTFOLIO_DATA\s*=\s*', raw)
    if not m:
        raise RuntimeError('data.js is missing the `window.PORTFOLIO_DATA = ` prefix')
    prefix = m.group(0)
    body = raw[m.end():].rstrip().rstrip(';').rstrip()
    return prefix, json.loads(body)


def save_data_js(prefix, data):
    with open(DATA_JS, 'w', encoding='utf-8') as f:
        f.write(prefix)
        json.dump(data, f, ensure_ascii=False, indent=4)
        f.write(';')


def main():
    ap = argparse.ArgumentParser(description='Patch Current Price in data.js from a quotes JSON.')
    ap.add_argument('--file', help='Path to quotes JSON. Reads stdin if omitted.')
    args = ap.parse_args()

    if args.file:
        with open(args.file, 'r', encoding='utf-8') as f:
            payload = json.load(f)
    else:
        payload = json.load(sys.stdin)

    quotes = payload.get('quotes', [])
    if not quotes:
        print('No quotes found in payload. Nothing to do.')
        return

    prefix, data = load_data_js()
    if 'en' not in data:
        raise RuntimeError("data.js has no 'en' language block")

    # Tickers are identical across languages, so build the index once off en.
    by_ticker = {}
    for i, row in enumerate(data['en']):
        t = row.get('Ticker')
        if t:
            by_ticker[str(t).strip()] = i

    updated, missing = [], []
    for q in quotes:
        yh = q.get('ticker')
        px = q.get('price')
        cur = q.get('currency', 'USD')
        change_pct = q.get('change_pct')
        if yh is None or px is None:
            continue
        idx = None
        matched = None
        for cand in ticker_candidates(yh):
            if cand in by_ticker:
                idx = by_ticker[cand]
                matched = cand
                break
        if idx is None:
            missing.append(yh)
            continue
        formatted = fmt_price(px, cur)
        formatted_chg = fmt_change_pct(change_pct)
        # Iterate only language arrays, skipping top-level metadata keys
        # like __lastRefresh that the stamper adds.
        for lang, lang_data in data.items():
            if not isinstance(lang_data, list):
                continue
            lang_data[idx]['Current Price'] = formatted
            if formatted_chg is not None:
                lang_data[idx]['Change %'] = formatted_chg
        updated.append((yh, matched, formatted, formatted_chg))

    save_data_js(prefix, data)

    print(f'Updated {len(updated)} / {len(quotes)} tickers in data.js.')
    for yh, xl, fp, fchg in updated:
        tag = f'({yh} -> {xl})' if xl != yh else f'({yh})'
        chg_part = f'  {fchg}' if fchg else ''
        print(f'  {tag}: {fp}{chg_part}')
    if missing:
        print(f'\nNo row found for: {missing}')
    if payload.get('retrieved_at'):
        print(f"\nQuotes retrieved at: {payload['retrieved_at']}")


if __name__ == '__main__':
    main()
