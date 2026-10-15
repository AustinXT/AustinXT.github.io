"use client";
import Link from "next/link";
import { useDeferredValue, useEffect, useState, useSyncExternalStore } from "react";
import { searchEntries, type SearchEntry } from "@/lib/search";

function subscribe(callback: () => void) {
  window.addEventListener("popstate", callback);
  window.addEventListener("blog-search-change", callback);
  return () => { window.removeEventListener("popstate", callback); window.removeEventListener("blog-search-change", callback); };
}
const currentQuery = () => new URLSearchParams(window.location.search).get("q")?.slice(0, 120) || "";

export function Search() {
  const query = useSyncExternalStore(subscribe, currentQuery, () => "");
  const [kind, setKind] = useState("all");
  const [entries, setEntries] = useState<SearchEntry[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const [limit, setLimit] = useState(20);
  const deferred = useDeferredValue(query);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/search-index.json", { signal: controller.signal }).then((response) => { if (!response.ok) throw new Error("加载失败"); return response.json(); }).then((data) => { if (!Array.isArray(data)) throw new Error("索引格式错误"); setEntries(data); setState("ready"); }).catch((error) => { if (error.name !== "AbortError") setState("error"); });
    return () => controller.abort();
  }, [attempt]);
  const results = searchEntries(entries, deferred, kind);
  function change(value: string) {
    setLimit(20);
    const url = new URL(window.location.href);
    if (value.trim()) url.searchParams.set("q", value); else url.searchParams.delete("q");
    window.history.replaceState(null, "", url);
    window.dispatchEvent(new Event("blog-search-change"));
  }
  return <div className="search-page">
    <form role="search" action="/search/" method="get" onSubmit={(event) => event.preventDefault()}>
      <label htmlFor="search-query" className="mb-2 block text-sm">搜索标题、摘要、专栏与专题</label>
      <div className="flex flex-wrap gap-3"><input id="search-query" className="search-input min-w-0 flex-1" type="search" name="q" maxLength={120} placeholder="输入关键词，例如：卡片、写作" value={query} onChange={(event) => change(event.target.value)} autoComplete="off" />
        <label className="sr-only" htmlFor="search-kind">内容类型</label><select id="search-kind" className="search-select" value={kind} onChange={(event) => { setKind(event.target.value); setLimit(20); }}><option value="all">全部内容</option><option value="essay">随笔</option><option value="work">作品</option></select></div>
    </form>
    <p className="mt-4 text-sm text-muted" role="status" aria-live="polite">{state === "loading" ? "正在加载搜索索引…" : state === "error" ? "搜索索引暂时无法加载。" : query.trim() ? `找到 ${results.length} 条结果` : "输入关键词开始搜索，多个词用空格分隔。"}</p>
    {state === "error" && <button className="mt-3 underline" type="button" onClick={() => { setState("loading"); setAttempt(attempt + 1); }}>重新加载</button>}
    {state === "ready" && query.trim() && results.length === 0 && <p className="empty-state mt-6">没有找到匹配内容。试试更短的关键词，或浏览<Link href="/essays/">随笔目录</Link>。</p>}
    <ul className="search-results">{results.slice(0, limit).map((entry) => <li className="search-result" key={entry.href}><span className="text-xs text-muted">{entry.kind === "essay" ? "随笔" : "作品"} · {entry.date}</span><h2><Link href={entry.href} prefetch={false}>{entry.title}</Link></h2><p>{entry.description}</p><p className="mt-2 text-xs text-muted">{[...entry.categories, ...entry.tags].join(" · ")}</p></li>)}</ul>
    {results.length > limit && <button className="mt-6 underline" type="button" onClick={() => setLimit(limit + 20)}>再显示 20 条</button>}
    <noscript><p className="empty-state mt-6">搜索需要启用 JavaScript。你也可以按<Link href="/essays/archive/">年份归档</Link>浏览文章。</p></noscript>
  </div>;
}
