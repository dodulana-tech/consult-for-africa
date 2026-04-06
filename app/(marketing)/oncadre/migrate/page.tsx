import type { Metadata } from "next";
import Link from "next/link";
import { MIGRATION_PATHWAYS } from "@/lib/cadreHealth/migrationData";

/* ─── SEO Metadata ─────────────────────────────────────────────────────────── */

export const metadata: Metadata = {
  title:
    "Healthcare Migration Guide | UK, US, Canada, Gulf, Australia | CadreHealth",
  description:
    "Step-by-step migration pathways for Nigerian healthcare professionals. Exams, costs in Naira, timelines, and visa requirements for UK, US, Canada, Australia, Saudi Arabia, UAE, Ireland, Germany, and more.",
  keywords: [
    "how to relocate as doctor from Nigeria",
    "nurse migration guide Nigeria",
    "Nigerian doctor UK migration",
    "PLAB guide for Nigerian doctors",
    "NMC CBT guide Nigeria",
    "USMLE guide Nigeria",
    "healthcare migration from Nigeria",
    "doctor migration to Canada",
    "nurse migration to UK",
    "Gulf healthcare jobs Nigeria",
    "Saudi Arabia healthcare jobs",
    "Australia doctor migration Nigeria",
    "Ireland nurse migration",
    "Germany doctor migration",
    "healthcare visa guide Nigeria",
    "CadreHealth migration",
  ].join(", "),
  openGraph: {
    title:
      "Healthcare Migration Guide | UK, US, Canada, Gulf, Australia | CadreHealth",
    description:
      "Step-by-step migration pathways for Nigerian healthcare professionals. Every exam, every cost, every timeline.",
    type: "website",
    url: "https://consultforafrica.com/oncadre/migrate",
    siteName: "CadreHealth by Consult For Africa",
    locale: "en_NG",
  },
  twitter: {
    card: "summary_large_image",
    title: "Healthcare Migration Guide | CadreHealth",
    description:
      "Step-by-step migration pathways for Nigerian healthcare professionals. Every exam, every cost, every timeline.",
  },
  alternates: {
    canonical: "https://consultforafrica.com/oncadre/migrate",
  },
};

/* ─── Page ─────────────────────────────────────────────────────────────────── */

