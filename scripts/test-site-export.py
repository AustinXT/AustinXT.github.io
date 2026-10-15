#!/usr/bin/env python3
"""以独立内存与临时目录夹具验证内容博客契约，不读实际工程导出或联网。"""
import importlib.util
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from urllib.parse import quote

sys.dont_write_bytecode = True
SCRIPT = Path(__file__).absolute().with_name('check-site-export.py')
SPEC = importlib.util.spec_from_file_location('site_export', SCRIPT)
CHECK = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(CHECK)
ASSETS = {'/_next/static/app.js', '/_next/static/app.css', '/favicon.ico', '/icon.svg',
          '/feed.xml', '/search-index.json', '/robots.txt', '/sitemap.xml', '/images/sample.svg'}
ONE = (('one', '2019-12-23'),)
WORKS = ('github-explore', 'ai-weekly')


def item(slug, date):
    return f'<li data-article="/essays/{slug}/"><time datetime="{date}">{date[5:]}</time><a href="/essays/{slug}/">{slug}</a></li>'


def work(slug):
    return f'<article data-work="/works/{slug}/"><h2><a href="/works/{slug}/">{slug}</a></h2><p>作品介绍</p></article>'


def frame(route, content):
    owner = '/essays/' if route.startswith('/essays/') or route == '/search/' else '/works/' if route.startswith('/works/') else route
    menu = ''.join(f'<a href="{href}"' + (' aria-current="page"' if href == owner else '') + f'>{label}</a>' for href, label in CHECK.MENU)
    return ('<!doctype html><html lang="zh-CN"><head><title>样本</title>'
            '<link rel="stylesheet" href="/_next/static/app.css"><link rel="icon" href="/icon.svg">'
            '<link rel="alternate" type="application/rss+xml" href="/feed.xml">'
            '<script src="/_next/static/app.js" async></script></head><body>'
            '<a href="#main-content">跳到正文</a><nav id="main-menu">' + menu + '</nav>'
            '<main id="main-content">' + content + '</main><footer><a href="/feed.xml">RSS</a>'
            '<a href="/search/">搜索</a></footer><script>self.__next_f.push([1,"生成 RSC 文本"])</script></body></html>')


