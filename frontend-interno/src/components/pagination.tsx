import { Button } from "./ui/button";
export function Pagination({
  page,
  last,
  total,
  onChange,
}: {
  page: number;
  last: number;
  total: number;
  onChange: (page: number) => void;
}) {
  const pages = [
    ...new Set([1, ...Array.from({ length: 5 }, (_, i) => page - 2 + i), last]),
  ]
    .filter((p) => p >= 1 && p <= last)
    .sort((a, b) => a - b);
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t p-4">
      <p
        role="status"
        aria-live="polite"
        className="text-sm text-muted-foreground"
      >
        {total} usuarios · Página {page} de {last}
      </p>
      <nav aria-label="Paginación" className="flex flex-wrap gap-1">
        <Button
          variant="outline"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Anterior
        </Button>
        {pages.map((p, i) => (
          <span key={p}>
            {i > 0 && p - pages[i - 1] > 1 && <span className="px-1">…</span>}
            <Button
              variant={p === page ? "default" : "outline"}
              aria-label={`Página ${p}`}
              aria-current={p === page ? "page" : undefined}
              onClick={() => onChange(p)}
            >
              {p}
            </Button>
          </span>
        ))}
        <Button
          variant="outline"
          disabled={page >= last}
          onClick={() => onChange(page + 1)}
        >
          Siguiente
        </Button>
      </nav>
    </div>
  );
}
