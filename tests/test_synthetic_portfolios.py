import copy
import json
import re
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from synthetic_portfolios import refresh_synthetic_rows, add_synthetic_rows
import fetch_live


def fixture():
    sources = [dict(Ticker=t, Base=100, **{'Current Price': 100, 'Q3 2027': target})
               for t, target in [('A', 200), ('B', 180), ('C', 100), ('D', 100)]]
    return sources + [dict(Ticker='DRAM', Base=100, **{
        'Current Price': 50,
        '_synthetic': {'base': 100, 'holdings': [
            {'ticker': t, 'weight': .25} for t in 'ABCD']}})]


class SyntheticTests(unittest.TestCase):
    def test_weighted_base_keeps_fractional_precision(self):
        rows = fixture()
        for row, base in zip(rows, [99, 80, 62, 70]):
            row['Base'] = base
        refresh_synthetic_rows(rows)
        self.assertEqual(rows[-1]['Base'], 77.75)
        self.assertEqual(rows[-1]['EV Upside'], 13)
        quotes = {r['Ticker']: (r['Current Price'], 'USD', 0) for r in rows}
        with patch.object(fetch_live, 'fetch_all', return_value=(quotes, [], [])):
            payload, _ = fetch_live.build_live_payload({'en': rows})
        self.assertEqual(payload['tickers']['DRAM']['ev_upside'], 13)

    def test_percent_units_and_base(self):
        rows = fixture()
        before = copy.deepcopy(rows[:-1])
        refresh_synthetic_rows(rows)
        self.assertAlmostEqual(rows[-1]['Q3 2027'], 72.5)  # 45% weighted return
        self.assertEqual(rows[-1]['EV Upside'], 45)
        self.assertEqual(rows[-1]['Base'], 100)
        self.assertEqual(rows[:-1], before)

    def test_live_constituent_price_and_no_compounding(self):
        rows = fixture()
        rows[0]['Current Price'] = 200
        refresh_synthetic_rows(rows)
        self.assertAlmostEqual(rows[-1]['Q3 2027'], 60)
        refresh_synthetic_rows(rows)
        self.assertAlmostEqual(rows[-1]['Q3 2027'], 60)
        rows[-1]['Current Price'] = 100
        refresh_synthetic_rows(rows)
        self.assertAlmostEqual(rows[-1]['Q3 2027'], 120)
        self.assertEqual(rows[-1]['EV Upside'], 20)

    def test_missing_data_never_renormalized(self):
        rows = fixture()
        del rows[0]['Q3 2027']
        refresh_synthetic_rows(rows)
        self.assertEqual(rows[-1]['Q3 2027'], '')
        self.assertEqual(rows[-1]['Upside'], '')

    def test_losses_and_currency_strings(self):
        rows = fixture()
        for r in rows[:-1]:
            r['Current Price'] = 'KRW 1,000'
            r['Q3 2027'] = 500
        refresh_synthetic_rows(rows)
        self.assertEqual(rows[-1]['Q3 2027'], 25)
        self.assertEqual(rows[-1]['EV Upside'], -50)

    def test_invalid_weights(self):
        rows = fixture()
        rows[-1]['_synthetic']['holdings'][0]['weight'] = .3
        with self.assertRaises(ValueError):
            refresh_synthetic_rows(rows)

    def test_real_data_and_regen_persistence(self):
        raw = (ROOT / 'data.js').read_text(encoding='utf-8')
        rows = json.loads(raw[raw.index('{'):raw.rindex('}') + 1])['en']
        add_synthetic_rows(rows, ROOT / 'data.js')
        add_synthetic_rows(rows, ROOT / 'data.js')
        self.assertEqual(sum(r['Ticker'] == 'DRAM' for r in rows), 1)
        etf = next(r for r in rows if r['Ticker'] == 'DRAM')
        lookup = {r['Ticker']: r for r in rows}
        quarters = [k for k in etf if re.fullmatch(r'Q[1-4] 20\d{2}', k)]
        self.assertEqual(len(quarters), 15)
        for q in quarters:
            expected = sum(h['weight'] * (lookup[h['ticker']][q]
                           / lookup[h['ticker']]['Current Price'] - 1)
                           for h in etf['_synthetic']['holdings'])
            self.assertAlmostEqual(etf[q] / etf['Current Price'] - 1, expected)

    def test_live_payload_uses_all_fresh_quotes_without_mutating_input(self):
        rows = fixture()
        original = copy.deepcopy(rows)
        quotes = {r['Ticker']: (200 if r['Ticker'] == 'A' else r['Current Price'], 'USD', 0)
                  for r in rows}
        with patch.object(fetch_live, 'fetch_all', return_value=(quotes, [], [])):
            payload, _ = fetch_live.build_live_payload({'en': rows})
        self.assertEqual(payload['tickers']['DRAM']['ev_upside'], 20)
        self.assertEqual(payload['tickers']['DRAM']['upside'], '1.2x')
        self.assertEqual(rows, original)


if __name__ == '__main__':
    unittest.main()
