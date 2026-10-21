import contextlib
import io
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
import market_caps
import fetch_live


class MarketCapTests(unittest.TestCase):
    def snapshot(self, rows, identities, usd, native):
        return market_caps.build_snapshot(rows, identities, {'data': usd}, {'data': native}, retrieved_at='2026-10-21T05:00:00Z')

    def test_usd_native_currencies_and_uk_pence_are_not_double_converted(self):
        rows = [{'Ticker': t} for t in ('MU', '005930.KS', 'FTC.L')]
        identities = {t: {'symbol': s} for t, s in [('MU', 'NASDAQ:MU'), ('005930.KS', 'KRX:005930'), ('FTC.L', 'LSE:FTC')]}
        usd = [{'s': s, 'd': ['Company', c, amount]} for s, c, amount in
               [('NASDAQ:MU', 'USD', 1e12), ('KRX:005930', 'KRW', 8e11), ('LSE:FTC', 'GBX', 8e8)]]
        native = [{'s': s, 'd': ['Company', c, amount]} for s, c, amount in
                  [('NASDAQ:MU', 'USD', 1e12), ('KRX:005930', 'KRW', 1.1e15), ('LSE:FTC', 'GBX', 6e10)]]
        result = self.snapshot(rows, identities, usd, native)
        self.assertEqual(result['currency'], 'USD')
        self.assertEqual(result['tickers']['FTC.L']['market_cap_usd'], 8e8)
        self.assertEqual(result['tickers']['FTC.L']['market_cap_listing_units'], 6e10)
        self.assertEqual(result['tickers']['005930.KS']['market_cap_usd'], 8e11)

    def test_depositary_wrapper_uses_underlying_company_cap_not_adr_float(self):
        result = self.snapshot([{'Ticker': 'SKHY'}, {'Ticker': '000660.KS'}],
                               {'000660.KS': {'symbol': 'KRX:000660'}},
                               [{'s': 'KRX:000660', 'd': ['SK hynix', 'KRW', 5e11]}], [])
        self.assertEqual(result['tickers']['SKHY']['market_cap_usd'], 5e11)
        self.assertEqual(result['tickers']['SKHY']['market_cap_usd'], result['tickers']['000660.KS']['market_cap_usd'])

    def test_etf_missing_and_invalid_values_stay_unavailable_not_zero(self):
        rows = [{'Ticker': 'DRAM', '_synthetic': {'holdings': []}}, {'Ticker': 'BAD', 'Name': 'Bad Company'}]
        result = self.snapshot(rows, {}, [{'s': 'NASDAQ:BAD', 'd': ['Bad Company', 'USD', float('nan')]}], [])
        self.assertIsNone(result['tickers']['DRAM']['market_cap_usd'])
        self.assertIsNone(result['tickers']['BAD']['market_cap_usd'])
        self.assertIn('ETF', result['tickers']['DRAM']['reason'])

    def test_non_usd_contract_is_rejected(self):
        with self.assertRaisesRegex(ValueError, 'USD'):
            market_caps.build_snapshot([], {}, {}, {}, retrieved_at='2026-10-21T05:00:00Z', financial_currency='JPY')

    def test_unmapped_identity_must_match_company(self):
        row = {'Ticker': 'ABC', 'Name': 'Alpha Devices'}
        self.assertFalse(market_caps.identity_matches(row, {'s': 'NASDAQ:ABC', 'd': ['Different Business']}, {}))
        self.assertTrue(market_caps.identity_matches(row, {'s': 'NASDAQ:ABC', 'd': ['Alpha Devices Inc.']}, {}))

    def test_market_cap_outage_does_not_block_price_publication(self):
        stats = {'fetched': 1, 'expected': 1, 'scored': 1, 'no_score': 0, 'failures': [], 'timed_out': [], 'fetch_secs': .1,
                 'buckets': {'EXTREME': 0, 'HC': 1, 'WL': 0, 'FAIL': 0}}
        with tempfile.TemporaryDirectory() as folder:
            output = Path(folder) / 'live.json'
            payload = {'ts': '2026-10-21T05:00:00Z', 'tickers': {'MU': {'price': '$100'}}}
            with patch.object(sys, 'argv', ['fetch_live.py', '--output', str(output)]), \
                 patch.object(fetch_live, 'load_data_js', return_value={'en': [{'Ticker': 'MU'}]}), \
                 patch.object(fetch_live, 'build_live_payload', return_value=(payload, stats)), \
                 patch.object(market_caps, 'fetch_market_caps', side_effect=TimeoutError('provider unavailable')), \
                 contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(fetch_live.main(), 0)
            saved = json.loads(output.read_text())
            self.assertEqual(saved['tickers']['MU']['price'], '$100')
            self.assertNotIn('market_caps', saved)


if __name__ == '__main__':
    unittest.main()
