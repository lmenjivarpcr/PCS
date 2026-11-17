import { useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function FormField({
  id,
  label,
  error,
  type,
  ...props
}: ComponentProps<"input"> & { id: string; label: string; error?: string }) {
  const [visible, setVisible] = useState(false);
  const password = type === "password";
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          {...props}
          id={id}
          type={password && visible ? "text" : type}
          className={password ? "pr-12" : undefined}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        {password && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0.5 top-0.5"
            aria-label={
              visible
                ? `Ocultar ${label.toLowerCase()}`
                : `Mostrar ${label.toLowerCase()}`
            }
            aria-pressed={visible}
            onClick={() => setVisible(!visible)}
          >
            {visible ? (
              <EyeOff aria-hidden="true" />
            ) : (
              <Eye aria-hidden="true" />
            )}
          </Button>
        )}
      </div>
      <p
        id={`${id}-error`}
        aria-live="polite"
        className="text-sm text-destructive"
      >
        {error}
      </p>
    </div>
  );
}
