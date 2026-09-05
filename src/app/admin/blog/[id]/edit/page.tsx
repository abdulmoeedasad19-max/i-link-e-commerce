import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogPostForm from "@/components/admin/blog/blog-post-form";
import { getAdminBlogPostById } from "@/lib/admin/blog";

export const metadata: Metadata = { title: "Edit Blog Post" };

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getAdminBlogPostById(id);

  if (!post) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Edit Blog Post</h1>
      <p className="mt-1 text-sm text-slate">Editing: {post.title}</p>
      <div className="mt-6">
        <BlogPostForm post={post} />
      </div>
    </div>
  );
}
