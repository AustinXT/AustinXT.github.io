import { EssayItems } from "@/components/essay-list";
import { MoreLink } from "@/components/more-link";
import { SiteFrame } from "@/components/site-frame";
import { getEssays, HOME_RECENT } from "@/lib/content";

export default function HomePage() {
  const recent = getEssays().slice(0, HOME_RECENT);
  return (
    <SiteFrame current="/">
      <section id="overview-about" aria-labelledby="intro-title" className="section pt-0!">
        <h1 id="intro-title" className="section-title">简介</h1>
        <p className="text-muted">这里将介绍智能时代蛮子的写作与实践；拟公开简介待你提供。</p>
        <MoreLink href="/about/">查看简介</MoreLink>
      </section>
      <section id="overview-essays" aria-labelledby="essays-title" className="section">
        <h2 id="essays-title" className="section-title">随笔</h2>
        {recent.length ? <EssayItems essays={recent} full /> : <p className="text-muted">文章尚未迁入。</p>}
        <MoreLink href="/essays/">进入随笔</MoreLink>
      </section>
      <section id="overview-works" aria-labelledby="works-title" className="section">
        <h2 id="works-title" className="section-title">作品</h2>
        <p className="text-muted">真实作品、图标与公开范围待确认，暂不列出本人作品。</p>
        <MoreLink href="/works/">查看作品入口</MoreLink>
      </section>
      <section id="overview-contact" aria-labelledby="contact-title" className="section">
        <h2 id="contact-title" className="section-title">联系</h2>
        <p className="text-muted">联系方式归入简介页；未提供公开账号，不补造邮箱或链接。</p>
        <MoreLink href="/about/#contact">进入联系部分</MoreLink>
      </section>
    </SiteFrame>
  );
}
