import { cn } from "@/lib/utils";

export default function Badge({
  className,
  children,
  variant = "royal",
}: {
  className?: string;
  children: React.ReactNode;
  variant?: "royal" | "navy" | "success" | "gold" | "error";
}) {
  const variants: Record<string, string> = {
    royal: "bg-royal/10 text-royal",
    navy: "bg-navy/5 text-navy",
    success: "bg-success/10 text-success",
    gold: "bg-gold/10 text-[#b5760f]",
    error: "bg-error/10 text-error",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
