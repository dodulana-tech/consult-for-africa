import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

/**
 * POST /api/leads/[id]/outreach
 * Log an outreach attempt (email, call, LinkedIn, etc.).
 */
export const POST = handler(async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const lead = await prisma.lead.findUnique({ where: { id }, select: { id: true, outreachAttempts: true, status: true } });
  if (!lead) return Response.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { channel, notes, response } = body;

  if (!channel || !notes?.trim()) {
    return Response.json({ error: "channel and notes are required" }, { status: 400 });
  }

  const existing = (lead.outreachAttempts ?? []) as Array<{ date: string; channel: string; notes: string; response: string | null; loggedBy: string }>;
  const attempt = {
    date: new Date().toISOString(),
    channel: String(channel),
    notes: String(notes).trim(),
    response: response ? String(response).trim() : null,
    loggedBy: session.user.name ?? "Unknown",
  };

  const newAttempts = [...existing, attempt];

  const updated = await prisma.lead.update({
    where: { id },
    data: {
      outreachAttempts: newAttempts as unknown as import("@prisma/client/runtime/library").InputJsonValue,
      status: lead.status === "RESEARCHING" || lead.status === "NEW" ? "OUTREACH" : lead.status,
    },
  });

  return Response.json({ lead: JSON.parse(JSON.stringify(updated)) });
});
