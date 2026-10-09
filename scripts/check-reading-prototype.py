#!/usr/bin/env python3
"""只读检查指定原型页面；不执行代码、不读取任意链接目标、不判人验收。"""
import importlib.util
import re
import sys
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}
PAGES = {"prototype.html": "home", "essays.html": "essays", "works.html": "works", "about.html": "about", "article.html": "article", "categories.html": "categories", "tags.html": "tags", "work-preview.html": "work-preview"}
INDEX_SPEC = importlib.util.spec_from_file_location("reading_index", Path(__file__).with_name("reading-index.py"))
INDEX = importlib.util.module_from_spec(INDEX_SPEC)
INDEX_SPEC.loader.exec_module(INDEX)
ARTICLE_PAGES = ("article.html",)
STYLE = "prototype.css"
REQUIRED = (*PAGES, STYLE)
MENU = (("prototype.html", "首页"), ("essays.html", "随笔"), ("works.html", "作品"), ("about.html", "简介"))
OVERVIEW = (("intro", "简介"), ("recent", "随笔"), ("works", "作品"), ("contact", "联系"))
SAMPLE_LABEL = "AI 排版样本，非已整理稿"


class Element:
    def __init__(self, tag, attrs=(), parent=None):
        self.tag = tag
        self.attrs = {name: value or "" for name, value in attrs}
        self.parent = parent
        self.children = []
        self.parts = []

    def walk(self):
        yield self
        for child in self.children:
            yield from child.walk()

    def text(self):
        return "".join(part.text() if isinstance(part, Element) else part for part in self.parts)

    def contains(self, node):
        return any(item is node for item in self.walk())

    def is_inert(self):
        node = self
        while node is not None:
            if "hidden" in node.attrs or "inert" in node.attrs or node.tag in {"template", "script", "style"}:
                return True
            node = node.parent
        return False


