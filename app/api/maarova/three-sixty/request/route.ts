import { getMaarovaSession } from "@/lib/maarovaAuth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";

export const POST = handler(async function POST() {
  const session = await getMaarovaSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Check for existing active request
  const existing = await prisma.maarova360Request.findFirst({
    where: {
      subjectId: session.sub,
      status: { in: ["COLLECTING", "PROCESSING"] },
    },
  });

  if (existing) {
    return Response.json(existing);
  }

  // Default deadline: 2 weeks from now
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 14);

  const request = await prisma.maarova360Request.create({
    data: {
      subjectId: session.sub,
      deadline,
      minRaters: 5,
      status: "COLLECTING",
    },
  });

  return Response.json(request, { status: 201 });
});
