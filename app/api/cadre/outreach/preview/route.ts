import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (
    !session?.user?.role ||
    !["PARTNER", "ADMIN", "DIRECTOR"].includes(session.user.role)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = Math.min(
    parseInt(req.nextUrl.searchParams.get("limit") ?? "25", 10),
    200
  );

  const records = await prisma.cadreOutreachRecord.findMany({
    where: { status: "READY" },
    take: limit,
    orderBy: [
      { tier: "asc" }, // A first, then B, then C
      { createdAt: "asc" }, // oldest first within tier
    ],
    select: {
      professional: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          cadre: true,
          state: true,
          phone: true,
        },
      },
      tier: true,
    },
  });

  const professionals = records.map((r) => ({
    id: r.professional.id,
    firstName: r.professional.firstName,
    lastName: r.professional.lastName,
    cadre: r.professional.cadre,
    state: r.professional.state,
    phone: r.professional.phone ? "yes" : null,
    tier: r.tier,
  }));

  return NextResponse.json({ professionals, total: professionals.length });
}
