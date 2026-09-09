/**
 * Send the CadreHealth member briefing to the converted list.
 *
 * The highlight is the Abuja consultant survey. Mezo, the BusinessDay housemanship
 * piece and the profile nudge ride behind it. Written peer to peer and signed by
 * Debo, not by a platform.
 *
 * Cohorts, and the briefing each one gets
 *   --cohort converted   status CONVERTED, the resident list        405   standard briefing
 *   --cohort diaspora    status DIASPORA_NETWORK                     51   diaspora variant
 *   --cohort alumni      status ALUMNI_NETWORK, stepped back         23   alumni variant
 *   --cohort orphans     claimed but the status never advanced       17   standard briefing
 *   --cohort claimed     every profile with a password set          504   standard briefing
 *   --cohort warm        claimed and has signed in at least once    401   standard briefing
 *
 * The three segments are disjoint by construction, because practice-location moves a
 * record out of CONVERTED when someone declares they are abroad or have stepped back.
 * Send converted, diaspora, alumni and orphans and you have covered everyone once.
 *
 * Usage
 *   npx tsx --env-file=.env.local scripts/send-cadre-briefing.ts                        # dry run
 *   npx tsx --env-file=.env.local scripts/send-cadre-briefing.ts --preview out.html     # write the HTML and stop
 *   npx tsx --env-file=.env.local scripts/send-cadre-briefing.ts --apply --limit 1 --to me@x.com
 *   npx tsx --env-file=.env.local scripts/send-cadre-briefing.ts --apply
 *
 * Nothing sends without --apply. A local sent-log means a re-run never double-sends.
 * ZEPTOMAIL_API_KEY must be present: see lib/cadreHealth/memberBriefingEmail.ts for why.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { PrismaClient } from "@prisma/client";
import { renderBriefing, sendBriefing, type Briefing } from "@/lib/cadreHealth/memberBriefingEmail";

const prisma = new PrismaClient();

const SURVEY_URL = "https://www.consultforafrica.com/premium-medipark-survey.html";
const MEZO_URL = "https://mezohealth.com/for-doctors";
const ARTICLE_URL =
  "https://businessday.ng/insight-2/article/housemanship-reform-the-missing-piece-in-nigerias-health-workforce-strategy/";
const PROFILE_URL = "https://www.consultforafrica.com/oncadre/profile";
const DFC_URL = "https://dfcare.org";

// One shared log across every cohort. A member appears in exactly one segment, but the
// shared log is the backstop that guarantees nobody receives two versions of the same news.
const SENT_LOG = resolve(__dirname, "out/cadre-briefing-sent.json");

function flags() {
  const a = process.argv.slice(2);
  const get = (f: string) => {
    const i = a.indexOf(f);
    return i >= 0 ? a[i + 1] : null;
  };
  return {
    apply: a.includes("--apply"),
    cohort: (get("--cohort") ?? "converted") as
      | "converted" | "claimed" | "warm" | "diaspora" | "alumni" | "orphans",
    limit: get("--limit") ? parseInt(get("--limit")!, 10) : null,
    overrideTo: get("--to"),
    delay: get("--delay") ? parseInt(get("--delay")!, 10) : 400,
    preview: get("--preview"),
  };
}

function titleCase(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .replace(/\bMc([a-z])/g, (_, c) => "Mc" + c.toUpperCase())
    .trim();
}

/** Doctors get "Dr Surname". Everyone else gets their first name, which is not a demotion. */
function address(r: { firstName: string; lastName: string; cadre: string }): string {
  const surname = titleCase(r.lastName);
  const first = titleCase(r.firstName);
  if ((r.cadre === "MEDICINE" || r.cadre === "DENTISTRY") && surname) return `Dr ${surname}`;
  return first || surname || "Colleague";
}

