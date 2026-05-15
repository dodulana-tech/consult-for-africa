import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import TopBar from "@/components/platform/TopBar";
import { ArrowLeft, Users, MapPin, Database } from "lucide-react";

export const dynamic = "force-dynamic";

const ALLOWED = ["DIRECTOR", "PARTNER", "ADMIN"];
const PAGE_SIZE = 50;

const SEED_EMAIL_PATTERNS = [
  "system@cadrehealth",
  "system@consultforafrica",
  "noreply@",
];

function isSeedContributor(email: string | null): boolean {
  if (!email) return true;
  const e = email.toLowerCase();
  return SEED_EMAIL_PATTERNS.some((p) => e.includes(p));
}

export default async function SalaryReportsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; cadre?: string; state?: string; source?: string; q?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if (!ALLOWED.includes(session.user.role)) redirect("/dashboard");

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1") || 1);
  const cadreFilter = params.cadre || undefined;
  const stateFilter = params.state || undefined;
  const sourceFilter = params.source || undefined; // 'real' or 'seed'
  const search = params.q?.trim() || undefined;

  const where: Record<string, unknown> = {};
  if (cadreFilter) where.cadre = cadreFilter;
  if (stateFilter) where.state = stateFilter;
  if (search) {
    where.OR = [
      { role: { contains: search, mode: "insensitive" } },
      { professional: { firstName: { contains: search, mode: "insensitive" } } },
      { professional: { lastName: { contains: search, mode: "insensitive" } } },
      { professional: { email: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [
    allReports,
    totalCount,
    byCadre,
    byState,
    distinctContributors,
    professionalsCount,
  ] = await Promise.all([
    prisma.cadreSalaryReport.findMany({
      where,
      orderBy: { reportedAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: {
        professional: { select: { id: true, firstName: true, lastName: true, email: true, accountStatus: true } },
      },
    }),
    prisma.cadreSalaryReport.count({ where }),
    prisma.cadreSalaryReport.groupBy({ by: ["cadre"], _count: true, orderBy: { _count: { cadre: "desc" } } }),
    prisma.cadreSalaryReport.groupBy({ by: ["state"], _count: true, orderBy: { _count: { state: "desc" } }, take: 12 }),
    prisma.cadreSalaryReport.groupBy({ by: ["professionalId"], _count: true }),
    prisma.cadreProfessional.count(),
  ]);

  // Compute seed vs real (in current page result + total)
  let seedTotal = 0;
  let realTotal = 0;
  // Quick: count seed by querying distinct contributors and classifying
  const contributorIds = distinctContributors.map((c) => c.professionalId).filter(Boolean) as string[];
  const contributors = contributorIds.length > 0
    ? await prisma.cadreProfessional.findMany({
        where: { id: { in: contributorIds } },
        select: { id: true, email: true, firstName: true, lastName: true },
      })
    : [];
  const seedContributorIds = new Set(contributors.filter((c) => isSeedContributor(c.email)).map((c) => c.id));
  for (const dc of distinctContributors) {
    if (seedContributorIds.has(dc.professionalId)) seedTotal += dc._count;
    else realTotal += dc._count;
  }
  const realContributors = contributors.filter((c) => !isSeedContributor(c.email));

  // Filter by source filter applied to the displayed page
  const reportsForPage = (sourceFilter === "real"
    ? allReports.filter((r) => r.professional && !seedContributorIds.has(r.professional.id))
    : sourceFilter === "seed"
    ? allReports.filter((r) => r.professional && seedContributorIds.has(r.professional.id))
    : allReports);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  function fmt(n: number | string | null | undefined): string {
    if (n == null) return "—";
    return "NGN" + Number(n).toLocaleString();
  }

  function buildHref(updates: Record<string, string | undefined>): string {
    const next = new URLSearchParams();
    if (cadreFilter && !("cadre" in updates)) next.set("cadre", cadreFilter);
    if (stateFilter && !("state" in updates)) next.set("state", stateFilter);
    if (sourceFilter && !("source" in updates)) next.set("source", sourceFilter);
    if (search && !("q" in updates)) next.set("q", search);
    for (const [k, v] of Object.entries(updates)) {
      if (v) next.set(k, v);
    }
    const qs = next.toString();
    return qs ? `/admin/cadrehealth/salary-reports?${qs}` : "/admin/cadrehealth/salary-reports";
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar
        title="Salary Reports"
        subtitle={`${totalCount} reports from ${distinctContributors.length} contributors · ${realTotal} real, ${seedTotal} seed`}
      />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl space-y-4">
          <Link href="/admin/cadrehealth" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft size={13} /> Back to CadreHealth
          </Link>

          {/* Source health summary */}
          <div className="rounded-2xl bg-white p-5" style={{ border: "1px solid #e5eaf0" }}>
            <div className="flex items-center gap-2 mb-3">
              <Database size={14} className="text-gray-400" />
              <h2 className="text-sm font-bold" style={{ color: "#0F2744" }}>Data health</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label="Real contributions" value={realTotal} accent="#065F46" suffix={`${realContributors.length} member${realContributors.length === 1 ? "" : "s"}`} />
              <Stat label="Seed data" value={seedTotal} accent="#92400E" suffix="from import" />
              <Stat label="Member contribution rate" value={`${professionalsCount > 0 ? Math.round((realContributors.length / professionalsCount) * 1000) / 10 : 0}%`} accent="#1E40AF" suffix={`${realContributors.length}/${professionalsCount} members`} />
              <Stat label="Cadres covered" value={byCadre.length} accent="#5B21B6" suffix="of 18 cadres" />
            </div>
            {realTotal === 0 && (
              <p className="text-xs text-amber-700 mt-3 p-2 rounded-lg" style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
                Zero real member salary contributions yet. The salary map shows seed data only.
                Push members to share via the dashboard SalaryMapUnlock card to start building organic data.
              </p>
            )}
          </div>

          {/* Filters */}
          <div className="rounded-xl bg-white p-4" style={{ border: "1px solid #e5eaf0" }}>
            <form className="flex items-center gap-2 flex-wrap" method="GET">
              <input
                name="q"
                type="text"
                placeholder="Search role, name, email..."
                defaultValue={search ?? ""}
                className="rounded-lg border px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
                style={{ borderColor: "#e5eaf0", width: "220px" }}
              />
              <select name="cadre" defaultValue={cadreFilter ?? ""} className="rounded-lg border px-2 py-1.5 text-xs focus:outline-none" style={{ borderColor: "#e5eaf0" }}>
                <option value="">All cadres</option>
                {byCadre.map((g) => (
                  <option key={g.cadre} value={g.cadre}>{g.cadre.replace(/_/g, " ")} ({g._count})</option>
                ))}
              </select>
              <select name="state" defaultValue={stateFilter ?? ""} className="rounded-lg border px-2 py-1.5 text-xs focus:outline-none" style={{ borderColor: "#e5eaf0" }}>
                <option value="">All states</option>
                {byState.map((s) => (
                  <option key={s.state ?? "null"} value={s.state ?? ""}>{s.state ?? "(no state)"} ({s._count})</option>
                ))}
              </select>
              <select name="source" defaultValue={sourceFilter ?? ""} className="rounded-lg border px-2 py-1.5 text-xs focus:outline-none" style={{ borderColor: "#e5eaf0" }}>
                <option value="">All sources</option>
                <option value="real">Real members only</option>
                <option value="seed">Seed data only</option>
              </select>
              <button type="submit" className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{ background: "#0B3C5D" }}>
                Filter
              </button>
              {(cadreFilter || stateFilter || sourceFilter || search) && (
                <Link href="/admin/cadrehealth/salary-reports" className="text-xs text-gray-400 hover:text-gray-600">
                  Clear
                </Link>
              )}
            </form>
          </div>

          {/* Table */}
          <div className="rounded-xl bg-white overflow-hidden" style={{ border: "1px solid #e5eaf0" }}>
            {reportsForPage.length === 0 ? (
              <div className="p-12 text-center text-sm text-gray-400">No reports match these filters.</div>
            ) : (
              <table className="w-full text-sm">
                <thead style={{ background: "#F9FAFB", borderBottom: "1px solid #e5eaf0" }}>
                  <tr>
                    <Th>Date</Th>
                    <Th>Contributor</Th>
                    <Th>Cadre</Th>
                    <Th>Role</Th>
                    <Th>Location</Th>
                    <Th>Base</Th>
                    <Th>Take-home</Th>
                    <Th>Source</Th>
                  </tr>
                </thead>
                <tbody>
                  {reportsForPage.map((r) => {
                    const isSeed = r.professional && seedContributorIds.has(r.professional.id);
                    return (
                      <tr key={r.id} className="hover:bg-gray-50" style={{ borderBottom: "1px solid #F3F4F6" }}>
                        <td className="px-4 py-2.5 text-xs text-gray-500">{r.reportedAt?.toISOString().slice(0,10) ?? "—"}</td>
                        <td className="px-4 py-2.5">
                          {r.professional ? (
                            <Link href={`/admin/cadrehealth/${r.professional.id}`} className="text-xs font-medium hover:underline" style={{ color: "#0B3C5D" }}>
                              {r.professional.firstName} {r.professional.lastName}
                            </Link>
                          ) : (
                            <span className="text-xs text-gray-400">(deleted)</span>
                          )}
                          {r.professional?.email && <p className="text-[10px] text-gray-400">{r.professional.email}</p>}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-gray-700">{r.cadre.replace(/_/g, " ")}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-700">{r.role ?? "—"}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-500 flex items-center gap-1"><MapPin size={9} /> {r.state ?? "—"}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-700">{fmt(r.baseSalary != null ? Number(r.baseSalary) : null)}</td>
                        <td className="px-4 py-2.5 text-xs font-semibold" style={{ color: "#0F2744" }}>{fmt(r.totalMonthlyTakeHome != null ? Number(r.totalMonthlyTakeHome) : null)}</td>
                        <td className="px-4 py-2.5">
                          {isSeed ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "#FEF3C7", color: "#92400E" }}>SEED</span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "#D1FAE5", color: "#065F46" }}>MEMBER</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: "#F3F4F6" }}>
                <p className="text-xs text-gray-400">
                  Page {page} of {totalPages} · showing {reportsForPage.length} of {totalCount}
                </p>
                <div className="flex items-center gap-1">
                  {page > 1 && (
                    <Link href={buildHref({ page: String(page - 1) })} className="rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-gray-50" style={{ border: "1px solid #e5eaf0", color: "#6B7280" }}>
                      Previous
                    </Link>
                  )}
                  {page < totalPages && (
                    <Link href={buildHref({ page: String(page + 1) })} className="rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-gray-50" style={{ border: "1px solid #e5eaf0", color: "#6B7280" }}>
                      Next
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">{children}</th>;
}

function Stat({ label, value, accent, suffix }: { label: string; value: number | string; accent: string; suffix?: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">{label}</p>
      <p className="mt-1 text-xl font-bold" style={{ color: accent }}>{value}</p>
      {suffix && <p className="text-[10px] text-gray-400 mt-0.5">{suffix}</p>}
    </div>
  );
}
