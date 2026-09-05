import type { Metadata } from "next";
import BlogPostForm from "@/components/admin/blog/blog-post-form";

export const metadata: Metadata = { title: "New Blog Post" };

export default function NewBlogPostPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">New Blog Post</h1>
      <p className="mt-1 text-sm text-slate">Create a new article for the blog.</p>
      <div className="mt-6">
        <BlogPostForm />
      </div>
    </div>
  );
}
