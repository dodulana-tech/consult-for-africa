import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { emailMaarovaInviteRaters } from "@/lib/email";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://consultforafrica.com";

/**
 * POST /api/admin/maarova/users/[userId]/trigger-360
 *
 * Admin-triggered 360 request:
 *  1. Creates (or reuses) a Maarova360Request in COLLECTING state
 *  2. Sends the leader the "your report is incomplete - invite raters" email
 *
 * Used to drive 360 completion for leaders who finished their assessment but
 * haven't started the 360 process yet.
 */
export const POST = handler(async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await params;

  const user = await prisma.maarovaUser.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      sessions: {
        where: { status: "COMPLETED" },
        orderBy: { completedAt: "desc" },
        take: 1,
        select: { id: true },
      },
    },
  });
  if (!user) return NextResponse.json({ error: "Maarova user not found" }, { status: 404 });
  if (user.sessions.length === 0) {
    return NextResponse.json(
      { error: "User has no completed assessment session - they need to finish the core modules first" },
      { status: 400 },
    );
  }

  // Create or reuse 360 request
  let request = await prisma.maarova360Request.findFirst({
    where: { subjectId: userId, status: { in: ["COLLECTING", "PROCESSING"] } },
  });
  let created = false;
  if (!request) {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 14);
    request = await prisma.maarova360Request.create({
      data: {
        subjectId: userId,
        deadline,
        minRaters: 5,
        status: "COLLECTING",
      },
    });
    created = true;
  }

  // Send the prompt email
  let emailSent = false;
  try {
    await emailMaarovaInviteRaters({
      email: user.email,
      name: user.name,
      reportUrl: `${BASE_URL}/maarova/portal/results/${user.sessions[0].id}`,
      inviteUrl: `${BASE_URL}/maarova/portal/three-sixty`,
    });
    emailSent = true;
    await prisma.maarova360Request.update({
      where: { id: request.id },
      data: { lastReminderSentAt: new Date() },
    });
  } catch (err) {
    console.error("[trigger-360] email failed:", err);
  }

  return NextResponse.json({
    ok: true,
    requestId: request.id,
    requestCreated: created,
    emailSent,
    user: { id: user.id, name: user.name, email: user.email },
  });
});
