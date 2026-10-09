import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { SiteFrame } from "@/components/site-frame";

export const metadata: Metadata = { title: "简介" };

export default function AboutPage() {
  return (
    <SiteFrame current="/about/">
      <PageHeading title="简介" note="公开介绍待确认；当前只建立页面与联系入口，不代写个人经历。" />
      <section aria-labelledby="about-title" className="section">
        <h2 id="about-title" className="section-title">关于我</h2>
        <p className="pending">拟公开的身份与介绍待你提供。</p>
      </section>
      <section id="contact" aria-labelledby="contact-title" className="section">
        <h2 id="contact-title" className="section-title">联系</h2>
        <p className="pending">联系方式与公开范围待确认；当前无外发入口或表单。</p>
      </section>
    </SiteFrame>
  );
}
