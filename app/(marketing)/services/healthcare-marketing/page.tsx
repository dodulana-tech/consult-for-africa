import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PartnerCTA from "@/components/cfa/PartnerCTA";

export const metadata: Metadata = {
  title: "Healthcare Marketing Agency | Consult For Africa",
  description:
    "Empowering health brands through strategic marketing. A specialist healthcare marketing agency for hospitals, HMOs, NGOs, and life sciences companies across Africa. Brand strategy, campaigns, creative, digital, and analytics.",
  keywords: [
    "healthcare marketing agency Africa",
    "healthcare marketing agency Nigeria",
    "hospital marketing Lagos",
    "pharmaceutical marketing Africa",
    "health brand strategy",
    "patient engagement marketing",
    "medical advertising compliance",
    "health communications agency",
    "HMO marketing",
    "public health campaign agency",
  ],
  alternates: {
    canonical: "https://consultforafrica.com/services/healthcare-marketing",
  },
  openGraph: {
    title: "Healthcare Marketing Agency | Consult For Africa",
    description:
      "Empowering health brands through strategic marketing. Specialist marketing for hospitals, HMOs, NGOs, and life sciences across Africa.",
    type: "website",
    images: ["/og-image.jpg"],
  },
};

const marketingJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Healthcare Marketing Agency",
    serviceType: "Healthcare Marketing and Communications",
    provider: { "@type": "Organization", name: "Consult For Africa", url: "https://consultforafrica.com" },
    areaServed: "Africa",
    url: "https://consultforafrica.com/services/healthcare-marketing",
    description:
      "Brand strategy, market research, campaign management, creative, digital marketing, influencer and community engagement, public relations, and analytics for healthcare organisations across Africa.",
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://consultforafrica.com" },
      { "@type": "ListItem", position: 2, name: "Services", item: "https://consultforafrica.com/services" },
      { "@type": "ListItem", position: 3, name: "Healthcare Marketing", item: "https://consultforafrica.com/services/healthcare-marketing" },
    ],
  },
];

const disciplines = [
  { value: "Behavioural science", label: "Journeys designed to nudge healthier actions, not just impressions" },
  { value: "Digital analytics", label: "Live dashboards, real-time optimisation, and measured ROI" },
  { value: "Human-centred design", label: "Built around how patients and clinicians actually behave" },
  { value: "Medical vetting", label: "Every claim co-developed with clinicians and checked for compliance" },
];

const context = [
  {
    title: "Digital transformation",
    body:
      "COVID-19 accelerated the shift to digital health across Africa and globally. Around 41% of African internet users now regularly seek health information online. That creates real opportunity in telemedicine, mobile clinics, health apps, and remote patient engagement, and every one of them needs marketing to reach scale and equity.",
  },
  {
    title: "Consumer-centric health",
    body:
      "Patients and providers increasingly treat healthcare as a consumer service. Health brands now have to excel at consumer-driven marketing: personalised care delivered through genuinely engaging experiences. That means making medical information accessible through stories, trusted voices, and apps, and treating patient experience as the differentiator it has become.",
  },
];

const phases = [
  {
    num: "01",
    name: "Discovery & Insight",
    desc:
      "Rigorous market research and stakeholder interviews with patients, clinicians, and regulators to surface unmet needs and brand opportunity. We audit existing channels, competitor activity, and epidemiological data to build insight you can act on.",
    deliverables: ["Market and competitor audit", "Stakeholder research", "Patient journey mapping", "Insight report"],
  },
  {
    num: "02",
    name: "Strategy & Planning",
    desc:
      "A clear brand and communications strategy: positioning, messaging hierarchy from technical language through to patient-friendly stories, media strategy, and a KPI framework. We align on business and clinical objectives, then define the omnichannel roadmap.",
    deliverables: ["Brand positioning", "Messaging hierarchy", "Media and channel strategy", "KPI framework"],
  },
  {
    num: "03",
    name: "Creative & Campaign Development",
    desc:
      "Campaigns and content that simplify complexity without sacrificing scientific integrity. Branding, storytelling, digital content, and experiential work, all co-developed with medical experts, extended through trusted healthcare professionals and patient advocates.",
    deliverables: ["Identity and tone", "Video and animation", "Digital content", "Influencer programmes"],
  },
  {
    num: "04",
    name: "Execution, Analytics & Optimisation",
    desc:
      "Multichannel deployment with precise targeting and compliance checks. Live dashboards let us adjust messaging, channels, and budget while the campaign is running. After it closes we measure brand lift, patient acquisition, and ROI, then iterate.",
    deliverables: ["Campaign deployment", "Live analytics dashboard", "Behavioural journey design", "Impact and ROI report"],
  },
];

