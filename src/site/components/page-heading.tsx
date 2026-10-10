import type { ReactNode } from "react";

export function PageHeading({ title, note }: { title: string; note: ReactNode }) {
  return (
    <header className="mb-8">
      <h1 className="mb-3 text-3xl sm:text-4xl">{title}</h1>
      <p className="text-sm text-muted">{note}</p>
    </header>
  );
}
