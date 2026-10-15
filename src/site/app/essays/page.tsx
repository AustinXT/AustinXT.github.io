import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { MoreLink } from "@/components/more-link";
import { SiteFrame } from "@/components/site-frame";
import { getEssays, yearPages, taxonomyTerms, taxonomyHref } from "@/lib/content";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata("随笔", "/essays/");
export default function EssaysPage() {
  const essays = getEssays();
  const years = yearPages(essays).filter(({ page }) => page === 1);
  return <SiteFrame current="/essays/"><PageHeading title="随笔" note={`${essays.length} 篇记录，沿着主题或时间，慢慢阅读。`} />
    <section id="featured-categories" aria-labelledby="categories-title" className="section"><h2 id="categories-title" className="section-title">精选专栏</h2>
      {taxonomyTerms(essays, "categories").length ? <ul className="taxonomy-grid">{taxonomyTerms(essays, "categories").slice(0, 4).map(({ name, count }) => <li key={name}><Link href={taxonomyHref("categories", name)} prefetch={false}>{name}<span>{count} 篇</span></Link></li>)}</ul> : <p data-index-empty className="empty-state">文章还没有归入专栏，也可以从时间线开始阅读。</p>}
      <MoreLink href="/essays/categories/">全部专栏</MoreLink></section>
    <section id="featured-tags" aria-labelledby="tags-title" className="section"><h2 id="tags-title" className="section-title">精选专题</h2>
      {taxonomyTerms(essays, "tags").length ? <ul className="flex flex-wrap gap-3">{taxonomyTerms(essays, "tags").slice(0, 6).map(({ name, count }) => <li key={name}><Link className="term-pill" prefetch={false} href={taxonomyHref("tags", name)}># {name}<span className="ml-2">{count}</span></Link></li>)}</ul> : <p data-index-empty className="empty-state">专题随写作逐渐生长。</p>}
      <MoreLink href="/essays/tags/">全部专题</MoreLink></section>
    <section id="timeline" aria-labelledby="timeline-title" className="section"><h2 id="timeline-title" className="section-title">时间线</h2>
      {years.length ? <ul className="year-index">{years.map(({ year, total }) => <li key={year} data-year={year}><Link href={`/essays/${year}/`} prefetch={false}>{year}</Link><span className="ml-2 text-sm text-muted">{total} 篇</span></li>)}</ul> : <p data-index-empty className="empty-state">还没有公开的随笔。新的记录会在这里相遇。</p>}
      <MoreLink href="/essays/archive/">查看归档</MoreLink></section></SiteFrame>;
}