const offerings = [
  {
    num: "01",
    title: "Brand Strategy & Positioning",
    points: ["Brand architecture and value proposition", "Patient and persona segmentation", "Naming, logo, and identity design", "Brand guidelines and governance"],
  },
  {
    num: "02",
    title: "Market Research & Insights",
    points: ["Epidemiological and competitive analysis", "Patient journey mapping", "Qualitative focus groups", "Digital listening and health equity audits"],
  },
  {
    num: "03",
    title: "Campaign Planning & Management",
    points: ["Multichannel media planning, digital and traditional", "Content calendars", "Patient recruitment campaigns", "Advocacy programme management"],
  },
  {
    num: "04",
    title: "Creative Services",
    points: ["Medical and consumer copywriting", "Graphic design and infographics", "Video production and animation", "Patient stories and testimonials, medically vetted"],
  },
  {
    num: "05",
    title: "Digital Marketing & Technology",
    points: ["Website and mobile app development", "SEO and paid search", "Social media strategy and execution", "Email, SMS, and telehealth platform marketing"],
  },
  {
    num: "06",
    title: "Influencer & Community Engagement",
    points: ["Healthcare professional influencer programmes", "Patient advocate networks", "Social community management", "Events and webinars"],
  },
  {
    num: "07",
    title: "Public Relations & Advertising",
    points: ["Press relations and health journalism outreach", "Media training for spokespeople", "Print and out of home design", "TV and radio production"],
  },
  {
    num: "08",
    title: "Analytics & CRM",
    points: ["Campaign tracking dashboards", "Patient engagement analytics", "CRM and lead nurturing setup", "A/B testing and ROI analysis"],
  },
];

const models = [
  {
    name: "Retainer advisory",
    desc: "Ongoing strategic support such as digital roadmaps and quarterly campaigns, on a set monthly fee.",
  },
  {
    name: "Project based",
    desc: "Fixed-price engagements for one-off initiatives: a brand launch, a single campaign, a website build.",
  },
  {
    name: "Hybrid",
    desc: "A retained strategic core with project work layered on top, structured per client and per initiative.",
  },
];

const why = [
  {
    title: "Pan-African perspective",
    desc: "We understand local cultures, languages, and market nuance across Africa, and apply global best practice to all of it.",
  },
  {
    title: "Healthcare domain expertise",
    desc: "Our team has worked with health clients internationally. We speak the language of healthcare and meet sector standards from day one.",
  },
  {
    title: "Integrated approach",
    desc: "Strategy, creative, technology, and analytics in one place. One partner rather than four vendors to coordinate.",
  },
  {
    title: "Client partnership",
    desc: "We operate as an extension of your team, through deep-dive workshops, co-creation sessions, and deliberate knowledge transfer.",
  },
  {
    title: "Impact driven",
    desc: "Success is measured in health outcomes: awareness of critical health issues, patient engagement, and stronger health brands.",
  },
];

const clients = [
  "Hospitals and hospital groups building brand and patient volume",
  "HMOs and insurers driving enrolment, retention, and member engagement",
  "NGOs and development partners running behaviour change and public health campaigns",
  "Life sciences and pharmaceutical companies launching into African markets",
  "Healthtech and telemedicine ventures scaling patient acquisition",
  "Diagnostics, laboratories, and specialist practices building referral demand",
];