def fixtures(essays=ONE, works=WORKS, size=None, work_size=None, taxonomy=None):
    """日期倒序、同日按 slug；分类参数为 {(categories|tags, 名称): (slug, ...)}。"""
    size, work_size = size or CHECK.YEAR_PAGE_SIZE, work_size or CHECK.WORK_PAGE_SIZE
    essays = sorted(sorted(essays), key=lambda e: e[1], reverse=True)
    years, taxonomy = {}, taxonomy or {}
    for slug, date in essays:
        years.setdefault(date[:4], []).append((slug, date))
    timeline = ('<ul>' + ''.join(f'<li data-year="{year}"><a href="/essays/{year}/">{year}</a></li>' for year in years) + '</ul>'
                if essays else '<p data-index-empty>这里还没有文章。</p>')
    recent = '<ul>' + ''.join(item(*entry) for entry in essays[:CHECK.HOME_RECENT]) + '</ul>' if essays else '<p data-index-empty>这里还没有文章。</p>'
    taxonomy_indexes = {}
    for kind in ('categories', 'tags'):
        names = [name for key, name in taxonomy if key == kind]
        taxonomy_indexes[kind] = ('<ul>' + ''.join(f'<li><a href="/essays/{kind}/{quote(name, safe="")}/">{name}</a></li>' for name in names) + '</ul>'
                                  if names else '<p data-index-empty>尚无条目。</p>')
    content = {
        '/': ''.join(f'<section id="{key}">{"<h1>博客</h1>" if key == "overview-about" else ""}'
                     + (recent if key == 'overview-essays' else ''.join(work(slug) for slug in works[:3]) if key == 'overview-works' else '')
                     + f'<a href="{href}">{key}</a></section>' for key, href in (
                         ('overview-about', '/about/'), ('overview-essays', '/essays/'),
                         ('overview-works', '/works/'), ('overview-contact', '/about/#contact'))),
        '/essays/': '<h1>随笔</h1><section id="featured-categories">' + taxonomy_indexes['categories'] + '<a href="/essays/categories/">全部分类</a></section>'
                    '<section id="featured-tags">' + taxonomy_indexes['tags'] + '<a href="/essays/tags/">全部标签</a></section>'
                    '<section id="timeline">' + timeline + '</section>',
        '/essays/archive/': '<h1>随笔归档</h1>' + timeline,
        '/about/': '<h1>简介</h1><article data-page-body><p>作者介绍。</p><section id="contact">'
                   '<a href="mailto:reader@example.com">邮箱</a><a href="https://example.com/author">作者主页</a></section></article>',
        '/works/': '<h1>作品</h1><div data-work-list>' + (''.join(work(slug) for slug in works[:work_size]) if works else '<p data-index-empty>尚无作品。</p>') + '</div><a href="/works/archive/">全部作品</a>',
        '/essays/categories/': '<h1>分类</h1>' + taxonomy_indexes['categories'],
        '/essays/tags/': '<h1>标签</h1>' + taxonomy_indexes['tags'],
        '/search/': '<h1>搜索</h1><form action="/search/" method="get"><label for="q">关键词</label><input id="q" name="q" type="search"><button type="submit">搜索</button></form>',
    }
    for slug, stamp in essays:
        content[f'/essays/{slug}/'] = (f'<h1>{slug}</h1><time datetime="{stamp}">{stamp}</time>'
            '<nav aria-label="文章目录"><a href="#intro">引子</a></nav><article data-essay-body>'
            '<h2 id="intro">引子</h2><p>正文内容。</p></article><a href="/essays/">返回随笔</a>')
    for year, entries in years.items():
        for offset in range(0, len(entries), size):
            route = f'/essays/{year}/' if not offset else f'/essays/{year}/page/{offset // size + 1}/'
            content[route] = '<h1>年份</h1><ul>' + ''.join(item(*entry) for entry in entries[offset:offset + size]) + '</ul><a href="/essays/">返回随笔</a>'
    for (kind, name), slugs in taxonomy.items():
        selected = [entry for entry in essays if entry[0] in slugs]
        for offset in range(0, len(selected), CHECK.TAXONOMY_PAGE_SIZE):
            route = f'/essays/{kind}/{name}/' + (f'page/{offset // CHECK.TAXONOMY_PAGE_SIZE + 1}/' if offset else '')
            content[route] = f'<h1>{name}</h1><ul>' + ''.join(item(*entry) for entry in selected[offset:offset + CHECK.TAXONOMY_PAGE_SIZE]) + '</ul>'
    for slug in works:
        content[f'/works/{slug}/'] = f'<h1>{slug}</h1><article data-work-body><p>真实作品介绍。</p><a href="https://github.com/example/{slug}">访问作品</a></article><a href="/works/">返回作品</a>'
    for offset in range(0, max(1, len(works)), work_size):
        route = '/works/archive/' if not offset else f'/works/archive/page/{offset // work_size + 1}/'
        content[route] = '<h1>作品归档</h1><div data-work-list>' + (''.join(work(slug) for slug in works[offset:offset + work_size]) if works else '<p data-index-empty>尚无作品。</p>') + '</div>'
    return {route: frame(route, html) for route, html in content.items()}


def write_export(root, pages=None):
    for route, html in (fixtures() if pages is None else pages).items():
        path = root / route.lstrip('/') / 'index.html'
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(html, encoding='utf-8')
    for asset in ASSETS:
        path = root / asset.lstrip('/')
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text('自建资源', encoding='utf-8')


