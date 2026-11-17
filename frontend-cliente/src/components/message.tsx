import { Alert } from "@/components/ui/alert";
export function Message({ children }: { children?: string }) {
  return children ? <Alert>{children}</Alert> : null;
}
