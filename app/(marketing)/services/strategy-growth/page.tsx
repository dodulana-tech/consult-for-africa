import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PartnerCTA from "@/components/cfa/PartnerCTA";

export const metadata: Metadata = {
  title: "Strategy, Growth & Commercial Performance | Consult For Africa",
  description:
    "Consult For Africa aligns clinical strengths with demand, referral flows, and patient access to drive sustainable hospital revenue growth across Africa.",
  keywords: ["hospital revenue growth Africa", "healthcare strategy consulting", "hospital commercial performance", "service line profitability", "patient access strategy Nigeria", "healthcare growth consulting"],
  openGraph: {
    title: "Strategy, Growth & Commercial Performance | Consult For Africa",
    description: "We align clinical strengths with demand to drive sustainable hospital revenue growth.",
    type: "website",
    images: ["/og-image.jpg"],
  },
};

const indicators = [
  "Revenue plateauing despite patient volume growth",
  "No clear service-line profitability data",
  "Referral leakage to competitors",
  "Weak payer mix and HMO dependency",
  "Underperforming outpatient and diagnostics revenue",
  "No patient experience or retention strategy",
];

const phases = [
  {
    num: "01", name: "Market & Performance Diagnostic", weeks: "Weeks 1 to 4",
    desc: "Map your market position, service-line economics, referral flows, and competitive landscape. Identify the real growth levers, not assumptions.",
    deliverables: ["Service-line P&L analysis", "Referral flow mapping", "Market positioning report"],
  },
  {
    num: "02", name: "Strategic Alignment", weeks: "Weeks 4 to 10",
    desc: "Align clinical capabilities with market demand. Design service-line strategy, payer mix optimisation, and physician engagement programmes.",
    deliverables: ["Growth strategy roadmap", "Payer mix optimisation plan", "Physician engagement framework"],
  },
  {
    num: "03", name: "Commercial Execution", weeks: "Months 3 to 8",
    desc: "Implement revenue initiatives, launch new service lines, restructure pricing, and build referral networks. Results measured monthly.",
    deliverables: ["Revenue dashboard", "New service-line launches", "Referral partnership agreements"],
  },
  {
    num: "04", name: "Growth Embedding", weeks: "Months 8 to 14",
    desc: "Build internal commercial capability so growth continues without C4A. Train teams, embed processes, and install performance monitoring.",
    deliverables: ["Commercial team training", "Performance monitoring system", "Growth sustainability report"],
  },
];

const outcomes = [
  { value: "25%", label: "Average revenue growth in 12 months" },
  { value: "40%", label: "Improvement in referral capture" },
  { value: "3x", label: "ROI on strategic initiatives" },
  { value: "90%", label: "Service-line visibility achieved" },
];

const qualifies = [
  "Private hospitals seeking sustainable revenue growth",
  "Hospital groups expanding into new markets",
  "Facilities with underperforming service lines",
  "Institutions needing payer strategy redesign",
  "Diaspora-owned hospitals entering African markets",
];

