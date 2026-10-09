import Link from "next/link";
import type { ReactNode } from "react";
import { SiteNav, type Section } from "./site-nav";

export function SiteFrame({ current, children }: { current: Section; children: ReactNode }) {
  return (
    <>
      <a href="#main-content" className="skip-link">跳到内容</a>
      <div className="border-b border-line py-4 text-xs text-muted">
        <p data-site-notice className="shell">工程预览 · 内容与排版待确认 · 未公开发布</p>
      </div>
      <div className="shell">
        <header className="flex flex-wrap items-baseline justify-between gap-6 border-b border-line py-8">
          <Link href="/" className="font-serif text-2xl tracking-wide no-underline">智能时代蛮子</Link>
          <SiteNav current={current} />
        </header>
        <main id="main-content" className="py-8 sm:py-10">{children}</main>
        <footer className="mt-10 border-t border-line py-6 text-xs text-muted">
          本地工程壳 · 不代表正文、人审或上线通过
        </footer>
      </div>
    </>
  );
}
