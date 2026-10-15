import Link from "next/link";
import { Search } from "lucide-react";

const items = [
  { href: "/", label: "首页" },
  { href: "/essays/", label: "随笔" },
  { href: "/works/", label: "作品" },
  { href: "/about/", label: "简介" },
] as const;

export type Section = (typeof items)[number]["href"];

export function SiteNav({ current }: { current: Section }) {
  return (
    <div className="site-nav-wrap">
      <nav id="main-menu" aria-label="主导航" className="site-nav">
        {items.map(({ href, label }) => (
          <Link key={href} href={href} aria-current={current === href ? "page" : undefined}>
            {label}
          </Link>
        ))}
      </nav>
      <Link href="/search/" className="site-search" aria-label="搜索文章与作品">
        <Search aria-hidden="true" size={17} strokeWidth={1.6} />
        <span className="search-label">搜索</span>
      </Link>
    </div>
  );
}