class Contract(unittest.TestCase):
    def test_complete_blog(self):
        self.assertEqual(CHECK.check(fixtures(), ASSETS), [])

    def test_empty_content_is_valid(self):
        self.assertEqual(CHECK.check(fixtures(essays=(), works=()), ASSETS), [])

    def test_chinese_and_ascii_taxonomy(self):
        pages = fixtures(taxonomy={('categories', '知识管理'): ('one',), ('tags', 'notes'): ('one',)})
        self.assertEqual(CHECK.check(pages, ASSETS), [])
        pages['/essays/categories/%E7%9F%A5%E8%AF%86%E7%AE%A1%E7%90%86/'] = pages.pop('/essays/categories/知识管理/')
        self.assertEqual(CHECK.check(pages, ASSETS), [])

    def test_taxonomy_internal_spaces_match_encoded_links_and_directories(self):
        pages = fixtures(taxonomy={('categories', 'AI Coding'): ('one',), ('tags', '知识 管理'): ('one',)})
        self.assertIn('href="/essays/categories/AI%20Coding/"', pages['/essays/categories/'])
        self.assertEqual(CHECK.check(pages, ASSETS), [])
        pages['/essays/categories/AI%20Coding/'] = pages.pop('/essays/categories/AI Coding/')
        self.assertEqual(CHECK.check(pages, ASSETS), [])

    def test_noscript_fallback_still_validates_targets_and_visibility(self):
        fallback = '<noscript><p>搜索需要 JavaScript，也可以按<a href="/essays/archive/">年份归档</a>浏览。</p></noscript>'
        pages = fixtures()
        pages['/search/'] = pages['/search/'].replace('</main>', fallback + '</main>')
        self.assertEqual(CHECK.check(pages, ASSETS), [])
        for old, new in (('href="/essays/archive/"', 'href="/missing-archive/"'),
                         ('href="/essays/archive/"', 'href="javascript:alert(1)"'),
                         ('<a href=', '<a hidden href='),
                         ('<noscript>', '<noscript hidden>')):
            with self.subTest(replacement=new):
                broken = dict(pages)
                broken['/search/'] = broken['/search/'].replace(fallback, fallback.replace(old, new))
                self.assertTrue(CHECK.check(broken, ASSETS))

    def test_svg_encoded_target_and_metadata(self):
        pages = fixtures()
        pages['/about/'] = pages['/about/'].replace('</main>', '<svg><defs><path id="icon" d="M0 0"></path></defs><use href="#icon"></use></svg><a href="/%65ssays/">编码本地入口</a><img src="/images/sample.svg" alt="示意图"></main>')
        pages['/'] = pages['/'].replace('</head>', '<link rel="canonical" href="https://example.com/"></head>')
        self.assertEqual(CHECK.check(pages, ASSETS), [])

    def test_collapsed_toc_links_are_reachable_and_checked(self):
        toc = '<details><summary>本篇目录</summary><a href="#intro">引子</a></details>'
        pages = fixtures()
        pages['/essays/one/'] = pages['/essays/one/'].replace('</main>', toc + '</main>')
        self.assertEqual(CHECK.check(pages, ASSETS), [])
        for replacement in ('href="#missing"', 'hidden href="#intro"', 'href="javascript:bad"'):
            bad = dict(pages)
            bad['/essays/one/'] = bad['/essays/one/'].replace(toc, toc.replace('href="#intro"', replacement))
            self.assertTrue(CHECK.check(bad, ASSETS))

    def test_remote_images_are_limited_to_article_content(self):
        pages = fixtures()
        image = '<img src="https://example.com/image.png?v=1&amp;size=2" alt="旧图">'
        pages['/essays/one/'] = pages['/essays/one/'].replace('</article>', image + '</article>')
        self.assertEqual(CHECK.check(pages, ASSETS), [])
        for value in ('javascript:alert(1)', 'data:image/svg+xml,bad', 'https://user:pass@example.com/a', '//example.com/a'):
            bad = dict(pages)
            bad['/essays/one/'] = pages['/essays/one/'].replace('https://example.com/image.png?v=1&amp;size=2', value)
            self.assertTrue(CHECK.check(bad, ASSETS), value)
        outside = fixtures()
        outside['/'] = outside['/'].replace('</main>', image + '</main>')
        self.assertTrue(CHECK.check(outside, ASSETS))

    def test_dom_mutations(self):
        cases = [
            ('lang', '/', 'lang="zh-CN"', 'lang="en"'),
            ('wrong-main', '/', '<main id="main-content">', '<div id="main-content">'),
            ('duplicate-main', '/', '</main>', '</main><main>额外正文</main>'),
            ('nav-tag', '/', '<nav id="main-menu">', '<div id="main-menu">'),
            ('nav-hidden', '/', '<nav id="main-menu">', '<nav hidden id="main-menu">'),
            ('menu-extra', '/', '</nav>', '<a href="/">额外项</a></nav>'),
            ('menu-order', '/', '>首页</a>', '>作品</a>'),
            ('menu-current', '/essays/one/', 'href="/essays/" aria-current="page"', 'href="/essays/" aria-current="false"'),
            ('missing-h1', '/about/', '<h1>简介</h1>', ''),
            ('hidden-h1', '/about/', '<h1>', '<h1 hidden>'),
            ('empty-h1', '/about/', '<h1>简介</h1>', '<h1> </h1>'),
            ('duplicate-h1', '/about/', '</main>', '<h1>第二标题</h1></main>'),
            ('contact-hidden', '/about/', '<section id="contact">', '<section hidden id="contact">'),
            ('contact-target', '/', 'href="/about/#contact"', 'href="/about/"'),
            ('overview-order', '/', 'id="overview-about"', 'id="wrong-about"'),
            ('taxonomy-entry', '/essays/', 'href="/essays/tags/"', 'href="/essays/categories/"'),
            ('taxonomy-empty-hidden', '/essays/tags/', '<p data-index-empty>', '<p hidden data-index-empty>'),
            ('year-missing', '/essays/', 'data-year="2019"', 'data-yr="2019"'),
            ('year-link', '/essays/archive/', 'href="/essays/2019/"', 'href="/essays/"'),
            ('year-item-hidden', '/essays/2019/', '<li data-article', '<li hidden data-article'),
            ('year-date', '/essays/2019/', '<time datetime="2019-12-23">', '<time>'),
            ('year-target', '/essays/2019/', '<a href="/essays/one/">', '<a href="/essays/">'),
            ('year-return', '/essays/2019/', '<a href="/essays/">返回随笔</a>', ''),
            ('home-recent', '/', '<li data-article="/essays/one/">', '<li>'),
            ('article-marker', '/essays/one/', '<article data-essay-body>', '<article>'),
            ('article-empty', '/essays/one/', '<h2 id="intro">引子</h2><p>正文内容。</p>', '<span id="intro"></span>'),
            ('article-return', '/essays/one/', '<a href="/essays/">返回随笔</a>', ''),
            ('toc-anchor', '/essays/one/', '<h2 id="intro">', '<h2>'),
            ('about-marker', '/about/', 'data-page-body', 'data-unknown-body'),
            ('work-marker', '/works/github-explore/', 'data-work-body', 'data-unknown-body'),
            ('work-return', '/works/github-explore/', '<a href="/works/">返回作品</a>', ''),
            ('work-list', '/works/', 'data-work-list', 'data-not-work-list'),
            ('work-item-hidden', '/works/archive/', '<article data-work=', '<article hidden data-work='),
            ('work-item-target', '/works/archive/', '<a href="/works/github-explore/">', '<a href="/works/">'),
            ('unknown-route', '/', '</main>', '<a href="/private/">越界</a></main>'),
            ('missing-fragment', '/', '</main>', '<a href="/about/#absent">坏锚点</a></main>'),
            ('form-external', '/search/', 'action="/search/"', 'action="https://example.com"'),
            ('form-post', '/search/', 'method="get"', 'method="post"'),
            ('iframe', '/', '</main>', '<iframe></iframe></main>'),
            ('base', '/', '</head>', '<base href="/"></head>'),
            ('refresh', '/', '</head>', '<meta http-equiv="Refresh" content="0;url=https://example.com"></head>'),
            ('event', '/', '<main id="main-content">', '<main id="main-content" onclick="run()">'),
            ('external-src', '/', '/_next/static/app.js', 'https://example.com/app.js'),
            ('external-stylesheet', '/', '/_next/static/app.css', '//example.com/app.css'),
            ('missing-asset', '/', '/_next/static/app.js', '/_next/static/missing.js'),
            ('missing-static-file', '/', '/feed.xml', '/unknown-feed.xml'),
            ('css-external', '/', '</head>', '<style>body{background:url(https://example.com/a)}</style></head>'),
            ('css-import', '/', '</head>', '<style>@import "https://example.com/a";</style></head>'),
            ('svg-external', '/', '</main>', '<svg><use href="https://example.com/icon#x"></use></svg></main>'),
            ('svg-absent', '/', '</main>', '<svg><use href="#absent"></use></svg></main>'),
            ('ping', '/', 'href="/about/#contact"', 'href="/about/#contact" ping="/"'),
            ('download', '/', 'href="/about/#contact"', 'download href="/about/#contact"'),
            ('action', '/', '<main id="main-content">', '<main id="main-content" action="/">'),
            ('srcset', '/', '</main>', '<img srcset="https://example.com/a 1x"></main>'),
        ]
        for name, route, old, new in cases:
            with self.subTest(name=name):
                pages = fixtures()
                self.assertIn(old, pages[route])
                pages[route] = pages[route].replace(old, new)
                self.assertTrue(CHECK.check(pages, ASSETS), name)

    def test_encoded_unsafe_urls(self):
        for value in ('%256a%2561vascript%253aalert(1)', '%252f%252fexample.com/a', '/%2e%2e/about/',
                      '/essays/%252e%252e/', '/%5cexample.com', '/about/&#10;', '/about/%00',
                      '/about/?x=1', 'data:text/plain,x', '/about/#', 'https://user:pass@example.com',
                      'https:/missing-host', 'mailto:broken', 'mailto:x@example.com?body=%0aBcc:a@example.com'):
            with self.subTest(value=value):
                pages = fixtures()
                pages['/'] = pages['/'].replace('</main>', f'<a href="{value}">反例</a></main>')
                self.assertTrue(CHECK.check(pages, ASSETS))

    def test_spaces_do_not_relax_controls_path_boundaries_or_authority(self):
        for value in (' /about/', '/about/%20', '%20/about/', '/about/%2520',
                      '/essays/categories/%20AI%20Coding/', '/essays/categories/AI%20Coding%20/',
                      '/essays/categories/AI%09Coding/', '/essays/categories/AI%250aCoding/',
                      'https://exa mple.com/path', 'https://example.com%20/path',
                      'https://example.com%2520/path', 'https://example.com\u00a0/path',
                      'mailto:reader%20name@example.com'):
            with self.subTest(value=value):
                pages = fixtures()
                pages['/'] = pages['/'].replace('</main>', f'<a href="{value}">反例</a></main>')
                self.assertTrue(CHECK.check(pages, ASSETS))

    def test_balanced_visibility_and_scope(self):
        wrappers = (('<div hidden>', '</div>'), ('<div aria-hidden="true">', '</div>'),
                    ('<div inert>', '</div>'), ('<template>', '</template>'), ('<noscript>', '</noscript>'),
                    ('<div style="display:none">', '</div>'), ('<div style="visibility:hidden">', '</div>'),
                    ('<div style="content-visibility:hidden">', '</div>'), ('<details><summary>展开</summary>', '</details>'))
        for wrapper, end in wrappers:
            for start, close in (('<main id="main-content">', '</main>'), ('<nav id="main-menu">', '</nav>')):
                with self.subTest(wrapper=wrapper, target=start):
                    pages = fixtures()
                    html = pages['/']
                    begin = html.index(start)
                    finish = html.index(close, begin) + len(close)
                    pages['/'] = html[:begin] + wrapper + html[begin:finish] + end + html[finish:]
                    self.assertEqual(CHECK.Document(pages['/']).errors, [])
                    self.assertTrue(CHECK.check(pages, ASSETS))
        pages = fixtures()
        pages['/about/'] = pages['/about/'].replace('<h1>简介</h1>', '<h1 class="secret">简介</h1>').replace('</head>', '<style>.secret{display:none}</style></head>')
        self.assertTrue(CHECK.check(pages, ASSETS))

    def test_source_only_in_script_does_not_count(self):
        pages = fixtures()
        body = '<article data-essay-body><h2 id="intro">引子</h2><p>正文内容。</p></article>'
        pages['/essays/one/'] = pages['/essays/one/'].replace(body, '<script>"' + body + '"</script>')
        self.assertTrue(CHECK.check(pages, ASSETS))

    def test_empty_state_requires_actual_text(self):
        for replacement in ('', '<p data-index-empty></p>', '<p data-index-empty><span hidden>暂无</span></p>',
                            '<svg><defs><text data-index-empty>暂无</text></defs></svg>'):
            pages = fixtures(essays=(), works=())
            pages['/essays/archive/'] = pages['/essays/archive/'].replace('<p data-index-empty>这里还没有文章。</p>', replacement)
            self.assertTrue(CHECK.check(pages, ASSETS))

    def test_missing_extra_and_colliding_routes(self):
        pages = fixtures()
        del pages['/search/']
        self.assertTrue(CHECK.check(pages, ASSETS))
        for route in ('/private/', '/essays/Bad/', '/essays/19/', '/essays/2019/page/1/',
                      '/essays/2019/page/x/', '/essays/one/extra/', '/works/archive/page/1/',
                      '/essays/tags/%2e%2e/', '/works/Bad/'):
            pages = fixtures()
            pages[route] = pages['/essays/categories/']
            self.assertTrue(CHECK.check(pages, ASSETS), route)
        pages = fixtures()
        pages['/%65ssays/'] = pages['/essays/']
        self.assertTrue(CHECK.check(pages, ASSETS))

    def test_assets_default_and_input_types(self):
        self.assertTrue(CHECK.check(fixtures()))
        for pages, assets in ((None, ASSETS), ({'/': b'html'}, ASSETS), (fixtures(), ['/_next/a'])):
            with self.assertRaises(ValueError):
                CHECK.check(pages, assets)


