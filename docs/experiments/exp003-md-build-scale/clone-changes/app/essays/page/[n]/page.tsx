import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeading } from "@/components/page-heading";
import { SiteFrame } from "@/components/site-frame";
import { PER_PAGE, getAllEssays } from "@/lib/exp-content";

type Props = { params: Promise<{ n: string }> };

export const dynamicParams = false;

function pageCount() {
  return Math.max(1, Math.ceil(getAllEssays().length / PER_PAGE));
}

export function generateStaticParams() {
  return Array.from({ length: pageCount() }, (_, i) => ({ n: String(i + 1) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { n } = await params;
  return { title: `文章目录 第 ${n} 页` };
}

export default async function EssayIndexPage({ params }: Props) {
  const { n } = await params;
  const page = Number(n);
  const total = pageCount();
  if (!Number.isInteger(page) || page < 1 || page > total) notFound();
  const items = getAllEssays().slice((page - 1) * PER_PAGE, page * PER_PAGE);
  return (
    <SiteFrame current="/essays/">
      <PageHeading title={`文章目录 · 第 ${page} / ${total} 页`} note="每页 20 篇 · 合成实验数据" />
      <ol data-essay-list className="space-y-2">
        {items.map(({ slug, title, date }) => (
          <li key={slug} className="flex items-baseline justify-between gap-4">
            <Link href={`/essays/${slug}/`}>{title}</Link>
            <time dateTime={date} className="text-xs text-muted">{date}</time>
          </li>
        ))}
      </ol>
      <nav aria-label="分页" className="mt-8 flex justify-between text-sm">
        {page > 1 ? <Link href={`/essays/page/${page - 1}/`}>上一页</Link> : <span />}
        {page < total ? <Link href={`/essays/page/${page + 1}/`}>下一页</Link> : <span />}
      </nav>
    </SiteFrame>
  );
}
