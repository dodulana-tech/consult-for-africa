import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";

export const GET = handler(async function GET() {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const profile = await prisma.founderProfile.findUnique({
    where: { email: session.user.email! },
    select: { id: true },
  });
  if (!profile) return Response.json([]);

  const docs = await prisma.founderDocument.findMany({
    where: { founderId: profile.id },
    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
  });

  return Response.json(docs);
});

export const POST = handler(async function POST(req: Request) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const profile = await prisma.founderProfile.findUnique({
    where: { email: session.user.email! },
    select: { id: true },
  });
  if (!profile) return new Response("No founder profile", { status: 404 });

  const { title, description, content, fileUrl, fileType, fileSize, category, tags, isPinned, reviewDate, reviewNote } = await req.json();

  if (!title?.trim()) {
    return Response.json({ error: "Title is required." }, { status: 400 });
  }

  const doc = await prisma.founderDocument.create({
    data: {
      founderId: profile.id,
      title: title.trim(),
      description: description?.trim() || null,
      content: content?.trim() || null,
      fileUrl: fileUrl || null,
      fileType: fileType || null,
      fileSize: fileSize || null,
      category: category || "STRATEGY",
      tags: Array.isArray(tags) ? tags : [],
      isPinned: isPinned === true,
      reviewDate: reviewDate ? new Date(reviewDate) : null,
      reviewNote: reviewNote?.trim() || null,
    },
  });

  return Response.json(doc);
});
