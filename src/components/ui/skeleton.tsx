import { cn } from "@/lib/utils";

// Phase 4.4.27 — the single shared building block every route-level
// loading.tsx composes from. Deliberately just one pulsing div: no new
// dependency, no client-side JavaScript (this and every loading.tsx that
// uses it render as plain Server Components — the animation is pure CSS
// via Tailwind's built-in `animate-pulse`, already used elsewhere in this
// codebase). `aria-hidden` since these are purely decorative placeholders;
// the "Loading" announcement for assistive tech lives on each
// loading.tsx's own `role="status"` wrapper, not on every individual block.
export default function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-light-gray", className)} aria-hidden="true" />;
}
