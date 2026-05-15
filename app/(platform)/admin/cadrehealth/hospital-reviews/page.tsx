import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import TopBar from "@/components/platform/TopBar";
import { ArrowLeft, MapPin, Star, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

const ALLOWED = ["DIRECTOR", "PARTNER", "ADMIN"];
const PAGE_SIZE = 30;

export default async function HospitalReviewsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; facilityId?: string; q?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if (!ALLOWED.includes(session.user.role)) redirect("/dashboard");

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1") || 1);
  const facilityFilter = params.facilityId || undefined;
  const search = params.q?.trim() || undefined;

  const where: Record<string, unknown> = {};
  if (facilityFilter) where.facilityId = facilityFilter;
  if (search) {
    where.OR = [
      { pros: { contains: search, mode: "insensitive" } },
      { cons: { contains: search, mode: "insensitive" } },
      { bestThing: { contains: search, mode: "insensitive" } },
      { worstThing: { contains: search, mode: "insensitive" } },
      { facility: { name: { contains: search, mode: "insensitive" } } },
      { professional: { firstName: { contains: search, mode: "insensitive" } } },
      { professional: { lastName: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [reviews, totalCount, byFacility] = await Promise.all([
    prisma.cadreFacilityReview.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: {
        facility: { select: { id: true, name: true, slug: true, state: true } },
        professional: { select: { id: true, firstName: true, lastName: true, email: true, cadre: true } },
      },
    }),
    prisma.cadreFacilityReview.count({ where }),
    prisma.cadreFacilityReview.groupBy({ by: ["facilityId"], _count: true, orderBy: { _count: { facilityId: "desc" } }, take: 20 }),
  ]);

  // Resolve facility names for the filter dropdown
  const facilityIds = byFacility.map((f) => f.facilityId);
  const facilities = facilityIds.length > 0
    ? await prisma.cadreFacility.findMany({
        where: { id: { in: facilityIds } },
        select: { id: true, name: true },
      })
    : [];
  const facilityById = new Map(facilities.map((f) => [f.id, f.name]));

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar title="Hospital Reviews" subtitle={`${totalCount} review${totalCount === 1 ? "" : "s"} across ${facilities.length} hospital${facilities.length === 1 ? "" : "s"}`} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl space-y-4">
          <Link href="/admin/cadrehealth" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft size={13} /> Back to CadreHealth
          </Link>

          {totalCount === 0 && (
            <div className="rounded-2xl p-6 flex items-start gap-3" style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
              <AlertCircle size={16} className="shrink-0 mt-0.5" style={{ color: "#92400E" }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: "#92400E" }}>No hospital reviews yet</p>
                <p className="text-xs text-amber-700 mt-1">
                  Members can write a review of their current workplace from the dashboard once they have a currentFacility on file.
                  The HospitalReviewUnlock card on each member&apos;s dashboard prompts them. Once at least 5 reviews exist for a hospital,
                  the &quot;Hospital spotlight&quot; section of the weekly digest will start surfacing them.
                </p>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="rounded-xl bg-white p-4" style={{ border: "1px solid #e5eaf0" }}>
            <form className="flex items-center gap-2 flex-wrap" method="GET">
              <input
                name="q"
                type="text"
                placeholder="Search facility, reviewer, content..."
                defaultValue={search ?? ""}
                className="rounded-lg border px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
                style={{ borderColor: "#e5eaf0", width: "240px" }}
              />
              <select name="facilityId" defaultValue={facilityFilter ?? ""} className="rounded-lg border px-2 py-1.5 text-xs focus:outline-none" style={{ borderColor: "#e5eaf0" }}>
                <option value="">All facilities</option>
                {byFacility.map((f) => (
                  <option key={f.facilityId} value={f.facilityId}>{facilityById.get(f.facilityId) ?? "(unknown)"} ({f._count})</option>
                ))}
              </select>
              <button type="submit" className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{ background: "#0B3C5D" }}>Filter</button>
              {(facilityFilter || search) && (
                <Link href="/admin/cadrehealth/hospital-reviews" className="text-xs text-gray-400 hover:text-gray-600">Clear</Link>
              )}
            </form>
          </div>

          {/* List */}
          <div className="space-y-3">
            {reviews.map((r) => {
              const stars = "★".repeat(r.overallRating) + "☆".repeat(5 - r.overallRating);
              return (
                <div key={r.id} className="rounded-xl bg-white p-4" style={{ border: "1px solid #e5eaf0" }}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      {r.facility ? (
                        <Link href={`/oncadre/hospitals/${r.facility.slug}`} target="_blank" className="text-sm font-semibold hover:underline" style={{ color: "#0F2744" }}>
                          {r.facility.name}
                        </Link>
                      ) : (
                        <p className="text-sm font-semibold" style={{ color: "#0F2744" }}>(no facility)</p>
                      )}
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                        {r.facility?.state && <span className="flex items-center gap-1"><MapPin size={9} /> {r.facility.state}</span>}
                        <span>{r.createdAt.toISOString().slice(0,10)}</span>
                        {r.professional && (
                          <Link href={`/admin/cadrehealth/${r.professional.id}`} className="hover:underline">
                            {r.professional.firstName} {r.professional.lastName} ({r.professional.cadre.replace(/_/g, " ")})
                          </Link>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold flex items-center gap-1" style={{ color: "#D97706" }}>
                        <Star size={12} className="fill-current" /> {r.overallRating}/5
                      </p>
                    </div>
                  </div>
                  {(r.pros || r.bestThing) && (
                    <div className="mb-1">
                      <p className="text-[10px] uppercase tracking-wider font-semibold text-emerald-600">Pros</p>
                      <p className="text-xs text-gray-600 mt-0.5">{r.pros ?? r.bestThing}</p>
                    </div>
                  )}
                  {(r.cons || r.worstThing) && (
                    <div className="mt-2">
                      <p className="text-[10px] uppercase tracking-wider font-semibold text-red-600">Cons</p>
                      <p className="text-xs text-gray-600 mt-0.5">{r.cons ?? r.worstThing}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
              <div className="flex items-center gap-1">
                {page > 1 && (
                  <Link href={`?page=${page-1}${search ? `&q=${encodeURIComponent(search)}` : ""}${facilityFilter ? `&facilityId=${facilityFilter}` : ""}`} className="rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-gray-50" style={{ border: "1px solid #e5eaf0", color: "#6B7280" }}>
                    Previous
                  </Link>
                )}
                {page < totalPages && (
                  <Link href={`?page=${page+1}${search ? `&q=${encodeURIComponent(search)}` : ""}${facilityFilter ? `&facilityId=${facilityFilter}` : ""}`} className="rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-gray-50" style={{ border: "1px solid #e5eaf0", color: "#6B7280" }}>
                    Next
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
