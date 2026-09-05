import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import Badge from "@/components/ui/badge";
import type { RepositoryBlogPost } from "@/lib/blog-repository";

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogCard({ post, priority = false }: { post: RepositoryBlogPost; priority?: boolean }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-light-gray bg-white premium-shadow transition-all duration-300 hover:-translate-y-1.5 hover:border-royal/30 hover:shadow-[0_1px_2px_rgba(15,23,42,0.06),0_20px_40px_-16px_rgba(29,78,216,0.28)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-soft-gray">
        <Image
          src={post.image}
          alt={post.imageAlt}
          fill
          priority={priority}
          quality={75}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <Badge variant="royal" className="w-fit text-[10px]">
          {post.category}
        </Badge>
        <h3 className="mt-2.5 line-clamp-2 text-base font-bold leading-snug text-navy">
          {post.title}
        </h3>
        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-slate">{post.excerpt}</p>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate">
          {post.publishedAt && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              {formatDate(post.publishedAt)}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {post.readTime}
          </span>
        </div>

        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-royal">
          Read Article
          <ArrowRight
            className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
            aria-hidden="true"
          />
        </span>
      </div>
    </Link>
  );
}
