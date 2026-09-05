import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  baseHref: string;
};

export default function Pagination({ currentPage, totalPages, baseHref }: PaginationProps) {
  if (totalPages <= 1) return null;

  const prevPage = currentPage > 1 ? currentPage - 1 : null;
  const nextPage = currentPage < totalPages ? currentPage + 1 : null;

  // For a simple, professional UI: Always show Page 1, Last Page, and nearby pages.
  // We'll just generate the exact array of page numbers to display.
  const getVisiblePages = () => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, "ellipsis", totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, "ellipsis", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages);
      }
    }
    return pages;
  };

  const pages = getVisiblePages();

  return (
    <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Pagination">
      {prevPage ? (
        <Link
          href={`${baseHref}?page=${prevPage}`}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-light-gray bg-white text-slate transition-colors hover:bg-soft-gray hover:text-navy"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
      ) : (
        <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-light-gray bg-soft-gray opacity-50">
          <ChevronLeft className="h-5 w-5 text-light-gray" aria-hidden="true" />
        </span>
      )}

      {pages.map((p, i) => {
        if (p === "ellipsis") {
          return (
            <span key={`ellipsis-${i}`} className="flex h-10 w-10 items-center justify-center text-slate">
              &hellip;
            </span>
          );
        }

        const isCurrent = p === currentPage;
        return (
          <Link
            key={p}
            href={`${baseHref}?page=${p}`}
            aria-current={isCurrent ? "page" : undefined}
            className={`flex h-10 min-w-[2.5rem] items-center justify-center rounded-lg border px-3 text-sm font-medium transition-colors ${
              isCurrent
                ? "border-royal bg-royal text-white"
                : "border-light-gray bg-white text-slate hover:bg-soft-gray hover:text-navy"
            }`}
          >
            {p}
          </Link>
        );
      })}

      {nextPage ? (
        <Link
          href={`${baseHref}?page=${nextPage}`}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-light-gray bg-white text-slate transition-colors hover:bg-soft-gray hover:text-navy"
          aria-label="Next page"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </Link>
      ) : (
        <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-light-gray bg-soft-gray opacity-50">
          <ChevronRight className="h-5 w-5 text-light-gray" aria-hidden="true" />
        </span>
      )}
    </nav>
  );
}

