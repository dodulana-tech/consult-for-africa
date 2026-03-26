import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PartnerCTA from "@/components/cfa/PartnerCTA";

export const metadata: Metadata = {
  title: "Hospital Turnaround & Recovery | Consult For Africa",
  description:
    "Consult For Africa stabilises hospital operations, improves efficiency, strengthens governance, and restores financial performance for healthcare institutions across Africa.",
  openGraph: {
    title: "Hospital Turnaround & Recovery | Consult For Africa",
    description: "We stabilise hospital operations, improve efficiency, and restore financial performance across Africa.",
    type: "website",
    images: ["/og-image.jpg"],
  },
};

const symptoms = [
  "Declining revenue with no clear cause",
  "High staff turnover and morale collapse",
  "Theatre, bed, and clinic underutilisation",
  "Weak billing and collections discipline",
  "Board and management misalignment",
  "NHIS/HMO disputes and claim backlogs",
  "Post-acquisition underperformance",
  "Regulatory or accreditation pressure",
];

const phases = [
  {
    num: "01",
    name: "Rapid Diagnostic",
    weeks: "Weeks 1 to 4",
    desc: "Full operational, financial, and governance assessment. We identify the real drivers of underperformance, not just the symptoms presenting at board level.",
    deliverables: ["Performance baseline report", "Root cause analysis", "Prioritised intervention list"],
  },
  {
    num: "02",
    name: "Stabilisation",
    weeks: "Weeks 4 to 12",
    desc: "Immediate triage of critical failures. Cash flow stabilisation, revenue leakage plugged, and leadership gaps addressed with interim management if needed.",
    deliverables: ["Cash flow stabilisation plan", "Revenue recovery quick wins", "Interim management deployment"],
  },
  {
    num: "03",
    name: "Transformation",
    weeks: "Months 3 to 9",
    desc: "Structural redesign of operations, governance, and commercial performance. New systems, processes, and performance accountability frameworks embedded.",
    deliverables: ["Restructured org design", "New KPI framework", "Governance charter"],
  },
  {
    num: "04",
    name: "Sustained Performance",
    weeks: "Months 9 to 18",
    desc: "Building the internal capability to sustain results without C4A. Knowledge transfer, leadership coaching, and performance monitoring until independence is confirmed.",
    deliverables: ["Management capability programme", "Performance dashboard", "Exit readiness sign-off"],
  },
];

const outcomes = [
  { value: "35%", label: "Average revenue improvement in 12 months" },
  { value: "60%", label: "Reduction in billing leakage" },
  { value: "$1.1M+", label: "Annual savings in a single engagement" },
  { value: "100%", label: "Governance frameworks sustained post-engagement" },
];

const qualifies = [
  "Private hospital groups with declining financial performance",
  "Investor-owned facilities post-acquisition",
  "Mission hospitals seeking commercial sustainability",
  "Government-funded hospitals under reform mandates",
  "Multi-site health networks with operational fragmentation",
];

