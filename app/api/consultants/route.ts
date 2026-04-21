import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";

/**
 * GET /api/consultants
 * List consultants for dropdowns (NDA Manager, etc.)
 */
export const GET = handler(async function GET() {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const consultants = await prisma.user.findMany({
    where: { role: "CONSULTANT" },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  return Response.json({ consultants });
});
