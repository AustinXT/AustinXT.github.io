import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

// 正文正本是 content/essays/*.md；构建时编译成 HTML，读者端不解析 Markdown。
export type Essay = {
  slug: string;
  title: string;
  date: string;
  revised?: string;
  description?: string;
  categories: string[];
  tags: string[];
  draft: boolean;
  placeholder?: boolean;
  body: string;
};

export type Work = Essay & { externalUrl?: string; order?: number };
export type TaxonomyKey = "categories" | "tags";
export type TaxonomyTerm = { name: string; count: number };
export type TaxonomyPage = { name: string; key: TaxonomyKey; page: number; pages: number; total: number; essays: Essay[] };

const KEYS = new Set(["title", "date", "revised", "slug", "description", "categories", "tags", "draft", "placeholder"]);
// 与 app/essays/ 下的静态路由同名会被静态页遮住，直接拒绝；纯数字留给年份页 /essays/<年>/。
const RESERVED = new Set(["categories", "tags", "archive"]);
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SLUG_MAX = 40;
// 命门 3：目录页条目有上界。scripts/check-site-export.py 用同一上限检查导出。
export const YEAR_PAGE_SIZE = 100;
export const HOME_RECENT = 5;

function fail(file: string, message: string): never {
  throw new Error(`${file}：${message}`);
}

function isoDate(file: string, value: unknown, key = "date") {
  const text = value instanceof Date && !Number.isNaN(value.getTime()) ? value.toISOString().slice(0, 10) : value;
  const parsed = typeof text === "string" ? new Date(`${text}T00:00:00Z`) : null;
  if (typeof text !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(text) || !parsed
      || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== text) {
    fail(file, `${key} 须为有效的 YYYY-MM-DD`);
  }
  return text;
}

function hasControls(text: string, includeSpace = false): boolean {
  return Array.from(text).some((character) => {
    const code = character.codePointAt(0) ?? 0;
    return code <= (includeSpace ? 32 : 31) || code === 127;
  });
}

