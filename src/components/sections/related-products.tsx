import "server-only";
import { getRelatedProducts } from "@/lib/products-repository";
import ProductCard from "@/components/sections/product-card";

type RelatedProductsProps = {
  productId: string;
  categoryId: string;
  brandId: string;
};

export default async function RelatedProducts({ productId, categoryId, brandId }: RelatedProductsProps) {
  const related = await getRelatedProducts(productId, categoryId, brandId, 4);

  if (related.length === 0) {
    return null;
  }

  return (
    <section className="mt-20 border-t border-light-gray pt-16" aria-labelledby="related-products-heading">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="related-products-heading" className="text-2xl font-bold text-navy">
            Related Products
          </h2>
          <p className="mt-2 text-sm text-slate">
            Explore more products you may be interested in.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
        {related.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

