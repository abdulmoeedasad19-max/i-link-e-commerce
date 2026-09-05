"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/require-admin";
import { slugify } from "@/lib/admin/products";
import { logActivity } from "@/lib/admin/activity-log";

const blogPostSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(200, "Title is too long."),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required.")
    .max(200, "Slug is too long.")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug can only contain lowercase letters, numbers and hyphens."),
  excerpt: z.string().trim().min(1, "Excerpt is required.").max(500, "Excerpt is too long."),
  content: z.string().trim().min(1, "Content is required."),
  image: z.string().trim().min(1, "Featured image is required."),
  imageAlt: z.string().trim().min(1, "Image alt text is required.").max(300, "Alt text is too long."),
  author: z.string().trim().min(1, "Author is required.").max(100, "Author is too long."),
  category: z.string().trim().min(1, "Category is required.").max(50, "Category is too long."),
  readTime: z.string().trim().min(1, "Read time is required.").max(20, "Read time is too long."),
  featured: z.boolean(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  publishedAt: z.string().trim().optional().or(z.literal("")),
  seoTitle: z.string().trim().max(60, "SEO Title should not exceed 60 characters.").optional().or(z.literal("")),
  seoDescription: z.string().trim().max(160, "SEO Description should not exceed 160 characters.").optional().or(z.literal("")),
  keywords: z.string().trim().optional().or(z.literal("")),
  relatedCategories: z.string().trim().optional().or(z.literal("")),
});

type BlogFormField =
  | "title" | "slug" | "excerpt" | "content" | "image" | "imageAlt"
  | "author" | "category" | "readTime" | "featured" | "status"
  | "publishedAt" | "seoTitle" | "seoDescription" | "keywords"
  | "relatedCategories" | "form";

export type BlogActionState = {
  errors?: Partial<Record<BlogFormField, string>>;
};

function collectZodErrors(error: z.ZodError): NonNullable<BlogActionState["errors"]> {
  const errors: NonNullable<BlogActionState["errors"]> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !(field in errors)) {
      errors[field as BlogFormField] = issue.message;
    }
  }
  return errors;
}

function isPrismaKnownError(err: unknown): err is { code: string; meta?: { target?: string[] } } {
  return typeof err === "object" && err !== null && "code" in err;
}

function mapBlogWriteError(err: unknown): string {
  if (isPrismaKnownError(err)) {
    if (err.code === "P2002") return "A blog post with this slug already exists.";
    if (err.code === "P2025") return "This blog post no longer exists.";
  }
  console.error("[admin/blog] write failed:", err);
  return "Unable to save this blog post. Please try again.";
}

function parseFormData(formData: FormData) {
  const name = String(formData.get("title") ?? "");
  const slugInput = String(formData.get("slug") ?? "").trim();
  const slugCandidate = slugInput ? slugInput : slugify(name);

  let contentParsed: unknown;
  const contentRaw = String(formData.get("content") ?? "[]");
  try {
    contentParsed = JSON.parse(contentRaw);
  } catch {
    contentParsed = [];
  }

  return {
    parsed: blogPostSchema.safeParse({
      title: formData.get("title"),
      slug: slugCandidate,
      excerpt: formData.get("excerpt"),
      content: contentRaw,
      image: formData.get("image"),
      imageAlt: formData.get("imageAlt"),
      author: formData.get("author") || "i.Link Systems & Solutions",
      category: formData.get("category"),
      readTime: formData.get("readTime") || "5 min read",
      featured: formData.get("featured") === "on",
      status: formData.get("status") || "DRAFT",
      publishedAt: formData.get("publishedAt") || undefined,
      seoTitle: formData.get("seoTitle") || undefined,
      seoDescription: formData.get("seoDescription") || undefined,
      keywords: formData.get("keywords") || undefined,
      relatedCategories: formData.get("relatedCategories") || undefined,
    }),
    contentParsed,
    slugCandidate,
  };
}

