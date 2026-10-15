import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export function MoreLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} prefetch={false} className="more-link">
      {children}<ArrowRight aria-hidden="true" size={16} />
    </Link>
  );
}
