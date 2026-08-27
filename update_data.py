import pandas as pd
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path

from deep_translator import GoogleTranslator

# Fields populated by the cron pipeline that are NOT a function of any xlsx
# field — preserve them across regens so they don't blank out during off-hours.
# Critically, do NOT preserve Entry/Total/Upside: those are derived from
# Current Price + Ceiling Target + Base, and preserving them would make the
# regen produce mismatched values when the user updates a price in xlsx.
# Instead, we re-run score.py at the end so those get recomputed cleanly.
PRESERVE_FROM_PRIOR = ("Change %",)

# Source xlsx location. Portable across machines (different username / OS):
#   1. PORTFOLIO_XLSX env var, if set — explicit override.
#   2. Otherwise the repo's sibling Artifacts/ folder — the standard layout
#      (this script lives at the repo root; Artifacts/ sits beside the repo).
# sync_deep_dives.py already resolves Artifacts/ the same relative way, so a
# fresh `git clone` + an Artifacts/ sibling folder Just Works — no path edits.
#
# FILENAME USES UNDERSCORES: v3_2_..., not v3.2_...
# Two near-identically-named workbooks coexisted in Artifacts/ until
# 2026-08-27 and the analyst had been editing the underscore one for about a
# week (its deep dives cite it as the live workbook) while this script read
# the dot one — so a whole ticker, IREN, was silently missing from the site.
# The dot-named copy was verified to be a strict subset (identical Base,
# price, Position Type and all 15 quarterly targets across every shared
# ticker; only the recomputed Rank column differed) and was then removed.
# Keep exactly one workbook here.
_REPO_ROOT = Path(__file__).resolve().parent
EXCEL_PATH = os.environ.get("PORTFOLIO_XLSX") or str(
    _REPO_ROOT.parent / "Artifacts" / "v3_2_master_portfolio.xlsx"
)
OUTPUT_PATH = "data.js"
CACHE_PATH = "translation_cache.json"

# Fields we actually want to translate
TRANSLATE_COLS = [
    "Name", "Rating", "Supercycle", "Position Type",
    "Revenue Explosion", "Allocation Calendar", "Key Thesis",
    "Updated", "IR Check", "Ceiling Target", "Upside"
]

def load_cache():
    if os.path.exists(CACHE_PATH):
        try:
            with open(CACHE_PATH, "r", encoding="utf-8") as f:
                cache = json.load(f)
                # Polish was dropped — keep the on-disk pl entries intact in
                # case it's ever re-added, but don't initialize them for new
                # caches.
                if "zh-CN" not in cache:
                    cache["zh-CN"] = {}
                return cache
        except:
            pass
    return {"zh-CN": {}}

def save_cache(cache):
    with open(CACHE_PATH, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)

# Fingerprints of an HTTP error page returned as a "translation". Matched
# case-insensitively against the returned string. Deliberately narrow so a
# legitimate translation containing the word "error" isn't discarded.
_TRANSLATION_ERROR_MARKERS = (
    "error 500",
    "server error",
    "that’s an error",   # curly apostrophe — what Google actually emits
    "that's an error",
    "that’s all we know",
    "that's all we know",
    "<html",
    "<!doctype",
)


def _looks_like_translation_error(value):
    """True when the translator handed back an error page instead of a
    translation. These come through as ordinary successful strings, so the
    caller's try/except cannot catch them."""
    if not isinstance(value, str):
        return False
    low = value.lower()
    return any(m in low for m in _TRANSLATION_ERROR_MARKERS)


def get_translation(text, target_lang, translator, cache):
    if not text or not isinstance(text, str):
        return text
    
    text_str = str(text).strip()
    if not text_str:
        return text
        
    if text_str in cache[target_lang]:
        return cache[target_lang][text_str]
        
    try:
        translated = translator.translate(text_str)
        # Google intermittently returns an ERROR PAGE BODY as a successful
        # string rather than raising — e.g. "Error 500 (Server Error)!!1500.
        # That's an error...". The except below never sees it, so without this
        # guard the error text is cached PERMANENTLY and rendered as the
        # ticker's Chinese name (this is how '晶豪科技 ESMT' and five other
        # entries got poisoned). Reject those and fall back to the source
        # text, and crucially do NOT cache the failure.
        if _looks_like_translation_error(translated):
            print(f"Translation returned an error page ({target_lang}) for "
                  f"'{text_str[:30]}...' — keeping source text, not caching.")
            return text
        cache[target_lang][text_str] = translated
        # small sleep to avoid rate limiting
        time.sleep(0.3)
        return translated
    except Exception as e:
        print(f"Translation error ({target_lang}) for text '{text_str[:20]}...': {e}")
        return text

