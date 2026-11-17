import type { ReactNode } from "react";
import * as Primitive from "@radix-ui/react-dialog";
import { useRef } from "react";
import { X } from "lucide-react";
import { Button } from "./button";
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const returnFocus = useRef<HTMLElement | null>(null);
  return (
    <Primitive.Root open={open} onOpenChange={onOpenChange}>
      <Primitive.Portal>
        <Primitive.Overlay className="fixed inset-0 z-40 bg-foreground/40" />
        <Primitive.Content
          onOpenAutoFocus={() => {
            returnFocus.current =
              document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;
          }}
          onCloseAutoFocus={(event) => {
            if (returnFocus.current?.isConnected) {
              event.preventDefault();
              returnFocus.current.focus();
            }
          }}
          className="fixed left-1/2 top-1/2 z-50 max-h-[90svh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border bg-card p-6 shadow-xl"
        >
          <Primitive.Title className="pr-10 text-xl font-semibold">
            {title}
          </Primitive.Title>
          <Primitive.Description className="mb-6 mt-2 text-sm text-muted-foreground">
            {description}
          </Primitive.Description>
          <Primitive.Close asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Cerrar diálogo"
              className="absolute right-3 top-3"
            >
              <X />
            </Button>
          </Primitive.Close>
          {children}
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
