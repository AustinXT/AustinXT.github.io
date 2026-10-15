// 在一次性快照上检验真实 Next 导出；不在有人编辑的工作区运行。
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
if (!process.argv.includes("--snapshot")) throw new Error("只在一次性快照运行，并显式传 --snapshot");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const site = path.join(root, "src"), content = path.join(site, "content"), out = path.join(site, "out");
const original = new Map();
for (const kind of ["essays", "works"]) for (const name of fs.readdirSync(path.join(content, kind))) {
  if (name.endsWith(".md")) original.set(`${kind}/${name}`, fs.readFileSync(path.join(content, kind, name)));
}
const config = fs.readFileSync(path.join(content, "site.json"));
const run = (cmd, args, cwd = root) => execFileSync(cmd, args, { cwd, stdio: "inherit", env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" } });
const build = () => run("npm", ["run", "build"], site);
const check = () => { run("python3", ["-I", "scripts/check-site-export.py"]); run("python3", ["-I", "scripts/check-content-export.py"]); };
const read = (name) => fs.readFileSync(path.join(out, name), "utf8");
async function checkHttp(paths) {
  const server = spawn("python3", ["-I", "-u", "-m", "http.server", "0", "--bind", "127.0.0.1", "--directory", out], { stdio: ["ignore", "pipe", "pipe"] });
  try {
    const port = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("本地验收 HTTP 服务启动超时")), 10000);
      server.once("error", (error) => { clearTimeout(timeout); reject(error); });
      server.once("exit", (code) => { clearTimeout(timeout); reject(new Error(`HTTP 服务提前退出：${code}`)); });
      server.stdout.on("data", (chunk) => { const match = chunk.toString().match(/port (\d+)/); if (match) { clearTimeout(timeout); resolve(Number(match[1])); } });
    });
    for (const pathname of paths) {
      const response = await fetch(`http://127.0.0.1:${port}${pathname}`);
      assert.equal(response.status, 200, `真实静态 HTTP 路径不可读：${pathname}`);
      const body = await response.text();
      assert.ok(body.length > 0);
    }
  } finally {
    server.kill("SIGTERM");
    await new Promise((resolve) => server.exitCode !== null || server.signalCode !== null ? resolve() : server.once("exit", resolve));
  }
}
function setDraft(source, draft) {
  const end = source.indexOf("\n---", 4);
  const front = source.slice(0, end).replace(/^draft:.*\n?/m, "");
  return `${front}\ndraft: ${draft}\n${source.slice(end)}`;
}
function clearCollections() {
  for (const kind of ["essays", "works"]) for (const name of fs.readdirSync(path.join(content, kind))) {
    if (name.endsWith(".md")) fs.unlinkSync(path.join(content, kind, name));
  }
}
function assertHidden() {
  assert.deepEqual(JSON.parse(read("search-index.json")), []);
  assert.doesNotMatch(read("feed.xml"), /<item>/);
  assert.doesNotMatch(read("sitemap.xml"), /essays\/card-method|works\/github-explore|works\/ai-weekly/);
  assert.ok(!fs.existsSync(path.join(out, "essays/card-method/index.html")));
  assert.ok(!fs.existsSync(path.join(out, "works/github-explore/index.html")));
}
const media = path.join(content, "media/blog-lifecycle-probe.svg");
assert.ok(!fs.existsSync(media), "媒体夹具不能覆盖原件");
try {
  console.log("生命周期场景 1：所有随笔和作品下架，旧产物清除");
  for (const [name, bytes] of original) fs.writeFileSync(path.join(content, name), setDraft(bytes.toString(), true));
  build(); check(); assertHidden();

  console.log("生命周期场景 2：空内容目录仍可导出");
  clearCollections(); build(); check(); assertHidden();

  console.log("生命周期场景 3：中文/空格分类、多页、生产 URL 与所有发布出口");
  const siteData = JSON.parse(config.toString()); siteData.url = "https://blog.example.test";
  fs.writeFileSync(path.join(content, "site.json"), JSON.stringify(siteData));
  for (let n = 0; n < 101; n++) {
    const slug = `lifecycle-${String(n).padStart(3, "0")}`;
    fs.writeFileSync(path.join(content, `essays/${slug}.md`), `---\ntitle: '测试随笔 ${n}${n === 0 ? " </script><script>sentinel" : ""}'\ndate: 2026-10-15\nslug: ${slug}\ncategories: [知识管理]\ntags: ['AI & 思考']\ndraft: false\n---\n\n正文段落，作为发布出口的合成输入。\n\n## 章节\n\n![验证图片](/media/blog-lifecycle-probe.svg)\n`);
  }
  for (let n = 0; n < 25; n++) {
    const slug = `work-${String(n).padStart(3, "0")}`;
    fs.writeFileSync(path.join(content, `works/${slug}.md`), `---\ntitle: 作品 ${n}\ndate: 2026-10-15\nslug: ${slug}\norder: ${n}\ndraft: false\nexternalUrl: https://example.test/${n}/\n---\n\n合成作品正文。\n`);
  }
  fs.writeFileSync(path.join(content, "essays/secret-draft.md"), "---\ntitle: DRAFT-SECRET-SENTINEL\ndate: 2026-10-15\nslug: secret-draft\ndraft: true\ncategories: [秘密分类]\ntags: [秘密标签]\n---\n\nDRAFT-SECRET-SENTINEL\n");
  fs.writeFileSync(path.join(content, "works/secret-work.md"), "---\ntitle: DRAFT-WORK-SENTINEL\ndate: 2026-10-15\nslug: secret-work\ndraft: true\n---\n\nDRAFT-WORK-SENTINEL\n");
  fs.writeFileSync(media, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10"/></svg>');
  build(); check();
  const category = encodeURIComponent("知识管理"), tag = encodeURIComponent("AI & 思考");
  const pageExists = (name) => fs.existsSync(path.join(out, name, "index.html"));
  // Next 导出采用编码目录；生产服务器只需正常解码 URL 一次。
  for (const name of [`essays/2026/page/2`, `essays/categories/${category}/page/2`, `essays/tags/${tag}/page/2`, "works/archive/page/2"]) assert.ok(pageExists(name) || pageExists(decodeURIComponent(name)), `缺分页 ${name}`);
  await checkHttp([`/essays/categories/${category}/`, `/essays/categories/${category}/page/2/`, `/essays/tags/${tag}/`, `/essays/tags/${tag}/page/2/`, "/essays/2026/page/2/", "/works/archive/page/2/", "/media/blog-lifecycle-probe.svg", "/search-index.json", "/feed.xml", "/sitemap.xml"]);
  assert.equal(JSON.parse(read("search-index.json")).length, 126);
  assert.equal((read("feed.xml").match(/<item>/g) || []).length, 50);
  assert.match(read("feed.xml"), /https:\/\/blog\.example\.test/);
  assert.match(read("robots.txt"), /Allow: \/\n/);
  assert.match(read("sitemap.xml"), /AI%20%26%20/);
  const article = read("essays/lifecycle-000/index.html");
  assert.match(article, /rel="canonical" href="https:\/\/blog\.example\.test\/essays\/lifecycle-000\/"/);
  const jsonLd = article.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(jsonLd); assert.equal(JSON.parse(jsonLd).headline, "测试随笔 0 </script><script>sentinel");
  assert.ok(!jsonLd.includes("<"), "JSON-LD 必须转义脚本结束标签");
  for (const name of ["search-index.json", "feed.xml", "sitemap.xml", "essays/index.html", "essays/categories/index.html", "essays/tags/index.html"]) {
    assert.doesNotMatch(read(name), /DRAFT-SECRET-SENTINEL|DRAFT-WORK-SENTINEL|秘密分类|秘密标签|localhost/);
  }
  assert.ok(!pageExists("essays/secret-draft") && !pageExists("works/secret-work"));
  assert.ok(fs.existsSync(path.join(out, "media/blog-lifecycle-probe.svg")));
  console.log("生命周期场景全部通过。");
} finally {
  clearCollections();
  for (const [name, bytes] of original) fs.writeFileSync(path.join(content, name), bytes);
  fs.writeFileSync(path.join(content, "site.json"), config);
  fs.rmSync(media, { force: true });
  console.log("已恢复原内容，重建最终博客。");
  build(); check();
  assert.ok(!fs.existsSync(path.join(out, "media/blog-lifecycle-probe.svg")), "删除媒体后派生资源也须清除");
}
