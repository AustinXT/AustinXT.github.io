import type { Metadata } from "next";
import { MoreLink } from "@/components/more-link";
import { PageHeading } from "@/components/page-heading";
import { SiteFrame } from "@/components/site-frame";

export const metadata: Metadata = { title: "随笔" };

export default function EssaysPage() {
  return (
    <SiteFrame current="/essays/">
      <PageHeading title="随笔" note="专栏、专题与年份各自组织同一份正文；当前工程尚未迁入文章。" />
      <section id="featured-categories" aria-labelledby="categories-title" className="section">
        <h2 id="categories-title" className="section-title">精选专栏</h2>
        <p className="mb-4 text-sm text-muted">分类预览最多四个；真实名称与归属待确认。</p>
        <p data-index-empty className="pending">尚未迁入正文，无已确认分类，不补造条目。</p>
        <MoreLink href="/essays/categories/">全部专栏</MoreLink>
      </section>
      <section id="featured-tags" aria-labelledby="tags-title" className="section">
        <h2 id="tags-title" className="section-title">精选专题</h2>
        <p className="mb-4 text-sm text-muted">标签预览最多六个；真实名称与归属待确认。</p>
        <p data-index-empty className="pending">尚未迁入正文，无已确认标签，不补造条目。</p>
        <MoreLink href="/essays/tags/">全部专题</MoreLink>
      </section>
      <section id="timeline" aria-labelledby="timeline-title" className="section">
        <h2 id="timeline-title" className="section-title">时间线</h2>
        <p data-index-empty className="pending">尚未迁入正文，不将旧原型的候选年份计为已迁文章。</p>
        <MoreLink href="/essays/preview/">查看文章工程占位页</MoreLink>
      </section>
    </SiteFrame>
  );
}
