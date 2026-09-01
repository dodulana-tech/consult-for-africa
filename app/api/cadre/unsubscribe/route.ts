/**
 * POST /api/cadre/unsubscribe
 *
 * Honours the unsubscribe link at the foot of every CadreHealth outreach
 * email. Public and unauthenticated by necessity: the recipient has no
 * account, that being the whole point of the outreach.
 *
 * Body: { id }  -- the CadreProfessional id already embedded in the link
 *   -> { ok, email }
 *
 * Writes CommunicationSuppression (OPTED_OUT) so every sender skips them, and
 * sets the outreach record to NOT_INTERESTED so the funnel stops counting
 * them as a live prospect.
 *
 * The id is a cuid the recipient received in their own email. It is not a
 * secret, but the only thing it permits is removing that person from our
 * mail, which is the outcome we are obliged to make easy. We never confirm or
 * deny whether an id exists.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";

export const POST = handler(async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : null;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const professional = await prisma.cadreProfessional.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      outreachRecord: { select: { id: true, status: true } },
    },
  });

  // Always answer as though it worked. A 404 here would turn the link into an
  // oracle for which ids exist, and the recipient can do nothing with the
  // information either way.
  if (!professional?.email) return NextResponse.json({ ok: true, email: null });

  const email = professional.email.toLowerCase();

  await prisma.communicationSuppression.upsert({
    where: { email_channel: { email, channel: "EMAIL" } },
    update: { reason: "OPTED_OUT", notes: "Unsubscribed from an outreach email" },
    create: {
      email,
      channel: "EMAIL",
      reason: "OPTED_OUT",
      notes: "Unsubscribed from an outreach email",
    },
  });

  if (professional.outreachRecord && professional.outreachRecord.status !== "NOT_INTERESTED") {
    await prisma.cadreOutreachRecord.update({
      where: { id: professional.outreachRecord.id },
      data: { status: "NOT_INTERESTED", notes: "Unsubscribed via email link" },
    });
  }

  console.log(`[unsubscribe] ${email} opted out`);
  return NextResponse.json({ ok: true, email });
});
