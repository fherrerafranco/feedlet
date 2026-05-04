import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all",
        "focus:outline-none focus:ring-2 focus:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        "active:scale-[0.98]",
        variant === "primary" &&
          "bg-primary-500 text-white shadow-md hover:bg-primary-600 focus:ring-primary-300",
        variant === "secondary" &&
          "bg-surface-200 text-gray-700 hover:bg-surface-300 focus:ring-surface-300",
        className,
      )}
      {...props}
    />
  );
}
