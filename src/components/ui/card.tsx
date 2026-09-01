import { cn } from "@/lib/utils";

export default function Card({
  className,
  children,
  hover = true,
}: {
  className?: string;
  children: React.ReactNode;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-light-gray bg-white p-6 premium-shadow transition-all duration-300 ease-out",
        hover &&
          "hover:-translate-y-1.5 hover:border-royal/30 hover:shadow-[0_1px_2px_rgba(15,23,42,0.06),0_20px_40px_-16px_rgba(29,78,216,0.28)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
