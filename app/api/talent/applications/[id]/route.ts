import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

export const GET = handler(async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = ["DIRECTOR", "PARTNER", "ADMIN", "ENGAGEMENT_MANAGER"];
  if (!allowed.includes(session.user.role)) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const application = await prisma.talentApplication.findUnique({
    where: { id },
    include: {
      reviewedBy: { select: { name: true, email: true } },
    },
  });

  if (!application) return Response.json({ error: "Not found" }, { status: 404 });

  return Response.json(application);
});

export const PATCH = handler(async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = ["DIRECTOR", "PARTNER", "ADMIN", "ENGAGEMENT_MANAGER"];
  if (!allowed.includes(session.user.role)) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { status, reviewNotes } = await req.json();

  const validStatuses = [
    "SUBMITTED", "AI_SCREENED", "UNDER_REVIEW", "SHORTLISTED",
    "INTERVIEW_SCHEDULED", "OFFER_EXTENDED", "HIRED", "REJECTED", "WITHDRAWN",
  ];

  if (status && !validStatuses.includes(status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  const application = await prisma.talentApplication.update({
    where: { id },
    data: {
      ...(status ? { status } : {}),
      ...(reviewNotes !== undefined ? { reviewNotes } : {}),
      reviewedById: session.user.id,
      reviewedAt: new Date(),
    },
  });

  return Response.json({ id: application.id, status: application.status });
});
