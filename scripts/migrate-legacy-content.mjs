// 一次性旧文迁入：只读旧库；新正文用 wx 创建，已有人改过的成品绝不覆盖。
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(project, "src/package.json"));
const matter = require("gray-matter");
const sourceRoot = "vault/raw/05blog/content";
const contentRoot = "src/content";
const indexFile = `${contentRoot}/legacy-index.json`;
export const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");
const SLUG = /^(?=.{1,40}$)(?=[a-z0-9-]*[a-z])[a-z0-9]+(?:-[a-z0-9]+)*$/;

function readSafe(root, relative) {
  if (path.isAbsolute(relative) || relative.split(/[\\/]/).includes("..")) throw new Error(`越界路径：${relative}`);
  const full = path.join(root, relative);
  let current = root;
  for (const part of relative.split("/")) {
    current = path.join(current, part);
    if (fs.lstatSync(current).isSymbolicLink()) throw new Error(`不读取软链接：${relative}`);
  }
  if (!fs.statSync(full).isFile()) throw new Error(`不是普通文件：${relative}`);
  return fs.readFileSync(full, "utf8");
}

function dateText(value) {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
  if (typeof value !== "string") return null;
  const date = value.match(/^\d{4}-\d{2}-\d{2}(?=$|[T\s])/)?.[0];
  if (!date) return null;
  const parsed = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date ? date : null;
}

