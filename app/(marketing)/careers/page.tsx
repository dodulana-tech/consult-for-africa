import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle, Globe, Users, Briefcase } from "lucide-react";

export const metadata: Metadata = {
  title: "Careers | Consult For Africa",
  description: "Join Africa's premier healthcare management consulting network. Apply to work with leading hospitals, health systems, and governments across the continent.",
};

const SPECIALTIES = [
  "Hospital Operations Management",
  "Clinical Governance & Quality",
  "Healthcare Turnaround & Recovery",
  "Digital Health & HIS Implementation",
  "Embedded Leadership",
  "Health Systems Strengthening",
  "Health Finance & Insurance (NHIS/HMO)",
  "Diaspora Healthcare Expertise",
];

const PERKS = [
  { icon: Globe, title: "Pan-African Network", desc: "Work across Nigeria, Ghana, Kenya, Rwanda, and beyond" },
  { icon: Briefcase, title: "Premium Engagements", desc: "Private hospitals, government agencies, development partners" },
  { icon: Users, title: "Elite Peer Community", desc: "Collaborate with Africa's top healthcare management talent" },
];

export default function TalentPage() {
  return (
    <div className="min-h-screen" style={{ background: "#FAFAFA" }}>
      {/* Hero — matches site visual language */}
      <section
        className="relative overflow-hidden text-white"
        style={{ paddingTop: "5rem", minHeight: "60svh" }}
      >
        {/* Base */}
        <div className="absolute inset-0" style={{ background: "#06090f" }} />

        {/* Spotlights */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 70% 80% at 80% 40%, rgba(20,130,200,0.14) 0%, rgba(12,70,130,0.05) 55%, transparent 70%)",
        }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 40% 50% at 20% 10%, rgba(201,168,76,0.09) 0%, transparent 60%)",
        }} />

        {/* Grain */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.036]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "180px",
        }} />

        <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-32">
          <p
            className="mb-6 text-xs font-medium uppercase tracking-[0.22em]"
            style={{ color: "#D4AF37" }}
          >
            CFA Talent Network
          </p>

          <h1
            className="font-semibold leading-[1.1] tracking-tight text-white max-w-3xl"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
          >
            Transform Healthcare<br />
            <span style={{ color: "rgba(255,255,255,0.65)" }}>Across Africa</span>
          </h1>

          <div className="mt-6 w-12 h-[2px]" style={{ background: "#D4AF37" }} />

          <p
            className="mt-6 max-w-xl leading-relaxed"
            style={{ color: "rgba(255,255,255,0.6)", fontSize: "1.0625rem" }}
          >
            Join Africa's most exclusive network of healthcare management consultants.
            Work with leading hospitals, health systems, and governments to build
            sustainable healthcare infrastructure.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/careers/apply"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm"
              style={{ background: "#D4AF37", color: "#0F2744" }}
            >
              Apply to Join the Network
              <ArrowRight size={15} />
            </Link>
            <Link
              href="#process"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm"
              style={{ border: "1px solid rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.8)" }}
            >
              How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-6" style={{ background: "#ffffff", borderBottom: "1px solid #e5eaf0" }}>
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          {[
            { value: "50+", label: "Active Consultants" },
            { value: "12", label: "African Countries" },
            { value: "140+", label: "Engagements Delivered" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-bold" style={{ color: "#0F2744" }}>{s.value}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why CFA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12" style={{ color: "#0F2744" }}>
            Why Join CFA's Consultant Network?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {PERKS.map((p) => (
              <div key={p.title} className="bg-white rounded-xl p-6" style={{ border: "1px solid #e5eaf0" }}>
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: "#EFF6FF" }}
                >
                  <p.icon size={20} style={{ color: "#0F2744" }} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{p.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Specialties */}
      <section className="py-20 px-6" style={{ background: "#ffffff" }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-4" style={{ color: "#0F2744" }}>
            We're Looking For Expertise In
          </h2>
          <p className="text-center text-gray-500 text-sm mb-12 max-w-xl mx-auto">
            CFA works across the full spectrum of healthcare management. If your expertise touches any of these
            domains, we want to hear from you.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {SPECIALTIES.map((s) => (
              <div key={s} className="flex items-center gap-3 p-4 rounded-xl" style={{ border: "1px solid #e5eaf0" }}>
                <CheckCircle size={16} style={{ color: "#D4AF37" }} className="shrink-0" />
                <span className="text-sm text-gray-700">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section id="process" className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12" style={{ color: "#0F2744" }}>
            The Application Process
          </h2>
          <div className="space-y-6">
            {[
              { step: "01", title: "Submit Your Application", desc: "Complete our online form with your professional background, specialty, and availability." },
              { step: "02", title: "AI-Powered Screening", desc: "Our intelligent screening system reviews your profile against current engagement needs." },
              { step: "03", title: "CFA Team Review", desc: "Our leadership team personally reviews shortlisted candidates." },
              { step: "04", title: "Onboarding & Deployment", desc: "Successful candidates join our network and are matched to suitable engagements." },
            ].map((p, i) => (
              <div key={p.step} className="flex gap-6">
                <div className="shrink-0">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: "#0F2744" }}
                  >
                    {p.step}
                  </div>
                  {i < 3 && (
                    <div className="w-0.5 h-8 mx-auto mt-2" style={{ background: "#e5eaf0" }} />
                  )}
                </div>
                <div className="pt-2 pb-4">
                  <h3 className="font-semibold text-gray-900 mb-1">{p.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/careers/apply"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-sm text-white"
              style={{ background: "#0F2744" }}
            >
              Start Your Application
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