def load_prior_cron_fields():
    """Read existing data.js (if present) and return a dict mapping
    ticker -> {field: value} for cron-populated fields. Used to preserve
    Change %, Entry, Total, Upside across xlsx regens, since those values
    don't exist in the xlsx and would otherwise blank out until the next
    cron tick repopulates them."""
    if not os.path.exists(OUTPUT_PATH):
        return {}
    try:
        raw = open(OUTPUT_PATH, "r", encoding="utf-8").read()
        m = re.match(r"^\s*window\.PORTFOLIO_DATA\s*=\s*", raw)
        if not m:
            return {}
        body = raw[m.end():].rstrip()
        if body.endswith(";"):
            body = body[:-1].rstrip()
        data = json.loads(body)
        out = {}
        for row in data.get("en", []):
            t = row.get("Ticker")
            if not t:
                continue
            out[str(t).strip()] = {
                k: row[k] for k in PRESERVE_FROM_PRIOR if k in row
            }
        return out
    except Exception as e:
        print(f"Could not read prior data.js for preservation: {e}")
        return {}


def main():
    # score.py emits emoji alerts (🟢 🟠 🔴 ⚫) which crash Windows cp1252
    # stdout when forwarded through subprocess capture. Force UTF-8 here so
    # the forwarded output renders cleanly.
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    print(f"Reading {EXCEL_PATH} ...")
    cache = load_cache()
    prior = load_prior_cron_fields()
    if prior:
        print(f"Will preserve cron-populated fields ({', '.join(PRESERVE_FROM_PRIOR)}) "
              f"for {len(prior)} tickers from existing data.js.")

    translator_zh = GoogleTranslator(source='auto', target='zh-CN')

    try:
        df = pd.read_excel(EXCEL_PATH, sheet_name="Master Portfolio")
        # Drop phantom columns Excel creates from stray formatting — a header
        # cell with no name comes through pandas as 'Unnamed: N'. They carry
        # nothing the site uses and would otherwise leak into data.js
        # (observed: 'Unnamed: 15' duplicated across both language blocks).
        df = df.loc[:, ~df.columns.astype(str).str.startswith("Unnamed")]
        df = df.fillna("")
        data_en = df.to_dict(orient="records")

        # Re-apply preserved cron-populated fields onto the fresh xlsx rows
        # by ticker. New tickers (no prior entry) just don't get those
        # fields set — the next cron tick fills them in normally.
        for row in data_en:
            t = str(row.get("Ticker") or "").strip()
            if t and t in prior:
                for k, v in prior[t].items():
                    if v not in (None, ""):
                        row[k] = v

        data_zh = []

        print("Translating data... This may take a minute if cache is empty.")

        for idx, row in enumerate(data_en):
            row_zh = dict(row)

            for col in TRANSLATE_COLS:
                if col in row:
                    val = row[col]
                    row_zh[col] = get_translation(val, "zh-CN", translator_zh, cache)

            data_zh.append(row_zh)

            if (idx + 1) % 5 == 0:
                print(f"Processed {idx + 1}/{len(data_en)} rows...")
                save_cache(cache)

        save_cache(cache)

        final_data = {
            "en": data_en,
            "zh-CN": data_zh,
        }
        
        with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
            f.write("window.PORTFOLIO_DATA = ")
            json.dump(final_data, f, ensure_ascii=False, indent=4)
            f.write(";")

        print(f"Successfully exported multi-lingual data to {OUTPUT_PATH}")

        # Recompute Entry/Total/Upside from the fresh xlsx Base + Ceiling
        # Target + Current Price. score.py reads/writes data.js standalone,
        # so we just invoke it via subprocess to keep separation clean.
        score_path = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                  "scripts", "score.py")
        if os.path.exists(score_path):
            print("\nRunning score.py to recompute Entry/Total/Upside...")
            proc = subprocess.run(
                [sys.executable, score_path],
                capture_output=True, text=True, encoding="utf-8",
            )
            # Forward score.py's output (alerts, bucket counts, skipped rows)
            sys.stdout.write(proc.stdout)
            if proc.returncode != 0:
                sys.stderr.write(proc.stderr)
                print(f"score.py exited {proc.returncode} (continuing).")
        
    except Exception as e:
        print(f"Error extracting data: {e}")

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    main()
