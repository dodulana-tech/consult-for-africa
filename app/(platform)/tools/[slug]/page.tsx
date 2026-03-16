import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import TopBar from "@/components/platform/TopBar";
import IssueTreeTool from "@/components/platform/tools/IssueTreeTool";
import FishboneTool from "@/components/platform/tools/FishboneTool";
import RACITool from "@/components/platform/tools/RACITool";
import GenericTool from "@/components/platform/tools/GenericTool";

const TOOLS: Record<string, { name: string; subtitle: string; component: string }> = {
  "issue-tree": { name: "Issue Tree Builder", subtitle: "Structured Problem Decomposition", component: "issue-tree" },
  "fishbone": { name: "Fishbone Diagram", subtitle: "Root Cause Analysis", component: "fishbone" },
  "raci-builder": { name: "RACI Matrix Builder", subtitle: "Role Assignment", component: "raci" },
  "hypothesis-tracker": { name: "Hypothesis Tracker", subtitle: "Evidence-Based Analysis", component: "generic" },
  "13-week-cashflow": { name: "13-Week Cash Flow Model", subtitle: "Financial Stabilization", component: "generic" },
  "pl-template": { name: "Hospital P&L Template", subtitle: "Financial Analysis", component: "generic" },
  "financial-ratios": { name: "Financial Ratio Calculator", subtitle: "Benchmarking", component: "generic" },
  "bsc-builder": { name: "Balanced Scorecard Builder", subtitle: "Strategy Design", component: "generic" },
  "errc-grid": { name: "ERRC Grid (Blue Ocean)", subtitle: "Innovation Strategy", component: "generic" },
  "okr-planner": { name: "OKR Planning Sheet", subtitle: "Objective Setting", component: "generic" },
  "fmea-worksheet": { name: "FMEA Worksheet", subtitle: "Risk Analysis", component: "generic" },
  "rca-kit": { name: "RCA Investigation Kit", subtitle: "Root Cause Analysis", component: "generic" },
  "audit-cycle": { name: "Clinical Audit Cycle", subtitle: "Quality Improvement", component: "generic" },
  "denial-dashboard": { name: "Denial Dashboard", subtitle: "Claims Management", component: "generic" },
  "payer-mix": { name: "Payer Mix Analyzer", subtitle: "Revenue Analysis", component: "generic" },
  "collections-tracker": { name: "Collections Aging Tracker", subtitle: "Receivables Management", component: "generic" },
  "stakeholder-map": { name: "Stakeholder Mapping Grid", subtitle: "Engagement Planning", component: "generic" },
  "logframe": { name: "Logframe Builder", subtitle: "M&E Framework", component: "generic" },
};

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");

  const { slug } = await params;
  const tool = TOOLS[slug];
  if (!tool) notFound();

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar title={tool.name} subtitle={tool.subtitle} backHref="/tools" />
      <main className="flex-1 overflow-y-auto">
        {tool.component === "issue-tree" && <IssueTreeTool />}
        {tool.component === "fishbone" && <FishboneTool />}
        {tool.component === "raci" && <RACITool />}
        {tool.component === "generic" && <GenericTool name={tool.name} subtitle={tool.subtitle} />}
      </main>
    </div>
  );
}
