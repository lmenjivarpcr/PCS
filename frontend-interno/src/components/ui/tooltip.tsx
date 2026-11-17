import type { ReactNode } from "react";
import * as Primitive from "@radix-ui/react-tooltip";
export function Tooltip({
  children,
  text,
}: {
  children: ReactNode;
  text: string;
}) {
  return (
    <Primitive.Provider>
      <Primitive.Root>
        <Primitive.Trigger asChild>{children}</Primitive.Trigger>
        <Primitive.Portal>
          <Primitive.Content
            sideOffset={6}
            className="z-50 rounded bg-primary px-3 py-2 text-xs text-primary-foreground"
          >
            {text}
          </Primitive.Content>
        </Primitive.Portal>
      </Primitive.Root>
    </Primitive.Provider>
  );
}
