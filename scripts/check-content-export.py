#!/usr/bin/env python3
"""正文导出契约：每篇非草稿 .md 都导出为 /essays/<slug>/index.html，且正文在首个 HTML 的脚本之外。

只读 content/essays/*.md 的简单 front matter 行（slug、title、draft）与对应导出页。
严格的 front matter 校验在构建端（src/site/lib/content.ts）；这里用另一套读法交叉对账，不一致即失败。
不执行 JS，不判排版、人审或线上；check(sources, pages, exported) 为纯函数，便于反例回归。
"""
import os
import re
import stat
import sys
from html.parser import HTMLParser
from pathlib import Path

STATIC = {'categories', 'tags'}
# 纯数字目录是年份页（/essays/<年>/），不是文章
YEAR = re.compile(r'^\d{4}$')
FRONT = re.compile(r'\A---\r?\n(.*?)\r?\n---\r?\n(.*)\Z', re.S)
# 含这些字符的行可能被 Markdown 改写，不拿来做逐字核对
MARKUP = re.compile(r'[*_`\[\]()<>|~#!\\&]')
BLOCK = re.compile(r'^(?:[-+>]\s|\d+[.)]\s|```|~~~|\s{4})')
LEAK = re.compile(r'\*\*|\]\(|~~|^#{1,6}\s|\|\s*-{3}', re.M)
DANGER = {'script', 'style', 'iframe', 'object', 'embed', 'form', 'base', 'meta', 'link'}
SKIP = {'script', 'style', 'template', 'noscript'}


def front(text):
    match = FRONT.match(text)
    if not match:
        return None, text
    meta = {}
    for line in match.group(1).splitlines():
        key, sep, value = line.partition(':')
        if sep and key.strip() and not key.startswith((' ', '\t', '-')):
            meta[key.strip()] = value.strip().strip('\'"')
    return meta, match.group(2)


def plain_lines(body):
    lines, fenced = [], False
    for raw in body.splitlines():
        if raw.lstrip().startswith(('```', '~~~')):
            fenced = not fenced
            continue
        line = raw.strip()
        if fenced or len(line) < 4 or BLOCK.match(raw) or MARKUP.search(line):
            continue
        lines.append(line)
    return lines


def squash(text):
    return re.sub(r'\s+', ' ', text).strip()


class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack, self.articles, self.h1 = [], [], []
        self.main_depth = None
        self.article = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag in {'br', 'hr', 'img', 'input', 'meta', 'link', 'source', 'wbr'}:
            if self.article is not None and tag in DANGER:
                self.article['danger'].append(tag)
            return
        self.stack.append(tag)
        if tag == 'main' and attrs.get('id') == 'main-content' and self.main_depth is None:
            self.main_depth = len(self.stack)
        if tag == 'article' and 'data-essay-body' in attrs:
            self.article = {'depth': len(self.stack), 'in_main': self.main_depth is not None,
                            'text': [], 'prose': [], 'danger': []}
            self.articles.append(self.article)
        elif self.article is not None and tag in DANGER:
            self.article['danger'].append(tag)
        if tag == 'h1':
            self.h1.append([])

    def handle_endtag(self, tag):
        if tag not in self.stack:
            return
        while self.stack:
            top = self.stack.pop()
            if self.article is not None and len(self.stack) < self.article['depth']:
                self.article = None
            if self.main_depth is not None and len(self.stack) < self.main_depth:
                self.main_depth = None
            if top == tag:
                break

    def handle_data(self, data):
        if any(tag in SKIP for tag in self.stack):
            return
        if 'h1' in self.stack and self.h1:
            self.h1[-1].append(data)
        if self.article is not None:
            self.article['text'].append(data)
            if not {'pre', 'code'} & set(self.stack[self.article['depth']:]):
                self.article['prose'].append(data)


