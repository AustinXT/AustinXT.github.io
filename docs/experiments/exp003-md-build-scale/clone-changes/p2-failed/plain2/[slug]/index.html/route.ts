// 追加实验 P2：Route Handler 里用 react-dom/server 复用共享布局组件
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SiteFrame } from "@/components/site-frame";
import { getAllEssays, getEssay, readEssayHtml } from "@/lib/exp-content";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllEssays().map(({ slug }) => ({ slug }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meta = getEssay(slug)!;
  const body = readEssayHtml(slug);
  const tree = createElement(
    SiteFrame,
    { current: "/essays/" as const },
    createElement("h1", null, meta.title),
    createElement("article", { "data-essay-body": "", dangerouslySetInnerHTML: { __html: body } }),
  );
  const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>${meta.title}</title></head><body>${renderToStaticMarkup(tree)}</body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
