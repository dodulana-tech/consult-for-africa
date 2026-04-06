import type { Metadata } from "next";
import Link from "next/link";
import DataDisclaimer from "@/components/cadrehealth/DataDisclaimer";

export const metadata: Metadata = {
  title:
    "CONHESS Salary Structure 2026 | Nurses, Pharmacists, Lab Scientists Salary | CadreHealth",
  description:
    "Complete CONHESS salary structure for 2026. What nurses, pharmacists, lab scientists, radiographers, and physiotherapists earn in Nigeria. Grade levels, allowances, and net pay.",
  keywords: [
    "CONHESS salary structure",
    "CONHESS salary structure 2026",
    "nurse salary Nigeria",
    "pharmacist salary Nigeria",
    "lab scientist salary Nigeria",
    "radiographer salary Nigeria",
    "physiotherapist salary Nigeria",
    "dietitian salary Nigeria",
    "CONHESS grade levels",
    "healthcare salary scale Nigeria",
    "CadreHealth",
  ].join(", "),
  openGraph: {
    title:
      "CONHESS Salary Structure 2026 | Nurses, Pharmacists, Lab Scientists Salary",
    description:
      "Complete breakdown of the Consolidated Health Salary Structure for Nigerian healthcare professionals. Grade levels, allowances, net pay.",
    type: "website",
    url: "https://consultforafrica.com/oncadre/salaries/conhess",
    siteName: "CadreHealth by Consult For Africa",
    locale: "en_NG",
  },
  twitter: {
    card: "summary_large_image",
    title: "CONHESS Salary Structure 2026 | CadreHealth",
    description:
      "What do Nigerian nurses, pharmacists, and lab scientists earn? Full CONHESS breakdown.",
  },
  alternates: {
    canonical: "https://consultforafrica.com/oncadre/salaries/conhess",
  },
};

/* ---- CONHESS Data ---- */

interface ConhessGrade {
  level: number;
  title: string;
  roles: string[];
  step1: number;
  step2: number;
  step3: number;
  step4: number;
  step5: number;
  step6: number;
  housingPct: number;
  transportPct: number;
  hazardPct: number;
}

