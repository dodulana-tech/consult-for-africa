import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { logAudit } from "@/lib/audit";
import { canManageRhythm } from "@/lib/office";
import { RHYTHM_SELECT } from "../route";
import type { Prisma } from "@prisma/client";

export const PATCH = handler(async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageRhythm(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const existing = await prisma.recurringTask.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const data: Prisma.RecurringTaskUpdateInput = {};
  const clamp = (n: unknown, lo: number, hi: number) => {
    const v = Number(n);
    return Number.isFinite(v) ? Math.min(Math.max(Math.round(v), lo), hi) : null;
  };

  if (typeof body.active === "boolean") data.active = body.active;
  if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim();
  if (typeof body.brief === "string" && body.brief.trim()) data.brief = body.brief.trim();
  if (typeof body.definitionOfDone === "string" && body.definitionOfDone.trim()) data.definitionOfDone = body.definitionOfDone.trim();
  if ("leadTimeDays" in body) data.leadTimeDays = clamp(body.leadTimeDays, 0, 60) ?? 0;
  if ("checkInOffsetDays" in body) data.checkInOffsetDays = clamp(body.checkInOffsetDays, 0, 60);
  if ("estimatedMinutes" in body) data.estimatedMinutes = clamp(body.estimatedMinutes, 1, 10000);
  if ("dayOfWeek" in body) data.dayOfWeek = clamp(body.dayOfWeek, 1, 7);
  if ("dayOfMonth" in body) data.dayOfMonth = clamp(body.dayOfMonth, 1, 28);
  if ("monthOfYear" in body) data.monthOfYear = clamp(body.monthOfYear, 1, 12);

  if (!Object.keys(data).length) return Response.json({ error: "Nothing to update." }, { status: 400 });

  const rhythm = await prisma.recurringTask.update({ where: { id }, data, select: RHYTHM_SELECT });
  await logAudit({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "RecurringTask",
    entityId: rhythm.id,
    entityName: rhythm.title,
    details: { fields: Object.keys(data) },
  });
  return Response.json({ rhythm: JSON.parse(JSON.stringify(rhythm)) });
});

/**
 * Retiring a rhythm deactivates it rather than deleting it, so the tasks it
 * already generated keep their lineage and a gap in the cadence stays readable.
 */
export const DELETE = handler(async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageRhythm(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const existing = await prisma.recurringTask.findUnique({ where: { id }, select: { id: true, title: true } });
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  await prisma.recurringTask.update({ where: { id }, data: { active: false } });
  await logAudit({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "RecurringTask",
    entityId: id,
    entityName: existing.title,
    details: { retired: true },
  });
  return Response.json({ ok: true, retired: true });
});
