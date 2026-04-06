import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title:
    "Best Hospitals to Work at in Nigeria 2026 | Staff Rankings | CadreHealth",
  description:
    "Ranked list of the best Nigerian hospitals to work at in 2026, based on verified staff reviews. Categories: best teaching hospital, best private hospital, best for pay, best for training.",
  keywords: [
    "best hospitals to work in Nigeria",
    "best hospital Nigeria 2026",
    "best teaching hospital Nigeria",
    "best private hospital Nigeria",
    "hospital rankings Nigeria",
    "hospital staff reviews Nigeria",
    "CadreHealth",
  ].join(", "),
  openGraph: {
    title: "Best Hospitals to Work at in Nigeria 2026 | CadreHealth",
    description:
      "Which Nigerian hospitals treat their staff best? Rankings based on verified staff reviews.",
    type: "website",
    url: "https://consultforafrica.com/oncadre/hospitals/best",
    siteName: "CadreHealth by Consult For Africa",
    locale: "en_NG",
  },
  alternates: {
    canonical: "https://consultforafrica.com/oncadre/hospitals/best",
  },
};

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

function ratingBg(rating: number): string {
  if (rating >= 4) return "bg-emerald-50 border-emerald-200";
  if (rating >= 3) return "bg-amber-50 border-amber-200";
  return "bg-red-50 border-red-200";
}

type FacilityRow = {
  slug: string;
  name: string;
  type: string;
  state: string;
  city: string;
  totalReviews: number;
  overallRating: unknown;
  compensationRating: unknown;
  trainingRating: unknown;
  wouldRecommendPct: unknown;
};

function RankingTable({
  title,
  subtitle,
  hospitals,
}: {
  title: string;
  subtitle: string;
  hospitals: FacilityRow[];
}) {
  if (hospitals.length === 0) return null;

  return (
    <section className="mb-10">
      <h2 className="mb-1 text-lg font-bold text-gray-900">{title}</h2>
      <p className="mb-4 text-sm text-gray-500">{subtitle}</p>
      <div className="space-y-3">
        {hospitals.map((h, i) => {
          const rating = h.overallRating ? Number(h.overallRating) : 0;
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
              {/* Rank */}
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

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 group-hover:text-[#0B3C5D] truncate">
                  {h.name}
                </h3>
                <p className="text-xs text-gray-500">
                  {FACILITY_TYPE_LABELS[h.type] ?? h.type} / {h.city},{" "}
                  {h.state}
                </p>
              </div>

              {/* Rating */}
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
    </section>
  );
}

export default async function BestHospitalsPage() {
  const MIN_REVIEWS = 3;

  // Fetch all qualifying hospitals
  const allHospitals = await prisma.cadreFacility.findMany({
    where: {
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
      wouldRecommendPct: true,
    },
  });

  const overall = allHospitals.slice(0, 20);

  const teaching = allHospitals
    .filter((h) => h.type === "PUBLIC_TERTIARY")
    .slice(0, 10);

  const privateH = allHospitals
    .filter(
      (h) =>
        h.type === "PRIVATE_TERTIARY" ||
        h.type === "PRIVATE_SECONDARY" ||
        h.type === "PRIVATE_CLINIC"
    )
    .slice(0, 10);

  const fmc = allHospitals
    .filter((h) => h.type === "PUBLIC_SECONDARY")
    .slice(0, 10);

  const bestForPay = [...allHospitals]
    .filter((h) => h.compensationRating)
    .sort(
      (a, b) =>
        Number(b.compensationRating) - Number(a.compensationRating)
    )
    .slice(0, 10);

  const bestForTraining = [...allHospitals]
    .filter((h) => h.trainingRating)
    .sort(
      (a, b) => Number(b.trainingRating) - Number(a.trainingRating)
    )
    .slice(0, 10);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Best Hospitals to Work at in Nigeria 2026",
    description:
      "Ranked list of the best Nigerian hospitals to work at based on staff reviews.",
    url: "https://consultforafrica.com/oncadre/hospitals/best",
    numberOfItems: overall.length,
    itemListElement: overall.map((h, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Hospital",
        name: h.name,
        url: `https://consultforafrica.com/oncadre/hospitals/${h.slug}`,
        aggregateRating: h.overallRating
          ? {
              "@type": "AggregateRating",
              ratingValue: Number(h.overallRating).toFixed(1),
              reviewCount: h.totalReviews,
              bestRating: 5,
              worstRating: 1,
            }
          : undefined,
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
          <span className="text-gray-900 font-medium">Best Hospitals</span>
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
            Best Hospitals to Work at in Nigeria
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-gray-600">
            Rankings based on anonymous reviews from verified healthcare
            professionals. Minimum {MIN_REVIEWS} reviews required to qualify.
          </p>
        </div>

        {overall.length === 0 ? (
          <div
            className="rounded-xl bg-white p-10 text-center sm:p-14"
            style={{
              border: "1px solid #E8EBF0",
              boxShadow:
                "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
            }}
          >
            <h2 className="text-xl font-bold text-gray-900">
              Rankings Coming Soon
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-gray-600">
              We need more reviews to generate meaningful rankings. Help by
              reviewing your workplace.
            </p>
            <Link
              href="/oncadre/register"
              className="mt-6 inline-flex rounded-lg bg-[#0B3C5D] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0A3350]"
            >
              Write a review
            </Link>
          </div>
        ) : (
          <>
            <RankingTable
              title="Overall Best Hospitals"
              subtitle="Top 20 hospitals ranked by overall staff rating"
              hospitals={overall as FacilityRow[]}
            />

            <RankingTable
              title="Best Teaching Hospitals"
              subtitle="Top public tertiary hospitals"
              hospitals={teaching as FacilityRow[]}
            />

            <RankingTable
              title="Best Private Hospitals"
              subtitle="Top private hospitals to work at"
              hospitals={privateH as FacilityRow[]}
            />

            <RankingTable
              title="Best Federal Medical Centres"
              subtitle="Top public secondary hospitals"
              hospitals={fmc as FacilityRow[]}
            />

            <RankingTable
              title="Best for Pay"
              subtitle="Highest-rated for compensation and pay timeliness"
              hospitals={bestForPay as FacilityRow[]}
            />

            <RankingTable
              title="Best for Training"
              subtitle="Highest-rated for professional development"
              hospitals={bestForTraining as FacilityRow[]}
            />
          </>
        )}

        {/* State links */}
        <section className="mb-10">
          <h2 className="mb-4 text-lg font-bold text-gray-900">
            Browse by State
          </h2>
          <div className="flex flex-wrap gap-2">
            {[
              "Lagos",
              "FCT Abuja",
              "Rivers",
              "Oyo",
              "Kaduna",
              "Kano",
              "Enugu",
              "Delta",
              "Edo",
              "Ogun",
              "Anambra",
              "Cross River",
            ].map((s) => (
              <Link
                key={s}
                href={`/oncadre/hospitals/best/${s.toLowerCase().replace(/\s+/g, "-")}`}
                className="rounded-full border border-[#E8EBF0] bg-white px-4 py-2 text-xs font-medium text-gray-700 transition hover:border-[#0B3C5D] hover:text-[#0B3C5D]"
              >
                {s}
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="rounded-xl bg-[#0B3C5D] p-8 text-center text-white sm:p-10">
          <h2 className="text-xl font-bold sm:text-2xl">
            Help improve these rankings
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
