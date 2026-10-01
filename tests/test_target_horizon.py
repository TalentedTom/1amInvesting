"""Target rollover stays consistent across regeneration, frontend and live quotes."""
import copy
import re
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import score
import fetch_live


def fixture():
    return {'Ticker': 'TEST', 'Base': 90, 'Current Price': 100,
            'Q3 2027': 200, 'Q4 2027': 400, 'FY2028': 999,
            'Upside': '2.0x', 'EV Upside': 80}


class TargetHorizonTests(unittest.TestCase):
    def test_q4_replaces_stale_derived_values_without_changing_inputs(self):
        for stale_ev in (80, 0):
            row = fixture()
            row['EV Upside'] = stale_ev
            before = copy.deepcopy(row)
            score.score_row(row)
            self.assertEqual(row['Upside'], '4.0x')
            self.assertEqual(row['EV Upside'], 260)
            for key in ('Base', 'Current Price', 'Q3 2027', 'Q4 2027', 'FY2028'):
                self.assertEqual(row[key], before[key])
            again = copy.deepcopy(row)
            score.score_row(row)
            self.assertEqual(row, again)

    def test_live_price_denominator_with_q4_numerator(self):
        row = fixture()
        before = copy.deepcopy(row)
        with patch.object(fetch_live, 'fetch_all', return_value=({'TEST': (200, 'USD', 0)}, [], [])):
            payload, _ = fetch_live.build_live_payload({'en': [row]})
        self.assertEqual(payload['tickers']['TEST']['upside'], '2.0x')
        self.assertEqual(payload['tickers']['TEST']['ev_upside'], 80)
        self.assertEqual(row, before)

    def test_no_silent_q3_fallback(self):
        self.assertEqual(score.target_cell({'Q3 2027': 200}), '')
        self.assertIsNone(score.score_row({'Base': 90, 'Current Price': 100, 'Q3 2027': 200}))

    def test_numeric_quarter_target_keeps_negative_sign_and_zero(self):
        for target, upside, ev in [(-50, '-0.5x', -145), (0, '0.0x', -100)]:
            row = fixture()
            row['Q4 2027'] = target
            score.score_row(row)
            self.assertEqual(row['Upside'], upside)
            self.assertEqual(row['EV Upside'], ev)
            with patch.object(fetch_live, 'fetch_all', return_value=({'TEST': (100, 'USD', 0)}, [], [])):
                payload, _ = fetch_live.build_live_payload({'en': [row]})
            self.assertEqual(payload['tickers']['TEST']['upside'], upside)
            self.assertEqual(payload['tickers']['TEST']['ev_upside'], ev)

    def test_frontend_and_backend_use_same_active_quarter(self):
        script = (ROOT / 'script.js').read_text(encoding='utf-8')
        target = re.search(r'const TARGET_QUARTER = "([^"]+)"', script).group(1)
        self.assertEqual(target, 'Q4 2027')
        self.assertEqual(target, score.TARGET_COLS[0])
        self.assertIn('SyntheticPortfolios.refresh(data, QUARTER_COLS, parseLooseNumber, TARGET_QUARTER)', script)


if __name__ == '__main__':
    unittest.main()