// Based on publicly available CONHESS salary data (2023 review, adjusted for 2025/2026)
// CONHESS covers levels 01-15, but healthcare professionals typically enter at 06-08
const CONHESS_GRADES: ConhessGrade[] = [
  {
    level: 6,
    title: "Health Assistant / Intern",
    roles: ["Health Assistant", "Student Nurse Intern", "Lab Intern"],
    step1: 73_890,
    step2: 76_200,
    step3: 78_510,
    step4: 80_820,
    step5: 83_130,
    step6: 85_440,
    housingPct: 50,
    transportPct: 25,
    hazardPct: 50,
  },
  {
    level: 7,
    title: "Health Technician",
    roles: [
      "Nursing Officer II",
      "Pharmacy Technician",
      "Lab Technician",
      "Community Health Officer",
    ],
    step1: 89_610,
    step2: 93_100,
    step3: 96_590,
    step4: 100_080,
    step5: 103_570,
    step6: 107_060,
    housingPct: 50,
    transportPct: 25,
    hazardPct: 50,
  },
  {
    level: 8,
    title: "Entry Professional",
    roles: [
      "Nursing Officer I",
      "Pharmacist II",
      "Medical Lab Scientist II",
      "Radiographer II",
      "Physiotherapist II",
      "Dietitian II",
    ],
    step1: 122_850,
    step2: 128_300,
    step3: 133_750,
    step4: 139_200,
    step5: 144_650,
    step6: 150_100,
    housingPct: 50,
    transportPct: 25,
    hazardPct: 50,
  },
  {
    level: 9,
    title: "Professional Grade II",
    roles: [
      "Senior Nursing Officer",
      "Pharmacist I",
      "Medical Lab Scientist I",
      "Radiographer I",
      "Physiotherapist I",
      "Dietitian I",
    ],
    step1: 157_470,
    step2: 164_500,
    step3: 171_530,
    step4: 178_560,
    step5: 185_590,
    step6: 192_620,
    housingPct: 50,
    transportPct: 25,
    hazardPct: 50,
  },
  {
    level: 10,
    title: "Professional Grade I",
    roles: [
      "Principal Nursing Officer",
      "Senior Pharmacist",
      "Senior Medical Lab Scientist",
      "Senior Radiographer",
      "Senior Physiotherapist",
      "Senior Dietitian",
    ],
    step1: 200_800,
    step2: 209_700,
    step3: 218_600,
    step4: 227_500,
    step5: 236_400,
    step6: 245_300,
    housingPct: 50,
    transportPct: 25,
    hazardPct: 50,
  },
  {
    level: 12,
    title: "Senior Professional",
    roles: [
      "Chief Nursing Officer",
      "Principal Pharmacist",
      "Principal Medical Lab Scientist",
      "Principal Radiographer",
      "Principal Physiotherapist",
    ],
    step1: 262_540,
    step2: 275_000,
    step3: 287_460,
    step4: 299_920,
    step5: 312_380,
    step6: 324_840,
    housingPct: 50,
    transportPct: 25,
    hazardPct: 50,
  },
  {
    level: 13,
    title: "Assistant Director",
    roles: [
      "Assistant Director of Nursing",
      "Assistant Director of Pharmacy",
      "Asst. Director of Lab Services",
    ],
    step1: 329_840,
    step2: 344_000,
    step3: 358_160,
    step4: 372_320,
    step5: 386_480,
    step6: 400_640,
    housingPct: 50,
    transportPct: 25,
    hazardPct: 50,
  },
  {
    level: 14,
    title: "Deputy Director",
    roles: [
      "Deputy Director of Nursing",
      "Deputy Director of Pharmacy",
      "Deputy Director of Lab Services",
    ],
    step1: 395_820,
    step2: 412_400,
    step3: 428_980,
    step4: 445_560,
    step5: 462_140,
    step6: 478_720,
    housingPct: 50,
    transportPct: 25,
    hazardPct: 50,
  },
  {
    level: 15,
    title: "Director",
    roles: [
      "Director of Nursing Services",
      "Director of Pharmaceutical Services",
      "Director of Lab Services",
    ],
    step1: 489_600,
    step2: 510_000,
    step3: 530_400,
    step4: 550_800,
    step5: 571_200,
    step6: 591_600,
    housingPct: 50,
    transportPct: 25,
    hazardPct: 50,
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

function calcGross(g: ConhessGrade, step: number): number {
  const base =
    [g.step1, g.step2, g.step3, g.step4, g.step5, g.step6][step] ?? g.step1;
  const housing = base * (g.housingPct / 100);
  const transport = base * (g.transportPct / 100);
  const hazard = base * (g.hazardPct / 100);
  return base + housing + transport + hazard;
}

/* ---- Cadre comparison ---- */

interface CadreComparison {
  cadre: string;
  entryGrade: string;
  entryGross: string;
  midGrade: string;
  midGross: string;
  seniorGrade: string;
  seniorGross: string;
}

const CADRE_COMPARISONS: CadreComparison[] = [
  {
    cadre: "Nursing",
    entryGrade: "CONHESS 08",
    entryGross: "N276,413",
    midGrade: "CONHESS 10",
    midGross: "N451,800",
    seniorGrade: "CONHESS 14",
    seniorGross: "N890,097",
  },
  {
    cadre: "Pharmacy",
    entryGrade: "CONHESS 08",
    entryGross: "N276,413",
    midGrade: "CONHESS 10",
    midGross: "N451,800",
    seniorGrade: "CONHESS 14",
    seniorGross: "N890,097",
  },
  {
    cadre: "Medical Laboratory Science",
    entryGrade: "CONHESS 08",
    entryGross: "N276,413",
    midGrade: "CONHESS 10",
    midGross: "N451,800",
    seniorGrade: "CONHESS 14",
    seniorGross: "N890,097",
  },
  {
    cadre: "Radiography",
    entryGrade: "CONHESS 08",
    entryGross: "N276,413",
    midGrade: "CONHESS 10",
    midGross: "N451,800",
    seniorGrade: "CONHESS 13",
    seniorGross: "N741,940",
  },
  {
    cadre: "Physiotherapy",
    entryGrade: "CONHESS 08",
    entryGross: "N276,413",
    midGrade: "CONHESS 10",
    midGross: "N451,800",
    seniorGrade: "CONHESS 13",
    seniorGross: "N741,940",
  },
  {
    cadre: "Nutrition / Dietetics",
    entryGrade: "CONHESS 08",
    entryGross: "N276,413",
    midGrade: "CONHESS 10",
    midGross: "N451,800",
    seniorGrade: "CONHESS 13",
    seniorGross: "N741,940",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline:
    "CONHESS Salary Structure 2026 - Nurses, Pharmacists, Lab Scientists Salary",
  description:
    "Comprehensive breakdown of the Consolidated Health Salary Structure (CONHESS) for Nigerian healthcare professionals in 2026.",
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
  mainEntityOfPage: "https://consultforafrica.com/oncadre/salaries/conhess",
};

export default function ConhessSalaryPage() {
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
          <span className="text-gray-900 font-medium">CONHESS</span>
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
                d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Updated for 2026
          </div>
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            CONHESS Salary Structure 2026
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-gray-600">
            The Consolidated Health Salary Structure (CONHESS) covers nurses,
            pharmacists, medical laboratory scientists, radiographers,
            physiotherapists, dietitians, and other non-medical health
            professionals in Nigerian public service.
          </p>
        </div>

        {/* Quick summary cards */}
        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          {[
            {
              label: "Entry Professional (Level 08)",
              value: fmt(calcGross(CONHESS_GRADES[2], 0)),
              sub: "Monthly gross at Step 1",
            },
            {
              label: "Senior Professional (Level 12)",
              value: fmt(calcGross(CONHESS_GRADES[5], 0)),
              sub: "Monthly gross at Step 1",
            },
            {
              label: "Director (Level 15)",
              value: fmt(calcGross(CONHESS_GRADES[8], 0)),
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

        {/* Grade tables */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-bold text-gray-900">
            CONHESS Grade Levels (Healthcare Cadres)
          </h2>
          <p className="mb-6 text-sm text-gray-600">
            Healthcare professionals typically enter CONHESS at levels 06-08
            depending on their qualification. Each grade has 6 steps with annual
            increments.
          </p>

          <div className="space-y-6">
            {CONHESS_GRADES.map((g) => (
              <div
                key={g.level}
                className="overflow-hidden rounded-xl border border-[#E8EBF0] bg-white"
                style={{
                  boxShadow:
                    "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
                }}
              >
                <div className="border-b border-[#E8EBF0] bg-[#0B3C5D] px-6 py-4">
                  <h3 className="text-lg font-bold text-white">
                    CONHESS {String(g.level).padStart(2, "0")}
                  </h3>
                  <p className="text-sm text-white/70">{g.title}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {g.roles.map((r) => (
                      <span
                        key={r}
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{
                          background: "rgba(212,175,55,0.15)",
                          color: "#D4AF37",
                        }}
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Desktop */}
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
                      <tr className="bg-[#0B3C5D]/5 font-semibold">
                        <td className="px-4 py-3 text-[#0B3C5D]">
                          Total Gross
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

                {/* Mobile */}
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
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Cadre comparison */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-bold text-gray-900">
            Salary Comparison by Healthcare Cadre
          </h2>
          <p className="mb-6 text-sm text-gray-600">
            All healthcare cadres under CONHESS start at the same grade level
            for equivalent qualifications. The difference in career earnings
            comes from progression speed and available senior positions.
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
                    Cadre
                  </th>
                  <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Entry Level
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Entry Gross
                  </th>
                  <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Mid-Career
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Mid Gross
                  </th>
                  <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Senior
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Senior Gross
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EBF0]">
                {CADRE_COMPARISONS.map((c) => (
                  <tr key={c.cadre} className="transition hover:bg-[#F8F9FB]">
                    <td className="px-5 py-4 font-medium text-gray-900">
                      {c.cadre}
                    </td>
                    <td className="px-5 py-4 text-center text-xs text-gray-500">
                      {c.entryGrade}
                    </td>
                    <td className="px-5 py-4 text-right text-gray-600">
                      {c.entryGross}
                    </td>
                    <td className="px-5 py-4 text-center text-xs text-gray-500">
                      {c.midGrade}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-[#0B3C5D]">
                      {c.midGross}
                    </td>
                    <td className="px-5 py-4 text-center text-xs text-gray-500">
                      {c.seniorGrade}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-[#0B3C5D]">
                      {c.seniorGross}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="space-y-3 sm:hidden">
            {CADRE_COMPARISONS.map((c) => (
              <div
                key={c.cadre}
                className="rounded-xl border border-[#E8EBF0] bg-white p-4"
                style={{
                  boxShadow:
                    "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
                }}
              >
                <h3 className="text-sm font-semibold text-gray-900">
                  {c.cadre}
                </h3>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400">
                      Entry
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-gray-700">
                      {c.entryGross}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400">
                      Mid
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-[#0B3C5D]">
                      {c.midGross}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400">
                      Senior
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-[#0B3C5D]">
                      {c.seniorGross}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CONHESS vs CONMESS */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-bold text-gray-900">
            CONHESS vs CONMESS: Key Differences
          </h2>
          <div
            className="rounded-xl bg-white p-6"
            style={{
              border: "1px solid #E8EBF0",
              boxShadow:
                "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
            }}
          >
            <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-[#F8F9FB] p-4">
                  <h4 className="font-semibold text-[#0B3C5D]">CONMESS</h4>
                  <ul className="mt-2 space-y-1 text-xs">
                    <li>Covers medical and dental officers only</li>
                    <li>6 grade levels</li>
                    <li>Higher base salaries at entry</li>
                    <li>Includes call duty allowance by default</li>
                  </ul>
                </div>
                <div className="rounded-lg bg-[#F8F9FB] p-4">
                  <h4 className="font-semibold text-[#0B3C5D]">CONHESS</h4>
                  <ul className="mt-2 space-y-1 text-xs">
                    <li>Covers all other health professionals</li>
                    <li>15 grade levels (06-15 for professionals)</li>
                    <li>Lower base salaries at entry</li>
                    <li>Call duty varies by facility and cadre</li>
                  </ul>
                </div>
              </div>
              <p>
                The salary differential between CONMESS and CONHESS has been a
                long-standing point of contention in the Nigerian healthcare
                sector. While both structures have been reviewed upwards over
                the years, CONMESS typically offers significantly higher base
                pay at equivalent career stages.
              </p>
            </div>
          </div>
        </section>

        {/* Cross-links */}
        <div className="mb-10 flex flex-wrap gap-3">
          <Link
            href="/oncadre/salaries/conmess"
            className="rounded-lg bg-[#0B3C5D] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0A3350]"
          >
            View CONMESS Salary Scale
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
            What are healthcare professionals actually earning?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-white/80">
            CONHESS is the official scale, but real take-home pay varies widely.
            See what verified professionals report on CadreHealth.
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
              name: "Joint Health Sector Unions (JOHESU)",
              url: "https://johesu.org.ng",
            },
          ]}
        />
      </div>
    </main>
  );
}
