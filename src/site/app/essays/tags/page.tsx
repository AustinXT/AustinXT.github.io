import type { Metadata } from "next";
import { MoreLink } from "@/components/more-link";
import { PageHeading } from "@/components/page-heading";
import { SiteFrame } from "@/components/site-frame";

export const metadata: Metadata = { title: "全部专题" };

export default function TagsPage() {
  return (
    <SiteFrame current="/essays/">
      <PageHeading title="全部专题" note="完整标签索引；将与精选专题读取同一份文章元数据。" />
      <p data-index-empty className="pending">尚未迁入正文，标签名称与归属待确认。</p>
      <MoreLink href="/essays/">返回随笔</MoreLink>
    </SiteFrame>
  );
}
