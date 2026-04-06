import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCadreLabel } from "@/lib/cadreHealth/cadres";

export const dynamic = "force-dynamic";

/* ─── SEO Metadata ─────────────────────────────────────────────────────────── */

export const metadata: Metadata = {
  title:
    "Healthcare Salaries in Nigeria 2026 | Real Data from Verified Professionals | CadreHealth",
  description:
    "What do Nigerian doctors, nurses, pharmacists, and other healthcare professionals actually earn? Real salary data from verified professionals across 73+ facilities.",
  keywords: [
    "doctor salary Nigeria",
    "nurse salary Lagos",
    "pharmacist salary Nigeria",
    "healthcare salary Nigeria 2026",
    "medical doctor salary Nigeria",
    "house officer salary Nigeria",
    "registrar salary Nigeria",
    "consultant salary Nigeria",
    "nurse salary Nigeria",
    "lab scientist salary Nigeria",
    "healthcare pay Nigeria",
    "hospital salary data",
    "CadreHealth",
  ].join(", "),
  openGraph: {
    title:
      "Healthcare Salaries in Nigeria 2026 | Real Data from Verified Professionals",
    description:
      "What do Nigerian doctors, nurses, pharmacists, and other healthcare professionals actually earn? Real salary data from verified professionals across 73+ facilities.",
    type: "website",
    url: "https://consultforafrica.com/oncadre/salaries",
    siteName: "CadreHealth by Consult For Africa",
    locale: "en_NG",
  },
  twitter: {
    card: "summary_large_image",
    title: "Healthcare Salaries in Nigeria 2026 | CadreHealth",
    description:
      "Real salary data from verified healthcare professionals across 73+ Nigerian facilities.",
  },
  alternates: {
    canonical: "https://consultforafrica.com/oncadre/salaries",
  },
};

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

