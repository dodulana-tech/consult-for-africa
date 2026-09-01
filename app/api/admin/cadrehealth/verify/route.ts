/**
 * POST /api/admin/cadrehealth/verify
 *
 * Sets accountStatus on one or more CadreProfessional records from the admin
 * signups table: the one-click tick on a row, and the bulk action on a
 * selection.
 *
 * Body: { ids: string[], status?: "VERIFIED" | "PENDING_REVIEW" | "UNVERIFIED" }
 *   -> { ok, updated, status, ids }
 *
 * VERIFIED means "licence verified against the regulatory body", so every
 * change is written to the audit log with the acting user and the exact ids.
 * The reviewer, not this endpoint, is the one asserting the check was done.
 *
 * Batches are capped: a selection is a page of the table, not the whole
 * database, and an unbounded updateMany from a browser is how a mis-click
 * becomes 10,000 rows.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { logAudit } from "@/lib/audit";

const ALLOWED_ROLES = ["PARTNER", "ADMIN", "ASSOCIATE_DIRECTOR", "DIRECTOR"];

const SETTABLE = ["VERIFIED", "PENDING_REVIEW", "UNVERIFIED"] as const;
type Settable = (typeof SETTABLE)[number];

const MAX_IDS = 200;

export const POST = handler(async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ALLOWED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const rawIds: unknown = body?.ids;
  const status: Settable = SETTABLE.includes(body?.status) ? body.status : "VERIFIED";

  if (!Array.isArray(rawIds) || rawIds.length === 0) {
    return NextResponse.json({ error: "ids must be a non-empty array" }, { status: 400 });
  }
  const ids = [...new Set(rawIds.filter((v): v is string => typeof v === "string" && !!v))];
  if (ids.length === 0) {
    return NextResponse.json({ error: "ids must be a non-empty array" }, { status: 400 });
  }
  if (ids.length > MAX_IDS) {
    return NextResponse.json(
      { error: `Too many ids: ${ids.length}. Verify at most ${MAX_IDS} at a time.` },
      { status: 400 },
    );
  }

  // Read names before the write so the audit entry says who was changed, not
  // just how many.
  const subjects = await prisma.cadreProfessional.findMany({
    where: { id: { in: ids } },
    select: { id: true, firstName: true, lastName: true, email: true, accountStatus: true },
  });

  const changing = subjects.filter((s) => s.accountStatus !== status);
  if (changing.length === 0) {
    return NextResponse.json({ ok: true, updated: 0, status, ids: [] });
  }

  const { count } = await prisma.cadreProfessional.updateMany({
    where: { id: { in: changing.map((s) => s.id) } },
    data: { accountStatus: status },
  });

  await logAudit({
    userId: session.user.id,
    action: "STATUS_CHANGE",
    entityType: "CadreProfessional",
    entityId: changing.length === 1 ? changing[0].id : "bulk-verify",
    entityName:
      changing.length === 1
        ? `${changing[0].firstName} ${changing[0].lastName} -> ${status}`
        : `${changing.length} professionals -> ${status}`,
    details: {
      status,
      count: changing.length,
      subjects: changing.map((s) => ({ id: s.id, email: s.email, from: s.accountStatus })),
    },
  });

  return NextResponse.json({ ok: true, updated: count, status, ids: changing.map((s) => s.id) });
});
