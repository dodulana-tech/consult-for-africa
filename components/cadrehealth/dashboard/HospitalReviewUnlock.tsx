"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star, ArrowRight, MessageSquarePlus } from "lucide-react";

interface Stats {
  state: string | null;
  totalReviews: number;
  reviewsForMyFacility: number;
  reviewsInMyState: number;
  myReviewCount: number;
  currentFacility: { id: string | null; name: string; slug: string | null } | null;
}

export default function HospitalReviewUnlock() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/cadre/dashboard-stats")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setStats(d))
      .catch(() => {});
  }, []);

  if (!stats) return null;

  const hasReviewed = stats.myReviewCount > 0;
  const myFacility = stats.currentFacility;
  const isUsefulInState = stats.reviewsInMyState >= 5;

  // Case 1: User has reviewed
  if (hasReviewed) {
    return (
      <Link
        href="/oncadre/hospitals"
        className="block rounded-2xl p-6 transition-all hover:scale-[1.005]"
        style={{
          background: "linear-gradient(135deg, #D1FAE5, #A7F3D0)",
          border: "1px solid rgba(5,150,105,0.2)",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Star className="h-4 w-4 fill-current" style={{ color: "#065F46" }} />
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: "#065F46" }}>
                Hospital reviews unlocked
              </p>
            </div>
            <h3 className="text-base font-bold" style={{ color: "#065F46" }}>
              Read what colleagues say
            </h3>
            <p className="mt-1.5 text-sm" style={{ color: "#047857" }}>
              You&apos;ve contributed {stats.myReviewCount} review{stats.myReviewCount === 1 ? "" : "s"}.
              {" "}
              {stats.totalReviews} review{stats.totalReviews === 1 ? "" : "s"} on the platform
              {stats.state && stats.reviewsInMyState > 0 && ` · ${stats.reviewsInMyState} in ${stats.state}`}.
            </p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 mt-1" style={{ color: "#065F46" }} />
        </div>
      </Link>
    );
  }

  // Case 2: User has a current facility on file -- prime hook
  if (myFacility) {
    const reviewLink = myFacility.slug
      ? `/oncadre/hospitals/${myFacility.slug}#review`
      : "/oncadre/hospitals";
    return (
      <Link
        href={reviewLink}
        className="block rounded-2xl p-6 transition-all hover:scale-[1.005]"
        style={{
          background: "linear-gradient(135deg, #FEF2F2, #FEE2E2)",
          border: "1px solid rgba(220,38,38,0.2)",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquarePlus className="h-4 w-4" style={{ color: "#991B1B" }} />
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: "#991B1B" }}>
                Hospital reviews locked
              </p>
            </div>
            <h3 className="text-base font-bold" style={{ color: "#991B1B" }}>
              {stats.reviewsForMyFacility === 0
                ? `Be the first to review ${myFacility.name}`
                : `Add your take on ${myFacility.name}`}
            </h3>
            <p className="mt-1.5 text-sm" style={{ color: "#B91C1C" }}>
              {stats.reviewsForMyFacility === 0 ? (
                <>No one has reviewed your workplace yet. Anonymous, 5 minutes. You unlock all other reviews.</>
              ) : (
                <>
                  {stats.reviewsForMyFacility} review{stats.reviewsForMyFacility === 1 ? "" : "s"} so far.
                  Add yours to unlock the rest of the network.
                </>
              )}
            </p>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <DensityPill label="Nationally" count={stats.totalReviews} useful={stats.totalReviews >= 20} />
              {stats.state && (
                <DensityPill label={stats.state} count={stats.reviewsInMyState} useful={isUsefulInState} />
              )}
            </div>
          </div>
          <Star className="h-6 w-6 shrink-0" style={{ color: "#991B1B" }} />
        </div>
      </Link>
    );
  }

  // Case 3: No current facility -- gentle prompt to add one + then review
  return (
    <Link
      href="/oncadre/profile#work-history"
      className="block rounded-2xl p-6 transition-all hover:scale-[1.005]"
      style={{
        background: "linear-gradient(135deg, #FFFBEB, #FEF3C7)",
        border: "1px solid rgba(245,158,11,0.25)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MessageSquarePlus className="h-4 w-4" style={{ color: "#92400E" }} />
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: "#92400E" }}>
              Hospital reviews
            </p>
          </div>
          <h3 className="text-base font-bold" style={{ color: "#92400E" }}>
            Add your current workplace
          </h3>
          <p className="mt-1.5 text-sm" style={{ color: "#B45309" }}>
            Tell us where you work and we&apos;ll prompt you to review it (anonymously).
            {stats.totalReviews > 0 && ` ${stats.totalReviews} review${stats.totalReviews === 1 ? "" : "s"} already on the platform — read them once you contribute.`}
          </p>
        </div>
        <ArrowRight className="h-5 w-5 shrink-0 mt-1" style={{ color: "#92400E" }} />
      </div>
    </Link>
  );
}

function DensityPill({ label, count, useful }: { label: string; count: number; useful: boolean }) {
  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px]"
      style={{
        background: useful ? "rgba(16,185,129,0.15)" : "rgba(220,38,38,0.12)",
        color: useful ? "#047857" : "#991B1B",
      }}
    >
      <span className="font-semibold">{count}</span>
      <span className="opacity-70">in {label}</span>
      {useful && <span className="opacity-70">· useful</span>}
    </div>
  );
}
