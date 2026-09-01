import type { ReactNode } from "react";

export function inputClass(hasError: boolean) {
  return [
    "w-full rounded-[10px] border bg-white px-4 py-2.5 text-sm text-dark-slate outline-none transition-colors",
    "focus:ring-2 focus:ring-royal/15",
    hasError ? "border-error focus:border-error" : "border-light-gray focus:border-royal",
  ].join(" ");
}

export function Field({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-navy">
        {label}
        {required && (
          <span className="ml-0.5 text-error" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <div className="mt-1.5">{children}</div>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs font-medium text-error">
          {error}
        </p>
      )}
    </div>
  );
}
