import type { Metadata } from "next";
import Container from "@/components/ui/container";
import SectionHeading from "@/components/ui/section-heading";
import ProductCard from "@/components/sections/product-card";
import { getAllProducts } from "@/lib/products-repository";

export const metadata: Metadata = {
  title: "Shop All Products",
  description:
    "Browse genuine laptops, gaming PCs, networking gear, CCTV, storage, RAM and peripherals — all backed by official warranty, from i.Link Systems & Solutions.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage() {
  const products = await getAllProducts();

  return (
    <div className="py-20 sm:py-24">
      <Container>
        <SectionHeading
          as="h1"
          eyebrow="Full Catalog"
          title="Shop All Products"
          description="Browse our full range of genuine, warranty-backed technology products across every category."
        />

        <div className="mt-12 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} priority={index < 4} />
          ))}
        </div>
      </Container>
    </div>
  );
}
