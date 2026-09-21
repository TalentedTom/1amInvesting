"""Persist custom ETF models across Excel regens and live-price refreshes.

Quarter return = sum(weight * (constituent target / constituent price - 1)).
ETF quarter target = ETF quote * (1 + quarter return).
Native currencies cancel within each constituent ratio; never average prices.
"""

import json
import math
import re
from pathlib import Path

try:
    from .score import parse_price, score_row, ev_upside, target_cell
except ImportError:  # fetch_live.py runs directly from scripts/
    from score import parse_price, score_row, ev_upside, target_cell

ROOT = Path(__file__).resolve().parent.parent


def number(value):
    if value == 0 and not isinstance(value, bool):
        return 0.0
    result = parse_price(value)
    return result if result is not None and math.isfinite(result) else None


def refresh_synthetic_rows(rows):
    """Update ONLY custom ETF rows, after all constituent prices are patched.

    Missing data leaves that quarter blank; never silently drop/reweight a
    holding. Failed live quotes retain the usual last available row price.
    """
    by_ticker = {str(r.get("Ticker", "")).strip(): r for r in rows}
    quarters = sorted({k for r in rows for k in r if re.fullmatch(r"Q[1-4] 20\d{2}", k)})
    for row in rows:
        model = row.get("_synthetic")
        if not model:
            continue
        holdings = model["holdings"]
        weights = [h["weight"] for h in holdings]
        if (not weights or any(not math.isfinite(w) or w <= 0 for w in weights)
                or not math.isclose(sum(weights), 1, abs_tol=1e-9)
                or len({h["ticker"] for h in holdings}) != len(holdings)):
            raise ValueError(f"Invalid weights for {row['Ticker']}; must sum to 100%")
        price = number(row.get("Current Price"))
        row["Base"] = model["base"]
        for quarter in quarters:
            weighted_return = 0.0
            complete = price is not None and price > 0
            for holding in holdings:
                source = by_ticker.get(holding["ticker"], {})
                target = number(source.get(quarter))
                source_price = number(source.get("Current Price"))
                if (source.get("_synthetic") or target is None or target < 0
                        or source_price is None or source_price <= 0):
                    complete = False
                    break
                weighted_return += holding["weight"] * (target / source_price - 1)
            row[quarter] = price * (1 + weighted_return) if complete else ""
        for field in ("Upside", "EV Upside", "Entry", "Total"):
            row[field] = ""
        if score_row(row):
            row["EV Upside"] = ev_upside(row["Base"], number(target_cell(row)), price)


def add_synthetic_rows(rows, prior_path):
    """Append configured models without modifying the source workbook.

    Quote seed is a verified market snapshot, just like workbook prices.
    Normal live.json fetches supply fresh ETF prices after page load. Regens
    reuse the last generated ETF quote, so they need no extra network call.
    """
    configs = json.loads((ROOT / "synthetic_portfolios.json").read_text(encoding="utf-8"))
    prior_rows = {}
    if prior_path.exists():
        raw = prior_path.read_text(encoding="utf-8")
        prior = json.loads(raw[raw.index("{"):raw.rindex("}") + 1])
        prior_rows = {r["Ticker"]: r for r in prior.get("en", [])}
    configured = {c["ticker"] for c in configs}
    rows[:] = [r for r in rows if r.get("Ticker") not in configured]
    for config in configs:
        ticker = config["ticker"]
        old = prior_rows.get(ticker, {})
        seed = config["seed_quote"]
        price = number(old.get("Current Price")) or seed["price"]
        rows.append({
            "Rank": 1, "Ticker": ticker, "Name": config["name"],
            "Base": config["base"], "Current Price": price,
            "Change %": old.get("Change %", f"{seed['change_pct']:+.2f}%"),
            "Position Type": "ETF - custom weighted memory basket",
            "Artifact Updated": "", "Port": "",
            "_synthetic": {k: config[k] for k in ("base", "holdings", "note")},
        })
    refresh_synthetic_rows(rows)
    print("Added custom ETF models: " + ", ".join(sorted(configured)))
