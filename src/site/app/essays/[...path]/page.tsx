import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EssayItems, YearListing } from "@/components/essay-list";
import { PageHeading } from "@/components/page-heading";
import { SiteFrame } from "@/components/site-frame";
import { getEssay, getEssays, getYearPage, renderMarkdown, yearPages, taxonomyPages, getTaxonomyPage, taxonomyHref, excerpt, readingMinutes, type Essay, type YearPage } from "@/lib/content";
import { getSiteConfig, pageMetadata } from "@/lib/site";

type Props = { params: Promise<{ path: string[] }> };
type TaxonomyPage = NonNullable<ReturnType<typeof getTaxonomyPage>>;
type Route = { kind: "archive" } | { kind: "essay"; essay: Essay } | { kind: "year"; year: YearPage } | { kind: "term"; term: TaxonomyPage };
export const dynamicParams = false;

// 静态预渲染与客户端导航可能分别提供编码值和原文；只解码一次。
function routeParts(parts: string[]) {
  try { return parts.map((part) => decodeURIComponent(part)); } catch { return []; }
}

function resolve(parts: string[]): Route | undefined {
  const [head, name, kind, n] = parts;
  if (parts.length === 1 && head === "archive") return { kind: "archive" };
  if (head === "categories" || head === "tags") {
    const page = parts.length === 2 ? 1 : parts.length === 4 && kind === "page" && /^[2-9]$|^[1-9]\d+$/.test(n) ? Number(n) : 0;
    const term = page && name ? getTaxonomyPage(head, name, page) : undefined;
    return term ? { kind: "term", term } : undefined;
  }
  if (/^\d{4}$/.test(head)) {
    const page = parts.length === 1 ? 1 : parts.length === 3 && name === "page" && /^[2-9]$|^[1-9]\d+$/.test(kind) ? Number(kind) : 0;
    const year = page ? getYearPage(head, page) : undefined;
    return year ? { kind: "year", year } : undefined;
  }
  const essay = parts.length === 1 ? getEssay(head) : undefined;
  return essay ? { kind: "essay", essay } : undefined;
}

export function generateStaticParams() {
  return [
    { path: ["archive"] },
    ...getEssays().map(({ slug }) => ({ path: [slug] })),
    ...yearPages(getEssays()).map(({ year, page }) => ({ path: page === 1 ? [year] : [year, "page", String(page)] })),
    ...(["categories", "tags"] as const).flatMap((key) => taxonomyPages(getEssays(), key).map(({ name, page }) => ({ path: page === 1 ? [key, name] : [key, name, "page", String(page)] }))),
  ];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const parts = routeParts((await params).path);
  const route = resolve(parts);
  const pathname = `/essays/${parts.map(encodeURIComponent).join("/")}/`;
  if (!route) return {};
  if (route.kind === "archive") return pageMetadata("随笔归档", pathname);
  if (route.kind === "year") return pageMetadata(`${route.year.year} 年的随笔${route.year.page > 1 ? ` · 第 ${route.year.page} 页` : ""}`, pathname);
  if (route.kind === "term") return pageMetadata(`${route.term.name}${route.term.page > 1 ? ` · 第 ${route.term.page} 页` : ""}`, pathname, `阅读「${route.term.name}」的 ${route.term.total} 篇随笔。`);
  const meta = pageMetadata(route.essay.title, pathname, excerpt(route.essay));
  return { ...meta, openGraph: { ...meta.openGraph, type: "article", publishedTime: route.essay.date, modifiedTime: route.essay.revised || route.essay.date, authors: [getSiteConfig().author] } };
}

