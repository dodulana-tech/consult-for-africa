import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { FOUNDING_FAMILY_LIMIT, ILE_BRAND, ILE_CONTACT_EMAIL } from "@/lib/ile";
import WaitlistForm from "./WaitlistForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Care for our parents",
  description:
    "ilé is building a residential home in Lagos for older people who need real care, and provides skilled care in your family's own home today. Join the waiting list.",
};

const NAVY = ILE_BRAND.navy;
const GOLD = ILE_BRAND.gold;
const TEAL = ILE_BRAND.teal;

const HOME_CARE = [
  {
    title: "Nursing visits",
    body: "Wounds, catheters, injections, medication that has to be given properly and recorded. Delivered by a nurse, not by someone improvising.",
  },
  {
    title: "Personal care",
    body: "Washing, dressing, moving safely from bed to chair. The daily help that keeps someone comfortable and keeps their dignity intact.",
  },
  {
    title: "After a hospital stay",
    body: "The weeks after discharge are when people fall, stop their tablets and go back in. We cover that gap with a plan rather than hope.",
  },
  {
    title: "Company",
    body: "For someone who is mostly alone. Not a substitute for family, but somebody reliable who turns up, notices things and tells you.",
  },
  {
    title: "Memory loss",
    body: "Care for someone living with dementia, from carers trained for it, working to a plan that does not change every week.",
  },
  {
    title: "Comfort at the end",
    body: "Care at the end of life, at home, with pain managed properly and the family supported through it.",
  },
];

const STANDARD = [
  {
    title: "Written protocols, signed off before anyone works to them",
    body: "Medication, falls, infection control, when to escalate and who to call. Our clinical lead approves each one before a carer is asked to follow it.",
  },
  {
    title: "Carers who are trained, supervised and paid properly",
    body: "Most of what goes wrong in this work goes wrong because the person providing the care was never trained and is not supervised. We would rather grow slowly than staff badly.",
  },
  {
    title: "A named hospital ready to receive",
    body: "Before we care for anyone we agree where they go in an emergency and how they get there. A plan made on the night is not a plan.",
  },
  {
    title: "A record of every visit, which you can see",
    body: "What was done, when, and by whom. Not because families ask for it, though they do, but because care that is not written down cannot be checked.",
  },
];

const FOUNDING = [
  "First call when places in the home open, before anyone else.",
  "A free first assessment of what your family actually needs, whether or not you go on to use us.",
  "The founding rate, held for you when you start.",
  "An honest update as the home takes shape, including when things are slower than we hoped.",
];

