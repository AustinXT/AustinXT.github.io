import Link from "next/link";
import type { ReactNode } from "react";
import { getSiteConfig } from "@/lib/site";
import { SiteNav, type Section } from "./site-nav";

export function SiteFrame({ current, children }: { current: Section; children: ReactNode }) {
  const site = getSiteConfig();
  return (
    <>
      <a href="#main-content" className="skip-link">跳到内容</a>
      <div className="shell">
        <header className="site-header">
          <Link href="/" className="site-brand">{site.title}</Link>
          <SiteNav current={current} />
        </header>
        <main id="main-content" className="site-main">{children}</main>
        <footer className="site-footer">
          <div className="footer-about">
            <p className="footer-title">{site.title}</p>
            <p>{site.description}</p>
          </div>
          <div className="footer-links">
            <Link href="/about/">关于本站</Link>
            {site.url && <a href="/feed.xml">RSS 订阅</a>}
            <span>© {new Date().getFullYear()} {site.author}</span>
          </div>
        </footer>
      </div>
    </>
  );
}
