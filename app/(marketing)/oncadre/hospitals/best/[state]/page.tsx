import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NIGERIAN_STATES } from "@/lib/cadreHealth/cadres";

export const dynamic = "force-dynamic";

function stateToSlug(state: string): string {
  return state.toLowerCase().replace(/\s+/g, "-");
}

function slugToState(slug: string): string | undefined {
  return NIGERIAN_STATES.find((s) => stateToSlug(s) === slug.toLowerCase());
}

export function generateStaticParams() {
  return NIGERIAN_STATES.map((state) => ({
    state: stateToSlug(state),
  }));
}

interface Props {
  params: Promise<{ state: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state: slug } = await params;
  const stateName = slugToState(slug);
  if (!stateName) return { title: "State Not Found | CadreHealth" };

  return {
    title: `Best Hospitals to Work at in ${stateName} 2026 | CadreHealth`,
    description: `Ranked list of the best hospitals to work at in ${stateName}, Nigeria in 2026. Based on anonymous staff reviews from verified healthcare professionals.`,
    keywords: [
      `best hospitals ${stateName}`,
      `best hospital to work ${stateName}`,
      `hospital rankings ${stateName}`,
      `hospital reviews ${stateName}`,
      "CadreHealth",
    ].join(", "),
    openGraph: {
      title: `Best Hospitals to Work at in ${stateName} 2026`,
      description: `Staff-rated hospital rankings for ${stateName}, Nigeria.`,
      type: "website",
      url: `https://consultforafrica.com/oncadre/hospitals/best/${slug}`,
      siteName: "CadreHealth by Consult For Africa",
      locale: "en_NG",
    },
    alternates: {
      canonical: `https://consultforafrica.com/oncadre/hospitals/best/${slug}`,
    },
  };
}

const FACILITY_TYPE_LABELS: Record<string, string> = {
  PUBLIC_TERTIARY: "Public Tertiary",
  PUBLIC_SECONDARY: "Public Secondary",
  PUBLIC_PRIMARY: "Public Primary",
  PRIVATE_TERTIARY: "Private Tertiary",
  PRIVATE_SECONDARY: "Private Secondary",
  PRIVATE_CLINIC: "Private Clinic",
  FAITH_BASED: "Faith-Based",
  NGO: "NGO",
  MILITARY: "Military",
  INTERNATIONAL: "International",
};

function ratingColor(rating: number): string {
  if (rating >= 4) return "text-emerald-600";
  if (rating >= 3) return "text-amber-600";
  return "text-red-600";
}

export default async function StateBestHospitalsPage({ params }: Props) {
  const { state: slug } = await params;
  const stateName = slugToState(slug);
  if (!stateName) notFound();

  const MIN_REVIEWS = 3;

  const hospitals = await prisma.cadreFacility.findMany({
    where: {
      state: stateName,
      totalReviews: { gte: MIN_REVIEWS },
      overallRating: { not: null },
    },
    orderBy: [{ overallRating: "desc" }, { totalReviews: "desc" }],
    select: {
      slug: true,
      name: true,
      type: true,
      state: true,
      city: true,
      totalReviews: true,
      overallRating: true,
      compensationRating: true,
      trainingRating: true,
    },
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Best Hospitals to Work at in ${stateName} 2026`,
    url: `https://consultforafrica.com/oncadre/hospitals/best/${slug}`,
    numberOfItems: hospitals.length,
    itemListElement: hospitals.map((h, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Hospital",
        name: h.name,
        url: `https://consultforafrica.com/oncadre/hospitals/${h.slug}`,
      },
    })),
  };

  return (
    <main
      className="min-h-screen bg-[#F8F9FB] pb-20"
      style={{ paddingTop: "calc(var(--navbar-height, 4rem) + 1rem)" }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/oncadre" className="hover:text-[#0B3C5D] transition">
            CadreHealth
          </Link>
          <span>/</span>
          <Link
            href="/oncadre/hospitals"
            className="hover:text-[#0B3C5D] transition"
          >
            Hospitals
          </Link>
          <span>/</span>
          <Link
            href="/oncadre/hospitals/best"
            className="hover:text-[#0B3C5D] transition"
          >
            Best Hospitals
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{stateName}</span>
        </nav>

        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#D4AF37]/10 px-3 py-1 text-xs font-semibold text-[#D4AF37] mb-4">
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
              />
            </svg>
            2026 Rankings
          </div>
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Best Hospitals to Work at in {stateName}
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-gray-600">
            Rankings based on anonymous reviews from verified healthcare
            professionals in {stateName}. Minimum {MIN_REVIEWS} reviews
            required.
          </p>
        </div>

        {hospitals.length === 0 ? (
          <div
            className="rounded-xl bg-white p-10 text-center sm:p-14"
            style={{
              border: "1px solid #E8EBF0",
              boxShadow:
                "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
            }}
          >
            <h2 className="text-xl font-bold text-gray-900">
              Not Enough Reviews Yet
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-gray-600">
              We need at least {MIN_REVIEWS} reviews per hospital to generate
              rankings for {stateName}. Help by reviewing your workplace.
            </p>
            <Link
              href="/oncadre/register"
              className="mt-6 inline-flex rounded-lg bg-[#0B3C5D] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0A3350]"
            >
              Write a review
            </Link>
          </div>
        ) : (
          <div className="space-y-3 mb-10">
            {hospitals.map((h, i) => {
              const rating = Number(h.overallRating);
              return (
                <Link
                  key={h.slug}
                  href={`/oncadre/hospitals/${h.slug}`}
                  className="group flex items-center gap-4 rounded-xl bg-white p-4 transition-all duration-200 hover:scale-[1.005] sm:p-5"
                  style={{
                    border: "1px solid #E8EBF0",
                    boxShadow:
                      "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
                  }}
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                    style={{
                      background:
                        i === 0
                          ? "linear-gradient(135deg, #D4AF37, #C4A030)"
                          : i === 1
                            ? "linear-gradient(135deg, #9CA3AF, #6B7280)"
                            : i === 2
                              ? "linear-gradient(135deg, #CD7F32, #B5651D)"
                              : "#F3F4F6",
                      color: i < 3 ? "white" : "#6B7280",
                    }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-[#0B3C5D] truncate">
                      {h.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {FACILITY_TYPE_LABELS[h.type] ?? h.type} / {h.city}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-2xl font-bold ${ratingColor(rating)}`}
                    >
                      {rating.toFixed(1)}
                    </span>
                    <p className="text-[10px] text-gray-400">
                      {h.totalReviews} reviews
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Cross-links */}
        <div className="mb-10 flex flex-wrap gap-3">
          <Link
            href="/oncadre/hospitals/best"
            className="rounded-lg border border-[#E8EBF0] bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            National rankings
          </Link>
          <Link
            href={`/oncadre/states/${slug}`}
            className="rounded-lg border border-[#E8EBF0] bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            All hospitals in {stateName}
          </Link>
          <Link
            href="/oncadre/hospitals/compare"
            className="rounded-lg border border-[#E8EBF0] bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Compare hospitals
          </Link>
        </div>

        {/* CTA */}
        <div className="rounded-xl bg-[#0B3C5D] p-8 text-center text-white sm:p-10">
          <h2 className="text-xl font-bold sm:text-2xl">
            Work in {stateName}?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-white/80">
            Your anonymous review helps colleagues find better workplaces and
            holds hospitals accountable.
          </p>
          <Link
            href="/oncadre/register"
            className="mt-6 inline-flex rounded-lg bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-[#0B3C5D] transition hover:bg-[#C4A030]"
          >
            Write a review
          </Link>
        </div>
      </div>
    </main>
  );
}
