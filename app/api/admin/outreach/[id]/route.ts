import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

export const GET = handler(async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session || !["PARTNER", "ADMIN"].includes(session.user.role)) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const campaign = await prisma.outreachCampaign.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true } },
      targets: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!campaign) return Response.json({ error: "Not found" }, { status: 404 });

  // For each target with a linked MaarovaUser, fetch the org id + latest
  // session/report so the UI can link directly to the assessment.
  const userIds = campaign.targets
    .map((t) => t.maarovaUserId)
    .filter((id): id is string => Boolean(id));

  const users = userIds.length
    ? await prisma.maarovaUser.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          organisationId: true,
          sessions: {
            orderBy: { startedAt: "desc" },
            take: 1,
            select: { status: true, completedAt: true },
          },
          reports: {
            orderBy: { generatedAt: "desc" },
            take: 1,
            select: { status: true, pdfUrl: true },
          },
        },
      })
    : [];
  const userMap = new Map(users.map((u) => [u.id, u]));

  const enriched = {
    ...campaign,
    targets: campaign.targets.map((t) => {
      const user = t.maarovaUserId ? userMap.get(t.maarovaUserId) : null;
      return {
        ...t,
        maarovaOrgId: user?.organisationId ?? null,
        sessionStatus: user?.sessions[0]?.status ?? null,
        sessionCompletedAt: user?.sessions[0]?.completedAt ?? null,
        reportStatus: user?.reports[0]?.status ?? null,
        reportPdfUrl: user?.reports[0]?.pdfUrl ?? null,
      };
    }),
  };

  return Response.json({ campaign: JSON.parse(JSON.stringify(enriched)) });
});

export const PATCH = handler(async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session || !["PARTNER", "ADMIN"].includes(session.user.role)) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const updateData: Record<string, unknown> = {};

  if (body.name !== undefined) updateData.name = body.name.trim();
  if (body.description !== undefined) updateData.description = body.description?.trim() || null;
  if (body.status !== undefined) {
    const valid = ["DRAFT", "ACTIVE", "COMPLETED"];
    if (valid.includes(body.status)) updateData.status = body.status;
  }

  const updated = await prisma.outreachCampaign.update({ where: { id }, data: updateData });

  // Recompute counts
  const counts = await prisma.outreachTarget.groupBy({
    by: ["status"],
    where: { campaignId: id },
    _count: true,
  });

  const sentCount = counts.filter((c) => c.status !== "IDENTIFIED").reduce((s, c) => s + c._count, 0);
  const respondedCount = counts.filter((c) => ["RESPONDED", "ASSESSMENT_STARTED", "ASSESSMENT_COMPLETED"].includes(c.status)).reduce((s, c) => s + c._count, 0);
  const assessmentCount = counts.filter((c) => ["ASSESSMENT_STARTED", "ASSESSMENT_COMPLETED"].includes(c.status)).reduce((s, c) => s + c._count, 0);

  await prisma.outreachCampaign.update({
    where: { id },
    data: { sentCount, respondedCount, assessmentCount },
  });

  return Response.json({ campaign: JSON.parse(JSON.stringify(updated)) });
});
