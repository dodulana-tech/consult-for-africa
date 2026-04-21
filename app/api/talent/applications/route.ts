import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

export const GET = handler(async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const allowed = ["DIRECTOR", "PARTNER", "ADMIN", "ENGAGEMENT_MANAGER"];
  if (!allowed.includes(session.user.role)) return new Response("Forbidden", { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const specialty = searchParams.get("specialty");
  const minScore = searchParams.get("minScore");

  const applications = await prisma.talentApplication.findMany({
    where: {
      ...(status ? { status: status as never } : {}),
      ...(specialty ? { specialty: { contains: specialty, mode: "insensitive" } } : {}),
      ...(minScore ? { aiScore: { gte: Number(minScore) } } : {}),
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      location: true,
      specialty: true,
      yearsExperience: true,
      currentRole: true,
      currentOrg: true,
      aiScore: true,
      aiRecommendation: true,
      aiStrengths: true,
      status: true,
      engagementTypes: true,
      createdAt: true,
    },
    orderBy: [
      { aiScore: "desc" },
      { createdAt: "desc" },
    ],
  });

  const stats = await prisma.talentApplication.groupBy({
    by: ["status"],
    _count: { id: true },
  });

  return Response.json({ applications, stats });
});
