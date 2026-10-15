import { Search } from "@/components/search";
import { SiteFrame } from "@/components/site-frame";
import { PageHeading } from "@/components/page-heading";
import { pageMetadata } from "@/lib/site";
export const metadata = { ...pageMetadata("搜索", "/search/"), robots: { index: false, follow: true } };
export default function SearchPage() { return <SiteFrame current="/essays/"><PageHeading title="搜索" note="找一篇随笔，也发现一个值得探索的作品。" /><Search /></SiteFrame>; }
