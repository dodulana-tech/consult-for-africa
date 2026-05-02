/**
 * POST /api/cadre/practice-location
 *
 * Called from the post-claim segmentation page. Records the doctor's
 * self-declared situation (in Nigeria / diaspora / stepped back) and routes
 * the outreach record into the matching engagement track.
 *
 * IN_NIGERIA   -> outreach status stays CONVERTED (or whatever it was)
 * DIASPORA     -> outreach status moves to DIASPORA_NETWORK
 * STEPPED_BACK -> outreach status moves to ALUMNI_NETWORK
 *
 * The status change is intentional: a diaspora pro who claimed is now an
 * active diaspora-track engagement, not just a generic "converted" lead.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCadreSession } from "@/lib/cadreAuth";
import { handler } from "@/lib/api-handler";
import type { CadrePracticeLocation, CadreOutreachStatus } from "@prisma/client";

const VALID_LOCATIONS: CadrePracticeLocation[] = ["IN_NIGERIA", "DIASPORA", "STEPPED_BACK"];

function statusForLocation(location: CadrePracticeLocation): CadreOutreachStatus | null {
  if (location === "DIASPORA") return "DIASPORA_NETWORK";
  if (location === "STEPPED_BACK") return "ALUMNI_NETWORK";
  return null; // IN_NIGERIA leaves the existing status alone (usually CONVERTED).
}

function nextDestination(location: CadrePracticeLocation): string {
  // For now everyone lands on the dashboard; segment-specific welcome pages
  // can replace these once the per-segment products are ready.
  if (location === "DIASPORA") return "/oncadre/dashboard?welcome=diaspora";
  if (location === "STEPPED_BACK") return "/oncadre/dashboard?welcome=alumni";
  return "/oncadre/dashboard?welcome=ng";
}

export const POST = handler(async function POST(req: NextRequest) {
  const session = await getCadreSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const professionalId = body.professionalId as string | undefined;
  const location = body.location as CadrePracticeLocation | undefined;

  if (!professionalId || professionalId !== session.sub) {
    return NextResponse.json({ error: "Mismatched professional" }, { status: 403 });
  }
  if (!location || !VALID_LOCATIONS.includes(location)) {
    return NextResponse.json({ error: "Invalid location selection" }, { status: 400 });
  }

  const now = new Date();

  await prisma.cadreProfessional.update({
    where: { id: professionalId },
    data: {
      practiceLocation: location,
      practiceLocationSetAt: now,
    },
  });

  // Move the outreach record into the matching engagement track if applicable.
  const newStatus = statusForLocation(location);
  if (newStatus) {
    const outreach = await prisma.cadreOutreachRecord.findUnique({
      where: { professionalId },
      select: { id: true },
    });
    if (outreach) {
      await prisma.cadreOutreachRecord.update({
        where: { id: outreach.id },
        data: { status: newStatus, lastContactedAt: now },
      });
    }
  }

  return NextResponse.json({ ok: true, next: nextDestination(location) });
});
