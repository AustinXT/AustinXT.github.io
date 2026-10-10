#!/usr/bin/env python3
"""仅用自建内存/临时目录回归；不读取实际工程导出，不联网。"""
import importlib.util
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

sys.dont_write_bytecode = True
SCRIPT = Path(__file__).absolute().with_name('check-site-export.py')
SPEC = importlib.util.spec_from_file_location('site_export', SCRIPT)
CHECK = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(CHECK)
ASSETS = {'/_next/static/app.js', '/_next/static/app.css', '/favicon.ico'}
ESSAY_MAIN = ('<h1>one</h1><nav aria-label="文章目录"><a href="#intro">引子</a></nav>'
              '<article data-essay-body><h2 id="intro">引子</h2><p>正文</p></article><a href="/essays/">返回随笔</a>')
WORK = '<section data-work-preview><p>非实际作品</p><a href="/works/">返回作品</a></section>'
ONE = (('one', '2019-12-23'),)
YEARS = '<ul><li data-year="2019"><a href="/essays/2019/">2019</a></li></ul>'


def item(slug, date):
    return f'<li data-article="/essays/{slug}/"><time datetime="{date}">{date[5:]}</time><a href="/essays/{slug}/">{slug}</a></li>'


def frame(route, content):
    owner = '/essays/' if route.startswith('/essays/') else '/works/' if route.startswith('/works/') else route
    menu = ''.join(f'<a href="{href}"' + (' aria-current="page"' if href == owner else '') + f'>{label}</a>' for href, label in CHECK.MENU)
    return ('<!doctype html><html lang="zh-CN"><head><link rel="stylesheet" href="/_next/static/app.css"><link rel="icon" href="/favicon.ico"><script src="/_next/static/app.js" async></script></head><body>'
            '<a href="#main-content">跳到正文</a><nav id="main-menu">' + menu + '</nav><p data-site-notice>工程预览 · 未公开发布</p><main id="main-content">' + content + '</main><script>self.__next_f.push([1,"生成 RSC 文本"])</script></body></html>')


def fixtures(essays=ONE, size=None):
    """按构建端规则生成导出：日期倒序、同日按 slug；年份页每 size 篇分一页。"""
    size = size or CHECK.YEAR_PAGE_SIZE
    essays = sorted(sorted(essays), key=lambda e: e[1], reverse=True)
    years = {}
    for slug, date in essays:
        years.setdefault(date[:4], []).append((slug, date))
    timeline = ('<ul>' + ''.join(f'<li data-year="{y}"><a href="/essays/{y}/">{y}</a></li>' for y in years) + '</ul>'
                if essays else '<p data-index-empty>尚未迁入正文</p>')
    recent = '<ul>' + ''.join(item(*e) for e in essays[:CHECK.HOME_RECENT]) + '</ul>' if essays else ''
    content = {
        '/': ''.join(f'<section id="{key}">{recent if key == "overview-essays" else ""}<a href="{href}">{key}</a></section>' for key, href in (
            ('overview-about', '/about/'), ('overview-essays', '/essays/'),
            ('overview-works', '/works/'), ('overview-contact', '/about/#contact'))),
        '/essays/': '<section id="featured-categories"><p data-index-empty>分类待确认</p><a href="/essays/categories/">全部分类</a></section><section id="featured-tags"><p data-index-empty>待确认</p><a href="/essays/tags/">全部标签</a></section><section id="timeline">' + timeline + '</section>',
        '/about/': '<section id="contact">联系方式待确认</section>',
        '/works/': '<div data-work-list><p data-index-empty>待确认</p></div><a href="/works/preview/">非实际作品排版预览</a>',
        '/essays/categories/': '<p data-index-empty>尚未迁入正文</p>',
        '/essays/tags/': '<p data-index-empty>待确认</p>',
        '/works/preview/': WORK,
    }
    for slug, _ in essays:
        content[f'/essays/{slug}/'] = ESSAY_MAIN.replace('<h1>one</h1>', f'<h1>{slug}</h1>')
    for year, items in years.items():
        for k in range(0, len(items), size):
            route = f'/essays/{year}/' if k == 0 else f'/essays/{year}/page/{k // size + 1}/'
            content[route] = '<section><ul>' + ''.join(item(*e) for e in items[k:k + size]) + '</ul></section><a href="/essays/">返回随笔</a>'
    return {route: frame(route, html) for route, html in content.items()}


