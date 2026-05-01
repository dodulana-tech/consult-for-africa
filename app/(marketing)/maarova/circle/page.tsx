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
      <section className="relative overflow-hidden text-white" style={{ paddingTop: "5rem", minHeight: "70svh" }}>
        <div className="absolute inset-0" style={{ background: "#0F2744" }} />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 70% 80% at 80% 30%, rgba(20,130,200,0.25) 0%, transparent 60%)" }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 40% 50% at 70% 0%, rgba(212,175,55,0.12) 0%, transparent 50%)" }}
        />

        <div className="relative max-w-5xl mx-auto px-6 py-20 md:py-24">
          <div className="inline-flex items-center gap-2 mb-6 rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.18em] uppercase"
               style={{ background: "rgba(212,175,55,0.15)", color: "#D4AF37", border: "1px solid rgba(212,175,55,0.4)" }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: "#D4AF37" }} />
            Maarova Founding Circle
          </div>

          <h1 className="font-semibold leading-[1.05] tracking-tight" style={{ fontSize: "clamp(2.2rem, 5.5vw, 4rem)" }}>
            Consult For Africa is opening{" "}
            <span style={{ color: "#D4AF37" }}>50 free slots</span>
            {" "}on Maarova for healthcare leaders across Africa.
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-white/75 leading-relaxed">
            Brilliant operators fail in healthcare management roles. Doctors included. Maarova shows you why before it costs you.
          </p>
          <p className="mt-4 text-sm text-white/60">
            Each assessment is normally <span className="line-through">N460,000 to N690,000</span>. Founding Circle members pay nothing.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a
              href="#apply"
              className="rounded-xl px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #D4AF37, #b8932d)", color: "#0F2744" }}
            >
              Apply for a slot
            </a>
            <div className="flex items-center gap-3 text-sm text-white/75">
              <span className="flex items-center gap-2">
                <span style={{ width: 8, height: 8, borderRadius: 999, background: slotsRemaining > 0 ? "#10B981" : "#EF4444" }} />
                <strong className="text-white">{slotsRemaining}</strong> of {TOTAL_SLOTS} slots remaining
              </span>
              <span className="text-white/30">·</span>
              <span>Applications close <strong className="text-white">{APPLICATIONS_CLOSE}</strong></span>
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
