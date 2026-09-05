import "server-only";
import { db } from "@/lib/db";

export type AdminBlogPost = {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: string;
  featured: boolean;
  publishedAt: Date | null;
  updatedAt: Date;
};

export type AdminBlogPostFull = {
  id: string;
  title: string;
  slug: string;
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
};

export async function getAdminBlogPosts(): Promise<AdminBlogPost[]> {
  return db.blogPost.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      category: true,
      status: true,
      featured: true,
      publishedAt: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getAdminBlogPostById(id: string): Promise<AdminBlogPostFull | null> {
  return db.blogPost.findUnique({
    where: { id },
  });
}
