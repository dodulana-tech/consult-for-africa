import type { Metadata } from "next";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { ILE_BRAND as C, ILE_PRICING, FOUNDING_FAMILY_LIMIT } from "@/lib/ile";
import WaitlistForm from "./WaitlistForm";

export const metadata: Metadata = {
  title: "Care for your parents in Lagos",
  description:
    "When you cannot be there, we are. Vetted nurses, physiotherapists and doctors in your parent's own home in Lagos, plus residential places, with a family portal that shows you every visit.",
};

export const revalidate = 300;

const display = "var(--ile-display), Georgia, serif";
const sans = "var(--ile-sans), system-ui, sans-serif";

export default async function IlePage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const [{ ref }, taken] = await Promise.all([
    searchParams,
    prisma.ileWaitlistEntry.count().catch(() => 0),
  ]);
  const remaining = Math.max(0, FOUNDING_FAMILY_LIMIT - taken);
  // A family referred by another family arrives with ?ref=CODE. The referral
  // loop is the cheapest demand ilé will ever get, so the code has to survive
  // the journey from the link to the row.
  const referredByCode = ref?.trim().toUpperCase() || null;

  return (
    <div style={{ background: C.ground, color: C.body, fontFamily: sans }}>
      <Nav />
      <Hero remaining={remaining} />
      <Proof />
      <Distance />
      <Services />
      <Pricing />
      <Portal />
      <Founding remaining={remaining} />
      <Reserve referredByCode={referredByCode} />
      <Footer />
    </div>
  );
}

/* ─── brand furniture ─────────────────────────────────────────────────────── */

function Mark({ size = 34 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size, borderRadius: size * 0.3, background: C.amber }}
    >
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="white">
        <path d="M12 21s-7.5-4.7-9.6-9.3C.7 8 2.6 4.5 6 4.5c2.2 0 3.6 1.2 4.4 2.3.4.5 1.2.5 1.6 0C12.8 5.7 14.2 4.5 16.4 4.5c3.4 0 5.3 3.5 3.2 7.2C17.5 16.3 12 21 12 21z" />
      </svg>
    </span>
  );
}

function Wordmark({ size = 34, on = C.ink }: { size?: number; on?: string }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Mark size={size} />
      <span style={{ fontFamily: display, fontSize: size * 0.72, fontWeight: 600, color: on, letterSpacing: "-0.01em" }}>
        Ilé
      </span>
    </span>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mb-3 text-[11px] font-semibold uppercase"
      style={{ color: C.green, letterSpacing: "0.14em" }}
    >
      {children}
    </p>
  );
}

function H({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <h2
      className={`text-[30px] md:text-[40px] leading-[1.12] ${className}`}
      style={{ fontFamily: display, fontWeight: 600, color: C.ink, letterSpacing: "-0.015em" }}
    >
      {children}
    </h2>
  );
}

function Section({
  children,
  bg = C.ground,
  id,
}: {
  children: React.ReactNode;
  bg?: string;
  id?: string;
}) {
  return (
    <section id={id} style={{ background: bg }}>
      <div className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8 md:py-24">{children}</div>
    </section>
  );
}

/* ─── nav ─────────────────────────────────────────────────────────────────── */

function Nav() {
  return (
    <header
      className="sticky top-0 z-40 backdrop-blur"
      style={{ background: "rgba(252,251,248,0.85)", borderBottom: `1px solid ${C.line}` }}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3.5 md:px-8">
        <Wordmark />
        <nav className="hidden items-center gap-8 text-sm md:flex" style={{ color: C.body }}>
          <a href="#services" className="hover:opacity-70">Home care</a>
          <a href="#residences" className="hover:opacity-70">Residences</a>
          <a href="#portal" className="hover:opacity-70">Family portal</a>
        </nav>
        <a
          href="#reserve"
          className="rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ background: C.green }}
        >
          Reserve a place
        </a>
      </div>
    </header>
  );
}

/* ─── hero ────────────────────────────────────────────────────────────────── */

