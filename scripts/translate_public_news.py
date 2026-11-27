"""Build the site's Simplified Chinese dictionary from visitor-facing news text.

Run with --update to translate missing public copy. Default checks coverage offline.
Original articles, workbooks and report files are never inputs to the translator
outside the existing public HTML and headline module.
"""
import argparse
import json
import re
import subprocess
import time
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed
from decimal import Decimal
from pathlib import Path

from bs4 import BeautifulSoup, Comment
import requests

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'news-zh.json'
SPACE = re.compile(r'\s+')
CURRENCY = {'USD':'美元','US$':'美元','NT$':'新台币','TWD':'新台币','CNY':'元人民币','RMB':'元人民币',
            'EUR':'欧元','CAD':'加元','AUD':'澳元','HKD':'港元','HK$':'港元','JPY':'日元',
            'KRW':'韩元','GBP':'英镑','SEK':'瑞典克朗','₩':'韩元','€':'欧元','£':'英镑'}
SCALE = {'trillion':10**12,'billion':10**9,'bn':10**9,'million':10**6,'mn':10**6,
         'thousand':1000,'m':10**6}
UNITS = '|'.join(SCALE)
NUMBER = r'(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?'
CUR = '|'.join(map(re.escape,sorted(CURRENCY,key=len,reverse=True))) + r'|\$|¥'
# Keep dated estimates, listing symbols, percentages, currency and unit scales intact.
TOKEN = re.compile(
    r'(?<!\w)(?:\d{4}-\d{2}-\d{2}|\d+[A-Z]*\.(?:TW[O]?|SH|SSE|KS|SZ|HK|T)|[A-Z0-9-]+\.(?:DE|TO|ST|AX|AS|PA|VI))\b'
    + r'|(?P<cur>' + CUR + r')\s*(?P<val>[−-]?' + NUMBER + r')(?P<range>\s*[–—-]\s*(?P=cur)?\s*' + NUMBER + r')?(?:\s*(?P<unit>' + UNITS + r')\b)?'
    + r'|(?P<pct>[+−-]?' + NUMBER + r'\s*%)')
def normalize(text):
    return SPACE.sub(' ', str(text)).strip()

def sources():
    soup = BeautifulSoup((ROOT / 'index.html').read_bytes(), 'html.parser')
    texts = set()
    for article in soup.select('article.news-research'):
        for node in article.stripped_strings:
            if not isinstance(node, Comment):
                texts.add(normalize(node))
    records = json.loads(subprocess.check_output(
        ['node','-e',"process.stdout.write(JSON.stringify(require('./news-headlines.js').research))"],
        cwd=ROOT, encoding='utf-8'))
    for record in records.values():
        for entry in record.get('en', []):
            if entry.get('change'):
                for field in ('brief','metric','levels'):
                    if entry.get(field): texts.add(normalize(entry[field]))
                if not entry.get('brief') and entry.get('reason'): texts.add(normalize(entry['reason']))
    return sorted(s for s in texts if re.search('[A-Za-z]', s) and not re.fullmatch(r'(?:Posted|Research) \d.*', s))

def amount(n,unit):
    if not unit: return n
    value = Decimal(n.replace(',','').replace('−','-')) * SCALE[unit]
    for divisor,suffix in [(10**8,'亿'),(10**4,'万'),(1,'')]:
        if abs(value)>=divisor or divisor==1:
            number=format(value/divisor,'f')
            return (number.rstrip('0').rstrip('.') if '.' in number else number)+suffix

def protected(text):
    values=[]
    def mask(m):
        value=m[0]
        if m['cur']:
            start=amount(m['val'],m['unit'])
            if m['range']:
                end=re.search(NUMBER,m['range'])[0]
                start+='至'+amount(end,m['unit'])
            currency=m['cur']
            value=start+CURRENCY[currency] if currency in CURRENCY else currency+start
        if m['pct']:
            values.append(value.removesuffix('%').strip())
            return f'ZX{len(values)}XZ%'
        values.append(value)
        return f'ZX{len(values)}XZ'
    return TOKEN.sub(mask,text),values

def restore(text,values):
    ids=[int(i) for i in re.findall(r'ZX\s*(\d+)\s*XZ',text,re.I)]
    if sorted(ids)!=list(range(1,len(values)+1)): raise ValueError('translation lost a protected financial value')
    return re.sub(r'ZX\s*(\d+)\s*XZ',lambda m:values[int(m[1])-1],text,flags=re.I)

def translate(batch):
    prepared=[protected(s) for s in batch]
    request='\n'.join(s for s,_ in prepared)
    for attempt in range(3):
        try:
            numbered='\n'.join(f'[{i+101}] '+line for i,line in enumerate(request.splitlines()))
            res=requests.get('https://translate.googleapis.com/translate_a/single',
                params={'client':'gtx','sl':'en','tl':'zh-CN','dt':'t','q':numbered}, timeout=25)
            res.raise_for_status()
            raw=''.join(segment[0] for segment in res.json()[0] if segment[0])
            parts=re.split(r'(?:^|\n)\s*[\[【［]\s*(\d{3})\s*[\]】］]\s*',raw.strip())
            if parts[0] or parts[1::2]!=[str(i+101) for i in range(len(batch))]:
                if len(batch)>1:
                    mid=len(batch)//2
                    return {**translate(batch[:mid]),**translate(batch[mid:])}
                raise ValueError('missing source marker')
            results={}
            for source,line,(_,values) in zip(batch,parts[2::2],prepared):
                try: results[source]=restore(line,values).strip()
                except ValueError: pass  # Never save a translation with changed figures.
            return results
        except (ValueError,requests.RequestException):
            if attempt==2:return {}
            time.sleep(2**attempt)

def percentage_values(text):
    return Counter(re.findall(r'(\d+(?:\.\d+)?)\s*[%％]', text))

def check_coverage(keys, catalog):
    missing = {s for s in keys if not catalog.get(s)}
    changed = [s for s in keys if s not in missing
               and percentage_values(s) != percentage_values(catalog[s])]
    if missing or changed:
        for source in sorted(missing.union(changed)):
            print(source)
        raise SystemExit(f'{len(missing)} missing translations, {len(changed)} percentage discrepancies.')
    print(f'Mandarin news coverage complete for {len(keys)} public strings.')

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--update',action='store_true')
    args=parser.parse_args()
    catalog=json.loads(OUTPUT.read_text(encoding='utf-8')) if OUTPUT.exists() else {}
    keys = sources()
    missing = [s for s in keys if not catalog.get(s)]
    if not missing or not args.update:
        check_coverage(keys, catalog)
        return
    batches=[]; current=[]; size=0
    for source in missing:
        if size+len(source)>1450 and current:
            batches.append(current);current=[];size=0
        current.append(source);size+=len(source)+1
    if current:batches.append(current)
    print(f'Translating {len(missing)} public strings in {len(batches)} batches.',flush=True)
    with ThreadPoolExecutor(max_workers=4) as pool:
        jobs=[pool.submit(translate,batch) for batch in batches]
        for i,job in enumerate(as_completed(jobs),1):
            translated=job.result()
            catalog.update(translated)
            temp=OUTPUT.with_suffix('.tmp')
            temp.write_text(json.dumps(catalog,ensure_ascii=False,sort_keys=True,indent=1)+'\n',encoding='utf-8')
            temp.replace(OUTPUT)
            if i%25==0:print(f'{i}/{len(batches)}',flush=True)
    check_coverage(keys, catalog)
if __name__=='__main__':
    main()
