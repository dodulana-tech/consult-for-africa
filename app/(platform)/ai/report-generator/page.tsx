import { auth } from "@/auth";
import { redirect } from "next/navigation";
import TopBar from "@/components/platform/TopBar";
import ReportGenerator from "@/components/platform/ReportGenerator";
import { FileEdit, Info } from "lucide-react";

export default async function ReportGeneratorPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const allowedRoles = ["CONSULTANT", "ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"];
  if (!allowedRoles.includes(session.user.role)) redirect("/dashboard");

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar
        title="Report Generator"
        subtitle="Imara-assisted consulting reports"
        backHref="/ai"
      />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl space-y-5">
          {/* Intro card */}
          <div
            className="rounded-xl p-4 flex items-start gap-3"
            style={{ background: "#F0F4FF", border: "1px solid #C7D7FF" }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "#0F2744" }}
            >
              <FileEdit size={14} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Report Generation with Imara</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                Turn your findings into a polished consulting report in 30 seconds. Enter your raw notes and recommendations, and Imara structures them into an executive-ready document with Nigerian healthcare context, implementation roadmap, and severity-rated findings.
              </p>
            </div>
          </div>

          <ReportGenerator />

          {/* Quality note */}
          <div
            className="rounded-xl p-4 flex items-start gap-2.5"
            style={{ background: "#F9FAFB", border: "1px solid #e5eaf0" }}
          >
            <Info size={13} className="text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-gray-700 mb-0.5">Getting the best results</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Best results come from detailed findings. The more specific your input, the better the output. Include numbers, percentages, and named departments or processes where possible.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
