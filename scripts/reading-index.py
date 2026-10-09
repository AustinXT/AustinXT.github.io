"""原型索引纯函数：读已解析详情元数据、派生目录片段；不读取或覆盖文件。"""
import hashlib
import json
import re
from datetime import date
from html import escape


def labels(values):
    if not isinstance(values, list) or any(not isinstance(value, str) or not value.strip() or re.search(r"[\x00-\x1f]", value) for value in values):
        raise ValueError("分类／标签必须是非空字符串数组，未提供时显式使用 []")
    return list(dict.fromkeys(value.strip() for value in values))


def valid_date(value):
    if not isinstance(value, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        raise ValueError("日期必须是 YYYY-MM-DD，不用系统日期补造")
    return date.fromisoformat(value).isoformat()


def read_article(ids, href):
    article, title, meta = ids.get("article"), ids.get("article-title"), ids.get("article-meta")
    if article is None or title is None or meta is None or not article.contains(title) or not article.contains(meta) or title.is_inert() or meta.is_inert():
        raise ValueError("已登记详情须有可读标题与日期元数据")
    times = [node for node in meta.walk() if node.tag == "time" and not node.is_inert()]
    if len(times) != 1:
        raise ValueError("候选原始日期必须明确且只有一个")
    fields = {}
    for key in ("categories", "tags"):
        raw = article.attrs.get(f"data-{key}")
        if raw is None:
            raise ValueError(f"缺原型元数据 data-{key}；未知不能默判已归类")
        fields[key] = labels(json.loads(raw))
    return {"href": href, "title": re.sub(r"\s+", " ", title.text()).strip(), "date": valid_date(times[0].attrs.get("datetime")), **fields}


def taxonomy_id(kind, label):
    if kind not in {"category", "tag"}:
        raise ValueError("未知索引类型")
    return kind + "-" + hashlib.sha256(label.encode("utf-8")).hexdigest()[:12]


def catalogue(records):
    articles, seen = [], set()
    for record in records:
        href, title = record.get("href"), record.get("title")
        if not isinstance(href, str) or not re.fullmatch(r"[a-z][a-z0-9-]*\.html", href) or href in seen:
            raise ValueError("详情须为唯一登记的本地文件，不从任意链接读取")
        if not isinstance(title, str) or not title.strip():
            raise ValueError("标题不能为空")
        seen.add(href)
        articles.append({"href": href, "title": title.strip(), "date": valid_date(record.get("date")), "categories": labels(record.get("categories")), "tags": labels(record.get("tags"))})
    groups = {}
    for key, kind, page in (("categories", "category", "categories.html"), ("tags", "tag", "tags.html")):
        names = list(dict.fromkeys(label for article in articles for label in article[key]))
        groups[key] = [
            {"label": label, "id": taxonomy_id(kind, label), "href": page + "#" + taxonomy_id(kind, label), "articles": sorted((article for article in articles if label in article[key]), key=lambda article: article["date"], reverse=True)}
            for label in names
        ]
    years = sorted({int(article["date"][:4]) for article in articles}, reverse=True)
    return {
        "articles": articles, **groups,
        "featured_categories": groups["categories"][:4], "featured_tags": groups["tags"][:6],
        "years": [{"year": year, "articles": sorted((article for article in articles if int(article["date"][:4]) == year), key=lambda article: article["date"], reverse=True)} for year in years],
    }


def article_list(articles):
    rows = [
        f'<li data-article="{escape(article["href"], quote=True)}"><time datetime="{article["date"]}">{article["date"][5:]}</time><a href="{escape(article["href"], quote=True)}" data-index-title>{escape(article["title"])}</a></li>'
        for article in articles
    ]
    return '<ul class="article-list">\n' + "\n".join(rows) + "\n</ul>"


def preview(groups, kind):
    if not groups:
        label = "分类" if kind == "category" else "标签"
        return f'<p class="empty-note" data-index-empty>尚无已登记{label}，待你确认名称与文章归属；不补造条目。</p>'
    rows = [
        f'<li data-{kind}-preview="{escape(group["label"], quote=True)}"><a href="{group["href"]}"><span data-taxonomy-name>{escape(group["label"])}</span><small>{len(group["articles"])} 条样本</small></a></li>'
        for group in groups
    ]
    cls = "taxonomy-grid" if kind == "category" else "tag-list"
    return f'<ul class="{cls}">\n' + "\n".join(rows) + "\n</ul>"


def essays_fragment(data):
    categories = preview(data["featured_categories"], "category")
    tags = preview(data["featured_tags"], "tag")
    years = "\n".join(
        f'<section id="year-{group["year"]}" data-year="{group["year"]}"><h3 class="year-heading">{group["year"]}</h3>\n{article_list(group["articles"])}</section>'
        for group in data["years"]
    ) or '<p class="empty-note" data-index-empty>尚无已登记的文章日期。</p>'
    return f'''<section id="featured-categories" class="essay-section" data-reading-section="categories" aria-labelledby="categories-heading">
<h2 class="overview-title" id="categories-heading">精选专栏</h2>
<p class="section-note">分类，预览前 4 个；不足四个不强凑。</p>
{categories}
<a class="more-link" href="categories.html">全部专栏 →</a>
</section>
<section id="featured-tags" class="essay-section" data-reading-section="tags" aria-labelledby="tags-heading">
<h2 class="overview-title" id="tags-heading">精选专题</h2>
<p class="section-note">标签，预览前 6 个；名称与归属以登记元数据为准。</p>
{tags}
<a class="more-link" href="tags.html">全部专题 →</a>
</section>
<section id="timeline" class="essay-section" data-reading-section="timeline" aria-labelledby="timeline-heading">
<h2 class="overview-title" id="timeline-heading">时间线</h2>
<p class="section-note">所有有条目的年份，按候选原始日期倒序；不是全部旧博客统计。</p>
{years}
</section>'''


def taxonomy_fragment(data, kind):
    key = "categories" if kind == "category" else "tags"
    groups = data[key]
    if not groups:
        label = "分类" if kind == "category" else "标签"
        return f'<p class="empty-note" data-index-empty>当前没有已登记{label}，尚不能按{label}查找文章。</p>'
    return "\n".join(
        f'<section class="essay-section" id="{group["id"]}" data-{kind}-group="{escape(group["label"], quote=True)}"><h2 class="overview-title" data-taxonomy-name>{escape(group["label"])}</h2>\n{article_list(group["articles"])}</section>'
        for group in groups
    )