function briefing(name: string): Briefing {
  return {
    subject: `${name}, nobody asks the consultants. We are asking.`,
    preheader:
      "Five minutes on a new private facility in Abuja, and you set the price. Plus Mezo, " +
      "housemanship reform in BusinessDay, and one thing on your profile.",
    salutation: `${name},`,
    opening: [
      "Most consultants meet a new facility the same way. It is finished, the rent card is " +
        "printed, and the terms are not negotiable. Nobody asked what the people who would " +
        "actually work there wanted, because by then it was too late to matter.",
      "We are advising on one that is not built yet. So we are asking first.",
    ],
    items: [
      {
        kicker: "The one thing we are asking for",
        heading: "A new private consulting facility in Abuja. Would you use it?",
        body: [
          "Serviced consulting rooms available by the session. Laboratory, imaging and " +
            "pharmacy on site. Trained nursing support. Billing and collection handled for " +
            "you. No lease, no staff on your payroll, no equipment to buy.",
          "The survey takes about five minutes. Four of the questions ask what a session is " +
            "worth to you, and <b>those four answers set the price</b>. Not a spreadsheet, not " +
            "a benchmark from Lagos. Your answers, and those of the other consultants we are " +
            "asking.",
          "It is confidential and reported only in aggregate. It is research, not an offer, " +
            "and completing it commits you to nothing.",
          "<i>If you practise privately in Abuja, or you have thought about it, this is for " +
            "you. If a colleague there should see it, please send it on.</i>",
        ],
        ctaText: "Take the survey",
        ctaHref: SURVEY_URL,
        primary: true,
      },
      {
        kicker: "Also worth knowing",
        heading: "Mezo: a private practice without a clinic to run",
        body: [
          "Mezo is a specialist network across ten Nigerian cities. Verified against the MDCN " +
            "register, managed schedules, guaranteed payment, and patients who find you. You " +
            "practise; the schedule, the billing and the records are somebody else's problem.",
          "It is a separate company from CadreHealth. We are telling you about it because the " +
            "question it answers, how to hold a private practice without carrying a building, " +
            "is the one we hear from you most.",
        ],
        ctaText: "See how it works for specialists",
        ctaHref: MEZO_URL,
      },
      {
        kicker: "From our desk",
        heading: "Housemanship reform, in BusinessDay",
        body: [
          "Roughly six thousand doctors qualify each year and there are nowhere near six " +
            "thousand house officer places for them. Some of the people reading this trained " +
            "the ones who are still waiting.",
          "Debo wrote on it with Yemi Johnson and Jennifer Anyanti in BusinessDay on 27 July. " +
            "The argument is that the bribery and the pain of central posting are symptoms, and " +
            "the real problem is structural: too few accredited places, most of them closed to " +
            "the open portal, funding that cannot follow the graduate, and an allocation system " +
            "nobody can audit.",
        ],
        ctaText: "Read it in BusinessDay",
        ctaHref: ARTICLE_URL,
      },
      {
        kicker: "One small thing",
        heading: "We could not tell which of you practise in Abuja",
        body: [
          "That is not a complaint, it is an admission. When we went to send this survey to the " +
            "consultants it is actually about, <b>most profiles on CadreHealth do not say where " +
            "you practise</b>, so we could not target it and sent it to everyone instead.",
          "The same gap decides whether an opportunity reaches you at all. Upload your CV and " +
            "the platform reads your qualifications, credentials and work history off it, so " +
            "the whole thing takes about two minutes rather than an evening.",
        ],
        ctaText: "Complete your profile",
        ctaHref: PROFILE_URL,
      },
    ],
    closing: [
      "If you would rather reply to this email than fill in a form, do. It reaches a person.",
    ],
    signOff: "Thank you,",
    signature: "Dr Debo Odulana",
    signatureRole:
      "Founding Partner, Consult for Africa. President, Doctors Foundation for Care.",
    footer:
      `You are receiving this because you claimed a CadreHealth profile. CadreHealth is built by ` +
      `Consult for Africa. To stop receiving these, reply with the word STOP and we will remove ` +
      `you the same day.`,
  };
}

/**
 * Diaspora variant. The survey is more relevant to this group than to the main list,
 * not less: a serviced room by the session with no lease is exactly what a consultant
 * who visits for two weeks a year needs. What does not transfer is Mezo, which assumes
 * current MDCN registration and presence, so it is gated rather than dropped.
 *
 * No invented products. The outreach cron deliberately gates the diaspora cadence until
 * visiting consultant slots exist, and this note does not pretend they do.
 */
