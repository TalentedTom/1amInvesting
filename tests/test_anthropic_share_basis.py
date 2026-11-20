import unittest

from update_data import apply_anthropic_share_basis


class AnthropicShareBasisTests(unittest.TestCase):
    def test_converts_legacy_equity_cap_row_to_dollars_per_share(self):
        row = {
            "Ticker": "ANT", "Name": "Anthropic (Equity MC, USD B)", "Base": 72,
            "Current Price": 1726.1560516321972, "Q3 2026": "",
            "Q3 2027": 1787.4754335546909, "Q4 2027": 1985.0882410293207,
        }
        for _ in range(2):
            apply_anthropic_share_basis(row)
            self.assertEqual(row["Name"], "Anthropic")
            self.assertEqual(row["Base"], 72)
            self.assertEqual(row["Q3 2026"], "")
            self.assertAlmostEqual(row["Current Price"], 95.1701)
            self.assertAlmostEqual(row["Q3 2027"], 98.55089034278726)
            self.assertAlmostEqual(row["Q4 2027"], 109.44609916869736)

    def test_preserves_native_per_share_workbook_row(self):
        row = {"Ticker": "ANT", "Name": "Anthropic, PBC", "Current Price": 85.04,
               "Q3 2027": 98.55}
        expected = row.copy()
        apply_anthropic_share_basis(row)
        self.assertEqual(row, expected)

    def test_does_not_apply_ant_share_count_to_other_tickers(self):
        row = {"Ticker": "OPEN", "Name": "Open (Equity MC, USD B)", "Current Price": 1000}
        expected = row.copy()
        apply_anthropic_share_basis(row)
        self.assertEqual(row, expected)
