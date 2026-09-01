"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Pencil, Power, Trash2 } from "lucide-react";
import type { ProductStatus } from "@/generated/prisma/enums";
import { deleteProduct, toggleProductStatus } from "@/app/admin/products/actions";

export default function ProductRowActions({
  id,
  name,
  status,
}: {
  id: string;
  name: string;
  status: ProductStatus;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteProduct(id);
      if (result?.error) setError(result.error);
    });
  };

  const handleToggle = () => {
    setError(null);
    startTransition(async () => {
      const result = await toggleProductStatus(id);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center justify-end gap-1">
        <Link
          href={`/admin/products/${id}/edit`}
          aria-label={`Edit ${name}`}
          title="Edit"
          className="rounded-lg p-2 text-slate transition-colors hover:bg-soft-gray hover:text-royal"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
        </Link>
        <button
          type="button"
          onClick={handleToggle}
          disabled={isPending}
          aria-label={status === "ACTIVE" ? `Deactivate ${name}` : `Activate ${name}`}
          title={status === "ACTIVE" ? "Deactivate" : "Activate"}
          className="rounded-lg p-2 text-slate transition-colors hover:bg-soft-gray hover:text-royal disabled:opacity-50"
        >
          <Power className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          aria-label={`Delete ${name}`}
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
