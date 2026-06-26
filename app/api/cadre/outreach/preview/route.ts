import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { handler } from "@/lib/api-handler";

type Channel = "EMAIL" | "WHATSAPP";

export const GET = handler(async function GET(req: NextRequest) {
  const session = await auth();
  if (
    !session?.user?.role ||
    !["PARTNER", "ADMIN", "ASSOCIATE_DIRECTOR", "DIRECTOR"].includes(session.user.role)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = Math.min(
    parseInt(req.nextUrl.searchParams.get("limit") ?? "25", 10),
    200
  );
  const channelParam = (req.nextUrl.searchParams.get("channel") ?? "EMAIL").toUpperCase();
  const channel: Channel = channelParam === "WHATSAPP" ? "WHATSAPP" : "EMAIL";

  const professionalFilter =
    channel === "EMAIL"
      ? { email: { not: "" } }
      : { phone: { not: null } };

  const records = await prisma.cadreOutreachRecord.findMany({
    where: { status: "READY", professional: professionalFilter },
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
          email: true,
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
    hasEmail: !!r.professional.email,
    hasPhone: !!r.professional.phone,
    tier: r.tier,
  }));

  return NextResponse.json({ professionals, total: professionals.length, channel });
});