function diasporaBriefing(name: string): Briefing {
  return {
    subject: `${name}, a clinic you could use for two weeks a year`,
    preheader:
      "A new private facility in Abuja is being priced now, and visiting consultants are " +
      "exactly who it is for. Plus housemanship reform in BusinessDay.",
    salutation: `${name},`,
    opening: [
      "You told us you are practising outside Nigeria. I am not going to assume what you " +
        "want to do about that. Some of you will come back, some never will, and most are " +
        "somewhere in between and tired of being asked.",
      "This note is short. One item needs you, and one of them may be worth your time for reasons that have nothing to do with us.",
    ],
    items: [
      {
        kicker: "The one thing we are asking for",
        heading: "A new private facility in Abuja is being priced. You are the awkward case.",
        body: [
          "Serviced consulting rooms by the session, with laboratory, imaging and pharmacy on " +
            "site, nursing support, and billing handled. No lease, no staff on your payroll, " +
            "nothing standing idle for the fifty weeks you are not there.",
          "<b>That is the visiting consultant's problem, solved.</b> It is also the case nobody " +
            "designing these buildings models, because the resident consultant is easier to " +
            "count. If you would use a room in Abuja for two weeks a year, or a Saturday list " +
            "when you are home, say so now and the pricing will have to account for you.",
          "Some questions assume a resident practice. Answer them for the pattern you would " +
            "actually use, and tell us in the free text that you visit. That is the useful part.",
        ],
        ctaText: "Take the survey",
        ctaHref: SURVEY_URL,
        primary: true,
      },
      {
        kicker: "If you want a way in that does not need relicensing",
        heading: "Doctors Foundation for Care",
        body: [
          "Nigerian doctors abroad, caring for Nigerians at home. <b>I should declare an " +
            "interest: I am its president</b>, which is why this is a paragraph and not a " +
            "pitch.",
          "Most of what DFC runs is deliberately built for people who are not moving back. " +
            "Second opinions on major diagnoses, turned around in seventy-two hours from where " +
            "you already sit. Case review. Fellowships pairing young Nigerian doctors with a " +
            "diaspora specialist who will actually take their calls. Outreaches and surgical " +
            "camps when you are home anyway. And for those who publish their availability, " +
            "in-person specialist visits.",
          "The <b>Emergency Response Initiative</b> is the one I would point a senior colleague " +
            "at first. It is a six-pillar technical working group writing Nigeria's national " +
            "emergency response framework, and it needs people who have worked inside systems " +
            "that function.",
          "Membership is open to licensed specialists trained abroad and carries annual dues.",
        ],
        ctaText: "Look at DFC",
        ctaHref: DFC_URL,
      },
      {
        kicker: "From our desk",
        heading: "Housemanship reform, in BusinessDay",
        body: [
          "Roughly six thousand doctors qualify each year and there are nowhere near six " +
            "thousand house officer places. Around two thousand are stranded annually against " +
            "an MDCN capacity of about four thousand.",
          "I wrote on it with Yemi Johnson and Jennifer Anyanti on 27 July. The argument is " +
            "that the bribery and the pain of central posting are symptoms, and the structure " +
            "underneath is the problem: too few accredited places, most of them closed to the " +
            "open portal, funding that cannot follow the graduate, and allocation nobody can " +
            "audit.",
        ],
        ctaText: "Read it in BusinessDay",
        ctaHref: ARTICLE_URL,
      },
      {
        kicker: "One small thing",
        heading: "Tell us how you would want to be involved, if at all",
        body: [
          "Your profile has a field for what you are open to: short mission, case review and " +
            "consulting, remote work, medevac, international placement. <b>Most diaspora " +
            "profiles have it blank</b>, which means when something genuinely suited to a " +
            "visiting consultant comes up, we have no way to know who to tell.",
          "None of it assumes relicensing in Nigeria. Leaving it blank is also an answer, and a " +
            "fair one.",
        ],
        ctaText: "Set what you are open to",
        ctaHref: PROFILE_URL,
      },
      {
        kicker: "Only if it applies",
        heading: "Mezo, for those holding current MDCN registration",
        body: [
          "Mezo is a specialist network across ten Nigerian cities: verified profiles, managed " +
            "schedules, guaranteed payment. It needs current MDCN registration and time on the " +
            "ground, so for most of you it will not apply. It is here because a few of you keep " +
            "your registration current and ask us this every year.",
        ],
        ctaText: "See how it works",
        ctaHref: MEZO_URL,
      },
    ],
    closing: [
      "If you would rather reply to this than fill in a form, do. It reaches a person.",
    ],
    signOff: "Thank you,",
    signature: "Dr Debo Odulana",
    signatureRole:
      "Founding Partner, Consult for Africa. President, Doctors Foundation for Care.",
    footer:
      "You are receiving this because you claimed a CadreHealth profile and told us you " +
      "practise outside Nigeria. To stop receiving these, reply with the word STOP and we " +
      "will remove you the same day.",
  };
}

