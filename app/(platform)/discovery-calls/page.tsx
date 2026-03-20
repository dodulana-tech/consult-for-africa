import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TopBar from "@/components/platform/TopBar";
import Link from "next/link";

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  SCHEDULED: { bg: "bg-blue-50", text: "text-blue-700" },
  IN_PROGRESS: { bg: "bg-amber-50", text: "text-amber-700" },
  COMPLETED: { bg: "bg-green-50", text: "text-green-700" },
  NO_SHOW: { bg: "bg-red-50", text: "text-red-700" },
  CANCELLED: { bg: "bg-gray-100", text: "text-gray-500" },
};

export default async function DiscoveryCallsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const canAccess = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canAccess) redirect("/dashboard");

  const calls = await prisma.discoveryCall.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      conductedBy: { select: { name: true } },
      convertedToClient: { select: { id: true, name: true } },
    },
  });

  const active = calls.filter((c) => !["COMPLETED", "CANCELLED", "NO_SHOW"].includes(c.status));
  const completed = calls.filter((c) => c.status === "COMPLETED");

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar
        title="Discovery Calls"
        subtitle={`${active.length} active, ${completed.length} completed`}
        action={
          <Link
            href="/discovery-calls/new"
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: "#0F2744" }}
          >
            New Discovery Call
          </Link>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        {calls.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500">No discovery calls yet.</p>
            <Link href="/discovery-calls/new" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
              Schedule your first discovery call
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#e5eaf0" }}>
            <table className="w-full">
              <thead>
                <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500" style={{ background: "#F9FAFB" }}>
                  <th className="px-4 py-3">Organisation</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Service Lines</th>
                  <th className="px-4 py-3">Conducted By</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {calls.map((call) => {
                  const st = STATUS_STYLES[call.status] ?? STATUS_STYLES.SCHEDULED;
                  return (
                    <tr key={call.id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: "#F3F4F6" }}>
                      <td className="px-4 py-3">
                        <Link href={`/discovery-calls/${call.id}`} className="hover:underline">
                          <p className="text-sm font-medium" style={{ color: "#0F2744" }}>{call.organizationName}</p>
                          {call.organizationType && (
                            <p className="text-[10px] text-gray-400 capitalize">{call.organizationType.replace(/_/g, " ")}</p>
                          )}
                        </Link>
                        {call.convertedToClient && (
                          <Link href={`/clients/${call.convertedToClient.id}`} className="text-[10px] text-green-600 hover:underline">
                            Converted to {call.convertedToClient.name}
                          </Link>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-700">{call.contactName}</p>
                        {call.contactEmail && <p className="text-[10px] text-gray-400">{call.contactEmail}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>
                          {call.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {call.aiServiceLineMatch.slice(0, 2).map((sl, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 truncate max-w-[120px]">
                              {sl.split(" ").slice(0, 3).join(" ")}
                            </span>
                          ))}
                          {call.aiServiceLineMatch.length === 0 && (
                            <span className="text-[10px] text-gray-300">Not analyzed</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500">{call.conductedBy.name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-400">
                          {(call.conductedAt ?? call.scheduledAt ?? call.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
