import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, Building2 } from "lucide-react";
import { EmployerResetButton } from "@/components/cadrehealth/EmployerResetButton";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["PARTNER", "ADMIN", "DIRECTOR"];
const PAGE_SIZE = 25;

export default async function CadreEmployersAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if (!ALLOWED_ROLES.includes(session.user.role)) redirect("/dashboard");

  const params = await searchParams;
  const search = params.q?.trim() || undefined;
  const page = Math.max(1, parseInt(params.page ?? "1") || 1);

  const where = search
    ? {
        OR: [
          { contactEmail: { contains: search, mode: "insensitive" as const } },
          { contactName: { contains: search, mode: "insensitive" as const } },
          { companyName: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [employers, total] = await Promise.all([
    prisma.cadreEmployerAccount.findMany({
      where,
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        companyName: true,
        contactName: true,
        contactEmail: true,
        contactPhone: true,
        isVerified: true,
        createdAt: true,
        facility: { select: { name: true, slug: true } },
      },
    }),
    prisma.cadreEmployerAccount.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

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
          Employer Accounts
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {total} employer account{total === 1 ? "" : "s"}. Use the reset button to send a password reset link or copy it for manual delivery.
        </p>
      </div>

      <form className="flex gap-2" method="GET">
        <input
          type="text"
          name="q"
          defaultValue={search ?? ""}
          placeholder="Search by company, contact name, or email"
          className="flex-1 rounded-xl bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B3C5D]/20"
          style={{ border: "1px solid #E8EBF0" }}
        />
        <button
          type="submit"
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ background: "#0B3C5D" }}
        >
          Search
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm" style={{ borderColor: "#E8EBF0" }}>
        {employers.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-gray-500">
              {search ? "No employers match this search." : "No employer accounts yet."}
            </p>
          </div>
        ) : (
          <ul className="divide-y" style={{ borderColor: "#F3F4F6" }}>
            {employers.map((e) => (
              <li key={e.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 shrink-0 text-gray-400" />
                    <p className="text-sm font-semibold" style={{ color: "#0F2744" }}>
                      {e.companyName}
                    </p>
                    {e.isVerified && (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-700">{e.contactName}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {e.contactEmail}
                    </span>
                    {e.contactPhone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {e.contactPhone}
                      </span>
                    )}
                    {e.facility && (
                      <span>
                        Facility: <strong>{e.facility.name}</strong>
                      </span>
                    )}
                    <span>
                      Joined{" "}
                      {e.createdAt.toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
                <div className="shrink-0">
                  <EmployerResetButton employerId={e.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <p>
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/admin/cadre-employers?${new URLSearchParams({
                  ...(search ? { q: search } : {}),
                  page: String(page - 1),
                })}`}
                className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
                style={{ borderColor: "#E8EBF0", color: "#0B3C5D" }}
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin/cadre-employers?${new URLSearchParams({
                  ...(search ? { q: search } : {}),
                  page: String(page + 1),
                })}`}
                className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
                style={{ borderColor: "#E8EBF0", color: "#0B3C5D" }}
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
