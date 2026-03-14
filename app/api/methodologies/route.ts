import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const serviceType = searchParams.get("serviceType");

  const methodologies = await prisma.methodologyTemplate.findMany({
    where: {
      isActive: true,
      ...(category ? { category } : {}),
      ...(serviceType ? { serviceTypes: { has: serviceType } } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      phases: {
        orderBy: { order: "asc" },
        include: { gates: { orderBy: { order: "asc" } } },
      },
      _count: { select: { projects: true } },
    },
  });

  return Response.json({ methodologies });
}
