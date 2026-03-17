import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const assessment = await prisma.consultantAssessment.findUnique({
    where: { id },
  });

  if (!assessment) {
    return Response.json({ error: "Assessment not found" }, { status: 404 });
  }

  if (assessment.userId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  if (assessment.status === "COMPLETED") {
    return Response.json({ error: "Cannot abandon a completed assessment" }, { status: 400 });
  }

  await prisma.consultantAssessment.update({
    where: { id },
    data: { status: "EXPIRED" },
  });

  return Response.json({ ok: true });
}
