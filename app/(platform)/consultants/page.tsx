import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/platform/TopBar";
import StatusBadge from "@/components/platform/StatusBadge";
import { MapPin, Star, Users, ChevronRight } from "lucide-react";
import { formatCompactCurrency } from "@/lib/utils";


export default async function ConsultantsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  // Consultants can only view their own profile
  if (session.user.role === "CONSULTANT") {
    const profile = await prisma.consultantProfile.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    });
    redirect(profile ? `/consultants/${profile.id}` : "/dashboard");
  }

  const consultants = await prisma.consultantProfile.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      _count: { select: { ratings: true } },
    },
    orderBy: [{ tier: "asc" }, { averageRating: "desc" }],
  });

  const available = consultants.filter((c) => c.availabilityStatus === "AVAILABLE").length;
  const partial = consultants.filter((c) => c.availabilityStatus === "PARTIALLY_AVAILABLE").length;
  const diaspora = consultants.filter((c) => c.isDiaspora).length;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar title="Consultant Network" subtitle={`${consultants.length} consultants`} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Available Now", value: available, color: "#10B981" },
              { label: "Partially Available", value: partial, color: "#F59E0B" },
              { label: "Diaspora", value: diaspora, color: "#3B82F6" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl p-4 bg-white" style={{ border: "1px solid #e5eaf0" }}>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                <div className="h-1 rounded-full mt-2 w-8" style={{ background: s.color }} />
              </div>
            ))}
          </div>

          {/* Consultant cards */}
          <div className="space-y-3">
            {consultants.map((c) => (
              <Link
                key={c.id}
                href={`/consultants/${c.user.id}`}
                className="flex items-start gap-4 rounded-xl p-5 group transition-shadow hover:shadow-sm bg-white"
                style={{ border: "1px solid #e5eaf0" }}
              >
                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
                  style={{ background: "#0F2744" }}
                >
                  {c.user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 text-sm group-hover:text-[#0F2744]">
                          {c.user.name}
                        </p>
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background: c.tier === "ELITE" ? "#FEF3C7" : "#F3F4F6",
                            color: c.tier === "ELITE" ? "#D97706" : "#6B7280",
                          }}
                        >
                          {c.tier}
                        </span>
                        <StatusBadge status={c.availabilityStatus} />
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{c.title}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-gray-800">
                        {c.hourlyRateUSD
                          ? `$${Number(c.hourlyRateUSD)}/hr`
                          : c.monthlyRateNGN
                          ? `${formatCompactCurrency(Number(c.monthlyRateNGN), "NGN")}/mo`
                          : "-"}
                      </p>
                      {c.isDiaspora && (
                        <span className="text-[10px] text-blue-500">Diaspora</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-2 flex-wrap text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin size={11} />
                      {c.location}
                    </span>
                    {c.averageRating && (
                      <span className="flex items-center gap-1">
                        <Star size={11} className="text-amber-400" />
                        {Number(c.averageRating).toFixed(1)} ({c._count.ratings} reviews)
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users size={11} />
                      {c.totalProjects} projects
                    </span>
                    <span>{c.yearsExperience}yr exp</span>
                  </div>

                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {c.expertiseAreas.slice(0, 4).map((area) => (
                      <span
                        key={area}
                        className="px-2 py-0.5 rounded-full text-[10px]"
                        style={{ background: "#F3F4F6", color: "#6B7280" }}
                      >
                        {area.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()).replace(/Em As Service/, "EM-as-a-Service")}
                      </span>
                    ))}
                    {c.expertiseAreas.length > 4 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] text-gray-400">
                        +{c.expertiseAreas.length - 4}
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight size={14} className="text-gray-300 mt-1 shrink-0 group-hover:text-gray-500 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