export default function TurnaroundPage() {
  return (
    <main>

      {/* HERO */}
      <section
        className="relative overflow-hidden text-white"
        style={{ paddingTop: "5rem", minHeight: "60svh" }}
      >
        <div className="absolute inset-0" style={{ background: "#06090f" }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 70% 80% at 80% 40%, rgba(20,130,200,0.15) 0%, rgba(12,70,130,0.06) 55%, transparent 70%)",
        }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 40% 50% at 20% 10%, rgba(201,168,76,0.1) 0%, transparent 60%)",
        }} />
        <div className="absolute inset-0 pointer-events-none opacity-[0.036]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "180px",
        }} />

        <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-32">
          <p
            className="mb-6 text-xs font-medium uppercase tracking-[0.22em]"
            style={{ color: "#D4AF37" }}
          >
            C4AService
          </p>
          <h1
            className="font-semibold leading-[1.1] tracking-tight text-white max-w-3xl"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
          >
            Hospital Turnaround<br />
            <span style={{ color: "rgba(255,255,255,0.65)" }}>& Recovery</span>
          </h1>
          <div className="mt-6 w-12 h-[2px]" style={{ background: "#D4AF37" }} />
          <p
            className="mt-6 max-w-2xl leading-relaxed"
            style={{ fontSize: "clamp(1rem,1.5vw,1.1rem)", color: "rgba(255,255,255,0.65)" }}
          >
            When a hospital is underperforming, the instinct is to find a new strategy.
            Usually the problem is execution. C4A embeds into the institution and does the work.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm"
              style={{ background: "#D4AF37", color: "#0F2744" }}
            >
              Start a Conversation
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm"
              style={{ border: "1px solid rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.8)" }}
            >
              All Services
            </Link>
          </div>
        </div>
      </section>

      {/* OUTCOMES */}
      <section className="py-16" style={{ background: "linear-gradient(135deg, #0B3C5D 0%, #0e4a75 100%)" }}>
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-5">
          {outcomes.map((o) => (
            <div key={o.value} className="glass-card p-6 text-center">
              <p className="text-2xl font-bold text-white mb-1">{o.value}</p>
              <p className="text-white/60 text-xs leading-snug">{o.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SYMPTOMS */}
      <section className="py-20 px-6" style={{ background: "#F8FAFC" }}>
        <div className="max-w-5xl mx-auto">
          <p className="uppercase tracking-[0.2em] text-xs text-[#0B3C5D]/50 mb-3">Indicators</p>
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4">
            Is Your Hospital in Distress?
          </h2>
          <p className="text-gray-500 text-sm max-w-xl mb-12">
            Turnaround situations rarely announce themselves. They accumulate. These are the warning signs.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {symptoms.map((s) => (
              <div
                key={s}
                className="flex items-center gap-3 p-4 rounded-xl"
                style={{ background: "#fff", border: "1px solid #e5eaf0" }}
              >
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs"
                  style={{ background: "#FEF3C7", color: "#D97706" }}
                >
                  !
                </span>
                <span className="text-sm text-gray-700">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PHASES */}
      <section
        className="py-24 px-6"
        style={{ background: "linear-gradient(145deg, #0a1e32 0%, #112e4a 100%)" }}
      >
        <div className="max-w-5xl mx-auto">
          <p className="uppercase tracking-[0.2em] text-xs text-white/50 mb-3">Engagement Structure</p>
          <h2 className="text-2xl md:text-3xl font-semibold text-white mb-14">
            How a Turnaround Engagement Works
          </h2>

          <div className="space-y-5">
            {phases.map((phase) => (
              <div key={phase.num} className="glass-card p-7 grid md:grid-cols-[200px_1fr] gap-6">
                <div>
                  <div
                    className="inline-flex items-center justify-center w-10 h-10 rounded-full text-xs font-bold mb-3"
                    style={{ background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.35)", color: "#D4AF37" }}
                  >
                    {phase.num}
                  </div>
                  <p className="font-semibold text-white text-base mb-1">{phase.name}</p>
                  <p className="text-xs" style={{ color: "#D4AF37" }}>{phase.weeks}</p>
                </div>
                <div>
                  <p className="text-white/70 text-sm leading-relaxed mb-4">{phase.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {phase.deliverables.map((d) => (
                      <span
                        key={d}
                        className="px-3 py-1 rounded-full text-xs"
                        style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHO QUALIFIES */}
      <section className="py-20 px-6" style={{ background: "#ffffff" }}>
        <div className="max-w-4xl mx-auto">
          <p className="uppercase tracking-[0.2em] text-xs text-[#0B3C5D]/50 mb-3">Who This Is For</p>
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-10">
            The Institutions We Serve
          </h2>
          <div className="space-y-3">
            {qualifies.map((q) => (
              <div
                key={q}
                className="flex items-center gap-4 p-4 rounded-xl"
                style={{ border: "1px solid #e5eaf0" }}
              >
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: "#D4AF37" }} />
                <span className="text-sm text-gray-700">{q}</span>
              </div>
            ))}
          </div>

          <div
            className="mt-12 rounded-2xl p-8"
            style={{ background: "#0F2744" }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.15em] mb-2" style={{ color: "#D4AF37" }}>
              Start with a Conversation
            </p>
            <h3 className="text-xl font-semibold text-white mb-3">
              Not sure if your situation qualifies?
            </h3>
            <p className="text-white/60 text-sm mb-6 max-w-lg">
              We offer a confidential 30-minute diagnostic call to help you understand
              what kind of intervention your institution needs. No obligation.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm"
              style={{ background: "#D4AF37", color: "#0F2744" }}
            >
              Request a Diagnostic Call
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      <PartnerCTA />
    </main>
  );
}
