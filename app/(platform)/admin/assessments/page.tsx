import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/platform/TopBar";

function scoreColor(score: number | null): string {
  if (score === null) return "#94A3B8";
  if (score >= 70) return "#16a34a";
  if (score >= 40) return "#d97706";
  return "#dc2626";
}

function scoreBg(score: number | null): string {
  if (score === null) return "#f1f5f9";
  if (score >= 70) return "#f0fdf4";
  if (score >= 40) return "#fffbeb";
  return "#fef2f2";
}

export default async function AdminAssessmentsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const isAdmin = ["PARTNER", "ADMIN", "DIRECTOR"].includes(session.user.role);
  if (!isAdmin) redirect("/dashboard");

  const assessments = await prisma.consultantAssessment.findMany({
    where: { status: "COMPLETED" },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      responses: {
        select: { pasteEvents: true, tabSwitches: true },
      },
    },
    orderBy: { completedAt: "desc" },
  });

  const rows = assessments.map((a) => {
    const totalPastes = a.responses.reduce((sum, r) => sum + r.pasteEvents, 0);
    const totalTabs = a.responses.reduce((sum, r) => sum + r.tabSwitches, 0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const breakdown = a.aiBreakdown as Record<string, any> | null;
    const flagCount = breakdown?.redFlags?.length ?? 0;

    return {
      id: a.id,
      name: a.user.name,
      email: a.user.email,
      specialty: a.specialty,
      completedAt: a.completedAt?.toISOString() ?? null,
      aiContentScore: a.aiContentScore,
      aiIntegrityScore: a.aiIntegrityScore,
      flagCount,
      totalTabs,
      totalPastes,
      hasVideo: !!a.videoUrl,
      adminScore: a.adminScore,
      adminTier: a.adminTier,
    };
  });

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar
        title="Assessment Reviews"
        subtitle={`${rows.length} completed assessment${rows.length === 1 ? "" : "s"} awaiting review`}
      />
      <main className="flex-1 overflow-y-auto p-6">
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: "#fff", border: "1px solid #e5eaf0" }}
        >
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e5eaf0" }}>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: "#0F2744" }}>
                  Candidate
                </th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: "#0F2744" }}>
                  Specialty
                </th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: "#0F2744" }}>
                  Completed
                </th>
                <th className="text-center px-4 py-3 font-semibold" style={{ color: "#0F2744" }}>
                  Content
                </th>
                <th className="text-center px-4 py-3 font-semibold" style={{ color: "#0F2744" }}>
                  Integrity
                </th>
                <th className="text-center px-4 py-3 font-semibold" style={{ color: "#0F2744" }}>
                  Flags
                </th>
                <th className="text-center px-4 py-3 font-semibold" style={{ color: "#0F2744" }}>
                  Tabs / Pastes
                </th>
                <th className="text-center px-4 py-3 font-semibold" style={{ color: "#0F2744" }}>
                  Video
                </th>
                <th className="text-center px-4 py-3 font-semibold" style={{ color: "#0F2744" }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                    No completed assessments to review.
                  </td>
                </tr>
              )}
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-gray-50 transition-colors"
                  style={{ borderBottom: "1px solid #e5eaf0" }}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{row.name}</p>
                    <p className="text-xs text-gray-400">{row.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {row.specialty.replace(/_/g, " ")}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {row.completedAt
                      ? new Date(row.completedAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "N/A"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{
                        color: scoreColor(row.aiContentScore),
                        background: scoreBg(row.aiContentScore),
                      }}
                    >
                      {row.aiContentScore ?? "Pending"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{
                        color: scoreColor(row.aiIntegrityScore),
                        background: scoreBg(row.aiIntegrityScore),
                      }}
                    >
                      {row.aiIntegrityScore ?? "Pending"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.flagCount > 0 ? (
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ color: "#dc2626", background: "#fef2f2" }}
                      >
                        {row.flagCount}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-gray-500">
                    {row.totalTabs} / {row.totalPastes}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.hasVideo ? (
                      <span className="text-xs font-medium" style={{ color: "#16a34a" }}>
                        Yes
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">No video</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.adminTier === "REJECT" ? (
                      <Link
                        href={`/admin/assessments/${row.id}`}
                        className="inline-block px-3 py-1.5 rounded-lg text-xs font-semibold"
                        style={{ background: "#fef2f2", color: "#dc2626" }}
                      >
                        Rejected
                      </Link>
                    ) : row.adminScore ? (
                      <Link
                        href={`/admin/assessments/${row.id}`}
                        className="inline-block px-3 py-1.5 rounded-lg text-xs font-semibold"
                        style={{ background: "#f0fdf4", color: "#16a34a" }}
                      >
                        Approved ({row.adminTier})
                      </Link>
                    ) : (
                      <Link
                        href={`/admin/assessments/${row.id}`}
                        className="inline-block px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                        style={{ background: "#0F2744" }}
                      >
                        Review
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </main>
    </div>
  );
}
