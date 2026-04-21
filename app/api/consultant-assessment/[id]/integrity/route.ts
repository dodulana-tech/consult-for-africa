import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

export const POST = handler(async function POST(
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

  const body = await req.json();
  const { tabSwitchCount, pasteEventCount, largePasteCount, typingPatterns, suspiciousGaps, suspiciousFlags } = body;

  const data: Record<string, unknown> = {};

  if (typeof tabSwitchCount === "number") {
    data.tabSwitchCount = tabSwitchCount;
  }

  if (typeof pasteEventCount === "number") {
    data.pasteEventCount = pasteEventCount;
  }

  // Merge all integrity signals into suspiciousFlags JSON
  const existingFlags = (assessment.suspiciousFlags as Record<string, unknown>) || {};
  const newFlags: Record<string, unknown> = { ...existingFlags };
  if (typeof largePasteCount === "number") newFlags.largePasteCount = largePasteCount;
  if (typingPatterns) newFlags.typingPatterns = typingPatterns;
  if (typeof suspiciousGaps === "number") newFlags.suspiciousGaps = suspiciousGaps;
  if (suspiciousFlags && typeof suspiciousFlags === "object") {
    const allowed = ["rapidSubmission", "consistentTiming", "copyPasteRatio", "focusLoss", "browserInfo"];
    for (const key of allowed) {
      if (key in suspiciousFlags) newFlags[key] = suspiciousFlags[key];
    }
  }
  newFlags.lastUpdated = new Date().toISOString();
  data.suspiciousFlags = newFlags;

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
});