function taxonomyName(file: string, key: string, value: unknown): string {
  if (typeof value !== "string" || !value.trim()) fail(file, `${key} 须为非空字符串数组`);
  const name = value.trim().normalize("NFC");
  if (name === "." || name === ".." || /[\/\\?#%]/u.test(name) || hasControls(name)) {
    fail(file, `${key} 名称不能是 . 或 ..，也不能含 /、\\、?、#、% 或控制字符`);
  }
  // URL 编码不接受孤立的代理字符；在内容校验时报告，避免构建路由时才失败。
  try { encodeURIComponent(name); } catch { fail(file, `${key} 名称须为有效的 Unicode 文字`); }
  return name;
}

function strings(file: string, key: string, value: unknown) {
  if (value === undefined) return [];
  if (!Array.isArray(value)) fail(file, `${key} 须为非空字符串数组`);
  return [...new Set(value.map((item) => taxonomyName(file, key, item)))];
}

function parseEntry(file: string, source: string, kind: "essays" | "works"): Work {
  const { data, content } = matter(source);
  const unknown = Object.keys(data).filter((key) => !KEYS.has(key) && !(kind === "works" && ["externalUrl", "order"].includes(key)));
  if (unknown.length) fail(file, `未知字段：${unknown.join("、")}`);
  if (typeof data.title !== "string" || !data.title.trim()) fail(file, "缺 title");
  if (typeof data.slug !== "string" || !SLUG.test(data.slug)) fail(file, "slug 只能用小写字母、数字和单个连字符");
  if (path.basename(file, ".md") !== data.slug) fail(file, "文件名须与 slug 一致");
  if (RESERVED.has(data.slug)) fail(file, `slug 与静态路由 /${kind}/${data.slug}/ 冲突`);
  if (!/[a-z]/.test(data.slug)) fail(file, "slug 须含字母，纯数字留给年份页");
  // 负责人 2026-10-11：网址用英文，避免太长
  if (data.slug.length > SLUG_MAX) fail(file, `slug 不超过 ${SLUG_MAX} 个字符`);
  if (data.description !== undefined && typeof data.description !== "string") fail(file, "description 须为字符串");
  if (data.draft !== undefined && typeof data.draft !== "boolean") fail(file, "draft 须为 true 或 false");
  if (data.placeholder !== undefined && typeof data.placeholder !== "boolean") fail(file, "placeholder 须为 true 或 false");
  // 旧库有空白手稿；允许先保存为草稿，上架时仍必须有正文。
  if (!content.trim() && data.draft !== true && data.placeholder !== true) fail(file, "正文为空");
  const date = isoDate(file, data.date);
  const revised = data.revised === undefined ? undefined : isoDate(file, data.revised, "revised");
  if (revised && revised < date) fail(file, "revised 不能早于 date");
  if (data.order !== undefined && (!Number.isSafeInteger(data.order) || data.order < 0)) {
    fail(file, "order 须为非负安全整数");
  }
  let externalUrl: string | undefined;
  if (data.externalUrl !== undefined) {
    if (typeof data.externalUrl !== "string" || hasControls(data.externalUrl)) {
      fail(file, "externalUrl 须为 http 或 https 的完整网址");
    }
    const value: string = data.externalUrl.trim();
    try {
      const url = new URL(value);
      if (!["http:", "https:"].includes(url.protocol) || !url.hostname || url.username || url.password) {
        fail(file, "externalUrl 须为 http 或 https 的完整网址，不能含用户名和密码");
      }
    } catch { fail(file, "externalUrl 须为 http 或 https 的完整网址"); }
    externalUrl = value;
  }
  return {
    slug: data.slug,
    title: data.title.trim(),
    date,
    revised,
    description: data.description,
    categories: strings(file, "categories", data.categories),
    tags: strings(file, "tags", data.tags),
    draft: data.draft ?? false,
    ...(data.placeholder === undefined ? {} : { placeholder: data.placeholder }),
    body: content,
    ...(externalUrl === undefined ? {} : { externalUrl }),
    ...(data.order === undefined ? {} : { order: data.order }),
  };
}

export function parseEssay(file: string, source: string): Essay {
  return parseEntry(file, source, "essays");
}

export function parseWork(file: string, source: string): Work {
  return parseEntry(file, source, "works");
}

function readEntries<T extends Essay>(dir: string, parse: (file: string, source: string) => T): T[] {
  let files: string[];
  try { files = fs.readdirSync(dir); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
  return files.filter((name) => name.endsWith(".md")).sort()
    .map((name) => parse(name, fs.readFileSync(path.join(dir, name), "utf8")));
}

export function readEssays(dir: string): Essay[] {
  return readEntries(dir, parseEssay);
}

// 草稿不进构建；按日期倒序，同日按 slug。每次从当前内容读取，避免静态构建复用旧缓存。
export function publishable<T extends Essay>(essays: T[]): T[] {
  return essays.filter((essay) => !essay.draft)
    .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}

export function getEssays(): Essay[] {
  return publishable(readEssays(path.join(process.cwd(), "content", "essays")));
}

export function getWorks(): Work[] {
  return publishable(readEntries(path.join(process.cwd(), "content", "works"), parseWork))
    .sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER)
      || b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}

export function getWork(slug: string) {
  return getWorks().find((work) => work.slug === slug);
}

export function getEssay(slug: string) {
  return getEssays().find((essay) => essay.slug === slug);
}

export type YearPage = { year: string; page: number; pages: number; total: number; essays: Essay[] };

// 随笔目录按年份拆成静态页，单页超过上限再分页；输入须已按日期倒序。
export function yearPages(essays: Essay[], size = YEAR_PAGE_SIZE): YearPage[] {
  pageSize(size);
  const years = new Map<string, Essay[]>();
  for (const essay of essays.filter((essay) => !essay.draft)) {
    const year = essay.date.slice(0, 4);
    years.set(year, [...(years.get(year) ?? []), essay]);
  }
  return [...years].flatMap(([year, list]) => {
    const pages = Math.ceil(list.length / size);
    return Array.from({ length: pages }, (_, i) => ({
      year, page: i + 1, pages, total: list.length, essays: list.slice(i * size, (i + 1) * size),
    }));
  });
}

export function getYearPage(year: string, page = 1) {
  return yearPages(getEssays()).find((item) => item.year === year && item.page === page);
}

function pageSize(size: number) {
  if (!Number.isSafeInteger(size) || size < 1) throw new RangeError("分页大小须为正整数");
}

function taxonomyKey(key: TaxonomyKey) {
  if (key !== "categories" && key !== "tags") throw new Error("分类类型须为 categories 或 tags");
}

export function taxonomyTerms(essays: Essay[], key: TaxonomyKey): TaxonomyTerm[] {
  taxonomyKey(key);
  const counts = new Map<string, number>();
  for (const essay of publishable(essays)) {
    for (const name of strings(essay.slug, key, essay[key])) counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts].map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "zh-CN") || a.name.localeCompare(b.name));
}

