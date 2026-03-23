import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

const ADMIN = ["PARTNER", "ADMIN"];

export async function GET() {
  const session = await auth();
  if (!session || !ADMIN.includes(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const cohorts = await prisma.internCohort.findMany({
    orderBy: { startDate: "desc" },
    include: {
      rotations: {
        include: {
          intern: { select: { id: true, name: true, email: true } },
          engagement: { select: { id: true, name: true } },
          supervisor: { select: { id: true, name: true } },
          _count: { select: { evaluations: true } },
        },
      },
    },
  });

  return Response.json({ cohorts: JSON.parse(JSON.stringify(cohorts)) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !ADMIN.includes(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, track, startDate, endDate, maxInterns, description } = body;

  if (!name?.trim() || !track || !startDate || !endDate) {
    return Response.json({ error: "name, track, startDate, and endDate are required" }, { status: 400 });
  }

  const cohort = await prisma.internCohort.create({
    data: {
      name: name.trim(),
      track,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      maxInterns: maxInterns || 5,
      description: description?.trim() || null,
    },
  });

  return Response.json({ cohort }, { status: 201 });
}