export default async function IleLandingPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;

  const joined = await prisma.ileWaitlistEntry.count().catch(() => 0);
  const foundingLeft = Math.max(0, FOUNDING_FAMILY_LIMIT - joined);

  return (
    <main style={{ background: "#FBF9F3", color: ILE_BRAND.ink }}>
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40" style={{ background: NAVY }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <div>
            <div className="text-2xl font-bold leading-none text-white">ilé</div>
            <div
              className="mt-1 text-[8px] font-bold tracking-[0.16em]"
              style={{ color: GOLD }}
            >
              CARE FOR OUR PARENTS
            </div>
          </div>
          <a
            href="#join"
            className="rounded-full px-5 py-2.5 text-xs font-semibold transition hover:opacity-90"
            style={{ background: GOLD, color: NAVY }}
          >
            Join the list
          </a>
        </div>
        <div style={{ height: 2, background: GOLD }} />
      </header>

      {/* ─── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: NAVY }}>
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 70% at 75% 20%, rgba(31,122,140,0.35) 0%, transparent 62%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 40% 50% at 20% 100%, rgba(212,175,55,0.10) 0%, transparent 55%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.22em]"
            style={{ color: GOLD }}
          >
            Lagos
          </p>
          <h1
            className="mt-6 max-w-3xl font-semibold leading-[1.1] tracking-tight text-white"
            style={{ fontSize: "clamp(2.1rem, 5.2vw, 3.6rem)" }}
          >
            Somebody has to look after your mother.
            <br />
            <span style={{ color: GOLD }}>It should not have to be guesswork.</span>
          </h1>
          <div className="mt-7 h-[2px] w-12" style={{ background: GOLD }} />
          <p
            className="mt-7 max-w-xl leading-relaxed"
            style={{ color: "rgba(255,255,255,0.62)", fontSize: "clamp(0.98rem, 1.4vw, 1.1rem)" }}
          >
            ilé is building a residential home in Lagos for older people who need real
            care, run to a standard this country has not been offered before. It is not
            open yet. Care in your family&apos;s own home is available now.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a
              href="#join"
              className="rounded-full px-7 py-3.5 text-sm font-semibold transition hover:opacity-90"
              style={{ background: GOLD, color: NAVY }}
            >
              Join the waiting list
            </a>
            <a
              href="#now"
              className="rounded-full border px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
              style={{ borderColor: "rgba(255,255,255,0.25)" }}
            >
              What we can do today
            </a>
          </div>

          {foundingLeft > 0 && (
            <p className="mt-7 text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
              {foundingLeft} of {FOUNDING_FAMILY_LIMIT} founding family places remain.
            </p>
          )}
        </div>
      </section>

      {/* ─── The situation ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
        <h2
          className="font-semibold leading-tight"
          style={{ color: NAVY, fontSize: "clamp(1.5rem, 3vw, 2.1rem)" }}
        >
          You already know how this usually goes
        </h2>
        <div className="mt-7 space-y-5 leading-relaxed" style={{ fontSize: "1.02rem" }}>
          <p>
            A parent gets frailer. A fall, a stroke, a diagnosis, or simply the slow
            arithmetic of age. The family holds a meeting. Somebody takes leave they
            cannot afford. Somebody sends money instead, and feels the difference.
          </p>
          <p>
            Then a helper is found through a friend of a friend. She may be wonderful.
            She may be untrained, unsupervised and alone with a person who needs skilled
            care at three in the morning. Nobody is checking. Nobody wrote anything down.
            When it goes wrong the family finds out late.
          </p>
          <p className="font-semibold" style={{ color: NAVY }}>
            This is not a failure of love. It is a failure of infrastructure. There has
            never been a proper option to choose.
          </p>
        </div>
      </section>

      {/* ─── The home ───────────────────────────────────────────────────── */}
      <section style={{ background: "#FFFFFF" }}>
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: TEAL }}
          >
            What we are building
          </p>
          <h2
            className="mt-4 max-w-2xl font-semibold leading-tight"
            style={{ color: NAVY, fontSize: "clamp(1.6rem, 3.2vw, 2.3rem)" }}
          >
            A home. Not an institution, and not a ward.
          </h2>

          <div className="mt-10 grid gap-10 lg:grid-cols-2">
            <div className="space-y-5 leading-relaxed">
              <p>
                A place where an older person has their own room, their own things and
                their own routine, with nurses and trained carers there around the clock
                and a doctor who knows them. Where the food is food they recognise.
                Where family can visit and be glad they came, rather than relieved to
                leave.
              </p>
              <p>
                We are looking for the right building now. When we have it we will fit
                it properly for people who are frail: the corridors, the bathrooms and
                the lighting all change when you build for someone who uses a walking
                frame.
              </p>
              <p className="font-semibold" style={{ color: NAVY }}>
                We will not open until we are registered and inspected, and we will tell
                you honestly where we are along the way.
              </p>
            </div>

            <div
              className="rounded-2xl p-8"
              style={{ background: ILE_BRAND.cream, border: `1px solid #E8DFBF` }}
            >
              <h3 className="text-sm font-bold" style={{ color: NAVY }}>
                Why the waiting list matters
              </h3>
              <p className="mt-4 text-sm leading-relaxed">
                A home like this is built once and lived in for decades. Who it is built
                for changes everything about it: how many rooms, how much nursing, which
                part of Lagos, what it costs.
              </p>
              <p className="mt-4 text-sm leading-relaxed">
                So we are asking the families who would actually use it, before we pour
                concrete rather than after. If you join the list you are not queueing.
                You are telling us what to build.
              </p>
              <a
                href="#join"
                className="mt-6 inline-block text-sm font-semibold underline underline-offset-4"
                style={{ color: TEAL }}
              >
                Tell us what your family needs
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Care at home, today ────────────────────────────────────────── */}
      <section id="now" className="scroll-mt-24">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: TEAL }}
          >
            Available now
          </p>
          <h2
            className="mt-4 max-w-2xl font-semibold leading-tight"
            style={{ color: NAVY, fontSize: "clamp(1.6rem, 3.2vw, 2.3rem)" }}
          >
            Care in your family&apos;s own home, while the home is being built
          </h2>
          <p className="mt-5 max-w-2xl leading-relaxed">
            Most families are not ready to move a parent anywhere, and most parents do
            not want to go. Care at home is often the right answer for years before it
            stops being the right answer. This is the part of ilé you can use today.
          </p>

          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl sm:grid-cols-2 lg:grid-cols-3" style={{ background: "#E7E2D4" }}>
            {HOME_CARE.map((item) => (
              <div key={item.title} className="p-7" style={{ background: "#FFFFFF" }}>
                <div className="h-[2px] w-7" style={{ background: GOLD }} />
                <h3 className="mt-5 text-base font-bold" style={{ color: NAVY }}>
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: "#4B5563" }}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Diaspora ───────────────────────────────────────────────────── */}
      <section style={{ background: NAVY }}>
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.2em]"
                style={{ color: GOLD }}
              >
                If you are abroad
              </p>
              <h2
                className="mt-4 font-semibold leading-tight text-white"
                style={{ fontSize: "clamp(1.6rem, 3.2vw, 2.3rem)" }}
              >
                You are four thousand miles away and you are still the one deciding
              </h2>
              <div className="mt-7 space-y-5 leading-relaxed" style={{ color: "rgba(255,255,255,0.62)" }}>
                <p>
                  You send the money. You make the calls at odd hours. You hear that
                  everything is fine, and you have no way to know whether it is. The
                  hardest part of caring for a parent from London or Houston is not the
                  cost. It is not being able to see.
                </p>
                <p>
                  So we built the seeing in. You get a record of every visit, what was
                  done and by whom, photographs where your family agrees to them, and a
                  written summary each month. When something changes you hear it from us
                  first, not from a relative weeks later.
                </p>
                <p className="font-semibold text-white">
                  And you can pay from where you are, in your own currency.
                </p>
              </div>
            </div>

            <div
              className="rounded-2xl p-8"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }}
            >
              <h3 className="text-sm font-bold" style={{ color: GOLD }}>
                What a month looks like
              </h3>
              <ul className="mt-6 space-y-5">
                {[
                  "Every visit logged as it happens, so you can look at any hour of the night and see the truth.",
                  "A written summary each month: how they are eating, sleeping, moving and managing their medication.",
                  "One person at ilé who knows your family and answers when you call.",
                  "A straight answer when something is wrong, including when it is our fault.",
                ].map((line) => (
                  <li key={line} className="flex gap-3 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>
                    <span style={{ color: GOLD }}>&#8226;</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── The standard ───────────────────────────────────────────────── */}
      <section style={{ background: "#FFFFFF" }}>
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: TEAL }}
          >
            How we work
          </p>
          <h2
            className="mt-4 max-w-2xl font-semibold leading-tight"
            style={{ color: NAVY, fontSize: "clamp(1.6rem, 3.2vw, 2.3rem)" }}
          >
            The boring things, done properly
          </h2>
          <p className="mt-5 max-w-2xl leading-relaxed">
            There is nothing clever about any of this. It is simply what good care
            requires, and almost nobody in this market is doing it.
          </p>

          <div className="mt-12 grid gap-8 sm:grid-cols-2">
            {STANDARD.map((item, i) => (
              <div key={item.title} className="flex gap-5">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{ background: ILE_BRAND.cream, color: NAVY, border: `1px solid #E8DFBF` }}
                >
                  {i + 1}
                </div>
                <div>
                  <h3 className="text-base font-bold leading-snug" style={{ color: NAVY }}>
                    {item.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed" style={{ color: "#4B5563" }}>
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Founding families ──────────────────────────────────────────── */}
      <section>
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <div
            className="rounded-3xl px-8 py-12 sm:px-14"
            style={{ background: ILE_BRAND.cream, border: "1px solid #E8DFBF" }}
          >
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: GOLD }}
            >
              Founding families
            </p>
            <h2
              className="mt-4 max-w-2xl font-semibold leading-tight"
              style={{ color: NAVY, fontSize: "clamp(1.5rem, 3vw, 2.1rem)" }}
            >
              The first hundred families shape what this becomes
            </h2>
            <p className="mt-5 max-w-2xl leading-relaxed">
              Joining early is not a queue ticket. The first hundred families tell us
              what to build and get treated accordingly, for as long as they stay with
              us.
            </p>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {FOUNDING.map((line) => (
                <li key={line} className="flex gap-3 text-sm leading-relaxed">
                  <span className="font-bold" style={{ color: GOLD }}>
                    &#10003;
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ─── The form ───────────────────────────────────────────────────── */}
      <section id="join" className="scroll-mt-20" style={{ background: "#FFFFFF" }}>
        <div className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
          <h2
            className="font-semibold leading-tight"
            style={{ color: NAVY, fontSize: "clamp(1.6rem, 3.2vw, 2.3rem)" }}
          >
            Tell us about your family
          </h2>
          <p className="mt-5 leading-relaxed">
            It takes about two minutes. There is nothing to pay and nothing to commit
            to. If what you need is urgent, say so below and we will call you first.
          </p>
          <div className="mt-10">
            <WaitlistForm referredByCode={ref ?? null} />
          </div>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────────────── */}
      <footer style={{ background: ILE_BRAND.deepNavy }}>
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
          <div className="text-2xl font-bold leading-none text-white">ilé</div>
          <div
            className="mt-1.5 text-[8px] font-bold tracking-[0.16em]"
            style={{ color: GOLD }}
          >
            CARE FOR OUR PARENTS
          </div>
          <p
            className="mt-7 max-w-xl text-sm leading-relaxed"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            Residential eldercare and care at home. Lagos, Nigeria. The residence is not
            yet open and we will not open it until it is registered and inspected.
          </p>
          <p className="mt-7 text-sm">
            <a
              href={`mailto:${ILE_CONTACT_EMAIL}`}
              className="underline underline-offset-4"
              style={{ color: GOLD }}
            >
              {ILE_CONTACT_EMAIL}
            </a>
          </p>
          <p
            className="mt-9 border-t pt-7 text-xs leading-relaxed"
            style={{ color: "rgba(255,255,255,0.35)", borderColor: "rgba(255,255,255,0.1)" }}
          >
            We hold your details only to contact you about care for your family, and we
            do not sell or share them. You can ask us to delete them at any time by
            replying to any email from us or writing to the address above. We handle
            personal data in line with the Nigeria Data Protection Act 2023.
          </p>
        </div>
      </footer>
    </main>
  );
}
