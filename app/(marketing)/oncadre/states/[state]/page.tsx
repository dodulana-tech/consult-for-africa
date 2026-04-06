import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NIGERIAN_STATES } from "@/lib/cadreHealth/cadres";

export const dynamic = "force-dynamic";

/* ---- Static params ---- */

function stateToSlug(state: string): string {
  return state.toLowerCase().replace(/\s+/g, "-");
}

function slugToState(slug: string): string | undefined {
  return NIGERIAN_STATES.find(
    (s) => stateToSlug(s) === slug.toLowerCase()
  );
}

export function generateStaticParams() {
  return NIGERIAN_STATES.map((state) => ({
    state: stateToSlug(state),
  }));
}

/* ---- SEO Metadata ---- */

interface Props {
  params: Promise<{ state: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state: slug } = await params;
  const stateName = slugToState(slug);
  if (!stateName)
    return { title: "State Not Found | CadreHealth" };

  return {
    title: `Healthcare Jobs in ${stateName} | Hospitals, Salaries & Reviews | CadreHealth`,
    description: `Find hospitals, salary data, and staff reviews in ${stateName}, Nigeria. See top-rated facilities and real compensation data from verified healthcare professionals.`,
    keywords: [
      `hospitals in ${stateName}`,
      `healthcare jobs ${stateName}`,
      `doctor salary ${stateName}`,
      `nurse salary ${stateName}`,
      `hospital reviews ${stateName}`,
      `best hospitals ${stateName}`,
      `healthcare ${stateName} Nigeria`,
      "CadreHealth",
    ].join(", "),
    openGraph: {
      title: `Healthcare in ${stateName} | Hospitals, Salaries & Reviews`,
      description: `Hospitals, salary data, and staff reviews in ${stateName}, Nigeria.`,
      type: "website",
      url: `https://consultforafrica.com/oncadre/states/${slug}`,
      siteName: "CadreHealth by Consult For Africa",
      locale: "en_NG",
    },
    alternates: {
      canonical: `https://consultforafrica.com/oncadre/states/${slug}`,
    },
  };
}

/* ---- Helpers ---- */

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

