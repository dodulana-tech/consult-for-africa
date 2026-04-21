import { NextRequest } from "next/server";
import { getDigestRecipients, getDigestForUser } from "@/lib/weeklyDigest";
import { emailWeeklyDigest } from "@/lib/email";
import { handler } from "@/lib/api-handler";

export const POST = handler(async function POST(req: NextRequest) {
  // Verify cron secret to prevent unauthorized triggering
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const recipients = await getDigestRecipients();
  const results: { email: string; status: string }[] = [];

  for (const recipient of recipients) {
    try {
      const digest = await getDigestForUser(recipient.id);
      if (!digest) {
        results.push({ email: recipient.email, status: "skipped (no data)" });
        continue;
      }

      await emailWeeklyDigest({
        email: digest.userEmail,
        name: digest.userName,
        role: digest.userRole,
        activeProjects: digest.activeProjects,
        atRiskProjects: digest.atRiskProjects,
        completedThisWeek: digest.completedThisWeek,
        overdueDeliverables: digest.overdueDeliverables,
        pendingTimesheets: digest.pendingTimesheets,
        hoursSubmittedThisWeek: digest.hoursSubmittedThisWeek,
        deliverablesSubmitted: digest.deliverablesSubmitted,
        deliverablesApproved: digest.deliverablesApproved,
        deliverablesNeedingRevision: digest.deliverablesNeedingRevision,
        totalConsultants: digest.totalConsultants,
        avgUtilization: digest.avgUtilization,
        invoicesSentThisWeek: digest.invoicesSentThisWeek,
        invoicesSentAmount: digest.invoicesSentAmount,
        outstandingAmount: digest.outstandingAmount,
        collectedThisWeek: digest.collectedThisWeek,
        newReferrals: digest.newReferrals,
        proposalsSent: digest.proposalsSent,
        newApplications: digest.newApplications,
        consultantsOnboarded: digest.consultantsOnboarded,
        avgSatisfaction: digest.avgSatisfaction,
        expansionRequests: digest.expansionRequests,
        referralUpdates: digest.referralUpdates,
        nuruInsight: digest.nuruInsight,
      });

      results.push({ email: recipient.email, status: "sent" });
    } catch (err) {
      console.error(`[weekly-digest] Failed for ${recipient.email}:`, err);
      results.push({ email: recipient.email, status: "failed" });
    }
  }

  return Response.json({
    ok: true,
    sent: results.filter((r) => r.status === "sent").length,
    total: recipients.length,
    results,
  });
});
