import { getEssays, getWorks, taxonomyPages, taxonomyHref, yearPages } from "@/lib/content";
import { getSiteConfig, xml } from "@/lib/site";
export const dynamic = "force-static";
export function GET() {
  const { url } = getSiteConfig();
  const essays = getEssays(), works = getWorks();
  const paths = ["/", "/essays/", "/essays/archive/", "/essays/categories/", "/essays/tags/", "/works/", "/works/archive/", "/about/",
    ...essays.map((entry) => `/essays/${entry.slug}/`), ...works.map((entry) => `/works/${entry.slug}/`),
    ...Array.from({ length: Math.max(0, Math.ceil(works.length / 24) - 1) }, (_, i) => `/works/archive/page/${i + 2}/`),
    ...yearPages(essays).map(({ year, page }) => `/essays/${year}/${page > 1 ? `page/${page}/` : ""}`),
    ...(["categories", "tags"] as const).flatMap((key) => taxonomyPages(essays, key).map(({ name, page }) => taxonomyHref(key, name, page))),
  ];
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${url ? paths.map((pathname) => `<url><loc>${xml(url + pathname)}</loc></url>`).join("") : ""}</urlset>`, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
