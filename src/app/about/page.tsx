import { PageHeading } from "@/components/page-heading";
import { SiteFrame } from "@/components/site-frame";
import { ArrowUpRight, Rss } from "lucide-react";
import { renderMarkdown } from "@/lib/content";
import { getAboutPage, getSiteConfig, pageMetadata } from "@/lib/site";

export function generateMetadata() { return pageMetadata(getAboutPage().title, "/about/"); }

export default async function AboutPage() {
  const about = getAboutPage();
  const site = getSiteConfig();
  const { html } = await renderMarkdown(about.body);
  return (
    <SiteFrame current="/about/">
      <div className="about-page">
        <PageHeading title={about.title} />
        <article data-page-body className="essay-body" dangerouslySetInnerHTML={{ __html: html }} />
        <section id="contact" aria-labelledby="contact-title" className="section about-contact">
          <h2 id="contact-title" className="section-title">保持联系</h2>
          {site.contact.length > 0 && (
            <ul className="contact-links">
              {site.contact.map((contact) => <li key={contact.url}><a href={contact.url}>{contact.label}<ArrowUpRight aria-hidden="true" size={14} /></a></li>)}
            </ul>
          )}
          <p className="text-muted">{site.url ? "喜欢这里的文字，可以通过 RSS 订阅更新。" : "更多记录，随写作陆续更新。"}</p>
          {site.url && <a href="/feed.xml" className="subscribe-link"><Rss aria-hidden="true" size={16} />订阅更新</a>}
        </section>
      </div>
    </SiteFrame>
  );
}
