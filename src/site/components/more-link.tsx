import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function MoreLink({ href, children }: { href: string; children: string }) {
  return (
    <Link href={href} className="mt-4 inline-flex items-center gap-2 text-sm">
      {children}<ArrowRight aria-hidden="true" size={16} />
    </Link>
  );
}
