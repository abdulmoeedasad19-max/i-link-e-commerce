import { SearchX } from "lucide-react";
import Container from "@/components/ui/container";
import Button from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center py-20 sm:py-24">
      <Container>
        <div className="mx-auto flex max-w-md flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-royal/10 text-royal">
            <SearchX className="h-8 w-8" aria-hidden="true" />
          </span>
          <h1 className="mt-6 text-2xl font-bold text-navy sm:text-3xl">Page Not Found</h1>
          <p className="mt-3 leading-relaxed text-slate">
            We couldn&apos;t find the page you were looking for. It may have moved, or the link
            may be incorrect.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button href="/" variant="primary" size="lg">
              Back to Home
            </Button>
            <Button href="/shop" variant="secondary" size="lg">
              Browse Shop
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
}
