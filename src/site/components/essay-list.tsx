import Link from "next/link";
import type { Essay, YearPage } from "@/lib/content";
import { MoreLink } from "./more-link";
import { PageHeading } from "./page-heading";

// 目录类链接一律不预取：页面再多，预取量也不随篇数增长（005 取舍卡的默认做法）。
export function EssayItems({ essays, full = false }: { essays: Essay[]; full?: boolean }) {
  return (
    <ul className="essay-items">
      {essays.map((essay) => (
        <li key={essay.slug} data-article={`/essays/${essay.slug}/`}>
          <time dateTime={essay.date}>{full ? essay.date : essay.date.slice(5)}</time>
          <Link href={`/essays/${essay.slug}/`} prefetch={false} data-index-title>{essay.title}</Link>
        </li>
      ))}
    </ul>
  );
}

const pageHref = (year: string, page: number) => (page === 1 ? `/essays/${year}/` : `/essays/${year}/page/${page}/`);

export function YearListing({ item }: { item: YearPage }) {
  const { year, page, pages, total, essays } = item;
  return (
    <>
      <PageHeading title={`${year} 年`} note={`共 ${total} 篇${pages > 1 ? ` · 第 ${page} / ${pages} 页` : ""}`} />
      <section data-year-page={year} aria-label={`${year} 年的随笔`}>
        <EssayItems essays={essays} />
      </section>
      {pages > 1 && (
        <nav aria-label="分页" className="mt-6 flex gap-6 text-sm">
          {page > 1 && <Link href={pageHref(year, page - 1)} prefetch={false}>上一页</Link>}
          {page < pages && <Link href={pageHref(year, page + 1)} prefetch={false}>下一页</Link>}
        </nav>
      )}
      <MoreLink href="/essays/">返回随笔</MoreLink>
    </>
  );
}