/**
 * Alumni variant, for the twenty-three who told us they have stepped back. The survey and
 * Mezo are dropped rather than reworded: asking someone who has retired what they would
 * pay for a consulting session is the wrong question, and asking it costs the relationship.
 *
 * There is no alumni product yet. Rather than invent a designation, this asks what it
 * should be. That is the honest version and it is also the better one.
 */
function alumniBriefing(name: string): Briefing {
  return {
    subject: `${name}, the ones you trained are still waiting to start`,
    preheader:
      "Two thousand graduates a year cannot get a house officer post. What we wrote about " +
      "it, and one question for you.",
    salutation: `${name},`,
    opening: [
      "You told us you have stepped back from full-time clinical work, so most of what we " +
        "send is not for you. We would rather send you less than send you things written for " +
        "somebody else. This is short, and there is nothing to buy in it.",
    ],
    items: [
      {
        kicker: "From our desk",
        heading: "Housemanship reform, in BusinessDay",
        body: [
          "Roughly six thousand doctors qualify each year. Around <b>two thousand of them are " +
            "stranded annually</b>, unable to find a house officer post, against an MDCN " +
            "accredited capacity of about four thousand. Only forty-four hospitals, all " +
            "federal, are on the central portal; seventy accredited hospitals sit outside it. " +
            "Teaching hospitals route about forty per cent of their places to the open portal " +
            "and reserve the rest.",
          "Debo wrote on it with Yemi Johnson and Jennifer Anyanti on 27 July. The argument is " +
            "that the bribery and the pain of central posting are symptoms, and the structure " +
            "is the disease.",
          "<i>You trained the people this is happening to. If we have got any of it wrong, we " +
            "would genuinely rather hear it from you than from a policy officer.</i>",
        ],
        ctaText: "Read it in BusinessDay",
        ctaHref: ARTICLE_URL,
        primary: true,
      },
      {
        kicker: "A question, not an offer",
        heading: "What should we be doing with the people who have stepped back?",
        body: [
          "We do not have an answer yet, and we would rather admit that than send you a " +
            "programme we invented this morning. Between you, this group holds several " +
            "centuries of Nigerian clinical practice, and at the moment we do nothing with it " +
            "beyond keeping your record accurate.",
          "Teaching. Case review. Sitting on something that needs a grown-up in the room. " +
            "Writing. Being difficult about standards in a way only someone with nothing left " +
            "to prove can be. <b>Reply to this email and tell us which of those, if any, you " +
            "would want, and on what terms.</b> We will build toward what the replies say.",
        ],
      },
      {
        kicker: "One small thing",
        heading: "Your profile, if you want it accurate",
        body: [
          "The field for what you are open to covers case review and consulting, remote work " +
            "and short assignments. It is blank on almost every profile in this group, which " +
            "is fine if the answer is nothing, and a waste if it is not.",
        ],
        ctaText: "Update your profile",
        ctaHref: PROFILE_URL,
      },
    ],
    closing: [
      "Thank you for the years. That is not a sign-off, it is the point of the email.",
    ],
    signOff: "With respect,",
    signature: "Dr Debo Odulana",
    signatureRole:
      "Founding Partner, Consult for Africa. President, Doctors Foundation for Care.",
    footer:
      "You are receiving this because you claimed a CadreHealth profile and told us you have " +
      "stepped back from full-time practice. To stop receiving these, reply with the word " +
      "STOP and we will remove you the same day.",
  };
}

const BRIEFINGS: Record<string, (name: string) => Briefing> = {
  converted: briefing,
  claimed: briefing,
  warm: briefing,
  orphans: briefing,
  diaspora: diasporaBriefing,
  alumni: alumniBriefing,
};

function loadSent(): Set<string> {
  if (!existsSync(SENT_LOG)) return new Set();
  try {
    return new Set<string>(JSON.parse(readFileSync(SENT_LOG, "utf8")));
  } catch {
    return new Set();
  }
}

