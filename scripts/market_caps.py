"""Company-level USD market caps; independent of portfolio targets and prices.

TradingView's explicit price_conversion contract handles listing currencies,
pence units, multi-class shares and depositary receipts. Never infer company
size by multiplying an ADR price by the underlying ordinary share count.
"""
import argparse
import concurrent.futures
import datetime as dt
import json
import math
import re
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENDPOINT = "https://scanner.tradingview.com/global/"
EXCHANGES = {"KS": "KRX", "KQ": "KOSDAQ", "TW": "TWSE", "TWO": "TPEX",
             "HK": "HKEX", "SH": "SSE", "SS": "SSE", "SSE": "SSE", "SZ": "SZSE", "SZSE": "SZSE",
             "T": "TSE", "ST": "OMXSTO", "L": "LSE", "PA": "EURONEXT", "AS": "EURONEXT",
             "DE": "XETR", "SW": "SIX", "TO": "TSX", "V": "TSXV", "AX": "ASX", "VI": "VIE", "MI": "MIL", "KL": "MYX"}
ALIASES = {"XFAB": "EURONEXT:XFAB", "ALRIB": "EURONEXT:ALRIB", "ABBN": "SIX:ABBN",
           "HUBN": "SIX:HUBN", "STLTECH": "NSE:STLTECH", "SKHY": "KRX:000660"}


def positive(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value) and value > 0


def post(route, body, timeout=4):
    request = urllib.request.Request(ENDPOINT + route, data=json.dumps(body).encode(),
                                     headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return json.load(response)


def listing_candidates(row, identities):
    ticker = str(row.get("Ticker") or "").strip()
    if row.get("_synthetic"):
        return []  # ETFs have assets under management, not company market caps.
    known = identities.get(ticker, {}).get("symbol") or ALIASES.get(ticker)
    if known:
        return [known]
    if "." in ticker:
        base, suffix = ticker.rsplit(".", 1)
        exchange = EXCHANGES.get(suffix)
        return [exchange + ":" + (base.lstrip("0") if suffix == "HK" else base)] if exchange else []
    return [exchange + ":" + ticker for exchange in ("NASDAQ", "NYSE", "AMEX", "OTC")]


def identity_matches(row, item, identities):
    ticker = row["Ticker"]
    pinned = identities.get(ticker, {}).get("symbol") or ALIASES.get(ticker)
    if pinned:
        return item["s"] == pinned
    # Unmapped/new companies must have both an exact ticker and matching name.
    words = lambda s: set(re.findall(r"[a-z0-9]{3,}", str(s).lower())) - {"inc", "corp", "ltd", "limited", "company", "corporation", "holdings", "group"}
    return bool(words(row.get("Name", "")) & words(item["d"][0]))


def build_snapshot(rows, identities, usd, native, *, retrieved_at, financial_currency="USD"):
    if financial_currency != "USD":
        raise ValueError("Provider did not confirm USD financial units")
    dollars = {item["s"]: item for item in usd.get("data", [])}
    original = {item["s"]: item for item in native.get("data", [])}
    tickers = {}
    for row in rows:
        ticker = str(row.get("Ticker") or "").strip()
        if not ticker:
            continue
        item = next((dollars[s] for s in listing_candidates(row, identities)
                     if s in dollars and identity_matches(row, dollars[s], identities)
                     and len(dollars[s].get("d", [])) >= 3 and positive(dollars[s]["d"][2])), None)
        if item is None:
            tickers[ticker] = {"market_cap_usd": None, "reason": "ETF: company market cap not applicable" if row.get("_synthetic") else "Company market cap unavailable"}
            continue
        description, currency, amount = item["d"][:3]
        if not isinstance(currency, str) or not re.fullmatch(r"[A-Za-z]{3}", currency):
            tickers[ticker] = {"market_cap_usd": None, "reason": "Listing currency unavailable"}
            continue
        entry = {"market_cap_usd": float(amount), "source_symbol": item["s"], "company": description,
                 "listing_currency": currency, "retrieved_at": retrieved_at}
        source = original.get(item["s"], {}).get("d", [])
        if len(source) >= 3 and source[1] == currency and positive(source[2]):
            entry["market_cap_listing_units"] = float(source[2])
        tickers[ticker] = entry
    available = sum(positive(item.get("market_cap_usd")) for item in tickers.values())
    return {"schema_version": 1, "currency": "USD", "source": "TradingView", "retrieved_at": retrieved_at,
            "conversion": "Explicit provider conversion to USD; original listing currency retained. GBX values are pence, not GBP.",
            "time_basis": "Snapshot retrieval time; underlying market/FX quote timestamps are not supplied and may be delayed.",
            "available_count": available, "unavailable_count": len(tickers) - available, "tickers": tickers}


def load_identities():
    path = ROOT / "company-logos.js"
    if not path.exists():
        return {}
    text = path.read_text(encoding="utf-8")
    return json.loads(text[text.index("{"):text.rindex("}") + 1])


def fetch_market_caps(rows, *, timeout=4, deadline=6):
    identities = load_identities()
    symbols = sorted({symbol for row in rows for symbol in listing_candidates(row, identities)})
    common = {"symbols": {"tickers": symbols}, "columns": ["description", "currency", "market_cap_basic"]}
    usd_body = {**common, "price_conversion": {"to_currency": "USD"}}
    native_body = {**common, "price_conversion": {"to_symbol": True}}
    executor = concurrent.futures.ThreadPoolExecutor(max_workers=3)
    futures = [executor.submit(post, route, body, timeout) for route, body in
               (("scan", usd_body), ("scan", native_body), ("metainfo", usd_body))]
    try:
        done, _ = concurrent.futures.wait(futures, timeout=deadline)
        if len(done) != len(futures):
            raise TimeoutError("Market-cap metadata deadline exceeded")
        usd, native, metadata = [future.result() for future in futures]
        timestamp = dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
        snapshot = build_snapshot(rows, identities, usd, native, retrieved_at=timestamp,
                                  financial_currency=metadata.get("financial_currency"))
        stock_count = sum(not row.get("_synthetic") for row in rows if row.get("Ticker"))
        if stock_count and snapshot["available_count"] / stock_count < .75:
            raise ValueError("Market-cap coverage below 75%; keep the previous snapshot")
        return snapshot
    finally:
        for future in futures:
            future.cancel()
        executor.shutdown(wait=False, cancel_futures=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--output", default=str(ROOT / "market-caps.json"))
    args = parser.parse_args()
    raw = (ROOT / "data.js").read_text(encoding="utf-8")
    rows = json.loads(raw[raw.index("{"):raw.rindex("}") + 1])["en"]
    snapshot = fetch_market_caps(rows)
    Path(args.output).write_text(json.dumps(snapshot, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"USD company market caps: {snapshot['available_count']} available, {snapshot['unavailable_count']} unavailable; {snapshot['retrieved_at']}")


if __name__ == "__main__":
    main()