export default function HealthcareMarketingPage() {
  return (
    <main>
      {marketingJsonLd.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      {/* ══ HERO ════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden text-white" style={{ paddingTop: "5rem", minHeight: "60svh" }}>
        <div className="absolute inset-0" style={{ background: "#06090f" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 80% at 80% 40%, rgba(20,130,200,0.15) 0%, rgba(12,70,130,0.06) 55%, transparent 70%)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 40% 50% at 20% 10%, rgba(201,168,76,0.1) 0%, transparent 60%)" }} />
        <div className="absolute inset-0 pointer-events-none opacity-[0.036]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize: "180px" }} />
        <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-32">
          <p className="mb-6 text-xs font-medium uppercase tracking-[0.22em]" style={{ color: "#D4AF37" }}>
            C4A Service &middot; New Practice
          </p>
          <h1 className="font-semibold leading-[1.1] tracking-tight text-white max-w-3xl" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
            Healthcare<br />
            <span style={{ color: "rgba(255,255,255,0.65)" }}>Marketing Agency</span>
          </h1>
          <div className="mt-6 w-12 h-[2px]" style={{ background: "#D4AF37" }} />
          <p className="mt-6 max-w-2xl leading-relaxed" style={{ fontSize: "clamp(1.05rem,1.6vw,1.25rem)", color: "rgba(255,255,255,0.85)" }}>
            Empowering health brands through strategic marketing.
          </p>
          <p className="mt-4 max-w-2xl leading-relaxed" style={{ fontSize: "clamp(0.95rem,1.4vw,1.05rem)", color: "rgba(255,255,255,0.55)" }}>
            A specialist agency for hospitals, HMOs, NGOs, and life sciences companies
            across Africa. Global best-practice process, local understanding.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/contact" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm" style={{ background: "#D4AF37", color: "#0F2744" }}>
              Start a Conversation <ArrowRight size={15} />
            </Link>
            <Link href="/services" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm" style={{ border: "1px solid rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.8)" }}>
              All Services
            </Link>
          </div>
        </div>
      </section>

      {/* ══ VALUE PROPOSITION ═══════════════════════════════════════ */}
      <section className="py-20 px-6" style={{ background: "#ffffff" }}>
        <div className="max-w-4xl mx-auto text-center">
          <p className="uppercase tracking-[0.2em] text-xs text-[#0B3C5D]/50 mb-4">Our Value Proposition</p>
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-6 leading-snug">
            We are more than an agency. We are healthcare partners.
          </h2>
          <p className="text-gray-500 leading-relaxed">
            Our multidisciplinary team blends data-driven strategy with medical expertise and
            creativity. We leverage behavioural science, digital analytics, and human-centred
            design to drive patient engagement, brand loyalty, and better health outcomes.
            We craft campaigns that meet audiences where they already are, on smartphones and
            social platforms, while upholding strict regulatory standards.
          </p>
        </div>
      </section>

      {/* ══ DISCIPLINES ═════════════════════════════════════════════ */}
      <section className="py-16" style={{ background: "linear-gradient(135deg, #0B3C5D 0%, #0e4a75 100%)" }}>
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-5">
          {disciplines.map((d) => (
            <div key={d.value} className="glass-card p-6 text-center">
              <p className="text-base font-bold text-white mb-2">{d.value}</p>
              <p className="text-white/60 text-xs leading-snug">{d.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ INDUSTRY CONTEXT ════════════════════════════════════════ */}
      <section className="py-20 px-6" style={{ background: "#F8FAFC" }}>
        <div className="max-w-5xl mx-auto">
          <p className="uppercase tracking-[0.2em] text-xs text-[#0B3C5D]/50 mb-3">Industry Context</p>
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-12">Why Health Brands Are Rethinking Marketing</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {context.map((c) => (
              <div key={c.title} className="rounded-2xl p-8" style={{ background: "#fff", border: "1px solid #e5eaf0" }}>
                <div className="w-8 h-[2px] mb-5" style={{ background: "#D4AF37" }} />
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{c.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{c.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 text-center text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Health organisations need a specialised partner who understands both healthcare and
            marketing. That is the gap this agency was built to fill.
          </p>
        </div>
      </section>

      {/* ══ METHODOLOGY ═════════════════════════════════════════════ */}
      <section className="py-24 px-6" style={{ background: "linear-gradient(145deg, #0a1e32 0%, #112e4a 100%)" }}>
        <div className="max-w-5xl mx-auto">
          <p className="uppercase tracking-[0.2em] text-xs text-white/50 mb-3">Methodology</p>
          <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4">Four Integrated Phases</h2>
          <p className="text-white/50 text-sm max-w-2xl mb-14">
            Collaborative, data-driven, and built for the complexity of healthcare.
          </p>
          <div className="space-y-5">
            {phases.map((phase) => (
              <div key={phase.num} className="glass-card p-7 grid md:grid-cols-[200px_1fr] gap-6">
                <div>
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full text-xs font-bold mb-3" style={{ background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.35)", color: "#D4AF37" }}>{phase.num}</div>
                  <p className="font-semibold text-white text-base">{phase.name}</p>
                </div>
                <div>
                  <p className="text-white/70 text-sm leading-relaxed mb-4">{phase.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {phase.deliverables.map((d) => (
                      <span key={d} className="px-3 py-1 rounded-full text-xs" style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>{d}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SERVICE OFFERINGS ═══════════════════════════════════════ */}
      <section className="py-24" style={{ background: "#06090f" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mb-16">
            <p className="text-xs uppercase tracking-[0.25em] mb-4" style={{ color: "#D4AF37" }}>Service Offerings</p>
            <h2 className="font-semibold text-white leading-tight" style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)" }}>
              The Full Healthcare Marketing Spectrum
            </h2>
            <p className="mt-4 leading-relaxed" style={{ color: "rgba(255,255,255,0.5)", fontSize: "1.05rem" }}>
              Take the whole function or a single discipline. Strategy, creative,
              technology, and analytics sit under one roof.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-px" style={{ background: "rgba(255,255,255,0.06)" }}>
            {offerings.map((o) => (
              <div key={o.num} className="p-8 transition-colors duration-300 hover:bg-[#0a1320]" style={{ background: "#06090f" }}>
                <span className="text-xs font-semibold tracking-[0.2em] tabular-nums" style={{ color: "#D4AF37" }}>{o.num}</span>
                <h3 className="font-semibold text-white leading-snug mt-5 mb-5" style={{ fontSize: "1.15rem" }}>{o.title}</h3>
                <ul className="space-y-2">
                  {o.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-3 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                      <span style={{ color: "#D4AF37", marginTop: "2px", flexShrink: 0 }}>&#x2014;</span>
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ ENGAGEMENT MODELS ═══════════════════════════════════════ */}
      <section className="py-20 px-6" style={{ background: "#ffffff" }}>
        <div className="max-w-5xl mx-auto">
          <p className="uppercase tracking-[0.2em] text-xs text-[#0B3C5D]/50 mb-3">Engagement Models</p>
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-12">How You Engage Us</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {models.map((m) => (
              <div key={m.name} className="rounded-2xl p-7" style={{ background: "#F8FAFC", border: "1px solid #e5eaf0" }}>
                <div className="w-8 h-[2px] mb-5" style={{ background: "#D4AF37" }} />
                <h3 className="text-base font-semibold text-gray-900 mb-3">{m.name}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ WHY C4A ═════════════════════════════════════════════════ */}
      <section className="py-24 px-6" style={{ background: "linear-gradient(145deg, #0a1e32 0%, #112e4a 100%)" }}>
        <div className="max-w-5xl mx-auto">
          <p className="uppercase tracking-[0.2em] text-xs text-white/50 mb-3">Why Consult For Africa</p>
          <h2 className="text-2xl md:text-3xl font-semibold text-white mb-14">What You Get That You Do Not Get Elsewhere</h2>
          <div className="grid md:grid-cols-2 gap-5">
            {why.map((w, i) => (
              <div
                key={w.title}
                className={`glass-card p-7 ${i === why.length - 1 && why.length % 2 === 1 ? "md:col-span-2" : ""}`}
              >
                <h3 className="font-semibold text-white text-base mb-2">{w.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ WHO WE SERVE ════════════════════════════════════════════ */}
      <section className="py-20 px-6" style={{ background: "#ffffff" }}>
        <div className="max-w-4xl mx-auto">
          <p className="uppercase tracking-[0.2em] text-xs text-[#0B3C5D]/50 mb-3">Who We Serve</p>
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-10">Trusted Across the Health Sector</h2>
          <div className="space-y-3">
            {clients.map((c) => (
              <div key={c} className="flex items-center gap-4 p-4 rounded-xl" style={{ border: "1px solid #e5eaf0" }}>
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: "#D4AF37" }} />
                <span className="text-sm text-gray-700">{c}</span>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-2xl p-8" style={{ background: "#0F2744" }}>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] mb-2" style={{ color: "#D4AF37" }}>Start with a Conversation</p>
            <h3 className="text-xl font-semibold text-white mb-3">Tell us what you are trying to move</h3>
            <p className="text-white/60 text-sm mb-6 max-w-lg">
              Awareness, enrolment, patient acquisition, or behaviour change. We will tell you
              what it takes and whether we are the right partner for it.
            </p>
            <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm" style={{ background: "#D4AF37", color: "#0F2744" }}>
              Brief the Agency <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      <PartnerCTA />
    </main>
  );
}
