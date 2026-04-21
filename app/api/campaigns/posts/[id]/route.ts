import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";

export const PATCH = handler(async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const {
    title, body: postBody, platforms, contentPillar, hashtags, mediaUrls, mediaType,
    scheduledAt, status, reviewNote, impressions, reach, engagements, clicks, shares,
    comments, saves, externalUrl, publishedAt, campaignId,
  } = body;

  // Handle approval
  const isApproval = status === "APPROVED" || status === "REJECTED";

  const post = await prisma.campaignPost.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(postBody !== undefined ? { body: postBody } : {}),
      ...(Array.isArray(platforms) ? { platforms } : {}),
      ...(contentPillar !== undefined ? { contentPillar } : {}),
      ...(Array.isArray(hashtags) ? { hashtags } : {}),
      ...(Array.isArray(mediaUrls) ? { mediaUrls } : {}),
      ...(mediaType !== undefined ? { mediaType } : {}),
      ...(scheduledAt !== undefined ? { scheduledAt: scheduledAt ? new Date(scheduledAt) : null } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(isApproval ? { reviewedById: session.user.id, approvedAt: status === "APPROVED" ? new Date() : null } : {}),
      ...(reviewNote !== undefined ? { reviewNote } : {}),
      ...(impressions !== undefined ? { impressions } : {}),
      ...(reach !== undefined ? { reach } : {}),
      ...(engagements !== undefined ? { engagements } : {}),
      ...(clicks !== undefined ? { clicks } : {}),
      ...(shares !== undefined ? { shares } : {}),
      ...(comments !== undefined ? { comments } : {}),
      ...(saves !== undefined ? { saves } : {}),
      ...(externalUrl !== undefined ? { externalUrl } : {}),
      ...(publishedAt !== undefined ? { publishedAt: publishedAt ? new Date(publishedAt) : null } : {}),
      ...(campaignId !== undefined ? { campaignId: campaignId || null } : {}),
    },
  });

  return Response.json(post);
});

export const DELETE = handler(async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  await prisma.campaignPost.delete({ where: { id } });
  return Response.json({ ok: true });
});
