import "server-only";
import { db } from "@/lib/db";

export type RepositoryBlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: unknown;
  image: string;
  imageAlt: string;
  author: string;
  category: string;
  featured: boolean;
  readTime: string;
  seoTitle: string | null;
  seoDescription: string | null;
  keywords: string[];
  relatedCategories: string[];
  status: string;
  publishedAt: string | null;
  updatedAt: string | null;
};

function toPost(row: {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: unknown;
  image: string;
  imageAlt: string;
  author: string;
  category: string;
  featured: boolean;
  readTime: string;
  seoTitle: string | null;
  seoDescription: string | null;
  keywords: string[];
  relatedCategories: string[];
  status: string;
  publishedAt: Date | null;
  updatedAt: Date;
}): RepositoryBlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    image: row.image,
    imageAlt: row.imageAlt,
    author: row.author,
    category: row.category,
    featured: row.featured,
    readTime: row.readTime,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    keywords: row.keywords,
    relatedCategories: row.relatedCategories,
    status: row.status,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString().split("T")[0] : null,
    updatedAt: row.updatedAt.toISOString().split("T")[0],
  };
}

export async function getPublishedPosts(): Promise<RepositoryBlogPost[]> {
  const rows = await db.blogPost.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
  });
  return rows.map(toPost);
}

export async function getPublishedPostBySlug(slug: string): Promise<RepositoryBlogPost | null> {
  const row = await db.blogPost.findFirst({
    where: { slug, status: "PUBLISHED" },
  });
  return row ? toPost(row) : null;
}

export async function getBlogPostRedirect(oldSlug: string): Promise<string | null> {
  const redirect = await db.blogPostRedirect.findUnique({
    where: { oldSlug },
    include: { post: { select: { slug: true, status: true } } },
  });
  if (!redirect || redirect.post.status !== "PUBLISHED") return null;
  return redirect.post.slug;
}

export async function getFeaturedPosts(): Promise<RepositoryBlogPost[]> {
  const rows = await db.blogPost.findMany({
    where: { status: "PUBLISHED", featured: true },
    orderBy: { publishedAt: "desc" },
  });
  return rows.map(toPost);
}

export async function getPostsByCategory(category: string): Promise<RepositoryBlogPost[]> {
  const rows = await db.blogPost.findMany({
    where: {
      status: "PUBLISHED",
      category: { equals: category, mode: "insensitive" },
    },
    orderBy: { publishedAt: "desc" },
  });
  return rows.map(toPost);
}

export async function getAllPublishedCategories(): Promise<string[]> {
  const rows = await db.blogPost.findMany({
    where: { status: "PUBLISHED" },
    select: { category: true },
    distinct: ["category"],
  });
  return rows.map((r) => r.category);
}

export async function getRelatedPosts(slug: string, limit = 3): Promise<RepositoryBlogPost[]> {
  const current = await db.blogPost.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: { id: true, category: true },
  });
  if (!current) return [];

  // Same category first
  const sameCat = await db.blogPost.findMany({
    where: {
      status: "PUBLISHED",
      id: { not: current.id },
      category: current.category,
    },
    orderBy: { publishedAt: "desc" },
    take: limit,
  });

  const results = sameCat.map(toPost);
  if (results.length >= limit) return results;

  // Fill with other posts
  const seenIds = [current.id, ...sameCat.map((p) => p.id)];
  const others = await db.blogPost.findMany({
    where: {
      status: "PUBLISHED",
      id: { notIn: seenIds },
    },
    orderBy: { publishedAt: "desc" },
    take: limit - results.length,
  });

  return [...results, ...others.map(toPost)];
}

export async function getPublishedPostSlugs(): Promise<{ slug: string; updatedAt: Date }[]> {
  return db.blogPost.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, updatedAt: true },
  });
}