function Hero({ remaining }: { remaining: number }) {
  return (
    <section
      style={{
        background: `radial-gradient(1100px 520px at 12% -5%, ${C.amberTint} 0%, rgba(247,235,215,0) 60%), radial-gradient(900px 500px at 88% 0%, ${C.greenTint} 0%, rgba(227,237,231,0) 62%), ${C.groundWarm}`,
      }}
    >
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 py-14 md:grid-cols-[1.02fr_1fr] md:px-8 md:py-24">
        <div>
          <span
            className="inline-block rounded-full px-3.5 py-1.5 text-[12px] font-medium"
            style={{ background: "rgba(255,255,255,0.75)", color: C.green, border: `1px solid ${C.line}` }}
          >
            Lagos care, built for families abroad
          </span>

          <h1
            className="mt-6 text-[42px] leading-[1.04] md:text-[62px]"
            style={{ fontFamily: display, fontWeight: 600, color: C.ink, letterSpacing: "-0.025em" }}
          >
            When you can&rsquo;t
            <br />
            be there,
            <br />
            <span style={{ color: C.green }}>we are.</span>
          </h1>

          <p className="mt-6 max-w-lg text-[17px] leading-relaxed" style={{ color: C.body }}>
            Vetted nurses, physiotherapists and doctors for your parents in Nigeria, plus premium
            residential care. You see every visit, every day, from wherever you are.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#reserve"
              className="rounded-full px-7 py-3.5 text-[15px] font-semibold transition hover:opacity-90"
              style={{ background: C.amber, color: C.amberDeep }}
            >
              Book a home visit
            </a>
            <a
              href="#residences"
              className="rounded-full bg-white px-7 py-3.5 text-[15px] font-semibold transition hover:opacity-80"
              style={{ color: C.ink, border: `1px solid ${C.line}` }}
            >
              Reserve a place
            </a>
          </div>

          <p className="mt-5 text-[13px]" style={{ color: C.muted }}>
            Care at home is available now. {remaining} of {FOUNDING_FAMILY_LIMIT} founding family
            places remain.
          </p>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-[22px]" style={{ boxShadow: "0 24px 60px rgba(32,48,42,0.16)" }}>
            <Image
              src="/ile/father-portrait.jpg"
              alt="An older Nigerian man at home, smiling"
              width={1400}
              height={1120}
              priority
              className="h-[340px] w-full object-cover object-top md:h-[460px]"
            />
          </div>
          <div className="md:absolute md:-bottom-10 md:-left-10 md:w-[330px]">
            <CareCard />
          </div>
        </div>
      </div>
    </section>
  );
}