function terms(value, key, issues) {
  if (value == null) return [];
  if (!Array.isArray(value)) { issues.push(`${key} 原格式不是数组，初始留空`); return []; }
  return [...new Set(value.filter((item) => {
    if (typeof item !== "string" || !item.trim() || /[\/\\?#%\u0000-\u001f\u007f]/u.test(item) || [".", ".."].includes(item.trim())) {
      issues.push(`${key} 存在不适配新站的名称，原值保留在索引元数据中`); return false;
    }
    return true;
  }).map((item) => item.trim().normalize("NFC")))];
}

export function prepareLegacy(relative, source, slug) {
  if (!/^(?:posts|draft)\/[^/]+\.md$/.test(relative)) throw new Error(`不是文章来源：${relative}`);
  if (!SLUG.test(slug) || ["archive", "categories", "tags"].includes(slug)) throw new Error(`非法 slug：${slug}`);
  const { data, content } = matter(source);
  const issues = [];
  let date = dateText(data.date), dateSource = "front-matter";
  if (!date) {
    if (data.date != null) throw new Error(`${relative} 的原始 date 无效，不猜日期`);
    date = dateText(path.basename(relative).replace(/^_+/, "").slice(0, 10));
    dateSource = "filename";
    issues.push("原文缺日期，暂用文件名日期");
  }
  if (!date) throw new Error(`${relative} 无可核对日期`);
  const filename = path.basename(relative, ".md").replace(/^_+/, "").replace(/^\d{4}-\d{2}-\d{2}-?/, "");
  const title = typeof data.title === "string" && data.title.trim() ? data.title.trim() : filename.replace(/-/g, " ").trim() || `未命名草稿 · ${date}`;
  const titleSource = typeof data.title === "string" && data.title.trim() ? "front-matter" : "filename";
  if (titleSource === "filename") issues.push("原文缺标题，暂用文件名或日期");
  const metadata = {
    title, date, slug,
    description: typeof data.description === "string" ? data.description : "",
    draft: true,
    categories: terms(data.categories, "categories", issues),
    tags: terms(data.tags, "tags", issues),
  };
  // 这里只整理 front matter；Markdown 正文逐字保留，含代码、公式和旧 shortcode。
  const output = `---\n${Object.entries(metadata).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join("\n")}\n---\n${content}`;
  const prose = content.replace(/^\s*(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\s*\1\s*$/gm, "");
  if (!content.trim()) issues.push("原文为空，保持空草稿，补正文后才能上架");
  if (/\{\{[<%]\s*mermaid/i.test(prose)) issues.push("旧 Mermaid shortcode 保留，发布前需转换");
  if (data.mathjax) issues.push("含数学公式，原 mathjax 设置保留在索引，发布前检查显示");
  if (data.ttsAudio) issues.push("旧音频路径保留在索引，尚未作为公开媒体迁入");
  if (/:\/[a-f0-9]{32}/i.test(prose)) issues.push("含缺失的 Joplin 本地图片引用，需补素材");
  return { metadata, body: content, output, originalMetadata: JSON.parse(JSON.stringify(data)), titleSource, dateSource, issues };
}

export function validateIndex(index, readTarget) {
  const errors = [], sources = new Set(), targets = new Set();
  if (!index || index.version !== 1 || !Array.isArray(index.entries)) return ["迁入索引格式错误"];
  for (const entry of index.entries) {
    if (typeof entry.source !== "string" || !/^vault\/raw\/05blog\/content\/(?:posts|draft)\/[^/]+\.md$/.test(entry.source)) errors.push("来源路径不在原博客文章目录");
    if (typeof entry.target !== "string" || !/^src\/content\/essays\/[a-z0-9]+(?:-[a-z0-9]+)*\.md$/.test(entry.target)) { errors.push("目标路径不在新随笔目录"); continue; }
    if (sources.has(entry.source)) errors.push(`重复来源：${entry.source}`);
    if (targets.has(entry.target)) errors.push(`重复目标：${entry.target}`);
    sources.add(entry.source); targets.add(entry.target);
    if (!/^[a-f0-9]{64}$/.test(entry.sourceSha256 || "") || !/^[a-f0-9]{64}$/.test(entry.initialBodySha256 || "")) errors.push(`缺迁入校验摘要：${entry.target}`);
    try {
      const { data, content } = matter(readTarget(entry.target));
      const slug = path.basename(entry.target, ".md");
      if (data.slug !== slug || !SLUG.test(slug)) errors.push(`slug 与文件名不符：${entry.target}`);
      if (typeof data.draft !== "boolean") errors.push(`须显式设置 draft：${entry.target}`);
      if (!content.trim() && !data.draft && data.placeholder !== true) errors.push(`空文章上架须显式设置 placeholder: true：${entry.target}`);
      // 校对允许修改 title/date/正文/分类/标签，不用改 content 外的迁移台账。
    } catch (error) { errors.push(`${entry.target}：${error.message}`); }
  }
  return errors;
}

function markdownCell(value) { return String(value).replace(/\|/g, "\\|").replace(/[\r\n]/g, " "); }
function catalog(index) {
  const rows = index.entries.map((entry) => ({ ...entry, initialMetadata: { ...entry.initialMetadata, date: dateText(entry.initialMetadata.date) } })).sort((a, b) => b.initialMetadata.date.localeCompare(a.initialMetadata.date) || a.target.localeCompare(b.target));
  return `# 旧文校对清单\n\n这是 ${index.importedOn} 的初始迁入清单，${rows.length} 篇全部先作为草稿；不代表已校对、可发布或当前上架状态。当前内容以各篇 Markdown 的元数据为准，校对后改该文件即可，不需要回填这张初始清单。\n\n旧库原件仍在 \`vault/raw/05blog/\`。逐篇来源、原 front matter、原始文件 SHA-256、初始正文 SHA-256 与默认值依据唯一登记于 [legacy-index.json](legacy-index.json)。\n\n《卡片大法》保留此前整理后的正文，仅设为草稿；其余正文未改写。空白的简报栏目索引不是文章，未生成占位随笔。\n\n| 日期 | 文章（点击编辑） | 原目录 | 初始专栏 / 专题 | 校对提示 |\n|---|---|---|---|---|\n${rows.map((entry) => `| ${entry.initialMetadata.date} | [${markdownCell(entry.initialMetadata.title)}](essays/${path.basename(entry.target)}) | ${entry.group === "posts" ? "旧正文" : "旧草稿"} | ${markdownCell([...entry.initialMetadata.categories, ...entry.initialMetadata.tags].join("、") || "未设置")} | ${markdownCell(entry.issues.join("；") || "待逐篇校对")} |`).join("\n")}\n\n## 兼容性待校对\n\n- 远程图片与 PDF 地址原样保留，没有批量下载或验证远程可用性。\n- 小红书草稿的 5 个 Joplin 图片引用没有找到对应原文件，需要你补图。\n- 2 篇 Mermaid shortcode、2 篇 mathjax 文章保留原写法，后续发布前检查显示。\n- 2 篇旧音频测试文章的 ttsAudio 原值在索引中，音频仍留在只读原库，没有因为迁文而公开导出。\n- 缺标题/日期的默认值、唯一空正文草稿均在表格和索引中标出。\n`;
}

export function migrate(root, map, write = false) {
  const previous = fs.existsSync(path.join(root, indexFile)) ? JSON.parse(readSafe(root, indexFile)) : null;
  const prior = new Map((previous?.entries || []).map((entry) => [entry.source, entry]));
  const entries = [], operations = [];
  const seen = new Set();
  for (const group of ["posts", "draft"]) {
    const dir = path.join(root, sourceRoot, group);
    for (const name of fs.readdirSync(dir).filter((name) => name.endsWith(".md")).sort()) {
      const relative = `${group}/${name}`, source = `${sourceRoot}/${relative}`;
      const oldEntry = prior.get(source);
      if (previous && !oldEntry) throw new Error(`原库出现未登记的新来源，不在旧索引下静默追加：${source}`);
      const slug = oldEntry ? path.basename(oldEntry.target, ".md") : map[relative];
      const raw = readSafe(root, source);
      const prepared = prepareLegacy(relative, raw, slug);
      const target = `${contentRoot}/essays/${slug}.md`;
      if (seen.has(target)) throw new Error(`重名目标：${target}`);
      seen.add(target);
      const exists = fs.existsSync(path.join(root, target));
      if (exists && !oldEntry && slug !== "card-method") throw new Error(`不会覆盖既有成品：${target}`);
      if (oldEntry && oldEntry.sourceSha256 !== hash(raw)) throw new Error(`原件相对迁入登记已变化：${source}`);
      const current = exists ? matter(readSafe(root, target)) : null;
      if (exists && current.data.slug !== slug) throw new Error(`既有成品 slug 不一致：${target}`);
      // 卡片保留已整理版本；它的状态由本轮调用者显式切换，不覆盖正文。
      const entry = oldEntry || {
        source, target, group, sourceSha256: hash(raw),
        originalMetadata: prepared.originalMetadata,
        initialMetadata: exists ? { ...current.data, date: dateText(current.data.date) } : prepared.metadata,
        initialBodySha256: hash(exists ? current.content : prepared.body),
        titleSource: prepared.titleSource, dateSource: prepared.dateSource,
        preservation: exists ? "preserved-edited" : "verbatim-body",
        issues: exists ? ["保留此前整理稿，仍待逐篇校对"] : prepared.issues,
      };
      entries.push(entry);
      if (!exists) operations.push({ target, text: prepared.output });
    }
  }
  const index = { version: 1, importedOn: previous?.importedOn || "2026-10-15", sourceRoot, skipped: [{ source: `${sourceRoot}/briefing/_index.md`, reason: "仅栏目标题，无日期或正文，不是文章" }], entries };
  const review = catalog(index); // 包括说明文件也先生成成功，才开始写文章。
  if (write) {
    // 先完成全部规划校验，再写新文件。wx 防止覆盖并行编辑或之前的人工校对。
    for (const { target, text } of operations) { fs.mkdirSync(path.dirname(path.join(root, target)), { recursive: true }); fs.writeFileSync(path.join(root, target), text, { flag: "wx" }); }
    if (!previous) {
      fs.writeFileSync(path.join(root, indexFile), JSON.stringify(index, null, 2) + "\n", { flag: "wx" });
    }
    if (!fs.existsSync(path.join(root, contentRoot, "legacy-review.md"))) fs.writeFileSync(path.join(root, contentRoot, "legacy-review.md"), review, { flag: "wx" });
  }
  return { index, newFiles: operations.length, total: entries.length };
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes("--check-index")) {
    const index = JSON.parse(readSafe(project, indexFile));
    const errors = validateIndex(index, (relative) => readSafe(project, relative));
    if (errors.length) throw new Error(errors.join("\n"));
    console.log(`旧文索引通过：${index.entries.length} 篇，来源/目标唯一；后续校对不要求改 content 外的文件。`);
    return;
  }
  if (args.includes("--verify-initial")) {
    const index = JSON.parse(readSafe(project, indexFile));
    const sources = new Set(index.entries.map((entry) => entry.source));
    for (const group of ["posts", "draft"]) for (const name of fs.readdirSync(path.join(project, sourceRoot, group)).filter((name) => name.endsWith(".md"))) {
      if (!sources.has(`${sourceRoot}/${group}/${name}`)) throw new Error(`漏迁：${group}/${name}`);
    }
    for (const entry of index.entries) {
      const raw = readSafe(project, entry.source), target = matter(readSafe(project, entry.target));
      if (hash(raw) !== entry.sourceSha256 || hash(target.content) !== entry.initialBodySha256) throw new Error(`初始校验摘要不符：${entry.target}`);
      if (target.data.draft !== true) throw new Error(`初始稿未设为草稿：${entry.target}`);
      if (entry.preservation === "verbatim-body" && target.content !== matter(raw).content) throw new Error(`正文改变：${entry.target}`);
    }
    console.log(`初始迁入核对通过：${index.entries.length} 篇来源完整、原件摘要一致；新迁正文逐字保留，全部为草稿。`);
    return;
  }
  const option = args.indexOf("--map");
  if (option < 0 || !args[option + 1]) throw new Error("用法：node scripts/migrate-legacy-content.mjs --map <slug-map.json> [--write]；或 --check-index / --verify-initial");
  const result = migrate(project, JSON.parse(fs.readFileSync(args[option + 1], "utf8")), args.includes("--write"));
  console.log(JSON.stringify({ write: args.includes("--write"), total: result.total, newFiles: result.newFiles, preserved: result.total - result.newFiles, missingTitle: result.index.entries.filter((entry) => entry.titleSource === "filename").length, missingDate: result.index.entries.filter((entry) => entry.dateSource === "filename").length, compatibility: result.index.entries.filter((entry) => entry.issues.length > 0).length }));
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
