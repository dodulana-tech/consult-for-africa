import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PartnerCTA from "@/components/cfa/PartnerCTA";

export const metadata: Metadata = {
  title: "Clinical Governance & Accreditation | Consult For Africa",
  description: "Consult For Africa strengthens clinical governance structures and prepares healthcare institutions for JCI, COHSASA, and SafeCare accreditation across Africa.",
  keywords: ["clinical governance Africa", "JCI accreditation consulting", "COHSASA accreditation", "SafeCare accreditation Nigeria", "patient safety consulting", "hospital quality improvement Africa"],
  openGraph: { title: "Clinical Governance & Accreditation | Consult For Africa", description: "We prepare healthcare institutions for international accreditation and embed governance that lasts.", type: "website", images: ["/og-image.jpg"] },
};

const indicators = ["Clinical incidents without root cause analysis", "No standardised clinical protocols across departments", "Accreditation attempts failing or stalling", "Weak infection control and patient safety systems", "Poor clinical documentation and audit trails", "Board-level disconnect from clinical quality"];
const phases = [
  { num: "01", name: "Governance Assessment", weeks: "Weeks 1 to 4", desc: "Full review of existing clinical governance structures, patient safety systems, documentation practices, and quality indicators against international standards.", deliverables: ["Governance maturity assessment", "Gap analysis vs accreditation standards", "Risk register"] },
  { num: "02", name: "Framework Design", weeks: "Weeks 4 to 10", desc: "Design and document clinical governance frameworks, standard operating procedures, and quality monitoring systems tailored to your institution.", deliverables: ["Clinical governance charter", "SOPs and protocols library", "Quality committee structure"] },
  { num: "03", name: "Accreditation Preparation", weeks: "Months 3 to 9", desc: "Intensive preparation for your target accreditation. Mock surveys, staff training, documentation completion, and system hardening.", deliverables: ["Mock survey results", "Staff training completion", "Documentation audit"] },
  { num: "04", name: "Certification & Sustainment", weeks: "Months 9 to 15", desc: "Support through the formal survey process and build internal capability to sustain accreditation through subsequent cycles.", deliverables: ["Accreditation survey support", "Internal audit programme", "Sustainability framework"] },
];
const outcomes = [
  { value: "100%", label: "Accreditation success rate (JCI, COHSASA, SafeCare)" },
  { value: "70%", label: "Reduction in reportable clinical incidents" },
  { value: "50%", label: "Improvement in documentation compliance" },
  { value: "Full", label: "Governance framework embedded and operational" },
];
const qualifies = ["Hospitals preparing for JCI, COHSASA, or SafeCare", "Facilities with recurring clinical safety incidents", "Institutions undergoing regulatory review", "Hospital groups needing standardised governance", "New facilities building governance from scratch"];

