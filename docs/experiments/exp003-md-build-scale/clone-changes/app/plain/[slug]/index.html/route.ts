// 追加实验 P1：Route Handler 直出纯 HTML，不经 React 页面机制
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
  const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${meta.title}</title><link rel="stylesheet" href="/plain.css"></head><body><header><nav><a href="/">首页</a> <a href="/essays/">随笔</a> <a href="/works/">作品</a> <a href="/about/">简介</a></nav></header><main><h1>${meta.title}</h1><p>${meta.date}</p><article data-essay-body>${body}</article><a href="/essays/all/">返回全部文章</a></main></body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
