"use client";

// Admin Product Management upgrade — the Add Product form's own image
// upload, usable before the product exists. Each file uploads to local
// server storage immediately on selection/drop (via
// uploadStagedProductImage, which never touches the database), and the
// resulting URL is held in local state until the surrounding <form> is
// actually submitted, at which point one hidden <input name="imageUrls">
// per staged image carries the already-saved URLs to createProduct — no
// fake/draft product row is ever created just to get an id.
import { useRef, useState, useTransition, type DragEvent } from "react";
import { ArrowDown, ArrowUp, Loader2, Star, Trash2, UploadCloud } from "lucide-react";
import Button from "@/components/ui/button";
import { uploadStagedProductImage } from "@/app/admin/products/actions";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGES = 8;

type StagedImage = { url: string };

export default function ProductImageStagingUpload({ name = "imageUrls" }: { name?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [images, setImages] = useState<StagedImage[]>([]);
  const [error, setError] = useState<string | null>(null);

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);

    const files = Array.from(fileList);
    if (images.length + files.length > MAX_IMAGES) {
      setError(`A product can have at most ${MAX_IMAGES} images (${images.length} already added).`);
      return;
    }
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

    startTransition(async () => {
      try {
        for (const file of files) {
          const fileFormData = new FormData();
          fileFormData.append("file", file);
          const result = await uploadStagedProductImage(fileFormData);
          if ("error" in result) {
            setError(result.error);
            break;
          }
          setImages((prev) => [...prev, { url: result.url }]);
        }
      } catch (err) {
        // A thrown/rejected Server Action call — a network hiccup, a
        // transport-level failure, anything unexpected — must never
        // reach here uncaught: an unhandled error inside startTransition
        // bubbles straight to the nearest error boundary (this project's
        // own admin/error.tsx), crashing the whole Add Product page over
        // what should only ever be a recoverable "this upload failed"
        // state. Logged for diagnosis; never shown to the admin verbatim.
        console.error("[product-image-staging-upload] upload failed:", err);
        setError("Image upload failed. Please try again.");
      }
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  function removeImage(url: string) {
    setImages((prev) => prev.filter((img) => img.url !== url));
  }

  function moveImage(index: number, direction: "up" | "down") {
    setImages((prev) => {
      const swapIndex = direction === "up" ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
      return next;
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
        {/* Always present, never drag-only. */}
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

      {images.length > 0 && (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((img, index) => (
            <li key={img.url} className="group relative overflow-hidden rounded-xl border border-light-gray">
              {/* A plain <img>, matching the same choice already made for
                  admin-entered image paths elsewhere in this admin. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="aspect-square w-full object-cover" />
              {index === 0 && (
                <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-gold/90 px-2 py-0.5 text-[10px] font-semibold text-white">
                  <Star className="h-2.5 w-2.5 fill-current" aria-hidden="true" />
                  Primary
                </span>
              )}
              <button
                type="button"
                onClick={() => removeImage(img.url)}
                aria-label="Remove image"
                className="absolute right-1.5 top-1.5 rounded-full bg-white/90 p-1 text-error hover:bg-white"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => moveImage(index, "up")}
                  disabled={index === 0}
                  aria-label="Move image up (make more prominent)"
                  className="rounded p-1 text-white hover:bg-white/20 disabled:opacity-30"
                >
                  <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => moveImage(index, "down")}
                  disabled={index === images.length - 1}
                  aria-label="Move image down"
                  className="rounded p-1 text-white hover:bg-white/20 disabled:opacity-30"
                >
                  <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
              <input type="hidden" name={name} value={img.url} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
