import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyBotSignature } from "@/lib/nuru-bot/dispatch";

/**
 * POST /api/meetings/[id]/nuru/start
 * Bot service notifies us that it has joined the meeting.
 * Body: { startedAt: ISO }
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ts = req.headers.get("x-bot-timestamp");
  const sig = req.headers.get("x-bot-signature");
  const raw = await req.text();
  if (!verifyBotSignature(raw, ts, sig)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const { id } = await params;
  const body = JSON.parse(raw || "{}") as { startedAt?: string };
  const startedAt = body.startedAt ? new Date(body.startedAt) : new Date();

  await prisma.meeting.update({
    where: { id },
    data: { nuruJoined: true, status: "IN_PROGRESS", startedAt },
  });

  return NextResponse.json({ ok: true });
}
