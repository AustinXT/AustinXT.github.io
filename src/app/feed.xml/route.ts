import { getEssays, excerpt } from "@/lib/content";
import { getSiteConfig, xml } from "@/lib/site";
export const dynamic = "force-static";
export function GET() {
  const site = getSiteConfig();
  if (!site.url) return new Response(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${xml(site.title)} · 本地预览</title><link>about:blank</link><description>在 content/site.json 设置正式 url 后启用订阅。</description></channel></rss>`, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
  const origin = site.url;
  const items = getEssays().slice(0, 50).map((essay) => `<item><title>${xml(essay.title)}</title><link>${xml(`${origin}/essays/${essay.slug}/`)}</link><guid isPermaLink="true">${xml(`${origin}/essays/${essay.slug}/`)}</guid><pubDate>${new Date(`${essay.date}T00:00:00Z`).toUTCString()}</pubDate><description>${xml(excerpt(essay, 500))}</description>${[...essay.categories, ...essay.tags].map((term) => `<category>${xml(term)}</category>`).join("")}</item>`).join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${xml(site.title)}</title><link>${xml(origin)}/</link><description>${xml(site.description)}</description><language>zh-CN</language><atom:link href="${xml(origin)}/feed.xml" rel="self" type="application/rss+xml"/>${items}</channel></rss>`, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
