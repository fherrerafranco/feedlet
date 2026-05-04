import { Baby } from "lucide-react";

export function Header() {
  return (
    <header className="flex flex-col items-center gap-2 py-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 shadow-sm">
        <Baby className="h-7 w-7 text-primary-500" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">
        Feedlet
      </h1>
      <p className="text-sm text-gray-500">
        Baby feeding schedule calculator
      </p>
    </header>
  );
}
