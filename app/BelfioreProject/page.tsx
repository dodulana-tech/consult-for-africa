import type { Metadata } from "next";
import { BELFIORE_SURVEYS } from "@/lib/belfiore-survey";

// One private link for Dr Uju Rapu and the Belfiore team: what the two days
// cover, and the four surveys that decide what gets taught in them.
// Deliberately not indexed.

export const metadata: Metadata = {
  title: "Belfiore and Consult for Africa",
  description: "The Client Experience Programme: what the two days cover, and the four surveys that shape them.",
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

// The five domains of the programme. Every session sits in exactly one of them,
// and together they cover the whole of what happens around a client.
const DOMAINS = [
  {
    n: "01",
    name: "What good looks like here",
    day: "Day 1",
    sessions: "The client journey, end to end  ·  The Belfiore service standard",
    what: "You cannot train, coach or audit against nothing. The team maps every point where a client meets Belfiore, then writes the standard it will be held to.",
  },
  {
    n: "02",
    name: "Doing the job day to day",
    day: "Day 1",
    sessions: "First contact on every channel  ·  In the clinic, from the door to the till",
    what: "The enquiry on the phone, on WhatsApp, in an Instagram message and at the door. The price question. The arrival, the wait, discretion, the handover to the clinician, checkout, and the confidentiality duty.",
  },
  {
    n: "03",
    name: "When it is difficult",
    day: "Day 1 and 2",
    sessions: "The difficult client  ·  The dissatisfied result",
    what: "Six kinds of difficult client and a response for each. Then the one that is specific to aesthetics: the client who is unhappy with her result, what admin may and may not say, and how a complaint gets resolved rather than posted.",
  },
  {
    n: "04",
    name: "The client who is not in the room",
    day: "Day 2",
    sessions: "Follow-up and aftercare contact  ·  Prompting, recall and rebooking",
    what: "The check-in after treatment, the review request, the referral ask. Then the reminders, the deposits that stop no-shows, the rebooking cycle by treatment, and getting back in touch with clients nobody has called in a year.",
  },
  {
    n: "05",
    name: "How we know it is working",
    day: "Day 2",
    sessions: "Feedback and audit  ·  Making it stick",
    what: "The feedback instrument, mystery shopping, call and message review, and the five numbers worth watching every week. Then the weekly huddle, the manager's coaching script, and a signed 30-day plan each.",
  },
];

export default function BelfioreProjectPage() {
  return (
    <main style={{ background: "#eef2f6", minHeight: "100vh", color: "#1F2937" }}>
      <header style={{ background: NAVY, borderBottom: `3px solid ${GOLD}` }}>
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "30px 18px 32px" }}>
          <div style={{ color: GOLD, fontWeight: 700, fontSize: 11.5, letterSpacing: ".14em", textTransform: "uppercase" }}>
            Belfiore and Consult for Africa
          </div>
          <h1 style={{ color: "#fff", fontSize: 30, lineHeight: 1.18, margin: "10px 0 0", fontWeight: 800 }}>
            The Client Experience Programme
          </h1>
          <p style={{ color: "#C9D6E0", fontSize: 16, margin: "10px 0 0", lineHeight: 1.6, maxWidth: 640 }}>
            Two days with the front-of-house team on 25 and 26 September. This page holds what the
            two days cover, and the four short surveys that decide what actually gets taught in them.
          </p>
          <p style={{ color: "#8FA8BC", fontSize: 13.5, margin: "16px 0 0" }}>
            Private to Belfiore. Not listed anywhere.
          </p>
        </div>
      </header>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 18px 72px" }}>
        {/* A word from Debo, so the page has a person behind it */}
        <section style={{ ...card, background: "#FBF6E6", borderLeft: `4px solid ${GOLD}`, marginTop: 22 }}>
          <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.7 }}>
            Dr Rapu, you asked for customer service training for your admin team. I want to give you
            something slightly larger than that for the same two days, because in a practice like
            yours the front desk is not an administrative function. It is where the decision to
            proceed is made, where the price objection is won or lost, and where a client decides
            whether she will come back or quietly go somewhere else.
          </p>
          <p style={{ margin: "12px 0 0", fontSize: 15.5, lineHeight: 1.7 }}>
            Before we teach anything I want to know what is actually happening at your desk rather
            than what a generic course assumes. That is what these four surveys are for. The team one
            matters most, and it is anonymous for a reason: I would rather know what your team finds
            genuinely hard than be told everything is fine.
          </p>
          <p style={{ margin: "12px 0 0", fontWeight: 700, color: NAVY, fontSize: 14.5 }}>
            Dr Debo Odulana, Founding Partner, Consult for Africa
          </p>
        </section>

        {/* 1. The shape of the two days */}
        <section style={{ marginTop: 40 }}>
          <SectionHeading
            eyebrow="The two days"
            title="Five domains, ten sessions, nothing taught twice"
            lead="Every session sits in exactly one domain, and together the five cover the whole of what happens around a client: before she arrives, while she is with you, when something goes wrong, after she leaves, and how you know any of it is working."
          />
          <div style={{ display: "grid", gap: 12 }}>
            {DOMAINS.map((d) => (
              <div key={d.n} style={{ ...card, borderLeft: `4px solid ${TEAL}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
                  <div style={{ color: NAVY, fontWeight: 800, fontSize: 18 }}>
                    <span style={{ color: TEAL, marginRight: 10 }}>{d.n}</span>
                    {d.name}
                  </div>
                  <span style={{ color: MUTED, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>{d.day}</span>
                </div>
                <div style={{ color: GOLD, fontSize: 13, fontWeight: 700, marginTop: 7 }}>{d.sessions}</div>
                <p style={{ color: "#334155", fontSize: 14.5, lineHeight: 1.6, margin: "8px 0 0" }}>{d.what}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 2. The surveys */}
        <section style={{ marginTop: 40 }}>
          <SectionHeading
            eyebrow="Four short surveys"
            title="Whichever one applies to you"
            lead="The team, client and enquirer surveys are anonymous, and those answers come to Consult for Africa rather than to anyone at Belfiore. Please share the links freely with the people they are for."
          />
          <div style={{ display: "grid", gap: 12 }}>
            {BELFIORE_SURVEYS.map((s) => (
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

        {/* 3. The two that matter most */}
        <section style={{ marginTop: 40 }}>
          <SectionHeading eyebrow="If you only push two" title="The team, and the people who never came" />
          <div style={card}>
            <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.7 }}>
              <b>The team survey</b> is the one that changes what we teach. It asks your people what
              they cannot answer, what they are not allowed to decide, what they are asked to do that
              a system should be doing, and what a difficult client actually costs them. Three people
              can complete it before Thursday, and it turns two generic days into two days about
              Belfiore.
            </p>
            <p style={{ margin: "14px 0 0", fontSize: 15.5, lineHeight: 1.7 }}>
              <b>The survey for people who enquired and did not book</b> is the one almost nobody in
              aesthetics ever runs, and it is the most commercially useful instrument on this page.
              The money is rarely lost between the advertisement and the enquiry. It is lost in the
              hours after it, while somebody who has already decided she wants the treatment works
              out whether she trusts you with her face. Those people are still in your Instagram
              inbox and your WhatsApp. Sending them a short anonymous form costs nothing.
            </p>
          </div>
        </section>

        {/* 4. Footer */}
        <footer
          style={{
            marginTop: 44, paddingTop: 22, borderTop: `1px solid ${LINE}`,
            color: MUTED, fontSize: 13, lineHeight: 1.7,
          }}
        >
          <div style={{ width: 54, height: 3, background: GOLD, marginBottom: 14 }} />
          <p style={{ margin: 0 }}>
            This page is private to Belfiore Medical Aesthetics and is not listed anywhere.
            Everything shared through it is confidential to Consult for Africa, is used only for this
            piece of work, and is not shared with any clinic, supplier or other party. The anonymous
            surveys collect no personal information at all, and no answer is ever reported in a form
            that identifies the person who gave it.
          </p>
          <p style={{ margin: "12px 0 0", color: DEEP, fontWeight: 600 }}>
            Consult for Africa &middot; hello@consultforafrica.com &middot; +234 913 813 8553 &middot; consultforafrica.com
          </p>
        </footer>
      </div>
    </main>
  );
}
