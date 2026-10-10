import fs from "node:fs";
import path from "node:path";

// 实验用：读取 content/ 下的合成文章（已编译 HTML 片段 + 元数据）
export type EssayMeta = { slug: string; title: string; date: string };

const contentDir = path.join(process.cwd(), "content");
let all: EssayMeta[] | null = null;
let bySlug: Map<string, EssayMeta> | null = null;

export function getAllEssays(): EssayMeta[] {
  if (!all) {
    all = JSON.parse(fs.readFileSync(path.join(contentDir, "_meta.json"), "utf8")) as EssayMeta[];
    // 追加实验（Route Handler 直出）：EXP_N 限定规模，保留 fixed-0001 与 essay-00000..N-2
    const n = Number(process.env.EXP_N ?? 0);
    if (n > 0) all = all.filter((m) => m.slug === "fixed-0001" || Number(m.slug.slice(6)) < n - 1);
  }
  return all;
}

export function getEssay(slug: string): EssayMeta | undefined {
  if (!bySlug) bySlug = new Map(getAllEssays().map((m) => [m.slug, m]));
  return bySlug.get(slug);
}

export function readEssayHtml(slug: string): string {
  return fs.readFileSync(path.join(contentDir, `${slug}.html`), "utf8");
}

export const PER_PAGE = 20;
