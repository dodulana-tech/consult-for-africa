import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

const ELEVATED = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session || !ELEVATED.includes(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { name, description, dueDate, order } = body;

  if (!name?.trim() || !dueDate) {
    return Response.json({ error: "name and dueDate are required" }, { status: 400 });
  }

  const count = await prisma.milestone.count({ where: { projectId: id } });

  const milestone = await prisma.milestone.create({
    data: {
      projectId: id,
      name: name.trim(),
      description: description?.trim() || "",
      dueDate: new Date(dueDate),
      order: order ?? count + 1,
      status: "PENDING",
    },
  });

  return Response.json({ milestone: JSON.parse(JSON.stringify(milestone)) }, { status: 201 });
}
