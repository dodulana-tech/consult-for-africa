import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  NuruMeetingSession,
  getActiveSession,
  getActiveSessions,
} from "@/lib/nuru-bot/orchestrator";
import { NextRequest } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/meetings/:id/nuru
 * Trigger Nuru to join the meeting.
 * Body: { action: "join" | "leave" }
 */
export async function POST(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json();
  const action = body.action as string;

  const meeting = await prisma.meeting.findUnique({
    where: { id },
    select: { id: true, meetLink: true, nuruEnabled: true, status: true, organizerId: true },
  });

  if (!meeting) {
    return Response.json({ error: "Meeting not found" }, { status: 404 });
  }

  if (!meeting.nuruEnabled) {
    return Response.json({ error: "Nuru is disabled for this meeting" }, { status: 400 });
  }

  if (!meeting.meetLink) {
    return Response.json({ error: "No Google Meet link available" }, { status: 400 });
  }

  // Only organizer or elevated roles can trigger Nuru
  const ELEVATED = ["DIRECTOR", "PARTNER", "ADMIN"];
  if (meeting.organizerId !== session.user.id && !ELEVATED.includes(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  if (action === "join") {
    const existing = getActiveSession(id);
    if (existing) {
      return Response.json({ error: "Nuru is already in this meeting" }, { status: 409 });
    }

    const nuruSession = new NuruMeetingSession(id, meeting.meetLink);

    // Start in background (don't block the response)
    nuruSession.start().catch((err) => {
      console.error(`[nuru:${id}] Failed to start:`, err);
    });

    return Response.json({
      success: true,
      message: "Nuru is joining the meeting...",
    });
  }

  if (action === "leave") {
    const existing = getActiveSession(id);
    if (!existing) {
      return Response.json({ error: "Nuru is not in this meeting" }, { status: 400 });
    }

    existing.stop().catch((err) => {
      console.error(`[nuru:${id}] Failed to stop:`, err);
    });

    return Response.json({
      success: true,
      message: "Nuru is leaving the meeting and processing notes...",
    });
  }

  return Response.json({ error: "Invalid action. Use 'join' or 'leave'" }, { status: 400 });
}

/**
 * GET /api/meetings/:id/nuru
 * Check Nuru's status for a meeting.
 */
export async function GET(_req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const active = getActiveSession(id);

  const meeting = await prisma.meeting.findUnique({
    where: { id },
    select: {
      nuruEnabled: true,
      nuruJoined: true,
      transcript: true,
      aiSummary: true,
      aiActionItems: true,
      aiKeyDecisions: true,
    },
  });

  return Response.json({
    isActive: !!active,
    nuruEnabled: meeting?.nuruEnabled ?? false,
    nuruJoined: meeting?.nuruJoined ?? false,
    hasTranscript: !!meeting?.transcript,
    hasSummary: !!meeting?.aiSummary,
    activeSessions: getActiveSessions().length,
  });
}
