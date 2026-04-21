import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";

export const GET = handler(async function GET(req: Request) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const url = new URL(req.url);
  const brand = url.searchParams.get("brand");
  const status = url.searchParams.get("status");
  const campaignId = url.searchParams.get("campaignId");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (brand) where.brand = brand;
  if (status) where.status = status;
  if (campaignId) where.campaignId = campaignId;

  const posts = await prisma.campaignPost.findMany({
    where,
    orderBy: { scheduledAt: { sort: "asc", nulls: "last" } },
    include: { campaign: { select: { name: true } } },
  });

  return Response.json(posts);
});

export const POST = handler(async function POST(req: Request) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();
  const {
    campaignId, brand, platforms, contentPillar, title, body: postBody,
    hashtags, mediaUrls, mediaType, scheduledAt, status,
  } = body;

  if (!title?.trim() || !postBody?.trim() || !brand) {
    return Response.json({ error: "Title, body, and brand are required." }, { status: 400 });
  }

  const post = await prisma.campaignPost.create({
    data: {
      campaignId: campaignId || null,
      brand,
      platforms: Array.isArray(platforms) ? platforms : [],
      contentPillar: contentPillar || null,
      title: title.trim(),
      body: postBody.trim(),
      hashtags: Array.isArray(hashtags) ? hashtags : [],
      mediaUrls: Array.isArray(mediaUrls) ? mediaUrls : [],
      mediaType: mediaType || null,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      status: status || "IDEA",
      createdById: session.user.id,
    },
  });

  return Response.json(post);
});
