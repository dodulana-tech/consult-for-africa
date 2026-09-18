import type { Metadata } from "next";
import { CLEARVIEW_SURVEYS } from "@/lib/clearview-survey";

// One private link for Dr Kunle Ajayi and the Clearview team: what we think is
// going on, what we would need to measure to know, and the five live surveys.
// Deliberately not indexed.

export const metadata: Metadata = {
  title: "Clearview and Consult for Africa",
  description: "Destination fertility: what we think, what we need to know, and the five surveys.",
  robots: { index: false, follow: false },
};

const NAVY = "#0B3C5D";
const DEEP = "#081521";
const GOLD = "#D4AF37";
const TEAL = "#1F7A8C";
const LINE = "#E2E8F0";
const MUTED = "#64748b";

const card = {
  background: "#fff",
  border: `1px solid ${LINE}`,
  borderRadius: 14,
  padding: 20,
} as const;

function SectionHeading({ eyebrow, title, lead }: { eyebrow: string; title: string; lead?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ color: GOLD, fontWeight: 700, fontSize: 11.5, letterSpacing: ".14em", textTransform: "uppercase" }}>
        {eyebrow}
      </div>
      <h2 style={{ color: NAVY, fontSize: 24, lineHeight: 1.2, margin: "6px 0 0" }}>{title}</h2>
      {lead && <p style={{ color: MUTED, fontSize: 15.5, lineHeight: 1.65, margin: "8px 0 0", maxWidth: 680 }}>{lead}</p>}
    </div>
  );
}

// Annual NGN millions from N extra cycles a month, from scripts/clearview_model.py.
const MARKETS = [
  { name: "Mainland Lagos", stops: "Traffic, and fourteen monitoring visits", at4: "228" },
  { name: "The rest of Nigeria", stops: "Relocating to Lagos for three weeks", at4: "262" },
  { name: "West Africa", stops: "Language, payment, and no reason to believe us yet", at4: "285" },
  { name: "The diaspora", stops: "Trust, entirely", at4: "365" },
];

const MEASURE = [
  { n: 1, what: "Live birth rate, by age band, from your own records", why: "A patient who is deciding whether to board a plane buys your outcomes and nothing else" },
  { n: 2, what: "How many people contact you in a month, and what happens to each one", why: "It separates a demand problem from a conversion problem, and those have opposite answers" },
  { n: 3, what: "Where your patients already travel from", why: "Whether inbound is a new idea or a description of what is quietly already happening" },
  { n: 4, what: "What the laboratory could carry, and how many people can run a retrieval day", why: "It caps every growth option, and it is what an investor examines first" },
  { n: 5, what: "Where your IVF pregnancies actually deliver", why: "The largest single number in the strategy note" },
  { n: 6, what: "Who has embryos stored, and who has been called", why: "The fastest revenue available, and the consent exposure sitting behind it" },
];

