import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  EXAM_GUIDES,
  getExamBySlug,
  getAllExamSlugs,
} from "@/lib/cadreHealth/examData";
import DataDisclaimer from "@/components/cadrehealth/DataDisclaimer";

/* ─── Static Params ────────────────────────────────────────────────────────── */

export function generateStaticParams() {
  return getAllExamSlugs().map((slug) => ({ slug }));
}

/* ─── Dynamic Metadata ─────────────────────────────────────────────────────── */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const exam = getExamBySlug(slug);
  if (!exam) return {};

  const title = `${exam.name} Exam Guide for Nigerian Healthcare Professionals | CadreHealth`;
  const description = `${exam.fullName} preparation guide. ${exam.format}. Cost: ${exam.cost} (${exam.costNaira}). ${exam.canTakeInNigeria ? "Available in Nigeria." : "Travel required."} Registration steps, tips, and resources.`;

  return {
    title,
    description,
    keywords: [
      `${exam.name} exam Nigeria`,
      `${exam.name} preparation`,
      `${exam.name} cost Nigeria`,
      `${exam.name} registration`,
      `${exam.name} test centre Nigeria`,
      `${exam.fullName}`,
      "healthcare exam Nigeria",
      "CadreHealth",
    ].join(", "),
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://consultforafrica.com/oncadre/exams/${slug}`,
      siteName: "CadreHealth by Consult For Africa",
      locale: "en_NG",
    },
    twitter: {
      card: "summary_large_image",
      title: `${exam.name} Exam Guide | CadreHealth`,
      description,
    },
    alternates: {
      canonical: `https://consultforafrica.com/oncadre/exams/${slug}`,
    },
  };
}

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

