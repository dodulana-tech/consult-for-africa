import { getAgentSession } from "@/lib/agentPortalAuth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProfileEditForm from "./ProfileEditForm";

export default async function AgentProfilePage() {
  const session = await getAgentSession();
  if (!session) redirect("/agent/login");

  const agent = await prisma.salesAgent.findUnique({
    where: { id: session.sub },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      company: true,
      state: true,
      industries: true,
      salesExperience: true,
      bio: true,
      bankName: true,
      accountNumber: true,
      accountName: true,
      status: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });

  if (!agent) redirect("/agent/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0F2744" }}>
          Profile
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Manage your agent profile and banking details
        </p>
      </div>

      <ProfileEditForm
        agent={{
          firstName: agent.firstName,
          lastName: agent.lastName,
          email: agent.email,
          phone: agent.phone,
          company: agent.company,
          state: agent.state,
          industries: agent.industries,
          salesExperience: agent.salesExperience,
          bio: agent.bio,
          bankName: agent.bankName,
          accountNumber: agent.accountNumber,
          accountName: agent.accountName,
        }}
      />

      {/* Account Status (read-only) */}
      <div className="rounded-2xl bg-white p-6 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
        <h2 className="mb-4 text-base font-bold tracking-tight" style={{ color: "#0F2744" }}>
          Account
        </h2>
        <dl className="space-y-3 text-sm">
          <Row label="Status" value={agent.status} />
          <Row
            label="Member since"
            value={agent.createdAt.toLocaleDateString("en-NG", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          />
          <Row
            label="Last login"
            value={
              agent.lastLoginAt
                ? agent.lastLoginAt.toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "Never"
            }
          />
        </dl>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <dt className="w-36 shrink-0 text-sm font-medium text-gray-400">{label}</dt>
      <dd className="text-sm text-gray-900">{value}</dd>
    </div>
  );
}
