import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import test from "node:test";
import { prepareLegacy, validateIndex, migrate, hash } from "./migrate-legacy-content.mjs";

const raw = "---\ntitle: 原题\ndate: 2019-12-23\nlayout: post\ncategories: [学习]\ntags: [卡片, 卡片]\n---\n\n### 原小节\n\n正文保留两个空格。  \n\n```md\n# 代码里的标题\n```\n";
test("迁入只替换元数据，正文/行尾空格/代码和原分类逐字保留", () => {
  const result = prepareLegacy("posts/2019-12-23-one.md", raw, "one");
  assert.equal(result.metadata.draft, true);
  assert.equal(result.metadata.date, "2019-12-23");
  assert.equal(result.metadata.title, "原题");
  assert.deepEqual(result.metadata.categories, ["学习"]);
  assert.deepEqual(result.metadata.tags, ["卡片"]);
  assert.equal(result.output.slice(result.output.indexOf("\n---\n") + 5), result.body);
  assert.ok(result.body.includes("两个空格。  \n"));
  assert.equal(result.originalMetadata.layout, "post");
});
test("缺标题、缺日期与空稿使用可辨认默认值，不伪造正文", () => {
  const result = prepareLegacy("draft/2024-11-03-知识工作者如何创业.md", "", "knowledge-worker-business");
  assert.equal(result.metadata.title, "知识工作者如何创业");
  assert.equal(result.metadata.date, "2024-11-03");
  assert.equal(result.dateSource, "filename");
  assert.equal(result.titleSource, "filename");
  assert.equal(result.body, "");
  assert.ok(result.issues.some((issue) => issue.includes("原文为空")));
  assert.equal(prepareLegacy("draft/2020-05-12.md", "---\ndate: 2020-05-12\n---\n正文", "note-20200512").metadata.title, "未命名草稿 · 2020-05-12");
  assert.throws(() => prepareLegacy("draft/no-date.md", "正文", "missing"), /日期/);
  assert.throws(() => prepareLegacy("draft/2024-01-01-x.md", raw.replace("2019-12-23", "'2024-02-30'"), "bad-date"), /不猜日期/);
});
test("旧公式、图和音频设置保留在索引并标待校对，不伪称已支持", () => {
  const result = prepareLegacy("posts/2019-12-23-one.md", raw.replace("layout: post", "layout: post\nmathjax: true\nttsAudio: /audio/test.mp3") + "\n{{< mermaid >}}\ngraph TD;\n{{< /mermaid >}}\n\n![图](:/123456789012345678901234567890ab)\n", "one");
  assert.equal(result.originalMetadata.ttsAudio, "/audio/test.mp3");
  assert.ok(result.issues.some((issue) => issue.includes("Mermaid")));
  assert.ok(result.issues.some((issue) => issue.includes("数学")));
  assert.ok(result.issues.some((issue) => issue.includes("Joplin")));
  assert.ok(result.issues.some((issue) => issue.includes("音频")));
  assert.ok(result.body.includes("{{< mermaid >}}"));
});
test("不接受非文章来源、不安全slug，标签旧值可追溯", () => {
  for (const relative of ["../outside.md", "briefing/_index.md", "posts/sub/x.md"]) assert.throws(() => prepareLegacy(relative, raw, "one"));
  for (const slug of ["../bad", "archive", "categories", "tags", "2019", "A", "x".repeat(41)]) assert.throws(() => prepareLegacy("posts/2019-12-23-one.md", raw, slug));
  const result = prepareLegacy("posts/2019-12-23-one.md", raw.replace("tags: [卡片, 卡片]", "tags: ['a/b']"), "one");
  assert.deepEqual(result.metadata.tags, []);
  assert.deepEqual(result.originalMetadata.tags, ["a/b"]);
});
function fixture(run) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "blog-migration-"));
  const put = (relative, text) => { const full = path.join(dir, relative); fs.mkdirSync(path.dirname(full), { recursive: true }); fs.writeFileSync(full, text); };
  try {
    put("vault/raw/05blog/content/posts/2019-12-23-one.md", raw);
    put("vault/raw/05blog/content/draft/2020-05-12.md", "---\ndate: 2020-05-12\n---\n正文");
    put("src/site/content/essays/card-method.md", "保留无关的人工稿");
    run(dir, put);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}