function fmt(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/* ---- Page ---- */

export default async function StateDirectoryPage({ params }: Props) {
  const { state: slug } = await params;
  const stateName = slugToState(slug);
  if (!stateName) notFound();

  // Fetch hospitals in this state
  const hospitals = await prisma.cadreFacility.findMany({
    where: { state: stateName },
    orderBy: [{ overallRating: "desc" }, { totalReviews: "desc" }],
    select: {
      slug: true,
      name: true,
      type: true,
      city: true,
      state: true,
      overallRating: true,
      totalReviews: true,
      compensationRating: true,
    },
  });

  // Count professionals in this state
  const profCount = await prisma.cadreProfessional.count({
    where: { state: stateName },
  });

  // Salary aggregates for state
  const salaryAgg = await prisma.cadreSalaryReport.aggregate({
    where: { state: stateName },
    _avg: { baseSalary: true },
    _min: { baseSalary: true },
    _max: { baseSalary: true },
    _count: { id: true },
  });

  const topHospitals = hospitals.filter(
    (h) => h.totalReviews >= 3 && h.overallRating
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Healthcare in ${stateName}, Nigeria`,
    description: `Hospitals, healthcare salaries, and staff reviews in ${stateName}.`,
    url: `https://consultforafrica.com/oncadre/states/${slug}`,
    provider: {
      "@type": "Organization",
      name: "CadreHealth by Consult For Africa",
    },
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

      <div className="mx-auto max-w-5xl px-4 sm:px-6">
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
          <span className="text-gray-900 font-medium">{stateName}</span>
        </nav>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Healthcare in {stateName}
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-gray-600">
            Hospitals, salary data, and staff reviews from healthcare
            professionals in {stateName}, Nigeria.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-10 grid gap-4 sm:grid-cols-4">
          <div
            className="rounded-xl bg-white p-5"
            style={{
              border: "1px solid #E8EBF0",
              boxShadow:
                "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
            }}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Hospitals
            </p>
            <p className="mt-2 text-3xl font-bold text-[#0B3C5D]">
              {hospitals.length}
            </p>
          </div>
          <div
            className="rounded-xl bg-white p-5"
            style={{
              border: "1px solid #E8EBF0",
              boxShadow:
                "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
            }}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Professionals
            </p>
            <p className="mt-2 text-3xl font-bold text-[#0B3C5D]">
              {profCount}
            </p>
          </div>
          <div
            className="rounded-xl bg-white p-5"
            style={{
              border: "1px solid #E8EBF0",
              boxShadow:
                "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
            }}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Avg. Salary
            </p>
            <p className="mt-2 text-3xl font-bold text-[#0B3C5D]">
              {salaryAgg._avg.baseSalary
                ? fmt(Number(salaryAgg._avg.baseSalary))
                : "--"}
            </p>
          </div>
          <div
            className="rounded-xl bg-white p-5"
            style={{
              border: "1px solid #E8EBF0",
              boxShadow:
                "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
            }}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Salary Reports
            </p>
            <p className="mt-2 text-3xl font-bold text-[#0B3C5D]">
              {salaryAgg._count.id}
            </p>
          </div>
        </div>

        {/* Top rated hospitals */}
        {topHospitals.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-4 text-xl font-bold text-gray-900">
              Top-Rated Hospitals in {stateName}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {topHospitals.slice(0, 6).map((h, i) => (
                <Link
                  key={h.slug}
                  href={`/oncadre/hospitals/${h.slug}`}
                  className="group rounded-xl bg-white p-5 transition-all duration-200 hover:scale-[1.01]"
                  style={{
                    border: "1px solid #E8EBF0",
                    boxShadow:
                      "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/10 text-xs font-bold text-[#D4AF37]">
                          {i + 1}
                        </span>
                        <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-[#0B3C5D]">
                          {h.name}
                        </h3>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {FACILITY_TYPE_LABELS[h.type] ?? h.type} / {h.city}
                      </p>
                    </div>
                    {h.overallRating && (
                      <span
                        className={`text-lg font-bold ${ratingColor(Number(h.overallRating))}`}
                      >
                        {Number(h.overallRating).toFixed(1)}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-gray-400">
                    {h.totalReviews} review{h.totalReviews !== 1 ? "s" : ""}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* All hospitals */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-bold text-gray-900">
            All Hospitals in {stateName}
          </h2>
          {hospitals.length > 0 ? (
            <>
              {/* Desktop table */}
              <div
                className="hidden overflow-hidden rounded-xl border border-[#E8EBF0] bg-white sm:block"
                style={{
                  boxShadow:
                    "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
                }}
              >
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#E8EBF0] bg-[#F8F9FB]">
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Hospital
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Type
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        City
                      </th>
                      <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Rating
                      </th>
                      <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Reviews
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8EBF0]">
                    {hospitals.map((h) => (
                      <tr
                        key={h.slug}
                        className="transition hover:bg-[#F8F9FB]"
                      >
                        <td className="px-5 py-4">
                          <Link
                            href={`/oncadre/hospitals/${h.slug}`}
                            className="font-medium text-[#0B3C5D] hover:underline"
                          >
                            {h.name}
                          </Link>
                        </td>
                        <td className="px-5 py-4 text-gray-600">
                          {FACILITY_TYPE_LABELS[h.type] ?? h.type}
                        </td>
                        <td className="px-5 py-4 text-gray-600">{h.city}</td>
                        <td className="px-5 py-4 text-right">
                          {h.overallRating ? (
                            <span
                              className={`font-semibold ${ratingColor(Number(h.overallRating))}`}
                            >
                              {Number(h.overallRating).toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-gray-400">--</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right text-gray-600">
                          {h.totalReviews}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="space-y-3 sm:hidden">
                {hospitals.map((h) => (
                  <Link
                    key={h.slug}
                    href={`/oncadre/hospitals/${h.slug}`}
                    className="block rounded-xl border border-[#E8EBF0] bg-white p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">
                          {h.name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {FACILITY_TYPE_LABELS[h.type] ?? h.type} / {h.city}
                        </p>
                      </div>
                      {h.overallRating && (
                        <span
                          className={`text-lg font-bold ${ratingColor(Number(h.overallRating))}`}
                        >
                          {Number(h.overallRating).toFixed(1)}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div
              className="rounded-xl bg-white p-8 text-center"
              style={{ border: "1px solid #E8EBF0" }}
            >
              <p className="text-sm text-gray-600">
                No hospitals listed in {stateName} yet. Be the first to add one.
              </p>
              <Link
                href="/oncadre/refer-facility"
                className="mt-4 inline-flex items-center rounded-lg bg-[#0B3C5D] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0A3350]"
              >
                Add a facility
              </Link>
            </div>
          )}
        </section>

        {/* Salary overview */}
        {salaryAgg._count.id > 0 && (
          <section className="mb-12">
            <h2 className="mb-4 text-xl font-bold text-gray-900">
              Salary Overview in {stateName}
            </h2>
            <div
              className="grid gap-4 rounded-xl bg-white p-6 sm:grid-cols-3"
              style={{
                border: "1px solid #E8EBF0",
                boxShadow:
                  "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
              }}
            >
              <div className="text-center">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Min Reported
                </p>
                <p className="mt-1 text-xl font-bold text-gray-900">
                  {salaryAgg._min.baseSalary
                    ? fmt(Number(salaryAgg._min.baseSalary))
                    : "--"}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Average
                </p>
                <p className="mt-1 text-xl font-bold text-[#0B3C5D]">
                  {salaryAgg._avg.baseSalary
                    ? fmt(Number(salaryAgg._avg.baseSalary))
                    : "--"}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Max Reported
                </p>
                <p className="mt-1 text-xl font-bold text-gray-900">
                  {salaryAgg._max.baseSalary
                    ? fmt(Number(salaryAgg._max.baseSalary))
                    : "--"}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Cross-links */}
        <div className="mb-10 flex flex-wrap gap-3">
          <Link
            href="/oncadre/salaries"
            className="rounded-lg border border-[#E8EBF0] bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            All salary data
          </Link>
          <Link
            href="/oncadre/hospitals/best"
            className="rounded-lg border border-[#E8EBF0] bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Best hospitals nationally
          </Link>
          <Link
            href={`/oncadre/hospitals/best/${slug}`}
            className="rounded-lg border border-[#E8EBF0] bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Best hospitals in {stateName}
          </Link>
        </div>

        {/* CTA */}
        <div className="rounded-xl bg-[#0B3C5D] p-8 text-center text-white sm:p-10">
          <h2 className="text-xl font-bold sm:text-2xl">
            Work in healthcare in {stateName}?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-white/80">
            Join CadreHealth to share your salary, review your facility, and
            connect with opportunities in {stateName}.
          </p>
          <Link
            href="/oncadre/register"
            className="mt-6 inline-flex rounded-lg bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-[#0B3C5D] transition hover:bg-[#C4A030]"
          >
            Join CadreHealth
          </Link>
        </div>
      </div>
    </main>
  );
}
