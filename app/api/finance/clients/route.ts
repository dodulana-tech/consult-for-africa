import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const role = session.user.role;

  let where = {};
  if (role === "ENGAGEMENT_MANAGER") {
    where = { projects: { some: { engagementManagerId: session.user.id } } };
  } else if (role === "CONSULTANT") {
    where = { projects: { some: { assignments: { some: { consultantId: session.user.id } } } } };
  }

  const clients = await prisma.client.findMany({
    where,
    select: { id: true, name: true, currency: true },
    orderBy: { name: "asc" },
  });

  return Response.json(clients);
}
