import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  CARE_NEED_LABELS,
  ILE_BRAND,
  INTEREST_LABELS,
  RELATIONSHIP_LABELS,
  STATUS_LABELS,
  URGENCY_LABELS,
  URGENCY_RANK,
} from "@/lib/ile";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["ASSOCIATE_DIRECTOR", "DIRECTOR", "PARTNER", "ADMIN"];

const URGENCY_STYLES: Record<string, { bg: string; text: string }> = {
  NOW: { bg: "#FEF2F2", text: "#991B1B" },
  WITHIN_3_MONTHS: { bg: "#FFFBEB", text: "#92400E" },
  WITHIN_6_MONTHS: { bg: "#EFF6FF", text: "#1E40AF" },
  PLANNING_AHEAD: { bg: "#F1F5F9", text: "#475569" },
};

export default async function IleWaitlistAdminPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!ALLOWED_ROLES.includes(session.user.role)) redirect("/dashboard");

  const entries = await prisma.ileWaitlistEntry.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  // The four numbers that actually matter for the occupancy plan. Everything
  // else on this page is detail behind them.
  const total = entries.length;
  const diaspora = entries.filter((e) => e.basedOutsideNigeria).length;
  const residential = entries.filter(
    (e) => e.interest === "RESIDENTIAL" || e.interest === "BOTH",
  ).length;
  const urgent = entries.filter(
    (e) => e.urgency === "NOW" || e.urgency === "WITHIN_3_MONTHS",
  ).length;
  const referred = entries.filter((e) => e.referredByCode).length;

  const pct = (n: number) => (total === 0 ? "0%" : `${Math.round((n / total) * 100)}%`);

  // Worked in urgency order, then newest first inside each band. A family that
  // needs help now is a different conversation from one planning two years out.
  const sorted = [...entries].sort((a, b) => {
    const rank = URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency];
    if (rank !== 0) return rank;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  // Where the demand actually concentrates. This decides which part of Lagos
  // the home goes in, so it is on the page rather than in a query somebody has
  // to remember to run.
  const cityCounts = new Map<string, number>();
  for (const e of entries) {
    const city = (e.careCity ?? "").trim();
    if (!city) continue;
    const key = city.toLowerCase();
    cityCounts.set(key, (cityCounts.get(key) ?? 0) + 1);
  }
  const topCities = [...cityCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: ILE_BRAND.ink }}>
            ilé waiting list
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            The occupancy plan for the home. Worked in urgency order.
          </p>
        </div>
        <a
          href="/ile"
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          View the public page
        </a>
      </div>

      {/* Headline numbers */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="On the list" value={String(total)} />
        <Stat label="Diaspora" value={`${diaspora}`} sub={pct(diaspora)} accent={ILE_BRAND.green} />
        <Stat
          label="Want a place in the home"
          value={`${residential}`}
          sub={pct(residential)}
          accent={ILE_BRAND.ink}
        />
        <Stat label="Urgent" value={`${urgent}`} sub={pct(urgent)} accent="#B45309" />
        <Stat label="Came by referral" value={`${referred}`} sub={pct(referred)} accent={ILE_BRAND.amber} />
      </div>

      {topCities.length > 0 && (
        <div className="mt-4 rounded-xl border bg-white p-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Where the care is needed
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {topCities.map(([city, count]) => (
              <span
                key={city}
                className="rounded-full px-3 py-1 text-xs font-medium"
                style={{ background: "#F1F5F9", color: "#334155" }}
              >
                <span className="capitalize">{city}</span>
                <span className="ml-1.5 font-bold" style={{ color: ILE_BRAND.ink }}>
                  {count}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* The list */}
      {total === 0 ? (
        <div className="mt-6 rounded-xl border bg-white p-12 text-center">
          <p className="text-sm text-gray-500">
            Nobody has joined yet. The list is live at{" "}
            <a href="/ile" className="font-medium underline" style={{ color: ILE_BRAND.green }}>
              /ile
            </a>
            .
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border bg-white">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3 font-semibold">Family</th>
                <th className="px-4 py-3 font-semibold">Where</th>
                <th className="px-4 py-3 font-semibold">Wants</th>
                <th className="px-4 py-3 font-semibold">Needs</th>
                <th className="px-4 py-3 font-semibold">Timing</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((e) => {
                const urgencyStyle = URGENCY_STYLES[e.urgency] ?? URGENCY_STYLES.PLANNING_AHEAD;
                return (
                  <tr key={e.id} className="border-b last:border-0 align-top">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-gray-900">{e.fullName}</div>
                      <a
                        href={`mailto:${e.email}`}
                        className="text-xs underline"
                        style={{ color: ILE_BRAND.green }}
                      >
                        {e.email}
                      </a>
                      {e.phone && <div className="text-xs text-gray-500">{e.phone}</div>}
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {e.foundingFamily && (
                          <span
                            className="rounded px-1.5 py-0.5 text-[10px] font-bold"
                            style={{ background: "rgba(212,175,55,0.16)", color: "#8A6D1F" }}
                          >
                            FOUNDING
                          </span>
                        )}
                        {e.referredByCode && (
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-600">
                            REF {e.referredByCode}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div
                        className="text-xs font-bold"
                        style={{ color: e.basedOutsideNigeria ? ILE_BRAND.green : "#6B7280" }}
                      >
                        {e.basedOutsideNigeria ? "DIASPORA" : "LOCAL"}
                      </div>
                      {e.basedCountry && (
                        <div className="text-xs text-gray-600">{e.basedCountry}</div>
                      )}
                      {e.careCity && (
                        <div className="mt-1 text-xs text-gray-500">
                          Care in <span className="font-medium text-gray-700">{e.careCity}</span>
                        </div>
                      )}
                      <div className="mt-1 text-xs text-gray-400">
                        {RELATIONSHIP_LABELS[e.relationship]}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className="text-xs font-medium"
                        style={{
                          color:
                            e.interest === "RESIDENTIAL" || e.interest === "BOTH"
                              ? ILE_BRAND.ink
                              : "#6B7280",
                        }}
                      >
                        {INTEREST_LABELS[e.interest]}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {e.careNeeds.length === 0 ? (
                        <span className="text-xs text-gray-400">Not said</span>
                      ) : (
                        <ul className="space-y-0.5">
                          {e.careNeeds.map((n) => (
                            <li key={n} className="text-xs text-gray-600">
                              {CARE_NEED_LABELS[n]}
                            </li>
                          ))}
                        </ul>
                      )}
                      {e.notes && (
                        <p className="mt-2 max-w-xs border-l-2 pl-2 text-xs italic text-gray-500" style={{ borderColor: ILE_BRAND.amber }}>
                          {e.notes.length > 180 ? `${e.notes.slice(0, 180)}...` : e.notes}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className="whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={{ background: urgencyStyle.bg, color: urgencyStyle.text }}
                      >
                        {URGENCY_LABELS[e.urgency]}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-xs font-medium text-gray-700">
                        {STATUS_LABELS[e.status]}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500">
                      {e.createdAt.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <div className="mt-1.5 flex items-baseline gap-2">
        <span className="text-2xl font-bold" style={{ color: accent ?? "#111827" }}>
          {value}
        </span>
        {sub && <span className="text-xs font-medium text-gray-400">{sub}</span>}
      </div>
    </div>
  );
}