export async function createBlogPost(_prevState: BlogActionState, formData: FormData): Promise<BlogActionState> {
  const session = await requireAdmin();

  const { parsed, contentParsed } = parseFormData(formData);
  if (!parsed.success) {
    return { errors: collectZodErrors(parsed.error) };
  }
  const data = parsed.data;

  const slugTaken = await db.blogPost.findUnique({ where: { slug: data.slug }, select: { id: true } });
  if (slugTaken) {
    return { errors: { slug: "A blog post with this slug already exists." } };
  }

  try {
    await db.$transaction(async (tx) => {
      const post = await tx.blogPost.create({
        data: {
          title: data.title,
          slug: data.slug,
          excerpt: data.excerpt,
          content: contentParsed as object,
          image: data.image,
          imageAlt: data.imageAlt,
          author: data.author,
          category: data.category,
          readTime: data.readTime,
          featured: data.featured,
          status: data.status,
          publishedAt: data.status === "PUBLISHED" && data.publishedAt
            ? new Date(data.publishedAt)
            : data.status === "PUBLISHED"
              ? new Date()
              : null,
          seoTitle: data.seoTitle || null,
          seoDescription: data.seoDescription || null,
          keywords: data.keywords ? data.keywords.split(",").map((k) => k.trim()).filter(Boolean) : [],
          relatedCategories: data.relatedCategories ? data.relatedCategories.split(",").map((k) => k.trim()).filter(Boolean) : [],
        },
        select: { id: true },
      });
      await logActivity(tx, {
        adminId: session.user.id,
        action: "CREATE",
        entityType: "BLOG_POST",
        entityId: post.id,
        description: `Created blog post "${data.title}"`,
      });
    });
  } catch (err) {
    return { errors: { form: mapBlogWriteError(err) } };
  }

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath("/sitemap.xml");
  redirect("/admin/blog");
}

export async function updateBlogPost(_prevState: BlogActionState, formData: FormData): Promise<BlogActionState> {
  const session = await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) {
    return { errors: { form: "Missing post id." } };
  }

  const existing = await db.blogPost.findUnique({ where: { id }, select: { slug: true, title: true } });
  if (!existing) {
    return { errors: { form: "This blog post no longer exists." } };
  }

  const { parsed, contentParsed } = parseFormData(formData);
  if (!parsed.success) {
    return { errors: collectZodErrors(parsed.error) };
  }
  const data = parsed.data;

  if (data.slug !== existing.slug) {
    const slugTaken = await db.blogPost.findUnique({ where: { slug: data.slug }, select: { id: true } });
    if (slugTaken) return { errors: { slug: "A blog post with this slug already exists." } };
  }

  try {
    await db.$transaction(async (tx) => {
      // Handle slug redirect
      if (data.slug !== existing.slug) {
        // Check if old slug is already a redirect pointing somewhere
        const existingRedirect = await tx.blogPostRedirect.findUnique({ where: { oldSlug: existing.slug } });
        if (!existingRedirect) {
          await tx.blogPostRedirect.create({
            data: { oldSlug: existing.slug, postId: id },
          });
        }
        // Also update any existing redirects that pointed to the old slug to point to the new one
        // (handled by the fact that redirects point to postId, not slug)
      }

      await tx.blogPost.update({
        where: { id },
        data: {
          title: data.title,
          slug: data.slug,
          excerpt: data.excerpt,
          content: contentParsed as object,
          image: data.image,
          imageAlt: data.imageAlt,
          author: data.author,
          category: data.category,
          readTime: data.readTime,
          featured: data.featured,
          status: data.status,
          publishedAt: data.status === "PUBLISHED" && data.publishedAt
            ? new Date(data.publishedAt)
            : data.status === "PUBLISHED" && !data.publishedAt
              ? new Date()
              : null,
          seoTitle: data.seoTitle || null,
          seoDescription: data.seoDescription || null,
          keywords: data.keywords ? data.keywords.split(",").map((k) => k.trim()).filter(Boolean) : [],
          relatedCategories: data.relatedCategories ? data.relatedCategories.split(",").map((k) => k.trim()).filter(Boolean) : [],
        },
      });

      await logActivity(tx, {
        adminId: session.user.id,
        action: "UPDATE",
        entityType: "BLOG_POST",
        entityId: id,
        description: `Updated blog post "${data.title}"`,
      });
    });
  } catch (err) {
    return { errors: { form: mapBlogWriteError(err) } };
  }

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath(`/blog/${data.slug}`);
  if (data.slug !== existing.slug) {
    revalidatePath(`/blog/${existing.slug}`);
  }
  revalidatePath("/sitemap.xml");
  redirect("/admin/blog");
}

export async function deleteBlogPost(id: string): Promise<{ error?: string }> {
  const session = await requireAdmin();

  const post = await db.blogPost.findUnique({ where: { id }, select: { title: true, slug: true } });
  if (!post) return { error: "Post not found." };

  try {
    await db.$transaction(async (tx) => {
      await tx.blogPostRedirect.deleteMany({ where: { postId: id } });
      await tx.blogPost.delete({ where: { id } });
      await logActivity(tx, {
        adminId: session.user.id,
        action: "DELETE",
        entityType: "BLOG_POST",
        entityId: id,
        description: `Deleted blog post "${post.title}"`,
      });
    });
  } catch (err) {
    console.error("[admin/blog] delete failed:", err);
    return { error: "Unable to delete this post." };
  }

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath(`/blog/${post.slug}`);
  revalidatePath("/sitemap.xml");
  redirect("/admin/blog");
}
