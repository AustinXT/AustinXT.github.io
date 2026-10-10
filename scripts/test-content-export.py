#!/usr/bin/env python3
"""check-content-export.py 的反例回归：仅用自建内存与临时目录，不读实际工程导出，不联网。"""
import importlib.util
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

sys.dont_write_bytecode = True
SCRIPT = Path(__file__).absolute().with_name('check-content-export.py')
SPEC = importlib.util.spec_from_file_location('content_export', SCRIPT)
CHECK = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(CHECK)

SOURCE = '---\ntitle: 样本\ndate: 2026-10-10\nslug: one\n---\n\n这一行纯文本必须出现在正文里。\n\n**加粗**一段。\n\n```text\n代码里的 **星号** 不算漏出\n```\n'
BODY = '<p>这一行纯文本必须出现在正文里。</p><p><strong>加粗</strong>一段。</p><pre><code>代码里的 **星号** 不算漏出</code></pre>'


def page(body=BODY, h1='样本', article=True, in_main=True, extra=''):
    art = f'<article data-essay-body class="essay-body">{body}</article>' if article else ''
    main = f'<main id="main-content"><header><h1>{h1}</h1></header>{art if in_main else ""}</main>'
    return ('<!doctype html><html lang="zh-CN"><head><title>样本</title></head><body>' + main
            + ('' if in_main else art) + extra
            + '<script>self.__next_f.push([1,"这一行纯文本必须出现在正文里。"])</script></body></html>')


def run(sources=None, pages=None, exported=None):
    sources = {'one.md': SOURCE} if sources is None else sources
    pages = {'one': page()} if pages is None else pages
    return CHECK.check(sources, pages, set(pages) if exported is None else exported)


class ContentExportTest(unittest.TestCase):
    def assertFails(self, errors, fragment):
        self.assertTrue(any(fragment in e for e in errors), errors)

    def test_good_passes(self):
        self.assertEqual(run(), [])

    def test_missing_export(self):
        self.assertFails(run(pages={}), '缺导出页')

    def test_draft_exported(self):
        draft = SOURCE.replace('slug: one\n', 'slug: one\ndraft: true\n')
        self.assertFails(run(sources={'one.md': draft}), '草稿被导出')

    def test_draft_not_exported_passes(self):
        draft = SOURCE.replace('slug: one\n', 'slug: one\ndraft: true\n')
        self.assertEqual(run(sources={'one.md': draft}, pages={}), [])

    def test_orphan_export(self):
        self.assertFails(run(pages={'one': page(), 'ghost': page()}), '没有对应的 .md 源')

    def test_slug_filename_mismatch(self):
        self.assertFails(run(sources={'two.md': SOURCE}), '文件名与 slug 不一致')

    def test_unreadable_front_matter(self):
        self.assertFails(run(sources={'one.md': '没有 front matter\n'}), '读不到 slug 或 title')

    def test_body_only_in_script(self):
        self.assertFails(run(pages={'one': page(body='')}), '正文不在首个 HTML')

    def test_template_text_not_body(self):
        hidden = '<template>这一行纯文本必须出现在正文里。</template>'
        self.assertFails(run(pages={'one': page(body=hidden)}), '正文不在首个 HTML')

    def test_source_line_missing(self):
        self.assertFails(run(pages={'one': page(body=BODY.replace('必须出现', '被改写'))}), '行源文纯文本不在正文里')

    def test_raw_markdown_leak(self):
        self.assertFails(run(pages={'one': page(body=BODY.replace('<strong>加粗</strong>', '**加粗**'))}), '未编译的 Markdown')

    def test_markdown_link_leak(self):
        self.assertFails(run(pages={'one': page(body=BODY + '<p>[链接](/x/)</p>')}), '未编译的 Markdown')

    def test_code_block_markers_allowed(self):
        self.assertEqual(run(pages={'one': page(body=BODY + '<pre><code>## 标题\n[a](b)</code></pre>')}), [])

    def test_dangerous_tag_in_body(self):
        self.assertFails(run(pages={'one': page(body=BODY + '<script>alert(1)</script>')}), '危险标签')
        self.assertFails(run(pages={'one': page(body=BODY + '<iframe src="/x"></iframe>')}), '危险标签')

    def test_article_outside_main(self):
        self.assertFails(run(pages={'one': page(in_main=False)}), 'main#main-content')

    def test_two_articles(self):
        self.assertFails(run(pages={'one': page(extra='<article data-essay-body>复制</article>')}), '唯一')

    def test_no_article(self):
        self.assertFails(run(pages={'one': page(article=False)}), '唯一')

    def test_h1_mismatch(self):
        self.assertFails(run(pages={'one': page(h1='别的标题')}), 'h1')


class CliTest(unittest.TestCase):
    def tree(self, root, html=None):
        # macOS 的临时目录经由 /var 软链接，先解析成真实路径，否则会被软链接防护拒绝
        root = Path(root).resolve()
        content, essays = root / 'content', root / 'out' / 'essays'
        content.mkdir(parents=True)
        (content / 'one.md').write_text(SOURCE, encoding='utf-8')
        for name in ('one', 'categories', '2026'):
            (essays / name).mkdir(parents=True)
        (essays / 'one' / 'index.html').write_text(page() if html is None else html, encoding='utf-8')
        # 静态路由与年份页都不算文章
        (essays / 'categories' / 'index.html').write_text('<p>静态路由不算文章</p>', encoding='utf-8')
        (essays / '2026' / 'index.html').write_text('<p>年份页不算文章</p>', encoding='utf-8')
        return content, Path(root, 'out')

    def cli(self, *args):
        return subprocess.run([sys.executable, '-I', str(SCRIPT), *map(str, args)], capture_output=True, text=True).returncode

    def test_exit_codes(self):
        with tempfile.TemporaryDirectory() as root:
            content, out = self.tree(root)
            self.assertEqual(self.cli(content, out), 0)
        with tempfile.TemporaryDirectory() as root:
            content, out = self.tree(root, html=page(body=''))
            self.assertEqual(self.cli(content, out), 1)
        with tempfile.TemporaryDirectory() as root:
            self.assertEqual(self.cli(Path(root, 'nope'), Path(root, 'nope')), 2)
            self.assertEqual(self.cli('only-one-arg'), 2)

    def test_symlinked_page_refused(self):
        with tempfile.TemporaryDirectory() as root:
            content, out = self.tree(root)
            real = Path(root).resolve() / 'real.html'
            real.write_text(page(), encoding='utf-8')
            target = out / 'essays' / 'one' / 'index.html'
            target.unlink()
            os.symlink(real, target)
            self.assertEqual(self.cli(content, out), 2)

    def test_symlinked_content_dir_refused(self):
        with tempfile.TemporaryDirectory() as root:
            content, out = self.tree(root)
            link = Path(root).resolve() / 'content-link'
            os.symlink(content, link)
            self.assertEqual(self.cli(link, out), 2)


if __name__ == '__main__':
    unittest.main()
