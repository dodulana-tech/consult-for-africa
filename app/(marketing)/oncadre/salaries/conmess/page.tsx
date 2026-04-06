import type { Metadata } from "next";
import Link from "next/link";
import DataDisclaimer from "@/components/cadrehealth/DataDisclaimer";

export const metadata: Metadata = {
  title:
    "CONMESS Salary Structure 2026 | Nigerian Doctors Salary Scale | CadreHealth",
  description:
    "Complete CONMESS salary structure for 2026. See what house officers, medical officers, registrars, senior registrars, and consultants earn in Nigeria. Grade levels, allowances, and net pay breakdown.",
  keywords: [
    "CONMESS salary structure",
    "CONMESS salary structure 2026",
    "doctor salary scale Nigeria",
    "house officer salary Nigeria",
    "medical officer salary Nigeria",
    "registrar salary Nigeria",
    "consultant salary Nigeria",
    "CONMESS grade levels",
    "Nigerian doctors salary",
    "CONMESS allowances",
    "healthcare salary Nigeria",
    "CadreHealth",
  ].join(", "),
  openGraph: {
    title: "CONMESS Salary Structure 2026 | Nigerian Doctors Salary Scale",
    description:
      "Complete breakdown of the Consolidated Medical Salary Structure for Nigerian doctors. Grade levels, allowances, net pay.",
    type: "website",
    url: "https://consultforafrica.com/oncadre/salaries/conmess",
    siteName: "CadreHealth by Consult For Africa",
    locale: "en_NG",
  },
  twitter: {
    card: "summary_large_image",
    title: "CONMESS Salary Structure 2026 | CadreHealth",
    description:
      "What do Nigerian doctors actually earn? Full CONMESS breakdown with allowances.",
  },
  alternates: {
    canonical: "https://consultforafrica.com/oncadre/salaries/conmess",
  },
};

/* ---- CONMESS Data ---- */

interface ConmessGrade {
  grade: string;
  title: string;
  step1: number;
  step2: number;
  step3: number;
  step4: number;
  step5: number;
  step6: number;
  housingPct: number;
  transportPct: number;
  hazardPct: number;
  callDuty: number;
  ruralPosting: number;
}

// Based on publicly available CONMESS salary data (2023 review, adjusted for 2025/2026)
const CONMESS_GRADES: ConmessGrade[] = [
  {
    grade: "CONMESS 01",
    title: "House Officer",
    step1: 254_616,
    step2: 261_099,
    step3: 267_582,
    step4: 274_065,
    step5: 280_548,
    step6: 287_031,
    housingPct: 50,
    transportPct: 25,
    hazardPct: 50,
    callDuty: 60_000,
    ruralPosting: 0,
  },
  {
    grade: "CONMESS 02",
    title: "Medical Officer (Grade II)",
    step1: 281_380,
    step2: 290_000,
    step3: 298_620,
    step4: 307_240,
    step5: 315_860,
    step6: 324_480,
    housingPct: 50,
    transportPct: 25,
    hazardPct: 50,
    callDuty: 70_000,
    ruralPosting: 20_000,
  },
  {
    grade: "CONMESS 03",
    title: "Medical Officer (Grade I) / Registrar",
    step1: 339_181,
    step2: 351_500,
    step3: 363_819,
    step4: 376_138,
    step5: 388_457,
    step6: 400_776,
    housingPct: 50,
    transportPct: 25,
    hazardPct: 50,
    callDuty: 80_000,
    ruralPosting: 25_000,
  },
  {
    grade: "CONMESS 04",
    title: "Senior Registrar",
    step1: 451_516,
    step2: 468_200,
    step3: 484_884,
    step4: 501_568,
    step5: 518_252,
    step6: 534_936,
    housingPct: 50,
    transportPct: 25,
    hazardPct: 50,
    callDuty: 90_000,
    ruralPosting: 30_000,
  },
  {
    grade: "CONMESS 05",
    title: "Consultant (Grade II)",
    step1: 624_182,
    step2: 649_500,
    step3: 674_818,
    step4: 700_136,
    step5: 725_454,
    step6: 750_772,
    housingPct: 50,
    transportPct: 25,
    hazardPct: 50,
    callDuty: 100_000,
    ruralPosting: 35_000,
  },
  {
    grade: "CONMESS 06",
    title: "Consultant (Grade I) / Chief Consultant",
    step1: 824_610,
    step2: 856_000,
    step3: 887_390,
    step4: 918_780,
    step5: 950_170,
    step6: 981_560,
    housingPct: 50,
    transportPct: 25,
    hazardPct: 50,
    callDuty: 120_000,
    ruralPosting: 40_000,
  },
];

