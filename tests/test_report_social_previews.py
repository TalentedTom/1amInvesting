import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import report_social_previews as previews


class ReportSocialPreviewTests(unittest.TestCase):
    def test_generated_page_is_specific_safe_and_follows_public_manifest(self):
        with tempfile.TemporaryDirectory() as temp:
            repo = Path(temp)
            rows = {"en": [{"Ticker": "ANT", "Name": "Anthropic (Equity MC, USD B)"},
                           {"Ticker": "TWO", "Name": "A & B"}]}
            (repo / "data.js").write_text("window.PORTFOLIO_DATA = " + json.dumps(rows) + ";", encoding="utf-8")
            (repo / "deep-dives").mkdir()
            manifest = {"ANT": {"format": "pdf", "version": "a" * 16},
                        "TWO": {"format": "pdf", "version": "b" * 16}}
            def render(pdf, output, name, ticker):
                output.write_bytes(b"preview")
            with patch.object(previews, "_render_cover", side_effect=render) as mock:
                previews.generate_all(repo, manifest)
                self.assertEqual(mock.call_count, 2)
                previews.generate_all(repo, manifest)
                self.assertEqual(mock.call_count, 2)
                ant = (repo / "r/ANT/index.html").read_text(encoding="utf-8")
                self.assertIn('content="Anthropic (ANT) | 1amInvesting Research"', ant)
                self.assertIn('content="summary"', ant)
                self.assertIn('https://www.1aminvesting.com/r/ANT/cover.png?v=', ant)
                self.assertIn('window.location.replace("/?report=ANT")', ant)
                other = (repo / "r/TWO/index.html").read_text(encoding="utf-8")
                self.assertIn("A &amp; B", other)
                previews.generate_all(repo, {"ANT": manifest["ANT"]})
                self.assertFalse((repo / "r/TWO").exists())

    def test_unmanaged_page_and_unsafe_tickers_are_rejected(self):
        with tempfile.TemporaryDirectory() as temp:
            repo = Path(temp)
            (repo / "data.js").write_text('window.PORTFOLIO_DATA = {"en":[{"Ticker":"ANT","Name":"Anthropic"}]};')
            folder = repo / "r/ANT"
            folder.mkdir(parents=True)
            (folder / "index.html").write_text("custom page")
            with self.assertRaises(ValueError):
                previews.generate_all(repo, {"ANT": {"format":"pdf", "version":"a"*16}})
            with self.assertRaises(ValueError):
                previews.generate_all(repo, {"../private": {"format":"pdf", "version":"a"*16}})


if __name__ == "__main__":
    unittest.main()
