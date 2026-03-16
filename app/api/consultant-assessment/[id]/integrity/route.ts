import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function POST(
  req: NextRequest,
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

  if (assessment.status === "COMPLETED" || assessment.status === "EXPIRED") {
    return Response.json(
      { error: "Cannot update integrity on a finished assessment" },
      { status: 400 }
    );
  }

  const { tabSwitchCount, pasteEventCount, suspiciousFlags } = await req.json();

  const data: Record<string, unknown> = {};

  if (typeof tabSwitchCount === "number") {
    data.tabSwitchCount = tabSwitchCount;
  }

  if (typeof pasteEventCount === "number") {
    data.pasteEventCount = pasteEventCount;
  }

  if (suspiciousFlags !== undefined) {
    // Merge with existing flags
    const existingFlags = (assessment.suspiciousFlags as Record<string, unknown>) || {};
    data.suspiciousFlags = {
      ...existingFlags,
      ...(typeof suspiciousFlags === "object" ? suspiciousFlags : {}),
      lastUpdated: new Date().toISOString(),
    };
  }

  if (Object.keys(data).length === 0) {
    return Response.json({ error: "No valid fields provided" }, { status: 400 });
  }

  const updated = await prisma.consultantAssessment.update({
    where: { id },
    data,
  });

  return Response.json({
    ok: true,
    integrity: {
      tabSwitchCount: updated.tabSwitchCount,
      pasteEventCount: updated.pasteEventCount,
      suspiciousFlags: updated.suspiciousFlags,
    },
  });
}
