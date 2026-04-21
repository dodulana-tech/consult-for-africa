import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";

export const PATCH = handler(async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const isAdmin = ["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) return new Response("Forbidden", { status: 403 });

  const { assignmentId } = await params;
  const { status } = await req.json();

  const updated = await prisma.agentOpportunityAssignment.update({
    where: { id: assignmentId },
    data: {
      status,
      ...(status === "ACTIVE" ? { approvedAt: new Date(), approvedById: session.user.id } : {}),
    },
  });

  return Response.json(updated);
});
