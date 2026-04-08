import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PartnerCTA from "@/components/cfa/PartnerCTA";

export const metadata: Metadata = { title: "Commercial Distribution | Consult For Africa", description: "You built the product. We build the sales channel. Commission-based agent networks for healthcare companies that want distribution without headcount.", openGraph: { title: "Commercial Distribution | Consult For Africa", description: "Commission-based agent networks for healthcare products and services across Nigeria.", type: "website", images: ["/og-image.jpg"] } };

const features = ["You pay for results, not salaries", "Agents are live within 4 weeks", "Every deal is tracked and attributed", "We manage the agents so you do not have to"];
const phases = [
  { num: "01", name: "We Learn Your Product", weeks: "Week 1", desc: "We sit with you. We understand what you sell, who buys it, how the money works, and what a good deal looks like. We design a commission model that makes agents want to sell it and makes the economics work for you.", deliverables: ["Commission structure", "Target customer profile", "Territory plan"] },
  { num: "02", name: "We Find the Right Agents", weeks: "Weeks 2 to 4", desc: "We recruit from our network of healthcare professionals, community health workers, and commercial operators. Not random people. People who already know the buyers. We vet them, brief them, and give them their tracking links.", deliverables: ["Vetted agent cohort", "Product training completed", "Live tracking links"] },
  { num: "03", name: "They Start Selling", weeks: "Ongoing", desc: "Agents go to work. They share your product with their networks, close deals, and every transaction is tracked in real time. You see pipeline, conversion, and revenue on a dashboard. Not in a WhatsApp group.", deliverables: ["Live deal pipeline", "Revenue by agent and territory", "Conversion reporting"] },
  { num: "04", name: "We Handle the Rest", weeks: "Ongoing", desc: "Commission calculation, agent performance management, underperformer replacement, territory rebalancing, and scaling. You focus on product and delivery. We focus on getting it sold.", deliverables: ["Commission payouts", "Agent performance reviews", "Scaling plan"] },
];
const qualifies = [
  "You have a healthcare product or service that works, and now you need people to sell it",
  "You are spending on sales reps who are not performing, and you want to pay for results instead",
  "You are a healthtech startup that needs field distribution but cannot afford a sales team yet",
  "You run a lab or diagnostic centre and want to sell health check packages to corporates and cooperatives",
  "You are an HMO or health insurer that needs community-level enrollment agents across multiple LGAs",
  "You are a hospital selling wellness packages, elective procedures, IVF cycles, or orthopaedic surgery and you need referral agents",
  "You run a pharmacy chain or home care service that needs local agents to drive signups in specific territories",
  "You are entering the Nigerian market and need boots on the ground without setting up an office",
];

