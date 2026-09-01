// Phase 4.2.2 — seeds the Category/Brand/Product/ProductImage tables from
// src/lib/products.ts and src/lib/site-config.ts, which remain the
// storefront's source of truth until a later phase switches reads to the database.
//
// Run with:
//   node --env-file=.env --import ./prisma/seed-register.mjs prisma/seed.ts
//
// Deterministic and idempotent: every write is an upsert keyed on a stable
// unique field (Category.slug, Brand.slug, Product.id), and each product's
// images are replaced (deleteMany + createMany) rather than
// blindly appended, so running this twice produces the same row counts.
// Never touches User, Account, Session, Address, CartItem, WishlistItem,
// Order, or OrderItem.
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { getAllProducts } from "@/lib/products";
import { categories as staticCategories } from "@/lib/site-config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

// Phase 4.4.24 — this used to be site-config.ts's exported `brandLogos`
// array, removed once the live storefront switched to reading
// Brand.logoUrl from the database (src/lib/brands-repository.ts). This
// script is a one-time/idempotent bootstrapping tool, never a live page
// path, so it's appropriate for it to keep its own local copy of the
// name -> logo-asset-slug mapping rather than depend on a storefront
// export that no longer exists.
const KNOWN_BRAND_LOGOS: { name: string; slug: string }[] = [
  { name: "HP", slug: "hp" },
  { name: "Dell", slug: "dell" },
  { name: "Lenovo", slug: "lenovo" },
  { name: "Apple", slug: "apple" },
  { name: "ASUS", slug: "asus" },
  { name: "Acer", slug: "acer" },
  { name: "MSI", slug: "msi" },
  { name: "Intel", slug: "intel" },
  { name: "AMD", slug: "amd" },
  { name: "NVIDIA", slug: "nvidia" },
  { name: "Samsung", slug: "samsung" },
  { name: "Kingston", slug: "kingston" },
  { name: "Corsair", slug: "corsair" },
  { name: "Western Digital", slug: "westerndigital" },
  { name: "Seagate", slug: "seagate" },
  { name: "Canon", slug: "canon" },
  { name: "Epson", slug: "epson" },
  { name: "Brother", slug: "brother" },
  { name: "Logitech", slug: "logitech" },
  { name: "Razer", slug: "razer" },
  { name: "HyperX", slug: "hyperx" },
  { name: "TP-Link", slug: "tplink" },
  { name: "Ubiquiti", slug: "ubiquiti" },
  { name: "MikroTik", slug: "mikrotik" },
  { name: "Cisco", slug: "cisco" },
  { name: "Hikvision", slug: "hikvision" },
  { name: "Dahua", slug: "dahua" },
  { name: "BenQ", slug: "benq" },
  { name: "ViewSonic", slug: "viewsonic" },
  { name: "Gigabyte", slug: "gigabyte" },
  { name: "ASRock", slug: "asrock" },
  { name: "Zotac", slug: "zotac" },
  { name: "Cooler Master", slug: "coolermaster" },
  { name: "Synology", slug: "synology" },
  { name: "QNAP", slug: "qnap" },
];

