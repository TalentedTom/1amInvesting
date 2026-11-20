import unittest

from update_data import _SNDK_PRE_SPLIT_VALUES, apply_sandisk_split


class SandiskSplitTests(unittest.TestCase):
    def test_adjusts_old_values_once(self):
        row = {"Ticker": "SNDK", "Base": 87, **_SNDK_PRE_SPLIT_VALUES}
        for _ in range(2):
            apply_sandisk_split(row)
            self.assertEqual(row["Base"], 87)
            for field, original in _SNDK_PRE_SPLIT_VALUES.items():
                self.assertEqual(row[field], original / 8, field)

    def test_preserves_workbook_edits_and_other_tickers(self):
        row = {"Ticker": "SNDK", "Current Price": 81.06, "Q4 2027": 219.84,
               "Q3 2027": _SNDK_PRE_SPLIT_VALUES["Q3 2027"], "Q1 2028": ""}
        apply_sandisk_split(row)
        self.assertEqual(row["Current Price"], 81.06)
        self.assertEqual(row["Q4 2027"], 219.84)
        self.assertEqual(row["Q3 2027"], _SNDK_PRE_SPLIT_VALUES["Q3 2027"] / 8)
        self.assertEqual(row["Q1 2028"], "")

        other = {"Ticker": "WDC", **_SNDK_PRE_SPLIT_VALUES}
        apply_sandisk_split(other)
        self.assertEqual(other, {"Ticker": "WDC", **_SNDK_PRE_SPLIT_VALUES})
