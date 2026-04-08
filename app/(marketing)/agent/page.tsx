import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Search, ShieldCheck, DollarSign } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Become an Agent | CFA Agent Channel",
  description:
    "Join a network of independent sales partners representing trusted healthcare brands. Commission-based, flexible, and performance-rewarded.",
  openGraph: {
    title: "Become an Agent | CFA Agent Channel",
    description:
      "Earn commissions selling healthcare products and services across Nigeria and the diaspora.",
    type: "website",
    images: ["/og-image.jpg"],
  },
};

const steps = [
  {
    icon: Search,
    title: "Browse & Apply",
    desc: "Explore open opportunities from healthcare companies. Each listing shows the product, target market, and commission structure. Apply for the ones that match your network.",
  },
  {
    icon: ShieldCheck,
    title: "Get Approved & Sell",
    desc: "Once approved, you receive a unique tracking link, sales materials, and a briefing. Every lead and deal is attributed to you automatically.",
  },
  {
    icon: DollarSign,
    title: "Earn Commissions",
    desc: "Commissions are calculated on verified deals and paid directly. Your dashboard shows pipeline, earnings, and performance in real time.",
  },
];

const reasons = [
  {
    title: "No base salary, no cap",
    desc: "Your earnings scale with your effort. Top agents earn multiples of what a salaried role would pay.",
  },
  {
    title: "Healthcare focus",
    desc: "Every opportunity is in the healthcare sector. Build expertise and relationships that compound over time.",
  },
  {
    title: "Full attribution",
    desc: "Every lead and deal is tracked via your unique link. No disputes, no missed commissions.",
  },
  {
    title: "Support and tools",
    desc: "Sales materials, product training, and a dedicated dashboard to track your pipeline and earnings.",
  },
];

