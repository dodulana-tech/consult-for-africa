import { getAgentSession } from "@/lib/agentPortalAuth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function AgentProfilePage() {
  const session = await getAgentSession();
  if (!session) redirect("/agent/login");

  const agent = await prisma.salesAgent.findUnique({
    where: { id: session.sub },
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal Info */}
        <div className="rounded-2xl bg-white p-6 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
          <h2 className="mb-4 text-base font-bold tracking-tight" style={{ color: "#0F2744" }}>
            Personal Information
          </h2>
          <dl className="space-y-3 text-sm">
            <Row label="Name" value={`${agent.firstName} ${agent.lastName}`} />
            <Row label="Email" value={agent.email} />
            <Row label="Phone" value={agent.phone} />
            <Row label="Company" value={agent.company || "Not set"} />
            <Row label="Title" value={agent.title || "Not set"} />
            <Row label="State" value={agent.state || "Not set"} />
            <Row label="Experience" value={agent.salesExperience ? `${agent.salesExperience} years` : "Not set"} />
            <Row label="Industries" value={agent.industries.length > 0 ? agent.industries.join(", ") : "Not set"} />
          </dl>
        </div>

        {/* Bank Details */}
        <div className="rounded-2xl bg-white p-6 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
          <h2 className="mb-4 text-base font-bold tracking-tight" style={{ color: "#0F2744" }}>
            Bank Details
          </h2>
          <p className="mb-4 text-xs text-gray-400">
            Commission payouts will be sent to this account.
          </p>
          <dl className="space-y-3 text-sm">
            <Row label="Bank" value={agent.bankName || "Not provided"} />
            <Row label="Account Number" value={agent.accountNumber || "Not provided"} />
            <Row label="Account Name" value={agent.accountName || "Not provided"} />
          </dl>
          {(!agent.bankName || !agent.accountNumber) && (
            <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-700">
              Please add your bank details to receive commission payouts. Contact your C4A account manager.
            </div>
          )}
        </div>

        {/* Account Status */}
        <div className="rounded-2xl bg-white p-6 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
          <h2 className="mb-4 text-base font-bold tracking-tight" style={{ color: "#0F2744" }}>
            Account
          </h2>
          <dl className="space-y-3 text-sm">
            <Row label="Status" value={agent.status} />
            <Row label="Member since" value={agent.createdAt.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })} />
            <Row label="Last login" value={agent.lastLoginAt ? agent.lastLoginAt.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "Never"} />
          </dl>
        </div>
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
