import Link from "next/link";
import { SiteFrame } from "@/components/site-frame";
import { PageHeading } from "@/components/page-heading";
export default function NotFound() {
  return <SiteFrame current="/"><PageHeading title="这一页暂时不在这里" note="链接可能已更新，或内容尚未公开。" /><p className="empty-state">可以回到首页，或搜索一篇想读的文章。</p><div className="mt-8 flex gap-6"><Link href="/">返回首页</Link><Link href="/search/">搜索内容</Link></div></SiteFrame>;
}
