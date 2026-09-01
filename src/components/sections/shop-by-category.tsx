import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import SectionHeading from "@/components/ui/section-heading";
import Container from "@/components/ui/container";
import FadeIn from "@/components/ui/fade-in";
import { getAllCategories, type RepositoryCategory, type CategoryTierDisplay } from "@/lib/categories-repository";
import { iconMap } from "@/lib/icon-map";
import { cn } from "@/lib/utils";

const tiers: Record<
  CategoryTierDisplay,
  {
    aspect: string;
    badge: string;
    iconSize: string;
    padding: string;
    title: string;
    description: string;
    sizes: string;
  }
> = {
  featured: {
    aspect: "aspect-[16/11] lg:aspect-[4/5]",
    badge: "h-12 w-12 rounded-2xl",
    iconSize: "h-6 w-6",
    padding: "p-6 sm:p-7",
    title: "text-2xl sm:text-[28px]",
    description: "text-sm sm:text-[15px]",
    sizes: "(min-width: 1024px) 33vw, 100vw",
  },
  secondary: {
    aspect: "aspect-[4/3] sm:aspect-[4/5]",
    badge: "h-10 w-10 rounded-xl",
    iconSize: "h-5 w-5",
    padding: "p-5 sm:p-6",
    title: "text-lg sm:text-xl",
    description: "text-sm",
    sizes: "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw",
  },
  compact: {
    aspect: "aspect-square",
    badge: "h-9 w-9 rounded-lg",
    iconSize: "h-4.5 w-4.5",
    padding: "p-4 sm:p-5",
    title: "text-sm sm:text-base",
    description: "hidden sm:block text-xs",
    sizes: "(min-width: 640px) 25vw, 50vw",
  },
};

function CategoryCard({ category, priority = false }: { category: RepositoryCategory; priority?: boolean }) {
  const Icon = iconMap[category.icon];
  const t = tiers[category.tier];

  return (
    <Link
      href={category.href}
      className={cn(
        "group relative isolate flex flex-col justify-end overflow-hidden rounded-[22px] ring-1 ring-navy/10 transition-all duration-300 ease-out",
        "shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-8px_rgba(15,23,42,0.12)]",
        "hover:-translate-y-1.5 hover:ring-royal/30 hover:shadow-[0_2px_4px_rgba(15,23,42,0.1),0_24px_48px_-16px_rgba(29,78,216,0.38)]",
        t.aspect,
      )}
    >
      <Image
        src={category.image}
        alt=""
        fill
        priority={priority}
        quality={75}
        sizes={t.sizes}
        className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-navy/95 via-navy/55 to-navy/15 transition-colors duration-300 ease-out group-hover:from-navy/90 group-hover:via-navy/45"
        aria-hidden="true"
      />

      <span
        className={cn(
          "absolute left-4 top-4 sm:left-5 sm:top-5 z-10 flex items-center justify-center border border-white/25 bg-white/10 text-white backdrop-blur-md",
          t.badge,
        )}
      >
        <Icon className={t.iconSize} strokeWidth={1.7} aria-hidden="true" />
      </span>

      <div className={cn("relative z-10", t.padding)}>
        <h3 className={cn("font-bold text-white", t.title)}>{category.name}</h3>
        <p className={cn("mt-1.5 leading-relaxed text-white/75", t.description)}>{category.description}</p>
        <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-sky">
          Shop Now
          <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}

export default async function ShopByCategory() {
  const categories = await getAllCategories();
  const featured = categories.filter((c) => c.tier === "featured");
  const secondary = categories.filter((c) => c.tier === "secondary");
  const compact = categories.filter((c) => c.tier === "compact");

  return (
    <section aria-labelledby="category-heading" className="bg-soft-gray py-20 sm:py-24">
      <Container>
        <SectionHeading
          headingId="category-heading"
          eyebrow="Full Product Range"
          title="Shop by Category"
          description="From everyday computing to enterprise infrastructure — find genuine, warranty-backed products across every category you need."
        />

        <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {featured.map((category, i) => (
            <FadeIn key={category.id} delay={Math.min(i * 0.05, 0.2)}>
              <CategoryCard category={category} priority={i === 0} />
            </FadeIn>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {secondary.map((category, i) => (
            <FadeIn key={category.id} delay={Math.min(i * 0.05, 0.2)}>
              <CategoryCard category={category} />
            </FadeIn>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {compact.map((category, i) => (
            <FadeIn key={category.id} delay={Math.min(i * 0.04, 0.2)}>
              <CategoryCard category={category} />
            </FadeIn>
          ))}
        </div>
      </Container>
    </section>
  );
}
