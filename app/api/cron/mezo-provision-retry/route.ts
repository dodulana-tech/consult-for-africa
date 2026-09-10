import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { provisionMezoDoctor, isMezoConfigured, publishableSpecialty } from "@/lib/mezo/provision";
import { emailMezoClaim } from "@/lib/cadreHealth/mezoClaimEmail";
import { surnameFor } from "@/lib/cadreSalutation";

/**
 * POST /api/cron/mezo-provision-retry
 *
 * Opens the Mezo places that could not be opened when the member answered.
 *
 * The survey commits answers before it calls Mezo, so a member whose handoff
 * failed still counts as answered and is told their place is being prepared.
 * Something has to make that true. This is it: it finds the rows stuck at
 * PENDING or FAILED, tries again, and emails whoever it gets through for.
 *
 * Without this the screen makes a promise nobody keeps, which is how the first
 * tester ended up waiting on an email that no code could send.
 *
 * Two separate jobs, deliberately: a place can be open while the email that
 * announces it has failed, so sending is keyed on claimEmailSentAt rather than
 * on having just provisioned. A run that provisions nothing still catches up
 * on unsent mail.
 */
export const POST = handler(async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isMezoConfigured()) {
    // Not an error. Until the environment is set there is nothing this can do,
    // and saying so plainly beats a run that reports zero and looks healthy.
    return Response.json({ skipped: "Mezo handoff is not configured" });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") || 50), 200);

  const stuck = await prisma.cadreMezoInterest.findMany({
    where: { mezoClaimUrl: null, mezoStatus: { in: ["PENDING", "FAILED"] } },
    orderBy: { createdAt: "asc" },
    take: limit,
    include: {
      professional: {
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          cadre: true,
          subSpecialty: true,
          state: true,
          isDiaspora: true,
          specialtyConfirmedAt: true,
          credentials: {
            where: { regulatoryBody: "MDCN" },
            select: { licenseNumber: true },
            take: 1,
          },
        },
      },
    },
  });

  let opened = 0;
  let stillFailing = 0;

  for (const row of stuck) {
    const p = row.professional;
    const result = await provisionMezoDoctor({
      externalId: p.id,
      email: p.email,
      firstName: cleanFirstName(p.firstName),
      lastName: surnameFor(p.lastName) ?? p.lastName,
      phone: p.phone,
      primarySpecialty: publishableSpecialty(p),
      subSpecialty: p.specialtyConfirmedAt ? p.subSpecialty : null,
      state: p.state,
      isDiaspora: p.isDiaspora,
      mdcnFolioNumber: p.credentials[0]?.licenseNumber ?? null,
    });

    await prisma.cadreMezoInterest.update({
      where: { id: row.id },
      data: {
        mezoStatus: result.status,
        mezoClaimUrl: result.claimUrl ?? null,
        mezoProvisionedAt: result.claimUrl ? new Date() : null,
        mezoError: result.reason ?? null,
      },
    });

    if (result.claimUrl) opened++;
    else {
      stillFailing++;
      console.error(`[mezo-retry] still failing for ${p.id}: ${result.reason}`);
    }
  }

  // Anyone whose place is open and who has not been told. Includes the rows
  // just provisioned, and any earlier one whose email failed on the day.
  const unannounced = await prisma.cadreMezoInterest.findMany({
    where: { mezoClaimUrl: { not: null }, claimEmailSentAt: null },
    take: limit,
    include: {
      professional: {
        select: { email: true, firstName: true, lastName: true, cadre: true },
      },
    },
  });

  let emailed = 0;
  for (const row of unannounced) {
    try {
      await emailMezoClaim({
        person: row.professional,
        claimUrl: row.mezoClaimUrl!,
        // They answered, were told to wait, and are only hearing now.
        delayed: true,
      });
      await prisma.cadreMezoInterest.update({
        where: { id: row.id },
        data: { claimEmailSentAt: new Date() },
      });
      emailed++;
    } catch (err) {
      // Left unstamped on purpose so the next run tries again.
      console.error(`[mezo-retry] claim email failed for ${row.professionalId}:`, err);
    }
  }

  return Response.json({ considered: stuck.length, opened, stillFailing, emailed });
});

function cleanFirstName(firstName: string): string {
  return firstName.replace(/^\s*(dr|prof|professor|mr|mrs|ms|miss)\.?\s+/i, "").trim() || firstName;
}
