import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const campaigns = await prisma.campaign.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { posts: true } },
      posts: {
        select: { status: true, scheduledAt: true },
      },
    },
  });

  return Response.json(campaigns);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { name, description, brand, objective, startDate, endDate, tags } = await req.json();

  if (!name?.trim() || !brand) {
    return Response.json({ error: "Name and brand are required." }, { status: 400 });
  }

  const campaign = await prisma.campaign.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      brand,
      objective: objective || null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      tags: Array.isArray(tags) ? tags : [],
      createdById: session.user.id,
    },
  });

  return Response.json(campaign);
}
