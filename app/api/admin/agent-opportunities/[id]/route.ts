import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const isAdmin = ["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) return new Response("Forbidden", { status: 403 });

  const { id } = await params;
  const body = await req.json();

  const { status, title, description, commissionValue, maxAgents, endDate, notes } = body;

  const updated = await prisma.agentOpportunity.update({
    where: { id },
    data: {
      ...(status ? { status } : {}),
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      ...(commissionValue !== undefined ? { commissionValue: parseFloat(commissionValue) } : {}),
      ...(maxAgents !== undefined ? { maxAgents: maxAgents ? parseInt(maxAgents) : null } : {}),
      ...(endDate !== undefined ? { endDate: endDate ? new Date(endDate) : null } : {}),
      ...(notes !== undefined ? { notes } : {}),
    },
  });

  return Response.json(updated);
}
