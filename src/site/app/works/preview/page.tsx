import type { Metadata } from "next";
import { MoreLink } from "@/components/more-link";
import { PageHeading } from "@/components/page-heading";
import { SiteFrame } from "@/components/site-frame";

export const metadata: Metadata = { title: "作品详情工程占位" };

export default function WorkPreviewPage() {
  return (
    <SiteFrame current="/works/">
      <section data-work-preview>
        <PageHeading title="作品详情工程占位" note="非实际作品；只验证独立详情路由与返回入口，不编造真实项目。" />
        <p className="pending">真实作品介绍、素材与公开链接待你确认后再加入。</p>
        <MoreLink href="/works/">返回作品</MoreLink>
      </section>
    </SiteFrame>
  );
}