const difficultyConfig = {
  moderate: { label: "Moderate", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  hard: { label: "Hard", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  "very-hard": { label: "Very Hard", color: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
};

/* ─── Page ─────────────────────────────────────────────────────────────────── */

export default async function ExamDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const exam = getExamBySlug(slug);
  if (!exam) notFound();

  const diff = difficultyConfig[exam.difficulty];

  const relatedExams = exam.relatedExams
    .map((s) => EXAM_GUIDES.find((e) => e.slug === s))
    .filter(Boolean);

  // JSON-LD: Course schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: `${exam.fullName} Preparation Guide`,
    description: exam.description,
    url: `https://consultforafrica.com/oncadre/exams/${exam.slug}`,
    provider: {
      "@type": "Organization",
      name: exam.administeredBy,
    },
    offers: {
      "@type": "Offer",
      price: exam.cost.replace(/[^0-9.]/g, "") || "0",
      priceCurrency: exam.cost.includes("GBP")
        ? "GBP"
        : exam.cost.includes("USD")
          ? "USD"
          : exam.cost.includes("AUD")
            ? "AUD"
            : "NGN",
      description: `Exam fee: ${exam.cost} (${exam.costNaira})`,
    },
    educationalCredentialAwarded: exam.name,
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: exam.canTakeInNigeria ? "onsite" : "onsite",
      location: exam.canTakeInNigeria
        ? {
            "@type": "Place",
            name: exam.testCentresInNigeria?.[0] || "Nigeria",
            address: { "@type": "PostalAddress", addressCountry: "NG" },
          }
        : {
            "@type": "Place",
            name: "International test centre",
          },
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
            href="/oncadre/exams"
            className="hover:text-[#0B3C5D] transition"
          >
            Exam Guides
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{exam.name}</span>
        </nav>

        {/* Hero */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${diff.bg} ${diff.color} ${diff.border}`}
            >
              {diff.label}
            </span>
            {exam.canTakeInNigeria ? (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Available in Nigeria
              </span>
            ) : (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                Travel required
              </span>
            )}
            <span className="rounded-full border border-[#E8EBF0] bg-white px-3 py-1 text-xs font-medium text-gray-500">
              {exam.category === "international"
                ? "International"
                : "Nigerian Professional"}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            {exam.fullName}
          </h1>
          <p className="mt-2 text-sm font-medium text-gray-400 uppercase tracking-wide">
            Administered by {exam.administeredBy}
          </p>
          <p className="mt-4 max-w-3xl text-lg text-gray-600 leading-relaxed">
            {exam.description}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Facts */}
            <section
              className="rounded-xl border border-[#E8EBF0] bg-white p-6 sm:p-8"
              style={{
                boxShadow:
                  "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
              }}
            >
              <h2 className="text-lg font-bold text-gray-900 mb-5">
                Quick Facts
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { label: "Format", value: exam.format },
                  { label: "Duration", value: exam.duration },
                  { label: "Passing Score", value: exam.passingScore },
                  { label: "Valid For", value: exam.validFor },
                  { label: "Cost", value: `${exam.cost}` },
                  { label: "Cost in Naira", value: exam.costNaira },
                ].map((fact) => (
                  <div
                    key={fact.label}
                    className="rounded-lg bg-[#F8F9FB] p-4 border border-[#E8EBF0]/60"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      {fact.label}
                    </p>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {fact.value}
                    </p>
                  </div>
                ))}
              </div>
              {exam.canTakeInNigeria && exam.testCentresInNigeria && (
                <div className="mt-5 rounded-lg bg-emerald-50 border border-emerald-200 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 mb-2">
                    Test Centres in Nigeria
                  </p>
                  <ul className="space-y-1">
                    {exam.testCentresInNigeria.map((centre) => (
                      <li
                        key={centre}
                        className="flex items-center gap-2 text-sm text-emerald-800"
                      >
                        <svg
                          className="h-3.5 w-3.5 text-emerald-500 shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                          />
                        </svg>
                        {centre}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            {/* Exam Sections */}
            <section
              className="rounded-xl border border-[#E8EBF0] bg-white p-6 sm:p-8"
              style={{
                boxShadow:
                  "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
              }}
            >
              <h2 className="text-lg font-bold text-gray-900 mb-5">
                What is Tested
              </h2>
              <div className="space-y-4">
                {exam.sections.map((section, i) => (
                  <div
                    key={section.name}
                    className="rounded-lg border border-[#E8EBF0] p-5"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0B3C5D] text-xs font-bold text-white">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900">
                          {section.name}
                        </h3>
                        <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                          {section.description}
                        </p>
                        {(section.questionCount ||
                          section.duration ||
                          section.passingScore) && (
                          <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
                            {section.questionCount && (
                              <span className="rounded-full bg-[#F8F9FB] px-2.5 py-1 border border-[#E8EBF0]">
                                {section.questionCount} questions
                              </span>
                            )}
                            {section.duration && (
                              <span className="rounded-full bg-[#F8F9FB] px-2.5 py-1 border border-[#E8EBF0]">
                                {section.duration}
                              </span>
                            )}
                            {section.passingScore && (
                              <span className="rounded-full bg-[#F8F9FB] px-2.5 py-1 border border-[#E8EBF0]">
                                Pass: {section.passingScore}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Registration Steps */}
            <section
              className="rounded-xl border border-[#E8EBF0] bg-white p-6 sm:p-8"
              style={{
                boxShadow:
                  "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
              }}
            >
              <h2 className="text-lg font-bold text-gray-900 mb-5">
                How to Register
              </h2>
              <ol className="space-y-4">
                {exam.registrationSteps.map((step, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/10 text-sm font-bold text-[#D4AF37] border border-[#D4AF37]/20">
                      {i + 1}
                    </span>
                    <p className="pt-1 text-sm text-gray-700 leading-relaxed">
                      {step}
                    </p>
                  </li>
                ))}
              </ol>
            </section>

            {/* Nigerian-Specific Tips */}
            <section
              className="rounded-xl border-2 border-[#D4AF37]/30 bg-[#D4AF37]/5 p-6 sm:p-8"
            >
              <div className="flex items-center gap-2 mb-5">
                <svg
                  className="h-5 w-5 text-[#D4AF37]"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
                  />
                </svg>
                <h2 className="text-lg font-bold text-gray-900">
                  Tips for Nigerian Candidates
                </h2>
              </div>
              <ul className="space-y-3">
                {exam.nigerianSpecificTips.map((tip, i) => (
                  <li key={i} className="flex gap-3">
                    <svg
                      className="h-4 w-4 mt-0.5 shrink-0 text-[#D4AF37]"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12.75L11.25 15 15 9.75"
                      />
                    </svg>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {tip}
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            {/* Preparation Tips */}
            <section
              className="rounded-xl border border-[#E8EBF0] bg-white p-6 sm:p-8"
              style={{
                boxShadow:
                  "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
              }}
            >
              <h2 className="text-lg font-bold text-gray-900 mb-5">
                Preparation Tips
              </h2>
              <ul className="space-y-3">
                {exam.preparationTips.map((tip, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0B3C5D]" />
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {tip}
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            {/* Recommended Resources */}
            <section
              className="rounded-xl border border-[#E8EBF0] bg-white p-6 sm:p-8"
              style={{
                boxShadow:
                  "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
              }}
            >
              <h2 className="text-lg font-bold text-gray-900 mb-5">
                Recommended Resources
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {exam.recommendedResources.map((resource, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg bg-[#F8F9FB] px-4 py-3 border border-[#E8EBF0]/60"
                  >
                    <svg
                      className="h-4 w-4 shrink-0 text-[#0B3C5D]"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                      />
                    </svg>
                    <span className="text-sm text-gray-700">{resource}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Cost Breakdown */}
            <section
              className="rounded-xl border border-[#E8EBF0] bg-white p-6 sm:p-8"
              style={{
                boxShadow:
                  "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
              }}
            >
              <h2 className="text-lg font-bold text-gray-900 mb-5">
                Cost Breakdown
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-[#0B3C5D]/5 border border-[#0B3C5D]/10 p-5 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#0B3C5D]/60">
                    Exam Fee
                  </p>
                  <p className="mt-2 text-xl font-bold text-[#0B3C5D]">
                    {exam.cost}
                  </p>
                </div>
                <div className="rounded-lg bg-[#D4AF37]/5 border border-[#D4AF37]/20 p-5 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
                    In Naira
                  </p>
                  <p className="mt-2 text-xl font-bold text-gray-900">
                    {exam.costNaira}
                  </p>
                </div>
              </div>
              {!exam.canTakeInNigeria && (
                <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-4">
                  <p className="text-sm text-amber-800">
                    <span className="font-semibold">Travel required.</span> This
                    exam cannot be taken in Nigeria. Budget additional funds for
                    flights, accommodation, visa, and living expenses.
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {/* Who Needs It */}
            <div
              className="rounded-xl border border-[#E8EBF0] bg-white p-5"
              style={{
                boxShadow:
                  "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
              }}
            >
              <h3 className="text-sm font-bold text-gray-900 mb-3">
                Who Needs This Exam
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {exam.whoNeedsIt}
              </p>
            </div>

            {/* Related Exams */}
            {relatedExams.length > 0 && (
              <div
                className="rounded-xl border border-[#E8EBF0] bg-white p-5"
                style={{
                  boxShadow:
                    "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
                }}
              >
                <h3 className="text-sm font-bold text-gray-900 mb-3">
                  Related Exams
                </h3>
                <div className="space-y-2">
                  {relatedExams.map((related) =>
                    related ? (
                      <Link
                        key={related.slug}
                        href={`/oncadre/exams/${related.slug}`}
                        className="flex items-center justify-between rounded-lg bg-[#F8F9FB] px-4 py-3 border border-[#E8EBF0]/60 text-sm transition hover:border-[#D4AF37]/40"
                      >
                        <span className="font-medium text-gray-900">
                          {related.name}
                        </span>
                        <svg
                          className="h-4 w-4 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8.25 4.5l7.5 7.5-7.5 7.5"
                          />
                        </svg>
                      </Link>
                    ) : null,
                  )}
                </div>
              </div>
            )}

            {/* Related Migration Pathways */}
            {(() => {
              const examCountryMap: Record<string, { slug: string; label: string; flag: string }[]> = {
                "plab-1": [{ slug: "uk", label: "United Kingdom", flag: "🇬🇧" }],
                "plab-2": [{ slug: "uk", label: "United Kingdom", flag: "🇬🇧" }],
                "usmle-step-1": [{ slug: "us", label: "United States", flag: "🇺🇸" }],
                "usmle-step-2-ck": [{ slug: "us", label: "United States", flag: "🇺🇸" }],
                "nmc-cbt": [{ slug: "uk", label: "United Kingdom", flag: "🇬🇧" }],
                "nmc-osce": [{ slug: "uk", label: "United Kingdom", flag: "🇬🇧" }],
                "amc-mcq": [{ slug: "australia", label: "Australia", flag: "🇦🇺" }],
                "prometric": [{ slug: "saudi-arabia", label: "Saudi Arabia", flag: "🇸🇦" }],
              };
              const countries = examCountryMap[slug] || [];
              if (countries.length === 0) return null;
              return (
                <div
                  className="rounded-xl border border-[#E8EBF0] bg-white p-5"
                  style={{
                    boxShadow:
                      "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
                  }}
                >
                  <h3 className="text-sm font-bold text-gray-900 mb-3">
                    Related Migration Pathways
                  </h3>
                  <div className="space-y-2">
                    {countries.map((c) => (
                      <Link
                        key={c.slug}
                        href={`/oncadre/migrate/${c.slug}`}
                        className="flex items-center gap-3 rounded-lg bg-[#F8F9FB] px-4 py-3 border border-[#E8EBF0]/60 text-sm transition hover:border-[#D4AF37]/40"
                      >
                        <span className="text-lg">{c.flag}</span>
                        <span className="font-medium text-gray-900">
                          Work in {c.label}
                        </span>
                        <svg
                          className="ml-auto h-4 w-4 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8.25 4.5l7.5 7.5-7.5 7.5"
                          />
                        </svg>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* CTA: Readiness Score */}
            <div className="rounded-xl bg-[#0B3C5D] p-5 text-white">
              <h3 className="text-sm font-bold">Check your readiness score</h3>
              <p className="mt-2 text-xs text-white/70 leading-relaxed">
                Find out how prepared you are for this exam and get personalised
                recommendations for your career path.
              </p>
              <Link
                href="/oncadre/readiness"
                className="mt-4 block rounded-lg bg-[#D4AF37] px-4 py-2.5 text-center text-sm font-semibold text-[#0B3C5D] transition hover:bg-[#C4A030]"
              >
                Take the assessment
              </Link>
            </div>

            {/* CTA: Join */}
            <div
              className="rounded-xl border border-[#E8EBF0] bg-white p-5"
              style={{
                boxShadow:
                  "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
              }}
            >
              <h3 className="text-sm font-bold text-gray-900">
                Join CadreHealth
              </h3>
              <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                Connect with other healthcare professionals preparing for exams.
                Access salary data, hospital reviews, and career guidance.
              </p>
              <Link
                href="/oncadre/register"
                className="mt-4 block rounded-lg border border-[#0B3C5D] px-4 py-2.5 text-center text-sm font-semibold text-[#0B3C5D] transition hover:bg-[#0B3C5D] hover:text-white"
              >
                Join free
              </Link>
            </div>
          </div>
        </div>
      </div>
      {/* Disclaimer */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 pb-10">
        <DataDisclaimer
          sources={[
            { name: exam.administeredBy, url: "#" },
          ]}
        />
      </div>
    </main>
  );
}
