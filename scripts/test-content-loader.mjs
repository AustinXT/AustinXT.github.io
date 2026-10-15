// 正文管线（src/lib/content.ts）的规则回归：每条校验都有一个应被拒绝的反例。
// 用法（项目根）：node --test scripts/test-content-loader.mjs ；依赖 Node 原生类型剥离与 src 已装依赖。
import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  excerpt, getEssay, getEssays, getTaxonomyPage, getWork, getWorks, parseEssay, parseWork,
  publishable, readEssays, readingMinutes, renderMarkdown, taxonomyHref, taxonomyPages, taxonomyTerms, yearPages,
} from "../src/lib/content.ts";

const doc = (front, body = "正文一段。\n") => `---\n${front}\n---\n\n${body}`;
const good = "title: 样本\ndate: 2026-10-10\nslug: good-one";

test("合法文章被接受，日期规范为 YYYY-MM-DD", () => {
  const essay = parseEssay("good-one.md", doc(good));
  assert.equal(essay.slug, "good-one");
  assert.equal(essay.date, "2026-10-10");
  assert.equal(essay.draft, false);
  assert.deepEqual(essay.tags, []);
  assert.equal(parseEssay("good-one.md", doc("title: 样本\ndate: '2026-10-10'\nslug: good-one")).date, "2026-10-10");
});

test("空白手稿可先存草稿，上架前必须补正文", () => {
  assert.equal(parseEssay("good-one.md", doc(`${good}\ndraft: true`, "\n")).body.trim(), "");
  assert.throws(() => parseEssay("good-one.md", doc(`${good}\ndraft: false`, "\n")), /正文为空/);
  assert.equal(parseEssay("good-one.md", doc(`${good}\ndraft: false\nplaceholder: true`, "\n")).placeholder, true);
  assert.throws(() => parseEssay("good-one.md", doc(`${good}\nplaceholder: 'yes'`, "正文")), /placeholder/);
});

