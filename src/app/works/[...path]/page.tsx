import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeading } from "@/components/page-heading";
import { SiteFrame } from "@/components/site-frame";
import { WorkCards } from "@/components/work-cards";
import { getWork, getWorks, renderMarkdown, excerpt } from "@/lib/content";
import { pageMetadata } from "@/lib/site";

type Props = { params: Promise<{ path: string[] }> };
const SIZE = 24;
export const dynamicParams = false;
export function generateStaticParams() {
  const works = getWorks();
  return [{ path: ["archive"] }, ...works.map(({ slug }) => ({ path: [slug] })), ...Array.from({ length: Math.max(0, Math.ceil(works.length / SIZE) - 1) }, (_, i) => ({ path: ["archive", "page", String(i + 2)] }))];
}
function resolve(parts: string[]) {
  if (parts[0] === "archive") {
    const page = parts.length === 1 ? 1 : parts.length === 3 && parts[1] === "page" && /^[2-9]$|^[1-9]\d+$/.test(parts[2]) ? Number(parts[2]) : 0;
    const all = getWorks(), pages = Math.max(1, Math.ceil(all.length / SIZE));
    return page > 0 && page <= pages ? { page, pages, total: all.length, works: all.slice((page - 1) * SIZE, page * SIZE) } : undefined;
  }
  const work = parts.length === 1 ? getWork(parts[0]) : undefined;
  return work ? { work } : undefined;
}
export async function generateMetadata({ params }: Props) {
  const parts = (await params).path;
  const route = resolve(parts);
  if (!route) return {};
  return pageMetadata(route.work?.title || `作品归档${route.page && route.page > 1 ? ` · 第 ${route.page} 页` : ""}`, `/works/${parts.join("/")}/`, route.work ? excerpt(route.work) : undefined);
}
export default async function WorkRoute({ params }: Props) {
  const route = resolve((await params).path);
  if (!route) notFound();
  if (route.works) return <SiteFrame current="/works/"><PageHeading title="作品归档" note={`共 ${route.total} 个作品${route.pages > 1 ? ` · 第 ${route.page} / ${route.pages} 页` : ""}`} />
    <section data-work-list>{route.works.length ? <WorkCards works={route.works} /> : <p data-index-empty className="empty-state">作品会在这里陆续更新。</p>}</section>
    {route.pages > 1 && <nav className="pagination" aria-label="分页">{route.page > 1 && <Link prefetch={false} href={route.page === 2 ? "/works/archive/" : `/works/archive/page/${route.page - 1}/`}>上一页</Link>}<span>{route.page} / {route.pages}</span>{route.page < route.pages && <Link prefetch={false} href={`/works/archive/page/${route.page + 1}/`}>下一页</Link>}</nav>}
    <p className="mt-8"><Link href="/works/">返回作品</Link></p></SiteFrame>;
  const work = route.work!;
  const { html } = await renderMarkdown(work.body);
  return <SiteFrame current="/works/"><nav className="breadcrumb" aria-label="面包屑"><Link href="/works/">作品</Link></nav>
    <PageHeading title={work.title} note={work.description || ""} />
    <article data-work-body className="essay-body max-w-3xl" dangerouslySetInnerHTML={{ __html: html }} />
    <div className="article-footer flex flex-wrap gap-6">{work.externalUrl && <a href={work.externalUrl} rel="external" className="external-work-link">访问作品 ↗</a>}<Link href="/works/">← 返回作品</Link></div>
  </SiteFrame>;
}
