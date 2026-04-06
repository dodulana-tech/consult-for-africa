import { prisma } from "@/lib/prisma";
import { getCadreLabel } from "@/lib/cadreHealth/cadres";
import Link from "next/link";
import type { Metadata } from "next";
import type { CadreMandateType, CadreProfessionalCadre } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

export const metadata: Metadata = {
  title: "Healthcare Jobs in Nigeria | CadreHealth",
  description:
    "Browse open healthcare positions across Nigeria. Permanent, locum, and contract roles for doctors, nurses, pharmacists, and all cadres.",
  openGraph: {
    title: "Healthcare Jobs in Nigeria | CadreHealth",
    description:
      "Browse open healthcare positions across Nigeria. Find your next role on CadreHealth.",
  },
};

interface SearchParams {
  cadre?: string;
  state?: string;
  type?: string;
  q?: string;
}

function formatSalary(min?: Decimal | null, max?: Decimal | null, currency?: string | null): string | null {
  if (!min && !max) return null;
  const cur = currency || "NGN";
  const fmt = (n: Decimal) => {
    const val = Number(n);
    if (val >= 1_000_000) return `${cur} ${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `${cur} ${(val / 1_000).toFixed(0)}k`;
    return `${cur} ${val.toLocaleString()}`;
  };
  if (min && max) return `${fmt(min)} - ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}

const MANDATE_TYPE_LABELS: Record<string, string> = {
  PERMANENT: "Permanent",
  LOCUM: "Locum",
  CONTRACT: "Contract",
  CONSULTING: "Consulting",
  INTERNATIONAL: "International",
};

const URGENCY_COLORS: Record<string, { bg: string; text: string }> = {
  URGENT: { bg: "rgba(239,68,68,0.08)", text: "#DC2626" },
  HIGH: { bg: "rgba(245,158,11,0.08)", text: "#D97706" },
  MEDIUM: { bg: "rgba(59,130,246,0.08)", text: "#2563EB" },
  LOW: { bg: "rgba(107,114,128,0.08)", text: "#6B7280" },
};

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe",
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara",
  "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau",
  "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

export default async function JobBoardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { cadre, state, type, q } = params;

  // Build where clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    status: "OPEN",
    isPublished: true,
  };

  if (cadre) where.cadre = cadre as CadreProfessionalCadre;
  if (state) where.locationState = state;
  if (type) where.type = type as CadreMandateType;
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { facilityName: { contains: q, mode: "insensitive" } },
    ];
  }

  const jobs = await prisma.cadreMandate.findMany({
    where,
    include: { facility: { select: { name: true, slug: true, state: true, city: true } } },
    orderBy: [{ createdAt: "desc" }],
    take: 50,
  });

  // JSON-LD for each job posting
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: jobs.map((job, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      item: {
        "@type": "JobPosting",
        title: job.title,
        description: job.description || job.title,
        datePosted: job.createdAt.toISOString(),
        employmentType: job.type === "PERMANENT" ? "FULL_TIME" : job.type === "LOCUM" ? "TEMPORARY" : "CONTRACT",
        hiringOrganization: {
          "@type": "Organization",
          name: job.facility?.name || job.facilityName || "CadreHealth Partner",
        },
        jobLocation: {
          "@type": "Place",
          address: {
            "@type": "PostalAddress",
            addressLocality: job.locationCity || undefined,
            addressRegion: job.locationState || undefined,
            addressCountry: "NG",
          },
        },
        ...(job.salaryRangeMin || job.salaryRangeMax
          ? {
              baseSalary: {
                "@type": "MonetaryAmount",
                currency: job.salaryCurrency || "NGN",
                value: {
                  "@type": "QuantitativeValue",
                  ...(job.salaryRangeMin ? { minValue: Number(job.salaryRangeMin) } : {}),
                  ...(job.salaryRangeMax ? { maxValue: Number(job.salaryRangeMax) } : {}),
                  unitText: "MONTH",
                },
              },
            }
          : {}),
        url: `https://consultforafrica.com/oncadre/jobs/${job.id}`,
      },
    })),
  };

  return (
    <main className="bg-[#F8F9FB] min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section
        className="relative overflow-hidden text-white py-16 sm:py-20"
        style={{ background: "#0B3C5D" }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 70% at 70% 30%, rgba(14,77,110,0.5) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 40% 50% at 80% 10%, rgba(212,175,55,0.1) 0%, transparent 55%)",
          }}
        />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
          <p
            className="text-xs font-medium uppercase tracking-[0.2em]"
            style={{ color: "#D4AF37" }}
          >
            CadreHealth Job Board
          </p>
          <h1
            className="mt-3 font-bold text-white leading-tight"
            style={{ fontSize: "clamp(1.6rem, 4vw, 2.5rem)" }}
          >
            Healthcare Jobs in Nigeria
          </h1>
          <p
            className="mt-3 max-w-xl text-base"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            Permanent, locum, and contract positions for doctors, nurses,
            pharmacists, and every healthcare cadre.
          </p>
        </div>
      </section>

      {/* Filter bar */}
      <section className="sticky top-0 z-40 bg-white" style={{ borderBottom: "1px solid #E8EBF0" }}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-4">
          <form className="flex flex-wrap gap-3">
            <input
              type="text"
              name="q"
              defaultValue={q || ""}
              placeholder="Search jobs..."
              className="flex-1 min-w-[180px] rounded-xl bg-[#F8F9FB] px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B3C5D]/20"
              style={{ border: "1px solid #E8EBF0" }}
            />
            <select
              name="cadre"
              defaultValue={cadre || ""}
              className="rounded-xl bg-[#F8F9FB] px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0B3C5D]/20"
              style={{ border: "1px solid #E8EBF0" }}
            >
              <option value="">All Cadres</option>
              {[
                "MEDICINE", "NURSING", "MIDWIFERY", "PHARMACY", "DENTISTRY",
                "MEDICAL_LABORATORY_SCIENCE", "RADIOGRAPHY_IMAGING", "REHABILITATION_THERAPY",
                "OPTOMETRY", "COMMUNITY_HEALTH", "ENVIRONMENTAL_HEALTH", "NUTRITION_DIETETICS",
                "PSYCHOLOGY_SOCIAL_WORK", "PUBLIC_HEALTH", "HEALTH_ADMINISTRATION",
              ].map((c) => (
                <option key={c} value={c}>
                  {getCadreLabel(c)}
                </option>
              ))}
            </select>
            <select
              name="state"
              defaultValue={state || ""}
              className="rounded-xl bg-[#F8F9FB] px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0B3C5D]/20"
              style={{ border: "1px solid #E8EBF0" }}
            >
              <option value="">All States</option>
              {NIGERIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              name="type"
              defaultValue={type || ""}
              className="rounded-xl bg-[#F8F9FB] px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0B3C5D]/20"
              style={{ border: "1px solid #E8EBF0" }}
            >
              <option value="">All Types</option>
              {Object.entries(MANDATE_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ background: "#0B3C5D" }}
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Job listings */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        {jobs.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center" style={{ border: "1px solid #E8EBF0" }}>
            <p className="text-lg font-semibold text-gray-700">No open positions found</p>
            <p className="mt-2 text-sm text-gray-400">
              Try adjusting your filters, or check back soon for new opportunities.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              {jobs.length} open position{jobs.length !== 1 ? "s" : ""}
            </p>
            {jobs.map((job) => {
              const salary = formatSalary(job.salaryRangeMin, job.salaryRangeMax, job.salaryCurrency);
              const facilityName = job.facility?.name || job.facilityName || "Confidential";
              const location = [job.locationCity, job.locationState].filter(Boolean).join(", ") || "Nigeria";
              const urgencyStyle = job.urgency ? URGENCY_COLORS[job.urgency] : null;

              return (
                <Link
                  key={job.id}
                  href={`/oncadre/jobs/${job.id}`}
                  className="group block rounded-2xl bg-white p-6 transition-all duration-200 hover:scale-[1.005]"
                  style={{
                    border: "1px solid #E8EBF0",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-semibold text-gray-900 group-hover:text-[#0B3C5D] transition-colors">
                        {job.title}
                      </h2>
                      <p className="mt-1 text-sm text-gray-500">{facilityName}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span
                          className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                          style={{ background: "rgba(11,60,93,0.06)", color: "#0B3C5D" }}
                        >
                          {getCadreLabel(job.cadre)}
                        </span>
                        <span
                          className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                          style={{ background: "rgba(107,114,128,0.06)", color: "#4B5563" }}
                        >
                          {MANDATE_TYPE_LABELS[job.type] || job.type}
                        </span>
                        <span
                          className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                          style={{ background: "rgba(107,114,128,0.06)", color: "#6B7280" }}
                        >
                          {location}
                        </span>
                        {urgencyStyle && (
                          <span
                            className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                            style={{ background: urgencyStyle.bg, color: urgencyStyle.text }}
                          >
                            {job.urgency}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {salary && (
                        <p className="text-sm font-semibold text-gray-900">{salary}</p>
                      )}
                      <span
                        className="rounded-lg px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                        style={{ background: "#0B3C5D" }}
                      >
                        View &amp; Apply
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Bottom CTA */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-16">
        <div
          className="rounded-2xl p-8 sm:p-10 text-center"
          style={{
            background: "linear-gradient(135deg, #0B3C5D 0%, #0E4D6E 100%)",
            boxShadow: "0 4px 24px rgba(11,60,93,0.18)",
          }}
        >
          <h2 className="text-xl font-bold text-white sm:text-2xl">
            Looking for talent?
          </h2>
          <p
            className="mt-2 text-sm"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            Post a role on CadreHealth and reach thousands of verified healthcare professionals.
          </p>
          <Link
            href="/oncadre/employer/register"
            className="mt-6 inline-flex items-center rounded-lg px-6 py-3 text-sm font-semibold transition hover:opacity-90"
            style={{ background: "#D4AF37", color: "#06090f" }}
          >
            Post a Role
          </Link>
        </div>
      </section>
    </main>
  );
}
