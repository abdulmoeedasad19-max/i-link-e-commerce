"use client";

// Admin Product Management upgrade. Fast client-side validation for
// immediate feedback (type/size) — the server independently re-validates
// everything in src/lib/storage/local-images.ts, which is the actual
// security boundary, not this component.
import { useRef, useState, useTransition, type DragEvent } from "react";
import { Loader2, UploadCloud } from "lucide-react";
import Button from "@/components/ui/button";
import { uploadProductImages } from "@/app/admin/products/[id]/edit/image-actions";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function ProductImageUpload({ productId }: { productId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);

    const files = Array.from(fileList);
    const invalidType = files.find((f) => !ACCEPTED_TYPES.includes(f.type));
    if (invalidType) {
      setError(`"${invalidType.name}" isn't a supported image type. Use JPG, PNG, or WebP.`);
      return;
    }
    const tooLarge = files.find((f) => f.size > MAX_FILE_SIZE);
    if (tooLarge) {
      setError(`"${tooLarge.name}" is larger than 5MB.`);
      return;
    }

    const formData = new FormData();
    for (const file of files) formData.append("files", file);

    startTransition(async () => {
      try {
        const result = await uploadProductImages(productId, formData);
        if (result?.error) setError(result.error);
      } catch (err) {
        // See product-image-staging-upload.tsx's identical catch block
        // for why this must never be allowed to reach the nearest error
        // boundary uncaught.
        console.error("[product-image-upload] upload failed:", err);
        setError("Image upload failed. Please try again.");
      }
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
          isDragging ? "border-royal bg-royal/5" : "border-light-gray bg-soft-gray"
        }`}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-royal/10 text-royal">
          {isPending ? (
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
          ) : (
            <UploadCloud className="h-6 w-6" aria-hidden="true" />
          )}
        </span>
        <div>
          <p className="text-sm font-semibold text-navy">
            {isPending ? "Uploading…" : "Drag & drop images here"}
          </p>
          <p className="mt-0.5 text-xs text-slate">JPG, PNG, or WebP — up to 5MB each</p>
        </div>
        {/* Always present, never drag-only — the accessible alternative to
            drag-and-drop, per this phase's own accessibility requirement. */}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
        >
          Choose from Laptop
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
          aria-label="Choose product images from your computer"
          disabled={isPending}
        />
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs font-medium text-error">
          {error}
        </p>
      )}
    </div>
  );
}
