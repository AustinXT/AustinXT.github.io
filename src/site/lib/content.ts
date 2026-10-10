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
  body: string;
};

const KEYS = new Set(["title", "date", "revised", "slug", "description", "categories", "tags", "draft"]);
// 与 app/essays/ 下的静态路由同名会被静态页遮住，直接拒绝；纯数字留给年份页 /essays/<年>/。
const RESERVED = new Set(["categories", "tags"]);
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
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

function strings(file: string, key: string, value: unknown) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || !item.trim())) {
    fail(file, `${key} 须为非空字符串数组`);
  }
  return value as string[];
}

export function parseEssay(file: string, source: string): Essay {
  const { data, content } = matter(source);
  const unknown = Object.keys(data).filter((key) => !KEYS.has(key));
  if (unknown.length) fail(file, `未知字段：${unknown.join("、")}`);
  if (typeof data.title !== "string" || !data.title.trim()) fail(file, "缺 title");
  if (typeof data.slug !== "string" || !SLUG.test(data.slug)) fail(file, "slug 只能用小写字母、数字和单个连字符");
  if (path.basename(file, ".md") !== data.slug) fail(file, "文件名须与 slug 一致");
  if (RESERVED.has(data.slug)) fail(file, `slug 与静态路由 /essays/${data.slug}/ 冲突`);
  if (!/[a-z]/.test(data.slug)) fail(file, "slug 须含字母，纯数字留给年份页");
  if (data.description !== undefined && typeof data.description !== "string") fail(file, "description 须为字符串");
  if (data.draft !== undefined && typeof data.draft !== "boolean") fail(file, "draft 须为 true 或 false");
  if (!content.trim()) fail(file, "正文为空");
  const date = isoDate(file, data.date);
  const revised = data.revised === undefined ? undefined : isoDate(file, data.revised, "revised");
  if (revised && revised < date) fail(file, "revised 不能早于 date");
  return {
    slug: data.slug,
    title: data.title.trim(),
    date,
    revised,
    description: data.description,
    categories: strings(file, "categories", data.categories),
    tags: strings(file, "tags", data.tags),
    draft: data.draft ?? false,
    body: content,
  };
}

export function readEssays(dir: string): Essay[] {
  return fs.readdirSync(dir).filter((name) => name.endsWith(".md")).sort()
    .map((name) => parseEssay(name, fs.readFileSync(path.join(dir, name), "utf8")));
}

// 草稿不进构建；按日期倒序，同日按 slug。
export function publishable(essays: Essay[]) {
  return essays.filter((essay) => !essay.draft)
    .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}

let cache: Essay[] | null = null;

export function getEssays() {
  cache ??= publishable(readEssays(path.join(process.cwd(), "content", "essays")));
  return cache;
}

export function getEssay(slug: string) {
  return getEssays().find((essay) => essay.slug === slug);
}

export type YearPage = { year: string; page: number; pages: number; total: number; essays: Essay[] };

// 随笔目录按年份拆成静态页，单页超过上限再分页；输入须已按日期倒序。
export function yearPages(essays: Essay[], size = YEAR_PAGE_SIZE): YearPage[] {
  const years = new Map<string, Essay[]>();
  for (const essay of essays) {
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

// 只用到 hast 的这几个字段；不为类型另装依赖。
type Hast = { type: string; tagName?: string; value?: string; properties?: Record<string, unknown>; children?: Hast[] };
export type TocItem = { id: string; text: string };

function textOf(node: Hast): string {
  return node.type === "text" ? node.value ?? "" : (node.children ?? []).map(textOf).join("");
}

// 给 h2/h3 加锚点（取标题文字，重名加序号），并把 h2 收成文章目录。
function headingIds(tree: Hast) {
  const toc: TocItem[] = [];
  const used = new Map<string, number>();
  const visit = (node: Hast) => {
    if (node.type === "element" && (node.tagName === "h2" || node.tagName === "h3")) {
      const text = textOf(node).trim();
      const base = text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "") || "section";
      const seen = (used.get(base) ?? 0) + 1;
      used.set(base, seen);
      const id = seen > 1 ? `${base}-${seen}` : base;
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

export async function renderMarkdown(markdown: string) {
  const tree = await processor.run(processor.parse(markdown));
  const toc = headingIds(tree as unknown as Hast);
  return { html: processor.stringify(tree), toc };
}
