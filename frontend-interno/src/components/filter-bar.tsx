import type { ReactNode } from "react";
export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <div
      role="search"
      aria-label="Filtros de usuarios"
      className="flex flex-wrap items-end gap-4 rounded-lg border bg-card p-4"
    >
      {children}
    </div>
  );
}
