import pandas as pd
import json
import os
import time
from deep_translator import GoogleTranslator

EXCEL_PATH = r"C:\Users\GamerTech\.gemini\antigravity\scratch\Artifacts\v3.2_master_portfolio.xlsx"
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
        cache[target_lang][text_str] = translated
        # small sleep to avoid rate limiting
        time.sleep(0.3)
        return translated
    except Exception as e:
        print(f"Translation error ({target_lang}) for text '{text_str[:20]}...': {e}")
        return text

def main():
    print(f"Reading {EXCEL_PATH} ...")
    cache = load_cache()

    translator_zh = GoogleTranslator(source='auto', target='zh-CN')

    try:
        df = pd.read_excel(EXCEL_PATH, sheet_name="Master Portfolio")
        df = df.fillna("")
        data_en = df.to_dict(orient="records")

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
        
    except Exception as e:
        print(f"Error extracting data: {e}")

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    main()
