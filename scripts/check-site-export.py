#!/usr/bin/env python3
"""静态 DOM 契约：固定七路由，加上由正文派生的文章页与年份页；不执行 JS，不沿 href 读文件，不是完整 JS/CSS 安全审计。

check(pages, assets=None) 返回错误列表；assets 为已安全枚举的 URL 路径集合。
load(root) 返回 (pages, assets)：读固定路由与 essays/ 下全部 index.html，枚举 _next 与 favicon.ico。
"""
import os
import re
import stat
import sys
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROUTES = ('/', '/essays/', '/works/', '/about/',
          '/essays/categories/', '/essays/tags/', '/works/preview/')
# 正文派生的路由只许这两种形状：文章 slug 必须含字母，纯数字是年份；分页从第 2 页起
ESSAY = re.compile(r'^/essays/(?=[a-z0-9-]*[a-z])[a-z0-9]+(?:-[a-z0-9]+)*/$')
YEAR = re.compile(r'^/essays/(\d{4})/(?:page/([2-9]|[1-9]\d+)/)?$')
# 命门 3：目录页条目有上界；与 src/site/lib/content.ts 的 YEAR_PAGE_SIZE、HOME_RECENT 保持一致
YEAR_PAGE_SIZE, HOME_RECENT = 100, 5
MENU = (('/', '首页'), ('/essays/', '随笔'), ('/works/', '作品'), ('/about/', '简介'))
VOID = set('area base br col embed hr img input link meta param source track wbr'.split())
# SVG 定义与辅助说明不作为可见文案；普通图标形状与引用仍允许。
NONCONTENT = {'head', 'template', 'noscript', 'script', 'style', 'defs', 'symbol',
              'clippath', 'mask', 'pattern', 'marker', 'title', 'desc',
              'lineargradient', 'radialgradient'}


def decode(value):
    """逐层解码且逐层拒绝 URL 危险字符，防止解析器先剥掉控制字符。"""
    for _ in range(16):
        if re.search(r'[\x00-\x20\x7f-\x9f\\]', value):
            raise ValueError('URL 含空白、控制字符或反斜杠')
        decoded = unquote(unescape(value), errors='strict')
        if decoded == value:
            return value
        value = decoded
    raise ValueError('URL 编码层数超限')


def url(value):
    value = decode(value)
    parsed = urlsplit(value)
    if not value or parsed.scheme or parsed.netloc or value.startswith('//') or parsed.query:
        raise ValueError('只允许无查询的本地 URL')
    if any(part in {'.', '..'} for part in parsed.path.split('/')):
        raise ValueError('不允许 dot segments')
    if '#' in value and not parsed.fragment:
        raise ValueError('空锚点')
    return parsed.path, parsed.fragment


class Node:
    def __init__(self, tag, attrs=(), parent=None):
        self.tag, self.attrs, self.parent = tag, dict(attrs), parent
        self.children, self.parts = [], []
        self.attrs = {key: value or '' for key, value in self.attrs.items()}

    def walk(self):
        yield self
        for child in self.children:
            yield from child.walk()

    def contains(self, node):
        while node is not None:
            if node is self:
                return True
            node = node.parent
        return False

    def raw_text(self):
        return ''.join(p.raw_text() if isinstance(p, Node) else p for p in self.parts)

    def summary(self):
        return next((child for child in self.children if child.tag == 'summary'), None)

    def text(self):
        if not self.visible():
            return ''
        if self.tag == 'details' and 'open' not in self.attrs:
            summary = self.summary()
            return summary.text() if summary else ''
        return ''.join(p.text() if isinstance(p, Node) else p for p in self.parts)

    def visible(self):
        node = self
        while node is not None:
            if (node.tag in NONCONTENT or 'hidden' in node.attrs or 'inert' in node.attrs
                    or node.attrs.get('aria-hidden', '').strip().lower() == 'true'
                    or hidden_style(node.attrs.get('style', '')) or getattr(node, 'css_hidden', False)):
                return False
            if node.tag == 'details' and 'open' not in node.attrs and node is not self:
                summary = node.summary()
                if summary is None or not summary.contains(self):
                    return False
            node = node.parent
        return True


def hidden_style(style):
    style = re.sub(r'/\*.*?\*/', '', style, flags=re.S)
    return bool(re.search(r'(?:^|;)\s*(?:display\s*:\s*none|visibility\s*:\s*(?:hidden|collapse)|content-visibility\s*:\s*hidden)\s*(?:!\s*important\s*)?(?:;|$)', style, re.I))


