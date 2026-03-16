"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import WhitepaperGate from "@/components/cfa/WhitepaperGate";

type Tab = "all" | "articles" | "publications";

interface Props {
  publications: any[];
  blogPosts: any[];
}

export default function InsightsClient({ publications, blogPosts }: Props) {
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");

  const filteredPubs = useMemo(() => {
    const q = search.toLowerCase();
    return publications.filter(
      (p) =>
        p.title?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.summary?.toLowerCase().includes(q)
    );
  }, [publications, search]);

  const filteredPosts = useMemo(() => {
    const q = search.toLowerCase();
    return blogPosts.filter(
      (p) =>
        p.title?.toLowerCase().includes(q) ||
        p.categoryTitle?.toLowerCase().includes(q) ||
        p.excerpt?.toLowerCase().includes(q)
    );
  }, [blogPosts, search]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "articles", label: "Articles" },
    { key: "publications", label: "Publications" },
  ];

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-lg p-1 shadow-sm">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm rounded-md transition font-medium ${
                tab === t.key
                  ? "bg-[var(--brand-primary)] text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search insights..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-72 px-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]"
        />
      </div>

      {/* Content grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {(tab === "all" || tab === "articles") &&
          filteredPosts.map((post) => (
            <BlogPostCard key={post._id} post={post} />
          ))}

        {(tab === "all" || tab === "publications") &&
          filteredPubs.map((pub) => (
            <PublicationCard key={pub._id} pub={pub} />
          ))}
      </div>

      {/* Empty state */}
      {tab === "articles" && filteredPosts.length === 0 && (
        <EmptyState text="No articles found." />
      )}
      {tab === "publications" && filteredPubs.length === 0 && (
        <EmptyState text="No publications found." />
      )}
      {tab === "all" &&
        filteredPosts.length === 0 &&
        filteredPubs.length === 0 && (
          <EmptyState text="No insights found." />
        )}
    </div>
  );
}

/* ── Blog Post Card ── */

function BlogPostCard({ post }: { post: any }) {
  return (
    <Link
      href={`/insights/${post.slug?.current}`}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition duration-300"
    >
      {post.coverImageUrl && (
        <div className="relative h-44 overflow-hidden">
          <Image
            src={post.coverImageUrl}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition duration-500"
          />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          {post.categoryTitle && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
              {post.categoryTitle}
            </span>
          )}
          <span className="text-xs text-gray-400">Article</span>
        </div>
        <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3">
            {post.excerpt}
          </p>
        )}
        <div className="flex items-center gap-3 text-xs text-gray-400">
          {post.author && <span>{post.author}</span>}
          {post.publishedAt && (
            <span>
              {new Date(post.publishedAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          )}
          {post.readingTime && <span>{post.readingTime} min read</span>}
        </div>
      </div>
    </Link>
  );
}

/* ── Publication Card ── */

function PublicationCard({ pub }: { pub: any }) {
  const imageUrl = pub.coverImageUrl || pub.imageUrl;

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition duration-300">
      {imageUrl && (
        <div className="relative h-44 overflow-hidden">
          <Image
            src={imageUrl}
            alt={pub.title}
            fill
            className="object-cover"
          />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          {pub.category && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">
              {pub.category}
            </span>
          )}
          <span className="text-xs text-gray-400">Publication</span>
        </div>
        <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
          {pub.title}
        </h3>
        {pub.summary && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3">
            {pub.summary}
          </p>
        )}
        {pub.fileUrl ? (
          <WhitepaperGate fileUrl={pub.fileUrl} />
        ) : pub.slug?.current ? (
          <Link
            href={`/insights/${pub.slug.current}`}
            className="text-sm font-medium text-[var(--brand-primary)] hover:underline"
          >
            Read more
          </Link>
        ) : null}
      </div>
    </div>
  );
}

/* ── Empty State ── */

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center py-16">
      <p className="text-gray-400 text-sm">{text}</p>
    </div>
  );
}
