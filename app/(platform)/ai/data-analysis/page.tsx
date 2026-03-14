import { auth } from "@/auth";
import { redirect } from "next/navigation";
import TopBar from "@/components/platform/TopBar";
import DataAnalysisTool from "@/components/platform/DataAnalysisTool";
import { BarChart2 } from "lucide-react";

interface PageProps {
  searchParams: Promise<{ project?: string }>;
}

export default async function DataAnalysisPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const params = await searchParams;
  const projectId = params.project;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar
        title="Data Analysis"
        subtitle="Upload hospital data for AI analysis"
        backHref="/ai"
      />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl space-y-5">
          {/* Intro card */}
          <div
            className="rounded-xl p-4 flex items-start gap-3"
            style={{ background: "#F0F4FF", border: "1px solid #C7D7FF" }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "#0F2744" }}
            >
              <BarChart2 size={14} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                AI-Powered Hospital Data Analysis
              </p>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                Upload your Excel or CSV file and Claude will identify revenue leakage, operational inefficiencies, and staffing issues. You get specific recommendations with Nigerian healthcare context, including NHIS and HMO benchmarks.
              </p>
              <p className="text-xs text-gray-400 mt-1.5">
                Supports Excel (.xlsx, .xls) and CSV files up to 5MB.
              </p>
            </div>
          </div>

          {/* Tool */}
          <DataAnalysisTool projectId={projectId} />
        </div>
      </main>
    </div>
  );
}
