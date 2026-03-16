import { prisma } from "@/lib/prisma";
import { getClientPortalSession } from "@/lib/clientPortalAuth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import ClientPortalLogoutButton from "@/components/client-portal/LogoutButton";
import ClientProjectNav from "@/components/client-portal/ClientProjectNav";

/* ─── Style Maps ─────────────────────────────────────────────────────────────── */

const DELIVERABLE_STATUS_STYLES: Record<
  string,
  { bg: string; color: string; label: string }
> = {
  DRAFT:               { bg: "#F3F4F6", color: "#6B7280", label: "Draft" },
  SUBMITTED:           { bg: "#FEF3C7", color: "#92400E", label: "Submitted" },
  IN_REVIEW:           { bg: "#DBEAFE", color: "#1D4ED8", label: "In Review" },
  NEEDS_REVISION:      { bg: "#FEE2E2", color: "#991B1B", label: "Revision Requested" },
  APPROVED:            { bg: "#D1FAE5", color: "#065F46", label: "Approved" },
  DELIVERED_TO_CLIENT: { bg: "#DCFCE7", color: "#166534", label: "Delivered" },
};

/* ─── Helpers ────────────────────────────────────────────────────────────────── */

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

/* ─── Page ───────────────────────────────────────────────────────────────────── */

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getClientPortalSession();
  if (!session) redirect("/client/login");

  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    select: { id: true, name: true, clientId: true },
  });

  if (!project) notFound();

  if (project.clientId !== session.clientId) {
    redirect("/client/dashboard");
  }

  // Fetch deliverables visible to client
  const deliverables = await prisma.deliverable.findMany({
    where: {
      projectId: id,
      OR: [
        { clientVisible: true },
        { status: { in: ["APPROVED", "DELIVERED_TO_CLIENT"] } },
      ],
    },
    include: {
      versions: {
        orderBy: { versionNumber: "desc" },
        select: {
          id: true,
          versionNumber: true,
          fileUrl: true,
          fileName: true,
          changeNotes: true,
          submittedAt: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const totalDocuments = deliverables.length;
  const totalVersions = deliverables.reduce(
    (sum, d) => sum + d.versions.length,
    0
  );

  return (
    <div className="min-h-screen" style={{ background: "#F8FAFB" }}>
      {/* Top Nav */}
      <header
        className="bg-white sticky top-0 z-10"
        style={{ borderBottom: "1px solid #e5eaf0" }}
      >
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-cfa.png" alt="CFA" style={{ height: 28, width: "auto" }} />
            <span
              className="text-sm font-semibold"
              style={{ color: "#0F2744" }}
            >
              Client Portal
            </span>
            <span className="text-gray-300 text-sm">/</span>
            <Link
              href="/client/dashboard"
              className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              Projects
            </Link>
            <span className="text-gray-300 text-sm">/</span>
            <Link
              href={`/client/projects/${id}`}
              className="text-sm text-gray-500 hover:text-gray-800 transition-colors truncate max-w-[140px]"
            >
              {project.name}
            </Link>
            <span className="text-gray-300 text-sm">/</span>
            <span
              className="text-sm font-medium"
              style={{ color: "#0F2744" }}
            >
              Documents
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{session.name}</span>
            <ClientPortalLogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Back link */}
        <Link
          href={`/client/projects/${id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-80"
          style={{ color: "#0F2744" }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 12L6 8L10 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to project
        </Link>

        <ClientProjectNav projectId={id} current="/documents" />

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#0F2744" }}>
            Documents
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Document repository for {project.name}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div
            className="bg-white rounded-xl px-5 py-4 relative overflow-hidden"
            style={{ border: "1px solid #e5eaf0" }}
          >
            <div
              className="absolute top-0 left-0 w-full h-0.5"
              style={{ background: "#0F2744" }}
            />
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">
              Total Documents
            </p>
            <p className="text-2xl font-bold" style={{ color: "#0F2744" }}>
              {totalDocuments}
            </p>
          </div>
          <div
            className="bg-white rounded-xl px-5 py-4 relative overflow-hidden"
            style={{ border: "1px solid #e5eaf0" }}
          >
            <div
              className="absolute top-0 left-0 w-full h-0.5"
              style={{ background: "#D4AF37" }}
            />
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">
              Total Versions
            </p>
            <p className="text-2xl font-bold" style={{ color: "#D4AF37" }}>
              {totalVersions}
            </p>
          </div>
        </div>

        {/* Document List */}
        {deliverables.length === 0 ? (
          <div
            className="bg-white rounded-2xl p-12 text-center"
            style={{ border: "1px solid #e5eaf0" }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              className="mx-auto mb-4"
            >
              <path
                d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                stroke="#CBD5E1"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points="14 2 14 8 20 8"
                stroke="#CBD5E1"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="text-sm text-gray-500 font-medium mb-1">
              No documents available yet
            </p>
            <p className="text-xs text-gray-400">
              Documents will appear here as deliverables are approved and shared with you.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {deliverables.map((d) => {
              const dStyle =
                DELIVERABLE_STATUS_STYLES[d.status] ??
                DELIVERABLE_STATUS_STYLES.DRAFT;

              return (
                <details
                  key={d.id}
                  className="group bg-white rounded-2xl overflow-hidden"
                  style={{ border: "1px solid #e5eaf0" }}
                >
                  <summary className="cursor-pointer px-6 py-5 list-none">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          {/* Document icon */}
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            className="shrink-0"
                          >
                            <path
                              d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                              stroke="#0F2744"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <polyline
                              points="14 2 14 8 20 8"
                              stroke="#0F2744"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <p
                            className="text-sm font-medium"
                            style={{ color: "#0F2744" }}
                          >
                            {d.name}
                          </p>
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                            style={{
                              background: dStyle.bg,
                              color: dStyle.color,
                            }}
                          >
                            {dStyle.label}
                          </span>
                        </div>
                        {d.description && (
                          <p className="text-xs text-gray-500 mt-1.5 max-w-lg leading-relaxed ml-[30px]">
                            {d.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap ml-[30px]">
                          {d.dueDate && (
                            <span className="text-[11px] text-gray-400">
                              Due: {formatDate(d.dueDate)}
                            </span>
                          )}
                          <span className="text-[11px] text-gray-400">
                            Updated: {formatDate(d.updatedAt)}
                          </span>
                          {d.versions.length > 0 && (
                            <span className="text-[11px] text-gray-400">
                              {d.versions.length} version{d.versions.length !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {d.fileUrl && (
                          <a
                            href={d.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-opacity hover:opacity-90"
                            style={{
                              background: "#0F2744",
                              color: "#fff",
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <path
                                d="M7 2v7.5M7 9.5L4.5 7M7 9.5L9.5 7M3 11.5h8"
                                stroke="currentColor"
                                strokeWidth="1.25"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            Download
                          </a>
                        )}
                        {/* Expand chevron */}
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          className="transition-transform group-open:rotate-180"
                        >
                          <path
                            d="M4 6L8 10L12 6"
                            stroke="#94A3B8"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </div>
                  </summary>

                  {/* Expanded version history */}
                  {d.versions.length > 0 && (
                    <div
                      className="px-6 pb-5 pt-1"
                      style={{ borderTop: "1px solid #e5eaf0" }}
                    >
                      <p
                        className="text-xs font-semibold mb-3 mt-3"
                        style={{ color: "#0F2744" }}
                      >
                        Version History
                      </p>
                      <div className="space-y-0">
                        {d.versions.map((v, vIdx) => {
                          const isLatest = vIdx === 0;
                          const isLast = vIdx === d.versions.length - 1;

                          return (
                            <div key={v.id} className="flex gap-3">
                              {/* Timeline */}
                              <div className="flex flex-col items-center">
                                <div
                                  className="w-2.5 h-2.5 rounded-full mt-1 shrink-0"
                                  style={{
                                    background: isLatest ? "#D4AF37" : "#e5eaf0",
                                  }}
                                />
                                {!isLast && (
                                  <div
                                    className="w-0.5 flex-1 my-0.5"
                                    style={{
                                      background: "#e5eaf0",
                                      minHeight: "16px",
                                    }}
                                  />
                                )}
                              </div>

                              {/* Version content */}
                              <div className="flex-1 pb-3">
                                <div className="flex items-start justify-between gap-3 flex-wrap">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span
                                        className="text-xs font-medium"
                                        style={{ color: "#0F2744" }}
                                      >
                                        v{v.versionNumber}
                                      </span>
                                      {v.fileName && (
                                        <span className="text-[11px] text-gray-500">
                                          {v.fileName}
                                        </span>
                                      )}
                                      {isLatest && (
                                        <span
                                          className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                                          style={{
                                            background: "#D1FAE5",
                                            color: "#065F46",
                                          }}
                                        >
                                          Latest
                                        </span>
                                      )}
                                    </div>
                                    {v.changeNotes && (
                                      <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                                        {v.changeNotes}
                                      </p>
                                    )}
                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                      {formatDateTime(v.submittedAt)}
                                    </p>
                                  </div>
                                  {v.fileUrl && (
                                    <a
                                      href={v.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-md transition-opacity hover:opacity-90 shrink-0"
                                      style={{
                                        background: "#F8FAFB",
                                        color: "#0F2744",
                                        border: "1px solid #e5eaf0",
                                      }}
                                    >
                                      <svg
                                        width="10"
                                        height="10"
                                        viewBox="0 0 14 14"
                                        fill="none"
                                      >
                                        <path
                                          d="M7 2v7.5M7 9.5L4.5 7M7 9.5L9.5 7M3 11.5h8"
                                          stroke="currentColor"
                                          strokeWidth="1.25"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                      </svg>
                                      Download
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {d.versions.length === 0 && (
                    <div
                      className="px-6 pb-5 pt-3"
                      style={{ borderTop: "1px solid #e5eaf0" }}
                    >
                      <p className="text-xs text-gray-400 text-center py-2">
                        No version history available.
                      </p>
                    </div>
                  )}
                </details>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
