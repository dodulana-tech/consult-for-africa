import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Become a Sales Agent | C4A Agent Channel",
  description: "Sell healthcare products to people you already know. Commission-based. No startup cost. No cap on earnings.",
  keywords: ["healthcare sales agent Nigeria", "commission-based sales healthcare", "become a sales agent", "healthcare product sales", "agent channel Nigeria", "earn commission healthcare"],
  openGraph: {
    title: "Become a Sales Agent | C4A Agent Channel",
    description: "Sell healthcare products to people you already know. Get paid for every deal.",
    type: "website",
    images: ["/og-image.jpg"],
  },
};

function formatCommission(type: string, value: number): string {
  if (type === "PERCENTAGE") return `Up to ${value}%`;
  if (type === "FIXED_PER_DEAL") return `NGN ${value.toLocaleString()} per deal`;
  if (type === "RECURRING") return `${value}% recurring`;
  if (type === "TIERED") return `Up to ${value}%`;
  return `${value}`;
}

export default async function AgentPage() {
  let opportunities: Awaited<ReturnType<typeof prisma.agentOpportunity.findMany>> = [];
  try {
    opportunities = await prisma.agentOpportunity.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
  } catch (err) {
    console.error("[agent] Failed to fetch opportunities:", err);
  }

  return (
    <main>
      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative overflow-hidden text-white" style={{ minHeight: "100svh", paddingTop: "5rem" }}>
        <div className="absolute inset-0" style={{ background: "#0B3C5D" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 80% at 80% 30%, rgba(14,77,110,0.6) 0%, transparent 60%)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 40% 50% at 70% 0%, rgba(212,175,55,0.1) 0%, transparent 50%)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.03, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize: "180px" }} />

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16" style={{ minHeight: "calc(100svh - 5rem)" }}>
          <div className="grid items-center gap-12 lg:grid-cols-2" style={{ minHeight: "calc(100svh - 8rem)" }}>
            {/* Copy */}
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.22em]" style={{ color: "#D4AF37" }}>
                C4A Agent Channel
              </p>
              <h1 className="mt-7 font-semibold leading-[1.08] tracking-tight text-white" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
                Sell healthcare.
                <br />
                <span style={{ color: "#D4AF37" }}>Get paid for every deal.</span>
              </h1>
              <div className="mt-6 w-12 h-[2px]" style={{ background: "#D4AF37" }} />
              <p className="mt-5 max-w-lg leading-relaxed" style={{ fontSize: "clamp(0.92rem, 1.3vw, 1.05rem)", color: "rgba(255,255,255,0.55)" }}>
                Commission-based sales for health insurance, diagnostics, wellness packages, and clinical services. Pick an opportunity. Use your network. Earn.
              </p>
              <div className="mt-9 flex flex-col sm:flex-row gap-3">
                <a href="#opportunities" className="px-7 py-3.5 rounded-lg font-semibold text-[#06090f] text-center transition hover:opacity-90 hover:scale-[1.01]" style={{ background: "#D4AF37" }}>
                  Browse Opportunities
                </a>
                <Link href="/agent/register" className="px-7 py-3.5 rounded-lg text-white text-center transition hover:bg-white/[0.08] text-sm font-medium" style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  Register Free
                </Link>
              </div>
            </div>

            {/* Earnings mockup */}
            <div className="relative hidden lg:block">
              <div className="absolute -inset-8 rounded-3xl pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(212,175,55,0.08) 0%, transparent 70%)" }} />
              <div className="relative rounded-2xl p-7" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-white/30">Agent Dashboard</span>
                    <p className="text-sm font-semibold text-white/80 mt-0.5">April 2026</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold" style={{ background: "rgba(212,175,55,0.15)", color: "#D4AF37" }}>Live</span>
                </div>

                {/* Earnings summary */}
                <div className="rounded-xl p-5 mb-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-[10px] uppercase tracking-wider text-white/30">This month</p>
                  <p className="text-3xl font-bold text-white mt-1">N847,200</p>
                  <p className="text-[11px] text-emerald-400 mt-1">+23% from last month</p>
                </div>

                {/* Deal pipeline */}
                <div className="space-y-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-white/25">Recent deals</p>
                  {[
                    { product: "Home Health Premium", client: "Adeyemi Family", amount: "N200,000", status: "Closed", statusColor: "#10B981" },
                    { product: "Flexi Health Group", client: "Alaba Traders Cooperative", amount: "N88,000", status: "Closed", statusColor: "#10B981" },
                    { product: "Flexi Health", client: "Balogun Market Association", amount: "N52,800", status: "Pending", statusColor: "#F59E0B" },
                  ].map((d) => (
                    <div key={d.client} className="flex items-center justify-between rounded-lg px-3 py-2.5" style={{ background: "rgba(255,255,255,0.025)" }}>
                      <div>
                        <p className="text-[11px] text-white/60">{d.product}</p>
                        <p className="text-[10px] text-white/30 mt-0.5">{d.client}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-semibold text-white/80">{d.amount}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: d.statusColor }}>{d.status}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Stats row */}
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    { label: "Deals closed", value: "12" },
                    { label: "Conversion", value: "34%" },
                    { label: "Commission", value: "18%" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-lg p-2.5 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="text-sm font-bold text-white">{s.value}</div>
                      <div className="text-[10px] text-white/40 mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>

                <Link href="/agent/register" className="mt-5 flex w-full items-center justify-center rounded-lg py-3 text-xs font-semibold text-[#06090f] transition hover:opacity-90" style={{ background: "#D4AF37" }}>
                  Start earning &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ HOW IT WORKS ═══════════════ */}
      <section className="py-20 bg-[#F8F9FB]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em]" style={{ color: "#D4AF37" }}>How It Works</p>
            <h2 className="mt-3 text-2xl font-bold text-gray-900 sm:text-3xl">Three steps. No complexity.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { num: "01", title: "Pick an opportunity", desc: "Each listing shows the product, who buys it, and your commission. Pick the ones where you already know the buyers." },
              { num: "02", title: "Sell with your link", desc: "We give you a tracking link and sales materials. Share with your network. Every signup and payment gets credited to you." },
              { num: "03", title: "Get paid", desc: "Commissions are calculated on verified deals. You see everything in your dashboard. You sold it, you get paid." },
            ].map((step) => (
              <div key={step.num} className="rounded-2xl bg-white p-7" style={{ border: "1px solid #E8EBF0" }}>
                <span className="text-xs font-bold tracking-wider" style={{ color: "#D4AF37" }}>{step.num}</span>
                <h3 className="mt-3 text-base font-semibold text-gray-900">{step.title}</h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ OPEN OPPORTUNITIES ═══════════════ */}
      <section id="opportunities" className="py-20 bg-white" style={{ borderTop: "1px solid #E8EBF0" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em]" style={{ color: "#D4AF37" }}>Live Now</p>
              <h2 className="mt-3 text-2xl font-bold text-gray-900 sm:text-3xl">Open Opportunities</h2>
            </div>
            {opportunities.length > 0 && (
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: "rgba(16,185,129,0.1)", color: "#059669", border: "1px solid rgba(16,185,129,0.2)" }}>
                {opportunities.length} open
              </span>
            )}
          </div>

          {opportunities.length === 0 ? (
            <div className="rounded-2xl p-12 text-center" style={{ border: "1px solid #e5eaf0", background: "#FAFBFC" }}>
              <p className="text-gray-500 text-sm mb-4">New opportunities are added regularly.</p>
              <Link href="/agent/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm text-white" style={{ background: "#0B3C5D" }}>
                Register to Get Notified <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {opportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="rounded-2xl p-6 sm:p-8 transition-all hover:shadow-md"
                  style={{ border: "1px solid #E8EBF0" }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-semibold text-gray-900">{opp.title}</h3>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ background: "rgba(212,175,55,0.1)", color: "#9a7d1a", border: "1px solid rgba(212,175,55,0.25)" }}>
                          {formatCommission(opp.commissionType, Number(opp.commissionValue))}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{opp.clientName}</p>
                      <p className="text-sm text-gray-600 leading-relaxed mt-2 line-clamp-2">{opp.description}</p>
                      {opp.territories.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {opp.territories.map((t) => (
                            <span key={t} className="px-2 py-0.5 rounded text-[11px] font-medium" style={{ background: "rgba(11,60,93,0.05)", color: "#0B3C5D" }}>{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <Link
                      href={`/agent/opportunity/${opp.id}`}
                      className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition hover:opacity-90"
                      style={{ background: "#0B3C5D" }}
                    >
                      View Details <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════ WHO THRIVES ═══════════════ */}
      <section className="py-20 bg-[#F8F9FB]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Built for people who perform</h2>
            <p className="mt-3 text-sm text-gray-500">No base salary. No cap. No office politics. Just results and money.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              "You know healthcare professionals, hospitals, or clinics personally",
              "You are active in WhatsApp groups, cooperatives, or community networks",
              "You have diaspora connections who need healthcare solutions for family in Nigeria",
              "You have sold insurance, HMO plans, or health products before",
              "You are a pharmacist, nurse, or health worker looking for extra income",
              "You know how to connect people with things they need",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 p-4 rounded-xl bg-white" style={{ border: "1px solid #E8EBF0" }}>
                <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-2" style={{ background: "#D4AF37" }} />
                <span className="text-sm text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ CTA ═══════════════ */}
      <section className="relative overflow-hidden" style={{ background: "#0B3C5D" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 50% 70% at 50% 50%, rgba(14,77,110,0.5) 0%, transparent 60%)" }} />
        <div className="relative max-w-3xl mx-auto px-6 py-20 text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Ready to start?
          </h2>
          <p className="mt-3 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
            Registration is free. Your first tracking link could be live today.
          </p>
          <div className="mt-8">
            <Link
              href="/agent/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg font-semibold text-sm transition hover:opacity-90"
              style={{ background: "#D4AF37", color: "#0B3C5D" }}
            >
              Register Now <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
