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
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "CadreHealth",
            url: "https://consultforafrica.com/oncadre",
            description: "The career platform for Nigerian healthcare professionals.",
            applicationCategory: "HealthApplication",
            operatingSystem: "Web",
            offers: { "@type": "Offer", price: "0", priceCurrency: "NGN" },
            creator: { "@type": "Organization", name: "Consult For Africa", url: "https://consultforafrica.com" },
          }),
        }}
      />

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
                The Career Platform for Nigerian Healthcare Professionals
              </p>
              <h1 className="mt-7 font-semibold leading-[1.08] tracking-tight text-white" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
                Your career. Your call.
                <br />
                <span style={{ color: "#D4AF37" }}>How ready are you?</span>
              </h1>
              <div className="mt-6 w-12 h-[2px]" style={{ background: "#D4AF37" }} />
              <p className="mt-5 max-w-lg leading-relaxed" style={{ fontSize: "clamp(0.92rem, 1.3vw, 1.05rem)", color: "rgba(255,255,255,0.55)" }}>
                Real salary data. Honest hospital reviews. Verified credentials.
                <br />
                For doctors, nurses, pharmacists, and every cadre in between.
              </p>
              <div className="mt-9 flex flex-col sm:flex-row gap-3">
                <Link href="/oncadre/readiness" className="px-7 py-3.5 rounded-lg font-semibold text-[#06090f] text-center transition hover:opacity-90 hover:scale-[1.01]" style={{ background: "#D4AF37" }}>
                  Check Your Readiness Score
                </Link>
                <Link href="/oncadre/register" className="px-7 py-3.5 rounded-lg text-white text-center transition hover:bg-white/[0.08] text-sm font-medium" style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  Join Free
                </Link>
              </div>
              <div className="mt-12 flex flex-wrap gap-2">
                {cadres.slice(0, 6).map((c) => (
                  <div key={c} className="px-3 py-1.5 rounded-md text-[11px] font-medium" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>{c}</div>
                ))}
                <div className="px-3 py-1.5 rounded-md text-[11px] font-medium" style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.15)", color: "rgba(212,175,55,0.6)" }}>+10 more cadres</div>
              </div>
            </div>

            {/* Readiness Score Mockup */}
            <div className="relative hidden lg:block">
              <div className="absolute -inset-8 rounded-3xl pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(212,175,55,0.08) 0%, transparent 70%)" }} />
              <div className="relative rounded-2xl p-7" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-white/30">Sample Result</span>
                    <p className="text-sm font-semibold text-white/80 mt-0.5">Pharmacist, 5 years</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold" style={{ background: "rgba(212,175,55,0.15)", color: "#D4AF37" }}>CadreHealth</span>
                </div>
                <div className="flex items-center gap-5">
                  <div className="relative h-[88px] w-[88px] shrink-0">
                    <svg className="h-[88px] w-[88px] -rotate-90" viewBox="0 0 88 88">
                      <circle cx="44" cy="44" r="38" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                      <circle cx="44" cy="44" r="38" fill="none" strokeWidth="5" strokeLinecap="round" stroke="#10B981" strokeDasharray={`${2 * Math.PI * 38}`} strokeDashoffset={`${2 * Math.PI * 38 * (1 - 0.68)}`} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold text-white">68%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-white/80">Domestic Employability</p>
                    <p className="text-[11px] text-emerald-400 mt-0.5">Above average for cadre</p>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-4 gap-2.5">
                  {[
                    { label: "UK", score: 43, color: "#3B82F6" },
                    { label: "US", score: 27, color: "#8B5CF6" },
                    { label: "Canada", score: 51, color: "#EF4444" },
                    { label: "Gulf", score: 72, color: "#F59E0B" },
                  ].map((d) => (
                    <div key={d.label} className="rounded-lg p-2.5 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="text-sm font-bold text-white">{d.score}%</div>
                      <div className="text-[10px] text-white/40 mt-0.5">{d.label}</div>
                      <div className="mt-1.5 h-1 w-full rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                        <div className="h-1 rounded-full" style={{ width: `${d.score}%`, backgroundColor: d.color }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-white/25">Top gaps to close</p>
                  {[
                    { gap: "Take IELTS (target 7.0+)", impact: "+18% UK, +12% Canada" },
                    { gap: "Get Certificate of Good Standing", impact: "+15% Gulf, +10% UK" },
                    { gap: "6 more CPD points needed", impact: "+5% domestic" },
                  ].map((g) => (
                    <div key={g.gap} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: "rgba(255,255,255,0.025)" }}>
                      <span className="text-[11px] text-white/50">{g.gap}</span>
                      <span className="shrink-0 text-[10px] font-medium text-emerald-400/80">{g.impact}</span>
                    </div>
                  ))}
                </div>
                <Link href="/oncadre/readiness" className="mt-5 flex w-full items-center justify-center rounded-lg py-3 text-xs font-semibold text-[#06090f] transition hover:opacity-90" style={{ background: "#D4AF37" }}>
                  Get your score &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ SOCIAL PROOF ═══════════════ */}
      <section className="border-b border-gray-200/60 bg-white py-7">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-6">
          {[["4,200+", "Healthcare professionals"], ["73", "Nigerian hospitals"], ["16", "Cadres covered"]].map(([n, l]) => (
            <div key={l} className="flex items-baseline gap-2">
              <span className="text-lg font-bold" style={{ color: "#0B3C5D" }}>{n}</span>
              <span className="text-xs text-gray-400">{l}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════ SALARY MAP ═══════════════ */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="max-w-lg">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-amber-600">Salary Intelligence</p>
              <h2 className="mt-3 text-2xl font-bold text-gray-900 sm:text-3xl leading-snug">
                They won&apos;t tell you<br />what they earn. We will.
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-gray-500">
                What does a staff nurse at Reddington take home? How much
                does FMC Abeokuta pay registrars? Verified data. Every cadre.
                Every city. You share yours anonymously, you see everyone else&apos;s.
              </p>
              <Link href="/oncadre/register" className="mt-6 inline-flex items-center text-sm font-semibold text-amber-600 transition hover:text-amber-700">
                Unlock the salary map &rarr;
              </Link>
            </div>
            <div className="rounded-2xl p-6" style={{ background: "#fff", border: "1px solid #E8EBF0", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)" }}>
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                <span className="text-sm font-semibold text-gray-900">Salary Map</span>
                <div className="flex gap-1.5">
                  <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">Lagos</span>
                  <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">Nursing</span>
                </div>
              </div>
              {[
                { role: "Staff Nurse (Public)", range: "N180k - N310k", med: "N220k", time: 62 },
                { role: "Staff Nurse (Private)", range: "N200k - N500k", med: "N350k", time: 89 },
                { role: "Nursing Officer", range: "N280k - N550k", med: "N400k", time: 71 },
                { role: "CNO / Matron", range: "N450k - N900k", med: "N650k", time: 78 },
              ].map((r) => (
                <div key={r.role} className="flex items-center justify-between rounded-lg bg-[#F8F9FB] px-3.5 py-2.5 mb-2 last:mb-0">
                  <div>
                    <p className="text-[13px] font-medium text-gray-800">{r.role}</p>
                    <p className="text-[11px] text-gray-400">{r.range}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{r.med}</p>
                    <p className="text-[10px] text-gray-400">
                      Paid on time: <span className={r.time >= 80 ? "text-emerald-500 font-medium" : r.time >= 65 ? "text-amber-500 font-medium" : "text-red-500 font-medium"}>{r.time}%</span>
                    </p>
                  </div>
                </div>
              ))}
              <div className="mt-3 rounded-lg bg-amber-50/80 px-3.5 py-2.5 text-center">
                <p className="text-[12px] text-amber-700/80">Share your salary to unlock the full map</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ HOSPITAL REVIEWS ═══════════════ */}
      <section className="relative overflow-hidden text-white py-20" style={{ background: "#0B3C5D" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 70% at 20% 50%, rgba(14,77,110,0.5) 0%, transparent 55%)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.025, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize: "180px" }} />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="order-2 lg:order-1 space-y-3">
              {[
                { name: "Lagos University Teaching Hospital", type: "Teaching Hospital", rating: 3.2, reviews: 47, eq: 2.1, pay: 2.8, train: 4.1 },
                { name: "Reddington Hospital, VI", type: "Private Hospital", rating: 4.3, reviews: 23, eq: 4.5, pay: 4.7, train: 3.8 },
                { name: "FMC Abeokuta", type: "Federal Medical Centre", rating: 3.6, reviews: 31, eq: 2.9, pay: 3.2, train: 3.9 },
              ].map((h) => (
                <div key={h.name} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[13px] font-semibold text-white/90">{h.name}</p>
                      <p className="text-[10px] text-white/35 mt-0.5">{h.type}</p>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-md px-2 py-1" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <span className="text-xs text-amber-400">&#9733;</span>
                      <span className="text-xs font-bold text-white">{h.rating}</span>
                      <span className="text-[10px] text-white/40">({h.reviews})</span>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <DarkBadge label="Equipment" score={h.eq} />
                    <DarkBadge label="Pay on time" score={h.pay} />
                    <DarkBadge label="Training" score={h.train} />
                  </div>
                </div>
              ))}
            </div>
            <div className="order-1 lg:order-2 max-w-lg">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em]" style={{ color: "#D4AF37" }}>Hospital Reviews</p>
              <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl leading-snug">
                Know before you go.
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-white/50">
                Does the CT scanner work? Do they pay on time? How brutal is the
                call schedule? Anonymous reviews from verified healthcare staff.
                Not patients. The people who actually work there.
              </p>
              <Link href="/oncadre/hospitals" className="mt-6 inline-flex items-center text-sm font-semibold transition" style={{ color: "#D4AF37" }}>
                Browse hospital reviews &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ CREDENTIAL WALLET ═══════════════ */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="max-w-lg">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-violet-600">Credential Wallet</p>
              <h2 className="mt-3 text-2xl font-bold text-gray-900 sm:text-3xl leading-snug">
                Never scramble for<br />documents again.
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-gray-500">
                Practicing license expiring? CPD points short? COGS not applied
                for? Your credentials tracked in one place with reminders.
                Verified. Portable. Ready when you are.
              </p>
              <Link href="/oncadre/register" className="mt-6 inline-flex items-center text-sm font-semibold text-violet-600 transition hover:text-violet-700">
                Build your profile &rarr;
              </Link>
            </div>
            <div className="rounded-2xl p-6" style={{ background: "#fff", border: "1px solid #E8EBF0", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)" }}>
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
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${c.status === "verified" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
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

      {/* ═══════════════ STAY OR GO ═══════════════ */}
      <section className="bg-white py-20 border-t border-gray-200/60">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Whether you stay or go, you need this.
          </h2>
          <p className="mt-3 text-sm text-gray-400">
            CadreHealth works for your career wherever it takes you.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 text-left">
            <div className="rounded-xl p-6" style={{ background: "#fff", border: "1px solid #E8EBF0", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
              <p className="text-sm font-bold text-gray-900">Building your career here?</p>
              <ul className="mt-4 space-y-2.5 text-[13px] text-gray-600">
                <Li>Find locum shifts that pay what you deserve</Li>
                <Li>See if your salary matches the market</Li>
                <Li>Research any facility before you accept</Li>
                <Li>Never miss a license renewal or CPD deadline</Li>
              </ul>
            </div>
            <div className="rounded-xl p-6" style={{ background: "#fff", border: "1px solid #E8EBF0", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
              <p className="text-sm font-bold text-gray-900">Planning your next move?</p>
              <ul className="mt-4 space-y-2.5 text-[13px] text-gray-600">
                <Li>Know your UK, US, Canada, Gulf readiness score</Li>
                <Li>Track IELTS, PLAB, NMC CBT, OET, USMLE progress</Li>
                <Li>Build a verified credential wallet that travels</Li>
                <Li>Read reviews from Nigerians who went before you</Li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ FINAL CTA ═══════════════ */}
      <section className="relative overflow-hidden" style={{ background: "#06090f" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 80% at 50% 50%, rgba(11,60,93,0.35) 0%, transparent 60%)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 35% 45% at 50% 20%, rgba(212,175,55,0.1) 0%, transparent 55%)" }} />
        <div className="relative mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="font-semibold leading-[1.1] tracking-tight text-white" style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)" }}>
            Stop guessing. Start knowing.
          </h2>
          <p className="mt-4 mx-auto max-w-md" style={{ fontSize: "clamp(0.88rem, 1.2vw, 1rem)", color: "rgba(255,255,255,0.45)" }}>
            4,200+ professionals. 73 hospitals. Real data.
            <br />
            Your career is too important for WhatsApp rumours.
          </p>
          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/oncadre/readiness" className="px-7 py-3.5 rounded-lg font-semibold text-[#06090f] text-center transition hover:opacity-90" style={{ background: "#D4AF37" }}>
              Check Your Readiness Score
            </Link>
            <Link href="/oncadre/register" className="px-7 py-3.5 rounded-lg text-white text-center transition hover:bg-white/[0.08] text-sm font-medium" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
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

function DarkBadge({ label, score }: { label: string; score: number }) {
  const color = score >= 4 ? "#10B981" : score >= 3 ? "#F59E0B" : "#EF4444";
  return (
    <div className="rounded-md px-2.5 py-1" style={{ background: "rgba(255,255,255,0.04)" }}>
      <p className="text-[10px] text-white/35">{label}</p>
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