export default async function EssayRoute({ params }: Props) {
  const route = resolve(routeParts((await params).path));
  if (!route) notFound();
  if (route.kind === "year") return <SiteFrame current="/essays/"><YearListing item={route.year} /></SiteFrame>;
  if (route.kind === "archive") {
    const years = yearPages(getEssays()).filter(({ page }) => page === 1);
    return <SiteFrame current="/essays/"><PageHeading title="随笔归档" note={`共 ${getEssays().length} 篇，按写作年份阅读。`} />
      {years.length ? <ul className="year-index">{years.map(({ year, total }) => <li key={year} data-year={year}><Link href={`/essays/${year}/`} prefetch={false}>{year}</Link><span className="ml-3 text-sm text-muted">{total} 篇</span></li>)}</ul> : <p data-index-empty className="empty-state">还没有公开的随笔。新的记录会在这里相遇。</p>}
      <p className="mt-8"><Link href="/essays/">返回随笔</Link></p></SiteFrame>;
  }
  if (route.kind === "term") {
    const { name, key, essays, page, pages, total } = route.term;
    return <SiteFrame current="/essays/"><nav className="breadcrumb" aria-label="面包屑"><Link href="/essays/">随笔</Link><span>/</span><Link href={`/essays/${key}/`}>{key === "categories" ? "专栏" : "专题"}</Link></nav>
      <PageHeading title={name} note={`${total} 篇随笔${pages > 1 ? ` · 第 ${page} / ${pages} 页` : ""}`} />
      <section data-taxonomy={key} data-term={name}><EssayItems essays={essays} full /></section>
      {pages > 1 && <nav className="pagination" aria-label="分页">{page > 1 && <Link prefetch={false} href={taxonomyHref(key, name, page - 1)}>上一页</Link>}<span>{page} / {pages}</span>{page < pages && <Link prefetch={false} href={taxonomyHref(key, name, page + 1)}>下一页</Link>}</nav>}
      <p className="mt-8"><Link href="/essays/">返回随笔</Link></p></SiteFrame>;
  }
  const { essay } = route;
  const all = getEssays();
  const index = all.findIndex(({ slug }) => slug === essay.slug);
  const newer = all[index - 1], older = all[index + 1];
  const related = all.filter((item) => item.slug !== essay.slug).map((item) => ({ item, score: item.tags.filter((tag) => essay.tags.includes(tag)).length + item.categories.filter((term) => essay.categories.includes(term)).length * 2 })).filter(({ score }) => score > 0).sort((a, b) => b.score - a.score).slice(0, 3).map(({ item }) => item);
  const { html, toc } = await renderMarkdown(essay.body);
  const site = getSiteConfig();
  const schema = site.url ? { "@context": "https://schema.org", "@type": "BlogPosting", headline: essay.title, description: excerpt(essay), datePublished: essay.date, dateModified: essay.revised || essay.date, author: { "@type": "Person", name: site.author }, mainEntityOfPage: `${site.url}/essays/${essay.slug}/` } : null;
  return <SiteFrame current="/essays/">
    <nav aria-label="面包屑" className="breadcrumb"><Link href="/essays/">随笔</Link><span>/</span><Link href={`/essays/${essay.date.slice(0, 4)}/`}>{essay.date.slice(0, 4)}</Link></nav>
    <header className="article-header"><h1>{essay.title}</h1><p className="article-meta"><time dateTime={essay.date}>{essay.date}</time><span>{essay.body.trim() ? `约 ${readingMinutes(essay.body)} 分钟` : "正文待补充"}</span>{essay.revised && <span>修订于 <time dateTime={essay.revised}>{essay.revised}</time></span>}</p>
      {(essay.categories.length > 0 || essay.tags.length > 0) && <div className="flex flex-wrap gap-2">{essay.categories.map((name) => <Link key={`c-${name}`} href={taxonomyHref("categories", name)} prefetch={false} className="term-pill">{name}</Link>)}{essay.tags.map((name) => <Link key={`t-${name}`} href={taxonomyHref("tags", name)} prefetch={false} className="term-pill"># {name}</Link>)}</div>}
    </header>
    <div className="article-layout">{essay.body.trim() ? <article data-essay-body className="essay-body" dangerouslySetInnerHTML={{ __html: html }} /> : <article data-essay-body className="essay-body"><p className="empty-state">这篇旧稿暂无正文，待补充。</p></article>}
      {toc.length > 1 && <aside className="article-aside"><nav aria-label="文章目录" data-essay-toc><details className="essay-toc"><summary>本篇目录 · {toc.length} 节</summary><ol>{toc.map((item) => <li key={item.id}><a href={`#${item.id}`}>{item.text}</a></li>)}</ol><a href="#main-content" className="mt-4 inline-block">回到顶部 ↑</a></details></nav></aside>}
    </div>
    <footer className="article-footer"><nav aria-label="相邻随笔" className="adjacent-posts">{newer && <Link href={`/essays/${newer.slug}/`} prefetch={false}><small>较新一篇</small>{newer.title}</Link>}{older && <Link href={`/essays/${older.slug}/`} prefetch={false}><small>较早一篇</small>{older.title}</Link>}</nav>
      {related.length > 0 && <section className="mt-8"><h2 className="section-title">继续阅读</h2><EssayItems essays={related} full /></section>}
      <div className="mt-6 flex flex-wrap gap-6"><Link href="/essays/">← 返回随笔</Link>{site.url && <a href="/feed.xml">通过 RSS 订阅</a>}</div></footer>
    {schema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />}
  </SiteFrame>;
}
