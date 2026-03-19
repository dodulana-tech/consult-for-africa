import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TopBar from "@/components/platform/TopBar";
import Link from "next/link";
import MaarovaOrgCreateForm from "./MaarovaOrgCreateForm";

const TYPE_LABELS: Record<string, string> = {
  private_hospital: "Private Hospital",
  hospital_group: "Hospital Group",
  government: "Government",
  ngo: "NGO",
};

const STREAM_LABELS: Record<string, string> = {
  RECRUITMENT: "Recruitment",
  DEVELOPMENT: "Development",
  INTELLIGENCE: "Intelligence",
};

const STREAM_STYLES: Record<string, { bg: string; color: string }> = {
  RECRUITMENT: { bg: "#DBEAFE", color: "#1E40AF" },
  DEVELOPMENT: { bg: "#D1FAE5", color: "#065F46" },
  INTELLIGENCE: { bg: "#FEF3C7", color: "#92400E" },
};

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
                    className="hover:bg-gray-50 transition-colors"
                    style={{ borderBottom: "1px solid #F3F4F6" }}
                  >
                    <td colSpan={8} className="p-0">
                      <Link
                        href={`/admin/maarova/organisations/${org.id}`}
                        className="grid items-center text-sm no-underline"
                        style={{ gridTemplateColumns: "2fr 1.2fr 1fr 1.2fr 0.7fr 1fr 0.8fr 1fr" }}
                      >
                        <span className="px-5 py-3 font-medium" style={{ color: "#0F2744" }}>
                          {org.name}
                        </span>
                        <span className="px-5 py-3 text-gray-600">
                          {TYPE_LABELS[org.type] ?? org.type}
                        </span>
                        <span className="px-5 py-3 text-gray-600">{org.country}</span>
                        <span className="px-5 py-3">
                          <span
                            className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                            style={STREAM_STYLES[org.stream] ?? { bg: "#F3F4F6", color: "#6B7280" }}
                          >
                            {STREAM_LABELS[org.stream] ?? org.stream}
                          </span>
                        </span>
                        <span className="px-5 py-3 text-gray-600">{org._count.users}</span>
                        <span className="px-5 py-3 text-gray-600">
                          {org.usedAssessments} / {org.maxAssessments}
                        </span>
                        <span className="px-5 py-3">
                          <span
                            className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                            style={{
                              background: org.isActive ? "#D1FAE5" : "#FEE2E2",
                              color: org.isActive ? "#065F46" : "#991B1B",
                            }}
                          >
                            {org.isActive ? "Active" : "Inactive"}
                          </span>
                        </span>
                        <span className="px-5 py-3 text-gray-500">
                          {org.createdAt.toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </Link>
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
