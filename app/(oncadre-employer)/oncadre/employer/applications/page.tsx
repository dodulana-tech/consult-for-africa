import { redirect } from "next/navigation";
import { getCadreEmployerSession } from "@/lib/cadreEmployerAuth";
import { prisma } from "@/lib/prisma";
import { getCadreLabel } from "@/lib/cadreHealth/cadres";
import Link from "next/link";

const MANDATE_TYPE_LABELS: Record<string, string> = {
  PERMANENT: "Permanent",
  LOCUM: "Locum",
  CONTRACT: "Contract",
  CONSULTING: "Consulting",
  INTERNATIONAL: "International",
};

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  OPEN: { bg: "rgba(16,185,129,0.08)", color: "#059669" },
  PAUSED: { bg: "rgba(245,158,11,0.08)", color: "#D97706" },
  CLOSED: { bg: "rgba(107,114,128,0.08)", color: "#6B7280" },
  FILLED: { bg: "rgba(99,102,241,0.08)", color: "#4F46E5" },
};

export default async function EmployerApplicationsPage() {
  const session = await getCadreEmployerSession();
  if (!session) redirect("/oncadre/employer/login");

  const mandates = await prisma.cadreMandate.findMany({
    where: {
      facilityId: session.facilityId || undefined,
      facilityName: session.facilityId ? undefined : session.companyName,
    },
    select: {
      id: true,
      title: true,
      cadre: true,
      type: true,
      status: true,
      locationState: true,
      applicationCount: true,
      isPublished: true,
      createdAt: true,
      _count: { select: { matches: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="font-bold text-gray-900"
          style={{ fontSize: "clamp(1.4rem, 3vw, 1.8rem)" }}
        >
          Applications
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          View and manage applicants for your posted roles.
        </p>
      </div>

      {mandates.length === 0 ? (
        <div
          className="rounded-2xl bg-white p-8 text-center"
          style={{
            border: "1px solid #E8EBF0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
          }}
        >
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: "rgba(11,60,93,0.06)" }}
          >
            <svg className="h-7 w-7 text-[#0B3C5D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="mt-4 font-semibold text-gray-900">No roles posted yet</h3>
          <p className="mt-2 text-sm text-gray-500">
            Post a role to start receiving applications from healthcare professionals.
          </p>
          <Link
            href="/oncadre/employer/post-role"
            className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #0B3C5D, #0E4D6E)",
              boxShadow: "0 2px 8px rgba(11,60,93,0.25)",
            }}
          >
            Post a Role
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {mandates.map((mandate) => {
            const statusStyle = STATUS_STYLES[mandate.status] || STATUS_STYLES.OPEN;
            return (
              <Link
                key={mandate.id}
                href={`/oncadre/employer/applications/${mandate.id}`}
                className="group block rounded-2xl bg-white p-5 sm:p-6 transition-all duration-200 hover:scale-[1.005]"
                style={{
                  border: "1px solid #E8EBF0",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                        style={{ background: statusStyle.bg, color: statusStyle.color }}
                      >
                        {mandate.status}
                      </span>
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                        style={{ background: "rgba(11,60,93,0.06)", color: "#0B3C5D" }}
                      >
                        {getCadreLabel(mandate.cadre)}
                      </span>
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                        style={{ background: "rgba(107,114,128,0.06)", color: "#4B5563" }}
                      >
                        {MANDATE_TYPE_LABELS[mandate.type] || mandate.type}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-[#0B3C5D] transition-colors">
                      {mandate.title}
                    </h3>
                    <p className="mt-1 text-xs text-gray-400">
                      {mandate.locationState || "Nigeria"} &middot; Posted{" "}
                      {new Date(mandate.createdAt).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div
                      className="text-2xl font-bold"
                      style={{ color: mandate._count.matches > 0 ? "#0B3C5D" : "#9CA3AF" }}
                    >
                      {mandate._count.matches}
                    </div>
                    <p className="text-[11px] text-gray-400">
                      applicant{mandate._count.matches !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
