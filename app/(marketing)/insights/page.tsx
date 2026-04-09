import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getInsightsPage } from "@/sanity/lib/getBlogPosts";
import WhitepaperGate from "@/components/cfa/WhitepaperGate";
import InsightsClient from "./InsightsClient";

export const metadata: Metadata = {
  title: "Insights | Consult For Africa",
  description:
    "Perspectives on hospital performance, governance, capital projects, and health system strengthening across Africa.",
  keywords: [
    "healthcare insights Africa",
    "hospital management articles",
    "clinical governance insights",
    "African healthcare research",
    "hospital performance reports",
  ],
  alternates: {
    canonical: "https://consultforafrica.com/insights",
  },
  openGraph: {
    title: "Insights | Consult For Africa",
    description: "Perspectives on hospital performance, governance, and health system strengthening across Africa.",
    type: "website",
    images: ["/og-image.jpg"],
  },
};

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function InsightsPage() {
  const data = await getInsightsPage();

  const {
    featuredPublication,
    allPublications,
    featuredBlogPosts,
    recentBlogPosts,
  } = data;

  // Combine for the "featured hero" section
  const heroPost =
    featuredBlogPosts?.[0] ?? featuredPublication ?? null;

  return (
    <main className="pb-20 bg-[var(--surface-muted)] min-h-screen" style={{ paddingTop: "calc(var(--navbar-height, 4rem) + 2rem)" }}>
      <div className="max-w-6xl mx-auto px-6">
        {/* Page header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-3xl md:text-4xl font-semibold text-gray-900">
            Insights & Publications
          </h1>
          <p className="mt-4 text-gray-600 leading-relaxed">
            Perspectives on hospital performance, governance, capital projects,
            and health system strengthening across Africa.
          </p>
        </div>

        {/* Hero featured item */}
        {heroPost && <HeroCard item={heroPost} />}

        {/* Tabbed content */}
        <InsightsClient
          publications={allPublications ?? []}
          blogPosts={recentBlogPosts ?? []}
        />
      </div>
    </main>
  );
}

/* ── Hero Card ── */

function HeroCard({ item }: { item: any }) {
  const isBlogPost = !!item.excerpt;
  const imageUrl = item.coverImageUrl || item.imageUrl;
  const href = isBlogPost
    ? `/insights/${item.slug?.current}`
    : null;

  return (
    <div className="mb-14 bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition duration-300">
      <div className="grid md:grid-cols-2">
        {imageUrl && (
          <div className="relative h-64 md:h-auto">
            <Image
              src={imageUrl}
              alt={item.title}
              fill
              className="object-cover"
            />
          </div>
        )}
        <div className="p-8 md:p-10 flex flex-col justify-center">
          <p className="text-xs uppercase tracking-wide text-[var(--brand-primary)] font-medium mb-2">
            {isBlogPost ? "Featured Article" : "Featured Publication"}
          </p>
          <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-3">
            {item.title}
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            {item.excerpt || item.summary}
          </p>
          {item.author && (
            <p className="text-xs text-gray-500 mb-4">
              {item.author}
              {item.readingTime ? ` / ${item.readingTime} min read` : ""}
            </p>
          )}
          {href ? (
            <Link
              href={href}
              className="inline-flex items-center text-sm font-medium text-[var(--brand-primary)] hover:underline"
            >
              Read article
            </Link>
          ) : item.fileUrl ? (
            <WhitepaperGate fileUrl={item.fileUrl} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