export function taxonomyHref(key: TaxonomyKey, name: string, page = 1): string {
  taxonomyKey(key);
  if (!Number.isSafeInteger(page) || page < 1) throw new RangeError("页码须为正整数");
  const term = taxonomyName("taxonomy", key, name);
  return `/essays/${key}/${encodeURIComponent(term)}/${page > 1 ? `page/${page}/` : ""}`;
}

export function taxonomyPages(essays: Essay[], key: TaxonomyKey, size = YEAR_PAGE_SIZE): TaxonomyPage[] {
  pageSize(size);
  const published = publishable(essays);
  return taxonomyTerms(published, key).flatMap(({ name, count }) => {
    const list = published.filter((essay) => strings(essay.slug, key, essay[key]).includes(name));
    const pages = Math.ceil(count / size);
    return Array.from({ length: pages }, (_, i) => ({
      name, key, page: i + 1, pages, total: count, essays: list.slice(i * size, (i + 1) * size),
    }));
  });
}

export function getTaxonomyPage(key: TaxonomyKey, name: string, page = 1) {
  const term = taxonomyName("taxonomy", key, name);
  return taxonomyPages(getEssays(), key).find((item) => item.name === term && item.page === page);
}

// 只用到 hast 的这几个字段；不为类型另装依赖。
type Hast = { type: string; tagName?: string; value?: string; properties?: Record<string, unknown>; children?: Hast[] };
export type TocItem = { id: string; text: string };

function textOf(node: Hast): string {
  return node.type === "text" ? node.value ?? "" : (node.children ?? []).map(textOf).join("");
}

// 页面外壳已占用的 ID，标题锚点要避开（见 components/site-frame.tsx）。
const PAGE_IDS = new Set(["main-content", "main-menu"]);

// 旧文的最高标题有 h1、h3 等多种习惯；页面标题独占 h1，渲染时统一从 h2 开始。
// 只处理语法树，Markdown 原文与代码围栏内的 # 保持不变。
function normalizeHeadings(tree: Hast) {
  const headings: Hast[] = [];
  const visit = (node: Hast) => {
    if (node.type === "element" && /^h[1-6]$/.test(node.tagName ?? "") && node.properties?.id !== "footnote-label") headings.push(node);
    node.children?.forEach(visit);
  };
  visit(tree);
  if (!headings.length) return;
  const shift = 2 - Math.min(...headings.map((node) => Number(node.tagName!.slice(1))));
  for (const node of headings) node.tagName = `h${Math.min(6, Number(node.tagName!.slice(1)) + shift)}`;
}