test("旧文标题层级在渲染时归一，原正文和围栏代码不改", async () => {
  const source = "# 旧一级标题\n\n## 细节\n\n```md\n# 代码注释\n```\n";
  const first = await renderMarkdown(source);
  assert.doesNotMatch(first.html, /<h1/);
  assert.match(first.html, /<h2 id="旧一级标题">/);
  assert.match(first.html, /<h3 id="细节">/);
  assert.match(first.html, /# 代码注释/);
  const third = await renderMarkdown("### 旧小节\n\n#### 细目\n");
  assert.deepEqual(third.toc, [{ id: "旧小节", text: "旧小节" }]);
  assert.match(third.html, /<h3 id="细目">/);
});

const rejects = [
  ["未知字段（拼错）", "good-one.md", doc(`${good}\ntittle: 错`), /未知字段/],
  ["缺 title", "good-one.md", doc("date: 2026-10-10\nslug: good-one"), /缺 title/],
  ["空 title", "good-one.md", doc("title: '  '\ndate: 2026-10-10\nslug: good-one"), /缺 title/],
  ["slug 含大写", "Good-one.md", doc("title: 样本\ndate: 2026-10-10\nslug: Good-one"), /slug/],
  ["slug 双连字符", "good--one.md", doc("title: 样本\ndate: 2026-10-10\nslug: good--one"), /slug/],
  ["slug 以连字符开头", "-good.md", doc("title: 样本\ndate: 2026-10-10\nslug: -good"), /slug/],
  ["slug 含中文", "文章.md", doc("title: 样本\ndate: 2026-10-10\nslug: 文章"), /slug/],
  ["文件名与 slug 不一致", "other.md", doc(good), /文件名须与 slug 一致/],
  ["slug 撞归档路由", "archive.md", doc("title: 样本\ndate: 2026-10-10\nslug: archive"), /冲突/],
  ["文章不接受作品排序", "good-one.md", doc(`${good}\norder: 1`), /未知字段/],
  ["文章不接受作品外链", "good-one.md", doc(`${good}\nexternalUrl: https://example.com`), /未知字段/],
  ["slug 撞静态路由", "tags.md", doc("title: 样本\ndate: 2026-10-10\nslug: tags"), /冲突/],
  ["slug 超过 40 个字符", "a-very-long-slug-that-keeps-going-on-and-on.md", doc("title: 样本\ndate: 2026-10-10\nslug: a-very-long-slug-that-keeps-going-on-and-on"), /不超过 40/],
  ["slug 纯数字（留给年份页）", "2019.md", doc("title: 样本\ndate: 2026-10-10\nslug: '2019'"), /须含字母/],
  ["revised 不是日期", "good-one.md", doc(`${good}\nrevised: 昨天`), /revised/],
  ["revised 早于 date", "good-one.md", doc(`${good}\nrevised: 2026-01-01`), /早于/],
  ["不存在的日期", "good-one.md", doc("title: 样本\ndate: '2026-02-30'\nslug: good-one"), /date/],
  ["日期格式不对", "good-one.md", doc("title: 样本\ndate: 2026/10/10\nslug: good-one"), /date/],
  ["缺日期", "good-one.md", doc("title: 样本\nslug: good-one"), /date/],
  ["draft 不是布尔", "good-one.md", doc(`${good}\ndraft: 'yes'`), /draft/],
  ["tags 不是数组", "good-one.md", doc(`${good}\ntags: 随笔`), /tags/],
  ["categories 含空项", "good-one.md", doc(`${good}\ncategories: ['']`), /categories/],
  ["description 不是字符串", "good-one.md", doc(`${good}\ndescription: 3`), /description/],
  ["正文为空", "good-one.md", doc(good, "\n  \n"), /正文为空/],
  ["没有 front matter", "good-one.md", "只有正文。\n", /缺 title/],
];

for (const [name, file, source, pattern] of rejects) {
  test(`拒绝：${name}`, () => assert.throws(() => parseEssay(file, source), pattern));
}

const make = (slug, date, draft = false) => ({ slug, title: slug, date, draft, categories: [], tags: [], body: "x" });

test("revised 可选；有则规范为 YYYY-MM-DD", () => {
  assert.equal(parseEssay("good-one.md", doc(good)).revised, undefined);
  assert.equal(parseEssay("good-one.md", doc(`${good}\nrevised: 2026-10-10`)).revised, "2026-10-10");
});

test("年份页：按年拆分，超过上限才分页，页内保持原顺序", () => {
  const list = publishable([make("a", "2019-03-01"), make("b", "2019-02-01"), make("c", "2019-01-01"), make("d", "2018-05-05")]);
  const pages = yearPages(list, 2);
  assert.deepEqual(pages.map((p) => [p.year, p.page, p.pages, p.total, p.essays.map((e) => e.slug)]),
    [["2019", 1, 2, 3, ["a", "b"]], ["2019", 2, 2, 3, ["c"]], ["2018", 1, 1, 1, ["d"]]]);
  assert.deepEqual(yearPages(list).map((p) => p.page), [1, 1]);
  assert.deepEqual(yearPages([]), []);
});

test("草稿不发布；按日期倒序，同日按 slug", () => {
  const order = publishable([make("b", "2026-01-01"), make("a", "2026-01-01"), make("new", "2026-05-01"), make("hidden", "2026-09-01", true)]);
  assert.deepEqual(order.map((essay) => essay.slug), ["new", "a", "b"]);
});

test("渲染：h2/h3 带锚点，重名加序号，h2 进目录", async () => {
  const { html, toc } = await renderMarkdown("## 为何？\n\n### 一\n\n## 小结 A\n\n### 一\n\n#### 不进目录\n");
  assert.deepEqual(toc, [{ id: "为何", text: "为何？" }, { id: "小结-a", text: "小结 A" }]);
  assert.match(html, /<h3 id="一">一<\/h3>[\s\S]*<h3 id="一-2">一<\/h3>/);
  assert.match(html, /<h4>不进目录<\/h4>/);
});

test("渲染：锚点不与已有序号标题或页面外壳 ID 撞名", async () => {
  const { html } = await renderMarkdown("## 一\n\n## 一\n\n## 一 2\n\n## main content\n");
  const ids = [...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(!ids.includes("main-content"));
});

test("渲染：GFM 生效，原生 HTML 被丢弃", async () => {
  const { html } = await renderMarkdown("| a | b |\n|---|---|\n| 1 | ~~2~~ |\n\n<script>alert(1)</script>\n\n<span>文字</span>\n");
  assert.match(html, /<table>/);
  assert.match(html, /<del>2<\/del>/);
  assert.doesNotMatch(html, /<script|<span/);
});


test("分类和标签：去空白、NFC 规范化、去重，保留中文名称", () => {
  const essay = parseEssay("good-one.md", doc(`${good}\ncategories: [' 随笔 ', 随笔, 思考]\ntags: [' café ', 'café', 中文, 中文]`));
  assert.deepEqual(essay.categories, ["随笔", "思考"]);
  assert.deepEqual(essay.tags, ["café", "中文"]);
});

for (const key of ["categories", "tags"]) {
  for (const name of ["", "  ", ".", "..", "a/b", "a\\b", "a?b", "a#b", "a%b", "a\u0000b", "a\u007fb"]) {
    test(`拒绝不安全 ${key}：${JSON.stringify(name)}`, () => {
      assert.throws(() => parseEssay("good-one.md", doc(`${good}\n${key}: [${JSON.stringify(name)}]`)), new RegExp(key));
    });
  }
  test(`拒绝 ${key} 非字符串数组项`, () => {
    assert.throws(() => parseEssay("good-one.md", doc(`${good}\n${key}: [123]`)), new RegExp(key));
  });
}

const classified = (slug, date, categories, tags = [], draft = false) => ({ ...make(slug, date, draft), categories, tags });

test("分类/标签统计：每篇只计一次、过滤草稿、按数量再按中文名称排序", () => {
  const essays = [
    classified("a", "2026-01-01", ["思考", " 旅行 ", "旅行"], ["中文", "中文"]),
    classified("b", "2026-02-01", ["旅行"], ["café", "café"]),
    classified("c", "2026-03-01", ["读书"], ["中文"]),
    classified("hidden", "2026-04-01", ["秘密", "旅行"], ["秘密", "中文"], true),
  ];
  assert.deepEqual(taxonomyTerms(essays, "categories"), [
    { name: "旅行", count: 2 }, { name: "读书", count: 1 }, { name: "思考", count: 1 },
  ]);
  assert.deepEqual(taxonomyTerms(essays, "tags"), [{ name: "中文", count: 2 }, { name: "café", count: 1 }]);
  assert.deepEqual(taxonomyTerms([], "tags"), []);
  assert.deepEqual(taxonomyTerms([essays[3]], "categories"), []);
});

test("分类/标签分页：按日期倒序、页容量受限、集合不含草稿", () => {
  const essays = [
    classified("a", "2026-01-01", ["随笔"], ["生活"]),
    classified("b", "2026-02-01", ["随笔"], ["生活"]),
    classified("c", "2026-03-01", ["随笔"], ["生活"]),
    classified("hidden", "2026-04-01", ["随笔"], ["生活"], true),
  ];
  for (const [key, name] of [["categories", "随笔"], ["tags", "生活"]]) {
    assert.deepEqual(taxonomyPages(essays, key, 2).map((p) => [p.key, p.name, p.page, p.pages, p.total, p.essays.map((e) => e.slug)]), [
      [key, name, 1, 2, 3, ["c", "b"]], [key, name, 2, 2, 3, ["a"]],
    ]);
    assert.deepEqual(taxonomyPages([], key), []);
    assert.deepEqual(taxonomyPages([essays[3]], key), []);
    for (const size of [0, -1, 1.5, Infinity, NaN]) assert.throws(() => taxonomyPages(essays, key, size), /正整数/);
  }
  assert.deepEqual(yearPages([essays[3]]), []);
  assert.throws(() => yearPages(essays, 0), /正整数/);
});

test("分类/标签网址：中文安全编码、第二页路径、非法路径和页码被拒绝", () => {
  assert.equal(taxonomyHref("categories", " 随笔 "), "/essays/categories/%E9%9A%8F%E7%AC%94/");
  assert.equal(taxonomyHref("tags", "café", 2), "/essays/tags/caf%C3%A9/page/2/");
  assert.equal(taxonomyHref("tags", "AI & 思考"), `/essays/tags/${encodeURIComponent("AI & 思考")}/`);
  assert.throws(() => taxonomyHref("other", "随笔"), /分类类型/);
  for (const name of ["..", "a/b", "a\\b", "a?b", "a#b", "a%b"]) assert.throws(() => taxonomyHref("tags", name));
  for (const page of [0, -1, 1.5, Infinity]) assert.throws(() => taxonomyHref("tags", "随笔", page), /页码/);
});

function withContent(run) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "manzi-content-"));
  const originalCwd = process.cwd();
  try {
    process.chdir(dir);
    run(dir);
  } finally {
    process.chdir(originalCwd);
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test("内容集合：目录缺失、空目录、全部草稿时安全，修改后立即生效", () => {
  withContent((dir) => {
    assert.deepEqual(readEssays(path.join(dir, "missing")), []);
    assert.deepEqual(getEssays(), []);
    assert.deepEqual(getWorks(), []);
    assert.equal(getEssay("good-one"), undefined);
    assert.equal(getWork("good-one"), undefined);
    assert.equal(getTaxonomyPage("categories", "随笔"), undefined);
    const essaysDir = path.join(dir, "content", "essays");
    const worksDir = path.join(dir, "content", "works");
    fs.mkdirSync(essaysDir, { recursive: true });
    fs.mkdirSync(worksDir, { recursive: true });
    assert.deepEqual(getEssays(), []);
    assert.deepEqual(getWorks(), []);
    const source = `${good}\ncategories: [随笔]\ntags: [中文]`;
    fs.writeFileSync(path.join(essaysDir, "good-one.md"), doc(`${source}\ndraft: true`));
    fs.writeFileSync(path.join(worksDir, "good-one.md"), doc(`${source}\ndraft: true`));
    assert.deepEqual(getEssays(), []);
    assert.deepEqual(getWorks(), []);
    assert.equal(getTaxonomyPage("tags", "中文"), undefined);
    fs.writeFileSync(path.join(essaysDir, "good-one.md"), doc(source));
    fs.writeFileSync(path.join(worksDir, "good-one.md"), doc(`${source}\nexternalUrl: https://example.com/work`));
    assert.equal(getEssays().length, 1);
    assert.equal(getWorks().length, 1);
    assert.equal(getEssay("good-one").title, "样本");
    assert.equal(getWork("good-one").externalUrl, "https://example.com/work");
    assert.equal(getTaxonomyPage("categories", " 随笔 ").essays[0].slug, "good-one");
    assert.equal(getTaxonomyPage("tags", "中文", 2), undefined);
    assert.equal(getTaxonomyPage("tags", "不存在"), undefined);
    fs.writeFileSync(path.join(essaysDir, "good-one.md"), doc(`${source}\ndraft: true`));
    fs.writeFileSync(path.join(worksDir, "good-one.md"), doc(`${source}\ndraft: true`));
    assert.deepEqual(getEssays(), []);
    assert.deepEqual(getWorks(), []);
    assert.equal(getTaxonomyPage("categories", "随笔"), undefined);
  });
});

test("作品复用文章规则，可选 http/https 外链，默认发布状态兼容已有内容", () => {
  assert.equal(parseWork("good-one.md", doc(good)).externalUrl, undefined);
  assert.equal(parseWork("good-one.md", doc(good)).draft, false);
  for (const url of ["https://example.com/work?q=1#top", "http://example.com/work"]) {
    assert.equal(parseWork("good-one.md", doc(`${good}\nexternalUrl: ${url}`)).externalUrl, url);
  }
  for (const url of ["javascript:alert(1)", "data:text/html,hello", "/relative", "ftp://example.com", "https://user:pass@example.com"]) {
    assert.throws(() => parseWork("good-one.md", doc(`${good}\nexternalUrl: '${url}'`)), /externalUrl/);
  }
  assert.throws(() => parseWork("good-one.md", doc(`${good}\nexternalUrl: 123`)), /externalUrl/);
  assert.throws(() => parseWork("good-one.md", doc(`${good}\nrevised: 2020-01-01`)), /早于/);
  assert.throws(() => parseWork("good-one.md", doc(`${good}\ntags: ['../bad']`)), /tags/);
  assert.throws(() => parseWork("other.md", doc(good)), /文件名/);
  assert.throws(() => parseWork("archive.md", doc("title: 作品\ndate: 2026-10-10\nslug: archive")), /冲突/);
});

test("日期校验：闰日有效、非闰年和超出月份日期被拒绝", () => {
  assert.equal(parseEssay("good-one.md", doc(good.replace("2026-10-10", "'2024-02-29'"))).date, "2024-02-29");
  for (const date of ["2025-02-29", "2026-13-01", "2026-00-01", "2026-01-32"]) {
    assert.throws(() => parseEssay("good-one.md", doc(good.replace("2026-10-10", `'${date}'`))), /date/);
  }
});

test("摘要：优先 description，去掉 Markdown 和 HTML，Unicode 不截断字符", () => {
  const essay = { ...make("plain", "2026-01-01"), description: " **重点** [链接](https://example.com) 与 `代码`。 ", body: "不会选用的正文" };
  assert.equal(excerpt(essay), "重点 链接 与 代码。");
  assert.equal(excerpt({ ...essay, description: "", body: "## 标题\n\n第一段 **正文**。\n\n![图片](test.png) <span>说明</span>" }), "标题 第一段 正文。 说明");
  assert.equal(excerpt({ ...essay, description: "😀中文测试" }, 3), "😀中…");
  assert.ok(Array.from(excerpt({ ...essay, description: "一二三四五" }, 4)).length <= 4);
  assert.throws(() => excerpt(essay, 0), /正整数/);
});

test("阅读时间：支持中文、英文和混排，空白内容为 0", () => {
  assert.equal(readingMinutes(""), 0);
  assert.equal(readingMinutes("![图片](image.png)"), 0);
  assert.equal(readingMinutes("中".repeat(400)), 1);
  assert.equal(readingMinutes("中".repeat(401)), 2);
  assert.equal(readingMinutes("word ".repeat(200)), 1);
  assert.equal(readingMinutes("word ".repeat(201)), 2);
  assert.equal(readingMinutes(`${"中".repeat(200)} ${"word ".repeat(100)}`), 1);
});

test("渲染安全：拒绝脚本/数据协议和原生 HTML，保留安全相对链接与图片", async () => {
  const { html } = await renderMarkdown([
    "[脚本](javascript:alert%281%29)",
    "[转义脚本](jav&#x61;script:alert%281%29)",
    "[数据](data:text/html;base64,PHNjcmlwdD4=)",
    "![危险图](javascript:alert%281%29)",
    "![数据图](data:image/svg+xml;base64,PHN2Zz4=)",
    "[根路径](/essays/good-one/)",
    "[相对](../other/)",
    "[锚点](#小结)",
    "[外链](https://example.com/path)",
    "[邮箱](mailto:hello@example.com)",
    "![本地图](/images/example.png)",
    "![相对图](./image.png)",
    '<img src=x onerror="alert(1)">',
    "<script>alert(1)</script>",
  ].join("\n\n"));
  assert.doesNotMatch(html, /(?:href|src)="(?:javascript|data):/i);
  assert.doesNotMatch(html, /<script|onerror/i);
  for (const value of ["/essays/good-one/", "../other/", "https://example.com/path", "mailto:hello@example.com"]) {
    assert.ok(html.includes(`href="${value}"`), value);
  }
  assert.match(html, /href="#(?:%E5%B0%8F%E7%BB%93|小结)"/);
  assert.match(html, /src="\/images\/example.png"/);
  assert.match(html, /src="\.\/image.png"/);
});


test("作品排序：order 为非负安全整数，省略时排在已指定顺序之后", () => {
  assert.equal(parseWork("good-one.md", doc(`${good}\norder: 0`)).order, 0);
  for (const order of [-1, 1.5, "'first'", "'1'", "9007199254740992", ".inf"]) {
    assert.throws(() => parseWork("good-one.md", doc(`${good}\norder: ${order}`)), /order/);
  }
  withContent((dir) => {
    const worksDir = path.join(dir, "content", "works");
    fs.mkdirSync(worksDir, { recursive: true });
    for (const [slug, date, order] of [
      ["unordered-old", "2020-01-01"], ["ai-weekly", "2026-01-01", 2],
      ["github-explore", "2025-01-01", 1], ["unordered-new", "2026-10-10"],
      ["ai-first", "2026-01-01", 2],
    ]) {
      fs.writeFileSync(path.join(worksDir, `${slug}.md`), doc(`title: ${slug}\ndate: ${date}\nslug: ${slug}${order === undefined ? "" : `\norder: ${order}`}`));
    }
    assert.deepEqual(getWorks().map((work) => work.slug), ["github-explore", "ai-first", "ai-weekly", "unordered-new", "unordered-old"]);
  });
});


test("旧笔记缺失的 Joplin 图片显示文字提示，远程图片正常保留", async () => {
  const { html } = await renderMarkdown("![旧图](:/08cdd9fec0e84603b04ab905ff4bd4db)\n\n![在线图](https://example.com/image.png?v=1)");
  assert.match(html, /原图缺失：旧图/);
  assert.doesNotMatch(html, /src=":\//);
  assert.match(html, /src="https:\/\/example.com\/image.png\?v=1"/);
});