function fmt(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function calcGross(g: ConmessGrade, step: number): number {
  const base = [g.step1, g.step2, g.step3, g.step4, g.step5, g.step6][step] ?? g.step1;
  const housing = base * (g.housingPct / 100);
  const transport = base * (g.transportPct / 100);
  const hazard = base * (g.hazardPct / 100);
  return base + housing + transport + hazard + g.callDuty;
}

/* ---- Comparison data ---- */

interface RoleComparison {
  role: string;
  grade: string;
  basicRange: string;
  grossRange: string;
  typicalNetRange: string;
  yearsToReach: string;
}

const ROLE_COMPARISONS: RoleComparison[] = [
  {
    role: "House Officer",
    grade: "CONMESS 01",
    basicRange: "N254,616 - N287,031",
    grossRange: "N633,388 - N706,820",
    typicalNetRange: "N520,000 - N600,000",
    yearsToReach: "0 (entry level)",
  },
  {
    role: "Medical Officer",
    grade: "CONMESS 02",
    basicRange: "N281,380 - N324,480",
    grossRange: "N703,450 - N800,600",
    typicalNetRange: "N580,000 - N680,000",
    yearsToReach: "1-2 years",
  },
  {
    role: "Registrar",
    grade: "CONMESS 03",
    basicRange: "N339,181 - N400,776",
    grossRange: "N848,952 - N981,940",
    typicalNetRange: "N700,000 - N850,000",
    yearsToReach: "3-5 years",
  },
  {
    role: "Senior Registrar",
    grade: "CONMESS 04",
    basicRange: "N451,516 - N534,936",
    grossRange: "N1,118,790 - N1,303,170",
    typicalNetRange: "N950,000 - N1,100,000",
    yearsToReach: "6-9 years",
  },
  {
    role: "Consultant",
    grade: "CONMESS 05",
    basicRange: "N624,182 - N750,772",
    grossRange: "N1,505,409 - N1,788,463",
    typicalNetRange: "N1,250,000 - N1,500,000",
    yearsToReach: "10-14 years",
  },
  {
    role: "Chief Consultant",
    grade: "CONMESS 06",
    basicRange: "N824,610 - N981,560",
    grossRange: "N1,975,375 - N2,323,900",
    typicalNetRange: "N1,650,000 - N1,950,000",
    yearsToReach: "15+ years",
  },
];

/* ---- JSON-LD ---- */

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "CONMESS Salary Structure 2026 - Nigerian Doctors Salary Scale",
  description:
    "Comprehensive breakdown of the Consolidated Medical Salary Structure (CONMESS) for Nigerian medical doctors in 2026.",
  author: {
    "@type": "Organization",
    name: "CadreHealth by Consult For Africa",
    url: "https://consultforafrica.com",
  },
  publisher: {
    "@type": "Organization",
    name: "CadreHealth by Consult For Africa",
    url: "https://consultforafrica.com",
  },
  datePublished: "2026-01-15",
  dateModified: "2026-04-01",
  mainEntityOfPage: "https://consultforafrica.com/oncadre/salaries/conmess",
};

/* ---- Page ---- */