// 给 h2/h3 加锚点（取标题文字，重名或撞页面 ID 时加序号直到不重），并把 h2 收成文章目录。
function headingIds(tree: Hast) {
  const toc: TocItem[] = [];
  const used = new Set(PAGE_IDS);
  const visit = (node: Hast) => {
    if (node.type === "element" && (node.tagName === "h2" || node.tagName === "h3")) {
      const text = textOf(node).trim();
      const base = text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "") || "section";
      let id = base;
      for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
      used.add(id);
      node.properties = { ...node.properties, id };
      if (node.tagName === "h2") toc.push({ id, text });
    }
    node.children?.forEach(visit);
  };
  visit(tree);
  return toc;
}

// 默认不开原生 HTML：remark-rehype 不带 allowDangerousHtml，MD 里的 HTML 标签会被丢弃。
const processor = unified().use(remarkParse).use(remarkGfm).use(remarkRehype).use(rehypeStringify);

// Markdown 的原生 HTML 已关闭；再限制编译器生成的链接和图片协议。
// 普通相对地址、根路径和锚点继续可用，拒绝会执行脚本的协议和混淆用控制字符。
function safeUrl(value: unknown, image: boolean): boolean {
  if (typeof value !== "string" || hasControls(value, true) || value.includes("\\")) return false;
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(value)?.[1].toLowerCase();
  if (scheme) return (image ? ["http", "https"] : ["http", "https", "mailto", "tel"]).includes(scheme);
  return !value.startsWith("//");
}

function safeLinks(tree: Hast) {
  const visit = (node: Hast) => {
    if (node.type === "element" && node.tagName === "img" && typeof node.properties?.src === "string"
        && /^:\/[a-f0-9]{32}$/i.test(node.properties.src)) {
      node.tagName = "span";
      const alt = String(node.properties.alt || "未命名图片");
      node.properties = { className: ["missing-image"] };
      node.children = [{ type: "text", value: `原图缺失：${alt}（旧笔记附件未保存）` }];
    }
    if (node.type === "element" && node.properties) {
      for (const key of ["href", "src"]) {
        if (key in node.properties && !safeUrl(node.properties[key], key === "src")) delete node.properties[key];
      }
    }
    node.children?.forEach(visit);
  };
  visit(tree);
}

// 摘要只从 Markdown 语法树取文字，避免把链接地址、HTML 或排版符号带到卡片和搜索中。
function plainMarkdown(markdown: string): string {
  const visit = (node: Hast): string => {
    if (["html", "definition", "image", "imageReference"].includes(node.type)) return "";
    if (["text", "inlineCode", "code"].includes(node.type)) return node.value ?? "";
    if (node.type === "break") return " ";
    const separator = ["root", "list", "listItem", "blockquote", "table", "tableRow"].includes(node.type) ? " " : "";
    return (node.children ?? []).map(visit).join(separator);
  };
  return visit(processor.parse(markdown) as unknown as Hast).replace(/\s+/gu, " ").trim();
}

export function excerpt(essay: Essay, max = 140): string {
  if (!Number.isSafeInteger(max) || max < 1) throw new RangeError("摘要长度须为正整数");
  const plain = plainMarkdown(essay.description?.trim() || essay.body);
  const characters = Array.from(plain);
  return characters.length <= max ? plain : `${characters.slice(0, Math.max(0, max - 1)).join("").trimEnd()}…`;
}

export function readingMinutes(body: string): number {
  const plain = plainMarkdown(body);
  // 中文按字、其他语言按词估算；混排时两部分相加，空内容为 0 分钟。
  const chinese = (plain.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu) ?? []).length;
  const words = (plain.replace(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu, " ").match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) ?? []).length;
  return Math.ceil(chinese / 400 + words / 200);
}

export async function renderMarkdown(markdown: string) {
  const tree = await processor.run(processor.parse(markdown));
  normalizeHeadings(tree as unknown as Hast);
  const toc = headingIds(tree as unknown as Hast);
  safeLinks(tree as unknown as Hast);
  return { html: processor.stringify(tree), toc };
}
