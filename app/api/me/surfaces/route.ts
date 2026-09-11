import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { isOfficeRole } from "@/lib/constants";

/**
 * GET /api/me/surfaces
 *
 * Which optional surfaces this person should actually be shown.
 *
 * The Office of the Founding Partner carries client work, so the delivery
 * surfaces are granted to them. Granted is not the same as useful on day one:
 * an assistant who has never been staffed on anything does not need Projects,
 * Deliverables, Time and Tools competing for attention with the job she was
 * hired to do. They appear the week she is put on a piece of work, which is
 * also the week they start meaning something.
 */
export const GET = handler(async function GET() {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (!isOfficeRole(session.user.role)) {
    // Everyone else keeps whatever their role already grants.
    return Response.json({ deliveryWork: true });
  }

  const assignments = await prisma.assignment.count({ where: { consultantId: session.user.id } });
  return Response.json({ deliveryWork: assignments > 0, assignments });
});
