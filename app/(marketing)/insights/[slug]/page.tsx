import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogPostBySlug } from "@/sanity/lib/getBlogPosts";
import CopyUrlButton from "./CopyUrlButton";

export const dynamic = "force-dynamic";
export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return { title: "Not Found" };

  return {
    title: `${post.title} | Consult For Africa`,
    description: post.excerpt || "",
    openGraph: {
      title: post.title,
      description: post.excerpt || "",
      images: post.coverImageUrl ? [{ url: post.coverImageUrl }] : [],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) notFound();

  // Fetch related posts if category reference exists
  let relatedPosts: any[] = [];
  if (post.body) {
    // We need the raw category ref. Re-fetch just for that field.
    // The category ref is embedded in the GROQ result - we fetch related by categoryTitle match instead
  }

  // Try fetching related by category title
  relatedPosts = await getRelatedPostsByCategory(post.categoryTitle, post._id);

  return (
    <main className="pt-20 pb-20 bg-white min-h-screen">
      {/* Hero */}
      <div className="bg-[var(--surface-muted)]">
        <div className="max-w-4xl mx-auto px-6 py-12 md:py-16">
          <Link
            href="/insights"
            className="inline-flex items-center text-sm text-gray-500 hover:text-[var(--brand-primary)] mb-6 transition"
          >
            &larr; Back to Insights
          </Link>

          {post.categoryTitle && (
            <span className="inline-block text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-medium mb-4">
              {post.categoryTitle}
            </span>
          )}

          <h1 className="text-2xl md:text-4xl font-semibold text-gray-900 leading-tight mb-4">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            {post.author && <span>By {post.author}</span>}
            {post.publishedAt && (
              <span>
                {new Date(post.publishedAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            )}
            {post.readingTime && <span>{post.readingTime} min read</span>}
          </div>
        </div>
      </div>

      {/* Cover image */}
      {post.coverImageUrl && (
        <div className="max-w-4xl mx-auto px-6 -mt-2">
          <div className="relative w-full h-64 md:h-96 rounded-2xl overflow-hidden shadow-lg">
            <Image
              src={post.coverImageUrl}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      )}

      {/* Body content */}
      <article className="max-w-3xl mx-auto px-6 py-12">
        {post.body ? (
          <PortableTextRenderer blocks={post.body} />
        ) : post.excerpt ? (
          <p className="text-gray-700 leading-relaxed">{post.excerpt}</p>
        ) : null}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-12 pt-6 border-t border-gray-100">
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Share */}
        <div className="mt-8 flex items-center gap-3">
          <span className="text-sm text-gray-500">Share:</span>
          <CopyUrlButton />
        </div>
      </article>

      {/* Related posts */}
      {relatedPosts.length > 0 && (
        <section className="max-w-4xl mx-auto px-6 pb-12">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Related Articles
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {relatedPosts.map((related: any) => (
              <Link
                key={related._id}
                href={`/insights/${related.slug?.current}`}
                className="group bg-[var(--surface-muted)] rounded-xl overflow-hidden hover:shadow-md transition"
              >
                {related.coverImageUrl && (
                  <div className="relative h-36 overflow-hidden">
                    <Image
                      src={related.coverImageUrl}
                      alt={related.title}
                      fill
                      className="object-cover group-hover:scale-105 transition duration-500"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                    {related.title}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {related.author}
                    {related.readingTime
                      ? ` / ${related.readingTime} min read`
                      : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-[var(--surface-muted)] rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            Need expert guidance for your organisation?
          </h2>
          <p className="text-gray-600 text-sm mb-6 max-w-lg mx-auto">
            Our team of consultants brings deep African-market expertise to
            every engagement. Let us help you achieve measurable outcomes.
          </p>
          <Link
            href="/#contact"
            className="inline-flex items-center px-6 py-3 bg-[var(--brand-primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition"
          >
            Get in touch
          </Link>
        </div>
      </section>
    </main>
  );
}

/* ── Portable Text Renderer (no external dependency) ── */

function PortableTextRenderer({ blocks }: { blocks: any[] }) {
  if (!blocks || !Array.isArray(blocks)) return null;

  return (
    <div className="prose prose-gray max-w-none">
      {blocks.map((block: any, index: number) => {
        // Image block
        if (block._type === "image" && block.asset) {
          return (
            <figure key={block._key || index} className="my-8">
              {/* Image URL from asset reference needs the Sanity image pipeline */}
              {block.caption && (
                <figcaption className="text-center text-sm text-gray-500 mt-2">
                  {block.caption}
                </figcaption>
              )}
            </figure>
          );
        }

        // Block (text) type
        if (block._type === "block") {
          const text = renderSpans(block.children);

          switch (block.style) {
            case "h1":
              return (
                <h1
                  key={block._key || index}
                  className="text-2xl font-semibold text-gray-900 mt-8 mb-4"
                >
                  {text}
                </h1>
              );
            case "h2":
              return (
                <h2
                  key={block._key || index}
                  className="text-xl font-semibold text-gray-900 mt-8 mb-3"
                >
                  {text}
                </h2>
              );
            case "h3":
              return (
                <h3
                  key={block._key || index}
                  className="text-lg font-semibold text-gray-900 mt-6 mb-2"
                >
                  {text}
                </h3>
              );
            case "h4":
              return (
                <h4
                  key={block._key || index}
                  className="text-base font-semibold text-gray-900 mt-4 mb-2"
                >
                  {text}
                </h4>
              );
            case "blockquote":
              return (
                <blockquote
                  key={block._key || index}
                  className="border-l-4 border-[var(--brand-primary)] pl-4 italic text-gray-600 my-6"
                >
                  {text}
                </blockquote>
              );
            default:
              // Normal paragraph
              if (!text || (Array.isArray(text) && text.length === 0))
                return <br key={block._key || index} />;
              return (
                <p
                  key={block._key || index}
                  className="text-gray-700 leading-relaxed mb-4"
                >
                  {text}
                </p>
              );
          }
        }

        return null;
      })}
    </div>
  );
}

function renderSpans(children: any[]): React.ReactNode {
  if (!children) return null;
  return children.map((child: any, i: number) => {
    if (child._type === "span") {
      let content: React.ReactNode = child.text || "";
      if (child.marks?.includes("strong")) {
        content = <strong key={i}>{content}</strong>;
      }
      if (child.marks?.includes("em")) {
        content = <em key={i}>{content}</em>;
      }
      if (child.marks?.includes("underline")) {
        content = <u key={i}>{content}</u>;
      }
      if (child.marks?.includes("code")) {
        content = (
          <code
            key={i}
            className="bg-gray-100 px-1.5 py-0.5 rounded text-sm"
          >
            {content}
          </code>
        );
      }
      return <span key={child._key || i}>{content}</span>;
    }
    return null;
  });
}

/* ── Related posts helper (uses GROQ directly since we need category title match) ── */

import { client } from "@/sanity/lib/client";

async function getRelatedPostsByCategory(
  categoryTitle: string | undefined,
  currentId: string
) {
  if (!categoryTitle) return [];
  const query = `
    *[_type == "blogPost" && category->title == $categoryTitle && _id != $currentId] | order(publishedAt desc)[0...3]{
      _id,
      title,
      slug,
      author,
      readingTime,
      "coverImageUrl": coverImage.asset->url
    }
  `;
  return client.fetch(query, { categoryTitle, currentId });
}
