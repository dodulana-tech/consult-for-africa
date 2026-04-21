import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

const ADMIN = ["PARTNER", "ADMIN"];

export const GET = handler(async function GET() {
  const session = await auth();
  if (!session || !ADMIN.includes(session.user.role)) return Response.json({ error: "Forbidden" }, { status: 403 });

  const campaigns = await prisma.outreachCampaign.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { name: true } },
      _count: { select: { targets: true } },
    },
  });

  return Response.json({
    campaigns: campaigns.map((c) => ({
      ...c,
      targetCount: c._count.targets,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),
  });
});

export const POST = handler(async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !ADMIN.includes(session.user.role)) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { name, description, month } = await req.json();

  if (!name?.trim() || !month) {
    return Response.json({ error: "name and month are required" }, { status: 400 });
  }

  const campaign = await prisma.outreachCampaign.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      month,
      createdById: session.user.id,
    },
  });

  return Response.json({ campaign }, { status: 201 });
});
