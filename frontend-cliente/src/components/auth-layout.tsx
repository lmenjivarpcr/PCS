import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
export function AuthLayout({
  title,
  description,
  children,
  step,
}: {
  title: string;
  description: ReactNode;
  children: ReactNode;
  step?: string;
}) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center gap-3 px-6 py-6 sm:px-10">
        {/* Marcador provisional; reemplazar cuando se apruebe el logo. */}
        <span className="rounded-md border bg-card px-3 py-2 text-sm font-semibold tracking-widest">
          PCS
        </span>
        <span className="text-sm text-muted-foreground">
          Portal del cliente
        </span>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              {step && (
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  {step}
                </p>
              )}
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>{children}</CardContent>
          </Card>
          <p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-4" aria-hidden="true" />
            Acceso personal a tu espacio de trabajo
          </p>
        </div>
      </main>
      <footer className="px-6 py-6 text-center text-xs text-muted-foreground">
        PCS · Portal del cliente
      </footer>
    </div>
  );
}
