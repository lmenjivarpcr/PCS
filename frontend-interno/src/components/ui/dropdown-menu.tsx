import type { ReactNode } from "react";
import * as Primitive from "@radix-ui/react-dropdown-menu";
export function DropdownMenu({
  trigger,
  children,
}: {
  trigger: ReactNode;
  children: ReactNode;
}) {
  return (
    <Primitive.Root>
      <Primitive.Trigger asChild>{trigger}</Primitive.Trigger>
      <Primitive.Portal>
        <Primitive.Content
          align="end"
          sideOffset={8}
          className="z-30 min-w-56 rounded-md border bg-card p-4 text-sm shadow-lg"
        >
          {children}
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
