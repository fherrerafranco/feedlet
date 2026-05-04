import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  suffix?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, suffix, className, id, type, ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
    const isNumber = type === "number";

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            type={isNumber ? "text" : type}
            inputMode={isNumber ? "decimal" : undefined}
            className={cn(
              "w-full rounded-xl border border-surface-300 bg-surface-50 px-4 py-2.5 text-sm transition-all duration-200",
              "placeholder:text-gray-400",
              "focus:border-primary-400 focus:ring-2 focus:ring-primary-100 focus:outline-none",
              error && "border-danger-500 focus:border-danger-500 focus:ring-red-100",
              suffix && "pr-12",
              className,
            )}
            {...props}
          />
          {suffix && (
            <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm text-gray-400">
              {suffix}
            </span>
          )}
        </div>
        {error && <p className="text-xs text-danger-500">{error}</p>}
        {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
