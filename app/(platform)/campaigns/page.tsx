import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Megaphone, Calendar, FileText } from "lucide-react";

const BRAND_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  C4A: { bg: "#0F274410", color: "#0F2744", label: "C4A" },
  CADREHEALTH: { bg: "#0B3C5D10", color: "#0B3C5D", label: "CadreHealth" },
  MAAROVA: { bg: "#7C3AED10", color: "#7C3AED", label: "Maarova" },
};

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  PLANNING: { bg: "bg-gray-100", color: "text-gray-600" },
  ACTIVE: { bg: "bg-emerald-50", color: "text-emerald-700" },
  PAUSED: { bg: "bg-amber-50", color: "text-amber-700" },
  COMPLETED: { bg: "bg-blue-50", color: "text-blue-700" },
};

const POST_STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  IDEA: { bg: "bg-gray-100", color: "text-gray-600" },
  DRAFTING: { bg: "bg-blue-50", color: "text-blue-700" },
  READY_FOR_REVIEW: { bg: "bg-amber-50", color: "text-amber-700" },
  APPROVED: { bg: "bg-emerald-50", color: "text-emerald-700" },
  SCHEDULED: { bg: "bg-indigo-50", color: "text-indigo-700" },
  PUBLISHED: { bg: "bg-emerald-50", color: "text-emerald-700" },
  REJECTED: { bg: "bg-red-50", color: "text-red-600" },
};

export default async function CampaignsPage() {
  const [campaigns, recentPosts, postsByStatus, postsByBrand] = await Promise.all([
    prisma.campaign.findMany({
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { posts: true } } },
    }),
    prisma.campaignPost.findMany({
      orderBy: { updatedAt: "desc" },
      take: 10,
      include: { campaign: { select: { name: true } } },
    }),
    prisma.campaignPost.groupBy({ by: ["status"], _count: true }),
    prisma.campaignPost.groupBy({ by: ["brand"], _count: true }),
  ]);

  const needsReview = postsByStatus.find(p => p.status === "READY_FOR_REVIEW")?._count ?? 0;
  const scheduled = postsByStatus.find(p => p.status === "SCHEDULED")?._count ?? 0;
  const published = postsByStatus.find(p => p.status === "PUBLISHED")?._count ?? 0;
  const totalPosts = postsByStatus.reduce((s, p) => s + p._count, 0);

  return (
    <div className="p-4 sm:p-6 max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0F2744" }}>
            Campaigns
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Social media content across C4A, CadreHealth, and Maarova
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/campaigns/new?type=post"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            <FileText className="h-4 w-4" />
            New Post
          </Link>
          <Link
            href="/campaigns/new"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            style={{ background: "#0F2744" }}
          >
            <Plus className="h-4 w-4" />
            New Campaign
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat label="Total Posts" value={totalPosts} icon={<FileText className="h-5 w-5" />} accent="#0F2744" />
        <Stat label="Needs Review" value={needsReview} icon={<Megaphone className="h-5 w-5" />} accent={needsReview > 0 ? "#D4AF37" : "#9CA3AF"} />
        <Stat label="Scheduled" value={scheduled} icon={<Calendar className="h-5 w-5" />} accent="#2563EB" />
        <Stat label="Published" value={published} icon={<Megaphone className="h-5 w-5" />} accent="#059669" />
      </div>

      {/* Brand breakdown */}
      {postsByBrand.length > 0 && (
        <div className="flex gap-3">
          {postsByBrand.map(b => {
            const style = BRAND_STYLES[b.brand] ?? BRAND_STYLES.C4A;
            return (
              <div key={b.brand} className="rounded-xl px-4 py-2" style={{ background: style.bg }}>
                <span className="text-xs font-bold" style={{ color: style.color }}>{style.label}</span>
                <span className="ml-2 text-xs text-gray-500">{b._count} posts</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Campaigns */}
      {campaigns.length > 0 && (
        <div>
          <h2 className="text-sm font-bold mb-3" style={{ color: "#0F2744" }}>Campaigns</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {campaigns.map(c => {
              const brand = BRAND_STYLES[c.brand] ?? BRAND_STYLES.C4A;
              const status = STATUS_STYLES[c.status] ?? STATUS_STYLES.PLANNING;
              return (
                <Link
                  key={c.id}
                  href={`/campaigns/${c.id}`}
                  className="rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md"
                  style={{ border: "1px solid #E8EBF0" }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-bold" style={{ color: "#0F2744" }}>{c.name}</h3>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold ${status.bg} ${status.color}`}>
                      {c.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: brand.bg, color: brand.color }}>
                      {brand.label}
                    </span>
                    {c.objective && <span className="text-[9px] text-gray-400">{c.objective}</span>}
                  </div>
                  {c.description && (
                    <p className="text-xs text-gray-500 line-clamp-2">{c.description}</p>
                  )}
                  <p className="mt-2 text-[10px] text-gray-400">{c._count.posts} posts</p>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Posts */}
      <div>
        <h2 className="text-sm font-bold mb-3" style={{ color: "#0F2744" }}>Recent Posts</h2>
        {recentPosts.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
            <Megaphone className="mx-auto mb-3 h-8 w-8 text-gray-300" />
            <p className="text-sm font-medium text-gray-700">No posts yet</p>
            <p className="text-xs text-gray-400 mt-1">Create your first post to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentPosts.map(post => {
              const brand = BRAND_STYLES[post.brand] ?? BRAND_STYLES.C4A;
              const status = POST_STATUS_STYLES[post.status] ?? POST_STATUS_STYLES.IDEA;
              return (
                <Link
                  key={post.id}
                  href={`/campaigns/${post.campaignId ?? "posts"}?postId=${post.id}`}
                  className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md"
                  style={{ border: "1px solid #E8EBF0" }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="rounded-full px-1.5 py-0.5 text-[8px] font-bold" style={{ background: brand.bg, color: brand.color }}>
                        {brand.label}
                      </span>
                      <p className="text-sm font-semibold text-gray-900 truncate">{post.title}</p>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{post.body.slice(0, 80)}{post.body.length > 80 ? "..." : ""}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {post.platforms.map(p => (
                        <span key={p} className="text-[9px] text-gray-400">{p}</span>
                      ))}
                      {post.campaign && <span className="text-[9px] text-gray-300">{post.campaign.name}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {post.scheduledAt && (
                      <span className="text-[10px] text-gray-400">
                        {new Date(post.scheduledAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                      </span>
                    )}
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${status.bg} ${status.color}`}>
                      {post.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, icon, accent }: { label: string; value: number; icon: React.ReactNode; accent: string }) {
  return (
    <div className="rounded-2xl bg-white p-3.5 sm:p-5 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
        <div className="rounded-xl p-2" style={{ background: `${accent}10` }}>
          <div style={{ color: accent }}>{icon}</div>
        </div>
      </div>
      <p className="mt-1 sm:mt-2 text-lg sm:text-2xl font-bold tracking-tight" style={{ color: accent }}>{value}</p>
    </div>
  );
}
