import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getAdminBlogPosts } from "@/lib/admin/blog";

export const metadata: Metadata = { title: "Blog Posts" };

function statusBadge(status: string) {
  switch (status) {
    case "PUBLISHED":
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
          Published
        </span>
      );
    case "DRAFT":
      return (
        <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
          Draft
        </span>
      );
    case "ARCHIVED":
      return (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
          Archived
        </span>
      );
    default:
      return null;
  }
}

export default async function AdminBlogPage() {
  const posts = await getAdminBlogPosts();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Blog Posts</h1>
          <p className="mt-1 text-sm text-slate">
            {posts.length} {posts.length === 1 ? "post" : "posts"}
          </p>
        </div>
        <Link
          href="/admin/blog/new"
          className="inline-flex items-center gap-2 rounded-xl bg-royal px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-royal-600 transition-colors"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New Post
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-light-gray bg-white">
        <table className="min-w-full divide-y divide-light-gray">
          <thead className="bg-soft-gray">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate">Title</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate">Category</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate">Published</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-light-gray">
            {posts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate">
                  No blog posts yet. Create your first post to get started.
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr key={post.id} className="hover:bg-soft-gray/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-navy">{post.title}</span>
                      {post.featured && (
                        <span className="inline-flex items-center rounded-full bg-royal/10 px-2 py-0.5 text-[10px] font-bold text-royal">
                          Featured
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-slate">/blog/{post.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate">{post.category}</td>
                  <td className="px-4 py-3">{statusBadge(post.status)}</td>
                  <td className="px-4 py-3 text-sm text-slate">
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/blog/${post.id}/edit`}
                      className="text-sm font-semibold text-royal hover:text-royal-600"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
