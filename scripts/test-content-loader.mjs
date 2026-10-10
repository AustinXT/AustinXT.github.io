// 正文管线（src/site/lib/content.ts）的规则回归：每条校验都有一个应被拒绝的反例。
// 用法（项目根）：node --test scripts/test-content-loader.mjs ；依赖 Node 原生类型剥离与 src/site 已装依赖。
import assert from "node:assert/strict";
import test from "node:test";
import { parseEssay, publishable, renderMarkdown, yearPages } from "../src/site/lib/content.ts";

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

const rejects = [
  ["未知字段（拼错）", "good-one.md", doc(`${good}\ntittle: 错`), /未知字段/],
  ["缺 title", "good-one.md", doc("date: 2026-10-10\nslug: good-one"), /缺 title/],
  ["空 title", "good-one.md", doc("title: '  '\ndate: 2026-10-10\nslug: good-one"), /缺 title/],
  ["slug 含大写", "Good-one.md", doc("title: 样本\ndate: 2026-10-10\nslug: Good-one"), /slug/],
  ["slug 双连字符", "good--one.md", doc("title: 样本\ndate: 2026-10-10\nslug: good--one"), /slug/],
  ["slug 以连字符开头", "-good.md", doc("title: 样本\ndate: 2026-10-10\nslug: -good"), /slug/],
  ["slug 含中文", "文章.md", doc("title: 样本\ndate: 2026-10-10\nslug: 文章"), /slug/],
  ["文件名与 slug 不一致", "other.md", doc(good), /文件名须与 slug 一致/],
  ["slug 撞静态路由", "tags.md", doc("title: 样本\ndate: 2026-10-10\nslug: tags"), /冲突/],
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

test("渲染：GFM 生效，原生 HTML 被丢弃", async () => {
  const { html } = await renderMarkdown("| a | b |\n|---|---|\n| 1 | ~~2~~ |\n\n<script>alert(1)</script>\n\n<span>文字</span>\n");
  assert.match(html, /<table>/);
  assert.match(html, /<del>2<\/del>/);
  assert.doesNotMatch(html, /<script|<span/);
});