export default function MigrationHubPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Healthcare Migration Guide",
    description:
      "Step-by-step migration pathways for Nigerian healthcare professionals to work in the UK, US, Canada, Australia, Saudi Arabia, UAE, Qatar, Ireland, and Germany.",
    url: "https://consultforafrica.com/oncadre/migrate",
    isPartOf: {
      "@type": "WebSite",
      name: "CadreHealth by Consult For Africa",
      url: "https://consultforafrica.com",
    },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: MIGRATION_PATHWAYS.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: `Migration pathway to ${p.country}`,
        url: `https://consultforafrica.com/oncadre/migrate/${p.slug}`,
      })),
    },
  };

  return (
    <main className="bg-[#F8F9FB]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
        {/* Grain */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.03,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "180px",
          }}
        />

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-32">
          <div className="max-w-3xl">
            <p
              className="text-xs font-medium uppercase tracking-[0.22em]"
              style={{ color: "#D4AF37" }}
            >
              CadreHealth Migration Pathways
            </p>
            <h1
              className="mt-6 font-semibold leading-[1.08] tracking-tight text-white"
              style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
            >
              Your next move,{" "}
              <span style={{ color: "#D4AF37" }}>mapped out.</span>
            </h1>
            <div
              className="mt-6 w-12 h-[2px]"
              style={{ background: "#D4AF37" }}
            />
            <p
              className="mt-5 max-w-xl leading-relaxed"
              style={{
                fontSize: "clamp(0.92rem, 1.3vw, 1.05rem)",
                color: "rgba(255,255,255,0.55)",
              }}
            >
              Step-by-step migration pathways for Nigerian healthcare
              professionals. Every exam, every cost, every timeline.
            </p>
          </div>

          {/* Quick stats */}
          <div className="mt-12 flex flex-wrap gap-3">
            {[
              { n: "10", l: "Country pathways" },
              { n: "3", l: "Cadre tracks (Doctor, Nurse, Pharmacist)" },
              { n: "100+", l: "Cost items in Naira" },
            ].map(({ n, l }) => (
              <div
                key={l}
                className="rounded-lg px-4 py-2.5"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <span className="text-sm font-bold text-white">{n}</span>
                <span className="ml-2 text-xs text-white/40">{l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ COUNTRY GRID ═══════════════ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.15em]"
              style={{ color: "#D4AF37" }}
            >
              Choose Your Destination
            </p>
            <h2 className="mt-3 text-2xl font-bold text-gray-900 sm:text-3xl leading-snug">
              Where are you headed?
            </h2>
            <p className="mt-3 text-[15px] text-gray-500 leading-relaxed">
              Each pathway includes step-by-step instructions, exam details,
              cost breakdowns in Naira, visa information, and tips specific to
              Nigerian professionals.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MIGRATION_PATHWAYS.map((pathway) => (
              <Link
                key={pathway.slug}
                href={`/oncadre/migrate/${pathway.slug}`}
                className="group rounded-xl bg-white p-6 transition-all hover:shadow-lg hover:shadow-gray-200/60 hover:-translate-y-0.5"
                style={{
                  border: "1px solid #E8EBF0",
                }}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{pathway.flag}</span>
                    <div>
                      <h3 className="text-[15px] font-semibold text-gray-900 group-hover:text-[#0B3C5D] transition-colors">
                        {pathway.country}
                      </h3>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {pathway.primaryExam}
                      </p>
                    </div>
                  </div>
                  <span
                    className="mt-1 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: "#D4AF37" }}
                  >
                    View &rarr;
                  </span>
                </div>

                {/* Stats */}
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div
                    className="rounded-lg px-3 py-2.5"
                    style={{ background: "#F8F9FB" }}
                  >
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                      Processing
                    </p>
                    <p className="text-[13px] font-semibold text-gray-800 mt-0.5">
                      {pathway.processingTime}
                    </p>
                  </div>
                  <div
                    className="rounded-lg px-3 py-2.5"
                    style={{ background: "#F8F9FB" }}
                  >
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                      Est. Cost
                    </p>
                    <p className="text-[13px] font-semibold text-gray-800 mt-0.5">
                      {pathway.estimatedCostNaira}
                    </p>
                  </div>
                </div>

                {/* Regulator */}
                <div className="mt-3 flex items-center gap-2">
                  <div
                    className="h-1.5 w-1.5 rounded-full shrink-0"
                    style={{ background: "#D4AF37" }}
                  />
                  <p className="text-[11px] text-gray-400 line-clamp-1">
                    {pathway.primaryRegulator}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ NOT SURE SECTION ═══════════════ */}
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
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 35% 45% at 50% 20%, rgba(212,175,55,0.1) 0%, transparent 55%)",
          }}
        />
        <div className="relative mx-auto max-w-3xl px-6 py-20 text-center">
          <h2
            className="font-semibold leading-[1.1] tracking-tight text-white"
            style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)" }}
          >
            Not sure where to go?
          </h2>
          <p
            className="mt-4 mx-auto max-w-md"
            style={{
              fontSize: "clamp(0.88rem, 1.2vw, 1rem)",
              color: "rgba(255,255,255,0.45)",
            }}
          >
            Take our free 2-minute readiness assessment. We will score your
            readiness for each destination based on your qualifications,
            experience, and credentials.
          </p>
          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/oncadre/readiness"
              className="px-7 py-3.5 rounded-lg font-semibold text-[#06090f] text-center transition hover:opacity-90"
              style={{ background: "#D4AF37" }}
            >
              Check Your Readiness Score
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
          <p
            className="mt-4 text-[11px]"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            Free forever. No card required.
          </p>
        </div>
      </section>
    </main>
  );
}
