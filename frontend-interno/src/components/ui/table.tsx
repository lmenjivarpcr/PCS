import type { ComponentProps } from "react";
export function Table(props: ComponentProps<"table">) {
  return <table className="w-full text-left text-sm" {...props} />;
}
