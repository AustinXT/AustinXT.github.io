import { PageHeading } from "@/components/page-heading";
import { SiteFrame } from "@/components/site-frame";
import { WorkCards } from "@/components/work-cards";
import { getWorks } from "@/lib/content";
import { MoreLink } from "@/components/more-link";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata("作品", "/works/");

export default function WorksPage() {
  const all = getWorks();
  const works = all.slice(0, 24);
  return (
    <SiteFrame current="/works/">
      <PageHeading title="作品" note="把想法做成可以看见、可以使用的东西。" />
      <section data-work-list aria-label="作品列表">
        {works.length ? <WorkCards works={works} /> : <p data-index-empty className="empty-state">作品会陆续放在这里。先去随笔里逛逛吧。</p>}
        {all.length > works.length && <MoreLink href="/works/archive/">查看全部 {all.length} 件作品</MoreLink>}
        {works.length === 0 && <MoreLink href="/essays/">阅读随笔</MoreLink>}
      </section>
    </SiteFrame>
  );
}
