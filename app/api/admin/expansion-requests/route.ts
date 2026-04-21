import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

const VALID_STATUSES = ["NEW", "CONTACTED", "PROPOSAL_SENT", "WON", "LOST"];

// Allowed transitions: current status -> set of valid next statuses
const TRANSITIONS: Record<string, string[]> = {
  NEW: ["CONTACTED", "LOST"],
  CONTACTED: ["PROPOSAL_SENT", "LOST"],
  PROPOSAL_SENT: ["WON", "LOST"],
  WON: [],
  LOST: ["NEW"], // allow reopening
};

export const PATCH = handler(async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const allowed = ["PARTNER", "ADMIN", "DIRECTOR"].includes(session.user.role);
  if (!allowed) return new Response("Forbidden", { status: 403 });

  const body = await req.json();
  const { id, status } = body;

  if (!id?.trim() || !status?.trim()) {
    return new Response("id and status are required", { status: 400 });
  }

  if (!VALID_STATUSES.includes(status)) {
    return new Response(`Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`, {
      status: 400,
    });
  }

  const existing = await prisma.clientExpansionRequest.findUnique({
    where: { id },
  });

  if (!existing) return new Response("Request not found", { status: 404 });

  const allowedNext = TRANSITIONS[existing.status] ?? [];
  if (!allowedNext.includes(status)) {
    return new Response(
      `Cannot transition from ${existing.status} to ${status}. Allowed: ${allowedNext.join(", ") || "none"}`,
      { status: 400 }
    );
  }

  const updated = await prisma.clientExpansionRequest.update({
    where: { id },
    data: { status },
  });

  return Response.json({ id: updated.id, status: updated.status });
});
