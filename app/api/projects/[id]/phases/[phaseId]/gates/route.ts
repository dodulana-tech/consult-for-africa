import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

const ELEVATED = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"];

export const POST = handler(async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; phaseId: string }> },
) {
  const session = await auth();
  if (!session || !ELEVATED.includes(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { phaseId } = await params;
  const body = await req.json();
  const { name, notes } = body;

  if (!name?.trim()) {
    return Response.json({ error: "name is required" }, { status: 400 });
  }

  const gate = await prisma.phaseGate.create({
    data: {
      phaseId,
      name: name.trim(),
      notes: notes?.trim() || null,
      passed: false,
    },
  });

  return Response.json({ gate: JSON.parse(JSON.stringify(gate)) }, { status: 201 });
});
