import { auth } from "@/auth";
import { redirect } from "next/navigation";
import TopBar from "@/components/platform/TopBar";
import ProposalGenerator from "@/components/platform/ProposalGenerator";
import { Sparkles } from "lucide-react";

export default async function ProposalsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const canAccess = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canAccess) redirect("/dashboard");

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar
        title="AI Proposal Generator"
        subtitle="Generate 80% complete proposals in minutes"
      />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl">
          {/* Intro card */}
          <div
            className="rounded-xl p-4 mb-6 flex items-start gap-3"
            style={{ background: "#F0F4FF", border: "1px solid #C7D7FF" }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "#0F2744" }}
            >
              <Sparkles size={14} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">AI-Powered Proposal Generation</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Enter discovery call notes and client context. Claude will generate a complete proposal draft in under 20 seconds. You review, customize, and send.
              </p>
            </div>
          </div>

          <ProposalGenerator />
        </div>
      </main>
    </div>
  );
}
