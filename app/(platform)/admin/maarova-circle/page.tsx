import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import ApplicationActions from "./ApplicationActions";
import BackfillCvButton from "./BackfillCvButton";
import RemindUnredeemedButton from "./RemindUnredeemedButton";

export const dynamic = "force-dynamic";

const TOTAL_SLOTS = 50;

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  PENDING_REVIEW: { bg: "#FFFBEB", text: "#92400E", label: "Needs review" },
  APPROVED: { bg: "#ECFDF5", text: "#065F46", label: "Approved" },
  DECLINED: { bg: "#FEF2F2", text: "#991B1B", label: "Declined" },
  WAITLISTED: { bg: "#EFF6FF", text: "#1E40AF", label: "Waitlisted" },
  COMPLETED: { bg: "#F0FDF4", text: "#166534", label: "Completed" },
  EXPIRED: { bg: "#F1F5F9", text: "#475569", label: "Expired" },
};

export default async function MaarovaCircleAdminPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const allowed = ["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!allowed) redirect("/dashboard");

  const [applications, counts] = await Promise.all([
    prisma.maarovaCircleApplication.findMany({
      orderBy: [{ createdAt: "desc" }],
      take: 200,
    }),
    prisma.maarovaCircleApplication.groupBy({
      by: ["status"],
      _count: true,
    }),
  ]);

  // Lookup outreach targets to surface assessment progress
  const targetIds = applications.map((a) => a.outreachTargetId).filter(Boolean) as string[];
  const targets = targetIds.length
    ? await prisma.outreachTarget.findMany({
        where: { id: { in: targetIds } },
        include: {
          campaign: { select: { id: true, name: true } },
        },
      })
    : [];
  const targetById = new Map(targets.map((t) => [t.id, t]));

  // Lookup MaarovaUsers by email to find assessment + report
  const maarovaUsers = await prisma.maarovaUser.findMany({
    where: { email: { in: applications.map((a) => a.email) } },
    select: {
      email: true,
      id: true,
      lastLoginAt: true,
      sessions: {
        orderBy: { startedAt: "desc" },
        take: 1,
        select: { id: true, status: true, startedAt: true, completedAt: true },
      },
      reports: {
        orderBy: { generatedAt: "desc" },
        take: 1,
        select: { id: true, status: true, generatedAt: true, deliveredAt: true, pdfUrl: true },
      },
    },
  });
  const userByEmail = new Map(maarovaUsers.map((u) => [u.email, u]));

  const total = applications.length;
  const counter = (status: string) => counts.find((c) => c.status === status)?._count ?? 0;

  const approved = counter("APPROVED") + counter("COMPLETED");
  const slotsLeft = Math.max(0, TOTAL_SLOTS - approved);

  return (
    <main className="min-h-screen p-6 md:p-10" style={{ background: "#F8F9FB" }}>
      <div className="max-w-7xl mx-auto">
        <Link href="/admin" className="text-xs text-gray-500 hover:text-gray-900">← Admin</Link>

        <div className="mt-3 flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#0F2744" }}>Maarova Founding Circle</h1>
            <p className="text-sm text-gray-500 mt-1">
              50 free assessments for healthcare leaders. Public application funnel.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <BackfillCvButton />
            <RemindUnredeemedButton />
            <Link
              href="/admin/maarova-circle/coaching-blast"
              className="rounded-lg border px-3 py-2 text-xs font-medium hover:bg-white"
              style={{ borderColor: "#E8EBF0", color: "#0F2744" }}
            >
              Send June coaching reminder
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { label: "Slots remaining", value: `${slotsLeft} / ${TOTAL_SLOTS}`, accent: "#D4AF37" },
            { label: "Total applications", value: total },
            { label: "Needs review", value: counter("PENDING_REVIEW"), accent: "#92400E" },
            { label: "Approved", value: counter("APPROVED"), accent: "#065F46" },
            { label: "Declined", value: counter("DECLINED"), accent: "#991B1B" },
            { label: "Completed", value: counter("COMPLETED"), accent: "#166534" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border bg-white p-4" style={{ borderColor: "#E8EBF0" }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">{stat.label}</p>
              <p className="text-xl font-bold" style={{ color: stat.accent || "#0F2744" }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Applications */}
        <div className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">All applications</h2>
          {applications.length === 0 ? (
            <div className="rounded-2xl border bg-white p-12 text-center" style={{ borderColor: "#E8EBF0" }}>
              <p className="text-sm text-gray-500">No applications yet. Share the LinkedIn post.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => {
                const style = STATUS_STYLES[app.status] || STATUS_STYLES.PENDING_REVIEW;
                const target = app.outreachTargetId ? targetById.get(app.outreachTargetId) : null;
                const user = userByEmail.get(app.email);
                const session = user?.sessions[0];
                const report = user?.reports[0];

                let funnelStage = "Applied";
                if (app.status === "DECLINED") funnelStage = "Declined";
                else if (app.status === "WAITLISTED") funnelStage = "Waitlisted";
                else if (app.status === "PENDING_REVIEW") funnelStage = "Awaiting review";
                else if (app.status === "APPROVED" && !user) funnelStage = "Invited (not started)";
                else if (user && !session) funnelStage = "Account created";
                else if (session && session.status !== "COMPLETED") funnelStage = "Assessment in progress";
                else if (session?.status === "COMPLETED" && !report) funnelStage = "Assessment done, report generating";
                else if (report?.status === "DELIVERED" || report?.deliveredAt) funnelStage = "Report delivered";
                else if (report) funnelStage = "Report ready";

                return (
                  <div key={app.id} className="rounded-2xl border bg-white p-5" style={{ borderColor: "#E8EBF0" }}>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold" style={{ color: "#0F2744" }}>
                            {app.firstName} {app.lastName}
                          </h3>
                          <span
                            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                            style={{ background: style.bg, color: style.text }}
                          >
                            {style.label}
                          </span>
                          {app.aiScore != null && (
                            <span
                              className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                              style={{
                                background: app.aiScore >= 75 ? "#ECFDF5" : app.aiScore >= 40 ? "#FFFBEB" : "#FEF2F2",
                                color: app.aiScore >= 75 ? "#065F46" : app.aiScore >= 40 ? "#92400E" : "#991B1B",
                              }}
                            >
                              Score {app.aiScore}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {app.currentRole} · {app.currentEmployer}
                          {app.city && ` · ${app.city}`}
                          {app.country && `, ${app.country}`}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {app.email} · <a className="underline" href={app.linkedinUrl} target="_blank" rel="noopener">LinkedIn</a>
                          {app.cvFileUrl && (
                            <>
                              {" · "}
                              <a className="underline" href={app.cvFileUrl} target="_blank" rel="noopener">CV</a>
                            </>
                          )}
                        </p>
                      </div>
                      <div className="text-right text-[10px] uppercase tracking-wider text-gray-400">
                        <div>Applied {new Date(app.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
                        <div className="mt-1 font-semibold" style={{ color: "#D4AF37" }}>{funnelStage}</div>
                      </div>
                    </div>

                    {app.aiSummary && (
                      <div className="mt-3 rounded-xl p-3 text-xs leading-relaxed text-gray-700" style={{ background: "#F8F9FB" }}>
                        <p>{app.aiSummary}</p>
                        {app.aiStrengths.length > 0 && (
                          <div className="mt-2">
                            <strong className="text-gray-900">Strengths:</strong> {app.aiStrengths.join(", ")}
                          </div>
                        )}
                        {app.aiConcerns.length > 0 && (
                          <div className="mt-1">
                            <strong className="text-gray-900">Concerns:</strong> {app.aiConcerns.join(", ")}
                          </div>
                        )}
                      </div>
                    )}

                    {app.declineReason && (
                      <div className="mt-3 rounded-xl bg-red-50 p-3 text-xs text-red-800">
                        <strong>Decline reason:</strong> {app.declineReason}
                      </div>
                    )}

                    {/* Funnel pills */}
                    <div className="mt-3 flex items-center gap-2 flex-wrap text-[10px]">
                      {target && (
                        <Link
                          href={`/admin/outreach/${target.campaignId}`}
                          className="rounded-full px-2.5 py-0.5 font-semibold"
                          style={{ background: "#EFF6FF", color: "#1E40AF" }}
                        >
                          In campaign: {target.campaign.name}
                        </Link>
                      )}
                      {user && (
                        <span className="rounded-full px-2.5 py-0.5 font-semibold" style={{ background: "#F0FDF4", color: "#166534" }}>
                          Account created
                        </span>
                      )}
                      {session && (
                        <span className="rounded-full px-2.5 py-0.5 font-semibold" style={{ background: "#ECFDF5", color: "#065F46" }}>
                          Session: {session.status}
                        </span>
                      )}
                      {report && (
                        <a
                          href={report.pdfUrl ?? "#"}
                          className="rounded-full px-2.5 py-0.5 font-semibold underline"
                          style={{ background: "#FFFBEB", color: "#92400E" }}
                          target="_blank"
                          rel="noopener"
                        >
                          Report: {report.status}
                        </a>
                      )}
                      {app.coachingDiscountCode && (
                        <span className="rounded-full px-2.5 py-0.5 font-mono" style={{ background: "#F1F5F9", color: "#475569" }}>
                          Code: {app.coachingDiscountCode}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    {app.status === "PENDING_REVIEW" && (
                      <ApplicationActions applicationId={app.id} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
