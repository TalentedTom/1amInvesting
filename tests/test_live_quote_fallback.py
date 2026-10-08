"""A valid ticker must survive a failed FastInfo/chart request."""
import sys
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from fetch_live import fetch_one


class BrokenFastInfo:
    @property
    def last_price(self):
        raise KeyError('currentTradingPeriod')


class QuoteFallbackTests(unittest.TestCase):
    def ticker(self, fast=None, info=None):
        return SimpleNamespace(fast_info=fast or BrokenFastInfo(), get_info=Mock(return_value=info or {}))

    def test_aaoi_chart_failure_uses_regular_market_quote(self):
        ticker = self.ticker(info={'regularMarketPrice': 107.46, 'currency': 'USD', 'regularMarketPreviousClose': 122.54})
        yf = SimpleNamespace(Ticker=Mock(return_value=ticker))
        self.assertEqual(fetch_one(yf, 'AAOI'), (107.46, 'USD', -12.31))
        ticker.get_info.assert_called_once()

    def test_healthy_fast_info_needs_no_extra_request(self):
        ticker = self.ticker(fast=SimpleNamespace(last_price=110, currency='USD', previous_close=100))
        self.assertEqual(fetch_one(SimpleNamespace(Ticker=lambda _: ticker), 'AAOI'), (110.0, 'USD', 10.0))
        ticker.get_info.assert_not_called()

    def test_invalid_fast_price_can_use_current_price_without_previous_close(self):
        ticker = self.ticker(fast=SimpleNamespace(last_price=float('nan'), currency='USD'),
                             info={'regularMarketPrice': 0, 'currentPrice': 107.46, 'currency': 'USD'})
        self.assertEqual(fetch_one(SimpleNamespace(Ticker=lambda _: ticker), 'AAOI'), (107.46, 'USD', None))

    def test_invalid_fallback_never_publishes_a_fake_quote(self):
        for info in ({'regularMarketPrice': -5, 'currency': 'USD'},
                     {'regularMarketPrice': 107.46}, {'regularMarketPrice': float('nan'), 'currency': 'USD'}):
            ticker = self.ticker(info=info)
            self.assertEqual(fetch_one(SimpleNamespace(Ticker=lambda _: ticker), 'AAOI'), (None, None, None))

    def test_all_sources_failing_still_tries_exchange_alias(self):
        first = self.ticker()
        first.get_info.side_effect = RuntimeError('temporary quote error')
        second = self.ticker(info={'regularMarketPrice': 25, 'currency': 'CNY', 'previousClose': 20})
        yf = SimpleNamespace(Ticker=Mock(side_effect=[first, second]))
        self.assertEqual(fetch_one(yf, '688409.SH'), (25.0, 'CNY', 25.0))
        self.assertEqual([c.args[0] for c in yf.Ticker.call_args_list], ['688409.SH', '688409.SS'])


if __name__ == '__main__':
    unittest.main()
