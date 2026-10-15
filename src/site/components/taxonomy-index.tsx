import Link from "next/link";
import { PageHeading } from "./page-heading";
import { MoreLink } from "./more-link";
import { SiteFrame } from "./site-frame";
import { getEssays, taxonomyTerms, taxonomyHref } from "@/lib/content";

export function TaxonomyIndex({ kind }: { kind: "categories" | "tags" }) {
  const terms = taxonomyTerms(getEssays(), kind);
  const title = kind === "categories" ? "全部专栏" : "全部专题";
  return <SiteFrame current="/essays/"><PageHeading title={title} note={kind === "categories" ? "按写作方向阅读，在同一个问题上持续积累。" : "循着关键词，发现文章之间的联系。"} />
    {terms.length ? <ul className="taxonomy-grid">{terms.map(({ name, count }) => <li key={name}><Link href={taxonomyHref(kind, name)} prefetch={false}>{kind === "tags" ? "# " : ""}{name}<span>{count} 篇</span></Link></li>)}</ul> : <p data-index-empty className="empty-state">这里还没有{kind === "categories" ? "专栏" : "专题"}。也可以按年份浏览已公开的随笔。</p>}
    <MoreLink href="/essays/">返回随笔</MoreLink></SiteFrame>;
}
