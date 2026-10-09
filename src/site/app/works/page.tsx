import type { Metadata } from "next";
import { FileText, ArrowRight } from "lucide-react";
import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { SiteFrame } from "@/components/site-frame";

export const metadata: Metadata = { title: "作品" };

export default function WorksPage() {
  return (
    <SiteFrame current="/works/">
      <PageHeading title="作品" note="图标列表将逐项进入详情；真实作品资料尚未提供。" />
      <section data-work-list aria-labelledby="works-title" className="section pt-0!">
        <h2 id="works-title" className="section-title">实际作品</h2>
        <p data-index-empty className="pending">当前没有已确认作品，名称、图标和公开范围待确认。</p>
      </section>
      <section aria-labelledby="preview-title" className="section">
        <h2 id="preview-title" className="section-title">独立详情入口</h2>
        <Link href="/works/preview/" className="flex items-center gap-4 border-y border-line py-5 no-underline">
          <FileText aria-hidden="true" size={28} className="shrink-0 text-accent" />
          <span>
            <span className="block font-serif text-xl">工程详情占位</span>
            <span className="text-sm text-muted">非实际作品，不计入本人作品列表。</span>
          </span>
          <ArrowRight aria-hidden="true" size={18} className="ml-auto shrink-0" />
        </Link>
      </section>
    </SiteFrame>
  );
}
