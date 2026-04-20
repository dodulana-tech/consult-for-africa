import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getCadreLabel, CADRE_OPTIONS } from "@/lib/cadreHealth/cadres";
import MentorFilters from "./MentorFilters";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Browse Mentors | CadreHealth Mentorship",
  description:
    "Find experienced healthcare mentors from the diaspora. Filter by cadre, specialty, and partner organization. Free mentorship for Nigerian healthcare professionals.",
  alternates: {
    canonical: "https://consultforafrica.com/oncadre/mentorship/mentors",
  },
};

const PARTNER_ORG_STYLES: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  MANSAG: {
    label: "MANSAG",
    color: "#2563EB",
    bg: "#EFF6FF",
    border: "#BFDBFE",
  },
  ANPA: {
    label: "ANPA",
    color: "#DC2626",
    bg: "#FEF2F2",
    border: "#FECACA",
  },
  DFC: {
    label: "DFC",
    color: "#B8860B",
    bg: "#FFFBEB",
    border: "#FDE68A",
  },
  NDF_SA: {
    label: "NDF-SA",
    color: "#059669",
    bg: "#ECFDF5",
    border: "#A7F3D0",
  },
};

function StarRating({ rating }: { rating: number | null }) {
  const r = rating ? Number(rating) : 0;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className="h-3.5 w-3.5"
          fill={star <= Math.round(r) ? "#D4AF37" : "#E8EBF0"}
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      {r > 0 && (
        <span className="ml-1 text-xs text-gray-500">{r.toFixed(1)}</span>
      )}
    </div>
  );
}

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function BrowseMentorsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const cadre = typeof params.cadre === "string" ? params.cadre : undefined;
  const area = typeof params.area === "string" ? params.area : undefined;
  const partnerOrg =
    typeof params.partnerOrg === "string" ? params.partnerOrg : undefined;

  const where: Record<string, unknown> = { status: "ACTIVE" as const };
  if (cadre) where.mentorCadres = { has: cadre };
  if (area) where.mentorAreas = { has: area };
  if (partnerOrg) where.partnerOrg = partnerOrg;

  const mentors = await prisma.cadreMentorProfile.findMany({
    where,
    include: {
      professional: {
        select: {
          firstName: true,
          lastName: true,
          cadre: true,
          subSpecialty: true,
          photo: true,
          yearsOfExperience: true,
        },
      },
    },
    orderBy: [
      { partnerOrgVerified: "desc" },
      { averageRating: "desc" },
      { totalMentorships: "desc" },
      { createdAt: "desc" },
    ],
    take: 50,
  });

  return (
    <main className="min-h-screen" style={{ background: "#F8F9FB" }}>
      {/* Header */}
      <section
        className="relative"
        style={{
          background: "linear-gradient(135deg, #0B3C5D 0%, #0a2d44 100%)",
        }}
      >
        <div className="mx-auto max-w-7xl px-6 py-12 sm:py-16">
          <Link
            href="/oncadre/mentorship"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-300 transition hover:text-white"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Mentorship
          </Link>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Browse Mentors
          </h1>
          <p className="mt-2 text-base text-gray-300">
            {mentors.length} mentor{mentors.length !== 1 ? "s" : ""} available
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Filters */}
        <Suspense
          fallback={
            <div
              className="h-20 animate-pulse rounded-2xl bg-white"
              style={{ border: "1px solid #E8EBF0" }}
            />
          }
        >
          <MentorFilters cadreOptions={CADRE_OPTIONS} />
        </Suspense>

        {/* Mentor Grid */}
        {mentors.length === 0 ? (
          <div className="mt-12 text-center">
            <div
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: "#0B3C5D10" }}
            >
              <svg
                className="h-8 w-8"
                style={{ color: "#0B3C5D" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              No mentors found
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Try adjusting your filters or check back soon.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mentors.map((mentor) => {
              const spotsLeft =
                mentor.maxMentees - mentor.currentMenteeCount;
              const orgStyle = mentor.partnerOrg
                ? PARTNER_ORG_STYLES[mentor.partnerOrg]
                : null;

              return (
                <div
                  key={mentor.id}
                  className="group rounded-2xl border bg-white p-6 transition-all hover:shadow-lg"
                  style={{ borderColor: "#E8EBF0" }}
                >
                  {/* Top row: avatar + name */}
                  <div className="flex items-start gap-3">
                    {mentor.professional.photo ? (
                      <img
                        src={mentor.professional.photo}
                        alt=""
                        className="h-12 w-12 rounded-xl object-cover"
                      />
                    ) : (
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-xl text-sm font-bold text-white"
                        style={{
                          background:
                            "linear-gradient(135deg, #0B3C5D, #0d4a73)",
                        }}
                      >
                        {mentor.professional.firstName[0]}
                        {mentor.professional.lastName[0]}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-base font-bold text-gray-900">
                        {mentor.professional.firstName}{" "}
                        {mentor.professional.lastName}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {getCadreLabel(mentor.professional.cadre)}
                        {mentor.professional.subSpecialty &&
                          ` / ${mentor.professional.subSpecialty}`}
                      </p>
                    </div>
                  </div>

                  {/* Badges row */}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {orgStyle && (
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                        style={{
                          background: orgStyle.bg,
                          color: orgStyle.color,
                          border: `1px solid ${orgStyle.border}`,
                        }}
                      >
                        {orgStyle.label}
                        {mentor.partnerOrgVerified && (
                          <svg
                            className="ml-1 h-3 w-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </span>
                    )}
                    {mentor.countryOfPractice && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium text-gray-600"
                        style={{
                          background: "#F8F9FB",
                          border: "1px solid #E8EBF0",
                        }}
                      >
                        <svg
                          className="h-3 w-3 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        {mentor.countryOfPractice}
                      </span>
                    )}
                  </div>

                  {/* Mentor areas as tags */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {mentor.mentorAreas.slice(0, 3).map((a) => (
                      <span
                        key={a}
                        className="rounded-lg px-2 py-0.5 text-[10px] font-medium"
                        style={{
                          background: "#0B3C5D08",
                          color: "#0B3C5D",
                          border: "1px solid #0B3C5D15",
                        }}
                      >
                        {a}
                      </span>
                    ))}
                    {mentor.mentorAreas.length > 3 && (
                      <span className="rounded-lg px-2 py-0.5 text-[10px] font-medium text-gray-400">
                        +{mentor.mentorAreas.length - 3} more
                      </span>
                    )}
                  </div>

                  {/* Rating + availability */}
                  <div className="mt-4 flex items-center justify-between">
                    <StarRating
                      rating={
                        mentor.averageRating
                          ? Number(mentor.averageRating)
                          : null
                      }
                    />
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{
                          background:
                            spotsLeft > 0 ? "#10B981" : "#EF4444",
                        }}
                      />
                      <span className="text-[10px] font-medium text-gray-500">
                        {spotsLeft > 0
                          ? `${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} left`
                          : "Full"}
                      </span>
                    </div>
                  </div>

                  {/* Bio excerpt */}
                  {mentor.bio && (
                    <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-gray-500">
                      {mentor.bio}
                    </p>
                  )}

                  {/* CTA */}
                  <Link
                    href={`/oncadre/login?redirect=/oncadre/mentorship/my&mentor=${mentor.id}`}
                    className="mt-4 block w-full rounded-xl py-2.5 text-center text-sm font-semibold text-white transition-all hover:opacity-90"
                    style={{
                      background:
                        spotsLeft > 0
                          ? "linear-gradient(135deg, #0B3C5D, #0d4a73)"
                          : "#94A3B8",
                      pointerEvents: spotsLeft > 0 ? "auto" : "none",
                    }}
                  >
                    {spotsLeft > 0
                      ? "Request Mentorship"
                      : "Currently Full"}
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
