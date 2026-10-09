#!/usr/bin/env python3
"""只改内存或自建临时夹具；不修改原型、原件或人的反馈。"""
import importlib.util
import json
from html import escape
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MODULE = ROOT / "src/reading"
SCRIPT = ROOT / "scripts/check-reading-prototype.py"
SPEC = importlib.util.spec_from_file_location("reading_checker", SCRIPT)
CHECKER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(CHECKER)


class ReadingTests(unittest.TestCase):
    def setUp(self):
        self.files = CHECKER.load(MODULE)

    def assert_rule(self, files, rule):
        errors = CHECKER.check(files)
        self.assertTrue(any(error.startswith(f"[{rule}]") for error in errors), errors)

    def reject(self, old, new, rule, name="prototype.html"):
        self.assertEqual(1, self.files[name].count(old), "破坏操作必须只命中一处")
        files = dict(self.files)
        files[name] = files[name].replace(old, new)
        self.assert_rule(files, rule)

    def body_copy(self):
        content = self.files["article.html"].split('<div id="article-body">', 1)[1].split("</div>", 1)[0]
        for name in ("reading-context", "reading-process", "reading-notes"):
            content = content.replace(f'id="{name}"', f'id="{name}-copy"')
        return content

    def indexed_files(self, categories, tags):
        # 人工夹具仅在内存，绝不把测试分类／标签写进真实样本。
        files = dict(self.files)
        for key, values in (("categories", categories), ("tags", tags)):
            encoded = escape(json.dumps(values, ensure_ascii=False), quote=True)
            files["article.html"] = files["article.html"].replace(f"data-{key}='[]'", f"data-{key}='{encoded}'")
        document = CHECKER.Document()
        document.feed(files["article.html"])
        document.close()
        ids = {node.attrs["id"]: node for node in document.root.walk() if "id" in node.attrs}
        data = CHECKER.INDEX.catalogue([CHECKER.INDEX.read_article(ids, "article.html")])
        source = files["essays.html"]
        begin = source.index('<section id="featured-categories"')
        end = source.rindex("      </section>")
        files["essays.html"] = source[:begin] + CHECKER.INDEX.essays_fragment(data) + "\n" + source[end:]
        for name, kind, region in (("categories.html", "category", "categories"), ("tags.html", "tag", "tags")):
            source = files[name]
            opening = f'<div id="{region}-index" data-index-region>'
            begin = source.index(opening) + len(opening)
            end = source.index("</div>", begin)
            files[name] = source[:begin] + CHECKER.INDEX.taxonomy_fragment(data, kind) + source[end:]
        return files

    def test_valid(self):
        self.assertEqual([], CHECKER.check(self.files))

    def test_retired_single_text_api(self):
        with self.assertRaises(ValueError):
            CHECKER.check(self.files["prototype.html"])

    def test_missing_files(self):
        for name in CHECKER.REQUIRED:
            with self.subTest(name=name):
                files = dict(self.files)
                del files[name]
                self.assert_rule(files, "files")

    def test_undeclared_file(self):
        files = dict(self.files)
        files["contact.html"] = "额外页面"
        self.assert_rule(files, "files")

    def test_missing_home_section(self):
        self.reject('id="contact"', 'id="missing-contact"', "overview")

    def test_wrong_home_order(self):
        source = self.files["prototype.html"]

        def section(name):
            opening = f'<section class="overview-section" id="{name}"'
            return opening + source.split(opening, 1)[1].split("</section>", 1)[0] + "</section>"

        works, contact = section("works"), section("contact")
        files = dict(self.files)
        files["prototype.html"] = source.replace(works, "__WORKS__").replace(contact, works).replace("__WORKS__", contact)
        self.assert_rule(files, "overview")

    def test_fifth_home_section(self):
        self.reject('<section class="overview-section" id="works"', '<section id="extra"><h2>额外</h2></section><section class="overview-section" id="works"', "overview")

    def test_home_section_outside_container(self):
        closing = "</div>\n      </section>\n    </main>"
        self.reject(closing, '</div><section id="extra"><h2>额外</h2></section>\n      </section>\n    </main>', "overview")

    def test_unmarked_reorder_control(self):
        self.reject("</main>", '<button onclick="reorder()">重排</button></main>', "offline")

    def test_retired_layout_controls(self):
        self.reject("</main>", '<button data-layout-option="A">旧控件</button></main>', "offline")

    def test_wrong_home_heading(self):
        self.reject('id="contact-title">联系</h2>', 'id="contact-title">其他</h2>', "overview")

    def test_extra_navigation(self):
        closing = "</nav>\n    </header>"
        self.reject(closing, '<a href="essays.html#all-articles">归档</a>' + closing, "navigation")

    def test_wrong_navigation_label(self):
        self.reject('<a href="works.html">作品</a>', '<a href="works.html">其他</a>', "navigation")

    def test_wrong_navigation_order(self):
        original = '<a href="works.html">作品</a>\n        <a href="about.html">简介</a>'
        changed = '<a href="about.html">简介</a>\n        <a href="works.html">作品</a>'
        self.reject(original, changed, "navigation")

    def test_navigation_still_scrolls_home(self):
        for name in CHECKER.PAGES:
            with self.subTest(name=name):
                current = ' aria-current="page"' if name == "prototype.html" else ""
                original = f'<a href="prototype.html"{current}>首页</a>'
                changed = f'<a href="#home"{current}>首页</a>'
                self.reject(original, changed, "navigation", name)

    def test_wrong_current_page(self):
        self.reject('href="prototype.html" aria-current="page">首页', 'href="prototype.html">首页', "current")

    def test_duplicate_current_page(self):
        self.reject('href="works.html">作品', 'href="works.html" aria-current="page">作品', "current")

    def test_article_belongs_to_essays(self):
        self.reject('href="essays.html" aria-current="page"', 'href="essays.html"', "current", "article.html")

    def test_contact_not_on_home(self):
        self.reject('data-entry="contact" href="about.html#contact"', 'data-entry="contact" href="#contact"', "overview")

    def test_intro_has_independent_page(self):
        self.reject('data-entry="about" href="about.html"', 'data-entry="about" href="#intro"', "overview")

    def test_works_has_independent_page(self):
        self.reject('data-entry="works" href="works.html"', 'data-entry="works" href="#works"', "overview")

    def test_contact_section_missing(self):
        self.reject('id="contact"', 'id="missing-contact"', "contact", "about.html")

    def test_contact_section_hidden(self):
        self.reject('id="contact" class="overview-section"', 'id="contact" class="overview-section" hidden', "contact", "about.html")

    def test_cross_page_anchor_missing(self):
        self.reject('href="about.html#contact"', 'href="about.html#missing"', "anchors")

    def test_cross_page_file_missing(self):
        self.reject('data-entry="works" href="works.html"', 'data-entry="works" href="missing.html"', "anchors")

    def test_link_path_escape(self):
        for href in ("../about.html", "%2e%2e/about.html", "//example.invalid/about.html", "about.html?private=1"):
            with self.subTest(href=href):
                self.reject('data-entry="about" href="about.html"', f'data-entry="about" href="{href}"', "anchors")

    def test_duplicate_article(self):
        self.reject("</main>", '<article id="copy"></article></main>', "article")

    def test_duplicate_body(self):
        copy = '<div id="article-body-copy">' + self.body_copy() + "</div>"
        self.reject('<div class="article-return">', copy + '<div class="article-return">', "body", "article.html")

    def test_duplicate_body_inside_container(self):
        self.reject('<div id="article-body">', '<div id="article-body">' + self.body_copy(), "body", "article.html")

    def test_body_copied_to_other_page(self):
        copy = '<div id="body-copy">' + self.body_copy() + "</div>"
        self.reject("</main>", copy + "</main>", "body", "works.html")

    def test_resource_loads(self):
        snippets = (
            '<svg><image href="https&#58;//example.invalid/a.png"></image></svg>',
            '<svg><image xlink:href="https&#58;//example.invalid/a.png"></image></svg>',
            '<meta http-equiv="refresh" content="0; url=https&#58;//example.invalid/">',
            '<script src="https://example.invalid/a.js"></script>',
            '<script>fetch("remote.json")</script>',
            '<style>@import "remote.css";</style>',
            '<div style="background:url(remote.png)"></div>',
            '<link rel="stylesheet" href="https://example.invalid/a.css">',
            '<link rel="stylesheet" href="../prototype.css">',
        )
        for snippet in snippets:
            with self.subTest(snippet=snippet):
                self.reject("</head>", snippet + "</head>", "offline")

    def test_native_outbound_attributes(self):
        for attribute in ("ping", "attributionsrc"):
            with self.subTest(attribute=attribute):
                self.reject('data-entry="recent" href="article.html"', f'data-entry="recent" href="article.html" {attribute}="https&#58;//example.invalid/audit"', "offline")

    def test_hidden_body_paragraphs(self):
        source = self.files["article.html"]
        body = source.split('<div id="article-body">', 1)[1].split("</div>", 1)[0]
        self.assertIn("<p>", body)
        self.reject(body, body.replace("<p>", "<p hidden>"), "body", "article.html")

    def test_hidden_single_paragraph(self):
        self.reject("<p>这是一段排版占位文字。", "<p hidden>这是一段排版占位文字。", "body", "article.html")

    def test_css_loads(self):
        for snippet in ('@import "remote.css";', 'p {background:url(a.png)}', 'p {background:u/**/rl(a.png)}', r'p {background:\75rl(a.png)}'):
            with self.subTest(snippet=snippet):
                files = dict(self.files)
                files[CHECKER.STYLE] += "\n" + snippet
                self.assert_rule(files, "offline")

    def test_empty_stylesheet(self):
        files = dict(self.files)
        files[CHECKER.STYLE] = ""
        self.assert_rule(files, "styles")

    def test_missing_stylesheet_link(self):
        self.reject('<link rel="stylesheet" href="prototype.css">', "", "styles")

    def test_duplicate_id(self):
        self.reject('id="tags-heading"', 'id="categories-heading"', "ids", "essays.html")

    def test_ids_can_repeat_across_documents(self):
        self.assertIn('id="contact"', self.files["prototype.html"])
        self.assertIn('id="contact"', self.files["about.html"])
        self.assertEqual([], CHECKER.check(self.files))

    def test_broken_toc(self):
        self.reject('<a href="#reading-process">二、再看结构</a>', '<a href="#missing">二、再看结构</a>', "anchors", "article.html")

    def test_toc_targets_wrong_page(self):
        self.reject('<a href="#reading-process">二、再看结构</a>', '<a href="essays.html#timeline-heading">二、再看结构</a>', "anchors", "article.html")

    def test_malformed_toc_url(self):
        self.reject('<a href="#reading-process">二、再看结构</a>', '<a href="http://[broken">二、再看结构</a>', "anchors", "article.html")

    def test_missing_return(self):
        self.reject('<a data-entry="return-list" href="essays.html">← 返回全部文章</a>', "返回已移除", "return", "article.html")

    def test_recent_targets_wrong_article(self):
        self.reject('data-entry="recent" href="article.html"', 'data-entry="recent" href="essays.html"', "recent")

    def test_archive_entry_missing(self):
        self.reject('data-entry="archive" href="essays.html"', 'data-entry="archive" href="#home"', "discovery")

    def test_taxonomy_list_missing_article(self):
        files = self.indexed_files(["测试分类"], [])
        self.assertEqual([], CHECKER.check(files))
        files["categories.html"] = files["categories.html"].replace('data-article="article.html"', 'data-article="missing.html"')
        self.assert_rule(files, "index")

    def test_missing_sample_notice(self):
        self.reject("<strong>AI 排版样本，非已整理稿</strong>", "<strong>历史稿件</strong>", "status", "article.html")

    def test_hidden_sample_notice(self):
        self.reject('class="sample-notice" data-sample-status', 'class="sample-notice" data-sample-status hidden', "status", "article.html")

    def test_notice_ancestors(self):
        source = self.files["article.html"]
        opening = '<p class="sample-notice" data-sample-status>'
        notice = opening + source.split(opening, 1)[1].split("</p>", 1)[0] + "</p>"
        for tag in ("div hidden", "div inert", "template"):
            with self.subTest(tag=tag):
                self.reject(notice, f"<{tag}>{notice}</{tag.split()[0]}>", "status", "article.html")

    def test_hidden_page(self):
        self.reject('id="article" data-page="article"', 'id="article" data-page="article" hidden', "page", "article.html")

    def test_hidden_recent_entry(self):
        self.reject('id="recent" aria-labelledby="recent-title"', 'id="recent" hidden aria-labelledby="recent-title"', "recent")

    def test_hidden_home_blocks(self):
        self.reject('class="home-sections" id="home-blocks"', 'class="home-sections" id="home-blocks" hidden', "overview")

    def test_valueless_section_id(self):
        self.reject('id="works"', "id", "overview")

    def test_valueless_link(self):
        self.reject('data-entry="recent" href="article.html"', 'data-entry="recent" href', "anchors")

    def test_broken_markup(self):
        self.reject("</html>", "", "syntax")

    def test_preview_limits_with_synthetic_data(self):
        categories = [f"测试分类{number}" for number in range(5)]
        tags = [f"测试标签{number}" for number in range(7)]
        files = self.indexed_files(categories, tags)
        self.assertEqual([], CHECKER.check(files))
        self.assertEqual(4, files["essays.html"].count("data-category-preview="))
        self.assertEqual(6, files["essays.html"].count("data-tag-preview="))
        self.assertEqual(5, files["categories.html"].count("data-category-group="))
        self.assertEqual(7, files["tags.html"].count("data-tag-group="))

    def test_taxonomy_order_and_deduplication(self):
        records = [{"href": "a.html", "title": "人工测试", "date": "2019-12-23", "categories": ["乙", "甲", "乙"], "tags": ["Café", "Café", "标签"]}]
        catalog = CHECKER.INDEX.catalogue(records)
        self.assertEqual(["乙", "甲"], [group["label"] for group in catalog["categories"]])
        self.assertEqual(["Café", "标签"], [group["label"] for group in catalog["tags"]])

    def test_all_nonempty_years_and_article_order(self):
        records = [{"href": name, "title": "人工夹具", "date": value, "categories": [], "tags": []} for name, value in (("a.html", "2016-01-01"), ("b.html", "2025-02-01"), ("c.html", "2019-12-23"), ("d.html", "2025-03-01"))]
        catalog = CHECKER.INDEX.catalogue(records)
        self.assertEqual([2025, 2019, 2016], [group["year"] for group in catalog["years"]])
        self.assertEqual(["d.html", "b.html"], [article["href"] for article in catalog["years"][0]["articles"]])
        self.assertEqual([], CHECKER.INDEX.catalogue([])["years"])

    def test_unsafe_or_invalid_metadata(self):
        for field, value in (("categories", "{}"), ("tags", "null"), ("tags", "[7]"), ("categories", "[\"\"]"), ("tags", "[")):
            with self.subTest(field=field, value=value):
                self.reject(f"data-{field}='[]'", f"data-{field}='{value}'", "metadata", "article.html")

    def test_invalid_source_date(self):
        self.reject('datetime="2019-12-23"', 'datetime="2019-02-31"', "metadata", "article.html")

    def test_missing_metadata_field(self):
        self.reject(" data-tags='[]'", "", "metadata", "article.html")

    def test_duplicate_article_registration(self):
        record = {"href": "a.html", "title": "人工夹具", "date": "2019-12-23", "categories": [], "tags": []}
        with self.assertRaises(ValueError):
            CHECKER.INDEX.catalogue([record, record])

    def test_metadata_labels_are_escaped(self):
        files = self.indexed_files(["<script>literal</script>"], ["O'Reilly & Café"])
        self.assertEqual([], CHECKER.check(files))
        self.assertNotIn("<script>literal", files["categories.html"])
        self.assertIn("&lt;script&gt;", files["categories.html"])

    def test_three_index_sections_wrong_order(self):
        self.reject('data-reading-section="categories"', 'data-reading-section="tags"', "index", "essays.html")

    def test_preview_over_limit(self):
        files = self.indexed_files([f"类{number}" for number in range(5)], [f"标签{number}" for number in range(7)])
        # 在同一分类区增加第五项，不能只验证必需四项存在。
        files["essays.html"] = files["essays.html"].replace('<a class="more-link" href="categories.html">', '<li data-category-preview="类4">多余项</li><a class="more-link" href="categories.html">')
        self.assert_rule(files, "index")

    def test_unregistered_taxonomy_not_silently_accepted(self):
        self.reject('<h2 class="overview-title" id="categories-heading">', '<a href="categories.html" data-category-preview="不存在的类别">伪类别</a><h2 class="overview-title" id="categories-heading">', "index", "essays.html")

    def test_timeline_year_missing(self):
        self.reject('data-year="2019"', 'data-year="2020"', "timeline", "essays.html")

    def test_timeline_empty_year_added(self):
        self.reject('<section id="year-2019"', '<section data-year="2020"><h3>2020</h3></section><section id="year-2019"', "timeline", "essays.html")

    def test_timeline_article_missing(self):
        self.reject('data-article="article.html"', 'data-article="missing.html"', "index", "essays.html")

    def test_index_visible_date_not_independently_changed(self):
        self.reject('datetime="2019-12-23">12-23</time>', 'datetime="2019-12-23">01-01</time>', "index", "essays.html")

    def test_index_title_not_independently_changed(self):
        self.reject('data-index-title>卡片大法</a>', 'data-index-title>别的标题</a>', "index", "essays.html")

    def test_work_sample_not_real(self):
        self.reject('<ul id="works-list" class="work-list" aria-label="实际作品列表"></ul>', '<ul id="works-list" class="work-list"><li data-work-real>把样本算为真实作品</li></ul>', "works", "works.html")

    def test_work_icon_missing(self):
        self.reject(" data-work-icon", "", "works", "works.html")

    def test_work_preview_identity_missing(self):
        self.reject("排版样本，非实际作品。", "作品介绍。", "works", "work-preview.html")

    def test_work_preview_return_missing(self):
        self.reject('data-entry="return-works" href="works.html"', 'data-entry="return-works" href="prototype.html"', "works", "work-preview.html")

    def test_work_preview_current_menu(self):
        self.reject('href="works.html" aria-current="page"', 'href="works.html"', "current", "work-preview.html")

    def test_cli_exit_codes(self):
        result = subprocess.run([sys.executable, "-I", str(SCRIPT), str(MODULE)], capture_output=True, text=True)
        self.assertEqual(0, result.returncode, result.stdout + result.stderr)
        with tempfile.TemporaryDirectory(prefix="manzi-reading-site-") as directory:
            root = Path(directory).resolve()
            for name, text in self.files.items():
                (root / name).write_text(text, encoding="utf-8")
            (root / "about.html").write_text(self.files["about.html"].replace('id="contact"', 'id="missing-contact"'), encoding="utf-8")
            invalid = subprocess.run([sys.executable, "-I", str(SCRIPT), str(root)], capture_output=True, text=True)
            self.assertEqual(1, invalid.returncode, invalid.stdout + invalid.stderr)
            retired = subprocess.run([sys.executable, "-I", str(SCRIPT), str(MODULE / "prototype.html")], capture_output=True, text=True)
            self.assertEqual(2, retired.returncode)

    def test_symlink_rejected(self):
        with tempfile.TemporaryDirectory(prefix="manzi-reading-links-") as directory:
            root = Path(directory).resolve()
            alias = root / "module"
            alias.symlink_to(MODULE, target_is_directory=True)
            with self.assertRaises(ValueError):
                CHECKER.load(alias)
            for name, text in self.files.items():
                (root / name).write_text(text, encoding="utf-8")
            (root / CHECKER.STYLE).unlink()
            (root / CHECKER.STYLE).symlink_to(MODULE / CHECKER.STYLE)
            with self.assertRaises(ValueError):
                CHECKER.load(root)

    def test_guard_exit_codes(self):
        guard = (MODULE / "check.sh").read_text(encoding="utf-8")
        negatives = (MODULE / "negatives.md").read_text(encoding="utf-8")
        with tempfile.TemporaryDirectory(prefix="manzi-reading-guard-") as directory:
            root = Path(directory).resolve()
            script, patterns, sample = root / "check.sh", root / "negatives.md", root / "sample.html"
            script.write_text(guard, encoding="utf-8")
            patterns.write_text(negatives, encoding="utf-8")
            sample.write_text(self.files["prototype.html"], encoding="utf-8")

            def run():
                return subprocess.run(["bash", str(script), str(sample)], capture_output=True, text=True)

            self.assertEqual(0, run().returncode)
            sample.write_text(self.files["prototype.html"] + "\n已发布\n", encoding="utf-8")
            self.assertEqual(1, run().returncode)
            patterns.write_text("```PATTERNS\n```\n", encoding="utf-8")
            self.assertEqual(2, run().returncode)
            patterns.write_text("```PATTERNS\n[\t坏正则\n```\n", encoding="utf-8")
            self.assertEqual(2, run().returncode)


if __name__ == "__main__":
    unittest.main(verbosity=2)