class Derived(unittest.TestCase):
    FOUR = (('a', '2019-03-01'), ('b', '2019-02-01'), ('c', '2019-01-01'), ('d', '2018-05-05'))

    def setUp(self):
        self.sizes = CHECK.YEAR_PAGE_SIZE, CHECK.TAXONOMY_PAGE_SIZE, CHECK.WORK_PAGE_SIZE
        CHECK.YEAR_PAGE_SIZE = CHECK.TAXONOMY_PAGE_SIZE = CHECK.WORK_PAGE_SIZE = 2

    def tearDown(self):
        CHECK.YEAR_PAGE_SIZE, CHECK.TAXONOMY_PAGE_SIZE, CHECK.WORK_PAGE_SIZE = self.sizes

    def test_paginated_year_and_taxonomy(self):
        pages = fixtures(self.FOUR, taxonomy={('categories', '随笔'): ('a', 'b', 'c')})
        self.assertIn('/essays/2019/page/2/', pages)
        self.assertIn('/essays/categories/随笔/page/2/', pages)
        self.assertEqual(CHECK.check(pages, ASSETS), [])

    def test_page_capacity(self):
        self.assertTrue(CHECK.check(fixtures(self.FOUR, size=3), ASSETS))
        self.assertTrue(CHECK.check(fixtures(self.FOUR, size=1), ASSETS))

    def test_page_gap(self):
        for old, new, options in (
            ('/essays/2019/page/2/', '/essays/2019/page/3/', {}),
            ('/essays/categories/随笔/page/2/', '/essays/categories/随笔/page/3/', {'taxonomy': {('categories', '随笔'): ('a', 'b', 'c')}}),
            ('/works/archive/page/2/', '/works/archive/page/3/', {'works': ('a', 'b', 'c')})):
            with self.subTest(old=old):
                pages = fixtures(self.FOUR, **options)
                pages[new] = pages.pop(old)
                self.assertTrue(CHECK.check(pages, ASSETS))

    def test_date_consistency_and_validity(self):
        for route, old, new in (('/essays/2019/', '2019-12-23', '2019-01-01'),
                                ('/essays/one/', '2019-12-23', '2019-02-30')):
            pages = fixtures()
            pages[route] = pages[route].replace(old, new)
            self.assertTrue(CHECK.check(pages, ASSETS))
        pages = fixtures()
        for route in ('/', '/essays/2019/', '/essays/one/'):
            pages[route] = pages[route].replace('2019-12-23', '2018-12-23')
        self.assertTrue(any('不属于该年' in error for error in CHECK.check(pages, ASSETS)))

    def test_essay_duplicate_or_unlisted(self):
        pages = fixtures(self.FOUR)
        pages['/essays/2018/'] = pages['/essays/2018/'].replace('</ul>', item('d', '2018-05-05') + '</ul>')
        self.assertTrue(CHECK.check(pages, ASSETS))
        pages = fixtures(self.FOUR)
        pages['/essays/e/'] = pages['/essays/a/']
        self.assertTrue(CHECK.check(pages, ASSETS))

    def test_date_order(self):
        pages = fixtures(self.FOUR)
        a, b = item('a', '2019-03-01'), item('b', '2019-02-01')
        pages['/essays/2019/'] = pages['/essays/2019/'].replace(a + b, b + a)
        self.assertTrue(CHECK.check(pages, ASSETS))

    def test_home_latest_and_cap(self):
        pages = fixtures(self.FOUR)
        pages['/'] = pages['/'].replace(item('a', '2019-03-01'), '')
        self.assertTrue(CHECK.check(pages, ASSETS))
        many = tuple((f'p{i}', f'2019-01-{i + 1:02d}') for i in range(CHECK.HOME_RECENT + 1))
        CHECK.YEAR_PAGE_SIZE = 100
        self.assertEqual(CHECK.check(fixtures(many), ASSETS), [])
        pages = fixtures(many)
        pages['/'] = pages['/'].replace('</ul>', item('p0', '2019-01-01') + '</ul>', 1)
        self.assertTrue(CHECK.check(pages, ASSETS))

    def test_work_archive_coverage_and_capacity(self):
        self.assertEqual(CHECK.check(fixtures(works=('a', 'b', 'c')), ASSETS), [])
        self.assertTrue(CHECK.check(fixtures(works=('a', 'b', 'c'), work_size=3), ASSETS))
        self.assertTrue(CHECK.check(fixtures(works=('a', 'b', 'c'), work_size=1), ASSETS))
        pages = fixtures()
        pages['/works/archive/'] = pages['/works/archive/'].replace(work('github-explore'), '')
        self.assertTrue(CHECK.check(pages, ASSETS))


