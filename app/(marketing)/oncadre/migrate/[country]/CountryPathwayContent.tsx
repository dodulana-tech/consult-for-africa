"use client";

import { useState } from "react";
import Link from "next/link";
import type { MigrationPathway, PathwayStep } from "@/lib/cadreHealth/migrationData";
import DataDisclaimer from "@/components/cadrehealth/DataDisclaimer";

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Country Pathway Content (Client Component)                                */
/*  Handles interactive cadre tabs while parent page.tsx handles metadata.    */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function CountryPathwayContent({
  pathway,
  relatedCountries,
}: {
  pathway: MigrationPathway;
  relatedCountries: MigrationPathway[];
}) {
  return (
    <main className="bg-[#F8F9FB]">
      {/* JSON-LD HowTo Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: `How to Work in ${pathway.country} as a Nigerian Healthcare Professional`,
            description: pathway.overview,
            totalTime: `P${parseInt(pathway.processingTime) || 12}M`,
            estimatedCost: {
              "@type": "MonetaryAmount",
              currency: "NGN",
              value: pathway.estimatedCostNaira,
            },
            step: pathway.doctorPathway.map((s) => ({
              "@type": "HowToStep",
              position: s.step,
              name: s.title,
              text: s.description,
            })),
            provider: {
              "@type": "Organization",
              name: "CadreHealth by Consult For Africa",
              url: "https://consultforafrica.com",
            },
          }),
        }}
      />

      {/* ═══════════════ HERO ═══════════════ */}
      <section
        className="relative overflow-hidden text-white"
        style={{ paddingTop: "5rem" }}
      >
        <div className="absolute inset-0" style={{ background: "#0B3C5D" }} />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 80% at 80% 30%, rgba(14,77,110,0.6) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 40% 50% at 70% 0%, rgba(212,175,55,0.1) 0%, transparent 50%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.03,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "180px",
          }}
        />

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-white/40 mb-8">
            <Link
              href="/oncadre"
              className="hover:text-white/60 transition-colors"
            >
              CadreHealth
            </Link>
            <span>/</span>
            <Link
              href="/oncadre/migrate"
              className="hover:text-white/60 transition-colors"
            >
              Migration
            </Link>
            <span>/</span>
            <span className="text-white/70">{pathway.country}</span>
          </div>

          <div className="flex items-start gap-5">
            <span className="text-5xl sm:text-6xl">{pathway.flag}</span>
            <div>
              <h1
                className="font-semibold leading-[1.1] tracking-tight text-white"
                style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}
              >
                Work in {pathway.country}
              </h1>
              <p
                className="mt-2"
                style={{
                  fontSize: "clamp(0.88rem, 1.2vw, 1rem)",
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                Migration pathway for Nigerian healthcare professionals
              </p>
            </div>
          </div>

          {/* Key stats */}
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Processing Time", value: pathway.processingTime },
              { label: "Estimated Cost", value: pathway.estimatedCostNaira },
              { label: "Primary Exam", value: pathway.primaryExam },
              { label: "Visa", value: pathway.visaType },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl px-4 py-3.5"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                }}
              >
                <p className="text-[10px] font-medium uppercase tracking-wider text-white/35">
                  {stat.label}
                </p>
                <p className="mt-1 text-[13px] font-semibold text-white/90 leading-snug">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ MAIN CONTENT ═══════════════ */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          {/* LEFT COLUMN */}
          <div className="space-y-12">
            {/* Overview */}
            <div>
              <h2 className="text-xl font-bold text-gray-900">Overview</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-gray-600">
                {pathway.overview}
              </p>
            </div>

            {/* Pathway Steps (tabbed by cadre) */}
            <PathwayTabs pathway={pathway} />

            {/* Cost Breakdown */}
            <section>
              <h2 className="text-xl font-bold text-gray-900">
                Cost Breakdown
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                All costs shown in both foreign currency and Nigerian Naira
                (2026 estimates).
              </p>
              <div
                className="mt-5 rounded-xl bg-white overflow-hidden"
                style={{ border: "1px solid #E8EBF0" }}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                          Item
                        </th>
                        <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                          Cost (Foreign)
                        </th>
                        <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                          Cost (Naira)
                        </th>
                        <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pathway.costs.map((cost, i) => (
                        <tr
                          key={cost.item}
                          className={
                            i % 2 === 0 ? "bg-white" : "bg-[#F8F9FB]"
                          }
                        >
                          <td className="px-4 py-3 font-medium text-gray-800 text-[13px]">
                            {cost.item}
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-[13px]">
                            {cost.costForeign}
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-900 text-[13px]">
                            {cost.costNaira}
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-[12px] hidden sm:table-cell">
                            {cost.notes || ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Exams */}
            <section>
              <h2 className="text-xl font-bold text-gray-900">
                Exams Required
              </h2>
              <div className="mt-5 space-y-4">
                {pathway.exams.map((exam) => (
                  <div
                    key={exam.name}
                    className="rounded-xl bg-white p-5"
                    style={{ border: "1px solid #E8EBF0" }}
                  >
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <h3 className="text-[15px] font-semibold text-gray-900">
                        {exam.name}
                      </h3>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                          exam.canTakeInNigeria
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        {exam.canTakeInNigeria
                          ? "Available in Nigeria"
                          : "Not available in Nigeria"}
                      </span>
                    </div>
                    <p className="mt-2 text-[13px] text-gray-600 leading-relaxed">
                      {exam.description}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <InfoPill label="Cost" value={exam.cost} />
                      {exam.passingScore && (
                        <InfoPill label="Passing" value={exam.passingScore} />
                      )}
                      {exam.validFor && (
                        <InfoPill label="Valid for" value={exam.validFor} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Requirements */}
            <section>
              <h2 className="text-xl font-bold text-gray-900">
                Key Requirements
              </h2>
              <div
                className="mt-5 rounded-xl bg-white p-5"
                style={{ border: "1px solid #E8EBF0" }}
              >
                <ul className="space-y-3">
                  {pathway.requirements.map((req) => (
                    <li key={req} className="flex gap-3 text-[13px]">
                      <span
                        className="mt-0.5 shrink-0 text-xs"
                        style={{ color: "#D4AF37" }}
                      >
                        &#10003;
                      </span>
                      <span className="text-gray-700">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Visa Info */}
            <section>
              <h2 className="text-xl font-bold text-gray-900">
                Visa: {pathway.visaType}
              </h2>
              <div
                className="mt-5 rounded-xl bg-white p-5"
                style={{ border: "1px solid #E8EBF0" }}
              >
                <p className="text-[13px] text-gray-600 leading-relaxed">
                  {pathway.visaInfo}
                </p>
              </div>
            </section>

            {/* Tips for Nigerians */}
            <section>
              <div
                className="rounded-xl p-6"
                style={{
                  background: "#0B3C5D",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-2xl">🇳🇬</span>
                  <h2 className="text-lg font-bold text-white">
                    Tips for Nigerian Professionals
                  </h2>
                </div>
                <ul className="space-y-3">
                  {pathway.nigerianTips.map((tip) => (
                    <li key={tip} className="flex gap-3 text-[13px]">
                      <span
                        className="mt-0.5 shrink-0 text-xs"
                        style={{ color: "#D4AF37" }}
                      >
                        &#9670;
                      </span>
                      <span className="text-white/70 leading-relaxed">
                        {tip}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>

          {/* RIGHT SIDEBAR */}
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {/* Readiness CTA */}
            <div
              className="rounded-xl p-5"
              style={{ background: "#0B3C5D" }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35">
                Ready for {pathway.country}?
              </p>
              <h3 className="mt-2 text-base font-bold text-white">
                Check your readiness score
              </h3>
              <p className="mt-2 text-[12px] text-white/50 leading-relaxed">
                Free 2-minute assessment. See exactly where you stand for{" "}
                {pathway.country} and what gaps to close.
              </p>
              <Link
                href={`/oncadre/readiness?country=${pathway.slug}`}
                className="mt-4 flex w-full items-center justify-center rounded-lg py-3 text-xs font-semibold text-[#06090f] transition hover:opacity-90"
                style={{ background: "#D4AF37" }}
              >
                Get your score &rarr;
              </Link>
            </div>

            {/* Related Countries */}
            <div
              className="rounded-xl bg-white p-5"
              style={{ border: "1px solid #E8EBF0" }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Other Destinations
              </p>
              <div className="mt-4 space-y-2.5">
                {relatedCountries.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/oncadre/migrate/${p.slug}`}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-[#F8F9FB] group"
                  >
                    <span className="text-xl">{p.flag}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-gray-800 group-hover:text-[#0B3C5D] transition-colors">
                        {p.country}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {p.processingTime}
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold text-gray-800">
                      {p.estimatedCostNaira}
                    </span>
                  </Link>
                ))}
              </div>
              <Link
                href="/oncadre/migrate"
                className="mt-4 flex items-center justify-center text-[12px] font-semibold transition"
                style={{ color: "#D4AF37" }}
              >
                View all countries &rarr;
              </Link>
            </div>
          </aside>
        </div>
      </div>

      {/* ═══════════════ DISCLAIMER ═══════════════ */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 pb-10">
        <DataDisclaimer
          sources={[
            ...(pathway.slug === "uk" ? [
              { name: "GMC (Doctors)", url: "https://www.gmc-uk.org" },
              { name: "NMC (Nurses)", url: "https://www.nmc.org.uk" },
              { name: "UK Visas", url: "https://www.gov.uk/health-care-worker-visa" },
            ] : []),
            ...(pathway.slug === "us" ? [
              { name: "USMLE", url: "https://www.usmle.org" },
              { name: "ECFMG", url: "https://www.ecfmg.org" },
              { name: "CGFNS", url: "https://www.cgfns.org" },
            ] : []),
            ...(pathway.slug === "canada" ? [
              { name: "MCC", url: "https://mcc.ca" },
              { name: "NNAS", url: "https://www.nnas.ca" },
              { name: "CaRMS", url: "https://www.carms.ca" },
            ] : []),
            ...(pathway.slug === "australia" ? [
              { name: "AMC", url: "https://www.amc.org.au" },
              { name: "AHPRA", url: "https://www.ahpra.gov.au" },
            ] : []),
            ...(["saudi-arabia", "uae", "qatar"].includes(pathway.slug) ? [
              { name: "Dataflow Group", url: "https://www.dataflowgroup.com" },
              { name: "Prometric", url: "https://www.prometric.com" },
            ] : []),
          ]}
        />
      </div>

      {/* ═══════════════ BOTTOM CTA ═══════════════ */}
      <section
        className="relative overflow-hidden"
        style={{ background: "#06090f" }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 80% at 50% 50%, rgba(11,60,93,0.35) 0%, transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-3xl px-6 py-16 text-center">
          <h2
            className="font-semibold leading-[1.1] tracking-tight text-white"
            style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)" }}
          >
            Ready to start your {pathway.country} journey?
          </h2>
          <p
            className="mt-4 mx-auto max-w-md"
            style={{
              fontSize: "clamp(0.85rem, 1.1vw, 0.95rem)",
              color: "rgba(255,255,255,0.45)",
            }}
          >
            Create your free CadreHealth profile to track your credentials,
            exams, and migration progress.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/oncadre/readiness"
              className="px-7 py-3.5 rounded-lg font-semibold text-[#06090f] text-center transition hover:opacity-90"
              style={{ background: "#D4AF37" }}
            >
              Check Readiness Score
            </Link>
            <Link
              href="/oncadre/register"
              className="px-7 py-3.5 rounded-lg text-white text-center transition hover:bg-white/[0.08] text-sm font-medium"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              Create Free Profile
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  PATHWAY TABS                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

function PathwayTabs({ pathway }: { pathway: MigrationPathway }) {
  type Cadre = "doctor" | "nurse" | "pharmacist";

  const tabs: {
    key: Cadre;
    label: string;
    steps: PathwayStep[] | undefined;
  }[] = [
    { key: "doctor", label: "Doctor", steps: pathway.doctorPathway },
    { key: "nurse", label: "Nurse", steps: pathway.nursePathway },
  ];

  if (pathway.pharmacistPathway && pathway.pharmacistPathway.length > 0) {
    tabs.push({
      key: "pharmacist",
      label: "Pharmacist",
      steps: pathway.pharmacistPathway,
    });
  }

  const [active, setActive] = useState<Cadre>("doctor");
  const activeTab = tabs.find((t) => t.key === active) || tabs[0];

  return (
    <section>
      <h2 className="text-xl font-bold text-gray-900">
        Step-by-Step Pathway
      </h2>
      <p className="mt-2 text-sm text-gray-500">
        Choose your cadre to see the specific pathway.
      </p>

      {/* Tab buttons */}
      <div className="mt-5 flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition ${
              active === tab.key
                ? "text-white"
                : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
            }`}
            style={
              active === tab.key
                ? { background: "#0B3C5D" }
                : { background: "transparent", border: "1px solid #E8EBF0" }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Steps */}
      <div className="mt-6 space-y-0">
        {activeTab.steps?.map((step, i) => (
          <div key={step.step} className="relative flex gap-4">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0"
                style={{ background: "#0B3C5D" }}
              >
                {step.step}
              </div>
              {i < (activeTab.steps?.length || 0) - 1 && (
                <div
                  className="w-[2px] flex-1 min-h-[24px]"
                  style={{ background: "#E8EBF0" }}
                />
              )}
            </div>

            {/* Content */}
            <div className="pb-8 flex-1">
              <h3 className="text-[15px] font-semibold text-gray-900 leading-snug">
                {step.title}
              </h3>
              <p className="mt-1.5 text-[13px] text-gray-600 leading-relaxed">
                {step.description}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                <InfoPill label="Time" value={step.estimatedTime} />
                {step.estimatedCost && (
                  <InfoPill label="Cost" value={step.estimatedCost} />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  SHARED SUB-COMPONENTS                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-md px-2.5 py-1 text-[11px]"
      style={{ background: "#F8F9FB", border: "1px solid #E8EBF0" }}
    >
      <span className="font-medium text-gray-400">{label}:</span>{" "}
      <span className="font-semibold text-gray-700">{value}</span>
    </div>
  );
}
