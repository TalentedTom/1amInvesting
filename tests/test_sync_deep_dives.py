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

    def test_all_stock_pdfs_are_public_but_markdown_stays_private(self):
        files = self.artifacts('MU_Micron_DeepDive.md', 'AAOI_DeepDive.md', '300308SZ_DeepDive.md')
        self.assertEqual(sync.select_artifact('MU', files), (None, None))
        self.assertEqual(sync.select_artifact('AAOI', files), (None, None))
        self.assertEqual(sync.select_artifact('300308.SZ', files), (None, None))
        files.update(self.artifacts('MU_Micron_DeepDive.pdf'))
        self.assertEqual(sync.select_artifact('MU', files)[1], 'MU_Micron_DeepDive.pdf')
        files.update(self.artifacts('300308SZ_DeepDive.pdf'))
        self.assertEqual(sync.select_artifact('300308.SZ', files)[1], '300308SZ_DeepDive.pdf')

    def test_pdf_preferred_over_allowed_markdown(self):
        files = self.artifacts('SIVE.ST_DeepDive.md', 'SIVE.ST_DeepDive.pdf')
        self.assertEqual(sync.select_artifact('SIVE.ST', files)[0].suffix, '.pdf')

    def test_sive_markdown_is_never_a_fallback(self):
        files = self.artifacts('SIVE.ST_DeepDive.md')
        self.assertEqual(sync.select_artifact('SIVE.ST', files), (None, None))

    def test_aliases_and_versioned_wrappers(self):
        cases = [('6510.TWO', '6510TW_Chunghwa_DeepDive.pdf'),
                 ('300308.SZ', '300308SZ_Zhongji_DeepDive.pdf'),
                 ('600330.SH', '600330SSE_DeepDive.pdf'),
                 ('SKHY', 'SKHY_SKHynix_US_ADS_Wrapper_v5_0_13.pdf'),
                 ('ALRIB', 'ALRIB_Riber_DeepDive_v5_0_15.pdf')]
        files = self.artifacts(*(name for _, name in cases))
        for ticker, name in cases:
            with self.subTest(ticker=ticker):
                self.assertEqual(sync.find_match(ticker, files)[1], name)
                self.assertEqual(sync.select_artifact(ticker, files)[1], name)

    def test_company_first_and_plain_ticker_pdf_names(self):
        cases = [('3661.TW', 'Alchip_3661_TW_Deep_Dive.pdf'),
                 ('AEVA', 'Aeva_AEVA_Deep_Dive.pdf'),
                 ('688825.SH', 'CXMT_688825SH_DeepDive_Q1_2026.pdf'),
                 ('AMAT', 'Applied_Materials_AMAT_Deep_Dive.pdf'),
                 ('5991.T', 'NHK_Spring_5991_DeepDive.pdf'),
                 ('MU', 'MU.pdf')]
        files = self.artifacts(*(name for _, name in cases))
        for ticker, name in cases:
            with self.subTest(ticker=ticker):
                self.assertEqual(sync.select_artifact(ticker, files)[1], name)

    def test_framework_and_partial_ticker_do_not_match(self):
        files = self.artifacts('FRAMEWORK_v6.0.2_CONSOLIDATED.pdf', 'MU_Micron_DeepDive.pdf')
        self.assertEqual(sync.select_artifact('M', files), (None, None))
        self.assertEqual(sync.select_artifact('AAOI', files), (None, None))
        self.assertEqual(sync.select_artifact('FRAMEWORK', files), (None, None))

    def test_collision_uses_newest_and_stable_tie_break(self):
        files = self.artifacts('MU_B_DeepDive.pdf', 'MU_A_DeepDive.pdf')
        for path in files.values():
            os.utime(path, (100, 100))
        self.assertEqual(sync.find_match('MU', files)[1], 'MU_A_DeepDive.pdf')
        os.utime(files['MU_B_DeepDive.pdf'], (200, 200))
        self.assertEqual(sync.find_match('MU', files)[1], 'MU_B_DeepDive.pdf')

    def test_exchange_alias_does_not_turn_on_into_onto(self):
        files = self.artifacts('ON_onsemi_Deep_Dive.pdf', 'Onto_Innovation_ONTO_Deep_Dive.pdf')
        self.assertEqual(sync.select_artifact('ON', files)[1], 'ON_onsemi_Deep_Dive.pdf')
        self.assertEqual(sync.select_artifact('ONTO', files)[1], 'Onto_Innovation_ONTO_Deep_Dive.pdf')

    def test_manifest_versions_match_copied_content(self):
        files = self.artifacts('SIVE.ST_DeepDive.pdf', 'MU_Micron_DeepDive.pdf', 'AAOI_DeepDive.md', 'NVDA_DeepDive.md', 'UNLISTED_DeepDive.pdf')
        destination = self.root / 'deep-dives'
        destination.mkdir()
        (destination / 'MU.pdf').write_bytes(files['MU_Micron_DeepDive.pdf'].read_bytes())
        (destination / 'UNLISTED.pdf').write_bytes(b'%PDF-1.4\nold')
        for name in ['AAOI.md', '300308.SZ.md', 'SIVE.ST.md', 'OLD.md']:
            (destination / name).write_bytes(b'# Previously public')
        with patch.object(sync, 'REPO', self.root), patch.object(sync, 'DEEP_DIVES', destination), \
                patch.object(sync, 'load_artifacts', return_value=files), \
                patch.object(sync, 'load_tickers', return_value=['SIVE.ST', 'MU', 'AAOI', 'NVDA']):
            sync.main()
        manifest = json.loads((destination / 'index.json').read_text())
        self.assertEqual(set(manifest), {'SIVE.ST', 'MU'})
        for ticker, item in manifest.items():
            content = (destination / f"{ticker}.{item['format']}").read_bytes()
            self.assertEqual(item['version'], hashlib.sha256(content).hexdigest()[:16])
        self.assertEqual((destination / 'SIVE.ST.pdf').read_bytes(), files['SIVE.ST_DeepDive.pdf'].read_bytes())
        self.assertTrue((destination / 'MU.pdf').exists())
        self.assertFalse((destination / 'UNLISTED.pdf').exists())
        self.assertTrue(files['MU_Micron_DeepDive.pdf'].exists())
        self.assertTrue(files['AAOI_DeepDive.md'].exists())
        self.assertEqual({p.name for p in destination.iterdir()}, {'SIVE.ST.pdf', 'MU.pdf', 'index.json'})
        with patch.object(sync, 'REPO', self.root), patch.object(sync, 'DEEP_DIVES', destination):
            self.assertEqual(sync.prune_private_artifacts(manifest), [])

    def test_pruning_rejects_source_directory(self):
        with patch.object(sync, 'REPO', self.root), patch.object(sync, 'DEEP_DIVES', self.root):
            with self.assertRaises(ValueError):
                sync.prune_private_artifacts()


if __name__ == '__main__':
    unittest.main()
