import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PartnerCTA from "@/components/cfa/PartnerCTA";

export const metadata: Metadata = {
  title: "About | Consult For Africa",
  description:
    "Consult For Africa is an Africa-focused healthcare management and transformation firm. Built by operators, for operators.",
  openGraph: {
    title: "About | Consult For Africa",
    description: "Africa-focused healthcare management and transformation firm. Built by operators, for operators.",
    type: "website",
    images: ["/og-image.jpg"],
  },
};

/* ─── Team data ───────────────────────────────────────────────────── */

const foundingPartner = {
  name:  "Dr. Debo Odulana",
  title: "Founding Partner",
  photo: "/debo-odulana.jpg",   // Place photo in /public
  bio: [
    "Debo is a medical doctor and healthcare management consultant with 15 years spent turning around hospitals, building health systems, and proving that African healthcare can be both high-quality and financially sustainable. He has served as CEO of Cedarcrest Hospitals Abuja, Chief Innovation & Strategy Officer at Evercare Hospital Lekki, and founded Doctoora, Africa's first integrated private healthcare network spanning 21 states, which he later sold to Evercare.",
    "What distinguishes Debo is his refusal to stay in the advisory lane. He has built commercial teams from scratch, restructured senior leadership, deployed digital platforms under pressure, and driven revenue growth in environments where that was considered impossible. His thinking is shaped by clinical practice, Imperial College business training, and nearly two decades of field-level experience across Nigeria and beyond.",
    "He founded Consult For Africa because he believed Africa's hospitals deserved a firm that actually understood them, and was willing to stay long enough to transform them.",
  ],
  linkedin: "https://www.linkedin.com/in/deboodulana/",
};

/* Placeholder slots - swap in real data when profiles are ready */
const team: {
  name: string;
  title: string;
  practice: string;
  bio: string;
  photo?: string;
}[] = [
  /* Add up to 8 consultant profiles here */
];

/* ─── Values ──────────────────────────────────────────────────────── */

const values = [
  {
    label: "Execution-First",
    desc:  "We embed, implement, and deliver. Not just advise. Every engagement ends with measurable outcomes.",
  },
  {
    label: "African Context",
    desc:  "Our models are built for African realities: resource constraints, system fragility, and the pace of change on the continent.",
  },
  {
    label: "Institutional Trust",
    desc:  "We protect confidentiality, operate with discretion, and build long-term relationships with the organisations we serve.",
  },
  {
    label: "Multidisciplinary Depth",
    desc:  "Clinical, commercial, digital, and governance expertise. Fielded as an integrated team, not individual consultants.",
  },
];

/* ─── Page ────────────────────────────────────────────────────────── */