class Document(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Element("document")
        self.stack = [self.root]
        self.errors = []

    def handle_starttag(self, tag, attrs):
        if len(dict(attrs)) != len(attrs):
            self.errors.append(f"重复属性：{tag}")
        node = Element(tag, attrs, self.stack[-1])
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
            self.errors.append(f"标签未按顺序闭合：{tag}")
            return
        self.stack.pop()

    def handle_data(self, data):
        self.stack[-1].parts.append(data)


def normalized(text):
    return re.sub(r"\s+", " ", text).strip()


def has_link(container, href, entry=None):
    return container is not None and any(
        node.tag == "a" and not node.is_inert() and node.attrs.get("href") == href
        and (entry is None or node.attrs.get("data-entry") == entry)
        for node in container.walk()
    )


def load(root):
    root = Path(root).absolute()
    if not root.is_dir() or any(path.is_symlink() for path in (root, *root.parents)):
        raise ValueError("参数须为不含软链接的模块目录；单 HTML 文件参数已退休")
    files = {}
    for name in REQUIRED:
        path = root / name
        if path.is_symlink():
            raise ValueError(f"目标不得为软链接：{name}")
        if not path.exists():
            continue
        if not path.is_file():
            raise ValueError(f"目标须为普通文件：{name}")
        files[name] = path.read_text(encoding="utf-8")
    return files


def check_indexes(catalog, ids_by_page, fail):
    essay_ids = ids_by_page["essays.html"]
    essays = essay_ids.get("essays")
    sections = [node for node in essays.children if node.tag == "section"] if essays is not None else []
    expected_sections = (("featured-categories", "categories", "精选专栏"), ("featured-tags", "tags", "精选专题"), ("timeline", "timeline", "时间线"))
    if [(node.attrs.get("id"), node.attrs.get("data-reading-section")) for node in sections] != [(name, kind) for name, kind, _ in expected_sections] or any(node.is_inert() for node in sections):
        fail("index", "essays.html", "必须依次显示专栏、专题和时间线三段")
    for name, _, label in expected_sections:
        section = essay_ids.get(name)
        headings = [node for node in section.children if node.tag == "h2" and not node.is_inert()] if section is not None else []
        if len(headings) != 1 or normalized(headings[0].text()) != label:
            fail("index", "essays.html", f"索引段缺明确标题：{label}")

    def empty_note(container):
        return container is not None and any("data-index-empty" in node.attrs and not node.is_inert() and normalized(node.text()) for node in container.walk())

    def article_rows(container, expected, page_name):
        rows = [node for node in container.walk() if "data-article" in node.attrs] if container is not None else []
        if [node.attrs.get("data-article") for node in rows] != [article["href"] for article in expected] or any(node.is_inert() or node.tag != "li" for node in rows):
            fail("index", page_name, "文章索引数量、顺序或可见性与详情元数据不符")
            return
        for node, article in zip(rows, expected):
            titles = [child for child in node.walk() if "data-index-title" in child.attrs and not child.is_inert()]
            times = [child for child in node.walk() if child.tag == "time" and not child.is_inert()]
            if len(titles) != 1 or titles[0].tag != "a" or titles[0].attrs.get("href") != article["href"] or normalized(titles[0].text()) != article["title"] or len(times) != 1 or times[0].attrs.get("datetime") != article["date"] or normalized(times[0].text()) != article["date"][5:]:
                fail("index", page_name, "索引标题、日期与目标须来自同一详情")

    for key, kind, section_id, full_page in (("categories", "category", "featured-categories", "categories.html"), ("tags", "tag", "featured-tags", "tags.html")):
        section = essay_ids.get(section_id)
        expected = catalog["featured_" + key]
        nodes = [node for node in section.walk() if f"data-{kind}-preview" in node.attrs] if section is not None else []
        if [node.attrs.get(f"data-{kind}-preview") for node in nodes] != [group["label"] for group in expected] or any(node.is_inert() for node in nodes):
            fail("index", "essays.html", "分类／标签预览须按登记顺序取前 4／6，不增项或漏项")
        for node, group in zip(nodes, expected):
            names = [child for child in node.walk() if "data-taxonomy-name" in child.attrs and not child.is_inert()]
            if not has_link(node, group["href"]) or len(names) != 1 or normalized(names[0].text()) != group["label"]:
                fail("index", "essays.html", "预览名称与完整目录入口不符")
        if not expected and not empty_note(section):
            fail("index", "essays.html", "资料未登记时必须明确空态，不编造名称")
        if not has_link(section, full_page):
            fail("index", "essays.html", "完整分类／专题页须有入口")
        full = ids_by_page[full_page].get(key + "-index")
        groups = [node for node in full.walk() if f"data-{kind}-group" in node.attrs] if full is not None else []
        if [node.attrs.get(f"data-{kind}-group") for node in groups] != [group["label"] for group in catalog[key]] or any(node.is_inert() for node in groups):
            fail("index", full_page, "完整目录不截断、不添加未登记实体")
        for node, group in zip(groups, catalog[key]):
            names = [child for child in node.walk() if "data-taxonomy-name" in child.attrs and not child.is_inert()]
            if node.attrs.get("id") != group["id"] or len(names) != 1 or normalized(names[0].text()) != group["label"]:
                fail("index", full_page, "分类／标签名称与目标 ID 必须一致")
            article_rows(node, group["articles"], full_page)
        if not catalog[key] and not empty_note(full):
            fail("index", full_page, "完整目录缺诚实空态")
    timeline = essay_ids.get("timeline")
    years = [node for node in timeline.walk() if "data-year" in node.attrs] if timeline is not None else []
    if [node.attrs.get("data-year") for node in years] != [str(group["year"]) for group in catalog["years"]] or any(node.is_inert() for node in years):
        fail("timeline", "essays.html", "须包含全部非空年份，倒序且无额外空年")
    for node, group in zip(years, catalog["years"]):
        headings = [child for child in node.children if child.tag in {"h2", "h3"} and not child.is_inert()]
        if len(headings) != 1 or normalized(headings[0].text()) != str(group["year"]):
            fail("timeline", "essays.html", "年份标题与数据不符")
        article_rows(node, group["articles"], "essays.html")


def check(files):
    if not isinstance(files, dict) or any(not isinstance(text, str) for text in files.values()):
        raise ValueError("check 接收文件名到文本的字典，旧单 HTML 接口已退休")
    errors = []

    def fail(rule, name, message):
        errors.append(f"[{rule}] {name}：{message}")

    for name in REQUIRED:
        if name not in files:
            fail("files", name, "缺少指定原型文件")
    for name in files.keys() - set(REQUIRED):
        fail("files", name, "不属于本轮指定原型文件")
    if errors:
        return errors

    documents, nodes_by_page, ids_by_page = {}, {}, {}
    for name in PAGES:
        document = Document()
        document.feed(files[name])
        document.close()
        documents[name] = document
        nodes = list(document.root.walk())
        nodes_by_page[name] = nodes
        ids = [node.attrs["id"] for node in nodes if "id" in node.attrs]
        ids_by_page[name] = {node.attrs["id"]: node for node in nodes if "id" in node.attrs}
        if document.errors or len(document.stack) != 1:
            fail("syntax", name, "标签或属性未完整闭合")
        if "" in ids or any(count > 1 for count in Counter(ids).values()):
            fail("ids", name, "文档内 ID 必须非空且唯一")
        page = ids_by_page[name].get(PAGES[name])
        roots = [node for node in nodes if "data-page" in node.attrs]
        if roots != [page] or page is None or page.attrs.get("data-page") != PAGES[name] or page.is_inert():
            fail("page", name, "必须有唯一、非隐藏的本页内容，不埋其他逻辑页")
        menu = ids_by_page[name].get("main-menu")
        links = [node for node in menu.walk() if node.tag == "a" and not node.is_inert()] if menu is not None else []
        if [(node.attrs.get("href"), normalized(node.text())) for node in links] != list(MENU):
            fail("navigation", name, "菜单须完整匹配首页、随笔、作品、简介及独立文件目标")
        current = [node for node in links if "aria-current" in node.attrs]
        expected = "essays.html" if name in {"article.html", "categories.html", "tags.html"} else "works.html" if name == "work-preview.html" else name
        if len(current) != 1 or current[0].attrs.get("href") != expected or current[0].attrs.get("aria-current") != "page":
            fail("current", name, "当前菜单须准确，文章详情归属随笔")
        styles = [node for node in nodes if node.tag == "link" and node.attrs.get("rel") == "stylesheet" and node.attrs.get("href") == STYLE]
        if len(styles) != 1:
            fail("styles", name, "必须引用一份指定的本地共享样式")

    def target(name, href):
        try:
            parsed = urlsplit(href)
        except ValueError:
            return None
        path = unquote(parsed.path)
        if not href or parsed.scheme or parsed.netloc or parsed.query or (path and path not in PAGES):
            return None
        destination = path or name
        fragment = unquote(parsed.fragment)
        if "#" in href and not fragment:
            return None
        if fragment and fragment not in ids_by_page[destination]:
            return None
        return destination, fragment

    for name, nodes in nodes_by_page.items():
        for node in nodes:
            if node.tag in {"base", "iframe", "object", "embed", "form", "script", "style"} or any(key in node.attrs for key in ("src", "srcset", "poster", "style", "ping", "attributionsrc")):
                fail("offline", name, f"只用原生链接与共享 CSS，不接受代码或资源入口：{node.tag}")
            if "data-layout-option" in node.attrs or any(key.startswith("on") for key in node.attrs):
                fail("offline", name, "不接受旧切页控件或内联事件属性")
            if "xlink:href" in node.attrs or ("href" in node.attrs and node.tag not in {"a", "link"}):
                fail("offline", name, "非导航资源属性不得加载内容")
            if node.tag == "link" and not (node.attrs.get("rel") == "stylesheet" and node.attrs.get("href") == STYLE):
                fail("offline", name, "只允许指定的本地共享样式")
            if node.tag == "meta" and node.attrs.get("http-equiv", "").strip().lower() == "refresh":
                fail("offline", name, "不允许自动跳转")
            if node.tag == "a":
                try:
                    resolved = target(name, node.attrs.get("href", ""))
                except ValueError:
                    resolved = None
                if resolved is None:
                    fail("anchors", name, f"非指定本地文件或目标片段不存在：{node.attrs.get('href', '')}")

    css = re.sub(r"/\*.*?\*/", "", files[STYLE], flags=re.S)
    if not css.strip():
        fail("styles", STYLE, "共享样式不能为空")
    if re.search(r"@import\b|url\s*\(", css, re.I) or "\\" in css:
        fail("offline", STYLE, "本轮样式不使用导入、资源 URL 或转义加载入口")

    home_ids = ids_by_page["prototype.html"]
    home, blocks = home_ids.get("home"), home_ids.get("home-blocks")
    if home is None or blocks is None or home.children != [blocks] or [node.attrs.get("id") for node in blocks.children] != [key for key, _ in OVERVIEW] or any(node.tag != "section" or node.is_inert() for node in blocks.children):
        fail("overview", "prototype.html", "首页须只有固定顺序的四块速览")
    else:
        for node, (_, label) in zip(blocks.children, OVERVIEW):
            headings = [child for child in node.children if child.tag in {"h1", "h2"} and not child.is_inert()]
            if len(headings) != 1 or normalized(headings[0].text()) != label:
                fail("overview", "prototype.html", f"速览缺明确标题：{label}")
    for section, href, entry in (
        ("intro", "about.html", "about"), ("works", "works.html", "works"),
        ("contact", "about.html#contact", "contact"),
    ):
        if not has_link(home_ids.get(section), href, entry):
            fail("overview", "prototype.html", f"速览必须跳到独立详情：{section}")
    if not has_link(home_ids.get("recent"), "article.html", "recent"):
        fail("recent", "prototype.html", "首篇入口须进入独立文章详情")
    if not has_link(home_ids.get("explore"), "essays.html", "archive") or not has_link(home_ids.get("explore"), "categories.html", "categories") or not has_link(home_ids.get("explore"), "tags.html", "tags"):
        fail("discovery", "prototype.html", "随笔、专栏和专题须有明确独立入口")
    try:
        catalog = INDEX.catalogue([INDEX.read_article(ids_by_page[name], name) for name in ARTICLE_PAGES])
    except (ValueError, TypeError) as exc:
        fail("metadata", "article.html", str(exc))
    else:
        check_indexes(catalog, ids_by_page, fail)
    work_ids = ids_by_page["works.html"]
    real_works = work_ids.get("works-list")
    if real_works is None or real_works.is_inert() or real_works.children or any("data-work-real" in node.attrs for node in nodes_by_page["works.html"]):
        fail("works", "works.html", "实际作品尚未登记，样本不得混作真实作品")
    sample = work_ids.get("work-layout-sample")
    rows = [node for node in sample.walk() if node.tag == "a" and "data-work-sample" in node.attrs] if sample is not None else []
    if len(rows) != 1 or rows[0].attrs.get("href") != "work-preview.html" or rows[0].is_inert() or rows[0].attrs.get("data-work-sample") != "true":
        fail("works", "works.html", "须有独立于实际列表的图标排版预览入口")
    elif not any("data-work-icon" in node.attrs and not node.is_inert() for node in rows[0].walk()):
        fail("works", "works.html", "图标行缺默认图标位")
    if sample is None or sample.is_inert() or "非实际作品" not in normalized(sample.text()):
        fail("works", "works.html", "排版示例身份须明确且非隐藏")
    preview_ids = ids_by_page["work-preview.html"]
    work_preview = preview_ids.get("work-preview")
    notices = [node for node in work_preview.walk() if "data-work-preview-status" in node.attrs and not node.is_inert()] if work_preview is not None else []
    if not notices or not any("非实际作品" in normalized(node.text()) for node in notices) or not has_link(work_preview, "works.html", "return-works"):
        fail("works", "work-preview.html", "详情预览须明确非实际作品并能返回作品")
    about_ids = ids_by_page["about.html"]
    about, contact = about_ids.get("about"), about_ids.get("contact")
    if about is None or contact is None or not about.contains(contact) or contact.is_inert():
        fail("contact", "about.html", "联系内容必须位于简介页且非隐藏")

    article_ids = ids_by_page["article.html"]
    article, body = article_ids.get("article"), article_ids.get("article-body")
    articles = [(name, node) for name, nodes in nodes_by_page.items() for node in nodes if node.tag == "article"]
    if len(articles) != 1 or articles[0][0] != "article.html" or article is None or article.tag != "article":
        fail("article", "article.html", "所有指定页面合计只有一篇正文，且只在详情页")
    if article is None or body is None or not article.contains(body) or body.is_inert():
        fail("body", "article.html", "详情须有唯一、非隐藏的正文容器")
    else:
        if any(node.tag in {"h2", "h3"} and not body.contains(node) for node in article.walk()):
            fail("body", "article.html", "正文小节不得另存在容器之外")
        signature = normalized(body.text())
        if not signature or sum(normalized(document.root.text()).count(signature) for document in documents.values()) != 1:
            fail("body", "article.html", "完整正文须在指定页面中只出现一次")
        paragraph_nodes = [node for node in body.walk() if node.tag == "p"]
        if not paragraph_nodes or any(node.is_inert() for node in paragraph_nodes):
            fail("body", "article.html", "正文段落不得缺失或隐藏")
        paragraphs = [normalized(node.text()) for node in paragraph_nodes]
        if any(count > 1 for count in Counter(zip(paragraphs, paragraphs[1:])).values()):
            fail("body", "article.html", "正文内有重复连续段落")
    toc = article_ids.get("article-toc")
    toc_links = [node for node in toc.walk() if node.tag == "a"] if toc is not None else []
    if article is None or toc is None or not article.contains(toc) or toc.is_inert() or not toc_links:
        fail("anchors", "article.html", "详情须有可用目录")
    else:
        for link in toc_links:
            resolved = target("article.html", link.attrs.get("href", ""))
            heading = article_ids.get(resolved[1]) if resolved is not None and resolved[0] == "article.html" else None
            if heading is None or heading.tag not in {"h2", "h3"} or not article.contains(heading) or heading.is_inert():
                fail("anchors", "article.html", "目录必须指向本篇正文的实际小节")
    if not has_link(article, "essays.html", "return-list"):
        fail("return", "article.html", "详情须返回独立随笔页")
    labels = [node for node in nodes_by_page["article.html"] if "data-sample-status" in node.attrs]
    if not any(article is not None and article.contains(node) and not node.is_inert() and SAMPLE_LABEL in normalized(node.text()) for node in labels):
        fail("status", "article.html", "详情须保留可见的 AI 占位声明")
    return errors


def main():
    if len(sys.argv) > 2:
        print("用法：check-reading-prototype.py [模块目录]", file=sys.stderr)
        return 2
    root = Path(sys.argv[1]) if len(sys.argv) == 2 else Path(__file__).resolve().parent.parent / "src/reading"
    try:
        errors = check(load(root))
    except (OSError, ValueError) as exc:
        print(f"✗ 检查器无法完成：{exc}", file=sys.stderr)
        return 2
    for error in errors:
        print(f"✗ {error}")
    if errors:
        return 1
    print("✓ 八页原型、三层目录与预览上限、全部年份、图标详情及原有护栏通过")
    print("· 只查指定文件的静态规则，不验证实际绘制、人审、Hugo 构建或发布")
    return 0


if __name__ == "__main__":
    sys.exit(main())
