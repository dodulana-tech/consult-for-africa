import { NextRequest, NextResponse } from "next/server";
import { getCadreSession } from "@/lib/cadreAuth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { validateMezoSurvey, MEZO_SUMMARY_FIELDS } from "@/lib/cadreHealth/mezoSurvey";
import { provisionMezoDoctor, isMezoConfigured, publishableSpecialty } from "@/lib/mezo/provision";
import { surnameFor } from "@/lib/cadreSalutation";
import { emailMezoClaim } from "@/lib/cadreHealth/mezoClaimEmail";

/**
 * Mezo runs on the MDCN register, so a place can only be opened for someone
 * MDCN could plausibly hold. That is almost everyone here (10,178 of 10,226
 * records) but it is not everyone, and offering a nurse a doctor's account
 * would be a worse experience than not offering it.
 */
const MEZO_CADRES = new Set(["MEDICINE", "DENTISTRY"]);

/**
 * GET /api/cadre/mezo/survey
 * Whether this member is eligible, has answered, and what their place is.
 */
export const GET = handler(async function GET() {
  const session = await getCadreSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const professional = await prisma.cadreProfessional.findUnique({
    where: { id: session.sub },
    select: { cadre: true, mezoInterest: true },
  });
  if (!professional) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  return NextResponse.json({
    eligible: MEZO_CADRES.has(professional.cadre),
    answered: !!professional.mezoInterest,
    mezoStatus: professional.mezoInterest?.mezoStatus ?? null,
    claimUrl: professional.mezoInterest?.mezoClaimUrl ?? null,
  });
});

/**
 * POST /api/cadre/mezo/survey
 *
 * Records the answers, then opens the Mezo place. In that order and never the
 * other way round: the answers are the thing we cannot recreate, so they are
 * committed before anything that depends on a third party. If Mezo is down the
 * member still counts as answered, the failure is stored against their row,
 * and the place can be opened later without asking them anything again.
 */
export const POST = handler(async function POST(req: NextRequest) {
  const session = await getCadreSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const professional = await prisma.cadreProfessional.findUnique({
    where: { id: session.sub },
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
  });
  if (!professional) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  if (!MEZO_CADRES.has(professional.cadre)) {
    return NextResponse.json(
      { error: "Mezo places are open to doctors and dentists on the MDCN register." },
      { status: 403 },
    );
  }

  const body = await req.json().catch(() => null);
  const { ok, errors, clean } = validateMezoSurvey(body);
  if (!ok) {
    return NextResponse.json({ error: errors[0], errors }, { status: 400 });
  }

  // Lift the headline answers into columns so the admin view can read the
  // shape of the demand without unpacking JSON for every row.
  const summary: Record<string, string | undefined> = {};
  for (const field of MEZO_SUMMARY_FIELDS) {
    const value = clean[field];
    summary[field] = typeof value === "string" ? value : undefined;
  }

  const interest = await prisma.cadreMezoInterest.upsert({
    where: { professionalId: professional.id },
    create: {
      professionalId: professional.id,
      payload: clean,
      ...summary,
      teleconsultInterest: clean.teleconsult === "both" || clean.teleconsult === "remote_only",
    },
    update: {
      payload: clean,
      ...summary,
      teleconsultInterest: clean.teleconsult === "both" || clean.teleconsult === "remote_only",
    },
  });

  // A retake by someone whose place is already open should not disturb it.
  if (interest.mezoClaimUrl && interest.mezoStatus !== "FAILED") {
    return NextResponse.json({ claimUrl: interest.mezoClaimUrl, mezoStatus: interest.mezoStatus });
  }

  if (!isMezoConfigured()) {
    await prisma.cadreMezoInterest.update({
      where: { id: interest.id },
      data: { mezoStatus: "PENDING", mezoError: "Mezo handoff is not configured" },
    });
    return NextResponse.json({ claimUrl: null, mezoStatus: "PENDING" });
  }

  const result = await provisionMezoDoctor({
    externalId: professional.id,
    email: professional.email,
    firstName: cleanFirstName(professional.firstName),
    lastName: surnameFor(professional.lastName) ?? professional.lastName,
    phone: professional.phone,
    primarySpecialty: publishableSpecialty(professional),
    subSpecialty: professional.specialtyConfirmedAt ? professional.subSpecialty : null,
    state: professional.state,
    isDiaspora: professional.isDiaspora,
    mdcnFolioNumber: professional.credentials[0]?.licenseNumber ?? null,
  });

  await prisma.cadreMezoInterest.update({
    where: { id: interest.id },
    data: {
      mezoStatus: result.status,
      mezoClaimUrl: result.claimUrl ?? null,
      mezoProvisionedAt: result.claimUrl ? new Date() : null,
      mezoError: result.reason ?? null,
    },
  });

  if (result.claimUrl) {
    // They can see the link on the page already. This is the copy they can
    // find again next week, and the stamp keeps a later retry from sending a
    // second one. Fire and forget: the place is open either way, and failing
    // the request over an email would hide a success behind an error.
    emailMezoClaim({ person: professional, claimUrl: result.claimUrl, delayed: false })
      .then(() =>
        prisma.cadreMezoInterest.update({
          where: { id: interest.id },
          data: { claimEmailSentAt: new Date() },
        }),
      )
      .catch((err) => {
        console.error(`[mezo] claim email failed for ${professional.id}:`, err);
      });
  }

  if (result.status === "FAILED") {
    console.error(`[mezo] provisioning failed for ${professional.id}: ${result.reason}`);
    // The answers are safe, so this is a soft failure: the member is told we
    // will come back to them rather than being asked to fill the form again.
    return NextResponse.json({ claimUrl: null, mezoStatus: "FAILED" });
  }

  return NextResponse.json({ claimUrl: result.claimUrl, mezoStatus: result.status });
});

/**
 * The register import put titles in the first name field, so "Dr Francis"
 * is a common value. Mezo wants a name that can be matched against MDCN.
 */
function cleanFirstName(firstName: string): string {
  return firstName.replace(/^\s*(dr|prof|professor|mr|mrs|ms|miss)\.?\s+/i, "").trim() || firstName;
}

