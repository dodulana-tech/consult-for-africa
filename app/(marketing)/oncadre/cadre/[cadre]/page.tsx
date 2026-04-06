import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  CADRE_DEFINITIONS,
  getCadreByValue,
  getCadreLabel,
  type CadreDefinition,
} from "@/lib/cadreHealth/cadres";

export const dynamic = "force-dynamic";

/* ─── Route helpers ────────────────────────────────────────────────────────── */

/** Map URL slug (lowercase, hyphenated) back to the enum value (UPPER_SNAKE) */
function slugToValue(slug: string): string {
  return slug.toUpperCase().replace(/-/g, "_");
}

function valueToSlug(value: string): string {
  return value.toLowerCase().replace(/_/g, "-");
}

/* ─── Static Params (16 cadres) ────────────────────────────────────────────── */

export function generateStaticParams() {
  return CADRE_DEFINITIONS.map((c) => ({
    cadre: valueToSlug(c.value),
  }));
}

/* ─── SEO titles per cadre ─────────────────────────────────────────────────── */

function cadreSeoTitle(c: CadreDefinition): string {
  const titles: Record<string, string> = {
    MEDICINE: "Doctor Jobs & Salary Data in Nigeria",
    DENTISTRY: "Dentist Jobs & Salary Data in Nigeria",
    NURSING: "Nursing Jobs & Salary Data in Nigeria",
    MIDWIFERY: "Midwifery Jobs & Salary Data in Nigeria",
    PHARMACY: "Pharmacist Jobs & Salary Data in Nigeria",
    MEDICAL_LABORATORY_SCIENCE: "Lab Scientist Jobs & Salary Data in Nigeria",
    RADIOGRAPHY_IMAGING: "Radiographer Jobs & Salary Data in Nigeria",
    REHABILITATION_THERAPY: "Physiotherapy & Rehab Jobs in Nigeria",
    OPTOMETRY: "Optometrist Jobs & Salary Data in Nigeria",
    COMMUNITY_HEALTH: "Community Health Jobs & Salary Data in Nigeria",
    ENVIRONMENTAL_HEALTH: "Environmental Health Jobs in Nigeria",
    NUTRITION_DIETETICS: "Dietitian & Nutrition Jobs in Nigeria",
    PSYCHOLOGY_SOCIAL_WORK: "Psychology & Social Work Jobs in Nigeria",
    PUBLIC_HEALTH: "Public Health Jobs & Salary Data in Nigeria",
    HEALTH_ADMINISTRATION: "Health Admin Jobs & Salary Data in Nigeria",
    BIOMEDICAL_ENGINEERING: "Biomedical Engineering Jobs in Nigeria",
  };
  return titles[c.value] ?? `${c.label} Jobs & Salary Data in Nigeria`;
}

/* ─── Metadata ─────────────────────────────────────────────────────────────── */

interface Props {
  params: Promise<{ cadre: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { cadre: slug } = await params;
  const cadre = getCadreByValue(slugToValue(slug));
  if (!cadre) return { title: "Cadre Not Found | CadreHealth" };

  const title = `${cadreSeoTitle(cadre)} | CadreHealth`;
  const description = `Explore ${cadre.label.toLowerCase()} careers in Nigeria. Real salary data, hospital reviews, sub-specialty listings, and career readiness assessment for ${cadre.shortLabel.toLowerCase()} professionals. Regulated by ${cadre.regulatoryAbbrev}.`;

  const keywords = [
    `${cadre.shortLabel.toLowerCase()} salary Nigeria`,
    `${cadre.label.toLowerCase()} jobs Nigeria`,
    `${cadre.shortLabel.toLowerCase()} jobs Lagos`,
    `${cadre.shortLabel.toLowerCase()} salary 2026`,
    `${cadre.regulatoryAbbrev} registration`,
    `${cadre.label.toLowerCase()} career Nigeria`,
    ...cadre.subSpecialties.slice(0, 5).map((s) => `${s.toLowerCase()} Nigeria`),
    "CadreHealth",
  ].join(", ");

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://consultforafrica.com/oncadre/cadre/${slug}`,
      siteName: "CadreHealth by Consult For Africa",
      locale: "en_NG",
    },
    twitter: {
      card: "summary",
      title: `${cadreSeoTitle(cadre)} | CadreHealth`,
      description,
    },
    alternates: {
      canonical: `https://consultforafrica.com/oncadre/cadre/${slug}`,
    },
  };
}

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

