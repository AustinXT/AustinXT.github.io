import { getEssays, getWorks, excerpt } from "@/lib/content";
export const dynamic = "force-static";
export function GET() {
  const entry = (item: ReturnType<typeof getEssays>[number], kind: "essay" | "work") => ({ title: item.title, href: `/${kind === "essay" ? "essays" : "works"}/${item.slug}/`, description: excerpt(item, 240), date: item.date, categories: item.categories, tags: item.tags, kind });
  return Response.json([...getEssays().map((item) => entry(item, "essay")), ...getWorks().map((item) => entry(item, "work"))]);
}
