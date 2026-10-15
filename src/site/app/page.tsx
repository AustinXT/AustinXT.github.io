import { EssayItems } from "@/components/essay-list";
import { MoreLink } from "@/components/more-link";
import { SiteFrame } from "@/components/site-frame";
import { WorkCards } from "@/components/work-cards";
import { ArrowUpRight, Rss } from "lucide-react";
import { getEssays, getWorks, HOME_RECENT } from "@/lib/content";
import { getSiteConfig, pageMetadata } from "@/lib/site";

export function generateMetadata() {
  const site = getSiteConfig();
  return { ...pageMetadata(site.title, "/"), title: { absolute: site.title } };
}

export default function HomePage() {
  const recent = getEssays().slice(0, HOME_RECENT);
  const works = getWorks().slice(0, 3);
  const site = getSiteConfig();
  return (
    <SiteFrame current="/">
      <section id="overview-about" aria-labelledby="intro-title" className="home-intro">
        <p className="eyebrow">随笔与作品</p>
        <h1 id="intro-title">{site.title}</h1>
        <p className="intro-text">{site.intro}</p>
        <MoreLink href="/about/">更多关于我</MoreLink>
      </section>
      <section id="overview-essays" aria-labelledby="essays-title" className="section">
        <div className="section-heading">
          <h2 id="essays-title" className="section-title">最新随笔</h2>
          <MoreLink href="/essays/">全部随笔</MoreLink>
        </div>
        {recent.length ? <EssayItems essays={recent} full /> : (
          <p className="empty-state">文字正在酝酿，欢迎过些时候再来。</p>
        )}
      </section>
      <section id="overview-works" aria-labelledby="works-title" className="section">
        <div className="section-heading">
          <h2 id="works-title" className="section-title">作品</h2>
          <MoreLink href="/works/">全部作品</MoreLink>
        </div>
        {works.length ? <WorkCards works={works} compact /> : <p className="empty-state">作品会陆续放在这里。</p>}
      </section>
      <section id="overview-contact" aria-labelledby="contact-title" className="section contact-section">
        <div>
          <h2 id="contact-title" className="section-title">保持联系</h2>
          <p className="text-muted">{site.url ? "通过 RSS 订阅，在你喜欢的阅读器里接收新文章。" : "关于这个博客，以及继续阅读的方式。"}</p>
          <MoreLink href="/about/#contact">联系与订阅</MoreLink>
          {site.contact.length > 0 && (
            <ul className="contact-links">
              {site.contact.map((contact) => <li key={contact.url}><a href={contact.url}>{contact.label}<ArrowUpRight aria-hidden="true" size={14} /></a></li>)}
            </ul>
          )}
        </div>
        {site.url && <a href="/feed.xml" className="subscribe-link"><Rss aria-hidden="true" size={16} />订阅更新</a>}
      </section>
    </SiteFrame>
  );
}
