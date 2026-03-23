import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessProject } from "@/lib/projectAccess";
import { NextRequest } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id: engagementId } = await params;

  if (!(await canAccessProject(session.user.id, session.user.role, engagementId))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const debrief = await prisma.engagementDebrief.findUnique({
    where: { engagementId },
    include: {
      assets: {
        include: {
          asset: true,
        },
      },
    },
  });

  return Response.json({ debrief });
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id: engagementId } = await params;

  if (!(await canAccessProject(session.user.id, session.user.role, engagementId))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await prisma.engagementDebrief.findUnique({
    where: { engagementId },
  });
  if (existing) {
    return Response.json({ error: "Debrief already exists for this engagement" }, { status: 409 });
  }

  const body = await req.json();

  const debrief = await prisma.engagementDebrief.create({
    data: {
      engagementId,
      summaryProblem: body.summaryProblem ?? null,
      summaryApproach: body.summaryApproach ?? null,
      summaryOutcome: body.summaryOutcome ?? null,
      whatWorkedJson: body.whatWorkedJson ?? [],
      whatFailedJson: body.whatFailedJson ?? [],
      clientContext: body.clientContext ?? null,
      newAssetsJson: body.newAssetsJson ?? [],
      sectorInsightsJson: body.sectorInsightsJson ?? [],
      submittedBy: session.user.id,
      status: "PENDING",
    },
    include: {
      assets: {
        include: {
          asset: true,
        },
      },
    },
  });

  return Response.json({ debrief }, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id: engagementId } = await params;

  if (!(await canAccessProject(session.user.id, session.user.role, engagementId))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  const data: Record<string, unknown> = {};
  const fields = [
    "summaryProblem",
    "summaryApproach",
    "summaryOutcome",
    "whatWorkedJson",
    "whatFailedJson",
    "clientContext",
    "newAssetsJson",
    "sectorInsightsJson",
    "status",
  ];

  for (const field of fields) {
    if (body[field] !== undefined) {
      data[field] = body[field];
    }
  }

  // If status is changing to SUBMITTED, record the submission timestamp
  if (body.status === "SUBMITTED") {
    data.submittedAt = new Date();
    data.submittedBy = session.user.id;
  }

  // If status is changing to REVIEWED, record the reviewer
  if (body.status === "REVIEWED") {
    data.reviewedBy = session.user.id;
  }

  const debrief = await prisma.engagementDebrief.update({
    where: { engagementId },
    data,
    include: {
      assets: {
        include: {
          asset: true,
        },
      },
    },
  });

  return Response.json({ debrief });
}
