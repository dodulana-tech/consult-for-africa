import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session || !["PARTNER", "ADMIN"].includes(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { internId, projectId, supervisorId, startDate, endDate } = body;

  if (!internId || !startDate || !endDate) {
    return Response.json({ error: "internId, startDate, and endDate are required" }, { status: 400 });
  }

  const rotation = await prisma.internRotation.create({
    data: {
      cohortId: id,
      internId,
      projectId: projectId || null,
      supervisorId: supervisorId || null,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: "ACTIVE",
    },
    include: {
      intern: { select: { name: true } },
      project: { select: { name: true } },
      supervisor: { select: { name: true } },
    },
  });

  return Response.json({ rotation: JSON.parse(JSON.stringify(rotation)) }, { status: 201 });
}