export default async function CadrePage({ params }: Props) {
  const { cadre: slug } = await params;
  const cadre = getCadreByValue(slugToValue(slug));
  if (!cadre) notFound();

  // Count professionals
  const professionalCount = await prisma.cadreProfessional.count({
    where: { cadre: slugToValue(slug) as never },
  });

  // Salary data for this cadre
  const salaryAgg = await prisma.cadreSalaryReport.aggregate({
    where: { cadre: slugToValue(slug) as never },
    _count: { id: true },
    _min: { baseSalary: true },
    _max: { baseSalary: true },
    _avg: { baseSalary: true },
  });

  const hasSalary = salaryAgg._count.id > 0;

  // Related hospital reviews (facilities with reviews from this cadre)
  const relatedFacilities = await prisma.cadreFacility.findMany({
    where: {
      reviews: {
        some: {
          cadreAtFacility: slugToValue(slug) as never,
          isApproved: true,
        },
      },
    },
    orderBy: { totalReviews: "desc" },
    take: 6,
    select: {
      name: true,
      slug: true,
      state: true,
      city: true,
      overallRating: true,
      totalReviews: true,
    },
  });

  // JSON-LD: Occupation schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Occupation",
    name: cadre.label,
    description: `${cadre.label} professionals in Nigeria, regulated by ${cadre.regulatoryBody} (${cadre.regulatoryAbbrev}).`,
    occupationLocation: {
      "@type": "Country",
      name: "Nigeria",
    },
    ...(hasSalary
      ? {
          estimatedSalary: {
            "@type": "MonetaryAmountDistribution",
            name: `Base salary for ${cadre.label} in Nigeria`,
            currency: "NGN",
            duration: "P1M",
            minValue: Number(salaryAgg._min.baseSalary),
            maxValue: Number(salaryAgg._max.baseSalary),
            median: Number(salaryAgg._avg.baseSalary),
          },
        }
      : {}),
    qualifications: `Regulated by ${cadre.regulatoryBody} (${cadre.regulatoryAbbrev})`,
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
          <Link href="/oncadre/salaries" className="hover:text-[#0B3C5D] transition">
            Salaries
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{cadre.label}</span>
        </nav>

        {/* Header */}
        <div
          className="rounded-xl border border-[#E8EBF0] bg-white p-6 sm:p-8"
          style={{
            boxShadow:
              "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
          }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                {cadreSeoTitle(cadre)}
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Regulated by{" "}
                <span className="font-medium text-gray-700">
                  {cadre.regulatoryBody}
                </span>{" "}
                ({cadre.regulatoryAbbrev})
              </p>
            </div>
            {professionalCount > 0 && (
              <div className="shrink-0 rounded-lg bg-[#0B3C5D]/5 px-4 py-3 text-center">
                <div className="text-2xl font-bold text-[#0B3C5D]">
                  {professionalCount.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">on CadreHealth</div>
              </div>
            )}
          </div>
        </div>

        {/* Salary Data */}
        <div
          className="mt-6 rounded-xl border border-[#E8EBF0] bg-white p-6 sm:p-8"
          style={{
            boxShadow:
              "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
          }}
        >
          <h2 className="text-lg font-semibold text-gray-900">
            Salary Overview
          </h2>

          {hasSalary ? (
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg bg-[#F8F9FB] p-4 text-center">
                <p className="text-[10px] uppercase tracking-wider text-gray-400">
                  Reports
                </p>
                <p className="mt-1 text-lg font-bold text-gray-900">
                  {salaryAgg._count.id}
                </p>
              </div>
              <div className="rounded-lg bg-[#F8F9FB] p-4 text-center">
                <p className="text-[10px] uppercase tracking-wider text-gray-400">
                  Min
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-700">
                  {formatSalary(Number(salaryAgg._min.baseSalary))}
                </p>
              </div>
              <div className="rounded-lg bg-[#F8F9FB] p-4 text-center">
                <p className="text-[10px] uppercase tracking-wider text-gray-400">
                  Average
                </p>
                <p className="mt-1 text-sm font-bold text-[#0B3C5D]">
                  {formatSalary(Number(salaryAgg._avg.baseSalary))}
                </p>
              </div>
              <div className="rounded-lg bg-[#F8F9FB] p-4 text-center">
                <p className="text-[10px] uppercase tracking-wider text-gray-400">
                  Max
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-700">
                  {formatSalary(Number(salaryAgg._max.baseSalary))}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-dashed border-gray-300 py-8 text-center">
              <p className="text-sm text-gray-500">
                No salary data for {cadre.label} yet. Be the first to
                contribute.
              </p>
              <Link
                href="/oncadre/register"
                className="mt-3 inline-flex text-sm font-medium text-[#0B3C5D] hover:underline"
              >
                Submit your salary data
              </Link>
            </div>
          )}
        </div>

        {/* Sub-specialties */}
        <div
          className="mt-6 rounded-xl border border-[#E8EBF0] bg-white p-6 sm:p-8"
          style={{
            boxShadow:
              "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
          }}
        >
          <h2 className="text-lg font-semibold text-gray-900">
            Sub-specialties
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {cadre.subSpecialties.map((spec) => (
              <span
                key={spec}
                className="rounded-full border border-[#E8EBF0] bg-[#F8F9FB] px-3 py-1.5 text-xs text-gray-700"
              >
                {spec}
              </span>
            ))}
          </div>
        </div>

        {/* Related Hospital Reviews */}
        {relatedFacilities.length > 0 && (
          <div
            className="mt-6 rounded-xl border border-[#E8EBF0] bg-white p-6 sm:p-8"
            style={{
              boxShadow:
                "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
            }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Hospital Reviews from {cadre.shortLabel} Staff
              </h2>
              <Link
                href="/oncadre/hospitals"
                className="text-sm font-medium text-[#0B3C5D] hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {relatedFacilities.map((f) => (
                <Link
                  key={f.slug}
                  href={`/oncadre/hospitals/${f.slug}`}
                  className="group flex items-center justify-between rounded-lg border border-[#E8EBF0] p-4 transition hover:border-[#0B3C5D]/20"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-[#0B3C5D] truncate">
                      {f.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {f.city}, {f.state}
                    </p>
                  </div>
                  {f.overallRating && (
                    <div className="ml-3 shrink-0 text-right">
                      <span className="text-sm font-bold text-[#D4AF37]">
                        {Number(f.overallRating).toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {" "}
                        / 5
                      </span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTAs */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link
            href="/oncadre/readiness"
            className="flex flex-col items-center rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 p-6 text-center transition hover:border-[#D4AF37]/60"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#D4AF37]/20">
              <svg
                className="h-6 w-6 text-[#D4AF37]"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="mt-3 text-base font-semibold text-gray-900">
              Check your readiness score
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Free 2-minute assessment for {cadre.shortLabel.toLowerCase()}{" "}
              professionals. Instant results.
            </p>
          </Link>

          <Link
            href="/oncadre/register"
            className="flex flex-col items-center rounded-xl border border-[#0B3C5D]/20 bg-[#0B3C5D]/5 p-6 text-center transition hover:border-[#0B3C5D]/40"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0B3C5D]/10">
              <svg
                className="h-6 w-6 text-[#0B3C5D]"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18 18.72a9.094 9.094 0 003.741-6.72A9 9 0 1012 21a8.966 8.966 0 006-2.28z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z"
                />
              </svg>
            </div>
            <h3 className="mt-3 text-base font-semibold text-gray-900">
              Join {professionalCount > 0 ? professionalCount.toLocaleString() : ""}{" "}
              {cadre.label} professionals
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Create your free profile, access salary data, and connect with
              opportunities.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