export default function ClinicalGovernancePage() {
  return (
    <main>
      <section className="relative overflow-hidden text-white" style={{ paddingTop: "5rem", minHeight: "60svh" }}>
        <div className="absolute inset-0" style={{ background: "#06090f" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 80% at 80% 40%, rgba(20,130,200,0.15) 0%, rgba(12,70,130,0.06) 55%, transparent 70%)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 40% 50% at 20% 10%, rgba(201,168,76,0.1) 0%, transparent 60%)" }} />
        <div className="absolute inset-0 pointer-events-none opacity-[0.036]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize: "180px" }} />
        <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-32">
          <p className="mb-6 text-xs font-medium uppercase tracking-[0.22em]" style={{ color: "#D4AF37" }}>C4A Service</p>
          <h1 className="font-semibold leading-[1.1] tracking-tight text-white max-w-3xl" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>Clinical Governance<br /><span style={{ color: "rgba(255,255,255,0.65)" }}>& Accreditation</span></h1>
          <div className="mt-6 w-12 h-[2px]" style={{ background: "#D4AF37" }} />
          <p className="mt-6 max-w-2xl leading-relaxed" style={{ fontSize: "clamp(1rem,1.5vw,1.1rem)", color: "rgba(255,255,255,0.65)" }}>Strong quality systems protect patients and build institutional credibility. We prepare healthcare institutions for international accreditation and embed governance that lasts.</p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/contact" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm" style={{ background: "#D4AF37", color: "#0F2744" }}>Start a Conversation <ArrowRight size={15} /></Link>
            <Link href="/services" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm" style={{ border: "1px solid rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.8)" }}>All Services</Link>
          </div>
        </div>
      </section>
      <section className="py-16" style={{ background: "linear-gradient(135deg, #0B3C5D 0%, #0e4a75 100%)" }}><div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-5">{outcomes.map((o) => (<div key={o.value} className="glass-card p-6 text-center"><p className="text-2xl font-bold text-white mb-1">{o.value}</p><p className="text-white/60 text-xs leading-snug">{o.label}</p></div>))}</div></section>
      <section className="py-20 px-6" style={{ background: "#F8FAFC" }}><div className="max-w-5xl mx-auto"><p className="uppercase tracking-[0.2em] text-xs text-[#0B3C5D]/50 mb-3">Indicators</p><h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4">Is Your Clinical Quality at Risk?</h2><p className="text-gray-500 text-sm max-w-xl mb-12">These warning signs suggest your governance structures need urgent attention.</p><div className="grid sm:grid-cols-2 gap-3">{indicators.map((s) => (<div key={s} className="flex items-center gap-3 p-4 rounded-xl" style={{ background: "#fff", border: "1px solid #e5eaf0" }}><span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs" style={{ background: "#FEF3C7", color: "#D97706" }}>!</span><span className="text-sm text-gray-700">{s}</span></div>))}</div></div></section>
      <section className="py-24 px-6" style={{ background: "linear-gradient(145deg, #0a1e32 0%, #112e4a 100%)" }}><div className="max-w-5xl mx-auto"><p className="uppercase tracking-[0.2em] text-xs text-white/50 mb-3">Engagement Structure</p><h2 className="text-2xl md:text-3xl font-semibold text-white mb-14">How a Governance Engagement Works</h2><div className="space-y-5">{phases.map((phase) => (<div key={phase.num} className="glass-card p-7 grid md:grid-cols-[200px_1fr] gap-6"><div><div className="inline-flex items-center justify-center w-10 h-10 rounded-full text-xs font-bold mb-3" style={{ background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.35)", color: "#D4AF37" }}>{phase.num}</div><p className="font-semibold text-white text-base mb-1">{phase.name}</p><p className="text-xs" style={{ color: "#D4AF37" }}>{phase.weeks}</p></div><div><p className="text-white/70 text-sm leading-relaxed mb-4">{phase.desc}</p><div className="flex flex-wrap gap-2">{phase.deliverables.map((d) => (<span key={d} className="px-3 py-1 rounded-full text-xs" style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>{d}</span>))}</div></div></div>))}</div></div></section>
      <section className="py-20 px-6" style={{ background: "#ffffff" }}><div className="max-w-4xl mx-auto"><p className="uppercase tracking-[0.2em] text-xs text-[#0B3C5D]/50 mb-3">Who This Is For</p><h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-10">The Institutions We Serve</h2><div className="space-y-3">{qualifies.map((q) => (<div key={q} className="flex items-center gap-4 p-4 rounded-xl" style={{ border: "1px solid #e5eaf0" }}><div className="w-2 h-2 rounded-full shrink-0" style={{ background: "#D4AF37" }} /><span className="text-sm text-gray-700">{q}</span></div>))}</div><div className="mt-12 rounded-2xl p-8" style={{ background: "#0F2744" }}><p className="text-xs font-semibold uppercase tracking-[0.15em] mb-2" style={{ color: "#D4AF37" }}>Start with a Conversation</p><h3 className="text-xl font-semibold text-white mb-3">Preparing for accreditation?</h3><p className="text-white/60 text-sm mb-6 max-w-lg">We offer a confidential gap assessment to help you understand where you stand and what it will take to get there.</p><Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm" style={{ background: "#D4AF37", color: "#0F2744" }}>Request a Gap Assessment <ArrowRight size={14} /></Link></div></div></section>
      <PartnerCTA />
    </main>
  );
}
