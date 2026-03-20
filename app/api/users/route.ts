import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

/**
 * GET /api/users?emEligible=true
 * Returns users eligible to be Engagement Managers.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (!["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const emEligible = searchParams.get("emEligible") === "true";

  const where = emEligible
    ? { role: { in: ["ENGAGEMENT_MANAGER" as const, "DIRECTOR" as const, "PARTNER" as const, "ADMIN" as const] } }
    : {};

  const users = await prisma.user.findMany({
    where,
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: "asc" },
  });

  return Response.json({ users });
}
