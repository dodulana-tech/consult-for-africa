/**
 * Erase one data subject from CadreHealth on a right-to-erasure request.
 *
 * Nigeria Data Protection Act 2023, section 34. The NDPA supersedes the NDPR:
 * cite the Act, not the old regulation.
 *
 * What it does
 *   Finds the CadreProfessional by email, counts every row that hangs off them
 *   across the whole schema, prints the count table, and on --apply deletes the
 *   lot inside a single transaction so it is all-or-nothing.
 *
 * The suppression tension, and how this resolves it
 *   Erase every trace and the next bulk import puts them straight back. The NMA
 *   batch loaded 5,712 records in May 2026 and more lists are coming; none of the
 *   import scripts consult a suppression list, they dedupe on the unique email
 *   constraint alone. So a clean erasure today means we email them again in a
 *   month, breaching the very request we are honouring.
 *
 *   The fix is the standard one: erase the personal data, keep one minimal
 *   suppression row so the erasure can be enforced. CommunicationSuppression
 *   already exists and every sender checks it (lib/cadreHealth/outreachSender.ts,
 *   lib/cadreWeeklyDigest.ts, lib/communications-send.ts, the unsubscribe route,
 *   the ZeptoMail bounce webhook, the outreach-followup cron, send-cadre-briefing,
 *   send-mezo-claim-invites, send-to-list, send-reengagement-emails).
 *
 *   READ THIS: every one of those call sites looks the address up by plain
 *   equality on the lowercased raw email. A hashed suppression entry would match
 *   nothing and the protection would be silently worthless. So the suppression
 *   row keeps the raw address. That is a deliberate, narrow retention and it is
 *   the founder's call, not this script's. --no-suppress removes it and takes the
 *   re-import risk instead.
 *
 * Usage
 *   npx tsx --env-file=.env.local scripts/erase-cadre-professional.ts --email x@y.com
 *   npx tsx --env-file=.env.local scripts/erase-cadre-professional.ts --email x@y.com --apply
 *   npx tsx --env-file=.env.local scripts/erase-cadre-professional.ts --email x@y.com --apply --no-suppress
 *
 * Nothing is written without --apply. The audit line in scripts/out/erasures.jsonl
 * records that an erasure happened and carries no personal data beyond a SHA-256
 * of the address, so the log itself never becomes a new copy of what we deleted.
 */
import { createHash } from "crypto";
import { appendFileSync, existsSync, mkdirSync } from "fs";
import { dirname, resolve } from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const AUDIT_LOG = resolve(__dirname, "out/erasures.jsonl");

function flags() {
  const a = process.argv.slice(2);
  const get = (f: string) => {
    const i = a.indexOf(f);
    return i >= 0 ? a[i + 1] : null;
  };
  return {
    email: (get("--email") ?? "").trim().toLowerCase(),
    apply: a.includes("--apply"),
    suppress: !a.includes("--no-suppress"),
    reason: get("--reason") ?? "NDPA 2023 s.34 erasure request",
    actor: get("--actor") ?? process.env.USER ?? "unknown",
  };
}

function hash(email: string): string {
  return createHash("sha256").update(email).digest("hex");
}

type Counts = Record<string, number>;