// Mirrors the exact derivation in src/lib/products.ts's defineProducts(),
// so Category.slug always matches the categorySlug already on every
// static Product and every /shop/[category] URL.
function categorySlugFromHref(href: string): string {
  return href.replace(/^\/shop\//, "");
}

// Matches the slug convention already used by KNOWN_BRAND_LOGOS above
// (e.g. "TP-Link" -> "tplink", "Cooler Master" -> "coolermaster"): lowercase,
// alphanumeric only, no separators.
function deterministicBrandSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function main() {
  const products = getAllProducts();

  // --- Categories: seeded 1:1 from site-config.ts's `categories` array,
  // the same flat list src/lib/products.ts validates every product against.
  // No hierarchy or sortOrder data exists in that array, so parentId stays
  // null for all rows and sortOrder uses the array's existing index.
  const categoryIdBySlug = new Map<string, string>();
  for (const [index, cat] of staticCategories.entries()) {
    const slug = categorySlugFromHref(cat.href);
    const row = await db.category.upsert({
      where: { slug },
      create: {
        name: cat.name,
        slug,
        description: cat.description,
        image: cat.image,
        icon: cat.icon,
        tier: cat.tier.toUpperCase() as "FEATURED" | "SECONDARY" | "COMPACT",
        sortOrder: index,
        parentId: null,
      },
      update: {
        name: cat.name,
        description: cat.description,
        image: cat.image,
        icon: cat.icon,
        tier: cat.tier.toUpperCase() as "FEATURED" | "SECONDARY" | "COMPACT",
        sortOrder: index,
      },
    });
    categoryIdBySlug.set(slug, row.id);
  }

  // --- Brands: only brand names actually present on a product in
  // src/lib/products.ts are created (NOT the full 42-entry site-config.ts
  // `brands` list, which includes brands with zero products). Slug is
  // taken from KNOWN_BRAND_LOGOS when an exact name match exists there;
  // otherwise a deterministic slug is generated and checked for collisions.
  const distinctBrandNames = [...new Set(products.map((p) => p.brand))];
  const usedSlugs = new Set<string>();
  const brandIdByName = new Map<string, string>();

  for (const name of distinctBrandNames) {
    const known = KNOWN_BRAND_LOGOS.find((b) => b.name === name);
    const slug = known?.slug ?? deterministicBrandSlug(name);

    if (usedSlugs.has(slug)) {
      throw new Error(`Brand slug collision for "${name}" -> "${slug}". Seed stopped.`);
    }
    usedSlugs.add(slug);

    const logoUrl = known ? `/brands/${known.slug}.svg` : null;

    const row = await db.brand.upsert({
      where: { slug },
      create: { name, slug, logoUrl },
      update: { name, logoUrl },
    });
    brandIdByName.set(name, row.id);
  }

  // --- Products, images.
  let imagesCreated = 0;

  for (const p of products) {
    const categoryId = categoryIdBySlug.get(p.categorySlug);
    if (!categoryId) {
      throw new Error(`Product "${p.id}" references unknown categorySlug "${p.categorySlug}". Seed stopped.`);
    }
    const brandId = brandIdByName.get(p.brand);
    if (!brandId) {
      throw new Error(`Product "${p.id}" references unknown brand "${p.brand}". Seed stopped.`);
    }

    await db.product.upsert({
      where: { id: p.id },
      create: {
        id: p.id,
        name: p.name,
        slug: p.slug,
        sku: null,
        description: p.description,
        price: p.price.toFixed(2),
        compareAtPrice: null,
        stock: p.stock,
        lowStockThreshold: null,
        status: "ACTIVE",
        featured: p.featured,
        categoryId,
        brandId,
      },
      update: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price.toFixed(2),
        stock: p.stock,
        featured: p.featured,
        categoryId,
        brandId,
      },
    });

    // src/lib/products.ts never overrides `image` on any of the 48
    // products, so every one currently displays its category's shared
    // placeholder (defineProducts()'s `image ?? category.image` fallback).
    // That resolved value is exactly what the static Product.image field
    // already holds and what the storefront already renders — seeded here
    // as that product's one primary image, not invented.
    await db.productImage.deleteMany({ where: { productId: p.id } });
    await db.productImage.create({
      data: {
        productId: p.id,
        url: p.image,
        altText: p.name,
        sortOrder: 0,
        isPrimary: true,
      },
    });
    imagesCreated += 1;
  }

  const [categoryCount, brandCount, productCount, imageCount] = await Promise.all([
    db.category.count(),
    db.brand.count(),
    db.product.count(),
    db.productImage.count(),
  ]);

  console.log("Seed complete:");
  console.log({
    categories: categoryCount,
    brands: brandCount,
    products: productCount,
    productImages: imageCount,
    imagesWrittenThisRun: imagesCreated,
  });
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
