import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TopBar from "@/components/platform/TopBar";
import Link from "next/link";
import MaarovaOrgCreateForm from "./MaarovaOrgCreateForm";

export default async function MaarovaOrganisationsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const isAdmin = ["PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) redirect("/dashboard");

  const organisations = await prisma.maarovaOrganisation.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { users: true } },
    },
  });

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar
        title="Maarova Organisations"
        subtitle={`${organisations.length} organisations`}
        backHref="/admin/maarova"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Create Organisation Form */}
        <MaarovaOrgCreateForm />

        {/* Organisations Table */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: "#fff", border: "1px solid #e5eaf0" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#F9FAFB" }}>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Name
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Type
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Country
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Stream
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Users
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Assessments
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody>
                {organisations.map((org) => (
                  <tr
                    key={org.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    style={{ borderBottom: "1px solid #F3F4F6" }}
                  >
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/maarova/organisations/${org.id}`}
                        className="font-medium hover:underline"
                        style={{ color: "#0F2744" }}
                      >
                        {org.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{org.type}</td>
                    <td className="px-5 py-3 text-gray-600">{org.country}</td>
                    <td className="px-5 py-3">
                      <span
                        className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                          background:
                            org.stream === "RECRUITMENT"
                              ? "#DBEAFE"
                              : org.stream === "DEVELOPMENT"
                              ? "#D1FAE5"
                              : "#FEF3C7",
                          color:
                            org.stream === "RECRUITMENT"
                              ? "#1E40AF"
                              : org.stream === "DEVELOPMENT"
                              ? "#065F46"
                              : "#92400E",
                        }}
                      >
                        {org.stream}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{org._count.users}</td>
                    <td className="px-5 py-3 text-gray-600">
                      {org.usedAssessments} / {org.maxAssessments}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                          background: org.isActive ? "#D1FAE5" : "#FEE2E2",
                          color: org.isActive ? "#065F46" : "#991B1B",
                        }}
                      >
                        {org.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {org.createdAt.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
                {organisations.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-center text-gray-400">
                      No organisations yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
