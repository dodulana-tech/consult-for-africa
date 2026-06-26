import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";

const ALLOWED = ["ENGAGEMENT_MANAGER", "ASSOCIATE_DIRECTOR", "DIRECTOR", "PARTNER", "ADMIN"];

/**
 * GET /api/admin/notifications
 *   ?unreadOnly=true to filter
 *   Returns up to 50 most recent.
 */
export const GET = handler(async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!ALLOWED.includes(session.user.role)) return Response.json({ error: "Forbidden" }, { status: 403 });

  const unreadOnly = req.nextUrl.searchParams.get("unreadOnly") === "true";
  const where = unreadOnly ? { isRead: false } : {};

  const [items, unreadCount] = await Promise.all([
    prisma.adminNotification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.adminNotification.count({ where: { isRead: false } }),
  ]);

  return Response.json({
    items: items.map((n) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
      readAt: n.readAt?.toISOString() ?? null,
    })),
    unreadCount,
  });
});

/**
 * PATCH /api/admin/notifications
 * Body: { ids?: string[], markAllRead?: true }
 */
export const PATCH = handler(async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!ALLOWED.includes(session.user.role)) return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();

  if (body.markAllRead) {
    const result = await prisma.adminNotification.updateMany({
      where: { isRead: false },
      data: { isRead: true, readAt: new Date(), readById: session.user.id },
    });
    return Response.json({ ok: true, count: result.count });
  }

  if (Array.isArray(body.ids) && body.ids.length > 0) {
    const result = await prisma.adminNotification.updateMany({
      where: { id: { in: body.ids } },
      data: { isRead: true, readAt: new Date(), readById: session.user.id },
    });
    return Response.json({ ok: true, count: result.count });
  }

  return Response.json({ error: "Provide ids[] or markAllRead" }, { status: 400 });
});
