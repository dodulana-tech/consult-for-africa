"use client";

import Link from "next/link";

const cadres = [
  "Doctors", "Nurses", "Midwives", "Pharmacists", "Lab Scientists",
  "Radiographers", "Physiotherapists", "Dentists", "Optometrists",
  "CHOs & CHEWs", "Environmental Health", "Dietitians",
  "Psychologists", "Public Health", "Health Admin", "Biomedical Engineers",
];

export default function CadreHealthLanding() {
  return (
    <main className="bg-[#FAFAFA]">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "CadreHealth",
            url: "https://consultforafrica.com/oncadre",
            description: "The career platform for Nigerian healthcare professionals. Real salary data, hospital reviews, credential management, and career readiness assessments.",
            applicationCategory: "HealthApplication",
            operatingSystem: "Web",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "NGN",
              description: "Free career readiness assessment and professional profile",
            },
            creator: {
              "@type": "Organization",
              name: "Consult For Africa",
              url: "https://consultforafrica.com",
            },
            audience: {
              "@type": "Audience",
              audienceType: "Healthcare professionals in Nigeria",
            },
            aggregateRating: {
              "@type": "AggregateRating",
              ratingCount: 73,
              bestRating: 5,
              worstRating: 1,
              itemReviewed: {
                "@type": "Thing",
                name: "Nigerian Healthcare Facilities",
              },
            },
          }),
        }}
      />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden text-white" style={{ minHeight: "100svh", paddingTop: "5rem" }}>
        {/* Light premium background */}
        <div className="absolute inset-0" style={{ background: "#0B3C5D" }} />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 70% 80% at 80% 30%, rgba(14,77,110,0.6) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 40% 50% at 70% 0%, rgba(212,175,55,0.1) 0%, transparent 50%)",
          }}
        />
        {/* Subtle grain */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.03,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "180px",
          }}
        />

        <div
          className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16"
          style={{ minHeight: "calc(100svh - 5rem)" }}
        >
          <div className="grid items-center gap-12 lg:grid-cols-2" style={{ minHeight: "calc(100svh - 8rem)" }}>
            {/* Left: Copy */}
            <div>
              <p
                className="text-xs font-medium uppercase tracking-[0.22em]"
                style={{ color: "#D4AF37" }}
              >
                The Career Platform for Nigerian Healthcare Professionals
              </p>

              <h1
                className="mt-7 font-semibold leading-[1.08] tracking-tight text-white"
                style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
              >
                You trained for years.
                <br />
                <span style={{ color: "#D4AF37" }}>
                  How ready are you?
                </span>
              </h1>

              <div className="mt-6 w-12 h-[2px]" style={{ background: "#D4AF37" }} />

              <p
                className="mt-5 max-w-lg leading-relaxed"
                style={{
                  fontSize: "clamp(0.92rem, 1.3vw, 1.05rem)",
                  color: "rgba(255,255,255,0.55)",
                }}
              >
                Real salary data. Honest hospital reviews. Verified credentials.
                <br />
                For doctors, nurses, pharmacists, and every cadre in between.
              </p>

              {/* CTAs */}
              <div className="mt-9 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/oncadre/readiness"
                  className="px-7 py-3.5 rounded-lg font-semibold text-[#06090f] text-center transition hover:opacity-90 hover:scale-[1.01]"
                  style={{ background: "#D4AF37" }}
                >
                  Check Your Readiness Score
                </Link>
                <Link
                  href="/oncadre/register"
                  className="px-7 py-3.5 rounded-lg text-white text-center transition hover:bg-white/[0.08] text-sm font-medium"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  Join Free
                </Link>
              </div>

              {/* Cadre chips */}
              <div className="mt-12 flex flex-wrap gap-2">
                {cadres.slice(0, 6).map((c) => (
                  <div
                    key={c}
                    className="px-3 py-1.5 rounded-md text-[11px] font-medium"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.4)",
                    }}
                  >
                    {c}
                  </div>
                ))}
                <div
                  className="px-3 py-1.5 rounded-md text-[11px] font-medium"
                  style={{
                    background: "rgba(212,175,55,0.08)",
                    border: "1px solid rgba(212,175,55,0.15)",
                    color: "rgba(212,175,55,0.6)",
                  }}
                >
                  +10 more cadres
                </div>
              </div>
            </div>

            {/* Right: Readiness Score Preview */}
            <div className="relative hidden lg:block">
              {/* Glow */}
              <div
                className="absolute -inset-8 rounded-3xl pointer-events-none"
                style={{ background: "radial-gradient(ellipse at center, rgba(212,175,55,0.08) 0%, transparent 70%)" }}
              />
              <div
                className="relative rounded-2xl p-7"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                }}
              >
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm font-semibold text-white/80">Your Career Readiness</span>
                  <span
                    className="px-2.5 py-1 rounded-md text-[10px] font-semibold"
                    style={{ background: "rgba(212,175,55,0.15)", color: "#D4AF37" }}
                  >
                    CadreHealth
                  </span>
                </div>

                {/* Score ring */}
                <div className="flex items-center gap-5">
                  <div className="relative h-[88px] w-[88px] shrink-0">
                    <svg className="h-[88px] w-[88px] -rotate-90" viewBox="0 0 88 88">
                      <circle cx="44" cy="44" r="38" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                      <circle
                        cx="44" cy="44" r="38" fill="none" strokeWidth="5" strokeLinecap="round"
                        stroke="rgba(255,255,255,0.15)"
                        strokeDasharray={`${2 * Math.PI * 38}`}
                        strokeDashoffset={`${2 * Math.PI * 38 * 0.6}`}
                        style={{ animation: "pulse 3s ease-in-out infinite" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold text-white/25">?</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-white/70">Domestic Employability</p>
                    <p className="text-xs text-white/30 mt-0.5">Where do you stand?</p>
                  </div>
                </div>

                {/* Destinations */}
                <div className="mt-6 grid grid-cols-4 gap-2.5">
                  {[
                    { label: "UK", color: "#3B82F6" },
                    { label: "US", color: "#8B5CF6" },
                    { label: "Canada", color: "#EF4444" },
                    { label: "Gulf", color: "#F59E0B" },
                  ].map((d) => (
                    <div
                      key={d.label}
                      className="rounded-lg p-2.5 text-center"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <div className="text-sm font-bold text-white/20">--%</div>
                      <div className="text-[10px] text-white/30 mt-0.5">{d.label}</div>
                      <div className="mt-1.5 h-1 w-full rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <div className="h-1 w-0 rounded-full" style={{ backgroundColor: d.color }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Promise */}
                <div className="mt-5 space-y-2">
                  {[
                    "Your employability score across Nigeria",
                    "Readiness for UK, US, Canada, Gulf",
                    "Exactly what to do next to close the gaps",
                  ].map((line) => (
                    <div
                      key={line}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2"
                      style={{ background: "rgba(255,255,255,0.025)" }}
                    >
                      <span className="text-[10px]" style={{ color: "#D4AF37" }}>&#10003;</span>
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{line}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/oncadre/readiness"
                  className="mt-5 flex w-full items-center justify-center rounded-lg py-3 text-xs font-semibold text-[#06090f] transition hover:opacity-90"
                  style={{ background: "#D4AF37" }}
                >
                  Find out your score &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Social Proof ── */}
      <section className="border-b border-gray-200/60 bg-white py-7">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-6">
          {[
            ["4,200+", "Healthcare professionals"],
            ["73", "Nigerian hospitals"],
            ["16", "Cadres covered"],
          ].map(([n, l]) => (
            <div key={l} className="flex items-baseline gap-2">
              <span className="text-lg font-bold" style={{ color: "#0B3C5D" }}>{n}</span>
              <span className="text-xs text-gray-400">{l}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Salary Map ── */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="max-w-lg">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-amber-600">
                Salary Intelligence
              </p>
              <h2 className="mt-3 text-2xl font-bold text-gray-900 sm:text-3xl leading-snug">
                What does your cadre
                <br />actually earn?
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-gray-500">
                Real compensation data from verified professionals. Filtered
                by cadre, facility, city, and role. Share yours anonymously,
                see everyone else&apos;s.
              </p>
              <Link
                href="/oncadre/register"
                className="mt-6 inline-flex items-center text-sm font-semibold text-amber-600 transition hover:text-amber-700"
              >
                Unlock the salary map &rarr;
              </Link>
            </div>

            <div
              className="rounded-2xl p-6"
              style={{ background: "#fff", border: "1px solid #E8EBF0", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)" }}
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                <span className="text-sm font-semibold text-gray-900">Salary Map</span>
                <div className="flex gap-1.5">
                  <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">Lagos</span>
                  <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">Nursing</span>
                </div>
              </div>
              {[
                { role: "Staff Nurse (Public)", range: "N180k - N310k", med: "N220k", time: "62%" },
                { role: "Staff Nurse (Private)", range: "N200k - N500k", med: "N350k", time: "89%" },
                { role: "Nursing Officer", range: "N280k - N550k", med: "N400k", time: "71%" },
                { role: "CNO / Matron", range: "N450k - N900k", med: "N650k", time: "78%" },
              ].map((r) => (
                <div key={r.role} className="flex items-center justify-between rounded-lg bg-[#F8F9FB] px-3.5 py-2.5 mb-2 last:mb-0">
                  <div>
                    <p className="text-[13px] font-medium text-gray-800">{r.role}</p>
                    <p className="text-[11px] text-gray-400">{r.range}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{r.med}</p>
                    <p className="text-[10px] text-gray-400">
                      Paid on time:{" "}
                      <span className={parseFloat(r.time) >= 80 ? "text-emerald-500" : parseFloat(r.time) >= 65 ? "text-amber-500" : "text-red-500"}>
                        {r.time}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
              <div className="mt-3 rounded-lg bg-amber-50/80 px-3.5 py-2.5 text-center">
                <p className="text-[12px] text-amber-700/80">Share your salary to see the full map</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Hospital Reviews ── */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Mockup cards */}
            <div className="order-2 lg:order-1 space-y-3">
              {[
                { name: "Lagos University Teaching Hospital", type: "Teaching Hospital", rating: 3.2, reviews: 47, eq: 2.1, pay: 2.8, train: 4.1 },
                { name: "Reddington Hospital, VI", type: "Private Hospital", rating: 4.3, reviews: 23, eq: 4.5, pay: 4.7, train: 3.8 },
                { name: "FMC Abeokuta", type: "Federal Medical Centre", rating: 3.6, reviews: 31, eq: 2.9, pay: 3.2, train: 3.9 },
              ].map((h) => (
                <div
                  key={h.name}
                  className="rounded-xl p-4"
                  style={{ background: "#fff", border: "1px solid #E8EBF0", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[13px] font-semibold text-gray-900">{h.name}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{h.type}</p>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-md bg-[#F8F9FB] px-2 py-1">
                      <span className="text-xs text-amber-500">&#9733;</span>
                      <span className="text-xs font-bold text-gray-900">{h.rating}</span>
                      <span className="text-[10px] text-gray-400">({h.reviews})</span>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Badge label="Equipment" score={h.eq} />
                    <Badge label="Pay on time" score={h.pay} />
                    <Badge label="Training" score={h.train} />
                  </div>
                </div>
              ))}
            </div>

            {/* Copy */}
            <div className="order-1 lg:order-2 max-w-lg">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-blue-600">
                Hospital Reviews
              </p>
              <h2 className="mt-3 text-2xl font-bold text-gray-900 sm:text-3xl leading-snug">
                Know before you go.
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-gray-500">
                Does the equipment work? Do they pay on time? How bad is the
                call schedule? Anonymous reviews from verified professionals.
                Not patients. Staff.
              </p>
              <Link
                href="/oncadre/register"
                className="mt-6 inline-flex items-center text-sm font-semibold text-blue-600 transition hover:text-blue-700"
              >
                Read hospital reviews &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Credential Wallet ── */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="max-w-lg">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-violet-600">
                Credential Wallet
              </p>
              <h2 className="mt-3 text-2xl font-bold text-gray-900 sm:text-3xl leading-snug">
                Your career in one place.
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-gray-500">
                Practicing license, registration, COGS, CPD points, IELTS, PLAB,
                NMC CBT, fellowships. Tracked with reminders. Verified. Portable.
              </p>
              <Link
                href="/oncadre/register"
                className="mt-6 inline-flex items-center text-sm font-semibold text-violet-600 transition hover:text-violet-700"
              >
                Build your profile &rarr;
              </Link>
            </div>

            <div
              className="rounded-2xl p-6"
              style={{ background: "#fff", border: "1px solid #E8EBF0", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)" }}
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                <span className="text-sm font-semibold text-gray-900">My Credentials</span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-600">Verified</span>
              </div>
              {[
                { doc: "NMCN Full Registration", status: "verified", detail: "Active" },
                { doc: "Annual Practicing License", status: "verified", detail: "Expires Dec 2026" },
                { doc: "Certificate of Good Standing", status: "pending", detail: "Applied" },
                { doc: "IELTS Academic", status: "verified", detail: "Score: 7.0 (exp. Mar 2028)" },
                { doc: "BLS Certification", status: "verified", detail: "Expires Jun 2027" },
              ].map((c) => (
                <div key={c.doc} className="flex items-center justify-between rounded-lg bg-[#F8F9FB] px-3.5 py-2.5 mb-2 last:mb-0">
                  <div>
                    <p className="text-[13px] font-medium text-gray-800">{c.doc}</p>
                    <p className="text-[11px] text-gray-400">{c.detail}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    c.status === "verified" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                  }`}>
                    {c.status === "verified" ? "Verified" : "Pending"}
                  </span>
                </div>
              ))}
              <div className="mt-3 flex items-center justify-between rounded-lg bg-violet-50/60 px-3.5 py-2.5">
                <span className="text-[12px] font-medium text-violet-700">CPD Points: 18 / 30</span>
                <div className="h-1.5 w-24 rounded-full bg-violet-200/60">
                  <div className="h-1.5 w-[60%] rounded-full bg-violet-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stay or Go ── */}
      <section className="bg-white py-20 border-t border-gray-200/60">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Whether you stay or go, you need this.
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 text-left">
            <div
              className="rounded-xl p-6"
              style={{ background: "#fff", border: "1px solid #E8EBF0", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}
            >
              <p className="text-sm font-bold text-gray-900">Staying in Nigeria?</p>
              <ul className="mt-4 space-y-2.5 text-[13px] text-gray-600">
                <Li>Find locum shifts and earn more</Li>
                <Li>Know if you&apos;re being underpaid</Li>
                <Li>Research facilities before you accept</Li>
                <Li>Track CPD and license renewals</Li>
              </ul>
            </div>
            <div
              className="rounded-xl p-6"
              style={{ background: "#fff", border: "1px solid #E8EBF0", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}
            >
              <p className="text-sm font-bold text-gray-900">Planning your next move?</p>
              <ul className="mt-4 space-y-2.5 text-[13px] text-gray-600">
                <Li>See your UK, US, Canada, Gulf readiness</Li>
                <Li>Track IELTS, PLAB, NMC CBT, OET, USMLE</Li>
                <Li>Build a verified credential that travels</Li>
                <Li>Read reviews from Nigerians abroad</Li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative overflow-hidden" style={{ background: "#06090f" }}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 60% 80% at 50% 50%, rgba(11,60,93,0.35) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 35% 45% at 50% 20%, rgba(212,175,55,0.1) 0%, transparent 55%)",
          }}
        />
        <div className="relative mx-auto max-w-3xl px-6 py-20 text-center">
          <h2
            className="font-semibold leading-[1.1] tracking-tight text-white"
            style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)" }}
          >
            Stop guessing. Start knowing.
          </h2>
          <p
            className="mt-4 mx-auto max-w-md"
            style={{ fontSize: "clamp(0.88rem, 1.2vw, 1rem)", color: "rgba(255,255,255,0.45)" }}
          >
            Your career is too important for WhatsApp rumours and half-truths.
          </p>
          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/oncadre/readiness"
              className="px-7 py-3.5 rounded-lg font-semibold text-[#06090f] text-center transition hover:opacity-90"
              style={{ background: "#D4AF37" }}
            >
              Check Your Readiness Score
            </Link>
            <Link
              href="/oncadre/register"
              className="px-7 py-3.5 rounded-lg text-white text-center transition hover:bg-white/[0.08] text-sm font-medium"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              Create Free Profile
            </Link>
          </div>
          <p className="mt-4 text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>
            Free forever. No card required.
          </p>
        </div>
      </section>
    </main>
  );
}

/* ─── Sub-components ───────────────────────────────────────────────────── */

function Badge({ label, score }: { label: string; score: number }) {
  const color = score >= 4 ? "#10B981" : score >= 3 ? "#F59E0B" : "#EF4444";
  return (
    <div className="rounded-md bg-[#F8F9FB] px-2.5 py-1">
      <p className="text-[10px] text-gray-400">{label}</p>
      <p className="text-xs font-bold" style={{ color }}>{score.toFixed(1)}</p>
    </div>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span className="mt-0.5 shrink-0 text-xs" style={{ color: "#D4AF37" }}>&#10003;</span>
      {children}
    </li>
  );
}
