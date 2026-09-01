import type { ReactNode } from "react";
import Container from "@/components/ui/container";
import SectionHeading from "@/components/ui/section-heading";

/**
 * Shared layout for the informational/policy pages added in Phase 4.4.21
 * (privacy, terms, warranty, refunds, returns, shipping, support, etc.).
 * Typography classes are copied verbatim from RichText (the blog article
 * prose renderer) so these pages share the same visual language without
 * pulling in the blog's ContentBlock data model, which doesn't fit
 * non-article content.
 */
export default function PolicyPage({
  eyebrow,
  title,
  description,
  lastUpdated,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  lastUpdated?: string;
  children: ReactNode;
}) {
  return (
    <div className="py-16 sm:py-20">
      <Container>
        <SectionHeading
          as="h1"
          eyebrow={eyebrow}
          title={title}
          description={description}
          align="left"
          className="mx-0 max-w-3xl text-left"
        />
        {lastUpdated && (
          <p className="mt-4 max-w-3xl text-xs font-medium text-slate">Last updated: {lastUpdated}</p>
        )}
        <article className="mx-0 mt-10 max-w-3xl">{children}</article>
      </Container>
    </div>
  );
}

export function PolicyH2({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2 id={id} className="mt-10 text-xl font-bold text-navy first:mt-0 sm:text-2xl">
      {children}
    </h2>
  );
}

export function PolicyH3({ children }: { children: ReactNode }) {
  return <h3 className="mt-6 text-lg font-bold text-navy">{children}</h3>;
}

export function PolicyP({ children }: { children: ReactNode }) {
  return <p className="mt-4 leading-relaxed text-dark-slate">{children}</p>;
}

export function PolicyList({ children }: { children: ReactNode }) {
  return <ul className="mt-4 list-disc space-y-2 pl-5 leading-relaxed text-dark-slate">{children}</ul>;
}
