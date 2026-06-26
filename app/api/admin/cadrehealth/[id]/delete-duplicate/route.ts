import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { logAudit } from "@/lib/audit";

/**
 * POST /api/admin/cadrehealth/[id]/delete-duplicate
 *
 * Hard-deletes a CadreProfessional record. Intended for cleaning up
 * duplicate-name imports. Refuses to delete a record that has been claimed
 * (emailVerified) or has a CV uploaded -- pass force=true in the JSON body
 * to override that guard once the admin has manually confirmed.
 *
 * Cascade in the schema removes:
 *   CadreOutreachRecord, CadreWhatsAppMessage, CadreCredential, etc.
 */
export const POST = handler(async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["PARTNER", "ADMIN", "ASSOCIATE_DIRECTOR", "DIRECTOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const force = body.force === true;

  const professional = await prisma.cadreProfessional.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      emailVerified: true,
      cvFileUrl: true,
    },
  });
  if (!professional) {
    return NextResponse.json({ error: "Professional not found" }, { status: 404 });
  }

  const isClaimed = professional.emailVerified || !!professional.cvFileUrl;
  if (isClaimed && !force) {
    return NextResponse.json(
      {
        error: "This record looks claimed (verified email or CV uploaded). Pass force=true if you really want to delete it.",
        requiresForce: true,
      },
      { status: 409 },
    );
  }

  await prisma.cadreProfessional.delete({ where: { id: professional.id } });

  await logAudit({
    userId: session.user.id,
    action: "DELETE",
    entityType: "CadreProfessional",
    entityId: professional.id,
    entityName: `${professional.firstName} ${professional.lastName} <${professional.email}>`,
    details: { reason: "duplicate cleanup", forced: force, wasClaimed: isClaimed },
  });

  return NextResponse.json({ ok: true });
});
