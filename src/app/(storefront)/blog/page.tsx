import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/ui/container";
import SectionHeading from "@/components/ui/section-heading";
import BlogCard from "@/components/sections/blog-card";
import { cn } from "@/lib/utils";
import {
  getPublishedPosts,
  getFeaturedPosts,
  getPostsByCategory,
  getAllPublishedCategories,
} from "@/lib/blog-repository";
import type { RepositoryBlogPost } from "@/lib/blog-repository";

type BlogPageProps = {
  searchParams: Promise<{ category?: string | string[] }>;
};

function resolveCategory(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value ?? "").trim();
}

export async function generateMetadata({ searchParams }: BlogPageProps): Promise<Metadata> {
  const category = resolveCategory((await searchParams).category);

  if (category) {
    return {
      title: `${category} Articles`,
      description: `Articles and guides about ${category.toLowerCase()} from i.Link Systems & Solutions.`,
      robots: { index: false, follow: true },
    };
  }

  return {
    title: "Blog",
    description:
      "Buying guides and practical advice on laptops, gaming PCs, networking, CCTV, storage and enterprise IT from i.Link Systems & Solutions.",
    alternates: {
      canonical: "/blog",
    },
  };
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const category = resolveCategory((await searchParams).category);
  const categories = await getAllPublishedCategories();

  const posts: RepositoryBlogPost[] = category
    ? await getPostsByCategory(category)
    : await getPublishedPosts();
  const featuredPosts = category ? [] : await getFeaturedPosts();
  const featured = featuredPosts[0] ?? null;
  const gridPosts = featured ? posts.filter((p) => p.slug !== featured.slug) : posts;

  return (
    <div className="py-16 sm:py-20">
      <Container>
        <SectionHeading
          as="h1"
          eyebrow="i.Link Blog"
          title={category ? `${category} Articles` : "Buying Guides & IT Advice"}
          description={
            category
              ? `Articles and guides about ${category.toLowerCase()}.`
              : "Practical, jargon-free advice on choosing laptops, gaming PCs, networking gear, CCTV, storage and more — plus guidance for business and enterprise procurement."
          }
          align="left"
          className="mx-0 max-w-2xl text-left"
        />

        {/* Category navigation */}
        <div className="mt-8 flex flex-wrap gap-2">
          <Link
            href="/blog"
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
              !category
                ? "border-royal bg-royal text-white"
                : "border-light-gray bg-white text-navy hover:border-royal/30",
            )}
          >
            All Articles
          </Link>
          {categories.map((c) => (
            <Link
              key={c}
              href={`/blog?category=${encodeURIComponent(c)}`}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                category.toLowerCase() === c.toLowerCase()
                  ? "border-royal bg-royal text-white"
                  : "border-light-gray bg-white text-navy hover:border-royal/30",
              )}
            >
              {c}
            </Link>
          ))}
        </div>

        {/* Featured article */}
        {featured && (
          <div className="mt-10">
            <p className="text-xs font-bold uppercase tracking-wide text-slate">Featured</p>
            <div className="mt-3 max-w-2xl">
              <BlogCard post={featured} priority />
            </div>
          </div>
        )}

        {/* Article grid */}
        {gridPosts.length > 0 ? (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {gridPosts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="mx-auto mt-12 flex max-w-md flex-col items-center rounded-2xl border border-light-gray bg-soft-gray px-6 py-16 text-center">
            <h3 className="text-lg font-bold text-navy">No articles in this category yet</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate">
              Check back soon, or browse all articles instead.
            </p>
            <Link
              href="/blog"
              className="mt-4 text-sm font-semibold text-royal hover:text-royal-600"
            >
              View All Articles
            </Link>
          </div>
        )}
      </Container>
    </div>
  );
}