function formatSalary(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/* ─── Page ─────────────────────────────────────────────────────────────────── */

export default async function SalariesPage() {
  // Aggregate salary data by cadre
  const salaryData = await prisma.cadreSalaryReport.groupBy({
    by: ["cadre"],
    _count: { id: true },
    _min: { baseSalary: true },
    _max: { baseSalary: true },
    _avg: { baseSalary: true },
    orderBy: { _count: { id: "desc" } },
  });

  const hasSalaryData = salaryData.length > 0;

  // JSON-LD: DataCatalog
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DataCatalog",
    name: "Nigerian Healthcare Salary Data",
    description:
      "Aggregated salary data for healthcare professionals in Nigeria, reported by verified professionals on CadreHealth.",
    url: "https://consultforafrica.com/oncadre/salaries",
    provider: {
      "@type": "Organization",
      name: "CadreHealth by Consult For Africa",
      url: "https://consultforafrica.com",
    },
    ...(hasSalaryData
      ? {
          dataset: salaryData.map((d) => ({
            "@type": "Dataset",
            name: `${getCadreLabel(d.cadre)} Salary Data - Nigeria`,
            description: `Salary data for ${getCadreLabel(d.cadre)} professionals in Nigeria based on ${d._count.id} reports.`,
          })),
        }
      : {}),
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
          <span className="text-gray-900 font-medium">Salaries</span>
        </nav>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Healthcare Salaries in Nigeria
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-gray-600">
            What do Nigerian healthcare professionals actually earn? Real salary
            data reported anonymously by verified professionals across 73+
            facilities.
          </p>
        </div>

        {/* Salary Table / Cards */}
        {hasSalaryData ? (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-xl border border-[#E8EBF0] bg-white sm:block"
              style={{
                boxShadow:
                  "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
              }}
            >
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E8EBF0] bg-[#F8F9FB]">
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Cadre
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Reports
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Min Base Salary
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Avg Base Salary
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Max Base Salary
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8EBF0]">
                  {salaryData.map((row) => (
                    <tr
                      key={row.cadre}
                      className="transition hover:bg-[#F8F9FB]"
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/oncadre/cadre/${row.cadre.toLowerCase().replace(/_/g, "-")}`}
                          className="text-sm font-medium text-[#0B3C5D] hover:underline"
                        >
                          {getCadreLabel(row.cadre)}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-600">
                        {row._count.id}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-700">
                        {row._min.baseSalary
                          ? formatSalary(Number(row._min.baseSalary))
                          : "-"}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                        {row._avg.baseSalary
                          ? formatSalary(Number(row._avg.baseSalary))
                          : "-"}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-700">
                        {row._max.baseSalary
                          ? formatSalary(Number(row._max.baseSalary))
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 sm:hidden">
              {salaryData.map((row) => (
                <Link
                  key={row.cadre}
                  href={`/oncadre/cadre/${row.cadre.toLowerCase().replace(/_/g, "-")}`}
                  className="block rounded-xl border border-[#E8EBF0] bg-white p-4"
                  style={{
                    boxShadow:
                      "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {getCadreLabel(row.cadre)}
                    </h3>
                    <span className="rounded-full bg-[#0B3C5D]/8 px-2.5 py-0.5 text-xs text-[#0B3C5D]">
                      {row._count.id} reports
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-400">
                        Min
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-gray-700">
                        {row._min.baseSalary
                          ? formatSalary(Number(row._min.baseSalary))
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-400">
                        Avg
                      </p>
                      <p className="mt-0.5 text-xs font-semibold text-gray-900">
                        {row._avg.baseSalary
                          ? formatSalary(Number(row._avg.baseSalary))
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-400">
                        Max
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-gray-700">
                        {row._max.baseSalary
                          ? formatSalary(Number(row._max.baseSalary))
                          : "-"}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          /* No salary data yet */
          <div
            className="rounded-xl border border-[#E8EBF0] bg-white p-10 text-center sm:p-14"
            style={{
              boxShadow:
                "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
            }}
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#D4AF37]/10">
              <svg
                className="h-8 w-8 text-[#D4AF37]"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="mt-5 text-xl font-bold text-gray-900">
              Salary Data Coming Soon
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-gray-600 leading-relaxed">
              We are collecting salary reports from verified healthcare
              professionals across Nigeria. Soon you will be able to see real
              compensation data broken down by cadre, facility type, state, and
              years of experience.
            </p>
            <p className="mx-auto mt-4 max-w-md text-sm text-gray-500 leading-relaxed">
              Be among the first to contribute. Your data is anonymous and helps
              every healthcare worker negotiate better.
            </p>
            <Link
              href="/oncadre/register"
              className="mt-6 inline-flex items-center rounded-lg bg-[#0B3C5D] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0A3350]"
            >
              Submit your salary data
            </Link>
          </div>
        )}

        {/* Gated section: facility-level breakdowns */}
        <div className="mt-10 relative overflow-hidden rounded-xl border border-[#E8EBF0] bg-white"
          style={{
            boxShadow:
              "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
          }}
        >
          {/* Blurred mockup */}
          <div className="p-6 sm:p-8 blur-sm select-none pointer-events-none" aria-hidden="true">
            <h3 className="text-lg font-semibold text-gray-900">
              Salary by Facility
            </h3>
            <div className="mt-4 space-y-3">
              {[
                "Lagos University Teaching Hospital",
                "University College Hospital Ibadan",
                "National Hospital Abuja",
              ].map((name) => (
                <div
                  key={name}
                  className="flex items-center justify-between rounded-lg bg-[#F8F9FB] px-4 py-3"
                >
                  <span className="text-sm text-gray-700">{name}</span>
                  <span className="text-sm font-semibold text-gray-900">
                    N250,000 - N1,200,000
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Overlay CTA */}
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-[2px]">
            <div className="text-center px-6">
              <svg
                className="mx-auto h-10 w-10 text-[#0B3C5D]"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
              <h3 className="mt-3 text-lg font-bold text-gray-900">
                See facility-level breakdowns
              </h3>
              <p className="mt-2 max-w-sm text-sm text-gray-600">
                Filter salaries by facility, city, and years of experience.
                Register and contribute your own salary data to unlock full
                access.
              </p>
              <Link
                href="/oncadre/register"
                className="mt-4 inline-flex items-center rounded-lg bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-[#0B3C5D] transition hover:bg-[#C4A030]"
              >
                Register to unlock
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 rounded-xl bg-[#0B3C5D] p-8 text-center text-white sm:p-10">
          <h2 className="text-xl font-bold sm:text-2xl">
            Help build Nigeria's salary transparency
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-white/80">
            Anonymous salary data from healthcare professionals like you helps
            everyone negotiate fair compensation. It takes 2 minutes.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/oncadre/register"
              className="rounded-lg bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-[#0B3C5D] transition hover:bg-[#C4A030]"
            >
              Submit your salary
            </Link>
            <Link
              href="/oncadre/hospitals"
              className="rounded-lg border border-white/30 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Browse hospital reviews
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
