import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
export function Alert({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "rounded-lg border bg-muted p-4 text-sm leading-6",
        className,
      )}
      {...props}
    />
  );
}
