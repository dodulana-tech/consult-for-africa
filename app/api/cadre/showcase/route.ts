/**
 * Showcase consent.
 *
 * The digest features one member a week by name, specialty and place of work.
 * Nothing runs without an explicit yes, and the yes is withdrawable in one tap,
 * which is also what SHOWCASE_CONSENT week asks for.
 *
 * showcaseOptInAt is stamped on every fresh yes because the award allocation
 * counts a consent given in the last seven days as that week's contribution.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCadreSession } from "@/lib/cadreAuth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";

export const GET = handler(async function GET() {
  const session = await getCadreSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const professional = await prisma.cadreProfessional.findUnique({
    where: { id: session.sub },
    select: {
      showcaseOptIn: true,
      showcaseOptInAt: true,
      featuredAt: true,
      subSpecialty: true,
      currentFacility: true,
      state: true,
    },
  });

  if (!professional) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(professional);
});

export const PATCH = handler(async function PATCH(req: NextRequest) {
  const session = await getCadreSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const optIn: unknown = body?.showcaseOptIn;
  if (typeof optIn !== "boolean") {
    return NextResponse.json({ error: "showcaseOptIn must be true or false" }, { status: 400 });
  }

  const updated = await prisma.cadreProfessional.update({
    where: { id: session.sub },
    data: {
      showcaseOptIn: optIn,
      // Withdrawing keeps the date of the consent that was withdrawn rather
      // than clearing it, so there is a record of what was agreed and when.
      ...(optIn ? { showcaseOptInAt: new Date() } : {}),
    },
    select: { showcaseOptIn: true, showcaseOptInAt: true },
  });

  return NextResponse.json(updated);
});
