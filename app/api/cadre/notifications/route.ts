import { NextRequest, NextResponse } from "next/server";
import { getCadreSession } from "@/lib/cadreAuth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";

export const GET = handler(async function GET() {
  try {
    const session = await getCadreSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.cadreNotification.findMany({
        where: { professionalId: session.sub },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.cadreNotification.count({
        where: { professionalId: session.sub, isRead: false },
      }),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("Get notifications error:", error);
    return NextResponse.json(
      { error: "Failed to load notifications" },
      { status: 500 }
    );
  }
});

export const PATCH = handler(async function PATCH(req: NextRequest) {
  try {
    const session = await getCadreSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (body.markAllRead) {
      await prisma.cadreNotification.updateMany({
        where: { professionalId: session.sub, isRead: false },
        data: { isRead: true },
      });
    } else if (Array.isArray(body.ids) && body.ids.length > 0) {
      await prisma.cadreNotification.updateMany({
        where: {
          id: { in: body.ids },
          professionalId: session.sub,
        },
        data: { isRead: true },
      });
    } else {
      return NextResponse.json(
        { error: "Provide ids array or markAllRead: true" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark notifications read error:", error);
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    );
  }
});
