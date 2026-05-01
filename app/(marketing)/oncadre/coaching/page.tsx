import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Career Coaching | CadreHealth",
  description:
    "Unlimited AI career advice plus 1:1 coaching with verified senior healthcare professionals. Built for Nigerian doctors, nurses, pharmacists, and all 16 cadres.",
  keywords: [
    "healthcare career coach Nigeria",
    "AI career advisor doctor",
    "nurse career coaching",
    "medical career mentor Nigeria",
    "healthcare career planning Africa",
    "doctor mentorship Nigeria",
  ],
  alternates: { canonical: "https://consultforafrica.com/oncadre/coaching" },
  openGraph: {
    title: "Career Coaching | CadreHealth",
    description: "Unlimited AI career advice plus 1:1 coaching with verified senior healthcare professionals.",
    type: "website",
  },
};

const FREE_FEATURES = [
  "3 AI career advisor messages per month",
  "Career readiness score for UK, US, Canada, Gulf",
  "Browse all verified mentors",
  "Job alerts for your cadre",
  "Hospital reviews",
];

const PRO_FEATURES = [
  "Unlimited AI career advisor",
  "Career reports and 90-day plans",
  "Salary benchmarking by cadre and city",
  "Priority mentor matching",
  "Book 1:1 coaching sessions (N5,000 each)",
  "Cancel anytime",
];

const COACHING_FEATURES = [
  "45-minute live session with a verified mentor",
  "Senior consultants, fellowship-trained specialists, diaspora experts",
  "Pick from MANSAG, ANPA, DFC, NDF-SA partner networks",
  "Topics: UK migration, US residency, fellowship prep, career transition, leadership",
  "Pay only for sessions you book",
];

export default function CoachingPricingPage() {
  return (
    <main className="bg-white">
      <section className="relative overflow-hidden text-white" style={{ paddingTop: "5rem", minHeight: "60svh" }}>
        <div className="absolute inset-0" style={{ background: "#0B3C5D" }} />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 70% 80% at 80% 30%, rgba(14,77,110,0.6) 0%, transparent 60%)" }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 40% 50% at 70% 0%, rgba(212,175,55,0.1) 0%, transparent 50%)" }}
        />

        <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-28">
          <p className="mb-6 text-xs font-medium uppercase tracking-[0.22em]" style={{ color: "#D4AF37" }}>
            CadreHealth Coaching
          </p>
          <h1
            className="font-semibold leading-[1.1] tracking-tight max-w-3xl"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
          >
            Career advice for healthcare professionals,
            <br />
            <span style={{ color: "rgba(255,255,255,0.65)" }}>without the consulting fees.</span>
          </h1>
          <div className="mt-6 w-12 h-[2px]" style={{ background: "#D4AF37" }} />
          <p className="mt-6 max-w-2xl text-base text-white/70 leading-relaxed">
            Unlimited AI career advisor for less than the cost of lunch. Plus 1:1 coaching with senior consultants
            and diaspora professionals when you need a real conversation.
          </p>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="rounded-2xl border bg-white p-8" style={{ borderColor: "#E8EBF0" }}>
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Free</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-gray-900">N0</span>
                  <span className="text-sm text-gray-500">forever</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Get a feel for the platform. Test the AI advisor and explore the mentor network.
              </p>
              <ul className="space-y-3 mb-8">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                    <Check size={16} className="mt-0.5 flex-shrink-0 text-gray-400" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/oncadre/register"
                className="block w-full rounded-xl border py-3 text-center text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                style={{ borderColor: "#E8EBF0" }}
              >
                Create free account
              </Link>
            </div>

            <div
              className="relative rounded-2xl border-2 bg-white p-8"
              style={{ borderColor: "#D4AF37", boxShadow: "0 8px 24px rgba(212, 175, 55, 0.12)" }}
            >
              <div
                className="absolute -top-3 left-8 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider text-white"
                style={{ background: "#D4AF37" }}
              >
                Recommended
              </div>
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#D4AF37" }}>
                  Pro
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-gray-900">N1,500</span>
                  <span className="text-sm text-gray-500">/ month</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Less than a plate of jollof. Unlimited career guidance plus access to paid coaching sessions.
              </p>
              <ul className="space-y-3 mb-8">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                    <Check size={16} className="mt-0.5 flex-shrink-0" style={{ color: "#D4AF37" }} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/oncadre/coaching/upgrade"
                className="block w-full rounded-xl py-3 text-center text-sm font-semibold text-white transition hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #0B3C5D, #0d4a73)" }}
              >
                Upgrade to Pro
              </Link>
            </div>
          </div>

          <div className="mt-16 rounded-2xl p-8 md:p-12" style={{ background: "#F8F9FB" }}>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                  Pay per session
                </p>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">1:1 Coaching Sessions</h2>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-bold" style={{ color: "#0B3C5D" }}>
                    N5,000
                  </span>
                  <span className="text-sm text-gray-500">/ 45 min session</span>
                </div>
                <p className="text-sm text-gray-600 mb-6">
                  When you need to talk to a real person. Book a senior healthcare professional from our verified
                  network. Pro subscription required to book.
                </p>
                <Link
                  href="/oncadre/mentorship/mentors"
                  className="inline-flex items-center gap-2 text-sm font-medium"
                  style={{ color: "#0B3C5D" }}
                >
                  Browse mentors
                  <span aria-hidden>→</span>
                </Link>
              </div>
              <ul className="space-y-3">
                {COACHING_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                    <Check size={16} className="mt-0.5 flex-shrink-0" style={{ color: "#D4AF37" }} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-16 max-w-3xl mx-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Common questions</h2>
            <div className="space-y-6">
              <div>
                <p className="font-semibold text-gray-900 mb-1">Can I cancel anytime?</p>
                <p className="text-sm text-gray-600">
                  Yes. Cancel from your dashboard. You keep Pro access until the end of your billing period.
                </p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Are mentors really verified?</p>
                <p className="text-sm text-gray-600">
                  Every mentor is verified against MDCN, NMCN, PCN, or their international regulatory body. Partner
                  organisations like MANSAG, ANPA, DFC also vouch for their members.
                </p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">What payment methods do you accept?</p>
                <p className="text-sm text-gray-600">
                  Card, bank transfer, or USSD via Paystack. All payments in Naira.
                </p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Why is the AI advisor so cheap?</p>
                <p className="text-sm text-gray-600">
                  We are building this for healthcare workers in Nigeria, not Silicon Valley. Pricing reflects what
                  is actually affordable on a Nigerian salary.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