function formatCommission(type: string, value: number): string {
  if (type === "PERCENTAGE") return `${value}% per deal`;
  if (type === "FIXED_PER_DEAL") return `NGN ${value.toLocaleString()} per deal`;
  if (type === "RECURRING") return `${value}% recurring`;
  if (type === "TIERED") return "Tiered commission";
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
      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden text-white"
        style={{ paddingTop: "5rem", minHeight: "70svh" }}
      >
        <div className="absolute inset-0" style={{ background: "#06090f" }} />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 80% at 80% 40%, rgba(20,130,200,0.15) 0%, rgba(12,70,130,0.06) 55%, transparent 70%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 40% 50% at 20% 10%, rgba(201,168,76,0.1) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.036]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "180px",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-32">
          <p
            className="mb-6 text-xs font-medium uppercase tracking-[0.22em]"
            style={{ color: "#D4AF37" }}
          >
            CFA Agent Channel
          </p>
          <h1
            className="font-semibold leading-[1.1] tracking-tight text-white max-w-3xl"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
          >
            Earn While You Build Healthcare
          </h1>
          <div className="mt-6 w-12 h-[2px]" style={{ background: "#D4AF37" }} />
          <p
            className="mt-6 max-w-2xl leading-relaxed"
            style={{
              fontSize: "clamp(1rem,1.5vw,1.1rem)",
              color: "rgba(255,255,255,0.65)",
            }}
          >
            Join a network of independent sales partners representing trusted
            healthcare brands. Commission-based. Flexible.
            Performance-rewarded.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="#opportunities"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm"
              style={{ background: "#D4AF37", color: "#0F2744" }}
            >
              Browse Opportunities <ArrowRight size={15} />
            </a>
            <Link
              href="/agent/register"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm"
              style={{
                border: "1px solid rgba(255,255,255,0.18)",
                color: "rgba(255,255,255,0.8)",
              }}
            >
              Register as Agent
            </Link>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section
        className="py-24 px-6"
        style={{
          background: "linear-gradient(145deg, #0a1e32 0%, #112e4a 100%)",
        }}
      >
        <div className="max-w-5xl mx-auto">
          <p className="uppercase tracking-[0.2em] text-xs text-white/50 mb-3">
            How It Works
          </p>
          <h2 className="text-2xl md:text-3xl font-semibold text-white mb-14">
            Three Steps to Earning
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <div key={step.title} className="glass-card p-8">
                <div
                  className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-5"
                  style={{
                    background: "rgba(212,175,55,0.12)",
                    border: "1px solid rgba(212,175,55,0.35)",
                  }}
                >
                  <step.icon size={20} style={{ color: "#D4AF37" }} />
                </div>
                <p className="text-xs font-bold mb-2" style={{ color: "#D4AF37" }}>
                  Step {i + 1}
                </p>
                <p className="font-semibold text-white text-base mb-2">
                  {step.title}
                </p>
                <p className="text-white/60 text-sm leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Open Opportunities ── */}
      <section
        id="opportunities"
        className="py-24 px-6"
        style={{ background: "#ffffff" }}
      >
        <div className="max-w-5xl mx-auto">
          <p className="uppercase tracking-[0.2em] text-xs text-[#0B3C5D]/50 mb-3">
            Open Opportunities
          </p>
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-10">
            Current Listings
          </h2>

          {opportunities.length === 0 ? (
            <div
              className="rounded-2xl p-10 text-center"
              style={{ border: "1px solid #e5eaf0" }}
            >
              <p className="text-gray-500 text-sm mb-4">
                No open opportunities right now. New listings are added
                regularly.
              </p>
              <Link
                href="/agent/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm"
                style={{ background: "#0F2744", color: "#ffffff" }}
              >
                Register to Get Notified <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              {opportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="rounded-2xl p-6"
                  style={{ border: "1px solid #e5eaf0" }}
                >
                  <p className="font-semibold text-gray-900 text-base mb-1">
                    {opp.title}
                  </p>
                  <p className="text-xs text-gray-500 mb-3">{opp.clientName}</p>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-3">
                    {opp.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        background: "rgba(212,175,55,0.1)",
                        color: "#9a7d1a",
                        border: "1px solid rgba(212,175,55,0.3)",
                      }}
                    >
                      {formatCommission(
                        opp.commissionType,
                        Number(opp.commissionValue),
                      )}
                    </span>
                    {opp.territories.length > 0 && (
                      <span
                        className="px-3 py-1 rounded-full text-xs"
                        style={{
                          background: "rgba(11,60,93,0.06)",
                          color: "#0B3C5D",
                          border: "1px solid rgba(11,60,93,0.15)",
                        }}
                      >
                        {opp.territories.join(", ")}
                      </span>
                    )}
                  </div>
                  <Link
                    href="/agent/register"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold"
                    style={{ color: "#0B3C5D" }}
                  >
                    View Details <ArrowRight size={13} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Why Agents Choose Us ── */}
      <section
        className="py-24 px-6"
        style={{
          background: "linear-gradient(145deg, #0a1e32 0%, #112e4a 100%)",
        }}
      >
        <div className="max-w-5xl mx-auto">
          <p className="uppercase tracking-[0.2em] text-xs text-white/50 mb-3">
            Why Agents Choose Us
          </p>
          <h2 className="text-2xl md:text-3xl font-semibold text-white mb-14">
            Built for Performance
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            {reasons.map((r) => (
              <div key={r.title} className="glass-card p-7">
                <div
                  className="w-2 h-2 rounded-full mb-4"
                  style={{ background: "#D4AF37" }}
                />
                <p className="font-semibold text-white text-base mb-2">
                  {r.title}
                </p>
                <p className="text-white/60 text-sm leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section
        className="py-24 px-6"
        style={{ background: "#06090f" }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(20,130,200,0.08) 0%, transparent 70%)",
          }}
        />
        <div className="max-w-3xl mx-auto text-center relative">
          <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4">
            Ready to start earning?
          </h2>
          <p
            className="text-sm mb-8 max-w-lg mx-auto leading-relaxed"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            Register as an agent to browse opportunities and apply.
          </p>
          <Link
            href="/agent/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-sm"
            style={{ background: "#D4AF37", color: "#0F2744" }}
          >
            Register Now <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </main>
  );
}
