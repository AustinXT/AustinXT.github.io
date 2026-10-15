import { getSiteConfig } from "@/lib/site";
export const dynamic = "force-static";
export function GET() {
  const { url } = getSiteConfig();
  return new Response(url ? `User-agent: *\nAllow: /\nDisallow: /search/\nSitemap: ${url}/sitemap.xml\n` : "User-agent: *\nDisallow: /\n", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
