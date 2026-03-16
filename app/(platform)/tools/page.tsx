import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TopBar from "@/components/platform/TopBar";
import Link from "next/link";
import {
  Wrench,
  FileSpreadsheet,
  GitBranch,
  Target,
  BarChart3,
  ClipboardCheck,
  Calculator,
  Layout,
  Search,
} from "lucide-react";

const TOOL_CATEGORIES = [
  {
    name: "Problem Structuring",
    icon: GitBranch,
    color: "#0B3C5D",
    tools: [
      { slug: "issue-tree", name: "Issue Tree Builder", description: "Build MECE issue trees to decompose complex consulting problems into structured, actionable components." },
      { slug: "fishbone", name: "Fishbone Diagram", description: "Create Ishikawa cause-and-effect diagrams to identify root causes of operational problems in healthcare settings." },
      { slug: "hypothesis-tracker", name: "Hypothesis Tracker", description: "Track and prioritize hypotheses throughout your engagement, linking evidence to conclusions." },
    ],
  },
  {
    name: "Financial Analysis",
    icon: Calculator,
    color: "#D97706",
    tools: [
      { slug: "13-week-cashflow", name: "13-Week Cash Flow Model", description: "Build a rolling 13-week cash flow projection for hospitals in financial distress." },
      { slug: "pl-template", name: "Hospital P&L Template", description: "Standardized profit and loss template adapted for Nigerian hospital accounting." },
      { slug: "financial-ratios", name: "Financial Ratio Calculator", description: "Calculate key hospital financial ratios with automatic benchmarking against African healthcare standards." },
    ],
  },
  {
    name: "Strategy & Planning",
    icon: Target,
    color: "#059669",
    tools: [
      { slug: "bsc-builder", name: "Balanced Scorecard Builder", description: "Design a Balanced Scorecard with strategy map for healthcare organizations." },
      { slug: "errc-grid", name: "ERRC Grid (Blue Ocean)", description: "Apply Blue Ocean Strategy's Eliminate-Reduce-Raise-Create grid to healthcare service design." },
      { slug: "okr-planner", name: "OKR Planning Sheet", description: "Define Objectives and Key Results for hospital transformation programmes." },
    ],
  },
  {
    name: "Quality & Governance",
    icon: ClipboardCheck,
    color: "#7C3AED",
    tools: [
      { slug: "fmea-worksheet", name: "FMEA Worksheet", description: "Failure Mode and Effects Analysis for identifying and mitigating clinical risks." },
      { slug: "rca-kit", name: "RCA Investigation Kit", description: "Root Cause Analysis toolkit with 5-Why analysis and corrective action tracking." },
      { slug: "audit-cycle", name: "Clinical Audit Cycle", description: "Run a complete clinical audit cycle from criteria selection to re-audit." },
    ],
  },
  {
    name: "Revenue Cycle",
    icon: BarChart3,
    color: "#DC2626",
    tools: [
      { slug: "denial-dashboard", name: "Denial Dashboard", description: "Track, categorize, and manage insurance claims denials with root cause analysis." },
      { slug: "payer-mix", name: "Payer Mix Analyzer", description: "Analyze your hospital's payer mix distribution and benchmark against optimal ratios." },
      { slug: "collections-tracker", name: "Collections Aging Tracker", description: "Monitor outstanding receivables by aging bucket with automated follow-up scheduling." },
    ],
  },
  {
    name: "Project Management",
    icon: Layout,
    color: "#0F2744",
    tools: [
      { slug: "raci-builder", name: "RACI Matrix Builder", description: "Build Responsible-Accountable-Consulted-Informed matrices for engagement teams." },
      { slug: "stakeholder-map", name: "Stakeholder Mapping Grid", description: "Map stakeholders by influence and interest to guide your engagement approach." },
      { slug: "logframe", name: "Logframe Builder", description: "Create logical frameworks for M&E-driven healthcare programmes." },
    ],
  },
];

export default async function ToolsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  // Count knowledge base assets
  const toolCount = await prisma.knowledgeAsset.count();

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar title="Consulting Tools" subtitle="Interactive templates and frameworks" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl space-y-6">
          {/* Header */}
          <div
            className="rounded-xl p-5 flex items-start gap-4"
            style={{ background: "#0F2744" }}
          >
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Wrench size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">CFA Consulting Toolkit</h2>
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>
                Interactive tools, templates, and frameworks used across CFA engagements.
                {toolCount > 0 && ` ${toolCount} resources available in the Knowledge Base.`}
              </p>
            </div>
          </div>

          {/* Search hint */}
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Search size={12} />
            <span>Looking for a specific template? Check the</span>
            <Link href="/knowledge" className="text-blue-600 hover:underline font-medium">
              Knowledge Base
            </Link>
            <span>for downloadable guides and reference materials.</span>
          </div>

          {/* Tool categories */}
          {TOOL_CATEGORIES.map((cat) => (
            <div key={cat.name}>
              <div className="flex items-center gap-2 mb-3">
                <cat.icon size={15} style={{ color: cat.color }} />
                <h3 className="text-sm font-semibold text-gray-900">{cat.name}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {cat.tools.map((tool) => (
                  <Link
                    key={tool.slug}
                    href={`/tools/${tool.slug}`}
                    className="rounded-xl p-4 bg-white hover:shadow-md transition-shadow group"
                    style={{ border: "1px solid #e5eaf0" }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `${cat.color}10` }}
                      >
                        <FileSpreadsheet size={14} style={{ color: cat.color }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-[#0F2744]">
                          {tool.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                          {tool.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
