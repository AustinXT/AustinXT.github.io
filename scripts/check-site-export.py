#!/usr/bin/env python3
"""内容博客的静态 DOM、目录覆盖与本地资源契约。

check(pages, assets=None) 返回错误列表；assets 为 load 安全枚举的 URL 路径集合。
不执行 JS，不沿 href 读取文件，也不代替浏览器绘制或完整的 JS/CSS 安全审计。
"""
import os
import re
import stat
import sys
from datetime import date
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROUTES = ('/', '/essays/', '/works/', '/about/', '/search/',
          '/essays/categories/', '/essays/tags/', '/essays/archive/', '/works/archive/')
# 正文派生的路由只许这两种形状：文章 slug 必须含字母，纯数字是年份；分页从第 2 页起
ESSAY = re.compile(r'^/essays/(?=[a-z0-9-]*[a-z])[a-z0-9]+(?:-[a-z0-9]+)*/$')
YEAR = re.compile(r'^/essays/(\d{4})/(?:page/([2-9]|[1-9]\d+)/)?$')
TAXONOMY = re.compile(r'^/essays/(categories|tags)/([^/]+)/(?:page/([2-9]|[1-9]\d+)/)?$')
WORK = re.compile(r'^/works/[a-z0-9]+(?:-[a-z0-9]+)*/$')
WORK_ARCHIVE = re.compile(r'^/works/archive/(?:page/([2-9]|[1-9]\d+)/)?$')
# 与内容层分页上限保持一致；这里独立检查导出结果。
YEAR_PAGE_SIZE, TAXONOMY_PAGE_SIZE, WORK_PAGE_SIZE, HOME_RECENT = 100, 100, 24, 5
MENU = (('/', '首页'), ('/essays/', '随笔'), ('/works/', '作品'), ('/about/', '简介'))
VOID = set('area base br col embed hr img input link meta param source track wbr'.split())
# SVG 定义与辅助说明不作为可见文案；普通图标形状与引用仍允许。
NONCONTENT = {'head', 'template', 'noscript', 'script', 'style', 'defs', 'symbol',
              'clippath', 'mask', 'pattern', 'marker', 'title', 'desc',
              'lineargradient', 'radialgradient'}


def decode(value):
    """逐层拒绝控制字符与首尾空白；保留分类名称等路径内部的合法空格。"""
    for _ in range(16):
        if value != value.strip() or re.search(r'[\x00-\x1f\x7f-\x9f\\]', value):
            raise ValueError('URL 含首尾空白、控制字符或反斜杠')
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
    if any(part != part.strip() for part in parsed.path.split('/')):
        raise ValueError('本地路径段不得含首尾空白')
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

    def visible(self, allow_noscript=False, allow_collapsed=False):
        node = self
        while node is not None:
            noncontent = node.tag in NONCONTENT and not (allow_noscript and node.tag == 'noscript')
            if (noncontent or 'hidden' in node.attrs or 'inert' in node.attrs
                    or node.attrs.get('aria-hidden', '').strip().lower() == 'true'
                    or hidden_style(node.attrs.get('style', '')) or getattr(node, 'css_hidden', False)):
                return False
            if node.tag == 'details' and 'open' not in node.attrs and node is not self and not allow_collapsed:
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


def external(value):
    """仅导航/元数据可用外链；脚本、样式、图片仍须是安全枚举的本地文件。"""
    value = decode(value)
    parsed = urlsplit(value)
    if parsed.scheme.lower() in {'http', 'https'}:
        if not parsed.hostname or parsed.username or parsed.password or any(character.isspace() for character in parsed.netloc):
            raise ValueError('HTTP(S) 外链须有主机，且 authority 不得含空白或凭据')
        _ = parsed.port
        return True
    if parsed.scheme.lower() == 'mailto':
        if parsed.netloc or not re.fullmatch(r'[^\s@/?#]+@[^\s@/?#]+', parsed.path):
            raise ValueError('mailto 联系链接格式错误')
        return True
    return False


