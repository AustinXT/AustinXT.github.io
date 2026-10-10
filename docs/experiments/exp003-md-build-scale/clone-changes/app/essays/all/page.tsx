import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { SiteFrame } from "@/components/site-frame";
import { getAllEssays } from "@/lib/exp-content";

export const metadata: Metadata = { title: "全部文章（实验）" };

export default function AllEssaysPage() {
  const items = getAllEssays();
  return (
    <SiteFrame current="/essays/">
      <PageHeading title="全部文章" note={`共 ${items.length} 篇 · 合成实验数据`} />
      <ol data-essay-list className="space-y-2">
        {items.map(({ slug, title, date }) => (
          <li key={slug} className="flex items-baseline justify-between gap-4">
            <Link href={`/essays/${slug}/`}>{title}</Link>
            <time dateTime={date} className="text-xs text-muted">{date}</time>
          </li>
        ))}
      </ol>
    </SiteFrame>
  );
}
