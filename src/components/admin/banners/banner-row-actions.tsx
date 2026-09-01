"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, Pencil, Power, Trash2 } from "lucide-react";
import { deleteBanner, moveBanner, toggleBannerStatus } from "@/app/admin/banners/actions";

export default function BannerRowActions({
  id,
  title,
  isActive,
  isFirst,
  isLast,
}: {
  id: string;
  title: string;
  isActive: boolean;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    if (!window.confirm(`Delete banner "${title}"? This cannot be undone.`)) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteBanner(id);
      if (result?.error) setError(result.error);
    });
  };

  const handleToggle = () => {
    setError(null);
    startTransition(async () => {
      const result = await toggleBannerStatus(id, isActive);
      if (result?.error) setError(result.error);
    });
  };

  const handleMove = (direction: "up" | "down") => {
    setError(null);
    startTransition(async () => {
      const result = await moveBanner(id, direction);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center justify-end gap-1">
        <button
          type="button"
          onClick={() => handleMove("up")}
          disabled={isPending || isFirst}
          aria-label={`Move ${title} up`}
          title="Move up"
          className="rounded-lg p-2 text-slate transition-colors hover:bg-soft-gray hover:text-royal disabled:opacity-30"
        >
          <ArrowUp className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => handleMove("down")}
          disabled={isPending || isLast}
          aria-label={`Move ${title} down`}
          title="Move down"
          className="rounded-lg p-2 text-slate transition-colors hover:bg-soft-gray hover:text-royal disabled:opacity-30"
        >
          <ArrowDown className="h-4 w-4" aria-hidden="true" />
        </button>
        <Link
          href={`/admin/banners/${id}/edit`}
          aria-label={`Edit ${title}`}
          title="Edit"
          className="rounded-lg p-2 text-slate transition-colors hover:bg-soft-gray hover:text-royal"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
        </Link>
        <button
          type="button"
          onClick={handleToggle}
          disabled={isPending}
          aria-label={isActive ? `Deactivate ${title}` : `Activate ${title}`}
          title={isActive ? "Deactivate" : "Activate"}
          className="rounded-lg p-2 text-slate transition-colors hover:bg-soft-gray hover:text-royal disabled:opacity-50"
        >
          <Power className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          aria-label={`Delete ${title}`}
          title="Delete"
          className="rounded-lg p-2 text-slate transition-colors hover:bg-error/10 hover:text-error disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      {error && (
        <p role="alert" className="max-w-[220px] text-right text-xs font-medium text-error">
          {error}
        </p>
      )}
    </div>
  );
}