def write_export(root):
    for route, html in fixtures().items():
        path = root / route.lstrip('/') / 'index.html'
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(html, encoding='utf-8')
    for asset in ASSETS:
        path = root / asset.lstrip('/')
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text('/* 自建资源 */', encoding='utf-8')


class Contract(unittest.TestCase):
    def test_valid_framework_export(self):
        self.assertEqual(CHECK.check(fixtures(), ASSETS), [])

    def test_svg_and_encoded_local_target(self):
        pages = fixtures()
        pages['/about/'] = pages['/about/'].replace('</main>', '<svg><defs><path id="icon" d="M0 0"></path></defs><use href="#icon"></use><line x1="0" x2="1"></line></svg><a href="/%65ssays/">编码本地入口</a></main>')
        self.assertEqual(CHECK.check(pages, ASSETS), [])

    def test_dom_mutations(self):
        cases = [
            ('lang', '/', 'lang="zh-CN"', 'lang="en"'),
            ('wrong-main-tag', '/', '<main id="main-content">', '<div id="main-content">'),
            ('duplicate-main', '/', '</main>', '</main><main>额外正文</main>'),
            ('main-hidden-ancestor', '/', '<main id="main-content">', '<div hidden><main id="main-content">'),
            ('notice-hidden-child', '/', '工程预览 · 未公开发布', '<span hidden>工程预览 · 未公开发布</span>'),
            ('notice-rsc-only', '/', '<p data-site-notice>工程预览 · 未公开发布</p>', '<script>"<p data-site-notice>工程预览 · 未公开发布</p>"</script>'),
            ('notice-aria-ancestor', '/', '<p data-site-notice>', '<div aria-hidden="true"><p data-site-notice>'),
            ('notice-inert', '/', '<p data-site-notice>', '<p inert data-site-notice>'),
            ('notice-template', '/', '<p data-site-notice>', '<template><p data-site-notice>'),
            ('notice-noscript', '/', '<p data-site-notice>', '<noscript><p data-site-notice>'),
            ('notice-head', '/', '<p data-site-notice>', '<head><p data-site-notice>'),
            ('notice-display', '/', '<p data-site-notice>', '<p style="display: none !important" data-site-notice>'),
            ('notice-visibility', '/', '<p data-site-notice>', '<p style="visibility:hidden" data-site-notice>'),
            ('notice-content-visibility', '/', '<p data-site-notice>', '<p style="content-visibility:hidden" data-site-notice>'),
            ('notice-stylesheet', '/', '<p data-site-notice>', '<style>.secret{display:none}</style><p class="secret" data-site-notice>'),
            ('nav-tag', '/', '<nav id="main-menu">', '<div id="main-menu">'),
            ('nav-main-scope', '/', '<nav id="main-menu">', '<main><nav id="main-menu">'),
            ('nav-hidden', '/', '<nav id="main-menu">', '<nav hidden id="main-menu">'),
            ('wrong-menu-current', '/essays/one/', 'href="/essays/" aria-current="page"', 'href="/essays/" aria-current="false"'),
            ('wrong-menu-owner', '/works/preview/', 'href="/works/" aria-current="page"', 'href="/about/" aria-current="page"'),
            ('menu-extra', '/', '</nav>', '<a href="/">额外项</a></nav>'),
            ('contact-wrong-target', '/', 'href="/about/#contact"', 'href="/about/"'),
            ('contact-hidden', '/about/', '<section id="contact">', '<section hidden id="contact">'),
            ('contact-outside-main', '/about/', '<section id="contact">联系方式待确认</section>', '</main><section id="contact">联系方式待确认</section><main>'),
            ('overview-nested', '/', '<section id="overview-about">', '<div><section id="overview-about">'),
            ('index-hidden-empty', '/essays/', '<p data-index-empty>待确认</p>', '<p hidden data-index-empty>待确认</p>'),
            ('index-wrong-link', '/essays/', 'href="/essays/tags/"', 'href="/essays/categories/"'),
            ('fake-year', '/essays/', '<section id="timeline">', '<section id="timeline" data-year="2026">'),
            ('taxonomy-nonempty', '/essays/tags/', '<p data-index-empty>待确认</p>', '<p>已完整收录</p>'),
            ('article-plain', '/essays/one/', '<article data-essay-body>', '<article>'),
            ('article-rsc-only', '/essays/one/', '<article data-essay-body><h2 id="intro">引子</h2><p>正文</p></article>', '<script>"<article data-essay-body>正文</article>"</script>'),
            ('article-wrong-scope', '/essays/one/', '<article data-essay-body>', '</main><article data-essay-body>'),
            ('article-duplicate', '/', '</main>', '<article data-essay-body>正文</article></main>'),
            ('article-no-return', '/essays/one/', '<a href="/essays/">返回随笔</a>', ''),
            ('toc-missing-anchor', '/essays/one/', '<h2 id="intro">', '<h2>'),
            ('year-index-missing', '/essays/', 'data-year="2019"', 'data-yr="2019"'),
            ('year-index-wrong-link', '/essays/', 'href="/essays/2019/"', 'href="/essays/"'),
            ('year-index-outside-timeline', '/essays/', '<section id="timeline">' + YEARS + '</section>', '<section id="timeline"></section>' + YEARS),
            ('index-article-entry', '/essays/', '</main>', item('one', '2019-12-23') + '</main>'),
            ('year-item-hidden', '/essays/2019/', '<li data-article', '<li hidden data-article'),
            ('year-item-no-date', '/essays/2019/', '<time datetime="2019-12-23">', '<time>'),
            ('year-item-wrong-target', '/essays/2019/', '<a href="/essays/one/">', '<a href="/essays/">'),
            ('year-no-return', '/essays/2019/', '<a href="/essays/">返回随笔</a>', ''),
            ('home-recent-missing', '/', '<li data-article="/essays/one/">', '<li>'),
            ('work-hidden-text', '/works/preview/', '<p>非实际作品</p>', '<p hidden>非实际作品</p>'),
            ('work-real-list', '/works/', '<div data-work-list>', '<div data-work-list><a href="/works/preview/">作品</a>'),
            ('work-hidden-entry', '/works/', '<a href="/works/preview/">', '<a hidden href="/works/preview/">'),
            ('form', '/', '</main>', '<form></form></main>'),
            ('iframe', '/', '</main>', '<iframe></iframe></main>'),
            ('base', '/', '</head>', '<base href="/"></head>'),
            ('refresh', '/', '</head>', '<meta http-equiv="Refresh" content="0;url=https://example.com"></head>'),
            ('event', '/', '<main id="main-content">', '<main id="main-content" onclick="run()">'),
            ('external-src', '/', '/_next/static/app.js', 'https://example.com/app.js'),
            ('external-link', '/', '/_next/static/app.css', '//example.com/app.css'),
            ('missing-asset', '/', '/_next/static/app.js', '/_next/static/missing.js'),
            ('css-external', '/', '</head>', '<style>body{background:url(https://example.com/a)}</style></head>'),
            ('css-import', '/', '</head>', '<style>@import "https://example.com/a";</style></head>'),
            ('svg-external', '/', '</main>', '<svg><use href="https://example.com/icon#x"></use></svg></main>'),
            ('svg-missing-id', '/', '</main>', '<svg><use href="#absent"></use></svg></main>'),
            ('ping', '/', 'href="/about/#contact"', 'href="/about/#contact" ping="/"'),
            ('action', '/', '<main id="main-content">', '<main id="main-content" action="https://example.com">'),
            ('formaction', '/', '<main id="main-content">', '<main id="main-content" formaction="/">'),
            ('srcset', '/', '</main>', '<img srcset="https://example.com/a 1x"></main>'),
            ('unknown-route', '/', '</main>', '<a href="/private/">越界</a></main>'),
            ('missing-fragment', '/', '</main>', '<a href="/about/#absent">坏锚点</a></main>'),
        ]
        for name, route, old, new in cases:
            with self.subTest(name=name):
                pages = fixtures()
                self.assertIn(old, pages[route])
                pages[route] = pages[route].replace(old, new)
                self.assertTrue(CHECK.check(pages, ASSETS), name)

    def test_encoded_urls(self):
        for value in ('https&#58;//example.com', '%256a%2561vascript%253aalert(1)', '%252f%252fexample.com/a', '/%2e%2e/about/', '/essays/%252e%252e/', '/%5cexample.com', '/about/&#10;', '/about/%00', '/about/?x=1', 'data:text/plain,x', '/about/#'):
            with self.subTest(value=value):
                pages = fixtures()
                pages['/'] = pages['/'].replace('</main>', f'<a href="{value}">反例</a></main>')
                self.assertTrue(CHECK.check(pages, ASSETS))

    def test_missing_and_extra_route(self):
        pages = fixtures()
        del pages['/about/']
        self.assertTrue(CHECK.check(pages, ASSETS))
        # 借用一张本身合规、归属随笔的空态页，只让「路由形状」这一条规则来判
        for route in ('/essays/Bad/', '/essays/2019/page/1/', '/essays/19/', '/essays/2019/page/x/', '/essays/one/extra/'):
            with self.subTest(route=route):
                pages = fixtures()
                pages[route] = pages['/essays/categories/']
                self.assertTrue(CHECK.check(pages, ASSETS))
        pages = fixtures()
        pages['/private/'] = pages['/about/']
        self.assertTrue(CHECK.check(pages, ASSETS))

    def test_year_item_wrong_year(self):
        # 首页与年份页同改，免得被「首页须为最新」先拦下
        pages = fixtures()
        for route in ('/', '/essays/2019/'):
            pages[route] = pages[route].replace('datetime="2019-12-23"', 'datetime="2018-12-23"')
        self.assertEqual(CHECK.check(pages, ASSETS), ['/essays/2019/：条目日期不属于该年'])


    def test_balanced_visibility_and_scope(self):
        for tag, end in (('<div hidden>', '</div>'), ('<div aria-hidden="true">', '</div>'),
                         ('<div inert>', '</div>'), ('<template>', '</template>'),
                         ('<noscript>', '</noscript>'), ('<div style="display:none">', '</div>'),
                         ('<div style="visibility:hidden">', '</div>'),
                         ('<div style="content-visibility:hidden">', '</div>')):
            for target in ('main', 'notice', 'nav'):
                with self.subTest(wrapper=tag, target=target):
                    pages = fixtures()
                    html = pages['/']
                    start = {'main': '<main id="main-content">', 'notice': '<p data-site-notice>', 'nav': '<nav id="main-menu">'}[target]
                    closing = {'main': '</main>', 'notice': '</p>', 'nav': '</nav>'}[target]
                    begin = html.index(start)
                    finish = html.index(closing, begin) + len(closing)
                    pages['/'] = html[:begin] + tag + html[begin:finish] + end + html[finish:]
                    self.assertEqual(CHECK.Document(pages['/']).errors, [])
                    self.assertTrue(CHECK.check(pages, ASSETS))
        for route, old, new in (
            ('/essays/one/', '</main>', '<article>未标记额外正文</article></main>'),
            ('/works/', '<div data-work-list>', '<div data-work-list><li>虚构作品</li>'),
            ('/essays/one/', '<main id="main-content">' + ESSAY_MAIN + '</main>', ESSAY_MAIN + '<main id="main-content"></main>')):
            pages = fixtures()
            pages[route] = pages[route].replace(old, new)
            self.assertEqual(CHECK.Document(pages[route]).errors, [])
            self.assertTrue(CHECK.check(pages, ASSETS))
        pages = fixtures()
        html = pages['/']
        begin = html.index('<nav id="main-menu">')
        finish = html.index('</nav>', begin) + len('</nav>')
        menu = html[begin:finish]
        pages['/'] = (html[:begin] + html[finish:]).replace('<main id="main-content">', '<main id="main-content">' + menu)
        self.assertEqual(CHECK.Document(pages['/']).errors, [])
        self.assertTrue(CHECK.check(pages, ASSETS))

    def test_returns_required(self):
        for route, href, label in (('/essays/one/', '/essays/', '返回随笔'), ('/essays/2019/', '/essays/', '返回随笔'),
                                   ('/works/preview/', '/works/', '返回作品')):
            anchor = f'<a href="{href}">{label}</a>'
            for replacement in ('', f'<a href="{href}"></a>',
                                f'<a hidden href="{href}">{label}</a>'):
                with self.subTest(route=route, replacement=replacement):
                    pages = fixtures()
                    pages[route] = pages[route].replace(anchor, replacement)
                    self.assertEqual(CHECK.Document(pages[route]).errors, [])
                    self.assertTrue(CHECK.check(pages, ASSETS))

    def test_collapsed_details(self):
        for target, start, end in (('main', '<main id="main-content">', '</main>'),
                                   ('nav', '<nav id="main-menu">', '</nav>')):
            for opened in (False, True):
                with self.subTest(target=target, opened=opened):
                    pages = fixtures()
                    html = pages['/']
                    begin = html.index(start)
                    finish = html.index(end, begin) + len(end)
                    prefix = '<details open>' if opened else '<details>'
                    pages['/'] = html[:begin] + prefix + '<summary>展开</summary>' + html[begin:finish] + '</details>' + html[finish:]
                    self.assertEqual(CHECK.Document(pages['/']).errors, [])
                    self.assertEqual(bool(CHECK.check(pages, ASSETS)), not opened)
        for body, valid in (('<summary>工程预览 · 未公开发布</summary>', True),
                            ('<summary>展开</summary>工程预览 · 未公开发布', False),
                            ('<summary>展开</summary><summary>工程预览 · 未公开发布</summary>', False)):
            with self.subTest(body=body):
                pages = fixtures()
                pages['/'] = pages['/'].replace('<p data-site-notice>工程预览 · 未公开发布</p>', '<details data-site-notice>' + body + '</details>')
                self.assertEqual(bool(CHECK.check(pages, ASSETS)), not valid)

    def test_svg_nonpainting_claims(self):
        for container in ('defs', 'symbol', 'clipPath', 'mask', 'pattern', 'marker', 'title', 'desc'):
            for route, old, attrs, label in (
                ('/essays/tags/', '<p data-index-empty>待确认</p>', 'data-index-empty', '待确认'),
                ('/works/preview/', '<p>非实际作品</p>', '', '非实际作品')):
                with self.subTest(container=container, route=route):
                    pages = fixtures()
                    hidden = f'<svg><{container}><text {attrs}>{label}</text></{container}></svg>'
                    pages[route] = pages[route].replace(old, hidden)
                    self.assertEqual(CHECK.Document(pages[route]).errors, [])
                    self.assertTrue(CHECK.check(pages, ASSETS))

    def test_empty_index_integrity(self):
        self.assertEqual(CHECK.check(fixtures(essays=()), ASSETS), [])
        pages = fixtures(essays=())
        pages['/essays/'] = pages['/essays/'].replace('<section id="timeline"><p data-index-empty>尚未迁入正文</p></section>', '<section id="timeline"></section>')
        self.assertTrue(CHECK.check(pages, ASSETS))
        pages = fixtures(essays=())
        pages['/essays/'] = pages['/essays/'].replace('</section></main>', '<div data-year="2026">2026</div></section></main>')
        self.assertTrue(CHECK.check(pages, ASSETS))
        for route, anchor in (('/essays/', '<p data-index-empty>分类待确认</p>'), ('/essays/', '<p data-index-empty>待确认</p>'),
                              ('/essays/categories/', '</main>'), ('/essays/tags/', '</main>')):
            for index in ('<ul><li>已确认分类</li></ul>', '<ol><li>已迁文章</li></ol>',
                          '<div data-category="x">已确认分类</div>', '<div data-tag="x">已确认专题</div>'):
                with self.subTest(route=route, anchor=anchor, index=index):
                    pages = fixtures()
                    pages[route] = pages[route].replace(anchor, index + anchor)
                    self.assertEqual(CHECK.Document(pages[route]).errors, [])
                    self.assertTrue(CHECK.check(pages, ASSETS))

    def test_download_navigation(self):
        for route in fixtures():
            with self.subTest(route=route):
                pages = fixtures()
                pages[route] = pages[route].replace('<a href=', '<a download="" href=')
                self.assertEqual(CHECK.Document(pages[route]).errors, [])
                self.assertTrue(CHECK.check(pages, ASSETS))

    def test_assets_default_and_input_types(self):
        self.assertTrue(CHECK.check(fixtures()))
        for pages, assets in ((None, ASSETS), ({'/': b'html'}, ASSETS), (fixtures(), ['/_next/a'])):
            with self.assertRaises(ValueError):
                CHECK.check(pages, assets)


