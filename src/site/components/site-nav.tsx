import Link from "next/link";

const items = [
  { href: "/", label: "首页" },
  { href: "/essays/", label: "随笔" },
  { href: "/works/", label: "作品" },
  { href: "/about/", label: "简介" },
] as const;

export type Section = (typeof items)[number]["href"];

export function SiteNav({ current }: { current: Section }) {
  return (
    <nav id="main-menu" aria-label="主导航" className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
      {items.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          aria-current={current === href ? "page" : undefined}
          className={current === href ? "text-ink underline" : "text-muted no-underline"}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
