import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyBotSignature } from "@/lib/nuru-bot/dispatch";

/**
 * POST /api/meetings/[id]/nuru/error
 * Bot service couldn't start the session. Mark the meeting accordingly so
 * the organiser can see what happened.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ts = req.headers.get("x-bot-timestamp");
  const sig = req.headers.get("x-bot-signature");
  const raw = await req.text();
  if (!verifyBotSignature(raw, ts, sig)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const { id } = await params;
  const body = JSON.parse(raw || "{}") as { error?: string };

  await prisma.meeting.update({
    where: { id },
    data: {
      nuruJoined: false,
      // Don't change top-level status - the meeting itself may still happen,
      // just without the bot. Stash error in aiSummary as a fallback note.
      aiSummary: body.error
        ? `Nuru bot could not join: ${body.error.slice(0, 500)}`
        : "Nuru bot could not join.",
    },
  });

  return NextResponse.json({ ok: true });
}