class Derived(unittest.TestCase):
    """年份分页、覆盖与首页速览；上限临时调成 2，免得造上百篇夹具。"""
    FOUR = (('a', '2019-03-01'), ('b', '2019-02-01'), ('c', '2019-01-01'), ('d', '2018-05-05'))

    def setUp(self):
        self.size, CHECK.YEAR_PAGE_SIZE = CHECK.YEAR_PAGE_SIZE, 2

    def tearDown(self):
        CHECK.YEAR_PAGE_SIZE = self.size

    def test_paginated_year_passes(self):
        pages = fixtures(self.FOUR)
        self.assertIn('/essays/2019/page/2/', pages)
        self.assertEqual(CHECK.check(pages, ASSETS), [])

    def test_page_over_cap(self):
        self.assertTrue(CHECK.check(fixtures(self.FOUR, size=3), ASSETS))

    def test_premature_page(self):
        self.assertTrue(CHECK.check(fixtures(self.FOUR, size=1), ASSETS))

    def test_page_gap(self):
        pages = fixtures(self.FOUR)
        pages['/essays/2019/page/3/'] = pages.pop('/essays/2019/page/2/')
        self.assertTrue(CHECK.check(pages, ASSETS))

    def test_essay_listed_twice(self):
        pages = fixtures(self.FOUR)
        pages['/essays/2018/'] = pages['/essays/2018/'].replace('</ul>', item('d', '2018-05-05') + '</ul>')
        self.assertTrue(CHECK.check(pages, ASSETS))

    def test_essay_unlisted(self):
        pages = fixtures(self.FOUR)
        pages['/essays/e/'] = pages['/essays/a/']
        self.assertTrue(CHECK.check(pages, ASSETS))

    def test_order(self):
        pages = fixtures(self.FOUR)
        a, b = item('a', '2019-03-01'), item('b', '2019-02-01')
        pages['/essays/2019/'] = pages['/essays/2019/'].replace(a + b, b + a)
        self.assertTrue(CHECK.check(pages, ASSETS))

    def test_home_not_latest(self):
        pages = fixtures(self.FOUR)
        pages['/'] = pages['/'].replace(item('a', '2019-03-01'), '')
        self.assertTrue(CHECK.check(pages, ASSETS))

    def test_home_capped(self):
        many = tuple((f'p{i}', f'2019-01-{i + 1:02d}') for i in range(CHECK.HOME_RECENT + 1))
        CHECK.YEAR_PAGE_SIZE = 100
        self.assertEqual(CHECK.check(fixtures(many), ASSETS), [])
        pages = fixtures(many)
        pages['/'] = pages['/'].replace('</ul>', item('p0', '2019-01-01') + '</ul>', 1)
        self.assertTrue(CHECK.check(pages, ASSETS))

