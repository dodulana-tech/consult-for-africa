import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, ShieldCheck } from "lucide-react";
import { DeleteDuplicateButton } from "./DeleteDuplicateButton";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["PARTNER", "ADMIN", "ASSOCIATE_DIRECTOR", "DIRECTOR"];

interface DuplicateRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  cadre: string;
  state: string | null;
  accountStatus: string;
  createdAt: Date;
  emailVerified: boolean;
  cvFileUrl: string | null;
  name_key: string;
}

export default async function CadreDuplicatesPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!ALLOWED_ROLES.includes(session.user.role)) redirect("/dashboard");

  // Find every CadreProfessional whose normalised name appears more than once.
  // We pull all duplicate rows in one go and group in JS so we can show each
  // record's individual identifiers (email, cadre, claim status) side-by-side.
  const rows = await prisma.$queryRaw<DuplicateRow[]>`
    WITH dupe_names AS (
      SELECT LOWER(TRIM("firstName" || ' ' || "lastName")) AS name_key
      FROM "CadreProfessional"
      WHERE "firstName" IS NOT NULL AND "lastName" IS NOT NULL
      GROUP BY LOWER(TRIM("firstName" || ' ' || "lastName"))
      HAVING COUNT(*) > 1
    )
    SELECT
      cp.id,
      cp."firstName",
      cp."lastName",
      cp.email,
      cp.cadre,
      cp.state,
      cp."accountStatus",
      cp."createdAt",
      cp."emailVerified",
      cp."cvFileUrl",
      LOWER(TRIM(cp."firstName" || ' ' || cp."lastName")) AS name_key
    FROM "CadreProfessional" cp
    WHERE LOWER(TRIM(cp."firstName" || ' ' || cp."lastName")) IN (SELECT name_key FROM dupe_names)
    ORDER BY name_key, cp."createdAt" ASC, cp.id ASC
  `;

  // Group by name_key
  const groups = new Map<string, DuplicateRow[]>();
  for (const row of rows) {
    const list = groups.get(row.name_key) ?? [];
    list.push(row);
    groups.set(row.name_key, list);
  }
  const grouped = Array.from(groups.entries())
    .map(([key, items]) => ({ key, items }))
    .sort((a, b) => b.items.length - a.items.length);

  const totalDupeRecords = rows.length;
  const totalGroups = grouped.length;
  const excessRows = rows.length - grouped.length; // how many would need to go for full dedup

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/cadrehealth"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-gray-400 transition hover:text-gray-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          CadreHealth Dashboard
        </Link>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0F2744" }}>
          Duplicate Professionals
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {totalGroups === 0 ? (
            "No duplicates detected."
          ) : (
            <>
              {totalGroups} name{totalGroups === 1 ? "" : "s"} appear on more than one record (
              {totalDupeRecords} records total, {excessRows} excess).
            </>
          )}
        </p>
      </div>

      {totalGroups === 0 ? (
        <div className="rounded-2xl border bg-white p-10 text-center shadow-sm" style={{ borderColor: "#E8EBF0" }}>
          <ShieldCheck className="mx-auto h-10 w-10 text-emerald-500" />
          <p className="mt-3 text-sm text-gray-500">No name collisions found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(({ key, items }) => (
            <div
              key={key}
              className="overflow-hidden rounded-2xl border bg-white shadow-sm"
              style={{ borderColor: "#E8EBF0" }}
            >
              <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: "#F3F4F6" }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#0F2744" }}>
                    {items[0].firstName} {items[0].lastName}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {items.length} records share this name
                  </p>
                </div>
                {items.some((r) => r.emailVerified || r.cvFileUrl) && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                    <AlertTriangle className="h-3 w-3" />
                    At least one is claimed or has a CV
                  </span>
                )}
              </div>
              <ul className="divide-y" style={{ borderColor: "#F3F4F6" }}>
                {items.map((r) => {
                  const isClaimed = r.emailVerified || !!r.cvFileUrl;
                  return (
                    <li key={r.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <Link
                            href={`/admin/cadrehealth/${r.id}`}
                            className="font-medium hover:underline"
                            style={{ color: "#0B3C5D" }}
                          >
                            {r.email}
                          </Link>
                          {r.emailVerified && (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                              Verified
                            </span>
                          )}
                          {r.cvFileUrl && (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                              Has CV
                            </span>
                          )}
                          <span
                            className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600"
                          >
                            {r.accountStatus.replace(/_/g, " ")}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                          <span>{r.cadre.replace(/_/g, " ")}</span>
                          {r.state && <span>{r.state}</span>}
                          <span>
                            Joined{" "}
                            {new Date(r.createdAt).toLocaleDateString("en-NG", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        <DeleteDuplicateButton
                          professionalId={r.id}
                          name={`${r.firstName} ${r.lastName}`}
                          email={r.email}
                          unsafe={isClaimed}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
