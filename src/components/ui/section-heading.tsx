import { cn } from "@/lib/utils";
import FadeIn from "@/components/ui/fade-in";

export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
  as: Heading = "h2",
  headingId,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  className?: string;
  as?: "h2" | "h1";
  headingId?: string;
}) {
  return (
    <FadeIn
      className={cn(
        "max-w-2xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        className,
      )}
    >
      {eyebrow ? (
        <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-royal">
          <span className="h-1.5 w-1.5 rounded-full bg-royal" aria-hidden="true" />
          {eyebrow}
        </span>
      ) : null}
      <Heading
        id={headingId}
        className="mt-3 text-balance text-3xl font-bold tracking-tight text-navy sm:text-4xl"
      >
        {title}
      </Heading>
      {description ? (
        <p className="mt-4 text-balance text-base leading-relaxed text-slate sm:text-lg">
          {description}
        </p>
      ) : null}
    </FadeIn>
  );
}
