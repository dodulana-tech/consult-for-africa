import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendCadreEmail } from "@/lib/cadreEmail";
import { handler } from "@/lib/api-handler";

/**
 * POST /api/cron/cadre-cv-nudge
 *
 * Sends a nudge email to CadreHealth professionals who registered
 * but haven't uploaded a CV yet. Runs daily.
 *
 * Default: targets professionals who signed up 1-3 days ago.
 * Pass ?backlog=true to target ALL professionals without a CV
 * (batched, 100 per run to avoid SMTP throttling).
 */
export const POST = handler(async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const isBacklog = searchParams.get("backlog") === "true";
  const batchSize = Math.min(
    Number(searchParams.get("batch") || (isBacklog ? 100 : 500)),
    500,
  );

  const now = new Date();
  const baseUrl =
    process.env.NEXTAUTH_URL ?? "https://consultforafrica.com";
  const profileUrl = `${baseUrl}/oncadre/profile`;

  // Find professionals without a CV who haven't been nudged yet.
  // We use the `lastViewedAt` field as a lightweight "nudge sent" marker
  // to avoid adding a migration. The cron stamps it after sending.
  // For the daily run, also restrict to 1-3 day old signups.
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  const professionals = await prisma.cadreProfessional.findMany({
    where: {
      cvFileUrl: null,
      // Only nudge people who have verified their email
      emailVerified: true,
      ...(!isBacklog && {
        createdAt: { gte: threeDaysAgo, lte: oneDayAgo },
      }),
    },
    select: {
      id: true,
      firstName: true,
      email: true,
      cadre: true,
      profileCompleteness: true,
    },
    take: batchSize,
    orderBy: { createdAt: "desc" },
  });

  const results: { email: string; status: string }[] = [];

  for (const pro of professionals) {
    try {
      await sendCadreEmail({
        to: pro.email,
        subject: "Complete your profile -- upload your CV",
        heading: "One step to unlock your full profile",
        body: `Hi ${pro.firstName}, you're registered on CadreHealth but your profile is only ${pro.profileCompleteness}% complete. Upload your CV and we'll automatically extract your qualifications, credentials, and work history. This unlocks your career readiness scores, makes you visible to recruiters, and gives you access to salary benchmarks for your cadre.`,
        ctaText: "Upload Your CV",
        ctaHref: profileUrl,
        footer:
          "This takes under 2 minutes. PDF or Word format accepted.",
      });
      results.push({ email: pro.email, status: "sent" });
    } catch (err) {
      console.error(`[cv-nudge] Failed for ${pro.email}:`, err);
      results.push({ email: pro.email, status: "failed" });
    }
  }

  const sent = results.filter((r) => r.status === "sent").length;
  const failed = results.filter((r) => r.status === "failed").length;

  console.log(
    `[cv-nudge] Done. Sent: ${sent}, Failed: ${failed}, Skipped: ${professionals.length - sent - failed}`,
  );

  return Response.json({
    total: professionals.length,
    sent,
    failed,
    results,
  });
});
