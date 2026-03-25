import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { emailOutreachInvite } from "@/lib/email";
import { randomBytes } from "crypto";
import { NextRequest } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session || !["PARTNER", "ADMIN"].includes(session.user.role)) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  // Support single or bulk add
  const targets = Array.isArray(body) ? body : [body];

  const created = [];
  for (const t of targets) {
    if (!t.name?.trim()) continue;
    const target = await prisma.outreachTarget.create({
      data: {
        campaignId: id,
        name: t.name.trim(),
        title: t.title?.trim() || null,
        organization: t.organization?.trim() || null,
        email: t.email?.trim().toLowerCase() || null,
        phone: t.phone?.trim() || null,
        linkedinUrl: t.linkedinUrl?.trim() || null,
        city: t.city?.trim() || null,
        source: t.source?.trim() || null,
        status: "IDENTIFIED",
      },
    });
    created.push(target);
  }

  // Update campaign target count
  const count = await prisma.outreachTarget.count({ where: { campaignId: id } });
  await prisma.outreachCampaign.update({ where: { id }, data: { targetCount: count } });

  return Response.json({ targets: created, count }, { status: 201 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session || !["PARTNER", "ADMIN"].includes(session.user.role)) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { targetId, status, notes } = body;

  if (!targetId) return Response.json({ error: "targetId required" }, { status: 400 });

  const updateData: Record<string, unknown> = {};

  // Field editing
  if (body.name !== undefined) updateData.name = body.name.trim();
  if (body.title !== undefined) updateData.title = body.title?.trim() || null;
  if (body.organization !== undefined) updateData.organization = body.organization?.trim() || null;
  if (body.email !== undefined) updateData.email = body.email?.trim().toLowerCase() || null;
  if (body.linkedinUrl !== undefined) updateData.linkedinUrl = body.linkedinUrl?.trim() || null;
  if (body.city !== undefined) updateData.city = body.city?.trim() || null;
  if (body.source !== undefined) updateData.source = body.source?.trim() || null;

  if (status) {
    const valid = ["IDENTIFIED", "INVITED", "RESPONDED", "ASSESSMENT_STARTED", "ASSESSMENT_COMPLETED", "DECLINED", "NO_RESPONSE"];
    if (valid.includes(status)) {
      updateData.status = status;
      if (status === "INVITED") updateData.invitedAt = new Date();
      if (status === "RESPONDED") updateData.respondedAt = new Date();
    }
  }
  if (notes !== undefined) updateData.notes = notes?.trim() || null;

  // Generate invite token when marking as INVITED
  if (status === "INVITED") {
    // Fetch current token + campaign name in one query
    const current = await prisma.outreachTarget.findUnique({
      where: { id: targetId },
      select: { inviteToken: true, campaign: { select: { name: true } } },
    });
    if (!current?.inviteToken) {
      updateData.inviteToken = randomBytes(32).toString("base64url");
    }
    updateData.tokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const updated = await prisma.outreachTarget.update({ where: { id: targetId }, data: updateData });

    // Fire-and-forget: email + count recomputation (don't block the response)
    if (updated.email && updated.inviteToken) {
      emailOutreachInvite({
        targetEmail: updated.email,
        targetName: updated.name,
        targetTitle: updated.title ?? undefined,
        targetOrg: updated.organization ?? undefined,
        campaignName: current?.campaign.name ?? "Maarova Leadership Assessment",
        inviteToken: updated.inviteToken,
      }).catch((err) => console.error("[outreach] invite email failed:", err));
    }

    // Recompute counts in background (don't block response)
    recomputeCampaignCounts(id).catch(() => {});

    return Response.json({ target: JSON.parse(JSON.stringify(updated)) });
  }

  const updated = await prisma.outreachTarget.update({ where: { id: targetId }, data: updateData });

  // Recompute counts in background
  recomputeCampaignCounts(id).catch(() => {});

  return Response.json({ target: JSON.parse(JSON.stringify(updated)) });
}

async function recomputeCampaignCounts(campaignId: string) {
  const counts = await prisma.outreachTarget.groupBy({
    by: ["status"],
    where: { campaignId },
    _count: true,
  });
  const sentCount = counts.filter((c) => c.status !== "IDENTIFIED").reduce((s, c) => s + c._count, 0);
  const respondedCount = counts.filter((c) => ["RESPONDED", "ASSESSMENT_STARTED", "ASSESSMENT_COMPLETED"].includes(c.status)).reduce((s, c) => s + c._count, 0);
  const assessmentCount = counts.filter((c) => ["ASSESSMENT_STARTED", "ASSESSMENT_COMPLETED"].includes(c.status)).reduce((s, c) => s + c._count, 0);
  await prisma.outreachCampaign.update({
    where: { id: campaignId },
    data: { sentCount, respondedCount, assessmentCount },
  });
}
