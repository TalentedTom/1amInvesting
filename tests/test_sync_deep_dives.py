import hashlib
import json
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
import sync_deep_dives as sync


class ArtifactSyncTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)

    def artifacts(self, *names):
        result = {}
        for name in names:
            path = self.root / name
            path.write_bytes(b'%PDF-1.4\nfixture' if path.suffix.lower() == '.pdf' else b'# Research')
            result[name] = path
        return result

    def test_pdf_public_but_markdown_allowlist_unchanged(self):
        files = self.artifacts('MU_Micron_DeepDive.md', 'AAOI_DeepDive.md', '300308SZ_DeepDive.md')
        self.assertEqual(sync.select_artifact('MU', files), (None, None))
        self.assertIsNotNone(sync.select_artifact('AAOI', files)[0])
        self.assertIsNotNone(sync.select_artifact('300308.SZ', files)[0])
        files.update(self.artifacts('MU_Micron_DeepDive.pdf'))
        self.assertEqual(sync.select_artifact('MU', files)[1], 'MU_Micron_DeepDive.pdf')

    def test_pdf_preferred_over_allowed_markdown(self):
        files = self.artifacts('SIVE.ST_DeepDive.md', 'SIVE.ST_DeepDive.pdf')
        self.assertEqual(sync.select_artifact('SIVE.ST', files)[0].suffix, '.pdf')

    def test_aliases_and_versioned_wrappers(self):
        cases = [('6510.TWO', '6510TW_Chunghwa_DeepDive.pdf'),
                 ('300308.SZ', '300308SZ_Zhongji_DeepDive.pdf'),
                 ('600330.SH', '600330SSE_DeepDive.pdf'),
                 ('SKHY', 'SKHY_SKHynix_US_ADS_Wrapper_v5_0_13.pdf'),
                 ('ALRIB', 'ALRIB_Riber_DeepDive_v5_0_15.pdf')]
        files = self.artifacts(*(name for _, name in cases))
        for ticker, name in cases:
            with self.subTest(ticker=ticker):
                self.assertEqual(sync.select_artifact(ticker, files)[1], name)

    def test_framework_and_partial_ticker_do_not_match(self):
        files = self.artifacts('FRAMEWORK_v6.0.2_CONSOLIDATED.pdf', 'MU_Micron_DeepDive.pdf')
        self.assertEqual(sync.select_artifact('M', files), (None, None))
        self.assertEqual(sync.select_artifact('AAOI', files), (None, None))

    def test_collision_uses_newest_and_stable_tie_break(self):
        files = self.artifacts('MU_B_DeepDive.pdf', 'MU_A_DeepDive.pdf')
        for path in files.values():
            os.utime(path, (100, 100))
        self.assertEqual(sync.select_artifact('MU', files)[1], 'MU_A_DeepDive.pdf')
        os.utime(files['MU_B_DeepDive.pdf'], (200, 200))
        self.assertEqual(sync.select_artifact('MU', files)[1], 'MU_B_DeepDive.pdf')

    def test_manifest_versions_match_copied_content(self):
        files = self.artifacts('MU_Micron_DeepDive.pdf', 'AAOI_DeepDive.md', 'NVDA_DeepDive.md')
        destination = self.root / 'deep-dives'
        with patch.object(sync, 'REPO', self.root), patch.object(sync, 'DEEP_DIVES', destination), \
                patch.object(sync, 'load_artifacts', return_value=files), \
                patch.object(sync, 'load_tickers', return_value=['MU', 'AAOI', 'NVDA']):
            sync.main()
        manifest = json.loads((destination / 'index.json').read_text())
        self.assertEqual(set(manifest), {'MU', 'AAOI'})
        for ticker, item in manifest.items():
            content = (destination / f"{ticker}.{item['format']}").read_bytes()
            self.assertEqual(item['version'], hashlib.sha256(content).hexdigest()[:16])
        self.assertEqual((destination / 'MU.pdf').read_bytes(), files['MU_Micron_DeepDive.pdf'].read_bytes())


if __name__ == '__main__':
    unittest.main()
