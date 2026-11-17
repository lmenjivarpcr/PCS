import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
export function Alert({
  className,
  variant = "default",
  ...props
}: ComponentProps<"div"> & { variant?: "default" | "destructive" }) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "rounded-lg border p-4 text-sm leading-6",
        variant === "destructive"
          ? "border-destructive/40 bg-destructive/5 text-destructive"
          : "bg-muted",
        className,
      )}
      {...props}
    />
  );
}