class Document(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.root, self.errors = Node('document'), []
        self.stack = [self.root]
        self.feed(text)
        self.close()
        if len(self.stack) != 1:
            self.errors.append('未闭合标签')
        self.nodes = list(self.root.walk())[1:]
        self.ids = {}
        for node in self.nodes:
            if 'id' in node.attrs:
                key = node.attrs['id']
                if not key or key in self.ids:
                    self.errors.append('ID 为空或重复')
                self.ids[key] = node
        # 常见内嵌样式隐藏选择器；并非完整 CSS 级联/绘制引擎。
        for style in (n for n in self.nodes if n.tag == 'style'):
            css = re.sub(r'/\*.*?\*/', '', style.raw_text(), flags=re.S)
            for selectors, declarations in re.findall(r'([^{}]+)\{([^{}]*)\}', css):
                if hidden_style(declarations):
                    for selector in selectors.split(','):
                        selector = selector.strip()
                        if not re.fullmatch(r'[\w.#-]+', selector):
                            self.errors.append('隐藏样式选择器超出静态检查范围')
                            continue
                        for node in self.nodes:
                            if matches(node, selector):
                                node.css_hidden = True

    def handle_starttag(self, tag, attrs):
        if len(dict(attrs)) != len(attrs):
            self.errors.append('重复属性')
        node = Node(tag, attrs, self.stack[-1])
        self.stack[-1].children.append(node)
        self.stack[-1].parts.append(node)
        if tag not in VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        if len(self.stack) == 1 or self.stack[-1].tag != tag:
            self.errors.append('标签未按顺序闭合：' + tag)
        else:
            self.stack.pop()

    def handle_data(self, data):
        self.stack[-1].parts.append(data)


def matches(node, selector):
    tag = re.match(r'^[\w-]+', selector)
    return ((not tag or node.tag == tag.group())
            and all(node.attrs.get('id') == x for x in re.findall(r'#([\w-]+)', selector))
            and all(x in node.attrs.get('class', '').split() for x in re.findall(r'\.([\w-]+)', selector)))


def text(node):
    return re.sub(r'\s+', ' ', node.text()).strip() if node else ''


def check(pages, assets=None):
    if not isinstance(pages, dict) or any(not isinstance(v, str) for v in pages.values()):
        raise ValueError('pages 必须是路由到 HTML 字符串的字典')
    if assets is None:
        assets = set()
    if not isinstance(assets, (set, frozenset)) or any(not isinstance(a, str) for a in assets):
        raise ValueError('assets 必须是安全枚举的本地 URL 路径集合')
    errors = []

    def fail(route, message):
        errors.append(f'{route}：{message}')

    if not set(ROUTES) <= set(pages) or any(not (ESSAY.match(r) or YEAR.match(r)) for r in set(pages) - set(ROUTES)):
        return ['固定路由不完整，或含未登记形状的路由']
    docs = {route: Document(pages[route]) for route in sorted(pages)}
    essay_routes = sorted(r for r in pages if r not in ROUTES and ESSAY.match(r))

    def resource(value):
        path, fragment = url(value)
        if fragment or not (path.startswith('/_next/') or path == '/favicon.ico') or path not in assets:
            raise ValueError('资源不属于已枚举 _next/favicon 本地文件')

    def destination(route, value):
        path, fragment = url(value)
        target = path or route
        if target not in docs:
            raise ValueError('href 不属于已导出路由')
        if fragment:
            node = docs[target].ids.get(fragment)
            if node is None or not node.visible():
                raise ValueError('目标锚点不存在或隐藏')
        return target, fragment

    def link(container, href):
        return container is not None and any(n.tag == 'a' and n.visible() and text(n)
                and 'download' not in n.attrs and n.attrs.get('href') == href for n in container.walk())

    def entries(route, container, where):
        """文章条目：可见、链到已导出文章、带一个 YYYY-MM-DD 日期，按日期倒序。"""
        found = []
        for node in (n for n in container.walk() if 'data-article' in n.attrs) if container else ():
            href = node.attrs['data-article']
            dates = [n.attrs.get('datetime', '') for n in node.walk() if n.tag == 'time']
            if not (href in essay_routes and node.visible() and link(node, href)
                    and len(dates) == 1 and re.fullmatch(r'\d{4}-\d{2}-\d{2}', dates[0])):
                fail(route, where + '条目须可见、链到已导出文章并带日期')
                continue
            found.append((dates[0], href))
        if [d for d, _ in found] != sorted((d for d, _ in found), reverse=True):
            fail(route, where + '条目须按日期倒序')
        return found

    def empty(container):
        return container is not None and any('data-index-empty' in n.attrs and n.visible()
                and ('未迁入正文' in text(n) or '待确认' in text(n)) for n in container.walk())

    mains = {}
    for route, doc in docs.items():
        for error in doc.errors:
            fail(route, error)
        htmls = [n for n in doc.nodes if n.tag == 'html']
        bodies = [n for n in doc.nodes if n.tag == 'body']
        if len(htmls) != 1 or htmls[0].attrs.get('lang') != 'zh-CN' or len(bodies) != 1 or bodies[0].parent is not htmls[0]:
            fail(route, '须有 html lang=zh-CN 及唯一 body')
        body = bodies[0] if len(bodies) == 1 else None
        main_nodes = [n for n in doc.nodes if n.tag == 'main']
        main = main_nodes[0] if len(main_nodes) == 1 else None
        mains[route] = main
        if main is None or main.attrs.get('id') != 'main-content' or not main.visible() or not (body and body.contains(main)):
            fail(route, '须有唯一可见 main#main-content，位于 body')
        menu = doc.ids.get('main-menu')
        if menu is None or menu.tag != 'nav' or not menu.visible() or not (body and body.contains(menu)) or (main and main.contains(menu)):
            fail(route, '主导航须为正文外可见 nav#main-menu')
        links = [n for n in menu.walk() if n.tag == 'a'] if menu else []
        if [(n.attrs.get('href'), text(n)) for n in links] != list(MENU) or any(not n.visible() for n in links):
            fail(route, '四菜单顺序、文案、href 或可见性不符')
        owner = '/essays/' if route.startswith('/essays/') else '/works/' if route.startswith('/works/') else route
        current = [n for n in links if 'aria-current' in n.attrs]
        if len(current) != 1 or current[0].attrs.get('href') != owner or current[0].attrs.get('aria-current') != 'page':
            fail(route, 'aria-current=page 与页归属不符')
        notices = [n for n in doc.nodes if 'data-site-notice' in n.attrs and n.visible() and body and body.contains(n)]
        if not any('工程预览' in text(n) and '未公开发布' in text(n) for n in notices):
            fail(route, '缺可见诚实工程声明')
        for node in doc.nodes:
            if node.tag in {'form', 'iframe', 'base', 'object', 'embed'}:
                fail(route, '禁止表单、嵌入或 base')
            if node.tag == 'meta' and node.attrs.get('http-equiv', '').strip().lower() == 'refresh':
                fail(route, '禁止 meta refresh')
            for key, value in node.attrs.items():
                try:
                    if key.startswith('on') or key in {'download', 'ping', 'action', 'formaction', 'attributionsrc', 'srcdoc', 'background', 'manifest', 'codebase', 'data'}:
                        raise ValueError('禁止事件、下载或外发/嵌入属性：' + key)
                    if key in {'href', 'xlink:href'}:
                        if node.tag == 'a' and key == 'href':
                            destination(route, value)
                            if not node.visible():
                                raise ValueError('导航链接隐藏')
                        elif node.tag in {'use', 'image'}:
                            path, fragment = url(value)
                            if path or not fragment or fragment not in doc.ids:
                                raise ValueError('SVG 引用只允许本页现有 ID')
                        elif node.tag == 'link' and key == 'href':
                            resource(value)
                        else:
                            raise ValueError('未批准的 href 资源入口')
                    elif key in {'src', 'poster'}:
                        resource(value)
                    elif key == 'srcset':
                        for item in value.split(','):
                            resource(item.strip().split()[0])
                except (ValueError, IndexError, UnicodeError) as exc:
                    fail(route, str(exc))
            css = node.raw_text() if node.tag == 'style' else node.attrs.get('style', '')
            css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
            if '\\' in css or re.search(r'@import\b|(?:image-set|expression)\s*\(', css, re.I):
                fail(route, '不允许 CSS 导入或转义加载入口')
            for value in re.findall(r'url\s*\(\s*([^)]*)\)', css, re.I):
                try:
                    resource(value.strip().strip('\"\''))
                except (ValueError, UnicodeError) as exc:
                    fail(route, 'CSS：' + str(exc))

    home = mains['/']
    sections = [n for n in home.children if n.tag == 'section'] if home else []
    expected = ('overview-about', 'overview-essays', 'overview-works', 'overview-contact')
    if tuple(n.attrs.get('id') for n in sections) != expected or any(not n.visible() for n in sections):
        fail('/', '首页须依次显示四个 main 直系速览 section')
    for key, href in zip(expected, ('/about/', '/essays/', '/works/', '/about/#contact')):
        node = docs['/'].ids.get(key)
        if not (home and node and node.parent is home and link(node, href)):
            fail('/', '速览入口不符：' + key)
    essays = mains['/essays/']
    sections = [n for n in essays.walk() if n.tag == 'section'] if essays else []
    if [n.attrs.get('id') for n in sections] != ['featured-categories', 'featured-tags', 'timeline'] or any(not n.visible() for n in sections):
        fail('/essays/', '须按序显示分类、标签与时间线')
    for key, href in (('featured-categories', '/essays/categories/'), ('featured-tags', '/essays/tags/')):
        node = docs['/essays/'].ids.get(key)
        if not (essays and node and essays.contains(node) and empty(node) and link(node, href)):
            fail('/essays/', '分类/标签缺诚实空态或目录入口')
    # 分类与专题名称未确认：这两处及其完整目录只许空态
    containers = [('/essays/', docs['/essays/'].ids.get(key)) for key in ('featured-categories', 'featured-tags')]
    containers += [(route, mains[route]) for route in ('/essays/categories/', '/essays/tags/')]
    for route, container in containers:
        if container and any(n.tag in {'ul', 'ol', 'li', 'article', 'time'}
                or any(key in n.attrs for key in ('data-article', 'data-year', 'data-category', 'data-tag', 'data-index-title'))
                for n in container.walk()):
            fail(route, '分类与专题未确认，只允许空态，不夹带目录条目')
    for route in ('/essays/categories/', '/essays/tags/'):
        if not empty(mains[route]):
            fail(route, '完整目录须保留诚实空态')
    # 时间线列全部非空年份，各链到年份页；文章条目只放在年份页，随笔首页大小不随篇数增长
    timeline = docs['/essays/'].ids.get('timeline')
    listed = [n for n in docs['/essays/'].nodes if 'data-year' in n.attrs]
    years = sorted({YEAR.match(r).group(1) for r in pages if YEAR.match(r)}, reverse=True)
    if not essay_routes:
        if listed or not empty(timeline):
            fail('/essays/', '没有文章时，时间线须保留可见诚实空态，不编造年份')
    elif ([n.attrs['data-year'] for n in listed] != years
          or not all(timeline and timeline.contains(n) and link(n, f'/essays/{n.attrs["data-year"]}/') for n in listed)):
        fail('/essays/', '时间线须倒序列出全部非空年份，并各自链到年份页')
    if any('data-article' in n.attrs for n in docs['/essays/'].nodes):
        fail('/essays/', '文章条目只放在年份页')
    covered = []
    for year in years:
        numbered = sorted((int(YEAR.match(r).group(2) or 1), r) for r in pages if YEAR.match(r) and YEAR.match(r).group(1) == year)
        if [k for k, _ in numbered] != list(range(1, len(numbered) + 1)):
            fail(f'/essays/{year}/', '年份分页须从第 1 页起连续')
        for k, route in numbered:
            found = entries(route, mains[route], '年份页')
            if not 1 <= len(found) <= YEAR_PAGE_SIZE:
                fail(route, f'年份页须列 1–{YEAR_PAGE_SIZE} 篇')
            if k < len(numbered) and len(found) != YEAR_PAGE_SIZE:
                fail(route, '未满上限不得分页')
            if any(d[:4] != year for d, _ in found):
                fail(route, '条目日期不属于该年')
            if not link(mains[route], '/essays/'):
                fail(route, '年份页缺返回随笔链接')
            covered += found
    if sorted(h for _, h in covered) != essay_routes:
        fail('/essays/', '每篇文章须在年份页出现且只出现一次')
    # 首页到文章：首页随笔速览是最新的至多 HOME_RECENT 篇；同日按网址升序，与构建端排序一致
    recent = entries('/', docs['/'].ids.get('overview-essays'), '首页随笔')
    latest = sorted(sorted(covered, key=lambda e: e[1]), key=lambda e: e[0], reverse=True)[:HOME_RECENT]
    if recent != latest:
        fail('/', f'首页随笔速览须为最新的 {HOME_RECENT} 篇以内，且与年份页一致')
    contact = docs['/about/'].ids.get('contact')
    if not (contact and mains['/about/'] and mains['/about/'].contains(contact) and contact.visible() and text(contact)):
        fail('/about/', '联系须位于正文且可见')
    for route, doc in docs.items():
        articles = [n for n in doc.nodes if n.tag == 'article']
        if route in essay_routes:
            if (len(articles) != 1 or 'data-essay-body' not in articles[0].attrs
                    or not (mains[route] and mains[route].contains(articles[0]))):
                fail(route, '文章页须有唯一位于正文内的 article[data-essay-body]')
            if not link(mains[route], '/essays/'):
                fail(route, '文章页缺返回随笔链接')
        elif articles:
            fail(route, '非文章页不得出现 article')
        works = [n for n in doc.nodes if 'data-work-preview' in n.attrs]
        if route == '/works/preview/':
            if len(works) != 1 or not (mains[route] and mains[route].contains(works[0])) or '非实际作品' not in text(works[0]) or not link(works[0], '/works/'):
                fail(route, '作品详情须有可见非实际作品声明及返回作品链接')
        elif works:
            fail(route, '作品详情标记只属于预览详情页')
    work_main = mains['/works/']
    lists = [n for n in docs['/works/'].nodes if 'data-work-list' in n.attrs]
    if len(lists) != 1 or not (work_main and work_main.contains(lists[0])) or not empty(lists[0]) or any(n.tag in {'a', 'li', 'article'} or 'data-work-real' in n.attrs for n in lists[0].walk()):
        fail('/works/', '实际作品列表须为空态，不纳入预览作品')
    if not link(work_main, '/works/preview/'):
        fail('/works/', '缺可见作品预览入口')
    return errors


def safe(path):
    """在任何读取/枚举前检查全部路径组件；不 resolve 吞掉软链接。"""
    for component in reversed((path, *path.parents)):
        if stat.S_ISLNK(component.lstat().st_mode):
            raise ValueError('不允许软链接：' + str(component))


def load(root):
    root = Path(root)
    if not root.is_absolute():
        root = Path.cwd() / root
    safe(root)
    root = Path(os.path.abspath(root))
    if not root.is_dir():
        raise ValueError('root 必须是导出目录')
    paths = {route: root / route.lstrip('/') / 'index.html' for route in ROUTES}
    # essays/ 下的其余 index.html 都读进来，由 check 判形状；不读其他目录
    essays = root / 'essays'
    safe(essays)
    for directory, subdirs, files in os.walk(essays):
        for name in subdirs:
            safe(Path(directory, name))
        route = '/' + Path(directory).relative_to(root).as_posix() + '/'
        if 'index.html' in files and route not in paths:
            paths[route] = Path(directory, 'index.html')
    # 先验证全部目标，再读取，缺失不降级为部分通过。
    for path in paths.values():
        safe(path)
        if not stat.S_ISREG(path.lstat().st_mode):
            raise ValueError('HTML 必须为普通文件')
    assets = set()

    def enumerate_assets(path):
        safe(path)
        mode = path.lstat().st_mode
        if stat.S_ISDIR(mode):
            with os.scandir(path) as entries:
                for entry in entries:
                    enumerate_assets(Path(entry.path))
        elif stat.S_ISREG(mode):
            assets.add('/' + path.relative_to(root).as_posix())
        else:
            raise ValueError('资源须为普通文件/目录')

    for name in ('_next', 'favicon.ico'):
        path = root / name
        if path.exists() or path.is_symlink():
            enumerate_assets(path)
    pages = {}
    for route, path in paths.items():
        fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW)
        with os.fdopen(fd, encoding='utf-8') as stream:
            pages[route] = stream.read()
    return pages, assets


def main(argv=None):
    argv = sys.argv[1:] if argv is None else argv
    if len(argv) > 1:
        print('用法：check-site-export.py [out 目录]', file=sys.stderr)
        return 2
    root = argv[0] if argv else Path(__file__).absolute().parent.parent / 'src/site/out'
    try:
        pages, assets = load(root)
        errors = check(pages, assets)
    except (OSError, ValueError, UnicodeError) as exc:
        print('检查无法完成：' + str(exc), file=sys.stderr)
        return 2
    for error in errors:
        print(error, file=sys.stderr)
    if errors:
        return 1
    print(f'{len(pages)} 个页面的 DOM 契约与已枚举本地资源检查通过；不代表完整 JS 安全审计或浏览器绘制验收。')
    return 0


if __name__ == '__main__':
    sys.exit(main())
