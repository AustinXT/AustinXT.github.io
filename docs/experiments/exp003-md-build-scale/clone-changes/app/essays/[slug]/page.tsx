import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MoreLink } from "@/components/more-link";
import { PageHeading } from "@/components/page-heading";
import { SiteFrame } from "@/components/site-frame";
import { getAllEssays, getEssay, readEssayHtml } from "@/lib/exp-content";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllEssays().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: getEssay(slug)?.title ?? slug };
}

export default async function EssayPage({ params }: Props) {
  const { slug } = await params;
  const meta = getEssay(slug);
  if (!meta) notFound();
  const html = readEssayHtml(slug);
  return (
    <SiteFrame current="/essays/">
      <div className="max-w-3xl">
        <PageHeading title={meta.title} note={meta.date} />
        <article data-essay-body dangerouslySetInnerHTML={{ __html: html }} />
        <MoreLink href="/essays/all/">返回全部文章</MoreLink>
      </div>
    </SiteFrame>
  );
}
