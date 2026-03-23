import { MapPin, Mail, Clock, Shield, Users, TrendingUp } from "lucide-react";
import PartnerCTA from "@/components/cfa/PartnerCTA";

const TRUST_SIGNALS = [
  {
    icon: Shield,
    stat: "100%",
    label: "Confidential",
    detail: "Every engagement starts under NDA. Your situation stays between us.",
  },
  {
    icon: Users,
    stat: "40+",
    label: "Consultants deployed",
    detail: "Across Nigeria, Kenya, Uganda, Ghana, and South Africa.",
  },
  {
    icon: TrendingUp,
    stat: "6",
    label: "Active engagements",
    detail: "From 50-bed clinics to 400-bed tertiary hospitals.",
  },
];

export default function ContactPage() {
  return (
    <main>
      {/* Hero */}
      <section
        className="relative overflow-hidden text-white"
        style={{ paddingTop: "5rem", minHeight: "40svh" }}
      >
        <div className="absolute inset-0" style={{ background: "#06090f" }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 60% 70% at 30% 40%, rgba(20,130,200,0.12) 0%, transparent 65%)",
        }} />
        <div className="absolute inset-0 pointer-events-none opacity-[0.036]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "180px",
        }} />
        <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-28">
          <p className="mb-5 text-xs font-medium uppercase tracking-[0.22em]" style={{ color: "#D4AF37" }}>
            Get In Touch
          </p>
          <h1 className="font-semibold leading-[1.1] tracking-tight text-white max-w-2xl"
            style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}>
            The conversation is confidential.<br />The impact is not.
          </h1>
          <div className="mt-5 w-12 h-[2px]" style={{ background: "#D4AF37" }} />
          <p className="mt-5 max-w-xl leading-relaxed" style={{ color: "rgba(255,255,255,0.6)", fontSize: "1rem" }}>
            Most of our engagements begin with a single, candid conversation between a hospital
            leader and a CFA partner. No pitch decks. No procurement cycles. Just a clear-eyed
            look at where you are and where you need to be.
          </p>
        </div>
      </section>

      {/* Contact info strip */}
      <section className="py-14 px-6" style={{ background: "#F8FAFC" }}>
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#EFF6FF" }}>
              <Mail size={15} style={{ color: "#0F2744" }} />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Partnerships</p>
              <p className="text-sm font-medium text-gray-800">partnerships@consultforafrica.com</p>
              <p className="text-xs text-gray-500 mt-0.5">hello@consultforafrica.com</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#EFF6FF" }}>
              <MapPin size={15} style={{ color: "#0F2744" }} />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Headquarters</p>
              <p className="text-sm font-medium text-gray-800">Lagos, Nigeria</p>
              <p className="text-xs text-gray-500 mt-0.5">Operating across Sub-Saharan Africa</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#EFF6FF" }}>
              <Clock size={15} style={{ color: "#0F2744" }} />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Response Time</p>
              <p className="text-sm font-medium text-gray-800">Within 48 hours</p>
              <p className="text-xs text-gray-500 mt-0.5">Executive response guaranteed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust signals */}
      <section className="py-16 px-6" style={{ background: "#fff" }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-center mb-10" style={{ color: "#D4AF37" }}>
            Why Leaders Trust Us
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {TRUST_SIGNALS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: "#F0F5FA" }}>
                  <s.icon size={18} style={{ color: "#0F2744" }} />
                </div>
                <p className="text-2xl font-bold mb-1" style={{ color: "#0F2744" }}>{s.stat}</p>
                <p className="text-sm font-semibold text-gray-700 mb-1">{s.label}</p>
                <p className="text-xs text-gray-500 max-w-[220px] mx-auto leading-relaxed">{s.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blurb */}
      <section className="py-16 px-6" style={{ background: "#F8FAFC", borderTop: "1px solid #E2E8F0", borderBottom: "1px solid #E2E8F0" }}>
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-lg leading-relaxed text-gray-700">
            &ldquo;We do not sell services. We accept mandates. Every hospital we work with
            gets the same thing: a small, senior team that treats your institution as if their
            own reputation depends on it. Because it does.&rdquo;
          </p>
          <p className="mt-5 text-sm font-semibold" style={{ color: "#0F2744" }}>
            Dr. Debo Odulana
          </p>
          <p className="text-xs text-gray-500">Founding Partner, Consult For Africa</p>
        </div>
      </section>

      {/* PartnerCTA with full form */}
      <PartnerCTA />
    </main>
  );
}
