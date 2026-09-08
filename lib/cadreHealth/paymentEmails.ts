/**
 * Telling a CadreHealth member their money arrived.
 *
 * Client invoices and training purchases have always sent a receipt; the two
 * things a professional can pay for did not, so the first person ever to buy a
 * Pro subscription paid and heard nothing back. These close that gap.
 *
 * Both are receipts as well as welcomes: the amount and the reference are on
 * the page, because a doctor who has paid should be able to find the proof
 * without asking. The Pro note says plainly that nothing renews automatically,
 * which is true of the one-off charge we actually take and is better said than
 * discovered.
 */
import { sendCadreEmail } from "@/lib/cadreEmail";
import { headingFor } from "@/lib/cadreSalutation";

interface Person {
  email: string;
  firstName: string;
  lastName: string | null;
  cadre: string | null;
}

function baseUrl(): string {
  return (process.env.NEXTAUTH_URL ?? "https://www.consultforafrica.com").replace(/\/$/, "");
}

/** Naira, from the kobo figure Paystack charged. */
function naira(kobo: number): string {
  return `N${(kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function onDate(date: Date): string {
  return date.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
}

export async function emailCadreProWelcome({
  person,
  amountKobo,
  reference,
  periodStart,
  periodEnd,
}: {
  person: Person;
  amountKobo: number;
  reference: string;
  periodStart: Date;
  periodEnd: Date;
}) {
  await sendCadreEmail({
    to: person.email,
    subject: "Your CadreHealth Pro month is open",
    heading: headingFor(person, "your Pro month is open"),
    body:
      "Your payment has come through, so the limit on the career advisor is lifted. " +
      "Ask it as much as you like, and you can now book a session with any mentor on the register.",
    details: [
      { label: "Plan", value: "CadreHealth Pro" },
      { label: "Amount paid", value: naira(amountKobo) },
      { label: "Covers", value: `${onDate(periodStart)} to ${onDate(periodEnd)}` },
      { label: "Reference", value: reference },
    ],
    ctaText: "Open the career advisor",
    ctaHref: `${baseUrl()}/oncadre/advisor`,
    footer:
      "This is a single month and nothing will be charged to you automatically. " +
      "We will write to you before it ends. Reply to this email if anything is not working.",
  });
}

export async function emailCadreCoachingBooked({
  person,
  mentorName,
  topic,
  amountKobo,
  reference,
  durationMinutes,
}: {
  person: Person;
  mentorName: string;
  topic: string;
  amountKobo: number;
  reference: string;
  durationMinutes: number;
}) {
  await sendCadreEmail({
    to: person.email,
    subject: "Your coaching session is booked",
    heading: headingFor(person, "your session is booked"),
    body:
      `Your payment has come through and ${mentorName} has been told. ` +
      "They will be in touch to agree a time that suits you both.",
    details: [
      { label: "With", value: mentorName },
      { label: "Topic", value: topic },
      { label: "Length", value: `${durationMinutes} minutes` },
      { label: "Amount paid", value: naira(amountKobo) },
      { label: "Reference", value: reference },
    ],
    ctaText: "See your sessions",
    ctaHref: `${baseUrl()}/oncadre/mentorship/my`,
    footer: "Reply to this email if you need to move the session or something is not right.",
  });
}