export default function DistributionPage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden text-white" style={{ paddingTop: "5rem", minHeight: "65svh" }}><div className="absolute inset-0" style={{ background: "linear-gradient(155deg, #06090f 0%, #0a1a2e 40%, #0d2440 100%)" }} /><div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 80% at 80% 40%, rgba(212,175,55,0.08) 0%, transparent 60%)" }} /><div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 50% 60% at 20% 80%, rgba(20,130,200,0.1) 0%, transparent 50%)" }} /><div className="absolute inset-0 pointer-events-none opacity-[0.036]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize: "180px" }} />
        <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-32">
          <p className="mb-6 text-xs font-medium uppercase tracking-[0.22em]" style={{ color: "#D4AF37" }}>CFA Engagement Model</p>
          <h1 className="font-bold leading-[1.08] tracking-tight text-white max-w-3xl" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>You Built the Product.<br /><span style={{ color: "#D4AF37" }}>We Build the Sales Channel.</span></h1>
          <div className="mt-6 w-16 h-[3px] rounded-full" style={{ background: "linear-gradient(90deg, #D4AF37, transparent)" }} />
          <p className="mt-8 max-w-2xl leading-relaxed text-lg" style={{ color: "rgba(255,255,255,0.6)" }}>
            You do not need more sales reps on payroll. You need a commission-based agent network that only gets paid when they close deals. We recruit the agents, train them on your product, give them tracking links, and manage their performance. You just watch the revenue come in.
          </p>
          <div className="mt-8 flex flex-wrap gap-6">
            {[
              { value: "4 weeks", label: "to first agent selling" },
              { value: "0", label: "upfront headcount cost" },
              { value: "100%", label: "performance-based" },
            ].map((p) => (
              <div key={p.label}>
                <p className="text-2xl font-bold" style={{ color: "#D4AF37" }}>{p.value}</p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{p.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-4"><Link href="/solutions/distribution/request" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-sm transition hover:scale-[1.02]" style={{ background: "linear-gradient(135deg, #D4AF37, #b8962e)", color: "#06090f", boxShadow: "0 4px 20px rgba(212,175,55,0.3)" }}>List Your Product <ArrowRight size={15} /></Link><Link href="/agent" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-sm" style={{ border: "1px solid rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.8)" }}>I Want to Be an Agent</Link></div>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-20 px-6" style={{ background: "linear-gradient(180deg, #0d2440 0%, #0a1e32 100%)" }}>
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)", fontSize: "1.1rem", lineHeight: "1.8" }}>
            Every healthcare founder hits the same wall. The product works. Customers love it. But getting it in front of the next 1,000 customers means hiring sales people, paying base salaries, managing targets, dealing with underperformance, and hoping the unit economics still work after all that overhead.
          </p>
          <p className="mt-6 text-lg font-semibold text-white">
            What if you only paid when someone actually sold something?
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-16" style={{ background: "linear-gradient(135deg, #0B3C5D 0%, #0e4a75 100%)" }}><div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-5">{features.map((f) => (<div key={f} className="glass-card p-6 text-center"><p className="text-white text-sm font-medium">{f}</p></div>))}</div></section>

      {/* Process */}
      <section className="py-24 px-6" style={{ background: "linear-gradient(145deg, #0a1e32 0%, #112e4a 100%)" }}><div className="max-w-5xl mx-auto"><p className="uppercase tracking-[0.2em] text-xs text-white/50 mb-3">How It Works</p><h2 className="text-2xl md:text-3xl font-bold text-white mb-14">From Product to Pipeline in 4 Weeks</h2><div className="space-y-5">{phases.map((phase) => (<div key={phase.num} className="glass-card p-7 grid md:grid-cols-[200px_1fr] gap-6"><div><div className="inline-flex items-center justify-center w-10 h-10 rounded-full text-xs font-bold mb-3" style={{ background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.35)", color: "#D4AF37" }}>{phase.num}</div><p className="font-semibold text-white text-base mb-1">{phase.name}</p><p className="text-xs" style={{ color: "#D4AF37" }}>{phase.weeks}</p></div><div><p className="text-white/70 text-sm leading-relaxed mb-4">{phase.desc}</p><div className="flex flex-wrap gap-2">{phase.deliverables.map((d) => (<span key={d} className="px-3 py-1 rounded-full text-xs" style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>{d}</span>))}</div></div></div>))}</div></div></section>

      {/* Pricing */}
      <section className="py-24 px-6" style={{ background: "linear-gradient(155deg, #0a1a2e 0%, #0d2440 60%, #112e4a 100%)" }}>
        <div className="max-w-5xl mx-auto">
          <p className="uppercase tracking-[0.2em] text-xs text-white/50 mb-3">Pricing</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Transparent Pricing</h2>
          <p className="text-white/50 text-sm mb-12 max-w-lg">Three tiers. Pick what fits.</p>
          <div className="grid md:grid-cols-3 gap-5">
            {/* Starter */}
            <div className="glass-card p-7 flex flex-col">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] mb-1" style={{ color: "#D4AF37" }}>Starter</p>
              <p className="text-2xl font-bold text-white mb-5">N200,000</p>
              <ul className="space-y-2.5 text-sm text-white/70 flex-1">
                <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: "#D4AF37" }} />Commission structure design</li>
                <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: "#D4AF37" }} />Up to 10 recruited agents</li>
                <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: "#D4AF37" }} />Basic sales brief and tracking links</li>
                <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: "#D4AF37" }} />Monthly performance summary</li>
              </ul>
              <p className="mt-5 text-xs text-white/40">Best for: Early-stage companies testing agent distribution</p>
              <Link href="/solutions/distribution/request" className="mt-5 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition hover:opacity-90" style={{ background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.35)", color: "#D4AF37" }}>Get Started <ArrowRight size={14} /></Link>
            </div>
            {/* Growth */}
            <div className="glass-card p-7 flex flex-col" style={{ border: "1px solid rgba(212,175,55,0.35)" }}>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] mb-1" style={{ color: "#D4AF37" }}>Growth</p>
              <p className="text-2xl font-bold text-white mb-5">N750,000</p>
              <ul className="space-y-2.5 text-sm text-white/70 flex-1">
                <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: "#D4AF37" }} />Everything in Starter</li>
                <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: "#D4AF37" }} />Up to 25 recruited agents</li>
                <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: "#D4AF37" }} />Custom pitch deck and sales materials</li>
                <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: "#D4AF37" }} />Territory planning and assignment</li>
                <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: "#D4AF37" }} />Bi-weekly performance reviews</li>
              </ul>
              <p className="mt-5 text-xs text-white/40">Best for: Companies ready to scale distribution across Lagos</p>
              <Link href="/solutions/distribution/request" className="mt-5 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition hover:scale-[1.02]" style={{ background: "linear-gradient(135deg, #D4AF37, #b8962e)", color: "#06090f", boxShadow: "0 4px 20px rgba(212,175,55,0.3)" }}>Get Started <ArrowRight size={14} /></Link>
            </div>
            {/* Enterprise */}
            <div className="glass-card p-7 flex flex-col">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] mb-1" style={{ color: "#D4AF37" }}>Enterprise</p>
              <p className="text-2xl font-bold text-white mb-5">N2,000,000+</p>
              <ul className="space-y-2.5 text-sm text-white/70 flex-1">
                <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: "#D4AF37" }} />Everything in Growth</li>
                <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: "#D4AF37" }} />Unlimited agent recruitment</li>
                <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: "#D4AF37" }} />Dedicated account manager</li>
                <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: "#D4AF37" }} />Custom CRM integration</li>
                <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: "#D4AF37" }} />Weekly reporting and agent coaching</li>
              </ul>
              <p className="mt-5 text-xs text-white/40">Best for: Established companies building a national sales channel</p>
              <Link href="/solutions/distribution/request" className="mt-5 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition hover:opacity-90" style={{ background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.35)", color: "#D4AF37" }}>Get Started <ArrowRight size={14} /></Link>
            </div>
          </div>
          <p className="mt-8 text-xs text-white/40 text-center max-w-2xl mx-auto">
            All tiers include: Commission override (CFA retains 20-30% of commission pool as management fee). Agent commissions disbursed via CFA escrow for trust and transparency.
          </p>
        </div>
      </section>

      {/* Who This Is For */}
      <section className="py-20 px-6" style={{ background: "#ffffff" }}><div className="max-w-4xl mx-auto"><p className="uppercase tracking-[0.2em] text-xs text-[#0B3C5D]/50 mb-3">Who This Is For</p><h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-10">This Works If...</h2><div className="space-y-3">{qualifies.map((q) => (<div key={q} className="flex items-start gap-4 p-4 rounded-xl" style={{ border: "1px solid #e5eaf0" }}><div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: "#D4AF37" }} /><span className="text-sm text-gray-700">{q}</span></div>))}</div>

        {/* CTA box */}
        <div className="mt-12 rounded-2xl p-8 sm:p-10" style={{ background: "#0F2744" }}>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] mb-2" style={{ color: "#D4AF37" }}>Ready to talk?</p>
          <h3 className="text-xl font-bold text-white mb-3">Tell us what you sell. We will tell you how fast we can move it.</h3>
          <p className="text-white/50 text-sm mb-6 max-w-lg">
            Send us your product details, pricing, and target market. We will come back with a commission model, an agent recruitment plan, and a timeline. No pitch deck required. Just the basics.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/solutions/distribution/request" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm" style={{ background: "#D4AF37", color: "#0F2744" }}>List Your Product <ArrowRight size={14} /></Link>
            <a href="mailto:partnerships@consultforafrica.com" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white/70 hover:text-white transition" style={{ border: "1px solid rgba(255,255,255,0.15)" }}>partnerships@consultforafrica.com</a>
          </div>
        </div>
      </div></section>
      <PartnerCTA />
    </main>
  );
}
