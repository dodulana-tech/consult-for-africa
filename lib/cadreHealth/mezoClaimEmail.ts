/**
 * Sending a member the link to the Mezo place they earned.
 *
 * Two paths reach this. On the ordinary one the member finishes the survey,
 * the handoff succeeds, and the link is already on their screen; the email is
 * the copy they can find again next week. On the other, the handoff was down
 * or unconfigured when they answered, the retry opened the place later, and
 * this email is the only way they learn it is ready.
 *
 * The second path is the reason the screen is allowed to promise an email at
 * all. It promised one before this existed.
 */
import { sendCadreEmail } from "@/lib/cadreEmail";
import { headingFor } from "@/lib/cadreSalutation";

interface Person {
  email: string;
  firstName: string;
  lastName: string | null;
  cadre: string | null;
}

export async function emailMezoClaim({
  person,
  claimUrl,
  delayed,
}: {
  person: Person;
  claimUrl: string;
  /** True when the place was opened after the fact, so they were kept waiting. */
  delayed: boolean;
}) {
  await sendCadreEmail({
    to: person.email,
    subject: "Your Mezo place is open",
    heading: headingFor(person, "your Mezo place is open"),
    body: delayed
      ? "Thank you for your patience. Your answers went to the people deciding where the first rooms open and what they cost, and your place on Mezo is now ready. Set a password and it is yours."
      : "Your place on Mezo is ready, and this is the link to it so you can find it again whenever you want. Set a password and it is yours.",
    ctaText: "Open your Mezo account",
    ctaHref: claimUrl,
    footer:
      "Mezo will ask for your MDCN folio number and your indemnity cover before you can take bookings. " +
      "Nothing is charged to set the account up, and the link is good for 30 days.",
  });
}
