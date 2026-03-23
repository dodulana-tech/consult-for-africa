import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const methodology = await prisma.methodologyTemplate.findUnique({
    where: { id },
    include: {
      phases: {
        orderBy: { order: "asc" },
        include: { gates: { orderBy: { order: "asc" } } },
      },
      _count: { select: { engagements: true } },
    },
  });

  if (!methodology) return new Response("Not found", { status: 404 });
  return Response.json({ methodology });
}