/** Everything that references the professional, plus everything keyed on the raw address. */
async function survey(id: string | null, email: string) {
  const byId = id ? { professionalId: id } : null;
  const c: Counts = {};
  const set = async (k: string, fn: () => Promise<number>) => {
    c[k] = await fn();
  };

  if (byId) {
    // ── Owned by the professional, cascade on delete ──
    await set("CadreCredential", () => prisma.cadreCredential.count({ where: byId }));
    await set("CadreQualification", () => prisma.cadreQualification.count({ where: byId }));
    await set("CadreCPDEntry", () => prisma.cadreCPDEntry.count({ where: byId }));
    await set("CadreWorkHistory", () => prisma.cadreWorkHistory.count({ where: byId }));
    await set("CadreOutreachRecord", () => prisma.cadreOutreachRecord.count({ where: byId }));
    await set("CadreWhatsAppMessage", () => prisma.cadreWhatsAppMessage.count({ where: byId }));
    await set("CadreCareerReport", () => prisma.cadreCareerReport.count({ where: byId }));
    await set("CadreAdvisorMessage", () => prisma.cadreAdvisorMessage.count({ where: byId }));
    await set("CadreNotification", () => prisma.cadreNotification.count({ where: byId }));
    await set("CadreSubscription", () => prisma.cadreSubscription.count({ where: byId }));
    await set("CadreMentorProfile", () => prisma.cadreMentorProfile.count({ where: byId }));

    // ── Referenced but NOT cascaded: these block the parent delete ──
    await set("CadreFacilityReview", () => prisma.cadreFacilityReview.count({ where: byId }));
    await set("CadreSalaryReport", () => prisma.cadreSalaryReport.count({ where: byId }));
    await set("CadreReadinessAssessment", () => prisma.cadreReadinessAssessment.count({ where: byId }));
    await set("CadreMandateMatch", () => prisma.cadreMandateMatch.count({ where: byId }));
    await set("CadreFacilityReferral", () => prisma.cadreFacilityReferral.count({ where: { referredById: id } }));
    await set("CadreMentorship (as mentee)", () => prisma.cadreMentorship.count({ where: { menteeId: id } }));
    await set("CadreCoachingSession (as mentee)", () => prisma.cadreCoachingSession.count({ where: { menteeId: id } }));

    // ── Hanging off their mentor profile, if they mentor ──
    const mentorProfiles = await prisma.cadreMentorProfile.findMany({ where: byId, select: { id: true } });
    const mpIds = mentorProfiles.map((m) => m.id);
    await set("CadreMentorship (as mentor)", () =>
      mpIds.length ? prisma.cadreMentorship.count({ where: { mentorProfileId: { in: mpIds } } }) : Promise.resolve(0),
    );
    await set("CadreCoachingSession (as mentor)", () =>
      mpIds.length ? prisma.cadreCoachingSession.count({ where: { mentorProfileId: { in: mpIds } } }) : Promise.resolve(0),
    );

    // ── Denormalised string references, no FK, invisible to a cascade ──
    await set("CadreMentorshipMessage (senderId)", () => prisma.cadreMentorshipMessage.count({ where: { senderId: id } }));
    await set("CadreMandate.placedConsultantId -> null", () => prisma.cadreMandate.count({ where: { placedConsultantId: id } }));
    await set("CadreProfessional.referredById -> null", () => prisma.cadreProfessional.count({ where: { referredById: id } }));

    // ── Communications CRM ──
    await set("Communication (subject)", () => prisma.communication.count({ where: { cadreProfessionalId: id } }));
    await set("CommunicationParticipant (linked)", () => prisma.communicationParticipant.count({ where: { cadreProfessionalId: id } }));
  }

  // ── Keyed on the raw address, no link to the professional row at all ──
  const eq = { equals: email, mode: "insensitive" as const };
  await set("CommunicationParticipant (externalEmail)", () => prisma.communicationParticipant.count({ where: { externalEmail: eq } }));
  await set("Communication.prospectEmail -> null", () => prisma.communication.count({ where: { prospectEmail: eq } }));
  await set("Communication to/cc/bcc arrays -> pruned", () =>
    prisma.communication.count({ where: { OR: [{ toEmails: { has: email } }, { ccEmails: { has: email } }, { bccEmails: { has: email } }] } }),
  );
  await set("CadreNewsletterSubscriber", () => prisma.cadreNewsletterSubscriber.count({ where: { email: eq } }));
  await set("OutreachTarget", () => prisma.outreachTarget.count({ where: { email: eq } }));
  await set("CadreReadinessAssessment (captureEmail)", () => prisma.cadreReadinessAssessment.count({ where: { captureEmail: eq } }));
  await set("MediparkSurveyResponse contact cols -> null", () => prisma.mediparkSurveyResponse.count({ where: { email: eq } }));
  await set("CommunicationSuppression (existing)", () => prisma.communicationSuppression.count({ where: { email: eq } }));

  return c;
}