export default function StrategyGrowthPage() {
  return (
    <main>
      <section className="relative overflow-hidden text-white" style={{ paddingTop: "5rem", minHeight: "60svh" }}>
        <div className="absolute inset-0" style={{ background: "#06090f" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 80% at 80% 40%, rgba(20,130,200,0.15) 0%, rgba(12,70,130,0.06) 55%, transparent 70%)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 40% 50% at 20% 10%, rgba(201,168,76,0.1) 0%, transparent 60%)" }} />
        <div className="absolute inset-0 pointer-events-none opacity-[0.036]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize: "180px" }} />
        <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-32">
          <p className="mb-6 text-xs font-medium uppercase tracking-[0.22em]" style={{ color: "#D4AF37" }}>C4A Service</p>
          <h1 className="font-semibold leading-[1.1] tracking-tight text-white max-w-3xl" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
            Strategy, Growth<br /><span style={{ color: "rgba(255,255,255,0.65)" }}>& Commercial Performance</span>
          </h1>
          <div className="mt-6 w-12 h-[2px]" style={{ background: "#D4AF37" }} />
          <p className="mt-6 max-w-2xl leading-relaxed" style={{ fontSize: "clamp(1rem,1.5vw,1.1rem)", color: "rgba(255,255,255,0.65)" }}>
            Growth comes from aligning clinical strengths with demand, referral flows, and patient access. Not from adding more services and hoping for the best.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/contact" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm" style={{ background: "#D4AF37", color: "#0F2744" }}>Start a Conversation <ArrowRight size={15} /></Link>
            <Link href="/services" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm" style={{ border: "1px solid rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.8)" }}>All Services</Link>
          </div>
        </div>
      </section>

      <section className="py-16" style={{ background: "linear-gradient(135deg, #0B3C5D 0%, #0e4a75 100%)" }}>
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-5">
          {outcomes.map((o) => (<div key={o.value} className="glass-card p-6 text-center"><p className="text-2xl font-bold text-white mb-1">{o.value}</p><p className="text-white/60 text-xs leading-snug">{o.label}</p></div>))}
        </div>
      </section>

      <section className="py-20 px-6" style={{ background: "#F8FAFC" }}>
        <div className="max-w-5xl mx-auto">
          <p className="uppercase tracking-[0.2em] text-xs text-[#0B3C5D]/50 mb-3">Indicators</p>
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4">Is Your Hospital Leaving Revenue on the Table?</h2>
          <p className="text-gray-500 text-sm max-w-xl mb-12">Most hospitals have more growth potential than they realise. These are the signs you are underperforming commercially.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {indicators.map((s) => (<div key={s} className="flex items-center gap-3 p-4 rounded-xl" style={{ background: "#fff", border: "1px solid #e5eaf0" }}><span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs" style={{ background: "#FEF3C7", color: "#D97706" }}>!</span><span className="text-sm text-gray-700">{s}</span></div>))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6" style={{ background: "linear-gradient(145deg, #0a1e32 0%, #112e4a 100%)" }}>
        <div className="max-w-5xl mx-auto">
          <p className="uppercase tracking-[0.2em] text-xs text-white/50 mb-3">Engagement Structure</p>
          <h2 className="text-2xl md:text-3xl font-semibold text-white mb-14">How a Growth Engagement Works</h2>
          <div className="space-y-5">
            {phases.map((phase) => (<div key={phase.num} className="glass-card p-7 grid md:grid-cols-[200px_1fr] gap-6"><div><div className="inline-flex items-center justify-center w-10 h-10 rounded-full text-xs font-bold mb-3" style={{ background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.35)", color: "#D4AF37" }}>{phase.num}</div><p className="font-semibold text-white text-base mb-1">{phase.name}</p><p className="text-xs" style={{ color: "#D4AF37" }}>{phase.weeks}</p></div><div><p className="text-white/70 text-sm leading-relaxed mb-4">{phase.desc}</p><div className="flex flex-wrap gap-2">{phase.deliverables.map((d) => (<span key={d} className="px-3 py-1 rounded-full text-xs" style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>{d}</span>))}</div></div></div>))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6" style={{ background: "#ffffff" }}>
        <div className="max-w-4xl mx-auto">
          <p className="uppercase tracking-[0.2em] text-xs text-[#0B3C5D]/50 mb-3">Who This Is For</p>
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-10">The Institutions We Serve</h2>
          <div className="space-y-3">
            {qualifies.map((q) => (<div key={q} className="flex items-center gap-4 p-4 rounded-xl" style={{ border: "1px solid #e5eaf0" }}><div className="w-2 h-2 rounded-full shrink-0" style={{ background: "#D4AF37" }} /><span className="text-sm text-gray-700">{q}</span></div>))}
          </div>
          <div className="mt-12 rounded-2xl p-8" style={{ background: "#0F2744" }}>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] mb-2" style={{ color: "#D4AF37" }}>Start with a Conversation</p>
            <h3 className="text-xl font-semibold text-white mb-3">Ready to unlock your hospital&apos;s growth potential?</h3>
            <p className="text-white/60 text-sm mb-6 max-w-lg">We offer a confidential 30-minute call to understand your market position and identify the quickest wins.</p>
            <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm" style={{ background: "#D4AF37", color: "#0F2744" }}>Request a Growth Diagnostic <ArrowRight size={14} /></Link>
          </div>
        </div>
      </section>

      <PartnerCTA />
    </main>
  );
}