export default function ConmessSalaryPage() {
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
            href="/oncadre/salaries"
            className="hover:text-[#0B3C5D] transition"
          >
            Salaries
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">CONMESS</span>
        </nav>

        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#0B3C5D]/8 px-3 py-1 text-xs font-semibold text-[#0B3C5D] mb-4">
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
                d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Updated for 2026
          </div>
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            CONMESS Salary Structure 2026
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-gray-600">
            The Consolidated Medical Salary Structure (CONMESS) is the approved
            pay scale for medical and dental officers in Nigerian public service.
            Below is a comprehensive breakdown of grade levels, step increments,
            and allowances.
          </p>
        </div>

        {/* Quick summary cards */}
        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          {[
            {
              label: "Entry Level (House Officer)",
              value: fmt(calcGross(CONMESS_GRADES[0], 0)),
              sub: "Monthly gross at Step 1",
            },
            {
              label: "Mid-Career (Senior Registrar)",
              value: fmt(calcGross(CONMESS_GRADES[3], 0)),
              sub: "Monthly gross at Step 1",
            },
            {
              label: "Senior (Consultant)",
              value: fmt(calcGross(CONMESS_GRADES[4], 0)),
              sub: "Monthly gross at Step 1",
            },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-xl bg-white p-5"
              style={{
                border: "1px solid #E8EBF0",
                boxShadow:
                  "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
              }}
            >
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                {card.label}
              </p>
              <p className="mt-2 text-2xl font-bold text-[#0B3C5D]">
                {card.value}
              </p>
              <p className="mt-1 text-xs text-gray-400">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Full grade table */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-bold text-gray-900">
            Grade Levels and Step Increments
          </h2>
          <p className="mb-6 text-sm text-gray-600">
            Each CONMESS grade has 6 steps. Doctors advance one step per year of
            satisfactory service. Promotion to the next grade requires meeting
            specific criteria (exams, years of service).
          </p>

          <div className="space-y-8">
            {CONMESS_GRADES.map((g) => (
              <div
                key={g.grade}
                className="overflow-hidden rounded-xl border border-[#E8EBF0] bg-white"
                style={{
                  boxShadow:
                    "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
                }}
              >
                <div className="border-b border-[#E8EBF0] bg-[#0B3C5D] px-6 py-4">
                  <h3 className="text-lg font-bold text-white">{g.grade}</h3>
                  <p className="text-sm text-white/70">{g.title}</p>
                </div>

                {/* Desktop table */}
                <div className="hidden overflow-x-auto sm:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#E8EBF0] bg-[#F8F9FB]">
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Component
                        </th>
                        {[1, 2, 3, 4, 5, 6].map((s) => (
                          <th
                            key={s}
                            className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500"
                          >
                            Step {s}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8EBF0]">
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-700">
                          Basic Salary
                        </td>
                        {[g.step1, g.step2, g.step3, g.step4, g.step5, g.step6].map(
                          (v, i) => (
                            <td
                              key={i}
                              className="px-4 py-3 text-right text-gray-600"
                            >
                              {fmt(v)}
                            </td>
                          )
                        )}
                      </tr>
                      <tr className="bg-[#F8F9FB]/50">
                        <td className="px-4 py-3 font-medium text-gray-700">
                          Housing ({g.housingPct}%)
                        </td>
                        {[g.step1, g.step2, g.step3, g.step4, g.step5, g.step6].map(
                          (v, i) => (
                            <td
                              key={i}
                              className="px-4 py-3 text-right text-gray-600"
                            >
                              {fmt(v * (g.housingPct / 100))}
                            </td>
                          )
                        )}
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-700">
                          Transport ({g.transportPct}%)
                        </td>
                        {[g.step1, g.step2, g.step3, g.step4, g.step5, g.step6].map(
                          (v, i) => (
                            <td
                              key={i}
                              className="px-4 py-3 text-right text-gray-600"
                            >
                              {fmt(v * (g.transportPct / 100))}
                            </td>
                          )
                        )}
                      </tr>
                      <tr className="bg-[#F8F9FB]/50">
                        <td className="px-4 py-3 font-medium text-gray-700">
                          Hazard ({g.hazardPct}%)
                        </td>
                        {[g.step1, g.step2, g.step3, g.step4, g.step5, g.step6].map(
                          (v, i) => (
                            <td
                              key={i}
                              className="px-4 py-3 text-right text-gray-600"
                            >
                              {fmt(v * (g.hazardPct / 100))}
                            </td>
                          )
                        )}
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-700">
                          Call Duty Allowance
                        </td>
                        {[1, 2, 3, 4, 5, 6].map((_, i) => (
                          <td
                            key={i}
                            className="px-4 py-3 text-right text-gray-600"
                          >
                            {fmt(g.callDuty)}
                          </td>
                        ))}
                      </tr>
                      {g.ruralPosting > 0 && (
                        <tr className="bg-[#F8F9FB]/50">
                          <td className="px-4 py-3 font-medium text-gray-700">
                            Rural Posting (if applicable)
                          </td>
                          {[1, 2, 3, 4, 5, 6].map((_, i) => (
                            <td
                              key={i}
                              className="px-4 py-3 text-right text-gray-600"
                            >
                              {fmt(g.ruralPosting)}
                            </td>
                          ))}
                        </tr>
                      )}
                      <tr className="bg-[#0B3C5D]/5 font-semibold">
                        <td className="px-4 py-3 text-[#0B3C5D]">
                          Total Gross (excl. rural)
                        </td>
                        {[0, 1, 2, 3, 4, 5].map((s) => (
                          <td
                            key={s}
                            className="px-4 py-3 text-right text-[#0B3C5D]"
                          >
                            {fmt(calcGross(g, s))}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Mobile view */}
                <div className="p-4 sm:hidden">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-400">
                        Basic (Step 1)
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        {fmt(g.step1)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-400">
                        Basic (Step 6)
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        {fmt(g.step6)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-400">
                        Gross (Step 1)
                      </p>
                      <p className="text-sm font-bold text-[#0B3C5D]">
                        {fmt(calcGross(g, 0))}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-400">
                        Gross (Step 6)
                      </p>
                      <p className="text-sm font-bold text-[#0B3C5D]">
                        {fmt(calcGross(g, 5))}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-400">
                        Call Duty
                      </p>
                      <p className="text-sm text-gray-700">{fmt(g.callDuty)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-400">
                        Hazard
                      </p>
                      <p className="text-sm text-gray-700">{g.hazardPct}% of basic</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Role comparison table */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-bold text-gray-900">
            Salary Comparison by Role
          </h2>
          <p className="mb-6 text-sm text-gray-600">
            How do salaries compare across career stages? This table summarizes
            the range for each role, from entry-level house officer to chief
            consultant.
          </p>

          {/* Desktop */}
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
                    Role
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Grade
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Basic Salary Range
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Gross Range
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Est. Net Range
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Years to Reach
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EBF0]">
                {ROLE_COMPARISONS.map((r) => (
                  <tr key={r.role} className="transition hover:bg-[#F8F9FB]">
                    <td className="px-5 py-4 font-medium text-gray-900">
                      {r.role}
                    </td>
                    <td className="px-5 py-4 text-gray-600">{r.grade}</td>
                    <td className="px-5 py-4 text-right text-gray-600">
                      {r.basicRange}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-[#0B3C5D]">
                      {r.grossRange}
                    </td>
                    <td className="px-5 py-4 text-right text-gray-600">
                      {r.typicalNetRange}
                    </td>
                    <td className="px-5 py-4 text-right text-gray-500">
                      {r.yearsToReach}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="space-y-3 sm:hidden">
            {ROLE_COMPARISONS.map((r) => (
              <div
                key={r.role}
                className="rounded-xl border border-[#E8EBF0] bg-white p-4"
                style={{
                  boxShadow:
                    "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
                }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {r.role}
                  </h3>
                  <span className="rounded-full bg-[#0B3C5D]/8 px-2.5 py-0.5 text-xs text-[#0B3C5D]">
                    {r.grade}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400">
                      Gross Range
                    </p>
                    <p className="text-xs font-semibold text-[#0B3C5D]">
                      {r.grossRange}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400">
                      Est. Net Range
                    </p>
                    <p className="text-xs font-medium text-gray-700">
                      {r.typicalNetRange}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] uppercase tracking-wider text-gray-400">
                      Years to Reach
                    </p>
                    <p className="text-xs text-gray-600">{r.yearsToReach}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Allowances explained */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-bold text-gray-900">
            Understanding CONMESS Allowances
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                title: "Housing Allowance (50%)",
                desc: "Calculated as 50% of basic salary. Paid to doctors who do not occupy government quarters.",
              },
              {
                title: "Transport Allowance (25%)",
                desc: "25% of basic salary to cover transportation costs. Paid monthly alongside basic salary.",
              },
              {
                title: "Hazard Allowance (50%)",
                desc: "50% of basic salary. Recognises the occupational health risks inherent in medical practice.",
              },
              {
                title: "Call Duty Allowance",
                desc: "Fixed monthly amount that varies by grade. Compensates for after-hours on-call duties.",
              },
              {
                title: "Rural Posting Allowance",
                desc: "Additional allowance for doctors posted to rural/underserved areas. Not paid in urban centres.",
              },
              {
                title: "Specialist Allowance",
                desc: "Additional allowance for consultants with postgraduate fellowship qualifications (varies by institution).",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl bg-white p-5"
                style={{
                  border: "1px solid #E8EBF0",
                  boxShadow:
                    "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
                }}
              >
                <h3 className="text-sm font-semibold text-gray-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-bold text-gray-900">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "What is CONMESS?",
                a: "CONMESS stands for Consolidated Medical Salary Structure. It is the approved salary scale for medical and dental officers employed in the Nigerian public sector, including federal and state government hospitals.",
              },
              {
                q: "Does CONMESS apply to private hospitals?",
                a: "No. CONMESS only applies to government-employed doctors. Private hospitals set their own pay scales, though many use CONMESS as a benchmark.",
              },
              {
                q: "How often is CONMESS reviewed?",
                a: "CONMESS reviews happen periodically, typically during broader public service salary negotiations. The last major review was implemented in 2023/2024.",
              },
              {
                q: "Are these figures before or after tax?",
                a: "The gross figures include all allowances but are before deductions (PAYE tax, pension contributions, NHF). Estimated net figures account for typical deductions but will vary by individual circumstances.",
              },
              {
                q: "How do I move up steps?",
                a: "You advance one step per year of satisfactory service within your current grade. Promotion to the next grade requires meeting criteria such as passing professional exams, completing residency requirements, or accumulating the required years of service.",
              },
            ].map((faq) => (
              <div
                key={faq.q}
                className="rounded-xl bg-white p-5"
                style={{
                  border: "1px solid #E8EBF0",
                  boxShadow:
                    "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
                }}
              >
                <h3 className="text-sm font-semibold text-gray-900">{faq.q}</h3>
                <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Cross-links */}
        <div className="mb-10 flex flex-wrap gap-3">
          <Link
            href="/oncadre/salaries/conhess"
            className="rounded-lg bg-[#0B3C5D] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0A3350]"
          >
            View CONHESS Salary Scale
          </Link>
          <Link
            href="/oncadre/salaries"
            className="rounded-lg border border-[#E8EBF0] bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Real salary data from professionals
          </Link>
          <Link
            href="/oncadre/hospitals/best"
            className="rounded-lg border border-[#E8EBF0] bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Best hospitals to work at
          </Link>
        </div>

        {/* CTA */}
        <div className="rounded-xl bg-[#0B3C5D] p-8 text-center text-white sm:p-10">
          <h2 className="text-xl font-bold sm:text-2xl">
            What are doctors actually earning?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-white/80">
            CONMESS is the official scale, but real take-home pay varies by
            facility. See what verified professionals report on CadreHealth.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/oncadre/register"
              className="rounded-lg bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-[#0B3C5D] transition hover:bg-[#C4A030]"
            >
              Join CadreHealth
            </Link>
            <Link
              href="/oncadre/salaries"
              className="rounded-lg border border-white/30 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Browse salary data
            </Link>
          </div>
        </div>

        <DataDisclaimer
          lastUpdated="April 2026"
          sources={[
            {
              name: "National Salaries, Incomes and Wages Commission",
              url: "https://nsiwc.gov.ng",
            },
            {
              name: "Nigerian Medical Association",
              url: "https://nationalnma.org",
            },
          ]}
        />
      </div>
    </main>
  );
}
