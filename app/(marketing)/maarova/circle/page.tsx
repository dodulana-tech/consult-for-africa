import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import CircleApplicationForm from "./CircleApplicationForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Maarova Founding Circle | 50 Free Assessments for Healthcare Leaders",
  description:
    "Consult For Africa is opening 50 free Maarova leadership assessments for healthcare operators across Africa. Apply for the Founding Circle.",
  keywords: [
    "Maarova Founding Circle",
    "free leadership assessment Africa",
    "healthcare leadership Nigeria",
    "hospital CEO assessment",
    "healthcare executive coaching Africa",
  ],
  alternates: { canonical: "https://consultforafrica.com/maarova/circle" },
  openGraph: {
    title: "Maarova Founding Circle",
    description:
      "50 free leadership assessments for healthcare operators across Africa.",
    type: "website",
    images: [
      { url: "/maarova-circle-og.png", width: 1200, height: 630, alt: "Maarova Founding Circle - 50 free leadership assessments" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Maarova Founding Circle",
    description: "50 free leadership assessments for healthcare leaders across Africa.",
    images: ["/maarova-circle-og.png"],
  },
};

const TOTAL_SLOTS = 50;
const APPLICATIONS_CLOSE = "8 May 2026";

export default async function CircleLandingPage() {
  const approvedCount = await prisma.maarovaCircleApplication.count({
    where: { status: { in: ["APPROVED", "COMPLETED"] } },
  });
  const slotsRemaining = Math.max(0, TOTAL_SLOTS - approvedCount);

  return (
    <main className="bg-white">
      {/* HERO */}
      <section className="relative overflow-hidden text-white" style={{ paddingTop: "5rem", minHeight: "92svh" }}>
        <div className="absolute inset-0" style={{ background: "#0F2744" }} />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 70% 80% at 85% 25%, rgba(20,130,200,0.32) 0%, transparent 60%)" }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 50% 60% at 70% 5%, rgba(212,175,55,0.18) 0%, transparent 55%)" }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 30% 40% at 10% 90%, rgba(20,130,200,0.18) 0%, transparent 60%)" }}
        />
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            backgroundSize: "200px",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-20 md:pt-20 md:pb-28">
          <div className="grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-16 items-center">
            {/* LEFT: Editorial */}
            <div>
              <div className="flex items-center gap-3">
                <span style={{ width: 24, height: 1, background: "#D4AF37" }} />
                <span className="text-[11px] font-semibold uppercase tracking-[0.28em]" style={{ color: "#D4AF37" }}>
                  Maarova Founding Circle
                </span>
              </div>

              <h1
                className="mt-7 font-bold tracking-tight"
                style={{ fontSize: "clamp(3rem, 6.5vw, 5.5rem)", lineHeight: 0.92 }}
              >
                <span className="block" style={{ color: "#D4AF37", fontSize: "1.45em", lineHeight: 0.78, letterSpacing: "-0.04em" }}>
                  50
                </span>
                <span className="block mt-3 text-white" style={{ fontWeight: 500, fontSize: "0.62em", lineHeight: 1.05 }}>
                  free leadership
                </span>
                <span className="block text-white" style={{ fontWeight: 500, fontSize: "0.62em", lineHeight: 1.05 }}>
                  assessments.
                </span>
              </h1>

              <p className="mt-8 max-w-md text-lg text-white/75 leading-relaxed">
                Brilliant operators fail in healthcare management roles. Doctors included. Maarova shows you why before it costs you.
              </p>
              <p className="mt-3 text-sm text-white/55">
                Each assessment normally <span className="line-through">N460,000 to N690,000</span>. Free for 50 healthcare leaders this round.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-5">
                <a
                  href="#apply"
                  className="inline-flex items-center gap-2 rounded-xl px-7 py-4 text-sm font-bold transition hover:-translate-y-0.5"
                  style={{
                    background: "#D4AF37",
                    color: "#0F2744",
                    boxShadow: "0 14px 36px rgba(212, 175, 55, 0.28)",
                  }}
                >
                  Apply for a slot
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </a>
                <div className="text-xs leading-relaxed text-white/55">
                  <div>
                    <span style={{ color: slotsRemaining > 0 ? "#10B981" : "#EF4444" }}>●</span>{" "}
                    <strong className="text-white font-semibold">{slotsRemaining}</strong> of {TOTAL_SLOTS} slots remaining
                  </div>
                  <div>Applications close <strong className="text-white font-semibold">{APPLICATIONS_CLOSE}</strong></div>
                </div>
              </div>
            </div>

            {/* RIGHT: Sample report preview */}
            <div className="hidden lg:block">
              <div className="relative">
                <div
                  className="absolute -inset-8 rounded-[40px] blur-3xl opacity-40 pointer-events-none"
                  style={{ background: "radial-gradient(circle at 30% 30%, rgba(212,175,55,0.35), transparent 70%)" }}
                />
                <div
                  className="relative rounded-3xl p-8"
                  style={{
                    background: "linear-gradient(160deg, #14304F 0%, #0B2238 100%)",
                    border: "1px solid rgba(212,175,55,0.18)",
                    boxShadow: "0 40px 90px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
                  }}
                >
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <p className="text-[9px] tracking-[0.22em] uppercase font-bold" style={{ color: "#D4AF37" }}>
                        Sample Profile
                      </p>
                      <h3 className="text-lg font-bold mt-1.5 text-white">Maarova Leadership Report</h3>
                    </div>
                    <div className="text-right">
                      <div className="text-5xl font-bold leading-none" style={{ color: "#D4AF37" }}>76</div>
                      <div className="text-[9px] uppercase tracking-[0.18em] text-white/65 mt-1 font-semibold">overall</div>
                    </div>
                  </div>

                  <div className="mb-6 pb-6 border-b" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
                    <p className="text-[10px] tracking-[0.18em] uppercase mb-2 font-semibold" style={{ color: "#D4AF37" }}>
                      Leadership archetype
                    </p>
                    <p className="text-lg font-bold text-white">The Strategic Caregiver</p>
                  </div>

                  <div className="space-y-3.5">
                    {[
                      { label: "Behavioural style", score: 82 },
                      { label: "Values & drivers", score: 71 },
                      { label: "Emotional intelligence", score: 78 },
                      { label: "Clinical leadership transition", score: 64 },
                      { label: "Team dynamics", score: 80 },
                      { label: "Cultural fit", score: 81 },
                    ].map((d) => (
                      <div key={d.label} className="flex items-center gap-3">
                        <div className="text-xs text-white/85 w-[170px] truncate font-medium">{d.label}</div>
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.12)" }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${d.score}%`,
                              background: "linear-gradient(to right, #D4AF37, #f5d97a)",
                              boxShadow: "0 0 14px rgba(212,175,55,0.55)",
                            }}
                          />
                        </div>
                        <div className="text-xs font-mono w-7 text-right text-white/80 font-semibold">{d.score}</div>
                      </div>
                    ))}
                  </div>

                  <div
                    className="mt-7 pt-5 text-[9px] uppercase tracking-[0.22em] text-center font-semibold"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
                  >
                    Sample · Real reports are personalised
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOUNDER NOTE */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] mb-4" style={{ color: "#D4AF37" }}>
            Why we are doing this
          </p>
          <blockquote className="border-l-2 pl-6 text-lg leading-relaxed text-gray-800" style={{ borderColor: "#D4AF37" }}>
            <p className="mb-4">
              "As a hospital CEO, I struggled with leadership development. For myself, and for the leaders around me. The assessments available were built for Goldman Sachs, not for the realities of running a Nigerian hospital. Structured executive development for healthcare did not exist.
            </p>
            <p className="mb-4">
              So we built Maarova. Six dimensions, calibrated to African healthcare contexts, designed by clinicians and operators who have lived the gap.
            </p>
            <p>
              For 50 healthcare leaders this round, it is on us."
            </p>
            <footer className="mt-6 text-sm not-italic" style={{ color: "#0F2744" }}>
              <strong>Debo Odulana</strong>
              <span className="text-gray-500"> · Founding Partner, Consult For Africa</span>
            </footer>
          </blockquote>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className="py-16 px-6" style={{ background: "#F8F9FB" }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] mb-3" style={{ color: "#D4AF37" }}>
            What you get
          </p>
          <h2 className="text-3xl font-bold mb-3" style={{ color: "#0F2744" }}>
            The full Maarova experience.
          </h2>
          <p className="text-sm text-gray-500 mb-10">
            Normally priced at <span className="line-through">N460,000 to N690,000</span>. Free for 50 Founding Circle members.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                title: "60-minute Maarova assessment",
                body: "Online, on your schedule. Six leadership dimensions calibrated for African healthcare contexts.",
              },
              {
                title: "Your full leadership report",
                body: "Behavioural style, values, emotional intelligence, clinical leadership transition, team dynamics, cultural fit. Delivered to your inbox within minutes of completion.",
              },
              {
                title: "10% off Maarova executive coaching",
                body: "When coaching bookings open in June 2026, your Founding Circle discount applies automatically. We are still concluding coach contracts so coaching is not yet bookable.",
              },
              {
                title: "No credit card. No catch.",
                body: "We are building the data set, the testimonials, and the network. Your participation is the value exchange.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border bg-white p-6" style={{ borderColor: "#E8EBF0" }}>
                <h3 className="text-base font-bold mb-2" style={{ color: "#0F2744" }}>{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHO QUALIFIES */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] mb-3" style={{ color: "#D4AF37" }}>
            Who qualifies
          </p>
          <h2 className="text-3xl font-bold mb-6" style={{ color: "#0F2744" }}>
            Healthcare operators across Africa.
          </h2>
          <p className="text-base text-gray-700 leading-relaxed mb-6">
            We will review every application personally. Each application is evaluated by Debo within 24 hours.
          </p>
          <ul className="space-y-3 text-base text-gray-700">
            {[
              "Hospital CEOs, Medical Directors, COOs, and Heads of Department",
              "Clinical leads and consultants stepping into leadership roles",
              "Public health programme leaders and ministry advisors",
              "Healthtech founders and senior operators",
              "Healthcare investors, payors, and consulting executives",
              "Diaspora healthcare leaders working substantively on African healthcare",
            ].map((line) => (
              <li key={line} className="flex items-start gap-3">
                <span className="mt-2 flex-shrink-0 inline-block" style={{ width: 6, height: 6, borderRadius: 999, background: "#D4AF37" }} />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* WHAT HAPPENS NEXT */}
      <section className="py-16 px-6" style={{ background: "#F8F9FB" }}>
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] mb-3" style={{ color: "#D4AF37" }}>
            What happens next
          </p>
          <h2 className="text-3xl font-bold mb-10" style={{ color: "#0F2744" }}>
            Four steps from application to report.
          </h2>
          <ol className="space-y-6">
            {[
              { step: "01", title: "Apply", body: "Submit your details and CV. Takes about 3 minutes." },
              { step: "02", title: "Review", body: "We review every application within 24 hours. You will hear back either way." },
              { step: "03", title: "Assess", body: "Approved leaders receive a private link to start the 60-minute Maarova assessment." },
              { step: "04", title: "Report", body: "Your full leadership report arrives by email within five minutes of completion." },
            ].map((item) => (
              <li key={item.step} className="flex items-start gap-5">
                <span className="font-bold text-2xl flex-shrink-0" style={{ color: "#D4AF37" }}>{item.step}</span>
                <div>
                  <h3 className="text-lg font-bold mb-1" style={{ color: "#0F2744" }}>{item.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* APPLY */}
      <section id="apply" className="py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] mb-3" style={{ color: "#D4AF37" }}>
            Apply
          </p>
          <h2 className="text-3xl font-bold mb-3" style={{ color: "#0F2744" }}>
            {slotsRemaining > 0 ? `${slotsRemaining} of ${TOTAL_SLOTS} slots remaining` : "Slots are full"}
          </h2>
          <p className="text-base text-gray-600 mb-8">
            {slotsRemaining > 0
              ? "We will respond within 24 hours. Submit one application per person."
              : "All 50 slots have been allocated. Submit your details to be added to the waitlist for the next round."}
          </p>

          <CircleApplicationForm slotsRemaining={slotsRemaining} />
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6" style={{ background: "#F8F9FB" }}>
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] mb-3" style={{ color: "#D4AF37" }}>
            Common questions
          </p>
          <h2 className="text-3xl font-bold mb-10" style={{ color: "#0F2744" }}>FAQ</h2>
          <div className="space-y-6">
            {[
              {
                q: "Why is this free?",
                a: "Each Maarova assessment normally costs between N460,000 and N690,000. We are giving 50 free slots because we are building the founding network around Maarova. Fifty healthcare operators give us deep validation. You get the full report at no cost.",
              },
              {
                q: "Why healthcare only?",
                a: "Maarova is calibrated specifically for African healthcare contexts. Opening to other industries would dilute the data and the experience. We protect that intentionally.",
              },
              {
                q: "When does coaching open?",
                a: "Maarova executive coaching opens in June 2026. We are still concluding coach contracts. Founding Circle members get an automatic 10% discount when bookings open.",
              },
              {
                q: "What if my application is declined?",
                a: "We will tell you why and invite you to apply for the next round if your situation changes. We are calibrating this round for healthcare operators with current leadership scope.",
              },
              {
                q: "Can my team apply too?",
                a: "Each person applies individually. If you would like to bring Maarova to your hospital or organisation, get in touch separately about enterprise programmes.",
              },
              {
                q: "Who sees my data?",
                a: "Your application is reviewed by Debo personally. Your assessment results are private to you unless you choose to share. We do not publish individual reports.",
              },
            ].map((item) => (
              <div key={item.q}>
                <h3 className="text-base font-bold mb-2" style={{ color: "#0F2744" }}>{item.q}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
