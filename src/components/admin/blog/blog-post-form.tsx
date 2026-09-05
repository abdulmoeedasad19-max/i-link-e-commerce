"use client";

import { useActionState } from "react";
import { createBlogPost, updateBlogPost, deleteBlogPost } from "@/app/admin/blog/actions";
import type { BlogActionState } from "@/app/admin/blog/actions";
import type { AdminBlogPostFull } from "@/lib/admin/blog";

type Props = {
  post?: AdminBlogPostFull;
};

export default function BlogPostForm({ post }: Props) {
  const action = post ? updateBlogPost : createBlogPost;
  const [state, formAction, isPending] = useActionState<BlogActionState, FormData>(action, {});

  return (
    <form action={formAction} className="space-y-8">
      {post && <input type="hidden" name="id" value={post.id} />}

      {state.errors?.form && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.errors.form}
        </div>
      )}

      {/* Basic Information */}
      <div className="rounded-xl border border-light-gray bg-white p-6">
        <h2 className="text-lg font-bold text-navy">Basic Information</h2>
        <div className="mt-4 grid gap-5">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-navy">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              defaultValue={post?.title ?? ""}
              className="mt-1.5 block w-full rounded-lg border border-light-gray bg-white px-3.5 py-2.5 text-sm text-navy shadow-sm focus:border-royal focus:ring-1 focus:ring-royal"
              placeholder="Best Business Laptops in Pakistan"
            />
            {state.errors?.title && <p className="mt-1 text-xs text-red-600">{state.errors.title}</p>}
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-navy">
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              id="slug"
              name="slug"
              type="text"
              defaultValue={post?.slug ?? ""}
              className="mt-1.5 block w-full rounded-lg border border-light-gray bg-white px-3.5 py-2.5 text-sm text-navy shadow-sm focus:border-royal focus:ring-1 focus:ring-royal"
              placeholder="best-business-laptops-in-pakistan"
            />
            {state.errors?.slug && <p className="mt-1 text-xs text-red-600">{state.errors.slug}</p>}
            <p className="mt-1 text-xs text-slate">Leave blank to auto-generate from title.</p>
          </div>

          <div>
            <label htmlFor="excerpt" className="block text-sm font-medium text-navy">
              Excerpt <span className="text-red-500">*</span>
            </label>
            <textarea
              id="excerpt"
              name="excerpt"
              rows={3}
              defaultValue={post?.excerpt ?? ""}
              className="mt-1.5 block w-full rounded-lg border border-light-gray bg-white px-3.5 py-2.5 text-sm text-navy shadow-sm focus:border-royal focus:ring-1 focus:ring-royal"
              placeholder="A brief summary of the article..."
            />
            {state.errors?.excerpt && <p className="mt-1 text-xs text-red-600">{state.errors.excerpt}</p>}
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-navy">
              Content (JSON) <span className="text-red-500">*</span>
            </label>
            <textarea
              id="content"
              name="content"
              rows={12}
              defaultValue={post ? JSON.stringify(post.content, null, 2) : "[]"}
              className="mt-1.5 block w-full rounded-lg border border-light-gray bg-white px-3.5 py-2.5 font-mono text-xs text-navy shadow-sm focus:border-royal focus:ring-1 focus:ring-royal"
              placeholder='[{"type": "paragraph", "text": "..."}]'
            />
            {state.errors?.content && <p className="mt-1 text-xs text-red-600">{state.errors.content}</p>}
            <p className="mt-1 text-xs text-slate">Content blocks as JSON array. Types: paragraph, heading2, heading3, list, faq.</p>
          </div>
        </div>
      </div>

      {/* Media & Author */}
      <div className="rounded-xl border border-light-gray bg-white p-6">
        <h2 className="text-lg font-bold text-navy">Media &amp; Author</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-navy">
              Featured Image URL <span className="text-red-500">*</span>
            </label>
            <input
              id="image"
              name="image"
              type="text"
              defaultValue={post?.image ?? ""}
              className="mt-1.5 block w-full rounded-lg border border-light-gray bg-white px-3.5 py-2.5 text-sm text-navy shadow-sm focus:border-royal focus:ring-1 focus:ring-royal"
              placeholder="/hero/laptops-bg.jpg"
            />
            {state.errors?.image && <p className="mt-1 text-xs text-red-600">{state.errors.image}</p>}
          </div>

          <div>
            <label htmlFor="imageAlt" className="block text-sm font-medium text-navy">
              Image Alt Text <span className="text-red-500">*</span>
            </label>
            <input
              id="imageAlt"
              name="imageAlt"
              type="text"
              defaultValue={post?.imageAlt ?? ""}
              className="mt-1.5 block w-full rounded-lg border border-light-gray bg-white px-3.5 py-2.5 text-sm text-navy shadow-sm focus:border-royal focus:ring-1 focus:ring-royal"
              placeholder="Description of the featured image"
            />
            {state.errors?.imageAlt && <p className="mt-1 text-xs text-red-600">{state.errors.imageAlt}</p>}
          </div>

          <div>
            <label htmlFor="author" className="block text-sm font-medium text-navy">
              Author <span className="text-red-500">*</span>
            </label>
            <input
              id="author"
              name="author"
              type="text"
              defaultValue={post?.author ?? "i.Link Systems & Solutions"}
              className="mt-1.5 block w-full rounded-lg border border-light-gray bg-white px-3.5 py-2.5 text-sm text-navy shadow-sm focus:border-royal focus:ring-1 focus:ring-royal"
            />
            {state.errors?.author && <p className="mt-1 text-xs text-red-600">{state.errors.author}</p>}
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-navy">
              Category <span className="text-red-500">*</span>
            </label>
            <input
              id="category"
              name="category"
              type="text"
              defaultValue={post?.category ?? ""}
              className="mt-1.5 block w-full rounded-lg border border-light-gray bg-white px-3.5 py-2.5 text-sm text-navy shadow-sm focus:border-royal focus:ring-1 focus:ring-royal"
              placeholder="Laptops"
            />
            {state.errors?.category && <p className="mt-1 text-xs text-red-600">{state.errors.category}</p>}
          </div>

          <div>
            <label htmlFor="readTime" className="block text-sm font-medium text-navy">
              Read Time
            </label>
            <input
              id="readTime"
              name="readTime"
              type="text"
              defaultValue={post?.readTime ?? "5 min read"}
              className="mt-1.5 block w-full rounded-lg border border-light-gray bg-white px-3.5 py-2.5 text-sm text-navy shadow-sm focus:border-royal focus:ring-1 focus:ring-royal"
              placeholder="7 min read"
            />
          </div>
        </div>
      </div>

      {/* Publishing */}
      <div className="rounded-xl border border-light-gray bg-white p-6">
        <h2 className="text-lg font-bold text-navy">Publishing</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-navy">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={post?.status ?? "DRAFT"}
              className="mt-1.5 block w-full rounded-lg border border-light-gray bg-white px-3.5 py-2.5 text-sm text-navy shadow-sm focus:border-royal focus:ring-1 focus:ring-royal"
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          <div>
            <label htmlFor="publishedAt" className="block text-sm font-medium text-navy">
              Published Date
            </label>
            <input
              id="publishedAt"
              name="publishedAt"
              type="date"
              defaultValue={post?.publishedAt ? new Date(post.publishedAt).toISOString().split("T")[0] : ""}
              className="mt-1.5 block w-full rounded-lg border border-light-gray bg-white px-3.5 py-2.5 text-sm text-navy shadow-sm focus:border-royal focus:ring-1 focus:ring-royal"
            />
            <p className="mt-1 text-xs text-slate">Leave blank to use today when publishing.</p>
          </div>

          <div className="flex items-center gap-3 sm:col-span-2">
            <input
              id="featured"
              name="featured"
              type="checkbox"
              defaultChecked={post?.featured ?? false}
              className="h-4 w-4 rounded border-light-gray text-royal focus:ring-royal"
            />
            <label htmlFor="featured" className="text-sm font-medium text-navy">
              Featured post (shown prominently on the blog index)
            </label>
          </div>
        </div>
      </div>

      {/* SEO Metadata */}
      <div className="rounded-xl border border-light-gray bg-white p-6">
        <h2 className="text-lg font-bold text-navy">SEO Metadata</h2>
        <p className="mt-1 text-xs text-slate">Custom SEO fields. Falls back to title/excerpt if left empty.</p>
        <div className="mt-4 grid gap-5">
          <div>
            <label htmlFor="seoTitle" className="block text-sm font-medium text-navy">
              SEO Title
            </label>
            <input
              id="seoTitle"
              name="seoTitle"
              type="text"
              maxLength={60}
              defaultValue={post?.seoTitle ?? ""}
              className="mt-1.5 block w-full rounded-lg border border-light-gray bg-white px-3.5 py-2.5 text-sm text-navy shadow-sm focus:border-royal focus:ring-1 focus:ring-royal"
              placeholder="SEO optimized title (max 60 chars)"
            />
            {state.errors?.seoTitle && <p className="mt-1 text-xs text-red-600">{state.errors.seoTitle}</p>}
          </div>

          <div>
            <label htmlFor="seoDescription" className="block text-sm font-medium text-navy">
              SEO Description
            </label>
            <textarea
              id="seoDescription"
              name="seoDescription"
              rows={2}
              maxLength={160}
              defaultValue={post?.seoDescription ?? ""}
              className="mt-1.5 block w-full rounded-lg border border-light-gray bg-white px-3.5 py-2.5 text-sm text-navy shadow-sm focus:border-royal focus:ring-1 focus:ring-royal"
              placeholder="SEO meta description (max 160 chars)"
            />
            {state.errors?.seoDescription && <p className="mt-1 text-xs text-red-600">{state.errors.seoDescription}</p>}
          </div>

          <div>
            <label htmlFor="keywords" className="block text-sm font-medium text-navy">
              Keywords
            </label>
            <input
              id="keywords"
              name="keywords"
              type="text"
              defaultValue={post?.keywords?.join(", ") ?? ""}
              className="mt-1.5 block w-full rounded-lg border border-light-gray bg-white px-3.5 py-2.5 text-sm text-navy shadow-sm focus:border-royal focus:ring-1 focus:ring-royal"
              placeholder="keyword1, keyword2, keyword3"
            />
            <p className="mt-1 text-xs text-slate">Comma-separated keywords.</p>
          </div>

          <div>
            <label htmlFor="relatedCategories" className="block text-sm font-medium text-navy">
              Related Product Categories
            </label>
            <input
              id="relatedCategories"
              name="relatedCategories"
              type="text"
              defaultValue={post?.relatedCategories?.join(", ") ?? ""}
              className="mt-1.5 block w-full rounded-lg border border-light-gray bg-white px-3.5 py-2.5 text-sm text-navy shadow-sm focus:border-royal focus:ring-1 focus:ring-royal"
              placeholder="laptops, gaming-pcs"
            />
            <p className="mt-1 text-xs text-slate">Comma-separated category slugs for internal linking.</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-royal px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-royal-600 transition-colors disabled:opacity-50"
        >
          {isPending ? "Saving…" : post ? "Update Post" : "Create Post"}
        </button>

        {post && (
          <button
            type="button"
            onClick={async () => {
              if (confirm("Are you sure you want to delete this post?")) {
                await deleteBlogPost(post.id);
              }
            }}
            className="text-sm font-semibold text-red-600 hover:text-red-700"
          >
            Delete Post
          </button>
        )}
      </div>
    </form>
  );
}
