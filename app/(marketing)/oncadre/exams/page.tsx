import type { Metadata } from "next";
import Link from "next/link";
import {
  getExamsByCategory,
  type ExamGuide,
} from "@/lib/cadreHealth/examData";

/* ─── SEO Metadata ─────────────────────────────────────────────────────────── */

export const metadata: Metadata = {
  title:
    "Healthcare Exam Guides | PLAB, USMLE, NMC CBT, IELTS, OET | CadreHealth",
  description:
    "Complete preparation guides for Nigerian healthcare professionals. PLAB, USMLE, NMC CBT, IELTS, OET, Prometric, AMC, MDCN, NMCN, and PCN exams with costs, registration steps, and Nigeria-specific tips.",
  keywords: [
    "PLAB exam Nigeria",
    "USMLE Nigeria",
    "NMC CBT Nigeria",
    "IELTS healthcare Nigeria",
    "OET Nigeria",
    "Prometric exam Nigeria",
    "AMC exam Nigeria",
    "MDCN assessment exam",
    "NMCN licensing exam",
    "PCN PEP exam",
    "healthcare exam preparation Nigeria",
    "doctor exam UK Nigeria",
    "nurse exam UK Nigeria",
    "medical licensing exam",
    "CadreHealth",
  ].join(", "),
  openGraph: {
    title:
      "Healthcare Exam Guides | PLAB, USMLE, NMC CBT, IELTS, OET | CadreHealth",
    description:
      "Complete preparation guides for Nigerian healthcare professionals. Costs, registration steps, test centres, and Nigeria-specific tips for every major healthcare exam.",
    type: "website",
    url: "https://consultforafrica.com/oncadre/exams",
    siteName: "CadreHealth by Consult For Africa",
    locale: "en_NG",
  },
  twitter: {
    card: "summary_large_image",
    title: "Healthcare Exam Guides | CadreHealth",
    description:
      "PLAB, USMLE, NMC CBT, IELTS, OET, and more. Preparation guides built for Nigerian healthcare professionals.",
  },
  alternates: {
    canonical: "https://consultforafrica.com/oncadre/exams",
  },
};

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

const difficultyConfig = {
  moderate: { label: "Moderate", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  hard: { label: "Hard", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  "very-hard": { label: "Very Hard", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

function ExamCard({ exam }: { exam: ExamGuide }) {
  const diff = difficultyConfig[exam.difficulty];

  return (
    <Link
      href={`/oncadre/exams/${exam.slug}`}
      className="group block rounded-xl border border-[#E8EBF0] bg-white p-6 transition hover:border-[#D4AF37]/40 hover:shadow-md"
      style={{
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#0B3C5D] transition">
            {exam.name}
          </h3>
          <p className="mt-0.5 text-xs font-medium text-gray-400 uppercase tracking-wide">
            {exam.administeredBy}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${diff.bg} ${diff.text} ${diff.border}`}
        >
          {diff.label}
        </span>
      </div>

      <p className="mt-3 text-sm text-gray-600 leading-relaxed line-clamp-2">
        {exam.description}
      </p>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
          </svg>
          {exam.cost}
        </span>
        <span className="flex items-center gap-1">
          <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {exam.duration}
        </span>
        <span className="flex items-center gap-1">
          {exam.canTakeInNigeria ? (
            <>
              <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-emerald-600 font-medium">Available in Nigeria</span>
            </>
          ) : (
            <>
              <svg className="h-3.5 w-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="text-amber-600 font-medium">Travel required</span>
            </>
          )}
        </span>
      </div>

      <div className="mt-4 pt-3 border-t border-[#E8EBF0]">
        <p className="text-xs text-gray-500">
          <span className="font-medium text-gray-700">Who needs it:</span>{" "}
          {exam.whoNeedsIt}
        </p>
      </div>
    </Link>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────────────── */

export default function ExamsHubPage() {
  const internationalExams = getExamsByCategory("international");
  const nigerianExams = getExamsByCategory("nigerian");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Healthcare Exam Guides for Nigerian Professionals",
    description:
      "Complete preparation guides for healthcare professional exams including PLAB, USMLE, NMC CBT, IELTS, OET, and Nigerian licensing exams.",
    url: "https://consultforafrica.com/oncadre/exams",
    provider: {
      "@type": "Organization",
      name: "CadreHealth by Consult For Africa",
      url: "https://consultforafrica.com",
    },
    hasPart: [...internationalExams, ...nigerianExams].map((exam) => ({
      "@type": "Course",
      name: `${exam.name} Preparation Guide`,
      description: exam.description,
      url: `https://consultforafrica.com/oncadre/exams/${exam.slug}`,
      provider: {
        "@type": "Organization",
        name: exam.administeredBy,
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

      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/oncadre" className="hover:text-[#0B3C5D] transition">
            CadreHealth
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Exam Guides</span>
        </nav>

        {/* Hero */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Exam preparation guides for Nigerian healthcare professionals
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-gray-600 leading-relaxed">
            Everything you need to know about the exams that matter for your
            career. Costs in Naira, test centres in Nigeria, registration steps,
            and tips from professionals who have been through it.
          </p>
        </div>

        {/* Quick Stats */}
        <div
          className="mb-12 grid grid-cols-2 gap-4 sm:grid-cols-4"
        >
          {[
            { label: "Exam guides", value: `${internationalExams.length + nigerianExams.length}` },
            { label: "International exams", value: `${internationalExams.length}` },
            { label: "Nigerian exams", value: `${nigerianExams.length}` },
            { label: "Available in Nigeria", value: `${[...internationalExams, ...nigerianExams].filter((e) => e.canTakeInNigeria).length}` },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-[#E8EBF0] bg-white p-4 text-center"
              style={{
                boxShadow:
                  "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
              }}
            >
              <p className="text-2xl font-bold text-[#0B3C5D]">{stat.value}</p>
              <p className="mt-1 text-xs text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* International Exams */}
        <section className="mb-14">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0B3C5D]">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                International Exams
              </h2>
              <p className="text-sm text-gray-500">
                For practising in the UK, US, Australia, Gulf States, and beyond
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {internationalExams.map((exam) => (
              <ExamCard key={exam.slug} exam={exam} />
            ))}
          </div>
        </section>

        {/* Nigerian Professional Exams */}
        <section className="mb-14">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0B3C5D]">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Professional Council Exams
              </h2>
              <p className="text-sm text-gray-500">
                Nigerian licensing and registration exams for healthcare professionals
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {nigerianExams.map((exam) => (
              <ExamCard key={exam.slug} exam={exam} />
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <div className="rounded-xl bg-[#0B3C5D] p-8 text-center text-white sm:p-10">
          <h2 className="text-xl font-bold sm:text-2xl">
            Not sure which exam to take first?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-white/80">
            Take the CadreHealth readiness assessment to understand your career
            options and get a personalised recommendation based on your cadre,
            experience, and goals.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/oncadre/readiness"
              className="rounded-lg bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-[#0B3C5D] transition hover:bg-[#C4A030]"
            >
              Check your readiness score
            </Link>
            <Link
              href="/oncadre/register"
              className="rounded-lg border border-white/30 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Join CadreHealth
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
