/**
 * Tell the doctors who wrote in that their record is corrected.
 *
 * Four wrote in within days of the May re-engagement send, each to say the
 * specialty on their record was not theirs. One put it plainly: "So I can't
 * claim this profile as mine." A wrong specialty is not cosmetic to a
 * consultant, it is a reason to walk away from the whole thing.
 *
 * Sent one at a time through ZeptoMail, never Zoho, which throttles batches.
 * Each is logged to Communication so a second run can be seen for what it is.
 */
import { PrismaClient } from "@prisma/client";
import { sendCadreEmail } from "@/lib/cadreEmail";
import { headingFor, surnameFor } from "@/lib/cadreSalutation";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

// Dr Ugoji received his on the first run, before a missing loggedById on the
// Communication write stopped the script. Sending is the irreversible half,
// so he is excluded here rather than risk a duplicate; his log row is
// backfilled below.
const ALREADY_SENT = new Set(["healthylifestyle2ugoji@gmail.com"]);

const RECIPIENTS = [
  "healthylifestyle2ugoji@gmail.com",
  "rotelbraimoh1234@gmail.com",
  "prelador@gmail.com",
];

function body(specialty: string): string {
  return (
    `Thank you for telling us. Your record now reads ${specialty}, and you can go ahead and claim it.\n\n` +
    "The specialty came from a public register and you are not the only person it had under the wrong one. " +
    "Three of you wrote to us this week, which is three too many, so we are changing the claim page. It will " +
    "show what the record says, name where it came from, and let you correct it yourself before you set a " +
    "password, rather than write to us and wait.\n\n" +
    "Nothing else on your record was altered."
  );
}

async function main() {
  if (APPLY && !process.env.ZEPTOMAIL_API_KEY) {
    throw new Error("ZEPTOMAIL_API_KEY is required. Refusing to fall back to SMTP for this send.");
  }

  const loggedBy = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true },
  });
  if (!loggedBy) throw new Error("No admin user to attribute the log to");

  for (const email of RECIPIENTS) {
    const p = await prisma.cadreProfessional.findUnique({
      where: { email },
      select: { id: true, email: true, firstName: true, lastName: true, cadre: true,
        subSpecialty: true, specialtyConfirmedAt: true },
    });
    if (!p) { console.log(`SKIP  ${email} not found`); continue; }
    if (!p.subSpecialty) { console.log(`SKIP  ${email} has no specialty to confirm`); continue; }

    const heading = headingFor(p, "your record is corrected");
    console.log(`\n--- ${email} (Dr ${surnameFor(p.lastName)}) ---`);
    console.log(`Subject: Your CadreHealth record, corrected`);
    console.log(`Heading: ${heading}`);
    console.log(body(p.subSpecialty));

    if (!APPLY) continue;

    const alreadySent = ALREADY_SENT.has(email);

    // They told us themselves, so it is confirmed in the only sense that
    // matters even though it arrived by email rather than through the form.
    if (!p.specialtyConfirmedAt) {
      await prisma.cadreProfessional.update({
        where: { id: p.id }, data: { specialtyConfirmedAt: new Date() },
      });
    }

    if (alreadySent) {
      console.log("ALREADY SENT on a previous run, logging only");
    } else {
      await sendCadreEmail({
        to: p.email,
          subject: "Your CadreHealth record, corrected",
        heading,
          body: body(p.subSpecialty),
        ctaText: "Claim your profile",
        ctaHref: `${process.env.NEXTAUTH_URL ?? "https://www.consultforafrica.com"}/oncadre/claim/${p.id}`,
        footer: "Reply to this email if anything else on the record is not right.",
      });
      console.log("SENT");
    }

    // Never let a bookkeeping failure stop the next person being written to.
    // That is exactly what happened on the first run.
    try {
      await prisma.communication.create({
        data: {
          subjectType: "CADRE_PROFESSIONAL",
          cadreProfessionalId: p.id,
          type: "EMAIL",
          direction: "OUTBOUND",
          status: "SENT",
          subject: "Your CadreHealth record, corrected",
          body: body(p.subSpecialty),
          toEmails: [p.email],
          fromEmail: process.env.SMTP_FROM ?? "hello@consultforafrica.com",
          sentAt: new Date(),
          occurredAt: new Date(),
          tags: ["specialty-correction"],
          loggedById: loggedBy.id,
        },
      });
      console.log("logged");
    } catch (err) {
      console.error("log write failed (email already sent):", err instanceof Error ? err.message.slice(0, 160) : err);
    }
  }
}
main().finally(() => prisma.$disconnect());
