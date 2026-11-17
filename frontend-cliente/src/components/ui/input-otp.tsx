import { useContext, type ComponentProps } from "react";
import { OTPInput, OTPInputContext } from "input-otp";
import { cn } from "@/lib/utils";
export function InputOTP({
  className,
  containerClassName,
  ...props
}: ComponentProps<typeof OTPInput>) {
  return (
    <OTPInput
      containerClassName={cn(
        "flex items-center gap-2 has-disabled:opacity-50",
        containerClassName,
      )}
      className={cn("disabled:cursor-not-allowed", className)}
      {...props}
    />
  );
}
export function InputOTPGroup({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("flex items-center gap-1.5 sm:gap-2", className)}
      {...props}
    />
  );
}
export function InputOTPSlot({
  index,
  className,
  ...props
}: ComponentProps<"div"> & { index: number }) {
  const context = useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } = context.slots[index];
  return (
    <div
      className={cn(
        "relative flex h-12 w-9 sm:w-10 items-center justify-center rounded-md border border-input text-lg shadow-xs",
        isActive && "z-10 border-ring ring-2 ring-ring/40",
        className,
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-5 w-px bg-foreground" />
        </div>
      )}
    </div>
  );
}
