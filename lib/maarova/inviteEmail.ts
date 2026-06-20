import { prisma } from "@/lib/prisma";
import { emailMaarovaInvite } from "@/lib/email";

/**
 * Send a Maarova invite email and record the outcome on the MaarovaUser row.
 *
 * Awaited rather than fire-and-forget so the send completes before the
 * serverless function tears down, and so the result is visible in the DB
 * (inviteEmailStatus / inviteEmailSentAt / inviteEmailError). Never throws:
 * returns the outcome so callers can surface it without failing the request.
 */
export async function sendMaarovaInviteAndRecord(args: {
  userId: string;
  email: string;
  name: string;
  organisationName: string;
  password: string;
}): Promise<{ sent: boolean; error?: string }> {
  try {
    await emailMaarovaInvite({
      email: args.email,
      name: args.name,
      organisationName: args.organisationName,
      password: args.password,
    });
    await prisma.maarovaUser.update({
      where: { id: args.userId },
      data: {
        inviteEmailStatus: "SENT",
        inviteEmailSentAt: new Date(),
        inviteEmailError: null,
      },
    });
    return { sent: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[maarova] invite email error for ${args.email}:`, err);
    // Best-effort status write; don't let a logging failure mask the send error.
    await prisma.maarovaUser
      .update({
        where: { id: args.userId },
        data: { inviteEmailStatus: "FAILED", inviteEmailError: msg.slice(0, 1000) },
      })
      .catch(() => {});
    return { sent: false, error: msg };
  }
}
