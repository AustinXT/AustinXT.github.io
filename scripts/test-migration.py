#!/usr/bin/env python3
"""check-migration.py 的反例回归：仅用自建内存与临时目录，不读实际台账、正文或原件，不联网。"""
import importlib.util
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

sys.dont_write_bytecode = True
SCRIPT = Path(__file__).absolute().with_name('check-migration.py')
SPEC = importlib.util.spec_from_file_location('migration', SCRIPT)
CHECK = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(CHECK)

NEW = 'src/site/content/essays/one.md'
OLD = 'vault/raw/blog/posts/2019-01-01-one.md'
ORIGIN = '---\ntitle: 旧题\ndate: 2019-01-01\ntags: [x]\n---\n\n开头一段。\n\n### 小节\n\n#### 细目\n\n正文一段。\n'
ESSAY = '---\ntitle: 新题\ndate: 2019-01-01\nslug: one\n---\n\n开头一段。\n\n## 小节\n\n### 细目\n\n正文一段。\n'


def ledger(*rows):
    head = '# 台账\n\n## 台账\n\n| 新正文 | 原件 | 保留方式 | 旧网址 | 新网址 | 状态 |\n|---|---|---|---|---|---|\n'
    rows = rows or (f'| `{NEW}` | `{OLD}` | 原样 | `/one/` | `/essays/one/` | 待核对 |',)
    return head + '\n'.join(rows) + '\n\n## 列的含义\n\n| `不是台账行` | x | 原样 |\n'


def run(text=None, sources=None, origins=None):
    sources = {NEW: ESSAY} if sources is None else sources
    origins = {OLD: ORIGIN} if origins is None else origins
    return CHECK.check(ledger() if text is None else text, sources, origins)


class MigrationTest(unittest.TestCase):
    def assertFails(self, result, fragment):
        errors, _ = result
        self.assertTrue(any(fragment in e for e in errors), errors)

    def test_good_passes(self):
        self.assertEqual(run(), ([], []))

    def test_rows_only_from_ledger_section(self):
        self.assertEqual([e['new'] for e in CHECK.rows(ledger())], [NEW])

    def test_unregistered_essay(self):
        self.assertFails(run(sources={NEW: ESSAY, 'src/site/content/essays/two.md': ESSAY}), '须在台账登记')

    def test_registered_twice(self):
        row = f'| `{NEW}` | `{OLD}` | 原样 | x | x | x |'
        self.assertFails(run(text=ledger(row, row)), '只登记一次')

    def test_ledger_row_without_essay(self):
        self.assertFails(run(sources={}), '正文不存在')

    def test_origin_outside_vault(self):
        for origin in ('notes/x.md', 'vault/raw/../../etc/passwd'):
            with self.subTest(origin=origin):
                self.assertFails(run(text=ledger(f'| `{NEW}` | `{origin}` | 原样 | x | x | x |')), 'vault/raw/')

    def test_unknown_mode(self):
        self.assertFails(run(text=ledger(f'| `{NEW}` | `{OLD}` | 照搬 | x | x | x |')), '保留方式')

    def test_date_mismatch(self):
        self.assertFails(run(sources={NEW: ESSAY.replace('date: 2019-01-01', 'date: 2019-01-02')}), '原始日期')

    def test_body_changed(self):
        self.assertFails(run(sources={NEW: ESSAY.replace('正文一段', '正文改了')}), '第 7 行起')

    def test_body_truncated(self):
        self.assertFails(run(sources={NEW: ESSAY.replace('\n正文一段。\n', '\n')}), '与原件不同')

    def test_heading_not_lifted(self):
        self.assertFails(run(sources={NEW: ESSAY.replace('## 小节', '### 小节').replace('### 细目', '#### 细目')}), '与原件不同')

    def test_rewrite_mode_skips_body_compare(self):
        row = f'| `{NEW}` | `{OLD}` | 改写 | x | x | x |'
        self.assertEqual(run(text=ledger(row), sources={NEW: ESSAY.replace('正文一段', '正文改了')}), ([], []))

    def test_origin_absent_is_reported_not_passed_silently(self):
        self.assertEqual(run(origins={}), ([], [NEW]))

    def test_missing_ledger_section(self):
        with self.assertRaises(ValueError):
            run(text='# 没有台账一节\n')


class CliTest(unittest.TestCase):
    def tree(self, root, essay=ESSAY, with_origin=True):
        # macOS 的临时目录经由 /var 软链接，先解析成真实路径，否则会被软链接防护拒绝
        root = Path(root).resolve()
        for rel, text in ((CHECK.LEDGER, ledger()), (NEW, essay)) + (((OLD, ORIGIN),) if with_origin else ()):
            path = root / rel
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(text, encoding='utf-8')
        return root

    def cli(self, *args):
        return subprocess.run([sys.executable, '-I', str(SCRIPT), *map(str, args)], capture_output=True, text=True)

    def test_exit_codes(self):
        with tempfile.TemporaryDirectory() as root:
            self.assertEqual(self.cli(self.tree(root)).returncode, 0)
        with tempfile.TemporaryDirectory() as root:
            result = self.cli(self.tree(root, with_origin=False))
            self.assertEqual(result.returncode, 0)
            self.assertIn('没有逐字比对', result.stdout)
        with tempfile.TemporaryDirectory() as root:
            self.assertEqual(self.cli(self.tree(root, essay=ESSAY.replace('正文一段', '改'))).returncode, 1)
        with tempfile.TemporaryDirectory() as root:
            self.assertEqual(self.cli(Path(root, 'nope')).returncode, 2)
            self.assertEqual(self.cli('a', 'b').returncode, 2)

    def test_symlinked_origin_refused(self):
        with tempfile.TemporaryDirectory() as root:
            root = self.tree(root)
            real = root / 'elsewhere.md'
            real.write_text(ORIGIN, encoding='utf-8')
            (root / OLD).unlink()
            os.symlink(real, root / OLD)
            self.assertEqual(self.cli(root).returncode, 2)


if __name__ == '__main__':
    unittest.main()
