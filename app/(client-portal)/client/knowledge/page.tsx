import { prisma } from "@/lib/prisma";
import { getClientPortalSession } from "@/lib/clientPortalAuth";
import { redirect } from "next/navigation";
import Link from "next/link";
import ClientPortalLogoutButton from "@/components/client-portal/LogoutButton";

const ASSET_TYPE_STYLES: Record<
  string,
  { bg: string; color: string; label: string }
> = {
  INSIGHT: { bg: "#EFF6FF", color: "#1D4ED8", label: "Insight" },
  FRAMEWORK: { bg: "#FEF9E7", color: "#92400E", label: "Framework" },
  TEMPLATE: { bg: "#F0FDF4", color: "#15803D", label: "Template" },
  CASE_STUDY: { bg: "#FDF2F8", color: "#9D174D", label: "Case Study" },
  LESSON_LEARNED: { bg: "#FEF3C7", color: "#78350F", label: "Lesson Learned" },
  TOOL: { bg: "#F3F4F6", color: "#374151", label: "Tool" },
  GUIDE: { bg: "#EDE9FE", color: "#5B21B6", label: "Guide" },
};

function truncate(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text || "";
  return text.slice(0, maxLength).trimEnd() + "...";
}

export default async function KnowledgeLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; q?: string }>;
}) {
  const session = await getClientPortalSession();
  if (!session) redirect("/client/login");

  const params = await searchParams;
  const filterType = params.type || "";
  const searchQuery = params.q || "";

  // Fetch client's project IDs
  const clientProjects = await prisma.project.findMany({
    where: { clientId: session.clientId },
    select: { id: true },
  });
  const projectIds = clientProjects.map((p) => p.id);

  // Build where clause: clientVisible AND (no project OR project belongs to client)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    clientVisible: true,
    OR: [
      { projectId: null },
      { projectId: { in: projectIds } },
    ],
  };

  if (filterType) {
    where.assetType = filterType;
  }

  if (searchQuery) {
    where.AND = [
      {
        OR: [
          { title: { contains: searchQuery, mode: "insensitive" } },
          { tags: { hasSome: [searchQuery.toLowerCase()] } },
        ],
      },
    ];
  }

  const assets = await prisma.knowledgeAsset.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  const client = await prisma.client.findUnique({
    where: { id: session.clientId },
    select: { name: true },
  });

  const filterOptions = [
    { value: "", label: "All Types" },
    { value: "INSIGHT", label: "Insight" },
    { value: "FRAMEWORK", label: "Framework" },
    { value: "TEMPLATE", label: "Template" },
    { value: "CASE_STUDY", label: "Case Study" },
    { value: "TOOL", label: "Tool" },
    { value: "LESSON_LEARNED", label: "Lesson Learned" },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F8FAFB" }}>
      {/* Top Nav */}
      <header
        className="bg-white sticky top-0 z-10"
        style={{ borderBottom: "1px solid #e5eaf0" }}
      >
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-cfa.png" alt="CFA" style={{ height: 28, width: "auto" }} />
            <span className="text-sm font-semibold" style={{ color: "#0F2744" }}>
              Client Portal
            </span>
            {client && (
              <>
                <span className="text-gray-300 text-sm">/</span>
                <span className="text-sm text-gray-600">{client.name}</span>
              </>
            )}
            <span className="text-gray-300 text-sm">/</span>
            <span className="text-sm text-gray-600">Knowledge Library</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/client/dashboard"
              className="text-xs font-medium hover:underline"
              style={{ color: "#0F2744" }}
            >
              Dashboard
            </Link>
            <span className="text-sm text-gray-500">{session.name}</span>
            <ClientPortalLogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 flex-1 w-full">
        {/* Page Heading */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: "#0F2744" }}>
            Knowledge Library
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Curated insights, frameworks, and resources from your engagements with Consult For Africa.
          </p>
        </div>

        {/* Filter Bar */}
        <form
          method="GET"
          className="bg-white rounded-2xl p-4 mb-6 flex flex-col sm:flex-row gap-3"
          style={{ border: "1px solid #e5eaf0" }}
        >
          <div className="flex-1">
            <input
              type="text"
              name="q"
              defaultValue={searchQuery}
              placeholder="Search by title or tag..."
              className="w-full text-sm px-4 py-2.5 rounded-lg outline-none transition-colors"
              style={{
                border: "1px solid #e5eaf0",
                color: "#0F2744",
                background: "#F8FAFB",
              }}
            />
          </div>
          <div className="flex gap-3">
            <select
              name="type"
              defaultValue={filterType}
              className="text-sm px-4 py-2.5 rounded-lg outline-none appearance-none cursor-pointer"
              style={{
                border: "1px solid #e5eaf0",
                color: "#0F2744",
                background: "#F8FAFB",
                minWidth: 160,
              }}
            >
              {filterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="text-xs font-semibold px-5 py-2.5 rounded-lg transition-colors hover:opacity-90"
              style={{ background: "#0F2744", color: "#fff" }}
            >
              Search
            </button>
            {(filterType || searchQuery) && (
              <Link
                href="/client/knowledge"
                className="text-xs font-medium px-4 py-2.5 rounded-lg flex items-center"
                style={{
                  border: "1px solid #e5eaf0",
                  color: "#6B7280",
                  background: "#fff",
                }}
              >
                Clear
              </Link>
            )}
          </div>
        </form>

        {/* Results Count */}
        <p className="text-xs text-gray-400 mb-4">
          {assets.length} asset{assets.length !== 1 ? "s" : ""} found
          {filterType && ` in ${ASSET_TYPE_STYLES[filterType]?.label || filterType}`}
          {searchQuery && ` matching "${searchQuery}"`}
        </p>

        {/* Asset Grid */}
        {assets.length === 0 ? (
          <div
            className="rounded-2xl bg-white p-16 text-center"
            style={{ border: "1px solid #e5eaf0" }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "#F8FAFB" }}
            >
              <svg
                width="24"
                height="24"
                fill="none"
                viewBox="0 0 24 24"
                stroke="#9CA3AF"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                />
              </svg>
            </div>
            <p className="text-sm font-medium" style={{ color: "#0F2744" }}>
              No knowledge assets found
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {filterType || searchQuery
                ? "Try adjusting your filters or search terms."
                : "Knowledge assets will appear here as your engagements progress."}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {assets.map((asset) => {
              const typeStyle =
                ASSET_TYPE_STYLES[asset.assetType] ?? ASSET_TYPE_STYLES.TOOL;

              return (
                <div
                  key={asset.id}
                  className="bg-white rounded-2xl p-5 flex flex-col"
                  style={{ border: "1px solid #e5eaf0" }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span
                      className="text-[11px] px-2.5 py-0.5 rounded-full font-medium shrink-0"
                      style={{ background: typeStyle.bg, color: typeStyle.color }}
                    >
                      {typeStyle.label}
                    </span>
                  </div>

                  {/* Title */}
                  <h3
                    className="text-sm font-semibold leading-snug mb-2"
                    style={{ color: "#0F2744" }}
                  >
                    {asset.title}
                  </h3>

                  {/* Content Preview */}
                  <p className="text-xs text-gray-500 leading-relaxed mb-3 flex-1">
                    {truncate(asset.content, 160)}
                  </p>

                  {/* Tags */}
                  {asset.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {asset.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background: "#F8FAFB",
                            color: "#6B7280",
                            border: "1px solid #e5eaf0",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Download Link */}
                  {asset.fileUrl && (
                    <a
                      href={asset.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold mt-auto pt-3 hover:opacity-80 transition-opacity"
                      style={{
                        color: "#D4AF37",
                        borderTop: "1px solid #e5eaf0",
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      Download
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        className="mt-auto py-6"
        style={{ borderTop: "1px solid #e5eaf0", background: "#fff" }}
      >
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: "#0F2744" }}
            >
              <span className="text-white text-[10px] font-bold">C</span>
            </div>
            <span className="text-xs font-semibold" style={{ color: "#0F2744" }}>
              Consult For Africa
            </span>
          </div>
          <p className="text-[11px] text-gray-400">
            &copy; {new Date().getFullYear()} Consult For Africa. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
