import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getSiteConfig } from "@/lib/site";
import "./globals.css";

export function generateMetadata(): Metadata {
  const site = getSiteConfig();
  return {
    title: { default: site.title, template: `%s · ${site.title}` },
    description: site.description,
    authors: [{ name: site.author }],
    applicationName: site.title,
    ...(site.url ? { metadataBase: new URL(site.url) } : {}),
    robots: { index: Boolean(site.url), follow: Boolean(site.url) },
    ...(site.url ? { alternates: { types: { "application/rss+xml": `${site.url}/feed.xml` } } } : {}),
    icons: { icon: "/icon.svg" },
    twitter: { card: "summary" },
  };
}
export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