function saveSent(set: Set<string>) {
  mkdirSync(dirname(SENT_LOG), { recursive: true });
  writeFileSync(SENT_LOG, JSON.stringify([...set], null, 2));
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const { apply, cohort, limit, overrideTo, delay, preview } = flags();

  if (preview) {
    writeFileSync(preview, renderBriefing((BRIEFINGS[cohort] ?? briefing)("Dr Adeyemi")));
    console.log(`Preview written to ${preview}`);
    await prisma.$disconnect();
    return;
  }

  // Every cohort requires a claimed profile. DIASPORA_NETWORK and ALUMNI_NETWORK are
  // sibling statuses to CONVERTED, not subsets of it: app/api/cadre/practice-location
  // moves a record out of CONVERTED the moment someone declares their situation. Filtering
  // on CONVERTED alone silently drops the people who answered that question honestly.
  const WHERE = {
    converted: { outreachRecord: { status: "CONVERTED" as const } },
    diaspora: { passwordHash: { not: null }, outreachRecord: { status: "DIASPORA_NETWORK" as const } },
    alumni: { passwordHash: { not: null }, outreachRecord: { status: "ALUMNI_NETWORK" as const } },
    // Claimed a profile, but the outreach status never advanced to CONVERTED. A data gap,
    // not a segment: they get the standard briefing.
    orphans: {
      passwordHash: { not: null },
      NOT: { outreachRecord: { status: { in: ["CONVERTED", "DIASPORA_NETWORK", "ALUMNI_NETWORK"] as const } } },
    },
    warm: { passwordHash: { not: null }, lastLoginAt: { not: null } },
    claimed: { passwordHash: { not: null } },
  };
  const where = WHERE[cohort];
  const compose = BRIEFINGS[cohort];
  if (!where || !compose) throw new Error(`Unknown cohort ${cohort}. One of: ${Object.keys(WHERE).join(", ")}`);

  const all = await prisma.cadreProfessional.findMany({
    where,
    select: {
      id: true, email: true, firstName: true, lastName: true, cadre: true,
      state: true, profileCompleteness: true,
    },
    orderBy: { id: "asc" },
  });

  const suppressed = new Set(
    (
      await prisma.communicationSuppression.findMany({
        where: { OR: [{ channel: "EMAIL" }, { channel: null }] },
        select: { email: true },
      })
    ).map((s) => s.email.toLowerCase())
  );

  const sent = loadSent();
  const withEmail = all.filter((r) => r.email);
  const notSuppressed = withEmail.filter((r) => !suppressed.has(r.email.toLowerCase()));
  const eligible = notSuppressed.filter((r) => !sent.has(r.email.toLowerCase()));
  const queue = eligible.slice(0, limit ?? undefined);

  console.log(`Mode:        ${apply ? "APPLY (real sends via ZeptoMail)" : "DRY RUN (nothing sent)"}`);
  console.log(`Cohort:      ${cohort}`);
  console.log(`ZeptoMail:   ${process.env.ZEPTOMAIL_API_KEY ? "key present" : "KEY MISSING, sending will refuse"}`);
  console.log(`In cohort:   ${all.length}`);
  console.log(`Suppressed:  ${withEmail.length - notSuppressed.length}`);
  console.log(`Already sent:${notSuppressed.length - eligible.length}`);
  console.log(`Eligible:    ${eligible.length}`);
  console.log(`To send:     ${queue.length}${limit && eligible.length > queue.length ? `  (held back by --limit ${limit}: ${eligible.length - queue.length})` : ""}`);
  if (overrideTo) console.log(`Override to: ${overrideTo}  (sent-log not written, no recipient consumed)`);
  console.log();

  const noState = queue.filter((r) => !r.state).length;
  const avg = queue.length
    ? Math.round(queue.reduce((s, r) => s + r.profileCompleteness, 0) / queue.length)
    : 0;
  console.log(`Cohort profile health: ${noState} of ${queue.length} have no state recorded, average completeness ${avg}%`);
  console.log();

  if (!apply) {
    console.log("Sample:");
    for (const r of queue.slice(0, 8)) {
      console.log(`  ${address(r).padEnd(24)} <${r.email}>  ${r.state ?? "no state"}  ${r.profileCompleteness}%`);
    }
    console.log("\nDRY RUN. Re-run with --apply to send.");
    console.log(`Tip: --preview /tmp/briefing.html writes the email so you can look at it first.`);
    await prisma.$disconnect();
    return;
  }

  let ok = 0;
  let failed = 0;
  for (const r of queue) {
    const target = overrideTo ?? r.email;
    try {
      await sendBriefing(target, compose(address(r)));
      ok++;
      if (!overrideTo) {
        sent.add(r.email.toLowerCase());
        if (ok % 20 === 0) saveSent(sent);
      }
      console.log(`  ok   ${address(r)} -> ${target}`);
    } catch (err) {
      failed++;
      console.log(`  FAIL ${address(r)} -> ${target}: ${(err as Error).message}`);
      if ((err as Error).message.includes("ZEPTOMAIL_API_KEY")) break;
    }
    await sleep(delay);
  }
  saveSent(sent);
  console.log(`\nSent ${ok}, failed ${failed}.`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