export default function ClearviewProjectPage() {
  return (
    <main style={{ background: "#eef2f6", minHeight: "100vh", color: "#1F2937" }}>
      <header style={{ background: NAVY, borderBottom: `3px solid ${GOLD}` }}>
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "30px 18px 32px" }}>
          <div style={{ color: GOLD, fontWeight: 700, fontSize: 11.5, letterSpacing: ".14em", textTransform: "uppercase" }}>
            Clearview and Consult for Africa
          </div>
          <h1 style={{ color: "#fff", fontSize: 30, lineHeight: 1.18, margin: "10px 0 0", fontWeight: 800 }}>
            Destination fertility
          </h1>
          <p style={{ color: "#C9D6E0", fontSize: 16, margin: "10px 0 0", lineHeight: 1.6, maxWidth: 640 }}>
            Everything for this conversation lives on this page. What we think is going on, what we
            would need to measure to know, and five short surveys that answer most of it.
          </p>
          <p style={{ color: "#8FA8BC", fontSize: 13.5, margin: "16px 0 0" }}>
            Nothing here commits you to anything.
          </p>
        </div>
      </header>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 18px 72px" }}>
        {/* A word from Debo, so the page has a person behind it */}
        <section style={{ ...card, background: "#FBF6E6", borderLeft: `4px solid ${GOLD}`, marginTop: 22 }}>
          <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.7 }}>
            You told me you believe in systems and do not think you have one. I would put it
            differently. You have a system and it has worked for nine years, which is longer than
            most fertility units in this country manage. The difficulty is that the system is you.
            Everything on this page exists to work out whether that is fixable, and where the money
            is actually going, before anybody spends a naira on advertising.
          </p>
          <p style={{ margin: "12px 0 0", fontSize: 15.5, lineHeight: 1.7 }}>
            Where a record does not exist, the right answer is to say it does not exist. The absence
            is itself a finding, and usually a more useful one than a tidy file would have been.
          </p>
          <p style={{ margin: "12px 0 0", fontWeight: 700, color: NAVY, fontSize: 14.5 }}>
            Dr Debo Odulana, Founding Partner, Consult for Africa
          </p>
        </section>

        {/* 1. The idea */}
        <section style={{ marginTop: 40 }}>
          <SectionHeading
            eyebrow="The idea"
            title="Lekki is the right destination and the wrong catchment"
            lead="You are competing for the most contested six kilometres in West Africa while holding the only two things a travelling fertility patient actually needs: a laboratory, and a hospital to catch her if it goes wrong."
          />
          <div style={{ ...card, padding: 0, overflow: "hidden" }}>
            <div style={{ display: "flex", gap: 14, padding: "11px 18px", background: NAVY }}>
              <span style={{ flex: 1, color: "#fff", fontWeight: 700, fontSize: 12.5 }}>Where they would come from</span>
              <span style={{ flex: 1.2, color: "#C9D6E0", fontWeight: 700, fontSize: 12.5 }}>What stops them today</span>
              <span style={{ color: GOLD, fontWeight: 700, fontSize: 12.5, whiteSpace: "nowrap" }}>4 a month</span>
            </div>
            {MARKETS.map((m, i) => (
              <div
                key={m.name}
                style={{
                  display: "flex", gap: 14, padding: "13px 18px", alignItems: "baseline",
                  borderTop: `1px solid #F1F5F9`, background: i % 2 ? "#FBFDFE" : "#fff",
                }}
              >
                <span style={{ flex: 1, fontSize: 14.5, color: NAVY, fontWeight: 600 }}>{m.name}</span>
                <span style={{ flex: 1.2, fontSize: 13.5, color: MUTED, lineHeight: 1.5 }}>{m.stops}</span>
                <span style={{ color: TEAL, fontWeight: 800, fontSize: 14, whiteSpace: "nowrap" }}>
                  &#8358;{m.at4}m
                </span>
              </div>
            ))}
          </div>
          <p style={{ color: MUTED, fontSize: 13, lineHeight: 1.6, margin: "10px 2px 0" }}>
            The right hand column is the annual revenue from four additional cycles a month from that
            source, on a laboratory you have already built and already paid for. Indicative, and
            calibrated rather than measured.
          </p>
        </section>

        {/* 2. What we would measure */}
        <section style={{ marginTop: 40 }}>
          <SectionHeading
            eyebrow="Before anything else"
            title="The six things worth counting"
            lead="None of these can be answered from outside your building, and every one of them changes the answer. Most of it is two to three weeks of work."
          />
          <div style={{ ...card, padding: 0, overflow: "hidden" }}>
            {MEASURE.map((p, i) => (
              <div
                key={p.n}
                style={{
                  display: "flex", gap: 14, padding: "14px 18px",
                  borderTop: i === 0 ? "none" : `1px solid #F1F5F9`,
                  background: i % 2 ? "#FBFDFE" : "#fff",
                }}
              >
                <span style={{ color: GOLD, fontWeight: 800, fontSize: 15, minWidth: 18 }}>{p.n}</span>
                <span style={{ flex: 1 }}>
                  <span style={{ display: "block", fontSize: 15, color: "#1F2937", lineHeight: 1.5 }}>{p.what}</span>
                  <span style={{ display: "block", fontSize: 13, color: MUTED, marginTop: 3, lineHeight: 1.5 }}>{p.why}</span>
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 3. The surveys */}
        <section style={{ marginTop: 40 }}>
          <SectionHeading
            eyebrow="Five short surveys"
            title="Whichever one applies to you"
            lead="The patient, enquirer and staff surveys are anonymous, and those answers come to Consult for Africa rather than to anyone at Clearview. Please share the links freely with the people they are for."
          />
          <div style={{ display: "grid", gap: 12 }}>
            {CLEARVIEW_SURVEYS.map((s) => (
              <a
                key={s.formPath}
                href={s.formPath}
                style={{ ...card, display: "block", textDecoration: "none", borderLeft: `4px solid ${TEAL}` }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
                  <div>
                    <div style={{ fontSize: 11.5, color: TEAL, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em" }}>
                      {s.who}
                    </div>
                    <div style={{ color: NAVY, fontWeight: 800, fontSize: 18, marginTop: 3 }}>{s.title}</div>
                  </div>
                  <span
                    style={{
                      background: s.anonymous ? "#F1F5F9" : "#FBF6E6",
                      color: s.anonymous ? NAVY : "#8a6d1f",
                      borderRadius: 20, padding: "4px 11px",
                      fontSize: 11.5, fontWeight: 700, whiteSpace: "nowrap",
                    }}
                  >
                    {s.tag}
                  </span>
                </div>
                <p style={{ color: "#334155", fontSize: 14.5, lineHeight: 1.6, margin: "9px 0 0" }}>{s.blurb}</p>
                <div style={{ color: GOLD, fontWeight: 700, fontSize: 13.5, marginTop: 10 }}>
                  Open the survey &rarr; <span style={{ color: MUTED, fontWeight: 400 }}>{s.minutes}</span>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* 4. The one that matters most */}
        <section style={{ marginTop: 40 }}>
          <SectionHeading eyebrow="If you only push one" title="Push the second one" />
          <div style={card}>
            <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.7 }}>
              The survey for people who got in touch and did not go ahead is the one almost nobody in
              this sector ever runs, and it is the single most useful instrument on this page. In a
              fertility business the money is not lost between the advertisement and the enquiry. It
              is lost in the weeks after the enquiry, while somebody who has already decided she
              wants a child works out whether she can afford one and whether she trusts you.
            </p>
            <p style={{ margin: "14px 0 0", fontSize: 15.5, lineHeight: 1.7 }}>
              Those people are reachable. They are in your phone, in your WhatsApp and in whatever
              book the front desk keeps. Sending them a short anonymous form costs nothing, and what
              comes back will tell you more about why the business is lumpy than any other exercise
              we could run.
            </p>
          </div>
        </section>

        {/* 5. Footer */}
        <footer
          style={{
            marginTop: 44, paddingTop: 22, borderTop: `1px solid ${LINE}`,
            color: MUTED, fontSize: 13, lineHeight: 1.7,
          }}
        >
          <div style={{ width: 54, height: 3, background: GOLD, marginBottom: 14 }} />
          <p style={{ margin: 0 }}>
            This page is private to Clearview Fertility and Clearview Hospital and is not listed
            anywhere. Everything shared through it is confidential to Consult for Africa, is used
            only for this piece of work, and is not shared with any hospital, payer, supplier or
            other party. The anonymous surveys collect no personal information at all.
          </p>
          <p style={{ margin: "12px 0 0", color: DEEP, fontWeight: 600 }}>
            Consult for Africa &middot; hello@consultforafrica.com &middot; +234 913 813 8553 &middot; consultforafrica.com
          </p>
        </footer>
      </div>
    </main>
  );
}