class Filesystem(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        # macOS /var 通常为软链接；自建夹具选定真实父目录，而非让 load 吞掉软链。
        self.base = Path(self.temp.name).resolve()
        self.root = self.base / 'out'
        self.root.mkdir()
        write_export(self.root)

    def tearDown(self):
        self.temp.cleanup()

    def cli(self, *args):
        return subprocess.run([sys.executable, '-I', str(SCRIPT), *map(str, args)], capture_output=True, text=True)

    def test_load_and_cli_positive(self):
        self.assertEqual(CHECK.check(*CHECK.load(self.root)), [])
        self.assertEqual(self.cli(self.root).returncode, 0)

    def test_unregistered_paths_not_read(self):
        (self.root / 'private').symlink_to('/nonexistent', target_is_directory=True)
        self.assertEqual(CHECK.check(*CHECK.load(self.root)), [])

    def test_derived_routes_loaded(self):
        pages, _ = CHECK.load(self.root)
        self.assertTrue({'/essays/one/', '/essays/2019/'} <= set(pages))

    def test_symlink_under_essays(self):
        (self.root / 'essays' / 'evil').symlink_to(self.base, target_is_directory=True)
        with self.assertRaises(ValueError):
            CHECK.load(self.root)
        self.assertEqual(self.cli(self.root).returncode, 2)

    def test_unknown_shape_cli(self):
        path = self.root / 'essays' / 'Bad' / 'index.html'
        path.parent.mkdir()
        path.write_text(fixtures()['/essays/one/'], encoding='utf-8')
        self.assertEqual(self.cli(self.root).returncode, 1)

    def test_missing_route_and_cli_failure(self):
        (self.root / 'about/index.html').unlink()
        with self.assertRaises(OSError):
            CHECK.load(self.root)
        self.assertNotEqual(self.cli(self.root).returncode, 0)

    def test_contract_cli_failure(self):
        path = self.root / 'index.html'
        path.write_text(fixtures()['/'].replace('lang="zh-CN"', 'lang="en"'), encoding='utf-8')
        self.assertEqual(self.cli(self.root).returncode, 1)
        self.assertEqual(self.cli(self.root, self.root).returncode, 2)

    def test_missing_asset_cli_failure(self):
        (self.root / '_next/static/app.js').unlink()
        self.assertEqual(self.cli(self.root).returncode, 1)

    def test_symlinks(self):
        for kind in ('root', 'parent', 'html', 'route-parent', 'asset', 'asset-dir', 'favicon', 'dangling-asset'):
            with self.subTest(kind=kind), tempfile.TemporaryDirectory(dir=self.base) as directory:
                base = Path(directory)
                root = base / 'out'
                root.mkdir()
                write_export(root)
                if kind == 'root':
                    link = base / 'link'
                    link.symlink_to(root, target_is_directory=True)
                    root = link
                elif kind == 'parent':
                    link = base / 'link'
                    link.symlink_to(base, target_is_directory=True)
                    root = link / 'out'
                elif kind == 'route-parent':
                    source = root / 'about'
                    moved = base / 'about'
                    source.rename(moved)
                    source.symlink_to(moved, target_is_directory=True)
                elif kind == 'asset-dir':
                    source = root / '_next'
                    moved = base / 'next'
                    source.rename(moved)
                    source.symlink_to(moved, target_is_directory=True)
                else:
                    relative = {'html': 'about/index.html', 'asset': '_next/static/app.js', 'favicon': 'favicon.ico', 'dangling-asset': '_next/static/dangling.js'}[kind]
                    path = root / relative
                    target = base / 'target'
                    if kind != 'dangling-asset':
                        path.rename(target)
                    path.symlink_to(target)
                with self.assertRaises((ValueError, OSError)):
                    CHECK.load(root)
                self.assertNotEqual(self.cli(root).returncode, 0)


if __name__ == '__main__':
    unittest.main(verbosity=2)
