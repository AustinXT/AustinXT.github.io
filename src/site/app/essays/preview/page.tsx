import type { Metadata } from "next";
import { MoreLink } from "@/components/more-link";
import { PageHeading } from "@/components/page-heading";
import { SiteFrame } from "@/components/site-frame";

export const metadata: Metadata = { title: "文章工程占位" };

export default function ArticlePreviewPage() {
  return (
    <SiteFrame current="/essays/">
      <article data-article-preview className="max-w-3xl">
        <PageHeading title="文章工程占位" note="这是路由与返回入口验证，不是整理后的文章，也不是冻结的生产地址。" />
        <p className="pending">尚未迁入正文；原型中的排版样本留在定标原件，不复制成第二份文章。</p>
        <MoreLink href="/essays/">返回随笔</MoreLink>
      </article>
    </SiteFrame>
  );
}
