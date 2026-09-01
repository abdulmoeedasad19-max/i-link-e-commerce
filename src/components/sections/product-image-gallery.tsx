"use client";

// Customer Product Page redesign. The product detail page already
// resolved and sorted every ProductImage row (primary first, then
// sortOrder) for its JSON-LD `image` array — this is that same data,
// finally actually rendered, not a new data source. Thumbnails only
// appear when a product genuinely has more than one image; a
// single-image product (still the common case) renders exactly as
// before, just at the new 3:4 ratio.
import { useState } from "react";
import Image from "next/image";

export type GalleryImage = { url: string; altText: string | null };

export default function ProductImageGallery({
  images,
  productName,
  inStock,
}: {
  images: GalleryImage[];
  productName: string;
  inStock: boolean;
}) {
  const [selected, setSelected] = useState(0);
  const active = images[selected] ?? images[0];

  return (
    <div>
      {/* The one ratio this redesign must never change — see the phase
          report for why this is a real change from the previous
          aspect-square, not a preservation of it. */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-light-gray bg-soft-gray">
        <Image
          src={active.url}
          alt={active.altText || (selected === 0 ? productName : `${productName} - View ${selected + 1}`)}
          fill
          priority
          quality={85}
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
        {!inStock && (
          <span className="absolute left-4 top-4 rounded-full bg-navy/80 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
            Out of Stock
          </span>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2.5 sm:grid-cols-6">
          {images.map((img, index) => (
            <button
              key={`${img.url}-${index}`}
              type="button"
              onClick={() => setSelected(index)}
              aria-label={`Show product image ${index + 1} of ${images.length}`}
              aria-current={selected === index}
              className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-colors ${
                selected === index ? "border-royal" : "border-light-gray hover:border-royal/40"
              }`}
            >
              <Image src={img.url} alt={img.altText || (index === 0 ? productName : `${productName} - View ${index + 1}`)} fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