class Filesystem(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.base = Path(self.temp.name).resolve()
        self.root = self.base / 'out'
        self.root.mkdir()
        write_export(self.root)

    def tearDown(self):
        self.temp.cleanup()

    def cli(self, *args):
        return subprocess.run([sys.executable, '-I', str(SCRIPT), *map(str, args)], capture_output=True, text=True)

    def test_load_cli_and_real_resource_enumeration(self):
        pages, assets = CHECK.load(self.root)
        self.assertEqual(CHECK.check(pages, assets), [])
        self.assertEqual(assets, ASSETS)
        self.assertEqual(self.cli(self.root).returncode, 0)

    def test_unregistered_paths_not_read(self):
        (self.root / 'private').symlink_to('/nonexistent', target_is_directory=True)
        self.assertEqual(CHECK.check(*CHECK.load(self.root)), [])

    def test_derived_and_chinese_routes_loaded(self):
        write_export(self.root, fixtures(taxonomy={('categories', '知识管理'): ('one',), ('tags', 'AI Coding'): ('one',)}))
        pages, _ = CHECK.load(self.root)
        self.assertTrue({'/essays/one/', '/essays/2019/', '/works/github-explore/', '/essays/categories/知识管理/', '/essays/tags/AI Coding/'} <= set(pages))
        self.assertEqual(CHECK.check(*CHECK.load(self.root)), [])

    def test_unknown_shape_cli(self):
        path = self.root / 'essays' / 'Bad' / 'index.html'
        path.parent.mkdir()
        path.write_text(fixtures()['/essays/one/'], encoding='utf-8')
        self.assertEqual(self.cli(self.root).returncode, 1)

    def test_missing_page_and_asset_cli(self):
        (self.root / 'about/index.html').unlink()
        with self.assertRaises(OSError):
            CHECK.load(self.root)
        self.assertEqual(self.cli(self.root).returncode, 2)
        self.assertEqual(self.cli(self.root, self.root).returncode, 2)
        write_export(self.root)
        (self.root / 'icon.svg').unlink()
        self.assertEqual(self.cli(self.root).returncode, 1)

    def test_contract_cli_failure(self):
        (self.root / 'index.html').write_text(fixtures()['/'].replace('lang="zh-CN"', 'lang="en"'), encoding='utf-8')
        self.assertEqual(self.cli(self.root).returncode, 1)

    def test_symlinks_refused(self):
        for kind in ('root', 'parent', 'html', 'route-parent', 'essay-dir', 'work-dir', 'asset', 'asset-dir', 'static-file', 'media', 'dangling-asset'):
            with self.subTest(kind=kind), tempfile.TemporaryDirectory(dir=self.base) as directory:
                base, root = Path(directory), Path(directory) / 'out'
                root.mkdir()
                write_export(root)
                if kind in {'root', 'parent'}:
                    link = base / 'link'
                    link.symlink_to(root if kind == 'root' else base, target_is_directory=True)
                    root = link if kind == 'root' else link / 'out'
                elif kind in {'route-parent', 'asset-dir'}:
                    source = root / ('about' if kind == 'route-parent' else '_next')
                    target = base / 'moved'
                    source.rename(target)
                    source.symlink_to(target, target_is_directory=True)
                elif kind in {'essay-dir', 'work-dir'}:
                    (root / ('essays' if kind == 'essay-dir' else 'works') / 'evil').symlink_to(base, target_is_directory=True)
                else:
                    relative = {'html': 'about/index.html', 'asset': '_next/static/app.js', 'static-file': 'feed.xml', 'media': 'images/sample.svg', 'dangling-asset': '_next/static/dangling.js'}[kind]
                    path, target = root / relative, base / 'target'
                    if kind != 'dangling-asset':
                        path.rename(target)
                    path.symlink_to(target)
                with self.assertRaises((ValueError, OSError)):
                    CHECK.load(root)
                self.assertNotEqual(self.cli(root).returncode, 0)


if __name__ == '__main__':
    unittest.main(verbosity=2)
