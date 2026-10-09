import type { Metadata } from "next";
import { MoreLink } from "@/components/more-link";
import { PageHeading } from "@/components/page-heading";
import { SiteFrame } from "@/components/site-frame";

export const metadata: Metadata = { title: "全部专栏" };

export default function CategoriesPage() {
  return (
    <SiteFrame current="/essays/">
      <PageHeading title="全部专栏" note="完整分类索引；将与精选专栏读取同一份文章元数据。" />
      <p data-index-empty className="pending">尚未迁入正文，分类名称与归属待确认。</p>
      <MoreLink href="/essays/">返回随笔</MoreLink>
    </SiteFrame>
  );
}
