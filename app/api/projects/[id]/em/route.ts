import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

// PATCH — change the Engagement Manager on a project
// Only DIRECTOR / PARTNER / ADMIN can do this
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const canChange = ["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canChange) return new Response("Forbidden", { status: 403 });

  const { id: projectId } = await params;
  const { engagementManagerId } = await req.json();

  if (!engagementManagerId) {
    return new Response("engagementManagerId is required", { status: 400 });
  }

  // Verify the target user is eligible to be an EM
  const newEM = await prisma.user.findUnique({
    where: { id: engagementManagerId },
    select: { id: true, name: true, role: true },
  });

  if (!newEM) return new Response("User not found", { status: 404 });

  const eligibleRoles = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"];
  if (!eligibleRoles.includes(newEM.role)) {
    return new Response("User is not eligible to be an Engagement Manager", { status: 400 });
  }

  const project = await prisma.engagement.update({
    where: { id: projectId },
    data: { engagementManagerId },
    select: {
      id: true,
      name: true,
      engagementManager: { select: { id: true, name: true, email: true } },
    },
  });

  return Response.json({ ok: true, project });
}
