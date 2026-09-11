import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { TASK_ROLES } from "@/lib/constants";
import { canAssignToOthers, canUseTaskBoard } from "@/lib/tasks";
import type { UserRole } from "@prisma/client";

/**
 * GET /api/tasks/people
 *
 * Who this user can put a task on. Deliberately its own endpoint rather than
 * opening /api/users, which is Associate Director and above.
 */
export const GET = handler(async function GET() {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!canUseTaskBoard(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!canAssignToOthers(session.user.role)) {
    // You can still raise a task, but only for yourself.
    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, role: true },
    });
    return Response.json({ people: me ? [me] : [] });
  }

  const people = await prisma.user.findMany({
    where: { role: { in: [...TASK_ROLES] as UserRole[] } },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: "asc" },
  });

  return Response.json({ people });
});
