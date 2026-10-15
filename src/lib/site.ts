import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { Metadata } from "next";

export type SiteConfig = {
  title: string;
  description: string;
  author: string;
  intro: string;
  url?: string;
  contact: { label: string; url: string }[];
};

function text(value: unknown, key: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`content/site.json：${key} 须为非空字符串`);
  return value.trim();
}

export function getSiteConfig(): SiteConfig {
  const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), "content/site.json"), "utf8"));
  const allowed = new Set(["title", "description", "author", "intro", "url", "contact"]);
  if (!data || typeof data !== "object" || Array.isArray(data) || Object.keys(data).some((key) => !allowed.has(key))) {
    throw new Error("content/site.json：配置须为对象，且不能含未知字段");
  }
  let url: string | undefined;
  if (data.url !== undefined && data.url !== "") {
    const parsed = new URL(text(data.url, "url"));
    if (!/^https?:$/.test(parsed.protocol) || parsed.username || parsed.password || parsed.pathname !== "/" || parsed.search || parsed.hash) {
      throw new Error("content/site.json：url 须为站点根地址，例如 https://blog.example.com");
    }
    url = parsed.origin;
  }
  if (!Array.isArray(data.contact)) throw new Error("content/site.json：contact 须为数组");
  const contact = data.contact.map((item: unknown) => {
    if (!item || typeof item !== "object" || !("label" in item) || !("url" in item) || Object.keys(item).some((key) => !["label", "url"].includes(key))) {
      throw new Error("content/site.json：联系方式须包含 label、url");
    }
    const label = text(item.label, "contact.label");
    const href = text(item.url, "contact.url");
    const parsed = new URL(href);
    if (!["https:", "http:", "mailto:"].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error("content/site.json：联系方式只支持 http(s) 或 mailto");
    return { label, url: href };
  });
  return { title: text(data.title, "title"), description: text(data.description, "description"), author: text(data.author, "author"), intro: text(data.intro, "intro"), url, contact };
}

export function getAboutPage() {
  const { data, content } = matter(fs.readFileSync(path.join(process.cwd(), "content/about.md"), "utf8"));
  if (Object.keys(data).some((key) => key !== "title") || typeof data.title !== "string" || !data.title.trim() || !content.trim()) {
    throw new Error("content/about.md：须有 title 和非空正文");
  }
  return { title: data.title.trim(), body: content };
}

// 域名只需在 content 配置一次；本地预览不会生成生产 canonical 或开放索引。
export function pageMetadata(title: string, pathname: string, description?: string): Metadata {
  const site = getSiteConfig();
  return {
    title,
    description: description || site.description,
    ...(site.url ? { alternates: { canonical: `${site.url}${pathname}` } } : {}),
    openGraph: {
      title: `${title} · ${site.title}`,
      description: description || site.description,
      siteName: site.title,
      locale: "zh_CN",
      type: "website",
      ...(site.url ? { url: `${site.url}${pathname}` } : {}),
    },
  };
}

export function xml(value: string) {
  return value.replace(/[<>&"']/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[char]!);
}