/** The trust layer, in miniature. This is the thing competitors cannot copy. */
function CareCard() {
  const events = [
    { t: "Morning check completed", m: "08:12 · Nurse Grace K. · photo attached" },
    { t: "Medications given", m: "08:20 · Amlodipine, Metformin · signed" },
    { t: "BP 128/82 · Pulse 74", m: "08:25 · within normal range" },
  ];
  return (
    <div
      className="mt-6 rounded-[18px] bg-white p-4 md:mt-0"
      style={{ border: `1px solid ${C.line}`, boxShadow: "0 18px 44px rgba(32,48,42,0.14)" }}
    >
      <div className="flex items-center gap-3 pb-3" style={{ borderBottom: `1px solid ${C.line}` }}>
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-semibold text-white"
          style={{ background: C.green }}
        >
          FA
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold" style={{ color: C.ink }}>
            Mrs. Folake Adeyemi
          </p>
          <p className="truncate text-[11px]" style={{ color: C.muted }}>
            Assisted living · Ilé Lekki
          </p>
        </div>
        <span
          className="flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-semibold"
          style={{ background: C.greenTint, color: C.green }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: C.green }} />
          Live
        </span>
      </div>
      <ul className="space-y-2.5 pt-3">
        {events.map((e) => (
          <li key={e.t} className="flex gap-2.5">
            <span
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
              style={{ background: C.greenTint }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="3.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <span className="min-w-0">
              <span className="block text-[12.5px] font-semibold" style={{ color: C.ink }}>{e.t}</span>
              <span className="block text-[11px]" style={{ color: C.muted }}>{e.m}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─── proof strip ─────────────────────────────────────────────────────────── */

function Proof() {
  const stats = [
    ["20m+", "Nigerians living abroad"],
    ["$21.8bn", "Remitted home in 2025"],
    ["Every visit", "Logged, timed and signed"],
  ];
  return (
    <div style={{ background: C.ground, borderBottom: `1px solid ${C.line}` }}>
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-10 sm:grid-cols-3 md:px-8">
        {stats.map(([n, l]) => (
          <div key={l}>
            <p style={{ fontFamily: display, fontSize: 32, fontWeight: 600, color: C.green, letterSpacing: "-0.02em" }}>
              {n}
            </p>
            <p className="mt-1 text-[13.5px]" style={{ color: C.muted }}>{l}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── the problem ─────────────────────────────────────────────────────────── */

function Distance() {
  return (
    <Section bg={C.ground}>
      <div className="grid items-center gap-12 md:grid-cols-2">
        <div className="overflow-hidden rounded-[22px]">
          <Image
            src="/ile/daughter-and-mother.jpg"
            alt="An adult daughter with her mother"
            width={1400}
            height={2061}
            className="h-[380px] w-full object-cover md:h-[500px]"
          />
        </div>
        <div>
          <Eyebrow>The problem</Eyebrow>
          <H>You are four thousand miles away and still the one deciding.</H>
          <p className="mt-6 text-[16.5px] leading-relaxed" style={{ color: C.body }}>
            A parent gets frailer. A fall, a stroke, a diagnosis, or simply the slow arithmetic of
            age. Somebody takes leave they cannot afford. Somebody sends money instead and feels the
            difference. Then a helper is found through a friend of a friend, untrained and
            unsupervised, alone with a person who needs skilled care at three in the morning.
          </p>
          <p className="mt-4 text-[16.5px] leading-relaxed" style={{ color: C.body }}>
            The fear underneath every one of these arrangements is distance. A daughter in London
            paying for a nurse in Lagos has no way to know the nurse arrived, what was done, or how
            her mother is.
          </p>
          <p className="mt-6 text-[17px] font-semibold leading-relaxed" style={{ color: C.ink }}>
            This is not a failure of love. It is a failure of infrastructure. There has never been a
            proper option to choose.
          </p>
        </div>
      </div>
    </Section>
  );
}

/* ─── services ────────────────────────────────────────────────────────────── */

function Services() {
  const items = [
    {
      n: "1",
      title: "Home care on demand",
      body: "Vetted nurses, physiotherapists and doctors booked to your parent's home. Available now, from a single visit to live-in care.",
    },
    {
      n: "2",
      title: "Residential living",
      body: "Premium assisted-living places in a home built to a clinical standard, reserved ahead with a deposit that secures priority and launch pricing.",
    },
    {
      n: "3",
      title: "The family portal",
      body: "Every visit logged, medications recorded, vitals tracked, photo and location proof of each visit, scheduled video calls, and one clear monthly bill.",
    },
    {
      n: "+",
      title: "Priced in your currency",
      body: "Sponsors abroad are billed in dollars, local families in naira, on a single monthly invoice. Frictionless for whoever is paying.",
    },
  ];
  return (
    <Section bg={C.groundWarm} id="services">
      <div className="max-w-2xl">
        <Eyebrow>What we are building</Eyebrow>
        <H>Three connected services, one trusted relationship</H>
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {items.map((i) => (
          <div
            key={i.title}
            className="rounded-[18px] bg-white p-7"
            style={{ border: `1px solid ${C.line}` }}
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[13px] font-semibold"
              style={{
                background: i.n === "+" ? C.amberTint : C.greenTint,
                color: i.n === "+" ? C.amberDeep : C.green,
              }}
            >
              {i.n}
            </span>
            <h3
              className="mt-4 text-[20px]"
              style={{ fontFamily: display, fontWeight: 600, color: C.ink }}
            >
              {i.title}
            </h3>
            <p className="mt-2.5 text-[15px] leading-relaxed" style={{ color: C.body }}>
              {i.body}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ─── pricing ─────────────────────────────────────────────────────────────── */

function Pricing() {
  return (
    <Section bg={C.ground}>
      <div className="grid gap-12 md:grid-cols-[1fr_1.15fr] md:items-center">
        <div>
          <Eyebrow>What it costs</Eyebrow>
          <H>Clear prices, in the currency you actually hold</H>
          <p className="mt-5 text-[16px] leading-relaxed" style={{ color: C.body }}>
            Start with a single visit and add to it. No bundle you have to buy into, no fee for
            finding out. Local families pay the naira equivalent on the same schedule.
          </p>
          <div className="mt-7 overflow-hidden rounded-[16px]" style={{ border: `1px solid ${C.line}` }}>
            <Image
              src="/ile/mother-portrait.jpg"
              alt="An older Nigerian woman"
              width={1400}
              height={1050}
              className="h-[220px] w-full object-cover"
            />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {ILE_PRICING.map((p) => (
            <div
              key={p.service}
              className="rounded-[16px] bg-white p-6"
              style={{ border: `1px solid ${C.line}` }}
            >
              <p className="text-[14px] font-semibold" style={{ color: C.ink }}>{p.service}</p>
              <p
                className="mt-3"
                style={{ fontFamily: display, fontSize: 30, fontWeight: 600, color: C.green, letterSpacing: "-0.02em" }}
              >
                {p.usd}
              </p>
              <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>{p.unit}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ─── family portal ───────────────────────────────────────────────────────── */

function Portal() {
  const today = [
    ["Morning wellness check", "Nurse Grace K. · photo verified", "08:12"],
    ["Medications administered", "Amlodipine 5mg, Metformin 500mg · signed GK", "08:20"],
    ["Vitals recorded", "BP 128/82 · Pulse 74 · Temp 36.6", "08:25"],
    ["Breakfast taken well", "Pap, moi-moi, fruit · full portion", "08:40"],
  ];
  return (
    <Section bg={C.groundWarm} id="portal">
      <div className="max-w-2xl">
        <Eyebrow>The trust layer</Eyebrow>
        <H>What a family sees, from anywhere</H>
        <p className="mt-5 text-[16.5px] leading-relaxed" style={{ color: C.body }}>
          You open it in London at six in the morning and see your mother&rsquo;s morning in Lagos at
          a glance. The check done, the medications given and signed for, the vitals, the next call
          booked, the bill clear. This is the difference between sending money into the dark and
          knowing.
        </p>
      </div>

      <div
        className="mt-10 rounded-[20px] bg-white p-5 md:p-7"
        style={{ border: `1px solid ${C.line}`, boxShadow: "0 20px 50px rgba(32,48,42,0.10)" }}
      >
        <div className="grid gap-5 md:grid-cols-[1.5fr_1fr]">
          <div>
            <div className="flex items-center justify-between pb-4">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-full text-[14px] font-semibold text-white"
                  style={{ background: C.green }}
                >
                  FA
                </span>
                <div>
                  <p style={{ fontFamily: display, fontSize: 19, fontWeight: 600, color: C.ink }}>
                    Mrs. Folake Adeyemi
                  </p>
                  <p className="text-[12px]" style={{ color: C.muted }}>
                    74 · Assisted living · Ilé Lekki
                  </p>
                </div>
              </div>
              <span
                className="hidden rounded-full px-2.5 py-1 text-[11px] font-semibold sm:inline"
                style={{ background: C.greenTint, color: C.green }}
              >
                Stable
              </span>
            </div>
            <p className="pb-2 text-[12px] font-semibold uppercase" style={{ color: C.muted, letterSpacing: "0.1em" }}>
              Today&rsquo;s care
            </p>
            <ul>
              {today.map(([t, m, time]) => (
                <li
                  key={t}
                  className="flex items-start gap-3 py-2.5"
                  style={{ borderTop: `1px solid ${C.line}` }}
                >
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: C.green }} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-semibold" style={{ color: C.ink }}>{t}</span>
                    <span className="block text-[12px]" style={{ color: C.muted }}>{m}</span>
                  </span>
                  <span className="shrink-0 text-[12px]" style={{ color: C.muted }}>{time}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <div className="rounded-[14px] p-4" style={{ background: C.greenTint }}>
              <p className="text-[12.5px] font-semibold" style={{ color: C.green }}>Next video call</p>
              <p className="mt-1 text-[13px]" style={{ color: C.ink }}>Today, 6:00 PM WAT</p>
            </div>
            <div className="rounded-[14px] p-4" style={{ border: `1px solid ${C.line}` }}>
              <p className="pb-1 text-[12.5px] font-semibold" style={{ color: C.ink }}>Upcoming</p>
              {[["Physio session", "Tue · 10:00"], ["Dr. Bello review", "Thu · 15:00"], ["Family visit", "Sat · open"]].map(
                ([a, b]) => (
                  <p key={a} className="flex justify-between py-1 text-[12.5px]" style={{ color: C.muted }}>
                    <span>{a}</span>
                    <span>{b}</span>
                  </p>
                ),
              )}
            </div>
            <div className="rounded-[14px] p-4" style={{ background: C.amberTint }}>
              <p className="text-[12.5px]" style={{ color: C.amberDeep }}>September invoice</p>
              <p style={{ fontFamily: display, fontSize: 26, fontWeight: 600, color: C.ink }}>$840</p>
              <p className="text-[12px]" style={{ color: C.amberDeep }}>Assisted living + physio</p>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-[12px]" style={{ color: C.muted }}>
        Family portal. Illustrative, with example data.
      </p>
    </Section>
  );
}

/* ─── founding families ───────────────────────────────────────────────────── */

function Founding({ remaining }: { remaining: number }) {
  const perks = [
    "First call when places in the home open, before anyone else",
    "A free first assessment of what your family actually needs",
    "The founding rate, held for as long as you stay",
    "An honest update as the home takes shape, including when things are slower than we hoped",
  ];
  return (
    <Section bg={C.ground} id="residences">
      <div className="grid gap-12 md:grid-cols-[1.1fr_1fr] md:items-center">
        <div>
          <Eyebrow>Founding families</Eyebrow>
          <H>The first hundred families shape what this becomes</H>
          <p className="mt-5 text-[16.5px] leading-relaxed" style={{ color: C.body }}>
            Joining early is not a queue ticket. The first hundred families tell us what to build and
            get treated accordingly, for as long as they stay with us.
          </p>
          <ul className="mt-7 space-y-3">
            {perks.map((p) => (
              <li key={p} className="flex gap-3 text-[15px]" style={{ color: C.body }}>
                <svg className="mt-1 shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {p}
              </li>
            ))}
          </ul>
          <p
            className="mt-8 inline-block rounded-full px-5 py-2.5 text-[14px] font-semibold"
            style={{ background: C.amberTint, color: C.amberDeep }}
          >
            {remaining} of {FOUNDING_FAMILY_LIMIT} places remain
          </p>
        </div>
        <div className="overflow-hidden rounded-[22px]">
          <Image
            src="/ile/family-lagos.jpg"
            alt="A Lagos family together at home across three generations"
            width={1400}
            height={933}
            className="h-[330px] w-full object-cover md:h-[430px]"
          />
        </div>
      </div>
    </Section>
  );
}

/* ─── the ask ─────────────────────────────────────────────────────────────── */

function Reserve({ referredByCode }: { referredByCode: string | null }) {
  return (
    <Section bg={C.groundWarm} id="reserve">
      <div className="mx-auto max-w-2xl text-center">
        <Eyebrow>Tell us about your family</Eyebrow>
        <H>It takes two minutes, and commits you to nothing</H>
        <p className="mt-4 text-[16px] leading-relaxed" style={{ color: C.body }}>
          If what you need is urgent, say so below and we will call you first.
        </p>
      </div>
      <div className="mx-auto mt-10 max-w-2xl">
        <WaitlistForm referredByCode={referredByCode} />
      </div>
    </Section>
  );
}

/* ─── footer ──────────────────────────────────────────────────────────────── */

function Footer() {
  return (
    <footer style={{ background: C.ink }}>
      <div className="mx-auto w-full max-w-6xl px-5 py-12 md:px-8">
        <Wordmark on="white" />
        <p className="mt-5 max-w-lg text-[14px] leading-relaxed" style={{ color: "rgba(255,255,255,0.72)" }}>
          Premium senior care in Lagos, built for families abroad. Care at home is available now. The
          residence is being built and places can be reserved.
        </p>
        <a
          href="mailto:hello@consultforafrica.com"
          className="mt-5 inline-block text-[14px] font-medium"
          style={{ color: C.amber }}
        >
          hello@consultforafrica.com
        </a>
        <p className="mt-8 text-[12px] leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
          ilé is a working name. Photography is illustrative. We hold what you tell us only to
          contact you about care for your family, and you can ask us to delete it at any time, under
          the Nigeria Data Protection Act 2023.
        </p>
      </div>
    </footer>
  );
}
