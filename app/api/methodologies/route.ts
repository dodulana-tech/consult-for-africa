import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

export const GET = handler(async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

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
      _count: { select: { engagements: true } },
    },
  });

  return Response.json({ methodologies });
});

export const POST = handler(async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const canCreate = ["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canCreate) return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, description, category, serviceTypes, phases } = body;

  if (!name?.trim() || !description?.trim() || !category) {
    return Response.json({ error: "name, description, and category are required" }, { status: 400 });
  }

  const methodology = await prisma.methodologyTemplate.create({
    data: {
      name: name.trim(),
      slug: name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString(36),
      description: description.trim(),
      category,
      serviceTypes: Array.isArray(serviceTypes) ? serviceTypes : [],
      sortOrder: 0,
      phases: {
        create: Array.isArray(phases) ? phases.map((p: { name: string; description: string; activities: string[]; deliverables: string[]; durationWeeks: number; order: number; gates?: { name: string; order: number }[] }, i: number) => ({
          name: p.name?.trim() || `Phase ${i + 1}`,
          description: p.description?.trim() || "",
          activities: Array.isArray(p.activities) ? p.activities : [],
          deliverables: Array.isArray(p.deliverables) ? p.deliverables : [],
          durationWeeks: p.durationWeeks || 4,
          order: p.order ?? i + 1,
          gates: p.gates ? {
            create: p.gates.map((g: { name: string; order: number; criteria?: string }, gi: number) => ({
              name: g.name?.trim() || `Gate ${gi + 1}`,
              criteria: g.criteria?.trim() || "To be defined",
              order: g.order ?? gi + 1,
            })),
          } : undefined,
        })) : [],
      },
    },
    include: {
      phases: { include: { gates: true } },
    },
  });

  return Response.json({ methodology }, { status: 201 });
});
