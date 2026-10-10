import type { Metadata } from "next";
import Link from "next/link";
import { MoreLink } from "@/components/more-link";
import { PageHeading } from "@/components/page-heading";
import { SiteFrame } from "@/components/site-frame";
import { getEssays, yearPages } from "@/lib/content";

export const metadata: Metadata = { title: "随笔" };

export default function EssaysPage() {
  // 时间线列出全部非空年份，不截断；文章条目放在各年份页，这一页的大小不随篇数增长。
  const years = yearPages(getEssays()).filter((item) => item.page === 1);
  return (
    <SiteFrame current="/essays/">
      <PageHeading title="随笔" note="专栏、专题与年份各自组织同一份正文；分类与专题名称待确认。" />
      <section id="featured-categories" aria-labelledby="categories-title" className="section">
        <h2 id="categories-title" className="section-title">精选专栏</h2>
        <p className="mb-4 text-sm text-muted">分类预览最多四个；真实名称与归属待确认。</p>
        <p data-index-empty className="pending">分类名称待确认，不补造条目。</p>
        <MoreLink href="/essays/categories/">全部专栏</MoreLink>
      </section>
      <section id="featured-tags" aria-labelledby="tags-title" className="section">
        <h2 id="tags-title" className="section-title">精选专题</h2>
        <p className="mb-4 text-sm text-muted">标签预览最多六个；真实名称与归属待确认。</p>
        <p data-index-empty className="pending">专题名称待确认，不补造条目。</p>
        <MoreLink href="/essays/tags/">全部专题</MoreLink>
      </section>
      <section id="timeline" aria-labelledby="timeline-title" className="section">
        <h2 id="timeline-title" className="section-title">时间线</h2>
        {years.length ? (
          <ul className="year-index">
            {years.map(({ year, total }) => (
              <li key={year} data-year={year}>
                <Link href={`/essays/${year}/`} prefetch={false}>{year}</Link>
                <span className="ml-2 text-sm text-muted">{total} 篇</span>
              </li>
            ))}
          </ul>
        ) : (
          <p data-index-empty className="pending">尚未迁入正文，不编造年份。</p>
        )}
      </section>
    </SiteFrame>
  );
}
