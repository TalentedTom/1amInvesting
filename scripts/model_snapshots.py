"""Record changes to the published Base and active unweighted quarter target."""
import json
import math
from datetime import datetime, timezone
from pathlib import Path

from score import TARGET_COLS

ROOT = Path(__file__).resolve().parents[1]
ASSIGNMENT = "window.MODEL_SNAPSHOTS = "
# Listings added after the USD market-cap seed was generated.
CURRENCIES = {"ANT": "USD", "301666.SZ": "CNY", "ASTS": "USD", "RKLB": "USD", "LWLG": "USD", "DRAM": "USD"}


def js_object(text):
    return json.loads(text[text.index("{"):text.rindex("}") + 1])


def number(value):
    if value in (None, ""):
        return None
    try:
        value = float(value)
    except (TypeError, ValueError):
        return None
    return value if math.isfinite(value) else None


def record(history, rows, currencies, quarter, stamp):
    result = {}
    for row in rows:
        ticker = row.get("Ticker")
        if not ticker:
            continue
        units = currencies.get(ticker, {}).get("listing_currency") or CURRENCIES.get(ticker)
        if row.get("_synthetic"):
            # Holdings weights are model inputs. The ETF's calculated prices change with quotes.
            inputs = {"weights": {h["ticker"]: h["weight"] for h in row["_synthetic"]["holdings"]}}
        else:
            inputs = {"quarter": quarter, "target": number(row.get(quarter)), "base": number(row.get("Base")), "currency": units}
        entries = list(history.get(ticker, []))
        if not entries or entries[-1]["inputs"] != inputs:
            entries.append({"at": stamp, "inputs": inputs})
        result[ticker] = entries
    return result


def save(path, history):
    lines = [
        "    " + json.dumps(ticker) + ": " + json.dumps(entries, ensure_ascii=False, separators=(",", ":"))
        for ticker, entries in history.items()
    ]
    text = ASSIGNMENT + "{\n" + ",\n".join(lines) + "\n};\n"
    if path.exists() and path.read_text(encoding="utf-8") == text:
        return
    temp = path.with_suffix(".tmp")
    temp.write_text(text, encoding="utf-8", newline="\n")
    temp.replace(path)


def main():
    dest = ROOT / "model-snapshots.js"
    history = js_object(dest.read_text(encoding="utf-8")) if dest.exists() else {}
    rows = js_object((ROOT / "data.js").read_text(encoding="utf-8"))["en"]
    currencies = json.loads((ROOT / "market-caps.json").read_text(encoding="utf-8"))["tickers"]
    stamp = datetime.now(timezone.utc).isoformat(timespec="seconds")
    save(dest, record(history, rows, currencies, TARGET_COLS[0], stamp))


if __name__ == "__main__":
    main()
