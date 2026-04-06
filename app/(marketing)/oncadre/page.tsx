import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "CadreHealth | Know Your Worth. Advance Your Career.",
  description:
    "The career platform for African healthcare professionals. Check your readiness score, see real salaries, review hospitals, and find your next opportunity.",
};

/* ─── data ────────────────────────────────────────────────────────────────── */

const stats = [
  { value: "4,000+", label: "Doctors left Nigeria in 2024" },
  { value: "80%", label: "Healthcare workers plan to emigrate" },
  { value: "1:3,500", label: "Doctor-to-patient ratio (WHO says 1:600)" },
  { value: "N0", label: "Platforms built for Nigerian healthcare careers" },
];

const features = [
  {
    icon: "\u2191",
    title: "Career Readiness Score",
    description:
      "Free assessment. See your employability at home and your readiness for the UK, US, Canada, and the Gulf. Know exactly what's standing between you and your next move.",
    cta: "Check your score",
    href: "/oncadre/readiness",
    accent: "#10B981",
  },
  {
    icon: "\u20A6",
    title: "Salary Intelligence",
    description:
      "Real compensation data from verified professionals. See what your cadre earns at every facility, in every city. No more guessing, no more getting underpaid.",
    cta: "See the salary map",
    href: "/oncadre/salary-map",
    accent: "#F59E0B",
  },
  {
    icon: "\u2605",
    title: "Hospital Reviews",
    description:
      "Anonymous, verified reviews from people who actually work there. Equipment quality, pay timeliness, call duty, management, safety. Know before you go.",
    cta: "Read reviews",
    href: "/oncadre/hospitals",
    accent: "#3B82F6",
  },
  {
    icon: "\u2713",
    title: "Credential Wallet",
    description:
      "Your practicing license, qualifications, CPD points, and international exam scores in one place. Tracked, verified, and portable. Never scramble for documents again.",
    cta: "Build your profile",
    href: "/oncadre/register",
    accent: "#8B5CF6",
  },
];

const cadres = [
  "Doctors", "Nurses", "Midwives", "Pharmacists", "Lab Scientists",
  "Radiographers", "Physiotherapists", "Dentists", "Optometrists",
  "CHOs & CHEWs", "Environmental Health", "Dietitians",
  "Psychologists", "Public Health", "Health Admin", "Biomed Engineers",
];

/* ─── page ────────────────────────────────────────────────────────────────── */

export default function CadreHealthLanding() {
  return (
    <main className="bg-white">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0B3C5D] via-[#0E4D6E] to-[#0B3C5D]">
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32 lg:py-40">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm text-white/90 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              By Consult For Africa
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Know your worth.
              <br />
              <span className="text-[#D4AF37]">Advance your career.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/80 sm:text-xl">
              The career intelligence platform for African healthcare
              professionals. Real salary data. Honest hospital reviews.
              Verified credentials. Whether you&apos;re staying, earning
              more, or planning your next move.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/oncadre/readiness"
                className="inline-flex items-center justify-center rounded-lg bg-[#D4AF37] px-8 py-3.5 text-base font-semibold text-[#0B3C5D] shadow-lg transition hover:bg-[#C4A030] hover:shadow-xl"
              >
                Check your readiness score
                <span className="ml-2">&rarr;</span>
              </Link>
              <Link
                href="/oncadre/register"
                className="inline-flex items-center justify-center rounded-lg border border-white/30 px-8 py-3.5 text-base font-semibold text-white transition hover:bg-white/10"
              >
                Join the network
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="border-b bg-gray-50">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 py-10 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-bold text-[#0B3C5D] sm:text-3xl">
                {s.value}
              </div>
              <div className="mt-1 text-sm text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── All cadres ── */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
          Built for every healthcare professional
        </h2>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {cadres.map((c) => (
            <span
              key={c}
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm"
            >
              {c}
            </span>
          ))}
        </div>
      </section>

      {/* ── Feature cards ── */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            Everything you need in one place
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition hover:shadow-md"
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-xl font-bold text-white"
                  style={{ backgroundColor: f.accent }}
                >
                  {f.icon}
                </div>
                <h3 className="mt-5 text-xl font-bold text-gray-900">
                  {f.title}
                </h3>
                <p className="mt-3 text-gray-600 leading-relaxed">
                  {f.description}
                </p>
                <Link
                  href={f.href}
                  className="mt-5 inline-flex items-center text-sm font-semibold transition"
                  style={{ color: f.accent }}
                >
                  {f.cta}
                  <span className="ml-1 transition group-hover:translate-x-1">
                    &rarr;
                  </span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
          How CadreHealth works
        </h2>
        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {[
            {
              step: "1",
              title: "Check your score",
              desc: "Take the free Career Readiness assessment. 2 minutes. See where you stand domestically and internationally.",
            },
            {
              step: "2",
              title: "Build your profile",
              desc: "Add your credentials, experience, and preferences. Get verified. Your profile becomes your portable professional identity.",
            },
            {
              step: "3",
              title: "Unlock opportunities",
              desc: "Access the salary map, hospital reviews, and job matches. Contribute data, get data. The more you share, the more you see.",
            },
          ].map((s) => (
            <div key={s.step} className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#0B3C5D] text-xl font-bold text-white">
                {s.step}
              </div>
              <h3 className="mt-4 text-lg font-bold text-gray-900">
                {s.title}
              </h3>
              <p className="mt-2 text-gray-600">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-[#0B3C5D]">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Your career deserves better data.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
            Join thousands of healthcare professionals building their career
            on verified intelligence, not rumour.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/oncadre/readiness"
              className="inline-flex items-center justify-center rounded-lg bg-[#D4AF37] px-8 py-3.5 text-base font-semibold text-[#0B3C5D] shadow-lg transition hover:bg-[#C4A030]"
            >
              Check your readiness score
            </Link>
            <Link
              href="/oncadre/register"
              className="inline-flex items-center justify-center rounded-lg border border-white/30 px-8 py-3.5 text-base font-semibold text-white transition hover:bg-white/10"
            >
              Create free profile
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