export default function AboutPage() {
  return (
    <main>

      {/* ══ HERO ════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden text-white"
        style={{ paddingTop: "5rem", minHeight: "55svh" }}
      >
        <style>{`
          @keyframes ab1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-30px,20px) scale(1.05)} }
          .ab1 { animation: ab1 16s ease-in-out infinite; will-change: transform; }
        `}</style>

        <div className="absolute inset-0" style={{ background: "#06090f" }} />

        {/* Spotlight */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 70% 85% at 85% 40%, rgba(20,130,200,0.16) 0%, rgba(12,70,130,0.06) 50%, transparent 70%)",
        }}/>
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 40% 50% at 75% 5%, rgba(201,168,76,0.1) 0%, transparent 60%)",
        }}/>

        {/* Grain */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.036]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "180px",
        }}/>

        <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-32">
          <p
            className="mb-7 text-xs font-medium uppercase tracking-[0.22em]"
            style={{ color: "#D4AF37" }}
          >
            About Consult For Africa
          </p>

          <h1
            className="font-semibold leading-[1.1] tracking-tight text-white max-w-3xl"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
          >
            Built by Operators,<br />
            <span style={{ color: "rgba(255,255,255,0.65)" }}>for Africa&apos;s Health Systems</span>
          </h1>

          <div className="mt-6 w-12 h-[2px]" style={{ background: "#D4AF37" }}/>

          <p
            className="mt-6 max-w-2xl leading-relaxed"
            style={{ fontSize: "clamp(1rem,1.5vw,1.15rem)", color: "rgba(255,255,255,0.65)" }}
          >
            Consult For Africa is an Africa-focused healthcare management and transformation
            firm supporting operators, investors, and institutions to strengthen performance,
            governance, and execution across the continent.
          </p>
        </div>
      </section>

      {/* ══ WHY CFA ════════════════════════════════════════════════ */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-14 items-center">
            <div>
              <p className="uppercase tracking-[0.2em] text-xs text-[#0B3C5D]/50 mb-3">Our Purpose</p>
              <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-5">
                Africa's health systems need more than advice.
              </h2>
              <div className="w-10 h-[2px] bg-[#D4AF37] mb-6"/>
              <p className="text-gray-600 leading-relaxed mb-5">
                Most consulting firms leave a report. We leave a transformed organisation.
                CFA was founded on one conviction: the gap between healthcare strategy
                and real outcomes in Africa is an execution gap, not a knowledge gap.
              </p>
              <p className="text-gray-600 leading-relaxed">
                We close that gap by embedding into the institutions we serve. We operate
                as management partners with shared accountability for outcomes. Our team
                brings clinical credibility, commercial discipline, and hard-earned
                operational experience across African health systems.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              {[
                ["135+",      "Combined years of leadership experience"],
                ["5 countries", "Active engagements across the continent"],
                ["$1.1M+",    "Annual savings delivered in a single engagement"],
                ["15+",       "Years of African health system experience"],
              ].map(([stat, label]) => (
                <div
                  key={stat}
                  className="rounded-xl p-6"
                  style={{
                    background: "#F8FAFC",
                    border: "1px solid #e5eaf0",
                  }}
                >
                  <p className="text-2xl font-semibold text-[#0B3C5D]">{stat}</p>
                  <p className="text-sm text-gray-500 mt-1 leading-snug">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ VALUES ══════════════════════════════════════════════════ */}
      <section
        className="py-20 px-6"
        style={{ background: "linear-gradient(145deg, #0a1e32 0%, #112e4a 100%)" }}
      >
        <div className="max-w-5xl mx-auto">
          <p className="uppercase tracking-[0.2em] text-xs text-white/50 mb-3 text-center">How We Work</p>
          <h2 className="text-2xl md:text-3xl font-semibold text-white text-center mb-12">
            What Makes CFA Different
          </h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {values.map((v) => (
              <div key={v.label} className="glass-card p-7">
                <h3 className="font-semibold text-white mb-2 text-base">{v.label}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FOUNDING PARTNER ════════════════════════════════════════ */}
      <section
        className="py-24 px-6"
        style={{ background: "linear-gradient(135deg, #071626 0%, #0d2540 100%)" }}
      >
        <div className="max-w-5xl mx-auto">
          <p className="uppercase tracking-[0.2em] text-xs text-white/50 mb-3">Leadership</p>
          <h2 className="text-2xl md:text-3xl font-semibold text-white mb-14">Founding Partner</h2>

          <div className="glass-card p-8 md:p-10 grid md:grid-cols-[280px_1fr] gap-10 items-start">

            {/* Photo */}
            <div>
              <div
                className="relative overflow-hidden rounded-2xl mb-5"
                style={{ height: "320px" }}
              >
                <Image
                  src={foundingPartner.photo}
                  alt={foundingPartner.name}
                  fill
                  className="object-cover object-top"
                />
              </div>

              <a
                href={foundingPartner.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-white transition hover:bg-white/[0.12]"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.13)",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn Profile
              </a>
            </div>

            {/* Bio */}
            <div>
              <p
                className="text-xs font-medium mb-1"
                style={{
                  color: "#D4AF37",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                }}
              >
                {foundingPartner.title}
              </p>
              <h3 className="text-2xl font-semibold text-white mb-1">{foundingPartner.name}</h3>
              <p className="text-white/45 text-sm mb-5">
                MBBS · MSc International Health Management (Imperial College London)
              </p>

              <div className="w-10 h-[2px] mb-5" style={{ background: "#D4AF37" }}/>

              <div className="space-y-4">
                {foundingPartner.bio.map((para, i) => (
                  <p key={i} className="text-white/70 leading-relaxed text-sm">{para}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ TEAM (consultants - populated when profiles are ready) ══ */}
      {team.length > 0 && (
        <section
          className="py-24 px-6"
          style={{ background: "linear-gradient(145deg, #0a1e32 0%, #112e4a 100%)" }}
        >
          <div className="max-w-6xl mx-auto">
            <p className="uppercase tracking-[0.2em] text-xs text-white/50 mb-3">Consultants</p>
            <h2 className="text-2xl md:text-3xl font-semibold text-white mb-12">Our Team</h2>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {team.map((member) => (
                <div key={member.name} className="glass-card p-7">
                  {member.photo && (
                    <div className="relative w-16 h-16 rounded-full overflow-hidden mb-4">
                      <Image src={member.photo} alt={member.name} fill className="object-cover"/>
                    </div>
                  )}
                  <p
                    className="text-xs font-medium mb-0.5 uppercase tracking-widest"
                    style={{ color: "#D4AF37" }}
                  >
                    {member.practice}
                  </p>
                  <h3 className="font-semibold text-white mb-1">{member.name}</h3>
                  <p className="text-white/50 text-xs mb-3">{member.title}</p>
                  <p className="text-white/60 text-sm leading-relaxed">{member.bio}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ CTA ═════════════════════════════════════════════════════ */}
      <PartnerCTA />

    </main>
  );
}
