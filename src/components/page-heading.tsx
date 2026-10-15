import type { ReactNode } from "react";

export function PageHeading({ title, note }: { title: string; note?: ReactNode }) {
  return (
    <header className="page-heading">
      <h1>{title}</h1>
      {note && <p className="page-note">{note}</p>}
    </header>
  );
}
