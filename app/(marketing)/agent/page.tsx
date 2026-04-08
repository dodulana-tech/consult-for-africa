import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Zap, Target, TrendingUp, Shield, Users, BarChart3, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Become a Sales Agent | CFA Agent Channel",
  description:
    "You already know people who need healthcare products. We give you something to sell and a system to get paid.",
  openGraph: {
    title: "Become a Sales Agent | CFA Agent Channel",
    description: "Turn your network into income. Commission-based healthcare sales. No cap on earnings.",
    type: "website",
    images: ["/og-image.jpg"],
  },
};

function formatCommission(type: string, value: number): string {
  if (type === "PERCENTAGE") return `Up to ${value}% per deal`;
  if (type === "FIXED_PER_DEAL") return `NGN ${value.toLocaleString()} per deal`;
  if (type === "RECURRING") return `${value}% recurring monthly`;
  if (type === "TIERED") return `Up to ${value}% commission`;
  return `${value}`;
}

export default async function AgentPage() {
  const opportunities = await prisma.agentOpportunity.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <main>
      {/* ═══════════════ HERO ═══════════════ */}
      <section
        className="relative overflow-hidden text-white"
        style={{ paddingTop: "5rem", minHeight: "85svh" }}
      >
        {/* Layered backgrounds */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(155deg, #06090f 0%, #0a1a2e 40%, #0d2440 100%)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 90% at 75% 30%, rgba(212,175,55,0.08) 0%, transparent 60%)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 50% 60% at 20% 80%, rgba(20,130,200,0.1) 0%, transparent 50%)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 90% 10%, rgba(212,175,55,0.12) 0%, transparent 30%)" }} />
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize: "180px" }} />

        <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-28 lg:py-36">
          <div className="max-w-3xl">
            {/* Tag */}
            <div className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full text-xs font-semibold" style={{ background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.3)", color: "#D4AF37" }}>
              <Sparkles size={13} />
              CFA Agent Channel
            </div>

            {/* Headline */}
            <h1 className="font-bold leading-[1.05] tracking-tight" style={{ fontSize: "clamp(2.2rem, 6vw, 4rem)" }}>
              You Know People.
              <br />
              <span style={{ color: "#D4AF37" }}>We Pay You For That.</span>
            </h1>

            <div className="mt-6 w-16 h-[3px] rounded-full" style={{ background: "linear-gradient(90deg, #D4AF37, transparent)" }} />

            <p className="mt-8 text-lg leading-relaxed max-w-xl" style={{ color: "rgba(255,255,255,0.65)" }}>
              You already know people who need healthcare products. Cooperatives, estates, clinics, diaspora families. We give you real products to sell them, a link to track every deal, and commissions that hit your account when they pay.
            </p>

            {/* Proof points */}
            <div className="mt-8 flex flex-wrap gap-6">
              {[
                { value: "20%", label: "commission on some products" },
                { value: "N0", label: "startup cost" },
                { value: "No cap", label: "on what you can earn" },
              ].map((p) => (
                <div key={p.label}>
                  <p className="text-2xl font-bold" style={{ color: "#D4AF37" }}>{p.value}</p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{p.label}</p>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="#opportunities"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-sm transition hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg, #D4AF37, #b8962e)", color: "#06090f", boxShadow: "0 4px 20px rgba(212,175,55,0.3)" }}
              >
                See Open Opportunities <ArrowRight size={15} />
              </a>
              <Link
                href="/agent/register"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-sm transition hover:bg-white/10"
                style={{ border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.9)" }}
              >
                Register as Agent
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24" style={{ background: "linear-gradient(to top, #0a1e32, transparent)" }} />
      </section>

      {/* ═══════════════ THE PITCH ═══════════════ */}
      <section className="py-20 px-6" style={{ background: "linear-gradient(180deg, #0a1e32 0%, #0d2a44 100%)" }}>
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm leading-relaxed max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.55)", fontSize: "1.1rem", lineHeight: "1.8" }}>
            Think about it. The pharmacist who knows every clinic in their LGA. The nurse whose WhatsApp group has 500 colleagues. The CHO trusted by three cooperatives. The person in London whose parents back home still need a doctor to check on them. All of these people have a network sitting there doing nothing.
          </p>
          <p className="mt-6 text-lg font-semibold text-white">
            We change that.
          </p>
        </div>
      </section>

      {/* ═══════════════ HOW IT WORKS ═══════════════ */}
      <section className="py-24 px-6" style={{ background: "#0d2a44" }}>
        <div className="max-w-5xl mx-auto">
          <p className="uppercase tracking-[0.2em] text-xs mb-3" style={{ color: "#D4AF37" }}>How It Works</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-16">Three Steps. No Complexity.</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                num: "01",
                icon: Target,
                title: "Pick Your Opportunity",
                desc: "Look through what is available. Each opportunity tells you the product, who buys it, and how much you make per sale. Pick the ones where you already know the buyers.",
              },
              {
                num: "02",
                icon: Zap,
                title: "Start Selling",
                desc: "We give you a tracking link, the pitch materials, and a quick brief on the product. You share it with your people. Every signup and payment gets credited to you automatically.",
              },
              {
                num: "03",
                icon: TrendingUp,
                title: "Get Paid",
                desc: "When a deal closes, your commission is calculated and you can see it in your dashboard. No chasing anyone. No arguments about attribution. You sold it, you get paid.",
              },
            ].map((step) => (
              <div key={step.num} className="relative">
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex items-center justify-center w-12 h-12 rounded-2xl" style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.25)" }}>
                    <step.icon size={20} style={{ color: "#D4AF37" }} />
                  </div>
                  <span className="text-xs font-bold tracking-wider" style={{ color: "#D4AF37" }}>{step.num}</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ OPEN OPPORTUNITIES ═══════════════ */}
      <section id="opportunities" className="py-24 px-6" style={{ background: "#ffffff" }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
            <div>
              <p className="uppercase tracking-[0.2em] text-xs mb-3" style={{ color: "#D4AF37" }}>Live Now</p>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Open Opportunities</h2>
              <p className="mt-2 text-sm text-gray-500">Pick one. Apply. Start earning.</p>
            </div>
            {opportunities.length > 0 && (
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: "rgba(16,185,129,0.1)", color: "#059669", border: "1px solid rgba(16,185,129,0.2)" }}>
                {opportunities.length} open
              </span>
            )}
          </div>

          {opportunities.length === 0 ? (
            <div className="rounded-2xl p-12 text-center" style={{ border: "1px solid #e5eaf0", background: "#FAFBFC" }}>
              <p className="text-gray-500 text-sm mb-4">New opportunities are added regularly. Register to get notified.</p>
              <Link href="/agent/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white" style={{ background: "#0F2744" }}>
                Register to Get Notified <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              {opportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="rounded-2xl p-6 sm:p-8 transition-all hover:shadow-lg"
                  style={{ border: "1px solid #E8EBF0", background: "#fff" }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-gray-900">{opp.title}</h3>
                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full" style={{ background: "rgba(212,175,55,0.1)", color: "#9a7d1a", border: "1px solid rgba(212,175,55,0.3)" }}>
                          {formatCommission(opp.commissionType, Number(opp.commissionValue))}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-3">{opp.clientName}</p>
                      <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{opp.description}</p>
                      {opp.territories.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {opp.territories.map((t) => (
                            <span key={t} className="px-2 py-0.5 rounded text-[11px] font-medium" style={{ background: "#F0F4FF", color: "#0B3C5D" }}>{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <Link
                      href="/agent/register"
                      className="shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
                      style={{ background: "#0B3C5D" }}
                    >
                      Apply Now <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════ WHY THIS WORKS ═══════════════ */}
      <section className="py-24 px-6" style={{ background: "#F8F9FB" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="uppercase tracking-[0.2em] text-xs mb-3" style={{ color: "#D4AF37" }}>Why This Works</p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Built for People Who Perform</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              { icon: TrendingUp, title: "No salary. No cap.", desc: "Nobody is paying you to sit somewhere. But nobody is capping what you can earn either. Some of our agents make more in commissions than they would in any salaried job." },
              { icon: Shield, title: "Every deal is tracked", desc: "Your link, your credit. The system handles attribution. No back and forth about who brought what. If someone paid through your link, that is your deal." },
              { icon: Users, title: "Healthcare only", desc: "This is not random stuff. Every product on here is healthcare. The relationships you build and the knowledge you pick up carry forward to bigger opportunities." },
              { icon: BarChart3, title: "You can see everything", desc: "Your dashboard shows what is in your pipeline, what has closed, and what you have earned. No waiting for someone to send you a report." },
            ].map((r) => (
              <div key={r.title} className="rounded-2xl bg-white p-7" style={{ border: "1px solid #E8EBF0" }}>
                <r.icon size={20} className="mb-4" style={{ color: "#D4AF37" }} />
                <h3 className="font-semibold text-gray-900 text-base mb-2">{r.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ WHO THRIVES ═══════════════ */}
      <section className="py-20 px-6 bg-white" style={{ borderTop: "1px solid #E8EBF0" }}>
        <div className="max-w-4xl mx-auto">
          <p className="uppercase tracking-[0.2em] text-xs mb-3" style={{ color: "#D4AF37" }}>Who This Is For</p>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-10">You Will Thrive Here If...</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              "You know healthcare professionals, hospitals, or clinics personally",
              "You are active in WhatsApp groups, cooperatives, or community networks",
              "You have diaspora connections who need healthcare solutions for family in Nigeria",
              "You are a pharmacist, nurse, or health worker who wants to earn on the side",
              "You have sold insurance, HMO plans, or health products before",
              "You simply know how to connect people with things they need",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 p-4 rounded-xl" style={{ border: "1px solid #f0f1f4" }}>
                <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: "#D4AF37" }} />
                <span className="text-sm text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ FINAL CTA ═══════════════ */}
      <section className="relative overflow-hidden py-24 px-6" style={{ background: "#06090f" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 80% at 50% 50%, rgba(212,175,55,0.06) 0%, transparent 60%)" }} />
        <div className="relative max-w-3xl mx-auto text-center">
          <p className="text-3xl md:text-4xl font-bold text-white leading-tight">
            You have read this far.
            <br />
            <span style={{ color: "#D4AF37" }}>That tells us something.</span>
          </p>
          <p className="mt-5 text-sm max-w-lg mx-auto leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
            Register in 2 minutes. Get your first tracking link today. Close your first deal this week.
          </p>
          <div className="mt-8">
            <Link
              href="/agent/register"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-xl font-semibold text-sm transition hover:scale-[1.02]"
              style={{ background: "linear-gradient(135deg, #D4AF37, #b8962e)", color: "#06090f", boxShadow: "0 4px 20px rgba(212,175,55,0.3)" }}
            >
              Register Now <ArrowRight size={15} />
            </Link>
          </div>
          <p className="mt-4 text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
            Free to join. Commission only. No obligations.
          </p>
        </div>
      </section>
    </main>
  );
}
