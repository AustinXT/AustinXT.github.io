import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { YearListing } from "@/components/essay-list";
import { MoreLink } from "@/components/more-link";
import { PageHeading } from "@/components/page-heading";
import { SiteFrame } from "@/components/site-frame";
import { getEssay, getEssays, getYearPage, renderMarkdown, yearPages } from "@/lib/content";

type Props = { params: Promise<{ path: string[] }> };

export const dynamicParams = false;

// 一个路由承接三种页面：文章 /essays/<slug>/、年份 /essays/<年>/、年份分页 /essays/<年>/page/<n>/。
// 合成一个是因为静态导出不许 generateStaticParams 返回空数组，单独的分页路由在没有分页时会让构建失败。
// slug 必须含字母，所以纯数字一定是年份。
function resolve(path: string[]) {
  const [head, kind, n] = path;
  if (path.length === 1 && !/^\d+$/.test(head)) return { essay: getEssay(head) };
  if (!/^\d{4}$/.test(head)) return {};
  if (path.length === 1) return { year: getYearPage(head) };
  if (path.length === 3 && kind === "page" && /^[1-9]\d*$/.test(n) && n !== "1") return { year: getYearPage(head, Number(n)) };
  return {};
}

export function generateStaticParams() {
  const essays = getEssays().map(({ slug }) => ({ path: [slug] }));
  const years = yearPages(getEssays())
    .map(({ year, page }) => ({ path: page === 1 ? [year] : [year, "page", String(page)] }));
  return [...essays, ...years];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { essay, year } = resolve((await params).path);
  if (year) return { title: `${year.year} 年的随笔${year.page > 1 ? ` · 第 ${year.page} 页` : ""}` };
  return { title: essay?.title };
}

export default async function EssayRoute({ params }: Props) {
  const { essay, year } = resolve((await params).path);
  if (year) return <SiteFrame current="/essays/"><YearListing item={year} /></SiteFrame>;
  if (!essay) notFound();
  const { html, toc } = await renderMarkdown(essay.body);
  const note = (
    <>
      <time dateTime={essay.date}>{essay.date}</time>
      {essay.revised && <> · <time dateTime={essay.revised}>{essay.revised}</time> 整理</>}
    </>
  );
  return (
    <SiteFrame current="/essays/">
      <div className="max-w-3xl">
        <PageHeading title={essay.title} note={note} />
        {toc.length > 1 && (
          <nav aria-label="文章目录" data-essay-toc className="essay-toc">
            <p>目录</p>
            <ol>
              {toc.map((item) => <li key={item.id}><a href={`#${item.id}`}>{item.text}</a></li>)}
            </ol>
          </nav>
        )}
        <article data-essay-body className="essay-body" dangerouslySetInnerHTML={{ __html: html }} />
        <MoreLink href="/essays/">返回随笔</MoreLink>
      </div>
    </SiteFrame>
  );
}