def check(pages, assets=None):
    if not isinstance(pages, dict) or any(not isinstance(k, str) or not isinstance(v, str) for k, v in pages.items()):
        raise ValueError('pages 必须是路由到 HTML 字符串的字典')
    if assets is None:
        assets = set()
    if not isinstance(assets, (set, frozenset)) or any(not isinstance(a, str) for a in assets):
        raise ValueError('assets 必须是安全枚举的本地 URL 路径集合')
    # Next 导出目录可能含原始中文，而 href 对中文作百分号编码；两者只解码后比较。
    normalized = {}
    try:
        for route, html in pages.items():
            path, fragment = url(route)
            if not path.startswith('/') or not path.endswith('/') or fragment or path in normalized:
                raise ValueError('页面路由重复或格式不符')
            normalized[path] = html
        safe_assets = set()
        for asset in assets:
            path, fragment = url(asset)
            if not path.startswith('/') or fragment:
                raise ValueError('资源须为绝对本地路径且不得含锚点')
            safe_assets.add(path)
        assets = safe_assets
    except (ValueError, UnicodeError):
        return ['路由或资源 URL 含非法编码、路径或重复项']
    pages = normalized
    if not set(ROUTES) <= set(pages) or any(not (ESSAY.fullmatch(r) or YEAR.fullmatch(r)
            or TAXONOMY.fullmatch(r) or WORK.fullmatch(r) or WORK_ARCHIVE.fullmatch(r)) for r in set(pages) - set(ROUTES)):
        return ['固定路由不完整，或含未登记形状的路由']
    errors = []

    def fail(route, message):
        errors.append(f'{route}：{message}')

    docs = {route: Document(pages[route]) for route in sorted(pages)}
    essay_routes = sorted(r for r in pages if r not in ROUTES and ESSAY.fullmatch(r))
    work_routes = sorted(r for r in pages if r not in ROUTES and WORK.fullmatch(r))
    essay_dates = {}
    for route in essay_routes:
        main = next((n for n in docs[route].nodes if n.tag == 'main'), None)
        stamp = next((n.attrs.get('datetime', '') for n in main.walk() if n.tag == 'time'), '') if main else ''
        try:
            if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', stamp):
                raise ValueError('格式错误')
            date.fromisoformat(stamp)
        except ValueError:
            fail(route, '文章页须带有效 YYYY-MM-DD 原始日期')
        essay_dates[route] = stamp

    def resource(value):
        path, fragment = url(value)
        if fragment or path not in assets:
            raise ValueError('资源不属于已安全枚举的本地文件')

    def destination(route, value):
        if external(value):
            return None, None
        path, fragment = url(value)
        target = path or route
        if target in assets and not fragment:
            return target, fragment
        if target not in docs:
            raise ValueError('href 不属于已导出路由或已枚举资源')
        if fragment:
            node = docs[target].ids.get(fragment)
            if node is None or not node.visible():
                raise ValueError('目标锚点不存在或隐藏')
        return target, fragment

    def link(container, href):
        if container is None:
            return False
        for node in container.walk():
            if node.tag != 'a' or not node.visible() or not text(node) or 'download' in node.attrs:
                continue
            try:
                if url(node.attrs.get('href', '')) == url(href):
                    return True
            except (ValueError, UnicodeError):
                pass
        return False

    def entries(route, container, where):
        """文章条目：可见、链到已导出文章、带与正文相同的有效日期，按日期倒序。"""
        found = []
        for node in (n for n in container.walk() if 'data-article' in n.attrs) if container else ():
            try:
                href, fragment = url(node.attrs['data-article'])
            except (ValueError, UnicodeError):
                href, fragment = '', ''
            dates = [n.attrs.get('datetime', '') for n in node.walk() if n.tag == 'time']
            if not (href in essay_routes and not fragment and node.visible() and link(node, href)
                    and len(dates) == 1 and dates[0] == essay_dates.get(href)):
                fail(route, where + '条目须可见、链到已导出文章，并带与文章页一致的日期')
                continue
            found.append((dates[0], href))
        if [d for d, _ in found] != sorted((d for d, _ in found), reverse=True):
            fail(route, where + '条目须按日期倒序')
        if len({href for _, href in found}) != len(found):
            fail(route, where + '不得重复列出文章')
        return found

    def works(route, container):
        found = []
        for node in (n for n in container.walk() if 'data-work' in n.attrs) if container else ():
            try:
                href, fragment = url(node.attrs['data-work'])
            except (ValueError, UnicodeError):
                href, fragment = '', ''
            if href not in work_routes or fragment or not node.visible() or not link(node, href):
                fail(route, '作品条目须可见并链到已导出作品详情')
                continue
            found.append(href)
        if len(found) != len(set(found)):
            fail(route, '作品列表不得重复')
        return found

    def empty(container):
        return container is not None and any('data-index-empty' in n.attrs and n.visible()
                and text(n) for n in container.walk())

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
        headings = [n for n in doc.nodes if n.tag == 'h1']
        if len(headings) != 1 or not text(headings[0]) or not (main and main.contains(headings[0])):
            fail(route, '须有唯一可见且有文字的正文 h1')
        menu = doc.ids.get('main-menu')
        if menu is None or menu.tag != 'nav' or not menu.visible() or not (body and body.contains(menu)) or (main and main.contains(menu)):
            fail(route, '主导航须为正文外可见 nav#main-menu')
        links = [n for n in menu.walk() if n.tag == 'a'] if menu else []
        if [(n.attrs.get('href'), text(n)) for n in links] != list(MENU) or any(not n.visible() for n in links):
            fail(route, '四菜单顺序、文案、href 或可见性不符')
        owner = '/essays/' if route.startswith('/essays/') or route == '/search/' else '/works/' if route.startswith('/works/') else route
        current = [n for n in links if 'aria-current' in n.attrs]
        if len(current) != 1 or current[0].attrs.get('href') != owner or current[0].attrs.get('aria-current') != 'page':
            fail(route, 'aria-current=page 与页归属不符')
        for node in doc.nodes:
            if node.tag in {'iframe', 'base', 'object', 'embed'}:
                fail(route, '禁止嵌入或 base')
            if node.tag == 'form':
                try:
                    action, fragment = url(node.attrs.get('action', '/search/'))
                    if route != '/search/' or action != '/search/' or fragment or node.attrs.get('method', 'get').lower() != 'get':
                        raise ValueError('表单仅允许搜索页站内 GET 搜索')
                except (ValueError, UnicodeError) as exc:
                    fail(route, str(exc))
            if node.tag == 'meta' and node.attrs.get('http-equiv', '').strip().lower() == 'refresh':
                fail(route, '禁止 meta refresh')
            for key, value in node.attrs.items():
                try:
                    if key.startswith('on') or key in {'download', 'ping', 'formaction', 'attributionsrc', 'srcdoc', 'background', 'manifest', 'codebase', 'data'}:
                        raise ValueError('禁止事件、下载或外发/嵌入属性：' + key)
                    if key == 'action' and node.tag != 'form':
                        raise ValueError('action 只允许用于搜索表单')
                    if key in {'href', 'xlink:href'}:
                        if node.tag == 'a' and key == 'href':
                            destination(route, value)
                            # 无 JS 时 noscript 后备导航可见；仍验证其目标与其他隐藏条件。
                            if not node.visible(allow_noscript=True, allow_collapsed=True):
                                raise ValueError('导航链接隐藏')
                        elif node.tag in {'use', 'image'}:
                            path, fragment = url(value)
                            if path or not fragment or fragment not in doc.ids:
                                raise ValueError('SVG 引用只允许本页现有 ID')
                        elif node.tag == 'link' and key == 'href':
                            if node.attrs.get('rel', '').lower() in {'canonical', 'alternate'}:
                                destination(route, value)
                            else:
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
                    resource(value.strip().strip('"\''))
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
        if not (essays and node and essays.contains(node) and link(node, href)):
            fail('/essays/', '分类/标签缺目录入口')
    # 名称和条目来自内容：空态只要求可见文案，不硬编码“待确认”等原型措辞。
    for route, container, prefix in [('/essays/categories/', mains['/essays/categories/'], '/essays/categories/'),
            ('/essays/tags/', mains['/essays/tags/'], '/essays/tags/')]:
        targets = {r for r in pages if r.startswith(prefix) and TAXONOMY.fullmatch(r)}
        if not targets and not empty(container):
            fail(route, '空分类或标签目录须有可见空态')
        for target in sorted(r for r in targets if not TAXONOMY.fullmatch(r).group(3)):
            if not link(container, target):
                fail(route, '目录缺分类或标签入口：' + target)
    years = sorted({YEAR.fullmatch(r).group(1) for r in pages if YEAR.fullmatch(r)}, reverse=True)
    for route, container in (('/essays/', docs['/essays/'].ids.get('timeline')), ('/essays/archive/', mains['/essays/archive/'])):
        listed = [n for n in docs[route].nodes if 'data-year' in n.attrs]
        if not essay_routes:
            if listed or not empty(container):
                fail(route, '没有文章时须保留可见空态，不编造年份')
        elif ([n.attrs['data-year'] for n in listed] != years
              or not all(container and container.contains(n) and n.visible() and link(n, f'/essays/{n.attrs["data-year"]}/') for n in listed)):
            fail(route, '时间线须倒序列出全部非空年份，并各自链到年份页')
        if any('data-article' in n.attrs for n in docs[route].nodes):
            fail(route, '随笔入口与年份归档不直接堆积文章条目')
    covered = []
    for year in years:
        numbered = sorted((int(YEAR.fullmatch(r).group(2) or 1), r) for r in pages if YEAR.fullmatch(r) and YEAR.fullmatch(r).group(1) == year)
        if [k for k, _ in numbered] != list(range(1, len(numbered) + 1)):
            fail(f'/essays/{year}/', '年份分页须从第 1 页起连续')
        year_entries = []
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
            year_entries += found
        if [d for d, _ in year_entries] != sorted((d for d, _ in year_entries), reverse=True):
            fail(f'/essays/{year}/', '年份跨页须按日期倒序')
    if sorted(h for _, h in covered) != essay_routes:
        fail('/essays/', '每篇文章须在年份页出现且只出现一次')
    # 分类/标签分页独立检查连续、容量及跨页顺序，不假设名称必须为 ASCII。
    groups = {}
    for route in pages:
        match = TAXONOMY.fullmatch(route)
        if match:
            groups.setdefault(match.group(1, 2), []).append((int(match.group(3) or 1), route))
    for group in groups.values():
        numbered = sorted(group)
        if [k for k, _ in numbered] != list(range(1, len(numbered) + 1)):
            fail(numbered[0][1], '分类/标签分页须从第 1 页起连续')
        all_found = []
        for k, route in numbered:
            found = entries(route, mains[route], '分类/标签页')
            if not 1 <= len(found) <= TAXONOMY_PAGE_SIZE or (k < len(numbered) and len(found) != TAXONOMY_PAGE_SIZE):
                fail(route, '分类/标签分页容量不符')
            all_found += found
        if ([d for d, _ in all_found] != sorted((d for d, _ in all_found), reverse=True)
                or len({href for _, href in all_found}) != len(all_found)):
            fail(numbered[0][1], '分类/标签跨页须按日期倒序且文章不重复')
    recent = entries('/', docs['/'].ids.get('overview-essays'), '首页随笔')
    latest = sorted(sorted(covered, key=lambda e: e[1]), key=lambda e: e[0], reverse=True)[:HOME_RECENT]
    if recent != latest:
        fail('/', f'首页随笔速览须为最新的 {HOME_RECENT} 篇以内，且与年份页一致')
    contact = docs['/about/'].ids.get('contact')
    if not (contact and mains['/about/'] and mains['/about/'].contains(contact) and contact.visible() and text(contact)):
        fail('/about/', '联系须位于正文且可见')
    for route, doc in docs.items():
        marker = 'data-essay-body' if route in essay_routes else 'data-work-body' if route in work_routes else 'data-page-body' if route == '/about/' else None
        bodies = [n for n in doc.nodes if any(key in n.attrs for key in ('data-essay-body', 'data-work-body', 'data-page-body'))]
        if marker:
            if (len(bodies) != 1 or bodies[0].tag != 'article' or marker not in bodies[0].attrs
                    or not bodies[0].visible() or not text(bodies[0]) or not (mains[route] and mains[route].contains(bodies[0]))):
                fail(route, '详情须有唯一可见且位于正文内的 article[' + marker + ']')
        elif bodies:
            fail(route, '正文标记不属于此页面')
        if route in essay_routes and not link(mains[route], '/essays/'):
            fail(route, '文章页缺返回随笔链接')
        if route in work_routes and not link(mains[route], '/works/'):
            fail(route, '作品页缺返回作品链接')
    for route, cap in (('/works/', WORK_PAGE_SIZE), ('/', 3)):
        container = mains[route] if route == '/works/' else docs['/'].ids.get('overview-works')
        found = works(route, container)
        if len(found) > cap:
            fail(route, '作品速览超出上限')
        if route == '/works/':
            lists = [n for n in docs[route].nodes if 'data-work-list' in n.attrs]
            if len(lists) != 1 or not (container and container.contains(lists[0])):
                fail(route, '须有位于正文内的唯一 data-work-list')
            elif not found and not empty(lists[0]):
                fail(route, '作品列表为空时须有可见空态')
    numbered = sorted((int(WORK_ARCHIVE.fullmatch(r).group(1) or 1), r) for r in pages if WORK_ARCHIVE.fullmatch(r))
    if [k for k, _ in numbered] != list(range(1, len(numbered) + 1)):
        fail('/works/archive/', '作品分页须从第 1 页起连续')
    covered_works = []
    for k, route in numbered:
        found = works(route, mains[route])
        if len(found) > WORK_PAGE_SIZE or (k < len(numbered) and len(found) != WORK_PAGE_SIZE):
            fail(route, '作品分页容量不符')
        if not found and (work_routes or not empty(mains[route])):
            fail(route, '作品归档为空时须有可见空态')
        covered_works += found
    if sorted(covered_works) != work_routes:
        fail('/works/archive/', '每个作品须在归档中出现且只出现一次')
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
    # 只扫描内容路由；不跟随 href，不把未知目录中的 HTML 当作已批准路由。
    for section in ('essays', 'works'):
        base = root / section
        safe(base)
        for directory, subdirs, files in os.walk(base):
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

    # 根静态文件与公开媒体目录逐个检查后登记；不存在的文件永不成为合法链接。
    with os.scandir(root) as entries:
        for entry in entries:
            path = Path(entry.path)
            if entry.name in {'_next', 'images', 'media', 'uploads'} or (entry.is_file(follow_symlinks=False) and path.suffix != '.html'):
                enumerate_assets(path)
            elif path.is_symlink() and (entry.name in {'favicon.ico', 'icon.svg', 'feed.xml', 'search-index.json', 'robots.txt', 'sitemap.xml'}):
                safe(path)
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