const mapping = { "posts/2019-12-23-one.md": "one", "draft/2020-05-12.md": "note-20200512" };
test("dry-run不写文件，首次写入完整且再次执行不覆盖校对稿", () => fixture((dir, put) => {
  assert.equal(migrate(dir, mapping).newFiles, 2);
  assert.ok(!fs.existsSync(path.join(dir, "src/site/content/essays/one.md")));
  const first = migrate(dir, mapping, true);
  assert.equal(first.total, 2);
  const manual = "---\ntitle: 本人已校对\ndate: 2019-12-23\nslug: one\ndraft: false\n---\n\n本人改写。\n";
  put("src/site/content/essays/one.md", manual);
  assert.equal(migrate(dir, mapping, true).newFiles, 0);
  assert.equal(fs.readFileSync(path.join(dir, "src/site/content/essays/one.md"), "utf8"), manual);
  assert.equal(fs.readFileSync(path.join(dir, "src/site/content/essays/card-method.md"), "utf8"), "保留无关的人工稿");
  assert.equal(fs.readFileSync(path.join(dir, "vault/raw/05blog/content/posts/2019-12-23-one.md"), "utf8"), raw);
  assert.deepEqual(validateIndex(first.index, (file) => fs.readFileSync(path.join(dir, file), "utf8")), []);
}));
test("同名已有成品、源变化、重名映射和软链接均拒绝，规划失败不产生半套输出", () => fixture((dir, put) => {
  assert.throws(() => migrate(dir, { ...mapping, "draft/2020-05-12.md": "one" }, true), /重名目标/);
  assert.ok(!fs.existsSync(path.join(dir, "src/site/content/essays/one.md")));
  put("src/site/content/essays/one.md", "人工稿");
  assert.throws(() => migrate(dir, mapping, true), /不会覆盖/);
  fs.unlinkSync(path.join(dir, "src/site/content/essays/one.md"));
  migrate(dir, mapping, true);
  put("vault/raw/05blog/content/posts/2019-12-23-one.md", raw + "源变化");
  assert.throws(() => migrate(dir, mapping, true), /原件.*已变化/);
  fs.unlinkSync(path.join(dir, "vault/raw/05blog/content/posts/2019-12-23-one.md"));
  fs.symlinkSync(path.join(dir, "src/site/content/essays/one.md"), path.join(dir, "vault/raw/05blog/content/posts/2019-12-23-one.md"));
  assert.throws(() => migrate(dir, mapping, true), /软链接/);
}));
test("索引后续允许校对和上架，但仍拒绝漏文件、重复和越界", () => {
  const entry = { source: "vault/raw/05blog/content/posts/2019-12-23-one.md", target: "src/site/content/essays/one.md", sourceSha256: hash(raw), initialBodySha256: hash("body") };
  const index = { version: 1, entries: [entry] };
  const edited = () => "---\ntitle: 我改过的标题\ndate: 2020-01-01\nslug: one\ndraft: false\n---\n\n新正文。";
  assert.deepEqual(validateIndex(index, edited), []);
  assert.ok(validateIndex({ version: 1, entries: [entry, entry] }, edited).length > 0);
  assert.ok(validateIndex({ version: 1, entries: [{ ...entry, source: "/etc/passwd" }] }, edited).length > 0);
  assert.ok(validateIndex({ version: 1, entries: [{ ...entry, target: "../outside.md" }] }, edited).length > 0);
  assert.ok(validateIndex(index, () => { throw new Error("不存在"); }).length > 0);
  assert.ok(validateIndex(index, () => edited().replace("新正文。", "")).length > 0);
});
