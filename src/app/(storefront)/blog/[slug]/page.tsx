import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound, permanentRedirect } from "next/navigation";
import { Calendar, ChevronRight, Clock, Home } from "lucide-react";
import Container from "@/components/ui/container";
import Badge from "@/components/ui/badge";
import BlogCard from "@/components/sections/blog-card";
import RichText from "@/components/sections/rich-text";
import {
  getPublishedPostBySlug,
  getBlogPostRedirect,
  getRelatedPosts,
  getPublishedPosts,
} from "@/lib/blog-repository";
import type { ContentBlock } from "@/lib/blog";
import { siteConfig } from "@/lib/site-config";
import { safeJsonLd } from "@/lib/utils";

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);

  if (!post) {
    return { title: "Article Not Found" };
  }

  const canonicalPath = `/blog/${post.slug}`;

  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    keywords: post.keywords,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      type: "article",
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt,
      url: canonicalPath,
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt ?? post.publishedAt ?? undefined,
      authors: [post.author],
      images: [{ url: post.image, alt: post.imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt,
      images: [post.image],
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);

  if (!post) {
    // Check for redirect
    const newSlug = await getBlogPostRedirect(slug);
    if (newSlug) {
      permanentRedirect(`/blog/${newSlug}`);
    }
    notFound();
  }

  const related = await getRelatedPosts(post.slug, 3);
  const canonicalUrl = `${siteConfig.url}/blog/${post.slug}`;
  const contentBlocks = post.content as ContentBlock[];
  const faqBlock = contentBlocks.find((block) => block.type === "faq");

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seoDescription || post.excerpt,
    image: `${siteConfig.url}${post.image}`,
    author: {
      "@type": "Organization",
      name: post.author,
      url: siteConfig.url,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    datePublished: post.publishedAt,
    ...(post.updatedAt ? { dateModified: post.updatedAt } : {}),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${siteConfig.url}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: canonicalUrl },
    ],
  };

  const faqJsonLd =
    faqBlock && faqBlock.type === "faq"
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqBlock.items.map((qa) => ({
            "@type": "Question",
            name: qa.question,
            acceptedAnswer: { "@type": "Answer", text: qa.answer },
          })),
        }
      : null;

  return (
    <div className="py-12 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(faqJsonLd) }}
        />
      )}

      <Container>
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-slate">
          <Link href="/" className="flex items-center gap-1 hover:text-royal">
            <Home className="h-3.5 w-3.5" aria-hidden="true" />
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <Link href="/blog" className="hover:text-royal">
            Blog
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="font-medium text-navy">{post.title}</span>
        </nav>

        {/* Header */}
        <div className="mx-auto mt-6 max-w-3xl">
          <Badge variant="royal">{post.category}</Badge>
          <h1 className="mt-4 text-balance text-2xl font-bold tracking-tight text-navy sm:text-3xl lg:text-4xl">
            {post.title}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-slate">{post.excerpt}</p>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-light-gray py-4 text-sm text-slate">
            <span className="font-semibold text-navy">By {post.author}</span>
            {post.publishedAt && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" aria-hidden="true" />
                Published {formatDate(post.publishedAt)}
              </span>
            )}
            {post.updatedAt && post.updatedAt !== post.publishedAt && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" aria-hidden="true" />
                Updated {formatDate(post.updatedAt)}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" aria-hidden="true" />
              {post.readTime}
            </span>
          </div>
        </div>

        {/* Featured image */}
        <div className="relative mx-auto mt-8 aspect-[16/9] max-w-4xl overflow-hidden rounded-2xl border border-light-gray bg-soft-gray">
          <Image
            src={post.image}
            alt={post.imageAlt}
            fill
            priority
            quality={85}
            sizes="(min-width: 1024px) 900px, 100vw"
            className="object-cover"
          />
        </div>

        {/* Article content */}
        <article className="mx-auto mt-10 max-w-3xl">
          <RichText blocks={contentBlocks} />
        </article>

        {/* Related articles */}
        {related.length > 0 && (
          <div className="mx-auto mt-16 max-w-5xl border-t border-light-gray pt-12">
            <h2 className="text-xl font-bold text-navy">Related Articles</h2>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((relatedPost) => (
                <BlogCard key={relatedPost.id} post={relatedPost} />
              ))}
            </div>
          </div>
        )}

        {/* Back to blog */}
        <div className="mx-auto mt-10 max-w-3xl">
          <Link href="/blog" className="text-sm font-semibold text-royal hover:text-royal-600">
            ← Back to Blog
          </Link>
        </div>
      </Container>
    </div>
  );
}