async function main() {
  const { email, apply, suppress, reason, actor } = flags();
  if (!email) {
    console.error("Missing --email. Usage: --email someone@example.com [--apply] [--no-suppress]");
    process.exit(1);
  }

  console.log(apply ? "Mode: APPLY (rows will be deleted)" : "Mode: DRY RUN (nothing written)");
  console.log(`Subject:     ${email}`);
  console.log(`Suppression: ${suppress ? "KEEP a suppression row (raw address retained on purpose)" : "NO suppression row, full erasure"}`);
  console.log(`Basis:       ${reason}`);
  console.log(`Actor:       ${actor}\n`);

  const pro = await prisma.cadreProfessional.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true, email: true, firstName: true, lastName: true, cadre: true, accountStatus: true, createdAt: true },
  });

  if (!pro) {
    console.log("No CadreProfessional holds this address.");
  } else {
    console.log(`Found CadreProfessional ${pro.id}`);
    console.log(`  ${pro.firstName} ${pro.lastName}  ${pro.cadre}  ${pro.accountStatus}  created ${pro.createdAt.toISOString().slice(0, 10)}`);
  }

  const counts = await survey(pro?.id ?? null, email);
  const rows = Object.entries(counts);
  const hit = rows.filter(([, n]) => n > 0);
  const width = Math.max(...rows.map(([k]) => k.length));

  console.log("\nRows found");
  if (!hit.length) console.log("  (none)");
  for (const [k, n] of hit) console.log(`  ${k.padEnd(width)}  ${String(n).padStart(4)}`);
  const total = hit.reduce((a, [, n]) => a + n, 0) + (pro ? 1 : 0);
  console.log(`  ${"CadreProfessional".padEnd(width)}  ${String(pro ? 1 : 0).padStart(4)}`);
  console.log(`  ${"".padEnd(width)}  ${"----".padStart(4)}`);
  console.log(`  ${"total".padEnd(width)}  ${String(total).padStart(4)}`);

  // Aggregates are cached on the facility row. Deleting a review or a salary
  // report leaves those numbers stale, and no cascade fixes it.
  if (pro && (counts["CadreFacilityReview"] > 0 || counts["CadreSalaryReport"] > 0)) {
    const facilities = new Set<string>();
    for (const r of await prisma.cadreFacilityReview.findMany({ where: { professionalId: pro.id }, select: { facilityId: true } })) {
      if (r.facilityId) facilities.add(r.facilityId);
    }
    for (const r of await prisma.cadreSalaryReport.findMany({ where: { professionalId: pro.id }, select: { facilityId: true } })) {
      if (r.facilityId) facilities.add(r.facilityId);
    }
    console.log("\nWARNING: cached aggregates on CadreFacility will be stale after this erasure.");
    console.log(`  Recompute totalReviews and the rating columns for: ${[...facilities].join(", ") || "(no facility linked)"}`);
  }

  if (!apply) {
    console.log("\nDry run. Re-run with --apply to commit. Nothing has been written.");
    return;
  }

  const mentorProfiles = pro
    ? (await prisma.cadreMentorProfile.findMany({ where: { professionalId: pro.id }, select: { id: true } })).map((m) => m.id)
    : [];

  // Array columns need a read-modify-write; do it before the transaction opens
  // so the transaction stays short.
  const arrayComms = await prisma.communication.findMany({
    where: { OR: [{ toEmails: { has: email } }, { ccEmails: { has: email } }, { bccEmails: { has: email } }] },
    select: { id: true, toEmails: true, ccEmails: true, bccEmails: true },
  });

  await prisma.$transaction(async (tx) => {
    const eq = { equals: email, mode: "insensitive" as const };

    if (pro) {
      const id = pro.id;

      // Deepest first. Mentorship messages carry a bare senderId with no FK,
      // so nothing else would ever reach them.
      await tx.cadreMentorshipMessage.deleteMany({ where: { senderId: id } });
      if (mentorProfiles.length) {
        await tx.cadreCoachingSession.deleteMany({ where: { mentorProfileId: { in: mentorProfiles } } });
        await tx.cadreMentorship.deleteMany({ where: { mentorProfileId: { in: mentorProfiles } } });
      }
      await tx.cadreCoachingSession.deleteMany({ where: { menteeId: id } });
      await tx.cadreMentorship.deleteMany({ where: { menteeId: id } });
      await tx.cadreMentorProfile.deleteMany({ where: { professionalId: id } });

      await tx.cadreFacilityReview.deleteMany({ where: { professionalId: id } });
      await tx.cadreSalaryReport.deleteMany({ where: { professionalId: id } });
      await tx.cadreReadinessAssessment.deleteMany({ where: { professionalId: id } });
      await tx.cadreMandateMatch.deleteMany({ where: { professionalId: id } });
      await tx.cadreFacilityReferral.deleteMany({ where: { referredById: id } });

      await tx.cadreCredential.deleteMany({ where: { professionalId: id } });
      await tx.cadreQualification.deleteMany({ where: { professionalId: id } });
      await tx.cadreCPDEntry.deleteMany({ where: { professionalId: id } });
      await tx.cadreWorkHistory.deleteMany({ where: { professionalId: id } });
      await tx.cadreCareerReport.deleteMany({ where: { professionalId: id } });
      await tx.cadreAdvisorMessage.deleteMany({ where: { professionalId: id } });
      await tx.cadreNotification.deleteMany({ where: { professionalId: id } });
      await tx.cadreSubscription.deleteMany({ where: { professionalId: id } });
      await tx.cadreWhatsAppMessage.deleteMany({ where: { professionalId: id } });
      await tx.cadreOutreachRecord.deleteMany({ where: { professionalId: id } });

      await tx.communicationParticipant.deleteMany({ where: { cadreProfessionalId: id } });
      await tx.communication.deleteMany({ where: { cadreProfessionalId: id } });

      // Other people's rows that point at this id. Never delete these: they
      // belong to different data subjects. Cut the link instead.
      await tx.cadreProfessional.updateMany({ where: { referredById: id }, data: { referredById: null } });
      await tx.cadreMandate.updateMany({ where: { placedConsultantId: id }, data: { placedConsultantId: null } });

      await tx.cadreProfessional.delete({ where: { id } });
    }

    // Raw-address rows with no link to the professional.
    await tx.communicationParticipant.deleteMany({ where: { externalEmail: eq } });
    await tx.communication.updateMany({
      where: { prospectEmail: eq },
      data: { prospectEmail: null, prospectName: null, prospectPhone: null },
    });
    for (const c of arrayComms) {
      const drop = (xs: string[]) => xs.filter((x) => x.toLowerCase() !== email);
      await tx.communication.update({
        where: { id: c.id },
        data: { toEmails: drop(c.toEmails), ccEmails: drop(c.ccEmails), bccEmails: drop(c.bccEmails) },
      });
    }
    await tx.cadreNewsletterSubscriber.deleteMany({ where: { email: eq } });
    await tx.outreachTarget.deleteMany({ where: { email: eq } });
    await tx.cadreReadinessAssessment.deleteMany({ where: { captureEmail: eq } });
    // The survey model keeps contact details in their own columns precisely so
    // an erasure can null them without destroying the anonymous research answers.
    await tx.mediparkSurveyResponse.updateMany({
      where: { email: eq },
      data: { email: null, name: null, phone: null, specialty: null, contactChoice: "none" },
    });

    if (suppress) {
      await tx.communicationSuppression.upsert({
        where: { email_channel: { email, channel: "EMAIL" } },
        update: { reason: "OPTED_OUT", notes: "Erasure request honoured. Retained solely to enforce it." },
        create: {
          email,
          channel: "EMAIL",
          reason: "OPTED_OUT",
          notes: "Erasure request honoured. Retained solely to enforce it.",
        },
      });
    } else {
      await tx.communicationSuppression.deleteMany({ where: { email: eq } });
    }
  });

  const line = {
    at: new Date().toISOString(),
    actor,
    reason,
    subjectSha256: hash(email),
    professionalFound: !!pro,
    suppressionRetained: suppress,
    counts: Object.fromEntries(hit),
    rowsRemoved: total,
  };
  if (!existsSync(dirname(AUDIT_LOG))) mkdirSync(dirname(AUDIT_LOG), { recursive: true });
  appendFileSync(AUDIT_LOG, JSON.stringify(line) + "\n");

  console.log(`\nErased. ${total} rows removed.`);
  console.log(`Audit line appended to ${AUDIT_LOG} (SHA-256 of the address, no personal data).`);
  if (suppress) {
    console.log("A CommunicationSuppression row keeps the raw address so no sender or re-import can reach them again.");
  } else {
    console.log("WARNING: no suppression row. A future bulk import can recreate this record and we will email them again.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
