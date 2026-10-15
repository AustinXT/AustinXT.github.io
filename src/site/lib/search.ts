export type SearchEntry = { title: string; href: string; description: string; date: string; categories: string[]; tags: string[]; kind: "essay" | "work" };
export function normalizeSearch(value: string) { return value.normalize("NFKC").toLocaleLowerCase("zh-CN").replace(/\s+/g, " ").trim(); }
export function searchEntries(entries: SearchEntry[], query: string, kind = "all") {
  const normalized = normalizeSearch(query);
  const terms = normalized.split(" ").filter(Boolean);
  if (!terms.length) return [];
  return entries.filter((entry) => kind === "all" || entry.kind === kind).map((entry, index) => {
    const title = normalizeSearch(entry.title), labels = normalizeSearch([...entry.categories, ...entry.tags].join(" "));
    const haystack = normalizeSearch(`${entry.title} ${entry.description} ${labels}`);
    return { entry, index, match: terms.every((term) => haystack.includes(term)), score: (title.includes(normalized) ? 100 : 0) + terms.reduce((sum, term) => sum + (title.includes(term) ? 10 : 0) + (labels.includes(term) ? 5 : 0), 0) };
  }).filter(({ match }) => match).sort((a, b) => b.score - a.score || a.index - b.index).map(({ entry }) => entry);
}