def check(sources, pages, exported):
    """sources: {文件名: md 文本}；pages: {slug: html}；exported: 导出目录里的文章 slug 集合。"""
    errors, expected = [], set()

    def fail(where, message):
        errors.append(f'{where}：{message}')

    for name, text in sorted(sources.items()):
        meta, body = front(text)
        if meta is None or not meta.get('slug') or not meta.get('title'):
            fail(name, '读不到 slug 或 title')
            continue
        slug = meta['slug']
        if Path(name).stem != slug:
            fail(name, '文件名与 slug 不一致')
        if meta.get('draft') == 'true':
            if slug in exported:
                fail(name, '草稿被导出')
            continue
        expected.add(slug)
        if slug not in exported or slug not in pages:
            fail(name, f'缺导出页 /essays/{slug}/')
            continue
        page = Page()
        page.feed(pages[slug])
        page.close()
        where = f'/essays/{slug}/'
        if len(page.articles) != 1 or not page.articles[0]['in_main']:
            fail(where, '须有唯一位于 main#main-content 内的 article[data-essay-body]')
            continue
        article = page.articles[0]
        if [squash(''.join(h)) for h in page.h1] != [meta['title']]:
            fail(where, 'h1 须唯一且等于 title')
        text, prose = squash(''.join(article['text'])), ''.join(article['prose'])
        if not text:
            fail(where, '正文不在首个 HTML 的脚本之外')
        missing = [line for line in plain_lines(body) if squash(line) not in text]
        if missing:
            fail(where, f'{len(missing)} 行源文纯文本不在正文里，首行：{missing[0][:30]}')
        if LEAK.search(prose):
            fail(where, '正文漏出未编译的 Markdown 标记')
        if article['danger']:
            fail(where, '正文含原生 HTML 危险标签：' + '、'.join(sorted(set(article['danger']))))
    for slug in sorted(exported - expected):
        if not any(Path(name).stem == slug for name in sources):
            fail(f'/essays/{slug}/', '导出页没有对应的 .md 源')
    return errors


def safe(path):
    for component in reversed((path, *path.parents)):
        if stat.S_ISLNK(component.lstat().st_mode):
            raise ValueError('不允许软链接：' + str(component))


def read(path):
    safe(path)
    fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW)
    with os.fdopen(fd, encoding='utf-8') as stream:
        return stream.read()


def load(content_dir, out_dir):
    content_dir, essays = Path(os.path.abspath(content_dir)), Path(os.path.abspath(out_dir)) / 'essays'
    for path in (content_dir, essays):
        safe(path)
        if not path.is_dir():
            raise ValueError('目录不存在：' + str(path))
    sources = {p.name: read(p) for p in sorted(content_dir.glob('*.md'))}
    exported, pages = set(), {}
    for entry in sorted(essays.iterdir()):
        page = entry / 'index.html'
        if entry.name in STATIC or YEAR.match(entry.name) or not entry.is_dir() or entry.is_symlink() or not page.exists():
            continue
        exported.add(entry.name)
        pages[entry.name] = read(page)
    return sources, pages, exported


def main(argv=None):
    argv = sys.argv[1:] if argv is None else argv
    if len(argv) not in (0, 2):
        print('用法：check-content-export.py [content/essays 目录 out 目录]', file=sys.stderr)
        return 2
    site = Path(__file__).absolute().parent.parent / 'src/site'
    content_dir, out_dir = argv if argv else (site / 'content/essays', site / 'out')
    try:
        sources, pages, exported = load(content_dir, out_dir)
    except (OSError, ValueError, UnicodeError) as exc:
        print('检查无法完成：' + str(exc), file=sys.stderr)
        return 2
    errors = check(sources, pages, exported)
    for error in errors:
        print(error, file=sys.stderr)
    if errors:
        return 1
    print(f'正文导出契约通过：{len(pages)} 篇导出，正文均在首个 HTML 的脚本之外；不代表排版、人审或线上。')
    return 0


if __name__ == '__main__':
    sys.exit(main())
