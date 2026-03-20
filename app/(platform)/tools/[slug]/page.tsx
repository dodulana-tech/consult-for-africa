import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import TopBar from "@/components/platform/TopBar";
import IssueTreeTool from "@/components/platform/tools/IssueTreeTool";
import FishboneTool from "@/components/platform/tools/FishboneTool";
import RACITool from "@/components/platform/tools/RACITool";
import HypothesisTrackerTool from "@/components/platform/tools/HypothesisTrackerTool";
import CashFlowTool from "@/components/platform/tools/CashFlowTool";
import PLTemplateTool from "@/components/platform/tools/PLTemplateTool";
import FinancialRatioTool from "@/components/platform/tools/FinancialRatioTool";
import BalancedScorecardTool from "@/components/platform/tools/BalancedScorecardTool";
import ERRCGridTool from "@/components/platform/tools/ERRCGridTool";
import OKRPlannerTool from "@/components/platform/tools/OKRPlannerTool";
import FMEATool from "@/components/platform/tools/FMEATool";
import RCAKitTool from "@/components/platform/tools/RCAKitTool";
import ClinicalAuditTool from "@/components/platform/tools/ClinicalAuditTool";
import DenialDashboardTool from "@/components/platform/tools/DenialDashboardTool";
import PayerMixTool from "@/components/platform/tools/PayerMixTool";
import CollectionsTrackerTool from "@/components/platform/tools/CollectionsTrackerTool";
import StakeholderMapTool from "@/components/platform/tools/StakeholderMapTool";
import LogframeTool from "@/components/platform/tools/LogframeTool";

const TOOLS: Record<string, { name: string; subtitle: string; component: string }> = {
  "issue-tree": { name: "Issue Tree Builder", subtitle: "Structured Problem Decomposition", component: "issue-tree" },
  "fishbone": { name: "Fishbone Diagram", subtitle: "Root Cause Analysis", component: "fishbone" },
  "raci-builder": { name: "RACI Matrix Builder", subtitle: "Role Assignment", component: "raci" },
  "hypothesis-tracker": { name: "Hypothesis Tracker", subtitle: "Evidence-Based Analysis", component: "hypothesis-tracker" },
  "13-week-cashflow": { name: "13-Week Cash Flow Model", subtitle: "Financial Stabilization", component: "cashflow" },
  "pl-template": { name: "Hospital P&L Template", subtitle: "Financial Analysis", component: "pl" },
  "financial-ratios": { name: "Financial Ratio Calculator", subtitle: "Benchmarking", component: "ratios" },
  "bsc-builder": { name: "Balanced Scorecard Builder", subtitle: "Strategy Design", component: "bsc" },
  "errc-grid": { name: "ERRC Grid (Blue Ocean)", subtitle: "Innovation Strategy", component: "errc" },
  "okr-planner": { name: "OKR Planning Sheet", subtitle: "Objective Setting", component: "okr" },
  "fmea-worksheet": { name: "FMEA Worksheet", subtitle: "Risk Analysis", component: "fmea" },
  "rca-kit": { name: "RCA Investigation Kit", subtitle: "Root Cause Analysis", component: "rca" },
  "audit-cycle": { name: "Clinical Audit Cycle", subtitle: "Quality Improvement", component: "audit" },
  "denial-dashboard": { name: "Denial Dashboard", subtitle: "Claims Management", component: "denial" },
  "payer-mix": { name: "Payer Mix Analyzer", subtitle: "Revenue Analysis", component: "payer" },
  "collections-tracker": { name: "Collections Aging Tracker", subtitle: "Receivables Management", component: "collections" },
  "stakeholder-map": { name: "Stakeholder Mapping Grid", subtitle: "Engagement Planning", component: "stakeholder" },
  "logframe": { name: "Logframe Builder", subtitle: "M&E Framework", component: "logframe" },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const COMPONENTS: Record<string, React.ComponentType<any>> = {
  "issue-tree": IssueTreeTool,
  "fishbone": FishboneTool,
  "raci": RACITool,
  "hypothesis-tracker": HypothesisTrackerTool,
  "cashflow": CashFlowTool,
  "pl": PLTemplateTool,
  "ratios": FinancialRatioTool,
  "bsc": BalancedScorecardTool,
  "errc": ERRCGridTool,
  "okr": OKRPlannerTool,
  "fmea": FMEATool,
  "rca": RCAKitTool,
  "audit": ClinicalAuditTool,
  "denial": DenialDashboardTool,
  "payer": PayerMixTool,
  "collections": CollectionsTrackerTool,
  "stakeholder": StakeholderMapTool,
  "logframe": LogframeTool,
};

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");

  const { slug } = await params;
  const tool = TOOLS[slug];
  if (!tool) notFound();

  const Component = COMPONENTS[tool.component];

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar title={tool.name} subtitle={tool.subtitle} backHref="/tools" />
      <main className="flex-1 overflow-y-auto">
        {Component ? <Component /> : <div className="p-6 text-center text-gray-400">Tool not found</div>}
      </main>
    </div>
  );
}
