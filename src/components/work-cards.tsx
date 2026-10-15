import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { excerpt, type Work } from "@/lib/content";

export function WorkCards({ works, compact = false }: { works: Work[]; compact?: boolean }) {
  const Heading = compact ? "h3" : "h2";
  return (
    <ul className="work-grid">
      {works.map((work) => {
        const detailHref = `/works/${work.slug}/`;
        return (
          <li key={work.slug} data-work={detailHref}>
            <div className="work-card">
              <span className="work-card-top">
                <time dateTime={work.date}>{compact ? work.date.slice(0, 4) : work.date}</time>
                <ArrowUpRight aria-hidden="true" size={19} />
              </span>
              <Heading data-index-title><a href={work.externalUrl || detailHref}>{work.title}</a></Heading>
              <p>{excerpt(work, compact ? 100 : 140)}</p>
              {!compact && work.categories.length > 0 && <span className="work-card-category">{work.categories.join(" · ")}</span>}
              <Link className="work-details" href={detailHref} prefetch={false}>了解作品 →</Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
