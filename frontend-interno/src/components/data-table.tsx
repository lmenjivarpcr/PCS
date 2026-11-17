import type { ReactNode } from "react";
import { Message } from "./message";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { Table } from "./ui/table";
export interface Column<T> {
  title: string;
  cell: (item: T) => ReactNode;
}
export function DataTable<T extends { id: number }>({
  columns,
  data,
  loading,
  error,
  retry,
}: {
  columns: Column<T>[];
  data: T[];
  loading: boolean;
  error: string;
  retry: () => void;
}) {
  if (loading)
    return (
      <div
        role="status"
        aria-label="Cargando usuarios"
        className="space-y-3 p-4"
      >
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} />
        ))}
      </div>
    );
  if (error)
    return (
      <div className="space-y-3 p-4">
        <Message>{error}</Message>
        <Button variant="outline" onClick={retry}>
          Reintentar
        </Button>
      </div>
    );
  if (!data.length)
    return (
      <p role="status" className="p-12 text-center text-muted-foreground">
        No hay usuarios que coincidan con los filtros.
      </p>
    );
  return (
    <>
      <div className="hidden md:block">
        <Table>
          <thead className="bg-muted">
            <tr>
              {columns.map((c) => (
                <th key={c.title} scope="col" className="px-5 py-3 font-medium">
                  {c.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id} className="border-t">
                {columns.map((c) => (
                  <td key={c.title} className="px-5 py-4">
                    {c.cell(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
      <div className="divide-y md:hidden">
        {data.map((item) => (
          <article
            aria-label={`Usuario ${item.id}`}
            key={item.id}
            className="space-y-3 p-4"
          >
            {columns.map((c) => (
              <div key={c.title}>
                <p className="mb-1 text-xs text-muted-foreground">{c.title}</p>
                {c.cell(item)}
              </div>
            ))}
          </article>
        ))}
      </div>
    </>
  );
}
