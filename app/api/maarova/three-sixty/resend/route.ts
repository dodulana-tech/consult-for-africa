import { getMaarovaSession } from "@/lib/maarovaAuth";
import { prisma } from "@/lib/prisma";
import { email360RaterInvite } from "@/lib/email";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

/**
 * POST /api/maarova/three-sixty/resend
 * Resend a 360 feedback invite email to a rater.
 */
export const POST = handler(async function POST(req: NextRequest) {
  const session = await getMaarovaSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { inviteId } = await req.json();

  if (!inviteId) {
    return Response.json({ error: "inviteId is required" }, { status: 400 });
  }

  const invite = await prisma.maarova360RaterInvite.findUnique({
    where: { id: inviteId },
    include: {
      request: { select: { subjectId: true } },
    },
  });

  if (!invite) {
    return Response.json({ error: "Invite not found" }, { status: 404 });
  }

  // Verify the invite belongs to the current user's 360 request
  if (invite.request.subjectId !== session.sub) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  if (invite.status !== "INVITED") {
    return Response.json({ error: "Can only resend to invites with INVITED status" }, { status: 400 });
  }

  // Fetch subject name for the email
  const subject = await prisma.maarovaUser.findUnique({
    where: { id: session.sub },
    select: { name: true },
  });

  try {
    await email360RaterInvite({
      raterEmail: invite.raterEmail,
      raterName: invite.raterName,
      subjectName: subject?.name ?? "a colleague",
      role: invite.role,
      token: invite.token,
    });
  } catch (err) {
    console.error("Failed to resend 360 rater invite:", err);
    return Response.json({ error: "Failed to send email. Please try again." }, { status: 500 });
  }

  return Response.json({ ok: true, message: `Invite resent to ${invite.raterEmail}` });
});
